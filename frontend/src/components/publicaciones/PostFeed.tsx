'use client';

import { useState, useEffect, useCallback } from 'react';
import { PenLine } from 'lucide-react';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';

interface PostFeedProps {
  endpoint: string;         // ej: '/publicaciones/hermandad/3'
  canPost?: boolean;
  hermandadId?: number;
  bandaId?: number;
  currentUserId?: number;
}

export default function PostFeed({ endpoint, canPost, hermandadId, bandaId, currentUserId }: PostFeedProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch(`http://localhost:3000${endpoint}`);
      if (res.ok) setPosts(await res.json());
    } finally {
      setCargando(false);
    }
  }, [endpoint]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCreated = (post: any) => {
    setPosts(prev => [post, ...prev]);
  };

  const handleDeleted = (id: number) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Botón publicar */}
      {canPost && (
        <button
          onClick={() => setModalOpen(true)}
          className="w-full flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:border-cofrade-main/30 hover:text-cofrade-main transition-all shadow-sm text-sm font-semibold"
        >
          <div className="w-9 h-9 rounded-full bg-cofrade-main/10 flex items-center justify-center">
            <PenLine size={16} className="text-cofrade-main" />
          </div>
          ¿Qué quieres publicar?
        </button>
      )}

      {/* Lista */}
      {cargando ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-cofrade-main border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <PenLine size={36} className="mb-3 opacity-20" />
          <p className="text-xs font-black uppercase tracking-widest">Sin publicaciones aún</p>
        </div>
      ) : (
        posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            canDelete={canPost || post.autorId === currentUserId}
            onDeleted={handleDeleted}
          />
        ))
      )}

      <CreatePostModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
        hermandadId={hermandadId}
        bandaId={bandaId}
      />
    </div>
  );
}
