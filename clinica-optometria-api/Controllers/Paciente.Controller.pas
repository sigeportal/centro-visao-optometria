unit Paciente.Controller;

interface

uses
  Horse;

type
  TPacienteController = class
  public
    class procedure Registrar;
    class procedure Listar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ObterPorId(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure Criar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure Atualizar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure Excluir(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ListarAnamneses(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ListarConsultas(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ListarRetornos(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ListarFinanceiro(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ListarDocumentos(Req: THorseRequest; Res: THorseResponse; Next: TProc);
  end;

  TPacienteRequest = class
  private
    Fnome: string;
    Fcpf: string;
    Fcidade: string;
    Femail: string;
    Fcelular: string;
    Fativo: Boolean;
  published
    property nome: string read Fnome write Fnome;
    property cpf: string read Fcpf write Fcpf;
    property cidade: string read Fcidade write Fcidade;
    property email: string read Femail write Femail;
    property celular: string read Fcelular write Fcelular;
    property ativo: Boolean read Fativo write Fativo;
  end;

  TPacienteResponse = class
  private
    Fid: Integer;
    Fnome: string;
    Fcpf: string;
    Fcidade: string;
    Fativo: Integer;
  published
    property id: Integer read Fid write Fid;
    property nome: string read Fnome write Fnome;
    property cpf: string read Fcpf write Fcpf;
    property cidade: string read Fcidade write Fcidade;
    property ativo: Integer read Fativo write Fativo;
  end;

  TPacienteIdResponse = class
  private
    Fid: Integer;
  published
    property id: Integer read Fid write Fid;
  end;

implementation

uses
  System.SysUtils,
  System.JSON,
  Horse.Commons,
  Horse.GBSwagger,
  Autorizacao.Middleware,
  Autorizacao.Service,
  Paciente.Service,
  Response.Utils,
  Logger.Utils;

class procedure TPacienteController.Registrar;
begin
  THorse.Group.Prefix('/v1/pacientes').Get('', AutorizarRota(PERM_PACIENTE_CONSULTAR, Listar));
  THorse.Group.Prefix('/v1/pacientes').Get('/:id', AutorizarRota(PERM_PACIENTE_CONSULTAR, ObterPorId));
  THorse.Group.Prefix('/v1/pacientes').Post('', AutorizarRota(PERM_PACIENTE_ALTERAR, Criar));
  THorse.Group.Prefix('/v1/pacientes').Put('/:id', AutorizarRota(PERM_PACIENTE_ALTERAR, Atualizar));
  THorse.Group.Prefix('/v1/pacientes').Delete('/:id', AutorizarRota(PERM_PACIENTE_EXCLUIR, Excluir));
  THorse.Group.Prefix('/v1/pacientes').Get('/:id/anamneses', AutorizarRota(PERM_CLINICO_CONSULTAR, ListarAnamneses));
  THorse.Group.Prefix('/v1/pacientes').Get('/:id/consultas', AutorizarRota(PERM_CONSULTA_RESUMO, ListarConsultas));
  THorse.Group.Prefix('/v1/pacientes').Get('/:id/retornos', AutorizarRota(PERM_CLINICO_CONSULTAR, ListarRetornos));
  THorse.Group.Prefix('/v1/pacientes').Get('/:id/financeiro', AutorizarRota(PERM_FINANCEIRO_CONSULTAR, ListarFinanceiro));
  THorse.Group.Prefix('/v1/pacientes').Get('/:id/documentos', AutorizarRota(PERM_CLINICO_CONSULTAR, ListarDocumentos));
end;

class procedure TPacienteController.Listar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TPacienteService;
  LBusca: string;
  LPage: Integer;
  LLimit: Integer;
begin
  Service := TPacienteService.Create;
  try
    LBusca := Req.Query.Items['busca'];
    LPage := StrToIntDef(Req.Query.Items['page'], 1);
    LLimit := StrToIntDef(Req.Query.Items['limit'], 10);
    Res.Send<TJSONObject>(
      TResponseUtils.Success('Pacientes listados com sucesso', Service.Listar(LBusca, LPage, LLimit))
    ).Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      TLogger.Error('PacienteController.Listar', E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TPacienteController.ObterPorId(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TPacienteService;
  LObj: TJSONObject;
  LId: Integer;
begin
  Service := TPacienteService.Create;
  try
    LId := StrToIntDef(Req.Params.Items['id'], 0);
    LObj := Service.ObterPorId(LId);
    if not Assigned(LObj) then
    begin
      Res.Send<TJSONObject>(TResponseUtils.NotFound('Paciente'))
        .Status(THTTPStatus.NotFound);
      Exit;
    end;

    Res.Send<TJSONObject>(TResponseUtils.Success('Paciente encontrado', LObj))
      .Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      TLogger.Error('PacienteController.ObterPorId', E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TPacienteController.Criar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TPacienteService;
  LBody, LData: TJSONObject;
  LId: Integer;
begin
  Service := TPacienteService.Create;
  try
    LBody := Req.Body<TJSONObject>;
    if not Assigned(LBody) then
    begin
      Res.Send<TJSONObject>(TResponseUtils.Error('Payload invalido', 422))
        .Status(THTTPStatus.UnprocessableEntity);
      Exit;
    end;

    LId := Service.Criar(LBody);

    LData := TJSONObject.Create;
    LData.AddPair('id', TJSONNumber.Create(LId));
    Res.Send<TJSONObject>(TResponseUtils.Success('Paciente criado com sucesso', LData))
      .Status(THTTPStatus.Created);
  except
    on E: EPacienteValidacao do
    begin
      Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422))
        .Status(THTTPStatus.UnprocessableEntity);
    end;
    on E: Exception do
    begin
      TLogger.Error('PacienteController.Criar', E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TPacienteController.Atualizar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TPacienteService;
  LBody, LData: TJSONObject;
  LId: Integer;
begin
  Service := TPacienteService.Create;
  try
    LId := StrToIntDef(Req.Params.Items['id'], 0);
    LBody := Req.Body<TJSONObject>;

    if (LId <= 0) or (not Assigned(LBody)) then
    begin
      Res.Send<TJSONObject>(TResponseUtils.Error('Dados invalidos', 422))
        .Status(THTTPStatus.UnprocessableEntity);
      Exit;
    end;

    if not Service.Atualizar(LId, LBody) then
    begin
      Res.Send<TJSONObject>(TResponseUtils.NotFound('Paciente'))
        .Status(THTTPStatus.NotFound);
      Exit;
    end;

    LData := TJSONObject.Create;
    LData.AddPair('id', TJSONNumber.Create(LId));
    Res.Send<TJSONObject>(TResponseUtils.Success('Paciente atualizado com sucesso', LData))
      .Status(THTTPStatus.OK);
  except
    on E: EPacienteValidacao do
    begin
      Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422))
        .Status(THTTPStatus.UnprocessableEntity);
    end;
    on E: Exception do
    begin
      TLogger.Error('PacienteController.Atualizar', E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TPacienteController.Excluir(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TPacienteService;
  LId: Integer;
  LInativado: Boolean;
  LExiste: TJSONObject;
begin
  Service := TPacienteService.Create;
  try
    LId := StrToIntDef(Req.Params.Items['id'], 0);
    if LId <= 0 then
    begin
      Res.Send<TJSONObject>(TResponseUtils.Error('ID invalido', 422))
        .Status(THTTPStatus.UnprocessableEntity);
      Exit;
    end;

    LExiste := Service.ObterPorId(LId);
    if not Assigned(LExiste) then
    begin
      Res.Send<TJSONObject>(TResponseUtils.NotFound('Paciente'))
        .Status(THTTPStatus.NotFound);
      Exit;
    end;
    LExiste.Free;

    LInativado := Service.Excluir(LId);

    if LInativado then
      Res.Send<TJSONObject>(TResponseUtils.Success('Paciente inativado com sucesso'))
        .Status(THTTPStatus.OK)
    else
      Res.Send<TJSONObject>(TResponseUtils.Success('Paciente excluido com sucesso'))
        .Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      TLogger.Error('PacienteController.Excluir', E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TPacienteController.ListarAnamneses(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TPacienteService;
  LId: Integer;
begin
  Service := TPacienteService.Create;
  try
    LId := StrToIntDef(Req.Params.Items['id'], 0);
    if LId <= 0 then
    begin
      Res.Send<TJSONObject>(TResponseUtils.Error('ID invalido', 422))
        .Status(THTTPStatus.UnprocessableEntity);
      Exit;
    end;
    Res.Send<TJSONObject>(TResponseUtils.Success('Anamneses listadas com sucesso', Service.ListarAnamneses(LId)))
      .Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      TLogger.Error('PacienteController.ListarAnamneses', E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TPacienteController.ListarConsultas(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TPacienteService;
  LId: Integer;
begin
  Service := TPacienteService.Create;
  try
    LId := StrToIntDef(Req.Params.Items['id'], 0);
    if LId <= 0 then
    begin
      Res.Send<TJSONObject>(TResponseUtils.Error('ID invalido', 422))
        .Status(THTTPStatus.UnprocessableEntity);
      Exit;
    end;
    Res.Send<TJSONObject>(TResponseUtils.Success('Consultas do paciente listadas com sucesso', Service.ListarConsultas(LId)))
      .Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      TLogger.Error('PacienteController.ListarConsultas', E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TPacienteController.ListarRetornos(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TPacienteService;
  LId: Integer;
begin
  Service := TPacienteService.Create;
  try
    LId := StrToIntDef(Req.Params.Items['id'], 0);
    if LId <= 0 then
    begin
      Res.Send<TJSONObject>(TResponseUtils.Error('ID invalido', 422))
        .Status(THTTPStatus.UnprocessableEntity);
      Exit;
    end;
    Res.Send<TJSONObject>(TResponseUtils.Success('Retornos do paciente listados com sucesso', Service.ListarRetornos(LId)))
      .Status(THTTPStatus.OK);
  except
    on E: EPacienteValidacao do
      Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422))
        .Status(THTTPStatus.UnprocessableEntity);
    on E: Exception do
    begin
      TLogger.Error('PacienteController.ListarRetornos', E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TPacienteController.ListarFinanceiro(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TPacienteService;
  LId: Integer;
begin
  Service := TPacienteService.Create;
  try
    LId := StrToIntDef(Req.Params.Items['id'], 0);
    if LId <= 0 then
    begin
      Res.Send<TJSONObject>(TResponseUtils.Error('ID invalido', 422))
        .Status(THTTPStatus.UnprocessableEntity);
      Exit;
    end;
    Res.Send<TJSONObject>(TResponseUtils.Success('Financeiro do paciente listado com sucesso', Service.ListarFinanceiro(LId)))
      .Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      TLogger.Error('PacienteController.ListarFinanceiro', E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TPacienteController.ListarDocumentos(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TPacienteService;
  LId: Integer;
begin
  Service := TPacienteService.Create;
  try
    LId := StrToIntDef(Req.Params.Items['id'], 0);
    if LId <= 0 then
    begin
      Res.Send<TJSONObject>(TResponseUtils.Error('ID invalido', 422))
        .Status(THTTPStatus.UnprocessableEntity);
      Exit;
    end;
    Res.Send<TJSONObject>(TResponseUtils.Success('Documentos do paciente listados com sucesso', Service.ListarDocumentos(LId)))
      .Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      TLogger.Error('PacienteController.ListarDocumentos', E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

initialization
  Swagger
    .BasePath('v1')
    .Path('pacientes')
      .Tag('Pacientes')
      .GET('Listar pacientes', 'Retorna a lista de pacientes ativos cadastrados na clinica')
        .AddResponse(200, 'Pacientes listados com sucesso')
          .Schema(TPacienteResponse)
          .IsArray(True)
        .&End
        .AddResponse(500, 'Erro interno ao listar pacientes').&End
      .&End
      .POST('Criar paciente', 'Cadastra um novo paciente no sistema')
        .AddParamBody('Paciente', 'Dados do paciente para cadastro')
          .Required(True)
          .Schema(TPacienteRequest)
        .&End
        .AddResponse(201, 'Paciente criado com sucesso')
          .Schema(TPacienteIdResponse)
        .&End
        .AddResponse(422, 'Dados invalidos para cadastro do paciente').&End
        .AddResponse(500, 'Erro interno ao criar paciente').&End
      .&End
    .&End
    .Path('pacientes/{id}')
      .Tag('Pacientes')
      .GET('Obter paciente por ID', 'Busca um paciente especifico a partir do identificador informado')
        .AddParamPath('id', 'Identificador numerico do paciente')
          .Required(True)
        .&End
        .AddResponse(200, 'Paciente encontrado')
          .Schema(TPacienteResponse)
        .&End
        .AddResponse(404, 'Paciente nao encontrado').&End
        .AddResponse(500, 'Erro interno ao consultar paciente').&End
      .&End
      .PUT('Atualizar paciente', 'Atualiza os dados cadastrais do paciente informado')
        .AddParamPath('id', 'Identificador numerico do paciente')
          .Required(True)
        .&End
        .AddParamBody('Paciente', 'Dados do paciente para atualizacao')
          .Required(True)
          .Schema(TPacienteRequest)
        .&End
        .AddResponse(200, 'Paciente atualizado com sucesso')
          .Schema(TPacienteIdResponse)
        .&End
        .AddResponse(422, 'Dados invalidos para atualizacao').&End
        .AddResponse(500, 'Erro interno ao atualizar paciente').&End
      .&End
      .DELETE('Excluir paciente', 'Realiza a exclusao logica do paciente informado')
        .AddParamPath('id', 'Identificador numerico do paciente')
          .Required(True)
        .&End
        .AddResponse(200, 'Paciente excluido com sucesso').&End
        .AddResponse(422, 'ID invalido').&End
        .AddResponse(500, 'Erro interno ao excluir paciente').&End
      .&End
    .&End
    .Path('pacientes/{id}/retornos')
      .Tag('Pacientes')
      .GET('Listar retornos do paciente', 'Retorna os planos de retorno vinculados as consultas do paciente')
        .AddResponse(200, 'Retornos listados com sucesso').&End
        .AddResponse(422, 'ID invalido').&End
        .AddResponse(500, 'Erro interno ao listar retornos').&End
      .&End
    .&End;

end.
