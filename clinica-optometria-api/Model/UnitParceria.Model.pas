unit UnitParceria.Model;

interface

uses
  UnitPortalORM.Model;

type
  [TNomeTabela('PARCERIAS', 'PAR_ID')]
  TModelParceria = class(TTabela)
  private
    FId: Integer;
    FNome: string;
    FCnpj: string;
    FTelefone: string;
    FEmail: string;
    FResponsavel: string;
    FEndereco: string;
    FCidade: string;
    FUf: string;
    FAtivo: SmallInt;
  public
    [TCampo('PAR_ID', 'INTEGER NOT NULL PRIMARY KEY')]
    property Id: Integer read FId write FId;
    [TCampo('PAR_NOME', 'VARCHAR(150) NOT NULL')]
    property Nome: string read FNome write FNome;
    [TCampo('PAR_CNPJ', 'VARCHAR(14)')]
    property Cnpj: string read FCnpj write FCnpj;
    [TCampo('PAR_TELEFONE', 'VARCHAR(20)')]
    property Telefone: string read FTelefone write FTelefone;
    [TCampo('PAR_EMAIL', 'VARCHAR(150)')]
    property Email: string read FEmail write FEmail;
    [TCampo('PAR_RESPONSAVEL', 'VARCHAR(120)')]
    property Responsavel: string read FResponsavel write FResponsavel;
    [TCampo('PAR_ENDERECO', 'VARCHAR(200)')]
    property Endereco: string read FEndereco write FEndereco;
    [TCampo('PAR_CIDADE', 'VARCHAR(100)')]
    property Cidade: string read FCidade write FCidade;
    [TCampo('PAR_UF', 'VARCHAR(2)')]
    property Uf: string read FUf write FUf;
    [TCampo('PAR_ATIVO', 'SMALLINT DEFAULT 1 NOT NULL')]
    property Ativo: SmallInt read FAtivo write FAtivo;
  end;

implementation

end.
