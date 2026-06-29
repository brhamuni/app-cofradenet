"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MapPin, BadgeCheck } from "lucide-react";
import EditHermandadModal from "../../components/profile/EditHermandadModal";
import ImageUpload from "@/components/ui/ImageUpload";
import { API, resolveImg } from '@/lib/api';
import { parseJwtPayload } from '@/lib/jwt';

export default function ProfilePage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [rawData, setRawData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [hermandadId, setHermandadId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setCargando(false); return; }

    try {
      const payload = parseJwtPayload<{ sub?: number; id?: number }>(token);
      const id = payload?.sub || payload?.id;
      if (!id) { setCargando(false); return; }

      fetch(`${API}/hermandades/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setRawData(data);
            setHermandadId(data.id);
            setProfileData({
              name: data.nombrePopular || data.nombre || "Mi perfil",
              username: "@" + (data.nombrePopular || data.nombre || "perfil").toLowerCase().replace(/\s+/g, '_'),
              bio: data.descripcion || "",
              location: data.ciudad?.nombre ? `${data.ciudad.nombre}, Andalucía` : 'Andalucía, España',
              avatarImage: resolveImg(data.imagenEscudo) || null,
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
          <div className="border-4 border-white rounded-full shadow-sm">
            {hermandadId ? (
              <ImageUpload
                currentImage={profileData.avatarImage}
                uploadUrl={`/hermandades/${hermandadId}/logo`}
                onSuccess={(data) =>
                  setProfileData((p: any) => ({ ...p, avatarImage: resolveImg(data.imagenEscudo) ?? p.avatarImage }))
                }
                shape="circle"
                size={128}
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-4xl font-bold">
                {profileData.name?.[0] ?? "?"}
              </div>
            )}
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
