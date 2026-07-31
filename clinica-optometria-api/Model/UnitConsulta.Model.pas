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
  end;

implementation

end.
