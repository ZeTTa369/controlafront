import { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Trash2, 
  Home, 
  Users, 
  Calendar, 
  DollarSign, 
  Plus,
  Loader2,
  Printer,
  Eye,
  X,
  Building,
  ShieldCheck,
  CreditCard,
  UserCheck
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
  const [filtroEdificio, setFiltroEdificio] = useState('');
  const [loading, setLoading] = useState(true);

  // Mapeos relacionales
  const [deptosMap, setDeptosMap] = useState({});
  const [edificiosList, setEdificiosList] = useState([]);
  const [edificiosMap, setEdificiosMap] = useState({});
  const [usuariosMap, setUsuariosMap] = useState({});
  const [usuariosRawMap, setUsuariosRawMap] = useState({});
  const [deptosRawMap, setDeptosRawMap] = useState({});

  // Modal de Detalle
  const [contratoSeleccionado, setContratoSeleccionado] = useState(null);

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
      const listEd = [];
      if (Array.isArray(dataEdificios)) {
        dataEdificios.forEach(e => {
          const idEd = e.id_edificio || e.id;
          mapEd[idEd] = e.nombre;
          listEd.push({ id: idEd, nombre: e.nombre });
        });
      }
      setEdificiosMap(mapEd);
      setEdificiosList(listEd);

      // 2. Mapa de Departamentos
      const mapDep = {};
      const rawDep = {};
      if (Array.isArray(dataDeptos)) {
        dataDeptos.forEach(d => {
          const idDep = d.id_departamento || d.id;
          const edNombre = mapEd[d.id_edificio] || 'Edificio';
          const num = d.numero_departamento || d.numero || 'S/N';
          const piso = d.piso || 1;
          mapDep[idDep] = `${edNombre} - Piso ${piso} Depto ${num}`;
          rawDep[idDep] = { ...d, edNombre };
        });
      }
      setDeptosMap(mapDep);
      setDeptosRawMap(rawDep);

      // 3. Mapa de Usuarios / Inquilinos
      const mapUsr = {};
      const rawUsr = {};
      if (Array.isArray(dataUsers)) {
        dataUsers.forEach(u => {
          const idUsr = u.id_usuario || u.id;
          const nombreComp = `${u.nombre || ''} ${u.primer_apellido || ''} ${u.segundo_apellido || ''}`.trim();
          const ci = u.ci_nit ? ` (CI: ${u.ci_nit})` : '';
          mapUsr[idUsr] = `${nombreComp}${ci}`;
          rawUsr[idUsr] = u;
        });
      }
      setUsuariosMap(mapUsr);
      setUsuariosRawMap(rawUsr);

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
      if (contratoSeleccionado && (contratoSeleccionado.id_contrato || contratoSeleccionado.id) === id) {
        setContratoSeleccionado(null);
      }
    } catch (error) {
      toast.error(error.message || 'Error al eliminar contrato', { id: toastId });
    }
  };

  // Filtrado compuesto por Edificio y Buscador general
  const contratosFiltrados = useMemo(() => {
    return contratos.filter((c) => {
      const term = busqueda.toLowerCase().trim();
      const deptoNombre = deptosMap[c.id_departamento] || c.departamentoNombre || '';
      const inquilinoNombre = usuariosMap[c.id_usuario] || c.inquilinoNombre || '';
      const deptoObj = deptosRawMap[c.id_departamento];

      // Filtro por edificio
      if (filtroEdificio && deptoObj) {
        if (String(deptoObj.id_edificio) !== String(filtroEdificio)) {
          return false;
        }
      }

      if (!term) return true;

      return (
        deptoNombre.toLowerCase().includes(term) ||
        inquilinoNombre.toLowerCase().includes(term)
      );
    });
  }, [contratos, busqueda, filtroEdificio, deptosMap, usuariosMap, deptosRawMap]);

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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-fade-in relative">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Listado de Contratos</h2>
          <p className="text-sm text-slate-500">Administra los acuerdos vigentes, consulta detalles y descarga copias</p>
        </div>

        <button 
          onClick={onNuevoContratoClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95"
        >
          <Plus size={18} /> Registrar Contrato
        </button>
      </div>

      {/* Barra de Filtros (Buscador + Filtro Edificio) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Buscador de Inquilino / Depto */}
        <div className="sm:col-span-2 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-blue-600 focus-within:bg-white transition-all">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar por inquilino, CI, piso o número de depto..." 
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
          <Building size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
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
                <th className="py-4 px-4">Piso y Depto / Inquilino</th>
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
                        <div className="flex items-center justify-end gap-1">
                          {/* BOTÓN 1: VER DETALLE COMPLETO */}
                          <button 
                            onClick={() => setContratoSeleccionado(contrato)}
                            title="Ver Detalle del Contrato"
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye size={17} />
                          </button>

                          {/* BOTÓN 2: IMPRIMIR / PDF */}
                          <button 
                            onClick={() => onVerDocumentoClick && onVerDocumentoClick(contrato)}
                            title="Ver Documento Legal"
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Printer size={17} />
                          </button>

                          {/* BOTÓN 3: ELIMINAR */}
                          <button 
                            onClick={() => handleDelete(id)}
                            title="Eliminar Contrato"
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
                    No se encontraron contratos con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= MODAL DE DETALLE COMPLETO DEL CONTRATO ================= */}
      {contratoSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-scale-up">
            
            {/* Cabecera del Modal */}
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl text-white">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold">Detalle del Contrato de Alquiler</h3>
                  <p className="text-xs text-slate-400">
                    ID #{contratoSeleccionado.id_contrato || contratoSeleccionado.id} • Estado: {contratoSeleccionado.estado || 'DIRECTO'}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setContratoSeleccionado(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido del Detalle */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-sm">
              
              {/* 1. Datos del Inquilino */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <UserCheck size={15} className="text-blue-600" /> Información del Inquilino
                </h4>
                {(() => {
                  const u = usuariosRawMap[contratoSeleccionado.id_usuario] || {};
                  return (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Nombre Completo:</span>
                        <p className="font-extrabold text-slate-800 text-sm">
                          {`${u.nombre || ''} ${u.primer_apellido || ''} ${u.segundo_apellido || ''}`.trim() || 'Inquilino Registrado'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Cédula de Identidad / NIT:</span>
                        <p className="font-bold text-slate-800">{u.ci_nit || 'No registrado'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Teléfono / Celular:</span>
                        <p className="font-semibold text-slate-800">{u.telefono || 'Sin teléfono'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Correo Electrónico:</span>
                        <p className="font-semibold text-slate-800">{u.email || 'Sin correo'}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 2. Inmueble y Vigencia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Home size={15} className="text-blue-600" /> Ubicación
                  </h4>
                  <p className="font-bold text-slate-800">
                    {deptosMap[contratoSeleccionado.id_departamento] || 'Departamento'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Tipo de Contrato: <strong className="text-slate-700">{contratoSeleccionado.estado || 'DIRECTO'}</strong>
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar size={15} className="text-blue-600" /> Vigencia y Plazo
                  </h4>
                  <p className="font-bold text-slate-800 text-xs">
                    Inicio: {formatFechaDMY(contratoSeleccionado.fecha_inicio)}
                  </p>
                  <p className="font-bold text-slate-800 text-xs">
                    Finalización: {formatFechaDMY(contratoSeleccionado.fecha_fin)}
                  </p>
                </div>
              </div>

              {/* 3. Desglose de Condiciones Financieras (Orden Estricto) */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CreditCard size={15} className="text-blue-600" /> Condiciones Financieras y Servicios
                </h4>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="font-semibold text-slate-700">1. Depósito de Garantía (Custodia):</span>
                    <span className="font-extrabold text-slate-900">
                      {Number(contratoSeleccionado.garantia || 0).toFixed(2)} {contratoSeleccionado.moneda || 'BOB'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="font-semibold text-slate-700">2. Alquiler / Renta Mensual (Canon):</span>
                    <span className="font-extrabold text-blue-600">
                      {Number(contratoSeleccionado.monto_renta || 0).toFixed(2)} {contratoSeleccionado.moneda || 'BOB'}
                    </span>
                  </div>
                </div>

                {/* Resumen Total Recurrente */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-xs uppercase text-blue-900">Total Mensual Recurrente:</span>
                  <span className="text-base font-black text-blue-900">
                    {Number(contratoSeleccionado.monto_renta || 0).toFixed(2)} {contratoSeleccionado.moneda || 'BOB'} / mes
                  </span>
                </div>
              </div>

            </div>

            {/* Pie del Modal */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setContratoSeleccionado(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors uppercase tracking-wider"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onVerDocumentoClick) onVerDocumentoClick(contratoSeleccionado);
                  setContratoSeleccionado(null);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2"
              >
                <Printer size={15} /> Ver / Imprimir Documento Legal
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}