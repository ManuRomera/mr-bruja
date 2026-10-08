/**
 * Ambientación incluida: «Cuento de hadas». Texto original de este sistema (no es el de ningún libro).
 * Una ambientación es un dato: otros paquetes pueden registrar las suyas con `game.mrBruja.registerSetting`.
 * Cada texto es una cadena o `{ es, en }`.
 */
const L = (es, en) => ({ es, en });

export const CUENTO = Object.freeze({
  id: "cuento",
  name: L("Cuento de hadas", "Fairy tale"),
  tagline: L("Una vieja bruja, un bosque que ya no la teme y un camino hacia quien merezca su choza.", "An old witch, a forest that no longer fears her, and a road toward whoever deserves her hut."),
  where: L("Un reino de cuento, entre el bosque viejo y las aldeas de la ribera.", "A storybook kingdom between the old forest and the riverside villages."),
  places: [L("La choza del Bosque Hondo", "The hut in the Deep Wood"), L("La aldea de Valdeniebla", "The village of Mistvale"), L("El molino del río", "The river mill"), L("La ermita abandonada", "The abandoned hermitage"), L("El mercado de San Cirilo", "Saint Cyril's market")],
  people: [L("La molinera viuda", "The miller's widow"), L("El párroco Anselmo", "Father Anselm"), L("Una niña huérfana que habla con los gatos", "An orphan girl who talks to cats"), L("Ruperto, el cazador", "Rupert the hunter"), L("La reina de las hadas, que nunca da la cara", "The fairy queen, who never shows her face")],
  dangers: [L("Los lobos del invierno", "The winter wolves"), L("Un inquisidor con prisa", "An inquisitor in a hurry"), L("La niebla que se come los caminos", "The fog that eats the roads"), L("Una vecina que te debe un favor y te lo cobra", "A neighbour who owes you a favour and collects it"), L("Tu propio cuerpo, que ya no responde", "Your own body, which no longer obeys")],
  names: [L("Madre Aldonza", "Mother Aldonza"), L("Sabina la del Cuervo", "Sabine of the Raven"), L("Tía Ceferina", "Aunt Ceferina")],
  traits: [L("Manos nudosas que no tiemblan", "Knotted hands that never shake"), L("Voz ronca y ganas de contar historias", "A hoarse voice and a love of stories"), L("Dotes de partera", "A midwife's gift")],
  items: {
    orientar: [L("Un cuervo viejo y sin miedo", "An old, fearless raven"), L("Un hilo rojo que tira hacia el norte", "A red thread that pulls north"), L("Una linterna de cuerno que solo alumbra a quien busca", "A horn lantern that lights only those who seek")],
    cambiar: [L("Frascos de miel de brezo", "Jars of heather honey"), L("Ovillos de lana negra", "Skeins of black wool"), L("Un puñado de sal de las marismas", "A handful of marsh salt")],
    comer: [L("Pan duro y queso de cabra", "Hard bread and goat cheese"), L("Bayas que no salen en ningún libro", "Berries found in no book"), L("Una sopa que nunca se acaba", "A soup that never runs out")]
  },
  /** Chispas para el Director cuando anota una consecuencia (nunca se rellenan solas). */
  sparks: [L("Alguien sospecha de ti", "Someone suspects you"), L("Pierdes algo de la bolsa", "You lose something from the bag"), L("Una deuda con un espíritu", "A debt to a spirit"), L("Un animal te sigue y no sabes si ayuda", "An animal follows you; you can't tell if it helps"), L("Un rumor que te adelanta por el camino", "A rumour runs ahead of you on the road"), L("Una herida que no cierra", "A wound that won't close"), L("Un enemigo te reconoce", "An enemy recognises you"), L("Un objeto de la bolsa cambia", "An object in the bag changes"), L("Una promesa mal hecha", "A badly made promise")],
  /** Preguntas de planteamiento y de sesión cero. */
  questions: [L("¿Quién está en la escena?", "Who is in the scene?"), L("¿Dónde se encuentran?", "Where are they?"), L("¿Qué está sucediendo?", "What is happening?")]
});
