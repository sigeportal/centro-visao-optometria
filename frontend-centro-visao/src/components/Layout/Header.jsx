import { useState } from 'react';
import { ChevronDown, Headphones, LogOut, Menu, Settings, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS, PROFILE_LABELS } from '../../constants/permissions';
import BrandLogo from '../Common/BrandLogo';
import SuporteModal from '../Common/SuporteModal';

function getInitials(name) {
  return String(name || 'Usuário')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export default function Header({ sidebarOpen, setSidebarOpen, setActiveModule }) {
  const { user, profile, can, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const displayName = user?.funcionario || user?.username || 'Usuário';
  const profileLabel = PROFILE_LABELS[profile] || profile || 'Sem perfil';
  const canOpenSettings = can(PERMISSIONS.SYSTEM_ADMIN) || can(PERMISSIONS.CLINICAL_FORM_CONFIGURE);

  const handleLogout = () => {
    setUserDropdownOpen(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-slate-800 border-b border-slate-200/80 select-none shadow-hairline transition-colors">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-forest-800 transition-colors"
            title="Menu"
            aria-label={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('dashboard')}
            className="text-left group transition-transform active:scale-[0.99]"
            aria-label="Ir para o início"
          >
            <BrandLogo theme="light" size="md" />
          </button>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setUserDropdownOpen((open) => !open)}
            className="flex items-center space-x-3 p-1.5 pr-2.5 rounded-xl hover:bg-slate-50 transition-all border border-slate-200/80 hover:border-slate-300 shadow-hairline"
            aria-expanded={userDropdownOpen}
            aria-haspopup="menu"
          >
            <div className="w-8 h-8 rounded-lg bg-forest-50 text-forest-800 border border-forest-200/80 flex items-center justify-center text-xs font-black shadow-xs">
              {getInitials(displayName)}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-bold text-slate-900 leading-none max-w-44 truncate">{displayName}</span>
              <span className="block text-[10px] text-forest-700 font-semibold uppercase tracking-wider leading-tight mt-1">{profileLabel}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-slate-200 text-slate-800 p-2 shadow-panel z-50 animate-fade-in" role="menu">
              <div className="p-3 border-b border-slate-100 bg-slate-50/70 rounded-xl mb-1">
                <p className="text-xs font-extrabold text-slate-900 truncate">{displayName}</p>
                <p className="text-[11px] text-slate-500 font-mono truncate">{user?.username}</p>
                <span className="inline-block text-[9px] text-forest-800 bg-forest-100/80 px-2 py-0.5 rounded-md font-bold uppercase mt-1.5 border border-forest-200/80">{profileLabel}</span>
              </div>

              <div className="py-1 text-xs space-y-0.5">
                {canOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModule('configuracoes');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 font-semibold flex items-center space-x-2 text-slate-700 transition-colors"
                    role="menuitem"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Configurações da clínica</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSupportModalOpen(true);
                    setUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 font-semibold flex items-center space-x-2 text-slate-700 transition-colors"
                  role="menuitem"
                >
                  <Headphones className="w-4 h-4 text-forest-700" />
                  <span>Contatar suporte</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-700 font-semibold flex items-center space-x-2 text-xs transition-colors"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Sair do sistema</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <SuporteModal 
        isOpen={supportModalOpen} 
        onClose={() => setSupportModalOpen(false)} 
      />
    </header>
  );
}

