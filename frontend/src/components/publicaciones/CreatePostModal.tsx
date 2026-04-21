'use client';

import { useState } from 'react';
import { X, Loader2, ImageIcon, Route } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (post: any) => void;
  hermandadId?: number;
  bandaId?: number;
}

const ITINERARIO_TEMPLATE = `⏰ Salida:
⏰ Entrada:

📍 Itinerario:
•
•
•

Bandas que acompañan:
•
`;

export default function CreatePostModal({ isOpen, onClose, onCreated, hermandadId, bandaId }: CreatePostModalProps) {
  const [tipo, setTipo] = useState<'general' | 'itinerario'>('general');
  const [contenido, setContenido] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const canPublishItinerario = !!hermandadId;

  const handleTipoChange = (nuevoTipo: 'general' | 'itinerario') => {
    setTipo(nuevoTipo);
    if (nuevoTipo === 'itinerario' && !contenido) {
      setContenido(ITINERARIO_TEMPLATE);
    } else if (nuevoTipo === 'general' && contenido === ITINERARIO_TEMPLATE) {
      setContenido('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenido.trim()) return;
    setCargando(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/publicaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contenido: contenido.trim(),
          imagenUrl: imagenUrl.trim() || undefined,
          tipo,
          hermandadId: hermandadId || undefined,
          bandaId: bandaId || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Error ${res.status}`);
      }
      const post = await res.json();
      onCreated(post);
      setContenido('');
      setImagenUrl('');
      setTipo('general');
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-black">Nueva publicación</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

          {/* Selector de tipo (solo hermandades) */}
          {canPublishItinerario && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTipoChange('general')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
                  tipo === 'general'
                    ? 'border-cofrade-main bg-cofrade-main/5 text-cofrade-main'
                    : 'border-gray-100 text-gray-400 hover:border-gray-200'
                }`}
              >
                General
              </button>
              <button
                type="button"
                onClick={() => handleTipoChange('itinerario')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
                  tipo === 'itinerario'
                    ? 'border-cofrade-gold bg-cofrade-gold/5 text-cofrade-gold'
                    : 'border-gray-100 text-gray-400 hover:border-gray-200'
                }`}
              >
                <Route size={14} /> Itinerario
              </button>
            </div>
          )}

          {/* Textarea */}
          <textarea
            value={contenido}
            onChange={e => setContenido(e.target.value)}
            placeholder={tipo === 'itinerario' ? 'Edita el itinerario...' : '¿Qué quieres compartir?'}
            rows={tipo === 'itinerario' ? 10 : 5}
            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cofrade-main/20 resize-none font-mono"
            required
          />

          {/* URL imagen (opcional) */}
          <div className="flex items-center gap-2">
            <ImageIcon size={16} className="text-gray-400 shrink-0" />
            <input
              type="url"
              value={imagenUrl}
              onChange={e => setImagenUrl(e.target.value)}
              placeholder="URL de imagen (opcional)"
              className="flex-1 p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cofrade-main/20"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-5 py-2 font-bold text-gray-500 text-sm">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando || !contenido.trim()}
              className="px-6 py-2 bg-cofrade-main text-white rounded-full font-bold text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {cargando && <Loader2 size={14} className="animate-spin" />}
              Publicar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
