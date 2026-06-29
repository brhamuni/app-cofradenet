'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MapPin, Church, Calendar, Hash, Home, CheckCircle2, Edit3, ChevronRight, ChevronDown, Clock, Users, Music, Trash2, Plus } from 'lucide-react';
import EditHermandadModal from '../profile/EditHermandadModal';
import PostFeed from '../publicaciones/PostFeed';
import FollowButton from '../seguimientos/FollowButton';
import CompartirUbicacion from '../ubicacion/CompartirUbicacion';
import GaleriaMedia from '../media/GaleriaMedia';
import { resolveImg, API } from '@/lib/api';
import { parseTokenFromStorage } from '@/lib/jwt';

function authHeader(): HeadersInit {
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Itinerario {
  id: number;
  anio: number;
  horarioSalida?: string;
  horarioEntrada?: string;
  recorrido?: string;
}

interface Participacion {
  id: number;
  bandaId: number;
  anio: number;
  ubicacion?: string;
  banda?: { id: number; nombre: string };
}

// ─── ProcesonExpandible (admin/owner only) ────────────────────────────────────

function ProcesonExpandible({ procesion }: { procesion: any }) {
  const [expanded, setExpanded] = useState(false);

  const [itinerarios, setItinerarios] = useState<Itinerario[]>([]);
  const [itLoading, setItLoading] = useState(false);
  const [itSaving, setItSaving] = useState(false);
  const [itError, setItError] = useState<string | null>(null);
  const [activeItinerario, setActiveItinerario] = useState<Itinerario | null>(null);
  const [itEditing, setItEditing] = useState(false);
  const [itForm, setItForm] = useState({
    anio: new Date().getFullYear(),
    horarioSalida: '',
    horarioEntrada: '',
    recorrido: '',
  });

  const [participaciones, setParticipaciones] = useState<Participacion[]>([]);
  const [partLoading, setPartLoading] = useState(false);
  const [partSaving, setPartSaving] = useState(false);
  const [partError, setPartError] = useState<string | null>(null);
  const [showAddBanda, setShowAddBanda] = useState(false);
  const [bandaForm, setBandaForm] = useState({
    bandaId: '',
    ubicacion: '',
    anio: new Date().getFullYear(),
  });

  const loadData = useCallback(async () => {
    setItLoading(true);
    setPartLoading(true);
    setItError(null);
    setPartError(null);
    try {
      const [itRes, partRes] = await Promise.all([
        fetch(`${API}/procesiones/${procesion.id}/itinerario`),
        fetch(`${API}/procesiones/${procesion.id}/participaciones`),
      ]);
      if (itRes.ok) {
        const data: Itinerario[] = await itRes.json();
        setItinerarios(data);
        if (data.length > 0) {
          const latest = data[0];
          setActiveItinerario(latest);
          setItForm({
            anio: latest.anio,
            horarioSalida: latest.horarioSalida ?? '',
            horarioEntrada: latest.horarioEntrada ?? '',
            recorrido: latest.recorrido ?? '',
          });
        }
      }
      if (partRes.ok) {
        setParticipaciones(await partRes.json());
      }
    } catch {
      setItError('Error al cargar datos');
    } finally {
      setItLoading(false);
      setPartLoading(false);
    }
  }, [procesion.id]);

  useEffect(() => {
    if (expanded) loadData();
  }, [expanded, loadData]);

  async function handleSaveItinerario() {
    setItSaving(true);
    setItError(null);
    try {
      const body = {
        anio: Number(itForm.anio),
        horarioSalida: itForm.horarioSalida || undefined,
        horarioEntrada: itForm.horarioEntrada || undefined,
        recorrido: itForm.recorrido || undefined,
      };

      let res: Response;
      if (activeItinerario) {
        res = await fetch(`${API}/procesiones/${procesion.id}/itinerario`, {
          method: 'PUT',
          headers: authHeader(),
          body: JSON.stringify({ itinerarioId: activeItinerario.id, ...body }),
        });
      } else {
        res = await fetch(`${API}/procesiones/${procesion.id}/itinerario`, {
          method: 'POST',
          headers: authHeader(),
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? `Error ${res.status}`);
      }
      const saved: Itinerario = await res.json();
      setActiveItinerario(saved);
      setItinerarios(prev => {
        const idx = prev.findIndex(it => it.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
      setItEditing(false);
    } catch (e: any) {
      setItError(e.message ?? 'Error al guardar itinerario');
    } finally {
      setItSaving(false);
    }
  }

  async function handleAddBanda() {
    if (!bandaForm.bandaId.trim()) return;
    setPartSaving(true);
    setPartError(null);
    try {
      const res = await fetch(`${API}/procesiones/${procesion.id}/participaciones`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          bandaId: Number(bandaForm.bandaId),
          anio: Number(bandaForm.anio),
          ubicacion: bandaForm.ubicacion || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? `Error ${res.status}`);
      }
      const added: Participacion = await res.json();
      setParticipaciones(prev => [...prev, added]);
      setBandaForm({ bandaId: '', ubicacion: '', anio: new Date().getFullYear() });
      setShowAddBanda(false);
    } catch (e: any) {
      setPartError(e.message ?? 'Error al añadir banda');
    } finally {
      setPartSaving(false);
    }
  }

  async function handleDeleteParticipacion(pid: number) {
    setPartError(null);
    try {
      const res = await fetch(`${API}/procesiones/${procesion.id}/participaciones/${pid}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setParticipaciones(prev => prev.filter(p => p.id !== pid));
    } catch (e: any) {
      setPartError(e.message ?? 'Error al eliminar banda');
    }
  }

  return (
    <div className="rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-4 p-4 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-cofrade-main/10 flex items-center justify-center shrink-0">
          <Clock size={18} className="text-cofrade-main" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-900 truncate">{procesion.nombre}</p>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">
            {procesion.diaSemana} · Salida: {procesion.horaSalida}
            {procesion.horaEntrada ? ` · Entrada: ${procesion.horaEntrada}` : ''}
          </p>
        </div>
        {expanded
          ? <ChevronDown size={16} className="text-cofrade-main shrink-0" />
          : <ChevronRight size={16} className="text-gray-300 shrink-0" />
        }
      </button>

      {expanded && (
        <div className="bg-gray-50 border-t border-gray-100 p-4 space-y-6">
          {(itLoading || partLoading) ? (
            <p className="text-xs text-gray-400 font-semibold text-center py-4">Cargando...</p>
          ) : (
            <>
              {/* ── Itinerario ────────────────────────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Itinerario {activeItinerario ? activeItinerario.anio : ''}
                  </p>
                  {!itEditing && (
                    <button
                      onClick={() => setItEditing(true)}
                      className="flex items-center gap-1 text-xs font-black text-cofrade-main hover:underline"
                    >
                      <Edit3 size={12} />
                      {activeItinerario ? 'Editar itinerario' : 'Añadir itinerario'}
                    </button>
                  )}
                </div>

                {!itEditing && activeItinerario && (
                  <div className="space-y-1 text-sm text-gray-700">
                    {activeItinerario.horarioSalida && (
                      <p><span className="font-black text-gray-500 text-xs uppercase tracking-wide">Salida: </span>{activeItinerario.horarioSalida}</p>
                    )}
                    {activeItinerario.horarioEntrada && (
                      <p><span className="font-black text-gray-500 text-xs uppercase tracking-wide">Entrada: </span>{activeItinerario.horarioEntrada}</p>
                    )}
                    {activeItinerario.recorrido && (
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">{activeItinerario.recorrido}</p>
                    )}
                  </div>
                )}

                {!itEditing && !activeItinerario && (
                  <p className="text-xs text-gray-400 italic">Sin itinerario registrado para este año.</p>
                )}

                {itEditing && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Salida</label>
                        <input type="text" placeholder="HH:MM" value={itForm.horarioSalida}
                          onChange={e => setItForm(f => ({ ...f, horarioSalida: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cofrade-main/30" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Entrada</label>
                        <input type="text" placeholder="HH:MM" value={itForm.horarioEntrada}
                          onChange={e => setItForm(f => ({ ...f, horarioEntrada: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cofrade-main/30" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Año</label>
                        <input type="number" value={itForm.anio}
                          onChange={e => setItForm(f => ({ ...f, anio: Number(e.target.value) }))}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cofrade-main/30" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Recorrido</label>
                      <textarea rows={3} placeholder="Describe el recorrido de la procesión..." value={itForm.recorrido}
                        onChange={e => setItForm(f => ({ ...f, recorrido: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cofrade-main/30 resize-none" />
                    </div>
                    {itError && <p className="text-xs text-red-500 font-semibold">{itError}</p>}
                    <div className="flex gap-2">
                      <button onClick={handleSaveItinerario} disabled={itSaving}
                        className="bg-cofrade-main text-white rounded-xl px-4 py-2 text-xs font-black disabled:opacity-60 hover:brightness-110 transition-all">
                        {itSaving ? 'Guardando...' : 'Guardar itinerario'}
                      </button>
                      <button onClick={() => setItEditing(false)}
                        className="bg-white border border-gray-200 text-gray-600 rounded-xl px-4 py-2 text-xs font-black hover:bg-gray-100 transition-all">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {!itEditing && itinerarios.length > 1 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {itinerarios.map(it => (
                      <button key={it.id}
                        onClick={() => { setActiveItinerario(it); setItForm({ anio: it.anio, horarioSalida: it.horarioSalida ?? '', horarioEntrada: it.horarioEntrada ?? '', recorrido: it.recorrido ?? '' }); }}
                        className={`px-3 py-1 rounded-full text-xs font-black transition-all ${activeItinerario?.id === it.id ? 'bg-cofrade-main text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-cofrade-main hover:text-cofrade-main'}`}>
                        {it.anio}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Ubicación en tiempo real ─────────────────────────────── */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Ubicación en tiempo real</p>
                <CompartirUbicacion procesionId={procesion.id} />
              </div>

              {/* ── Bandas participantes ──────────────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bandas participantes</p>
                  {!showAddBanda && (
                    <button onClick={() => setShowAddBanda(true)}
                      className="flex items-center gap-1 text-xs font-black text-cofrade-main hover:underline">
                      <Plus size={12} /> Añadir banda
                    </button>
                  )}
                </div>

                {participaciones.length === 0 && !showAddBanda && (
                  <p className="text-xs text-gray-400 italic">Sin bandas registradas.</p>
                )}

                {participaciones.length > 0 && (
                  <div className="space-y-2">
                    {participaciones.map(p => (
                      <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2 border border-gray-100">
                        <div className="w-7 h-7 rounded-lg bg-cofrade-gold/10 flex items-center justify-center shrink-0">
                          <Music size={13} className="text-cofrade-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-900 truncate">{p.banda?.nombre ?? `Banda #${p.bandaId}`}</p>
                          <p className="text-[11px] text-gray-500 font-semibold">{p.anio}{p.ubicacion ? ` · ${p.ubicacion}` : ''}</p>
                        </div>
                        <button onClick={() => handleDeleteParticipacion(p.id)}
                          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {partError && <p className="text-xs text-red-500 font-semibold mt-2">{partError}</p>}

                {showAddBanda && (
                  <div className="mt-3 bg-white rounded-xl border border-gray-200 p-3 space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nueva participación</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">ID Banda</label>
                        <input type="number" placeholder="ID" value={bandaForm.bandaId}
                          onChange={e => setBandaForm(f => ({ ...f, bandaId: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cofrade-main/30" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Ubicación</label>
                        <input type="text" placeholder="Ej: Detrás del paso" value={bandaForm.ubicacion}
                          onChange={e => setBandaForm(f => ({ ...f, ubicacion: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cofrade-main/30" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Año</label>
                        <input type="number" value={bandaForm.anio}
                          onChange={e => setBandaForm(f => ({ ...f, anio: Number(e.target.value) }))}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cofrade-main/30" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddBanda} disabled={partSaving || !bandaForm.bandaId.trim()}
                        className="bg-cofrade-main text-white rounded-xl px-4 py-2 text-xs font-black disabled:opacity-60 hover:brightness-110 transition-all">
                        {partSaving ? 'Añadiendo...' : 'Añadir'}
                      </button>
                      <button onClick={() => { setShowAddBanda(false); setBandaForm({ bandaId: '', ubicacion: '', anio: new Date().getFullYear() }); }}
                        className="bg-white border border-gray-200 text-gray-600 rounded-xl px-4 py-2 text-xs font-black hover:bg-gray-100 transition-all">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Read-only procesión card ─────────────────────────────────────────────────

function formatFecha(fecha: string | undefined): string {
  if (!fecha) return '';
  const d = new Date(fecha + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ProcesonCard({ procesion }: { procesion: any }) {
  return (
    <Link href={`/procesion/${procesion.id}`} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-cofrade-main/30 hover:bg-gray-50 transition-all">
      <div className="w-10 h-10 rounded-xl bg-cofrade-main/10 flex items-center justify-center shrink-0">
        <Clock size={18} className="text-cofrade-main" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-gray-900 truncate">{procesion.nombre}</p>
        <p className="text-xs text-gray-500 font-semibold mt-0.5">{procesion.diaSemana}{procesion.fecha ? ` · ${formatFecha(procesion.fecha)}` : ''}</p>
        <p className="text-xs text-gray-400 font-semibold">Salida: {procesion.horaSalida}{procesion.horaEntrada ? ` · Entrada: ${procesion.horaEntrada}` : ''}</p>
      </div>
      <ChevronRight size={16} className="text-cofrade-main shrink-0" />
    </Link>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'publicaciones', label: 'Publicaciones' },
  { key: 'info', label: 'Información' },
  { key: 'procesiones', label: 'Procesiones' },
  { key: 'galeria', label: 'Galería' },
] as const;
type Tab = typeof TABS[number]['key'];

// ─── Main component ───────────────────────────────────────────────────────────

export default function HermandadProfile({ hermandad }: { hermandad: any }) {
  const [canEdit, setCanEdit] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('publicaciones');
  const [editOpen, setEditOpen] = useState(false);
  const [seguidores, setSeguidores] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | undefined>();

  useEffect(() => {
    const user = parseTokenFromStorage();
    if (!user) return;
    setUserId(user.id);
    setCanEdit(user.rol === 'admin' || hermandad.usuarioId === user.id);
  }, [hermandad.usuarioId]);

  const titulares: string[] = Array.isArray(hermandad.titulares)
    ? hermandad.titulares
    : hermandad.titulares ? String(hermandad.titulares).split(',').map((t: string) => t.trim()) : [];

  const [procesonesTab, setProcesonesTab] = useState<'futuras' | 'pasadas'>('futuras');

  const today = new Date().toISOString().split('T')[0];
  const procesiones: any[] = hermandad.procesiones || [];
  const procesionsFuturas = [...procesiones]
    .filter(p => (p.fecha || '') >= today)
    .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  const procesionsPasadas = [...procesiones]
    .filter(p => (p.fecha || '') < today)
    .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  return (
    <div className="min-h-screen bg-white">
      {/* PORTADA */}
      <div className="relative w-full h-36 md:h-52 overflow-hidden bg-cofrade-main">
        <img src="https://images.unsplash.com/photo-1559564484-e48b3e040ff4?q=80&w=1600" alt="Portada"
          className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-linear-to-t from-cofrade-main/80 via-cofrade-main/20 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* CABECERA */}
        <div className="relative -mt-12 md:-mt-16 mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center">
            {resolveImg(hermandad.imagenEscudo)
              ? <img src={resolveImg(hermandad.imagenEscudo)} alt="Escudo" className="w-full h-full object-cover" />
              : <Church size={48} className="text-cofrade-main/30" />}
          </div>
          <div className="flex gap-3 md:pt-20 pb-1">
            {canEdit ? (
              <button onClick={() => setEditOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-full font-bold text-sm hover:bg-gray-50 transition-all shadow-sm">
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
              <span className="flex items-center gap-1.5"><MapPin size={15} className="text-gray-400" />{hermandad.ciudad.nombre}, Andalucía</span>
            )}
            {hermandad.añoFundacion && (
              <span className="flex items-center gap-1.5"><Calendar size={15} className="text-gray-400" />Fundada en {hermandad.añoFundacion}</span>
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
                <span key={i} className="px-3 py-1 bg-cofrade-main/10 text-cofrade-main text-xs font-black rounded-full uppercase tracking-wider">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="border-b border-gray-200 flex gap-6 sm:gap-8 mb-8 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap shrink-0 ${
                activeTab === tab.key ? 'border-cofrade-main text-cofrade-main' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}>
              {tab.key === 'procesiones' ? `Procesiones (${procesiones.length})` : tab.label}
            </button>
          ))}
        </div>

        {/* CONTENIDO */}
        <div className="pb-16">
          {activeTab === 'publicaciones' && (
            <PostFeed endpoint={`/publicaciones/hermandad/${hermandad.id}`} canPost={canEdit} hermandadId={hermandad.id} />
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
                      value={hermandad.codigoPostal ? `${hermandad.direccion}, ${hermandad.codigoPostal}` : hermandad.direccion} />
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
              <>
                {/* Sub-pestañas futuras / pasadas */}
                <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setProcesonesTab('futuras')}
                    className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                      procesonesTab === 'futuras'
                        ? 'bg-white text-cofrade-main shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Próximas · {procesionsFuturas.length}
                  </button>
                  <button
                    onClick={() => setProcesonesTab('pasadas')}
                    className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                      procesonesTab === 'pasadas'
                        ? 'bg-white text-gray-600 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Pasadas · {procesionsPasadas.length}
                  </button>
                </div>

                {(() => {
                  const lista = procesonesTab === 'futuras' ? procesionsFuturas : procesionsPasadas;
                  return lista.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-gray-400">
                      <Church size={36} className="mb-3 opacity-20" />
                      <p className="font-black uppercase tracking-widest text-xs">
                        {procesonesTab === 'futuras' ? 'No hay procesiones próximas' : 'No hay procesiones pasadas'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lista.map((p: any) =>
                        canEdit
                          ? <ProcesonExpandible key={p.id} procesion={p} />
                          : <ProcesonCard key={p.id} procesion={p} />
                      )}
                    </div>
                  );
                })()}
              </>
            )
          )}

          {activeTab === 'galeria' && (
            <GaleriaMedia hermandadId={hermandad.id} canEdit={canEdit} userId={userId} />
          )}
        </div>
      </div>

      <EditHermandadModal hermandad={hermandad} isOpen={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}
