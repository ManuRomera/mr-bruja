import { ActorSheetV2, HandlebarsApplicationMixin } from "../compat.mjs";
import { WithMemory } from "../memory.mjs";
import { ASSETS, TEMPLATES } from "../constants.mjs";
import { GameService } from "../services/game.mjs";
import { openApp } from "../apps/registry.mjs";

/** Ficha de la bruja: quién es, su rasgo y su bolsa. Sirve para reutilizarla entre partidas. */
export class BrujaSheet extends WithMemory(HandlebarsApplicationMixin(ActorSheetV2)) {
  static DEFAULT_OPTIONS = {
    classes: ["mr-br", "br-window", "br-sheet", "br-paper-window"], form: { submitOnChange: true },
    position: { width: 560, height: 640 }, window: { resizable: true, icon: "fa-solid fa-hat-wizard" },
    actions: { choza: () => openApp("choza"), access: () => openApp("access"), sit: BrujaSheet.#sit }
  };
  static PARTS = { sheet: { template: `${TEMPLATES}/sheets/bruja.hbs`, scrollable: [".br-sheet-body"] } };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document, s = actor.system, state = GameService.state();
    const here = state?.asientos.bruja.actorUuid === actor.uuid;
    return {
      ...context, actor, system: s, editable: this.isEditable, portrait: actor.img && !actor.img.includes("mystery-man") ? actor.img : ASSETS.portrait.bruja,
      bagLabels: ["orientar", "cambiar", "comer"].map(c => ({ label: game.i18n.localize(`BR.Bag.${c}`) })),
      here, canSit: Boolean(state) && state.fase === "preparacion" && this.isEditable
    };
  }

  /** Lleva esta bruja a la mesa: copia su perfil al estado de la partida y ocupa el asiento. */
  static async #sit() {
    const a = this.document, s = a.system;
    await GameService.dispatch({ type: "asiento.tomar", rol: "bruja", userId: game.user.id, user: game.user.name, actorUuid: a.uuid });
    await GameService.dispatch({ type: "bruja.perfil", nombre: a.name, apodo: s.apodo, rasgo: s.rasgo, bolsa: s.bolsa.map(o => ({ nombre: o.nombre, detalle: o.detalle })) });
    openApp("choza");
  }
}
