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
  MoreHorizontal
} from 'lucide-react';
import { 
  formatCPF, 
  formatCNPJ,
  formatCEP,
  formatPhone, 
  formatDate, 
  buildReturnWhatsAppMessage, 
  buildWhatsAppLink,
  calculateAge
} from '../../utils/formatters';
import { listarAgenda, listarProfissionais } from '../../api/agenda';
import { listarRetornosRelatorio, listarAniversariantesRelatorio } from '../../api/relatorios';
import { obterDadosClinica } from '../../api/configuracoes';
import { useAuth } from '../../context/AuthContext';

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

export default function RelatoriosView({ setActiveModule }) {
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState('retornos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [returns, setReturns] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [clinicInfo, setClinicInfo] = useState(EMPTY_CLINIC);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionMenu, setActionMenu] = useState(null);

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
          setReturns(returnsResult.value.map((item) => ({
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
          })));
        }

        if (appointmentsResult.status === 'fulfilled') {
          setAppointments(appointmentsResult.value.map((item) => ({
          id: item.id,
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
      title: 'Retornos Indicados', 
      description: 'Datas previstas para comunicação e acompanhamento',
      icon: CalendarClock, 
      count: returns.length,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
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
        (selectedStatus === 'ultrapassada' && item.statusKey === 'ultrapassada') ||
        (selectedStatus === 'prevista' && item.statusKey === 'prevista') ||
        (selectedStatus === 'proximo' && item.statusKey === 'proximo');

      return matchSearch && matchDoctor && matchStatus;
    });
  }, [returns, searchTerm, selectedProfessional, selectedStatus]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const matchSearch = searchTerm === '' ||
        a.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.procedure.toLowerCase().includes(searchTerm.toLowerCase());
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
    } else if (activeReport === 'agendamentos') {
      headers = ['Horário', 'Paciente', 'Profissional', 'Procedimento', 'Status'];
      rows = filteredAppointments.map(a => [
        a.time, `"${a.patient}"`, a.doctor, `"${a.procedure}"`, a.status
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
    <div className="animate-fade-in text-xs">
      
      {/* ========================================================================= */}
      {/* VISUALIZAÇÃO INTERATIVA EM TELA (oculta durante a impressão)               */}
      {/* ========================================================================= */}
      <div className="space-y-5 pb-12 print:hidden">
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
            Acompanhamento de retornos indicados, datas previstas para comunicação e métricas da clínica.
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
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-3">
        {reportsList.map((r) => {
          const Icon = r.icon;
          const isActive = activeReport === r.id;
          return (
            <button
              key={r.id}
              onClick={() => {
                setActiveReport(r.id);
                setSearchTerm('');
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="clinical-panel p-4 flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total de Retornos Indicados
                </span>
                <span className="text-xl font-bold font-mono text-slate-900 mt-0.5 block">
                  {returns.length}
                </span>
                <span className="text-[10.5px] text-slate-400">Registrados em prontuário</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center border border-forest-200/60">
                <CalendarClock className="w-5 h-5" />
              </div>
            </div>

            <div className="clinical-panel p-4 flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
                  Datas Previstas Futuras
                </span>
                <span className="text-xl font-bold font-mono text-forest-800 mt-0.5 block">
                  {returns.filter(r => r.statusKey === 'prevista').length}
                </span>
                <span className="text-[10.5px] text-forest-700 font-medium">Fora da janela de contato</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200/60">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="clinical-panel p-4 flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
                  Próximos da Data
                </span>
                <span className="text-xl font-bold font-mono text-amber-700 mt-0.5 block">
                  {returns.filter(r => r.statusKey === 'proximo').length}
                </span>
                <span className="text-[10.5px] text-amber-700 font-medium">Janela de contato ativa</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200/60">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="clinical-panel p-4 flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-rose-600 block">
                  Datas Previstas Ultrapassadas
                </span>
                <span className="text-xl font-bold font-mono text-rose-700 mt-0.5 block">
                  {returns.filter(r => r.statusKey === 'ultrapassada').length}
                </span>
                <span className="text-[10.5px] text-rose-600 font-medium">Contato pendente</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center border border-rose-200/60">
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
                <CalendarClock className="w-4 h-4 text-forest-800" />
                <h3 className="font-bold text-slate-900">
                  Lista de Retornos Indicados
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Mostrando <strong className="text-forest-900">{filteredReturns.length}</strong> de {returns.length} registros
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="clinical-table">
                <thead>
                  <tr>
                    <th>Cód</th>
                    <th>Paciente / Contato</th>
                    <th>Consulta Origem</th>
                    <th>Data Prevista</th>
                    <th>Tipo de Retorno</th>
                    <th>Conduta / Motivo</th>
                    <th>Profissional</th>
                    <th className="text-center">Situação</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReturns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Nenhum retorno encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredReturns.map((item) => (
                      <tr key={item.id} className="hover:bg-forest-50/20 transition-colors">
                        <td className="font-mono font-bold text-slate-400 text-[11px]">
                          {item.id}
                        </td>
                        <td>
                          <div className="font-bold text-slate-900">{item.patientName}</div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1.5 mt-0.5">
                            <span>CPF: {formatCPF(item.cpf)}</span>
                            <span>•</span>
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
                          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[10.5px]">
                            {item.returnType}
                          </span>
                        </td>
                        <td className="max-w-xs truncate text-slate-600" title={item.reason}>
                          {item.reason}
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
                                setActionMenu({
                                  id: item.id,
                                  item,
                                  top: rect.bottom + 6,
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
            <div className="overflow-x-auto">
              <table className="clinical-table">
                <thead>
                  <tr>
                    <th>Horário</th>
                    <th>Paciente</th>
                    <th>Profissional</th>
                    <th>Procedimento</th>
                    <th className="text-center">Status</th>
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
                      <td className="font-mono font-bold text-forest-900">{a.time}</td>
                      <td className="font-bold text-slate-900">{a.patient}</td>
                      <td className="text-slate-700">{a.doctor}</td>
                      <td>{a.procedure}</td>
                      <td className="text-center">
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
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
                <Cake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Aniversariantes do Mês</h3>
                <p className="text-[11px] text-slate-400">Fortaleça o relacionamento enviando uma mensagem de parabéns pelo WhatsApp.</p>
              </div>
            </div>
          </div>

          <div className="clinical-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="clinical-table">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Idade</th>
                    <th>Data do Aniversário</th>
                    <th>Telefone / Contato</th>
                    <th className="text-right">Ações</th>
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
                      <td>{b.age} anos</td>
                      <td className="font-bold text-amber-700">{b.date}</td>
                      <td className="font-mono">{formatPhone(b.phone)}</td>
                      <td className="text-right">
                        <a
                          href={`https://wa.me/55${b.phone.replace(/\D/g, '')}?text=Parabéns%20${encodeURIComponent(b.name)}!%20A%20equipe%20do%20Centro%20Visão%20deseja%20um%20feliz%20aniversário%20e%20muita%20saúde%20visual!`}
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
                {activeReport === 'retornos' && 'Relatório de Retornos Indicados'}
                {activeReport === 'agendamentos' && 'Relatório da Grade de Agendamentos'}
                {activeReport === 'aniversariantes' && 'Relatório de Aniversariantes do Mês'}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Total Listado</span>
              <strong className="text-xs font-bold text-forest-900 font-mono">
                {activeReport === 'retornos' && `${filteredReturns.length} retorno(s)`}
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

        {/* Tabela de Dados Impressos - Agendamentos */}
        {activeReport === 'agendamentos' && (
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-left border-collapse text-[9.5px] bg-white">
              <thead>
                <tr className="bg-white border-b border-slate-300 font-bold text-slate-800 uppercase text-[9px]">
                  <th className="py-1.5 px-2 border-r border-slate-200 w-14 text-center">Horário</th>
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
                      <td className="py-1.5 px-2 border-r border-slate-200 font-mono font-bold text-center text-slate-900">
                        {a.time}
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
            top: `${actionMenu.top}px`,
            right: `${actionMenu.right}px`,
          }}
          onClick={(e) => e.stopPropagation()}
          className="z-[999999] min-w-[200px] bg-white border border-slate-200 rounded-xl shadow-modal p-1 space-y-0.5 animate-fade-in text-xs font-sans print:hidden"
        >
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
                ].filter(Boolean).join(' • ')
              })
            )}
            target="_blank"
            rel="noreferrer"
            onClick={() => setActionMenu(null)}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors w-full"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="text-left">
              <div>WhatsApp</div>
              <div className="text-[10px] font-normal text-slate-400">Enviar lembrete detalhado</div>
            </div>
          </a>

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
                    lockPatient: true,
                  },
                },
              });
            }}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors w-full text-left"
          >
            <Calendar className="w-4 h-4 text-forest-700 shrink-0" />
            <div className="text-left">
              <div>Agendar Consulta</div>
              <div className="text-[10px] font-normal text-slate-400">Abrir na agenda</div>
            </div>
          </button>
        </div>,
        document.body
      )}

    </div>
  );
}
