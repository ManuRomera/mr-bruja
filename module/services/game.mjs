import { FLAGS, ROLE_PUBLIC, ROLE_SECRET, SYSTEM_ID } from "../constants.mjs";
import { MotorError, apply, newGame, rolesDe } from "../motor.mjs";
import { CUENTO } from "../data/cuento.mjs";
import { newKey, open, seal, validKey } from "../cifrado.mjs";

/** Una ambientación es un dato. Los módulos pueden registrar las suyas con `registerSetting`. */
const SETTINGS = new Map([[CUENTO.id, CUENTO]]);
const lang = () => (game.i18n?.lang ?? "es").startsWith("es") ? "es" : "en";
/** Texto localizado de un dato de ambientación: acepta una cadena o `{ es, en }`. */
export const loc = v => (v && typeof v === "object") ? (v[lang()] ?? v.en ?? v.es ?? "") : (v ?? "");

export function registerSetting(def) {
  const ok = def && typeof def.id === "string" && def.items && Array.isArray(def.names) && Array.isArray(def.traits);
  if (!ok) throw new Error("Ambientación inválida: se necesita id, names, traits e items.");
  SETTINGS.set(def.id, Object.freeze(def));
  Hooks.callAll("mrBrSettings", def);
  return def.id;
}

const EMPTY_SECRET = () => ({ textos: {}, candidatas: [], pnj: [] });
const OWNER = () => CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
const keySetting = () => game.settings.get(SYSTEM_ID, "secretKey");

/**
 * Dos documentos de diario:
 *  - la PARTIDA (pública): fase, escenas, PD, consecuencias (solo el número y su estado);
 *  - la LIBRETA del Director: el texto de cada consecuencia, las candidatas a heredera y los PNJ,
 *    guardada CIFRADA. Foundry envía todos los documentos a todos los clientes, así que los permisos no
 *    bastan: la clave vive solo en el navegador del Director (ajuste de cliente) y se puede copiar/importar.
 */
export class GameService {
  static #queue = Promise.resolve();
  /** Libreta descifrada en este navegador; `null` si está cerrada. */
  static #secret = null;
  static #locked = "none";   // "none" | "key" (hay libreta cifrada y falta la clave) | "role" (no eres el Director)

  static doc() { return game.journal?.find(j => j.getFlag(SYSTEM_ID, FLAGS.ROLE) === ROLE_PUBLIC) ?? null; }
  static secretDoc() { return game.journal?.find(j => j.getFlag(SYSTEM_ID, FLAGS.ROLE) === ROLE_SECRET) ?? null; }

  static state() {
    const raw = this.doc()?.getFlag(SYSTEM_ID, FLAGS.STATE);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
  /** Libreta descifrada, o `null` si este usuario no puede abrirla. */
  static secret() { return this.#secret; }
  static canSecret() { return this.#secret !== null; }
  /** Por qué está cerrada: "key" (falta la clave) o "role" (no ocupas el asiento del Director). */
  static lockReason() { return this.#locked; }

  static settingDef(id) { return SETTINGS.get(id) ?? CUENTO; }
  static settings() { return [...SETTINGS.values()]; }
  static setting() { return this.settingDef(this.state()?.ambientacion); }
  static myRoles() { const s = this.state(); return s ? rolesDe(s, game.user.id) : []; }
  static isDirector() { return game.user.isGM || this.myRoles().includes("dj"); }

  /** El GM crea los dos documentos una sola vez por mundo. La libreta es escribible por todos: su contenido va cifrado. */
  static async ensure() {
    if (!game.user.isGM) return;
    if (!this.doc()) {
      await JournalEntry.implementation.create({
        name: game.i18n.localize("BR.Game.DocName"), ownership: { default: OWNER() },
        flags: { [SYSTEM_ID]: { [FLAGS.ROLE]: ROLE_PUBLIC, [FLAGS.STATE]: JSON.stringify(newGame()) } }
      });
    }
    if (!this.secretDoc()) {
      await JournalEntry.implementation.create({
        name: game.i18n.localize("BR.Game.SecretName"), ownership: { default: OWNER() },
        flags: { [SYSTEM_ID]: { [FLAGS.ROLE]: ROLE_SECRET, [FLAGS.SECRET]: "" } }
      });
    }
  }

  static async #write(state) { await this.doc().setFlag(SYSTEM_ID, FLAGS.STATE, JSON.stringify(state)); }

  /** Aplica una acción al estado compartido. Se encolan para no pisarse; una regla rota avisa y no escribe nada. */
  static dispatch(action) {
    const run = this.#queue.then(async () => {
      const state = this.state();
      if (!state) { ui.notifications.warn(game.i18n.localize("BR.Game.NoDoc")); return null; }
      try {
        const next = apply(state, action);
        await this.#write(next);
        return next;
      } catch (error) {
        if (error instanceof MotorError) { ui.notifications.warn(game.i18n.localize(`BR.Err.${error.code}`)); return null; }
        throw error;
      }
    });
    this.#queue = run.catch(() => {});
    return run;
  }

  /* ---------- libreta secreta (cifrada) ---------- */

  static init() {
    Hooks.on("updateJournalEntry", doc => { if (doc.id === this.secretDoc()?.id || doc.id === this.doc()?.id) this.refreshSecret(); });
    Hooks.on("createJournalEntry", doc => { if (doc.id === this.secretDoc()?.id) this.refreshSecret(); });
    return this.refreshSecret();
  }

  /** Vuelve a descifrar la libreta con la clave de este navegador y avisa a las ventanas. */
  static async refreshSecret() {
    const d = this.secretDoc(), blob = d?.getFlag(SYSTEM_ID, FLAGS.SECRET) ?? "", key = keySetting();
    const director = this.isDirector();
    let next = null, why = "none";
    if (!d) { why = "role"; }
    else if (!director) why = "role";
    else if (!blob) next = EMPTY_SECRET();
    else if (!key) why = "key";
    else { try { next = { ...EMPTY_SECRET(), ...open(blob, key) }; } catch { why = "key"; } }
    const changed = JSON.stringify(next) !== JSON.stringify(this.#secret) || why !== this.#locked;
    this.#secret = next; this.#locked = why;
    if (changed) Hooks.callAll("mrBrSecret");
  }

  /** Escribe en la libreta con una función que modifica una copia. Solo el Director (o el GM con la clave). */
  static async editSecret(mutator) {
    const d = this.secretDoc();
    if (!d || this.#secret === null) { ui.notifications.warn(game.i18n.localize("BR.Secret.NoAccess")); return null; }
    let key = keySetting();
    if (!key) { key = newKey(); await game.settings.set(SYSTEM_ID, "secretKey", key); }
    const data = structuredClone(this.#secret);
    mutator(data);
    await d.setFlag(SYSTEM_ID, FLAGS.SECRET, seal(data, key));
    return data;
  }

  /** Clave de la libreta de este navegador (para copiarla a otro). Vacía si aún no hay. */
  static exportKey() { return keySetting(); }
  /** Importa una clave copiada de otro navegador y reabre la libreta. Devuelve si funcionó. */
  static async importKey(text) {
    const key = String(text ?? "").trim();
    if (!validKey(key)) return false;
    const blob = this.secretDoc()?.getFlag(SYSTEM_ID, FLAGS.SECRET);
    if (blob) { try { open(blob, key); } catch { return false; } }
    await game.settings.set(SYSTEM_ID, "secretKey", key);
    await this.refreshSecret();
    return true;
  }

  /** Consecuencias activas que todavía no tienen texto: el Director debe anotarlas. */
  static unwritten() {
    const st = this.state(), sec = this.secret();
    if (!st || !sec) return [];
    return st.consecuencias.filter(c => c.activa && !sec.textos[c.id]);
  }

  /** Partida nueva (solo GM). `keepSeats` conserva los asientos. Vacía también la libreta. */
  static async reset({ keepSeats = false } = {}) {
    if (!game.user.isGM) return;
    const old = this.state();
    const next = newGame({ ambientacion: old?.ambientacion ?? "cuento", ajustes: old?.ajustes });
    if (keepSeats && old) next.asientos = old.asientos;
    await this.#write(next);
    await this.secretDoc()?.setFlag(SYSTEM_ID, FLAGS.SECRET, "");
  }
}
