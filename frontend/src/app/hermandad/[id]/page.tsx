import { notFound } from 'next/navigation';
import HermandadProfile from '../../../components/hermandad/HermandadProfile';
import { API } from '@/lib/api';

export default async function HermandadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const res = await fetch(`${API}/hermandades/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    if (res.status === 404) return notFound();
    return <div className="p-10 text-center font-bold">Error cargando hermandad</div>;
  }

  const hermandad = await res.json();
  return <HermandadProfile hermandad={hermandad} />;
}
