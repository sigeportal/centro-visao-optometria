unit UnitPermissoes.Model;

interface

uses
  UnitPortalORM.Model;

type
  [TNomeTabela('PERMISSOES', 'PER_CODIGO')]
  TPermissoes = class(TTabela)
  private
    FCodigo: Integer;
    FDescricao: string;
  public
    [TCampo('PER_CODIGO', 'INTEGER NOT NULL PRIMARY KEY')]
    property Codigo: Integer read FCodigo write FCodigo;

    [TCampo('PER_DESCRICAO', 'VARCHAR(100)')]
    property Descricao: string read FDescricao write FDescricao;
  end;

implementation

end.
