// AR-Конструктор: ортағасырлық элементтерді (сүйір арка, шығыс күмбезі, мұнара, терракота панель…)
// заманауи ғимараттың 3D моделіне орнатып, жаңа дизайн жасау. Сақтау (localStorage) және GLB экспорт.
import * as THREE from "three";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { mat } from "../three/materials.js";
import { boxGeo, cylGeo, domeGeo, archShape, extrude, ground } from "../three/geom.js";

const KEY = "ahvr-design-v1";

// ---------- элементтер кітапханасы (іргесі y=0, беті +z бағытына қарайды) ----------
function mesh(geo, m, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; }
const LIB = {
  arch: { name: "Сүйір арка", hint: "қабырғаға", mount: "wall", build() {
    const s = archShape(6, 9); s.holes.push(archShape(4.2, 7.6));
    const g = new THREE.Group(); g.add(mesh(extrude(s, .7), mat("tile", [2, 2]))); return g; } },
  portal: { name: "Пештақ портал", hint: "қабырғаға", mount: "wall", build() {
    const g = new THREE.Group();
    g.add(mesh(boxGeo(10, 14, 1.4), mat("brick", [3, 4])));
    const fr = archShape(6.4, 10); g.add(mesh(extrude(fr, .2), mat("tile", [2, 2]), 0, 0, 1.4));
    g.add(mesh(extrude(archShape(5, 9), .3), mat("dark"), 0, 0, 1.45));
    g.add(mesh(boxGeo(10.4, .6, 1.8), mat("tile", [4, 1]), 0, 13.4, 0)); return g; } },
  dome: { name: "Шығыс күмбезі", hint: "шатырға", mount: "roof", build() {
    const g = new THREE.Group();
    g.add(mesh(cylGeo(4.1, 4.1, 1.8, 40), mat("brick", [6, 1])));
    g.add(mesh(domeGeo(4, { stretch: 1.25 }), mat("tile", [5, 2]), 0, 1.8, 0));
    g.add(mesh(new THREE.SphereGeometry(.35, 12, 8), mat("tile"), 0, 7.2, 0)); return g; } },
  ribbed: { name: "Қабырғалы күмбез", hint: "шатырға", mount: "roof", build() {
    const g = new THREE.Group();
    g.add(mesh(cylGeo(3.3, 3.3, 2.6, 40), mat("tile", [6, 1])));
    g.add(mesh(domeGeo(3.2, { stretch: 1.55, ribbed: true }), mat("tile", [5, 2]), 0, 2.6, 0)); return g; } },
  minaret: { name: "Мұнара", hint: "жерге/шатырға", mount: "roof", build() {
    const g = new THREE.Group();
    g.add(mesh(cylGeo(.9, 1.4, 20, 20), mat("brick", [2, 7])));
    g.add(mesh(cylGeo(1.6, 1.2, 1.4, 20), mat("tile", [3, 1]), 0, 20, 0));
    g.add(mesh(cylGeo(.2, .7, 2.6, 12), mat("tile"), 0, 21.4, 0)); return g; } },
  panel: { name: "Терракота панель", hint: "қабырғаға", mount: "wall", build() {
    const g = new THREE.Group(); g.add(mesh(boxGeo(6, 6, .3), mat("ornament", [2, 2]))); return g; } },
  tent: { name: "Шатыр күмбез", hint: "шатырға", mount: "roof", build() {
    const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(3.6 * Math.pow(1 - t, 1.35), 6 * t)); }
    const m = mat("terracotta", [8, 3], { flatShading: true });
    const g = new THREE.Group(); g.add(mesh(cylGeo(3.6, 3.8, .8, 16), mat("brick", [4, 1]))); g.add(mesh(new THREE.LatheGeometry(pts, 16), m, 0, .8, 0)); return g; } },
  guldasta: { name: "Гульдаста", hint: "бұрышқа", mount: "roof", build() {
    const g = new THREE.Group(); g.add(mesh(cylGeo(.6, .75, 6, 16), mat("brick", [1, 2]))); g.add(mesh(domeGeo(.7, { stretch: 1.4 }), mat("tile"), 0, 6, 0)); return g; } }
};

// ---------- заманауи ғимарат ----------
function modernBuilding() {
  const g = new THREE.Group(), glass = new THREE.MeshPhysicalMaterial({ color: 0x9fd3e6, transparent: true, opacity: .55, roughness: .08, metalness: .2 });
  const steel = new THREE.LineBasicMaterial({ color: 0x4a6478 });
  const add = (geo, m, x, y, z) => { const o = mesh(geo, m, x, y, z); o.userData.role = "wall"; g.add(o); return o; };
  add(boxGeo(52, 1.2, 34), mat("concrete", [8, 1]), 0, 0, 0);
  const main = add(boxGeo(36, 14, 22), glass, 4, 1.2, 0);
  add(boxGeo(37, .8, 23), mat("concrete", [6, 1]), 4, 15.2, 0);
  const tower = add(boxGeo(11, 34, 11), glass, -15, 1.2, -4);
  add(boxGeo(11.6, .8, 11.6), mat("concrete", [2, 1]), -15, 35.2, -4);
  // фасад жақтаулары (мульондар)
  [[main, 36, 14, 22, 4, -0], [tower, 11, 34, 11, -15, -4]].forEach(([, w, h, d, x, z]) => {
    const pts = [];
    for (let i = 0; i <= w; i += 3) [[-d / 2], [d / 2]].forEach(([dz]) => pts.push(new THREE.Vector3(x - w / 2 + i, 1.2, z + dz), new THREE.Vector3(x - w / 2 + i, 1.2 + h, z + dz)));
    for (let j = 0; j <= h; j += 3.5) [[-d / 2], [d / 2]].forEach(([dz]) => pts.push(new THREE.Vector3(x - w / 2, 1.2 + j, z + dz), new THREE.Vector3(x + w / 2, 1.2 + j, z + dz)));
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), steel));
  });
  return g;
}

let api, design, building, elems, tc, placing = null, ghost = null, selected = null, handlers, down;
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();

function ensureDesign() {
  if (design) return;
  design = new THREE.Group(); building = modernBuilding(); elems = new THREE.Group();
  design.add(building, elems);
  ground(design, 160, mat("ground", [20, 20]));
  try { (JSON.parse(localStorage.getItem(KEY) || "[]")).forEach(e => addElem(e.type, e.p, e.r, e.s)); } catch (e) {}
}
function addElem(type, p, r = [0, 0, 0], s = [1, 1, 1]) {
  const o = LIB[type].build(); o.userData.elem = type;
  o.position.fromArray(p); o.rotation.fromArray(r); o.scale.fromArray(s);
  elems.add(o); return o;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(elems.children.map(o => ({ type: o.userData.elem, p: o.position.toArray(), r: o.rotation.toArray().slice(0, 3), s: o.scale.toArray() })))); } catch (e) {}
  const c = api && api.panel.querySelector("#bcCount"); if (c) c.textContent = elems.children.length;
}
function setPointer(e) { const r = api.v.renderer.domElement.getBoundingClientRect(); ptr.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ptr, api.v.camera); }
function surfaceHit() {
  const t = []; design.traverse(o => { if (o.isMesh && !isInElem(o)) t.push(o); });
  const h = ray.intersectObjects(t, false)[0]; if (!h) return null;
  const n = h.face.normal.clone().transformDirection(h.object.matrixWorld);
  return { p: h.point, n };
}
const isInElem = o => { while (o) { if (o.userData.elem) return true; o = o.parent; } return false; };
const elemRoot = o => { while (o && !o.userData.elem) o = o.parent; return o; };
function orient(obj, hit) {
  obj.position.copy(hit.p);
  if (LIB[obj.userData.elem].mount === "wall" && Math.abs(hit.n.y) < .5) { obj.rotation.set(0, Math.atan2(hit.n.x, hit.n.z), 0); obj.position.addScaledVector(hit.n, .05); }
  else obj.rotation.set(0, obj.rotation.y, 0);
}
function select(o) {
  selected = o; if (o) tc.attach(o); else tc.detach();
  api.panel.querySelectorAll("[data-need-sel]").forEach(b => b.disabled = !o);
  const n = api.panel.querySelector("#bcSel"); if (n) n.textContent = o ? LIB[o.userData.elem].name : "—";
}
function startPlacing(type) {
  cancelPlacing(); placing = type;
  ghost = LIB[type].build(); ghost.userData.elem = type;
  ghost.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = .5; } });
  ghost.visible = false; api.v.scene.add(ghost);
  api.panel.querySelectorAll("[data-lib]").forEach(b => b.classList.toggle("on", b.dataset.lib === type));
  api.say(`«${LIB[type].name}»: ${LIB[type].hint} басып орнатыңыз · Esc — болдырмау`, 0);
}
function cancelPlacing() {
  if (ghost) api.v.scene.remove(ghost); ghost = null; placing = null; api.hush();
  api.panel.querySelectorAll("[data-lib]").forEach(b => b.classList.remove("on"));
}

export default {
  enter(a) {
    api = a; const { v, panel } = api;
    ensureDesign();
    v.setModel(design); v.setMode("real"); v.controls.autoRotate = false;
    tc = new TransformControls(v.camera, v.renderer.domElement);
    tc.setSize(.8);
    tc.addEventListener("dragging-changed", e => { v.controls.enabled = !e.value; if (!e.value) save(); });
    v.scene.add(tc);
    panel.innerHTML = `
      <div class="kicker">Интерактивті симуляция</div><h3>AR-Конструктор</h3>
      <p>Ортағасырлық элементті таңдап, заманауи ғимараттың қабырғасына немесе шатырына басыңыз. Орнатылған элементті басып, жылжытуға, бұруға және масштабтауға болады.</p>
      <div class="palette">${Object.entries(LIB).map(([k, e]) => `<button data-lib="${k}">${e.name}<small>${e.hint}</small></button>`).join("")}</div>
      <ul class="kv"><li><span>Таңдалған</span><b id="bcSel">—</b></li><li><span>Элемент саны</span><b id="bcCount">${elems.children.length}</b></li></ul>
      <div class="btns">
        <button class="pbtn on" data-tc="translate" data-need-sel disabled>↔ Жылжыту</button>
        <button class="pbtn" data-tc="rotate" data-need-sel disabled>⟳ Бұру</button>
        <button class="pbtn" data-tc="scale" data-need-sel disabled>⤢ Масштаб</button>
        <button class="pbtn" id="bcDup" data-need-sel disabled>⧉ Көшірме</button>
        <button class="pbtn danger" id="bcDel" data-need-sel disabled>✕ Өшіру</button>
      </div>
      <div class="btns">
        <button class="pbtn" id="bcClear">Барлығын тазалау</button>
        <button class="pbtn primary" id="bcGlb">⬇ Дизайнды GLB</button>
      </div>
      <div class="disclaimer">Дизайн браузерде автоматты сақталады. GLB файлын Blender-де, AR қосымшаларында (мысалы, телефонның 3D қарау құралында) ашуға болады.</div>`;
    panel.querySelector(".palette").onclick = e => { const b = e.target.closest("[data-lib]"); if (b) placing === b.dataset.lib ? cancelPlacing() : startPlacing(b.dataset.lib); };
    panel.querySelectorAll("[data-tc]").forEach(b => b.onclick = () => { tc.setMode(b.dataset.tc); panel.querySelectorAll("[data-tc]").forEach(x => x.classList.toggle("on", x === b)); });
    panel.querySelector("#bcDel").onclick = () => { if (!selected) return; elems.remove(selected); select(null); save(); };
    panel.querySelector("#bcDup").onclick = () => {
      if (!selected) return;
      const o = addElem(selected.userData.elem, selected.position.toArray(), selected.rotation.toArray().slice(0, 3), selected.scale.toArray());
      o.position.x += 4; select(o); save();
    };
    panel.querySelector("#bcClear").onclick = () => { if (!elems.children.length || !confirm("Барлық элементті өшіру керек пе?")) return; select(null); elems.clear(); save(); };
    panel.querySelector("#bcGlb").onclick = async () => {
      select(null); cancelPlacing();
      const blob = await v.exportGLB(); const a2 = document.createElement("a");
      a2.href = URL.createObjectURL(blob); a2.download = "archheritage-design.glb"; a2.click(); setTimeout(() => URL.revokeObjectURL(a2.href), 2000);
    };
    const el = v.renderer.domElement;
    handlers = {
      move: e => { if (!placing) return; setPointer(e); const h = surfaceHit(); ghost.visible = !!h; if (h) orient(ghost, h); },
      down: e => { down = [e.clientX, e.clientY]; },
      up: e => {
        if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5 || tc.dragging) return;
        setPointer(e);
        if (placing) {
          const h = surfaceHit(); if (!h) return;
          const o = addElem(placing, [0, 0, 0]); orient(o, h); select(o); save();
          if (!e.shiftKey) cancelPlacing();
          return;
        }
        const hit = ray.intersectObjects(elems.children, true)[0];
        select(hit ? elemRoot(hit.object) : null);
      },
      key: e => {
        if (e.key === "Escape") { cancelPlacing(); select(null); }
        if ((e.key === "Delete" || e.key === "Backspace") && selected && document.activeElement === document.body) { elems.remove(selected); select(null); save(); }
      }
    };
    el.addEventListener("pointermove", handlers.move); el.addEventListener("pointerdown", handlers.down); el.addEventListener("pointerup", handlers.up);
    window.addEventListener("keydown", handlers.key);
    if (!elems.children.length) api.say("Оң жақтағы палитрадан элемент таңдаңыз", 3500);
  },
  exit() {
    if (!api) return;
    const el = api.v.renderer.domElement;
    el.removeEventListener("pointermove", handlers.move); el.removeEventListener("pointerdown", handlers.down); el.removeEventListener("pointerup", handlers.up);
    window.removeEventListener("keydown", handlers.key);
    cancelPlacing(); select(null); tc.dispose(); api.v.scene.remove(tc); api.v.controls.enabled = true;
    api.loadObjectModel(); api = null;
  }
};
