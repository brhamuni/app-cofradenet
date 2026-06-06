'use client';

import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, UserMinus, Loader2 } from 'lucide-react';
import { API } from '@/lib/api';

type Tipo = 'hermandad' | 'banda' | 'usuario';

interface FollowButtonProps {
  tipo: Tipo;
  id: number;
  onCountChange?: (n: number) => void;
}

export default function FollowButton({ tipo, id, onCountChange }: FollowButtonProps) {
  const [sigues, setSigues] = useState(false);
  const [seguidores, setSeguidores] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/seguimientos/${tipo}/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setSigues(data.sigues);
          setSeguidores(data.seguidores);
          onCountChange?.(data.seguidores);
        }
      })
      .finally(() => setCargando(false));
  }, [tipo, id]);

  const toggle = async () => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }

    // Actualización optimista inmediata
    const nuevoSigues = !sigues;
    const nuevoContador = seguidores + (nuevoSigues ? 1 : -1);
    setSigues(nuevoSigues);
    setSeguidores(nuevoContador);
    onCountChange?.(nuevoContador);

    setToggling(true);
    try {
      const res = await fetch(`${API}/seguimientos/${tipo}/${id}`, {
        method: sigues ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Confirmar con el valor real del servidor
        setSeguidores(data.seguidores);
        onCountChange?.(data.seguidores);
      } else {
        // Revertir si hubo error
        setSigues(sigues);
        setSeguidores(seguidores);
        onCountChange?.(seguidores);
      }
    } catch {
      setSigues(sigues);
      setSeguidores(seguidores);
      onCountChange?.(seguidores);
    } finally {
      setToggling(false);
    }
  };

  if (cargando) {
    return (
      <div className="h-10 w-32 rounded-full bg-gray-100 animate-pulse" />
    );
  }

  // Estado: NO siguiendo
  if (!sigues) {
    return (
      <button
        onClick={toggle}
        disabled={toggling}
        className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm bg-cofrade-main text-white hover:opacity-90 active:scale-95 transition-all shadow-md shadow-cofrade-main/20 disabled:opacity-50"
      >
        {toggling ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={15} />}
        Seguir
      </button>
    );
  }

  // Estado: SÍ siguiendo (con hover para mostrar "Dejar de seguir")
  return (
    <button
      onClick={toggle}
      disabled={toggling}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm border-2 transition-all active:scale-95 disabled:opacity-50 ${
        hover
          ? 'border-red-300 bg-red-50 text-red-500'
          : 'border-cofrade-main/30 bg-cofrade-main/5 text-cofrade-main'
      }`}
    >
      {toggling ? (
        <Loader2 size={14} className="animate-spin" />
      ) : hover ? (
        <UserMinus size={15} />
      ) : (
        <UserCheck size={15} />
      )}
      {hover ? 'Dejar de seguir' : 'Siguiendo'}
    </button>
  );
}
