unit Storage.Service;

interface

uses
  System.SysUtils,
  System.Classes;

type
  EStorageValidacao = class(Exception);
  EStorageErro = class(Exception);

  TTipoArquivoStorage = (tasDesconhecido, tasPDF, tasJPEG, tasPNG, tasWEBP);

  TStorageService = class
  public
    const
      MAX_DOC_BYTES  = 15 * 1024 * 1024; // 15MB
      MAX_FOTO_BYTES = 3 * 1024 * 1024;  // 3MB

    class function SalvarDocumentoBase64(const ANomeOriginal, AMimeType, AConteudoBase64: string;
      out ACaminhoRelativo: string; out ATamanhoBytes: Int64): Boolean;
    class function SalvarFotoUsuarioBase64(AUsuarioId: Integer;
      const AConteudoBase64, AMimeType: string; out ACaminhoRelativo: string): Boolean;
    class function SalvarFotoPacienteBase64(APacienteId: Integer;
      const AConteudoBase64, AMimeType: string; out ACaminhoRelativo: string): Boolean;
    class function ObterCaminhoCompleto(const ACaminhoRelativo: string): string;
    class function ExcluirArquivo(const ACaminhoRelativo: string): Boolean;

    // Utilitarios
    class function DiretorioBase: string;
    class function DiretorioDocumentos(const AData: TDateTime): string;
    class function DiretorioFotosUsuarios: string;
    class function DiretorioFotosPacientes: string;
    class function DetectarTipoPorBytes(const ABytes: TBytes): TTipoArquivoStorage;
    class function MimeTypeDoTipo(ATipo: TTipoArquivoStorage): string;
    class function ExtensaoDoTipo(ATipo: TTipoArquivoStorage): string;
    class function MimeTypeDoArquivo(const ACaminho: string): string;
    class function GerarNomeArquivoSeguro(const AExtensao: string): string;
    class function DecodificarBase64(const ABase64: string; var AMimeType: string): TBytes;
  end;

implementation

uses
  System.IOUtils,
  System.NetEncoding,
  System.StrUtils,
  UnitConstants;

{ TStorageService }

class function TStorageService.DiretorioBase: string;
var
  LPath: string;
begin
  LPath := Trim(TConstants.StoragePath);
  if LPath = '' then
    LPath := TPath.Combine(ExtractFilePath(ParamStr(0)), '..\DADOS\uploads');

  if not TPath.IsPathRooted(LPath) then
    LPath := TPath.GetFullPath(TPath.Combine(ExtractFilePath(ParamStr(0)), LPath))
  else
    LPath := TPath.GetFullPath(LPath);

  if not TDirectory.Exists(LPath) then
    TDirectory.CreateDirectory(LPath);

  Result := LPath;
end;

class function TStorageService.DiretorioDocumentos(const AData: TDateTime): string;
var
  LBase, LAnoMes, LSub: string;
begin
  LBase := DiretorioBase;
  LAnoMes := FormatDateTime('yyyy' + PathDelim + 'mm', AData);
  LSub := TPath.Combine(TPath.Combine(LBase, 'documentos'), LAnoMes);
  if not TDirectory.Exists(LSub) then
    TDirectory.CreateDirectory(LSub);
  Result := LSub;
end;

class function TStorageService.DiretorioFotosUsuarios: string;
var
  LBase, LSub: string;
begin
  LBase := DiretorioBase;
  LSub := TPath.Combine(TPath.Combine(LBase, 'fotos'), 'usuarios');
  if not TDirectory.Exists(LSub) then
    TDirectory.CreateDirectory(LSub);
  Result := LSub;
end;

class function TStorageService.DiretorioFotosPacientes: string;
var
  LBase, LSub: string;
begin
  LBase := DiretorioBase;
  LSub := TPath.Combine(TPath.Combine(LBase, 'fotos'), 'pacientes');
  if not TDirectory.Exists(LSub) then
    TDirectory.CreateDirectory(LSub);
  Result := LSub;
end;

class function TStorageService.DetectarTipoPorBytes(const ABytes: TBytes): TTipoArquivoStorage;
begin
  Result := tasDesconhecido;
  if Length(ABytes) < 4 then
    Exit;

  // PDF: %PDF- ($25, $50, $44, $46, $2D)
  if (Length(ABytes) >= 5) and
     (ABytes[0] = $25) and (ABytes[1] = $50) and (ABytes[2] = $44) and
     (ABytes[3] = $46) and (ABytes[4] = $2D) then
    Exit(tasPDF);

  // JPEG: FF D8 FF
  if (Length(ABytes) >= 3) and
     (ABytes[0] = $FF) and (ABytes[1] = $D8) and (ABytes[2] = $FF) then
    Exit(tasJPEG);

  // PNG: 89 50 4E 47
  if (Length(ABytes) >= 4) and
     (ABytes[0] = $89) and (ABytes[1] = $50) and (ABytes[2] = $4E) and
     (ABytes[3] = $47) then
    Exit(tasPNG);

  // WEBP: RIFF....WEBP (bytes 0..3 = 'RIFF', bytes 8..11 = 'WEBP')
  if (Length(ABytes) >= 12) and
     (ABytes[0] = $52) and (ABytes[1] = $49) and (ABytes[2] = $46) and (ABytes[3] = $46) and
     (ABytes[8] = $57) and (ABytes[9] = $45) and (ABytes[10] = $42) and (ABytes[11] = $50) then
    Exit(tasWEBP);
end;

class function TStorageService.MimeTypeDoTipo(ATipo: TTipoArquivoStorage): string;
begin
  case ATipo of
    tasPDF:  Result := 'application/pdf';
    tasJPEG: Result := 'image/jpeg';
    tasPNG:  Result := 'image/png';
    tasWEBP: Result := 'image/webp';
  else
    Result := 'application/octet-stream';
  end;
end;

class function TStorageService.ExtensaoDoTipo(ATipo: TTipoArquivoStorage): string;
begin
  case ATipo of
    tasPDF:  Result := '.pdf';
    tasJPEG: Result := '.jpg';
    tasPNG:  Result := '.png';
    tasWEBP: Result := '.webp';
  else
    Result := '.bin';
  end;
end;

class function TStorageService.MimeTypeDoArquivo(const ACaminho: string): string;
var
  LExt: string;
begin
  LExt := LowerCase(ExtractFileExt(ACaminho));
  if LExt = '.pdf' then
    Result := 'application/pdf'
  else if (LExt = '.jpg') or (LExt = '.jpeg') then
    Result := 'image/jpeg'
  else if LExt = '.png' then
    Result := 'image/png'
  else if LExt = '.webp' then
    Result := 'image/webp'
  else
    Result := 'application/octet-stream';
end;

class function TStorageService.GerarNomeArquivoSeguro(const AExtensao: string): string;
var
  LGUID: TGUID;
  LExt: string;
begin
  CreateGUID(LGUID);
  LExt := AExtensao;
  if (LExt <> '') and (LExt[1] <> '.') then
    LExt := '.' + LExt;
  Result := GUIDToString(LGUID) + LowerCase(LExt);
end;

class function TStorageService.DecodificarBase64(const ABase64: string; var AMimeType: string): TBytes;
var
  LBase64Limpo: string;
  LPosVirgula, LPosPontoEVirgula: Integer;
begin
  LBase64Limpo := Trim(ABase64);
  if StartsText('data:', LBase64Limpo) then
  begin
    LPosPontoEVirgula := Pos(';base64,', LBase64Limpo);
    if LPosPontoEVirgula > 0 then
    begin
      if AMimeType = '' then
        AMimeType := LowerCase(Trim(Copy(LBase64Limpo, 6, LPosPontoEVirgula - 6)));
      LBase64Limpo := Copy(LBase64Limpo, LPosPontoEVirgula + 8, MaxInt);
    end
    else
    begin
      LPosVirgula := Pos(',', LBase64Limpo);
      if LPosVirgula > 0 then
        LBase64Limpo := Copy(LBase64Limpo, LPosVirgula + 1, MaxInt);
    end;
  end;

  LBase64Limpo := StringReplace(LBase64Limpo, #13, '', [rfReplaceAll]);
  LBase64Limpo := StringReplace(LBase64Limpo, #10, '', [rfReplaceAll]);
  LBase64Limpo := StringReplace(LBase64Limpo, ' ', '', [rfReplaceAll]);

  if LBase64Limpo = '' then
    raise EStorageValidacao.Create('Conteudo base64 nao informado ou vazio');

  try
    Result := TNetEncoding.Base64.DecodeStringToBytes(LBase64Limpo);
  except
    on E: Exception do
      raise EStorageValidacao.Create('Falha ao decodificar conteudo base64: ' + E.Message);
  end;

  if Length(Result) = 0 then
    raise EStorageValidacao.Create('Conteudo decodificado esta vazio');
end;

class function TStorageService.SalvarDocumentoBase64(const ANomeOriginal, AMimeType,
  AConteudoBase64: string; out ACaminhoRelativo: string; out ATamanhoBytes: Int64): Boolean;
var
  LMime: string;
  LBytes: TBytes;
  LTipo: TTipoArquivoStorage;
  LExt: string;
  LNomeArquivo: string;
  LPasta: string;
  LCaminhoCompleto: string;
  LDataAtual: TDateTime;
begin
  ACaminhoRelativo := '';
  ATamanhoBytes := 0;

  if Trim(AConteudoBase64) = '' then
    raise EStorageValidacao.Create('Conteudo do documento em base64 nao informado');

  LMime := LowerCase(Trim(AMimeType));
  LBytes := DecodificarBase64(AConteudoBase64, LMime);
  ATamanhoBytes := Length(LBytes);

  if ATamanhoBytes > MAX_DOC_BYTES then
    raise EStorageValidacao.Create(
      Format('Tamanho do arquivo (%d bytes) excede o limite maximo de 15MB', [ATamanhoBytes]));

  LTipo := DetectarTipoPorBytes(LBytes);
  if LTipo = tasDesconhecido then
    raise EStorageValidacao.Create(
      'Formato de arquivo invalido ou nao suportado. Formatos aceitos: PDF, JPEG, PNG, WEBP');

  LExt := ExtensaoDoTipo(LTipo);
  if LMime = '' then
    LMime := MimeTypeDoTipo(LTipo);

  LNomeArquivo := GerarNomeArquivoSeguro(LExt);
  LDataAtual := Now;
  LPasta := DiretorioDocumentos(LDataAtual);
  LCaminhoCompleto := TPath.Combine(LPasta, LNomeArquivo);

  try
    TFile.WriteAllBytes(LCaminhoCompleto, LBytes);
  except
    on E: Exception do
      raise EStorageErro.Create('Falha ao gravar arquivo no disco: ' + E.Message);
  end;

  ACaminhoRelativo := Format('documentos/%s/%s', [FormatDateTime('yyyy/mm', LDataAtual), LNomeArquivo]);
  Result := True;
end;

class function TStorageService.SalvarFotoUsuarioBase64(AUsuarioId: Integer;
  const AConteudoBase64, AMimeType: string; out ACaminhoRelativo: string): Boolean;
var
  LMime: string;
  LBytes: TBytes;
  LTamanhoBytes: Int64;
  LTipo: TTipoArquivoStorage;
  LExt: string;
  LNomeArquivo: string;
  LPasta: string;
  LCaminhoCompleto: string;
begin
  ACaminhoRelativo := '';

  if AUsuarioId <= 0 then
    raise EStorageValidacao.Create('Identificador de usuario invalido');

  if Trim(AConteudoBase64) = '' then
    raise EStorageValidacao.Create('Conteudo da foto em base64 nao informado');

  LMime := LowerCase(Trim(AMimeType));
  LBytes := DecodificarBase64(AConteudoBase64, LMime);
  LTamanhoBytes := Length(LBytes);

  if LTamanhoBytes > MAX_FOTO_BYTES then
    raise EStorageValidacao.Create(
      Format('Tamanho da foto (%d bytes) excede o limite maximo de 3MB', [LTamanhoBytes]));

  LTipo := DetectarTipoPorBytes(LBytes);
  if not (LTipo in [tasJPEG, tasPNG, tasWEBP]) then
    raise EStorageValidacao.Create(
      'A foto de perfil deve ser uma imagem valida nos formatos JPEG, PNG ou WEBP');

  LExt := ExtensaoDoTipo(LTipo);
  LNomeArquivo := GerarNomeArquivoSeguro(LExt);
  LPasta := DiretorioFotosUsuarios;
  LCaminhoCompleto := TPath.Combine(LPasta, LNomeArquivo);

  try
    TFile.WriteAllBytes(LCaminhoCompleto, LBytes);
  except
    on E: Exception do
      raise EStorageErro.Create('Falha ao gravar arquivo de foto no disco: ' + E.Message);
  end;

  ACaminhoRelativo := Format('fotos/usuarios/%s', [LNomeArquivo]);
  Result := True;
end;

class function TStorageService.SalvarFotoPacienteBase64(APacienteId: Integer;
  const AConteudoBase64, AMimeType: string; out ACaminhoRelativo: string): Boolean;
var
  LMime: string;
  LBytes: TBytes;
  LTamanhoBytes: Int64;
  LTipo: TTipoArquivoStorage;
  LExt: string;
  LNomeArquivo: string;
  LPasta: string;
  LCaminhoCompleto: string;
begin
  ACaminhoRelativo := '';

  if APacienteId <= 0 then
    raise EStorageValidacao.Create('Identificador de paciente invalido');

  if Trim(AConteudoBase64) = '' then
    raise EStorageValidacao.Create('Conteudo da foto em base64 nao informado');

  LMime := LowerCase(Trim(AMimeType));
  LBytes := DecodificarBase64(AConteudoBase64, LMime);
  LTamanhoBytes := Length(LBytes);

  if LTamanhoBytes > MAX_FOTO_BYTES then
    raise EStorageValidacao.Create(
      Format('Tamanho da foto (%d bytes) excede o limite maximo de 3MB', [LTamanhoBytes]));

  LTipo := DetectarTipoPorBytes(LBytes);
  if not (LTipo in [tasJPEG, tasPNG, tasWEBP]) then
    raise EStorageValidacao.Create(
      'A foto do paciente deve ser uma imagem valida nos formatos JPEG, PNG ou WEBP');

  LExt := ExtensaoDoTipo(LTipo);
  LNomeArquivo := GerarNomeArquivoSeguro(LExt);
  LPasta := DiretorioFotosPacientes;
  LCaminhoCompleto := TPath.Combine(LPasta, LNomeArquivo);

  try
    TFile.WriteAllBytes(LCaminhoCompleto, LBytes);
  except
    on E: Exception do
      raise EStorageErro.Create('Falha ao gravar arquivo de foto do paciente no disco: ' + E.Message);
  end;

  ACaminhoRelativo := Format('fotos/pacientes/%s', [LNomeArquivo]);
  Result := True;
end;

class function TStorageService.ObterCaminhoCompleto(const ACaminhoRelativo: string): string;
var
  LBase: string;
  LRelativoNormalizado: string;
  LCompleto: string;
begin
  if Trim(ACaminhoRelativo) = '' then
    raise EStorageValidacao.Create('Caminho relativo nao informado');

  if (Pos('..', ACaminhoRelativo) > 0) or TPath.IsPathRooted(ACaminhoRelativo) then
    raise EStorageValidacao.Create('Caminho relativo invalido ou inseguro');

  LBase := DiretorioBase;
  LRelativoNormalizado := StringReplace(ACaminhoRelativo, '/', PathDelim, [rfReplaceAll]);
  LRelativoNormalizado := StringReplace(LRelativoNormalizado, '\', PathDelim, [rfReplaceAll]);

  LCompleto := TPath.GetFullPath(TPath.Combine(LBase, LRelativoNormalizado));

  if not StartsText(LBase, LCompleto) then
    raise EStorageValidacao.Create('Tentativa de acesso a arquivo fora do diretorio permitido');

  Result := LCompleto;
end;

class function TStorageService.ExcluirArquivo(const ACaminhoRelativo: string): Boolean;
var
  LCompleto: string;
begin
  Result := False;
  if Trim(ACaminhoRelativo) = '' then
    Exit;
  try
    LCompleto := ObterCaminhoCompleto(ACaminhoRelativo);
    if TFile.Exists(LCompleto) then
    begin
      TFile.Delete(LCompleto);
      Result := True;
    end;
  except
    Result := False;
  end;
end;

end.
