'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, Heart, Settings, Menu, X, ChevronDown } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  
  // Estados
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Para el móvil
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Para el menú de usuario

  // --- NUEVOS ESTADOS PARA EL SCROLL ---
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Comprobamos si el usuario está logueado y escuchamos cambios
  useEffect(() => {
    // Función que comprueba el token
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token); // !! convierte el token a boolean (true si existe, false si no)
    };

    // 1. Ejecutamos la comprobación al cargar el Header por primera vez
    checkAuth();

    // 2. Escuchamos el evento personalizado 'auth-change' que lanzaremos desde el Login
    window.addEventListener('auth-change', checkAuth);

    // Limpiamos el event listener cuando el componente se desmonte
    return () => {
      window.removeEventListener('auth-change', checkAuth);
    };
  }, []);

  // --- EFECTO PARA OCULTAR/MOSTRAR EL HEADER AL HACER SCROLL ---
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Si bajamos y pasamos los 50px, ocultamos. Si subimos, mostramos.
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  const handleLogout = () => {
    // Borramos el token
    localStorage.removeItem('token');
    
    // Lanzamos el evento para que el Header (y cualquier otra parte) se entere
    window.dispatchEvent(new Event('auth-change'));
    
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
    router.push('/');
  };

  return (
    // EL CONTENEDOR STICKY: Mantiene el espacio (h-16) reservado para que el contenido no salte
    <div className="sticky top-0 z-50 h-16 w-full">
      {/* EL HEADER REAL: Este es el que se anima (sube y baja) */}
      <header 
        className={`absolute top-0 w-full bg-white shadow-sm border-b border-gray-100 transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* LOGO A DOS COLORES */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-extrabold tracking-tight">
                <span className="text-cofrade-main">Cofrade</span>
                <span className="text-cofrade-gold">net</span>
              </Link>
            </div>

            {/* MENÚ DE ESCRITORIO */}
            

            {/* ZONA DE USUARIO (DERECHA) */}
            <div className="hidden md:flex items-center space-x-4">
              {!isLoggedIn ? (
                // VISTA PARA INVITADOS (NO LOGUEADOS)
                <>
                  <Link href="/login" className="text-gray-600 hover:text-cofrade-main font-medium px-3 py-2">
                    Iniciar Sesión
                  </Link>
                  <Link href="/register" className="bg-cofrade-main text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-all">
                    Registrarse
                  </Link>
                </>
              ) : (
                // VISTA PARA USUARIOS LOGUEADOS
                <div className="relative">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
                  >
                    <div className="h-8 w-8 rounded-full bg-cofrade-main/10 flex items-center justify-center text-cofrade-main">
                      <User size={18} />
                    </div>
                    <ChevronDown size={16} className="text-gray-500" />
                  </button>

                  {/* DESPLEGABLE DEL USUARIO */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-50 mb-1">
                        <p className="text-sm font-medium text-gray-900">Mi Cuenta</p>
                      </div>
                      
                      <Link href="/favoritos" onClick={() => setIsDropdownOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-cofrade-main transition-colors">
                        <Heart size={16} className="mr-2" />
                        Mis Favoritos
                      </Link>
                      
                      <Link href="/perfil" onClick={() => setIsDropdownOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-cofrade-main transition-colors">
                        <Settings size={16} className="mr-2" />
                        Configuración
                      </Link>
                      
                      <div className="border-t border-gray-50 mt-1 pt-1">
                        <button 
                          onClick={handleLogout}
                          className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} className="mr-2" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BOTÓN MENÚ MÓVIL */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* MENÚ MÓVIL DESPLEGABLE*/}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-2 pt-2 pb-4 space-y-1">
            <Link href="/hermandades" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">Hermandades</Link>
            <Link href="/bandas" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">Bandas</Link>
            
            {!isLoggedIn ? (
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col space-y-2 px-3">
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="text-center text-gray-600 font-medium py-2">Iniciar Sesión</Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)} className="text-center bg-cofrade-main text-white py-2 rounded-xl font-medium">Registrarse</Link>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
                <Link href="/favoritos" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">Mis Favoritos</Link>
                <Link href="/perfil" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">Mi Perfil</Link>
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md">
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </div>
  );
}