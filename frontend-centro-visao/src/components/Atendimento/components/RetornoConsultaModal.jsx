import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  CalendarDays, 
  CheckCircle2, 
  ClipboardCheck, 
  Clock, 
  Loader2, 
  Save, 
  UserCheck, 
  XCircle, 
  X,
  Sparkles
} from 'lucide-react';

const EMPTY_FORM = {
  situacao: 'retorno_programado',
  tipo: 'acompanhamento',
  data_retorno: '',
  motivo: '',
  observacao: '',
};

const FOLLOW_UP_DECISIONS = [
  { 
    value: 'retorno_programado', 
    label: 'Indicar Retorno', 
    description: 'Programar data para acompanhamento ou revisão clínica',
    icon: CalendarDays,
    color: 'emerald'
  },
  { 
    value: 'sem_retorno', 
    label: 'Sem Retorno', 
    description: 'Conclusão ou alta clínica do atendimento',
    icon: UserCheck,
    color: 'slate'
  },
  { 
    value: 'recusado_pelo_paciente', 
    label: 'Paciente Não Optou', 
    description: 'Paciente optou por não programar retorno agora',
    icon: XCircle,
    color: 'amber'
  },
];

const RETURN_TYPES = [
  { value: 'acompanhamento', label: 'Acompanhamento Clínico' },
  { value: 'revisao', label: 'Revisão Refrativa' },
  { value: 'adaptacao', label: 'Adaptação (Lentes / Óculos)' },
  { value: 'outro', label: 'Outro Motivo Clínico' },
];

const QUICK_PRESETS = [
  { label: '+15 dias', getDays: () => 15 },
  { label: '+30 dias', getDays: () => 30 },
  { label: '+60 dias', getDays: () => 60 },
  { label: '+6 meses', getMonths: () => 6 },
  { label: '+1 ano', getMonths: () => 12 },
];

const MOTIVO_SUGGESTIONS = [
  'Revisão de acuidade visual',
  'Adaptação de novas lentes/óculos',
  'Acompanhamento de pressão intraocular (PIO)',
  'Avaliação e controle de fundo de olho',
  'Controle de ceratocone / topografia',
];

function calculatePresetDate(preset) {
  const d = new Date();
  if (preset.getDays) {
    d.setDate(d.getDate() + preset.getDays());
  } else if (preset.getMonths) {
    d.setMonth(d.getMonth() + preset.getMonths());
  }
  return d.toISOString().split('T')[0];
}

export default function RetornoConsultaModal({
  open,
  consultation,
  saving = false,
  onClose,
  onConfirm,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      // Default to 1 year ahead as standard optometry return
      const defaultDate = new Date();
      defaultDate.setFullYear(defaultDate.getFullYear() + 1);
      
      setForm({
        situacao: 'retorno_programado',
        tipo: 'acompanhamento',
        data_retorno: defaultDate.toISOString().split('T')[0],
        motivo: 'Acompanhamento e revisão anual da saúde visual',
        observacao: '',
      });
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, saving, onClose]);

  if (!open) return null;

  const submit = async (event) => {
    event.preventDefault();
    if (!form.situacao) {
      setError('Escolha a decisão de acompanhamento.');
      return;
    }
    if (form.situacao === 'retorno_programado' && !form.tipo) {
      setError('Escolha o tipo de retorno.');
      return;
    }
    if (form.situacao === 'retorno_programado' && !form.data_retorno) {
      setError('Informe a data prevista do retorno.');
      return;
    }

    setError('');
    await onConfirm({
      situacao: form.situacao,
      tipo: form.situacao === 'retorno_programado' ? form.tipo : '',
      data_retorno: form.situacao === 'retorno_programado' ? form.data_retorno : '',
      motivo: form.motivo.trim(),
      observacao: form.observacao.trim(),
    });
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-xs p-4 flex items-center justify-center overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-fade-in my-auto"
      >
        {/* Cabeçalho */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center shrink-0 shadow-hairline">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Concluir Atendimento Clínico</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Defina o plano de retorno e acompanhamento de <strong className="text-slate-800">{consultation?.patientName || 'do paciente'}</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center disabled:opacity-50 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 space-y-4 text-xs max-h-[calc(85vh-130px)] overflow-y-auto">
          {/* Seletor de Decisão em Cards */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
              Decisão de Acompanhamento
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {FOLLOW_UP_DECISIONS.map((item) => {
                const Icon = item.icon;
                const isSelected = form.situacao === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setForm((current) => ({
                      ...current,
                      situacao: item.value,
                      tipo: item.value === 'retorno_programado' ? (current.tipo || 'acompanhamento') : '',
                      data_retorno: item.value === 'retorno_programado' ? current.data_retorno : '',
                    }))}
                    disabled={saving}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-forest-600 bg-forest-50/70 shadow-hairline ring-1 ring-forest-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-forest-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-forest-700" />}
                    </div>
                    <div>
                      <div className={`font-bold text-xs ${isSelected ? 'text-forest-950' : 'text-slate-800'}`}>
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configurações de Retorno Programado */}
          {form.situacao === 'retorno_programado' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 animate-fade-in">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tipo de Retorno
                  </label>
                  <select
                    value={form.tipo}
                    onChange={(event) => setForm((current) => ({ ...current, tipo: event.target.value }))}
                    className="clinical-input h-9 font-medium"
                    disabled={saving}
                  >
                    {RETURN_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-forest-700" />
                      Data Prevista
                    </span>
                  </label>
                  <input
                    type="date"
                    value={form.data_retorno}
                    min={consultation?.dateIso || new Date().toISOString().split('T')[0]}
                    onChange={(event) => setForm((current) => ({ ...current, data_retorno: event.target.value }))}
                    className="clinical-input h-9 font-mono font-bold text-slate-900"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Atalhos Rápidos de Datas */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-1.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Atalhos de Prazo:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setForm((current) => ({
                        ...current,
                        data_retorno: calculatePresetDate(preset)
                      }))}
                      disabled={saving}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-forest-50 hover:border-forest-300 text-slate-700 hover:text-forest-900 border border-slate-200 text-[11px] font-medium transition-colors shadow-2xs"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Motivo do Acompanhamento */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Motivo / Conduta
            </label>
            <input
              type="text"
              maxLength={255}
              value={form.motivo}
              onChange={(event) => setForm((current) => ({ ...current, motivo: event.target.value }))}
              className="clinical-input h-9"
              placeholder={
                form.situacao === 'recusado_pelo_paciente'
                  ? 'Ex.: Paciente optou por não programar retorno no momento'
                  : 'Ex.: Acompanhamento de rotina, revisão de prescrição, etc.'
              }
              disabled={saving}
            />

            {/* Sugestões Rápidas de Motivo */}
            {form.situacao === 'retorno_programado' && (
              <div className="mt-2 flex flex-wrap gap-1">
                {MOTIVO_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, motivo: sug }))}
                    disabled={saving}
                    className="text-[10.5px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Observações Complementares */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Observações Internas (Opcional)
            </label>
            <textarea
              rows={3}
              maxLength={2000}
              value={form.observacao}
              onChange={(event) => setForm((current) => ({ ...current, observacao: event.target.value }))}
              className="clinical-input p-2.5 resize-y text-xs"
              placeholder="Anotações adicionais para o prontuário ou próximo atendimento..."
              disabled={saving}
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold animate-fade-in" role="alert">
              {error}
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Consulta #{consultation?.id}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary px-4 py-2 text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-5 py-2 text-xs flex items-center gap-2 font-bold"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Finalizando...' : 'Concluir Atendimento'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body
  );
}
