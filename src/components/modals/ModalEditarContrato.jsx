import { useState, useEffect } from 'react';
import { FileText, X, Loader2, Save, Calendar, Key, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { actualizarContrato } from '../../services/contratoService';

export function ModalEditarContrato({ isOpen, contrato, onClose, onSave }) {
  const [formData, setFormData] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    monto_renta: '',
    garantia: '',
    numero_llaves: '1',
    estado: 'DIRECTO',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (contrato && isOpen) {
      setFormData({
        fecha_inicio: contrato.fecha_inicio ? String(contrato.fecha_inicio).split('T')[0] : '',
        fecha_fin: contrato.fecha_fin ? String(contrato.fecha_fin).split('T')[0] : '',
        monto_renta: String(Number(contrato.monto_renta || 0)),
        garantia: String(Number(contrato.garantia || 0)),
        numero_llaves:
          contrato.numero_llaves !== null && contrato.numero_llaves !== undefined
            ? String(contrato.numero_llaves)
            : '1',
        estado: (contrato.estado || 'DIRECTO').toUpperCase(),
      });
    }
  }, [contrato, isOpen]);

  if (!isOpen || !contrato) return null;

  const idContrato = contrato.id_contrato || contrato.id;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.fecha_inicio && formData.fecha_fin && formData.fecha_inicio >= formData.fecha_fin) {
      toast.error('La fecha de finalización debe ser posterior a la fecha de inicio');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Actualizando datos del contrato...');

    try {
      const payload = {
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        monto_renta: parseFloat(formData.monto_renta) || 0,
        garantia: parseFloat(formData.garantia) || 0,
        numero_llaves: Number(formData.numero_llaves) || 0,
        estado: formData.estado,
      };

      const actualizado = await actualizarContrato(idContrato, payload);

      toast.success('Contrato actualizado correctamente', { id: toastId });
      if (onSave) {
        onSave(actualizado || { ...contrato, ...payload });
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error actualizando contrato:', error);
      toast.error(error.message || 'No se pudo actualizar el contrato', { id: toastId });
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
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Editar Contrato #{idContrato}</h3>
              <p className="text-xs text-slate-400">
                Actualiza plazos, llaves entregadas, garantía o estado
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
          
          {/* Fechas de vigencia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Fecha de Inicio *
              </label>
              <div className="relative flex items-center">
                <Calendar size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  className="w-full py-2.5 pl-9 pr-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Fecha de Finalización *
              </label>
              <div className="relative flex items-center">
                <Calendar size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  className="w-full py-2.5 pl-9 pr-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Alquiler y Garantia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Alquiler Base ({contrato.moneda || 'BOB'}) *
              </label>
              <div className="relative flex items-center">
                <DollarSign size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.monto_renta}
                  onChange={(e) => setFormData({ ...formData, monto_renta: e.target.value })}
                  className="w-full py-2.5 pl-9 pr-3 border-2 border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Depósito Garantía ({contrato.moneda || 'BOB'}) *
              </label>
              <div className="relative flex items-center">
                <DollarSign size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.garantia}
                  onChange={(e) => setFormData({ ...formData, garantia: e.target.value })}
                  className="w-full py-2.5 pl-9 pr-3 border-2 border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Llaves y Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Llaves Entregadas *
              </label>
              <div className="relative flex items-center">
                <Key size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.numero_llaves}
                  onChange={(e) => setFormData({ ...formData, numero_llaves: e.target.value })}
                  className="w-full py-2.5 pl-9 pr-3 border-2 border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Tipo / Estado
              </label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full py-2.5 px-3.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-600 bg-white cursor-pointer"
              >
                <option value="DIRECTO">DIRECTO</option>
                <option value="TERCEROS">TERCEROS</option>
                <option value="RENOVACION">RENOVACION</option>
                <option value="FINALIZADO">FINALIZADO</option>
              </select>
            </div>
          </div>

          {/* Botones */}
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