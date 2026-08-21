import { useCallback, useEffect, useRef, useState } from 'react';
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Check, FilePlus2, History, Italic, List, ListOrdered, Loader2, Printer, Save } from 'lucide-react';
import {
  atualizarDocumentoConsulta, criarDocumentoConsulta, emitirDocumentoConsulta,
  listarDocumentosConsulta, obterDocumentoConsulta, obterImpressaoDocumento, obterSecaoFichaClinica,
} from '../../../api/consultas';
import { obterDadosClinica } from '../../../api/configuracoes';
import { formatCPF, formatPhone } from '../../../utils/formatters';

const TYPES = [
  { code: 'atestado', label: 'Atestado' }, { code: 'laudo', label: 'Laudo' },
  { code: 'declaracao', label: 'Declaração' }, { code: 'termo_autorizacao', label: 'Termo de Autorização' },
  { code: 'encaminhamento', label: 'Encaminhamento' },
];

const errorMessage = (error) => error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || 'Não foi possível concluir a operação.';
const esc = (value) => String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function formatDate(value = new Date(), long = false) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', long ? { day: '2-digit', month: 'long', year: 'numeric' } : undefined);
}

function ageFrom(value) {
  if (!value) return '';
  const birth = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age -= 1;
  return `${age} ${age === 1 ? 'ano' : 'anos'}`;
}

function sanitizeHtml(html) {
  const doc = new DOMParser().parseFromString(`<div>${html || ''}</div>`, 'text/html');
  const allowed = new Set(['DIV', 'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'H1', 'H2', 'H3', 'UL', 'OL', 'LI', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'SPAN', 'SMALL']);
  [...doc.body.querySelectorAll('*')].forEach((node) => {
    if (!allowed.has(node.tagName)) { node.replaceWith(...node.childNodes); return; }
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if ((name === 'colspan' || name === 'rowspan') && /^\d{1,2}$/.test(attribute.value)) return;
      if (name === 'style') {
        const match = attribute.value.match(/text-align\s*:\s*(left|center|right|justify)/i);
        if (match) node.setAttribute('style', `text-align: ${match[1].toLowerCase()}`);
        else node.removeAttribute(attribute.name);
        return;
      }
      node.removeAttribute(attribute.name);
    });
  });
  return doc.body.firstElementChild?.innerHTML || '';
}

const header = (title, clinic) => `<div style="text-align: center"><h1>${esc(clinic?.nome || 'CENTRO VISÃO OPTOMETRIA')}</h1><h2>${esc(title)}</h2></div>`;
const signature = (consultation) => `<div style="text-align: center"><p><br><br>________________________________________</p><p><strong>${esc(consultation.doctor)}</strong><br>Optometrista</p></div>`;
function clinicLocation(clinic) {
  const cityState = [clinic?.cidade, clinic?.estado].filter(Boolean).join(' - ');
  return [clinic?.endereco, cityState].filter(Boolean).join(', ');
}
function footer(clinic) {
  const contacts = [clinicLocation(clinic), clinic?.telefone ? `Tel. ${formatPhone(clinic.telefone)}` : ''].filter(Boolean).join(' • ');
  return `<p><br><br><small>O presente exame efetuado pelo optometrista, tem por finalidade a correção dos defeitos refrativos, a avaliação sensorial e motora, através da indicação de lentes corretivas refrativas e/ou exercícios ortópticos. O diagnósticos de doenças oculares e seu tratamento são de competência do profissional médico.${contacts ? `<br><br>${esc(contacts)}` : ''}</small></p>`;
}
const acuity = (data, correction, eye, distance) => esc(data?.[correction]?.[`${eye}_${distance}`] || '');

function createTemplate(type, consultation, visualAcuity = {}, clinic = {}) {
  const patient = esc(consultation.patientName);
  const cpf = esc(formatCPF(consultation.patientCpf) || 'não informado');
  const rg = esc(consultation.patientRg || 'não informado');
  const clinicCity = [clinic?.cidade, clinic?.estado].filter(Boolean).map(esc).join(' - ');
  const issued = `${clinicCity ? `${clinicCity}, ` : ''}${formatDate(new Date(), true)}`;

  if (type === 'laudo') return `${header('LAUDO OPTOMÉTRICO', clinic)}
    <p><strong>Paciente:</strong> ${patient} &nbsp;&nbsp; <strong>Idade:</strong> ${esc(ageFrom(consultation.patientBirthDate) || 'não informada')}</p>
    <table><thead><tr><th rowspan="2"></th><th colspan="2">LONGE</th><th colspan="2">PERTO</th></tr><tr><th>S/C</th><th>C/C</th><th>S/C</th><th>C/C</th></tr></thead><tbody>
    <tr><th>OD</th><td>${acuity(visualAcuity, 'sem_correcao', 'od', 'longe')}</td><td>${acuity(visualAcuity, 'com_correcao', 'od', 'longe')}</td><td>${acuity(visualAcuity, 'sem_correcao', 'od', 'perto')}</td><td>${acuity(visualAcuity, 'com_correcao', 'od', 'perto')}</td></tr>
    <tr><th>OE</th><td>${acuity(visualAcuity, 'sem_correcao', 'oe', 'longe')}</td><td>${acuity(visualAcuity, 'com_correcao', 'oe', 'longe')}</td><td>${acuity(visualAcuity, 'sem_correcao', 'oe', 'perto')}</td><td>${acuity(visualAcuity, 'com_correcao', 'oe', 'perto')}</td></tr>
    </tbody></table>${signature(consultation)}<p style="text-align: center">${issued}</p>${footer(clinic)}`;

  if (type === 'declaracao') return `${header('DECLARAÇÃO', clinic)}<p>Eu, <strong>${patient}</strong>, brasileiro(a), portador(a) do RG: <strong>${rg}</strong>, CPF: <strong>${cpf}</strong> declaro para devidos fins que recebi as informações devidas referente a realização do serviço optométrico prestado a mim (exame de vista), onde o mesmo custa o valor de R$ <strong>0,00</strong> (<strong>zero</strong>), e que a prescrição óptica estará a minha disposição mediante o pagamento da mesma. Sendo assim, fica esclarecido que a eventual compra de algum produto na ÓTICA foi de inteira escolha minha, isentando a empresa de quaisquer intenção de ferir o código de defesa do consumidor.</p><p>Assino abaixo e subscrevo:</p><p>${issued}.</p><div style="text-align: center"><p><br><br>________________________________________</p><p>${patient}</p></div>${footer(clinic)}`;
  if (type === 'termo_autorizacao') return `${header('TERMO DE AUTORIZAÇÃO', clinic)}<p>Recebi instruções sobre cuidado visual e me foi explicado os resultados do exame. Sou ciente de que o exame é praticado por um profissional da área da saúde não médico; Optometrista, o qual é o fisiologista visual, encarregado de prevenir, diagnosticar e tratar alterações do sistema visual e motor.</p><p><strong>Data:</strong> ${formatDate()}</p><p><br><strong>Assinatura:</strong> ________________________________________</p>${footer(clinic)}`;
  if (type === 'encaminhamento') return `${header('ENCAMINHAMENTO', clinic)}<p>Declaro ter sido orientado(a) a procurar um profissional médico por suspeita de alteração patológica, detectada no exame do Optometrista/Ortoptista/NeuroOptometrista e que a responsabilidade pela conduta clínica ficará a cargo do profissional médico escolhido por mim.</p><p><strong>Data:</strong> ${formatDate()}</p><p><br><strong>Assinatura:</strong> ________________________________________</p>${footer(clinic)}`;
  return `${header('ATESTADO', clinic)}<p style="text-align: center">Atesto, para os devidos fins, que <strong>${patient}</strong>, inscrito(a) no CPF ${cpf}, esteve sob meus cuidados e foi atendido(a) em ${formatDate(consultation.date)}, às ${esc(consultation.time)}, quando realizou exame optométrico para avaliação do sistema visual e motor.</p>${signature(consultation)}<p style="text-align: center">${issued}</p>${footer(clinic)}`;
}

function printDocument(data, popup) {
  popup.document.open();
  popup.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(data?.titulo || 'Documento clínico')}</title><style>
  @page{size:A4;margin:16mm}body{color:#1f2937;font:12px Arial,sans-serif;line-height:1.55;margin:0}h1{color:#173f7a;font-size:22px;margin:8px 0 2px}h2{font-size:17px;margin:4px 0 42px}p{margin:14px 0}ul{list-style:disc;padding-left:24px}ol{list-style:decimal;padding-left:24px}table{border-collapse:collapse;width:100%;margin:22px 0}th,td{border:1px solid #6b7280;padding:9px;text-align:center}th{background:#e5e7eb}small{display:block;border-top:1px solid #9ca3af;padding-top:10px;text-align:center;font-size:9px}</style></head><body>${sanitizeHtml(data?.conteudo)}<script>window.onload=()=>window.print();<\/script></body></html>`);
  popup.document.close();
}

const statusLabel = (status) => status === 'emitido' ? 'Emitido' : status === 'substituido' ? 'Substituído' : 'Rascunho';

export default function DocumentosAtestadosTab({ consultation, disabled = false, onNotify }) {
  const editorRef = useRef(null);
  const timerRef = useRef(null);
  const [view, setView] = useState('editor');
  const [type, setType] = useState('atestado');
  const [content, setContent] = useState('');
  const [visualAcuity, setVisualAcuity] = useState({});
  const [clinic, setClinic] = useState({});
  const [documents, setDocuments] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [originId, setOriginId] = useState(null);
  const [status, setStatus] = useState('rascunho');
  const [version, setVersion] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadDocuments = useCallback(async (signal) => {
    const items = await listarDocumentosConsulta(consultation.id, { signal });
    setDocuments(items);
    return items;
  }, [consultation.id]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    (async () => {
      await loadDocuments(controller.signal);
      try {
        const data = await obterSecaoFichaClinica(consultation.id, 'acuidade_visual', { signal: controller.signal });
        setVisualAcuity(data?.conteudo || {});
      } catch (error) {
        if (error?.code !== 'ERR_CANCELED') setVisualAcuity({});
      }
      setClinic(await obterDadosClinica({ signal: controller.signal }));
    })().catch((error) => { if (error?.code !== 'ERR_CANCELED') onNotify?.('error', errorMessage(error)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [consultation.id, loadDocuments, onNotify]);

  useEffect(() => { if (!loading && !content) setContent(createTemplate(type, consultation, visualAcuity, clinic)); }, [clinic, content, consultation, loading, type, visualAcuity]);
  useEffect(() => { if (!loading && editorRef.current && editorRef.current.innerHTML !== content) editorRef.current.innerHTML = content; }, [content, loading, view]);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const resetEditor = (nextType = type) => {
    setType(nextType); setContent(createTemplate(nextType, consultation, visualAcuity, clinic)); setCurrentId(null);
    setOriginId(null); setStatus('rascunho'); setVersion(1); setSaved(false); setView('editor');
  };
  const execute = (command) => { editorRef.current?.focus(); document.execCommand(command, false); setContent(editorRef.current?.innerHTML || ''); };

  const save = async () => {
    if (disabled || saving || status !== 'rascunho') return currentId;
    const clean = sanitizeHtml(editorRef.current?.innerHTML || content);
    if (!clean.trim()) { onNotify?.('error', 'O conteúdo do documento é obrigatório.'); return null; }
    setSaving(true); setSaved(false);
    try {
      const payload = { tipo: type, titulo: TYPES.find((item) => item.code === type)?.label, conteudo: clean, ...(originId ? { origem_id: Number(originId) } : {}) };
      const result = currentId ? await atualizarDocumentoConsulta(currentId, payload) : await criarDocumentoConsulta(consultation.id, payload);
      const id = currentId || result?.id;
      setCurrentId(id); setOriginId(null); setContent(clean); setSaved(true); await loadDocuments();
      window.clearTimeout(timerRef.current); timerRef.current = window.setTimeout(() => setSaved(false), 2500);
      return id;
    } catch (error) { onNotify?.('error', errorMessage(error)); return null; } finally { setSaving(false); }
  };

  const emitAndPrint = async () => {
    if (disabled || saving) return;
    const popup = window.open('', '_blank');
    if (!popup) { onNotify?.('error', 'O navegador bloqueou a janela de impressão.'); return; }
    popup.document.write('<p style="font-family:Arial;padding:24px">Preparando documento...</p>');
    try {
      const id = status === 'rascunho' ? await save() : currentId;
      if (!id) { popup.close(); return; }
      if (status === 'rascunho') await emitirDocumentoConsulta(id);
      printDocument(await obterImpressaoDocumento(id), popup); setStatus('emitido'); await loadDocuments();
      onNotify?.('success', 'Documento emitido e preparado para impressão.');
    } catch (error) { popup.close(); onNotify?.('error', errorMessage(error)); }
  };

  const openDocument = async (item, asVersion = false) => {
    setLoading(true);
    try {
      const data = await obterDocumentoConsulta(item.id);
      setType(data.tipo || 'atestado'); setContent(data.conteudo || ''); setView('editor');
      setCurrentId(asVersion ? null : data.id); setOriginId(asVersion ? data.id : null);
      setStatus(asVersion ? 'rascunho' : (data.status || 'rascunho')); setVersion((Number(data.versao) || 1) + (asVersion ? 1 : 0));
    } catch (error) { onNotify?.('error', errorMessage(error)); } finally { setLoading(false); }
  };

  const reprint = async (item) => {
    const popup = window.open('', '_blank');
    if (!popup) { onNotify?.('error', 'O navegador bloqueou a janela de impressão.'); return; }
    try { printDocument(await obterImpressaoDocumento(item.id), popup); } catch (error) { popup.close(); onNotify?.('error', errorMessage(error)); }
  };
  const readOnly = disabled || status !== 'rascunho';

  return (
    <section className="clinical-panel text-xs animate-fade-in overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto">
          <button
            type="button"
            onClick={() => setView('editor')}
            className={`h-8 px-3.5 text-xs font-bold rounded-lg transition-all ${view === 'editor' ? 'bg-forest-700 text-white shadow-hairline' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Documento
          </button>
          <button
            type="button"
            onClick={() => setView('history')}
            className={`h-8 px-3.5 text-xs font-bold rounded-lg inline-flex items-center gap-1.5 transition-all ${view === 'history' ? 'bg-forest-700 text-white shadow-hairline' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico</span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => resetEditor('atestado')}
          disabled={disabled}
          className="btn-secondary py-1.5 px-3"
        >
          <FilePlus2 className="w-3.5 h-3.5" />
          <span>Novo Documento</span>
        </button>
      </div>

      {loading ? (
        <div className="min-h-64 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
          <span>Carregando documentos...</span>
        </div>
      ) : view === 'editor' ? (
        <div className="p-5 lg:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <label className="w-full md:max-w-md">
              <span className="clinical-label">Modelo de Documento</span>
              <select
                value={type}
                onChange={(event) => resetEditor(event.target.value)}
                disabled={readOnly || Boolean(currentId)}
                className="clinical-input mt-1 font-semibold"
              >
                {TYPES.map((item) => (
                  <option key={item.code} value={item.code}>{item.label}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`h-8 px-3 rounded-full border text-[10px] font-bold uppercase inline-flex items-center ${status === 'emitido' ? 'bg-forest-50 text-forest-800 border-forest-200' : status === 'substituido' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                {statusLabel(status)} · v{version}
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="btn-primary py-1.5 px-3.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{saving ? 'Salvando...' : saved ? 'Salvo com sucesso' : 'Salvar Rascunho'}</span>
                </button>
              )}
              {!readOnly && (
                <button
                  type="button"
                  onClick={emitAndPrint}
                  disabled={saving}
                  className="btn-accent py-1.5 px-3.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Emitir e Imprimir</span>
                </button>
              )}
              {status !== 'rascunho' && (
                <button
                  type="button"
                  onClick={() => reprint({ id: currentId })}
                  className="btn-secondary py-1.5 px-3.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Reimprimir</span>
                </button>
              )}
            </div>
          </div>
          <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/50 shadow-hairline">
            <div className="h-10 px-3 border-b border-slate-200/80 bg-white flex items-center gap-1 overflow-x-auto">
              {[
                ['bold', Bold, 'Negrito'],
                ['italic', Italic, 'Itálico'],
                ['insertUnorderedList', List, 'Lista'],
                ['insertOrderedList', ListOrdered, 'Lista numerada'],
                ['justifyLeft', AlignLeft, 'Alinhar à esquerda'],
                ['justifyCenter', AlignCenter, 'Centralizar'],
                ['justifyRight', AlignRight, 'Alinhar à direita'],
                ['justifyFull', AlignJustify, 'Justificar'],
              ].map(([command, Icon, title]) => (
                <button
                  key={command}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => execute(command)}
                  disabled={readOnly}
                  title={title}
                  aria-label={title}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors disabled:text-slate-300"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <div className="p-4 md:p-6 overflow-x-auto">
              <div
                ref={editorRef}
                contentEditable={!readOnly}
                suppressContentEditableWarning
                onInput={(event) => setContent(event.currentTarget.innerHTML)}
                className="document-editor mx-auto min-h-[680px] w-full max-w-[794px] bg-white border border-slate-200/80 rounded-xl px-8 py-10 md:px-14 md:py-12 text-xs leading-relaxed text-slate-700 shadow-modal focus:outline-none focus:ring-2 focus:ring-forest-500/20 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-forest-900 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-2 [&_h2]:mb-8 [&_p]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_table]:w-full [&_table]:border-collapse [&_table]:my-6 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-2.5 [&_td]:border [&_td]:border-slate-300 [&_td]:p-2.5 [&_td]:text-center [&_small]:block [&_small]:border-t [&_small]:border-slate-200 [&_small]:pt-3 [&_small]:text-[10px] [&_small]:text-center"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 p-2">
          {documents.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-400">Nenhum documento salvo nesta consulta.</p>
          ) : (
            documents.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-forest-50/20 transition-colors rounded-xl">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-xs text-slate-900">{item.titulo || 'Documento clínico'}</strong>
                    <span className="text-[10px] border border-slate-200 bg-slate-100 px-2 py-0.5 font-bold uppercase rounded-full text-slate-600">
                      {statusLabel(item.status)} · v{item.versao || 1}
                    </span>
                  </div>
                  <p className="mt-1 text-[10.5px] text-slate-400">
                    Atualizado em {formatDate(item.atualizado_em || item.data_upload)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openDocument(item)}
                    className="btn-secondary py-1.5 px-3 text-xs"
                  >
                    {item.status === 'rascunho' ? 'Editar' : 'Visualizar'}
                  </button>
                  {item.status === 'emitido' && (
                    <button
                      type="button"
                      onClick={() => reprint(item)}
                      className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Reimprimir</span>
                    </button>
                  )}
                  {item.status === 'emitido' && !disabled && (
                    <button
                      type="button"
                      onClick={() => openDocument(item, true)}
                      className="btn-secondary py-1.5 px-3 text-xs text-forest-800 hover:bg-forest-50"
                    >
                      Nova versão
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
