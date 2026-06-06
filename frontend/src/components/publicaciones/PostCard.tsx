'use client';

import { useState } from 'react';
import { Trash2, MapPin, Clock } from 'lucide-react';
import { API } from '@/lib/api';

interface PostCardProps {
  post: any;
  canDelete?: boolean;
  onDeleted?: (id: number) => void;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days}d`;
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function PostCard({ post, canDelete, onDeleted }: PostCardProps) {
  const [eliminando, setEliminando] = useState(false);

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    setEliminando(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API}/publicaciones/${post.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      onDeleted?.(post.id);
    } finally {
      setEliminando(false);
    }
  };

  const esItinerario = post.tipo === 'itinerario';

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${esItinerario ? 'border-cofrade-gold/40' : 'border-gray-100'}`}>
      {/* Cabecera */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cofrade-main flex items-center justify-center text-white font-black text-sm shrink-0">
            {(post.autor?.nombre || post.autor?.username || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-black text-gray-900 text-sm leading-none">
              {post.hermandad?.nombrePopular || post.hermandad?.nombre || post.banda?.nombre || post.autor?.nombre || post.autor?.username}
            </p>
            <p className="text-[11px] text-gray-400 font-semibold mt-0.5">{timeAgo(post.fechaCreacion)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {esItinerario && (
            <span className="px-2.5 py-1 bg-cofrade-gold/10 text-cofrade-gold text-[10px] font-black uppercase tracking-wider rounded-full">
              Itinerario
            </span>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={eliminando}
              className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="px-4 pb-4">
        {esItinerario ? (
          <ItinerarioContent contenido={post.contenido} />
        ) : (
          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">{post.contenido}</p>
        )}
        {post.imagenUrl && (
          <img
            src={post.imagenUrl}
            alt=""
            className="mt-3 w-full rounded-xl object-cover max-h-72"
          />
        )}
      </div>
    </div>
  );
}

function ItinerarioContent({ contenido }: { contenido: string }) {
  return (
    <div className="space-y-3">
      {contenido.split('\n').map((line, i) => {
        if (line.startsWith('⏰') || line.startsWith('🕐')) {
          return (
            <div key={i} className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Clock size={14} className="text-cofrade-gold shrink-0" />
              {line.replace(/^[⏰🕐]\s*/, '')}
            </div>
          );
        }
        if (line.startsWith('📍') || line.startsWith('•')) {
          return (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin size={13} className="text-cofrade-main mt-0.5 shrink-0" />
              {line.replace(/^[📍•]\s*/, '')}
            </div>
          );
        }
        if (line.trim() === '') return null;
        return <p key={i} className="text-sm text-gray-800 leading-relaxed">{line}</p>;
      })}
    </div>
  );
}
