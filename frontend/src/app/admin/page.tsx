'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Building2, Music, MapPin, CheckCircle, Shield, XCircle,
  Eye, Ban, Edit, Trash2, Plus, X,
} from 'lucide-react';
import { API } from '@/lib/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function parseToken(): { id: number; rol: string } | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  } catch { return null; }
}

// --- Badges ---
const ROL_BADGE: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  hermandad: 'bg-purple-100 text-purple-700',
  banda: 'bg-blue-100 text-blue-700',
  cofrade: 'bg-gray-100 text-gray-600',
};

function RolBadge({ rol }: { rol: string }) {
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${ROL_BADGE[rol] ?? 'bg-gray-100 text-gray-600'}`}>{rol}</span>;
}

function EstadoBadge({ verificado, bloqueado }: { verificado: boolean; bloqueado: boolean }) {
  if (bloqueado) return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700"><XCircle size={11} />Bloqueado</span>;
  if (verificado) return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-700"><CheckCircle size={11} />Verificado</span>;
  return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-yellow-100 text-yellow-700"><Shield size={11} />Pendiente</span>;
}

// --- Modal Rol ---
function ModalRol({ userId, rolActual, onClose, onSaved }: { userId: number; rolActual: string; onClose: () => void; onSaved: () => void }) {
  const [rol, setRol] = useState(rolActual);
  async function guardar() {
    await fetch(`${API}/admin/usuarios/${userId}/rol`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ rol }) });
    onSaved();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-gray-900">Cambiar rol</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <select value={rol} onChange={e => setRol(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold bg-white mb-4">
          {['cofrade', 'hermandad', 'banda', 'admin'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border text-sm font-black text-gray-500">Cancelar</button>
          <button onClick={guardar} className="flex-1 py-2 rounded-xl bg-cofrade-main text-white text-sm font-black">Guardar</button>
        </div>
      </div>
    </div>
  );
}

// --- Modal Ciudad ---
function ModalCiudad({ ciudad, onClose, onSaved }: { ciudad: any; onClose: () => void; onSaved: () => void }) {
  const esEdicion = !!ciudad?.id;
  const [form, setForm] = useState({ nombre: ciudad?.nombre ?? '', provincia: ciudad?.provincia ?? '', pais: ciudad?.pais ?? 'España' });
  const cambiar = (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  async function guardar() {
    const url = esEdicion ? `${API}/ciudades/${ciudad.id}` : `${API}/ciudades`;
    await fetch(url, { method: esEdicion ? 'PATCH' : 'POST', headers: authHeaders(), body: JSON.stringify(form) });
    onSaved();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-gray-900">{esEdicion ? 'Editar ciudad' : 'Nueva ciudad'}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="space-y-3">
          {(['nombre', 'provincia', 'pais'] as const).map(field => (
            <div key={field}>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{field} *</label>
              <input name={field} value={form[field]} onChange={cambiar}
                className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-cofrade-main/20" />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-black text-gray-500">Cancelar</button>
          <button onClick={guardar} disabled={!form.nombre || !form.provincia}
            className="flex-1 py-2.5 rounded-xl bg-cofrade-main text-white text-sm font-black disabled:opacity-50">Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ===== PÁGINA PRINCIPAL =====
export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'usuarios' | 'entidades' | 'ciudades'>('usuarios');

  // Stats
  const [stats, setStats] = useState({ totalUsuarios: 0, hermandadesVerificadas: 0, bandasVerificadas: 0, totalCiudades: 0 });

  // Usuarios
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroVerificado, setFiltroVerificado] = useState('');
  const [filtroBloqueado, setFiltroBloqueado] = useState('');
  const [modalRol, setModalRol] = useState<any>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<number | null>(null);

  // Entidades
  const [hermandades, setHermandades] = useState<any[]>([]);
  const [bandas, setBandas] = useState<any[]>([]);

  // Ciudades
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [paginaCiudades, setPaginaCiudades] = useState(1);
  const [totalPaginasCiudades, setTotalPaginasCiudades] = useState(1);
  const [totalCiudades, setTotalCiudades] = useState(0);
  const [buscarCiudad, setBuscarCiudad] = useState('');
  const [modalCiudad, setModalCiudad] = useState<any>(null);
  const [confirmDeleteCiudad, setConfirmDeleteCiudad] = useState<number | null>(null);

  // Guard: solo admin
  useEffect(() => {
    const user = parseToken();
    if (!user || user.rol !== 'admin') router.replace('/');
  }, [router]);

  const cargarStats = useCallback(async () => {
    const res = await fetch(`${API}/admin/estadisticas`, { headers: authHeaders() });
    if (res.ok) setStats(await res.json());
  }, []);

  const cargarUsuarios = useCallback(async () => {
    const params = new URLSearchParams();
    if (filtroRol) params.set('rol', filtroRol);
    if (filtroVerificado) params.set('verificado', filtroVerificado);
    if (filtroBloqueado) params.set('bloqueado', filtroBloqueado);
    const res = await fetch(`${API}/admin/usuarios?${params}`, { headers: authHeaders() });
    if (res.ok) setUsuarios(await res.json());
  }, [filtroRol, filtroVerificado, filtroBloqueado]);

  const cargarEntidades = useCallback(async () => {
    const [rH, rB] = await Promise.all([
      fetch(`${API}/admin/hermandades`, { headers: authHeaders() }),
      fetch(`${API}/admin/bandas`, { headers: authHeaders() }),
    ]);
    if (rH.ok) setHermandades(await rH.json());
    if (rB.ok) setBandas(await rB.json());
  }, []);

  const cargarCiudades = useCallback(async () => {
    const params = new URLSearchParams({ page: String(paginaCiudades), limit: '25' });
    if (buscarCiudad) params.set('buscar', buscarCiudad);
    const res = await fetch(`${API}/admin/ciudades?${params}`, { headers: authHeaders() });
    if (res.ok) {
      const json = await res.json();
      setCiudades(json.data);
      setTotalPaginasCiudades(json.totalPages);
      setTotalCiudades(json.total);
    }
  }, [paginaCiudades, buscarCiudad]);

  useEffect(() => { cargarStats(); }, [cargarStats]);
  useEffect(() => { if (tab === 'usuarios') cargarUsuarios(); }, [tab, cargarUsuarios]);
  useEffect(() => { if (tab === 'entidades') cargarEntidades(); }, [tab, cargarEntidades]);
  useEffect(() => { if (tab === 'ciudades') cargarCiudades(); }, [tab, cargarCiudades]);

  async function accionUsuario(id: number, accion: string) {
    await fetch(`${API}/admin/usuarios/${id}/${accion}`, { method: 'PUT', headers: authHeaders() });
    cargarUsuarios();
    cargarStats();
  }

  async function eliminarUsuario(id: number) {
    await fetch(`${API}/admin/usuarios/${id}`, { method: 'DELETE', headers: authHeaders() });
    setConfirmDeleteUser(null);
    cargarUsuarios();
    cargarStats();
  }

  async function verificarHermandad(id: number) {
    await fetch(`${API}/admin/hermandades/${id}/verificar`, { method: 'PUT', headers: authHeaders() });
    cargarEntidades();
    cargarStats();
  }

  async function eliminarHermandad(id: number) {
    if (!confirm('¿Eliminar esta hermandad?')) return;
    await fetch(`${API}/admin/hermandades/${id}`, { method: 'DELETE', headers: authHeaders() });
    cargarEntidades();
  }

  async function verificarBanda(id: number) {
    await fetch(`${API}/admin/bandas/${id}/verificar`, { method: 'PUT', headers: authHeaders() });
    cargarEntidades();
    cargarStats();
  }

  async function eliminarCiudad(id: number) {
    await fetch(`${API}/ciudades/${id}`, { method: 'DELETE', headers: authHeaders() });
    setConfirmDeleteCiudad(null);
    cargarCiudades();
    cargarStats();
  }

  const STAT_CARDS = [
    { label: 'Usuarios totales', value: stats.totalUsuarios, icon: <Users size={22} />, bg: 'bg-purple-50', text: 'text-purple-600' },
    { label: 'Hermandades verificadas', value: stats.hermandadesVerificadas, icon: <Building2 size={22} />, bg: 'bg-green-50', text: 'text-green-600' },
    { label: 'Bandas verificadas', value: stats.bandasVerificadas, icon: <Music size={22} />, bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Ciudades registradas', value: stats.totalCiudades, icon: <MapPin size={22} />, bg: 'bg-yellow-50', text: 'text-yellow-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* CABECERA */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">Panel de Administración</h1>
          <p className="text-gray-500 font-semibold mt-1">Control total de la plataforma CofradeNet</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center ${s.text} mb-3`}>{s.icon}</div>
              <p className="text-3xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs font-bold text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="border-b border-gray-200 flex gap-8 mb-8">
          {(['usuarios', 'entidades', 'ciudades'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                tab === t ? 'border-cofrade-main text-cofrade-main' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}>
              {t === 'usuarios' ? 'Gestión de Usuarios' : t === 'entidades' ? 'Verificación de Entidades' : 'Gestión de Ciudades'}
            </button>
          ))}
        </div>

        {/* ===== USUARIOS ===== */}
        {tab === 'usuarios' && (
          <div>
            <div className="flex flex-wrap gap-3 mb-6">
              <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold bg-white">
                <option value="">Todos los roles</option>
                {['cofrade', 'hermandad', 'banda', 'admin'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={filtroVerificado} onChange={e => setFiltroVerificado(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold bg-white">
                <option value="">Todos los estados</option>
                <option value="true">Verificados</option>
                <option value="false">Pendientes</option>
              </select>
              <select value={filtroBloqueado} onChange={e => setFiltroBloqueado(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold bg-white">
                <option value="">Sin filtro bloqueo</option>
                <option value="true">Bloqueados</option>
                <option value="false">No bloqueados</option>
              </select>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Usuario', 'Rol', 'Ciudad', 'Estado', 'Acciones'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {usuarios.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-black text-gray-900">{u.nombre}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-3"><RolBadge rol={u.rol} /></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.ciudadResidencia?.nombre ?? '—'}</td>
                      <td className="px-4 py-3"><EstadoBadge verificado={u.verificado} bloqueado={u.estaBloqueado} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button title="Ver" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                            <Eye size={15} />
                          </button>
                          <button title="Verificar" onClick={() => accionUsuario(u.id, 'verificar')}
                            disabled={u.verificado}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-500 disabled:opacity-30">
                            <CheckCircle size={15} />
                          </button>
                          <button title={u.estaBloqueado ? 'Desbloquear' : 'Bloquear'}
                            onClick={() => accionUsuario(u.id, u.estaBloqueado ? 'desbloquear' : 'bloquear')}
                            className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500">
                            <Ban size={15} />
                          </button>
                          <button title="Cambiar rol" onClick={() => setModalRol(u)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500">
                            <Edit size={15} />
                          </button>
                          <button title="Eliminar" onClick={() => setConfirmDeleteUser(u.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                            <Trash2 size={15} />
                          </button>
                        </div>
                        {confirmDeleteUser === u.id && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">¿Eliminar?</span>
                            <button onClick={() => setConfirmDeleteUser(null)} className="text-xs font-black text-gray-400">No</button>
                            <button onClick={() => eliminarUsuario(u.id)} className="text-xs font-black text-red-500">Sí</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {usuarios.length === 0 && (
                <p className="text-center py-10 text-gray-400 text-sm font-bold">Sin usuarios</p>
              )}
            </div>
          </div>
        )}

        {/* ===== ENTIDADES ===== */}
        {tab === 'entidades' && (
          <div className="space-y-8">
            {/* Hermandades */}
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">
                Hermandades <span className="text-gray-400">({hermandades.filter(h => !h.verificada).length} pendientes)</span>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {hermandades.map(h => (
                  <div key={h.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                      <Building2 size={22} className="text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 truncate text-sm">{h.nombre}</p>
                      <p className="text-xs text-gray-400 truncate">{h.ciudad?.nombre} · {h.usuario?.email ?? 'Sin usuario'}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {h.verificada
                          ? <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-black">Verificada</span>
                          : <button onClick={() => verificarHermandad(h.id)}
                              className="px-3 py-1 rounded-lg bg-purple-600 text-white text-xs font-black">Verificar</button>
                        }
                        <button onClick={() => eliminarHermandad(h.id)}
                          className="px-3 py-1 rounded-lg border border-red-200 text-red-500 text-xs font-black hover:bg-red-50">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {hermandades.length === 0 && <p className="text-gray-400 text-sm font-bold">Sin hermandades</p>}
              </div>
            </div>

            {/* Bandas */}
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">
                Bandas <span className="text-gray-400">({bandas.filter(b => !b.verificada).length} pendientes)</span>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {bandas.map(b => (
                  <div key={b.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Music size={22} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 truncate text-sm">{b.nombre}</p>
                      <p className="text-xs text-gray-400 truncate">{b.ciudad?.nombre} · {b.usuario?.email ?? 'Sin usuario'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {b.verificada
                          ? <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-black">Verificada</span>
                          : <button onClick={() => verificarBanda(b.id)}
                              className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-black">Verificar</button>
                        }
                      </div>
                    </div>
                  </div>
                ))}
                {bandas.length === 0 && <p className="text-gray-400 text-sm font-bold">Sin bandas</p>}
              </div>
            </div>
          </div>
        )}

        {/* ===== CIUDADES ===== */}
        {tab === 'ciudades' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                Ciudades registradas
                {totalCiudades > 0 && <span className="ml-2 text-gray-400 font-semibold normal-case">({totalCiudades})</span>}
              </h3>
              <button onClick={() => setModalCiudad({})}
                className="flex items-center gap-2 px-4 py-2 bg-cofrade-main text-white rounded-full text-xs font-black hover:opacity-90">
                <Plus size={14} /> Nueva Ciudad
              </button>
            </div>

            <input
              type="search"
              placeholder="Buscar ciudad o provincia..."
              value={buscarCiudad}
              onChange={e => { setBuscarCiudad(e.target.value); setPaginaCiudades(1); }}
              className="w-full sm:w-80 mb-4 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-cofrade-main/20"
            />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Ciudad', 'Provincia', 'Hermandades', 'Bandas', 'Acciones'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ciudades.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-black text-gray-900">{c.nombre}</td>
                      <td className="px-4 py-3 text-gray-500">{c.provincia}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black">{c.numHermandades ?? 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black">{c.numBandas ?? 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setModalCiudad(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500">
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteCiudad(c.id)}
                            disabled={(c.numHermandades ?? 0) > 0 || (c.numBandas ?? 0) > 0}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-30 disabled:cursor-not-allowed">
                            <Trash2 size={15} />
                          </button>
                        </div>
                        {confirmDeleteCiudad === c.id && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">¿Eliminar?</span>
                            <button onClick={() => setConfirmDeleteCiudad(null)} className="text-xs font-black text-gray-400">No</button>
                            <button onClick={() => eliminarCiudad(c.id)} className="text-xs font-black text-red-500">Sí</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ciudades.length === 0 && (
                <p className="text-center py-10 text-gray-400 text-sm font-bold">Sin ciudades</p>
              )}

              {totalPaginasCiudades > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold">
                    Pág. {paginaCiudades} de {totalPaginasCiudades}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPaginaCiudades(p => Math.max(1, p - 1))}
                      disabled={paginaCiudades === 1}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-black text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ← Anterior
                    </button>
                    <button
                      onClick={() => setPaginaCiudades(p => Math.min(totalPaginasCiudades, p + 1))}
                      disabled={paginaCiudades === totalPaginasCiudades}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-black text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {modalRol && (
        <ModalRol userId={modalRol.id} rolActual={modalRol.rol}
          onClose={() => setModalRol(null)}
          onSaved={() => { setModalRol(null); cargarUsuarios(); }} />
      )}

      {modalCiudad !== null && (
        <ModalCiudad ciudad={modalCiudad}
          onClose={() => setModalCiudad(null)}
          onSaved={() => { setModalCiudad(null); cargarCiudades(); cargarStats(); }} />
      )}
    </div>
  );
}
