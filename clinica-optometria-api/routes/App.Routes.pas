unit App.Routes;

interface

type
  TAppRoutes = class
  public
    class procedure Routes;
    class procedure Registrar;
  end;

implementation

uses
  Horse,
  Horse.GBSwagger,
  Paciente.Controller,
  Agenda.Controller,
  Consulta.Controller,
  FichaClinica.Controller,
  Dashboard.Controller,
  Auth.Middleware, 
  Auth.Controller;

type
  THealthResponse = class
  private
    Fstatus: string;
  published
    property status: string read Fstatus write Fstatus;
  end;

class procedure TAppRoutes.Routes;
begin
  THorse.Use(MiddlewareAuth);

  THorse.Get('/health',
    procedure(Req: THorseRequest; Res: THorseResponse; Next: TProc)
    begin
      Res.Send('ok');
    end);

  TAuthController.Registrar;
  TPacienteController.Registrar;
  TAgendaController.Registrar;
  TConsultaController.Registrar;
  TFichaClinicaController.Registrar;
  TDashboardController.Registrar;
end;

class procedure TAppRoutes.Registrar;
begin
  Routes;
end;

initialization
  Swagger
    .Path('health')
      .Tag('Infraestrutura')
      .GET('Health check', 'Retorna o status simples de disponibilidade da API')
        .AddResponse(200, 'API operando normalmente')
          .Schema(THealthResponse)
        .&End
      .&End
    .&End;

end.
