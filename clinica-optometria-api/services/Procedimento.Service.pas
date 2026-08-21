unit Procedimento.Service;

interface

uses
  System.JSON,
  System.SysUtils;

type
  EProcedimentoValidacao = class(Exception);
  EProcedimentoNaoEncontrado = class(Exception);

  TProcedimentoService = class
  private
    class procedure Validar(const ADados: TJSONObject; AIdIgnorar: Integer);
  public
    class procedure Inicializar;
    class function Listar(const ABusca, AStatus: string): TJSONArray;
    class function ListarAtivos: TJSONArray;
    class function ObterPorId(AId: Integer): TJSONObject;
    class function Criar(const ADados: TJSONObject): TJSONObject;
    class function Atualizar(AId: Integer; const ADados: TJSONObject): TJSONObject;
    class function DefinirAtivo(AId: Integer; AAtivo: Boolean): TJSONObject;
  end;

implementation

uses
  Data.DB,
  System.StrUtils,
  UnitConnection.Model.Interfaces,
  UnitDatabase,
  UnitProcedimento.Model;

function Texto(const ADados: TJSONObject; const AChave: string): string;
begin
  if Assigned(ADados) then
    Result := Trim(ADados.GetValue<string>(AChave, ''))
  else
    Result := '';
end;

function Inteiro(const ADados: TJSONObject; const AChave: string): Integer;
begin
  Result := StrToIntDef(Texto(ADados, AChave), 0);
end;

function Numero(const ADados: TJSONObject; const AChave: string): Double;
var
  LTexto: string;
begin
  LTexto := StringReplace(Texto(ADados, AChave), '.',
    FormatSettings.DecimalSeparator, [rfReplaceAll]);
  Result := StrToFloatDef(LTexto, -1);
end;

function ProcedimentoJson(ADataSet: TDataSet): TJSONObject;
begin
  Result := TJSONObject.Create;
  Result.AddPair('id', TJSONNumber.Create(ADataSet.FieldByName('PRO_ID').AsInteger));
  Result.AddPair('nome', Trim(ADataSet.FieldByName('PRO_NOME').AsString));
  Result.AddPair('duracao_minutos', TJSONNumber.Create(
    ADataSet.FieldByName('PRO_DURACAO_MINUTOS').AsInteger));
  Result.AddPair('valor', TJSONNumber.Create(ADataSet.FieldByName('PRO_VALOR').AsFloat));
  Result.AddPair('ativo', TJSONBool.Create(ADataSet.FieldByName('PRO_ATIVO').AsInteger = 1));
end;

class procedure TProcedimentoService.Inicializar;
var
  LModel: TModelProcedimento;
begin
  LModel := TModelProcedimento.Create(TDatabase.Connection);
  try
    LModel.CriaTabela;
  finally
    LModel.Free;
  end;
end;

class procedure TProcedimentoService.Validar(const ADados: TJSONObject;
  AIdIgnorar: Integer);
var
  LNome: string;
  LDuracao: Integer;
  LValor: Double;
  LQuery: iQuery;
begin
  if not Assigned(ADados) then
    raise EProcedimentoValidacao.Create('Payload invalido');
  LNome := Texto(ADados, 'nome');
  LDuracao := Inteiro(ADados, 'duracao_minutos');
  LValor := Numero(ADados, 'valor');
  if LNome = '' then
    raise EProcedimentoValidacao.Create('Nome do procedimento e obrigatorio');
  if Length(LNome) > 120 then
    raise EProcedimentoValidacao.Create('Nome deve possuir no maximo 120 caracteres');
  if LDuracao <= 0 then
    raise EProcedimentoValidacao.Create('Duracao deve ser maior que zero');
  if LDuracao > 1440 then
    raise EProcedimentoValidacao.Create('Duracao deve possuir no maximo 1440 minutos');
  if LValor < 0 then
    raise EProcedimentoValidacao.Create('Valor deve ser maior ou igual a zero');

  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT COUNT(*) FROM PROCEDIMENTOS ');
  LQuery.Add('WHERE UPPER(TRIM(PRO_NOME)) = UPPER(:NOME) AND PRO_ID <> :ID');
  LQuery.AddParam('NOME', LNome);
  LQuery.AddParam('ID', AIdIgnorar);
  LQuery.Open;
  if LQuery.DataSet.Fields[0].AsInteger > 0 then
    raise EProcedimentoValidacao.Create('Ja existe um procedimento com este nome');
end;

class function TProcedimentoService.Listar(const ABusca,
  AStatus: string): TJSONArray;
var
  LQuery: iQuery;
  LStatus: string;
begin
  Inicializar;
  Result := TJSONArray.Create;
  LStatus := LowerCase(Trim(AStatus));
  if not MatchText(LStatus, ['', 'todos', 'ativo', 'inativo']) then
    raise EProcedimentoValidacao.Create('Status invalido');
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT PRO_ID, PRO_NOME, PRO_DURACAO_MINUTOS, PRO_VALOR, PRO_ATIVO ');
  LQuery.Add('FROM PROCEDIMENTOS WHERE 1 = 1 ');
  if Trim(ABusca) <> '' then
  begin
    LQuery.Add('AND UPPER(PRO_NOME) LIKE UPPER(:BUSCA) ');
    LQuery.AddParam('BUSCA', '%' + Trim(ABusca) + '%');
  end;
  if LStatus = 'ativo' then
    LQuery.Add('AND PRO_ATIVO = 1 ')
  else if LStatus = 'inativo' then
    LQuery.Add('AND PRO_ATIVO = 0 ');
  LQuery.Add('ORDER BY PRO_NOME');
  LQuery.Open;
  while not LQuery.DataSet.Eof do
  begin
    Result.AddElement(ProcedimentoJson(LQuery.DataSet));
    LQuery.DataSet.Next;
  end;
end;

class function TProcedimentoService.ListarAtivos: TJSONArray;
begin
  Result := Listar('', 'ativo');
end;

class function TProcedimentoService.ObterPorId(AId: Integer): TJSONObject;
var
  LQuery: iQuery;
begin
  if AId <= 0 then
    raise EProcedimentoValidacao.Create('Procedimento invalido');
  Inicializar;
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT PRO_ID, PRO_NOME, PRO_DURACAO_MINUTOS, PRO_VALOR, PRO_ATIVO ');
  LQuery.Add('FROM PROCEDIMENTOS WHERE PRO_ID = :ID');
  LQuery.AddParam('ID', AId);
  LQuery.Open;
  if LQuery.DataSet.IsEmpty then
    raise EProcedimentoNaoEncontrado.Create('Procedimento nao encontrado');
  Result := ProcedimentoJson(LQuery.DataSet);
end;

class function TProcedimentoService.Criar(
  const ADados: TJSONObject): TJSONObject;
var
  LModel: TModelProcedimento;
begin
  Inicializar;
  Validar(ADados, 0);
  LModel := TModelProcedimento.Create(TDatabase.Connection);
  try
    LModel.Id := LModel.GeraCodigo('PRO_ID');
    LModel.Nome := Texto(ADados, 'nome');
    LModel.DuracaoMinutos := Inteiro(ADados, 'duracao_minutos');
    LModel.Valor := Numero(ADados, 'valor');
    LModel.Ativo := 1;
    LModel.SalvaNoBanco(1);
    Result := ObterPorId(LModel.Id);
  finally
    LModel.Free;
  end;
end;

class function TProcedimentoService.Atualizar(AId: Integer;
  const ADados: TJSONObject): TJSONObject;
var
  LModel: TModelProcedimento;
begin
  if AId <= 0 then
    raise EProcedimentoValidacao.Create('Procedimento invalido');
  Inicializar;
  Validar(ADados, AId);
  LModel := TModelProcedimento.Create(TDatabase.Connection);
  try
    LModel.BuscaDadosTabela(AId);
    if LModel.Id <= 0 then
      raise EProcedimentoNaoEncontrado.Create('Procedimento nao encontrado');
    LModel.Nome := Texto(ADados, 'nome');
    LModel.DuracaoMinutos := Inteiro(ADados, 'duracao_minutos');
    LModel.Valor := Numero(ADados, 'valor');
    LModel.SalvaNoBanco(1);
    Result := ObterPorId(AId);
  finally
    LModel.Free;
  end;
end;

class function TProcedimentoService.DefinirAtivo(AId: Integer;
  AAtivo: Boolean): TJSONObject;
var
  LModel: TModelProcedimento;
begin
  if AId <= 0 then
    raise EProcedimentoValidacao.Create('Procedimento invalido');
  Inicializar;
  LModel := TModelProcedimento.Create(TDatabase.Connection);
  try
    LModel.BuscaDadosTabela(AId);
    if LModel.Id <= 0 then
      raise EProcedimentoNaoEncontrado.Create('Procedimento nao encontrado');
    LModel.Ativo := Ord(AAtivo);
    LModel.SalvaNoBanco(1);
    Result := ObterPorId(AId);
  finally
    LModel.Free;
  end;
end;

end.
