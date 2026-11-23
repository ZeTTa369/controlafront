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
  CreditCard,
  UserCheck,
  Edit2,
  Key,
  Paperclip,
  ExternalLink,
  Clock,
  UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';
import { 
  listarContratos, 
  eliminarContrato, 
  obtenerDocumentosContrato,
  listarHabitantesContratos,
  agregarHabitanteContrato,
  actualizarHabitanteContrato,
  eliminarHabitanteContrato
} from '../../services/contratoService';
import { listarUsuarios } from '../../services/usuarioService';
import { listarCobros } from '../../services/cobroPagoService';
import { ModalConfirmarEliminar } from '../modals/ModalConfirmarEliminar';
import { ModalEditarContrato } from '../modals/ModalEditarContrato';
import { ModalNuevoHabitante } from '../modals/ModalNuevoHabitante';
import { generarCodigoDepartamento } from '../utils/codigoDepartamento';

// Helper para convertir cualquier fecha a formato DD/MM/YYYY
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

// Ordenamiento de conceptos financieros por prioridad comercial
const getPrioridadConcepto = (nombre = '') => {
  const n = nombre.toUpperCase();
  if (n.includes('ALQUILER') || n.includes('RENTA') || n.includes('CANON')) return 1;
  if (n.includes('EXPENSA')) return 2;
  if (n.includes('AGUA')) return 3;
  if (n.includes('LUZ') || n.includes('ELECTRIC')) return 4;
  return 5;
};

// Calculo de periodo limite de pago segun regla del multiplo de 5
const calcularPeriodoLimitePago = (fechaInicioStr) => {
  if (!fechaInicioStr) return 'Del 1 al 5 de cada mes';
  try {
    const soloFecha = String(fechaInicioStr).split('T')[0];
    const [y, m, d] = soloFecha.split('-').map(Number);
    if (!y || !m || !d) return 'Del 1 al 5 de cada mes';

    const diasEnElMes = new Date(y, m, 0).getDate();
    if (d >= 30) return `Del ${d} al 5 del siguiente mes`;

    let diaFin = Math.ceil(d / 5) * 5;
    if (diaFin === d) diaFin = d + 5;
    if (diaFin > diasEnElMes) diaFin = diasEnElMes;
    return `Del ${d} al ${diaFin} de cada mes`;
  } catch (e) {
    return 'Del 1 al 5 de cada mes';
  }
};

export function ListadoContratos({ onNuevoContratoClick, onVerDocumentoClick }) {
  const [contratos, setContratos] = useState([]);
  const [cobrosAll, setCobrosAll] = useState([]);
  const [habitantesAll, setHabitantesAll] = useState([]);
  const [conceptosMap, setConceptosMap] = useState({});

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEdificio, setFiltroEdificio] = useState('');
  const [tabEstado, setTabEstado] = useState('TODOS');
  const [loading, setLoading] = useState(true);

  // Mapeos relacionales
  const [deptosMap, setDeptosMap] = useState({});
  const [deptosCodigoMap, setDeptosCodigoMap] = useState({});
  const [edificiosList, setEdificiosList] = useState([]);
  const [usuariosMap, setUsuariosMap] = useState({});
  const [usuariosRawMap, setUsuariosRawMap] = useState({});
  const [deptosRawMap, setDeptosRawMap] = useState({});

  // Modal de Detalle + documentos adjuntos
  const [contratoSeleccionado, setContratoSeleccionado] = useState(null);
  const [documentosDetalle, setDocumentosDetalle] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Gestion de Habitantes desde el Detalle del Contrato
  const [modalHabitanteAbierto, setModalHabitanteAbierto] = useState(false);
  const [habitanteEditando, setHabitanteEditando] = useState(null);
  const [guardandoHabitante, setGuardandoHabitante] = useState(false);

  // Modal de Edición
  const [contratoAEditar, setContratoAEditar] = useState(null);

  // Modal de Confirmación de Eliminación
  const [contratoAEliminar, setContratoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    setLoading(true);
    try {
      const [
        dataContratos, 
        resDeptos, 
        resEdificios, 
        dataUsers, 
        dataCobros, 
        resConceptos, 
        resHabitantes
      ] = await Promise.all([
        listarContratos(),
        fetch(`${BASE_URL}/departamentos`, { headers: getAuthHeaders() }).then(handleResponse).catch(() => []),
        fetch(`${BASE_URL}/edificios`, { headers: getAuthHeaders() }).then(handleResponse).catch(() => []),
        listarUsuarios().catch(() => []),
        listarCobros().catch(() => []),
        fetch(`${BASE_URL}/conceptos`, { headers: getAuthHeaders() }).then(handleResponse).catch(() => []),
        listarHabitantesContratos().catch(() => []),
      ]);

      // 1. Mapa de Edificios
      const mapEd = {};
      const listEd = [];
      if (Array.isArray(resEdificios)) {
        resEdificios.forEach(e => {
          const idEd = e.id_edificio || e.id;
          mapEd[idEd] = e.nombre;
          listEd.push({ id: idEd, nombre: e.nombre });
        });
      }
      setEdificiosList(listEd);

      // 2. Mapa de Departamentos y Codigos
      const mapDep = {};
      const mapCodDep = {};
      const rawDep = {};
      if (Array.isArray(resDeptos)) {
        resDeptos.forEach(d => {
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
          mapDep[idDep] = `${edNombre} - Piso ${piso} Depto ${num}`;
          mapCodDep[idDep] = codigo;
          rawDep[idDep] = { ...d, edNombre, codigo };
        });
      }
      setDeptosMap(mapDep);
      setDeptosCodigoMap(mapCodDep);
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

      // 4. Mapa de Conceptos
      const mapConc = {};
      if (Array.isArray(resConceptos)) {
        resConceptos.forEach(c => {
          mapConc[c.id_concepto || c.id] = c.nombre;
        });
      }
      setConceptosMap(mapConc);

      setContratos(Array.isArray(dataContratos) ? dataContratos : []);
      setCobrosAll(Array.isArray(dataCobros) ? dataCobros : []);
      setHabitantesAll(Array.isArray(resHabitantes) ? resHabitantes : []);
    } catch (error) {
      console.warn('Error al cargar la lista de contratos desde la API:', error.message);
      toast.error('No se pudieron cargar los contratos');
    } finally {
      setLoading(false);
    }
  };

  // Obtener desglose financiero real (Alquiler + Agua + Luz + Expensas) de un contrato
  const obtenerDesgloseFinancieroContrato = (contrato) => {
    const idContrato = contrato.id_contrato || contrato.id;
    const cobrosContrato = cobrosAll.filter(c => Number(c.id_contrato) === Number(idContrato));

    if (cobrosContrato.length === 0) {
      const montoBase = Number(contrato.monto_renta || 0);
      return {
        items: montoBase > 0 ? [{ nombre: 'Alquiler / Renta Mensual', monto: montoBase }] : [],
        totalMensual: montoBase,
      };
    }

    const ordenadosPorPeriodo = [...cobrosContrato].sort((a, b) => {
      const kA = `${a.periodo_anio || 0}-${String(a.periodo_mes || 0).padStart(2, '0')}`;
      const kB = `${b.periodo_anio || 0}-${String(b.periodo_mes || 0).padStart(2, '0')}`;
      return kA.localeCompare(kB);
    });

    const primerMes = ordenadosPorPeriodo[0].periodo_mes;
    const primerAnio = ordenadosPorPeriodo[0].periodo_anio;

    const itemsPrimerMes = ordenadosPorPeriodo
      .filter(c => Number(c.periodo_mes) === Number(primerMes) && Number(c.periodo_anio) === Number(primerAnio))
      .map(c => {
        const nombre = conceptosMap[c.id_concepto] || c.descripcion || 'Concepto';
        return {
          id_concepto: c.id_concepto,
          nombre,
          monto: Number(c.monto || 0),
          prioridad: getPrioridadConcepto(nombre),
        };
      })
      .sort((a, b) => (a.prioridad !== b.prioridad ? a.prioridad - b.prioridad : a.nombre.localeCompare(b.nombre)));

    const totalMensual = itemsPrimerMes.reduce((acc, it) => acc + it.monto, 0);
    return { items: itemsPrimerMes, totalMensual };
  };

  // Obtener habitantes censados de un contrato
  const obtenerHabitantesContrato = (contrato) => {
    if (!contrato) return [];
    const idContrato = contrato.id_contrato || contrato.id;

    // Priorizar el estado sincronizado en habitantesAll si tiene registros para este contrato
    const delEstadoGlobal = habitantesAll.filter(
      h => Number(h.id_contrato) === Number(idContrato) && (h.estado || 'ACTIVO').toUpperCase() === 'ACTIVO'
    );
    if (delEstadoGlobal.length > 0) return delEstadoGlobal;

    if (Array.isArray(contrato.habitantes)) {
      return contrato.habitantes.filter(
        h => (h.estado || 'ACTIVO').toUpperCase() === 'ACTIVO'
      );
    }

    return [];
  };

  // Guardar nuevo habitante o editar uno existente dentro del contrato seleccionado
  const handleGuardarHabitanteContrato = async (payloadHabitante) => {
    if (!contratoSeleccionado) return false;
    const idContrato = contratoSeleccionado.id_contrato || contratoSeleccionado.id;

    // Eliminar propiedades de control local antes de enviar al DTO del backend
    const { id_temp, id_habitante, ...datosLimpiados } = payloadHabitante;

    setGuardandoHabitante(true);
    try {
      if (habitanteEditando && habitanteEditando.id_habitante) {
        const actualizado = await actualizarHabitanteContrato(
          habitanteEditando.id_habitante,
          datosLimpiados
        );

        setHabitantesAll((prev) =>
          prev.map((h) =>
            Number(h.id_habitante) === Number(habitanteEditando.id_habitante)
              ? { ...h, ...actualizado }
              : h
          )
        );
        setContratos((prev) =>
          prev.map((c) => {
            if (Number(c.id_contrato || c.id) !== Number(idContrato)) return c;
            const listaActual = Array.isArray(c.habitantes) ? c.habitantes : [];
            return {
              ...c,
              habitantes: listaActual.map((h) =>
                Number(h.id_habitante) === Number(habitanteEditando.id_habitante)
                  ? { ...h, ...actualizado }
                  : h
              ),
            };
          })
        );
        toast.success('Datos del habitante actualizados');
      } else {
        const creado = await agregarHabitanteContrato(idContrato, datosLimpiados);

        setHabitantesAll((prev) => [...prev, creado]);
        setContratos((prev) =>
          prev.map((c) => {
            if (Number(c.id_contrato || c.id) !== Number(idContrato)) return c;
            const listaActual = Array.isArray(c.habitantes) ? c.habitantes : [];
            return {
              ...c,
              habitantes: [...listaActual, creado],
            };
          })
        );
        toast.success('Habitante agregado al contrato');
      }

      setHabitanteEditando(null);
      return true;
    } catch (error) {
      console.error('Error guardando habitante:', error);
      toast.error(error.message || 'No se pudo guardar el habitante');
      return false;
    } finally {
      setGuardandoHabitante(false);
    }
  };

  // Dar de baja un habitante del contrato
  const handleEliminarHabitanteContrato = async (habitante) => {
    if (!contratoSeleccionado || !habitante?.id_habitante) return;
    const idContrato = contratoSeleccionado.id_contrato || contratoSeleccionado.id;

    const toastId = toast.loading('Quitando habitante del contrato...');
    try {
      await eliminarHabitanteContrato(habitante.id_habitante);

      setHabitantesAll((prev) =>
        prev.filter((h) => Number(h.id_habitante) !== Number(habitante.id_habitante))
      );
      setContratos((prev) =>
        prev.map((c) => {
          if (Number(c.id_contrato || c.id) !== Number(idContrato)) return c;
          const listaActual = Array.isArray(c.habitantes) ? c.habitantes : [];
          return {
            ...c,
            habitantes: listaActual.filter(
              (h) => Number(h.id_habitante) !== Number(habitante.id_habitante)
            ),
          };
        })
      );

      toast.success('Habitante retirado del censo', { id: toastId });
    } catch (error) {
      console.error('Error eliminando habitante:', error);
      toast.error(error.message || 'No se pudo quitar el habitante', { id: toastId });
    }
  };

  // Abrir modal de detalle y consultar documentos digitales adjuntos
  const handleAbrirDetalle = async (contrato) => {
    setContratoSeleccionado(contrato);
    setDocumentosDetalle([]);
    setLoadingDetalle(true);

    try {
      const idContrato = contrato.id_contrato || contrato.id;
      const docs = await obtenerDocumentosContrato(idContrato);
      setDocumentosDetalle(Array.isArray(docs) ? docs : []);
    } catch (error) {
      console.warn('No se pudieron cargar los documentos adjuntos:', error);
      setDocumentosDetalle([]);
    } finally {
      setLoadingDetalle(false);
    }
  };

  // Generar y descargar PDF protocolizado directamente
  const handleDescargarPDFContrato = (contrato) => {
    const doc = new jsPDF();
    const u = usuariosRawMap[contrato.id_usuario] || {};
    const nombreCompletoInquilino = `${u.nombre || ''} ${u.primer_apellido || ''} ${u.segundo_apellido || ''}`.trim() || 'Inquilino';
    const codigoUnidad = deptosCodigoMap[contrato.id_departamento];
    const deptoTexto = deptosMap[contrato.id_departamento] || 'Ubicación Residencial';
    const inmuebleTexto = codigoUnidad ? `[${codigoUnidad}] ${deptoTexto}` : deptoTexto;
    const moneda = contrato.moneda || 'BOB';
    const fechaEmisionHoy = new Date().toLocaleDateString('es-ES');

    const habitantesContrato = obtenerHabitantesContrato(contrato);
    const dependientes = habitantesContrato.filter(h => (h.es_titular || '').toUpperCase() !== 'SI');
    const totalPersonas = Math.max(1, habitantesContrato.length || (1 + dependientes.length));

    const { items: itemsFinancieros, totalMensual } = obtenerDesgloseFinancieroContrato(contrato);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('DOCUMENTO PRIVADO DE CONTRATO DE ALQUILER', 105, 20, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Fecha de Emisión: ${fechaEmisionHoy}`, 20, 28);

    doc.setDrawColor(203, 213, 225);
    doc.line(20, 32, 190, 32);

    // 1. Partes y ubicación del inmueble
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('1. PARTES Y UBICACIÓN DEL INMUEBLE', 20, 42);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Inmueble: ${inmuebleTexto}`, 25, 50);
    doc.text(`Inquilino / Arrendatario: ${nombreCompletoInquilino}`, 25, 57);
    doc.text(
      `Documento: ${u.ci_nit || 'N/A'}  •  Nacionalidad: ${u.nacionalidad || 'Boliviana'}`,
      25,
      64
    );
    doc.text(
      `Tipo de Contrato: ${contrato.estado || 'DIRECTO'}  •  Llaves Entregadas: ${contrato.numero_llaves ?? 1} juego(s)`,
      25,
      71
    );

    let yPos = 78;
    doc.text(
      `Total Habitantes Autorizados: ${totalPersonas} persona(s)`,
      25,
      yPos
    );

    if (habitantesContrato.length > 0) {
      yPos += 6;
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const listaNombres = habitantesContrato
        .map(
          h =>
            `${h.nombres} ${h.primer_apellido}${h.ci_nit ? ` (CI: ${h.ci_nit})` : ''} - ${h.parentesco || 'Ocupante'}`
        )
        .join(', ');
      doc.text(`Habitantes: ${listaNombres}`, 28, yPos, { maxWidth: 160 });
      yPos += 10;
    }

    // 2. Vigencia y plazo
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('2. VIGENCIA Y PLAZO', 20, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPos += 8;
    doc.text(`Inicio de Vigencia: ${formatFechaDMY(contrato.fecha_inicio)}`, 25, yPos);
    yPos += 7;
    doc.text(`Fin de Vigencia: ${formatFechaDMY(contrato.fecha_fin)}`, 25, yPos);
    yPos += 7;
    doc.text(`Periodo Límite de Pago: ${calcularPeriodoLimitePago(contrato.fecha_inicio)}`, 25, yPos);

    // 3. Condiciones financieras
    yPos += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. CONDICIONES FINANCIERAS', 20, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    let numItem = 1;
    yPos += 8;
    doc.text(
      `${numItem}. Depósito de Garantía: ${Number(contrato.garantia || 0).toFixed(2)} ${moneda}`,
      25,
      yPos
    );

    itemsFinancieros.forEach(item => {
      numItem += 1;
      yPos += 7;
      doc.text(`${numItem}. ${item.nombre}: ${Number(item.monto).toFixed(2)} ${moneda}`, 25, yPos);
    });

    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(
      `TOTAL MENSUAL RECURRENTE (Sin Garantía): ${totalMensual.toFixed(2)} ${moneda}`,
      25,
      yPos
    );

    // Firmas
    doc.setTextColor(15, 23, 42);
    doc.setDrawColor(148, 163, 184);
    doc.line(25, 240, 85, 240);
    doc.line(125, 240, 185, 240);

    doc.setFontSize(9);
    doc.text('PROPIETARIO / ADMINISTRADOR', 55, 246, { align: 'center' });
    doc.text('ARRENDATARIO / INQUILINO', 155, 246, { align: 'center' });

    const fechaLimpia = formatFechaDMY(contrato.fecha_inicio).replace(/\//g, '-');
    doc.save(`Contrato_${codigoUnidad || 'Unidad'}_${u.primer_apellido || 'Inquilino'}_${fechaLimpia}.pdf`);
    toast.success('Contrato PDF descargado');

    if (onVerDocumentoClick) {
      onVerDocumentoClick(contrato);
    }
  };

  const confirmarEliminacion = async () => {
    if (!contratoAEliminar) return;

    const id = contratoAEliminar.id_contrato || contratoAEliminar.id;
    setEliminando(true);
    const toastId = toast.loading('Eliminando contrato...');

    try {
      await eliminarContrato(id);
      toast.success('Contrato eliminado exitosamente', { id: toastId });
      setContratos(prev => prev.filter(c => (c.id_contrato || c.id) !== id));
      
      if (contratoSeleccionado && (contratoSeleccionado.id_contrato || contratoSeleccionado.id) === id) {
        setContratoSeleccionado(null);
      }
      setContratoAEliminar(null);
    } catch (error) {
      toast.error(error.message || 'Error al eliminar contrato', { id: toastId });
    } finally {
      setEliminando(false);
    }
  };

  const stats = useMemo(() => {
    const total = contratos.length;
    const finalizados = contratos.filter(c => ['FINALIZADO', 'CANCELADO'].includes((c.estado || '').toUpperCase())).length;
    const terceros = contratos.filter(c => (c.estado || '').toUpperCase() === 'TERCEROS').length;
    const vigentes = total - finalizados;
    return { total, vigentes, terceros, finalizados };
  }, [contratos]);

  // Filtrado compuesto por Edificio, Estado y Buscador general
  const contratosFiltrados = useMemo(() => {
    return contratos.filter((c) => {
      const term = busqueda.toLowerCase().trim();
      const codigoUnidad = (deptosCodigoMap[c.id_departamento] || '').toLowerCase();
      const deptoNombre = deptosMap[c.id_departamento] || c.departamentoNombre || '';
      const inquilinoNombre = usuariosMap[c.id_usuario] || c.inquilinoNombre || '';
      const deptoObj = deptosRawMap[c.id_departamento];
      const est = (c.estado || 'DIRECTO').toUpperCase();

      if (filtroEdificio && deptoObj) {
        if (String(deptoObj.id_edificio) !== String(filtroEdificio)) {
          return false;
        }
      }

      if (tabEstado === 'VIGENTES' && ['FINALIZADO', 'CANCELADO'].includes(est)) return false;
      if (tabEstado === 'TERCEROS' && est !== 'TERCEROS') return false;
      if (tabEstado === 'FINALIZADO' && !['FINALIZADO', 'CANCELADO'].includes(est)) return false;

      if (!term) return true;

      return (
        codigoUnidad.includes(term) ||
        deptoNombre.toLowerCase().includes(term) ||
        inquilinoNombre.toLowerCase().includes(term)
      );
    });
  }, [contratos, busqueda, filtroEdificio, tabEstado, deptosCodigoMap, deptosMap, usuariosMap, deptosRawMap]);

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
          <p className="text-sm text-slate-500">Administra acuerdos vigentes, censo de ocupantes, respaldos digitales y descargas PDF</p>
        </div>

        <button 
          onClick={onNuevoContratoClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          <Plus size={18} /> Registrar Contrato
        </button>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Contratos</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Vigentes</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stats.vigentes}</p>
        </div>
        <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl">
          <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">Para Terceros</span>
          <p className="text-2xl font-black text-purple-700 mt-1">{stats.terceros}</p>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Finalizados</span>
          <p className="text-2xl font-black text-slate-600 mt-1">{stats.finalizados}</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-2xl">
          <div className="sm:col-span-2 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-blue-600 focus-within:bg-white transition-all">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Buscar por codigo (ej. L21SB), inquilino, CI o depto..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="bg-transparent border-none outline-none ml-2 text-sm text-slate-800 w-full"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="relative flex items-center">
            <Building size={18} className="absolute left-3.5 text-slate-400 pointer-events-none" />
            <select
              value={filtroEdificio}
              onChange={(e) => setFiltroEdificio(e.target.value)}
              className="w-full py-2.5 pl-10 pr-6 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 focus:bg-white appearance-none cursor-pointer"
            >
              <option value="">Todos los Edificios</option>
              {edificiosList.map(ed => (
                <option key={ed.id} value={ed.id}>{ed.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs de estado */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setTabEstado('TODOS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tabEstado === 'TODOS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Todos ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setTabEstado('VIGENTES')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tabEstado === 'VIGENTES' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-600'
            }`}
          >
            Vigentes ({stats.vigentes})
          </button>
          <button
            type="button"
            onClick={() => setTabEstado('TERCEROS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tabEstado === 'TERCEROS' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-purple-600'
            }`}
          >
            Terceros ({stats.terceros})
          </button>
          <button
            type="button"
            onClick={() => setTabEstado('FINALIZADO')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tabEstado === 'FINALIZADO' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Finalizados ({stats.finalizados})
          </button>
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
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4">Unidad / Inquilino</th>
                <th className="py-4 px-4">Vigencia</th>
                <th className="py-4 px-4">Cuota Mensual / Garantía</th>
                <th className="py-4 px-4">Tipo / Estado</th>
                <th className="py-4 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {contratosFiltrados.length > 0 ? (
                contratosFiltrados.map((contrato) => {
                  const id = contrato.id_contrato || contrato.id;
                  const codigoUnidad = deptosCodigoMap[contrato.id_departamento];

                  const nombreDepto = deptosMap[contrato.id_departamento] 
                    || contrato.departamentoNombre 
                    || `Departamento #${contrato.id_departamento || 1}`;

                  const nombreInquilino = usuariosMap[contrato.id_usuario] 
                    || contrato.inquilinoNombre 
                    || `Inquilino #${contrato.id_usuario || 1}`;

                  const { totalMensual } = obtenerDesgloseFinancieroContrato(contrato);
                  const garantia = Number(contrato.garantia || 0);
                  const moneda = contrato.moneda || 'BOB';
                  const cantHabitantes = obtenerHabitantesContrato(contrato).length;

                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Unidad e Inquilino */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                            <FileText size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {codigoUnidad && (
                                <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-xs font-extrabold rounded-md tracking-wider">
                                  {codigoUnidad}
                                </span>
                              )}
                              <p className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                                <Home size={14} className="text-slate-400 shrink-0" /> {nombreDepto}
                              </p>
                            </div>
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                              <Users size={13} className="text-slate-400 shrink-0" /> {nombreInquilino}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-semibold">
                              <span className="inline-flex items-center gap-1">
                                <Key size={11} /> {contrato.numero_llaves ?? 1} llave(s)
                              </span>
                              {cantHabitantes > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{cantHabitantes} habitante(s)</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Fechas de Vigencia */}
                      <td className="py-4 px-4 text-slate-600">
                        <div className="flex items-center gap-1 text-xs font-semibold bg-slate-100 w-fit px-2.5 py-1 rounded-md">
                          <Calendar size={13} className="text-slate-400 shrink-0" />
                          {formatFechaDMY(contrato.fecha_inicio)} al {formatFechaDMY(contrato.fecha_fin)}
                        </div>
                      </td>

                      {/* Total Mensual y Garantía */}
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-slate-800 flex items-center gap-1">
                          <DollarSign size={15} className="text-slate-400 shrink-0" />
                          {totalMensual.toFixed(2)} <span className="text-xs font-bold text-slate-400">{moneda}/mes</span>
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
                          <button 
                            type="button"
                            onClick={() => handleAbrirDetalle(contrato)}
                            title="Ver Detalle Completo"
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye size={17} />
                          </button>

                          <button 
                            type="button"
                            onClick={() => setContratoAEditar(contrato)}
                            title="Editar Contrato"
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 size={17} />
                          </button>

                          <button 
                            type="button"
                            onClick={() => handleDescargarPDFContrato(contrato)}
                            title="Descargar Contrato PDF"
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Printer size={17} />
                          </button>

                          <button 
                            type="button"
                            onClick={() => setContratoAEliminar(contrato)}
                            title="Eliminar Contrato"
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
                    ID #{contratoSeleccionado.id_contrato || contratoSeleccionado.id}
                    {deptosCodigoMap[contratoSeleccionado.id_departamento] ? ` • Unidad ${deptosCodigoMap[contratoSeleccionado.id_departamento]}` : ''}
                    {` • Estado: ${contratoSeleccionado.estado || 'DIRECTO'}`}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setContratoSeleccionado(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido del Detalle */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-sm">
              
              {/* 1. Datos del Inquilino */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <UserCheck size={15} className="text-blue-600" /> Información del Inquilino Titular
                </h4>
                {(() => {
                  const u = usuariosRawMap[contratoSeleccionado.id_usuario] || {};
                  return (
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
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
                        <span className="text-slate-500">Nacionalidad:</span>
                        <p className="font-semibold text-slate-800">{u.nacionalidad || 'Boliviana'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Teléfono / Celular:</span>
                        <p className="font-semibold text-slate-800">{u.telefono || 'Sin teléfono'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500">Correo Electrónico:</span>
                        <p className="font-semibold text-slate-800">{u.email || 'Sin correo'}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 2. Inmueble, Llaves y Vigencia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Home size={15} className="text-blue-600" /> Ubicación y Entrega
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {deptosCodigoMap[contratoSeleccionado.id_departamento] && (
                      <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-[11px] font-extrabold rounded">
                        {deptosCodigoMap[contratoSeleccionado.id_departamento]}
                      </span>
                    )}
                    <p className="font-bold text-slate-800 text-xs">
                      {deptosMap[contratoSeleccionado.id_departamento] || 'Departamento'}
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Key size={13} className="text-slate-400" /> Llaves Entregadas: <strong className="text-slate-800">{contratoSeleccionado.numero_llaves ?? 1} juego(s)</strong>
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Calendar size={15} className="text-blue-600" /> Vigencia y Plazo
                  </h4>
                  <p className="font-bold text-slate-800 text-xs">
                    Del {formatFechaDMY(contratoSeleccionado.fecha_inicio)} al {formatFechaDMY(contratoSeleccionado.fecha_fin)}
                  </p>
                  <p className="text-xs text-blue-700 font-semibold flex items-center gap-1">
                    <Clock size={12} /> {calcularPeriodoLimitePago(contratoSeleccionado.fecha_inicio)}
                  </p>
                </div>
              </div>

              {/* 3. Censo de Habitantes / Ocupantes (Agregar / Editar / Quitar) */}
              <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={15} className="text-blue-600" /> Censo de Habitantes / Ocupantes ({obtenerHabitantesContrato(contratoSeleccionado).length})
                  </h4>

                  <button
                    type="button"
                    onClick={() => {
                      setHabitanteEditando(null);
                      setModalHabitanteAbierto(true);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <UserPlus size={13} /> Agregar Habitante
                  </button>
                </div>

                {(() => {
                  const habs = obtenerHabitantesContrato(contratoSeleccionado);
                  if (habs.length === 0) {
                    return (
                      <p className="text-xs text-slate-500 bg-white/80 p-3 rounded-lg border border-dashed border-blue-200 text-center">
                        No hay registros en el censo de ocupantes. Usa <strong>"Agregar Habitante"</strong> para registrar al titular o dependientes.
                      </p>
                    );
                  }
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {habs.map((h, idx) => (
                        <div
                          key={h.id_habitante || idx}
                          className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm text-xs flex items-start justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-800 truncate">
                              {h.nombres} {h.primer_apellido} {h.segundo_apellido || ''}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              <span className="text-blue-600 font-bold">{h.parentesco || 'Ocupante'}</span> • CI: <strong>{h.ci_nit || 'S/C'}</strong>
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Nac: {h.nacionalidad || 'Boliviana'}{h.telefono ? ` • Tel: ${h.telefono}` : ''}
                            </p>
                          </div>

                          {h.id_habitante && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setHabitanteEditando(h);
                                  setModalHabitanteAbierto(true);
                                }}
                                title="Editar datos del habitante"
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEliminarHabitanteContrato(h)}
                                title="Quitar habitante del censo"
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* 4. Desglose Completo de Condiciones Financieras */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CreditCard size={15} className="text-blue-600" /> Condiciones Financieras y Servicios
                </h4>
                {(() => {
                  const { items, totalMensual } = obtenerDesgloseFinancieroContrato(contratoSeleccionado);
                  const moneda = contratoSeleccionado.moneda || 'BOB';
                  return (
                    <>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                          <span className="font-semibold text-slate-700">1. Depósito de Garantía (Custodia):</span>
                          <span className="font-extrabold text-slate-900">
                            {Number(contratoSeleccionado.garantia || 0).toFixed(2)} {moneda}
                          </span>
                        </div>

                        {items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-100">
                            <span className="font-semibold text-slate-700">{idx + 2}. {item.nombre}:</span>
                            <span className="font-extrabold text-blue-600">
                              {item.monto.toFixed(2)} {moneda}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex justify-between items-center">
                        <span className="font-bold text-xs uppercase text-blue-900">Total Mensual Recurrente:</span>
                        <span className="text-base font-black text-blue-900">
                          {totalMensual.toFixed(2)} {moneda} / mes
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* 5. Documentos Digitales Adjuntos */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Paperclip size={15} className="text-blue-600" /> Documentos Digitales de Respaldo
                </h4>
                {loadingDetalle ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                    <Loader2 size={14} className="animate-spin text-blue-600" /> Cargando archivos adjuntos...
                  </div>
                ) : documentosDetalle.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {documentosDetalle.map((doc) => (
                      <a
                        key={doc.id_contrato_documento || doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-lg text-xs transition-colors group"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-extrabold text-slate-800 block truncate">{doc.nombre}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">{doc.tipo_archivo || 'ARCHIVO'}</span>
                        </div>
                        <ExternalLink size={14} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No se adjuntaron documentos digitales a este contrato.</p>
                )}
              </div>

            </div>

            {/* Pie del Modal */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
              <button
                type="button"
                onClick={() => setContratoSeleccionado(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors uppercase tracking-wider cursor-pointer"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const c = contratoSeleccionado;
                    setContratoSeleccionado(null);
                    setContratoAEditar(c);
                  }}
                  className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 size={14} /> Editar
                </button>

                <button
                  type="button"
                  onClick={() => handleDescargarPDFContrato(contratoSeleccionado)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 cursor-pointer"
                >
                  <Printer size={15} /> Descargar PDF Legal
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL AGREGAR / EDITAR HABITANTE DEL CONTRATO ================= */}
      <ModalNuevoHabitante
        isOpen={modalHabitanteAbierto}
        habitanteInicial={habitanteEditando}
        loading={guardandoHabitante}
        onClose={() => {
          setModalHabitanteAbierto(false);
          setHabitanteEditando(null);
        }}
        onAgregar={handleGuardarHabitanteContrato}
      />

      {/* ================= MODAL EDITAR CONTRATO ================= */}
      <ModalEditarContrato
        isOpen={Boolean(contratoAEditar)}
        contrato={contratoAEditar}
        onClose={() => setContratoAEditar(null)}
        onSave={(actualizado) => {
          const idAct = actualizado.id_contrato || actualizado.id;
          setContratos((prev) =>
            prev.map((c) => ((c.id_contrato || c.id) === idAct ? { ...c, ...actualizado } : c))
          );
        }}
      />

      {/* ================= MODAL CONFIRMAR ELIMINACIÓN ================= */}
      {contratoAEliminar && (
        <ModalConfirmarEliminar
          isOpen={Boolean(contratoAEliminar)}
          onClose={() => setContratoAEliminar(null)}
          onConfirm={confirmarEliminacion}
          loading={eliminando}
          titulo="¿Eliminar o rescindir contrato?"
          mensaje={`Estás a punto de eliminar el contrato para el inmueble "${deptosCodigoMap[contratoAEliminar.id_departamento] ? `[${deptosCodigoMap[contratoAEliminar.id_departamento]}] ` : ''}${deptosMap[contratoAEliminar.id_departamento] || 'Departamento'}" asignado a "${usuariosMap[contratoAEliminar.id_usuario] || 'Inquilino'}". Esta acción afectará el historial de cobros asociados.`}
        />
      )}

    </div>
  );
}