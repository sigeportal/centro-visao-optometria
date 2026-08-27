unit Response.Utils;

interface

uses
  System.JSON,
  System.SysUtils;

type
  TResponseUtils = class
  public
    class function Success(const AMessage: string = 'Operacao realizada com sucesso';
      const AData: TJSONValue = nil): TJSONObject; overload;
    class function Success(const AMessage: string; const AData: TJSONArray): TJSONObject; overload;
    class function Success(const AMessage: string; const AData: TJSONObject): TJSONObject; overload;
    class function Error(const AMessage: string; const ACode: Integer = 400; const ACorrelationId: string = ''): TJSONObject;
    class function InternalError(const AMessage: string = 'Ocorreu um erro interno ao processar a solicitacao'; const ACorrelationId: string = ''): TJSONObject;
    class function NotFound(const AMessage: string = 'Recurso nao encontrado'; const ACorrelationId: string = ''): TJSONObject;
    class function Unauthorized(const AMessage: string = 'Nao autorizado'; const ACorrelationId: string = ''): TJSONObject;
    class function Forbidden(const AMessage: string = 'Acesso proibido'; const ACorrelationId: string = ''): TJSONObject;
    class function BadRequest(const AMessage: string = 'Requisicao invalida'; const ACorrelationId: string = ''): TJSONObject;
  end;

implementation

{ TResponseUtils }

class function TResponseUtils.Success(const AMessage: string;
  const AData: TJSONValue): TJSONObject;
begin
  Result := TJSONObject.Create;
  Result.AddPair('success', TJSONBool.Create(True));
  Result.AddPair('message', AMessage);
  if Assigned(AData) then
    Result.AddPair('data', AData);
end;

class function TResponseUtils.Success(const AMessage: string;
  const AData: TJSONArray): TJSONObject;
begin
  Result := Success(AMessage, TJSONValue(AData));
end;

class function TResponseUtils.Success(const AMessage: string;
  const AData: TJSONObject): TJSONObject;
begin
  Result := Success(AMessage, TJSONValue(AData));
end;

class function TResponseUtils.Error(const AMessage: string;
  const ACode: Integer; const ACorrelationId: string): TJSONObject;
begin
  Result := TJSONObject.Create;
  Result.AddPair('success', TJSONBool.Create(False));
  Result.AddPair('message', AMessage);
  Result.AddPair('code', TJSONNumber.Create(ACode));
  if not ACorrelationId.IsEmpty then
    Result.AddPair('correlation_id', ACorrelationId);
end;

class function TResponseUtils.InternalError(const AMessage: string;
  const ACorrelationId: string): TJSONObject;
begin
  Result := Error(AMessage, 500, ACorrelationId);
end;

class function TResponseUtils.NotFound(const AMessage: string;
  const ACorrelationId: string): TJSONObject;
begin
  Result := Error(AMessage, 404, ACorrelationId);
end;

class function TResponseUtils.Unauthorized(const AMessage: string;
  const ACorrelationId: string): TJSONObject;
begin
  Result := Error(AMessage, 401, ACorrelationId);
end;

class function TResponseUtils.Forbidden(const AMessage: string;
  const ACorrelationId: string): TJSONObject;
begin
  Result := Error(AMessage, 403, ACorrelationId);
end;

class function TResponseUtils.BadRequest(const AMessage: string;
  const ACorrelationId: string): TJSONObject;
begin
  Result := Error(AMessage, 400, ACorrelationId);
end;

end.
