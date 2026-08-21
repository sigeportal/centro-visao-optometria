import React, { useState } from 'react';
import { Phone, ChevronRight, Cake, AlertTriangle } from 'lucide-react';
import { formatPhone } from '../../../utils/formatters';
import { parseApiDateTime } from '../../../domain/agenda';

function formatDateTime(value) {
  if (!value) return 'Data não informada';
  const parsed = parseApiDateTime(value);
  if (!parsed) return String(value);
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed);
}

export default function DashboardAlertsSection({ setActiveModule, birthdays, overdueAppointments, loading }) {
  const [alertTab, setAlertTab] = useState('aniversarios');

  const whatsappNumber = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  };

  return (
    <div className="clinical-panel p-5 sm:p-6 space-y-4">
      {/* Segmented Tab Switcher */}
      <div className="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
        <button
          type="button"
          onClick={() => setAlertTab('aniversarios')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            alertTab === 'aniversarios'
              ? 'bg-white text-forest-900 shadow-hairline border border-slate-200/80'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cake className="w-3.5 h-3.5 text-forest-700" />
          <span>Aniversários ({birthdays.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setAlertTab('vencimentos')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            alertTab === 'vencimentos'
              ? 'bg-white text-amber-900 shadow-hairline border border-slate-200/80'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Vencidas ({overdueAppointments.length})</span>
        </button>
      </div>

      {/* Aniversariantes */}
      {alertTab === 'aniversarios' && (
        <div className="space-y-2">
          {loading && <p className="py-8 text-center text-xs text-slate-500 font-medium">Carregando aniversariantes...</p>}
          {!loading && birthdays.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500 space-y-1">
              <Cake className="w-6 h-6 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">Nenhum aniversariante hoje.</p>
              <p className="text-[11px] text-slate-400">Aniversariantes do dia aparecerão aqui.</p>
            </div>
          )}
          {!loading && birthdays.map((birthday) => (
            <div 
              key={birthday.id}
              className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/40 hover:bg-forest-50/30 hover:border-forest-200 transition-all flex items-center justify-between text-xs"
            >
              <div>
                <h4 className="font-bold text-slate-900">{birthday.nome}</h4>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {formatPhone(birthday.celular) || 'Sem celular informado'}
                </p>
              </div>

              {birthday.celular && (
                <a
                  href={`https://wa.me/${whatsappNumber(birthday.celular)}?text=Olá ${encodeURIComponent(birthday.nome)}, o Centro Visão deseja a você um Feliz Aniversário!`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-forest-700 hover:bg-forest-800 text-white font-bold text-[11px] rounded-lg flex items-center space-x-1.5 transition-colors shadow-hairline"
                >
                  <Phone className="w-3 h-3" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Vencimentos */}
      {alertTab === 'vencimentos' && (
        <div className="space-y-2">
          {loading && <p className="py-8 text-center text-xs text-slate-500 font-medium">Carregando consultas vencidas...</p>}
          {!loading && overdueAppointments.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-forest-800">Tudo em dia!</p>
              <p className="text-[11px] text-slate-400">Nenhuma consulta pendente de atendimento.</p>
            </div>
          )}
          {!loading && overdueAppointments.map((appointment) => (
            <div 
              key={appointment.id}
              className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/30 flex items-center justify-between text-xs"
            >
              <div>
                <h4 className="font-bold text-slate-900">{appointment.paciente_nome || 'Paciente não informado'}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{appointment.profissional_nome || 'Profissional'}</p>
                <span className="text-[10.5px] text-amber-800 font-semibold block mt-1">
                  Agendada: {formatDateTime(appointment.data_hora || appointment.inicio)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveModule('agenda')}
                className="btn-secondary py-1 px-2.5 text-[11px]"
              >
                <span>Ver</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

