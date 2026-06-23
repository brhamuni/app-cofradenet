'use client';

import { useState, useEffect, useCallback } from 'react';
import { Image as ImageIcon, Video, TrendingUp, MapPin, Music, Church, Calendar, Play, Filter, ChevronDown } from 'lucide-react';
import api from '@/app/api/axios';
import { resolveImg } from '@/lib/api';

type TipoFiltro = 'all' | 'foto' | 'video';
type Orden = 'reciente' | 'popular';

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

export default function ExplorarPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [filtro, setFiltro] = useState<TipoFiltro>('all');
  const [orden, setOrden] = useState<Orden>('reciente');
  const [expanded, setExpanded] = useState<MediaItem | null>(null);

  const cargar = useCallback(async (p: number, append: boolean, tipoFiltro: TipoFiltro) => {
    p === 1 ? setCargando(true) : setCargandoMas(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (tipoFiltro !== 'all') params.set('tipo', tipoFiltro);
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
    cargar(1, false, filtro);
  }, [filtro, cargar]);

  const sortedItems = [...items].sort((a, b) => {
    if (orden === 'reciente') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0;
  });

  const populares = sortedItems.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900 mb-1">Galería Multimedia</h1>
              <p className="text-gray-500 text-sm font-semibold">Fotos y vídeos de procesiones de toda España</p>
            </div>
          </div>
        </div>

        {/* Contenido popular */}
        {!cargando && populares.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-cofrade-main" />
              Contenido Popular
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {populares.map((item) => (
                <MediaCard key={item.id} item={item} onClick={() => setExpanded(item)} featured />
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              {(['all', 'foto', 'video'] as TipoFiltro[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setFiltro(t)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-colors ${
                    filtro === t
                      ? 'bg-cofrade-main text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t === 'all' && 'Todo'}
                  {t === 'foto' && <><ImageIcon size={14} /> Fotos</>}
                  {t === 'video' && <><Video size={14} /> Vídeos</>}
                </button>
              ))}
            </div>
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value as Orden)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-cofrade-main/20 bg-white"
            >
              <option value="reciente">Más recientes</option>
              <option value="popular">Más populares</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {cargando ? (
          <GaleriaSkeleton />
        ) : sortedItems.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {sortedItems.map((item) => (
                <MediaCard key={item.id} item={item} onClick={() => setExpanded(item)} />
              ))}
            </div>

            {items.length < total && (
              <div className="flex justify-center">
                <button
                  onClick={() => cargar(page + 1, true, filtro)}
                  disabled={cargandoMas}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-black rounded-xl hover:border-cofrade-main hover:text-cofrade-main transition-colors text-sm shadow-sm disabled:opacity-50"
                >
                  {cargandoMas ? (
                    <div className="w-4 h-4 border-2 border-cofrade-main border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                  Cargar más contenido
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {expanded && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
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

function MediaCard({ item, onClick, featured }: { item: MediaItem; onClick: () => void; featured?: boolean }) {
  const src = resolveImg(item.url);
  return (
    <div
      onClick={onClick}
      className={`relative group cursor-pointer overflow-hidden rounded-xl bg-gray-100 ${featured ? '' : ''}`}
    >
      <div className={featured ? 'aspect-square' : 'aspect-square'}>
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

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          {item.titulo && <p className="text-xs font-black line-clamp-1 mb-1">{item.titulo}</p>}
          <div className="flex flex-wrap gap-1">
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <ImageIcon size={36} className="text-gray-300" />
      </div>
      <h2 className="text-lg font-black text-gray-700 mb-1">No hay contenido todavía</h2>
      <p className="text-sm text-gray-400 font-semibold">Las hermandades y bandas irán subiendo fotos y vídeos</p>
    </div>
  );
}
