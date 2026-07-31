import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

function navClass({ isActive }) {
  return `menu-link menu-link-top ${isActive ? 'active' : ''}`;
}

function subNavClass({ isActive }) {
  return `menu-sub-link ${isActive ? 'active' : ''}`;
}

const icons = {
  home: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z',
  calendar: 'M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z',
  users: 'M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 20v-2a4 4 0 0 0-3-3.87M16 3.13a3.5 3.5 0 0 1 0 6.74',
  clipboard: 'M9 5h6M9 11h6M9 15h4M8 4h8a2 2 0 0 1 2 2v14H6V6a2 2 0 0 1 2-2Z',
  settings: 'M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5ZM19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.8 3.12-.08-.02a1.7 1.7 0 0 0-1.9.32 1.7 1.7 0 0 0-.5 1.22V22h-3.6v-.42a1.7 1.7 0 0 0-2.4-1.54l-.08.02-1.8-3.12.06-.06A1.7 1.7 0 0 0 4.6 15H4v-3.6h.6a1.7 1.7 0 0 0 1.2-2.9l-.06-.06 1.8-3.12.08.02a1.7 1.7 0 0 0 2.4-1.54V3.4h3.6v.4a1.7 1.7 0 0 0 2.4 1.54l.08-.02 1.8 3.12-.06.06a1.7 1.7 0 0 0 1.2 2.9h.6V15h-.6Z',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14ZM20 20l-4.5-4.5',
  fileText: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6ZM14 3v6h6M8 13h8M8 17h6',
  sliders: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M10 15v4',
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 6l6 6-6 6',
};

function Icon({ name }) {
  return (
    <svg className="menu-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d={icons[name]} />
    </svg>
  );
}

function toChildArray(children) {
  return Array.isArray(children) ? children : [children];
}

function MenuGroup({ label, icon, children, defaultOpen = false }) {
  const location = useLocation();
  const childPaths = toChildArray(children)
    .flatMap((c) => (c?.props?.children ? toChildArray(c.props.children) : [c]))
    .map((c) => c?.props?.to)
    .filter(Boolean);
  const isActive = childPaths.some((p) => location.pathname.startsWith(p));
  const [open, setOpen] = useState(defaultOpen || isActive);

  return (
    <div className="menu-group">
      <button
        type="button"
        className={`menu-group-btn ${isActive ? 'active' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="menu-icon"><Icon name={icon} /></span>
        <span>{label}</span>
        <span className="menu-chevron"><Icon name={open ? 'chevronDown' : 'chevronRight'} /></span>
      </button>
      {open && <div className="menu-sub">{children}</div>}
    </div>
  );
}

export default function Sidebar({ open = false, onNavigate }) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="brand-logo">CV</div>
        <div>
          <strong>Centro Visao</strong>
          <p>Optometria</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={navClass} onClick={onNavigate}>
          <span className="menu-icon"><Icon name="home" /></span> Inicio
        </NavLink>

        <NavLink to="/agenda" className={navClass} onClick={onNavigate}>
          <span className="menu-icon"><Icon name="calendar" /></span> Agenda
        </NavLink>

        <MenuGroup label="Pacientes" icon="users">
          <NavLink to="/pacientes/novo" className={subNavClass} onClick={onNavigate}>
            <span className="menu-sub-icon"><Icon name="plus" /></span>
            Cadastrar
          </NavLink>
          <NavLink to="/pacientes" end className={subNavClass} onClick={onNavigate}>
            <span className="menu-sub-icon"><Icon name="search" /></span>
            Pesquisar
          </NavLink>
        </MenuGroup>

        <MenuGroup label="Consultas" icon="clipboard">
          <NavLink to="/consultas" end className={subNavClass} onClick={onNavigate}>
            <span className="menu-sub-icon"><Icon name="fileText" /></span>
            Consultas Atendidas
          </NavLink>
        </MenuGroup>

        <MenuGroup label="Configuracoes" icon="settings">
          <NavLink to="/ficha-clinica" className={subNavClass} onClick={onNavigate}>
            <span className="menu-sub-icon"><Icon name="sliders" /></span>
            Ficha Clinica
          </NavLink>
        </MenuGroup>
      </nav>
    </aside>
  );
}
