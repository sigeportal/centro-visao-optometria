unit UnitPrescricao.Model;

interface

uses
  UnitPortalORM.Model,
  System.SysUtils;

type
  [TNomeTabela('PRESCRICOES', 'REC_ID')]
  TModelPrescricao = class(TTabela)
  private
    FId: Integer;
    FConsultaId: Integer;
    FTitulo: string;
    FODEsferico: string;
    FODCilindrico: string;
    FODEixo: string;
    FODAv: string;
    FODPrisma: string;
    FODDnp: string;
    FOEEsferico: string;
    FOECilindrico: string;
    FOEEixo: string;
    FOEAv: string;
    FOEPrisma: string;
    FOEDnp: string;
    FAdicao: string;
    FLente: string;
    FRetorno: TDateTime;
    FObservacoes: string;
    FData: TDateTime;
  public
    [TCampo('REC_ID', 'INTEGER NOT NULL PRIMARY KEY')]
    property Id: Integer read FId write FId;

    [TCampo('REC_CONSULTA_ID', 'INTEGER')]
    property ConsultaId: Integer read FConsultaId write FConsultaId;

    [TCampo('REC_TITULO', 'VARCHAR(120)')]
    property Titulo: string read FTitulo write FTitulo;

    [TCampo('REC_OD_ESFERICO', 'VARCHAR(20)')]
    property ODEsferico: string read FODEsferico write FODEsferico;

    [TCampo('REC_OD_CILINDRICO', 'VARCHAR(20)')]
    property ODCilindrico: string read FODCilindrico write FODCilindrico;

    [TCampo('REC_OD_EIXO', 'VARCHAR(20)')]
    property ODEixo: string read FODEixo write FODEixo;

    [TCampo('REC_OD_AV', 'VARCHAR(20)')]
    property ODAv: string read FODAv write FODAv;

    [TCampo('REC_OD_PRISMA', 'VARCHAR(20)')]
    property ODPrisma: string read FODPrisma write FODPrisma;

    [TCampo('REC_OD_DNP', 'VARCHAR(20)')]
    property ODDnp: string read FODDnp write FODDnp;

    [TCampo('REC_OE_ESFERICO', 'VARCHAR(20)')]
    property OEEsferico: string read FOEEsferico write FOEEsferico;

    [TCampo('REC_OE_CILINDRICO', 'VARCHAR(20)')]
    property OECilindrico: string read FOECilindrico write FOECilindrico;

    [TCampo('REC_OE_EIXO', 'VARCHAR(20)')]
    property OEEixo: string read FOEEixo write FOEEixo;

    [TCampo('REC_OE_AV', 'VARCHAR(20)')]
    property OEAv: string read FOEAv write FOEAv;

    [TCampo('REC_OE_PRISMA', 'VARCHAR(20)')]
    property OEPrisma: string read FOEPrisma write FOEPrisma;

    [TCampo('REC_OE_DNP', 'VARCHAR(20)')]
    property OEDnp: string read FOEDnp write FOEDnp;

    [TCampo('REC_ADICAO', 'VARCHAR(20)')]
    property Adicao: string read FAdicao write FAdicao;

    [TCampo('REC_LENTE', 'VARCHAR(120)')]
    property Lente: string read FLente write FLente;

    [TCampo('REC_RETORNO', 'DATE')]
    property Retorno: TDateTime read FRetorno write FRetorno;

    [TCampo('REC_OBSERVACOES', 'VARCHAR(2000)')]
    property Observacoes: string read FObservacoes write FObservacoes;

    [TCampo('REC_DATA', 'TIMESTAMP')]
    property Data: TDateTime read FData write FData;
  end;

implementation

end.
