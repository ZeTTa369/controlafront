import { useState, useEffect } from 'react';
import { Receipt, X, Loader2, Save, RefreshCw, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { actualizarConcepto } from '../../services/conceptoService';

export function ModalEditarConcepto({ isOpen, concepto, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    recurrente: 'Mensual',
    estado: 'ACTIVO',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (concepto && isOpen) {
      setFormData({
        nombre: concepto.nombre || '',
        descripcion: concepto.descripcion || '',
        recurrente: concepto.recurrente || 'Mensual',
        estado: (concepto.estado || 'ACTIVO').toUpperCase(),
      });
    }
  }, [concepto, isOpen]);

  if (!isOpen || !concepto) return null;

  const idConcepto = concepto.id_concepto || concepto.id;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error('El nombre del concepto es obligatorio');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Guardando cambios del concepto...');

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        recurrente: formData.recurrente,
        estado: formData.estado,
      };

      const conceptoActualizado = await actualizarConcepto(idConcepto, payload);

      toast.success('Concepto actualizado correctamente', { id: toastId });

      if (onSave) {
        onSave(conceptoActualizado || { ...concepto, ...payload });
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error al actualizar concepto:', error);
      toast.error(error.message || 'No se pudo actualizar el concepto', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-scale-up">
        
        {/* Cabecera */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <Receipt size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Editar Concepto</h3>
              <p className="text-xs text-slate-400">
                Modifica los datos del rubro #{idConcepto}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Nombre del Concepto *
            </label>
            <input
              type="text"
              required
              maxLength={50}
              placeholder="Ej. Expensas Comunes, Agua, Luz..."
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full py-2.5 px-3.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-600 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Recurrencia *
              </label>
              <div className="relative flex items-center">
                <RefreshCw size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={formData.recurrente}
                  onChange={(e) => setFormData({ ...formData, recurrente: e.target.value })}
                  className="w-full py-2.5 pl-9 pr-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-600 bg-white cursor-pointer"
                >
                  <option value="Mensual">Mensual</option>
                  <option value="Anual">Anual</option>
                  <option value="Pago Único">Pago Único</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Estado
              </label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full py-2.5 px-3.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-600 bg-white cursor-pointer"
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Descripción (Opcional)
            </label>
            <div className="relative">
              <FileText size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
              <textarea
                rows={3}
                maxLength={255}
                placeholder="Detalle breve sobre qué cubre este cobro..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full py-2.5 pl-10 pr-3.5 border-2 border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-blue-600 bg-white resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 text-xs disabled:opacity-50 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save size={15} /> Guardar Cambios
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}