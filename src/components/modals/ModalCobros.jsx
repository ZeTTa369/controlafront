import { useState, useMemo } from 'react';
import { 
  Wallet, 
  X, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Lock, 
  CreditCard, 
  Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const formatFechaDMY = (strFecha) => {
  if (!strFecha) return 'N/A';
  try {
    const soloFecha = String(strFecha).split('T')[0];
    const [y, m, d] = soloFecha.split('-');
    if (!y || !m || !d) return strFecha;
    return `${d}/${m}/${y}`;
  } catch (e) {
    return strFecha;
  }
};

export function ModalCobros(props) {
  // Acepta CUALQUIERA de las props que envíe el padre sin romper
  const contratoData = props.contratoInfo || props.contrato || {};

  const nombreInquilino = contratoData?.inquilino || 'Inquilino';
  const nombreEdificio = contratoData?.edificio || 'Edificio';
  const numDepto = contratoData?.deptoNumero || 'S/N';
  const numPiso = contratoData?.deptoPiso || 1;
  const numBloque = contratoData?.deptoBloque || 'FRONTAL';
  const moneda = contratoData?.moneda || 'BOB';
  const rentaPactada = Number(contratoData?.montoAlquiler || 0);

  const listaCobros = Array.isArray(props.cobros) ? props.cobros : [];
  const conceptosMap = props.conceptosMap || {};

  const [cobroAPagar, setCobroAPagar] = useState(null);
  const [submittingPago, setSubmittingPago] = useState(false);
  const [formPago, setFormPago] = useState({
    monto: '',
    metodo_pago: 'EFECTIVO',
    comprobante: ''
  });

  // Agrupación mensual
  const gruposMensuales = useMemo(() => {
    const grupos = {};

    listaCobros.forEach((cobro) => {
      const mes = Number(cobro.periodo_mes) || 1;
      const anio = Number(cobro.periodo_anio) || 2026;
      const clave = `${anio}-${String(mes).padStart(2, '0')}`;

      if (!grupos[clave]) {
        grupos[clave] = {
          clave,
          mes,
          anio,
          nombrePeriodo: `${MESES[mes] || 'Mes'} ${anio}`,
          items: [],
          totalMonto: 0,
          totalSaldo: 0,
        };
      }

      const monto = Number(cobro.monto || 0);
      const esPagado = (cobro.estado || '').toUpperCase() === 'PAGADO';
      const saldo = esPagado ? 0 : Math.max(0, Number(cobro.saldo_pendiente ?? monto));

      grupos[clave].items.push({
        ...cobro,
        saldoCalculado: saldo,
        esPagado
      });

      grupos[clave].totalMonto += monto;
      grupos[clave].totalSaldo += saldo;
    });

    return Object.values(grupos)
      .sort((a, b) => b.clave.localeCompare(a.clave))
      .map((g) => ({
        ...g,
        estaCompletamentePagado:
          g.items.length > 0 &&
          g.items.every((it) => it.esPagado) &&
          g.totalSaldo === 0,
      }));
  }, [listaCobros]);

  // Totales
  const totalesContrato = useMemo(() => {
    let totalPagado = 0;
    let totalDeuda = 0;

    listaCobros.forEach((c) => {
      const monto = Number(c.monto || 0);
      const esPagado = (c.estado || '').toUpperCase() === 'PAGADO';
      if (esPagado) {
        totalPagado += monto;
      } else {
        totalDeuda += Math.max(0, Number(c.saldo_pendiente ?? monto));
      }
    });

    return { totalPagado, totalDeuda };
  }, [listaCobros]);

  const abrirFormPago = (cobro) => {
    const esPagado = (cobro.estado || '').toUpperCase() === 'PAGADO';
    const saldo = esPagado ? 0 : (cobro.saldo_pendiente ?? cobro.monto);

    setCobroAPagar(cobro);
    setFormPago({
      monto: saldo,
      metodo_pago: 'EFECTIVO',
      comprobante: ''
    });
  };

  const handleConfirmarPago = async (e) => {
    e.preventDefault();
    if (!cobroAPagar) return;

    const idTarget = cobroAPagar.id_cobro || cobroAPagar.id;
    const montoPagado = Number(formPago.monto);

    setSubmittingPago(true);
    const toastId = toast.loading('Registrando cobro...');

    try {
      const response = await fetch(`${BASE_URL}/cobros/${idTarget}/pagar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          monto: montoPagado,
          metodo_pago: formPago.metodo_pago,
          comprobante: formPago.comprobante || null
        }),
      });

      const dataRespuesta = await handleResponse(response);

      if (props.onCobroExitoso) {
        props.onCobroExitoso({
          id: idTarget,
          montoPagado,
          servidorData: dataRespuesta
        });
      }

      toast.success('¡Cobro registrado exitosamente!', { id: toastId });
      setCobroAPagar(null);
    } catch (error) {
      toast.error(error.message || 'Error al procesar cobro', { id: toastId });
    } finally {
      setSubmittingPago(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-up">
        
        {/* Cabecera */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl">
              <Wallet size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base flex items-center gap-2">
                Cobranzas - {nombreInquilino}
              </h3>
              <p className="text-xs text-slate-400">
                {nombreEdificio} • Piso {numPiso} Depto {numDepto} ({numBloque})
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={props.onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Resumen */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Pagado</span>
            <p className="text-lg font-black text-emerald-600 mt-0.5">
              {totalesContrato.totalPagado.toFixed(2)} <span className="text-xs font-bold text-slate-400">{moneda}</span>
            </p>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Saldo Pendiente</span>
            <p className={`text-lg font-black mt-0.5 ${totalesContrato.totalDeuda > 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {totalesContrato.totalDeuda.toFixed(2)} <span className="text-xs font-bold text-slate-400">{moneda}</span>
            </p>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Renta Pactada</span>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              {rentaPactada.toFixed(2)} <span className="text-xs font-bold text-slate-400">{moneda} / mes</span>
            </p>
          </div>
        </div>

        {/* Desglose Mensual */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {gruposMensuales.length > 0 ? (
            gruposMensuales.map((grupo) => (
              <div key={grupo.clave} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Calendar size={18} className="text-blue-600" />
                    <span className="font-extrabold text-slate-800 text-sm">{grupo.nombrePeriodo}</span>
                    {grupo.estaCompletamentePagado ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Período Cancelado
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                        <Clock size={12} /> Saldo: {grupo.totalSaldo.toFixed(2)} {moneda}
                      </span>
                    )}
                  </div>

                  <div>
                    {grupo.estaCompletamentePagado ? (
                      <button
                        type="button"
                        onClick={() =>
                          props.onSolicitarRecibo &&
                          props.onSolicitarRecibo({
                            contrato: {
                              inquilino: nombreInquilino,
                              edificio: nombreEdificio,
                              deptoNumero: numDepto,
                              deptoPiso: numPiso,
                              deptoBloque: numBloque,
                              moneda: moneda,
                              idContrato: contratoData.idContrato,
                            },
                            grupo,
                          })
                        }
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                      >
                        <Printer size={14} /> Imprimir Recibo
                      </button>
                    ) : (
                      <div 
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed select-none"
                        title="Todos los conceptos de este período deben estar pagados para emitir recibo"
                      >
                        <Lock size={13} className="text-slate-400" /> Recibo Bloqueado
                      </div>
                    )}
                  </div>
                </div>

                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-white">
                      <th className="py-2.5 px-4">Concepto</th>
                      <th className="py-2.5 px-4">Monto</th>
                      <th className="py-2.5 px-4">Límite</th>
                      <th className="py-2.5 px-4">Estado</th>
                      <th className="py-2.5 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {grupo.items.map((cobro) => {
                      const id = cobro.id_cobro || cobro.id;
                      const esPagado = cobro.esPagado;
                      const monto = Number(cobro.monto || 0);
                      const saldo = cobro.saldoCalculado;
                      const conceptoNombre = conceptosMap[cobro.id_concepto] || cobro.descripcion || 'Alquiler';

                      return (
                        <tr key={id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800 text-xs block">{conceptoNombre}</span>
                            {cobro.descripcion && cobro.descripcion !== conceptoNombre && (
                              <span className="text-[11px] text-slate-400">{cobro.descripcion}</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-extrabold text-slate-900 text-xs">
                              {monto.toFixed(2)} {cobro.moneda || 'BOB'}
                            </span>
                            {!esPagado && saldo < monto && saldo > 0 && (
                              <span className="text-[11px] font-bold text-amber-600 block">Saldo: {saldo.toFixed(2)}</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-xs font-medium text-slate-600">
                            {formatFechaDMY(cobro.fecha_vencimiento)}
                          </td>

                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 text-[11px] font-extrabold border rounded-md ${
                              esPagado 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {esPagado ? 'PAGADO' : 'PENDIENTE'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            {!esPagado ? (
                              <button
                                type="button"
                                onClick={() => abrirFormPago(cobro)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all active:scale-95 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 size={13} /> Cobrar
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1">
                                <CheckCircle2 size={14} /> Pagado
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm">
              Este contrato no registra cuotas emitidas.
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={props.onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>

      {/* Modal Confirmar Pago */}
      {cobroAPagar && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-scale-up">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={20} className="text-emerald-400" />
                <h3 className="font-extrabold text-base">Registrar Cobro de Cuota</h3>
              </div>
              <button 
                type="button"
                onClick={() => setCobroAPagar(null)} 
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmarPago} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Monto a Cobrar ({cobroAPagar.moneda || 'BOB'}) *
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  required
                  value={formPago.monto} 
                  onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })}
                  className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl font-black text-xl text-slate-900 outline-none focus:border-emerald-600 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Método de Pago *
                </label>
                <select 
                  value={formPago.metodo_pago} 
                  onChange={(e) => setFormPago({ ...formPago, metodo_pago: e.target.value })}
                  className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-600 bg-white cursor-pointer"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria / QR</option>
                  <option value="TARJETA">Tarjeta Débito / Crédito</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Nº Comprobante / Transacción (Opcional)
                </label>
                <input 
                  type="text" 
                  placeholder="Ej. TR-89104"
                  value={formPago.comprobante} 
                  onChange={(e) => setFormPago({ ...formPago, comprobante: e.target.value })}
                  className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-emerald-600 bg-slate-50 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setCobroAPagar(null)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={submittingPago}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 text-sm disabled:opacity-50 flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  {submittingPago ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Procesando...
                    </>
                  ) : (
                    'Confirmar Cobro'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}