'use client';
import { useState } from 'react';
import { UserPlus, Mail, Lock, User as UserIcon, Building2, Music, MapPin, Hash, BookOpen, Calendar, Map } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/api/axios'; // Importamos tu configuración de axios

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    rol: 'cofrade', // Mantenemos esto para el control visual del front
    nombre: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    ciudad: '',
    direccion: '',
    
    // Campos de Banda
    estiloMusical: '',
    localidad: '',
    
    // Campos de Hermandad
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
      // 1. Preparamos el objeto EXACTAMENTE como lo pide tu DTO
      const payload: any = {
        nombre: formData.nombre,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        rol: formData.rol, 
      };

      // Añadimos ciudad si el usuario lo ha rellenado
      if (formData.ciudad) payload.ciudad = formData.ciudad;
      if (formData.direccion) payload.direccion = formData.direccion;

      // 2. Añadimos los campos específicos según el rol
      if (formData.rol === 'banda') {
        if (formData.estiloMusical) payload.estiloMusical = formData.estiloMusical;
        if (formData.localidad) payload.localidad = formData.localidad;
      } else if (formData.rol === 'hermandad') {
        if (formData.templo) payload.templo = formData.templo;
        if (formData.diaSalida) payload.diaSalida = formData.diaSalida;
      }

      // 3. Enviamos los datos al backend
      // TODO: Revisa si tu ruta de registro es '/auth/register' o '/usuarios'
      await api.post('/usuarios', payload);

      alert('¡Cuenta creada con éxito!');
      router.push('/login'); 
      
    } catch (error: any) {
      console.error('Error en el registro:', error);
      setErrorMensaje(
        error.response?.data?.message || 'Error al crear la cuenta. Revisa los datos.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateForm = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cofrade-bg px-4 py-12">
      <div className="w-full max-w-lg space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
        
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-cofrade-main/10 flex items-center justify-center text-cofrade-main mb-4">
            <UserPlus size={24} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Crear Cuenta</h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          {errorMensaje && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center border border-red-100">
              {Array.isArray(errorMensaje) ? errorMensaje.join(', ') : errorMensaje}
            </div>
          )}

          {/* Selector de tipo visual */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'cofrade', icon: UserIcon, label: 'Cofrade' },
              { id: 'hermandad', icon: Building2, label: 'Hermandad' },
              { id: 'banda', icon: Music, label: 'Banda' }
            ].map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id} type="button"
                  onClick={() => updateForm('rol', type.id)}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                    formData.rol === type.id 
                      ? 'border-cofrade-main bg-cofrade-main/5 text-cofrade-main' 
                      : 'border-gray-100 text-gray-500 hover:border-gray-200'
                  }`}
                >
                  <Icon size={20} className="mb-1" />
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>

          {/* CAMPOS COMUNES */}
          <div className="space-y-4">
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text" placeholder="Nombre completo o de la organización" required
                value={formData.nombre} onChange={(e) => updateForm('nombre', e.target.value)}
                className="w-full rounded-xl border border-gray-300 pl-10 p-3 focus:border-cofrade-main focus:ring-2 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text" placeholder="Nombre de usuario (ej. mi_hermandad)" required
                  value={formData.username} onChange={(e) => updateForm('username', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 pl-10 p-3 focus:border-cofrade-main focus:ring-2 outline-none"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text" placeholder="Ciudad" 
                  value={formData.ciudad} onChange={(e) => updateForm('ciudad', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 pl-10 p-3 focus:border-cofrade-main focus:ring-2 outline-none"
                />
              </div>
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email" placeholder="Correo electrónico" required
                value={formData.email} onChange={(e) => updateForm('email', e.target.value)}
                className="w-full rounded-xl border border-gray-300 pl-10 p-3 focus:border-cofrade-main focus:ring-2 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="password" placeholder="Contraseña (Mín. 6)" required
                value={formData.password} onChange={(e) => updateForm('password', e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 focus:border-cofrade-main focus:ring-2 outline-none"
              />
              <input
                type="password" placeholder="Repetir clave" required
                value={formData.confirmPassword} onChange={(e) => updateForm('confirmPassword', e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 focus:border-cofrade-main focus:ring-2 outline-none"
              />
            </div>
          </div>

          {/* CAMPOS CONDICIONALES PARA BANDA */}
          {formData.rol === 'banda' && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Datos de la Banda</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Music className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text" placeholder="Estilo Musical"
                    value={formData.estiloMusical} onChange={(e) => updateForm('estiloMusical', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 pl-10 p-3 focus:border-cofrade-main focus:ring-2 outline-none text-sm"
                  />
                </div>
                <div className="relative">
                  <Map className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text" placeholder="Localidad"
                    value={formData.localidad} onChange={(e) => updateForm('localidad', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 pl-10 p-3 focus:border-cofrade-main focus:ring-2 outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CAMPOS CONDICIONALES PARA HERMANDAD */}
          {formData.rol === 'hermandad' && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Datos de la Hermandad</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text" placeholder="Templo/Sede"
                    value={formData.templo} onChange={(e) => updateForm('templo', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 pl-10 p-3 focus:border-cofrade-main focus:ring-2 outline-none text-sm"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text" placeholder="Día de Salida"
                    value={formData.diaSalida} onChange={(e) => updateForm('diaSalida', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 pl-10 p-3 focus:border-cofrade-main focus:ring-2 outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg ${
              isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-cofrade-main hover:opacity-90'
            }`}
          >
            <UserPlus className="w-5 h-5" />
            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-medium text-cofrade-gold hover:underline">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}