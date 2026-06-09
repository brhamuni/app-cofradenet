'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

const MapaView = dynamic(() => import('@/components/mapa/MapaView'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
      <MapPin size={32} className="animate-bounce opacity-40" />
      <p className="text-sm font-black uppercase tracking-widest">Cargando mapa...</p>
    </div>
  ),
});

export default function MapaPage() {
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      <div className="flex-1 relative">
        <MapaView />
      </div>
    </div>
  );
}
