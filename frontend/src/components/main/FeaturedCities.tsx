import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import CityCard from '../cards/CityCard'; // Ajusta la ruta según tu carpeta

const CIUDADES = [
  { n: 'Sevilla', img: 'https://visitasevilla.es/wp-content/uploads/2025/06/shutterstock_2425620139.jpg' },
  { n: 'Málaga', img: 'https://www.jdiezarnal.com/catedraldemalagavista01.jpg' },
  { n: 'Granada', img: 'https://media.tacdn.com/media/attractions-splice-spp-674x446/12/42/ef/47.jpg' },
  { n: 'Córdoba', img: 'https://mezquita-catedraldecordoba.es/site/assets/files/24312/mezquita-catedral-cordoba-1.1152x1152.jpg' },
];

export default function FeaturedCities() {
  return (
    <section className="max-w-7xl mx-auto px-6 pb-24">
      <div className="flex items-end justify-between mb-12">
        <h2 className="text-4xl font-black text-cofrade-main tracking-tighter">
          CIUDADES <br/> <span className="text-cofrade-gold">REFERENTES</span>
        </h2>
        <Link href="/ciudades" className="group flex items-center gap-2 text-sm font-black tracking-widest uppercase text-gray-400 hover:text-cofrade-main transition-colors">
          Ver todas <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {CIUDADES.map((ciudad, i) => (
          <CityCard 
            key={i} 
            nombre={ciudad.n} 
            imagen={ciudad.img} 
          />
        ))}
      </div>
    </section>
  );
}