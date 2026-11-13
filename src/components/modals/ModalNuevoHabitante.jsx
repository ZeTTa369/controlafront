import { useState } from 'react';
import { UserPlus, X, CheckCircle2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export function ModalNuevoHabitante({ isOpen, onClose, onAgregar }) {
  const [nombres, setNombres] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [ciNit, setCiNit] = useState('');
  const [nacionalidad, setNacionalidad] = useState('Boliviana');
  const [parentescoSeleccion, setParentescoSeleccion] = useState('Hijo(a)');
  const [parentescoOtro, setParentescoOtro] = useState('');
  const [telefono, setTelefono] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nombres.trim() || !primerApellido.trim()) {
      toast.error('Nombre y primer apellido son obligatorios');
      return;
    }

    if (parentescoSeleccion === 'OTRO' && !parentescoOtro.trim()) {
      toast.error('Especifica el parentesco o vinculo del habitante');
      return;
    }

    const parentescoFinal = parentescoSeleccion === 'OTRO' 
      ? parentescoOtro.trim() 
      : parentescoSeleccion;

    onAgregar({
      id_temp: Date.now(),
      nombres: nombres.trim(),
      primer_apellido: primerApellido.trim(),
      segundo_apellido: segundoApellido.trim(),
      ci_nit: ciNit.trim(),
      nacionalidad: nacionalidad.trim() || 'Boliviana',
      parentesco: parentescoFinal,
      telefono: telefono.trim(),
    });

    toast.success('Habitante agregado al censo del contrato');

    // Reinicio del formulario
    setNombres('');
    setPrimerApellido('');
    setSegundoApellido('');
    setCiNit('');
    setNacionalidad('Boliviana');
    setTelefono('');
    setParentescoSeleccion('Hijo(a)');
    setParentescoOtro('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden relative animate-scale-up">
        
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Registrar Habitante / Ocupante</h3>
              <p className="text-xs text-slate-500">Censo de personas autorizadas a residir en la unidad</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario de registro */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre(s) *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Mateo"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Primer Apellido *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Mendoza"
                value={primerApellido}
                onChange={(e) => setPrimerApellido(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Segundo Apellido
              </label>
              <input
                type="text"
                placeholder="Opcional"
                value={segundoApellido}
                onChange={(e) => setSegundoApellido(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                CI / Documento
              </label>
              <input
                type="text"
                placeholder="Ej. 8541236"
                value={ciNit}
                onChange={(e) => setCiNit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Nacionalidad y Telefono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nacionalidad *
              </label>
              <div className="relative flex items-center">
                <Globe size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Boliviana"
                  value={nacionalidad}
                  onChange={(e) => setNacionalidad(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Telefono de Contacto
              </label>
              <input
                type="text"
                placeholder="Ej. 79865432"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Selector de Parentesco con opcion dinamica OTRO */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Parentesco o Vinculo *
              </label>
              <select
                value={parentescoSeleccion}
                onChange={(e) => setParentescoSeleccion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="Hijo(a)">Hijo(a)</option>
                <option value="Conyuge / Pareja">Conyuge / Pareja</option>
                <option value="Padre / Madre">Padre / Madre</option>
                <option value="Hermano(a)">Hermano(a)</option>
                <option value="Sobrino(a)">Sobrino(a)</option>
                <option value="Tio(a)">Tio(a)</option>
                <option value="Beneficiario / Ocupante Real">Beneficiario / Ocupante Real</option>
                <option value="Companero(a) de Cuarto">Companero(a) de Cuarto</option>
                <option value="OTRO">OTRO (Especificar manualmente)</option>
              </select>
            </div>

            {/* Campo condicional si se selecciona OTRO */}
            {parentescoSeleccion === 'OTRO' && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl animate-fade-in">
                <label className="block text-xs font-extrabold text-blue-900 mb-1">
                  Especificar Parentesco / Relacion *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Primo(a), Empleado(a), Apoderado..."
                  value={parentescoOtro}
                  onChange={(e) => setParentescoOtro(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              Agregar Habitante
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}