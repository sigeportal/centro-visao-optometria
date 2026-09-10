import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Calendar,
  Clock,
  FileCheck,
  History,
  Info,
  Loader2,
  Lock,
  Stethoscope,
  User,
  X,
} from 'lucide-react';
import { listarProcedimentosAgenda, listarProfissionais } from '../../../api/agenda';
import { criarConsulta } from '../../../api/consultas';
import { formatCPF, formatPhone } from '../../../utils/formatters';

const DEFAULT_PROCEDURES = [
  { id: '1', nome: 'Consulta Optométrica' },
  { id: '2', nome: 'Refração Completa' },
  { id: '3', nome: 'Adaptação de Lentes de Contato' },
  { id: '4', nome: 'Avaliação de Retorno' },
  { id: '5', nome: 'Tonometria' },
  { id: '6', nome: 'Fundoscopia' },
];

function getTodayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    'Não foi possível registrar a consulta retroativa.'
  );
}

export default function RegistrarConsultaRetroativaModal({
  isOpen,
  onClose,
  patient,
  onSaved,
}) {
  const todayIso = useMemo(() => getTodayIso(), []);

  const [form, setForm] = useState({
    data: todayIso,
    hora: '14:00',
    profissional: '',
    profissionalId: '',
    procedimento: 'Consulta Optométrica',
    procedimentoId: '',
    observacao: '',
  });

  const [professionals, setProfessionals] = useState([]);
  const [procedures, setProcedures] = useState(DEFAULT_PROCEDURES);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [savingAction, setSavingAction] = useState(null); // 'register' | 'fill' | null
  const [errorMessage, setErrorMessage] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Load professionals and procedures when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    setLoadingMetadata(true);
    setErrorMessage('');
    setSavingAction(null);

    (async () => {
      try {
        const [profList, procList] = await Promise.all([
          listarProfissionais({ signal: controller.signal }).catch(() => []),
          listarProcedimentosAgenda({ signal: controller.signal }).catch(() => []),
        ]);

        if (controller.signal.aborted) return;

        // Normalise professionals
        const parsedProfessionals = Array.isArray(profList)
          ? profList.map((p) => ({
              id: String(p.id),
              nome: p.nome || p.name || 'Profissional',
              conselho: p.conselho || p.crm || '',
            }))
          : [];

        // Normalise procedures with fallback
        const parsedProcedures = Array.isArray(procList) && procList.length > 0
          ? procList.map((p) => ({
              id: String(p.id),
              nome: p.nome || p.descricao || 'Procedimento',
            }))
          : DEFAULT_PROCEDURES;

        setProfessionals(parsedProfessionals);
        setProcedures(parsedProcedures);

        // Initialise form selections
        const defaultProf = parsedProfessionals[0] || null;
        const defaultProc =
          parsedProcedures.find((p) => p.nome?.toLowerCase().includes('optométrica')) ||
          parsedProcedures[0] ||
          DEFAULT_PROCEDURES[0];

        setForm((prev) => ({
          ...prev,
          data: todayIso,
          hora: '14:00',
          profissional: defaultProf?.nome || '',
          profissionalId: defaultProf?.id || '',
          procedimento: defaultProc?.nome || 'Consulta Optométrica',
          procedimentoId: defaultProc?.id || '',
          observacao: '',
        }));
      } catch (err) {
        if (!controller.signal.aborted) {
          setErrorMessage('Não foi possível carregar profissionais ou procedimentos.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMetadata(false);
        }
      }
    })();

    return () => controller.abort();
  }, [isOpen, todayIso]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !savingAction) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, savingAction]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrorMessage('');
  };

  const handleProfessionalChange = (e) => {
    const selectedId = e.target.value;
    const prof = professionals.find((p) => p.id === selectedId);
    setForm((prev) => ({
      ...prev,
      profissionalId: selectedId,
      profissional: prof?.nome || selectedId,
    }));
    setErrorMessage('');
  };

  const handleProcedureChange = (e) => {
    const selectedId = e.target.value;
    const proc = procedures.find((p) => p.id === selectedId);
    setForm((prev) => ({
      ...prev,
      procedimentoId: selectedId,
      procedimento: proc?.nome || selectedId,
    }));
    setErrorMessage('');
  };

  const isFutureDate = form.data && form.data > todayIso;

  const handleSubmit = async (openClinical) => {
    if (savingAction) return;

    // Basic Validations
    if (!patient?.id) {
      setErrorMessage('Paciente não identificado.');
      return;
    }

    if (!form.data) {
      setErrorMessage('A data da consulta é obrigatória.');
      return;
    }

    if (form.data > todayIso) {
      setErrorMessage('A data da consulta retroativa não pode ser futura. Selecione uma data no passado ou a data de hoje.');
      return;
    }

    if (!form.profissional) {
      setErrorMessage('Selecione o profissional responsável pelo atendimento.');
      return;
    }

    if (!form.procedimento) {
      setErrorMessage('Selecione o procedimento realizado.');
      return;
    }

    setSavingAction(openClinical ? 'fill' : 'register');
    setErrorMessage('');

    try {
      const payload = {
        paciente_id: Number(patient.id),
        profissional: form.profissional.trim(),
        profissional_id: form.profissionalId ? Number(form.profissionalId) : undefined,
        procedimento: form.procedimento.trim(),
        procedimento_id: form.procedimentoId ? Number(form.procedimentoId) : undefined,
        data: form.hora ? `${form.data}T${form.hora}:00` : `${form.data}T00:00:00`,
        data_consulta: form.data,
        hora_consulta: form.hora || '14:00',
        hora: form.hora || '14:00',
        status: 'realizada',
        origem: 'retroativa',
        observacao: form.observacao?.trim() || 'Consulta retroativa inserida via migração de prontuário físico',
        observacoes: form.observacao?.trim() || 'Consulta retroativa inserida via migração de prontuário físico',
        agendamento_id: null,
      };

      const response = await criarConsulta(payload);

      const novaConsulta =
        typeof response === 'object' && response !== null
          ? { ...payload, ...response, id: response.id || response.consulta_id }
          : { ...payload, id: response };

      if (onSaved) {
        onSaved(novaConsulta, { openClinical });
      }
      onClose();
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setSavingAction(null);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !savingAction) {
          onClose();
        }
      }}
    >
      <div className="relative bg-white rounded-2xl border border-slate-200/90 w-full max-w-xl shadow-modal flex flex-col max-h-[92vh] my-auto animate-fade-in text-xs overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#022b22] to-[#033b2e] text-white p-4 sm:p-5 flex items-center justify-between border-b border-forest-700/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-forest-800 border border-forest-600 flex items-center justify-center text-amber-400 font-bold shadow-hairline shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                Lançar Consulta Retroativa
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Histórico
                </span>
              </h3>
              <p className="text-[11px] text-forest-200/80">
                Registro manual de consultas e fichas clínicas anteriores à implantação do sistema
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(savingAction)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-forest-200/70 hover:text-white transition-colors disabled:opacity-50"
            title="Fechar"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 bg-white overflow-y-auto flex-1">
          {/* Locked Patient Display Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Paciente Selecionado
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded font-semibold">
                <Lock className="w-2.5 h-2.5" /> Fixo
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-0.5">
              <span className="font-bold text-slate-900 text-sm">
                {patient?.name || patient?.nome || 'Paciente não informado'}
              </span>
              <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px]">
                {patient?.cpf && <span>CPF: {formatCPF(patient.cpf)}</span>}
                {patient?.phone && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>{formatPhone(patient.phone)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            {/* Row 1: Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Data da Consulta <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  value={form.data}
                  max={todayIso}
                  onChange={(e) => updateField('data', e.target.value)}
                  disabled={Boolean(savingAction)}
                  className={`clinical-input w-full ${
                    isFutureDate ? '!border-rose-400 !bg-rose-50/40 text-rose-900' : ''
                  }`}
                  required
                />
                {isFutureDate && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    Consultas retroativas não podem ter data futura.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5 text-xs">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Horário Aproximado
                </label>
                <input
                  type="time"
                  value={form.hora}
                  onChange={(e) => updateField('hora', e.target.value)}
                  disabled={Boolean(savingAction)}
                  className="clinical-input w-full"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Padrão 14:00 caso o horário original seja desconhecido.
                </p>
              </div>
            </div>

            {/* Row 2: Professional and Procedure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5 text-xs">
                  <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                  Profissional Responsável <span className="text-rose-600">*</span>
                </label>
                <select
                  value={form.profissionalId || form.profissional}
                  onChange={handleProfessionalChange}
                  disabled={Boolean(savingAction) || loadingMetadata}
                  className="clinical-input w-full bg-white"
                  required
                >
                  {professionals.length === 0 ? (
                    <option value="">
                      {loadingMetadata ? 'Carregando profissionais...' : 'Nenhum profissional cadastrado'}
                    </option>
                  ) : (
                    professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} {p.conselho ? `(${p.conselho})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5 text-xs">
                  <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                  Procedimento <span className="text-rose-600">*</span>
                </label>
                <select
                  value={form.procedimentoId || form.procedimento}
                  onChange={handleProcedureChange}
                  disabled={Boolean(savingAction) || loadingMetadata}
                  className="clinical-input w-full bg-white"
                  required
                >
                  {procedures.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Notes / Physical Origin */}
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5 text-xs">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                Observação / Origem Física
                <span className="text-slate-400 font-normal text-[11px]">(Opcional)</span>
              </label>
              <textarea
                rows={2}
                value={form.observacao}
                onChange={(e) => updateField('observacao', e.target.value)}
                disabled={Boolean(savingAction)}
                placeholder="Ex: Migrado da ficha em papel nº 123, Prontuário de arquivo antigo, etc."
                className="clinical-input w-full resize-none py-2 text-xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Anotação para fins de auditoria interna e localização da pasta física original.
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs text-rose-900 shadow-hairline animate-fade-in"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">
                <p className="font-semibold">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="text-rose-500 hover:text-rose-700 p-0.5"
                title="Fechar aviso"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/80 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(savingAction)}
            className="btn-secondary w-full sm:w-auto py-2 px-4 text-xs font-semibold"
          >
            Cancelar
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Salvar apenas registro */}
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={Boolean(savingAction) || isFutureDate}
              className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              title="Cria o registro histórico da consulta no prontuário sem abrir a ficha clínica imediatamente"
            >
              {savingAction === 'register' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar apenas registro</span>
              )}
            </button>

            {/* Salvar e Preencher Ficha Clínica */}
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={Boolean(savingAction) || isFutureDate}
              className="btn-primary py-2 px-4 text-xs flex items-center justify-center gap-1.5 shadow-hairline disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cria a consulta retroativa e abre imediatamente o atendimento para digitalização dos exames e dados refrativos"
            >
              {savingAction === 'fill' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Salvando e abrindo...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Salvar e Preencher Ficha Clínica</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
