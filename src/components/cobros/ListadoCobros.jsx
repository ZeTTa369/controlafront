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
  CreditCard,
  Sliders
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';
import { listarCobros, pagarCobro } from '../../services/cobroPagoService';
import { listarContratos } from '../../services/contratoService';
import { listarUsuarios } from '../../services/usuarioService';
import { Recibo } from './Recibo';

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Formateo seguro de fecha a formato DD/MM/YYYY
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

  // Estados de filtrado
  const [busqueda, setBusqueda] = useState('');
  const [filtroEdificio, setFiltroEdificio] = useState('');
  const [tabEstado, setTabEstado] = useState('TODOS');

  // Modal principal: Contrato activo en visualizacion
  const [contratoActivoId, setContratoActivoId] = useState(null);

  // Submodal: Cobro individual y ajuste de excepcion
  const [cobroAPagar, setCobroAPagar] = useState(null);
  const [submittingPago, setSubmittingPago] = useState(false);
  
  // Estado del formulario de pago y configuracion de ajustes
  const [formPago, setFormPago] = useState({
    monto: '',
    metodo_pago: 'EFECTIVO',
    comprobante: '',
    aplicarAjuste: false,
    tipoAjuste: 'DIAS',
    diasPresentes: 15,
    personasAjustadas: 1,
    montoAjustadoManual: '',
    motivoAjuste: ''
  });

  // Estado para impresion de recibo
  const [reciboData, setReciboData] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Carga inicial de datos mediante servicios y catalogos
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [
        dataCobros, 
        dataContratos, 
        dataUsers, 
        resConceptos, 
        resDeptos, 
        resEdificios
      ] = await Promise.all([
        listarCobros(),
        listarContratos().catch(() => []),
        listarUsuarios().catch(() => []),
        fetch(`${BASE_URL}/conceptos`, { headers: getAuthHeaders() }).then(handleResponse).catch(() => []),
        fetch(`${BASE_URL}/departamentos`, { headers: getAuthHeaders() }).then(handleResponse).catch(() => []),
        fetch(`${BASE_URL}/edificios`, { headers: getAuthHeaders() }).then(handleResponse).catch(() => []),
      ]);

      // Mapeo de conceptos
      const mapC = {};
      if (Array.isArray(resConceptos)) {
        resConceptos.forEach(c => { mapC[c.id_concepto || c.id] = c.nombre; });
      }
      setConceptosMap(mapC);

      // Mapeo de edificios
      const mapEd = {};
      if (Array.isArray(resEdificios)) {
        resEdificios.forEach(e => { 
          const id = e.id_edificio || e.id;
          mapEd[id] = {
            id,
            nombre: e.nombre || 'Edificio',
            direccion: e.direccion || 'Direccion no especificada',
            ciudad: e.ciudad || 'Cochabamba',
            provincia: e.provincia || 'Cercado'
          }; 
        });
      }
      setEdificios(Array.isArray(resEdificios) ? resEdificios : []);
      setEdificiosMap(mapEd);

      // Mapeo de departamentos
      const mapDep = {};
      if (Array.isArray(resDeptos)) {
        resDeptos.forEach(d => {
          mapDep[d.id_departamento || d.id] = {
            id_edificio: d.id_edificio,
            numero: d.numero_departamento || d.numero || 'S/N',
            piso: d.piso || 1,
            bloque: d.bloque || '',
            tipo: d.tipo_inmueble || 'Departamento',
          };
        });
      }
      setDepartamentosMap(mapDep);

      // Mapeo de usuarios
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

  // Calculo consolidado por tarjeta de contrato
  const tarjetasContratos = useMemo(() => {
    const hoyStr = new Date().toISOString().split('T')[0];

    return contratos.map(con => {
      const idContrato = con.id_contrato || con.id;
      const depto = departamentosMap[con.id_departamento] || {};
      const idEdificio = depto.id_edificio || con.id_edificio;
      const edInfo = edificiosMap[idEdificio] || {};
      const nombreEdificio = edInfo.nombre || 'Edificio';
      const direccionEdificio = edInfo.direccion || con.direccion || '';
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
        direccion_edificio: direccionEdificio,
        deptoNumero: depto.numero || 'S/N',
        deptoPiso: depto.piso || 1,
        deptoBloque: depto.bloque || '',
        personas: con.personas || con.cantidad_personas || con.cantidadPersonas || 1,
        montoAlquiler: Number(con.monto_renta || con.monto_alquiler || con.precio_alquiler || 0),
        moneda: con.moneda || 'BOB',
        totalDeuda,
        totalPagado,
        cuotasPendientesCount,
        estadoSemaforo,
        proximoVencimiento,
      };
    });
  }, [contratos, cobros, departamentosMap, edificiosMap, usuariosMap]);

  const contratoActivo = useMemo(() => {
    if (!contratoActivoId) return null;
    return tarjetasContratos.find(c => Number(c.idContrato) === Number(contratoActivoId)) || null;
  }, [contratoActivoId, tarjetasContratos]);

  // Agrupacion cronologica por periodo de mes y anio
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
          fechaPago: cobro.fecha_pago || cobro.updated_date || cobro.fecha_vencimiento,
          fechaInicio: cobro.fecha_inicio,
          fechaFin: cobro.fecha_fin,
          idRecibo: cobro.id_cobro || cobro.id,
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
      .map(g => ({
        ...g,
        estaCompletamentePagado: g.items.length > 0 && 
          g.items.every(it => it.esPagado) && 
          g.totalSaldo === 0,
      }))
      .sort((a, b) => a.clave.localeCompare(b.clave));
  }, [contratoActivoId, cobros]);

  // Inicializacion del modal de pago individual
  const abrirFormPago = (cobro) => {
    const esPagado = (cobro.estado || '').toUpperCase() === 'PAGADO';
    const saldo = esPagado ? 0 : Number(cobro.saldo_pendiente ?? cobro.monto ?? 0);
    const cantPersonasContrato = contratoActivo?.personas || 1;

    setCobroAPagar(cobro);
    setFormPago({
      monto: saldo,
      metodo_pago: 'EFECTIVO',
      comprobante: '',
      aplicarAjuste: false,
      tipoAjuste: 'MANUAL',
      diasPresentes: 15,
      personasAjustadas: cantPersonasContrato,
      montoAjustadoManual: saldo.toString(),
      motivoAjuste: ''
    });
  };

  // Recalculo dinamico de montos basado en la excepcion
  const recalcularMontoAjuste = (tipo, valor) => {
    if (!cobroAPagar) return;
    const montoBase = Number(cobroAPagar.monto || 0);
    const cantPersonasBase = contratoActivo?.personas || 1;

    let nuevoCalculado = montoBase;

    if (tipo === 'DIAS') {
      const dias = Math.max(1, Math.min(30, Number(valor)));
      nuevoCalculado = Number(((montoBase / 30) * dias).toFixed(2));
    } else if (tipo === 'PERSONAS') {
      const personas = Math.max(1, Number(valor));
      const valorPorPersona = montoBase / cantPersonasBase;
      nuevoCalculado = Number((valorPorPersona * personas).toFixed(2));
    }

    setFormPago(prev => ({
      ...prev,
      monto: nuevoCalculado,
      montoAjustadoManual: nuevoCalculado.toString()
    }));
  };

  // Envio del pago y persistencia del ajuste
  const handleConfirmarPago = async (e) => {
    e.preventDefault();
    if (!cobroAPagar) return;

    const idTarget = cobroAPagar.id_cobro || cobroAPagar.id;
    const montoPagado = Number(formPago.monto);

    if (isNaN(montoPagado) || montoPagado <= 0) {
      toast.error('El monto debe ser un numero mayor a 0');
      return;
    }

    if (formPago.aplicarAjuste && !formPago.motivoAjuste.trim()) {
      toast.error('Especifica el motivo del ajuste o excepcion');
      return;
    }

    setSubmittingPago(true);
    const toastId = toast.loading('Procesando cobro y actualizando saldo...');

    try {
      const payload = {
        monto: montoPagado,
        metodo_pago: formPago.metodo_pago,
        comprobante: formPago.comprobante ? formPago.comprobante.trim() : null,
        ...(formPago.aplicarAjuste ? {
          nuevo_monto: montoPagado,
          motivo_ajuste: formPago.motivoAjuste.trim()
        } : {})
      };

      const respuesta = await pagarCobro(idTarget, payload);
      const cobroActualizadoServidor = respuesta?.cobro;

      // Actualizacion inmediata en memoria con los datos del backend
      setCobros(prevCobros => prevCobros.map(c => {
        if (Number(c.id_cobro || c.id) !== Number(idTarget)) return c;

        if (cobroActualizadoServidor) {
          return {
            ...c,
            ...cobroActualizadoServidor
          };
        }

        const montoBase = formPago.aplicarAjuste ? montoPagado : Number(c.monto);
        const saldoAnterior = c.saldo_pendiente !== undefined && c.saldo_pendiente !== null 
          ? Number(c.saldo_pendiente) 
          : montoBase;
        const saldoCalculado = formPago.aplicarAjuste ? 0 : Math.max(0, saldoAnterior - montoPagado);

        return {
          ...c,
          monto: montoBase,
          saldo_pendiente: saldoCalculado,
          estado: saldoCalculado === 0 ? 'PAGADO' : 'PENDIENTE',
          ...(formPago.aplicarAjuste ? {
            motivo_ajuste: formPago.motivoAjuste.trim(),
            monto_original: c.monto_original || c.monto
          } : {})
        };
      }));

      toast.success('Cobro registrado exitosamente', { id: toastId });
      setCobroAPagar(null);
    } catch (error) {
      console.error('Error registrando pago:', error);
      toast.error(error.message || 'Error al procesar el cobro', { id: toastId });
    } finally {
      setSubmittingPago(false);
    }
  };

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
          <p className="text-sm text-slate-500">Supervisa inquilinos, cobra cuotas y emite comprobantes oficiales al completar el periodo.</p>
        </div>
      </div>

      {/* Metricas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Contratos</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
        </div>

        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Al Dia</span>
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
              placeholder="Buscar por inquilino, edificio o numero de depto..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="bg-transparent border-none outline-none ml-2 text-sm text-slate-800 w-full placeholder:text-slate-400"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
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
            Al Dia ({stats.alDia})
          </button>
        </div>
      </div>

      {/* Cuadricula de tarjetas */}
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
                      {esMora ? 'En Mora' : esAlDia ? 'Al Dia' : 'Pendiente'}
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
                    {card.deptoBloque && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400 font-semibold">Bloque {card.deptoBloque}</span>
                      </>
                    )}
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
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Limite Proximo</span>
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

      {/* ================= MODAL DETALLE DE COBROS ================= */}
      {contratoActivo && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-up">
            
            {/* Cabecera modal */}
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
                    {contratoActivo.edificio} • Piso {contratoActivo.deptoPiso} Depto {contratoActivo.deptoNumero} {contratoActivo.deptoBloque ? `(Bloque ${contratoActivo.deptoBloque})` : ''}
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

            {/* Resumen superior */}
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

            {/* Listado de cuotas por periodo */}
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
                            <CheckCircle2 size={12} /> Periodo Cancelado
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
                            title="Todos los conceptos de este periodo deben estar cancelados para emitir recibo"
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
                          <th className="py-2.5 px-4">Limite</th>
                          <th className="py-2.5 px-4">Estado</th>
                          <th className="py-2.5 px-4 text-right">Accion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {grupo.items.map((cobro) => {
                          const id = cobro.id_cobro || cobro.id;
                          const esPagado = cobro.esPagado;
                          const monto = Number(cobro.monto || 0);
                          const saldo = cobro.saldoCalculado;
                          const conceptoNombre = conceptosMap[cobro.id_concepto] || cobro.descripcion || 'Alquiler';
                          const tieneAjuste = Boolean(cobro.motivo_ajuste || cobro.monto_original);

                          return (
                            <tr key={id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                  {conceptoNombre}
                                  {tieneAjuste && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                                      Ajustado
                                    </span>
                                  )}
                                </span>
                                {cobro.motivo_ajuste ? (
                                  <span className="text-[11px] font-medium text-blue-600 block italic">
                                    Nota: {cobro.motivo_ajuste}
                                  </span>
                                ) : cobro.descripcion && cobro.descripcion !== conceptoNombre ? (
                                  <span className="text-[11px] text-slate-400 block">{cobro.descripcion}</span>
                                ) : null}
                              </td>

                              <td className="py-3 px-4">
                                <span className="font-extrabold text-slate-900 text-xs">
                                  {monto.toFixed(2)} {cobro.moneda || 'BOB'}
                                </span>
                                {cobro.monto_original && Number(cobro.monto_original) !== monto && (
                                  <span className="text-[10px] text-slate-400 line-through block">
                                    Orig: {Number(cobro.monto_original).toFixed(2)}
                                  </span>
                                )}
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

            {/* Pie modal */}
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

      {/* ================= SUBMODAL PAGO INDIVIDUAL CON AJUSTES ================= */}
      {cobroAPagar && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-scale-up">
            
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CreditCard size={20} className="text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    Cobrar Cuota: {conceptosMap[cobroAPagar.id_concepto] || cobroAPagar.descripcion || 'Servicio'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Contrato: {contratoActivo?.inquilino} • Unidad {contratoActivo?.deptoNumero}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setCobroAPagar(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmarPago} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              
              {/* Seccion de excepciones y rebajas */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders size={16} className="text-blue-600" />
                    <span className="text-xs font-extrabold text-blue-900">
                      ¿Aplicar rebaja o excepcion en este cobro?
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={formPago.aplicarAjuste}
                      onChange={(e) => {
                        const activo = e.target.checked;
                        const montoOriginal = cobroAPagar.saldo_pendiente ?? cobroAPagar.monto;
                        setFormPago({
                          ...formPago,
                          aplicarAjuste: activo,
                          monto: montoOriginal,
                          montoAjustadoManual: montoOriginal.toString(),
                          motivoAjuste: activo ? formPago.motivoAjuste : ''
                        });
                      }}
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Opciones del calculo de ajuste */}
                {formPago.aplicarAjuste && (
                  <div className="mt-3 pt-3 border-t border-blue-200/80 space-y-3">
                    
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-white rounded-xl border border-blue-200 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setFormPago(prev => ({ ...prev, tipoAjuste: 'DIAS' }));
                          recalcularMontoAjuste('DIAS', formPago.diasPresentes);
                        }}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                          formPago.tipoAjuste === 'DIAS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-blue-600'
                        }`}
                      >
                        Por Dias (Viaje)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormPago(prev => ({ ...prev, tipoAjuste: 'PERSONAS' }));
                          recalcularMontoAjuste('PERSONAS', formPago.personasAjustadas);
                        }}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                          formPago.tipoAjuste === 'PERSONAS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-blue-600'
                        }`}
                      >
                        Por Personas
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormPago(prev => ({ ...prev, tipoAjuste: 'MANUAL' }))}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                          formPago.tipoAjuste === 'MANUAL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-blue-600'
                        }`}
                      >
                        Monto Directo
                      </button>
                    </div>

                    {/* Modo 1: Dias de estadia */}
                    {formPago.tipoAjuste === 'DIAS' && (
                      <div className="bg-white p-3 rounded-xl border border-blue-100 space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>Dias habitados este mes:</span>
                          <span className="text-blue-600 font-extrabold">{formPago.diasPresentes} de 30 dias</span>
                        </div>
                        <input 
                          type="range"
                          min="1"
                          max="30"
                          value={formPago.diasPresentes}
                          onChange={(e) => {
                            const d = Number(e.target.value);
                            setFormPago(prev => ({ ...prev, diasPresentes: d }));
                            recalcularMontoAjuste('DIAS', d);
                          }}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                        <span className="text-[11px] text-slate-400 block">
                          Prorratea el total del mes sobre una base estandar de 30 dias.
                        </span>
                      </div>
                    )}

                    {/* Modo 2: Numero de personas */}
                    {formPago.tipoAjuste === 'PERSONAS' && (
                      <div className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">
                          Personas presentes en el mes:
                        </label>
                        <input 
                          type="number"
                          min="1"
                          max="15"
                          value={formPago.personasAjustadas}
                          onChange={(e) => {
                            const p = Number(e.target.value);
                            setFormPago(prev => ({ ...prev, personasAjustadas: p }));
                            recalcularMontoAjuste('PERSONAS', p);
                          }}
                          className="w-20 py-1.5 px-3 border border-slate-300 rounded-lg text-sm font-black text-center text-slate-800 outline-none focus:border-blue-600"
                        />
                      </div>
                    )}

                    {/* Modo 3: Monto manual directo */}
                    {formPago.tipoAjuste === 'MANUAL' && (
                      <div className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">
                          Importe acordado ({cobroAPagar.moneda || 'BOB'}):
                        </label>
                        <input 
                          type="number"
                          step="0.01"
                          value={formPago.montoAjustadoManual}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormPago(prev => ({ 
                              ...prev, 
                              montoAjustadoManual: val, 
                              monto: val 
                            }));
                          }}
                          className="w-28 py-1.5 px-3 border border-slate-300 rounded-lg text-sm font-black text-right text-slate-800 outline-none focus:border-blue-600"
                        />
                      </div>
                    )}

                    {/* Justificacion de la excepcion */}
                    <div>
                      <label className="block text-xs font-extrabold text-blue-900 mb-1">
                        Motivo de la excepcion / observacion *
                      </label>
                      <input 
                        type="text"
                        required={formPago.aplicarAjuste}
                        placeholder="Ej. Viaje 15 dias, Visitas familiares, Descuento autorizado..."
                        value={formPago.motivoAjuste}
                        onChange={(e) => setFormPago({ ...formPago, motivoAjuste: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-blue-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-600"
                      />
                    </div>

                  </div>
                )}
              </div>

              {/* Monto final a cobrar */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Monto Final a Cobrar ({cobroAPagar.moneda || 'BOB'}) *
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.01" 
                    required
                    value={formPago.monto} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormPago(prev => ({
                        ...prev,
                        monto: val,
                        montoAjustadoManual: val
                      }));
                    }}
                    className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl font-black text-2xl text-slate-900 outline-none focus:border-emerald-600 bg-slate-50"
                  />
                  {formPago.aplicarAjuste && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                      Modificado
                    </span>
                  )}
                </div>
              </div>

              {/* Metodo de pago */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Metodo de Pago *
                </label>
                <select 
                  value={formPago.metodo_pago} 
                  onChange={(e) => setFormPago({ ...formPago, metodo_pago: e.target.value })}
                  className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-600 bg-white cursor-pointer text-sm"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria / QR</option>
                  <option value="TARJETA">Tarjeta Debito / Credito</option>
                </select>
              </div>

              {/* Comprobante */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Nº Comprobante / Transaccion (Opcional)
                </label>
                <input 
                  type="text" 
                  placeholder="Ej. TR-89104"
                  value={formPago.comprobante} 
                  onChange={(e) => setFormPago({ ...formPago, comprobante: e.target.value })}
                  className="w-full py-2.5 px-4 border-2 border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-emerald-600 bg-slate-50 text-sm"
                />
              </div>

              {/* Acciones */}
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
                    'Confirmar y Cobrar'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal Recibo Oficial */}
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