unit Autorizacao.Middleware;

interface

uses
  Horse,
  Horse.Callback;

function UsuarioIdAutenticado(Req: THorseRequest): Integer;
function ExigirPermissao(const APermissao: string): THorseCallback;
function AutorizarRota(const APermissao: string;
  const ACallback: THorseCallback): THorseCallback;

implementation

uses
  System.JSON,
  System.SysUtils,
  System.SyncObjs,
  Horse.Commons,
  Autorizacao.Service,
  Response.Utils,
  Logger.Utils;

var
  GAuthorizedRequestLock: TCriticalSection;

function UsuarioIdAutenticado(Req: THorseRequest): Integer;
var
  LClaims: TJSONObject;
begin
  Result := 0;
  LClaims := Req.Session<TJSONObject>;
  if Assigned(LClaims) then
    Result := LClaims.GetValue<Integer>('user_id', 0);
end;

function ExigirPermissao(const APermissao: string): THorseCallback;
begin
  Result :=
    procedure(Req: THorseRequest; Res: THorseResponse; Next: TProc)
    var
      LUsuarioId: Integer;
    begin
      GAuthorizedRequestLock.Acquire;
      try
        try
          LUsuarioId := UsuarioIdAutenticado(Req);
          if LUsuarioId <= 0 then
          begin
            Res.Send<TJSONObject>(TResponseUtils.Unauthorized('Usuario nao autenticado'))
              .Status(THTTPStatus.Unauthorized);
            Exit;
          end;

          if not TAutorizacaoService.TemPermissao(LUsuarioId, APermissao) then
          begin
            Res.Send<TJSONObject>(TResponseUtils.Error('Acesso negado para esta operacao', 403))
              .Status(THTTPStatus.Forbidden);
            Exit;
          end;

          Next;
        except
          on E: Exception do
          begin
            TLogger.Error('AutorizacaoMiddleware.ExigirPermissao', E);
            Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message))
              .Status(THTTPStatus.InternalServerError);
          end;
        end;
      finally
        GAuthorizedRequestLock.Release;
      end;
    end;
end;

function AutorizarRota(const APermissao: string;
  const ACallback: THorseCallback): THorseCallback;
begin
  Result :=
    procedure(Req: THorseRequest; Res: THorseResponse; Next: TProc)
    var
      LUsuarioId: Integer;
    begin
      GAuthorizedRequestLock.Acquire;
      try
        try
          LUsuarioId := UsuarioIdAutenticado(Req);
          if LUsuarioId <= 0 then
          begin
            Res.Send<TJSONObject>(TResponseUtils.Unauthorized('Usuario nao autenticado'))
              .Status(THTTPStatus.Unauthorized);
            Exit;
          end;

          if not TAutorizacaoService.TemPermissao(LUsuarioId, APermissao) then
          begin
            Res.Send<TJSONObject>(TResponseUtils.Error('Acesso negado para esta operacao', 403))
              .Status(THTTPStatus.Forbidden);
            Exit;
          end;

          ACallback(Req, Res, Next);
        except
          on E: Exception do
          begin
            TLogger.Error('AutorizacaoMiddleware.AutorizarRota', E);
            Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message))
              .Status(THTTPStatus.InternalServerError);
          end;
        end;
      finally
        GAuthorizedRequestLock.Release;
      end;
    end;
end;

initialization
  GAuthorizedRequestLock := TCriticalSection.Create;

finalization
  GAuthorizedRequestLock.Free;

end.
