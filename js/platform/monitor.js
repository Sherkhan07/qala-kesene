// 3-саты. Digital Twin Monitor: датчиктер, жүктеме нүктелері, сценарийлер (жерасты суы, жер сілкінісі),
// оқиғалар журналы және ортағасырлық аэрация (табиғи желдету) жүйесінің бөлшектік модельдеуі.
import * as THREE from "three";
import { TwinSim, SENSORS, SCENARIOS, gaugeSVG } from "./sim.js";

let api, sim, stopTick, air, acc = 0, shake = new THREE.Vector3(), points = [];
const COLORS = { ok: "#1AA6C4", warn: "#E0A030", alert: "#D9473B" };

function loadPoints(v) {
  const b = v.box, c = v.center, H = b.max.y - b.min.y;
  return [
    ["A · Іргетас, алды", new THREE.Vector3(c.x, b.min.y + H * .04, b.max.z), 1.18],
    ["B · Портал аркасы", new THREE.Vector3(c.x, b.min.y + H * .45, b.max.z), 1.05],
    ["C · Күмбез негізі", new THREE.Vector3(c.x, b.min.y + H * .66, c.z), .92],
    ["D · Артқы бұрыш", new THREE.Vector3(b.min.x, b.min.y + H * .08, b.min.z), 1.1]
  ];
}

// Аэрация: салқын ауа портал арқылы кіріп, жылынып, күмбез астынан шығады (стек-эффект)
function buildAir(v) {
  const b = v.box, c = v.center, S = v.size, H = b.max.y - b.min.y, W = (b.max.x - b.min.x);
  const N = 700, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const parts = Array.from({ length: N }, () => ({ t: Math.random(), sp: .08 + Math.random() * .08, ox: (Math.random() - .5) * W * .5, oz: (Math.random() - .5) * S * .15 }));
  const ctrl = (p) => [
    new THREE.Vector3(c.x + p.ox, b.min.y + H * .12, b.max.z + S * .35),
    new THREE.Vector3(c.x + p.ox * .7, b.min.y + H * .18, b.max.z),
    new THREE.Vector3(c.x + p.ox * .5, b.min.y + H * .3, c.z + p.oz),
    new THREE.Vector3(c.x + p.ox * .2, b.min.y + H * .75, c.z),
    new THREE.Vector3(c.x + p.ox * .1, b.max.y + S * .25, c.z)
  ];
  parts.forEach(p => { p.curve = new THREE.CatmullRomCurve3(ctrl(p)); });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: S * .011, vertexColors: true, transparent: true, opacity: .9, depthWrite: false }));
  const cold = new THREE.Color(0x48cae4), warm = new THREE.Color(0xff8a3d), tmp = new THREE.Color(), v3 = new THREE.Vector3();
  pts.userData.update = (dt, speed) => {
    parts.forEach((p, i) => {
      p.t = ((p.t + dt * p.sp * speed) % 1 + 1) % 1;
      p.curve.getPoint(p.t, v3); pos.set([v3.x, v3.y, v3.z], i * 3);
      tmp.copy(cold).lerp(warm, Math.min(1, p.t * 1.3)); col.set([tmp.r, tmp.g, tmp.b], i * 3);
    });
    geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = true;
  };
  return pts;
}

const spark = (arr, max, color) => {
  const pts = arr.map((x, i) => `${(i / (arr.length - 1) * 100).toFixed(1)},${(30 - Math.min(1, x / max) * 28).toFixed(1)}`).join(" ");
  return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg>`;
};

function renderPanel() {
  const { panel } = api, ov = sim.overall();
  const label = { ok: "Қалыпты", warn: "Ескерту", alert: "ҚАУІП" }[ov];
  panel.querySelector("#twState").innerHTML = `<span class="state ${ov}">${label}</span>`;
  panel.querySelector("#twSensors").innerHTML = Object.keys(SENSORS).map(k => {
    const lv = sim.level(k);
    return `<li style="flex-wrap:wrap"><span>${SENSORS[k][0]}</span><b><span class="state ${lv}">${sim.fmt(k)}</span></b>
      ${["load", "hum", "vib", "gw"].includes(k) ? `<div style="flex-basis:100%">${spark(sim.hist[k], SENSORS[k][2], COLORS[lv])}</div>` : ""}</li>`;
  }).join("");
  panel.querySelector("#twLog").innerHTML = sim.log.map(l => `<li><time>${l.t}</time><span class="${l.lvl === "info" ? "" : "state " + l.lvl}">${l.text}</span></li>`).join("") || "<li>Оқиғалар жоқ</li>";
  const ach = (0.8 + Math.max(0, sim.val.temp - 12) * .06).toFixed(1);
  panel.querySelector("#twAir").textContent = `≈ ${ach} рет/сағ`;
  api.gauges.innerHTML =
    gaugeSVG("Жүктеме, МПа", sim.val.load, 4, sim.val.load.toFixed(2), COLORS[sim.level("load")]) +
    gaugeSVG("Ылғалдылық, %", sim.val.hum, 100, sim.val.hum.toFixed(0), COLORS[sim.level("hum")]) +
    gaugeSVG("Жерасты суы, м", sim.val.gw, 10, sim.val.gw.toFixed(2), COLORS[sim.level("gw")]);
}

function renderHotspots() {
  const { v, hud } = api;
  hud.innerHTML = points.map(([name, p, k]) => {
    const s = v.project(p); if (s.behind) return "";
    const val = sim.val.load * k, lv = val > SENSORS.load[4] ? "alert" : val > SENSORS.load[3] ? "warn" : "";
    return `<div class="hot ${lv}" style="left:${s.x}px;top:${s.y - 6}px">${name}<br><b>${val.toFixed(2)} МПа</b></div>`;
  }).join("");
}

export default {
  enter(a) {
    api = a; const { v, panel, obj } = api;
    v.setMode("twin");
    sim = new TwinSim(obj); points = loadPoints(v);
    air = buildAir(v); v.scene.add(air);
    panel.innerHTML = `
      <div class="kicker">3-саты</div><h3>Digital Twin Monitor</h3>
      <p>LiDAR моделінің үстінде салмақ түсетін нүктелер, жерасты суы мен сейсмикалық әсер нақты уақытта бақыланады. Сценарийді таңдап, ғимараттың реакциясын көріңіз.</p>
      <ul class="kv"><li><span>${obj.name}</span><b id="twState"></b></li></ul>
      <div style="font-size:12px;font-weight:700;color:#5B6576;text-transform:uppercase;letter-spacing:.06em">Сценарий</div>
      <div class="btns" id="twSc">${Object.entries(SCENARIOS).map(([k, s]) => `<button class="pbtn${k === "normal" ? " on" : ""}" data-sc="${k}">${s.name}</button>`).join("")}</div>
      <div style="font-size:12px;font-weight:700;color:#5B6576;text-transform:uppercase;letter-spacing:.06em">Аэрация (желдету)</div>
      <ul class="kv"><li><span>Табиғи ауа алмасу</span><b id="twAir"></b></li></ul>
      <div class="btns"><button class="pbtn on" id="twAirBtn">Ауа ағынын көрсету</button><button class="pbtn on" id="twHot">Жүктеме нүктелері</button></div>
      <div style="font-size:12px;font-weight:700;color:#5B6576;text-transform:uppercase;letter-spacing:.06em;margin-top:6px">Датчиктер</div>
      <ul class="kv" id="twSensors"></ul>
      <div style="font-size:12px;font-weight:700;color:#5B6576;text-transform:uppercase;letter-spacing:.06em;margin-top:10px">Оқиғалар журналы</div>
      <ul class="log" id="twLog"></ul>
      <div class="disclaimer">Датчик мәндері — модельдік симуляция. Нақты жобада олар IoT датчиктерінен API арқылы келеді.</div>`;
    panel.querySelector("#twSc").onclick = e => {
      const b = e.target.closest("[data-sc]"); if (!b) return;
      panel.querySelectorAll("[data-sc]").forEach(x => x.classList.toggle("on", x === b));
      sim.setScenario(b.dataset.sc); api.say(SCENARIOS[b.dataset.sc].name);
    };
    let hotOn = true;
    panel.querySelector("#twAirBtn").onclick = e => { air.visible = !air.visible; e.currentTarget.classList.toggle("on", air.visible); };
    panel.querySelector("#twHot").onclick = e => { hotOn = !hotOn; e.currentTarget.classList.toggle("on", hotOn); if (!hotOn) api.hud.innerHTML = ""; };
    acc = 0; renderPanel();
    stopTick = v.addTicker(dt => {
      sim.step(dt);
      air.userData.update(dt, 1 + Math.max(0, sim.val.temp - 20) * .05);
      // жер сілкінісінде камера дірілдейді
      v.camera.position.sub(shake);
      const amp = Math.max(0, sim.val.vib - 1) * v.size * .0012;
      shake.set((Math.random() - .5) * amp, (Math.random() - .5) * amp, (Math.random() - .5) * amp);
      v.camera.position.add(shake);
      if (hotOn) renderHotspots();
      acc += dt; if (acc > .5) { acc = 0; sim.sample(); renderPanel(); }
    });
  },
  exit() {
    if (!api) return;
    stopTick && stopTick(); api.v.camera.position.sub(shake); shake.set(0, 0, 0);
    air && api.v.scene.remove(air);
    api.v.setMode("real"); api = null;
  }
};
