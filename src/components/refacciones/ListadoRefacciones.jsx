import { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, 
  Search, 
  Trash2, 
  Building2, 
  Home, 
  Calendar, 
  DollarSign, 
  Plus, 
  AlertTriangle,
  UserCheck,
  Loader2,
  Eye,
  X,
  Hammer,
  PackageCheck,
  CheckCircle2,
  Clock,
  Filter
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

export function ListadoRefacciones({ onNuevaRefaccionClick }) {
  const [refacciones, setRefacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEdificio, setFiltroEdificio] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Mapeos relacionales
  const [edificiosList, setEdificiosList] = useState([]);
  const [edificiosMap, setEdificiosMap] = useState({});
  const [deptosMap, setDeptosMap] = useState({});

  // Modal de Detalle / Cambio de Estado
  const [refaccionSeleccionada, setRefaccionSeleccionada] = useState(null);
  const [actualizandoEstado, setActualizandoEstado] = useState(false);

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    setLoading(true);
    try {
      const [resRefacciones, resEdificios, resDeptos] = await Promise.all([
        fetch(`${BASE_URL}/refacciones`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/edificios`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/departamentos`, { headers: getAuthHeaders() }),
      ]);

      const dataRefacciones = await handleResponse(resRefacciones);
      const dataEdificios = await handleResponse(resEdificios);
      const dataDeptos = await handleResponse(resDeptos);

      // 1. Mapa de Edificios
      const mapEd = {};
      const listEd = [];
      if (Array.isArray(dataEdificios)) {
        dataEdificios.forEach(e => {
          const id = e.id_edificio || e.id;
          mapEd[id] = e.nombre;
          listEd.push({ id, nombre: e.nombre });
        });
      }
      setEdificiosMap(mapEd);
      setEdificiosList(listEd);

      // 2. Mapa de Departamentos
      const mapDep = {};
      if (Array.isArray(dataDeptos)) {
        dataDeptos.forEach(d => {
          const id = d.id_departamento || d.id;
          const num = d.numero_departamento || d.numero || 'S/N';
          const piso = d.piso || 1;
          mapDep[id] = `Piso ${piso} Depto ${num}`;
        });
      }
      setDeptosMap(mapDep);

      // 3. Refacciones
      if (Array.isArray(dataRefacciones)) {
        setRefacciones(dataRefacciones);
      }
    } catch (error) {
      console.error('Error cargando refacciones:', error);
      toast.error('No se pudieron cargar las refacciones');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro de refacción?')) return;

    const toastId = toast.loading('Eliminando refacción...');
    try {
      const response = await fetch(`${BASE_URL}/refacciones/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Error al eliminar en el servidor');

      toast.success('Refacción eliminada exitosamente', { id: toastId });
      setRefacciones(prev => prev.filter(r => (r.id_refaccion || r.id) !== id));
      if (refaccionSeleccionada && (refaccionSeleccionada.id_refaccion || refaccionSeleccionada.id) === id) {
        setRefaccionSeleccionada(null);
      }
    } catch (error) {
      toast.error(error.message || 'Error al eliminar', { id: toastId });
    }
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    if (!refaccionSeleccionada) return;
    const id = refaccionSeleccionada.id_refaccion || refaccionSeleccionada.id;

    setActualizandoEstado(true);
    const toastId = toast.loading('Actualizando estado...');
    try {
      const res = await fetch(`${BASE_URL}/refacciones/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const dataActualizada = await handleResponse(res);

      setRefacciones(prev => prev.map(r => ((r.id_refaccion || r.id) === id ? { ...r, estado: nuevoEstado } : r)));
      setRefaccionSeleccionada(prev => ({ ...prev, estado: nuevoEstado }));
      toast.success(`Estado actualizado a: ${nuevoEstado}`, { id: toastId });
    } catch (error) {
      toast.error(error.message || 'Error al actualizar estado', { id: toastId });
    } finally {
      setActualizandoEstado(false);
    }
  };

  // Filtrado compuesto (Búsqueda + Edificio + Estado)
  const refaccionesFiltradas = useMemo(() => {
    return refacciones.filter(r => {
      const term = busqueda.toLowerCase().trim();
      const nombreEdificio = edificiosMap[r.id_edificio] || r.edificio || '';
      const nombreDepto = r.id_departamento ? deptosMap[r.id_departamento] || '' : 'Área Común';
      const titulo = r.titulo || '';
      const proveedor = r.proveedor || r.proveedor_encargado || '';
      const tipo = r.tipo || '';

      // Filtro por Edificio
      if (filtroEdificio && String(r.id_edificio) !== String(filtroEdificio)) {
        return false;
      }

      // Filtro por Estado
      if (filtroEstado && (r.estado || '').toUpperCase() !== filtroEstado.toUpperCase()) {
        return false;
      }

      if (!term) return true;

      return (
        titulo.toLowerCase().includes(term) ||
        nombreEdificio.toLowerCase().includes(term) ||
        nombreDepto.toLowerCase().includes(term) ||
        proveedor.toLowerCase().includes(term) ||
        tipo.toLowerCase().includes(term)
      );
    });
  }, [refacciones, busqueda, filtroEdificio, filtroEstado, edificiosMap, deptosMap]);

  // Estilos según el estado del trabajo
  const getEstadoEstilos = (estado) => {
    const est = (estado || '').toUpperCase();
    switch (est) {
      case 'COMPLETADO': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'EN PROCESO':
      case 'EN_PROCESO': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PENDIENTE': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CANCELADO': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Estilos según nivel de prioridad
  const getPrioridadBadge = (prioridad) => {
    const pri = (prioridad || '').toUpperCase();
    switch (pri) {
      case 'URGENTE': return 'bg-red-100 text-red-700 font-extrabold';
      case 'ALTA': return 'bg-orange-100 text-orange-700 font-bold';
      case 'MEDIA': return 'bg-slate-100 text-slate-700 font-semibold';
      case 'BAJA': return 'bg-slate-50 text-slate-500 font-medium';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-fade-in relative">
      
      {/* Cabecera de la sección */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Listado de Refacciones y Mantenimientos</h2>
          <p className="text-sm text-slate-500">Supervisa las órdenes de trabajo, proveedores y costos asociados.</p>
        </div>

        <button 
          onClick={onNuevaRefaccionClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95"
        >
          <Plus size={18} /> Nueva Refacción
        </button>
      </div>

      {/* Barra de Filtros (Buscador + Edificio + Estado) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {/* Buscador */}
        <div className="sm:col-span-2 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-blue-600 focus-within:bg-white transition-all">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar por título, tipo, técnico o depto..." 
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

        {/* Filtro por Edificio */}
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

        {/* Filtro por Estado */}
        <div className="relative flex items-center">
          <Filter size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full py-2.5 pl-11 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 focus:bg-white appearance-none cursor-pointer"
          >
            <option value="">Todos los Estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN PROCESO">En Proceso</option>
            <option value="COMPLETADO">Completado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Tabla de Refacciones */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="text-sm font-semibold">Cargando refacciones y mantenimientos...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4">Refacción / Ubicación</th>
                <th className="py-4 px-4">Prioridad / Tipo</th>
                <th className="py-4 px-4">Costos (M.O. / Material / Total)</th>
                <th className="py-4 px-4">Encargado / Fecha</th>
                <th className="py-4 px-4">Estado</th>
                <th className="py-4 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {refaccionesFiltradas.length > 0 ? (
                refaccionesFiltradas.map((item) => {
                  const id = item.id_refaccion || item.id;
                  const nombreEdificio = edificiosMap[item.id_edificio] || item.edificio || 'Edificio';
                  const nombreDepto = item.id_departamento 
                    ? (deptosMap[item.id_departamento] || `Depto #${item.id_departamento}`)
                    : 'Área Común';

                  const manoObra = Number(item.costo_mano_obra || 0);
                  const material = Number(item.costo_material || 0);
                  const total = Number(item.costo_total || (manoObra + material));
                  const moneda = item.moneda || 'BOB';

                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Refacción y Ubicación */}
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0 mt-1">
                            <Wrench size={18} />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 text-sm">{item.titulo}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                              <span className="flex items-center gap-1">
                                <Building2 size={12} className="text-slate-400 shrink-0" /> {nombreEdificio}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-blue-600 font-semibold">
                                <Home size={12} className="shrink-0" /> {nombreDepto}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Prioridad y Tipo */}
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 text-xs rounded-md ${getPrioridadBadge(item.prioridad)}`}>
                          {item.prioridad || 'Media'}
                        </span>
                        <div className="text-xs text-slate-500 font-medium mt-1">
                          {item.tipo || 'General'}
                        </div>
                      </td>

                      {/* Costos Desglosados */}
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">
                          Total: {total.toFixed(2)} <span className="text-xs text-slate-400 font-bold">{moneda}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          M.O: {manoObra.toFixed(2)} • Mat: {material.toFixed(2)}
                        </div>
                      </td>

                      {/* Encargado y Fecha */}
                      <td className="py-4 px-4 text-slate-600">
                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <UserCheck size={13} className="text-slate-400 shrink-0" /> {item.proveedor || item.proveedor_encargado || 'Sin asignar'}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={11} className="shrink-0" /> {formatFechaDMY(item.fecha_solicitud || item.created_date)}
                        </p>
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 text-xs font-bold border rounded-lg ${getEstadoEstilos(item.estado)}`}>
                          {item.estado || 'Pendiente'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* BOTÓN VER DETALLE / CAMBIAR ESTADO */}
                          <button 
                            onClick={() => setRefaccionSeleccionada(item)}
                            title="Ver Detalle y Gestionar"
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye size={17} />
                          </button>

                          {/* BOTÓN ELIMINAR */}
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
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    No se encontraron refacciones o mantenimientos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= MODAL DE DETALLE Y CAMBIO DE ESTADO ================= */}
      {refaccionSeleccionada && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden animate-scale-up">
            
            {/* Cabecera */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <Wrench size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Detalle de la Refacción #{refaccionSeleccionada.id_refaccion || refaccionSeleccionada.id}</h3>
                  <p className="text-xs text-slate-400">Tipo: {refaccionSeleccionada.tipo || 'General'} • Prioridad: {refaccionSeleccionada.prioridad || 'Media'}</p>
                </div>
              </div>

              <button 
                onClick={() => setRefaccionSeleccionada(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-5 text-sm max-h-[75vh] overflow-y-auto">
              
              {/* Título y Ubicación */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trabajo / Avería</span>
                <p className="text-base font-black text-slate-800 mt-0.5">{refaccionSeleccionada.titulo}</p>
                
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500">Edificio:</span>
                    <p className="font-bold text-slate-800">
                      {edificiosMap[refaccionSeleccionada.id_edificio] || refaccionSeleccionada.edificio || 'Edificio'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Ubicación específica:</span>
                    <p className="font-bold text-blue-600">
                      {refaccionSeleccionada.id_departamento 
                        ? (deptosMap[refaccionSeleccionada.id_departamento] || `Depto #${refaccionSeleccionada.id_departamento}`) 
                        : 'Área Común'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {refaccionSeleccionada.descripcion && (
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción del Detalle</span>
                  <p className="mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-xs leading-relaxed">
                    {refaccionSeleccionada.descripcion}
                  </p>
                </div>
              )}

              {/* Desglose de Costos */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
                  Desglose Financiero
                </span>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-bold block">Mano de Obra</span>
                    <p className="font-extrabold text-slate-800 text-sm mt-0.5">
                      {Number(refaccionSeleccionada.costo_mano_obra || 0).toFixed(2)} {refaccionSeleccionada.moneda || 'BOB'}
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-bold block">Materiales</span>
                    <p className="font-extrabold text-slate-800 text-sm mt-0.5">
                      {Number(refaccionSeleccionada.costo_material || 0).toFixed(2)} {refaccionSeleccionada.moneda || 'BOB'}
                    </p>
                  </div>

                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                    <span className="text-[11px] text-blue-900 font-bold block">Costo Total</span>
                    <p className="font-black text-blue-900 text-sm mt-0.5">
                      {Number(refaccionSeleccionada.costo_total || 0).toFixed(2)} {refaccionSeleccionada.moneda || 'BOB'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Proveedor y Fechas */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Técnico / Proveedor:</span>
                  <p className="font-bold text-slate-800">{refaccionSeleccionada.proveedor || 'Sin asignar'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Fecha Solicitud:</span>
                  <p className="font-bold text-slate-800">{formatFechaDMY(refaccionSeleccionada.fecha_solicitud || refaccionSeleccionada.created_date)}</p>
                </div>
                {refaccionSeleccionada.fecha_inicio && (
                  <div>
                    <span className="text-slate-500">Fecha Inicio:</span>
                    <p className="font-semibold text-slate-700">{formatFechaDMY(refaccionSeleccionada.fecha_inicio)}</p>
                  </div>
                )}
                {refaccionSeleccionada.fecha_fin && (
                  <div>
                    <span className="text-slate-500">Fecha Finalización:</span>
                    <p className="font-semibold text-slate-700">{formatFechaDMY(refaccionSeleccionada.fecha_fin)}</p>
                  </div>
                )}
              </div>

              {/* Cambio Rápido de Estado */}
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Actualizar Estado de la Orden
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {['Pendiente', 'En Proceso', 'Completado', 'Cancelado'].map(st => {
                    const actual = (refaccionSeleccionada.estado || '').toUpperCase() === st.toUpperCase();
                    return (
                      <button
                        key={st}
                        type="button"
                        disabled={actualizandoEstado || actual}
                        onClick={() => handleCambiarEstado(st)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                          actual 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        } disabled:opacity-60`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Pie del modal */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setRefaccionSeleccionada(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}