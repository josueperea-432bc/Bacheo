import AccesoPersonal from '../components/AccesoPersonal';
import './PersonalPage.css';

export default function PersonalPage() {
  return (
    <div className="personal-page">
      <header className="personal-topbar">
        <div className="personal-topbar-content">
          <div>
            <p className="personal-system">Sistema de Gestión y Reporte de Baches</p>
            <span>Portal de gestión interna</span>
          </div>

          <a href="/" className="back-public">
            Volver al portal ciudadano
          </a>
        </div>
      </header>

      <AccesoPersonal />
    </div>
  );
}
