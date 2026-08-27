import { useState, useEffect } from 'react';
import { 
  Wrench, 
  Building2, 
  Home, 
  AlertTriangle, 
  DollarSign, 
  Coins, 
  Calendar, 
  UserCheck, 
  CheckCircle2,
  Loader2,
  X,
  Hammer,
  PackageCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';

export function NuevaRefaccion({ onClose, onSave }) {
  const [edificios, setEdificios] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  const [formData, setFormData] = useState({
    id_edificio: '',
    id_departamento: '', // Opcional (si es en área común queda vacío)
    titulo: '',
    descripcion: '',
    tipo: 'Plomería',
    prioridad: 'Media',
    costo_mano_obra: '',
    costo_material: '',
    costo_total: 0,
    moneda: 'BOB',
    proveedor: '',
    fecha_solicitud: new Date().toISOString().split('T')[0],
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'Pendiente',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    setLoadingCatalogos(true);
    try {
      const [resEdificios, resDeptos] = await Promise.all([
        fetch(`${BASE_URL}/edificios`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/departamentos`, { headers: getAuthHeaders() }),
      ]);

      const dataEdificios = await handleResponse(resEdificios);
      const dataDeptos = await handleResponse(resDeptos);

      if (Array.isArray(dataEdificios)) {
        setEdificios(dataEdificios);
      }
      if (Array.isArray(dataDeptos)) {
        setDepartamentos(dataDeptos);
      }
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
      toast.error('No se pudieron cargar los edificios y departamentos');
    } finally {
      setLoadingCatalogos(false);
    }
  };

  // Filtrar departamentos según el edificio seleccionado
  const departamentosFiltrados = departamentos.filter(
    d => String(d.id_edificio) === String(formData.id_edificio)
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // Si cambia el edificio, resetear el departamento
      if (name === 'id_edificio') {
        updated.id_departamento = '';
      }

      // Recalcular costo total en tiempo real si cambian los costos
      if (name === 'costo_mano_obra' || name === 'costo_material') {
        const manoObra = parseFloat(name === 'costo_mano_obra' ? value : prev.costo_mano_obra) || 0;
        const material = parseFloat(name === 'costo_material' ? value : prev.costo_material) || 0;
        updated.costo_total = Number((manoObra + material).toFixed(2));
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.id_edificio) {
      toast.error('Por favor seleccione el edificio afectado.');
      return;
    }

    if (!formData.titulo.trim()) {
      toast.error('Por favor ingrese el título del trabajo.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Registrando orden de refacción...');

    try {
      const payload = {
        id_edificio: Number(formData.id_edificio),
        id_departamento: formData.id_departamento ? Number(formData.id_departamento) : null,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion?.trim() || null,
        tipo: formData.tipo,
        prioridad: formData.prioridad,
        costo_mano_obra: parseFloat(formData.costo_mano_obra) || 0,
        costo_material: parseFloat(formData.costo_material) || 0,
        costo_total: parseFloat(formData.costo_total) || 0,
        moneda: formData.moneda,
        proveedor: formData.proveedor?.trim() || null,
        fecha_solicitud: formData.fecha_solicitud ? new Date(formData.fecha_solicitud).toISOString() : new Date().toISOString(),
        fecha_inicio: formData.fecha_inicio ? new Date(formData.fecha_inicio).toISOString() : null,
        fecha_fin: formData.fecha_fin ? new Date(formData.fecha_fin).toISOString() : null,
        estado: formData.estado,
      };

      const response = await fetch(`${BASE_URL}/refacciones`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await handleResponse(response);

      toast.success('¡Refacción / Mantenimiento registrado exitosamente!', { id: toastId });
      if (onSave) onSave(data);
      if (onClose) onClose();
    } catch (error) {
      toast.error(error.message || 'Error al registrar la refacción', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-w-3xl mx-auto animate-fade-in relative">
      
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

        {onClose && (
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        )}
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
                disabled={loadingCatalogos}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm"
              >
                <option value="">
                  {loadingCatalogos ? 'Cargando edificios...' : 'Seleccione el edificio...'}
                </option>
                {edificios.map(ed => (
                  <option key={ed.id_edificio || ed.id} value={ed.id_edificio || ed.id}>
                    {ed.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Ubicación Específica</label>
            <div className="relative flex items-center group">
              <Home size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10" />
              <select
                name="id_departamento"
                disabled={!formData.id_edificio || loadingCatalogos}
                value={formData.id_departamento}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="">Área Común (Pasillos, Ascensor, Garaje, etc.)</option>
                {departamentosFiltrados.map(dep => (
                  <option key={dep.id_departamento || dep.id} value={dep.id_departamento || dep.id}>
                    Piso {dep.piso || 1} - Depto {dep.numero_departamento || dep.numero || 'S/N'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Título de la Refacción */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Título del Trabajo / Avería *</label>
          <input
            type="text"
            name="titulo"
            required
            maxLength={150}
            placeholder="Ej. Reparación de fuga de agua en baño o mantenimiento de ascensor"
            value={formData.titulo}
            onChange={handleChange}
            className="w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm font-semibold"
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
                <option value="General">General / Otro</option>
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

        {/* Costos Desglosados y Moneda */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
              <Hammer size={14} className="text-blue-600" /> Mano de Obra
            </label>
            <div className="relative flex items-center">
              <DollarSign size={16} className="absolute left-3 text-slate-400" />
              <input
                type="number"
                step="0.01"
                name="costo_mano_obra"
                placeholder="0.00"
                value={formData.costo_mano_obra}
                onChange={handleChange}
                className="w-full py-2.5 pl-8 pr-3 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none focus:border-blue-600 font-bold text-sm text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
              <PackageCheck size={14} className="text-blue-600" /> Materiales
            </label>
            <div className="relative flex items-center">
              <DollarSign size={16} className="absolute left-3 text-slate-400" />
              <input
                type="number"
                step="0.01"
                name="costo_material"
                placeholder="0.00"
                value={formData.costo_material}
                onChange={handleChange}
                className="w-full py-2.5 pl-8 pr-3 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none focus:border-blue-600 font-bold text-sm text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-900 mb-2">
              Costo Total (Calculado)
            </label>
            <div className="w-full py-2.5 px-3 border-2 border-blue-200 bg-blue-50/70 rounded-xl text-blue-900 font-extrabold text-sm text-right">
              {Number(formData.costo_total).toFixed(2)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
              <Coins size={14} className="text-slate-400" /> Moneda
            </label>
            <select
              name="moneda"
              value={formData.moneda}
              onChange={handleChange}
              className="w-full py-2.5 px-3 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none focus:border-blue-600 font-bold text-sm cursor-pointer"
            >
              <option value="BOB">BOB (Bs)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>

        {/* Proveedor y Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Proveedor / Técnico</label>
            <div className="relative flex items-center group">
              <UserCheck size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                name="proveedor"
                placeholder="Ej. Plomería San José S.R.L."
                value={formData.proveedor}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 text-sm font-semibold"
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
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Completado">Completado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        {/* Descripción Detallada */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Descripción Detallada del Trabajo</label>
          <textarea
            name="descripcion"
            rows="3"
            placeholder="Especifica los detalles del daño, materiales requeridos o notas de mantenimiento..."
            value={formData.descripcion}
            onChange={handleChange}
            className="w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 resize-none text-sm font-medium"
          ></textarea>
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
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 flex items-center gap-2 text-sm active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} /> Registrar Refacción
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}