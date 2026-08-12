import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al cargar la app, recuperamos el estado guardado en localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('usuario');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error al parsear el usuario guardado:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const loginUser = async (credentials) => {
    // Llama a authService.login (o la función de authService.js)
    const data = await authService.login(credentials);
    if (data.access_token) {
      setToken(data.access_token);
      setUser(data.usuario);
      return data;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login: loginUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};