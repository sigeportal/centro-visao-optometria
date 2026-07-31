unit UnitPaciente.Model;

interface

uses
  UnitPortalORM.Model,
  System.SysUtils;

type
  [TNomeTabela('PACIENTES', 'PAC_ID')]
  TModelPaciente = class(TTabela)
  private
    FId: Integer;
    FNome: string;
    FNomeSocial: string;
    FDataNascimento: TDate;
    FSexo: string;
    FCelular: string;
    FTelefone2: string;
    FEmail: string;
    FOcupacao: string;
    FCpf: string;
    FRg: string;
    FComoConheceu: string;
    FResponsavelNome: string;
    FResponsavelCpf: string;
    FEndereco: string;
    FComplemento: string;
    FCidade: string;
    FEstado: string;
    FCep: string;
    FFoto: string;
    FAtivo: Integer;
    FDataCadastro: TDateTime;
  public
    [TCampo('PAC_ID', 'INTEGER NOT NULL PRIMARY KEY')]
    property Id: Integer read FId write FId;

    [TCampo('PAC_NOME', 'VARCHAR(150)')]
    property Nome: string read FNome write FNome;

    [TCampo('PAC_NOME_SOCIAL', 'VARCHAR(100)')]
    property NomeSocial: string read FNomeSocial write FNomeSocial;

    [TCampo('PAC_DATA_NASCIMENTO', 'DATE')]
    property DataNascimento: TDate read FDataNascimento write FDataNascimento;

    [TCampo('PAC_SEXO', 'VARCHAR(20)')]
    property Sexo: string read FSexo write FSexo;

    [TCampo('PAC_CELULAR', 'VARCHAR(20)')]
    property Celular: string read FCelular write FCelular;

    [TCampo('PAC_TELEFONE2', 'VARCHAR(20)')]
    property Telefone2: string read FTelefone2 write FTelefone2;

    [TCampo('PAC_EMAIL', 'VARCHAR(150)')]
    property Email: string read FEmail write FEmail;

    [TCampo('PAC_OCUPACAO', 'VARCHAR(100)')]
    property Ocupacao: string read FOcupacao write FOcupacao;

    [TCampo('PAC_CPF', 'VARCHAR(14)')]
    property Cpf: string read FCpf write FCpf;

    [TCampo('PAC_RG', 'VARCHAR(20)')]
    property Rg: string read FRg write FRg;

    [TCampo('PAC_COMO_CONHECEU', 'VARCHAR(100)')]
    property ComoConheceu: string read FComoConheceu write FComoConheceu;

    [TCampo('PAC_RESPONSAVEL_NOME', 'VARCHAR(150)')]
    property ResponsavelNome: string read FResponsavelNome write FResponsavelNome;

    [TCampo('PAC_RESPONSAVEL_CPF', 'VARCHAR(14)')]
    property ResponsavelCpf: string read FResponsavelCpf write FResponsavelCpf;

    [TCampo('PAC_ENDERECO', 'VARCHAR(255)')]
    property Endereco: string read FEndereco write FEndereco;

    [TCampo('PAC_COMPLEMENTO', 'VARCHAR(120)')]
    property Complemento: string read FComplemento write FComplemento;

    [TCampo('PAC_CIDADE', 'VARCHAR(100)')]
    property Cidade: string read FCidade write FCidade;

    [TCampo('PAC_ESTADO', 'VARCHAR(2)')]
    property Estado: string read FEstado write FEstado;

    [TCampo('PAC_CEP', 'VARCHAR(10)')]
    property Cep: string read FCep write FCep;

    [TCampo('PAC_FOTO', 'VARCHAR(500)')]
    property Foto: string read FFoto write FFoto;

    [TCampo('PAC_ATIVO', 'SMALLINT')]
    property Ativo: Integer read FAtivo write FAtivo;

    [TCampo('PAC_DATA_CADASTRO', 'TIMESTAMP')]
    property DataCadastro: TDateTime read FDataCadastro write FDataCadastro;
  end;

implementation

end.
