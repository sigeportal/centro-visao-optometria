unit FichaClinica.Controller;

interface

uses
  Horse;

type
  TFichaClinicaController = class
  public
    class procedure Registrar;
    class procedure ListarSecoes(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure AtualizarOrdem(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure AtualizarAtivo(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure AtualizarExibicao(Req: THorseRequest; Res: THorseResponse; Next: TProc);
    class procedure SalvarConfiguracaoCompleta(Req: THorseRequest; Res: THorseResponse; Next: TProc);
  end;

  TFichaSecaoResponse = class
  private
    Fid: Integer;
    Fchave: string;
    Fnome: string;
    Fativo: Integer;
    Fordem: Integer;
    Fexibe_tela: Integer;
    Fexibe_impressao: Integer;
    Fobrigatoria: Integer;
  published
    property id: Integer read Fid write Fid;
    property chave: string read Fchave write Fchave;
    property nome: string read Fnome write Fnome;
    property ativo: Integer read Fativo write Fativo;
    property ordem: Integer read Fordem write Fordem;
    property exibe_tela: Integer read Fexibe_tela write Fexibe_tela;
    property exibe_impressao: Integer read Fexibe_impressao write Fexibe_impressao;
    property obrigatoria: Integer read Fobrigatoria write Fobrigatoria;
  end;

  TFichaSecaoAtivoRequest = class
  private
    Fativo: Boolean;
  published
    property ativo: Boolean read Fativo write Fativo;
  end;

  TFichaSecaoExibicaoRequest = class
  private
    Fexibe_tela: Boolean;
    Fexibe_impressao: Boolean;
  published
    property exibe_tela: Boolean read Fexibe_tela write Fexibe_tela;
    property exibe_impressao: Boolean read Fexibe_impressao write Fexibe_impressao;
  end;

implementation

uses
  System.SysUtils,
  System.JSON,
  Horse.Commons,
  Horse.GBSwagger,
  Autorizacao.Middleware,
  Autorizacao.Service,
  FichaClinica.Service,
  Response.Utils,
  Logger.Utils;

class procedure TFichaClinicaController.Registrar;
begin
  THorse.Group.Prefix('/v1/ficha-clinica').Get('/secoes', AutorizarRota(PERM_CLINICO_CONSULTAR, ListarSecoes));
  THorse.Group.Prefix('/v1/ficha-clinica').Put('/secoes', AutorizarRota(PERM_FICHA_CONFIGURAR, SalvarConfiguracaoCompleta));
  THorse.Group.Prefix('/v1/ficha-clinica').Put('/secoes/ordem', AutorizarRota(PERM_FICHA_CONFIGURAR, AtualizarOrdem));
  THorse.Group.Prefix('/v1/ficha-clinica').Patch('/secoes/:id/ativo', AutorizarRota(PERM_FICHA_CONFIGURAR, AtualizarAtivo));
  THorse.Group.Prefix('/v1/ficha-clinica').Patch('/secoes/:id/exibicao', AutorizarRota(PERM_FICHA_CONFIGURAR, AtualizarExibicao));
end;

class procedure TFichaClinicaController.ListarSecoes(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TFichaClinicaService;
begin
  Service := TFichaClinicaService.Create;
  try
    try
      Res.Send<TJSONObject>(
        TResponseUtils.Success('Secoes listadas com sucesso', Service.ListarSecoes)
      ).Status(THTTPStatus.OK);
    except
      on E: Exception do
      begin
        TLogger.Error('FichaClinicaController.ListarSecoes', E);
        Res.Send<TJSONObject>(TResponseUtils.InternalError(E.Message))
          .Status(THTTPStatus.InternalServerError);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TFichaClinicaController.AtualizarOrdem(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TFichaClinicaService;
  LBody: TJSONObject;
  LSecoesValue: TJSONValue;
begin
  Service := TFichaClinicaService.Create;
  try
    try
      LBody := Req.Body<TJSONObject>;
      if not Assigned(LBody) then
      begin
        Res.Send<TJSONObject>(TResponseUtils.Error('Payload invalido', 422))
          .Status(THTTPStatus.UnprocessableEntity);
        Exit;
      end;

      LSecoesValue := LBody.GetValue('secoes');
      if not (LSecoesValue is TJSONArray) then
      begin
        Res.Send<TJSONObject>(TResponseUtils.Error('Informe a lista de secoes', 422))
          .Status(THTTPStatus.UnprocessableEntity);
        Exit;
      end;

      Service.AtualizarOrdem(LSecoesValue as TJSONArray);
      Res.Send<TJSONObject>(
        TResponseUtils.Success('Ordem da ficha clinica atualizada', Service.ListarSecoes)
      ).Status(THTTPStatus.OK);
    except
      on E: Exception do
      begin
        TLogger.Error('FichaClinicaController.AtualizarOrdem', E);
        Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422))
          .Status(THTTPStatus.UnprocessableEntity);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TFichaClinicaController.AtualizarAtivo(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TFichaClinicaService;
  LBody: TJSONObject;
  LId: Integer;
  LAtivoValue: TJSONValue;
begin
  Service := TFichaClinicaService.Create;
  try
    try
      LId := StrToIntDef(Req.Params.Items['id'], 0);
      LBody := Req.Body<TJSONObject>;
      if (LId <= 0) or (not Assigned(LBody)) then
      begin
        Res.Send<TJSONObject>(TResponseUtils.Error('Dados invalidos', 422))
          .Status(THTTPStatus.UnprocessableEntity);
        Exit;
      end;

      LAtivoValue := LBody.GetValue('ativo');
      if (not Assigned(LAtivoValue)) or
        ((not SameText(LAtivoValue.Value, 'true')) and (not SameText(LAtivoValue.Value, 'false'))) then
      begin
        Res.Send<TJSONObject>(TResponseUtils.Error('Campo ativo e obrigatorio', 422))
          .Status(THTTPStatus.UnprocessableEntity);
        Exit;
      end;

      Service.AtualizarAtivo(LId, SameText(LAtivoValue.Value, 'true'));
      Res.Send<TJSONObject>(
        TResponseUtils.Success('Secao atualizada com sucesso', Service.ListarSecoes)
      ).Status(THTTPStatus.OK);
    except
      on E: Exception do
      begin
        TLogger.Error('FichaClinicaController.AtualizarAtivo', E);
        Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422))
          .Status(THTTPStatus.UnprocessableEntity);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TFichaClinicaController.AtualizarExibicao(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TFichaClinicaService;
  LBody: TJSONObject;
  LId: Integer;
  LExibeTela: Integer;
  LExibeImpressao: Integer;
  LValue: TJSONValue;
begin
  Service := TFichaClinicaService.Create;
  try
    try
      LId := StrToIntDef(Req.Params.Items['id'], 0);
      LBody := Req.Body<TJSONObject>;
      if (LId <= 0) or (not Assigned(LBody)) then
      begin
        Res.Send<TJSONObject>(TResponseUtils.Error('Dados invalidos', 422))
          .Status(THTTPStatus.UnprocessableEntity);
        Exit;
      end;

      LExibeTela := -1;
      LExibeImpressao := -1;
      LValue := LBody.GetValue('exibe_tela');
      if Assigned(LValue) then
        if SameText(LValue.Value, 'true') then
          LExibeTela := 1
        else if SameText(LValue.Value, 'false') then
          LExibeTela := 0;

      LValue := LBody.GetValue('exibe_impressao');
      if Assigned(LValue) then
        if SameText(LValue.Value, 'true') then
          LExibeImpressao := 1
        else if SameText(LValue.Value, 'false') then
          LExibeImpressao := 0;

      if (LExibeTela < 0) and (LExibeImpressao < 0) then
      begin
        Res.Send<TJSONObject>(TResponseUtils.Error('Informe exibe_tela ou exibe_impressao', 422))
          .Status(THTTPStatus.UnprocessableEntity);
        Exit;
      end;

      Service.AtualizarExibicao(LId, LExibeTela, LExibeImpressao);
      Res.Send<TJSONObject>(
        TResponseUtils.Success('Exibicao da secao atualizada com sucesso', Service.ListarSecoes)
      ).Status(THTTPStatus.OK);
    except
      on E: Exception do
      begin
        TLogger.Error('FichaClinicaController.AtualizarExibicao', E);
        Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422))
          .Status(THTTPStatus.UnprocessableEntity);
      end;
    end;
  finally
    Service.Free;
  end;
end;

class procedure TFichaClinicaController.SalvarConfiguracaoCompleta(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  Service: TFichaClinicaService;
  LBody: TJSONObject;
  LSecoesValue: TJSONValue;
  LArraySecoes: TJSONArray;
begin
  Service := TFichaClinicaService.Create;
  try
    try
      LArraySecoes := nil;
      LBody := Req.Body<TJSONObject>;
      if Assigned(LBody) then
      begin
        LSecoesValue := LBody.GetValue('secoes');
        if LSecoesValue is TJSONArray then
          LArraySecoes := LSecoesValue as TJSONArray;
      end;

      if not Assigned(LArraySecoes) then
      begin
        LArraySecoes := Req.Body<TJSONArray>;
      end;

      if (not Assigned(LArraySecoes)) or (LArraySecoes.Count = 0) then
      begin
        Res.Send<TJSONObject>(TResponseUtils.Error('Informe a lista de secoes a configurar', 422))
          .Status(THTTPStatus.UnprocessableEntity);
        Exit;
      end;

      Service.SalvarConfiguracaoCompleta(LArraySecoes);
      Res.Send<TJSONObject>(
        TResponseUtils.Success('Configuracao da ficha clinica salva com sucesso', Service.ListarSecoes)
      ).Status(THTTPStatus.OK);
    except
      on E: Exception do
      begin
        TLogger.Error('FichaClinicaController.SalvarConfiguracaoCompleta', E);
        Res.Send<TJSONObject>(TResponseUtils.Error(E.Message, 422))
          .Status(THTTPStatus.UnprocessableEntity);
      end;
    end;
  finally
    Service.Free;
  end;
end;

initialization
  Swagger
    .BasePath('v1')
    .Path('ficha-clinica/secoes')
      .Tag('Ficha Clinica')
      .GET('Listar secoes da ficha clinica', 'Retorna a configuracao de secoes exibidas na ficha clinica da aplicacao')
        .AddResponse(200, 'Secoes listadas com sucesso')
          .Schema(TFichaSecaoResponse)
          .IsArray(True)
        .&End
        .AddResponse(500, 'Erro interno ao listar secoes').&End
      .&End
      .PUT('Salvar configuracao completa das secoes', 'Persiste a lista completa de secoes com suas configuracoes de ordem, ativo, exibe_tela e exibe_impressao')
        .AddResponse(200, 'Configuracao salva com sucesso')
          .Schema(TFichaSecaoResponse)
          .IsArray(True)
        .&End
        .AddResponse(422, 'Dados invalidos').&End
      .&End
    .&End
    .Path('ficha-clinica/secoes/ordem')
      .Tag('Ficha Clinica')
      .PUT('Atualizar ordem das secoes', 'Persiste a ordem de exibicao das secoes da ficha clinica')
        .AddResponse(200, 'Ordem atualizada com sucesso')
          .Schema(TFichaSecaoResponse)
          .IsArray(True)
        .&End
        .AddResponse(422, 'Dados invalidos para ordenacao').&End
      .&End
    .&End
    .Path('ficha-clinica/secoes/{id}/ativo')
      .Tag('Ficha Clinica')
      .PATCH('Ativar ou desativar secao', 'Atualiza o status ativo da secao da ficha clinica')
        .AddParamPath('id', 'Identificador numerico da secao')
          .Required(True)
        .&End
        .AddParamBody('Ativo', 'Status ativo da secao')
          .Required(True)
          .Schema(TFichaSecaoAtivoRequest)
        .&End
        .AddResponse(200, 'Secao atualizada com sucesso')
          .Schema(TFichaSecaoResponse)
          .IsArray(True)
        .&End
        .AddResponse(422, 'Dados invalidos').&End
      .&End
    .&End
    .Path('ficha-clinica/secoes/{id}/exibicao')
      .Tag('Ficha Clinica')
      .PATCH('Atualizar exibicao da secao', 'Atualiza exibicao em tela e impressao da secao da ficha clinica')
        .AddParamPath('id', 'Identificador numerico da secao')
          .Required(True)
        .&End
        .AddParamBody('Exibicao', 'Configuracao de exibicao da secao')
          .Required(True)
          .Schema(TFichaSecaoExibicaoRequest)
        .&End
        .AddResponse(200, 'Exibicao atualizada com sucesso')
          .Schema(TFichaSecaoResponse)
          .IsArray(True)
        .&End
        .AddResponse(422, 'Dados invalidos').&End
      .&End
    .&End;

end.
