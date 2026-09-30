import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { FormEvent } from 'react';
import {
  Navigate,
  useNavigate,
} from 'react-router-dom';
import MapaReportes from '../components/MapaReportes';
import { API_URL } from '../config';
import './AdminPage.css';

type EstadoReporte =
  | 'Reportado'
  | 'En Proceso'
  | 'Atendido';

type VistaAdmin =
  | 'resumen'
  | 'reportes'
  | 'seguimiento'
  | 'mapa'
  | 'cuadrillas';

interface UsuarioSesion {
  id: number;
  nombre: string;
  usuario: string;
  rol: string;
}

interface Cuadrilla {
  id: number;
  nombre: string;
  responsable: string;
  telefono: string | null;
  activo: boolean;
}

interface Evidencia {
  id: number;
  tipo: 'Danio' | 'Reparacion';
  ruta: string;
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

export default function AdminPage() {
  const navigate = useNavigate();

  const [vista, setVista] =
    useState<VistaAdmin>('resumen');

  const [reportes, setReportes] =
    useState<Reporte[]>([]);

  const [cuadrillas, setCuadrillas] =
    useState<Cuadrilla[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState('');

  const [mensajeCuadrilla, setMensajeCuadrilla] =
    useState('');

  const [nuevaCuadrilla, setNuevaCuadrilla] =
    useState({
      nombre: '',
      responsable: '',
      telefono: '',
    });

  const token =
    sessionStorage.getItem('accessToken');

  const usuarioGuardado =
    sessionStorage.getItem('usuario');

  let usuario: UsuarioSesion | null = null;

  if (usuarioGuardado) {
    try {
      usuario = JSON.parse(usuarioGuardado);
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
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (respuesta.status === 401) {
        sessionStorage.clear();
        navigate('/personal');
        return;
      }

      if (!respuesta.ok) {
        throw new Error(
          'No fue posible cargar los reportes.',
        );
      }

      const datos: Reporte[] =
        await respuesta.json();

      setReportes(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al cargar los reportes.',
      );
    } finally {
      setCargando(false);
    }
  };

  const cargarCuadrillas = async () => {
    if (!token) {
      return;
    }

    try {
      const respuesta = await fetch(
        `${API_URL}/cuadrillas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!respuesta.ok) {
        throw new Error(
          'No fue posible cargar las cuadrillas.',
        );
      }

      const datos: Cuadrilla[] =
        await respuesta.json();

      setCuadrillas(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al cargar las cuadrillas.',
      );
    }
  };

  useEffect(() => {
    void cargarReportes();
    void cargarCuadrillas();
  }, []);

  const crearCuadrilla = async (
    evento: FormEvent<HTMLFormElement>,
  ) => {
    evento.preventDefault();

    if (!token) {
      return;
    }

    setError('');
    setMensajeCuadrilla('');

    if (
      !nuevaCuadrilla.nombre.trim() ||
      !nuevaCuadrilla.responsable.trim()
    ) {
      setError(
        'Debes indicar el nombre de la cuadrilla y su responsable.',
      );
      return;
    }

    try {
      const respuesta = await fetch(
        `${API_URL}/cuadrillas`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            nombre:
              nuevaCuadrilla.nombre,
            responsable:
              nuevaCuadrilla.responsable,
            telefono:
              nuevaCuadrilla.telefono || undefined,
          }),
        },
      );

      if (!respuesta.ok) {
        throw new Error(
          'No fue posible registrar la cuadrilla.',
        );
      }

      setNuevaCuadrilla({
        nombre: '',
        responsable: '',
        telefono: '',
      });

      setMensajeCuadrilla(
        'Cuadrilla registrada correctamente.',
      );

      await cargarCuadrillas();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al registrar la cuadrilla.',
      );
    }
  };

  const asignarCuadrilla = async (
    reporteId: number,
    cuadrillaId: number,
  ) => {
    if (!token) {
      return;
    }

    setError('');

    try {
      const respuesta = await fetch(
        `${API_URL}/reportes/${reporteId}/cuadrilla`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            cuadrillaId,
          }),
        },
      );

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.message ||
            'No fue posible asignar la cuadrilla.',
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
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al asignar la cuadrilla.',
      );
    }
  };

  const actualizarEstado = async (
    id: number,
    estado: EstadoReporte,
  ) => {
    if (!token) {
      return;
    }

    setError('');

    try {
      const respuesta = await fetch(
        `${API_URL}/reportes/${id}/estado`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            estado,
          }),
        },
      );

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.message ||
            'No fue posible actualizar el estado.',
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
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al actualizar.',
      );

      await cargarReportes();
    }
  };

  const estadisticas = useMemo(() => {
    return {
      total:
        reportes.length,

      reportados:
        reportes.filter(
          (r) =>
            r.estado === 'Reportado',
        ).length,

      proceso:
        reportes.filter(
          (r) =>
            r.estado === 'En Proceso',
        ).length,

      atendidos:
        reportes.filter(
          (r) =>
            r.estado === 'Atendido',
        ).length,
    };
  }, [reportes]);

  const reportesSeguimiento =
    reportes.filter(
      (reporte) =>
        reporte.estado !== 'Atendido',
    );

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

  if (usuario.rol !== 'Administrador') {
    return (
      <Navigate
        to="/revisor"
        replace
      />
    );
  }

  const renderTabla = (
    datos: Reporte[],
  ) => (
    <>
      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="admin-loading">
          Cargando reportes...
        </div>
      ) : datos.length === 0 ? (
        <div className="empty-reports">
          <h3>
            No hay reportes registrados
          </h3>
        </div>
      ) : (
        <div className="reports-table-wrapper">
          <table className="reports-table admin-detailed-table">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Folio</th>
                <th>Ubicación</th>
                <th>Severidad</th>
                <th>
                  Responsable de reparación
                </th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {datos.map((reporte) => (
                <tr key={reporte.id}>
                  <td>
                    {reporte.fotografia ? (
                      <a
                        href={`${API_URL}/${reporte.fotografia}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          className="admin-report-photo"
                          src={`${API_URL}/${reporte.fotografia}`}
                          alt={`Bache ${reporte.folio}`}
                        />
                      </a>
                    ) : (
                      <span className="no-admin-photo">
                        Sin foto
                      </span>
                    )}
                  </td>

                  <td>
                    <strong className="folio-cell">
                      {reporte.folio}
                    </strong>

                    <small className="report-date-small">
                      {new Date(
                        reporte.fechaReporte,
                      ).toLocaleDateString(
                        'es-MX',
                      )}
                    </small>
                  </td>

                  <td>
                    <strong>
                      {reporte.calle ||
                        'Ubicación GPS'}
                    </strong>

                    {reporte.colonia && (
                      <small className="report-location-small">
                        {reporte.colonia}
                      </small>
                    )}

                    {reporte.entreCalles && (
                      <small className="report-location-small">
                        Entre:{' '}
                        {reporte.entreCalles}
                      </small>
                    )}
                  </td>

                  <td>
                    <span
                      className={`severity severity-${reporte.severidad.toLowerCase()}`}
                    >
                      {reporte.severidad}
                    </span>
                  </td>

                  <td>
                    {reporte.cuadrilla ? (
                      <div className="assigned-team">
                        <strong>
                          {
                            reporte.cuadrilla
                              .nombre
                          }
                        </strong>

                        <span>
                          Responsable:{' '}
                          {
                            reporte.cuadrilla
                              .responsable
                          }
                        </span>

                        {reporte.cuadrilla
                          .telefono && (
                          <small>
                            Tel.{' '}
                            {
                              reporte
                                .cuadrilla
                                .telefono
                            }
                          </small>
                        )}
                      </div>
                    ) : (
                      <span className="not-assigned">
                        Sin asignar
                      </span>
                    )}

                    {reporte.estado !==
                      'Atendido' && (
                      <select
                        className="team-select"
                        value={
                          reporte.cuadrilla
                            ?.id ?? ''
                        }
                        onChange={(e) => {
                          const id =
                            Number(
                              e.target
                                .value,
                            );

                          if (id) {
                            void asignarCuadrilla(
                              reporte.id,
                              id,
                            );
                          }
                        }}
                      >
                        <option
                          value=""
                          disabled
                        >
                          Seleccionar cuadrilla
                        </option>

                        {cuadrillas.map(
                          (cuadrilla) => (
                            <option
                              key={
                                cuadrilla.id
                              }
                              value={
                                cuadrilla.id
                              }
                            >
                              {
                                cuadrilla.nombre
                              }{' '}
                              -{' '}
                              {
                                cuadrilla.responsable
                              }
                            </option>
                          ),
                        )}
                      </select>
                    )}
                  </td>

                  <td>
                    <select
                      className="status-select"
                      value={reporte.estado}
                      disabled={
                        reporte.estado ===
                        'Atendido'
                      }
                      onChange={(e) =>
                        void actualizarEstado(
                          reporte.id,
                          e.target
                            .value as EstadoReporte,
                        )
                      }
                    >
                      <option value="Reportado">
                        Reportado
                      </option>

                      <option value="En Proceso">
                        En Proceso
                      </option>

                      <option value="Atendido">
                        Atendido
                      </option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-content">
          <div>
            <p className="admin-system">
              Sistema de Gestión y Reporte
              de Baches
            </p>

            <span>
              Panel de administración
            </span>
          </div>

          <div className="admin-user">
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
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="sidebar-title">
            <span className="sidebar-logo">
              SV
            </span>

            <div>
              <strong>
                Gestión vial
              </strong>

              <small>
                Administración
              </small>
            </div>
          </div>

          <nav className="admin-nav">
            <button
              type="button"
              className={
                vista === 'resumen'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setVista('resumen')
              }
            >
              Resumen
            </button>

            <button
              type="button"
              className={
                vista === 'reportes'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setVista('reportes')
              }
            >
              Reportes
            </button>

            <button
              type="button"
              className={
                vista ===
                'seguimiento'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setVista(
                  'seguimiento',
                )
              }
            >
              Seguimiento
            </button>

            <button
              type="button"
              className={
                vista === 'cuadrillas'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setVista(
                  'cuadrillas',
                )
              }
            >
              Cuadrillas
            </button>

            <button
              type="button"
              className={
                vista === 'mapa'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setVista('mapa')
              }
            >
              Mapa
            </button>

            <button
              type="button"
              onClick={() =>
                navigate('/')
              }
            >
              Portal ciudadano
            </button>
          </nav>
        </aside>

        <main className="admin-main">
          {vista === 'resumen' && (
            <>
              <section className="admin-welcome">
                <div>
                  <p className="admin-eyebrow">
                    PANEL ADMINISTRATIVO
                  </p>

                  <h1>
                    Gestión de reportes
                  </h1>

                  <p>
                    Consulta, asigna y
                    supervisa los reportes
                    registrados por la
                    ciudadanía.
                  </p>
                </div>

                <div className="admin-date-card">
                  <span>
                    Sesión activa
                  </span>

                  <strong>
                    {usuario.usuario}
                  </strong>
                </div>
              </section>

              <section className="admin-stats">
                <article>
                  <span>
                    Total de reportes
                  </span>

                  <strong>
                    {estadisticas.total}
                  </strong>

                  <small>
                    Registrados en el sistema
                  </small>
                </article>

                <article>
                  <span>
                    Reportados
                  </span>

                  <strong>
                    {estadisticas.reportados}
                  </strong>

                  <small>
                    Pendientes de atención
                  </small>
                </article>

                <article>
                  <span>
                    En proceso
                  </span>

                  <strong>
                    {estadisticas.proceso}
                  </strong>

                  <small>
                    Actualmente en reparación
                  </small>
                </article>

                <article>
                  <span>
                    Atendidos
                  </span>

                  <strong>
                    {estadisticas.atendidos}
                  </strong>

                  <small>
                    Reportes finalizados
                  </small>
                </article>
              </section>
            </>
          )}

          {vista === 'reportes' && (
            <section className="admin-reports">
              <div className="admin-section-header">
                <div>
                  <p className="admin-eyebrow">
                    REPORTES CIUDADANOS
                  </p>

                  <h2>
                    Todos los reportes
                  </h2>
                </div>

                <button
                  onClick={() =>
                    void cargarReportes()
                  }
                >
                  Actualizar
                </button>
              </div>

              {renderTabla(
                reportes,
              )}
            </section>
          )}

          {vista === 'seguimiento' && (
            <section className="admin-reports">
              <div className="admin-section-header">
                <div>
                  <p className="admin-eyebrow">
                    SEGUIMIENTO
                  </p>

                  <h2>
                    Reportes pendientes
                  </h2>
                </div>
              </div>

              {renderTabla(
                reportesSeguimiento,
              )}
            </section>
          )}

          {vista === 'cuadrillas' && (
            <section className="admin-reports">
              <div className="admin-section-header">
                <div>
                  <p className="admin-eyebrow">
                    PERSONAL DE REPARACIÓN
                  </p>

                  <h2>
                    Cuadrillas
                  </h2>
                </div>
              </div>

              {error && (
                <div className="admin-error">
                  {error}
                </div>
              )}

              {mensajeCuadrilla && (
                <div className="admin-success">
                  {mensajeCuadrilla}
                </div>
              )}

              <div className="teams-layout">
                <form
                  className="team-form"
                  onSubmit={
                    crearCuadrilla
                  }
                >
                  <h3>
                    Registrar cuadrilla
                  </h3>

                  <label>
                    Nombre de la cuadrilla

                    <input
                      type="text"
                      value={
                        nuevaCuadrilla.nombre
                      }
                      onChange={(e) =>
                        setNuevaCuadrilla(
                          {
                            ...nuevaCuadrilla,
                            nombre:
                              e.target
                                .value,
                          },
                        )
                      }
                      placeholder="Ej. Cuadrilla Centro"
                      required
                    />
                  </label>

                  <label>
                    Responsable

                    <input
                      type="text"
                      value={
                        nuevaCuadrilla
                          .responsable
                      }
                      onChange={(e) =>
                        setNuevaCuadrilla(
                          {
                            ...nuevaCuadrilla,
                            responsable:
                              e.target
                                .value,
                          },
                        )
                      }
                      placeholder="Nombre del responsable"
                      required
                    />
                  </label>

                  <label>
                    Teléfono

                    <input
                      type="tel"
                      value={
                        nuevaCuadrilla
                          .telefono
                      }
                      onChange={(e) =>
                        setNuevaCuadrilla(
                          {
                            ...nuevaCuadrilla,
                            telefono:
                              e.target
                                .value,
                          },
                        )
                      }
                      placeholder="Opcional"
                    />
                  </label>

                  <button type="submit">
                    Registrar cuadrilla
                  </button>
                </form>

                <div className="team-list">
                  <h3>
                    Cuadrillas disponibles
                  </h3>

                  {cuadrillas.length ===
                  0 ? (
                    <p>
                      No hay cuadrillas
                      registradas.
                    </p>
                  ) : (
                    cuadrillas.map(
                      (cuadrilla) => (
                        <article
                          key={
                            cuadrilla.id
                          }
                          className="team-card"
                        >
                          <div>
                            <span>
                              CUADRILLA
                            </span>

                            <strong>
                              {
                                cuadrilla.nombre
                              }
                            </strong>
                          </div>

                          <p>
                            Responsable:{' '}
                            <b>
                              {
                                cuadrilla.responsable
                              }
                            </b>
                          </p>

                          <p>
                            Teléfono:{' '}
                            {
                              cuadrilla.telefono ||
                              'No registrado'
                            }
                          </p>
                        </article>
                      ),
                    )
                  )}
                </div>
              </div>
            </section>
          )}

          {vista === 'mapa' && (
            <MapaReportes
              reportes={
                reportes
              }
            />
          )}
        </main>
      </div>
    </div>
  );
}

