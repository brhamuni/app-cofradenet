'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Newspaper, ChevronDown, Church, Music, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import PostCard from '@/components/publicaciones/PostCard';
import api from '@/app/api/axios';

type Tab = 'general' | 'siguiendo';

const LIMIT = 20;

function useFeed(tab: Tab) {
  const [posts, setPosts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);

  const endpoint = tab === 'general' ? '/publicaciones/general' : '/publicaciones/feed';

  const cargar = useCallback(async (p: number, append: boolean) => {
    p === 1 ? setCargando(true) : setCargandoMas(true);
    try {
      const { data } = await api.get(`${endpoint}?page=${p}&limit=${LIMIT}`);
      const nuevos = data.publicaciones ?? [];
      setPosts((prev) => (append ? [...prev, ...nuevos] : nuevos));
      setTotal(data.total ?? 0);
      setPage(p);
    } catch {
      // silencioso
    } finally {
      p === 1 ? setCargando(false) : setCargandoMas(false);
    }
  }, [endpoint]);

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setTotal(0);
    cargar(1, false);
  }, [cargar]);

  const cargarMas = () => cargar(page + 1, true);

  const handleDeleted = (id: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setTotal((prev) => prev - 1);
  };

  return { posts, total, page, cargando, cargandoMas, cargarMas, handleDeleted, hayMas: posts.length < total };
}

export default function FeedPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('general');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    if (!token && tab === 'siguiendo') router.replace('/login');
  }, [tab, router]);

  const general = useFeed('general');
  const siguiendo = useFeed('siguiendo');

  const active = tab === 'general' ? general : siguiendo;

  const handleTabChange = (t: Tab) => {
    if (t === 'siguiendo' && !isLoggedIn) { router.push('/login'); return; }
    setTab(t);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-cofrade-main flex items-center justify-center shrink-0">
              <Newspaper size={15} className="text-white" />
            </div>
            <h1 className="text-xl font-black text-gray-900">Feed cofrade</h1>
          </div>

          {/* Pestañas */}
          <div className="flex">
            <TabButton label="Para ti" icon={<Sparkles size={13} />} active={tab === 'general'} onClick={() => handleTabChange('general')} />
            <TabButton label="Siguiendo" icon={<Users size={13} />} active={tab === 'siguiendo'} onClick={() => handleTabChange('siguiendo')} badge={!isLoggedIn} />
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-2xl mx-auto px-4 py-5">
        {active.cargando ? (
          <Skeleton />
        ) : active.posts.length === 0 ? (
          <EmptyState tab={tab} isLoggedIn={isLoggedIn} />
        ) : (
          <>
            <div className="space-y-4">
              {active.posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  canDelete={false}
                  onDeleted={active.handleDeleted}
                />
              ))}
            </div>

            {active.hayMas && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={active.cargarMas}
                  disabled={active.cargandoMas}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-black rounded-xl hover:border-cofrade-main hover:text-cofrade-main transition-colors text-sm shadow-sm disabled:opacity-50"
                >
                  {active.cargandoMas ? (
                    <div className="w-4 h-4 border-2 border-cofrade-main border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                  Cargar más
                </button>
              </div>
            )}

            <p className="text-center text-xs text-gray-400 font-semibold mt-4">
              {active.posts.length} de {active.total} publicaciones
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({ label, icon, active, onClick, badge }: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void; badge?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-black transition-colors ${
        active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
      }`}
    >
      {icon}
      {label}
      {badge && (
        <span className="ml-1 text-[9px] font-black text-cofrade-main bg-cofrade-main/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
          Login
        </span>
      )}
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full bg-cofrade-main" />
      )}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-pulse">
          <div className="h-0.5 bg-gray-100" />
          <div className="h-40 bg-gray-100" />
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="space-y-1.5">
                <div className="h-3 w-32 bg-gray-200 rounded-full" />
                <div className="h-2 w-20 bg-gray-100 rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-100 rounded-full" />
              <div className="h-3 bg-gray-100 rounded-full w-4/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ tab, isLoggedIn }: { tab: Tab; isLoggedIn: boolean }) {
  if (tab === 'siguiendo') {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-cofrade-main/10 flex items-center justify-center mb-5">
          <Users size={36} className="text-cofrade-main/40" />
        </div>
        <h2 className="text-lg font-black text-gray-800 mb-2">Tu feed está vacío</h2>
        <p className="text-sm text-gray-400 font-semibold mb-6 max-w-xs">
          Sigue hermandades y bandas para ver sus publicaciones aquí
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-3 bg-cofrade-main text-white font-black rounded-xl hover:opacity-90 transition-opacity text-sm"
          >
            <Church size={16} /> Explorar hermandades
          </Link>
          <Link
            href="/explorar"
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 font-black rounded-xl hover:bg-gray-200 transition-colors text-sm"
          >
            <Music size={16} /> Ver bandas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-cofrade-main/10 flex items-center justify-center mb-5">
        <Newspaper size={36} className="text-cofrade-main/40" />
      </div>
      <h2 className="text-lg font-black text-gray-800 mb-2">Aún no hay publicaciones</h2>
      <p className="text-sm text-gray-400 font-semibold">
        Las hermandades y bandas irán publicando novedades aquí
      </p>
    </div>
  );
}
