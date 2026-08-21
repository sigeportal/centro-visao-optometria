unit Atendimento.Service;

interface

uses
  System.SysUtils;

type
  EAtendimentoValidacao = class(Exception);
  EAtendimentoNaoEncontrado = class(Exception);

  TAtendimentoService = class
  private
    procedure GarantirTabelas;
  public
    constructor Create;
    function Iniciar(AAgendamentoId: Integer; out AStatus: string): Integer;
    procedure Finalizar(AConsultaId: Integer);
  end;

implementation

uses
  FireDAC.Comp.Client,
  UnitDatabase,
  Models.Clinica;

const
  STATUS_FILA_ESPERA = 'fila_espera';
  STATUS_EM_ATENDIMENTO = 'em_atendimento';
  STATUS_REALIZADA = 'realizada';

constructor TAtendimentoService.Create;
begin
  inherited Create;
  GarantirTabelas;
end;

procedure TAtendimentoService.GarantirTabelas;
var
  LAgendamento: TModelAgendamento;
  LConsulta: TModelConsulta;
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

procedure TAtendimentoService.Finalizar(AConsultaId: Integer);
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
  LAgendamentoId: Integer;
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
          'SELECT CON_AGENDAMENTO_ID, CON_STATUS FROM CONSULTAS WHERE CON_ID = :ID';
        LQuery.ParamByName('ID').AsInteger := AConsultaId;
        LQuery.Open;
        if LQuery.IsEmpty then
          raise EAtendimentoNaoEncontrado.Create('Consulta nao encontrada');

        LAgendamentoId := LQuery.FieldByName('CON_AGENDAMENTO_ID').AsInteger;

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
