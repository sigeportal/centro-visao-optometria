unit ConfiguracaoClinica.Service;

interface

uses
  System.JSON,
  System.SysUtils;

type
  EConfiguracaoClinicaValidacao = class(Exception);

  TConfiguracaoClinicaService = class
  private
    class function Texto(ADados: TJSONObject; const ANome: string): string; static;
  public
    class procedure Inicializar;
    class function Obter: TJSONObject;
    class function Atualizar(AUsuarioId: Integer; ADados: TJSONObject): TJSONObject;
  end;

implementation

uses
  System.DateUtils,
  UnitDatabase,
  UnitConfiguracaoClinica.Model;

class function TConfiguracaoClinicaService.Texto(ADados: TJSONObject;
  const ANome: string): string;
begin
  if Assigned(ADados) then
    Result := Trim(ADados.GetValue<string>(ANome, ''))
  else
    Result := '';
end;

class procedure TConfiguracaoClinicaService.Inicializar;
var
  LModel: TModelConfiguracaoClinica;
begin
  LModel := TModelConfiguracaoClinica.Create(TDatabase.Connection);
  try
    LModel.CriaTabela;
    LModel.BuscaDadosTabela(1);
    if LModel.Id <= 0 then
    begin
      LModel.Id := 1;
      LModel.Nome := 'Centro Visao Optometria';
      LModel.Endereco := 'R. Severino Araujo 1316';
      LModel.Cidade := 'Fatima do Sul';
      LModel.Estado := 'MS';
      LModel.AtualizadoEm := Now;
      LModel.SalvaNoBanco(1);
    end;
  finally
    LModel.Free;
  end;
end;

class function TConfiguracaoClinicaService.Obter: TJSONObject;
var
  LModel: TModelConfiguracaoClinica;
begin
  Inicializar;
  LModel := TModelConfiguracaoClinica.Create(TDatabase.Connection);
  try
    LModel.BuscaDadosTabela(1);
    Result := TJSONObject.Create;
    Result.AddPair('id', TJSONNumber.Create(LModel.Id));
    Result.AddPair('nome', LModel.Nome);
    Result.AddPair('cnpj', LModel.Cnpj);
    Result.AddPair('telefone', LModel.Telefone);
    Result.AddPair('endereco', LModel.Endereco);
    Result.AddPair('cidade', LModel.Cidade);
    Result.AddPair('estado', LModel.Estado);
    Result.AddPair('cep', LModel.Cep);
    Result.AddPair('atualizado_por', TJSONNumber.Create(LModel.AtualizadoPor));
    if LModel.AtualizadoEm > 0 then
      Result.AddPair('atualizado_em', DateToISO8601(LModel.AtualizadoEm, False))
    else
      Result.AddPair('atualizado_em', TJSONNull.Create);
  finally
    LModel.Free;
  end;
end;

class function TConfiguracaoClinicaService.Atualizar(AUsuarioId: Integer;
  ADados: TJSONObject): TJSONObject;
var
  LModel: TModelConfiguracaoClinica;
begin
  if not Assigned(ADados) then
    raise EConfiguracaoClinicaValidacao.Create('Payload invalido');
  if Texto(ADados, 'nome') = '' then
    raise EConfiguracaoClinicaValidacao.Create('Nome da clinica e obrigatorio');
  if Length(Texto(ADados, 'estado')) > 2 then
    raise EConfiguracaoClinicaValidacao.Create('UF deve possuir no maximo 2 caracteres');

  Inicializar;
  LModel := TModelConfiguracaoClinica.Create(TDatabase.Connection);
  try
    LModel.BuscaDadosTabela(1);
    LModel.Nome := Texto(ADados, 'nome');
    LModel.Cnpj := Texto(ADados, 'cnpj');
    LModel.Telefone := Texto(ADados, 'telefone');
    LModel.Endereco := Texto(ADados, 'endereco');
    LModel.Cidade := Texto(ADados, 'cidade');
    LModel.Estado := UpperCase(Texto(ADados, 'estado'));
    LModel.Cep := Texto(ADados, 'cep');
    LModel.AtualizadoPor := AUsuarioId;
    LModel.AtualizadoEm := Now;
    LModel.SalvaNoBanco(1);
  finally
    LModel.Free;
  end;
  Result := Obter;
end;

end.
