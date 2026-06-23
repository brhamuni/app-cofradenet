'use client';

import { useState, useEffect, useCallback } from 'react';
import { Image, Video, Link, Trash2, X, Plus, ExternalLink } from 'lucide-react';
import { API, resolveImg } from '@/lib/api';
import UploadMediaModal from './UploadMediaModal';

interface MediaItem {
  id: number;
  tipo: 'foto' | 'video' | 'enlace';
  url: string;
  titulo?: string;
  descripcion?: string;
  anio?: number;
  autor?: { id: number; username: string };
  hermandad?: { nombre: string };
  banda?: { nombre: string };
  ciudad?: { nombre: string };
  createdAt: string;
}

interface Props {
  hermandadId?: number;
  bandaId?: number;
  canEdit?: boolean;
  userId?: number;
}

function MediaCard({ item, onDelete, canDelete }: {
  item: MediaItem;
  onDelete: (id: number) => void;
  canDelete: boolean;
}) {
  const [lightbox, setLightbox] = useState(false);

  const isYouTube = item.url.includes('youtube.com') || item.url.includes('youtu.be');
  const isSpotify = item.url.includes('spotify.com');

  function getYouTubeId(url: string) {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return m ? m[1] : null;
  }

  const ytId = isYouTube ? getYouTubeId(item.url) : null;
  const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;

  return (
    <>
      <div className="group relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 aspect-square cursor-pointer hover:shadow-md transition-shadow">
        {item.tipo === 'foto' ? (
          <img
            src={resolveImg(item.url)}
            alt={item.titulo || ''}
            className="w-full h-full object-cover"
            onClick={() => setLightbox(true)}
          />
        ) : item.tipo === 'video' ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-900" onClick={() => setLightbox(true)}>
            <Video size={32} className="text-white/60" />
          </div>
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-2 p-3"
            onClick={() => window.open(item.url, '_blank')}
          >
            {thumbUrl ? (
              <img src={thumbUrl} alt={item.titulo || ''} className="w-full h-full object-cover absolute inset-0" />
            ) : isSpotify ? (
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white font-black text-xs">SPOT</span>
              </div>
            ) : (
              <Link size={24} className="text-gray-400" />
            )}
            <ExternalLink size={16} className="absolute top-2 right-2 text-white drop-shadow" />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />

        {/* Info bar */}
        {(item.titulo || item.anio) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform">
            {item.titulo && <p className="text-white text-xs font-black truncate">{item.titulo}</p>}
            {item.anio && <p className="text-white/70 text-[10px]">{item.anio}</p>}
          </div>
        )}

        {/* Delete button */}
        {canDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(item.id); }}
            className="absolute top-2 left-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={12} className="text-white" />
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-full" onClick={() => setLightbox(false)}>
            <X size={20} className="text-white" />
          </button>
          {item.tipo === 'foto' ? (
            <img src={resolveImg(item.url)} alt={item.titulo || ''} className="max-w-full max-h-full object-contain rounded-xl" onClick={e => e.stopPropagation()} />
          ) : item.tipo === 'video' ? (
            <video src={resolveImg(item.url)} controls className="max-w-full max-h-full rounded-xl" onClick={e => e.stopPropagation()} />
          ) : null}
          {item.titulo && <p className="absolute bottom-6 text-white font-black text-sm">{item.titulo}</p>}
        </div>
      )}
    </>
  );
}

export default function GaleriaMedia({ hermandadId, bandaId, canEdit = false, userId }: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [filter, setFilter] = useState<'todo' | 'foto' | 'video' | 'enlace'>('todo');

  const endpoint = hermandadId
    ? `${API}/media/hermandad/${hermandadId}`
    : `${API}/media/banda/${bandaId}`;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint);
      if (res.ok) setItems(await res.json());
    } catch {}
    setLoading(false);
  }, [endpoint]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function handleDelete(id: number) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/media/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setItems(prev => prev.filter(i => i.id !== id));
  }

  const filtered = filter === 'todo' ? items : items.filter(i => i.tipo === filter);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['todo', 'foto', 'video', 'enlace'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                filter === f ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              {f === 'todo' ? `Todo (${items.length})` :
               f === 'foto' ? `Fotos (${items.filter(i => i.tipo === 'foto').length})` :
               f === 'video' ? `Vídeos (${items.filter(i => i.tipo === 'video').length})` :
               `Enlaces (${items.filter(i => i.tipo === 'enlace').length})`}
            </button>
          ))}
        </div>
        {canEdit && (
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cofrade-main text-white rounded-full text-xs font-black hover:brightness-110 transition-all"
          >
            <Plus size={14} /> Subir contenido
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <Image size={40} className="mb-4 opacity-20" />
          <p className="font-black uppercase tracking-widest text-xs">Sin contenido multimedia</p>
          {canEdit && (
            <button
              onClick={() => setUploadOpen(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-cofrade-main text-white rounded-full text-xs font-black"
            >
              <Plus size={14} /> Subir el primero
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {filtered.map(item => (
            <MediaCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              canDelete={canEdit || item.autor?.id === userId}
            />
          ))}
        </div>
      )}

      {uploadOpen && (
        <UploadMediaModal
          hermandadId={hermandadId}
          bandaId={bandaId}
          onClose={() => setUploadOpen(false)}
          onSaved={() => { setUploadOpen(false); fetchItems(); }}
        />
      )}
    </div>
  );
}
