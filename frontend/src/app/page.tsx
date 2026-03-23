'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Calendar, Image as ImageIcon, Rss, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      
      {/* SECCIÓN HERO (Buscador central) */}
      <section className="w-full bg-white border-b border-gray-100 pt-16 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Descubre tu pasión <br/>
            <span className="text-cofrade-main">en cada rincón.</span>
          </h1>
          <p className="text-lg text-gray-500 mb-8">
            Encuentra procesiones, hermandades, bandas y sigue la Semana Santa en tiempo real.
          </p>
          
          {/* Buscador grande */}
          <div className="relative max-w-2xl mx-auto shadow-sm rounded-2xl">
            <input
              type="text"
              placeholder="Buscar ciudad, hermandad, banda..."
              className="w-full px-6 py-4 pl-12 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cofrade-main/40 text-lg transition-all"
            />
            <Search className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-cofrade-main text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity">
              Buscar
            </button>
          </div>
        </div>
      </section>

      {/* MENÚ PRINCIPAL (Tarjetas de navegación) */}
      <section className="w-full max-w-5xl mx-auto px-4 py-12 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Link href="/mapa" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-cofrade-main/30 hover:shadow-md transition-all group flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-cofrade-main/10 text-cofrade-main rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MapPin size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Mapa en vivo</h3>
            <p className="text-sm text-gray-500">Sigue las procesiones en tiempo real.</p>
          </Link>

          {/* Tarjetas que piden estar logueado para acceder completamente o muestran info */}
          <Link href={isLoggedIn ? "/feed" : "/login"} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-cofrade-main/30 hover:shadow-md transition-all group flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-cofrade-main/10 text-cofrade-main rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Rss size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Feed Cofrade</h3>
            <p className="text-sm text-gray-500">Noticias y actualidad de tus favoritos.</p>
          </Link>

          <Link href={isLoggedIn ? "/calendario" : "/login"} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-cofrade-main/30 hover:shadow-md transition-all group flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-cofrade-main/10 text-cofrade-main rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Calendar size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Mi Calendario</h3>
            <p className="text-sm text-gray-500">Organiza tu agenda de eventos.</p>
          </Link>

          <Link href="/galeria" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-cofrade-main/30 hover:shadow-md transition-all group flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-cofrade-main/10 text-cofrade-main rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ImageIcon size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Galería</h3>
            <p className="text-sm text-gray-500">Las mejores fotos y vídeos.</p>
          </Link>

        </div>
      </section>

      {/* SECCIÓN EXTRA DE HERMANDADES (De ejemplo) */}
      <section className="w-full max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Ciudades Destacadas</h2>
          <Link href="/ciudades" className="text-cofrade-main font-medium flex items-center hover:underline">
            Ver todas <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Sevilla', 'Málaga', 'Córdoba', 'Granada'].map((ciudad) => (
            <button key={ciudad} className="relative h-32 rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gray-900/40 group-hover:bg-gray-900/50 transition-colors z-10" />
              <div className="absolute inset-0 bg-gray-200" /> {/* Aquí iría una foto de la ciudad en img */}
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <span className="text-white font-bold text-lg tracking-wide">{ciudad}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

    </div>
  );
}