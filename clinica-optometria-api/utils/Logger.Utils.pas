unit Logger.Utils;

interface

uses
  System.SysUtils,
  System.Classes,
  System.RegularExpressions;

type
  TLogger = class
  private
    class function RedigirDadosSensiveis(const ATexto: string): string;
  public
    class procedure Setup;
    class procedure Info(const AMessage: string);
    class procedure Warn(const AMessage: string);
    class procedure Error(const AMessage: string; const AException: Exception = nil);
    class procedure Debug(const AMessage: string);
  end;

implementation

{ TLogger }

class procedure TLogger.Setup;
begin
end;

class function TLogger.RedigirDadosSensiveis(const ATexto: string): string;
var
  LResultado: string;
begin
  LResultado := ATexto;
  // Redige senhas em JSON
  LResultado := TRegEx.Replace(LResultado, '("password"\s*:\s*)"[^"]*"', '$1"***"', [roIgnoreCase]);
  LResultado := TRegEx.Replace(LResultado, '("senha"\s*:\s*)"[^"]*"', '$1"***"', [roIgnoreCase]);
  // Redige tokens Bearer
  LResultado := TRegEx.Replace(LResultado, 'Bearer\s+[A-Za-z0-9\._\-]+', 'Bearer [REDACTED]', [roIgnoreCase]);
  // Redige CPFs
  LResultado := TRegEx.Replace(LResultado, '\b\d{3}\.\d{3}\.\d{3}-\d{2}\b', '***.***.***-**');
  Result := LResultado;
end;

class procedure TLogger.Info(const AMessage: string);
begin
  Writeln(Format('[INFO] [%s] %s', [FormatDateTime('yyyy-mm-dd hh:nn:ss', Now), RedigirDadosSensiveis(AMessage)]));
end;

class procedure TLogger.Warn(const AMessage: string);
begin
  Writeln(Format('[WARN] [%s] %s', [FormatDateTime('yyyy-mm-dd hh:nn:ss', Now), RedigirDadosSensiveis(AMessage)]));
end;

class procedure TLogger.Error(const AMessage: string; const AException: Exception);
var
  LMsg: string;
begin
  LMsg := Format('[ERROR] [%s] %s', [FormatDateTime('yyyy-mm-dd hh:nn:ss', Now), RedigirDadosSensiveis(AMessage)]);
  if Assigned(AException) then
    LMsg := LMsg + ' - Detalhes: ' + RedigirDadosSensiveis(AException.Message);
  Writeln(LMsg);
end;

class procedure TLogger.Debug(const AMessage: string);
begin
  Writeln(Format('[DEBUG] [%s] %s', [FormatDateTime('yyyy-mm-dd hh:nn:ss', Now), RedigirDadosSensiveis(AMessage)]));
end;

end.
