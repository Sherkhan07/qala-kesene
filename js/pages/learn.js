// Білім беті: терминдер сөздігі + деректер қорынан автоматты құрылатын тест.
import { mountLayout, esc } from "../core/layout.js";
import { ALL, byId, regionOf, url, KIND_LABEL } from "../data/heritage.js";

mountLayout();

// ---------- Сөздік ----------
const TERMS = [
  ["Шахристан", "Қала", "Ортағасырлық қаланың қорғаныс қабырғасымен қоршалған негізгі бөлігі — «ішкі қала».", "otrar"],
  ["Цитадель (арк)", "Қала", "Билеуші мен әскери гарнизон орналасқан, қаланың ең биік әрі мықты бекінген бөлігі.", "syganak"],
  ["Рабад", "Қала", "Шахристан қабырғасының сыртындағы қолөнершілер мен саудагерлер қонысы; кейде өз қорғанымен қоршалған.", "taraz"],
  ["Төбе (тепе)", "Қала", "Ғасырлар бойы бір орында қайта салынған құрылыстардың қалдықтарынан пайда болған жасанды дөң.", "otrar"],
  ["Кәріз", "Инженерия", "Жерасты су құбыры: тік құдықтар тізбегімен жалғасқан көлбеу туннель арқылы суды алыстан әкелу жүйесі.", "sauran"],
  ["Пештақ", "Сәулет", "Кесене не мешіттің биік, тікбұрышты кіреберіс порталы; ортасында сүйір аркалы терең тауашасы болады.", "yasawi"],
  ["Күмбез", "Сәулет", "Ғимаратты жабатын жарты шар тәрізді жабын. Қабырғалы (ребристі) күмбез сыртқы бетіндегі қырларымен ерекшеленеді.", "rabia"],
  ["Барабан", "Сәулет", "Күмбез орнатылатын цилиндр пішінді бөлік; күмбезді көтеріп, сұлбасын айқындайды.", "yasawi"],
  ["Тромп", "Сәулет", "Шаршы бөлмеден дөңгелек күмбезге өтуге мүмкіндік беретін бұрыштағы арка тәрізді конструкция; сегізқырлы белдеу түзеді.", "aisha-bibi"],
  ["Терракота", "Материал", "Күйдірілген сазбалшықтан жасалған әшекей тақташа; ойып немесе қалыпқа құйып өрнектеледі.", "aisha-bibi"],
  ["Глазурь", "Материал", "Кірпіш пен тақташаны жабатын шыны тәрізді түрлі түсті қабат; көгілдір күмбездердің түсін береді.", "yasawi"],
  ["Гурхана", "Сәулет", "Кесененің жерлеу бөлмесі; көбіне жеке күмбезбен жабылады.", "yasawi"],
  ["LiDAR", "Технология", "Лазер сәулесімен қашықтықты өлшеп, нысанның миллиондаған нүктеден тұратын 3D бұлтын жасайтын сканерлеу әдісі.", "yasawi"],
  ["Фотограмметрия", "Технология", "Түрлі бұрыштан түсірілген көптеген фотосуреттерден текстуралы 3D модель құру әдісі.", "arystan-bab"],
  ["HBIM", "Технология", "Heritage BIM — тарихи ғимараттың материалы, құрылымы және тозуы туралы ақпаратты қамтитын ақпараттық модель.", "karakhan"],
  ["Цифрлық егіз", "Технология", "Нақты нысанның датчиктер деректерімен үнемі жаңартылып отыратын виртуалды көшірмесі.", "joshi"],
  ["ГИС", "Технология", "Географиялық ақпараттық жүйе: нысандарды координаталарымен бірге сақтап, картада талдау құралы.", "bozok"]
];
const cats = ["Барлығы", ...new Set(TERMS.map(t => t[1]))];
let cat = "Барлығы";
const gl = document.getElementById("glossary"), gf = document.getElementById("glossCats");
gf.innerHTML = cats.map(c => `<button class="chip${c === cat ? " on" : ""}" data-c="${c}">${c}</button>`).join("");
gf.onclick = e => { const b = e.target.closest(".chip"); if (!b) return; cat = b.dataset.c; gf.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === b)); renderGloss(); };
function renderGloss() {
  gl.innerHTML = TERMS.filter(t => cat === "Барлығы" || t[1] === cat).map(([t, c, d, id]) => `
    <div class="card term"><span class="badge outline">${c}</span><h3>${t}</h3><p>${d}</p>
      <a href="${url(byId(id))}">Мысал: ${esc(byId(id).name)} →</a></div>`).join("");
}
renderGloss();

// ---------- Тест ----------
const rnd = n => Math.floor(Math.random() * n);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (arr, n, not = []) => shuffle(arr.filter(x => !not.includes(x))).slice(0, n);

// Әр сұрақ түрі деректер қорынан жасалады: дұрыс жауап + 3 алдағыш жауап
const MAKERS = [
  () => { const o = ALL[rnd(ALL.length)];
    const wrong = pick([...new Set(ALL.map(x => x.era))], 3, [o.era]);
    return { q: `«${o.name}» қай дәуірге жатады?`, a: o.era, opts: [o.era, ...wrong], o }; },
  () => { const o = ALL[rnd(ALL.length)];
    const wrong = pick([...new Set(ALL.map(x => x.loc))], 3, [o.loc]);
    return { q: `«${o.name}» қайда орналасқан?`, a: o.loc, opts: [o.loc, ...wrong], o }; },
  () => { const o = ALL[rnd(ALL.length)], same = ALL.filter(x => x.kind === o.kind);
    const wrong = pick(same.map(x => x.name), 3, [o.name]);
    return { q: `Бұл сипаттама қай ${o.kind === "city" ? "қалаға" : "кесенеге"} тиесілі?\n«${o.desc}»`, a: o.name, opts: [o.name, ...wrong], o }; },
  () => { const kind = Math.random() < .5 ? "city" : "mausoleum";
    let four; do { four = pick(ALL.filter(x => x.kind === kind), 4); } while (four.filter(x => x.s === Math.min(...four.map(y => y.s))).length > 1);
    const o = four.reduce((m, x) => x.s < m.s ? x : m);
    return { q: `Мына ${kind === "city" ? "қалалардың" : "кесенелердің"} қайсысы ең көне?`, a: o.name, opts: four.map(x => x.name), o }; },
  () => { const o = ALL[rnd(ALL.length)], reg = regionOf(o).name;
    const wrong = pick([...new Set(ALL.map(x => regionOf(x).name))], 3, [reg]);
    return { q: `«${o.name}» қай өңірде?`, a: reg, opts: [reg, ...wrong], o }; }
];

const N = 10, quiz = document.getElementById("quiz");
let qs = [], i = 0, score = 0;

function newQuiz() {
  const used = new Set(); qs = [];
  while (qs.length < N) {
    const q = MAKERS[qs.length % MAKERS.length]();
    if (used.has(q.q) || q.opts.length < 3) continue;
    used.add(q.q); q.opts = shuffle(q.opts); qs.push(q);
  }
  shuffle(qs); i = 0; score = 0; show();
}

function show() {
  if (i >= qs.length) {
    const pct = Math.round(score / N * 100);
    const msg = pct >= 80 ? "Керемет! Сіз ортағасырлық мұраны жақсы білесіз." : pct >= 50 ? "Жақсы нәтиже. Карталарды тағы қарап шығыңыз." : "Карталар мен нысан беттерін аралап, қайта көріңіз.";
    quiz.innerHTML = `<div class="quiz-end"><div class="big">${score} / ${N}</div><p>${msg}</p><button class="btn primary" id="again">Қайта бастау</button></div>`;
    document.getElementById("again").onclick = newQuiz; return;
  }
  const q = qs[i];
  quiz.innerHTML = `
    <div class="quiz-top"><span>Сұрақ ${i + 1} / ${N}</span><span>Ұпай: ${score}</span></div>
    <div class="quiz-bar"><i style="width:${i / N * 100}%"></i></div>
    <h3 class="quiz-q">${esc(q.q).replace("\n", "<br><small>")}${q.q.includes("\n") ? "</small>" : ""}</h3>
    <div class="quiz-opts">${q.opts.map(o => `<button class="opt" data-v="${esc(o)}">${esc(o)}</button>`).join("")}</div>
    <div class="quiz-fb" id="fb"></div>`;
  quiz.querySelector(".quiz-opts").onclick = e => {
    const b = e.target.closest(".opt"); if (!b || quiz.querySelector(".opt.ok")) return;
    const right = b.dataset.v === q.a;
    if (right) score++;
    quiz.querySelectorAll(".opt").forEach(x => { x.disabled = true; if (x.dataset.v === q.a) x.classList.add("ok"); else if (x === b) x.classList.add("bad"); });
    document.getElementById("fb").innerHTML = `${right ? "✓ Дұрыс!" : `✗ Дұрыс жауап: <b>${esc(q.a)}</b>`}
      <a href="${url(q.o)}" target="_blank" rel="noopener">${KIND_LABEL[q.o.kind]}: ${esc(q.o.name)} — 3D</a>
      <button class="btn primary sm" id="next">${i + 1 < N ? "Келесі →" : "Нәтиже"}</button>`;
    document.getElementById("next").onclick = () => { i++; show(); };
  };
}
newQuiz();
