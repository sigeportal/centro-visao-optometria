unit Autorizacao.Controller;

interface

uses
  Horse;

type
  TAutorizacaoController = class
  public
    class procedure Registrar;
    class procedure MinhaSessao(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ListarUsuarios(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ListarFuncionarios(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure CriarUsuario(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure AtualizarUsuario(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure AtualizarPerfil(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure RedefinirSenha(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure AtualizarAtivo(Req: THorseRequest; Res: THorseResponse; Next: TProc);
  end;

  TPerfilUsuarioRequest = class
  private
    FPerfil: string;
  published
    property perfil: string read FPerfil write FPerfil;
  end;

  TUsuarioCadastroRequest = class
  private
    FUsername: string;
    FFuncionarioId: Integer;
    FPerfil: string;
    FSenha: string;
    FConfirmacaoSenha: string;
  published
    property username: string read FUsername write FUsername;
    property funcionario_id: Integer read FFuncionarioId write FFuncionarioId;
    property perfil: string read FPerfil write FPerfil;
    property senha: string read FSenha write FSenha;
    property confirmar_senha: string read FConfirmacaoSenha write FConfirmacaoSenha;
  end;

  TUsuarioAtualizacaoRequest = class
  private
    FUsername: string;
    FFuncionarioId: Integer;
    FPerfil: string;
  published
    property username: string read FUsername write FUsername;
    property funcionario_id: Integer read FFuncionarioId write FFuncionarioId;
    property perfil: string read FPerfil write FPerfil;
  end;

  TSenhaUsuarioRequest = class
  private
    FSenha: string;
    FConfirmacaoSenha: string;
  published
    property senha: string read FSenha write FSenha;
    property confirmar_senha: string read FConfirmacaoSenha write FConfirmacaoSenha;
  end;

  TUsuarioAtivoRequest = class
  private
    FAtivo: Boolean;
  published
    property ativo: Boolean read FAtivo write FAtivo;
  end;

implementation

uses
  System.JSON,
  System.SysUtils,
  Horse.Commons,
  Horse.GBSwagger,
  Autorizacao.Service,
  Autorizacao.Middleware,
  Auditoria.Service,
  Correlation.Middleware,
  Response.Utils,
  Logger.Utils;

class procedure TAutorizacaoController.Registrar;
begin
  THorse.Group.Prefix('/v1/auth').Get('/me', MinhaSessao);
  THorse.Group.Prefix('/v1/auth').Get('/usuarios',
    AutorizarRota(PERM_ADMINISTRAR, ListarUsuarios));
  THorse.Group.Prefix('/v1/auth').Get('/usuarios/funcionarios-disponiveis',
    AutorizarRota(PERM_ADMINISTRAR, ListarFuncionarios));
  THorse.Group.Prefix('/v1/auth').Post('/usuarios',
    AutorizarRota(PERM_ADMINISTRAR, CriarUsuario));
  THorse.Group.Prefix('/v1/auth').Put('/usuarios/:id',
    AutorizarRota(PERM_ADMINISTRAR, AtualizarUsuario));
  THorse.Group.Prefix('/v1/auth').Put('/usuarios/:id/perfil',
    AutorizarRota(PERM_ADMINISTRAR, AtualizarPerfil));
  THorse.Group.Prefix('/v1/auth').Patch('/usuarios/:id/senha',
    AutorizarRota(PERM_ADMINISTRAR, RedefinirSenha));
  THorse.Group.Prefix('/v1/auth').Patch('/usuarios/:id/ativo',
    AutorizarRota(PERM_ADMINISTRAR, AtualizarAtivo));
end;

class procedure TAutorizacaoController.ListarFuncionarios(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
var
  LUsuarioId: Integer;
  LCorrelationId: string;
begin
  try
    LUsuarioId := StrToIntDef(Req.Query.Items['usuario_id'], 0);
    Res.Send<TJSONObject>(TResponseUtils.Success(
      'Funcionarios disponiveis listados com sucesso',
      TAutorizacaoService.ListarFuncionariosDisponiveis(LUsuarioId)))
      .Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AutorizacaoController.ListarFuncionarios']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
end;

class procedure TAutorizacaoController.CriarUsuario(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
var
  LBody: TJSONObject;
  LResObj: TJSONObject;
  LNovoId: Integer;
  LCorrelationId: string;
begin
  try
    LBody := Req.Body<TJSONObject>;
    if not Assigned(LBody) then
      raise EAutorizacaoValidacao.Create('Payload invalido');

    LResObj := TAutorizacaoService.CriarUsuario(
        LBody.GetValue<string>('username', ''),
        LBody.GetValue<Integer>('funcionario_id', 0),
        LBody.GetValue<string>('perfil', ''),
        LBody.GetValue<string>('senha', ''),
        LBody.GetValue<string>('confirmar_senha', ''));
    LNovoId := LResObj.GetValue<Integer>('id', 0);
    TAuditoriaService.Registrar(Req, 'CREATE', 'USUARIOS', LNovoId, 'Cadastro de usuario');

    Res.Send<TJSONObject>(TResponseUtils.Success(
      'Usuario criado com sucesso', LResObj))
      .Status(THTTPStatus.Created);
  except
    on E: EAutorizacaoValidacao do
      Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422)).Status(THTTPStatus.UnprocessableEntity);
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AutorizacaoController.CriarUsuario']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
end;

class procedure TAutorizacaoController.AtualizarUsuario(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
var
  LUsuarioId: Integer;
  LBody: TJSONObject;
  LCorrelationId: string;
begin
  try
    LUsuarioId := StrToIntDef(Req.Params.Items['id'], 0);
    LBody := Req.Body<TJSONObject>;
    if (LUsuarioId <= 0) or (not Assigned(LBody)) then
      raise EAutorizacaoValidacao.Create('Dados invalidos');

    Res.Send<TJSONObject>(TResponseUtils.Success(
      'Usuario atualizado com sucesso',
      TAutorizacaoService.AtualizarUsuario(
        LUsuarioId,
        LBody.GetValue<string>('username', ''),
        LBody.GetValue<Integer>('funcionario_id', 0),
        LBody.GetValue<string>('perfil', ''))))
      .Status(THTTPStatus.OK);
  except
    on E: EAutorizacaoNaoEncontrada do
      Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
    on E: EAutorizacaoValidacao do
      Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422)).Status(THTTPStatus.UnprocessableEntity);
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AutorizacaoController.AtualizarUsuario']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
end;

class procedure TAutorizacaoController.MinhaSessao(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
var
  LUsuarioId: Integer;
  LCorrelationId: string;
begin
  try
    LUsuarioId := UsuarioIdAutenticado(Req);
    if LUsuarioId <= 0 then
    begin
      Res.Send<TJSONObject>(TResponseUtils.Unauthorized('Usuario nao autenticado'))
        .Status(THTTPStatus.Unauthorized);
      Exit;
    end;

    Res.Send<TJSONObject>(TResponseUtils.Success(
      'Sessao carregada com sucesso',
      TAutorizacaoService.SessaoUsuario(LUsuarioId)))
      .Status(THTTPStatus.OK);
  except
    on E: EAutorizacaoNaoEncontrada do
      Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
    on E: EAutorizacaoInativa do
      Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 403)).Status(THTTPStatus.Forbidden);
    on E: EAutorizacaoValidacao do
      Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422)).Status(THTTPStatus.UnprocessableEntity);
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AutorizacaoController.MinhaSessao']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
end;

class procedure TAutorizacaoController.RedefinirSenha(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
var
  LUsuarioId: Integer;
  LBody: TJSONObject;
  LCorrelationId: string;
begin
  try
    LUsuarioId := StrToIntDef(Req.Params.Items['id'], 0);
    LBody := Req.Body<TJSONObject>;
    if (LUsuarioId <= 0) or (not Assigned(LBody)) then
      raise EAutorizacaoValidacao.Create('Dados invalidos');

    TAutorizacaoService.RedefinirSenha(
      LUsuarioId,
      LBody.GetValue<string>('senha', ''),
      LBody.GetValue<string>('confirmar_senha', ''));
    TAuditoriaService.Registrar(Req, 'UPDATE', 'USUARIOS', LUsuarioId, 'Redefinicao de senha');
    Res.Send<TJSONObject>(TResponseUtils.Success('Senha redefinida com sucesso'))
      .Status(THTTPStatus.OK);
  except
    on E: EAutorizacaoNaoEncontrada do
      Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
    on E: EAutorizacaoValidacao do
      Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422)).Status(THTTPStatus.UnprocessableEntity);
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AutorizacaoController.RedefinirSenha']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
end;

class procedure TAutorizacaoController.AtualizarAtivo(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
var
  LUsuarioId: Integer;
  LExecutorId: Integer;
  LBody: TJSONObject;
  LAtivoValue: TJSONValue;
  LAtivo: Boolean;
  LCorrelationId: string;
begin
  try
    LUsuarioId := StrToIntDef(Req.Params.Items['id'], 0);
    LExecutorId := UsuarioIdAutenticado(Req);
    LBody := Req.Body<TJSONObject>;
    if (LUsuarioId <= 0) or (not Assigned(LBody)) then
      raise EAutorizacaoValidacao.Create('Dados invalidos');

    LAtivoValue := LBody.GetValue('ativo');
    if (not Assigned(LAtivoValue)) or
      ((not SameText(LAtivoValue.Value, 'true')) and
       (not SameText(LAtivoValue.Value, 'false'))) then
      raise EAutorizacaoValidacao.Create('Campo ativo e obrigatorio');
    LAtivo := SameText(LAtivoValue.Value, 'true');

    TAutorizacaoService.DefinirAtivo(LUsuarioId, LAtivo, LExecutorId);
    Res.Send<TJSONObject>(TResponseUtils.Success('Status do usuario atualizado com sucesso'))
      .Status(THTTPStatus.OK);
  except
    on E: EAutorizacaoNaoEncontrada do
      Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
    on E: EAutorizacaoValidacao do
      Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422)).Status(THTTPStatus.UnprocessableEntity);
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AutorizacaoController.AtualizarAtivo']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
end;

class procedure TAutorizacaoController.ListarUsuarios(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
var
  LCorrelationId: string;
begin
  try
    Res.Send<TJSONObject>(TResponseUtils.Success(
      'Usuarios listados com sucesso',
      TAutorizacaoService.ListarUsuarios))
      .Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AutorizacaoController.ListarUsuarios']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
end;

class procedure TAutorizacaoController.AtualizarPerfil(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
var
  LUsuarioId: Integer;
  LBody: TJSONObject;
  LPerfil: string;
  LCorrelationId: string;
begin
  try
    LUsuarioId := StrToIntDef(Req.Params.Items['id'], 0);
    LBody := Req.Body<TJSONObject>;
    if (LUsuarioId <= 0) or (not Assigned(LBody)) then
      raise EAutorizacaoValidacao.Create('Dados invalidos');

    LPerfil := LBody.GetValue<string>('perfil', '');
    TAutorizacaoService.DefinirPerfil(LUsuarioId, LPerfil);

    Res.Send<TJSONObject>(TResponseUtils.Success('Perfil atualizado com sucesso'))
      .Status(THTTPStatus.OK);
  except
    on E: EAutorizacaoNaoEncontrada do
      Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
    on E: EAutorizacaoValidacao do
      Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422)).Status(THTTPStatus.UnprocessableEntity);
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AutorizacaoController.AtualizarPerfil']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
end;

initialization
  Swagger
    .Path('auth/me')
      .Tag('Autenticacao')
      .GET('Sessao atual', 'Retorna usuario, funcionario, perfil e permissoes vigentes')
      .&End
    .&End;
  Swagger
    .BasePath('v1')
    .Path('auth/usuarios')
      .Tag('Autorizacao')
      .GET('Listar usuarios e perfis', 'Lista usuarios existentes sem expor credenciais')
      .&End
      .POST('Criar usuario', 'Cria usuario ativo com funcionario e perfil exclusivos')
        .AddParamBody('Usuario', 'Dados do novo usuario')
          .Required(True)
          .Schema(TUsuarioCadastroRequest)
        .&End
      .&End
    .&End
    .Path('auth/usuarios/funcionarios-disponiveis')
      .Tag('Autorizacao')
      .GET('Listar funcionarios disponiveis', 'Lista funcionarios ativos sem outro usuario vinculado')
      .&End
    .&End
    .Path('auth/usuarios/{id}')
      .Tag('Autorizacao')
      .PUT('Atualizar usuario', 'Atualiza login, funcionario e perfil')
        .AddParamPath('id', 'Identificador numerico do usuario').Required(True).&End
        .AddParamBody('Usuario', 'Dados cadastrais do usuario')
          .Required(True)
          .Schema(TUsuarioAtualizacaoRequest)
        .&End
      .&End
    .&End
    .Path('auth/usuarios/{id}/perfil')
      .Tag('Autorizacao')
      .PUT('Atualizar perfil do usuario', 'Atribui um unico perfil ativo ao usuario')
        .AddParamPath('id', 'Identificador numerico do usuario')
          .Required(True)
        .&End
        .AddParamBody('Perfil', 'Perfil do usuario')
          .Required(True)
          .Schema(TPerfilUsuarioRequest)
        .&End
      .&End
    .&End
    .Path('auth/usuarios/{id}/senha')
      .Tag('Autorizacao')
      .PATCH('Redefinir senha', 'Redefine a senha sem retornar seu hash')
        .AddParamPath('id', 'Identificador numerico do usuario').Required(True).&End
        .AddParamBody('Senha', 'Nova senha e confirmacao')
          .Required(True)
          .Schema(TSenhaUsuarioRequest)
        .&End
      .&End
    .&End
    .Path('auth/usuarios/{id}/ativo')
      .Tag('Autorizacao')
      .PATCH('Ativar ou inativar usuario', 'Altera o acesso preservando o historico')
        .AddParamPath('id', 'Identificador numerico do usuario').Required(True).&End
        .AddParamBody('Status', 'Novo status do usuario')
          .Required(True)
          .Schema(TUsuarioAtivoRequest)
        .&End
      .&End
    .&End;

end.
