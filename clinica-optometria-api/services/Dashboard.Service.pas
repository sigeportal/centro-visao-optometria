unit Dashboard.Service;

interface

uses
  System.JSON;

type
  TDashboardService = class
  private
    function QueryInteger(const ASql: string): Integer;
  public
    function Resumo: TJSONObject;
    function ProximasConsultas: TJSONArray;
    function Aniversariantes(const APeriodo: string = ''): TJSONArray;
    function ConsultasVencidas: TJSONArray;
    function Retornos: TJSONArray;
  end;

implementation

uses
  System.SysUtils,
  UnitConnection.Model.Interfaces,
  UnitDatabase,
  Dataset.JSON.Utils;

function TDashboardService.QueryInteger(const ASql: string): Integer;
var
  LQuery: iQuery;
begin
  Result := 0;
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add(ASql);
  LQuery.Open;
  if not LQuery.DataSet.IsEmpty then
    Result := LQuery.DataSet.Fields[0].AsInteger;
end;

function TDashboardService.Resumo: TJSONObject;
begin
  Result := TJSONObject.Create;
  Result.AddPair('total_pacientes', TJSONNumber.Create(QueryInteger(
    'SELECT COUNT(*) FROM PACIENTES WHERE COALESCE(PAC_ATIVO, 1) = 1'
  )));
  Result.AddPair('agendamentos_hoje', TJSONNumber.Create(QueryInteger(
    'SELECT COUNT(*) FROM AGENDAMENTOS WHERE CAST(AGD_INICIO AS DATE) = CURRENT_DATE'
  )));
  Result.AddPair('consultas_realizadas_hoje', TJSONNumber.Create(QueryInteger(
    'SELECT COUNT(*) FROM CONSULTAS WHERE CAST(CON_DATA AS DATE) = CURRENT_DATE ' +
    'AND CON_STATUS IN (''realizada'', ''atendida'')'
  )));
  Result.AddPair('consultas_mes', TJSONNumber.Create(QueryInteger(
    'SELECT COUNT(*) FROM CONSULTAS WHERE EXTRACT(YEAR FROM CON_DATA) = EXTRACT(YEAR FROM CURRENT_DATE) ' +
    'AND EXTRACT(MONTH FROM CON_DATA) = EXTRACT(MONTH FROM CURRENT_DATE)'
  )));
end;

function TDashboardService.ProximasConsultas: TJSONArray;
var
  LQuery: iQuery;
begin
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT FIRST 8 A.AGD_ID AS ID, P.PAC_NOME AS PACIENTE_NOME, ');
  LQuery.Add('A.AGD_PROFISSIONAL AS PROFISSIONAL_NOME, A.AGD_PROCEDIMENTO AS PROCEDIMENTO_NOME, ');
  LQuery.Add('A.AGD_INICIO AS DATA_HORA, ');
  LQuery.Add('A.AGD_STATUS AS STATUS ');
  LQuery.Add('FROM AGENDAMENTOS A ');
  LQuery.Add('JOIN PACIENTES P ON P.PAC_ID = A.AGD_PACIENTE_ID ');
  LQuery.Add('WHERE A.AGD_INICIO >= CURRENT_TIMESTAMP ');
  LQuery.Add('AND A.AGD_STATUS IN (''agendada'', ''confirmada'', ''fila_espera'') ');
  LQuery.Add('ORDER BY A.AGD_INICIO');
  LQuery.Open;
  Result := TDatasetJsonUtils.QueryToJSONArray(LQuery.DataSet);
end;

function TDashboardService.Aniversariantes(const APeriodo: string): TJSONArray;
var
  LQuery: iQuery;
begin
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT PAC_ID AS ID, PAC_NOME AS NOME, PAC_DATA_NASCIMENTO AS DATA_NASCIMENTO, ');
  LQuery.Add('PAC_CELULAR AS CELULAR ');
  LQuery.Add('FROM PACIENTES ');
  LQuery.Add('WHERE PAC_DATA_NASCIMENTO IS NOT NULL ');
  LQuery.Add('AND COALESCE(PAC_ATIVO, 1) = 1 ');
  LQuery.Add('AND EXTRACT(MONTH FROM PAC_DATA_NASCIMENTO) = EXTRACT(MONTH FROM CURRENT_DATE) ');
  if not SameText(APeriodo, 'mes') then
    LQuery.Add('AND EXTRACT(DAY FROM PAC_DATA_NASCIMENTO) = EXTRACT(DAY FROM CURRENT_DATE) ');
  LQuery.Add('ORDER BY PAC_NOME');
  LQuery.Open;
  Result := TDatasetJsonUtils.QueryToJSONArray(LQuery.DataSet);
end;

function TDashboardService.Retornos: TJSONArray;
var
  LQuery: iQuery;
begin
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT R.RET_ID AS ID, R.RET_CONSULTA_ID AS CONSULTA_ID, ');
  LQuery.Add('P.PAC_ID AS PACIENTE_ID, P.PAC_NOME AS PACIENTE_NOME, ');
  LQuery.Add('P.PAC_CPF AS CPF, P.PAC_CELULAR AS TELEFONE, ');
  LQuery.Add('C.CON_DATA AS CONSULTA_DATA, C.CON_PROFISSIONAL AS PROFISSIONAL, ');
  LQuery.Add('C.CON_PROCEDIMENTO AS PROCEDIMENTO, R.RET_TIPO AS TIPO, ');
  LQuery.Add('R.RET_DATA AS DATA_RETORNO, R.RET_MOTIVO AS MOTIVO, ');
  LQuery.Add('R.RET_OBSERVACAO AS OBSERVACAO, ');
  LQuery.Add('CASE WHEN R.RET_DATA < CURRENT_DATE THEN ''vencido'' ');
  LQuery.Add('WHEN R.RET_DATA <= DATEADD(15 DAY TO CURRENT_DATE) THEN ''proximo'' ');
  LQuery.Add('ELSE ''programado'' END AS STATUS ');
  LQuery.Add('FROM RETORNOS_CONSULTA R ');
  LQuery.Add('JOIN CONSULTAS C ON C.CON_ID = R.RET_CONSULTA_ID ');
  LQuery.Add('JOIN PACIENTES P ON P.PAC_ID = C.CON_PACIENTE_ID ');
  LQuery.Add('WHERE R.RET_DATA IS NOT NULL ');
  LQuery.Add('AND (R.RET_SITUACAO = ''retorno_programado'' ');
  LQuery.Add('OR R.RET_SITUACAO IS NULL) ');
  LQuery.Add('ORDER BY R.RET_DATA, R.RET_ID');
  LQuery.Open;
  Result := TDatasetJsonUtils.QueryToJSONArray(LQuery.DataSet);
end;

function TDashboardService.ConsultasVencidas: TJSONArray;
var
  LQuery: iQuery;
begin
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT FIRST 8 A.AGD_ID AS ID, P.PAC_NOME AS PACIENTE_NOME, ');
  LQuery.Add('A.AGD_PROFISSIONAL AS PROFISSIONAL_NOME, A.AGD_PROCEDIMENTO AS PROCEDIMENTO_NOME, ');
  LQuery.Add('A.AGD_INICIO AS DATA_HORA, ');
  LQuery.Add('A.AGD_STATUS AS STATUS ');
  LQuery.Add('FROM AGENDAMENTOS A ');
  LQuery.Add('JOIN PACIENTES P ON P.PAC_ID = A.AGD_PACIENTE_ID ');
  LQuery.Add('WHERE A.AGD_INICIO < CURRENT_TIMESTAMP ');
  LQuery.Add('AND A.AGD_STATUS IN (''agendada'', ''confirmada'', ''fila_espera'') ');
  LQuery.Add('ORDER BY A.AGD_INICIO DESC');
  LQuery.Open;
  Result := TDatasetJsonUtils.QueryToJSONArray(LQuery.DataSet);
end;

end.
