'use client';

import { useState, useEffect } from 'react';
import { MapPin, Music, Users, Home, CheckCircle2, Edit3, ChevronRight, Calendar, BookOpen } from 'lucide-react';
import PostFeed from '../publicaciones/PostFeed';
import FollowButton from '../seguimientos/FollowButton';

function parseToken(): { id: number; rol: string } | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  } catch { return null; }
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl">
      <div className="shrink-0 w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-cofrade-main">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

const TABS = [
  { key: 'publicaciones', label: 'Publicaciones' },
  { key: 'info', label: 'Información' },
  { key: 'repertorio', label: 'Repertorio' },
  { key: 'agenda', label: 'Agenda' },
] as const;
type Tab = typeof TABS[number]['key'];

export default function BandaProfile({ banda }: { banda: any }) {
  const [canEdit, setCanEdit] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('publicaciones');
  const [seguidores, setSeguidores] = useState<number | null>(null);

  useEffect(() => {
    const user = parseToken();
    if (!user) return;
    setCanEdit(user.rol === 'admin' || banda.usuarioId === user.id);
  }, [banda.usuarioId]);

  const marchas: any[] = banda.repertorio || [];
  const eventos: any[] = banda.eventos || [];

  return (
    <div className="min-h-screen bg-white">
      {/* PORTADA */}
      <div className="relative w-full h-56 md:h-80 overflow-hidden bg-cofrade-main">
        <img
          src="https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=1600"
          alt="Portada banda"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cofrade-main/80 via-cofrade-main/20 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* CABECERA */}
        <div className="relative -mt-16 md:-mt-24 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl border-4 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center">
            {banda.imagenLogo
              ? <img src={banda.imagenLogo} alt="Logo" className="w-full h-full object-contain p-2" />
              : <Music size={48} className="text-cofrade-main/30" />}
          </div>

          <div className="flex gap-3 pb-1">
            {canEdit ? (
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-full font-bold text-sm hover:bg-gray-50 transition-all shadow-sm">
                <Edit3 size={15} /> Editar
              </button>
            ) : (
              <FollowButton tipo="banda" id={banda.id} onCountChange={setSeguidores} />
            )}
          </div>
        </div>

        {/* NOMBRE Y META */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{banda.nombre}</h1>
            {banda.verificada && (
              <CheckCircle2 size={24} className="text-cofrade-gold fill-cofrade-gold/20 shrink-0" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-semibold">
            <span className="flex items-center gap-1.5">
              <Music size={15} className="text-cofrade-main" />
              <span className="text-cofrade-main font-black uppercase text-xs tracking-wider">{banda.estiloMusical}</span>
            </span>
            {(banda.ciudad?.nombre || banda.localidad) && (
              <span className="flex items-center gap-1.5">
                <MapPin size={15} className="text-gray-400" />
                {banda.ciudad?.nombre || banda.localidad}, Andalucía
              </span>
            )}
            {banda.numeroComponentes && (
              <span className="flex items-center gap-1.5">
                <Users size={15} className="text-gray-400" />
                {banda.numeroComponentes} componentes
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users size={15} className="text-gray-400" />
              <span className="font-black text-gray-900">{seguidores ?? '—'}</span> seguidores
            </span>
          </div>
        </div>

        {/* TABS */}
        <div className="border-b border-gray-200 flex gap-8 mb-8 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-cofrade-main text-cofrade-main'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.key === 'repertorio' ? `Repertorio (${marchas.length})` :
               tab.key === 'agenda' ? `Agenda (${eventos.length})` : tab.label}
            </button>
          ))}
        </div>

        {/* CONTENIDO */}
        <div className="pb-16">
          {activeTab === 'publicaciones' && (
            <PostFeed
              endpoint={`/publicaciones/banda/${banda.id}`}
              canPost={canEdit}
              bandaId={banda.id}
            />
          )}

          {activeTab === 'info' && (
            <div className="space-y-8">
              {banda.historia && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Historia</p>
                  <p className="text-gray-700 leading-relaxed">{banda.historia}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Datos</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoCard icon={<Music size={18} />} label="Estilo musical" value={banda.estiloMusical} />
                  {banda.numeroComponentes && <InfoCard icon={<Users size={18} />} label="Componentes" value={String(banda.numeroComponentes)} />}
                  {banda.direccion && (
                    <InfoCard icon={<Home size={18} />} label="Dirección"
                      value={banda.codigoPostal ? `${banda.direccion}, ${banda.codigoPostal}` : banda.direccion}
                    />
                  )}
                  {(banda.ciudad?.nombre || banda.localidad) && (
                    <InfoCard icon={<MapPin size={18} />} label="Localidad" value={banda.ciudad?.nombre || banda.localidad} />
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'repertorio' && (
            marchas.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-gray-400">
                <BookOpen size={40} className="mb-4 opacity-20" />
                <p className="font-black uppercase tracking-widest text-xs">Sin marchas en el repertorio</p>
              </div>
            ) : (
              <div className="space-y-3">
                {marchas.map((m: any, i: number) => (
                  <div key={m.id ?? i} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-cofrade-main/10 flex items-center justify-center shrink-0">
                      <Music size={18} className="text-cofrade-main" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 truncate">{m.titulo || m.nombre}</p>
                      {m.compositor && <p className="text-xs text-gray-500 font-semibold mt-0.5">{m.compositor}</p>}
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'agenda' && (
            eventos.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-gray-400">
                <Calendar size={40} className="mb-4 opacity-20" />
                <p className="font-black uppercase tracking-widest text-xs">Sin eventos registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {eventos.map((e: any, i: number) => (
                  <div key={e.id ?? i} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-cofrade-gold/10 flex items-center justify-center shrink-0">
                      <Calendar size={18} className="text-cofrade-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 truncate">{e.nombre || e.descripcion || 'Evento'}</p>
                      <p className="text-xs text-gray-500 font-semibold mt-0.5">
                        {e.fecha ? new Date(e.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                        {e.lugar ? ` · ${e.lugar}` : ''}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
