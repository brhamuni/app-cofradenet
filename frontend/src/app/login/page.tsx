'use client';
import { useState } from 'react';
import { LogIn, Lock, User, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/app/api/axios';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje('');
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data?.access_token) {
        localStorage.setItem('token', response.data.access_token);
        window.dispatchEvent(new Event('auth-change'));
      }
      router.push('/'); 
    } catch (error: any) {
      setErrorMensaje(error.response?.data?.message || 'Correo o contraseña incorrectos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* LADO IZQUIERDO: IMÁGENES (Oculto en móvil) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-cofrade-main items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1548625361-195feee1048e?q=80&w=1000" 
            className="w-full h-full object-cover opacity-40" 
            alt="Fondo Cofrade" 
          />
          <div className="absolute inset-0 bg-gradient-to-br from-cofrade-main/80 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-lg text-white">
          <h1 className="text-6xl font-black tracking-tighter mb-6 leading-none">
            MIRA LOS <br /> 
            <span className="text-cofrade-gold">MOMENTOS</span> <br /> 
            COTIDIANOS.
          </h1>
          <p className="text-xl font-medium opacity-90">
            Únete a la comunidad de CofradeNet y comparte tu pasión por nuestras tradiciones.
          </p>
        </div>
      </div>

      {/* LADO DERECHO: FORMULARIO */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-cofrade-bg lg:bg-white">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Iniciar Sesión</h2>
            <p className="text-gray-500 font-medium">Gestiona tu pasión desde tu panel cofrade.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMensaje && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100 animate-shake">
                {errorMensaje}
              </div>
            )}

            <div className="space-y-3">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cofrade-main transition-colors" size={20} />
                <input
                  type="text" placeholder="Usuario o Email" required
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-50 lg:bg-gray-100 border-none rounded-2xl pl-12 p-4 outline-none focus:ring-2 focus:ring-cofrade-main/20 font-medium transition-all"
                />
              </div>
              
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cofrade-main transition-colors" size={20} />
                <input
                  type="password" placeholder="Contraseña" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 lg:bg-gray-100 border-none rounded-2xl pl-12 p-4 outline-none focus:ring-2 focus:ring-cofrade-main/20 font-medium transition-all"
                />
              </div>
            </div>

            <button
              type="submit" disabled={isLoading}
              className="w-full bg-cofrade-main text-white py-4 rounded-2xl font-black tracking-wide hover:opacity-90 transition-all shadow-xl shadow-cofrade-main/20 flex items-center justify-center gap-3"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'ENTRAR'}
            </button>
          </form>

          <div className="text-center pt-4">
            <p className="text-gray-500 font-bold text-sm">
              ¿AÚN NO ERES COFRADE?{' '}
              <Link href="/register" className="text-cofrade-gold hover:underline underline-offset-4">
                REGÍSTRATE AQUÍ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}