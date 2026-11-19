// 3D модель: ортағасырлық порталды-күмбезді кесененің процедуралық моделі.
// Үш режим: «Кірпіш» (тарихи көрініс), «Цифрлық егіз» (жүктеме картасы), «LiDAR» (нүктелер бұлты).
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";

const host = document.getElementById("modelView");
const info = document.getElementById("modelInfo");
const stats = document.getElementById("modelStats");
const scanEl = document.getElementById("scanProgress");

function init() {
  const W = () => host.clientWidth, H = () => host.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W(), H());
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, W() / H(), 0.1, 500);
  camera.position.set(38, 22, 42);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 9, 0);
  controls.enableDamping = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.7;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 18;
  controls.maxDistance = 110;

  // жарық
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x8a6a48, 0.9));
  const sun = new THREE.DirectionalLight(0xffe2b8, 2.2);
  sun.position.set(30, 45, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40 });
  scene.add(sun);

  // кірпіш текстурасы (canvas арқылы)
  function brickTexture() {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = "#a8714a"; g.fillRect(0, 0, 256, 256);
    const bh = 16, bw = 42;
    for (let r = 0; r < 256 / bh; r++) {
      const off = (r % 2) * bw / 2;
      for (let x = -bw; x < 256 + bw; x += bw) {
        const v = 180 + Math.random() * 40;
        g.fillStyle = `rgb(${v},${v * 0.66 | 0},${v * 0.45 | 0})`;
        g.fillRect(x + off + 1.5, r * bh + 1.5, bw - 3, bh - 3);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const brick = brickTexture();
  const mat = (rep, color = 0xffffff) => {
    const t = brick.clone(); t.needsUpdate = true; t.repeat.set(rep[0], rep[1]);
    return new THREE.MeshStandardMaterial({ map: t, color, roughness: 0.92 });
  };
  const tile = new THREE.MeshStandardMaterial({ color: 0x2a8fa6, roughness: 0.35, metalness: 0.1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x3b2618, roughness: 1 });

  // кесене бөліктері
  const building = new THREE.Group();
  const parts = [];
  function add(geo, material, x, y, z, ry = 0) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z); m.rotation.y = ry;
    m.castShadow = m.receiveShadow = true;
    building.add(m); parts.push(m); return m;
  }
  add(new THREE.BoxGeometry(30, 1, 24), mat([6, 1], 0xd8c0a0), 0, 0.5, 0);           // іргетас
  add(new THREE.BoxGeometry(24, 12, 18), mat([5, 3]), 0, 7, -1);                      // негізгі зал
  add(new THREE.BoxGeometry(16, 19, 3.2), mat([3, 4]), 0, 10.5, 9.2);                // пештақ (портал)
  [-7.7, 7.7].forEach(x => add(new THREE.CylinderGeometry(1.3, 1.5, 19, 20), mat([2, 4]), x, 10.5, 9.4)); // бұрыш мұнаралары
  [-12, 12].forEach(x => [-9.5, 7.5].forEach(z => add(new THREE.CylinderGeometry(1, 1.2, 13, 16), mat([1, 3]), x, 7.5, z))); // гульдасталар

  // арка тауашасы (пештақтағы ойық)
  const s = new THREE.Shape();
  s.moveTo(-3.2, 0); s.lineTo(-3.2, 9); s.absarc(0, 9, 3.2, Math.PI, 0, true); s.lineTo(3.2, 0); s.lineTo(-3.2, 0);
  const fr = new THREE.Shape();
  fr.moveTo(-4.6, 0); fr.lineTo(-4.6, 9); fr.absarc(0, 9, 4.6, Math.PI, 0, true); fr.lineTo(4.6, 0); fr.lineTo(-4.6, 0);
  add(new THREE.ExtrudeGeometry(fr, { depth: 0.25, bevelEnabled: false }), tile, 0, 1, 10.7);
  const niche = add(new THREE.ExtrudeGeometry(s, { depth: 0.4, bevelEnabled: false }), dark, 0, 1, 10.65);
  niche.castShadow = false;

  add(new THREE.CylinderGeometry(6.6, 6.6, 3.2, 40), mat([6, 1]), 0, 14.6, -2);       // барабан
  const dome = add(new THREE.SphereGeometry(6.6, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), tile, 0, 16.2, -2);
  dome.scale.y = 1.35;                                                                 // негізгі күмбез
  add(new THREE.CylinderGeometry(3.6, 3.6, 2, 32), mat([3, 1]), 0, 14, -7.5);         // кіші барабан
  add(new THREE.SphereGeometry(3.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), tile, 0, 15, -7.5).scale.y = 1.2;
  scene.add(building);
  building.updateMatrixWorld(true);

  // жер беті
  const ground = new THREE.Mesh(new THREE.CircleGeometry(80, 64), new THREE.MeshStandardMaterial({ color: 0xd9be94, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);
  const grid = new THREE.GridHelper(120, 60, 0x48cae4, 0x1b4466);
  grid.visible = false; scene.add(grid);

  // --- Цифрлық егіз: биіктікке байланысты жүктеме түстері + қырлар ---
  const heat = (t) => new THREE.Color().setHSL(0.62 - 0.62 * t, 0.85, 0.5); // көк → қызыл
  const twin = new THREE.Group();
  parts.forEach(p => {
    const g = p.geometry.clone();
    g.applyMatrix4(p.matrixWorld);
    const pos = g.attributes.position, cols = [];
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const load = THREE.MathUtils.clamp(1 - y / 25 + (Math.abs(pos.getX(i)) < 8 && pos.getZ(i) > 7 ? 0.15 : 0), 0, 1);
      const c = heat(load); cols.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    twin.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })));
    twin.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 25), new THREE.LineBasicMaterial({ color: 0x90e0ef })));
  });
  // датчиктер
  const sensorGeo = new THREE.SphereGeometry(0.45, 16, 8);
  const sensors = [[0, 25, -2], [-7.2, 20, 9.4], [7.2, 20, 9.4], [0, 13, 10.8], [-12, 3, -9.5], [12, 3, 7.5]].map(([x, y, z]) => {
    const m = new THREE.Mesh(sensorGeo, new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
    m.position.set(x, y, z); twin.add(m); return m;
  });
  twin.visible = false; scene.add(twin);

  // --- LiDAR: беттерден нүктелер іріктеу ---
  const N = 70000, pts = new Float32Array(N * 3), pcol = new Float32Array(N * 3);
  const areas = parts.map(p => {
    const g = p.geometry.toNonIndexed(); g.applyMatrix4(p.matrixWorld);
    const a = g.attributes.position; let A = 0; const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
    for (let i = 0; i < a.count; i += 3) { v0.fromBufferAttribute(a, i); v1.fromBufferAttribute(a, i + 1); v2.fromBufferAttribute(a, i + 2); A += v1.sub(v0).cross(v2.sub(v0)).length() / 2; }
    return { sampler: new MeshSurfaceSampler(new THREE.Mesh(g)).build(), A };
  });
  const totalA = areas.reduce((s, x) => s + x.A, 0);
  let k = 0; const tmp = new THREE.Vector3();
  areas.forEach(({ sampler, A }, idx) => {
    const n = idx === areas.length - 1 ? N - k : Math.round(N * A / totalA);
    for (let i = 0; i < n && k < N; i++, k++) {
      sampler.sample(tmp);
      pts[k * 3] = tmp.x + (Math.random() - .5) * .06; pts[k * 3 + 1] = tmp.y; pts[k * 3 + 2] = tmp.z + (Math.random() - .5) * .06;
      const c = new THREE.Color().setHSL(0.55 - tmp.y / 60, 0.9, 0.45 + Math.random() * 0.2);
      pcol[k * 3] = c.r; pcol[k * 3 + 1] = c.g; pcol[k * 3 + 2] = c.b;
    }
  });
  const cloudGeo = new THREE.BufferGeometry();
  cloudGeo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
  cloudGeo.setAttribute("color", new THREE.BufferAttribute(pcol, 3));
  cloudGeo.setDrawRange(0, 0);
  const cloud = new THREE.Points(cloudGeo, new THREE.PointsMaterial({ size: 0.11, vertexColors: true }));
  cloud.visible = false; scene.add(cloud);
  const scanPlane = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: 0x48cae4, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
  scanPlane.rotation.x = -Math.PI / 2; scanPlane.visible = false; scene.add(scanPlane);
  // нүктелерді төменнен жоғары қарай «сканерлеу» реті
  const order = [...Array(N).keys()].sort((a, b) => pts[a * 3 + 1] - pts[b * 3 + 1]);
  const sorted = new Float32Array(N * 3), sortedC = new Float32Array(N * 3);
  order.forEach((o, i) => { for (let j = 0; j < 3; j++) { sorted[i * 3 + j] = pts[o * 3 + j]; sortedC[i * 3 + j] = pcol[o * 3 + j]; } });
  cloudGeo.attributes.position.array.set(sorted); cloudGeo.attributes.color.array.set(sortedC);
  cloudGeo.attributes.position.needsUpdate = cloudGeo.attributes.color.needsUpdate = true;

  // режимдер
  const TEXT = {
    brick: ["Тарихи көрініс", "Күйдірілген кірпіш, пештақ (портал), барабан мен көгілдір глазурьлі күмбез. Ортағасырлық Түркістан кесенелеріне тән құрылым."],
    twin: ["Цифрлық егіз", "Түстер — конструкциядағы шартты жүктеме: қызыл — іргетас пен порталдағы жоғары кернеу, көк — күмбездің жеңіл бөлігі. Көгілдір нүктелер — мониторинг датчиктері."],
    lidar: ["LiDAR сканерлеу", "Модель беттерінен 70 000 нүкте іріктеліп, төменнен жоғары қарай «сканерленеді». Нақты жобада мұндай бұлт миллиондаған нүктеден тұрады."]
  };
  let mode = "brick", scanT = 0;
  function setMode(m) {
    mode = m;
    document.querySelectorAll("[data-mode]").forEach(b => b.classList.toggle("on", b.dataset.mode === m));
    building.visible = m === "brick";
    twin.visible = m === "twin";
    cloud.visible = scanPlane.visible = m === "lidar";
    grid.visible = m !== "brick";
    ground.visible = m === "brick";
    host.classList.toggle("dark", m !== "brick");
    info.innerHTML = `<b>${TEXT[m][0]}</b>${TEXT[m][1]}`;
    if (m === "lidar") { scanT = 0; cloudGeo.setDrawRange(0, 0); }
    scanEl.style.display = m === "lidar" ? "block" : "none";
  }
  document.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => setMode(b.dataset.mode));
  document.getElementById("modelSpin").onclick = (e) => { controls.autoRotate = !controls.autoRotate; e.currentTarget.classList.toggle("on", controls.autoRotate); };
  setMode("brick");

  const clock = new THREE.Clock();
  function loop() {
    const dt = clock.getDelta(), t = clock.elapsedTime;
    controls.update();
    if (mode === "lidar" && scanT < 1) {
      scanT = Math.min(1, scanT + dt / 6);
      const n = Math.floor(N * scanT);
      cloudGeo.setDrawRange(0, n);
      scanPlane.position.y = n ? sorted[(n - 1) * 3 + 1] : 0;
      scanEl.querySelector("i").style.width = (scanT * 100).toFixed(0) + "%";
      stats.textContent = `${n.toLocaleString("ru-RU")} нүкте`;
    } else if (mode === "twin") {
      sensors.forEach((s, i) => s.scale.setScalar(1 + 0.4 * Math.sin(t * 3 + i)));
      stats.textContent = `Макс. жүктеме ${(2 + Math.sin(t) * 0.08).toFixed(2)} МПа · 6 датчик`;
    } else if (mode === "brick") {
      stats.textContent = "Процедуралық модель · 18 элемент";
    }
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();
  new ResizeObserver(() => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); }).observe(host);
}

// секция көрінгенде ғана жүктеу
const io = new IntersectionObserver((es) => { if (es.some(e => e.isIntersecting)) { io.disconnect(); try { init(); } catch (err) { host.innerHTML = '<p class="model-err">3D модель жүктелмеді (WebGL қолжетімсіз).</p>'; console.error(err); } } }, { rootMargin: "200px" });
io.observe(host);
