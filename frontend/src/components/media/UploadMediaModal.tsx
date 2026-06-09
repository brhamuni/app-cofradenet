'use client';

import { useState, useRef } from 'react';
import { X, Upload, Link, Image, Video } from 'lucide-react';
import { API } from '@/lib/api';

interface Props {
  hermandadId?: number;
  bandaId?: number;
  procesionId?: number;
  onClose: () => void;
  onSaved: () => void;
}

type Mode = 'archivo' | 'enlace';

export default function UploadMediaModal({ hermandadId, bandaId, procesionId, onClose, onSaved }: Props) {
  const [mode, setMode] = useState<Mode>('archivo');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [anio, setAnio] = useState<string>(String(new Date().getFullYear()));
  const [ciudadId, setCiudadId] = useState('');
  const [hermandadTag, setHermandadTag] = useState(hermandadId ? String(hermandadId) : '');
  const [bandaTag, setBandaTag] = useState(bandaId ? String(bandaId) : '');
  const [enlaceUrl, setEnlaceUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

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
    const tags: Record<string, string> = {};
    if (anio) tags.anio = anio;
    if (ciudadId) tags.ciudadId = ciudadId;
    if (hermandadTag) tags.hermandadId = hermandadTag;
    if (bandaTag) tags.bandaId = bandaTag;
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
        const body: any = { url: enlaceUrl.trim(), ...buildTags() };
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
          {/* Mode selector */}
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

          {/* Common fields */}
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

          {/* Tags */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Etiquetas</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Año</label>
                <input
                  type="number"
                  value={anio}
                  onChange={e => setAnio(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-cofrade-main/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">ID Ciudad</label>
                <input
                  type="number"
                  value={ciudadId}
                  onChange={e => setCiudadId(e.target.value)}
                  placeholder="Opcional"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-cofrade-main/20"
                />
              </div>
              {!hermandadId && (
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">ID Hermandad</label>
                  <input
                    type="number"
                    value={hermandadTag}
                    onChange={e => setHermandadTag(e.target.value)}
                    placeholder="Opcional"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-cofrade-main/20"
                  />
                </div>
              )}
              {!bandaId && (
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">ID Banda</label>
                  <input
                    type="number"
                    value={bandaTag}
                    onChange={e => setBandaTag(e.target.value)}
                    placeholder="Opcional"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-cofrade-main/20"
                  />
                </div>
              )}
            </div>
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
