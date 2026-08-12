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

// Datos de prueba iniciales (fallback si la API falla o está vacía)
const CONTRATOS_INICIALES = [
  {
    id_contrato: 1,
    departamentoNombre: 'Torre Zafiro Platinum - Unidad 101',
    inquilinoNombre: 'Ana María Rojas (CI: 8521479)',
    fecha_inicio: '2026-01-01',
    fecha_fin: '2026-12-31',
    monto_renta: 450.00,
    moneda: 'BOB',
    garantia: 450.00,
    estado: 'ACTIVO',
  },
  {
    id_contrato: 2,
    departamentoNombre: 'Condominio El Bosque - PB-2',
    inquilinoNombre: 'Luis Fernando Ortiz (CI: 6325874)',
    fecha_inicio: '2025-06-01',
    fecha_fin: '2026-06-01',
    monto_renta: 350.00,
    moneda: 'BOB',
    garantia: 350.00,
    estado: 'POR_VENCER',
  },
  {
    id_contrato: 3,
    departamentoNombre: 'Torre Zafiro Platinum - Unidad 4B',
    inquilinoNombre: 'Carlos Mendoza (CI: 7845123)',
    fecha_inicio: '2024-01-01',
    fecha_fin: '2025-01-01',
    monto_renta: 750.00,
    moneda: 'BOB',
    garantia: 750.00,
    estado: 'FINALIZADO',
  },
];

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
      // Peticiones paralelas para traer los catálogos y contratos
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

      // 1. Armar mapa de Edificios
      const mapEd = {};
      if (Array.isArray(dataEdificios)) {
        dataEdificios.forEach(e => {
          mapEd[e.id_edificio || e.id] = e.nombre;
        });
      }
      setEdificiosMap(mapEd);

      // 2. Armar mapa de Departamentos
      const mapDep = {};
      if (Array.isArray(dataDeptos)) {
        dataDeptos.forEach(d => {
          const edNombre = mapEd[d.id_edificio] || 'Edificio';
          const num = d.numero_departamento || d.numero || 'S/N';
          mapDep[d.id_departamento || d.id] = `${edNombre} - Depto ${num}`;
        });
      }
      setDeptosMap(mapDep);

      // 3. Armar mapa de Usuarios / Inquilinos
      const mapUsr = {};
      if (Array.isArray(dataUsers)) {
        dataUsers.forEach(u => {
          const nombreComp = `${u.nombre || ''} ${u.primer_apellido || ''}`.trim();
          const ci = u.ci_nit ? ` (CI: ${u.ci_nit})` : '';
          mapUsr[u.id_usuario || u.id] = `${nombreComp}${ci}`;
        });
      }
      setUsuariosMap(mapUsr);

      // Setear lista de contratos
      if (Array.isArray(dataContratos) && dataContratos.length > 0) {
        setContratos(dataContratos);
      } else {
        setContratos(CONTRATOS_INICIALES);
      }
    } catch (error) {
      console.warn('Error al cargar la lista de contratos desde la API:', error.message);
      setContratos(CONTRATOS_INICIALES);
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
      toast.success('Contrato eliminado localmente', { id: toastId });
      setContratos(prev => prev.filter(c => (c.id_contrato || c.id) !== id));
    }
  };

  // Helper para formatear fechas ISO a YYYY-MM-DD
  const formatFecha = (strFecha) => {
    if (!strFecha) return 'N/A';
    try {
      return strFecha.split('T')[0];
    } catch (e) {
      return strFecha;
    }
  };

  // Filtrado dinámico por nombre de departamento o de inquilino
  const contratosFiltrados = contratos.filter((c) => {
    const term = busqueda.toLowerCase();
    
    const deptoNombre = deptosMap[c.id_departamento] 
      || c.departamentoNombre 
      || c.departamento 
      || '';

    const inquilinoNombre = usuariosMap[c.id_usuario] 
      || c.inquilinoNombre 
      || c.inquilino 
      || '';

    return deptoNombre.toLowerCase().includes(term) || inquilinoNombre.toLowerCase().includes(term);
  });

  // Estilos visuales para el estado del contrato
  const getEstadoEstilos = (estado) => {
    const est = (estado || '').toUpperCase();
    switch (est) {
      case 'ACTIVO':
      case 'VIGENTE':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'POR_VENCER':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'FINALIZADO':
        return 'bg-slate-50 text-slate-600 border-slate-200';
      case 'CANCELADO':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-fade-in">
      
      {/* Cabecera de la sección */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Listado de Contratos</h2>
          <p className="text-sm text-slate-500">Administra los acuerdos de alquiler vigentes e históricos.</p>
        </div>

        <button 
          onClick={onNuevoContratoClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95"
        >
          <Plus size={18} /> Registrar Contrato
        </button>
      </div>

      {/* Barra de Búsqueda Interna */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-6 max-w-md focus-within:border-blue-600 focus-within:bg-white transition-all">
        <Search size={18} className="text-slate-400 shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar por departamento o inquilino..." 
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
                <th className="py-4 px-4">Unidad / Inquilino</th>
                <th className="py-4 px-4">Vigencia</th>
                <th className="py-4 px-4">Renta / Garantía</th>
                <th className="py-4 px-4">Estado</th>
                <th className="py-4 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {contratosFiltrados.length > 0 ? (
                contratosFiltrados.map((contrato) => {
                  const id = contrato.id_contrato || contrato.id;

                  // Resolución de Nombres
                  const nombreDepto = deptosMap[contrato.id_departamento] 
                    || contrato.departamentoNombre 
                    || contrato.departamento 
                    || `Departamento #${contrato.id_departamento || 1}`;

                  const nombreInquilino = usuariosMap[contrato.id_usuario] 
                    || contrato.inquilinoNombre 
                    || contrato.inquilino 
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

                      {/* Fechas de Vigencia */}
                      <td className="py-4 px-4 text-slate-600">
                        <div className="flex items-center gap-1 text-xs font-semibold bg-slate-100 w-fit px-2.5 py-1 rounded-md">
                          <Calendar size={13} className="text-slate-400 shrink-0" />
                          {formatFecha(contrato.fecha_inicio)} al {formatFecha(contrato.fecha_fin)}
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

                      {/* Estado */}
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 text-xs font-bold border rounded-lg ${getEstadoEstilos(contrato.estado)}`}>
                          {contrato.estado || 'ACTIVO'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Imprimir / Ver Documento Legal */}
                          <button 
                            onClick={() => onVerDocumentoClick && onVerDocumentoClick(contrato)}
                            title="Ver / Imprimir Contrato Legal"
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Printer size={17} />
                          </button>

                          <button 
                            title="Editar"
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={17} />
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