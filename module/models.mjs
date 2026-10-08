const f = foundry.data.fields;
const str = (initial = "") => new f.StringField({ required: true, nullable: false, blank: true, initial });

/**
 * Bruja: la ficha reutilizable de una bruja (nombre, rasgo y bolsa). El estado de la partida
 * (PD, consecuencias, herederas) vive en el diario de la partida, no aquí.
 */
export class BrujaModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      apodo: str(),
      rasgo: str(),
      bolsa: new f.ArrayField(new f.SchemaField({ cat: str(), nombre: str(), detalle: str() }), {
        initial: () => ["orientar", "cambiar", "comer"].map(cat => ({ cat, nombre: "", detalle: "" }))
      }),
      notas: new f.HTMLField({ required: true, nullable: false, blank: true, initial: "" })
    };
  }
}

export const DATA_MODELS = Object.freeze({ Actor: { bruja: BrujaModel }, Item: {} });
