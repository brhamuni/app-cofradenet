"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MapPin, BadgeCheck } from "lucide-react";
import EditHermandadModal from "../../components/profile/EditHermandadModal";

export default function ProfilePage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [rawData, setRawData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setCargando(false); return; }

    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      const id = payload.sub || payload.id;

      fetch(`http://localhost:3000/hermandades/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setRawData(data);
            setProfileData({
              name: data.nombrePopular || data.nombre || "Mi perfil",
              username: "@" + (data.nombrePopular || data.nombre || "perfil").toLowerCase().replace(/\s+/g, '_'),
              bio: data.descripcion || "",
              location: data.ciudad?.nombre ? `${data.ciudad.nombre}, Andalucía` : 'Andalucía, España',
              avatarImage: data.imagenEscudo || "https://via.placeholder.com/150",
              coverImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=2000&q=80",
            });
          }
        })
        .finally(() => setCargando(false));
    } catch {
      setCargando(false);
    }
  }, []);

  if (cargando) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!profileData) return <div className="min-h-screen flex items-center justify-center">No se encontró el perfil.</div>;

  return (
    <div className="min-h-screen bg-white relative">
      <div className="relative w-full h-48 md:h-64 bg-gray-200">
        <Image src={profileData.coverImage} alt="Portada" fill className="object-cover" priority />
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <div className="relative flex justify-between items-end -mt-16 mb-4">
          <div className="relative h-32 w-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-sm">
            <Image src={profileData.avatarImage} alt="Avatar" fill className="object-cover" />
          </div>

          <div className="pb-4">
            <button
              onClick={() => setModalAbierto(true)}
              className="px-6 py-2 rounded-full border border-gray-300 font-bold hover:bg-gray-50 transition-all active:scale-95"
            >
              Editar Perfil
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-1">
            <h1 className="text-2xl font-black">{profileData.name}</h1>
            <BadgeCheck size={20} className="text-blue-500" />
          </div>
          <p className="text-gray-500">{profileData.username}</p>
        </div>

        <p className="text-gray-800 mb-4">{profileData.bio}</p>

        <div className="flex gap-4 text-sm text-gray-500 mb-6">
          <div className="flex items-center gap-1"><MapPin size={16} /> {profileData.location}</div>
        </div>
      </div>

      <EditHermandadModal
        hermandad={rawData || {}}
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
      />
    </div>
  );
}
