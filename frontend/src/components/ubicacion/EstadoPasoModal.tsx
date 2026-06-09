'use client';

import { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { API } from '@/lib/api';

interface Props {
  procesionId: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function EstadoPasoModal({ procesionId, onClose, onSaved }: Props) {
  const [nombrePaso, setNombrePaso] = useState('');
  const [estado, setEstado] = useState('');
  const [conUbicacion, setConUbicacion] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const ESTADOS_RAPIDOS = [
    'Levantá',
    'Parado',
    'Suena la marcha',
    'Llegando a la meta',
    'Entrada a paso lento',
  ];

  async function getGeo() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setConUbicacion(true);
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        setError('No se pudo obtener tu ubicación');
      },
    );
  }

  async function handleSubmit() {
    if (!nombrePaso.trim() || !estado.trim()) {
      setError('Rellena el nombre del paso y el estado');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const body: any = { nombrePaso: nombrePaso.trim(), estado: estado.trim() };
      if (conUbicacion && coords) {
        body.latitud = coords.lat;
        body.longitud = coords.lng;
      }
      const res = await fetch(`${API}/ubicacion/procesion/${procesionId}/estados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      onSaved();
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-black text-gray-900">Estado del paso</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
              Nombre del paso *
            </label>
            <input
              value={nombrePaso}
              onChange={e => setNombrePaso(e.target.value)}
              placeholder="Ej: Cristo del Gran Poder, Virgen de la Macarena..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-cofrade-main/20"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
              Estado *
            </label>
            <input
              value={estado}
              onChange={e => setEstado(e.target.value)}
              placeholder="Ej: Levantá, Suena la marcha..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-cofrade-main/20"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {ESTADOS_RAPIDOS.map(e => (
                <button
                  key={e}
                  onClick={() => setEstado(e)}
                  className="px-2.5 py-1 rounded-full text-xs font-black bg-cofrade-main/10 text-cofrade-main hover:bg-cofrade-main/20 transition-colors"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <button
              onClick={conUbicacion ? () => { setConUbicacion(false); setCoords(null); } : getGeo}
              disabled={geoLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                conUbicacion
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <MapPin size={14} />
              {geoLoading ? 'Obteniendo GPS...' : conUbicacion && coords
                ? `GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                : 'Añadir mi ubicación'}
            </button>
          </div>

          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-black text-gray-500 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !nombrePaso.trim() || !estado.trim()}
            className="flex-1 py-2.5 rounded-xl bg-cofrade-main text-white text-sm font-black disabled:opacity-50 hover:brightness-110 transition-all"
          >
            {saving ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  );
}
