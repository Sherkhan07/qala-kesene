import { mountLayout, esc } from "../core/layout.js";
import { CITIES, SILK_ROUTE, REGIONS, url } from "../data/heritage.js";
import { HeritageMap, renderChronology, mapShellHTML } from "../map/heritageMap.js";

mountLayout();

const mount = document.getElementById("mapMount");
mount.innerHTML = mapShellHTML({ placeholder: "Қаланы іздеу…", route: true });
const hm = new HeritageMap(mount.firstElementChild, {
  kind: "city", data: CITIES, route: SILK_ROUTE,
  center: [67.2, 46.4], zoom: 4.15, radiusKm: 14, flyZoom: 14.2,
  height: o => (o.e - o.s + 1) * 14000, short: o => o.name,
  legendNote: "Бағана биіктігі = ғасырлар саны"
});

renderChronology(document.getElementById("chrono"), CITIES, id => {
  mount.scrollIntoView({ behavior: "smooth", block: "center" });
  hm.select(id, true);
});

// Қала карточкалары: модель параметрлерінен қысқаша сипаттама жасалады
const features = m => [
  m.citadel && "цитадель", m.outerWall && "сыртқы қорған", m.river && "өзен жағасы", m.kariz && "кәріз жүйесі",
  m.mountains && "тау бөктері", m.landmark && "кесене", m.mound > 5 && "биік төбе"
].filter(Boolean);
document.getElementById("cards").innerHTML = CITIES.map(o => `
  <a class="card" href="${url(o)}" style="text-decoration:none;display:block">
    <span class="badge" style="background:${REGIONS.city[o.region].color}">${o.era}</span>
    <h3 style="margin-top:10px">${esc(o.name)}${o.alt ? ` <span class="muted" style="font-size:18px">(${esc(o.alt)})</span>` : ""}</h3>
    <p>${esc(o.desc)}</p>
    <p style="margin-top:10px;font-size:13px">${features(o.model).map(f => `<span class="badge outline">${f}</span>`).join(" ")}</p>
    <p style="margin-top:12px;color:var(--terra);font-weight:600">3D реконструкция →</p>
  </a>`).join("");
