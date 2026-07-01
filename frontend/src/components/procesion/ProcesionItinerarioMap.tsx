'use client';

import { useRef, useEffect, useMemo } from 'react';
import Map, { Marker, Source, Layer, MapRef } from 'react-map-gl/maplibre';
import type { LayerProps } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface PuntoGps {
  id: number;
  orden: number;
  nombreLugar: string;
  latitud: number | string;
  longitud: number | string;
}

const routeLineLayer: LayerProps = {
  id: 'procesion-itinerario-line',
  type: 'line',
  paint: {
    'line-color': '#4A148C',
    'line-width': 4,
    'line-opacity': 0.85,
  },
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
};

function esCoordenadaValida(lat: number | string, lng: number | string) {
  const la = Number(lat);
  const lo = Number(lng);
  return Number.isFinite(la) && Number.isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180;
}

export default function ProcesionItinerarioMap({ puntos }: { puntos: PuntoGps[] }) {
  const mapRef = useRef<MapRef>(null);

  const puntosValidos = useMemo(
    () =>
      [...puntos]
        .filter((p) => esCoordenadaValida(p.latitud, p.longitud))
        .sort((a, b) => a.orden - b.orden),
    [puntos],
  );

  const routeGeoJson = useMemo(() => {
    if (puntosValidos.length < 2) return null;
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: puntosValidos.map((p) => [Number(p.longitud), Number(p.latitud)]),
      },
    };
  }, [puntosValidos]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || puntosValidos.length === 0) return;

    const lngs = puntosValidos.map((p) => Number(p.longitud));
    const lats = puntosValidos.map((p) => Number(p.latitud));

    if (puntosValidos.length === 1) {
      map.flyTo({
        center: [lngs[0], lats[0]],
        zoom: 15,
        duration: 600,
      });
      return;
    }

    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 48, maxZoom: 16, duration: 800 },
    );
  }, [puntosValidos]);

  if (puntosValidos.length === 0) return null;

  return (
    <div className="h-64 md:h-80 rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: -4.0574, latitude: 38.0374, zoom: 14 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://tiles.openfreemap.org/styles/liberty"
      >
        {routeGeoJson && (
          <Source id="procesion-route" type="geojson" data={routeGeoJson}>
            <Layer {...routeLineLayer} />
          </Source>
        )}

        {puntosValidos.map((p, i) => (
          <Marker
            key={p.id}
            longitude={Number(p.longitud)}
            latitude={Number(p.latitud)}
            anchor="center"
          >
            <div
              className={`flex items-center justify-center rounded-full border-2 border-white shadow-md font-black text-white ${
                i === 0
                  ? 'w-6 h-6 text-[9px] bg-green-500'
                  : i === puntosValidos.length - 1
                    ? 'w-6 h-6 text-[9px] bg-red-500'
                    : 'w-5 h-5 text-[8px] bg-cofrade-main'
              }`}
            >
              {i === 0 ? 'A' : i === puntosValidos.length - 1 ? 'B' : i + 1}
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
