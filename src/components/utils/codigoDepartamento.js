/**
 * Genera el codigo identificador unico de un departamento/unidad.
 * Formato: [Inicial Edificio][Piso][Departamento][Bloque]
 * Ejemplos:
 * - Edificio Lorena, Piso 2, Depto 1, Sin Bloque => "L21SB"
 * - Edificio Lorena, Piso 2, Depto 1, Exterior   => "L21E"
 * - Edificio Lorena, Piso 2, Depto 1, Interior   => "L21I"
 */
export function generarCodigoDepartamento({
  nombreEdificio = '',
  piso = 1,
  numeroDepartamento = '',
  bloque = '',
}) {
  // 1. Inicial del edificio (ignora prefijos comunes como "Edificio", "Condominio" o "Torre")
  const nombreLimpio = String(nombreEdificio)
    .trim()
    .replace(/^(EDIFICIO|CONDOMINIO|TORRE)\s+/i, '');
  const inicialEdificio = nombreLimpio.charAt(0).toUpperCase() || 'X';

  // 2. Piso
  const pisoStr =
    piso !== null && piso !== undefined && String(piso).trim() !== ''
      ? String(piso).trim()
      : '1';

  // 3. Numero de departamento
  const deptoStr = String(numeroDepartamento || '0')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');

  // 4. Bloque: Exterior => 'E', Interior => 'I', Sin bloque => 'SB'
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

  return `${inicialEdificio}${pisoStr}${deptoStr}${bloqueStr}`;
}