/* ═══════════════════════════════════════════════════════════════════
   셸 — 상단 바 · 방 전환 · 연동 루프 · 연동 가동 · 버전 이력
   · 두 방은 각각의 iframe(기존 충전기 / 포장라인 IDT) 이며 항상 함께 살아 있다.
     보이지 않는 방은 3D 그리기만 생략하고 시뮬레이션은 계속 돈다(ROOM_ACTIVE=false).
   ═══════════════════════════════════════════════════════════════════ */
const APPS=JSON.parse(document.getElementById('apps').textContent);
const $=s=>document.querySelector(s);
const FR={};
let active='filler', SPDSYNC=1, demoBusy=false;
const NAMES={filler:'충전실 · D구역',line:'포장실 · G구역'};
function decode(b){ return new TextDecoder().decode(Uint8Array.from(atob(b),c=>c.charCodeAt(0))); }
function win(k){ try{ return FR[k]&&FR[k].contentWindow; }catch(e){ return null; } }
function api(k){ const w=win(k); return w&&w.ROOM_API||null; }
function toast(t,ms){ const e=$('#toast'); e.textContent=t; e.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(()=>e.classList.remove('on'),ms||2600); }

/* ── 두 방 iframe ── */
for(const k of ['filler','line']){
  const f=document.createElement('iframe');
  f.title=k==='filler'?'충전실 (D구역) · PTP 충전기 IDT':'포장실 (G구역) · PTP 포장라인 IDT';
  f.dataset.room=k;
  if(k!==active) f.classList.add('off','toR');
  f.srcdoc=decode(APPS[k]);
  $('#stage').appendChild(f); FR[k]=f;
  f.addEventListener('load',()=>{ const w=win(k); if(w) w.ROOM_ACTIVE=(k===active); });
}
const loaded=k=>new Promise((res,rej)=>{ const t0=performance.now(); const t=()=>api(k)?res():(performance.now()-t0>20000?rej(Error((k==='filler'?'충전실':'포장실')+' 화면 로딩 지연')):setTimeout(t,60)); t(); });

/* ── 방 전환 : 지금 방은 벽 쪽으로 밀려나고 옆방이 벽 쪽에서 들어온다 ── */
function setRoom(k){
  if(k===active||!FR[k]) return;
  const from=active; active=k;
  $$rooms().forEach(b=>b.classList.toggle('on',b.dataset.room===k));
  const fin=FR[k], fout=FR[from];
  const wi=win(k), wo=win(from);
  if(wi) wi.ROOM_ACTIVE=true;
  try{ api(k)&&api(k).enter(from); }catch(e){ console.error(e); }
  /* 들어오는 방 : 벽 쪽(포장실=오른쪽, 충전실=왼쪽)에서 */
  fin.classList.remove('toL','toR'); fin.classList.add(k==='line'?'toR':'toL');
  void fin.offsetWidth;
  fin.classList.remove('off','toL','toR');
  fout.classList.add('off',k==='line'?'toL':'toR');
  setTimeout(()=>{ if(active!==from&&wo) wo.ROOM_ACTIVE=false; },600);
  fin.focus();
}
function $$rooms(){ return document.querySelectorAll('#rooms button'); }
$$rooms().forEach(b=>b.addEventListener('click',()=>setRoom(b.dataset.room)));

/* ── 배속 동기화 (연동 중에만 : 단독 교육과정은 방마다 독립) ── */
function syncSpd(){
  const fa=api('filler'), la=api('line'); if(!fa||!la) return;
  const sf=fa.getSpd(), sl=la.getSpd();
  if(!ROOMBUS.st.link){ SPDSYNC=active==='filler'?sf:sl; return; }
  if(sf!==SPDSYNC){ SPDSYNC=sf; la.setSpd(sf); }
  else if(sl!==SPDSYNC){ SPDSYNC=sl; fa.setSpd(sl); }
}

/* ── 상단 지표 ── */
const fmt=n=>Math.round(n).toLocaleString('ko-KR');
function chip(label,val,cls){ return '<span class="chip'+(cls?' '+cls:'')+'">'+label+'<b>'+val+'</b></span>'; }
function renderInfo(){
  const s=ROOMBUS.st, la=api('line'), fa=api('filler');
  const cpm=la?la.cpm():0;
  let h=chip('연동',s.link?'ON':'OFF',s.link?'on':'');
  h+=chip('충전',(s.fillerRun?fmt(s.ppm):0)+' 팩/분');
  h+=chip('연결 컨베이어',ROOMBUS.count()+' / '+ROOMBUS.CAP);
  if(s.link) h+=chip('스태커',s.tower+' / '+ROOMBUS.TCAP);
  h+=chip('카톤당',(la?la.packs():s.N)+' 팩');
  h+=chip('카토너',fmt(cpm)+' CPM');
  if(s.link) h+=chip('빈 버킷',fmt(s.empty),s.empty?'warn':'');
  if(s.link&&s.wait) h+=chip('충전기','후공정 대기','warn');
  if(fa&&la) h+=chip('정품',fmt(fa.good())+' 팩 → '+fmt(la.cartons())+' 카톤');
  $('#info').innerHTML=h;
}

/* ── 메인 루프 : 연결 컨베이어를 시뮬 시간으로 진행 ── */
let last=0, infoT=0;
function loop(t){
  const dt=last?Math.min(0.1,(t-last)/1000):0; last=t;
  syncSpd();
  const fa=api('filler'), la=api('line'), s=ROOMBUS.st;
  s.fillerRun=!!(fa&&fa.running()); s.lineRun=!!(la&&la.running());
  if(la) s.N=la.packs();
  /* 포장라인 시뮬레이션이 돌고 있으면 그쪽 시계로 진행되고, 멈춰 있으면(시작 화면 등) 셸이 대신 진행 */
  if(!(ROOMBUS.lastStep&&performance.now()-ROOMBUS.lastStep<300)) ROOMBUS.step(dt*Math.max(1,SPDSYNC||1));
  infoT+=dt; if(infoT>0.25){ infoT=0; renderInfo(); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ── 연동 가동 : 두 설비를 가동 준비 완료 상태로 함께 기동 ── */
const demoBtn=$('#demoBtn');
async function startDemo(){
  if(demoBusy) return; demoBusy=true; demoBtn.disabled=true; toast('연동 가동 준비 중 — 충전기 · 포장라인 기동 조건을 맞추고 있습니다',4000);
  try{
    await loaded('filler'); await loaded('line');
    ROOMBUS.st.link=false; ROOMBUS.reset();
    ROOMBUS.st.setup=true;
    const rf=await api('filler').demo(), rl=await api('line').demo();
    ROOMBUS.st.setup=false;
    if(!rf.ok||!rl.ok){ toast('연동 가동 실패 — '+(!rf.ok?'충전기 : '+rf.msg:'포장라인 : '+rl.msg),6000); return; }
    ROOMBUS.reset(); api('line').resetBuckets();
    ROOMBUS.st.link=true;
    SPDSYNC=1; api('filler').setSpd(1); api('line').setSpd(1);
    demoBtn.textContent='■ 연동 정지'; demoBtn.classList.add('stop');
    toast('연동 가동 — 충전기 PTP 가 연결 컨베이어를 거쳐 카토너 스태커로 공급됩니다',4200);
  }catch(e){ console.error(e); toast('연동 가동 중 오류 : '+e.message,6000); }
  finally{ demoBusy=false; demoBtn.disabled=false; ROOMBUS.st.setup=false; }
}
function stopDemo(msg){
  ROOMBUS.st.link=false; ROOMBUS.st.wait=false;
  demoBtn.textContent='▶ 연동 가동'; demoBtn.classList.remove('stop');
  try{ api('filler')&&api('filler').stop(); api('line')&&api('line').stop(); }catch(e){}
  toast(msg||'연동 정지 — 두 설비를 정위치 정지했습니다');
}
demoBtn.addEventListener('click',()=>ROOMBUS.st.link?stopDemo():startDemo());
/* 방에서 교육과정을 새로 시작하면 연동을 풀고 단독(가상 공급)으로 진행 */
ROOMBUS.onCourse=function(k){
  if(ROOMBUS.st.setup||!ROOMBUS.st.link) return;
  ROOMBUS.st.link=false; ROOMBUS.st.wait=false;
  demoBtn.textContent='▶ 연동 가동'; demoBtn.classList.remove('stop');
  toast((k==='filler'?'충전실':'포장실')+' 교육과정 시작 — 연동을 해제하고 단독(가상 공급)으로 진행합니다',4200);
};

/* ── 버전 이력 ── */
const verModal=$('#verModal');
$('#verBadge').textContent='V'+CHANGELOG[0].v;
$('#verCur').textContent='현재 V'+CHANGELOG[0].v;
$('#verRows').innerHTML=CHANGELOG.map(r=>'<tr><td>V'+r.v+'</td><td>'+r.d+'</td><td>'+r.t+'</td></tr>').join('');
$('#verBadge').addEventListener('click',()=>{ verModal.hidden=false; $('#verClose').focus(); });
$('#verClose').addEventListener('click',()=>{ verModal.hidden=true; });
verModal.addEventListener('click',e=>{ if(e.target===verModal) verModal.hidden=true; });
document.addEventListener('keydown',e=>{ if(e.key==='Escape') verModal.hidden=true; });
window.ROOMSHELL={setRoom,startDemo,stopDemo,get active(){return active;}};
