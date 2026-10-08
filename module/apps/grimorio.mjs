import { FLAGS, SYSTEM_ID, TEMPLATES } from "../constants.mjs";
import { SystemApp, t } from "./base.mjs";
import { buildGrimorio } from "../services/grimorio.mjs";
import { GameService } from "../services/game.mjs";
import { openApp } from "./registry.mjs";

/** El Grimorio: la historia de la bruja. Se puede copiar, descargar como página limpia o guardar en los Diarios. */
export class GrimorioApp extends SystemApp {
  static MEMORY = "grimoire";
  static SCROLL_MEMORY = [".br-grim"];
  static DEFAULT_OPTIONS = {
    id: "br-grimoire", classes: ["br-grimoire-app", "br-paper-window"],
    window: { title: "BR.App.Grimoire", icon: "fa-solid fa-book-open" }, position: { width: 740, height: 760 },
    actions: { access: () => openApp("access"), copy: GrimorioApp.#copy, download: GrimorioApp.#download, save: GrimorioApp.#save }
  };
  static PARTS = { body: { template: `${TEMPLATES}/apps/grimorio.hbs`, scrollable: [".br-grim"] } };

  static init() { Hooks.on("updateJournalEntry", doc => { if (doc.id === GameService.doc()?.id) GrimorioApp.instance?.render(); }); }

  async _prepareContext() {
    const g = buildGrimorio();
    return { empty: !g || !GameService.state().historial.length, title: g?.title, html: g?.html, gm: game.user.isGM };
  }

  static async #copy() {
    const g = buildGrimorio(); if (!g) return;
    try { await navigator.clipboard.writeText(g.text); ui.notifications.info(t("BR.Grimoire.Copied")); }
    catch { ui.notifications.warn(t("BR.Grimoire.CopyFail")); }
  }

  static #download() {
    const g = buildGrimorio(); if (!g) return;
    const css = "body{font:17px/1.7 Georgia,serif;max-width:720px;margin:2.5rem auto;padding:0 1.2rem;background:#e8dec3;color:#1b1612}h1{font-weight:400;letter-spacing:.04em;text-align:center}h2{margin-top:2.2rem;border-bottom:1px solid #8e2231;padding-bottom:.2rem;font-weight:400;letter-spacing:.08em}h3{margin:1.4rem 0 .2rem;font-weight:600}.br-grim-head img{width:100%;height:auto;opacity:.85}.br-grim-sub,.br-grim-foot{text-align:center;color:#555}.br-grim-roll{font-style:italic}.br-grim-event{color:#6b4a2b;font-size:.95em}.br-grim-verdict{font-size:1.2em;text-align:center;margin-top:2rem}.br-grim-foot{margin-top:3rem;font-size:.8em}.br-dot{display:inline-block;width:.7em;height:.7em;border-radius:50%;background:var(--c);margin-right:.4em}";
    const html = `<!doctype html><html lang="${game.i18n.lang}"><meta charset="utf-8"><title>${foundry.utils.escapeHTML(g.title)}</title><style>${css}</style><body>${g.html.replace(/src="systems\//g, `src="${location.origin}/systems/`)}</body></html>`;
    foundry.utils.saveDataToFile(html, "text/html", `grimorio-${game.world.id}.html`);
  }

  static async #save() {
    if (!game.user.isGM) return;
    const g = buildGrimorio(); if (!g) return;
    const entry = await JournalEntry.implementation.create({
      name: g.title, flags: { [SYSTEM_ID]: { [FLAGS.GRIMORIO]: true } },
      pages: [{ name: g.title, type: "text", text: { format: 1, content: g.html } }]
    });
    ui.notifications.info(game.i18n.format("BR.Grimoire.Saved", { name: entry.name }));
    entry.sheet.render(true);
  }
}
