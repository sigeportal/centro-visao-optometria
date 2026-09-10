import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronLeft, ChevronRight, History, Loader2, Plus, Search, Users } from 'lucide-react';
import { listarPacientes } from '../../api/pacientes';
import { adaptPatient } from '../../domain/pacientes';
import { formatCPF, formatPhone } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../constants/permissions';
import RegistrarConsultaRetroativaModal from './components/RegistrarConsultaRetroativaModal';
import ToastNotification from '../Common/ToastNotification';

function errorMessage(error) {
  return error?.response?.data?.error?.message || error?.message || 'Não foi possível carregar os pacientes.';
}

export default function PacientesView({ openNovoPaciente, setSelectedPatient, setActiveModule }) {
  const navigate = useNavigate();
  const { can } = useAuth();
  const canRegisterRetroactive = can(PERMISSIONS.CLINICAL_EDIT);

  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [retroPatient, setRetroPatient] = useState(null);
  const [toast, setToast] = useState(null);
  const limit = 10;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRetroactiveSaved = (novaConsulta, { openClinical }) => {
    const patientName = retroPatient?.name || 'o paciente';
    const savedPatient = retroPatient;
    setRetroPatient(null);

    showToast(
      openClinical
        ? 'Consulta retroativa criada com sucesso! Redirecionando para a ficha clínica...'
        : `Consulta retroativa registrada com sucesso para ${patientName}!`,
      'success'
    );

    if (openClinical && novaConsulta?.id) {
      if (setSelectedPatient && savedPatient) {
        setSelectedPatient(savedPatient);
      }
      navigate(`/consultas/${novaConsulta.id}`, {
        state: { returnTo: '/pacientes' },
      });
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const result = await listarPacientes({ busca: searchTerm, page, limit }, { signal: controller.signal });
        setPatients(result.items.map(adaptPatient).filter(Boolean));
        setTotal(result.total);
      } catch (requestError) {
        if (requestError?.code !== 'ERR_CANCELED') {
          setPatients([]);
          setTotal(0);
          setError(errorMessage(requestError));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [searchTerm, page, refreshKey]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12 text-xs">
      {/* Top Banner */}
      <div className="clinical-panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 border border-forest-200/80 flex items-center justify-center shadow-hairline">
            <Users className="w-5 h-5 text-forest-700" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Pacientes & Prontuários</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Cadastros da clínica e histórico completo de atendimentos</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openNovoPaciente}
          className="h-10 btn-primary px-4"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Paciente</span>
        </button>
      </div>

      {/* Search and Counts */}
      <div className="clinical-panel p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar por nome, CPF ou cidade..."
            value={searchTerm}
            onChange={handleSearch}
            className="clinical-input !pl-10"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Total de cadastros: <span className="font-bold text-forest-900 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200/70">{total} paciente{total === 1 ? '' : 's'}</span>
        </span>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 flex items-start justify-between gap-3 shadow-hairline" role="alert">
          <span className="flex items-start gap-2.5 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            {error}
          </span>
          <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="font-bold underline hover:text-rose-950">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Modern Table */}
      <div className="clinical-table">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr>
              <th className="py-3 px-4">Cód.</th>
              <th className="py-3 px-4">Nome do paciente</th>
              <th className="py-3 px-4">Contato / Cidade</th>
              <th className="py-3 px-4">Idade</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {!loading && patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-forest-50/20 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-slate-400">#{patient.id}</td>
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900">{patient.name}</div>
                  <span className="text-[10.5px] text-slate-400 font-mono">CPF: {formatCPF(patient.cpf) || 'Não informado'}</span>
                </td>
                <td className="py-3.5 px-4 text-slate-700">
                  <div className="font-semibold text-slate-800">{formatPhone(patient.phone) || 'Telefone não informado'}</div>
                  <div className="text-[10.5px] text-slate-400">{patient.city || 'Cidade não informada'}{patient.state ? ` - ${patient.state}` : ''}</div>
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-700">
                  {patient.age !== null && patient.age !== undefined ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-forest-50 text-forest-800 border border-forest-200/70 font-bold text-[11px]">
                      {patient.age} {patient.age === 1 ? 'ano' : 'anos'}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal">Não informada</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {canRegisterRetroactive && (
                      <button
                        type="button"
                        onClick={() => setRetroPatient(patient)}
                        className="btn-secondary py-1.5 px-2.5 text-xs inline-flex items-center gap-1.5 text-forest-800 hover:text-forest-900 hover:bg-forest-50 border-forest-200/80 transition-colors shadow-hairline whitespace-nowrap"
                        title="Lançar consulta retroativa para este paciente"
                      >
                        <History className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                        <span>Lançar Consulta Retroativa</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setSelectedPatient(patient); setActiveModule('paciente-detalhe'); }}
                      className="btn-secondary py-1.5 px-3 text-xs shadow-hairline whitespace-nowrap"
                    >
                      Abrir prontuário
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <div className="min-h-40 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
            <span>Carregando pacientes...</span>
          </div>
        )}

        {!loading && !error && patients.length === 0 && (
          <div className="min-h-40 flex items-center justify-center text-xs font-bold text-slate-400">
            Nenhum paciente encontrado
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && total > 0 && (
        <div className="flex items-center justify-end gap-2 text-xs pt-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 disabled:text-slate-300 disabled:hover:bg-white transition-colors shadow-hairline"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-600 px-2">Página {page} de {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((value) => value + 1)}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 disabled:text-slate-300 disabled:hover:bg-white transition-colors shadow-hairline"
            title="Próxima página"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal de Lançamento de Consulta Retroativa */}
      {retroPatient && (
        <RegistrarConsultaRetroativaModal
          isOpen={Boolean(retroPatient)}
          onClose={() => setRetroPatient(null)}
          patient={retroPatient}
          onSaved={handleRetroactiveSaved}
        />
      )}

      {/* Toast Notification */}
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

