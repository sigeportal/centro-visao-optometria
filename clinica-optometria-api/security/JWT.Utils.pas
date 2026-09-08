unit JWT.Utils;

{
  Utilitarios JWT para geracao e validacao de tokens
  Usa biblioteca JOSE (horse-jwt / delphi-jose-jwt)
}

interface

uses
  System.SysUtils,
  System.DateUtils,
  System.JSON;

type
  TJWTUtils = class
  public
    /// <summary>Gera um token JWT com o subject informado (login do usuario)</summary>
    class function GenerateToken(const AUserId: Integer; const ALogin: string): string;
    /// <summary>Retorna o subject (login) do token</summary>
    class function GetSubject(const AToken: string): string;
    /// <summary>Valida o token JWT e extrai os dados do usuario</summary>
    class function ValidarToken(const AToken: string; out AUserId: Integer; out ALogin: string): Boolean;
  end;

implementation

uses
  JOSE.Core.JWT,
  JOSE.Core.Builder,
  UnitConstants;

{ TJWTUtils }

class function TJWTUtils.GenerateToken(const AUserId: Integer; const ALogin: string): string;
var
  LJWT: TJWT;
begin
  LJWT := TJWT.Create;
  try
    LJWT.Claims.Issuer     := TConstants.JWTIssuer;
    LJWT.Claims.Subject    := ALogin;
    LJWT.Claims.JWTId      := TGUID.NewGuid.ToString;
    LJWT.Claims.IssuedAt   := Now;
    LJWT.Claims.Expiration := IncMinute(Now, TConstants.JWTExpirationMinutes);
    // Claim customizado com o id do usuario
    LJWT.Claims.JSON.AddPair('user_id', TJSONNumber.Create(AUserId));

    Result := TJOSE.SHA256CompactToken(TConstants.JWTSecret, LJWT);
  finally
    LJWT.Free;
  end;
end;

class function TJWTUtils.GetSubject(const AToken: string): string;
var
  LJWT: TJWT;
begin
  Result := '';
  LJWT := TJOSE.Verify(TConstants.JWTSecret, AToken);
  if Assigned(LJWT) then
  try
    Result := LJWT.Claims.Subject;
  finally
    LJWT.Free;
  end;
end;

class function TJWTUtils.ValidarToken(const AToken: string; out AUserId: Integer; out ALogin: string): Boolean;
var
  LJWT: TJWT;
begin
  Result := False;
  AUserId := 0;
  ALogin := '';

  if AToken.IsEmpty then
    Exit;

  LJWT := TJOSE.Verify(TConstants.JWTSecret, AToken);
  if Assigned(LJWT) then
  try
    // Valida se expirou
    if (LJWT.Claims.Expiration > 0) and (LJWT.Claims.Expiration < Now) then
      Exit;

    // Valida Issuer se configurado
    if (not LJWT.Claims.Issuer.IsEmpty) and (LJWT.Claims.Issuer <> TConstants.JWTIssuer) then
      Exit;

    // Valida Audience se configurada
    if (not LJWT.Claims.Audience.IsEmpty) and (LJWT.Claims.Audience <> TConstants.JWTAudience) then
      Exit;

    ALogin := LJWT.Claims.Subject;
    if LJWT.Claims.JSON.TryGetValue<Integer>('user_id', AUserId) then
      Result := (AUserId > 0);
  finally
    LJWT.Free;
  end;
end;

end.
