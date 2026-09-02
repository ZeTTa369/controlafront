import { useState, useEffect } from 'react';
import { Building2, MapPin, Edit2, Trash2, Search, Loader2, Plus, Home, Compass } from 'lucide-react';
import toast from 'react-hot-toast';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';

export function ListadoEdificios({ onNuevoEdificioClick, onEditarEdificioClick }) {
  const [edificios, setEdificios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEdificios();
  }, []);

  const cargarEdificios = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/edificios`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response);
      setEdificios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando edificios:', error);
      toast.error('No se pudo cargar la lista de edificios');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar el edificio "${nombre}"?`)) return;

    const toastId = toast.loading('Eliminando edificio...');

    try {
      const response = await fetch(`${BASE_URL}/edificios/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar el registro en el servidor');
      }

      toast.success('Edificio eliminado correctamente', { id: toastId });
      setEdificios(prev => prev.filter(e => (e.id_edificio || e.id)?.toString() !== id.toString()));
    } catch (error) {
      toast.error(error.message || 'Error al eliminar edificio', { id: toastId });
    }
  };

  const edificiosFiltrados = edificios.filter(edificio => {
    const term = busqueda.toLowerCase().trim();
    const nombre = (edificio.nombre || '').toLowerCase();
    const ciudad = (edificio.ciudad || '').toLowerCase();
    const provincia = (edificio.provincia || '').toLowerCase();
    const direccion = (edificio.direccion || '').toLowerCase();
    return nombre.includes(term) || ciudad.includes(term) || provincia.includes(term) || direccion.includes(term);
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-fade-in">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Listado de Edificios</h2>
          <p className="text-sm text-slate-500">Supervisa las unidades registradas, disponibilidad y ubicación de cada complejo.</p>
        </div>

        <button 
          onClick={onNuevoEdificioClick}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus size={18} />
          Registrar Nuevo
        </button>
      </div>

      {/* Buscador */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-6 max-w-md focus-within:border-blue-600 focus-within:bg-white transition-all">
        <Search size={18} className="text-slate-400 shrink-0" />
        <input 
          type="text" 
          placeholder="Filtrar por nombre, ciudad, provincia o dirección..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-transparent border-none outline-none ml-2 text-sm text-slate-800 w-full placeholder:text-slate-400"
        />
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="text-sm font-semibold">Cargando complejos residenciales...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-200/80 text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4">Edificio</th>
                <th className="py-4 px-4">Ubicación / Geografía</th>
                <th className="py-4 px-4">Categoría</th>
                <th className="py-4 px-4">Disponibilidad de Departamentos</th>
                <th className="py-4 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {edificiosFiltrados.length > 0 ? (
                edificiosFiltrados.map((edificio) => {
                  const id = (edificio.id_edificio || edificio.id)?.toString();
                  const disponibles = edificio.disponibles ?? 0;
                  const ocupados = edificio.ocupados ?? 0;
                  const registrados = edificio.total_registrados ?? 0;
                  const capacidad = edificio.capacidad_declarada ?? edificio.total_departamentos ?? 0;

                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Nombre del edificio */}
                      <td className="py-4 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <span className="truncate max-w-xs block font-extrabold text-slate-900">{edificio.nombre}</span>
                            <span className="text-xs text-slate-400 font-medium">{edificio.direccion}</span>
                          </div>
                        </div>
                      </td>

                      {/* Ubicación y Provincia */}
                      <td className="py-4 px-4 text-slate-600">
                        <div className="flex items-center gap-1 text-slate-800 font-bold text-xs">
                          <MapPin size={14} className="text-blue-600 shrink-0" />
                          <span>{edificio.ciudad || 'No definida'}</span>
                        </div>
                        {edificio.provincia && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold mt-0.5 ml-4">
                            <Compass size={12} className="text-slate-400" /> Prov. {edificio.provincia}
                          </div>
                        )}
                      </td>

                      {/* Categoría */}
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200/50">
                          {edificio.estado || 'Lujo'}
                        </span>
                      </td>

                      {/* Relación de Disponibilidad */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-extrabold text-xs border border-emerald-200/60 flex items-center gap-1">
                            <Home size={12} /> {disponibles} Disp.
                          </span>
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs">
                            {ocupados} Ocup.
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-1">
                          {registrados} de {capacidad} depts. registrados
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => onEditarEdificioClick && onEditarEdificioClick(edificio)}
                            title="Editar"
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={17} />
                          </button>

                          <button 
                            onClick={() => handleDelete(id, edificio.nombre)}
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
                    No se encontraron edificios que coincidan con la búsqueda.
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