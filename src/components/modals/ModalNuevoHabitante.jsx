import { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export function ModalNuevoHabitante({ isOpen, onClose, onAgregar }) {
  const [nuevoHabitante, setNuevoHabitante] = useState({
    nombres: '',
    primer_apellido: '',
    segundo_apellido: '',
    ci_nit: '',
    parentesco: 'Hijo/a',
    telefono: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nuevoHabitante.nombres.trim() || !nuevoHabitante.primer_apellido.trim()) {
      toast.error('Nombres y Primer Apellido son obligatorios');
      return;
    }

    onAgregar({
      id_temp: Date.now(),
      nombres: nuevoHabitante.nombres.trim(),
      primer_apellido: nuevoHabitante.primer_apellido.trim(),
      segundo_apellido: nuevoHabitante.segundo_apellido?.trim() || '',
      ci_nit: nuevoHabitante.ci_nit?.trim() || '',
      parentesco: nuevoHabitante.parentesco,
      telefono: nuevoHabitante.telefono?.trim() || '',
    });

    setNuevoHabitante({
      nombres: '',
      primer_apellido: '',
      segundo_apellido: '',
      ci_nit: '',
      parentesco: 'Hijo/a',
      telefono: '',
    });

    toast.success('Habitante añadido a la lista');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-scale-up">
        {/* Cabecera */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus size={20} className="text-blue-500" />
            <h3 className="font-extrabold text-base">Registrar Habitante / Dependiente</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombres *</label>
              <input
                type="text"
                required
                placeholder="Ej. Mateo"
                value={nuevoHabitante.nombres}
                onChange={(e) => setNuevoHabitante({ ...nuevoHabitante, nombres: e.target.value })}
                className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Primer Apellido *</label>
              <input
                type="text"
                required
                placeholder="Ej. Mendoza"
                value={nuevoHabitante.primer_apellido}
                onChange={(e) => setNuevoHabitante({ ...nuevoHabitante, primer_apellido: e.target.value })}
                className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Segundo Apellido</label>
              <input
                type="text"
                placeholder="Ej. Alavia (Opcional)"
                value={nuevoHabitante.segundo_apellido}
                onChange={(e) => setNuevoHabitante({ ...nuevoHabitante, segundo_apellido: e.target.value })}
                className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cédula / Carnet</label>
              <input
                type="text"
                placeholder="Ej. 8765432 (Opcional si es menor)"
                value={nuevoHabitante.ci_nit}
                onChange={(e) => setNuevoHabitante({ ...nuevoHabitante, ci_nit: e.target.value })}
                className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Parentesco / Rol</label>
              <select
                value={nuevoHabitante.parentesco}
                onChange={(e) => setNuevoHabitante({ ...nuevoHabitante, parentesco: e.target.value })}
                className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:border-blue-600 bg-white"
              >
                <option value="Hijo/a">Hijo/a</option>
                <option value="Cónyuge / Pareja">Cónyuge / Pareja</option>
                <option value="Familiar">Familiar</option>
                <option value="Compañero/a">Compañero/a</option>
                <option value="Otro">Otro dependiente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / Contacto</label>
              <input
                type="text"
                placeholder="Ej. 70000000 (Opcional)"
                value={nuevoHabitante.telefono}
                onChange={(e) => setNuevoHabitante({ ...nuevoHabitante, telefono: e.target.value })}
                className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all"
            >
              Agregar a la Lista
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}