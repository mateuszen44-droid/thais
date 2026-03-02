
const $ = (s)=>document.querySelector(s);
const $$ = (s)=>document.querySelectorAll(s);

const store={
  get(k,f){try{const r=localStorage.getItem(k);return r?JSON.parse(r):f}catch(e){return f}},
  set(k,v){localStorage.setItem(k,JSON.stringify(v));}
};

const DEFAULT={
  profile:{name:"Thais"},
  cycle:{startDate:null, cycleLength:28, periodLength:5, lutealLength:14},
  symptoms:{date:todayISO(), mood:[], body:[], notes:""},
  prayers:[],
  devotions:[
    {id:"dev-1", title:"Força e dignidade", ref:"Pv 31:25", text:"Hoje, lembre-se: sua identidade em Cristo é mais forte que qualquer oscilação do dia. Respire, entregue a ansiedade, e caminhe com mansidão e coragem."},
    {id:"dev-2", title:"Paz no coração", ref:"Fp 4:6-7", text:"Leve tudo a Deus em oração. A paz que excede todo entendimento guarda sua mente. Mesmo com sintomas, Deus permanece constante."},
    {id:"dev-3", title:"Cuidado do Pai", ref:"Mt 6:26", text:"Você não está sozinha. O Pai cuida de você nos detalhes: corpo, emoções e descanso. Confie e siga um passo por vez."},
    {id:"dev-4", title:"Renovo diário", ref:"Lm 3:22-23", text:"A misericórdia do Senhor se renova a cada manhã. Recomece hoje com gratidão: pequenas escolhas fazem um grande caminho."},
    {id:"dev-5", title:"Deus é refúgio", ref:"Sl 46:1", text:"Em dias intensos, Deus é refúgio e fortaleza. Pare por um minuto, ore, e permita que Ele fortaleça o seu interior."}
  ]
};

function todayISO(){
  const t=new Date();return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
}
function parseISO(iso){return iso?new Date(iso+"T00:00:00"):null;}
function daysBetween(a,b){return Math.floor((b-a)/(24*60*60*1000));}
function escapeHtml(s){return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function formatBR(iso){if(!iso)return "—"; const [y,m,d]=iso.split("-"); return `${d}/${m}/${y}`;}

let state=store.get("pt_state", null);
if(!state){state=structuredClone(DEFAULT); store.set("pt_state",state);}
function persist(){store.set("pt_state",state);}

function cycleInfo(forISO=todayISO()){
  const c=state.cycle; const start=parseISO(c.startDate); const t=parseISO(forISO);
  if(!start) return {has:false};
  const dayIndex=((daysBetween(start,t)%c.cycleLength)+c.cycleLength)%c.cycleLength;
  const dayNumber=dayIndex+1;
  const isPeriod=dayNumber<=c.periodLength;
  const ovulationDay=Math.max(1, c.cycleLength-c.lutealLength);
  const fertileStart=Math.max(1, ovulationDay-5);
  const fertileEnd=Math.min(c.cycleLength, ovulationDay+1);
  const isFertile=dayNumber>=fertileStart && dayNumber<=fertileEnd;
  const isOvulation=dayNumber===ovulationDay;
  const deg=Math.round((dayIndex/c.cycleLength)*360);
  const cyclesPassed=Math.floor(daysBetween(start,t)/c.cycleLength);
  const next=new Date(start.getTime());
  next.setDate(start.getDate()+(cyclesPassed+1)*c.cycleLength);
  return {has:true, dayIndex, dayNumber, deg, isPeriod, isFertile, isOvulation, ovulationDay, fertileStart, fertileEnd, nextStartISO:next.toISOString().slice(0,10)};
}
function monthGrid(y,m){
  const first=new Date(y,m,1);
  const startDow=(first.getDay()+6)%7;
  const dim=new Date(y,m+1,0).getDate();
  const cells=[];
  for(let i=0;i<startDow;i++) cells.push(null);
  for(let d=1;d<=dim;d++){
    const iso=new Date(y,m,d).toISOString().slice(0,10);
    cells.push({d,iso});
  }
  while(cells.length%7!==0) cells.push(null);
  return cells;
}
function classifyDay(iso){
  const info=cycleInfo(iso);
  if(!info.has) return {cls:"", tag:""};
  if(info.isPeriod) return {cls:"period", tag:"Menstrual"};
  if(info.isOvulation) return {cls:"ovulation", tag:"Ovulação"};
  if(info.isFertile) return {cls:"fertile", tag:"Fértil"};
  return {cls:"", tag:""};
}
function verseOfDay(){
  const v=[
    {t:'"Ela é revestida de força e dignidade."', r:"Provérbios 31:25"},
    {t:'"Lance sobre Ele toda a sua ansiedade."', r:"1 Pedro 5:7"},
    {t:'"A minha graça te basta."', r:"2 Coríntios 12:9"},
    {t:'"A paz de Deus guardará o coração e a mente."', r:"Filipenses 4:7"},
    {t:'"Deus é o nosso refúgio."', r:"Salmos 46:1"}
  ];
  return v[new Date().getDate()%v.length];
}

const routes={home, calendar, symptoms, devotional, prayer, stats, settings, devotion_detail, help};
let current="home"; let params={};

function navTo(r,p={}){
  current=r; params=p;
  $$(".navbtn").forEach(b=>b.classList.toggle("active", b.getAttribute("data-route")===r));
  render(); window.scrollTo({top:0,behavior:"smooth"});
}

function render(){
  $("#content").innerHTML=(routes[current]||home)();
  bind();
}

function home(){
  const name=state.profile?.name||"Thais";
  const info=cycleInfo();
  const start=state.cycle.startDate?formatBR(state.cycle.startDate):"Não registrado";
  const next=info.has?formatBR(info.nextStartISO):"—";
  const status=!info.has?"Registre o início do ciclo para ver previsões.":
    info.isPeriod?"Fase Menstrual — seja gentil com você hoje.":
    info.isOvulation?"Ovulação — cuide do corpo e da mente.":
    info.isFertile?"Janela fértil — atenção ao seu planejamento.":
    "Fase pós-ovulatória — priorize descanso e hidratação.";
  const ringDay=info.has?info.dayNumber:0; const deg=info.has?info.deg:0;
  const v=verseOfDay();
  return `
    <section class="card hero">
      <div style="flex:1;min-width:260px">
        <div class="h1">Bem-vinda, ${escapeHtml(name)} 💗</div>
        <div class="p">Um app discreto e profissional, com inspiração cristã.</div>
        <div class="badges">
          <span class="badge">Offline</span><span class="badge">Branco + Rosa</span><span class="badge">Privado</span>
        </div>
        <div class="hr"></div>
        <div class="p"><b>Início do ciclo:</b> ${start}</div>
        <div class="p"><b>Próximo início (est.):</b> ${next}</div>
        <div class="p" style="margin-top:10px">${status}</div>
      </div>
      <div style="flex:1;min-width:260px">
        <img src="assets/hero_prayer.svg" alt="ilustração" />
      </div>
    </section>

    <section class="card">
      <div class="ringWrap">
        <div class="ring" style="--deg:${deg}deg">
          <div class="inner"><div class="big">${ringDay}</div><div class="small">dia do ciclo</div></div>
        </div>
        <div style="flex:1">
          <div class="h2">Registro rápido</div>
          <div class="p">Marque o início do ciclo e o app calcula automaticamente.</div>
          <div class="row" style="margin-top:12px">
            <div class="col" style="min-width:220px">
              <input type="date" id="cycleStart" value="${state.cycle.startDate||""}">
            </div>
            <div class="col" style="min-width:220px">
              <button class="btn" id="saveStart">Salvar início</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="card hero">
      <div style="flex:1;min-width:260px">
        <div class="h2">Versículo do dia</div>
        <div class="p" style="font-size:14px;color:#374151"><b>${v.t}</b> — ${v.r}</div>
        <div class="p" style="margin-top:10px"><b>Reflexão:</b> Deus cuida de você no invisível — emoções, corpo e descanso.</div>
      </div>
      <div style="flex:1;min-width:260px">
        <img src="assets/hero_bible.svg" alt="bíblia" />
      </div>
    </section>

    <section class="card">
      <div class="h2">Atalhos</div>
      <div class="row">
        <button class="btn secondary" id="goCalendar">📅 Calendário</button>
        <button class="btn secondary" id="goSymptoms">💗 Sintomas</button>
        <button class="btn secondary" id="goPrayer">🙏 Oração</button>
        <button class="btn secondary" id="goHelp">ℹ️ Ajuda</button>
      </div>
    </section>
  `;
}

function calendar(){
  const now=new Date();
  const year=params.year ?? now.getFullYear();
  const month=params.month ?? now.getMonth();
  const grid=monthGrid(year,month);
  const monthName=new Intl.DateTimeFormat("pt-BR",{month:"long"}).format(new Date(year,month,1));
  const head=["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map(x=>`<div>${x}</div>`).join("");
  const cells=grid.map(c=>{
    if(!c) return `<div class="day" style="opacity:0;border:0;background:transparent"></div>`;
    const {cls,tag}=classifyDay(c.iso);
    const isToday=c.iso===todayISO();
    return `<div class="day ${cls} ${isToday?"today":""}"><div class="d">${c.d}</div><div class="tag">${tag||"&nbsp;"}</div></div>`;
  }).join("");
  const info=cycleInfo();
  const notice=info.has
    ? `<div class="notice">Estimativa baseada em: <b>${state.cycle.cycleLength} dias</b> de ciclo e <b>${state.cycle.periodLength} dias</b> de menstruação.</div>`
    : `<div class="notice">Registre o <b>início do ciclo</b> na tela Início para ativar as estimativas.</div>`;
  return `
    <section class="card">
      <div class="row" style="align-items:center;justify-content:space-between">
        <div><div class="h1">Calendário</div><div class="p">${monthName.charAt(0).toUpperCase()+monthName.slice(1)} • ${year}</div></div>
        <div class="row">
          <button class="smallbtn" id="prevMonth">◀</button>
          <button class="smallbtn" id="nextMonth">▶</button>
        </div>
      </div>
      <div class="badges">
        <span class="badge"><b>Legenda</b></span>
        <span class="badge">Menstrual</span><span class="badge">Fértil</span><span class="badge">Ovulação</span>
      </div>
      ${notice}
      <div class="calHead">${head}</div>
      <div class="calendar">${cells}</div>
    </section>
  `;
}

function symptoms(){
  const s=state.symptoms || structuredClone(DEFAULT.symptoms);
  const date=s.date || todayISO();
  const moods=["Paz","Ansiedade","Irritada","Triste","Motivada","Cansada","Sensível"];
  const bodies=["Cólica","Dor de cabeça","Inchaço","Acne","Sono","Náusea","Dor lombar","Desejo por doce"];
  const moodChips=moods.map(x=>`<button class="chip ${s.mood?.includes(x)?"active":""}" data-chip="mood" data-val="${x}">${x}</button>`).join("");
  const bodyChips=bodies.map(x=>`<button class="chip ${s.body?.includes(x)?"active":""}" data-chip="body" data-val="${x}">${x}</button>`).join("");
  return `
    <section class="card">
      <div class="h1">Sintomas</div>
      <div class="p">Registre como você está hoje — tudo fica salvo offline.</div>
      <div class="hr"></div>
      <div class="row">
        <div class="col" style="min-width:220px"><div class="h2">Data</div><input type="date" id="symDate" value="${date}"></div>
        <div class="col" style="min-width:220px"><div class="h2">Resumo</div>${cycleMini()}</div>
      </div>
    </section>
    <section class="card">
      <div class="h2">Humor</div><div class="chips" id="moodChips">${moodChips}</div>
      <div class="hr"></div>
      <div class="h2">Corpo</div><div class="chips" id="bodyChips">${bodyChips}</div>
    </section>
    <section class="card">
      <div class="h2">Notas</div>
      <textarea id="symNotes" placeholder="Ex.: descansar mais, beber água, separar tempo de oração.">${escapeHtml(s.notes||"")}</textarea>
      <div class="row" style="margin-top:12px">
        <button class="btn" id="saveSymptoms">Salvar sintomas</button>
        <button class="btn secondary" id="clearSymptoms">Limpar</button>
      </div>
    </section>
  `;
}
function cycleMini(){
  const info=cycleInfo();
  if(!info.has) return `<div class="p">Sem ciclo registrado.</div>`;
  const phase=info.isPeriod?"Menstrual":info.isOvulation?"Ovulação":info.isFertile?"Fértil":"Pós-ovulatória";
  return `<div class="p"><b>Dia:</b> ${info.dayNumber}/${state.cycle.cycleLength}</div>
          <div class="p"><b>Fase:</b> ${phase}</div>
          <div class="p"><b>Próximo:</b> ${formatBR(info.nextStartISO)}</div>`;
}

function devotional(){
  const list=state.devotions||[];
  const items=list.map(d=>`
    <div class="item">
      <div><div style="font-weight:950">${escapeHtml(d.title)}</div><div class="meta">${escapeHtml(d.ref)}</div></div>
      <div><button class="smallbtn" data-open-dev="${d.id}">Abrir</button></div>
    </div>
  `).join("");
  return `
    <section class="card">
      <div class="h1">Devocional</div>
      <div class="p">Leituras curtas para fortalecer o coração em cada fase do ciclo.</div>
    </section>
    <section class="card">
      <div class="h2">Lista</div>
      <div class="list">${items}</div>
    </section>
  `;
}

function devotion_detail(){
  const id=params.id;
  const d=(state.devotions||[]).find(x=>x.id===id);
  if(!d) return `<section class="card"><div class="h1">Devocional</div><div class="p">Não encontrado.</div></section>`;
  return `
    <section class="card">
      <div class="h1">${escapeHtml(d.title)}</div>
      <div class="p"><b>${escapeHtml(d.ref)}</b></div>
      <div class="hr"></div>
      <div class="p" style="font-size:14px;line-height:1.6;color:#374151">${escapeHtml(d.text)}</div>
      <div class="hr"></div>
      <div class="row">
        <button class="btn secondary" id="backDev">Voltar</button>
        <button class="btn" id="copyDev">Copiar</button>
      </div>
    </section>
  `;
}

function prayer(){
  const prayers=state.prayers||[];
  const items=prayers.length?prayers.map((p,i)=>`
    <div class="item">
      <div>
        <div style="font-weight:950">${escapeHtml(p.title||"Pedido de oração")}</div>
        <div class="meta">${formatBR(p.date)} • ${escapeHtml(p.status)}</div>
        <div class="meta">${escapeHtml(p.text).slice(0,120)}${p.text.length>120?"…":""}</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="smallbtn" data-pray-done="${i}">Respondido</button>
        <button class="smallbtn" data-pray-del="${i}">Excluir</button>
      </div>
    </div>
  `).join(""):`<div class="p">Nenhum pedido ainda. Escreva o primeiro abaixo. 🙏</div>`;
  return `
    <section class="card">
      <div class="h1">Oração</div>
      <div class="p">Guarde pedidos e testemunhos com simplicidade.</div>
    </section>
    <section class="card">
      <div class="h2">Novo pedido</div>
      <div class="row">
        <div class="col"><input id="prayTitle" placeholder="Título (ex.: Paz e descanso)"></div>
        <div class="col" style="min-width:220px">
          <select id="prayStatus"><option>Em oração</option><option>Respondido</option><option>Aguardando</option></select>
        </div>
      </div>
      <textarea id="prayText" placeholder="Escreva aqui..."></textarea>
      <div class="row" style="margin-top:12px">
        <button class="btn" id="savePrayer">Salvar</button>
        <button class="btn secondary" id="insertVerse">Inserir versículo</button>
      </div>
    </section>
    <section class="card"><div class="h2">Meus pedidos</div><div class="list">${items}</div></section>
  `;
}

function stats(){
  const info=cycleInfo();
  const c=state.cycle;
  const reg=!!c.startDate;
  const phase=!reg?"—":info.isPeriod?"Menstrual":info.isOvulation?"Ovulação":info.isFertile?"Fértil":"Pós-ovulatória";
  const cycleW=reg?Math.round((info.dayIndex/c.cycleLength)*100):0;
  const periodW=reg?Math.round((c.periodLength/c.cycleLength)*100):0;
  const fertileW=reg?Math.round(((info.fertileEnd-info.fertileStart+1)/c.cycleLength)*100):0;
  return `
    <section class="card">
      <div class="h1">Estatísticas</div>
      <div class="p">Visão rápida do ciclo (estimativas). Ajuste o ciclo em “Ajustes” para mais precisão.</div>
    </section>
    <section class="card">
      <div class="row">
        <div class="col"><div class="h2">Dia</div><div style="font-size:26px;font-weight:950">${reg?info.dayNumber:"—"}</div></div>
        <div class="col"><div class="h2">Fase</div><div style="font-size:18px;font-weight:950">${phase}</div></div>
        <div class="col"><div class="h2">Próximo</div><div style="font-size:18px;font-weight:950">${reg?formatBR(info.nextStartISO):"—"}</div></div>
      </div>
      <div class="hr"></div>
      <div class="p"><b>Progresso do ciclo</b> (${cycleW}%)</div>
      <div class="progress" style="--w:${cycleW}%"><div></div></div>
      <div class="p" style="margin-top:12px"><b>Duração da menstruação</b> (${periodW}%)</div>
      <div class="progress" style="--w:${periodW}%"><div></div></div>
      <div class="p" style="margin-top:12px"><b>Janela fértil (estimativa)</b> (${fertileW}%)</div>
      <div class="progress" style="--w:${fertileW}%"><div></div></div>
      <div class="notice" style="margin-top:12px"><b>Observação:</b> este app não é método contraceptivo.</div>
    </section>
  `;
}

function settings(){
  const c=state.cycle; const name=state.profile?.name||"Thais";
  return `
    <section class="card">
      <div class="h1">Ajustes</div>
      <div class="p">Personalize o ciclo e o perfil.</div>
    </section>
    <section class="card">
      <div class="h2">Perfil</div>
      <div class="row">
        <div class="col"><input id="profileName" value="${escapeHtml(name)}" placeholder="Nome"></div>
        <div class="col" style="min-width:220px"><button class="btn" id="saveProfile">Salvar perfil</button></div>
      </div>
    </section>
    <section class="card">
      <div class="h2">Ciclo</div>
      <div class="row">
        <div class="col" style="min-width:220px"><div class="p"><b>Início</b></div><input type="date" id="setStart" value="${c.startDate||""}"></div>
        <div class="col" style="min-width:220px"><div class="p"><b>Ciclo (dias)</b></div><input type="number" min="20" max="45" id="setCycleLen" value="${c.cycleLength}"></div>
        <div class="col" style="min-width:220px"><div class="p"><b>Menstruação (dias)</b></div><input type="number" min="2" max="10" id="setPeriodLen" value="${c.periodLength}"></div>
      </div>
      <div class="row" style="margin-top:12px">
        <button class="btn" id="saveCycle">Salvar ciclo</button>
        <button class="btn secondary" id="resetAll">Resetar tudo</button>
      </div>
    </section>
    <section class="card">
      <div class="h2">Privacidade</div>
      <div class="notice">Seus dados ficam salvos <b>somente no celular</b> (offline). Para backup em nuvem, peça a versão com login.</div>
    </section>
  `;
}

function help(){
  return `
    <section class="card">
      <div class="h1">Ajuda</div>
      <div class="p"><b>1)</b> Em <b>Início</b>, registre o primeiro dia do ciclo.</div>
      <div class="p"><b>2)</b> Veja marcações no <b>Calendário</b>.</div>
      <div class="p"><b>3)</b> Em <b>Sintomas</b>, registre humor/corpo.</div>
      <div class="p"><b>4)</b> Use <b>Devocional</b> e <b>Oração</b>.</div>
      <div class="hr"></div>
      <div class="row">
        <button class="btn secondary" id="helpBack">Voltar</button>
        <button class="btn" id="helpGoSettings">Ajustar ciclo</button>
      </div>
    </section>
  `;
}

function bind(){
  // top quick save
  const quick=$("#btnQuickSave"); if(quick) quick.onclick=()=>{state.cycle.startDate=todayISO(); persist(); render();};
  // home
  const save=$("#saveStart"); if(save) save.onclick=()=>{
    const iso=$("#cycleStart").value; if(!iso) return alert("Selecione uma data.");
    state.cycle.startDate=iso; persist(); render();
  };
  if($("#goCalendar")) $("#goCalendar").onclick=()=>navTo("calendar");
  if($("#goSymptoms")) $("#goSymptoms").onclick=()=>navTo("symptoms");
  if($("#goPrayer")) $("#goPrayer").onclick=()=>navTo("prayer");
  if($("#goHelp")) $("#goHelp").onclick=()=>navTo("help");

  // calendar nav
  if($("#prevMonth")) $("#prevMonth").onclick=()=>{
    const now=new Date(); const y=params.year ?? now.getFullYear(); const m=params.month ?? now.getMonth();
    const d=new Date(y,m-1,1); navTo("calendar",{year:d.getFullYear(),month:d.getMonth()});
  };
  if($("#nextMonth")) $("#nextMonth").onclick=()=>{
    const now=new Date(); const y=params.year ?? now.getFullYear(); const m=params.month ?? now.getMonth();
    const d=new Date(y,m+1,1); navTo("calendar",{year:d.getFullYear(),month:d.getMonth()});
  };

  // symptoms chips
  $$("#moodChips .chip, #bodyChips .chip").forEach(ch=>{
    ch.onclick=()=>{
      const group=ch.getAttribute("data-chip");
      const val=ch.getAttribute("data-val");
      const arr=(state.symptoms[group]??[]).slice();
      const idx=arr.indexOf(val); if(idx>=0) arr.splice(idx,1); else arr.push(val);
      state.symptoms[group]=arr; persist(); render();
    };
  });
  if($("#saveSymptoms")) $("#saveSymptoms").onclick=()=>{
    state.symptoms.date=$("#symDate").value || todayISO();
    state.symptoms.notes=$("#symNotes").value || "";
    persist(); alert("Sintomas salvos ✅");
  };
  if($("#clearSymptoms")) $("#clearSymptoms").onclick=()=>{
    state.symptoms=structuredClone(DEFAULT.symptoms); state.symptoms.date=todayISO(); persist(); render();
  };

  // devotional open
  $$("[data-open-dev]").forEach(b=> b.onclick=()=>navTo("devotion_detail",{id:b.getAttribute("data-open-dev")}));
  if($("#backDev")) $("#backDev").onclick=()=>navTo("devotional");
  if($("#copyDev")) $("#copyDev").onclick=async ()=>{
    const d=(state.devotions||[]).find(x=>x.id===params.id); if(!d) return;
    const txt=`${d.title} (${d.ref})\n\n${d.text}`;
    try{ await navigator.clipboard.writeText(txt); alert("Copiado ✅"); }catch(e){ alert("Não foi possível copiar aqui."); }
  };

  // prayer
  if($("#savePrayer")) $("#savePrayer").onclick=()=>{
    const title=$("#prayTitle").value.trim();
    const status=$("#prayStatus").value;
    const text=$("#prayText").value.trim();
    if(!text) return alert("Escreva seu pedido.");
    state.prayers.unshift({title,status,text,date:todayISO()}); persist(); navTo("prayer");
  };
  if($("#insertVerse")) $("#insertVerse").onclick=()=>{
    const v=verseOfDay(); const t=$("#prayText");
    t.value=(t.value?t.value+"\n\n":"")+`${v.t} — ${v.r}`;
  };
  $$("[data-pray-del]").forEach(b=> b.onclick=()=>{const i=Number(b.getAttribute("data-pray-del")); state.prayers.splice(i,1); persist(); render();});
  $$("[data-pray-done]").forEach(b=> b.onclick=()=>{const i=Number(b.getAttribute("data-pray-done")); const p=state.prayers[i]; if(!p) return; p.status="Respondido"; persist(); render();});

  // settings
  if($("#saveProfile")) $("#saveProfile").onclick=()=>{state.profile.name=$("#profileName").value.trim()||"Thais"; persist(); alert("Perfil salvo ✅"); render();};
  if($("#saveCycle")) $("#saveCycle").onclick=()=>{
    state.cycle.startDate=$("#setStart").value || null;
    state.cycle.cycleLength=clamp($("#setCycleLen").value,20,45,28);
    state.cycle.periodLength=clamp($("#setPeriodLen").value,2,10,5);
    persist(); alert("Ciclo salvo ✅"); render();
  };
  if($("#resetAll")) $("#resetAll").onclick=()=>{ if(!confirm("Resetar tudo?")) return; localStorage.removeItem("pt_state"); state=structuredClone(DEFAULT); persist(); render(); };

  // help
  if($("#helpBack")) $("#helpBack").onclick=()=>navTo("home");
  if($("#helpGoSettings")) $("#helpGoSettings").onclick=()=>navTo("settings");

  // bottom nav
  $$(".navbtn").forEach(btn=> btn.onclick=()=>navTo(btn.getAttribute("data-route")));
}

function clamp(v,min,max,fb){
  const n=Number(v); if(!Number.isFinite(n)) return fb;
  return Math.min(max, Math.max(min, Math.round(n)));
}

render();
