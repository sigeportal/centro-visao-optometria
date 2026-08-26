import {
  Calendar,
  Clock,
  DollarSign,
  Eye,
  FileBarChart,
  LayoutDashboard,
  Lock,
  Settings,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../constants/permissions';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Início', icon: LayoutDashboard, permissions: [PERMISSIONS.DASHBOARD_VIEW] },
  { id: 'agenda', label: 'Agenda', icon: Calendar, permissions: [PERMISSIONS.AGENDA_VIEW] },
  { id: 'espera', label: 'Fila de Espera', icon: Clock, permissions: [PERMISSIONS.AGENDA_VIEW] },
  { id: 'pacientes', label: 'Pacientes', icon: Users, permissions: [PERMISSIONS.PATIENT_VIEW] },
  { id: 'atendimento', label: 'Consultas', icon: Stethoscope, permissions: [PERMISSIONS.CONSULTATION_SUMMARY] },
  { 
    id: 'relatorios', 
    label: 'Relatórios', 
    icon: FileBarChart, 
    permissions: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.CONSULTATION_SUMMARY, PERMISSIONS.PATIENT_VIEW, PERMISSIONS.AGENDA_VIEW] 
  },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign, permissions: [PERMISSIONS.FINANCE_VIEW], available: false },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: Settings,
    permissions: [PERMISSIONS.SYSTEM_ADMIN, PERMISSIONS.CLINICAL_FORM_CONFIGURE],
  },
];

export default function Sidebar({
  activeModule,
  setActiveModule,
  sidebarOpen,
  setFinanceiroSubTab,
}) {
  const { can } = useAuth();
  const visibleItems = MENU_ITEMS.filter((item) => item.permissions.some((permission) => can(permission)));

  const handleMenuClick = (item) => {
    if (item.available === false) return;
    if (item.id === 'financeiro' && setFinanceiroSubTab) {
      setFinanceiroSubTab('fluxo');
    }
    setActiveModule(item.id);
  };

  return (
    <aside className={`fixed top-[57px] left-0 h-[calc(100vh-57px)] bg-[#02241d] text-forest-100 border-r border-[#063c30] transition-all duration-200 z-30 flex flex-col justify-between select-none shadow-panel print:hidden ${sidebarOpen ? 'w-56' : 'w-16'}`}>
      <nav className="p-2.5 space-y-1 overflow-y-auto flex-1" aria-label="Navegação principal">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          const isAvailable = item.available !== false;

          return (
            <button
              type="button"
              key={item.id}
              onClick={() => handleMenuClick(item)}
              disabled={!isAvailable}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs transition-all duration-150 relative group ${
                isActive
                  ? 'bg-forest-850 text-white font-bold border border-forest-700/70 shadow-hairline'
                  : isAvailable
                    ? 'hover:bg-forest-900/80 text-forest-200/90 hover:text-white font-semibold'
                    : 'text-forest-400/40 bg-transparent cursor-not-allowed opacity-40'
              }`}
              title={!isAvailable ? `${item.label} indisponível` : !sidebarOpen ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="flex items-center space-x-3 min-w-0 w-full">
                <div className={`p-1 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-forest-700 text-amber-400' 
                    : 'text-forest-300/80 group-hover:text-amber-400'
                }`}>
                  <Icon className="w-4 h-4 shrink-0" />
                </div>
                {sidebarOpen && (
                  <span className="truncate tracking-tight font-medium text-[12px]">{item.label}</span>
                )}
                {sidebarOpen && !isAvailable && (
                  <Lock className="w-3 h-3 ml-auto shrink-0 opacity-50" aria-hidden="true" />
                )}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute right-2.5 top-1/2 -translate-y-1/2 shadow-xs ring-2 ring-amber-400/30" />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#063c30] text-center text-[10.5px] text-forest-300/70 font-sans font-semibold tracking-tight bg-[#011813] flex items-center justify-center gap-2 select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-forest-400 animate-pulse shrink-0" />
        {sidebarOpen && <span>Centro Visão</span>}
      </div>
    </aside>
  );
}

