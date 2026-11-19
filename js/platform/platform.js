// ArchHeritage VR платформасының басқарушысы.
// Модульдер бірдей интерфейсті ұстанады: { enter(api), exit(), onModel?() }.
// URL: platform.html?id=<кесене>#<модуль>  (модуль: lidar | hbim | twin | xr | time | build)
import { mountLayout, esc } from "../core/layout.js";
import { MAUSOLEUMS, REGIONS, byId } from "../data/heritage.js";
import { createViewer } from "../three/viewer.js";
import { buildMausoleum } from "../three/mausoleum.js";
import { healthOf, gaugeSVG } from "./sim.js";
import lidar from "./lidar.js";
import hbim from "./hbim.js";
import twin from "./monitor.js";
import xr from "./xr.js";
import time from "./timeline.js";
import build from "./constructor.js";

mountLayout();
const MODULES = { lidar, hbim, twin, xr, time, build };

const $ = id => document.getElementById(id);
const host = $("pfView"), panel = $("panel"), hud = $("hud"), gauges = $("gauges"), msgEl = $("msg");
const params = new URLSearchParams(location.search);

const state = {
  obj: byId(params.get("id")) && byId(params.get("id")).kind === "mausoleum" ? byId(params.get("id")) : byId("yasawi"),
  mod: MODULES[location.hash.slice(1)] ? location.hash.slice(1) : "twin",
  view: "viz"
};

// нысан тізімі (өңір бойынша топталған)
$("objSel").innerHTML = Object.entries(REGIONS.mausoleum).map(([k, r]) =>
  `<optgroup label="${r.name}">${MAUSOLEUMS.filter(o => o.region === k).map(o => `<option value="${o.id}">${esc(o.name)}</option>`).join("")}</optgroup>`).join("");
$("objSel").value = state.obj.id;

const v = createViewer(host, {
  onScan: t => { $("scan").firstElementChild.style.width = `${Math.round(t * 100)}%`; }
});

let msgTimer;
const api = {
  v, host, panel, hud, gauges,
  get obj() { return state.obj; },
  // қысқа хабарлама (сахнаның төменгі жағында)
  say(text, ms = 2600) { msgEl.textContent = text; msgEl.classList.add("show"); clearTimeout(msgTimer); if (ms) msgTimer = setTimeout(() => msgEl.classList.remove("show"), ms); },
  hush() { msgEl.classList.remove("show"); },
  loadObjectModel() { v.setModel(buildMausoleum(state.obj.model)); v.setMode("real"); },
  timeline(show) { $("tlBar").classList.toggle("show", show); }
};

function clearStage() {
  hud.innerHTML = ""; gauges.innerHTML = ""; panel.innerHTML = "";
  $("scan").style.display = "none"; $("petroBox").classList.remove("show");
  api.timeline(false); api.hush();
}

let current = null;
function setModule(id, { push = true } = {}) {
  if (current) current.exit();
  clearStage();
  state.mod = id; current = MODULES[id];
  document.querySelectorAll("[data-mod]").forEach(b => b.classList.toggle("on", b.dataset.mod === id));
  document.querySelectorAll("[data-go]").forEach(b => b.classList.toggle("on", b.dataset.go === id));
  $("objSel").disabled = id === "build";
  if (push) history.replaceState(null, "", `?id=${state.obj.id}#${id}`);
  if (state.view === "dash") showDashboard(); else current.enter(api);
}

function setObject(id) {
  state.obj = byId(id);
  $("objSel").value = id;
  if (current) current.exit();
  clearStage();
  if (state.mod !== "build") api.loadObjectModel();
  history.replaceState(null, "", `?id=${id}#${state.mod}`);
  current.enter(api);
}

// ---------- Дашборд: барлық кесенелердің мониторинг жағдайы ----------
function showDashboard() {
  const rows = MAUSOLEUMS.map(o => ({ o, h: healthOf(o) })).sort((a, b) => a.h.index - b.h.index);
  const cls = x => x < 55 ? "alert" : x < 72 ? "warn" : "ok";
  hud.innerHTML = "";
  panel.innerHTML = `
    <div class="kicker">Дашборд</div><h3>Мұра портфелі</h3>
    <p>18 кесененің шартты «сақталу индексі» (0–100). Индекс ескерткіштің жасына, материалына, өңірдің ылғалдылығына және конструкция типіне қарай есептеледі. Ең жоғарғы басымдықтағы нысандар тізімнің басында тұр.</p>
    <ul class="kv">${rows.map(({ o, h }) => `<li style="cursor:pointer" data-pick="${o.id}"><span>${esc(o.name)}</span><b><span class="state ${cls(h.index)}">${h.index}</span></b></li>`).join("")}</ul>
    <div class="disclaimer">Индекс — модельдік бағалау, нақты техникалық сараптама емес.</div>`;
  const avg = Math.round(rows.reduce((s, r) => s + r.h.index, 0) / rows.length);
  gauges.innerHTML = [
    ["Орташа индекс", avg, 100, ""], ["Жоғары қауіп", rows.filter(r => r.h.index < 55).length, 18, " нысан"], ["Бақылауда", rows.filter(r => r.h.index >= 55 && r.h.index < 72).length, 18, " нысан"]
  ].map(([t, val, max]) => gaugeSVG(t, val, max, String(val))).join("");
  panel.querySelectorAll("[data-pick]").forEach(li => li.onclick = () => {
    state.view = "viz"; syncSeg();
    state.obj = byId(li.dataset.pick); $("objSel").value = state.obj.id;
    api.loadObjectModel();
    setModule(state.mod === "build" ? "twin" : state.mod); // конструкторда нысан жоқ — егіз мониторына өтеміз
  });
}
function syncSeg() { document.querySelectorAll("[data-view]").forEach(b => b.classList.toggle("on", b.dataset.view === state.view)); }

// ---------- оқиғалар ----------
$("rail").onclick = e => { const b = e.target.closest("[data-mod]"); if (b) { state.view = "viz"; syncSeg(); setModule(b.dataset.mod); } };
$("steps").onclick = e => { const b = e.target.closest("[data-go]"); if (b) { state.view = "viz"; syncSeg(); setModule(b.dataset.go); document.querySelector(".device").scrollIntoView({ behavior: "smooth", block: "center" }); } };
$("objSel").onchange = e => setObject(e.target.value);
$("viewSeg").onclick = e => {
  const b = e.target.closest("[data-view]"); if (!b || b.dataset.view === state.view) return;
  state.view = b.dataset.view; syncSeg(); setModule(state.mod);
};
window.addEventListener("hashchange", () => { const id = location.hash.slice(1); if (MODULES[id] && id !== state.mod) setModule(id, { push: false }); });

api.loadObjectModel();
setModule(state.mod);
