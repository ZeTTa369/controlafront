import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Lock, 
  Shield, 
  Activity, 
  Users, 
  Building2,
  X 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';

export function NuevoUsuario({ onClose, onSave, usuarioAEditar = null }) {
  const [edificios, setEdificios] = useState([]);
  const [loadingEdificios, setLoadingEdificios] = useState(true);

  const [formData, setFormData] = useState({
    id_edificio: '',
    nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    ci_nit: '',
    email: '',
    telefono: '',
    password: '',
    rol: '2', // 1 = Propietario, 2 = Administrador, 3 = Conserje
    estado: 'ACTIVO'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    cargarEdificios();
  }, []);

  useEffect(() => {
    if (usuarioAEditar) {
      setFormData({
        id_edificio: usuarioAEditar.id_edificio || '',
        nombre: usuarioAEditar.nombre || '',
        primer_apellido: usuarioAEditar.primer_apellido || '',
        segundo_apellido: usuarioAEditar.segundo_apellido || '',
        ci_nit: usuarioAEditar.ci_nit || '',
        email: usuarioAEditar.email || '',
        telefono: usuarioAEditar.telefono || '',
        password: '',
        rol: String(usuarioAEditar.rol || '2'),
        estado: usuarioAEditar.estado || 'ACTIVO'
      });
    }
  }, [usuarioAEditar]);

  const cargarEdificios = async () => {
    try {
      const response = await fetch(`${BASE_URL}/edificios`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response);
      setEdificios(Array.isArray(data) ? data : []);
      
      if (Array.isArray(data) && data.length > 0 && !usuarioAEditar) {
        setFormData(prev => ({ ...prev, id_edificio: data[0].id_edificio || data[0].id }));
      }
    } catch (error) {
      console.error('Error al cargar edificios:', error);
    } finally {
      setLoadingEdificios(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isEdit = Boolean(usuarioAEditar);
    const id = usuarioAEditar?.id_usuario || usuarioAEditar?.id;
    const toastId = toast.loading(isEdit ? 'Actualizando usuario...' : 'Registrando usuario...');

    const url = isEdit ? `${BASE_URL}/usuarios/${id}` : `${BASE_URL}/usuarios`;
    const method = isEdit ? 'PATCH' : 'POST';

    const payload = {
      nombre: formData.nombre.trim(),
      primer_apellido: formData.primer_apellido.trim(),
      segundo_apellido: formData.segundo_apellido?.trim() || null,
      ci_nit: formData.ci_nit.trim(),
      email: formData.email.trim().toLowerCase(),
      telefono: formData.telefono?.trim() || null,
      rol: Number(formData.rol),
      estado: formData.estado,
      ...(formData.id_edificio && { id_edificio: Number(formData.id_edificio) }),
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await handleResponse(response);
      toast.success(isEdit ? '¡Usuario actualizado!' : '¡Usuario registrado correctamente!', { id: toastId });

      if (onSave) onSave(data);
      if (onClose) onClose();
    } catch (error) {
      toast.error(error.message || 'Error al guardar el usuario', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-w-3xl mx-auto relative">
      
      {/* Cabecera */}
      <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">
              {usuarioAEditar ? 'Editar Cuenta de Usuario' : 'Registrar Nuevo Usuario'}
            </h2>
            <p className="text-sm text-slate-400">Asigna permisos y accesos según el rol de la persona</p>
          </div>
        </div>

        {onClose && (
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-2">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Cuerpo del Formulario */}
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        
        {/* Asignación de Edificio */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Edificio Asignado</label>
          <div className="relative flex items-center group">
            <Building2 size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
            <select
              name="id_edificio"
              value={formData.id_edificio}
              onChange={handleChange}
              disabled={loadingEdificios}
              className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer"
            >
              <option value="">{loadingEdificios ? 'Cargando edificios...' : 'Seleccione un edificio (Opcional)...'}</option>
              {edificios.map(e => (
                <option key={e.id_edificio || e.id} value={e.id_edificio || e.id}>
                  {e.nombre} - {e.direccion}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Nombres */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Nombre(s)</label>
          <div className="relative flex items-center group">
            <User size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              name="nombre"
              required
              maxLength={100}
              placeholder="Ej. Luis Gabriel"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white font-medium"
            />
          </div>
        </div>

        {/* Apellidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Primer Apellido</label>
            <input
              type="text"
              name="primer_apellido"
              required
              maxLength={100}
              placeholder="Ej. Claros"
              value={formData.primer_apellido}
              onChange={handleChange}
              className="w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Segundo Apellido</label>
            <input
              type="text"
              name="segundo_apellido"
              maxLength={100}
              placeholder="Ej. Arispe (Opcional)"
              value={formData.segundo_apellido}
              onChange={handleChange}
              className="w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white font-medium"
            />
          </div>
        </div>

        {/* CI/NIT y Teléfono */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">C.I. / NIT</label>
            <div className="relative flex items-center group">
              <CreditCard size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                name="ci_nit"
                required
                maxLength={20}
                placeholder="Ej. 5613935"
                value={formData.ci_nit}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Teléfono / Celular</label>
            <div className="relative flex items-center group">
              <Phone size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                name="telefono"
                maxLength={20}
                placeholder="Ej. 70000000"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white font-medium"
              />
            </div>
          </div>
        </div>

        {/* Correo Electrónico */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Correo Electrónico (Login)</label>
          <div className="relative flex items-center group">
            <Mail size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="email"
              name="email"
              required
              maxLength={150}
              placeholder="admin@residencial.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white font-medium"
            />
          </div>
        </div>

        {/* Rol y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-blue-50/50 border border-blue-100 rounded-xl">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Rol del Sistema</label>
            <div className="relative flex items-center group">
              <Shield size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer"
              >
                <option value="1">Propietario (Acceso Total)</option>
                <option value="2">Administrador (Todo excepto Estados de Cuenta)</option>
                <option value="3">Conserje (Refacciones y Mantenimiento)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Estado de la Cuenta</label>
            <div className="relative flex items-center group">
              <Activity size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer"
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
                <option value="SUSPENDIDO">SUSPENDIDO</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contraseña */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            {usuarioAEditar ? 'Contraseña (dejar en blanco para no modificar)' : 'Contraseña de Acceso'}
          </label>
          <div className="relative flex items-center group">
            <Lock size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="password"
              name="password"
              required={!usuarioAEditar}
              minLength={6}
              maxLength={255}
              placeholder={usuarioAEditar ? '••••••••' : 'Mínimo 6 caracteres'}
              value={formData.password}
              onChange={handleChange}
              className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : usuarioAEditar ? 'Guardar Cambios' : 'Registrar Usuario'}
          </button>
        </div>

      </form>
    </div>
  );
}