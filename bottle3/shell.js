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
  if(v!=="orbit"){ if(!GRID.a) gridBuild(); walkSpawn(WALK.room||"F"); }
  else if(document.pointerLockElement) document.exitPointerLock();
  $("#fpBtn").textContent=v==="orbit"?"🎥 3인칭 → 1인칭 전환":"🧍 1인칭 → 3인칭 전환";
}
function hud(){ const h=$("#hud"); h.textContent=V3B.view==="orbit"?"3인칭 · 왼쪽 끌기 = 회전 · 오른쪽(Shift) 끌기 = 이동 · 휠 = 확대"
  :"1인칭 · "+(WALK.room==="F"?"충전실":"포장실")+" · W A S D 걷기 · Shift 빠르게 · 화면 클릭 후 마우스로 둘러보기 (Esc 풀기)"; }
let last=performance.now();
function loop(now){
  requestAnimationFrame(loop); const dt=Math.min(.1,(now-last)/1000); last=now;
  if(!V3B.ready) return;
  if(!placeCanvas()) return;
  walkTick(dt); pkTick(dt); v3bFrame(now);
  if(V3B.statNew){ V3B.statNew=false; gridBuild(); v3bEnvCapture(); $("#load").hidden=true; }
  WALK.room=WALK.x<ROOM.wallX?"F":"P";
  if((loop.k=(loop.k||0)+1)%20===0){ hud(); $("#info").textContent=V3B.t.fps.toFixed(0)+" fps"; }
}
function boot(){
  $("#modeChip").textContent=verTxt();
  v3bInit(); pkBuild(V3B.sc); v3bOrbit(); walkBind();
  $("#fpBtn").onclick=()=>setView(V3B.view==="orbit"?"fp":"orbit");
  requestAnimationFrame(loop);
}
boot();
