import { COSTE, SYSTEM_ID, TEMPLATES } from "../constants.mjs";
import { SystemApp, t } from "./base.mjs";
import { openApp } from "./registry.mjs";
import { resultadoTirada } from "../reglas.mjs";

const RANGES = [[2, "2"], [3, "3–6"], [7, "7–9"], [10, "10–12"], [13, "13+"]];

/**
 * Reglas: un resumen propio (escrito con otras palabras) y, si el jugador la ha importado, la pestaña «El libro»
 * con el texto de SU manual. El texto del libro nunca viaja con el sistema: lo genera `scripts/import-manual.py`
 * a partir del PDF del propio usuario y se queda en su carpeta (`assets/manual/libro.json`).
 */
export class ReglasApp extends SystemApp {
  static MEMORY = "rules";
  static SCROLL_MEMORY = [".br-rules-body"];
  static DEFAULT_OPTIONS = {
    id: "br-rules", classes: ["br-rules-app", "br-paper-window"],
    window: { title: "BR.App.Rules", icon: "fa-solid fa-circle-question" }, position: { width: 720, height: 740 },
    actions: { tab: ReglasApp.#goTab, reload: ReglasApp.#reload, access: () => openApp("access") }
  };
  static PARTS = { body: { template: `${TEMPLATES}/apps/reglas.hbs`, scrollable: [".br-rules-body"] } };

  static #book;           // undefined = sin cargar · null = no importado · objeto = importado
  #tab = "short";

  static async #load() {
    try {
      const res = await fetch(foundry.utils.getRoute(`systems/${SYSTEM_ID}/assets/manual/libro.json`), { cache: "no-store" });
      const data = res.ok ? await res.json() : null;
      ReglasApp.#book = Array.isArray(data?.pages) && data.pages.length ? data : null;
    } catch { ReglasApp.#book = null; }
  }

  async _prepareContext() {
    if (ReglasApp.#book === undefined) await ReglasApp.#load();
    const book = ReglasApp.#book;
    const tabBook = this.#tab === "book" && book;
    return {
      tab: tabBook ? "book" : "short", hasBook: Boolean(book), wantBook: this.#tab === "book" && !book,
      pages: book?.pages ?? [], bookTitle: book?.title ?? "",
      roll: RANGES.map(([n, label]) => { const r = resultadoTirada(n); return { label, nivel: t(`BR.Nivel.${r.nivel}`), pd: r.pd, cons: r.consecuencias }; }),
      costs: ["dado", "descanso", "hada", "marcar", "elegir"].map(k => ({ cost: COSTE[k], text: t(`BR.Rules.Cost.${k}`) })),
      types: ["accion", "reaccion", "drama", "monologo", "retrospeccion"].map(k => ({ name: t(`BR.Tipo.${k}`), hint: t(`BR.Tipo.${k}Hint`) }))
    };
  }

  static #goTab(event, target) { this.#tab = target.dataset.tab; this.render(); }
  static async #reload() { ReglasApp.#book = undefined; this.render(); }
}
