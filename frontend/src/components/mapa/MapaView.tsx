'use client';

import { useEffect, useState, useCallback } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { API } from '@/lib/api';
import EstadoPasoModal from '@/components/ubicacion/EstadoPasoModal';

interface Ubicacion {
  id: number;
  procesionId: number;
  latitud: string;
  longitud: string;
  estaActiva: boolean;
  updatedAt: string;
  procesion?: {
    id: number;
    nombre: string;
    diaSemana: string;
    hermandad?: { id: number; nombre: string; nombrePopular: string };
  };
}

interface EstadoPaso {
  id: number;
  nombrePaso: string;
  estado: string;
  createdAt: string;
  autor?: { username: string };
}

function formatAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return `hace ${Math.floor(diff)}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`;
  return `hace ${Math.floor(diff / 3600)}h`;
}

function parseToken(): { id: number; rol: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  } catch { return null; }
}

function PulsingMarker() {
  return (
    <div className="relative flex items-center justify-center">
      <div
        className="absolute rounded-full opacity-40 animate-ping"
        style={{ width: 28, height: 28, background: '#7B2D8B' }}
      />
      <div
        className="relative rounded-full border-2 border-white shadow-lg"
        style={{ width: 18, height: 18, background: '#7B2D8B' }}
      />
    </div>
  );
}

export default function MapaView() {
  const [activas, setActivas] = useState<Ubicacion[]>([]);
  const [estados, setEstados] = useState<Record<number, EstadoPaso[]>>({});
  const [openPopup, setOpenPopup] = useState<number | null>(null);
  const [estadoModal, setEstadoModal] = useState<number | null>(null);
  const [user, setUser] = useState<{ id: number; rol: string } | null>(null);

  const fetchActivas = useCallback(async () => {
    try {
      const res = await fetch(`${API}/ubicacion/activas`);
      if (res.ok) setActivas(await res.json());
    } catch {}
  }, []);

  const fetchEstados = useCallback(async (procesionId: number) => {
    try {
      const res = await fetch(`${API}/ubicacion/procesion/${procesionId}/estados`);
      if (res.ok) {
        const data: EstadoPaso[] = await res.json();
        setEstados(prev => ({ ...prev, [procesionId]: data.slice(0, 5) }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    setUser(parseToken());
    fetchActivas();
    const interval = setInterval(fetchActivas, 15000);
    return () => clearInterval(interval);
  }, [fetchActivas]);

  useEffect(() => {
    activas.forEach(u => fetchEstados(u.procesionId));
  }, [activas, fetchEstados]);

  return (
    <div className="relative w-full h-full">
      {/* Stats bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur rounded-2xl shadow-lg px-5 py-2.5 flex items-center gap-3 pointer-events-none">
        <div className="w-3 h-3 rounded-full bg-cofrade-main animate-pulse" />
        <span className="text-sm font-black text-gray-900">
          {activas.length === 0
            ? 'Sin procesiones activas ahora'
            : `${activas.length} procesión${activas.length > 1 ? 'es' : ''} en directo`}
        </span>
      </div>

      <Map
        initialViewState={{ longitude: -5.9845, latitude: 37.3891, zoom: 13 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://tiles.openfreemap.org/styles/liberty"
      >
        {activas.map(u => {
          const lng = parseFloat(u.longitud);
          const lat = parseFloat(u.latitud);
          const nombre =
            u.procesion?.hermandad?.nombrePopular ||
            u.procesion?.hermandad?.nombre ||
            `Procesión #${u.procesionId}`;

          return (
            <div key={u.id}>
              <Marker
                longitude={lng}
                latitude={lat}
                anchor="center"
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setOpenPopup(prev => (prev === u.procesionId ? null : u.procesionId));
                }}
              >
                <PulsingMarker />
              </Marker>

              {openPopup === u.procesionId && (
                <Popup
                  longitude={lng}
                  latitude={lat}
                  anchor="bottom"
                  onClose={() => setOpenPopup(null)}
                  closeOnClick={false}
                  maxWidth="300px"
                >
                  <div className="min-w-[200px] p-1 font-sans">
                    <p className="font-black text-gray-900 text-sm leading-tight">{nombre}</p>
                    <p className="text-xs font-bold mt-0.5" style={{ color: '#7B2D8B' }}>
                      {u.procesion?.nombre}
                    </p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-1">
                      Actualizado {formatAgo(u.updatedAt)}
                    </p>

                    {(estados[u.procesionId] || []).length > 0 && (
                      <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-2">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          Últimas noticias
                        </p>
                        {(estados[u.procesionId] || []).map(e => (
                          <div key={e.id} className="bg-gray-50 rounded-lg p-1.5">
                            <p className="text-xs font-black text-gray-800">{e.nombrePaso}</p>
                            <p className="text-[11px] text-gray-600">{e.estado}</p>
                            <p className="text-[9px] text-gray-400 mt-0.5">
                              {formatAgo(e.createdAt)} · @{e.autor?.username}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {user && (
                      <button
                        onClick={() => {
                          setOpenPopup(null);
                          setEstadoModal(u.procesionId);
                        }}
                        className="mt-3 w-full py-1.5 rounded-xl text-white text-xs font-black transition-colors"
                        style={{ background: '#7B2D8B' }}
                      >
                        + Añadir estado de paso
                      </button>
                    )}
                  </div>
                </Popup>
              )}
            </div>
          );
        })}
      </Map>

      {estadoModal !== null && (
        <EstadoPasoModal
          procesionId={estadoModal}
          onClose={() => setEstadoModal(null)}
          onSaved={() => {
            fetchEstados(estadoModal);
            setEstadoModal(null);
          }}
        />
      )}
    </div>
  );
}
