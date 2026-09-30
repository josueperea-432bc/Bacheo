import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { API_URL } from '../config';
import './ReporteForm.css';

type Severidad = 'Baja' | 'Media' | 'Alta';

interface FormularioReporte {
  telefono: string;
  correo: string;
  latitud?: number;
  longitud?: number;
  calle: string;
  entreCalles: string;
  colonia: string;
  descripcion: string;
  severidad: Severidad;
}

interface RespuestaReporte {
  id: number;
  folio: string;
  estado: string;
}

interface RespuestaFotografia {
  nombre: string;
  ruta: string;
  url: string;
}

export default function ReporteForm() {
  const [formulario, setFormulario] =
    useState<FormularioReporte>({
      telefono: '',
      correo: '',
      calle: '',
      entreCalles: '',
      colonia: '',
      descripcion: '',
      severidad: 'Media',
    });

  const [foto, setFoto] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [folio, setFolio] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!foto) {
      setVistaPrevia('');
      return;
    }

    const url = URL.createObjectURL(foto);
    setVistaPrevia(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [foto]);

  const actualizarCampo = (
    campo: keyof FormularioReporte,
    valor: string | number,
  ) => {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const obtenerUbicacion = () => {
    setMensaje('');

    if (!navigator.geolocation) {
      setMensaje(
        'Tu dispositivo no permite obtener la ubicación.',
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setFormulario((anterior) => ({
          ...anterior,
          latitud: posicion.coords.latitude,
          longitud: posicion.coords.longitude,
        }));

        setMensaje(
          'Ubicación obtenida correctamente.',
        );
      },
      () => {
        setMensaje(
          'No fue posible obtener la ubicación. Puedes capturar la dirección manualmente.',
        );
      },
    );
  };

  const seleccionarFoto = (archivo?: File) => {
    setMensaje('');

    if (!archivo) {
      setFoto(null);
      return;
    }

    const tiposPermitidos = [
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (!tiposPermitidos.includes(archivo.type)) {
      setFoto(null);
      setMensaje(
        'La fotografía debe estar en formato JPG, JPEG o PNG.',
      );
      return;
    }

    if (archivo.size > 8 * 1024 * 1024) {
      setFoto(null);
      setMensaje(
        'La fotografía no debe superar los 8 MB.',
      );
      return;
    }

    setFoto(archivo);
  };

  const subirFotografia =
    async (): Promise<string | undefined> => {
      if (!foto) {
        return undefined;
      }

      const datosFoto = new FormData();

      datosFoto.append(
        'fotografia',
        foto,
      );

      const respuestaFoto = await fetch(
        `${API_URL}/reportes/fotografia`,
        {
          method: 'POST',
          body: datosFoto,
        },
      );

      if (!respuestaFoto.ok) {
        throw new Error(
          'No fue posible guardar la fotografía.',
        );
      }

      const fotografiaGuardada:
        RespuestaFotografia =
        await respuestaFoto.json();

      return fotografiaGuardada.ruta;
    };

  const enviarReporte = async (
    evento: FormEvent<HTMLFormElement>,
  ) => {
    evento.preventDefault();

    setMensaje('');
    setFolio('');

    if (formulario.descripcion.trim().length === 0) {
      setMensaje(
        'Debes escribir una descripción del bache.',
      );
      return;
    }

    if (!foto) {
      setMensaje(
        'Debes adjuntar una fotografía del bache.',
      );
      return;
    }

    const tieneGps =
      formulario.latitud !== undefined &&
      formulario.longitud !== undefined;

    const tieneDireccion =
      formulario.calle.trim() !== '' &&
      formulario.colonia.trim() !== '';

    if (!tieneGps && !tieneDireccion) {
      setMensaje(
        'Debes proporcionar la ubicación por GPS o mediante calle y colonia.',
      );
      return;
    }

    try {
      setEnviando(true);

      const rutaFotografia =
        await subirFotografia();

      const respuesta = await fetch(
        `${API_URL}/reportes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            telefono:
              formulario.telefono || undefined,

            correo:
              formulario.correo || undefined,

            latitud:
              formulario.latitud,

            longitud:
              formulario.longitud,

            calle:
              formulario.calle || undefined,

            entreCalles:
              formulario.entreCalles || undefined,

            colonia:
              formulario.colonia || undefined,

            descripcion:
              formulario.descripcion,

            severidad:
              formulario.severidad,

            fotografia:
              rutaFotografia,
          }),
        },
      );

      if (!respuesta.ok) {
        const datosError =
          await respuesta.json();

        throw new Error(
          datosError.message ||
            'No fue posible registrar el reporte.',
        );
      }

      const datos: RespuestaReporte =
        await respuesta.json();

      setFolio(datos.folio);

      setMensaje(
        'Tu reporte fue registrado correctamente. Conserva tu folio para consultar su avance.',
      );

      setFormulario({
        telefono: '',
        correo: '',
        calle: '',
        entreCalles: '',
        colonia: '',
        descripcion: '',
        severidad: 'Media',
      });

      setFoto(null);
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : 'Ocurrió un problema al registrar el reporte.',
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section
      className="report-form-section"
      id="formulario-reporte"
    >
      <div className="report-form-header">
        <p className="eyebrow">
          REPORTE CIUDADANO
        </p>

        <h2>Registrar un bache</h2>

        <p>
          Proporciona la ubicación y las características
          de la afectación. Los datos de contacto son
          opcionales.
        </p>
      </div>

      <form
        className="report-form"
        onSubmit={enviarReporte}
      >
        <fieldset>
          <legend>
            1. Ubicación del bache
          </legend>

          <button
            type="button"
            className="gps-button"
            onClick={obtenerUbicacion}
          >
            Usar mi ubicación actual
          </button>

          {formulario.latitud !== undefined &&
            formulario.longitud !== undefined && (
              <p className="location-result">
                Ubicación registrada:{' '}
                {formulario.latitud.toFixed(6)},{' '}
                {formulario.longitud.toFixed(6)}
              </p>
            )}

          <div className="form-grid">
            <label>
              Calle
              <input
                type="text"
                value={formulario.calle}
                onChange={(e) =>
                  actualizarCampo(
                    'calle',
                    e.target.value,
                  )
                }
                maxLength={150}
              />
            </label>

            <label>
              Entre calles
              <input
                type="text"
                value={formulario.entreCalles}
                onChange={(e) =>
                  actualizarCampo(
                    'entreCalles',
                    e.target.value,
                  )
                }
                maxLength={200}
              />
            </label>

            <label>
              Colonia
              <input
                type="text"
                value={formulario.colonia}
                onChange={(e) =>
                  actualizarCampo(
                    'colonia',
                    e.target.value,
                  )
                }
                maxLength={150}
              />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            2. Evidencia y características del daño
          </legend>

          <label>
            Fotografía del bache
            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={(e) =>
                seleccionarFoto(
                  e.target.files?.[0],
                )
              }
            />
          </label>

          {foto && (
            <p className="selected-file">
              Archivo seleccionado: {foto.name}
            </p>
          )}

          {vistaPrevia && (
            <div className="photo-preview">
              <span>Vista previa</span>

              <img
                src={vistaPrevia}
                alt="Vista previa del bache"
              />

              <button
                type="button"
                onClick={() => setFoto(null)}
              >
                Quitar fotografía
              </button>
            </div>
          )}

          <label>
            Descripción del bache
            <textarea
              value={formulario.descripcion}
              onChange={(e) =>
                actualizarCampo(
                  'descripcion',
                  e.target.value,
                )
              }
              maxLength={250}
              required
              rows={5}
              placeholder="Describe brevemente el tamaño, ubicación o afectación observada."
            />

            <span className="character-count">
              {formulario.descripcion.length}/250
            </span>
          </label>

          <div className="severity-block">
            <span>Nivel de severidad</span>

            <div className="severity-options">
              {(
                [
                  'Baja',
                  'Media',
                  'Alta',
                ] as Severidad[]
              ).map((nivel) => (
                <label key={nivel}>
                  <input
                    type="radio"
                    name="severidad"
                    value={nivel}
                    checked={
                      formulario.severidad === nivel
                    }
                    onChange={() =>
                      actualizarCampo(
                        'severidad',
                        nivel,
                      )
                    }
                  />

                  {nivel}
                </label>
              ))}
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            3. Datos de contacto opcionales
          </legend>

          <div className="form-grid">
            <label>
              Teléfono
              <input
                type="tel"
                value={formulario.telefono}
                onChange={(e) =>
                  actualizarCampo(
                    'telefono',
                    e.target.value,
                  )
                }
                maxLength={20}
              />
            </label>

            <label>
              Correo electrónico
              <input
                type="email"
                value={formulario.correo}
                onChange={(e) =>
                  actualizarCampo(
                    'correo',
                    e.target.value,
                  )
                }
                maxLength={150}
              />
            </label>
          </div>
        </fieldset>

        {mensaje && (
          <div
            className={
              folio
                ? 'form-success'
                : 'form-message'
            }
          >
            {mensaje}

            {folio && (
              <div className="generated-folio">
                <span>
                  Folio de seguimiento
                </span>

                <strong>{folio}</strong>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          className="submit-report"
          disabled={enviando}
        >
          {enviando
            ? 'Registrando reporte...'
            : 'Enviar reporte'}
        </button>
      </form>
    </section>
  );
}

