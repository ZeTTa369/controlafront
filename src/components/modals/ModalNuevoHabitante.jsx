import { useState, useEffect } from 'react';
import { UserPlus, Edit2, X, CheckCircle2, Globe, Loader2, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

const PARENTESCOS_ESTANDAR = [
  'Titular',
  'Hijo(a)',
  'Conyuge / Pareja',
  'Padre / Madre',
  'Hermano(a)',
  'Sobrino(a)',
  'Tio(a)',
  'Beneficiario / Ocupante Real',
  'Companero(a) de Cuarto',
];

const OPCIONES_OBSERVACION = [
  { value: '', label: 'Sin observaciones' },
  { value: '1 MOTO', label: 'Moto (Especificar modelo/color/#)' },
  { value: '1 AUTO / VEHICULO', label: 'Auto / Vehículo (Especificar placa/color)' },
  { value: '1 MASCOTA', label: 'Mascota autorizada' },
  { value: 'MENOR DE EDAD', label: 'Menor de edad' },
  { value: 'OTRO', label: 'Otra observación manual' },
];

export function ModalNuevoHabitante({
  isOpen,
  onClose,
  onAgregar,
  habitanteInicial = null,
  loading = false,
}) {
  const esEdicion = Boolean(habitanteInicial);

  const [nombres, setNombres] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [ciNit, setCiNit] = useState('');
  const [nacionalidad, setNacionalidad] = useState('Boliviana');
  const [parentescoSeleccion, setParentescoSeleccion] = useState('Hijo(a)');
  const [parentescoOtro, setParentescoOtro] = useState('');
  const [telefono, setTelefono] = useState('');
  const [esTitular, setEsTitular] = useState('NO');

  // Observaciones
  const [tipoObservacion, setTipoObservacion] = useState('');
  const [detalleObservacion, setDetalleObservacion] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (habitanteInicial) {
      setNombres(habitanteInicial.nombres || '');
      setPrimerApellido(habitanteInicial.primer_apellido || '');
      setSegundoApellido(habitanteInicial.segundo_apellido || '');
      setCiNit(habitanteInicial.ci_nit || '');
      setNacionalidad(habitanteInicial.nacionalidad || 'Boliviana');
      setTelefono(habitanteInicial.telefono || '');
      setEsTitular(habitanteInicial.es_titular || 'NO');

      const par = habitanteInicial.parentesco || 'Hijo(a)';
      if (PARENTESCOS_ESTANDAR.includes(par)) {
        setParentescoSeleccion(par);
        setParentescoOtro('');
      } else {
        setParentescoSeleccion('OTRO');
        setParentescoOtro(par);
      }

      const obsActual = (habitanteInicial.observaciones || '').trim();
      if (!obsActual) {
        setTipoObservacion('');
        setDetalleObservacion('');
      } else {
        setTipoObservacion('OTRO');
        setDetalleObservacion(obsActual);
      }
    } else {
      setNombres('');
      setPrimerApellido('');
      setSegundoApellido('');
      setCiNit('');
      setNacionalidad('Boliviana');
      setTelefono('');
      setParentescoSeleccion('Hijo(a)');
      setParentescoOtro('');
      setEsTitular('NO');
      setTipoObservacion('');
      setDetalleObservacion('');
    }
  }, [isOpen, habitanteInicial]);

  if (!isOpen) return null;

  const handleSeleccionObservacion = (val) => {
    setTipoObservacion(val);
    if (!val) {
      setDetalleObservacion('');
    } else if (val !== 'OTRO') {
      setDetalleObservacion(val);
    } else {
      setDetalleObservacion('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombres.trim() || !primerApellido.trim()) {
      toast.error('Nombre y primer apellido son obligatorios');
      return;
    }

    if (parentescoSeleccion === 'OTRO' && !parentescoOtro.trim()) {
      toast.error('Especifica el parentesco o vinculo del habitante');
      return;
    }

    const parentescoFinal =
      parentescoSeleccion === 'OTRO'
        ? parentescoOtro.trim()
        : parentescoSeleccion;

    const observacionFinal = tipoObservacion ? detalleObservacion.trim() : '';

    const payload = {
      id_temp: habitanteInicial?.id_temp || Date.now(),
      ...(habitanteInicial?.id_habitante
        ? { id_habitante: habitanteInicial.id_habitante }
        : {}),
      nombres: nombres.trim(),
      primer_apellido: primerApellido.trim(),
      segundo_apellido: segundoApellido.trim(),
      ci_nit: ciNit.trim(),
      nacionalidad: nacionalidad.trim() || 'Boliviana',
      parentesco: parentescoFinal,
      telefono: telefono.trim(),
      observaciones: observacionFinal,
      es_titular: parentescoFinal === 'Titular' ? 'SI' : esTitular,
    };

    const resultado = await onAgregar(payload);
    if (resultado === false) return;

    if (!esEdicion) {
      toast.success('Habitante agregado al censo del contrato');
      setNombres('');
      setPrimerApellido('');
      setSegundoApellido('');
      setCiNit('');
      setNacionalidad('Boliviana');
      setTelefono('');
      setParentescoSeleccion('Hijo(a)');
      setParentescoOtro('');
      setEsTitular('NO');
      setTipoObservacion('');
      setDetalleObservacion('');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden relative animate-scale-up">
        
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${esEdicion ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
              {esEdicion ? <Edit2 size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                {esEdicion ? 'Editar Datos del Habitante' : 'Registrar Habitante / Ocupante'}
              </h3>
              <p className="text-xs text-slate-500">
                Censo de personas autorizadas a residir en la unidad
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
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

          {/* Selector de Parentesco */}
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
                <option value="Titular">Titular</option>
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

          {/* Observaciones con opciones rapidas + texto editable */}
          <div className="space-y-2.5 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Observaciones (Vehículo, Moto, Mascota, etc.)
              </label>
              <div className="relative flex items-center">
                <ClipboardList size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={tipoObservacion}
                  onChange={(e) => handleSeleccionObservacion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  {OPCIONES_OBSERVACION.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {tipoObservacion && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl animate-fade-in">
                <label className="block text-xs font-extrabold text-amber-900 mb-1">
                  Detalle de Observación
                </label>
                <input
                  type="text"
                  placeholder="Ej. 1 MOTO PEGASUS VERDE #3"
                  value={detalleObservacion}
                  onChange={(e) => setDetalleObservacion(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-amber-600 uppercase"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  {esEdicion ? 'Guardar Cambios' : 'Agregar Habitante'}
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}