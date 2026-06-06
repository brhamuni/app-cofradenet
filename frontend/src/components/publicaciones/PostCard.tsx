'use client';

import { useState, useRef } from 'react';
import { Trash2, MapPin, Clock, Heart, MessageCircle } from 'lucide-react';
import api from '@/app/api/axios';
import { resolveImg } from '@/lib/api';

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
  const [liked, setLiked] = useState<boolean>(post.userLiked ?? false);
  const [likesCount, setLikesCount] = useState<number>(post.likesCount ?? 0);
  const [comentariosCount, setComentariosCount] = useState<number>(post.comentariosCount ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [comentariosCargados, setComentariosCargados] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLoggedIn = () => typeof window !== 'undefined' && !!localStorage.getItem('token');

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    setEliminando(true);
    try {
      await api.delete(`/publicaciones/${post.id}`);
      onDeleted?.(post.id);
    } finally {
      setEliminando(false);
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn()) { window.location.href = '/login'; return; }
    const prevLiked = liked;
    const prevCount = likesCount;
    setLiked(!prevLiked);
    setLikesCount(prevCount + (prevLiked ? -1 : 1));
    try {
      const { data } = await api.post(`/publicaciones/${post.id}/like`);
      setLiked(data.liked);
      setLikesCount(data.count);
    } catch {
      setLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  const handleToggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && !comentariosCargados) {
      try {
        const { data } = await api.get(`/publicaciones/${post.id}/comentarios`);
        setComentarios(data);
        setComentariosCount(data.length);
        setComentariosCargados(true);
      } catch {
        // ignore
      }
    }
  };

  const handleEnviarComentario = async () => {
    if (!isLoggedIn()) { window.location.href = '/login'; return; }
    const contenido = nuevoComentario.trim();
    if (!contenido) return;
    setEnviandoComentario(true);
    try {
      const { data } = await api.post(`/publicaciones/${post.id}/comentarios`, { contenido });
      setComentarios((prev) => [...prev, data]);
      setComentariosCount((prev) => prev + 1);
      setNuevoComentario('');
    } finally {
      setEnviandoComentario(false);
    }
  };

  const handleEliminarComentario = async (comentarioId: number) => {
    try {
      await api.delete(`/publicaciones/${post.id}/comentarios/${comentarioId}`);
      setComentarios((prev) => prev.filter((c) => c.id !== comentarioId));
      setComentariosCount((prev) => prev - 1);
    } catch {
      // ignore
    }
  };

  const esItinerario = post.tipo === 'itinerario';
  const currentUserId = typeof window !== 'undefined'
    ? (() => { try { const t = localStorage.getItem('token'); if (!t) return null; return JSON.parse(atob(t.split('.')[1]))?.id ?? null; } catch { return null; } })()
    : null;

  const avatarImg = resolveImg(post.hermandad?.imagenEscudo ?? post.banda?.imagenLogo ?? null);
  const avatarName = post.hermandad?.nombrePopular || post.hermandad?.nombre || post.banda?.nombre || post.autor?.nombre || post.autor?.username || '?';

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${esItinerario ? 'border-cofrade-gold/40' : 'border-gray-100'}`}>
      {/* Cabecera */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cofrade-main/10 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0">
            {avatarImg ? (
              <img src={avatarImg} alt={avatarName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-cofrade-main font-black text-sm">
                {avatarName.charAt(0).toUpperCase()}
              </span>
            )}
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
      <div className="px-4 pb-3">
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

      {/* Barra de acciones */}
      <div className="flex items-center gap-1 px-3 pb-3 border-t border-gray-50 pt-2">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm font-semibold px-2 py-1.5 rounded-lg transition-colors ${liked ? 'text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-cofrade-main hover:bg-gray-50'}`}
        >
          <Heart size={16} className={liked ? 'fill-red-500' : ''} />
          {likesCount > 0 && <span>{likesCount}</span>}
        </button>
        <button
          onClick={handleToggleComments}
          className={`flex items-center gap-1.5 text-sm font-semibold px-2 py-1.5 rounded-lg transition-colors ${showComments ? 'text-cofrade-main bg-cofrade-main/5' : 'text-gray-400 hover:text-cofrade-main hover:bg-gray-50'}`}
        >
          <MessageCircle size={16} />
          {comentariosCount > 0 && <span>{comentariosCount}</span>}
        </button>
      </div>

      {/* Panel de comentarios */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          {/* Lista de comentarios */}
          <div className="space-y-3 mb-3 max-h-64 overflow-y-auto">
            {comentarios.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2 font-semibold">Sé el primero en comentar</p>
            )}
            {comentarios.map((c) => {
              const isOwn = currentUserId !== null && c.usuarioId === currentUserId;
              const cName = isOwn ? 'Tú' : (c.autor?.nombre || c.autor?.username || '?');
              return (
                <div key={c.id} className="flex gap-2 group">
                  <div className="w-7 h-7 rounded-full bg-cofrade-main/10 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-cofrade-main font-black text-xs">{cName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-xl px-3 py-2">
                      <p className={`text-xs font-black mb-0.5 ${isOwn ? 'text-cofrade-main' : 'text-gray-700'}`}>
                        {cName}
                      </p>
                      <p className="text-sm text-gray-800 leading-snug">{c.contenido}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5 ml-1">{timeAgo(c.createdAt)}</p>
                  </div>
                  {(currentUserId === c.usuarioId || canDelete) && (
                    <button
                      onClick={() => handleEliminarComentario(c.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-all self-start mt-0.5 rounded shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Input nuevo comentario */}
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviarComentario(); } }}
              placeholder="Escribe un comentario…"
              rows={1}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cofrade-main/20 resize-none"
            />
            <button
              onClick={handleEnviarComentario}
              disabled={enviandoComentario || !nuevoComentario.trim()}
              className="px-3 py-2 bg-cofrade-main text-white text-sm font-black rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
            >
              {enviandoComentario ? '…' : 'Enviar'}
            </button>
          </div>
        </div>
      )}
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
