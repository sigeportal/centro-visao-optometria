unit UnitFichaClinicaDados.Model;

interface

uses
  System.SysUtils,
  UnitPortalORM.Model;

type
  [TNomeTabela('FICHA_CLINICA_DADOS', 'FCD_ID')]
  TModelFichaClinicaDados = class(TTabela)
  private
    FId: Integer;
    FConsultaId: Integer;
    FSecao: string;
    FVersao: Integer;
    FConteudo: string;
    FCriadoPor: Integer;
    FCriadoEm: TDateTime;
    FAtualizadoPor: Integer;
    FAtualizadoEm: TDateTime;
  public
    [TCampo('FCD_ID', 'INTEGER NOT NULL PRIMARY KEY')]
    property Id: Integer read FId write FId;

    [TCampo('FCD_CONSULTA_ID', 'INTEGER NOT NULL')]
    property ConsultaId: Integer read FConsultaId write FConsultaId;

    [TCampo('FCD_SECAO', 'VARCHAR(80) NOT NULL')]
    property Secao: string read FSecao write FSecao;

    [TCampo('FCD_VERSAO', 'INTEGER DEFAULT 1 NOT NULL')]
    property Versao: Integer read FVersao write FVersao;

    [TCampo('FCD_CONTEUDO', 'BLOB SUB_TYPE 1')]
    property Conteudo: string read FConteudo write FConteudo;

    [TCampo('FCD_CRIADO_POR', 'INTEGER')]
    property CriadoPor: Integer read FCriadoPor write FCriadoPor;

    [TCampo('FCD_CRIADO_EM', 'TIMESTAMP')]
    property CriadoEm: TDateTime read FCriadoEm write FCriadoEm;

    [TCampo('FCD_ATUALIZADO_POR', 'INTEGER')]
    property AtualizadoPor: Integer read FAtualizadoPor write FAtualizadoPor;

    [TCampo('FCD_ATUALIZADO_EM', 'TIMESTAMP')]
    property AtualizadoEm: TDateTime read FAtualizadoEm write FAtualizadoEm;
  end;

implementation

end.
