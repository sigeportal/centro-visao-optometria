import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  AlertCircle, 
  Calendar, 
  CalendarClock, 
  Check,
  Copy, 
  Eye, 
  Filter, 
  Loader2, 
  MessageSquare, 
  MoreHorizontal, 
  RefreshCw, 
  Search, 
  Stethoscope, 
  User 
} from 'lucide-react';
import { listarRetornosPaciente } from '../../../api/pacientes';
import { obterDadosClinica } from '../../../api/configuracoes';
import { 
  buildReturnWhatsAppMessage, 
  generateNewConsultationMessage, 
  buildWhatsAppLink, 
  formatPhone, 
  formatCEP 
} from '../../../utils/formatters';
import DetalhesRetornoModal from './DetalhesRetornoModal';

const TYPE_LABELS = {
  data_definida: 'Data prevista',
  conforme_necessidade: 'Conforme necessidade',
  acompanhamento: 'Acompanhamento clínico',
  revisao: 'Revisão',
  adaptacao: 'Adaptação',
  outro: 'Outro',
};

const SITUATION_LABELS = {
  retorno_programado: 'Retorno indicado',
  sem_retorno: 'Sem retorno programado',
  recusado_pelo_paciente: 'Paciente não aceitou o retorno',
};

function parseDateOnly(value) {
  const text = String(value || '').trim();
  const isoMatch = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const slashMatch = text.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})/);
  if (!slashMatch) return null;

  const first = Number(slashMatch[1]);
  const second = Number(slashMatch[2]);
  const month = first > 12 ? second : first;
  const day = first > 12 ? first : second;
  return new Date(Number(slashMatch[3]), month - 1, day);
}

function dateOnly(value) {
  const date = parseDateOnly(value);
  if (date) {
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }
  return value ? String(value) : 'Não informada';
}

function toIsoDateOnly(value) {
  if (!value) return undefined;
  const d = parseDateOnly(value);
  if (!d || Number.isNaN(d.getTime())) return undefined;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTimingBadge(dateValue) {
  if (!dateValue) return null;
  const d = parseDateOnly(dateValue);
  if (!d || Number.isNaN(d.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Vencido (${Math.abs(diffDays)}d)`,
      className: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  }
  if (diffDays === 0) {
    return {
      label: 'Hoje',
      className: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
    };
  }
  if (diffDays <= 30) {
    return {
      label: `Em ${diffDays}d`,
      className: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  }
  return {
    label: 'Programado',
    className: 'bg-slate-50 text-slate-600 border-slate-200',
  };
}

function errorMessage(error) {
  return error?.response?.data?.error?.message || error?.message || 'Não foi possível carregar os retornos.';
}

const toBool = (val) => val === 1 || val === '1' || val === true || val === 'true';

export default function RetornosPacienteTab({ patient, setActiveModule }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [clinicData, setClinicData] = useState({ name: '', cnpj: '', phone: '', address: '', city: '', state: '', cep: '' });

  // UI state: Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todos'); // 'todos' | 'retorno' | 'crm'

  // Dropdown menu state
  const [actionMenu, setActionMenu] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Detail modal state
  const [detailModalItem, setDetailModalItem] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    obterDadosClinica({ signal: controller.signal })
      .then((data) => {
        setClinicData({
          name: data.nome || data.name || '',
          cnpj: data.cnpj || '',
          phone: data.telefone || data.phone || '',
          address: data.endereco || data.address || '',
          city: data.cidade || data.city || '',
          state: data.estado || data.state || '',
          cep: data.cep || '',
        });
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const data = await listarRetornosPaciente(patient.id, { signal });
      if (!signal.aborted) setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!signal.aborted) setError(errorMessage(err));
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [patient.id]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, refreshKey]);

  // Click outside & Escape listener for actionMenu
  useEffect(() => {
    if (!actionMenu) return undefined;
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

  const handleSchedule = useCallback((type, item) => {
    const isCrm = type === 'crm';
    const targetDate = isCrm ? item?.nova_consulta_data : item?.data_retorno;
    const procedure = isCrm ? 'Consulta' : 'Retorno';

    const prefillState = {
      agendaPrefill: {
        patientId: patient?.id,
        patient: patient?.name,
        phone: patient?.phone,
        cpf: patient?.cpf,
        procedure,
        date: toIsoDateOnly(targetDate),
        lockPatient: true,
      },
    };

    if (setActiveModule) {
      setActiveModule('agenda', { state: prefillState });
    } else {
      navigate('/agenda', { state: prefillState });
    }
  }, [patient, setActiveModule, navigate]);

  const handleOpenMenu = (e, item, menuKey = 'table') => {
    e.stopPropagation();
    const key = `${item.id}-${menuKey}`;
    if (actionMenu?.key === key) {
      setActionMenu(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const estimatedHeight = 220;
    const openUpwards = window.innerHeight - rect.bottom < estimatedHeight && rect.top > estimatedHeight;

    setActionMenu({
      key,
      item,
      top: openUpwards ? undefined : rect.bottom + 6,
      bottom: openUpwards ? window.innerHeight - rect.top + 6 : undefined,
      right: Math.max(12, window.innerWidth - rect.right),
    });
  };

  const handleCopyMessage = (item, type) => {
    const isCrm = type === 'crm';
    const message = isCrm
      ? generateNewConsultationMessage({
          patientName: patient?.name,
          estimatedDate: item.nova_consulta_data,
          reason: item.nova_consulta_motivo,
          doctor: item.profissional,
          consultationDate: item.consulta_data,
          clinicName: clinicData.name || 'Centro Visão',
          clinicPhone: clinicData.phone ? formatPhone(clinicData.phone) : '',
          clinicAddress: [
            clinicData.address,
            clinicData.city && clinicData.state ? `${clinicData.city} - ${clinicData.state}` : (clinicData.city || clinicData.state),
            clinicData.cep ? `CEP: ${formatCEP(clinicData.cep)}` : null,
          ].filter(Boolean).join(' - ')
        })
      : buildReturnWhatsAppMessage({
          patientName: patient?.name,
          returnDate: item.data_retorno,
          returnType: TYPE_LABELS[item.tipo] || item.tipo,
          reason: item.motivo,
          doctor: item.profissional,
          consultationDate: item.consulta_data,
          clinicName: clinicData.name || 'Centro Visão',
          clinicPhone: clinicData.phone ? formatPhone(clinicData.phone) : '',
          clinicAddress: [
            clinicData.address,
            clinicData.city && clinicData.state ? `${clinicData.city} - ${clinicData.state}` : (clinicData.city || clinicData.state),
            clinicData.cep ? `CEP: ${formatCEP(clinicData.cep)}` : null,
          ].filter(Boolean).join(' - ')
        });

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(message);
      setCopiedId(`${item.id}-${type}`);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const nextReturn = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return items
      .filter((item) => (toBool(item.tem_retorno) || ((item.tem_retorno == null || item.tem_retorno === '') && item.data_retorno)) && item.situacao === 'retorno_programado' && item.data_retorno)
      .map((item) => ({ item, date: parseDateOnly(item.data_retorno) }))
      .filter(({ date }) => date && !Number.isNaN(date.getTime()) && date >= today)
      .sort((left, right) => left.date - right.date)[0]?.item;
  }, [items]);

  const nextNewConsultation = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return items
      .filter((item) => (toBool(item.tem_nova_consulta) || Boolean(item.nova_consulta_data)) && item.nova_consulta_data)
      .map((item) => ({ item, date: parseDateOnly(item.nova_consulta_data) }))
      .filter(({ date }) => date && !Number.isNaN(date.getTime()) && date >= today)
      .sort((left, right) => left.date - right.date)[0]?.item;
  }, [items]);

  // Counts for quick filter pills
  const returnCount = useMemo(() => {
    return items.filter((item) => (toBool(item.tem_retorno) || ((item.tem_retorno == null || item.tem_retorno === '') && item.data_retorno)) && item.data_retorno).length;
  }, [items]);

  const crmCount = useMemo(() => {
    return items.filter((item) => (toBool(item.tem_nova_consulta) || Boolean(item.nova_consulta_data)) && item.nova_consulta_data).length;
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const hasRetorno = (toBool(item.tem_retorno) || ((item.tem_retorno == null || item.tem_retorno === '') && item.data_retorno)) && item.data_retorno;
      const hasNova = (toBool(item.tem_nova_consulta) || Boolean(item.nova_consulta_data)) && item.nova_consulta_data;

      if (filterType === 'retorno' && !hasRetorno) return false;
      if (filterType === 'crm' && !hasNova) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesProfessional = (item.profissional || '').toLowerCase().includes(query);
        const matchesMotivo = (item.motivo || '').toLowerCase().includes(query);
        const matchesObs = (item.observacao || '').toLowerCase().includes(query);
        const matchesCrmMotivo = (item.nova_consulta_motivo || '').toLowerCase().includes(query);
        const matchesDate = (item.data_retorno || '').includes(query) || (item.nova_consulta_data || '').includes(query);
        const matchesConsulta = String(item.consulta_id || '').includes(query);

        if (!matchesProfessional && !matchesMotivo && !matchesObs && !matchesCrmMotivo && !matchesDate && !matchesConsulta) {
          return false;
        }
      }

      return true;
    });
  }, [items, filterType, searchTerm]);

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      {/* Top Bar: Title & Refresh */}
      <div className="clinical-panel p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">Retornos e Previsões Clínicas</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Acompanhe os retornos imediatos gratuitos e as previsões de novas consultas para revisão periódica e validade dos óculos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
          className="w-10 h-10 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl flex items-center justify-center disabled:cursor-wait disabled:text-slate-400 transition-colors shadow-hairline"
          title="Atualizar retornos"
          aria-label="Atualizar retornos"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-forest-700' : ''}`} />
        </button>
      </div>

      {/* Destaques de Próximos Atendimentos */}
      {(nextReturn || nextNewConsultation) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Card Retorno Clínico Gratuito */}
          {nextReturn && (
            <div className="clinical-panel p-4 flex items-center justify-between gap-3 border-emerald-200 bg-emerald-50/40">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0 shadow-xs">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <span className="clinical-label !mb-0 text-emerald-800">Próximo Retorno</span>
                  <p className="text-sm font-bold text-emerald-950 mt-0.5">{dateOnly(nextReturn.data_retorno)}</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    {nextReturn.motivo || TYPE_LABELS[nextReturn.tipo] || 'Acompanhamento imediato'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleOpenMenu(e, nextReturn, 'card-retorno')}
                className={`p-2 rounded-xl border transition-all inline-flex items-center justify-center shrink-0 ${
                  actionMenu?.key === `${nextReturn.id}-card-retorno`
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-900 shadow-sm'
                    : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300/80 shadow-hairline'
                }`}
                title="Ações do próximo retorno"
                aria-label="Ações do próximo retorno"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Card Previsão de Nova Consulta (CRM) */}
          {nextNewConsultation && (
            <div className="clinical-panel p-4 flex items-center justify-between gap-3 border-amber-200 bg-amber-50/40">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white text-amber-700 flex items-center justify-center border border-amber-200 shrink-0 shadow-xs">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <span className="clinical-label !mb-0 text-amber-900">Previsão Nova Consulta</span>
                  <p className="text-sm font-bold text-amber-950 mt-0.5">{dateOnly(nextNewConsultation.nova_consulta_data)}</p>
                  <p className="text-[11px] text-amber-900/90 mt-0.5">
                    {nextNewConsultation.nova_consulta_motivo || 'Revisão periódica / Validade dos óculos'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleOpenMenu(e, nextNewConsultation, 'card-crm')}
                className={`p-2 rounded-xl border transition-all inline-flex items-center justify-center shrink-0 ${
                  actionMenu?.key === `${nextNewConsultation.id}-card-crm`
                    ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-sm'
                    : 'bg-white hover:bg-amber-50 text-amber-900 border-amber-300/80 shadow-hairline'
                }`}
                title="Ações da próxima consulta"
                aria-label="Ações da próxima consulta"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Alert */}
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

      {/* Search & Filter Bar */}
      <div className="clinical-panel p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por motivo, conduta, profissional ou data..."
            className="clinical-input !pl-10 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterType('todos')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              filterType === 'todos'
                ? 'bg-forest-800 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            Todos ({items.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('retorno')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              filterType === 'retorno'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Retornos ({returnCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('crm')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              filterType === 'crm'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>CRM / Validade ({crmCount})</span>
          </button>
        </div>
      </div>

      {/* Tabela de Retornos & Previsões */}
      <div className="clinical-table overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[780px]">
          <thead>
            <tr>
              <th className="py-3 px-4 min-w-[220px]">Previsão / Procedimento</th>
              <th className="py-3 px-4 min-w-[300px]">Indicação / Conduta Clínica</th>
              <th className="py-3 px-4 min-w-[190px]">Origem & Profissional</th>
              <th className="py-3 px-4 text-right w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {!loading && filteredItems.map((item) => {
              const hasRetorno = (toBool(item.tem_retorno) || ((item.tem_retorno == null || item.tem_retorno === '') && item.data_retorno)) && item.data_retorno;
              const hasNova = (toBool(item.tem_nova_consulta) || Boolean(item.nova_consulta_data)) && item.nova_consulta_data;

              const returnTiming = hasRetorno ? getTimingBadge(item.data_retorno) : null;
              const crmTiming = hasNova ? getTimingBadge(item.nova_consulta_data) : null;

              return (
                <tr key={item.id} className="hover:bg-forest-50/20 transition-colors align-top">
                  {/* Coluna 1: Previsão / Procedimento */}
                  <td className="py-3.5 px-4 space-y-2">
                    {hasRetorno && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <CalendarClock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Retorno: {dateOnly(item.data_retorno)}</span>
                        </div>
                        {returnTiming && (
                          <div>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-medium border ${returnTiming.className}`}>
                              {returnTiming.label}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {hasNova && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <CalendarClock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Nova Consulta: {dateOnly(item.nova_consulta_data)}</span>
                        </div>
                        {crmTiming && (
                          <div>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-medium border ${crmTiming.className}`}>
                              {crmTiming.label}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {!hasRetorno && !hasNova && (
                      <div className="text-slate-500 font-medium">
                        {SITUATION_LABELS[item.situacao] || item.situacao || 'Sem agendamento previsto'}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 font-mono">Reg. #{item.id}</div>
                  </td>

                  {/* Coluna 2: Indicação / Conduta Clínica */}
                  <td className="py-3.5 px-4 space-y-2">
                    {hasRetorno && (
                      <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                          Retorno • {TYPE_LABELS[item.tipo] || item.tipo || 'Acompanhamento'}
                        </div>
                        <p className="text-slate-800 font-medium mt-0.5">{item.motivo || 'Sem motivo detalhado'}</p>
                        {item.observacao && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{item.observacao}</p>
                        )}
                      </div>
                    )}

                    {hasNova && (
                      <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                          Nova Consulta • CRM
                        </div>
                        <p className="text-slate-800 font-medium mt-0.5">{item.nova_consulta_motivo || 'Revisão periódica / Validade dos óculos'}</p>
                        {item.nova_consulta_observacao && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{item.nova_consulta_observacao}</p>
                        )}
                      </div>
                    )}

                    {!hasRetorno && !hasNova && (
                      <p className="text-slate-500 italic">Nenhum detalhe adicional informado.</p>
                    )}
                  </td>

                  {/* Coluna 3: Origem & Profissional */}
                  <td className="py-3.5 px-4 text-slate-700 space-y-1">
                    <div className="font-mono font-bold text-slate-900">Consulta #{item.consulta_id}</div>
                    <div className="text-[11px] text-slate-500">Realizada em {dateOnly(item.consulta_data)}</div>
                    <div className="text-slate-800 font-semibold pt-0.5">
                      {item.profissional || 'Não informado'}
                    </div>
                  </td>

                  {/* Coluna 4: Ações (Menu Dropdown com Três Pontinhos Horizontais) */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => handleOpenMenu(e, item)}
                      className={`p-2 rounded-xl border transition-all inline-flex items-center justify-center ${
                        actionMenu?.item?.id === item.id
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
              );
            })}
          </tbody>
        </table>

        {loading && (
          <div className="min-h-40 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
            <span>Carregando retornos e previsões...</span>
          </div>
        )}

        {!loading && !error && filteredItems.length === 0 && (
          <div className="min-h-40 flex flex-col items-center justify-center text-center px-4 py-8">
            <Stethoscope className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">
              {items.length === 0 
                ? 'Nenhum retorno ou previsão registrado para este paciente' 
                : 'Nenhum registro encontrado com o filtro atual'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {items.length === 0 
                ? 'Os dados são gerados automaticamente ao finalizar um atendimento.' 
                : 'Tente alterar os termos da busca ou os filtros.'}
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Dropdown Menu */}
      {actionMenu && createPortal(
        <div
          style={{
            top: actionMenu.top !== undefined ? `${actionMenu.top}px` : undefined,
            bottom: actionMenu.bottom !== undefined ? `${actionMenu.bottom}px` : undefined,
            right: `${actionMenu.right}px`,
          }}
          className="fixed w-52 bg-white rounded-2xl border border-slate-200/90 text-slate-800 p-1.5 shadow-modal z-[999999] animate-fade-in text-xs space-y-0.5"
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Opção Visualizar */}
          <button
            type="button"
            onClick={() => {
              const selectedItem = actionMenu.item;
              setActionMenu(null);
              setDetailModalItem(selectedItem);
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-semibold flex items-center space-x-2.5 text-slate-700 hover:text-slate-900 transition-colors"
            role="menuitem"
          >
            <Eye className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Visualizar Detalhes</span>
          </button>

          {/* Opções Retorno Clínico */}
          {((toBool(actionMenu.item.tem_retorno) || ((actionMenu.item.tem_retorno == null || actionMenu.item.tem_retorno === '') && actionMenu.item.data_retorno)) && actionMenu.item.data_retorno) && (
            <>
              <div className="border-t border-slate-100 my-1" />
              
              <button
                type="button"
                onClick={() => {
                  const selectedItem = actionMenu.item;
                  setActionMenu(null);
                  handleSchedule('retorno', selectedItem);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 font-semibold flex items-center space-x-2.5 text-emerald-800 transition-colors"
                role="menuitem"
              >
                <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Agendar Retorno</span>
              </button>

              {patient?.phone && (
                <a
                  href={buildWhatsAppLink(
                    patient.phone,
                    buildReturnWhatsAppMessage({
                      patientName: patient.name,
                      returnDate: actionMenu.item.data_retorno,
                      returnType: TYPE_LABELS[actionMenu.item.tipo] || actionMenu.item.tipo,
                      reason: actionMenu.item.motivo,
                      doctor: actionMenu.item.profissional,
                      consultationDate: actionMenu.item.consulta_data,
                      clinicName: clinicData.name || 'Centro Visão',
                      clinicPhone: clinicData.phone ? formatPhone(clinicData.phone) : '',
                      clinicAddress: [
                        clinicData.address,
                        clinicData.city && clinicData.state ? `${clinicData.city} - ${clinicData.state}` : (clinicData.city || clinicData.state),
                        clinicData.cep ? `CEP: ${formatCEP(clinicData.cep)}` : null,
                      ].filter(Boolean).join(' - ')
                    })
                  )}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setActionMenu(null)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 font-semibold flex items-center space-x-2.5 text-emerald-700 transition-colors"
                  role="menuitem"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>WhatsApp Retorno</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => handleCopyMessage(actionMenu.item, 'retorno')}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-medium flex items-center space-x-2.5 text-slate-600 hover:text-slate-900 transition-colors"
                role="menuitem"
              >
                {copiedId === `${actionMenu.item.id}-retorno` ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span>{copiedId === `${actionMenu.item.id}-retorno` ? 'Mensagem copiada!' : 'Copiar Texto Retorno'}</span>
              </button>
            </>
          )}

          {/* Opções CRM / Previsão Nova Consulta */}
          {((toBool(actionMenu.item.tem_nova_consulta) || Boolean(actionMenu.item.nova_consulta_data)) && actionMenu.item.nova_consulta_data) && (
            <>
              <div className="border-t border-slate-100 my-1" />

              <button
                type="button"
                onClick={() => {
                  const selectedItem = actionMenu.item;
                  setActionMenu(null);
                  handleSchedule('crm', selectedItem);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50 font-semibold flex items-center space-x-2.5 text-amber-900 transition-colors"
                role="menuitem"
              >
                <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Agendar CRM</span>
              </button>

              {patient?.phone && (
                <a
                  href={buildWhatsAppLink(
                    patient.phone,
                    generateNewConsultationMessage({
                      patientName: patient.name,
                      estimatedDate: actionMenu.item.nova_consulta_data,
                      reason: actionMenu.item.nova_consulta_motivo,
                      doctor: actionMenu.item.profissional,
                      consultationDate: actionMenu.item.consulta_data,
                      clinicName: clinicData.name || 'Centro Visão',
                      clinicPhone: clinicData.phone ? formatPhone(clinicData.phone) : '',
                      clinicAddress: [
                        clinicData.address,
                        clinicData.city && clinicData.state ? `${clinicData.city} - ${clinicData.state}` : (clinicData.city || clinicData.state),
                        clinicData.cep ? `CEP: ${formatCEP(clinicData.cep)}` : null,
                      ].filter(Boolean).join(' - ')
                    })
                  )}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setActionMenu(null)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50 font-semibold flex items-center space-x-2.5 text-amber-800 transition-colors"
                  role="menuitem"
                >
                  <MessageSquare className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>WhatsApp CRM</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => handleCopyMessage(actionMenu.item, 'crm')}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-medium flex items-center space-x-2.5 text-slate-600 hover:text-slate-900 transition-colors"
                role="menuitem"
              >
                {copiedId === `${actionMenu.item.id}-crm` ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span>{copiedId === `${actionMenu.item.id}-crm` ? 'Mensagem copiada!' : 'Copiar Texto CRM'}</span>
              </button>
            </>
          )}
        </div>,
        document.body
      )}

      {/* Modal de Detalhes Completos com Auditoria */}
      <DetalhesRetornoModal
        isOpen={Boolean(detailModalItem)}
        onClose={() => setDetailModalItem(null)}
        item={detailModalItem}
        patient={patient}
        clinicData={clinicData}
        onSchedule={handleSchedule}
      />
    </div>
  );
}
