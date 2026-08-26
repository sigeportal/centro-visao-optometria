import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Breadcrumb from './components/Layout/Breadcrumb';
import { useAuth } from './context/AuthContext';
import { PERMISSIONS } from './constants/permissions';

const LoginPage = lazy(() => import('./components/Auth/LoginPage'));
const DashboardView = lazy(() => import('./components/Dashboard/DashboardView'));
const AgendaView = lazy(() => import('./components/Agenda/AgendaView'));
const FilaEsperaView = lazy(() => import('./components/Agenda/FilaEsperaView'));
const PacientesView = lazy(() => import('./components/Pacientes/PacientesView'));
const NovoPacienteModal = lazy(() => import('./components/Pacientes/NovoPacienteModal'));
const PacienteHistoricoView = lazy(() => import('./components/Pacientes/PacienteHistoricoView'));
const WorkspaceAtendimento = lazy(() => import('./components/Atendimento/WorkspaceAtendimento'));
const FinanceiroView = lazy(() => import('./components/Financeiro/FinanceiroView'));
const RelatoriosView = lazy(() => import('./components/Relatorios/RelatoriosView'));
const ConfiguracoesView = lazy(() => import('./components/Configuracoes/ConfiguracoesView'));

function LoadingScreen({ label = 'Carregando...' }) {
  return (
    <div className="min-h-[280px] flex items-center justify-center text-slate-600" role="status">
      <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-hairline text-xs font-semibold">
        <Loader2 className="w-4 h-4 animate-spin text-forest-700" aria-hidden="true" />
        <span className="text-slate-700">{label}</span>
      </div>
    </div>
  );
}

function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-hairline max-w-lg mx-auto my-12 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-rose-600" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Acesso não permitido</h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Seu perfil de usuário não possui permissão para acessar esta funcionalidade da clínica.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold rounded-xl shadow-hairline transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
}

function PermissionRoute({ permissions, children }) {
  const { can } = useAuth();
  const required = Array.isArray(permissions) ? permissions : [permissions];
  return required.some((permission) => can(permission)) ? children : <AccessDenied />;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, sessionLoading } = useAuth();
  if (sessionLoading) return <LoadingScreen label="Validando sessão..." />;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

function ProtectedApp() {
  const { isAuthenticated, sessionLoading } = useAuth();
  if (sessionLoading) return <LoadingScreen label="Carregando sessão..." />;
  return isAuthenticated ? <ApplicationShell /> : <Navigate to="/login" replace />;
}

function getActiveModule(pathname) {
  if (pathname.startsWith('/agenda')) return 'agenda';
  if (pathname.startsWith('/fila-espera')) return 'espera';
  if (/^\/pacientes\/.+/.test(pathname)) return 'paciente-detalhe';
  if (pathname.startsWith('/pacientes')) return 'pacientes';
  if (pathname.startsWith('/consultas')) return 'atendimento';
  if (pathname.startsWith('/financeiro')) return 'financeiro';
  if (pathname.startsWith('/relatorios')) return 'relatorios';
  if (pathname.startsWith('/configuracoes')) return 'configuracoes';
  return 'dashboard';
}

function ApplicationShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const selectedPatientRef = useRef(null);
  const [patientActiveTab, setPatientActiveTab] = useState('pessoais');
  const [financeiroSubTab, setFinanceiroSubTab] = useState('fluxo');
  const [novoPacienteOpen, setNovoPacienteOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const activeModule = useMemo(() => getActiveModule(location.pathname), [location.pathname]);

  const selectPatient = useCallback((patient) => {
    selectedPatientRef.current = patient;
    setSelectedPatient(patient);
  }, []);

  const setActiveModule = useCallback((module, navigationOptions = {}) => {
    const patientId = selectedPatientRef.current?.id;
    const paths = {
      dashboard: '/',
      agenda: '/agenda',
      espera: '/fila-espera',
      pacientes: '/pacientes',
      'paciente-detalhe': patientId ? `/pacientes/${patientId}` : '/pacientes',
      atendimento: '/consultas',
      financeiro: '/financeiro',
      relatorios: '/relatorios',
      configuracoes: '/configuracoes',
    };
    navigate(paths[module] || '/', navigationOptions);
  }, [navigate]);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const handleSavePacienteAndAttend = useCallback((patientData, scheduleNow = false) => {
    selectPatient(patientData);
    setNovoPacienteOpen(false);
    setPatientActiveTab('pessoais');
    setActiveModule(scheduleNow ? 'agenda' : 'paciente-detalhe');
    showToast(`Paciente ${patientData.name} cadastrado com sucesso.`);
  }, [selectPatient, setActiveModule, showToast]);

  const handleOpenPatientDetails = (tab = 'pessoais') => {
    setPatientActiveTab(tab);
    setActiveModule('paciente-detalhe');
  };

  const handleUpdatePatient = useCallback((updatedPatient, options = {}) => {
    selectPatient(updatedPatient);
    if (!options.silent) {
      showToast(`Cadastro de ${updatedPatient.name} atualizado com sucesso!`);
    }
  }, [selectPatient, showToast]);

  const getFinanceiroSubTitle = () => {
    const labels = {
      fluxo: 'Fluxo Diário',
      receber: 'Contas a Receber',
      pagar: 'Contas a Pagar',
      visao: 'Visão Geral',
    };
    return labels[financeiroSubTab] || labels.fluxo;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans print:bg-white print:min-h-0">
      <Header
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        setActiveModule={setActiveModule}
      />

      <div className="flex flex-1 relative">
        <Sidebar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          sidebarOpen={sidebarOpen}
          setFinanceiroSubTab={setFinanceiroSubTab}
        />

        <main className={`flex-1 transition-all duration-200 p-4 sm:p-6 lg:p-7 max-w-[1640px] mx-auto w-full print:m-0 print:p-0 print:max-w-full print:ml-0 ${sidebarOpen ? 'ml-56' : 'ml-16'}`}>
          <Breadcrumb
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            subTitle={activeModule === 'paciente-detalhe'
              ? selectedPatient?.name
              : activeModule === 'financeiro'
                ? getFinanceiroSubTitle()
                : null}
          />

          <Suspense fallback={<LoadingScreen label="Carregando módulo..." />}>
            <Routes>
              <Route path="/" element={(
                <PermissionRoute permissions={PERMISSIONS.DASHBOARD_VIEW}>
                  <DashboardView
                    setActiveModule={setActiveModule}
                    openNovoAgendamento={() => setActiveModule('agenda')}
                    openNovoPaciente={() => setNovoPacienteOpen(true)}
                  />
                </PermissionRoute>
              )} />
              <Route path="/agenda" element={(
                <PermissionRoute permissions={PERMISSIONS.AGENDA_VIEW}>
                  <AgendaView
                    setActiveModule={setActiveModule}
                  />
                </PermissionRoute>
              )} />
              <Route path="/fila-espera" element={(
                <PermissionRoute permissions={PERMISSIONS.AGENDA_VIEW}>
                  <FilaEsperaView
                    setActiveModule={setActiveModule}
                    openNovoAgendamento={() => setActiveModule('agenda')}
                  />
                </PermissionRoute>
              )} />
              <Route path="/pacientes" element={(
                <PermissionRoute permissions={PERMISSIONS.PATIENT_VIEW}>
                  <PacientesView
                    openNovoPaciente={() => setNovoPacienteOpen(true)}
                    setSelectedPatient={selectPatient}
                    setActiveModule={setActiveModule}
                  />
                </PermissionRoute>
              )} />
              <Route path="/pacientes/:patientId" element={(
                <PermissionRoute permissions={PERMISSIONS.PATIENT_VIEW}>
                  <PacienteHistoricoView
                    patient={selectedPatient}
                    initialTab={patientActiveTab}
                    setActiveModule={setActiveModule}
                    onSavePatient={handleUpdatePatient}
                  />
                </PermissionRoute>
              )} />
              <Route path="/consultas" element={(
                <PermissionRoute permissions={PERMISSIONS.CONSULTATION_SUMMARY}>
                  <WorkspaceAtendimento
                    patient={selectedPatient}
                    setActiveModule={setActiveModule}
                    onViewProfile={() => handleOpenPatientDetails('pessoais')}
                    onViewHistory={() => handleOpenPatientDetails('consultas')}
                  />
                </PermissionRoute>
              )} />
              <Route path="/consultas/:consultationId" element={(
                <PermissionRoute permissions={PERMISSIONS.CONSULTATION_SUMMARY}>
                  <WorkspaceAtendimento />
                </PermissionRoute>
              )} />
              <Route path="/financeiro" element={(
                <Navigate to="/" replace />
              )} />
              <Route path="/relatorios" element={(
                <PermissionRoute permissions={[PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.CONSULTATION_SUMMARY, PERMISSIONS.PATIENT_VIEW, PERMISSIONS.AGENDA_VIEW]}>
                  <RelatoriosView
                    setActiveModule={setActiveModule}
                  />
                </PermissionRoute>
              )} />
              <Route path="/configuracoes" element={(
                <PermissionRoute permissions={[PERMISSIONS.SYSTEM_ADMIN, PERMISSIONS.CLINICAL_FORM_CONFIGURE]}>
                  <ConfiguracoesView />
                </PermissionRoute>
              )} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      <Suspense fallback={null}>
        <NovoPacienteModal
          isOpen={novoPacienteOpen}
          onClose={() => setNovoPacienteOpen(false)}
          onSaveAndAttend={handleSavePacienteAndAttend}
        />
      </Suspense>

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#02241d]/95 text-white px-4 py-3 rounded-xl border border-forest-600/60 shadow-modal flex items-center space-x-3 text-xs font-semibold backdrop-blur-md animate-fade-in" role="status">
          <span className="w-2 h-2 rounded-full bg-forest-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </Suspense>
  );
}
