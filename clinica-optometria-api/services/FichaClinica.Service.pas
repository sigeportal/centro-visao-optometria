unit FichaClinica.Service;

interface

uses
  System.JSON;

type
  TFichaClinicaService = class
  private
    procedure GarantirSecoesIniciais;
  public
    function ListarSecoes: TJSONArray;
    procedure AtualizarOrdem(ASecoes: TJSONArray);
    procedure AtualizarAtivo(AId: Integer; AAtivo: Boolean);
    procedure AtualizarExibicao(AId: Integer; AExibeTela, AExibeImpressao: Integer);
  end;

implementation

uses
  System.SysUtils,
  System.Generics.Collections,
  UnitConnection.Model.Interfaces,
  UnitDatabase,
  UnitFichaSecao.Model,
  Dataset.JSON.Utils;

const
  SECOES_INICIAIS: array[0..14, 0..1] of string = (
    ('anamnese', 'Anamnese'),
    ('prescricao_ultimo_exame', 'Prescricao do Ultimo Exame'),
    ('acuidade_visual', 'Acuidade Visual'),
    ('biomicroscopia', 'Biomicroscopia'),
    ('ceratometria', 'Ceratometria'),
    ('tonometria', 'Tonometria'),
    ('forometria', 'Forometria'),
    ('oftalmoscopia', 'Oftalmoscopia'),
    ('retinoscopia_dinamica', 'Retinoscopia Dinamica'),
    ('retinoscopia_estatica', 'Retinoscopia Estatica'),
    ('avaliacao_motora', 'Avaliacao Motora'),
    ('rx_final', 'RX Final'),
    ('amplitude_acomodacao', 'Amplitude de Acomodacao'),
    ('afinamento', 'Afinamento'),
    ('dx', 'DX')
  );

procedure TFichaClinicaService.GarantirSecoesIniciais;
var
  LQuery: iQuery;
  LSecao: TModelFichaSecao;
  I: Integer;
begin
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT COUNT(*) AS TOTAL FROM FICHA_SECAO');
  LQuery.Open;

  if LQuery.DataSet.FieldByName('TOTAL').AsInteger > 0 then
    Exit;

  LSecao := TModelFichaSecao.Create(TDatabase.Connection);
  try
    for I := Low(SECOES_INICIAIS) to High(SECOES_INICIAIS) do
    begin
      LSecao.Id := LSecao.GeraCodigo('FSC_ID');
      LSecao.Chave := SECOES_INICIAIS[I, 0];
      LSecao.Nome := SECOES_INICIAIS[I, 1];
      LSecao.Ativo := 1;
      LSecao.Ordem := I + 1;
      LSecao.ExibeTela := 1;
      LSecao.ExibeImpressao := 1;
      LSecao.SalvaNoBanco(1);
    end;
  finally
    LSecao.Free;
  end;
end;

function TFichaClinicaService.ListarSecoes: TJSONArray;
var
  LQuery: iQuery;
begin
  GarantirSecoesIniciais;

  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT FSC_ID AS ID, FSC_CHAVE AS CHAVE, FSC_NOME AS NOME, ');
  LQuery.Add('FSC_ATIVO AS ATIVO, FSC_ORDEM AS ORDEM, ');
  LQuery.Add('FSC_EXIBE_TELA AS EXIBE_TELA, FSC_EXIBE_IMPRESSAO AS EXIBE_IMPRESSAO ');
  LQuery.Add('FROM FICHA_SECAO ORDER BY FSC_ORDEM, FSC_ID');
  LQuery.Open;
  Result := TDatasetJsonUtils.QueryToJSONArray(LQuery.DataSet);
end;

procedure TFichaClinicaService.AtualizarOrdem(ASecoes: TJSONArray);
var
  LIds: TDictionary<Integer, Boolean>;
  LOrdens: TDictionary<Integer, Boolean>;
  LItem: TJSONObject;
  LSecao: TModelFichaSecao;
  I, LId, LOrdem: Integer;
begin
  if (not Assigned(ASecoes)) or (ASecoes.Count = 0) then
    raise Exception.Create('Informe as secoes para ordenar');

  LIds := TDictionary<Integer, Boolean>.Create;
  LOrdens := TDictionary<Integer, Boolean>.Create;
  LSecao := TModelFichaSecao.Create(TDatabase.Connection);
  try
    for I := 0 to ASecoes.Count - 1 do
    begin
      if not (ASecoes.Items[I] is TJSONObject) then
        raise Exception.Create('Item de secao invalido');

      LItem := ASecoes.Items[I] as TJSONObject;
      LId := LItem.GetValue<Integer>('id', 0);
      LOrdem := LItem.GetValue<Integer>('ordem', I + 1);

      if LId <= 0 then
        raise Exception.Create('ID de secao invalido');
      if LOrdem <= 0 then
        raise Exception.Create('Ordem invalida');
      if LIds.ContainsKey(LId) then
        raise Exception.Create('Secao repetida na ordenacao');
      if LOrdens.ContainsKey(LOrdem) then
        raise Exception.Create('Ordem repetida na ordenacao');

      LIds.Add(LId, True);
      LOrdens.Add(LOrdem, True);

      LSecao.BuscaDadosTabela(LId);
      if LSecao.Id <= 0 then
        raise Exception.Create('Secao nao encontrada');

      LSecao.Ordem := LOrdem;
      LSecao.SalvaNoBanco(1);
    end;
  finally
    LSecao.Free;
    LOrdens.Free;
    LIds.Free;
  end;
end;

procedure TFichaClinicaService.AtualizarAtivo(AId: Integer; AAtivo: Boolean);
var
  LSecao: TModelFichaSecao;
begin
  if AId <= 0 then
    raise Exception.Create('ID invalido');

  LSecao := TModelFichaSecao.Create(TDatabase.Connection);
  try
    LSecao.BuscaDadosTabela(AId);
    if LSecao.Id <= 0 then
      raise Exception.Create('Secao nao encontrada');

    if AAtivo then
      LSecao.Ativo := 1
    else
      LSecao.Ativo := 0;
    LSecao.SalvaNoBanco(1);
  finally
    LSecao.Free;
  end;
end;

procedure TFichaClinicaService.AtualizarExibicao(AId: Integer; AExibeTela, AExibeImpressao: Integer);
var
  LSecao: TModelFichaSecao;
begin
  if AId <= 0 then
    raise Exception.Create('ID invalido');

  LSecao := TModelFichaSecao.Create(TDatabase.Connection);
  try
    LSecao.BuscaDadosTabela(AId);
    if LSecao.Id <= 0 then
      raise Exception.Create('Secao nao encontrada');

    if AExibeTela >= 0 then
      LSecao.ExibeTela := AExibeTela;
    if AExibeImpressao >= 0 then
      LSecao.ExibeImpressao := AExibeImpressao;
    LSecao.SalvaNoBanco(1);
  finally
    LSecao.Free;
  end;
end;

end.
