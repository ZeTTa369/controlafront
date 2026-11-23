import { generarCodigoDepartamento } from "../utils/codigoDepartamento";

// Helper para convertir numeros a palabras en espanol (Bolivianos)
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
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
}

function formatFechaLarga(fechaInput) {
  let fechaObj = new Date();
  if (fechaInput) {
    if (typeof fechaInput === "string") {
      const limpia = fechaInput.split("T")[0];
      const partes = limpia.split("-").map(Number);
      if (partes.length === 3 && !isNaN(partes[0])) {
        fechaObj = new Date(partes[0], partes[1] - 1, partes[2]);
      }
    } else if (fechaInput instanceof Date && !isNaN(fechaInput.getTime())) {
      fechaObj = fechaInput;
    }
  }
  const txt = new Intl.DateTimeFormat("es-BO", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(fechaObj);
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

// Helper para dibujar rectangulo con bordes redondeados en Canvas
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Helper para dividir texto largo en lineas dentro de un ancho maximo
function dividirLineas(ctx, texto, maxWidth) {
  const palabras = texto.split(" ");
  const lineas = [];
  let lineaActual = "";

  for (const palabra of palabras) {
    const prueba = lineaActual ? `${lineaActual} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width <= maxWidth) {
      lineaActual = prueba;
    } else {
      if (lineaActual) lineas.push(lineaActual);
      lineaActual = palabra;
    }
  }
  if (lineaActual) lineas.push(lineaActual);
  return lineas;
}

/**
 * Genera una imagen PNG (Blob) del recibo oficial con el mismo diseno del talonario.
 */
export async function generarReciboImagen({
  contrato = {},
  grupo = {},
  fechaEmision,
  conceptosMap = {},
}) {
  const anioFechaManual = fechaEmision
    ? Number(String(fechaEmision).split("-")[0])
    : null;
  const anioPeriodo =
    anioFechaManual || grupo.anio || grupo.items?.[0]?.periodo_anio || 2026;
  const mesNumero = grupo.mes || grupo.items?.[0]?.periodo_mes || 1;

  // Codigo de unidad + correlativo por edificio y anio
  const codigoUnidad =
    contrato.codigoUnidad ||
    generarCodigoDepartamento({
      nombreEdificio: contrato.edificio || "",
      piso: contrato.deptoPiso ?? contrato.piso ?? 1,
      numeroDepartamento: contrato.deptoNumero || "1",
      bloque: contrato.deptoBloque || "",
    });

  const reciboGuardado =
    grupo.numeroRecibo ||
    grupo.items?.find((it) => it.numero_recibo)?.numero_recibo;

  const idRaw =
    grupo.idRecibo || grupo.items?.[0]?.id_cobro || contrato.idContrato || 1;

  const nroRecibo =
    reciboGuardado || `${codigoUnidad}${String(idRaw).padStart(4, "0")}`;

  const montoTotal = Number(grupo.totalMonto ?? 0);
  const montoFormateado = `Bs. ${montoTotal.toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  // Fechas del periodo
  let diaCorteContrato = 1;
  const fechaInicioContrato =
    contrato?.contratoOriginal?.fecha_inicio || contrato?.fecha_inicio;
  if (fechaInicioContrato) {
    const partes = String(fechaInicioContrato).split("T")[0].split("-").map(Number);
    if (partes.length === 3 && partes[2]) diaCorteContrato = partes[2];
  }

  let fDesde = grupo.fechaInicio ? formatCorto(grupo.fechaInicio) : "";
  let fHasta = grupo.fechaFin ? formatCorto(grupo.fechaFin) : "";

  if (!fDesde || !fHasta) {
    const maxDiasMesActual = new Date(anioPeriodo, mesNumero, 0).getDate();
    const diaDesdeReal = Math.min(diaCorteContrato, maxDiasMesActual);
    const maxDiasMesSiguiente = new Date(anioPeriodo, mesNumero + 1, 0).getDate();
    const diaHastaReal = Math.min(diaCorteContrato, maxDiasMesSiguiente);

    fDesde = formatCorto(new Date(anioPeriodo, mesNumero - 1, diaDesdeReal));
    fHasta = formatCorto(new Date(anioPeriodo, mesNumero, diaHastaReal));
  }

  const inquilinoNombre = (contrato.inquilino || "INQUILINO").toUpperCase();
  const numPiso = contrato.deptoPiso ?? contrato.piso ?? "1";
  const numDepto = contrato.deptoNumero || "1";
  const cantPersonas = contrato.personas || 1;
  const nombrePeriodo = (
    grupo.nombrePeriodo || `PERIODO ${anioPeriodo}`
  ).toUpperCase();

  // Concepto y servicios
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
    textoServicios = motivoAgua
      ? ` + AGUA (${motivoAgua.toUpperCase()})`
      : ` + AGUA ${cantPersonas} ${cantPersonas > 1 ? "PERSONAS" : "PERSONA"}`;
  } else if (cobraLuz) {
    textoServicios = motivoLuz
      ? ` + LUZ (${motivoLuz.toUpperCase()})`
      : ` + LUZ ${cantPersonas} ${cantPersonas > 1 ? "PERSONAS" : "PERSONA"}`;
  } else if (motivoGeneral) {
    textoServicios = ` (${motivoGeneral.toUpperCase()})`;
  }

  const textoConcepto = `PAGO PISO ${numPiso} DEP ${numDepto} DEL ${fDesde} AL ${fHasta}${textoServicios} (${nombrePeriodo})`;
  const direccionEdificio =
    contrato.direccion_edificio || contrato.edificio || "Direccion Principal";

  // Crear Canvas HD (1200 x 720)
  const width = 1200;
  const height = 720;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Fondo blanco limpio
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Marco exterior azul marino redondeado
  ctx.strokeStyle = "#1a365d";
  ctx.lineWidth = 5;
  roundRect(ctx, 28, 28, width - 56, height - 56, 36);
  ctx.stroke();

  // Titulo superior
  ctx.fillStyle = "#102a45";
  ctx.font = "900 38px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`RECIBO DE PAGO/${anioPeriodo}`, width / 2, 95);

  // Direccion (izquierda)
  ctx.textAlign = "left";
  ctx.font = "bold 20px Arial, Helvetica, sans-serif";
  ctx.fillStyle = "#102a45";
  ctx.fillText("Direccion:", 72, 152);

  ctx.font = "600 20px Arial, Helvetica, sans-serif";
  ctx.fillStyle = "#1e293b";
  const lineasDir = dividirLineas(ctx, direccionEdificio, 530);
  lineasDir.slice(0, 2).forEach((linea, idx) => {
    ctx.fillText(linea, idx === 0 ? 175 : 72, 152 + idx * 28);
  });

  ctx.font = "bold 20px Arial, Helvetica, sans-serif";
  ctx.fillStyle = "#102a45";
  ctx.fillText("Cochabamba - Bolivia", 72, 152 + Math.max(1, lineasDir.slice(0, 2).length) * 28);

  // Recuadro RECIBO N° y POR (derecha)
  const boxX = 725;
  const boxY = 122;
  const boxW = 405;
  const boxH = 98;
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 3;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Linea horizontal media del recuadro
  ctx.beginPath();
  ctx.moveTo(boxX, boxY + 49);
  ctx.lineTo(boxX + boxW, boxY + 49);
  ctx.stroke();

  // Linea vertical separadora
  ctx.beginPath();
  ctx.moveTo(boxX + 145, boxY);
  ctx.lineTo(boxX + 145, boxY + boxH);
  ctx.stroke();

  ctx.fillStyle = "#102a45";
  ctx.font = "900 19px Arial, Helvetica, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("RECIBO Nº", boxX + 16, boxY + 32);
  ctx.fillText("POR:", boxX + 16, boxY + 81);

  ctx.fillStyle = "#dc2626";
  ctx.font = "900 22px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(nroRecibo, boxX + 275, boxY + 33);

  ctx.fillStyle = "#0f172a";
  ctx.font = "900 23px Arial, Helvetica, sans-serif";
  ctx.fillText(montoFormateado, boxX + 275, boxY + 82);

  // Recuadro Central
  const cX = 72;
  const cY = 248;
  const cW = width - 144;
  const cH = 265;
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 3;
  roundRect(ctx, cX, cY, cW, cH, 14);
  ctx.stroke();

  // Helper para dibujar lineas punteadas
  const dibujarLineaPunteada = (x1, x2, y) => {
    ctx.save();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.restore();
  };

  // Fila 1: RECIBI DEL SR.(A)
  ctx.textAlign = "left";
  ctx.fillStyle = "#102a45";
  ctx.font = "900 18px Arial, Helvetica, sans-serif";
  ctx.fillText("RECIBI DEL SR.(A):", cX + 24, cY + 48);
  dibujarLineaPunteada(cX + 235, cX + cW - 24, cY + 52);

  ctx.textAlign = "center";
  ctx.fillStyle = "#0f172a";
  ctx.font = "900 21px Arial, Helvetica, sans-serif";
  ctx.fillText(inquilinoNombre, cX + 235 + (cW - 259) / 2, cY + 45);

  // Fila 2: LA SUMA DE
  ctx.textAlign = "left";
  ctx.fillStyle = "#102a45";
  ctx.font = "900 18px Arial, Helvetica, sans-serif";
  ctx.fillText("LA SUMA DE:", cX + 24, cY + 112);
  dibujarLineaPunteada(cX + 235, cX + cW - 24, cY + 116);

  ctx.textAlign = "center";
  ctx.fillStyle = "#1e293b";
  ctx.font = "900 19px Arial, Helvetica, sans-serif";
  ctx.fillText(numeroALetras(montoTotal), cX + 235 + (cW - 259) / 2, cY + 109);

  // Fila 3: POR CONCEPTO DE (2 renglones)
  ctx.textAlign = "left";
  ctx.fillStyle = "#102a45";
  ctx.font = "900 18px Arial, Helvetica, sans-serif";
  ctx.fillText("POR CONCEPTO DE:", cX + 24, cY + 178);
  dibujarLineaPunteada(cX + 235, cX + cW - 24, cY + 182);
  dibujarLineaPunteada(cX + 24, cX + cW - 24, cY + 232);

  ctx.font = "bold 18px Arial, Helvetica, sans-serif";
  ctx.fillStyle = "#1e293b";
  const lineasConcepto = dividirLineas(ctx, textoConcepto, cW - 270);
  if (lineasConcepto.length === 1) {
    ctx.textAlign = "center";
    ctx.fillText(lineasConcepto[0], cX + 235 + (cW - 259) / 2, cY + 175);
  } else {
    ctx.textAlign = "center";
    ctx.fillText(lineasConcepto[0], cX + 235 + (cW - 259) / 2, cY + 175);
    const restoConcepto = lineasConcepto.slice(1).join(" ");
    ctx.fillText(restoConcepto, cX + cW / 2, cY + 225);
  }

  // Fecha larga centrada
  ctx.textAlign = "center";
  ctx.fillStyle = "#0f172a";
  ctx.font = "900 21px Arial, Helvetica, sans-serif";
  ctx.fillText(formatFechaLarga(fechaEmision || new Date()), width / 2, 558);

  // Pie: Codigo inferior izquierdo
  ctx.textAlign = "left";
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 16px 'Courier New', monospace";
  ctx.fillText("|||||| |||| ||| |||||||", 72, 632);
  ctx.fillStyle = "#64748b";
  ctx.font = "bold 15px 'Courier New', monospace";
  ctx.fillText(`*${nroRecibo}*`, 72, 654);

  // Firma Izquierda: RECIBI CONFORME
  ctx.save();
  ctx.translate(415, 582);
  ctx.scale(0.55, 0.55);
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const firmaPath1 = new Path2D(
    "M 45 42 C 60 48 76 43 90 28 C 105 13 118 20 102 46 C 82 78 52 110 18 126 C 8 130 5 118 16 112 C 34 102 70 105 105 116 C 132 124 165 125 210 119",
  );
  const firmaPath2 = new Path2D(
    "M 125 58 C 110 52 94 65 92 84 C 90 102 108 114 125 104 C 133 98 138 90 142 81",
  );
  const firmaPath3 = new Path2D(
    "M 160 52 C 150 63 138 88 152 97 C 163 103 173 90 177 75 C 180 62 178 55 174 53 C 168 50 157 78 168 95 C 173 102 188 95 204 88 C 218 82 232 80 242 81",
  );
  ctx.stroke(firmaPath1);
  ctx.stroke(firmaPath2);
  ctx.stroke(firmaPath3);
  ctx.restore();

  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(350, 646);
  ctx.lineTo(620, 646);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#0f172a";
  ctx.font = "900 16px Arial, Helvetica, sans-serif";
  ctx.fillText("RECIBI CONFORME", 485, 668);

  // Firma Derecha: ENTREGUE CONFORME (Check)
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(862, 622);
  ctx.lineTo(878, 636);
  ctx.lineTo(904, 602);
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(745, 646);
  ctx.lineTo(1015, 646);
  ctx.stroke();

  ctx.fillText("ENTREGUE CONFORME", 880, 668);

  // Convertir Canvas a Blob PNG
  const blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png", 1.0),
  );

  const inquilinoLimpio = (contrato.inquilino || "Inquilino")
    .trim()
    .replace(/\s+/g, "_");
  const nombreArchivo = `Recibo_${nroRecibo}_${inquilinoLimpio}.png`;

  return { blob, nombreArchivo, nroRecibo };
}