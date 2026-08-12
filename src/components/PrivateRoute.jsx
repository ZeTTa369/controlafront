import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function PrivateRoute({ requiredRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center font-semibold text-slate-600">
          Cargando sesión...
        </div>
      </div>
    );
  }

  // 1. Si no está logueado, redirige a Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si se especifican roles y el usuario no coincide, redirige al Dashboard por defecto
  if (requiredRoles && !requiredRoles.includes(user?.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si pasa las validaciones, renderiza la ruta hija
  return <Outlet />;
}