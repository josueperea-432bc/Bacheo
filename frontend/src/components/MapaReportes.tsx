import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapaReportes.css';

interface ReporteMapa {
  id: number;
  folio: string;
  latitud: number | string | null;
  longitud: number | string | null;
  calle: string | null;
  colonia: string | null;
  descripcion: string;
  severidad: string;
  estado: string;
}

interface Props {
  reportes: ReporteMapa[];
}

export default function MapaReportes({ reportes }: Props) {
  const reportesConGps = reportes.filter((reporte) => {
    const lat = Number(reporte.latitud);
    const lng = Number(reporte.longitud);

    return (
      reporte.latitud !== null &&
      reporte.longitud !== null &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    );
  });

  const colorEstado = (estado: string) => {
    if (estado === 'Atendido') {
      return '#235b4e';
    }

    if (estado === 'En Proceso') {
      return '#a57f2c';
    }

    return '#611232';
  };

  return (
    <section className="map-panel">
      <div className="map-panel-header">
        <div>
          <p className="admin-eyebrow">UBICACIÓN DE REPORTES</p>
          <h2>Mapa de baches registrados</h2>
          <p>
            Se muestran los reportes que cuentan con coordenadas GPS.
          </p>
        </div>

        <div className="map-count">
          <strong>{reportesConGps.length}</strong>
          <span>con ubicación GPS</span>
        </div>
      </div>

      <MapContainer
        center={[19.5438, -96.9102]}
        zoom={13}
        scrollWheelZoom
        className="reports-map"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {reportesConGps.map((reporte) => (
          <CircleMarker
            key={reporte.id}
            center={[
              Number(reporte.latitud),
              Number(reporte.longitud),
            ]}
            radius={10}
            pathOptions={{
              color: colorEstado(reporte.estado),
              fillColor: colorEstado(reporte.estado),
              fillOpacity: 0.8,
            }}
          >
            <Popup>
              <div className="map-popup">
                <strong>{reporte.folio}</strong>

                <p>
                  {reporte.calle || 'Ubicación GPS'}
                  {reporte.colonia
                    ? `, ${reporte.colonia}`
                    : ''}
                </p>

                <p>
                  <b>Severidad:</b> {reporte.severidad}
                </p>

                <p>
                  <b>Estado:</b> {reporte.estado}
                </p>

                <p>{reporte.descripcion}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {reportesConGps.length === 0 && (
        <p className="map-empty">
          Todavía no hay reportes con coordenadas GPS.
        </p>
      )}

      <div className="map-legend">
        <span>
          <i className="legend-reportado"></i>
          Reportado
        </span>

        <span>
          <i className="legend-proceso"></i>
          En Proceso
        </span>

        <span>
          <i className="legend-atendido"></i>
          Atendido
        </span>
      </div>
    </section>
  );
}
