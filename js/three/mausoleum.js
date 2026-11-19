// Кесенелердің параметрлік 3D құрастырушысы.
// Әр кесене heritage.js-тегі model параметрлерінен жиналады (схемалық реконструкция).
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { mat } from "./materials.js";
import { add, boxGeo, cylGeo, domeGeo, archShape, extrude, ground } from "./geom.js";

const PLINTH = 0.8;

// Барабан + күмбез + ұшар бас (финиал)
function domeOn(g, { r, mat: dm = "brick", ribbed = false, stretch = 1 }, x, y, z) {
  const drumH = r * 0.42;
  add(g, cylGeo(r * 1.02, r * 1.02, drumH, 40), mat("brick", [Math.round(r * 1.5), 1]), x, y, z, "wall");
  add(g, domeGeo(r, { ribbed, stretch }), mat(dm, [Math.round(r * 1.2), 2]), x, y + drumH, z, "dome");
  const top = y + drumH + r * stretch;
  add(g, cylGeo(0.06 * r, 0.1 * r, r * 0.35, 8), mat("tile"), x, top - 0.05, z, "detail");
  add(g, new THREE.SphereGeometry(r * 0.08, 12, 8), mat("tile"), x, top + r * 0.38, z, "detail");
  return top;
}

// Пештақтағы сүйір аркалы тауаша + көгілдір жиек
function niche(g, w, h, x, y, z, frame = "tile") {
  add(g, extrude(archShape(w * 1.28, h + w * 0.18), 0.2), mat(frame, [2, 2]), x, y, z, "detail");
  add(g, extrude(archShape(w, h), 0.32), mat("dark"), x, y, z + 0.02, "detail");
}

function portalDome(p) {
  const g = new THREE.Group();
  const W = p.w, D = p.d, H = p.h, PH = p.portalH, PW = p.portalW, PD = Math.max(2.2, W * 0.09);
  const wall = p.mat || "brick";
  add(g, boxGeo(Math.max(W, PW) + 4, PLINTH, D + PD + 4), mat("stone", [6, 1]), 0, 0, PD / 2, "wall");
  add(g, boxGeo(W, H, D), mat(wall, [W / 3, H / 3]), 0, PLINTH, 0, "wall");
  add(g, boxGeo(PW, PH, PD), mat(wall, [PW / 3, PH / 3]), 0, PLINTH, D / 2 + PD / 2, "wall");
  add(g, boxGeo(PW + 0.4, PH * 0.035, PD + 0.4), mat("tile", [PW / 2, 1]), 0, PLINTH + PH * 0.965, D / 2 + PD / 2, "detail");
  niche(g, PW * 0.46, PH * 0.66, 0, PLINTH, D / 2 + PD);
  if (p.towers) [-1, 1].forEach(s => add(g, cylGeo(PW * 0.055, PW * 0.065, PH * 1.03, 20), mat(wall, [2, PH / 3]), s * PW / 2, PLINTH, D / 2 + PD, "wall"));
  if (p.minarets) [-1, 1].forEach(s => {
    const mx = s * (PW / 2 + 2), mz = D / 2 + PD + 1.5, mh = PH * 1.15;
    add(g, cylGeo(0.7, 1.1, mh, 20), mat(wall, [2, mh / 3]), mx, PLINTH, mz, "wall");
    add(g, cylGeo(1.2, 1, 1.2, 20), mat("tile"), mx, PLINTH + mh, mz, "detail");
  });
  if (p.guldasta) [-1, 1].forEach(sx => [-1, 1].forEach(sz => add(g, cylGeo(W * 0.04, W * 0.05, H * 1.12, 16), mat(wall, [1, H / 3]), sx * W / 2, PLINTH, sz * D / 2, "wall")));
  domeOn(g, p.dome, 0, PLINTH + H, -D * 0.04);
  if (p.rear) domeOn(g, p.rear, 0, PLINTH + H, -D * 0.33);
  return g;
}

function domedCube(p) {
  const g = new THREE.Group();
  const S = p.size, H = p.h, wall = p.mat || "brick", base = (p.hill || 0) + PLINTH;
  if (p.hill) add(g, new THREE.CylinderGeometry(S * 1.4, S * 3.2, p.hill, 9).translate(0, p.hill / 2, 0), mat("mound"), 0, 0, 0, "ground");
  add(g, boxGeo(S + 2.4, PLINTH, S + 2.4), mat("stone", [3, 1]), 0, base - PLINTH, 0, "wall");
  add(g, boxGeo(S, H, S), mat(wall, [S / 3, H / 3]), 0, base, 0, "wall");
  // шаршыдан дөңгелекке өту (сегізқырлы белдеу)
  add(g, cylGeo(S * 0.5, S * 0.56, S * 0.14, 8).rotateY(Math.PI / 8), mat(wall, [3, 1]), 0, base + H, 0, "wall");
  if (p.columns) [-1, 1].forEach(sx => [-1, 1].forEach(sz => add(g, cylGeo(S * 0.075, S * 0.085, H * 1.05, 16), mat(wall, [1, H / 3]), sx * S / 2, base, sz * S / 2, "wall")));
  if (p.portal) {
    const PW = S * 0.78, PH = H * 1.22;
    add(g, boxGeo(PW, PH, 1), mat(wall, [PW / 3, PH / 3]), 0, base, S / 2 + 0.5, "wall");
    niche(g, PW * 0.5, PH * 0.68, 0, base, S / 2 + 1, p.mat === "ornament" ? "terracotta" : "tile");
  }
  domeOn(g, p.dome, 0, base + H + S * 0.14, 0);
  return g;
}

function tentDome(p) {
  const g = new THREE.Group();
  const S = p.size, H = p.h;
  add(g, boxGeo(S + 2, PLINTH, S + 2), mat("stone", [3, 1]), 0, 0, 0, "wall");
  add(g, boxGeo(S, H, S), mat("brick", [S / 3, H / 3]), 0, PLINTH, 0, "wall");
  add(g, cylGeo(S * 0.5, S * 0.56, 0.9, 8).rotateY(Math.PI / 8), mat("brick", [3, 1]), 0, PLINTH + H, 0, "wall");
  // қырлы шатыр-күмбез: ойыс профильді Lathe, қырлары = facets
  const pts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(S * 0.52 * Math.pow(1 - t, 1.35), p.tentH * t)); }
  const tent = new THREE.LatheGeometry(pts, p.facets).translate(0, 0, 0);
  const m = add(g, tent, mat("terracotta", [p.facets / 2, 3], { flatShading: true }), 0, PLINTH + H + 0.9, 0, "dome");
  m.material.flatShading = true;
  niche(g, S * 0.4, H * 0.75, 0, PLINTH, S / 2);
  return g;
}

function longTomb(p) {
  const g = new THREE.Group();
  const L = p.len, W = p.w, H = p.h;
  add(g, boxGeo(L + 2, PLINTH, W + 2), mat("stone", [6, 1]), 0, 0, 0, "wall");
  add(g, boxGeo(L, H, W), mat("adobe", [L / 3, 1]), 0, PLINTH, 0, "wall");
  add(g, new THREE.CylinderGeometry(W / 2, W / 2, L, 24, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(-Math.PI / 2).rotateX(Math.PI / 2), mat("adobe", [L / 3, 2]), 0, PLINTH + H, 0, "dome");
  // кіреберістегі күмбезді бөлме
  add(g, boxGeo(6, 5, 6), mat("brick", [2, 2]), -L / 2 - 2.5, 0, 0, "wall");
  domeOn(g, { r: 2.4, mat: "brick" }, -L / 2 - 2.5, 5, 0);
  niche(g, 2.2, 3.2, -L / 2 - 2.5, 0, 3);
  if (p.well) {
    add(g, cylGeo(1.6, 1.8, 1, 20), mat("stone", [2, 1]), L / 2 + 6, 0, 3, "wall");
    add(g, cylGeo(1.1, 1.1, 1.02, 20), mat("dark"), L / 2 + 6, 0, 3, "detail");
    add(g, boxGeo(4, 0.3, 4), mat("roof"), L / 2 + 6, 3.2, 3, "detail");
    [[-1.7, -1.7], [1.7, -1.7], [-1.7, 1.7], [1.7, 1.7]].forEach(([dx, dz]) => add(g, cylGeo(.12, .12, 3.2, 6), mat("roof"), L / 2 + 6 + dx, 0, 3 + dz, "detail"));
  }
  return g;
}

function yurtStone(p) {
  const g = new THREE.Group();
  const R = p.r, H = p.h;
  add(g, cylGeo(R + 1.2, R + 1.4, 0.5, 32), mat("stone", [6, 1]), 0, 0, 0, "wall");
  add(g, cylGeo(R, R * 1.04, H, 28), mat("stone", [6, 2], { flatShading: true }), 0, 0.5, 0, "wall");
  const pts = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(R * (1 - Math.pow(t, 1.6)) + 0.35 * (1 - t), p.domeH * Math.sin(t * Math.PI / 2))); }
  add(g, new THREE.LatheGeometry(pts, 28), mat("stone", [6, 2], { flatShading: true }), 0, 0.5 + H, 0, "dome");
  add(g, boxGeo(1.4, 2.2, 0.6), mat("dark"), 0, 0.5, R - 0.1, "detail");
  return g;
}

// Қорқыт ата мемориалы: төрт қобыз пішінді элемент (XX ғ. заманауи сәулет — сабақтастық мысалы)
function kobyz(p) {
  const g = new THREE.Group(), H = p.h;
  add(g, cylGeo(9, 9.5, 0.6, 48), mat("concrete", [6, 1]), 0, 0, 0, "wall");
  for (let i = 0; i < 3; i++) add(g, new THREE.RingGeometry(10.5 + i * 1.4, 11.6 + i * 1.4, 48).rotateX(-Math.PI / 2), mat("concrete", [6, 1]), 0, 0.15 + i * 0.25, 0, "detail");
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(2.6, 0); s.quadraticCurveTo(3.4, H * 0.22, 2.2, H * 0.38);
  s.quadraticCurveTo(1.2, H * 0.5, 1.3, H * 0.78); s.quadraticCurveTo(1.5, H * 0.95, 2.4, H);
  s.lineTo(0, H); s.lineTo(0, 0);
  // профиль радиус бойымен сыртқа қарай созылады: төрт «қанат» жан-жаққа ашылады
  const geo = extrude(s, 0.9).scale(2.1, 1, 1).translate(0, 0, -0.45).rotateY(-Math.PI / 2).translate(0, 0, 1.3);
  for (let k = 0; k < 4; k++) {
    const m = add(g, geo, mat("concrete", [1, 3]), 0, 0.6, 0, "wall");
    m.rotation.y = k * Math.PI / 2 + Math.PI / 4;
  }
  add(g, cylGeo(1.2, 1.4, H * 0.7, 20), mat("tile"), 0, 0.6, 0, "detail");
  return g;
}

// ===================== Қожа Ахмет Ясауи кесенесі =====================
// Нақты сәулетіне жақын жеке реконструкция (өлшемдер метрмен, кесененің алды +z бағытында):
//  • жоспары ≈ 46,5 × 65,5 м; аяқталмаған кірпіш пештақ — биіктігі 37,5 м, терең сүйір аркалы тауашасы бар,
//    бетінен құрылыс кезіндегі ағаш арқалықтар шығып тұрады;
//  • төрт бұрышында дөңгелек мұнаралар; бүйір және артқы қасбеттер глазурьлі геометриялық өрнекпен қапталған,
//    жоғарғы жағында куфи жазуы бар көк белдеу;
//  • Қазандық залының үстінде — диаметрі ≈ 18 м глазурьсіз кірпіш күмбез;
//  • гурхана (жерлеу бөлмесі) үстінде — биік барабандағы көгілдір қабырғалы күмбез;
//  • шатырда кіші күмбездер.
function yasawi() {
  const g = new THREE.Group();
  const W = 46.5, L = 65.5, H = 18, zf = L / 2;           // zf — порталдың алдыңғы беті
  const PW = 30, PH = 37.5, AW = 17, AH = 29, ND = 7;     // портал ені/биіктігі, арка ені/биіктігі, тауаша тереңдігі
  const wallKind = "yglaze";

  // іргетас
  add(g, boxGeo(W + 6, PLINTH, L + 6), mat("stone", [10, 1]), 0, 0, 0, "wall");
  const B = PLINTH;

  // негізгі көлем (порталдың артында)
  const bodyD = L - ND - 2;
  add(g, boxGeo(W, H, bodyD), mat(wallKind, [W / 7, H / 7]), 0, B, -L / 2 + bodyD / 2, "wall");
  // жоғарғы куфи белдеу
  add(g, boxGeo(W + .4, 2, bodyD + .4), mat("ykufic", [W / 5, 1]), 0, B + H - 3.2, -L / 2 + bodyD / 2, "detail");
  // қасбеттегі тереңдетілген аркалы тауашалар қатары (бүйірлерде)
  const nicheMat = mat("ybrick", [1, 2], { color: 0x8a6a4a }); // көлеңкедегі ойық реңкі
  [-1, 1].forEach(side => {
    for (let i = 0; i < 4; i++) {
      const z = -L / 2 + 8 + i * 11.5;
      const m = add(g, extrude(archShape(5, 10), .12), nicheMat, side * (W / 2 + .02), B + 2, z, "detail");
      m.rotation.y = side * Math.PI / 2;
    }
  });

  // бұрыш мұнаралары
  const towers = [[-W / 2, -L / 2, 22], [W / 2, -L / 2, 22], [-W / 2, zf - ND - 2, 24], [W / 2, zf - ND - 2, 24]];
  towers.forEach(([x, z, h]) => {
    add(g, cylGeo(3.3, 3.6, h, 28), mat(wallKind, [3, h / 6]), x, B, z, "wall");
    add(g, domeGeo(3.4, { stretch: .45 }), mat("ybrick", [3, 1]), x, B + h, z, "dome");
  });

  // ---- пештақ: арка ойығы бар профильді экструзия (нақты тереңдік) ----
  const sh = new THREE.Shape(), hs = AH - AW * .62;
  sh.moveTo(-PW / 2, 0); sh.lineTo(-AW / 2, 0); sh.lineTo(-AW / 2, hs);
  sh.quadraticCurveTo(-AW / 2, hs + AW * .5, 0, AH);
  sh.quadraticCurveTo(AW / 2, hs + AW * .5, AW / 2, hs);
  sh.lineTo(AW / 2, 0); sh.lineTo(PW / 2, 0); sh.lineTo(PW / 2, PH); sh.lineTo(-PW / 2, PH); sh.lineTo(-PW / 2, 0);
  const portalMat = mat("ybrick", [1 / 3, 1 / 3]);
  add(g, new THREE.ExtrudeGeometry(sh, { depth: ND, bevelEnabled: false, curveSegments: 24 }), portalMat, 0, B, zf - ND, "wall");
  // тауашаның артқы қабырғасы және есік
  add(g, boxGeo(PW, PH, 2), mat("ybrick", [PW / 3, PH / 3]), 0, B, zf - ND - 1, "wall");
  add(g, extrude(archShape(5, 8.5), .3), mat("dark"), 0, B, zf - ND + .02, "detail");
  add(g, extrude(archShape(3.2, 4), .3), mat("dark"), 0, B + 12, zf - ND + .02, "detail");     // жоғарғы терезе
  // пештақ шетіндегі тік жарты бағаналар
  [-1, 1].forEach(sx => add(g, cylGeo(1.1, 1.1, PH, 18), mat("ybrick", [1, PH / 3]), sx * PW / 2, B, zf - .6, "wall"));
  // құрылыс кезінен қалған ағаш арқалықтар (пештақ аяқталмаған)
  const poles = [];
  [-1, 1].forEach(sx => {
    for (let x = AW / 2 + 1.6; x < PW / 2 - 1.2; x += 2.6) for (let y = 3.5; y < PH - 2; y += 3.3)
      poles.push(new THREE.CylinderGeometry(.13, .13, 1.6, 6).rotateX(Math.PI / 2).translate(sx * x, B + y, zf + .8));
  });
  for (let y = AH + 1.5; y < PH - 1.5; y += 3.3) for (let x = -AW / 2 + 1; x < AW / 2; x += 2.6)
    poles.push(new THREE.CylinderGeometry(.13, .13, 1.6, 6).rotateX(Math.PI / 2).translate(x, B + y, zf + .8));
  add(g, mergeGeometries(poles), new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 1 }), 0, 0, 0, "detail");

  // ---- Қазандық: глазурьсіз үлкен күмбез ----
  const zc = zf - ND - 2 - 9.1;
  add(g, cylGeo(11, 11.6, 4, 8).rotateY(Math.PI / 8), mat("ybrick", [8, 1]), 0, B + H, zc, "wall");
  add(g, cylGeo(9.6, 9.6, 3.5, 48), mat("ybrick", [10, 1]), 0, B + H + 4, zc, "wall");
  add(g, domeGeo(9.3, { stretch: 1 }), mat("ybrick", [10, 3]), 0, B + H + 7.5, zc, "dome");
  add(g, cylGeo(.25, .4, 2.2, 8), mat("ybrick"), 0, B + H + 7.5 + 9.2, zc, "detail");

  // ---- Гурхана: биік барабандағы көгілдір қабырғалы күмбез ----
  const zg = zc - 9.1 - 2.5 - 6.5;
  add(g, boxGeo(14, 3, 14), mat(wallKind, [2, 1]), 0, B + H, zg, "wall");
  add(g, cylGeo(6.4, 6.4, 7.5, 48), mat("yturq", [6, 2]), 0, B + H + 3, zg, "wall");
  add(g, cylGeo(6.5, 6.5, 2.2, 48), mat("ykufic", [7, 1]), 0, B + H + 3 + 5, zg, "detail");
  add(g, domeGeo(6.3, { stretch: 1.38, ribbed: true, ribs: 36 }), mat("yturq", [8, 2]), 0, B + H + 10.5, zg, "dome");
  const gt = B + H + 10.5 + 6.3 * 1.38;
  add(g, cylGeo(.2, .45, 2, 8), mat("tile"), 0, gt - .1, zg, "detail");
  add(g, new THREE.SphereGeometry(.45, 12, 8), mat("tile"), 0, gt + 2.2, zg, "detail");

  // ---- шатырдағы кіші күмбездер (мешіт, кітапхана, асхана т.б. бөлмелер үстінде) ----
  [[-14.5, zc + 4], [14.5, zc + 4], [-14.5, zc - 10], [14.5, zc - 10], [-13, -L / 2 + 9], [13, -L / 2 + 9], [0, -L / 2 + 6]].forEach(([x, z]) => {
    add(g, cylGeo(3.1, 3.1, 1.6, 24), mat("ybrick", [3, 1]), x, B + H, z, "wall");
    add(g, domeGeo(3, { stretch: 1.05 }), mat("ybrick", [3, 1]), x, B + H + 1.6, z, "dome");
  });
  return g;
}

const BUILDERS = { yasawi, portalDome, domedCube, tentDome, longTomb, yurtStone, kobyz };

export function buildMausoleum(model, { withGround = true } = {}) {
  const g = (BUILDERS[model.type] || domedCube)(model);
  g.userData.kind = "mausoleum";
  if (withGround) {
    const box = new THREE.Box3().setFromObject(g), size = box.getSize(new THREE.Vector3());
    ground(g, Math.max(size.x, size.z) * 3.2, mat("ground", [6, 6]));
  }
  return g;
}
