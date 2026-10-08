import test from "node:test";
import assert from "node:assert/strict";
import * as R from "../module/reglas.mjs";

test("tabla de la tirada: límites de cada nivel", () => {
  const casos = [[2, "granFracaso", 0, 2], [3, "fracaso", 0, 1], [6, "fracaso", 0, 1], [7, "parcial", 1, 1], [9, "parcial", 1, 1],
    [10, "granExito", 1, 0], [12, "granExito", 1, 0], [13, "abrumador", 2, 0], [18, "abrumador", 2, 0]];
  for (const [total, nivel, pd, consecuencias] of casos) assert.deepEqual(R.resultadoTirada(total), { nivel, pd, consecuencias }, `total ${total}`);
});

test("ejemplo del libro: 6+6+1 = 13 es éxito abrumador y da 2 PD", () => {
  assert.equal(R.resultadoTirada(6 + 6 + 1).nivel, "abrumador");
  assert.equal(R.resultadoTirada(13).pd, 2);
});

test("con 3d6 el mínimo es 3: el gran fracaso solo sale con 2d6", () => {
  assert.equal(R.resultadoTirada(1 + 1 + 1).nivel, "fracaso");
});

test("dados: 2 base, 3 si hay rasgo/objeto, 1 PD o descanso, y nunca más de 3", () => {
  assert.equal(R.dadosDisponibles(), 2);
  assert.equal(R.dadosDisponibles({ uso: true }), 3);
  assert.equal(R.dadosDisponibles({ pd: true }), 3);
  assert.equal(R.dadosDisponibles({ descanso: true }), 3);
  assert.equal(R.dadosDisponibles({ uso: true, pd: true, descanso: true }), 3);
});

test("no se repite el tipo de escena, y un tipo desconocido no es válido", () => {
  assert.equal(R.escenaPermitida("accion", "accion"), false);
  assert.equal(R.escenaPermitida("accion", "drama"), true);
  assert.equal(R.escenaPermitida("accion", null), true);
  assert.equal(R.escenaPermitida("inventada", null), false);
});

test("costes de los puntos de drama", () => {
  assert.deepEqual({ ...R.COSTE }, { dado: 1, descanso: 2, hada: 3, marcar: 4, elegir: 5 });
  assert.equal(R.COSTE.marcar + R.COSTE.elegir, R.REGLAS.pdVictoria);
});

test("victoria exige 9 PD ganados; consecuencias activas se cuentan sin las eliminadas", () => {
  assert.equal(R.puedeGanar(8), false);
  assert.equal(R.puedeGanar(9), true);
  assert.equal(R.activas([{ activa: true }, { activa: false }, { activa: true }]), 2);
});
