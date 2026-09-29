import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Image as ImageIcon,
  Link2,
  Loader2,
  Pencil,
  Save,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  atualizarAnexoConsulta,
  baixarArquivoDocumento,
  criarAnexoConsulta,
  listarAnexosConsulta,
  visualizarArquivoDocumento,
} from '../../../api/consultas';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

function errorMessage(error) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    'Não foi possível concluir a operação.'
  );
}

function formatDate(value) {
  if (!value) return 'data não informada';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
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

function getAttachmentMeta(item) {
  const name = String(item.nome || item.titulo || '').toLowerCase();
  const mime = String(item.mime_type || '').toLowerCase();
  const isExt = isExternalUrl(item.url);

  if (mime.includes('pdf') || name.endsWith('.pdf')) {
    return {
      type: 'pdf',
      label: 'PDF',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/90',
      iconBoxClass: 'bg-rose-50 text-rose-600 border-rose-200/80',
      Icon: FileText,
    };
  }
  if (mime.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg)$/i.test(name)) {
    return {
      type: 'image',
      label: 'Imagem',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/90',
      iconBoxClass: 'bg-sky-50 text-sky-600 border-sky-200/80',
      Icon: ImageIcon,
    };
  }
  if (isExt) {
    return {
      type: 'link',
      label: 'Link Externo',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200/90',
      iconBoxClass: 'bg-slate-100 text-slate-500 border-slate-200/80',
      Icon: Link2,
    };
  }
  return {
    type: 'file',
    label: 'Documento',
    badgeClass: 'bg-forest-50 text-forest-700 border-forest-200/90',
    iconBoxClass: 'bg-forest-50 text-forest-700 border-forest-200/80',
    Icon: FileText,
  };
}

export default function AnexosConsultaTab({ consultation, disabled = false, onNotify }) {
  const [attachments, setAttachments] = useState([]);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'link'
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // { id, type: 'view' | 'download' }

  const fileInputRef = useRef(null);
  const prevAutoTitleRef = useRef('');

  const loadAttachments = useCallback(
    async (signal) => {
      setLoading(true);
      try {
        setAttachments(await listarAnexosConsulta(consultation.id, { signal }));
      } catch (error) {
        if (error?.code !== 'ERR_CANCELED') onNotify?.('error', errorMessage(error));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [consultation.id, onNotify]
  );

  useEffect(() => {
    const controller = new AbortController();
    handleResetForm();
    loadAttachments(controller.signal);
    return () => controller.abort();
  }, [loadAttachments]);

  const handleClearFile = () => {
    setSelectedFile(null);
    setFileBase64('');
    setReadProgress(0);
    setIsReadingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetForm = () => {
    setName('');
    setUrl('');
    setTitle('');
    setEditingItem(null);
    prevAutoTitleRef.current = '';
    handleClearFile();
  };

  const handleFileSelected = (file) => {
    if (!file) return;

    const ext = ('.' + (file.name.split('.').pop() || '')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_MIME_TYPES.includes(file.type)) {
      onNotify?.('error', 'Formato de arquivo não suportado. Por favor, envie arquivos PDF, JPG, PNG ou WEBP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      onNotify?.(
        'error',
        `O arquivo excede o limite máximo permitido de 15 MB (tamanho: ${formatFileSize(file.size)}).`
      );
      return;
    }

    setSelectedFile(file);

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    if (!title.trim() || title === prevAutoTitleRef.current) {
      setTitle(baseName);
      prevAutoTitleRef.current = baseName;
    }

    setIsReadingFile(true);
    setReadProgress(0);

    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        setReadProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    reader.onload = () => {
      setFileBase64(String(reader.result || ''));
      setIsReadingFile(false);
      setReadProgress(100);
    };
    reader.onerror = () => {
      setIsReadingFile(false);
      onNotify?.('error', 'Falha ao ler o arquivo selecionado.');
    };
    reader.readAsDataURL(file);
  };

  const handleStartEditing = (item) => {
    setEditingItem(item);
    const isLink = isExternalUrl(item.url);
    setActiveTab(isLink ? 'link' : 'upload');
    setTitle(item.titulo || item.nome || '');
    setName(item.nome || item.titulo || '');
    setUrl(item.url || '');
    handleClearFile();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (disabled || saving) return;

    // Se estiver editando
    if (editingItem) {
      setSaving(true);
      setSaved(false);
      try {
        const isLink = isExternalUrl(editingItem.url);
        const payload = {
          nome: name.trim() || title.trim(),
          titulo: title.trim() || name.trim(),
          ...(isLink ? { url: url.trim() } : {}),
        };
        await atualizarAnexoConsulta(editingItem.id, payload);
        onNotify?.('success', 'Documento atualizado com sucesso.');
        handleResetForm();
        await loadAttachments();
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2500);
      } catch (error) {
        onNotify?.('error', errorMessage(error));
      } finally {
        setSaving(false);
      }
      return;
    }

    // Modo Upload de Arquivo
    if (activeTab === 'upload') {
      if (!selectedFile || !fileBase64 || isReadingFile) return;

      setSaving(true);
      setSaved(false);
      try {
        const isPdf = selectedFile.name.toLowerCase().endsWith('.pdf');
        const payload = {
          nome: selectedFile.name,
          titulo: title.trim() || selectedFile.name,
          mime_type: selectedFile.type || (isPdf ? 'application/pdf' : 'application/octet-stream'),
          tamanho: selectedFile.size,
          conteudo_base64: fileBase64,
        };
        await criarAnexoConsulta(consultation.id, payload);
        onNotify?.('success', 'Arquivo anexado com sucesso!');
        handleResetForm();
        await loadAttachments();
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2500);
      } catch (error) {
        onNotify?.('error', errorMessage(error));
      } finally {
        setSaving(false);
      }
    } else {
      // Modo Link Externo
      if (!name.trim() || !url.trim()) return;

      setSaving(true);
      setSaved(false);
      try {
        const payload = {
          nome: name.trim(),
          titulo: name.trim(),
          url: url.trim(),
        };
        await criarAnexoConsulta(consultation.id, payload);
        onNotify?.('success', 'Link externo vinculado com sucesso!');
        handleResetForm();
        await loadAttachments();
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2500);
      } catch (error) {
        onNotify?.('error', errorMessage(error));
      } finally {
        setSaving(false);
      }
    }
  };

  const handleVisualizar = async (item) => {
    if (isExternalUrl(item.url)) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      setActionLoading({ id: item.id, type: 'view' });
      await visualizarArquivoDocumento(item.id);
    } catch (err) {
      onNotify?.('error', errorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleBaixar = async (item) => {
    try {
      setActionLoading({ id: item.id, type: 'download' });
      await baixarArquivoDocumento(item.id, item.nome || item.titulo || `documento-${item.id}`);
    } catch (err) {
      onNotify?.('error', errorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="clinical-panel p-5 sm:p-6 shadow-sm space-y-5 animate-fade-in text-xs">
      <div>
        <h3 className="font-bold text-sm text-slate-900 tracking-tight">Anexos & Exames Complementares</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Faça upload de laudos, exames em PDF ou imagens e vincule links externos a este atendimento.
        </p>
      </div>

      {/* Formulário de Anexo / Upload */}
      <form onSubmit={handleSubmit} className="border border-slate-200/80 rounded-2xl bg-slate-50/70 p-4 sm:p-5 shadow-hairline space-y-4">
        {/* Seletor de Modo / Estado de Edição */}
        {!editingItem ? (
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl w-fit">
            <button
              type="button"
              disabled={disabled || saving}
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'upload'
                  ? 'bg-white text-forest-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5 text-forest-700" />
              <span>Fazer Upload de Arquivo</span>
            </button>
            <button
              type="button"
              disabled={disabled || saving}
              onClick={() => setActiveTab('link')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'link'
                  ? 'bg-white text-forest-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 text-forest-700" />
              <span>Vincular Link Externo</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200/90 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="font-semibold text-amber-900 text-xs">
                Editando anexo:{' '}
                <strong className="font-bold">{editingItem.nome || editingItem.titulo}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetForm}
              disabled={saving}
              className="text-amber-800 hover:text-amber-950 font-bold text-xs flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancelar</span>
            </button>
          </div>
        )}

        {/* MODO UPLOAD DE ARQUIVO */}
        {activeTab === 'upload' && !editingItem && (
          <div className="space-y-3.5">
            {!selectedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!disabled && !saving) setIsDragging(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!disabled && !saving) setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  if (disabled || saving) return;
                  if (e.dataTransfer.files?.[0]) handleFileSelected(e.dataTransfer.files[0]);
                }}
                onClick={() => {
                  if (!disabled && !saving) fileInputRef.current?.click();
                }}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-forest-600 bg-forest-50/70 scale-[0.99]'
                    : 'border-slate-300 hover:border-forest-500 hover:bg-slate-50 bg-white'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                  disabled={disabled || saving}
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
                  }}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center border border-forest-200/60 shadow-hairline">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-xs sm:text-sm">
                      Arraste e solte o arquivo aqui ou{' '}
                      <span className="text-forest-700 underline underline-offset-2">clique para selecionar</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Formatos aceitos: <strong>PDF, JPG, PNG, WEBP</strong> &bull; Limite máximo de{' '}
                      <strong>15 MB</strong>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Arquivo Selecionado Preview */
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        selectedFile.name.toLowerCase().endsWith('.pdf')
                          ? 'bg-rose-50 text-rose-600 border-rose-200/80'
                          : 'bg-sky-50 text-sky-600 border-sky-200/80'
                      }`}
                    >
                      {selectedFile.name.toLowerCase().endsWith('.pdf') ? (
                        <FileText className="w-5 h-5" />
                      ) : (
                        <ImageIcon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate">{selectedFile.name}</p>
                      <p className="text-[10.5px] text-slate-400">
                        {formatFileSize(selectedFile.size)} &bull; {selectedFile.type || 'Arquivo'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    disabled={saving || isReadingFile}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remover arquivo selecionado"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Barra de Progresso durante leitura do arquivo */}
                {isReadingFile && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                      <span>Processando arquivo...</span>
                      <span>{readProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-forest-600 h-1.5 rounded-full transition-all duration-200"
                        style={{ width: `${readProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Campos complementares quando arquivo selecionado */}
            {selectedFile && (
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                <label className="block min-w-0">
                  <span className="clinical-label">Título / Descrição do exame</span>
                  <input
                    type="text"
                    required
                    maxLength={255}
                    disabled={disabled || saving || isReadingFile}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ex.: Topografia Corneana OD/OE"
                    className="clinical-input"
                  />
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={disabled || saving || isReadingFile || !selectedFile || !fileBase64}
                    className="h-10 min-w-32 btn-primary"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <UploadCloud className="w-4 h-4" />
                    )}
                    <span>{saving ? 'Enviando...' : saved ? 'Enviado!' : 'Enviar Arquivo'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    disabled={saving}
                    className="h-10 btn-secondary px-3"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODO LINK EXTERNO (OU EDIÇÃO DE LINK) */}
        {(activeTab === 'link' || (editingItem && isExternalUrl(editingItem.url))) && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,0.7fr)_minmax(320px,1.3fr)_auto] gap-3.5 items-end">
            <label className="block min-w-0">
              <span className="clinical-label">Nome do documento / exame</span>
              <input
                type="text"
                required
                maxLength={255}
                disabled={disabled || saving}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Laudo Laboratorial Externo"
                className="clinical-input"
              />
            </label>
            <label className="block min-w-0">
              <span className="clinical-label">Link do documento (URL)</span>
              <div className="relative">
                <Link2 className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  required
                  maxLength={500}
                  disabled={disabled || saving}
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://laboratorio.com/exame/123"
                  className="clinical-input pl-10"
                />
              </div>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={disabled || saving || !name.trim() || !url.trim()}
                className="h-10 min-w-28 btn-primary"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>
                  {saving ? 'Salvando...' : saved ? 'Salvo' : editingItem ? 'Salvar alterações' : 'Salvar Link'}
                </span>
              </button>
              {editingItem && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  disabled={saving}
                  className="h-10 btn-secondary px-3"
                >
                  <X className="w-4 h-4" />
                  <span>Cancelar</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* EDIÇÃO DE ARQUIVO SERVIDOR */}
        {editingItem && !isExternalUrl(editingItem.url) && (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
            <label className="block min-w-0">
              <span className="clinical-label">Título / Descrição do exame</span>
              <input
                type="text"
                required
                maxLength={255}
                disabled={disabled || saving}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: Topografia Corneana OD/OE"
                className="clinical-input"
              />
            </label>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={disabled || saving || !title.trim()}
                className="h-10 min-w-28 btn-primary"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? 'Salvando...' : saved ? 'Salvo' : 'Salvar alterações'}</span>
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                disabled={saving}
                className="h-10 btn-secondary px-3"
              >
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Lista de Anexos Vinculados */}
      <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-hairline bg-white">
        {loading ? (
          <div className="min-h-28 flex items-center justify-center gap-2 text-slate-600 font-semibold text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
            <span>Carregando anexos...</span>
          </div>
        ) : attachments.length === 0 ? (
          <div className="min-h-28 flex flex-col items-center justify-center text-slate-400 font-medium py-6">
            <UploadCloud className="w-8 h-8 text-slate-300 mb-1.5" />
            <span>Nenhum documento ou exame anexado a esta consulta.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {attachments.map((item) => {
              const meta = getAttachmentMeta(item);
              const isExt = isExternalUrl(item.url);
              const isViewing = actionLoading?.id === item.id && actionLoading?.type === 'view';
              const isDownloading = actionLoading?.id === item.id && actionLoading?.type === 'download';

              return (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-forest-50/20 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-hairline border ${meta.iconBoxClass}`}
                    >
                      <meta.Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 block break-words text-xs">
                          {item.titulo || item.nome}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md border ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                        {item.tamanho ? (
                          <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                            {formatFileSize(item.tamanho)}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 text-[10.5px] text-slate-400 mt-0.5 flex-wrap">
                        {item.titulo && item.nome && item.titulo !== item.nome && (
                          <span className="text-slate-500 break-words">
                            Arquivo: {item.nome} &bull;
                          </span>
                        )}
                        <span>Vinculado em {formatDate(item.data_upload)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Botão Visualizar / Abrir */}
                    <button
                      type="button"
                      onClick={() => handleVisualizar(item)}
                      disabled={isViewing || isDownloading}
                      className="btn-secondary py-1.5 px-3 rounded-xl text-xs flex items-center gap-1.5"
                      title={isExt ? 'Abrir link externo' : 'Visualizar documento'}
                      aria-label={`Visualizar ${item.nome}`}
                    >
                      {isViewing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-forest-700" />
                      ) : isExt ? (
                        <ExternalLink className="w-3.5 h-3.5 text-forest-700" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-forest-700" />
                      )}
                      <span>{isExt ? 'Abrir Link' : 'Visualizar'}</span>
                    </button>

                    {/* Botão Baixar (apenas para arquivos locais/servidor) */}
                    {!isExt && (
                      <button
                        type="button"
                        onClick={() => handleBaixar(item)}
                        disabled={isViewing || isDownloading}
                        className="btn-secondary py-1.5 px-3 rounded-xl text-xs flex items-center gap-1.5"
                        title="Baixar arquivo com nome correto"
                        aria-label={`Baixar ${item.nome}`}
                      >
                        {isDownloading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-forest-700" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-forest-700" />
                        )}
                        <span>Baixar</span>
                      </button>
                    )}

                    {/* Botão Editar */}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => handleStartEditing(item)}
                        className="btn-secondary p-2 rounded-xl text-xs"
                        title="Editar título e informações"
                        aria-label={`Editar ${item.nome}`}
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-700" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
