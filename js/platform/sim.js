// Цифрлық егіздің модельдік есептеулері: сақталу индексі және датчиктер симуляциясы.
// Маңызды: бұл — оқу мақсатындағы модель, нақты өлшем емес.

const MAT_RISK = { adobe: 12, brick: 5, ornament: 9, terracotta: 8, carpet: 6, stone: 2, white: 3, concrete: 1 };
const REGION_HUM = { syr: 10, south: 6, talas: 5, ulytau: 3 };
const TYPE_RISK = { longTomb: 6, tentDome: 4, portalDome: 3, domedCube: 2, yurtStone: 1, kobyz: 0 };

// Сақталу индексі 0–100: неғұрлым төмен болса, соғұрлым жедел араласу керек
export function healthOf(o) {
  const m = o.model, age = 21 - o.s;
  const parts = {
    "Жасы": Math.round(age * 2.3),
    "Материал": MAT_RISK[m.mat || "brick"] ?? 5,
    "Өңір ылғалы": REGION_HUM[o.region] ?? 5,
    "Конструкция": TYPE_RISK[m.type] ?? 3
  };
  const restored = o.unesco ? 8 : 0; // тұрақты реставрация жүргізілетін нысан
  const index = Math.max(30, Math.min(95, Math.round(100 - Object.values(parts).reduce((a, b) => a + b, 0) + restored)));
  return { index, parts };
}

export function gaugeSVG(label, value, max, text, color = "#1AA6C4") {
  const t = Math.max(0, Math.min(1, value / max)), a = Math.PI * (1 - t);
  const x = 42 + 34 * Math.cos(a), y = 44 - 34 * Math.sin(a);
  return `<div class="gauge"><svg viewBox="0 0 84 48"><path d="M8 44a34 34 0 0 1 68 0" fill="none" stroke="#E6EBF2" stroke-width="7" stroke-linecap="round"/>
    <path d="M8 44A34 34 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round"/></svg>
    <b>${text}</b><span>${label}</span></div>`;
}

// Датчиктер: [атауы, өлшем бірлігі, шкала максимумы, ескерту шегі, қауіп шегі, «төмен = қауіпті» ме]
export const SENSORS = {
  load: ["Жүктеме", "МПа", 4, 2.4, 2.9],
  hum: ["Ылғалдылық", "%", 100, 70, 82],
  vib: ["Діріл", "мм/с", 10, 2, 5],
  gw: ["Жерасты суы", "м", 10, 2.5, 1.6, true],
  tilt: ["Еңкею", "мм/м", 3, 1.2, 2],
  temp: ["Температура", "°C", 50, 38, 43]
};

export const SCENARIOS = {
  normal: { name: "Қалыпты режим", d: {} },
  water: { name: "Жерасты суы көтерілді", d: { gw: -4.2, hum: 26, load: .55, tilt: .9 } },
  quake: { name: "Жер сілкінісі (5 балл)", d: { vib: 7.5, load: .9, tilt: .5 }, pulse: 6 },
  heat: { name: "Аптап ыстық", d: { temp: 22, hum: -14 } }
};

export class TwinSim {
  constructor(o) {
    const h = healthOf(o).index, r = o.region;
    this.base = {
      load: +(1.5 + (o.model.dome ? o.model.dome.r : 4) * .07 + (100 - h) * .006).toFixed(2),
      hum: { syr: 52, south: 44, talas: 41, ulytau: 36 }[r] || 42,
      vib: .12, gw: { syr: 3.6, south: 5.2, talas: 5.8, ulytau: 7.5 }[r] || 5.5,
      tilt: +(.25 + (100 - h) * .008).toFixed(2), temp: 21
    };
    this.val = { ...this.base };
    this.hist = Object.fromEntries(Object.keys(SENSORS).map(k => [k, Array(60).fill(this.base[k])]));
    this.scenario = "normal"; this.t0 = 0; this.time = 0; this.log = [];
  }
  setScenario(id) { this.scenario = id; this.t0 = this.time; this.addLog(`Сценарий: ${SCENARIOS[id].name}`, "info"); }
  target(k) {
    const sc = SCENARIOS[this.scenario], d = sc.d[k] || 0;
    if (sc.pulse) { const e = Math.max(0, 1 - (this.time - this.t0) / sc.pulse); return this.base[k] + d * e; }
    return this.base[k] + d;
  }
  level(k, v = this.val[k]) {
    const [, , , w, a, low] = SENSORS[k];
    return low ? (v < a ? "alert" : v < w ? "warn" : "ok") : (v > a ? "alert" : v > w ? "warn" : "ok");
  }
  addLog(text, lvl) { const t = new Date(); this.log.unshift({ t: t.toTimeString().slice(0, 8), text, lvl }); this.log.length = Math.min(this.log.length, 30); }
  step(dt) {
    this.time += dt;
    for (const k of Object.keys(SENSORS)) {
      const before = this.level(k), tg = this.target(k), noise = (Math.random() - .5) * SENSORS[k][2] * .006;
      this.val[k] += (tg - this.val[k]) * Math.min(1, dt * 1.4) + noise;
      if (k === "vib") this.val[k] = Math.max(.02, this.val[k]);
      const after = this.level(k);
      if (after !== before && after !== "ok") this.addLog(`${SENSORS[k][0]}: ${this.fmt(k)} — ${after === "alert" ? "ҚАУІП" : "ескерту"}`, after);
    }
  }
  sample() { for (const k of Object.keys(SENSORS)) { this.hist[k].push(this.val[k]); this.hist[k].shift(); } }
  fmt(k) { const v = this.val[k]; return `${v.toFixed(k === "temp" || k === "hum" ? 0 : 2)} ${SENSORS[k][1]}`; }
  // жалпы күй: ең нашар датчик бойынша
  overall() { const ls = Object.keys(SENSORS).map(k => this.level(k)); return ls.includes("alert") ? "alert" : ls.includes("warn") ? "warn" : "ok"; }
}
