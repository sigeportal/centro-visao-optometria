program ClinicaOptometria;

{$APPTYPE CONSOLE}
{$R *.res}

uses
  System.SysUtils,
  System.JSON,
  Horse,
  Horse.CORS,
  Horse.Jhonson,
  Horse.HandleException,
  Horse.Logger,
  Horse.Logger.Provider.Console,
  Horse.GBSwagger,
  App.Routes in 'routes\App.Routes.pas',
  UnitDatabase in '..\..\..\FormsComuns\Classes\ServidoresUtils\Database\UnitDatabase.pas',
  UnitConstants in '..\..\..\FormsComuns\Classes\ServidoresUtils\Utils\UnitConstants.pas',
  Auth.Middleware in '..\..\..\FormsComuns\Classes\ServidoresUtils\Middlewares\Auth.Middleware.pas',
  Agenda.Controller in 'Controllers\Agenda.Controller.pas',
  Consulta.Controller in 'Controllers\Consulta.Controller.pas',
  FichaClinica.Controller in 'Controllers\FichaClinica.Controller.pas',
  Dashboard.Controller in 'Controllers\Dashboard.Controller.pas',
  Paciente.Controller in 'Controllers\Paciente.Controller.pas',
  Agenda.Service in 'services\Agenda.Service.pas',
  Consulta.Service in 'services\Consulta.Service.pas',
  FichaClinica.Service in 'services\FichaClinica.Service.pas',
  Dashboard.Service in 'services\Dashboard.Service.pas',
  Paciente.Service in 'services\Paciente.Service.pas',
  Models.Clinica in 'Model\Models.Clinica.pas',
  UnitAgendamento.Model in 'Model\UnitAgendamento.Model.pas',
  UnitAnamnese.Model in 'Model\UnitAnamnese.Model.pas',
  UnitConsulta.Model in 'Model\UnitConsulta.Model.pas',
  UnitDocumentoConsulta.Model in 'Model\UnitDocumentoConsulta.Model.pas',
  UnitFichaSecao.Model in 'Model\UnitFichaSecao.Model.pas',
  UnitFinanceiroLancamento.Model in 'Model\UnitFinanceiroLancamento.Model.pas',
  UnitPaciente.Model in 'Model\UnitPaciente.Model.pas',
  UnitPrescricao.Model in 'Model\UnitPrescricao.Model.pas',
  Dataset.JSON.Utils in 'utils\Dataset.JSON.Utils.pas',
  UnitFunctions in '..\..\..\FormsComuns\Classes\ServidoresUtils\Utils\UnitFunctions.pas',
  Auth.Service in '..\..\..\FormsComuns\Classes\ServidoresUtils\Services\Auth.Service.pas',
  UnitUsuarios.Model in '..\..\..\FormsComuns\Classes\Usuarios\Model\UnitUsuarios.Model.pas',
  UnitPermissoes.Model in '..\..\..\FormsComuns\Classes\Permissoes\Model\UnitPermissoes.Model.pas',
  UnitFuncionarios.Model in 'Model\UnitFuncionarios.Model.pas',
  JWT.Utils in '..\..\..\FormsComuns\Classes\ServidoresUtils\security\JWT.Utils.pas',
  Auth.Controller in '..\..\..\FormsComuns\Classes\ServidoresUtils\Controllers\Auth.Controller.pas',
  Logger.Utils in '..\..\..\FormsComuns\Classes\ServidoresUtils\Utils\Logger.Utils.pas',
  Response.Utils in '..\..\..\FormsComuns\Classes\ServidoresUtils\Utils\Response.Utils.pas';

var
  LLogConfig: THorseLoggerConsoleConfig;

begin
  ReportMemoryLeaksOnShutdown := False;

  TLogger.Setup;

  LLogConfig := THorseLoggerConsoleConfig.New
    .SetLogFormat('${request_clientip} [${time}] ${request_method} ${request_path} -> ${response_status}');
  try
    THorseLoggerManager.RegisterProvider(THorseLoggerProviderConsole.New);

    THorse.Use(CORS);
    THorse.Use(Jhonson);
    THorse.Use(THorseLoggerManager.HorseCallback);
    THorse.Use(HandleException);
    THorse.Use(HorseSwagger);

    Swagger
      .Info
        .Title('Centro Visao Optometria API')
        .Description(
          'API REST para pacientes, agenda, consultas, anamnese, prescricoes, financeiro e documentos ' +
          'do Centro Visao Optometria.')
        .Version('1.0.0')
        .Contact
          .Name('Centro Visao Optometria')
          .Email('contato@centrovisao.local')
          .URL('http://localhost')
        .&End
      .&End
      .AddBearerSecurity
      .AddCallBack(MiddlewareAuth)
      .&End;

    TAppRoutes.Routes;

    THorse.Listen(ObterPorta,
      procedure
      begin
        Writeln('=================================================');
        Writeln(' Centro Visao Optometria API - porta ', THorse.Port.ToString);
        Writeln(' Swagger: http://localhost:', THorse.Port.ToString, '/swagger/doc/html');
        Writeln('=================================================');
        Readln;
      end
    );
  finally
    LLogConfig.Free;
  end;
end.
