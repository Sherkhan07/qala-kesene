// Әмбебап 3D көрермен: кез келген нысан моделін көрсетеді және төрт режимді қолдайды:
//  real  — тарихи реконструкция
//  ruin  — қазіргі күй (қабырғалар мен үйлердің сақталған биіктігі)
//  twin  — цифрлық егіз (шартты жүктеме/қауіп картасы + датчиктер)
//  lidar — LiDAR нүктелер бұлты (сканерлеу анимациясымен)
// Сонымен қатар morph: тарихи материалдан заманауи шыныға көшу (clipping plane арқылы).
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { GLASS } from "./materials.js";

const isModelMesh = o => o.isMesh && o.userData.role !== "ground";

export function createViewer(host, opts = {}) {
  const { autoRotate = true, fog = true, maxPoints = 90000 } = opts;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 5000);
  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, { enableDamping: true, autoRotate, autoRotateSpeed: .6, maxPolarAngle: Math.PI * .48 });
  controls.addEventListener("start", () => { controls.autoRotate = false; opts.onInteract && opts.onInteract(); });

  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x806246, 1.0));
  const sun = new THREE.DirectionalLight(0xffe0b0, 2.4);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);
  const grid = new THREE.GridHelper(1, 40, 0x48cae4, 0x1b4466); grid.visible = false; scene.add(grid);

  const state = { model: null, mode: "real", twin: null, lidar: null, scan: 0, size: 1, center: new THREE.Vector3(), box: new THREE.Box3(), morph: null };

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);

  // ---------- модель ----------
  function setModel(group, { view = "front" } = {}) {
    if (state.model) { scene.remove(state.model); disposeOverlays(); }
    state.model = group; scene.add(group);
    group.updateMatrixWorld(true);
    // тек модельдің өзі бойынша жақтау (жер беті мен тауларды есептемейміз)
    const box = new THREE.Box3();
    group.traverse(o => { if (isModelMesh(o)) box.expandByObject(o); });
    const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    state.box = box; state.center = center; state.size = Math.max(size.x, size.y, size.z);
    const S = state.size;
    controls.target.copy(center);
    const dir = view === "top" ? new THREE.Vector3(.35, 1.1, .9) : new THREE.Vector3(.75, .42, 1);
    // шекаралық сфера көрініске толық сыятын қашықтық (тар экранда көлденең бұрышты ескереміз)
    const radius = size.length() / 2, vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * Math.max(camera.aspect, .3));
    const dist = radius / Math.sin(Math.min(vHalf, hHalf)) * (view === "top" ? .8 : 1.02);
    camera.position.copy(center).add(dir.normalize().multiplyScalar(dist));
    camera.near = S / 200; camera.far = S * 60; camera.updateProjectionMatrix();
    controls.minDistance = S * .35; controls.maxDistance = S * 5;
    sun.position.copy(center).add(new THREE.Vector3(S * .8, S * 1.4, S * .6)); sun.target.position.copy(center);
    const sc = sun.shadow.camera, e = S * 1.1;
    Object.assign(sc, { left: -e, right: e, top: e, bottom: -e, near: S * .1, far: S * 5 }); sc.updateProjectionMatrix();
    scene.fog = fog ? new THREE.Fog(0xe9d6b6, S * 4, S * 14) : null;
    grid.scale.setScalar(S * 3); grid.position.set(center.x, box.min.y + .01, center.z);
    applyMode();
  }

  function disposeOverlays() {
    [state.twin, state.lidar && state.lidar.points, state.lidar && state.lidar.plane, state.morph && state.morph.glass].forEach(o => o && scene.remove(o));
    state.twin = state.lidar = null;
    if (state.morph) { state.morph = null; }
  }

  // ---------- цифрлық егіз ----------
  const heat = t => new THREE.Color().setHSL(.62 - .62 * THREE.MathUtils.clamp(t, 0, 1), .85, .52);
  function buildTwin() {
    const grp = new THREE.Group(), { min, max } = state.box, H = (max.y - min.y) || 1;
    state.model.traverse(o => {
      if (!isModelMesh(o) || !o.visible) return;
      const geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
      const p = geo.attributes.position, col = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) {
        const t = 1 - (p.getY(i) - min.y) / H + (o.userData.role === "dome" ? -.15 : 0);
        const c = heat(t); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      grp.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .5, side: THREE.DoubleSide, depthWrite: false })));
      if (p.count < 60000) grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), new THREE.LineBasicMaterial({ color: 0x90e0ef, transparent: true, opacity: .55 })));
    });
    // датчиктер: төбеде, бұрыштарда, іргеде
    const c = state.center, S = state.size, sensors = [];
    const spots = [[c.x, max.y, c.z], [min.x, min.y + H * .5, max.z], [max.x, min.y + H * .5, max.z], [min.x, min.y + .5, min.z], [max.x, min.y + .5, min.z], [c.x, min.y + H * .3, max.z]];
    spots.forEach(([x, y, z]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(S * .012, 16, 8), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
      m.position.set(x, y, z); grp.add(m); sensors.push(m);
      const ring = new THREE.Mesh(new THREE.RingGeometry(S * .02, S * .026, 32), new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: .6, side: THREE.DoubleSide }));
      ring.position.copy(m.position); ring.lookAt(camera.position); grp.add(ring); sensors.push(ring);
    });
    grp.userData.sensors = sensors;
    scene.add(grp);
    return grp;
  }

  // ---------- LiDAR ----------
  function buildLidar() {
    const items = [];
    state.model.traverse(o => {
      if (!isModelMesh(o) || !o.visible) return;
      const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      geo.applyMatrix4(o.matrixWorld);
      const a = geo.attributes.position, v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
      let A = 0;
      for (let i = 0; i < a.count; i += 3) { v0.fromBufferAttribute(a, i); v1.fromBufferAttribute(a, i + 1); v2.fromBufferAttribute(a, i + 2); A += v1.sub(v0).cross(v2.sub(v0)).length() / 2; }
      if (A > 0) items.push({ sampler: new MeshSurfaceSampler(new THREE.Mesh(geo)).build(), A });
    });
    const total = items.reduce((s, x) => s + x.A, 0), N = maxPoints;
    const pts = [], tmp = new THREE.Vector3(), { min, max } = state.box, H = (max.y - min.y) || 1, jit = state.size * .0015;
    items.forEach(({ sampler, A }) => {
      const n = Math.round(N * A / total);
      for (let i = 0; i < n; i++) { sampler.sample(tmp); pts.push([tmp.x + (Math.random() - .5) * jit, tmp.y, tmp.z + (Math.random() - .5) * jit]); }
    });
    pts.sort((a, b) => a[1] - b[1]); // төменнен жоғары «сканерлеу» реті
    const pos = new Float32Array(pts.length * 3), col = new Float32Array(pts.length * 3);
    pts.forEach(([x, y, z], i) => {
      pos.set([x, y, z], i * 3);
      const c = new THREE.Color().setHSL(.55 - (y - min.y) / H * .45, .9, .45 + Math.random() * .2);
      col.set([c.r, c.g, c.b], i * 3);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const points = new THREE.Points(geo, new THREE.PointsMaterial({ size: state.size * .0035, vertexColors: true, sizeAttenuation: true }));
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(state.size * 1.6, state.size * 1.6), new THREE.MeshBasicMaterial({ color: 0x48cae4, transparent: true, opacity: .12, side: THREE.DoubleSide, depthWrite: false }));
    plane.rotation.x = -Math.PI / 2; plane.position.set(state.center.x, min.y, state.center.z);
    scene.add(points, plane);
    return { points, plane, count: pts.length, pos };
  }

  // ---------- режимдер ----------
  function applyRuin(on) {
    state.model.traverse(o => {
      const r = o.userData.ruin;
      if (r === undefined) return;
      if (o.userData._sy === undefined) o.userData._sy = o.scale.y;
      if (r === "hide") o.visible = !on;
      else o.scale.y = on ? o.userData._sy * r : o.userData._sy;
    });
  }

  function applyMode() {
    if (!state.model) return;
    const m = state.mode;
    applyRuin(m === "ruin");
    if (m === "twin" && !state.twin) { applyRuin(false); state.model.updateMatrixWorld(true); state.twin = buildTwin(); }
    if (m === "lidar" && !state.lidar) { applyRuin(false); state.model.updateMatrixWorld(true); state.lidar = buildLidar(); }
    const digital = m === "twin" || m === "lidar";
    state.model.visible = !digital;
    if (state.twin) state.twin.visible = m === "twin";
    if (state.lidar) { state.lidar.points.visible = state.lidar.plane.visible = m === "lidar"; }
    if (m === "lidar") state.scan = 0;
    grid.visible = digital;
    host.classList.toggle("dark", digital);
    if (scene.fog) scene.fog.color.set(digital ? 0x08182a : 0xe9d6b6);
  }

  function setMode(m) { state.mode = m; applyMode(); }

  // ---------- morph (тарихи → заманауи шыны) ----------
  function enableMorph() {
    const planeA = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0), planeB = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
    const glass = new THREE.Group(), gm = GLASS(); gm.clippingPlanes = [planeB];
    const edgeM = new THREE.LineBasicMaterial({ color: 0x48cae4, clippingPlanes: [planeB] });
    state.model.traverse(o => {
      if (!isModelMesh(o)) return;
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      ms.forEach(mm => { mm.clippingPlanes = [planeA]; });
      const geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
      glass.add(new THREE.Mesh(geo, gm));
      glass.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), edgeM));
    });
    scene.add(glass);
    state.morph = { glass };
    const { min, max } = state.box;
    return t => { const x = min.x + (max.x - min.x) * t; planeA.constant = x; planeB.constant = -x; };
  }

  // ---------- цикл ----------
  let running = true, last = performance.now();
  new IntersectionObserver(es => { running = es[0].isIntersecting; if (running) { last = performance.now(); loop(); } }).observe(host);
  function loop(now = performance.now()) {
    if (!running) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    controls.update();
    let info = "";
    if (state.mode === "lidar" && state.lidar) {
      const L = state.lidar;
      if (state.scan < 1) state.scan = Math.min(1, state.scan + dt / 6);
      const n = Math.floor(L.count * state.scan);
      L.points.geometry.setDrawRange(0, n);
      L.plane.position.y = n ? L.pos[(n - 1) * 3 + 1] : state.box.min.y;
      L.plane.visible = state.scan < 1;
      info = `${n.toLocaleString("ru-RU")} нүкте`;
      opts.onScan && opts.onScan(state.scan);
    } else if (state.mode === "twin" && state.twin) {
      const t = now / 1000;
      state.twin.userData.sensors.forEach((s, i) => s.scale.setScalar(1 + .35 * Math.sin(t * 3 + i)));
      info = `Макс. кернеу ${(2 + Math.sin(t) * .08).toFixed(2)} МПа · 6 датчик`;
    }
    opts.onFrame && opts.onFrame(state.mode, info);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  resize(); loop();

  return {
    setModel, setMode, enableMorph,
    get mode() { return state.mode; },
    setAutoRotate(v) { controls.autoRotate = v; },
    get autoRotate() { return controls.autoRotate; },
    resetView() { setModel(state.model); },
    screenshot() { renderer.render(scene, camera); return renderer.domElement.toDataURL("image/png"); }
  };
}
