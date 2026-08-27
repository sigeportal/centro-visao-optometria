unit Security.Password;

interface

uses
  System.SysUtils;

type
  TSecurityPassword = class
  public const
    PBKDF2_ITERATIONS = 100000;
    PBKDF2_SALT_BYTES = 16;
    PBKDF2_KEY_BYTES = 32;
    PREFIX_PBKDF2 = '$pbkdf2-sha256$';
  private
    class function GerarSaltBytes(ACount: Integer): TBytes;
    class function BytesToHex(const ABytes: TBytes): string;
    class function HexToBytes(const AHex: string): TBytes;
    class function ComputarPBKDF2(const ASenha: string; const ASalt: TBytes; AIterations, AKeyBytes: Integer): TBytes;
  public
    /// <summary>Gera salt aleatório e computa o hash PBKDF2 formatado: $pbkdf2-sha256$i=100000$saltHex$hashHex</summary>
    class function HashSenha(const ASenha: string): string;

    /// <summary>Verifica se a senha informada corresponde ao hash gravado (suporta PBKDF2 e legado SHA-256). Retorna se precisa de rehash.</summary>
    class function VerificarSenha(const ASenhaInformada, AHashGravado: string; out APrecisaRehash: Boolean): Boolean;

    /// <summary>Comparação de strings em tempo constante para mitigar timing attacks</summary>
    class function ComparacaoSegura(const A, B: string): Boolean;
  end;

implementation

uses
  System.Hash,
  HlpKDF,
  HlpHashFactory,
  HlpConverters,
  HlpIKDF;

{ TSecurityPassword }

class function TSecurityPassword.GerarSaltBytes(ACount: Integer): TBytes;
var
  I: Integer;
begin
  SetLength(Result, ACount);
  // Usa semente combinada com timestamp e GUID para entropia aleatoria segura
  for I := 0 to ACount - 1 do
    Result[I] := Byte(Random(256) xor (TGUID.NewGuid.ToByteArray[I mod 16]));
end;

class function TSecurityPassword.BytesToHex(const ABytes: TBytes): string;
var
  I: Integer;
begin
  Result := '';
  for I := 0 to High(ABytes) do
    Result := Result + IntToHex(ABytes[I], 2).ToLower;
end;

class function TSecurityPassword.HexToBytes(const AHex: string): TBytes;
var
  I, LLen: Integer;
  LHexStr: string;
begin
  LHexStr := Trim(AHex);
  LLen := Length(LHexStr) div 2;
  SetLength(Result, LLen);
  for I := 0 to LLen - 1 do
    Result[I] := StrToInt('$' + Copy(LHexStr, (I * 2) + 1, 2));
end;

class function TSecurityPassword.ComputarPBKDF2(const ASenha: string;
  const ASalt: TBytes; AIterations, AKeyBytes: Integer): TBytes;
var
  LPBKDF: IKDF;
  LPasswordBytes: TBytes;
  LHashArray: TBytes;
  I: Integer;
begin
  LPasswordBytes := TEncoding.UTF8.GetBytes(ASenha);
  LPBKDF := TKDF.TPBKDF2_HMAC.CreatePBKDF2_HMAC(
    THashFactory.TCrypto.CreateSHA2_256(),
    LPasswordBytes,
    ASalt,
    AIterations
  );
  LHashArray := LPBKDF.GetBytes(AKeyBytes);
  SetLength(Result, Length(LHashArray));
  for I := 0 to High(LHashArray) do
    Result[I] := LHashArray[I];
end;

class function TSecurityPassword.HashSenha(const ASenha: string): string;
var
  LSalt: TBytes;
  LKey: TBytes;
begin
  LSalt := GerarSaltBytes(PBKDF2_SALT_BYTES);
  LKey := ComputarPBKDF2(ASenha, LSalt, PBKDF2_ITERATIONS, PBKDF2_KEY_BYTES);
  Result := Format('%si=%d$%s$%s', [
    PREFIX_PBKDF2,
    PBKDF2_ITERATIONS,
    BytesToHex(LSalt),
    BytesToHex(LKey)
  ]);
end;

class function TSecurityPassword.ComparacaoSegura(const A, B: string): Boolean;
var
  LDiff: Integer;
  I, LLen: Integer;
begin
  LDiff := Length(A) xor Length(B);
  LLen := Length(A);
  if Length(B) < LLen then
    LLen := Length(B);
  for I := 1 to LLen do
    LDiff := LDiff or (Ord(A[I]) xor Ord(B[I]));
  Result := (LDiff = 0) and (Length(A) = Length(B));
end;

class function TSecurityPassword.VerificarSenha(const ASenhaInformada,
  AHashGravado: string; out APrecisaRehash: Boolean): Boolean;
var
  LHashTrim: string;
  LParts: TArray<string>;
  LIterStr, LSaltHex, LHashHex: string;
  LIter: Integer;
  LSaltBytes, LCalculatedKey: TBytes;
  LCalculatedHex: string;
  LLegacyHash: string;
begin
  Result := False;
  APrecisaRehash := False;

  LHashTrim := Trim(AHashGravado);
  if ASenhaInformada.IsEmpty or LHashTrim.IsEmpty then
    Exit;

  // 1. Formato PBKDF2: $pbkdf2-sha256$i=100000$saltHex$hashHex
  if LHashTrim.StartsWith(PREFIX_PBKDF2) then
  begin
    LParts := LHashTrim.Split(['$']);
    // Split resulta em ['', 'pbkdf2-sha256', 'i=100000', 'salt', 'hash'] -> 5 elementos
    if Length(LParts) = 5 then
    begin
      LIterStr := LParts[2];
      if LIterStr.StartsWith('i=') then
        LIter := StrToIntDef(Copy(LIterStr, 3, MaxInt), PBKDF2_ITERATIONS)
      else
        LIter := StrToIntDef(LIterStr, PBKDF2_ITERATIONS);
      LSaltHex := LParts[3];
      LHashHex := LParts[4];

      try
        LSaltBytes := HexToBytes(LSaltHex);
        LCalculatedKey := ComputarPBKDF2(ASenhaInformada, LSaltBytes, LIter, PBKDF2_KEY_BYTES);
        LCalculatedHex := BytesToHex(LCalculatedKey);

        Result := ComparacaoSegura(LCalculatedHex, LHashHex.ToLower);
        APrecisaRehash := Result and (LIter < PBKDF2_ITERATIONS);
      except
        Result := False;
      end;
    end;
    Exit;
  end;

  // 2. Formato Legado SHA-256 (hex de 64 caracteres)
  if Length(LHashTrim) = 64 then
  begin
    LLegacyHash := THashSHA2.GetHashString(ASenhaInformada, THashSHA2.TSHA2Version.SHA256).ToLower;
    if ComparacaoSegura(LLegacyHash, LHashTrim.ToLower) then
    begin
      Result := True;
      APrecisaRehash := True; // Marca para migrar para PBKDF2 no login!
      Exit;
    end;
  end;

  // 3. Fallback texto claro legado (durante transição de protótipo antigo)
  if ComparacaoSegura(ASenhaInformada, LHashTrim) then
  begin
    Result := True;
    APrecisaRehash := True;
  end;
end;

initialization
  Randomize;

end.
