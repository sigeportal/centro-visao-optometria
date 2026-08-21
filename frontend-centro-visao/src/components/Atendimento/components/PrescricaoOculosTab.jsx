import { useCallback, useEffect, useState } from 'react';
import { Check, History, Loader2, Pencil, Plus, Printer, Save, Sparkles } from 'lucide-react';
import {
  atualizarPrescricaoConsulta,
  criarPrescricaoConsulta,
  listarPrescricoesConsulta,
  obterImpressaoPrescricao,
  obterSecaoFichaClinica,
} from '../../../api/consultas';

const EMPTY_EYE = { esferico: '', cilindrico: '', eixo: '', av: '', prisma: '', dnp: '' };
const EMPTY_FORM = {
  titulo: 'Prescrição para Óculos', od: { ...EMPTY_EYE }, oe: { ...EMPTY_EYE },
  modo: 'longe', perto: { od: { ...EMPTY_EYE }, oe: { ...EMPTY_EYE } },
  adicao: '', lente: '', retorno: '', observacoes: '',
};
const EYE_FIELDS = [
  ['esferico', 'Esférico (D)'], ['cilindrico', 'Cilíndrico (D)'], ['eixo', 'Eixo (°)', 'number'],
  ['av', 'Acuidade Visual'], ['prisma', 'Prisma'], ['dnp', 'DNP (mm)'],
];

function errorMessage(error, fallback) {
  return error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || fallback;
}

function dateInput(value) {
  return String(value || '').match(/^\d{4}-\d{2}-\d{2}/)?.[0] || '';
}

function formatDate(value) {
  const iso = dateInput(value);
  if (!iso) return value ? String(value) : 'Data não informada';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

function toForm(item = {}) {
  const eye = (prefix) => ({
    esferico: item[`${prefix}_esferico`] || '', cilindrico: item[`${prefix}_cilindrico`] || '',
    eixo: item[`${prefix}_eixo`] || '', av: item[`${prefix}_av`] || '',
    prisma: item[`${prefix}_prisma`] || '', dnp: item[`${prefix}_dnp`] || '',
  });
  return {
    titulo: item.titulo || EMPTY_FORM.titulo, modo: item.modo === 'longe_perto' ? 'longe_perto' : 'longe',
    od: eye('od'), oe: eye('oe'), perto: { od: eye('od_perto'), oe: eye('oe_perto') }, adicao: item.adicao || '',
    lente: item.lente || '', retorno: dateInput(item.retorno), observacoes: item.observacoes || '',
  };
}

function toPayload(form) {
  return {
    titulo: form.titulo.trim(),
    modo: form.modo,
    ...Object.fromEntries(['od', 'oe'].flatMap((eye) => EYE_FIELDS.map(([field]) => [`${eye}_${field}`, form[eye][field]]))),
    ...Object.fromEntries(['od', 'oe'].flatMap((eye) => EYE_FIELDS.map(([field]) => [`${eye}_perto_${field}`, form.perto[eye][field]]))),
    adicao: form.adicao, lente: form.lente, retorno: form.retorno, observacoes: form.observacoes,
  };
}

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function printHtml(data, consultation) {
  const cell = (value, fallback = '-') => escapeHtml(String(value || '').trim() || fallback);
  const observations = escapeHtml(data?.observacoes || '').replaceAll('\n', '<br>');
  const grid = (label, prefix = '') => `<h2>${label}</h2><table><thead><tr><th>Olho</th><th>Esférico</th><th>Cilíndrico</th><th>Eixo</th><th>AV</th><th>Prisma</th><th>DNP</th></tr></thead><tbody>
  <tr><td>OD</td><td>${cell(data?.[`od_${prefix}esferico`], 'Plano')}</td><td>${cell(data?.[`od_${prefix}cilindrico`])}</td><td>${cell(data?.[`od_${prefix}eixo`])}</td><td>${cell(data?.[`od_${prefix}av`])}</td><td>${cell(data?.[`od_${prefix}prisma`])}</td><td>${cell(data?.[`od_${prefix}dnp`])}</td></tr>
  <tr><td>OE</td><td>${cell(data?.[`oe_${prefix}esferico`], 'Plano')}</td><td>${cell(data?.[`oe_${prefix}cilindrico`])}</td><td>${cell(data?.[`oe_${prefix}eixo`])}</td><td>${cell(data?.[`oe_${prefix}av`])}</td><td>${cell(data?.[`oe_${prefix}prisma`])}</td><td>${cell(data?.[`oe_${prefix}dnp`])}</td></tr></tbody></table>`;
  const isNearMode = data?.modo === 'longe_perto';
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(data?.titulo || EMPTY_FORM.titulo)}</title>
  <style>*{box-sizing:border-box}body{padding:32px;color:#111827;font:12px Arial,sans-serif}header{border-bottom:2px solid #c2410c;padding-bottom:12px;margin-bottom:20px}h1{margin:0;color:#c2410c;font-size:20px;text-transform:uppercase}h2{margin:18px 0 6px;font-size:12px;text-transform:uppercase}.meta{display:grid;grid-template-columns:2fr 1fr;gap:12px}.box,.details{border:1px solid #cbd5e1;padding:10px}.label{display:block;color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin:0;text-align:center}th,td{border:1px solid #94a3b8;padding:9px 6px}th{background:#f1f5f9;font-size:10px;text-transform:uppercase}td:first-child{color:#c2410c;font-weight:700}.addition{border:1px solid #cbd5e1;padding:9px;margin-top:12px}.details{line-height:1.7;margin-top:18px}.signature{width:280px;margin:72px 0 0 auto;border-top:1px solid #111827;padding-top:6px;text-align:center}@page{margin:18mm}@media print{body{padding:0}}</style></head><body>
  <header><h1>${escapeHtml(data?.titulo || EMPTY_FORM.titulo)}</h1></header><div class="meta"><div class="box"><span class="label">Paciente</span><strong>${escapeHtml(consultation?.patientName || 'Paciente não informado')}</strong></div><div class="box"><span class="label">Emissão</span><strong>${formatDate(data?.data)}</strong></div></div>
  ${grid('Para Longe')}${isNearMode ? `<div class="addition"><strong>Adição:</strong> ${cell(data?.adicao)}</div>${grid('Para Perto', 'perto_')}` : ''}
  <div class="details"><div><strong>Lente recomendada:</strong> ${cell(data?.lente)}</div><div><strong>Retorno:</strong> ${data?.retorno ? formatDate(data.retorno) : '-'}</div>${observations ? `<div><strong>Observações:</strong> ${observations}</div>` : ''}</div>
  <div class="signature"><strong>${escapeHtml(consultation?.doctor || 'Profissional não informado')}</strong><br>Profissional responsável</div></body></html>`;
}

export default function PrescricaoOculosTab({ consultation, disabled = false, onNotify }) {
  const [subTab, setSubTab] = useState('atual');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [printingId, setPrintingId] = useState(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async (signal) => {
    if (!consultation?.id) return [];
    const loaded = await listarPrescricoesConsulta(consultation.id, { signal });
    setItems(loaded);
    return loaded;
  }, [consultation?.id]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setItems([]); setEditingId(null); setForm(EMPTY_FORM);
    load(controller.signal).catch((error) => {
      if (error?.code !== 'ERR_CANCELED') onNotify?.('error', errorMessage(error, 'Não foi possível carregar as prescrições.'));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [load, onNotify]);

  const updateEye = (eye, field, value) => setForm((current) => ({
    ...current, [eye]: { ...current[eye], [field]: value },
  }));
  const updateNearEye = (eye, field, value) => setForm((current) => ({
    ...current, perto: { ...current.perto, [eye]: { ...current.perto[eye], [field]: value } },
  }));

  const startNew = () => { setEditingId(null); setForm(EMPTY_FORM); setSaved(false); setSubTab('atual'); };
  const edit = (item) => { setEditingId(item.id); setForm(toForm(item)); setSaved(false); setSubTab('atual'); };

  const importRx = async () => {
    if (disabled || importing) return;
    setImporting(true);
    try {
      const response = await obterSecaoFichaClinica(consultation.id, 'rx_final');
      const content = response?.conteudo && typeof response.conteudo === 'object' ? response.conteudo : {};
      const od = content.od && typeof content.od === 'object' ? content.od : {};
      const oe = content.oe && typeof content.oe === 'object' ? content.oe : {};
      const lens = [content.tipo_lente, content.filtro, content.cor, content.tratamento].filter(Boolean).join(' - ');
      setForm((current) => ({
        ...current,
        od: { ...current.od, esferico: od.esferico ?? '', cilindrico: od.cilindrico ?? '', eixo: od.eixo ?? '', av: od.av_longe ?? '', dnp: od.dnp ?? '' },
        oe: { ...current.oe, esferico: oe.esferico ?? '', cilindrico: oe.cilindrico ?? '', eixo: oe.eixo ?? '', av: oe.av_longe ?? '', dnp: oe.dnp ?? '' },
        adicao: content.adicao ?? '', lente: lens, observacoes: content.observacoes ?? '',
      }));
    } catch (error) { onNotify?.('error', errorMessage(error, 'Não foi possível importar o RX Final.')); }
    finally { setImporting(false); }
  };

  const save = async () => {
    if (disabled || saving) return;
    if (!form.titulo.trim()) { onNotify?.('error', 'Informe o título da prescrição.'); return; }
    setSaving(true); setSaved(false);
    try {
      const result = editingId
        ? await atualizarPrescricaoConsulta(consultation.id, editingId, toPayload(form))
        : await criarPrescricaoConsulta(consultation.id, toPayload(form));
      const savedId = editingId || result?.id;
      const loaded = await load();
      const item = loaded.find((current) => String(current.id) === String(savedId));
      if (item) { setEditingId(item.id); setForm(toForm(item)); }
      setSaved(true); window.setTimeout(() => setSaved(false), 3500);
    } catch (error) { onNotify?.('error', errorMessage(error, 'Não foi possível salvar a prescrição.')); }
    finally { setSaving(false); }
  };

  const print = async (id) => {
    if (!id || printingId) return;
    const popup = window.open('', '_blank', 'width=960,height=720');
    if (!popup) { onNotify?.('error', 'O navegador bloqueou a janela de impressão.'); return; }
    setPrintingId(id); popup.document.write('<p style="font-family:Arial;padding:24px">Preparando impressão...</p>');
    try {
      const data = await obterImpressaoPrescricao(id);
      popup.document.open(); popup.document.write(printHtml(data, consultation)); popup.document.close(); popup.focus();
      window.setTimeout(() => popup.print(), 250);
    } catch (error) { popup.close(); onNotify?.('error', errorMessage(error, 'Não foi possível preparar a impressão.')); }
    finally { setPrintingId(null); }
  };

  const inputClass = 'clinical-input text-center font-mono font-bold min-w-20';

  return (
    <section className="clinical-panel text-xs animate-fade-in overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSubTab('atual')}
            className={`px-3.5 py-1.5 font-bold rounded-lg whitespace-nowrap transition-all ${subTab === 'atual' ? 'bg-forest-700 text-white shadow-hairline' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Prescrição Atual
          </button>
          <button
            type="button"
            onClick={() => setSubTab('historico')}
            className={`px-3.5 py-1.5 font-bold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap transition-all ${subTab === 'historico' ? 'bg-forest-700 text-white shadow-hairline' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico ({items.length})</span>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={startNew}
            disabled={disabled || saving}
            className="btn-secondary py-1.5 px-3"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova</span>
          </button>
          {subTab === 'atual' && (
            <>
              <button
                type="button"
                onClick={importRx}
                disabled={disabled || importing || saving}
                className="btn-secondary py-1.5 px-3"
              >
                {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-forest-700" /> : <Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                <span>Importar RX Final</span>
              </button>
              <button
                type="button"
                onClick={() => print(editingId)}
                disabled={!editingId || Boolean(printingId)}
                className="btn-secondary py-1.5 px-3"
              >
                {printingId === editingId ? <Loader2 className="w-3.5 h-3.5 animate-spin text-forest-700" /> : <Printer className="w-3.5 h-3.5" />}
                <span>Imprimir</span>
              </button>
              <button
                type="button"
                onClick={save}
                disabled={disabled || loading || saving}
                className="btn-primary py-1.5 px-3"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saving ? 'Salvando...' : saved ? 'Salvo com sucesso' : 'Salvar Prescrição'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {subTab === 'atual' ? (
        <fieldset disabled={disabled || loading || saving} className="p-5 sm:p-6 space-y-5 disabled:opacity-75">
          {loading ? (
            <Loading label="Carregando prescrições..." />
          ) : (
            <>
              <div className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>{editingId ? `Editando prescrição #${editingId}` : 'Nova Prescrição'}</span>
              </div>

              <div className="inline-flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60" role="group" aria-label="Modo da prescrição">
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, modo: 'longe' }))}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${form.modo === 'longe' ? 'bg-forest-700 text-white shadow-hairline' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Longe
                </button>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, modo: 'longe_perto' }))}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${form.modo === 'longe_perto' ? 'bg-forest-700 text-white shadow-hairline' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Longe / Perto
                </button>
              </div>

              <label className="block max-w-xl">
                <Label>Título da Prescrição</Label>
                <input
                  type="text"
                  maxLength={120}
                  value={form.titulo}
                  onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))}
                  className="clinical-input font-bold"
                />
              </label>

              <PrescriptionGrid title="Para Longe" values={form} onChange={updateEye} inputClass={inputClass} />

              {form.modo === 'longe_perto' && (
                <>
                  <label className="block max-w-xs">
                    <Label>Adição (D)</Label>
                    <input
                      type="text"
                      maxLength={20}
                      value={form.adicao}
                      onChange={(event) => setForm((current) => ({ ...current, adicao: event.target.value }))}
                      className="clinical-input font-mono font-bold"
                    />
                  </label>
                  <PrescriptionGrid title="Para Perto" values={form.perto} onChange={updateNearEye} inputClass={inputClass} />
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <label className="md:col-span-2">
                  <Label>Lente recomendada</Label>
                  <input
                    type="text"
                    maxLength={120}
                    value={form.lente}
                    onChange={(event) => setForm((current) => ({ ...current, lente: event.target.value }))}
                    className="clinical-input font-medium"
                  />
                </label>
                <label>
                  <Label>Retorno Clínico</Label>
                  <input
                    type="date"
                    value={form.retorno}
                    onChange={(event) => setForm((current) => ({ ...current, retorno: event.target.value }))}
                    className="clinical-input font-medium"
                  />
                </label>
              </div>

              <label className="block">
                <Label>Observações clínicas para a ótica</Label>
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={form.observacoes}
                  onChange={(event) => setForm((current) => ({ ...current, observacoes: event.target.value }))}
                  className="clinical-input p-3"
                />
              </label>
            </>
          )}
        </fieldset>
      ) : (
        <div className="p-5 sm:p-6">
          {loading ? (
            <Loading label="Carregando histórico..." />
          ) : items.length === 0 ? (
            <div className="min-h-40 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center font-bold text-slate-400">
              Nenhuma prescrição cadastrada
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden shadow-hairline">
              {items.map((item) => (
                <article key={item.id} className="p-4 sm:p-5 space-y-3 hover:bg-forest-50/20 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900">
                        #{item.id} · {item.titulo || EMPTY_FORM.titulo}
                      </div>
                      <div className="mt-0.5 text-[10.5px] text-slate-400">
                        Emitida em {formatDate(item.data)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => edit(item)}
                        disabled={disabled}
                        title="Editar prescrição"
                        className="btn-secondary p-2"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => print(item.id)}
                        disabled={Boolean(printingId)}
                        title="Imprimir prescrição"
                        className="btn-secondary p-2"
                      >
                        {printingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-forest-700" /> : <Printer className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 font-mono text-[11px]">
                    <EyeSummary eye="OD" item={item} />
                    <EyeSummary eye="OE" item={item} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Label({ children }) {
  return <span className="clinical-label">{children}</span>;
}

function Loading({ label }) {
  return (
    <div className="min-h-40 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
      <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
      <span>{label}</span>
    </div>
  );
}

function EyeSummary({ eye, item }) {
  const prefix = eye.toLowerCase();
  return (
    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3">
      <strong className="text-forest-800 font-bold">{eye}:</strong> ESF {item[`${prefix}_esferico`] || '-'} · CIL {item[`${prefix}_cilindrico`] || '-'} · EIXO {item[`${prefix}_eixo`] || '-'} · AV {item[`${prefix}_av`] || '-'}
    </div>
  );
}

function PrescriptionGrid({ title, values, onChange, inputClass }) {
  return (
    <div className="space-y-1.5">
      <div className="px-4 py-2 bg-slate-50/80 border border-slate-200/80 rounded-t-xl font-bold text-xs text-slate-800 uppercase tracking-wider">
        {title}
      </div>
      <div className="overflow-x-auto border border-slate-200/80 rounded-b-xl shadow-hairline">
        <table className="w-full min-w-[820px] border-collapse text-center">
          <thead>
            <tr className="bg-slate-50/40 border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-600">
              <th className="px-3 py-2.5 text-left border-r border-slate-200/80">Olho</th>
              {EYE_FIELDS.map(([field, label]) => (
                <th key={field} className="px-2 py-2.5 border-r border-slate-200/80 last:border-r-0">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {['od', 'oe'].map((eye) => (
              <tr key={eye} className="hover:bg-forest-50/10">
                <td className="px-3 py-2.5 text-left font-bold uppercase text-forest-800 border-r border-slate-200/80">
                  {eye}
                </td>
                {EYE_FIELDS.map(([field, , type]) => (
                  <td key={field} className="p-1.5 border-r border-slate-200/80 last:border-r-0">
                    <input
                      type={type || 'text'}
                      min={field === 'eixo' ? 0 : undefined}
                      max={field === 'eixo' ? 180 : undefined}
                      maxLength={type ? undefined : 20}
                      value={values[eye][field]}
                      onChange={(event) => onChange(eye, field, event.target.value)}
                      className={inputClass}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

