unit Funcionario.Controller;

interface

uses
  Horse;

type
  TFuncionarioController = class
  public
    class procedure Registrar;
    class procedure Listar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ObterPorId(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure Criar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure Atualizar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure AtualizarAtivo(Req: THorseRequest; Res: THorseResponse; Next: TProc);
  end;

  TFuncionarioRequest = class
  private
    FNome: string;
    FCpf: string;
    FCelular: string;
    FEmail: string;
    FCategoria: string;
    FAtende: Boolean;
  published
    property nome: string read FNome write FNome;
    property cpf: string read FCpf write FCpf;
    property celular: string read FCelular write FCelular;
    property email: string read FEmail write FEmail;
    property categoria: string read FCategoria write FCategoria;
    property atende: Boolean read FAtende write FAtende;
  end;

  TFuncionarioAtivoRequest = class
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
  Autorizacao.Middleware,
  Autorizacao.Service,
  Funcionario.Service,
  Correlation.Middleware,
  Response.Utils,
  Logger.Utils;

function QueryParam(Req: THorseRequest; const AName: string): string;
begin
  Result := '';
  Req.Query.TryGetValue(AName, Result);
end;

function ParamId(Req: THorseRequest): Integer;
begin
  Result := StrToIntDef(Req.Params.Items['id'], 0);
end;

procedure EnviarErro(Req: THorseRequest; Res: THorseResponse; E: Exception; const AOrigem: string);
var
  LCorrelationId: string;
begin
  if E is EFuncionarioNaoEncontrado then
    Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound)
  else if E is EFuncionarioValidacao then
    Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422))
      .Status(THTTPStatus.UnprocessableEntity)
  else
  begin
    LCorrelationId := ObterCorrelationId(Req);
    TLogger.Error(Format('[%s] %s', [LCorrelationId, AOrigem]), E);
    Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
      .Status(THTTPStatus.InternalServerError);
  end;
end;

class procedure TFuncionarioController.Registrar;
begin
  THorse.Group.Prefix('/v1/funcionarios').Get('',
    AutorizarRota(PERM_ADMINISTRAR, Listar));
  THorse.Group.Prefix('/v1/funcionarios').Get('/:id',
    AutorizarRota(PERM_ADMINISTRAR, ObterPorId));
  THorse.Group.Prefix('/v1/funcionarios').Post('',
    AutorizarRota(PERM_ADMINISTRAR, Criar));
  THorse.Group.Prefix('/v1/funcionarios').Put('/:id',
    AutorizarRota(PERM_ADMINISTRAR, Atualizar));
  THorse.Group.Prefix('/v1/funcionarios').Patch('/:id/ativo',
    AutorizarRota(PERM_ADMINISTRAR, AtualizarAtivo));
end;

class procedure TFuncionarioController.Listar(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
begin
  try
    Res.Send<TJSONObject>(TResponseUtils.Success(
      'Funcionarios listados com sucesso',
      TFuncionarioService.Listar(QueryParam(Req, 'busca'),
        QueryParam(Req, 'status')))).Status(THTTPStatus.OK);
  except
    on E: Exception do
      EnviarErro(Req, Res, E, 'FuncionarioController.Listar');
  end;
end;

class procedure TFuncionarioController.ObterPorId(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
begin
  try
    Res.Send<TJSONObject>(TResponseUtils.Success(
      'Funcionario encontrado',
      TFuncionarioService.ObterPorId(ParamId(Req)))).Status(THTTPStatus.OK);
  except
    on E: Exception do
      EnviarErro(Req, Res, E, 'FuncionarioController.ObterPorId');
  end;
end;

class procedure TFuncionarioController.Criar(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
var
  LBody: TJSONObject;
begin
  try
    LBody := Req.Body<TJSONObject>;
    Res.Send<TJSONObject>(TResponseUtils.Success(
      'Funcionario criado com sucesso',
      TFuncionarioService.Criar(LBody))).Status(THTTPStatus.Created);
  except
    on E: Exception do
      EnviarErro(Req, Res, E, 'FuncionarioController.Criar');
  end;
end;

class procedure TFuncionarioController.Atualizar(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
var
  LBody: TJSONObject;
begin
  try
    LBody := Req.Body<TJSONObject>;
    Res.Send<TJSONObject>(TResponseUtils.Success(
      'Funcionario atualizado com sucesso',
      TFuncionarioService.Atualizar(ParamId(Req), LBody))).Status(THTTPStatus.OK);
  except
    on E: Exception do
      EnviarErro(Req, Res, E, 'FuncionarioController.Atualizar');
  end;
end;

class procedure TFuncionarioController.AtualizarAtivo(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
var
  LBody: TJSONObject;
  LAtivoValue: TJSONValue;
begin
  try
    LBody := Req.Body<TJSONObject>;
    if not Assigned(LBody) then
      raise EFuncionarioValidacao.Create('Payload invalido');
    LAtivoValue := LBody.GetValue('ativo');
    if (not Assigned(LAtivoValue)) or
      ((not SameText(LAtivoValue.Value, 'true')) and
       (not SameText(LAtivoValue.Value, 'false'))) then
      raise EFuncionarioValidacao.Create('Campo ativo e obrigatorio');

    Res.Send<TJSONObject>(TResponseUtils.Success(
      'Status do funcionario atualizado com sucesso',
      TFuncionarioService.DefinirAtivo(ParamId(Req),
        SameText(LAtivoValue.Value, 'true'), UsuarioIdAutenticado(Req))))
      .Status(THTTPStatus.OK);
  except
    on E: Exception do
      EnviarErro(Req, Res, E, 'FuncionarioController.AtualizarAtivo');
  end;
end;

initialization
  Swagger
    .BasePath('v1')
    .Path('funcionarios')
      .Tag('Funcionarios')
      .GET('Listar funcionarios', 'Lista funcionarios e o estado do acesso vinculado')
      .&End
      .POST('Criar funcionario', 'Cria funcionario ativo sem criar usuario automaticamente')
        .AddParamBody('Funcionario', 'Dados cadastrais do funcionario')
          .Required(True).Schema(TFuncionarioRequest).&End
      .&End
    .&End
    .Path('funcionarios/{id}')
      .Tag('Funcionarios')
      .GET('Obter funcionario', 'Retorna um funcionario pelo identificador')
        .AddParamPath('id', 'Identificador numerico').Required(True).&End
      .&End
      .PUT('Atualizar funcionario', 'Atualiza os dados operacionais do funcionario')
        .AddParamPath('id', 'Identificador numerico').Required(True).&End
        .AddParamBody('Funcionario', 'Dados cadastrais do funcionario')
          .Required(True).Schema(TFuncionarioRequest).&End
      .&End
    .&End
    .Path('funcionarios/{id}/ativo')
      .Tag('Funcionarios')
      .PATCH('Ativar ou inativar funcionario',
        'A inativacao tambem bloqueia o usuario vinculado; a reativacao nao libera o acesso')
        .AddParamPath('id', 'Identificador numerico').Required(True).&End
        .AddParamBody('Status', 'Novo status do funcionario')
          .Required(True).Schema(TFuncionarioAtivoRequest).&End
      .&End
    .&End;

end.
