'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  MapPin,
  Music,
  Church,
  Bell,
  BellOff,
  ChevronDown,
  Download,
} from 'lucide-react';
import api from '@/app/api/axios';
import { API, resolveImg } from '@/lib/api';

type TipoFiltro = 'all' | 'procesion' | 'concierto';

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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Mi Calendario</h1>
          <p className="text-gray-500 text-sm font-semibold">
            Eventos de las hermandades y bandas que sigues
          </p>
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

          {/* Lista principal */}
          <div className="lg:col-span-2">
            {cargando ? (
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
