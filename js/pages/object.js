// Нысан беті: object.html?id=<id>
// 3D модель (4 режим) + деректер + шағын 3D карта + цифрлық сақтау жоспары + жақын нысандар.
import { mountLayout, esc } from "../core/layout.js";
import { byId, CITIES, MAUSOLEUMS, KIND_LABEL, MODEL_TYPE_LABEL, MODEL_TYPE_DESC, regionOf, titleOf, url, nearest, preservationPlan, roman } from "../data/heritage.js";
import { STYLE_URL, addTerrain } from "../map/heritageMap.js";

mountLayout();
const root = document.getElementById("obj");
const o = byId(new URLSearchParams(location.search).get("id"));

if (!o) {
  root.innerHTML = `<div class="wrap page-head"><h1>Нысан табылмады</h1><p>Сілтеме қате болуы мүмкін. <a href="cities.html">Қалалар</a> немесе <a href="mausoleums.html">кесенелер</a> тізімінен таңдаңыз.</p></div>`;
} else render(o);

function render(o) {
  const isCity = o.kind === "city", reg = regionOf(o);
  const list = isCity ? CITIES : MAUSOLEUMS, i = list.indexOf(o);
  const prev = list[(i - 1 + list.length) % list.length], next = list[(i + 1) % list.length];
  const listPage = isCity ? "cities.html" : "mausoleums.html";
  document.title = `${o.name} · Qala&Kesene`;

  const MODES = isCity
    ? { real: ["Тарихи реконструкция", `Қаланың гүлденген кезеңіндегі схемалық көрінісі: ${o.model.mound > 3 ? "төбе үстіндегі " : ""}шахристан, мұнаралы қабырғалар мен ${o.model.gates} қақпа${o.model.citadel ? ", цитадель" : ""}, жұма мешіті мен мұнара, базар, қала сыртындағы рабад${o.model.outerWall ? " және оның қорғаны" : ""}${o.model.kariz ? ", кәріз құдықтарының тізбегі" : ""}${o.model.river ? ", өзен" : ""}${o.model.mountains ? ", алыстағы таулар" : ""}${o.model.landmark ? ". Цитадельде — Қожа Ахмет Ясауи кесенесі" : ""}.`],
        ruin: ["Қазіргі күй", "Бүгінгі қалашық: қабырғалар мен мұнаралар бастапқы биіктігінің 30%-ына дейін мүжілген, үйлер мен базардың орнында тек төмпешіктер қалған. Цифрлық сақтау дәл осы күйден басталады."],
        twin: ["Цифрлық егіз", "Түстер — шартты қауіп картасы: қызыл — эрозия мен жерасты суларының әсері күшті төменгі қабаттар, көк — қауіпі аз жоғарғы бөліктер. Көгілдір нүктелер — мониторинг датчиктері."],
        lidar: ["LiDAR / аэрофотограмметрия", "Дроннан түсірілген нүктелер бұлтының үлгісі: беттерден іріктелген нүктелер төменнен жоғары қарай «сканерленеді». Нақты түсірілімде миллиондаған нүкте болады."] }
    : { real: ["Тарихи көрініс", `${MODEL_TYPE_LABEL[o.model.type]}: ${MODEL_TYPE_DESC[o.model.type]}. Модель параметрлер бойынша жиналған схемалық реконструкция.`],
        twin: ["Цифрлық егіз", "Түстер — конструкциядағы шартты жүктеме: қызыл — іргетас пен порталдағы жоғары кернеу, көк — күмбездің жеңіл бөлігі. Көгілдір нүктелер — ылғал, діріл және жарықшақ датчиктері."],
        lidar: ["LiDAR сканерлеу", "Жердегі лазерлік сканердің (TLS) нүктелер бұлты үлгісі. Мұндай бұлттан HBIM моделі мен реставрациялық сызбалар жасалады."] };

  const age = isCity ? `${o.e - o.s + 1} ғасыр (${roman(o.s)}–${roman(o.e)})` : `≈ ${21 - o.s} ғасыр бұрын`;
  const near = nearest(o, 4);

  root.innerHTML = `
  <div class="wrap page-head">
    <div class="crumbs"><a href="index.html">Басты бет</a> / <a href="${listPage}">${isCity ? "Қалалар" : "Кесенелер"}</a> / ${esc(o.name)}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
      <span class="badge" style="background:${reg.color}">${o.era}</span>
      <span class="badge outline">${KIND_LABEL[o.kind]}</span>
      <span class="badge outline">${reg.name}</span>
      ${o.unesco ? '<span class="badge" style="background:#0F2942">ЮНЕСКО мұрасы</span>' : ""}
    </div>
    <h1>${esc(titleOf(o))}</h1>
    <p>${esc(o.desc)}</p>
  </div>

  <div class="wrap obj-grid">
    <div class="obj-viewer">
      <div class="viewer" id="view">
        <div class="viewer-tools">
          ${Object.entries(MODES).map(([k, [t]], j) => `<button class="tool${j ? "" : " on"}" data-mode="${k}">${t.split(" /")[0]}</button>`).join("")}
          <span class="sp"></span>
          <button class="tool on" id="spin" title="Автоматты айналдыру">⟳</button>
          <button class="tool" id="snap" title="Суретке түсіру">📷</button>
          <button class="tool" id="glb" title="3D модельді .glb форматында жүктеу (Blender, AR)">⬇ GLB</button>
        </div>
        <div class="scan" id="scan"><i></i></div>
        <div class="viewer-stats" id="stats" hidden></div>
        <div class="viewer-note">Схемалық реконструкция · нақты өлшем емес</div>
        <div class="loading" id="loading">3D модель жиналуда…</div>
      </div>
      <div class="mode-info" id="modeInfo"></div>
    </div>

    <aside class="card">
      <h3>Нысан туралы</h3>
      <ul class="facts">
        <li><span>Түрі</span><b>${isCity ? "Ортағасырлық қала" : MODEL_TYPE_LABEL[o.model.type]}</b></li>
        <li><span>Дәуірі</span><b>${o.era}</b></li>
        <li><span>${isCity ? "Өмір сүрген кезеңі" : "Жасы"}</span><b>${age}</b></li>
        <li><span>Орналасқан жері</span><b>${esc(o.loc)}</b></li>
        <li><span>Координаталар</span><b style="font-family:ui-monospace,monospace;font-size:13px">${o.lat.toFixed(4)}° N, ${o.lon.toFixed(4)}° E</b></li>
        <li><span>Өңір</span><b>${reg.name}</b></li>
      </ul>
      <div class="mini-map" id="miniMap"></div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <a class="btn primary sm" href="${listPage}?focus=${o.id}">3D картада ашу</a>
        <a class="btn ghost sm" href="registry.html">Тізілім</a>
        ${isCity ? "" : `<a class="btn ghost sm" href="platform.html?id=${o.id}#twin">ArchHeritage VR →</a>`}
      </div>
    </aside>
  </div>

  <section>
    <div class="wrap grid g2" style="align-items:start;gap:32px">
      <div>
        <div class="sec-head" style="margin-bottom:18px"><div class="eyebrow">Цифрлық сақтау</div><h2>Ұсынылатын жұмыс жоспары</h2><p>Жоспар нысанның түрі мен ерекшеліктеріне (кәріз, өзен, өрнек, көнелік) қарай автоматты түрде құрылады.</p></div>
        <ol class="plan">${preservationPlan(o).map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join("")}</ol>
      </div>
      <div>
        <div class="sec-head" style="margin-bottom:18px"><div class="eyebrow">Маңайы</div><h2>Жақын нысандар</h2><p>Түзу сызықпен есептелген қашықтық бойынша.</p></div>
        <div class="near">${near.map(({ o: x, km }) => `<a href="${url(x)}"><small>${KIND_LABEL[x.kind]} · ${km < 1 ? Math.round(km * 1000) + " м" : Math.round(km) + " км"}</small><br><b>${esc(x.name)}</b><br><small>${x.era}</small></a>`).join("")}</div>
        <div class="pager">
          <a class="btn ghost" href="${url(prev)}">← ${esc(prev.name)}</a>
          <a class="btn ghost" href="${url(next)}">${esc(next.name)} →</a>
        </div>
      </div>
    </div>
  </section>`;

  init3D(o, MODES);
  initMiniMap(o);
}

async function init3D(o, MODES) {
  const host = document.getElementById("view"), info = document.getElementById("modeInfo");
  const stats = document.getElementById("stats"), scan = document.getElementById("scan");
  const setInfo = m => info.innerHTML = `<b>${MODES[m][0]}.</b> ${MODES[m][1]}`;
  setInfo("real");
  try {
    const [{ createViewer }, builder] = await Promise.all([
      import("../three/viewer.js"),
      o.kind === "city" ? import("../three/city.js") : import("../three/mausoleum.js")
    ]);
    const model = o.kind === "city" ? builder.buildCity(o) : builder.buildMausoleum(o.model);
    const v = createViewer(host, {
      onFrame: (mode, text) => { stats.hidden = !text; stats.textContent = text; },
      onScan: t => { scan.firstElementChild.style.width = `${Math.round(t * 100)}%`; },
      onInteract: () => document.getElementById("spin").classList.remove("on")
    });
    v.setModel(model, { view: o.kind === "city" ? "top" : "front" });
    document.getElementById("loading").remove();

    host.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => {
      host.querySelectorAll("[data-mode]").forEach(x => x.classList.toggle("on", x === b));
      v.setMode(b.dataset.mode); setInfo(b.dataset.mode);
      scan.style.display = b.dataset.mode === "lidar" ? "block" : "none";
    });
    document.getElementById("spin").onclick = e => { v.setAutoRotate(!v.autoRotate); e.currentTarget.classList.toggle("on", v.autoRotate); };
    document.getElementById("glb").onclick = async e => {
      const b = e.currentTarget; b.disabled = true; b.textContent = "…";
      try {
        const blob = await v.exportGLB();
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${o.id}.glb`; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      } catch (err) { console.error(err); alert("GLB экспорты сәтсіз аяқталды."); }
      b.disabled = false; b.textContent = "⬇ GLB";
    };
    v.enableVR(host.querySelector(".viewer-tools"));
    document.getElementById("snap").onclick = () => {
      const a = document.createElement("a"); a.href = v.screenshot(); a.download = `${o.id}-3d.png`; a.click();
    };
  } catch (e) {
    console.error(e);
    host.innerHTML = '<div class="viewer-err">3D модель жүктелмеді. Браузер WebGL-ды қолдайтынын және интернет байланысын тексеріңіз.</div>';
  }
}

function initMiniMap(o) {
  const el = document.getElementById("miniMap");
  if (!window.maplibregl) { el.style.display = "none"; return; }
  const map = new maplibregl.Map({
    container: el, style: STYLE_URL, center: [o.lon, o.lat], zoom: o.kind === "city" ? 13.2 : 15.5,
    pitch: 55, bearing: -20, maxPitch: 75, attributionControl: { compact: true }, interactive: true
  });
  map.scrollZoom.disable();
  map.once("style.load", () => {
    addTerrain(map, { exaggeration: 1.4, hillshade: false });
    map.setLayoutProperty("sat", "visibility", "visible");
  });
  const dot = document.createElement("div"); dot.className = "mk";
  dot.innerHTML = `<span class="pin" style="background:${regionOf(o).color}"></span>`;
  new maplibregl.Marker({ element: dot }).setLngLat([o.lon, o.lat]).addTo(map);
}
