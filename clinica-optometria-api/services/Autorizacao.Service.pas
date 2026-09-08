unit Autorizacao.Service;

interface

uses
  System.JSON,
  System.SysUtils;

const
  PERFIL_RECEPCIONISTA = 'recepcionista';
  PERFIL_OPTOMETRISTA = 'optometrista';
  PERFIL_ADMIN = 'admin';

  PERM_DASHBOARD_CONSULTAR = 'dashboard.consultar';
  PERM_PACIENTE_CONSULTAR = 'paciente.consultar';
  PERM_PACIENTE_ALTERAR = 'paciente.alterar';
  PERM_PACIENTE_EXCLUIR = 'paciente.excluir';
  PERM_AGENDA_CONSULTAR = 'agenda.consultar';
  PERM_AGENDA_ALTERAR = 'agenda.alterar';
  PERM_CONSULTA_RESUMO = 'consulta.resumo';
  PERM_CLINICO_CONSULTAR = 'clinico.consultar';
  PERM_CLINICO_ALTERAR = 'clinico.alterar';
  PERM_FICHA_CONFIGURAR = 'ficha.configurar';
  PERM_FINANCEIRO_LANCAR = 'financeiro.lancar';
  PERM_FINANCEIRO_CONSULTAR = 'financeiro.consultar';
  PERM_ADMINISTRAR = 'sistema.administrar';

type
  EAutorizacaoValidacao = class(Exception);
  EAutorizacaoNaoEncontrada = class(Exception);
  EAutorizacaoInativa = class(Exception);

  TAutorizacaoService = class
  public
    class procedure Inicializar;
    class function PerfilValido(const APerfil: string): Boolean;
    class function UsuarioAtivo(AUsuarioId: Integer): Boolean;
    class function PerfilUsuario(AUsuarioId: Integer): string;
    class function PermissoesDoPerfil(const APerfil: string): TJSONArray;
    class function TemPermissao(AUsuarioId: Integer; const APermissao: string): Boolean;
    class function SessaoUsuario(AUsuarioId: Integer): TJSONObject;
    class function ListarUsuarios: TJSONArray;
    class function ListarFuncionariosDisponiveis(AUsuarioId: Integer = 0): TJSONArray;
    class function CriarUsuario(const AUsername: string; AFuncionarioId: Integer;
      const APerfil, ASenha, AConfirmacaoSenha: string): TJSONObject;
    class function AtualizarUsuario(AUsuarioId: Integer; const AUsername: string;
      AFuncionarioId: Integer; const APerfil: string): TJSONObject;
    class procedure RedefinirSenha(AUsuarioId: Integer; const ASenha,
      AConfirmacaoSenha: string);
    class procedure DefinirAtivo(AUsuarioId: Integer; AAtivo: Boolean;
      AExecutorId: Integer);
    class procedure DefinirPerfil(AUsuarioId: Integer; const APerfil: string);
  end;

implementation

uses
  Data.DB,
  FireDAC.Comp.Client,
  System.Hash,
  UnitConnection.Model.Interfaces,
  UnitDatabase,
  Security.Password,
  UnitUsuarioPerfil.Model;

procedure AdicionarPermissao(ALista: TJSONArray; const APermissao: string);
begin
  ALista.Add(APermissao);
end;

procedure AdicionarPermissoesOperacionais(ALista: TJSONArray);
begin
  AdicionarPermissao(ALista, PERM_DASHBOARD_CONSULTAR);
  AdicionarPermissao(ALista, PERM_PACIENTE_CONSULTAR);
  AdicionarPermissao(ALista, PERM_PACIENTE_ALTERAR);
  AdicionarPermissao(ALista, PERM_AGENDA_CONSULTAR);
  AdicionarPermissao(ALista, PERM_AGENDA_ALTERAR);
  AdicionarPermissao(ALista, PERM_CONSULTA_RESUMO);
end;

function NormalizarLogin(const AUsername: string): string;
begin
  Result := LowerCase(Trim(AUsername));
  if Result = '' then
    raise EAutorizacaoValidacao.Create('Login e obrigatorio');
  if Length(Result) > 20 then
    raise EAutorizacaoValidacao.Create('Login deve possuir no maximo 20 caracteres');
end;

procedure ValidarSenha(const ASenha, AConfirmacaoSenha: string);
begin
  if Length(ASenha) < 8 then
    raise EAutorizacaoValidacao.Create('Senha deve possuir no minimo 8 caracteres');
  if ASenha <> AConfirmacaoSenha then
    raise EAutorizacaoValidacao.Create('Confirmacao de senha nao confere');
end;

class procedure TAutorizacaoService.Inicializar;
var
  LPerfil: TModelUsuarioPerfil;
  LQuery: iQuery;
  LUsuarioId: Integer;
begin
  LPerfil := TModelUsuarioPerfil.Create(TDatabase.Connection);
  try
    LPerfil.CriaTabela;
  finally
    LPerfil.Free;
  end;

  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT COUNT(*) AS TOTAL FROM RDB$RELATION_FIELDS ');
  LQuery.Add('WHERE TRIM(RDB$RELATION_NAME) = ''USUARIOS'' ');
  LQuery.Add('AND TRIM(RDB$FIELD_NAME) = ''USU_ATIVO''');
  LQuery.Open;
  if LQuery.DataSet.FieldByName('TOTAL').AsInteger = 0 then
  begin
    LQuery.Clear;
    LQuery.Add('ALTER TABLE USUARIOS ADD USU_ATIVO SMALLINT DEFAULT 1 NOT NULL');
    LQuery.ExecSQL;
  end;

  LQuery.Clear;
  LQuery.Add('UPDATE USUARIOS SET USU_ATIVO = 1 WHERE USU_ATIVO IS NULL');
  LQuery.ExecSQL;

  // Garante que o campo USU_SENHA tenha capacidade para hashes seguros (VARCHAR(255))
  try
    LQuery.Clear;
    LQuery.Add('ALTER TABLE USUARIOS ALTER USU_SENHA TYPE VARCHAR(255)');
    LQuery.ExecSQL;
  except
    try
      LQuery.Clear;
      LQuery.Add('ALTER TABLE USUARIOS ALTER COLUMN USU_SENHA TYPE VARCHAR(255)');
      LQuery.ExecSQL;
    except
      // Se ja estiver atualizado ou ocorrer erro de compatibilidade de dialeto, prossegue
    end;
  end;

  LQuery.Clear;
  LQuery.Add('SELECT FIRST 1 USU_CODIGO FROM USUARIOS WHERE UPPER(USU_LOGIN) = ''ADMIN''');
  LQuery.Open;
  if LQuery.DataSet.IsEmpty then
    Exit;

  LUsuarioId := LQuery.DataSet.FieldByName('USU_CODIGO').AsInteger;
  LQuery.Clear;
  LQuery.Add('SELECT COUNT(*) AS TOTAL FROM USUARIO_PERFIL WHERE UPR_USUARIO_ID = :USUARIO_ID');
  LQuery.AddParam('USUARIO_ID', LUsuarioId);
  LQuery.Open;
  if LQuery.DataSet.FieldByName('TOTAL').AsInteger > 0 then
    Exit;

  LPerfil := TModelUsuarioPerfil.Create(TDatabase.Connection);
  try
    LPerfil.UsuarioId := LUsuarioId;
    LPerfil.Perfil := PERFIL_ADMIN;
    LPerfil.Ativo := 1;
    LPerfil.SalvaNoBanco(1);
  finally
    LPerfil.Free;
  end;
end;

class function TAutorizacaoService.UsuarioAtivo(AUsuarioId: Integer): Boolean;
var
  LQuery: iQuery;
begin
  Result := False;
  if AUsuarioId <= 0 then
    Exit;

  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT USU_ATIVO FROM USUARIOS WHERE USU_CODIGO = :USUARIO_ID');
  LQuery.AddParam('USUARIO_ID', AUsuarioId);
  LQuery.Open;
  if not LQuery.DataSet.IsEmpty then
    Result := LQuery.DataSet.FieldByName('USU_ATIVO').AsInteger = 1;
end;

class function TAutorizacaoService.PerfilValido(const APerfil: string): Boolean;
var
  LPerfil: string;
begin
  LPerfil := LowerCase(Trim(APerfil));
  Result := (LPerfil = PERFIL_RECEPCIONISTA) or
    (LPerfil = PERFIL_OPTOMETRISTA) or
    (LPerfil = PERFIL_ADMIN);
end;

class function TAutorizacaoService.PerfilUsuario(AUsuarioId: Integer): string;
var
  LQuery: iQuery;
begin
  Result := '';
  if AUsuarioId <= 0 then
    Exit;

  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT UPR_PERFIL FROM USUARIO_PERFIL ');
  LQuery.Add('WHERE UPR_USUARIO_ID = :USUARIO_ID AND UPR_ATIVO = 1');
  LQuery.AddParam('USUARIO_ID', AUsuarioId);
  LQuery.Open;
  if not LQuery.DataSet.IsEmpty then
    Result := LowerCase(Trim(LQuery.DataSet.FieldByName('UPR_PERFIL').AsString));
end;

class function TAutorizacaoService.PermissoesDoPerfil(const APerfil: string): TJSONArray;
var
  LPerfil: string;
begin
  Result := TJSONArray.Create;
  LPerfil := LowerCase(Trim(APerfil));

  if LPerfil = PERFIL_RECEPCIONISTA then
  begin
    AdicionarPermissoesOperacionais(Result);
    AdicionarPermissao(Result, PERM_FINANCEIRO_LANCAR);
    Exit;
  end;

  if LPerfil = PERFIL_OPTOMETRISTA then
  begin
    AdicionarPermissoesOperacionais(Result);
    AdicionarPermissao(Result, PERM_CLINICO_CONSULTAR);
    AdicionarPermissao(Result, PERM_CLINICO_ALTERAR);
    AdicionarPermissao(Result, PERM_FICHA_CONFIGURAR);
    Exit;
  end;

  if LPerfil = PERFIL_ADMIN then
  begin
    AdicionarPermissoesOperacionais(Result);
    AdicionarPermissao(Result, PERM_PACIENTE_EXCLUIR);
    AdicionarPermissao(Result, PERM_CLINICO_CONSULTAR);
    AdicionarPermissao(Result, PERM_CLINICO_ALTERAR);
    AdicionarPermissao(Result, PERM_FICHA_CONFIGURAR);
    AdicionarPermissao(Result, PERM_FINANCEIRO_LANCAR);
    AdicionarPermissao(Result, PERM_FINANCEIRO_CONSULTAR);
    AdicionarPermissao(Result, PERM_ADMINISTRAR);
  end;
end;

class function TAutorizacaoService.TemPermissao(AUsuarioId: Integer;
  const APermissao: string): Boolean;
var
  LPermissoes: TJSONArray;
  I: Integer;
begin
  Result := False;
  if not UsuarioAtivo(AUsuarioId) then
    Exit;
  LPermissoes := PermissoesDoPerfil(PerfilUsuario(AUsuarioId));
  try
    for I := 0 to LPermissoes.Count - 1 do
      if SameText(LPermissoes.Items[I].Value, APermissao) then
        Exit(True);
  finally
    LPermissoes.Free;
  end;
end;

class function TAutorizacaoService.SessaoUsuario(AUsuarioId: Integer): TJSONObject;
var
  LQuery: iQuery;
  LPerfil: string;
begin
  if AUsuarioId <= 0 then
    raise EAutorizacaoValidacao.Create('Usuario invalido');

  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT U.USU_CODIGO, U.USU_LOGIN, U.USU_FUN, U.USU_ATIVO, F.FUN_NOME ');
  LQuery.Add('FROM USUARIOS U LEFT JOIN FUNCIONARIOS F ON F.FUN_CODIGO = U.USU_FUN ');
  LQuery.Add('WHERE U.USU_CODIGO = :USUARIO_ID');
  LQuery.AddParam('USUARIO_ID', AUsuarioId);
  LQuery.Open;
  if LQuery.DataSet.IsEmpty then
    raise EAutorizacaoNaoEncontrada.Create('Usuario nao encontrado');
  if LQuery.DataSet.FieldByName('USU_ATIVO').AsInteger <> 1 then
    raise EAutorizacaoInativa.Create('Usuario inativo');

  LPerfil := PerfilUsuario(AUsuarioId);
  Result := TJSONObject.Create;
  Result.AddPair('user_id', TJSONNumber.Create(AUsuarioId));
  Result.AddPair('username', LQuery.DataSet.FieldByName('USU_LOGIN').AsString);
  Result.AddPair('funcionario_id', TJSONNumber.Create(LQuery.DataSet.FieldByName('USU_FUN').AsInteger));
  Result.AddPair('funcionario', LQuery.DataSet.FieldByName('FUN_NOME').AsString);
  Result.AddPair('ativo', TJSONBool.Create(True));
  if LPerfil = '' then
    Result.AddPair('perfil', TJSONNull.Create)
  else
    Result.AddPair('perfil', LPerfil);
  Result.AddPair('permissoes', PermissoesDoPerfil(LPerfil));
end;

class function TAutorizacaoService.ListarUsuarios: TJSONArray;
var
  LQuery: iQuery;
  LItem: TJSONObject;
  LPerfil: string;
begin
  Result := TJSONArray.Create;
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT U.USU_CODIGO, U.USU_LOGIN, U.USU_FUN, U.USU_ATIVO, F.FUN_NOME, P.UPR_PERFIL ');
  LQuery.Add('FROM USUARIOS U ');
  LQuery.Add('LEFT JOIN FUNCIONARIOS F ON F.FUN_CODIGO = U.USU_FUN ');
  LQuery.Add('LEFT JOIN USUARIO_PERFIL P ON P.UPR_USUARIO_ID = U.USU_CODIGO AND P.UPR_ATIVO = 1 ');
  LQuery.Add('ORDER BY U.USU_LOGIN');
  LQuery.Open;

  while not LQuery.DataSet.Eof do
  begin
    LPerfil := LowerCase(Trim(LQuery.DataSet.FieldByName('UPR_PERFIL').AsString));
    LItem := TJSONObject.Create;
    LItem.AddPair('user_id', TJSONNumber.Create(LQuery.DataSet.FieldByName('USU_CODIGO').AsInteger));
    LItem.AddPair('username', LQuery.DataSet.FieldByName('USU_LOGIN').AsString);
    LItem.AddPair('funcionario_id', TJSONNumber.Create(LQuery.DataSet.FieldByName('USU_FUN').AsInteger));
    LItem.AddPair('funcionario', LQuery.DataSet.FieldByName('FUN_NOME').AsString);
    LItem.AddPair('ativo', TJSONBool.Create(
      LQuery.DataSet.FieldByName('USU_ATIVO').AsInteger = 1));
    if LPerfil = '' then
      LItem.AddPair('perfil', TJSONNull.Create)
    else
      LItem.AddPair('perfil', LPerfil);
    Result.AddElement(LItem);
    LQuery.DataSet.Next;
  end;
end;

class function TAutorizacaoService.ListarFuncionariosDisponiveis(
  AUsuarioId: Integer): TJSONArray;
var
  LQuery: iQuery;
  LItem: TJSONObject;
begin
  Result := TJSONArray.Create;
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT F.FUN_CODIGO, F.FUN_NOME FROM FUNCIONARIOS F ');
  LQuery.Add('WHERE UPPER(TRIM(COALESCE(F.FUN_ESTADO, ''''))) = ''ATIVO'' ');
  LQuery.Add('AND NOT EXISTS (SELECT 1 FROM USUARIOS U ');
  LQuery.Add('WHERE U.USU_FUN = F.FUN_CODIGO AND U.USU_CODIGO <> :USUARIO_ID) ');
  LQuery.Add('ORDER BY F.FUN_NOME');
  LQuery.AddParam('USUARIO_ID', AUsuarioId);
  LQuery.Open;
  while not LQuery.DataSet.Eof do
  begin
    LItem := TJSONObject.Create;
    LItem.AddPair('id', TJSONNumber.Create(LQuery.DataSet.FieldByName('FUN_CODIGO').AsInteger));
    LItem.AddPair('nome', LQuery.DataSet.FieldByName('FUN_NOME').AsString);
    Result.AddElement(LItem);
    LQuery.DataSet.Next;
  end;
end;

class function TAutorizacaoService.CriarUsuario(const AUsername: string;
  AFuncionarioId: Integer; const APerfil, ASenha,
  AConfirmacaoSenha: string): TJSONObject;
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
  LUsername: string;
  LPerfil: string;
  LUsuarioId: Integer;
begin
  LUsername := NormalizarLogin(AUsername);
  LPerfil := LowerCase(Trim(APerfil));
  if AFuncionarioId <= 0 then
    raise EAutorizacaoValidacao.Create('Funcionario e obrigatorio');
  if not PerfilValido(LPerfil) then
    raise EAutorizacaoValidacao.Create('Perfil invalido');
  ValidarSenha(ASenha, AConfirmacaoSenha);

  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LConn.StartTransaction;
      try
        LQuery.SQL.Text := 'SELECT FUN_CODIGO FROM FUNCIONARIOS ' +
          'WHERE FUN_CODIGO = :ID AND UPPER(TRIM(COALESCE(FUN_ESTADO, ''''))) = ''ATIVO''';
        LQuery.ParamByName('ID').AsInteger := AFuncionarioId;
        LQuery.Open;
        if LQuery.IsEmpty then
          raise EAutorizacaoValidacao.Create('Funcionario ativo nao encontrado');

        LQuery.Close;
        LQuery.SQL.Text := 'SELECT COUNT(*) AS TOTAL FROM USUARIOS ' +
          'WHERE UPPER(USU_LOGIN) = UPPER(:LOGIN) OR USU_FUN = :FUNCIONARIO_ID';
        LQuery.ParamByName('LOGIN').AsString := LUsername;
        LQuery.ParamByName('FUNCIONARIO_ID').AsInteger := AFuncionarioId;
        LQuery.Open;
        if LQuery.FieldByName('TOTAL').AsInteger > 0 then
          raise EAutorizacaoValidacao.Create('Login ou funcionario ja possui usuario');

        LQuery.Close;
        LQuery.SQL.Text := 'SELECT COALESCE(MAX(USU_CODIGO), 0) + 1 AS NOVO_ID FROM USUARIOS';
        LQuery.Open;
        LUsuarioId := LQuery.FieldByName('NOVO_ID').AsInteger;

        LQuery.Close;
        LQuery.SQL.Text := 'INSERT INTO USUARIOS ' +
          '(USU_CODIGO, USU_LOGIN, USU_FUN, USU_SENHA, USU_ATIVO) ' +
          'VALUES (:ID, :LOGIN, :FUNCIONARIO_ID, :SENHA, 1)';
        LQuery.ParamByName('ID').AsInteger := LUsuarioId;
        LQuery.ParamByName('LOGIN').AsString := LUsername;
        LQuery.ParamByName('FUNCIONARIO_ID').AsInteger := AFuncionarioId;
        LQuery.ParamByName('SENHA').AsString := TSecurityPassword.HashSenha(ASenha);
        LQuery.ExecSQL;

        LQuery.SQL.Text := 'INSERT INTO USUARIO_PERFIL ' +
          '(UPR_USUARIO_ID, UPR_PERFIL, UPR_ATIVO) VALUES (:ID, :PERFIL, 1)';
        LQuery.ParamByName('ID').AsInteger := LUsuarioId;
        LQuery.ParamByName('PERFIL').AsString := LPerfil;
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
  Result := SessaoUsuario(LUsuarioId);
end;

class function TAutorizacaoService.AtualizarUsuario(AUsuarioId: Integer;
  const AUsername: string; AFuncionarioId: Integer;
  const APerfil: string): TJSONObject;
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
  LUsername: string;
  LPerfil: string;
  LPerfilAtual: string;
begin
  if AUsuarioId <= 0 then
    raise EAutorizacaoValidacao.Create('Usuario invalido');
  LUsername := NormalizarLogin(AUsername);
  LPerfil := LowerCase(Trim(APerfil));
  if AFuncionarioId <= 0 then
    raise EAutorizacaoValidacao.Create('Funcionario e obrigatorio');
  if not PerfilValido(LPerfil) then
    raise EAutorizacaoValidacao.Create('Perfil invalido');

  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LConn.StartTransaction;
      try
        LQuery.SQL.Text := 'SELECT P.UPR_PERFIL FROM USUARIOS U ' +
          'LEFT JOIN USUARIO_PERFIL P ON P.UPR_USUARIO_ID = U.USU_CODIGO AND P.UPR_ATIVO = 1 ' +
          'WHERE U.USU_CODIGO = :ID';
        LQuery.ParamByName('ID').AsInteger := AUsuarioId;
        LQuery.Open;
        if LQuery.IsEmpty then
          raise EAutorizacaoNaoEncontrada.Create('Usuario nao encontrado');
        LPerfilAtual := LowerCase(Trim(LQuery.FieldByName('UPR_PERFIL').AsString));

        LQuery.Close;
        LQuery.SQL.Text := 'SELECT FUN_CODIGO FROM FUNCIONARIOS ' +
          'WHERE FUN_CODIGO = :ID AND UPPER(TRIM(COALESCE(FUN_ESTADO, ''''))) = ''ATIVO''';
        LQuery.ParamByName('ID').AsInteger := AFuncionarioId;
        LQuery.Open;
        if LQuery.IsEmpty then
          raise EAutorizacaoValidacao.Create('Funcionario ativo nao encontrado');

        LQuery.Close;
        LQuery.SQL.Text := 'SELECT COUNT(*) AS TOTAL FROM USUARIOS WHERE ' +
          '(UPPER(USU_LOGIN) = UPPER(:LOGIN) OR USU_FUN = :FUNCIONARIO_ID) ' +
          'AND USU_CODIGO <> :ID';
        LQuery.ParamByName('LOGIN').AsString := LUsername;
        LQuery.ParamByName('FUNCIONARIO_ID').AsInteger := AFuncionarioId;
        LQuery.ParamByName('ID').AsInteger := AUsuarioId;
        LQuery.Open;
        if LQuery.FieldByName('TOTAL').AsInteger > 0 then
          raise EAutorizacaoValidacao.Create('Login ou funcionario ja possui usuario');

        if SameText(LPerfilAtual, PERFIL_ADMIN) and
          (not SameText(LPerfil, PERFIL_ADMIN)) then
        begin
          LQuery.Close;
          LQuery.SQL.Text := 'SELECT COUNT(*) AS TOTAL FROM USUARIO_PERFIL P ' +
            'JOIN USUARIOS U ON U.USU_CODIGO = P.UPR_USUARIO_ID ' +
            'WHERE P.UPR_PERFIL = :PERFIL AND P.UPR_ATIVO = 1 ' +
            'AND U.USU_ATIVO = 1 AND U.USU_CODIGO <> :ID';
          LQuery.ParamByName('PERFIL').AsString := PERFIL_ADMIN;
          LQuery.ParamByName('ID').AsInteger := AUsuarioId;
          LQuery.Open;
          if LQuery.FieldByName('TOTAL').AsInteger = 0 then
            raise EAutorizacaoValidacao.Create('O sistema deve manter ao menos um administrador ativo');
        end;

        LQuery.Close;
        LQuery.SQL.Text := 'UPDATE USUARIOS SET USU_LOGIN = :LOGIN, USU_FUN = :FUNCIONARIO_ID ' +
          'WHERE USU_CODIGO = :ID';
        LQuery.ParamByName('LOGIN').AsString := LUsername;
        LQuery.ParamByName('FUNCIONARIO_ID').AsInteger := AFuncionarioId;
        LQuery.ParamByName('ID').AsInteger := AUsuarioId;
        LQuery.ExecSQL;

        LQuery.SQL.Text := 'UPDATE OR INSERT INTO USUARIO_PERFIL ' +
          '(UPR_USUARIO_ID, UPR_PERFIL, UPR_ATIVO) VALUES (:ID, :PERFIL, 1) ' +
          'MATCHING (UPR_USUARIO_ID)';
        LQuery.ParamByName('ID').AsInteger := AUsuarioId;
        LQuery.ParamByName('PERFIL').AsString := LPerfil;
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
  Result := TJSONObject.Create;
  Result.AddPair('user_id', TJSONNumber.Create(AUsuarioId));
  Result.AddPair('username', LUsername);
  Result.AddPair('funcionario_id', TJSONNumber.Create(AFuncionarioId));
  Result.AddPair('perfil', LPerfil);
  Result.AddPair('ativo', TJSONBool.Create(UsuarioAtivo(AUsuarioId)));
end;

class procedure TAutorizacaoService.RedefinirSenha(AUsuarioId: Integer;
  const ASenha, AConfirmacaoSenha: string);
var
  LQuery: iQuery;
begin
  if AUsuarioId <= 0 then
    raise EAutorizacaoValidacao.Create('Usuario invalido');
  ValidarSenha(ASenha, AConfirmacaoSenha);
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT COUNT(*) AS TOTAL FROM USUARIOS WHERE USU_CODIGO = :ID');
  LQuery.AddParam('ID', AUsuarioId);
  LQuery.Open;
  if LQuery.DataSet.FieldByName('TOTAL').AsInteger = 0 then
    raise EAutorizacaoNaoEncontrada.Create('Usuario nao encontrado');

  LQuery.Clear;
  LQuery.Add('UPDATE USUARIOS SET USU_SENHA = :SENHA WHERE USU_CODIGO = :ID');
  LQuery.AddParam('SENHA', TSecurityPassword.HashSenha(ASenha));
  LQuery.AddParam('ID', AUsuarioId);
  LQuery.ExecSQL;
end;

class procedure TAutorizacaoService.DefinirAtivo(AUsuarioId: Integer;
  AAtivo: Boolean; AExecutorId: Integer);
var
  LQuery: iQuery;
  LPerfil: string;
  LFuncionarioId: Integer;
begin
  if AUsuarioId <= 0 then
    raise EAutorizacaoValidacao.Create('Usuario invalido');
  if (not AAtivo) and (AUsuarioId = AExecutorId) then
    raise EAutorizacaoValidacao.Create('Nao e permitido inativar o proprio usuario');

  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT U.USU_FUN, P.UPR_PERFIL FROM USUARIOS U ');
  LQuery.Add('LEFT JOIN USUARIO_PERFIL P ON P.UPR_USUARIO_ID = U.USU_CODIGO AND P.UPR_ATIVO = 1 ');
  LQuery.Add('WHERE U.USU_CODIGO = :ID');
  LQuery.AddParam('ID', AUsuarioId);
  LQuery.Open;
  if LQuery.DataSet.IsEmpty then
    raise EAutorizacaoNaoEncontrada.Create('Usuario nao encontrado');
  LFuncionarioId := LQuery.DataSet.FieldByName('USU_FUN').AsInteger;
  LPerfil := LowerCase(Trim(LQuery.DataSet.FieldByName('UPR_PERFIL').AsString));

  if AAtivo then
  begin
    LQuery.Clear;
    LQuery.Add('SELECT COUNT(*) AS TOTAL FROM FUNCIONARIOS WHERE FUN_CODIGO = :ID ');
    LQuery.Add('AND UPPER(TRIM(COALESCE(FUN_ESTADO, ''''))) = ''ATIVO''');
    LQuery.AddParam('ID', LFuncionarioId);
    LQuery.Open;
    if LQuery.DataSet.FieldByName('TOTAL').AsInteger = 0 then
      raise EAutorizacaoValidacao.Create('Funcionario vinculado precisa estar ativo');
  end
  else if SameText(LPerfil, PERFIL_ADMIN) then
  begin
    LQuery.Clear;
    LQuery.Add('SELECT COUNT(*) AS TOTAL FROM USUARIO_PERFIL P ');
    LQuery.Add('JOIN USUARIOS U ON U.USU_CODIGO = P.UPR_USUARIO_ID ');
    LQuery.Add('WHERE P.UPR_PERFIL = :PERFIL AND P.UPR_ATIVO = 1 ');
    LQuery.Add('AND U.USU_ATIVO = 1 AND U.USU_CODIGO <> :ID');
    LQuery.AddParam('PERFIL', PERFIL_ADMIN);
    LQuery.AddParam('ID', AUsuarioId);
    LQuery.Open;
    if LQuery.DataSet.FieldByName('TOTAL').AsInteger = 0 then
      raise EAutorizacaoValidacao.Create('O sistema deve manter ao menos um administrador ativo');
  end;

  LQuery.Clear;
  LQuery.Add('UPDATE USUARIOS SET USU_ATIVO = :ATIVO WHERE USU_CODIGO = :ID');
  LQuery.AddParam('ATIVO', Ord(AAtivo));
  LQuery.AddParam('ID', AUsuarioId);
  LQuery.ExecSQL;
end;

class procedure TAutorizacaoService.DefinirPerfil(AUsuarioId: Integer;
  const APerfil: string);
var
  LPerfil: TModelUsuarioPerfil;
  LQuery: iQuery;
  LPerfilNormalizado: string;
begin
  LPerfilNormalizado := LowerCase(Trim(APerfil));
  if not PerfilValido(LPerfilNormalizado) then
    raise EAutorizacaoValidacao.Create('Perfil invalido');

  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT COUNT(*) AS TOTAL FROM USUARIOS WHERE USU_CODIGO = :USUARIO_ID');
  LQuery.AddParam('USUARIO_ID', AUsuarioId);
  LQuery.Open;
  if LQuery.DataSet.FieldByName('TOTAL').AsInteger = 0 then
    raise EAutorizacaoNaoEncontrada.Create('Usuario nao encontrado');

  if SameText(PerfilUsuario(AUsuarioId), PERFIL_ADMIN) and
    (not SameText(LPerfilNormalizado, PERFIL_ADMIN)) then
  begin
    LQuery.Clear;
    LQuery.Add('SELECT COUNT(*) AS TOTAL FROM USUARIO_PERFIL P ');
    LQuery.Add('JOIN USUARIOS U ON U.USU_CODIGO = P.UPR_USUARIO_ID ');
    LQuery.Add('WHERE P.UPR_PERFIL = :PERFIL AND P.UPR_ATIVO = 1 ');
    LQuery.Add('AND U.USU_ATIVO = 1 AND P.UPR_USUARIO_ID <> :USUARIO_ID');
    LQuery.AddParam('PERFIL', PERFIL_ADMIN);
    LQuery.AddParam('USUARIO_ID', AUsuarioId);
    LQuery.Open;
    if LQuery.DataSet.FieldByName('TOTAL').AsInteger = 0 then
      raise EAutorizacaoValidacao.Create('O sistema deve manter ao menos um administrador');
  end;

  LPerfil := TModelUsuarioPerfil.Create(TDatabase.Connection);
  try
    LPerfil.BuscaDadosTabela(AUsuarioId);
    LPerfil.UsuarioId := AUsuarioId;
    LPerfil.Perfil := LPerfilNormalizado;
    LPerfil.Ativo := 1;
    LPerfil.SalvaNoBanco(1);
  finally
    LPerfil.Free;
  end;
end;

end.
