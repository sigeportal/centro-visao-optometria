import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  AlertCircle, 
  ClipboardList, 
  Eye, 
  FilePlus2, 
  Loader2,
  MoreHorizontal,
  Pencil, 
  Printer, 
  RefreshCw, 
  Save, 
  Trash2, 
  X 
} from 'lucide-react';
import { atualizarAnamnese, criarAnamneseConsulta, excluirAnamnese, obterAnamnese, obterImpressaoAnamnese } from '../../../api/consultas';
import { listarAnamnesesPaciente, listarConsultasPaciente } from '../../../api/pacientes';
import { obterDadosClinica } from '../../../api/configuracoes';
import { generateAnamnesisHtml, printAnamneseViaIframe } from '../../../utils/printAnamnese';
import { useAuth } from '../../../context/AuthContext';
import { PERMISSIONS } from '../../../constants/permissions';
import { adaptConsultation } from '../../../domain/consultas';
import { parseApiDateTime, toIsoDate } from '../../../domain/agenda';
import RichTextEditor, { sanitizeRichTextHtml } from '../../Common/RichTextEditor';

const ANAMNESIS_OPTIONS = {
  sintomas: [
    'Prurido', 'Fotofobia', 'Hiperemia', 'Epífera', 'Trauma',
    'Ardência', 'Dor Ocular', 'Lacrimejamento', 'Força a Visão',
    'Cansaço Visual', 'Sensibilidade à Luz',
  ],
  doencasOculares: ['Glaucoma', 'Catarata', 'Pterígio', 'Ceratocone', 'Estrabismo', 'Conjuntivite'],
  doencasSistemicas: ['Hipertensão', 'Diabetes', 'Colesterol', 'Asma', 'Depressão', 'Renite', 'Sinusite', 'Alergias', 'Reumatismo'],
  medicamentos: [
    'Losartana', 'Captopril', 'Atenolol', 'Nifidipino', 'Propanolol', 'Hidrocloratiazida',
    'Metiformina', 'Glibencamida', 'AAS', 'Sinvastantina', 'Polaramine', 'Omeprazol',
  ],
  antecedentes: ['Diabetes', 'Estrabismo', 'Glaucoma', 'Pressão Alta', 'Catarata', 'Alguém usa óculos?'],
  cefaleiaLocal: ['Frontal', 'Temporal', 'Occipital', 'Parietal'],
  cefaleiaFrequencia: ['Todo o dia', 'Eventual', 'Fim de semana', 'Manhã', 'Tarde', 'Noite', 'Infrequente', 'Frequente', 'Crônica'],
};

function createEmptyAnamnesis() {
  return {
    motivoPrincipal: '', dataUltimoExame: '', observacoesGerais: '',
    sintomas: [], outrosSintomas: '', doencasOculares: [], outrasDoencasOculares: '',
    doencasSistemicas: [], outrasDoencasSistemicas: '', medicamentos: [], outrosMedicamentos: '',
    usoOculos: [], usoLentes: [], cefaleia: [], cefaleiaLocalOutro: '',
    cefaleiaFrequenciaOutro: '', antecedentes: [], antecedentesOutros: '', observacoesAnamnese: '',
  };
}

function splitStoredValues(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (!value) return [];
  if (typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
    } catch {
      // Continua com a separação do formato textual legado.
    }
  }
  return String(value).split(/[;,|]/).map((item) => item.trim()).filter(Boolean);
}

function separateKnownValues(value, knownValues) {
  const values = splitStoredValues(value);
  return {
    known: values.filter((item) => knownValues.includes(item)),
    other: values.filter((item) => !knownValues.includes(item)).join(', '),
  };
}

function joinValues(values, other = '') {
  return [...values, ...splitStoredValues(other)].filter(Boolean).join(', ');
}

function asBoolean(value) {
  return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
}

function requestError(error, fallback) {
  return error?.response?.data?.error?.message || error?.message || fallback;
}

function formatDateTime(value) {
  const date = parseApiDateTime(value);
  return date ? date.toLocaleString('pt-BR') : 'Data não informada';
}

function normalizeAnamnesis(data) {
  const lastExam = parseApiDateTime(data?.data_ultimo_exame);
  const sintomas = separateKnownValues(data?.sintomas, ANAMNESIS_OPTIONS.sintomas);
  const doencasOculares = separateKnownValues(data?.doencas_oculares, ANAMNESIS_OPTIONS.doencasOculares);
  const doencasSistemicas = separateKnownValues(data?.doencas_sistemicas, ANAMNESIS_OPTIONS.doencasSistemicas);
  const medicamentos = separateKnownValues(data?.medicamentos, ANAMNESIS_OPTIONS.medicamentos);
  const antecedentes = separateKnownValues(data?.antecedentes_familiares, ANAMNESIS_OPTIONS.antecedentes);
  const cefaleiaLocal = separateKnownValues(data?.cefaleia_local, ANAMNESIS_OPTIONS.cefaleiaLocal);
  const cefaleiaFrequencia = separateKnownValues(data?.cefaleia_frequencia, ANAMNESIS_OPTIONS.cefaleiaFrequencia);
  return {
    ...createEmptyAnamnesis(),
    motivoPrincipal: data?.motivo_principal || data?.queixa_principal || '',
    dataUltimoExame: lastExam ? toIsoDate(lastExam) : '',
    observacoesGerais: data?.observacoes_gerais || data?.historico || '',
    sintomas: sintomas.known,
    outrosSintomas: sintomas.other,
    doencasOculares: doencasOculares.known,
    outrasDoencasOculares: doencasOculares.other,
    doencasSistemicas: doencasSistemicas.known,
    outrasDoencasSistemicas: doencasSistemicas.other,
    medicamentos: medicamentos.known,
    outrosMedicamentos: medicamentos.other,
    usoOculos: [
      ...(asBoolean(data?.uso_oculos) ? ['Usa Óculos'] : []),
      ...(asBoolean(data?.dificuldade_longe) ? ['Dificuldade Longe'] : []),
      ...(asBoolean(data?.dificuldade_perto) ? ['Dificuldade Perto'] : []),
    ],
    usoLentes: [
      ...(asBoolean(data?.uso_lente) ? ['Usa Lente de Contato?'] : []),
      ...(asBoolean(data?.dificuldade_longe) ? ['Dificuldade Longe'] : []),
      ...(asBoolean(data?.dificuldade_perto) ? ['Dificuldade Perto'] : []),
    ],
    cefaleia: [
      ...(asBoolean(data?.cefaleia) ? ['Dor de cabeça'] : []),
      ...cefaleiaLocal.known,
      ...cefaleiaFrequencia.known,
    ],
    cefaleiaLocalOutro: cefaleiaLocal.other,
    cefaleiaFrequenciaOutro: cefaleiaFrequencia.other,
    antecedentes: antecedentes.known,
    antecedentesOutros: antecedentes.other,
    observacoesAnamnese: data?.observacoes_finais || data?.observacoes || '',
  };
}

function AnamnesisModal({ entry, consultationId, mode, patient, clinicInfo, consultations, onClose, onSaved, onNotify }) {
  const creating = mode === 'create';
  const editing = mode === 'edit';
  const writable = creating || editing;
  const [form, setForm] = useState(createEmptyAnamnesis);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (creating) {
      setForm(createEmptyAnamnesis());
      setLoading(false);
      setError('');
      return undefined;
    }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    obterAnamnese(entry.id, { signal: controller.signal })
      .then((data) => setForm(normalizeAnamnesis(data)))
      .catch((errorValue) => {
        if (errorValue?.code !== 'ERR_CANCELED') setError(requestError(errorValue, 'Não foi possível carregar a anamnese.'));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [creating, entry?.id]);

  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape' && !saving) onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, saving]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleOption = (field, option) => setForm((current) => ({
    ...current,
    [field]: current[field].includes(option)
      ? current[field].filter((item) => item !== option)
      : [...current[field], option],
  }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!writable || saving) return;
    const observations = sanitizeRichTextHtml(form.observacoesGerais);
    if (observations.length > 2000) {
      onNotify?.('error', 'Observações Gerais deve possuir no máximo 2.000 caracteres, incluindo a formatação.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        motivo_principal: form.motivoPrincipal,
        data_ultimo_exame: form.dataUltimoExame,
        observacoes_gerais: observations,
        sintomas: joinValues(form.sintomas, form.outrosSintomas),
        doencas_oculares: joinValues(form.doencasOculares, form.outrasDoencasOculares),
        doencas_sistemicas: joinValues(form.doencasSistemicas, form.outrasDoencasSistemicas),
        medicamentos: joinValues(form.medicamentos, form.outrosMedicamentos),
        uso_oculos: form.usoOculos.includes('Usa Óculos'),
        uso_lente: form.usoLentes.includes('Usa Lente de Contato?'),
        dificuldade_longe: form.usoOculos.includes('Dificuldade Longe') || form.usoLentes.includes('Dificuldade Longe'),
        dificuldade_perto: form.usoOculos.includes('Dificuldade Perto') || form.usoLentes.includes('Dificuldade Perto'),
        cefaleia: form.cefaleia.includes('Dor de cabeça'),
        cefaleia_local: joinValues(form.cefaleia.filter((item) => ANAMNESIS_OPTIONS.cefaleiaLocal.includes(item)), form.cefaleiaLocalOutro),
        cefaleia_frequencia: joinValues(form.cefaleia.filter((item) => ANAMNESIS_OPTIONS.cefaleiaFrequencia.includes(item)), form.cefaleiaFrequenciaOutro),
        antecedentes_familiares: joinValues(form.antecedentes, form.antecedentesOutros),
        observacoes_finais: form.observacoesAnamnese,
      };
      if (creating) await criarAnamneseConsulta(consultationId, payload);
      else await atualizarAnamnese(entry.id, payload);
      onNotify?.('success', creating ? 'Nova anamnese adicionada com sucesso.' : 'Anamnese atualizada com sucesso.');
      onSaved();
      onClose();
    } catch (errorValue) {
      onNotify?.('error', requestError(errorValue, 'Não foi possível atualizar a anamnese.'));
    } finally {
      setSaving(false);
    }
  };

  const textField = (field, label, options = {}) => (
    <label className={options.className || 'block'}>
      <span className="clinical-label">{label}</span>
      {options.multiline ? (
        <textarea 
          rows={options.rows || 3} 
          value={form[field] || ''} 
          onChange={(event) => update(field, event.target.value)} 
          disabled={!writable || saving} 
          className="clinical-input h-auto min-h-20 py-2.5 text-xs font-medium resize-y" 
        />
      ) : (
        <input 
          type={options.type || 'text'} 
          value={form[field] || ''} 
          onChange={(event) => update(field, event.target.value)} 
          disabled={!writable || saving} 
          className="clinical-input font-medium" 
        />
      )}
    </label>
  );

  const optionGroup = (title, field, options, className = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4') => (
    <div className="space-y-2">
      <p className="clinical-label !mb-0">{title}</p>
      <div className={`grid ${className} gap-2`}>
        {options.map((option) => {
          const checked = form[field].includes(option);
          return (
            <label
              key={option}
              className={`min-h-10 px-3.5 py-2 rounded-xl border flex items-center gap-2.5 font-semibold text-xs transition-all cursor-pointer select-none ${
                checked 
                  ? 'bg-forest-50 border-forest-300 text-forest-900 shadow-xs' 
                  : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleOption(field, option)}
                disabled={!writable || saving}
                className="accent-forest-700 w-4 h-4 rounded"
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm p-3 sm:p-5 flex items-center justify-center overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="anamnese-modal-title">
      <form onSubmit={handleSubmit} className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-2xl border border-slate-200/90 shadow-modal flex flex-col overflow-hidden my-auto animate-fade-in text-xs">
        
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-[#022b22] via-[#033b2e] to-[#022b22] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-forest-800">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-forest-850 border border-forest-700/80 text-amber-400 flex items-center justify-center shrink-0 shadow-hairline">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Prontuário de Anamnese
              </span>
              <h2 id="anamnese-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                {creating ? 'Nova Anamnese' : editing ? 'Editar Anamnese' : 'Visualizar Anamnese'}
              </h2>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={saving} 
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-forest-800 transition-colors" 
            title="Fechar (Esc)" 
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/40">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-900 font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="min-h-64 flex items-center justify-center gap-2 text-slate-600 font-semibold">
              <Loader2 className="w-5 h-5 animate-spin text-forest-700" />
              <span>Carregando dados da anamnese...</span>
            </div>
          ) : (
            <>
              <section className="border border-slate-200/80 rounded-2xl bg-white p-4 sm:p-5 space-y-4 shadow-hairline">
                <h3 className="font-bold text-xs uppercase text-forest-800 tracking-wider">Identificação & Queixa Principal</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="md:col-span-2">
                    {textField('motivoPrincipal', 'Motivo Principal da Consulta')}
                  </div>
                  <div>
                    {textField('dataUltimoExame', 'Data do Último Exame', { type: 'date' })}
                  </div>
                </div>
                <div>
                  <span className="clinical-label">Histórico / Observações Gerais</span>
                  <RichTextEditor
                    value={form.observacoesGerais}
                    onChange={(value) => update('observacoesGerais', value)}
                    disabled={!writable || saving}
                    placeholder="Histórico visual, uso de correção e antecedentes relevantes..."
                  />
                </div>
              </section>

              <section className="border border-slate-200/80 rounded-2xl bg-white p-4 sm:p-5 space-y-4 shadow-hairline">
                <h3 className="font-bold text-xs uppercase text-forest-800 tracking-wider">Sintomas Oculares</h3>
                {optionGroup('Sintomas Relatados', 'sintomas', ANAMNESIS_OPTIONS.sintomas)}
                {textField('outrosSintomas', 'Outros Sintomas Oculares')}
              </section>

              <section className="border border-slate-200/80 rounded-2xl bg-white p-4 sm:p-5 space-y-4 shadow-hairline">
                <h3 className="font-bold text-xs uppercase text-forest-800 tracking-wider">Patologias e Saúde Geral</h3>
                {optionGroup('Doenças Oculares', 'doencasOculares', ANAMNESIS_OPTIONS.doencasOculares)}
                {textField('outrasDoencasOculares', 'Outras Doenças Oculares')}
                {optionGroup('Doenças Sistêmicas', 'doencasSistemicas', ANAMNESIS_OPTIONS.doencasSistemicas)}
                {textField('outrasDoencasSistemicas', 'Outras Doenças Sistêmicas')}
                {optionGroup('Medicamentos em Uso', 'medicamentos', ANAMNESIS_OPTIONS.medicamentos)}
                {textField('outrosMedicamentos', 'Outros Medicamentos')}
              </section>

              <section className="border border-slate-200/80 rounded-2xl bg-white p-4 sm:p-5 space-y-4 shadow-hairline">
                <h3 className="font-bold text-xs uppercase text-forest-800 tracking-wider">Correção e Antecedentes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {optionGroup('Uso de Óculos', 'usoOculos', ['Usa Óculos', 'Dificuldade Longe', 'Dificuldade Perto'], 'grid-cols-1 sm:grid-cols-2')}
                  {optionGroup('Uso de Lentes de Contato', 'usoLentes', ['Usa Lente de Contato?', 'Dificuldade Longe', 'Dificuldade Perto'], 'grid-cols-1 sm:grid-cols-2')}
                </div>
                {optionGroup('Antecedentes Familiares', 'antecedentes', ANAMNESIS_OPTIONS.antecedentes)}
                {textField('antecedentesOutros', 'Outros Antecedentes')}
              </section>

              <section className="border border-slate-200/80 rounded-2xl bg-white p-4 sm:p-5 space-y-4 shadow-hairline">
                <h3 className="font-bold text-xs uppercase text-forest-800 tracking-wider">Cefaleia (Dor de Cabeça)</h3>
                {optionGroup('Presença de Cefaleia', 'cefaleia', ['Dor de cabeça'], 'grid-cols-1 max-w-xs')}
                {optionGroup('Localização da Cefaleia', 'cefaleia', ANAMNESIS_OPTIONS.cefaleiaLocal)}
                {textField('cefaleiaLocalOutro', 'Outra Localização')}
                {optionGroup('Frequência / Momento', 'cefaleia', ANAMNESIS_OPTIONS.cefaleiaFrequencia)}
                {textField('cefaleiaFrequenciaOutro', 'Outra Frequência')}
              </section>

              <section className="border border-slate-200/80 rounded-2xl bg-white p-4 sm:p-5 shadow-hairline">
                {textField('observacoesAnamnese', 'Observações da Anamnese', { multiline: true, rows: 3 })}
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            {!creating && !loading && (
              <button
                type="button"
                onClick={handlePrintCurrentModal}
                disabled={saving}
                className="h-10 btn-secondary px-4 inline-flex items-center gap-2"
                title="Imprimir esta anamnese"
              >
                <Printer className="w-4 h-4 text-forest-700" />
                <span>Imprimir Anamnese</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={saving} 
              className="h-10 btn-secondary px-4"
            >
              {writable ? 'Cancelar' : 'Fechar'}
            </button>
            {writable && (
              <button 
                type="submit" 
                disabled={loading || Boolean(error) || saving} 
                className="h-10 btn-primary px-5"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Salvando...' : creating ? 'Salvar nova anamnese' : 'Salvar alterações'}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>,
    document.body
  );
}

export default function AnamnesesPacienteTab({ patient, onNotify }) {
  const { can } = useAuth();
  const canViewClinical = can(PERMISSIONS.CLINICAL_VIEW);
  const canEditClinical = can(PERMISSIONS.CLINICAL_EDIT);
  const [items, setItems] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [clinicInfo, setClinicInfo] = useState({ name: '', cnpj: '', phone: '', address: '', city: '', state: '', cep: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modal, setModal] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Carrega dados da clínica para os cabeçalhos de impressão
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
    setLoading(true);
    setError('');
    try {
      const anamneses = await listarAnamnesesPaciente(patient.id, { signal });
      const patientConsultations = await listarConsultasPaciente(patient.id, { signal });
      setItems(anamneses);
      setConsultations(patientConsultations.map(adaptConsultation).filter(Boolean));
    } catch (errorValue) {
      if (errorValue?.code !== 'ERR_CANCELED') {
        setItems([]);
        setConsultations([]);
        setError(requestError(errorValue, 'Não foi possível carregar as anamneses.'));
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [patient.id]);

  useEffect(() => {
    const handleClose = () => setMenuAnchor(null);
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, refreshKey]);

  const handleAdd = () => {
    const destination = consultations.find((item) => item.statusCode === 'em_atendimento') || consultations[0];
    if (!destination) {
      onNotify?.('error', 'É necessário registrar uma consulta antes de adicionar a anamnese.');
      return;
    }
    setModal({ mode: 'create', consultationId: destination.id });
  };

  const handlePrint = async (item) => {
    try {
      const data = await obterAnamnese(item.id);
      const consultation = consultations.find((c) => String(c.id) === String(item.consulta_id || item.consultaId || data.consulta_id));
      const html = generateAnamnesisHtml(data, patient, clinicInfo, consultation);
      printAnamneseViaIframe(html);
      onNotify?.('success', 'Anamnese enviada para impressão.');
    } catch (errorValue) {
      onNotify?.('error', requestError(errorValue, 'Não foi possível preparar a impressão.'));
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Excluir esta anamnese? Esta ação não pode ser desfeita.')) return;
    setDeletingId(item.id);
    try {
      await excluirAnamnese(item.id);
      onNotify?.('success', 'Anamnese excluída com sucesso.');
      setRefreshKey((value) => value + 1);
    } catch (errorValue) {
      onNotify?.('error', requestError(errorValue, 'Não foi possível excluir a anamnese.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      <div className="clinical-panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">Anamneses</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Registros clínicos vinculados às consultas deste paciente.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            onClick={() => setRefreshKey((value) => value + 1)} 
            disabled={loading} 
            className="h-10 w-10 btn-secondary p-0 shrink-0" 
            title="Atualizar anamneses" 
            aria-label="Atualizar anamneses"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canEditClinical && (
            <button 
              type="button" 
              onClick={handleAdd} 
              className="h-10 btn-primary px-4"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Adicionar Anamnese</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-900 font-semibold flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-x-auto border border-slate-200/80 rounded-2xl bg-white shadow-hairline">
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-600 tracking-wider">
              <th className="py-3 px-4 w-16">#</th>
              <th className="py-3 px-4">Data de Cadastro</th>
              <th className="py-3 px-4">Cadastrado por</th>
              <th className="py-3 px-4 text-right">Opções</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!loading && items.map((item, index) => (
              <tr key={item.id} className="hover:bg-forest-50/20 transition-colors">
                <td className="py-3.5 px-4 text-slate-500 font-mono font-bold">{index + 1}</td>
                <td className="py-3.5 px-4 text-slate-800 font-mono font-medium">{formatDateTime(item.criado_em || item.data)}</td>
                <td className="py-3.5 px-4 text-slate-700 font-medium">{item.profissional || 'Profissional não informado'}</td>
                <td className="py-3.5 px-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (menuAnchor?.id === item.id) {
                          setMenuAnchor(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuAnchor({
                            id: item.id,
                            item: item,
                            top: rect.bottom + 6,
                            right: Math.max(16, window.innerWidth - rect.right),
                          });
                        }
                      }}
                      className={`p-2 rounded-xl border transition-all ${
                        menuAnchor?.id === item.id
                          ? 'bg-slate-100 border-slate-300 text-forest-800 shadow-hairline'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                      title="Opções da anamnese"
                      aria-label="Opções da anamnese"
                      aria-expanded={menuAnchor?.id === item.id}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && (
          <div className="min-h-40 flex items-center justify-center gap-2 text-slate-600 font-semibold">
            <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
            <span>Carregando anamneses...</span>
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="min-h-40 flex items-center justify-center text-slate-500 font-medium">
            Nenhuma anamnese registrada para este paciente.
          </div>
        )}
      </div>

            {modal && (
        <AnamnesisModal 
          entry={modal.entry} 
          consultationId={modal.consultationId} 
          mode={modal.mode} 
          patient={patient} 
          clinicInfo={clinicInfo}
          consultations={consultations}
          onClose={() => setModal(null)} 
          onSaved={() => setRefreshKey((value) => value + 1)} 
          onNotify={onNotify} 
        />
      )}

      {menuAnchor && createPortal(
        <div 
          style={{ top: `${menuAnchor.top}px`, right: `${menuAnchor.right}px` }}
          className="fixed w-44 bg-white rounded-2xl border border-slate-200/90 text-slate-800 p-1.5 shadow-modal z-[999999] animate-fade-in text-xs"
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          {canViewClinical && (
            <button
              type="button"
              onClick={() => {
                const selectedItem = menuAnchor.item;
                setMenuAnchor(null);
                handlePrint(selectedItem);
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-semibold flex items-center space-x-2.5 text-slate-700 hover:text-forest-800 transition-colors"
              role="menuitem"
            >
              <Printer className="w-4 h-4 text-forest-700 shrink-0" />
              <span>Imprimir</span>
            </button>
          )}

          {canViewClinical && (
            <button
              type="button"
              onClick={() => {
                const selectedItem = menuAnchor.item;
                setMenuAnchor(null);
                setModal({ entry: selectedItem, mode: 'view' });
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-semibold flex items-center space-x-2.5 text-slate-700 hover:text-slate-900 transition-colors"
              role="menuitem"
            >
              <Eye className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Visualizar</span>
            </button>
          )}

          {canEditClinical && (
            <button
              type="button"
              onClick={() => {
                const selectedItem = menuAnchor.item;
                setMenuAnchor(null);
                setModal({ entry: selectedItem, mode: 'edit' });
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-semibold flex items-center space-x-2.5 text-slate-700 hover:text-amber-800 transition-colors"
              role="menuitem"
            >
              <Pencil className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Editar</span>
            </button>
          )}

          {canEditClinical && (
            <div className="pt-1 mt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const selectedItem = menuAnchor.item;
                  setMenuAnchor(null);
                  handleDelete(selectedItem);
                }}
                disabled={deletingId === menuAnchor.item.id}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 font-semibold flex items-center space-x-2.5 text-rose-700 transition-colors disabled:opacity-50"
                role="menuitem"
              >
                {deletingId === menuAnchor.item.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-rose-600 shrink-0" />
                ) : (
                  <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>Excluir</span>
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
