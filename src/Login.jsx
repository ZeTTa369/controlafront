import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  Building2, Mail, Lock, AlertCircle, ArrowRight, ArrowLeft, Eye, EyeOff
} from 'lucide-react';
import { login as loginService } from './services/authService';
import { ModalRecuperarPassword } from './components/modals/ModalRecuperarPassword';

export function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalRecuperarOpen, setModalRecuperarOpen] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const toastId = toast.loading('Verificando credenciales...');

    try {
      const response = await loginService({ email, password });

      if (response && response.access_token) {
        localStorage.setItem("token", response.access_token);
        localStorage.setItem("usuario", JSON.stringify(response.usuario));
        localStorage.setItem("isAuth", "true");

        toast.success(`Bienvenido, ${response.usuario?.nombre || 'Usuario'}`, { id: toastId });

        if (typeof setIsAuthenticated === 'function') {
          setIsAuthenticated(true);
        }

        navigate('/dashboard');
      } else {
        throw new Error('No se recibió el token de acceso.');
      }
    } catch (err) {
      const mensajeError = err.message || 'Credenciales incorrectas o error de servidor';
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
            Gestión centralizada de tu condominio.
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed">
            Supervisa unidades, contratos, cobros y residentes desde un único entorno seguro y en tiempo real.
          </p>
        </div>
      </div>

      {/* Panel Derecho: Formulario */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-[440px]">
          
          <button 
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold mb-8 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} /> Volver al Catálogo
          </button>

          <div className="flex items-center gap-3 mb-8">
            <Building2 size={32} className="text-blue-600" />
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">ResidencialOS</h2>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-extrabold text-slate-900">Iniciar Sesión</h3>
            <p className="text-sm text-slate-500 mt-1">Ingresa tus credenciales para acceder a la plataforma.</p>
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
                <Mail size={20} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="email"
                  required
                  className="w-full py-4 pl-12 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white"
                  placeholder="tu-correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-bold text-slate-800 mb-2">Contraseña</label>
              <div className="relative flex items-center group">
                <Lock size={20} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full py-4 pl-12 pr-12 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Enlace ¿Olvidaste tu contraseña? */}
            <div className="flex justify-end mb-6">
              <button
                type="button"
                onClick={() => setModalRecuperarOpen(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button 
              type="submit" 
              className="w-full flex justify-center items-center gap-3 bg-slate-900 hover:bg-blue-600 text-white py-4 rounded-xl text-lg font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/20 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none cursor-pointer"
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

      {/* Modal para restablecer credenciales */}
      <ModalRecuperarPassword
        isOpen={modalRecuperarOpen}
        onClose={() => setModalRecuperarOpen(false)}
        defaultEmail={email}
      />
    </div>
  );
}