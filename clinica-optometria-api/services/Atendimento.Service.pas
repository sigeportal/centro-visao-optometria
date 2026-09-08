unit Atendimento.Service;

interface

uses
  System.JSON,
  System.SysUtils,
  FireDAC.Comp.Client;

type
  EAtendimentoValidacao = class(Exception);
  EAtendimentoNaoEncontrado = class(Exception);

  TAtendimentoService = class
  private
    procedure GarantirTabelas;
    procedure SalvarRetorno(AQuery: TFDQuery; AConsultaId, AUsuarioId: Integer;
      const AConsultaData: TDateTime; ADados: TJSONObject);
  public
    constructor Create;
    function Iniciar(AAgendamentoId: Integer; out AStatus: string): Integer;
    procedure Finalizar(AConsultaId, AUsuarioId: Integer; ADados: TJSONObject);
  end;

implementation

uses
  Data.DB,
  FireDAC.Stan.Param,
  System.DateUtils,
  System.StrUtils,
  UnitConnection.Model.Interfaces,
  UnitDatabase,
  Models.Clinica;

const
  STATUS_FILA_ESPERA = 'fila_espera';
  STATUS_EM_ATENDIMENTO = 'em_atendimento';
  STATUS_REALIZADA = 'realizada';
  RETORNO_PROGRAMADO = 'retorno_programado';
  RETORNO_SEM_RETORNO = 'sem_retorno';
  RETORNO_RECUSADO_PELO_PACIENTE = 'recusado_pelo_paciente';

function CampoRetornoExiste(const ACampo: string): Boolean;
var
  LQuery: iQuery;
begin
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT COUNT(*) AS TOTAL FROM RDB$RELATION_FIELDS ');
  LQuery.Add('WHERE TRIM(RDB$RELATION_NAME) = ''RETORNOS_CONSULTA'' ');
  LQuery.Add('AND TRIM(RDB$FIELD_NAME) = :CAMPO');
  LQuery.AddParam('CAMPO', UpperCase(ACampo));
  LQuery.Open;
  Result := LQuery.DataSet.FieldByName('TOTAL').AsInteger > 0;
end;

procedure GarantirCampoRetorno(const ACampo, ATipo: string);
var
  LQuery: iQuery;
begin
  if CampoRetornoExiste(ACampo) then
    Exit;
  try
    LQuery := TDatabase.Query;
    LQuery.Clear;
    LQuery.Add('ALTER TABLE RETORNOS_CONSULTA ADD ' + ACampo + ' ' + ATipo);
    LQuery.ExecSQL;
  except
  end;
end;

function TextoJSON(ADados: TJSONObject; const ANome: string; const APadrao: string = ''): string;
begin
  if Assigned(ADados) then
    Result := Trim(ADados.GetValue<string>(ANome, APadrao))
  else
    Result := APadrao;
end;

function TemCampoJSON(ADados: TJSONObject; const ANome: string): Boolean;
begin
  Result := Assigned(ADados) and (ADados.Get(ANome) <> nil);
end;

function BoolJSON(ADados: TJSONObject; const ANome: string; const APadrao: Boolean = False): Boolean;
var
  LPair: TJSONPair;
begin
  Result := APadrao;
  if not Assigned(ADados) then
    Exit;
  LPair := ADados.Get(ANome);
  if Assigned(LPair) and Assigned(LPair.JsonValue) then
  begin
    if LPair.JsonValue is TJSONBool then
      Result := TJSONBool(LPair.JsonValue).AsBoolean
    else if LPair.JsonValue is TJSONNumber then
      Result := TJSONNumber(LPair.JsonValue).AsInt > 0
    else if LPair.JsonValue is TJSONString then
      Result := SameText(Trim(LPair.JsonValue.Value), 'true') or (Trim(LPair.JsonValue.Value) = '1');
  end;
end;

function DataJSON(ADados: TJSONObject; const ANome: string): TDateTime;
var
  LValor: string;
  LAno, LMes, LDia: Integer;
begin
  Result := 0;
  LValor := Copy(TextoJSON(ADados, ANome), 1, 10);
  if LValor = '' then
    Exit;

  if (Length(LValor) = 10) and (LValor[5] = '-') and (LValor[8] = '-') then
  begin
    LAno := StrToIntDef(Copy(LValor, 1, 4), 0);
    LMes := StrToIntDef(Copy(LValor, 6, 2), 0);
    LDia := StrToIntDef(Copy(LValor, 9, 2), 0);
    if TryEncodeDate(LAno, LMes, LDia, Result) then
      Exit;
  end;

  raise EAtendimentoValidacao.Create('Data de retorno invalida');
end;

function SituacaoRetornoValida(const ASituacao: string): Boolean;
begin
  Result :=
    (ASituacao = RETORNO_PROGRAMADO) or
    (ASituacao = 'retorno') or
    (ASituacao = 'nova_consulta') or
    (ASituacao = RETORNO_SEM_RETORNO) or
    (ASituacao = RETORNO_RECUSADO_PELO_PACIENTE);
end;

constructor TAtendimentoService.Create;
begin
  inherited Create;
  GarantirTabelas;
end;

procedure TAtendimentoService.GarantirTabelas;
var
  LAgendamento: TModelAgendamento;
  LConsulta: TModelConsulta;
  LRetorno: TModelRetornoConsulta;
begin
  LAgendamento := TModelAgendamento.Create(TDatabase.Connection);
  try
    LAgendamento.CriaTabela;
  finally
    LAgendamento.Free;
  end;

  LConsulta := TModelConsulta.Create(TDatabase.Connection);
  try
    LConsulta.CriaTabela;
  finally
    LConsulta.Free;
  end;

  LRetorno := TModelRetornoConsulta.Create(TDatabase.Connection);
  try
    LRetorno.CriaTabela;
  finally
    LRetorno.Free;
  end;

  GarantirCampoRetorno('RET_TEM_RETORNO', 'SMALLINT DEFAULT 1');
  GarantirCampoRetorno('RET_TEM_NOVA_CONSULTA', 'SMALLINT DEFAULT 0');
  GarantirCampoRetorno('RET_NOVA_CONSULTA_DATA', 'DATE');
  GarantirCampoRetorno('RET_NOVA_CONSULTA_MOTIVO', 'VARCHAR(255)');
  GarantirCampoRetorno('RET_NOVA_CONSULTA_OBSERVACAO', 'BLOB SUB_TYPE TEXT');
end;

function TAtendimentoService.Iniciar(AAgendamentoId: Integer; out AStatus: string): Integer;
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
  LPacienteId: Integer;
  LProfissionalId: Integer;
  LProfissional: string;
  LProcedimento: string;
  LStatus: string;
begin
  if AAgendamentoId <= 0 then
    raise EAtendimentoValidacao.Create('Agendamento invalido');

  Result := 0;
  AStatus := '';
  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LConn.StartTransaction;
      try
        LQuery.SQL.Text :=
          'SELECT A.AGD_PACIENTE_ID, A.AGD_PROFISSIONAL_ID, A.AGD_PROFISSIONAL, ' +
          'A.AGD_PROCEDIMENTO, A.AGD_STATUS, P.PAC_ATIVO, F.FUN_NOME, F.FUN_ESTADO, F.FUN_ATENDE ' +
          'FROM AGENDAMENTOS A ' +
          'JOIN PACIENTES P ON P.PAC_ID = A.AGD_PACIENTE_ID ' +
          'LEFT JOIN FUNCIONARIOS F ON F.FUN_CODIGO = A.AGD_PROFISSIONAL_ID ' +
          'WHERE A.AGD_ID = :ID';
        LQuery.ParamByName('ID').AsInteger := AAgendamentoId;
        LQuery.Open;

        if LQuery.IsEmpty then
          raise EAtendimentoNaoEncontrado.Create('Agendamento nao encontrado');

        LPacienteId := LQuery.FieldByName('AGD_PACIENTE_ID').AsInteger;
        LProfissionalId := LQuery.FieldByName('AGD_PROFISSIONAL_ID').AsInteger;
        LProfissional := Trim(LQuery.FieldByName('FUN_NOME').AsString);
        LProcedimento := Trim(LQuery.FieldByName('AGD_PROCEDIMENTO').AsString);
        LStatus := LowerCase(Trim(LQuery.FieldByName('AGD_STATUS').AsString));

        if LQuery.FieldByName('PAC_ATIVO').AsInteger = 0 then
          raise EAtendimentoValidacao.Create('Paciente inativo nao pode iniciar atendimento');
        if (LProfissionalId <= 0) or LQuery.FieldByName('FUN_NOME').IsNull then
          raise EAtendimentoValidacao.Create('Profissional vinculado ao agendamento nao encontrado');
        if not SameText(Trim(LQuery.FieldByName('FUN_ESTADO').AsString), 'ATIVO') then
          raise EAtendimentoValidacao.Create('Profissional vinculado ao agendamento esta inativo');
        if LQuery.FieldByName('FUN_ATENDE').AsInteger <> 1 then
          raise EAtendimentoValidacao.Create('Profissional nao esta habilitado para atendimento');
        if LProcedimento = '' then
          LProcedimento := 'Consulta';

        LQuery.Close;
        LQuery.SQL.Text :=
          'SELECT CON_ID, CON_STATUS FROM CONSULTAS ' +
          'WHERE CON_AGENDAMENTO_ID = :AGENDAMENTO_ID';
        LQuery.ParamByName('AGENDAMENTO_ID').AsInteger := AAgendamentoId;
        LQuery.Open;
        if not LQuery.IsEmpty then
        begin
          Result := LQuery.FieldByName('CON_ID').AsInteger;
          AStatus := LowerCase(Trim(LQuery.FieldByName('CON_STATUS').AsString));
          if AStatus = '' then
            AStatus := STATUS_EM_ATENDIMENTO;

          LQuery.Close;
          LQuery.SQL.Text :=
            'UPDATE AGENDAMENTOS SET AGD_STATUS = :STATUS WHERE AGD_ID = :ID';
          LQuery.ParamByName('STATUS').AsString := AStatus;
          LQuery.ParamByName('ID').AsInteger := AAgendamentoId;
          LQuery.ExecSQL;
          LConn.Commit;
          Exit;
        end;

        if SameText(LStatus, 'aguardando_atendimento') then
          LStatus := STATUS_FILA_ESPERA;

        if LStatus <> STATUS_FILA_ESPERA then
          raise EAtendimentoValidacao.Create(
            'Agendamento deve estar na fila de espera');

        LQuery.Close;
        LQuery.SQL.Text :=
          'UPDATE AGENDAMENTOS SET AGD_STATUS = :STATUS ' +
          'WHERE AGD_ID = :ID AND AGD_STATUS IN ' +
          '(''fila_espera'', ''aguardando_atendimento'')';
        LQuery.ParamByName('STATUS').AsString := STATUS_EM_ATENDIMENTO;
        LQuery.ParamByName('ID').AsInteger := AAgendamentoId;
        LQuery.ExecSQL;
        if LQuery.RowsAffected <> 1 then
          raise EAtendimentoValidacao.Create('Agendamento foi alterado por outro atendimento');

        LQuery.SQL.Text := 'SELECT COALESCE(MAX(CON_ID), 0) + 1 AS NOVO_ID FROM CONSULTAS';
        LQuery.Open;
        Result := LQuery.FieldByName('NOVO_ID').AsInteger;

        LQuery.Close;
        LQuery.SQL.Text :=
          'INSERT INTO CONSULTAS ' +
          '(CON_ID, CON_PACIENTE_ID, CON_AGENDAMENTO_ID, CON_PROFISSIONAL, ' +
          'CON_PROCEDIMENTO, CON_STATUS, CON_DATA) ' +
          'VALUES (:ID, :PACIENTE_ID, :AGENDAMENTO_ID, :PROFISSIONAL, ' +
          ':PROCEDIMENTO, :STATUS, :DATA)';
        LQuery.ParamByName('ID').AsInteger := Result;
        LQuery.ParamByName('PACIENTE_ID').AsInteger := LPacienteId;
        LQuery.ParamByName('AGENDAMENTO_ID').AsInteger := AAgendamentoId;
        LQuery.ParamByName('PROFISSIONAL').AsString := LProfissional;
        LQuery.ParamByName('PROCEDIMENTO').AsString := LProcedimento;
        LQuery.ParamByName('STATUS').AsString := STATUS_EM_ATENDIMENTO;
        LQuery.ParamByName('DATA').AsDateTime := Now;
        LQuery.ExecSQL;

        AStatus := STATUS_EM_ATENDIMENTO;
        LConn.Commit;
      except
        if LConn.InTransaction then
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

procedure TAtendimentoService.SalvarRetorno(AQuery: TFDQuery; AConsultaId,
  AUsuarioId: Integer; const AConsultaData: TDateTime; ADados: TJSONObject);
var
  LSituacao: string;
  LTipo: string;
  LDataRetorno: TDateTime;
  LMotivo: string;
  LObservacao: string;
  LTemRetorno: Integer;
  LTemNovaConsulta: Integer;
  LNovaConsultaData: TDateTime;
  LNovaConsultaMotivo: string;
  LNovaConsultaObservacao: string;
  LRetorno: TModelRetornoConsulta;
  LAgora: TDateTime;
begin
  if AUsuarioId <= 0 then
    raise EAtendimentoValidacao.Create('Usuario autenticado invalido');
  if not Assigned(ADados) then
    raise EAtendimentoValidacao.Create('Informe o plano de acompanhamento antes de finalizar');

  LSituacao := LowerCase(TextoJSON(ADados, 'situacao'));
  if LSituacao = '' then
    LSituacao := RETORNO_PROGRAMADO;

  if not SituacaoRetornoValida(LSituacao) then
    raise EAtendimentoValidacao.Create('Informe a decisao de acompanhamento');

  // Identifica Retorno Gratuito (curto prazo)
  LTemRetorno := 0;
  if (LSituacao = RETORNO_PROGRAMADO) or (LSituacao = 'retorno') then
  begin
    if TemCampoJSON(ADados, 'tem_retorno') then
    begin
      if BoolJSON(ADados, 'tem_retorno', False) then
        LTemRetorno := 1;
    end
    else if TextoJSON(ADados, 'data_retorno') <> '' then
      LTemRetorno := 1;
  end;

  LTipo := LowerCase(TextoJSON(ADados, 'tipo'));
  if Length(LTipo) > 30 then
    raise EAtendimentoValidacao.Create('O tipo de retorno deve ter no maximo 30 caracteres');
  if (LTemRetorno = 1) and (LTipo = '') then
    LTipo := 'adaptacao';

  LDataRetorno := DataJSON(ADados, 'data_retorno');
  LMotivo := TextoJSON(ADados, 'motivo');
  LObservacao := TextoJSON(ADados, 'observacao');

  if (LTemRetorno = 1) and (LDataRetorno <= 0) then
    raise EAtendimentoValidacao.Create('Informe a data do retorno gratuito');
  if (LDataRetorno > 0) and (AConsultaData > 0) and
    (DateOf(LDataRetorno) < DateOf(AConsultaData)) then
    raise EAtendimentoValidacao.Create('A data de retorno nao pode ser anterior a consulta');

  // Identifica Nova Consulta (longo prazo / CRM)
  LTemNovaConsulta := 0;
  if (LSituacao = RETORNO_PROGRAMADO) or (LSituacao = 'nova_consulta') then
  begin
    if TemCampoJSON(ADados, 'tem_nova_consulta') then
    begin
      if BoolJSON(ADados, 'tem_nova_consulta', False) then
        LTemNovaConsulta := 1;
    end
    else if TextoJSON(ADados, 'nova_consulta_data') <> '' then
      LTemNovaConsulta := 1;
  end;

  LNovaConsultaData := DataJSON(ADados, 'nova_consulta_data');
  LNovaConsultaMotivo := TextoJSON(ADados, 'nova_consulta_motivo');
  LNovaConsultaObservacao := TextoJSON(ADados, 'nova_consulta_observacao');

  if (LTemNovaConsulta = 1) and (LNovaConsultaData <= 0) then
    raise EAtendimentoValidacao.Create('Informe a data estipulada para a nova consulta');
  if (LNovaConsultaData > 0) and (AConsultaData > 0) and
    (DateOf(LNovaConsultaData) < DateOf(AConsultaData)) then
    raise EAtendimentoValidacao.Create('A data da nova consulta nao pode ser anterior a consulta');

  if Length(LMotivo) > 255 then
    raise EAtendimentoValidacao.Create('O motivo do retorno deve ter no maximo 255 caracteres');
  if Length(LObservacao) > 2000 then
    raise EAtendimentoValidacao.Create('A observacao do retorno deve ter no maximo 2000 caracteres');
  if Length(LNovaConsultaMotivo) > 255 then
    raise EAtendimentoValidacao.Create('O motivo da nova consulta deve ter no maximo 255 caracteres');
  if Length(LNovaConsultaObservacao) > 2000 then
    raise EAtendimentoValidacao.Create('A observacao da nova consulta deve ter no maximo 2000 caracteres');

  LAgora := Now;
  LRetorno := TModelRetornoConsulta.Create(TFDConnection(AQuery.Connection));
  try
    LRetorno.BuscaPorCampo('RET_CONSULTA_ID', AConsultaId);
    if LRetorno.Id <= 0 then
    begin
      LRetorno.Id := LRetorno.GeraCodigo('RET_ID');
      LRetorno.ConsultaId := AConsultaId;
      LRetorno.CriadoPor := AUsuarioId;
      LRetorno.CriadoEm := LAgora;
    end;

    LRetorno.Situacao := LSituacao;
    LRetorno.Tipo := LTipo;
    if (LTemRetorno = 1) and (LDataRetorno > 0) then
      LRetorno.DataRetorno := DateOf(LDataRetorno)
    else
      LRetorno.DataRetorno := 0;
    LRetorno.Motivo := LMotivo;
    LRetorno.Observacao := LObservacao;

    LRetorno.TemRetorno := LTemRetorno;
    LRetorno.TemNovaConsulta := LTemNovaConsulta;
    if (LTemNovaConsulta = 1) and (LNovaConsultaData > 0) then
      LRetorno.NovaConsultaData := DateOf(LNovaConsultaData)
    else
      LRetorno.NovaConsultaData := 0;
    LRetorno.NovaConsultaMotivo := LNovaConsultaMotivo;
    LRetorno.NovaConsultaObservacao := LNovaConsultaObservacao;

    LRetorno.AtualizadoPor := AUsuarioId;
    LRetorno.AtualizadoEm := LAgora;

    LRetorno.SalvaNoBanco(1);

    // Garante que campos de data desmarcados fiquem explicitamente NULL no Firebird
    if (LTemRetorno = 0) or (LDataRetorno <= 0) then
    begin
      AQuery.Close;
      AQuery.SQL.Text := 'UPDATE RETORNOS_CONSULTA SET RET_DATA = NULL WHERE RET_ID = :ID';
      AQuery.ParamByName('ID').AsInteger := LRetorno.Id;
      AQuery.ExecSQL;
    end;

    if (LTemNovaConsulta = 0) or (LNovaConsultaData <= 0) then
    begin
      AQuery.Close;
      AQuery.SQL.Text := 'UPDATE RETORNOS_CONSULTA SET RET_NOVA_CONSULTA_DATA = NULL WHERE RET_ID = :ID';
      AQuery.ParamByName('ID').AsInteger := LRetorno.Id;
      AQuery.ExecSQL;
    end;
  finally
    LRetorno.Free;
  end;
end;

procedure TAtendimentoService.Finalizar(AConsultaId, AUsuarioId: Integer;
  ADados: TJSONObject);
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
  LAgendamentoId: Integer;
  LConsultaData: TDateTime;
begin
  if AConsultaId <= 0 then
    raise EAtendimentoValidacao.Create('Consulta invalida');

  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LConn.StartTransaction;
      try
        LQuery.SQL.Text :=
          'SELECT CON_AGENDAMENTO_ID, CON_STATUS, CON_DATA FROM CONSULTAS WHERE CON_ID = :ID';
        LQuery.ParamByName('ID').AsInteger := AConsultaId;
        LQuery.Open;
        if LQuery.IsEmpty then
          raise EAtendimentoNaoEncontrado.Create('Consulta nao encontrada');

        LAgendamentoId := LQuery.FieldByName('CON_AGENDAMENTO_ID').AsInteger;
        LConsultaData := LQuery.FieldByName('CON_DATA').AsDateTime;

        SalvarRetorno(LQuery, AConsultaId, AUsuarioId, LConsultaData, ADados);

        LQuery.Close;
        LQuery.SQL.Text :=
          'UPDATE CONSULTAS SET CON_STATUS = :STATUS, ' +
          'CON_FINALIZADA_EM = COALESCE(CON_FINALIZADA_EM, :FINALIZADA_EM) ' +
          'WHERE CON_ID = :ID';
        LQuery.ParamByName('STATUS').AsString := STATUS_REALIZADA;
        LQuery.ParamByName('FINALIZADA_EM').AsDateTime := Now;
        LQuery.ParamByName('ID').AsInteger := AConsultaId;
        LQuery.ExecSQL;

        if LAgendamentoId > 0 then
        begin
          LQuery.SQL.Text :=
            'UPDATE AGENDAMENTOS SET AGD_STATUS = :STATUS WHERE AGD_ID = :ID';
          LQuery.ParamByName('STATUS').AsString := STATUS_REALIZADA;
          LQuery.ParamByName('ID').AsInteger := LAgendamentoId;
          LQuery.ExecSQL;
          if LQuery.RowsAffected <> 1 then
            raise EAtendimentoNaoEncontrado.Create('Agendamento da consulta nao encontrado');
        end;

        LConn.Commit;
      except
        if LConn.InTransaction then
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

end.
