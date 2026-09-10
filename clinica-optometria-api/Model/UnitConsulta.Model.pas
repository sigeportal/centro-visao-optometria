unit UnitConsulta.Model;

interface

uses
  UnitPortalORM.Model,
  System.SysUtils;

type
  [TNomeTabela('CONSULTAS', 'CON_ID')]
  TModelConsulta = class(TTabela)
  private
    FId: Integer;
    FPacienteId: Integer;
    FAgendamentoId: Integer;
    FProfissional: string;
    FProcedimento: string;
    FStatus: string;
    FData: TDateTime;
    FFinalizadaEm: TDateTime;
    FOrigem: string;
    FCriadoEm: TDateTime;
    FCriadoPor: Integer;
    FObservacoes: string;
  public
    [TCampo('CON_ID', 'INTEGER NOT NULL PRIMARY KEY')]
    property Id: Integer read FId write FId;

    [TCampo('CON_PACIENTE_ID', 'INTEGER')]
    property PacienteId: Integer read FPacienteId write FPacienteId;

    [TCampo('CON_AGENDAMENTO_ID', 'INTEGER')]
    property AgendamentoId: Integer read FAgendamentoId write FAgendamentoId;

    [TCampo('CON_PROFISSIONAL', 'VARCHAR(120)')]
    property Profissional: string read FProfissional write FProfissional;

    [TCampo('CON_PROCEDIMENTO', 'VARCHAR(120)')]
    property Procedimento: string read FProcedimento write FProcedimento;

    [TCampo('CON_STATUS', 'VARCHAR(30)')]
    property Status: string read FStatus write FStatus;

    [TCampo('CON_DATA', 'TIMESTAMP')]
    property Data: TDateTime read FData write FData;

    [TCampo('CON_FINALIZADA_EM', 'TIMESTAMP')]
    property FinalizadaEm: TDateTime read FFinalizadaEm write FFinalizadaEm;

    [TCampo('CON_ORIGEM', 'VARCHAR(30)')]
    property Origem: string read FOrigem write FOrigem;

    [TCampo('CON_CRIADO_EM', 'TIMESTAMP')]
    property CriadoEm: TDateTime read FCriadoEm write FCriadoEm;

    [TCampo('CON_CRIADO_POR', 'INTEGER')]
    property CriadoPor: Integer read FCriadoPor write FCriadoPor;

    [TCampo('CON_OBSERVACOES', 'VARCHAR(500)')]
    property Observacoes: string read FObservacoes write FObservacoes;
  end;

implementation

end.
