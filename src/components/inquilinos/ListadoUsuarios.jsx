import { useState, useEffect, useMemo } from 'react';
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
  Loader2,
  KeyRound,
  ClipboardList,
  Plus,
  Eye,
  X,
  Home,
  Globe,
  Crown,
  Shield,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';
import { listarUsuarios, eliminarUsuario } from '../../services/usuarioService';
import { listarContratos } from '../../services/contratoService';
import { ModalCambiarPassword } from '../modals/ModalCambiarPassword';
import { ModalEditarUsuario } from '../modals/ModalEditarUsuario';
import { ModalConfirmarEliminar } from '../modals/ModalConfirmarEliminar';
import { CensoHabitantesEdificio } from './CensoHabitantesEdificio';
import { generarCodigoDepartamento } from '../utils/codigoDepartamento';

const formatFechaDMY = (strFecha) => {
  if (!strFecha) return 'N/A';
  try {
    const soloFecha = String(strFecha).split('T')[0];
    const [y, m, d] = soloFecha.split('-');
    if (!y || !m || !d) return strFecha;
    return `${d}/${m}/${y}`;
  } catch {
    return strFecha;
  }
};

// Normaliza el rol efectivo del usuario (soporta rol 3 heredado de NuevoContrato y rol 4)
const obtenerRolEfectivo = (user, tieneContratos = false) => {
  const rolNum = Number(user?.rol || 4);
  const email = (user?.email || '').toLowerCase();
  if (rolNum === 4) return 4; // Inquilino
  if (rolNum === 3 && (email.startsWith('inquilino_') || tieneContratos)) return 4;
  return rolNum; // 1: Propietario, 2: Administrador, 3: Conserje
};

export function ListadoUsuarios({ onNuevoUsuarioClick }) {
  const [tabActiva, setTabActiva] = useState('USUARIOS'); // 'USUARIOS' | 'CENSO'
  const [usuarios, setUsuarios] = useState([]);
  const [contratosAll, setContratosAll] = useState([]);
  const [deptosMap, setDeptosMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [tabEstado, setTabEstado] = useState('TODOS'); // 'TODOS' | 'ACTIVO' | 'INACTIVO'

  // Modales
  const [usuarioDetalle, setUsuarioDetalle] = useState(null);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [usuarioParaResetear, setUsuarioParaResetear] = useState(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    setLoading(true);
    try {
      const [dataUsers, dataContratos, resDeptos, resEdificios] = await Promise.all([
        listarUsuarios().catch(() => []),
        listarContratos().catch(() => []),
        fetch(`${BASE_URL}/departamentos`, { headers: getAuthHeaders() }).then(handleResponse).catch(() => []),
        fetch(`${BASE_URL}/edificios`, { headers: getAuthHeaders() }).then(handleResponse).catch(() => []),
      ]);

      const mapEd = {};
      if (Array.isArray(resEdificios)) {
        resEdificios.forEach((e) => {
          mapEd[e.id_edificio || e.id] = e.nombre;
        });
      }

      const mapDep = {};
      if (Array.isArray(resDeptos)) {
        resDeptos.forEach((d) => {
          const idDep = d.id_departamento || d.id;
          const edNombre = mapEd[d.id_edificio] || 'Edificio';
          const num = d.numero_departamento || d.numero || 'S/N';
          const piso = d.piso || 1;
          const codigo = generarCodigoDepartamento({
            nombreEdificio: edNombre,
            piso,
            numeroDepartamento: num,
            bloque: d.bloque,
          });
          mapDep[idDep] = {
            codigo,
            etiqueta: `${edNombre} - Piso ${piso} Depto ${num}`,
          };
        });
      }

      setDeptosMap(mapDep);
      setContratosAll(Array.isArray(dataContratos) ? dataContratos : []);
      setUsuarios(Array.isArray(dataUsers) ? dataUsers : []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      toast.error('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  // Obtener contratos asociados a un usuario
  const obtenerContratosUsuario = (idUsuario) => {
    return contratosAll.filter((c) => Number(c.id_usuario) === Number(idUsuario));
  };

  // Estadísticas rápidas
  const stats = useMemo(() => {
    const total = usuarios.length;
    const activos = usuarios.filter((u) => (u.estado || 'ACTIVO').toUpperCase() === 'ACTIVO').length;
    const inquilinos = usuarios.filter((u) => {
      const id = u.id_usuario || u.id;
      const tieneContratos = contratosAll.some((c) => Number(c.id_usuario) === Number(id));
      return obtenerRolEfectivo(u, tieneContratos) === 4;
    }).length;
    const personal = usuarios.filter((u) => {
      const id = u.id_usuario || u.id;
      const tieneContratos = contratosAll.some((c) => Number(c.id_usuario) === Number(id));
      return [1, 2, 3].includes(obtenerRolEfectivo(u, tieneContratos));
    }).length;
    return { total, activos, inquilinos, personal };
  }, [usuarios, contratosAll]);

  // Filtro compuesto
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((user) => {
      const id = user.id_usuario || user.id;
      const tieneContratos = contratosAll.some((c) => Number(c.id_usuario) === Number(id));
      const rolEfectivo = obtenerRolEfectivo(user, tieneContratos);

      const term = busqueda.toLowerCase().trim();
      const nombre = (user.nombre || '').toLowerCase();
      const pApellido = (user.primer_apellido || '').toLowerCase();
      const sApellido = (user.segundo_apellido || '').toLowerCase();
      const ci = String(user.ci_nit || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const tel = String(user.telefono || '').toLowerCase();

      const est = (user.estado || 'ACTIVO').toUpperCase();

      if (filtroRol && String(rolEfectivo) !== String(filtroRol)) return false;

      if (tabEstado === 'ACTIVO' && est !== 'ACTIVO') return false;
      if (tabEstado === 'INACTIVO' && est === 'ACTIVO') return false;

      if (!term) return true;

      return (
        nombre.includes(term) ||
        pApellido.includes(term) ||
        sApellido.includes(term) ||
        ci.includes(term) ||
        email.includes(term) ||
        tel.includes(term)
      );
    });
  }, [usuarios, contratosAll, busqueda, filtroRol, tabEstado]);

  const confirmarDesactivacion = async () => {
    if (!usuarioAEliminar) return;

    const id = usuarioAEliminar.id_usuario || usuarioAEliminar.id;
    setEliminando(true);
    const toastId = toast.loading('Desactivando usuario...');

    try {
      await eliminarUsuario(id);
      toast.success('Usuario desactivado correctamente', { id: toastId });
      setUsuarios((prev) =>
        prev.map((u) => ((u.id_usuario || u.id) === id ? { ...u, estado: 'INACTIVO' } : u))
      );
      if (usuarioDetalle && (usuarioDetalle.id_usuario || usuarioDetalle.id) === id) {
        setUsuarioDetalle((prev) => ({ ...prev, estado: 'INACTIVO' }));
      }
      setUsuarioAEliminar(null);
    } catch (error) {
      toast.error(error.message || 'Error al desactivar usuario', { id: toastId });
    } finally {
      setEliminando(false);
    }
  };

  const getRolBadge = (user, tieneContratos = false) => {
    const rolNum = obtenerRolEfectivo(user, tieneContratos);
    if (rolNum === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200">
          <Crown size={13} /> Propietario
        </span>
      );
    }
    if (rolNum === 2) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold border border-purple-200">
          <ShieldCheck size={13} /> Administrador
        </span>
      );
    }
    if (rolNum === 3) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-200">
          <UserCheck size={13} /> Conserje
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-200">
        <UserIcon size={13} /> Inquilino
      </span>
    );
  };

  const getEstadoEstilos = (estado) => {
    const est = (estado || 'ACTIVO').toUpperCase();
    switch (est) {
      case 'ACTIVO':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INACTIVO':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'SUSPENDIDO':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-fade-in relative">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Gestión de Usuarios y Habitantes</h2>
          <p className="text-sm text-slate-500">Administra inquilinos, personal administrativo y el padrón de ocupantes por edificio.</p>
        </div>

        <button 
          type="button"
          onClick={onNuevoUsuarioClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          <Plus size={18} /> Registrar Usuario
        </button>
      </div>

      {/* Tabs de navegación */}
      <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-xl w-fit mb-6">
        <button
          type="button"
          onClick={() => setTabActiva('USUARIOS')}
          className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            tabActiva === 'USUARIOS'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users size={15} /> Usuarios del Sistema ({stats.total})
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('CENSO')}
          className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            tabActiva === 'CENSO'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-blue-600'
          }`}
        >
          <ClipboardList size={15} /> Lista de Habitantes por Edificio
        </button>
      </div>

      {/* VISTA 1: LISTADO COMPLETO DE USUARIOS */}
      {tabActiva === 'USUARIOS' ? (
        <>
          {/* Métricas rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Usuarios</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
            </div>
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Activos</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{stats.activos}</p>
            </div>
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">Inquilinos</span>
              <p className="text-2xl font-black text-blue-700 mt-1">{stats.inquilinos}</p>
            </div>
            <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">Personal / Admin</span>
              <p className="text-2xl font-black text-purple-700 mt-1">{stats.personal}</p>
            </div>
          </div>

          {/* Barra de Filtros */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-2xl">
              {/* Buscador */}
              <div className="sm:col-span-2 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-blue-600 focus-within:bg-white transition-all">
                <Search size={18} className="text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre, CI, teléfono o correo..." 
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="bg-transparent border-none outline-none ml-2 text-sm text-slate-800 w-full"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda('')}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Filtro por Rol */}
              <div className="relative flex items-center">
                <Shield size={17} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={filtroRol}
                  onChange={(e) => setFiltroRol(e.target.value)}
                  className="w-full py-2.5 pl-10 pr-6 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 focus:bg-white appearance-none cursor-pointer"
                >
                  <option value="">Todos los Roles</option>
                  <option value="1">Propietario</option>
                  <option value="2">Administrador</option>
                  <option value="3">Conserje</option>
                  <option value="4">Inquilino</option>
                </select>
              </div>
            </div>

            {/* Tabs de Estado */}
            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start lg:self-auto">
              <button
                type="button"
                onClick={() => setTabEstado('TODOS')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tabEstado === 'TODOS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Todos ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setTabEstado('ACTIVO')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tabEstado === 'ACTIVO' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                Activos ({stats.activos})
              </button>
              <button
                type="button"
                onClick={() => setTabEstado('INACTIVO')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tabEstado === 'INACTIVO' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Inactivos ({stats.total - stats.activos})
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                <Loader2 size={32} className="animate-spin text-blue-600" />
                <span className="text-sm font-semibold">Cargando usuarios y asignaciones...</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[780px]">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-4">Usuario / Documento</th>
                    <th className="py-4 px-4">Contacto</th>
                    <th className="py-4 px-4">Unidad Asignada / Rol</th>
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

                      const contratosUsr = obtenerContratosUsuario(id);
                      const contratoVigente = contratosUsr.find(
                        (c) => !['FINALIZADO', 'CANCELADO'].includes((c.estado || 'DIRECTO').toUpperCase())
                      );
                      const deptoInfo = contratoVigente ? deptosMap[contratoVigente.id_departamento] : null;

                      return (
                        <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Usuario */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-extrabold border border-blue-200 shrink-0">
                                {iniciales}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-800 text-sm">
                                  {nombreComp}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                                  <span>CI/NIT: <strong className="text-slate-700">{user.ci_nit || 'N/A'}</strong></span>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1">
                                    <Globe size={11} className="text-slate-400" /> {user.nacionalidad || 'Boliviana'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Contacto */}
                          <td className="py-4 px-4 text-slate-600">
                            <div className="flex flex-col gap-1 text-xs font-medium">
                              <span className="flex items-center gap-1.5">
                                <Phone size={13} className="text-slate-400 shrink-0" />
                                <strong className="text-slate-700">{user.telefono || 'Sin teléfono'}</strong>
                              </span>
                              <span className="flex items-center gap-1.5 text-slate-500">
                                <Mail size={13} className="text-slate-400 shrink-0" /> {user.email || 'Sin correo'}
                              </span>
                            </div>
                          </td>

                          {/* Rol y Unidad */}
                          <td className="py-4 px-4">
                            <div className="space-y-1.5">
                              {getRolBadge(user, contratosUsr.length > 0)}
                              {deptoInfo && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                                  <span className="px-1.5 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-extrabold rounded">
                                    {deptoInfo.codigo}
                                  </span>
                                  <span className="truncate max-w-[190px]">{deptoInfo.etiqueta}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Estado */}
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 text-xs font-bold border rounded-lg ${getEstadoEstilos(user.estado)}`}>
                              {user.estado || 'ACTIVO'}
                            </span>
                          </td>

                          {/* Acciones */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setUsuarioDetalle(user)}
                                title="Ver Ficha Completa"
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye size={17} />
                              </button>

                              <button 
                                type="button"
                                onClick={() => setUsuarioEditando({
                                  ...user,
                                  rol: obtenerRolEfectivo(user, contratosUsr.length > 0),
                                })}
                                title="Editar Datos"
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 size={17} />
                              </button>

                              <button 
                                type="button"
                                onClick={() => setUsuarioParaResetear(user)}
                                title="Restablecer Contraseña"
                                className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <KeyRound size={17} />
                              </button>

                              <button 
                                type="button"
                                onClick={() => setUsuarioAEliminar(user)}
                                title="Desactivar Usuario"
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
                        No se encontraron usuarios con los filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        /* VISTA 2: PLANILLA DE HABITANTES POR EDIFICIO */
        <CensoHabitantesEdificio />
      )}

      {/* ================= MODAL FICHA DETALLADA DEL USUARIO ================= */}
      {usuarioDetalle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden animate-scale-up">
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-base">
                  {`${(usuarioDetalle.nombre || 'U').charAt(0)}${(usuarioDetalle.primer_apellido || '').charAt(0)}`.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold">
                    {`${usuarioDetalle.nombre || ''} ${usuarioDetalle.primer_apellido || ''} ${usuarioDetalle.segundo_apellido || ''}`.trim()}
                  </h3>
                  <p className="text-xs text-slate-400">
                    ID #{usuarioDetalle.id_usuario || usuarioDetalle.id} • {usuarioDetalle.estado || 'ACTIVO'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUsuarioDetalle(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm max-h-[78vh] overflow-y-auto">
              {/* Datos personales */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">C.I. / NIT</span>
                  <p className="font-extrabold text-slate-800 text-sm mt-0.5">{usuarioDetalle.ci_nit || 'No registrado'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Nacionalidad</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{usuarioDetalle.nacionalidad || 'Boliviana'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Teléfono / Celular</span>
                  <p className="font-bold text-slate-800 mt-0.5">{usuarioDetalle.telefono || 'Sin teléfono'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Rol Asignado</span>
                  <div className="mt-1">
                    {getRolBadge(
                      usuarioDetalle,
                      obtenerContratosUsuario(usuarioDetalle.id_usuario || usuarioDetalle.id).length > 0
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Correo Electrónico</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{usuarioDetalle.email || 'Sin correo'}</p>
                </div>
              </div>

              {/* Historial de Contratos / Unidades del usuario */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Home size={14} className="text-blue-600" /> Contratos y Unidades Vinculadas
                </h4>
                {(() => {
                  const listaC = obtenerContratosUsuario(usuarioDetalle.id_usuario || usuarioDetalle.id);
                  if (listaC.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-center">
                        Este usuario no figura como titular en ningún contrato registrado.
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {listaC.map((c) => {
                        const dep = deptosMap[c.id_departamento];
                        return (
                          <div
                            key={c.id_contrato || c.id}
                            className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                {dep?.codigo && (
                                  <span className="px-1.5 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-extrabold rounded">
                                    {dep.codigo}
                                  </span>
                                )}
                                <span className="font-extrabold text-slate-800">
                                  {dep?.etiqueta || `Departamento #${c.id_departamento}`}
                                </span>
                              </div>
                              <p className="text-slate-500 mt-1 flex items-center gap-1">
                                <Calendar size={12} /> {formatFechaDMY(c.fecha_inicio)} al {formatFechaDMY(c.fecha_fin)}
                              </p>
                            </div>
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg">
                              {c.estado || 'DIRECTO'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setUsuarioDetalle(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl uppercase tracking-wider cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={() => {
                  const u = usuarioDetalle;
                  const tieneC = obtenerContratosUsuario(u.id_usuario || u.id).length > 0;
                  setUsuarioDetalle(null);
                  setUsuarioEditando({ ...u, rol: obtenerRolEfectivo(u, tieneC) });
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Edit2 size={14} /> Editar Usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL EDITAR USUARIO ================= */}
      <ModalEditarUsuario
        isOpen={Boolean(usuarioEditando)}
        usuario={usuarioEditando}
        onClose={() => setUsuarioEditando(null)}
        onSave={(actualizado) => {
          const idAct = actualizado.id_usuario || actualizado.id;
          setUsuarios((prev) =>
            prev.map((u) => ((u.id_usuario || u.id) === idAct ? { ...u, ...actualizado } : u))
          );
        }}
      />

      {/* ================= MODAL RESTABLECER CONTRASEÑA ================= */}
      {usuarioParaResetear && (
        <ModalCambiarPassword
          usuario={usuarioParaResetear}
          onClose={() => setUsuarioParaResetear(null)}
        />
      )}

      {/* ================= MODAL CONFIRMAR DESACTIVACIÓN ================= */}
      {usuarioAEliminar && (
        <ModalConfirmarEliminar
          isOpen={Boolean(usuarioAEliminar)}
          onClose={() => setUsuarioAEliminar(null)}
          onConfirm={confirmarDesactivacion}
          loading={eliminando}
          titulo="¿Desactivar cuenta de usuario?"
          mensaje={`Estás a punto de desactivar a "${`${usuarioAEliminar.nombre || ''} ${usuarioAEliminar.primer_apellido || ''}`.trim()}". El usuario pasará a estado INACTIVO y no podrá iniciar sesión en el sistema.`}
        />
      )}
    </div>
  );
}