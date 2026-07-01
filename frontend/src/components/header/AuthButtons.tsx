import Link from 'next/link';

export default function AuthButtons() {
  return (
    <div className="flex items-center gap-3 md:gap-6">
      <Link href="/login" className="hidden sm:inline-flex sm:items-center sm:min-h-11 text-xs font-black uppercase tracking-widest text-gray-900 hover:text-cofrade-main transition-colors">
        Login
      </Link>
      <Link href="/register" className="inline-flex items-center justify-center min-h-11 bg-cofrade-main text-white px-5 sm:px-8 py-2.5 rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-cofrade-main/20 hover:scale-105 active:scale-95 transition-all">
        Únete
      </Link>
    </div>
  );
}