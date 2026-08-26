unit Funcionario.Service;

interface

uses
  System.JSON,
  System.SysUtils;

type
  EFuncionarioValidacao = class(Exception);
  EFuncionarioNaoEncontrado = class(Exception);

  TFuncionarioService = class
  private
    class procedure ValidarDados(const AData: TJSONObject);
  public
    class procedure Inicializar;
    class function Listar(const ABusca, AStatus: string): TJSONArray;
    class function ObterPorId(AId: Integer): TJSONObject;
    class function Criar(const AData: TJSONObject): TJSONObject;
    class function Atualizar(AId: Integer; const AData: TJSONObject): TJSONObject;
    class function DefinirAtivo(AId: Integer; AAtivo: Boolean;
      AExecutorId: Integer): TJSONObject;
  end;

implementation

uses
  Data.DB,
  FireDAC.Comp.Client,
  System.StrUtils,
  UnitConnection.Model.Interfaces,
  UnitDatabase,
  Autorizacao.Service;

function Texto(const AData: TJSONObject; const AChave: string): string;
begin
  Result := Trim(AData.GetValue<string>(AChave, ''));
end;

function Booleano(const AData: TJSONObject; const AChave: string): Boolean;
var
  LValor: TJSONValue;
begin
  LValor := AData.GetValue(AChave);
  Result := Assigned(LValor) and SameText(LValor.Value, 'true');
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

function CampoNormalizadoCpf: string;
begin
  Result := 'REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(FUN_CPF, ''''), ''.'', ''''), ' +
    '''-'', ''''), ''/'', ''''), '' '', '''')';
end;

function FuncionarioDoDataSet(ADataSet: TDataSet): TJSONObject;
begin
  Result := TJSONObject.Create;
  Result.AddPair('id', TJSONNumber.Create(ADataSet.FieldByName('FUN_CODIGO').AsInteger));
  Result.AddPair('nome', Trim(ADataSet.FieldByName('FUN_NOME').AsString));
  Result.AddPair('cpf', Trim(ADataSet.FieldByName('FUN_CPF').AsString));
  Result.AddPair('celular', Trim(ADataSet.FieldByName('FUN_CELULAR').AsString));
  Result.AddPair('email', Trim(ADataSet.FieldByName('FUN_EMAIL').AsString));
  Result.AddPair('categoria', Trim(ADataSet.FieldByName('FUN_CATEGORIA').AsString));
  Result.AddPair('atende', TJSONBool.Create(ADataSet.FieldByName('FUN_ATENDE').AsInteger = 1));
  Result.AddPair('ativo', TJSONBool.Create(SameText(
    Trim(ADataSet.FieldByName('FUN_ESTADO').AsString), 'ATIVO')));
  Result.AddPair('possui_usuario', TJSONBool.Create(
    not ADataSet.FieldByName('USU_CODIGO').IsNull));
  if ADataSet.FieldByName('USU_CODIGO').IsNull then
  begin
    Result.AddPair('usuario_id', TJSONNull.Create);
    Result.AddPair('usuario_login', TJSONNull.Create);
    Result.AddPair('usuario_ativo', TJSONNull.Create);
  end
  else
  begin
    Result.AddPair('usuario_id', TJSONNumber.Create(
      ADataSet.FieldByName('USU_CODIGO').AsInteger));
    Result.AddPair('usuario_login', Trim(ADataSet.FieldByName('USU_LOGIN').AsString));
    Result.AddPair('usuario_ativo', TJSONBool.Create(
      ADataSet.FieldByName('USU_ATIVO').AsInteger = 1));
  end;
end;

procedure PrepararConsultaFuncionario(AQuery: TFDQuery);
begin
  AQuery.SQL.Text :=
    'SELECT F.FUN_CODIGO, F.FUN_NOME, F.FUN_CPF, F.FUN_CELULAR, ' +
    'F.FUN_EMAIL, F.FUN_CATEGORIA, F.FUN_ATENDE, F.FUN_ESTADO, ' +
    'U.USU_CODIGO, U.USU_LOGIN, U.USU_ATIVO ' +
    'FROM FUNCIONARIOS F ' +
    'LEFT JOIN USUARIOS U ON U.USU_FUN = F.FUN_CODIGO ';
end;

procedure ValidarCpfUnico(AQuery: TFDQuery; const ACpf: string;
  AIdIgnorar: Integer);
begin
  if ACpf = '' then
    Exit;

  AQuery.Close;
  AQuery.SQL.Text := 'SELECT COUNT(*) AS TOTAL FROM FUNCIONARIOS ' +
    'WHERE ' + CampoNormalizadoCpf + ' = :CPF AND FUN_CODIGO <> :ID';
  AQuery.ParamByName('CPF').AsString := ACpf;
  AQuery.ParamByName('ID').AsInteger := AIdIgnorar;
  AQuery.Open;
  if AQuery.FieldByName('TOTAL').AsInteger > 0 then
    raise EFuncionarioValidacao.Create('CPF ja cadastrado para outro funcionario');
end;

class procedure TFuncionarioService.Inicializar;
var
  LQuery: iQuery;
begin
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT COUNT(*) AS TOTAL FROM RDB$RELATION_FIELDS ');
  LQuery.Add('WHERE TRIM(RDB$RELATION_NAME) = ''FUNCIONARIOS'' ');
  LQuery.Add('AND TRIM(RDB$FIELD_NAME) = ''FUN_ATENDE''');
  LQuery.Open;
  if LQuery.DataSet.FieldByName('TOTAL').AsInteger > 0 then
    Exit;

  LQuery.Clear;
  LQuery.Add('ALTER TABLE FUNCIONARIOS ADD FUN_ATENDE SMALLINT DEFAULT 0 NOT NULL');
  LQuery.ExecSQL;

  // Preserva o comportamento da agenda para os funcionarios anteriores a migracao.
  LQuery.Clear;
  LQuery.Add('UPDATE FUNCIONARIOS SET FUN_ATENDE = 1 ');
  LQuery.Add('WHERE UPPER(TRIM(COALESCE(FUN_ESTADO, ''''))) = ''ATIVO''');
  LQuery.ExecSQL;
end;

class procedure TFuncionarioService.ValidarDados(const AData: TJSONObject);
var
  LNome: string;
  LCpf: string;
  LCelular: string;
  LEmail: string;
  LCategoria: string;
begin
  if not Assigned(AData) then
    raise EFuncionarioValidacao.Create('Payload invalido');

  LNome := Texto(AData, 'nome');
  LCpf := SomenteDigitos(Texto(AData, 'cpf'));
  LCelular := Texto(AData, 'celular');
  LEmail := LowerCase(Texto(AData, 'email'));
  LCategoria := Texto(AData, 'categoria');

  if LNome = '' then
    raise EFuncionarioValidacao.Create('Nome e obrigatorio');
  if Length(LNome) > 50 then
    raise EFuncionarioValidacao.Create('Nome deve possuir no maximo 50 caracteres');
  if (LCpf <> '') and (Length(LCpf) <> 11) then
    raise EFuncionarioValidacao.Create('CPF deve possuir 11 digitos');
  if Length(LCelular) > 14 then
    raise EFuncionarioValidacao.Create('Celular deve possuir no maximo 14 caracteres');
  if Length(LEmail) > 30 then
    raise EFuncionarioValidacao.Create('Email deve possuir no maximo 30 caracteres');
  if (LEmail <> '') and
    ((Pos('@', LEmail) <= 1) or (Pos('.', Copy(LEmail, Pos('@', LEmail) + 2,
      MaxInt)) = 0)) then
    raise EFuncionarioValidacao.Create('Email invalido');
  if Length(LCategoria) > 20 then
    raise EFuncionarioValidacao.Create('Funcao deve possuir no maximo 20 caracteres');
end;

class function TFuncionarioService.Listar(const ABusca,
  AStatus: string): TJSONArray;
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
  LStatus: string;
begin
  Result := TJSONArray.Create;
  LStatus := LowerCase(Trim(AStatus));
  if not MatchText(LStatus, ['', 'todos', 'ativo', 'inativo']) then
    raise EFuncionarioValidacao.Create('Status invalido');

  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      PrepararConsultaFuncionario(LQuery);
      LQuery.SQL.Add('WHERE 1 = 1');
      if Trim(ABusca) <> '' then
        LQuery.SQL.Add('AND (UPPER(F.FUN_NOME) LIKE UPPER(CAST(:BUSCA AS VARCHAR(255))) OR ' +
          'UPPER(COALESCE(F.FUN_CPF, '''')) LIKE UPPER(CAST(:BUSCA AS VARCHAR(255))) OR ' +
          'UPPER(COALESCE(F.FUN_CATEGORIA, '''')) LIKE UPPER(CAST(:BUSCA AS VARCHAR(255))) OR ' +
          'UPPER(COALESCE(U.USU_LOGIN, '''')) LIKE UPPER(CAST(:BUSCA AS VARCHAR(255))))');
      if LStatus = 'ativo' then
        LQuery.SQL.Add('AND UPPER(TRIM(COALESCE(F.FUN_ESTADO, ''''))) = ''ATIVO''')
      else if LStatus = 'inativo' then
        LQuery.SQL.Add('AND UPPER(TRIM(COALESCE(F.FUN_ESTADO, ''''))) <> ''ATIVO''');
      LQuery.SQL.Add('ORDER BY F.FUN_NOME');
      if Trim(ABusca) <> '' then
        LQuery.ParamByName('BUSCA').AsString := '%' + Trim(ABusca) + '%';
      LQuery.Open;
      while not LQuery.Eof do
      begin
        Result.AddElement(FuncionarioDoDataSet(LQuery));
        LQuery.Next;
      end;
    finally
      LQuery.Free;
    end;
  finally
    TDatabase.Connection.Disconnected(LIndiceConexao);
  end;
end;

class function TFuncionarioService.ObterPorId(AId: Integer): TJSONObject;
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
begin
  if AId <= 0 then
    raise EFuncionarioValidacao.Create('Funcionario invalido');

  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      PrepararConsultaFuncionario(LQuery);
      LQuery.SQL.Add('WHERE F.FUN_CODIGO = :ID');
      LQuery.ParamByName('ID').AsInteger := AId;
      LQuery.Open;
      if LQuery.IsEmpty then
        raise EFuncionarioNaoEncontrado.Create('Funcionario nao encontrado');
      Result := FuncionarioDoDataSet(LQuery);
    finally
      LQuery.Free;
    end;
  finally
    TDatabase.Connection.Disconnected(LIndiceConexao);
  end;
end;

class function TFuncionarioService.Criar(
  const AData: TJSONObject): TJSONObject;
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
  LId: Integer;
  LCpf: string;
begin
  ValidarDados(AData);
  LCpf := SomenteDigitos(Texto(AData, 'cpf'));
  LId := 0;
  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LConn.StartTransaction;
      try
        ValidarCpfUnico(LQuery, LCpf, 0);
        LQuery.Close;
        LQuery.SQL.Text := 'SELECT COALESCE(MAX(FUN_CODIGO), 0) + 1 AS NOVO_ID FROM FUNCIONARIOS';
        LQuery.Open;
        LId := LQuery.FieldByName('NOVO_ID').AsInteger;

        LQuery.Close;
        LQuery.SQL.Text := 'INSERT INTO FUNCIONARIOS ' +
          '(FUN_CODIGO, FUN_NOME, FUN_CPF, FUN_CELULAR, FUN_EMAIL, ' +
          'FUN_CATEGORIA, FUN_ATENDE, FUN_ESTADO) VALUES ' +
          '(:ID, :NOME, :CPF, :CELULAR, :EMAIL, :CATEGORIA, :ATENDE, ''ATIVO'')';
        LQuery.ParamByName('ID').AsInteger := LId;
        LQuery.ParamByName('NOME').AsString := Texto(AData, 'nome');
        LQuery.ParamByName('CPF').AsString := LCpf;
        LQuery.ParamByName('CELULAR').AsString := Texto(AData, 'celular');
        LQuery.ParamByName('EMAIL').AsString := LowerCase(Texto(AData, 'email'));
        LQuery.ParamByName('CATEGORIA').AsString := Texto(AData, 'categoria');
        LQuery.ParamByName('ATENDE').AsInteger := Ord(Booleano(AData, 'atende'));
        LQuery.ExecSQL;
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
  Result := ObterPorId(LId);
end;

class function TFuncionarioService.Atualizar(AId: Integer;
  const AData: TJSONObject): TJSONObject;
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
  LCpf: string;
begin
  if AId <= 0 then
    raise EFuncionarioValidacao.Create('Funcionario invalido');
  ValidarDados(AData);
  LCpf := SomenteDigitos(Texto(AData, 'cpf'));

  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LConn.StartTransaction;
      try
        LQuery.SQL.Text := 'SELECT FUN_CODIGO FROM FUNCIONARIOS WHERE FUN_CODIGO = :ID';
        LQuery.ParamByName('ID').AsInteger := AId;
        LQuery.Open;
        if LQuery.IsEmpty then
          raise EFuncionarioNaoEncontrado.Create('Funcionario nao encontrado');

        ValidarCpfUnico(LQuery, LCpf, AId);
        LQuery.Close;
        LQuery.SQL.Text := 'UPDATE FUNCIONARIOS SET FUN_NOME = :NOME, ' +
          'FUN_CPF = :CPF, FUN_CELULAR = :CELULAR, FUN_EMAIL = :EMAIL, ' +
          'FUN_CATEGORIA = :CATEGORIA, FUN_ATENDE = :ATENDE ' +
          'WHERE FUN_CODIGO = :ID';
        LQuery.ParamByName('NOME').AsString := Texto(AData, 'nome');
        LQuery.ParamByName('CPF').AsString := LCpf;
        LQuery.ParamByName('CELULAR').AsString := Texto(AData, 'celular');
        LQuery.ParamByName('EMAIL').AsString := LowerCase(Texto(AData, 'email'));
        LQuery.ParamByName('CATEGORIA').AsString := Texto(AData, 'categoria');
        LQuery.ParamByName('ATENDE').AsInteger := Ord(Booleano(AData, 'atende'));
        LQuery.ParamByName('ID').AsInteger := AId;
        LQuery.ExecSQL;
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
  Result := ObterPorId(AId);
end;

class function TFuncionarioService.DefinirAtivo(AId: Integer;
  AAtivo: Boolean; AExecutorId: Integer): TJSONObject;
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
  LUsuarioId: Integer;
  LUsuarioAtivo: Boolean;
  LPerfil: string;
begin
  if AId <= 0 then
    raise EFuncionarioValidacao.Create('Funcionario invalido');

  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LConn.StartTransaction;
      try
        LQuery.SQL.Text :=
          'SELECT F.FUN_CODIGO, U.USU_CODIGO, U.USU_ATIVO, P.UPR_PERFIL ' +
          'FROM FUNCIONARIOS F ' +
          'LEFT JOIN USUARIOS U ON U.USU_FUN = F.FUN_CODIGO ' +
          'LEFT JOIN USUARIO_PERFIL P ON P.UPR_USUARIO_ID = U.USU_CODIGO AND P.UPR_ATIVO = 1 ' +
          'WHERE F.FUN_CODIGO = :ID';
        LQuery.ParamByName('ID').AsInteger := AId;
        LQuery.Open;
        if LQuery.IsEmpty then
          raise EFuncionarioNaoEncontrado.Create('Funcionario nao encontrado');

        LUsuarioId := 0;
        LUsuarioAtivo := False;
        LPerfil := '';
        if not LQuery.FieldByName('USU_CODIGO').IsNull then
        begin
          LUsuarioId := LQuery.FieldByName('USU_CODIGO').AsInteger;
          LUsuarioAtivo := LQuery.FieldByName('USU_ATIVO').AsInteger = 1;
          LPerfil := LowerCase(Trim(LQuery.FieldByName('UPR_PERFIL').AsString));
        end;

        if (not AAtivo) and (LUsuarioId = AExecutorId) then
          raise EFuncionarioValidacao.Create('Nao e permitido inativar o proprio funcionario');

        if (not AAtivo) and LUsuarioAtivo and SameText(LPerfil, PERFIL_ADMIN) then
        begin
          LQuery.Close;
          LQuery.SQL.Text :=
            'SELECT COUNT(*) AS TOTAL FROM USUARIO_PERFIL P ' +
            'JOIN USUARIOS U ON U.USU_CODIGO = P.UPR_USUARIO_ID ' +
            'WHERE P.UPR_PERFIL = :PERFIL AND P.UPR_ATIVO = 1 ' +
            'AND U.USU_ATIVO = 1 AND U.USU_CODIGO <> :USUARIO_ID';
          LQuery.ParamByName('PERFIL').AsString := PERFIL_ADMIN;
          LQuery.ParamByName('USUARIO_ID').AsInteger := LUsuarioId;
          LQuery.Open;
          if LQuery.FieldByName('TOTAL').AsInteger = 0 then
            raise EFuncionarioValidacao.Create(
              'O sistema deve manter ao menos um administrador ativo');
        end;

        LQuery.Close;
        LQuery.SQL.Text := 'UPDATE FUNCIONARIOS SET FUN_ESTADO = :ESTADO ' +
          'WHERE FUN_CODIGO = :ID';
        if AAtivo then
          LQuery.ParamByName('ESTADO').AsString := 'ATIVO'
        else
          LQuery.ParamByName('ESTADO').AsString := 'INATIVO';
        LQuery.ParamByName('ID').AsInteger := AId;
        LQuery.ExecSQL;

        if (not AAtivo) and (LUsuarioId > 0) then
        begin
          LQuery.SQL.Text := 'UPDATE USUARIOS SET USU_ATIVO = 0 WHERE USU_CODIGO = :ID';
          LQuery.ParamByName('ID').AsInteger := LUsuarioId;
          LQuery.ExecSQL;
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
  Result := ObterPorId(AId);
end;

end.
