'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Map, { Marker, Popup, MapRef } from 'react-map-gl/maplibre';
import { RefreshCw, Maximize2, Minimize2, SlidersHorizontal, MapPin, Navigation } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { API } from '@/lib/api';
import { parseTokenFromStorage } from '@/lib/jwt';
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

function haversineMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistancia(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function formatAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return `hace ${Math.floor(diff)}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  return `hace ${Math.floor(diff / 3600)} h`;
}


function PulsingMarker({ selected }: { selected?: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      <div
        className="absolute rounded-full animate-ping"
        style={{
          width: selected ? 44 : 32, height: selected ? 44 : 32,
          background: selected ? 'rgba(74,20,140,0.35)' : 'rgba(74,20,140,0.25)',
        }}
      />
      <div
        className="relative rounded-full border-[3px] border-white shadow-lg"
        style={{ width: selected ? 26 : 20, height: selected ? 26 : 20, background: '#4A148C' }}
      />
    </div>
  );
}

const SELECT_CLS = 'w-full text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-cofrade-main focus:bg-white transition-colors cursor-pointer';

export default function MapaView() {
  const mapRef = useRef<MapRef>(null);
  const watchIdRef = useRef<number | null>(null);

  const [expandido, setExpandido] = useState(false);
  const [filtrosVisibles, setFiltrosVisibles] = useState(true);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [activas, setActivas] = useState<Ubicacion[]>([]);
  const [estados, setEstados] = useState<Record<number, EstadoPaso[]>>({});
  const [openPopup, setOpenPopup] = useState<number | null>(null);
  const [estadoModal, setEstadoModal] = useState<number | null>(null);
  const [user, setUser] = useState<{ id: number; rol: string } | null>(null);
  const [filterDia, setFilterDia] = useState('');
  const [filterHermandad, setFilterHermandad] = useState('');
  const [radioCercanas, setRadioCercanas] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /* ── Derivados ───────────────────────────────────────────────── */
  const diasDisponibles = useMemo(() =>
    [...new Set(activas.map(u => u.procesion?.diaSemana).filter(Boolean) as string[])].sort(),
    [activas]);

  const hermandadesDisponibles = useMemo(() =>
    [...new Set(activas.map(u =>
      u.procesion?.hermandad?.nombrePopular || u.procesion?.hermandad?.nombre
    ).filter(Boolean) as string[])].sort(),
    [activas]);

  const activasConDistancia = useMemo(() =>
    activas.map(u => ({
      ...u,
      distancia: userPos
        ? haversineMetros(userPos[1], userPos[0], parseFloat(u.latitud), parseFloat(u.longitud))
        : null,
    })),
    [activas, userPos]);

  const activasFiltradas = useMemo(() => {
    let lista = activasConDistancia.filter(u => {
      if (filterDia && u.procesion?.diaSemana !== filterDia) return false;
      if (filterHermandad) {
        const n = u.procesion?.hermandad?.nombrePopular || u.procesion?.hermandad?.nombre;
        if (n !== filterHermandad) return false;
      }
      if (radioCercanas !== null && u.distancia !== null && u.distancia > radioCercanas) return false;
      return true;
    });
    if (userPos) lista = [...lista].sort((a, b) => (a.distancia ?? Infinity) - (b.distancia ?? Infinity));
    return lista;
  }, [activasConDistancia, filterDia, filterHermandad, radioCercanas, userPos]);

  const filtrosActivos = filterDia !== '' || filterHermandad !== '' || radioCercanas !== null;

  /* ── Fetch ───────────────────────────────────────────────────── */
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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActivas();
    setTimeout(() => setRefreshing(false), 700);
  }, [fetchActivas]);

  /* ── Geo ─────────────────────────────────────────────────────── */
  const flyTo = useCallback((lng: number, lat: number, zoom = 15) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1000 });
  }, []);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { longitude: lng, latitude: lat } = pos.coords;
        setUserPos([lng, lat]);
        flyTo(lng, lat);
        if (watchIdRef.current === null)
          watchIdRef.current = navigator.geolocation.watchPosition(p =>
            setUserPos([p.coords.longitude, p.coords.latitude]));
      },
      err => {
        setGeoError(err.code === 1 ? 'Permiso denegado' : 'No se pudo obtener la ubicación');
        setTimeout(() => setGeoError(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }, [flyTo]);

  useEffect(() => () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  useEffect(() => {
    setUser(parseTokenFromStorage());
    fetchActivas();
    const iv = setInterval(fetchActivas, 15000);
    return () => clearInterval(iv);
  }, [fetchActivas]);

  useEffect(() => {
    activas.forEach(u => fetchEstados(u.procesionId));
  }, [activas, fetchEstados]);

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="p-4 lg:p-6 space-y-5 bg-cofrade-bg min-h-screen">

      {/* ── Cabecera ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mapa en Vivo</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sigue las procesiones activas en tiempo real</p>
          <div className="flex items-center gap-2 mt-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-sm font-semibold text-gray-600">
              {activas.length === 0
                ? 'Sin procesiones activas ahora'
                : `${activas.length} procesión${activas.length > 1 ? 'es' : ''} activa${activas.length > 1 ? 's' : ''} ahora`}
            </span>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-5 py-2.5 bg-cofrade-main text-white text-sm font-black rounded-xl hover:brightness-110 active:scale-95 transition-all self-start sm:self-auto shrink-0"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* ── Mapa + Sidebar ───────────────────────────────────────── */}
      <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col lg:flex-row transition-all duration-300 ${expandido ? 'h-[calc(100vh-220px)]' : 'h-130 lg:h-140'}`}>

        {/* ─ Mapa ──────────────────────────────────────────────── */}
        <div className="relative flex-1 min-w-0 min-h-0 h-[55%] lg:h-full">

          {/* Control expandir */}
          <button
            onClick={() => setExpandido(v => !v)}
            title={expandido ? 'Reducir' : 'Expandir'}
            className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-2 hover:bg-white transition-colors"
          >
            {expandido
              ? <Minimize2 size={15} className="text-gray-500" />
              : <Maximize2 size={15} className="text-gray-500" />}
          </button>

          {/* Control mi ubicación */}
          <button
            onClick={userPos ? () => flyTo(userPos[0], userPos[1]) : handleLocate}
            title="Mi ubicación"
            className={`absolute bottom-4 right-3 z-10 rounded-full shadow-md border p-2.5 transition-all active:scale-95 ${userPos ? 'bg-cofrade-main border-cofrade-main' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
          >
            <Navigation size={15} className={userPos ? 'text-white' : 'text-cofrade-main'} />
          </button>

          {/* Error geo */}
          {geoError && (
            <div className="absolute bottom-16 right-3 z-10 bg-gray-900/90 backdrop-blur-sm text-white text-xs font-semibold rounded-xl shadow-lg px-3 py-2 max-w-52 text-center">
              {geoError}
            </div>
          )}

          <Map
            ref={mapRef}
            initialViewState={{ longitude: -5.9845, latitude: 37.3891, zoom: 13 }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="https://tiles.openfreemap.org/styles/liberty"
          >
            {activasFiltradas.map(u => {
              const lng = parseFloat(u.longitud);
              const lat = parseFloat(u.latitud);
              const nombre = u.procesion?.hermandad?.nombrePopular || u.procesion?.hermandad?.nombre || `Procesión #${u.procesionId}`;

              return (
                <div key={u.id}>
                  <Marker longitude={lng} latitude={lat} anchor="center"
                    onClick={e => { e.originalEvent.stopPropagation(); setOpenPopup(prev => prev === u.procesionId ? null : u.procesionId); }}>
                    <PulsingMarker selected={openPopup === u.procesionId} />
                  </Marker>

                  {openPopup === u.procesionId && (
                    <Popup longitude={lng} latitude={lat} anchor="bottom"
                      onClose={() => setOpenPopup(null)} closeOnClick={false} maxWidth="280px">
                      <div className="p-1 font-sans min-w-48">
                        <p className="font-black text-gray-900 text-sm leading-tight">{nombre}</p>
                        <p className="text-xs font-bold mt-0.5 text-cofrade-main">{u.procesion?.nombre}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Actualizado {formatAgo(u.updatedAt)}</p>

                        {(estados[u.procesionId] || []).length > 0 && (
                          <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-2">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Últimas noticias</p>
                            {(estados[u.procesionId] || []).map(e => (
                              <div key={e.id} className="bg-gray-50 rounded-lg p-1.5">
                                <p className="text-xs font-black text-gray-800">{e.nombrePaso}</p>
                                <p className="text-[11px] text-gray-600">{e.estado}</p>
                                <p className="text-[9px] text-gray-400 mt-0.5">{formatAgo(e.createdAt)} · @{e.autor?.username}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {user && (
                          <button
                            onClick={() => { setOpenPopup(null); setEstadoModal(u.procesionId); }}
                            className="mt-3 w-full py-1.5 rounded-xl bg-cofrade-main text-white text-xs font-black hover:brightness-110 transition-all"
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
        </div>

        {/* ─ Sidebar ───────────────────────────────────────────── */}
        <div className="w-full lg:w-80 lg:shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col overflow-hidden h-[45%] lg:h-full bg-white">

          {/* Cabecera sidebar */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Procesiones Activas</p>
              <button
                onClick={() => setFiltrosVisibles(v => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all ${filtrosVisibles ? 'bg-cofrade-main text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                <SlidersHorizontal size={11} />
                Filtros
                {filtrosActivos && !filtrosVisibles && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                )}
              </button>
            </div>

            {/* Filtros */}
            {filtrosVisibles && (
              <div className="mt-3 space-y-2">
                <select value={filterDia} onChange={e => setFilterDia(e.target.value)} className={SELECT_CLS}>
                  <option value="">Todos los días</option>
                  {diasDisponibles.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={filterHermandad} onChange={e => setFilterHermandad(e.target.value)} className={SELECT_CLS}>
                  <option value="">Todas las hermandades</option>
                  {hermandadesDisponibles.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <select value={radioCercanas ?? ''} onChange={e => setRadioCercanas(e.target.value === '' ? null : Number(e.target.value))} className={SELECT_CLS}>
                  <option value="">Cualquier distancia</option>
                  <option value="500">Menos de 500 m</option>
                  <option value="1000">Menos de 1 km</option>
                  <option value="2000">Menos de 2 km</option>
                  <option value="5000">Menos de 5 km</option>
                </select>
                {filtrosActivos && (
                  <button
                    onClick={() => { setFilterDia(''); setFilterHermandad(''); setRadioCercanas(null); }}
                    className="text-xs font-black text-cofrade-main hover:underline"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {activasFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center h-40">
                <MapPin size={28} className="text-gray-200" />
                <p className="text-sm font-black text-gray-400">
                  {filtrosActivos ? 'Ninguna procesión coincide' : 'Sin procesiones activas'}
                </p>
                {filtrosActivos && (
                  <button
                    onClick={() => { setFilterDia(''); setFilterHermandad(''); setRadioCercanas(null); }}
                    className="text-xs font-black text-cofrade-main hover:underline"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {activasFiltradas.map(u => {
                  const lng = parseFloat(u.longitud);
                  const lat = parseFloat(u.latitud);
                  const nombre = u.procesion?.hermandad?.nombrePopular || u.procesion?.hermandad?.nombre || `Procesión #${u.procesionId}`;
                  const ultimoEstado = estados[u.procesionId]?.[0];
                  const isSelected = openPopup === u.procesionId;

                  return (
                    <button
                      key={u.id}
                      onClick={() => { flyTo(lng, lat); setOpenPopup(prev => prev === u.procesionId ? null : u.procesionId); }}
                      className={`w-full px-4 py-3.5 text-left transition-all border-l-2 ${isSelected ? 'bg-purple-50/60 border-cofrade-main' : 'border-transparent hover:bg-gray-50/80'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative mt-1.5 shrink-0">
                          <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-cofrade-main opacity-50 animate-ping" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cofrade-main" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-gray-900 text-sm truncate leading-snug">{nombre}</p>
                          <p className="text-xs font-bold text-cofrade-main truncate">{u.procesion?.nombre}</p>
                          {ultimoEstado && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              <span className="font-semibold text-gray-700">{ultimoEstado.nombrePaso}</span>
                              {' · '}{ultimoEstado.estado}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-gray-400">{formatAgo(u.updatedAt)}</span>
                            {u.distancia !== null && (
                              <span className="text-[10px] font-black bg-purple-50 text-cofrade-main px-2 py-0.5 rounded-full">
                                {formatDistancia(u.distancia)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-cofrade-main shrink-0 mt-1">Ver →</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ¿Ves una procesión? */}
            {user && (
              <div className="m-4 rounded-2xl p-4 bg-linear-to-br from-purple-50 to-purple-100/50 border border-purple-100">
                <p className="font-black text-sm text-cofrade-main">¿Ves una procesión?</p>
                <p className="text-xs text-gray-500 mt-0.5 mb-3">Comparte el estado en tiempo real con la comunidad</p>
                {activasFiltradas.length > 0 && (
                  <button
                    onClick={() => setEstadoModal(activasFiltradas[0].procesionId)}
                    className="w-full py-2 rounded-xl bg-cofrade-main text-white text-xs font-black hover:brightness-110 active:scale-95 transition-all"
                  >
                    Añadir estado
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {estadoModal !== null && (
        <EstadoPasoModal
          procesionId={estadoModal}
          onClose={() => setEstadoModal(null)}
          onSaved={() => { fetchEstados(estadoModal); setEstadoModal(null); }}
        />
      )}
    </div>
  );
}
