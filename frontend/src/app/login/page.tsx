'use client';
import { useState } from 'react';
import { LogIn, Lock, User } from 'lucide-react'; // Cambié Mail por User
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/api/axios'; // Importamos la instancia de axios

export default function LoginPage() {
  const router = useRouter();
  
  // Estados para el formulario
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados para UX (carga y errores)
  const [isLoading, setIsLoading] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje('');
    setIsLoading(true);
    
    try {
      // Enviamos 'username' (que puede ser el email o el alias)
      const response = await api.post('/auth/login', {
        username,
        password,
      });

      // Guardamos el token en localStorage
      if (response.data && response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        
        // --- AQUÍ ESTÁ LA LÍNEA MÁGICA ---
        // Le gritamos a toda la app que el token acaba de cambiar
        window.dispatchEvent(new Event('auth-change'));
      }

      // Redirigimos al inicio
      router.push('/'); 
      
    } catch (error: any) {
      console.error('Error en login:', error);
      setErrorMensaje(
        error.response?.data?.message || 'Correo o contraseña incorrectos.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cofrade-bg px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
        
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-cofrade-main/10 flex items-center justify-center text-cofrade-main mb-4">
            <LogIn size={24} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Bienvenido</h2>
          <p className="mt-2 text-sm text-gray-500">Accede a tu panel cofrade</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          {/* Bloque visual para mostrar errores */}
          {errorMensaje && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center border border-red-100">
              {errorMensaje}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text" placeholder="Correo electrónico o usuario" required
                value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-gray-300 pl-10 p-3 focus:border-cofrade-main focus:ring-2 focus:ring-cofrade-main/20 outline-none transition-all"
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="password" placeholder="Contraseña" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 pl-10 p-3 focus:border-cofrade-main focus:ring-2 focus:ring-cofrade-main/20 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg ${
              isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-cofrade-main hover:opacity-90'
            }`}
          >
            <LogIn className="w-5 h-5" />
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="font-medium text-cofrade-gold hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}