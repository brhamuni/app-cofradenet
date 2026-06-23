'use client';

import Link from 'next/link';
import { HardHat, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">

      {/* Icono */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-cofrade-main/8 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-cofrade-main/12 flex items-center justify-center">
            <HardHat size={40} className="text-cofrade-main" strokeWidth={1.5} />
          </div>
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-cofrade-gold flex items-center justify-center shadow-md">
          <span className="text-white text-xs font-black">!</span>
        </div>
      </div>

      {/* Texto */}
      <p className="text-xs font-black text-cofrade-main uppercase tracking-[0.3em] mb-3">
        Próximamente
      </p>
      <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-3">
        Página en construcción
      </h1>
      <p className="text-gray-400 font-semibold text-sm max-w-sm leading-relaxed">
        Estamos trabajando en esta sección. Vuelve pronto para descubrir las novedades de CofradeNet.
      </p>

      {/* Acciones */}
      <div className="flex items-center gap-3 mt-8">
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 bg-cofrade-main text-white text-sm font-black rounded-xl hover:opacity-90 transition-opacity"
        >
          <Home size={15} />
          Ir al inicio
        </Link>
        <button
          onClick={() => history.back()}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-black rounded-xl hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={15} />
          Volver
        </button>
      </div>

    </div>
  );
}
