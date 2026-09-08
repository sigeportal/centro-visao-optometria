unit Paciente.Service;

interface

uses
  System.JSON,
  System.SysUtils;

type
  EPacienteValidacao = class(Exception);

  TPacienteService = class
  private
    procedure GarantirRetornoTabela;
    procedure AplicarDados(APaciente: TObject; AData: TJSONObject; AAtualizacao: Boolean);
    procedure ValidarDados(AData: TJSONObject; AAtualizacao: Boolean);
    function TemDependencias(AId: Integer): Boolean;
    function DataISO(const AValor: string): TDateTime;
  public
    constructor Create;
    function Listar(const ABusca: string; APage, ALimit: Integer): TJSONObject;
    function ObterPorId(AId: Integer): TJSONObject;
    function Criar(AData: TJSONObject): Integer;
    function Atualizar(AId: Integer; AData: TJSONObject): Boolean;
    function Excluir(AId: Integer): Boolean;
    function ListarAnamneses(APacienteId: Integer): TJSONArray;
    function ListarConsultas(APacienteId: Integer): TJSONArray;
    function ListarRetornos(APacienteId: Integer): TJSONArray;
    function ListarFinanceiro(APacienteId: Integer): TJSONArray;
    function ListarDocumentos(APacienteId: Integer): TJSONArray;
  end;

implementation

uses
  System.DateUtils,
  System.Math,
  FireDAC.Comp.Client,
  UnitDatabase,
  Models.Clinica,
  Dataset.JSON.Utils;

constructor TPacienteService.Create;
begin
  inherited Create;
  GarantirRetornoTabela;
end;

procedure TPacienteService.GarantirRetornoTabela;
var
  LRetorno: TModelRetornoConsulta;
begin
  LRetorno := TModelRetornoConsulta.Create(TDatabase.Connection);
  try
    LRetorno.CriaTabela;
  finally
    LRetorno.Free;
  end;
end;

function ApenasDigitos(const AValor: string): string;
var
  C: Char;
begin
  Result := '';
  for C in AValor do
    if CharInSet(C, ['0'..'9']) then
      Result := Result + C;
end;

function Texto(const AData: TJSONObject; const AChave, APadrao: string): string;
begin
  Result := Trim(AData.GetValue<string>(AChave, APadrao));
end;

procedure TPacienteService.ValidarDados(AData: TJSONObject; AAtualizacao: Boolean);
var
  LEmail: string;
  LCpf: string;
  LResponsavelCpf: string;
  LCep: string;
  LEstado: string;
begin
  if not Assigned(AData) then
    raise EPacienteValidacao.Create('Payload invalido');

  if (not AAtualizacao) and (Texto(AData, 'nome', '') = '') then
    raise EPacienteValidacao.Create('Nome e obrigatorio');

  if Assigned(AData.GetValue('nome')) and (Texto(AData, 'nome', '') = '') then
    raise EPacienteValidacao.Create('Nome e obrigatorio');

  LEmail := Texto(AData, 'email', '');
  if (LEmail <> '') and ((Pos('@', LEmail) = 0) or (Pos('.', LEmail) = 0)) then
    raise EPacienteValidacao.Create('Email invalido');

  LCpf := ApenasDigitos(Texto(AData, 'cpf', ''));
  if (LCpf <> '') and (Length(LCpf) <> 11) then
    raise EPacienteValidacao.Create('CPF invalido');

  LResponsavelCpf := ApenasDigitos(Texto(AData, 'responsavel_cpf', ''));
  if (LResponsavelCpf <> '') and (Length(LResponsavelCpf) <> 11) then
    raise EPacienteValidacao.Create('CPF do responsavel invalido');

  LCep := ApenasDigitos(Texto(AData, 'cep', ''));
  if (LCep <> '') and (Length(LCep) <> 8) then
    raise EPacienteValidacao.Create('CEP invalido');

  LEstado := Texto(AData, 'estado', '');
  if (LEstado <> '') and (Length(LEstado) <> 2) then
    raise EPacienteValidacao.Create('UF deve conter 2 letras');
end;

function TPacienteService.DataISO(const AValor: string): TDateTime;
var
  LTexto: string;
  LAno, LMes, LDia: Integer;
begin
  Result := 0;
  LTexto := Trim(AValor);
  if LTexto = '' then
    Exit;

  LTexto := Copy(LTexto, 1, 10);
  if (Length(LTexto) = 10) and (LTexto[5] = '-') and (LTexto[8] = '-') then
  begin
    LAno := StrToIntDef(Copy(LTexto, 1, 4), 0);
    LMes := StrToIntDef(Copy(LTexto, 6, 2), 0);
    LDia := StrToIntDef(Copy(LTexto, 9, 2), 0);
    if TryEncodeDate(LAno, LMes, LDia, Result) then
      Exit;
  end;

  Result := StrToDateDef(LTexto, 0);
end;

procedure TPacienteService.AplicarDados(APaciente: TObject; AData: TJSONObject; AAtualizacao: Boolean);
var
  LPaciente: TModelPaciente;
begin
  LPaciente := TModelPaciente(APaciente);

  LPaciente.Nome := Texto(AData, 'nome', LPaciente.Nome);
  LPaciente.NomeSocial := Texto(AData, 'nome_social', LPaciente.NomeSocial);

  if Assigned(AData.GetValue('data_nascimento')) then
    LPaciente.DataNascimento := DataISO(AData.GetValue<string>('data_nascimento', ''));

  LPaciente.Sexo := Texto(AData, 'sexo', LPaciente.Sexo);
  LPaciente.Celular := Texto(AData, 'celular', LPaciente.Celular);
  LPaciente.Telefone2 := Texto(AData, 'telefone2', LPaciente.Telefone2);
  LPaciente.Email := Texto(AData, 'email', LPaciente.Email);
  LPaciente.Ocupacao := Texto(AData, 'ocupacao', LPaciente.Ocupacao);
  LPaciente.Cpf := Texto(AData, 'cpf', LPaciente.Cpf);
  LPaciente.Rg := Texto(AData, 'rg', LPaciente.Rg);
  LPaciente.ComoConheceu := Texto(AData, 'como_conheceu', LPaciente.ComoConheceu);
  LPaciente.ResponsavelNome := Texto(AData, 'responsavel_nome', LPaciente.ResponsavelNome);
  LPaciente.ResponsavelCpf := Texto(AData, 'responsavel_cpf', LPaciente.ResponsavelCpf);
  LPaciente.Endereco := Texto(AData, 'endereco', LPaciente.Endereco);
  LPaciente.Complemento := Texto(AData, 'complemento', LPaciente.Complemento);
  LPaciente.Cidade := Texto(AData, 'cidade', LPaciente.Cidade);
  LPaciente.Estado := UpperCase(Texto(AData, 'estado', LPaciente.Estado));
  LPaciente.Cep := Texto(AData, 'cep', LPaciente.Cep);
  LPaciente.Foto := Texto(AData, 'foto', LPaciente.Foto);

  if not AAtualizacao then
  begin
    LPaciente.Ativo := 1;
    LPaciente.DataCadastro := Now;
  end;
end;

function TPacienteService.Listar(const ABusca: string; APage, ALimit: Integer): TJSONObject;
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
  LItems: TJSONArray;
  LBusca: string;
  LOffset: Integer;
  LTotal: Integer;
begin
  if APage < 1 then
    APage := 1;
  if ALimit < 1 then
    ALimit := 10;
  if ALimit > 100 then
    ALimit := 100;

  LBusca := '%' + UpperCase(Trim(ABusca)) + '%';
  LOffset := (APage - 1) * ALimit;
  LTotal := 0;

  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LQuery.SQL.Text :=
        'SELECT COUNT(*) AS TOTAL FROM PACIENTES ' +
        'WHERE COALESCE(PAC_ATIVO, 1) = 1 ' +
        'AND (:BUSCA_VAZIA = 1 OR UPPER(PAC_NOME) LIKE :BUSCA ' +
        'OR UPPER(PAC_CPF) LIKE :BUSCA OR UPPER(PAC_CIDADE) LIKE :BUSCA)';
      LQuery.ParamByName('BUSCA_VAZIA').AsInteger := IfThen(Trim(ABusca) = '', 1, 0);
      LQuery.ParamByName('BUSCA').AsString := LBusca;
      LQuery.Open;
      LTotal := LQuery.FieldByName('TOTAL').AsInteger;

      LQuery.Close;
      LQuery.SQL.Text :=
        Format('SELECT FIRST %d SKIP %d PAC_ID AS ID, PAC_NOME AS NOME, PAC_CPF AS CPF, ', [ALimit, LOffset]) +
        'PAC_CIDADE AS CIDADE, PAC_DATA_NASCIMENTO AS DATA_NASCIMENTO, PAC_CELULAR AS CELULAR, ' +
        'PAC_EMAIL AS EMAIL, PAC_ATIVO AS ATIVO FROM PACIENTES ' +
        'WHERE COALESCE(PAC_ATIVO, 1) = 1 ' +
        'AND (:BUSCA_VAZIA = 1 OR UPPER(PAC_NOME) LIKE :BUSCA ' +
        'OR UPPER(PAC_CPF) LIKE :BUSCA OR UPPER(PAC_CIDADE) LIKE :BUSCA) ' +
        'ORDER BY PAC_NOME';
      LQuery.ParamByName('BUSCA_VAZIA').AsInteger := IfThen(Trim(ABusca) = '', 1, 0);
      LQuery.ParamByName('BUSCA').AsString := LBusca;
      LQuery.Open;
      LItems := TDatasetJsonUtils.QueryToJSONArray(LQuery);
    finally
      LQuery.Free;
    end;
  finally
    TDatabase.Connection.Disconnected(LIndiceConexao);
  end;

  Result := TJSONObject.Create;
  Result.AddPair('items', LItems);
  Result.AddPair('total', TJSONNumber.Create(LTotal));
  Result.AddPair('page', TJSONNumber.Create(APage));
  Result.AddPair('limit', TJSONNumber.Create(ALimit));
end;

function TPacienteService.ObterPorId(AId: Integer): TJSONObject;
var
  LPaciente: TModelPaciente;
begin
  Result := nil;
  LPaciente := TModelPaciente.Create(TDatabase.Connection);
  try
    LPaciente.BuscaDadosTabela(AId);
    if LPaciente.Id > 0 then
    begin
      Result := TJSONObject.Create;
      Result.AddPair('id', TJSONNumber.Create(LPaciente.Id));
      Result.AddPair('nome', LPaciente.Nome);
      Result.AddPair('nome_social', LPaciente.NomeSocial);
      if LPaciente.DataNascimento > 0 then
        Result.AddPair('data_nascimento', DateToISO8601(LPaciente.DataNascimento, False))
      else
        Result.AddPair('data_nascimento', TJSONNull.Create);
      Result.AddPair('sexo', LPaciente.Sexo);
      Result.AddPair('celular', LPaciente.Celular);
      Result.AddPair('telefone2', LPaciente.Telefone2);
      Result.AddPair('email', LPaciente.Email);
      Result.AddPair('ocupacao', LPaciente.Ocupacao);
      Result.AddPair('cpf', LPaciente.Cpf);
      Result.AddPair('rg', LPaciente.Rg);
      Result.AddPair('como_conheceu', LPaciente.ComoConheceu);
      Result.AddPair('responsavel_nome', LPaciente.ResponsavelNome);
      Result.AddPair('responsavel_cpf', LPaciente.ResponsavelCpf);
      Result.AddPair('endereco', LPaciente.Endereco);
      Result.AddPair('complemento', LPaciente.Complemento);
      Result.AddPair('cidade', LPaciente.Cidade);
      Result.AddPair('estado', LPaciente.Estado);
      Result.AddPair('cep', LPaciente.Cep);
      Result.AddPair('foto', LPaciente.Foto);
      Result.AddPair('ativo', TJSONNumber.Create(LPaciente.Ativo));
      if LPaciente.DataCadastro > 0 then
        Result.AddPair('data_cadastro', DateToISO8601(LPaciente.DataCadastro, False))
      else
        Result.AddPair('data_cadastro', TJSONNull.Create);
    end;
  finally
    LPaciente.Free;
  end;
end;

function TPacienteService.Criar(AData: TJSONObject): Integer;
var
  LPaciente: TModelPaciente;
begin
  ValidarDados(AData, False);

  LPaciente := TModelPaciente.Create(TDatabase.Connection);
  try
    LPaciente.Id := LPaciente.GeraCodigo('PAC_ID');
    AplicarDados(LPaciente, AData, False);
    LPaciente.SalvaNoBanco(1);
    Result := LPaciente.Id;
  finally
    LPaciente.Free;
  end;
end;

function TPacienteService.Atualizar(AId: Integer; AData: TJSONObject): Boolean;
var
  LPaciente: TModelPaciente;
begin
  ValidarDados(AData, True);
  Result := False;

  LPaciente := TModelPaciente.Create(TDatabase.Connection);
  try
    LPaciente.BuscaDadosTabela(AId);
    if LPaciente.Id <= 0 then
      Exit;

    AplicarDados(LPaciente, AData, True);
    LPaciente.SalvaNoBanco(1);
    Result := True;
  finally
    LPaciente.Free;
  end;
end;

function TPacienteService.TemDependencias(AId: Integer): Boolean;
var
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LQuery: TFDQuery;
begin
  Result := False;
  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LQuery.SQL.Text :=
        'SELECT COUNT(*) AS TOTAL FROM ( ' +
        'SELECT CON_ID AS ID FROM CONSULTAS WHERE CON_PACIENTE_ID = :ID ' +
        'UNION ALL SELECT AGD_ID AS ID FROM AGENDAMENTOS WHERE AGD_PACIENTE_ID = :ID ' +
        'UNION ALL SELECT FIN_ID AS ID FROM FIN_LANCAMENTOS WHERE FIN_PACIENTE_ID = :ID ' +
        ') X';
      LQuery.ParamByName('ID').AsInteger := AId;
      LQuery.Open;
      Result := LQuery.FieldByName('TOTAL').AsInteger > 0;
    finally
      LQuery.Free;
    end;
  finally
    TDatabase.Connection.Disconnected(LIndiceConexao);
  end;
end;

function TPacienteService.Excluir(AId: Integer): Boolean;
var
  LPaciente: TModelPaciente;
begin
  Result := False;
  LPaciente := TModelPaciente.Create(TDatabase.Connection);
  try
    LPaciente.BuscaDadosTabela(AId);
    if LPaciente.Id <= 0 then
      Exit;

    if TemDependencias(AId) then
    begin
      LPaciente.Ativo := 0;
      LPaciente.SalvaNoBanco(1);
      Result := True;
    end
    else
      LPaciente.Apagar(AId);
  finally
    LPaciente.Free;
  end;
end;

function TPacienteService.ListarAnamneses(APacienteId: Integer): TJSONArray;
var
  LQuery: TFDQuery;
  LIndiceConexao: Integer;
  LConn: TFDConnection;
begin
  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LQuery.SQL.Text :=
        'SELECT A.ANA_ID AS ID, A.ANA_CONSULTA_ID AS CONSULTA_ID, ' +
        'A.ANA_DATA AS DATA, A.ANA_DATA AS CRIADO_EM, C.CON_STATUS AS CONSULTA_STATUS, ' +
        'C.CON_PROFISSIONAL AS PROFISSIONAL, ' +
        'A.ANA_MOTIVO_PRINCIPAL AS MOTIVO_PRINCIPAL, ' +
        'A.ANA_MOTIVO_PRINCIPAL AS QUEIXA_PRINCIPAL, ' +
        'A.ANA_OBSERVACOES_GERAIS AS HISTORICO, ' +
        'A.ANA_OBSERVACOES_FINAIS AS OBSERVACOES ' +
        'FROM ANAMNESES A ' +
        'JOIN CONSULTAS C ON C.CON_ID = A.ANA_CONSULTA_ID ' +
        'WHERE C.CON_PACIENTE_ID = :PACIENTE_ID ' +
        'ORDER BY A.ANA_DATA DESC';
      LQuery.ParamByName('PACIENTE_ID').AsInteger := APacienteId;
      LQuery.Open;
      Result := TDatasetJsonUtils.QueryToJSONArray(LQuery);
    finally
      LQuery.Free;
    end;
  finally
    TDatabase.Connection.Disconnected(LIndiceConexao);
  end;
end;

function TPacienteService.ListarConsultas(APacienteId: Integer): TJSONArray;
var
  LQuery: TFDQuery;
  LIndiceConexao: Integer;
  LConn: TFDConnection;
begin
  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LQuery.SQL.Text :=
        'SELECT CON_ID AS ID, CON_PACIENTE_ID AS PACIENTE_ID, CON_AGENDAMENTO_ID AS AGENDAMENTO_ID, ' +
        'CON_DATA AS DATA, CON_FINALIZADA_EM AS FINALIZADA_EM, CON_PROFISSIONAL AS PROFISSIONAL, ' +
        'CON_PROCEDIMENTO AS PROCEDIMENTO, CON_STATUS AS STATUS ' +
        'FROM CONSULTAS WHERE CON_PACIENTE_ID = :PACIENTE_ID ORDER BY CON_DATA DESC';
      LQuery.ParamByName('PACIENTE_ID').AsInteger := APacienteId;
      LQuery.Open;
      Result := TDatasetJsonUtils.QueryToJSONArray(LQuery);
    finally
      LQuery.Free;
    end;
  finally
    TDatabase.Connection.Disconnected(LIndiceConexao);
  end;
end;

function TPacienteService.ListarRetornos(APacienteId: Integer): TJSONArray;
var
  LQuery: TFDQuery;
  LIndiceConexao: Integer;
  LConn: TFDConnection;
begin
  if APacienteId <= 0 then
    raise EPacienteValidacao.Create('Paciente invalido');

  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LQuery.SQL.Text :=
        'SELECT R.RET_ID AS ID, R.RET_CONSULTA_ID AS CONSULTA_ID, ' +
        'C.CON_PACIENTE_ID AS PACIENTE_ID, P.PAC_NOME AS PACIENTE_NOME, C.CON_DATA AS CONSULTA_DATA, ' +
        'C.CON_PROFISSIONAL AS PROFISSIONAL, C.CON_PROCEDIMENTO AS PROCEDIMENTO, ' +
        'C.CON_STATUS AS CONSULTA_STATUS, ' +
        'CASE WHEN R.RET_TIPO IN (''sem_retorno'', ''conforme_necessidade'') THEN ''sem_retorno'' ' +
        'WHEN R.RET_SITUACAO IS NULL OR R.RET_SITUACAO = '''' THEN ''retorno_programado'' ' +
        'ELSE R.RET_SITUACAO END AS SITUACAO, ' +
        'R.RET_TIPO AS TIPO, R.RET_DATA AS DATA_RETORNO, ' +
        'R.RET_MOTIVO AS MOTIVO, R.RET_OBSERVACAO AS OBSERVACAO, ' +
        'COALESCE(R.RET_TEM_RETORNO, 1) AS TEM_RETORNO, ' +
        'COALESCE(R.RET_TEM_NOVA_CONSULTA, 0) AS TEM_NOVA_CONSULTA, ' +
        'R.RET_NOVA_CONSULTA_DATA AS NOVA_CONSULTA_DATA, ' +
        'R.RET_NOVA_CONSULTA_MOTIVO AS NOVA_CONSULTA_MOTIVO, ' +
        'R.RET_NOVA_CONSULTA_OBSERVACAO AS NOVA_CONSULTA_OBSERVACAO, ' +
        'R.RET_CRIADO_POR AS CRIADO_POR, R.RET_CRIADO_EM AS CRIADO_EM, ' +
        'R.RET_ATUALIZADO_POR AS ATUALIZADO_POR, R.RET_ATUALIZADO_EM AS ATUALIZADO_EM, ' +
        'UC.USU_LOGIN AS CRIADO_POR_LOGIN, UA.USU_LOGIN AS ATUALIZADO_POR_LOGIN ' +
        'FROM RETORNOS_CONSULTA R ' +
        'JOIN CONSULTAS C ON C.CON_ID = R.RET_CONSULTA_ID ' +
        'JOIN PACIENTES P ON P.PAC_ID = C.CON_PACIENTE_ID ' +
        'LEFT JOIN USUARIOS UC ON UC.USU_CODIGO = R.RET_CRIADO_POR ' +
        'LEFT JOIN USUARIOS UA ON UA.USU_CODIGO = R.RET_ATUALIZADO_POR ' +
        'WHERE C.CON_PACIENTE_ID = :PACIENTE_ID ' +
        'ORDER BY COALESCE(CAST(R.RET_DATA AS TIMESTAMP), C.CON_DATA) DESC, R.RET_ID DESC';
      LQuery.ParamByName('PACIENTE_ID').AsInteger := APacienteId;
      LQuery.Open;
      Result := TDatasetJsonUtils.QueryToJSONArray(LQuery);
    finally
      LQuery.Free;
    end;
  finally
    TDatabase.Connection.Disconnected(LIndiceConexao);
  end;
end;

function TPacienteService.ListarFinanceiro(APacienteId: Integer): TJSONArray;
var
  LQuery: TFDQuery;
  LIndiceConexao: Integer;
  LConn: TFDConnection;
begin
  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LQuery.SQL.Text :=
        'SELECT FIN_ID AS ID, FIN_COMPETENCIA AS DATA, FIN_OBSERVACOES AS DESCRICAO, ' +
        'FIN_FORMA_PAGAMENTO AS FORMA_PAGAMENTO, FIN_VALOR AS VALOR, FIN_STATUS AS STATUS, ' +
        'FIN_TIPO AS TIPO FROM FIN_LANCAMENTOS ' +
        'WHERE FIN_PACIENTE_ID = :PACIENTE_ID ORDER BY FIN_COMPETENCIA DESC, FIN_ID DESC';
      LQuery.ParamByName('PACIENTE_ID').AsInteger := APacienteId;
      LQuery.Open;
      Result := TDatasetJsonUtils.QueryToJSONArray(LQuery);
    finally
      LQuery.Free;
    end;
  finally
    TDatabase.Connection.Disconnected(LIndiceConexao);
  end;
end;

function TPacienteService.ListarDocumentos(APacienteId: Integer): TJSONArray;
var
  LQuery: TFDQuery;
  LIndiceConexao: Integer;
  LConn: TFDConnection;
  LGrupo: TJSONObject;
  LDocs: TJSONArray;
  LDoc: TJSONObject;
  LConsultaId: Integer;
begin
  Result := TJSONArray.Create;
  LGrupo := nil;
  LDocs := nil;
  LConsultaId := 0;

  LIndiceConexao := TDatabase.Connection.Connected;
  try
    LConn := TFDConnection(TDatabase.Connection.GetListaConexoes[LIndiceConexao]);
    LQuery := TFDQuery.Create(nil);
    try
      LQuery.Connection := LConn;
      LQuery.SQL.Text :=
        'SELECT C.CON_ID AS CONSULTA_ID, C.CON_DATA AS CONSULTA_DATA, D.DOC_ID AS ID, ' +
        'C.CON_PROFISSIONAL AS PROFISSIONAL, C.CON_STATUS AS CONSULTA_STATUS, ' +
        'D.DOC_TIPO AS TIPO, D.DOC_TITULO AS TITULO, ' +
        'D.DOC_NOME_ARQUIVO AS NOME, D.DOC_CAMINHO_ARQUIVO AS URL, ' +
        'D.DOC_MIME_TYPE AS MIME_TYPE, D.DOC_DATA_UPLOAD AS DATA_UPLOAD, ' +
        'D.DOC_STATUS AS STATUS, COALESCE(D.DOC_VERSAO, 1) AS VERSAO, ' +
        'COALESCE(D.DOC_ATUALIZADO_EM, D.DOC_EMITIDO_EM, D.DOC_DATA_UPLOAD) AS ATUALIZADO_EM ' +
        'FROM CONSULTAS C ' +
        'JOIN DOCUMENTOS_CONSULTA D ON D.DOC_CONSULTA_ID = C.CON_ID ' +
        'WHERE C.CON_PACIENTE_ID = :PACIENTE_ID ' +
        'ORDER BY C.CON_DATA DESC, D.DOC_DATA_UPLOAD DESC';
      LQuery.ParamByName('PACIENTE_ID').AsInteger := APacienteId;
      LQuery.Open;

      while not LQuery.Eof do
      begin
        if LConsultaId <> LQuery.FieldByName('CONSULTA_ID').AsInteger then
        begin
          LConsultaId := LQuery.FieldByName('CONSULTA_ID').AsInteger;
          LDocs := TJSONArray.Create;
          LGrupo := TJSONObject.Create;
          LGrupo.AddPair('consulta_id', TJSONNumber.Create(LConsultaId));
          LGrupo.AddPair('consulta_data', LQuery.FieldByName('CONSULTA_DATA').AsString);
          LGrupo.AddPair('data', LQuery.FieldByName('CONSULTA_DATA').AsString);
          LGrupo.AddPair('profissional', LQuery.FieldByName('PROFISSIONAL').AsString);
          LGrupo.AddPair('consulta_status', LQuery.FieldByName('CONSULTA_STATUS').AsString);
          LGrupo.AddPair('documentos', LDocs);
          Result.AddElement(LGrupo);
        end;

        LDoc := TJSONObject.Create;
        LDoc.AddPair('id', TJSONNumber.Create(LQuery.FieldByName('ID').AsInteger));
        LDoc.AddPair('tipo', LQuery.FieldByName('TIPO').AsString);
        LDoc.AddPair('titulo', LQuery.FieldByName('TITULO').AsString);
        LDoc.AddPair('nome', LQuery.FieldByName('NOME').AsString);
        LDoc.AddPair('url', LQuery.FieldByName('URL').AsString);
        LDoc.AddPair('mime_type', LQuery.FieldByName('MIME_TYPE').AsString);
        LDoc.AddPair('data_upload', LQuery.FieldByName('DATA_UPLOAD').AsString);
        LDoc.AddPair('atualizado_em', LQuery.FieldByName('ATUALIZADO_EM').AsString);
        LDoc.AddPair('status', LQuery.FieldByName('STATUS').AsString);
        LDoc.AddPair('versao', TJSONNumber.Create(LQuery.FieldByName('VERSAO').AsInteger));
        LDoc.AddPair('anexo', TJSONBool.Create(
          SameText(Trim(LQuery.FieldByName('TIPO').AsString), 'anexo')));
        LDocs.AddElement(LDoc);
        LQuery.Next;
      end;
    finally
      LQuery.Free;
    end;
  finally
    TDatabase.Connection.Disconnected(LIndiceConexao);
  end;
end;

end.
