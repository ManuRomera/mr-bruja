import test from "node:test";
import assert from "node:assert/strict";
import { apply, newGame, totales, avisos, rolesDe, MotorError } from "../module/motor.mjs";

const play = (e, ...acciones) => acciones.reduce((s, a) => apply(s, a), e);
const lista = () => play(newGame(), { type: "bruja.perfil", nombre: "Brunilda", rasgo: "curandera", bolsa: [{ nombre: "lechuza" }, { nombre: "carámbanos" }, { nombre: "setas" }] }, { type: "partida.empezar" });
const code = fn => { try { fn(); } catch (e) { return e instanceof MotorError ? e.code : "OTRO"; } return null; };
const tirar = (e, dados) => apply(e, { type: "tirada.resolver", dados });
const conPD = (e, n) => apply(e, { type: "admin.ajustar", pdGanados: n });

test("no se empieza sin nombre, rasgo y tres objetos", () => {
  assert.equal(code(() => apply(newGame(), { type: "partida.empezar" })), "FALTA_NOMBRE");
  const e = apply(newGame(), { type: "bruja.perfil", nombre: "B", rasgo: "x", bolsa: [{ nombre: "a" }, { nombre: "b" }] });
  assert.equal(code(() => apply(e, { type: "partida.empezar" })), "FALTAN_OBJETOS");
});

test("PD iniciales de la variante del libro", () => {
  let e = apply(newGame(), { type: "ajustes.set", pdIniciales: 4 });
  e = play(e, { type: "bruja.perfil", nombre: "B", rasgo: "x", bolsa: [{ nombre: "a" }, { nombre: "b" }, { nombre: "c" }] }, { type: "partida.empezar" });
  assert.equal(totales(e).pd, 4);
});

test("no se repite tipo de escena; con descanso (2 PD) sí, y da un dado", () => {
  let e = play(lista(), { type: "escena.elegir", tipo: "accion" }, { type: "escena.cerrar" });
  assert.equal(code(() => apply(e, { type: "escena.elegir", tipo: "accion" })), "MISMO_TIPO");
  assert.equal(code(() => apply(e, { type: "escena.elegir", tipo: "accion", descanso: true })), "NO_PD");
  e = apply(conPD(e, 2), { type: "escena.elegir", tipo: "accion", descanso: true });
  assert.equal(e.pdGastados, 2);
  assert.equal(code(() => tirar(e, [3, 4])), "DADOS");
  e = tirar(e, [6, 6, 1]);
  assert.equal(e.escena.tirada.nivel, "abrumador");
  assert.equal(e.pdGanados, 2 + 2);
});

test("la tirada cierra la escena y suma PD o consecuencias", () => {
  let e = play(lista(), { type: "escena.elegir", tipo: "drama" });
  e = tirar(e, [4, 4]);
  assert.equal(e.escena.estado, "cierre");
  assert.equal(totales(e).consecuencias, 1);
  assert.equal(totales(e).pd, 1);
  assert.equal(code(() => tirar(e, [1, 1])), "NO_TIRADA");
  e = apply(e, { type: "escena.cerrar", nota: "la lechuza mira" });
  assert.equal(e.escena, null);
  assert.equal(e.ultimoTipo, "drama");
  assert.equal(e.historial[0].nota, "la lechuza mira");
});

test("rasgo u objeto: hay que pedirlo y que el DJ lo conceda para el 3.er dado", () => {
  let e = play(lista(), { type: "escena.elegir", tipo: "accion" }, { type: "uso.pedir", que: "rasgo", frase: "curo al caballo" });
  assert.equal(code(() => tirar(e, [1, 2, 3])), "DADOS");
  e = apply(e, { type: "uso.responder", si: true });
  e = tirar(e, [6, 6, 1]);
  assert.equal(e.escena.tirada.dados.length, 3);
});

test("1 PD = un dado, se devuelve si no se ha tirado y no pasa de 3d6", () => {
  let e = play(conPD(lista(), 2), { type: "escena.elegir", tipo: "accion" }, { type: "dado.pd" });
  assert.equal(e.pdGastados, 1);
  e = apply(e, { type: "dado.pd" });
  assert.equal(e.pdGastados, 0, "se devuelve");
  e = play(e, { type: "uso.pedir", que: "comer" }, { type: "uso.responder", si: true });
  assert.equal(code(() => apply(e, { type: "dado.pd" })), "DADOS_MAX");
});

test("cinco consecuencias activas = la Bruja muere", () => {
  let e = lista();
  for (const t of ["accion", "reaccion", "drama", "monologo", "retrospeccion"]) {
    e = play(e, { type: "escena.elegir", tipo: t });
    e = tirar(e, [1, 1]);          // gran fracaso con 2d6 → 2 consecuencias
    if (e.fase === "muerte") break;
    e = apply(e, { type: "escena.cerrar" });
  }
  assert.equal(e.fase, "muerte");
  assert.equal(totales(e).consecuencias >= 5, true);
  e = play(e, { type: "escena.cerrar" }, { type: "fin.cerrar", texto: "se apagó la última vela" });
  assert.equal(e.fase, "fin");
  assert.equal(e.resultado.tipo, "muerte");
});

test("último aliento (opcional): 3 PD evitan la quinta consecuencia", () => {
  let e = play(newGame({ ajustes: { ultimoAliento: true } }), { type: "bruja.perfil", nombre: "B", rasgo: "x", bolsa: [{ nombre: "a" }, { nombre: "b" }, { nombre: "c" }] }, { type: "partida.empezar" });
  e = conPD(e, 3);
  for (const t of ["accion", "reaccion"]) { e = play(e, { type: "escena.elegir", tipo: t }); e = tirar(e, [1, 1]); e = apply(e, { type: "escena.cerrar" }); }
  e = tirar(play(e, { type: "escena.elegir", tipo: "drama" }), [3, 3]);
  assert.equal(e.fase, "juego");
  assert.equal(e.aliento, true);
  e = apply(e, { type: "aliento.usar", consId: e.consecuencias[0].id });
  assert.equal(e.aliento, false);
  assert.equal(totales(e).consecuencias, 4);
});

test("hada (3 PD) y marcar heredera (4 PD) eliminan una consecuencia que elige el DJ", () => {
  let e = play(conPD(lista(), 7), { type: "escena.elegir", tipo: "drama" });
  e = apply(tirar(e, [3, 3]), { type: "escena.cerrar" });      // 1 consecuencia, +0 PD
  const id = e.consecuencias[0].id;
  e = apply(e, { type: "pd.hada" });
  assert.equal(e.pendientes.length, 1);
  assert.equal(totales(e).consecuencias, 1, "hasta que el DJ elija, sigue activa");
  e = apply(e, { type: "pendiente.resolver", id: e.pendientes[0].id, consId: id });
  assert.equal(totales(e).consecuencias, 0);
  e = apply(e, { type: "pd.marcar", nombre: "Ariel", nota: "joven de la aldea" });
  assert.equal(e.herederas.length, 1);
  assert.equal(e.pendientes.length, 0, "sin consecuencias activas no hay nada que elegir");
});

test("elegir heredera (5 PD) exige una marcada y lleva al epílogo; el juego se gana", () => {
  let e = conPD(lista(), 9);
  assert.equal(code(() => apply(e, { type: "pd.elegir", id: "h1" })), "NO_HEREDERA");
  e = apply(e, { type: "pd.marcar", nombre: "Ariel" });
  e = apply(e, { type: "pd.elegir", id: e.herederas[0].id });
  assert.equal(e.fase, "epilogo");
  assert.equal(e.pdGastados, 9);
  e = apply(e, { type: "fin.cerrar", texto: "la choza ya tiene dueña" });
  assert.equal(e.resultado.tipo, "victoria");
});

test("PD insuficientes y acciones desconocidas lanzan errores con código", () => {
  assert.equal(code(() => apply(lista(), { type: "pd.marcar", nombre: "A" })), "NO_PD");
  assert.equal(code(() => apply(lista(), { type: "no.existe" })), "ACCION");
});

test("el estado público nunca lleva el texto de las consecuencias", () => {
  let e = tirar(play(lista(), { type: "escena.elegir", tipo: "accion" }), [1, 1]);
  for (const c of e.consecuencias) assert.deepEqual(Object.keys(c).sort(), ["activa", "escena", "id", "revelada"]);
  assert.doesNotMatch(JSON.stringify(e), /texto":"[^"]*secreto/);
});

test("asientos: uno solo puede ocupar los dos (solitario) y no se pisa el de otro", () => {
  let e = play(newGame(), { type: "asiento.tomar", rol: "bruja", userId: "u1", user: "Ana" }, { type: "asiento.tomar", rol: "dj", userId: "u1", user: "Ana" });
  assert.deepEqual(rolesDe(e, "u1"), ["bruja", "dj"]);
  assert.equal(code(() => apply(e, { type: "asiento.tomar", rol: "dj", userId: "u2", user: "Bo" })), "ASIENTO_OCUPADO");
});

test("avisos: puedes marcar con 4 PD, última vela con 4 consecuencias", () => {
  let e = conPD(lista(), 4);
  assert.deepEqual(avisos(e), ["puedesMarcar"]);
});

test("revelar una consecuencia publica su texto; las demás siguen sin él", () => {
  let e = tirar(play(lista(), { type: "escena.elegir", tipo: "accion" }), [1, 1]);
  e = apply(e, { type: "cons.revelar", id: e.consecuencias[0].id, texto: "la lechuza era un mal presagio" });
  assert.equal(e.consecuencias[0].texto, "la lechuza era un mal presagio");
  assert.equal("texto" in e.consecuencias[1], false);
});

test("si la bruja muere a mitad de escena, cerrar la historia guarda esa escena", () => {
  let e = lista();
  for (const tipo of ["accion", "reaccion", "drama"]) {
    e = tirar(play(e, { type: "escena.elegir", tipo }), [1, 1]);
    if (e.fase === "muerte") break;
    e = apply(e, { type: "escena.cerrar" });
  }
  assert.equal(e.fase, "muerte");
  e = apply(e, { type: "fin.cerrar", texto: "fin" });
  assert.equal(e.escena, null);
  assert.equal(e.historial.filter(h => h.k === "escena").length, 3);
});
