'use client';
import { useState, useEffect } from 'react';
import HeroSection from './HeroSection';
import QuickAccess from './QuickAccess';
import { API } from '@/lib/api';

export default function HomeClient() {
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
      const res = await fetch(`${API}/search?q=${encodeURIComponent(texto)}&filtro=${categoria}`);
      setResultados(await res.json());
    } catch {
      setResultados(null);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <HeroSection
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        filtro={filtro}
        setFiltro={setFiltro}
        resultados={resultados}
        cargando={cargando}
      />
      <QuickAccess isLoggedIn={isLoggedIn} />
    </>
  );
}
