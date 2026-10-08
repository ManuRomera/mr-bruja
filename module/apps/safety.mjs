import { SOCKET, TEMPLATES } from "../constants.mjs";
import { SystemApp, t } from "./base.mjs";

const SIGNALS = {
  pause: { icon: "fa-pause", overlay: true },
  veil: { icon: "fa-eye-slash", overlay: false },
  x: { icon: "fa-xmark", overlay: true }
};

/**
 * Seguridad en mesa: Pausa, Velo y Tarjeta X. Inmediata y sincronizada.
 * El aviso nunca dice quién lo activó; la Tarjeta X no se registra en ningún sitio.
 */
export class SafetyPanel extends SystemApp {
  static MEMORY = "safety";
  static MEMORY_FIELDS = ["left", "top"];
  static DEFAULT_OPTIONS = {
    id: "br-safety", classes: ["br-safety-app"],
    window: { title: "BR.App.Safety", icon: "fa-solid fa-shield-heart", resizable: false },
    position: { width: 380, height: "auto" },
    actions: { signal: SafetyPanel.#signal }
  };
  static PARTS = { body: { template: `${TEMPLATES}/apps/safety.hbs` } };

  static init() {
    game.socket.on(SOCKET, data => {
      if (data?.type === "safety") this.show(data.signal);
      if (data?.type === "safety-clear") this.clear();
    });
  }

  static #signal(event, target) {
    const signal = target.dataset.signal;
    if (!SIGNALS[signal]) return;
    game.socket.emit(SOCKET, { type: "safety", signal });
    SafetyPanel.show(signal);
  }

  static clear() { document.querySelector(".br-safety-signal")?.remove(); }

  static show(signal) {
    const s = SIGNALS[signal]; if (!s) return;
    this.clear();
    const el = document.createElement("div");
    el.className = `mr-br br-safety-signal ${signal} ${s.overlay ? "overlay" : "banner"}`;
    el.setAttribute("role", "alertdialog");
    const key = { pause: "Pause", veil: "Veil", x: "X" }[signal];
    el.innerHTML = `<div class="br-safety-box"><i class="fa-solid ${s.icon}" aria-hidden="true"></i>
      <h2>${t(`BR.Safety.${key}`)}</h2><p>${t(`BR.Safety.${key}Text`)}</p>
      <button type="button">${t("BR.Safety.Continue")}</button></div>`;
    document.body.append(el);
    const button = el.querySelector("button");
    button.addEventListener("click", () => { game.socket.emit(SOCKET, { type: "safety-clear" }); this.clear(); });
    button.focus();
  }
}
