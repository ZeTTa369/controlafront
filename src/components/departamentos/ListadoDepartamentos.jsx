import { useState, useEffect, useMemo } from 'react';
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
  Droplets,
  Zap,
  Info,
  Compass,
  Filter,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';

export function ListadoDepartamentos({ onNuevoDepartamentoClick, onEditarDepartamentoClick }) {
  const [departamentos, setDepartamentos] = useState([]);
  const [edificiosList, setEdificiosList] = useState([]);
  const [edificiosMap, setEdificiosMap] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [filtroEdificio, setFiltroEdificio] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [loading, setLoading] = useState(true);
  const [actualizandoId, setActualizandoId] = useState(null);

  useEffect(() => {
    inicializarDatos();
  }, []);

  const inicializarDatos = async () => {
    setLoading(true);
    try {
      const [resEdificios, resDeptos] = await Promise.all([
        fetch(`${BASE_URL}/edificios`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/departamentos`, { headers: getAuthHeaders() })
      ]);

      const dataEdificios = await handleResponse(resEdificios);
      const dataDeptos = await handleResponse(resDeptos);

      if (Array.isArray(dataEdificios)) {
        const mapa = {};
        const lista = [];
        dataEdificios.forEach(e => {
          const id = e.id_edificio || e.id;
          mapa[id] = e.nombre;
          lista.push({ id, nombre: e.nombre });
        });
        setEdificiosMap(mapa);
        setEdificiosList(lista);
      }

      if (Array.isArray(dataDeptos)) {
        setDepartamentos(dataDeptos);
      }
    } catch (error) {
      console.error('Error cargando departamentos:', error);
      toast.error('No se pudieron cargar los departamentos');
    } finally {
      setLoading(false);
    }
  };

  // Cambio rápido de estado en tiempo real (Disponible / Ocupado / Mantenimiento)
  const handleCambiarEstado = async (id, nuevoEstado) => {
    setActualizandoId(id);
    const toastId = toast.loading('Actualizando estado...');

    try {
      const response = await fetch(`${BASE_URL}/departamentos/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!response.ok) throw new Error('Error al actualizar en el servidor');

      setDepartamentos(prev => prev.map(d => {
        const dId = d.id_departamento || d.id;
        return dId === id ? { ...d, estado: nuevoEstado } : d;
      }));

      toast.success(`Unidad marcada como ${nuevoEstado}`, { id: toastId });
    } catch (error) {
      toast.error(error.message || 'Error al cambiar estado', { id: toastId });
    } finally {
      setActualizandoId(null);
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

      if (!response.ok) throw new Error('Error al eliminar en la API');

      toast.success('Departamento eliminado correctamente', { id: toastId });
      setDepartamentos(prev => prev.filter(d => (d.id_departamento || d.id) !== id));
    } catch (error) {
      toast.error(error.message || 'Error al eliminar', { id: toastId });
    }
  };

  // Filtrado compuesto
  const departamentosFiltrados = useMemo(() => {
    return departamentos.filter((depto) => {
      const term = busqueda.toLowerCase().trim();
      const numero = String(depto.numero_departamento || depto.numero || '').toLowerCase();
      const tipo = (depto.tipo_inmueble || '').toLowerCase();
      const bloque = (depto.bloque || '').toLowerCase();
      const edId = depto.id_edificio;
      const edificioNombre = (edificiosMap[edId] || '').toLowerCase();
      const obs = (depto.observaciones || '').toLowerCase();

      // Filtro por Edificio
      if (filtroEdificio && String(depto.id_edificio) !== String(filtroEdificio)) {
        return false;
      }

      // Filtro por Estado
      if (filtroEstado && (depto.estado || 'DISPONIBLE').toUpperCase() !== filtroEstado.toUpperCase()) {
        return false;
      }

      if (!term) return true;

      return (
        numero.includes(term) ||
        tipo.includes(term) ||
        bloque.includes(term) ||
        edificioNombre.includes(term) ||
        obs.includes(term)
      );
    });
  }, [departamentos, busqueda, filtroEdificio, filtroEstado, edificiosMap]);

  const renderMedidor = (valor, tipo) => {
    const v = (valor || 'NO_TIENE').toUpperCase();
    const esAgua = tipo === 'agua';
    const Icono = esAgua ? Droplets : Zap;
    const colorClass = esAgua ? 'text-blue-500' : 'text-amber-500';

    if (v === 'INDEPENDIENTE') {
      return (
        <span className="flex items-center gap-1 text-xs font-semibold text-slate-700" title={`Medidor de ${tipo} independiente`}>
          <Icono size={13} className={colorClass} /> Indep.
        </span>
      );
    }
    if (v === 'COMPARTIDO') {
      return (
        <span className="flex items-center gap-1 text-xs font-semibold text-slate-500" title={`Medidor de ${tipo} compartido`}>
          <Icono size={13} className={colorClass} /> Compart.
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs text-slate-400" title={`Sin medidor de ${tipo}`}>
        <Icono size={13} className="text-slate-300" /> No tiene
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-fade-in">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Listado de Unidades / Departamentos</h2>
          <p className="text-sm text-slate-500">Supervisa la disponibilidad, medidores y características de cada inmueble.</p>
        </div>

        <button 
          onClick={onNuevoDepartamentoClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95"
        >
          <Home size={18} /> Registrar Unidad
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {/* Buscador */}
        <div className="sm:col-span-2 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-blue-600 focus-within:bg-white transition-all">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar por número, bloque, tipo u observaciones..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-transparent border-none outline-none ml-2 text-sm text-slate-800 w-full"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filtro Edificio */}
        <div className="relative flex items-center">
          <Building2 size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
          <select
            value={filtroEdificio}
            onChange={(e) => setFiltroEdificio(e.target.value)}
            className="w-full py-2.5 pl-11 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 focus:bg-white appearance-none cursor-pointer"
          >
            <option value="">Todos los Edificios</option>
            {edificiosList.map(ed => (
              <option key={ed.id} value={ed.id}>{ed.nombre}</option>
            ))}
          </select>
        </div>

        {/* Filtro Estado */}
        <div className="relative flex items-center">
          <Filter size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full py-2.5 pl-11 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 focus:bg-white appearance-none cursor-pointer"
          >
            <option value="">Todos los Estados</option>
            <option value="DISPONIBLE">Disponibles</option>
            <option value="OCUPADO">Ocupados</option>
            <option value="MANTENIMIENTO">En Mantenimiento</option>
          </select>
        </div>
      </div>

      {/* Tabla de Departamentos */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="text-sm font-semibold">Cargando departamentos...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4">Unidad / Bloque</th>
                <th className="py-4 px-4">Edificio</th>
                <th className="py-4 px-4">Tipo / Ambiente</th>
                <th className="py-4 px-4">Medidores</th>
                <th className="py-4 px-4">Estado / Disponibilidad</th>
                <th className="py-4 px-4">Precio (Bs)</th>
                <th className="py-4 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {departamentosFiltrados.length > 0 ? (
                departamentosFiltrados.map((depto) => {
                  const id = depto.id_departamento || depto.id;
                  const numero = depto.numero_departamento || depto.numero || 'N/A';
                  const nombreEdificio = edificiosMap[depto.id_edificio] || `Edificio #${depto.id_edificio || 1}`;
                  const precio = Number(depto.precio_alquiler || 0);
                  const estadoActual = (depto.estado || 'DISPONIBLE').toUpperCase();
                  const bloque = depto.bloque || 'FRONTAL';

                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Unidad, Piso y Bloque */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                            <Hash size={18} />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 text-base">{numero}</p>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                              <span className="flex items-center gap-0.5">
                                <Layers size={12} className="text-slate-400" /> Piso {depto.piso || 1}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-blue-600 font-semibold">
                                <Compass size={12} /> Bloque {bloque}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Edificio */}
                      <td className="py-4 px-4 font-semibold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={15} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{nombreEdificio}</span>
                        </div>
                      </td>

                      {/* Tipo de Inmueble y Ambientes */}
                      <td className="py-4 px-4 text-slate-600">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-bold block w-max mb-1">
                          {depto.tipo_inmueble || 'DEPARTAMENTO'}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <BedDouble size={13} className="text-slate-400" /> {depto.habitaciones || 1} hab.
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Bath size={13} className="text-slate-400" /> {depto.banos || 1} bñ.
                          </span>
                        </div>
                      </td>

                      {/* Medidores */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          {renderMedidor(depto.medidor_agua, 'agua')}
                          {renderMedidor(depto.medidor_luz, 'luz')}
                        </div>
                      </td>

                      {/* Switch Rápido de Estado / Disponibilidad */}
                      <td className="py-4 px-4">
                        <select
                          disabled={actualizandoId === id}
                          value={estadoActual}
                          onChange={(e) => handleCambiarEstado(id, e.target.value)}
                          className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border outline-none cursor-pointer transition-all ${
                            estadoActual === 'DISPONIBLE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : estadoActual === 'OCUPADO'
                              ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                              : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                          } disabled:opacity-50`}
                        >
                          <option value="DISPONIBLE">● DISPONIBLE</option>
                          <option value="OCUPADO">● OCUPADO</option>
                          <option value="MANTENIMIENTO">● MANTENIMIENTO</option>
                        </select>
                      </td>

                      {/* Precio */}
                      <td className="py-4 px-4 font-extrabold text-slate-800">
                        <div className="flex items-center gap-0.5 text-blue-600">
                          <DollarSign size={15} className="text-blue-500 shrink-0" />
                          {precio.toFixed(2)}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
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