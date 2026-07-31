unit Consulta.Controller;

interface

uses
  Horse;

type
  TConsultaController = class
  public
    class procedure Registrar;
    class procedure Listar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ObterPorId(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure Criar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure Atualizar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure Finalizar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ListarAnamneses(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ObterAnamnese(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure CriarAnamnese(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure AtualizarAnamnese(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ExcluirAnamnese(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ImpressaoAnamnese(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ObterAnamneseConsulta(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure SalvarAnamneseConsulta(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ListarPrescricoes(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ObterPrescricao(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure CriarPrescricao(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure AtualizarPrescricao(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ExcluirPrescricao(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ImpressaoPrescricao(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure ListarDocumentos(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure CriarDocumento(Req: THorseRequest; Res: THorseResponse; Next: TProc);
  end;

implementation

uses
  System.SysUtils,
  System.JSON,
  Horse.Commons,
  Horse.GBSwagger,
  Consulta.Service,
  Response.Utils,
  Logger.Utils;

function ParamId(Req: THorseRequest; const AName: string = 'id'): Integer;
begin
  Result := StrToIntDef(Req.Params.Items[AName], 0);
end;

procedure SendId(Res: THorseResponse; const AMensagem, ACampo: string; AId: Integer; AStatus: THTTPStatus);
var
  LData: TJSONObject;
begin
  LData := TJSONObject.Create;
  LData.AddPair(ACampo, TJSONNumber.Create(AId));
  Res.Send<TJSONObject>(TResponseUtils.Success(AMensagem, LData)).Status(AStatus);
end;

class procedure TConsultaController.Registrar;
begin
  THorse.Group.Prefix('/v1/consultas').Get('', Listar);
  THorse.Group.Prefix('/v1/consultas').Post('', Criar);
  THorse.Group.Prefix('/v1/consultas').Get('/:id', ObterPorId);
  THorse.Group.Prefix('/v1/consultas').Put('/:id', Atualizar);
  THorse.Group.Prefix('/v1/consultas').Post('/:id/finalizar', Finalizar);

  THorse.Group.Prefix('/v1/consultas').Get('/:id/anamnese', ObterAnamneseConsulta);
  THorse.Group.Prefix('/v1/consultas').Post('/:id/anamnese', SalvarAnamneseConsulta);
  THorse.Group.Prefix('/v1/consultas').Get('/:id/anamneses', ListarAnamneses);
  THorse.Group.Prefix('/v1/consultas').Post('/:id/anamneses', CriarAnamnese);
  THorse.Group.Prefix('/v1/anamneses').Get('/:id', ObterAnamnese);
  THorse.Group.Prefix('/v1/anamneses').Put('/:id', AtualizarAnamnese);
  THorse.Group.Prefix('/v1/anamneses').Delete('/:id', ExcluirAnamnese);
  THorse.Group.Prefix('/v1/anamneses').Get('/:id/impressao', ImpressaoAnamnese);

  THorse.Group.Prefix('/v1/consultas').Get('/:id/prescricoes', ListarPrescricoes);
  THorse.Group.Prefix('/v1/consultas').Post('/:id/prescricoes', CriarPrescricao);
  THorse.Group.Prefix('/v1/consultas').Put('/:id/prescricoes/:prescricao_id', AtualizarPrescricao);
  THorse.Group.Prefix('/v1/consultas').Delete('/:id/prescricoes/:prescricao_id', ExcluirPrescricao);
  THorse.Group.Prefix('/v1/prescricoes').Get('/:id', ObterPrescricao);
  THorse.Group.Prefix('/v1/prescricoes').Put('/:id', AtualizarPrescricao);
  THorse.Group.Prefix('/v1/prescricoes').Delete('/:id', ExcluirPrescricao);
  THorse.Group.Prefix('/v1/prescricoes').Get('/:id/impressao', ImpressaoPrescricao);

  THorse.Group.Prefix('/v1/consultas').Get('/:id/documentos', ListarDocumentos);
  THorse.Group.Prefix('/v1/consultas').Post('/:id/documentos', CriarDocumento);
end;

class procedure TConsultaController.Listar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
begin
  Service := TConsultaService.Create;
  try
    try
      Res.Send<TJSONObject>(TResponseUtils.Success('Consultas listadas com sucesso', Service.Listar)).Status(THTTPStatus.OK);
    except
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.Listar', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.ObterPorId(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
  LObj: TJSONObject;
  LId: Integer;
begin
  Service := TConsultaService.Create;
  try
    try
      LId := ParamId(Req);
      if LId <= 0 then
      begin
        Res.Send<TJSONObject>(TResponseUtils.Error('ID invalido', 422)).Status(THTTPStatus.UnprocessableEntity);
        Exit;
      end;

      LObj := Service.ObterPorId(LId);
      if not Assigned(LObj) then
        Res.Send<TJSONObject>(TResponseUtils.NotFound('Consulta')).Status(THTTPStatus.NotFound)
      else
        Res.Send<TJSONObject>(TResponseUtils.Success('Consulta encontrada com sucesso', LObj)).Status(THTTPStatus.OK);
    except
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.ObterPorId', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.Criar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
  LBody: TJSONObject;
  LId: Integer;
begin
  Service := TConsultaService.Create;
  try
    try
      LBody := Req.Body<TJSONObject>;
      if not Assigned(LBody) then
        raise EConsultaValidacao.Create('Payload invalido');

      LId := Service.Criar(
        LBody.GetValue<Integer>('paciente_id', 0),
        LBody.GetValue<string>('procedimento', 'Consulta'),
        LBody.GetValue<string>('profissional', ''),
        LBody.GetValue<Integer>('agendamento_id', 0)
      );
      SendId(Res, 'Consulta criada com sucesso', 'id', LId, THTTPStatus.Created);
    except
      on E: EConsultaValidacao do
        Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422)).Status(THTTPStatus.UnprocessableEntity);
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.Criar', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.Atualizar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
  LBody: TJSONObject;
  LId: Integer;
begin
  Service := TConsultaService.Create;
  try
    try
      LId := ParamId(Req);
      LBody := Req.Body<TJSONObject>;
      if (LId <= 0) or (not Assigned(LBody)) then
        raise EConsultaValidacao.Create('Dados invalidos');

      Service.Atualizar(
        LId,
        LBody.GetValue<Integer>('paciente_id', 0),
        LBody.GetValue<string>('procedimento', 'Consulta'),
        LBody.GetValue<string>('profissional', ''),
        LBody.GetValue<string>('status', '')
      );
      SendId(Res, 'Consulta atualizada com sucesso', 'id', LId, THTTPStatus.OK);
    except
      on E: EConsultaNaoEncontrada do
        Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
      on E: EConsultaValidacao do
        Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422)).Status(THTTPStatus.UnprocessableEntity);
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.Atualizar', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.Finalizar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
  LId: Integer;
  LData: TJSONObject;
begin
  Service := TConsultaService.Create;
  try
    try
      LId := ParamId(Req);
      if LId <= 0 then
        raise EConsultaValidacao.Create('ID invalido');
      Service.Finalizar(LId);
      LData := TJSONObject.Create;
      LData.AddPair('consulta_id', TJSONNumber.Create(LId));
      LData.AddPair('status', 'realizada');
      Res.Send<TJSONObject>(TResponseUtils.Success('Consulta finalizada com sucesso', LData)).Status(THTTPStatus.OK);
    except
      on E: EConsultaNaoEncontrada do
        Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
      on E: EConsultaValidacao do
        Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422)).Status(THTTPStatus.UnprocessableEntity);
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.Finalizar', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.ListarAnamneses(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
begin
  Service := TConsultaService.Create;
  try
    try
      Res.Send<TJSONObject>(TResponseUtils.Success('Anamneses listadas com sucesso', Service.ListarAnamneses(ParamId(Req)))).Status(THTTPStatus.OK);
    except
      on E: EConsultaNaoEncontrada do
        Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.ListarAnamneses', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.ObterAnamnese(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
begin
  Service := TConsultaService.Create;
  try
    try
      Res.Send<TJSONObject>(TResponseUtils.Success('Anamnese encontrada', Service.ObterAnamnesePorId(ParamId(Req)))).Status(THTTPStatus.OK);
    except
      on E: EConsultaNaoEncontrada do
        Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.ObterAnamnese', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.CriarAnamnese(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
  LId: Integer;
begin
  Service := TConsultaService.Create;
  try
    try
      LId := Service.CriarAnamnese(ParamId(Req), Req.Body<TJSONObject>);
      SendId(Res, 'Anamnese criada com sucesso', 'id', LId, THTTPStatus.Created);
    except
      on E: EConsultaNaoEncontrada do
        Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
      on E: EConsultaValidacao do
        Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422)).Status(THTTPStatus.UnprocessableEntity);
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.CriarAnamnese', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.AtualizarAnamnese(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
  LId: Integer;
begin
  Service := TConsultaService.Create;
  try
    try
      LId := ParamId(Req);
      Service.AtualizarAnamnese(LId, Req.Body<TJSONObject>);
      SendId(Res, 'Anamnese atualizada com sucesso', 'id', LId, THTTPStatus.OK);
    except
      on E: EConsultaNaoEncontrada do
        Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
      on E: EConsultaValidacao do
        Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422)).Status(THTTPStatus.UnprocessableEntity);
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.AtualizarAnamnese', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.ExcluirAnamnese(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
begin
  Service := TConsultaService.Create;
  try
    try
      Service.ExcluirAnamnese(ParamId(Req));
      Res.Send<TJSONObject>(TResponseUtils.Success('Anamnese excluida com sucesso')).Status(THTTPStatus.OK);
    except
      on E: EConsultaNaoEncontrada do
        Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.ExcluirAnamnese', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.ImpressaoAnamnese(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
begin
  Service := TConsultaService.Create;
  try
    try
      Res.Send<TJSONObject>(TResponseUtils.Success('Dados de impressao da anamnese', Service.ImpressaoAnamnese(ParamId(Req)))).Status(THTTPStatus.OK);
    except
      on E: EConsultaNaoEncontrada do
        Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.ImpressaoAnamnese', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.ObterAnamneseConsulta(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
  LObj: TJSONObject;
begin
  Service := TConsultaService.Create;
  try
    try
      LObj := Service.ObterAnamnese(ParamId(Req));
      if Assigned(LObj) then
        Res.Send<TJSONObject>(TResponseUtils.Success('Anamnese encontrada', LObj)).Status(THTTPStatus.OK)
      else
        Res.Send<TJSONObject>(TResponseUtils.Success('Sem anamnese cadastrada', TJSONObject.Create)).Status(THTTPStatus.OK);
    except
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.ObterAnamneseConsulta', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.SalvarAnamneseConsulta(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
  LId: Integer;
begin
  Service := TConsultaService.Create;
  try
    try
      LId := ParamId(Req);
      Service.SalvarAnamnese(LId, Req.Body<TJSONObject>);
      SendId(Res, 'Anamnese salva com sucesso', 'consulta_id', LId, THTTPStatus.OK);
    except
      on E: EConsultaNaoEncontrada do
        Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
      on E: EConsultaValidacao do
        Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422)).Status(THTTPStatus.UnprocessableEntity);
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.SalvarAnamneseConsulta', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.ListarPrescricoes(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
begin
  Service := TConsultaService.Create;
  try
    try
      Res.Send<TJSONObject>(TResponseUtils.Success('Prescricoes listadas com sucesso', Service.ListarPrescricoes(ParamId(Req)))).Status(THTTPStatus.OK);
    except
      on E: EConsultaNaoEncontrada do
        Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.ListarPrescricoes', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.ObterPrescricao(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
begin
  Service := TConsultaService.Create;
  try
    try
      Res.Send<TJSONObject>(TResponseUtils.Success('Prescricao encontrada', Service.ObterPrescricaoPorId(ParamId(Req)))).Status(THTTPStatus.OK);
    except
      on E: EConsultaNaoEncontrada do
        Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.ObterPrescricao', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.CriarPrescricao(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
  LId: Integer;
begin
  Service := TConsultaService.Create;
  try
    try
      LId := Service.CriarPrescricao(ParamId(Req), Req.Body<TJSONObject>);
      SendId(Res, 'Prescricao criada com sucesso', 'id', LId, THTTPStatus.Created);
    except
      on E: EConsultaNaoEncontrada do
        Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
      on E: EConsultaValidacao do
        Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422)).Status(THTTPStatus.UnprocessableEntity);
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.CriarPrescricao', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.AtualizarPrescricao(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
  LId: Integer;
begin
  Service := TConsultaService.Create;
  try
    try
      LId := StrToIntDef(Req.Params.Items['prescricao_id'], 0);
      if LId <= 0 then
        LId := ParamId(Req);
      Service.AtualizarPrescricao(LId, Req.Body<TJSONObject>);
      SendId(Res, 'Prescricao atualizada com sucesso', 'id', LId, THTTPStatus.OK);
    except
      on E: EConsultaNaoEncontrada do
        Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
      on E: EConsultaValidacao do
        Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422)).Status(THTTPStatus.UnprocessableEntity);
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.AtualizarPrescricao', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.ExcluirPrescricao(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
  LId: Integer;
begin
  Service := TConsultaService.Create;
  try
    try
      LId := StrToIntDef(Req.Params.Items['prescricao_id'], 0);
      if LId <= 0 then
        LId := ParamId(Req);
      Service.ExcluirPrescricao(LId);
      Res.Send<TJSONObject>(TResponseUtils.Success('Prescricao excluida com sucesso')).Status(THTTPStatus.OK);
    except
      on E: EConsultaNaoEncontrada do
        Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.ExcluirPrescricao', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.ImpressaoPrescricao(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
begin
  Service := TConsultaService.Create;
  try
    try
      Res.Send<TJSONObject>(TResponseUtils.Success('Dados de impressao da prescricao', Service.ImpressaoPrescricao(ParamId(Req)))).Status(THTTPStatus.OK);
    except
      on E: EConsultaNaoEncontrada do
        Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.ImpressaoPrescricao', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.ListarDocumentos(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
begin
  Service := TConsultaService.Create;
  try
    try
      Res.Send<TJSONObject>(TResponseUtils.Success('Documentos listados com sucesso', Service.ListarDocumentos(ParamId(Req)))).Status(THTTPStatus.OK);
    except
      on E: EConsultaNaoEncontrada do
        Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.ListarDocumentos', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TConsultaController.CriarDocumento(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TConsultaService;
  LId: Integer;
begin
  Service := TConsultaService.Create;
  try
    try
      LId := Service.CriarDocumento(ParamId(Req), Req.Body<TJSONObject>);
      SendId(Res, 'Documento criado com sucesso', 'id', LId, THTTPStatus.Created);
    except
      on E: EConsultaNaoEncontrada do
        Res.Send<TJSONObject>(TResponseUtils.NotFound(E.Message)).Status(THTTPStatus.NotFound);
      on E: EConsultaValidacao do
        Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422)).Status(THTTPStatus.UnprocessableEntity);
      on E: Exception do
      begin
        TLogger.Error('ConsultaController.CriarDocumento', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message)).Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

initialization
  Swagger
    .BasePath('v1')
    .Path('consultas')
      .Tag('Consultas')
      .GET('Listar consultas', 'Retorna o historico de consultas')
        .AddResponse(200, 'Consultas listadas com sucesso').&End
      .&End
      .POST('Criar consulta', 'Cria uma consulta de atendimento')
        .AddResponse(201, 'Consulta criada com sucesso').&End
        .AddResponse(422, 'Dados invalidos').&End
      .&End
    .&End
    .Path('consultas/{id}')
      .Tag('Consultas')
      .GET('Obter consulta', 'Retorna detalhe da consulta').AddResponse(200, 'Consulta encontrada').&End.&End
      .PUT('Atualizar consulta', 'Atualiza dados principais da consulta').AddResponse(200, 'Consulta atualizada').&End.&End
    .&End
    .Path('consultas/{id}/finalizar')
      .Tag('Consultas')
      .POST('Finalizar consulta', 'Marca consulta como realizada').AddResponse(200, 'Consulta finalizada').&End.&End
    .&End
    .Path('consultas/{id}/anamneses')
      .Tag('Consultas')
      .GET('Listar anamneses', 'Lista anamneses da consulta').AddResponse(200, 'Anamneses listadas').&End.&End
      .POST('Criar anamnese', 'Cria anamnese vinculada a consulta').AddResponse(201, 'Anamnese criada').&End.&End
    .&End
    .Path('consultas/{id}/prescricoes')
      .Tag('Consultas')
      .GET('Listar prescricoes', 'Lista prescricoes da consulta').AddResponse(200, 'Prescricoes listadas').&End.&End
      .POST('Criar prescricao', 'Cria prescricao vinculada a consulta').AddResponse(201, 'Prescricao criada').&End.&End
    .&End
    .Path('consultas/{id}/documentos')
      .Tag('Consultas')
      .GET('Listar documentos', 'Lista documentos vinculados a consulta').AddResponse(200, 'Documentos listados').&End.&End
      .POST('Criar documento', 'Vincula metadados de documento a consulta').AddResponse(201, 'Documento criado').&End.&End
    .&End
    .Path('anamneses/{id}/impressao')
      .Tag('Consultas')
      .GET('Impressao de anamnese', 'Retorna dados para impressao da anamnese').AddResponse(200, 'Dados de impressao').&End.&End
    .&End
    .Path('prescricoes/{id}/impressao')
      .Tag('Consultas')
      .GET('Impressao de prescricao', 'Retorna dados para impressao da prescricao').AddResponse(200, 'Dados de impressao').&End.&End
    .&End;

end.
