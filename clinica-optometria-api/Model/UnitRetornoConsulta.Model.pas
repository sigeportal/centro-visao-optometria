unit UnitRetornoConsulta.Model;

interface

uses
  UnitPortalORM.Model,
  System.SysUtils;

type
  [TNomeTabela('RETORNOS_CONSULTA', 'RET_ID')]
  TModelRetornoConsulta = class(TTabela)
  private
    FId: Integer;
    FConsultaId: Integer;
    FSituacao: string;
    FTipo: string;
    FDataRetorno: TDateTime;
    FMotivo: string;
    FObservacao: string;
    FCriadoPor: Integer;
    FCriadoEm: TDateTime;
    FAtualizadoPor: Integer;
    FAtualizadoEm: TDateTime;
  public
    [TCampo('RET_ID', 'INTEGER NOT NULL PRIMARY KEY')]
    property Id: Integer read FId write FId;

    [TCampo('RET_CONSULTA_ID', 'INTEGER NOT NULL UNIQUE')]
    property ConsultaId: Integer read FConsultaId write FConsultaId;

    [TCampo('RET_SITUACAO', 'VARCHAR(30) DEFAULT ''retorno_programado'' NOT NULL')]
    property Situacao: string read FSituacao write FSituacao;

    [TCampo('RET_TIPO', 'VARCHAR(30) NOT NULL')]
    property Tipo: string read FTipo write FTipo;

    [TCampo('RET_DATA', 'DATE')]
    property DataRetorno: TDateTime read FDataRetorno write FDataRetorno;

    [TCampo('RET_MOTIVO', 'VARCHAR(255)')]
    property Motivo: string read FMotivo write FMotivo;

    [TCampo('RET_OBSERVACAO', 'BLOB SUB_TYPE TEXT')]
    property Observacao: string read FObservacao write FObservacao;

    [TCampo('RET_CRIADO_POR', 'INTEGER')]
    property CriadoPor: Integer read FCriadoPor write FCriadoPor;

    [TCampo('RET_CRIADO_EM', 'TIMESTAMP')]
    property CriadoEm: TDateTime read FCriadoEm write FCriadoEm;

    [TCampo('RET_ATUALIZADO_POR', 'INTEGER')]
    property AtualizadoPor: Integer read FAtualizadoPor write FAtualizadoPor;

    [TCampo('RET_ATUALIZADO_EM', 'TIMESTAMP')]
    property AtualizadoEm: TDateTime read FAtualizadoEm write FAtualizadoEm;
  end;

implementation

end.
