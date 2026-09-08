unit Auth.Service;

interface

uses
  System.JSON,
  System.SysUtils;

type
  TAuthService = class
  public
    class function Autenticar(const ALogin, ASenha: string): TJSONObject;
  end;

implementation

uses
  System.Hash,
  UnitConnection.Model.Interfaces,
  UnitDatabase,
  JWT.Utils,
  Security.Password,
  Logger.Utils,
  Autorizacao.Service;

{ TAuthService }

class function TAuthService.Autenticar(const ALogin, ASenha: string): TJSONObject;
var
  LQuery: iQuery;
  LUpdateQuery: iQuery;
  LSenhaGravada: string;
  LPrecisaRehash: Boolean;
  LNovoHash: string;
  LUserId: Integer;
  LToken: string;
  LAtivo: Integer;
  LUserData: TJSONObject;
begin
  Result := nil;

  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT FIRST 1 USU_CODIGO, USU_LOGIN, USU_SENHA, USU_ATIVO ');
  LQuery.Add('FROM USUARIOS ');
  LQuery.Add('WHERE UPPER(USU_LOGIN) = UPPER(:LOGIN)');
  LQuery.AddParam('LOGIN', Trim(ALogin));
  LQuery.Open;

  if LQuery.DataSet.IsEmpty then
    Exit;

  LAtivo := LQuery.DataSet.FieldByName('USU_ATIVO').AsInteger;
  if LAtivo = 0 then
    Exit;

  LSenhaGravada := Trim(LQuery.DataSet.FieldByName('USU_SENHA').AsString);
  if not TSecurityPassword.VerificarSenha(ASenha, LSenhaGravada, LPrecisaRehash) then
    Exit;

  LUserId := LQuery.DataSet.FieldByName('USU_CODIGO').AsInteger;

  if LPrecisaRehash then
  begin
    try
      LNovoHash := TSecurityPassword.HashSenha(ASenha);
      LUpdateQuery := TDatabase.Query;
      LUpdateQuery.Clear;
      LUpdateQuery.Add('UPDATE USUARIOS SET USU_SENHA = :SENHA WHERE USU_CODIGO = :ID');
      LUpdateQuery.AddParam('SENHA', LNovoHash);
      LUpdateQuery.AddParam('ID', LUserId);
      LUpdateQuery.ExecSQL;
      TLogger.Info(Format('Auth.Service: Senha do usuario %s migrada com sucesso para hash PBKDF2',
        [LQuery.DataSet.FieldByName('USU_LOGIN').AsString]));
    except
      on E: Exception do
        TLogger.Warn(Format('Auth.Service: Falha ao migrar hash do usuario %s: %s',
          [LQuery.DataSet.FieldByName('USU_LOGIN').AsString, E.Message]));
    end;
  end;

  LToken := TJWTUtils.GenerateToken(LUserId, LQuery.DataSet.FieldByName('USU_LOGIN').AsString);

  Result := TJSONObject.Create;
  Result.AddPair('token', LToken);

  try
    LUserData := TAutorizacaoService.SessaoUsuario(LUserId);
    if Assigned(LUserData) then
      Result.AddPair('user', LUserData);
  except
    // Mantem apenas o token se falhar ao obter sessao completa
  end;
end;

end.
