import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { API_URL } from '../config';
import './RevisorPage.css';

type EstadoReporte =
  | 'Reportado'
  | 'En Proceso'
  | 'Atendido';

type VistaRevisor =
  | 'pendientes'
  | 'proceso'
  | 'atendidos';

interface UsuarioSesion {
  id: number;
  nombre: string;
  usuario: string;
  rol: string;
  cuadrillaId?: number | null;
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
  telefono: string | null;
  correo: string | null;
  latitud: number | string | null;
  longitud: number | string | null;
  calle: string | null;
  entreCalles: string | null;
  colonia: string | null;
  descripcion: string;
  severidad: 'Alta' | 'Media' | 'Baja';
  fotografia: string | null;
  estado: EstadoReporte;
  fechaReporte: string;
  fechaAtencion: string | null;
  cuadrilla: Cuadrilla | null;
  evidencias: Evidencia[];
}

export default function RevisorPage() {
  const navigate = useNavigate();

  const token =
    sessionStorage.getItem('accessToken');

  const usuarioGuardado =
    sessionStorage.getItem('usuario');

  const [vista, setVista] =
    useState<VistaRevisor>('pendientes');

  const [reportes, setReportes] =
    useState<Reporte[]>([]);

  const [seleccionado, setSeleccionado] =
    useState<Reporte | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [procesando, setProcesando] =
    useState(false);

  const [error, setError] =
    useState('');

  const [mensaje, setMensaje] =
    useState('');

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
        `${API_URL}/reportes`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

      if (respuesta.status === 401) {
        sessionStorage.clear();
        navigate('/personal');
        return;
      }

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.message ||
            'No fue posible cargar los reportes.',
        );
      }

      const lista =
        datos as Reporte[];

      setReportes(lista);

      setSeleccionado((actual) => {
        if (actual) {
          const actualizado =
            lista.find(
              (reporte) =>
                reporte.id === actual.id,
            );

          if (actualizado) {
            return actualizado;
          }
        }

        return (
          lista.find(
            (reporte) =>
              reporte.estado ===
              'Reportado',
          ) ??
          lista.find(
            (reporte) =>
              reporte.estado ===
              'En Proceso',
          ) ??
          lista[0] ??
          null
        );
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al cargar reportes.',
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarReportes();
  }, []);

  const pendientes = useMemo(
    () =>
      reportes.filter(
        (reporte) =>
          reporte.estado ===
          'Reportado',
      ),
    [reportes],
  );

  const enProceso = useMemo(
    () =>
      reportes.filter(
        (reporte) =>
          reporte.estado ===
          'En Proceso',
      ),
    [reportes],
  );

  const atendidos = useMemo(
    () =>
      reportes.filter(
        (reporte) =>
          reporte.estado ===
          'Atendido',
      ),
    [reportes],
  );

  const listaActual =
    vista === 'pendientes'
      ? pendientes
      : vista === 'proceso'
        ? enProceso
        : atendidos;

  const cambiarVista = (
    nuevaVista: VistaRevisor,
  ) => {
    setVista(nuevaVista);
    setError('');
    setMensaje('');

    const nuevaLista =
      nuevaVista === 'pendientes'
        ? pendientes
        : nuevaVista === 'proceso'
          ? enProceso
          : atendidos;

    setSeleccionado(
      nuevaLista[0] ?? null,
    );
  };

  const aceptarReporte = async () => {
    if (!token || !seleccionado) {
      return;
    }

    setProcesando(true);
    setError('');
    setMensaje('');

    try {
      const respuesta = await fetch(
        `${API_URL}/reportes/${seleccionado.id}/estado`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            estado: 'En Proceso',
          }),
        },
      );

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.message ||
            'No fue posible aceptar el reporte.',
        );
      }

      const actualizado =
        datos as Reporte;

      setReportes((actuales) =>
        actuales.map((reporte) =>
          reporte.id === actualizado.id
            ? actualizado
            : reporte,
        ),
      );

      setSeleccionado(actualizado);
      setVista('proceso');

      setMensaje(
        'El reporte fue aceptado y se encuentra en proceso.',
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible aceptar el reporte.',
      );
    } finally {
      setProcesando(false);
    }
  };

  const terminarReporte = async () => {
    if (!token || !seleccionado) {
      return;
    }

    setProcesando(true);
    setError('');
    setMensaje('');

    try {
      const respuesta = await fetch(
        `${API_URL}/reportes/${seleccionado.id}/terminar`,
        {
          method: 'PATCH',

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
          Array.isArray(datos.message)
            ? datos.message.join(', ')
            : datos.message ||
                'No fue posible terminar el reporte.',
        );
      }

      const actualizado =
        datos as Reporte;

      setReportes((actuales) =>
        actuales.map((reporte) =>
          reporte.id === actualizado.id
            ? actualizado
            : reporte,
        ),
      );

      setSeleccionado(actualizado);
      setVista('atendidos');

      setMensaje(
        'El reporte fue validado y marcado como Atendido.',
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible terminar el reporte.',
      );
    } finally {
      setProcesando(false);
    }
  };

  const cerrarSesion = () => {
    sessionStorage.removeItem(
      'accessToken',
    );

    sessionStorage.removeItem(
      'usuario',
    );

    navigate('/personal');
  };

  if (!token || !usuario) {
    return (
      <Navigate
        to="/personal"
        replace
      />
    );
  }

  if (usuario.rol !== 'Revisor') {
    return (
      <Navigate
        to={
          usuario.rol ===
          'Cuadrilla'
            ? '/cuadrilla'
            : '/admin'
        }
        replace
      />
    );
  }

  const latitud =
    seleccionado?.latitud !== null &&
    seleccionado?.latitud !== undefined
      ? Number(
          seleccionado.latitud,
        )
      : null;

  const longitud =
    seleccionado?.longitud !== null &&
    seleccionado?.longitud !== undefined
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
    seleccionado?.evidencias?.filter(
      (evidencia) =>
        evidencia.tipo === 'Danio',
    ) ?? [];

  const fotosReparacion =
    seleccionado?.evidencias?.filter(
      (evidencia) =>
        evidencia.tipo ===
        'Reparacion',
    ) ?? [];

  return (
    <div className="review-page">
      <header className="review-header">
        <div>
          <strong>
            Sistema de Gestión y Reporte
            de Baches
          </strong>

          <span>
            Módulo de revisión
          </span>
        </div>

        <div className="review-user">
          <div>
            <strong>
              {usuario.nombre}
            </strong>

            <span>
              {usuario.rol}
            </span>
          </div>

          <button
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="review-layout">
        <aside className="review-inbox">
          <div className="review-inbox-header">
            <div>
              <p>
                GESTIÓN DE REPORTES
              </p>

              <h2>
                Seguimiento
              </h2>
            </div>
          </div>

          <div className="review-tabs">
            <button
              type="button"
              className={
                vista === 'pendientes'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                cambiarVista(
                  'pendientes',
                )
              }
            >
              <span>
                Por revisar
              </span>

              <strong>
                {pendientes.length}
              </strong>
            </button>

            <button
              type="button"
              className={
                vista === 'proceso'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                cambiarVista(
                  'proceso',
                )
              }
            >
              <span>
                En reparación
              </span>

              <strong>
                {enProceso.length}
              </strong>
            </button>

            <button
              type="button"
              className={
                vista === 'atendidos'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                cambiarVista(
                  'atendidos',
                )
              }
            >
              <span>
                Atendidos
              </span>

              <strong>
                {atendidos.length}
              </strong>
            </button>
          </div>

          <button
            type="button"
            className="review-refresh"
            onClick={() =>
              void cargarReportes()
            }
          >
            Actualizar reportes
          </button>

          {cargando ? (
            <p>
              Cargando...
            </p>
          ) : listaActual.length ===
            0 ? (
            <div className="review-empty">
              {vista === 'pendientes'
                ? 'No hay reportes nuevos.'
                : vista === 'proceso'
                  ? 'No hay reportes en reparación.'
                  : 'No hay reportes atendidos.'}
            </div>
          ) : (
            <div className="review-list">
              {listaActual.map(
                (reporte) => (
                  <button
                    type="button"
                    key={reporte.id}
                    className={
                      seleccionado?.id ===
                      reporte.id
                        ? 'review-item active'
                        : 'review-item'
                    }
                    onClick={() => {
                      setSeleccionado(
                        reporte,
                      );

                      setError('');
                      setMensaje('');
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
                      Severidad{' '}
                      {reporte.severidad}
                    </small>

                    {reporte.cuadrilla && (
                      <small className="review-team-small">
                        {
                          reporte
                            .cuadrilla
                            .nombre
                        }
                      </small>
                    )}
                  </button>
                ),
              )}
            </div>
          )}
        </aside>

        <section className="review-content">
          {error && (
            <div className="review-error">
              {error}
            </div>
          )}

          {mensaje && (
            <div className="review-success">
              {mensaje}
            </div>
          )}

          {!seleccionado ? (
            <div className="review-no-selection">
              <h2>
                Selecciona un reporte
              </h2>

              <p>
                Elige un reporte de la
                bandeja para revisar sus
                datos.
              </p>
            </div>
          ) : (
            <>
              <div className="review-title">
                <div>
                  <p>
                    REPORTE CIUDADANO
                  </p>

                  <h1>
                    {seleccionado.folio}
                  </h1>
                </div>

                <div className="review-title-badges">
                  <span
                    className={`review-state state-${seleccionado.estado
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

                  <span
                    className={`review-severity severity-${seleccionado.severidad.toLowerCase()}`}
                  >
                    {
                      seleccionado.severidad
                    }
                  </span>
                </div>
              </div>

              <div className="review-grid">
                <article className="review-card photo-card">
                  <h3>
                    Evidencia inicial
                  </h3>

                  {seleccionado.fotografia ? (
                    <img
                      src={`${API_URL}/${seleccionado.fotografia}`}
                      alt={`Evidencia del reporte ${seleccionado.folio}`}
                    />
                  ) : fotosDanio.length >
                    0 ? (
                    <div className="review-photo-grid">
                      {fotosDanio.map(
                        (foto) => (
                          <img
                            key={
                              foto.id
                            }
                            src={`${API_URL}/${foto.ruta}`}
                            alt="Evidencia del daño"
                          />
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="no-photo">
                      Sin fotografía
                      registrada
                    </div>
                  )}

                  {seleccionado.fotografia &&
                    fotosDanio.length >
                      0 && (
                      <div className="review-extra-photos">
                        <h4>
                          Evidencias
                          adicionales
                        </h4>

                        <div className="review-photo-grid">
                          {fotosDanio.map(
                            (foto) => (
                              <img
                                key={
                                  foto.id
                                }
                                src={`${API_URL}/${foto.ruta}`}
                                alt="Evidencia adicional del daño"
                              />
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </article>

                <article className="review-card">
                  <h3>
                    Información del reporte
                  </h3>

                  <dl>
                    <div>
                      <dt>
                        Folio
                      </dt>

                      <dd>
                        {
                          seleccionado.folio
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>
                        Estado
                      </dt>

                      <dd>
                        {
                          seleccionado.estado
                        }
                      </dd>
                    </div>

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
                        ).toLocaleString(
                          'es-MX',
                        )}
                      </dd>
                    </div>

                    {seleccionado.fechaAtencion && (
                      <div>
                        <dt>
                          Fecha de atención
                        </dt>

                        <dd>
                          {new Date(
                            seleccionado.fechaAtencion,
                          ).toLocaleString(
                            'es-MX',
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                </article>

                <article className="review-card">
                  <h3>
                    Ubicación
                  </h3>

                  <dl>
                    <div>
                      <dt>
                        Calle
                      </dt>

                      <dd>
                        {seleccionado.calle ||
                          'No especificada'}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        Entre calles
                      </dt>

                      <dd>
                        {seleccionado.entreCalles ||
                          'No especificadas'}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        Colonia
                      </dt>

                      <dd>
                        {seleccionado.colonia ||
                          'No especificada'}
                      </dd>
                    </div>

                    {tieneGps && (
                      <div>
                        <dt>
                          Coordenadas
                        </dt>

                        <dd>
                          {latitud},{' '}
                          {longitud}
                        </dd>
                      </div>
                    )}
                  </dl>
                </article>

                <article className="review-card">
                  <h3>
                    Datos de contacto
                  </h3>

                  <dl>
                    <div>
                      <dt>
                        Teléfono
                      </dt>

                      <dd>
                        {seleccionado.telefono ||
                          'No proporcionado'}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        Correo electrónico
                      </dt>

                      <dd>
                        {seleccionado.correo ||
                          'No proporcionado'}
                      </dd>
                    </div>
                  </dl>
                </article>
              </div>

              <article className="review-card description-card">
                <h3>
                  Descripción
                </h3>

                <p>
                  {
                    seleccionado.descripcion
                  }
                </p>
              </article>

              <article className="review-card team-card-review">
                <h3>
                  Cuadrilla asignada
                </h3>

                {seleccionado.cuadrilla ? (
                  <div className="review-team-info">
                    <div>
                      <span>
                        CUADRILLA
                      </span>

                      <strong>
                        {
                          seleccionado
                            .cuadrilla
                            .nombre
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        RESPONSABLE
                      </span>

                      <strong>
                        {
                          seleccionado
                            .cuadrilla
                            .responsable
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        TELÉFONO
                      </span>

                      <strong>
                        {seleccionado
                          .cuadrilla
                          .telefono ||
                          'No registrado'}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="review-no-team">
                    El reporte todavía no
                    tiene una cuadrilla
                    asignada.
                  </div>
                )}
              </article>

              <article className="review-card repair-card">
                <div className="repair-card-heading">
                  <div>
                    <p>
                      EVIDENCIA DE TRABAJO
                    </p>

                    <h3>
                      Reparación realizada
                    </h3>
                  </div>

                  {fotosReparacion.length >
                    0 && (
                    <span className="repair-ready">
                      Evidencia recibida
                    </span>
                  )}
                </div>

                {fotosReparacion.length ===
                0 ? (
                  <div className="no-photo">
                    La cuadrilla todavía no
                    ha registrado fotografías
                    de la reparación.
                  </div>
                ) : (
                  <div className="review-photo-grid repair-photo-grid">
                    {fotosReparacion.map(
                      (foto) => (
                        <a
                          key={foto.id}
                          href={`${API_URL}/${foto.ruta}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={`${API_URL}/${foto.ruta}`}
                            alt="Evidencia de reparación"
                          />
                        </a>
                      ),
                    )}
                  </div>
                )}

                {seleccionado.estado ===
                  'En Proceso' && (
                  <div className="repair-review-status">
                    {seleccionado.cuadrilla ? (
                      fotosReparacion.length >
                      0 ? (
                        <>
                          <strong>
                            Reparación lista
                            para revisión
                          </strong>

                          <span>
                            Revisa las
                            fotografías antes
                            de finalizar el
                            reporte.
                          </span>
                        </>
                      ) : (
                        <>
                          <strong>
                            Trabajo en proceso
                          </strong>

                          <span>
                            Esperando que la
                            cuadrilla registre
                            evidencia de la
                            reparación.
                          </span>
                        </>
                      )
                    ) : (
                      <>
                        <strong>
                          Pendiente de
                          asignación
                        </strong>

                        <span>
                          El Administrador debe
                          asignar una cuadrilla
                          responsable.
                        </span>
                      </>
                    )}
                  </div>
                )}
              </article>

              <article className="review-card map-card">
                <h3>
                  Ubicación en el mapa
                </h3>

                {tieneGps ? (
                  <iframe
                    src={mapaUrl}
                    title={`Mapa ${seleccionado.folio}`}
                    loading="lazy"
                  />
                ) : (
                  <div className="no-map">
                    Este reporte fue
                    registrado mediante
                    dirección manual y no
                    cuenta con coordenadas
                    GPS.
                  </div>
                )}
              </article>

              {seleccionado.estado ===
                'Reportado' && (
                <div className="review-actions">
                  <button
                    type="button"
                    disabled={procesando}
                    onClick={() =>
                      void aceptarReporte()
                    }
                  >
                    {procesando
                      ? 'Procesando...'
                      : 'Aceptar reporte y poner En Proceso'}
                  </button>
                </div>
              )}

              {seleccionado.estado ===
                'En Proceso' && (
                <div className="review-actions review-actions-final">
                  <div>
                    <strong>
                      Validación final
                    </strong>

                    <span>
                      Para terminar el reporte
                      debe existir una
                      cuadrilla asignada y
                      evidencia fotográfica de
                      la reparación.
                    </span>
                  </div>

                  <button
                    type="button"
                    className="finish-report-button"
                    disabled={
                      procesando ||
                      !seleccionado.cuadrilla ||
                      fotosReparacion.length ===
                        0
                    }
                    onClick={() =>
                      void terminarReporte()
                    }
                  >
                    {procesando
                      ? 'Finalizando...'
                      : 'Terminar reporte'}
                  </button>
                </div>
              )}

              {seleccionado.estado ===
                'Atendido' && (
                <div className="completed-message">
                  <strong>
                    Reporte atendido
                  </strong>

                  <span>
                    La reparación fue validada
                    y el reporte se encuentra
                    finalizado.
                  </span>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

