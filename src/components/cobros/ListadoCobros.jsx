import { useState, useEffect } from 'react';
import { 
  Wallet, 
  Search, 
  FileText, 
  Calendar, 
  DollarSign, 
  Tag,
  CheckCircle2,
  Loader2,
  X,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function ListadoCobros() {
  const [cobros, setCobros] = useState([]);
  const [conceptosMap, setConceptosMap] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal para registrar pago
  const [cobroSeleccionado, setCobroSeleccionado] = useState(null);
  const [formPago, setFormPago] = useState({
    monto: '',
    metodo_pago: 'EFECTIVO',
    comprobante: ''
  });
  const [submittingPago, setSubmittingPago] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resCobros, resConceptos] = await Promise.all([
        fetch(`${BASE_URL}/cobros`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/conceptos`, { headers: getAuthHeaders() }).catch(() => null),
      ]);

      const dataCobros = await handleResponse(resCobros);

      // Mapa de Conceptos
      if (resConceptos && resConceptos.ok) {
        const dataConc = await handleResponse(resConceptos);
        if (Array.isArray(dataConc)) {
          const mapC = {};
          dataConc.forEach(c => {
            mapC[c.id_concepto || c.id] = c.nombre;
          });
          setConceptosMap(mapC);
        }
      }

      if (Array.isArray(dataCobros)) {
        setCobros(dataCobros);
      }
    } catch (error) {
      console.error('Error al cargar la lista de cobros:', error);
      toast.error('No se pudieron cargar los cobros desde el servidor');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalPago = (cobro) => {
    setCobroSeleccionado(cobro);
    setFormPago({
      monto: cobro.saldo_pendiente ?? cobro.monto,
      metodo_pago: 'EFECTIVO',
      comprobante: ''
    });
  };

  const handleConfirmarPago = async (e) => {
    e.preventDefault();
    if (!cobroSeleccionado) return;

    setSubmittingPago(true);
    const toastId = toast.loading('Registrando el pago...');

    try {
      const id = cobroSeleccionado.id_cobro;
      const response = await fetch(`${BASE_URL}/cobros/${id}/pagar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          monto: Number(formPago.monto),
          metodo_pago: formPago.metodo_pago,
          comprobante: formPago.comprobante || null
        }),
      });

      await handleResponse(response);
      toast.success('¡Pago registrado correctamente!', { id: toastId });
      setCobroSeleccionado(null);
      cargarDatos(); // Recargar cobros con nuevo saldo y estado
    } catch (error) {
      toast.error(error.message || 'Error al procesar el pago', { id: toastId });
    } finally {
      setSubmittingPago(false);
    }
  };

  const formatFecha = (f) => {
    if (!f) return 'N/A';
    try { return f.split('T')[0]; } catch (e) { return f; }
  };

  const cobrosFiltrados = cobros.filter(c => {
    const term = busqueda.toLowerCase();
    const desc = (c.descripcion || '').toLowerCase();
    const conc = (conceptosMap[c.id_concepto] || '').toLowerCase();
    const contratoId = String(c.id_contrato || '').toLowerCase();

    return desc.includes(term) || conc.includes(term) || contratoId.includes(term);
  });

  const getEstadoEstilos = (estado) => {
    const est = (estado || '').toUpperCase();
    switch (est) {
      case 'PAGADO':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'PENDIENTE':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'ANULADO':
      case 'VENCIDO':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-fade-in relative">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Listado de Cobros y Expensas</h2>
          <p className="text-sm text-slate-500">Administra las mensualidades autogeneradas y registra cobros.</p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-6 max-w-md focus-within:border-blue-600 focus-within:bg-white transition-all">
        <Search size={18} className="text-slate-400 shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar por concepto, descripción o contrato..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-transparent border-none outline-none ml-2 text-sm text-slate-800 w-full"
        />
      </div>

      {/* Tabla de Cobros */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="text-sm font-semibold">Cargando cuentas por cobrar...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4">Concepto / Contrato</th>
                <th className="py-4 px-4">Período</th>
                <th className="py-4 px-4">Monto / Saldo</th>
                <th className="py-4 px-4">Vencimiento</th>
                <th className="py-4 px-4">Estado</th>
                <th className="py-4 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {cobrosFiltrados.length > 0 ? (
                cobrosFiltrados.map((cobro) => {
                  const id = cobro.id_cobro;
                  const nombreConcepto = conceptosMap[cobro.id_concepto] || cobro.descripcion || 'Cobro de Alquiler';
                  const monto = Number(cobro.monto || 0);
                  const saldo = cobro.saldo_pendiente !== undefined ? Number(cobro.saldo_pendiente) : monto;

                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                            <Wallet size={18} />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                              <Tag size={13} className="text-slate-400 shrink-0" /> {nombreConcepto}
                            </p>
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                              <FileText size={13} className="text-slate-400 shrink-0" /> Contrato #{cobro.id_contrato}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-600">
                        <span className="font-bold text-xs bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                          {MESES[cobro.periodo_mes] || 'Mes'} {cobro.periodo_anio}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-extrabold text-slate-800 flex items-center gap-1">
                          <DollarSign size={15} className="text-slate-400 shrink-0" />
                          {monto.toFixed(2)} <span className="text-xs font-bold text-slate-400">{cobro.moneda || 'BOB'}</span>
                        </div>
                        {saldo < monto && (
                          <p className="text-[11px] font-bold text-amber-600 mt-0.5">
                            Saldo: {saldo.toFixed(2)} {cobro.moneda || 'BOB'}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-600">
                        <div className="flex items-center gap-1 text-xs font-semibold">
                          <Calendar size={13} className="text-slate-400 shrink-0" />
                          {formatFecha(cobro.fecha_vencimiento)}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 text-xs font-bold border rounded-lg ${getEstadoEstilos(cobro.estado)}`}>
                          {cobro.estado || 'PENDIENTE'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        {(cobro.estado || '').toUpperCase() !== 'PAGADO' ? (
                          <button 
                            onClick={() => abrirModalPago(cobro)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 ml-auto active:scale-95"
                          >
                            <CheckCircle2 size={15} /> Cobrar
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                            Completado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    No se encontraron cobros automáticos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DE REGISTRO DE PAGO */}
      {cobroSeleccionado && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in border border-slate-100">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={20} className="text-emerald-400" />
                <h3 className="font-extrabold text-base">Registrar Cobro de Alquiler</h3>
              </div>
              <button onClick={() => setCobroSeleccionado(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmarPago} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Monto a Cobrar ({cobroSeleccionado.moneda || 'BOB'})</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required
                  value={formPago.monto} 
                  onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })}
                  className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl font-extrabold text-lg text-slate-900 outline-none focus:border-emerald-600 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Método de Pago</label>
                <select 
                  value={formPago.metodo_pago}
                  onChange={(e) => setFormPago({ ...formPago, metodo_pago: e.target.value })}
                  className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-600 bg-white"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria / QR</option>
                  <option value="TARJETA">Tarjeta de Débito/Crédito</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nº Comprobante / Transacción (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ej. TR-98214"
                  value={formPago.comprobante} 
                  onChange={(e) => setFormPago({ ...formPago, comprobante: e.target.value })}
                  className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-emerald-600 bg-slate-50 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setCobroSeleccionado(null)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={submittingPago}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingPago ? 'Procesando...' : 'Confirmar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}