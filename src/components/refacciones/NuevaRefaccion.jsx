import { useState } from 'react';
import { 
  Wrench, 
  Building2, 
  Home, 
  AlertTriangle, 
  DollarSign, 
  Coins, 
  Calendar, 
  UserCheck, 
  FileText, 
  Activity,
  CheckCircle2,
  Paperclip
} from 'lucide-react';
import toast from 'react-hot-toast';

// Datos de prueba simulados
const EDIFICIOS_DISPONIBLES = [
  { id: 1, nombre: 'Torre Zafiro Platinum' },
  { id: 2, nombre: 'Condominio El Bosque' },
  { id: 3, nombre: 'Salón de Eventos Gaviota' }
];

const DEPARTAMENTOS_DISPONIBLES = [
  { id: 1, id_edificio: 3, texto: 'Dpto C (2do Piso)' },
  { id: 2, id_edificio: 1, texto: 'Unidad 101' },
  { id: 3, id_edificio: 1, texto: 'Unidad 4B' }
];

export function NuevaRefaccion({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    id_edificio: '',
    id_departamento: '', // Opcional (si es en área común queda vacío)
    titulo: '',
    descripcion: '',
    tipo: 'Plomería',
    prioridad: 'Media',
    costo_estimado: '',
    costo_real: '',
    moneda: 'BOB',
    proveedor_encargado: '',
    fecha_solicitud: new Date().toISOString().split('T')[0],
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'Pendiente',
    comprobante_factura: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtrar departamentos según el edificio seleccionado
  const departamentosFiltrados = DEPARTAMENTOS_DISPONIBLES.filter(
    d => d.id_edificio === parseInt(formData.id_edificio)
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.id_edificio) {
      toast.error('Por favor seleccione el edificio afectado.');
      return;
    }

    setIsSubmitting(true);

    try {
      setTimeout(() => {
        if (onSave) onSave(formData);
        toast.success('¡Refacción / Mantenimiento registrado exitosamente!');
        setIsSubmitting(false);
        if (onClose) onClose();
      }, 1000);
    } catch (error) {
      toast.error('Error al registrar la refacción');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-w-3xl mx-auto animate-fade-in">
      
      {/* Cabecera del Formulario */}
      <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <Wrench size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">Registrar Orden de Refacción / Mantenimiento</h2>
            <p className="text-sm text-slate-400">Controla arreglos en áreas comunes o departamentos particulares</p>
          </div>
        </div>
      </div>

      {/* Cuerpo del Formulario */}
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        
        {/* Edificio y Departamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Edificio Afectado *</label>
            <div className="relative flex items-center group">
              <Building2 size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10" />
              <select
                name="id_edificio"
                required
                value={formData.id_edificio}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm"
              >
                <option value="">Seleccione el edificio...</option>
                {EDIFICIOS_DISPONIBLES.map(ed => (
                  <option key={ed.id} value={ed.id}>{ed.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Ubicación Especifica</label>
            <div className="relative flex items-center group">
              <Home size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10" />
              <select
                name="id_departamento"
                disabled={!formData.id_edificio}
                value={formData.id_departamento}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="">Área Común (Pasillos, Ascensor, Garaje, etc.)</option>
                {departamentosFiltrados.map(dep => (
                  <option key={dep.id} value={dep.id}>{dep.texto}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Título de la Refacción */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Título de la Trabajo / Avería *</label>
          <input
            type="text"
            name="titulo"
            required
            maxLength={150}
            placeholder="Ej. Reparación de fuga de agua en baño o mantenimiento de ascensor"
            value={formData.titulo}
            onChange={handleChange}
            className="w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm"
          />
        </div>

        {/* Tipo y Prioridad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Trabajo</label>
            <div className="relative flex items-center group">
              <Wrench size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10" />
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm"
              >
                <option value="Plomería">Plomería</option>
                <option value="Electricidad">Electricidad</option>
                <option value="Albañilería">Albañilería</option>
                <option value="Pintura">Pintura</option>
                <option value="Ascensor">Ascensor</option>
                <option value="Cámaras / Seguridad">Cámaras / Seguridad</option>
                <option value="Jardinería / Limpieza">Jardinería / Limpieza</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Nivel de Prioridad</label>
            <div className="relative flex items-center group">
              <AlertTriangle size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10" />
              <select
                name="prioridad"
                value={formData.prioridad}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm"
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Costos y Moneda */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-slate-50 border border-slate-100 rounded-xl">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Costo Estimado</label>
            <div className="relative flex items-center group">
              <DollarSign size={18} className="absolute left-3 text-slate-400" />
              <input
                type="number"
                step="0.01"
                name="costo_estimado"
                placeholder="0.00"
                value={formData.costo_estimado}
                onChange={handleChange}
                className="w-full py-3 pl-9 pr-3 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none focus:border-blue-600 font-bold text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Costo Real Final</label>
            <div className="relative flex items-center group">
              <DollarSign size={18} className="absolute left-3 text-slate-400" />
              <input
                type="number"
                step="0.01"
                name="costo_real"
                placeholder="0.00"
                value={formData.costo_real}
                onChange={handleChange}
                className="w-full py-3 pl-9 pr-3 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none focus:border-blue-600 font-bold text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Moneda</label>
            <div className="relative flex items-center group">
              <Coins size={18} className="absolute left-3 text-slate-400 z-10" />
              <select
                name="moneda"
                value={formData.moneda}
                onChange={handleChange}
                className="w-full py-3 pl-9 pr-3 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none focus:border-blue-600 font-bold text-sm cursor-pointer"
              >
                <option value="BOB">BOB (Bs)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Proveedor y Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Proveedor / Técnico Encargado</label>
            <div className="relative flex items-center group">
              <UserCheck size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                name="proveedor_encargado"
                placeholder="Ej. Plomería San José S.R.L."
                value={formData.proveedor_encargado}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Fecha Inicio Trabajos</label>
            <div className="relative flex items-center group">
              <Calendar size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="date"
                name="fecha_inicio"
                value={formData.fecha_inicio}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Estado del Trabajo</label>
            <div className="relative flex items-center group">
              <Activity size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10" />
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Completado">Completado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Descripción Detallada */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Descripción del Detalle del Trabajo</label>
          <textarea
            name="descripcion"
            rows="3"
            placeholder="Especifica los detalles del daño, materiales requeridos o notas de mantenimiento..."
            value={formData.descripcion}
            onChange={handleChange}
            className="w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 resize-none text-sm"
          ></textarea>
        </div>

        {/* Comprobante / Factura */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Comprobante / Enlace a Factura</label>
          <div className="relative flex items-center group">
            <Paperclip size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              name="comprobante_factura"
              placeholder="Ej. URL o N° de Factura / Recibo"
              value={formData.comprobante_factura}
              onChange={handleChange}
              className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 text-sm"
            />
          </div>
        </div>

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
            disabled={isSubmitting}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            <CheckCircle2 size={18} />
            {isSubmitting ? 'Guardando...' : 'Registrar Refacción'}
          </button>
        </div>

      </form>
    </div>
  );
}