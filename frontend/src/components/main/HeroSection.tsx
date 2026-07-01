'use client';

import { useState, useEffect } from 'react';
import { Sparkles, MapPin } from 'lucide-react';
import SearchBar from './SearchBar';

const CIUDADES = [
  {
    nombre: 'Sevilla',
    url: 'https://visitasevilla.es/wp-content/uploads/2025/06/shutterstock_2425620139.jpg',
  },
  {
    nombre: 'Córdoba',
    url: 'https://mezquita-catedraldecordoba.es/site/assets/files/24312/mezquita-catedral-cordoba-1.1152x1152.jpg',
  },
  {
    nombre: 'Málaga',
    url: 'https://www.jdiezarnal.com/catedraldemalagavista01.jpg',
  },
  {
    nombre: 'Granada',
    url: 'https://media.tacdn.com/media/attractions-splice-spp-674x446/12/42/ef/47.jpg',
  },
];

const INTERVAL = 5000;

interface HeroProps {
  busqueda: string;
  setBusqueda: (val: string) => void;
  filtro: string;
  setFiltro: (val: string) => void;
  resultados: any;
  cargando: boolean;
}

export default function HeroSection({ busqueda, setBusqueda, filtro, setFiltro, resultados, cargando }: HeroProps) {
  const [current, setCurrent] = useState(0);
  const [searchActive, setSearchActive] = useState(false);

  const compactMobile = searchActive || busqueda.length >= 3;

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % CIUDADES.length);
    }, INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className={`relative w-full mb-6 flex bg-cofrade-main overflow-visible transition-[height,padding] duration-300 ${
        compactMobile
          ? 'min-h-0 h-auto items-start pt-4 pb-6 md:h-[65vh] md:items-center md:pt-0 md:pb-0'
          : 'h-[55vh] md:h-[65vh] items-center justify-center'
      } ${busqueda.length >= 3 ? 'z-[1100]' : 'z-50'}`}
    >
      {/* Fondo rotativo */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {CIUDADES.map((ciudad, i) => (
          <img
            key={ciudad.nombre}
            src={ciudad.url}
            alt={ciudad.nombre}
            className={`absolute inset-0 w-full h-full object-cover max-w-full scale-100 sm:scale-105 transition-opacity duration-1000 ${
              i === current ? 'opacity-40' : 'opacity-0'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-linear-to-t from-white via-cofrade-main/20 to-cofrade-main/60" />
      </div>

      {/* Contenido — por encima del indicador de ciudad del banner */}
      <div
        className={`relative z-30 max-w-4xl w-full px-6 text-center transition-all duration-300 ${
          compactMobile ? 'md:text-center' : ''
        }`}
      >
        <div
          className={`transition-all duration-300 overflow-hidden ${
            compactMobile
              ? 'max-h-0 opacity-0 mb-0 md:max-h-none md:opacity-100 md:mb-6'
              : 'max-h-96 opacity-100 mb-6'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-cofrade-gold text-xs font-black tracking-widest uppercase mb-6">
            <Sparkles size={14} /> La mayor red social cofrade
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-6 md:mb-8 drop-shadow-2xl">
            VIVE TU <br />
            <span className="text-cofrade-gold">PASIÓN.</span>
          </h1>
        </div>

        <SearchBar
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          filtro={filtro}
          setFiltro={setFiltro}
          resultados={resultados}
          cargando={cargando}
          onActiveChange={setSearchActive}
        />
      </div>

      {/* Indicador de ciudad — oculto en móvil mientras se busca */}
      <div
        className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-[5] flex max-w-[calc(100%-2rem)] items-center gap-2 sm:gap-3 overflow-hidden transition-opacity duration-300 ${
          compactMobile ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'opacity-100'
        }`}
      >
        {CIUDADES.map((ciudad, i) => (
          <button
            key={ciudad.nombre}
            onClick={() => setCurrent(i)}
            className="flex items-center gap-1.5 group"
            title={ciudad.nombre}
          >
            <span
              className={`block h-1 rounded-full transition-all duration-500 ${
                i === current ? 'w-8 bg-cofrade-gold' : 'w-4 bg-white/40 group-hover:bg-white/70'
              }`}
            />
          </button>
        ))}
        <span className="flex items-center gap-1 text-white/70 text-[10px] sm:text-xs font-black tracking-widest uppercase truncate">
          <MapPin size={11} />
          {CIUDADES[current].nombre}
        </span>
      </div>
    </section>
  );
}
