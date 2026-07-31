unit UnitAgendamento.Model;

interface

uses
  UnitPortalORM.Model,
  System.SysUtils;

type
  [TNomeTabela('AGENDAMENTOS', 'AGD_ID')]
  TModelAgendamento = class(TTabela)
  private
    FId: Integer;
    FPacienteId: Integer;
    FProfissionalId: Integer;
    FProfissional: string;
    FProcedimentoId: Integer;
    FProcedimento: string;
    FInicio: TDateTime;
    FFim: TDateTime;
    FStatus: string;
    FPrioridade: string;
    FParceriaId: Integer;
    FObservacao: string;
    FCriadoEm: TDateTime;
    FCriadoPor: Integer;
  public
    [TCampo('AGD_ID', 'INTEGER NOT NULL PRIMARY KEY')]
    property Id: Integer read FId write FId;

    [TCampo('AGD_PACIENTE_ID', 'INTEGER')]
    property PacienteId: Integer read FPacienteId write FPacienteId;

    [TCampo('AGD_PROFISSIONAL_ID', 'INTEGER')]
    property ProfissionalId: Integer read FProfissionalId write FProfissionalId;

    [TCampo('AGD_PROFISSIONAL', 'VARCHAR(120)')]
    property Profissional: string read FProfissional write FProfissional;

    [TCampo('AGD_PROCEDIMENTO_ID', 'INTEGER')]
    property ProcedimentoId: Integer read FProcedimentoId write FProcedimentoId;

    [TCampo('AGD_PROCEDIMENTO', 'VARCHAR(120)')]
    property Procedimento: string read FProcedimento write FProcedimento;

    [TCampo('AGD_INICIO', 'TIMESTAMP')]
    property Inicio: TDateTime read FInicio write FInicio;

    [TCampo('AGD_FIM', 'TIMESTAMP')]
    property Fim: TDateTime read FFim write FFim;

    [TCampo('AGD_STATUS', 'VARCHAR(30)')]
    property Status: string read FStatus write FStatus;

    [TCampo('AGD_PRIORIDADE', 'VARCHAR(30)')]
    property Prioridade: string read FPrioridade write FPrioridade;

    [TCampo('AGD_PARCERIA_ID', 'INTEGER')]
    property ParceriaId: Integer read FParceriaId write FParceriaId;

    [TCampo('AGD_OBSERVACAO', 'VARCHAR(500)')]
    property Observacao: string read FObservacao write FObservacao;

    [TCampo('AGD_CRIADO_EM', 'TIMESTAMP')]
    property CriadoEm: TDateTime read FCriadoEm write FCriadoEm;

    [TCampo('AGD_CRIADO_POR', 'INTEGER')]
    property CriadoPor: Integer read FCriadoPor write FCriadoPor;
  end;

implementation

end.
