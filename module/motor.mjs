/**
 * Máquina de estados de la partida. Pura: `apply(estado, accion)` devuelve un estado nuevo o lanza
 * `MotorError` con un código que la interfaz traduce. El estado es público: los TEXTOS de las
 * consecuencias secretas no están aquí (viven en el documento del Director, ver services/game.mjs).
 */
import { COSTE, REGLAS, TIPOS, activas, dadosDisponibles, escenaPermitida, pdDisponibles, puedeGanar, resultadoTirada } from "./reglas.mjs";

export class MotorError extends Error {
  constructor(code) { super(code); this.code = code; }
}
const fallo = code => { throw new MotorError(code); };
const cadena = (v, max = 400) => String(v ?? "").trim().slice(0, max);

const CATEGORIAS = ["orientar", "cambiar", "comer"];
export const ROLES = Object.freeze(["bruja", "dj"]);

export function newGame({ ambientacion = "cuento", ajustes = {} } = {}) {
  return {
    v: 1, rev: 0, fase: "preparacion", ambientacion,
    ajustes: { pdIniciales: 0, ultimoAliento: false, ...ajustes },
    asientos: { bruja: { userId: "", user: "", actorUuid: "" }, dj: { userId: "", user: "" } },
    bruja: { nombre: "", apodo: "", rasgo: "", bolsa: CATEGORIAS.map(cat => ({ cat, nombre: "", detalle: "" })) },
    escena: null, ultimoTipo: null, nEscenas: 0,
    pdGanados: 0, pdGastados: 0,
    consecuencias: [], seq: 0, pendientes: [], aliento: false,
    herederas: [], historial: [], resultado: null
  };
}

/** Rol que ocupa un usuario (puede ser ambos). */
export const rolesDe = (estado, userId) => ROLES.filter(r => userId && estado.asientos[r].userId === userId);

/** Totales derivados: nunca contadores sueltos. */
export function totales(estado) {
  return {
    pd: pdDisponibles(estado), pdGanados: estado.pdGanados, pdGastados: estado.pdGastados,
    consecuencias: activas(estado.consecuencias),
    marcadas: estado.herederas.length,
    puedeGanar: puedeGanar(estado.pdGanados)
  };
}

/** Avisos (no bloquean): lo que el sistema ve y los jugadores quizá no. */
export function avisos(estado) {
  const w = [], t = totales(estado);
  if (estado.fase !== "juego") return w;
  if (!estado.herederas.length && t.pd >= COSTE.marcar) w.push("puedesMarcar");
  if (estado.herederas.length && t.pd >= COSTE.elegir) w.push("puedesElegir");
  if (t.consecuencias === REGLAS.consecuenciasMax - 1) w.push("ultimaVela");
  if (estado.pendientes.length) w.push("pendiente");
  return w;
}

function cobrar(e, coste) {
  if (pdDisponibles(e) < coste) fallo("NO_PD");
  e.pdGastados += coste;
}

function quitarConsecuencia(e, id) {
  const c = e.consecuencias.find(x => x.id === id && x.activa);
  if (!c) fallo("NO_CONSECUENCIA");
  c.activa = false;
}

/** Tras gastar PD que eliminan una consecuencia: si hay alguna activa, queda pendiente que el DJ elija cuál. */
function pedirQuitar(e, origen) {
  if (activas(e.consecuencias)) e.pendientes.push({ id: `p${++e.seq}`, origen });
}

/** Pasa la escena en curso al historial. La usan «cerrar escena» y «cerrar la historia» (si la bruja muere a mitad de escena). */
function cerrarEscena(e, nota) {
  const s = e.escena;
  e.historial.push({
    k: "escena", n: s.n, tipo: s.tipo, quien: s.quien, planteo: s.planteo, descanso: s.descanso,
    uso: s.uso?.estado === "concedido" ? { que: s.uso.que, frase: s.uso.frase } : null,
    pdDado: s.pd, tirada: s.tirada, nota: cadena(nota ?? s.nota, 800)
  });
  e.ultimoTipo = s.tipo; e.nEscenas = s.n; e.escena = null;
}

const requiereJuego = e => { if (e.fase !== "juego") fallo("FASE"); };

const ACCIONES = {
  "ajustes.set"(e, a) {
    if (e.fase !== "preparacion") fallo("FASE");
    e.ajustes.pdIniciales = Math.max(0, Math.min(9, Number(a.pdIniciales) || 0));
    e.ajustes.ultimoAliento = Boolean(a.ultimoAliento);
    e.ambientacion = cadena(a.ambientacion, 60) || e.ambientacion;
  },

  "asiento.tomar"(e, a) {
    if (!ROLES.includes(a.rol)) fallo("ROL");
    const s = e.asientos[a.rol];
    if (s.userId && s.userId !== a.userId) fallo("ASIENTO_OCUPADO");
    s.userId = a.userId; s.user = cadena(a.user, 60);
    if (a.rol === "bruja") s.actorUuid = cadena(a.actorUuid, 120);
  },
  "asiento.dejar"(e, a) {
    if (!ROLES.includes(a.rol)) fallo("ROL");
    const s = e.asientos[a.rol];
    if (s.userId && s.userId !== a.userId && !a.arbitro) fallo("ASIENTO_OCUPADO");
    s.userId = ""; s.user = ""; if ("actorUuid" in s) s.actorUuid = "";
  },

  "bruja.perfil"(e, a) {
    if (e.fase !== "preparacion") fallo("FASE");
    e.bruja.nombre = cadena(a.nombre, 80); e.bruja.apodo = cadena(a.apodo, 80); e.bruja.rasgo = cadena(a.rasgo, 160);
    CATEGORIAS.forEach((cat, i) => {
      const o = a.bolsa?.[i] ?? {};
      e.bruja.bolsa[i] = { cat, nombre: cadena(o.nombre, 80), detalle: cadena(o.detalle, 240) };
    });
  },

  "partida.empezar"(e) {
    if (e.fase !== "preparacion") fallo("FASE");
    if (!e.bruja.nombre) fallo("FALTA_NOMBRE");
    if (!e.bruja.rasgo) fallo("FALTA_RASGO");
    if (e.bruja.bolsa.some(o => !o.nombre)) fallo("FALTAN_OBJETOS");
    e.fase = "juego";
    e.pdGanados += e.ajustes.pdIniciales;
  },

  /** `descanso`: gasta 2 PD, permite repetir tipo y da un dado extra a toda tirada de la escena. */
  "escena.elegir"(e, a) {
    requiereJuego(e);
    if (e.escena) fallo("ESCENA_ABIERTA");
    if (!TIPOS.includes(a.tipo)) fallo("TIPO");
    const descanso = Boolean(a.descanso);
    if (!descanso && !escenaPermitida(a.tipo, e.ultimoTipo)) fallo("MISMO_TIPO");
    if (descanso) cobrar(e, COSTE.descanso);
    e.escena = { n: e.nEscenas + 1, tipo: a.tipo, quien: cadena(a.quien, 20), planteo: "", estado: "abierta", descanso, pd: false, uso: null, tirada: null, nota: "" };
  },
  "escena.planteo"(e, a) {
    requiereJuego(e); if (!e.escena) fallo("SIN_ESCENA");
    e.escena.planteo = cadena(a.texto, 600); if (a.quien) e.escena.quien = cadena(a.quien, 20);
  },
  "escena.nota"(e, a) {
    if (!e.escena) fallo("SIN_ESCENA");
    e.escena.nota = cadena(a.texto, 800);
  },

  /** La Bruja propone usar el rasgo o un objeto; el DJ es «tan laxo como quiera». */
  "uso.pedir"(e, a) {
    requiereJuego(e); const s = e.escena;
    if (!s || s.tirada) fallo("NO_TIRADA");
    if (!["rasgo", "orientar", "cambiar", "comer"].includes(a.que)) fallo("USO");
    s.uso = { que: a.que, frase: cadena(a.frase, 240), estado: "pedido" };
  },
  "uso.responder"(e, a) {
    const s = e.escena;
    if (!s?.uso || s.tirada) fallo("NO_TIRADA");
    s.uso.estado = a.si ? "concedido" : "denegado";
  },
  "uso.retirar"(e) {
    const s = e.escena; if (!s || s.tirada) fallo("NO_TIRADA");
    s.uso = null;
  },

  /** 1 PD = un dado más. Se paga antes de tirar (D1); se puede devolver mientras no se haya tirado. */
  "dado.pd"(e) {
    requiereJuego(e); const s = e.escena;
    if (!s || s.tirada) fallo("NO_TIRADA");
    if (s.pd) { s.pd = false; e.pdGastados -= COSTE.dado; return; }
    if (dadosDisponibles({ uso: s.uso?.estado === "concedido", descanso: s.descanso }) >= REGLAS.dadosMax) fallo("DADOS_MAX");
    cobrar(e, COSTE.dado); s.pd = true;
  },

  /** Los dados los tira el servicio (Foundry) y llegan aquí ya resueltos; el motor valida y aplica. */
  "tirada.resolver"(e, a) {
    requiereJuego(e); const s = e.escena;
    if (!s || s.tirada) fallo("NO_TIRADA");
    const n = dadosDisponibles({ uso: s.uso?.estado === "concedido", pd: s.pd, descanso: s.descanso });
    const dados = (a.dados ?? []).map(Number);
    if (dados.length !== n || dados.some(d => !Number.isInteger(d) || d < 1 || d > 6)) fallo("DADOS");
    const total = dados.reduce((x, y) => x + y, 0), r = resultadoTirada(total);
    const ids = [];
    for (let i = 0; i < r.consecuencias; i++) {
      const id = `c${++e.seq}`; ids.push(id);
      e.consecuencias.push({ id, escena: s.n, activa: true, revelada: false });
    }
    e.pdGanados += r.pd;
    s.tirada = { dados, total, nivel: r.nivel, pd: r.pd, consecuencias: ids };
    s.estado = "cierre";
    if (activas(e.consecuencias) >= REGLAS.consecuenciasMax) {
      if (e.ajustes.ultimoAliento && pdDisponibles(e) >= COSTE.hada) e.aliento = true;
      else e.fase = "muerte";
    }
  },

  /** Último aliento (opcional): 3 PD para evitar la quinta consecuencia. */
  "aliento.usar"(e, a) {
    if (!e.aliento) fallo("FASE");
    cobrar(e, COSTE.hada); quitarConsecuencia(e, a.consId); e.aliento = false;
    e.historial.push({ k: "gasto", clave: "aliento", escena: e.escena?.n ?? e.nEscenas });
  },
  "aliento.rendirse"(e) { if (!e.aliento) fallo("FASE"); e.aliento = false; e.fase = "muerte"; },

  "escena.cerrar"(e, a) {
    if (!e.escena || (e.fase !== "juego" && e.fase !== "muerte")) fallo("SIN_ESCENA");
    if (e.aliento) fallo("ALIENTO");
    cerrarEscena(e, a.nota);
  },

  /** Eliminar una consecuencia por narración (sin gastar PD): lo que el DJ y la Bruja acuerden. */
  "cons.quitar"(e, a) { requiereJuego(e); quitarConsecuencia(e, a.id); e.historial.push({ k: "gasto", clave: "narrada", escena: e.nEscenas }); },
  /** El DJ decide revelar una consecuencia: su texto pasa al estado público (y al Grimorio). Hasta entonces no sale de la libreta. */
  "cons.revelar"(e, a) {
    const c = e.consecuencias.find(x => x.id === a.id); if (!c) fallo("NO_CONSECUENCIA");
    c.revelada = true; c.texto = cadena(a.texto, 400);
  },

  "pd.hada"(e) {
    requiereJuego(e); cobrar(e, COSTE.hada);
    pedirQuitar(e, "hada");
    e.historial.push({ k: "gasto", clave: "hada", escena: e.nEscenas });
  },
  "pd.marcar"(e, a) {
    requiereJuego(e);
    const nombre = cadena(a.nombre, 80);
    if (!nombre) fallo("FALTA_NOMBRE");
    if (e.herederas.length >= REGLAS.herederasMax) fallo("MAX_HEREDERAS");
    cobrar(e, COSTE.marcar);
    const h = { id: `h${++e.seq}`, nombre, nota: cadena(a.nota, 240), elegida: false, escena: e.nEscenas + (e.escena ? 1 : 0) };
    e.herederas.push(h);
    pedirQuitar(e, "marcar");
    e.historial.push({ k: "gasto", clave: "marcar", escena: h.escena, nombre });
  },
  "pd.elegir"(e, a) {
    requiereJuego(e);
    if (e.escena) fallo("ESCENA_ABIERTA");
    const h = e.herederas.find(x => x.id === a.id);
    if (!h) fallo("NO_HEREDERA");
    cobrar(e, COSTE.elegir);
    h.elegida = true; e.fase = "epilogo";
    e.historial.push({ k: "gasto", clave: "elegir", escena: e.nEscenas, nombre: h.nombre });
  },

  /** El DJ decide qué consecuencia se elimina tras un PD que lo permite. */
  "pendiente.resolver"(e, a) {
    const i = e.pendientes.findIndex(p => p.id === a.id);
    if (i < 0) fallo("NO_PENDIENTE");
    if (a.consId) quitarConsecuencia(e, a.consId);
    e.pendientes.splice(i, 1);
  },

  "fin.cerrar"(e, a) {
    if (e.fase !== "muerte" && e.fase !== "epilogo") fallo("FASE");
    if (e.escena) cerrarEscena(e);
    e.resultado = { tipo: e.fase === "muerte" ? "muerte" : "victoria", texto: cadena(a.texto, 1500) };
    e.fase = "fin";
  },

  /** Correcciones del Director. */
  "admin.ajustar"(e, a) {
    for (const k of ["pdGanados", "pdGastados"]) if (k in a) e[k] = Math.max(0, Math.min(99, Number(a[k]) || 0));
  }
};

export function apply(estado, accion) {
  const fn = ACCIONES[accion?.type];
  if (!fn) fallo("ACCION");
  const e = structuredClone(estado);
  fn(e, accion);
  e.rev++;
  return e;
}

export const ACCIONES_CONOCIDAS = Object.freeze(Object.keys(ACCIONES));
