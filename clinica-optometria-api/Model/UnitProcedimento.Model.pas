unit UnitProcedimento.Model;

interface

uses
  UnitPortalORM.Model;

type
  [TNomeTabela('PROCEDIMENTOS', 'PRO_ID')]
  TModelProcedimento = class(TTabela)
  private
    FId: Integer;
    FNome: string;
    FDuracaoMinutos: Integer;
    FValor: Double;
    FAtivo: SmallInt;
  public
    [TCampo('PRO_ID', 'INTEGER NOT NULL PRIMARY KEY')]
    property Id: Integer read FId write FId;
    [TCampo('PRO_NOME', 'VARCHAR(120) NOT NULL')]
    property Nome: string read FNome write FNome;
    [TCampo('PRO_DURACAO_MINUTOS', 'INTEGER NOT NULL')]
    property DuracaoMinutos: Integer read FDuracaoMinutos write FDuracaoMinutos;
    [TCampo('PRO_VALOR', 'NUMERIC(15,2) NOT NULL')]
    property Valor: Double read FValor write FValor;
    [TCampo('PRO_ATIVO', 'SMALLINT DEFAULT 1 NOT NULL')]
    property Ativo: SmallInt read FAtivo write FAtivo;
  end;

implementation

end.
