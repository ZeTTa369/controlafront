import { X, Printer } from 'lucide-react';

// Helper para convertir números a palabras en español (Bolivianos)
function numeroALetras(monto) {
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const diezA19 = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  const numero = Math.floor(monto);
  const centavos = Math.round((monto - numero) * 100);
  const centavosTxt = `${String(centavos).padStart(2, '0')}/100 BOLIVIANOS`;

  if (numero === 0) return `CERO ${centavosTxt}`;
  if (numero === 100) return `CIEN ${centavosTxt}`;

  function procesarCentenas(n) {
    let out = '';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (c > 0) out += centenas[c] + ' ';
    if (d === 1) {
      out += diezA19[u] + ' ';
    } else if (d > 1) {
      out += decenas[d];
      if (u > 0) out += ' Y ' + unidades[u];
      out += ' ';
    } else if (u > 0) {
      out += unidades[u] + ' ';
    }
    return out.trim();
  }

  let letras = '';
  const miles = Math.floor(numero / 1000);
  const resto = numero % 1000;

  if (miles === 1) {
    letras += 'UN MIL ';
  } else if (miles > 1) {
    letras += procesarCentenas(miles) + ' MIL ';
  }

  if (resto > 0) {
    letras += procesarCentenas(resto) + ' ';
  }

  return `${letras.trim()} ${centavosTxt}`;
}

// Helper de fecha en español largo
function formatFechaLarga(fecha = new Date()) {
  const opciones = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
  return new Intl.DateTimeFormat('es-BO', opciones).format(fecha);
}

export function Recibo({ reciboData, conceptosMap, onClose }) {
  if (!reciboData) return null;

  const { contrato, grupo } = reciboData;
  const anio = grupo.anio || new Date().getFullYear();
  const nroRecibo = String(contrato.idContrato || 1).padStart(5, '0');
  const montoTotal = Number(grupo.totalMonto || 0);

  // Concepto consolidado con todos los ítems del período
  const detalleConceptos = grupo.items.map(it => {
    return conceptosMap[it.id_concepto] || it.descripcion || 'ALQUILER';
  }).join(' + ');

  const textoConcepto = `PAGO DEP ${contrato.deptoNumero || '1'} (${contrato.deptoBloque || 'FRONTAL'}) PERÍODO ${grupo.nombrePeriodo.toUpperCase()} - ${detalleConceptos}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Barra superior de control (oculta al imprimir) */}
        <div className="bg-slate-900 px-6 py-3.5 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-emerald-400" />
            <h3 className="font-extrabold text-sm">Vista Previa de Recibo</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Talonario / Recibo Físico */}
        <div className="p-8 overflow-y-auto flex-1 bg-slate-50 print:bg-white print:p-0 print:overflow-visible flex items-center justify-center">
          
          <div className="w-full max-w-xl bg-white border-2 border-[#1a365d] rounded-[24px] p-7 shadow-sm text-slate-900 font-sans print:border-2 print:border-black print:rounded-2xl print:shadow-none">
            
            {/* Título Superior */}
            <h1 className="text-center font-black text-2xl tracking-wider text-[#102a45] uppercase mb-4 border-b border-transparent">
              RECIBO DE PAGO/{anio}
            </h1>

            {/* Cabecera: Dirección vs Bloque Nro y Monto */}
            <div className="grid grid-cols-12 gap-3 items-start pb-5">
              
              {/* Dirección */}
              <div className="col-span-7 text-[11px] leading-tight text-slate-800 font-bold space-y-0.5">
                <p>
                  <span className="font-black text-[#102a45]">Dirección: </span>
                  {contrato.edificio || 'Edificio Residencial'}
                </p>
                <p className="font-semibold text-slate-600">
                  {contrato.contratoOriginal?.direccion || 'Calle / Avenida Principal'}
                </p>
                <p className="font-bold text-[#102a45]">
                  Cochabamba - Bolivia
                </p>
              </div>

              {/* Recuadro de Recibo Nº y Monto */}
              <div className="col-span-5 flex flex-col items-end">
                <div className="w-full border-2 border-slate-900 rounded-sm divide-y-2 divide-slate-900 overflow-hidden text-center bg-white">
                  
                  {/* Fila Nro Recibo */}
                  <div className="flex items-center text-xs">
                    <span className="w-24 py-1.5 px-2 font-black text-[#102a45] border-r-2 border-slate-900 text-left">
                      RECIBO Nº
                    </span>
                    <span className="flex-1 py-1.5 px-2 font-black text-red-600 text-base tracking-widest text-center">
                      {nroRecibo}
                    </span>
                  </div>

                  {/* Fila Monto */}
                  <div className="flex items-center text-xs">
                    <span className="w-24 py-1.5 px-2 font-black text-[#102a45] border-r-2 border-slate-900 text-left">
                      POR:
                    </span>
                    <span className="flex-1 py-1.5 px-2 font-black text-slate-950 text-sm tracking-wide text-center">
                      Bs. {montoTotal.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                </div>
              </div>

            </div>

            {/* Recuadro Central con líneas punteadas */}
            <div className="border-2 border-slate-900 rounded-lg p-3.5 space-y-3.5 mb-5 text-[11px] bg-white">
              
              {/* Recibí del Sr.(a) */}
              <div className="flex items-baseline">
                <span className="font-black text-[#102a45] whitespace-nowrap mr-2 tracking-wide text-[10px]">
                  RECIBÍ DEL SR.(A):
                </span>
                <div className="flex-1 border-b border-dotted border-slate-700 pb-0.5">
                  <span className="font-black text-slate-900 uppercase pl-1 text-[11px]">
                    {contrato.inquilino}
                  </span>
                </div>
              </div>

              {/* La Suma de */}
              <div className="flex items-baseline">
                <span className="font-black text-[#102a45] whitespace-nowrap mr-2 tracking-wide text-[10px]">
                  LA SUMA DE:
                </span>
                <div className="flex-1 border-b border-dotted border-slate-700 pb-0.5">
                  <span className="font-black text-slate-800 uppercase pl-1 text-[10.5px]">
                    {numeroALetras(montoTotal)}
                  </span>
                </div>
              </div>

              {/* Por Concepto de (Multilínea punteada) */}
              <div className="space-y-1.5">
                <div className="flex items-baseline">
                  <span className="font-black text-[#102a45] whitespace-nowrap mr-2 tracking-wide text-[10px]">
                    POR CONCEPTO DE:
                  </span>
                  <div className="flex-1 border-b border-dotted border-slate-700 pb-0.5">
                    <span className="font-bold text-slate-800 uppercase text-[10px] pl-1 line-clamp-1">
                      {textoConcepto}
                    </span>
                  </div>
                </div>
                <div className="w-full border-b border-dotted border-slate-700 h-2"></div>
              </div>

            </div>

            {/* Fecha en formato largo */}
            <div className="text-center font-black text-xs text-slate-900 capitalize my-4">
              {formatFechaLarga(new Date())}
            </div>

            {/* Sección Inferior: Código de barras simulado y Firmas */}
            <div className="grid grid-cols-12 gap-2 items-end pt-4">
              
              {/* Código de barras decorativo */}
              <div className="col-span-3 text-left">
                <div className="font-mono text-[9px] text-slate-400 tracking-widest select-none opacity-60">
                  |||||| |||| ||| |||||||
                  <p className="text-[8px]">*REC{nroRecibo}*</p>
                </div>
              </div>

              {/* Firma Recibí Conforme */}
              <div className="col-span-4 text-center">
                <div className="h-9 flex items-end justify-center mb-1">
                  <span className="font-serif italic text-lg text-slate-700 select-none">
                    Admin
                  </span>
                </div>
                <div className="border-t-2 border-slate-900 pt-1">
                  <span className="font-black text-[9px] uppercase tracking-wider text-slate-900 block">
                    RECIBÍ CONFORME
                  </span>
                </div>
              </div>

              <div className="col-span-1"></div>

              {/* Firma Entregué Conforme */}
              <div className="col-span-4 text-center">
                <div className="h-9 flex items-end justify-center mb-1">
                  <span className="text-slate-800 text-sm font-bold select-none">✓</span>
                </div>
                <div className="border-t-2 border-slate-900 pt-1">
                  <span className="font-black text-[9px] uppercase tracking-wider text-slate-900 block">
                    ENTREGUÉ CONFORME
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Botones de Acción en Pantalla */}
        <div className="bg-slate-100 px-6 py-3.5 border-t border-slate-200 flex justify-end gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl text-xs transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-6 py-2 bg-[#102a45] hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-slate-900/20 active:scale-95 transition-all"
          >
            <Printer size={15} /> Imprimir Recibo
          </button>
        </div>

      </div>
    </div>
  );
}