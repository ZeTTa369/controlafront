/**
 * Extrae el prefijo del edificio:
 * - "Condominio Claris" => "CC"
 * - "Sueño Real" / "Sueñor Real" => "SR"
 * - "Edificio Lorena" => "L"
 */
function obtenerPrefijoEdificio(nombreEdificio = '') {
  const limpio = String(nombreEdificio)
    .trim()
    .replace(/^(EDIFICIO|TORRE)\s+/i, '');

  if (!limpio) return 'X';

  const conectores = new Set(['DE', 'DEL', 'LA', 'LAS', 'LOS', 'EL', 'Y']);
  const palabras = limpio
    .split(/\s+/)
    .filter((p) => p && !conectores.has(p.toUpperCase()));

  if (palabras.length === 0) return 'X';

  if (palabras.length === 1) {
    return palabras[0].charAt(0).toUpperCase();
  }

  return palabras.map((p) => p.charAt(0).toUpperCase()).join('');
}

/**
 * Genera el codigo identificador unico de un departamento/unidad.
 * Formato: [Prefijo Edificio][Piso][Departamento][Bloque]
 */
export function generarCodigoDepartamento({
  nombreEdificio = '',
  piso = 1,
  numeroDepartamento = '',
  bloque = '',
}) {
  const prefijoEdificio = obtenerPrefijoEdificio(nombreEdificio);

  const pisoStr =
    piso !== null && piso !== undefined && String(piso).trim() !== ''
      ? String(piso).trim()
      : '1';

  const deptoStr = String(numeroDepartamento || '0')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');

  const bloqueLimpio = String(bloque || '')
    .trim()
    .toUpperCase()
    .replace(/^BLOQUE\s+/i, '');

  let bloqueStr = 'SB';
  if (bloqueLimpio === 'EXTERIOR' || bloqueLimpio === 'E') {
    bloqueStr = 'E';
  } else if (bloqueLimpio === 'INTERIOR' || bloqueLimpio === 'I') {
    bloqueStr = 'I';
  } else if (
    bloqueLimpio &&
    bloqueLimpio !== 'SIN BLOQUE' &&
    bloqueLimpio !== 'S/B' &&
    bloqueLimpio !== 'NINGUNO'
  ) {
    bloqueStr = bloqueLimpio.charAt(0);
  }

  return `${prefijoEdificio}${pisoStr}${deptoStr}${bloqueStr}`;
}