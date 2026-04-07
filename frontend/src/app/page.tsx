'use client';
import { useState, useEffect } from 'react';
import HeroSection from '../components/main/HeroSection';
import QuickAccess from '../components/main/QuickAccess';
import FeaturedCities from '../components/main/FeaturedCities';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todo');
  const [resultados, setResultados] = useState<any>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  useEffect(() => {
    if (busqueda.trim().length < 3) {
      setResultados(null);
      return;
    }
    const timer = setTimeout(() => {
      ejecutarBusqueda(busqueda, filtro);
    }, 500);
    return () => clearTimeout(timer);
  }, [busqueda, filtro]);

  const ejecutarBusqueda = async (texto: string, categoria: string) => {
    setCargando(true);
    try {
      const res = await fetch(`http://localhost:3000/search?q=${texto}&filtro=${categoria}`);
      setResultados(await res.json());
    } catch (error) {
      setResultados(null);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <HeroSection 
        busqueda={busqueda} 
        setBusqueda={setBusqueda} 
        filtro={filtro} 
        setFiltro={setFiltro} 
        resultados={resultados} 
        cargando={cargando} 
      />
      <QuickAccess isLoggedIn={isLoggedIn} />
      <FeaturedCities />
    </div>
  );
}