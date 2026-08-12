import { useState, useEffect } from 'react';
import { 
  Tag, 
  FileText, 
  RefreshCw, 
  Activity,
  Receipt,
  X 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';

export function NuevoConcepto({ onClose, onSave, conceptoAEditar = null }) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    recurrente: 'Mensual',
    estado: 'ACTIVO'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (conceptoAEditar) {
      setFormData({
        nombre: conceptoAEditar.nombre || '',
        descripcion: conceptoAEditar.descripcion || '',
        recurrente: conceptoAEditar.recurrente || 'Mensual',
        estado: conceptoAEditar.estado || 'ACTIVO'
      });
    }
  }, [conceptoAEditar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isEdit = Boolean(conceptoAEditar);
    const id = conceptoAEditar?.id_concepto || conceptoAEditar?.id;
    const toastId = toast.loading(isEdit ? 'Actualizando concepto...' : 'Registrando concepto...');

    const url = isEdit ? `${BASE_URL}/conceptos/${id}` : `${BASE_URL}/conceptos`;
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await handleResponse(response);
      toast.success(isEdit ? '¡Concepto actualizado!' : '¡Concepto de cobro registrado!', { id: toastId });

      if (onSave) onSave(data);
      if (onClose) onClose();
    } catch (error) {
      toast.error(error.message || 'Error al guardar el concepto', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-w-2xl mx-auto animate-fade-in relative">
      
      {/* Cabecera del Formulario */}
      <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <Receipt size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">
              {conceptoAEditar ? 'Editar Concepto' : 'Registrar Nuevo Concepto'}
            </h2>
            <p className="text-sm text-slate-400">Define tipos de cobros o pagos para el edificio</p>
          </div>
        </div>

        {onClose && (
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-2">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Cuerpo del Formulario */}
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        
        {/* Nombre del Concepto */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Concepto</label>
          <div className="relative flex items-center group">
            <Tag size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              name="nombre"
              required
              maxLength={50}
              placeholder="Ej. Expensas Comunes, Mantenimiento Ascensor, Agua..."
              value={formData.nombre}
              onChange={handleChange}
              className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white font-bold"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5 text-right">{formData.nombre.length}/50 caracteres</p>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Descripción Detallada</label>
          <div className="relative flex items-start group pt-3.5">
            <FileText size={18} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <textarea
              name="descripcion"
              maxLength={255}
              rows="3"
              placeholder="Describe brevemente de qué trata este cobro..."
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white resize-none"
            ></textarea>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 text-right">{formData.descripcion.length}/255 caracteres</p>
        </div>

        {/* Recurrencia y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 border border-slate-100 rounded-xl">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Recurrencia</label>
            <div className="relative flex items-center group">
              <RefreshCw size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10 pointer-events-none" />
              <select
                name="recurrente"
                value={formData.recurrente}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer"
              >
                <option value="Mensual">Mensual (Expensas)</option>
                <option value="Anual">Anual</option>
                <option value="Pago Único">Pago Único (Multas, etc)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Estado</label>
            <div className="relative flex items-center group">
              <Activity size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10 pointer-events-none" />
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer"
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Guardando...' : conceptoAEditar ? 'Guardar Cambios' : 'Registrar Concepto'}
          </button>
        </div>

      </form>
    </div>
  );
}