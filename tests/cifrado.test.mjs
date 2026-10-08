import test from "node:test";
import assert from "node:assert/strict";
import { chacha20, fromB64, newKey, open, seal, toB64, validKey } from "../module/cifrado.mjs";

const hex = b => [...b].map(x => x.toString(16).padStart(2, "0")).join("");

test("ChaCha20: vector de prueba del RFC 8439 §2.4.2", () => {
  const key = Uint8Array.from({ length: 32 }, (_, i) => i);
  const nonce = Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0x4a, 0, 0, 0, 0]);
  const plain = new TextEncoder().encode("Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.");
  const out = chacha20(key, nonce, plain, 1);
  assert.equal(hex(out.subarray(0, 16)), "6e2e359a2568f98041ba0728dd0d6981");
  assert.deepEqual(chacha20(key, nonce, out, 1), plain);
});

test("seal/open: ida y vuelta con tildes y objetos anidados", () => {
  const key = newKey();
  const data = { textos: { c1: "La lechuza que la acompaña — ¡mal augurio!" }, pnj: [{ nombre: "Ruperto", nota: "ñ" }] };
  assert.deepEqual(open(seal(data, key), key), data);
});

test("el texto cifrado no contiene el texto plano y cambia en cada escritura", () => {
  const key = newKey(), data = { textos: { c1: "secreto" } };
  const a = seal(data, key), b = seal(data, key);
  assert.doesNotMatch(a, /secreto/);
  assert.notEqual(a, b, "nonce nuevo cada vez");
});

test("con otra clave no se abre", () => {
  const blob = seal({ x: 1 }, newKey());
  assert.throws(() => open(blob, newKey()));
  assert.throws(() => open("basura", newKey()));
});

test("validKey acepta 32 bytes en base64 y rechaza el resto", () => {
  assert.equal(validKey(newKey()), true);
  assert.equal(validKey("corta"), false);
  assert.equal(validKey(toB64(new Uint8Array(16))), false);
  assert.equal(fromB64(newKey()).length, 32);
});

test("datos grandes (más de un bloque y de un trozo de base64)", () => {
  const key = newKey(), big = { t: "á".repeat(70000) };
  assert.deepEqual(open(seal(big, key), key), big);
});
