unit ConfiguracaoClinica.Controller;

interface

uses
  Horse;

type
  TConfiguracaoClinicaController = class
  public
    class procedure Registrar;
    class procedure Obter(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure Atualizar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
  end;

implementation

uses
  System.JSON,
  System.SysUtils,
  Horse.Commons,
  Horse.GBSwagger,
  Autorizacao.Middleware,
  Autorizacao.Service,
  ConfiguracaoClinica.Service,
  Correlation.Middleware,
  Response.Utils,
  Logger.Utils;

class procedure TConfiguracaoClinicaController.Registrar;
begin
  THorse.Group.Prefix('/v1/configuracoes').Get('/clinica',
    AutorizarRota(PERM_CLINICO_CONSULTAR, Obter));
  THorse.Group.Prefix('/v1/configuracoes').Put('/clinica',
    AutorizarRota(PERM_ADMINISTRAR, Atualizar));
end;

class procedure TConfiguracaoClinicaController.Obter(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
var
  LCorrelationId: string;
begin
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Dados da clinica carregados',
      TConfiguracaoClinicaService.Obter)).Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'ConfiguracaoClinicaController.Obter']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
end;

class procedure TConfiguracaoClinicaController.Atualizar(Req: THorseRequest;
  Res: THorseResponse; Next: TProc);
var
  LCorrelationId: string;
begin
  try
    Res.Send<TJSONObject>(TResponseUtils.Success('Dados da clinica atualizados',
      TConfiguracaoClinicaService.Atualizar(UsuarioIdAutenticado(Req),
        Req.Body<TJSONObject>))).Status(THTTPStatus.OK);
  except
    on E: EConfiguracaoClinicaValidacao do
      Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422))
        .Status(THTTPStatus.UnprocessableEntity);
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'ConfiguracaoClinicaController.Atualizar']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
end;

initialization
  Swagger
    .BasePath('v1')
    .Path('configuracoes/clinica')
      .Tag('Configuracoes')
      .GET('Obter dados da clinica', 'Retorna identificacao e endereco institucional')
        .AddResponse(200, 'Dados carregados').&End
      .&End
      .PUT('Atualizar dados da clinica', 'Atualiza dados institucionais usados nos documentos')
        .AddResponse(200, 'Dados atualizados').&End
        .AddResponse(422, 'Dados invalidos').&End
      .&End
    .&End;

end.
