unit Auditoria.Service;

interface

uses
  Horse,
  System.SysUtils,
  System.JSON;

type
  TAuditoriaService = class
  public
    class procedure Inicializar;
    class procedure Registrar(Req: THorseRequest; const ATipoOperacao, ARecurso: string;
      const ARecursoId: Integer = 0; const ADetalhes: string = ''); overload;
    class procedure Registrar(const AUsuarioId: Integer; const ALogin, AIp, ACorrelationId,
      ATipoOperacao, ARecurso: string; const ARecursoId: Integer = 0;
      const ADetalhes: string = ''); overload;
  end;

implementation

uses
  UnitDatabase,
  UnitAuditoria.Model,
  UnitFunctions,
  Correlation.Middleware,
  Autorizacao.Middleware,
  Logger.Utils;

{ TAuditoriaService }

class procedure TAuditoriaService.Inicializar;
var
  LModel: TModelAuditoria;
begin
  LModel := TModelAuditoria.Create(TDatabase.Connection);
  try
    LModel.CriaTabela;
  finally
    LModel.Free;
  end;
end;

class procedure TAuditoriaService.Registrar(Req: THorseRequest;
  const ATipoOperacao, ARecurso: string; const ARecursoId: Integer;
  const ADetalhes: string);
var
  LUsuarioId: Integer;
  LLogin: string;
  LIp: string;
  LCorrelationId: string;
  LClaims: TJSONObject;
begin
  LUsuarioId := UsuarioIdAutenticado(Req);
  LLogin := '';
  LClaims := Req.Session<TJSONObject>;
  if Assigned(LClaims) then
    LLogin := LClaims.GetValue<string>('sub', '');

  LIp := Req.RawWebRequest.RemoteAddr;
  LCorrelationId := ObterCorrelationId(Req);

  Registrar(LUsuarioId, LLogin, LIp, LCorrelationId, ATipoOperacao, ARecurso, ARecursoId, ADetalhes);
end;

class procedure TAuditoriaService.Registrar(const AUsuarioId: Integer;
  const ALogin, AIp, ACorrelationId, ATipoOperacao, ARecurso: string;
  const ARecursoId: Integer; const ADetalhes: string);
var
  LModel: TModelAuditoria;
  LIndiceConexao: Integer;
begin
  try
    LIndiceConexao := TDatabase.Connection.Connected;
    try
      LModel := TModelAuditoria.Create(TDatabase.Connection);
      try
        LModel.Codigo := LModel.GeraCodigo('AUD_CODIGO');
        LModel.DataHora := FormatDateTime('yyyy-mm-dd hh:nn:ss', Now);
        LModel.UsuarioId := AUsuarioId;
        LModel.UsuarioLogin := ALogin;
        LModel.IpOrigem := AIp;
        LModel.CorrelationId := ACorrelationId;
        LModel.TipoOperacao := UpperCase(Trim(ATipoOperacao));
        LModel.Recurso := UpperCase(Trim(ARecurso));
        LModel.RecursoId := ARecursoId;
        LModel.Detalhes := Copy(Trim(ADetalhes), 1, 500);
        LModel.SalvaNoBanco(LIndiceConexao);
      finally
        LModel.Free;
      end;
    finally
      TDatabase.Connection.Disconnected(LIndiceConexao);
    end;
  except
    on E: Exception do
      TLogger.Warn('AuditoriaService: Falha ao registrar log de auditoria: ' + E.Message);
  end;
end;

end.
