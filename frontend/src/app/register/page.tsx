'use client';
import { useState } from 'react';
import { UserPlus, Mail, User as UserIcon, Building2, Music, MapPin, BookOpen, Calendar, Map, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/api/axios';

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    rol: 'cofrade',
    nombre: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    ciudad: '',
    direccion: '',
    estiloMusical: '',
    localidad: '',
    templo: '',
    diaSalida: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMensaje('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        nombre: formData.nombre,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        rol: formData.rol, 
      };

      if (formData.ciudad) payload.ciudad = formData.ciudad;
      if (formData.direccion) payload.direccion = formData.direccion;

      if (formData.rol === 'banda') {
        if (formData.estiloMusical) payload.estiloMusical = formData.estiloMusical;
        if (formData.localidad) payload.localidad = formData.localidad;
      } else if (formData.rol === 'hermandad') {
        if (formData.templo) payload.templo = formData.templo;
        if (formData.diaSalida) payload.diaSalida = formData.diaSalida;
      }

      await api.post('/usuarios', payload);
      router.push('/login'); 
      
    } catch (error: any) {
      setErrorMensaje(error.response?.data?.message || 'Error al crear la cuenta.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateForm = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
      
      {/* LADO IZQUIERDO: TEXTO INSPIRACIONAL (Desktop) */}
      <div className="hidden lg:flex lg:w-2/5 relative bg-cofrade-main items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1567591414240-e69661440049?q=80&w=1000" 
            className="w-full h-full object-cover opacity-30" 
            alt="Semana Santa" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-cofrade-main/90 via-cofrade-main/70 to-transparent" />
        </div>
        
        <div className="relative z-10 w-full">
          <h1 className="text-7xl font-black text-white tracking-tighter leading-none mb-6">
            ÚNETE A LA <br /> 
            <span className="text-cofrade-gold">RED</span> <br /> 
            COFRADE.
          </h1>
          <p className="text-white/80 text-xl font-medium max-w-sm">
            La plataforma definitiva para cofrades, bandas y hermandades.
          </p>
        </div>
      </div>

      {/* LADO DERECHO: FORMULARIO SCROLLABLE */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-6 md:p-16 bg-white overflow-y-auto">
        <div className="w-full max-w-xl space-y-8 py-8">
          
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Crear Cuenta</h2>
            <p className="text-gray-500 font-medium mt-2">Selecciona tu perfil y completa tus datos.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMensaje && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100 animate-shake">
                {Array.isArray(errorMensaje) ? errorMensaje.join(', ') : errorMensaje}
              </div>
            )}

            {/* Selector de Rol Profesional */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'cofrade', icon: UserIcon, label: 'Cofrade' },
                { id: 'hermandad', icon: Building2, label: 'Hermandad' },
                { id: 'banda', icon: Music, label: 'Banda' }
              ].map((type) => (
                <button
                  key={type.id} type="button"
                  onClick={() => updateForm('rol', type.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all ${
                    formData.rol === type.id 
                      ? 'border-cofrade-main bg-cofrade-main/5 text-cofrade-main shadow-inner' 
                      : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <type.icon size={28} className="mb-2" />
                  <span className="text-xs font-black uppercase tracking-widest">{type.label}</span>
                </button>
              ))}
            </div>

            {/* Grid de inputs */}
            <div className="space-y-4">
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cofrade-main transition-colors" size={20} />
                <input
                  type="text" placeholder="Nombre Completo" required
                  value={formData.nombre} onChange={(e) => updateForm('nombre', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl pl-12 p-4 outline-none focus:ring-2 focus:ring-cofrade-main/20 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text" placeholder="Usuario" required
                    value={formData.username} onChange={(e) => updateForm('username', e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-2xl pl-12 p-4 outline-none focus:ring-2 focus:ring-cofrade-main/20 font-medium"
                  />
                </div>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text" placeholder="Ciudad" 
                    value={formData.ciudad} onChange={(e) => updateForm('ciudad', e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-2xl pl-12 p-4 outline-none focus:ring-2 focus:ring-cofrade-main/20 font-medium"
                  />
                </div>
              </div>

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email" placeholder="Correo electrónico" required
                  value={formData.email} onChange={(e) => updateForm('email', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl pl-12 p-4 outline-none focus:ring-2 focus:ring-cofrade-main/20 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password" placeholder="Contraseña" required
                    value={formData.password} onChange={(e) => updateForm('password', e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-2xl pl-12 p-4 outline-none focus:ring-2 focus:ring-cofrade-main/20 font-medium"
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password" placeholder="Confirmar" required
                    value={formData.confirmPassword} onChange={(e) => updateForm('confirmPassword', e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-2xl pl-12 p-4 outline-none focus:ring-2 focus:ring-cofrade-main/20 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* CAMPOS DINÁMICOS CON ESTILO */}
            {formData.rol !== 'cofrade' && (
              <div className="p-6 bg-cofrade-bg rounded-[2rem] space-y-4 border border-gray-100">
                <h3 className="text-xs font-black text-cofrade-main uppercase tracking-widest flex items-center gap-2">
                  <ArrowRight size={14} /> Información de {formData.rol}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {formData.rol === 'banda' ? (
                    <>
                      <input
                        type="text" placeholder="Estilo (CCTT, AM...)"
                        value={formData.estiloMusical} onChange={(e) => updateForm('estiloMusical', e.target.value)}
                        className="w-full bg-white border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-cofrade-main/20 text-sm font-bold"
                      />
                      <input
                        type="text" placeholder="Localidad"
                        value={formData.localidad} onChange={(e) => updateForm('localidad', e.target.value)}
                        className="w-full bg-white border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-cofrade-main/20 text-sm font-bold"
                      />
                    </>
                  ) : (
                    <>
                      <input
                        type="text" placeholder="Templo / Sede"
                        value={formData.templo} onChange={(e) => updateForm('templo', e.target.value)}
                        className="w-full bg-white border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-cofrade-main/20 text-sm font-bold"
                      />
                      <input
                        type="text" placeholder="Día de Salida"
                        value={formData.diaSalida} onChange={(e) => updateForm('diaSalida', e.target.value)}
                        className="w-full bg-white border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-cofrade-main/20 text-sm font-bold"
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit" disabled={isLoading}
              className="w-full bg-cofrade-main text-white py-5 rounded-[2rem] font-black tracking-widest hover:opacity-90 transition-all shadow-2xl shadow-cofrade-main/30 flex items-center justify-center gap-3"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'CREAR MI CUENTA'}
            </button>
          </form>

          <div className="text-center pt-4">
            <p className="text-gray-500 font-bold text-sm">
              ¿YA TIENES CUENTA?{' '}
              <Link href="/login" className="text-cofrade-gold hover:underline underline-offset-4">
                INICIA SESIÓN AQUÍ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}