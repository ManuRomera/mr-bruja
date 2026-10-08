/**
 * MR- Bruja — arranque.
 *
 * Regla de oro: el sistema nunca puede dejar Foundry inservible. Cada fase va aislada en `bootPhase`:
 * si falla, avisa, lo anota para el diagnóstico y el resto sigue. Nada se abre solo al entrar;
 * la Choza se abre a petición (o con el ajuste «Abrir la Choza al entrar»).
 */
import { DATA_MODELS } from "./module/models.mjs";
import { DocumentSheetConfig, addControlGroup, loadTemplates, welcomeSceneData } from "./module/compat.mjs";
import { ASSETS, LOG, SYSTEM_ID, TEMPLATES } from "./module/constants.mjs";
import { applyPreferences, registerMenus, registerSettings } from "./module/settings.mjs";
import { BOOT, bootPhase, diagnostic } from "./module/services/diagnostic.mjs";
import { BrujaSheet } from "./module/sheets/bruja.mjs";
import { Apps, openApp } from "./module/apps/registry.mjs";
import { ChozaApp } from "./module/apps/choza.mjs";
import { LibretaApp } from "./module/apps/libreta.mjs";
import { GrimorioApp } from "./module/apps/grimorio.mjs";
import { ReglasApp } from "./module/apps/reglas.mjs";
import { AccessPanel } from "./module/apps/access.mjs";
import { SafetyPanel } from "./module/apps/safety.mjs";
import { WelcomeApp } from "./module/apps/welcome.mjs";
import { DiagnosticApp } from "./module/apps/diagnostic.mjs";
import { GameService, registerSetting } from "./module/services/game.mjs";
import { SoundService } from "./module/services/sound.mjs";

const TEMPLATE_FILES = [
  "apps/choza.hbs", "apps/libreta.hbs", "apps/grimorio.hbs", "apps/reglas.hbs", "apps/access.hbs", "apps/safety.hbs", "apps/welcome.hbs", "apps/diagnostic.hbs",
  "sheets/bruja.hbs", "partials/prep.hbs", "partials/juego.hbs", "partials/fin.hbs", "partials/lados.hbs"
].map(p => `${TEMPLATES}/${p}`);

/* -------------------------------------------- */
/*  init                                        */
/* -------------------------------------------- */

Hooks.once("init", () => {
  console.info(`${LOG} ${game.system.version} · inicializando`);

  bootPhase("models", () => { Object.assign(CONFIG.Actor.dataModels, DATA_MODELS.Actor); });

  bootPhase("settings", () => {
    registerSettings();
    registerMenus({ AccessPanel, DiagnosticApp });
  });

  bootPhase("sheets", () => {
    DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, BrujaSheet, { types: ["bruja"], makeDefault: true, label: "BR.Sheet.Bruja" });
  });

  bootPhase("templates", () => {
    Handlebars.registerHelper("eq", (a, b) => a === b);
    return loadTemplates(TEMPLATE_FILES);
  });

  bootPhase("apps", () => {
    Object.assign(Apps, { choza: ChozaApp, notebook: LibretaApp, grimoire: GrimorioApp, rules: ReglasApp, access: AccessPanel, safety: SafetyPanel, welcome: WelcomeApp, diagnostic: DiagnosticApp });
    game.keybindings.register(SYSTEM_ID, "openChoza", {
      name: "BR.Keys.Choza", hint: "BR.Keys.ChozaHint",
      editable: [{ key: "KeyB", modifiers: ["Alt"] }],
      onDown: () => { openApp("choza"); return true; }
    });
  });

  bootPhase("api", () => {
    game.mrBruja = Object.freeze({
      open: () => openApp("choza"), choza: () => openApp("choza"), notebook: () => openApp("notebook"), grimoire: () => openApp("grimoire"), rules: () => openApp("rules"),
      safety: () => openApp("safety"), access: () => openApp("access"),
      state: () => GameService.state(), registerSetting, settings: () => GameService.settings().map(s => s.id),
      /** Informe copiable. `game.mrBruja.diagnostic({ show: true })` abre la ventana. */
      diagnostic: async ({ show = false } = {}) => {
        const report = await diagnostic();
        console.info(`${LOG} diagnóstico`, report);
        if (show) openApp("diagnostic");
        return report;
      },
      boot: BOOT
    });
  });
});

/* -------------------------------------------- */
/*  ready                                       */
/* -------------------------------------------- */

Hooks.once("ready", async () => {
  bootPhase("preferences", applyPreferences);
  bootPhase("sound", () => SoundService.init());
  bootPhase("safety", () => SafetyPanel.init());
  bootPhase("live", () => { ChozaApp.init(); LibretaApp.init(); GrimorioApp.init(); });

  if (game.user.isGM) {
    await bootPhase("game", () => GameService.ensure());
    await bootPhase("scene", ensureScene);
  }
  await bootPhase("secret", () => GameService.init());

  console.info(`${LOG} listo · Foundry ${game.version}`, BOOT.errors.length ? BOOT.errors : "sin errores");
  if (game.user.isGM) bootPhase("welcome", () => WelcomeApp.maybeShow());
  if (game.settings.get(SYSTEM_ID, "openOnStart")) bootPhase("openOnStart", () => openApp("choza"));
});

/**
 * Un mundo nuevo no debe quedarse vacío: se crea una escena de bienvenida una sola vez, sin abrir ventanas.
 * Foundry 13 crea su propia escena de bienvenida (NUEDEFAULTSCENE0); si es la única, se sustituye como activa.
 */
async function ensureScene() {
  if (game.settings.get(SYSTEM_ID, "sceneReady")) return;
  const onlyCoreDefault = game.scenes.size === 1 && game.scenes.has("NUEDEFAULTSCENE0");
  if (game.scenes.size && !onlyCoreDefault) return game.settings.set(SYSTEM_ID, "sceneReady", true);
  const scene = await Scene.implementation.create(welcomeSceneData({ name: game.i18n.localize("BR.App.Choza"), src: ASSETS.place["bosque-noche"] }));
  if (scene && !scene.active) await scene.activate();
  await scene?.view();
  await game.settings.set(SYSTEM_ID, "sceneReady", true);
}

/* -------------------------------------------- */
/*  Accesos visibles                            */
/* -------------------------------------------- */

Hooks.on("getSceneControlButtons", controls => {
  try {
    const t = k => game.i18n.localize(k);
    addControlGroup(controls, {
      name: "br", title: "MR- Bruja", icon: "fa-solid fa-hat-wizard",
      tools: [
        { name: "brChoza", title: t("BR.App.Choza"), icon: "fa-solid fa-hat-wizard", onChange: () => openApp("choza") },
        { name: "brNotebook", title: t("BR.App.Notebook"), icon: "fa-solid fa-book", onChange: () => openApp("notebook") },
        { name: "brGrimoire", title: t("BR.App.Grimoire"), icon: "fa-solid fa-book-open", onChange: () => openApp("grimoire") },
        { name: "brRules", title: t("BR.App.Rules"), icon: "fa-solid fa-circle-question", onChange: () => openApp("rules") },
        { name: "brSafety", title: t("BR.App.Safety"), icon: "fa-solid fa-shield-heart", onChange: () => openApp("safety") }
      ]
    });
  } catch (error) { console.error(`${LOG} controles de escena`, error); }
});

/** Botonera propia en el directorio de Actores. */
Hooks.on("renderActorDirectory", (app, html) => {
  try {
    const el = html instanceof HTMLElement ? html : html?.[0];
    if (!el || el.querySelector(".br-directory-actions")) return;
    const bar = document.createElement("div");
    bar.className = "br-directory-actions";
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = `<i class="fa-solid fa-hat-wizard" aria-hidden="true"></i> ${foundry.utils.escapeHTML(game.i18n.localize("BR.App.Choza"))}`;
    b.addEventListener("click", () => openApp("choza"));
    bar.append(b);
    (el.querySelector(".directory-header") ?? el).append(bar);
  } catch (error) { console.error(`${LOG} directorio de actores`, error); }
});

/** Los diarios que guardan la partida y la libreta son del sistema: los jugadores no tienen por qué verlos en la barra lateral. */
Hooks.on("renderJournalDirectory", (app, html) => {
  try {
    if (game.user.isGM) return;
    const el = html instanceof HTMLElement ? html : html?.[0], id = GameService.doc()?.id;
    if (el && id) el.querySelector(`[data-entry-id="${id}"]`)?.remove();
  } catch (error) { console.error(`${LOG} directorio de diarios`, error); }
});

Hooks.on("renderSettings", (app, html) => {
  try {
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root || root.querySelector(".br-settings-block")) return;
    const block = document.createElement("section");
    block.className = "br-settings-block";
    block.innerHTML = `<h4 class="divider">MR- Bruja</h4>`;
    for (const [label, icon, name] of [["BR.App.Choza", "fa-hat-wizard", "choza"], ["BR.Access.Title", "fa-universal-access", "access"], ["BR.Diagnostic.Title", "fa-stethoscope", "diagnostic"]]) {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i> ${foundry.utils.escapeHTML(game.i18n.localize(label))}`;
      b.addEventListener("click", () => openApp(name));
      block.append(b);
    }
    (root.querySelector("section.settings, .settings") ?? root.querySelector("section") ?? root).prepend(block);
  } catch (error) { console.error(`${LOG} ajustes`, error); }
});
