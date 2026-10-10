/**
 * Tutorial guiado, con los «tours» de Foundry (foundry.nue.Tour), como el tutorial de bienvenida del propio Foundry.
 * Tres recorridos (tours/*.json, textos en lang/*.json bajo BR.Tour; se generan con scripts/gen-tours.py):
 *   empezar  → primeros pasos (preparación de la partida)
 *   mesa     → la mesa en juego (cartas, caldero, velas, puntos de drama)
 *   director → el Director y su libreta
 * Vive en Configuración → Tutorial guiado; no hay botón en la propia Choza.
 */
import { LOG, SYSTEM_ID } from "./constants.mjs";
import { SystemApp, t } from "./apps/base.mjs";
import { openApp } from "./apps/registry.mjs";
import { GameService } from "./services/game.mjs";
import { DialogV2 } from "./compat.mjs";

export const TOURS = Object.freeze(["empezar", "mesa", "director"].map(clave => ({ clave, ruta: `systems/${SYSTEM_ID}/tours/${clave}.json` })));

const esperar = ms => new Promise(r => setTimeout(r, ms));

/**
 * Preparación de cada paso (abrir una ventana…). Clave: `<tour>.<id del paso>`. Si falla, el tour sigue.
 * La libreta solo se abre para quien dirige: a los demás les saldría cerrada y el paso se muestra centrado.
 */
const ANTES = {
  "director.lista": async () => { if (GameService.isDirector()) { await openApp("notebook"); await esperar(700); } },
  "director.clave": async () => { if (GameService.isDirector()) { await openApp("notebook"); await esperar(300); } },
  "director.candidatas": async () => { if (GameService.isDirector()) { await openApp("notebook"); await esperar(300); } }
};

class TourBruja extends foundry.nue.Tour {
  /** Los tres recorridos empiezan con la Choza a la vista. */
  async start() {
    if (!document.getElementById("br-choza")) { await openApp("choza"); await esperar(900); }
    return super.start();
  }

  async _preStep() {
    await super._preStep();
    const paso = this.currentStep;
    try { await ANTES[`${this.id}.${paso.id}`]?.(); } catch (error) { console.warn(`${LOG} tutorial: no se pudo preparar «${paso.id}»`, error); }
    // Un elemento que no existe (p. ej. aún no hay escena abierta) no debe romper el tour: el paso sale centrado.
    if (paso.selector && !document.querySelector(paso.selector)) paso.selector = "";
  }
}

export async function registrarTutorial() {
  for (const { clave, ruta } of TOURS) {
    try { game.tours.register(SYSTEM_ID, clave, await TourBruja.fromJSON(ruta)); }
    catch (error) { console.error(`${LOG} no se pudo registrar el tour «${clave}»`, error); }
  }
}

/** Foundry solo admite un tour a la vez: se cierra el activo (p. ej. el de bienvenida) antes de empezar. */
export async function empezarTutorial(clave = TOURS[0].clave) {
  for (const tour of game.tours.values()) if (tour.status === "in-progress") { try { await tour.exit(); } catch {} }
  const tour = game.tours.get(`${SYSTEM_ID}.${clave}`);
  if (!tour) return ui.notifications.warn(`${LOG} tutorial no disponible: ${clave}`);
  await tour.reset();
  return tour.start();
}

/** Elegir un recorrido (menú de Configuración). */
export async function elegirTutorial() {
  const options = TOURS.map(({ clave }) => `<option value="${clave}">${foundry.utils.escapeHTML(t(`BR.Tour.${clave}.Title`))}</option>`).join("");
  const clave = await DialogV2.prompt({
    window: { title: t("BR.Tutorial.Title"), icon: "fa-solid fa-graduation-cap" },
    content: `<label><span>${foundry.utils.escapeHTML(t("BR.Tutorial.Menu"))}</span><select name="tour" style="width:100%">${options}</select></label><p style="opacity:.75;margin:.6em 0 0">${foundry.utils.escapeHTML(t("BR.Tutorial.MenuHint"))}</p>`,
    ok: { label: t("BR.Tutorial.Open"), icon: "fa-solid fa-graduation-cap", callback: (event, button) => button.form.elements.tour.value },
    rejectClose: false
  });
  if (clave) return empezarTutorial(clave);
}

/** Lanzador para el menú de Configuración (una ventana propia cuya apertura elige el recorrido). */
export class TutorialLauncher extends SystemApp {
  static open() { return elegirTutorial(); }
}

/** La primera vez que se abre la Choza se ofrece (una vez por navegador y mundo), como hace Foundry con el suyo. */
export async function ofrecerTutorial() {
  if (game.settings.get(SYSTEM_ID, "tutorialOfrecido")) return;
  await game.settings.set(SYSTEM_ID, "tutorialOfrecido", true);
  const quiere = await DialogV2.confirm({
    window: { title: t("BR.Tutorial.OfferTitle"), icon: "fa-solid fa-graduation-cap" },
    content: `<p>${foundry.utils.escapeHTML(t("BR.Tutorial.OfferText"))}</p>`,
    yes: { label: t("BR.Tutorial.OfferYes"), icon: "fa-solid fa-graduation-cap" },
    no: { label: t("BR.Tutorial.OfferNo") },
    rejectClose: false
  });
  if (quiere) empezarTutorial();
}
