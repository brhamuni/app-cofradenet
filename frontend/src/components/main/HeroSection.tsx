import { Sparkles } from 'lucide-react';
import SearchBar from './SearchBar';

interface HeroProps {
  busqueda: string;
  setBusqueda: (val: string) => void;
  filtro: string;
  setFiltro: (val: string) => void;
  resultados: any;
  cargando: boolean;
}

export default function HeroSection({ busqueda, setBusqueda, filtro, setFiltro, resultados, cargando }: HeroProps) {
  return (
    <section className="relative z-50 w-full h-[65vh] mb-6 flex items-center justify-center bg-cofrade-main">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1559564484-e48b3e040ff4?q=80&w=1600" 
          className="w-full h-full object-cover opacity-40 scale-105"
          alt="Hero Background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-cofrade-main/20 to-cofrade-main/60" />
      </div>

      <div className="relative z-10 max-w-4xl w-full px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-cofrade-gold text-xs font-black tracking-widest uppercase mb-6">
          <Sparkles size={14} /> La mayor red social cofrade
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8 drop-shadow-2xl">
          VIVE TU <br />
          <span className="text-cofrade-gold">PASIÓN.</span>
        </h1>

        <SearchBar 
          busqueda={busqueda} 
          setBusqueda={setBusqueda} 
          filtro={filtro} 
          setFiltro={setFiltro} 
          resultados={resultados} 
          cargando={cargando} 
        />
      </div>
    </section>
  );
}