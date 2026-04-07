import { useState } from 'react';
import Link from 'next/link';
import { User, ChevronDown, Heart, Settings, LogOut } from 'lucide-react';

// Subcomponente de uso interno
function MenuLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <Link href={href} className="flex items-center px-6 py-3 text-[11px] font-black uppercase tracking-widest text-gray-700 hover:text-cofrade-main hover:bg-gray-50 transition-all">
      <span className="mr-3 opacity-50">{icon}</span>
      {label}
    </Link>
  );
}

export default function UserDropdown({ onLogout }: { onLogout: () => void }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    onLogout();
  };

  return (
    /* ARREGLADO: 'hidden' por defecto para móviles y 'md:flex' para escritorio */
    <div className="hidden md:flex items-center gap-3 md:gap-4">
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

        {isDropdownOpen && (
          <div className="absolute right-0 mt-6 w-56 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 py-3 z-[110] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
            <div className="px-6 py-3 border-b border-gray-50 mb-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mi Cuenta</p>
            </div>
            <MenuLink href="/profile" icon={<User size={16}/>} label="Perfil" />
            <MenuLink href="/favoritos" icon={<Heart size={16}/>} label="Favoritos" />
            <MenuLink href="/settings" icon={<Settings size={16}/>} label="Ajustes" />
            <div className="mt-2 pt-2 border-t border-gray-50">
              <button onClick={handleLogoutClick} className="flex w-full items-center px-6 py-3 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors">
                <LogOut size={16} className="mr-3" /> Salir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}