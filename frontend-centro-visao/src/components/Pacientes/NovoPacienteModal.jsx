import { useState } from 'react';
import { CalendarPlus, Check, Loader2, User, X } from 'lucide-react';
import { criarPaciente, obterPaciente } from '../../api/pacientes';
import { adaptPatient, calculateAge, patientPayload } from '../../domain/pacientes';

const INITIAL_FORM = {
  name: '', socialName: '', birthDate: '', gender: '', phone: '', cpf: '', city: '', state: '',
};

function errorMessage(error) {
  return error?.response?.data?.error?.message || error?.message || 'Não foi possível cadastrar o paciente.';
}

export default function NovoPacienteModal({ isOpen, onClose, onSaveAndAttend }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isFormValid = form.name.trim().length > 0;
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const closeModal = () => {
    if (saving) return;
    setForm(INITIAL_FORM);
    setError('');
    onClose();
  };

  const handleSave = async (scheduleNow = false) => {
    if (!isFormValid || saving) return;
    setSaving(true);
    setError('');
    try {
      const created = await criarPaciente(patientPayload(form));
      const patient = adaptPatient(await obterPaciente(created.id));
      if (!patient) throw new Error('O paciente foi criado, mas não pôde ser carregado.');
      setForm(INITIAL_FORM);
      onSaveAndAttend(patient, scheduleNow);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative bg-white rounded-2xl border border-slate-200/90 w-full max-w-2xl shadow-modal flex flex-col max-h-[90vh] my-auto animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#022b22] to-[#033b2e] text-white p-4 sm:p-5 flex items-center justify-between border-b border-forest-700/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-forest-800 border border-forest-600 flex items-center justify-center text-amber-400 font-bold shadow-hairline">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white">Cadastrar Paciente</h3>
              <p className="text-[11px] text-forest-200/80">Novo cadastro com prontuário clínico integrado</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            disabled={saving}
            className="p-1.5 rounded-lg hover:bg-white/10 text-forest-200/70 hover:text-white transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 font-semibold shadow-hairline" role="alert">
              {error}
            </div>
          )}
          <div>
            <label className="clinical-label">
              Nome Completo <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className="clinical-input font-bold"
              placeholder="Ex.: Maria da Silva"
            />
          </div>
          <div>
            <label className="clinical-label">Nome Social</label>
            <input
              type="text"
              value={form.socialName}
              onChange={(event) => updateField('socialName', event.target.value)}
              className="clinical-input font-medium"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="clinical-label">CPF</label>
              <input
                type="text"
                value={form.cpf}
                onChange={(event) => updateField('cpf', event.target.value)}
                placeholder="000.000.000-00"
                className="clinical-input font-mono font-bold"
              />
            </div>
            <div>
              <label className="clinical-label">Celular / WhatsApp</label>
              <input
                type="text"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                placeholder="(00) 00000-0000"
                className="clinical-input font-medium"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="clinical-label !mb-0">Data de Nascimento</label>
                {form.birthDate && calculateAge(form.birthDate) !== null && (
                  <span className="text-[10.5px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 leading-none">
                    {calculateAge(form.birthDate)} {calculateAge(form.birthDate) === 1 ? 'ano' : 'anos'}
                  </span>
                )}
              </div>
              <input
                type="date"
                value={form.birthDate}
                onChange={(event) => updateField('birthDate', event.target.value)}
                className="clinical-input font-medium"
              />
            </div>
            <div>
              <label className="clinical-label">Sexo / Gênero</label>
              <select
                value={form.gender}
                onChange={(event) => updateField('gender', event.target.value)}
                className="clinical-input font-medium"
              >
                <option value="">Não informado</option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_110px] gap-3">
            <div>
              <label className="clinical-label">Cidade</label>
              <input
                type="text"
                value={form.city}
                onChange={(event) => updateField('city', event.target.value)}
                className="clinical-input font-medium"
              />
            </div>
            <div>
              <label className="clinical-label">UF</label>
              <input
                type="text"
                maxLength={2}
                value={form.state}
                onChange={(event) => updateField('state', event.target.value.toUpperCase())}
                className="clinical-input font-bold uppercase"
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={closeModal}
            disabled={saving}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <button
              type="button"
              disabled={!isFormValid || saving}
              onClick={() => handleSave(true)}
              className="btn-accent"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Salvar e Agendar</span>
            </button>
            <button
              type="button"
              disabled={!isFormValid || saving}
              onClick={() => handleSave(false)}
              className="btn-primary"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{saving ? 'Salvando...' : 'Salvar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

