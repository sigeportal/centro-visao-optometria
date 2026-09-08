import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  CalendarDays, 
  CalendarCheck, 
  Clock, 
  Loader2, 
  Save, 
  UserCheck, 
  X,
  ClipboardCheck
} from 'lucide-react';

const RETURN_PRESETS = [
  { label: '+7d', getDays: () => 7 },
  { label: '+15d', getDays: () => 15 },
  { label: '+30d', getDays: () => 30 },
];

const NEW_CONSULTATION_PRESETS = [
  { 
    label: '+6 meses', 
    getMonths: () => 6,
    defaultMotivo: 'Controle de evolução refrativa (6 meses)'
  },
  { 
    label: '+1 ano', 
    getMonths: () => 12,
    defaultMotivo: 'Revisão periódica anual da saúde visual e validade dos óculos'
  },
  { 
    label: '+2 anos', 
    getMonths: () => 24,
    defaultMotivo: 'Revisão preventiva bienal (2 anos)'
  },
];

const RETURN_TYPES = [
  { value: 'adaptacao', label: 'Adaptação (Lentes / Óculos)' },
  { value: 'revisao', label: 'Revisão Refrativa' },
  { value: 'acompanhamento', label: 'Acompanhamento Clínico (PIO / Fundo)' },
  { value: 'outro', label: 'Outro Motivo Clínico' },
];

const RETURN_MOTIVO_BY_TYPE = {
  adaptacao: 'Adaptação de novas lentes/óculos',
  revisao: 'Revisão de acuidade visual',
  acompanhamento: 'Acompanhamento Clínico (PIO / Fundo)',
  outro: '',
};

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
  const [form, setForm] = useState({
    conduta: 'retorno', // 'retorno' | 'nova_consulta' | 'sem_retorno'
    tipo: 'adaptacao',
    data_retorno: '',
    motivo: 'Adaptação de novas lentes/óculos',
    nova_consulta_data: '',
    nova_consulta_motivo: 'Revisão periódica anual da saúde visual e validade dos óculos',
    observacao: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      const defaultReturnDate = new Date();
      defaultReturnDate.setDate(defaultReturnDate.getDate() + 15);

      const defaultOneYear = new Date();
      defaultOneYear.setFullYear(defaultOneYear.getFullYear() + 1);

      setForm({
        conduta: 'retorno',
        tipo: 'adaptacao',
        data_retorno: defaultReturnDate.toISOString().split('T')[0],
        motivo: 'Adaptação de novas lentes/óculos',
        nova_consulta_data: defaultOneYear.toISOString().split('T')[0],
        nova_consulta_motivo: 'Revisão periódica anual da saúde visual e validade dos óculos',
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

    if (form.conduta === 'retorno') {
      if (!form.data_retorno) {
        setError('Informe a data do retorno gratuito.');
        return;
      }
    } else if (form.conduta === 'nova_consulta') {
      if (!form.nova_consulta_data) {
        setError('Informe a data estipulada para a nova consulta.');
        return;
      }
    }

    setError('');
    await onConfirm({
      situacao: form.conduta === 'sem_retorno' ? 'sem_retorno' : 'retorno_programado',
      tem_retorno: form.conduta === 'retorno',
      tipo: form.conduta === 'retorno' ? form.tipo : '',
      data_retorno: form.conduta === 'retorno' ? form.data_retorno : '',
      motivo: form.conduta === 'retorno' ? form.motivo.trim() : '',
      observacao: form.observacao.trim(),
      tem_nova_consulta: form.conduta === 'nova_consulta',
      nova_consulta_data: form.conduta === 'nova_consulta' ? form.nova_consulta_data : '',
      nova_consulta_motivo: form.conduta === 'nova_consulta' ? form.nova_consulta_motivo.trim() : '',
      nova_consulta_observacao: '',
    });
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 flex items-center justify-center overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in my-auto text-xs"
      >
        {/* Cabeçalho Limpo e Direto */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-forest-100 text-forest-800 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 leading-tight truncate">
                Concluir Atendimento
              </h2>
              <p className="text-[11px] text-slate-500 truncate">
                {consultation?.patientName ? `${consultation.patientName} • ` : ''}Consulta #{consultation?.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center disabled:opacity-50 transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 space-y-4 max-h-[calc(88vh-110px)] overflow-y-auto">
          {/* Seletor Segmentado de Conduta */}
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Conduta Pós-Atendimento
            </span>
            <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => {
                  setForm((c) => ({ ...c, conduta: 'retorno' }));
                  setError('');
                }}
                disabled={saving}
                className={`py-2 px-2.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all text-xs ${
                  form.conduta === 'retorno'
                    ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Retorno</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setForm((c) => ({ ...c, conduta: 'nova_consulta' }));
                  setError('');
                }}
                disabled={saving}
                className={`py-2 px-2.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all text-xs ${
                  form.conduta === 'nova_consulta'
                    ? 'bg-white text-sky-800 shadow-xs ring-1 ring-sky-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="truncate">Nova Consulta</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setForm((c) => ({ ...c, conduta: 'sem_retorno' }));
                  setError('');
                }}
                disabled={saving}
                className={`py-2 px-2.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all text-xs ${
                  form.conduta === 'sem_retorno'
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">Alta</span>
              </button>
            </div>
          </div>

          {/* Opção: RETORNO CLÍNICO GRATUITO */}
          {form.conduta === 'retorno' && (
            <div className="space-y-3 pt-0.5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-1 flex-wrap">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Data do Retorno</span>
                    </label>
                    <div className="flex items-center gap-1">
                      {RETURN_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setForm((c) => ({ ...c, data_retorno: calculatePresetDate(preset) }))}
                          disabled={saving}
                          className="px-1.5 py-0.5 text-[10.5px] font-medium rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 border border-slate-200/80 transition-colors"
                          title={`Definir data para ${preset.label}`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="date"
                    value={form.data_retorno}
                    min={consultation?.dateIso || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setForm((c) => ({ ...c, data_retorno: e.target.value }))}
                    className="clinical-input h-9 text-xs font-mono font-medium text-slate-900"
                    disabled={saving}
                    required
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Retorno
                  </label>
                  <select
                    value={form.tipo}
                    onChange={(e) => {
                      const newTipo = e.target.value;
                      setForm((c) => ({
                        ...c,
                        tipo: newTipo,
                        motivo: RETURN_MOTIVO_BY_TYPE[newTipo] !== undefined ? RETURN_MOTIVO_BY_TYPE[newTipo] : c.motivo,
                      }));
                    }}
                    className="clinical-input h-9 text-xs font-medium text-slate-900"
                    disabled={saving}
                  >
                    {RETURN_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo do Retorno
                </label>
                <input
                  type="text"
                  maxLength={255}
                  value={form.motivo}
                  onChange={(e) => setForm((c) => ({ ...c, motivo: e.target.value }))}
                  className="clinical-input h-9 text-xs"
                  placeholder="Ex.: Adaptação de novas lentes, checar acuidade visual..."
                  disabled={saving}
                />
              </div>
            </div>
          )}

          {/* Opção: NOVA CONSULTA (CRM / LONGO PRAZO) */}
          {form.conduta === 'nova_consulta' && (
            <div className="space-y-3 pt-0.5 animate-fade-in">
              <div>
                <div className="flex items-center justify-between mb-1 gap-1 flex-wrap">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Previsão para Nova Consulta</span>
                  </label>
                  <div className="flex items-center gap-1">
                    {NEW_CONSULTATION_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setForm((c) => ({ 
                          ...c, 
                          nova_consulta_data: calculatePresetDate(preset),
                          nova_consulta_motivo: preset.defaultMotivo || c.nova_consulta_motivo
                        }))}
                        disabled={saving}
                        className="px-2 py-0.5 text-[10.5px] font-medium rounded bg-slate-100 hover:bg-sky-50 hover:text-sky-800 text-slate-600 border border-slate-200/80 transition-colors"
                        title={`Definir previsão para ${preset.label}`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="date"
                  value={form.nova_consulta_data}
                  min={consultation?.dateIso || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm((c) => ({ ...c, nova_consulta_data: e.target.value }))}
                  className="clinical-input h-9 text-xs font-mono font-medium text-slate-900"
                  disabled={saving}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Indicação / Motivo Clínico
                </label>
                <input
                  type="text"
                  maxLength={255}
                  value={form.nova_consulta_motivo}
                  onChange={(e) => setForm((c) => ({ ...c, nova_consulta_motivo: e.target.value }))}
                  className="clinical-input h-9 text-xs"
                  placeholder="Ex.: Revisão periódica anual da saúde visual e validade dos óculos..."
                  disabled={saving}
                />
              </div>
            </div>
          )}

          {/* Opção: ALTA CLÍNICA */}
          {form.conduta === 'sem_retorno' && (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 flex items-center gap-2.5 animate-fade-in">
              <UserCheck className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                Atendimento finalizado com alta clínica. Nenhum retorno ou nova consulta será registrado.
              </span>
            </div>
          )}

          {/* Observações Gerais */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Clínicas <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <textarea
              rows={2}
              maxLength={2000}
              value={form.observacao}
              onChange={(e) => setForm((c) => ({ ...c, observacao: e.target.value }))}
              className="clinical-input p-2 text-xs resize-y"
              placeholder="Anotações complementares para o prontuário..."
              disabled={saving}
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium animate-fade-in" role="alert">
              {error}
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn-secondary px-3.5 py-1.5 text-xs font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-4 py-1.5 text-xs font-bold flex items-center gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Finalizando...' : 'Concluir Atendimento'}</span>
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
