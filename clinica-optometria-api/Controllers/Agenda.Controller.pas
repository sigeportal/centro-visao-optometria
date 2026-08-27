unit Agenda.Controller;

interface

uses
  Horse;

type
  TAgendaController = class
  public
    class procedure Registrar;
    class procedure Listar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ObterPorId(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure Criar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure Atualizar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure AlterarStatus(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure Excluir(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure Cancelar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure FilaEspera(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ListarProfissionais(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ListarParcerias(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ListarProcedimentos(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure LancarPagamento(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure IniciarAtendimento(Req: THorseRequest; Res: THorseResponse; Next: TProc);
  end;

  TAgendaRequest = class
  private
    Fpaciente_id: Integer;
    Fprofissional_id: Integer;
    Fprofissional: string;
    Fprocedimento_id: Integer;
    Fprocedimento: string;
    Fdata: string;
    Fhora_inicio: string;
    Fhora_fim: string;
    Fstatus: string;
    Fprioridade: string;
    Fparceria_id: Integer;
    Fobservacao: string;
  published
    property paciente_id: Integer read Fpaciente_id write Fpaciente_id;
    property profissional_id: Integer read Fprofissional_id write Fprofissional_id;
    property profissional: string read Fprofissional write Fprofissional;
    property procedimento_id: Integer read Fprocedimento_id write Fprocedimento_id;
    property procedimento: string read Fprocedimento write Fprocedimento;
    property data: string read Fdata write Fdata;
    property hora_inicio: string read Fhora_inicio write Fhora_inicio;
    property hora_fim: string read Fhora_fim write Fhora_fim;
    property status: string read Fstatus write Fstatus;
    property prioridade: string read Fprioridade write Fprioridade;
    property parceria_id: Integer read Fparceria_id write Fparceria_id;
    property observacao: string read Fobservacao write Fobservacao;
  end;

  TAgendaResponse = class
  private
    Fid: Integer;
    Fpaciente_id: Integer;
    Fpaciente: string;
    Fpaciente_whatsapp: string;
    Fprofissional_id: Integer;
    Fprofissional: string;
    Fprocedimento_id: Integer;
    Fprocedimento: string;
    Finicio: string;
    Ffim: string;
    Fstatus: string;
  published
    property id: Integer read Fid write Fid;
    property paciente_id: Integer read Fpaciente_id write Fpaciente_id;
    property paciente: string read Fpaciente write Fpaciente;
    property paciente_whatsapp: string read Fpaciente_whatsapp write Fpaciente_whatsapp;
    property profissional_id: Integer read Fprofissional_id write Fprofissional_id;
    property profissional: string read Fprofissional write Fprofissional;
    property procedimento_id: Integer read Fprocedimento_id write Fprocedimento_id;
    property procedimento: string read Fprocedimento write Fprocedimento;
    property inicio: string read Finicio write Finicio;
    property fim: string read Ffim write Ffim;
    property status: string read Fstatus write Fstatus;
  end;

  TAgendaIdResponse = class
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
  Agenda.Service,
  Atendimento.Service,
  Correlation.Middleware,
  Response.Utils,
  Logger.Utils;

function QueryParam(Req: THorseRequest; const AName: string): string;
begin
  Result := '';
  Req.Query.TryGetValue(AName, Result);
end;

function ParamId(Req: THorseRequest): Integer;
begin
  Result := StrToIntDef(Req.Params.Items['id'], 0);
end;

function IdJson(AId: Integer): TJSONObject;
begin
  Result := TJSONObject.Create;
  Result.AddPair('id', TJSONNumber.Create(AId));
end;

procedure EnviarValidacao(Res: THorseResponse; const AMensagem: string);
begin
  Res.Send<TJSONObject>(TResponseUtils.Error(AMensagem, 422))
    .Status(THTTPStatus.UnprocessableEntity);
end;

class procedure TAgendaController.Registrar;
begin
  THorse.Group.Prefix('/v1/agenda').Get('', AutorizarRota(PERM_AGENDA_CONSULTAR, Listar));
  THorse.Group.Prefix('/v1/agenda').Post('', AutorizarRota(PERM_AGENDA_ALTERAR, Criar));
  THorse.Group.Prefix('/v1/agenda').Get('/fila-espera', AutorizarRota(PERM_AGENDA_CONSULTAR, FilaEspera));
  THorse.Group.Prefix('/v1/agenda').Get('/profissionais', AutorizarRota(PERM_AGENDA_CONSULTAR, ListarProfissionais));
  THorse.Group.Prefix('/v1/agenda').Get('/parcerias', AutorizarRota(PERM_AGENDA_CONSULTAR, ListarParcerias));
  THorse.Group.Prefix('/v1/agenda').Get('/procedimentos', AutorizarRota(PERM_AGENDA_CONSULTAR, ListarProcedimentos));
  THorse.Group.Prefix('/v1/agenda').Get('/:id', AutorizarRota(PERM_AGENDA_CONSULTAR, ObterPorId));
  THorse.Group.Prefix('/v1/agenda').Put('/:id', AutorizarRota(PERM_AGENDA_ALTERAR, Atualizar));
  THorse.Group.Prefix('/v1/agenda').Patch('/:id/status', AutorizarRota(PERM_AGENDA_ALTERAR, AlterarStatus));
  THorse.Group.Prefix('/v1/agenda').Delete('/:id', AutorizarRota(PERM_AGENDA_ALTERAR, Excluir));
  THorse.Group.Prefix('/v1/agenda').Post('/:id/cancelar', AutorizarRota(PERM_AGENDA_ALTERAR, Cancelar));
  THorse.Group.Prefix('/v1/agenda').Post('/:id/lancar-pagamento', AutorizarRota(PERM_FINANCEIRO_LANCAR, LancarPagamento));
  THorse.Group.Prefix('/v1/agenda').Post('/:id/iniciar-atendimento', AutorizarRota(PERM_CLINICO_ALTERAR, IniciarAtendimento));
end;

class procedure TAgendaController.ListarParcerias(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TAgendaService;
  LCorrelationId: string;
begin
  Service := TAgendaService.Create;
  try
    try
      Res.Send<TJSONObject>(
        TResponseUtils.Success('Parcerias listadas com sucesso', Service.ListarParcerias)
      ).Status(THTTPStatus.OK);
    except
      on E: Exception do
      begin
        LCorrelationId := ObterCorrelationId(Req);
        TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AgendaController.ListarParcerias']), E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
          .Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TAgendaController.ListarProcedimentos(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TAgendaService;
  LCorrelationId: string;
begin
  Service := TAgendaService.Create;
  try
    try
      Res.Send<TJSONObject>(
        TResponseUtils.Success('Procedimentos listados com sucesso', Service.ListarProcedimentos)
      ).Status(THTTPStatus.OK);
    except
      on E: Exception do
      begin
        LCorrelationId := ObterCorrelationId(Req);
        TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AgendaController.ListarProcedimentos']), E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
          .Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TAgendaController.IniciarAtendimento(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TAtendimentoService;
  LData: TJSONObject;
  LAgendamentoId: Integer;
  LConsultaId: Integer;
  LStatus: string;
  LCorrelationId: string;
begin
  Service := TAtendimentoService.Create;
  try
    try
      LAgendamentoId := ParamId(Req);
      LConsultaId := Service.Iniciar(LAgendamentoId, LStatus);

      LData := TJSONObject.Create;
      LData.AddPair('agendamento_id', TJSONNumber.Create(LAgendamentoId));
      LData.AddPair('consulta_id', TJSONNumber.Create(LConsultaId));
      LData.AddPair('status', LStatus);
      Res.Send<TJSONObject>(
        TResponseUtils.Success('Atendimento iniciado com sucesso', LData)
      ).Status(THTTPStatus.OK);
    except
      on E: EAtendimentoNaoEncontrado do
        Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
      on E: EAtendimentoValidacao do
        EnviarValidacao(Res, E.Message);
      on E: Exception do
      begin
        LCorrelationId := ObterCorrelationId(Req);
        TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AgendaController.IniciarAtendimento']), E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
          .Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TAgendaController.ListarProfissionais(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TAgendaService;
  LCorrelationId: string;
begin
  Service := TAgendaService.Create;
  try
    try
      Res.Send<TJSONObject>(
        TResponseUtils.Success('Profissionais listados com sucesso', Service.ListarProfissionais)
      ).Status(THTTPStatus.OK);
    except
      on E: Exception do
      begin
        LCorrelationId := ObterCorrelationId(Req);
        TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AgendaController.ListarProfissionais']), E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
          .Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TAgendaController.Listar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TAgendaService;
  LCorrelationId: string;
begin
  Service := TAgendaService.Create;
  try
    Res.Send<TJSONObject>(
      TResponseUtils.Success(
        'Agenda listada com sucesso',
        Service.Listar(
          QueryParam(Req, 'inicio'),
          QueryParam(Req, 'fim'),
          QueryParam(Req, 'profissional_id'),
          QueryParam(Req, 'status')
        )
      )
    ).Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AgendaController.Listar']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TAgendaController.ObterPorId(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TAgendaService;
  LObj: TJSONObject;
  LId: Integer;
  LCorrelationId: string;
begin
  Service := TAgendaService.Create;
  try
    LId := ParamId(Req);
    if LId <= 0 then
    begin
      EnviarValidacao(Res, 'ID invalido');
      Exit;
    end;

    LObj := Service.ObterPorId(LId);
    if not Assigned(LObj) then
    begin
      Res.Send<TJSONObject>(TResponseUtils.NotFound('Agendamento'))
        .Status(THTTPStatus.NotFound);
      Exit;
    end;

    Res.Send<TJSONObject>(TResponseUtils.Success('Agendamento encontrado', LObj))
      .Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AgendaController.ObterPorId']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TAgendaController.Criar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TAgendaService;
  LBody: TJSONObject;
  LIdGerado: Integer;
  LCorrelationId: string;
begin
  Service := TAgendaService.Create;
  try
    LBody := Req.Body<TJSONObject>;
    if not Assigned(LBody) then
    begin
      EnviarValidacao(Res, 'Payload invalido');
      Exit;
    end;

    LIdGerado := Service.Criar(LBody);
    Res.Send<TJSONObject>(TResponseUtils.Success('Agendamento criado com sucesso', IdJson(LIdGerado)))
      .Status(THTTPStatus.Created);
  except
    on E: EAgendaValidacao do
      EnviarValidacao(Res, E.Message);
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AgendaController.Criar']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TAgendaController.Atualizar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TAgendaService;
  LBody: TJSONObject;
  LId: Integer;
  LCorrelationId: string;
begin
  Service := TAgendaService.Create;
  try
    LId := ParamId(Req);
    LBody := Req.Body<TJSONObject>;
    if (LId <= 0) or (not Assigned(LBody)) then
    begin
      EnviarValidacao(Res, 'Dados invalidos');
      Exit;
    end;

    Service.Atualizar(LId, LBody);
    Res.Send<TJSONObject>(TResponseUtils.Success('Agendamento atualizado com sucesso', IdJson(LId)))
      .Status(THTTPStatus.OK);
  except
    on E: EAgendaValidacao do
      EnviarValidacao(Res, E.Message);
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AgendaController.Atualizar']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TAgendaController.AlterarStatus(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TAgendaService;
  LBody, LData: TJSONObject;
  LId: Integer;
  LStatus: string;
  LCorrelationId: string;
begin
  Service := TAgendaService.Create;
  try
    LId := ParamId(Req);
    LBody := Req.Body<TJSONObject>;
    if (LId <= 0) or (not Assigned(LBody)) then
    begin
      EnviarValidacao(Res, 'Dados invalidos');
      Exit;
    end;

    LStatus := LBody.GetValue<string>('status', '');
    Service.AlterarStatus(LId, LStatus);
    LData := IdJson(LId);
    LData.AddPair('status', LStatus);
    Res.Send<TJSONObject>(TResponseUtils.Success('Status atualizado com sucesso', LData))
      .Status(THTTPStatus.OK);
  except
    on E: EAgendaValidacao do
      EnviarValidacao(Res, E.Message);
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AgendaController.AlterarStatus']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TAgendaController.Excluir(Req: THorseRequest; Res: THorseResponse; Next: TProc);
begin
  Cancelar(Req, Res, Next);
end;

class procedure TAgendaController.Cancelar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TAgendaService;
  LId: Integer;
  LCorrelationId: string;
begin
  Service := TAgendaService.Create;
  try
    LId := ParamId(Req);
    if LId <= 0 then
    begin
      EnviarValidacao(Res, 'ID invalido');
      Exit;
    end;

    Service.Cancelar(LId);
    Res.Send<TJSONObject>(TResponseUtils.Success('Agendamento cancelado com sucesso', IdJson(LId)))
      .Status(THTTPStatus.OK);
  except
    on E: EAgendaValidacao do
      EnviarValidacao(Res, E.Message);
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AgendaController.Cancelar']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TAgendaController.FilaEspera(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TAgendaService;
  LCorrelationId: string;
begin
  Service := TAgendaService.Create;
  try
    Res.Send<TJSONObject>(
      TResponseUtils.Success('Fila de espera listada com sucesso', Service.ListarFilaEspera)
    ).Status(THTTPStatus.OK);
  except
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AgendaController.FilaEspera']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

class procedure TAgendaController.LancarPagamento(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TAgendaService;
  LBody: TJSONObject;
  LId: Integer;
  LCorrelationId: string;
begin
  Service := TAgendaService.Create;
  try
    LId := ParamId(Req);
    if LId <= 0 then
    begin
      EnviarValidacao(Res, 'ID invalido');
      Exit;
    end;

    LBody := Req.Body<TJSONObject>;
    if not Assigned(LBody) then
      LBody := TJSONObject.Create;

    Res.Send<TJSONObject>(
      TResponseUtils.Success('Lancamento financeiro criado com sucesso', Service.LancarPagamento(LId, LBody))
    ).Status(THTTPStatus.Created);
  except
    on E: EAgendaValidacao do
      EnviarValidacao(Res, E.Message);
    on E: Exception do
    begin
      LCorrelationId := ObterCorrelationId(Req);
      TLogger.Error(Format('[%s] %s', [LCorrelationId, 'AgendaController.LancarPagamento']), E);
      Res.Send<TJSONObject>(TResponseUtils.InternalError('Ocorreu um erro interno ao processar a solicitacao', LCorrelationId))
        .Status(THTTPStatus.InternalServerError);
    end;
  end;
  Service.Free;
end;

initialization
  Swagger
    .BasePath('v1')
    .Path('agenda')
      .Tag('Agenda')
      .GET('Listar agenda', 'Retorna agendamentos filtrados por periodo, profissional e status')
        .AddParamQuery('inicio', 'Inicio do periodo em ISO-8601')
        .&End
        .AddParamQuery('fim', 'Fim do periodo em ISO-8601')
        .&End
        .AddParamQuery('profissional_id', 'Identificador do profissional')
        .&End
        .AddParamQuery('status', 'Status do agendamento')
        .&End
        .AddResponse(200, 'Agenda listada com sucesso')
          .Schema(TAgendaResponse)
          .IsArray(True)
        .&End
      .&End
      .POST('Criar agendamento', 'Cria um agendamento validando obrigatorios, horario e conflitos')
        .AddParamBody('Agendamento', 'Dados do agendamento')
          .Required(True)
          .Schema(TAgendaRequest)
        .&End
        .AddResponse(201, 'Agendamento criado com sucesso')
          .Schema(TAgendaIdResponse)
        .&End
        .AddResponse(422, 'Erro de validacao do agendamento').&End
      .&End
    .&End
    .Path('agenda/{id}')
      .Tag('Agenda')
      .GET('Obter agendamento', 'Retorna os detalhes do agendamento')
        .AddParamPath('id', 'Identificador numerico do agendamento')
          .Required(True)
        .&End
        .AddResponse(200, 'Agendamento encontrado')
          .Schema(TAgendaResponse)
        .&End
        .AddResponse(404, 'Agendamento nao encontrado').&End
      .&End
      .PUT('Atualizar agendamento', 'Atualiza dados do agendamento')
        .AddParamPath('id', 'Identificador numerico do agendamento')
          .Required(True)
        .&End
        .AddParamBody('Agendamento', 'Dados atualizados do agendamento')
          .Required(True)
          .Schema(TAgendaRequest)
        .&End
        .AddResponse(200, 'Agendamento atualizado com sucesso')
          .Schema(TAgendaIdResponse)
        .&End
        .AddResponse(422, 'Erro de validacao do agendamento').&End
      .&End
      .DELETE('Cancelar agendamento', 'Cancela logicamente um agendamento')
        .AddParamPath('id', 'Identificador numerico do agendamento')
          .Required(True)
        .&End
        .AddResponse(200, 'Agendamento cancelado com sucesso')
          .Schema(TAgendaIdResponse)
        .&End
      .&End
    .&End
    .Path('agenda/{id}/status')
      .Tag('Agenda')
      .PATCH('Alterar status', 'Altera o status do agendamento')
        .AddParamPath('id', 'Identificador numerico do agendamento')
          .Required(True)
        .&End
        .AddResponse(200, 'Status atualizado com sucesso')
          .Schema(TAgendaIdResponse)
        .&End
        .AddResponse(422, 'Status invalido').&End
      .&End
    .&End
    .Path('agenda/fila-espera')
      .Tag('Agenda')
      .GET('Listar fila de espera', 'Retorna agendamentos em fila de espera')
        .AddResponse(200, 'Fila de espera listada com sucesso')
          .Schema(TAgendaResponse)
          .IsArray(True)
        .&End
      .&End
    .&End
    .Path('agenda/{id}/lancar-pagamento')
      .Tag('Agenda')
      .POST('Lancar pagamento', 'Cria um lancamento financeiro vinculado ao agendamento')
        .AddParamPath('id', 'Identificador numerico do agendamento')
          .Required(True)
        .&End
        .AddResponse(201, 'Lancamento financeiro criado com sucesso').&End
      .&End
    .&End
    .Path('agenda/profissionais')
      .Tag('Agenda')
      .GET('Listar profissionais', 'Retorna funcionarios ativos disponiveis para agendamento')
        .AddResponse(200, 'Profissionais listados com sucesso').&End
      .&End
    .&End
    .Path('agenda/parcerias')
      .Tag('Agenda')
      .GET('Listar parcerias', 'Retorna parcerias ativas disponiveis para agendamento')
        .AddResponse(200, 'Parcerias listadas com sucesso').&End
      .&End
    .&End
    .Path('agenda/procedimentos')
      .Tag('Agenda')
      .GET('Listar procedimentos', 'Retorna procedimentos ativos disponiveis para agendamento')
        .AddResponse(200, 'Procedimentos listados com sucesso').&End
      .&End
    .&End
    .Path('agenda/{id}/iniciar-atendimento')
      .Tag('Agenda')
      .POST('Iniciar atendimento', 'Cria ou retorna a consulta vinculada e sincroniza a agenda')
        .AddParamPath('id', 'Identificador numerico do agendamento')
          .Required(True)
        .&End
        .AddResponse(200, 'Atendimento iniciado com sucesso').&End
        .AddResponse(404, 'Agendamento nao encontrado').&End
        .AddResponse(422, 'Agendamento nao pode iniciar atendimento').&End
      .&End
    .&End;

end.
