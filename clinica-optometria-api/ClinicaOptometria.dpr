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
  Correlation.Middleware in 'middlewares\Correlation.Middleware.pas',
  App.Routes in 'routes\App.Routes.pas',
  UnitDatabase in 'database\UnitDatabase.pas',
  UnitConstants in 'utils\UnitConstants.pas',
  Auth.Middleware in 'middlewares\Auth.Middleware.pas',
  Autorizacao.Middleware in 'middlewares\Autorizacao.Middleware.pas',
  SecurityHeaders.Middleware in 'middlewares\SecurityHeaders.Middleware.pas',
  Autorizacao.Controller in 'Controllers\Autorizacao.Controller.pas',
  Funcionario.Controller in 'Controllers\Funcionario.Controller.pas',
  Catalogo.Controller in 'Controllers\Catalogo.Controller.pas',
  Agenda.Controller in 'Controllers\Agenda.Controller.pas',
  Consulta.Controller in 'Controllers\Consulta.Controller.pas',
  FichaClinica.Controller in 'Controllers\FichaClinica.Controller.pas',
  Dashboard.Controller in 'Controllers\Dashboard.Controller.pas',
  Paciente.Controller in 'Controllers\Paciente.Controller.pas',
  Agenda.Service in 'services\Agenda.Service.pas',
  Atendimento.Service in 'services\Atendimento.Service.pas',
  Consulta.Service in 'services\Consulta.Service.pas',
  FichaClinica.Service in 'services\FichaClinica.Service.pas',
  FichaClinicaDados.Service in 'services\FichaClinicaDados.Service.pas',
  Dashboard.Service in 'services\Dashboard.Service.pas',
  Paciente.Service in 'services\Paciente.Service.pas',
  Autorizacao.Service in 'services\Autorizacao.Service.pas',
  Funcionario.Service in 'services\Funcionario.Service.pas',
  Parceria.Service in 'services\Parceria.Service.pas',
  Procedimento.Service in 'services\Procedimento.Service.pas',
  Models.Clinica in 'Model\Models.Clinica.pas',
  UnitAgendamento.Model in 'Model\UnitAgendamento.Model.pas',
  UnitAnamnese.Model in 'Model\UnitAnamnese.Model.pas',
  UnitConsulta.Model in 'Model\UnitConsulta.Model.pas',
  UnitDocumentoConsulta.Model in 'Model\UnitDocumentoConsulta.Model.pas',
  UnitFichaSecao.Model in 'Model\UnitFichaSecao.Model.pas',
  UnitFichaClinicaDados.Model in 'Model\UnitFichaClinicaDados.Model.pas',
  UnitFinanceiroLancamento.Model in 'Model\UnitFinanceiroLancamento.Model.pas',
  UnitPaciente.Model in 'Model\UnitPaciente.Model.pas',
  UnitPrescricao.Model in 'Model\UnitPrescricao.Model.pas',
  UnitRetornoConsulta.Model in 'Model\UnitRetornoConsulta.Model.pas',
  UnitUsuarioPerfil.Model in 'Model\UnitUsuarioPerfil.Model.pas',
  UnitParceria.Model in 'Model\UnitParceria.Model.pas',
  UnitProcedimento.Model in 'Model\UnitProcedimento.Model.pas',
  Dataset.JSON.Utils in 'utils\Dataset.JSON.Utils.pas',
  UnitFunctions in 'utils\UnitFunctions.pas',
  Auth.Service in 'services\Auth.Service.pas',
  UnitUsuarios.Model in 'Model\UnitUsuarios.Model.pas',
  UnitPermissoes.Model in 'Model\UnitPermissoes.Model.pas',
  UnitFuncionarios.Model in 'Model\UnitFuncionarios.Model.pas',
  UnitAuditoria.Model in 'Model\UnitAuditoria.Model.pas',
  Auditoria.Service in 'services\Auditoria.Service.pas',
  JWT.Utils in 'security\JWT.Utils.pas',
  Security.Password in 'security\Security.Password.pas',
  Auth.Controller in 'Controllers\Auth.Controller.pas',
  Logger.Utils in 'utils\Logger.Utils.pas',
  Response.Utils in 'utils\Response.Utils.pas';

var
  LLogConfig: THorseLoggerConsoleConfig;

begin
  ReportMemoryLeaksOnShutdown := False;

  TConstants.CarregarArquivoEnv;
  TLogger.Setup;

  try
    TConstants.ValidarConfiguracaoObrigatoria;
    TLogger.Info('Configuracao de seguranca validada com sucesso');
  except
    on E: EConfiguracaoInvalida do
    begin
      Writeln('ERRO FATAL DE CONFIGURACAO: ' + E.Message);
      TLogger.Error('Inicializacao abortada', E);
      ExitCode := 1;
      Exit;
    end;
  end;

  LLogConfig := THorseLoggerConsoleConfig.New
    .SetLogFormat('${request_clientip} [${time}] ${request_method} ${request_path} -> ${response_status}');
  try
    THorseLoggerManager.RegisterProvider(THorseLoggerProviderConsole.New);

    HorseCORS
      .AllowedOrigin(TConstants.CORSAllowedOrigins)
      .AllowedHeaders('Content-Type, Authorization, X-Requested-With, Accept, Origin')
      .AllowedMethods('GET, POST, PUT, DELETE, PATCH, OPTIONS')
      .AllowedCredentials(True);

    THorse.Use(MiddlewareCorrelation);
    THorse.Use(CORS);
    THorse.Use(MiddlewareSecurityHeaders);
    THorse.Use(Jhonson);
    THorse.Use(THorseLoggerManager.HorseCallback);
    THorse.Use(HandleException(
      procedure(const E: Exception; const Req: THorseRequest; const Res: THorseResponse; var ASendException: Boolean)
      var
        LCorrelationId: string;
      begin
        ASendException := False;
        LCorrelationId := ObterCorrelationId(Req);
        TLogger.Error(Format('[%s] Excecao nao tratada na rota %s', [LCorrelationId, Req.RawWebRequest.PathInfo]), E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
          .Status(THTTPStatus.InternalServerError);
      end
    ));
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

    THorse.Port := ObterPorta;
    THorse.Listen(
      procedure
      begin
        Writeln('=================================================');
        Writeln(' Centro Visao Optometria API - porta ', THorse.Port.ToString);
        Writeln(' Swagger: http://localhost:', THorse.Port.ToString, '/swagger/doc/html');
        Writeln(' Banco de Dados: ' + TConstants.BancoDados);
        Writeln('=================================================');
        Readln;
      end
    );
  finally
    LLogConfig.Free;
  end;
end.
