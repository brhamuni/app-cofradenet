import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import CityCard from '../cards/CityCard';
import { API } from '@/lib/api';

const FEATURED = [
  { nombre: 'Sevilla', img: 'https://visitasevilla.es/wp-content/uploads/2025/06/shutterstock_2425620139.jpg' },
  { nombre: 'Málaga', img: 'https://www.jdiezarnal.com/catedraldemalagavista01.jpg' },
  { nombre: 'Granada', img: 'https://media.tacdn.com/media/attractions-splice-spp-674x446/12/42/ef/47.jpg' },
  { nombre: 'Córdoba', img: 'https://mezquita-catedraldecordoba.es/site/assets/files/24312/mezquita-catedral-cordoba-1.1152x1152.jpg' },
];

interface Ciudad {
  id: number;
  nombre: string;
  provincia?: string;
}

export default async function FeaturedCities() {
  let allCiudades: Ciudad[] = [];
  try {
    const res = await fetch(`${API}/ciudades`, { next: { revalidate: 3600 } });
    if (res.ok) allCiudades = await res.json();
  } catch {
    // API no disponible: se muestran solo ciudades emparejadas si hay caché previa
  }

  const ciudades = FEATURED.flatMap(({ nombre, img }) => {
    const ciudad = allCiudades.find((c) => c.nombre === nombre);
    return ciudad ? [{ id: ciudad.id, nombre, img, provincia: ciudad.provincia }] : [];
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
        <h2 className="text-3xl sm:text-4xl font-black text-cofrade-main tracking-tighter">
          CIUDADES <br/> <span className="text-cofrade-gold">REFERENTES</span>
        </h2>
        <Link href="/explorar" className="group flex items-center gap-2 text-sm font-black tracking-widest uppercase text-gray-400 hover:text-cofrade-main transition-colors shrink-0 self-start sm:self-auto">
          Ver todas <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {ciudades.map((ciudad) => (
          <CityCard
            key={ciudad.id}
            id={ciudad.id}
            nombre={ciudad.nombre}
            imagen={ciudad.img}
            region={ciudad.provincia}
          />
        ))}
      </div>
    </section>
  );
}
