unit UnitAuditoria.Model;

interface

uses
  UnitPortalORM.Model;

type
  [TNomeTabela('AUDITORIA_LOGS', 'AUD_CODIGO')]
  TModelAuditoria = class(TTabela)
  private
    FCodigo: Integer;
    FDataHora: string;
    FUsuarioId: Integer;
    FUsuarioLogin: string;
    FIpOrigem: string;
    FCorrelationId: string;
    FTipoOperacao: string;
    FRecurso: string;
    FRecursoId: Integer;
    FDetalhes: string;
  public
    [TCampo('AUD_CODIGO', 'INTEGER NOT NULL PRIMARY KEY')]
    property Codigo: Integer read FCodigo write FCodigo;

    [TCampo('AUD_DATAHORA', 'VARCHAR(30) NOT NULL')]
    property DataHora: string read FDataHora write FDataHora;

    [TCampo('AUD_USUARIO_ID', 'INTEGER')]
    property UsuarioId: Integer read FUsuarioId write FUsuarioId;

    [TCampo('AUD_USUARIO_LOGIN', 'VARCHAR(50)')]
    property UsuarioLogin: string read FUsuarioLogin write FUsuarioLogin;

    [TCampo('AUD_IP_ORIGEM', 'VARCHAR(50)')]
    property IpOrigem: string read FIpOrigem write FIpOrigem;

    [TCampo('AUD_CORRELATION_ID', 'VARCHAR(50)')]
    property CorrelationId: string read FCorrelationId write FCorrelationId;

    [TCampo('AUD_TIPO_OPERACAO', 'VARCHAR(20) NOT NULL')]
    property TipoOperacao: string read FTipoOperacao write FTipoOperacao;

    [TCampo('AUD_RECURSO', 'VARCHAR(50) NOT NULL')]
    property Recurso: string read FRecurso write FRecurso;

    [TCampo('AUD_RECURSO_ID', 'INTEGER')]
    property RecursoId: Integer read FRecursoId write FRecursoId;

    [TCampo('AUD_DETALHES', 'VARCHAR(500)')]
    property Detalhes: string read FDetalhes write FDetalhes;
  end;

implementation

end.
