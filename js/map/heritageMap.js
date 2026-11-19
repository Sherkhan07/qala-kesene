// 3D карта модулі (MapLibre GL): жер бедері, спутник, 3D бағаналар, сүзгі, іздеу, саяхат.
// maplibregl — глобал UMD скрипт ретінде жүктеледі.
import { REGIONS, roman, titleOf, url, byId } from "../data/heritage.js";
import { esc } from "../core/layout.js";

export const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const SAT_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const DEM_TILES = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

function circle(lon, lat, km, steps = 32) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = i / steps * 2 * Math.PI;
    pts.push([lon + km / (111.32 * Math.cos(lat * Math.PI / 180)) * Math.cos(a), lat + km / 110.57 * Math.sin(a)]);
  }
  return [pts];
}

// Жер бедері + спутник қабатын кез келген картаға қосу
export function addTerrain(map, { exaggeration = 1.6, hillshade = true } = {}) {
  const firstSymbol = (map.getStyle().layers.find(l => l.type === "symbol") || {}).id;
  map.addSource("sat", { type: "raster", tiles: [SAT_TILES], tileSize: 256, maxzoom: 18, attribution: "Esri World Imagery" });
  map.addLayer({ id: "sat", type: "raster", source: "sat", layout: { visibility: "none" } }, firstSymbol);
  map.addSource("dem", { type: "raster-dem", tiles: [DEM_TILES], tileSize: 256, encoding: "terrarium", maxzoom: 13, attribution: "AWS Terrain Tiles" });
  if (hillshade) {
    map.addSource("dem-h", { type: "raster-dem", tiles: [DEM_TILES], tileSize: 256, encoding: "terrarium", maxzoom: 13 });
    map.addLayer({ id: "hill", type: "hillshade", source: "dem-h", paint: { "hillshade-exaggeration": .45, "hillshade-shadow-color": "#5a4630" } }, firstSymbol);
  }
  map.setTerrain({ source: "dem", exaggeration });
}

export class HeritageMap {
  /**
   * @param {HTMLElement} shell — .map-shell элементі
   * @param {object} cfg — { kind, data, center, zoom, radiusKm, flyZoom, height(o), short(o), legendNote, route? }
   */
  constructor(shell, cfg) {
    this.shell = shell; this.cfg = cfg;
    this.regions = REGIONS[cfg.kind];
    this.active = new Set(Object.keys(this.regions));
    this.q = ""; this.century = 0; this.sel = null; this.markers = new Map(); this.popup = null; this.touring = null; this.rot = null;
    this.$ = s => shell.querySelector(s);
    this.renderControls();
    this.renderList();
    if (!window.maplibregl) { this.$(".map-err").style.display = "flex"; return; }
    this.initMap();
  }

  visible(o) {
    const q = this.q, c = this.century;
    // «Уақыт машинасы»: таңдалған ғасырда бар нысандар (қала — s..e аралығында, кесене — салынғаннан бері)
    if (c && (o.s > c || (o.kind === "city" && o.e < c))) return false;
    return this.active.has(o.region) && (!q || o.name.toLowerCase().includes(q) || (o.alt || "").toLowerCase().includes(q) || o.loc.toLowerCase().includes(q));
  }
  visibleItems() { return this.cfg.data.filter(o => this.visible(o)); }

  renderControls() {
    const { regions } = this, keys = Object.keys(regions);
    this.$("[data-legend]").innerHTML =
      Object.values(regions).map(r => `<div><i style="background:${r.color}"></i>${r.name}</div>`).join("") +
      (this.cfg.route ? `<div><i style="background:#C8902E;height:3px;border-radius:0"></i>Ұлы Жібек жолы (шартты)</div>` : "") +
      `<div style="margin-top:6px;color:#6B6457">▮ ${this.cfg.legendNote}</div>`;
    const f = this.$("[data-filters]");
    f.innerHTML = `<button class="chip on" data-r="*">Барлығы</button>` + keys.map(k => `<button class="chip on" data-r="${k}"><i style="background:${regions[k].color}"></i>${regions[k].name}</button>`).join("");
    f.addEventListener("click", e => {
      const b = e.target.closest(".chip"); if (!b) return;
      const k = b.dataset.r, all = this.active.size === keys.length;
      if (k === "*") this.active = new Set(all ? [] : keys);
      else this.active.has(k) ? this.active.delete(k) : this.active.add(k);
      f.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c.dataset.r === "*" ? this.active.size === keys.length : this.active.has(c.dataset.r)));
      this.refresh();
    });
    this.initTimeline();
    this.$("[data-search]").addEventListener("input", e => { this.q = e.target.value.trim().toLowerCase(); this.refresh(); });
    const list = this.$("[data-list]");
    list.addEventListener("click", e => { const b = e.target.closest(".item"); if (b) this.select(b.dataset.id, true); });
    list.addEventListener("mouseover", e => { const b = e.target.closest(".item"); this.markers.forEach((m, id) => m.getElement().classList.toggle("hl", !!b && b.dataset.id === id)); });
    list.addEventListener("mouseleave", () => this.markers.forEach(m => m.getElement().classList.remove("hl")));
    this.$(".map-tools").addEventListener("click", e => { const b = e.target.closest(".tool"); if (b) this.tool(b.dataset.act, b); });
  }

  initTimeline() {
    const range = this.$("[data-tl]"), label = this.$("[data-cent]"), play = this.$("[data-tl-play]");
    const set = c => {
      this.century = c; range.value = c;
      label.textContent = c ? `${roman(c)} ғасыр · ${this.visibleItems().length} нысан` : "Барлық ғасырлар";
      this.refresh();
    };
    range.addEventListener("input", () => { this.stopPlay(); set(+range.value); });
    this.stopPlay = () => { clearInterval(this.tlTimer); this.tlTimer = null; play.textContent = "▶"; play.classList.remove("on"); };
    play.onclick = () => {
      if (this.tlTimer) return this.stopPlay();
      play.textContent = "■"; play.classList.add("on");
      let c = 1; set(c);
      this.tlTimer = setInterval(() => { c++; if (c > 20) { this.stopPlay(); set(0); } else set(c); }, 1300);
    };
  }

  renderList() {
    let html = "";
    Object.entries(this.regions).forEach(([k, r]) => {
      const items = this.cfg.data.filter(o => o.region === k && this.visible(o));
      if (!items.length) return;
      html += `<div class="grp">${r.name} · ${items.length}</div>`;
      html += items.map(o => `<button class="item${this.sel === o.id ? " active" : ""}" data-id="${o.id}"><b><span class="dot" style="background:${r.color}"></span>${esc(titleOf(o))}</b><small>${o.era} · ${esc(o.loc)}</small></button>`).join("");
    });
    this.$("[data-list]").innerHTML = html || `<p style="padding:14px;color:var(--muted);font-size:14px">Ештеңе табылмады</p>`;
    const c = this.$("[data-count]"); if (c) c.textContent = `${this.visibleItems().length} / ${this.cfg.data.length}`;
  }

  refresh() {
    this.renderList();
    this.markers.forEach((m, id) => m.getElement().classList.toggle("dim", !this.visible(byId(id))));
    if (this.map && this.map.getLayer("pillars")) this.map.setFilter("pillars", ["in", ["get", "id"], ["literal", this.visibleItems().map(o => o.id)]]);
  }

  initMap() {
    const { cfg } = this;
    const map = this.map = new maplibregl.Map({
      container: this.$(".map"), style: STYLE_URL, center: cfg.center, zoom: cfg.zoom, pitch: 52, bearing: -12, maxPitch: 80,
      attributionControl: { compact: true }
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-right");
    map.scrollZoom.disable();
    map.getContainer().addEventListener("click", () => map.scrollZoom.enable(), { once: true });
    let ok = false;
    setTimeout(() => { if (!ok) this.$(".map-err").style.display = "flex"; }, 20000);

    map.once("style.load", () => {
      ok = true;
      addTerrain(map);
      if (cfg.route) {
        const coords = cfg.route.map(id => { const o = byId(id); return [o.lon, o.lat]; });
        map.addSource("route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } } });
        map.addLayer({ id: "route-glow", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#E8B04B", "line-width": 9, "line-opacity": .25, "line-blur": 4 } });
        map.addLayer({ id: "route", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#C8902E", "line-width": 3, "line-dasharray": [2, 1.5] } });
      }
      map.addSource("pillars", { type: "geojson", data: { type: "FeatureCollection", features: cfg.data.map(o => ({
        type: "Feature", properties: { id: o.id, color: this.regions[o.region].color, h: cfg.height(o) },
        geometry: { type: "Polygon", coordinates: circle(o.lon, o.lat, cfg.radiusKm) }
      })) } });
      map.addLayer({ id: "pillars", type: "fill-extrusion", source: "pillars", maxzoom: 10.5, paint: {
        "fill-extrusion-color": ["get", "color"], "fill-extrusion-height": ["get", "h"], "fill-extrusion-opacity": .85 } });
      map.on("click", "pillars", e => this.select(e.features[0].properties.id, true));
      map.on("mouseenter", "pillars", () => map.getCanvas().style.cursor = "pointer");
      map.on("mouseleave", "pillars", () => map.getCanvas().style.cursor = "");
      this.refresh();
      const focus = new URLSearchParams(location.search).get("focus");
      if (focus && byId(focus)) setTimeout(() => this.select(focus, true), 600);
    });

    cfg.data.forEach(o => {
      const el = document.createElement("div"); el.className = "mk";
      el.innerHTML = `<span class="pin" style="background:${this.regions[o.region].color}"></span><span class="lbl">${esc(cfg.short(o))}</span>`;
      el.addEventListener("click", ev => { ev.stopPropagation(); this.select(o.id, true); });
      this.markers.set(o.id, new maplibregl.Marker({ element: el, anchor: "left", offset: [-7, 0] }).setLngLat([o.lon, o.lat]).addTo(map));
    });
    map.on("mousedown", () => this.stopRotate()); map.on("touchstart", () => this.stopRotate());
  }

  select(id, fly) {
    const o = byId(id); if (!o || !this.map) return;
    this.sel = id; this.renderList();
    const c = this.regions[o.region].color;
    if (this.popup) this.popup.remove();
    this.popup = new maplibregl.Popup({ offset: 18, maxWidth: "320px" }).setLngLat([o.lon, o.lat]).setHTML(
      `<div class="pop"><h4>${esc(titleOf(o))}</h4><span class="badge" style="background:${c}">${o.era}</span>${o.unesco ? ' <span class="badge" style="background:#0F2942">ЮНЕСКО</span>' : ""}
       <p>${esc(o.desc)}</p><div class="loc">📍 ${esc(o.loc)} · ${o.lat.toFixed(4)}°, ${o.lon.toFixed(4)}°</div>
       <div class="acts"><a href="${url(o)}">3D модель →</a><button data-back>Бүкіл карта</button></div></div>`
    ).addTo(this.map);
    this.popup.getElement().querySelector("[data-back]").onclick = () => { this.popup.remove(); this.reset(); };
    if (fly) { this.stopRotate(); this.map.flyTo({ center: [o.lon, o.lat], zoom: this.cfg.flyZoom, pitch: 62, bearing: (this.map.getBearing() + 40) % 360, duration: 3200, essential: true }); }
    const item = this.$(`.item[data-id="${id}"]`); if (item) item.scrollIntoView({ block: "nearest" });
  }

  reset() {
    this.stopRotate(); this.sel = null; this.renderList();
    this.map.flyTo({ center: this.cfg.center, zoom: this.cfg.zoom, pitch: 52, bearing: -12, duration: 2200 });
  }

  stopRotate() { cancelAnimationFrame(this.rot); this.rot = null; this.$('[data-act="rotate"]').classList.remove("on"); }

  tool(act, b) {
    const map = this.map; if (!map) return;
    if (act === "sat") { const on = b.classList.toggle("on"); map.getLayer("sat") && map.setLayoutProperty("sat", "visibility", on ? "visible" : "none"); }
    if (act === "route") { const on = b.classList.toggle("on"); ["route", "route-glow"].forEach(l => map.getLayer(l) && map.setLayoutProperty(l, "visibility", on ? "visible" : "none")); }
    if (act === "reset") this.reset();
    if (act === "rotate") {
      if (this.rot) return this.stopRotate();
      b.classList.add("on");
      const spin = () => { map.setBearing(map.getBearing() + .12); this.rot = requestAnimationFrame(spin); }; spin();
    }
    if (act === "tour") this.tour(b);
  }

  // Нысандарды кезекпен аралау (маршрут болса — сол бағытпен)
  tour(btn) {
    const stop = () => { clearTimeout(this.touring); this.touring = null; btn.classList.remove("on"); btn.textContent = "▶ Саяхат"; };
    if (this.touring) return stop();
    const order = (this.cfg.route || this.cfg.data.map(o => o.id)).filter(id => this.visible(byId(id)));
    let k = 0; btn.classList.add("on"); btn.textContent = "■ Тоқтату";
    const next = () => { if (k >= order.length) { stop(); this.reset(); return; } this.select(order[k++], true); this.touring = setTimeout(next, 6500); };
    next();
  }
}

// Қалалар хронологиясы (ғасыр бойынша жолақтар)
export function renderChronology(el, items, onPick) {
  const pct = c => (c - 1) / 19 * 100;
  let html = `<div class="ch-axis"><div></div><div class="ch-ticks">${[1, 4, 7, 10, 13, 16, 19].map(c => `<span style="left:${pct(c) + 100 / 38}%">${roman(c)}</span>`).join("")}</div></div>`;
  [...items].sort((a, b) => a.s - b.s).forEach(o => {
    html += `<div class="ch-row" data-id="${o.id}"><div>${esc(o.name)}</div><div class="ch-track"><div class="ch-bar" title="${o.era}" style="left:${pct(o.s)}%;width:${(o.e - o.s + 1) / 19 * 100}%;background:${REGIONS[o.kind][o.region].color}"></div></div></div>`;
  });
  el.innerHTML = html;
  el.addEventListener("click", e => { const r = e.target.closest(".ch-row"); if (r) onPick(r.dataset.id); });
}

// Карта қабықшасының HTML үлгісі (екі карта бетіне ортақ)
export function mapShellHTML({ placeholder, route = false }) {
  return `
  <div class="map-shell">
    <aside class="side">
      <div class="filters" data-filters></div>
      <div class="timeline">
        <div class="tl-head"><span>Уақыт машинасы</span><b data-cent>Барлық ғасырлар</b></div>
        <div class="tl-row"><button class="tool" data-tl-play title="Ғасырларды автоматты өту">▶</button>
          <input type="range" min="0" max="20" value="0" data-tl aria-label="Ғасыр"></div>
      </div>
      <div class="search"><input type="search" placeholder="${placeholder}" data-search aria-label="Іздеу"></div>
      <div class="list" data-list></div>
    </aside>
    <div class="map-wrap">
      <div class="map"></div>
      <div class="map-tools">
        <button class="tool" data-act="sat">Спутник</button>
        ${route ? '<button class="tool on" data-act="route">Жібек жолы</button>' : ""}
        <button class="tool" data-act="tour">▶ Саяхат</button>
        <button class="tool" data-act="rotate">Айналдыру</button>
        <button class="tool" data-act="reset">Бастапқы көрініс</button>
      </div>
      <div class="legend" data-legend></div>
      <div class="map-err">Карта жүктелмеді. Интернет байланысын тексеріңіз.</div>
    </div>
  </div>`;
}
