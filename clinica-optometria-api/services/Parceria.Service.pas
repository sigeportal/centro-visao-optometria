unit Parceria.Service;

interface

uses
  System.JSON,
  System.SysUtils;

type
  EParceriaValidacao = class(Exception);
  EParceriaNaoEncontrada = class(Exception);

  TParceriaService = class
  private
    class procedure Validar(const ADados: TJSONObject; AIdIgnorar: Integer);
  public
    class procedure Inicializar;
    class function Listar(const ABusca, AStatus: string): TJSONArray;
    class function ListarAtivas: TJSONArray;
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
  UnitParceria.Model;

function Texto(const ADados: TJSONObject; const AChave: string): string;
begin
  if Assigned(ADados) then
    Result := Trim(ADados.GetValue<string>(AChave, ''))
  else
    Result := '';
end;

function SomenteDigitos(const AValor: string): string;
var
  I: Integer;
begin
  Result := '';
  for I := 1 to Length(AValor) do
    if CharInSet(AValor[I], ['0'..'9']) then
      Result := Result + AValor[I];
end;

function ParceriaJson(ADataSet: TDataSet): TJSONObject;
begin
  Result := TJSONObject.Create;
  Result.AddPair('id', TJSONNumber.Create(ADataSet.FieldByName('PAR_ID').AsInteger));
  Result.AddPair('nome', Trim(ADataSet.FieldByName('PAR_NOME').AsString));
  Result.AddPair('cnpj', Trim(ADataSet.FieldByName('PAR_CNPJ').AsString));
  Result.AddPair('telefone', Trim(ADataSet.FieldByName('PAR_TELEFONE').AsString));
  Result.AddPair('email', Trim(ADataSet.FieldByName('PAR_EMAIL').AsString));
  Result.AddPair('responsavel', Trim(ADataSet.FieldByName('PAR_RESPONSAVEL').AsString));
  Result.AddPair('endereco', Trim(ADataSet.FieldByName('PAR_ENDERECO').AsString));
  Result.AddPair('cidade', Trim(ADataSet.FieldByName('PAR_CIDADE').AsString));
  Result.AddPair('estado', Trim(ADataSet.FieldByName('PAR_UF').AsString));
  Result.AddPair('ativo', TJSONBool.Create(ADataSet.FieldByName('PAR_ATIVO').AsInteger = 1));
end;

class procedure TParceriaService.Inicializar;
var
  LModel: TModelParceria;
begin
  LModel := TModelParceria.Create(TDatabase.Connection);
  try
    LModel.CriaTabela;
  finally
    LModel.Free;
  end;
end;

class procedure TParceriaService.Validar(const ADados: TJSONObject;
  AIdIgnorar: Integer);
var
  LNome, LCnpj, LEmail, LUf: string;
  LQuery: iQuery;
begin
  if not Assigned(ADados) then
    raise EParceriaValidacao.Create('Payload invalido');
  LNome := Texto(ADados, 'nome');
  LCnpj := SomenteDigitos(Texto(ADados, 'cnpj'));
  LEmail := LowerCase(Texto(ADados, 'email'));
  LUf := UpperCase(Texto(ADados, 'estado'));
  if LNome = '' then
    raise EParceriaValidacao.Create('Nome da parceria e obrigatorio');
  if Length(LNome) > 150 then
    raise EParceriaValidacao.Create('Nome deve possuir no maximo 150 caracteres');
  if (LCnpj <> '') and (Length(LCnpj) <> 14) then
    raise EParceriaValidacao.Create('CNPJ deve possuir 14 digitos');
  if Length(Texto(ADados, 'telefone')) > 20 then
    raise EParceriaValidacao.Create('Telefone deve possuir no maximo 20 caracteres');
  if Length(LEmail) > 150 then
    raise EParceriaValidacao.Create('Email deve possuir no maximo 150 caracteres');
  if (LEmail <> '') and ((Pos('@', LEmail) <= 1) or
    (Pos('.', Copy(LEmail, Pos('@', LEmail) + 2, MaxInt)) = 0)) then
    raise EParceriaValidacao.Create('Email invalido');
  if Length(LUf) > 2 then
    raise EParceriaValidacao.Create('UF deve possuir no maximo 2 caracteres');
  if Length(Texto(ADados, 'responsavel')) > 120 then
    raise EParceriaValidacao.Create('Responsavel deve possuir no maximo 120 caracteres');
  if Length(Texto(ADados, 'endereco')) > 200 then
    raise EParceriaValidacao.Create('Endereco deve possuir no maximo 200 caracteres');
  if Length(Texto(ADados, 'cidade')) > 100 then
    raise EParceriaValidacao.Create('Cidade deve possuir no maximo 100 caracteres');

  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT COUNT(*) FROM PARCERIAS WHERE UPPER(TRIM(PAR_NOME)) = UPPER(:NOME) ');
  LQuery.Add('AND PAR_ID <> :ID');
  LQuery.AddParam('NOME', LNome);
  LQuery.AddParam('ID', AIdIgnorar);
  LQuery.Open;
  if LQuery.DataSet.Fields[0].AsInteger > 0 then
    raise EParceriaValidacao.Create('Ja existe uma parceria com este nome');
  if LCnpj <> '' then
  begin
    LQuery.Clear;
    LQuery.Add('SELECT COUNT(*) FROM PARCERIAS WHERE PAR_CNPJ = :CNPJ AND PAR_ID <> :ID');
    LQuery.AddParam('CNPJ', LCnpj);
    LQuery.AddParam('ID', AIdIgnorar);
    LQuery.Open;
    if LQuery.DataSet.Fields[0].AsInteger > 0 then
      raise EParceriaValidacao.Create('CNPJ ja cadastrado para outra parceria');
  end;
end;

class function TParceriaService.Listar(const ABusca,
  AStatus: string): TJSONArray;
var
  LQuery: iQuery;
  LStatus: string;
begin
  Inicializar;
  Result := TJSONArray.Create;
  LStatus := LowerCase(Trim(AStatus));
  if not MatchText(LStatus, ['', 'todos', 'ativo', 'inativo']) then
    raise EParceriaValidacao.Create('Status invalido');
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT PAR_ID, PAR_NOME, PAR_CNPJ, PAR_TELEFONE, PAR_EMAIL, ');
  LQuery.Add('PAR_RESPONSAVEL, PAR_ENDERECO, PAR_CIDADE, PAR_UF, PAR_ATIVO ');
  LQuery.Add('FROM PARCERIAS WHERE 1 = 1 ');
  if Trim(ABusca) <> '' then
  begin
    LQuery.Add('AND (UPPER(PAR_NOME) LIKE UPPER(:BUSCA) OR PAR_CNPJ LIKE :BUSCA ');
    LQuery.Add('OR UPPER(COALESCE(PAR_RESPONSAVEL, '''')) LIKE UPPER(:BUSCA) ');
    LQuery.Add('OR UPPER(COALESCE(PAR_CIDADE, '''')) LIKE UPPER(:BUSCA)) ');
    LQuery.AddParam('BUSCA', '%' + Trim(ABusca) + '%');
  end;
  if LStatus = 'ativo' then
    LQuery.Add('AND PAR_ATIVO = 1 ')
  else if LStatus = 'inativo' then
    LQuery.Add('AND PAR_ATIVO = 0 ');
  LQuery.Add('ORDER BY PAR_NOME');
  LQuery.Open;
  while not LQuery.DataSet.Eof do
  begin
    Result.AddElement(ParceriaJson(LQuery.DataSet));
    LQuery.DataSet.Next;
  end;
end;

class function TParceriaService.ListarAtivas: TJSONArray;
begin
  Result := Listar('', 'ativo');
end;

class function TParceriaService.ObterPorId(AId: Integer): TJSONObject;
var
  LQuery: iQuery;
begin
  if AId <= 0 then
    raise EParceriaValidacao.Create('Parceria invalida');
  Inicializar;
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT PAR_ID, PAR_NOME, PAR_CNPJ, PAR_TELEFONE, PAR_EMAIL, ');
  LQuery.Add('PAR_RESPONSAVEL, PAR_ENDERECO, PAR_CIDADE, PAR_UF, PAR_ATIVO ');
  LQuery.Add('FROM PARCERIAS WHERE PAR_ID = :ID');
  LQuery.AddParam('ID', AId);
  LQuery.Open;
  if LQuery.DataSet.IsEmpty then
    raise EParceriaNaoEncontrada.Create('Parceria nao encontrada');
  Result := ParceriaJson(LQuery.DataSet);
end;

class function TParceriaService.Criar(const ADados: TJSONObject): TJSONObject;
var
  LModel: TModelParceria;
begin
  Inicializar;
  Validar(ADados, 0);
  LModel := TModelParceria.Create(TDatabase.Connection);
  try
    LModel.Id := LModel.GeraCodigo('PAR_ID');
    LModel.Nome := Texto(ADados, 'nome');
    LModel.Cnpj := SomenteDigitos(Texto(ADados, 'cnpj'));
    LModel.Telefone := Texto(ADados, 'telefone');
    LModel.Email := LowerCase(Texto(ADados, 'email'));
    LModel.Responsavel := Texto(ADados, 'responsavel');
    LModel.Endereco := Texto(ADados, 'endereco');
    LModel.Cidade := Texto(ADados, 'cidade');
    LModel.Uf := UpperCase(Texto(ADados, 'estado'));
    LModel.Ativo := 1;
    LModel.SalvaNoBanco(1);
    Result := ObterPorId(LModel.Id);
  finally
    LModel.Free;
  end;
end;

class function TParceriaService.Atualizar(AId: Integer;
  const ADados: TJSONObject): TJSONObject;
var
  LModel: TModelParceria;
begin
  if AId <= 0 then
    raise EParceriaValidacao.Create('Parceria invalida');
  Inicializar;
  Validar(ADados, AId);
  LModel := TModelParceria.Create(TDatabase.Connection);
  try
    LModel.BuscaDadosTabela(AId);
    if LModel.Id <= 0 then
      raise EParceriaNaoEncontrada.Create('Parceria nao encontrada');
    LModel.Nome := Texto(ADados, 'nome');
    LModel.Cnpj := SomenteDigitos(Texto(ADados, 'cnpj'));
    LModel.Telefone := Texto(ADados, 'telefone');
    LModel.Email := LowerCase(Texto(ADados, 'email'));
    LModel.Responsavel := Texto(ADados, 'responsavel');
    LModel.Endereco := Texto(ADados, 'endereco');
    LModel.Cidade := Texto(ADados, 'cidade');
    LModel.Uf := UpperCase(Texto(ADados, 'estado'));
    LModel.SalvaNoBanco(1);
    Result := ObterPorId(AId);
  finally
    LModel.Free;
  end;
end;

class function TParceriaService.DefinirAtivo(AId: Integer;
  AAtivo: Boolean): TJSONObject;
var
  LModel: TModelParceria;
begin
  if AId <= 0 then
    raise EParceriaValidacao.Create('Parceria invalida');
  Inicializar;
  LModel := TModelParceria.Create(TDatabase.Connection);
  try
    LModel.BuscaDadosTabela(AId);
    if LModel.Id <= 0 then
      raise EParceriaNaoEncontrada.Create('Parceria nao encontrada');
    LModel.Ativo := Ord(AAtivo);
    LModel.SalvaNoBanco(1);
    Result := ObterPorId(AId);
  finally
    LModel.Free;
  end;
end;

end.
