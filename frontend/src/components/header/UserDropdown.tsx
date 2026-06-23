import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, ChevronDown, Heart, Settings, LogOut, ShieldCheck, LayoutDashboard, Newspaper, Calendar, Images } from 'lucide-react';

function MenuLink({ href, icon, label, onClose, highlight }: { href: string; icon: React.ReactNode; label: string; onClose: () => void; highlight?: boolean }) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={`flex items-center px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${
        highlight
          ? 'text-cofrade-main hover:bg-cofrade-main/5'
          : 'text-gray-700 hover:text-cofrade-main hover:bg-gray-50'
      }`}
    >
      <span className="mr-3 opacity-60">{icon}</span>
      {label}
    </Link>
  );
}

export default function UserDropdown({ onLogout, isAdmin }: { onLogout: () => void; isAdmin: boolean }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isDropdownOpen]);

  const close = () => setIsDropdownOpen(false);

  return (
    <div className="hidden md:flex items-center gap-3">

      {/* Botón Admin visible en el header */}
      {isAdmin && (
        <Link
          href="/admin"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-cofrade-main text-white text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-sm shadow-cofrade-main/20"
        >
          <ShieldCheck size={14} />
          Admin
        </Link>
      )}

      {/* Dropdown de usuario */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setIsDropdownOpen(prev => !prev)}
          className="flex items-center gap-2 p-1 pr-3 rounded-[2rem] bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-all active:scale-95"
        >
          <div className="h-9 w-9 rounded-full bg-cofrade-main text-white flex items-center justify-center font-black shadow-inner">
            {isAdmin ? <ShieldCheck size={16} /> : <User size={18} />}
          </div>
          <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-3 w-56 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 py-3 z-[110] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
            <div className="px-6 py-3 border-b border-gray-50 mb-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mi Cuenta</p>
            </div>

            {isAdmin && (
              <>
                <MenuLink href="/admin" icon={<LayoutDashboard size={16} />} label="Panel de Admin" onClose={close} highlight />
                <div className="mx-4 my-1 border-t border-gray-100" />
              </>
            )}

            <MenuLink href="/feed" icon={<Newspaper size={16} />} label="Mi Feed" onClose={close} highlight />
            <MenuLink href="/calendario" icon={<Calendar size={16} />} label="Mi Calendario" onClose={close} highlight />
            <MenuLink href="/explorar" icon={<Images size={16} />} label="Explorar" onClose={close} />
            <MenuLink href="/profile" icon={<User size={16} />} label="Perfil" onClose={close} />
            <MenuLink href="/favoritos" icon={<Heart size={16} />} label="Favoritos" onClose={close} />
            <MenuLink href="/settings" icon={<Settings size={16} />} label="Ajustes" onClose={close} />

            <div className="mt-2 pt-2 border-t border-gray-50">
              <button
                onClick={() => { close(); onLogout(); }}
                className="flex w-full items-center px-6 py-3 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} className="mr-3" /> Salir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
