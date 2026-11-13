import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Edit2, 
  Trash2, 
  Receipt, 
  RefreshCw, 
  Plus, 
  Loader2, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  listarConceptos, 
  actualizarConcepto, 
  eliminarConcepto 
} from '../../services/conceptoService';
import { ModalEditarConcepto } from '../modals/ModalEditarConcepto';

const getPrioridadConcepto = (nombre = '') => {
  const n = nombre.toUpperCase();
  if (n.includes('ALQUILER') || n.includes('RENTA') || n.includes('CANON')) return 1;
  if (n.includes('EXPENSA')) return 2;
  if (n.includes('AGUA')) return 3;
  if (n.includes('LUZ') || n.includes('ELECTRIC')) return 4;
  return 5;
};

export function ListadoConceptos({ onNuevoConceptoClick, onEditarConceptoClick }) {
  const [conceptos, setConceptos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [tabEstado, setTabEstado] = useState('TODOS'); // 'TODOS' | 'ACTIVO' | 'INACTIVO'
  const [filtroRecurrencia, setFiltroRecurrencia] = useState('');

  // Modal de edicion de concepto
  const [conceptoAEditar, setConceptoAEditar] = useState(null);

  // Modal de confirmacion para desactivar / reactivar
  const [conceptoAccion, setConceptoAccion] = useState(null); // { concepto, tipo: 'DESACTIVAR' | 'REACTIVAR' }
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  useEffect(() => {
    cargarConceptos();
  }, []);

  const cargarConceptos = async () => {
    setLoading(true);
    try {
      const data = await listarConceptos();

      if (Array.isArray(data)) {
        const ordenados = [...data].sort((a, b) => {
          const pA = getPrioridadConcepto(a.nombre);
          const pB = getPrioridadConcepto(b.nombre);
          if (pA !== pB) return pA - pB;
          return (a.nombre || '').localeCompare(b.nombre || '');
        });
        setConceptos(ordenados);
      } else {
        setConceptos([]);
      }
    } catch (error) {
      console.error('Error cargando conceptos:', error);
      toast.error('No se pudieron cargar los conceptos del servidor');
      setConceptos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarCambioEstado = async () => {
    if (!conceptoAccion) return;
    const { concepto, tipo } = conceptoAccion;
    const id = concepto.id_concepto || concepto.id;
    const nuevoEstado = tipo === 'DESACTIVAR' ? 'INACTIVO' : 'ACTIVO';

    setProcesandoAccion(true);
    const toastId = toast.loading(
      tipo === 'DESACTIVAR' ? 'Desactivando concepto...' : 'Reactivando concepto...'
    );

    try {
      if (tipo === 'DESACTIVAR') {
        await eliminarConcepto(id);
      } else {
        await actualizarConcepto(id, { estado: 'ACTIVO' });
      }

      setConceptos((prev) =>
        prev.map((c) => ((c.id_concepto || c.id) === id ? { ...c, estado: nuevoEstado } : c))
      );

      toast.success(
        tipo === 'DESACTIVAR'
          ? 'Concepto desactivado correctamente'
          : 'Concepto reactivado correctamente',
        { id: toastId }
      );
      setConceptoAccion(null);
    } catch (error) {
      console.error('Error actualizando estado del concepto:', error);
      toast.error(error.message || 'No se pudo actualizar el estado del concepto', { id: toastId });
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleGuardarEdicion = (conceptoActualizado) => {
    const idAct = conceptoActualizado.id_concepto || conceptoActualizado.id;
    setConceptos((prev) =>
      prev
        .map((c) => ((c.id_concepto || c.id) === idAct ? { ...c, ...conceptoActualizado } : c))
        .sort((a, b) => {
          const pA = getPrioridadConcepto(a.nombre);
          const pB = getPrioridadConcepto(b.nombre);
          if (pA !== pB) return pA - pB;
          return (a.nombre || '').localeCompare(b.nombre || '');
        })
    );
  };

  const stats = useMemo(() => {
    const total = conceptos.length;
    const activos = conceptos.filter((c) => (c.estado || 'ACTIVO').toUpperCase() === 'ACTIVO').length;
    const inactivos = total - activos;
    return { total, activos, inactivos };
  }, [conceptos]);

  const conceptosFiltrados = useMemo(() => {
    return conceptos.filter((concepto) => {
      const term = busqueda.toLowerCase().trim();
      const nombre = (concepto.nombre || '').toLowerCase();
      const recurrente = (concepto.recurrente || '').toLowerCase();
      const desc = (concepto.descripcion || '').toLowerCase();
      const estado = (concepto.estado || 'ACTIVO').toUpperCase();

      const coincideTexto = !term || nombre.includes(term) || recurrente.includes(term) || desc.includes(term);
      const coincideEstado = tabEstado === 'TODOS' || estado === tabEstado;
      const coincideRecurrencia =
        !filtroRecurrencia || (concepto.recurrente || 'Mensual').toLowerCase() === filtroRecurrencia.toLowerCase();

      return coincideTexto && coincideEstado && coincideRecurrencia;
    });
  }, [conceptos, busqueda, tabEstado, filtroRecurrencia]);

  const getRecurrenciaBadge = (recurrente = 'Mensual') => {
    const r = recurrente.toLowerCase();
    if (r.includes('unico') || r.includes('único')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (r.includes('anual')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-fade-in relative">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Catalogo de Conceptos de Cobro</h2>
          <p className="text-sm text-slate-500">
            Administra los rubros de alquiler, expensas, servicios basicos y cargos extraordinarios.
          </p>
        </div>

        <button
          type="button"
          onClick={onNuevoConceptoClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          <Plus size={18} /> Registrar Concepto
        </button>
      </div>

      {/* Metricas rapidas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Rubros</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Activos</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stats.activos}</p>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Inactivos</span>
          <p className="text-2xl font-black text-slate-600 mt-1">{stats.inactivos}</p>
        </div>
      </div>

      {/* Barra de busqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
          <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-blue-600 focus-within:bg-white transition-all">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por nombre o descripcion..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="bg-transparent border-none outline-none ml-2 text-sm text-slate-800 w-full placeholder:text-slate-400"
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

          <select
            value={filtroRecurrencia}
            onChange={(e) => setFiltroRecurrencia(e.target.value)}
            className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
          >
            <option value="">Todas las recurrencias</option>
            <option value="Mensual">Mensual</option>
            <option value="Anual">Anual</option>
            <option value="Pago Único">Pago Unico</option>
          </select>
        </div>

        {/* Tabs de estado */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setTabEstado('TODOS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tabEstado === 'TODOS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Todos ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setTabEstado('ACTIVO')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tabEstado === 'ACTIVO' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-600'
            }`}
          >
            Activos ({stats.activos})
          </button>
          <button
            type="button"
            onClick={() => setTabEstado('INACTIVO')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tabEstado === 'INACTIVO' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Inactivos ({stats.inactivos})
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto border border-slate-100 rounded-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="text-sm font-semibold">Cargando catalogo de conceptos...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Concepto</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Descripcion</th>
                <th className="py-3.5 px-4">Recurrencia</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {conceptosFiltrados.length > 0 ? (
                conceptosFiltrados.map((concepto) => {
                  const id = concepto.id_concepto || concepto.id;
                  const esActivo = (concepto.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';

                  return (
                    <tr
                      key={id}
                      className={`transition-colors ${
                        esActivo ? 'hover:bg-slate-50/80' : 'bg-slate-50/40 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2.5 rounded-xl shrink-0 ${
                              esActivo ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <Receipt size={18} />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-800 text-sm block">
                              {concepto.nombre}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium md:hidden block truncate max-w-[200px]">
                              {concepto.descripcion || 'Sin descripcion'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td
                        className="py-4 px-4 text-slate-500 font-medium hidden md:table-cell max-w-xs truncate text-xs"
                        title={concepto.descripcion}
                      >
                        {concepto.descripcion || 'Sin descripcion'}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold border px-2.5 py-1 rounded-lg ${getRecurrenciaBadge(
                            concepto.recurrente || 'Mensual'
                          )}`}
                        >
                          <RefreshCw size={12} className="shrink-0" />
                          {concepto.recurrente || 'Mensual'}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-extrabold border rounded-lg ${
                            esActivo
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              esActivo ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {esActivo ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setConceptoAEditar(concepto);
                              if (onEditarConceptoClick) onEditarConceptoClick(concepto);
                            }}
                            title="Editar concepto"
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                          >
                            <Edit2 size={16} />
                          </button>

                          {esActivo ? (
                            <button
                              type="button"
                              onClick={() => setConceptoAccion({ concepto, tipo: 'DESACTIVAR' })}
                              title="Desactivar concepto"
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConceptoAccion({ concepto, tipo: 'REACTIVAR' })}
                              title="Reactivar concepto"
                              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-14 text-slate-400 text-sm font-medium">
                    No se encontraron conceptos que coincidan con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Edicion de Concepto */}
      <ModalEditarConcepto
        isOpen={Boolean(conceptoAEditar)}
        concepto={conceptoAEditar}
        onClose={() => setConceptoAEditar(null)}
        onSave={handleGuardarEdicion}
      />

      {/* Modal de confirmacion (Desactivar / Reactivar) */}
      {conceptoAccion && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-scale-up">
            <div
              className={`px-6 py-4 text-white flex items-center justify-between ${
                conceptoAccion.tipo === 'DESACTIVAR' ? 'bg-red-600' : 'bg-emerald-600'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {conceptoAccion.tipo === 'DESACTIVAR' ? (
                  <AlertTriangle size={20} />
                ) : (
                  <CheckCircle2 size={20} />
                )}
                <h3 className="font-extrabold text-base">
                  {conceptoAccion.tipo === 'DESACTIVAR' ? 'Desactivar Concepto' : 'Reactivar Concepto'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConceptoAccion(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                {conceptoAccion.tipo === 'DESACTIVAR' ? (
                  <>
                    ¿Confirmas que deseas desactivar el concepto{' '}
                    <strong className="text-slate-900">"{conceptoAccion.concepto.nombre}"</strong>? Dejara de
                    aparecer como opcion al registrar nuevos contratos, pero se mantendra en el historial de
                    cobros existentes.
                  </>
                ) : (
                  <>
                    ¿Deseas reactivar el concepto{' '}
                    <strong className="text-slate-900">"{conceptoAccion.concepto.nombre}"</strong> para que
                    vuelva a estar disponible en nuevos contratos?
                  </>
                )}
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConceptoAccion(null)}
                  disabled={procesandoAccion}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarCambioEstado}
                  disabled={procesandoAccion}
                  className={`px-5 py-2.5 text-white font-bold rounded-xl shadow-lg text-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer ${
                    conceptoAccion.tipo === 'DESACTIVAR'
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  {procesandoAccion ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Procesando...
                    </>
                  ) : conceptoAccion.tipo === 'DESACTIVAR' ? (
                    'Confirmar Desactivacion'
                  ) : (
                    'Confirmar Reactivacion'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}