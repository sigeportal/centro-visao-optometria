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
    procedure ValidarConsultaEditavel(AConsultaId: Integer);
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
    procedure AtualizarPrescricao(APrescricaoId: Integer; ADados: TJSONObject; AConsultaId: Integer = 0);
    procedure ExcluirPrescricao(APrescricaoId: Integer; AConsultaId: Integer = 0);
    function ImpressaoPrescricao(APrescricaoId: Integer): TJSONObject;

    function ListarDocumentos(AConsultaId: Integer): TJSONArray;
    function ObterDocumentoPorId(ADocumentoId: Integer): TJSONObject;
    function CriarDocumento(AConsultaId, AUsuarioId: Integer; ADados: TJSONObject): Integer;
    procedure AtualizarDocumento(ADocumentoId, AUsuarioId: Integer; ADados: TJSONObject);
    procedure EmitirDocumento(ADocumentoId, AUsuarioId: Integer);
    function ImpressaoDocumento(ADocumentoId: Integer): TJSONObject;
    function ListarAnexos(AConsultaId: Integer): TJSONArray;
    function CriarAnexo(AConsultaId, AUsuarioId: Integer; ADados: TJSONObject): Integer;
  end;

implementation

uses
  System.DateUtils,
  System.StrUtils,
  UnitConnection.Model.Interfaces,
  UnitDatabase,
  Models.Clinica,
  Atendimento.Service,
  Dataset.JSON.Utils;

const
  STATUS_AGENDADA = 'agendada';
  STATUS_CONFIRMADA = 'confirmada';
  STATUS_ATENDIDA = 'atendida';
  STATUS_CANCELADA = 'cancelada';
  STATUS_REALIZADA = 'realizada';
  STATUS_EM_ATENDIMENTO = 'em_atendimento';
  DOCUMENTO_RASCUNHO = 'rascunho';
  DOCUMENTO_EMITIDO = 'emitido';
  DOCUMENTO_SUBSTITUIDO = 'substituido';
  DOCUMENTO_ANEXO = 'anexo';
  ANEXO_VINCULADO = 'vinculado';

function CampoDocumentoExiste(const ACampo: string): Boolean;
var
  LQuery: iQuery;
begin
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT COUNT(*) AS TOTAL FROM RDB$RELATION_FIELDS ');
  LQuery.Add('WHERE TRIM(RDB$RELATION_NAME) = ''DOCUMENTOS_CONSULTA'' ');
  LQuery.Add('AND TRIM(RDB$FIELD_NAME) = :CAMPO');
  LQuery.AddParam('CAMPO', UpperCase(ACampo));
  LQuery.Open;
  Result := LQuery.DataSet.FieldByName('TOTAL').AsInteger > 0;
end;

procedure GarantirCampoDocumento(const ACampo, ATipo: string);
var
  LQuery: iQuery;
begin
  if CampoDocumentoExiste(ACampo) then
    Exit;
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('ALTER TABLE DOCUMENTOS_CONSULTA ADD ' + ACampo + ' ' + ATipo);
  LQuery.ExecSQL;
end;

function TipoDocumentoPermitido(const ATipo: string): Boolean;
begin
  Result :=
    (ATipo = 'atestado') or
    (ATipo = 'laudo') or
    (ATipo = 'declaracao') or
    (ATipo = 'termo_autorizacao') or
    (ATipo = 'encaminhamento');
end;

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

  GarantirCampoDocumento('DOC_CRIADO_POR', 'INTEGER');
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
  LQuery.Add('P.PAC_OCUPACAO AS PACIENTE_OCUPACAO, P.PAC_CPF AS PACIENTE_CPF, ');
  LQuery.Add('P.PAC_RG AS PACIENTE_RG, P.PAC_RESPONSAVEL_NOME AS PACIENTE_RESPONSAVEL, ');
  LQuery.Add('P.PAC_ENDERECO AS PACIENTE_ENDERECO, P.PAC_COMPLEMENTO AS PACIENTE_COMPLEMENTO, ');
  LQuery.Add('P.PAC_CIDADE AS PACIENTE_CIDADE, P.PAC_ESTADO AS PACIENTE_ESTADO, P.PAC_CEP AS PACIENTE_CEP ');
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
  LAtendimento: TAtendimentoService;
  LStatus: string;
begin
  if AAgendamentoId <= 0 then
    raise EConsultaValidacao.Create('Inicie o atendimento a partir de um agendamento valido');

  LAtendimento := TAtendimentoService.Create;
  try
    try
      Result := LAtendimento.Iniciar(AAgendamentoId, LStatus);
    except
      on E: EAtendimentoNaoEncontrado do
        raise EConsultaValidacao.Create(E.Message);
      on E: EAtendimentoValidacao do
        raise EConsultaValidacao.Create(E.Message);
    end;
  finally
    LAtendimento.Free;
  end;
end;

function JsonModoPrescricao(ADados: TJSONObject): string;
begin
  Result := LowerCase(JsonString(ADados, 'modo', 'longe'));
  if (Result <> 'longe') and (Result <> 'longe_perto') then
    raise EConsultaValidacao.Create('Modo da prescricao invalido');
end;

procedure TConsultaService.ValidarConsultaEditavel(AConsultaId: Integer);
var
  LConsulta: TModelConsulta;
  LStatus: string;
begin
  LConsulta := TModelConsulta.Create(TDatabase.Connection);
  try
    LConsulta.BuscaDadosTabela(AConsultaId);
    if LConsulta.Id <= 0 then
      raise EConsultaNaoEncontrada.Create('Consulta nao encontrada');
    LStatus := LowerCase(Trim(LConsulta.Status));
    if (LStatus <> STATUS_EM_ATENDIMENTO) and
      (LStatus <> STATUS_REALIZADA) and (LStatus <> STATUS_ATENDIDA) then
      raise EConsultaValidacao.Create(
        'Os dados clinicos somente podem ser alterados durante ou apos o atendimento');
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
  ValidarConsultaEditavel(AConsultaId);
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

    ValidarConsultaEditavel(LAnamnese.ConsultaId);

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
    ValidarConsultaEditavel(LAnamnese.ConsultaId);
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
  LQuery.Add('SELECT REC_ID AS ID, REC_CONSULTA_ID AS CONSULTA_ID, REC_TITULO AS TITULO, REC_MODO AS MODO, ');
  LQuery.Add('REC_OD_ESFERICO AS OD_ESFERICO, REC_OD_CILINDRICO AS OD_CILINDRICO, REC_OD_EIXO AS OD_EIXO, ');
  LQuery.Add('REC_OD_AV AS OD_AV, REC_OD_PRISMA AS OD_PRISMA, REC_OD_DNP AS OD_DNP, ');
  LQuery.Add('REC_OE_ESFERICO AS OE_ESFERICO, REC_OE_CILINDRICO AS OE_CILINDRICO, REC_OE_EIXO AS OE_EIXO, ');
  LQuery.Add('REC_OE_AV AS OE_AV, REC_OE_PRISMA AS OE_PRISMA, REC_OE_DNP AS OE_DNP, ');
  LQuery.Add('REC_OD_PERTO_ESFERICO AS OD_PERTO_ESFERICO, REC_OD_PERTO_CILINDRICO AS OD_PERTO_CILINDRICO, ');
  LQuery.Add('REC_OD_PERTO_EIXO AS OD_PERTO_EIXO, REC_OD_PERTO_AV AS OD_PERTO_AV, REC_OD_PERTO_PRISMA AS OD_PERTO_PRISMA, REC_OD_PERTO_DNP AS OD_PERTO_DNP, ');
  LQuery.Add('REC_OE_PERTO_ESFERICO AS OE_PERTO_ESFERICO, REC_OE_PERTO_CILINDRICO AS OE_PERTO_CILINDRICO, ');
  LQuery.Add('REC_OE_PERTO_EIXO AS OE_PERTO_EIXO, REC_OE_PERTO_AV AS OE_PERTO_AV, REC_OE_PERTO_PRISMA AS OE_PERTO_PRISMA, REC_OE_PERTO_DNP AS OE_PERTO_DNP, ');
  LQuery.Add('REC_ADICAO AS ADICAO, REC_LENTE AS LENTE, ');
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
    AddStringPair(Result, 'modo', LPrescricao.Modo);
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
    AddStringPair(Result, 'od_perto_esferico', LPrescricao.ODPertoEsferico);
    AddStringPair(Result, 'od_perto_cilindrico', LPrescricao.ODPertoCilindrico);
    AddStringPair(Result, 'od_perto_eixo', LPrescricao.ODPertoEixo);
    AddStringPair(Result, 'od_perto_av', LPrescricao.ODPertoAv);
    AddStringPair(Result, 'od_perto_prisma', LPrescricao.ODPertoPrisma);
    AddStringPair(Result, 'od_perto_dnp', LPrescricao.ODPertoDnp);
    AddStringPair(Result, 'oe_perto_esferico', LPrescricao.OEPertoEsferico);
    AddStringPair(Result, 'oe_perto_cilindrico', LPrescricao.OEPertoCilindrico);
    AddStringPair(Result, 'oe_perto_eixo', LPrescricao.OEPertoEixo);
    AddStringPair(Result, 'oe_perto_av', LPrescricao.OEPertoAv);
    AddStringPair(Result, 'oe_perto_prisma', LPrescricao.OEPertoPrisma);
    AddStringPair(Result, 'oe_perto_dnp', LPrescricao.OEPertoDnp);
    AddStringPair(Result, 'adicao', LPrescricao.Adicao);
    AddStringPair(Result, 'lente', LPrescricao.Lente);
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
    LPrescricao.Modo := JsonModoPrescricao(ADados);
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
    LPrescricao.ODPertoEsferico := JsonString(ADados, 'od_perto_esferico');
    LPrescricao.ODPertoCilindrico := JsonString(ADados, 'od_perto_cilindrico');
    LPrescricao.ODPertoEixo := JsonString(ADados, 'od_perto_eixo');
    LPrescricao.ODPertoAv := JsonString(ADados, 'od_perto_av');
    LPrescricao.ODPertoPrisma := JsonString(ADados, 'od_perto_prisma');
    LPrescricao.ODPertoDnp := JsonString(ADados, 'od_perto_dnp');
    LPrescricao.OEPertoEsferico := JsonString(ADados, 'oe_perto_esferico');
    LPrescricao.OEPertoCilindrico := JsonString(ADados, 'oe_perto_cilindrico');
    LPrescricao.OEPertoEixo := JsonString(ADados, 'oe_perto_eixo');
    LPrescricao.OEPertoAv := JsonString(ADados, 'oe_perto_av');
    LPrescricao.OEPertoPrisma := JsonString(ADados, 'oe_perto_prisma');
    LPrescricao.OEPertoDnp := JsonString(ADados, 'oe_perto_dnp');
    LPrescricao.Adicao := JsonString(ADados, 'adicao');
    LPrescricao.Lente := JsonString(ADados, 'lente');
    LPrescricao.Observacoes := JsonString(ADados, 'observacoes');
    LPrescricao.Data := Now;
    LPrescricao.SalvaNoBanco(1);
    Result := LPrescricao.Id;
  finally
    LPrescricao.Free;
  end;
end;

procedure TConsultaService.AtualizarPrescricao(APrescricaoId: Integer; ADados: TJSONObject; AConsultaId: Integer);
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

    if (AConsultaId > 0) and (LPrescricao.ConsultaId <> AConsultaId) then
      raise EConsultaValidacao.Create('A prescricao informada nao pertence a esta consulta');

    ValidarConsultaEditavel(LPrescricao.ConsultaId);

    LPrescricao.Titulo := JsonString(ADados, 'titulo', 'Prescricao para Oculos');
    LPrescricao.Modo := JsonModoPrescricao(ADados);
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
    LPrescricao.ODPertoEsferico := JsonString(ADados, 'od_perto_esferico');
    LPrescricao.ODPertoCilindrico := JsonString(ADados, 'od_perto_cilindrico');
    LPrescricao.ODPertoEixo := JsonString(ADados, 'od_perto_eixo');
    LPrescricao.ODPertoAv := JsonString(ADados, 'od_perto_av');
    LPrescricao.ODPertoPrisma := JsonString(ADados, 'od_perto_prisma');
    LPrescricao.ODPertoDnp := JsonString(ADados, 'od_perto_dnp');
    LPrescricao.OEPertoEsferico := JsonString(ADados, 'oe_perto_esferico');
    LPrescricao.OEPertoCilindrico := JsonString(ADados, 'oe_perto_cilindrico');
    LPrescricao.OEPertoEixo := JsonString(ADados, 'oe_perto_eixo');
    LPrescricao.OEPertoAv := JsonString(ADados, 'oe_perto_av');
    LPrescricao.OEPertoPrisma := JsonString(ADados, 'oe_perto_prisma');
    LPrescricao.OEPertoDnp := JsonString(ADados, 'oe_perto_dnp');
    LPrescricao.Adicao := JsonString(ADados, 'adicao');
    LPrescricao.Lente := JsonString(ADados, 'lente');
    LPrescricao.Observacoes := JsonString(ADados, 'observacoes');
    LPrescricao.Data := Now;
    LPrescricao.SalvaNoBanco(1);
  finally
    LPrescricao.Free;
  end;
end;

procedure TConsultaService.ExcluirPrescricao(APrescricaoId: Integer; AConsultaId: Integer);
var
  LPrescricao: TModelPrescricao;
begin
  LPrescricao := TModelPrescricao.Create(TDatabase.Connection);
  try
    LPrescricao.BuscaDadosTabela(APrescricaoId);
    if LPrescricao.Id <= 0 then
      raise EConsultaNaoEncontrada.Create('Prescricao nao encontrada');

    if (AConsultaId > 0) and (LPrescricao.ConsultaId <> AConsultaId) then
      raise EConsultaValidacao.Create('A prescricao informada nao pertence a esta consulta');

    ValidarConsultaEditavel(LPrescricao.ConsultaId);

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
  LQuery.Add('DOC_TIPO AS TIPO, DOC_TITULO AS TITULO, COALESCE(DOC_STATUS, ''rascunho'') AS STATUS, ');
  LQuery.Add('COALESCE(DOC_VERSAO, 1) AS VERSAO, DOC_ORIGEM_ID AS ORIGEM_ID, ');
  LQuery.Add('DOC_EMITIDO_POR AS EMITIDO_POR, DOC_EMITIDO_EM AS EMITIDO_EM, ');
  LQuery.Add('DOC_ATUALIZADO_POR AS ATUALIZADO_POR, DOC_ATUALIZADO_EM AS ATUALIZADO_EM, ');
  LQuery.Add('DOC_NOME_ARQUIVO AS NOME, ');
  LQuery.Add('DOC_MIME_TYPE AS MIME_TYPE, DOC_TAMANHO AS TAMANHO, DOC_DATA_UPLOAD AS DATA_UPLOAD ');
  LQuery.Add('FROM DOCUMENTOS_CONSULTA WHERE DOC_CONSULTA_ID = :CONSULTA_ID ');
  LQuery.Add('AND (DOC_TIPO IS NULL OR DOC_TIPO <> :TIPO_ANEXO) ');
  LQuery.Add('ORDER BY COALESCE(DOC_ATUALIZADO_EM, DOC_DATA_UPLOAD) DESC, DOC_ID DESC');
  LQuery.AddParam('CONSULTA_ID', AConsultaId);
  LQuery.AddParam('TIPO_ANEXO', DOCUMENTO_ANEXO);
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
    AddStringPair(Result, 'mime_type', LDocumento.MimeType);
    Result.AddPair('tamanho', TJSONNumber.Create(LDocumento.Tamanho));
    AddDatePair(Result, 'data_upload', LDocumento.DataUpload);
    AddStringPair(Result, 'conteudo', LDocumento.Conteudo);
    if LDocumento.Status = '' then
      Result.AddPair('status', DOCUMENTO_RASCUNHO)
    else
      Result.AddPair('status', LDocumento.Status);
    if LDocumento.Versao <= 0 then
      Result.AddPair('versao', TJSONNumber.Create(1))
    else
      Result.AddPair('versao', TJSONNumber.Create(LDocumento.Versao));
    Result.AddPair('origem_id', TJSONNumber.Create(LDocumento.DocumentoOrigemId));
    Result.AddPair('emitido_por', TJSONNumber.Create(LDocumento.EmitidoPor));
    AddDatePair(Result, 'emitido_em', LDocumento.EmitidoEm);
    Result.AddPair('atualizado_por', TJSONNumber.Create(LDocumento.AtualizadoPor));
    AddDatePair(Result, 'atualizado_em', LDocumento.AtualizadoEm);
  finally
    LDocumento.Free;
  end;
end;

function TConsultaService.ObterDocumentoPorId(ADocumentoId: Integer): TJSONObject;
begin
  Result := DocumentoToJSON(ADocumentoId);
end;

function TConsultaService.CriarDocumento(AConsultaId, AUsuarioId: Integer; ADados: TJSONObject): Integer;
var
  LDocumento: TModelDocumentoConsulta;
  LOrigem: TModelDocumentoConsulta;
  LTipo: string;
  LOrigemId: Integer;
begin
  ValidarConsultaEditavel(AConsultaId);
  if not Assigned(ADados) then
    raise EConsultaValidacao.Create('Payload invalido');

  LTipo := LowerCase(JsonString(ADados, 'tipo'));
  if not TipoDocumentoPermitido(LTipo) then
    raise EConsultaValidacao.Create('Tipo de documento invalido');
  if JsonString(ADados, 'conteudo') = '' then
    raise EConsultaValidacao.Create('Conteudo do documento e obrigatorio');

  LOrigemId := JsonInt(ADados, 'origem_id');

  LDocumento := TModelDocumentoConsulta.Create(TDatabase.Connection);
  try
    LDocumento.Id := LDocumento.GeraCodigo('DOC_ID');
    LDocumento.ConsultaId := AConsultaId;
    LDocumento.PacienteId := ConsultaPacienteId(AConsultaId);
    LDocumento.Tipo := LTipo;
    LDocumento.Titulo := JsonString(ADados, 'titulo');
    LDocumento.NomeArquivo := JsonString(ADados, 'nome', JsonString(ADados, 'nome_arquivo'));
    LDocumento.CaminhoArquivo := JsonString(ADados, 'url', JsonString(ADados, 'caminho_arquivo'));
    LDocumento.MimeType := JsonString(ADados, 'mime_type');
    LDocumento.Tamanho := JsonInt(ADados, 'tamanho');
    LDocumento.DataUpload := Now;
    LDocumento.Conteudo := JsonString(ADados, 'conteudo');
    LDocumento.Status := DOCUMENTO_RASCUNHO;
    LDocumento.Versao := 1;
    LDocumento.DocumentoOrigemId := 0;
    LDocumento.AtualizadoPor := AUsuarioId;
    LDocumento.AtualizadoEm := Now;

    if LOrigemId > 0 then
    begin
      LOrigem := TModelDocumentoConsulta.Create(TDatabase.Connection);
      try
        LOrigem.BuscaDadosTabela(LOrigemId);
        if (LOrigem.Id <= 0) or (LOrigem.ConsultaId <> AConsultaId) then
          raise EConsultaValidacao.Create('Documento de origem invalido');
        if LowerCase(LOrigem.Status) <> DOCUMENTO_EMITIDO then
          raise EConsultaValidacao.Create('Somente documentos emitidos podem gerar nova versao');
        LDocumento.DocumentoOrigemId := LOrigem.Id;
        if LOrigem.DocumentoOrigemId > 0 then
          LDocumento.DocumentoOrigemId := LOrigem.DocumentoOrigemId;
        LDocumento.Versao := LOrigem.Versao + 1;
      finally
        LOrigem.Free;
      end;
    end;

    LDocumento.SalvaNoBanco(1);
    Result := LDocumento.Id;
  finally
    LDocumento.Free;
  end;
end;

procedure TConsultaService.AtualizarDocumento(ADocumentoId, AUsuarioId: Integer; ADados: TJSONObject);
var
  LDocumento: TModelDocumentoConsulta;
  LTipo, LNome, LURL: string;
begin
  if not Assigned(ADados) then
    raise EConsultaValidacao.Create('Payload invalido');

  LDocumento := TModelDocumentoConsulta.Create(TDatabase.Connection);
  try
    LDocumento.BuscaDadosTabela(ADocumentoId);
    if LDocumento.Id <= 0 then
      raise EConsultaNaoEncontrada.Create('Documento nao encontrado');
    ValidarConsultaEditavel(LDocumento.ConsultaId);

    if SameText(Trim(LDocumento.Tipo), DOCUMENTO_ANEXO) then
    begin
      LNome := JsonString(ADados, 'nome', LDocumento.NomeArquivo);
      LURL := JsonString(ADados, 'url', LDocumento.CaminhoArquivo);
      if (LNome = '') or (Length(LNome) > 255) then
        raise EConsultaValidacao.Create('Nome do documento invalido');
      if (Length(LURL) > 500) or
        ((not StartsText('https://', LURL)) and
         (not StartsText('http://', LURL))) then
        raise EConsultaValidacao.Create(
          'Informe um link valido iniciado por http:// ou https://');
      LDocumento.Titulo := JsonString(ADados, 'titulo', LNome);
      LDocumento.NomeArquivo := LNome;
      LDocumento.CaminhoArquivo := LURL;
      LDocumento.AtualizadoPor := AUsuarioId;
      LDocumento.AtualizadoEm := Now;
      LDocumento.SalvaNoBanco(1);
      Exit;
    end;

    if (LDocumento.Status <> '') and
      (LowerCase(LDocumento.Status) <> DOCUMENTO_RASCUNHO) then
      raise EConsultaValidacao.Create('Documento emitido nao pode ser alterado; crie uma nova versao');

    LTipo := LowerCase(JsonString(ADados, 'tipo', LDocumento.Tipo));
    if not TipoDocumentoPermitido(LTipo) then
      raise EConsultaValidacao.Create('Tipo de documento invalido');
    if JsonString(ADados, 'conteudo') = '' then
      raise EConsultaValidacao.Create('Conteudo do documento e obrigatorio');

    LDocumento.Tipo := LTipo;
    LDocumento.Titulo := JsonString(ADados, 'titulo', LDocumento.Titulo);
    LDocumento.Conteudo := JsonString(ADados, 'conteudo');
    LDocumento.Status := DOCUMENTO_RASCUNHO;
    if LDocumento.Versao <= 0 then
      LDocumento.Versao := 1;
    LDocumento.AtualizadoPor := AUsuarioId;
    LDocumento.AtualizadoEm := Now;
    LDocumento.SalvaNoBanco(1);
  finally
    LDocumento.Free;
  end;
end;

procedure TConsultaService.EmitirDocumento(ADocumentoId, AUsuarioId: Integer);
var
  LDocumento: TModelDocumentoConsulta;
  LAnterior: TModelDocumentoConsulta;
  LQuery: iQuery;
  LAnteriorId: Integer;
begin
  LAnteriorId := 0;
  LDocumento := TModelDocumentoConsulta.Create(TDatabase.Connection);
  try
    LDocumento.BuscaDadosTabela(ADocumentoId);
    if LDocumento.Id <= 0 then
      raise EConsultaNaoEncontrada.Create('Documento nao encontrado');
    ValidarConsultaEditavel(LDocumento.ConsultaId);
    if (LDocumento.Status <> '') and
      (LowerCase(LDocumento.Status) <> DOCUMENTO_RASCUNHO) then
      raise EConsultaValidacao.Create('Documento ja foi emitido');
    if Trim(LDocumento.Conteudo) = '' then
      raise EConsultaValidacao.Create('Conteudo do documento e obrigatorio');

    if LDocumento.DocumentoOrigemId > 0 then
    begin
      LQuery := TDatabase.Query;
      LQuery.Clear;
      LQuery.Add('SELECT FIRST 1 DOC_ID FROM DOCUMENTOS_CONSULTA ');
      LQuery.Add('WHERE DOC_CONSULTA_ID = :CONSULTA_ID AND DOC_STATUS = :STATUS ');
      LQuery.Add('AND (DOC_ID = :ORIGEM_ID OR DOC_ORIGEM_ID = :ORIGEM_ID) ');
      LQuery.Add('ORDER BY COALESCE(DOC_VERSAO, 1) DESC');
      LQuery.AddParam('CONSULTA_ID', LDocumento.ConsultaId);
      LQuery.AddParam('STATUS', DOCUMENTO_EMITIDO);
      LQuery.AddParam('ORIGEM_ID', LDocumento.DocumentoOrigemId);
      LQuery.Open;
      if not LQuery.DataSet.IsEmpty then
        LAnteriorId := LQuery.DataSet.Fields[0].AsInteger;
    end;

    LDocumento.Status := DOCUMENTO_EMITIDO;
    LDocumento.EmitidoPor := AUsuarioId;
    LDocumento.EmitidoEm := Now;
    LDocumento.AtualizadoPor := AUsuarioId;
    LDocumento.AtualizadoEm := Now;
    LDocumento.SalvaNoBanco(1);

    if LAnteriorId > 0 then
    begin
      LAnterior := TModelDocumentoConsulta.Create(TDatabase.Connection);
      try
        LAnterior.BuscaDadosTabela(LAnteriorId);
        if (LAnterior.Id > 0) and (LowerCase(LAnterior.Status) = DOCUMENTO_EMITIDO) then
        begin
          LAnterior.Status := DOCUMENTO_SUBSTITUIDO;
          LAnterior.AtualizadoPor := AUsuarioId;
          LAnterior.AtualizadoEm := Now;
          LAnterior.SalvaNoBanco(1);
        end;
      finally
        LAnterior.Free;
      end;
    end;
  finally
    LDocumento.Free;
  end;
end;

function TConsultaService.ImpressaoDocumento(ADocumentoId: Integer): TJSONObject;
begin
  Result := DocumentoToJSON(ADocumentoId);
  Result.AddPair('modelo', 'impressao documento clinico');
end;

function TConsultaService.ListarAnexos(AConsultaId: Integer): TJSONArray;
var
  LQuery: iQuery;
begin
  ValidarConsultaExiste(AConsultaId);
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT DOC_ID AS ID, DOC_CONSULTA_ID AS CONSULTA_ID, DOC_PACIENTE_ID AS PACIENTE_ID, ');
  LQuery.Add('DOC_TITULO AS TITULO, DOC_NOME_ARQUIVO AS NOME, DOC_CAMINHO_ARQUIVO AS URL, ');
  LQuery.Add('DOC_DATA_UPLOAD AS DATA_UPLOAD, DOC_STATUS AS STATUS, DOC_CRIADO_POR AS CRIADO_POR ');
  LQuery.Add('FROM DOCUMENTOS_CONSULTA WHERE DOC_CONSULTA_ID = :CONSULTA_ID AND DOC_TIPO = :TIPO ');
  LQuery.Add('ORDER BY DOC_DATA_UPLOAD DESC, DOC_ID DESC');
  LQuery.AddParam('CONSULTA_ID', AConsultaId);
  LQuery.AddParam('TIPO', DOCUMENTO_ANEXO);
  LQuery.Open;
  Result := TDatasetJsonUtils.QueryToJSONArray(LQuery.DataSet);
end;

function TConsultaService.CriarAnexo(AConsultaId, AUsuarioId: Integer;
  ADados: TJSONObject): Integer;
var
  LDocumento: TModelDocumentoConsulta;
  LNome, LURL: string;
begin
  ValidarConsultaEditavel(AConsultaId);
  if not Assigned(ADados) then
    raise EConsultaValidacao.Create('Payload invalido');

  LNome := JsonString(ADados, 'nome');
  LURL := JsonString(ADados, 'url');
  if (LNome = '') or (Length(LNome) > 255) then
    raise EConsultaValidacao.Create('Nome do documento invalido');
  if (Length(LURL) > 500) or
    ((not StartsText('https://', LURL)) and (not StartsText('http://', LURL))) then
    raise EConsultaValidacao.Create('Informe um link valido iniciado por http:// ou https://');

  LDocumento := TModelDocumentoConsulta.Create(TDatabase.Connection);
  try
    LDocumento.Id := LDocumento.GeraCodigo('DOC_ID');
    LDocumento.ConsultaId := AConsultaId;
    LDocumento.PacienteId := ConsultaPacienteId(AConsultaId);
    LDocumento.Tipo := DOCUMENTO_ANEXO;
    LDocumento.Titulo := LNome;
    LDocumento.NomeArquivo := LNome;
    LDocumento.CaminhoArquivo := LURL;
    LDocumento.DataUpload := Now;
    LDocumento.Status := ANEXO_VINCULADO;
    LDocumento.CriadoPor := AUsuarioId;
    LDocumento.AtualizadoPor := AUsuarioId;
    LDocumento.AtualizadoEm := Now;
    LDocumento.SalvaNoBanco(1);
    Result := LDocumento.Id;
  finally
    LDocumento.Free;
  end;
end;

end.
