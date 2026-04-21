'use client';

import { useState, useEffect } from 'react';
import { MapPin, Church, Calendar, Hash, Home, CheckCircle2, Edit3, ChevronRight, Clock, Users } from 'lucide-react';
import EditHermandadModal from '../profile/EditHermandadModal';
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
  { key: 'procesiones', label: 'Procesiones' },
] as const;
type Tab = typeof TABS[number]['key'];

export default function HermandadProfile({ hermandad }: { hermandad: any }) {
  const [canEdit, setCanEdit] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('publicaciones');
  const [editOpen, setEditOpen] = useState(false);
  const [seguidores, setSeguidores] = useState<number | null>(null);

  useEffect(() => {
    const user = parseToken();
    if (!user) return;
    setCanEdit(user.rol === 'admin' || hermandad.usuarioId === user.id);
  }, [hermandad.usuarioId]);

  const titulares: string[] = Array.isArray(hermandad.titulares)
    ? hermandad.titulares
    : hermandad.titulares ? String(hermandad.titulares).split(',').map((t: string) => t.trim()) : [];

  const procesiones: any[] = hermandad.procesiones || [];

  return (
    <div className="min-h-screen bg-white">
      {/* PORTADA */}
      <div className="relative w-full h-56 md:h-80 overflow-hidden bg-cofrade-main">
        <img
          src="https://images.unsplash.com/photo-1559564484-e48b3e040ff4?q=80&w=1600"
          alt="Portada"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cofrade-main/80 via-cofrade-main/20 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* CABECERA */}
        <div className="relative -mt-16 md:-mt-24 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl border-4 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center">
            {hermandad.imagenEscudo
              ? <img src={hermandad.imagenEscudo} alt="Escudo" className="w-full h-full object-contain p-2" />
              : <Church size={48} className="text-cofrade-main/30" />}
          </div>

          <div className="flex gap-3 pb-1">
            {canEdit ? (
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-full font-bold text-sm hover:bg-gray-50 transition-all shadow-sm"
              >
                <Edit3 size={15} /> Editar
              </button>
            ) : (
              <FollowButton tipo="hermandad" id={hermandad.id} onCountChange={setSeguidores} />
            )}
          </div>
        </div>

        {/* NOMBRE Y META */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
              {hermandad.nombrePopular || hermandad.nombre}
            </h1>
            {hermandad.verificada && (
              <CheckCircle2 size={24} className="text-cofrade-gold fill-cofrade-gold/20 shrink-0" />
            )}
          </div>
          {hermandad.nombrePopular && hermandad.nombre !== hermandad.nombrePopular && (
            <p className="text-gray-500 font-semibold text-sm mb-2">{hermandad.nombre}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-semibold">
            {hermandad.ciudad?.nombre && (
              <span className="flex items-center gap-1.5">
                <MapPin size={15} className="text-gray-400" />
                {hermandad.ciudad.nombre}, Andalucía
              </span>
            )}
            {hermandad.añoFundacion && (
              <span className="flex items-center gap-1.5">
                <Calendar size={15} className="text-gray-400" />
                Fundada en {hermandad.añoFundacion}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users size={15} className="text-gray-400" />
              <span className="font-black text-gray-900">{seguidores ?? '—'}</span> seguidores
            </span>
          </div>
        </div>

        {/* TITULARES */}
        {titulares.length > 0 && (
          <div className="mb-8">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Titulares</p>
            <div className="flex flex-wrap gap-2">
              {titulares.map((t, i) => (
                <span key={i} className="px-3 py-1 bg-cofrade-main/10 text-cofrade-main text-xs font-black rounded-full uppercase tracking-wider">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="border-b border-gray-200 flex gap-8 mb-8">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                activeTab === tab.key
                  ? 'border-cofrade-main text-cofrade-main'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.key === 'procesiones' ? `Procesiones (${procesiones.length})` : tab.label}
            </button>
          ))}
        </div>

        {/* CONTENIDO */}
        <div className="pb-16">
          {activeTab === 'publicaciones' && (
            <PostFeed
              endpoint={`/publicaciones/hermandad/${hermandad.id}`}
              canPost={canEdit}
              hermandadId={hermandad.id}
            />
          )}

          {activeTab === 'info' && (
            <div className="space-y-8">
              {hermandad.descripcion && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Sobre la hermandad</p>
                  <p className="text-gray-700 leading-relaxed">{hermandad.descripcion}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Datos</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hermandad.templo && <InfoCard icon={<Church size={18} />} label="Sede canónica" value={hermandad.templo} />}
                  {hermandad.diaSalida && <InfoCard icon={<Calendar size={18} />} label="Día de salida" value={hermandad.diaSalida} />}
                  {hermandad.direccion && (
                    <InfoCard icon={<Home size={18} />} label="Dirección"
                      value={hermandad.codigoPostal ? `${hermandad.direccion}, ${hermandad.codigoPostal}` : hermandad.direccion}
                    />
                  )}
                  {hermandad.añoFundacion && <InfoCard icon={<Hash size={18} />} label="Año de fundación" value={String(hermandad.añoFundacion)} />}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'procesiones' && (
            procesiones.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-gray-400">
                <Church size={40} className="mb-4 opacity-20" />
                <p className="font-black uppercase tracking-widest text-xs">Sin procesiones registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {procesiones.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-cofrade-main/10 flex items-center justify-center shrink-0">
                      <Clock size={18} className="text-cofrade-main" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 truncate">{p.nombre}</p>
                      <p className="text-xs text-gray-500 font-semibold mt-0.5">
                        {p.diaSemana} · Salida: {p.horaSalida}
                        {p.horaEntrada ? ` · Entrada: ${p.horaEntrada}` : ''}
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

      <EditHermandadModal hermandad={hermandad} isOpen={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}
