'use client';

import { useState } from 'react';
import { Grid, Bookmark, Heart, MessageCircle, Edit3, MapPin, Link as LinkIcon } from 'lucide-react';

interface ProfileProps {
  userId: string;
  isOwnProfile: boolean;
}

export function Profile({ userId, isOwnProfile }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');

  const profileData = {
    name: isOwnProfile ? 'Abraham Martínez' : 'Usuario Demo',
    username: isOwnProfile ? '@abraham_cofrade' : '@usuariodemo',
    bio: 'Costalero de vocación. Amante de la fotografía cofrade y las tradiciones de nuestra tierra. Sevilla. ✝️',
    location: 'Sevilla, España',
    link: 'cofradenet.com/abraham',
    followers: '1.2K',
    following: '567',
    posts: 89,
    coverImage: 'https://images.unsplash.com/photo-1596194200109-19818b264669?q=80&w=1600&auto=format&fit=crop',
  };

  const userPosts = [
    { id: 1, image: 'https://images.unsplash.com/photo-1614271960244-63806f3b0f5b?q=80&w=600&auto=format&fit=crop', likes: 234, comments: 12 },
    { id: 2, image: 'https://images.unsplash.com/photo-1596194200109-19818b264669?q=80&w=600&auto=format&fit=crop', likes: 189, comments: 15 },
    { id: 3, image: 'https://images.unsplash.com/photo-1614271960244-63806f3b0f5b?q=80&w=600&auto=format&fit=crop', likes: 298, comments: 20 },
    { id: 4, image: 'https://images.unsplash.com/photo-1559564484-e48b3e040ff4?q=80&w=600&auto=format&fit=crop', likes: 412, comments: 34 },
    { id: 5, image: 'https://images.unsplash.com/photo-1567591414240-e69661440049?q=80&w=600&auto=format&fit=crop', likes: 156, comments: 8 },
    { id: 6, image: 'https://images.unsplash.com/photo-1548625361-195feee1048e?q=80&w=600&auto=format&fit=crop', likes: 89, comments: 2 },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* 1. SECCIÓN DE CABECERA (PORTADA) - OCUPA TODO EL ANCHO */}
      <div className="relative w-full h-48 md:h-80 bg-cofrade-main overflow-hidden">
        <img 
          src={profileData.coverImage} 
          alt="Cover" 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* 2. CONTENEDOR DE INFORMACIÓN - CENTRADO PERO AMPLIO */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 md:-mt-24 mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          
          {/* Avatar Gigante Profesional */}
          <div className="relative group">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white bg-cofrade-main flex items-center justify-center text-white text-5xl md:text-7xl font-black shadow-xl overflow-hidden ring-1 ring-gray-100">
              {profileData.name.charAt(0)}
            </div>
            {isOwnProfile && (
              <div className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                <Edit3 size={20} className="text-cofrade-main" />
              </div>
            )}
          </div>

          {/* Botones de Acción arriba a la derecha en desktop */}
          <div className="flex gap-3 pb-2">
            {isOwnProfile ? (
              <button className="px-6 py-2.5 bg-white border-2 border-gray-200 text-gray-900 rounded-full font-bold hover:bg-gray-50 transition-all shadow-sm">
                Editar Perfil
              </button>
            ) : (
              <>
                <button className="px-8 py-2.5 bg-cofrade-main text-white rounded-full font-bold hover:opacity-90 transition-all shadow-md">
                  Seguir
                </button>
                <button className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-full font-bold hover:bg-gray-50 transition-all">
                  Mensaje
                </button>
              </>
            )}
          </div>
        </div>

        {/* Datos de Texto */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
              {profileData.name}
            </h1>
            <p className="text-cofrade-gold text-lg font-bold">{profileData.username}</p>
          </div>

          <p className="text-gray-700 text-lg max-w-2xl font-medium leading-relaxed">
            {profileData.bio}
          </p>

          <div className="flex flex-wrap gap-y-2 gap-x-6 text-gray-500 font-semibold text-sm">
            <div className="flex items-center gap-1.5">
              <MapPin size={18} className="text-gray-400" />
              {profileData.location}
            </div>
            <div className="flex items-center gap-1.5">
              <LinkIcon size={18} className="text-gray-400" />
              <span className="text-cofrade-main hover:underline cursor-pointer">{profileData.link}</span>
            </div>
          </div>

          <div className="flex gap-8 pt-2">
            <div className="flex gap-1.5 items-baseline">
              <span className="text-xl font-black text-gray-900">{profileData.followers}</span>
              <span className="text-gray-500 font-bold text-sm uppercase tracking-wider">Seguidores</span>
            </div>
            <div className="flex gap-1.5 items-baseline">
              <span className="text-xl font-black text-gray-900">{profileData.following}</span>
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
          <button 
            onClick={() => setActiveTab('saved')}
            className={`pb-4 flex items-center gap-2 text-sm font-black transition-all border-b-2 tracking-widest ${
              activeTab === 'saved' ? 'border-cofrade-main text-cofrade-main' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Bookmark size={20} /> GUARDADOS
          </button>
        </div>

        {/* 4. GRID DE CONTENIDO PROFESIONAL */}
        <div className="py-8">
          <div className="grid grid-cols-3 gap-1 md:gap-8">
            {userPosts.map((post) => (
              <div key={post.id} className="group relative aspect-square bg-gray-100 overflow-hidden cursor-pointer md:rounded-lg">
                <img 
                  src={post.image} 
                  alt="Post" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                {/* Overlay Cofrade al hacer hover */}
                <div className="absolute inset-0 bg-cofrade-main/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-6 text-white">
                  <div className="flex items-center gap-2 font-black text-lg">
                    <Heart size={24} fill="currentColor" /> {post.likes}
                  </div>
                  <div className="flex items-center gap-2 font-black text-lg">
                    <MessageCircle size={24} fill="currentColor" /> {post.comments}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}