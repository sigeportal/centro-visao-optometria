import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronRight, Clock, History, Loader2, Plus, RefreshCw, Search, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listarConsultasPaciente } from '../../../api/pacientes';
import { adaptConsultation, isConsultationFinished } from '../../../domain/consultas';
import { useAuth } from '../../../context/AuthContext';
import { PERMISSIONS } from '../../../constants/permissions';
import RegistrarConsultaRetroativaModal from './RegistrarConsultaRetroativaModal';
import ToastNotification from '../../Common/ToastNotification';

function errorMessage(error) {
  return error?.response?.data?.error?.message || error?.message || 'Não foi possível carregar as consultas.';
}

function formatDate(date) {
  return date ? date.toLocaleDateString('pt-BR') : 'Data não informada';
}

export default function HistoricoConsultasTab({ patient }) {
  const navigate = useNavigate();
  const { can } = useAuth();
  const canOpenClinical = can(PERMISSIONS.CLINICAL_VIEW);
  const canEditClinical = can(PERMISSIONS.CLINICAL_EDIT);
  const canRegisterRetroactive = canEditClinical;

  const [consultations, setConsultations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('todas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRetroModalOpen, setIsRetroModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRetroactiveSaved = (novaConsulta, { openClinical }) => {
    showToast(
      openClinical
        ? 'Consulta retroativa criada com sucesso! Redirecionando para a ficha clínica...'
        : 'Consulta retroativa registrada com sucesso no prontuário.',
      'success'
    );

    if (openClinical && novaConsulta?.id) {
      navigate(`/consultas/${novaConsulta.id}`, {
        state: { returnTo: `/pacientes/${patient?.id}` },
      });
    } else {
      setRefreshKey((v) => v + 1);
    }
  };

  const loadConsultations = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const items = await listarConsultasPaciente(patient.id, { signal });
      setConsultations(items.map((item) => adaptConsultation({
        ...item,
        paciente_id: item.paciente_id || patient.id,
        paciente_nome: item.paciente_nome || patient.name,
      })).filter(Boolean));
    } catch (requestError) {
      if (requestError?.code !== 'ERR_CANCELED') {
        setConsultations([]);
        setError(errorMessage(requestError));
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [patient.id, patient.name]);

  useEffect(() => {
    const controller = new AbortController();
    loadConsultations(controller.signal);
    return () => controller.abort();
  }, [loadConsultations, refreshKey]);

  const filteredConsultations = useMemo(() => consultations.filter((consultation) => {
    if (filter === 'finalizadas' && !isConsultationFinished(consultation.statusCode)) return false;
    if (filter === 'andamento' && consultation.statusCode !== 'em_atendimento') return false;
    const query = searchTerm.trim().toLocaleLowerCase('pt-BR');
    if (!query) return true;
    return [consultation.id, consultation.doctor, consultation.procedure, consultation.status]
      .some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(query));
  }), [consultations, filter, searchTerm]);

  const openConsultation = (consultation) => {
    navigate(`/consultas/${consultation.id}`, {
      state: { returnTo: `/pacientes/${patient.id}` },
    });
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      <div className="clinical-panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">Consultas do Paciente</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Histórico de atendimentos optométricos e fichas clínicas.</p>
        </div>
        <div className="flex items-center gap-2">
          {canRegisterRetroactive && (
            <button
              type="button"
              onClick={() => setIsRetroModalOpen(true)}
              className="btn-primary py-2 px-3.5 text-xs inline-flex items-center gap-1.5 shadow-hairline whitespace-nowrap"
              title="Lançar consulta retroativa a partir de prontuário físico antigo"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lançar Consulta Retroativa</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
            className="w-10 h-10 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl flex items-center justify-center disabled:cursor-wait disabled:text-slate-400 transition-colors shadow-hairline shrink-0"
            title="Atualizar consultas"
            aria-label="Atualizar consultas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-forest-700' : ''}`} />
          </button>
        </div>
      </div>

      <div className="clinical-panel p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'andamento', label: 'Em atendimento' },
            { id: 'finalizadas', label: 'Finalizadas' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                filter === item.id 
                  ? 'bg-forest-700 text-white shadow-hairline' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar código, profissional ou procedimento..."
            className="clinical-input !pl-10"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3.5 flex items-start justify-between gap-3 text-xs text-rose-900 shadow-hairline" role="alert">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
          <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="font-bold underline hover:text-rose-950 shrink-0">
            Tentar novamente
          </button>
        </div>
      )}

      <div className="clinical-table">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr>
              <th className="py-3 px-4">Código</th>
              <th className="py-3 px-4">Data / Horário</th>
              <th className="py-3 px-4">Profissional</th>
              <th className="py-3 px-4">Procedimento</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {!loading && filteredConsultations.map((consultation) => {
              const finished = isConsultationFinished(consultation.statusCode);
              const isRetroactive =
                consultation.origem === 'retroativa' ||
                consultation.origin === 'retroativa' ||
                !consultation.appointmentId;

              return (
                <tr key={consultation.id} className="hover:bg-forest-50/20 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-400">#{consultation.id}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px]">
                    <span className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(consultation.date)} às {consultation.time}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 font-semibold">{consultation.doctor}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    <span>{consultation.procedure}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={finished ? 'badge-finished' : 'badge-waiting'}>
                      {consultation.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openConsultation(consultation)}
                      className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1"
                    >
                      <span>{canOpenClinical ? 'Abrir consulta' : 'Ver resumo'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {loading && (
          <div className="min-h-40 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
            <span>Carregando histórico de consultas...</span>
          </div>
        )}

        {!loading && !error && filteredConsultations.length === 0 && (
          <div className="min-h-40 flex flex-col items-center justify-center text-center px-4 py-8">
            <Stethoscope className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">Nenhuma consulta registrada para este paciente</p>
          </div>
        )}
      </div>

      {/* Modal de Registro de Consulta Retroativa */}
      <RegistrarConsultaRetroativaModal
        isOpen={isRetroModalOpen}
        onClose={() => setIsRetroModalOpen(false)}
        patient={patient}
        onSaved={handleRetroactiveSaved}
      />

      {/* Notificação Toast */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

