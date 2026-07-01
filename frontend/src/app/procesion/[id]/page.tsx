import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  MapPin,
  Music,
  Calendar,
  Users,
  ChevronRight,
} from 'lucide-react';
import { API, resolveImg } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItinerarioItem {
  id: number;
  orden: number;
  lugar: string;
  hora: string;
}

interface Hermandad {
  id: number;
  nombre: string;
  imagenEscudo?: string;
}

interface Procesion {
  id: number;
  nombre: string;
  diaSemana: string;
  fecha: string;
  horaSalida: string;
  horaEntrada?: string;
  hermandad: Hermandad;
  itinerario: ItinerarioItem[];
}

interface Banda {
  id: number;
  nombre: string;
  estiloMusical?: string;
  imagenLogo?: string;
}

interface Participacion {
  id: number;
  anio: number;
  ubicacion?: string;
  bandaId?: number | null;
  nombreBanda?: string | null;
  banda?: Banda | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function trimTime(time: string): string {
  return time?.slice(0, 5) ?? '';
}

function formatFechaES(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoChip({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl">
      <div className="shrink-0 w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-cofrade-main">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {inner}
      </Link>
    );
  }
  return inner;
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-lg font-black text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProcesionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [procesionRes, participacionesRes] = await Promise.all([
    fetch(`${API}/procesiones/${id}`, { cache: 'no-store' }),
    fetch(`${API}/procesiones/${id}/participaciones`, { cache: 'no-store' }),
  ]);

  if (!procesionRes.ok) {
    if (procesionRes.status === 404) return notFound();
    return (
      <div className="p-10 text-center font-bold text-gray-700">
        Error cargando la procesión
      </div>
    );
  }

  const procesion: Procesion = await procesionRes.json();

  let participaciones: Participacion[] = [];
  if (participacionesRes.ok) {
    participaciones = await participacionesRes.json();
  }

  const escudoUrl = resolveImg(procesion.hermandad?.imagenEscudo);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1559564484-e48b3e040ff4?auto=format&fit=crop&w=1600&q=80"
          alt="Procesión"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-cofrade-main via-cofrade-main/70 to-cofrade-main/40" />

        <div className="relative z-10 flex flex-col justify-end h-full max-w-4xl mx-auto px-4 pb-8">
          {procesion.hermandad && (
            <div className="flex items-center gap-2 mb-3">
              {escudoUrl && (
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/50 bg-white/10 shrink-0">
                  <img
                    src={escudoUrl}
                    alt={procesion.hermandad.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <Link
                href={`/hermandad/${procesion.hermandad.id}`}
                className="text-white/90 text-sm font-bold hover:text-cofrade-gold transition-colors"
              >
                {procesion.hermandad.nombre}
              </Link>
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
            {procesion.nombre}
          </h1>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Card: Horario y Datos */}
        <SectionCard title="Horario y Datos">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoChip
              icon={<Calendar size={18} />}
              label="Día"
              value={procesion.diaSemana}
            />
            <InfoChip
              icon={<Calendar size={18} />}
              label="Fecha"
              value={formatFechaES(procesion.fecha)}
            />
            <InfoChip
              icon={<Clock size={18} />}
              label="Salida"
              value={trimTime(procesion.horaSalida)}
            />
            {procesion.horaEntrada && (
              <InfoChip
                icon={<Clock size={18} />}
                label="Entrada"
                value={trimTime(procesion.horaEntrada)}
              />
            )}
            {procesion.hermandad && (
              <InfoChip
                icon={<Users size={18} />}
                label="Hermandad"
                value={procesion.hermandad.nombre}
                href={`/hermandad/${procesion.hermandad.id}`}
              />
            )}
          </div>
        </SectionCard>

        {/* Card: Itinerario */}
        <SectionCard title="Itinerario">
          {procesion.itinerario && procesion.itinerario.length > 0 ? (
            <ol className="space-y-3">
              {procesion.itinerario.map((punto) => (
                <li key={punto.id} className="flex items-center gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-cofrade-main text-white text-xs font-black flex items-center justify-center">
                    {punto.orden}
                  </span>
                  <MapPin size={15} className="shrink-0 text-cofrade-main" />
                  <span className="flex-1 text-sm font-bold text-gray-800">
                    {punto.lugar}
                  </span>
                  <span className="shrink-0 text-sm font-bold text-cofrade-main tabular-nums">
                    {punto.hora}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <MapPin size={36} className="mb-3 opacity-40" />
              <p className="text-sm font-bold">Itinerario no publicado aún</p>
            </div>
          )}
        </SectionCard>

        {/* Card: Bandas */}
        {participacionesRes.ok && (
          <SectionCard title="Bandas que acompañan">
            {participaciones.length > 0 ? (
              <ul className="space-y-1">
                {participaciones.map((p) => {
                  const tienePerfil = !!p.bandaId && !!p.banda;
                  const nombre = p.banda?.nombre ?? p.nombreBanda ?? 'Banda';
                  const logoUrl = resolveImg(p.banda?.imagenLogo);

                  const content = (
                    <>
                      <div className="shrink-0 w-12 h-12 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Music size={20} className="text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate">
                          {nombre}
                          {!tienePerfil && (
                            <span className="ml-1.5 text-[10px] font-bold text-gray-400 normal-case">
                              (sin perfil)
                            </span>
                          )}
                        </p>
                        {p.banda?.estiloMusical && (
                          <p className="text-xs text-gray-500 font-bold truncate">
                            {p.banda.estiloMusical}
                          </p>
                        )}
                        {p.ubicacion && (
                          <p className="text-xs text-cofrade-main font-bold mt-0.5">
                            {p.ubicacion}
                          </p>
                        )}
                      </div>

                      {tienePerfil && (
                        <ChevronRight
                          size={16}
                          className="shrink-0 text-gray-300 group-hover:text-cofrade-main transition-colors"
                        />
                      )}
                    </>
                  );

                  return (
                    <li key={p.id}>
                      {tienePerfil ? (
                        <Link
                          href={`/banda/${p.banda!.id}`}
                          className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors group"
                        >
                          {content}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-4 p-3 rounded-2xl">
                          {content}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Music size={36} className="mb-3 opacity-40" />
                <p className="text-sm font-bold">
                  No hay bandas registradas para este año
                </p>
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
}
