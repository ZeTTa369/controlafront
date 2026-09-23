import { X, Printer } from "lucide-react";

// Helper para convertir números a palabras en español (Bolivianos)
function numeroALetras(monto) {
  const unidades = [
    "",
    "UN",
    "DOS",
    "TRES",
    "CUATRO",
    "CINCO",
    "SEIS",
    "SIETE",
    "OCHO",
    "NUEVE",
  ];
  const decenas = [
    "",
    "DIEZ",
    "VEINTE",
    "TREINTA",
    "CUARENTA",
    "CINCUENTA",
    "SESENTA",
    "SETENTA",
    "OCHENTA",
    "NOVENTA",
  ];
  const diezA19 = [
    "DIEZ",
    "ONCE",
    "DOCE",
    "TRECE",
    "CATORCE",
    "QUINCE",
    "DIECISEIS",
    "DIECISIETE",
    "DIECIOCHO",
    "DIECINUEVE",
  ];
  const centenas = [
    "",
    "CIENTO",
    "DOSCIENTOS",
    "TRESCIENTOS",
    "CUATROCIENTOS",
    "QUINIENTOS",
    "SEISCIENTOS",
    "SETECIENTOS",
    "OCHOCIENTOS",
    "NOVECIENTOS",
  ];

  const numero = Math.floor(monto);
  const centavos = Math.round((monto - numero) * 100);
  const centavosTxt = `${String(centavos).padStart(2, "0")}/100 BOLIVIANOS`;

  if (numero === 0) return `CERO ${centavosTxt}`;
  if (numero === 100) return `CIEN ${centavosTxt}`;

  function procesarCentenas(n) {
    let out = "";
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (c > 0) out += centenas[c] + " ";
    if (d === 1) {
      out += diezA19[u] + " ";
    } else if (d > 1) {
      out += decenas[d];
      if (u > 0) out += " Y " + unidades[u];
      out += " ";
    } else if (u > 0) {
      out += unidades[u] + " ";
    }
    return out.trim();
  }

  let letras = "";
  const miles = Math.floor(numero / 1000);
  const resto = numero % 1000;

  if (miles === 1) {
    letras += "UN MIL ";
  } else if (miles > 1) {
    letras += procesarCentenas(miles) + " MIL ";
  }

  if (resto > 0) {
    letras += procesarCentenas(resto) + " ";
  }

  return `${letras.trim()} ${centavosTxt}`;
}

// Formateador estricto a DD/MM/AA
function formatCorto(fechaStr) {
  if (!fechaStr) return "";
  const limpia = String(fechaStr).split("T")[0];
  const partes = limpia.split("-");
  if (partes.length === 3) {
    const [y, m, d] = partes;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y.slice(-2)}`;
  }
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return "";
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const anio = String(d.getFullYear()).slice(-2);
  return `${dia}/${mes}/${anio}`;
}

// Fecha larga para el pie central
function formatFechaLarga(fecha = new Date()) {
  const opciones = {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  };
  return new Intl.DateTimeFormat("es-BO", opciones).format(fecha);
}

export function Recibo({ reciboData, conceptosMap = {}, onClose }) {
  if (!reciboData) return null;

  const { contrato = {}, grupo = {} } = reciboData;

  // 1. Año Cabecera sincronizado con el período del cobro
  const anioPeriodo = grupo.anio || grupo.items?.[0]?.periodo_anio || 2026;
  const mesNumero = grupo.mes || grupo.items?.[0]?.periodo_mes || 7;

  // 2. Número correlativo formateado a 5 dígitos
  const idRaw =
    grupo.idRecibo || grupo.items?.[0]?.id_cobro || contrato.idContrato || 130;
  const nroRecibo = String(idRaw).padStart(5, "0");

  // 3. Monto total
  const montoTotal = Number(grupo.totalMonto ?? 0);

  // 4. Fechas de inicio y fin del mes
  let fDesde = grupo.fechaInicio ? formatCorto(grupo.fechaInicio) : "";
  let fHasta = grupo.fechaFin ? formatCorto(grupo.fechaFin) : "";

  if (!fDesde || !fHasta) {
    const primerDia = new Date(anioPeriodo, mesNumero - 1, 11);
    const siguienteMes = new Date(anioPeriodo, mesNumero, 11);
    fDesde = formatCorto(primerDia);
    fHasta = formatCorto(siguienteMes);
  }

  // 5. Inquilino y unidad
  const inquilinoNombre = (contrato.inquilino || "INQUILINO").toUpperCase();
  const numDepto = contrato.deptoNumero || "1";
  const cantPersonas = contrato.personas || 2;
  const nombrePeriodo = (
    grupo.nombrePeriodo || `JULIO ${anioPeriodo}`
  ).toUpperCase();

  // 6. Construcción dinámica del concepto con soporte para ajustes / excepciones
  const items = Array.isArray(grupo.items) ? grupo.items : [];

  const itemAgua = items.find((it) =>
    (conceptosMap[it.id_concepto] || it.descripcion || "")
      .toUpperCase()
      .includes("AGUA"),
  );
  const itemLuz = items.find((it) =>
    (conceptosMap[it.id_concepto] || it.descripcion || "")
      .toUpperCase()
      .includes("LUZ"),
  );

  const cobraAgua = Boolean(itemAgua);
  const cobraLuz = Boolean(itemLuz);

  const motivoAgua = itemAgua?.motivo_ajuste || "";
  const motivoLuz = itemLuz?.motivo_ajuste || "";
  const motivoGeneral =
    items.find((it) => it.motivo_ajuste)?.motivo_ajuste || "";

  let textoServicios = "";

  if (cobraAgua && cobraLuz) {
    if (motivoAgua && motivoLuz && motivoAgua === motivoLuz) {
      textoServicios = ` + AGUA Y LUZ (${motivoAgua.toUpperCase()})`;
    } else if (motivoAgua) {
      textoServicios = ` + AGUA (${motivoAgua.toUpperCase()}) Y LUZ ${cantPersonas} PERSONAS`;
    } else if (motivoLuz) {
      textoServicios = ` + AGUA ${cantPersonas} PERSONAS Y LUZ (${motivoLuz.toUpperCase()})`;
    } else {
      textoServicios = ` + AGUA Y LUZ ${cantPersonas} PERSONAS`;
    }
  } else if (cobraAgua) {
    if (motivoAgua) {
      textoServicios = ` + AGUA (${motivoAgua.toUpperCase()})`;
    } else {
      textoServicios = ` + AGUA ${cantPersonas} ${cantPersonas > 1 ? "PERSONAS" : "PERSONA"}`;
    }
  } else if (cobraLuz) {
    if (motivoLuz) {
      textoServicios = ` + LUZ (${motivoLuz.toUpperCase()})`;
    } else {
      textoServicios = ` + LUZ ${cantPersonas} ${cantPersonas > 1 ? "PERSONAS" : "PERSONA"}`;
    }
  } else if (motivoGeneral) {
    textoServicios = ` (${motivoGeneral.toUpperCase()})`;
  }

  const textoConcepto = `PAGO DEP ${numDepto} DEL ${fDesde} AL ${fHasta}${textoServicios} (${nombrePeriodo})`;

  // 7. Dirección completa del edificio
  const direccionEdificio =
    contrato.direccion_edificio || contrato.edificio || "Dirección Principal";

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Barra superior de control */}
        <div className="bg-slate-900 px-6 py-3.5 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-emerald-400" />
            <h3 className="font-extrabold text-sm">Vista Previa de Recibo</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Talonario / Recibo Físico */}
        <div className="p-8 overflow-y-auto flex-1 bg-slate-50 print:bg-white print:p-0 print:overflow-visible flex items-center justify-center">
          <div className="w-full max-w-xl bg-white border-2 border-[#1a365d] rounded-[24px] p-7 shadow-sm text-slate-900 font-sans print:border-2 print:border-black print:rounded-2xl print:shadow-none">
            {/* Título Superior */}
            <h1 className="text-center font-black text-2xl tracking-wider text-[#102a45] uppercase mb-4">
              RECIBO DE PAGO/{anioPeriodo}
            </h1>

            {/* Cabecera: Dirección vs Nro y Monto */}
            <div className="grid grid-cols-12 gap-3 items-start pb-5">
              {/* Dirección */}
              <div className="col-span-7 text-[11px] leading-tight text-slate-800 font-bold space-y-0.5">
                <p>
                  <span className="font-black text-[#102a45]">Dirección: </span>
                  {direccionEdificio}
                </p>
                <p className="font-bold text-[#102a45] pt-0.5">
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
                      Bs.{" "}
                      {montoTotal.toLocaleString("es-BO", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recuadro Central con etiquetas alineadas y contenido centrado */}
            <div className="border-2 border-slate-900 rounded-lg p-4 space-y-4 mb-5 text-[11px] bg-white">
              {/* Recibí del Sr.(a) */}
              <div className="flex items-end">
                <span className="font-black text-[#102a45] whitespace-nowrap tracking-wide text-[10px] w-36 shrink-0">
                  RECIBÍ DEL SR.(A):
                </span>
                <div className="flex-1 border-b border-dotted border-slate-700 pb-0.5 text-center">
                  <span className="font-black text-slate-900 uppercase text-[11px] block">
                    {inquilinoNombre}
                  </span>
                </div>
              </div>

              {/* La Suma de */}
              <div className="flex items-end">
                <span className="font-black text-[#102a45] whitespace-nowrap tracking-wide text-[10px] w-36 shrink-0">
                  LA SUMA DE:
                </span>
                <div className="flex-1 border-b border-dotted border-slate-700 pb-0.5 text-center">
                  <span className="font-black text-slate-800 uppercase text-[10.5px] block">
                    {numeroALetras(montoTotal)}
                  </span>
                </div>
              </div>

              {/* Por Concepto de (con texto completo centrado y renglón dotted de apoyo) */}
              <div className="space-y-1.5">
                <div className="flex items-end">
                  <span className="font-black text-[#102a45] whitespace-nowrap tracking-wide text-[10px] w-36 shrink-0">
                    POR CONCEPTO DE:
                  </span>
                  <div className="flex-1 border-b border-dotted border-slate-700 pb-0.5 text-center">
                    <span className="font-bold text-slate-800 uppercase text-[10px] block leading-snug break-words">
                      {textoConcepto}
                    </span>
                  </div>
                </div>
                {/* Renglón punteado complementario estilo talonario */}
                <div className="w-full border-b border-dotted border-slate-700 h-2"></div>
              </div>
            </div>

            {/* Fecha en formato largo centrada */}
            <div className="text-center font-black text-xs text-slate-900 capitalize my-4">
              {formatFechaLarga(new Date())}
            </div>

            {/* Sección Inferior: Código de barras y Firmas */}
            <div className="grid grid-cols-12 gap-2 items-end pt-3">
              {/* Código de barras simulado */}
              <div className="col-span-3 text-left">
                <div className="font-mono text-[9px] text-slate-400 tracking-widest select-none opacity-70">
                  |||||| |||| ||| |||||||
                  <p className="text-[8px] font-bold tracking-wider text-slate-500">
                    *ODSC{parseInt(nroRecibo, 10)}*
                  </p>
                </div>
              </div>

              {/* Firma Recibí Conforme */}
              <div className="col-span-4 text-center">
                <div className="h-12 flex items-end justify-center mb-1">
                  <svg
                    viewBox="0 0 240 135"
                    className="w-32 h-12 text-slate-900 overflow-visible"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {/* Trazo curvo principal y bucle de la 'L' */}
                    <path
                      d="M 45 42 C 60 48 76 43 90 28 C 105 13 118 20 102 46 C 82 78 52 110 18 126 C 8 130 5 118 16 112 C 34 102 70 105 105 116 C 132 124 165 125 210 119"
                      strokeWidth="3.2"
                    />
                    {/* Detalle del bucle de la 'C' */}
                    <path
                      d="M 125 58 C 110 52 94 65 92 84 C 90 102 108 114 125 104 C 133 98 138 90 142 81"
                      strokeWidth="3"
                    />
                    {/* Estructura y caída de la 'A' */}
                    <path
                      d="M 160 52 C 150 63 138 88 152 97 C 163 103 173 90 177 75 C 180 62 178 55 174 53 C 168 50 157 78 168 95 C 173 102 188 95 204 88 C 218 82 232 80 242 81"
                      strokeWidth="3"
                    />
                    {/* Punto caligráfico final */}
                    <circle
                      cx="225"
                      cy="116"
                      r="3.2"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
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
                <div className="h-10 flex items-end justify-center mb-1">
                  <svg
                    viewBox="0 0 40 40"
                    className="w-6 h-6 text-slate-900"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="8 22 18 32 34 10" />
                  </svg>
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
            className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-6 py-2 bg-[#102a45] hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-slate-900/20 active:scale-95 transition-all cursor-pointer"
          >
            <Printer size={15} /> Imprimir Recibo
          </button>
        </div>
      </div>
    </div>
  );
}
