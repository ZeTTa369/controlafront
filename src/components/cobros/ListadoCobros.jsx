import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  User, 
  Calendar, 
  CheckCircle2, 
  Loader2, 
  X, 
  Home, 
  Building2, 
  ArrowUpRight,
  Wallet,
  Clock,
  Printer,
  Lock,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';
import { Recibo } from './Recibo';

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const formatFechaDMY = (strFecha) => {
  if (!strFecha) return 'N/A';
  try {
    const soloFecha = String(strFecha).split('T')[0];
    const [y, m, d] = soloFecha.split('-');
    if (!y || !m || !d) return strFecha;
    return `${d}/${m}/${y}`;
  } catch (e) {
    return strFecha;
  }
};

export function ListadoCobros() {
  const [loading, setLoading] = useState(true);
  const [cobros, setCobros] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [departamentosMap, setDepartamentosMap] = useState({});
  const [conceptosMap, setConceptosMap] = useState({});
  const [usuariosMap, setUsuariosMap] = useState({});
  const [edificiosMap, setEdificiosMap] = useState({});

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEdificio, setFiltroEdificio] = useState('');
  const [tabEstado, setTabEstado] = useState('TODOS');

  // Modal Principal: Contrato Activo (guardamos el ID para derivar todo en tiempo real)
  const [contratoActivoId, setContratoActivoId] = useState(null);

  // Submodal: Cobro Individual
  const [cobroAPagar, setCobroAPagar] = useState(null);
  const [submittingPago, setSubmittingPago] = useState(false);
  const [formPago, setFormPago] = useState({
    monto: '',
    metodo_pago: 'EFECTIVO',
    comprobante: ''
  });

  // Modal Recibo
  const [reciboData, setReciboData] = useState(null);

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

      const mapC = {};
      if (Array.isArray(dataConc)) {
        dataConc.forEach(c => { mapC[c.id_concepto || c.id] = c.nombre; });
      }
      setConceptosMap(mapC);

      const mapEd = {};
      if (Array.isArray(dataEdificios)) {
        dataEdificios.forEach(e => { mapEd[e.id_edificio || e.id] = e.nombre; });
      }
      setEdificios(Array.isArray(dataEdificios) ? dataEdificios : []);
      setEdificiosMap(mapEd);

      const mapDep = {};
      if (Array.isArray(dataDeptos)) {
        dataDeptos.forEach(d => {
          mapDep[d.id_departamento || d.id] = {
            id_edificio: d.id_edificio,
            numero: d.numero_departamento || d.numero || 'S/N',
            piso: d.piso || 1,
            bloque: d.bloque || 'FRONTAL',
            tipo: d.tipo_inmueble || 'Departamento',
          };
        });
      }
      setDepartamentosMap(mapDep);

      const mapUsr = {};
      if (Array.isArray(dataUsers)) {
        dataUsers.forEach(u => {
          const nombre = `${u.nombre || ''} ${u.primer_apellido || ''} ${u.segundo_apellido || ''}`.trim();
          mapUsr[u.id_usuario || u.id] = nombre || 'Inquilino';
        });
      }
      setUsuariosMap(mapUsr);

      setContratos(Array.isArray(dataContratos) ? dataContratos : []);
      setCobros(Array.isArray(dataCobros) ? dataCobros : []);
    } catch (error) {
      console.error('Error cargando datos de cobros:', error);
      toast.error('No se pudieron cargar los registros de cobranza');
    } finally {
      setLoading(false);
    }
  };

  // Cálculo reactivo de tarjetas de contratos
  const tarjetasContratos = useMemo(() => {
    const hoyStr = new Date().toISOString().split('T')[0];

    return contratos.map(con => {
      const idContrato = con.id_contrato || con.id;
      const depto = departamentosMap[con.id_departamento] || {};
      const idEdificio = depto.id_edificio || con.id_edificio;
      const nombreEdificio = edificiosMap[idEdificio] || 'Edificio';
      const nombreInquilino = usuariosMap[con.id_usuario] || 'Inquilino';

      const cobrosContrato = cobros.filter(c => Number(c.id_contrato) === Number(idContrato));

      let totalDeuda = 0;
      let totalPagado = 0;
      let cuotasPendientesCount = 0;
      let tieneMora = false;
      let proximoVencimiento = null;

      cobrosContrato.forEach(c => {
        const monto = Number(c.monto || 0);
        const esPagado = (c.estado || '').toUpperCase() === 'PAGADO';
        const saldo = esPagado ? 0 : Math.max(0, Number(c.saldo_pendiente ?? monto));
        const fechaVenc = c.fecha_vencimiento ? String(c.fecha_vencimiento).split('T')[0] : null;

        if (esPagado) {
          totalPagado += monto;
        } else {
          totalDeuda += saldo;
          cuotasPendientesCount++;

          if (fechaVenc && fechaVenc < hoyStr) tieneMora = true;
          if (fechaVenc && (!proximoVencimiento || fechaVenc < proximoVencimiento)) {
            proximoVencimiento = fechaVenc;
          }
        }
      });

      let estadoSemaforo = 'AL_DIA';
      if (tieneMora) {
        estadoSemaforo = 'MORA';
      } else if (cuotasPendientesCount > 0) {
        estadoSemaforo = 'PENDIENTE';
      }

      return {
        idContrato,
        contratoOriginal: con,
        inquilino: nombreInquilino,
        idEdificio,
        edificio: nombreEdificio,
        deptoNumero: depto.numero || 'S/N',
        deptoPiso: depto.piso || 1,
        deptoBloque: depto.bloque || 'FRONTAL',
        montoAlquiler: Number(con.monto_alquiler || con.precio_alquiler || 0),
        moneda: con.moneda || 'BOB',
        totalDeuda,
        totalPagado,
        cuotasPendientesCount,
        estadoSemaforo,
        proximoVencimiento,
      };
    });
  }, [contratos, cobros, departamentosMap, edificiosMap, usuariosMap]);

  // Contrato actualmente abierto
  const contratoActivo = useMemo(() => {
    if (!contratoActivoId) return null;
    return tarjetasContratos.find(c => Number(c.idContrato) === Number(contratoActivoId)) || null;
  }, [contratoActivoId, tarjetasContratos]);

  // Cobros del contrato activo agrupados por período mensual en tiempo real
  const gruposMensualesContrato = useMemo(() => {
    if (!contratoActivoId) return [];
    const cobrosDelContrato = cobros.filter(c => Number(c.id_contrato) === Number(contratoActivoId));
    const grupos = {};

    cobrosDelContrato.forEach(cobro => {
      const mes = Number(cobro.periodo_mes) || 1;
      const anio = Number(cobro.periodo_anio) || 2026;
      const clave = `${anio}-${String(mes).padStart(2, '0')}`;

      if (!grupos[clave]) {
        grupos[clave] = {
          clave,
          mes,
          anio,
          nombrePeriodo: `${MESES[mes] || 'Mes'} ${anio}`,
          items: [],
          totalMonto: 0,
          totalSaldo: 0,
        };
      }

      const monto = Number(cobro.monto || 0);
      const esPagado = (cobro.estado || '').toUpperCase() === 'PAGADO';
      const saldo = esPagado ? 0 : Math.max(0, Number(cobro.saldo_pendiente ?? monto));

      grupos[clave].items.push({
        ...cobro,
        saldoCalculado: saldo,
        esPagado
      });

      grupos[clave].totalMonto += monto;
      grupos[clave].totalSaldo += saldo;
    });

    return Object.values(grupos)
      .sort((a, b) => b.clave.localeCompare(a.clave))
      .map(g => ({
        ...g,
        estaCompletamentePagado: g.items.length > 0 && 
          g.items.every(it => it.esPagado) && 
          g.totalSaldo === 0,
      }));
  }, [contratoActivoId, cobros]);

  // Manejo de pago directo (actualiza cobros en 0 ms)
  const abrirFormPago = (cobro) => {
    const esPagado = (cobro.estado || '').toUpperCase() === 'PAGADO';
    const saldo = esPagado ? 0 : (cobro.saldo_pendiente ?? cobro.monto);

    setCobroAPagar(cobro);
    setFormPago({
      monto: saldo,
      metodo_pago: 'EFECTIVO',
      comprobante: ''
    });
  };

  const handleConfirmarPago = async (e) => {
    e.preventDefault();
    if (!cobroAPagar) return;

    const idTarget = cobroAPagar.id_cobro || cobroAPagar.id;
    const montoPagado = Number(formPago.monto);

    setSubmittingPago(true);
    const toastId = toast.loading('Registrando cobro...');

    try {
      const response = await fetch(`${BASE_URL}/cobros/${idTarget}/pagar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          monto: montoPagado,
          metodo_pago: formPago.metodo_pago,
          comprobante: formPago.comprobante || null
        }),
      });

      const dataRespuesta = await handleResponse(response);

      // Actualizar inmediatamente la fuente de verdad (cobros)
      setCobros(prevCobros => prevCobros.map(c => {
        if (Number(c.id_cobro || c.id) !== Number(idTarget)) return c;

        const saldoPrevio = c.saldo_pendiente !== undefined && c.saldo_pendiente !== null
          ? Number(c.saldo_pendiente)
          : Number(c.monto || 0);

        const nuevoSaldo = Math.max(0, saldoPrevio - montoPagado);
        const nuevoEstado = nuevoSaldo === 0 ? 'PAGADO' : 'PENDIENTE';

        return {
          ...c,
          ...(dataRespuesta || {}),
          saldo_pendiente: nuevoSaldo,
          estado: nuevoEstado,
        };
      }));

      toast.success('¡Cobro registrado exitosamente!', { id: toastId });
      setCobroAPagar(null);
    } catch (error) {
      toast.error(error.message || 'Error al procesar cobro', { id: toastId });
    } finally {
      setSubmittingPago(false);
    }
  };

  // Filtrado de tarjetas
  const tarjetasFiltradas = useMemo(() => {
    return tarjetasContratos.filter(card => {
      const term = busqueda.toLowerCase().trim();
      const coincideTexto = !term || 
        card.inquilino.toLowerCase().includes(term) ||
        card.edificio.toLowerCase().includes(term) ||
        card.deptoNumero.toLowerCase().includes(term);

      const coincideEdificio = !filtroEdificio || String(card.idEdificio) === String(filtroEdificio);

      let coincideTab = true;
      if (tabEstado === 'MORA') {
        coincideTab = card.estadoSemaforo === 'MORA';
      } else if (tabEstado === 'AL_DIA') {
        coincideTab = card.estadoSemaforo === 'AL_DIA';
      }

      return coincideTexto && coincideEdificio && coincideTab;
    });
  }, [tarjetasContratos, busqueda, filtroEdificio, tabEstado]);

  const stats = useMemo(() => {
    const total = tarjetasContratos.length;
    const enMora = tarjetasContratos.filter(c => c.estadoSemaforo === 'MORA').length;
    const alDia = tarjetasContratos.filter(c => c.estadoSemaforo === 'AL_DIA').length;
    const pendientes = tarjetasContratos.filter(c => c.estadoSemaforo === 'PENDIENTE').length;
    return { total, enMora, alDia, pendientes };
  }, [tarjetasContratos]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-fade-in relative">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Cartera de Cobros y Expensas</h2>
          <p className="text-sm text-slate-500">Supervisa inquilinos, cobra cuotas y emite comprobantes oficiales al completar el período.</p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Contratos</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
        </div>

        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Al Día</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stats.alDia}</p>
        </div>

        <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">En Plazo</span>
          <p className="text-2xl font-black text-amber-700 mt-1">{stats.pendientes}</p>
        </div>

        <div className="p-4 bg-red-50/60 border border-red-200 rounded-2xl">
          <span className="text-xs font-bold text-red-700 uppercase tracking-wider block">En Mora / Deuda</span>
          <p className="text-2xl font-black text-red-700 mt-1">{stats.enMora}</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
          <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-blue-600 focus-within:bg-white transition-all">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Buscar por inquilino, edificio o número de depto..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="bg-transparent border-none outline-none ml-2 text-sm text-slate-800 w-full placeholder:text-slate-400"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="relative flex items-center min-w-[200px]">
            <Building2 size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
            <select
              value={filtroEdificio}
              onChange={(e) => setFiltroEdificio(e.target.value)}
              className="w-full py-2.5 pl-11 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 focus:bg-white appearance-none cursor-pointer"
            >
              <option value="">Todos los Edificios</option>
              {edificios.map(ed => (
                <option key={ed.id_edificio || ed.id} value={ed.id_edificio || ed.id}>
                  {ed.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

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
            onClick={() => setTabEstado('MORA')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tabEstado === 'MORA' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:text-red-600'
            }`}
          >
            Con Mora ({stats.enMora})
          </button>
          <button
            type="button"
            onClick={() => setTabEstado('AL_DIA')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tabEstado === 'AL_DIA' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-600'
            }`}
          >
            Al Día ({stats.alDia})
          </button>
        </div>
      </div>

      {/* Cuadrícula de Tarjetas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <span className="text-sm font-semibold">Cargando contratos y cuotas...</span>
        </div>
      ) : tarjetasFiltradas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tarjetasFiltradas.map(card => {
            const esMora = card.estadoSemaforo === 'MORA';
            const esAlDia = card.estadoSemaforo === 'AL_DIA';

            return (
              <div
                key={card.idContrato}
                onClick={() => setContratoActivoId(card.idContrato)}
                className={`border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 bg-white relative flex flex-col justify-between ${
                  esMora 
                    ? 'border-red-200 hover:border-red-400' 
                    : esAlDia 
                    ? 'border-slate-200 hover:border-emerald-300' 
                    : 'border-amber-200 hover:border-amber-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-1 text-xs font-extrabold rounded-lg border flex items-center gap-1.5 ${
                      esMora 
                        ? 'bg-red-50 text-red-700 border-red-200' 
                        : esAlDia 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        esMora ? 'bg-red-600 animate-pulse' : esAlDia ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                      {esMora ? 'En Mora' : esAlDia ? 'Al Día' : 'Pendiente'}
                    </span>

                    <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 flex items-center gap-1">
                      <Home size={13} /> Depto {card.deptoNumero}
                    </span>
                  </div>

                  <h3 className="font-black text-slate-900 text-base leading-snug flex items-center gap-1.5 truncate">
                    <User size={16} className="text-slate-400 shrink-0" />
                    <span className="truncate">{card.inquilino}</span>
                  </h3>

                  <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                    <Building2 size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{card.edificio}</span>
                    <span className="text-slate-300">•</span>
                    <span>Piso {card.deptoPiso}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400 font-semibold">Bloque {card.deptoBloque}</span>
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {esMora ? 'Saldo Deudor' : 'Renta Mensual'}
                      </span>
                      <p className={`text-lg font-black mt-0.5 ${esMora ? 'text-red-600' : 'text-slate-800'}`}>
                        {esMora ? card.totalDeuda.toFixed(2) : card.montoAlquiler.toFixed(2)} 
                        <span className="text-xs font-bold ml-1 text-slate-400">{card.moneda}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      {card.proximoVencimiento ? (
                        <div className="text-xs text-slate-500 font-medium">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Límite Próximo</span>
                          <span className={`font-bold flex items-center gap-1 justify-end ${esMora ? 'text-red-600' : 'text-slate-700'}`}>
                            <Calendar size={12} /> {formatFechaDMY(card.proximoVencimiento)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 size={14} /> Sin deuda
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs font-bold text-blue-600 pt-2 border-t border-slate-50 group">
                    <span>Gestionar cobros</span>
                    <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
          No se encontraron contratos con los filtros seleccionados.
        </div>
      )}

      {/* ================= MODAL DETALLE DE COBROS (INTEGRADO DIRECTO) ================= */}
      {contratoActivo && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-up">
            
            {/* Cabecera */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 rounded-xl">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                    Cobranzas - {contratoActivo.inquilino}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {contratoActivo.edificio} • Piso {contratoActivo.deptoPiso} Depto {contratoActivo.deptoNumero} ({contratoActivo.deptoBloque})
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setContratoActivoId(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Resumen Superior */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Pagado</span>
                <p className="text-lg font-black text-emerald-600 mt-0.5">
                  {contratoActivo.totalPagado.toFixed(2)} <span className="text-xs font-bold text-slate-400">{contratoActivo.moneda}</span>
                </p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Saldo Pendiente</span>
                <p className={`text-lg font-black mt-0.5 ${contratoActivo.totalDeuda > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                  {contratoActivo.totalDeuda.toFixed(2)} <span className="text-xs font-bold text-slate-400">{contratoActivo.moneda}</span>
                </p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Renta Pactada</span>
                <p className="text-lg font-black text-slate-900 mt-0.5">
                  {contratoActivo.montoAlquiler.toFixed(2)} <span className="text-xs font-bold text-slate-400">{contratoActivo.moneda} / mes</span>
                </p>
              </div>
            </div>

            {/* Desglose Mensual */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {gruposMensualesContrato.length > 0 ? (
                gruposMensualesContrato.map((grupo) => (
                  <div key={grupo.clave} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Calendar size={18} className="text-blue-600" />
                        <span className="font-extrabold text-slate-800 text-sm">{grupo.nombrePeriodo}</span>
                        {grupo.estaCompletamentePagado ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Período Cancelado
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                            <Clock size={12} /> Saldo: {grupo.totalSaldo.toFixed(2)} {contratoActivo.moneda}
                          </span>
                        )}
                      </div>

                      <div>
                        {grupo.estaCompletamentePagado ? (
                          <button
                            type="button"
                            onClick={() => setReciboData({
                              contrato: contratoActivo,
                              grupo
                            })}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                          >
                            <Printer size={14} /> Imprimir Recibo
                          </button>
                        ) : (
                          <div 
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed select-none"
                            title="Todos los conceptos de este período deben estar pagados para emitir recibo"
                          >
                            <Lock size={13} className="text-slate-400" /> Recibo Bloqueado
                          </div>
                        )}
                      </div>
                    </div>

                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-white">
                          <th className="py-2.5 px-4">Concepto</th>
                          <th className="py-2.5 px-4">Monto</th>
                          <th className="py-2.5 px-4">Límite</th>
                          <th className="py-2.5 px-4">Estado</th>
                          <th className="py-2.5 px-4 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {grupo.items.map((cobro) => {
                          const id = cobro.id_cobro || cobro.id;
                          const esPagado = cobro.esPagado;
                          const monto = Number(cobro.monto || 0);
                          const saldo = cobro.saldoCalculado;
                          const conceptoNombre = conceptosMap[cobro.id_concepto] || cobro.descripcion || 'Alquiler';

                          return (
                            <tr key={id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-800 text-xs block">{conceptoNombre}</span>
                                {cobro.descripcion && cobro.descripcion !== conceptoNombre && (
                                  <span className="text-[11px] text-slate-400">{cobro.descripcion}</span>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                <span className="font-extrabold text-slate-900 text-xs">
                                  {monto.toFixed(2)} {cobro.moneda || 'BOB'}
                                </span>
                                {!esPagado && saldo < monto && saldo > 0 && (
                                  <span className="text-[11px] font-bold text-amber-600 block">Saldo: {saldo.toFixed(2)}</span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-xs font-medium text-slate-600">
                                {formatFechaDMY(cobro.fecha_vencimiento)}
                              </td>

                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 text-[11px] font-extrabold border rounded-md ${
                                  esPagado 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {esPagado ? 'PAGADO' : 'PENDIENTE'}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right">
                                {!esPagado ? (
                                  <button
                                    type="button"
                                    onClick={() => abrirFormPago(cobro)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all active:scale-95 inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <CheckCircle2 size={13} /> Cobrar
                                  </button>
                                ) : (
                                  <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1">
                                    <CheckCircle2 size={14} /> Pagado
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 text-sm">
                  Este contrato no registra cuotas emitidas.
                </div>
              )}
            </div>

            {/* Pie */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setContratoActivoId(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= SUBMODAL CONFIRMAR PAGO INDIVIDUAL ================= */}
      {cobroAPagar && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-scale-up">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={20} className="text-emerald-400" />
                <h3 className="font-extrabold text-base">Registrar Cobro de Cuota</h3>
              </div>
              <button 
                type="button"
                onClick={() => setCobroAPagar(null)} 
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmarPago} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Monto a Cobrar ({cobroAPagar.moneda || 'BOB'}) *
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  required
                  value={formPago.monto} 
                  onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })}
                  className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl font-black text-xl text-slate-900 outline-none focus:border-emerald-600 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Método de Pago *
                </label>
                <select 
                  value={formPago.metodo_pago} 
                  onChange={(e) => setFormPago({ ...formPago, metodo_pago: e.target.value })}
                  className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-600 bg-white cursor-pointer"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria / QR</option>
                  <option value="TARJETA">Tarjeta Débito / Crédito</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Nº Comprobante / Transacción (Opcional)
                </label>
                <input 
                  type="text" 
                  placeholder="Ej. TR-89104"
                  value={formPago.comprobante} 
                  onChange={(e) => setFormPago({ ...formPago, comprobante: e.target.value })}
                  className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-emerald-600 bg-slate-50 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setCobroAPagar(null)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={submittingPago}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 text-sm disabled:opacity-50 flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  {submittingPago ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Procesando...
                    </>
                  ) : (
                    'Confirmar Cobro'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL RECIBO OFICIAL ================= */}
      {reciboData && (
        <Recibo
          reciboData={reciboData}
          conceptosMap={conceptosMap}
          onClose={() => setReciboData(null)}
        />
      )}

    </div>
  );
}