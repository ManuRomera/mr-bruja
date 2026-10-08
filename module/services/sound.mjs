import { get } from "../settings.mjs";

/**
 * Sonido sin archivos: ambientes, efectos y un arpa muy esporádica, todo sintetizado con Web Audio.
 * Tres volúmenes independientes por usuario: ambiente, efectos y música.
 */
export const AMBIENTS = ["bosque", "lumbre", "caldero", "lluvia", "lobos", "campana", "silencio"];
/** Modo dórico sobre Re: Re, Mi, Fa, Sol, La, Si, Do, Re. */
const DORICO = [293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33];

export class SoundService {
  static #ctx; static #sfx; static #amb; static #mus; static #noise = {};
  static #current = { key: "", nodes: [], timers: [], gain: null };

  static get enabled() { return Boolean(get("soundFx")); }

  static #context() {
    if (!this.#ctx) {
      const Ctx = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!Ctx) return null;
      this.#ctx = new Ctx();
      const bus = () => { const g = this.#ctx.createGain(); g.connect(this.#ctx.destination); return g; };
      this.#sfx = bus(); this.#amb = bus(); this.#mus = bus();
      this.volumes();
    }
    if (this.#ctx.state === "suspended") this.#ctx.resume().catch(() => {});
    return this.#ctx;
  }

  /** Los navegadores solo permiten audio tras un gesto: se reanuda al primer clic. */
  static init() {
    document.addEventListener("pointerdown", () => { if (this.#ctx?.state === "suspended") this.#ctx.resume(); }, { passive: true });
    Hooks.on("mrBrPreferences", () => this.refresh());
  }

  static volumes() {
    if (!this.#ctx) return;
    const t = this.#ctx.currentTime, on = this.enabled;
    this.#sfx.gain.setTargetAtTime(on ? Number(get("sfxVolume")) : 0, t, 0.05);
    this.#amb.gain.setTargetAtTime(on ? Number(get("ambientVolume")) : 0, t, 0.4);
    this.#mus.gain.setTargetAtTime(on && get("music") ? Number(get("musicVolume")) : 0, t, 0.1);
  }

  static #noiseBuffer(color = "white") {
    const ctx = this.#ctx;
    if (this.#noise[color]) return this.#noise[color];
    const length = ctx.sampleRate * 3, buffer = ctx.createBuffer(1, length, ctx.sampleRate), data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (color === "brown") { last = (last + 0.02 * white) / 1.02; data[i] = last * 3.5; }
      else if (color === "pink") { last = 0.97 * last + 0.03 * white; data[i] = (last * 6 + white * 0.25) * 0.5; }
      else data[i] = white;
    }
    return this.#noise[color] = buffer;
  }
  static #source(color, dest) { const s = this.#ctx.createBufferSource(); s.buffer = this.#noiseBuffer(color); s.loop = true; s.connect(dest); s.start(); return s; }
  static #filter(type, frequency, Q = 0.7) { const f = this.#ctx.createBiquadFilter(); f.type = type; f.frequency.value = frequency; f.Q.value = Q; return f; }
  static #gain(value) { const g = this.#ctx.createGain(); g.gain.value = value; return g; }
  static #lfo(param, rate, depth) { const o = this.#ctx.createOscillator(), g = this.#gain(depth); o.frequency.value = rate; o.connect(g).connect(param); o.start(); return [o, g]; }
  static #chain(...nodes) { for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); return nodes; }

  /* ---------- ambientes ---------- */

  static #build(key, out) {
    const nodes = [], timers = [], ctx = this.#ctx;
    const noise = (color, ...chain) => { this.#chain(...chain, out); nodes.push(this.#source(color, chain[0]), ...chain); return chain.at(-1); };
    const every = (min, max, fn) => { const tick = () => { fn(); timers.push(setTimeout(tick, min + Math.random() * (max - min))); }; timers.push(setTimeout(tick, min)); };
    const wind = level => {
      const f = this.#filter("bandpass", 380, 0.9), g = this.#gain(level);
      noise("pink", f, g);
      nodes.push(...this.#lfo(f.frequency, 0.07, 240), ...this.#lfo(g.gain, 0.1, level * 0.6));
    };
    /** Un estallido breve de ruido filtrado: crepitar de leña, burbuja… */
    const pop = (freq, level, dur) => {
      const src = ctx.createBufferSource(), f = this.#filter("bandpass", freq, 3), g = this.#gain(0), t = ctx.currentTime;
      src.buffer = this.#noiseBuffer("white"); this.#chain(src, f, g, out);
      g.gain.setValueAtTime(level, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.start(t, Math.random() * 2); src.stop(t + dur + 0.05);
    };
    const bubble = () => {
      const t = ctx.currentTime, o = ctx.createOscillator(), g = this.#gain(0), base = 140 + Math.random() * 200;
      o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * 2.2, t + 0.12);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      this.#chain(o, g, out); o.start(t); o.stop(t + 0.2);
    };
    const hoot = () => {   // lechuza lejana
      const t = ctx.currentTime, base = 420 + Math.random() * 40;
      for (const [d, dur] of [[0, 0.32], [0.5, 0.5]]) {
        const o = ctx.createOscillator(), g = this.#gain(0);
        o.type = "sine"; o.frequency.setValueAtTime(base, t + d); o.frequency.exponentialRampToValueAtTime(base * 0.86, t + d + dur);
        g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(0.035, t + d + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + d + dur);
        this.#chain(o, g, out); o.start(t + d); o.stop(t + d + dur + 0.1);
      }
    };
    const howl = () => {   // aullido lejano
      const t = ctx.currentTime, o = ctx.createOscillator(), g = this.#gain(0), lp = this.#filter("lowpass", 900);
      o.type = "sawtooth"; o.frequency.setValueAtTime(300, t); o.frequency.linearRampToValueAtTime(520, t + 1.6); o.frequency.linearRampToValueAtTime(380, t + 3.6);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03, t + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
      this.#chain(o, lp, g, out); o.start(t); o.stop(t + 4.2);
    };
    const bell = () => {
      const t = ctx.currentTime, base = 196 + Math.random() * 30;
      for (const [mult, lvl] of [[1, 0.05], [2.76, 0.03], [5.4, 0.015]]) {
        const o = ctx.createOscillator(), g = this.#gain(0); o.frequency.value = base * mult; this.#chain(o, g, out);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lvl, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 6);
        o.start(t); o.stop(t + 6.2);
      }
    };
    const crickets = () => {
      const g = this.#gain(0.05), o = ctx.createOscillator(); o.type = "square"; o.frequency.value = 4300;
      this.#chain(o, this.#filter("bandpass", 4300, 10), g, out); o.start(); nodes.push(o, g);
      nodes.push(...this.#lfo(g.gain, 24, 0.04), ...this.#lfo(g.gain, 0.09, 0.03));
    };
    switch (key) {
      case "bosque": wind(0.22); crickets(); every(16000, 38000, hoot); break;
      case "lumbre": { const g = this.#gain(0.1); noise("brown", this.#filter("lowpass", 300), g); every(150, 700, () => pop(1800 + Math.random() * 2500, 0.12, 0.05)); every(2500, 6000, () => pop(700, 0.2, 0.12)); wind(0.08); break; }
      case "caldero": { const g = this.#gain(0.07); noise("brown", this.#filter("lowpass", 240), g); every(160, 520, bubble); wind(0.06); break; }
      case "lluvia": noise("white", this.#filter("highpass", 1100), this.#filter("lowpass", 7500), this.#gain(0.1)); noise("brown", this.#filter("lowpass", 180), this.#gain(0.14)); break;
      case "lobos": wind(0.32); every(22000, 48000, howl); break;
      case "campana": wind(0.14); every(10000, 22000, bell); break;
      case "silencio":
        for (const hz of [49, 49.3]) { const o = ctx.createOscillator(), g = this.#gain(0.04); o.frequency.value = hz; this.#chain(o, g, out); o.start(); nodes.push(o, g); }
        break;
    }
    return { nodes, timers };
  }

  /** Cambia el ambiente con un fundido. */
  static setAmbient(key = "") {
    if (key === this.#current.key) return;
    this.#stopAmbient();
    this.#current.key = key;
    if (!key || !this.enabled || !AMBIENTS.includes(key)) return;
    const ctx = this.#context(); if (!ctx) return;
    const gain = this.#gain(0); gain.connect(this.#amb);
    gain.gain.setTargetAtTime(1, ctx.currentTime, 1.2);
    Object.assign(this.#current, this.#build(key, gain), { gain });
  }
  static #stopAmbient() {
    const { nodes, timers, gain } = this.#current;
    timers.forEach(clearTimeout);
    if (gain && this.#ctx) {
      gain.gain.setTargetAtTime(0, this.#ctx.currentTime, 0.4);
      setTimeout(() => { for (const n of nodes) { try { n.stop?.(); } catch {} n.disconnect(); } gain.disconnect(); }, 2000);
    }
    this.#current = { key: "", nodes: [], timers: [], gain: null };
  }
  static silence() { this.#stopAmbient(); }
  /** Aplica de nuevo los ajustes (si se apaga, calla; si se enciende, vuelve el ambiente). */
  static refresh() {
    this.volumes();
    const key = this.#current.key;
    if (!this.enabled) return this.#stopAmbient();
    if (key && !this.#current.gain) { this.#current.key = ""; this.setAmbient(key); }
  }

  /* ---------- efectos ---------- */

  static #tone(freq, duration, level = 0.05, type = "sine", when = 0, endFreq, dest = this.#sfx) {
    const ctx = this.#context(); if (!ctx || !this.enabled) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + when;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(level, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g).connect(dest); o.start(t); o.stop(t + duration + 0.05);
  }
  static #rub(freq, duration, level, when = 0, color = "white", q = 0.8) {
    const ctx = this.#context(); if (!ctx || !this.enabled) return;
    const src = ctx.createBufferSource(), f = this.#filter("bandpass", freq, q), g = this.#gain(0), t = ctx.currentTime + when;
    src.buffer = this.#noiseBuffer(color); this.#chain(src, f, g, this.#sfx);
    g.gain.linearRampToValueAtTime(level, t + duration * 0.25); g.gain.linearRampToValueAtTime(0, t + duration);
    src.start(t, Math.random()); src.stop(t + duration + 0.05);
  }

  /** Hoja de pergamino que pasa. */
  static page() { this.#rub(2200, 0.22, 0.09); this.#rub(1300, 0.12, 0.05, 0.16); }
  /** Carta que se coloca sobre la mesa. */
  static card() { this.#rub(1800, 0.14, 0.1); this.#tone(210, 0.1, 0.05, "triangle", 0.05); }
  /** Peón de madera sobre la carta. */
  static pawn() { this.#rub(1500, 0.03, 0.16); this.#tone(320, 0.14, 0.06, "triangle"); this.#tone(160, 0.1, 0.06); }
  /** Dados que caen en el caldero: chapoteos y burbujas. */
  static dice() {
    for (let i = 0; i < 4; i++) { const w = i * 0.09 + Math.random() * 0.03; this.#rub(500 + Math.random() * 500, 0.1, 0.16, w, "pink", 1.4); this.#tone(180 + Math.random() * 120, 0.12, 0.05, "sine", w, 380); }
    for (let i = 0; i < 5; i++) this.#tone(220 + Math.random() * 260, 0.12, 0.035, "sine", 0.45 + i * 0.1, 520 + Math.random() * 300);
  }
  /** Una vela se apaga: soplo y un hilo de silencio. */
  static candleOut() { this.#rub(900, 0.5, 0.12, 0, "pink", 0.5); this.#tone(96, 0.8, 0.06, "sine", 0.1, 60); }
  static candleLit() { this.#rub(3200, 0.12, 0.08); this.#tone(520, 0.4, 0.03, "sine", 0.05); this.#tone(780, 0.5, 0.02, "sine", 0.1); }
  /** Una gota cae en el frasco de PD. */
  static drop() { this.#tone(1560, 0.5, 0.05, "sine", 0, 1180); this.#tone(2360, 0.35, 0.02, "sine", 0.02, 1800); this.#tone(780, 0.6, 0.03, "sine", 0.12); }
  static spend() { this.#tone(660, 0.18, 0.04, "triangle"); this.#tone(440, 0.3, 0.04, "triangle", 0.1); }
  /** Sello de cera sobre el retrato de la heredera. */
  static seal() { this.#tone(110, 0.3, 0.14, "sine", 0, 70); this.#rub(500, 0.1, 0.1); this.#tone(1320, 0.7, 0.03, "sine", 0.2); this.#tone(1760, 0.6, 0.02, "sine", 0.3); }
  static fairy() { for (const [i, hz] of [1568, 1976, 2349, 2637].entries()) this.#tone(hz, 0.7, 0.025, "sine", i * 0.09); }
  /** Graznido de cuervo (dos golpes de dientes de sierra con formante). */
  static raven() {
    const ctx = this.#context(); if (!ctx || !this.enabled) return;
    for (const d of [0, 0.34]) {
      const t = ctx.currentTime + d, o = ctx.createOscillator(), f = this.#filter("bandpass", 1100, 4), g = this.#gain(0);
      o.type = "sawtooth"; o.frequency.setValueAtTime(330, t); o.frequency.exponentialRampToValueAtTime(190, t + 0.28);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      this.#chain(o, f, g, this.#sfx); o.start(t); o.stop(t + 0.35);
    }
  }
  static door() { this.#tone(70, 0.4, 0.2, "sine", 0, 40); this.#rub(300, 0.25, 0.1, 0.02, "brown"); this.#tone(210, 0.7, 0.025, "sawtooth", 0.2, 150); }
  static key() { this.#rub(4000, 0.05, 0.12); this.#tone(1250, 0.25, 0.04, "triangle", 0.05); this.#tone(880, 0.3, 0.03, "triangle", 0.13); }
  static win() { for (const [i, hz] of [293.66, 440, 587.33, 880].entries()) this.#tone(hz, 1.4, 0.04, "sine", i * 0.22); }
  static death() { this.#tone(98, 3.2, 0.12, "sine", 0, 65); this.#tone(147, 3, 0.05, "triangle", 0.2, 98); this.raven(); }

  /** Arpa pulsada (Karplus-Strong): un puñado de notas sueltas en modo dórico; nunca un bucle. */
  static arpa(notes = 3) {
    const ctx = this.#context(); if (!ctx || !this.enabled || !get("music")) return;
    const t0 = ctx.currentTime + 0.1;
    let when = 0, idx = Math.floor(Math.random() * 5);
    for (let n = 0; n < notes; n++) {
      idx = Math.max(0, Math.min(DORICO.length - 1, idx + [-2, -1, 1, 2][Math.floor(Math.random() * 4)]));
      this.#pluck(DORICO[idx], t0 + when);
      when += 0.5 + Math.random() * 0.9;
    }
    this.#pluck(DORICO[0] / 2, t0);   // bordón
  }
  static #pluck(freq, at) {
    const ctx = this.#ctx, sr = ctx.sampleRate, len = Math.floor(sr * 2.6), period = Math.max(2, Math.round(sr / freq));
    const buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    for (let i = 0; i < period; i++) d[i] = Math.random() * 2 - 1;
    for (let i = period; i < len; i++) d[i] = (d[i - period] + d[i - period + 1]) * 0.4985;
    const src = ctx.createBufferSource(), g = this.#gain(0.45);
    src.buffer = buf; src.connect(g).connect(this.#mus); src.start(at);
  }
}
