'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Map, { Marker, Popup, MapRef } from 'react-map-gl/maplibre';
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
  const mapRef = useRef<MapRef>(null);
  const mapReadyRef = useRef(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
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

  const watchIdRef = useRef<number | null>(null);

  const flyToUser = useCallback((coords: [number, number]) => {
    mapRef.current?.flyTo({ center: coords, zoom: 15, duration: 1200 });
  }, []);

  const handleLocate = useCallback(() => {
    console.log('[geo] isSecureContext:', window.isSecureContext, '| geolocation:', !!navigator.geolocation);
    if (!navigator.geolocation) {
      console.warn('[geo] navigator.geolocation no disponible');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        setUserPos(coords);
        flyToUser(coords);
        if (watchIdRef.current === null) {
          watchIdRef.current = navigator.geolocation.watchPosition(p => {
            setUserPos([p.coords.longitude, p.coords.latitude]);
          });
        }
      },
      err => {
        console.error('[geo] error:', err.code, err.message);
        const msg = err.code === 1
          ? 'Permiso de ubicación denegado'
          : 'No se pudo obtener la ubicación. Activa los Servicios de ubicación en Windows (Configuración → Privacidad → Ubicación)';
        setGeoError(msg);
        setTimeout(() => setGeoError(null), 5000);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }, [flyToUser]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const handleMapLoad = useCallback(() => {
    mapReadyRef.current = true;
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

      {geoError && (
        <div className="absolute bottom-20 right-4 z-10 bg-red-600 text-white text-xs font-semibold rounded-xl shadow-lg px-3 py-2 max-w-[220px] text-center">
          {geoError}
        </div>
      )}

      <button
        onClick={userPos ? () => flyToUser(userPos) : handleLocate}
        className="absolute bottom-8 right-4 z-10 bg-white rounded-full shadow-lg p-3 hover:bg-gray-50 active:scale-95 transition-transform"
        title="Ir a mi ubicación"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-cofrade-main" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7zm0 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
        </svg>
      </button>

      <Map
        ref={mapRef}
        initialViewState={{ longitude: -5.9845, latitude: 37.3891, zoom: 13 }}
        onLoad={handleMapLoad}
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

        {userPos && (
          <Marker longitude={userPos[0]} latitude={userPos[1]} anchor="center">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md" />
          </Marker>
        )}
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
