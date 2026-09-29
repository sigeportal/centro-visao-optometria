unit Auth.Middleware;

interface

uses
  Horse,
  Horse.JWT,
  System.SysUtils,
  System.StrUtils,
  UnitConstants;

procedure MiddlewareAuth(Req: THorseRequest; Res: THorseResponse; Next: TNextProc);

implementation

procedure MiddlewareAuth(Req: THorseRequest; Res: THorseResponse; Next: TNextProc);
var
  path      : string;
  SECRET_KEY: string;
begin
  SECRET_KEY := TConstants.JWTSecret;

  path := Req.RawWebRequest.PathInfo;
  if (not path.StartsWith('/swagger')) and
     (not path.StartsWith('/v1/auth/login')) and
     (not path.StartsWith('/health')) and
     (not (SameText(Req.RawWebRequest.Method, 'GET') and
          (path.StartsWith('/v1/usuarios/') or path.StartsWith('/v1/auth/usuarios/') or path.StartsWith('/v1/pacientes/')) and
          path.EndsWith('/foto'))) then
    HorseJWT(SECRET_KEY)(Req, Res, Next)
  else
    Next;
end;

end.
