'use client';

import { useState, useEffect, useRef } from 'react';
import { Navigation, NavigationOff, Loader2 } from 'lucide-react';
import { API } from '@/lib/api';

interface Props {
  procesionId: number;
}

export default function CompartirUbicacion({ procesionId }: Props) {
  const [activo, setActivo] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef = useRef<number | null>(null);

  async function sendLocation(lat: number, lng: number, estaActiva: boolean) {
    const token = localStorage.getItem('token');
    await fetch(`${API}/ubicacion/procesion/${procesionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ latitud: lat, longitud: lng, estaActiva }),
    });
  }

  async function iniciarCompartir() {
    if (!navigator.geolocation) {
      setError('Tu dispositivo no soporta geolocalización');
      return;
    }
    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        await sendLocation(lat, lng, true);
        setActivo(true);
        setLoading(false);

        // Watch GPS position and send updates every 30 seconds
        watchRef.current = navigator.geolocation.watchPosition(
          p => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
          undefined,
          { enableHighAccuracy: true, maximumAge: 10000 },
        );

        intervalRef.current = setInterval(async () => {
          if (watchRef.current !== null) {
            navigator.geolocation.getCurrentPosition(async p => {
              const lat = p.coords.latitude;
              const lng = p.coords.longitude;
              setCoords({ lat, lng });
              await sendLocation(lat, lng, true);
            });
          }
        }, 30000);
      },
      () => {
        setLoading(false);
        setError('No se pudo obtener la ubicación');
      },
      { enableHighAccuracy: true },
    );
  }

  async function detenerCompartir() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    intervalRef.current = null;
    watchRef.current = null;

    if (coords) await sendLocation(coords.lat, coords.lng, false);
    setActivo(false);
    setCoords(null);
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={activo ? detenerCompartir : iniciarCompartir}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
          activo
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-cofrade-main text-white hover:brightness-110'
        }`}
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : activo ? (
          <NavigationOff size={15} />
        ) : (
          <Navigation size={15} />
        )}
        {loading ? 'Obteniendo GPS...' : activo ? 'Detener ubicación' : 'Compartir ubicación en directo'}
      </button>

      {activo && coords && (
        <p className="text-[10px] font-semibold text-green-600 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          En directo · {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </p>
      )}
      {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
    </div>
  );
}
