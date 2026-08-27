unit UnitUsuarios.Model;

interface

uses
  UnitPortalORM.Model;

type
  [TNomeTabela('USUARIOS', 'USU_CODIGO')]
  TUsuarios = class(TTabela)
  private
    FCodigo: Integer;
    FLogin: string;
    FSenha: string;
    FFuncionario: Integer;
    FAtivo: Integer;
  public
    [TCampo('USU_CODIGO', 'INTEGER NOT NULL PRIMARY KEY')]
    property Codigo: Integer read FCodigo write FCodigo;

    [TCampo('USU_LOGIN', 'VARCHAR(50) NOT NULL')]
    property Login: string read FLogin write FLogin;

    [TCampo('USU_SENHA', 'VARCHAR(255)')]
    property Senha: string read FSenha write FSenha;

    [TCampo('USU_FUN', 'INTEGER')]
    property Funcionario: Integer read FFuncionario write FFuncionario;

    [TCampo('USU_ATIVO', 'SMALLINT DEFAULT 1')]
    property Ativo: Integer read FAtivo write FAtivo;
  end;

implementation

end.
