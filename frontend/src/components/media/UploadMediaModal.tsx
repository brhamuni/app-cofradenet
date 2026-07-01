'use client';

import { useState, useRef } from 'react';
import { X, Upload, Link, Image, Video, Church, Music, Calendar, MapPin } from 'lucide-react';
import { API } from '@/lib/api';

interface Props {
  hermandadId?: number;
  bandaId?: number;
  procesionId?: number;
  hermandadNombre?: string;
  bandaNombre?: string;
  ciudadId?: number;
  ciudadNombre?: string;
  onClose: () => void;
  onSaved: () => void;
}

type Mode = 'archivo' | 'enlace';

function formatFechaHoy() {
  return new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function UploadMediaModal({
  hermandadId,
  bandaId,
  procesionId,
  hermandadNombre,
  bandaNombre,
  ciudadId: ciudadIdProp,
  ciudadNombre,
  onClose,
  onSaved,
}: Props) {
  const [mode, setMode] = useState<Mode>('archivo');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enlaceUrl, setEnlaceUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const esEntidad = Boolean(hermandadId || bandaId);
  const anioActual = String(new Date().getFullYear());
  const fechaHoy = formatFechaHoy();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }

  function buildTags() {
    const tags: Record<string, string> = {
      anio: anioActual,
    };
    if (ciudadIdProp) tags.ciudadId = String(ciudadIdProp);
    if (hermandadId) tags.hermandadId = String(hermandadId);
    if (bandaId) tags.bandaId = String(bandaId);
    if (procesionId) tags.procesionId = String(procesionId);
    return tags;
  }

  async function handleSubmit() {
    const token = localStorage.getItem('token');
    if (!token) { setError('Debes iniciar sesión'); return; }
    setSaving(true);
    setError('');

    try {
      if (mode === 'archivo') {
        if (!file) { setError('Selecciona un archivo'); setSaving(false); return; }
        const fd = new FormData();
        fd.append('file', file);
        if (titulo) fd.append('titulo', titulo);
        if (descripcion) fd.append('descripcion', descripcion);
        Object.entries(buildTags()).forEach(([k, v]) => fd.append(k, v));

        const res = await fetch(`${API}/media/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as any).message ?? `Error ${res.status}`);
        }
      } else {
        if (!enlaceUrl.trim()) { setError('Introduce una URL'); setSaving(false); return; }
        const body: Record<string, string> = { url: enlaceUrl.trim(), ...buildTags() };
        if (titulo) body.titulo = titulo;
        if (descripcion) body.descripcion = descripcion;

        const res = await fetch(`${API}/media/enlace`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
      }
      onSaved();
    } catch (e: any) {
      setError(e.message ?? 'Error al subir');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-3xl flex items-center justify-between p-6 pb-4 border-b border-gray-100 z-10">
          <h2 className="text-base font-black text-gray-900">Subir contenido multimedia</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setMode('archivo')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black transition-all ${
                mode === 'archivo' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              <Upload size={13} /> Foto / Vídeo
            </button>
            <button
              onClick={() => setMode('enlace')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black transition-all ${
                mode === 'enlace' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              <Link size={13} /> Enlace externo
            </button>
          </div>

          {mode === 'archivo' ? (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-2 hover:border-cofrade-main/50 transition-colors"
              >
                {preview ? (
                  <img src={preview} alt="preview" className="w-full h-32 object-cover rounded-xl" />
                ) : file ? (
                  <div className="flex items-center gap-2 text-cofrade-main">
                    <Video size={24} />
                    <p className="text-sm font-black">{file.name}</p>
                  </div>
                ) : (
                  <>
                    <Image size={28} className="text-gray-300" />
                    <p className="text-xs font-black text-gray-400">Pulsa para seleccionar foto o vídeo</p>
                    <p className="text-[10px] text-gray-300">JPG, PNG, GIF, WebP, MP4, WebM · máx. 100MB</p>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                URL (YouTube, Spotify, Vimeo...) *
              </label>
              <input
                value={enlaceUrl}
                onChange={e => setEnlaceUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-cofrade-main/20"
              />
            </div>
          )}

          {esEntidad && (
            <div className="rounded-xl bg-cofrade-main/5 border border-cofrade-main/15 p-4">
              <p className="text-[10px] font-black text-cofrade-main uppercase tracking-widest mb-2">
                Etiquetas automáticas
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-full text-[11px] font-bold text-gray-700 border border-gray-100">
                  <Calendar size={11} className="text-cofrade-main" />
                  {fechaHoy}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-full text-[11px] font-bold text-gray-700 border border-gray-100">
                  <Calendar size={11} className="text-gray-400" />
                  {anioActual}
                </span>
                {hermandadNombre && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-cofrade-main/10 rounded-full text-[11px] font-bold text-cofrade-main border border-cofrade-main/20">
                    <Church size={11} />
                    {hermandadNombre}
                  </span>
                )}
                {bandaNombre && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 rounded-full text-[11px] font-bold text-blue-700 border border-blue-200">
                    <Music size={11} />
                    {bandaNombre}
                  </span>
                )}
                {ciudadNombre && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-full text-[11px] font-bold text-gray-600 border border-gray-100">
                    <MapPin size={11} />
                    {ciudadNombre}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                Se aplicarán al publicar la foto o vídeo.
              </p>
            </div>
          )}

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Título</label>
            <input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Título opcional..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-cofrade-main/20"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Descripción</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Descripción opcional..."
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-cofrade-main/20 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
        </div>

        <div className="sticky bottom-0 bg-white rounded-b-3xl flex gap-3 p-6 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-black text-gray-500 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-cofrade-main text-white text-sm font-black disabled:opacity-50 hover:brightness-110 transition-all"
          >
            {saving ? 'Subiendo...' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  );
}
