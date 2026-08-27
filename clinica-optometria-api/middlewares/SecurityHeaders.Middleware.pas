unit SecurityHeaders.Middleware;

interface

uses
  Horse;

procedure MiddlewareSecurityHeaders(Req: THorseRequest; Res: THorseResponse; Next: TProc);

implementation

procedure MiddlewareSecurityHeaders(Req: THorseRequest; Res: THorseResponse; Next: TProc);
begin
  Res.RawWebResponse.SetCustomHeader('X-Content-Type-Options', 'nosniff');
  Res.RawWebResponse.SetCustomHeader('X-Frame-Options', 'SAMEORIGIN');
  Res.RawWebResponse.SetCustomHeader('X-XSS-Protection', '1; mode=block');
  Res.RawWebResponse.SetCustomHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  Res.RawWebResponse.SetCustomHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  Next;
end;

end.
