import { COLOR, TEMPLATES } from "../constants.mjs";
import { SystemApp, t, f } from "./base.mjs";
import { GameService, loc } from "../services/game.mjs";
import { openApp } from "./registry.mjs";
import { rolesDe } from "../motor.mjs";

const ROWS = { candidatas: "cand", pnj: "pnj" };
const val = (root, name) => root.querySelector(`[name="${CSS.escape(name)}"]`)?.value ?? "";

/**
 * La Libreta del Director: sus notas secretas. Las consecuencias (con su texto), las candidatas a heredera
 * y los demás PNJ. Solo la ve quien ocupa el asiento del Director (y el GM): vive en un documento aparte.
 */
export class LibretaApp extends SystemApp {
  static MEMORY = "notebook";
  static SCROLL_MEMORY = [".br-notebook"];
  static DEFAULT_OPTIONS = {
    id: "br-notebook", classes: ["br-notebook-app", "br-paper-window", "br-mustard"],
    window: { title: "BR.App.Notebook", icon: "fa-solid fa-book" },
    position: { width: 760, height: 780 },
    actions: {
      saveCons: LibretaApp.#saveCons, dropCons: LibretaApp.#dropCons, revealCons: LibretaApp.#revealCons,
      addRow: LibretaApp.#addRow, delRow: LibretaApp.#delRow, spark: LibretaApp.#spark,
      importKey: LibretaApp.#importKey, copyKey: LibretaApp.#copyKey,
      choza: () => openApp("choza"), access: () => openApp("access")
    }
  };
  static PARTS = { body: { template: `${TEMPLATES}/apps/libreta.hbs`, scrollable: [".br-notebook"] } };

  static init() {
    Hooks.on("updateJournalEntry", doc => { if (doc.id === GameService.doc()?.id) LibretaApp.instance?.refresh(); });
    Hooks.on("mrBrSecret", () => LibretaApp.instance?.refresh());
  }
  refresh() { if (this.rendered) this.render(); }

  async _prepareContext() {
    const state = GameService.state();
    if (!state) return { noGame: true };
    const secret = GameService.secret(), def = GameService.setting();
    const iAmDj = rolesDe(state, game.user.id).includes("dj");
    if (!secret) return { locked: true, iAmDj, gm: game.user.isGM, noDj: !state.asientos.dj.userId, needsKey: GameService.lockReason() === "key" && GameService.isDirector() };
    const b = state.bruja;
    return {
      bruja: { nombre: b.nombre, apodo: b.apodo, rasgo: b.rasgo, bolsa: b.bolsa },
      cons: state.consecuencias.map((c, i) => ({
        id: c.id, n: i + 1, escena: c.escena, activa: c.activa, revelada: c.revelada, texto: secret.textos[c.id] ?? "", color: c.activa ? "var(--br-acc)" : "var(--br-muted)"
      })),
      activas: state.consecuencias.filter(c => c.activa).length, max: 5,
      candidatas: secret.candidatas.map((r, i) => ({ i, ...r })), pnj: secret.pnj.map((r, i) => ({ i, ...r })),
      marcadas: state.herederas.map(h => ({ nombre: h.nombre, elegida: h.elegida })),
      sparkTarget: `texto-${(state.consecuencias.find(c => c.activa && !secret.textos[c.id]) ?? state.consecuencias.at(-1))?.id ?? ""}`,
      sparks: (def.sparks ?? []).map(loc), questions: (def.questions ?? []).map(loc)
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    for (const el of this.element.querySelectorAll("[data-row] input, [data-row] textarea, [data-row] input[type=checkbox]")) {
      el.addEventListener("change", () => LibretaApp.#saveRows.call(this));
    }
  }

  /** Guarda de una vez las dos listas leyéndolas del formulario. */
  static async #saveRows() {
    const read = (kind, prefix) => [...this.element.querySelectorAll(`[data-row="${kind}"]`)].map(row => {
      const i = row.dataset.i;
      return { nombre: val(this.element, `${prefix}.${i}.nombre`).slice(0, 80), nota: val(this.element, `${prefix}.${i}.nota`).slice(0, 240), hecho: row.querySelector('[type=checkbox]')?.checked ?? false };
    });
    const candidatas = read("candidatas", "cand"), pnj = read("pnj", "pnj");
    await GameService.editSecret(s => { s.candidatas = candidatas; s.pnj = pnj; });
  }

  static async #importKey() {
    const ok = await GameService.importKey(val(this.element, "clave"));
    if (ok) ui.notifications.info(t("BR.Secret.Opened")); else ui.notifications.error(t("BR.Secret.BadKey"));
  }
  static async #copyKey() {
    const key = GameService.exportKey();
    if (!key) return ui.notifications.warn(t("BR.Secret.NoKeyYet"));
    try { await navigator.clipboard.writeText(key); ui.notifications.info(t("BR.Secret.KeyCopied")); }
    catch { this.element.querySelector("[name=claveMostrada]")?.select(); }
  }

  static async #saveCons(event, target) {
    const id = target.dataset.id, text = val(this.element, `texto-${id}`).trim().slice(0, 400);
    await GameService.editSecret(s => { if (text) s.textos[id] = text; else delete s.textos[id]; });
    ui.notifications.info(t("BR.Notebook.Saved"));
  }
  static async #dropCons(event, target) { await GameService.dispatch({ type: "cons.quitar", id: target.dataset.id }); }
  static async #revealCons(event, target) {
    const id = target.dataset.id, text = GameService.secret()?.textos[id];
    if (!text) return ui.notifications.warn(t("BR.Notebook.NothingToReveal"));
    await GameService.dispatch({ type: "cons.revelar", id, texto: text });
  }
  static async #addRow(event, target) {
    const kind = target.dataset.kind;
    await GameService.editSecret(s => { s[kind].push({ nombre: "", nota: "", hecho: false }); });
  }
  static async #delRow(event, target) {
    const kind = target.dataset.kind, i = Number(target.dataset.i);
    await GameService.editSecret(s => { s[kind].splice(i, 1); });
  }
  /** Una chispa se copia al campo de la consecuencia elegida; nunca se guarda sola. */
  static #spark(event, target) {
    const field = this.element.querySelector(`[name="${CSS.escape(target.dataset.field)}"]`);
    if (!field) return;
    field.value = field.value ? `${field.value} ${target.dataset.text}` : target.dataset.text; field.focus();
  }
}
