import { ASSETS, COLOR } from "../constants.mjs";
import { GameService, loc } from "./game.mjs";
import { totales } from "../motor.mjs";

const esc = v => foundry.utils.escapeHTML(String(v ?? ""));
const t = (k, d) => d ? game.i18n.format(k, d) : game.i18n.localize(k);
const para = text => text ? `<p class="br-hand">${esc(text).replace(/\n/g, "<br>")}</p>` : "";

/**
 * Compone el Grimorio: la historia jugada, escena a escena. Devuelve `{ title, html, text }`.
 * Todo texto escrito por los jugadores se escapa; el HTML es seguro para insertarlo tal cual.
 * Solo usa el estado PÚBLICO: las consecuencias solo aparecen si el Director las reveló.
 */
export function buildGrimorio(state = GameService.state()) {
  if (!state) return null;
  const def = GameService.settingDef(state.ambientacion), b = state.bruja, tot = totales(state);
  const title = t("BR.Grimoire.Heading", { name: b.nombre || t("BR.Grimoire.Nameless") });
  const out = [], text = [];
  const h = (tag, s) => { out.push(`<${tag}>${esc(s)}</${tag}>`); text.push(`\n${s}\n`); };
  const p = s => { if (!s) return; out.push(para(s)); text.push(s); };

  out.push(`<header class="br-grim-head"><img src="${esc(ASSETS.place["grimorio-header"])}" alt=""><h1>${esc(title)}</h1><p class="br-grim-sub">${esc(loc(def.name))}${b.apodo ? ` · «${esc(b.apodo)}»` : ""}</p></header>`);
  text.push(title.toUpperCase(), loc(def.name));

  h("h2", t("BR.Grimoire.Who"));
  if (b.rasgo) p(`${t("BR.Grimoire.Trait")}: ${b.rasgo}`);
  for (const o of b.bolsa) if (o.nombre) p(`${t(`BR.Bag.${o.cat}`)}: ${o.nombre}${o.detalle ? ` — ${o.detalle}` : ""}`);

  const escenas = state.historial.filter(x => x.k === "escena");
  h("h2", t("BR.Grimoire.Story"));
  for (const x of state.historial) {
    if (x.k === "escena") {
      out.push(`<h3 class="br-grim-scene" style="--c:${COLOR[x.tipo]}"><span class="br-dot" aria-hidden="true"></span>${esc(t("BR.Grimoire.Scene", { n: x.n, tipo: t(`BR.Tipo.${x.tipo}`) }))}${x.descanso ? ` · ${esc(t("BR.Grimoire.Rest"))}` : ""}</h3>`);
      text.push(`\n${t("BR.Grimoire.Scene", { n: x.n, tipo: t(`BR.Tipo.${x.tipo}`) })}`);
      p(x.planteo);
      if (x.uso) p(t("BR.Grimoire.Used", { what: x.uso.frase || t(`BR.Bag.${x.uso.que}`) }));
      if (x.tirada) {
        const line = t("BR.Grimoire.Roll", { dice: x.tirada.dados.join(" + "), total: x.tirada.total, nivel: t(`BR.Nivel.${x.tirada.nivel}`) });
        out.push(`<p class="br-grim-roll">${esc(line)}</p>`); text.push(line);
      }
      p(x.nota);
    } else if (x.k === "gasto") {
      const line = t(`BR.Grimoire.Spent.${x.clave}`, { name: x.nombre ?? "" });
      out.push(`<p class="br-grim-event"><i class="fa-solid fa-feather" aria-hidden="true"></i> ${esc(line)}</p>`); text.push(`· ${line}`);
    }
  }
  if (!escenas.length) p(t("BR.Grimoire.Empty"));

  const revealed = state.consecuencias.filter(c => c.revelada && c.texto);
  if (revealed.length && state.fase === "fin") {
    h("h2", t("BR.Grimoire.Secrets"));
    out.push(`<ul class="br-grim-list">${revealed.map(c => `<li>${esc(c.texto)}</li>`).join("")}</ul>`); text.push(...revealed.map(c => `· ${c.texto}`));
  }

  if (state.herederas.length) {
    h("h2", t("BR.Grimoire.Heirs"));
    out.push(`<ul class="br-grim-list">${state.herederas.map(x => `<li class="${x.elegida ? "chosen" : ""}">${esc(x.nombre)}${x.nota ? ` — ${esc(x.nota)}` : ""}${x.elegida ? ` ✦ ${esc(t("BR.Grimoire.Chosen"))}` : ""}</li>`).join("")}</ul>`);
    text.push(...state.herederas.map(x => `· ${x.nombre}${x.elegida ? ` ✦ ${t("BR.Grimoire.Chosen")}` : ""}`));
  }

  if (state.resultado) {
    h("h2", t(state.resultado.tipo === "muerte" ? "BR.Grimoire.Death" : "BR.Grimoire.Legacy"));
    const line = state.resultado.tipo === "muerte" ? t("BR.Grimoire.DeathLine", { name: b.nombre }) : t("BR.Grimoire.LegacyLine", { name: b.nombre, heir: state.herederas.find(x => x.elegida)?.nombre ?? "" });
    out.push(`<p class="br-grim-verdict">${esc(line)}</p>`); text.push(line);
    p(state.resultado.texto);
  } else if (state.fase !== "preparacion") {
    p(t("BR.Grimoire.Open", { pd: tot.pd, cons: tot.consecuencias }));
  }

  const credit = t("BR.Grimoire.Credit");
  out.push(`<footer class="br-grim-foot"><img src="${esc(ASSETS.logo)}" alt="" width="56" height="56"><p>${esc(credit)}</p></footer>`);
  text.push("\n— " + credit);
  return { title, html: out.join("\n"), text: text.join("\n").replace(/\n{3,}/g, "\n\n").trim() };
}
