"use client";

import { useState, useEffect } from "react";
import { MapPin, BadgeCheck, LogOut, User, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import EditHermandadModal from "../../components/profile/EditHermandadModal";
import EditBandaModal from "../../components/banda/EditBandaModal";
import ImageUpload from "@/components/ui/ImageUpload";
import { API, resolveImg } from '@/lib/api';
import { parseJwtPayload } from '@/lib/jwt';
import api from '@/app/api/axios';

type EntityType = 'hermandad' | 'banda' | 'cofrade' | null;

const COFRADE_BANNER =
  "https://images.unsplash.com/photo-1559564484-e48b3e040ff4?q=80&w=1600&auto=format&fit=crop";
const ENTITY_BANNER =
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=2000&q=80";

function ProfileBanner({ coverImage, variant }: { coverImage: string; variant: 'cofrade' | 'entity' }) {
  return (
    <div className="relative w-full h-40 sm:h-48 md:h-56 overflow-hidden bg-cofrade-main">
      <img
        src={coverImage}
        alt=""
        className="w-full h-full object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-linear-to-t from-cofrade-main/90 via-cofrade-main/40 to-cofrade-main/20" />
      {variant === 'cofrade' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <User size={56} className="text-white/30" strokeWidth={1.25} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [rawData, setRawData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [hermandadId, setHermandadId] = useState<number | null>(null);
  const [bandaId, setBandaId] = useState<number | null>(null);
  const [entityType, setEntityType] = useState<EntityType>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setCargando(false); return; }

    try {
      const payload = parseJwtPayload<{ sub?: number; id?: number; rol?: string; nombre?: string; username?: string }>(token);
      const rol = payload?.rol;

      if (rol === 'hermandad') {
        fetch(`${API}/hermandades/mi-hermandad`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data) {
              setRawData(data);
              setEntityType('hermandad');
              setHermandadId(data.id);
              setProfileData({
                name: data.nombrePopular || data.nombre || "Mi Hermandad",
                username: "@" + (data.nombrePopular || data.nombre || "perfil").toLowerCase().replace(/\s+/g, '_'),
                bio: data.descripcion || "",
                location: data.ciudad?.nombre ? `${data.ciudad.nombre}, Andalucía` : 'Andalucía, España',
                avatarImage: resolveImg(data.imagenEscudo) || null,
                coverImage: ENTITY_BANNER,
              });
            }
          })
          .finally(() => setCargando(false));
      } else if (rol === 'banda') {
        fetch(`${API}/bandas/mi-banda`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data) {
              setRawData(data);
              setEntityType('banda');
              setBandaId(data.id);
              setProfileData({
                name: data.nombre || "Mi Banda",
                username: "@" + (data.nombre || "banda").toLowerCase().replace(/\s+/g, '_'),
                bio: data.historia || "",
                location: data.ciudad?.nombre ? `${data.ciudad.nombre}, Andalucía` : 'Andalucía, España',
                avatarImage: resolveImg(data.imagenLogo) || null,
                coverImage: ENTITY_BANNER,
              });
            }
          })
          .finally(() => setCargando(false));
      } else {
        setEntityType('cofrade');
        api.get('/usuarios/perfil')
          .then(({ data }) => {
            setProfileData({
              name: data.nombre || data.username || "Usuario",
              username: "@" + (data.username || "usuario"),
              bio: "",
              location: data.ciudadResidencia?.nombre
                ? `${data.ciudadResidencia.nombre}, Andalucía`
                : 'Andalucía, España',
              avatarImage: resolveImg(data.avatar) || null,
              coverImage: COFRADE_BANNER,
              favoritos: (data.hermandadesFavoritas?.length ?? 0) + (data.bandasFavoritas?.length ?? 0),
            });
          })
          .catch(() => {
            setProfileData({
              name: payload?.username || "Usuario",
              username: "@" + (payload?.username || "usuario"),
              bio: "",
              location: 'Andalucía, España',
              avatarImage: null,
              coverImage: COFRADE_BANNER,
              favoritos: 0,
            });
          })
          .finally(() => setCargando(false));
      }
    } catch {
      setCargando(false);
    }
  }, []);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try { await api.post('/auth/logout', { refresh_token: refreshToken }); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    globalThis.dispatchEvent(new Event('auth-change'));
    router.push('/');
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-cofrade-main border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-cofrade-main/10 flex items-center justify-center">
          <User size={32} className="text-cofrade-main/50" />
        </div>
        <p className="text-gray-600 font-semibold">Inicia sesión para ver tu perfil</p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-2.5 bg-cofrade-main text-white font-bold rounded-full text-sm hover:opacity-90 transition-opacity"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  const bannerVariant = entityType === 'cofrade' ? 'cofrade' : 'entity';

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileBanner coverImage={profileData.coverImage} variant={bannerVariant} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="relative flex flex-col sm:flex-row sm:justify-between sm:items-end -mt-14 sm:-mt-16 mb-6 gap-4">
          <div className="border-4 border-white rounded-full shadow-lg shrink-0 self-start">
            {entityType === 'hermandad' && hermandadId ? (
              <ImageUpload
                currentImage={profileData.avatarImage}
                uploadUrl={`/hermandades/${hermandadId}/logo`}
                onSuccess={(data) =>
                  setProfileData((p: any) => ({ ...p, avatarImage: resolveImg(data.imagenEscudo) ?? p.avatarImage }))
                }
                shape="circle"
                size={128}
              />
            ) : entityType === 'banda' && bandaId ? (
              <ImageUpload
                currentImage={profileData.avatarImage}
                uploadUrl={`/bandas/${bandaId}/logo`}
                onSuccess={(data) =>
                  setProfileData((p: any) => ({ ...p, avatarImage: resolveImg(data.imagenLogo) ?? p.avatarImage }))
                }
                shape="circle"
                size={128}
              />
            ) : (
              <ImageUpload
                currentImage={profileData.avatarImage}
                uploadUrl="/usuarios/perfil/avatar"
                onSuccess={(data) =>
                  setProfileData((p: any) => ({ ...p, avatarImage: resolveImg(data.avatar) ?? p.avatarImage }))
                }
                shape="circle"
                size={128}
                emptyIcon="user"
                className="border-solid border-white bg-white"
              />
            )}
          </div>

          <div className="flex gap-3 sm:pb-2">
            {entityType !== 'cofrade' && (
              <button
                onClick={() => setModalAbierto(true)}
                className="px-6 py-2.5 rounded-full border border-gray-200 bg-white font-bold hover:bg-gray-50 transition-all active:scale-95 text-sm shadow-sm"
              >
                Editar perfil
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{profileData.name}</h1>
            {entityType !== 'cofrade' && <BadgeCheck size={22} className="text-blue-500 shrink-0" />}
            {entityType === 'cofrade' && (
              <span className="px-2.5 py-0.5 bg-cofrade-main/10 text-cofrade-main text-[10px] font-black uppercase tracking-widest rounded-full">
                Cofrade
              </span>
            )}
          </div>
          <p className="text-gray-500 font-semibold mb-3">{profileData.username}</p>

          {profileData.bio ? (
            <p className="text-gray-700 mb-4 leading-relaxed">{profileData.bio}</p>
          ) : entityType === 'cofrade' ? (
            <p className="text-gray-400 text-sm mb-4 italic">
              Miembro de la comunidad cofrade. Sigue hermandades y bandas para ver sus novedades.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-4 text-sm text-gray-500 font-semibold">
            <div className="flex items-center gap-1.5">
              <MapPin size={16} className="text-gray-400 shrink-0" />
              {profileData.location}
            </div>
            {entityType === 'cofrade' && profileData.favoritos != null && (
              <div className="flex items-center gap-1.5">
                <Heart size={16} className="text-cofrade-main shrink-0" />
                {profileData.favoritos} favoritos
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-red-200 bg-white text-red-500 text-sm font-bold hover:bg-red-50 transition-all active:scale-95 mb-10 shadow-sm"
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>

      {entityType === 'hermandad' && (
        <EditHermandadModal
          hermandad={rawData || {}}
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
        />
      )}
      {entityType === 'banda' && (
        <EditBandaModal
          banda={rawData || {}}
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
        />
      )}
    </div>
  );
}
