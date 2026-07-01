'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import AuthButtons from './AuthButtons';
import UserDropdown from './UserDropdown';
import NotificationBell from './NotificationBell';
import api from '@/app/api/axios';

export default function Header() {
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);

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

      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
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
    router.push('/');
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-999 h-20 transition-[transform,opacity] duration-300 ease-in-out ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        } ${
          isScrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-100'
            : 'bg-transparent'
        }`}
      >
        <div className="w-full h-full px-4 sm:px-6 lg:px-12 flex justify-between items-center relative z-1000">
          <Link href="/" className="text-2xl sm:text-3xl font-black tracking-tighter flex items-center gap-1 group min-h-11 shrink-0">
            <span className="text-cofrade-main">COFRADE</span>
            <span className="text-cofrade-gold group-hover:rotate-12 transition-transform">NET</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            {isLoggedIn && <NotificationBell />}
            {!isLoggedIn ? (
              <AuthButtons />
            ) : (
              <UserDropdown onLogout={handleLogout} isAdmin={isAdmin} />
            )}
          </div>
        </div>
      </header>

      <div className="h-20 w-full bg-white md:bg-transparent" />
    </>
  );
}
