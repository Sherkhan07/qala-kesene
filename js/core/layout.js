// Барлық беттерге ортақ: тақырып (header), төменгі бөлім (footer), жарық/қараңғы режим, мобильді мәзір.
const NAV = [
  ["home", "index.html", "Басты бет"],
  ["cities", "cities.html", "Қалалар"],
  ["mausoleums", "mausoleums.html", "Кесенелер"],
  ["registry", "registry.html", "Тізілім"],
  ["tech", "index.html#digital", "Технология"]
];

export function mountLayout() {
  const page = document.body.dataset.page;
  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <div class="wrap bar">
      <a class="brand" href="index.html" aria-label="Басты бет">
        <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><path d="M5 28V15h22v13M10 28v-7q6-8 12 0v7M8 15q8-14 16 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>
        <span>Qala<b>&amp;</b>Kesene</span>
      </a>
      <nav class="links" id="navLinks">
        ${NAV.map(([k, href, t]) => `<a href="${href}"${k === page ? ' aria-current="page"' : ""}>${t}</a>`).join("")}
      </nav>
      <div class="bar-actions">
        <button class="icon-btn" id="themeBtn" aria-label="Жарық/қараңғы режим">◐</button>
        <button class="icon-btn menu-btn" id="menuBtn" aria-label="Мәзір" aria-expanded="false">☰</button>
      </div>
    </div>`;
  document.body.prepend(header);

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="wrap foot">
      <div>
        <div class="brand"><span>Qala<b>&amp;</b>Kesene</span></div>
        <p>Ортағасырлық қала сәулеті мен қазіргі архитектураның сабақтастығы: көне ескерткіштерді цифрлық технологиялар арқылы сақтау.</p>
      </div>
      <div>
        <h4>Бөлімдер</h4>
        ${NAV.slice(0, 4).map(([, href, t]) => `<a href="${href}">${t}</a>`).join("")}
      </div>
      <div>
        <h4>Дереккөздер</h4>
        <p>«Қазақстанның орта ғасырлық қалалары мен кесенелері» анықтамалығы. Карта: © OpenStreetMap, OpenFreeMap, Esri, AWS Terrain Tiles. 3D модельдер — схемалық реконструкция.</p>
      </div>
    </div>`;
  document.body.append(footer);

  // тақырып (theme)
  const root = document.documentElement;
  let saved = null; try { saved = localStorage.getItem("theme"); } catch (e) {}
  if (saved) root.dataset.theme = saved;
  document.getElementById("themeBtn").onclick = () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
  };

  // мобильді мәзір
  const btn = document.getElementById("menuBtn"), links = document.getElementById("navLinks");
  btn.onclick = () => btn.setAttribute("aria-expanded", links.classList.toggle("open"));
  links.addEventListener("click", e => { if (e.target.tagName === "A") { links.classList.remove("open"); btn.setAttribute("aria-expanded", false); } });
}

// Секция көрінгенде ғана іске қосу (WebGL ресурстарын үнемдеу)
export function whenVisible(el, fn, margin = "200px") {
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: margin });
  io.observe(el);
}

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
