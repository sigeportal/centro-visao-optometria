unit Agenda.Service;

interface

uses
  System.JSON,
  System.SysUtils,
  Models.Clinica;

type
  EAgendaValidacao = class(Exception);

  TAgendaService = class
  private
    procedure GarantirTabelas;
    procedure MigrarStatusFilaEspera;
    procedure ValidarHorario(const AInicio, AFim: TDateTime);
    procedure ValidarStatus(const AStatus: string);
    procedure ValidarPacienteAtivo(APacienteId: Integer);
    function ObterProfissionalAtivo(AProfissionalId: Integer): string;
    function ObterProcedimentoAtivo(AProcedimentoId: Integer): string;
    procedure ValidarParceriaAtiva(AParceriaId: Integer);
    procedure ValidarConflito(AIdIgnorar, AProfissionalId: Integer; const AProfissional: string; const AInicio, AFim: TDateTime);
    function BuscarAgendamento(AId: Integer): TModelAgendamento;
    function NormalizarStatus(const AStatus: string): string;
    function TransicaoStatusPermitida(const AAtual, ANovo: string): Boolean;
  public
    function Listar(const AInicio, AFim, AProfissionalId, AStatus: string): TJSONArray;
    function ObterPorId(AId: Integer): TJSONObject;
    function Criar(AData: TJSONObject): Integer;
    procedure Atualizar(AId: Integer; AData: TJSONObject);
    procedure AlterarStatus(AId: Integer; const AStatus: string);
    procedure Cancelar(AId: Integer);
    function ListarFilaEspera: TJSONArray;
    function ListarProfissionais: TJSONArray;
    function ListarParcerias: TJSONArray;
    function ListarProcedimentos: TJSONArray;
    function LancarPagamento(AId: Integer; AData: TJSONObject): TJSONObject;
  end;

implementation

uses
  System.DateUtils,
  System.StrUtils,
  FireDAC.Comp.Client,
  UnitDatabase,
  Dataset.JSON.Utils,
  Parceria.Service,
  Procedimento.Service;

function JsonString(AData: TJSONObject; const AName, ADefault: string): string;
var
  LValue: TJSONValue;
begin
  Result := ADefault;
  if not Assigned(AData) then
    Exit;

  LValue := AData.GetValue(AName);
  if Assigned(LValue) and not (LValue is TJSONNull) then
    Result := LValue.Value;
end;

function JsonInteger(AData: TJSONObject; const AName: string; ADefault: Integer): Integer;
var
  LText: string;
begin
  LText := JsonString(AData, AName, '');
  if LText = '' then
    Result := ADefault
  else
    Result := StrToIntDef(LText, ADefault);
end;

function JsonCurrency(AData: TJSONObject; const AName: string; ADefault: Currency): Currency;
var
  LText: string;
begin
  LText := StringReplace(JsonString(AData, AName, ''), '.', FormatSettings.DecimalSeparator, [rfReplaceAll]);
  if LText = '' then
    Result := ADefault
  else
    Result := StrToCurrDef(LText, ADefault);
end;

function MontarDataHora(const AData, AHora: string): TDateTime;
var
  LISO: string;
begin
  if Trim(AData) = '' then
    raise EAgendaValidacao.Create('Data e obrigatoria');

  if Trim(AHora) = '' then
    raise EAgendaValidacao.Create('Hora e obrigatoria');

  LISO := Copy(Trim(AData), 1, 10) + 'T' + Trim(AHora);
  if not TryISO8601ToDate(LISO, Result) then
    raise EAgendaValidacao.Create('Data ou hora invalida');
end;

procedure TAgendaService.GarantirTabelas;
var
  LAgendamento: TModelAgendamento;
  LFinanceiro: TModelFinanceiroLancamento;
begin
  LAgendamento := TModelAgendamento.Create(TDatabase.Connection);
  try
    LAgendamento.CriaTabela;
  finally
    LAgendamento.Free;
  end;

  LFinanceiro := TModelFinanceiroLancamento.Create(TDatabase.Connection);
  try
    LFinanceiro.CriaTabela;
  finally
    LFinanceiro.Free;
  end;

  MigrarStatusFilaEspera;
end;

procedure TAgendaService.MigrarStatusFilaEspera;
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
  LIniciouTransacao: Boolean;
begin
  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LIniciouTransacao := not LConn.InTransaction;
      if LIniciouTransacao then
        LConn.StartTransaction;
      try
        LQuery.SQL.Text :=
          'UPDATE AGENDAMENTOS SET AGD_STATUS = ''fila_espera'' ' +
          'WHERE LOWER(TRIM(AGD_STATUS)) = ''aguardando_atendimento''';
        LQuery.ExecSQL;
        if LIniciouTransacao then
          LConn.Commit;
      except
        if LIniciouTransacao and LConn.InTransaction then
          LConn.Rollback;
        raise;
      end;
    finally
      LQuery.Free;
    end;
  finally
    TDatabase.Connection.Disconnected(LIndiceConexao);
  end;
end;

procedure TAgendaService.ValidarHorario(const AInicio, AFim: TDateTime);
begin
  if AFim <= AInicio then
    raise EAgendaValidacao.Create('Horario fim deve ser maior que horario inicio');
end;

function TAgendaService.NormalizarStatus(const AStatus: string): string;
begin
  Result := LowerCase(Trim(AStatus));
  if Result = '' then
    Result := 'agendada';
  if Result = 'agendado' then
    Result := 'agendada';
  if Result = 'confirmado' then
    Result := 'confirmada';
  if Result = 'realizado' then
    Result := 'realizada';
  if Result = 'cancelado' then
    Result := 'cancelada';
  if Result = 'aguardando_atendimento' then
    Result := 'fila_espera';
end;

procedure TAgendaService.ValidarStatus(const AStatus: string);
begin
  if not MatchText(NormalizarStatus(AStatus), [
    'fila_espera', 'agendada', 'confirmada', 'em_atendimento',
    'realizada', 'atendida', 'cancelada', 'faltou'
  ]) then
    raise EAgendaValidacao.Create('Status invalido para agendamento');
end;

function TAgendaService.TransicaoStatusPermitida(const AAtual, ANovo: string): Boolean;
var
  LAtual: string;
  LNovo: string;
begin
  LAtual := NormalizarStatus(AAtual);
  LNovo := NormalizarStatus(ANovo);

  if LAtual = LNovo then
    Exit(True);

  if LAtual = 'fila_espera' then
    Exit(LNovo = 'agendada');

  if LAtual = 'agendada' then
    Exit(MatchText(LNovo, ['confirmada', 'fila_espera', 'cancelada', 'faltou']));

  if LAtual = 'confirmada' then
    Exit(MatchText(LNovo, ['fila_espera', 'cancelada', 'faltou']));

  Result := False;
end;

procedure TAgendaService.ValidarPacienteAtivo(APacienteId: Integer);
var
  LPaciente: TModelPaciente;
begin
  if APacienteId <= 0 then
    raise EAgendaValidacao.Create('Paciente e obrigatorio');

  LPaciente := TModelPaciente.Create(TDatabase.Connection);
  try
    LPaciente.BuscaDadosTabela(APacienteId);
    if (LPaciente.Id <= 0) or (LPaciente.Ativo = 0) then
      raise EAgendaValidacao.Create('Paciente ativo e obrigatorio para agendar');
  finally
    LPaciente.Free;
  end;
end;

function TAgendaService.ObterProfissionalAtivo(AProfissionalId: Integer): string;
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
begin
  if AProfissionalId <= 0 then
    raise EAgendaValidacao.Create('Profissional e obrigatorio');

  Result := '';
  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LQuery.SQL.Text :=
        'SELECT FUN_NOME FROM FUNCIONARIOS ' +
        'WHERE FUN_CODIGO = :ID AND UPPER(TRIM(COALESCE(FUN_ESTADO, ''''))) = ''ATIVO'' ' +
        'AND COALESCE(FUN_ATENDE, 0) = 1';
      LQuery.ParamByName('ID').AsInteger := AProfissionalId;
      LQuery.Open;
      if LQuery.IsEmpty then
        raise EAgendaValidacao.Create('Profissional ativo e habilitado para atendimento nao encontrado');
      Result := Trim(LQuery.FieldByName('FUN_NOME').AsString);
    finally
      LQuery.Free;
    end;
  finally
    TDatabase.Connection.Disconnected(LIndiceConexao);
  end;
end;

function TAgendaService.ObterProcedimentoAtivo(
  AProcedimentoId: Integer): string;
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
begin
  if AProcedimentoId <= 0 then
    raise EAgendaValidacao.Create('Procedimento e obrigatorio');
  Result := '';
  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LQuery.SQL.Text := 'SELECT PRO_NOME FROM PROCEDIMENTOS ' +
        'WHERE PRO_ID = :ID AND PRO_ATIVO = 1';
      LQuery.ParamByName('ID').AsInteger := AProcedimentoId;
      LQuery.Open;
      if LQuery.IsEmpty then
        raise EAgendaValidacao.Create('Procedimento ativo nao encontrado');
      Result := Trim(LQuery.FieldByName('PRO_NOME').AsString);
    finally
      LQuery.Free;
    end;
  finally
    TDatabase.Connection.Disconnected(LIndiceConexao);
  end;
end;

procedure TAgendaService.ValidarParceriaAtiva(AParceriaId: Integer);
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
begin
  if AParceriaId <= 0 then
    Exit;
  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LQuery.SQL.Text := 'SELECT PAR_ID FROM PARCERIAS ' +
        'WHERE PAR_ID = :ID AND PAR_ATIVO = 1';
      LQuery.ParamByName('ID').AsInteger := AParceriaId;
      LQuery.Open;
      if LQuery.IsEmpty then
        raise EAgendaValidacao.Create('Parceria ativa nao encontrada');
    finally
      LQuery.Free;
    end;
  finally
    TDatabase.Connection.Disconnected(LIndiceConexao);
  end;
end;

procedure TAgendaService.ValidarConflito(AIdIgnorar, AProfissionalId: Integer; const AProfissional: string; const AInicio, AFim: TDateTime);
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
begin
  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LQuery.SQL.Text :=
        'SELECT AGD_ID FROM AGENDAMENTOS ' +
        'WHERE AGD_STATUS NOT IN (''cancelada'', ''faltou'', ''fila_espera'') ' +
        '  AND AGD_ID <> :ID_IGNORAR ' +
        '  AND (:INICIO < AGD_FIM AND :FIM > AGD_INICIO) ' +
        '  AND ((:PROF_ID > 0 AND AGD_PROFISSIONAL_ID = :PROF_ID) ' +
        '       OR (:PROF_ID = 0 AND UPPER(AGD_PROFISSIONAL) = UPPER(:PROF)))';
      LQuery.ParamByName('ID_IGNORAR').AsInteger := AIdIgnorar;
      LQuery.ParamByName('INICIO').AsDateTime := AInicio;
      LQuery.ParamByName('FIM').AsDateTime := AFim;
      LQuery.ParamByName('PROF_ID').AsInteger := AProfissionalId;
      LQuery.ParamByName('PROF').AsString := AProfissional;
      LQuery.Open;

      if not LQuery.IsEmpty then
        raise EAgendaValidacao.Create('Conflito de horario para o profissional informado');
    finally
      LQuery.Free;
    end;
  finally
    TDatabase.Connection.Disconnected(LIndiceConexao);
  end;
end;

function TAgendaService.BuscarAgendamento(AId: Integer): TModelAgendamento;
begin
  Result := TModelAgendamento.Create(TDatabase.Connection);
  Result.BuscaDadosTabela(AId);
  if Result.Id <= 0 then
  begin
    Result.Free;
    raise EAgendaValidacao.Create('Agendamento nao encontrado');
  end;
end;

function TAgendaService.Listar(const AInicio, AFim, AProfissionalId, AStatus: string): TJSONArray;
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
  LWhere: string;
begin
  GarantirTabelas;
  LWhere := ' WHERE 1 = 1 ';

  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;

      if Trim(AInicio) <> '' then
        LWhere := LWhere + ' AND A.AGD_INICIO >= :INICIO ';
      if Trim(AFim) <> '' then
        LWhere := LWhere + ' AND A.AGD_INICIO <= :FIM ';
      if StrToIntDef(AProfissionalId, 0) > 0 then
        LWhere := LWhere + ' AND A.AGD_PROFISSIONAL_ID = :PROFISSIONAL_ID ';
      if Trim(AStatus) <> '' then
        LWhere := LWhere + ' AND A.AGD_STATUS = :STATUS ';

      LQuery.SQL.Text :=
        'SELECT A.AGD_ID AS ID, A.AGD_PACIENTE_ID AS PACIENTE_ID, P.PAC_NOME AS PACIENTE, ' +
        'P.PAC_CELULAR AS PACIENTE_WHATSAPP, P.PAC_DATA_NASCIMENTO AS PACIENTE_NASCIMENTO, ' +
        'A.AGD_PROFISSIONAL_ID AS PROFISSIONAL_ID, A.AGD_PROFISSIONAL AS PROFISSIONAL, ' +
        'A.AGD_PROCEDIMENTO_ID AS PROCEDIMENTO_ID, A.AGD_PROCEDIMENTO AS PROCEDIMENTO, ' +
        'A.AGD_INICIO AS INICIO, A.AGD_FIM AS FIM, A.AGD_STATUS AS STATUS, ' +
        'A.AGD_PRIORIDADE AS PRIORIDADE, A.AGD_PARCERIA_ID AS PARCERIA_ID, PA.PAR_NOME AS PARCERIA, ' +
        'A.AGD_OBSERVACAO AS OBSERVACAO, A.AGD_CRIADO_EM AS CRIADO_EM, A.AGD_CRIADO_POR AS CRIADO_POR ' +
        'FROM AGENDAMENTOS A ' +
        'JOIN PACIENTES P ON P.PAC_ID = A.AGD_PACIENTE_ID ' +
        'LEFT JOIN PARCERIAS PA ON PA.PAR_ID = A.AGD_PARCERIA_ID ' +
        LWhere +
        'ORDER BY A.AGD_INICIO';

      if Trim(AInicio) <> '' then
        LQuery.ParamByName('INICIO').AsDateTime := ISO8601ToDate(AInicio);
      if Trim(AFim) <> '' then
        LQuery.ParamByName('FIM').AsDateTime := ISO8601ToDate(AFim);
      if StrToIntDef(AProfissionalId, 0) > 0 then
        LQuery.ParamByName('PROFISSIONAL_ID').AsInteger := StrToIntDef(AProfissionalId, 0);
      if Trim(AStatus) <> '' then
        LQuery.ParamByName('STATUS').AsString := NormalizarStatus(AStatus);

      LQuery.Open;
      Result := TDatasetJsonUtils.QueryToJSONArray(LQuery);
    finally
      LQuery.Free;
    end;
  finally
    TDatabase.Connection.Disconnected(LIndiceConexao);
  end;
end;

function TAgendaService.ObterPorId(AId: Integer): TJSONObject;
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
  I: Integer;
begin
  Result := nil;
  GarantirTabelas;

  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LQuery.SQL.Text :=
        'SELECT A.AGD_ID AS ID, A.AGD_PACIENTE_ID AS PACIENTE_ID, P.PAC_NOME AS PACIENTE, ' +
        'P.PAC_CELULAR AS PACIENTE_WHATSAPP, P.PAC_DATA_NASCIMENTO AS PACIENTE_NASCIMENTO, ' +
        'A.AGD_PROFISSIONAL_ID AS PROFISSIONAL_ID, A.AGD_PROFISSIONAL AS PROFISSIONAL, ' +
        'A.AGD_PROCEDIMENTO_ID AS PROCEDIMENTO_ID, A.AGD_PROCEDIMENTO AS PROCEDIMENTO, ' +
        'A.AGD_INICIO AS INICIO, A.AGD_FIM AS FIM, A.AGD_STATUS AS STATUS, ' +
        'A.AGD_PRIORIDADE AS PRIORIDADE, A.AGD_PARCERIA_ID AS PARCERIA_ID, PA.PAR_NOME AS PARCERIA, ' +
        'A.AGD_OBSERVACAO AS OBSERVACAO, A.AGD_CRIADO_EM AS CRIADO_EM, A.AGD_CRIADO_POR AS CRIADO_POR ' +
        'FROM AGENDAMENTOS A ' +
        'JOIN PACIENTES P ON P.PAC_ID = A.AGD_PACIENTE_ID ' +
        'LEFT JOIN PARCERIAS PA ON PA.PAR_ID = A.AGD_PARCERIA_ID ' +
        'WHERE A.AGD_ID = :ID';
      LQuery.ParamByName('ID').AsInteger := AId;
      LQuery.Open;

      if not LQuery.IsEmpty then
      begin
        Result := TJSONObject.Create;
        for I := 0 to LQuery.Fields.Count - 1 do
        begin
          if LQuery.Fields[I].IsNull then
            Result.AddPair(LowerCase(LQuery.Fields[I].FieldName), TJSONNull.Create)
          else
            Result.AddPair(LowerCase(LQuery.Fields[I].FieldName), LQuery.Fields[I].AsString);
        end;
      end;
    finally
      LQuery.Free;
    end;
  finally
    TDatabase.Connection.Disconnected(LIndiceConexao);
  end;
end;

function TAgendaService.Criar(AData: TJSONObject): Integer;
var
  LAgendamento: TModelAgendamento;
  LPacienteId, LProfissionalId, LProcedimentoId, LParceriaId: Integer;
  LProfissional, LProcedimento, LData, LHoraInicio, LHoraFim, LStatus: string;
  LInicio, LFim: TDateTime;
begin
  GarantirTabelas;
  LPacienteId := JsonInteger(AData, 'paciente_id', 0);
  LProfissionalId := JsonInteger(AData, 'profissional_id', 0);
  LProfissional := ObterProfissionalAtivo(LProfissionalId);
  LProcedimentoId := JsonInteger(AData, 'procedimento_id', 0);
  LProcedimento := ObterProcedimentoAtivo(LProcedimentoId);
  LParceriaId := JsonInteger(AData, 'parceria_id', 0);
  ValidarParceriaAtiva(LParceriaId);
  LStatus := NormalizarStatus(JsonString(AData, 'status', 'agendada'));

  if not MatchText(LStatus, ['fila_espera', 'agendada']) then
    raise EAgendaValidacao.Create('Novo agendamento deve iniciar como agendada ou fila de espera');

  LData := JsonString(AData, 'data', '');
  LHoraInicio := JsonString(AData, 'hora_inicio', '');
  LHoraFim := JsonString(AData, 'hora_fim', '');
  if (LData <> '') or (LHoraInicio <> '') or (LHoraFim <> '') then
  begin
    LInicio := MontarDataHora(LData, LHoraInicio);
    LFim := MontarDataHora(LData, LHoraFim);
  end
  else
  begin
    if not TryISO8601ToDate(JsonString(AData, 'inicio', ''), LInicio) then
      raise EAgendaValidacao.Create('Inicio invalido. Use formato ISO-8601');
    if not TryISO8601ToDate(JsonString(AData, 'fim', ''), LFim) then
      raise EAgendaValidacao.Create('Fim invalido. Use formato ISO-8601');
  end;

  ValidarStatus(LStatus);
  ValidarHorario(LInicio, LFim);
  ValidarPacienteAtivo(LPacienteId);
  if LStatus <> 'fila_espera' then
    ValidarConflito(0, LProfissionalId, LProfissional, LInicio, LFim);

  LAgendamento := TModelAgendamento.Create(TDatabase.Connection);
  try
    LAgendamento.Id := LAgendamento.GeraCodigo('AGD_ID');
    LAgendamento.PacienteId := LPacienteId;
    LAgendamento.ProfissionalId := LProfissionalId;
    LAgendamento.Profissional := LProfissional;
    LAgendamento.ProcedimentoId := LProcedimentoId;
    LAgendamento.Procedimento := LProcedimento;
    LAgendamento.Inicio := LInicio;
    LAgendamento.Fim := LFim;
    LAgendamento.Status := LStatus;
    LAgendamento.Prioridade := JsonString(AData, 'prioridade', 'normal');
    LAgendamento.ParceriaId := LParceriaId;
    LAgendamento.Observacao := JsonString(AData, 'observacao', '');
    LAgendamento.CriadoEm := Now;
    LAgendamento.CriadoPor := JsonInteger(AData, 'criado_por', 0);
    LAgendamento.SalvaNoBanco(1);
    Result := LAgendamento.Id;
  finally
    LAgendamento.Free;
  end;
end;

procedure TAgendaService.Atualizar(AId: Integer; AData: TJSONObject);
var
  LAgendamento: TModelAgendamento;
  LPacienteId, LProfissionalId, LProcedimentoId, LParceriaId: Integer;
  LProfissional, LProcedimento, LData, LHoraInicio, LHoraFim, LStatus: string;
  LInicio, LFim: TDateTime;
begin
  LAgendamento := BuscarAgendamento(AId);
  try
    LPacienteId := JsonInteger(AData, 'paciente_id', LAgendamento.PacienteId);
    LProfissionalId := JsonInteger(AData, 'profissional_id', LAgendamento.ProfissionalId);
    LProfissional := ObterProfissionalAtivo(LProfissionalId);
    LProcedimentoId := JsonInteger(AData, 'procedimento_id', LAgendamento.ProcedimentoId);
    if LProcedimentoId <> LAgendamento.ProcedimentoId then
      LProcedimento := ObterProcedimentoAtivo(LProcedimentoId)
    else
      LProcedimento := LAgendamento.Procedimento;
    if (LProcedimentoId <= 0) and (Trim(LProcedimento) = '') then
      raise EAgendaValidacao.Create('Procedimento e obrigatorio');
    LParceriaId := JsonInteger(AData, 'parceria_id', LAgendamento.ParceriaId);
    if LParceriaId <> LAgendamento.ParceriaId then
      ValidarParceriaAtiva(LParceriaId);
    LStatus := NormalizarStatus(JsonString(AData, 'status', LAgendamento.Status));

    LData := JsonString(AData, 'data', '');
    LHoraInicio := JsonString(AData, 'hora_inicio', '');
    LHoraFim := JsonString(AData, 'hora_fim', '');
    if (LData <> '') or (LHoraInicio <> '') or (LHoraFim <> '') then
    begin
      LInicio := MontarDataHora(LData, LHoraInicio);
      LFim := MontarDataHora(LData, LHoraFim);
    end
    else
    begin
      if not TryISO8601ToDate(JsonString(AData, 'inicio', DateToISO8601(LAgendamento.Inicio)), LInicio) then
        raise EAgendaValidacao.Create('Inicio invalido. Use formato ISO-8601');
      if not TryISO8601ToDate(JsonString(AData, 'fim', DateToISO8601(LAgendamento.Fim)), LFim) then
        raise EAgendaValidacao.Create('Fim invalido. Use formato ISO-8601');
    end;

    ValidarStatus(LStatus);
    if not TransicaoStatusPermitida(LAgendamento.Status, LStatus) then
      raise EAgendaValidacao.Create('Transicao de status nao permitida');
    ValidarHorario(LInicio, LFim);
    ValidarPacienteAtivo(LPacienteId);
    if LStatus <> 'fila_espera' then
      ValidarConflito(AId, LProfissionalId, LProfissional, LInicio, LFim);

    LAgendamento.PacienteId := LPacienteId;
    LAgendamento.ProfissionalId := LProfissionalId;
    LAgendamento.Profissional := LProfissional;
    LAgendamento.ProcedimentoId := LProcedimentoId;
    LAgendamento.Procedimento := LProcedimento;
    LAgendamento.Inicio := LInicio;
    LAgendamento.Fim := LFim;
    LAgendamento.Status := LStatus;
    LAgendamento.Prioridade := JsonString(AData, 'prioridade', LAgendamento.Prioridade);
    LAgendamento.ParceriaId := LParceriaId;
    LAgendamento.Observacao := JsonString(AData, 'observacao', LAgendamento.Observacao);
    LAgendamento.SalvaNoBanco(1);
  finally
    LAgendamento.Free;
  end;
end;

procedure TAgendaService.AlterarStatus(AId: Integer; const AStatus: string);
var
  LAgendamento: TModelAgendamento;
  LStatus: string;
begin
  LStatus := NormalizarStatus(AStatus);
  ValidarStatus(LStatus);

  LAgendamento := BuscarAgendamento(AId);
  try
    if not TransicaoStatusPermitida(LAgendamento.Status, LStatus) then
      raise EAgendaValidacao.Create('Transicao de status nao permitida');
    LAgendamento.Status := LStatus;
    LAgendamento.SalvaNoBanco(1);
  finally
    LAgendamento.Free;
  end;
end;

procedure TAgendaService.Cancelar(AId: Integer);
begin
  AlterarStatus(AId, 'cancelada');
end;

function TAgendaService.ListarFilaEspera: TJSONArray;
begin
  Result := Listar('', '', '', 'fila_espera');
end;

function TAgendaService.ListarProfissionais: TJSONArray;
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
begin
  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LQuery.SQL.Text :=
        'SELECT FUN_CODIGO AS ID, FUN_NOME AS NOME FROM FUNCIONARIOS ' +
        'WHERE UPPER(TRIM(COALESCE(FUN_ESTADO, ''''))) = ''ATIVO'' ' +
        'AND COALESCE(FUN_ATENDE, 0) = 1 ' +
        'ORDER BY FUN_NOME';
      LQuery.Open;
      Result := TDatasetJsonUtils.QueryToJSONArray(LQuery);
    finally
      LQuery.Free;
    end;
  finally
    TDatabase.Connection.Disconnected(LIndiceConexao);
  end;
end;

function TAgendaService.ListarParcerias: TJSONArray;
begin
  Result := TParceriaService.ListarAtivas;
end;

function TAgendaService.ListarProcedimentos: TJSONArray;
begin
  Result := TProcedimentoService.ListarAtivos;
end;

function TAgendaService.LancarPagamento(AId: Integer; AData: TJSONObject): TJSONObject;
var
  LAgendamento: TModelAgendamento;
  LFinanceiro: TModelFinanceiroLancamento;
begin
  GarantirTabelas;
  LAgendamento := BuscarAgendamento(AId);
  try
    LFinanceiro := TModelFinanceiroLancamento.Create(TDatabase.Connection);
    try
      LFinanceiro.Id := LFinanceiro.GeraCodigo('FIN_ID');
      LFinanceiro.AgendamentoId := AId;
      LFinanceiro.PacienteId := LAgendamento.PacienteId;
      LFinanceiro.Tipo := JsonString(AData, 'tipo', 'receita');
      LFinanceiro.Valor := JsonCurrency(AData, 'valor', 0);
      LFinanceiro.Status := JsonString(AData, 'status', 'pendente');
      LFinanceiro.FormaPagamento := JsonString(AData, 'forma_pagamento', '');
      LFinanceiro.Competencia := DateOf(LAgendamento.Inicio);
      LFinanceiro.Observacoes := JsonString(AData, 'observacoes', 'Lancamento criado pela agenda');
      LFinanceiro.DataCriacao := Now;
      LFinanceiro.SalvaNoBanco(1);

      Result := TJSONObject.Create;
      Result.AddPair('id', TJSONNumber.Create(LFinanceiro.Id));
      Result.AddPair('agendamento_id', TJSONNumber.Create(AId));
      Result.AddPair('status', LFinanceiro.Status);
    finally
      LFinanceiro.Free;
    end;
  finally
    LAgendamento.Free;
  end;
end;

end.
