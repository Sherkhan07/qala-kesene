// AI арқылы бүлінген петроглифтерді реставрациялау — демонстрациялық симуляция.
// Тас беті мен «Таңбалы» стиліндегі бейнелер (арқар, садақшы, «күн бас») процедуралық түрде салынады,
// содан кейін эрозия «маскасы» қолданылады. «AI» алдымен сызықтарды анықтайды, кейін жоғалған соққы-нүктелерді толтырады.

const W = 1600, H = 900; // логикалық кеңістік

function ibex(x, y, s, flip = 1) {
  const f = (px, py) => [x + px * s * flip, y + py * s];
  return [
    [f(-60, 0), f(-30, -8), f(20, -8), f(50, 0)],                       // арқа
    [f(-60, 0), f(-55, 18), f(40, 18), f(50, 0)],                       // қарын
    [f(-50, 16), f(-56, 60)], [f(-34, 18), f(-30, 60)], [f(26, 18), f(22, 60)], [f(40, 14), f(46, 60)], // аяқтар
    [f(50, 0), f(62, -18), f(76, -14), f(70, -2), f(56, 2)],            // бас
    [f(62, -18), f(50, -50), f(20, -70), f(-12, -58), f(-24, -36)],     // үлкен иілген мүйіз
    [f(-60, 0), f(-72, -12)]                                            // құйрық
  ];
}
function archer(x, y, s) {
  const f = (px, py) => [x + px * s, y + py * s];
  return [
    [f(0, -70), f(0, 10)], [f(0, 10), f(-20, 60)], [f(0, 10), f(20, 60)],
    [f(0, -45), f(36, -40)], [f(0, -45), f(-14, -20)],
    [f(36, -80), f(52, -40), f(36, 0)], [f(36, -40), f(80, -40)],        // садақ пен жебе
    [f(-10, -82), f(10, -82), f(10, -70), f(-10, -70), f(-10, -82)]      // бас
  ];
}
function sunHead(x, y, s) {
  const f = (px, py) => [x + px * s, y + py * s], out = [];
  const ring = []; for (let i = 0; i <= 20; i++) { const a = i / 20 * Math.PI * 2; ring.push(f(Math.cos(a) * 26, -90 + Math.sin(a) * 26)); }
  out.push(ring);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; out.push([f(Math.cos(a) * 32, -90 + Math.sin(a) * 32), f(Math.cos(a) * 50, -90 + Math.sin(a) * 50)]); }
  out.push([f(0, -64), f(0, 30)], [f(0, 30), f(-24, 80)], [f(0, 30), f(24, 80)], [f(-40, -30), f(0, -40), f(40, -30)], [f(-40, -30), f(-46, 0)], [f(40, -30), f(46, 0)]);
  return out;
}

function makeScene(seed = 7) {
  let h = seed; const rnd = () => (h = (h * 16807) % 2147483647) / 2147483647;
  const strokes = [...ibex(330, 420, 1.6), ...ibex(640, 560, 1.1, -1), ...ibex(1180, 380, 1.3, -1), ...archer(900, 520, 1.5), ...sunHead(1350, 640, 1.4), ...ibex(470, 700, .9)];
  const dots = [];
  strokes.forEach(pl => {
    for (let i = 0; i < pl.length - 1; i++) {
      const [x1, y1] = pl[i], [x2, y2] = pl[i + 1], L = Math.hypot(x2 - x1, y2 - y1), n = Math.ceil(L / 4.2);
      for (let k = 0; k <= n; k++) {
        const t = k / n; for (let j = 0; j < 2; j++)
          dots.push({ x: x1 + (x2 - x1) * t + (rnd() - .5) * 7, y: y1 + (y2 - y1) * t + (rnd() - .5) * 7, r: 2.2 + rnd() * 2.2, dmg: false, fix: 0 });
      }
    }
  });
  // эрозия, жарықтар, қына
  const blobs = Array.from({ length: 14 }, () => ({ x: 200 + rnd() * 1250, y: 250 + rnd() * 550, r: 50 + rnd() * 90 }));
  dots.forEach(d => { if (blobs.some(b => Math.hypot(d.x - b.x, d.y - b.y) < b.r) && rnd() < .88) d.dmg = true; });
  const cracks = Array.from({ length: 7 }, () => { let x = rnd() * W, y = rnd() * H; const pts = [[x, y]]; for (let i = 0; i < 9; i++) { x += (rnd() - .3) * 90; y += (rnd() - .5) * 60; pts.push([x, y]); } return pts; });
  const lichen = Array.from({ length: 40 }, () => ({ x: rnd() * W, y: rnd() * H, r: 6 + rnd() * 26 }));
  return { strokes, dots, blobs, cracks, lichen, rnd };
}

export function openPetroglyph(box, bar, onClose) {
  const cv = box.querySelector("canvas"), ctx = cv.getContext("2d");
  const S = makeScene();
  const rock = document.createElement("canvas"); rock.width = W; rock.height = H;
  { const g = rock.getContext("2d"), grd = g.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, "#4a3426"); grd.addColorStop(.5, "#3a2a20"); grd.addColorStop(1, "#2c2019");
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 26000; i++) { const v = 40 + S.rnd() * 60; g.fillStyle = `rgba(${v + 30},${v + 10},${v},${S.rnd() * .18})`; g.fillRect(S.rnd() * W, S.rnd() * H, 2, 2); }
    g.strokeStyle = "rgba(15,8,4,.75)"; g.lineWidth = 2.2;
    S.cracks.forEach(c => { g.beginPath(); c.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); });
    S.lichen.forEach(l => { g.fillStyle = `rgba(${150 + S.rnd() * 40},${150 + S.rnd() * 30},70,.22)`; g.beginPath(); g.arc(l.x, l.y, l.r, 0, 7); g.fill(); });
  }
  const total = S.dots.length, missing = S.dots.filter(d => d.dmg).length;
  let phase = "idle", scanX = 0, compare = false, raf = 0, last = 0;
  const order = S.dots.map((d, i) => i).filter(i => S.dots[i].dmg).sort(() => S.rnd() - .5);
  let restored = 0;

  function fit() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
    cv.width = r.width * dpr; cv.height = r.height * dpr;
  }
  function draw() {
    const sc = Math.min(cv.width / W, cv.height / H), ox = (cv.width - W * sc) / 2, oy = (cv.height - H * sc) / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#1b1612"; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(sc, 0, 0, sc, ox, oy);
    ctx.drawImage(rock, 0, 0);
    S.dots.forEach(d => {
      if (d.dmg && !d.fix) return;
      ctx.fillStyle = d.dmg ? (compare ? "#48cae4" : `rgba(232,196,150,${.55 + .4 * d.fix})`) : "#d8b48a";
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r * (d.dmg ? d.fix : 1), 0, 7); ctx.fill();
    });
    if (phase === "scan" || phase === "fill") {
      ctx.strokeStyle = "rgba(72,202,228,.85)"; ctx.lineWidth = 2;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, phase === "scan" ? scanX : W, H); ctx.clip();
      S.strokes.forEach(pl => { ctx.beginPath(); pl.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); });
      ctx.restore();
      if (phase === "scan") { ctx.fillStyle = "rgba(72,202,228,.25)"; ctx.fillRect(scanX - 30, 0, 30, H); ctx.fillStyle = "#48cae4"; ctx.fillRect(scanX, 0, 3, H); }
    }
  }
  function status() {
    const pct = Math.round(restored / missing * 100);
    bar.querySelector("#pgStat").textContent = phase === "scan" ? `Талдау: сызықтар анықталуда… ${Math.round(scanX / W * 100)}%`
      : `Соққы-нүктелер: ${total.toLocaleString("ru-RU")} · жоғалғаны: ${missing.toLocaleString("ru-RU")} · қалпына келді: ${pct}%`;
  }
  function tick(now) {
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    if (phase === "scan") { scanX += W * dt / 2.5; if (scanX >= W) { phase = "fill"; } }
    else if (phase === "fill") {
      const n = Math.ceil(order.length * dt / 3);
      for (let k = 0; k < n && restored < order.length; k++) S.dots[order[restored++]].fix = .01;
      if (restored >= order.length) phase = "done";
    }
    S.dots.forEach(d => { if (d.fix && d.fix < 1) d.fix = Math.min(1, d.fix + dt * 3); });
    draw(); status();
    raf = requestAnimationFrame(tick);
  }
  bar.innerHTML = `<button class="pbtn primary" id="pgRun">▶ AI қалпына келтіру</button>
    <button class="pbtn" id="pgCmp">Қалпына келгенін белгілеу</button><button class="pbtn" id="pgReset">↺ Қайта</button>
    <span id="pgStat" style="flex:1"></span><button class="pbtn" id="pgClose">✕ Жабу</button>`;
  const q = id => bar.querySelector("#" + id);
  q("pgRun").onclick = () => { if (phase === "idle") { phase = "scan"; scanX = 0; } };
  q("pgCmp").onclick = e => { compare = !compare; e.currentTarget.classList.toggle("on", compare); };
  q("pgReset").onclick = () => { phase = "idle"; restored = 0; scanX = 0; S.dots.forEach(d => d.fix = 0); };
  q("pgClose").onclick = () => close();
  box.classList.add("show"); fit();
  const ro = new ResizeObserver(fit); ro.observe(cv);
  raf = requestAnimationFrame(tick);
  function close() { cancelAnimationFrame(raf); ro.disconnect(); box.classList.remove("show"); onClose && onClose(); }
  return close;
}
