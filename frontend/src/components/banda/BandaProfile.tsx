'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Music, Users, Home, CheckCircle2, Edit3, ChevronRight, Calendar, BookOpen, Plus, Trash2, X } from 'lucide-react';
import PostFeed from '../publicaciones/PostFeed';
import FollowButton from '../seguimientos/FollowButton';
import { API } from '@/lib/api';

function parseToken(): { id: number; rol: string } | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  } catch { return null; }
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
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

type Evento = {
  id: number;
  titulo: string;
  fechaHora: string;
  lugar: string;
  descripcion?: string;
  tipo?: string;
  bandaId: number;
};

const EVENTO_VACIO = { titulo: '', fechaHora: '', lugar: '', descripcion: '', tipo: 'concierto' };

function EventoModal({ evento, bandaId, onClose, onSaved }: {
  evento: Partial<Evento> | null;
  bandaId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const esEdicion = !!evento?.id;
  const [form, setForm] = useState({
    titulo: evento?.titulo ?? '',
    fecha: evento?.fechaHora ? evento.fechaHora.split('T')[0] : '',
    hora: evento?.fechaHora ? evento.fechaHora.split('T')[1]?.slice(0, 5) : '',
    lugar: evento?.lugar ?? '',
    descripcion: evento?.descripcion ?? '',
    tipo: evento?.tipo ?? 'concierto',
  });
  const [guardando, setGuardando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const cambiar = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  async function guardar() {
    if (!form.titulo || !form.fecha || !form.lugar) return;
    setGuardando(true);
    const fechaHora = `${form.fecha}T${form.hora || '00:00'}:00`;
    const body = JSON.stringify({ titulo: form.titulo, fechaHora, lugar: form.lugar, descripcion: form.descripcion, tipo: form.tipo, bandaId });
    const url = esEdicion ? `${API}/bandas/${bandaId}/eventos/${evento!.id}` : `${API}/bandas/${bandaId}/eventos`;
    const method = esEdicion ? 'PUT' : 'POST';
    await fetch(url, { method, headers: authHeaders(), body });
    setGuardando(false);
    onSaved();
  }

  async function eliminar() {
    await fetch(`${API}/bandas/${bandaId}/eventos/${evento!.id}`, { method: 'DELETE', headers: authHeaders() });
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-gray-900">{esEdicion ? 'Editar evento' : 'Nuevo evento'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre *</label>
            <input name="titulo" value={form.titulo} onChange={cambiar}
              className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-cofrade-main/20" />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</label>
            <select name="tipo" value={form.tipo} onChange={cambiar}
              className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none bg-white">
              <option value="concierto">Concierto</option>
              <option value="procesion">Procesión</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha *</label>
              <input type="date" name="fecha" value={form.fecha} onChange={cambiar}
                className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-cofrade-main/20" />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hora</label>
              <input type="time" name="hora" value={form.hora} onChange={cambiar}
                className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-cofrade-main/20" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lugar *</label>
            <input name="lugar" value={form.lugar} onChange={cambiar}
              className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-cofrade-main/20" />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={cambiar} rows={2}
              className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none resize-none focus:ring-2 focus:ring-cofrade-main/20" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-black text-gray-500 hover:bg-gray-50">Cancelar</button>
          <button onClick={guardar} disabled={guardando || !form.titulo || !form.fecha || !form.lugar}
            className="flex-1 py-2.5 rounded-xl bg-cofrade-main text-white text-sm font-black disabled:opacity-50">
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>

        {esEdicion && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {confirmDelete ? (
              <div className="flex gap-2">
                <span className="flex-1 text-xs font-bold text-gray-500 flex items-center">¿Eliminar este evento?</span>
                <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg border text-xs font-black text-gray-500">No</button>
                <button onClick={eliminar} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-black">Sí, eliminar</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="w-full py-2 rounded-xl border border-red-200 text-red-500 text-sm font-black flex items-center justify-center gap-2 hover:bg-red-50">
                <Trash2 size={15} /> Eliminar evento
              </button>
            )}
          </div>
        )}
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
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [modalEvento, setModalEvento] = useState<Partial<Evento> | null | false>(false);

  useEffect(() => {
    const user = parseToken();
    if (!user) return;
    setCanEdit(user.rol === 'admin' || banda.usuarioId === user.id);
  }, [banda.usuarioId]);

  const cargarEventos = useCallback(async () => {
    const res = await fetch(`${API}/bandas/${banda.id}/eventos`, { cache: 'no-store' });
    if (res.ok) setEventos(await res.json());
  }, [banda.id]);

  useEffect(() => {
    if (activeTab === 'agenda') cargarEventos();
  }, [activeTab, cargarEventos]);

  const marchas: any[] = banda.repertorio || [];

  return (
    <div className="min-h-screen bg-white">
      {/* PORTADA */}
      <div className="relative w-full h-56 md:h-80 overflow-hidden bg-cofrade-main">
        <img src="https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=1600" alt="Portada banda"
          className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-cofrade-main/80 via-cofrade-main/20 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* CABECERA */}
        <div className="relative -mt-16 md:-mt-24 mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl border-4 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center">
            {banda.imagenLogo
              ? <img src={banda.imagenLogo} alt="Logo" className="w-full h-full object-contain p-2" />
              : <Music size={48} className="text-cofrade-main/30" />}
          </div>
          <div className="flex gap-3 md:pt-28 pb-1">
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
            {banda.verificada && <CheckCircle2 size={24} className="text-cofrade-gold fill-cofrade-gold/20 shrink-0" />}
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
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.key ? 'border-cofrade-main text-cofrade-main' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}>
              {tab.key === 'repertorio' ? `Repertorio (${marchas.length})` :
               tab.key === 'agenda' ? `Agenda (${eventos.length})` : tab.label}
            </button>
          ))}
        </div>

        {/* CONTENIDO */}
        <div className="pb-16">
          {activeTab === 'publicaciones' && (
            <PostFeed endpoint={`/publicaciones/banda/${banda.id}`} canPost={canEdit} bandaId={banda.id} />
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
                      value={banda.codigoPostal ? `${banda.direccion}, ${banda.codigoPostal}` : banda.direccion} />
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
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Agenda de Actuaciones</h2>
                {canEdit && (
                  <button onClick={() => setModalEvento(EVENTO_VACIO)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-black hover:bg-blue-700 transition-colors">
                    <Plus size={14} /> Nuevo Evento
                  </button>
                )}
              </div>

              {eventos.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-gray-400">
                  <Calendar size={40} className="mb-4 opacity-20" />
                  <p className="font-black uppercase tracking-widest text-xs mb-4">No hay actuaciones publicadas aún</p>
                  {canEdit && (
                    <button onClick={() => setModalEvento(EVENTO_VACIO)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-black hover:bg-blue-700">
                      <Plus size={14} /> Crear actuación
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {eventos
                    .slice()
                    .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
                    .map((e) => (
                      <div key={e.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          e.tipo === 'procesion' ? 'bg-purple-50' : 'bg-blue-50'
                        }`}>
                          {e.tipo === 'procesion'
                            ? <Music size={20} className="text-purple-500" />
                            : <Calendar size={20} className="text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-gray-900 truncate">{e.titulo}</p>
                          <p className="text-xs text-gray-500 font-semibold mt-0.5 flex items-center gap-1">
                            <MapPin size={11} />
                            {new Date(e.fechaHora).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {e.lugar ? ` · ${e.lugar}` : ''}
                          </p>
                        </div>
                        {canEdit && (
                          <button onClick={() => setModalEvento(e)}
                            className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-black hover:bg-blue-100">
                            Editar
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {modalEvento !== false && (
        <EventoModal
          evento={modalEvento}
          bandaId={banda.id}
          onClose={() => setModalEvento(false)}
          onSaved={() => { setModalEvento(false); cargarEventos(); }}
        />
      )}
    </div>
  );
}
