// Ортақ геометриялық көмекшілер: іргесі y=0 болатын қораптар, күмбездер, аркалар.
import * as THREE from "three";

// Қорап: геометрияның негізі y=0 деңгейінде (биіктігін масштабтағанда іргесі орнында қалады)
export const boxGeo = (w, h, d) => new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
export const cylGeo = (rt, rb, h, seg = 24) => new THREE.CylinderGeometry(rt, rb, h, seg).translate(0, h / 2, 0);

export function add(parent, geo, material, x = 0, y = 0, z = 0, role = "wall", extra = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  m.userData.role = role;
  Object.assign(m.userData, extra);
  parent.add(m);
  return m;
}

// Күмбез: жарты сфера; ribbed — қабырғалы (Ясауи кесенесінің артқы күмбезі сияқты), stretch — биіктік коэффициенті
export function domeGeo(r, { stretch = 1, ribbed = false, ribs = 24 } = {}) {
  const g = new THREE.SphereGeometry(r, ribbed ? ribs * 3 : 48, 20, 0, Math.PI * 2, 0, Math.PI / 2);
  if (ribbed) {
    const p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const phi = Math.atan2(v.z, v.x);
      const k = 1 - 0.06 * (1 - Math.abs(Math.cos(phi * ribs / 2))) * (1 - v.y / r);
      p.setXYZ(i, v.x * k, v.y, v.z * k);
    }
    g.computeVertexNormals();
  }
  g.scale(1, stretch, 1);
  return g;
}

// Сүйір арка пішіні (ортағасырлық пештақ тауашасы)
export function archShape(w, h) {
  const s = new THREE.Shape(), hs = h - w * 0.62;
  s.moveTo(-w / 2, 0); s.lineTo(-w / 2, hs);
  s.quadraticCurveTo(-w / 2, hs + w * 0.5, 0, h);
  s.quadraticCurveTo(w / 2, hs + w * 0.5, w / 2, hs);
  s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0);
  return s;
}
export const extrude = (shape, depth) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 16 });

// Детерминистік кездейсоқ сандар (бір нысан әрдайым бірдей көрінуі үшін)
export function rng(seedStr) {
  let h = 1779033703;
  for (const ch of seedStr) h = Math.imul(h ^ ch.charCodeAt(0), 3432918353), h = (h << 13) | (h >>> 19);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function pointInPoly(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

// Жалпақ жер беті
export function ground(parent, size, material) {
  const g = new THREE.Mesh(new THREE.CircleGeometry(size, 64), material);
  g.rotation.x = -Math.PI / 2; g.receiveShadow = true; g.userData.role = "ground";
  parent.add(g);
  return g;
}
