import React from 'react';
import { Users, Calendar, CheckCircle2, Activity, ArrowUpRight } from 'lucide-react';

function metric(value, loading) {
  return loading ? '...' : Number(value || 0).toLocaleString('pt-BR');
}

export default function KPICardsSection({ setActiveModule, summary, loading }) {
  const cards = [
    {
      id: 'agenda',
      label: 'Agendamentos Hoje',
      value: summary.agendamentos_hoje,
      context: 'Pacientes na escala do dia',
      icon: Calendar,
      accent: 'border-l-4 border-l-amber-500',
      action: 'agenda',
    },
    {
      id: 'atendidos',
      label: 'Consultas Atendidas',
      value: summary.consultas_realizadas_hoje,
      context: 'Atendimentos concluídos hoje',
      icon: CheckCircle2,
      accent: 'border-l-4 border-l-forest-700',
      action: 'atendimento',
    },
    {
      id: 'pacientes',
      label: 'Total de Pacientes',
      value: summary.total_pacientes,
      context: 'Prontuários cadastrados',
      icon: Users,
      accent: 'border-l-4 border-l-slate-400',
      action: 'pacientes',
    },
    {
      id: 'mes',
      label: 'Consultas no Mês',
      value: summary.consultas_mes,
      context: 'Volume acumulado no período',
      icon: Activity,
      accent: 'border-l-4 border-l-forest-600',
      action: 'atendimento',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => setActiveModule(card.action)}
            className={`clinical-panel-hover p-4 sm:p-5 cursor-pointer group flex flex-col justify-between select-none ${card.accent}`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                  {card.label}
                </span>
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-forest-700 transition-colors" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{card.context}</p>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <h3 className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                {metric(card.value, loading)}
              </h3>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-forest-700 font-bold flex items-center gap-0.5">
                Acessar <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

