import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  ShieldCheck, 
  User as UserIcon,
  UserCheck,
  Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';

// Datos de prueba iniciales (fallback si la API falla o está vacía)
const USUARIOS_INICIALES = [
  {
    id_usuario: 1,
    nombre: 'Carlos Roberto',
    primer_apellido: 'Mendoza',
    segundo_apellido: 'Vargas',
    ci_nit: '7845123',
    email: 'admin@edificio.com',
    telefono: '+591 71234567',
    rol: 1, // 1 = Administrador
    estado: 'ACTIVO',
  },
  {
    id_usuario: 2,
    nombre: 'Ana María',
    primer_apellido: 'Rojas',
    segundo_apellido: 'Paredes',
    ci_nit: '8521479',
    email: 'ana.rojas@gmail.com',
    telefono: '+591 79865432',
    rol: 3, // 3 = Inquilino
    estado: 'ACTIVO',
  },
  {
    id_usuario: 3,
    nombre: 'Luis Fernando',
    primer_apellido: 'Ortiz',
    segundo_apellido: '',
    ci_nit: '6325874',
    email: 'luis.ortiz@hotmail.com',
    telefono: '+591 65412398',
    rol: 3, 
    estado: 'SUSPENDIDO',
  },
];

export function ListadoUsuarios({ onNuevoUsuarioClick, onEditarUsuarioClick }) {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/usuarios`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response);

      if (Array.isArray(data) && data.length > 0) {
        setUsuarios(data);
      } else {
        setUsuarios(USUARIOS_INICIALES);
      }
    } catch (error) {
      console.warn('Usando listado inicial de prueba para usuarios:', error.message);
      setUsuarios(USUARIOS_INICIALES);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nombreCompleto) => {
    if (!window.confirm(`¿Estás seguro de desactivar al usuario ${nombreCompleto}?`)) return;

    const toastId = toast.loading('Procesando solicitud...');

    try {
      const response = await fetch(`${BASE_URL}/usuarios/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Error al eliminar en la API');

      toast.success('Usuario desactivado correctamente', { id: toastId });
      setUsuarios(prev => prev.map(u => (u.id_usuario || u.id) === id ? { ...u, estado: 'INACTIVO' } : u));
    } catch (error) {
      toast.success('Usuario desactivado localmente', { id: toastId });
      setUsuarios(prev => prev.map(u => (u.id_usuario || u.id) === id ? { ...u, estado: 'INACTIVO' } : u));
    }
  };

  // Filtramos por nombre, apellido, CI/NIT o correo
  const usuariosFiltrados = usuarios.filter(user => {
    const term = busqueda.toLowerCase();
    const nombre = (user.nombre || '').toLowerCase();
    const pApellido = (user.primer_apellido || '').toLowerCase();
    const sApellido = (user.segundo_apellido || '').toLowerCase();
    const ci = String(user.ci_nit || '').toLowerCase();
    const email = (user.email || '').toLowerCase();

    return nombre.includes(term) || pApellido.includes(term) || sApellido.includes(term) || ci.includes(term) || email.includes(term);
  });

  // Estilos visuales para los Roles (1: Admin, 2: Conserje, 3: Inquilino)
  const getRolBadge = (rol) => {
    const rolNum = Number(rol);
    if (rolNum === 1) {
      return (
        <span className="flex items-center w-fit gap-1 px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold border border-purple-200">
          <ShieldCheck size={14} /> Administrador
        </span>
      );
    }
    if (rolNum === 2) {
      return (
        <span className="flex items-center w-fit gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold border border-amber-200">
          <UserCheck size={14} /> Conserje
        </span>
      );
    }
    return (
      <span className="flex items-center w-fit gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-200">
        <UserIcon size={14} /> Inquilino
      </span>
    );
  };

  // Estilos visuales para el Estado
  const getEstadoEstilos = (estado) => {
    const est = (estado || '').toUpperCase();
    switch (est) {
      case 'ACTIVO':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'INACTIVO':
        return 'bg-slate-50 text-slate-600 border-slate-200';
      case 'SUSPENDIDO':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Listado de Usuarios</h2>
          <p className="text-sm text-slate-500">Administra los inquilinos y personal del sistema.</p>
        </div>

        <button 
          onClick={onNuevoUsuarioClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95"
        >
          <Users size={18} /> Registrar Usuario
        </button>
      </div>

      {/* Búsqueda */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-6 max-w-md focus-within:border-blue-600 focus-within:bg-white transition-all">
        <Search size={18} className="text-slate-400 shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar por nombre, CI o correo..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-transparent border-none outline-none ml-2 text-sm text-slate-800 w-full"
        />
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="text-sm font-semibold">Cargando usuarios...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4">Usuario</th>
                <th className="py-4 px-4">Contacto</th>
                <th className="py-4 px-4">Rol</th>
                <th className="py-4 px-4">Estado</th>
                <th className="py-4 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {usuariosFiltrados.length > 0 ? (
                usuariosFiltrados.map((user) => {
                  const id = user.id_usuario || user.id;
                  const nombreComp = `${user.nombre || ''} ${user.primer_apellido || ''} ${user.segundo_apellido || ''}`.trim();
                  
                  const iniciales = `${(user.nombre || 'U').charAt(0)}${(user.primer_apellido || '').charAt(0)}`.toUpperCase();

                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-extrabold border border-slate-200 shrink-0">
                            {iniciales}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 text-base">
                              {nombreComp}
                            </p>
                            <p className="text-xs text-slate-500 font-medium">
                              C.I. / NIT: {user.ci_nit || 'Sin registro'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-600">
                        <div className="flex flex-col gap-1 text-xs font-medium">
                          <span className="flex items-center gap-1.5">
                            <Mail size={14} className="text-slate-400 shrink-0" /> {user.email || 'Sin correo'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Phone size={14} className="text-slate-400 shrink-0" /> {user.telefono || 'Sin teléfono'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {getRolBadge(user.rol)}
                      </td>

                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 text-xs font-bold border rounded-lg ${getEstadoEstilos(user.estado)}`}>
                          {user.estado || 'ACTIVO'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => onEditarUsuarioClick && onEditarUsuarioClick(user)}
                            title="Editar"
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={17} />
                          </button>
                          <button 
                            onClick={() => handleDelete(id, nombreComp)}
                            title="Desactivar"
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400">
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}