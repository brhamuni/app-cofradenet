'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Music, Loader2 } from 'lucide-react';
import { API, resolveImg } from '@/lib/api';

export interface BandaOption {
  id: number;
  nombre: string;
  estiloMusical?: string;
  imagenLogo?: string;
}

interface BandaSearchInputProps {
  value: string;
  selectedId: number | null;
  onChange: (nombre: string, bandaId: number | null) => void;
  placeholder?: string;
}

export default function BandaSearchInput({
  value,
  selectedId,
  onChange,
  placeholder = 'Buscar banda por nombre...',
}: BandaSearchInputProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<BandaOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API}/bandas/buscar?nombre=${encodeURIComponent(query.trim())}`,
        );
        if (res.ok) setResults(await res.json());
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectBanda = (banda: BandaOption) => {
    onChange(banda.nombre, banda.id);
    setQuery(banda.nombre);
    setOpen(false);
  };

  const useNombreLibre = () => {
    const nombre = query.trim();
    if (!nombre) return;
    onChange(nombre, null);
    setOpen(false);
  };

  const showNombreLibre =
    open &&
    query.trim().length >= 2 &&
    !results.some(
      (b) => b.nombre.toLowerCase() === query.trim().toLowerCase(),
    );

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value, null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cofrade-main/30"
        />
        {loading && (
          <Loader2
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
          />
        )}
      </div>

      {selectedId === null && query.trim().length >= 2 && !open && (
        <p className="text-[10px] text-amber-600 font-semibold mt-1.5">
          Se guardará sin enlace a perfil
        </p>
      )}
      {selectedId !== null && (
        <p className="text-[10px] text-cofrade-main font-semibold mt-1.5">
          Banda registrada en CofradeNet
        </p>
      )}

      {open && query.trim().length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {results.length === 0 && !loading && (
            <p className="px-3 py-2.5 text-xs text-gray-400 font-semibold">
              No hay bandas con ese nombre
            </p>
          )}
          {results.map((banda) => {
            const logo = resolveImg(banda.imagenLogo);
            return (
              <button
                key={banda.id}
                type="button"
                onClick={() => selectBanda(banda)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
              >
                <div className="w-8 h-8 rounded-lg bg-cofrade-gold/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {logo ? (
                    <img src={logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Music size={14} className="text-cofrade-gold" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-gray-900 truncate">{banda.nombre}</p>
                  {banda.estiloMusical && (
                    <p className="text-[10px] text-gray-400 font-semibold truncate">
                      {banda.estiloMusical}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
          {showNombreLibre && (
            <button
              type="button"
              onClick={useNombreLibre}
              className="w-full px-3 py-2.5 text-left text-xs font-bold text-gray-600 hover:bg-amber-50 border-t border-gray-100"
            >
              Usar &quot;{query.trim()}&quot; sin perfil en CofradeNet
            </button>
          )}
        </div>
      )}
    </div>
  );
}
