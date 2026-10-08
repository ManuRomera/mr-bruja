import { AMBIENTE, ASSETS, COLOR, COSTE, REGLAS, TEMPLATES, TIPOS } from "../constants.mjs";
import { DialogV2 } from "../compat.mjs";
import { SystemApp, t, f } from "./base.mjs";
import { openApp } from "./registry.mjs";
import { cssUrl } from "./view.mjs";
import { GameService, loc } from "../services/game.mjs";
import { SoundService } from "../services/sound.mjs";
import { rollDice } from "../services/dice.mjs";
import { avisos, rolesDe, totales } from "../motor.mjs";
import { activas, dadosDisponibles, escenaPermitida, pdDisponibles } from "../reglas.mjs";
import { get, set } from "../settings.mjs";

const CATS = [{ cat: "orientar", icon: "fa-compass" }, { cat: "cambiar", icon: "fa-right-left" }, { cat: "comer", icon: "fa-bread-slice" }];
const val = (root, name) => root.querySelector(`[name="${name}"]`)?.value ?? "";
const MOTAS = Array.from({ length: 14 }, (_, i) => i);

/**
 * La Choza: la ventana principal. A la izquierda la bolsa y las velas, en el centro lo que toca hacer
 * (preparar la bruja, elegir escena, tirar en el caldero, cerrar), a la derecha las herederas y el frasco de PD.
 * El estado vive en el diario de la partida; esta ventana solo lo pinta y envía acciones.
 */
export class ChozaApp extends SystemApp {
  static MEMORY = "choza";
  static SCROLL_MEMORY = [".br-center"];
  static DEFAULT_OPTIONS = {
    id: "br-choza", classes: ["br-choza-app"],
    window: { title: "BR.App.Choza", icon: "fa-solid fa-hat-wizard" },
    position: { width: 1120, height: 760 },
    actions: {
      sit: ChozaApp.#sit, leave: ChozaApp.#leave, chip: ChozaApp.#chip, begin: ChozaApp.#begin, saveSettings: ChozaApp.#saveSettings,
      pick: ChozaApp.#pick, rest: ChozaApp.#toggleRest, flip: ChozaApp.#flip, planteo: ChozaApp.#planteo,
      useAsk: ChozaApp.#useAsk, useYes: ChozaApp.#useAnswer(true), useNo: ChozaApp.#useAnswer(false), useWithdraw: ChozaApp.#send("uso.retirar"),
      spendDie: ChozaApp.#send("dado.pd"), roll: ChozaApp.#roll, closeScene: ChozaApp.#closeScene,
      fairy: ChozaApp.#fairy, mark: ChozaApp.#mark, choose: ChozaApp.#choose,
      write: ChozaApp.#write, resolve: ChozaApp.#resolve, breathe: ChozaApp.#breathe, giveUp: ChozaApp.#giveUp,
      end: ChozaApp.#finish, revealAll: ChozaApp.#revealAll, newGame: ChozaApp.#newGame,
      grimoire: () => openApp("grimoire"), rules: () => openApp("rules"), notebook: () => openApp("notebook"), safety: () => openApp("safety"), access: () => openApp("access")
    }
  };
  static PARTS = { body: { template: `${TEMPLATES}/apps/choza.hbs`, scrollable: [".br-center"] } };

  #shown = null;
  #rest = false;
  /** Lo que cada jugador está escribiendo: un repintado remoto no debe borrarlo. */
  #draft = new Map();

  /** Se llama una vez desde el arranque: repinta la Choza cuando cambia la partida o la libreta. */
  static init() {
    const same = doc => doc.id === GameService.doc()?.id;
    for (const hook of ["updateJournalEntry", "createJournalEntry", "deleteJournalEntry"]) Hooks.on(hook, doc => { if (same(doc)) ChozaApp.instance?.refresh(); });
    Hooks.on("mrBrSecret", () => ChozaApp.instance?.refresh());
    Hooks.on("updateUser", () => ChozaApp.instance?.refresh());
  }

  refresh() {
    const next = GameService.state(), prev = this.#shown;
    if (this.rendered && prev && next) this.#effects(prev, next);
    if (this.rendered) this.render();
  }

  /** Sonidos que acompañan a los cambios de la partida, para todos los jugadores. */
  #effects(a, b) {
    const S = SoundService;
    if (b.fase !== a.fase) {
      if (b.fase === "muerte") S.death();
      if (b.fase === "epilogo") S.win();
    }
    if (b.escena && !a.escena) { S.card(); setTimeout(() => S.pawn(), 160); }
    if (a.escena && !b.escena) S.page();
    if (b.escena?.tirada && !a.escena?.tirada) S.dice();
    const ca = activas(a.consecuencias), cb = activas(b.consecuencias);
    if (cb > ca) setTimeout(() => S.candleOut(), b.escena?.tirada && !a.escena?.tirada ? 900 : 0);
    if (cb < ca) S.candleLit();
    if (b.pdGanados > a.pdGanados) setTimeout(() => S.drop(), b.escena?.tirada && !a.escena?.tirada ? 1300 : 0);
    if (b.pdGastados > a.pdGastados && b.fase === a.fase) S.spend();
    if (b.herederas.length > a.herederas.length) S.seal();
    if (b.historial.length > a.historial.length && b.historial.at(-1)?.clave === "hada") S.fairy();
    if (b.asientos.dj.userId && !a.asientos.dj.userId) S.key();
  }

  /* ---------------------------------------- */
  /*  Contexto                                */
  /* ---------------------------------------- */

  async _prepareContext() {
    const state = GameService.state(), gm = game.user.isGM;
    if (!state) return { noGame: true, gm };
    this.#shown = state;
    const def = GameService.settingDef(state.ambientacion);
    const roles = rolesDe(state, game.user.id);
    const can = { bruja: roles.includes("bruja") || gm, dj: roles.includes("dj") || gm };
    const secret = GameService.secret(), tot = totales(state), e = state.escena;
    const fase = state.fase, tipoEscena = e?.tipo ?? "";
    const face = get("cardFace") === "neutral" ? "neutral" : "engraved";
    const ctx = {
      gm, state, fase, roles, can, lang: game.i18n.lang, spectator: !roles.length && !gm,
      isPrep: fase === "preparacion", isPlay: fase === "juego", isEnd: fase === "muerte" || fase === "epilogo" || fase === "fin",
      setting: { id: def.id, name: loc(def.name), tagline: loc(def.tagline) },
      faseLabel: e ? f("BR.Scene.Label", { n: e.n, tipo: t(`BR.Tipo.${e.tipo}`) }) : t(`BR.Fase.${fase}`),
      colorEscena: COLOR[tipoEscena] ?? "#c9a24a", tipoEscena,
      bg: cssUrl(this.#background(state)), motas: MOTAS, face, faceLabel: t(face === "neutral" ? "BR.Cards.Engraved" : "BR.Cards.Neutral"),
      tot, warnings: avisos(state).map(w => t(`BR.Warn.${w}`)),
      secretAccess: Boolean(secret),
      needsKey: GameService.lockReason() === "key"
    };
    ctx.bruja = this.#bruja(state, tot);
    ctx.side = this.#side(state, tot, can);
    if (fase === "preparacion") ctx.prep = this.#prep(state, def, roles, can);
    if (fase === "juego") ctx.play = this.#play(state, def, can, secret, face);
    if (fase === "muerte" || fase === "epilogo" || fase === "fin") ctx.end = this.#end(state, can, secret);
    ctx.helpers = this.#helpers(state, can, secret);
    ctx.recent = state.historial.filter(h => h.k === "escena").slice(-4).reverse().map(h => ({ n: h.n, tipo: t(`BR.Tipo.${h.tipo}`), color: COLOR[h.tipo], nivel: h.tirada ? t(`BR.Nivel.${h.tirada.nivel}`) : t("BR.Scene.NoRoll"), nota: h.nota }));
    ctx.canNew = gm;
    return ctx;
  }

  #background(state) {
    if (state.fase === "muerte" || (state.fase === "fin" && state.resultado?.tipo === "muerte")) return ASSETS.place["muerte-bg"];
    if (state.fase === "epilogo" || state.fase === "fin") return ASSETS.place["epilogo-bg"];
    if (state.escena) return ASSETS.mood[state.escena.tipo];
    return ASSETS.place["choza-mesa"];
  }

  #bruja(state, tot) {
    const b = state.bruja;
    const lit = Math.max(0, REGLAS.consecuenciasMax - tot.consecuencias);
    return {
      nombre: b.nombre, apodo: b.apodo, rasgo: b.rasgo,
      bolsa: b.bolsa.map((o, i) => ({ ...CATS[i], label: t(`BR.Bag.${CATS[i].cat}`), nombre: o.nombre, detalle: o.detalle })),
      velas: Array.from({ length: REGLAS.consecuenciasMax }, (_, i) => ({ i, on: i < lit })),
      lit, out: tot.consecuencias, portrait: ASSETS.portrait.bruja
    };
  }

  #side(state, tot, can) {
    const pd = tot.pd, fill = Math.min(100, Math.round(100 * Math.min(pd, 10) / 10));
    const hay = state.herederas.length;
    const rows = [
      { key: "dado", cost: COSTE.dado, icon: "fa-dice", label: t("BR.Recipe.dado"), hint: t("BR.Recipe.dadoHint"), enabled: false, action: "spendDie" },
      { key: "hada", cost: COSTE.hada, icon: "fa-wand-sparkles", label: t("BR.Recipe.hada"), hint: t("BR.Recipe.hadaHint"), enabled: pd >= COSTE.hada && state.fase === "juego" && can.bruja, action: "fairy" },
      { key: "marcar", cost: COSTE.marcar, icon: "fa-seedling", label: t("BR.Recipe.marcar"), hint: t("BR.Recipe.marcarHint"), enabled: pd >= COSTE.marcar && state.fase === "juego" && can.bruja && state.herederas.length < REGLAS.herederasMax, action: "mark", input: true },
      { key: "elegir", cost: COSTE.elegir, icon: "fa-crown", label: t("BR.Recipe.elegir"), hint: t("BR.Recipe.elegirHint"), enabled: pd >= COSTE.elegir && hay && state.fase === "juego" && !state.escena && can.bruja, action: "choose", select: true }
    ];
    const e = state.escena;
    rows[0].enabled = Boolean(e && !e.tirada && state.fase === "juego" && can.bruja && (e.pd || pd >= COSTE.dado && dadosDisponibles({ uso: e.uso?.estado === "concedido", descanso: e.descanso }) < REGLAS.dadosMax));
    rows[0].on = Boolean(e?.pd);
    return {
      pd, ganados: state.pdGanados, gastados: state.pdGastados, fill, goal: Math.min(100, Math.round(100 * Math.min(state.pdGanados, REGLAS.pdVictoria) / REGLAS.pdVictoria)),
      recipes: rows, canWin: tot.puedeGanar,
      herederas: state.herederas.map(h => ({ ...h, portrait: ASSETS.portrait.heredera })),
      maxHerederas: REGLAS.herederasMax, emptySlots: Array.from({ length: Math.max(0, REGLAS.herederasMax - state.herederas.length) }, (_, i) => i)
    };
  }

  #prep(state, def, roles, can) {
    const seat = rol => {
      const s = state.asientos[rol], mine = s.userId === game.user.id;
      return { rol, label: t(`BR.Seat.${rol}`), hint: t(`BR.Seat.${rol}Hint`), taken: Boolean(s.userId), name: s.user, mine, canTake: !s.userId, canLeave: mine || (game.user.isGM && Boolean(s.userId)), portrait: ASSETS.portrait[rol] };
    };
    const picks = (list, field) => list.map(x => ({ field, text: loc(x) }));
    const b = state.bruja;
    return {
      seats: ["bruja", "dj"].map(seat),
      bothSeated: Boolean(state.asientos.bruja.userId && state.asientos.dj.userId),
      canEdit: can.bruja, ajustes: state.ajustes,
      fields: {
        nombre: b.nombre, apodo: b.apodo, rasgo: b.rasgo,
        names: picks(def.names, "nombre"), traits: picks(def.traits, "rasgo"),
        bolsa: b.bolsa.map((o, i) => ({
          i, cat: o.cat, icon: CATS[i].icon, label: t(`BR.Bag.${o.cat}`), hint: t(`BR.Bag.${o.cat}Hint`), nombre: o.nombre, detalle: o.detalle,
          chips: picks(def.items[o.cat] ?? [], `bolsa.${i}.nombre`)
        }))
      },
      questions: (def.questions ?? []).map(loc),
      intro: loc(def.where), places: def.places?.map(loc) ?? [], people: def.people?.map(loc) ?? [], dangers: def.dangers?.map(loc) ?? [],
      note: t("BR.Bag.NoteNot")
    };
  }

  #play(state, def, can, secret, face) {
    const e = state.escena, tot = totales(state);
    const cards = TIPOS.map(tipo => {
      const last = state.ultimoTipo === tipo;
      return {
        tipo, name: t(`BR.Tipo.${tipo}`), hint: t(`BR.Tipo.${tipo}Hint`), color: COLOR[tipo], art: ASSETS.card[face][tipo],
        last, active: e?.tipo === tipo, locked: last && !this.#rest, selectable: !e && can.bruja && (escenaPermitida(tipo, state.ultimoTipo) || (this.#rest && tot.pd >= COSTE.descanso))
      };
    });
    const play = {
      cards, hasScene: Boolean(e), canRest: !e && can.bruja && tot.pd >= COSTE.descanso, rest: this.#rest, restCost: COSTE.descanso,
      lastName: state.ultimoTipo ? t(`BR.Tipo.${state.ultimoTipo}`) : "", questions: (def.questions ?? []).map(loc), caldero: ASSETS.object.caldero
    };
    if (!e) return play;
    const uso = e.uso && { ...e.uso, label: this.#useLabel(state, e.uso.que), asked: e.uso.estado === "pedido", granted: e.uso.estado === "concedido", denied: e.uso.estado === "denegado" };
    const n = dadosDisponibles({ uso: uso?.granted, pd: e.pd, descanso: e.descanso });
    play.scene = {
      n: e.n, tipo: e.tipo, name: t(`BR.Tipo.${e.tipo}`), color: COLOR[e.tipo], art: ASSETS.card[face][e.tipo], planteo: e.planteo, descanso: e.descanso,
      pd: e.pd, uso, dice: n, dicePips: Array.from({ length: n }, (_, i) => i), nota: e.nota, closing: e.estado === "cierre",
      useOptions: [{ que: "rasgo", label: `${t("BR.Use.Trait")}: ${state.bruja.rasgo}` }, ...state.bruja.bolsa.map(o => ({ que: o.cat, label: `${t(`BR.Bag.${o.cat}`)}: ${o.nombre}` }))],
      canAsk: can.bruja && !e.tirada && !e.uso && !e.pd && n < REGLAS.dadosMax,
      canAnswer: can.dj && uso?.asked, canRoll: can.bruja && !e.tirada,
      tirada: e.tirada && {
        dados: e.tirada.dados, total: e.tirada.total, nivel: e.tirada.nivel, nivelName: t(`BR.Nivel.${e.tirada.nivel}`), hint: t(`BR.Nivel.${e.tirada.nivel}Hint`),
        pd: e.tirada.pd, cons: e.tirada.consecuencias.length
      }
    };
    return play;
  }

  #useLabel(state, que) {
    if (que === "rasgo") return `${t("BR.Use.Trait")}: ${state.bruja.rasgo}`;
    const o = state.bruja.bolsa.find(x => x.cat === que);
    return `${t(`BR.Bag.${que}`)}: ${o?.nombre ?? ""}`;
  }

  /** Lo que solo el Director (y el GM) ve y decide: anotar consecuencias, elegir cuál se elimina, último aliento. */
  #helpers(state, can, secret) {
    if (!can.dj || !secret) return { dj: false, waiting: state.pendientes.length > 0 || Boolean(state.aliento) };
    const label = c => secret.textos[c.id] || f("BR.Cons.Unnamed", { n: c.id.slice(1) });
    const active = state.consecuencias.filter(c => c.activa).map(c => ({ id: c.id, label: label(c) }));
    return {
      dj: true,
      unwritten: GameService.unwritten().map(c => ({ id: c.id, escena: c.escena })),
      sparks: (GameService.setting().sparks ?? []).slice(0, 5).map(loc),
      pending: state.pendientes.map(p => ({ id: p.id, origen: t(`BR.Pending.${p.origen}`), options: active })),
      breath: state.aliento ? { options: active } : null
    };
  }

  #end(state, can, secret) {
    const dead = state.fase === "muerte" || state.resultado?.tipo === "muerte";
    const chosen = state.herederas.find(h => h.elegida);
    return {
      dead, fin: state.fase === "fin", texto: state.resultado?.texto ?? "", canClose: state.fase !== "fin" && (can.bruja || can.dj),
      art: dead ? ASSETS.place["muerte-bg"] : ASSETS.place["epilogo-bg"], chosen: chosen && { ...chosen, portrait: ASSETS.portrait.heredera },
      canReveal: can.dj && Boolean(secret) && state.consecuencias.some(c => !c.revelada && secret.textos[c.id]),
      brujaNombre: state.bruja.nombre, escenas: state.nEscenas,
      dice: !dead
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    if (context.noGame) return;
    SoundService.setAmbient(AMBIENTE[context.tipoEscena] ?? AMBIENTE[context.fase] ?? "bosque");
    for (const el of this.element.querySelectorAll("input[name], textarea[name], select[name]")) {
      if (el.type === "checkbox") continue;
      const saved = this.#draft.get(el.name);
      if (saved !== undefined && !el.disabled && el.value !== saved) el.value = saved;
      el.addEventListener("input", () => this.#draft.set(el.name, el.value));
      el.addEventListener("change", () => this.#draft.set(el.name, el.value));
    }
  }

  async close(options) { SoundService.silence(); return super.close(options); }

  /* ---------------------------------------- */
  /*  Acciones                                */
  /* ---------------------------------------- */

  static #send(type, extra = () => ({})) { return async function () { await GameService.dispatch({ type, ...extra.call(this) }); }; }

  static async #sit(event, target) {
    const rol = target.dataset.rol;
    await GameService.dispatch({ type: "asiento.tomar", rol, userId: game.user.id, user: game.user.name });
  }
  static async #leave(event, target) { await GameService.dispatch({ type: "asiento.dejar", rol: target.dataset.rol, userId: game.user.id, arbitro: game.user.isGM }); }

  /** Un chip rellena el campo de texto sin enviar nada: el jugador decide cuándo guardar. */
  static #chip(event, target) {
    const input = this.element.querySelector(`[name="${CSS.escape(target.dataset.field)}"]`);
    if (!input) return;
    input.value = target.dataset.text; input.focus();
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  #profile() {
    const r = this.element;
    return {
      type: "bruja.perfil", nombre: val(r, "nombre"), apodo: val(r, "apodo"), rasgo: val(r, "rasgo"),
      bolsa: [0, 1, 2].map(i => ({ nombre: val(r, `bolsa.${i}.nombre`), detalle: val(r, `bolsa.${i}.detalle`) }))
    };
  }
  static async #saveSettings() {
    const r = this.element;
    await GameService.dispatch({ type: "ajustes.set", pdIniciales: Number(val(r, "pdIniciales")), ultimoAliento: r.querySelector('[name="ultimoAliento"]')?.checked ?? false });
  }
  static async #begin() {
    await GameService.dispatch(this.#profile());
    await ChozaApp.#saveSettings.call(this);
    this.#draft.clear();
    SoundService.door();
    await GameService.dispatch({ type: "partida.empezar" });
  }

  static async #pick(event, target) {
    const tipo = target.dataset.tipo, rest = this.#rest;
    this.#rest = false;
    const mine = rolesDe(GameService.state(), game.user.id);
    await GameService.dispatch({ type: "escena.elegir", tipo, descanso: rest, quien: mine.includes("bruja") ? "bruja" : "dj" });
  }
  static #toggleRest() { this.#rest = !this.#rest; this.render(); }
  static async #flip() { await set("cardFace", get("cardFace") === "neutral" ? "engraved" : "neutral"); this.render(); }

  static async #planteo() { await GameService.dispatch({ type: "escena.planteo", texto: val(this.element, "planteo") }); this.#draft.delete("planteo"); }

  static async #useAsk() {
    await GameService.dispatch({ type: "uso.pedir", que: val(this.element, "usoQue"), frase: val(this.element, "usoFrase") });
    this.#draft.delete("usoFrase"); this.#draft.delete("usoQue");
  }
  static #useAnswer(si) { return async function () { await GameService.dispatch({ type: "uso.responder", si }); }; }

  /** Tira los dados con Foundry y manda el resultado al motor, que lo valida. */
  static async #roll() {
    const e = GameService.state()?.escena;
    if (!e || e.tirada) return;
    const n = dadosDisponibles({ uso: e.uso?.estado === "concedido", pd: e.pd, descanso: e.descanso });
    const dados = await rollDice(n);
    await GameService.dispatch({ type: "tirada.resolver", dados });
  }

  static async #closeScene() { await GameService.dispatch({ type: "escena.cerrar", nota: val(this.element, "nota") }); this.#draft.clear(); }

  static async #fairy() { await GameService.dispatch({ type: "pd.hada" }); }
  static async #mark() {
    const nombre = val(this.element, "herederaNombre");
    if (!nombre.trim()) return ui.notifications.warn(t("BR.Err.FALTA_NOMBRE"));
    await GameService.dispatch({ type: "pd.marcar", nombre, nota: val(this.element, "herederaNota") });
    this.#draft.delete("herederaNombre"); this.#draft.delete("herederaNota");
  }
  static async #choose() {
    const id = val(this.element, "herederaElegida"), h = GameService.state()?.herederas.find(x => x.id === id);
    if (!h) return;
    const ok = await DialogV2.confirm({ window: { title: t("BR.Recipe.elegir") }, content: `<p>${foundry.utils.escapeHTML(f("BR.Recipe.elegirConfirm", { name: h.nombre }))}</p>`, rejectClose: false, modal: true });
    if (ok) await GameService.dispatch({ type: "pd.elegir", id });
  }

  static async #write(event, target) {
    const id = target.dataset.id, text = val(this.element, `texto-${id}`).trim();
    if (!text) return;
    await GameService.editSecret(s => { s.textos[id] = text.slice(0, 400); });
    this.#draft.delete(`texto-${id}`);
    this.render();
  }
  static async #resolve(event, target) {
    await GameService.dispatch({ type: "pendiente.resolver", id: target.dataset.id, consId: val(this.element, `pend-${target.dataset.id}`) });
  }
  static async #breathe() {
    const st = GameService.state(), sel = val(this.element, "aliento");
    const consId = sel || st.consecuencias.find(c => c.activa)?.id;
    await GameService.dispatch({ type: "aliento.usar", consId });
  }
  static async #giveUp() { await GameService.dispatch({ type: "aliento.rendirse" }); }

  static async #finish() { await GameService.dispatch({ type: "fin.cerrar", texto: val(this.element, "final") }); this.#draft.clear(); }
  static async #revealAll() {
    const st = GameService.state(), sec = GameService.secret();
    if (!sec) return;
    for (const c of st.consecuencias) if (!c.revelada && sec.textos[c.id]) await GameService.dispatch({ type: "cons.revelar", id: c.id, texto: sec.textos[c.id] });
  }

  static async #newGame() {
    if (!game.user.isGM) return;
    const ok = await DialogV2.confirm({ window: { title: t("BR.Game.NewTitle") }, content: `<p>${foundry.utils.escapeHTML(t("BR.Game.NewConfirm"))}</p>`, rejectClose: false, modal: true });
    if (ok) await GameService.reset({ keepSeats: true });
  }
}
