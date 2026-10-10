/**
 * La mesa a pantalla completa. La Choza deja de ser una ventana y ocupa toda la pantalla, por encima del lienzo
 * (z-index 20) y por debajo de los controles de Foundry (30) y de las ventanas (101): los controles siguen recibiendo
 * clics y el resto de la capa deja pasar el ratón. Aquí vive todo lo que no es de la propia aplicación:
 * qué modo toca, cuánto sitio ocupa la interfaz de Foundry, la pastilla para volver a mostrarla y que la escena
 * de fondo cubra la pantalla.
 */
import { LOG, SYSTEM_ID } from "./constants.mjs";
import { get } from "./settings.mjs";

/** Espacio útil mínimo (pantalla menos controles y barra lateral) para que la pantalla completa mejore a la ventana. */
export const MIN_ANCHO_UTIL = 1180;
export const MIN_ALTO_UTIL = 640;
/** Columna de controles de Foundry (izquierda) y barra de escenas (arriba): se dejan libres. */
const IZQ = 108, ARRIBA = 58;

/** Sitio que dejan la barra lateral (derecha) y las macros (abajo) ahora mismo. */
function huecos() {
  const rect = id => document.getElementById(id)?.getBoundingClientRect();
  const sb = rect("sidebar"), hb = rect("hotbar");
  return {
    der: sb?.width ? Math.round(window.innerWidth - sb.left + 12) : 56,
    abajo: hb?.height ? Math.max(Math.round(window.innerHeight - hb.top + 10), 96) : 124
  };
}

/** "pantalla" o "ventana". Ajuste `mesaModo`: auto (según el espacio útil), pantalla o ventana. */
export function modoMesa() {
  const m = get("mesaModo");
  if (m === "pantalla" || m === "ventana") return m;
  const { der, abajo } = huecos();
  return window.innerWidth - IZQ - der >= MIN_ANCHO_UTIL && window.innerHeight - ARRIBA - abajo >= MIN_ALTO_UTIL ? "pantalla" : "ventana";
}

/** Escribe en el elemento las cuatro variables con el sitio que dejan los controles de Foundry. */
export function medirInterfaz(el) {
  if (!el) return;
  const { der, abajo } = huecos();
  el.style.setProperty("--br-izq", `${IZQ}px`);
  el.style.setProperty("--br-arriba", `${ARRIBA}px`);
  el.style.setProperty("--br-der", `${der}px`);
  el.style.setProperty("--br-abajo", `${abajo}px`);
}

/** ¿Hay una escena con imagen de fondo que pueda verse detrás de la mesa? */
export function escenaTieneFondo() {
  const escena = globalThis.canvas?.scene ?? game.scenes?.viewed;
  return Boolean(escena?.background?.src || escena?.img);
}

let observador = null;
/** Mantiene las medidas al día cuando se abre o cierra la barra lateral o cambia el tamaño de la ventana. */
export function vigilarInterfaz(obtenerElemento) {
  const medir = () => medirInterfaz(obtenerElemento());
  observador?.disconnect();
  if (typeof ResizeObserver === "function") {
    observador = new ResizeObserver(medir);
    for (const id of ["sidebar", "hotbar"]) { const e = document.getElementById(id); if (e) observador.observe(e); }
  }
  window.addEventListener("resize", medir);
  Hooks.on("collapseSidebar", () => setTimeout(medir, 350));
  return medir;
}

/** Pastilla fija para recuperar la mesa cuando está oculta. */
export function pastilla({ visible, texto, alPulsar }) {
  let p = document.getElementById("br-pastilla");
  if (!visible) { p?.remove(); return; }
  if (!p) {
    p = document.createElement("button");
    p.id = "br-pastilla"; p.type = "button"; p.className = "br-pastilla";
    document.body.append(p);
  }
  p.innerHTML = `<i class="fa-solid fa-hat-wizard" aria-hidden="true"></i> ${foundry.utils.escapeHTML(texto)}`;
  p.onclick = alPulsar;
  const hb = document.getElementById("hotbar")?.getBoundingClientRect();
  p.style.bottom = `${hb?.height ? Math.round(window.innerHeight - hb.top + 12) : 130}px`;
}

/**
 * El fondo cubre toda la pantalla: Foundry ajusta la escena para que quepa entera y deja bandas si la pantalla
 * no es 16:9. Con la mesa oculta se ve la escena de bienvenida (marcada con `flags.mr-bruja.fondo`): se amplía lo
 * justo para taparlas.
 */
export function registrarCoberturaDeFondo() {
  const esNuestra = escena => Boolean(escena && (escena.getFlag(SYSTEM_ID, "fondo") || String(escena.background?.src ?? "").includes(`systems/${SYSTEM_ID}/`)));
  /** Encuadre que tapa toda la pantalla: centro de la escena y escala para cubrir. */
  const encuadre = lienzo => {
    const { width, height, x, y } = lienzo.dimensions.sceneRect, pantalla = lienzo.app.screen;
    return { x: x + width / 2, y: y + height / 2, scale: Math.max(pantalla.width / width, pantalla.height / height) };
  };
  let ajustando = false;
  const cubrir = lienzo => {
    try {
      if (!lienzo?.ready || !esNuestra(lienzo.scene) || ajustando) return;
      ajustando = true;
      Promise.resolve(lienzo.pan({ ...encuadre(lienzo), duration: 0 })).finally(() => { ajustando = false; });
    } catch (error) { ajustando = false; console.warn(`${LOG} cobertura del fondo`, error); }
  };
  // Foundry vuelve a encuadrar «para que quepa» tras cargar, y el ratón puede mover o ampliar el lienzo por debajo de la
  // mesa: se reaplica tras la carga y cada vez que el encuadre se aparta del que cubre.
  Hooks.on("canvasReady", lienzo => { for (const ms of [50, 400, 1200]) setTimeout(() => cubrir(lienzo), ms); });
  Hooks.on("canvasPan", (lienzo, pos) => {
    try {
      if (ajustando || !lienzo?.ready || !esNuestra(lienzo.scene)) return;
      const e = encuadre(lienzo);
      if (Math.abs(pos.scale - e.scale) > 0.001 || Math.abs(pos.x - e.x) > 1 || Math.abs(pos.y - e.y) > 1) cubrir(lienzo);
    } catch (error) { console.warn(`${LOG} cobertura del fondo`, error); }
  });
  window.addEventListener("resize", () => cubrir(globalThis.canvas));
  // El lienzo ya se dibujó antes de `ready`: el primer canvasReady se perdió, así que se aplica ahora.
  for (const ms of [0, 400, 1200]) setTimeout(() => cubrir(globalThis.canvas), ms);
}
