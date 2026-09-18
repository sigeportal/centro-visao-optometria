import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Calendar, Check, Loader2, Search, X } from 'lucide-react';
import { listarPacientes } from '../../api/pacientes';
import { addDays, toIsoDate } from '../../domain/agenda';
import { calculateEndTime } from '../../utils/timeUtils';
import { formatCPF, formatPhone } from '../../utils/formatters';

function getErrorMessage(error) {
  return error?.response?.data?.error?.message
    || error?.response?.data?.message
    || error?.message
    || 'Não foi possível salvar o agendamento.';
}

function makeInitialForm(initialData, professionals, procedures, mode) {
  const defaultDate = toIsoDate(addDays(new Date(), 1));
  const startTime = initialData?.startTime || '08:00';
  const matchedProcedure = initialData?.procedureId
    ? procedures.find((item) => String(item.id) === String(initialData.procedureId))
    : procedures.find((item) => {
        const itemNome = (item.nome || '').toLowerCase();
        const initialNome = (initialData?.procedure || '').toLowerCase();
        return itemNome === initialNome || (initialNome && itemNome.includes(initialNome));
      });
  const initialProcedureId = matchedProcedure?.id || initialData?.procedureId || procedures[0]?.id || '';
  const selectedProcedure = procedures.find((item) => String(item.id) === String(initialProcedureId));
  return {
    professionalId: initialData?.doctorId || professionals[0]?.id || '',
    procedureId: String(initialProcedureId || ''),
    procedure: selectedProcedure?.nome || initialData?.procedure || '',
    partnershipId: String(initialData?.partnershipId || ''),
    date: initialData?.date || defaultDate,
    startTime,
    endTime: initialData?.endTime || calculateEndTime(startTime, Number(selectedProcedure?.duracao_minutos || 30)),
    priority: String(initialData?.priority || 'normal').toLowerCase(),
    notes: initialData?.observations || '',
    status: mode === 'edit' ? initialData?.statusCode || 'agendada' : initialData?.statusCode || 'agendada',
  };
}

function adaptPatient(item) {
  return {
    id: String(item.id),
    name: item.nome || 'Paciente sem nome',
    cpf: item.cpf || '',
    city: item.cidade || '',
    phone: item.celular || '',
  };
}

export default function NovoAgendamentoModal({
  isOpen,
  onClose,
  onSave,
  professionals = [],
  procedures = [],
  partnerships = [],
  initialData = null,
  mode = 'create',
}) {
  const [form, setForm] = useState(() => makeInitialForm(initialData, professionals, procedures, mode));
  const [patientQuery, setPatientQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientResults, setPatientResults] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const patientLocked = Boolean(initialData?.lockPatient);

  useEffect(() => {
    if (!isOpen) return;
    setForm(makeInitialForm(initialData, professionals, procedures, mode));
    setErrorMessage('');
    setSaving(false);

    if (initialData?.patientId) {
      const patient = {
        id: String(initialData.patientId),
        name: initialData.patient,
        phone: initialData.phone || '',
        cpf: '',
        city: '',
      };
      setSelectedPatient(patient);
      setPatientQuery(patient.name);
    } else {
      setSelectedPatient(null);
      setPatientQuery('');
    }
    setPatientResults([]);
    setShowPatientResults(false);
  }, [isOpen, initialData, professionals, procedures, mode]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || selectedPatient?.name === patientQuery) return undefined;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const result = await listarPacientes({ busca: patientQuery, page: 1, limit: 8 }, { signal: controller.signal });
        setPatientResults(result.items.map(adaptPatient));
        setShowPatientResults(true);
      } catch (error) {
        if (error?.code !== 'ERR_CANCELED') setErrorMessage(getErrorMessage(error));
      } finally {
        if (!controller.signal.aborted) setSearchingPatients(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, patientQuery, selectedPatient]);

  const isTimeValid = form.startTime && form.endTime && form.startTime < form.endTime;
  const isFormValid = Boolean(
    selectedPatient?.id
      && form.professionalId
      && form.procedure.trim()
      && (mode === 'edit' || form.procedureId)
      && form.date
      && isTimeValid,
  );

  const selectedProfessional = useMemo(
    () => professionals.find((item) => item.id === form.professionalId),
    [professionals, form.professionalId],
  );

  const selectedProcedure = useMemo(
    () => procedures.find((item) => String(item.id) === String(form.procedureId)),
    [procedures, form.procedureId],
  );

  if (!isOpen) return null;

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrorMessage('');
  };

  const handlePatientInput = (value) => {
    if (patientLocked) return;
    setPatientQuery(value);
    setSelectedPatient(null);
    setErrorMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isFormValid || saving) return;

    setSaving(true);
    setErrorMessage('');
    try {
      await onSave({
        paciente_id: Number(selectedPatient.id),
        profissional_id: Number(form.professionalId),
        procedimento_id: Number(form.procedureId || 0),
        procedimento: form.procedure.trim(),
        data: form.date,
        hora_inicio: form.startTime,
        hora_fim: form.endTime,
        prioridade: form.priority,
        parceria_id: Number(form.partnershipId || 0),
        observacao: form.notes.trim(),
        status: form.status,
      });
      onClose();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] w-screen h-[100dvh] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto isolate">
      <div className="relative bg-white rounded-2xl border border-slate-200/90 w-full max-w-xl shadow-modal flex flex-col max-h-[90vh] my-auto animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#022b22] to-[#033b2e] text-white p-4 sm:p-5 flex items-center justify-between border-b border-forest-700/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-forest-800 border border-forest-600 flex items-center justify-center text-amber-400 font-bold shadow-hairline">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white">
                {mode === 'edit' ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h3>
              <p className="text-[11px] text-forest-200/80">Agendamento de consulta optométrica</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg hover:bg-white/10 text-forest-200/70 hover:text-white transition-colors disabled:opacity-50"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start space-x-2.5 text-xs font-semibold" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="relative">
            <label htmlFor="appointment-patient" className="clinical-label">
              Paciente <span className="text-rose-600">*</span>
              {patientLocked && (
                <span className="ml-1.5 text-forest-700 font-semibold">(preenchido pelo retorno)</span>
              )}
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="appointment-patient"
                type="search"
                autoComplete="off"
                value={patientQuery}
                onChange={(event) => handlePatientInput(event.target.value)}
                onFocus={() => !patientLocked && setShowPatientResults(true)}
                readOnly={patientLocked}
                className={`clinical-input !pl-10 pr-10 font-bold ${patientLocked ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                placeholder="Pesquise por nome, CPF ou telefone..."
              />
              {searchingPatients && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-700 animate-spin" />}
            </div>

            {showPatientResults && !selectedPatient && (
              <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-panel max-h-48 overflow-y-auto p-1">
                {patientResults.map((patient) => (
                  <button
                    type="button"
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatient(patient);
                      setPatientQuery(patient.name);
                      setShowPatientResults(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-forest-50/80 transition-colors"
                  >
                    <span className="block text-xs font-bold text-slate-900">{patient.name}</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">
                      {[patient.cpf ? `CPF ${formatCPF(patient.cpf)}` : null, patient.phone ? formatPhone(patient.phone) : null, patient.city || null].filter(Boolean).join(' • ') || `Código ${patient.id}`}
                    </span>
                  </button>
                ))}
                {!searchingPatients && patientResults.length === 0 && (
                  <p className="px-3 py-2.5 text-xs text-slate-500 font-medium">Nenhum paciente encontrado.</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="appointment-professional" className="clinical-label">Profissional <span className="text-rose-600">*</span></label>
              <select id="appointment-professional" value={form.professionalId} onChange={(event) => updateForm('professionalId', event.target.value)} className="clinical-input font-semibold">
                <option value="">Selecione</option>
                {professionals.map((professional) => <option key={professional.id} value={professional.id}>{professional.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="appointment-procedure" className="clinical-label">Procedimento <span className="text-rose-600">*</span></label>
              <select id="appointment-procedure" value={form.procedureId} onChange={(event) => {
                const procedure = procedures.find((item) => String(item.id) === event.target.value);
                setForm((current) => ({ ...current, procedureId: event.target.value, procedure: procedure?.nome || current.procedure, endTime: procedure ? calculateEndTime(current.startTime, Number(procedure.duracao_minutos || 30)) : current.endTime }));
                setErrorMessage('');
              }} className="clinical-input font-semibold">
                <option value="">{mode === 'edit' && initialData?.procedure ? `Histórico: ${initialData.procedure}` : 'Selecione'}</option>
                {procedures.map((procedure) => <option key={procedure.id} value={procedure.id}>{procedure.nome} · {procedure.duracao_minutos} min</option>)}
                {mode === 'edit' && initialData?.procedureId && !procedures.some((item) => String(item.id) === String(initialData.procedureId)) && <option value={String(initialData.procedureId)}>{initialData.procedure} (inativo)</option>}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="appointment-date" className="clinical-label">Data <span className="text-rose-600">*</span></label>
              <input id="appointment-date" type="date" value={form.date} onChange={(event) => updateForm('date', event.target.value)} className="clinical-input font-mono font-bold" />
            </div>
            <div>
              <label htmlFor="appointment-start" className="clinical-label">Início <span className="text-rose-600">*</span></label>
              <input id="appointment-start" type="time" value={form.startTime} onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value, endTime: selectedProcedure ? calculateEndTime(event.target.value, Number(selectedProcedure.duracao_minutos || 30)) : current.endTime }))} className="clinical-input font-mono font-bold" />
            </div>
            <div>
              <label htmlFor="appointment-end" className="clinical-label">Término <span className="text-rose-600">*</span></label>
              <input id="appointment-end" type="time" value={form.endTime} onChange={(event) => updateForm('endTime', event.target.value)} className={`clinical-input font-mono font-bold ${!isTimeValid ? 'bg-rose-50 border-rose-400 text-rose-900' : ''}`} />
            </div>
          </div>

          {!isTimeValid && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-center space-x-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>O horário de término deve ser posterior ao início.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="appointment-partnership" className="clinical-label">Parceria</label>
              <select id="appointment-partnership" value={form.partnershipId} onChange={(event) => updateForm('partnershipId', event.target.value)} className="clinical-input font-semibold"><option value="">Sem parceria</option>{partnerships.map((partnership) => <option key={partnership.id} value={partnership.id}>{partnership.nome}</option>)}{mode === 'edit' && initialData?.partnershipId && !partnerships.some((item) => String(item.id) === String(initialData.partnershipId)) && <option value={String(initialData.partnershipId)}>{initialData.partnership} (inativa)</option>}</select>
            </div>
            <div>
              <label htmlFor="appointment-priority" className="clinical-label">Prioridade</label>
              <select id="appointment-priority" value={form.priority} onChange={(event) => updateForm('priority', event.target.value)} className="clinical-input font-semibold">
                <option value="normal">Normal</option>
                <option value="alta">Alta / Urgência</option>
                <option value="preferencial">Preferencial</option>
              </select>
            </div>
            {mode === 'create' && (
              <div>
                <label htmlFor="appointment-destination" className="clinical-label">Destino</label>
                <select id="appointment-destination" value={form.status} onChange={(event) => updateForm('status', event.target.value)} className="clinical-input font-semibold">
                  <option value="agendada">Agenda</option>
                  <option value="fila_espera">Fila de espera</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="appointment-notes" className="clinical-label">Observações</label>
            <textarea id="appointment-notes" rows={3} maxLength={500} value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 outline-none focus:border-forest-700 focus:ring-2 focus:ring-forest-700/10 transition-all text-xs" />
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            {selectedProfessional ? `Profissional selecionado: ${selectedProfessional.name}` : 'Selecione um profissional ativo.'}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button type="button" onClick={onClose} disabled={saving} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={!isFormValid || saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{saving ? 'Salvando...' : mode === 'edit' ? 'Salvar' : 'Confirmar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
