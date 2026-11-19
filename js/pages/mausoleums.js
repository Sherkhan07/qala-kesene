import { mountLayout, esc } from "../core/layout.js";
import { MAUSOLEUMS, REGIONS, MODEL_TYPE_LABEL, url } from "../data/heritage.js";
import { HeritageMap, mapShellHTML } from "../map/heritageMap.js";

mountLayout();

const mount = document.getElementById("mapMount");
mount.innerHTML = mapShellHTML({ placeholder: "Кесенені іздеу…" });
new HeritageMap(mount.firstElementChild, {
  kind: "mausoleum", data: MAUSOLEUMS,
  center: [67.6, 45.3], zoom: 4.6, radiusKm: 6, flyZoom: 16.3,
  height: o => (21 - o.s) * 16000,
  short: o => o.name.replace(/ (кесенесі|кешені)$/, ""),
  legendNote: "Бағана биіктігі = көнелігі"
});

// Типология: модель түрі бойынша топтау
const groups = {};
MAUSOLEUMS.forEach(o => (groups[o.model.type] ||= []).push(o));
document.getElementById("types").innerHTML = Object.entries(groups)
  .sort((a, b) => b[1].length - a[1].length)
  .map(([type, list]) => `
    <h3 style="font-size:28px;margin:28px 0 12px">${MODEL_TYPE_LABEL[type]} <span class="muted" style="font-size:18px">· ${list.length}</span></h3>
    <div class="grid g3">${list.sort((a, b) => a.s - b.s).map(o => `
      <a class="card" href="${url(o)}" style="text-decoration:none;display:block">
        <span class="badge" style="background:${REGIONS.mausoleum[o.region].color}">${o.era}</span>
        ${o.unesco ? '<span class="badge" style="background:#0F2942">ЮНЕСКО</span>' : ""}
        <h3 style="margin-top:10px">${esc(o.name)}</h3>
        <p>${esc(o.loc)}</p>
        <p style="margin-top:12px;color:var(--terra);font-weight:600">3D модель →</p>
      </a>`).join("")}</div>`).join("");
