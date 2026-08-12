import { useState } from 'react';
import { 
  CreditCard, 
  FileText, 
  Users, 
  DollarSign, 
  Coins, 
  TrendingUp, 
  Hash, 
  Image as ImageIcon, 
  Activity,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

// Datos de prueba simulados
const COBROS_PENDIENTES = [
  { id: 1, texto: 'Cobro #1 - Expensas Comunes (USD 450.00)' },
  { id: 2, texto: 'Cobro #2 - Mantenimiento Ascensores (USD 350.00)' }
];

const USUARIOS_PAGADORES = [
  { id: 2, nombre: 'Ana María Rojas (Inquilino)' },
  { id: 3, nombre: 'Luis Fernando Ortiz (Inquilino)' }
];

export function NuevoPago({ onClose, onSave }) {
  // Mapeo exacto de las columnas de tu tabla pago
  const [formData, setFormData] = useState({
    id_cobro: '',
    id_usuario: '',
    monto_pagado: '',
    moneda: 'USD',
    tipo_cambio: '6.9600', // Tipo de cambio por defecto (ej. bolivianos a dólar)
    metodo_pago: 'Transferencia Bancaria',
    num_transaccion: '',
    comprobante: '', // URL o texto de referencia del comprobante
    fecha_pago: new Date().toISOString().slice(0, 16), // Formato para datetime-local
    observaciones: '',
    estado: 'Completado' // Completado, Pendiente de Verificación, Rechazado
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
        toast.success('¡Pago registrado exitosamente!');
        setIsSubmitting(false);
        if (onClose) onClose();
      }, 1000);
    } catch (error) {
      toast.error('Error al registrar el pago');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-w-3xl mx-auto animate-fade-in">
      
      {/* Cabecera del Formulario */}
      <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <CreditCard size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">Registrar Nuevo Pago</h2>
            <p className="text-sm text-slate-400">Ingresa los detalles de la transacción y el comprobante</p>
          </div>
        </div>
      </div>

      {/* Cuerpo del Formulario */}
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        
        {/* Selección de Cobro y Usuario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Cobro a Cancelar</label>
            <div className="relative flex items-center group">
              <FileText size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10" />
              <select
                name="id_cobro"
                required
                value={formData.id_cobro}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm"
              >
                <option value="">Seleccione un cobro pendiente...</option>
                {COBROS_PENDIENTES.map(c => (
                  <option key={c.id} value={c.id}>{c.texto}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Usuario / Pagador</label>
            <div className="relative flex items-center group">
              <Users size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10" />
              <select
                name="id_usuario"
                required
                value={formData.id_usuario}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm"
              >
                <option value="">Seleccione el usuario que paga...</option>
                {USUARIOS_PAGADORES.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Monto, Moneda y Tipo de Cambio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Monto Pagado</label>
            <div className="relative flex items-center group">
              <DollarSign size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="number"
                step="0.01"
                name="monto_pagado"
                required
                placeholder="0.00"
                value={formData.monto_pagado}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 font-bold"
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
            <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Cambio</label>
            <div className="relative flex items-center group">
              <TrendingUp size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="number"
                step="0.0001"
                name="tipo_cambio"
                required
                value={formData.tipo_cambio}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 font-bold text-sm"
              />
            </div>
          </div>
        </div>

        {/* Método de Pago, N° Transacción y Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-slate-50 border border-slate-100 rounded-xl">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Método de Pago</label>
            <select
              name="metodo_pago"
              value={formData.metodo_pago}
              onChange={handleChange}
              className="w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm"
            >
              <option value="Transferencia Bancaria">Transferencia Bancaria</option>
              <option value="Efectivo">Efectivo</option>
              <option value="QR / Billetera Móvil">QR / Billetera Móvil</option>
              <option value="Tarjeta de Crédito/Débito">Tarjeta de Crédito/Débito</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">N° de Transacción</label>
            <div className="relative flex items-center group">
              <Hash size={16} className="absolute left-3 text-slate-400" />
              <input
                type="text"
                name="num_transaccion"
                placeholder="Ej. TXN-9854721"
                value={formData.num_transaccion}
                onChange={handleChange}
                className="w-full py-3.5 pl-9 pr-3 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Fecha y Hora de Pago</label>
            <div className="relative flex items-center group">
              <Calendar size={16} className="absolute left-3 text-slate-400" />
              <input
                type="datetime-local"
                name="fecha_pago"
                required
                value={formData.fecha_pago}
                onChange={handleChange}
                className="w-full py-3 pl-9 pr-3 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 text-xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* Comprobante y Observaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Comprobante (URL / Referencia)</label>
            <div className="relative flex items-center group">
              <ImageIcon size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                name="comprobante"
                placeholder="Enlace de la imagen o recibo..."
                value={formData.comprobante}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Estado del Pago</label>
            <div className="relative flex items-center group">
              <Activity size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10" />
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-white outline-none transition-all focus:border-blue-600 font-bold appearance-none cursor-pointer text-sm"
              >
                <option value="Completado">Completado</option>
                <option value="Pendiente de Verificación">Pendiente de Verificación</option>
                <option value="Rechazado">Rechazado</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Observaciones</label>
          <textarea
            name="observaciones"
            rows="2"
            maxLength={255}
            placeholder="Comentarios adicionales sobre el pago..."
            value={formData.observaciones}
            onChange={handleChange}
            className="w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 resize-none text-sm"
          ></textarea>
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
            {isSubmitting ? 'Guardando...' : 'Registrar Pago'}
          </button>
        </div>

      </form>
    </div>
  );
}