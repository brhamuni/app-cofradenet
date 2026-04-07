import Link from 'next/link';

interface MobileMenuProps {
  isOpen: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function MobileMenu({ isOpen, isLoggedIn, onClose, onLogout }: MobileMenuProps) {
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
            <Link href="/login" onClick={onClose} className="py-5 text-center text-sm font-black uppercase tracking-widest border border-gray-100 rounded-2xl">
              Login
            </Link>
            <Link href="/register" onClick={onClose} className="py-5 text-center text-sm font-black uppercase tracking-widest bg-cofrade-main text-white rounded-2xl shadow-lg shadow-cofrade-main/20">
              Únete a CofradeNet
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-4">
            <Link href="/profile" onClick={onClose} className="py-5 px-6 text-xl font-black tracking-tighter text-gray-900 border-b border-gray-50">Mi Perfil</Link>
            <Link href="/favoritos" onClick={onClose} className="py-5 px-6 text-xl font-black tracking-tighter text-gray-900 border-b border-gray-50">Favoritos</Link>
            <button onClick={handleLogoutClick} className="mt-8 w-full py-5 text-center text-xs font-black uppercase tracking-widest text-red-500 bg-red-50 rounded-2xl">
              Cerrar Sesión
            </button>
          </div>
        )}
      </nav>
    </div>
  );
}