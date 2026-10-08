/**
 * Estructura del paquete: archivos, plantillas, claves de idioma, rutas de arte, accesibilidad
 * y que el estado público nunca lleve secretos.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { ASSETS, PATH } from "../module/constants.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = p => readFileSync(join(root, p), "utf8");
const walk = dir => readdirSync(join(root, dir)).flatMap(n => {
  const p = join(dir, n);
  return statSync(join(root, p)).isDirectory() ? walk(p) : [p];
});
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => typeof v === "object" ? flat(v, `${p}${k}.`) : [`${p}${k}`]);
const flatAssets = o => typeof o === "string" ? [o] : Object.values(o).flatMap(flatAssets);

test("system.json: id, archivos y manifiesto coherentes", () => {
  const s = JSON.parse(read("system.json"));
  assert.equal(s.id, "mr-bruja");
  assert.match(s.title, /^MR- /);
  for (const m of s.esmodules) assert.ok(existsSync(join(root, m)), m);
  for (const m of s.styles) assert.ok(existsSync(join(root, m)), m);
  for (const l of s.languages) assert.ok(existsSync(join(root, l.path)), l.path);
  assert.match(s.manifest, /releases\/latest\/download\/system\.json$/);
  assert.ok(s.documentTypes.Actor.bruja);
});

test("todas las rutas de arte existen", () => {
  const missing = flatAssets(ASSETS).filter(p => !existsSync(join(root, p.replace(`${PATH}/`, ""))));
  assert.deepEqual(missing, []);
});

test("las plantillas que carga el arranque existen y las parciales referenciadas también", () => {
  const entry = read("mr-bruja.mjs");
  const list = [...entry.slice(entry.indexOf("TEMPLATE_FILES"), entry.indexOf("].map")).matchAll(/"([^"]+\.hbs)"/g)].map(m => m[1]);
  assert.ok(list.length >= 10);
  for (const t of list) assert.ok(existsSync(join(root, "templates", t)), t);
  for (const f of walk("templates")) for (const m of read(f).matchAll(/\{\{>\s*"systems\/mr-bruja\/([^"]+)"/g)) assert.ok(existsSync(join(root, m[1])), `${f} → ${m[1]}`);
});

test("español e inglés tienen exactamente las mismas claves", () => {
  const es = flat(JSON.parse(read("lang/es.json"))), en = flat(JSON.parse(read("lang/en.json")));
  assert.deepEqual(es.filter(k => !en.includes(k)), []);
  assert.deepEqual(en.filter(k => !es.includes(k)), []);
});

test("toda clave BR.* que usa el código o una plantilla está en el idioma", () => {
  const keys = new Set(flat(JSON.parse(read("lang/es.json"))));
  const missing = [];
  for (const f of [...walk("module"), ...walk("templates"), "mr-bruja.mjs"]) {
    for (const m of read(f).matchAll(/["`'](BR\.[A-Za-z0-9.]+)["`']/g)) {
      const k = m[1].replace(/^BR\./, "");
      if (!keys.has(`BR.${k}`)) missing.push(`${f}: ${m[1]}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("cada código de error del motor tiene su texto", () => {
  const es = JSON.parse(read("lang/es.json")).BR.Err;
  const src = read("module/motor.mjs");
  const codes = [...src.matchAll(/fallo\("([A-Z_]+)"\)/g)].map(m => m[1]);
  assert.ok(codes.length > 15);
  assert.deepEqual([...new Set(codes)].filter(c => !(c in es)), []);
});

test("las opciones de accesibilidad incluyen el modo oscuro, y el CSS lo implementa", () => {
  const access = read("module/apps/access.mjs"), settings = read("module/settings.mjs");
  assert.match(access, /TOGGLES = \["darkMode"/);
  assert.match(settings, /\["darkMode", "br-dark"\]/);
  assert.match(settings, /darkMode: false/);
  assert.match(read("styles/system.css"), /\.br-dark \.application\.mr-br\.br-paper-window \.window-content/);
  const es = JSON.parse(read("lang/es.json")).BR.Access;
  assert.ok(es.darkMode && es.darkModeHint);
});

test("las pestañas, ventanas y ajustes usan el prefijo br y nada de umu", () => {
  for (const f of [...walk("module"), ...walk("templates"), ...walk("styles"), "mr-bruja.mjs"]) {
    if (f.endsWith(".png")) continue;
    assert.doesNotMatch(read(f), /umu|Un momento único|samur/i, `${f} conserva restos de otro sistema`);
  }
});

test("el estado público y el diagnóstico nunca contienen el texto secreto", () => {
  const motor = read("module/motor.mjs"), diag = read("module/services/diagnostic.mjs");
  assert.doesNotMatch(motor, /textos|candidatas/);
  assert.doesNotMatch(diag, /secret\(\)|\.textos/);
  // Foundry envía todos los documentos a todos los clientes: el secreto va cifrado, nunca en claro.
  const game = read("module/services/game.mjs");
  assert.match(game, /seal\(data, key\)/);
  assert.doesNotMatch(game, /setFlag\(SYSTEM_ID, FLAGS\.SECRET, JSON\.stringify/);
  assert.match(read("module/settings.mjs"), /"secretKey", \{ scope: "client"/);
});

test("ningún chat ni notificación incluye el texto de una consecuencia", () => {
  for (const f of walk("module")) assert.doesNotMatch(read(f), /ChatMessage[\s\S]{0,200}textos/, f);
});

test("las fuentes del @font-face existen y llevan su licencia OFL", () => {
  const css = read("styles/system.css");
  const urls = [...css.matchAll(/@font-face[^}]*url\("\.\.\/(fonts\/[^"]+)"\)/g)].map(m => m[1]);
  assert.ok(urls.length >= 5);
  for (const u of urls) assert.ok(existsSync(join(root, u)), u);
  assert.match(read("fonts/OFL.txt"), /SIL OPEN FONT LICENSE Version 1\.1/);
});
