import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export function ModalConfirmarEliminar({ isOpen, onClose, onConfirm, titulo, mensaje, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden relative animate-scale-up">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-2xl shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-slate-900 text-lg leading-tight mb-1">
                {titulo || '¿Confirmar eliminación?'}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {mensaje || 'Esta acción no se puede deshacer. ¿Deseas continuar?'}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Eliminar definitivamente
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}