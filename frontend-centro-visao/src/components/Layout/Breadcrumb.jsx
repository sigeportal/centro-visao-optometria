import {
  Calendar,
  ChevronRight,
  Clock,
  DollarSign,
  FileBarChart,
  Home,
  Settings,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PROFILE_LABELS } from '../../constants/permissions';

const MODULE_MAP = {
  dashboard: { label: 'Início', icon: Home },
  agenda: { label: 'Agenda & Agendamentos', icon: Calendar },
  espera: { label: 'Fila de Espera', icon: Clock },
  pacientes: { label: 'Gestão de Pacientes', icon: Users },
  'paciente-detalhe': { label: 'Gestão de Pacientes', icon: Users },
  atendimento: { label: 'Consultas & Atendimentos', icon: Stethoscope },
  financeiro: { label: 'Financeiro', icon: DollarSign },
  relatorios: { label: 'Relatórios Operacionais', icon: FileBarChart },
  configuracoes: { label: 'Configurações da Clínica', icon: Settings },
};

export default function Breadcrumb({ activeModule, setActiveModule, subTitle }) {
  const { user, profile } = useAuth();
  const current = MODULE_MAP[activeModule] || MODULE_MAP.dashboard;
  const Icon = current.icon;
  const profileLabel = PROFILE_LABELS[profile] || profile || 'Sem perfil';
  const today = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date());

  return (
    <div className="flex items-center justify-between py-2 px-1 text-xs text-slate-500 mb-5 border-b border-slate-200/80 gap-3 select-none print:hidden">
      <div className="flex items-center space-x-2 min-w-0">
        <button
          type="button"
          onClick={() => setActiveModule('dashboard')}
          className="flex items-center space-x-1.5 hover:text-forest-700 font-semibold text-slate-500 hover:text-slate-900 transition-colors shrink-0"
        >
          <Home className="w-3.5 h-3.5 text-slate-400" />
          <span>Início</span>
        </button>

        {activeModule !== 'dashboard' && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <div className="flex items-center space-x-1.5 font-bold text-slate-800 min-w-0">
              <Icon className="w-3.5 h-3.5 text-forest-700 shrink-0" />
              <span className="truncate">{current.label}</span>
            </div>
          </>
        )}

        {subTitle && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="text-forest-800 font-bold bg-forest-50 px-2.5 py-0.5 rounded-md border border-forest-200/80 truncate max-w-xs">{subTitle}</span>
          </>
        )}
      </div>

      <div className="hidden lg:flex items-center space-x-2 text-[11px] text-slate-500 font-medium shrink-0">
        <span>Sessão ativa:</span>
        <span className="bg-forest-50 text-forest-800 font-semibold px-2.5 py-0.5 rounded-md border border-forest-200/80 max-w-64 truncate">
          {user?.funcionario || user?.username} • {profileLabel}
        </span>
        <span className="text-slate-300">•</span>
        <span className="capitalize text-slate-600">{today}</span>
      </div>
    </div>
  );
}

