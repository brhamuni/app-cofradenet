'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Newspaper, Images, Map, User, LogIn, LayoutDashboard } from 'lucide-react';
import { parseJwtPayload } from '@/lib/jwt';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Inicio' },
  { href: '/feed', icon: Newspaper, label: 'Feed' },
  { href: '/explorar', icon: Images, label: 'Galería' },
  { href: '/mapa', icon: Map, label: 'Mapa' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const check = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      if (token) {
        try {
          const payload = parseJwtPayload<{ rol?: string }>(token);
          setIsAdmin(payload?.rol === 'admin');
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    check();
    window.addEventListener('auth-change', check);
    return () => window.removeEventListener('auth-change', check);
  }, []);

  const profileHref = isLoggedIn ? (isAdmin ? '/admin' : '/profile') : '/login';
  const profileActive =
    pathname === profileHref ||
    pathname === '/login' ||
    (isAdmin && pathname.startsWith('/admin'));

  if (pathname === '/login' || pathname === '/register') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-16 px-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 transition-colors ${
                active ? 'text-cofrade-main' : 'text-gray-400'
              }`}
            >
              <Icon size={21} strokeWidth={active ? 2.5 : 1.75} />
              <span className={`text-[9px] font-black uppercase tracking-wider leading-none ${active ? 'text-cofrade-main' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          );
        })}
        <Link
          href={profileHref}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 transition-colors ${
            profileActive ? 'text-cofrade-main' : 'text-gray-400'
          }`}
        >
          {isLoggedIn
            ? isAdmin
              ? <LayoutDashboard size={21} strokeWidth={profileActive ? 2.5 : 1.75} />
              : <User size={21} strokeWidth={profileActive ? 2.5 : 1.75} />
            : <LogIn size={21} strokeWidth={1.75} />
          }
          <span className={`text-[9px] font-black uppercase tracking-wider leading-none ${profileActive ? 'text-cofrade-main' : 'text-gray-400'}`}>
            {isLoggedIn ? (isAdmin ? 'Admin' : 'Perfil') : 'Login'}
          </span>
        </Link>
      </div>
    </nav>
  );
}
