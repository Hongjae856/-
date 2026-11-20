/* 화면 버전 표시 = 버전 이력 맨 위 항목 */
const verTxt=()=>{ try{ return "V"+CHANGELOG[0].v+" · "+CHANGELOG[0].d; }catch(e){ return ""; } };
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
function crewMark(){ idtSplashMark({mode:CREW.mode, modeNm:CREW.mode&&CREW.mode.nm, room:CREW.room, isSel:b=>!!CREW.mode&&b.dataset.c===CREW.mode.c&&b.dataset.m===CREW.mode.m}); }
function pickMode(b){ CREW.mode={c:b.dataset.c, m:b.dataset.m, nm:b.dataset.nm||b.textContent.trim()}; crewMark(); if(CREW.room){ LAST3={m:CREW.mode.m,c:CREW.mode.c,r:CREW.room}; crewGo(); } }
function pickRoom(r){ CREW.room=r; crewMark(); if(CREW.mode){ LAST3={m:CREW.mode.m,c:CREW.mode.c,r}; crewGo(); } }
function crewGo(){ if(CREW.mode&&CREW.mode.c==="inc"){ inc3Pick(CREW.room); return; } CREW.started={F:false,P:false}; CREW.pose={}; CREW.fp=true; $("#splash").classList.add("hide"); startRoom(CREW.room); }
function startRoom(r){
  const k=APPK[r], c=crs(k), M=CREW.mode;
  if(M.m==="demo"||M.m==="free"){ MODE3.kind=M.m; DSTEP[r]=0; DRES[r]=false; mode3Start(r); CREW.started[r]=true; show(r); return; }
  MODE3.kind=null;
  try{ if(k==="filler"){ c.begin(M.c,M.m); setTimeout(()=>{ try{ c.quickStart(); }catch(e){ console.error(e); } },150); } else c.begin(M.c,M.m,"A"); }catch(e){ console.error("과정 시작",e); }
  CREW.started[r]=true; show(r);
}
function show(r){
  if(CREW.cur&&V3P.view!=="orbit") CREW.pose[CREW.cur]={x:WALK.x,z:WALK.z,yaw:WALK.yaw,pitch:WALK.pitch};
  CREW.cur=r; for(const [rr,k] of [["F","filler"],["P","line"]]) FR[k].classList.toggle("off",rr!==r);
  $("#apps").classList.add("live"); $("#modeChip").textContent=CREW.mode?CREW.mode.nm:verTxt();
  if(CREW.fp){ setView(r); const q=CREW.pose[r]; if(q) Object.assign(WALK,q); } else setView("orbit");
  crewHead();
}
function crewSwitch(r){ if(!CREW.cur||r===CREW.cur) return; if(!CREW.started[r]) startRoom(r); else show(r); }
function crewHead(){
  document.querySelectorAll("#crewSw button").forEach(b=>{ b.classList.toggle("on",b.dataset.r===CREW.cur); b.disabled=!CREW.cur; });
  $("#fpBtn").textContent=V3P.view!=="orbit"?"🧍 1인칭 → 3인칭 전환":"🎥 3인칭 → 1인칭 전환"; $("#fpBtn").disabled=!CREW.cur;
}
function goHome(){
  idtResClose([document].concat(["filler","line"].map(k=>{ try{ return UNI_HUB.win(k).document; }catch(e){ return null; } })));   /* 결과 창 닫기 */
  for(const k of ["filler","line"]){ try{ crs(k).home(); }catch(e){} FR[k].classList.add("off"); try{ const w=UNI_HUB.win(k); w.document.body.classList.remove("mode3"); if(w.__sc0){ w.startChecks=w.__sc0; w.deduct=w.__dd0; w.alarm=w.__al0; } if(w.__door0){ w.document.getElementById("uDoor").onclick=w.__door0; w.__door0=null; } w.FREE3=false; }catch(e){} }   /* 자유모드 인터락 해제 원복 */
  MODE3.kind=null; INC3.k=null; $("#incPick").style.display="none"; $("#splash .go").style.display="grid";
  CREW.cur=null; CREW.mode=null; CREW.room=null; $("#apps").classList.remove("live"); $("#splash").classList.remove("hide"); $("#modeChip").textContent=verTxt();
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
  /* 앱 대화창(숫자 키패드 · 선택 · 결과 등 .modal.on)이 열리면 3D 화면을 내림 — 키패드가 3D 화면 뒤에 가려지던 문제 (P6) */
  let mo=false; if(CREW.cur){ try{ mo=!!UNI_HUB.win(APPK[CREW.cur]).document.querySelector(".modal.on"); }catch(e){} }
  if(mo!==document.body.classList.contains("appModal")){ document.body.classList.toggle("appModal",mo); if(mo&&document.pointerLockElement) document.exitPointerLock(); }
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
  placeCanvas(); tbTick(dt); walkTick(dt); crew3Tick(dt); fp3Tick(now); v3Frame(now);
  if(now-(loop.m||0)>300){ loop.m=now; inc3Tick(); mode3Coach(); }
  if(now-(loop.i||0)>500){ loop.i=now; $("#info").textContent=Math.round(V3P.t.fps)+" fps"; }
}
/* F1 힌트 (세 IDT 공통) : 평가 = 원본 앱 힌트 버튼(−5 점 · 15 초 표시) / 학습 = 다음 작업 / 자유 = 없음 */
function ptpHint(){
  if(!CREW.cur) return; if(MODE3.kind==="free"){ fpcToast("자유모드 — 순서 · 힌트 없음"); return; }
  if(MODE3.kind==="inc"){ if(!INC3.fired||INC3.done){ fpcToast("이상 상황이 아직 없습니다"); return; }
    if(INC3.mode==="exam"){ if(performance.now()<INC3.hintUntil){ fpcToast("힌트 표시 중"); return; } INC3.hint++; INC3.hintUntil=performance.now()+15000; fpcToast("힌트 사용 −5 점 — 15 초 동안 다음 작업 표시"); return; }
    fpcToast(FP3.goal?"다음 작업 : "+FP3.goal.nm:"알람 안내에 따라 조치하세요"); return; }
  const w=UNI_HUB.win(APPK[CREW.cur]); let ex=false; try{ ex=!!w.eval("isExam()"); }catch(e){}
  if(ex){ const b=w.document.getElementById("examHint"); let act=false; try{ act=!!w.eval("S.session&&S.session.active"); }catch(e){}
    if(!act){ fpcToast("평가가 시작된 뒤 힌트를 쓸 수 있습니다"); return; }
    if(b&&!b.disabled&&b.style.display!=="none"){ b.click(); fpcToast("힌트 사용 −5 점 — 다음 작업 표시"); } else fpcToast("힌트 표시 중"); return; }
  const c=$("#shCoach .t b"); fpcToast(FP3.goal?"다음 작업 : "+FP3.goal.nm:(c?c.textContent:"안내 없음")); }
/* 배속 : 두 앱의 SPD (원본 ×1 ×2 ×5 + 파우치처럼 ×10) */
function tbPtpSpd(v){ for(const k of ["filler","line"]){ const w=UNI_HUB.win(k); if(!w) continue; try{ if(w.eval("SPD")!==v&&!(w.eval("typeof AP!=='undefined'&&AP.on"))) w.eval("SPD="+v); }catch(e){} } }
let LAST3=null;
function ptp3ModeNm(){ return CREW.mode?CREW.mode.nm:""; }   /* 결과 창 부제 (앱 appres.js) */
/* 처음부터 · 결과 창 [다시 하기] : 같은 모드 · 같은 작업자로 다시 시작 */
function ptp3Restart(){ const L=LAST3; goHome(); if(!L) return; setTimeout(()=>{ const b=document.querySelector('#splash .go button[data-m="'+L.m+'"][data-c="'+L.c+'"]'); if(b) b.click(); const r=document.getElementById("choose"+L.r); if(r) r.click(); },300); }
function boot(){ $("#modeChip").textContent=verTxt();
  if(!appsReady()){ setTimeout(boot,100); return; }
  v3Init(); v3Orbit(); walkBind(); crew3Init(); forwardKeys(); fp3Init(); fpcInit({isFP:()=>V3P.view!=="orbit"&&!FP3.hmi, hint:ptpHint, third:()=>$("#fpBtn").click(), home:()=>goHome()});
  tbViews({orbit:()=>V3P.orbit, isOrbit:()=>V3P.view==="orbit"&&$("#splash").classList.contains("hide"), rect:()=>{ const c=document.getElementById("cv").getBoundingClientRect(), s=document.getElementById("stage").getBoundingClientRect(), k=document.getElementById("shCoach"), kr=k&&!k.hidden?k.getBoundingClientRect():null;   /* 안내판과 겹치지 않게 그 아래 */
      return {left:c.left-s.left,top:Math.max(c.top,kr&&kr.bottom>c.top&&kr.top<c.top+80?kr.bottom-4:c.top)-s.top,width:c.width}; },
    presets:[["전체",{yaw:-.42,pitch:.42,dist:12500,tx:2600,ty:700,tz:200}],["충전실",{yaw:-.4,pitch:.36,dist:7000,tx:-4600,ty:900,tz:0}],["포장실",{yaw:-.4,pitch:.38,dist:9000,tx:8000,ty:800,tz:300}],
      ["전면",{yaw:0,pitch:.12,dist:12500,tx:2600,ty:1000,tz:0}],["평면",{yaw:0,pitch:1.45,dist:17000,tx:2600,ty:0,tz:500}]]});
  /* 상단 바 (파우치 기준 · idt_common/topbar.js) */
  tbInit({wins:()=>["filler","line"].map(k=>UNI_HUB.win(k)).filter(Boolean), cur:()=>CREW.cur?UNI_HUB.win(APPK[CREW.cur]):null, ids:{snd:"sndBtn",end:"testEnd"},
    speed:s=>tbPtpSpd(s), sync:()=>tbPtpSpd(TBQ.spd), R:()=>V3P.R, scene:()=>V3P.sc, lights:()=>V3P.key?[V3P.key]:[],
    end:()=>{ if(!CREW.cur){ return true; } if(MODE3.kind==="free"||MODE3.kind==="demo"||MODE3.kind==="inc"){ goHome(); return true; } return false; },
    restart:ptp3Restart}); try{ oee3Init(); }catch(e){ console.error("OEE",e); }
  v3Gen(true); v3Gen(true); gridBuild(); try{ v3EnvCapture(); }catch(e){ console.error("반사 환경",e); }
  document.querySelectorAll("#splash .go button[data-m]").forEach(b=>b.onclick=()=>pickMode(b));
  $("#chooseF").onclick=()=>pickRoom("F"); $("#chooseP").onclick=()=>pickRoom("P");
  document.querySelectorAll("#crewSw button").forEach(b=>b.onclick=()=>crewSwitch(b.dataset.r));
  $("#fpBtn").onclick=()=>{ if(!CREW.cur) return; CREW.fp=V3P.view==="orbit"; if(CREW.fp){ setView(CREW.cur); const q=CREW.pose[CREW.cur]; if(q) Object.assign(WALK,q); } else { CREW.pose[CREW.cur]={x:WALK.x,z:WALK.z,yaw:WALK.yaw,pitch:WALK.pitch}; setView("orbit"); } };
  $("#homeBtn").onclick=goHome;
  $("#load").style.display="none"; setView("F"); crewMark(); crewHead(); requestAnimationFrame(loop);
}
boot();
