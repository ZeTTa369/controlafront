import { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Building,
  Users,
  Home,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  X,
  Loader2,
  Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';
import { listarContratos } from '../../services/contratoService';
import { listarUsuarios } from '../../services/usuarioService';
import { listarCobros } from '../../services/cobroPagoService';
import { generarCodigoDepartamento } from '../utils/codigoDepartamento';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES_NOMBRE = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const parseFechaPartes = (fechaStr) => {
  if (!fechaStr) return null;
  const soloFecha = String(fechaStr).split('T')[0];
  const [y, m, d] = soloFecha.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
};

const formatFechaDMY = (fechaStr) => {
  const p = parseFechaPartes(fechaStr);
  if (!p) return 'N/A';
  return `${String(p.d).padStart(2, '0')}/${String(p.m).padStart(2, '0')}/${p.y}`;
};

const getPrioridadConcepto = (nombre = '') => {
  const n = nombre.toUpperCase();
  if (n.includes('ALQUILER') || n.includes('RENTA') || n.includes('CANON')) return 1;
  if (n.includes('EXPENSA')) return 2;
  if (n.includes('AGUA')) return 3;
  if (n.includes('LUZ') || n.includes('ELECTRIC')) return 4;
  return 5;
};

export function CalendarioCobrosInicio({ onIrACobros }) {
  const hoy = useMemo(() => new Date(), []);
  const [mesActual, setMesActual] = useState(hoy.getMonth()); // 0 - 11
  const [anioActual, setAnioActual] = useState(hoy.getFullYear());

  const [loading, setLoading] = useState(true);
  const [contratos, setContratos] = useState([]);
  const [cobrosAll, setCobrosAll] = useState([]);
  const [edificiosList, setEdificiosList] = useState([]);
  const [deptosMap, setDeptosMap] = useState({});
  const [usuariosMap, setUsuariosMap] = useState({});
  const [conceptosMap, setConceptosMap] = useState({});

  // Filtros del calendario
  const [filtroEdificio, setFiltroEdificio] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS'); // 'TODOS' | 'PENDIENTE' | 'VENCIDO' | 'PAGADO'

  // Modal de detalle ampliado del día
  const [diaSeleccionado, setDiaSeleccionado] = useState(null); // { fechaKey, dia, mes, anio, eventos }

  useEffect(() => {
    cargarDatosCalendario();
  }, []);

  const cargarDatosCalendario = async () => {
    setLoading(true);
    try {
      const [
        dataContratos,
        resDeptos,
        resEdificios,
        dataUsers,
        dataCobros,
        resConceptos,
      ] = await Promise.all([
        listarContratos().catch(() => []),
        fetch(`${BASE_URL}/departamentos`, { headers: getAuthHeaders() }).then(handleResponse).catch(() => []),
        fetch(`${BASE_URL}/edificios`, { headers: getAuthHeaders() }).then(handleResponse).catch(() => []),
        listarUsuarios().catch(() => []),
        listarCobros().catch(() => []),
        fetch(`${BASE_URL}/conceptos`, { headers: getAuthHeaders() }).then(handleResponse).catch(() => []),
      ]);

      const mapEd = {};
      const listEd = [];
      if (Array.isArray(resEdificios)) {
        resEdificios.forEach((e) => {
          const idEd = e.id_edificio || e.id;
          mapEd[idEd] = e.nombre;
          listEd.push({ id: idEd, nombre: e.nombre });
        });
      }
      setEdificiosList(listEd);

      const mapDep = {};
      if (Array.isArray(resDeptos)) {
        resDeptos.forEach((d) => {
          const idDep = d.id_departamento || d.id;
          const edNombre = mapEd[d.id_edificio] || 'Edificio';
          const num = d.numero_departamento || d.numero || 'S/N';
          const piso = d.piso || 1;
          const codigo = generarCodigoDepartamento({
            nombreEdificio: edNombre,
            piso,
            numeroDepartamento: num,
            bloque: d.bloque,
          });
          mapDep[idDep] = {
            ...d,
            edNombre,
            codigo,
            etiqueta: `${edNombre} - Piso ${piso} Depto ${num}`,
          };
        });
      }
      setDeptosMap(mapDep);

      const mapUsr = {};
      if (Array.isArray(dataUsers)) {
        dataUsers.forEach((u) => {
          const idUsr = u.id_usuario || u.id;
          const nombreCompleto = `${u.nombre || ''} ${u.primer_apellido || ''} ${u.segundo_apellido || ''}`.trim();
          const nombreCorto = `${u.nombre || ''} ${u.primer_apellido || ''}`.trim() || 'Inquilino';
          mapUsr[idUsr] = {
            ...u,
            nombreCompleto: nombreCompleto || 'Inquilino',
            nombreCorto,
          };
        });
      }
      setUsuariosMap(mapUsr);

      const mapConc = {};
      if (Array.isArray(resConceptos)) {
        resConceptos.forEach((c) => {
          mapConc[c.id_concepto || c.id] = c.nombre;
        });
      }
      setConceptosMap(mapConc);

      setContratos(Array.isArray(dataContratos) ? dataContratos : []);
      setCobrosAll(Array.isArray(dataCobros) ? dataCobros : []);
    } catch (error) {
      console.error('Error cargando calendario de cobros:', error);
      toast.error('No se pudieron cargar los datos del calendario');
    } finally {
      setLoading(false);
    }
  };

  // Navegación entre meses
  const irMesAnterior = () => {
    if (mesActual === 0) {
      setMesActual(11);
      setAnioActual((prev) => prev - 1);
    } else {
      setMesActual((prev) => prev - 1);
    }
  };

  const irMesSiguiente = () => {
    if (mesActual === 11) {
      setMesActual(0);
      setAnioActual((prev) => prev + 1);
    } else {
      setMesActual((prev) => prev + 1);
    }
  };

  const irAHoy = () => {
    const ahora = new Date();
    setMesActual(ahora.getMonth());
    setAnioActual(ahora.getFullYear());
  };

  // Proyectar contratos activos en el mes visible según su día de fecha_inicio
  const eventosPorDia = useMemo(() => {
    const mapa = {}; // { 'YYYY-MM-DD': [eventosContrato] }
    const mes1a12 = mesActual + 1;
    const diasEnEsteMes = new Date(anioActual, mes1a12, 0).getDate();

    const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    contratos.forEach((contrato) => {
      const estContrato = (contrato.estado || 'DIRECTO').toUpperCase();
      if (['FINALIZADO', 'CANCELADO'].includes(estContrato)) return;

      const depto = deptosMap[contrato.id_departamento];
      if (filtroEdificio && depto && String(depto.id_edificio) !== String(filtroEdificio)) {
        return;
      }

      const inicio = parseFechaPartes(contrato.fecha_inicio);
      if (!inicio) return;
      const fin = parseFechaPartes(contrato.fecha_fin);

      // El día de cobro mensual es el día de fecha_inicio (ajustado al último día si el mes es más corto)
      const diaCobroMes = Math.min(inicio.d, diasEnEsteMes);
      const fechaEvento = new Date(anioActual, mesActual, diaCobroMes);
      const fechaInicioDate = new Date(inicio.y, inicio.m - 1, inicio.d);

      // Verificar que el mes/año esté dentro de la vigencia del contrato
      if (
        anioActual < inicio.y ||
        (anioActual === inicio.y && mes1a12 < inicio.m)
      ) {
        return;
      }

      if (fin) {
        if (
          anioActual > fin.y ||
          (anioActual === fin.y && mes1a12 > fin.m)
        ) {
          return;
        }
      }

      if (fechaEvento < fechaInicioDate) return;

      const idContrato = contrato.id_contrato || contrato.id;
      const usuario = usuariosMap[contrato.id_usuario] || {
        nombreCompleto: `Inquilino #${contrato.id_usuario}`,
        nombreCorto: `Inquilino #${contrato.id_usuario}`,
      };

      // Buscar cobros reales generados para este contrato en este periodo (mes / año)
      const cobrosPeriodo = cobrosAll.filter(
        (c) =>
          Number(c.id_contrato) === Number(idContrato) &&
          Number(c.periodo_mes) === Number(mes1a12) &&
          Number(c.periodo_anio) === Number(anioActual)
      );

      let itemsDesglose = [];
      if (cobrosPeriodo.length > 0) {
        itemsDesglose = cobrosPeriodo
          .map((c) => {
            const nombreConc = conceptosMap[c.id_concepto] || c.descripcion || 'Concepto';
            return {
              id_cobro: c.id_cobro || c.id,
              nombre: nombreConc,
              monto: Number(c.monto || 0),
              estado: (c.estado || 'PENDIENTE').toUpperCase(),
              prioridad: getPrioridadConcepto(nombreConc),
            };
          })
          .sort((a, b) => (a.prioridad !== b.prioridad ? a.prioridad - b.prioridad : a.nombre.localeCompare(b.nombre)));
      } else {
        // Si aún no se generó la cuota de un mes futuro, tomar la plantilla del primer mes o monto_renta
        const cobrosContrato = cobrosAll.filter((c) => Number(c.id_contrato) === Number(idContrato));
        if (cobrosContrato.length > 0) {
          const ordenados = [...cobrosContrato].sort((a, b) =>
            `${a.periodo_anio}-${String(a.periodo_mes).padStart(2, '0')}`.localeCompare(
              `${b.periodo_anio}-${String(b.periodo_mes).padStart(2, '0')}`
            )
          );
          const pMes = ordenados[0].periodo_mes;
          const pAnio = ordenados[0].periodo_anio;
          itemsDesglose = ordenados
            .filter((c) => Number(c.periodo_mes) === Number(pMes) && Number(c.periodo_anio) === Number(pAnio))
            .map((c) => {
              const nombreConc = conceptosMap[c.id_concepto] || c.descripcion || 'Concepto';
              return {
                id_cobro: null,
                nombre: nombreConc,
                monto: Number(c.monto || 0),
                estado: 'PROGRAMADO',
                prioridad: getPrioridadConcepto(nombreConc),
              };
            })
            .sort((a, b) => (a.prioridad !== b.prioridad ? a.prioridad - b.prioridad : a.nombre.localeCompare(b.nombre)));
        } else {
          itemsDesglose = [
            {
              id_cobro: null,
              nombre: 'Alquiler / Renta Mensual',
              monto: Number(contrato.monto_renta || 0),
              estado: 'PROGRAMADO',
              prioridad: 1,
            },
          ];
        }
      }

      const montoTotal = itemsDesglose.reduce((acc, it) => acc + it.monto, 0);
      const montoPagado = itemsDesglose
        .filter((it) => it.estado === 'PAGADO')
        .reduce((acc, it) => acc + it.monto, 0);
      const montoPendiente = montoTotal - montoPagado;

      // Determinar estado visual consolidado del contrato para ese día
      let estadoVisual = 'PENDIENTE'; // 'PAGADO' | 'VENCIDO' | 'PENDIENTE' | 'PROGRAMADO'
      const todosPagados =
        itemsDesglose.length > 0 && itemsDesglose.every((it) => it.estado === 'PAGADO');
      const algunoVencido = itemsDesglose.some((it) => it.estado === 'VENCIDO');
      const esProgramado = itemsDesglose.every((it) => it.estado === 'PROGRAMADO');

      if (todosPagados) {
        estadoVisual = 'PAGADO';
      } else if (algunoVencido || (fechaEvento < hoySinHora && !esProgramado)) {
        estadoVisual = 'VENCIDO';
      } else if (esProgramado && fechaEvento > hoySinHora) {
        estadoVisual = 'PROGRAMADO';
      } else {
        estadoVisual = 'PENDIENTE';
      }

      if (filtroEstado !== 'TODOS' && estadoVisual !== filtroEstado) {
        return;
      }

      const fechaKey = `${anioActual}-${String(mes1a12).padStart(2, '0')}-${String(diaCobroMes).padStart(2, '0')}`;
      if (!mapa[fechaKey]) mapa[fechaKey] = [];

      mapa[fechaKey].push({
        idContrato,
        contrato,
        codigoUnidad: depto?.codigo || `U-${contrato.id_departamento}`,
        deptoEtiqueta: depto?.etiqueta || `Departamento #${contrato.id_departamento}`,
        edificioNombre: depto?.edNombre || 'Edificio',
        inquilinoCorto: usuario.nombreCorto,
        inquilinoCompleto: usuario.nombreCompleto,
        ciNit: usuario.ci_nit || 'N/A',
        telefono: usuario.telefono || '',
        moneda: contrato.moneda || 'BOB',
        fechaInicio: contrato.fecha_inicio,
        fechaFin: contrato.fecha_fin,
        diaCobro: diaCobroMes,
        itemsDesglose,
        montoTotal,
        montoPagado,
        montoPendiente,
        estadoVisual,
      });
    });

    return mapa;
  }, [
    contratos,
    cobrosAll,
    deptosMap,
    usuariosMap,
    conceptosMap,
    mesActual,
    anioActual,
    filtroEdificio,
    filtroEstado,
    hoy,
  ]);

  // Resumen financiero del mes visible
  const resumenMes = useMemo(() => {
    let totalProyectado = 0;
    let totalCobrado = 0;
    let totalPendiente = 0;
    let cantidadContratosMes = 0;
    let cantidadVencidos = 0;

    Object.values(eventosPorDia).forEach((lista) => {
      lista.forEach((ev) => {
        cantidadContratosMes += 1;
        totalProyectado += ev.montoTotal;
        totalCobrado += ev.montoPagado;
        totalPendiente += ev.montoPendiente;
        if (ev.estadoVisual === 'VENCIDO') cantidadVencidos += 1;
      });
    });

    return {
      totalProyectado,
      totalCobrado,
      totalPendiente,
      cantidadContratosMes,
      cantidadVencidos,
    };
  }, [eventosPorDia]);

  // Construcción de celdas del calendario (Lunes a Domingo)
  const celdasCalendario = useMemo(() => {
    const primerDiaMes = new Date(anioActual, mesActual, 1);
    // Convertir domingo (0) -> 6, lunes (1) -> 0 ...
    const offsetInicio = (primerDiaMes.getDay() + 6) % 7;
    const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
    const diasMesAnterior = new Date(anioActual, mesActual, 0).getDate();

    const celdas = [];

    // Días previos de relleno
    for (let i = offsetInicio - 1; i >= 0; i--) {
      celdas.push({
        dia: diasMesAnterior - i,
        esMesActual: false,
        fechaKey: null,
      });
    }

    // Días del mes actual
    const mes1a12 = mesActual + 1;
    for (let d = 1; d <= diasEnMes; d++) {
      const fechaKey = `${anioActual}-${String(mes1a12).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const esHoy =
        d === hoy.getDate() &&
        mesActual === hoy.getMonth() &&
        anioActual === hoy.getFullYear();

      celdas.push({
        dia: d,
        esMesActual: true,
        esHoy,
        fechaKey,
        eventos: eventosPorDia[fechaKey] || [],
      });
    }

    // Relleno final para completar filas de 7 columnas
    const totalCeldas = celdas.length <= 35 ? 35 : 42;
    let diaSig = 1;
    while (celdas.length < totalCeldas) {
      celdas.push({
        dia: diaSig++,
        esMesActual: false,
        fechaKey: null,
      });
    }

    return celdas;
  }, [anioActual, mesActual, eventosPorDia, hoy]);

  const getPillEstilos = (estadoVisual) => {
    switch (estadoVisual) {
      case 'PAGADO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200/80';
      case 'VENCIDO':
        return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200/80';
      case 'PENDIENTE':
        return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200/80';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/80';
    }
  };

  const getBadgeEstilos = (estadoVisual) => {
    switch (estadoVisual) {
      case 'PAGADO':
        return {
          clase: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          texto: 'Pagado',
        };
      case 'VENCIDO':
        return {
          clase: 'bg-red-50 text-red-700 border-red-200',
          texto: 'Vencido / Atrasado',
        };
      case 'PENDIENTE':
        return {
          clase: 'bg-blue-50 text-blue-700 border-blue-200',
          texto: 'Pendiente de Cobro',
        };
      default:
        return {
          clase: 'bg-amber-50 text-amber-700 border-amber-200',
          texto: 'Programado',
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-7 space-y-6">
      
      {/* CABECERA DEL CALENDARIO Y CONTROLES */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-600/20">
            <CalendarIcon size={22} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Calendario Mensual de Cobros
            </h3>
            <p className="text-xs text-slate-500">
              Basado en el día de inicio de cada contrato • Haz clic en cualquier día para ampliar el detalle
            </p>
          </div>
        </div>

        {/* Navegación Mes / Año + Filtros */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Edificio */}
          <div className="relative flex items-center">
            <Building size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
            <select
              value={filtroEdificio}
              onChange={(e) => setFiltroEdificio(e.target.value)}
              className="py-2 pl-8 pr-6 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="">Todos los Edificios</option>
              {edificiosList.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  {ed.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="PENDIENTE">Pendientes (Azul)</option>
            <option value="VENCIDO">Vencidos (Rojo)</option>
            <option value="PAGADO">Pagados (Verde)</option>
            <option value="PROGRAMADO">Programados (Ámbar)</option>
          </select>

          {/* Navegador de Mes */}
          <div className="flex items-center bg-slate-900 text-white rounded-xl p-1 shadow-sm">
            <button
              type="button"
              onClick={irMesAnterior}
              title="Mes anterior"
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 text-xs font-extrabold tracking-wide min-w-[130px] text-center">
              {MESES_NOMBRE[mesActual]} {anioActual}
            </span>

            <button
              type="button"
              onClick={irMesSiguiente}
              title="Mes siguiente"
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={irAHoy}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition-colors cursor-pointer"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* RESUMEN RÁPIDO DEL MES + LEYENDA DE COLORES */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold">Cobros en {MESES_NOMBRE[mesActual]}: </span>
            <strong className="text-slate-800 font-extrabold">{resumenMes.cantidadContratosMes} contrato(s)</strong>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="text-slate-400 font-semibold">Total Mes: </span>
            <strong className="text-slate-900 font-extrabold">{resumenMes.totalProyectado.toFixed(2)} BOB</strong>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="text-slate-400 font-semibold">Cobrado: </span>
            <strong className="text-emerald-700 font-extrabold">{resumenMes.totalCobrado.toFixed(2)} BOB</strong>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="text-slate-400 font-semibold">Por Cobrar: </span>
            <strong className="text-blue-700 font-extrabold">{resumenMes.totalPendiente.toFixed(2)} BOB</strong>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
          <span className="inline-flex items-center gap-1.5 text-blue-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Pendiente
          </span>
          <span className="inline-flex items-center gap-1.5 text-red-700">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Vencido
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Pagado
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Programado
          </span>
        </div>
      </div>

      {/* GRILLA DEL CALENDARIO MENSUAL */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <span className="text-sm font-semibold">Sincronizando calendario de contratos y cobros...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[780px] border border-slate-200 rounded-2xl overflow-hidden">
            {/* Encabezados Lunes a Domingo */}
            <div className="grid grid-cols-7 bg-slate-900 text-slate-300 text-xs font-extrabold uppercase tracking-wider">
              {DIAS_SEMANA.map((diaNombre) => (
                <div key={diaNombre} className="py-3 px-2 text-center border-r border-slate-800 last:border-r-0">
                  {diaNombre}
                </div>
              ))}
            </div>

            {/* Celdas de los días */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 bg-white">
              {celdasCalendario.map((celda, idx) => {
                if (!celda.esMesActual) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[118px] bg-slate-50/70 p-2 text-slate-300 select-none"
                    >
                      <span className="text-xs font-bold">{celda.dia}</span>
                    </div>
                  );
                }

                const eventos = celda.eventos || [];
                const visibles = eventos.slice(0, 3);
                const ocultos = eventos.length - visibles.length;

                return (
                  <div
                    key={celda.fechaKey}
                    onClick={() =>
                      setDiaSeleccionado({
                        fechaKey: celda.fechaKey,
                        dia: celda.dia,
                        mes: mesActual,
                        anio: anioActual,
                        eventos,
                      })
                    }
                    className={`min-h-[118px] p-2 transition-all cursor-pointer flex flex-col justify-between group ${
                      celda.esHoy
                        ? 'bg-blue-50/40 hover:bg-blue-50/80'
                        : 'bg-white hover:bg-slate-50/90'
                    }`}
                  >
                    <div>
                      {/* Número de día */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                            celda.esHoy
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-700 group-hover:text-blue-600'
                          }`}
                        >
                          {celda.dia}
                        </span>

                        {eventos.length > 0 && (
                          <span className="text-[10px] font-bold text-slate-400">
                            {eventos.length} {eventos.length === 1 ? 'cobro' : 'cobros'}
                          </span>
                        )}
                      </div>

                      {/* Pills apiladas por contrato/unidad */}
                      <div className="space-y-1">
                        {visibles.map((ev) => (
                          <div
                            key={ev.idContrato}
                            className={`px-2 py-1 rounded-md border text-[11px] font-bold truncate transition-colors flex items-center justify-between gap-1 ${getPillEstilos(
                              ev.estadoVisual
                            )}`}
                            title={`${ev.codigoUnidad} • ${ev.inquilinoCompleto} (${ev.montoTotal.toFixed(2)} ${ev.moneda})`}
                          >
                            <span className="truncate">
                              <span className="font-mono font-extrabold">{ev.codigoUnidad}</span> • {ev.inquilinoCorto}
                            </span>
                          </div>
                        ))}

                        {ocultos > 0 && (
                          <div className="text-[11px] font-extrabold text-blue-600 px-1.5 pt-0.5">
                            +{ocultos} más...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL AMPLIADO DEL DÍA SELECCIONADO ================= */}
      {diaSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-scale-up">
            
            {/* Cabecera del Modal del Día */}
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 rounded-xl text-white">
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold">
                    Cobros del {diaSeleccionado.dia} de {MESES_NOMBRE[diaSeleccionado.mes]} de {diaSeleccionado.anio}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {diaSeleccionado.eventos.length === 0
                      ? 'Sin vencimientos ni cobros programados para esta fecha'
                      : `${diaSeleccionado.eventos.length} contrato(s) con fecha de cobro este día`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDiaSeleccionado(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
              {diaSeleccionado.eventos.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CalendarIcon size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-600">No hay cobros agendados este día</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Los contratos se muestran automáticamente según el día de su fecha de inicio.
                  </p>
                </div>
              ) : (
                <>
                  {/* Resumen financiero del día */}
                  {(() => {
                    const totalDia = diaSeleccionado.eventos.reduce((a, b) => a + b.montoTotal, 0);
                    const pagadoDia = diaSeleccionado.eventos.reduce((a, b) => a + b.montoPagado, 0);
                    const pendienteDia = diaSeleccionado.eventos.reduce((a, b) => a + b.montoPendiente, 0);
                    return (
                      <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <span className="text-slate-400 font-bold uppercase block text-[10px]">Total del Día</span>
                          <span className="text-base font-black text-slate-900">{totalDia.toFixed(2)} BOB</span>
                        </div>
                        <div>
                          <span className="text-emerald-600 font-bold uppercase block text-[10px]">Cobrado</span>
                          <span className="text-base font-black text-emerald-700">{pagadoDia.toFixed(2)} BOB</span>
                        </div>
                        <div>
                          <span className="text-blue-600 font-bold uppercase block text-[10px]">Por Cobrar</span>
                          <span className="text-base font-black text-blue-700">{pendienteDia.toFixed(2)} BOB</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Tarjetas por cada contrato/unidad */}
                  <div className="space-y-3">
                    {diaSeleccionado.eventos.map((ev) => {
                      const badge = getBadgeEstilos(ev.estadoVisual);
                      return (
                        <div
                          key={ev.idContrato}
                          className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm space-y-3"
                        >
                          {/* Encabezado de la Unidad e Inquilino */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-xs font-extrabold rounded-md">
                                  {ev.codigoUnidad}
                                </span>
                                <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1">
                                  <Home size={14} className="text-slate-400" /> {ev.deptoEtiqueta}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                                <Users size={13} className="text-slate-400" />
                                <strong className="text-slate-700">{ev.inquilinoCompleto}</strong>
                                <span>• Inicio contrato: {formatFechaDMY(ev.fechaInicio)}</span>
                              </p>
                            </div>

                            <span className={`px-2.5 py-1 text-xs font-bold border rounded-lg w-fit ${badge.clase}`}>
                              {badge.texto}
                            </span>
                          </div>

                          {/* Desglose de conceptos del mes */}
                          <div className="space-y-1.5 text-xs">
                            {ev.itemsDesglose.map((item, idx) => (
                              <div
                                key={item.id_cobro || idx}
                                className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50/70"
                              >
                                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                                  {item.estado === 'PAGADO' ? (
                                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                                  ) : item.estado === 'VENCIDO' ? (
                                    <AlertTriangle size={13} className="text-red-500 shrink-0" />
                                  ) : (
                                    <Clock size={13} className="text-blue-500 shrink-0" />
                                  )}
                                  {item.nombre}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold uppercase text-slate-400">
                                    {item.estado}
                                  </span>
                                  <span className="font-extrabold text-slate-900">
                                    {item.monto.toFixed(2)} {ev.moneda}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Total del contrato y acceso directo a Cobros */}
                          <div className="pt-2 flex items-center justify-between">
                            <div className="text-xs font-bold text-slate-600 flex items-center gap-1">
                              <DollarSign size={14} className="text-slate-400" />
                              Total Cuota Mensual:{' '}
                              <span className="text-sm font-black text-slate-900">
                                {ev.montoTotal.toFixed(2)} {ev.moneda}
                              </span>
                            </div>

                            {onIrACobros && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDiaSeleccionado(null);
                                  onIrACobros(ev);
                                }}
                                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                              >
                                <Wallet size={14} /> Ir a Cobros <ArrowRight size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Pie del Modal */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setDiaSeleccionado(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors uppercase tracking-wider cursor-pointer"
              >
                Cerrar
              </button>

              {onIrACobros && (
                <button
                  type="button"
                  onClick={() => {
                    setDiaSeleccionado(null);
                    onIrACobros();
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow cursor-pointer"
                >
                  <Wallet size={15} /> Abrir Módulo de Cobros
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}