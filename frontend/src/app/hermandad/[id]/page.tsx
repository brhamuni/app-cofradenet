import { Profile } from '../../../components/profile/Profile';
import { notFound } from 'next/navigation';

export default async function HermandadPage({ params }: { params: Promise<{ id: string }> }) {
  
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  try {
    const res = await fetch(`http://localhost:3000/hermandades/${id}`, {
      cache: 'no-store' 
    });

    if (!res.ok) {
      if (res.status === 404) return notFound();
      throw new Error('Error al cargar datos');
    }

    const hermandad = await res.json();

    // Generamos un username limpio
    const baseName = hermandad.nombrePopular || hermandad.nombre || "hermandad";
    const cleanUsername = "@" + baseName
      .toLowerCase()
      .trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '_');

    // Mapeamos los datos
    const mappedData = {
      name: hermandad.nombrePopular || hermandad.nombre,
      username: cleanUsername,
      bio: hermandad.descripcion || "Hermandad de penitencia.",
      location: hermandad.ciudad?.nombre ? `${hermandad.ciudad.nombre}, Andalucía` : 'Andalucía, España',
      link: hermandad.web || "", 
      followers: hermandad.seguidoresCount || "0", 
      following: hermandad.siguiendoCount || "0",
      posts: hermandad.publicacionesCount || 0,
      coverImage: hermandad.fotoPortada || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=2000&q=80"
    };

    return (
      <Profile 
        userId={id} // Usamos el id resuelto
        isOwnProfile={false}
        userType="HERMANDAD"
        isVerified={true} 
        profileData={mappedData}
      />
    );

  } catch (error) {
    console.error("Error cargando la página de la hermandad:", error);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Error de conexión</h2>
          <p className="text-gray-500">No se pudo cargar el perfil de la hermandad en este momento.</p>
        </div>
      </div>
    );
  }
}