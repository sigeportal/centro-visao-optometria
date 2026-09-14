import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileBarChart, 
  Download, 
  Printer, 
  Calendar, 
  Cake, 
  AlertCircle,
  CalendarClock,
  Clock,
  Search,
  CheckCircle2,
  MessageSquare,
  ArrowUpRight,
  Loader2,
  MoreHorizontal,
  PhoneCall,
  Copy
} from 'lucide-react';
import { 
  formatCPF, 
  formatCNPJ,
  formatCEP,
  formatPhone, 
  formatDate, 
  buildReturnWhatsAppMessage, 
  generateNewConsultationMessage,
  buildWhatsAppLink,
  calculateAge
} from '../../utils/formatters';
import { listarAgenda, listarProfissionais } from '../../api/agenda';
import { listarRetornosRelatorio, listarAniversariantesRelatorio } from '../../api/relatorios';
import { obterDadosClinica } from '../../api/configuracoes';
import { useAuth } from '../../context/AuthContext';
import ToastNotification from '../Common/ToastNotification';

const EMPTY_CLINIC = { 
  name: '', 
  cnpj: '', 
  phone: '', 
  address: '', 
  city: '', 
  state: '', 
  cep: '' 
};

function formatTime(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value).slice(11, 16) || String(value);
  return parsed.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatBirthday(value) {
  if (!value) return '';
  const date = String(value).slice(0, 10);
  return formatDate(date);
}

function formatReportDate(value) {
  if (!value) return '';
  return formatDate(String(value).slice(0, 10));
}

function normalizeAppointmentStatus(value) {
  const status = String(value || '').toLowerCase();
  const labels = {
    agendada: 'Agendada',
    confirmada: 'Confirmada',
    atendida: 'Concluído',
    realizada: 'Concluído',
    em_atendimento: 'Em Atendimento',
    fila_espera: 'Fila de Espera',
    cancelada: 'Cancelada',
  };
  return labels[status] || value || 'Sem status';
}

function normalizeReturnStatus(value) {
  const status = String(value || '').toLowerCase();
  if (status === 'vencido') {
    return { status: 'Data prevista ultrapassada', statusKey: 'ultrapassada', statusColor: 'badge-cancelled' };
  }
  if (status === 'proximo') {
    return { status: 'Próximo da data', statusKey: 'proximo', statusColor: 'badge-pending' };
  }
  return { status: 'Data prevista', statusKey: 'prevista', statusColor: 'badge-confirmed' };
}

function normalizeNewConsultationStatus(value) {
  const status = String(value || '').toLowerCase();
  if (status === 'vencido') {
    return { status: 'Prazo expirado', statusKey: 'vencido', statusColor: 'badge-cancelled' };
  }
  if (status === 'proximo') {
    return { status: 'Janela de contato (30 dias)', statusKey: 'proximo', statusColor: 'badge-pending' };
  }
  return { status: 'Em dia / Futura', statusKey: 'programado', statusColor: 'badge-confirmed' };
}

export default function RelatoriosView({ setActiveModule }) {
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState('retornos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [returns, setReturns] = useState([]);
  const [newConsultations, setNewConsultations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [clinicInfo, setClinicInfo] = useState(EMPTY_CLINIC);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionMenu, setActionMenu] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  useEffect(() => {
    if (!actionMenu) return;
    const handleClose = () => setActionMenu(null);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActionMenu(null);
    };
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [actionMenu]);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    async function loadReports() {
      setLoading(true);
      setErrorMessage('');
      try {
        const results = await Promise.allSettled([
          listarRetornosRelatorio({ signal: controller.signal }),
          listarAgenda({}, { signal: controller.signal }),
          listarProfissionais({ signal: controller.signal }),
          listarAniversariantesRelatorio({ periodo: 'mes' }, { signal: controller.signal }),
          obterDadosClinica({ signal: controller.signal }),
        ]);

        if (!mounted) return;

        const [returnsResult, appointmentsResult, professionalsResult, birthdaysResult, clinicResult] = results;

        if (returnsResult.status === 'fulfilled') {
          const rawItems = Array.isArray(returnsResult.value) ? returnsResult.value : [];
          const retornosList = [];
          const novasList = [];
          const toBool = (val) => val === 1 || val === '1' || val === true || val === 'true';

          rawItems.forEach((item) => {
            const temRetorno = (toBool(item.tem_retorno) || ((item.tem_retorno == null || item.tem_retorno === '') && Boolean(item.data_retorno))) && Boolean(item.data_retorno);
            const temNova = (toBool(item.tem_nova_consulta) || Boolean(item.nova_consulta_data)) && Boolean(item.nova_consulta_data);

            if (temRetorno && item.data_retorno) {
              retornosList.push({
                id: item.id,
                patientId: item.paciente_id,
                patientName: item.paciente_nome || item.paciente || 'Paciente não informado',
                cpf: item.cpf || '',
                phone: item.telefone || '',
                doctor: item.profissional || 'Profissional não informado',
                consultationDate: item.consulta_data || '',
                returnDate: item.data_retorno || '',
                returnType: item.tipo || 'Acompanhamento',
                reason: item.motivo || item.observacao || 'Sem motivo informado',
                ...normalizeReturnStatus(item.status),
              });
            }

            if (temNova && item.nova_consulta_data) {
              novasList.push({
                id: item.id,
                patientId: item.paciente_id,
                patientName: item.paciente_nome || item.paciente || 'Paciente não informado',
                cpf: item.cpf || '',
                phone: item.telefone || '',
                doctor: item.profissional || 'Profissional não informado',
                consultationDate: item.consulta_data || '',
                estimatedDate: item.nova_consulta_data || '',
                reason: item.nova_consulta_motivo || item.nova_consulta_observacao || 'Revisão periódica / Validade dos óculos',
                observation: item.nova_consulta_observacao || '',
                ...normalizeNewConsultationStatus(item.nova_consulta_status || item.status),
              });
            }

            if (!temRetorno && !temNova && item.data_retorno) {
              retornosList.push({
                id: item.id,
                patientId: item.paciente_id,
                patientName: item.paciente_nome || item.paciente || 'Paciente não informado',
                cpf: item.cpf || '',
                phone: item.telefone || '',
                doctor: item.profissional || 'Profissional não informado',
                consultationDate: item.consulta_data || '',
                returnDate: item.data_retorno || '',
                returnType: item.tipo || 'Acompanhamento',
                reason: item.motivo || item.observacao || 'Sem motivo informado',
                ...normalizeReturnStatus(item.status),
              });
            }
          });

          setReturns(retornosList);
          setNewConsultations(novasList);
        }

        if (appointmentsResult.status === 'fulfilled') {
          setAppointments(appointmentsResult.value.map((item) => ({
            id: item.id,
            rawDate: item.inicio,
            date: formatReportDate(item.inicio),
            time: formatTime(item.inicio),
            patient: item.paciente || 'Paciente não informado',
            doctor: item.profissional || 'Profissional não informado',
            procedure: item.procedimento || 'Consulta',
            status: normalizeAppointmentStatus(item.status),
          })));
        }

        if (professionalsResult.status === 'fulfilled') {
          setProfessionals(professionalsResult.value
            .map((item) => ({
              id: item.id,
              name: item.nome || item.name || '',
            }))
            .filter((item) => item.name));
        }

        if (birthdaysResult.status === 'fulfilled') {
          setBirthdays(birthdaysResult.value.map((item) => ({
            id: item.id,
            name: item.nome || 'Paciente não informado',
            age: calculateAge(item.data_nascimento),
            date: formatBirthday(item.data_nascimento),
            phone: item.celular || '',
          })));
        }

        if (clinicResult.status === 'fulfilled') {
          const raw = clinicResult.value || {};
          setClinicInfo({
            name: raw.nome || raw.name || '',
            cnpj: raw.cnpj || '',
            phone: raw.telefone || raw.phone || '',
            address: raw.endereco || raw.address || '',
            city: raw.cidade || raw.city || '',
            state: raw.estado || raw.state || '',
            cep: raw.cep || '',
          });
        }

        const reportFailures = results.slice(0, 4).filter((result) => result.status === 'rejected');
        if (reportFailures.length > 0) {
          console.error('Erro ao carregar parte dos relatórios:', reportFailures);
          setErrorMessage('Alguns relatórios não puderam ser carregados.');
        }
      } catch (error) {
        if (error?.name !== 'CanceledError' && error?.code !== 'ERR_CANCELED') {
          console.error('Erro ao carregar relatórios:', error);
          if (mounted) setErrorMessage('Não foi possível carregar os dados dos relatórios.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadReports();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const reportsList = [
    { 
      id: 'retornos', 
      title: 'Retornos Gratuitos', 
      description: 'Acompanhamento clínico imediato (isento R$ 0,00)',
      icon: CalendarClock, 
      count: returns.length,
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300'
    },
    { 
      id: 'novas_consultas', 
      title: 'Novas Consultas (CRM)', 
      description: 'Revisão periódica e validade dos óculos',
      icon: PhoneCall, 
      count: newConsultations.length,
      badgeColor: 'bg-forest-100 text-forest-900 border-forest-300'
    },
    { 
      id: 'agendamentos', 
      title: 'Agendamentos', 
      description: 'Grade de horários e taxa de comparecimento',
      icon: Calendar, 
      count: appointments.length,
      badgeColor: 'bg-forest-100 text-forest-900 border-forest-300'
    },
    { 
      id: 'aniversariantes', 
      title: 'Aniversariantes', 
      description: 'Pacientes que fazem aniversário no período',
      icon: Cake, 
      count: birthdays.length,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
    },
  ];

  // Filtered Returns
  const filteredReturns = useMemo(() => {
    return returns.filter(item => {
      const matchSearch = searchTerm === '' || 
        item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.cpf.includes(searchTerm) ||
        item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.returnType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDoctor = selectedProfessional === 'all' || item.doctor === selectedProfessional;
      
      const matchStatus = selectedStatus === 'all' || 
        !['ultrapassada', 'prevista', 'proximo'].includes(selectedStatus) ||
        item.statusKey === selectedStatus;

      return matchSearch && matchDoctor && matchStatus;
    });
  }, [returns, searchTerm, selectedProfessional, selectedStatus]);

  // Filtered New Consultations (CRM)
  const filteredNewConsultations = useMemo(() => {
    return newConsultations.filter(item => {
      const matchSearch = searchTerm === '' || 
        item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.cpf.includes(searchTerm) ||
        item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.doctor.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDoctor = selectedProfessional === 'all' || item.doctor === selectedProfessional;
      
      const matchStatus = selectedStatus === 'all' || 
        !['vencido', 'proximo', 'programado'].includes(selectedStatus) ||
        item.statusKey === selectedStatus;

      return matchSearch && matchDoctor && matchStatus;
    });
  }, [newConsultations, searchTerm, selectedProfessional, selectedStatus]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const matchSearch = searchTerm === '' ||
        a.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.procedure.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.date && a.date.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.time && a.time.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchDoctor = selectedProfessional === 'all' || a.doctor === selectedProfessional;
      return matchSearch && matchDoctor;
    });
  }, [appointments, searchTerm, selectedProfessional]);

  const filteredBirthdays = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();
    return birthdays.filter((birthday) => (
      !normalizedSearch || birthday.name.toLowerCase().includes(normalizedSearch)
    ));
  }, [birthdays, searchTerm]);

  const professionalOptions = useMemo(() => (
    [...new Set(professionals.map((item) => item.name).filter(Boolean))].sort()
  ), [professionals]);

  // Export CSV
  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = `relatorio-${activeReport}-${new Date().toISOString().slice(0,10)}.csv`;

    if (activeReport === 'retornos') {
      headers = ['Cód', 'Paciente', 'CPF', 'Telefone', 'Profissional', 'Consulta Origem', 'Data Prevista', 'Tipo', 'Motivo', 'Situação'];
      rows = filteredReturns.map(r => [
        r.id, r.patientName, r.cpf, r.phone, r.doctor, formatReportDate(r.consultationDate), formatReportDate(r.returnDate), r.returnType, `"${r.reason.replace(/"/g, '""')}"`, r.status
      ]);
    } else if (activeReport === 'novas_consultas') {
      headers = ['Cód', 'Paciente', 'CPF', 'Telefone', 'Profissional', 'Consulta Origem', 'Previsão Nova Consulta', 'Indicação / Motivo', 'Situação'];
      rows = filteredNewConsultations.map(r => [
        r.id, r.patientName, r.cpf, r.phone, r.doctor, formatReportDate(r.consultationDate), formatReportDate(r.estimatedDate), `"${r.reason.replace(/"/g, '""')}"`, r.status
      ]);
    } else if (activeReport === 'agendamentos') {
      headers = ['Data', 'Horário', 'Paciente', 'Profissional', 'Procedimento', 'Status'];
      rows = filteredAppointments.map(a => [
        a.date, a.time, `"${a.patient}"`, a.doctor, `"${a.procedure}"`, a.status
      ]);
    } else if (activeReport === 'aniversariantes') {
      headers = ['Nome', 'Idade', 'Data Aniversário', 'Telefone'];
      rows = filteredBirthdays.map(b => [
        `"${b.name}"`, b.age, b.date, b.phone
      ]);
    }

    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentReportObj = reportsList.find(r => r.id === activeReport);
  const clinicName = clinicInfo.name || 'Centro Visão Optometria';

  return (
    <div className="animate-fade-in text-xs w-full min-w-0 max-w-full">
      
      {/* ========================================================================= */}
      {/* VISUALIZAÇÃO INTERATIVA EM TELA (oculta durante a impressão)               */}
      {/* ========================================================================= */}
      <div className="space-y-5 pb-12 print:hidden w-full min-w-0">
        {loading && (
        <div className="clinical-panel px-4 py-3 flex items-center gap-2 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
          <span>Carregando dados dos relatórios...</span>
        </div>
      )}

      {errorMessage && (
        <div className="clinical-panel px-4 py-3 border-rose-200 bg-rose-50 text-rose-800">
          {errorMessage}
        </div>
      )}
      
      {/* Top Banner */}
      <div className="clinical-panel p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-forest-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Relatórios & Indicadores Operacionais
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-2xl">
            Acompanhamento de retornos gratuitos, previsão de novas consultas (CRM) e métricas da clínica.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button 
            type="button"
            onClick={handleExportCSV}
            className="btn-secondary"
            title="Exportar dados da tabela para CSV (Excel)"
          >
            <Download className="w-4 h-4 text-forest-700" />
            <span>Exportar CSV</span>
          </button>
          <button 
            type="button"
            onClick={handlePrint}
            className="btn-primary"
            title="Imprimir relatório formatado"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Grid selector de Relatórios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {reportsList.map((r) => {
          const Icon = r.icon;
          const isActive = activeReport === r.id;
          return (
            <button
              key={r.id}
              onClick={() => {
                setActiveReport(r.id);
                setSearchTerm('');
                setSelectedStatus('all');
              }}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 relative ${
                isActive 
                  ? 'bg-forest-900 text-white border-forest-800 shadow-panel' 
                  : 'bg-white text-slate-800 border-slate-200/80 hover:border-slate-300 hover:shadow-card'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-forest-800 text-amber-400' : 'bg-slate-100 text-forest-800'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isActive 
                    ? 'bg-forest-800 text-amber-400 border-forest-700' 
                    : r.badgeColor
                }`}>
                  {r.count}
                </span>
              </div>
              <div className="mt-3">
                <p className={`font-bold text-xs tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                  {r.title}
                </p>
                <p className={`text-[10px] mt-0.5 line-clamp-1 ${isActive ? 'text-forest-200/80' : 'text-slate-400'}`}>
                  {r.description}
                </p>
              </div>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute right-2.5 top-2.5 shadow-xs" />
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* ABA: RETORNOS & ACOMPANHAMENTO CLÍNICO                                   */}
      {/* ========================================================================= */}
      {activeReport === 'retornos' && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Summary Strip for Retornos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
            <div className="clinical-panel p-4 flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate" title="Total de Retornos Indicados">
                  Total de Retornos Indicados
                </span>
                <span className="text-xl font-bold font-mono text-slate-900 mt-0.5 block">
                  {returns.length}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">Registrados em prontuário</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center border border-forest-200/60 shrink-0">
                <CalendarClock className="w-5 h-5" />
              </div>
            </div>

            <div className="clinical-panel p-4 flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate" title="Datas Previstas Futuras">
                  Datas Previstas Futuras
                </span>
                <span className="text-xl font-bold font-mono text-forest-800 mt-0.5 block">
                  {returns.filter(r => r.statusKey === 'prevista').length}
                </span>
                <span className="text-[10px] text-forest-700 font-medium block truncate">Fora da janela de contato</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200/60 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="clinical-panel p-4 flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate" title="Próximos da Data">
                  Próximos da Data
                </span>
                <span className="text-xl font-bold font-mono text-amber-700 mt-0.5 block">
                  {returns.filter(r => r.statusKey === 'proximo').length}
                </span>
                <span className="text-[10px] text-amber-700 font-medium block truncate">Janela de contato ativa</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200/60 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="clinical-panel p-4 flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block truncate" title="Datas Previstas Ultrapassadas">
                  Datas Previstas Ultrapassadas
                </span>
                <span className="text-xl font-bold font-mono text-rose-700 mt-0.5 block">
                  {returns.filter(r => r.statusKey === 'ultrapassada').length}
                </span>
                <span className="text-[10px] text-rose-600 font-medium block truncate">Contato pendente</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center border border-rose-200/60 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="clinical-panel p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por paciente, CPF, motivo ou tipo..."
                className="clinical-input !pl-10 h-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
                className="clinical-input h-9 w-auto font-medium"
              >
                <option value="all">Todos os Profissionais</option>
                {professionalOptions.map((professional) => (
                  <option key={professional} value={professional}>{professional}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="clinical-input h-9 w-auto font-medium"
              >
                <option value="all">Todos os Status</option>
                <option value="prevista">Datas Previstas Futuras</option>
                <option value="proximo">Próximos da Data (15 dias)</option>
                <option value="ultrapassada">Datas Previstas Ultrapassadas</option>
              </select>
            </div>
          </div>

          {/* Retornos Table */}
          <div className="clinical-panel overflow-hidden">
            <div className="clinical-section-header">
              <div className="flex items-center space-x-2">
                <CalendarClock className="w-4 h-4 text-forest-800 shrink-0" />
                <h3 className="font-bold text-slate-900">
                  Lista de Retornos Indicados
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Mostrando <strong className="text-forest-900">{filteredReturns.length}</strong> de {returns.length} registros
              </span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="clinical-table w-full">
                <thead>
                  <tr>
                    <th className="w-14">Cód</th>
                    <th className="min-w-[190px]">Paciente / Contato</th>
                    <th className="w-28 whitespace-nowrap">Consulta Origem</th>
                    <th className="w-28 whitespace-nowrap">Data Prevista</th>
                    <th>Conduta / Motivo</th>
                    <th className="w-32 whitespace-nowrap">Profissional</th>
                    <th className="w-28 text-center whitespace-nowrap">Situação</th>
                    <th className="w-12 text-right whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReturns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Nenhum retorno encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredReturns.map((item) => (
                      <tr key={item.id} className="hover:bg-forest-50/20 transition-colors">
                        <td className="font-mono font-bold text-slate-400 text-[11px]">
                          #{item.id}
                        </td>
                        <td>
                          <div className="font-bold text-slate-900">{item.patientName}</div>
                          <div className="text-[11px] text-slate-400 font-mono flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                            <span>CPF: {formatCPF(item.cpf)}</span>
                            <span>-</span>
                            <span className="text-slate-600">{formatPhone(item.phone)}</span>
                          </div>
                        </td>
                        <td className="font-mono text-slate-600 whitespace-nowrap">
                          {formatReportDate(item.consultationDate)}
                        </td>
                        <td className="font-mono font-bold text-forest-900 whitespace-nowrap">
                          {formatReportDate(item.returnDate)}
                        </td>
                        <td>
                          <div className="text-slate-600 line-clamp-2 max-w-sm" title={item.reason}>
                            {item.reason}
                          </div>
                        </td>
                        <td className="text-slate-700 font-medium whitespace-nowrap">
                          {item.doctor}
                        </td>
                        <td className="text-center whitespace-nowrap">
                          <span className={item.statusColor}>
                            {item.status}
                          </span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (actionMenu?.id === item.id) {
                                setActionMenu(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const estimatedHeight = 150;
                                const openUpwards = window.innerHeight - rect.bottom < estimatedHeight && rect.top > estimatedHeight;
                                setActionMenu({
                                  id: item.id,
                                  item,
                                  type: 'retorno',
                                  top: openUpwards ? undefined : rect.bottom + 6,
                                  bottom: openUpwards ? (window.innerHeight - rect.top + 6) : undefined,
                                  right: Math.max(12, window.innerWidth - rect.right),
                                });
                              }
                            }}
                            className={`p-1.5 rounded-lg border transition-all inline-flex items-center justify-center ${
                              actionMenu?.id === item.id 
                                ? 'bg-forest-100 border-forest-400 text-forest-900 shadow-sm' 
                                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200 shadow-hairline'
                            }`}
                            title="Ações do retorno"
                            aria-label="Ações do retorno"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: NOVAS CONSULTAS & CRM (REVISÃO PERIÓDICA / VALIDADE DOS ÓCULOS)       */}
      {/* ========================================================================= */}
      {activeReport === 'novas_consultas' && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Summary Strip for Novas Consultas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
            <div className="clinical-panel p-4 flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate" title="Total de Previsões (CRM)">
                  Total de Previsões (CRM)
                </span>
                <span className="text-xl font-bold font-mono text-slate-900 mt-0.5 block">
                  {newConsultations.length}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">Revisões estipuladas</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center border border-forest-200/60 shrink-0">
                <PhoneCall className="w-5 h-5 text-forest-700" />
              </div>
            </div>

            <div className="clinical-panel p-4 flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate" title="Em Dia / Futuras">
                  Em Dia / Futuras
                </span>
                <span className="text-xl font-bold font-mono text-forest-800 mt-0.5 block">
                  {newConsultations.filter(r => r.statusKey === 'programado').length}
                </span>
                <span className="text-[10px] text-forest-700 font-medium block truncate">Fora da janela de contato</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200/60 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="clinical-panel p-4 flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate" title="Janela de Contato (30 dias)">
                  Janela de Contato (30 dias)
                </span>
                <span className="text-xl font-bold font-mono text-amber-700 mt-0.5 block">
                  {newConsultations.filter(r => r.statusKey === 'proximo').length}
                </span>
                <span className="text-[10px] text-amber-700 font-medium block truncate">Momento ideal para captação</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200/60 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="clinical-panel p-4 flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block truncate" title="Prazos Expirados">
                  Prazos Expirados
                </span>
                <span className="text-xl font-bold font-mono text-rose-700 mt-0.5 block">
                  {newConsultations.filter(r => r.statusKey === 'vencido').length}
                </span>
                <span className="text-[10px] text-rose-600 font-medium block truncate">Reconvocação prioritária</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center border border-rose-200/60 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="clinical-panel p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por paciente, CPF, motivo ou indicação..."
                className="clinical-input !pl-10 h-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
                className="clinical-input h-9 w-auto font-medium"
              >
                <option value="all">Todos os Profissionais</option>
                {professionalOptions.map((professional) => (
                  <option key={professional} value={professional}>{professional}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="clinical-input h-9 w-auto font-medium"
              >
                <option value="all">Todas as Situações</option>
                <option value="programado">Em Dia / Futuras</option>
                <option value="proximo">Janela de Contato (30 dias)</option>
                <option value="vencido">Prazos Expirados</option>
              </select>
            </div>
          </div>

          {/* Novas Consultas Table */}
          <div className="clinical-panel overflow-hidden">
            <div className="clinical-section-header">
              <div className="flex items-center space-x-2">
                <PhoneCall className="w-4 h-4 text-forest-800 shrink-0" />
                <h3 className="font-bold text-slate-900">
                  Pacientes com Previsão de Nova Consulta (CRM)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Mostrando <strong className="text-forest-900">{filteredNewConsultations.length}</strong> de {newConsultations.length} registros
              </span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="clinical-table w-full">
                <thead>
                  <tr>
                    <th className="w-16">Cód</th>
                    <th className="min-w-[220px]">Paciente / Contato</th>
                    <th className="w-28 whitespace-nowrap">Última Consulta</th>
                    <th className="w-32 whitespace-nowrap">Previsão Nova Consulta</th>
                    <th className="min-w-[200px]">Indicação / Motivo</th>
                    <th className="w-36 whitespace-nowrap">Profissional</th>
                    <th className="w-36 text-center whitespace-nowrap">Situação</th>
                    <th className="w-16 text-right whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredNewConsultations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Nenhuma previsão de nova consulta encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredNewConsultations.map((item) => (
                      <tr key={`nc-${item.id}`} className="hover:bg-forest-50/20 transition-colors">
                        <td className="font-mono font-bold text-slate-400 text-[11px]">
                          #{item.id}
                        </td>
                        <td>
                          <div className="font-bold text-slate-900">{item.patientName}</div>
                          <div className="text-[11px] text-slate-400 font-mono flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                            <span>CPF: {formatCPF(item.cpf)}</span>
                            <span>-</span>
                            <span className="text-slate-600">{formatPhone(item.phone)}</span>
                          </div>
                        </td>
                        <td className="font-mono text-slate-600 whitespace-nowrap">
                          {formatReportDate(item.consultationDate)}
                        </td>
                        <td className="font-mono font-bold text-forest-900 whitespace-nowrap">
                          {formatReportDate(item.estimatedDate)}
                        </td>
                        <td>
                          <div className="text-slate-600 line-clamp-2 max-w-sm" title={item.reason}>
                            {item.reason}
                          </div>
                        </td>
                        <td className="text-slate-700 font-medium whitespace-nowrap">
                          {item.doctor}
                        </td>
                        <td className="text-center whitespace-nowrap">
                          <span className={item.statusColor}>
                            {item.status}
                          </span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (actionMenu?.id === `nc-${item.id}`) {
                                setActionMenu(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const estimatedHeight = 150;
                                const openUpwards = window.innerHeight - rect.bottom < estimatedHeight && rect.top > estimatedHeight;
                                setActionMenu({
                                  id: `nc-${item.id}`,
                                  item,
                                  type: 'nova_consulta',
                                  top: openUpwards ? undefined : rect.bottom + 6,
                                  bottom: openUpwards ? (window.innerHeight - rect.top + 6) : undefined,
                                  right: Math.max(12, window.innerWidth - rect.right),
                                });
                              }
                            }}
                            className={`p-1.5 rounded-lg border transition-all inline-flex items-center justify-center ${
                              actionMenu?.id === `nc-${item.id}` 
                                ? 'bg-forest-100 border-forest-400 text-forest-900 shadow-sm' 
                                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200 shadow-hairline'
                            }`}
                            title="Ações de captação"
                            aria-label="Ações de captação"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: AGENDAMENTOS                                                        */}
      {/* ========================================================================= */}
      {activeReport === 'agendamentos' && (
        <div className="space-y-4 animate-fade-in">
          <div className="clinical-panel p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por paciente ou procedimento..."
                className="clinical-input !pl-10 h-9"
              />
            </div>
            <select
              value={selectedProfessional}
              onChange={(e) => setSelectedProfessional(e.target.value)}
              className="clinical-input h-9 w-auto font-medium"
            >
               <option value="all">Todos os Profissionais</option>
               {professionalOptions.map((professional) => (
                 <option key={professional} value={professional}>{professional}</option>
               ))}
            </select>
          </div>

          <div className="clinical-panel overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="clinical-table min-w-[800px] w-full">
                <thead>
                  <tr>
                    <th className="w-44">Data e Horário</th>
                    <th className="min-w-[200px]">Paciente</th>
                    <th className="w-44 whitespace-nowrap">Profissional</th>
                    <th className="w-40 whitespace-nowrap">Procedimento</th>
                    <th className="w-32 text-center whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Nenhum agendamento encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : filteredAppointments.map((a) => (
                    <tr key={a.id} className="hover:bg-forest-50/20 transition-colors">
                      <td className="font-mono whitespace-nowrap">
                        <div className="font-bold text-forest-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                          <span>{a.date}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{a.time}</span>
                        </div>
                      </td>
                      <td className="font-bold text-slate-900">{a.patient}</td>
                      <td className="text-slate-700 font-medium whitespace-nowrap">{a.doctor}</td>
                      <td>
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[10.5px] whitespace-nowrap">
                          {a.procedure}
                        </span>
                      </td>
                      <td className="text-center whitespace-nowrap">
                        <span className={a.status === 'Concluído' ? 'badge-confirmed' : a.status === 'Em Atendimento' ? 'badge-in-progress' : 'badge-neutral'}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: ANIVERSARIANTES                                                     */}
      {/* ========================================================================= */}
      {activeReport === 'aniversariantes' && (
        <div className="space-y-4 animate-fade-in">
          <div className="clinical-panel p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200 shrink-0">
                <Cake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Aniversariantes do Mês</h3>
                <p className="text-[11px] text-slate-400">Fortaleça o relacionamento enviando uma mensagem de parabéns pelo WhatsApp.</p>
              </div>
            </div>
          </div>

          <div className="clinical-panel overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="clinical-table min-w-[700px] w-full">
                <thead>
                  <tr>
                    <th className="min-w-[200px]">Paciente</th>
                    <th className="w-24 text-center">Idade</th>
                    <th className="w-36 text-center">Data do Aniversário</th>
                    <th className="w-36">Telefone / Contato</th>
                    <th className="w-36 text-right whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBirthdays.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Nenhum aniversariante encontrado neste mês.
                      </td>
                    </tr>
                  ) : filteredBirthdays.map((b) => (
                    <tr key={b.id} className="hover:bg-forest-50/20 transition-colors">
                      <td className="font-bold text-slate-900">{b.name}</td>
                      <td className="text-center font-medium">{b.age} anos</td>
                      <td className="font-bold text-amber-700 text-center font-mono">{b.date}</td>
                      <td className="font-mono text-slate-600">{formatPhone(b.phone)}</td>
                      <td className="text-right whitespace-nowrap">
                        <a
                          href={buildWhatsAppLink(
                            b.phone,
                            `Olá, *${b.name}*! Tudo bem?\n\nA equipe do *${clinicName}* deseja a você um feliz aniversário, repleto de saúde visual e realizações!`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary py-1 px-3 inline-flex items-center space-x-1 text-emerald-700"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Enviar Mensagem</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* DOCUMENTO OFICIAL FORMATADO DE IMPRESSÃO (visível exclusivamente ao imprimir) */}
      {/* ========================================================================= */}
      <div className="hidden print:block font-sans text-slate-900 w-full p-0 space-y-2.5 bg-white">
        {/* Cabeçalho Oficial da Empresa */}
        <div className="flex items-center justify-between border-b-2 border-forest-800 pb-2 bg-white">
          <div className="flex items-center gap-3">
            <img src="/logo-centro-visao.png" alt="Centro Visão" className="w-10 h-10 object-contain shrink-0" />
            <div>
              <h1 className="text-base font-bold uppercase tracking-wider text-forest-900 leading-none">
                {clinicInfo.name || 'CENTRO VISÃO'}
              </h1>
              {clinicInfo.cnpj && (
                <p className="text-[10px] font-mono font-semibold text-slate-700 mt-0.5 leading-none">
                  CNPJ: {formatCNPJ(clinicInfo.cnpj)}
                </p>
              )}
              {(clinicInfo.address || clinicInfo.city || clinicInfo.state || clinicInfo.phone) && (
                <p className="text-[9.5px] text-slate-600 font-mono mt-0.5 leading-none">
                  {[
                    clinicInfo.address,
                    clinicInfo.city && clinicInfo.state ? `${clinicInfo.city} - ${clinicInfo.state}` : (clinicInfo.city || clinicInfo.state),
                    clinicInfo.cep ? `CEP: ${formatCEP(clinicInfo.cep)}` : null,
                    clinicInfo.phone ? `Tel/WhatsApp: ${formatPhone(clinicInfo.phone)}` : null,
                  ].filter(Boolean).join(' • ')}
                </p>
              )}
            </div>
          </div>
          <div className="text-right text-[9.5px] font-mono text-slate-600">
            <div className="font-bold text-slate-900">EMISSÃO OFICIAL</div>
            <div>{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>

        {/* Título do Relatório e O Que Está Sendo Impresso */}
        <div className="bg-white border border-slate-300 rounded-lg p-2.5 space-y-1.5 print-avoid-break">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <div>
              <span className="text-[8.5px] font-bold uppercase tracking-widest text-forest-800 block">
                Relatório Operacional & Clínico
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase">
                {activeReport === 'retornos' && 'Relatório de Retornos Indicados (Gratuitos)'}
                {activeReport === 'novas_consultas' && 'Relatório de Previsão de Novas Consultas (CRM)'}
                {activeReport === 'agendamentos' && 'Relatório da Grade de Agendamentos'}
                {activeReport === 'aniversariantes' && 'Relatório de Aniversariantes do Mês'}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Total Listado</span>
              <strong className="text-xs font-bold text-forest-900 font-mono">
                {activeReport === 'retornos' && `${filteredReturns.length} retorno(s)`}
                {activeReport === 'novas_consultas' && `${filteredNewConsultations.length} paciente(s)`}
                {activeReport === 'agendamentos' && `${filteredAppointments.length} agendamento(s)`}
                {activeReport === 'aniversariantes' && `${filteredBirthdays.length} paciente(s)`}
              </strong>
            </div>
          </div>

          {/* Grade de Parâmetros e Filtros Aplicados */}
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div>
              <span className="text-slate-500 font-semibold block text-[9px] uppercase">Profissional:</span>
              <strong className="text-slate-900 font-medium">
                {selectedProfessional === 'all' ? 'Todos os Profissionais' : selectedProfessional}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block text-[9px] uppercase">Filtro / Período:</span>
              <strong className="text-slate-900 font-medium">
                {activeReport === 'retornos' ? (
                  selectedStatus === 'all' ? 'Todos os Registros' :
                  selectedStatus === 'ultrapassada' ? 'Data Prevista Ultrapassada' :
                  selectedStatus === 'proximo' ? 'Próximos da Data (em até 15 dias)' : 'Datas Previstas Futuras'
                ) : activeReport === 'novas_consultas' ? (
                  selectedStatus === 'all' ? 'Todos os Registros' :
                  selectedStatus === 'vencido' ? 'Prazos Expirados' :
                  selectedStatus === 'proximo' ? 'Janela de Contato (30 dias)' : 'Em Dia / Futuras'
                ) : 'Todos os Registros'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block text-[9px] uppercase">Emitido por:</span>
              <strong className="text-slate-900 font-medium">
                {user?.funcionario || user?.username || 'Recepção'}
              </strong>
            </div>
            {searchTerm && (
              <div className="col-span-3 pt-1 border-t border-slate-200 text-[9.5px]">
                <span className="text-slate-500 font-semibold">Busca aplicada: </span>
                <strong className="text-slate-900 font-mono font-bold">"{searchTerm}"</strong>
              </div>
            )}
          </div>
        </div>

        {/* Resumo de Indicadores da Impressão */}
        {activeReport === 'retornos' && (
          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] print-avoid-break">
            <div className="border border-slate-300 bg-white p-1.5 rounded-md">
              <span className="text-[9px] text-slate-500 uppercase font-semibold block">Total</span>
              <span className="font-mono font-bold text-xs text-slate-900">{filteredReturns.length}</span>
            </div>
            <div className="border border-slate-300 bg-white p-1.5 rounded-md">
              <span className="text-[9px] text-emerald-700 uppercase font-semibold block">Datas Previstas Futuras</span>
              <span className="font-mono font-bold text-xs text-emerald-800">
                {filteredReturns.filter(r => r.statusKey === 'prevista').length}
              </span>
            </div>
            <div className="border border-slate-300 bg-white p-1.5 rounded-md">
              <span className="text-[9px] text-amber-700 uppercase font-semibold block">Próximos da Data</span>
              <span className="font-mono font-bold text-xs text-amber-800">
                {filteredReturns.filter(r => r.statusKey === 'proximo').length}
              </span>
            </div>
            <div className="border border-slate-300 bg-white p-1.5 rounded-md">
              <span className="text-[9px] text-rose-700 uppercase font-semibold block">Data Prevista Ultrapassada</span>
              <span className="font-mono font-bold text-xs text-rose-800">
                {filteredReturns.filter(r => r.statusKey === 'ultrapassada').length}
              </span>
            </div>
          </div>
        )}

        {/* Tabela de Dados Impressos - Retornos */}
        {activeReport === 'retornos' && (
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-left border-collapse text-[9.5px] bg-white">
              <thead>
                <tr className="bg-white border-b border-slate-300 font-bold text-slate-800 uppercase text-[9px]">
                  <th className="py-1.5 px-2 border-r border-slate-200 w-10 text-center">Cód</th>
                  <th className="py-1.5 px-2 border-r border-slate-200">Paciente</th>
                  <th className="py-1.5 px-2 border-r border-slate-200">CPF / Telefone</th>
                  <th className="py-1.5 px-2 border-r border-slate-200 whitespace-nowrap">Consulta Origem</th>
                  <th className="py-1.5 px-2 border-r border-slate-300 font-extrabold text-slate-900 text-center whitespace-nowrap">
                    Data Prevista de Retorno
                  </th>
                  <th className="py-1.5 px-2 border-r border-slate-200">Tipo</th>
                  <th className="py-1.5 px-2 border-r border-slate-200">Motivo / Conduta</th>
                  <th className="py-1.5 px-2">Profissional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 leading-tight bg-white">
                {filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-3 text-center text-slate-500 italic bg-white">
                      Nenhum retorno encontrado com os critérios selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredReturns.map((r, idx) => (
                    <tr key={r.id || idx} className="align-top print-avoid-break bg-white">
                      <td className="py-1.5 px-2 border-r border-slate-200 font-mono text-center font-bold text-slate-700">
                        #{r.id}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 font-bold text-slate-900">
                        {r.patientName}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 font-mono text-[9px]">
                        <div>{r.cpf ? formatCPF(r.cpf) : '—'}</div>
                        <div className="text-slate-600">{r.phone ? formatPhone(r.phone) : '—'}</div>
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 font-mono whitespace-nowrap text-slate-700">
                        {formatReportDate(r.consultationDate)}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-300 font-mono font-extrabold text-slate-900 text-center whitespace-nowrap text-[10px]">
                        {formatReportDate(r.returnDate)}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 font-semibold text-slate-700">
                        {r.returnType}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 text-slate-700">
                        {r.reason}
                      </td>
                      <td className="py-1.5 px-2 font-medium text-slate-800 whitespace-nowrap">
                        {r.doctor}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Resumo de Indicadores da Impressão - Novas Consultas */}
        {activeReport === 'novas_consultas' && (
          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] print-avoid-break">
            <div className="border border-slate-300 bg-white p-1.5 rounded-md">
              <span className="text-[9px] text-slate-500 uppercase font-semibold block">Total</span>
              <span className="font-mono font-bold text-xs text-slate-900">{filteredNewConsultations.length}</span>
            </div>
            <div className="border border-slate-300 bg-white p-1.5 rounded-md">
              <span className="text-[9px] text-emerald-700 uppercase font-semibold block">Em Dia / Futuras</span>
              <span className="font-mono font-bold text-xs text-emerald-800">
                {filteredNewConsultations.filter(r => r.statusKey === 'programado').length}
              </span>
            </div>
            <div className="border border-slate-300 bg-white p-1.5 rounded-md">
              <span className="text-[9px] text-amber-700 uppercase font-semibold block">Janela de Contato</span>
              <span className="font-mono font-bold text-xs text-amber-800">
                {filteredNewConsultations.filter(r => r.statusKey === 'proximo').length}
              </span>
            </div>
            <div className="border border-slate-300 bg-white p-1.5 rounded-md">
              <span className="text-[9px] text-rose-700 uppercase font-semibold block">Prazos Expirados</span>
              <span className="font-mono font-bold text-xs text-rose-800">
                {filteredNewConsultations.filter(r => r.statusKey === 'vencido').length}
              </span>
            </div>
          </div>
        )}

        {/* Tabela de Dados Impressos - Novas Consultas */}
        {activeReport === 'novas_consultas' && (
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-left border-collapse text-[9.5px] bg-white">
              <thead>
                <tr className="bg-white border-b border-slate-300 font-bold text-slate-800 uppercase text-[9px]">
                  <th className="py-1.5 px-2 border-r border-slate-200 w-10 text-center">Cód</th>
                  <th className="py-1.5 px-2 border-r border-slate-200">Paciente</th>
                  <th className="py-1.5 px-2 border-r border-slate-200">CPF / Telefone</th>
                  <th className="py-1.5 px-2 border-r border-slate-200 whitespace-nowrap">Consulta Origem</th>
                  <th className="py-1.5 px-2 border-r border-slate-300 font-extrabold text-slate-900 text-center whitespace-nowrap">
                    Previsão Nova Consulta
                  </th>
                  <th className="py-1.5 px-2 border-r border-slate-200">Indicação / Motivo</th>
                  <th className="py-1.5 px-2">Profissional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 leading-tight bg-white">
                {filteredNewConsultations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-3 text-center text-slate-500 italic bg-white">
                      Nenhuma previsão de nova consulta encontrada com os critérios selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredNewConsultations.map((r, idx) => (
                    <tr key={r.id || idx} className="align-top print-avoid-break bg-white">
                      <td className="py-1.5 px-2 border-r border-slate-200 font-mono text-center font-bold text-slate-700">
                        #{r.id}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 font-bold text-slate-900">
                        {r.patientName}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 font-mono text-[9px]">
                        <div>{r.cpf ? formatCPF(r.cpf) : '—'}</div>
                        <div className="text-slate-600">{r.phone ? formatPhone(r.phone) : '—'}</div>
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 font-mono whitespace-nowrap text-slate-700">
                        {formatReportDate(r.consultationDate)}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-300 font-mono font-extrabold text-forest-900 text-center whitespace-nowrap text-[10px]">
                        {formatReportDate(r.estimatedDate)}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 text-slate-700">
                        {r.reason}
                      </td>
                      <td className="py-1.5 px-2 font-medium text-slate-800 whitespace-nowrap">
                        {r.doctor}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabela de Dados Impressos - Agendamentos */}
        {activeReport === 'agendamentos' && (
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-left border-collapse text-[9.5px] bg-white">
              <thead>
                <tr className="bg-white border-b border-slate-300 font-bold text-slate-800 uppercase text-[9px]">
                  <th className="py-1.5 px-2 border-r border-slate-200 w-24 text-center">Data / Horário</th>
                  <th className="py-1.5 px-2 border-r border-slate-200">Paciente</th>
                  <th className="py-1.5 px-2 border-r border-slate-200">Profissional</th>
                  <th className="py-1.5 px-2 border-r border-slate-200">Procedimento</th>
                  <th className="py-1.5 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 leading-tight bg-white">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-slate-500 italic bg-white">
                      Nenhum agendamento encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((a, idx) => (
                    <tr key={a.id || idx} className="print-avoid-break bg-white">
                      <td className="py-1.5 px-2 border-r border-slate-200 font-mono text-center">
                        <div className="font-bold text-slate-900">{a.date}</div>
                        <div className="text-[8.5px] text-slate-500">{a.time}</div>
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 font-bold text-slate-900">
                        {a.patient}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 text-slate-800">
                        {a.doctor}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 text-slate-700">
                        {a.procedure}
                      </td>
                      <td className="py-1.5 px-2 text-center font-bold text-[9px]">
                        {a.status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabela de Dados Impressos - Aniversariantes */}
        {activeReport === 'aniversariantes' && (
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-left border-collapse text-[9.5px] bg-white">
              <thead>
                <tr className="bg-white border-b border-slate-300 font-bold text-slate-800 uppercase text-[9px]">
                  <th className="py-1.5 px-2 border-r border-slate-200">Paciente</th>
                  <th className="py-1.5 px-2 border-r border-slate-200 text-center w-16">Idade</th>
                  <th className="py-1.5 px-2 border-r border-slate-200 text-center w-24">Dia / Mês</th>
                  <th className="py-1.5 px-2">Telefone / Contato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 leading-tight bg-white">
                {filteredBirthdays.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-slate-500 italic bg-white">
                      Nenhum aniversariante encontrado neste mês.
                    </td>
                  </tr>
                ) : (
                  filteredBirthdays.map((b, idx) => (
                    <tr key={b.id || idx} className="print-avoid-break bg-white">
                      <td className="py-1.5 px-2 border-r border-slate-200 font-bold text-slate-900">
                        {b.name}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 text-center font-mono">
                        {b.age ? `${b.age} anos` : '—'}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 text-center font-bold text-slate-900 font-mono">
                        {b.date}
                      </td>
                      <td className="py-1.5 px-2 font-mono">
                        {b.phone ? formatPhone(b.phone) : 'Não informado'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Rodapé Oficial de Validação e Assinatura */}
        <div className="pt-4 mt-4 border-t border-slate-300 space-y-4 print-avoid-break">
          <div className="grid grid-cols-2 gap-6 text-[10px]">
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-semibold">Identificação e Auditoria:</p>
              <p className="text-[9.5px] text-slate-700 mt-0.5 leading-relaxed">
                Relatório gerado eletronicamente para acompanhamento operacional e clínico da empresa <strong>{clinicInfo.name || 'Centro Visão'}</strong>.
              </p>
            </div>
            <div className="text-center flex flex-col items-center justify-end">
              <div className="w-56 border-b border-slate-800 mb-1" />
              <span className="text-[10px] font-bold text-slate-900">
                Responsável Técnico / Optometrista
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                {clinicInfo.name || 'Centro Visão'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-[8.5px] text-slate-400 font-mono border-t border-slate-200 pt-1.5">
            <span>{clinicInfo.name || 'Centro Visão'} • Gestão Clínica & BI</span>
            <span>Documento emitido em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MENU DROPDOWN FLUTUANTE DE AÇÕES (Portal livre de overflow)               */}
      {/* ========================================================================= */}
      {actionMenu && createPortal(
        <div
          style={{
            position: 'fixed',
            ...(actionMenu.bottom !== undefined
              ? { bottom: `${actionMenu.bottom}px` }
              : { top: `${actionMenu.top}px` }),
            right: `${actionMenu.right}px`,
          }}
          onClick={(e) => e.stopPropagation()}
          className="z-[999999] min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-modal p-1 space-y-0.5 animate-fade-in text-xs font-sans print:hidden"
        >
          {actionMenu.type === 'nova_consulta' ? (
            <>
              <a
                href={buildWhatsAppLink(
                  actionMenu.item.phone,
                  generateNewConsultationMessage({
                    patientName: actionMenu.item.patientName,
                    estimatedDate: actionMenu.item.estimatedDate,
                    reason: actionMenu.item.reason,
                    doctor: actionMenu.item.doctor,
                    consultationDate: actionMenu.item.consultationDate,
                    clinicName: clinicInfo.name || 'Centro Visão',
                    clinicPhone: clinicInfo.phone ? formatPhone(clinicInfo.phone) : '',
                    clinicAddress: [
                      clinicInfo.address,
                      clinicInfo.city && clinicInfo.state ? `${clinicInfo.city} - ${clinicInfo.state}` : (clinicInfo.city || clinicInfo.state),
                      clinicInfo.cep ? `CEP: ${formatCEP(clinicInfo.cep)}` : null,
                    ].filter(Boolean).join(' - ')
                  })
                )}
                target="_blank"
                rel="noreferrer"
                onClick={() => setActionMenu(null)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors w-full"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="text-left">
                  <div>WhatsApp de Captação</div>
                  <div className="text-[10px] font-normal text-slate-400">Revisão e validade dos óculos</div>
                </div>
              </a>

              <button
                type="button"
                onClick={() => {
                  const item = actionMenu.item;
                  const message = generateNewConsultationMessage({
                    patientName: item.patientName,
                    estimatedDate: item.estimatedDate,
                    reason: item.reason,
                    doctor: item.doctor,
                    consultationDate: item.consultationDate,
                    clinicName: clinicInfo.name || 'Centro Visão',
                    clinicPhone: clinicInfo.phone ? formatPhone(clinicInfo.phone) : '',
                    clinicAddress: [
                      clinicInfo.address,
                      clinicInfo.city && clinicInfo.state ? `${clinicInfo.city} - ${clinicInfo.state}` : (clinicInfo.city || clinicInfo.state),
                      clinicInfo.cep ? `CEP: ${formatCEP(clinicInfo.cep)}` : null,
                    ].filter(Boolean).join(' - ')
                  });
                  navigator.clipboard?.writeText(message);
                  setCopiedMessageId(item.id || item.patientId || 'copied');
                  setTimeout(() => setCopiedMessageId(null), 3000);
                  setActionMenu(null);
                }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors w-full text-left"
              >
                <Copy className="w-4 h-4 text-slate-600 shrink-0" />
                <div className="text-left">
                  <div>Copiar Mensagem</div>
                  <div className="text-[10px] font-normal text-slate-400">Copiar texto da notificação</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const item = actionMenu.item;
                  setActionMenu(null);
                  setActiveModule?.('agenda', {
                    state: {
                      agendaPrefill: {
                        patientId: item.patientId,
                        patient: item.patientName,
                        phone: item.phone,
                        cpf: item.cpf,
                        procedure: 'Consulta',
                        lockPatient: true,
                      },
                    },
                  });
                }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors w-full text-left"
              >
                <Calendar className="w-4 h-4 text-forest-700 shrink-0" />
                <div className="text-left">
                  <div>Agendar Nova Consulta</div>
                  <div className="text-[10px] font-normal text-slate-400">Abrir na agenda (paga)</div>
                </div>
              </button>
            </>
          ) : (
            <>
              <a
                href={buildWhatsAppLink(
                  actionMenu.item.phone,
                  buildReturnWhatsAppMessage({
                    patientName: actionMenu.item.patientName,
                    returnDate: actionMenu.item.returnDate,
                    returnType: actionMenu.item.returnType,
                    reason: actionMenu.item.reason,
                    doctor: actionMenu.item.doctor,
                    consultationDate: actionMenu.item.consultationDate,
                    clinicName: clinicInfo.name || 'Centro Visão',
                    clinicPhone: clinicInfo.phone ? formatPhone(clinicInfo.phone) : '',
                    clinicAddress: [
                      clinicInfo.address,
                      clinicInfo.city && clinicInfo.state ? `${clinicInfo.city} - ${clinicInfo.state}` : (clinicInfo.city || clinicInfo.state),
                      clinicInfo.cep ? `CEP: ${formatCEP(clinicInfo.cep)}` : null,
                    ].filter(Boolean).join(' - ')
                  })
                )}
                target="_blank"
                rel="noreferrer"
                onClick={() => setActionMenu(null)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors w-full"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="text-left">
                  <div>WhatsApp Retorno Gratuito</div>
                  <div className="text-[10px] font-normal text-slate-400">Enviar lembrete isento</div>
                </div>
              </a>

              <button
                type="button"
                onClick={() => {
                  const item = actionMenu.item;
                  const message = buildReturnWhatsAppMessage({
                    patientName: item.patientName,
                    returnDate: item.returnDate,
                    returnType: item.returnType,
                    reason: item.reason,
                    doctor: item.doctor,
                    consultationDate: item.consultationDate,
                    clinicName: clinicInfo.name || 'Centro Visão',
                    clinicPhone: clinicInfo.phone ? formatPhone(clinicInfo.phone) : '',
                    clinicAddress: [
                      clinicInfo.address,
                      clinicInfo.city && clinicInfo.state ? `${clinicInfo.city} - ${clinicInfo.state}` : (clinicInfo.city || clinicInfo.state),
                      clinicInfo.cep ? `CEP: ${formatCEP(clinicInfo.cep)}` : null,
                    ].filter(Boolean).join(' - ')
                  });
                  navigator.clipboard?.writeText(message);
                  setCopiedMessageId(item.id || item.patientId || 'copied');
                  setTimeout(() => setCopiedMessageId(null), 3000);
                  setActionMenu(null);
                }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors w-full text-left"
              >
                <Copy className="w-4 h-4 text-slate-600 shrink-0" />
                <div className="text-left">
                  <div>Copiar Mensagem</div>
                  <div className="text-[10px] font-normal text-slate-400">Copiar texto do lembrete</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const item = actionMenu.item;
                  setActionMenu(null);
                  setActiveModule?.('agenda', {
                    state: {
                      agendaPrefill: {
                        patientId: item.patientId,
                        patient: item.patientName,
                        phone: item.phone,
                        cpf: item.cpf,
                        procedure: 'Retorno',
                        lockPatient: true,
                      },
                    },
                  });
                }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors w-full text-left"
              >
                <Calendar className="w-4 h-4 text-forest-700 shrink-0" />
                <div className="text-left">
                  <div>Agendar Retorno</div>
                  <div className="text-[10px] font-normal text-slate-400">Abrir na agenda (isento)</div>
                </div>
              </button>
            </>
          )}
        </div>,
        document.body
      )}

      {/* Notificação Toast ao copiar mensagem */}
      {copiedMessageId && (
        <ToastNotification
          message="Mensagem copiada para a área de transferência!"
          type="success"
          duration={3000}
          onClose={() => setCopiedMessageId(null)}
        />
      )}

    </div>
  );
}
