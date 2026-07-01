import Link from 'next/link';
import { Map as MapIcon, Rss, Calendar, Image as ImageIcon } from 'lucide-react';

export default function QuickAccess({ isLoggedIn }: { isLoggedIn: boolean }) {
  const items = [
    { href: '/mapa', icon: MapIcon, title: 'En Vivo', desc: 'Sigue los pasos', color: 'bg-red-500' },
    { href: isLoggedIn ? '/feed' : '/login', icon: Rss, title: 'El Muro', desc: 'Actualidad', color: 'bg-cofrade-main' },
    { href: '/calendario', icon: Calendar, title: 'Agenda', desc: 'No te pierdas nada', color: 'bg-cofrade-gold' },
    { href: '/explorar', icon: ImageIcon, title: 'Galería', desc: 'Arte Sacro', color: 'bg-blue-600' },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 relative z-20 mb-20">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {items.map((item, index) => (
          <Link key={index} href={item.href} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 hover:shadow-2xl hover:-translate-y-2 transition-all group">
            <div className={`w-14 h-14 ${item.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:rotate-12 transition-transform`}>
              <item.icon size={28} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tighter">{item.title}</h3>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest leading-none">{item.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}