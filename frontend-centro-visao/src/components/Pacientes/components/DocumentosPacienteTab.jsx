import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Image as ImageIcon,
  Link2,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  atualizarAnexoConsulta,
  baixarArquivoDocumento,
  visualizarArquivoDocumento,
} from '../../../api/consultas';
import { listarDocumentosPaciente } from '../../../api/pacientes';
import { useAuth } from '../../../context/AuthContext';
import { PERMISSIONS } from '../../../constants/permissions';
import { parseApiDateTime } from '../../../domain/agenda';

function errorMessage(error, fallback) {
  return error?.response?.data?.error?.message || error?.message || fallback;
}

function formatDate(value, withTime = false) {
  const date = parseApiDateTime(value);
  if (!date) return 'data não informada';
  return withTime ? date.toLocaleString('pt-BR') : date.toLocaleDateString('pt-BR');
}

function formatFileSize(bytes) {
  if (!bytes || Number.isNaN(Number(bytes)) || Number(bytes) <= 0) return null;
  const num = Number(bytes);
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = num;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function isExternalUrl(url) {
  if (!url) return false;
  return /^https?:\/\//i.test(url) && !url.includes('/v1/documentos');
}

function documentLabel(document) {
  const type = String(document.tipo || '').trim().toLocaleLowerCase('pt-BR');
  const isAttachment = document.anexo === true || type === 'anexo';
  if (isAttachment) return document.nome || document.titulo || 'Anexo sem nome';
  return document.titulo || document.tipo || document.nome || 'Documento sem nome';
}

function getDocumentVisual(document) {
  const isAttachment =
    document.anexo === true || String(document.tipo || '').trim().toLocaleLowerCase('pt-BR') === 'anexo';

  if (!isAttachment) {
    return {
      Icon: FileText,
      iconBoxClass: 'bg-forest-50 text-forest-700 border-forest-200/80',
      badgeClass: 'bg-forest-50 text-forest-800 border-forest-200/90',
      badgeLabel: 'Clínico',
    };
  }

  const name = String(document.nome || document.titulo || '').toLowerCase();
  const mime = String(document.mime_type || '').toLowerCase();
  const isExt = isExternalUrl(document.url);

  if (mime.includes('pdf') || name.endsWith('.pdf')) {
    return {
      Icon: FileText,
      iconBoxClass: 'bg-rose-50 text-rose-600 border-rose-200/80',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/90',
      badgeLabel: 'PDF',
    };
  }
  if (mime.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg)$/i.test(name)) {
    return {
      Icon: ImageIcon,
      iconBoxClass: 'bg-sky-50 text-sky-600 border-sky-200/80',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/90',
      badgeLabel: 'Imagem',
    };
  }
  if (isExt) {
    return {
      Icon: Link2,
      iconBoxClass: 'bg-slate-100 text-slate-500 border-slate-200/80',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200/90',
      badgeLabel: 'Link Externo',
    };
  }
  return {
    Icon: FileText,
    iconBoxClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/90',
    badgeLabel: 'Anexo',
  };
}

export default function DocumentosPacienteTab({ patient, onNotify }) {
  const navigate = useNavigate();
  const { can } = useAuth();
  const canViewClinical = can(PERMISSIONS.CLINICAL_VIEW);
  const canEditClinical = can(PERMISSIONS.CLINICAL_EDIT);
  const [groups, setGroups] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // { id, type: 'view' | 'download' }

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError('');
      try {
        setGroups(await listarDocumentosPaciente(patient.id, { signal }));
      } catch (errorValue) {
        if (errorValue?.code !== 'ERR_CANCELED') {
          setGroups([]);
          setError(errorMessage(errorValue, 'Não foi possível carregar os documentos.'));
        }
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [patient.id]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, refreshKey]);

  const openConsultation = (consultationId) =>
    navigate(`/consultas/${consultationId}`, { state: { returnTo: `/pacientes/${patient.id}` } });

  const startEditing = (document) => {
    setEditing(document);
    setName(document.nome || document.titulo || '');
    setUrl(document.url || '');
  };

  const closeEditing = () => {
    if (saving) return;
    setEditing(null);
    setName('');
    setUrl('');
  };

  const saveAttachment = async (event) => {
    event.preventDefault();
    if (!editing || saving) return;
    setSaving(true);
    try {
      const isExt = isExternalUrl(editing.url);
      await atualizarAnexoConsulta(editing.id, {
        nome: name.trim(),
        titulo: name.trim(),
        ...(isExt ? { url: url.trim() } : {}),
      });
      onNotify?.('success', 'Informações do documento atualizadas com sucesso.');
      closeEditing();
      setRefreshKey((value) => value + 1);
    } catch (errorValue) {
      onNotify?.('error', errorMessage(errorValue, 'Não foi possível atualizar o documento.'));
    } finally {
      setSaving(false);
    }
  };

  const handleVisualizar = async (document) => {
    if (isExternalUrl(document.url)) {
      window.open(document.url, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      setActionLoading({ id: document.id, type: 'view' });
      await visualizarArquivoDocumento(document.id);
    } catch (err) {
      onNotify?.('error', errorMessage(err, 'Não foi possível visualizar o documento.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleBaixar = async (document) => {
    try {
      setActionLoading({ id: document.id, type: 'download' });
      await baixarArquivoDocumento(document.id, document.nome || document.titulo || `documento-${document.id}`);
    } catch (err) {
      onNotify?.('error', errorMessage(err, 'Não foi possível baixar o arquivo.'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      <div className="clinical-panel p-4 sm:p-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">Documentos por Consulta</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Documentos clínicos e anexos organizados pelo atendimento em que foram registrados.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
          className="h-10 w-10 btn-secondary p-0 shrink-0"
          title="Atualizar documentos"
          aria-label="Atualizar documentos"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-900 font-semibold flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="border border-slate-200/80 rounded-2xl bg-white shadow-hairline overflow-hidden divide-y divide-slate-200">
        {groups.map((group) => {
          const isExpanded = Boolean(expanded[group.consulta_id]);
          const documents = Array.isArray(group.documentos) ? group.documentos : [];
          return (
            <section key={group.consulta_id}>
              <button
                type="button"
                onClick={() => setExpanded((value) => ({ ...value, [group.consulta_id]: !isExpanded }))}
                className="w-full p-4 sm:px-5 flex items-center justify-between gap-3 text-left bg-slate-50/80 hover:bg-forest-50/40 transition-colors"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-extrabold uppercase text-xs text-slate-800 tracking-wide">
                    Consulta realizada em {formatDate(group.consulta_data || group.data)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200/80 px-2 py-0.5 rounded-md">
                    {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180 text-forest-700' : ''
                  }`}
                />
              </button>

              {isExpanded && (
                <div className="divide-y divide-slate-100">
                  {documents.map((document) => {
                    const isAttachment =
                      document.anexo === true ||
                      String(document.tipo || '').trim().toLocaleLowerCase('pt-BR') === 'anexo';
                    const visual = getDocumentVisual(document);
                    const isExt = isExternalUrl(document.url);
                    const isServerFile = isAttachment && Boolean(document.id) && !isExt;
                    const isViewing = actionLoading?.id === document.id && actionLoading?.type === 'view';
                    const isDownloading = actionLoading?.id === document.id && actionLoading?.type === 'download';

                    return (
                      <div
                        key={document.id}
                        className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-forest-50/20 transition-colors"
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-hairline ${visual.iconBoxClass}`}
                          >
                            <visual.Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-slate-900 text-xs break-words">
                                {documentLabel(document)}
                              </p>
                              <span
                                className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md border ${visual.badgeClass}`}
                              >
                                {visual.badgeLabel}
                              </span>
                              {document.tamanho ? (
                                <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                  {formatFileSize(document.tamanho)}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[10.5px] text-slate-500 mt-1 font-medium">
                              {isAttachment
                                ? `${isExt ? 'Link externo' : 'Arquivo anexado'}`
                                : `${document.tipo || 'Documento clínico'} · versão ${document.versao || 1}`}{' '}
                              · Atualizado em{' '}
                              {formatDate(document.atualizado_em || document.data_upload, true)}
                            </p>
                            <p className="text-[10.5px] text-slate-400 mt-0.5">
                              Profissional:{' '}
                              <span className="font-medium text-slate-600">
                                {group.profissional || 'não informado'}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                          {/* Anexo com Link Externo */}
                          {isAttachment && isExt && (
                            <button
                              type="button"
                              onClick={() => window.open(document.url, '_blank', 'noopener,noreferrer')}
                              className="btn-secondary py-1.5 px-3 rounded-xl flex items-center gap-1.5"
                              title="Abrir link externo"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-forest-700" />
                              <span>Abrir Link</span>
                            </button>
                          )}

                          {/* Anexo com Arquivo no Servidor: Visualizar e Baixar autenticados */}
                          {isServerFile && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleVisualizar(document)}
                                disabled={isViewing || isDownloading}
                                className="btn-secondary py-1.5 px-3 rounded-xl flex items-center gap-1.5"
                                title="Visualizar documento em nova aba"
                              >
                                {isViewing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-forest-700" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5 text-forest-700" />
                                )}
                                <span>Visualizar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBaixar(document)}
                                disabled={isViewing || isDownloading}
                                className="btn-secondary py-1.5 px-3 rounded-xl flex items-center gap-1.5"
                                title="Baixar arquivo com nome original"
                              >
                                {isDownloading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-forest-700" />
                                ) : (
                                  <Download className="w-3.5 h-3.5 text-forest-700" />
                                )}
                                <span>Baixar</span>
                              </button>
                            </>
                          )}

                          {/* Documento Clínico: Abrir Consulta */}
                          {!isAttachment && canViewClinical && (
                            <button
                              type="button"
                              onClick={() => openConsultation(group.consulta_id)}
                              className="btn-secondary py-1.5 px-3 rounded-xl flex items-center gap-1.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-forest-700" />
                              <span>Abrir consulta</span>
                            </button>
                          )}

                          {/* Editar Anexo */}
                          {isAttachment && canEditClinical && (
                            <button
                              type="button"
                              onClick={() => startEditing(document)}
                              className="btn-secondary py-1.5 px-3 rounded-xl flex items-center gap-1.5"
                              title="Editar informações"
                            >
                              <Pencil className="w-3.5 h-3.5 text-amber-700" />
                              <span>Editar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {loading && (
          <div className="min-h-40 flex items-center justify-center gap-2 text-slate-600 font-semibold">
            <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
            <span>Carregando documentos...</span>
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="min-h-40 flex items-center justify-center text-slate-500 font-medium">
            Nenhum documento vinculado às consultas deste paciente.
          </div>
        )}
      </div>

      {/* Modal de Edição de Anexo */}
      {editing &&
        createPortal(
          <div
            className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Editar documento"
          >
            <form
              onSubmit={saveAttachment}
              className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200/90 shadow-modal flex flex-col overflow-hidden my-auto animate-fade-in text-xs"
            >
              {/* Header */}
              <div className="shrink-0 bg-gradient-to-r from-[#022b22] via-[#033b2e] to-[#022b22] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-forest-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-forest-850 border border-forest-700/80 text-amber-400 flex items-center justify-center shrink-0 shadow-hairline">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                      DOCUMENTO ANEXADO
                    </span>
                    <h3 className="font-bold text-white text-base tracking-tight mt-0.5">
                      Editar Documento
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeEditing}
                  disabled={saving}
                  className="p-1.5 rounded-lg text-forest-200 hover:text-white hover:bg-white/10 transition-colors"
                  title="Fechar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 space-y-4 bg-white">
                <label className="block">
                  <span className="clinical-label">Nome / Título do documento</span>
                  <input
                    type="text"
                    required
                    maxLength={255}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={saving}
                    className="clinical-input"
                    placeholder="Ex: Topografia Corneana OD/OE"
                  />
                </label>

                {isExternalUrl(editing.url) ? (
                  <label className="block">
                    <span className="clinical-label">Link ou URL do documento</span>
                    <input
                      type="url"
                      required
                      maxLength={500}
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      disabled={saving}
                      className="clinical-input"
                      placeholder="https://exemplo.com/documento.pdf"
                    />
                  </label>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-500 text-[11.5px]">
                    <p className="font-semibold text-slate-700">Arquivo armazenado no servidor</p>
                    <p className="mt-0.5 text-slate-400">
                      O arquivo binário está salvo com segurança no servidor da clínica. Você pode alterar o título exibido acima.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="shrink-0 p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditing}
                  disabled={saving}
                  className="h-10 btn-secondary px-4"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim() || (isExternalUrl(editing.url) && !url.trim())}
                  className="h-10 btn-primary px-5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'Salvando...' : 'Salvar alterações'}</span>
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}
    </div>
  );
}
