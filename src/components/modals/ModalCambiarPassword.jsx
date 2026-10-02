import { useState } from 'react';
import { KeyRound, Eye, EyeOff, X, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { resetearPasswordAdmin } from '../../services/authService'; // Verifica la ruta a tu authService

export function ModalCambiarPassword({ usuario, isOpen, onClose }) {
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Se muestra si 'isOpen' es true o si 'usuario' contiene datos
  const visible = isOpen !== undefined ? isOpen : Boolean(usuario);
  if (!visible || !usuario) return null;

  const id = usuario.id_usuario || usuario.id;
  const nombreCompleto = `${usuario.nombre || ''} ${usuario.primer_apellido || ''}`.trim() || usuario.email;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwordNueva.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwordNueva !== confirmarPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Restableciendo contraseña...');

    try {
      await resetearPasswordAdmin(id, { passwordNueva });
      toast.success(`Contraseña actualizada para ${nombreCompleto}`, { id: toastId });
      setPasswordNueva('');
      setConfirmarPassword('');
      onClose();
    } catch (error) {
      console.error('Error al resetear contraseña:', error);
      toast.error(error.message || 'No se pudo restablecer la contraseña', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden relative">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Restablecer Contraseña</h3>
              <p className="text-xs text-slate-500 truncate max-w-[240px]">
                Usuario: <span className="font-bold text-slate-700">{nombreCompleto}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={mostrarPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 pr-10 outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Confirmar Nueva Contraseña
            </label>
            <input
              type={mostrarPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Actualizar Clave
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}