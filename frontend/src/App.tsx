import './App.css';
import ReporteForm from './components/ReporteForm';
import ConsultaReporte from './components/ConsultaReporte';
import AccesoPersonal from './components/AccesoPersonal';

function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-content">
          <div className="brand">
            <div className="brand-mark">SV</div>

            <div>
              <p className="government-name">Portal Ciudadano</p>
              <p className="government-area">Gestión de Infraestructura Vial</p>
            </div>
          </div>

          <a className="staff-button" href="/personal">
            Acceso del personal
          </a>
        </div>
      </header>

      <nav className="navigation">
        <div className="nav-content">
          <a href="#inicio">Inicio</a>
          <a href="#formulario-reporte">Reportar un bache</a>
          <a href="#consultar">Consultar reporte</a>
          <a href="#informacion">Información</a>
        </div>
      </nav>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-content">
            <p className="eyebrow">SERVICIO CIUDADANO</p>

            <h1>
              Sistema de Gestión y
              <span> Reporte de Baches</span>
            </h1>

            <p className="hero-description">
              Reporta afectaciones en las vialidades de Xalapa y consulta
              el seguimiento de tu solicitud mediante un folio único.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#formulario-reporte">
                Reportar un bache
              </a>

              <a className="secondary-button" href="#consultar">
                Consultar mi reporte
              </a>
            </div>

            <p className="no-account">
              No necesitas crear una cuenta para realizar un reporte.
            </p>
          </div>

          <div className="hero-card">
            <div className="hero-card-icon">!</div>

            <h2>¿Encontraste un bache?</h2>

            <p>
              Registra la ubicación, agrega una fotografía y describe
              la afectación para iniciar el proceso de atención.
            </p>

            <div className="status-line">
              <span>Reportado</span>
              <span className="line"></span>
              <span>En proceso</span>
              <span className="line"></span>
              <span>Atendido</span>
            </div>
          </div>
        </section>

        <section className="steps" id="informacion">
          <div className="section-heading">
            <p className="eyebrow">PROCESO DE ATENCIÓN</p>
            <h2>¿Cómo realizar un reporte?</h2>
<p>
              El trámite es sencillo y puede realizarse desde una computadora,
              tableta o teléfono móvil.
            </p>
          </div>

          <div className="steps-grid">
            <article className="step-card">
              <div className="step-number">1</div>
              <h3>Ubica el bache</h3>
              <p>
                Permite el acceso a tu ubicación o captura manualmente
                la calle, entre calles y colonia.
              </p>
            </article>

            <article className="step-card">
              <div className="step-number">2</div>
              <h3>Registra la evidencia</h3>
              <p>
                Adjunta una fotografía, describe el daño y selecciona
                su nivel de severidad.
              </p>
            </article>

            <article className="step-card">
              <div className="step-number">3</div>
              <h3>Obtén tu folio</h3>
              <p>
                Al enviar el reporte recibirás un folio único para
                identificar tu solicitud.
              </p>
            </article>

            <article className="step-card">
              <div className="step-number">4</div>
              <h3>Consulta el avance</h3>
              <p>
                Revisa posteriormente si tu reporte se encuentra
                Reportado, En Proceso o Atendido.
              </p>
            </article>
          </div>
        </section>
<ReporteForm />

<section className="quick-actions">
          <div className="action-panel" id="reportar">
            <div>
              <p className="eyebrow">NUEVO REPORTE</p>
              <h2>Ayúdanos a mejorar nuestras vialidades</h2>
              <p>
                Proporciona la información necesaria para identificar
                correctamente la afectación.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={() =>
                document
                  .getElementById('formulario-reporte')
                  ?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
              }
            >
              Iniciar reporte
            </button>
          </div>
          <ConsultaReporte />
        </section>
      </main>

      <footer className="footer">
        <div>
          <strong>Sistema de Gestión y Reporte de Baches</strong>
          <p>Portal ciudadano para el registro y seguimiento de afectaciones viales</p>
        </div>

        <div className="footer-right">
          <p>Atención ciudadana</p>
          <p>Xalapa, Veracruz</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
















