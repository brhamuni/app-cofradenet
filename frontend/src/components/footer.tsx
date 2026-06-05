import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-zinc-800 pt-12 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

          {/* Columna 1: Marca */}
          <div className="md:col-span-2 space-y-4">
            <span className="font-extrabold text-2xl text-white tracking-tight">
              Cofrade<span className="text-cofrade-gold">Net</span>
            </span>
            <p className="text-zinc-300 text-sm max-w-sm leading-relaxed">
              La plataforma integral para la gestión y seguimiento de la Semana Santa. Conecta con tu hermandad, descubre bandas y sigue los itinerarios en tiempo real.
            </p>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div>
            <h3 className="font-semibold text-white mb-4">Plataforma</h3>
            <ul className="space-y-3 text-sm text-zinc-300">
              <li><Link href="/mapa" className="hover:text-cofrade-gold transition-colors">Mapa en Vivo</Link></li>
              <li><Link href="/hermandades" className="hover:text-cofrade-gold transition-colors">Directorio de Hermandades</Link></li>
              <li><Link href="/bandas" className="hover:text-cofrade-gold transition-colors">Directorio de Bandas</Link></li>
            </ul>
          </div>

          {/* Columna 3: Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-3 text-sm text-zinc-300">
              <li><Link href="/privacidad" className="hover:text-cofrade-gold transition-colors">Política de Privacidad</Link></li>
              <li><Link href="/terminos" className="hover:text-cofrade-gold transition-colors">Términos de Uso</Link></li>
              <li><Link href="/contacto" className="hover:text-cofrade-gold transition-colors">Contacto</Link></li>
            </ul>
          </div>
        </div>

        {/* Separador y Copyright */}
        <div className="border-t border-zinc-600 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-zinc-400">
            © {currentYear} CofradeNet. Proyecto de Trabajo de Fin de Grado.
          </p>
          <div className="text-sm text-zinc-400">
            Hecho con dedicación en España.
          </div>
        </div>
      </div>
    </footer>
  );
}