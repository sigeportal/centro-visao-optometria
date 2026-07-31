unit UnitDocumentoConsulta.Model;

interface

uses
  UnitPortalORM.Model,
  System.SysUtils;

type
  [TNomeTabela('DOCUMENTOS_CONSULTA', 'DOC_ID')]
  TModelDocumentoConsulta = class(TTabela)
  private
    FId: Integer;
    FConsultaId: Integer;
    FPacienteId: Integer;
    FTipo: string;
    FTitulo: string;
    FNomeArquivo: string;
    FCaminhoArquivo: string;
    FMimeType: string;
    FTamanho: Int64;
    FDataUpload: TDateTime;
  public
    [TCampo('DOC_ID', 'INTEGER NOT NULL PRIMARY KEY')]
    property Id: Integer read FId write FId;

    [TCampo('DOC_CONSULTA_ID', 'INTEGER')]
    property ConsultaId: Integer read FConsultaId write FConsultaId;

    [TCampo('DOC_PACIENTE_ID', 'INTEGER')]
    property PacienteId: Integer read FPacienteId write FPacienteId;

    [TCampo('DOC_TIPO', 'VARCHAR(40)')]
    property Tipo: string read FTipo write FTipo;

    [TCampo('DOC_TITULO', 'VARCHAR(150)')]
    property Titulo: string read FTitulo write FTitulo;

    [TCampo('DOC_NOME_ARQUIVO', 'VARCHAR(255)')]
    property NomeArquivo: string read FNomeArquivo write FNomeArquivo;

    [TCampo('DOC_CAMINHO_ARQUIVO', 'VARCHAR(500)')]
    property CaminhoArquivo: string read FCaminhoArquivo write FCaminhoArquivo;

    [TCampo('DOC_MIME_TYPE', 'VARCHAR(120)')]
    property MimeType: string read FMimeType write FMimeType;

    [TCampo('DOC_TAMANHO', 'BIGINT')]
    property Tamanho: Int64 read FTamanho write FTamanho;

    [TCampo('DOC_DATA_UPLOAD', 'TIMESTAMP')]
    property DataUpload: TDateTime read FDataUpload write FDataUpload;
  end;

implementation

end.
