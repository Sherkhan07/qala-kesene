// 1-саты. LiDAR & Фотограмметрия: нүктелер бұлтын сканерлеу, фото станциялар, .ply экспорт.
import * as THREE from "three";

let api, group, stopTick, lastN = -1;

function stations(v) {
  const g = new THREE.Group(), c = v.center, S = v.size, R = S * .85;
  const cam = new THREE.ConeGeometry(S * .018, S * .04, 4).rotateX(Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffb347 });
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffb347, transparent: true, opacity: .25 });
  for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2 + ring * .26, y = v.box.min.y + S * (ring ? .75 : .25);
    const m = new THREE.Mesh(cam, mat);
    m.position.set(c.x + Math.cos(a) * R, y, c.z + Math.sin(a) * R); m.lookAt(c);
    g.add(m);
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([m.position, c]), lineMat));
  }
  g.userData.lineMat = lineMat;
  return g;
}

function exportPLY(v, name) {
  const L = v.lidar; if (!L) return;
  const col = L.points.geometry.attributes.color.array, n = L.count;
  let out = `ply\nformat ascii 1.0\ncomment ArchHeritage VR demo point cloud\nelement vertex ${n}\nproperty float x\nproperty float y\nproperty float z\nproperty uchar red\nproperty uchar green\nproperty uchar blue\nend_header\n`;
  const lines = [];
  for (let i = 0; i < n; i++) lines.push(`${L.pos[i * 3].toFixed(3)} ${L.pos[i * 3 + 1].toFixed(3)} ${L.pos[i * 3 + 2].toFixed(3)} ${col[i * 3] * 255 | 0} ${col[i * 3 + 1] * 255 | 0} ${col[i * 3 + 2] * 255 | 0}`);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([out + lines.join("\n")], { type: "text/plain" }));
  a.download = `${name}-pointcloud.ply`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export default {
  enter(a) {
    api = a; const { v, panel, obj } = api;
    v.setMode("lidar");
    document.getElementById("scan").style.display = "block";
    group = stations(v); v.scene.add(group);
    const sz = v.box.getSize(new THREE.Vector3());
    const area = 2 * (sz.x * sz.y + sz.y * sz.z + sz.x * sz.z);
    panel.innerHTML = `
      <div class="kicker">1-саты</div><h3>LiDAR & Фотограмметрия</h3>
      <p>Лазерлік сканер нысан бетін нүктелер бұлты ретінде өлшейді. Сары конустар — фотограмметрия түсірілімінің станциялары: екі деңгейде 24 бұрыштан алынған суреттер бетке текстура береді.</p>
      <ul class="kv">
        <li><span>Нысан</span><b>${obj.name}</b></li>
        <li><span>Сканерленген нүкте</span><b id="lpN">0</b></li>
        <li><span>Сканерлеу барысы</span><b id="lpP">0%</b></li>
        <li><span>Фото станция</span><b>24</b></li>
        <li><span>Габарит (Е×Б×Ұ)</span><b>${sz.x.toFixed(0)}×${sz.y.toFixed(0)}×${sz.z.toFixed(0)} м</b></li>
        <li><span>Демо бұлттың тығыздығы</span><b id="lpD">—</b></li>
        <li><span>Нақты TLS дәлдігі (үлгілік)</span><b>±2 мм</b></li>
      </ul>
      <div class="btns">
        <button class="pbtn primary" id="lpRe">↻ Қайта сканерлеу</button>
        <button class="pbtn on" id="lpSt">Фото станциялар</button>
        <button class="pbtn" id="lpCmp">Модельмен салыстыру</button>
        <button class="pbtn" id="lpPly">⬇ .ply бұлт</button>
      </div>
      <div class="disclaimer">Келесі қадам — бұлттан HBIM моделін құру. Сол жақтағы «HBIM» модулін ашыңыз.</div>`;
    const $ = id => panel.querySelector("#" + id);
    $("lpRe").onclick = () => { v.setMode("lidar"); lastN = -1; };
    $("lpSt").onclick = e => { group.visible = !group.visible; e.currentTarget.classList.toggle("on", group.visible); };
    $("lpCmp").onclick = e => { const on = v.mode === "lidar"; v.setMode(on ? "real" : "lidar"); e.currentTarget.classList.toggle("on", on); };
    $("lpPly").onclick = () => exportPLY(v, obj.id);
    stopTick = v.addTicker((dt, now) => {
      group.userData.lineMat.opacity = v.scan < 1 ? .15 + .25 * Math.abs(Math.sin(now / 180)) : .08;
      const L = v.lidar; if (!L) return;
      const n = Math.floor(L.count * v.scan);
      if (n === lastN) return; lastN = n;
      $("lpN").textContent = n.toLocaleString("ru-RU");
      $("lpP").textContent = `${Math.round(v.scan * 100)}%`;
      $("lpD").textContent = `${(n / area).toFixed(1)} нүкте/м²`;
    });
  },
  exit() {
    if (!api) return;
    stopTick && stopTick(); group && api.v.scene.remove(group);
    api.v.setMode("real"); api = null; lastN = -1;
  }
};
