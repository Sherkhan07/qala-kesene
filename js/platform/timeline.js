// Timeline & Morphing: слайдер арқылы XIV ғ. → тозу → реставрация → заманауи параметрлік аналог (шыны/болат).
import * as THREE from "three";
import { GLASS } from "../three/materials.js";

const STOPS = [
  [0, "XIV ғ. · Тұрғызылуы", "Жаңа салынған кесене: күйдірілген кірпіш пен глазурь түстері қанық, беттер бүтін."],
  [.3, "XIX ғ. · Тозу", "Ғасырлар бойы жел эрозиясы, тұз бен ылғал әсерінен кірпіш күңгірттеніп, глазурь түсіп қалған."],
  [.55, "Бүгін · Реставрация", "Ғылыми реставрациядан кейінгі күй: түпнұсқа материалдар бекітілген, жоғалған бөліктер қалпына келтірілген."],
  [1, "Заманауи аналог", "Сол пішіннің параметрлік нұсқасы: шыны қабықша мен болат торлы (gridshell) күмбез. Көлемі мен сұлбасы сақталған, ал материалы мен құрылымы — бүгінгі."]
];
const decayAt = t => t <= .3 ? t / .3 : t <= .55 ? 1 - (t - .3) / .25 * .85 : .15;
const morphAt = t => Math.min(1, Math.max(0, (t - .62) / .38));

let api, modern, planeA, planeB, saved = [], stopTick, playing = null, nodes = 0, glassArea = 0;
const dirt = new THREE.Color(0x857868);

function buildModern(v) {
  const g = new THREE.Group(), gm = GLASS(); gm.clippingPlanes = [planeB];
  const steel = new THREE.LineBasicMaterial({ color: 0x5f7d95, clippingPlanes: [planeB] });
  const edge = new THREE.LineBasicMaterial({ color: 0x1aa6c4, clippingPlanes: [planeB] });
  nodes = 0; glassArea = 0;
  v.model.traverse(o => {
    if (!o.isMesh || o.userData.role === "ground") return;
    const geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
    g.add(new THREE.Mesh(geo, gm));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), edge));
    const bb = new THREE.Box3().setFromBufferAttribute(geo.attributes.position), s = bb.getSize(new THREE.Vector3());
    glassArea += 2 * (s.x * s.y + s.y * s.z + s.x * s.z);
    if (o.userData.role === "dome") {
      // болат торлы қабық: күмбездің габаритіне сай төменгі полигонды жарты сфера сымдары
      const shell = new THREE.SphereGeometry(1, 18, 7, 0, Math.PI * 2, 0, Math.PI / 2)
        .scale(s.x / 2, s.y, s.z / 2).translate((bb.min.x + bb.max.x) / 2, bb.min.y, (bb.min.z + bb.max.z) / 2);
      nodes += shell.attributes.position.count;
      g.add(new THREE.LineSegments(new THREE.WireframeGeometry(shell), steel));
    }
  });
  return g;
}

function apply(t) {
  const { v } = api;
  const d = decayAt(t), u = morphAt(t);
  saved.forEach(({ m, color }) => m.color.copy(color).lerp(dirt, d * (m.userData.kind === "tile" ? .7 : .5)));
  const x = v.box.max.x + .01 - u * (v.box.max.x - v.box.min.x + .02);
  planeA.constant = x; planeB.constant = -x;
  // ағымдағы кезең
  let idx = 0; STOPS.forEach((s, i) => { if (t >= s[0] - .08) idx = i; });
  if (u > .5) idx = 3;
  document.querySelectorAll("#tlStops span").forEach((s, i) => s.classList.toggle("on", i === idx));
  const p = api.panel.querySelector("#tmStage");
  if (p && p.dataset.i !== String(idx)) {
    p.dataset.i = idx;
    p.innerHTML = `<h3 style="font-size:22px;margin-top:6px">${STOPS[idx][1]}</h3><p>${STOPS[idx][2]}</p>`;
  }
  api.panel.querySelector("#tmPct").textContent = `${Math.round(u * 100)}%`;
}

export default {
  enter(a) {
    api = a; const { v, panel } = api;
    v.setMode("real"); api.timeline(true);
    planeA = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0); planeB = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
    saved = [];
    v.model.traverse(o => {
      if (!o.isMesh || o.userData.role === "ground") return;
      o.material.clippingPlanes = [planeA];
      if (o.material.color) saved.push({ m: o.material, color: o.material.color.clone() });
    });
    modern = buildModern(v); v.scene.add(modern);
    const range = document.getElementById("tl");
    document.getElementById("tlStops").innerHTML = STOPS.map(([t, n]) => `<span data-t="${t}" style="left:${t * 100}%">${n.split(" · ")[0]}</span>`).join("");
    panel.innerHTML = `
      <div class="kicker">Timeline & Morphing</div><h3>Уақыт сызығы</h3>
      <p>Төмендегі слайдерді жылжытыңыз. Кесене алдымен ғасырлар бойы тозады, реставрацияланады, содан соң заманауи параметрлік аналогына (шыны мен металл) біртіндеп ауысады.</p>
      <div id="tmStage"></div>
      <ul class="kv">
        <li><span>Заманауи үлесі</span><b id="tmPct">0%</b></li>
        <li><span>Болат тор түйіндері</span><b>${nodes}</b></li>
        <li><span>Шыны қабықша ауданы (шамамен)</span><b>${Math.round(glassArea).toLocaleString("ru-RU")} м²</b></li>
      </ul>
      <div class="btns"><button class="pbtn primary" id="tmPlay">▶ Уақытты ойнату</button><button class="pbtn" id="tmReset">↺ Басына</button></div>
      <div class="disclaimer">Заманауи аналог тарихи пішіннен алгоритммен жасалады: әр элементтің геометриясы шыныға, ал күмбездер болат торлы қабыққа айналады.</div>`;
    range.value = 0; apply(0);
    range.oninput = () => { stop(); apply(range.value / 1000); };
    document.getElementById("tlStops").onclick = e => { const s = e.target.closest("[data-t]"); if (s) animateTo(+s.dataset.t); };
    const stop = () => { if (playing) { playing(); playing = null; } };
    const animateTo = (target, dur = 1.2) => {
      stop(); const from = range.value / 1000; let k = 0;
      playing = v.addTicker(dt => { k = Math.min(1, k + dt / dur); const t = from + (target - from) * (k * k * (3 - 2 * k)); range.value = t * 1000; apply(t); if (k >= 1) stop(); });
    };
    panel.querySelector("#tmPlay").onclick = () => { range.value = 0; apply(0); animateTo(1, 9); };
    panel.querySelector("#tmReset").onclick = () => animateTo(0);
    this.stop = stop;
  },
  exit() {
    if (!api) return;
    this.stop && this.stop();
    saved.forEach(({ m, color }) => { m.color.copy(color); m.clippingPlanes = null; m.needsUpdate = true; });
    api.v.model.traverse(o => { if (o.isMesh && o.material) o.material.clippingPlanes = null; });
    modern && api.v.scene.remove(modern);
    api.timeline(false); api = null;
  }
};
