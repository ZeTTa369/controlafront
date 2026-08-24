import { useState, useEffect } from 'react';
import { 
  Wallet, 
  Search, 
  User, 
  Calendar, 
  DollarSign, 
  Tag,
  CheckCircle2,
  Loader2,
  X,
  CreditCard,
  Home
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Helper para formatear fechas a DD/MM/YYYY
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

export function ListadoCobros() {
  const [cobros, setCobros] = useState([]);
  const [conceptosMap, setConceptosMap] = useState({});
  const [contratosInfoMap, setContratosInfoMap] = useState({});
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
      const [resCobros, resConceptos, resContratos, resDeptos, resEdificios, resUsers] = await Promise.all([
        fetch(`${BASE_URL}/cobros`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/conceptos`, { headers: getAuthHeaders() }).catch(() => null),
        fetch(`${BASE_URL}/contratos`, { headers: getAuthHeaders() }).catch(() => null),
        fetch(`${BASE_URL}/departamentos`, { headers: getAuthHeaders() }).catch(() => null),
        fetch(`${BASE_URL}/edificios`, { headers: getAuthHeaders() }).catch(() => null),
        fetch(`${BASE_URL}/usuarios`, { headers: getAuthHeaders() }).catch(() => null),
      ]);

      const dataCobros = await handleResponse(resCobros);
      const dataConc = resConceptos && resConceptos.ok ? await handleResponse(resConceptos) : [];
      const dataContratos = resContratos && resContratos.ok ? await handleResponse(resContratos) : [];
      const dataDeptos = resDeptos && resDeptos.ok ? await handleResponse(resDeptos) : [];
      const dataEdificios = resEdificios && resEdificios.ok ? await handleResponse(resEdificios) : [];
      const dataUsers = resUsers && resUsers.ok ? await handleResponse(resUsers) : [];

      // 1. Mapa de Conceptos
      const mapC = {};
      if (Array.isArray(dataConc)) {
        dataConc.forEach(c => {
          mapC[c.id_concepto || c.id] = c.nombre;
        });
      }
      setConceptosMap(mapC);

      // 2. Mapa de Edificios
      const mapEd = {};
      if (Array.isArray(dataEdificios)) {
        dataEdificios.forEach(e => {
          mapEd[e.id_edificio || e.id] = e.nombre;
        });
      }

      // 3. Mapa de Departamentos
      const mapDep = {};
      if (Array.isArray(dataDeptos)) {
        dataDeptos.forEach(d => {
          const edNombre = mapEd[d.id_edificio] || 'Edificio';
          const num = d.numero_departamento || d.numero || 'S/N';
          const piso = d.piso || 1;
          mapDep[d.id_departamento || d.id] = `${edNombre} - Piso ${piso} Depto ${num}`;
        });
      }

      // 4. Mapa de Usuarios
      const mapUsr = {};
      if (Array.isArray(dataUsers)) {
        dataUsers.forEach(u => {
          const nombreComp = `${u.nombre || ''} ${u.primer_apellido || ''} ${u.segundo_apellido || ''}`.trim();
          mapUsr[u.id_usuario || u.id] = nombreComp || 'Inquilino Registrado';
        });
      }

      // 5. Mapa de Contratos (Inquilino + Depto)
      const mapContratos = {};
      if (Array.isArray(dataContratos)) {
        dataContratos.forEach(con => {
          const idContrato = con.id_contrato || con.id;
          const inquilinoNombre = mapUsr[con.id_usuario] || 'Inquilino';
          const deptoTexto = mapDep[con.id_departamento] || 'Unidad Residencial';
          mapContratos[idContrato] = {
            inquilino: inquilinoNombre,
            ubicacion: deptoTexto,
          };
        });
      }
      setContratosInfoMap(mapContratos);

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
    const toastId = toast.loading('Registrando el cobro...');

    try {
      const id = cobroSeleccionado.id_cobro || cobroSeleccionado.id;
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
      toast.success('¡Cobro registrado correctamente!', { id: toastId });
      setCobroSeleccionado(null);
      cargarDatos();
    } catch (error) {
      toast.error(error.message || 'Error al procesar el pago', { id: toastId });
    } finally {
      setSubmittingPago(false);
    }
  };

  const cobrosFiltrados = cobros.filter(c => {
    const term = busqueda.toLowerCase();
    const infoContrato = contratosInfoMap[c.id_contrato] || {};
    const nombreInquilino = (infoContrato.inquilino || '').toLowerCase();
    const ubicacion = (infoContrato.ubicacion || '').toLowerCase();
    const desc = (c.descripcion || '').toLowerCase();
    const conc = (conceptosMap[c.id_concepto] || '').toLowerCase();

    return (
      nombreInquilino.includes(term) ||
      ubicacion.includes(term) ||
      desc.includes(term) ||
      conc.includes(term)
    );
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
          <p className="text-sm text-slate-500">Gestión de cuotas mensuales asociadas a inquilinos y unidades</p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-6 max-w-md focus-within:border-blue-600 focus-within:bg-white transition-all">
        <Search size={18} className="text-slate-400 shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar por inquilino, piso o depto..." 
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
            <span className="text-sm font-semibold">Cargando mensualidades...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4">Inquilino / Ubicación</th>
                <th className="py-4 px-4">Concepto / Período</th>
                <th className="py-4 px-4">Monto / Saldo</th>
                <th className="py-4 px-4">Vencimiento (DD/MM/AAAA)</th>
                <th className="py-4 px-4">Estado</th>
                <th className="py-4 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {cobrosFiltrados.length > 0 ? (
                cobrosFiltrados.map((cobro) => {
                  const id = cobro.id_cobro || cobro.id;
                  const infoContrato = contratosInfoMap[cobro.id_contrato] || {
                    inquilino: 'Inquilino',
                    ubicacion: `Contrato #${cobro.id_contrato}`,
                  };

                  const nombreConcepto = conceptosMap[cobro.id_concepto] || cobro.descripcion || 'Cobro de Alquiler';
                  const monto = Number(cobro.monto || 0);
                  const saldo = cobro.saldo_pendiente !== undefined ? Number(cobro.saldo_pendiente) : monto;

                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Inquilino y Piso - Depto en lugar de solo Contrato #X */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-sm">
                              {infoContrato.inquilino}
                            </p>
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <Home size={13} className="text-slate-400 shrink-0" /> {infoContrato.ubicacion}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Concepto y Período */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 text-xs">
                          {nombreConcepto}
                        </div>
                        <span className="inline-block font-semibold text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 mt-1">
                          {MESES[cobro.periodo_mes] || 'Mes'} {cobro.periodo_anio}
                        </span>
                      </td>

                      {/* Monto / Saldo */}
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

                      {/* Fecha de Vencimiento DD/MM/YYYY */}
                      <td className="py-4 px-4 text-slate-600">
                        <div className="flex items-center gap-1 text-xs font-semibold">
                          <Calendar size={13} className="text-slate-400 shrink-0" />
                          {formatFechaDMY(cobro.fecha_vencimiento)}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 text-xs font-bold border rounded-lg ${getEstadoEstilos(cobro.estado)}`}>
                          {cobro.estado || 'PENDIENTE'}
                        </span>
                      </td>

                      {/* Botón Cobrar */}
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
                    No se encontraron cobros registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Registrar Cobro */}
      {cobroSeleccionado && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in border border-slate-100">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={20} className="text-emerald-400" />
                <h3 className="font-extrabold text-base">Registrar Cobro de Mensualidad</h3>
              </div>
              <button onClick={() => setCobroSeleccionado(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmarPago} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Monto ({cobroSeleccionado.moneda || 'BOB'})</label>
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
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Método de Cobro</label>
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
                  {submittingPago ? 'Procesando...' : 'Confirmar Cobro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}