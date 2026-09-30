import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import './AccesoPersonal.css';

interface UsuarioSesion {
  id: number;
  nombre: string;
  usuario: string;
  rol: string;
}

interface RespuestaLogin {
  accessToken: string;
  usuario: UsuarioSesion;
}

export default function AccesoPersonal() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [sesion, setSesion] = useState<UsuarioSesion | null>(null);

  useEffect(() => {
    const usuarioGuardado = sessionStorage.getItem('usuario');

    if (usuarioGuardado) {
      try {
        setSesion(JSON.parse(usuarioGuardado));
      } catch {
        sessionStorage.removeItem('usuario');
        sessionStorage.removeItem('accessToken');
      }
    }
  }, []);

  const iniciarSesion = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError('');
    setCargando(true);

    try {
      const respuesta = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario,
          contrasena,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          Array.isArray(datos.message)
            ? datos.message.join(', ')
            : datos.message || 'No fue posible iniciar sesión.',
        );
      }

      const login = datos as RespuestaLogin;

      sessionStorage.setItem('accessToken', login.accessToken);
      sessionStorage.setItem(
        'usuario',
        JSON.stringify(login.usuario),
      );

      setSesion(login.usuario);
      if (login.usuario.rol === 'Administrador') {
        navigate('/admin');
      } else if (login.usuario.rol === 'Revisor') {
        navigate('/revisor');
      } else if (login.usuario.rol === 'Cuadrilla') {
        navigate('/cuadrilla');
      }
      setUsuario('');
      setContrasena('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible iniciar sesión.',
      );
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('usuario');
    setSesion(null);
    setError('');
  };

  return (
    <section className="access-section" id="acceso-personal">
      <div className="access-container">
        <div className="access-information">
          <p className="access-eyebrow">
            ACCESO RESTRINGIDO
          </p>

          <h2>Personal autorizado</h2>

          <p>
            Este apartado está destinado al personal encargado de
            consultar, administrar y dar seguimiento a los reportes
            registrados por la ciudadanía.
          </p>

          <div className="access-features">
            <div>
              <strong>Consulta de reportes</strong>
              <span>
                Visualiza los reportes registrados en el sistema.
              </span>
            </div>

            <div>
              <strong>Seguimiento</strong>
              <span>
                Consulta ubicación, severidad y estado de atención.
              </span>
            </div>

            <div>
              <strong>Actualización</strong>
              <span>
                Registra los avances realizados sobre cada reporte.
              </span>
            </div>
          </div>
        </div>

        <div className="login-card">
          {!sesion ? (
            <>
              <div className="login-header">
                <span className="login-symbol">SV</span>

                <div>
                  <p>Portal de gestión</p>
                  <h3>Iniciar sesión</h3>
                </div>
              </div>

              <form onSubmit={iniciarSesion}>
                <label>
                  Usuario
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="Ingrese su usuario"
                    autoComplete="username"
                    required
                  />
                </label>

                <label>
                  Contraseña
                  <input
                    type="password"
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    placeholder="Ingrese su contraseña"
                    autoComplete="current-password"
                    required
                  />
                </label>

                {error && (
                  <div className="login-error">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="login-button"
                  disabled={cargando}
                >
                  {cargando
                    ? 'Verificando...'
                    : 'Iniciar sesión'}
                </button>
              </form>

              <p className="login-warning">
                Acceso exclusivo para personal autorizado.
              </p>
            </>
          ) : (
            <div className="session-panel">
              <div className="session-icon">✓</div>

              <p className="session-eyebrow">
                SESIÓN INICIADA
              </p>

              <h3>Bienvenido</h3>

              <p className="session-name">
                {sesion.nombre}
              </p>

              <div className="session-data">
                <div>
                  <span>Usuario</span>
                  <strong>{sesion.usuario}</strong>
                </div>

                <div>
                  <span>Rol</span>
                  <strong>{sesion.rol}</strong>
                </div>
              </div>

              <p className="session-message">
                La autenticación fue realizada correctamente.
                Ya puedes acceder a las funciones de gestión.
              </p>

              <button
                type="button"
                className="logout-button"
                onClick={cerrarSesion}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}





