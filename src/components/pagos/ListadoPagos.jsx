import { useState } from 'react';
import { 
  CreditCard, 
  Search, 
  Edit2, 
  Trash2, 
  FileText, 
  Users, 
  Calendar, 
  DollarSign, 
  Plus, 
  Hash 
} from 'lucide-react';

// Datos de prueba simulando la base de datos de pagos
const PAGOS_INICIALES = [
  {
    id_pago: 1,
    cobro: 'Cobro #1 - Expensas Comunes',
    usuario: 'Ana María Rojas',
    monto_pagado: 450.00,
    moneda: 'USD',
    metodo_pago: 'Transferencia Bancaria',
    num_transaccion: 'TXN-9854721',
    fecha_pago: '2026-07-03 14:30',
    estado: 'Completado'
  },
  {
    id_pago: 2,
    cobro: 'Cobro #2 - Mantenimiento Ascensores',
    usuario: 'Luis Fernando Ortiz',
    monto_pagado: 350.00,
    moneda: 'USD',
    metodo_pago: 'QR / Billetera Móvil',
    num_transaccion: 'QR-6325874',
    fecha_pago: '2026-06-05 10:15',
    estado: 'Completado'
  },
  {
    id_pago: 3,
    cobro: 'Cobro #3 - Multa por ruidos',
    usuario: 'Ana María Rojas',
    monto_pagado: 50.00,
    moneda: 'USD',
    metodo_pago: 'Efectivo',
    num_transaccion: 'EFECTIVO-01',
    fecha_pago: '2026-07-06 09:00',
    estado: 'Pendiente de Verificación'
  }
];

export function ListadoPagos({ onNuevoPagoClick }) {
  const [pagos, setPagos] = useState(PAGOS_INICIALES);
  const [busqueda, setBusqueda] = useState('');

  // Filtramos por usuario, método de pago o número de transacción
  const pagosFiltrados = pagos.filter(p => 
    p.usuario.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.metodo_pago.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.num_transaccion.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.cobro.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleDelete = (id) => {
    if (confirm('¿Estás seguro de eliminar este registro de pago?')) {
      setPagos(pagos.filter(p => p.id_pago !== id));
    }
  };

  // Estilos visuales para el estado del pago
  const getEstadoEstilos = (estado) => {
    switch (estado) {
      case 'Completado': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Pendiente de Verificación': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Rechazado': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-fade-in">
      
      {/* Cabecera de la sección */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Listado de Pagos Registrados</h2>
          <p className="text-sm text-slate-500">Historial de transacciones, métodos de pago y comprobantes.</p>
        </div>

        <button 
          onClick={onNuevoPagoClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
        >
          <Plus size={18} /> Registrar Pago
        </button>
      </div>

      {/* Barra de Búsqueda Interna */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-6 max-w-md focus-within:border-blue-600 focus-within:bg-white transition-all">
        <Search size={18} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar por usuario, método, transacción..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-transparent border-none outline-none ml-2 text-sm text-slate-800 w-full"
        />
      </div>

      {/* Tabla de Pagos */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-4 px-4">Cobro / Pagador</th>
              <th className="py-4 px-4">Método / Transacción</th>
              <th className="py-4 px-4">Monto</th>
              <th className="py-4 px-4">Fecha de Pago</th>
              <th className="py-4 px-4">Estado</th>
              <th className="py-4 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {pagosFiltrados.length > 0 ? (
              pagosFiltrados.map((pago) => (
                <tr key={pago.id_pago} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                          <FileText size={13} className="text-slate-400" /> {pago.cobro}
                        </p>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                          <Users size={13} className="text-slate-400" /> {pago.usuario}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-600">
                    <p className="font-bold text-slate-700 text-xs">{pago.metodo_pago}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                      <Hash size={12} /> {pago.num_transaccion}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-extrabold text-slate-800 flex items-center gap-1">
                      <DollarSign size={15} className="text-slate-400" />
                      {pago.monto_pagado.toFixed(2)} <span className="text-xs font-bold text-slate-400">{pago.moneda}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-600">
                    <div className="flex items-center gap-1 text-xs font-semibold">
                      <Calendar size={13} className="text-slate-400" />
                      {pago.fecha_pago}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 text-xs font-bold border rounded-lg ${getEstadoEstilos(pago.estado)}`}>
                      {pago.estado}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        title="Editar"
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={17} />
                      </button>
                      <button 
                        onClick={() => handleDelete(pago.id_pago)}
                        title="Eliminar"
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-12 text-slate-400">
                  No se encontraron pagos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}