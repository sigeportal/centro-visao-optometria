unit UnitFichaSecao.Model;

interface

uses
  UnitPortalORM.Model;

type
  [TNomeTabela('FICHA_SECAO', 'FSC_ID')]
  TModelFichaSecao = class(TTabela)
  private
    FId: Integer;
    FChave: string;
    FNome: string;
    FAtivo: Integer;
    FOrdem: Integer;
    FExibeImpressao: Integer;
    FExibeTela: Integer;
  public
    [TCampo('FSC_ID', 'INTEGER NOT NULL PRIMARY KEY')]
    property Id: Integer read FId write FId;

    [TCampo('FSC_CHAVE', 'VARCHAR(80) NOT NULL UNIQUE')]
    property Chave: string read FChave write FChave;

    [TCampo('FSC_NOME', 'VARCHAR(120) NOT NULL')]
    property Nome: string read FNome write FNome;

    [TCampo('FSC_ATIVO', 'SMALLINT DEFAULT 1')]
    property Ativo: Integer read FAtivo write FAtivo;

    [TCampo('FSC_ORDEM', 'INTEGER NOT NULL')]
    property Ordem: Integer read FOrdem write FOrdem;

    [TCampo('FSC_EXIBE_IMPRESSAO', 'SMALLINT DEFAULT 1')]
    property ExibeImpressao: Integer read FExibeImpressao write FExibeImpressao;

    [TCampo('FSC_EXIBE_TELA', 'SMALLINT DEFAULT 1')]
    property ExibeTela: Integer read FExibeTela write FExibeTela;
  end;

implementation

end.
