import { useState } from 'react';
import { 
  Wrench, 
  Search, 
  Edit2, 
  Trash2, 
  Building2, 
  Home, 
  Calendar, 
  DollarSign, 
  Plus, 
  AlertTriangle,
  UserCheck
} from 'lucide-react';

// Datos de prueba simulando la base de datos de refacciones
const REFACCIONES_INICIALES = [
  {
    id_refaccion: 1,
    edificio: 'Salón de Eventos Gaviota',
    departamento: 'Dpto C (2do Piso)',
    titulo: 'Reparación de filtración de agua en lavandería',
    tipo: 'Plomería',
    prioridad: 'Alta',
    costo_estimado: 250.00,
    costo_real: 280.00,
    moneda: 'BOB',
    proveedor_encargado: 'Plomería San José',
    fecha_solicitud: '2026-07-28',
    fecha_inicio: '2026-08-01',
    estado: 'En Proceso'
  },
  {
    id_refaccion: 2,
    edificio: 'Torre Zafiro Platinum',
    departamento: 'Área Común',
    titulo: 'Mantenimiento preventivo anual del ascensor',
    tipo: 'Ascensor',
    prioridad: 'Media',
    costo_estimado: 1200.00,
    costo_real: 1200.00,
    moneda: 'BOB',
    proveedor_encargado: 'Elevadores BolS.R.L.',
    fecha_solicitud: '2026-07-15',
    fecha_inicio: '2026-07-20',
    estado: 'Completado'
  },
  {
    id_refaccion: 3,
    edificio: 'Condominio El Bosque',
    departamento: 'Área Común',
    titulo: 'Pintado y retoque de fachadas exteriores en planta baja',
    tipo: 'Pintura',
    prioridad: 'Baja',
    costo_estimado: 850.00,
    costo_real: 0.00,
    moneda: 'BOB',
    proveedor_encargado: 'Pinturas & Estilo',
    fecha_solicitud: '2026-08-02',
    fecha_inicio: '',
    estado: 'Pendiente'
  }
];

export function ListadoRefacciones({ onNuevaRefaccionClick }) {
  const [refacciones, setRefacciones] = useState(REFACCIONES_INICIALES);
  const [busqueda, setBusqueda] = useState('');

  // Filtramos por título, edificio, proveedor o tipo de trabajo
  const refaccionesFiltradas = refacciones.filter(r => 
    r.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.edificio.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.tipo.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.proveedor_encargado.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleDelete = (id) => {
    if (confirm('¿Estás seguro de eliminar este registro de refacción?')) {
      setRefacciones(refacciones.filter(r => r.id_refaccion !== id));
    }
  };

  // Estilos según el estado del trabajo
  const getEstadoEstilos = (estado) => {
    switch (estado) {
      case 'Completado': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'En Proceso': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Pendiente': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Cancelado': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Estilos según nivel de prioridad
  const getPrioridadBadge = (prioridad) => {
    switch (prioridad) {
      case 'Urgente': return 'bg-red-100 text-red-700 font-extrabold';
      case 'Alta': return 'bg-orange-100 text-orange-700 font-bold';
      case 'Media': return 'bg-slate-100 text-slate-700 font-semibold';
      case 'Baja': return 'bg-slate-50 text-slate-500 font-medium';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-fade-in">
      
      {/* Cabecera de la sección */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Listado de Refacciones y Mantenimientos</h2>
          <p className="text-sm text-slate-500">Supervisa las órdenes de trabajo, proveedores y costos asociados.</p>
        </div>

        <button 
          onClick={onNuevaRefaccionClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
        >
          <Plus size={18} /> Nueva Refacción
        </button>
      </div>

      {/* Barra de Búsqueda Interna */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-6 max-w-md focus-within:border-blue-600 focus-within:bg-white transition-all">
        <Search size={18} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar por título, edificio, tipo o técnico..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-transparent border-none outline-none ml-2 text-sm text-slate-800 w-full"
        />
      </div>

      {/* Tabla de Refacciones */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-4 px-4">Refacción / Ubicación</th>
              <th className="py-4 px-4">Prioridad</th>
              <th className="py-4 px-4">Costos (Est. / Real)</th>
              <th className="py-4 px-4">Encargado</th>
              <th className="py-4 px-4">Estado</th>
              <th className="py-4 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {refaccionesFiltradas.length > 0 ? (
              refaccionesFiltradas.map((item) => (
                <tr key={item.id_refaccion} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0 mt-1">
                        <Wrench size={18} />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800 text-sm">{item.titulo}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Building2 size={12} className="text-slate-400" /> {item.edificio}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Home size={12} className="text-slate-400" /> {item.departamento}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 text-xs rounded-md ${getPrioridadBadge(item.prioridad)}`}>
                      {item.prioridad}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-extrabold text-slate-800 text-xs">
                      Real: {item.costo_real > 0 ? `${item.costo_real.toFixed(2)} ${item.moneda}` : 'Pendiente'}
                    </div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">
                      Est.: {item.costo_estimado.toFixed(2)} {item.moneda}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-600">
                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <UserCheck size={13} className="text-slate-400" /> {item.proveedor_encargado || 'Sin asignar'}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar size={11} /> {item.fecha_solicitud}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 text-xs font-bold border rounded-lg ${getEstadoEstilos(item.estado)}`}>
                      {item.estado}
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
                        onClick={() => handleDelete(item.id_refaccion)}
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
                  No se encontraron refacciones o mantenimientos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}