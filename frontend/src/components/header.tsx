'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, Heart, Settings, Menu, X, ChevronDown, Bell } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };

    checkAuth();
    window.addEventListener('auth-change', checkAuth);
    return () => window.removeEventListener('auth-change', checkAuth);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Activar fondo cristalino al bajar un poco
      setIsScrolled(currentScrollY > 20);

      // Ocultar/Mostrar (suavemente, sin cambiar alturas)
      if (!isMenuOpen) {
        if (currentScrollY > lastScrollY && currentScrollY > 80) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth-change'));
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
    router.push('/');
  };

  return (
    <>
      {/* HEADER FIJO 
        - Altura fija (h-20) para evitar el salto por "capas" al hacer scroll.
        - transition-transform para esconderse limpiamente.
      */}
      <header 
        className={`fixed top-0 left-0 right-0 z-[100] h-20 transition-all duration-300 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          isScrolled 
            ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-100' 
            : 'bg-transparent'
        }`}
      >
        {/* Contenedor h-full y flex items-center aseguran el CENTRADO VERTICAL ABSOLUTO */}
        <div className="w-full h-full px-6 lg:px-12 flex justify-between items-center">
          
          {/* 1. LOGO */}
          <div className="shrink-0">
            <Link href="/" className="text-3xl font-black tracking-tighter flex items-center gap-1 group">
              <span className="text-cofrade-main">COFRADE</span>
              <span className="text-cofrade-gold group-hover:rotate-12 transition-transform">NET</span>
            </Link>
          </div>

          {/* 2. ZONA DE USUARIO / ACCIONES */}
          <div className="flex items-center gap-4">
            {!isLoggedIn ? (
              <div className="hidden md:flex items-center gap-6">
                <Link href="/login" className="text-xs font-black uppercase tracking-widest text-gray-900 hover:text-cofrade-main transition-colors">
                  Login
                </Link>
                <Link href="/register" className="bg-cofrade-main text-white px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-cofrade-main/20 hover:scale-105 active:scale-95 transition-all">
                  Únete
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 md:gap-4">
                <button className="p-2 text-gray-400 hover:text-cofrade-main transition-colors hidden sm:block">
                  <Bell size={20} />
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 p-1 pr-3 rounded-[2rem] bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-all active:scale-95"
                  >
                    <div className="h-9 w-9 rounded-full bg-cofrade-main text-white flex items-center justify-center font-black shadow-inner">
                      <User size={18} />
                    </div>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* DESPLEGABLE */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-4 w-56 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-50 py-3 z-[110] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                      <div className="px-6 py-3 border-b border-gray-50 mb-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mi Cuenta</p>
                      </div>
                      <MenuLink href="/perfil" icon={<User size={16}/>} label="Perfil" />
                      <MenuLink href="/favoritos" icon={<Heart size={16}/>} label="Favoritos" />
                      <MenuLink href="/settings" icon={<Settings size={16}/>} label="Ajustes" />
                      <div className="mt-2 pt-2 border-t border-gray-50">
                        <button onClick={handleLogout} className="flex w-full items-center px-6 py-3 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors">
                          <LogOut size={16} className="mr-3" /> Salir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BOTÓN MENÚ MÓVIL */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className={`md:hidden p-3 rounded-2xl transition-all ${isScrolled ? 'bg-gray-100 text-gray-900' : 'bg-white/20 backdrop-blur-md text-gray-900'}`}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>

        {/* MENÚ MÓVIL SOLO CON AUTH/PERFIL */}
        {isMenuOpen && (
          <div className="fixed inset-0 top-0 bg-white z-[90] p-6 pt-24 animate-in slide-in-from-top duration-300">
            <nav className="flex flex-col gap-2">
              {!isLoggedIn ? (
                <div className="flex flex-col gap-4 mt-4">
                  <Link href="/login" onClick={() => setIsMenuOpen(false)} className="py-5 text-center text-sm font-black uppercase tracking-widest border border-gray-100 rounded-2xl">Login</Link>
                  <Link href="/register" onClick={() => setIsMenuOpen(false)} className="py-5 text-center text-sm font-black uppercase tracking-widest bg-cofrade-main text-white rounded-2xl shadow-lg shadow-cofrade-main/20">Únete a CofradeNet</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-4">
                  <Link href="/perfil" onClick={() => setIsMenuOpen(false)} className="py-5 px-6 text-xl font-black tracking-tighter text-gray-900 border-b border-gray-50">Mi Perfil</Link>
                  <Link href="/favoritos" onClick={() => setIsMenuOpen(false)} className="py-5 px-6 text-xl font-black tracking-tighter text-gray-900 border-b border-gray-50">Favoritos</Link>
                  <button onClick={handleLogout} className="mt-8 w-full py-5 text-center text-xs font-black uppercase tracking-widest text-red-500 bg-red-50 rounded-2xl">Cerrar Sesión</button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>
      
      {/* Spacer exacto de la altura del header (h-20) para que el contenido de debajo no se tape */}
      <div className="h-20 w-full bg-white md:bg-transparent"></div>
    </>
  );
}

// --- SUBCOMPONENTES ---
function MenuLink({ href, icon, label }: any) {
  return (
    <Link href={href} className="flex items-center px-6 py-3 text-[11px] font-black uppercase tracking-widest text-gray-700 hover:text-cofrade-main hover:bg-gray-50 transition-all">
      <span className="mr-3 opacity-50">{icon}</span>
      {label}
    </Link>
  );
}