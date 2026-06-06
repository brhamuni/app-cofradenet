import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Church, Calendar, Clock, MapPin } from 'lucide-react';
import { API, resolveImg } from '@/lib/api';

interface Hermandad {
  id: number;
  nombre: string;
  nombrePopular: string | null;
  imagenEscudo: string | null;
  verificada: boolean;
  ciudad: { id: number; nombre: string } | null;
}

interface Procesion {
  id: number;
  nombre: string | null;
  diaSemana: string | null;
  horaSalida: string | null;
  horaEntrada: string | null;
  hermandad: { id: number; nombre: string; nombrePopular?: string } | null;
}

interface Ciudad {
  id: number;
  nombre: string;
  provincia?: string;
}

export default async function CiudadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Resolve city by ID from the full list (no individual GET /ciudades/:id endpoint exists)
  const ciudadesRes = await fetch(`${API}/ciudades`, { cache: 'no-store' });
  if (!ciudadesRes.ok) {
    return <div className="p-10 text-center font-bold">Error cargando ciudades</div>;
  }
  const ciudades: Ciudad[] = await ciudadesRes.json();
  const ciudad = ciudades.find((c) => String(c.id) === id);
  if (!ciudad) return notFound();

  const nombreEncoded = encodeURIComponent(ciudad.nombre);

  // Fetch hermandades and procesiones in parallel
  const [hermandadesRes, procesionesRes] = await Promise.all([
    fetch(`${API}/ciudades/${nombreEncoded}/hermandades`, { cache: 'no-store' }),
    fetch(`${API}/procesiones/buscar?ciudad=${nombreEncoded}`, { cache: 'no-store' }),
  ]);

  const hermandades: Hermandad[] = hermandadesRes.ok ? await hermandadesRes.json() : [];
  const procesiones: Procesion[] = procesionesRes.ok ? await procesionesRes.json() : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HERO BANNER */}
      <div className="relative w-full h-64 md:h-96 overflow-hidden bg-cofrade-main">
        <img
          src="https://images.unsplash.com/photo-1555993539-1732b0258235?q=80&w=1600"
          alt={ciudad.nombre}
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cofrade-main/90 via-cofrade-main/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={18} className="text-cofrade-gold" />
            <span className="text-xs font-black text-cofrade-gold uppercase tracking-[0.3em]">
              {ciudad.provincia ?? 'Andalucía'}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tight drop-shadow-lg">
            {ciudad.nombre}
          </h1>
          <p className="mt-3 text-sm md:text-base font-bold text-white/70 uppercase tracking-widest">
            Hermandades y Procesiones
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT: HERMANDADES */}
          <section className="flex-1 min-w-0">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5">
              Hermandades
              <span className="ml-2 text-cofrade-main">{hermandades.length > 0 ? `· ${hermandades.length}` : ''}</span>
            </p>

            {hermandades.length === 0 ? (
              <EmptyState
                icon={<Church size={28} className="text-gray-300" />}
                title="Sin hermandades registradas"
                subtitle="Aún no hay hermandades para esta ciudad"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hermandades.map((h) => (
                  <Link
                    key={h.id}
                    href={`/hermandad/${h.id}`}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-4 flex items-center gap-4 group"
                  >
                    {/* ESCUDO */}
                    <div className="shrink-0 w-14 h-14 rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center">
                      {resolveImg(h.imagenEscudo) ? (
                        <img
                          src={resolveImg(h.imagenEscudo)}
                          alt={h.nombre}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Church size={24} className="text-cofrade-main/30" />
                      )}
                    </div>

                    {/* INFO */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight truncate leading-tight">
                          {h.nombrePopular || h.nombre}
                        </p>
                        {h.verificada && (
                          <CheckCircle2 size={16} className="text-cofrade-gold fill-cofrade-gold/20 shrink-0" />
                        )}
                      </div>
                      {h.nombrePopular && (
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate">
                          {h.nombre}
                        </p>
                      )}
                    </div>

                    {/* ARROW */}
                    <div className="shrink-0 w-7 h-7 rounded-full bg-gray-50 group-hover:bg-cofrade-main transition-colors flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-400 group-hover:text-white transition-colors">
                        <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* RIGHT: PROCESIONES */}
          <section className="lg:w-80 xl:w-96 shrink-0">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5">
              Procesiones
              <span className="ml-2 text-cofrade-main">{procesiones.length > 0 ? `· ${procesiones.length}` : ''}</span>
            </p>

            {procesiones.length === 0 ? (
              <EmptyState
                icon={<Calendar size={28} className="text-gray-300" />}
                title="Sin procesiones registradas"
                subtitle="Aún no hay procesiones para esta ciudad"
              />
            ) : (
              <div className="flex flex-col gap-3">
                {procesiones.map((p) => (
                  <Link
                    key={p.id}
                    href={`/procesion/${p.id}`}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-4 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-9 h-9 rounded-xl bg-cofrade-main/5 flex items-center justify-center text-cofrade-main group-hover:bg-cofrade-main group-hover:text-white transition-colors">
                        <Calendar size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight truncate leading-tight">
                          {p.nombre || p.hermandad?.nombrePopular || p.hermandad?.nombre || 'Procesión'}
                        </p>
                        {p.hermandad && (
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate mt-0.5">
                            {p.hermandad.nombrePopular || p.hermandad.nombre}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {p.diaSemana && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-cofrade-main uppercase tracking-widest">
                              <Calendar size={10} />
                              {p.diaSemana}
                            </span>
                          )}
                          {p.horaSalida && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              <Clock size={10} />
                              {p.horaSalida}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3 border border-dashed border-gray-200">
        {icon}
      </div>
      <p className="text-xs font-black text-gray-900 uppercase tracking-tighter italic">{title}</p>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{subtitle}</p>
    </div>
  );
}
