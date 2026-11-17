/* ═══════════════════════════════════════════════════════════════════
   셸 — PTP 두 앱(충전기 · 포장라인)을 iframe 으로 띄워 두고(과정 · HMI · 시뮬레이션 · 형상 생성), 3D 는 셸의 Three.js 가 그림
   · 메인화면 (파우치와 같음) : ① 모드 → ② 작업자(충전실 · 포장실) → 그 작업자 1인칭으로 시작 · 그 실 앱의 과정 단계 적용
   · 교육 중 : 보이는 앱의 조작 화면(타일 · 안내 · 설비 화면 · 판넬)은 그대로, 3D 영역(#mimic3d 자리)만 셸 화면으로 덮음
   · 작업자 교체 : 상단 [충전실 작업자 · 포장실 작업자] — 실마다 앱이 따로라 진행 상태가 그대로 이어짐 (처음 가는 실은 같은 모드로 시작)
   ═══════════════════════════════════════════════════════════════════ */
const $=s=>document.querySelector(s);
const APPS=JSON.parse(document.getElementById("apps-data").textContent);
const decode=b=>new TextDecoder().decode(Uint8Array.from(atob(b),c=>c.charCodeAt(0)));
const ROOM_NM={F:"충전실 작업자",P:"포장실 작업자"}, APPK={F:"filler",P:"line"};
UNI_HUB.active="three";                                    /* 두 앱 모두 자기 캔버스에 그리지 않음 — 형상만 만듦 */
const FR={};
for(const k of ["filler","line"]){ const f=document.createElement("iframe"); f.dataset.room=k; f.title=k==="filler"?"PTP 충전기 조작 화면":"PTP 포장라인 조작 화면"; f.srcdoc=decode(APPS[k]); f.classList.add("off"); $("#apps").appendChild(f); FR[k]=f; }
function appsReady(){ const f=UNI_HUB.win("filler"), l=UNI_HUB.win("line"); return !!(f&&l&&f.UNI_GEN&&l.UNI_GEN&&f.UNI_ROOM&&f.UNI_DYN&&f.UNI_COURSE&&l.UNI_COURSE); }
const crs=k=>{ const w=UNI_HUB.win(k); return w&&w.UNI_COURSE; };

/* ── 메인화면 : 모드 → 작업자 ── */
const CREW={mode:null, room:null, cur:null, started:{F:false,P:false}, pose:{}, fp:true};
function crewMark(){
  document.querySelectorAll("#modes button[data-m]").forEach(b=>b.classList.toggle("sel",!!CREW.mode&&b.dataset.c===CREW.mode.c&&b.dataset.m===CREW.mode.m));
  for(const r of ["F","P"]){ const b=$("#choose"+r); b.classList.toggle("sel",CREW.room===r); b.classList.toggle("wait",!CREW.mode); }
  $("#crewHint").innerHTML=CREW.mode?'<b>② 작업자 선택</b> — 위의 충전실 · 포장실 작업자를 누르면 그 작업장 1인칭으로 시작합니다 <s>모드 : '+CREW.mode.nm+'</s>'
    :'<b>① 모드 선택</b> — 아래에서 모드를 고른 뒤 <b>② 작업자</b>를 누르면 그 작업장 작업자 1인칭으로 시작합니다';
}
function pickMode(b){ CREW.mode={c:b.dataset.c, m:b.dataset.m, nm:b.closest(".mcol").querySelector("h4").textContent+" · "+b.firstChild.textContent.trim()}; crewMark(); if(CREW.room) crewGo(); }
function pickRoom(r){ CREW.room=r; crewMark(); if(CREW.mode) crewGo(); }
function crewGo(){ if(CREW.mode&&CREW.mode.c==="inc"){ inc3Pick(CREW.room); return; } CREW.started={F:false,P:false}; CREW.pose={}; CREW.fp=true; $("#splash").classList.add("hide"); startRoom(CREW.room); }
function startRoom(r){
  const k=APPK[r], c=crs(k), M=CREW.mode;
  if(M.m==="demo"||M.m==="free"){ MODE3.kind=M.m; DSTEP[r]=0; mode3Start(r); CREW.started[r]=true; show(r); return; }
  MODE3.kind=null;
  try{ if(k==="filler"){ c.begin(M.c,M.m); setTimeout(()=>{ try{ c.quickStart(); }catch(e){ console.error(e); } },150); } else c.begin(M.c,M.m,"A"); }catch(e){ console.error("과정 시작",e); }
  CREW.started[r]=true; show(r);
}
function show(r){
  if(CREW.cur&&V3P.view!=="orbit") CREW.pose[CREW.cur]={x:WALK.x,z:WALK.z,yaw:WALK.yaw,pitch:WALK.pitch};
  CREW.cur=r; for(const [rr,k] of [["F","filler"],["P","line"]]) FR[k].classList.toggle("off",rr!==r);
  $("#apps").classList.add("live"); $("#modeChip").textContent=CREW.mode?CREW.mode.nm:"";
  if(CREW.fp){ setView(r); const q=CREW.pose[r]; if(q) Object.assign(WALK,q); } else setView("orbit");
  crewHead();
}
function crewSwitch(r){ if(!CREW.cur||r===CREW.cur) return; if(!CREW.started[r]) startRoom(r); else show(r); }
function crewHead(){
  document.querySelectorAll("#crewSw button").forEach(b=>{ b.classList.toggle("on",b.dataset.r===CREW.cur); b.disabled=!CREW.cur; });
  $("#fpBtn").textContent=V3P.view!=="orbit"?"🧍 1인칭 → 3인칭 전환":"🎥 3인칭 → 1인칭 전환"; $("#fpBtn").disabled=!CREW.cur;
}
function goHome(){
  for(const k of ["filler","line"]){ try{ crs(k).home(); }catch(e){} FR[k].classList.add("off"); try{ const w=UNI_HUB.win(k); w.document.body.classList.remove("mode3"); if(w.__sc0){ w.startChecks=w.__sc0; w.deduct=w.__dd0; w.alarm=w.__al0; } if(w.__door0){ w.document.getElementById("uDoor").onclick=w.__door0; w.__door0=null; } w.FREE3=false; }catch(e){} }   /* 자유모드 인터락 해제 원복 */
  MODE3.kind=null; INC3.k=null; $("#incPick").hidden=true; $("#modes").hidden=false;
  CREW.cur=null; CREW.mode=null; CREW.room=null; $("#apps").classList.remove("live"); $("#splash").classList.remove("hide"); $("#modeChip").textContent="";
  if(document.pointerLockElement) document.exitPointerLock(); crewMark(); crewHead();
}

/* ── 시점 ── */
function setView(v){
  V3P.view=v==="orbit"?"orbit":"walk";
  if(v!=="orbit") walkSpawn(v); else if(document.pointerLockElement) document.exitPointerLock();
  $("#cross").style.display=v==="orbit"?"none":"block"; hud(); crewHead();
}
function hud(){
  $("#hud").innerHTML=V3P.view==="orbit"
    ?"<b>3인칭</b> · 왼쪽 끌기 = 회전 · 오른쪽(Shift) 끌기 = 이동 · 휠 = 확대"
    :"<b>1인칭 · "+ROOM_NM[WALK.room]+"</b> · W A S D 걷기 · Shift 빠르게 · 3D 화면 클릭 후 마우스로 둘러보기 (Esc 풀기)";
}
/* 셸 3D 화면을 보이는 앱의 3D 영역(#mimic3d 자리) 위에 맞춤 */
function placeCanvas(){
  const cv=$("#cv"), st=$("#stage").getBoundingClientRect(); let r={left:0,top:0,width:st.width,height:st.height};
  if(CREW.cur){ try{ const d=UNI_HUB.win(APPK[CREW.cur]).document, w3=d.getElementById("mimic3dWrap"), el=w3&&w3.offsetParent?w3:d.getElementById("mimic"); if(el){ const q=el.getBoundingClientRect(); if(q.width>40) r=q; } }catch(e){} }
  const k=[r.left,r.top,r.width,r.height].map(v=>Math.round(v)).join(",");
  if(k!==placeCanvas.k){ placeCanvas.k=k; Object.assign(cv.style,{left:r.left+"px",top:r.top+"px",width:r.width+"px",height:r.height+"px"});
    Object.assign($("#cross").style,{left:(r.left+r.width/2)+"px",top:(r.top+r.height/2)+"px"}); Object.assign($("#hud").style,{left:(r.left+10)+"px",top:(r.top+r.height-44)+"px",bottom:"auto"});
    Object.assign($("#fpTip").style,{left:(r.left+r.width/2)+"px",top:(r.top+r.height/2+40)+"px"}); }
}
/* 앱 화면에 초점이 있어도 걷기 키가 셸로 오게 (입력칸 제외) */
function forwardKeys(){
  for(const k of ["filler","line"]){ const w=UNI_HUB.win(k); if(!w) continue;
    w.addEventListener("keydown",e=>{ if(e.target&&e.target.closest&&e.target.closest("input,textarea,select")) return; WALK.keys[e.code]=true; });
    w.addEventListener("keyup",e=>{ WALK.keys[e.code]=false; }); w.addEventListener("blur",()=>{ WALK.keys={}; }); }
}
let last=0;
function loop(now){
  requestAnimationFrame(loop);
  const dt=Math.min(.1,last?(now-last)/1000:0); last=now;
  placeCanvas(); walkTick(dt); crew3Tick(dt); fp3Tick(now); v3Frame(now);
  if(now-(loop.m||0)>300){ loop.m=now; inc3Tick(); mode3Coach(); }
  if(now-(loop.i||0)>500){ loop.i=now; $("#info").textContent=Math.round(V3P.t.fps)+" fps"; }
}
function boot(){
  if(!appsReady()){ setTimeout(boot,100); return; }
  v3Init(); v3Orbit(); walkBind(); crew3Init(); forwardKeys(); fp3Init(); try{ oee3Init(); }catch(e){ console.error("OEE",e); }
  v3Gen(true); v3Gen(true); gridBuild(); try{ v3EnvCapture(); }catch(e){ console.error("반사 환경",e); }
  document.querySelectorAll("#modes button[data-m]").forEach(b=>b.onclick=()=>pickMode(b));
  $("#chooseF").onclick=()=>pickRoom("F"); $("#chooseP").onclick=()=>pickRoom("P");
  document.querySelectorAll("#crewSw button").forEach(b=>b.onclick=()=>crewSwitch(b.dataset.r));
  $("#fpBtn").onclick=()=>{ if(!CREW.cur) return; CREW.fp=V3P.view==="orbit"; if(CREW.fp){ setView(CREW.cur); const q=CREW.pose[CREW.cur]; if(q) Object.assign(WALK,q); } else { CREW.pose[CREW.cur]={x:WALK.x,z:WALK.z,yaw:WALK.yaw,pitch:WALK.pitch}; setView("orbit"); } };
  $("#homeBtn").onclick=goHome;
  $("#load").style.display="none"; setView("F"); crewMark(); crewHead(); requestAnimationFrame(loop);
}
boot();
