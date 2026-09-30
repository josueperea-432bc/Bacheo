import { useState } from 'react';
import type { FormEvent } from 'react';
import { API_URL } from '../config';
import './ConsultaReporte.css';

interface Reporte {
  folio: string;
  calle: string | null;
  colonia: string | null;
  descripcion: string;
  severidad: string;
  estado: 'Reportado' | 'En Proceso' | 'Atendido';
  fechaReporte: string;
  fechaAtencion: string | null;
  fotografia: string | null;
}

export default function ConsultaReporte() {
  const [folio, setFolio] = useState('');
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const consultar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const folioLimpio = folio.trim().toUpperCase();

    if (!folioLimpio) {
      setMensaje('Ingresa el folio de tu reporte.');
      setReporte(null);
      return;
    }

    try {
      setCargando(true);
      setMensaje('');
      setReporte(null);

      const respuesta = await fetch(
        `${API_URL}/reportes/consulta/${encodeURIComponent(
          folioLimpio,
        )}`,
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.message || 'No se encontró el reporte.',
        );
      }

      setReporte(datos);
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : 'No fue posible consultar el reporte.',
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="consult-panel" id="consultar">
      <p className="eyebrow">SEGUIMIENTO</p>
      <h2>Consulta el estado de tu reporte</h2>

      <form className="folio-search" onSubmit={consultar}>
        <input
          type="text"
          value={folio}
          onChange={(e) => setFolio(e.target.value)}
          placeholder="Ej. BCH-2026-0005"
          aria-label="Folio del reporte"
        />

        <button type="submit" disabled={cargando}>
          {cargando ? 'Consultando...' : 'Consultar'}
        </button>
      </form>

      <p className="help-text">
        Captura el folio que recibiste al registrar tu solicitud.
      </p>

      {mensaje && (
        <div className="consulta-error">
          {mensaje}
        </div>
      )}

      {reporte && (
        <div className="consulta-resultado">
          <div className="resultado-header">
            <span>Folio</span>
            <strong>{reporte.folio}</strong>
          </div>

          <div className="estado-actual">
            <span>Estado actual</span>
            <strong>{reporte.estado}</strong>
          </div>

          <div className="estado-pasos">
            <div
              className={
                reporte.estado === 'Reportado' ||
                reporte.estado === 'En Proceso' ||
                reporte.estado === 'Atendido'
                  ? 'paso activo'
                  : 'paso'
              }
            >
              <span>1</span>
              <strong>Reportado</strong>
            </div>

            <div
              className={
                reporte.estado === 'En Proceso' ||
                reporte.estado === 'Atendido'
                  ? 'paso activo'
                  : 'paso'
              }
            >
              <span>2</span>
              <strong>En Proceso</strong>
            </div>

            <div
              className={
                reporte.estado === 'Atendido'
                  ? 'paso activo'
                  : 'paso'
              }
            >
              <span>3</span>
              <strong>Atendido</strong>
            </div>
          </div>

          <div className="resultado-datos">
            <p>
              <span>Ubicación</span>
              <strong>
                {reporte.calle || 'Ubicación GPS'}
                {reporte.colonia
                  ? `, ${reporte.colonia}`
                  : ''}
              </strong>
            </p>

            <p>
              <span>Severidad</span>
              <strong>{reporte.severidad}</strong>
            </p>

            <p>
              <span>Descripción</span>
              <strong>{reporte.descripcion}</strong>
            </p>
          </div>

          {reporte.fotografia && (
            <div className="reporte-fotografia">
              <span>Evidencia fotográfica</span>

              <img
                src={`${API_URL}/${reporte.fotografia}`}
                alt={`Fotografía del reporte ${reporte.folio}`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

