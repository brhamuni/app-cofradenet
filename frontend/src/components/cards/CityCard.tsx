import Link from 'next/link';

interface CityCardProps {
  id: number;
  nombre: string;
  imagen: string;
  region?: string;
}

export default function CityCard({ id, nombre, imagen, region = "Andalucía" }: CityCardProps) {
  return (
    <Link
      href={`/ciudad/${id}`}
      className="group relative h-[400px] rounded-[3rem] overflow-hidden cursor-pointer shadow-xl block"
    >
      {/* Imagen con zoom suave */}
      <img 
        src={imagen} 
        alt={nombre} 
        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" 
      />
      
      {/* Overlay de degradado */}
      <div className="absolute inset-0 bg-gradient-to-t from-cofrade-main/90 via-cofrade-main/20 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />
      
      {/* Contenido de la tarjeta */}
      <div className="absolute bottom-8 left-8 transform transition-transform duration-500 group-hover:-translate-y-2">
        <p className="text-cofrade-gold font-black text-[10px] uppercase tracking-[0.3em] mb-1 drop-shadow-sm">
          {region}
        </p>
        <h4 className="text-3xl font-black text-white tracking-tighter uppercase">
          {nombre}
        </h4>
        
        {/* Indicador visual extra que aparece al hacer hover */}
        <div className="w-0 group-hover:w-full h-1 bg-cofrade-gold mt-2 transition-all duration-500 rounded-full" />
      </div>
    </Link>
  );
}