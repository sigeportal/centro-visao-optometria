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
    FConteudo: string;
    FStatus: string;
    FVersao: Integer;
    FDocumentoOrigemId: Integer;
    FEmitidoPor: Integer;
    FEmitidoEm: TDateTime;
    FAtualizadoPor: Integer;
    FAtualizadoEm: TDateTime;
    FCriadoPor: Integer;
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

    [TCampo('DOC_CONTEUDO', 'BLOB SUB_TYPE TEXT')]
    property Conteudo: string read FConteudo write FConteudo;

    [TCampo('DOC_STATUS', 'VARCHAR(20)')]
    property Status: string read FStatus write FStatus;

    [TCampo('DOC_VERSAO', 'INTEGER')]
    property Versao: Integer read FVersao write FVersao;

    [TCampo('DOC_ORIGEM_ID', 'INTEGER')]
    property DocumentoOrigemId: Integer read FDocumentoOrigemId write FDocumentoOrigemId;

    [TCampo('DOC_EMITIDO_POR', 'INTEGER')]
    property EmitidoPor: Integer read FEmitidoPor write FEmitidoPor;

    [TCampo('DOC_EMITIDO_EM', 'TIMESTAMP')]
    property EmitidoEm: TDateTime read FEmitidoEm write FEmitidoEm;

    [TCampo('DOC_ATUALIZADO_POR', 'INTEGER')]
    property AtualizadoPor: Integer read FAtualizadoPor write FAtualizadoPor;

    [TCampo('DOC_ATUALIZADO_EM', 'TIMESTAMP')]
    property AtualizadoEm: TDateTime read FAtualizadoEm write FAtualizadoEm;

    [TCampo('DOC_CRIADO_POR', 'INTEGER')]
    property CriadoPor: Integer read FCriadoPor write FCriadoPor;
  end;

implementation

end.
