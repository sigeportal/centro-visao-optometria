unit Consulta.Service;

interface

uses
  System.JSON,
  System.SysUtils;

type
  EConsultaValidacao = class(Exception);
  EConsultaNaoEncontrada = class(Exception);

  TConsultaService = class
  private
    procedure GarantirTabelas;
    procedure ValidarConsultaExiste(AConsultaId: Integer);
    procedure ValidarPacienteAtivo(APacienteId: Integer);
    function ConsultaPacienteId(AConsultaId: Integer): Integer;
    function AnamneseToJSON(AAnamneseId: Integer): TJSONObject;
    function PrescricaoToJSON(APrescricaoId: Integer): TJSONObject;
    function DocumentoToJSON(ADocumentoId: Integer): TJSONObject;
  public
    constructor Create;
    function Listar: TJSONArray;
    function ObterPorId(AId: Integer): TJSONObject;
    function Criar(APacienteId: Integer; const AProcedimento, AProfissional: string; AAgendamentoId: Integer): Integer;
    procedure Atualizar(AId, APacienteId: Integer; const AProcedimento, AProfissional, AStatus: string);
    procedure Finalizar(AId: Integer);

    function ListarAnamneses(AConsultaId: Integer): TJSONArray;
    function ObterAnamnesePorId(AAnamneseId: Integer): TJSONObject;
    function CriarAnamnese(AConsultaId: Integer; ADados: TJSONObject): Integer;
    procedure AtualizarAnamnese(AAnamneseId: Integer; ADados: TJSONObject);
    procedure ExcluirAnamnese(AAnamneseId: Integer);
    procedure SalvarAnamnese(AConsultaId: Integer; ADados: TJSONObject);
    function ObterAnamnese(AConsultaId: Integer): TJSONObject;
    function ImpressaoAnamnese(AAnamneseId: Integer): TJSONObject;

    function ListarPrescricoes(AConsultaId: Integer): TJSONArray;
    function ObterPrescricaoPorId(APrescricaoId: Integer): TJSONObject;
    function CriarPrescricao(AConsultaId: Integer; ADados: TJSONObject): Integer;
    procedure AtualizarPrescricao(APrescricaoId: Integer; ADados: TJSONObject);
    procedure ExcluirPrescricao(APrescricaoId: Integer);
    function ImpressaoPrescricao(APrescricaoId: Integer): TJSONObject;

    function ListarDocumentos(AConsultaId: Integer): TJSONArray;
    function CriarDocumento(AConsultaId: Integer; ADados: TJSONObject): Integer;
  end;

implementation

uses
  System.DateUtils,
  UnitConnection.Model.Interfaces,
  UnitDatabase,
  Models.Clinica,
  Dataset.JSON.Utils;

const
  STATUS_AGENDADA = 'agendada';
  STATUS_CONFIRMADA = 'confirmada';
  STATUS_ATENDIDA = 'atendida';
  STATUS_CANCELADA = 'cancelada';
  STATUS_REALIZADA = 'realizada';
  STATUS_EM_ATENDIMENTO = 'em_atendimento';

function JsonString(ADados: TJSONObject; const AName: string; const ADefault: string = ''): string;
begin
  if Assigned(ADados) then
    Result := Trim(ADados.GetValue<string>(AName, ADefault))
  else
    Result := ADefault;
end;

function JsonInt(ADados: TJSONObject; const AName: string; ADefault: Integer = 0): Integer;
begin
  if Assigned(ADados) then
    Result := ADados.GetValue<Integer>(AName, ADefault)
  else
    Result := ADefault;
end;

function JsonBoolInt(ADados: TJSONObject; const AName: string): Integer;
begin
  Result := 0;
  if Assigned(ADados) and ADados.GetValue<Boolean>(AName, False) then
    Result := 1;
end;

function JsonDate(ADados: TJSONObject; const AName: string): TDateTime;
var
  LValue: string;
begin
  Result := 0;
  LValue := JsonString(ADados, AName);
  if LValue = '' then
    Exit;

  if (not TryISO8601ToDate(LValue, Result)) and (not TryStrToDate(LValue, Result)) then
    raise EConsultaValidacao.Create('Data invalida: ' + AName);
end;

function DateToJsonString(const AValue: TDateTime): string;
begin
  if AValue <= 0 then
    Result := ''
  else
    Result := DateToISO8601(AValue, False);
end;

procedure AddStringPair(AObj: TJSONObject; const AName, AValue: string);
begin
  if AValue = '' then
    AObj.AddPair(AName, TJSONNull.Create)
  else
    AObj.AddPair(AName, AValue);
end;

procedure AddDatePair(AObj: TJSONObject; const AName: string; const AValue: TDateTime);
begin
  if AValue <= 0 then
    AObj.AddPair(AName, TJSONNull.Create)
  else
    AObj.AddPair(AName, DateToISO8601(AValue, False));
end;

function StatusPermitido(const AStatus: string): Boolean;
begin
  Result :=
    (AStatus = STATUS_AGENDADA) or
    (AStatus = STATUS_CONFIRMADA) or
    (AStatus = STATUS_ATENDIDA) or
    (AStatus = STATUS_CANCELADA) or
    (AStatus = STATUS_REALIZADA) or
    (AStatus = STATUS_EM_ATENDIMENTO);
end;

constructor TConsultaService.Create;
begin
  inherited Create;
  GarantirTabelas;
end;

procedure TConsultaService.GarantirTabelas;
var
  LConsulta: TModelConsulta;
  LAnamnese: TModelAnamnese;
  LPrescricao: TModelPrescricao;
  LDocumento: TModelDocumentoConsulta;
begin
  LConsulta := TModelConsulta.Create(TDatabase.Connection);
  try
    LConsulta.CriaTabela;
  finally
    LConsulta.Free;
  end;

  LAnamnese := TModelAnamnese.Create(TDatabase.Connection);
  try
    LAnamnese.CriaTabela;
  finally
    LAnamnese.Free;
  end;

  LPrescricao := TModelPrescricao.Create(TDatabase.Connection);
  try
    LPrescricao.CriaTabela;
  finally
    LPrescricao.Free;
  end;

  LDocumento := TModelDocumentoConsulta.Create(TDatabase.Connection);
  try
    LDocumento.CriaTabela;
  finally
    LDocumento.Free;
  end;
end;

procedure TConsultaService.ValidarConsultaExiste(AConsultaId: Integer);
var
  LConsulta: TModelConsulta;
begin
  if AConsultaId <= 0 then
    raise EConsultaValidacao.Create('Consulta invalida');

  LConsulta := TModelConsulta.Create(TDatabase.Connection);
  try
    LConsulta.BuscaDadosTabela(AConsultaId);
    if LConsulta.Id <= 0 then
      raise EConsultaNaoEncontrada.Create('Consulta nao encontrada');
  finally
    LConsulta.Free;
  end;
end;

procedure TConsultaService.ValidarPacienteAtivo(APacienteId: Integer);
var
  LPaciente: TModelPaciente;
begin
  if APacienteId <= 0 then
    raise EConsultaValidacao.Create('Paciente e obrigatorio');

  LPaciente := TModelPaciente.Create(TDatabase.Connection);
  try
    LPaciente.BuscaDadosTabela(APacienteId);
    if LPaciente.Id <= 0 then
      raise EConsultaValidacao.Create('Paciente nao encontrado');
    if LPaciente.Ativo = 0 then
      raise EConsultaValidacao.Create('Paciente inativo nao pode iniciar consulta');
  finally
    LPaciente.Free;
  end;
end;

function TConsultaService.ConsultaPacienteId(AConsultaId: Integer): Integer;
var
  LConsulta: TModelConsulta;
begin
  Result := 0;
  LConsulta := TModelConsulta.Create(TDatabase.Connection);
  try
    LConsulta.BuscaDadosTabela(AConsultaId);
    if LConsulta.Id > 0 then
      Result := LConsulta.PacienteId;
  finally
    LConsulta.Free;
  end;
end;

function TConsultaService.Listar: TJSONArray;
var
  LQuery: iQuery;
begin
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT C.CON_ID AS ID, C.CON_PACIENTE_ID AS PACIENTE_ID, P.PAC_NOME AS PACIENTE, ');
  LQuery.Add('C.CON_PROFISSIONAL AS PROFISSIONAL, C.CON_PROCEDIMENTO AS PROCEDIMENTO, ');
  LQuery.Add('C.CON_STATUS AS STATUS, C.CON_DATA AS DATA, C.CON_FINALIZADA_EM AS FINALIZADA_EM ');
  LQuery.Add('FROM CONSULTAS C ');
  LQuery.Add('JOIN PACIENTES P ON P.PAC_ID = C.CON_PACIENTE_ID ');
  LQuery.Add('ORDER BY C.CON_DATA DESC');
  LQuery.Open;
  Result := TDatasetJsonUtils.QueryToJSONArray(LQuery.DataSet);
end;

function TConsultaService.ObterPorId(AId: Integer): TJSONObject;
var
  LQuery: iQuery;
  I: Integer;
begin
  Result := nil;
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT C.CON_ID AS ID, C.CON_PACIENTE_ID AS PACIENTE_ID, C.CON_AGENDAMENTO_ID AS AGENDAMENTO_ID, ');
  LQuery.Add('C.CON_PROFISSIONAL AS PROFISSIONAL, C.CON_PROCEDIMENTO AS PROCEDIMENTO, C.CON_STATUS AS STATUS, ');
  LQuery.Add('C.CON_DATA AS DATA, C.CON_FINALIZADA_EM AS FINALIZADA_EM, P.PAC_NOME AS PACIENTE_NOME, ');
  LQuery.Add('P.PAC_DATA_NASCIMENTO AS PACIENTE_DATA_NASCIMENTO, P.PAC_SEXO AS PACIENTE_SEXO, ');
  LQuery.Add('P.PAC_OCUPACAO AS PACIENTE_OCUPACAO, P.PAC_CIDADE AS PACIENTE_CIDADE ');
  LQuery.Add('FROM CONSULTAS C ');
  LQuery.Add('JOIN PACIENTES P ON P.PAC_ID = C.CON_PACIENTE_ID ');
  LQuery.Add('WHERE C.CON_ID = :ID');
  LQuery.AddParam('ID', AId);
  LQuery.Open;

  if not LQuery.DataSet.IsEmpty then
  begin
    Result := TJSONObject.Create;
    for I := 0 to LQuery.DataSet.Fields.Count - 1 do
    begin
      if LQuery.DataSet.Fields[I].IsNull then
        Result.AddPair(LowerCase(LQuery.DataSet.Fields[I].FieldName), TJSONNull.Create)
      else
        Result.AddPair(LowerCase(LQuery.DataSet.Fields[I].FieldName), LQuery.DataSet.Fields[I].AsString);
    end;
  end;
end;

function TConsultaService.Criar(APacienteId: Integer; const AProcedimento, AProfissional: string; AAgendamentoId: Integer): Integer;
var
  LConsulta: TModelConsulta;
begin
  ValidarPacienteAtivo(APacienteId);

  LConsulta := TModelConsulta.Create(TDatabase.Connection);
  try
    LConsulta.Id := LConsulta.GeraCodigo('CON_ID');
    LConsulta.PacienteId := APacienteId;
    LConsulta.AgendamentoId := AAgendamentoId;
    LConsulta.Profissional := AProfissional;
    LConsulta.Procedimento := AProcedimento;
    if LConsulta.Procedimento = '' then
      LConsulta.Procedimento := 'Consulta';
    LConsulta.Status := STATUS_EM_ATENDIMENTO;
    LConsulta.Data := Now;
    LConsulta.SalvaNoBanco(1);
    Result := LConsulta.Id;
  finally
    LConsulta.Free;
  end;
end;

procedure TConsultaService.Atualizar(AId, APacienteId: Integer; const AProcedimento, AProfissional, AStatus: string);
var
  LConsulta: TModelConsulta;
  LStatus: string;
begin
  ValidarPacienteAtivo(APacienteId);
  LStatus := AStatus;
  if LStatus = '' then
    LStatus := STATUS_EM_ATENDIMENTO;
  if not StatusPermitido(LStatus) then
    raise EConsultaValidacao.Create('Status de consulta invalido');

  LConsulta := TModelConsulta.Create(TDatabase.Connection);
  try
    LConsulta.BuscaDadosTabela(AId);
    if LConsulta.Id <= 0 then
      raise EConsultaNaoEncontrada.Create('Consulta nao encontrada');

    LConsulta.PacienteId := APacienteId;
    LConsulta.Procedimento := AProcedimento;
    LConsulta.Profissional := AProfissional;
    LConsulta.Status := LStatus;
    LConsulta.SalvaNoBanco(1);
  finally
    LConsulta.Free;
  end;
end;

procedure TConsultaService.Finalizar(AId: Integer);
var
  LConsulta: TModelConsulta;
begin
  LConsulta := TModelConsulta.Create(TDatabase.Connection);
  try
    LConsulta.BuscaDadosTabela(AId);
    if LConsulta.Id <= 0 then
      raise EConsultaNaoEncontrada.Create('Consulta nao encontrada');

    LConsulta.Status := STATUS_REALIZADA;
    LConsulta.FinalizadaEm := Now;
    LConsulta.SalvaNoBanco(1);
  finally
    LConsulta.Free;
  end;
end;

function TConsultaService.ListarAnamneses(AConsultaId: Integer): TJSONArray;
var
  LQuery: iQuery;
begin
  ValidarConsultaExiste(AConsultaId);
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT ANA_ID AS ID, ANA_CONSULTA_ID AS CONSULTA_ID, ANA_MOTIVO_PRINCIPAL AS MOTIVO_PRINCIPAL, ');
  LQuery.Add('ANA_MOTIVO_PRINCIPAL AS QUEIXA_PRINCIPAL, ANA_OBSERVACOES_GERAIS AS OBSERVACOES_GERAIS, ');
  LQuery.Add('ANA_OBSERVACOES_GERAIS AS HISTORICO, ANA_OBSERVACOES_FINAIS AS OBSERVACOES, ANA_DATA AS DATA ');
  LQuery.Add('FROM ANAMNESES WHERE ANA_CONSULTA_ID = :CONSULTA_ID ORDER BY ANA_DATA DESC');
  LQuery.AddParam('CONSULTA_ID', AConsultaId);
  LQuery.Open;
  Result := TDatasetJsonUtils.QueryToJSONArray(LQuery.DataSet);
end;

function TConsultaService.AnamneseToJSON(AAnamneseId: Integer): TJSONObject;
var
  LAnamnese: TModelAnamnese;
begin
  LAnamnese := TModelAnamnese.Create(TDatabase.Connection);
  try
    LAnamnese.BuscaDadosTabela(AAnamneseId);
    if LAnamnese.Id <= 0 then
      raise EConsultaNaoEncontrada.Create('Anamnese nao encontrada');

    Result := TJSONObject.Create;
    Result.AddPair('id', TJSONNumber.Create(LAnamnese.Id));
    Result.AddPair('consulta_id', TJSONNumber.Create(LAnamnese.ConsultaId));
    AddStringPair(Result, 'motivo_principal', LAnamnese.MotivoPrincipal);
    AddStringPair(Result, 'queixa_principal', LAnamnese.MotivoPrincipal);
    AddDatePair(Result, 'data_ultimo_exame', LAnamnese.DataUltimoExame);
    AddStringPair(Result, 'observacoes_gerais', LAnamnese.ObservacoesGerais);
    AddStringPair(Result, 'historico', LAnamnese.ObservacoesGerais);
    AddStringPair(Result, 'sintomas', LAnamnese.Sintomas);
    AddStringPair(Result, 'doencas_oculares', LAnamnese.DoencasOculares);
    AddStringPair(Result, 'doencas_sistemicas', LAnamnese.DoencasSistemicas);
    AddStringPair(Result, 'medicamentos', LAnamnese.Medicamentos);
    Result.AddPair('uso_oculos', TJSONBool.Create(LAnamnese.UsoOculos = 1));
    Result.AddPair('uso_lente', TJSONBool.Create(LAnamnese.UsoLente = 1));
    Result.AddPair('dificuldade_longe', TJSONBool.Create(LAnamnese.DificuldadeLonge = 1));
    Result.AddPair('dificuldade_perto', TJSONBool.Create(LAnamnese.DificuldadePerto = 1));
    Result.AddPair('cefaleia', TJSONBool.Create(LAnamnese.Cefaleia = 1));
    AddStringPair(Result, 'cefaleia_local', LAnamnese.CefaleiaLocal);
    AddStringPair(Result, 'cefaleia_frequencia', LAnamnese.CefaleiaFrequencia);
    AddStringPair(Result, 'antecedentes_familiares', LAnamnese.AntecedentesFamiliares);
    AddStringPair(Result, 'observacoes_finais', LAnamnese.ObservacoesFinais);
    AddStringPair(Result, 'observacoes', LAnamnese.ObservacoesFinais);
    AddDatePair(Result, 'data', LAnamnese.Data);
  finally
    LAnamnese.Free;
  end;
end;

function TConsultaService.ObterAnamnesePorId(AAnamneseId: Integer): TJSONObject;
begin
  Result := AnamneseToJSON(AAnamneseId);
end;

function TConsultaService.CriarAnamnese(AConsultaId: Integer; ADados: TJSONObject): Integer;
var
  LAnamnese: TModelAnamnese;
begin
  ValidarConsultaExiste(AConsultaId);
  if not Assigned(ADados) then
    raise EConsultaValidacao.Create('Payload invalido');

  LAnamnese := TModelAnamnese.Create(TDatabase.Connection);
  try
    LAnamnese.Id := LAnamnese.GeraCodigo('ANA_ID');
    LAnamnese.ConsultaId := AConsultaId;
    LAnamnese.MotivoPrincipal := JsonString(ADados, 'motivo_principal', JsonString(ADados, 'queixa_principal'));
    LAnamnese.DataUltimoExame := JsonDate(ADados, 'data_ultimo_exame');
    LAnamnese.ObservacoesGerais := JsonString(ADados, 'observacoes_gerais', JsonString(ADados, 'historico'));
    LAnamnese.Sintomas := JsonString(ADados, 'sintomas');
    LAnamnese.DoencasOculares := JsonString(ADados, 'doencas_oculares');
    LAnamnese.DoencasSistemicas := JsonString(ADados, 'doencas_sistemicas');
    LAnamnese.Medicamentos := JsonString(ADados, 'medicamentos');
    LAnamnese.UsoOculos := JsonBoolInt(ADados, 'uso_oculos');
    LAnamnese.UsoLente := JsonBoolInt(ADados, 'uso_lente');
    LAnamnese.DificuldadeLonge := JsonBoolInt(ADados, 'dificuldade_longe');
    LAnamnese.DificuldadePerto := JsonBoolInt(ADados, 'dificuldade_perto');
    LAnamnese.Cefaleia := JsonBoolInt(ADados, 'cefaleia');
    LAnamnese.CefaleiaLocal := JsonString(ADados, 'cefaleia_local');
    LAnamnese.CefaleiaFrequencia := JsonString(ADados, 'cefaleia_frequencia');
    LAnamnese.AntecedentesFamiliares := JsonString(ADados, 'antecedentes_familiares');
    LAnamnese.ObservacoesFinais := JsonString(ADados, 'observacoes_finais', JsonString(ADados, 'observacoes'));
    LAnamnese.Data := Now;
    LAnamnese.SalvaNoBanco(1);
    Result := LAnamnese.Id;
  finally
    LAnamnese.Free;
  end;
end;

procedure TConsultaService.AtualizarAnamnese(AAnamneseId: Integer; ADados: TJSONObject);
var
  LAnamnese: TModelAnamnese;
begin
  if not Assigned(ADados) then
    raise EConsultaValidacao.Create('Payload invalido');

  LAnamnese := TModelAnamnese.Create(TDatabase.Connection);
  try
    LAnamnese.BuscaDadosTabela(AAnamneseId);
    if LAnamnese.Id <= 0 then
      raise EConsultaNaoEncontrada.Create('Anamnese nao encontrada');

    LAnamnese.MotivoPrincipal := JsonString(ADados, 'motivo_principal', JsonString(ADados, 'queixa_principal'));
    LAnamnese.DataUltimoExame := JsonDate(ADados, 'data_ultimo_exame');
    LAnamnese.ObservacoesGerais := JsonString(ADados, 'observacoes_gerais', JsonString(ADados, 'historico'));
    LAnamnese.Sintomas := JsonString(ADados, 'sintomas');
    LAnamnese.DoencasOculares := JsonString(ADados, 'doencas_oculares');
    LAnamnese.DoencasSistemicas := JsonString(ADados, 'doencas_sistemicas');
    LAnamnese.Medicamentos := JsonString(ADados, 'medicamentos');
    LAnamnese.UsoOculos := JsonBoolInt(ADados, 'uso_oculos');
    LAnamnese.UsoLente := JsonBoolInt(ADados, 'uso_lente');
    LAnamnese.DificuldadeLonge := JsonBoolInt(ADados, 'dificuldade_longe');
    LAnamnese.DificuldadePerto := JsonBoolInt(ADados, 'dificuldade_perto');
    LAnamnese.Cefaleia := JsonBoolInt(ADados, 'cefaleia');
    LAnamnese.CefaleiaLocal := JsonString(ADados, 'cefaleia_local');
    LAnamnese.CefaleiaFrequencia := JsonString(ADados, 'cefaleia_frequencia');
    LAnamnese.AntecedentesFamiliares := JsonString(ADados, 'antecedentes_familiares');
    LAnamnese.ObservacoesFinais := JsonString(ADados, 'observacoes_finais', JsonString(ADados, 'observacoes'));
    LAnamnese.Data := Now;
    LAnamnese.SalvaNoBanco(1);
  finally
    LAnamnese.Free;
  end;
end;

procedure TConsultaService.ExcluirAnamnese(AAnamneseId: Integer);
var
  LAnamnese: TModelAnamnese;
begin
  LAnamnese := TModelAnamnese.Create(TDatabase.Connection);
  try
    LAnamnese.BuscaDadosTabela(AAnamneseId);
    if LAnamnese.Id <= 0 then
      raise EConsultaNaoEncontrada.Create('Anamnese nao encontrada');
    LAnamnese.Apagar(AAnamneseId);
  finally
    LAnamnese.Free;
  end;
end;

procedure TConsultaService.SalvarAnamnese(AConsultaId: Integer; ADados: TJSONObject);
var
  LQuery: iQuery;
  LAnamneseId: Integer;
begin
  LAnamneseId := 0;
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT FIRST 1 ANA_ID FROM ANAMNESES WHERE ANA_CONSULTA_ID = :CONSULTA_ID ORDER BY ANA_DATA DESC');
  LQuery.AddParam('CONSULTA_ID', AConsultaId);
  LQuery.Open;
  if not LQuery.DataSet.IsEmpty then
    LAnamneseId := LQuery.DataSet.FieldByName('ANA_ID').AsInteger;

  if LAnamneseId > 0 then
    AtualizarAnamnese(LAnamneseId, ADados)
  else
    CriarAnamnese(AConsultaId, ADados);
end;

function TConsultaService.ObterAnamnese(AConsultaId: Integer): TJSONObject;
var
  LQuery: iQuery;
begin
  Result := nil;
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT FIRST 1 ANA_ID FROM ANAMNESES WHERE ANA_CONSULTA_ID = :CONSULTA_ID ORDER BY ANA_DATA DESC');
  LQuery.AddParam('CONSULTA_ID', AConsultaId);
  LQuery.Open;
  if not LQuery.DataSet.IsEmpty then
    Result := AnamneseToJSON(LQuery.DataSet.FieldByName('ANA_ID').AsInteger);
end;

function TConsultaService.ImpressaoAnamnese(AAnamneseId: Integer): TJSONObject;
begin
  Result := AnamneseToJSON(AAnamneseId);
  Result.AddPair('modelo', 'impressao anamnese');
end;

function TConsultaService.ListarPrescricoes(AConsultaId: Integer): TJSONArray;
var
  LQuery: iQuery;
begin
  ValidarConsultaExiste(AConsultaId);
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT REC_ID AS ID, REC_CONSULTA_ID AS CONSULTA_ID, REC_TITULO AS TITULO, ');
  LQuery.Add('REC_OD_ESFERICO AS OD_ESFERICO, REC_OD_CILINDRICO AS OD_CILINDRICO, REC_OD_EIXO AS OD_EIXO, ');
  LQuery.Add('REC_OD_AV AS OD_AV, REC_OD_PRISMA AS OD_PRISMA, REC_OD_DNP AS OD_DNP, ');
  LQuery.Add('REC_OE_ESFERICO AS OE_ESFERICO, REC_OE_CILINDRICO AS OE_CILINDRICO, REC_OE_EIXO AS OE_EIXO, ');
  LQuery.Add('REC_OE_AV AS OE_AV, REC_OE_PRISMA AS OE_PRISMA, REC_OE_DNP AS OE_DNP, ');
  LQuery.Add('REC_ADICAO AS ADICAO, REC_LENTE AS LENTE, REC_RETORNO AS RETORNO, ');
  LQuery.Add('REC_OBSERVACOES AS OBSERVACOES, REC_DATA AS DATA ');
  LQuery.Add('FROM PRESCRICOES WHERE REC_CONSULTA_ID = :CONSULTA_ID ORDER BY REC_DATA DESC');
  LQuery.AddParam('CONSULTA_ID', AConsultaId);
  LQuery.Open;
  Result := TDatasetJsonUtils.QueryToJSONArray(LQuery.DataSet);
end;

function TConsultaService.PrescricaoToJSON(APrescricaoId: Integer): TJSONObject;
var
  LPrescricao: TModelPrescricao;
begin
  LPrescricao := TModelPrescricao.Create(TDatabase.Connection);
  try
    LPrescricao.BuscaDadosTabela(APrescricaoId);
    if LPrescricao.Id <= 0 then
      raise EConsultaNaoEncontrada.Create('Prescricao nao encontrada');

    Result := TJSONObject.Create;
    Result.AddPair('id', TJSONNumber.Create(LPrescricao.Id));
    Result.AddPair('consulta_id', TJSONNumber.Create(LPrescricao.ConsultaId));
    AddStringPair(Result, 'titulo', LPrescricao.Titulo);
    AddStringPair(Result, 'od_esferico', LPrescricao.ODEsferico);
    AddStringPair(Result, 'od_cilindrico', LPrescricao.ODCilindrico);
    AddStringPair(Result, 'od_eixo', LPrescricao.ODEixo);
    AddStringPair(Result, 'od_av', LPrescricao.ODAv);
    AddStringPair(Result, 'od_prisma', LPrescricao.ODPrisma);
    AddStringPair(Result, 'od_dnp', LPrescricao.ODDnp);
    AddStringPair(Result, 'oe_esferico', LPrescricao.OEEsferico);
    AddStringPair(Result, 'oe_cilindrico', LPrescricao.OECilindrico);
    AddStringPair(Result, 'oe_eixo', LPrescricao.OEEixo);
    AddStringPair(Result, 'oe_av', LPrescricao.OEAv);
    AddStringPair(Result, 'oe_prisma', LPrescricao.OEPrisma);
    AddStringPair(Result, 'oe_dnp', LPrescricao.OEDnp);
    AddStringPair(Result, 'adicao', LPrescricao.Adicao);
    AddStringPair(Result, 'lente', LPrescricao.Lente);
    AddDatePair(Result, 'retorno', LPrescricao.Retorno);
    AddStringPair(Result, 'observacoes', LPrescricao.Observacoes);
    AddDatePair(Result, 'data', LPrescricao.Data);
  finally
    LPrescricao.Free;
  end;
end;

function TConsultaService.ObterPrescricaoPorId(APrescricaoId: Integer): TJSONObject;
begin
  Result := PrescricaoToJSON(APrescricaoId);
end;

function TConsultaService.CriarPrescricao(AConsultaId: Integer; ADados: TJSONObject): Integer;
var
  LPrescricao: TModelPrescricao;
begin
  ValidarConsultaExiste(AConsultaId);
  if not Assigned(ADados) then
    raise EConsultaValidacao.Create('Payload invalido');

  LPrescricao := TModelPrescricao.Create(TDatabase.Connection);
  try
    LPrescricao.Id := LPrescricao.GeraCodigo('REC_ID');
    LPrescricao.ConsultaId := AConsultaId;
    LPrescricao.Titulo := JsonString(ADados, 'titulo', 'Prescricao para Oculos');
    LPrescricao.ODEsferico := JsonString(ADados, 'od_esferico');
    LPrescricao.ODCilindrico := JsonString(ADados, 'od_cilindrico');
    LPrescricao.ODEixo := JsonString(ADados, 'od_eixo');
    LPrescricao.ODAv := JsonString(ADados, 'od_av');
    LPrescricao.ODPrisma := JsonString(ADados, 'od_prisma');
    LPrescricao.ODDnp := JsonString(ADados, 'od_dnp');
    LPrescricao.OEEsferico := JsonString(ADados, 'oe_esferico');
    LPrescricao.OECilindrico := JsonString(ADados, 'oe_cilindrico');
    LPrescricao.OEEixo := JsonString(ADados, 'oe_eixo');
    LPrescricao.OEAv := JsonString(ADados, 'oe_av');
    LPrescricao.OEPrisma := JsonString(ADados, 'oe_prisma');
    LPrescricao.OEDnp := JsonString(ADados, 'oe_dnp');
    LPrescricao.Adicao := JsonString(ADados, 'adicao');
    LPrescricao.Lente := JsonString(ADados, 'lente');
    LPrescricao.Retorno := JsonDate(ADados, 'retorno');
    LPrescricao.Observacoes := JsonString(ADados, 'observacoes');
    LPrescricao.Data := Now;
    LPrescricao.SalvaNoBanco(1);
    Result := LPrescricao.Id;
  finally
    LPrescricao.Free;
  end;
end;

procedure TConsultaService.AtualizarPrescricao(APrescricaoId: Integer; ADados: TJSONObject);
var
  LPrescricao: TModelPrescricao;
begin
  if not Assigned(ADados) then
    raise EConsultaValidacao.Create('Payload invalido');

  LPrescricao := TModelPrescricao.Create(TDatabase.Connection);
  try
    LPrescricao.BuscaDadosTabela(APrescricaoId);
    if LPrescricao.Id <= 0 then
      raise EConsultaNaoEncontrada.Create('Prescricao nao encontrada');

    LPrescricao.Titulo := JsonString(ADados, 'titulo', 'Prescricao para Oculos');
    LPrescricao.ODEsferico := JsonString(ADados, 'od_esferico');
    LPrescricao.ODCilindrico := JsonString(ADados, 'od_cilindrico');
    LPrescricao.ODEixo := JsonString(ADados, 'od_eixo');
    LPrescricao.ODAv := JsonString(ADados, 'od_av');
    LPrescricao.ODPrisma := JsonString(ADados, 'od_prisma');
    LPrescricao.ODDnp := JsonString(ADados, 'od_dnp');
    LPrescricao.OEEsferico := JsonString(ADados, 'oe_esferico');
    LPrescricao.OECilindrico := JsonString(ADados, 'oe_cilindrico');
    LPrescricao.OEEixo := JsonString(ADados, 'oe_eixo');
    LPrescricao.OEAv := JsonString(ADados, 'oe_av');
    LPrescricao.OEPrisma := JsonString(ADados, 'oe_prisma');
    LPrescricao.OEDnp := JsonString(ADados, 'oe_dnp');
    LPrescricao.Adicao := JsonString(ADados, 'adicao');
    LPrescricao.Lente := JsonString(ADados, 'lente');
    LPrescricao.Retorno := JsonDate(ADados, 'retorno');
    LPrescricao.Observacoes := JsonString(ADados, 'observacoes');
    LPrescricao.Data := Now;
    LPrescricao.SalvaNoBanco(1);
  finally
    LPrescricao.Free;
  end;
end;

procedure TConsultaService.ExcluirPrescricao(APrescricaoId: Integer);
var
  LPrescricao: TModelPrescricao;
begin
  LPrescricao := TModelPrescricao.Create(TDatabase.Connection);
  try
    LPrescricao.BuscaDadosTabela(APrescricaoId);
    if LPrescricao.Id <= 0 then
      raise EConsultaNaoEncontrada.Create('Prescricao nao encontrada');
    LPrescricao.Apagar(APrescricaoId);
  finally
    LPrescricao.Free;
  end;
end;

function TConsultaService.ImpressaoPrescricao(APrescricaoId: Integer): TJSONObject;
begin
  Result := PrescricaoToJSON(APrescricaoId);
  Result.AddPair('modelo', 'impressao prescricao');
end;

function TConsultaService.ListarDocumentos(AConsultaId: Integer): TJSONArray;
var
  LQuery: iQuery;
begin
  ValidarConsultaExiste(AConsultaId);
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT DOC_ID AS ID, DOC_CONSULTA_ID AS CONSULTA_ID, DOC_PACIENTE_ID AS PACIENTE_ID, ');
  LQuery.Add('DOC_TIPO AS TIPO, DOC_TITULO AS TITULO, DOC_NOME_ARQUIVO AS NOME, ');
  LQuery.Add('DOC_CAMINHO_ARQUIVO AS URL, DOC_MIME_TYPE AS MIME_TYPE, DOC_TAMANHO AS TAMANHO, ');
  LQuery.Add('DOC_DATA_UPLOAD AS DATA_UPLOAD ');
  LQuery.Add('FROM DOCUMENTOS_CONSULTA WHERE DOC_CONSULTA_ID = :CONSULTA_ID ORDER BY DOC_DATA_UPLOAD DESC');
  LQuery.AddParam('CONSULTA_ID', AConsultaId);
  LQuery.Open;
  Result := TDatasetJsonUtils.QueryToJSONArray(LQuery.DataSet);
end;

function TConsultaService.DocumentoToJSON(ADocumentoId: Integer): TJSONObject;
var
  LDocumento: TModelDocumentoConsulta;
begin
  LDocumento := TModelDocumentoConsulta.Create(TDatabase.Connection);
  try
    LDocumento.BuscaDadosTabela(ADocumentoId);
    if LDocumento.Id <= 0 then
      raise EConsultaNaoEncontrada.Create('Documento nao encontrado');

    Result := TJSONObject.Create;
    Result.AddPair('id', TJSONNumber.Create(LDocumento.Id));
    Result.AddPair('consulta_id', TJSONNumber.Create(LDocumento.ConsultaId));
    Result.AddPair('paciente_id', TJSONNumber.Create(LDocumento.PacienteId));
    AddStringPair(Result, 'tipo', LDocumento.Tipo);
    AddStringPair(Result, 'titulo', LDocumento.Titulo);
    AddStringPair(Result, 'nome', LDocumento.NomeArquivo);
    AddStringPair(Result, 'url', LDocumento.CaminhoArquivo);
    AddStringPair(Result, 'mime_type', LDocumento.MimeType);
    Result.AddPair('tamanho', TJSONNumber.Create(LDocumento.Tamanho));
    AddDatePair(Result, 'data_upload', LDocumento.DataUpload);
  finally
    LDocumento.Free;
  end;
end;

function TConsultaService.CriarDocumento(AConsultaId: Integer; ADados: TJSONObject): Integer;
var
  LDocumento: TModelDocumentoConsulta;
begin
  ValidarConsultaExiste(AConsultaId);
  if not Assigned(ADados) then
    raise EConsultaValidacao.Create('Payload invalido');

  LDocumento := TModelDocumentoConsulta.Create(TDatabase.Connection);
  try
    LDocumento.Id := LDocumento.GeraCodigo('DOC_ID');
    LDocumento.ConsultaId := AConsultaId;
    LDocumento.PacienteId := ConsultaPacienteId(AConsultaId);
    LDocumento.Tipo := JsonString(ADados, 'tipo', 'documento');
    LDocumento.Titulo := JsonString(ADados, 'titulo');
    LDocumento.NomeArquivo := JsonString(ADados, 'nome', JsonString(ADados, 'nome_arquivo'));
    LDocumento.CaminhoArquivo := JsonString(ADados, 'url', JsonString(ADados, 'caminho_arquivo'));
    LDocumento.MimeType := JsonString(ADados, 'mime_type');
    LDocumento.Tamanho := JsonInt(ADados, 'tamanho');
    LDocumento.DataUpload := Now;
    LDocumento.SalvaNoBanco(1);
    Result := LDocumento.Id;
  finally
    LDocumento.Free;
  end;
end;

end.
