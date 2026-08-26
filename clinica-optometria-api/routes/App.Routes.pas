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
  Autorizacao.Controller,
  Funcionario.Controller,
  Catalogo.Controller,
  Funcionario.Service,
  Parceria.Service,
  Procedimento.Service,
  Autorizacao.Service,
  FichaClinica.Service,
  FichaClinicaDados.Service,
  ConfiguracaoClinica.Service,
  ConfiguracaoClinica.Controller,
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
  TAutorizacaoService.Inicializar;
  TFuncionarioService.Inicializar;
  TParceriaService.Inicializar;
  TProcedimentoService.Inicializar;
  TFichaClinicaService.Inicializar;
  TFichaClinicaDadosService.Inicializar;
  TConfiguracaoClinicaService.Inicializar;
  THorse.Use(MiddlewareAuth);

  THorse.Get('/health',
    procedure(Req: THorseRequest; Res: THorseResponse; Next: TProc)
    begin
      Res.Send('ok');
    end);

  TAuthController.Registrar;
  TAutorizacaoController.Registrar;
  TFuncionarioController.Registrar;
  TCatalogoController.Registrar;
  TPacienteController.Registrar;
  TAgendaController.Registrar;
  TConsultaController.Registrar;
  TFichaClinicaController.Registrar;
  TConfiguracaoClinicaController.Registrar;
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
