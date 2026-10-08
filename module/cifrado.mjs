/**
 * Cifrado de la libreta secreta del Director.
 *
 * Foundry envía a TODOS los clientes todos los documentos del mundo (los permisos solo ocultan la entrada
 * en la interfaz), así que un secreto «por permisos» se lee desde la consola. La libreta se guarda cifrada
 * y la clave vive solo en el navegador del Director (ajuste de cliente).
 *
 * ChaCha20 (RFC 8439) en JavaScript puro: no depende de `crypto.subtle`, que no existe sin HTTPS
 * (muchas mesas de Foundry van por http). Confidencialidad frente a quien mira los datos del mundo; no es
 * una defensa contra quien manipula el navegador del propio Director.
 */
const rotl = (v, c) => (v << c) | (v >>> (32 - c));

function quarter(s, a, b, c, d) {
  s[a] = (s[a] + s[b]) >>> 0; s[d] = rotl(s[d] ^ s[a], 16) >>> 0;
  s[c] = (s[c] + s[d]) >>> 0; s[b] = rotl(s[b] ^ s[c], 12) >>> 0;
  s[a] = (s[a] + s[b]) >>> 0; s[d] = rotl(s[d] ^ s[a], 8) >>> 0;
  s[c] = (s[c] + s[d]) >>> 0; s[b] = rotl(s[b] ^ s[c], 7) >>> 0;
}

const word = (bytes, i) => (bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24)) >>> 0;

function block(key, counter, nonce) {
  const init = new Uint32Array(16);
  init.set([0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]);
  for (let i = 0; i < 8; i++) init[4 + i] = word(key, i * 4);
  init[12] = counter >>> 0;
  for (let i = 0; i < 3; i++) init[13 + i] = word(nonce, i * 4);
  const s = Uint32Array.from(init);
  for (let r = 0; r < 10; r++) {
    quarter(s, 0, 4, 8, 12); quarter(s, 1, 5, 9, 13); quarter(s, 2, 6, 10, 14); quarter(s, 3, 7, 11, 15);
    quarter(s, 0, 5, 10, 15); quarter(s, 1, 6, 11, 12); quarter(s, 2, 7, 8, 13); quarter(s, 3, 4, 9, 14);
  }
  const out = new Uint8Array(64);
  for (let i = 0; i < 16; i++) { const v = (s[i] + init[i]) >>> 0; out[i * 4] = v; out[i * 4 + 1] = v >>> 8; out[i * 4 + 2] = v >>> 16; out[i * 4 + 3] = v >>> 24; }
  return out;
}

/** XOR con el flujo de ChaCha20. `counter` empieza en 1 como en el RFC. Simétrica: cifra y descifra. */
export function chacha20(key, nonce, data, counter = 1) {
  if (key.length !== 32 || nonce.length !== 12) throw new RangeError("clave de 32 bytes y nonce de 12");
  const out = new Uint8Array(data.length);
  for (let off = 0; off < data.length; off += 64, counter++) {
    const ks = block(key, counter, nonce);
    for (let i = 0; i < 64 && off + i < data.length; i++) out[off + i] = data[off + i] ^ ks[i];
  }
  return out;
}

export const toB64 = bytes => { let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };
export const fromB64 = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));
const random = n => globalThis.crypto.getRandomValues(new Uint8Array(n));
const MAGIC = "BR1:";

/** Clave nueva (32 bytes aleatorios) en base64. */
export const newKey = () => toB64(random(32));
export const validKey = k => { try { return fromB64(String(k).trim()).length === 32; } catch { return false; } };

/** Cifra un objeto. Devuelve `v1.<nonce>.<datos>` en base64. */
export function seal(obj, b64key) {
  const nonce = random(12);
  const plain = new TextEncoder().encode(MAGIC + JSON.stringify(obj));
  return `v1.${toB64(nonce)}.${toB64(chacha20(fromB64(b64key.trim()), nonce, plain))}`;
}

/** Descifra; lanza si la clave es incorrecta o el contenido está dañado. */
export function open(blob, b64key) {
  const [v, n, c] = String(blob).split(".");
  if (v !== "v1" || !n || !c) throw new Error("formato desconocido");
  const text = new TextDecoder().decode(chacha20(fromB64(b64key.trim()), fromB64(n), fromB64(c)));
  if (!text.startsWith(MAGIC)) throw new Error("clave incorrecta");
  return JSON.parse(text.slice(MAGIC.length));
}
