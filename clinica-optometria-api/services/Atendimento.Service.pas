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
  System.DateUtils,
  UnitDatabase,
  Models.Clinica;

const
  STATUS_FILA_ESPERA = 'fila_espera';
  STATUS_EM_ATENDIMENTO = 'em_atendimento';
  STATUS_REALIZADA = 'realizada';
  RETORNO_PROGRAMADO = 'retorno_programado';
  RETORNO_SEM_RETORNO = 'sem_retorno';
  RETORNO_RECUSADO_PELO_PACIENTE = 'recusado_pelo_paciente';

function TextoJSON(ADados: TJSONObject; const ANome: string; const APadrao: string = ''): string;
begin
  if Assigned(ADados) then
    Result := Trim(ADados.GetValue<string>(ANome, APadrao))
  else
    Result := APadrao;
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
  LRetornoId: Integer;
  LAgora: TDateTime;
begin
  if AUsuarioId <= 0 then
    raise EAtendimentoValidacao.Create('Usuario autenticado invalido');
  if not Assigned(ADados) then
    raise EAtendimentoValidacao.Create('Informe o plano de retorno antes de finalizar');

  LSituacao := LowerCase(TextoJSON(ADados, 'situacao'));
  if not SituacaoRetornoValida(LSituacao) then
    raise EAtendimentoValidacao.Create('Informe a decisao de acompanhamento');

  LTipo := LowerCase(TextoJSON(ADados, 'tipo'));
  if Length(LTipo) > 30 then
    raise EAtendimentoValidacao.Create('O tipo de retorno deve ter no maximo 30 caracteres');

  LDataRetorno := DataJSON(ADados, 'data_retorno');
  if (LSituacao = RETORNO_PROGRAMADO) and (LTipo = '') then
    raise EAtendimentoValidacao.Create('Informe o tipo de retorno');
  if (LSituacao = RETORNO_PROGRAMADO) and (LDataRetorno <= 0) then
    raise EAtendimentoValidacao.Create('Informe a data do retorno');
  if (LSituacao <> RETORNO_PROGRAMADO) and ((LTipo <> '') or (LDataRetorno > 0)) then
    raise EAtendimentoValidacao.Create(
      'Tipo e data so podem ser informados para retorno programado');
  if (LDataRetorno > 0) and (AConsultaData > 0) and
    (DateOf(LDataRetorno) < DateOf(AConsultaData)) then
    raise EAtendimentoValidacao.Create('A data de retorno nao pode ser anterior a consulta');

  LMotivo := TextoJSON(ADados, 'motivo');
  LObservacao := TextoJSON(ADados, 'observacao');
  if Length(LMotivo) > 255 then
    raise EAtendimentoValidacao.Create('O motivo do retorno deve ter no maximo 255 caracteres');
  if Length(LObservacao) > 2000 then
    raise EAtendimentoValidacao.Create('A observacao do retorno deve ter no maximo 2000 caracteres');

  AQuery.Close;
  AQuery.SQL.Text :=
    'SELECT RET_ID FROM RETORNOS_CONSULTA WHERE RET_CONSULTA_ID = :CONSULTA_ID';
  AQuery.ParamByName('CONSULTA_ID').AsInteger := AConsultaId;
  AQuery.Open;

  if AQuery.IsEmpty then
  begin
    AQuery.Close;
    AQuery.SQL.Text := 'SELECT COALESCE(MAX(RET_ID), 0) + 1 AS NOVO_ID FROM RETORNOS_CONSULTA';
    AQuery.Open;
    LRetornoId := AQuery.FieldByName('NOVO_ID').AsInteger;
    LAgora := Now;

    AQuery.Close;
    AQuery.SQL.Text :=
      'INSERT INTO RETORNOS_CONSULTA ' +
      '(RET_ID, RET_CONSULTA_ID, RET_SITUACAO, RET_TIPO, RET_DATA, RET_MOTIVO, RET_OBSERVACAO, ' +
      'RET_CRIADO_POR, RET_CRIADO_EM, RET_ATUALIZADO_POR, RET_ATUALIZADO_EM) ' +
      'VALUES (:ID, :CONSULTA_ID, :SITUACAO, :TIPO, :DATA_RETORNO, :MOTIVO, :OBSERVACAO, ' +
      ':CRIADO_POR, :CRIADO_EM, :ATUALIZADO_POR, :ATUALIZADO_EM)';
    AQuery.ParamByName('ID').AsInteger := LRetornoId;
    AQuery.ParamByName('CONSULTA_ID').AsInteger := AConsultaId;
    AQuery.ParamByName('SITUACAO').AsString := LSituacao;
    AQuery.ParamByName('TIPO').AsString := LTipo;
    if LDataRetorno > 0 then
      AQuery.ParamByName('DATA_RETORNO').AsDateTime := DateOf(LDataRetorno)
    else
      AQuery.ParamByName('DATA_RETORNO').Clear;
    AQuery.ParamByName('MOTIVO').AsString := LMotivo;
    AQuery.ParamByName('OBSERVACAO').AsString := LObservacao;
    AQuery.ParamByName('CRIADO_POR').AsInteger := AUsuarioId;
    AQuery.ParamByName('CRIADO_EM').AsDateTime := LAgora;
    AQuery.ParamByName('ATUALIZADO_POR').AsInteger := AUsuarioId;
    AQuery.ParamByName('ATUALIZADO_EM').AsDateTime := LAgora;
    AQuery.ExecSQL;
  end
  else
  begin
    LRetornoId := AQuery.FieldByName('RET_ID').AsInteger;
    AQuery.Close;
    AQuery.SQL.Text :=
      'UPDATE RETORNOS_CONSULTA SET RET_SITUACAO = :SITUACAO, ' +
      'RET_TIPO = :TIPO, RET_DATA = :DATA_RETORNO, ' +
      'RET_MOTIVO = :MOTIVO, RET_OBSERVACAO = :OBSERVACAO, ' +
      'RET_ATUALIZADO_POR = :ATUALIZADO_POR, RET_ATUALIZADO_EM = :ATUALIZADO_EM ' +
      'WHERE RET_ID = :ID';
    AQuery.ParamByName('SITUACAO').AsString := LSituacao;
    AQuery.ParamByName('TIPO').AsString := LTipo;
    if LDataRetorno > 0 then
      AQuery.ParamByName('DATA_RETORNO').AsDateTime := DateOf(LDataRetorno)
    else
      AQuery.ParamByName('DATA_RETORNO').Clear;
    AQuery.ParamByName('MOTIVO').AsString := LMotivo;
    AQuery.ParamByName('OBSERVACAO').AsString := LObservacao;
    AQuery.ParamByName('ATUALIZADO_POR').AsInteger := AUsuarioId;
    AQuery.ParamByName('ATUALIZADO_EM').AsDateTime := Now;
    AQuery.ParamByName('ID').AsInteger := LRetornoId;
    AQuery.ExecSQL;
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
