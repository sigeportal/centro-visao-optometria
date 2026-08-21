unit UnitConfiguracaoClinica.Model;

interface

uses
  System.SysUtils,
  UnitPortalORM.Model;

type
  [TNomeTabela('CONFIGURACAO_CLINICA', 'CFG_ID')]
  TModelConfiguracaoClinica = class(TTabela)
  private
    FId: Integer;
    FNome: string;
    FCnpj: string;
    FTelefone: string;
    FEndereco: string;
    FCidade: string;
    FEstado: string;
    FCep: string;
    FAtualizadoPor: Integer;
    FAtualizadoEm: TDateTime;
  public
    [TCampo('CFG_ID', 'INTEGER NOT NULL PRIMARY KEY')]
    property Id: Integer read FId write FId;

    [TCampo('CFG_NOME', 'VARCHAR(150) NOT NULL')]
    property Nome: string read FNome write FNome;

    [TCampo('CFG_CNPJ', 'VARCHAR(18)')]
    property Cnpj: string read FCnpj write FCnpj;

    [TCampo('CFG_TELEFONE', 'VARCHAR(20)')]
    property Telefone: string read FTelefone write FTelefone;

    [TCampo('CFG_ENDERECO', 'VARCHAR(255)')]
    property Endereco: string read FEndereco write FEndereco;

    [TCampo('CFG_CIDADE', 'VARCHAR(100)')]
    property Cidade: string read FCidade write FCidade;

    [TCampo('CFG_ESTADO', 'VARCHAR(2)')]
    property Estado: string read FEstado write FEstado;

    [TCampo('CFG_CEP', 'VARCHAR(10)')]
    property Cep: string read FCep write FCep;

    [TCampo('CFG_ATUALIZADO_POR', 'INTEGER')]
    property AtualizadoPor: Integer read FAtualizadoPor write FAtualizadoPor;

    [TCampo('CFG_ATUALIZADO_EM', 'TIMESTAMP')]
    property AtualizadoEm: TDateTime read FAtualizadoEm write FAtualizadoEm;
  end;

implementation

end.
