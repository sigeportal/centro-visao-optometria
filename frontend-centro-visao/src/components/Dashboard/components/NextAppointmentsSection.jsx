import React from 'react';
import { Clock, ChevronRight, Calendar } from 'lucide-react';
import { parseApiDateTime, STATUS_LABELS } from '../../../domain/agenda';

function formatDateTime(value) {
  if (!value) return { date: 'Data não informada', time: '--:--' };
  const parsed = parseApiDateTime(value);
  if (!parsed) return { date: String(value), time: '--:--' };
  return {
    date: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(parsed),
    time: new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(parsed),
  };
}

export default function NextAppointmentsSection({ setActiveModule, appointments, loading }) {
  return (
    <div className="clinical-panel p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-forest-50 text-forest-700 border border-forest-200/70 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">
              Próximas Consultas & Agendamentos
            </h3>
            <p className="text-[11px] text-slate-400">Escala de atendimentos previstos</p>
          </div>
        </div>

        <button 
          type="button"
          onClick={() => setActiveModule('agenda')}
          className="text-xs font-bold text-forest-700 hover:text-forest-800 flex items-center space-x-1 transition-colors"
        >
          <span>Ver Agenda Completa</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {loading && (
          <div className="py-8 text-center text-xs text-slate-500 font-medium">
            Carregando próximas consultas...
          </div>
        )}
        {!loading && appointments.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-500 space-y-1">
            <Calendar className="w-6 h-6 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">Nenhuma consulta futura agendada.</p>
            <p className="text-[11px] text-slate-400">Novos agendamentos aparecerão aqui automaticamente.</p>
          </div>
        )}
        {!loading && appointments.slice(0, 8).map((appointment) => {
          const dateTime = formatDateTime(appointment.data_hora || appointment.inicio);
          const status = String(appointment.status || 'agendada').toLowerCase();
          return (
            <div 
              key={appointment.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/70 bg-slate-50/40 hover:bg-forest-50/30 hover:border-forest-200/80 transition-all text-xs group"
            >
              <div className="flex items-center space-x-3">
                <span className="font-mono font-bold text-xs text-forest-900 px-2.5 py-1 bg-forest-50 border border-forest-200/80 rounded-lg shrink-0">
                  {dateTime.time}
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 group-hover:text-forest-900 transition-colors">
                    {appointment.paciente_nome || 'Paciente não informado'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {dateTime.date} • {appointment.procedimento_nome || 'Consulta'} • {appointment.profissional_nome || 'Profissional'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 shrink-0">
                <span className={
                  status === 'fila_espera'
                    ? 'badge-waiting'
                    : status === 'confirmada'
                    ? 'badge-confirmed'
                    : status === 'atendida' || status === 'realizada'
                    ? 'badge-finished'
                    : 'badge-neutral'
                }>
                  {STATUS_LABELS[status] || status.replaceAll('_', ' ')}
                </span>
                <button 
                  type="button"
                  onClick={() => setActiveModule('agenda')}
                  className="btn-secondary py-1 px-2.5 text-[11px]"
                >
                  Abrir
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

