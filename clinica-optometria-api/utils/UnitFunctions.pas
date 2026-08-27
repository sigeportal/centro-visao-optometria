unit UnitFunctions;

interface

uses
  System.SysUtils;

function ObterPorta(const ADefault: Integer = 9000): Integer;
function SomenteNumeros(const ATexto: string): string;

implementation

function ObterPorta(const ADefault: Integer = 9000): Integer;
var
  LPortaStr: string;
begin
  LPortaStr := GetEnvironmentVariable('PORT');
  if LPortaStr.IsEmpty then
    Result := ADefault
  else
    Result := StrToIntDef(LPortaStr, ADefault);
end;

function SomenteNumeros(const ATexto: string): string;
var
  I: Integer;
begin
  Result := '';
  for I := 1 to Length(ATexto) do
  begin
    if CharInSet(ATexto[I], ['0'..'9']) then
      Result := Result + ATexto[I];
  end;
end;

end.
