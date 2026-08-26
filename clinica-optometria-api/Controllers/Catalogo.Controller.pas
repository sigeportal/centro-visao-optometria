unit Catalogo.Controller;

interface

uses
  Horse;

type
  TCatalogoController = class
  public
    class procedure Registrar;
    class procedure ListarParcerias(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ObterParceria(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure CriarParceria(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure AtualizarParceria(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure AtualizarParceriaAtiva(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ListarProcedimentos(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ObterProcedimento(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure CriarProcedimento(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure AtualizarProcedimento(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure AtualizarProcedimentoAtivo(Req: THorseRequest; Res: THorseResponse; Next: TProc);
  end;

  TParceriaRequest = class
  private
    FNome, FCnpj, FTelefone, FEmail, FResponsavel, FEndereco, FCidade, FEstado: string;
  published
    property nome: string read FNome write FNome;
    property cnpj: string read FCnpj write FCnpj;
    property telefone: string read FTelefone write FTelefone;
    property email: string read FEmail write FEmail;
    property responsavel: string read FResponsavel write FResponsavel;
    property endereco: string read FEndereco write FEndereco;
    property cidade: string read FCidade write FCidade;
    property estado: string read FEstado write FEstado;
  end;

  TProcedimentoRequest = class
  private
    FNome: string;
    FDuracaoMinutos: Integer;
    FValor: Double;
  published
    property nome: string read FNome write FNome;
    property duracao_minutos: Integer read FDuracaoMinutos write FDuracaoMinutos;
    property valor: Double read FValor write FValor;
  end;

  TCatalogoAtivoRequest = class
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
  Parceria.Service,
  Procedimento.Service,
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

function AtivoDoBody(Req: THorseRequest): Boolean;
var
  LBody: TJSONObject;
  LValue: TJSONValue;
begin
  LBody := Req.Body<TJSONObject>;
  if not Assigned(LBody) then
    raise EParceriaValidacao.Create('Payload invalido');
  LValue := LBody.GetValue('ativo');
  if (not Assigned(LValue)) or
    ((not SameText(LValue.Value, 'true')) and
     (not SameText(LValue.Value, 'false'))) then
    raise EParceriaValidacao.Create('Campo ativo e obrigatorio');
  Result := SameText(LValue.Value, 'true');
end;

procedure EnviarErro(Res: THorseResponse; E: Exception; const AOrigem: string);
begin
  if (E is EParceriaNaoEncontrada) or (E is EProcedimentoNaoEncontrado) then
    Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound)
  else if (E is EParceriaValidacao) or (E is EProcedimentoValidacao) then
    Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422))
      .Status(THTTPStatus.UnprocessableEntity)
  else
  begin
    TLogger.Error(AOrigem, E);
    Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message))
      .Status(THTTPStatus.InternalServerError);
  end;
end;

class procedure TCatalogoController.Registrar;
begin
  THorse.Group.Prefix('/v1/configuracoes/parcerias').Get('',
    AutorizarRota(PERM_ADMINISTRAR, ListarParcerias));
  THorse.Group.Prefix('/v1/configuracoes/parcerias').Get('/:id',
    AutorizarRota(PERM_ADMINISTRAR, ObterParceria));
  THorse.Group.Prefix('/v1/configuracoes/parcerias').Post('',
    AutorizarRota(PERM_ADMINISTRAR, CriarParceria));
  THorse.Group.Prefix('/v1/configuracoes/parcerias').Put('/:id',
    AutorizarRota(PERM_ADMINISTRAR, AtualizarParceria));
  THorse.Group.Prefix('/v1/configuracoes/parcerias').Patch('/:id/ativo',
    AutorizarRota(PERM_ADMINISTRAR, AtualizarParceriaAtiva));

  THorse.Group.Prefix('/v1/configuracoes/procedimentos').Get('',
    AutorizarRota(PERM_ADMINISTRAR, ListarProcedimentos));
  THorse.Group.Prefix('/v1/configuracoes/procedimentos').Get('/:id',
    AutorizarRota(PERM_ADMINISTRAR, ObterProcedimento));
  THorse.Group.Prefix('/v1/configuracoes/procedimentos').Post('',
    AutorizarRota(PERM_ADMINISTRAR, CriarProcedimento));
  THorse.Group.Prefix('/v1/configuracoes/procedimentos').Put('/:id',
    AutorizarRota(PERM_ADMINISTRAR, AtualizarProcedimento));
  THorse.Group.Prefix('/v1/configuracoes/procedimentos').Patch('/:id/ativo',
    AutorizarRota(PERM_ADMINISTRAR, AtualizarProcedimentoAtivo));
end;

class procedure TCatalogoController.ListarParcerias(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
begin
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Parcerias listadas com sucesso',
      TParceriaService.Listar(QueryParam(Req, 'busca'), QueryParam(Req, 'status'))))
      .Status(THTTPStatus.OK);
  except on E: Exception do EnviarErro(Res, E, 'CatalogoController.ListarParcerias'); end;
end;

class procedure TCatalogoController.ObterParceria(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
begin
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Parceria encontrada',
      TParceriaService.ObterPorId(ParamId(Req)))).Status(THTTPStatus.OK);
  except on E: Exception do EnviarErro(Res, E, 'CatalogoController.ObterParceria'); end;
end;

class procedure TCatalogoController.CriarParceria(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
begin
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Parceria criada com sucesso',
      TParceriaService.Criar(Req.Body<TJSONObject>))).Status(THTTPStatus.Created);
  except on E: Exception do EnviarErro(Res, E, 'CatalogoController.CriarParceria'); end;
end;

class procedure TCatalogoController.AtualizarParceria(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
begin
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Parceria atualizada com sucesso',
      TParceriaService.Atualizar(ParamId(Req), Req.Body<TJSONObject>)))
      .Status(THTTPStatus.OK);
  except on E: Exception do EnviarErro(Res, E, 'CatalogoController.AtualizarParceria'); end;
end;

class procedure TCatalogoController.AtualizarParceriaAtiva(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
begin
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Status da parceria atualizado',
      TParceriaService.DefinirAtivo(ParamId(Req), AtivoDoBody(Req))))
      .Status(THTTPStatus.OK);
  except on E: Exception do EnviarErro(Res, E, 'CatalogoController.AtualizarParceriaAtiva'); end;
end;

class procedure TCatalogoController.ListarProcedimentos(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
begin
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Procedimentos listados com sucesso',
      TProcedimentoService.Listar(QueryParam(Req, 'busca'), QueryParam(Req, 'status'))))
      .Status(THTTPStatus.OK);
  except on E: Exception do EnviarErro(Res, E, 'CatalogoController.ListarProcedimentos'); end;
end;

class procedure TCatalogoController.ObterProcedimento(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
begin
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Procedimento encontrado',
      TProcedimentoService.ObterPorId(ParamId(Req)))).Status(THTTPStatus.OK);
  except on E: Exception do EnviarErro(Res, E, 'CatalogoController.ObterProcedimento'); end;
end;

class procedure TCatalogoController.CriarProcedimento(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
begin
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Procedimento criado com sucesso',
      TProcedimentoService.Criar(Req.Body<TJSONObject>))).Status(THTTPStatus.Created);
  except on E: Exception do EnviarErro(Res, E, 'CatalogoController.CriarProcedimento'); end;
end;

class procedure TCatalogoController.AtualizarProcedimento(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
begin
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Procedimento atualizado com sucesso',
      TProcedimentoService.Atualizar(ParamId(Req), Req.Body<TJSONObject>)))
      .Status(THTTPStatus.OK);
  except on E: Exception do EnviarErro(Res, E, 'CatalogoController.AtualizarProcedimento'); end;
end;

class procedure TCatalogoController.AtualizarProcedimentoAtivo(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
begin
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Status do procedimento atualizado',
      TProcedimentoService.DefinirAtivo(ParamId(Req), AtivoDoBody(Req))))
      .Status(THTTPStatus.OK);
  except on E: Exception do EnviarErro(Res, E, 'CatalogoController.AtualizarProcedimentoAtivo'); end;
end;

initialization
  Swagger
    .BasePath('v1')
    .Path('configuracoes/parcerias')
      .Tag('Configuracoes')
      .GET('Listar parcerias', 'Lista parcerias para administracao').&End
      .POST('Criar parceria', 'Cria uma parceria ativa')
        .AddParamBody('Parceria', 'Dados da parceria').Required(True)
          .Schema(TParceriaRequest).&End
      .&End
    .&End
    .Path('configuracoes/procedimentos')
      .Tag('Configuracoes')
      .GET('Listar procedimentos', 'Lista procedimentos e precos').&End
      .POST('Criar procedimento', 'Cria um procedimento ativo')
        .AddParamBody('Procedimento', 'Dados do procedimento').Required(True)
          .Schema(TProcedimentoRequest).&End
      .&End
    .&End;

end.
