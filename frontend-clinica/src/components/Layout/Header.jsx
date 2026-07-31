export default function Header({ onMenuClick }) {
  return (
    <header className="header">
      <button type="button" className="mobile-menu-btn" onClick={onMenuClick} aria-label="Abrir menu">
        Menu
      </button>
      <div className="header-title">
        <h1>Centro Visao Optometria</h1>
        <p>Painel clinico</p>
      </div>
      <div className="user-pill">Administrador</div>
    </header>
  );
}
