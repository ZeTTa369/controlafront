import jsPDF from 'jspdf';

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

  if (miles === 1) letras += 'UN MIL ';
  else if (miles > 1) letras += procesarCentenas(miles) + ' MIL ';
  if (resto > 0) letras += procesarCentenas(resto) + ' ';

  return `${letras.trim()} ${centavosTxt}`;
}

function formatCorto(fechaStr) {
  if (!fechaStr) return '';
  const limpia = String(fechaStr).split('T')[0];
  const partes = limpia.split('-');
  if (partes.length === 3) {
    const [y, m, d] = partes;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y.slice(-2)}`;
  }
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
}

function formatFechaLarga(fechaInput) {
  let fechaObj = new Date();
  if (fechaInput && typeof fechaInput === 'string') {
    const partes = fechaInput.split('T')[0].split('-').map(Number);
    if (partes.length === 3 && !isNaN(partes[0])) {
      fechaObj = new Date(partes[0], partes[1] - 1, partes[2]);
    }
  }
  return new Intl.DateTimeFormat('es-BO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(fechaObj);
}

export function descargarReciboPDF({ contrato = {}, grupo = {}, fechaEmision, conceptosMap = {}, soloBlob = false}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [215, 140] });

  const anioFechaManual = fechaEmision ? Number(String(fechaEmision).split('-')[0]) : null;
  const anioPeriodo = anioFechaManual || grupo.anio || grupo.items?.[0]?.periodo_anio || 2026;
  const mesNumero = grupo.mes || grupo.items?.[0]?.periodo_mes || 7;

  const idRaw = grupo.idRecibo || grupo.items?.[0]?.id_cobro || contrato.idContrato || 130;
  const nroRecibo = String(idRaw).padStart(5, '0');
  const montoTotal = Number(grupo.totalMonto ?? 0);

  // Extraer el dia de inicio real del contrato (ej. si inicio 01/11/2026 -> dia = 1)
  let diaCorteContrato = 1;
  const fechaInicioContrato = contrato?.contratoOriginal?.fecha_inicio || contrato?.fecha_inicio;
  if (fechaInicioContrato) {
    const soloFecha = String(fechaInicioContrato).split('T')[0];
    const partes = soloFecha.split('-').map(Number);
    if (partes.length === 3 && partes[2]) {
      diaCorteContrato = partes[2];
    }
  }

  let fDesde = grupo.fechaInicio ? formatCorto(grupo.fechaInicio) : '';
  let fHasta = grupo.fechaFin ? formatCorto(grupo.fechaFin) : '';

  if (!fDesde || !fHasta) {
    // Ajustar el dia de corte al maximo de dias del mes (ej. febrero)
    const maxDiasMesActual = new Date(anioPeriodo, mesNumero, 0).getDate();
    const diaDesdeReal = Math.min(diaCorteContrato, maxDiasMesActual);

    const maxDiasMesSiguiente = new Date(anioPeriodo, mesNumero + 1, 0).getDate();
    const diaHastaReal = Math.min(diaCorteContrato, maxDiasMesSiguiente);

    fDesde = formatCorto(new Date(anioPeriodo, mesNumero - 1, diaDesdeReal));
    fHasta = formatCorto(new Date(anioPeriodo, mesNumero, diaHastaReal));
  }

  const inquilinoNombre = (contrato.inquilino || 'INQUILINO').toUpperCase();
  const numDepto = contrato.deptoNumero || '1';
  const cantPersonas = contrato.personas || 1;
  const nombrePeriodo = (grupo.nombrePeriodo || `PERIODO ${anioPeriodo}`).toUpperCase();
  const direccionEdificio = contrato.direccion_edificio || contrato.edificio || 'Direccion Principal';

  const items = Array.isArray(grupo.items) ? grupo.items : [];
  const itemAgua = items.find((it) => (conceptosMap[it.id_concepto] || it.descripcion || '').toUpperCase().includes('AGUA'));
  const itemLuz = items.find((it) => (conceptosMap[it.id_concepto] || it.descripcion || '').toUpperCase().includes('LUZ'));

  const motivoAgua = itemAgua?.motivo_ajuste || '';
  const motivoLuz = itemLuz?.motivo_ajuste || '';
  const motivoGeneral = items.find((it) => it.motivo_ajuste)?.motivo_ajuste || '';

  let textoServicios = '';
  if (itemAgua && itemLuz) {
    if (motivoAgua && motivoLuz && motivoAgua === motivoLuz) textoServicios = ` + AGUA Y LUZ (${motivoAgua.toUpperCase()})`;
    else if (motivoAgua) textoServicios = ` + AGUA (${motivoAgua.toUpperCase()}) Y LUZ ${cantPersonas} PERSONAS`;
    else if (motivoLuz) textoServicios = ` + AGUA ${cantPersonas} PERSONAS Y LUZ (${motivoLuz.toUpperCase()})`;
    else textoServicios = ` + AGUA Y LUZ ${cantPersonas} PERSONAS`;
  } else if (itemAgua) {
    textoServicios = motivoAgua ? ` + AGUA (${motivoAgua.toUpperCase()})` : ` + AGUA ${cantPersonas} PERSONAS`;
  } else if (itemLuz) {
    textoServicios = motivoLuz ? ` + LUZ (${motivoLuz.toUpperCase()})` : ` + LUZ ${cantPersonas} PERSONAS`;
  } else if (motivoGeneral) {
    textoServicios = ` (${motivoGeneral.toUpperCase()})`;
  }

  const textoConcepto = `PAGO DEP ${numDepto} DEL ${fDesde} AL ${fHasta}${textoServicios} (${nombrePeriodo})`;

  // Marco exterior redondeado
  doc.setDrawColor(26, 54, 93);
  doc.setLineWidth(0.7);
  doc.roundedRect(10, 8, 195, 124, 6, 6);

  // Titulo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(16, 42, 69);
  doc.text(`RECIBO DE PAGO/${anioPeriodo}`, 107.5, 19, { align: 'center' });

  // Direccion
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Direccion: ${direccionEdificio}`, 16, 28, { maxWidth: 105 });
  doc.text('Cochabamba - Bolivia', 16, 35);

  // Recuadro Nro Recibo y Monto
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.rect(128, 23, 71, 16);
  doc.line(128, 31, 199, 31);
  doc.line(156, 23, 156, 39);

  doc.setFontSize(8);
  doc.setTextColor(16, 42, 69);
  doc.text('RECIBO Nº', 130, 28.5);
  doc.setTextColor(220, 38, 38);
  doc.setFontSize(10);
  doc.text(nroRecibo, 177.5, 28.5, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(16, 42, 69);
  doc.text('POR:', 130, 36.5);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.text(`Bs. ${montoTotal.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 177.5, 36.5, { align: 'center' });

  // Recuadro central de datos
  doc.roundedRect(16, 44, 183, 46, 2, 2);

  doc.setFontSize(8.5);
  doc.setTextColor(16, 42, 69);
  doc.text('RECIBI DEL SR.(A):', 20, 53);
  doc.setTextColor(15, 23, 42);
  doc.text(inquilinoNombre, 125, 53, { align: 'center' });
  doc.line(58, 54.5, 194, 54.5);

  doc.setTextColor(16, 42, 69);
  doc.text('LA SUMA DE:', 20, 64);
  doc.setTextColor(15, 23, 42);
  doc.text(numeroALetras(montoTotal), 125, 64, { align: 'center' });
  doc.line(58, 65.5, 194, 65.5);

  doc.setTextColor(16, 42, 69);
  doc.text('POR CONCEPTO DE:', 20, 75);
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const lineasConcepto = doc.splitTextToSize(textoConcepto, 132);
  doc.text(lineasConcepto, 125, 75, { align: 'center' });
  doc.line(58, 76.5, 194, 76.5);
  doc.line(20, 84.5, 194, 84.5);

  // Fecha larga centrada
  const fechaLarga = formatFechaLarga(fechaEmision);
  const fechaCapitalizada = fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1);
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(fechaCapitalizada, 107.5, 99, { align: 'center' });

  // Codigo y lineas de firma
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`*ODSC${parseInt(nroRecibo, 10)}*`, 18, 122);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.line(70, 119, 122, 119);
  doc.text('RECIBI CONFORME', 96, 124, { align: 'center' });

  doc.line(140, 119, 192, 119);
  doc.text('ENTREGUE CONFORME', 166, 124, { align: 'center' });

  const nombreArchivo = `Recibo_${nroRecibo}_${(contrato.inquilino || 'Inquilino').replace(/\s+/g, '_')}_${grupo.clave || ''}.pdf`;

  if (soloBlob) {
    return {
      blob: doc.output('blob'),
      nombreArchivo,
    };
  }

  doc.save(nombreArchivo);
  return nombreArchivo;
}