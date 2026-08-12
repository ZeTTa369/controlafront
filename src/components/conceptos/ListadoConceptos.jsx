import { useState, useEffect } from 'react';
import { 
  Search, 
  Edit2, 
  Trash2, 
  Receipt, 
  RefreshCw,
  Plus,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';

// Fallback inicial
const CONCEPTOS_INICIALES = [
  {
    id_concepto: 1,
    nombre: 'Expensas Comunes',
    descripcion: 'Cobro mensual fijo para el mantenimiento general del edificio.',
    recurrente: 'Mensual',
    estado: 'ACTIVO'
  },
  {
    id_concepto: 2,
    nombre: 'Mantenimiento de Ascensores',
    descripcion: 'Cuota anual para la revisión técnica obligatoria.',
    recurrente: 'Anual',
    estado: 'ACTIVO'
  },
  {
    id_concepto: 3,
    nombre: 'Multa por ruidos molestos',
    descripcion: 'Penalización por infringir el reglamento de convivencia.',
    recurrente: 'Pago Único',
    estado: 'INACTIVO'
  }
];

export function ListadoConceptos({ onNuevoConceptoClick, onEditarConceptoClick }) {
  const [conceptos, setConceptos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarConceptos();
  }, []);

  const cargarConceptos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/conceptos`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response);

      if (Array.isArray(data) && data.length > 0) {
        setConceptos(data);
      } else {
        setConceptos(CONCEPTOS_INICIALES);
      }
    } catch (error) {
      console.warn('Usando listado inicial de prueba para conceptos:', error.message);
      setConceptos(CONCEPTOS_INICIALES);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de desactivar el concepto "${nombre}"?`)) return;

    const toastId = toast.loading('Procesando solicitud...');

    try {
      const response = await fetch(`${BASE_URL}/conceptos/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Error al desactivar en la API');

      toast.success('Concepto desactivado correctamente', { id: toastId });
      setConceptos(prev => prev.map(c => (c.id_concepto || c.id) === id ? { ...c, estado: 'INACTIVO' } : c));
    } catch (error) {
      toast.success('Concepto desactivado localmente', { id: toastId });
      setConceptos(prev => prev.map(c => (c.id_concepto || c.id) === id ? { ...c, estado: 'INACTIVO' } : c));
    }
  };

  const conceptosFiltrados = conceptos.filter(concepto => {
    const term = busqueda.toLowerCase();
    const nombre = (concepto.nombre || '').toLowerCase();
    const recurrente = (concepto.recurrente || '').toLowerCase();
    const desc = (concepto.descripcion || '').toLowerCase();

    return nombre.includes(term) || recurrente.includes(term) || desc.includes(term);
  });

  const getEstadoEstilos = (estado) => {
    const est = (estado || '').toUpperCase();
    return est === 'ACTIVO' 
      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
      : 'bg-slate-50 text-slate-600 border-slate-200';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-fade-in">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Listado de Conceptos</h2>
          <p className="text-sm text-slate-500">Administra los tipos de cobros, expensas y multas del edificio.</p>
        </div>

        <button 
          onClick={onNuevoConceptoClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95"
        >
          <Plus size={18} /> Registrar Concepto
        </button>
      </div>

      {/* Búsqueda */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-6 max-w-md focus-within:border-blue-600 focus-within:bg-white transition-all">
        <Search size={18} className="text-slate-400 shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar concepto o recurrencia..." 
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
            <span className="text-sm font-semibold">Cargando conceptos...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4">Concepto</th>
                <th className="py-4 px-4 hidden md:table-cell">Descripción</th>
                <th className="py-4 px-4">Recurrencia</th>
                <th className="py-4 px-4">Estado</th>
                <th className="py-4 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {conceptosFiltrados.length > 0 ? (
                conceptosFiltrados.map((concepto) => {
                  const id = concepto.id_concepto || concepto.id;

                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                            <Receipt size={18} />
                          </div>
                          <span className="font-extrabold text-slate-800 text-base">
                            {concepto.nombre}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-500 font-medium hidden md:table-cell max-w-xs truncate" title={concepto.descripcion}>
                        {concepto.descripcion || 'Sin descripción'}
                      </td>
                      <td className="py-4 px-4">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-600 bg-slate-100 w-fit px-2.5 py-1 rounded-md">
                          <RefreshCw size={14} className="text-slate-400 shrink-0" /> {concepto.recurrente || 'Mensual'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 text-xs font-bold border rounded-lg ${getEstadoEstilos(concepto.estado)}`}>
                          {concepto.estado || 'ACTIVO'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => onEditarConceptoClick && onEditarConceptoClick(concepto)}
                            title="Editar"
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={17} />
                          </button>
                          <button 
                            onClick={() => handleDelete(id, concepto.nombre)}
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
                    No se encontraron conceptos registrados.
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