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
  end;

implementation

uses
  System.SysUtils,
  System.JSON,
  Horse.Commons,
  Horse.GBSwagger,
  Dashboard.Service,
  Response.Utils,
  Logger.Utils;

class procedure TDashboardController.Registrar;
begin
  THorse.Group.Prefix('/v1/dashboard').Get('/resumo', Resumo);
  THorse.Group.Prefix('/v1/dashboard').Get('/proximas-consultas', ProximasConsultas);
  THorse.Group.Prefix('/v1/dashboard').Get('/aniversariantes', Aniversariantes);
  THorse.Group.Prefix('/v1/dashboard').Get('/consultas-vencidas', ConsultasVencidas);
end;

class procedure TDashboardController.Resumo(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TDashboardService;
begin
  Service := TDashboardService.Create;
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Resumo carregado com sucesso', Service.Resumo))
      .Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      TLogger.Error('DashboardController.Resumo', E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TDashboardController.ProximasConsultas(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TDashboardService;
begin
  Service := TDashboardService.Create;
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Proximas consultas carregadas com sucesso', Service.ProximasConsultas))
      .Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      TLogger.Error('DashboardController.ProximasConsultas', E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TDashboardController.Aniversariantes(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TDashboardService;
begin
  Service := TDashboardService.Create;
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Aniversariantes carregados com sucesso', Service.Aniversariantes))
      .Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      TLogger.Error('DashboardController.Aniversariantes', E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TDashboardController.ConsultasVencidas(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TDashboardService;
begin
  Service := TDashboardService.Create;
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Consultas vencidas carregadas com sucesso', Service.ConsultasVencidas))
      .Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      TLogger.Error('DashboardController.ConsultasVencidas', E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message))
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
