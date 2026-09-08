unit FichaClinicaDados.Service;

interface

uses
  System.JSON,
  System.SysUtils;

type
  EFichaClinicaDadosValidacao = class(Exception);
  EFichaClinicaDadosNaoEncontrada = class(Exception);

  TFichaClinicaDadosService = class
  private
    procedure ValidarConsulta(AConsultaId: Integer; AExigirEditavel: Boolean = False);
    procedure ValidarSecaoConfigurada(const ASecao: string; AExigirAtiva: Boolean);
    procedure ValidarConteudo(const ASecao: string; AConteudo: TJSONObject);
    function DadosToJSON(AId: Integer): TJSONObject;
    function NormalizarSecao(const ASecao: string): string;
  public
    class procedure Inicializar;
    function ObterFicha(AConsultaId: Integer): TJSONObject;
    function ObterSecao(AConsultaId: Integer; const ASecao: string): TJSONObject;
    function SalvarSecao(AConsultaId, AUsuarioId: Integer; const ASecao: string;
      AConteudo: TJSONObject): TJSONObject;
    function ObterCompletude(AConsultaId: Integer): TJSONObject;
  end;

implementation

uses
  System.DateUtils,
  Data.DB,
  UnitConnection.Model.Interfaces,
  UnitDatabase,
  UnitFichaClinicaDados.Model;

const
  VERSAO_CONTRATO = 1;
  STATUS_EM_ATENDIMENTO = 'em_atendimento';
  STATUS_REALIZADA = 'realizada';
  STATUS_ATENDIDA = 'atendida';

function CampoPermitido(const ASecao, ACampo: string): Boolean;
var
  LCampos: string;
begin
  LCampos := '';
  if ASecao = 'prescricao_ultimo_exame' then
    LCampos := 'od,oe,adicao,dnp,altura,tipo_lente,filtro,cor,observacoes,perto,modo'
  else if ASecao = 'acuidade_visual' then
    LCampos := 'optotipo,sem_correcao,com_correcao,visao_habitual,observacoes'
  else if ASecao = 'biomicroscopia' then
    LCampos := 'od,oe,observacoes'
  else if ASecao = 'ceratometria' then
    LCampos := 'tecnica,od,oe,miras,observacoes'
  else if ASecao = 'tonometria' then
    LCampos := 'tecnica,horario,od_mmhg,oe_mmhg,observacoes'
  else if ASecao = 'forometria' then
    LCampos := 'ppc,reflexos_pupilares,cover_test,rfp,rfn,flexibilidade_monocular,ac_a,estereopsia,visao_cromatica,observacoes'
  else if ASecao = 'oftalmoscopia' then
    LCampos := 'tecnica,od,oe,observacoes'
  else if (ASecao = 'retinoscopia_dinamica') or
    (ASecao = 'retinoscopia_estatica') then
    LCampos := 'od,oe,observacoes'
  else if ASecao = 'avaliacao_motora' then
    LCampos := 'kappa,hirschberg,duccoes,versoes,observacoes'
  else if ASecao = 'rx_final' then
    LCampos := 'od,oe,adicao,tipo_lente,filtro,cor,tratamento,observacoes'
  else if ASecao = 'amplitude_acomodacao' then
    LCampos := 'od,oe,distancia,flexibilidade,metodo,ac_a,observacoes'
  else if ASecao = 'afinamento' then
    LCampos := 'od,oe,adicao,observacoes'
  else if ASecao = 'dx' then
    LCampos := 'refrativo,motor,patologico,conduta,controle,encaminhamento,observacoes'
  else if ASecao = 'flexibilidade_acomodacao' then
    LCampos := 'tecnica,od,oe,adicao,observacoes'
  else if ASecao = 'adicao' then
    LCampos := 'od,oe,observacoes'
  else if ASecao = 'ppc' then
    LCampos := 'objeto_real,luz_pontual,filtro_vermelho,olho_dominante,observacoes'
  else if ASecao = 'reflexos_pupilares' then
    LCampos := 'od,oe,observacoes'
  else if ASecao = 'reservas_fusionais' then
    LCampos := 'tecnica,rfn,rfp,observacoes'
  else if ASecao = 'subjetivo' then
    LCampos := 'od,oe,observacoes'
  else if ASecao = 'teste_ambulatorial' then
    LCampos := 'tempo_minutos,resultado,observacoes';

  Result := Pos(',' + LowerCase(Trim(ACampo)) + ',', ',' + LCampos + ',') > 0;
end;

function ValorPossuiConteudo(AValue: TJSONValue): Boolean;
var
  I: Integer;
begin
  Result := False;
  if (not Assigned(AValue)) or (AValue is TJSONNull) then
    Exit;

  if AValue is TJSONString then
    Exit(Trim(AValue.Value) <> '');

  if (AValue is TJSONNumber) or (AValue is TJSONBool) then
    Exit(True);

  if AValue is TJSONObject then
  begin
    for I := 0 to TJSONObject(AValue).Count - 1 do
      if ValorPossuiConteudo(TJSONObject(AValue).Pairs[I].JsonValue) then
        Exit(True);
    Exit(False);
  end;

  if AValue is TJSONArray then
  begin
    for I := 0 to TJSONArray(AValue).Count - 1 do
      if ValorPossuiConteudo(TJSONArray(AValue).Items[I]) then
        Exit(True);
  end;
end;

procedure AddDatePair(AObject: TJSONObject; const AName: string;
  AField: TField);
begin
  if (not Assigned(AField)) or AField.IsNull then
    AObject.AddPair(AName, TJSONNull.Create)
  else
    AObject.AddPair(AName, DateToISO8601(AField.AsDateTime, False));
end;

function ParseConteudo(const AConteudo: string): TJSONValue;
begin
  Result := TJSONObject.ParseJSONValue(AConteudo);
  if not Assigned(Result) then
    Result := TJSONObject.Create;
end;

class procedure TFichaClinicaDadosService.Inicializar;
var
  LModel: TModelFichaClinicaDados;
  LQuery: iQuery;
begin
  LModel := TModelFichaClinicaDados.Create(TDatabase.Connection);
  try
    LModel.CriaTabela;
  finally
    LModel.Free;
  end;

  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT COUNT(*) AS TOTAL FROM RDB$INDICES ');
  LQuery.Add('WHERE TRIM(RDB$INDEX_NAME) = ''UX_FCD_CONSULTA_SECAO''');
  LQuery.Open;
  if LQuery.DataSet.FieldByName('TOTAL').AsInteger = 0 then
  begin
    LQuery.Clear;
    LQuery.Add('CREATE UNIQUE INDEX UX_FCD_CONSULTA_SECAO ');
    LQuery.Add('ON FICHA_CLINICA_DADOS (FCD_CONSULTA_ID, FCD_SECAO)');
    LQuery.ExecSQL;
  end;
end;

function TFichaClinicaDadosService.NormalizarSecao(
  const ASecao: string): string;
begin
  Result := LowerCase(Trim(ASecao));
  if Result = '' then
    raise EFichaClinicaDadosValidacao.Create('Secao da ficha e obrigatoria');
end;

procedure TFichaClinicaDadosService.ValidarConsulta(AConsultaId: Integer;
  AExigirEditavel: Boolean);
var
  LQuery: iQuery;
  LStatus: string;
begin
  if AConsultaId <= 0 then
    raise EFichaClinicaDadosValidacao.Create('Consulta invalida');

  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT CON_STATUS FROM CONSULTAS WHERE CON_ID = :ID');
  LQuery.AddParam('ID', AConsultaId);
  LQuery.Open;
  if LQuery.DataSet.IsEmpty then
    raise EFichaClinicaDadosNaoEncontrada.Create('Consulta nao encontrada');

  LStatus := LowerCase(Trim(LQuery.DataSet.FieldByName('CON_STATUS').AsString));
  if AExigirEditavel and (LStatus <> STATUS_EM_ATENDIMENTO) and
    (LStatus <> STATUS_REALIZADA) and (LStatus <> STATUS_ATENDIDA) then
    raise EFichaClinicaDadosValidacao.Create(
      'A ficha clinica somente pode ser alterada durante ou apos o atendimento');
end;

procedure TFichaClinicaDadosService.ValidarSecaoConfigurada(
  const ASecao: string; AExigirAtiva: Boolean);
var
  LQuery: iQuery;
begin
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT FSC_ATIVO FROM FICHA_SECAO WHERE FSC_CHAVE = :CHAVE');
  LQuery.AddParam('CHAVE', ASecao);
  LQuery.Open;
  if LQuery.DataSet.IsEmpty then
    raise EFichaClinicaDadosValidacao.Create('Secao da ficha nao configurada');
  if AExigirAtiva and
    (LQuery.DataSet.FieldByName('FSC_ATIVO').AsInteger <> 1) then
    raise EFichaClinicaDadosValidacao.Create('Secao da ficha esta inativa');
end;

procedure TFichaClinicaDadosService.ValidarConteudo(const ASecao: string;
  AConteudo: TJSONObject);
var
  I: Integer;
  LCampo: string;
  LTemDiagnostico: Boolean;
begin
  if not Assigned(AConteudo) then
    raise EFichaClinicaDadosValidacao.Create('Conteudo da secao e obrigatorio');
  if AConteudo.Count = 0 then
    raise EFichaClinicaDadosValidacao.Create('Informe ao menos um campo da secao');
  if Length(AConteudo.ToJSON) > 200000 then
    raise EFichaClinicaDadosValidacao.Create('Conteudo da secao excede o limite permitido');

  for I := 0 to AConteudo.Count - 1 do
  begin
    LCampo := LowerCase(Trim(AConteudo.Pairs[I].JsonString.Value));
    if not CampoPermitido(ASecao, LCampo) then
      raise EFichaClinicaDadosValidacao.Create(
        'Campo nao permitido para ' + ASecao + ': ' + LCampo);
  end;

  if ASecao = 'dx' then
  begin
    LTemDiagnostico :=
      ValorPossuiConteudo(AConteudo.GetValue('refrativo')) or
      ValorPossuiConteudo(AConteudo.GetValue('motor')) or
      ValorPossuiConteudo(AConteudo.GetValue('patologico'));
    if not LTemDiagnostico then
      raise EFichaClinicaDadosValidacao.Create(
        'Informe ao menos um diagnostico refrativo, motor ou patologico');
  end;
end;

function TFichaClinicaDadosService.DadosToJSON(AId: Integer): TJSONObject;
var
  LQuery: iQuery;
begin
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT FCD_ID, FCD_CONSULTA_ID, FCD_SECAO, FCD_VERSAO, ');
  LQuery.Add('FCD_CONTEUDO, FCD_CRIADO_POR, FCD_CRIADO_EM, ');
  LQuery.Add('FCD_ATUALIZADO_POR, FCD_ATUALIZADO_EM ');
  LQuery.Add('FROM FICHA_CLINICA_DADOS WHERE FCD_ID = :ID');
  LQuery.AddParam('ID', AId);
  LQuery.Open;
  if LQuery.DataSet.IsEmpty then
    raise EFichaClinicaDadosNaoEncontrada.Create('Dados da ficha nao encontrados');

  Result := TJSONObject.Create;
  Result.AddPair('id', TJSONNumber.Create(LQuery.DataSet.FieldByName('FCD_ID').AsInteger));
  Result.AddPair('consulta_id', TJSONNumber.Create(
    LQuery.DataSet.FieldByName('FCD_CONSULTA_ID').AsInteger));
  Result.AddPair('secao', Trim(LQuery.DataSet.FieldByName('FCD_SECAO').AsString));
  Result.AddPair('versao', TJSONNumber.Create(
    LQuery.DataSet.FieldByName('FCD_VERSAO').AsInteger));
  Result.AddPair('conteudo', ParseConteudo(
    LQuery.DataSet.FieldByName('FCD_CONTEUDO').AsString));
  Result.AddPair('criado_por', TJSONNumber.Create(
    LQuery.DataSet.FieldByName('FCD_CRIADO_POR').AsInteger));
  AddDatePair(Result, 'criado_em', LQuery.DataSet.FieldByName('FCD_CRIADO_EM'));
  Result.AddPair('atualizado_por', TJSONNumber.Create(
    LQuery.DataSet.FieldByName('FCD_ATUALIZADO_POR').AsInteger));
  AddDatePair(Result, 'atualizado_em',
    LQuery.DataSet.FieldByName('FCD_ATUALIZADO_EM'));
end;

function TFichaClinicaDadosService.ObterSecao(AConsultaId: Integer;
  const ASecao: string): TJSONObject;
var
  LQuery: iQuery;
  LSecao: string;
begin
  ValidarConsulta(AConsultaId);
  LSecao := NormalizarSecao(ASecao);
  ValidarSecaoConfigurada(LSecao, False);

  if LSecao = 'anamnese' then
    raise EFichaClinicaDadosValidacao.Create(
      'Utilize os endpoints de anamnese para esta secao');

  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT FCD_ID FROM FICHA_CLINICA_DADOS ');
  LQuery.Add('WHERE FCD_CONSULTA_ID = :CONSULTA_ID AND FCD_SECAO = :SECAO');
  LQuery.AddParam('CONSULTA_ID', AConsultaId);
  LQuery.AddParam('SECAO', LSecao);
  LQuery.Open;

  if LQuery.DataSet.IsEmpty then
  begin
    Result := TJSONObject.Create;
    Result.AddPair('consulta_id', TJSONNumber.Create(AConsultaId));
    Result.AddPair('secao', LSecao);
    Result.AddPair('versao', TJSONNumber.Create(VERSAO_CONTRATO));
    Result.AddPair('preenchida', TJSONBool.Create(False));
    Result.AddPair('conteudo', TJSONNull.Create);
    Exit;
  end;

  Result := DadosToJSON(LQuery.DataSet.FieldByName('FCD_ID').AsInteger);
  Result.AddPair('preenchida', TJSONBool.Create(True));
end;

function TFichaClinicaDadosService.SalvarSecao(AConsultaId,
  AUsuarioId: Integer; const ASecao: string;
  AConteudo: TJSONObject): TJSONObject;
var
  LQuery: iQuery;
  LModel: TModelFichaClinicaDados;
  LSecao: string;
  LId: Integer;
begin
  if AUsuarioId <= 0 then
    raise EFichaClinicaDadosValidacao.Create('Usuario autenticado invalido');

  ValidarConsulta(AConsultaId, True);
  LSecao := NormalizarSecao(ASecao);
  ValidarSecaoConfigurada(LSecao, True);
  if LSecao = 'anamnese' then
    raise EFichaClinicaDadosValidacao.Create(
      'Utilize os endpoints de anamnese para esta secao');
  ValidarConteudo(LSecao, AConteudo);

  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT FCD_ID FROM FICHA_CLINICA_DADOS ');
  LQuery.Add('WHERE FCD_CONSULTA_ID = :CONSULTA_ID AND FCD_SECAO = :SECAO');
  LQuery.AddParam('CONSULTA_ID', AConsultaId);
  LQuery.AddParam('SECAO', LSecao);
  LQuery.Open;
  if LQuery.DataSet.IsEmpty then
    LId := 0
  else
    LId := LQuery.DataSet.FieldByName('FCD_ID').AsInteger;

  LModel := TModelFichaClinicaDados.Create(TDatabase.Connection);
  try
    if LId > 0 then
      LModel.BuscaDadosTabela(LId)
    else
    begin
      LModel.Id := LModel.GeraCodigo('FCD_ID');
      LModel.ConsultaId := AConsultaId;
      LModel.Secao := LSecao;
      LModel.CriadoPor := AUsuarioId;
      LModel.CriadoEm := Now;
    end;

    LModel.Versao := VERSAO_CONTRATO;
    LModel.Conteudo := AConteudo.ToJSON;
    LModel.AtualizadoPor := AUsuarioId;
    LModel.AtualizadoEm := Now;
    LModel.SalvaNoBanco(1);
    LId := LModel.Id;
  finally
    LModel.Free;
  end;

  Result := DadosToJSON(LId);
  Result.AddPair('preenchida', TJSONBool.Create(True));
end;

function TFichaClinicaDadosService.ObterCompletude(
  AConsultaId: Integer): TJSONObject;
var
  LQuery: iQuery;
  LTemAnamnese: Boolean;
  LTemDx: Boolean;
begin
  ValidarConsulta(AConsultaId);
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT ');
  LQuery.Add('(SELECT COUNT(*) FROM ANAMNESES A ');
  LQuery.Add(' WHERE A.ANA_CONSULTA_ID = :CONSULTA_ID) AS TOTAL_ANAMNESES, ');
  LQuery.Add('(SELECT COUNT(*) FROM FICHA_CLINICA_DADOS D ');
  LQuery.Add(' WHERE D.FCD_CONSULTA_ID = :CONSULTA_ID AND D.FCD_SECAO = ''dx'') AS TOTAL_DX ');
  LQuery.Add('FROM RDB$DATABASE');
  LQuery.AddParam('CONSULTA_ID', AConsultaId);
  LQuery.Open;

  LTemAnamnese := LQuery.DataSet.FieldByName('TOTAL_ANAMNESES').AsInteger > 0;
  LTemDx := LQuery.DataSet.FieldByName('TOTAL_DX').AsInteger > 0;
  Result := TJSONObject.Create;
  Result.AddPair('consulta_id', TJSONNumber.Create(AConsultaId));
  Result.AddPair('anamnese_preenchida', TJSONBool.Create(LTemAnamnese));
  Result.AddPair('dx_preenchido', TJSONBool.Create(LTemDx));
  Result.AddPair('pode_finalizar', TJSONBool.Create(True));
  Result.AddPair('pendencias', TJSONArray.Create);
end;

function TFichaClinicaDadosService.ObterFicha(
  AConsultaId: Integer): TJSONObject;
var
  LQuery: iQuery;
  LSecoes: TJSONArray;
  LItem: TJSONObject;
  LSecao: string;
  LTemAnamnese: Boolean;
begin
  ValidarConsulta(AConsultaId);

  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT COUNT(*) AS TOTAL FROM ANAMNESES ');
  LQuery.Add('WHERE ANA_CONSULTA_ID = :CONSULTA_ID');
  LQuery.AddParam('CONSULTA_ID', AConsultaId);
  LQuery.Open;
  LTemAnamnese := LQuery.DataSet.FieldByName('TOTAL').AsInteger > 0;

  LQuery.Clear;
  LQuery.Add('SELECT S.FSC_ID, S.FSC_CHAVE, S.FSC_NOME, S.FSC_ATIVO, ');
  LQuery.Add('S.FSC_ORDEM, S.FSC_EXIBE_TELA, S.FSC_EXIBE_IMPRESSAO, ');
  LQuery.Add('D.FCD_ID, D.FCD_VERSAO, D.FCD_CONTEUDO, ');
  LQuery.Add('D.FCD_ATUALIZADO_POR, D.FCD_ATUALIZADO_EM ');
  LQuery.Add('FROM FICHA_SECAO S LEFT JOIN FICHA_CLINICA_DADOS D ON ');
  LQuery.Add('D.FCD_CONSULTA_ID = :CONSULTA_ID AND D.FCD_SECAO = S.FSC_CHAVE ');
  LQuery.Add('ORDER BY S.FSC_ORDEM, S.FSC_ID');
  LQuery.AddParam('CONSULTA_ID', AConsultaId);
  LQuery.Open;

  LSecoes := TJSONArray.Create;
  while not LQuery.DataSet.Eof do
  begin
    LSecao := LowerCase(Trim(LQuery.DataSet.FieldByName('FSC_CHAVE').AsString));
    LItem := TJSONObject.Create;
    LItem.AddPair('id', TJSONNumber.Create(
      LQuery.DataSet.FieldByName('FSC_ID').AsInteger));
    LItem.AddPair('chave', LSecao);
    LItem.AddPair('nome', Trim(LQuery.DataSet.FieldByName('FSC_NOME').AsString));
    LItem.AddPair('ativo', TJSONBool.Create(
      LQuery.DataSet.FieldByName('FSC_ATIVO').AsInteger = 1));
    LItem.AddPair('ordem', TJSONNumber.Create(
      LQuery.DataSet.FieldByName('FSC_ORDEM').AsInteger));
    LItem.AddPair('exibe_tela', TJSONBool.Create(
      LQuery.DataSet.FieldByName('FSC_EXIBE_TELA').AsInteger = 1));
    LItem.AddPair('exibe_impressao', TJSONBool.Create(
      LQuery.DataSet.FieldByName('FSC_EXIBE_IMPRESSAO').AsInteger = 1));
    LItem.AddPair('obrigatoria', TJSONBool.Create(False));

    if LSecao = 'anamnese' then
    begin
      LItem.AddPair('preenchida', TJSONBool.Create(LTemAnamnese));
      LItem.AddPair('conteudo', TJSONNull.Create);
    end
    else if LQuery.DataSet.FieldByName('FCD_ID').IsNull then
    begin
      LItem.AddPair('preenchida', TJSONBool.Create(False));
      LItem.AddPair('conteudo', TJSONNull.Create);
    end
    else
    begin
      LItem.AddPair('preenchida', TJSONBool.Create(True));
      LItem.AddPair('versao', TJSONNumber.Create(
        LQuery.DataSet.FieldByName('FCD_VERSAO').AsInteger));
      LItem.AddPair('conteudo', ParseConteudo(
        LQuery.DataSet.FieldByName('FCD_CONTEUDO').AsString));
      LItem.AddPair('atualizado_por', TJSONNumber.Create(
        LQuery.DataSet.FieldByName('FCD_ATUALIZADO_POR').AsInteger));
      AddDatePair(LItem, 'atualizado_em',
        LQuery.DataSet.FieldByName('FCD_ATUALIZADO_EM'));
    end;

    LSecoes.AddElement(LItem);
    LQuery.DataSet.Next;
  end;

  Result := TJSONObject.Create;
  Result.AddPair('consulta_id', TJSONNumber.Create(AConsultaId));
  Result.AddPair('secoes', LSecoes);
  Result.AddPair('completude', ObterCompletude(AConsultaId));
end;

end.
