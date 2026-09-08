import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  alterarStatusAgendamento,
  atualizarAgendamento,
  cancelarAgendamento,
  criarAgendamento,
  iniciarAtendimento,
  listarAgenda,
  listarFilaEspera,
  listarParceriasAgenda,
  listarProcedimentosAgenda,
  listarProfissionais,
} from '../../api/agenda';
import {
  adaptAppointment,
  adaptProfessional,
  addDays,
  buildAgendaDays,
  formatAgendaRange,
  getStatusStyle,
  startOfAgendaWeek,
  toIsoDate,
} from '../../domain/agenda';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../constants/permissions';
import { calculateEndTime, minutesToTimeStr, timeStrToMinutes } from '../../utils/timeUtils';
import AppointmentQuickDetailsModal from './components/AppointmentQuickDetailsModal';
import NovoAgendamentoModal from './NovoAgendamentoModal';
import ToastNotification from '../Common/ToastNotification';

const START_HOUR = 7;
const END_HOUR = 21;
const HOUR_HEIGHT = 68;
const OFFSET_TOP = 24;
const OFFSET_BOTTOM = 28;
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT + OFFSET_TOP + OFFSET_BOTTOM;
const PIXELS_PER_MINUTE = HOUR_HEIGHT / 60;
const START_MINUTES = START_HOUR * 60;
const END_MINUTES = END_HOUR * 60;

function docNameShort(name) {
  if (!name) return '';
  return name.split(/\s+/).slice(0, 2).join(' ');
}

function getErrorMessage(error) {
  return error?.response?.data?.error?.message
    || error?.response?.data?.message
    || error?.message
    || 'Não foi possível carregar a agenda.';
}

function makeTimeSlots() {
  const slots = [];
  for (let hour = START_HOUR; hour < END_HOUR; hour += 1) {
    slots.push({ time: `${String(hour).padStart(2, '0')}:00`, isFullHour: true, minutes: hour * 60 });
    slots.push({ time: `${String(hour).padStart(2, '0')}:30`, isFullHour: false, minutes: hour * 60 + 30 });
  }
  slots.push({ time: `${END_HOUR}:00`, isFullHour: true, minutes: END_HOUR * 60 });
  return slots;
}

const TIME_SLOTS = makeTimeSlots();

export default function AgendaView({ setActiveModule }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useAuth();
  const canEditAgenda = can(PERMISSIONS.AGENDA_EDIT);
  const canStartAttendance = can(PERMISSIONS.CLINICAL_EDIT);
  const [selectedDoctorId, setSelectedDoctorId] = useState('all');
  const [weekStart, setWeekStart] = useState(() => startOfAgendaWeek(new Date()));
  const [professionals, setProfessionals] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [partnerships, setPartnerships] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [queueCount, setQueueCount] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loadingProfessionals, setLoadingProfessionals] = useState(true);
  const [loadingAgenda, setLoadingAgenda] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [editor, setEditor] = useState(null);
  const [mutationSaving, setMutationSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const todayIso = toIsoDate(now);
  const days = useMemo(() => buildAgendaDays(weekStart, now), [weekStart, todayIso]);
  const currentDateRange = useMemo(() => formatAgendaRange(days), [days]);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingProfessionals(true);

    (async () => {
      const professionalItems = await listarProfissionais({ signal: controller.signal });
      if (controller.signal.aborted) return;
      setProfessionals(professionalItems.map(adaptProfessional));
      const procedureItems = await listarProcedimentosAgenda({ signal: controller.signal });
      if (controller.signal.aborted) return;
      setProcedures(procedureItems);
      const partnershipItems = await listarParceriasAgenda({ signal: controller.signal });
      if (!controller.signal.aborted) setPartnerships(partnershipItems);
    })()
      .catch((error) => {
        if (error?.code !== 'ERR_CANCELED') setErrorMessage(getErrorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingProfessionals(false);
      });

    return () => controller.abort();
  }, []);

  const loadAgenda = useCallback(async (signal) => {
    setLoadingAgenda(true);
    setErrorMessage('');

    const params = {
      inicio: days[0].id,
      fim: toIsoDate(addDays(days[days.length - 1].date, 1)),
    };
    if (selectedDoctorId !== 'all') params.profissional_id = selectedDoctorId;

    try {
      const agendaItems = await listarAgenda(params, { signal });
      const queueItems = await listarFilaEspera({ signal });

      const adapted = agendaItems.map(adaptAppointment).filter(Boolean);
      setAppointments(adapted);
      setQueueCount(queueItems.length);
      setSelectedAppointment(null);
    } catch (error) {
      if (error?.code !== 'ERR_CANCELED') {
        setAppointments([]);
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      if (!signal.aborted) setLoadingAgenda(false);
    }
  }, [days, selectedDoctorId]);

  useEffect(() => {
    const controller = new AbortController();
    loadAgenda(controller.signal);
    return () => controller.abort();
  }, [loadAgenda, refreshKey]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedDoctorName = selectedDoctorId === 'all'
    ? null
    : professionals.find((item) => item.id === selectedDoctorId)?.name;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const openCreateModal = (prefill = {}) => {
    if (!canEditAgenda) return;
    setEditor({
      mode: 'create',
      initialData: {
        ...prefill,
        doctorId: prefill.doctorId || (selectedDoctorId !== 'all' ? selectedDoctorId : professionals[0]?.id),
      },
    });
  };

  useEffect(() => {
    const prefill = location.state?.agendaPrefill;
    if (!prefill || loadingProfessionals || !canEditAgenda) return;

    openCreateModal(prefill);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate, loadingProfessionals, canEditAgenda]);

  const handleColumnClick = (event, dayId) => {
    if (!canEditAgenda || event.target.closest('.appointment-card')) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const clickY = event.clientY - rect.top;
    const clickedMinutes = START_MINUTES + Math.round(((clickY - OFFSET_TOP) / PIXELS_PER_MINUTE) / 5) * 5;
    const startMinutes = Math.max(START_MINUTES, Math.min(END_MINUTES - 30, clickedMinutes));
    const startTime = minutesToTimeStr(startMinutes);
    openCreateModal({
      date: dayId,
      startTime,
      endTime: calculateEndTime(startTime, 30),
    });
  };

  const handleSaveAppointment = async (payload) => {
    if (editor?.mode === 'edit') {
      await atualizarAgendamento(editor.initialData.id, payload);
      showToast('Agendamento atualizado com sucesso.');
    } else {
      await criarAgendamento(payload);
      setWeekStart(startOfAgendaWeek(new Date(`${payload.data}T12:00:00`)));
      showToast(payload.status === 'fila_espera' ? 'Paciente incluído na fila de espera.' : 'Agendamento criado com sucesso.');
    }
    setRefreshKey((value) => value + 1);
  };

  const handleStatusChange = async (appointment, statusCode) => {
    if (!canEditAgenda || mutationSaving) return;
    setMutationSaving(true);
    try {
      if (statusCode === 'cancelada') {
        await cancelarAgendamento(appointment.id);
      } else {
        await alterarStatusAgendamento(appointment.id, statusCode);
      }
      setSelectedAppointment(null);
      setRefreshKey((value) => value + 1);
      showToast('Status do agendamento atualizado com sucesso.');
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
      throw error;
    } finally {
      setMutationSaving(false);
    }
  };

  const handleStartAttendance = async (appointment) => {
    if (!canStartAttendance || appointment?.statusCode !== 'fila_espera' || mutationSaving) return;
    setMutationSaving(true);
    try {
      const result = await iniciarAtendimento(appointment.id);
      setSelectedAppointment(null);
      setRefreshKey((value) => value + 1);
      if (!result?.consulta_id) throw new Error('A API não retornou a consulta iniciada.');
      navigate(`/consultas/${result.consulta_id}`);
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setMutationSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12 text-xs">
      {/* Top Filter & Actions Bar */}
      <div className="clinical-panel p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <span className="text-xs font-bold text-slate-700 tracking-wider flex items-center gap-1.5 shrink-0">
            <Filter className="w-4 h-4 text-forest-700" />
            Profissional:
          </span>
          <div className="inline-flex flex-wrap bg-slate-100 p-1 rounded-xl min-w-0 gap-0.5 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setSelectedDoctorId('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedDoctorId === 'all' 
                  ? 'bg-forest-700 text-white shadow-hairline' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Todos
            </button>
            {professionals.map((professional) => (
              <button
                type="button"
                key={professional.id}
                onClick={() => setSelectedDoctorId(professional.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedDoctorId === professional.id 
                    ? 'bg-forest-700 text-white shadow-hairline' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {docNameShort(professional.name)}
              </button>
            ))}
            {loadingProfessionals && (
              <span className="px-3 py-1.5 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-forest-700" />
                Carregando
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loadingAgenda}
            className="w-10 h-10 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl flex items-center justify-center disabled:cursor-wait disabled:text-slate-400 transition-colors shadow-hairline"
            title="Atualizar agenda"
            aria-label="Atualizar agenda"
          >
            <RefreshCw className={`w-4 h-4 ${loadingAgenda ? 'animate-spin text-forest-700' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('espera')}
            className="px-4 h-10 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-bold text-xs rounded-xl flex items-center space-x-2 transition-colors shadow-hairline"
          >
            <Clock className="w-4 h-4 text-amber-700" />
            <span>Fila de Espera ({queueCount})</span>
          </button>
          <button
            type="button"
            onClick={() => openCreateModal()}
            disabled={!canEditAgenda || loadingProfessionals || professionals.length === 0 || procedures.length === 0}
            className="h-10 btn-primary px-4"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Date Navigator Bar & Status Legend */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between clinical-panel px-4 py-3 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart((date) => addDays(date, -7))}
            className="w-8 h-8 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg flex items-center justify-center transition-colors"
            title="Semana anterior"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-2 px-2">
            <CalendarIcon className="w-4 h-4 text-forest-700" />
            <span className="text-xs font-bold text-slate-900 capitalize tracking-wide">{currentDateRange}</span>
          </div>
          <button
            type="button"
            onClick={() => setWeekStart((date) => addDays(date, 7))}
            className="w-8 h-8 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg flex items-center justify-center transition-colors"
            title="Próxima semana"
            aria-label="Próxima semana"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfAgendaWeek(new Date()))}
            className="h-8 px-3 bg-forest-50 hover:bg-forest-100 text-forest-800 border border-forest-200/80 rounded-lg text-xs font-bold transition-colors"
          >
            Hoje
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-slate-600">
          <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-forest-600" /><span>Concluído</span></span>
          <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /><span>Em atendimento</span></span>
          <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-forest-500" /><span>Confirmado</span></span>
          <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-slate-400" /><span>Agendado</span></span>
          <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /><span>Cancelado/Faltou</span></span>
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

      {/* Modern Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-x-auto shadow-card select-none relative">
        <div className="flex border-b border-slate-200 bg-slate-50/70 min-w-[840px]">
          <div className="w-16 shrink-0 py-3 px-2 text-center font-bold text-[10.5px] text-slate-500 uppercase border-r border-slate-200/80">
            Hora
          </div>
          <div className="flex-1 grid grid-cols-6 divide-x divide-slate-200/80">
            {days.map((day) => (
              <div key={day.id} className={`py-3 px-3 text-center transition-colors ${day.isToday ? 'bg-forest-800 text-white font-bold' : 'text-slate-800 font-bold'}`}>
                <div className="text-xs tracking-wider">
                  {day.name} <span className={day.isToday ? 'text-forest-200 font-mono' : 'text-slate-400 font-mono'}>{day.dateStr}</span>
                </div>
                {day.isToday && <span className="inline-block mt-0.5 text-[9px] uppercase tracking-widest bg-forest-950/80 px-2 py-0.5 rounded-full text-amber-300 font-black">Hoje</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex min-w-[840px]" style={{ height: `${TOTAL_HEIGHT}px` }}>
          <div className="w-16 shrink-0 border-r border-slate-200/80 bg-slate-50/40 relative">
            {TIME_SLOTS.map((slot) => {
              const top = OFFSET_TOP + (slot.minutes - START_MINUTES) * PIXELS_PER_MINUTE;
              return (
                <div key={slot.time} className={`absolute left-0 right-0 text-center font-mono ${slot.isFullHour ? 'font-bold text-[11px] text-slate-700' : 'font-medium text-[10px] text-slate-400'}`} style={{ top: `${top}px`, transform: 'translateY(-50%)' }}>
                  {slot.time}
                </div>
              );
            })}
          </div>

          <div className="absolute left-16 right-0 top-0 bottom-0 pointer-events-none">
            {TIME_SLOTS.map((slot) => {
              const top = OFFSET_TOP + (slot.minutes - START_MINUTES) * PIXELS_PER_MINUTE;
              return <div key={slot.time} className={`absolute left-0 right-0 ${slot.isFullHour ? 'border-t border-slate-200/70' : 'border-t border-dashed border-slate-200/40'}`} style={{ top: `${top}px` }} />;
            })}
          </div>

          <div className="flex-1 grid grid-cols-6 divide-x divide-slate-200/70 relative">
            {days.map((day) => {
              const dayAppointments = appointments.filter((appointment) => appointment.date === day.id);
              const currentMinutes = now.getHours() * 60 + now.getMinutes();
              const showCurrentTime = day.isToday && currentMinutes >= START_MINUTES && currentMinutes <= END_MINUTES;

              return (
                <div
                  key={day.id}
                  onClick={(event) => handleColumnClick(event, day.id)}
                  className={`relative h-full ${canEditAgenda ? 'cursor-pointer hover:bg-slate-50/50' : ''} ${day.isToday ? 'bg-forest-50/10' : 'bg-transparent'}`}
                >
                  {showCurrentTime && (
                    <div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center" style={{ top: `${OFFSET_TOP + (currentMinutes - START_MINUTES) * PIXELS_PER_MINUTE}px` }}>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-600 -ml-1.5 shadow-sm ring-2 ring-white" />
                      <div className="flex-1 h-[2px] bg-amber-600 opacity-90" />
                      <span className="text-[9px] font-mono font-bold text-white bg-amber-600 px-1.5 py-0.5 rounded-sm shadow-xs">
                        {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
                      </span>
                    </div>
                  )}

                  {dayAppointments.map((appointment) => {
                    const startMinutes = timeStrToMinutes(appointment.startTime);
                    if (startMinutes < START_MINUTES || startMinutes >= END_MINUTES) return null;
                    const visibleDuration = Math.min(appointment.duration, END_MINUTES - startMinutes);
                    const top = OFFSET_TOP + (startMinutes - START_MINUTES) * PIXELS_PER_MINUTE;
                    const height = Math.max(28, visibleDuration * PIXELS_PER_MINUTE);
                    const style = getStatusStyle(appointment.statusCode);

                    return (
                      <button
                        type="button"
                        key={appointment.id}
                        onClick={() => setSelectedAppointment(appointment)}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        className={`appointment-card absolute left-1 right-1 rounded-xl border border-slate-200/90 border-l-4 ${style.border} bg-white shadow-hairline hover:shadow-card-hover hover:border-slate-300 z-10 hover:z-30 transition-all flex flex-col justify-start overflow-hidden cursor-pointer text-left`}
                      >
                        <span className="p-1 px-2 flex-1 min-h-0 flex flex-col justify-start">
                          <span className="flex items-start justify-between gap-1 min-w-0">
                            <span className="flex items-baseline space-x-1.5 min-w-0 flex-1">
                              <span className="font-mono font-bold text-[9.5px] text-forest-900 shrink-0 bg-forest-50 px-1.5 py-0.2 rounded border border-forest-200/60">{appointment.startTime}</span>
                              <span className="font-bold text-[10.5px] text-slate-900 leading-tight truncate">{appointment.patient}</span>
                            </span>
                            <span className="text-[9px] font-semibold font-mono text-slate-400 shrink-0">{appointment.duration}m</span>
                          </span>

                          {height >= 44 && (
                            <span className="flex items-center justify-between mt-1 text-[10px] text-slate-600 min-w-0">
                              <span className="truncate font-medium">{appointment.procedure}</span>
                              {height < 64 && <span className={`text-[8.5px] font-bold uppercase px-1.5 py-0.2 rounded-md border shrink-0 ${style.badge}`}>{appointment.status}</span>}
                            </span>
                          )}

                          {height >= 64 && (
                            <span className="mt-auto pt-1 flex items-center justify-between gap-1">
                              <span className="text-[9.5px] font-medium text-slate-500 truncate">{docNameShort(appointment.doctor)}</span>
                              <span className={`text-[8.5px] font-bold uppercase px-1.5 py-0.2 rounded-md border shrink-0 ${style.badge}`}>{appointment.status}</span>
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {!loadingAgenda && appointments.length === 0 && !errorMessage && (
            <div className="absolute left-16 right-0 top-24 z-20 pointer-events-none flex justify-center">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 px-6 py-5 text-center shadow-hairline">
                <CalendarIcon className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">Nenhum agendamento neste período</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{selectedDoctorName || 'Todos os profissionais'}</p>
              </div>
            </div>
          )}

          {loadingAgenda && (
            <div className="absolute inset-0 left-16 z-30 bg-white/80 backdrop-blur-xs flex items-start justify-center pt-24">
              <div className="bg-white rounded-xl border border-slate-200 px-5 py-3.5 flex items-center gap-2.5 text-xs font-semibold text-slate-700 shadow-panel">
                <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
                <span>Carregando agenda...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <AppointmentQuickDetailsModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        readOnly={!canEditAgenda}
        saving={mutationSaving}
        onUpdateStatus={(id, statusCode) => handleStatusChange(selectedAppointment, statusCode)}
        onStartAttendance={canStartAttendance && selectedAppointment?.statusCode === 'fila_espera'
          ? () => handleStartAttendance(selectedAppointment)
          : undefined}
        onEdit={(appointment) => {
          setSelectedAppointment(null);
          setEditor({ mode: 'edit', initialData: appointment });
        }}
      />

      <NovoAgendamentoModal
        isOpen={Boolean(editor)}
        mode={editor?.mode}
        initialData={editor?.initialData}
        professionals={professionals}
        procedures={procedures}
        partnerships={partnerships}
        onClose={() => setEditor(null)}
        onSave={handleSaveAppointment}
      />

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
