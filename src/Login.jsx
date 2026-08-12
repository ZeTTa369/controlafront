import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast"; // <-- Importamos react-hot-toast
import { 
  Building2, Mail, Lock, AlertCircle, ShieldCheck, Users, ArrowRight, ArrowLeft, Eye, EyeOff
} from 'lucide-react';
import { login as loginService } from './services/authService'; // o authService de tu carpeta services

export function Login({ setIsAuthenticated }) {
  const [activeRole, setActiveRole] = useState('ADMINISTRADOR'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Toast de carga/verificación opcional
    const toastId = toast.loading('Verificando credenciales...');

    try {
      // 1. Petición al backend
      const response = await loginService({ email, password });

      if (response && response.access_token) {
        // 2. Guardamos banderas e información en localStorage
        localStorage.setItem("token", response.access_token);
        localStorage.setItem("usuario", JSON.stringify(response.usuario));
        localStorage.setItem("isAuth", "true");

        // 3. Notificación de éxito
        toast.success(`Bienvenido, ${response.usuario?.nombre || 'Usuario'}`, { id: toastId });

        // 4. Actualizamos el estado padre (App.jsx)
        if (typeof setIsAuthenticated === 'function') {
          setIsAuthenticated(true);
        }

        // 5. Redirigimos al Dashboard
        navigate('/dashboard');
      } else {
        throw new Error('No se recibió el token de acceso.');
      }
    } catch (err) {
      const mensajeError = err.message || 'Credenciales incorrectas o error de servidor';
      
      // Notificación de error en pantalla
      toast.error(mensajeError, { id: toastId });
      setError(mensajeError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans bg-slate-50">
      
      {/* Panel Izquierdo: Visual */}
      <div className="hidden lg:flex flex-[1.5] relative bg-[url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center flex-col justify-end p-16 text-white">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-slate-900/10"></div>
        <div className="relative z-10 max-w-[600px]">
          <span className="inline-block bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-semibold tracking-wide mb-6 border border-white/30">
            Plataforma Residencial
          </span>
          <h1 className="text-5xl font-extrabold leading-tight mb-4">
            {activeRole === 'ADMINISTRADOR' 
              ? 'Gestión inteligente para tu edificio.' 
              : 'Bienvenido a tu nuevo hogar.'}
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed">
            {activeRole === 'ADMINISTRADOR'
              ? 'Controla expensas, contratos e incidencias desde un único panel centralizado con reportes en tiempo real.'
              : 'Revisa tus contratos, paga tus expensas en línea y reporta incidencias de manera rápida y segura.'}
          </p>
        </div>
      </div>

      {/* Panel Derecho: Formulario */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-[440px]">
          
          <button 
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold mb-8 transition-colors"
          >
            <ArrowLeft size={18} /> Volver al Catálogo
          </button>

          <div className="flex items-center gap-3 mb-10">
            <Building2 size={32} className={activeRole === 'ADMINISTRADOR' ? 'text-slate-900' : 'text-emerald-500'} />
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">ResidencialOS</h2>
          </div>

          {/* Tabs Rol */}
          <div className="flex bg-slate-100 rounded-xl p-1.5 mb-8">
            <button 
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
                activeRole === 'ADMINISTRADOR' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => { setActiveRole('ADMINISTRADOR'); setError(''); }}
            >
              <ShieldCheck size={18} />
              Administración
            </button>
            <button 
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
                activeRole === 'INQUILINO' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => { setActiveRole('INQUILINO'); setError(''); }}
            >
              <Users size={18} />
              Inquilinos
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-200 mb-6">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-800 mb-2">Correo Electrónico</label>
              <div className="relative flex items-center group">
                <Mail size={20} className={`absolute left-4 transition-colors ${activeRole === 'INQUILINO' ? 'group-focus-within:text-emerald-500 text-slate-400' : 'group-focus-within:text-blue-600 text-slate-400'}`} />
                <input
                  type="email"
                  required
                  className={`w-full py-4 pl-12 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all ${
                    activeRole === 'INQUILINO' ? 'focus:border-emerald-500' : 'focus:border-blue-600'
                  } focus:bg-white`}
                  placeholder={activeRole === 'ADMINISTRADOR' ? 'admin@controla.com' : 'tu-correo@gmail.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-800 mb-2">Contraseña</label>
              <div className="relative flex items-center group">
                <Lock size={20} className={`absolute left-4 transition-colors ${activeRole === 'INQUILINO' ? 'group-focus-within:text-emerald-500 text-slate-400' : 'group-focus-within:text-blue-600 text-slate-400'}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className={`w-full py-4 pl-12 pr-12 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all ${
                    activeRole === 'INQUILINO' ? 'focus:border-emerald-500' : 'focus:border-blue-600'
                  } focus:bg-white`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className={`w-full flex justify-center items-center gap-3 text-white py-4 rounded-xl text-lg font-bold transition-all mt-8 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none ${
                activeRole === 'INQUILINO' 
                  ? 'bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20' 
                  : 'bg-slate-900 hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/20'
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                'Verificando...'
              ) : (
                <>
                  Ingresar a mi cuenta
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}