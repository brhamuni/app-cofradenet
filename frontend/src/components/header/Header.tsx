'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';

import AuthButtons from './AuthButtons';
import UserDropdown from './UserDropdown';
import MobileMenu from './MobileMenu';
import api from '@/app/api/axios';

export default function Header() {
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const isMenuOpenRef = useRef(false);

  useEffect(() => { isMenuOpenRef.current = isMenuOpen; }, [isMenuOpen]);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setIsAdmin(payload.rol === 'admin');
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAuth();
    window.addEventListener('auth-change', checkAuth);
    return () => window.removeEventListener('auth-change', checkAuth);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsScrolled(currentScrollY > 20);

      if (!isMenuOpenRef.current) {
        if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try { await api.post('/auth/logout', { refresh_token: refreshToken }); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    window.dispatchEvent(new Event('auth-change'));
    setIsMenuOpen(false);
    router.push('/');
  };

  return (
    <>
      {/* ARREGLADO: Subimos el z-index a 999 para que siempre esté por encima de TODO */}
      <header
        className={`fixed top-0 left-0 right-0 z-[999] h-20 transition-[transform,opacity] duration-300 ease-in-out ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        } ${
          isScrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-100'
            : 'bg-transparent'
        }`}
      >
        <div className="w-full h-full px-6 lg:px-12 flex justify-between items-center relative z-[1000]">
          
          <div className="shrink-0">
            <Link href="/" className="text-3xl font-black tracking-tighter flex items-center gap-1 group">
              <span className="text-cofrade-main">COFRADE</span>
              <span className="text-cofrade-gold group-hover:rotate-12 transition-transform">NET</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {!isLoggedIn ? (
              <AuthButtons />
            ) : (
              <UserDropdown onLogout={handleLogout} isAdmin={isAdmin} />
            )}

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className={`md:hidden p-3 rounded-2xl transition-all ${isScrolled ? 'bg-gray-100 text-gray-900' : 'bg-white/20 backdrop-blur-md text-gray-900'}`}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={isMenuOpen}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        onClose={() => setIsMenuOpen(false)}
        onLogout={handleLogout}
      />
      
      <div className="h-20 w-full bg-white md:bg-transparent"></div>
    </>
  );
}