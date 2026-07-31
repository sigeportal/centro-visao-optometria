import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import DashboardPage from './pages/Dashboard/DashboardPage';
import PacientesPage from './pages/Pacientes/PacientesPage';
import PacienteFormPage from './pages/Pacientes/PacienteFormPage';
import PacienteDetalhePage from './pages/Pacientes/PacienteDetalhePage';
import AgendaPage from './pages/Agenda/AgendaPage';
import ConsultasPage from './pages/Consultas/ConsultasPage';
import ConsultaDetalhePage from './pages/Consultas/ConsultaDetalhePage';
import FichaClinicaConfigPage from './pages/FichaClinica/FichaClinicaConfigPage';
import LoginPage from './pages/Login/LoginPage';

function PrivateRoutes() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />

        <Route path="/pacientes" element={<PacientesPage />} />
        <Route path="/pacientes/novo" element={<PacienteFormPage />} />
        <Route path="/pacientes/:id" element={<PacienteDetalhePage />} />
        <Route path="/pacientes/:id/editar" element={<PacienteFormPage />} />

        <Route path="/agenda" element={<AgendaPage />} />

        <Route path="/consultas" element={<ConsultasPage />} />
        <Route path="/consultas/:id" element={<ConsultaDetalhePage />} />

        <Route path="/ficha-clinica" element={<FichaClinicaConfigPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/*" element={<PrivateRoutes />} />
      </Routes>
    </AuthProvider>
  );
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}
