unit UnitUsuarioPerfil.Model;

interface

uses
  UnitPortalORM.Model;

type
  [TNomeTabela('USUARIO_PERFIL', 'UPR_USUARIO_ID')]
  TModelUsuarioPerfil = class(TTabela)
  private
    FUsuarioId: Integer;
    FPerfil: string;
    FAtivo: Integer;
  public
    [TCampo('UPR_USUARIO_ID', 'INTEGER NOT NULL PRIMARY KEY')]
    property UsuarioId: Integer read FUsuarioId write FUsuarioId;

    [TCampo('UPR_PERFIL', 'VARCHAR(20) NOT NULL')]
    property Perfil: string read FPerfil write FPerfil;

    [TCampo('UPR_ATIVO', 'SMALLINT DEFAULT 1')]
    property Ativo: Integer read FAtivo write FAtivo;
  end;

implementation

end.
