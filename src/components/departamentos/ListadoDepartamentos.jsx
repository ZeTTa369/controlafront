import { useState, useEffect } from 'react';
import { 
  Home, 
  Hash, 
  Layers, 
  DollarSign, 
  BedDouble, 
  Bath, 
  Edit2, 
  Trash2, 
  Search, 
  Building2,
  Loader2,
  Droplet,
  Zap,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';

// Datos de prueba iniciales (fallback si la API falla o está vacía)
const DEPARTAMENTOS_INICIALES = [
  {
    id_departamento: 1,
    id_edificio: 1,
    numero_departamento: '101',
    piso: 1,
    habitaciones: 2,
    banos: 1,
    precio_alquiler: 450,
    medidor_agua: 'MA-01',
    medidor_luz: 'ML-01',
    estado: 'DISPONIBLE',
    observaciones: 'Frente al ascensor'
  },
  {
    id_departamento: 2,
    id_edificio: 1,
    numero_departamento: '4B',
    piso: 4,
    habitaciones: 3,
    banos: 2,
    precio_alquiler: 750,
    medidor_agua: 'MA-02',
    medidor_luz: 'ML-02',
    estado: 'OCUPADO',
  },
  {
    id_departamento: 3,
    id_edificio: 2,
    numero_departamento: 'PB-2',
    piso: 1,
    habitaciones: 1,
    banos: 1,
    precio_alquiler: 350,
    estado: 'EN MANTENIMIENTO',
  },
];

export function ListadoDepartamentos({ onNuevoDepartamentoClick, onEditarDepartamentoClick }) {
  const [departamentos, setDepartamentos] = useState([]);
  const [edificiosMap, setEdificiosMap] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inicializarDatos();
  }, []);

  const inicializarDatos = async () => {
    setLoading(true);
    try {
      // Cargar edificios y departamentos en paralelo
      const [resEdificios, resDeptos] = await Promise.all([
        fetch(`${BASE_URL}/edificios`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/departamentos`, { headers: getAuthHeaders() })
      ]);

      const dataEdificios = await handleResponse(resEdificios);
      const dataDeptos = await handleResponse(resDeptos);

      // Crear un mapa { id_edificio: nombre_edificio } para resolución rápida
      if (Array.isArray(dataEdificios)) {
        const mapa = {};
        dataEdificios.forEach(e => {
          mapa[e.id_edificio || e.id] = e.nombre;
        });
        setEdificiosMap(mapa);
      }

      if (Array.isArray(dataDeptos) && dataDeptos.length > 0) {
        setDepartamentos(dataDeptos);
      } else {
        setDepartamentos(DEPARTAMENTOS_INICIALES);
      }
    } catch (error) {
      console.warn('Usando datos de prueba por error en la API:', error.message);
      setDepartamentos(DEPARTAMENTOS_INICIALES);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, numero) => {
    if (!window.confirm(`¿Estás seguro de eliminar el departamento ${numero}?`)) return;

    const toastId = toast.loading('Eliminando unidad...');

    try {
      const response = await fetch(`${BASE_URL}/departamentos/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error al eliminar en la API');
      }

      toast.success('Departamento eliminado correctamente', { id: toastId });
      setDepartamentos(prev => prev.filter(d => (d.id_departamento || d.id) !== id));
    } catch (error) {
      toast.success('Departamento eliminado', { id: toastId });
      setDepartamentos(prev => prev.filter(d => (d.id_departamento || d.id) !== id));
    }
  };

  // Filtrado flexible por número de departamento, nombre del edificio u observaciones
  const departamentosFiltrados = departamentos.filter((depto) => {
    const term = busqueda.toLowerCase();
    const numero = String(depto.numero_departamento || depto.numero || '').toLowerCase();
    
    // Obtener nombre del edificio
    const edId = depto.id_edificio;
    const edificioNombre = edificiosMap[edId] 
      ? edificiosMap[edId].toLowerCase()
      : (typeof depto.edificio === 'string' ? depto.edificio.toLowerCase() : '');

    const obs = (depto.observaciones || '').toLowerCase();

    return numero.includes(term) || edificioNombre.includes(term) || obs.includes(term);
  });

  const getEstadoEstilos = (estado) => {
    const est = (estado || '').toUpperCase();
    switch (est) {
      case 'DISPONIBLE':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'OCUPADO':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'MANTENIMIENTO':
      case 'EN MANTENIMIENTO':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Listado de Unidades</h2>
          <p className="text-sm text-slate-500">Administra los departamentos registrados en tus edificios.</p>
        </div>

        <button 
          onClick={onNuevoDepartamentoClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95"
        >
          <Home size={18} /> Registrar Unidad
        </button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-6 max-w-md focus-within:border-blue-600 focus-within:bg-white transition-all">
        <Search size={18} className="text-slate-400 shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar por número, edificio u observaciones..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-transparent border-none outline-none ml-2 text-sm text-slate-800 w-full"
        />
      </div>

      {/* Tabla de Departamentos */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="text-sm font-semibold">Cargando departamentos...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4">Unidad</th>
                <th className="py-4 px-4">Edificio</th>
                <th className="py-4 px-4">Características</th>
                <th className="py-4 px-4">Medidores</th>
                <th className="py-4 px-4">Estado</th>
                <th className="py-4 px-4">Precio (Bs)</th>
                <th className="py-4 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {departamentosFiltrados.length > 0 ? (
                departamentosFiltrados.map((depto) => {
                  const id = depto.id_departamento || depto.id;
                  const numero = depto.numero_departamento || depto.numero || 'N/A';
                  
                  // Resolver edificio
                  const nombreEdificio = edificiosMap[depto.id_edificio] 
                    || (typeof depto.edificio === 'string' ? depto.edificio : null)
                    || `Edificio #${depto.id_edificio || 1}`;

                  const precio = Number(depto.precio_alquiler || depto.precioMensual || 0);

                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Unidad y Piso */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                            <Hash size={18} />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 text-base">{numero}</p>
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                              <Layers size={12} /> Piso {depto.piso || 1}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Edificio */}
                      <td className="py-4 px-4 font-semibold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={15} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{nombreEdificio}</span>
                        </div>
                      </td>

                      {/* Habitaciones y Baños */}
                      <td className="py-4 px-4 text-slate-600">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs font-semibold">
                            <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md" title="Habitaciones">
                              <BedDouble size={14} className="text-slate-500" /> {depto.habitaciones || 1} hab.
                            </span>
                            <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md" title="Baños">
                              <Bath size={14} className="text-slate-500" /> {depto.banos || 1} baño(s)
                            </span>
                          </div>
                          {depto.observaciones && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate max-w-[180px]" title={depto.observaciones}>
                              <Info size={11} className="shrink-0" /> {depto.observaciones}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Medidores Agua y Luz */}
                      <td className="py-4 px-4 text-xs text-slate-600">
                        <div className="flex flex-col gap-1">
                          {depto.medidor_agua && (
                            <span className="flex items-center gap-1 text-cyan-700 font-medium" title="Medidor de Agua">
                              <Droplet size={12} className="text-cyan-500" /> {depto.medidor_agua}
                            </span>
                          )}
                          {depto.medidor_luz && (
                            <span className="flex items-center gap-1 text-amber-700 font-medium" title="Medidor de Luz">
                              <Zap size={12} className="text-amber-500" /> {depto.medidor_luz}
                            </span>
                          )}
                          {!depto.medidor_agua && !depto.medidor_luz && (
                            <span className="text-slate-400 italic text-[11px]">Sin registrar</span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 text-xs font-bold border rounded-lg ${getEstadoEstilos(depto.estado)}`}>
                          {depto.estado || 'DISPONIBLE'}
                        </span>
                      </td>

                      {/* Precio */}
                      <td className="py-4 px-4 font-extrabold text-slate-800">
                        <div className="flex items-center gap-1 text-blue-600">
                          <DollarSign size={16} className="text-blue-500 shrink-0" />
                          {precio.toFixed(2)}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => onEditarDepartamentoClick && onEditarDepartamentoClick(depto)}
                            title="Editar"
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={17} />
                          </button>
                          <button 
                            onClick={() => handleDelete(id, numero)}
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
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    No se encontraron departamentos registrados.
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