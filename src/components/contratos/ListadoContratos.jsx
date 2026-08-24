import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Edit2, 
  Trash2, 
  Home, 
  Users, 
  Calendar, 
  DollarSign, 
  Plus,
  Loader2,
  Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';

// Helper para convertir cualquier fecha a formato DD/MM/YYYY
const formatFechaDMY = (strFecha) => {
  if (!strFecha) return 'N/A';
  try {
    const soloFecha = strFecha.split('T')[0];
    const [y, m, d] = soloFecha.split('-');
    if (!y || !m || !d) return strFecha;
    return `${d}/${m}/${y}`;
  } catch (e) {
    return strFecha;
  }
};

export function ListadoContratos({ onNuevoContratoClick, onVerDocumentoClick }) {
  const [contratos, setContratos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  // Mapeos relacionales
  const [deptosMap, setDeptosMap] = useState({});
  const [edificiosMap, setEdificiosMap] = useState({});
  const [usuariosMap, setUsuariosMap] = useState({});

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    setLoading(true);
    try {
      const [resContratos, resDeptos, resEdificios, resUsers] = await Promise.all([
        fetch(`${BASE_URL}/contratos`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/departamentos`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/edificios`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/usuarios`, { headers: getAuthHeaders() }),
      ]);

      const dataContratos = await handleResponse(resContratos);
      const dataDeptos = await handleResponse(resDeptos);
      const dataEdificios = await handleResponse(resEdificios);
      const dataUsers = await handleResponse(resUsers);

      // 1. Mapa de Edificios
      const mapEd = {};
      if (Array.isArray(dataEdificios)) {
        dataEdificios.forEach(e => {
          mapEd[e.id_edificio || e.id] = e.nombre;
        });
      }
      setEdificiosMap(mapEd);

      // 2. Mapa de Departamentos: Piso antes de Depto (Ej. "Gaviota - Piso 1 Depto H")
      const mapDep = {};
      if (Array.isArray(dataDeptos)) {
        dataDeptos.forEach(d => {
          const edNombre = mapEd[d.id_edificio] || 'Edificio';
          const num = d.numero_departamento || d.numero || 'S/N';
          const piso = d.piso || 1;
          mapDep[d.id_departamento || d.id] = `${edNombre} - Piso ${piso} Depto ${num}`;
        });
      }
      setDeptosMap(mapDep);

      // 3. Mapa de Usuarios / Inquilinos
      const mapUsr = {};
      if (Array.isArray(dataUsers)) {
        dataUsers.forEach(u => {
          const nombreComp = `${u.nombre || ''} ${u.primer_apellido || ''} ${u.segundo_apellido || ''}`.trim();
          const ci = u.ci_nit ? ` (CI: ${u.ci_nit})` : '';
          mapUsr[u.id_usuario || u.id] = `${nombreComp}${ci}`;
        });
      }
      setUsuariosMap(mapUsr);

      if (Array.isArray(dataContratos)) {
        setContratos(dataContratos);
      }
    } catch (error) {
      console.warn('Error al cargar la lista de contratos desde la API:', error.message);
      toast.error('No se pudieron cargar los contratos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar o cancelar este contrato?')) return;

    const toastId = toast.loading('Eliminando contrato...');
    try {
      const response = await fetch(`${BASE_URL}/contratos/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Error en el servidor al eliminar');

      toast.success('Contrato eliminado exitosamente', { id: toastId });
      setContratos(prev => prev.filter(c => (c.id_contrato || c.id) !== id));
    } catch (error) {
      toast.error(error.message || 'Error al eliminar contrato', { id: toastId });
    }
  };

  // Filtrado por unidad o inquilino
  const contratosFiltrados = contratos.filter((c) => {
    const term = busqueda.toLowerCase();
    const deptoNombre = deptosMap[c.id_departamento] || c.departamentoNombre || '';
    const inquilinoNombre = usuariosMap[c.id_usuario] || c.inquilinoNombre || '';

    return deptoNombre.toLowerCase().includes(term) || inquilinoNombre.toLowerCase().includes(term);
  });

  const getEstadoEstilos = (estado) => {
    const est = (estado || '').toUpperCase();
    switch (est) {
      case 'DIRECTO':
      case 'ACTIVO':
      case 'VIGENTE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'TERCEROS':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'RENOVACION':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'POR_VENCER':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'FINALIZADO':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'CANCELADO':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-fade-in">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Listado de Contratos</h2>
          <p className="text-sm text-slate-500">Administra los acuerdos vigentes ordenados por ubicación</p>
        </div>

        <button 
          onClick={onNuevoContratoClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95"
        >
          <Plus size={18} /> Registrar Contrato
        </button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-6 max-w-md focus-within:border-blue-600 focus-within:bg-white transition-all">
        <Search size={18} className="text-slate-400 shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar por edificio, piso, depto o inquilino..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-transparent border-none outline-none ml-2 text-sm text-slate-800 w-full"
        />
      </div>

      {/* Tabla de Contratos */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="text-sm font-semibold">Cargando contratos de alquiler...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4">Piso y Departamento / Inquilino</th>
                <th className="py-4 px-4">Vigencia (Día / Mes / Año)</th>
                <th className="py-4 px-4">Canon Total / Garantía</th>
                <th className="py-4 px-4">Tipo / Estado</th>
                <th className="py-4 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {contratosFiltrados.length > 0 ? (
                contratosFiltrados.map((contrato) => {
                  const id = contrato.id_contrato || contrato.id;

                  const nombreDepto = deptosMap[contrato.id_departamento] 
                    || contrato.departamentoNombre 
                    || `Departamento #${contrato.id_departamento || 1}`;

                  const nombreInquilino = usuariosMap[contrato.id_usuario] 
                    || contrato.inquilinoNombre 
                    || `Inquilino #${contrato.id_usuario || 1}`;

                  const montoRenta = Number(contrato.monto_renta || 0);
                  const garantia = Number(contrato.garantia || 0);
                  const moneda = contrato.moneda || 'BOB';

                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Unidad e Inquilino */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                              <Home size={14} className="text-slate-400 shrink-0" /> {nombreDepto}
                            </p>
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                              <Users size={13} className="text-slate-400 shrink-0" /> {nombreInquilino}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Fechas de Vigencia Formato DD/MM/YYYY */}
                      <td className="py-4 px-4 text-slate-600">
                        <div className="flex items-center gap-1 text-xs font-semibold bg-slate-100 w-fit px-2.5 py-1 rounded-md">
                          <Calendar size={13} className="text-slate-400 shrink-0" />
                          {formatFechaDMY(contrato.fecha_inicio)} al {formatFechaDMY(contrato.fecha_fin)}
                        </div>
                      </td>

                      {/* Renta y Garantía */}
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-slate-800 flex items-center gap-1">
                          <DollarSign size={15} className="text-slate-400 shrink-0" />
                          {montoRenta.toFixed(2)} <span className="text-xs font-bold text-slate-400">{moneda}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          Garantía: {garantia.toFixed(2)} {moneda}
                        </div>
                      </td>

                      {/* Estado / Tipo */}
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 text-xs font-bold border rounded-lg ${getEstadoEstilos(contrato.estado)}`}>
                          {contrato.estado || 'DIRECTO'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => onVerDocumentoClick && onVerDocumentoClick(contrato)}
                            title="Ver / Imprimir Contrato"
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Printer size={17} />
                          </button>

                          <button 
                            onClick={() => handleDelete(id)}
                            title="Eliminar"
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
                    No se encontraron contratos registrados.
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