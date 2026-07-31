import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Building2, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import './LoginPage.css'; // Asegúrate de que el archivo CSS esté en la misma ruta

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Simulación de validación (Pronto lo conectaremos al backend real)
      setTimeout(() => {
        if (email === 'admin@edificio.com' && password === '123456') {
          const fakeUser = { id: 1, nombre: 'Administrador', email, rol: 'ADMINISTRADOR' };
          const fakeToken = 'jwt-token-simulado-12345';
          login(fakeUser, fakeToken);
          navigate('/dashboard');
        } else {
          setError('Credenciales incorrectas. Verifique su correo y contraseña.');
          setIsSubmitting(false);
        }
      }, 1000); // Simulamos 1 segundo de carga
    } catch (err) {
      setError('Ocurrió un error al conectar con el servidor.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      {/* SECCIÓN IZQUIERDA: Marca y Diseño (Oculta en móviles) */}
      <div className="login-hero">
        <div className="hero-icon-container">
          <Building2 size={64} color="#d4af37" strokeWidth={1.5} />
        </div>
        <h1 className="hero-title">Gestión Residencial Premium</h1>
        <p className="hero-subtitle">
          Administración centralizada de inquilinos, contratos y finanzas con los más altos estándares de eficiencia.
        </p>
      </div>

      {/* SECCIÓN DERECHA: Formulario de Login */}
      <div className="login-form-section">
        <div className="login-form-card">
          <div className="form-header">
            <h2>Bienvenido al Portal</h2>
            <p>Ingrese sus credenciales para acceder a la administración.</p>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Correo Electrónico</label>
              <div className="input-wrapper">
                <Mail size={20} className="input-icon" />
                <input
                  type="email"
                  required
                  placeholder="admin@edificio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Contraseña</label>
              <div className="input-wrapper">
                <Lock size={20} className="input-icon" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Verificando credenciales...' : 'Ingresar al Sistema'}
              {!isSubmitting && <ArrowRight size={20} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};