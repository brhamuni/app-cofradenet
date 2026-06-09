'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

const MapaView = dynamic(() => import('@/components/mapa/MapaView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 text-gray-400 gap-3">
      <MapPin size={28} className="animate-bounce opacity-40" />
      <p className="text-sm font-black uppercase tracking-widest">Cargando mapa...</p>
    </div>
  ),
});

export default function MapaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MapaView />
    </div>
  );
}
