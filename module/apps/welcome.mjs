import { ASSETS, SYSTEM_ID, TEMPLATES } from "../constants.mjs";
import { SystemApp } from "./base.mjs";
import { openApp } from "./registry.mjs";

/** Aviso pequeño de primer inicio para el Director. Nunca a pantalla completa. */
export class WelcomeApp extends SystemApp {
  static MEMORY = "welcome";
  static MEMORY_FIELDS = ["left", "top"];
  static DEFAULT_OPTIONS = {
    id: "br-welcome", classes: ["br-welcome-app"],
    window: { title: "BR.Welcome.Title", icon: "fa-solid fa-hat-wizard", resizable: false },
    position: { width: 460, height: "auto" },
    actions: { go: WelcomeApp.#go, hide: WelcomeApp.#hide, tutorial: () => openApp("tutorial") }
  };
  static PARTS = { body: { template: `${TEMPLATES}/apps/welcome.hbs` } };

  static maybeShow() { if (game.user.isGM && !game.settings.get(SYSTEM_ID, "welcomeHidden")) this.open(); }
  async _prepareContext() { return { cover: ASSETS.cover }; }

  static #go(event, target) { openApp(target.dataset.app); this.close(); }
  static async #hide() { await game.settings.set(SYSTEM_ID, "welcomeHidden", true); this.close(); }
}
