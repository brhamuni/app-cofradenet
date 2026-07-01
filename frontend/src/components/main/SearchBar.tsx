import { Search, Loader2, MapPin, ChevronDown, Filter, Church, Music, Calendar } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function SearchBar({ busqueda, setBusqueda, filtro, setFiltro, resultados, cargando }: any) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const filtros = ['todo', 'procesiones', 'hermandades', 'bandas'];

  // Función para cambiar filtro y cerrar menús
  const seleccionarFiltro = (f: string) => {
    setFiltro(f);
    setMenuAbierto(false);
  };

  // Variables auxiliares para comprobar qué resultados nos llegan
  const hayCiudades = resultados?.ciudades?.length > 0;
  const hayHermandades = resultados?.hermandades?.length > 0;
  const hayBandas = resultados?.bandas?.length > 0;
  const hayProcesiones = resultados?.procesiones?.length > 0;
  
  // Solo mostramos "Sin resultados" si hemos buscado y no hay NADA de NADA
  const sinResultados = !cargando && !hayCiudades && !hayHermandades && !hayBandas && !hayProcesiones;

  return (
    <div className="relative max-w-2xl mx-auto z-50 px-4 isolate">
      <div className="relative flex flex-col gap-2">
        
        {/* BARRA INTEGRADA */}
        <div className="group relative z-[110] flex min-w-0 items-center bg-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] h-14.5 md:h-18 p-1.5 md:p-2 transition-all focus-within:ring-4 focus-within:ring-cofrade-gold/10">

          {/* SELECTOR PERSONALIZADO */}
          <div className="relative h-full z-[110]">
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="flex items-center gap-2 h-full px-3 md:px-6 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-900 transition-colors border border-gray-100"
            >
              <Filter size={15} className="text-cofrade-main shrink-0" />
              <span className="hidden sm:block text-[11px] font-black uppercase tracking-widest min-w-17.5 text-left">
                {filtro}
              </span>
              <ChevronDown size={13} className={`transition-transform duration-300 ${menuAbierto ? 'rotate-180' : ''}`} />
            </button>

            {/* MENÚ DESPLEGABLE DE FILTROS */}
            {menuAbierto && (
              <>
                <div className="fixed inset-0 z-[115]" onClick={() => setMenuAbierto(false)} />
                <div className="absolute top-[120%] left-0 w-56 bg-white rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.25)] border border-gray-100 py-4 z-[120] animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="px-6 pb-2 mb-2 border-bottom border-gray-50">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Categoría</p>
                  </div>
                  {filtros.map((f) => (
                    <button
                      key={f}
                      onClick={() => seleccionarFiltro(f)}
                      className={`w-full text-left px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${
                        filtro === f 
                          ? 'text-cofrade-main bg-cofrade-main/5' 
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* INPUT PRINCIPAL */}
          <div className="flex-1 relative h-full flex items-center min-w-0">
            <input
              type="text"
              value={busqueda}
              onFocus={() => setMenuAbierto(false)}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="¿Qué buscas hoy?"
              className="w-full min-w-0 h-full pl-4 sm:pl-6 pr-2 sm:pr-4 bg-transparent text-base sm:text-lg font-bold outline-none text-gray-900 placeholder:text-gray-300"
            />
          </div>

          {/* ESTADO / LUPA */}
          <div className="shrink-0 w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center">
            {cargando ? (
              <Loader2 className="animate-spin text-cofrade-main" size={22} />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cofrade-main rounded-full flex items-center justify-center text-white shadow-lg shadow-cofrade-main/20">
                <Search size={18} strokeWidth={3} className="sm:hidden" />
                <Search size={20} strokeWidth={3} className="hidden sm:block" />
              </div>
            )}
          </div>
        </div>

        {/* RESULTADOS COMPACTOS Y CENTRADOS */}
        {busqueda.length >= 3 && !menuAbierto && (
          <div className="absolute top-[80px] left-0 right-0 bg-white rounded-[2.2rem] shadow-[0_30px_60px_rgba(0,0,0,0.18)] border border-gray-100 overflow-hidden z-[105] animate-in fade-in slide-in-from-top-4">
            <div className="p-2 max-h-[320px] overflow-y-auto custom-scrollbar">
              
              {/* CARGANDO */}
              {cargando && (
                <div className="flex items-center justify-center p-10 text-cofrade-main font-black tracking-[0.2em] text-[9px] italic uppercase">
                  <Loader2 className="animate-spin mr-3" size={16} /> 
                  Consultando archivo...
                </div>
              )}

              {/* CIUDADES */}
              {!cargando && hayCiudades && (
                <div className="flex flex-col gap-1 mb-2">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4 mt-2 mb-1">Ciudades</p>
                  {resultados.ciudades.map((c: any) => (
                    <Link href={`/ciudad/${c.id}`} key={`ciudad-${c.id}`} className="flex items-center p-3 hover:bg-gray-50 rounded-[1.8rem] transition-all group border border-transparent hover:border-gray-100">
                      <div className="w-11 h-11 shrink-0 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-cofrade-main group-hover:text-white transition-all">
                        <MapPin size={18} />
                      </div>
                      <div className="flex-1 text-center pr-11 overflow-hidden">
                        <p className="font-black text-gray-900 uppercase text-xs leading-none tracking-tight truncate px-2">{c.nombre}</p>
                        <p className="text-[9px] text-gray-400 font-bold tracking-widest mt-1 uppercase italic truncate">
                          {c.provincia} • ANDALUCÍA
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* HERMANDADES */}
              {!cargando && hayHermandades && (
                <div className="flex flex-col gap-1 border-t border-gray-50 pt-1 mt-1 mb-2">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4 mt-2 mb-1">Hermandades</p>
                  {resultados.hermandades.map((h: any) => (

                    <Link href={`/hermandad/${h.id}`} key={`hermandad-${h.id}`} className="flex items-center p-3 hover:bg-gray-50 rounded-[1.8rem] transition-all group border border-transparent hover:border-gray-100">
                      <div className="w-11 h-11 shrink-0 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-cofrade-main group-hover:text-white transition-all">
                        <Church size={18} />
                      </div>
                      <div className="flex-1 text-center pr-11 overflow-hidden">
                        <p className="font-black text-gray-900 uppercase text-xs leading-none tracking-tight truncate px-2">
                          {h.nombrePopular || h.nombre}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold tracking-widest mt-1 uppercase italic truncate">
                          {h.ciudad?.nombre ? `${h.ciudad.nombre} • ANDALUCÍA` : 'ANDALUCÍA'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* BANDAS */}
              {!cargando && hayBandas && (
                <div className="flex flex-col gap-1 border-t border-gray-50 pt-1 mt-1 mb-2">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4 mt-2 mb-1">Bandas</p>
                  {resultados.bandas.map((b: any) => (
                    <Link href={`/banda/${b.id}`} key={`banda-${b.id}`} className="flex items-center p-3 hover:bg-gray-50 rounded-[1.8rem] transition-all group border border-transparent hover:border-gray-100">
                      <div className="w-11 h-11 shrink-0 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-cofrade-main group-hover:text-white transition-all">
                        <Music size={18} />
                      </div>
                      <div className="flex-1 text-center pr-11 overflow-hidden">
                        <p className="font-black text-gray-900 uppercase text-xs leading-none tracking-tight truncate px-2">
                          {b.nombre}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold tracking-widest mt-1 uppercase italic truncate">
                          {/* Aquí puedes usar b.estilo o la ciudad si la tienes */}
                          {b.ciudad?.nombre ? `${b.ciudad.nombre}` : 'BANDA DE MÚSICA'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* PROCESIONES */}
              {!cargando && hayProcesiones && (
                <div className="flex flex-col gap-1 border-t border-gray-50 pt-1 mt-1 mb-2">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4 mt-2 mb-1">Procesiones</p>
                  {resultados.procesiones.map((p: any) => (
                    <Link href={`/procesion/${p.id}`} key={`procesion-${p.id}`} className="flex items-center p-3 hover:bg-gray-50 rounded-[1.8rem] transition-all group border border-transparent hover:border-gray-100">
                      <div className="w-11 h-11 shrink-0 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-cofrade-main group-hover:text-white transition-all">
                        <Calendar size={18} />
                      </div>
                      <div className="flex-1 text-center pr-11 overflow-hidden">
                        <p className="font-black text-gray-900 uppercase text-xs leading-none tracking-tight truncate px-2">
                          {p.nombre || p.hermandad?.nombrePopular || 'Procesión'}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold tracking-widest mt-1 uppercase italic truncate">
                          {p.diaSalida ? p.diaSalida.toUpperCase() : (p.ciudad?.nombre ? p.ciudad.nombre : 'SEMANA SANTA')}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* SIN RESULTADOS */}
              {sinResultados && (
                <div className="p-10 text-center flex flex-col items-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-dashed border-gray-200">
                    <Search size={20} className="text-gray-300" />
                  </div>
                  <p className="text-xs font-black text-gray-900 uppercase tracking-tighter italic">
                    Sin resultados
                  </p>
                  <p className="text-[9px] text-gray-400 font-bold tracking-widest mt-1 uppercase">
                    Intenta con otro término
                  </p>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}