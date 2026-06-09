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
  const coordsRef = useRef<{ lat: number; lng: number } | null>(null);

  async function sendLocation(lat: number, lng: number, estaActiva: boolean) {
    const token = localStorage.getItem('token');
    await fetch(`${API}/ubicacion/procesion/${procesionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ latitud: lat, longitud: lng, estaActiva }),
    });
  }

  function startWatching(initialLat: number, initialLng: number) {
    watchRef.current = navigator.geolocation.watchPosition(
      p => {
        const c = { lat: p.coords.latitude, lng: p.coords.longitude };
        coordsRef.current = c;
        setCoords(c);
      },
      undefined,
      { enableHighAccuracy: true, maximumAge: 10000 },
    );

    intervalRef.current = setInterval(() => {
      const c = coordsRef.current;
      if (c) sendLocation(c.lat, c.lng, true);
    }, 30000);

    coordsRef.current = { lat: initialLat, lng: initialLng };
    setCoords({ lat: initialLat, lng: initialLng });
    setActivo(true);
    setLoading(false);
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
        await sendLocation(lat, lng, true);
        startWatching(lat, lng);
      },
      async () => {
        // Alta precisión falló — reintentar con baja precisión (redes/WiFi)
        navigator.geolocation.getCurrentPosition(
          async pos => {
            const { latitude: lat, longitude: lng } = pos.coords;
            await sendLocation(lat, lng, true);
            startWatching(lat, lng);
          },
          () => {
            setLoading(false);
            setError('No se pudo obtener la ubicación. Activa los servicios de ubicación.');
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 },
    );
  }

  async function detenerCompartir() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    intervalRef.current = null;
    watchRef.current = null;

    const c = coordsRef.current;
    if (c) await sendLocation(c.lat, c.lng, false);
    coordsRef.current = null;
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
