'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Newspaper, ChevronDown } from 'lucide-react';
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
      // silencioso — JwtAuthGuard redirige si no hay token
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
      <div className="max-w-2xl mx-auto">

        {/* Header + pestañas */}
        <div className="bg-white border-b border-gray-100">
          <div className="flex items-center gap-3 px-4 pt-5 pb-0">
            <div className="w-8 h-8 rounded-xl bg-cofrade-main flex items-center justify-center shrink-0">
              <Newspaper size={15} className="text-white" />
            </div>
            <h1 className="text-xl font-black text-gray-900">Feed</h1>
          </div>

          {/* Pestañas */}
          <div className="flex mt-1">
            <TabButton
              label="Para ti"
              active={tab === 'general'}
              onClick={() => handleTabChange('general')}
            />
            <TabButton
              label="Siguiendo"
              active={tab === 'siguiendo'}
              onClick={() => handleTabChange('siguiendo')}
              badge={!isLoggedIn}
            />
          </div>
        </div>

        {/* Contenido */}
        <div className="px-4 py-4">
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
    </div>
  );
}

function TabButton({ label, active, onClick, badge }: { label: string; active: boolean; onClick: () => void; badge?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 py-3.5 text-sm font-black transition-colors ${
        active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
      }`}
    >
      {label}
      {badge && (
        <span className="ml-1.5 text-[9px] font-black text-cofrade-main bg-cofrade-main/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
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
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm animate-pulse">
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
      ))}
    </div>
  );
}

function EmptyState({ tab, isLoggedIn }: { tab: Tab; isLoggedIn: boolean }) {
  if (tab === 'siguiendo') {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Newspaper size={36} className="text-gray-300" />
        </div>
        <h2 className="text-lg font-black text-gray-700 mb-1">Tu feed está vacío</h2>
        <p className="text-sm text-gray-400 font-semibold mb-6">
          Sigue hermandades y bandas para ver sus publicaciones aquí
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-cofrade-main text-white font-black rounded-xl hover:opacity-90 transition-opacity text-sm"
        >
          Explorar hermandades
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Newspaper size={36} className="text-gray-300" />
      </div>
      <h2 className="text-lg font-black text-gray-700 mb-1">Aún no hay publicaciones</h2>
      <p className="text-sm text-gray-400 font-semibold">
        Las hermandades y bandas irán publicando novedades aquí
      </p>
    </div>
  );
}
