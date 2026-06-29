'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Newspaper, Images, Map, User, LogIn } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Inicio' },
  { href: '/feed', icon: Newspaper, label: 'Feed' },
  { href: '/explorar', icon: Images, label: 'Galería' },
  { href: '/mapa', icon: Map, label: 'Mapa' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const check = () => setIsLoggedIn(!!localStorage.getItem('token'));
    check();
    window.addEventListener('auth-change', check);
    return () => window.removeEventListener('auth-change', check);
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[990] md:hidden bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
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
          href={isLoggedIn ? '/profile' : '/login'}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 transition-colors ${
            pathname === '/profile' || pathname === '/login' ? 'text-cofrade-main' : 'text-gray-400'
          }`}
        >
          {isLoggedIn
            ? <User size={21} strokeWidth={pathname === '/profile' ? 2.5 : 1.75} />
            : <LogIn size={21} strokeWidth={1.75} />
          }
          <span className={`text-[9px] font-black uppercase tracking-wider leading-none ${pathname === '/profile' || pathname === '/login' ? 'text-cofrade-main' : 'text-gray-400'}`}>
            {isLoggedIn ? 'Perfil' : 'Login'}
          </span>
        </Link>
      </div>
    </nav>
  );
}
