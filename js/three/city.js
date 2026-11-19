// Ортағасырлық қаланың параметрлік 3D реконструкциясы:
// төбе (тепе) → шахристан қабырғалары мен мұнаралары → қақпалар → цитадель → көшелер мен үйлер → рабад → өзен/кәріз/таулар.
// userData.ruin — «Қазіргі күй» режимінде нысанның қаншалықты сақталғанын көрсетеді (биіктік коэффициенті немесе "hide").
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { mat } from "./materials.js";
import { add, boxGeo, cylGeo, rng, pointInPoly, ground } from "./geom.js";
import { buildMausoleum } from "./mausoleum.js";
import { byId } from "../data/heritage.js";

function outline(shape, r, rand) {
  const ring = (n, rx, rz, jit = 0, rot = 0) => Array.from({ length: n }, (_, i) => {
    const a = rot + i / n * Math.PI * 2, k = 1 + (rand() - .5) * jit;
    return [Math.cos(a) * rx * k, Math.sin(a) * rz * k];
  });
  switch (shape) {
    case "pentagon": return ring(5, r, r * .9, .18, -Math.PI / 2);
    case "oval": return ring(26, r, r * .7);
    case "round": return ring(28, r, r);
    case "square": return [[-r, -r], [r, -r], [r, r], [-r, r]].map(([x, z]) => [x * .8, z * .8]);
    case "rect": return [[-r, -r * .7], [r, -r * .7], [r, r * .7], [-r, r * .7]].map(([x, z]) => [x * .9 + (rand() - .5) * 4, z + (rand() - .5) * 4]);
    default: return ring(7, r, r * .85, .35, rand());
  }
}

// Қабырға сызығы бойынша қабырға, мұнара және қақпа геометриялары
function walls(poly, { h, thick = 2.4, towerEvery = 15, towerR = 2.1, gates = 0, closed = true }) {
  const wallG = [], towerG = [], gateG = [], gatePos = [];
  const n = poly.length, segs = closed ? n : n - 1;
  const gateSegs = new Set(Array.from({ length: gates }, (_, i) => Math.floor(i * segs / gates + segs / (gates * 2)) % segs));
  for (let i = 0; i < segs; i++) {
    const [x1, z1] = poly[i], [x2, z2] = poly[(i + 1) % n];
    const dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz), ang = -Math.atan2(dz, dx);
    wallG.push(boxGeo(L + thick, h, thick).rotateY(ang).translate((x1 + x2) / 2, 0, (z1 + z2) / 2));
    const k = Math.max(1, Math.round(L / towerEvery));
    for (let t = 0; t < k; t++) {
      const f = t / k;
      towerG.push(cylGeo(towerR, towerR * 1.15, h * 1.22, 12).translate(x1 + dx * f, 0, z1 + dz * f));
    }
    if (gateSegs.has(i)) {
      const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, ux = dx / L, uz = dz / L;
      [-1, 1].forEach(s => towerG.push(cylGeo(towerR * 1.5, towerR * 1.7, h * 1.45, 14).translate(mx + ux * s * 4.5, 0, mz + uz * s * 4.5)));
      gateG.push(boxGeo(5, h * .75, thick + .6).rotateY(ang).translate(mx, 0, mz));
      gatePos.push([mx, mz]);
    }
  }
  return { wall: mergeGeometries(wallG), towers: mergeGeometries(towerG), gates: gateG.length ? mergeGeometries(gateG) : null, gatePos };
}

export function buildCity(city) {
  const p = city.model, rand = rng(city.id), g = new THREE.Group();
  g.userData.kind = "city";
  const R = p.r, wallH = p.wallH || 7, base = p.mound || 0;
  const poly = outline(p.shape, R, rand);

  ground(g, R * 9, mat("ground", [40, 40]));

  // төбе (қаланың мәдени қабаты жиналып пайда болған дөң)
  if (base > 0.5) {
    const mk = (scale, h) => {
      const s = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x * scale, -z * scale)));
      return new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false }).rotateX(-Math.PI / 2);
    };
    add(g, mk(1.22, base * .55), mat("mound"), 0, 0, 0, "ground");
    add(g, mk(1.1, base), mat("mound"), 0, 0, 0, "ground");
  }

  // шахристан қабырғалары
  const W = walls(poly, { h: wallH, gates: p.gates || 2 });
  add(g, W.wall, mat("adobe", [R / 3, 2]), 0, base, 0, "wall", { ruin: .3 });
  add(g, W.towers, mat("adobe", [3, 2]), 0, base, 0, "wall", { ruin: .35 });
  if (W.gates) add(g, W.gates, mat("dark"), 0, base, 0, "detail", { ruin: "hide" });

  // сыртқы (рабад) қабырғасы
  if (p.outerWall) {
    const outer = outline(p.shape === "pentagon" ? "irregular" : p.shape, R * 1.75, rand);
    const OW = walls(outer, { h: 4, thick: 2, towerEvery: 28, towerR: 1.6, gates: 4 });
    add(g, OW.wall, mat("adobe", [R / 2, 1]), 0, 0, 0, "wall", { ruin: .25 });
    add(g, OW.towers, mat("adobe", [2, 1]), 0, 0, 0, "wall", { ruin: .3 });
  }

  // цитадель (арк)
  let citadel = null;
  if (p.citadel) {
    const v = poly[0], cx = v[0] * .55, cz = v[1] * .55, cs = R * .3, ch = 5;
    citadel = { x: cx, z: cz, r: cs * .75 };
    add(g, boxGeo(cs * 1.5, ch, cs * 1.5), mat("mound"), cx, base, cz, "ground");
    const cp = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [cx + a * cs * .7, cz + b * cs * .7]);
    const CW = walls(cp, { h: 6, towerEvery: 12, towerR: 2, gates: 1 });
    add(g, CW.wall, mat("brick", [6, 2]), 0, base + ch, 0, "wall", { ruin: .3 });
    add(g, CW.towers, mat("brick", [2, 2]), 0, base + ch, 0, "wall", { ruin: .35 });
    if (p.landmark) {
      const lm = buildMausoleum(byId(p.landmark).model, { withGround: false });
      lm.scale.setScalar(.2); lm.position.set(cx, base + ch, cz); lm.rotation.y = Math.PI;
      lm.traverse(o => { if (o.isMesh) o.userData.ruin = undefined; });
      g.add(lm);
    } else {
      add(g, boxGeo(cs * .7, 6, cs * .5), mat("brick", [4, 2]), cx, base + ch, cz, "house", { ruin: .15 });
    }
  }

  // қақпалардан орталыққа баратын бас көшелер
  const streets = W.gatePos.map(([x, z]) => ({ x, z }));
  const nearStreet = (x, z) => streets.some(s => {
    const L = Math.hypot(s.x, s.z) || 1, t = Math.max(0, Math.min(1, (x * s.x + z * s.z) / (L * L)));
    return Math.hypot(x - s.x * t, z - s.z * t) < 3.4;
  });

  // шахристан ішіндегі үйлер
  const housesIn = [], step = 5.4;
  for (let x = -R * 1.1; x <= R * 1.1; x += step) for (let z = -R * 1.1; z <= R * 1.1; z += step) {
    const hx = x + (rand() - .5) * 1.4, hz = z + (rand() - .5) * 1.4;
    const shrunk = poly.map(([a, b]) => [a * .9, b * .9]);
    if (!pointInPoly(hx, hz, shrunk) || Math.hypot(hx, hz) < 11 || nearStreet(hx, hz)) continue;
    if (hx > 2 && hx < 23 && hz > 2 && hz < 10) continue; // базар орны
    if (citadel && Math.hypot(hx - citadel.x, hz - citadel.z) < citadel.r * 1.45) continue;
    if (rand() < .14) continue;
    const w = 3 + rand() * 1.6, d = 3 + rand() * 1.6, h = 2.2 + rand() * 2.2;
    housesIn.push(boxGeo(w, h, d).rotateY((rand() - .5) * .2).translate(hx, 0, hz));
  }
  if (housesIn.length) add(g, mergeGeometries(housesIn), mat("adobe", [1, 1]), 0, base, 0, "house", { ruin: .12 });

  // орталық: жұма мешіті, мұнара, базар күмбездері
  const mosque = buildMausoleum({ type: "domedCube", size: 10, h: 6, dome: { r: 4.2, mat: "tile" }, portal: true }, { withGround: false });
  mosque.position.set(-4, base, -3); mosque.rotation.y = Math.PI / 2;
  mosque.traverse(o => { if (o.isMesh) o.userData.ruin = "hide"; });
  g.add(mosque);
  add(g, cylGeo(1.1, 1.7, 26, 20), mat("brick", [2, 8]), 6, base, -7, "wall", { ruin: .18 });
  add(g, cylGeo(1.8, 1.4, 1.6, 20), mat("tile"), 6, base + 26, -7, "detail", { ruin: "hide" });
  const bazaar = [];
  for (let i = 0; i < 4; i++) bazaar.push(new THREE.SphereGeometry(2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(6 + i * 4.4, 3, 6));
  for (let i = 0; i < 4; i++) bazaar.push(boxGeo(4.2, 3, 4.2).translate(6 + i * 4.4, 0, 6));
  add(g, mergeGeometries(bazaar.map(b => b.toNonIndexed())), mat("brick", [1, 1]), 0, base, 0, "house", { ruin: .15 });

  // рабад (қала сыртындағы қолөнер-сауда мекені)
  const rab = [];
  for (let i = 0, tries = 0; i < (p.rabad || 0) && tries < 4000; tries++) {
    const a = rand() * Math.PI * 2, d = R * (1.25 + rand() * (p.outerWall ? .4 : .7));
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (pointInPoly(x, z, poly.map(([u, v]) => [u * 1.3, v * 1.3]))) continue;
    if (nearStreet(x * .6, z * .6) && rand() < .7) continue;
    const w = 3 + rand() * 2, dd = 3 + rand() * 2, h = 2 + rand() * 1.6;
    rab.push(boxGeo(w, h, dd).rotateY(rand() * Math.PI).translate(x, 0, z)); i++;
  }
  if (rab.length) add(g, mergeGeometries(rab), mat("adobe", [1, 1]), 0, 0, 0, "house", { ruin: .1 });

  // өзен
  if (p.river) {
    const pts = [], w = 13, off = R * 2.3;
    for (let x = -R * 8; x <= R * 8; x += 6) pts.push([x, off + Math.sin(x / 38) * 16]);
    const pos = [], idx = [];
    pts.forEach(([x, z], i) => { pos.push(x, .06, z - w / 2, x, .06, z + w / 2); if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); } });
    const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); rg.setIndex(idx); rg.computeVertexNormals();
    const river = add(g, rg, mat("water"), 0, 0, 0, "ground"); river.castShadow = false;
    river.material.side = THREE.DoubleSide;
  }

  // кәріз: жерасты су жолының бетіндегі құдықтар тізбегі
  if (p.kariz) {
    const kz = [];
    for (let i = 0; i < 16; i++) {
      const x = -R * 1.15 - i * 8, z = -R * .2 + Math.sin(i / 3) * 6;
      kz.push(new THREE.ConeGeometry(2, 1.2, 10).translate(x, .6, z));
    }
    add(g, mergeGeometries(kz), mat("mound"), 0, 0, 0, "detail");
  }

  // таулар (Іле Алатауы, Жетісу Алатауы)
  if (p.mountains) {
    const mt = [], snow = [];
    for (let i = 0; i < 11; i++) {
      const x = (i - 5) * R * .9 + (rand() - .5) * 20, z = -R * 4 - rand() * R * 1.5, h = R * (1 + rand() * .9), r = R * (1 + rand() * .6);
      mt.push(new THREE.ConeGeometry(r, h, 7).translate(x, h / 2, z));
      snow.push(new THREE.ConeGeometry(r * .28, h * .28, 7).translate(x, h * .86 + .2, z));
    }
    const m = add(g, mergeGeometries(mt), new THREE.MeshStandardMaterial({ color: 0x8f8778, flatShading: true, roughness: 1 }), 0, 0, 0, "ground");
    add(g, mergeGeometries(snow), new THREE.MeshStandardMaterial({ color: 0xf4f1ea, flatShading: true }), 0, 0, 0, "ground");
    m.castShadow = false;
  }
  return g;
}
