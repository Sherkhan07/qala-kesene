// 4-саты. VR / AR / AI: виртуалды тур, WebXR VR, жойылған қалалардың Metaverse реконструкциясы,
// AI арқылы петроглифтерді реставрациялау (демо).
import * as THREE from "three";
import { openPetroglyph } from "./petroglyph.js";
import { url, byId } from "../data/heritage.js";

let api, stopTour = null, closePetro = null, vrPromise = null;

// Виртуалды тур: модель габаритінен есептелетін камера маршруты (5 нүкте + жазулар)
function startTour(btn) {
  const { v } = api, b = v.box, c = v.center, S = v.size, H = b.max.y - b.min.y;
  const K = [
    [new THREE.Vector3(c.x + S * .2, b.min.y + H * .35, b.max.z + S * 1.4), c, "Кесенеге жақындау"],
    [new THREE.Vector3(c.x, b.min.y + H * .25, b.max.z + S * .45), new THREE.Vector3(c.x, b.min.y + H * .35, b.max.z), "Портал (пештақ) және арка тауашасы"],
    [new THREE.Vector3(b.max.x + S * .7, b.min.y + H * .4, c.z), c, "Бүйір қасбет"],
    [new THREE.Vector3(c.x + S * .3, b.max.y + S * .7, c.z - S * .2), new THREE.Vector3(c.x, b.max.y - H * .2, c.z), "Күмбездер — жоғарыдан көрініс"],
    [new THREE.Vector3(b.min.x - S * .6, b.min.y + H * .5, b.min.z - S * .6), c, "Артқы жағы"],
    [new THREE.Vector3(c.x + S * .75, b.min.y + H * .42, b.max.z + S * 1.0), c, "Тур аяқталды"]
  ];
  const pos0 = v.camera.position.clone(), tgt0 = v.controls.target.clone();
  const seg = 4.5; let t = 0, lastI = -1;
  v.controls.enabled = false; v.controls.autoRotate = false;
  const ease = k => k * k * (3 - 2 * k);
  btn.textContent = "■ Турды тоқтату"; btn.classList.add("on");
  const un = v.addTicker(dt => {
    t += dt; const i = Math.min(K.length - 1, Math.floor(t / seg)), k = ease(Math.min(1, (t % seg) / seg));
    const [pA, tA] = i === 0 ? [pos0, tgt0] : K[i - 1], [pB, tB, cap] = K[i];
    if (i !== lastI) { lastI = i; api.say(`${i + 1}/${K.length} · ${cap}`, seg * 1000); }
    v.camera.position.lerpVectors(pA, pB, k); v.controls.target.lerpVectors(tA, tB, k);
    if (t >= seg * K.length) stop();
  });
  function stop() { un(); v.controls.enabled = true; btn.textContent = "▶ Виртуалды тур"; btn.classList.remove("on"); stopTour = null; }
  stopTour = stop;
}

export default {
  enter(a) {
    api = a; const { v, panel, obj } = api;
    v.setMode("real");
    const cities = ["otrar", "sauran", "syganak", "taraz"].map(byId);
    panel.innerHTML = `
      <div class="kicker">4-саты</div><h3>VR / AR / AI</h3>
      <p>Виртуалды туризм, жойылған қалаларды Metaverse кеңістігінде қайта жаңғырту және AI арқылы бүлінген петроглифтерді реставрациялау.</p>
      <div style="font-size:12px;font-weight:700;color:#5B6576;text-transform:uppercase;letter-spacing:.06em">Виртуалды туризм</div>
      <div class="btns"><button class="pbtn primary" id="xrTour">▶ Виртуалды тур</button><span id="xrVR"></span></div>
      <p id="xrVRnote" style="font-size:12.5px"></p>
      <div style="font-size:12px;font-weight:700;color:#5B6576;text-transform:uppercase;letter-spacing:.06em">AI реставрация</div>
      <p>Таңбалы стиліндегі петроглифтер эрозиядан бүлінген. AI алдымен сақталған сызықтарды анықтайды, содан соң жоғалған соққы-нүктелерді толықтырады.</p>
      <div class="btns"><button class="pbtn primary" id="xrAI">Петроглиф реставрациясын ашу</button></div>
      <div style="font-size:12px;font-weight:700;color:#5B6576;text-transform:uppercase;letter-spacing:.06em">Metaverse: жойылған қалалар</div>
      <p>Қираған қалалардың 3D реконструкциясы. Әр бетте «Қазіргі күй» мен «Тарихи» режимдерін салыстыруға болады.</p>
      <div class="btns">${cities.map(c => `<a class="pbtn" style="text-decoration:none" href="${url(c)}">${c.name} →</a>`).join("")}</div>
      <div class="btns"><a class="pbtn" style="text-decoration:none" href="${url(obj)}">${obj.name}: жеке беті →</a></div>
      <div class="disclaimer">AI реставрация — оқу мақсатындағы симуляция. Нақты жобада фотограмметриялық түсірілімге inpainting нейрожелісі қолданылады, ал нәтижені археолог тексереді.</div>`;
    panel.querySelector("#xrTour").onclick = e => { stopTour ? stopTour() : startTour(e.currentTarget); };
    panel.querySelector("#xrAI").onclick = () => {
      stopTour && stopTour();
      closePetro = openPetroglyph(document.getElementById("petroBox"), document.getElementById("petroBar"), () => { closePetro = null; });
    };
    // VR батырмасы бір рет жасалады (WebXR қолдау болса)
    if (!vrPromise) vrPromise = v.enableVR(document.createElement("div"));
    vrPromise.then(btn => {
      const slot = panel.querySelector("#xrVR"), note = panel.querySelector("#xrVRnote");
      if (!slot) return;
      if (btn) { btn.className = "pbtn"; slot.append(btn); note.textContent = "VR шлемін киіп, кесененің ішіне «кіріңіз»."; }
      else note.textContent = "Бұл браузер WebXR VR-ды қолдамайды. Meta Quest не басқа VR шлемінің браузерінде ашыңыз.";
    });
  },
  exit() {
    if (!api) return;
    stopTour && stopTour(); closePetro && closePetro();
    api = null;
  }
};
