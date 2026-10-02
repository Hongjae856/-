/* ═══════════════════════════════════════════════════════════════════
   셸 — 메인화면 · 상단 바 · 조작 화면 전환 · 순차 통합 과정 · 연동 루프 · 종합 결과 · 버전 이력
   · 두 앱(충전기 / 포장라인 IDT)은 각각 iframe 으로 항상 함께 살아 있고, 3D 는 보이는 앱이 두 설비를 한 장면으로 그린다.
   · 순차 통합 과정(가동) : ① 충전기 준비(START 직전) → ② 포장라인 준비 → 자동 운전 시작 → ③ 충전기 START · 연동 가동 → ④ 정지 · 회수
     체인지파트 : ① 충전기 교체부품 → ② 포장라인 교체부품. 각 앱의 단계 · 채점은 그대로 쓰고, 셸은 순서 관문만 둔다.
   ═══════════════════════════════════════════════════════════════════ */
const APPS=JSON.parse(document.getElementById('apps').textContent);
const $=s=>document.querySelector(s);
const FR={};
let active='filler', SPDSYNC=1, demoBusy=false;
function decode(b){ return new TextDecoder().decode(Uint8Array.from(atob(b),c=>c.charCodeAt(0))); }
function win(k){ try{ return FR[k]&&FR[k].contentWindow; }catch(e){ return null; } }
function api(k){ const w=win(k); return w&&w.ROOM_API||null; }
function crs(k){ const w=win(k); return w&&w.UNI_COURSE||null; }
function toast(t,ms){ const e=$('#toast'); e.textContent=t; e.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(()=>e.classList.remove('on'),ms||2800); }
const wait=ms=>new Promise(r=>setTimeout(r,ms));

/* ── 두 앱 iframe ── */
for(const k of ['filler','line']){
  const f=document.createElement('iframe');
  f.title=k==='filler'?'충전 조작 화면 · PTP 충전기':'포장 조작 화면 · PTP 포장라인';
  f.dataset.room=k;
  if(k!==active) f.classList.add('off');
  f.srcdoc=decode(APPS[k]);
  $('#stage').appendChild(f); FR[k]=f;
}
const loaded=k=>new Promise((res,rej)=>{ const t0=performance.now(); const t=()=>(api(k)&&crs(k))?res():(performance.now()-t0>25000?rej(Error((k==='filler'?'충전':'포장')+' 화면 로딩 지연')):setTimeout(t,60)); t(); });

/* ── 조작 화면 전환 : 3D 장면 · 시점은 그대로, 조작 UI 만 바뀐다 ── */
function $$rooms(){ return document.querySelectorAll('#rooms button'); }
function setRoom(k){
  if(k===active||!FR[k]) return;
  const from=active; active=k; UNI_HUB.active=k;
  $$rooms().forEach(b=>b.classList.toggle('on',b.dataset.room===k));
  const wi=win(k);
  try{ wi&&wi.UNI_SETCAM&&wi.UNI_SETCAM(wi.UNI_MM.TO_UNITS[k](UNI_HUB.cam)); }catch(e){ console.error(e); }
  FR[k].classList.remove('off'); FR[from].classList.add('off');
  FR[k].focus();
}
$$rooms().forEach(b=>b.addEventListener('click',()=>setRoom(b.dataset.room)));

/* ── 배속 동기화 (두 설비는 한 라인 → 항상 같은 배속) ── */
function syncSpd(){
  const fa=api('filler'), la=api('line'); if(!fa||!la) return;
  const sf=fa.getSpd(), sl=la.getSpd();
  if(sf!==SPDSYNC&&sf===sl){ SPDSYNC=sf; return; }
  if(active==='filler'&&sf!==SPDSYNC){ SPDSYNC=sf; la.setSpd(sf); }
  else if(active==='line'&&sl!==SPDSYNC){ SPDSYNC=sl; fa.setSpd(sl); }
  else if(sf!==sl) la.setSpd(sf);
}

/* ═══ 순차 통합 과정 ═══ */
const FLOW={on:false, course:null, mode:null, excl:{filler:false,line:false}, res:{filler:null,line:null}, lineBegun:false, lineStarted:false, fillerAutoStarted:false, shown:false, demo:false};
const isExamMode=()=>FLOW.mode==='exam'||FLOW.mode==='examEasy';
const LABEL={easy:'기본학습',guide:'심화학습',examEasy:'기본평가',exam:'심화평가'};
UNI_HUB.flow={
  hold:false,
  ended(side,r){ FLOW.res[side]=r||{}; afterEnd(side); },
  gateFillerStart(){
    if(!FLOW.on||FLOW.course!=='operation'||FLOW.excl.line||FLOW.lineStarted) return null;
    return '순차 과정 — 포장실(G구역)에서 포장라인 준비 → 자동 운전 시작을 먼저 완료한 뒤 충전기 START 를 누르세요';
  }
};
UNI_HUB.ui={filler:{note:null,veil:null}, line:{note:null,veil:null}};
function fInfo(){ const c=crs('filler'); try{ return c&&c.info(); }catch(e){ return null; } }
function lInfo(){ const c=crs('line'); try{ return c&&c.info(); }catch(e){ return null; } }
/* 충전기가 START 단계(가동) / 과정 끝(체인지파트)에 도달했는가 */
function fillerPrepDone(f){
  if(FLOW.excl.filler) return true;
  if(!f) return false;
  if(FLOW.course==='change') return f.ended||f.tIdx>=f.n-1;
  return f.startIdx>=0&&f.tIdx>=f.startIdx;
}
async function beginCourse(course,mode){
  try{
    await loaded('filler'); await loaded('line');
    resetFlow(); FLOW.on=true; FLOW.course=course; FLOW.mode=mode;
    ROOMBUS.st.link=false; ROOMBUS.reset(); try{ api('line').resetBuckets(); }catch(e){}
    $('#home').hidden=true; setRoom('filler');
    UNI_HUB.flow.hold=true;
    crs('filler').begin(course,mode);              /* 가동 : 충전기 품목 · 성형 방법 선택 창 → 확인 시 시작 */
    updateBar();
  }catch(e){ console.error(e); toast('과정 시작 실패 — '+e.message,5000); }
}
/* 충전기 과정이 실제로 시작되면(품목 확인) 포장라인 과정도 같은 과정 · 모드 · 품목으로 시작한다 */
ROOMBUS.onCourse=function(side){
  if(!FLOW.on||side!=='filler'||FLOW.lineBegun) return;
  FLOW.lineBegun=true;
  const f=fInfo();
  try{ crs('line').begin(FLOW.course,FLOW.mode,f?f.product:'A'); }catch(e){ console.error(e); }
  ROOMBUS.reset(); try{ api('line').resetBuckets(); }catch(e){}
  ROOMBUS.st.link=true;
  SPDSYNC=1; api('filler').setSpd(1); api('line').setSpd(1);
  if(FLOW.excl.filler) applyExclude('filler');
  if(FLOW.excl.line) applyExclude('line');
  updateBar();
};
function resetFlow(){
  Object.assign(FLOW,{ending:false,on:false,course:null,mode:null,excl:{filler:false,line:false},res:{filler:null,line:null},lineBegun:false,lineStarted:false,fillerAutoStarted:false,shown:false,demo:false});
  UNI_HUB.ui.filler={note:null,veil:null}; UNI_HUB.ui.line={note:null,veil:null};
  $('#resModal').hidden=true;
}
/* [충전준비] · [포장준비] : 해당 설비를 가동 준비 완료 상태로 만들고 채점에서 제외 */
function applyExclude(side){
  const c=crs(side); if(!c) return;
  try{ c.exclude(FLOW.course); }catch(e){ console.error(e); }
  FLOW.res[side]={excluded:true};
  if(side==='line'&&FLOW.course==='operation'){ try{ c.start(); }catch(e){} }   /* 포장라인은 먼저 기동해 둔다 (제품 대기) */
}
function toggleOpt(side){
  if(!FLOW.on||FLOW.demo){ toast('먼저 메인화면에서 과정을 시작하세요.'); return; }
  if(FLOW.excl[side]) return;
  const other=side==='filler'?'line':'filler';
  if(FLOW.excl[other]){ toast('두 설비를 모두 자동 준비하면 학습할 설비가 없습니다 — 메인화면의 [연동 가동 시연]을 이용하세요.',4200); return; }
  const nm=side==='filler'?'충전기':'포장라인';
  if(!confirm(nm+'를 가동 준비 완료 상태로 만들고 채점에서 제외할까요? (이 과정에서는 되돌릴 수 없습니다)')) return;
  FLOW.excl[side]=true;
  if(FLOW.lineBegun||side==='filler') applyExclude(side);
  if(side==='filler'&&!FLOW.lineBegun){            /* 품목 선택 전이면 기본 품목으로 충전기 과정을 바로 시작 */
    try{ crs('filler').quickStart(FLOW.mode); }catch(e){ console.error(e); }
  }
  toast(nm+' 자동 준비 완료 — '+(side==='filler'?'포장라인':'충전기')+'만 학습합니다 (채점 제외 : '+nm+')',4200);
  setRoom(other); updateBar();
}
$('#optF').addEventListener('click',()=>toggleOpt('filler'));
$('#optL').addEventListener('click',()=>toggleOpt('line'));
/* 평가 시작 · 학습(평가) 종료 */
$('#btnExam').addEventListener('click',()=>{
  if(!FLOW.on) return;
  for(const k of ['filler','line']) if(!FLOW.excl[k]){ try{ crs(k).testStart(); }catch(e){} }
  $('#btnExam').hidden=true; toast('평가 시작 — 시간 측정을 시작합니다. 충전기 준비부터 진행하세요.',3600);
});
$('#btnEnd').addEventListener('click',()=>{
  if(!FLOW.on){ toast('진행 중인 과정이 없습니다.'); return; }
  if(FLOW.demo){ stopDemo(); return; }
  if(!confirm((isExamMode()?'평가':'학습')+'를 종료하고 종합 결과를 볼까요?')) return;
  FLOW.ending=true;
  for(const k of ['filler','line']) if(!FLOW.excl[k]&&!FLOW.res[k]){ try{ crs(k).finish(); }catch(e){ console.error(e); } }
  setTimeout(()=>{ FLOW.ending=false; for(const k of ['filler','line']) if(!FLOW.res[k]) FLOW.res[k]={missing:true}; showResult(); },400);
});
function afterEnd(side){
  const other=side==='filler'?'line':'filler';
  if(!FLOW.ending&&!FLOW.res[other]&&!FLOW.excl[other]) toast((side==='filler'?'충전기':'포장라인')+' 과정 완료 — '+(other==='filler'?'충전기':'포장라인')+' 과정을 마저 진행하세요. 상단 [학습 종료] 로 종합 결과를 볼 수 있습니다.',4500);
  if(FLOW.res.filler&&FLOW.res.line) showResult();
}
function showResult(){
  if(FLOW.shown) return; FLOW.shown=true;
  const rows=[], inc=[];
  for(const k of ['filler','line']){
    const r=FLOW.res[k]||{}, nm=k==='filler'?'충전기 (HM 400P)':'포장라인 (카토너 → 팔렛타이저)';
    if(r.excluded){ rows.push('<tr><td>'+nm+'</td><td class="c">—</td><td class="c">—</td><td class="c">자동 준비 (채점 제외)</td><td class="c">—</td></tr>'); continue; }
    if(r.missing||r.score==null){ rows.push('<tr><td>'+nm+'</td><td class="c">—</td><td class="c">—</td><td class="c">결과 없음</td><td class="c">—</td></tr>'); continue; }
    const th=r.threshold!=null?r.threshold:(r.pass!=null?null:80), pass=r.pass!=null?!!r.pass:(r.score>=(th||80));
    inc.push({score:r.score,pass});
    rows.push('<tr><td>'+nm+'</td><td class="c">'+r.score+' 점</td><td class="c">'+(th!=null?th+' 점':'앱 기준')+'</td><td class="c" style="color:'+(pass?'#087548':'#b13b21')+'">'+(pass?'합격':'불합격')+'</td><td class="c"><button type="button" class="det" data-det="'+k+'">상세 보기</button></td></tr>');
  }
  const avg=inc.length?Math.round(inc.reduce((a,b)=>a+b.score,0)/inc.length):null, ok=inc.length&&inc.every(x=>x.pass);
  $('#resSub').textContent=(FLOW.course==='change'?'체인지파트':'가동')+' · '+(LABEL[FLOW.mode]||'');
  $('#resBig').innerHTML=avg==null?'채점 대상 결과 없음':'<span style="color:'+(ok?'#087548':'#b13b21')+'">'+(ok?'종합 합격':'종합 불합격')+' · '+avg+' 점</span>';
  $('#resRows').innerHTML=rows.join('');
  document.querySelectorAll('#resModal [data-det]').forEach(b=>b.onclick=()=>{ const k=b.dataset.det; $('#resModal').hidden=true; setRoom(k); try{ win(k).UNI_SHOWEND(); }catch(e){ console.error(e); } });
  $('#resModal').hidden=false;
}
$('#resClose').addEventListener('click',()=>{ $('#resModal').hidden=true; });
/* 처음부터 · 메인화면 */
function goHome(){
  stopDemo(true);
  for(const k of ['filler','line']){ try{ crs(k)&&crs(k).home(); }catch(e){ console.error(e); } }
  ROOMBUS.st.link=false; ROOMBUS.reset();
  UNI_HUB.flow.hold=false; resetFlow();
  showCoursePick(); $('#home').hidden=false; updateBar();
}
$('#btnHome').addEventListener('click',()=>{ if(FLOW.on&&!confirm('메인화면으로 돌아갈까요? 진행 내용이 지워집니다.')) return; goHome(); });
$('#btnRestart').addEventListener('click',()=>{
  if(!FLOW.on||FLOW.demo){ toast('진행 중인 과정이 없습니다.'); return; }
  if(!confirm('같은 과정 · 모드로 처음부터 다시 시작할까요?')) return;
  const c=FLOW.course, m=FLOW.mode;
  for(const k of ['filler','line']){ try{ crs(k).home(); }catch(e){} }
  beginCourse(c,m);
});

/* ── 순서 관문 · 안내 (0.25 초마다) ── */
function flowTick(){
  const U=UNI_HUB.ui;
  U.filler.note=null; U.filler.veil=null; U.line.note=null; U.line.veil=null;
  if(!FLOW.on||FLOW.demo) return;
  const f=fInfo(), l=lInfo();
  if(l&&(l.started||l.running)) FLOW.lineStarted=true;
  const prep=fillerPrepDone(f);
  if(!prep&&!FLOW.excl.line){
    U.line.veil={t:FLOW.course==='change'?'순차 과정 — 충전실(D구역) 충전기 교체부품 장착을 먼저 마치세요.':'순차 과정 — 충전실(D구역) 충전기 준비를 먼저 진행하세요 (START 직전 단계까지).',go:'filler'};
  }
  if(FLOW.course==='operation'){
    if(prep&&!FLOW.lineStarted&&!FLOW.excl.line) U.filler.note={t:'충전기 준비 완료 — 포장실(G구역)에서 포장라인을 준비하고 [자동 운전 시작] 하세요.',go:'line'};
    if(FLOW.lineStarted&&f&&!f.running&&!f.everRun&&!FLOW.excl.filler) U.line.note={t:'포장라인 기동 완료 — 충전실(D구역)로 이동해 충전기 [START] 를 누르세요.',go:'filler'};
    /* 자동 준비한 충전기 : 포장라인이 기동하면 함께 START */
    if(FLOW.excl.filler&&FLOW.lineStarted&&!FLOW.fillerAutoStarted&&f&&!f.running){ FLOW.fillerAutoStarted=true; try{ crs('filler').start(); }catch(e){} }
  }
  if(FLOW.excl.filler) U.filler.note={t:'충전기 자동 준비 (채점 제외) — 포장라인 학습 중입니다.',go:'line'};
  if(FLOW.excl.line) U.line.note={t:'포장라인 자동 준비 (채점 제외) — 충전기 학습 중입니다.',go:'filler'};
}
/* ── 상단 바 : 진행 단계 · 버튼 상태 · 생산 지표 ── */
const fmt=n=>Math.round(n).toLocaleString('ko-KR');
function chip(label,val,cls){ return '<span class="chip'+(cls?' '+cls:'')+'">'+label+'<b>'+val+'</b></span>'; }
function phaseIdx(f,l){
  if(FLOW.course==='change') return !fillerPrepDone(f)?0:(l&&l.ended?2:1);
  if(!fillerPrepDone(f)) return 0;
  if(!FLOW.lineStarted) return 1;
  if(f&&f.stopIdx>=0&&f.tIdx>f.stopIdx) return 3;
  return 2;
}
function updateBar(){
  const f=fInfo(), l=lInfo();
  let ph='';
  if(FLOW.on&&!FLOW.demo){
    const names=FLOW.course==='change'?['① 충전기 교체부품','② 포장라인 교체부품','③ 완료']:['① 충전기 준비','② 포장라인 준비 · 기동','③ 연동 가동','④ 정지 · 회수'];
    const i=phaseIdx(f,l);
    ph='<span style="background:#142b47;color:#fff">'+(FLOW.course==='change'?'체인지파트':'가동')+' · '+(LABEL[FLOW.mode]||'')+'</span>'+
      names.map((n,k)=>'<span class="'+(k<i?'done':k===i?'on':'')+'">'+n+'</span>').join('<i>▶</i>');
  } else if(FLOW.demo) ph='<span class="on">연동 가동 시연 — 두 설비 자동 준비 · 연동 운전</span>';
  $('#phase').innerHTML=ph;
  $('#optF').classList.toggle('on',FLOW.excl.filler); $('#optL').classList.toggle('on',FLOW.excl.line);
  $('#optF').disabled=$('#optL').disabled=!FLOW.on||FLOW.demo;
  const examWait=FLOW.on&&!FLOW.demo&&isExamMode()&&f&&!f.active&&!f.ended&&!FLOW.excl.filler||(FLOW.on&&!FLOW.demo&&isExamMode()&&FLOW.excl.filler&&l&&!l.active&&!l.ended);
  $('#btnExam').hidden=!examWait;
  $('#btnEnd').textContent=FLOW.demo?'시연 정지':(isExamMode()?'평가 종료':'학습 종료');
  /* 생산 지표 */
  const s=ROOMBUS.st, la=api('line'), fa=api('filler');
  let h=chip('연동',s.link?'ON':'OFF',s.link?'on':'');
  h+=chip('충전',(s.fillerRun?fmt(s.ppm):0)+' 팩/분');
  h+=chip('연결 컨베이어',ROOMBUS.count()+' / '+ROOMBUS.CAP);
  h+=chip('스태커',s.tower+' / '+ROOMBUS.TCAP);
  h+=chip('카톤당',(la?la.packs():s.N)+' 팩');
  h+=chip('카토너',fmt(la?la.cpm():0)+' CPM');
  if(s.link) h+=chip('빈 버킷',fmt(s.empty),s.empty?'warn':'');
  if(s.link&&s.wait) h+=chip('충전기','후공정 대기','warn');
  if(fa&&la) h+=chip('정품',fmt(fa.good())+' 팩 → '+fmt(la.cartons())+' 카톤');
  h+=chip('그래픽',UNI_HUB.simple()?'선택 장비 중심 (옆방 간략)':'전체 상세');
  $('#bar2').innerHTML=h;
}

/* ── 메인 루프 : 연결 컨베이어를 시뮬 시간으로 진행 ── */
let last=0, infoT=0;
function loop(t){
  const dt=last?Math.min(0.1,(t-last)/1000):0; last=t;
  syncSpd();
  const fa=api('filler'), la=api('line'), s=ROOMBUS.st;
  s.fillerRun=!!(fa&&fa.running()); s.lineRun=!!(la&&la.running());
  if(la) s.N=la.packs();
  if(!(ROOMBUS.lastStep&&performance.now()-ROOMBUS.lastStep<300)) ROOMBUS.step(dt*Math.max(1,SPDSYNC||1));
  infoT+=dt; if(infoT>0.25){ infoT=0; flowTick(); updateBar(); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ── 연동 가동 시연 : 두 설비를 가동 준비 완료 상태로 함께 기동 (채점 없음) ── */
async function startDemo(){
  if(demoBusy) return; demoBusy=true; toast('연동 가동 준비 중 — 충전기 · 포장라인 기동 조건을 맞추고 있습니다',4000);
  try{
    await loaded('filler'); await loaded('line');
    resetFlow(); UNI_HUB.flow.hold=false;
    $('#home').hidden=true; setRoom('filler');
    ROOMBUS.st.link=false; ROOMBUS.reset();
    ROOMBUS.st.setup=true;
    const rl=await api('line').demo(), rf=await api('filler').demo();
    ROOMBUS.st.setup=false;
    if(!rf.ok||!rl.ok){ toast('연동 가동 실패 — '+(!rf.ok?'충전기 : '+rf.msg:'포장라인 : '+rl.msg),6000); return; }
    ROOMBUS.reset(); api('line').resetBuckets();
    ROOMBUS.st.link=true; FLOW.on=true; FLOW.demo=true;
    SPDSYNC=1; api('filler').setSpd(1); api('line').setSpd(1);
    toast('연동 가동 — 충전기 PTP 가 연결 컨베이어를 거쳐 카토너 스태커로 공급됩니다',4200);
  }catch(e){ console.error(e); toast('연동 가동 중 오류 : '+e.message,6000); }
  finally{ demoBusy=false; ROOMBUS.st.setup=false; updateBar(); }
}
function stopDemo(silent){
  if(!FLOW.demo) return;
  ROOMBUS.st.link=false; ROOMBUS.st.wait=false; FLOW.demo=false; FLOW.on=false;
  try{ api('filler')&&api('filler').stop(); api('line')&&api('line').stop(); }catch(e){}
  if(!silent) toast('연동 정지 — 두 설비를 정위치 정지했습니다');
  updateBar();
}
$('#hDemo').addEventListener('click',startDemo);

/* ── 메인화면 : 과정 → 모드 ── */
let pickCourse=null;
function showCoursePick(){ pickCourse=null; $('#hCourse').hidden=false; $('#hMode').hidden=true; }
document.querySelectorAll('#hCourse [data-course]').forEach(b=>b.addEventListener('click',()=>{
  pickCourse=b.dataset.course; $('#hCourse').hidden=true; $('#hMode').hidden=false;
}));
$('#hBack').addEventListener('click',showCoursePick);
document.querySelectorAll('#hMode [data-mode]').forEach(b=>b.addEventListener('click',()=>beginCourse(pickCourse||'operation',b.dataset.mode)));

/* ── 버전 이력 ── */
const verModal=$('#verModal');
for(const id of ['#verBadge','#verBadge2']){ $(id).textContent='V'+CHANGELOG[0].v; $(id).addEventListener('click',()=>{ verModal.hidden=false; $('#verClose').focus(); }); }
$('#verCur').textContent='현재 V'+CHANGELOG[0].v;
$('#verRows').innerHTML=CHANGELOG.map(r=>'<tr><td>V'+r.v+'</td><td>'+r.d+'</td><td>'+r.t+'</td></tr>').join('');
$('#verClose').addEventListener('click',()=>{ verModal.hidden=true; });
verModal.addEventListener('click',e=>{ if(e.target===verModal) verModal.hidden=true; });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ verModal.hidden=true; } });
window.ROOMSHELL={setRoom,startDemo,stopDemo,beginCourse,goHome,FLOW,get active(){return active;}};
updateBar();
