import { notFound } from 'next/navigation';
import BandaProfile from '../../../components/banda/BandaProfile';
import { API } from '@/lib/api';

export default async function BandaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let banda;
  try {
    const res = await fetch(`${API}/bandas/${id}`, { cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 404) return notFound();
      return <div className="p-10 text-center font-bold">Error cargando banda</div>;
    }
    banda = await res.json();
  } catch {
    return <div className="p-10 text-center font-bold">Error cargando banda</div>;
  }

  return <BandaProfile banda={banda} />;
}
