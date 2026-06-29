'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  MapPin,
  Music,
  Church,
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
  List,
  Download,
} from 'lucide-react';
import api from '@/app/api/axios';
import { API, resolveImg } from '@/lib/api';

type TipoFiltro = 'all' | 'procesion' | 'concierto';
type Vista = 'lista' | 'calendario';

interface EventoCalendario {
  id: number;
  tipo: 'procesion' | 'concierto';
  titulo: string;
  fecha: string;
  hora?: string;
  ciudad?: string;
  ciudadId?: number;
  lugar?: string;
  hermandad?: { id: number; nombre: string; nombrePopular?: string; imagenEscudo?: string };
  banda?: { id: number; nombre: string; imagenLogo?: string };
}

function buildGoogleCalendarUrl(ev: EventoCalendario): string {
  const start = new Date(ev.fecha);
  const end = new Date(start.getTime() + 3600000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace('.000', '');
  const details =
    ev.tipo === 'procesion'
      ? `Procesión de ${ev.hermandad?.nombrePopular || ev.hermandad?.nombre || ''}`
      : `Concierto de ${ev.banda?.nombre || ''}`;
  return (
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(ev.titulo)}` +
    `&dates=${fmt(start)}/${fmt(end)}` +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(ev.lugar || ev.ciudad || '')}`
  );
}

function formatFecha(fecha: string): string {
  try {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return fecha;
  }
}

function formatHora(fecha: string, hora?: string): string {
  if (hora) return hora;
  try {
    return new Date(fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

const IMPORTANT_KEY = 'cofradenet_eventos_importantes';
const EVENTS_META_KEY = 'cofradenet_eventos_meta';

function getImportantes(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(IMPORTANT_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function toggleImportante(key: string, ev?: EventoCalendario): Set<string> {
  const set = getImportantes();
  if (set.has(key)) {
    set.delete(key);
  } else {
    set.add(key);
    if (ev) {
      try {
        const metaRaw = localStorage.getItem(EVENTS_META_KEY);
        const meta: any[] = metaRaw ? JSON.parse(metaRaw) : [];
        if (!meta.find((m) => m.key === key)) {
          meta.push({
            key,
            tipo: ev.tipo,
            titulo: ev.titulo,
            fecha: ev.fecha,
            entidad: ev.tipo === 'procesion'
              ? (ev.hermandad?.nombrePopular || ev.hermandad?.nombre || '')
              : (ev.banda?.nombre || ''),
          });
          localStorage.setItem(EVENTS_META_KEY, JSON.stringify(meta));
        }
      } catch {}
    }
  }
  localStorage.setItem(IMPORTANT_KEY, JSON.stringify([...set]));
  window.dispatchEvent(new Event('importantes-change'));
  return set;
}

export default function CalendarioPage() {
  const router = useRouter();
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<TipoFiltro>('all');
  const [filtroCiudad, setFiltroCiudad] = useState('all');
  const [importantes, setImportantes] = useState<Set<string>>(new Set());
  const [vista, setVista] = useState<Vista>('lista');
  const [calMes, setCalMes] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/login'); return; }
    setImportantes(getImportantes());
  }, [router]);

  useEffect(() => {
    const onchange = () => setImportantes(getImportantes());
    window.addEventListener('importantes-change', onchange);
    return () => window.removeEventListener('importantes-change', onchange);
  }, []);

  const cargar = useCallback(async (tipo: TipoFiltro) => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ tipo });
      const { data } = await api.get(`/calendario/mis-eventos?${params}`);
      setEventos(Array.isArray(data) ? data : []);
    } catch {
      setEventos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(filtroTipo); }, [filtroTipo, cargar]);

  const ciudades = Array.from(new Set(eventos.map((e) => e.ciudad).filter(Boolean)));

  const filtrados = eventos.filter((e) => {
    if (filtroCiudad !== 'all' && e.ciudad !== filtroCiudad) return false;
    return true;
  });

  const proximos = filtrados.slice(0, 4);

  // Calendar helpers
  const eventosPorDia = useMemo(() => {
    const map = new Map<string, EventoCalendario[]>();
    for (const ev of filtrados) {
      const key = ev.fecha.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return map;
  }, [filtrados]);

  const calDias = useMemo(() => {
    const year = calMes.getFullYear();
    const month = calMes.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const startOffset = (firstDay + 6) % 7; // shift so Mon=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [
      ...Array(startOffset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calMes]);

  const diaStr = (day: number) => {
    const y = calMes.getFullYear();
    const m = String(calMes.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-${String(day).padStart(2, '0')}`;
  };

  const eventosDiaSeleccionado = diaSeleccionado ? (eventosPorDia.get(diaSeleccionado) ?? []) : [];

  const handleExportarIcs = () => {
    const token = localStorage.getItem('token');
    const url = `${API}/calendario/exportar-ics?tipo=${filtroTipo}${filtroCiudad !== 'all' ? '' : ''}`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', 'mi-calendario-cofradenet.ics');
    document.body.appendChild(a);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.click();
        URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      });
  };

  const eventoKey = (e: EventoCalendario) => `${e.tipo}-${e.id}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 mb-1">Mi Calendario</h1>
            <p className="text-gray-500 text-sm font-semibold">
              Eventos de las hermandades y bandas que sigues
            </p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setVista('lista')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${vista === 'lista' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List size={14} /> Lista
            </button>
            <button
              onClick={() => setVista('calendario')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${vista === 'calendario' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Calendar size={14} /> Calendario
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Tipo */}
            <div className="flex-1">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Tipo de evento</p>
              <div className="flex gap-2">
                {(['all', 'procesion', 'concierto'] as TipoFiltro[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFiltroTipo(t)}
                    className={`px-4 py-2 rounded-xl text-sm font-black transition-colors ${
                      filtroTipo === t
                        ? 'bg-cofrade-main text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t === 'all' && 'Todos'}
                    {t === 'procesion' && 'Procesiones'}
                    {t === 'concierto' && 'Conciertos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Ciudad */}
            <div className="flex-1">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Ciudad</p>
              <select
                value={filtroCiudad}
                onChange={(e) => setFiltroCiudad(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-cofrade-main/20 bg-white"
              >
                <option value="all">Todas las ciudades</option>
                {ciudades.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Exportar */}
            <div className="flex items-end">
              <button
                onClick={handleExportarIcs}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-black"
              >
                <Download size={16} />
                Exportar ICS
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Vista principal */}
          <div className="lg:col-span-2">
            {vista === 'calendario' ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Cabecera mes */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <button onClick={() => { setCalMes(m => new Date(m.getFullYear(), m.getMonth() - 1, 1)); setDiaSeleccionado(null); }}
                    className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                    <ChevronLeft size={18} className="text-gray-500" />
                  </button>
                  <p className="font-black text-gray-900 capitalize">
                    {calMes.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </p>
                  <button onClick={() => { setCalMes(m => new Date(m.getFullYear(), m.getMonth() + 1, 1)); setDiaSeleccionado(null); }}
                    className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                    <ChevronRight size={18} className="text-gray-500" />
                  </button>
                </div>

                {/* Días semana */}
                <div className="grid grid-cols-7 border-b border-gray-100">
                  {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => (
                    <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest py-2">{d}</div>
                  ))}
                </div>

                {/* Celdas */}
                <div className="grid grid-cols-7">
                  {calDias.map((day, i) => {
                    if (!day) return <div key={`empty-${i}`} className="min-h-15 border-b border-r border-gray-50 last:border-r-0" />;
                    const ds = diaStr(day);
                    const evsDia = eventosPorDia.get(ds) ?? [];
                    const isSelected = diaSeleccionado === ds;
                    const today = new Date();
                    const isToday = today.getFullYear() === calMes.getFullYear() && today.getMonth() === calMes.getMonth() && today.getDate() === day;
                    return (
                      <button
                        key={ds}
                        onClick={() => setDiaSeleccionado(isSelected ? null : ds)}
                        className={`min-h-15 border-b border-r border-gray-50 last:border-r-0 flex flex-col items-center pt-2 pb-1.5 gap-1 transition-colors ${
                          isSelected ? 'bg-cofrade-main/10' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday ? 'bg-cofrade-main text-white' : isSelected ? 'text-cofrade-main' : 'text-gray-700'
                        }`}>{day}</span>
                        {evsDia.length > 0 && (
                          <div className="flex gap-0.5 flex-wrap justify-center px-1">
                            {evsDia.slice(0, 3).map((ev, ei) => (
                              <span key={ei} className={`w-1.5 h-1.5 rounded-full ${ev.tipo === 'procesion' ? 'bg-cofrade-main' : 'bg-blue-500'}`} />
                            ))}
                            {evsDia.length > 3 && <span className="text-[8px] font-black text-gray-400">+{evsDia.length - 3}</span>}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Eventos del día seleccionado */}
                {diaSeleccionado && eventosDiaSeleccionado.length > 0 && (
                  <div className="border-t border-gray-100 p-4 space-y-3">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      {new Date(diaSeleccionado + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    {eventosDiaSeleccionado.map((ev) => {
                      const key = eventoKey(ev);
                      return (
                        <div key={key} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ev.tipo === 'procesion' ? 'bg-cofrade-main/10' : 'bg-blue-100'}`}>
                            {ev.tipo === 'procesion' ? <Church size={15} className="text-cofrade-main" /> : <Music size={15} className="text-blue-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-gray-900 truncate">{ev.titulo}</p>
                            <p className="text-xs text-gray-500 font-semibold">{ev.tipo === 'procesion' ? (ev.hermandad?.nombrePopular || ev.hermandad?.nombre) : ev.banda?.nombre}</p>
                          </div>
                          {ev.hora && <span className="text-xs font-bold text-gray-500 shrink-0">{ev.hora}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
                {diaSeleccionado && eventosDiaSeleccionado.length === 0 && (
                  <div className="border-t border-gray-100 p-4 text-center text-xs text-gray-400 font-semibold">
                    Sin eventos este día
                  </div>
                )}
              </div>
            ) : cargando ? (
              <Skeleton />
            ) : filtrados.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-black text-gray-500 px-1">
                  {filtrados.length} evento{filtrados.length !== 1 ? 's' : ''}
                </p>
                {filtrados.map((ev) => {
                  const key = eventoKey(ev);
                  const esImportante = importantes.has(key);
                  return (
                    <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          ev.tipo === 'procesion' ? 'bg-cofrade-main/10' : 'bg-blue-100'
                        }`}>
                          {ev.tipo === 'procesion'
                            ? <Church size={22} className="text-cofrade-main" />
                            : <Music size={22} className="text-blue-600" />
                          }
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-gray-900 text-sm leading-snug mb-1">{ev.titulo}</h3>
                          <p className="text-xs text-gray-500 font-semibold mb-2">
                            {ev.tipo === 'procesion'
                              ? ev.hermandad?.nombrePopular || ev.hermandad?.nombre
                              : ev.banda?.nombre}
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500 font-semibold">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatFecha(ev.fecha)}
                              {formatHora(ev.fecha, ev.hora) && ` · ${formatHora(ev.fecha, ev.hora)}`}
                            </span>
                            {ev.ciudad && (
                              <span className="flex items-center gap-1">
                                <MapPin size={12} />
                                {ev.lugar ? `${ev.lugar}, ${ev.ciudad}` : ev.ciudad}
                              </span>
                            )}
                            {esImportante && (
                              <span className="flex items-center gap-1 text-cofrade-main">
                                <Bell size={12} />
                                Marcado como importante
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                          <button
                            title={esImportante ? 'Quitar notificación' : 'Marcar como importante'}
                            onClick={() => setImportantes(toggleImportante(key, ev))}
                            className={`p-2 rounded-xl transition-colors ${
                              esImportante
                                ? 'bg-cofrade-main/10 text-cofrade-main hover:bg-cofrade-main/20'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {esImportante ? <Bell size={16} /> : <BellOff size={16} />}
                          </button>
                          <a
                            href={buildGoogleCalendarUrl(ev)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-[10px] font-black text-center whitespace-nowrap"
                          >
                            + Cal
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Próximos */}
            {proximos.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-black text-gray-900 mb-4 text-sm uppercase tracking-wide">Próximos eventos</h3>
                <div className="space-y-3">
                  {proximos.map((ev) => (
                    <div key={eventoKey(ev)} className="flex gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        ev.tipo === 'procesion' ? 'bg-cofrade-main/10' : 'bg-blue-100'
                      }`}>
                        {ev.tipo === 'procesion'
                          ? <Church size={14} className="text-cofrade-main" />
                          : <Music size={14} className="text-blue-600" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-gray-900 line-clamp-2">{ev.titulo}</p>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{formatFecha(ev.fecha)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sincronizar */}
            <div className="bg-cofrade-main/5 border border-cofrade-main/20 rounded-2xl p-5">
              <h3 className="font-black text-cofrade-main mb-2">Sincronizar Calendario</h3>
              <p className="text-xs text-cofrade-main/70 font-semibold mb-4">
                Añade estos eventos a tu calendario personal
              </p>
              <div className="space-y-2">
                <button
                  onClick={handleExportarIcs}
                  className="w-full px-4 py-2.5 bg-white border border-cofrade-main/30 text-cofrade-main rounded-xl hover:bg-cofrade-main/10 transition-colors text-sm font-black"
                >
                  📅 Google Calendar (ICS)
                </button>
                <button
                  onClick={handleExportarIcs}
                  className="w-full px-4 py-2.5 bg-white border border-cofrade-main/30 text-cofrade-main rounded-xl hover:bg-cofrade-main/10 transition-colors text-sm font-black"
                >
                  🍎 Apple Calendar (ICS)
                </button>
                <button
                  onClick={handleExportarIcs}
                  className="w-full px-4 py-2.5 bg-white border border-cofrade-main/30 text-cofrade-main rounded-xl hover:bg-cofrade-main/10 transition-colors text-sm font-black"
                >
                  📧 Outlook (ICS)
                </button>
              </div>
            </div>

            {/* Notificaciones info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <Bell size={16} className="text-cofrade-main" />
                Notificaciones
              </h3>
              <p className="text-xs text-gray-500 font-semibold mb-3">
                Marca eventos con <Bell size={11} className="inline mx-0.5" /> para recibirlos en el centro de notificaciones.
              </p>
              <p className="text-xs text-gray-400 font-semibold">
                {importantes.size} evento{importantes.size !== 1 ? 's' : ''} marcado{importantes.size !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded-full w-3/4" />
              <div className="h-2 bg-gray-100 rounded-full w-1/2" />
              <div className="h-2 bg-gray-100 rounded-full w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center py-20 text-center px-8">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Calendar size={36} className="text-gray-300" />
      </div>
      <h2 className="text-lg font-black text-gray-700 mb-2">Tu calendario está vacío</h2>
      <p className="text-sm text-gray-400 font-semibold">
        Sigue hermandades y bandas para ver sus procesiones y conciertos aquí automáticamente
      </p>
    </div>
  );
}
