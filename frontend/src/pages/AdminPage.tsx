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
  cantidadReportes?: number;
  reportesCiudadanos?: ReporteCiudadanoGrupo[];
  cuadrilla: Cuadrilla | null;
  evidencias: Evidencia[];
}

interface ReporteCiudadanoGrupo {
  id: number;
  folio: string;
  descripcion: string;
  fotografia: string | null;
  fechaReporte: string;
  severidad: 'Alta' | 'Media' | 'Baja';
}

type PrioridadReporte =
  | 'Normal'
  | 'Media'
  | 'Alta'
  | 'Urgente';

type OrdenReportes =
  | 'recientes'
  | 'antiguos'
  | 'reportados'
  | 'prioridad'
  | 'afectacion';
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

  const [busqueda, setBusqueda] =
    useState('');

  const [filtroEstado, setFiltroEstado] =
    useState('Todos');

  const [
    filtroAfectacion,
    setFiltroAfectacion,
  ] = useState('Todas');

  const [
    filtroPrioridad,
    setFiltroPrioridad,
  ] = useState('Todas');

  const [
    filtroCantidad,
    setFiltroCantidad,
  ] = useState('Todos');

  const [ordenReportes, setOrdenReportes] =
    useState<OrdenReportes>('recientes');

  const [mensajeCuadrilla, setMensajeCuadrilla] =
    useState('');

  const [nuevaCuadrilla, setNuevaCuadrilla] =
    useState({
      nombre: '',
      responsable: '',
      telefono: '',
    });

  const [
    cuadrillaEditando,
    setCuadrillaEditando,
  ] = useState<number | null>(null);

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

    const editando =
      cuadrillaEditando !== null;

    try {
      const url =
        editando
          ? `${API_URL}/cuadrillas/${cuadrillaEditando}`
          : `${API_URL}/cuadrillas`;

      const respuesta = await fetch(
        url,
        {
          method:
            editando
              ? 'PATCH'
              : 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            nombre:
              nuevaCuadrilla.nombre,

            responsable:
              nuevaCuadrilla.responsable,

            telefono:
              nuevaCuadrilla.telefono ||
              undefined,
          }),
        },
      );

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.message ||
            (
              editando
                ? 'No fue posible modificar la cuadrilla.'
                : 'No fue posible registrar la cuadrilla.'
            ),
        );
      }

      setNuevaCuadrilla({
        nombre: '',
        responsable: '',
        telefono: '',
      });

      setCuadrillaEditando(
        null,
      );

      setMensajeCuadrilla(
        editando
          ? 'Cuadrilla modificada correctamente.'
          : 'Cuadrilla registrada correctamente.',
      );

      await cargarCuadrillas();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al guardar la cuadrilla.',
      );
    }
  };

  const iniciarEdicionCuadrilla = (
    cuadrilla: Cuadrilla,
  ) => {
    setError('');
    setMensajeCuadrilla('');

    setCuadrillaEditando(
      cuadrilla.id,
    );

    setNuevaCuadrilla({
      nombre:
        cuadrilla.nombre,

      responsable:
        cuadrilla.responsable,

      telefono:
        cuadrilla.telefono ?? '',
    });
  };

  const cancelarEdicionCuadrilla = () => {
    setCuadrillaEditando(
      null,
    );

    setNuevaCuadrilla({
      nombre: '',
      responsable: '',
      telefono: '',
    });

    setError('');
  };

  const eliminarCuadrilla = async (
    cuadrilla: Cuadrilla,
  ) => {
    if (!token) {
      return;
    }

    const confirmar =
      window.confirm(
        `¿Deseas eliminar la cuadrilla "${cuadrilla.nombre}"?`,
      );

    if (!confirmar) {
      return;
    }

    setError('');
    setMensajeCuadrilla('');

    try {
      const respuesta =
        await fetch(
          `${API_URL}/cuadrillas/${cuadrilla.id}/baja`,
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
          datos.message ||
            'No fue posible eliminar la cuadrilla.',
        );
      }

      if (
        cuadrillaEditando ===
        cuadrilla.id
      ) {
        cancelarEdicionCuadrilla();
      }

      setMensajeCuadrilla(
        'Cuadrilla eliminada correctamente.',
      );

      await cargarCuadrillas();
      await cargarReportes();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al eliminar la cuadrilla.',
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

  const cantidadReportesDe = (
    reporte: Reporte,
  ): number => {
    return Math.max(
      1,
      reporte.cantidadReportes ??
        reporte.reportesCiudadanos?.length ??
        1,
    );
  };

  const obtenerPrioridad = (
    reporte: Reporte,
  ): PrioridadReporte => {
    const cantidad =
      cantidadReportesDe(reporte);

    if (cantidad >= 7) {
      return 'Urgente';
    }

    if (cantidad >= 4) {
      return 'Alta';
    }

    if (cantidad >= 2) {
      return 'Media';
    }

    return 'Normal';
  };

  const textoAfectacion = (
    severidad: Reporte['severidad'],
  ): string => {
    switch (severidad) {
      case 'Alta':
        return 'Crítica';

      case 'Media':
        return 'Moderada';

      case 'Baja':
        return 'Leve';

      default:
        return severidad;
    }
  };

  const normalizarBusqueda = (
    valor?: string | null,
  ): string => {
    return (valor ?? '')
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )
      .toLowerCase()
      .trim();
  };

  const pesoPrioridad = (
    prioridad: PrioridadReporte,
  ): number => {
    switch (prioridad) {
      case 'Urgente':
        return 4;

      case 'Alta':
        return 3;

      case 'Media':
        return 2;

      default:
        return 1;
    }
  };

  const pesoAfectacion = (
    severidad: Reporte['severidad'],
  ): number => {
    switch (severidad) {
      case 'Alta':
        return 3;

      case 'Media':
        return 2;

      default:
        return 1;
    }
  };

  const reportesFiltrados =
    useMemo(() => {
      const termino =
        normalizarBusqueda(busqueda);

      const filtrados =
        reportes.filter((reporte) => {
          const cantidad =
            cantidadReportesDe(
              reporte,
            );

          const prioridad =
            obtenerPrioridad(
              reporte,
            );

          const textosGrupo =
            reporte.reportesCiudadanos
              ?.flatMap(
                (ciudadano) => [
                  ciudadano.folio,
                  ciudadano.descripcion,
                ],
              )
              .join(' ') ?? '';

          const textoBusqueda =
            normalizarBusqueda(
              [
                reporte.folio,
                reporte.calle,
                reporte.entreCalles,
                reporte.colonia,
                reporte.descripcion,
                textosGrupo,
              ]
                .filter(Boolean)
                .join(' '),
            );

          const coincideBusqueda =
            !termino ||
            textoBusqueda.includes(
              termino,
            );

          const coincideEstado =
            filtroEstado === 'Todos' ||
            reporte.estado ===
              filtroEstado;

          const coincideAfectacion =
            filtroAfectacion ===
              'Todas' ||
            textoAfectacion(
              reporte.severidad,
            ) === filtroAfectacion;

          const coincidePrioridad =
            filtroPrioridad ===
              'Todas' ||
            prioridad ===
              filtroPrioridad;

          let coincideCantidad =
            true;

          if (
            filtroCantidad === '2+'
          ) {
            coincideCantidad =
              cantidad >= 2;
          }

          if (
            filtroCantidad === '4+'
          ) {
            coincideCantidad =
              cantidad >= 4;
          }

          if (
            filtroCantidad === '7+'
          ) {
            coincideCantidad =
              cantidad >= 7;
          }

          return (
            coincideBusqueda &&
            coincideEstado &&
            coincideAfectacion &&
            coincidePrioridad &&
            coincideCantidad
          );
        });

      return [...filtrados].sort(
        (a, b) => {
          switch (ordenReportes) {
            case 'antiguos':
              return (
                new Date(
                  a.fechaReporte,
                ).getTime() -
                new Date(
                  b.fechaReporte,
                ).getTime()
              );

            case 'reportados':
              return (
                cantidadReportesDe(b) -
                cantidadReportesDe(a)
              );

            case 'prioridad':
              return (
                pesoPrioridad(
                  obtenerPrioridad(b),
                ) -
                pesoPrioridad(
                  obtenerPrioridad(a),
                )
              );

            case 'afectacion':
              return (
                pesoAfectacion(
                  b.severidad,
                ) -
                pesoAfectacion(
                  a.severidad,
                )
              );

            default:
              return (
                new Date(
                  b.fechaReporte,
                ).getTime() -
                new Date(
                  a.fechaReporte,
                ).getTime()
              );
          }
        },
      );
    }, [
      reportes,
      busqueda,
      filtroEstado,
      filtroAfectacion,
      filtroPrioridad,
      filtroCantidad,
      ordenReportes,
    ]);

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
    reportesFiltrados.filter(
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
                <th>Reportes</th>
                <th>Afectación</th>
                <th>Prioridad</th>
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
                    <details className="grouped-reports">
                      <summary>
                        <strong>
                          {cantidadReportesDe(
                            reporte,
                          )}
                        </strong>{' '}
                        {cantidadReportesDe(
                          reporte,
                        ) === 1
                          ? 'reporte'
                          : 'reportes'}
                      </summary>

                      <div className="grouped-reports-list">
                        {(
                          reporte.reportesCiudadanos ??
                          []
                        ).map(
                          (
                            ciudadano,
                            indice,
                          ) => (
                            <article
                              key={
                                ciudadano.id
                              }
                              className="grouped-report-item"
                            >
                              <div className="grouped-report-head">
                                <strong>
                                  Reporte{' '}
                                  {indice + 1}
                                </strong>

                                <span>
                                  {
                                    ciudadano.folio
                                  }
                                </span>
                              </div>

                              <p>
                                {
                                  ciudadano.descripcion
                                }
                              </p>

                              <small>
                                Afectación:{' '}
                                {textoAfectacion(
                                  ciudadano.severidad,
                                )}
                              </small>

                              <small>
                                {new Date(
                                  ciudadano.fechaReporte,
                                ).toLocaleDateString(
                                  'es-MX',
                                )}
                              </small>
                            </article>
                          ),
                        )}
                      </div>
                    </details>
                  </td>

                  <td>
                    <span
                      className={`severity severity-${reporte.severidad.toLowerCase()}`}
                    >
                      {textoAfectacion(
                        reporte.severidad,
                      )}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`priority-badge priority-${obtenerPrioridad(
                        reporte,
                      ).toLowerCase()}`}
                    >
                      {obtenerPrioridad(
                        reporte,
                      )}
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
                        Pendiente
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
              Monitoreo
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
                  <span>Reportados</span>
                  <strong>
                    {estadisticas.reportados}
                  </strong>
                  <small>
                    <span className="admin-indicador-descripcion">Recibidos en el sistema</span>
                  </small>
                </article>

                <article>
                  <span>Pendientes</span>
                  <strong>
                    {estadisticas.proceso}
                  </strong>
                  <small>
                    <span className="admin-indicador-descripcion">En atención</span>
                  </small>
                </article>

                <article>
                  <span>Atendidos</span>
                  <strong>
                    {estadisticas.atendidos}
                  </strong>
                  <small>
                    <span className="admin-indicador-descripcion">Reportes finalizados</span>
                  </small>
                </article>

                <article>
                  <span>Total de reportes</span>
                  <strong>
                    {estadisticas.total}
                  </strong>
                  <small>
                    <span className="admin-indicador-descripcion">Registrados en el sistema</span>
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
                    BACHES REGISTRADOS
                  </p>

                  <h2>
                    Reportes agrupados por bache
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

              <div className="report-filter-panel">
                <div className="report-search-box">
                  <label htmlFor="buscar-reportes">
                    Buscar reporte
                  </label>

                  <input
                    id="buscar-reportes"
                    type="search"
                    value={busqueda}
                    onChange={(evento) =>
                      setBusqueda(
                        evento.target.value,
                      )
                    }
                    placeholder="Folio, calle, colonia o descripción..."
                  />
                </div>

                <div className="report-filter-grid">
                  <label>
                    <span>Estado</span>
                    <select
                      value={filtroEstado}
                      onChange={(evento) =>
                        setFiltroEstado(
                          evento.target.value,
                        )
                      }
                    >
                      <option value="Todos">
                        Todos
                      </option>
                      <option value="Reportado">
                        Reportado
                      </option>
                      <option value="En Proceso">
                        Pendiente
                      </option>
                      <option value="Atendido">
                        Atendido
                      </option>
                    </select>
                  </label>

                  <label>
                    <span>Afectación</span>
                    <select
                      value={filtroAfectacion}
                      onChange={(evento) =>
                        setFiltroAfectacion(
                          evento.target.value,
                        )
                      }
                    >
                      <option value="Todas">
                        Todas
                      </option>
                      <option value="Leve">
                        Leve
                      </option>
                      <option value="Moderada">
                        Moderada
                      </option>
                      <option value="Crítica">
                        Crítica
                      </option>
                    </select>
                  </label>

                  <label>
                    <span>Prioridad</span>
                    <select
                      value={filtroPrioridad}
                      onChange={(evento) =>
                        setFiltroPrioridad(
                          evento.target.value,
                        )
                      }
                    >
                      <option value="Todas">
                        Todas
                      </option>
                      <option value="Normal">
                        Normal
                      </option>
                      <option value="Media">
                        Media
                      </option>
                      <option value="Alta">
                        Alta
                      </option>
                      <option value="Urgente">
                        Urgente
                      </option>
                    </select>
                  </label>

                  <label>
                    <span>Reportes recibidos</span>
                    <select
                      value={filtroCantidad}
                      onChange={(evento) =>
                        setFiltroCantidad(
                          evento.target.value,
                        )
                      }
                    >
                      <option value="Todos">
                        Todos
                      </option>
                      <option value="2+">
                        2 o más
                      </option>
                      <option value="4+">
                        4 o más
                      </option>
                      <option value="7+">
                        7 o más
                      </option>
                    </select>
                  </label>

                  <label>
                    <span>Ordenar por</span>
                    <select
                      value={ordenReportes}
                      onChange={(evento) =>
                        setOrdenReportes(
                          evento.target
                            .value as OrdenReportes,
                        )
                      }
                    >
                      <option value="recientes">
                        Más recientes
                      </option>
                      <option value="antiguos">
                        Más antiguos
                      </option>
                      <option value="reportados">
                        Más reportados
                      </option>
                      <option value="prioridad">
                        Mayor prioridad
                      </option>
                      <option value="afectacion">
                        Mayor afectación
                      </option>
                    </select>
                  </label>
                </div>

                <div className="report-filter-footer">
                  <div>
                    <strong>
                      {reportesFiltrados.length}
                    </strong>{' '}
                    {reportesFiltrados.length === 1
                      ? 'bache encontrado'
                      : 'baches encontrados'}

                    <span>
                      {' · '}
                      {reportesFiltrados.reduce(
                        (total, reporte) =>
                          total +
                          cantidadReportesDe(
                            reporte,
                          ),
                        0,
                      )}{' '}
                      reportes ciudadanos
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setBusqueda('');
                      setFiltroEstado('Todos');
                      setFiltroAfectacion('Todas');
                      setFiltroPrioridad('Todas');
                      setFiltroCantidad('Todos');
                      setOrdenReportes(
                        'recientes',
                      );
                    }}
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>

              {renderTabla(
                reportesFiltrados,
              )}
            </section>
          )}

          {vista === 'seguimiento' && (
            <section className="admin-reports">
              <div className="admin-section-header">
                <div>
                  <p className="admin-eyebrow">
                    MONITOREO
                  </p>

                  <h2>
                    Baches pendientes
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
                          <div className="team-card-actions">
                            <button
                              type="button"
                              className="team-edit-button"
                              onClick={() =>
                                iniciarEdicionCuadrilla(
                                  cuadrilla,
                                )
                              }
                            >
                              Modificar
                            </button>

                            <button
                              type="button"
                              className="team-delete-button"
                              onClick={() =>
                                void eliminarCuadrilla(
                                  cuadrilla,
                                )
                              }
                            >
                              Eliminar
                            </button>
                          </div>
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












