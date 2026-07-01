import Link from 'next/link';
import { User, LogOut, ShieldCheck, MapPin, Calendar, Images, Newspaper } from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function MobileMenu({ isOpen, isLoggedIn, isAdmin, onClose, onLogout }: MobileMenuProps) {
  if (!isOpen) return null;

  const handleLogoutClick = () => {
    onClose();
    onLogout();
  };

  return (
    <div className="fixed inset-0 top-0 bg-white z-[998] p-6 pt-24 animate-in slide-in-from-top duration-300 md:hidden">
      <nav className="flex flex-col gap-2">
        {!isLoggedIn ? (
          <div className="flex flex-col gap-4 mt-4">
            <Link href="/mapa" onClick={onClose} className="flex items-center gap-4 py-5 px-6 text-xl font-black tracking-tighter text-gray-900 border-b border-gray-50">
              <MapPin size={20} className="text-cofrade-main" /> Mapa en Directo
            </Link>
            <Link href="/login" onClick={onClose} className="py-5 text-center text-sm font-black uppercase tracking-widest border border-gray-100 rounded-2xl">
              Login
            </Link>
            <Link href="/register" onClick={onClose} className="py-5 text-center text-sm font-black uppercase tracking-widest bg-cofrade-main text-white rounded-2xl shadow-lg shadow-cofrade-main/20">
              Únete a CofradeNet
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-4">

            <Link href="/mapa" onClick={onClose} className="flex items-center gap-4 py-5 px-6 text-xl font-black tracking-tighter text-gray-900 border-b border-gray-50">
              <MapPin size={20} className="text-cofrade-main" /> Mapa en Directo
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                onClick={onClose}
                className="flex items-center gap-4 py-5 px-6 text-xl font-black tracking-tighter text-white bg-cofrade-main rounded-2xl mb-2 shadow-lg shadow-cofrade-main/20"
              >
                <ShieldCheck size={22} /> Panel de Administración
              </Link>
            )}

            <Link href="/feed" onClick={onClose} className="flex items-center gap-4 py-5 px-6 text-xl font-black tracking-tighter text-gray-900 border-b border-gray-50">
              <Newspaper size={20} className="text-cofrade-main" /> Mi Feed
            </Link>
            <Link href="/calendario" onClick={onClose} className="flex items-center gap-4 py-5 px-6 text-xl font-black tracking-tighter text-gray-900 border-b border-gray-50">
              <Calendar size={20} className="text-cofrade-main" /> Mi Calendario
            </Link>
            <Link href="/explorar" onClick={onClose} className="flex items-center gap-4 py-5 px-6 text-xl font-black tracking-tighter text-gray-900 border-b border-gray-50">
              <Images size={20} className="text-gray-400" /> Explorar
            </Link>
            <Link href="/profile" onClick={onClose} className="flex items-center gap-4 py-5 px-6 text-xl font-black tracking-tighter text-gray-900 border-b border-gray-50">
              <User size={20} className="text-gray-400" /> Mi Perfil
            </Link>
            <button onClick={handleLogoutClick} className="mt-8 w-full flex items-center justify-center gap-3 py-5 text-xs font-black uppercase tracking-widest text-red-500 bg-red-50 rounded-2xl">
              <LogOut size={16} /> Cerrar Sesión
            </button>
          </div>
        )}
      </nav>
    </div>
  );
}
