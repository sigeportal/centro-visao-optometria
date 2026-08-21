import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  Clock,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { iniciarAtendimento, listarFilaEspera } from '../../api/agenda';
import { adaptAppointment } from '../../domain/agenda';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../constants/permissions';
import { formatDate } from '../../utils/formatters';
import ToastNotification from '../Common/ToastNotification';

function getErrorMessage(error) {
  return error?.response?.data?.error?.message
    || error?.response?.data?.message
    || error?.message
    || 'Não foi possível carregar a fila de espera.';
}

export default function FilaEsperaView({ openNovoAgendamento }) {
  const navigate = useNavigate();
  const { can } = useAuth();
  const canEditAgenda = can(PERMISSIONS.AGENDA_EDIT);
  const canStartAttendance = can(PERMISSIONS.CLINICAL_EDIT);
  const [search, setSearch] = useState('');
  const [waitingList, setWaitingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);

  const loadQueue = useCallback(async (signal) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const items = await listarFilaEspera({ signal });
      setWaitingList(items.map(adaptAppointment).filter(Boolean));
    } catch (error) {
      if (error?.code !== 'ERR_CANCELED') {
        setWaitingList([]);
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadQueue(controller.signal);
    return () => controller.abort();
  }, [loadQueue, refreshKey]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    if (!term) return waitingList;
    return waitingList.filter((item) => [item.patient, item.doctor, item.procedure]
      .some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(term)));
  }, [search, waitingList]);

  const handleStartAttendance = async (item) => {
    if (!canStartAttendance || startingId) return;
    setStartingId(item.id);
    try {
      const result = await iniciarAtendimento(item.id);
      if (!result?.consulta_id) throw new Error('A API não retornou a consulta iniciada.');
      setWaitingList((current) => current.filter((queueItem) => queueItem.id !== item.id));
      navigate(`/consultas/${result.consulta_id}`);
    } catch (error) {
      setToast({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12 text-xs">
      {/* Top Header Card */}
      <div className="clinical-panel p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center font-bold shadow-hairline">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Fila de Espera da Recepção</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Pacientes presentes na clínica aguardando atendimento clínico</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
            className="w-10 h-10 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl flex items-center justify-center disabled:cursor-wait disabled:text-slate-400 transition-colors shadow-hairline"
            title="Atualizar fila"
            aria-label="Atualizar fila"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-forest-700' : ''}`} />
          </button>
          {canEditAgenda && (
            <button
              type="button"
              onClick={openNovoAgendamento}
              className="h-10 btn-primary px-4"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar à Fila</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Counter */}
      <div className="clinical-panel p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar por paciente, profissional ou procedimento..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="clinical-input !pl-10"
          />
        </div>
        <div className="text-xs font-semibold text-slate-600">
          Aguardando atendimento: <span className="font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/70">{filtered.length} paciente(s)</span>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-start justify-between gap-3 text-xs text-rose-900 shadow-hairline" role="alert">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="font-bold underline hover:text-rose-950 shrink-0">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Modern Table Card */}
      <div className="clinical-table">
        <table className="w-full text-left border-collapse min-w-[860px]">
          <thead>
            <tr>
              <th className="py-3 px-4 whitespace-nowrap">Agendamento</th>
              <th className="py-3 px-4 whitespace-nowrap">Paciente</th>
              <th className="py-3 px-4 whitespace-nowrap">Profissional</th>
              <th className="py-3 px-4 whitespace-nowrap">Procedimento</th>
              <th className="py-3 px-4 whitespace-nowrap">Prioridade</th>
              <th className="py-3 px-4 text-right whitespace-nowrap">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filtered.map((item) => {
              const isStarting = startingId === item.id;
              return (
                <tr key={item.id} className="hover:bg-forest-50/20 transition-colors">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-mono font-bold text-slate-900">{formatDate(item.date)} às {item.startTime}</div>
                    <span className="badge-waiting inline-block mt-0.5 text-[9px]">Na fila</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{item.patient}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{item.doctor}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{item.procedure}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="badge-neutral">
                      {item.priority || 'normal'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {canStartAttendance ? (
                      <button
                        type="button"
                        onClick={() => handleStartAttendance(item)}
                        disabled={Boolean(startingId)}
                        className="btn-primary py-1.5 px-3 text-xs"
                      >
                        {isStarting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{isStarting ? 'Iniciando...' : 'Iniciar atendimento'}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400">Somente Optometrista</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {loading && (
          <div className="min-h-40 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
            <span>Carregando fila de espera...</span>
          </div>
        )}

        {!loading && !errorMessage && filtered.length === 0 && (
          <div className="min-h-44 flex flex-col items-center justify-center text-center px-4 py-8">
            <CalendarClock className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">Nenhum paciente na fila de espera</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Os pacientes aparecem aqui automaticamente após o check-in na recepção.</p>
          </div>
        )}
      </div>

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

