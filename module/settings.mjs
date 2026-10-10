import { SYSTEM_ID } from "./constants.mjs";

export const INKS = { soft: "#e8e2d4", paper: "#f2ede1", pearl: "#dfe3e8", amber: "#ecc98f", mint: "#cfe3d5" };

/** Preferencias de lectura y accesibilidad: [ajuste, clase en <html>]. Solo afectan a ventanas del sistema. */
const CLASS_TOGGLES = [
  ["darkMode", "br-dark"], ["readingMode", "br-reading"], ["plainFont", "br-plain-font"], ["wideSpacing", "br-wide-spacing"],
  ["highContrast", "br-high-contrast"], ["reducedMotion", "br-reduced-motion"], ["reducedEffects", "br-reduced-effects"],
  ["largeButtons", "br-large-buttons"], ["mesaMadera", "br-madera"]
];

export const ACCESS_DEFAULTS = Object.freeze({
  textScale: 1, readingInk: "soft", darkMode: false, readingMode: false, plainFont: false, wideSpacing: false, highContrast: false,
  reducedMotion: false, reducedEffects: false, largeButtons: false, mesaMadera: false, soundFx: true, music: true,
  sfxVolume: 0.6, ambientVolume: 0.35, musicVolume: 0.4
});

export const get = key => game.settings.get(SYSTEM_ID, key);
export const set = (key, value) => game.settings.set(SYSTEM_ID, key, value);

export function registerSettings() {
  const client = (key, data) => game.settings.register(SYSTEM_ID, key, { scope: "client", config: false, onChange: applyPreferences, ...data });
  const world = (key, data) => game.settings.register(SYSTEM_ID, key, { scope: "world", config: false, ...data });
  for (const [key, value] of Object.entries(ACCESS_DEFAULTS)) client(key, { type: typeof value === "boolean" ? Boolean : typeof value === "number" ? Number : String, default: value });

  client("cardFace", { type: String, default: "engraved" });
  // Mesa a pantalla completa: modo (auto | pantalla | ventana) y si está oculta. Preferencias de este navegador.
  client("mesaModo", { type: String, default: "auto" });
  client("mesaOculta", { type: Boolean, default: false });
  game.settings.register(SYSTEM_ID, "tutorialOfrecido", { scope: "client", config: false, type: Boolean, default: false });
  // Clave de la libreta secreta: solo en este navegador. Sin onChange: no es una preferencia visual.
  game.settings.register(SYSTEM_ID, "secretKey", { scope: "client", config: false, type: String, default: "" });

  // Única vía para abrir la Mesa al entrar: una preferencia explícita del usuario, apagada por defecto.
  game.settings.register(SYSTEM_ID, "openOnStart", {
    name: "BR.Settings.OpenOnStart", hint: "BR.Settings.OpenOnStartHint", scope: "client", config: true, type: Boolean, default: false
  });
  world("welcomeHidden", { type: Boolean, default: false });
  world("sceneReady", { type: Boolean, default: false });
  world("migratedVersion", { type: String, default: "" });
}

/** Foundry construye una ventana nueva por clic; el proxy reutiliza la única instancia del sistema. */
const menuProxy = App => class extends App { render() { return App.open(); } };

/** Menús en Configurar ajustes. Se registran aparte porque dependen de las clases de las apps. */
export function registerMenus({ AccessPanel, DiagnosticApp, TutorialLauncher }) {
  game.settings.registerMenu(SYSTEM_ID, "accessMenu", {
    name: "BR.Access.Title", label: "BR.Access.Open", hint: "BR.Access.Intro",
    icon: "fa-solid fa-universal-access", type: menuProxy(AccessPanel), restricted: false
  });
  game.settings.registerMenu(SYSTEM_ID, "tutorialMenu", {
    name: "BR.Tutorial.Title", label: "BR.Tutorial.Open", hint: "BR.Tutorial.Hint",
    icon: "fa-solid fa-graduation-cap", type: menuProxy(TutorialLauncher), restricted: false
  });
  game.settings.registerMenu(SYSTEM_ID, "diagnosticMenu", {
    name: "BR.Diagnostic.Title", label: "BR.Diagnostic.Open", hint: "BR.Diagnostic.Hint",
    icon: "fa-solid fa-stethoscope", type: menuProxy(DiagnosticApp), restricted: false
  });
}

export function applyPreferences() {
  const root = document.documentElement;
  root.style.setProperty("--br-text-scale", Math.clamp(Number(get("textScale")) || 1, 0.85, 1.6));
  root.style.setProperty("--br-reading-ink", INKS[get("readingInk")] ?? INKS.soft);
  for (const [setting, cls] of CLASS_TOGGLES) root.classList.toggle(cls, Boolean(get(setting)));
  // El sistema operativo también manda: si pide menos movimiento, se respeta aunque el ajuste esté apagado.
  if (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) root.classList.add("br-reduced-motion");
  Hooks.callAll("mrBrPreferences");
}

export const reducedMotion = () => document.documentElement.classList.contains("br-reduced-motion");
export const reducedEffects = () => reducedMotion() || Boolean(get("reducedEffects"));
