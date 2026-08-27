unit UnitConstants;

interface

uses
  System.SysUtils;

type
  EConfiguracaoInvalida = class(Exception);

  TAPIError = class
  private
    Ferror: string;
  public
    property error: string read Ferror write Ferror;
  end;

  TConstants = class
  public
    class function BancoDados: string;
    class function JWTSecret: string;
    class function JWTExpirationMinutes: Integer;
    class function JWTIssuer: string;
    class function JWTAudience: string;
    class function CORSAllowedOrigins: string;
    class procedure ValidarConfiguracaoObrigatoria;
    class procedure CarregarArquivoEnv(const ACaminho: string = '');
  end;

const
  // Timezone
  TIMEZONE_OFFSET = -4; // Cuiaba UTC-4
  JWT_DEFAULT_EXPIRATION_MINUTES = 60;
  JWT_DEFAULT_ISSUER = 'centrovisao-api';
  JWT_DEFAULT_AUDIENCE = 'centrovisao-app';
  CORS_DEFAULT_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000';

implementation

{ TConstants }

uses
  System.StrUtils,
  System.Classes,
  Winapi.Windows;

class procedure TConstants.CarregarArquivoEnv(const ACaminho: string);
var
  LArquivo: string;
  LLinhas: TStringList;
  LLinha, LChave, LValor: string;
  LPos, I: Integer;
begin
  if not ACaminho.IsEmpty then
    LArquivo := ACaminho
  else if FileExists('.env') then
    LArquivo := '.env'
  else if FileExists(ExtractFilePath(ParamStr(0)) + '.env') then
    LArquivo := ExtractFilePath(ParamStr(0)) + '.env'
  else if FileExists(ExtractFilePath(ParamStr(0)) + '..\.env') then
    LArquivo := ExtractFilePath(ParamStr(0)) + '..\.env'
  else if FileExists('clinica-optometria-api\.env') then
    LArquivo := 'clinica-optometria-api\.env';

  if (not LArquivo.IsEmpty) and FileExists(LArquivo) then
  begin
    LLinhas := TStringList.Create;
    try
      LLinhas.LoadFromFile(LArquivo);
      for I := 0 to LLinhas.Count - 1 do
      begin
        LLinha := Trim(LLinhas[I]);
        if LLinha.IsEmpty or LLinha.StartsWith('#') then
          Continue;
        LPos := Pos('=', LLinha);
        if LPos > 1 then
        begin
          LChave := Trim(Copy(LLinha, 1, LPos - 1));
          LValor := Trim(Copy(LLinha, LPos + 1, MaxInt));
          if GetEnvironmentVariable(LChave).IsEmpty then
            SetEnvironmentVariable(PChar(LChave), PChar(LValor));
        end;
      end;
    finally
      LLinhas.Free;
    end;
  end;
end;

class function TConstants.BancoDados: string;
begin
  Result := GetEnvironmentVariable('CAMINHO_BD');
end;

class function TConstants.JWTSecret: string;
begin
  Result := Trim(GetEnvironmentVariable('JWT_SECRET'));
end;

class function TConstants.JWTExpirationMinutes: Integer;
var
  LEnv: string;
begin
  LEnv := GetEnvironmentVariable('JWT_EXPIRATION_MINUTES');
  Result := StrToIntDef(LEnv, JWT_DEFAULT_EXPIRATION_MINUTES);
  if Result <= 0 then
    Result := JWT_DEFAULT_EXPIRATION_MINUTES;
end;

class function TConstants.JWTIssuer: string;
var
  LEnv: string;
begin
  LEnv := GetEnvironmentVariable('JWT_ISSUER');
  if LEnv.IsEmpty then
    Result := JWT_DEFAULT_ISSUER
  else
    Result := LEnv;
end;

class function TConstants.JWTAudience: string;
var
  LEnv: string;
begin
  LEnv := GetEnvironmentVariable('JWT_AUDIENCE');
  if LEnv.IsEmpty then
    Result := JWT_DEFAULT_AUDIENCE
  else
    Result := LEnv;
end;

class function TConstants.CORSAllowedOrigins: string;
var
  LEnv: string;
begin
  LEnv := GetEnvironmentVariable('CORS_ALLOWED_ORIGINS');
  if LEnv.IsEmpty then
    Result := CORS_DEFAULT_ORIGINS
  else
    Result := LEnv;
end;

class procedure TConstants.ValidarConfiguracaoObrigatoria;
var
  LSecret: string;
begin
  CarregarArquivoEnv;
  LSecret := JWTSecret;
  if LSecret.IsEmpty then
    raise EConfiguracaoInvalida.Create('A variavel de ambiente JWT_SECRET nao esta definida.');

  if Length(LSecret) < 32 then
    raise EConfiguracaoInvalida.Create('A variavel de ambiente JWT_SECRET deve ter no minimo 32 caracteres.');

  if (LSecret = 'Portal@3694_05557971000150140326') or (Pos('EXEMPLO', UpperCase(LSecret)) > 0) then
    raise EConfiguracaoInvalida.Create('A variavel de ambiente JWT_SECRET utiliza um valor fraco ou de exemplo.');
end;

end.
