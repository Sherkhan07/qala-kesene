// Процедуралық текстуралар мен материалдар (canvas арқылы, сыртқы суретсіз).
import * as THREE from "three";

const texCache = {};

function canvasTex(key, draw, size = 256) {
  if (texCache[key]) return texCache[key];
  const c = document.createElement("canvas"); c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return (texCache[key] = t);
}

const rnd = (a, b) => a + Math.random() * (b - a);

function bricks(g, S, base, mortar, { bh = 16, bw = 42, vary = 30, pattern = null } = {}) {
  g.fillStyle = mortar; g.fillRect(0, 0, S, S);
  for (let r = 0; r < S / bh; r++) {
    const off = (r % 2) * bw / 2;
    for (let x = -bw; x < S + bw; x += bw) {
      const v = rnd(-vary, vary);
      let [R, G, B] = base;
      if (pattern && pattern(r, Math.round((x + off) / bw))) { R *= 0.62; G *= 0.6; B *= 0.62; }
      g.fillStyle = `rgb(${R + v | 0},${G + v * .7 | 0},${B + v * .5 | 0})`;
      g.fillRect(x + off + 1.5, r * bh + 1.5, bw - 3, bh - 3);
    }
  }
}

const TEX = {
  brick: () => canvasTex("brick", (g, S) => bricks(g, S, [196, 128, 86], "#a8714a")),
  adobe: () => canvasTex("adobe", (g, S) => {
    g.fillStyle = "#c9a77c"; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${rnd(90, 140) | 0},${rnd(70, 100) | 0},50,${rnd(.05, .18)})`; g.fillRect(rnd(0, S), rnd(0, S), rnd(1, 4), rnd(1, 3)); }
    g.strokeStyle = "rgba(120,90,60,.25)"; for (let y = 0; y < S; y += 32) { g.beginPath(); g.moveTo(0, y + rnd(-2, 2)); g.lineTo(S, y + rnd(-2, 2)); g.stroke(); }
  }),
  white: () => canvasTex("white", (g, S) => bricks(g, S, [236, 228, 214], "#d6cbb8", { vary: 10 })),
  carpet: () => canvasTex("carpet", (g, S) => bricks(g, S, [200, 138, 92], "#9c6a46", { pattern: (r, c) => ((r + c) % 6 === 0) || ((r - c + 60) % 6 === 0) })),
  ornament: () => canvasTex("ornament", (g, S) => {
    g.fillStyle = "#c98a5c"; g.fillRect(0, 0, S, S);
    const n = 4, s = S / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = i * s, y = j * s;
      g.fillStyle = (i + j) % 2 ? "#b8774b" : "#d39a6c"; g.fillRect(x + 2, y + 2, s - 4, s - 4);
      g.strokeStyle = "#7b4a2c"; g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(x + s / 2, y + 6); g.lineTo(x + s - 6, y + s / 2); g.lineTo(x + s / 2, y + s - 6); g.lineTo(x + 6, y + s / 2); g.closePath(); g.stroke();
      g.beginPath(); g.arc(x + s / 2, y + s / 2, s / 7, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(x + s / 2, y + 6); g.lineTo(x + s / 2, y + s - 6); g.moveTo(x + 6, y + s / 2); g.lineTo(x + s - 6, y + s / 2); g.stroke();
    }
  }),
  terracotta: () => canvasTex("terracotta", (g, S) => bricks(g, S, [190, 110, 70], "#8f5536", { bh: 12, bw: 28 })),
  tile: () => canvasTex("tile", (g, S) => {
    g.fillStyle = "#1f7f97"; g.fillRect(0, 0, S, S);
    const s = 16;
    for (let x = 0; x < S; x += s) for (let y = 0; y < S; y += s) {
      g.fillStyle = `hsl(${rnd(186, 196)},${rnd(55, 70)}%,${rnd(34, 46)}%)`; g.fillRect(x + 1, y + 1, s - 2, s - 2);
    }
  }),
  stone: () => canvasTex("stone", (g, S) => {
    g.fillStyle = "#8d877d"; g.fillRect(0, 0, S, S);
    for (let y = 0; y < S; y += 22) for (let x = -20; x < S; x += rnd(26, 46)) {
      const v = rnd(110, 170) | 0; g.fillStyle = `rgb(${v},${v - 6},${v - 14})`;
      g.beginPath(); g.ellipse(x + 18, y + 11, rnd(12, 22), rnd(8, 10), rnd(-.2, .2), 0, Math.PI * 2); g.fill();
    }
  }),
  concrete: () => canvasTex("concrete", (g, S) => {
    g.fillStyle = "#d9d6cf"; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(90,90,90,${rnd(.03, .1)})`; g.fillRect(rnd(0, S), rnd(0, S), 2, 2); }
  }),
  // ---- Қожа Ахмет Ясауи кесенесіне арналған текстуралар ----
  // Глазурьсіз ашық-қоңыр кірпіш (аяқталмаған портал мен Қазандық күмбезі)
  ybrick: () => canvasTex("ybrick", (g, S) => bricks(g, S, [212, 178, 128], "#b8966a", { vary: 16, bh: 12, bw: 30 })),
  // «Бannai» әдісімен глазурьлі кірпіштен қаланған геометриялық өрнек (бүйір және артқы қасбеттер)
  yglaze: () => canvasTex("yglaze", (g, S) => {
    const bh = 12, bw = 24, P = 16;
    g.fillStyle = "#b8966a"; g.fillRect(0, 0, S, S);
    const wrap = x => ((x % P) + P) % P, cen = x => { const w = wrap(x); return w >= P / 2 ? w - P : w; };
    for (let r = 0; r < S / bh; r++) for (let c = 0; c < S / bw; c++) {
      const u = wrap(r + c), v = wrap(r - c);
      const d = Math.min(Math.abs(cen(r - 8)) + Math.abs(cen(c)), Math.abs(cen(r)) + Math.abs(cen(c - 8)));
      let col = [208 + rnd(-14, 14), 174 + rnd(-12, 12), 124 + rnd(-10, 10)];
      if (u === 0 || v === 0) col = [24, 74 + rnd(-8, 8), 140 + rnd(-10, 10)];       // қою көк тор
      else if (d === 3) col = [52, 172 + rnd(-10, 10), 190 + rnd(-10, 10)];         // көгілдір ромб
      else if (d <= 1) col = [236, 236, 228];                                         // ақ ортасы
      g.fillStyle = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`;
      g.fillRect(c * bw + 1.2, r * bh + 1.2, bw - 2.4, bh - 2.4);
    }
  }, 384),
  // Куфи жазуы бар көк белдеу
  ykufic: () => canvasTex("ykufic", (g, S) => {
    g.fillStyle = "#16507c"; g.fillRect(0, 0, S, S);
    g.fillStyle = "#f2efe6";
    g.fillRect(0, S * .06, S, S * .05); g.fillRect(0, S * .89, S, S * .05);
    let x = 6;
    while (x < S - 10) {
      const w = 7 + rnd(0, 6), h = S * (.3 + rnd(0, .45));
      g.fillRect(x, S * .8 - h, w, h);                                  // тік әріп
      if (rnd(0, 1) < .5) g.fillRect(x, S * .8 - h, w * 2.4, w * .9);   // жоғарғы ілгек
      g.fillRect(x, S * .74, w * 2.6, w);                               // негізгі сызық
      x += w * 2.8 + rnd(0, 6);
    }
  }),
  // Гурхана күмбезінің көгілдір глазурі (жұқа ромб торымен)
  yturq: () => canvasTex("yturq", (g, S) => {
    g.fillStyle = "#2a9fb2"; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${rnd(20, 80) | 0},${rnd(150, 210) | 0},${rnd(180, 220) | 0},.35)`; g.fillRect(rnd(0, S), rnd(0, S), 3, 3); }
    g.strokeStyle = "rgba(14,60,110,.55)"; g.lineWidth = 2;
    for (let k = -S; k < S * 2; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + S, S); g.stroke(); g.beginPath(); g.moveTo(k, S); g.lineTo(k + S, 0); g.stroke(); }
    g.fillStyle = "rgba(255,255,255,.7)";
    for (let x = 16; x < S; x += 32) for (let y = 0; y < S; y += 32) { g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill(); }
  }),
  ground: () => canvasTex("ground", (g, S) => {
    g.fillStyle = "#d4b88c"; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${rnd(120, 170) | 0},${rnd(100, 130) | 0},70,${rnd(.05, .2)})`; g.fillRect(rnd(0, S), rnd(0, S), rnd(1, 3), rnd(1, 3)); }
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(110,130,70,${rnd(.15, .35)})`; g.beginPath(); g.arc(rnd(0, S), rnd(0, S), rnd(1, 3), 0, 7); g.fill(); }
  }, 512)
};

const COLORS = { dark: 0x2e1d12, water: 0x3f86a8, mound: 0xc4a274, glass: 0x7fd6e8, roof: 0xb79a72 };

// mat("brick", [rx, ry]) — қайталанатын текстурасы бар материал
export function mat(kind, rep = [1, 1], opts = {}) {
  if (kind === "water") return new THREE.MeshStandardMaterial({ color: COLORS.water, roughness: .25, metalness: .1 });
  if (kind === "dark") { const m = new THREE.MeshStandardMaterial({ color: COLORS.dark, roughness: 1 }); m.userData.kind = "dark"; return m; }
  if (kind === "mound") return new THREE.MeshStandardMaterial({ color: COLORS.mound, roughness: 1, flatShading: true });
  if (kind === "roof") return new THREE.MeshStandardMaterial({ color: COLORS.roof, roughness: 1 });
  const src = (TEX[kind] || TEX.brick)();
  const t = src.clone(); t.needsUpdate = true; t.repeat.set(rep[0], rep[1]);
  const m = new THREE.MeshStandardMaterial({
    map: t, roughness: kind === "tile" ? .35 : .92, metalness: kind === "tile" ? .1 : 0, ...opts
  });
  m.userData.kind = kind;
  return m;
}

export const GLASS = () => new THREE.MeshPhysicalMaterial({
  color: COLORS.glass, transparent: true, opacity: .28, roughness: .05, metalness: .3,
  side: THREE.DoubleSide, depthWrite: false
});
