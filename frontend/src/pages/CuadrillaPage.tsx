import {
  useEffect,
  useState,
} from 'react';
import {
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { API_URL } from '../config';
import './CuadrillaPage.css';

interface UsuarioSesion {
  id: number;
  nombre: string;
  usuario: string;
  rol: string;
  cuadrillaId: number | null;
}

interface Cuadrilla {
  id: number;
  nombre: string;
  responsable: string;
  telefono: string | null;
}

interface Evidencia {
  id: number;
  tipo: 'Danio' | 'Reparacion';
  ruta: string;
  fechaCreacion: string;
}

interface Reporte {
  id: number;
  folio: string;
  latitud: number | string | null;
  longitud: number | string | null;
  calle: string | null;
  entreCalles: string | null;
  colonia: string | null;
  descripcion: string;
  severidad: 'Alta' | 'Media' | 'Baja';
  fotografia: string | null;
  estado:
    | 'Reportado'
    | 'En Proceso'
    | 'Atendido';
  fechaReporte: string;
  cuadrilla: Cuadrilla | null;
  evidencias: Evidencia[];
}

export default function CuadrillaPage() {
  const navigate = useNavigate();

  const [reportes, setReportes] =
    useState<Reporte[]>([]);

  const [seleccionado, setSeleccionado] =
    useState<Reporte | null>(null);

  const [fotografias, setFotografias] =
    useState<File[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [subiendo, setSubiendo] =
    useState(false);

  const [error, setError] =
    useState('');

  const [mensaje, setMensaje] =
    useState('');

  const token =
    sessionStorage.getItem('accessToken');

  const usuarioGuardado =
    sessionStorage.getItem('usuario');

  let usuario: UsuarioSesion | null = null;

  if (usuarioGuardado) {
    try {
      usuario =
        JSON.parse(usuarioGuardado);
    } catch {
      usuario = null;
    }
  }

  const cargarReportes = async () => {
    if (!token) {
      return;
    }

    setCargando(true);
    setError('');

    try {
      const respuesta = await fetch(
        `${API_URL}/reportes/mis-asignados`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.message ||
            'No fue posible cargar los trabajos.',
        );
      }

      const lista =
        datos as Reporte[];

      setReportes(lista);

      setSeleccionado(
        (actual) =>
          lista.find(
            (r) =>
              r.id === actual?.id,
          ) ??
          lista[0] ??
          null,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al cargar los trabajos.',
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarReportes();
  }, []);

  if (!token || !usuario) {
    return (
      <Navigate
        to="/personal"
        replace
      />
    );
  }

  if (usuario.rol !== 'Cuadrilla') {
    return (
      <Navigate
        to={
          usuario.rol ===
          'Administrador'
            ? '/admin'
            : '/revisor'
        }
        replace
      />
    );
  }

  const cerrarSesion = () => {
    sessionStorage.clear();
    navigate('/personal');
  };

  const subirReparacion =
    async () => {
      if (
        !token ||
        !seleccionado ||
        fotografias.length === 0
      ) {
        setError(
          'Selecciona al menos una fotografía de la reparación.',
        );
        return;
      }

      setSubiendo(true);
      setError('');
      setMensaje('');

      try {
        const formulario =
          new FormData();

        fotografias.forEach(
          (archivo) => {
            formulario.append(
              'fotografias',
              archivo,
            );
          },
        );

        const respuesta =
          await fetch(
            `${API_URL}/reportes/${seleccionado.id}/evidencias/reparacion`,
            {
              method: 'POST',

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              body: formulario,
            },
          );

        const datos =
          await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            datos.message ||
              'No fue posible subir las fotografías.',
          );
        }

        setFotografias([]);

        setMensaje(
          'Las fotografías de la reparación fueron registradas correctamente.',
        );

        await cargarReportes();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Error al subir las fotografías.',
        );
      } finally {
        setSubiendo(false);
      }
    };

  const latitud =
    seleccionado?.latitud != null
      ? Number(
          seleccionado.latitud,
        )
      : null;

  const longitud =
    seleccionado?.longitud != null
      ? Number(
          seleccionado.longitud,
        )
      : null;

  const tieneGps =
    latitud !== null &&
    longitud !== null &&
    Number.isFinite(latitud) &&
    Number.isFinite(longitud);

  const mapaUrl =
    tieneGps
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitud! - 0.008},${latitud! - 0.005},${longitud! + 0.008},${latitud! + 0.005}&layer=mapnik&marker=${latitud},${longitud}`
      : '';

  const fotosDanio =
    seleccionado?.evidencias.filter(
      (e) =>
        e.tipo === 'Danio',
    ) ?? [];

  const fotosReparacion =
    seleccionado?.evidencias.filter(
      (e) =>
        e.tipo === 'Reparacion',
    ) ?? [];

  return (
    <div className="crew-page">
      <header className="crew-header">
        <div>
          <p>
            Sistema de Gestión y
            Reporte de Baches
          </p>

          <span>
            Panel de cuadrilla
          </span>
        </div>

        <div className="crew-user">
          <div>
            <strong>
              {usuario.nombre}
            </strong>

            <span>
              Cuadrilla
            </span>
          </div>

          <button
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="crew-layout">
        <aside className="crew-sidebar">
          <h2>
            Mis reparaciones
          </h2>

          <p>
            {reportes.length}
            {' '}
            trabajo(s) asignado(s)
          </p>

          {cargando ? (
            <span>
              Cargando...
            </span>
          ) : reportes.length === 0 ? (
            <div className="crew-empty">
              No tienes trabajos
              asignados.
            </div>
          ) : (
            reportes.map(
              (reporte) => (
                <button
                  type="button"
                  key={reporte.id}
                  className={
                    seleccionado?.id ===
                    reporte.id
                      ? 'active'
                      : ''
                  }
                  onClick={() => {
                    setSeleccionado(
                      reporte,
                    );

                    setError('');
                    setMensaje('');
                    setFotografias([]);
                  }}
                >
                  <strong>
                    {reporte.folio}
                  </strong>

                  <span>
                    {reporte.calle ||
                      'Ubicación GPS'}
                  </span>

                  <small>
                    {reporte.estado}
                  </small>
                </button>
              ),
            )
          )}
        </aside>

        <main className="crew-main">
          {error && (
            <div className="crew-error">
              {error}
            </div>
          )}

          {mensaje && (
            <div className="crew-success">
              {mensaje}
            </div>
          )}

          {!seleccionado ? (
            <section className="crew-no-selection">
              <h1>
                Mis trabajos
              </h1>

              <p>
                Selecciona un reporte
                asignado para consultar
                sus detalles.
              </p>
            </section>
          ) : (
            <>
              <section className="crew-title">
                <div>
                  <p>
                    TRABAJO ASIGNADO
                  </p>

                  <h1>
                    {
                      seleccionado.folio
                    }
                  </h1>
                </div>

                <span
                  className={`crew-status crew-status-${seleccionado.estado
                    .toLowerCase()
                    .replace(
                      ' ',
                      '-',
                    )}`}
                >
                  {
                    seleccionado.estado
                  }
                </span>
              </section>

              <section className="crew-grid">
                <article className="crew-card">
                  <h3>
                    Información
                  </h3>

                  <dl>
                    <div>
                      <dt>
                        Severidad
                      </dt>

                      <dd>
                        {
                          seleccionado.severidad
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>
                        Fecha
                      </dt>

                      <dd>
                        {new Date(
                          seleccionado.fechaReporte,
                        ).toLocaleDateString(
                          'es-MX',
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        Cuadrilla
                      </dt>

                      <dd>
                        {
                          seleccionado
                            .cuadrilla
                            ?.nombre
                        }
                      </dd>
                    </div>
                  </dl>
                </article>

                <article className="crew-card">
                  <h3>
                    Ubicación
                  </h3>

                  <p>
                    <strong>
                      Calle:
                    </strong>{' '}
                    {seleccionado.calle ||
                      'No registrada'}
                  </p>

                  <p>
                    <strong>
                      Entre calles:
                    </strong>{' '}
                    {seleccionado.entreCalles ||
                      'No registradas'}
                  </p>

                  <p>
                    <strong>
                      Colonia:
                    </strong>{' '}
                    {seleccionado.colonia ||
                      'No registrada'}
                  </p>
                </article>
              </section>

              <section className="crew-card crew-description">
                <h3>
                  Descripción del daño
                </h3>

                <p>
                  {
                    seleccionado.descripcion
                  }
                </p>
              </section>

              {tieneGps && (
                <section className="crew-card">
                  <h3>
                    Ubicación en mapa
                  </h3>

                  <iframe
                    className="crew-map"
                    src={mapaUrl}
                    title="Ubicación del reporte"
                  />
                </section>
              )}

              <section className="crew-card">
                <h3>
                  Evidencia del daño
                </h3>

                <div className="crew-photos">
                  {seleccionado.fotografia && (
                    <img
                      src={`${API_URL}/${seleccionado.fotografia}`}
                      alt="Fotografía ciudadana"
                    />
                  )}

                  {fotosDanio.map(
                    (foto) => (
                      <img
                        key={foto.id}
                        src={`${API_URL}/${foto.ruta}`}
                        alt="Evidencia del daño"
                      />
                    ),
                  )}

                  {!seleccionado.fotografia &&
                    fotosDanio.length ===
                      0 && (
                      <p>
                        No hay fotografías
                        del daño registradas.
                      </p>
                    )}
                </div>
              </section>

              <section className="crew-card">
                <h3>
                  Evidencia de reparación
                </h3>

                {fotosReparacion.length >
                0 ? (
                  <div className="crew-photos">
                    {fotosReparacion.map(
                      (foto) => (
                        <img
                          key={
                            foto.id
                          }
                          src={`${API_URL}/${foto.ruta}`}
                          alt="Fotografía de reparación"
                        />
                      ),
                    )}
                  </div>
                ) : (
                  <p className="crew-muted">
                    Todavía no hay
                    fotografías de
                    reparación.
                  </p>
                )}

                {seleccionado.estado !==
                  'Atendido' && (
                  <div className="crew-upload">
                    <label>
                      Subir fotografías
                      del trabajo realizado

                      <input
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        onChange={(e) =>
                          setFotografias(
                            Array.from(
                              e.target
                                .files ??
                                [],
                            ).slice(
                              0,
                              5,
                            ),
                          )
                        }
                      />
                    </label>

                    {fotografias.length >
                      0 && (
                      <p>
                        {
                          fotografias.length
                        }{' '}
                        archivo(s)
                        seleccionado(s)
                      </p>
                    )}

                    <button
                      type="button"
                      disabled={
                        subiendo ||
                        fotografias.length ===
                          0
                      }
                      onClick={() =>
                        void subirReparacion()
                      }
                    >
                      {subiendo
                        ? 'Subiendo...'
                        : 'Registrar evidencia de reparación'}
                    </button>
                  </div>
                )}
              </section>

              {fotosReparacion.length >
                0 &&
                seleccionado.estado !==
                  'Atendido' && (
                  <div className="crew-review-message">
                    <strong>
                      Reparación registrada
                    </strong>

                    <span>
                      La evidencia ya fue
                      enviada. El Revisor
                      podrá verificar el
                      trabajo y finalizar
                      el reporte.
                    </span>
                  </div>
                )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

