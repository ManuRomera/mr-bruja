import { apiReport, generation } from "../compat.mjs";
import { ASSETS, SYSTEM_ID } from "../constants.mjs";
import { GameService } from "./game.mjs";

/** Errores de arranque por fase. El arranque los anota aquí; el diagnóstico los muestra. */
export const BOOT = { phases: {}, errors: [] };

export function bootPhase(name, fn) {
  try {
    const result = fn();
    if (result instanceof Promise) return result.then(() => { BOOT.phases[name] = "ok"; }, error => fail(name, error));
    BOOT.phases[name] = "ok";
    return result;
  } catch (error) { fail(name, error); }
}

function fail(name, error) {
  BOOT.phases[name] = "error";
  BOOT.errors.push({ phase: name, message: error?.message ?? String(error) });
  console.error(`MR- Bruja | fase «${name}» falló; Foundry sigue operativo.`, error);
  try { ui.notifications?.error(game.i18n.format("BR.Error.Phase", { phase: name })); } catch {}
}

/** Comprueba que un archivo existe sin descargarlo entero. */
async function exists(src) {
  try { return (await fetch(src, { method: "HEAD", cache: "no-store" })).ok; } catch { return false; }
}
const flat = o => typeof o === "string" ? [o] : Object.values(o).flatMap(flat);

/** Estado completo del sistema en un objeto fácil de copiar. Nunca incluye el texto de la libreta secreta. */
export async function diagnostic({ assets = true } = {}) {
  const state = GameService.state();
  const paths = flat(ASSETS);
  const missing = assets ? (await Promise.all(paths.map(async p => [p, await exists(p)]))).filter(([, ok]) => !ok).map(([p]) => p) : null;
  return {
    system: game.system.version, foundry: game.version, generation: generation(), world: game.world.id,
    user: { gm: game.user.isGM, lang: game.i18n.lang, roles: GameService.myRoles() },
    apis: apiReport(), boot: BOOT,
    game: {
      document: Boolean(GameService.doc()), secretDocument: Boolean(GameService.secretDoc()), secretAccess: GameService.canSecret(), secretLock: GameService.lockReason(),
      phase: state?.fase ?? null, rev: state?.rev ?? null, setting: state?.ambientacion ?? null, scenes: state?.nEscenas ?? null
    },
    scenes: { total: game.scenes.size, active: game.scenes.active?.name ?? null },
    assets: missing ? { checked: paths.length, missing } : "sin comprobar",
    dice3d: Boolean(game.dice3d), settings: Object.fromEntries(["openOnStart", "soundFx", "reducedMotion", "darkMode"].map(k => [k, game.settings.get(SYSTEM_ID, k)]))
  };
}
