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

/* -------------------------------------------- */
/*  Tutorial guiado                             */
/* -------------------------------------------- */

const TOUR_KEYS = ["empezar", "mesa", "director"];
const lookup = (obj, path) => path.split(".").reduce((o, k) => o?.[k], obj);

test("los tres tours existen, con ids únicos y textos en español e inglés", () => {
  const es = JSON.parse(read("lang/es.json")), en = JSON.parse(read("lang/en.json"));
  for (const key of TOUR_KEYS) {
    const tour = JSON.parse(read(`tours/${key}.json`));
    assert.ok(tour.steps.length >= 6, key);
    const ids = tour.steps.map(s => s.id);
    assert.equal(new Set(ids).size, ids.length, `${key}: ids repetidos`);
    for (const k of [tour.title, tour.description, ...tour.steps.flatMap(s => [s.title, s.content])]) {
      for (const [name, lang] of [["es", es], ["en", en]]) assert.ok(String(lookup(lang, k) ?? "").length > 3, `${key}: falta ${k} en ${name}`);
    }
    for (const next of tour.suggestedNextTours) assert.ok(TOUR_KEYS.includes(next.replace("mr-bruja.", "")), `${key}: siguiente desconocido ${next}`);
  }
});

test("cada selector de un tour apunta a algo que existe en las plantillas o en el código", () => {
  const source = [...walk("templates"), ...walk("module")].map(read).join("\n");
  const missing = [];
  for (const key of TOUR_KEYS) {
    for (const step of JSON.parse(read(`tours/${key}.json`)).steps) {
      if (!step.selector) continue;
      for (const m of step.selector.matchAll(/\.(br-[a-z-]+)/g)) if (!source.includes(m[1])) missing.push(`${key}.${step.id}: clase ${m[1]}`);
      for (const m of step.selector.matchAll(/#(br-[a-z-]+)/g)) if (!source.includes(`"${m[1]}"`)) missing.push(`${key}.${step.id}: id ${m[1]}`);
      for (const m of step.selector.matchAll(/\[data-action=([A-Za-z]+)\]/g)) if (!source.includes(`data-action="${m[1]}"`)) missing.push(`${key}.${step.id}: acción ${m[1]}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("el tutorial se registra, se ofrece una sola vez y vive en Configuración", () => {
  const tutorial = read("module/tutorial.mjs"), settings = read("module/settings.mjs"), entry = read("mr-bruja.mjs");
  assert.match(tutorial, /game\.tours\.register\(SYSTEM_ID, clave/);
  assert.match(tutorial, /get\(SYSTEM_ID, "tutorialOfrecido"\)/);
  assert.match(settings, /registerMenu\(SYSTEM_ID, "tutorialMenu"/);
  assert.match(settings, /"tutorialOfrecido", \{ scope: "client"/);
  assert.match(entry, /registrarTutorial/);
  assert.match(tutorial, /_preStep[\s\S]*paso\.selector = ""/, "un selector inexistente no debe romper el tour");
  // Dialog: icono y etiqueta por separado
  assert.doesNotMatch(tutorial, /label:\s*["`'][^"`']*<i /);
});

test("la release empaqueta tours/, fuentes y arte, y CI lo comprueba", () => {
  assert.match(read("scripts/build.mjs"), /"tours"/);
  assert.match(read("scripts/build.mjs"), /"fonts"/);
  for (const wf of [".github/workflows/ci.yml", ".github/workflows/release.yml"]) assert.match(read(wf), /unzip -l dist\/mr-bruja\.zip/, wf);
});
