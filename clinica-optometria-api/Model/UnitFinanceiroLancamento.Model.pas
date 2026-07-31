unit UnitFinanceiroLancamento.Model;

interface

uses
  UnitPortalORM.Model,
  System.SysUtils;

type
  [TNomeTabela('FIN_LANCAMENTOS', 'FIN_ID')]
  TModelFinanceiroLancamento = class(TTabela)
  private
    FId: Integer;
    FAgendamentoId: Integer;
    FPacienteId: Integer;
    FTipo: string;
    FValor: Currency;
    FStatus: string;
    FFormaPagamento: string;
    FCompetencia: TDateTime;
    FObservacoes: string;
    FDataCriacao: TDateTime;
  public
    [TCampo('FIN_ID', 'INTEGER NOT NULL PRIMARY KEY')]
    property Id: Integer read FId write FId;

    [TCampo('FIN_AGENDAMENTO_ID', 'INTEGER')]
    property AgendamentoId: Integer read FAgendamentoId write FAgendamentoId;

    [TCampo('FIN_PACIENTE_ID', 'INTEGER')]
    property PacienteId: Integer read FPacienteId write FPacienteId;

    [TCampo('FIN_TIPO', 'VARCHAR(30)')]
    property Tipo: string read FTipo write FTipo;

    [TCampo('FIN_VALOR', 'NUMERIC(12,2)')]
    property Valor: Currency read FValor write FValor;

    [TCampo('FIN_STATUS', 'VARCHAR(30)')]
    property Status: string read FStatus write FStatus;

    [TCampo('FIN_FORMA_PAGAMENTO', 'VARCHAR(40)')]
    property FormaPagamento: string read FFormaPagamento write FFormaPagamento;

    [TCampo('FIN_COMPETENCIA', 'DATE')]
    property Competencia: TDateTime read FCompetencia write FCompetencia;

    [TCampo('FIN_OBSERVACOES', 'VARCHAR(500)')]
    property Observacoes: string read FObservacoes write FObservacoes;

    [TCampo('FIN_DATA_CRIACAO', 'TIMESTAMP')]
    property DataCriacao: TDateTime read FDataCriacao write FDataCriacao;
  end;

implementation

end.
