export { COSTE, REGLAS, TIPOS } from "./reglas.mjs";

export const SYSTEM_ID = "mr-bruja";
export const PATH = `systems/${SYSTEM_ID}`;
export const TEMPLATES = `${PATH}/templates`;
export const SOCKET = `system.${SYSTEM_ID}`;
export const LOG = "MR- Bruja |";

/** Dos documentos: la partida pública (OWNER para todos) y la libreta secreta del Director (solo ella/él y el GM). */
export const FLAGS = Object.freeze({ STATE: "game", SECRET: "secret", ROLE: "role", GRIMORIO: "grimorio" });
export const ROLE_PUBLIC = "public";
export const ROLE_SECRET = "secret";

/** Color de cada tipo de escena (carta, luz de la choza, sellos). Los mismos valores están en el CSS. */
export const COLOR = Object.freeze({ accion: "#8e2231", reaccion: "#2c4f8a", drama: "#c9a92b", monologo: "#6b4a2b", retrospeccion: "#3e7a4f" });
/** Ambiente sonoro de cada fase o tipo de escena (ver services/sound.mjs). */
export const AMBIENTE = Object.freeze({
  preparacion: "caldero", accion: "lobos", reaccion: "lluvia", drama: "campana", monologo: "lumbre", retrospeccion: "bosque",
  juego: "bosque", muerte: "silencio", epilogo: "bosque", fin: "silencio"
});

const art = p => `${PATH}/assets/art/${p}.webp`;
const TIPO = ["accion", "reaccion", "drama", "monologo", "retrospeccion"];
export const OBJETOS = Object.freeze(["sombrero", "rana", "calavera-libros", "gato-negro", "cuervo", "lapida", "llave-candado", "serpiente", "caldero",
  "escoba", "bolsa", "grimorio", "reloj-arena", "frasco", "luna-creciente", "lechuza", "setas", "vela"]);

/** Todas las rutas de arte en un único sitio. Sustituir un archivo con el mismo nombre basta para cambiar el arte. */
export const ASSETS = Object.freeze({
  cover: art("brand/cover"), logo: art("brand/logo"), icon: `${PATH}/assets/icon.svg`,
  portrait: { bruja: art("brand/portrait-bruja"), dj: art("brand/portrait-director"), heredera: art("brand/portrait-heredera"), pnj: art("brand/portrait-pnj") },
  place: Object.fromEntries(["choza-mesa", "bosque-noche", "camino-niebla", "claro-aquelarre", "aldea-lejos", "grimorio-header", "epilogo-bg", "muerte-bg"].map(k => [k, art(`places/${k}`)])),
  mood: Object.fromEntries(TIPO.map(t => [t, art(`moods/ambiente-${t}`)])),
  card: { engraved: Object.fromEntries(TIPO.map(t => [t, art(`cards/escena-${t}`)])), neutral: Object.fromEntries(TIPO.map(t => [t, art(`cards/neutra-${t}`)])), back: art("cards/reverso"), setting: art("cards/setting-cuento") },
  object: Object.fromEntries(OBJETOS.map(k => [k, art(`objects/${k}`)])),
  texture: Object.fromEntries(["papel-pergamino", "tela-azul-oro", "papel-mostaza", "madera-oscura", "grieta-oro"].map(k => [k, art(`textures/${k}`)])),
  extra: Object.fromEntries(["polilla", "pluma", "hoja-seca", "sello-cera"].map(k => [k, art(`extras/${k}`)]))
});
