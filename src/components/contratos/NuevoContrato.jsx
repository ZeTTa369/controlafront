import { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Home, 
  User, 
  Users, 
  Calendar, 
  Clock, 
  Download, 
  CheckSquare, 
  Square, 
  Eye, 
  X, 
  Loader2, 
  Search, 
  ListChecks, 
  UserPlus, 
  Trash2, 
  Calculator, 
  Key, 
  Globe, 
  Paperclip, 
  FileUp, 
  Image as ImageIcon 
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';
import { ModalNuevoHabitante } from '../modals/ModalNuevoHabitante';
import { 
  crearContrato, 
  registrarHabitantesBatch, 
  subirDocumentosContrato 
} from '../../services/contratoService';
import { listarUsuarios, crearUsuario } from '../../services/usuarioService';
import { listarDepartamentos } from '../../services/departamentoService';
import { listarEdificios } from '../../services/edificioService';

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
  if (!fechaInicioStr) return { inicio: '17', fin: '20', texto: 'Del 17 al 20 de cada mes' };

  try {
    const [y, m, d] = fechaInicioStr.split('-').map(Number);
    const diaInicio = d;
    const diasEnElMes = new Date(y, m, 0).getDate();

    let diaFin;
    let mensajeExtra = 'de cada mes';

    if (diaInicio >= 30) {
      diaFin = 5;
      mensajeExtra = 'del siguiente mes';
    } else {
      diaFin = Math.ceil(diaInicio / 5) * 5;
      if (diaFin === diaInicio) {
        diaFin = diaInicio + 5;
      }
      if (diaFin > diasEnElMes) {
        diaFin = diasEnElMes;
      }
    }

    return {
      inicio: String(diaInicio),
      fin: String(diaFin),
      texto: `Del ${diaInicio} al ${diaFin} ${mensajeExtra}`
    };
  } catch (e) {
    return { inicio: '17', fin: '20', texto: 'Del 17 al 20 de cada mes' };
  }
};

export function NuevoContrato({ onClose, onSave }) {
  const [departamentosDisponibles, setDepartamentosDisponibles] = useState([]);
  const [conceptosBD, setConceptosBD] = useState([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  // Datos generales del contrato
  const [formData, setFormData] = useState({
    id_departamento: '',
    tipo_contrato: 'DIRECTO',
    fecha_inicio: '',
    fecha_fin: '',
    moneda: 'BOB',
    garantia: '1700',
    numero_llaves: '1',
    dia_limite_inicio: '17',
    dia_limite_fin: '20',
    texto_limite_pago: 'Del 17 al 20 de cada mes',
  });

  // Datos del inquilino titular
  const [inquilinoData, setInquilinoData] = useState({
    id_usuario: '',
    nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    ci_nit: '',
    nacionalidad: 'Boliviana',
    telefono: '',
    email: '',
  });

  // Censo de habitantes adicionales
  const [habitantes, setHabitantes] = useState([]);
  const [modalHabitanteAbierto, setModalHabitanteAbierto] = useState(false);

  // Documentos digitales de respaldo (PDF e imagenes)
  const [documentosAdjuntos, setDocumentosAdjuntos] = useState([]);
  const [etiquetaDocTemp, setEtiquetaDocTemp] = useState('CI Titular');

  // Calculo automatico de servicios basicos
  const [multiplicarServiciosAutomatico, setMultiplicarServiciosAutomatico] = useState(true);
  const PRECIO_UNITARIO_AGUA = 40;
  const PRECIO_UNITARIO_LUZ = 40;

  // Conceptos activos del contrato
  const [conceptosSeleccionados, setConceptosSeleccionados] = useState({});

  const [cobrosGenerados, setCobrosGenerados] = useState([]);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buscandoCI, setBuscandoCI] = useState(false);

  const totalPersonasHabitantes = useMemo(() => {
    return 1 + habitantes.length;
  }, [habitantes]);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  // Recalculo de cuotas de agua y luz segun total de habitantes
  useEffect(() => {
    if (!multiplicarServiciosAutomatico) return;

    setConceptosSeleccionados(prev => {
      const copy = { ...prev };
      let huboCambios = false;

      Object.keys(copy).forEach(idC => {
        const c = copy[idC];
        const n = (c.nombre || '').toUpperCase();
        if (n.includes('AGUA')) {
          copy[idC] = { ...c, monto: totalPersonasHabitantes * PRECIO_UNITARIO_AGUA };
          huboCambios = true;
        } else if (n.includes('LUZ') || n.includes('ELECTRIC')) {
          copy[idC] = { ...c, monto: totalPersonasHabitantes * PRECIO_UNITARIO_LUZ };
          huboCambios = true;
        }
      });

      return huboCambios ? copy : prev;
    });
  }, [totalPersonasHabitantes, multiplicarServiciosAutomatico]);

  // Carga de catalogos mediante la capa de servicios
  const cargarCatalogos = async () => {
    setLoadingCatalogos(true);
    try {
      const [dataDeptos, dataEdificios, resConceptos] = await Promise.all([
        listarDepartamentos(),
        listarEdificios(),
        fetch(`${BASE_URL}/conceptos`, { headers: getAuthHeaders() }),
      ]);

      const dataConceptos = await handleResponse(resConceptos);

      const mapEdificios = {};
      if (Array.isArray(dataEdificios)) {
        dataEdificios.forEach(e => {
          mapEdificios[e.id_edificio || e.id] = e.nombre;
        });
      }

      if (Array.isArray(dataDeptos)) {
        const deptosBD = dataDeptos
          .filter(d => (d.estado || '').toUpperCase() !== 'OCUPADO')
          .sort((a, b) => (a.piso || 1) - (b.piso || 1))
          .map(d => {
            const edNombre = mapEdificios[d.id_edificio] || 'Edificio';
            const num = d.numero_departamento || d.numero || 'S/N';
            return {
              id: d.id_departamento || d.id,
              texto: `${edNombre} - Piso ${d.piso || 1} Depto ${num}`,
              precio_alquiler: d.precio_alquiler || 1550,
              numero_llaves: d.numero_llaves !== null && d.numero_llaves !== undefined ? Number(d.numero_llaves) : 1
            };
          });

        setDepartamentosDisponibles(deptosBD);
        if (deptosBD.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            id_departamento: deptosBD[0].id,
            numero_llaves: String(deptosBD[0].numero_llaves)
          }));
        }
      }

      if (Array.isArray(dataConceptos)) {
        const ordenados = [...dataConceptos].sort((a, b) => {
          const pA = getPrioridadConcepto(a.nombre);
          const pB = getPrioridadConcepto(b.nombre);
          if (pA !== pB) return pA - pB;
          return a.nombre.localeCompare(b.nombre);
        });

        setConceptosBD(ordenados);
      }
    } catch (error) {
      console.error('Error cargando catalogos:', error);
      toast.error('Error al conectar con los catalogos del servidor');
    } finally {
      setLoadingCatalogos(false);
    }
  };

  // Al cambiar de departamento, sincroniza la cantidad de llaves por defecto
  const handleDepartamentoChange = (e) => {
    const idSeleccionado = e.target.value;
    const deptoObj = departamentosDisponibles.find(d => String(d.id) === String(idSeleccionado));

    setFormData(prev => ({
      ...prev,
      id_departamento: idSeleccionado,
      numero_llaves: deptoObj ? String(deptoObj.numero_llaves) : '1'
    }));
  };

  const handleFechaInicioChange = (e) => {
    const nuevaFecha = e.target.value;
    const rango = calcularPeriodoLimitePago(nuevaFecha);

    setFormData(prev => ({
      ...prev,
      fecha_inicio: nuevaFecha,
      dia_limite_inicio: rango.inicio,
      dia_limite_fin: rango.fin,
      texto_limite_pago: rango.texto
    }));
  };

  const handleConceptoToggle = (concepto) => {
    const id = concepto.id_concepto || concepto.id;
    const n = (concepto.nombre || '').toUpperCase();
    let montoCalculado = Number(concepto.monto_sugerido || concepto.monto || 0);

    if (multiplicarServiciosAutomatico) {
      if (n.includes('AGUA')) montoCalculado = totalPersonasHabitantes * PRECIO_UNITARIO_AGUA;
      if (n.includes('LUZ') || n.includes('ELECTRIC')) montoCalculado = totalPersonasHabitantes * PRECIO_UNITARIO_LUZ;
    }

    setConceptosSeleccionados(prev => {
      const existe = prev[id]?.seleccionado;
      if (existe) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      } else {
        return {
          ...prev,
          [id]: {
            seleccionado: true,
            monto: montoCalculado,
            nombre: concepto.nombre,
            prioridad: getPrioridadConcepto(concepto.nombre)
          }
        };
      }
    });
  };

  const handleMontoChange = (id_concepto, nuevoMonto) => {
    setConceptosSeleccionados(prev => ({
      ...prev,
      [id_concepto]: {
        ...prev[id_concepto],
        monto: parseFloat(nuevoMonto) || 0
      }
    }));
  };

  const handleAgregarHabitante = (nuevo) => {
    setHabitantes(prev => [...prev, nuevo]);
  };

  const handleEliminarHabitante = (idTemp) => {
    setHabitantes(prev => prev.filter(h => h.id_temp !== idTemp));
    toast.success('Habitante eliminado de la lista');
  };

  // Manejo de seleccion de archivos PDF e imagenes de respaldo
  const handleSeleccionarArchivos = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const nuevos = files.map((file) => ({
      id_temp: `${Date.now()}_${Math.random()}`,
      file,
      etiqueta: etiquetaDocTemp || file.name,
      esPdf: file.type === 'application/pdf',
    }));

    setDocumentosAdjuntos((prev) => [...prev, ...nuevos]);
    toast.success(`${files.length} archivo(s) preparado(s) para subir`);
    e.target.value = '';
  };

  const handleQuitarDocumento = (idTemp) => {
    setDocumentosAdjuntos((prev) => prev.filter((d) => d.id_temp !== idTemp));
  };

  const listaConceptosActivosOrdenados = useMemo(() => {
    return Object.keys(conceptosSeleccionados)
      .filter(id => conceptosSeleccionados[id]?.seleccionado)
      .map(id => ({
        id_concepto: Number(id),
        ...conceptosSeleccionados[id]
      }))
      .sort((a, b) => {
        if (a.prioridad !== b.prioridad) return a.prioridad - b.prioridad;
        return a.nombre.localeCompare(b.nombre);
      });
  }, [conceptosSeleccionados]);

  const totalMensualRecurrente = useMemo(() => {
    return listaConceptosActivosOrdenados.reduce((acc, c) => acc + (parseFloat(c.monto) || 0), 0);
  }, [listaConceptosActivosOrdenados]);

  // Busqueda de inquilino existente por cedula de identidad
  const buscarInquilinoPorCI = async () => {
    if (!inquilinoData.ci_nit.trim()) {
      toast.error('Ingresa un CI/NIT para buscar');
      return;
    }

    setBuscandoCI(true);
    try {
      const usuarios = await listarUsuarios();
      const encontrado = Array.isArray(usuarios) 
        ? usuarios.find(u => String(u.ci_nit).trim() === inquilinoData.ci_nit.trim())
        : null;

      if (encontrado) {
        setInquilinoData({
          id_usuario: encontrado.id_usuario || encontrado.id,
          nombre: encontrado.nombre || '',
          primer_apellido: encontrado.primer_apellido || '',
          segundo_apellido: encontrado.segundo_apellido || '',
          ci_nit: encontrado.ci_nit || '',
          nacionalidad: encontrado.nacionalidad || 'Boliviana',
          telefono: encontrado.telefono || '',
          email: encontrado.email || '',
        });
        toast.success(`Inquilino encontrado: ${encontrado.nombre} ${encontrado.primer_apellido}`);
      } else {
        toast('No existe registro previo. Completa los datos para crearlo automaticamente.');
      }
    } catch (error) {
      toast.error('Error al consultar usuarios en el servidor');
    } finally {
      setBuscandoCI(false);
    }
  };

  const formatearFechaDMY = (fechaStr) => {
    if (!fechaStr) return '';
    const [y, m, d] = fechaStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // Proyeccion de cuotas mensuales
  const calcularVistaPreviaCobros = () => {
    if (!formData.fecha_inicio || !formData.fecha_fin) {
      toast.error('Ingresa la fecha de inicio y fin del contrato.');
      return;
    }

    if (listaConceptosActivosOrdenados.length === 0) {
      toast.error('Selecciona al menos un concepto en la checklist para calcular las cuotas.');
      return;
    }

    const [yIni, mIni, dIni] = formData.fecha_inicio.split('-').map(Number);
    const [yFin, mFin, dFin] = formData.fecha_fin.split('-').map(Number);

    const inicio = new Date(yIni, mIni - 1, dIni);
    const fin = new Date(yFin, mFin - 1, dFin);

    if (inicio >= fin) {
      toast.error('La fecha de finalizacion debe ser posterior a la de inicio.');
      return;
    }

    let mesesDiferencia = (yFin - yIni) * 12 + (mFin - mIni);
    if (dFin >= dIni) mesesDiferencia += 1;
    mesesDiferencia = Math.max(1, mesesDiferencia);

    const listaTemporal = [];
    for (let i = 0; i < mesesDiferencia; i++) {
      const fechaActual = new Date(yIni, mIni - 1 + i, 1);
      const mes = fechaActual.getMonth() + 1;
      const anio = fechaActual.getFullYear();

      listaConceptosActivosOrdenados.forEach(c => {
        if (c.monto > 0) {
          listaTemporal.push({
            periodo_mes: mes,
            periodo_anio: anio,
            id_concepto: c.id_concepto,
            nombre_concepto: c.nombre,
            monto: c.monto,
            fecha_emision: `${String(formData.dia_limite_inicio).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`
          });
        }
      });
    }

    setCobrosGenerados(listaTemporal);
    setMostrarVistaPrevia(true);
    toast.success(`Se generaron ${listaTemporal.length} cuotas programadas.`);
  };

  // Generacion de documento PDF protocolizado
  const generarPDFContrato = () => {
    const doc = new jsPDF();
    const deptoObj = departamentosDisponibles.find(d => String(d.id) === String(formData.id_departamento));
    const nombreCompletoInquilino = `${inquilinoData.nombre} ${inquilinoData.primer_apellido} ${inquilinoData.segundo_apellido || ''}`.trim();
    const fechaEmisionHoy = new Date().toLocaleDateString('es-ES');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("DOCUMENTO PRIVADO DE CONTRATO DE ALQUILER", 105, 20, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Fecha de Emision: ${fechaEmisionHoy}`, 20, 28);

    doc.setDrawColor(203, 213, 225);
    doc.line(20, 32, 190, 32);

    // 1. Partes y ubicacion del inmueble
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("1. PARTES Y UBICACION DEL INMUEBLE", 20, 42);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Inmueble: ${deptoObj?.texto || 'Ubicacion Residencial'}`, 25, 50);
    doc.text(`Inquilino / Arrendatario: ${nombreCompletoInquilino}`, 25, 57);
    doc.text(`Documento: ${inquilinoData.ci_nit} • Nacionalidad: ${inquilinoData.nacionalidad || 'Boliviana'}`, 25, 64);
    doc.text(`Tipo de Contrato: ${formData.tipo_contrato} • Llaves Entregadas: ${formData.numero_llaves || 1} juego(s)`, 25, 71);
    
    let yPos = 78;
    doc.text(`Total Habitantes Autorizados: ${totalPersonasHabitantes} personas (${inquilinoData.nombre} + ${habitantes.length} dependientes)`, 25, yPos);

    if (habitantes.length > 0) {
      yPos += 6;
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const nombresHabitantes = habitantes.map(h => 
        `${h.nombres} ${h.primer_apellido}${h.ci_nit ? ` (CI: ${h.ci_nit})` : ''} - Nac: ${h.nacionalidad || 'Boliviana'} - ${h.parentesco}`
      ).join(', ');
      doc.text(`Habitantes: ${nombresHabitantes}`, 28, yPos, { maxWidth: 160 });
      yPos += 8;
    }

    // 2. Vigencia y plazo
    yPos += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("2. VIGENCIA Y PLAZO", 20, yPos);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    yPos += 8;
    doc.text(`Inicio de Vigencia: ${formatearFechaDMY(formData.fecha_inicio)}`, 25, yPos);
    yPos += 7;
    doc.text(`Fin de Vigencia: ${formatearFechaDMY(formData.fecha_fin)}`, 25, yPos);
    yPos += 7;
    doc.text(`Periodo Limite de Pago: ${formData.texto_limite_pago}`, 25, yPos);

    // 3. Condiciones financieras
    yPos += 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("3. CONDICIONES FINANCIERAS", 20, yPos);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    let numItem = 1;
    yPos += 8;
    doc.text(`${numItem}. Deposito de Garantia: ${Number(formData.garantia || 0).toFixed(2)} ${formData.moneda}`, 25, yPos);

    listaConceptosActivosOrdenados.forEach(c => {
      numItem += 1;
      yPos += 7;
      doc.text(`${numItem}. ${c.nombre}: ${Number(c.monto).toFixed(2)} ${formData.moneda}`, 25, yPos);
    });

    yPos += 10;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text(
      `TOTAL MENSUAL RECURRENTE (Sin Garantia): ${totalMensualRecurrente.toFixed(2)} ${formData.moneda}`, 
      25, 
      yPos
    );

    // Firmas
    doc.setTextColor(15, 23, 42);
    doc.setDrawColor(148, 163, 184);
    doc.line(25, 240, 85, 240);
    doc.line(125, 240, 185, 240);

    doc.setFontSize(9);
    doc.text("PROPIETARIO / ADMINISTRADOR", 55, 246, { align: "center" });
    doc.text("ARRENDATARIO / INQUILINO", 155, 246, { align: "center" });

    const fechaLimpia = formatearFechaDMY(formData.fecha_inicio).replace(/\//g, '-');
    doc.save(`Contrato_${inquilinoData.primer_apellido || 'Inquilino'}_${fechaLimpia}.pdf`);
  };

  // Persistencia completa en cascada
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mostrarVistaPrevia || cobrosGenerados.length === 0) {
      toast.error('Genera y verifica la vista previa de cobros antes de guardar.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Guardando contrato, inquilino, censo y respaldos...');

    try {
      let idUsuarioFinal = inquilinoData.id_usuario;

      // 1. Crear cuenta de acceso en usuarios si no existe previamente
      if (!idUsuarioFinal) {
        const passwordBase = String(inquilinoData.ci_nit).trim().length >= 6 
          ? String(inquilinoData.ci_nit).trim() 
          : '123456';

        const nuevoUser = await crearUsuario({
          nombre: inquilinoData.nombre.trim(),
          primer_apellido: inquilinoData.primer_apellido.trim(),
          segundo_apellido: inquilinoData.segundo_apellido?.trim() || null,
          ci_nit: inquilinoData.ci_nit.trim(),
          telefono: inquilinoData.telefono?.trim() || null,
          email: inquilinoData.email?.trim() || `inquilino_${inquilinoData.ci_nit}@residencial.com`,
          password: passwordBase,
          rol: 3,
          estado: 'ACTIVO',
        });

        idUsuarioFinal = nuevoUser.id_usuario || nuevoUser.id;
      }

      // 2. Registrar el contrato principal
      const conceptosIds = listaConceptosActivosOrdenados.map(c => c.id_concepto);
      const conceptosDetalle = listaConceptosActivosOrdenados.map(c => ({
        id_concepto: Number(c.id_concepto),
        monto: Number(c.monto) || 0,
      }));

      // Extraer el monto especifico del alquiler (si existe) para monto_renta
      const conceptoAlquiler = listaConceptosActivosOrdenados.find(c => {
        const n = (c.nombre || '').toUpperCase();
        return n.includes('ALQUILER') || n.includes('RENTA') || n.includes('CANON');
      });
      const montoSoloAlquiler = conceptoAlquiler ? Number(conceptoAlquiler.monto) : Number(totalMensualRecurrente);

      const payloadContrato = {
        id_departamento: Number(formData.id_departamento),
        id_usuario: Number(idUsuarioFinal),
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        monto_renta: montoSoloAlquiler,
        moneda: formData.moneda,
        garantia: parseFloat(formData.garantia) || 0,
        numero_llaves: Number(formData.numero_llaves) || 1,
        estado: formData.tipo_contrato,
        conceptosIds: conceptosIds,
        conceptosDetalle: conceptosDetalle,
      };

      const dataContrato = await crearContrato(payloadContrato);
      const nuevoIdContrato = dataContrato.id_contrato || dataContrato.id;

      // 3. Registrar censo completo en la tabla habitantes (Titular + Dependientes)
      if (nuevoIdContrato) {
        const listaCenso = [];

        if (formData.tipo_contrato !== 'TERCEROS') {
          listaCenso.push({
            id_contrato: Number(nuevoIdContrato),
            id_departamento: Number(formData.id_departamento),
            nombres: inquilinoData.nombre.trim(),
            primer_apellido: inquilinoData.primer_apellido.trim(),
            segundo_apellido: inquilinoData.segundo_apellido?.trim() || null,
            ci_nit: inquilinoData.ci_nit.trim(),
            nacionalidad: inquilinoData.nacionalidad?.trim() || 'Boliviana',
            parentesco: 'Titular',
            telefono: inquilinoData.telefono?.trim() || null,
            es_titular: 'SI',
            estado: 'ACTIVO',
          });
        }

        habitantes.forEach(h => {
          listaCenso.push({
            id_contrato: Number(nuevoIdContrato),
            id_departamento: Number(formData.id_departamento),
            nombres: h.nombres,
            primer_apellido: h.primer_apellido,
            segundo_apellido: h.segundo_apellido || null,
            ci_nit: h.ci_nit || null,
            nacionalidad: h.nacionalidad || 'Boliviana',
            parentesco: h.parentesco || 'Familiar',
            telefono: h.telefono || null,
            es_titular: 'NO',
            estado: 'ACTIVO',
          });
        });

        if (listaCenso.length > 0) {
          await registrarHabitantesBatch(listaCenso);
        }

        // 4. Subir documentos digitales de respaldo (PDF e imagenes) si se adjuntaron
        if (documentosAdjuntos.length > 0) {
          await subirDocumentosContrato(nuevoIdContrato, documentosAdjuntos);
        }
      }

      generarPDFContrato();
      toast.success('Contrato, censo y documentos registrados exitosamente', { id: toastId });

      if (onSave) onSave(dataContrato);
      if (onClose) onClose();
    } catch (error) {
      toast.error(error.message || 'Error al guardar el contrato', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-w-4xl mx-auto animate-fade-in relative">
      
      {/* Cabecera */}
      <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">Registrar Nuevo Contrato</h2>
            <p className="text-sm text-slate-400">Inquilino, entrega de llaves, censo de habitantes y respaldos digitales</p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 cursor-pointer">
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">

        {/* 1. SELECCION DE UNIDAD, TIPO Y LLAVES ENTREGADAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Piso y Departamento</label>
            <div className="relative flex items-center">
              <Home size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
              <select
                name="id_departamento"
                required
                value={formData.id_departamento}
                onChange={handleDepartamentoChange}
                disabled={loadingCatalogos}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl font-bold appearance-none text-sm outline-none focus:border-blue-600 bg-white cursor-pointer"
              >
                {loadingCatalogos ? (
                  <option>Cargando unidades...</option>
                ) : departamentosDisponibles.length > 0 ? (
                  departamentosDisponibles.map(dep => (
                    <option key={dep.id} value={dep.id}>{dep.texto}</option>
                  ))
                ) : (
                  <option value="" disabled>No hay departamentos disponibles</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Contrato</label>
            <select
              name="tipo_contrato"
              value={formData.tipo_contrato}
              onChange={(e) => setFormData({ ...formData, tipo_contrato: e.target.value })}
              className="w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-600 bg-white appearance-none cursor-pointer"
            >
              <option value="DIRECTO">Contratante Directo</option>
              <option value="TERCEROS">Contratante para Terceros</option>
              <option value="RENOVACION">Renovacion</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Llaves Entregadas *</label>
            <div className="relative flex items-center">
              <Key size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="number"
                min="0"
                required
                value={formData.numero_llaves}
                onChange={(e) => setFormData({ ...formData, numero_llaves: e.target.value })}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl font-extrabold text-sm outline-none focus:border-blue-600 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Nota informativa cuando es contrato para terceros */}
        {formData.tipo_contrato === 'TERCEROS' && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-semibold text-blue-900">
            Nota: Para contratos celebrados a favor de terceros, registra al ocupante real directamente en la seccion inferior de Habitantes.
          </div>
        )}

        {/* 2. REGISTRO INQUILINO TITULAR */}
        <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <User size={18} className="text-blue-600" /> Datos del Inquilino Titular
              </h3>
              <p className="text-xs text-slate-500">Representante que firma el contrato y asume la responsabilidad legal</p>
            </div>
            
            <button
              type="button"
              onClick={buscarInquilinoPorCI}
              disabled={buscandoCI}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 self-start cursor-pointer"
            >
              <Search size={14} /> {buscandoCI ? 'Buscando...' : 'Autocompletar por CI'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">CI / NIT *</label>
              <input
                type="text"
                required
                placeholder="Ej. 6543210"
                value={inquilinoData.ci_nit}
                onChange={(e) => setInquilinoData({ ...inquilinoData, ci_nit: e.target.value })}
                className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm font-bold bg-white outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nombre(s) *</label>
              <input
                type="text"
                required
                placeholder="Ej. Graciela"
                value={inquilinoData.nombre}
                onChange={(e) => setInquilinoData({ ...inquilinoData, nombre: e.target.value })}
                className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm bg-white outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Primer Apellido *</label>
              <input
                type="text"
                required
                placeholder="Ej. Montoya"
                value={inquilinoData.primer_apellido}
                onChange={(e) => setInquilinoData({ ...inquilinoData, primer_apellido: e.target.value })}
                className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm bg-white outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Segundo Apellido</label>
              <input
                type="text"
                placeholder="Opcional"
                value={inquilinoData.segundo_apellido}
                onChange={(e) => setInquilinoData({ ...inquilinoData, segundo_apellido: e.target.value })}
                className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm bg-white outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nacionalidad *</label>
              <div className="relative flex items-center">
                <Globe size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Boliviana"
                  value={inquilinoData.nacionalidad}
                  onChange={(e) => setInquilinoData({ ...inquilinoData, nacionalidad: e.target.value })}
                  className="w-full py-2.5 pl-8 pr-3 border border-slate-300 rounded-xl text-sm font-semibold bg-white outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Telefono / Celular</label>
              <input
                type="text"
                placeholder="Ej. 70000000"
                value={inquilinoData.telefono}
                onChange={(e) => setInquilinoData({ ...inquilinoData, telefono: e.target.value })}
                className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm bg-white outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Correo Electronico</label>
              <input
                type="email"
                placeholder="inquilino@email.com"
                value={inquilinoData.email}
                onChange={(e) => setInquilinoData({ ...inquilinoData, email: e.target.value })}
                className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm bg-white outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* 3. SECCION DE HABITANTES / OCUPANTES */}
        <div className="border border-blue-200 bg-blue-50/40 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-800">
                  Habitantes y Ocupantes ({totalPersonasHabitantes} en total)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Titular + {habitantes.length} dependientes u ocupantes registrados
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMultiplicarServiciosAutomatico(!multiplicarServiciosAutomatico)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  multiplicarServiciosAutomatico 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                    : 'bg-white text-slate-600 border-slate-300'
                }`}
                title="Multiplica Agua y Luz automaticamente segun el total de personas (Bs. 40 c/u)"
              >
                <Calculator size={14} />
                <span>Multiplicar Agua/Luz x Persona ({totalPersonasHabitantes})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalHabitanteAbierto(true)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus size={14} /> Agregar Habitante
              </button>
            </div>
          </div>

          {/* Lista de habitantes registrados */}
          {habitantes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {habitantes.map((hab) => (
                <div key={hab.id_temp} className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-slate-800 text-sm">
                      {hab.nombres} {hab.primer_apellido} {hab.segundo_apellido}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      CI: <span className="font-bold text-slate-700">{hab.ci_nit || 'S/C'}</span> • Nac: <span className="font-semibold text-slate-700">{hab.nacionalidad}</span> • <span className="text-blue-600 font-semibold">{hab.parentesco}</span>
                      {hab.telefono && ` • Tel: ${hab.telefono}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEliminarHabitante(hab.id_temp)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3.5 bg-white/80 rounded-xl border border-dashed border-blue-200 text-center text-xs text-slate-500">
              No hay habitantes adicionales registrados. Solo residira el titular ({inquilinoData.nombre || 'Titular'}).
            </div>
          )}
        </div>

        {/* 4. VIGENCIA Y CALCULO DE PERIODO DE PAGO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Fecha de Inicio</label>
            <div className="relative flex items-center">
              <Calendar size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                required
                value={formData.fecha_inicio}
                onChange={handleFechaInicioChange}
                className="w-full py-3 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white font-medium text-sm outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Fecha de Finalizacion</label>
            <div className="relative flex items-center">
              <Calendar size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                required
                value={formData.fecha_fin}
                onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                className="w-full py-3 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white font-medium text-sm outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Periodo de Pago Limite</label>
            <div className="relative flex items-center">
              <Clock size={18} className="absolute left-4 text-blue-600 pointer-events-none" />
              <input
                type="text"
                readOnly
                value={formData.texto_limite_pago}
                className="w-full py-3 pl-11 pr-3 border-2 border-blue-200 bg-blue-50/50 rounded-xl text-blue-900 font-bold text-xs outline-none cursor-default"
              />
            </div>
          </div>
        </div>

        {/* 5. CHECKLIST DINAMICA DE CONCEPTOS */}
        <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50">
          <h3 className="text-base font-extrabold text-slate-800 mb-1 flex items-center gap-2">
            <ListChecks size={20} className="text-blue-600" /> Conceptos de Cobro (Base de Datos)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Marca los conceptos que aplican al contrato y personaliza libremente sus montos:
          </p>

          <div className="space-y-3">
            {conceptosBD.map(con => {
              const id = con.id_concepto || con.id;
              const estaSeleccionado = conceptosSeleccionados[id]?.seleccionado || false;
              const montoActual = conceptosSeleccionados[id]?.monto ?? Number(con.monto_sugerido || con.monto || 0);

              return (
                <div key={id} className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleConceptoToggle(con)}
                    className="flex items-center gap-3 text-left focus:outline-none cursor-pointer"
                  >
                    {estaSeleccionado ? (
                      <CheckSquare className="text-blue-600 shrink-0" size={20} />
                    ) : (
                      <Square className="text-slate-300 shrink-0" size={20} />
                    )}
                    <span className={`font-bold text-sm ${estaSeleccionado ? 'text-slate-900' : 'text-slate-500'}`}>
                      {con.nombre}
                    </span>
                  </button>

                  {estaSeleccionado && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Monto ({formData.moneda}):</span>
                      <input
                        type="number"
                        step="0.01"
                        value={montoActual}
                        onChange={(e) => handleMontoChange(id, e.target.value)}
                        className="w-28 py-1.5 px-3 border border-slate-300 rounded-lg text-sm font-extrabold text-blue-600 focus:border-blue-600 outline-none text-right"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. DESGLOSE FINANCIERO ORDENADO */}
        <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/40">
          <h3 className="text-base font-extrabold text-slate-800 mb-1">Desglose de Condiciones Financieras</h3>
          <p className="text-xs text-slate-500 mb-4">
            Resumen visual ordenado (1. Garantia, 2. Alquiler, 3. Expensas, 4. Agua, 5. Luz, etc.):
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <label className="block text-xs font-bold text-slate-700 mb-1">1. Dep. Garantia</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.garantia}
                onChange={(e) => setFormData({ ...formData, garantia: e.target.value })}
                className="w-full py-1.5 px-2 border border-slate-300 rounded-lg font-extrabold text-sm text-slate-800 bg-white outline-none focus:border-blue-600 text-right"
              />
            </div>

            {listaConceptosActivosOrdenados.map((c, index) => (
              <div key={c.id_concepto} className="bg-white p-3 rounded-xl border border-blue-200 shadow-sm animate-fade-in">
                <label className="block text-xs font-bold text-slate-700 mb-1 truncate" title={c.nombre}>
                  {index + 2}. {c.nombre}
                </label>
                <div className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg font-extrabold text-sm text-blue-600 text-right">
                  {Number(c.monto).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {listaConceptosActivosOrdenados.length === 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200 mt-3">
              Aun no has marcado ningun concepto en la checklist superior. Marca al menos el Alquiler para ver el desglose.
            </p>
          )}
        </div>

        {/* 7. DOCUMENTOS DE RESPALDO (CARNETS, CONTRATO ESCANEADO, INVENTARIO) */}
        <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Paperclip size={18} className="text-blue-600" /> Documentos de Respaldo (Opcional)
              </h3>
              <p className="text-xs text-slate-500">
                Adjunta carnets de identidad, contrato firmado escaneado o inventarios en formato PDF o imagen
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Tipo de Documento</label>
              <select
                value={etiquetaDocTemp}
                onChange={(e) => setEtiquetaDocTemp(e.target.value)}
                className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm font-bold bg-white outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="CI Titular">CI Titular</option>
                <option value="CI Habitante / Ocupante">CI Habitante / Ocupante</option>
                <option value="Contrato Firmado Escaneado">Contrato Firmado Escaneado</option>
                <option value="Acta de Entrega / Inventario">Acta de Entrega / Inventario</option>
                <option value="Comprobante Garantia">Comprobante Garantia</option>
                <option value="Otro Respaldo">Otro Respaldo</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex items-end">
              <label className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-700 rounded-xl text-sm font-bold cursor-pointer transition-colors">
                <FileUp size={18} />
                <span>Seleccionar Archivo PDF o Imagen (JPG, PNG)</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  onChange={handleSeleccionarArchivos}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {documentosAdjuntos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {documentosAdjuntos.map((doc) => (
                <div
                  key={doc.id_temp}
                  className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className={`p-2 rounded-lg shrink-0 ${doc.esPdf ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      {doc.esPdf ? <FileText size={16} /> : <ImageIcon size={16} />}
                    </div>
                    <div className="min-w-0">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold rounded bg-slate-100 text-slate-700 uppercase mb-0.5">
                        {doc.etiqueta}
                      </span>
                      <p className="text-xs font-semibold text-slate-700 truncate">{doc.file.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuitarDocumento(doc.id_temp)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RESUMEN TOTAL Y BOTON DE VISTA PREVIA */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-5 bg-blue-50 border border-blue-200 rounded-2xl gap-4">
          <div>
            <span className="text-xs font-bold uppercase text-blue-800 tracking-wider">Total Mensual Recurrente (Sin Garantia):</span>
            <p className="text-2xl font-black text-blue-900">{totalMensualRecurrente.toFixed(2)} {formData.moneda} / mes</p>
          </div>

          <button
            type="button"
            onClick={calcularVistaPreviaCobros}
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow flex items-center gap-2 cursor-pointer"
          >
            <Eye size={16} /> Generar Vista Previa de Cobros
          </button>
        </div>

        {/* 8. VISTA PREVIA DE CUOTAS */}
        {mostrarVistaPrevia && (
          <div className="border border-blue-200 bg-blue-50/30 rounded-2xl p-6 animate-fade-in">
            <h3 className="text-base font-extrabold text-blue-900 mb-1">Vista Previa de Cuotas ({cobrosGenerados.length} en total)</h3>
            <p className="text-xs text-slate-600 mb-4">Cobros programados automaticamente mes a mes:</p>

            <div className="max-h-56 overflow-y-auto border border-blue-100 rounded-xl bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-blue-100/50 text-blue-900 font-bold border-b border-blue-100 uppercase">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Periodo (Mes / Anio)</th>
                    <th className="py-2.5 px-4">Concepto</th>
                    <th className="py-2.5 px-4 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cobrosGenerados.map((cobro, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-4 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-2 px-4 font-semibold text-slate-700">{cobro.periodo_mes} / {cobro.periodo_anio}</td>
                      <td className="py-2 px-4 text-slate-600">{cobro.nombre_concepto}</td>
                      <td className="py-2 px-4 text-right font-extrabold text-slate-800">{cobro.monto.toFixed(2)} {formData.moneda}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Botones de Accion */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !mostrarVistaPrevia || departamentosDisponibles.length === 0}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 flex items-center gap-2 text-sm cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Download size={18} /> Confirmar y Descargar PDF
              </>
            )}
          </button>
        </div>

      </form>

      {/* Modal de Habitante / Ocupante */}
      <ModalNuevoHabitante
        isOpen={modalHabitanteAbierto}
        onClose={() => setModalHabitanteAbierto(false)}
        onAgregar={handleAgregarHabitante}
      />

    </div>
  );
}