'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Calendar, Image as ImageIcon, Rss, ArrowRight, Loader2, Sparkles, Map as MapIcon, Music } from 'lucide-react';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todo');
  const [resultados, setResultados] = useState<any>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    if (busqueda.trim().length < 3) {
      setResultados(null);
      return;
    }
    const temporizador = setTimeout(() => {
      ejecutarBusqueda(busqueda, filtro);
    }, 500);
    return () => clearTimeout(temporizador);
  }, [busqueda, filtro]);

  const ejecutarBusqueda = async (texto: string, categoria: string) => {
    setCargando(true);
    try {
      const res = await fetch(`http://localhost:3000/search?q=${texto}&filtro=${categoria}`);
      const data = await res.json();
      setResultados(data);
    } catch (error) {
      console.error("Error al buscar:", error);
      setResultados(null);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* --- SECTION 1: HERO IMPACTANTE --- */}
      <section className="relative z-50 w-full h-[70vh] flex items-center justify-center bg-cofrade-main">
        
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1559564484-e48b3e040ff4?q=80&w=1600" 
            className="w-full h-full object-cover opacity-40 scale-105 animate-pulse-slow"
            alt="Hero Background"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-cofrade-main/20 to-cofrade-main/60" />
        </div>

        <div className="relative z-10 max-w-4xl w-full px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-cofrade-gold text-xs font-black tracking-widest uppercase mb-6 animate-fade-in">
            <Sparkles size={14} /> La mayor red social cofrade
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8 drop-shadow-2xl">
            VIVE TU <br />
            <span className="text-cofrade-gold">PASIÓN.</span>
          </h1>

          {/* BUSCADOR REDISEÑADO */}
          <div className="relative max-w-3xl mx-auto group z-50">
            <div className="absolute -inset-1 bg-gradient-to-r from-cofrade-gold to-cofrade-main rounded-[2rem] blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
            
            <div className="relative flex flex-col md:flex-row gap-3">
              
              {/* 1. ZONA DEL INPUT Y SUS RESULTADOS */}
              <div className="relative flex-1 flex flex-col">
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder={`Buscar en ${filtro}...`}
                    className="w-full h-[64px] pl-14 pr-6 bg-white rounded-2xl md:rounded-[2rem] text-lg font-bold shadow-2xl outline-none focus:ring-4 focus:ring-cofrade-gold/20 transition-all text-gray-900"
                  />
                </div>

                {/* CAJA DE RESULTADOS */}
                {busqueda.length >= 3 && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl rounded-[1.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden text-left z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    {cargando ? (
                      <div className="flex items-center justify-center p-8 text-cofrade-main font-bold italic">
                        <Loader2 className="animate-spin mr-3" /> BUSCANDO...
                      </div>
                    ) : (
                      <div className="p-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {resultados?.ciudades?.map((c: any) => (
                          <Link href={`/ciudad/${c.id}`} key={c.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-cofrade-main group-hover:bg-cofrade-main group-hover:text-white transition-all shadow-sm">
                              <MapPin size={20} />
                            </div>
                            <div>
                              <p className="font-black text-gray-900 uppercase text-sm leading-tight">{c.nombre}</p>
                              <p className="text-[10px] text-gray-400 font-bold tracking-wider mt-0.5">CIUDAD</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* 2. ZONA DE FILTROS */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar bg-white/90 backdrop-blur-md p-2 rounded-2xl md:rounded-[2rem] shadow-xl border border-white/20 h-[64px]">
                {['todo', 'procesiones', 'hermandades', 'bandas'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFiltro(opt)}
                    className={`h-full flex items-center justify-center px-5 rounded-xl md:rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      filtro === opt 
                        ? 'bg-cofrade-main text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 2: ACCESOS DIRECTOS --- */}
      <section className="max-w-7xl mx-auto px-6 -mt-0 relative z-20 mb-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {[
            { href: '/mapa', icon: MapIcon, title: 'En Vivo', desc: 'Sigue los pasos', color: 'bg-red-500' },
            { href: isLoggedIn ? '/feed' : '/login', icon: Rss, title: 'El Muro', desc: 'Actualidad', color: 'bg-cofrade-main' },
            { href: '/calendario', icon: Calendar, title: 'Agenda', desc: 'No te pierdas nada', color: 'bg-cofrade-gold' },
            { href: '/galeria', icon: ImageIcon, title: 'Galería', desc: 'Arte Sacro', color: 'bg-blue-600' },
          ].map((item, index) => (
            <Link 
              key={index} 
              href={item.href}
              className="bg-white p-8 rounded-[2.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-50 hover:shadow-2xl hover:-translate-y-2 transition-all group"
            >
              <div className={`w-14 h-14 ${item.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:rotate-12 transition-transform`}>
                <item.icon size={28} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tighter">{item.title}</h3>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest leading-none">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* --- SECTION 3: CIUDADES DESTACADAS --- */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter">CIUDADES <br/> <span className="text-cofrade-gold">REFERENTES</span></h2>
          </div>
          <Link href="/ciudades" className="group flex items-center gap-2 text-sm font-black tracking-widest uppercase text-gray-400 hover:text-cofrade-main transition-colors">
            Ver todas <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { n: 'Sevilla', img: 'https://images.unsplash.com/photo-1559564484-e48b3e040ff4' },
            { n: 'Málaga', img: 'https://images.unsplash.com/photo-1548625361-195feee1048e' },
            { n: 'Granada', img: 'https://images.unsplash.com/photo-1567591414240-e69661440049' },
            { n: 'Córdoba', img: 'https://images.unsplash.com/photo-1596194200109-19818b264669' },
          ].map((ciudad, i) => (
            <div key={i} className="group relative h-[400px] rounded-[3rem] overflow-hidden cursor-pointer shadow-xl">
              <img src={ciudad.img} alt={ciudad.n} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125" />
              <div className="absolute inset-0 bg-gradient-to-t from-cofrade-main via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-8 left-8">
                <p className="text-cofrade-gold font-black text-xs uppercase tracking-[0.3em] mb-1">Andalucía</p>
                <h4 className="text-3xl font-black text-white tracking-tighter">{ciudad.n}</h4>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}