'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Image as ImageIcon, Video, TrendingUp, MapPin, Music, Church, Calendar, Play, ChevronDown, Search, X, SlidersHorizontal } from 'lucide-react';
import api from '@/app/api/axios';
import { resolveImg } from '@/lib/api';

type TipoFiltro = 'all' | 'foto' | 'video';

interface Ciudad {
  id: number;
  nombre: string;
}

interface MediaItem {
  id: number;
  tipo: 'foto' | 'video' | 'enlace';
  url: string;
  titulo?: string;
  descripcion?: string;
  anio?: number;
  ciudad?: { id: number; nombre: string };
  hermandad?: { id: number; nombre: string; nombrePopular?: string };
  banda?: { id: number; nombre: string };
  autor?: { id: number; nombre: string; username: string };
  createdAt: string;
}

const LIMIT = 20;
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

export default function ExplorarPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [expanded, setExpanded] = useState<MediaItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<TipoFiltro>('all');
  const [filtroAnio, setFiltroAnio] = useState<string>('');
  const [filtroCiudad, setFiltroCiudad] = useState<string>('');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);

  useEffect(() => {
    api.get('/ciudades').then(({ data }) => setCiudades(data)).catch(() => {});
  }, []);

  const cargar = useCallback(async (p: number, append: boolean, tipo: TipoFiltro, anio: string, ciudadId: string) => {
    p === 1 ? setCargando(true) : setCargandoMas(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (tipo !== 'all') params.set('tipo', tipo);
      if (anio) params.set('anio', anio);
      if (ciudadId) params.set('ciudadId', ciudadId);
      const { data } = await api.get(`/media?${params}`);
      const nuevos: MediaItem[] = Array.isArray(data) ? data : (data.items ?? data);
      setItems((prev) => (append ? [...prev, ...nuevos] : nuevos));
      setTotal(typeof data.total === 'number' ? data.total : nuevos.length);
      setPage(p);
    } catch {
      // silencioso
    } finally {
      p === 1 ? setCargando(false) : setCargandoMas(false);
    }
  }, []);

  useEffect(() => {
    setItems([]);
    setPage(1);
    cargar(1, false, filtroTipo, filtroAnio, filtroCiudad);
  }, [filtroTipo, filtroAnio, filtroCiudad, cargar]);

  // Filtro de texto client-side (hermandad/banda nombre)
  const filteredItems = useMemo(() => {
    if (!filtroTexto.trim()) return items;
    const q = filtroTexto.toLowerCase();
    return items.filter(item =>
      item.hermandad?.nombre?.toLowerCase().includes(q) ||
      item.hermandad?.nombrePopular?.toLowerCase().includes(q) ||
      item.banda?.nombre?.toLowerCase().includes(q) ||
      item.titulo?.toLowerCase().includes(q)
    );
  }, [items, filtroTexto]);

  const populares = filteredItems.slice(0, 3);

  const hasActiveFilters = !!filtroAnio || !!filtroCiudad || !!filtroTexto || filtroTipo !== 'all';

  const clearFilters = () => {
    setFiltroTipo('all');
    setFiltroAnio('');
    setFiltroCiudad('');
    setFiltroTexto('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-cofrade-main text-white">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black">Galería</h1>
              <p className="text-white/60 text-sm font-semibold mt-0.5">Fotos y vídeos de procesiones</p>
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 min-h-11 rounded-xl text-sm font-black transition-all ${
                showFilters || hasActiveFilters
                  ? 'bg-white text-cofrade-main'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <SlidersHorizontal size={15} />
              Filtros
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-cofrade-gold" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* Panel de filtros */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Filtros</h2>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs font-black text-gray-400 hover:text-red-500 transition-colors">
                  <X size={13} /> Limpiar
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tipo */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Tipo</label>
                <div className="flex gap-1">
                  {(['all', 'foto', 'video'] as TipoFiltro[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFiltroTipo(t)}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-black transition-colors ${
                        filtroTipo === t ? 'bg-cofrade-main text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t === 'all' && 'Todo'}
                      {t === 'foto' && <><ImageIcon size={11} /> Fotos</>}
                      {t === 'video' && <><Video size={11} /> Vídeos</>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Año */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Año</label>
                <select
                  value={filtroAnio}
                  onChange={e => setFiltroAnio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cofrade-main/20 bg-white"
                >
                  <option value="">Todos los años</option>
                  {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                </select>
              </div>

              {/* Ciudad */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Ciudad</label>
                <CiudadCombobox ciudades={ciudades} value={filtroCiudad} onChange={setFiltroCiudad} />
              </div>

              {/* Hermandad / Banda (texto) */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Hermandad o Banda</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={filtroTexto}
                    onChange={e => setFiltroTexto(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cofrade-main/20"
                  />
                  {filtroTexto && (
                    <button onClick={() => setFiltroTexto('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X size={13} className="text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chips de filtros activos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500 font-semibold">Filtros activos:</span>
            {filtroTipo !== 'all' && (
              <FilterChip label={filtroTipo === 'foto' ? 'Fotos' : 'Vídeos'} onRemove={() => setFiltroTipo('all')} />
            )}
            {filtroAnio && <FilterChip label={filtroAnio} onRemove={() => setFiltroAnio('')} />}
            {filtroCiudad && <FilterChip label={ciudades.find(c => c.id === +filtroCiudad)?.nombre ?? filtroCiudad} onRemove={() => setFiltroCiudad('')} />}
            {filtroTexto && <FilterChip label={`"${filtroTexto}"`} onRemove={() => setFiltroTexto('')} />}
          </div>
        )}

        {/* Contenido popular */}
        {!cargando && populares.length >= 3 && !hasActiveFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-widest">
              <TrendingUp size={16} className="text-cofrade-main" />
              Más reciente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {populares.map((item) => (
                <MediaCard key={item.id} item={item} onClick={() => setExpanded(item)} featured />
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        {cargando ? (
          <GaleriaSkeleton />
        ) : filteredItems.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredItems.map((item) => (
                <MediaCard key={item.id} item={item} onClick={() => setExpanded(item)} />
              ))}
            </div>

            {items.length < total && (
              <div className="flex justify-center">
                <button
                  onClick={() => cargar(page + 1, true, filtroTipo, filtroAnio, filtroCiudad)}
                  disabled={cargandoMas}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-black rounded-xl hover:border-cofrade-main hover:text-cofrade-main transition-colors text-sm shadow-sm disabled:opacity-50"
                >
                  {cargandoMas ? (
                    <div className="w-4 h-4 border-2 border-cofrade-main border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                  Cargar más
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {expanded && (
        <div
          className="fixed inset-0 z-9999 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setExpanded(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setExpanded(null)}
              className="absolute -top-10 right-0 text-white text-2xl font-black px-3 py-1 hover:text-gray-300"
            >
              ✕
            </button>
            {expanded.tipo === 'video' ? (
              <video src={resolveImg(expanded.url)} controls className="w-full rounded-xl max-h-[70vh] object-contain" />
            ) : (
              <img src={resolveImg(expanded.url)} alt={expanded.titulo || ''} className="w-full rounded-xl max-h-[70vh] object-contain" />
            )}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl mt-3 p-4 text-white">
              {expanded.titulo && <p className="font-black text-lg">{expanded.titulo}</p>}
              {expanded.descripcion && <p className="text-sm text-gray-200 mt-1">{expanded.descripcion}</p>}
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-300">
                {expanded.ciudad && <span className="flex items-center gap-1"><MapPin size={12} />{expanded.ciudad.nombre}</span>}
                {expanded.hermandad && <span className="flex items-center gap-1"><Church size={12} />{expanded.hermandad.nombrePopular || expanded.hermandad.nombre}</span>}
                {expanded.banda && <span className="flex items-center gap-1"><Music size={12} />{expanded.banda.nombre}</span>}
                {expanded.anio && <span className="flex items-center gap-1"><Calendar size={12} />{expanded.anio}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-cofrade-main/10 text-cofrade-main text-xs font-black rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors">
        <X size={11} />
      </button>
    </span>
  );
}

function CiudadCombobox({ ciudades, value, onChange }: { ciudades: Ciudad[]; value: string; onChange: (id: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const ciudadSeleccionada = ciudades.find(c => String(c.id) === value);
  const ciudadesFiltradas = busqueda.trim()
    ? ciudades.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : ciudades;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
        setBusqueda('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const seleccionar = (id: string) => {
    onChange(id);
    setAbierto(false);
    setBusqueda('');
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setAbierto(v => !v); }}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-xl text-sm font-semibold bg-white transition-all ${
          abierto ? 'border-cofrade-main ring-2 ring-cofrade-main/20' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <span className={ciudadSeleccionada ? 'text-gray-900' : 'text-gray-400'}>
          {ciudadSeleccionada ? ciudadSeleccionada.nombre : 'Todas las ciudades'}
        </span>
        {ciudadSeleccionada ? (
          <span
            role="button"
            onClick={e => { e.stopPropagation(); seleccionar(''); }}
            className="p-0.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            <X size={13} />
          </span>
        ) : (
          <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`} />
        )}
      </button>

      {abierto && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                autoFocus
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar ciudad..."
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cofrade-main/20"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            <button
              type="button"
              onClick={() => seleccionar('')}
              className={`w-full text-left px-3 py-2 text-sm font-semibold transition-colors ${
                !value ? 'text-cofrade-main bg-cofrade-main/5' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Todas las ciudades
            </button>
            {ciudadesFiltradas.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 font-semibold text-center">Sin resultados</p>
            ) : (
              ciudadesFiltradas.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => seleccionar(String(c.id))}
                  className={`w-full text-left px-3 py-2 text-sm font-semibold transition-colors ${
                    String(c.id) === value ? 'text-cofrade-main bg-cofrade-main/5 font-black' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {c.nombre}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MediaCard({ item, onClick, featured }: { item: MediaItem; onClick: () => void; featured?: boolean }) {
  const src = resolveImg(item.url);
  return (
    <div
      onClick={onClick}
      className="relative group cursor-pointer overflow-hidden rounded-xl bg-gray-100"
    >
      <div className="aspect-square">
        {src ? (
          <img src={src} alt={item.titulo || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            {item.tipo === 'video' ? <Video size={32} className="text-gray-400" /> : <ImageIcon size={32} className="text-gray-400" />}
          </div>
        )}
      </div>

      {item.tipo === 'video' && (
        <div className="absolute top-2 right-2">
          <div className="w-7 h-7 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Play size={12} className="text-white fill-white ml-0.5" />
          </div>
        </div>
      )}

      {item.anio && (
        <div className="absolute top-2 left-2">
          <span className="px-1.5 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[10px] font-black rounded-md">
            {item.anio}
          </span>
        </div>
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          {item.titulo && <p className="text-xs font-black line-clamp-1 mb-1">{item.titulo}</p>}
          <div className="flex flex-wrap gap-1">
            {item.createdAt && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">
                <Calendar size={9} />
                {new Date(item.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
            {item.ciudad && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">
                <MapPin size={9} />{item.ciudad.nombre}
              </span>
            )}
            {item.hermandad && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-cofrade-main/70 rounded text-[10px]">
                <Church size={9} />{item.hermandad.nombrePopular || item.hermandad.nombre}
              </span>
            )}
            {item.banda && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-500/70 rounded text-[10px]">
                <Music size={9} />{item.banda.nombre}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GaleriaSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-xl bg-gray-200 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-cofrade-main/10 flex items-center justify-center mb-5">
        <ImageIcon size={36} className="text-cofrade-main/30" />
      </div>
      <h2 className="text-lg font-black text-gray-700 mb-2">
        {hasFilters ? 'Sin resultados' : 'No hay contenido todavía'}
      </h2>
      <p className="text-sm text-gray-400 font-semibold mb-5">
        {hasFilters
          ? 'Prueba a cambiar o eliminar los filtros'
          : 'Las hermandades y bandas irán subiendo fotos y vídeos'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="px-5 py-2.5 bg-cofrade-main text-white font-black rounded-xl text-sm hover:opacity-90 transition-opacity"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
