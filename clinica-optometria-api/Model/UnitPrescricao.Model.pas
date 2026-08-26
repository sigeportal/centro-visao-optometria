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
    FModo: string;
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
    FODPertoEsferico: string;
    FODPertoCilindrico: string;
    FODPertoEixo: string;
    FODPertoAv: string;
    FODPertoPrisma: string;
    FODPertoDnp: string;
    FOEPertoEsferico: string;
    FOEPertoCilindrico: string;
    FOEPertoEixo: string;
    FOEPertoAv: string;
    FOEPertoPrisma: string;
    FOEPertoDnp: string;
    FAdicao: string;
    FLente: string;
    FObservacoes: string;
    FData: TDateTime;
  public
    [TCampo('REC_ID', 'INTEGER NOT NULL PRIMARY KEY')]
    property Id: Integer read FId write FId;

    [TCampo('REC_CONSULTA_ID', 'INTEGER')]
    property ConsultaId: Integer read FConsultaId write FConsultaId;

    [TCampo('REC_TITULO', 'VARCHAR(120)')]
    property Titulo: string read FTitulo write FTitulo;

    [TCampo('REC_MODO', 'VARCHAR(20)')]
    property Modo: string read FModo write FModo;

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

    [TCampo('REC_OD_PERTO_ESFERICO', 'VARCHAR(20)')]
    property ODPertoEsferico: string read FODPertoEsferico write FODPertoEsferico;

    [TCampo('REC_OD_PERTO_CILINDRICO', 'VARCHAR(20)')]
    property ODPertoCilindrico: string read FODPertoCilindrico write FODPertoCilindrico;

    [TCampo('REC_OD_PERTO_EIXO', 'VARCHAR(20)')]
    property ODPertoEixo: string read FODPertoEixo write FODPertoEixo;

    [TCampo('REC_OD_PERTO_AV', 'VARCHAR(20)')]
    property ODPertoAv: string read FODPertoAv write FODPertoAv;

    [TCampo('REC_OD_PERTO_PRISMA', 'VARCHAR(20)')]
    property ODPertoPrisma: string read FODPertoPrisma write FODPertoPrisma;

    [TCampo('REC_OD_PERTO_DNP', 'VARCHAR(20)')]
    property ODPertoDnp: string read FODPertoDnp write FODPertoDnp;

    [TCampo('REC_OE_PERTO_ESFERICO', 'VARCHAR(20)')]
    property OEPertoEsferico: string read FOEPertoEsferico write FOEPertoEsferico;

    [TCampo('REC_OE_PERTO_CILINDRICO', 'VARCHAR(20)')]
    property OEPertoCilindrico: string read FOEPertoCilindrico write FOEPertoCilindrico;

    [TCampo('REC_OE_PERTO_EIXO', 'VARCHAR(20)')]
    property OEPertoEixo: string read FOEPertoEixo write FOEPertoEixo;

    [TCampo('REC_OE_PERTO_AV', 'VARCHAR(20)')]
    property OEPertoAv: string read FOEPertoAv write FOEPertoAv;

    [TCampo('REC_OE_PERTO_PRISMA', 'VARCHAR(20)')]
    property OEPertoPrisma: string read FOEPertoPrisma write FOEPertoPrisma;

    [TCampo('REC_OE_PERTO_DNP', 'VARCHAR(20)')]
    property OEPertoDnp: string read FOEPertoDnp write FOEPertoDnp;

    [TCampo('REC_ADICAO', 'VARCHAR(20)')]
    property Adicao: string read FAdicao write FAdicao;

    [TCampo('REC_LENTE', 'VARCHAR(120)')]
    property Lente: string read FLente write FLente;

    [TCampo('REC_OBSERVACOES', 'VARCHAR(2000)')]
    property Observacoes: string read FObservacoes write FObservacoes;

    [TCampo('REC_DATA', 'TIMESTAMP')]
    property Data: TDateTime read FData write FData;
  end;

implementation

end.
