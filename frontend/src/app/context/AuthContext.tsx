'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api/axios';

// Definimos qué tiene nuestro contexto
interface AuthContextType {
  user: any;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);

  // Al recargar la página, comprobamos si ya había un token guardado
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Llamamos a tu endpoint de NestJS (ajusta '/auth/login' a tu ruta real si es diferente)
    const { data } = await api.post('/auth/login', { email, password });
    
    // Guardamos token y datos del usuario en el navegador
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usarlo fácilmente en cualquier componente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
};