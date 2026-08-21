import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CalendarPlus, Loader2, RefreshCw, Sparkles, UserPlus } from 'lucide-react';
import KPICardsSection from './components/KPICardsSection';
import NextAppointmentsSection from './components/NextAppointmentsSection';
import DashboardAlertsSection from './components/DashboardAlertsSection';
import { useAuth } from '../../context/AuthContext';
import {
  listarAniversariantes,
  listarConsultasVencidas,
  listarProximasConsultas,
  obterResumo,
} from '../../api/dashboard';

const INITIAL_SUMMARY = {
  total_pacientes: 0,
  agendamentos_hoje: 0,
  consultas_realizadas_hoje: 0,
  consultas_mes: 0,
};

function getErrorMessage(error) {
  return error?.response?.data?.error?.message
    || error?.response?.data?.message
    || 'Não foi possível carregar os dados do painel.';
}

export default function DashboardView({ 
  setActiveModule, 
  openNovoAgendamento, 
  openNovoPaciente 
}) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [nextAppointments, setNextAppointments] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [overdueAppointments, setOverdueAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const summaryData = await obterResumo();
      const nextData = await listarProximasConsultas();
      const birthdayData = await listarAniversariantes();
      const overdueData = await listarConsultasVencidas();

      setSummary({ ...INITIAL_SUMMARY, ...(summaryData || {}) });
      setNextAppointments(Array.isArray(nextData) ? nextData : []);
      setBirthdays(Array.isArray(birthdayData) ? birthdayData : []);
      setOverdueAppointments(Array.isArray(overdueData) ? overdueData : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const firstName = (user?.funcionario || user?.username || 'Profissional').split(' ')[0];

  return (
    <div className="space-y-5 animate-fade-in text-xs">
      {/* Editorial Hero Banner */}
      <div className="bg-gradient-to-r from-[#022b22] via-[#033b2e] to-[#022b22] text-white p-5 sm:p-6 rounded-2xl shadow-hairline border border-forest-700/60 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Ambient subtle glow */}
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-forest-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Olá, <span className="text-forest-300">{firstName}</span>!
          </h1>
          <p className="text-xs text-forest-100/80 font-normal max-w-xl">
            Acompanhe o fluxo de pacientes agendados, atendimentos e indicadores da clínica.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openNovoAgendamento}
            className="px-4 py-2.5 bg-forest-600 hover:bg-forest-500 active:bg-forest-700 text-white font-bold rounded-xl shadow-hairline flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Novo agendamento</span>
          </button>

          <button
            type="button"
            onClick={openNovoPaciente}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white font-bold rounded-xl border border-white/20 flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo paciente</span>
          </button>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-forest-100 hover:text-white border border-white/10 transition-colors disabled:opacity-50"
            title="Atualizar dados"
            aria-label="Atualizar métricas do painel"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between gap-3 shadow-hairline">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
            <span className="font-semibold text-xs">{error}</span>
          </div>
          <button
            type="button"
            onClick={loadDashboard}
            className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors text-xs"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {loading && (
        <div className="clinical-panel p-3 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600" role="status">
          <Loader2 className="w-4 h-4 animate-spin text-forest-700" aria-hidden="true" />
          <span>Carregando dados do painel...</span>
        </div>
      )}

      {/* KPI Metric Summary */}
      <KPICardsSection setActiveModule={setActiveModule} summary={summary} loading={loading} />

      {/* Main Grid: Próximas Consultas & Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <NextAppointmentsSection
            setActiveModule={setActiveModule}
            appointments={nextAppointments}
            loading={loading}
          />
        </div>
        <div className="lg:col-span-1">
          <DashboardAlertsSection
            setActiveModule={setActiveModule}
            birthdays={birthdays}
            overdueAppointments={overdueAppointments}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

