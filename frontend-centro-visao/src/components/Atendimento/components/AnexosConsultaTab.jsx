import { useCallback, useEffect, useState } from 'react';
import { Check, ExternalLink, FileText, Link2, Loader2, Pencil, Save, X } from 'lucide-react';
import { atualizarAnexoConsulta, criarAnexoConsulta, listarAnexosConsulta } from '../../../api/consultas';

function errorMessage(error) {
  return error?.response?.data?.error?.message || error?.message || 'Não foi possível concluir a operação.';
}

function formatDate(value) {
  if (!value) return 'data não informada';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
}

export default function AnexosConsultaTab({ consultation, disabled = false, onNotify }) {
  const [attachments, setAttachments] = useState([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const loadAttachments = useCallback(async (signal) => {
    setLoading(true);
    try {
      setAttachments(await listarAnexosConsulta(consultation.id, { signal }));
    } catch (error) {
      if (error?.code !== 'ERR_CANCELED') onNotify?.('error', errorMessage(error));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [consultation.id, onNotify]);

  useEffect(() => {
    const controller = new AbortController();
    setName('');
    setUrl('');
    setEditingId(null);
    loadAttachments(controller.signal);
    return () => controller.abort();
  }, [loadAttachments]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (disabled || saving) return;
    setSaving(true);
    setSaved(false);
    try {
      if (editingId) await atualizarAnexoConsulta(editingId, { nome: name.trim(), url: url.trim(), titulo: name.trim() });
      else await criarAnexoConsulta(consultation.id, { nome: name.trim(), url: url.trim() });
      setName('');
      setUrl('');
      setEditingId(null);
      await loadAttachments();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      onNotify?.('error', errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="clinical-panel p-5 sm:p-6 shadow-sm space-y-5 animate-fade-in text-xs">
      <div>
        <h3 className="font-bold text-sm text-slate-900 tracking-tight">Anexos & Exames Complementares</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">Vincule documentos, laudos externos e exames laboratoriais a este atendimento.</p>
      </div>

      <form onSubmit={handleSubmit} className="border border-slate-200/80 rounded-2xl bg-slate-50/70 p-4 shadow-hairline">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,0.7fr)_minmax(320px,1.3fr)_auto] gap-3.5 items-end">
          <label className="block min-w-0">
            <span className="clinical-label">Nome do documento</span>
            <input
              type="text"
              required
              maxLength={255}
              disabled={disabled || saving}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Topografia corneana"
              className="clinical-input"
            />
          </label>
          <label className="block min-w-0">
            <span className="clinical-label">Link do documento</span>
            <div className="relative">
              <Link2 className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="url"
                required
                maxLength={500}
                disabled={disabled || saving}
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://..."
                className="clinical-input pl-10"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={disabled || saving || !name.trim() || !url.trim()}
            className="h-10 min-w-28 btn-primary"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Salvando...' : saved ? 'Salvo' : editingId ? 'Salvar alterações' : 'Salvar Link'}</span>
          </button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setName(''); setUrl(''); }} disabled={saving} className="h-10 btn-secondary px-3"><X className="w-4 h-4" /><span>Cancelar</span></button>}
        </div>
      </form>

      <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-hairline">
        {loading ? (
          <div className="min-h-28 flex items-center justify-center gap-2 text-slate-600 font-semibold text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
            <span>Carregando links...</span>
          </div>
        ) : attachments.length === 0 ? (
          <div className="min-h-28 flex items-center justify-center text-slate-400 font-medium">Nenhum documento vinculado a esta consulta.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {attachments.map((item) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-forest-50/20 transition-colors">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-forest-50 text-forest-700 border border-forest-200/60 flex items-center justify-center shrink-0 shadow-hairline">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block break-words">{item.nome}</span>
                    <span className="text-[10.5px] text-slate-400">Vinculado em {formatDate(item.data_upload)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!disabled && <button type="button" onClick={() => { setEditingId(item.id); setName(item.nome || ''); setUrl(item.url || ''); }} className="btn-secondary p-2" title="Editar informações" aria-label={`Editar ${item.nome}`}><Pencil className="w-4 h-4" /></button>}
                  <button type="button" onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')} className="btn-secondary p-2" title="Abrir documento" aria-label={`Abrir ${item.nome}`}><ExternalLink className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
