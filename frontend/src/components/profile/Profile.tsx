'use client';

import { useState } from 'react';
import { Grid, Bookmark, MessageCircle, Edit3, MapPin, Link as LinkIcon, CheckCircle2, Music, Church, Heart } from 'lucide-react';
import EditHermandadModal from './EditHermandadModal';

interface ProfileData {
  name: string;
  username: string;
  bio: string;
  location: string;
  link: string;
  followers: number | string;
  following: number | string;
  posts: number;
  coverImage: string;
}

interface ProfileProps {
  userId: string;
  isOwnProfile: boolean;
  userType?: 'COFRADE' | 'BANDA' | 'HERMANDAD';
  isVerified?: boolean;
  profileData?: ProfileData;
  rawData?: any;
}

export function Profile({
  userId,
  isOwnProfile,
  userType = 'COFRADE',
  isVerified = false,
  profileData: externalProfileData,
  rawData,
}: ProfileProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'info'>('posts');
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Si no nos pasan datos por props, usamos estos por defecto (los tuyos)
  const defaultProfileData: ProfileData = {
    name: isOwnProfile ? 'Abraham Garcia' : (userType === 'BANDA' ? 'Rosario de Cádiz' : 'Hermandad de la Vera Cruz'),
    username: isOwnProfile ? '@abraham_garcia' : (userType === 'BANDA' ? '@rosariodecadiz' : '@veracruz_andujar'),
    bio: userType === 'COFRADE' 
      ? 'Costalero de vocación. Amante de la fotografía cofrade y las tradiciones de nuestra tierra.'
      : 'Formación musical de cornetas y tambores acompañando a nuestra fe a través del son.',
    location: 'Andújar, España',
    link: 'cofradenet.com/perfil',
    followers: userType === 'COFRADE' ? '1.2K' : '45.8K',
    following: '567',
    posts: 89,
    coverImage: 'https://scontent-bcn1-1.xx.fbcdn.net/v/t39.30808-6/476453860_943525514589058_6719557949732975275_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=2a1932&_nc_ohc=__0nBqwMt3AQ7kNvwEFoQ1H&_nc_oc=AdritvmYF5WjJnhgFmllfSJwfZudaXOyng6n2s0LJ8XQdfcSWL35HMWtnb0h2LuP_ew&_nc_zt=23&_nc_ht=scontent-bcn1-1.xx&_nc_gid=T3rlmtRIVIZWjeVPB5JZ4w&_nc_ss=7a3a8&oh=00_Af0jqbs4AoSBytSZqBkdR2nQpFj2KPoAWaC-xEd3fPAAgg&oe=69D9CEA7',
  };

  // Usamos los datos externos si existen, si no, los por defecto
  const data = externalProfileData || defaultProfileData;

  // Datos dummy para el grid de fotos (para que no se vea vacío)
  const dummyPosts = Array(6).fill('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');


  return (
    <div className="min-h-screen bg-white">
      {/* 1. SECCIÓN DE CABECERA (PORTADA) */}
      <div className="relative w-full h-48 md:h-80 bg-cofrade-main overflow-hidden">
        <img src={data.coverImage} alt="Cover" className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* 2. CONTENEDOR DE INFORMACIÓN */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 md:-mt-24 mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          
          {/* Avatar */}
          <div className="relative group">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white bg-cofrade-main flex items-center justify-center text-white text-5xl md:text-7xl font-black shadow-xl overflow-hidden ring-1 ring-gray-100">
              {data.name.charAt(0)}
            </div>
            {isOwnProfile && (
              <div className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                <Edit3 size={20} className="text-cofrade-main" />
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3 pb-2">
            {isOwnProfile ? (
              <button onClick={() => setEditModalOpen(true)} className="px-6 py-2.5 bg-white border-2 border-gray-200 text-gray-900 rounded-full font-bold hover:bg-gray-50 transition-all shadow-sm">
                Editar Perfil
              </button>
            ) : (
              <>
                <button className="px-8 py-2.5 bg-cofrade-main text-white rounded-full font-bold hover:opacity-90 transition-all shadow-md">
                  Seguir
                </button>
                <button className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-full font-bold hover:bg-gray-50 transition-all flex items-center justify-center">
                  <MessageCircle size={20} className="text-gray-700"/>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Datos de Texto con Check de Verificación */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                    {data.name}
                </h1>
                {isVerified && (
                    <CheckCircle2 size={24} className="text-cofrade-gold mt-1 fill-cofrade-gold/10" />
                )}
            </div>
            <p className="text-cofrade-gold text-lg font-bold">{data.username}</p>
          </div>

          <p className="text-gray-700 text-lg max-w-2xl font-medium leading-relaxed">
            {data.bio}
          </p>

          <div className="flex flex-wrap gap-y-2 gap-x-6 text-gray-500 font-semibold text-sm">
            <div className="flex items-center gap-1.5">
              <MapPin size={18} className="text-gray-400" />
              {data.location}
            </div>
            {/* Dato dinámico: Templo para Hermandad, Estilo para Banda */}
            {userType === 'HERMANDAD' && (
                <div className="flex items-center gap-1.5 uppercase tracking-wider">
                    <Church size={18} className="text-cofrade-main" />
                    <span>Sede Canónica</span>
                </div>
            )}
            {userType === 'BANDA' && (
                <div className="flex items-center gap-1.5 uppercase tracking-wider">
                    <Music size={18} className="text-cofrade-main" />
                    <span>CCTT</span>
                </div>
            )}
            <div className="flex items-center gap-1.5">
              <LinkIcon size={18} className="text-gray-400" />
              <span className="text-cofrade-main hover:underline cursor-pointer">{data.link}</span>
            </div>
          </div>

          <div className="flex gap-8 pt-2">
            <div className="flex gap-1.5 items-baseline">
              <span className="text-xl font-black text-gray-900">{data.followers}</span>
              <span className="text-gray-500 font-bold text-sm uppercase tracking-wider">Seguidores</span>
            </div>
            <div className="flex gap-1.5 items-baseline">
              <span className="text-xl font-black text-gray-900">{data.following}</span>
              <span className="text-gray-500 font-bold text-sm uppercase tracking-wider">Siguiendo</span>
            </div>
          </div>
        </div>

        {/* 3. TABS DE NAVEGACIÓN */}
        <div className="mt-10 border-b border-gray-100 flex justify-center md:justify-start gap-12">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`pb-4 flex items-center gap-2 text-sm font-black transition-all border-b-2 tracking-widest ${
              activeTab === 'posts' ? 'border-cofrade-main text-cofrade-main' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Grid size={20} /> PUBLICACIONES
          </button>
          
          {/* Solo mostramos Tab de "Información" o "Eventos" si no es cofrade */}
          {userType !== 'COFRADE' && (
            <button 
                onClick={() => setActiveTab('info')}
                className={`pb-4 flex items-center gap-2 text-sm font-black transition-all border-b-2 tracking-widest ${
                activeTab === 'info' ? 'border-cofrade-main text-cofrade-main' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
            >
                {userType === 'BANDA' ? <Music size={20} /> : <Church size={20} />} REPERTORIO
            </button>
          )}

          <button 
            onClick={() => setActiveTab('saved')}
            className={`pb-4 flex items-center gap-2 text-sm font-black transition-all border-b-2 tracking-widest ${
              activeTab === 'saved' ? 'border-cofrade-main text-cofrade-main' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Bookmark size={20} /> GUARDADOS
          </button>
        </div>

        {/* 4. GRID DE CONTENIDO */}
        <div className="py-8">
            {activeTab === 'posts' ? (
                <div className="grid grid-cols-3 gap-1 md:gap-8">
                    {dummyPosts.map((postImg, i) => (
                      <div key={i} className="aspect-square bg-gray-100 relative group overflow-hidden md:rounded-2xl cursor-pointer">
                        <img src={postImg} alt={`Post ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold">
                          <div className="flex items-center gap-2"><Heart className="fill-white" size={24}/> 342</div>
                          <div className="flex items-center gap-2"><MessageCircle className="fill-white" size={24}/> 12</div>
                        </div>
                      </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center py-20 text-gray-400">
                    <p className="font-bold uppercase tracking-[0.3em] text-[10px]">No hay contenido disponible</p>
                </div>
            )}
        </div>
      </div>

      {userType === 'HERMANDAD' && (
        <EditHermandadModal
          hermandad={rawData}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
        />
      )}
    </div>
  );
}