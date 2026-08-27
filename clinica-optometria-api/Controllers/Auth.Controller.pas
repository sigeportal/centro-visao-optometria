unit Auth.Controller;

interface

uses
  Horse;

type
  TAuthController = class
  public
    class procedure Registrar;
    class procedure Login(Req: THorseRequest; Res: THorseResponse; Next: TProc);
  end;

implementation

uses
  System.JSON,
  System.SysUtils,
  Horse.Commons,
  Horse.GBSwagger,
  Auth.Service,
  Correlation.Middleware,
  Response.Utils,
  Logger.Utils;

type
  TLoginRequest = class
  private
    Fusername: string;
    Fpassword: string;
  published
    property username: string read Fusername write Fusername;
    property password: string read Fpassword write Fpassword;
  end;

class procedure TAuthController.Registrar;
begin
  THorse.Post('/v1/auth/login', Login);
end;

class procedure TAuthController.Login(Req: THorseRequest; Res: THorseResponse;
  Next: TProc);
var
  LBody: TJSONObject;
  LUsername, LPassword: string;
  LResult: TJSONObject;
  LCorrelationId: string;
begin
  try
    LBody := Req.Body<TJSONObject>;
    if not Assigned(LBody) then
    begin
      Res.Send<TJSONObject>(TResponseUtils.BadRequest('Dados de login nao fornecidos'))
        .Status(THTTPStatus.BadRequest);
      Exit;
    end;

    LUsername := LBody.GetValue<string>('username', '');
    LPassword := LBody.GetValue<string>('password', '');

    if LUsername.IsEmpty or LPassword.IsEmpty then
    begin
      Res.Send<TJSONObject>(TResponseUtils.BadRequest('Usuario e senha sao obrigatorios'))
        .Status(THTTPStatus.BadRequest);
      Exit;
    end;

    LResult := TAuthService.Autenticar(LUsername, LPassword);
    if Assigned(LResult) then
      Res.Send<TJSONObject>(TResponseUtils.Success('Login realizado com sucesso', LResult))
        .Status(THTTPStatus.OK)
    else
      Res.Send<TJSONObject>(TResponseUtils.Unauthorized('Usuario ou senha invalidos'))
        .Status(THTTPStatus.Unauthorized);
  except
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AuthController.Login']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
end;

end.
