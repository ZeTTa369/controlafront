import { useState, useEffect } from 'react';
import {
  UserCog,
  X,
  CheckCircle2,
  Loader2,
  Globe,
  Mail,
  Phone,
  Shield,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { actualizarUsuario } from '../../services/usuarioService';

export function ModalEditarUsuario({ isOpen, usuario, onClose, onSave }) {
  const [nombre, setNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [ciNit, setCiNit] = useState('');
  const [nacionalidad, setNacionalidad] = useState('Boliviana');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState(4);
  const [estado, setEstado] = useState('ACTIVO');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!isOpen || !usuario) return;

    const rolNum = Number(usuario.rol || 4);
    const emailUsuario = (usuario.email || '').toLowerCase();
    const rolNormalizado =
      rolNum === 3 && emailUsuario.startsWith('inquilino_') ? 4 : rolNum;

    setNombre(usuario.nombre || '');
    setPrimerApellido(usuario.primer_apellido || '');
    setSegundoApellido(usuario.segundo_apellido || '');
    setCiNit(usuario.ci_nit || '');
    setNacionalidad(usuario.nacionalidad || 'Boliviana');
    setEmail(usuario.email || '');
    setTelefono(usuario.telefono || '');
    setRol(rolNormalizado);
    setEstado((usuario.estado || 'ACTIVO').toUpperCase());
  }, [isOpen, usuario]);

  if (!isOpen || !usuario) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre.trim() || !primerApellido.trim()) {
      toast.error('El nombre y primer apellido son obligatorios');
      return;
    }

    const id = usuario.id_usuario || usuario.id;
    setGuardando(true);
    const toastId = toast.loading('Actualizando datos del usuario...');

    try {
      const payload = {
        nombre: nombre.trim(),
        primer_apellido: primerApellido.trim(),
        segundo_apellido: segundoApellido.trim() || null,
        ci_nit: ciNit.trim() || null,
        nacionalidad: nacionalidad.trim() || 'Boliviana',
        email: email.trim() || null,
        telefono: telefono.trim() || null,
        rol: Number(rol),
        estado,
      };

      const actualizado = await actualizarUsuario(id, payload);
      toast.success('Datos del usuario actualizados', { id: toastId });

      if (onSave) {
        onSave({ ...usuario, ...payload, ...(actualizado || {}) });
      }
      onClose();
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      toast.error(error.message || 'No se pudo actualizar el usuario', { id: toastId });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden animate-scale-up">
        
        {/* Cabecera */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl">
              <UserCog size={20} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold">Editar Datos del Usuario</h3>
              <p className="text-xs text-slate-400">
                ID #{usuario.id_usuario || usuario.id} • Actualiza perfil, rol y estado operativo
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={guardando}
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre(s) *
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Primer Apellido *
              </label>
              <input
                type="text"
                required
                value={primerApellido}
                onChange={(e) => setPrimerApellido(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Segundo Apellido
              </label>
              <input
                type="text"
                placeholder="Opcional"
                value={segundoApellido}
                onChange={(e) => setSegundoApellido(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                C.I. / NIT
              </label>
              <div className="relative flex items-center">
                <CreditCard size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Ej. 7845123"
                  value={ciNit}
                  onChange={(e) => setCiNit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nacionalidad
              </label>
              <div className="relative flex items-center">
                <Globe size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Ej. Boliviana"
                  value={nacionalidad}
                  onChange={(e) => setNacionalidad(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Teléfono / Celular
              </label>
              <div className="relative flex items-center">
                <Phone size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Ej. 71234567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Correo Electrónico
            </label>
            <div className="relative flex items-center">
              <Mail size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Rol en el Sistema *
              </label>
              <div className="relative flex items-center">
                <Shield size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={rol}
                  onChange={(e) => setRol(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-600 focus:bg-white appearance-none cursor-pointer"
                >
                  <option value={1}>Propietario</option>
                  <option value={2}>Administrador</option>
                  <option value={3}>Conserje</option>
                  <option value={4}>Inquilino</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Estado de Cuenta *
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-600 focus:bg-white appearance-none cursor-pointer"
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
                <option value="SUSPENDIDO">SUSPENDIDO</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={guardando}
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}