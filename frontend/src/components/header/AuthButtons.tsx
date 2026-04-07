import Link from 'next/link';

export default function AuthButtons() {
  return (
    <div className="hidden md:flex items-center gap-6">
      <Link href="/login" className="text-xs font-black uppercase tracking-widest text-gray-900 hover:text-cofrade-main transition-colors">
        Login
      </Link>
      <Link href="/register" className="bg-cofrade-main text-white px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-cofrade-main/20 hover:scale-105 active:scale-95 transition-all">
        Únete
      </Link>
    </div>
  );
}