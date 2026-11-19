// 2-саты. HBIM инспекторы: модель элементін басқанда оның ақпараттық атрибуттары шығады
// (элемент түрі, материал, биіктік деңгейі, тозу, ылғал, ұсынылатын әрекет).
import * as THREE from "three";

const MAT_NAME = {
  brick: "Күйдірілген кірпіш", adobe: "Шикі кірпіш (саман)", tile: "Глазурьлі тақташа", terracotta: "Терракота",
  ornament: "Ою-өрнекті терракота", carpet: "Өрнекті кірпіш қалау", stone: "Табиғи тас", white: "Әкті сылақ",
  concrete: "Бетон", dark: "Ойық (тауаша)", mound: "Топырақ үйінді", ground: "Жер беті"
};
const MAT_WEAR = { adobe: 1.5, terracotta: 1.2, ornament: 1.25, tile: 1.1, brick: 1, carpet: 1.05, white: .8, stone: .6, concrete: .5, dark: .9 };
const ACTION = {
  tile: "Түсіп қалған глазурь тақташаларын реставрациялық қоспамен бекіту, жоғалғандарын түпнұсқа түсі бойынша қалпына келтіру.",
  brick: "Мүжілген кірпіштерді ауыстыру, қалау жіктерін әкті ерітіндімен толтыру.",
  adobe: "Беткі қабатты саз-сабан сылақпен қорғау, жаңбыр суын бұру.",
  terracotta: "Терракота өрнектерді 3D сканерден көшірме жасап, бүлінгендерін ауыстыру.",
  ornament: "Әр тақташаны фотограмметриямен каталогқа енгізу, жарықтарды инъекциямен бекіту.",
  carpet: "Өрнек қалауын құжаттау, жіктерді тазалап, тұздан арылту.",
  stone: "Тастың жарықтарын бақылау, қалау байланыстарын нығайту.",
  default: "Жоспарлы бақылау: жылына 2 рет визуалды тексеру."
};

function elementName(m) {
  const t = m.geometry.type, role = m.userData.role;
  if (role === "dome" || t === "SphereGeometry" || t === "LatheGeometry") return "Күмбез / жабын";
  if (t === "CylinderGeometry") return "Мұнара / барабан";
  if (t === "ExtrudeGeometry") return m.material.userData.kind === "dark" ? "Арка тауашасы" : "Пештақ жиегі / арка";
  if (t === "BoxGeometry") {
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    return m.geometry.boundingBox.max.y < 1 ? "Іргетас" : "Қабырға / портал";
  }
  return "Құрылыс элементі";
}

// Детерминистік «тозу» бағасы: материал × жас × биіктік (ылғал төменгі бөлікке көбірек әсер етеді)
function attributes(m, v, obj) {
  const box = new THREE.Box3().setFromObject(m), size = box.getSize(new THREE.Vector3());
  const H = v.box.max.y - v.box.min.y || 1, rel = (box.min.y - v.box.min.y) / H;
  const kind = m.material.userData.kind || "brick", age = 21 - obj.s;
  const wear = Math.min(92, Math.round((age * 3.2 + (1 - rel) * 22) * (MAT_WEAR[kind] || 1) * (obj.unesco ? .7 : 1)));
  const hum = Math.round(34 + (1 - rel) * 30 + (obj.region === "syr" ? 8 : 0));
  return {
    name: elementName(m), kind, mat: MAT_NAME[kind] || kind, wear, hum,
    level: `${(box.min.y - v.box.min.y).toFixed(1)} – ${(box.max.y - v.box.min.y).toFixed(1)} м`,
    dims: `${size.x.toFixed(1)} × ${size.y.toFixed(1)} × ${size.z.toFixed(1)} м`,
    state: wear > 60 ? ["alert", "Нашар"] : wear > 35 ? ["warn", "Қанағаттанарлық"] : ["ok", "Жақсы"],
    action: ACTION[kind] || ACTION.default
  };
}

let api, sel = null, down = null, handlers = null;

function highlight(m) {
  if (sel) { sel.material.emissive && sel.material.emissive.setHex(0); }
  sel = m;
  if (m && m.material.emissive) { m.material.emissive.setHex(0x1aa6c4); m.material.emissiveIntensity = .45; }
}

function summary(v, obj) {
  const counts = {};
  v.model.traverse(o => { if (o.isMesh && o.userData.role !== "ground") { const n = elementName(o); counts[n] = (counts[n] || 0) + 1; } });
  return Object.entries(counts).map(([k, n]) => `<li><span>${k}</span><b>${n}</b></li>`).join("");
}

function showInfo(m) {
  const { v, obj, panel } = api, box = panel.querySelector("#hbInfo");
  if (!m) { box.innerHTML = `<p style="margin-top:12px"><b>Модельдегі кез келген элементті басыңыз.</b> Мысалы: күмбезді, порталды немесе мұнараны.</p>`; return; }
  const a = attributes(m, v, obj);
  const col = a.state[0] === "alert" ? "#D9473B" : a.state[0] === "warn" ? "#E0A030" : "#2F8F83";
  box.innerHTML = `
    <h3 style="font-size:22px;margin-top:14px">${a.name}</h3>
    <ul class="kv">
      <li><span>Материал</span><b>${a.mat}</b></li>
      <li><span>Биіктік деңгейі</span><b>${a.level}</b></li>
      <li><span>Габарит</span><b>${a.dims}</b></li>
      <li><span>Салынған кезең</span><b>${obj.era}</b></li>
      <li><span>Күйі</span><b><span class="state ${a.state[0]}">${a.state[1]}</span></b></li>
    </ul>
    <div style="font-size:12.5px;color:#5B6576;margin-top:8px">Тозу деңгейі · ${a.wear}%</div><div class="meter"><i style="width:${a.wear}%;background:${col}"></i></div>
    <div style="font-size:12.5px;color:#5B6576;margin-top:10px">Ылғалдылық (микроклимат) · ${a.hum}%</div><div class="meter"><i style="width:${a.hum}%;background:#1AA6C4"></i></div>
    <p style="margin-top:12px"><b style="color:#1E2430">Ұсыныс:</b> ${a.action}</p>`;
}

export default {
  enter(a) {
    api = a; const { v, panel, obj } = api;
    v.setMode("real");
    panel.innerHTML = `
      <div class="kicker">2-саты</div><h3>HBIM инспекторы</h3>
      <p>Heritage BIM моделінде әр элементтің сыртқы пішінімен қатар ақпараты да сақталады: материалы, тозу деңгейі және микроклиматы.</p>
      <div style="font-size:12px;font-weight:700;color:#5B6576;text-transform:uppercase;letter-spacing:.06em;margin-top:6px">Элементтер құрамы</div>
      <ul class="kv">${summary(v, obj)}</ul>
      <div id="hbInfo"></div>
      <div class="disclaimer">Атрибуттар модельдік есеппен шығарылады: материал түрі, ескерткіштің жасы және элементтің жерден биіктігі ескеріледі.</div>`;
    showInfo(null);
    const el = v.renderer.domElement, ray = new THREE.Raycaster(), p = new THREE.Vector2();
    handlers = {
      down: e => { down = [e.clientX, e.clientY]; },
      up: e => {
        if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
        const r = el.getBoundingClientRect();
        p.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
        ray.setFromCamera(p, v.camera);
        const targets = []; v.model.traverse(o => { if (o.isMesh && o.userData.role !== "ground" && o.visible) targets.push(o); });
        const hit = ray.intersectObjects(targets, false)[0];
        highlight(hit ? hit.object : null); showInfo(hit ? hit.object : null);
        if (hit) v.controls.autoRotate = false;
      }
    };
    el.addEventListener("pointerdown", handlers.down);
    el.addEventListener("pointerup", handlers.up);
    api.say("Элементті басыңыз: HBIM атрибуттары оң жақта шығады", 4000);
  },
  exit() {
    if (!api) return;
    const el = api.v.renderer.domElement;
    el.removeEventListener("pointerdown", handlers.down); el.removeEventListener("pointerup", handlers.up);
    highlight(null); api = null;
  }
};
