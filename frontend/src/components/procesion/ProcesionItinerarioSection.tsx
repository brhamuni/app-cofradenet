'use client';

import { MapPin } from 'lucide-react';
import ProcesionItinerarioMap, { type PuntoGps } from './ProcesionItinerarioMap';

interface Props {
  puntos: PuntoGps[];
  recorrido?: string | null;
  anioItinerario?: number | null;
}

function tieneCoordenadas(puntos: PuntoGps[]) {
  return puntos.some(
    (p) =>
      Number.isFinite(Number(p.latitud)) &&
      Number.isFinite(Number(p.longitud)),
  );
}

export default function ProcesionItinerarioSection({
  puntos,
  recorrido,
  anioItinerario,
}: Props) {
  const texto = recorrido?.trim() ?? '';
  const tieneMapa = tieneCoordenadas(puntos);
  const tieneTexto = texto.length > 0;
  const puntosOrdenados = [...puntos].sort((a, b) => a.orden - b.orden);

  if (!tieneMapa && !tieneTexto) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
        <MapPin size={36} className="mb-3 opacity-40" />
        <p className="text-sm font-bold">Itinerario no publicado aún</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {tieneMapa && (
        <div>
          {tieneTexto && (
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
              Mapa del recorrido
            </h3>
          )}
          <ProcesionItinerarioMap puntos={puntos} />
          {puntosOrdenados.length > 0 && (
            <ol className="mt-4 space-y-2">
              {puntosOrdenados.map((punto) => (
                <li key={punto.id} className="flex items-center gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-cofrade-main text-white text-xs font-black flex items-center justify-center">
                    {punto.orden}
                  </span>
                  <MapPin size={14} className="shrink-0 text-cofrade-main" />
                  <span className="flex-1 text-sm font-bold text-gray-800">
                    {punto.nombreLugar}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {tieneTexto && (
        <div>
          {tieneMapa && (
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
              Itinerario {anioItinerario ? `(${anioItinerario})` : ''}
            </h3>
          )}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">
              {texto}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
