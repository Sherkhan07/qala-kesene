// Барлық нысандардың бірыңғай деректер қоры.
// Дереккөз: «Қазақстанның орта ғасырлық қалалары мен кесенелері» (тарихи-географиялық анықтамалық).
// model — 3D құрастырушыға арналған параметрлер (схемалық реконструкция).

export const REGIONS = {
  city: {
    south:   { name: "Оңтүстік Қазақстан", color: "#B85C3E" },
    zhetysu: { name: "Жетісу және Талас",  color: "#2F8F83" },
    cw:      { name: "Орталық және Батыс", color: "#5B6FB5" }
  },
  mausoleum: {
    south:  { name: "Оңтүстік Қазақстан", color: "#B85C3E" },
    talas:  { name: "Жетісу және Талас",  color: "#2F8F83" },
    ulytau: { name: "Ұлытау өңірі",       color: "#5B6FB5" },
    syr:    { name: "Сыр бойы",           color: "#C89B5E" }
  }
};

export const CITIES = [
  { id: "otrar", name: "Отырар", alt: "Фараб", era: "I – XVIII ғғ.", s: 1, e: 18, loc: "Түркістан обл., Талапты", lat: 42.8516, lon: 68.3036, region: "south",
    desc: "Ұлы Жібек жолындағы аса ірі сауда, ғылым және мәдениет орталығы. Әл-Фарабидің отаны.",
    model: { shape: "pentagon", r: 62, mound: 9, citadel: true, gates: 4, rabad: 150, outerWall: true } },
  { id: "sauran", name: "Сауран", era: "X – XVIII ғғ.", s: 10, e: 18, loc: "Түркістан обл., Сауран", lat: 43.5161, lon: 67.7725, region: "south",
    desc: "Биік қорған қабырғаларымен және күрделі жер асты су жүйесімен (кәріздер) танымал стратегиялық бекініс-қала.",
    model: { shape: "oval", r: 58, mound: 2, wallH: 10, citadel: false, gates: 2, rabad: 70, kariz: true } },
  { id: "syganak", name: "Сығанақ", era: "X – XVIII ғғ.", s: 10, e: 18, loc: "Қызылорда обл., Сунақата", lat: 44.1578, lon: 66.9589, region: "south",
    desc: "Қыпшақ хандығының, Ақ Орданың және кейін Қазақ хандығының алғашқы астаналарының бірі.",
    model: { shape: "rect", r: 52, mound: 6, citadel: true, gates: 4, rabad: 90, river: true } },
  { id: "yassy", name: "Яссы", alt: "Түркістан", era: "V – XIX ғғ.", s: 5, e: 19, loc: "Түркістан қаласы", lat: 43.2973, lon: 68.2709, region: "south",
    desc: "Рухани-діни, сауда орталығы және Қазақ хандығының астанасы.",
    model: { shape: "square", r: 58, mound: 3, citadel: true, gates: 4, rabad: 110, landmark: "yasawi" } },
  { id: "ispijab", name: "Испиджаб", alt: "Сайрам", era: "VI – XVIII ғғ.", s: 6, e: 18, loc: "Шымкент қ., Сайрам", lat: 42.3014, lon: 69.7694, region: "south",
    desc: "Саудагерлер мен қолөнершілердің ірі орталығы.",
    model: { shape: "rect", r: 50, mound: 5, citadel: true, gates: 4, rabad: 110 } },
  { id: "zhankent", name: "Жанкент", era: "VII – XV ғғ.", s: 7, e: 15, loc: "Қызылорда обл., Қазалы ауд.", lat: 45.6056, lon: 61.9183, region: "south",
    desc: "Оғыз мемлекетінің астанасы болған Сырдарияның төменгі ағысындағы көне қала.",
    model: { shape: "oval", r: 46, mound: 4, citadel: true, gates: 2, rabad: 60, river: true } },
  { id: "taraz", name: "Тараз", era: "I – XIX ғғ.", s: 1, e: 19, loc: "Тараз қаласы", lat: 42.8972, lon: 71.3944, region: "zhetysu",
    desc: "«Көпестер қаласы» атанған, Батыс Түрік, Түргеш, Қарлұқ және Қарахан қағанаттарының ірі саяси-экономикалық орталығы.",
    model: { shape: "rect", r: 56, mound: 4, citadel: true, gates: 4, rabad: 160, river: true } },
  { id: "balasagun", name: "Баласағұн", alt: "Ақтөбе қалашығы", era: "X – XIV ғғ.", s: 10, e: 14, loc: "Жамбыл обл., Ақсу", lat: 43.2289, lon: 74.0503, region: "zhetysu",
    desc: "Қарахан мемлекетінің астанасы, Жүсіп Баласағұн туған қала.",
    model: { shape: "square", r: 60, mound: 3, citadel: true, gates: 4, rabad: 130, outerWall: true, mountains: true } },
  { id: "talgar", name: "Талғар", alt: "Талхир", era: "VIII – XIII ғғ.", s: 8, e: 13, loc: "Алматы обл., Талғар", lat: 43.2842, lon: 77.2347, region: "zhetysu",
    desc: "Іле Алатауы бөктеріндегі темір ұсталығы мен саудасы дамыған ірі қала.",
    model: { shape: "irregular", r: 46, mound: 2, citadel: false, gates: 2, rabad: 60, mountains: true, river: true } },
  { id: "koilyk", name: "Қойлық", alt: "Қаялық", era: "VIII – XIV ғғ.", s: 8, e: 14, loc: "Жетісу обл., Сарқан ауд.", lat: 45.6544, lon: 80.2647, region: "zhetysu",
    desc: "Қарлұқ жабғуларының астанасы, түрлі діндер мен мәдениеттер тоғысқан қала.",
    model: { shape: "rect", r: 54, mound: 2, citadel: true, gates: 4, rabad: 90, mountains: true } },
  { id: "saraishyk", name: "Сарайшық", era: "XIII – XVI ғғ.", s: 13, e: 16, loc: "Атырау обл., Сарайшық", lat: 47.5214, lon: 51.7336, region: "cw",
    desc: "Алтын Орда мен Ноғай Ордасының астанасы, Қасым хан тұсында Қазақ хандығының ордасы болған, Еуропа мен Азияны жалғаған қала.",
    model: { shape: "irregular", r: 52, mound: 2, wallH: 5, citadel: false, gates: 3, rabad: 80, river: true } },
  { id: "bozok", name: "Бозоқ", era: "VIII – XIV ғғ.", s: 8, e: 14, loc: "Астана қаласы", lat: 51.1453, lon: 71.3208, region: "cw",
    desc: "Дешті Қыпшақ даласындағы әскери-әкімшілік және рухани орталық.",
    model: { shape: "round", r: 44, mound: 2, wallH: 5, citadel: false, gates: 2, rabad: 40, outerWall: true, river: true } }
].map(o => ({ ...o, kind: "city" }));

export const MAUSOLEUMS = [
  { id: "yasawi", name: "Қожа Ахмет Ясауи кесенесі", era: "XIV ғ. соңы", s: 14, loc: "Түркістан қаласы", lat: 43.2975, lon: 68.2711, region: "south", unesco: true,
    desc: "Әмір Темірдің бұйрығымен XIV ғасырдың соңында тұрғызылған орта ғасырлық сәулет өнерінің жауһары, ЮНЕСКО-ның Бүкіләлемдік мұралар тізіміне енген нысан.",
    model: { type: "portalDome", w: 40, d: 52, h: 22, portalH: 37, portalW: 46, dome: { r: 10.5, mat: "brick", stretch: 1.1 }, rear: { r: 6.8, mat: "tile", ribbed: true, stretch: 1.55 }, towers: true, guldasta: true } },
  { id: "arystan-bab", name: "Арыстан баб кесенесі", era: "XII – XIV ғғ.", s: 12, loc: "Түркістан обл., Отырар ауд.", lat: 42.8528, lon: 68.2508, region: "south",
    desc: "Қожа Ахмет Ясауидің ұстазына арнап XII ғасырда салынып, XIV ғасырда қайта жаңғыртылған кесене.",
    model: { type: "portalDome", w: 22, d: 30, h: 10, portalH: 15, portalW: 18, dome: { r: 5, mat: "brick" }, rear: { r: 4, mat: "brick" }, towers: true, minarets: true } },
  { id: "rabia", name: "Рабия Сұлтан Бегім кесенесі", era: "XV ғ.", s: 15, loc: "Түркістан қаласы", lat: 43.2969, lon: 68.2719, region: "south",
    desc: "Ұлықбектің қызы, Әбілқайыр ханның жұбайына арнап XV ғасырда салынған кесене.",
    model: { type: "domedCube", size: 9, h: 7, dome: { r: 3.8, mat: "tile", ribbed: true, stretch: 1.3 }, portal: true } },
  { id: "ukasha", name: "Үкаша ата кесенесі", era: "IX – X ғғ.", s: 9, loc: "Түркістан обл., Бабайқорған", lat: 43.5419, lon: 68.0267, region: "south",
    desc: "IX–X ғасырларға жататын, ұзындығымен ерекшеленетін көне кесене және құдық кешені.",
    model: { type: "longTomb", len: 24, w: 5, h: 2.6, well: true } },
  { id: "ibrahim", name: "Ибраһим ата кесенесі", era: "XI – XII ғғ.", s: 11, loc: "Шымкент қ., Сайрам", lat: 42.3133, lon: 69.7661, region: "south",
    desc: "Қожа Ахмет Ясауидің әкесіне арнап салынған XI–XII ғасырлардағы (кейін қайта тұрғызылған) сәулет ескерткіші.",
    model: { type: "domedCube", size: 9, h: 6.5, dome: { r: 3.6, mat: "brick" }, portal: true, mat: "adobe" } },
  { id: "karashash", name: "Қарашаш ана кесенесі", era: "XI – XII ғғ.", s: 11, loc: "Шымкент қ., Сайрам", lat: 42.3019, lon: 69.7711, region: "south",
    desc: "Қожа Ахмет Ясауидің анасына арнап салынған XI–XII ғасырлардағы (кейін қайта тұрғызылған) сәулет ескерткіші.",
    model: { type: "domedCube", size: 7.5, h: 5.5, dome: { r: 3, mat: "brick" }, portal: true } },
  { id: "domalak", name: "Домалақ ана кесенесі", alt: "Нұрила", era: "XI ғ.", s: 11, loc: "Түркістан обл., Бәйдібек ауд.", lat: 42.8936, lon: 69.6736, region: "south",
    desc: "XI ғасырда салынып, кейін бірнеше рет қайта жаңартылған тарихи-сәулет ескерткіші.",
    model: { type: "portalDome", w: 16, d: 16, h: 9, portalH: 13, portalW: 12, dome: { r: 5.5, mat: "tile", stretch: 1.2 }, towers: true, mat: "white" } },
  { id: "aisha-bibi", name: "Айша бибі кесенесі", era: "XI – XII ғғ.", s: 11, loc: "Жамбыл обл., Айша бибі а.", lat: 42.8336, lon: 71.2111, region: "talas",
    desc: "Бүкіл қабырғасы 60-тан астам түрлі ою-өрнекті терракота тақташалармен қапталған Қарахан дәуірінің бірегей ескерткіші.",
    model: { type: "domedCube", size: 7.6, h: 7.5, dome: { r: 3.2, mat: "terracotta" }, portal: true, columns: true, mat: "ornament" } },
  { id: "babaja", name: "Бабаджа хатун кесенесі", era: "X – XI ғғ.", s: 10, loc: "Жамбыл обл., Айша бибі а.", lat: 42.8339, lon: 71.2108, region: "talas",
    desc: "Өзінің ерекше қырлы шатырлы күмбезімен танымал ескерткіш.",
    model: { type: "tentDome", size: 7, h: 5, tentH: 6, facets: 16 } },
  { id: "karakhan", name: "Қарахан кесенесі", era: "XI ғ.", s: 11, loc: "Тараз қаласы", lat: 42.8994, lon: 71.3831, region: "talas",
    desc: "XI ғасырда Қарахан әулетінің өкілі Шах-Махмұд Бұғра Қараханға арнап салынған кесене.",
    model: { type: "portalDome", w: 12, d: 12, h: 8, portalH: 12, portalW: 11, dome: { r: 4.2, mat: "brick" }, towers: true } },
  { id: "dauitbek", name: "Дәуітбек кесенесі", alt: "Шамансұр", era: "XIII ғ.", s: 13, loc: "Тараз қаласы", lat: 42.8997, lon: 71.3842, region: "talas",
    desc: "1262 жылы моңғол дәуіріндегі Тараз билеушісіне арнап тұрғызылған ескерткіш.",
    model: { type: "domedCube", size: 7.5, h: 6, dome: { r: 3.2, mat: "brick" }, portal: true } },
  { id: "tekturmas", name: "Тектұрмас кесенесі", era: "X – XIV ғғ.", s: 10, loc: "Тараз қаласы", lat: 42.8856, lon: 71.4214, region: "talas",
    desc: "Талас өзенінің жағасындағы биік төбе басына салынған сәулет ескерткіші.",
    model: { type: "domedCube", size: 7, h: 5.5, dome: { r: 3, mat: "brick" }, portal: true, hill: 9 } },
  { id: "joshi", name: "Жошы хан кесенесі", era: "XIII ғ.", s: 13, loc: "Ұлытау обл., Жезқазған маңы", lat: 48.1558, lon: 67.8172, region: "ulytau",
    desc: "Шыңғыс ханның үлкен ұлы Жошы ханға арнап салынған, қос күмбезді сәулет ескерткіші.",
    model: { type: "portalDome", w: 12, d: 14, h: 8, portalH: 12, portalW: 11, dome: { r: 4.4, mat: "tile", stretch: 1.15 }, rear: { r: 3, mat: "brick" }, towers: false } },
  { id: "alasha", name: "Алаша хан кесенесі", era: "XI – XII ғғ.", s: 11, loc: "Ұлытау обл., Малшыбай а.", lat: 48.3489, lon: 67.7989, region: "ulytau",
    desc: "Кілем өрнегіне ұқсас кірпіш қалау әдісімен тұрғызылған еңселі кесене (кейбір деректерде XIII–XIV ғғ.).",
    model: { type: "portalDome", w: 15, d: 15, h: 10, portalH: 15, portalW: 13, dome: { r: 5.6, mat: "brick", stretch: 1.1 }, towers: true, mat: "carpet" } },
  { id: "dombauyl", name: "Домбауыл кесенесі", era: "VIII – IX ғғ.", s: 8, loc: "Ұлытау обл., Жезқазған маңы", lat: 48.2036, lon: 67.8283, region: "ulytau",
    desc: "Тастан киіз үй пішіндес етіп қаланған ең көне сәулет ескерткіштерінің бірі.",
    model: { type: "yurtStone", r: 4.6, h: 3.4, domeH: 3.6 } },
  { id: "bolgan", name: "Болған ана кесенесі", era: "XIII – XIV ғғ.", s: 13, loc: "Ұлытау обл., Сарысу бойы", lat: 47.5681, lon: 67.4853, region: "ulytau",
    desc: "Алтын Орда дәуіріне тән күйдірілген кірпіштен салынған кесене.",
    model: { type: "domedCube", size: 8, h: 6, dome: { r: 3.4, mat: "brick" }, portal: true } },
  { id: "korkyt", name: "Қорқыт ата кешені", era: "IX – XI ғғ.", s: 9, loc: "Қызылорда обл., Қармақшы ауд.", lat: 45.6039, lon: 63.9331, region: "syr",
    desc: "Оғыз-қыпшақ дәуірінің ұлы ойшылы, жырау Қорқыт атаға арналған мемориалдық кешен (көне мазары IX–XI ғғ. болған).",
    model: { type: "kobyz", h: 13 } },
  { id: "syrlytam", name: "Сырлытам кесенесі", era: "XII – XIII ғғ.", s: 12, loc: "Қызылорда обл., Жалағаш ауд.", lat: 44.7453, lon: 64.5586, region: "syr",
    desc: "XII–XIII ғасырларға жататын, сәнді порталды орта ғасырлық кесене.",
    model: { type: "portalDome", w: 10, d: 10, h: 7, portalH: 11, portalW: 9.5, dome: { r: 3.6, mat: "brick" }, towers: true, mat: "carpet" } }
].map(o => ({ ...o, kind: "mausoleum" }));

export const ALL = [...CITIES, ...MAUSOLEUMS];

// Ұлы Жібек жолының шартты бағыты (қала id-лері бойынша)
export const SILK_ROUTE = ["saraishyk", "zhankent", "syganak", "sauran", "yassy", "otrar", "ispijab", "taraz", "balasagun", "talgar", "koilyk"];

export const KIND_LABEL = { city: "Қала", mausoleum: "Кесене" };
export const MODEL_TYPE_LABEL = {
  portalDome: "Порталды-күмбезді кесене", domedCube: "Күмбезді шаршы кесене", tentDome: "Шатырлы күмбезді кесене",
  longTomb: "Ұзынша мазар", yurtStone: "Киіз үй пішінді тас кесене", kobyz: "Заманауи мемориал (қобыз пішіні)"
};

// 3D модельдің не көрсететіні (тип бойынша)
export const MODEL_TYPE_DESC = {
  portalDome: "биік пештақ (портал) және сүйір аркалы тауаша, бүйір мұнаралар, негізгі зал, барабан мен күмбез",
  domedCube: "шаршы негіз, шаршыдан дөңгелекке өтетін сегізқырлы белдеу, барабан, күмбез және кіреберіс порталы",
  tentDome: "шаршы негіз, сегізқырлы белдеу және 16 қырлы ойыс шатыр-күмбез",
  longTomb: "ұзынша күмбезді мазар, кіреберістегі күмбезді бөлме және құдық",
  yurtStone: "киіз үй пішінді дөңгелек тас қабырға мен күмбез тәрізді тас жабын",
  kobyz: "дөңгелек алаң және қобыз пішінді төрт бетон қанат (1980 ж. мемориал)"
};

const ROMAN =["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
export const roman = n => ROMAN[n] || String(n);

export const byId = id => ALL.find(o => o.id === id);
export const regionOf = o => REGIONS[o.kind][o.region];
export const titleOf = o => o.alt ? `${o.name} (${o.alt})` : o.name;
export const url = o => `object.html?id=${encodeURIComponent(o.id)}`;

// Екі нүкте арасындағы қашықтық, км (гаверсинус)
export function distanceKm(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const nearest = (o, n = 4) => ALL.filter(x => x.id !== o.id)
  .map(x => ({ o: x, km: distanceKm(o, x) })).sort((a, b) => a.km - b.km).slice(0, n);

// Нысан түріне қарай цифрлық сақтау әдістерін ұсыну (логикалық ереже)
export function preservationPlan(o) {
  const steps = [];
  if (o.kind === "city") {
    steps.push(["Аэро-LiDAR және дрон фотограмметриясы", "Қалашықтың бүкіл аумағын (шахристан, рабад, қорған) жоғарыдан түсіріп, жер бедерінің цифрлық моделін жасау."]);
    steps.push(["Геофизикалық барлау (георадар)", "Қазылмаған құрылыстар мен көшелердің жер астындағы іздерін анықтау."]);
    if (o.model.kariz) steps.push(["Кәріз жүйесін картаға түсіру", "Жерасты су жолдарының бағытын ГИС-ке енгізіп, тұрақты су басқару тәжірибесі ретінде зерттеу."]);
    if (o.model.river) steps.push(["Гидрологиялық мониторинг", "Өзен арнасы мен жерасты суларының қалашыққа әсерін бақылау."]);
    steps.push(["GIS + VR реконструкция", "Қазба деректері негізінде қаланың әр дәуірдегі көрінісін виртуалды турға айналдыру."]);
  } else {
    steps.push(["Жердегі лазерлік сканерлеу (TLS)", "Қабырға, портал және күмбезді миллиметрлік дәлдікпен өлшеу."]);
    steps.push(["HBIM моделі", "Кірпіш түрі, қалау тәсілі, жарықтар мен тозу деңгейін модельге атрибут ретінде енгізу."]);
    if (o.model.dome || o.model.type === "tentDome") steps.push(["Күмбездің құрылымдық талдауы", "Күмбез бен барабандағы кернеуді цифрлық егіз арқылы есептеу."]);
    if (o.model.mat === "ornament" || o.model.mat === "carpet") steps.push(["Өрнек каталогы", "Терракота және кірпіш өрнектерін фотограмметриямен жеке-жеке цифрландыру."]);
    if (o.s <= 12) steps.push(["Ылғал мен тұз мониторингі", "Көне кірпіштің капиллярлық ылғалдан бұзылуын датчиктермен бақылау."]);
    steps.push(["AR/VR көрсетілім", "Модельді виртуалды туризм мен білім беруде пайдалану."]);
  }
  return steps;
}
