import { useCallback, useEffect, useState } from 'react';
import { Check, History, Loader2, Lock, Pencil, Printer, RotateCcw, Save, Unlock } from 'lucide-react';
import {
  atualizarPrescricaoConsulta,
  criarPrescricaoConsulta,
  listarPrescricoesConsulta,
} from '../../../api/consultas';
import { obterDadosClinica } from '../../../api/configuracoes';
import { formatCPF, formatCNPJ, formatCEP, formatPhone, formatDiopter, formatAxis } from '../../../utils/formatters';

const EMPTY_EYE = { esferico: '', cilindrico: '', eixo: '', av: '', prisma: '', dnp: '' };
const EMPTY_FORM = {
  titulo: 'Prescrição para Óculos', od: { ...EMPTY_EYE }, oe: { ...EMPTY_EYE },
  modo: 'longe', perto: { od: { ...EMPTY_EYE }, oe: { ...EMPTY_EYE } },
  adicao: '', lente: '', observacoes: '',
};
const EYE_FIELDS = [
  ['esferico', 'Esférico (D)', 'number', '0.25'],
  ['cilindrico', 'Cilíndrico (D)', 'number', '0.25'],
  ['eixo', 'Eixo (°)', 'number', '1'],
  ['av', 'Acuidade Visual', 'text'],
  ['prisma', 'Prisma', 'text'],
  ['dnp', 'DNP (mm)', 'text'],
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

function calculateNearEye(farEye, addition, currentNearEye = {}) {
  const addStr = String(addition ?? '').trim().replace(',', '.');
  const addNum = parseFloat(addStr);

  let nearEsf = currentNearEye.esferico ?? '';
  if (!Number.isNaN(addNum)) {
    const farEsfStr = String(farEye?.esferico ?? '').trim().replace(',', '.');
    const farEsfNum = farEsfStr === '' ? 0 : parseFloat(farEsfStr);
    if (!Number.isNaN(farEsfNum)) {
      nearEsf = formatDiopter(farEsfNum + addNum);
    }
  }

  // DNP perto com redução fisiológica de 2mm se DNP de longe existir
  let nearDnp = currentNearEye.dnp ?? '';
  const farDnpNum = parseFloat(String(farEye?.dnp ?? '').trim().replace(',', '.'));
  if (!Number.isNaN(farDnpNum) && farDnpNum > 0) {
    nearDnp = (farDnpNum - 2).toFixed(1);
  } else if (farEye?.dnp) {
    nearDnp = farEye.dnp;
  }

  return {
    ...currentNearEye,
    esferico: nearEsf,
    cilindrico: farEye?.cilindrico ?? currentNearEye.cilindrico ?? '',
    eixo: farEye?.eixo ?? currentNearEye.eixo ?? '',
    prisma: farEye?.prisma ?? currentNearEye.prisma ?? '',
    dnp: nearDnp,
    av: currentNearEye.av ?? '',
  };
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
    lente: item.lente || '', observacoes: item.observacoes || '',
  };
}

function toPayload(form) {
  return {
    titulo: form.titulo.trim(),
    modo: form.modo,
    ...Object.fromEntries(['od', 'oe'].flatMap((eye) => EYE_FIELDS.map(([field]) => [`${eye}_${field}`, form[eye][field]]))),
    ...Object.fromEntries(['od', 'oe'].flatMap((eye) => EYE_FIELDS.map(([field]) => [`${eye}_perto_${field}`, form.perto[eye][field]]))),
    adicao: form.adicao, lente: form.lente, observacoes: form.observacoes,
  };
}

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function generatePrescriptionHtml(form, consultation, clinicInfo) {
  const cell = (value, fallback = '—') => escapeHtml(String(value || '').trim() || fallback);
  const observations = escapeHtml(form?.observacoes || '').replaceAll('\n', '<br>');
  const isNearMode = form?.modo === 'longe_perto';
  
  const addressLine = [
    clinicInfo?.address,
    clinicInfo?.city && clinicInfo?.state ? `${clinicInfo.city} - ${clinicInfo.state}` : (clinicInfo?.city || clinicInfo?.state),
    clinicInfo?.cep ? `CEP: ${formatCEP(clinicInfo.cep)}` : null,
    clinicInfo?.phone ? `Tel/WhatsApp: ${formatPhone(clinicInfo.phone)}` : null,
  ].filter(Boolean).join(' • ');

  const grid = (title, data) => `
    <div style="margin-top: 16px;">
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-bottom: none; padding: 6px 12px; font-weight: bold; font-size: 11px; text-transform: uppercase; color: #1e293b;">
        ${title}
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 11.5px;">
        <thead>
          <tr style="background: #f1f5f9; text-transform: uppercase; font-size: 10px; color: #475569;">
            <th style="border: 1px solid #cbd5e1; padding: 8px 6px; width: 60px;">Olho</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 6px;">Esférico</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 6px;">Cilíndrico</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 6px;">Eixo</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 6px;">AV</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 6px;">Prisma</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 6px;">DNP</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 6px; font-weight: bold; color: #065f46; background: #f0fdf4;">OD</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 6px; font-family: monospace; font-weight: bold;">${cell(data?.od?.esferico, 'Plano')}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 6px; font-family: monospace;">${cell(data?.od?.cilindrico)}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 6px; font-family: monospace;">${cell(data?.od?.eixo ? `${data.od.eixo}°` : '')}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 6px; font-family: monospace;">${cell(data?.od?.av)}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 6px; font-family: monospace;">${cell(data?.od?.prisma)}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 6px; font-family: monospace;">${cell(data?.od?.dnp)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 6px; font-weight: bold; color: #065f46; background: #f0fdf4;">OE</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 6px; font-family: monospace; font-weight: bold;">${cell(data?.oe?.esferico, 'Plano')}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 6px; font-family: monospace;">${cell(data?.oe?.cilindrico)}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 6px; font-family: monospace;">${cell(data?.oe?.eixo ? `${data.oe.eixo}°` : '')}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 6px; font-family: monospace;">${cell(data?.oe?.av)}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 6px; font-family: monospace;">${cell(data?.oe?.prisma)}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 6px; font-family: monospace;">${cell(data?.oe?.dnp)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  return `<!doctype html>
  <html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(form?.titulo || 'Prescrição para Óculos')}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: Arial, Helvetica, sans-serif;
        color: #0f172a;
        background: #ffffff;
        padding: 24px;
        font-size: 12px;
        line-height: 1.4;
      }
      @page {
        margin: 12mm 15mm 15mm 15mm;
        size: auto;
      }
      @media print {
        body { padding: 0; background: #ffffff !important; }
      }
    </style>
  </head>
  <body>
    <!-- Cabeçalho Institucional -->
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #065f46; padding-bottom: 12px; margin-bottom: 16px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="/logo-centro-visao.png" alt="Centro Visão" style="width: 48px; height: 48px; object-fit: contain;" />
        <div>
          <h1 style="font-size: 16px; font-weight: bold; text-transform: uppercase; color: #064e3b; letter-spacing: 0.5px;">
            ${escapeHtml(clinicInfo?.name || 'CENTRO VISÃO')}
          </h1>
          ${clinicInfo?.cnpj ? `<div style="font-size: 10px; color: #334155; font-family: monospace; font-weight: bold; margin-top: 2px;">CNPJ: ${escapeHtml(formatCNPJ(clinicInfo.cnpj))}</div>` : ''}
          ${addressLine ? `<div style="font-size: 9.5px; color: #64748b; font-family: monospace; margin-top: 2px;">${escapeHtml(addressLine)}</div>` : ''}
        </div>
      </div>
      <div style="text-align: right; font-size: 10px; color: #64748b;">
        <div style="font-weight: bold; color: #0f172a; text-transform: uppercase;">Receituário Óptico</div>
        <div>Emissão: ${new Date().toLocaleDateString('pt-BR')}</div>
      </div>
    </div>

    <!-- Título do Documento -->
    <div style="text-align: center; margin-bottom: 16px;">
      <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; color: #0f172a; letter-spacing: 1px;">
        ${escapeHtml(form?.titulo || 'Prescrição para Óculos')}
      </h2>
    </div>

    <!-- Dados do Paciente -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; display: grid; grid-template-columns: 2fr 1fr; gap: 12px; font-size: 11px;">
      <div>
        <span style="font-size: 9.5px; font-weight: bold; text-transform: uppercase; color: #64748b; display: block;">Paciente</span>
        <strong style="font-size: 12px; color: #0f172a;">${escapeHtml(consultation?.patientName || 'Paciente não informado')}</strong>
      </div>
      <div>
        <span style="font-size: 9.5px; font-weight: bold; text-transform: uppercase; color: #64748b; display: block;">Data da Consulta</span>
        <span style="font-family: monospace; color: #334155;">${escapeHtml(consultation?.date ? new Date(consultation.date).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'))}</span>
      </div>
    </div>

    <!-- Grade Refrativa (Para Longe) -->
    ${grid('Visão de Longe', form)}

    <!-- Se tiver modo longe e perto -->
    ${isNearMode ? `
      <div style="margin-top: 12px; padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 11.5px;">
        <strong style="color: #065f46;">Adição:</strong> <span style="font-family: monospace; font-weight: bold;">${cell(form?.adicao)}</span>
      </div>
      ${grid('Visão de Perto', { od: form?.perto?.od, oe: form?.perto?.oe })}
    ` : ''}

    <!-- Detalhes da Lente e Observações -->
    <div style="margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; background: #ffffff; font-size: 11px;">
      ${form?.lente ? `<div style="margin-bottom: 6px;"><strong>Lente Recomendada:</strong> ${cell(form.lente)}</div>` : ''}
      ${observations ? `<div><strong>Observações:</strong> <span style="color: #334155;">${observations}</span></div>` : ''}
    </div>

    <!-- Validade e Assinatura -->
    <div style="margin-top: 48px; display: flex; align-items: flex-end; justify-content: space-between; font-size: 10px;">
      <div style="color: #64748b;">
        <div>Validade desta prescrição: 12 meses a contar da data de emissão.</div>
        <div style="margin-top: 2px;">Prescrição emitida via sistema eletrônico Centro Visão.</div>
      </div>
      <div style="text-align: center; width: 240px;">
        <div style="border-bottom: 1px solid #0f172a; margin-bottom: 6px;"></div>
        <div style="font-weight: bold; color: #0f172a; font-size: 11px;">Optometrista Responsável</div>
      </div>
    </div>
  </body>
  </html>`;
}

function printViaIframe(html) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 250);
}

export default function PrescricaoOculosTab({ consultation, disabled = false, onNotify }) {
  const [subTab, setSubTab] = useState('atual');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isEditingManual, setIsEditingManual] = useState(false);
  const [backupForm, setBackupForm] = useState(null);
  const [clinicInfo, setClinicInfo] = useState({ name: '', cnpj: '', phone: '', address: '', city: '', state: '', cep: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [printingId, setPrintingId] = useState(null);
  const [saved, setSaved] = useState(false);

  // Carrega dados da clínica
  useEffect(() => {
    const controller = new AbortController();
    obterDadosClinica({ signal: controller.signal })
      .then((data) => {
        setClinicInfo({
          name: data?.nome || data?.name || '',
          cnpj: data?.cnpj || '',
          phone: data?.telefone || data?.phone || '',
          address: data?.endereco || data?.address || '',
          city: data?.cidade || data?.city || '',
          state: data?.estado || data?.state || '',
          cep: data?.cep || '',
        });
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const load = useCallback(async (signal) => {
    if (!consultation?.id) return [];
    const loaded = await listarPrescricoesConsulta(consultation.id, { signal });
    setItems(loaded);
    return loaded;
  }, [consultation?.id]);

  const reloadPrescription = useCallback((signal) => {
    setLoading(true);
    load(signal)
      .then((loaded) => {
        if (loaded && loaded.length > 0) {
          setEditingId(loaded[0].id);
          setForm(toForm(loaded[0]));
        } else {
          setEditingId(null);
          setForm(EMPTY_FORM);
        }
      })
      .catch((error) => {
        if (error?.code !== 'ERR_CANCELED') onNotify?.('error', errorMessage(error, 'Não foi possível carregar as prescrições.'));
      })
      .finally(() => { setLoading(false); });
  }, [load, onNotify]);

  useEffect(() => {
    const controller = new AbortController();
    reloadPrescription(controller.signal);
    return () => controller.abort();
  }, [reloadPrescription]);

  // Escuta atualizações automáticas vindas do RX Final da Ficha Clínica
  useEffect(() => {
    const handlePrescriptionUpdated = (event) => {
      if (!event.detail?.consultationId || String(event.detail.consultationId) === String(consultation?.id)) {
        reloadPrescription();
      }
    };
    window.addEventListener('prescription-updated', handlePrescriptionUpdated);
    return () => window.removeEventListener('prescription-updated', handlePrescriptionUpdated);
  }, [consultation?.id, reloadPrescription]);

  const updateEye = (eye, field, value) => {
    setForm((current) => {
      const updatedEye = { ...current[eye], [field]: value };
      const nextForm = { ...current, [eye]: updatedEye };

      if (nextForm.modo === 'longe_perto' && nextForm.adicao) {
        nextForm.perto = {
          ...nextForm.perto,
          [eye]: calculateNearEye(updatedEye, nextForm.adicao, nextForm.perto[eye]),
        };
      }

      return nextForm;
    });
  };

  const updateAddition = (newAddition) => {
    setForm((current) => {
      const nextForm = { ...current, adicao: newAddition };
      if (nextForm.modo === 'longe_perto' && newAddition) {
        nextForm.perto = {
          od: calculateNearEye(nextForm.od, newAddition, nextForm.perto.od),
          oe: calculateNearEye(nextForm.oe, newAddition, nextForm.perto.oe),
        };
      }
      return nextForm;
    });
  };

  const updateNearEye = (eye, field, value) => setForm((current) => ({
    ...current, perto: { ...current.perto, [eye]: { ...current.perto[eye], [field]: value } },
  }));

  const handleStartManualEdit = () => {
    setBackupForm(JSON.parse(JSON.stringify(form)));
    setIsEditingManual(true);
  };

  const handleCancelManualEdit = () => {
    if (backupForm) setForm(backupForm);
    setIsEditingManual(false);
    setBackupForm(null);
  };

  const edit = (item) => {
    setEditingId(item.id);
    setForm(toForm(item));
    setSaved(false);
    setIsEditingManual(false);
    setSubTab('atual');
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
      setIsEditingManual(false);
      setBackupForm(null);
      onNotify?.('success', 'Prescrição salva com sucesso.');
    } catch (error) { onNotify?.('error', errorMessage(error, 'Não foi possível salvar a prescrição.')); }
    finally { setSaving(false); }
  };

  const handlePrintCurrent = () => {
    if (printingId) return;
    setPrintingId(editingId || 'current');
    try {
      const html = generatePrescriptionHtml(form, consultation, clinicInfo);
      printViaIframe(html);
    } catch (error) {
      onNotify?.('error', 'Não foi possível preparar a impressão.');
    } finally {
      setPrintingId(null);
    }
  };

  const handlePrintItem = (item) => {
    if (printingId) return;
    setPrintingId(item.id);
    try {
      const formItem = toForm(item);
      const html = generatePrescriptionHtml(formItem, consultation, clinicInfo);
      printViaIframe(html);
    } catch (error) {
      onNotify?.('error', 'Não foi possível preparar a impressão.');
    } finally {
      setPrintingId(null);
    }
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
          {subTab === 'atual' && (
            <>
              {!isEditingManual ? (
                <button
                  type="button"
                  onClick={handleStartManualEdit}
                  disabled={disabled || loading || saving}
                  className="btn-secondary py-1.5 px-3 flex items-center gap-1.5"
                  title="Destravar campos para edição manual da prescrição"
                >
                  <Pencil className="w-3.5 h-3.5 text-forest-700" />
                  <span>Editar Prescrição</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancelManualEdit}
                    disabled={saving}
                    className="btn-secondary py-1.5 px-3 flex items-center gap-1.5 text-slate-600"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Cancelar</span>
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={disabled || loading || saving}
                    className="btn-primary py-1.5 px-3 flex items-center gap-1.5"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{saving ? 'Salvando...' : saved ? 'Salvo com sucesso' : 'Salvar Alterações'}</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handlePrintCurrent}
                disabled={disabled || loading || Boolean(printingId)}
                className="btn-secondary py-1.5 px-3 flex items-center gap-1.5"
                title="Imprimir prescrição atual"
              >
                {printingId ? <Loader2 className="w-3.5 h-3.5 animate-spin text-forest-700" /> : <Printer className="w-3.5 h-3.5" />}
                <span>Imprimir</span>
              </button>
            </>
          )}
        </div>
      </div>

      {subTab === 'atual' ? (
        <fieldset disabled={disabled || loading || saving || !isEditingManual} className="p-5 sm:p-6 space-y-5 disabled:opacity-85">
          {loading ? (
            <Loading label="Carregando prescrições..." />
          ) : (
            <>
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    {editingId ? `Prescrição da Consulta #${editingId}` : 'Prescrição da Consulta'}
                  </span>
                  {isEditingManual ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                      <Unlock className="w-3 h-3 text-amber-600" />
                      Edição Manual Ativa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-forest-800 bg-forest-50 border border-forest-200 px-2 py-0.5 rounded-md">
                      <Lock className="w-3 h-3 text-forest-600" />
                      Modo Consulta (Sincronizado com RX Final)
                    </span>
                  )}
                </div>
                {!isEditingManual && (
                  <p className="text-[11px] text-slate-500 italic">
                    Para editar os dados, clique em &ldquo;Editar Prescrição&rdquo; ou ajuste o RX Final na Ficha Clínica.
                  </p>
                )}
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
                  onClick={() => setForm((current) => {
                    const nextAddition = current.adicao || '1.00';
                    return {
                      ...current,
                      modo: 'longe_perto',
                      adicao: nextAddition,
                      perto: {
                        od: calculateNearEye(current.od, nextAddition, current.perto?.od),
                        oe: calculateNearEye(current.oe, nextAddition, current.perto?.oe),
                      },
                    };
                  })}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${form.modo === 'longe_perto' ? 'bg-forest-700 text-white shadow-hairline' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Longe e Perto
                </button>
              </div>

              <PrescriptionGrid
                title="Visão de Longe"
                values={form}
                onChange={updateEye}
                inputClass={inputClass}
              />

              {form.modo === 'longe_perto' && (
                <>
                  <label className="block max-w-xs">
                    <Label>Adição (D)</Label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      value={form.adicao}
                      onFocus={() => {
                        if (!form.adicao) {
                          updateAddition('1.00');
                        }
                      }}
                      onChange={(event) => updateAddition(event.target.value)}
                      onBlur={(event) => {
                        const formatted = formatDiopter(event.target.value);
                        updateAddition(formatted);
                      }}
                      className="clinical-input font-mono font-bold text-center"
                      placeholder="1.00"
                    />
                  </label>

                  <PrescriptionGrid
                    title="Visão de Perto"
                    values={form.perto}
                    onChange={updateNearEye}
                    inputClass={inputClass}
                  />
                </>
              )}

              <label className="block">
                <Label>Lente recomendada e tratamentos</Label>
                <input
                  type="text"
                  maxLength={255}
                  value={form.lente}
                  onChange={(event) => setForm((current) => ({ ...current, lente: event.target.value }))}
                  className="clinical-input"
                  placeholder="Ex.: Multifocal Digital - Antirreflexo Crizal"
                />
              </label>

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
                        onClick={() => handlePrintItem(item)}
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
                {EYE_FIELDS.map(([field, , type, step]) => (
                  <td key={field} className="p-1.5 border-r border-slate-200/80 last:border-r-0">
                    <input
                      type={type || 'text'}
                      step={step}
                      min={field === 'eixo' ? 0 : undefined}
                      max={field === 'eixo' ? 180 : undefined}
                      maxLength={type ? undefined : 20}
                      value={values[eye][field]}
                      onChange={(event) => onChange(eye, field, event.target.value)}
                      onBlur={(event) => {
                        if (field === 'esferico' || field === 'cilindrico') {
                          onChange(eye, field, formatDiopter(event.target.value));
                        } else if (field === 'eixo') {
                          onChange(eye, field, formatAxis(event.target.value));
                        }
                      }}
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

