'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, Church, Music, X } from 'lucide-react';
import Link from 'next/link';

const IMPORTANT_KEY = 'cofradenet_eventos_importantes';
const EVENTS_META_KEY = 'cofradenet_eventos_meta';

export interface EventoMeta {
  key: string;
  tipo: 'procesion' | 'concierto';
  titulo: string;
  fecha: string;
  entidad: string;
}

export function getImportantesCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(IMPORTANT_KEY);
    return raw ? JSON.parse(raw).length : 0;
  } catch {
    return 0;
  }
}

export function getEventosMeta(): EventoMeta[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(EVENTS_META_KEY);
    if (!raw) return [];
    const allMeta: EventoMeta[] = JSON.parse(raw);
    const importantesRaw = localStorage.getItem(IMPORTANT_KEY);
    const importantesSet = new Set<string>(importantesRaw ? JSON.parse(importantesRaw) : []);
    return allMeta.filter((m) => importantesSet.has(m.key));
  } catch {
    return [];
  }
}

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [eventos, setEventos] = useState<EventoMeta[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = () => {
    setCount(getImportantesCount());
    setEventos(getEventosMeta());
  };

  useEffect(() => {
    refresh();
    window.addEventListener('importantes-change', refresh);
    return () => window.removeEventListener('importantes-change', refresh);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative p-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-all"
        aria-label="Notificaciones"
      >
        <Bell size={18} className={count > 0 ? 'text-cofrade-main' : 'text-gray-500'} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] bg-cofrade-main text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-gray-100 z-[200] animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-cofrade-main" />
              <p className="text-xs font-black text-gray-700 uppercase tracking-widest">Notificaciones</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
              <X size={14} className="text-gray-400" />
            </button>
          </div>

          {eventos.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Bell size={28} className="text-gray-200 mx-auto mb-3" />
              <p className="text-xs font-black text-gray-500">Sin eventos marcados</p>
              <p className="text-[10px] text-gray-400 mt-1">
                Ve a tu calendario y marca eventos como importantes
              </p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
              {eventos.map((ev) => (
                <div key={ev.key} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    ev.tipo === 'procesion' ? 'bg-cofrade-main/10' : 'bg-blue-100'
                  }`}>
                    {ev.tipo === 'procesion'
                      ? <Church size={14} className="text-cofrade-main" />
                      : <Music size={14} className="text-blue-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-gray-900 line-clamp-2">{ev.titulo}</p>
                    <p className="text-[10px] text-gray-500 font-semibold mt-0.5">{ev.entidad}</p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5 flex items-center gap-1">
                      <Calendar size={9} />
                      {formatFecha(ev.fecha)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-5 py-3 border-t border-gray-50">
            <Link
              href="/calendario"
              onClick={() => setOpen(false)}
              className="block w-full text-center text-xs font-black text-cofrade-main hover:underline py-1"
            >
              Ver Mi Calendario →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function formatFecha(fecha: string): string {
  try {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return fecha;
  }
}
