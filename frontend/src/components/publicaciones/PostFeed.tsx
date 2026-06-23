'use client';

import { useState, useEffect } from 'react';
import { PenLine } from 'lucide-react';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import { API } from '@/lib/api';

interface Post {
  id: number;
  autorId: number;
  [key: string]: unknown;
}

interface PostFeedProps {
  endpoint: string;
  canPost?: boolean;
  hermandadId?: number;
  bandaId?: number;
  currentUserId?: number;
}

export default function PostFeed({ endpoint, canPost, hermandadId, bandaId, currentUserId }: PostFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCargando(true);
    fetch(`${API}${endpoint}`)
      .then(res => res.ok ? res.json() as Promise<Post[]> : Promise.resolve([]))
      .then(data => { if (active) setPosts(data); })
      .catch(() => {})
      .finally(() => { if (active) setCargando(false); });
    return () => { active = false; };
  }, [endpoint]);

  const handleCreated = (post: Post) => {
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
