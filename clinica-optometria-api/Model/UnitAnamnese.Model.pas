unit UnitAnamnese.Model;

interface

uses
  UnitPortalORM.Model,
  System.SysUtils;

type
  [TNomeTabela('ANAMNESES', 'ANA_ID')]
  TModelAnamnese = class(TTabela)
  private
    FId: Integer;
    FConsultaId: Integer;
    FMotivoPrincipal: string;
    FDataUltimoExame: TDateTime;
    FObservacoesGerais: string;
    FSintomas: string;
    FDoencasOculares: string;
    FDoencasSistemicas: string;
    FMedicamentos: string;
    FUsoOculos: Integer;
    FUsoLente: Integer;
    FDificuldadeLonge: Integer;
    FDificuldadePerto: Integer;
    FCefaleia: Integer;
    FCefaleiaLocal: string;
    FCefaleiaFrequencia: string;
    FAntecedentesFamiliares: string;
    FObservacoesFinais: string;
    FData: TDateTime;
  public
    [TCampo('ANA_ID', 'INTEGER NOT NULL PRIMARY KEY')]
    property Id: Integer read FId write FId;

    [TCampo('ANA_CONSULTA_ID', 'INTEGER')]
    property ConsultaId: Integer read FConsultaId write FConsultaId;

    [TCampo('ANA_MOTIVO_PRINCIPAL', 'VARCHAR(500)')]
    property MotivoPrincipal: string read FMotivoPrincipal write FMotivoPrincipal;

    [TCampo('ANA_DATA_ULTIMO_EXAME', 'DATE')]
    property DataUltimoExame: TDateTime read FDataUltimoExame write FDataUltimoExame;

    [TCampo('ANA_OBSERVACOES_GERAIS', 'VARCHAR(2000)')]
    property ObservacoesGerais: string read FObservacoesGerais write FObservacoesGerais;

    [TCampo('ANA_SINTOMAS', 'VARCHAR(2000)')]
    property Sintomas: string read FSintomas write FSintomas;

    [TCampo('ANA_DOENCAS_OCULARES', 'VARCHAR(2000)')]
    property DoencasOculares: string read FDoencasOculares write FDoencasOculares;

    [TCampo('ANA_DOENCAS_SISTEMICAS', 'VARCHAR(2000)')]
    property DoencasSistemicas: string read FDoencasSistemicas write FDoencasSistemicas;

    [TCampo('ANA_MEDICAMENTOS', 'VARCHAR(2000)')]
    property Medicamentos: string read FMedicamentos write FMedicamentos;

    [TCampo('ANA_USO_OCULOS', 'SMALLINT')]
    property UsoOculos: Integer read FUsoOculos write FUsoOculos;

    [TCampo('ANA_USO_LENTE', 'SMALLINT')]
    property UsoLente: Integer read FUsoLente write FUsoLente;

    [TCampo('ANA_DIFICULDADE_LONGE', 'SMALLINT')]
    property DificuldadeLonge: Integer read FDificuldadeLonge write FDificuldadeLonge;

    [TCampo('ANA_DIFICULDADE_PERTO', 'SMALLINT')]
    property DificuldadePerto: Integer read FDificuldadePerto write FDificuldadePerto;

    [TCampo('ANA_CEFALEIA', 'SMALLINT')]
    property Cefaleia: Integer read FCefaleia write FCefaleia;

    [TCampo('ANA_CEFALEIA_LOCAL', 'VARCHAR(200)')]
    property CefaleiaLocal: string read FCefaleiaLocal write FCefaleiaLocal;

    [TCampo('ANA_CEFALEIA_FREQUENCIA', 'VARCHAR(200)')]
    property CefaleiaFrequencia: string read FCefaleiaFrequencia write FCefaleiaFrequencia;

    [TCampo('ANA_ANTECEDENTES_FAMILIARES', 'VARCHAR(2000)')]
    property AntecedentesFamiliares: string read FAntecedentesFamiliares write FAntecedentesFamiliares;

    [TCampo('ANA_OBSERVACOES_FINAIS', 'VARCHAR(2000)')]
    property ObservacoesFinais: string read FObservacoesFinais write FObservacoesFinais;

    [TCampo('ANA_DATA', 'TIMESTAMP')]
    property Data: TDateTime read FData write FData;
  end;

implementation

end.
