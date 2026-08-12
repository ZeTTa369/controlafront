import { useState } from 'react';
import { 
  Wallet, 
  FileText, 
  Tag, 
  DollarSign, 
  Coins, 
  Calendar, 
  Activity,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

// Datos de prueba (en producción provendrán de tus tablas de Contratos y Conceptos)
const CONTRATOS_DISPONIBLES = [
  { id: 1, texto: 'Contrato #1 - Unidad 101 (Ana María Rojas)' },
  { id: 2, texto: 'Contrato #2 - PB-2 (Luis Fernando Ortiz)' }
];

const CONCEPTOS_DISPONIBLES = [
  { id: 1, nombre: 'Expensas Comunes' },
  { id: 2, nombre: 'Mantenimiento de Ascensores' },
  { id: 3, nombre: 'Multa por ruidos molestos' }
];

export function NuevoCobro({ onClose, onSave }) {
  // Mapeo exacto de las columnas de tu tabla cobros
  const [formData, setFormData] = useState({
    id_contrato: '',
    id_concepto: '',
    descripcion: '',
    monto: '',
    moneda: 'USD',
    periodo_mes: new Date().getMonth() + 1, // Mes actual por defecto
    periodo_anio: new Date().getFullYear(), // Año actual por defecto
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    estado: 'Pendiente' // Pendiente, Pagado, Anulado
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

    try {
      setTimeout(() => {
        if (onSave) onSave(formData);
        toast.success('¡Cobro registrado exitosamente!');
        setIsSubmitting(false);
        if (onClose) onClose();
      }, 1000);
    } catch (error) {
      toast.error('Error al registrar el cobro');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-w-3xl mx-auto animate-fade-in">
      
      {/* Cabecera del Formulario */}
      <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <Wallet size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">Generar Nuevo Cobro</h2>
            <p className="text-sm text-slate-400">Emite una cuenta de cobro o expensa vinculada a un contrato</p>
          </div>
        </div>
      </div>

      {/* Cuerpo del Formulario */}
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        
        {/* Selección de Contrato y Concepto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Contrato Asociado</label>
            <div className="relative flex items-center group">
              <FileText size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10" />
              <select
                name="id_contrato"
                required
                value={formData.id_contrato}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm"
              >
                <option value="">Seleccione un contrato...</option>
                {CONTRATOS_DISPONIBLES.map(c => (
                  <option key={c.id} value={c.id}>{c.texto}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Concepto de Cobro</label>
            <div className="relative flex items-center group">
              <Tag size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10" />
              <select
                name="id_concepto"
                required
                value={formData.id_concepto}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm"
              >
                <option value="">Seleccione un concepto...</option>
                {CONCEPTOS_DISPONIBLES.map(con => (
                  <option key={con.id} value={con.id}>{con.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Descripción del Cobro</label>
          <div className="relative flex items-start group pt-3.5">
            <FileText size={18} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <textarea
              name="descripcion"
              required
              maxLength={255}
              rows="2"
              placeholder="Ej. Cobro de expensas correspondientes al mes de..."
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white resize-none text-sm"
            ></textarea>
          </div>
        </div>

        {/* Monto, Moneda y Período (Mes/Año) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">Monto</label>
            <div className="relative flex items-center group">
              <DollarSign size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="number"
                step="0.01"
                name="monto"
                required
                placeholder="0.00"
                value={formData.monto}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Moneda</label>
            <div className="relative flex items-center group">
              <Coins size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10" />
              <select
                name="moneda"
                value={formData.moneda}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm"
              >
                <option value="USD">USD ($)</option>
                <option value="BOB">BOB (Bs)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Año</label>
            <input
              type="number"
              name="periodo_anio"
              required
              value={formData.periodo_anio}
              onChange={handleChange}
              className="w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 font-bold text-sm text-center"
            />
          </div>
        </div>

        {/* Período Mes, Fechas de Emisión y Vencimiento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-slate-50 border border-slate-100 rounded-xl">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Período (Mes)</label>
            <select
              name="periodo_mes"
              value={formData.periodo_mes}
              onChange={handleChange}
              className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm"
            >
              <option value={1}>Enero</option>
              <option value={2}>Febrero</option>
              <option value={3}>Marzo</option>
              <option value={4}>Abril</option>
              <option value={5}>Mayo</option>
              <option value={6}>Junio</option>
              <option value={7}>Julio</option>
              <option value={8}>Agosto</option>
              <option value={9}>Septiembre</option>
              <option value={10}>Octubre</option>
              <option value={11}>Noviembre</option>
              <option value={12}>Diciembre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Fecha Emisión</label>
            <div className="relative flex items-center group">
              <Calendar size={16} className="absolute left-3 text-slate-400" />
              <input
                type="date"
                name="fecha_emision"
                required
                value={formData.fecha_emision}
                onChange={handleChange}
                className="w-full py-3 pl-9 pr-3 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Fecha Vencimiento</label>
            <div className="relative flex items-center group">
              <Calendar size={16} className="absolute left-3 text-slate-400" />
              <input
                type="date"
                name="fecha_vencimiento"
                required
                value={formData.fecha_vencimiento}
                onChange={handleChange}
                className="w-full py-3 pl-9 pr-3 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Estado inicial */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Estado del Cobro</label>
          <div className="relative flex items-center group">
            <Activity size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10" />
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Pagado">Pagado</option>
              <option value="Anulado">Anulado</option>
            </select>
          </div>
        </div>

        {/* Botones de Acción */}
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
            <CheckCircle2 size={18} />
            {isSubmitting ? 'Guardando...' : 'Generar Cobro'}
          </button>
        </div>

      </form>
    </div>
  );
}