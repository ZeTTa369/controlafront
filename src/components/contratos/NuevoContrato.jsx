import { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Home, 
  User, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  Download, 
  CheckSquare, 
  Square, 
  Eye, 
  X, 
  Loader2, 
  Search,
  ListChecks
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';

// Asigna un peso para garantizar el orden de visualización
const getPrioridadConcepto = (nombre = '') => {
  const n = nombre.toUpperCase();
  if (n.includes('ALQUILER') || n.includes('RENTA') || n.includes('CANON')) return 1;
  if (n.includes('EXPENSA')) return 2;
  if (n.includes('AGUA')) return 3;
  if (n.includes('LUZ') || n.includes('ELECTRIC')) return 4;
  return 5; // Conceptos adicionales
};

export function NuevoContrato({ onClose, onSave }) {
  const [departamentosDisponibles, setDepartamentosDisponibles] = useState([]);
  const [conceptosBD, setConceptosBD] = useState([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  // Formulario General
  const [formData, setFormData] = useState({
    id_departamento: '',
    tipo_contrato: 'DIRECTO', // DIRECTO, TERCEROS, RENOVACION
    beneficiario_tercero: '',
    fecha_inicio: '',
    fecha_fin: '',
    moneda: 'BOB',
    garantia: '1700',
    dia_limite_inicio: '17',
    dia_limite_fin: '20',
  });

  // Datos Inquilino
  const [inquilinoData, setInquilinoData] = useState({
    id_usuario: '',
    nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    ci_nit: '',
    telefono: '',
    email: '',
  });

  // Conceptos seleccionados dinámicamente { [id_concepto]: { seleccionado: boolean, monto: number } }
  // Inician completamente desmarcados por defecto
  const [conceptosSeleccionados, setConceptosSeleccionados] = useState({});

  const [cobrosGenerados, setCobrosGenerados] = useState([]);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buscandoCI, setBuscandoCI] = useState(false);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    setLoadingCatalogos(true);
    try {
      const [resDeptos, resEdificios, resConceptos] = await Promise.all([
        fetch(`${BASE_URL}/departamentos`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/edificios`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/conceptos`, { headers: getAuthHeaders() }),
      ]);

      const dataDeptos = await handleResponse(resDeptos);
      const dataEdificios = await handleResponse(resEdificios);
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
              precio_alquiler: d.precio_alquiler || 1550
            };
          });

        setDepartamentosDisponibles(deptosBD);
        if (deptosBD.length > 0) {
          setFormData(prev => ({ ...prev, id_departamento: deptosBD[0].id }));
        }
      }

      if (Array.isArray(dataConceptos)) {
        // Ordenamos los conceptos obtenidos según la jerarquía establecida
        const ordenados = [...dataConceptos].sort((a, b) => {
          const pA = getPrioridadConcepto(a.nombre);
          const pB = getPrioridadConcepto(b.nombre);
          if (pA !== pB) return pA - pB;
          return a.nombre.localeCompare(b.nombre);
        });

        setConceptosBD(ordenados);
      }
    } catch (error) {
      console.error('Error cargando catálogos:', error);
      toast.error('Error al conectar con los catálogos del servidor');
    } finally {
      setLoadingCatalogos(false);
    }
  };

  // Manejo de Checkbox de cada concepto
  const handleConceptoToggle = (concepto) => {
    const id = concepto.id_concepto || concepto.id;
    const montoDefault = Number(concepto.monto_sugerido || concepto.monto || 0);

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
            monto: montoDefault,
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

  // Lista de conceptos activos ordenados por prioridad (Alquiler -> Expensas -> Agua -> Luz -> Extras)
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

  // Total recurrente mensual (Suma de los conceptos marcados, sin garantía)
  const totalMensualRecurrente = useMemo(() => {
    return listaConceptosActivosOrdenados.reduce((acc, c) => acc + (parseFloat(c.monto) || 0), 0);
  }, [listaConceptosActivosOrdenados]);

  const buscarInquilinoPorCI = async () => {
    if (!inquilinoData.ci_nit.trim()) {
      toast.error('Ingresa un CI/NIT para buscar');
      return;
    }

    setBuscandoCI(true);
    try {
      const res = await fetch(`${BASE_URL}/usuarios`, { headers: getAuthHeaders() });
      const usuarios = await handleResponse(res);
      const encontrado = usuarios.find(u => String(u.ci_nit).trim() === inquilinoData.ci_nit.trim());

      if (encontrado) {
        setInquilinoData({
          id_usuario: encontrado.id_usuario || encontrado.id,
          nombre: encontrado.nombre || '',
          primer_apellido: encontrado.primer_apellido || '',
          segundo_apellido: encontrado.segundo_apellido || '',
          ci_nit: encontrado.ci_nit || '',
          telefono: encontrado.telefono || '',
          email: encontrado.email || '',
        });
        toast.success(`Inquilino encontrado: ${encontrado.nombre} ${encontrado.primer_apellido}`);
      } else {
        toast('No existe registro con ese CI. Completa los datos para guardarlo.', { icon: 'ℹ️' });
      }
    } catch (error) {
      toast.error('Error al consultar usuarios');
    } finally {
      setBuscandoCI(false);
    }
  };

  const formatearFechaDMY = (fechaStr) => {
    if (!fechaStr) return '';
    const [y, m, d] = fechaStr.split('-');
    return `${d}/${m}/${y}`;
  };

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
      toast.error('La fecha de finalización debe ser posterior a la de inicio.');
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
            fecha_emision: `${String(10).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`
          });
        }
      });
    }

    setCobrosGenerados(listaTemporal);
    setMostrarVistaPrevia(true);
    toast.success(`Se generaron ${listaTemporal.length} cuotas programadas.`);
  };

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
    doc.text(`Fecha de Emisión: ${fechaEmisionHoy}`, 20, 28);

    doc.setDrawColor(203, 213, 225);
    doc.line(20, 32, 190, 32);

    // 1. PARTES Y UBICACIÓN
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("1. PARTES Y UBICACIÓN DEL INMUEBLE", 20, 42);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Inmueble: ${deptoObj?.texto || 'Ubicación Residencial'}`, 25, 50);
    doc.text(`Inquilino / Arrendatario: ${nombreCompletoInquilino} (CI: ${inquilinoData.ci_nit})`, 25, 57);
    doc.text(`Tipo de Contrato: ${formData.tipo_contrato}`, 25, 64);
    
    let yPos = 64;
    if (formData.tipo_contrato === 'TERCEROS' && formData.beneficiario_tercero) {
      yPos += 7;
      doc.text(`Beneficiario / Ocupante Real: ${formData.beneficiario_tercero}`, 25, yPos);
    }

    // 2. VIGENCIA Y PLAZO
    yPos += 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("2. VIGENCIA Y PLAZO", 20, yPos);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    yPos += 8;
    doc.text(`Inicio de Vigencia: ${formatearFechaDMY(formData.fecha_inicio)}`, 25, yPos);
    yPos += 7;
    doc.text(`Fin de Vigencia: ${formatearFechaDMY(formData.fecha_fin)}`, 25, yPos);
    yPos += 7;
    doc.text(`Período Límite de Pago: Del ${formData.dia_limite_inicio} al ${formData.dia_limite_fin} de cada mes`, 25, yPos);

    // 3. CONDICIONES FINANCIERAS (Orden estricto)
    yPos += 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("3. CONDICIONES FINANCIERAS", 20, yPos);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    // 1. Depósito de Garantía (Siempre encabeza las condiciones)
    let numItem = 1;
    yPos += 8;
    doc.text(`${numItem}. Depósito de Garantía: ${Number(formData.garantia || 0).toFixed(2)} ${formData.moneda}`, 25, yPos);

    // 2. Conceptos mensuales ordenados
    listaConceptosActivosOrdenados.forEach(c => {
      numItem += 1;
      yPos += 7;
      doc.text(`${numItem}. ${c.nombre}: ${Number(c.monto).toFixed(2)} ${formData.moneda}`, 25, yPos);
    });

    // Total Mensual Recurrente
    yPos += 10;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text(
      `TOTAL MENSUAL RECURRENTE (Sin Garantía): ${totalMensualRecurrente.toFixed(2)} ${formData.moneda}`, 
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mostrarVistaPrevia || cobrosGenerados.length === 0) {
      toast.error('Genera y verifica la vista previa de cobros antes de guardar.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Guardando contrato y registrando cuotas...');

    try {
      let idUsuarioFinal = inquilinoData.id_usuario;

      // Registrar nuevo inquilino con contraseña válida si no existía previamente
      if (!idUsuarioFinal) {
        const passwordBase = String(inquilinoData.ci_nit).trim().length >= 6 
          ? String(inquilinoData.ci_nit).trim() 
          : '123456';

        const resUser = await fetch(`${BASE_URL}/usuarios`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            nombre: inquilinoData.nombre.trim(),
            primer_apellido: inquilinoData.primer_apellido.trim(),
            segundo_apellido: inquilinoData.segundo_apellido?.trim() || null,
            ci_nit: inquilinoData.ci_nit.trim(),
            telefono: inquilinoData.telefono?.trim() || null,
            email: inquilinoData.email?.trim() || `inquilino_${inquilinoData.ci_nit}@residencial.com`,
            password: passwordBase,
            rol: 3,
            estado: 'ACTIVO',
          }),
        });

        const nuevoUser = await handleResponse(resUser);
        idUsuarioFinal = nuevoUser.id_usuario || nuevoUser.id;
      }

      const conceptosIds = listaConceptosActivosOrdenados.map(c => c.id_concepto);

      const payloadContrato = {
        id_departamento: Number(formData.id_departamento),
        id_usuario: Number(idUsuarioFinal),
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        monto_renta: Number(totalMensualRecurrente),
        moneda: formData.moneda,
        garantia: parseFloat(formData.garantia) || 0,
        estado: formData.tipo_contrato,
        conceptosIds: conceptosIds,
      };

      const resContrato = await fetch(`${BASE_URL}/contratos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payloadContrato),
      });

      const data = await handleResponse(resContrato);

      generarPDFContrato();
      toast.success('¡Contrato registrado y PDF descargado!', { id: toastId });

      if (onSave) onSave(data);
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
            <p className="text-sm text-slate-400">Selección dinámica de conceptos desde la base de datos</p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2">
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">

        {/* 1. SELECCIÓN DE UNIDAD Y TIPO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Piso y Departamento</label>
            <div className="relative flex items-center">
              <Home size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
              <select
                name="id_departamento"
                required
                value={formData.id_departamento}
                onChange={(e) => setFormData({ ...formData, id_departamento: e.target.value })}
                disabled={loadingCatalogos}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl font-bold appearance-none text-sm outline-none focus:border-blue-600 bg-white"
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
              className="w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-600 bg-white appearance-none"
            >
              <option value="DIRECTO">Contratante Directo</option>
              <option value="TERCEROS">Contratante para Terceros</option>
              <option value="RENOVACION">Renovación</option>
            </select>
          </div>
        </div>

        {/* Beneficiario Terceros */}
        {formData.tipo_contrato === 'TERCEROS' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in">
            <label className="block text-xs font-bold text-amber-900 mb-1">Nombre del Beneficiario / Ocupante Real</label>
            <input
              type="text"
              name="beneficiario_tercero"
              placeholder="Ej. Carlos Mendoza (Ocupante)"
              value={formData.beneficiario_tercero}
              onChange={(e) => setFormData({ ...formData, beneficiario_tercero: e.target.value })}
              className="w-full py-2.5 px-3 border border-amber-300 rounded-lg text-sm font-semibold bg-white outline-none focus:border-amber-600"
            />
          </div>
        )}

        {/* 2. REGISTRO INQUILINO */}
        <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <User size={18} className="text-blue-600" /> Datos del Inquilino / Arrendatario
              </h3>
              <p className="text-xs text-slate-500">Ingresa los datos personales; se asociará o creará automáticamente</p>
            </div>
            
            <button
              type="button"
              onClick={buscarInquilinoPorCI}
              disabled={buscandoCI}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 self-start"
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <label className="block text-xs font-bold text-slate-600 mb-1">Teléfono / Celular</label>
              <input
                type="text"
                placeholder="Ej. 70000000"
                value={inquilinoData.telefono}
                onChange={(e) => setInquilinoData({ ...inquilinoData, telefono: e.target.value })}
                className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm bg-white outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Correo Electrónico</label>
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

        {/* 3. VIGENCIA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Fecha de Inicio</label>
            <div className="relative flex items-center">
              <Calendar size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                required
                value={formData.fecha_inicio}
                onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                className="w-full py-3 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white font-medium text-sm outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Fecha de Finalización</label>
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
        </div>

        {/* 4. CHECKLIST DINÁMICA DE CONCEPTOS DESDE BD (INICIAN DESMARCADOS) */}
        <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50">
          <h3 className="text-base font-extrabold text-slate-800 mb-1 flex items-center gap-2">
            <ListChecks size={20} className="text-blue-600" /> Conceptos de Cobro (Base de Datos)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Marca los conceptos que aplican a este contrato y ajusta sus montos correspondientes:
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
                    className="flex items-center gap-3 text-left focus:outline-none"
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

        {/* 5. DESGLOSE FINANCIERO DINÁMICO ORDENADO (SE ALIMENTA AL MARCAR CONCEPTOS) */}
        <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/40">
          <h3 className="text-base font-extrabold text-slate-800 mb-1">Desglose de Condiciones Financieras</h3>
          <p className="text-xs text-slate-500 mb-4">
            Resumen visual ordenado (1. Garantía, 2. Alquiler, 3. Expensas, 4. Agua, 5. Luz, etc.):
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {/* 1. Depósito de Garantía (Fijo en cabecera del desglose) */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <label className="block text-xs font-bold text-slate-700 mb-1">1. Dep. Garantía</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.garantia}
                onChange={(e) => setFormData({ ...formData, garantia: e.target.value })}
                className="w-full py-1.5 px-2 border border-slate-300 rounded-lg font-extrabold text-sm text-slate-800 bg-white outline-none focus:border-blue-600 text-right"
              />
            </div>

            {/* Conceptos Marcados en Orden Jerárquico */}
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
              ⚠️ Aún no has marcado ningún concepto en la checklist superior. Marca al menos el Alquiler para ver el desglose.
            </p>
          )}
        </div>

        {/* RESUMEN TOTAL Y BOTÓN DE VISTA PREVIA */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-5 bg-blue-50 border border-blue-200 rounded-2xl gap-4">
          <div>
            <span className="text-xs font-bold uppercase text-blue-800 tracking-wider">Total Mensual Recurrente (Sin Garantía):</span>
            <p className="text-2xl font-black text-blue-900">{totalMensualRecurrente.toFixed(2)} {formData.moneda} / mes</p>
          </div>

          <button
            type="button"
            onClick={calcularVistaPreviaCobros}
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow flex items-center gap-2"
          >
            <Eye size={16} /> Generar Vista Previa de Cobros
          </button>
        </div>

        {/* 6. VISTA PREVIA DE CUOTAS */}
        {mostrarVistaPrevia && (
          <div className="border border-blue-200 bg-blue-50/30 rounded-2xl p-6 animate-fade-in">
            <h3 className="text-base font-extrabold text-blue-900 mb-1">Vista Previa de Cuotas ({cobrosGenerados.length} en total)</h3>
            <p className="text-xs text-slate-600 mb-4">Cobros programados automáticamente mes a mes:</p>

            <div className="max-h-56 overflow-y-auto border border-blue-100 rounded-xl bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-blue-100/50 text-blue-900 font-bold border-b border-blue-100 uppercase">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Período (Mes / Año)</th>
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

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !mostrarVistaPrevia || departamentosDisponibles.length === 0}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
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
    </div>
  );
}