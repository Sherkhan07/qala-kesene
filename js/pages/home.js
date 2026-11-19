import { mountLayout, whenVisible, esc } from "../core/layout.js";
import { byId, url } from "../data/heritage.js";

mountLayout();

// Сабақтастық: көне элемент → заманауи шешім (әрқайсысы нақты нысанға сілтейді)
const PAIRS = [
  ["Пештақ (портал)", "Кіреберіс акценті", "Монументалды портал", "Қожа Ахмет Ясауи кесенесінің биік порталы ғимараттың «бетін» құрайды. Бүгінгі қоғамдық ғимараттарда бұл идея үлкен кіреберіс аркалары мен шыны-металл қасбеттер арқылы жалғасады.", "yasawi"],
  ["Қабырғалы күмбез", "Торлы қабық", "Күмбез бен қабықша", "Кірпіш күмбездің жүктеме тарату логикасы заманауи торлы (gridshell) және шатыр конструкцияларында, шыны-металл күмбездерде сақталады.", "rabia"],
  ["Терракота ою", "Параметрлік қасбет", "Өрнек — модуль ретінде", "Айша бибі кесенесінің 60-тан астам терракота тақташасы модульдік ойлаудың үлгісі. Параметрлік дизайн осы қайталанатын өрнекті алгоритм арқылы жасайды.", "aisha-bibi"],
  ["Кәріз", "Тұрақты инженерия", "Су мен микроклимат", "Сауранның жерасты су жүйесі (кәріздер) табиғи салқындату мен ресурс үнемдеудің ерте мысалы, қазіргі «жасыл» стандарттардың тарихи бастауы.", "sauran"],
  ["Киіз үй пішіні", "Шатыр-ғимарат", "Көшпелі геометрия", "Домбауыл кесенесі тастан киіз үй пішінінде қаланған. Бұл бейне Астанадағы шатыр тәрізді қазіргі ғимараттарда символдық түрде қайталанады.", "dombauyl"],
  ["Шахристан", "Қала жоспарлау", "Қала құрылымы", "Отырардың цитадель–шахристан–рабад жүйесі функционалдық аймақтау мен қорғаныс белдеулерінің бүгінгі урбанистикадағы ізашары.", "otrar"],
  ["Қобыз бейнесі", "Заманауи мемориал", "Символ — форма ретінде", "Қорқыт ата кешені (1980) ұлттық музыкалық аспап пішінін бетон конструкцияға айналдырды: көне мағына жаңа материалда сөйлейді.", "korkyt"]
];
document.getElementById("pairs").innerHTML = PAIRS.map(([o, n, t, d, id]) => `
  <div class="card pair">
    <div class="row"><span class="tag old">${o}</span><span class="muted">→</span><span class="tag new">${n}</span></div>
    <h3>${t}</h3><p>${d}</p>
    <a class="btn ghost sm" style="margin-top:14px" href="${url(byId(id))}">3D: ${esc(byId(id).name)} →</a>
  </div>`).join("");

// Галерея
const lb = document.getElementById("lightbox");
document.querySelectorAll(".gallery figure").forEach(f => f.onclick = () => { lb.querySelector("img").src = f.querySelector("img").src; lb.showModal(); });
lb.addEventListener("click", () => lb.close());

// 3D модульдер: three.js тек қажет кезде жүктеледі
const load3d = () => Promise.all([import("../three/viewer.js"), import("../three/mausoleum.js")]);

// Hero: Ясауи кесенесі, әдепкіде тарихи көрініс (кесененің негізгі бейнесі)
const heroEl = document.getElementById("heroView");
whenVisible(heroEl, async () => {
  try {
    const [{ createViewer }, { buildMausoleum }] = await load3d();
    const v = createViewer(heroEl, { fog: false, maxPoints: 110000 });
    v.setModel(buildMausoleum(byId("yasawi").model), { view: "hero" });
    v.setMode("real");
    heroEl.classList.add("ready");
    heroEl.querySelectorAll("[data-hero]").forEach(b => b.onclick = () => {
      heroEl.querySelectorAll("[data-hero]").forEach(x => x.classList.toggle("on", x === b));
      v.setMode(b.dataset.hero);
    });
    // LiDAR режимінде сканерлеу аяқталған соң қайта бастау
    setInterval(() => { if (v.mode === "lidar") v.setMode("lidar"); }, 11000);
  } catch (e) { console.error(e); heroEl.innerHTML = '<div class="viewer-err">3D көрініс жүктелмеді.</div>'; }
}, "0px");

// Концепт: кірпіштен шыныға морфинг
const morphEl = document.getElementById("morphView");
whenVisible(morphEl, async () => {
  try {
    const [{ createViewer }, { buildMausoleum }] = await load3d();
    const v = createViewer(morphEl);
    v.setModel(buildMausoleum(byId("karakhan").model));
    const setT = v.enableMorph();
    const range = document.getElementById("morphRange"), pct = document.getElementById("morphPct");
    const upd = () => { const t = range.value / 100; setT(t); pct.textContent = `${Math.round(t * 100)}% тарихи · ${100 - Math.round(t * 100)}% заманауи`; };
    range.addEventListener("input", upd); upd();
  } catch (e) { console.error(e); morphEl.innerHTML = '<div class="viewer-err">3D көрініс жүктелмеді.</div>'; }
});
