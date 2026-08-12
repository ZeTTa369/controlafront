import { useState, useEffect } from 'react';
import { 
  FileText, 
  Home, 
  Users, 
  Calendar, 
  DollarSign, 
  Coins, 
  ShieldCheck, 
  Activity,
  Clock,
  Download,
  CheckSquare,
  Square,
  Eye,
  BookOpen,
  X,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';

// Importamos la vista del documento legal si existe
import { Contrato } from './Contrato';

const CONCEPTOS_DEFAULT = [
  { id_concepto: 1, nombre: 'Alquiler Mensual (Canon)', monto_sugerido: 1550.00 },
  { id_concepto: 2, nombre: 'Expensas, Agua y Luz', monto_sugerido: 430.00 },
  { id_concepto: 3, nombre: 'Mantenimiento de Ascensores', monto_sugerido: 50.00 }
];

export function NuevoContrato({ onClose, onSave }) {
  // Estados para catálogos desde la BD
  const [departamentosDisponibles, setDepartamentosDisponibles] = useState([]);
  const [inquilinosRegistrados, setInquilinosRegistrados] = useState([]);
  const [conceptosDisponibles, setConceptosDisponibles] = useState(CONCEPTOS_DEFAULT);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  const [formData, setFormData] = useState({
    id_departamento: '',
    id_usuario: '',
    fecha_inicio: '',
    fecha_fin: '',
    moneda: 'BOB',
    garantia: '1700',
    dia_limite_inicio: '17',
    dia_limite_fin: '20',
    estado: 'ACTIVO'
  });

  const [conceptosSeleccionados, setConceptosSeleccionados] = useState({});
  const [cobrosGenerados, setCobrosGenerados] = useState([]);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [mostrarModalDocumentoLegal, setMostrarModalDocumentoLegal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos reales desde NestJS al montar el componente
  useEffect(() => {
    cargarCatalogosDesdeBD();
  }, []);

  const cargarCatalogosDesdeBD = async () => {
    setLoadingCatalogos(true);
    try {
      const [resDeptos, resUsers, resEdificios, resConceptos] = await Promise.all([
        fetch(`${BASE_URL}/departamentos`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/usuarios`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/edificios`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/conceptos`, { headers: getAuthHeaders() }).catch(() => null),
      ]);

      const dataDeptos = await handleResponse(resDeptos);
      const dataUsers = await handleResponse(resUsers);
      const dataEdificios = await handleResponse(resEdificios);

      // Mapa de Edificios
      const mapEdificios = {};
      if (Array.isArray(dataEdificios)) {
        dataEdificios.forEach(e => {
          mapEdificios[e.id_edificio || e.id] = e.nombre;
        });
      }

      // Filtrar únicamente Departamentos DISPONIBLES
      if (Array.isArray(dataDeptos)) {
        const deptosDisponiblesBD = dataDeptos
          .filter(d => (d.estado || '').toUpperCase() === 'DISPONIBLE')
          .map(d => {
            const edNombre = mapEdificios[d.id_edificio] || 'Edificio';
            const num = d.numero_departamento || d.numero || 'S/N';
            return {
              id: d.id_departamento || d.id,
              texto: `${edNombre} - Depto ${num} (Piso ${d.piso || 1})`,
              precio_alquiler: d.precio_alquiler || 0
            };
          });
        setDepartamentosDisponibles(deptosDisponiblesBD);

        if (deptosDisponiblesBD.length > 0) {
          setFormData(prev => ({ ...prev, id_departamento: deptosDisponiblesBD[0].id }));
        }
      }

      // Filtrar Inquilinos/Usuarios registrados en la BD
      if (Array.isArray(dataUsers)) {
        const usuariosBD = dataUsers.map(u => {
          const nombreComp = `${u.nombre || ''} ${u.primer_apellido || ''} ${u.segundo_apellido || ''}`.trim();
          const ci = u.ci_nit ? ` (CI: ${u.ci_nit})` : '';
          return {
            id: u.id_usuario || u.id,
            nombre: `${nombreComp}${ci}`,
            nombreRaw: nombreComp,
            ciRaw: u.ci_nit || 'S/N'
          };
        });
        setInquilinosRegistrados(usuariosBD);

        if (usuariosBD.length > 0) {
          setFormData(prev => ({ ...prev, id_usuario: usuariosBD[0].id }));
        }
      }

      // Cargar conceptos si existe la API de conceptos
      if (resConceptos && resConceptos.ok) {
        const dataConceptos = await handleResponse(resConceptos);
        if (Array.isArray(dataConceptos) && dataConceptos.length > 0) {
          setConceptosDisponibles(dataConceptos.map(c => ({
            id_concepto: c.id_concepto || c.id,
            nombre: c.nombre,
            monto_sugerido: Number(c.monto_sugerido || c.monto || 100)
          })));
        }
      }
    } catch (error) {
      console.error('Error al cargar catálogos desde la BD:', error);
      toast.error('Ocurrió un problema al cargar departamentos e inquilinos');
    } finally {
      setLoadingCatalogos(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleConceptoToggle = (id_concepto, montoDefault) => {
    setConceptosSeleccionados(prev => {
      const actual = prev[id_concepto];
      if (actual?.seleccionado) {
        const copy = { ...prev };
        delete copy[id_concepto];
        return copy;
      } else {
        return {
          ...prev,
          [id_concepto]: { seleccionado: true, monto: montoDefault }
        };
      }
    });
  };

  const handleMontoConceptoChange = (id_concepto, nuevoMonto) => {
    setConceptosSeleccionados(prev => ({
      ...prev,
      [id_concepto]: {
        ...prev[id_concepto],
        monto: parseFloat(nuevoMonto) || 0
      }
    }));
  };

  const calcularVistaPreviaCobros = () => {
    if (!formData.fecha_inicio || !formData.fecha_fin) {
      toast.error('Por favor ingresa la fecha de inicio y fin del contrato primero.');
      return;
    }

    const idsConceptosActivos = Object.keys(conceptosSeleccionados).filter(id => conceptosSeleccionados[id].seleccionado);
    if (idsConceptosActivos.length === 0) {
      toast.error('Selecciona al menos un concepto de cobro en la checklist.');
      return;
    }

    const inicio = new Date(formData.fecha_inicio);
    const fin = new Date(formData.fecha_fin);

    if (inicio >= fin) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    let mesesDiferencia = (fin.getFullYear() - inicio.getFullYear()) * 12 + (fin.getMonth() - inicio.getMonth());
    if (fin.getDate() >= inicio.getDate()) {
      mesesDiferencia += 1;
    }
    mesesDiferencia = Math.max(1, mesesDiferencia);

    const listaTemporal = [];
    let fechaActual = new Date(inicio);

    for (let i = 0; i < mesesDiferencia; i++) {
      const anio = fechaActual.getFullYear();
      const mes = fechaActual.getMonth() + 1;

      idsConceptosActivos.forEach(idC => {
        const conceptoInfo = conceptosDisponibles.find(c => c.id_concepto == idC);
        const monto = conceptosSeleccionados[idC].monto;

        listaTemporal.push({
          periodo_mes: mes,
          periodo_anio: anio,
          id_concepto: idC,
          nombre_concepto: conceptoInfo ? conceptoInfo.nombre : 'Concepto',
          monto: monto,
          fecha_emision: fechaActual.toISOString().split('T')[0]
        });
      });

      fechaActual.setMonth(fechaActual.getMonth() + 1);
    }

    setCobrosGenerados(listaTemporal);
    setMostrarVistaPrevia(true);
    toast.success(`Se generaron ${listaTemporal.length} cobros previstos para este contrato.`);
  };

  const generarPDFContrato = (datos) => {
    const doc = new jsPDF();
    const departamentoTexto = departamentosDisponibles.find(d => String(d.id) === String(datos.id_departamento))?.texto || 'Unidad Residencial';
    const inquilinoTexto = inquilinosRegistrados.find(u => String(u.id) === String(datos.id_usuario))?.nombre || 'Inquilino';

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text("DOCUMENTO PRIVADO DE ALQUILER DE DEPARTAMENTO", 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 20, 28);

    doc.setDrawColor(226, 232, 240);
    doc.line(20, 32, 190, 32);

    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("1. PARTES Y UBICACIÓN", 20, 42);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Inmueble / Unidad: ${departamentoTexto}`, 25, 50);
    doc.text(`Arrendataria: ${inquilinoTexto}`, 25, 57);
    doc.text(`Estado del Contrato: ${datos.estado}`, 25, 64);

    doc.setFont("helvetica", "bold");
    doc.text("2. VIGENCIA Y PLAZO FATAL", 20, 78);
    doc.setFont("helvetica", "normal");
    doc.text(`Inicio del Contrato: ${datos.fecha_inicio}`, 25, 85);
    doc.text(`Conclusión de Contrato: ${datos.fecha_fin}`, 25, 92);
    doc.text(`Período de pago mensual: Del ${datos.dia_limite_inicio} al ${datos.dia_limite_fin} de cada mes`, 25, 99);

    doc.setFont("helvetica", "bold");
    doc.text("3. CONDICIONES FINANCIERAS", 20, 112);
    doc.setFont("helvetica", "normal");
    doc.text(`Garantía de Alquiler: ${datos.garantia || 0} ${datos.moneda}`, 25, 119);
    doc.text(`Total de cobros automáticos programados: ${cobrosGenerados.length} cuotas`, 25, 126);

    doc.setDrawColor(150, 150, 150);
    doc.line(25, 175, 85, 175);
    doc.line(125, 175, 185, 175);

    doc.setFontSize(9);
    doc.text("PROPIETARIO", 55, 182, { align: "center" });
    doc.text("ARRENDATARIA", 155, 182, { align: "center" });

    doc.save(`Contrato_Alquiler_${datos.id_departamento}.pdf`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mostrarVistaPrevia || cobrosGenerados.length === 0) {
      toast.error('Por favor genere y revise la vista previa de los cobros antes de guardar.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Guardando contrato en la base de datos...');

    // Calcular el monto de la renta desde los conceptos seleccionados o usar valor por defecto
    const idCanon = Object.keys(conceptosSeleccionados).find(id => conceptosSeleccionados[id].seleccionado);
    const montoRentaCalculado = idCanon ? conceptosSeleccionados[idCanon].monto : 1550;

    const payload = {
      id_departamento: Number(formData.id_departamento),
      id_usuario: Number(formData.id_usuario),
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.fecha_fin,
      monto_renta: Number(montoRentaCalculado),
      moneda: formData.moneda,
      garantia: formData.garantia ? Number(formData.garantia) : 0,
      conceptosIds: Object.keys(conceptosSeleccionados)
        .filter(id => conceptosSeleccionados[id].seleccionado)
        .map(id => Number(id)),
    };

    try {
      const response = await fetch(`${BASE_URL}/contratos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await handleResponse(response);

      generarPDFContrato(formData);
      toast.success('¡Contrato registrado y cobros generados exitosamente!', { id: toastId });

      if (onSave) onSave(data);
      if (onClose) onClose();
    } catch (error) {
      toast.error(error.message || 'Error al guardar el contrato en el servidor', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inquilinoSeleccionadoObj = inquilinosRegistrados.find(u => String(u.id) === String(formData.id_usuario));

  // Construcción del objeto simulado para el visor de contrato legal
  const contratoObjetoParaVistaLegal = {
    propietario: {
      nombre: 'LUIS GABRIEL CLAROS ARISPE',
      ci: '5613935 con QR',
      nacionalidad: 'Boliviano',
      inmuebleNombre: departamentosDisponibles.find(d => String(d.id) === String(formData.id_departamento))?.texto || 'EDIFICIO RESIDENCIAL',
      ubicacion: 'Cochabamba, Bolivia',
      matricula: '3.09.3.01.0005681 VIGENTE',
      zona: 'Cruce Taquiña'
    },
    arrendataria: {
      nombre: inquilinoSeleccionadoObj?.nombreRaw || 'INQUILINO REGISTRADO',
      ci: inquilinoSeleccionadoObj?.ciRaw || 'S/N',
      nacionalidad: 'Boliviana',
      dependientes: 'Grupo familiar'
    },
    inmueble: {
      departamento: 'A',
      piso: 'Piso 1',
      detalles: 'Dos dormitorios, baño privado, living comedor y cocina.',
      llaves: 4
    },
    condiciones: {
      canonMensual: 1550.00,
      moneda: formData.moneda,
      diaPagoInicio: formData.dia_limite_inicio || 17,
      diaPagoFin: formData.dia_limite_fin || 20,
      garantia: parseFloat(formData.garantia) || 1700.00,
      fechaInicio: formData.fecha_inicio || '2026-03-01',
      fechaFin: formData.fecha_fin || '2027-03-01',
      duracion: '1 AÑO calendario',
      luzPorPersona: 40.00,
      aguaPorPersona: 40.00,
      expensas: 150.00,
      totalServiciosYExpensas: 430.00
    },
    fechaSuscripcion: new Date().toLocaleDateString()
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-w-4xl mx-auto animate-fade-in relative">
      
      {/* Cabecera del Formulario */}
      <div className="bg-slate-900 px-8 py-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">Registrar Nuevo Contrato y Cobros Automáticos</h2>
            <p className="text-sm text-slate-400">Define plazos, selecciona conceptos y previsualiza los cobros</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMostrarModalDocumentoLegal(true)}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 hover:border-blue-500 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
        >
          <BookOpen size={16} /> Ver Contrato Legal Completo
        </button>
      </div>

      {/* MODAL PARA VER EL CONTRATO LEGAL COMPLETO */}
      {mostrarModalDocumentoLegal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl">
            <button
              onClick={() => setMostrarModalDocumentoLegal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <Contrato datosContrato={contratoObjetoParaVistaLegal} />
          </div>
        </div>
      )}

      {/* Cuerpo del Formulario */}
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        
        {/* Selección de Departamento e Inquilino (Desde la Base de Datos) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Departamento / Unidad (Disponible)</label>
            <div className="relative flex items-center group">
              <Home size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10 pointer-events-none" />
              <select
                name="id_departamento"
                required
                value={formData.id_departamento}
                onChange={handleChange}
                disabled={loadingCatalogos}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm"
              >
                {loadingCatalogos ? (
                  <option>Cargando departamentos disponibles...</option>
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
            <label className="block text-sm font-bold text-slate-700 mb-2">Inquilino (Registrado en BD)</label>
            <div className="relative flex items-center group">
              <Users size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10 pointer-events-none" />
              <select
                name="id_usuario"
                required
                value={formData.id_usuario}
                onChange={handleChange}
                disabled={loadingCatalogos}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm"
              >
                {loadingCatalogos ? (
                  <option>Cargando inquilinos desde BD...</option>
                ) : inquilinosRegistrados.length > 0 ? (
                  inquilinosRegistrados.map(user => (
                    <option key={user.id} value={user.id}>{user.nombre}</option>
                  ))
                ) : (
                  <option value="" disabled>No hay usuarios registrados</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Vigencia del Contrato (Fechas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Fecha de Inicio</label>
            <div className="relative flex items-center group">
              <Calendar size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
              <input
                type="date"
                name="fecha_inicio"
                required
                value={formData.fecha_inicio}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 font-medium text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Fecha de Finalización</label>
            <div className="relative flex items-center group">
              <Calendar size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
              <input
                type="date"
                name="fecha_fin"
                required
                value={formData.fecha_fin}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 font-medium text-sm"
              />
            </div>
          </div>
        </div>

        {/* Moneda y Garantía */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Depósito de Garantía</label>
            <div className="relative flex items-center group">
              <ShieldCheck size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
              <input
                type="number"
                step="0.01"
                name="garantia"
                required
                placeholder="0.00"
                value={formData.garantia}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 text-sm font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Moneda</label>
            <div className="relative flex items-center group">
              <Coins size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10 pointer-events-none" />
              <select
                name="moneda"
                value={formData.moneda}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm"
              >
                <option value="BOB">BOB (Bs)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Días Límite y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-blue-50/50 border border-blue-100 rounded-xl">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Rango de Días Límite de Pago</label>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center w-full">
                <Clock size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  type="number"
                  min="1"
                  max="31"
                  name="dia_limite_inicio"
                  placeholder="17"
                  required
                  value={formData.dia_limite_inicio}
                  onChange={handleChange}
                  className="w-full py-3 pl-9 pr-2 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-blue-600 font-bold"
                />
              </div>
              <span className="text-slate-500 font-bold">a</span>
              <div className="relative flex items-center w-full">
                <input
                  type="number"
                  min="1"
                  max="31"
                  name="dia_limite_fin"
                  placeholder="20"
                  required
                  value={formData.dia_limite_fin}
                  onChange={handleChange}
                  className="w-full py-3 px-3 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-blue-600 font-bold"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Estado del Contrato</label>
            <div className="relative flex items-center group">
              <Activity size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10 pointer-events-none" />
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm"
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="FINALIZADO">FINALIZADO</option>
                <option value="CANCELADO">CANCELADO</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECCIÓN 1: CHECKLIST DE CONCEPTOS */}
        <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50">
          <h3 className="text-base font-extrabold text-slate-800 mb-2">Conceptos Aplicables al Contrato</h3>
          <p className="text-xs text-slate-500 mb-4">Selecciona los conceptos que se incluirán en este contrato y ajusta sus montos base si es necesario.</p>
          
          <div className="space-y-3">
            {conceptosDisponibles.map(con => {
              const estaSeleccionado = conceptosSeleccionados[con.id_concepto]?.seleccionado || false;
              const montoActual = conceptosSeleccionados[con.id_concepto]?.monto ?? con.monto_sugerido;

              return (
                <div key={con.id_concepto} className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleConceptoToggle(con.id_concepto, con.monto_sugerido)}
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
                      <span className="text-xs font-bold text-slate-400">Monto Base:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={montoActual}
                        onChange={(e) => handleMontoConceptoChange(con.id_concepto, e.target.value)}
                        className="w-28 py-1.5 px-3 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:border-blue-600 outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={calcularVistaPreviaCobros}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow transition-all flex items-center gap-2"
            >
              <Eye size={16} /> Generar Vista Previa de Cobros
            </button>
          </div>
        </div>

        {/* SECCIÓN 2: TABLA DE VISTA PREVIA DE COBROS */}
        {mostrarVistaPrevia && (
          <div className="border border-blue-200 bg-blue-50/30 rounded-2xl p-6 animate-fade-in">
            <h3 className="text-base font-extrabold text-blue-900 mb-1">Vista Previa de Cobros Automáticos ({cobrosGenerados.length} en total)</h3>
            <p className="text-xs text-slate-600 mb-4">Estos son los registros que se crearán automáticamente al guardar el contrato.</p>

            <div className="max-h-60 overflow-y-auto border border-blue-100 rounded-xl bg-white">
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
                <Loader2 size={18} className="animate-spin" /> Guardando en BD...
              </>
            ) : (
              <>
                <Download size={18} /> Confirmar, Guardar y Descargar PDF
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}