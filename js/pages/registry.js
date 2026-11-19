// ГИС тізілімі: іздеу, түр бойынша сүзу, бағандар бойынша сұрыптау, GeoJSON/CSV экспорты.
import { mountLayout, esc } from "../core/layout.js";
import { ALL, KIND_LABEL, regionOf, titleOf, url } from "../data/heritage.js";

mountLayout();

const state = { q: "", kind: "all", sort: "name", dir: 1 };
const tbody = document.getElementById("tbody"), count = document.getElementById("count");

function rows() {
  const q = state.q.toLowerCase();
  return ALL
    .filter(o => state.kind === "all" || o.kind === state.kind)
    .filter(o => !q || [o.name, o.alt || "", o.loc].some(s => s.toLowerCase().includes(q)))
    .sort((a, b) => {
      const x = a[state.sort], y = b[state.sort];
      return (typeof x === "number" ? x - y : String(x).localeCompare(String(y), "kk")) * state.dir;
    });
}

function render() {
  const r = rows();
  count.textContent = `${r.length} нысан`;
  tbody.innerHTML = r.map(o => `
    <tr data-id="${o.id}">
      <td><span class="dot" style="background:${regionOf(o).color}"></span><b>${esc(titleOf(o))}</b></td>
      <td>${KIND_LABEL[o.kind]}</td><td>${o.era}</td><td>${esc(o.loc)}</td>
      <td class="mono">${o.lat.toFixed(4)}</td><td class="mono">${o.lon.toFixed(4)}</td>
    </tr>`).join("") || `<tr><td colspan="6" class="muted">Ештеңе табылмады</td></tr>`;
  document.querySelectorAll("th").forEach(th => th.dataset.dir = th.dataset.k === state.sort ? (state.dir > 0 ? "asc" : "desc") : "");
}

document.getElementById("q").addEventListener("input", e => { state.q = e.target.value.trim(); render(); });
document.querySelectorAll("[data-kind]").forEach(b => b.onclick = () => {
  state.kind = b.dataset.kind;
  document.querySelectorAll("[data-kind]").forEach(x => x.classList.toggle("on", x === b));
  render();
});
document.querySelectorAll("th").forEach(th => th.onclick = () => {
  state.dir = state.sort === th.dataset.k ? -state.dir : 1; state.sort = th.dataset.k; render();
});
tbody.addEventListener("click", e => { const tr = e.target.closest("tr[data-id]"); if (tr) location.href = url(ALL.find(o => o.id === tr.dataset.id)); });

function download(name, text, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
document.getElementById("geojson").onclick = () => download("qala-kesene.geojson", JSON.stringify({
  type: "FeatureCollection",
  features: rows().map(o => ({
    type: "Feature", geometry: { type: "Point", coordinates: [o.lon, o.lat] },
    properties: { id: o.id, name: o.name, alt: o.alt || null, kind: o.kind, era: o.era, century_from: o.s, century_to: o.e || null, location: o.loc, region: regionOf(o).name, description: o.desc }
  }))
}, null, 2), "application/geo+json");
document.getElementById("csv").onclick = () => {
  const q = s => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const lines = [["id", "name", "kind", "era", "location", "region", "lat", "lon"].join(",")]
    .concat(rows().map(o => [o.id, o.name, KIND_LABEL[o.kind], o.era, o.loc, regionOf(o).name, o.lat, o.lon].map(q).join(",")));
  download("qala-kesene.csv", "﻿" + lines.join("\n"), "text/csv;charset=utf-8");
};

render();
