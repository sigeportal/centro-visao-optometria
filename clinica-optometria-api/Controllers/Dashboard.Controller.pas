unit Dashboard.Controller;

interface

uses
  Horse;

type
  TDashboardController = class
  public
    class procedure Registrar;
    class procedure Resumo(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ProximasConsultas(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure Aniversariantes(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ConsultasVencidas(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure Retornos(Req: THorseRequest; Res: THorseResponse; Next: TProc);
  end;

implementation

uses
  System.SysUtils,
  System.JSON,
  Horse.Commons,
  Horse.GBSwagger,
  Autorizacao.Middleware,
  Autorizacao.Service,
  Dashboard.Service,
  Correlation.Middleware,
  Response.Utils,
  Logger.Utils;

function QueryParam(Req: THorseRequest; const AName: string): string;
begin
  Result := '';
  Req.Query.TryGetValue(AName, Result);
end;

class procedure TDashboardController.Registrar;
begin
  THorse.Group.Prefix('/v1/dashboard').Get('/resumo', AutorizarRota(PERM_DASHBOARD_CONSULTAR, Resumo));
  THorse.Group.Prefix('/v1/dashboard').Get('/proximas-consultas', AutorizarRota(PERM_DASHBOARD_CONSULTAR, ProximasConsultas));
  THorse.Group.Prefix('/v1/dashboard').Get('/aniversariantes', AutorizarRota(PERM_DASHBOARD_CONSULTAR, Aniversariantes));
  THorse.Group.Prefix('/v1/dashboard').Get('/consultas-vencidas', AutorizarRota(PERM_DASHBOARD_CONSULTAR, ConsultasVencidas));
  THorse.Group.Prefix('/v1/dashboard').Get('/retornos', AutorizarRota(PERM_DASHBOARD_CONSULTAR, Retornos));
end;

class procedure TDashboardController.Resumo(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TDashboardService;
  LCorrelationId: string;
begin
  Service := TDashboardService.Create;
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Resumo carregado com sucesso', Service.Resumo))
      .Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'DashboardController.Resumo']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TDashboardController.ProximasConsultas(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TDashboardService;
  LCorrelationId: string;
begin
  Service := TDashboardService.Create;
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Proximas consultas carregadas com sucesso', Service.ProximasConsultas))
      .Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'DashboardController.ProximasConsultas']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TDashboardController.Aniversariantes(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TDashboardService;
  LCorrelationId: string;
begin
  Service := TDashboardService.Create;
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Aniversariantes carregados com sucesso', Service.Aniversariantes(QueryParam(Req, 'periodo'))))
      .Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'DashboardController.Aniversariantes']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TDashboardController.ConsultasVencidas(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TDashboardService;
  LCorrelationId: string;
begin
  Service := TDashboardService.Create;
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Consultas vencidas carregadas com sucesso', Service.ConsultasVencidas))
      .Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'DashboardController.ConsultasVencidas']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TDashboardController.Retornos(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TDashboardService;
  LCorrelationId: string;
begin
  Service := TDashboardService.Create;
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Retornos carregados com sucesso', Service.Retornos))
      .Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'DashboardController.Retornos']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

initialization
  Swagger
    .BasePath('v1')
    .Path('dashboard/resumo')
      .Tag('Dashboard')
      .GET('Resumo do dashboard', 'Retorna indicadores operacionais da clinica')
        .AddResponse(200, 'Resumo carregado com sucesso').&End
        .AddResponse(500, 'Erro interno ao carregar resumo').&End
      .&End
    .&End
    .Path('dashboard/proximas-consultas')
      .Tag('Dashboard')
      .GET('Proximas consultas', 'Retorna proximos agendamentos pendentes')
        .AddResponse(200, 'Proximas consultas carregadas com sucesso').&End
      .&End
    .&End
    .Path('dashboard/aniversariantes')
      .Tag('Dashboard')
      .GET('Aniversariantes do dia', 'Retorna pacientes aniversariantes do dia')
        .AddResponse(200, 'Aniversariantes carregados com sucesso').&End
      .&End
    .&End
    .Path('dashboard/consultas-vencidas')
      .Tag('Dashboard')
      .GET('Consultas vencidas', 'Retorna agendamentos vencidos ainda pendentes')
        .AddResponse(200, 'Consultas vencidas carregadas com sucesso').&End
      .&End
    .&End;

end.
