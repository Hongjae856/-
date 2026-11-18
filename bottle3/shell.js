/* ═══════════════════════════════════════════════════════════════════
   셸 (B1) — 병 충전 앱(iframe · 조작 화면 그대로)의 3D 보기 자리에 파우치 엔진 화면을 겹침
   · 3인칭 전체 보기(기본) ↔ 1인칭(작업자 눈높이) 전환 — B4 에서 파우치처럼 1인칭 기본 · 작업자 선택으로 바꿈
   ═══════════════════════════════════════════════════════════════════ */
const $=s=>document.querySelector(s);
const APP_FR=$("#app");
const appWin=()=>{ try{ return APP_FR.contentWindow; }catch(e){ return null; } };
{ const b=atob(JSON.parse($("#app-data").textContent)), u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); APP_FR.srcdoc=new TextDecoder().decode(u); }
const verTxt=()=>{ try{ return "V"+CHANGELOG[0].v+" · "+CHANGELOG[0].d; }catch(e){ return ""; } };
/* 3D 화면 자리 : 앱의 #view3d 위에 겹침 */
function placeCanvas(){
  const cv=$("#cv"); let r=null;
  if(document.body.classList.contains("pk")){ const st=$("#stage").getBoundingClientRect(); r={left:0,top:0,width:st.width,height:st.height}; cv.style.display="block";
    const k="pk"+[r.width,r.height].map(Math.round).join(","); if(k!==placeCanvas.k){ placeCanvas.k=k; Object.assign(cv.style,{left:"0px",top:"0px",width:r.width+"px",height:r.height+"px"});
      Object.assign($("#cross").style,{left:(r.width/2)+"px",top:(r.height/2)+"px"}); Object.assign($("#hud").style,{left:"270px",top:(r.height-40)+"px"}); } return true; }
  try{ const d=appWin().document, v=d.getElementById("view3d"); if(v&&v.offsetParent){ const q=v.getBoundingClientRect(); if(q.width>40) r=q; } }catch(e){}
  const fr=APP_FR.getBoundingClientRect(), st=$("#stage").getBoundingClientRect();
  if(!r){ cv.style.display="none"; return false; } cv.style.display="block";
  const L=fr.left-st.left+r.left, T=fr.top-st.top+r.top, k=[L,T,r.width,r.height].map(Math.round).join(",");
  if(k!==placeCanvas.k){ placeCanvas.k=k; Object.assign(cv.style,{left:L+"px",top:T+"px",width:r.width+"px",height:r.height+"px"});
    Object.assign($("#cross").style,{left:(L+r.width/2)+"px",top:(T+r.height/2)+"px"}); Object.assign($("#hud").style,{left:(L+10)+"px",top:(T+r.height-40)+"px"}); }
  return true;
}
function setView(v){
  V3B.view=v; document.body.classList.toggle("fp",v!=="orbit");
  if(v!=="orbit"){ if(!GRID.a) gridBuild(); }
  else if(document.pointerLockElement) document.exitPointerLock();
  $("#fpBtn").textContent=v==="orbit"?"🎥 3인칭 → 1인칭 전환":"🧍 1인칭 → 3인칭 전환";
}
function hud(){ const h=$("#hud"); h.textContent=V3B.view==="orbit"?"3인칭 · 왼쪽 끌기 = 회전 · 오른쪽(Shift) 끌기 = 이동 · 휠 = 확대"
  :"1인칭 · "+(WALK.room==="F"?"충전실":"포장실")+" · W A S D 걷기 · Shift 빠르게 · 화면 클릭 후 마우스로 둘러보기 (Esc 풀기)"; }
/* ── 메인화면 : ① 모드 → ② 작업자 (파우치 방식) ── */
const MODE_NM={easy:"기본 · 학습",guide:"심화 · 학습",examEasy:"기본 · 평가",exam:"심화 · 평가",demo:"시연"};
function spMark(){ $("#workers").classList.toggle("ready",!!CREW.mode); $("#chooseP2").disabled=!CREW.rx;
  document.querySelectorAll("#modes [data-m]").forEach(b=>b.classList.toggle("sel",b.dataset.m===CREW.mode));
  document.querySelectorAll("#rxSel [data-rx]").forEach(b=>b.classList.toggle("on",(b.dataset.rx==="1")===CREW.rx));
  $("#spHint").textContent=CREW.mode?"② "+MODE_NM[CREW.mode]+" — 작업자를 고르세요":"① 모드 선택 — 아래에서 모드를 고른 뒤 ② 작업자를 누르면 그 작업장 작업자 1인칭으로 시작합니다"; }
function crewMark(){ document.querySelectorAll("#crewSw [data-r]").forEach(b=>{ const r=b.dataset.r; b.classList.toggle("on",CREW.cur===r);
  b.disabled=!CREW.cur||(r==="P2"&&!CREW.rx)||(r!=="F"&&CREW.pRole&&r!==CREW.pRole); }); }
function startRoom(r){
  const m=CREW.mode, w=appWin();
  if(r==="F"){ if(!CREW.started.F){ CREW.started.F=true; try{ w.document.getElementById("splash").classList.add("hide"); w.hintOn=false; w.startSession(m); }catch(e){ console.error("충전실 과정",e); } } }
  else if(!CREW.started.P){ CREW.started.P=true; CREW.pRole=r; pcStart(r,m==="demo"?"demo":/exam/i.test(m)?"exam":"learn",!/Easy|easy/.test(m),CREW.rx); }
}
function show(r){
  CREW.cur=r; document.body.classList.toggle("pk",r!=="F"); placeCanvas.k=null;
  setView("fp"); walkSpawnAt(r); crewMark(); $("#modeChip").textContent=MODE_NM[CREW.mode]+" · "+(r==="F"?"충전실":r==="P1"?"포장실 1":"포장실 2");
}
function crewGo(r){ if(!CREW.mode){ $("#spHint").textContent="먼저 ① 모드를 고르세요"; return; } $("#splash").classList.add("hide"); startRoom(r); show(r); }
function goHome(){ try{ const w=appWin(); if(w.S) w.S.running=false; w.goHome&&w.goHome(); }catch(e){}
  pcStop(); PS_ACT.allOff(); Object.assign(CREW,{cur:null,mode:null,pRole:null,started:{F:false,P:false}}); document.body.classList.remove("pk"); setView("orbit");
  $("#splash").classList.remove("hide"); $("#modeChip").textContent=verTxt(); spMark(); crewMark(); }
function walkSpawnAt(r){ if(r==="F") walkSpawn("F"); else { PK_OBS=PK_OBS||pkObstacles(); const p=r==="P1"?[PK.scanX,900]:[19950,1000];
  Object.assign(WALK,{x:p[0],z:p[1],y:1600,yaw:0,pitch:-.35,room:"P"}); } }
function bindSplash(){
  document.querySelectorAll("#modes [data-m]").forEach(b=>b.onclick=()=>{ CREW.mode=b.dataset.m; spMark(); });
  document.querySelectorAll("#rxSel [data-rx]").forEach(b=>b.onclick=()=>{ CREW.rx=b.dataset.rx==="1"; spMark(); });
  $("#chooseF").onclick=()=>crewGo("F"); $("#chooseP1").onclick=()=>crewGo("P1"); $("#chooseP2").onclick=()=>crewGo("P2");
  document.querySelectorAll("#crewSw [data-r]").forEach(b=>b.onclick=()=>{ if(!CREW.cur) return; startRoom(b.dataset.r); show(b.dataset.r); });
  $("#homeBtn").onclick=goHome; spMark(); crewMark();
}
let last=performance.now();
function loop(now){
  requestAnimationFrame(loop); const dt=Math.min(.1,(now-last)/1000); last=now;
  if(!V3B.ready) return;
  if(!placeCanvas()) return;
  walkTick(dt); pkTick(dt); crewTick(dt); v3bFrame(now);
  if((loop.p=(loop.p||0)+dt)>.25){ loop.p=0; pcTick(); }
  if(V3B.statNew){ V3B.statNew=false; gridBuild(); v3bEnvCapture(); $("#load").hidden=true; }
  WALK.room=WALK.x<ROOM.wallX?"F":"P";
  if((loop.k=(loop.k||0)+1)%20===0){ hud(); $("#info").textContent=V3B.t.fps.toFixed(0)+" fps"; }
}
function boot(){
  $("#modeChip").textContent=verTxt();
  v3bInit(); pkBuild(V3B.sc); crewInit(); v3bOrbit(); walkBind(); bindSplash();
  $("#fpBtn").onclick=()=>{ if(V3B.view==="orbit"){ setView("fp"); if(CREW.cur) walkSpawnAt(CREW.cur); } else setView("orbit"); };
  requestAnimationFrame(loop);
}
boot();
