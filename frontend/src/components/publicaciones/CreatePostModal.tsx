'use client';

import { useState, useRef } from 'react';
import { X, Loader2, ImageIcon, Route, Link as LinkIcon, Upload, Trash2 } from 'lucide-react';
import { API } from '@/lib/api';

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
  const [tipo, setTipo] = useState<'general' | 'itinerario' | 'enlace_social'>('general');
  const [contenido, setContenido] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [urlExterna, setUrlExterna] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const canPublishItinerario = !!hermandadId;

  const handleTipoChange = (nuevoTipo: 'general' | 'itinerario' | 'enlace_social') => {
    setTipo(nuevoTipo);
    if (nuevoTipo === 'itinerario' && !contenido) {
      setContenido(ITINERARIO_TEMPLATE);
    } else if (nuevoTipo === 'general' && contenido === ITINERARIO_TEMPLATE) {
      setContenido('');
    }
    if (nuevoTipo !== 'enlace_social') setUrlExterna('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    clearImage();
    setContenido('');
    setUrlExterna('');
    setTipo('general');
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenido.trim() && tipo !== 'enlace_social') return;
    setCargando(true);
    setError('');
    try {
      const token = localStorage.getItem('token');

      // Upload image first if file selected
      let imagenUrl: string | undefined;
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        if (hermandadId) fd.append('hermandadId', String(hermandadId));
        if (bandaId) fd.append('bandaId', String(bandaId));
        const uploadRes = await fetch(`${API}/media/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error((err as any).message ?? 'Error al subir la imagen');
        }
        const uploadData = await uploadRes.json();
        imagenUrl = uploadData.url;
      }

      const res = await fetch(`${API}/publicaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contenido: contenido.trim() || undefined,
          imagenUrl,
          urlExterna: urlExterna.trim() || undefined,
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
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-black">Nueva publicación</h2>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

          {/* Selector de tipo */}
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
            {canPublishItinerario && (
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
            )}
            <button
              type="button"
              onClick={() => handleTipoChange('enlace_social')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
                tipo === 'enlace_social'
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-100 text-gray-400 hover:border-gray-200'
              }`}
            >
              <LinkIcon size={14} /> Enlace
            </button>
          </div>

          {/* URL externa (tipo enlace_social) */}
          {tipo === 'enlace_social' && (
            <div className="flex items-center gap-2">
              <LinkIcon size={16} className="text-blue-500 shrink-0" />
              <input
                type="url"
                value={urlExterna}
                onChange={e => setUrlExterna(e.target.value)}
                placeholder="Pega aquí el enlace de YouTube, Instagram o X..."
                className="flex-1 p-2.5 bg-gray-50 border border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required={tipo === 'enlace_social'}
              />
            </div>
          )}

          {/* Textarea */}
          <textarea
            value={contenido}
            onChange={e => setContenido(e.target.value)}
            placeholder={
              tipo === 'itinerario'
                ? 'Edita el itinerario...'
                : tipo === 'enlace_social'
                ? 'Añade un comentario sobre el enlace (opcional)...'
                : '¿Qué quieres compartir?'
            }
            rows={tipo === 'itinerario' ? 10 : 3}
            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cofrade-main/20 resize-none font-mono"
            required={tipo !== 'enlace_social'}
          />

          {/* Adjuntar imagen */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileSelect}
            />
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-100">
                <img src={imagePreview} alt="preview" className="w-full max-h-48 object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={13} className="text-white" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2 p-3 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400 font-semibold hover:border-cofrade-main/40 hover:text-cofrade-main/60 transition-colors"
              >
                <ImageIcon size={16} />
                Adjuntar foto
                <Upload size={14} className="ml-auto" />
              </button>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={handleClose} className="px-5 py-2 font-bold text-gray-500 text-sm">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando || (tipo === 'enlace_social' ? !urlExterna.trim() : !contenido.trim())}
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
