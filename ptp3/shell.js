/* ═══════════════════════════════════════════════════════════════════
   셸 (P1) — PTP 두 앱(충전기 · 포장라인)을 보이지 않는 iframe 으로 띄워 두고(과정 · 시뮬레이션 · 형상 생성),
   3D 는 셸의 Three.js 가 그린다. 두 앱은 직접 그리지 않음(UNI_HUB.active = "three").
   ═══════════════════════════════════════════════════════════════════ */
const $=s=>document.querySelector(s);
const APPS=JSON.parse(document.getElementById("apps-data").textContent);
const decode=b=>new TextDecoder().decode(Uint8Array.from(atob(b),c=>c.charCodeAt(0)));
const ROOM_NM={F:"충전실 작업자",P:"포장실 작업자"};
UNI_HUB.active="three";                                    /* 두 앱 모두 자기 캔버스에 그리지 않음 — 형상만 만듦 */
for(const k of ["filler","line"]){ const f=document.createElement("iframe"); f.dataset.room=k; f.title=k==="filler"?"PTP 충전기 (형상 · 과정)":"PTP 포장라인 (형상 · 과정)"; f.srcdoc=decode(APPS[k]); $("#apps").appendChild(f); }
function appsReady(){ const f=UNI_HUB.win("filler"), l=UNI_HUB.win("line"); return !!(f&&l&&f.UNI_GEN&&l.UNI_GEN&&f.UNI_ROOM&&f.UNI_DYN); }
function setView(v){
  V3P.view=v==="orbit"?"orbit":"walk";
  document.querySelectorAll("#views button").forEach(b=>b.classList.toggle("on",b.dataset.v===v));
  if(v!=="orbit") walkSpawn(v); else if(document.pointerLockElement) document.exitPointerLock();
  $("#cross").style.display=v==="orbit"?"none":"block"; $("#cv").focus(); hud();
}
function hud(){
  $("#hud").innerHTML=V3P.view==="orbit"
    ?"<b>3인칭 전체</b> · 왼쪽 끌기 = 회전 · 오른쪽(또는 Shift) 끌기 = 이동 · 휠 = 확대 · 위 [🧍 작업자] 를 누르면 그 실 1인칭"
    :"<b>1인칭 · "+ROOM_NM[WALK.room]+"</b> · W A S D = 걷기 · Shift = 빠르게 · 화면 클릭 후 마우스 = 둘러보기 (Esc = 마우스 풀기) · 설비 · 칸막이 벽은 통과하지 않음";
}
let last=0;
function loop(now){
  requestAnimationFrame(loop);
  const dt=Math.min(.1,last?(now-last)/1000:0); last=now;
  walkTick(dt); crew3Tick(dt); v3Frame(now);
  if(now-(loop.i||0)>500){ loop.i=now; $("#info").textContent=Math.round(V3P.t.fps)+" fps · 형상 "+V3P.t.genMs.toFixed(1)+" ms"; }
}
function boot(){
  if(!appsReady()){ setTimeout(boot,100); return; }
  v3Init(); v3Orbit(); walkBind(); crew3Init();
  v3Gen(true); v3Gen(true); gridBuild(); try{ v3EnvCapture(); }catch(e){ console.error("반사 환경",e); }
  document.querySelectorAll("#views button").forEach(b=>b.onclick=()=>setView(b.dataset.v));
  $("#load").style.display="none"; setView("F"); requestAnimationFrame(loop);   /* 1인칭이 기본 (11/17 사용자 지시) */
}
boot();
