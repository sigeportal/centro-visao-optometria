unit Correlation.Middleware;

interface

uses
  Horse,
  System.SysUtils;

function ObterCorrelationId(Req: THorseRequest): string;
procedure MiddlewareCorrelation(Req: THorseRequest; Res: THorseResponse; Next: TProc);

implementation

function ObterCorrelationId(Req: THorseRequest): string;
var
  LId: string;
begin
  LId := Req.Headers['X-Correlation-Id'];
  if LId.IsEmpty then
    LId := Req.Headers['X-Request-Id'];
  if LId.IsEmpty then
    LId := TGUID.NewGuid.ToString.Replace('{', '').Replace('}', '');
  Result := LId;
end;

procedure MiddlewareCorrelation(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  LCorrelationId: string;
begin
  LCorrelationId := ObterCorrelationId(Req);
  Res.RawWebResponse.SetCustomHeader('X-Correlation-Id', LCorrelationId);
  Next;
end;

end.
