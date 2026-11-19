/* ===================== THEME ===================== */
(function(){
  const root=document.documentElement;
  let saved=null; try{saved=localStorage.getItem("theme")}catch(e){}
  if(saved) root.setAttribute("data-theme",saved);
  document.getElementById("themeBtn").onclick=()=>{
    const dark = root.getAttribute("data-theme") ? root.getAttribute("data-theme")==="dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    const next = dark?"light":"dark"; root.setAttribute("data-theme",next);
    try{localStorage.setItem("theme",next)}catch(e){}
  };
})();

/* ===================== MAP FACTORY ===================== */
const STYLE_URL="https://tiles.openfreemap.org/styles/liberty";
const SAT_TILES="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const DEM_TILES="https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

function circlePoly(lon,lat,km,steps=32){
  const pts=[];
  for(let i=0;i<=steps;i++){
    const a=i/steps*2*Math.PI;
    pts.push([lon+(km/(111.32*Math.cos(lat*Math.PI/180)))*Math.cos(a), lat+(km/110.57)*Math.sin(a)]);
  }
  return [pts];
}

const MAPS={};
function createMap(cfg){
  const shell=document.getElementById(cfg.shell);
  const listEl=shell.querySelector("[data-list]");
  const filtEl=shell.querySelector("[data-filters]");
  const searchEl=shell.querySelector("[data-search]");
  const legendEl=shell.querySelector("[data-legend]");
  const errEl=shell.querySelector(".map-err");
  const state={active:new Set(Object.keys(cfg.regions)),q:"",markers:[],popup:null,rotating:false,sel:-1};

  // legend
  legendEl.innerHTML=Object.values(cfg.regions).map(r=>`<div><i style="background:${r.color}"></i>${r.name}</div>`).join("")+(cfg.route?`<div><i style="background:#C8902E;height:3px;border-radius:0"></i>Ұлы Жібек жолы (шартты)</div>`:"")+`<div style="margin-top:6px;color:#6B6457">▮ ${cfg.legendNote}</div>`;

  // filters
  filtEl.innerHTML=`<button class="chip on" data-r="*">Барлығы</button>`+Object.entries(cfg.regions).map(([k,r])=>`<button class="chip on" data-r="${k}"><i style="background:${r.color}"></i>${r.name}</button>`).join("");
  filtEl.addEventListener("click",e=>{
    const b=e.target.closest(".chip"); if(!b) return;
    const k=b.dataset.r;
    if(k==="*"){ const all=state.active.size===Object.keys(cfg.regions).length; state.active=new Set(all?[]:Object.keys(cfg.regions)); }
    else { state.active.has(k)?state.active.delete(k):state.active.add(k); }
    filtEl.querySelectorAll(".chip").forEach(c=>{
      c.classList.toggle("on", c.dataset.r==="*" ? state.active.size===Object.keys(cfg.regions).length : state.active.has(c.dataset.r));
    });
    refresh();
  });
  searchEl.addEventListener("input",()=>{state.q=searchEl.value.trim().toLowerCase();refresh();});

  function visible(it){return state.active.has(it.r) && (!state.q || it.n.toLowerCase().includes(state.q) || it.loc.toLowerCase().includes(state.q));}

  function renderList(){
    const groups=Object.keys(cfg.regions);
    let html="";
    groups.forEach(g=>{
      const items=cfg.data.map((it,i)=>({it,i})).filter(o=>o.it.r===g && visible(o.it));
      if(!items.length) return;
      html+=`<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding:12px 10px 4px;font-weight:600">${cfg.regions[g].name}</div>`;
      items.forEach(({it,i})=>{
        html+=`<button class="item${state.sel===i?" active":""}" data-i="${i}"><b><span class="dot" style="background:${cfg.regions[it.r].color}"></span>${it.n}</b><small>${it.era} · ${it.loc}</small></button>`;
      });
    });
    listEl.innerHTML=html||`<p style="padding:14px;color:var(--muted);font-size:14px">Ештеңе табылмады</p>`;
  }
  listEl.addEventListener("click",e=>{const b=e.target.closest(".item"); if(b) select(+b.dataset.i,true);});
  listEl.addEventListener("mouseover",e=>{const b=e.target.closest(".item"); state.markers.forEach((m,i)=>m.getElement().classList.toggle("hl",b && +b.dataset.i===i));});
  listEl.addEventListener("mouseleave",()=>state.markers.forEach(m=>m.getElement().classList.remove("hl")));

  function refresh(){
    renderList();
    state.markers.forEach((m,i)=>m.getElement().classList.toggle("dim",!visible(cfg.data[i])));
    if(map && map.getLayer("pillars")){
      const keep=cfg.data.map((it,i)=>visible(it)?i:-1).filter(i=>i>=0);
      map.setFilter("pillars",["in",["get","i"],["literal",keep]]);
    }
  }

  let map;
  if(!window.maplibregl){ errEl.style.display="flex"; renderList(); return; }
  try{
    map=new maplibregl.Map({
      container:cfg.container, style:STYLE_URL,
      center:cfg.center, zoom:cfg.zoom, pitch:52, bearing:-12, maxPitch:80,
      attributionControl:{compact:true}, cooperativeGestures:false
    });
  }catch(err){ errEl.style.display="flex"; renderList(); return; }
  map.addControl(new maplibregl.NavigationControl({visualizePitch:true}),"top-right");
  map.addControl(new maplibregl.ScaleControl({unit:"metric"}),"bottom-right");
  map.scrollZoom.disable();
  map.getContainer().addEventListener("click",()=>map.scrollZoom.enable(),{once:true});

  map.once("style.load",()=>{
    const layers=map.getStyle().layers;
    const firstSymbol=(layers.find(l=>l.type==="symbol")||{}).id;
    map.addSource("sat",{type:"raster",tiles:[SAT_TILES],tileSize:256,maxzoom:18,attribution:"Esri World Imagery"});
    map.addLayer({id:"sat",type:"raster",source:"sat",layout:{visibility:"none"}},firstSymbol);
    map.addSource("dem",{type:"raster-dem",tiles:[DEM_TILES],tileSize:256,encoding:"terrarium",maxzoom:13,attribution:"AWS Terrain Tiles"});
    map.addSource("dem-h",{type:"raster-dem",tiles:[DEM_TILES],tileSize:256,encoding:"terrarium",maxzoom:13});
    map.addLayer({id:"hill",type:"hillshade",source:"dem-h",paint:{"hillshade-exaggeration":0.45,"hillshade-shadow-color":"#5a4630"}},firstSymbol);
    map.setTerrain({source:"dem",exaggeration:1.6});

    map.addSource("pillars",{type:"geojson",data:{type:"FeatureCollection",features:cfg.data.map((it,i)=>({
      type:"Feature",properties:{i,color:cfg.regions[it.r].color,h:cfg.height(it)},
      geometry:{type:"Polygon",coordinates:circlePoly(it.lon,it.lat,cfg.radius)}
    }))}});
    map.addLayer({id:"pillars",type:"fill-extrusion",source:"pillars",maxzoom:10.5,paint:{
      "fill-extrusion-color":["get","color"],"fill-extrusion-height":["get","h"],"fill-extrusion-base":0,"fill-extrusion-opacity":0.85
    }});
    if(cfg.route){
      const coords=cfg.route.map(i=>[cfg.data[i].lon,cfg.data[i].lat]);
      map.addSource("route",{type:"geojson",data:{type:"Feature",properties:{},geometry:{type:"LineString",coordinates:coords}}});
      map.addLayer({id:"route-glow",type:"line",source:"route",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#E8B04B","line-width":9,"line-opacity":0.25,"line-blur":4}},"pillars");
      map.addLayer({id:"route",type:"line",source:"route",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#C8902E","line-width":3,"line-dasharray":[2,1.5]}},"pillars");
    }
    map.on("click","pillars",e=>select(e.features[0].properties.i,true));
    map.on("mouseenter","pillars",()=>map.getCanvas().style.cursor="pointer");
    map.on("mouseleave","pillars",()=>map.getCanvas().style.cursor="");
    refresh();
  });
  let styleOk=false; map.once("style.load",()=>styleOk=true);
  setTimeout(()=>{ if(!styleOk) errEl.style.display="flex"; },20000);

  // HTML markers
  cfg.data.forEach((it,i)=>{
    const el=document.createElement("div"); el.className="mk";
    el.innerHTML=`<span class="pin" style="background:${cfg.regions[it.r].color}"></span><span class="lbl">${cfg.short(it)}</span>`;
    el.addEventListener("click",ev=>{ev.stopPropagation();select(i,true);});
    const m=new maplibregl.Marker({element:el,anchor:"left",offset:[-7,0]}).setLngLat([it.lon,it.lat]).addTo(map);
    state.markers.push(m);
  });

  function select(i,fly){
    const it=cfg.data[i]; state.sel=i; renderList();
    const c=cfg.regions[it.r].color;
    if(state.popup) state.popup.remove();
    state.popup=new maplibregl.Popup({offset:18,maxWidth:"320px"}).setLngLat([it.lon,it.lat]).setHTML(
      `<div class="pop"><h4>${it.n}</h4><span class="era" style="background:${c}">${it.era}</span><p>${it.d}</p><div class="loc">📍 ${it.loc}</div><div class="coord">${it.lat.toFixed(4)}° N, ${it.lon.toFixed(4)}° E</div><button data-back>← Бүкіл карта</button></div>`
    ).addTo(map);
    state.popup.getElement().querySelector("[data-back]").onclick=()=>{state.popup.remove();reset();};
    if(fly){ stopRotate(); map.flyTo({center:[it.lon,it.lat],zoom:cfg.flyZoom,pitch:62,bearing:(map.getBearing()+40)%360,duration:3200,essential:true}); }
  }
  // Автоматты саяхат: нысандарды кезекпен аралау
  let touring=null;
  function tour(btn){
    if(touring){ clearTimeout(touring); touring=null; btn.classList.remove("on"); btn.textContent="▶ Саяхат"; return; }
    const order=(cfg.route||cfg.data.map((_,i)=>i)).filter(i=>visible(cfg.data[i]));
    let k=0; btn.classList.add("on"); btn.textContent="■ Тоқтату";
    const next=()=>{ if(k>=order.length){ touring=null; btn.classList.remove("on"); btn.textContent="▶ Саяхат"; reset(); return; }
      select(order[k++],true); touring=setTimeout(next,6500); };
    next();
  }
  function reset(){ stopRotate(); state.sel=-1; renderList(); map.flyTo({center:cfg.center,zoom:cfg.zoom,pitch:52,bearing:-12,duration:2200}); }

  // tools
  let rafId=null;
  function stopRotate(){ state.rotating=false; cancelAnimationFrame(rafId); shell.querySelector('[data-act="rotate"]').classList.remove("on"); }
  function spin(){ if(!state.rotating) return; map.setBearing(map.getBearing()+0.12); rafId=requestAnimationFrame(spin); }
  shell.querySelector(".map-tools").addEventListener("click",e=>{
    const b=e.target.closest(".tool"); if(!b) return;
    const a=b.dataset.act;
    if(a==="sat"){ const on=!b.classList.contains("on"); b.classList.toggle("on",on); if(map.getLayer("sat")) map.setLayoutProperty("sat","visibility",on?"visible":"none"); }
    if(a==="rotate"){ if(state.rotating){stopRotate();} else {state.rotating=true;b.classList.add("on");spin();} }
    if(a==="reset") reset();
    if(a==="route"){ const on=!b.classList.contains("on"); b.classList.toggle("on",on); ["route","route-glow"].forEach(id=>map.getLayer(id)&&map.setLayoutProperty(id,"visibility",on?"visible":"none")); }
    if(a==="tour") tour(b);
  });
  map.on("mousedown",stopRotate); map.on("touchstart",stopRotate);

  renderList();
  MAPS[cfg.key]={select,map,shell};
}

createMap({key:"cities",shell:"cityShell",container:"cityMap",data:CITIES,regions:CITY_REGIONS,
  // Ұлы Жібек жолының шартты бағыты: Сарайшық → Жанкент → Сығанақ → Сауран → Яссы → Отырар → Испиджаб → Тараз → Баласағұн → Талғар → Қойлық
  route:[10,5,2,1,3,0,4,6,7,8,9],
  center:[67.2,46.4],zoom:4.15,radius:14,flyZoom:14.2,
  height:it=>(it.e-it.s+1)*14000, short:it=>it.n.split(" (")[0],
  legendNote:"Бағана биіктігі = ғасырлар саны"});
createMap({key:"maus",shell:"mausShell",container:"mausMap",data:MAUS,regions:MAUS_REGIONS,
  center:[67.6,45.3],zoom:4.6,radius:6,flyZoom:16.3,
  height:it=>(21-it.s)*16000, short:it=>it.n.replace(/ (кесенесі|кешені)$/,"").replace(/ \(.*\)/,""),
  legendNote:"Бағана биіктігі = көнелігі"});

/* ===================== CHRONOLOGY ===================== */
(function(){
  const el=document.getElementById("chrono");
  const roman=["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX"];
  const pct=c=>((c-1)/19*100);
  let html=`<div class="ch-axis"><div></div><div class="ch-ticks">${[1,4,7,10,13,16,19].map(c=>`<span style="left:${pct(c)+100/38}%">${roman[c]}</span>`).join("")}</div></div>`;
  [...CITIES].sort((a,b)=>a.s-b.s).forEach(c=>{
    const i=CITIES.indexOf(c);
    html+=`<div class="ch-row" style="cursor:pointer" data-i="${i}"><div>${c.n.split(" (")[0]}</div><div class="ch-track"><div class="ch-bar" title="${c.era}" style="left:${pct(c.s)}%;width:${(c.e-c.s+1)/19*100}%;background:${CITY_REGIONS[c.r].color}"></div></div></div>`;
  });
  el.innerHTML=html;
  el.addEventListener("click",e=>{const r=e.target.closest(".ch-row"); if(r){document.getElementById("cityShell").scrollIntoView({behavior:"smooth",block:"center"}); MAPS.cities && MAPS.cities.select(+r.dataset.i,true);}});
})();

/* ===================== TABLE ===================== */
(function(){
  const tb=document.getElementById("tbody");
  function render(kind){
    const data=kind==="cities"?CITIES:MAUS;
    tb.innerHTML=data.map((d,i)=>`<tr data-i="${i}" data-k="${kind}"><td><b>${d.n}</b></td><td>${d.era}</td><td>${d.loc}</td><td class="mono">${d.lat.toFixed(4)}</td><td class="mono">${d.lon.toFixed(4)}</td></tr>`).join("");
  }
  document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{
    document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("on",x===b)); render(b.dataset.tab);
  });
  tb.addEventListener("click",e=>{
    const tr=e.target.closest("tr"); if(!tr) return;
    const m=MAPS[tr.dataset.k==="cities"?"cities":"maus"]; if(!m) return;
    m.shell.scrollIntoView({behavior:"smooth",block:"center"});
    setTimeout(()=>m.select(+tr.dataset.i,true),500);
  });
  render("cities");
})();

/* ===================== MORPH (Timeline) ===================== */
(function(){
  // mausoleum geometry shared by both renderings
  const geo=`
    <path class="base" d="M150 330h500v20H150z"/>
    <path class="wall" d="M200 330V190h400v140z"/>
    <path class="drum" d="M300 190v-30h200v30z"/>
    <path class="dome" d="M300 160q100-150 200 0z"/>
    <path class="portal" d="M330 330V150h140v180z"/>
    <path class="arch" d="M355 330V230q45-70 90 0v100z"/>
    <path class="tower" d="M200 330V175h24v155zM576 330V175h24v155z"/>`;
  const oldSvg=`<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMax meet">
    <defs><pattern id="brick" width="24" height="12" patternUnits="userSpaceOnUse"><rect width="24" height="12" fill="#C8875C"/><path d="M0 11.5h24M12 0v6M0 6h24M0 6v6M24 6v6" stroke="#A86B45" stroke-width="1"/></pattern>
    <linearGradient id="domeG" x1="0" x2="1"><stop offset="0" stop-color="#2E8FA8"/><stop offset="1" stop-color="#1B6A80"/></linearGradient></defs>
    <rect y="350" width="800" height="150" fill="#D9BE94"/>
    <g stroke="#7A4A2C" stroke-width="2">
      <path d="M150 330h500v20H150z" fill="#B97B52"/>
      <path d="M200 330V190h400v140z" fill="url(#brick)"/>
      <path d="M300 190v-30h200v30z" fill="#B97B52"/>
      <path d="M300 160q100-150 200 0z" fill="url(#domeG)"/>
      <path d="M330 330V150h140v180z" fill="url(#brick)"/>
      <path d="M355 330V230q45-70 90 0v100z" fill="#5A3A26"/>
      <path d="M200 330V175h24v155zM576 330V175h24v155z" fill="#B97B52"/>
      <path d="M340 165h120M340 175h120" stroke="#2E8FA8" stroke-width="5"/>
    </g></svg>`;
  const newSvg=`<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMax meet">
    <defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(127,214,232,.12)"/></pattern>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(127,214,232,.35)"/><stop offset="1" stop-color="rgba(26,166,196,.08)"/></linearGradient></defs>
    <rect width="800" height="500" fill="url(#grid)"/>
    <rect y="350" width="800" height="150" fill="rgba(127,214,232,.06)"/>
    <g fill="url(#glass)" stroke="#7FD6E8" stroke-width="1.6">${geo}</g>
    <g fill="none" stroke="#7FD6E8" stroke-width=".8" opacity=".7">
      ${[110,130,150].map(y=>{const h=(160-y)/75;const w=100*Math.sqrt(1-h);return `<path d="M${400-w} ${y}h${2*w}"/>`}).join("")}
      ${Array.from({length:9},(_,k)=>{const x=300+k*25;const top=160-150*(1-Math.pow((x-400)/100,2))/2;return `<path d="M400 85Q${x} ${top} ${x} 160"/>`}).join("")}
      ${Array.from({length:7},(_,k)=>`<path d="M200 ${205+k*18}h400"/>`).join("")}
      ${Array.from({length:16},(_,k)=>`<path d="M${225+k*25} 190v140"/>`).join("")}
    </g>
    <g fill="#00B4D8">${[[400,85],[300,160],[500,160],[330,150],[470,150],[200,190],[600,190]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4"/>`).join("")}</g>
  </svg>`;
  const oldL=document.getElementById("oldLayer"), newL=document.getElementById("modernLayer");
  oldL.innerHTML=oldSvg; newL.innerHTML=newSvg;
  const range=document.getElementById("morphRange"), div=document.getElementById("divider"), lbl=document.getElementById("morphPct");
  function upd(){
    const v=+range.value;
    oldL.style.clipPath=`inset(0 ${100-v}% 0 0)`;
    div.style.left=`calc(${v}% - 1px)`;
    lbl.textContent=`Заманауи · шыны/металл (${100-v}%)`;
  }
  range.addEventListener("input",upd); upd();

  // modules
  document.querySelectorAll(".mod").forEach(m=>m.onclick=()=>document.querySelectorAll(".mod").forEach(x=>x.classList.toggle("on",x===m)));
  setInterval(()=>{
    const j=(b,s,d)=>(b+(Math.random()-.5)*s).toFixed(d);
    document.getElementById("g1").textContent=j(2.0,.2,2);
    document.getElementById("g2").textContent=j(3.76,.3,2);
    document.getElementById("g3").textContent=j(.12,.04,2);
  },1500);
})();

/* ===================== MOBILE MENU & LIGHTBOX ===================== */
(function(){
  const btn=document.getElementById("menuBtn"), links=document.querySelector(".links");
  btn.onclick=()=>{ const o=links.classList.toggle("open"); btn.setAttribute("aria-expanded",o); };
  links.addEventListener("click",e=>{ if(e.target.tagName==="A"){ links.classList.remove("open"); btn.setAttribute("aria-expanded",false); } });
  const lb=document.getElementById("lightbox");
  document.querySelectorAll(".gallery figure").forEach(f=>f.onclick=()=>{ lb.querySelector("img").src=f.querySelector("img").src; lb.showModal(); });
  lb.addEventListener("click",()=>lb.close());
})();
