/**
 * Reglas puras de Bruja: sin Foundry, sin DOM. Todo lo que el juego decide con números vive aquí
 * y se prueba en tests/reglas.test.mjs. Texto del libro: ninguno; solo la mecánica, escrita aquí.
 */

/** Los cinco tipos de escena, en el orden en que se muestran las cartas. */
export const TIPOS = Object.freeze(["accion", "reaccion", "drama", "monologo", "retrospeccion"]);

export const REGLAS = Object.freeze({
  dadosBase: 2, dadosMax: 3, consecuenciasMax: 5, pdVictoria: 9, herederasMax: 6, objetos: 3
});

/** Coste en puntos de drama de cada cosa que se puede comprar. */
export const COSTE = Object.freeze({ dado: 1, descanso: 2, hada: 3, marcar: 4, elegir: 5 });

export const NIVELES = Object.freeze(["granFracaso", "fracaso", "parcial", "granExito", "abrumador"]);

/** Tabla de la tirada. Con 3d6 el mínimo es 3, así que «2» solo sale con 2d6. */
export function resultadoTirada(total) {
  const t = Number(total);
  if (!Number.isFinite(t)) throw new RangeError("total inválido");
  if (t <= 2) return { nivel: "granFracaso", pd: 0, consecuencias: 2 };
  if (t <= 6) return { nivel: "fracaso", pd: 0, consecuencias: 1 };
  if (t <= 9) return { nivel: "parcial", pd: 1, consecuencias: 1 };
  if (t <= 12) return { nivel: "granExito", pd: 1, consecuencias: 0 };
  return { nivel: "abrumador", pd: 2, consecuencias: 0 };
}

/**
 * Dados de una tirada: 2d6, y un tercero si entra en juego el rasgo o un objeto, si se gasta 1 PD
 * o si la escena viene de un descanso. Los tres orígenes no se suman entre sí: el tope es 3d6.
 */
export function dadosDisponibles({ uso = false, pd = false, descanso = false } = {}) {
  return Math.min(REGLAS.dadosMax, REGLAS.dadosBase + (uso || pd || descanso ? 1 : 0));
}

/** Una escena no puede ser del mismo tipo que la anterior (salvo tras un descanso de 2 PD). */
export const escenaPermitida = (tipo, ultimo) => TIPOS.includes(tipo) && tipo !== ultimo;

export const activas = consecuencias => consecuencias.filter(c => c.activa).length;
export const puedeGanar = pdGanados => pdGanados >= REGLAS.pdVictoria;
export const pdDisponibles = e => e.pdGanados - e.pdGastados;
