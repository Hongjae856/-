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
function hud(){ const h=$("#hud"); if(typeof pfHud==="function"&&pfHud()) return; if(typeof ffHud==="function"&&ffHud()) return; h.textContent=V3B.view==="orbit"?"3인칭 · 왼쪽 끌기 = 회전 · 오른쪽(Shift) 끌기 = 이동 · 휠 = 확대"
  :"1인칭 · "+(WALK.room==="F"?"충전실":"포장실")+" · W A S D 걷기 · Shift 빠르게 · 화면 클릭 후 마우스로 둘러보기 (Esc 풀기)"; }
/* ── 메인화면 : ① 모드 → ② 작업자 (파우치 방식) ── */
const MODE_NM={easy:"기본 · 학습",guide:"심화 · 학습",examEasy:"기본 · 평가",exam:"심화 · 평가",demo:"시연",free:"자유",inc:"이상사례"};
function spMark(){ $("#chooseP2").disabled=!CREW.rx;
  document.querySelectorAll("#rxSel [data-rx]").forEach(b=>b.classList.toggle("on",(b.dataset.rx==="1")===CREW.rx));
  idtSplashMark({mode:CREW.mode, modeNm:MODE_NM[CREW.mode], room:null, isSel:b=>b.dataset.m===CREW.mode}); }
function crewMark(){ document.querySelectorAll("#crewSw [data-r]").forEach(b=>{ const r=b.dataset.r; b.classList.toggle("on",CREW.cur===r);
  b.disabled=!CREW.cur||(r==="P2"&&!CREW.rx)||(r!=="F"&&CREW.pRole&&r!==CREW.pRole); }); }
function startRoom(r){
  const m=CREW.mode, w=appWin();
  if(r==="F"){ if(!CREW.started.F){ CREW.started.F=true; try{ w.document.getElementById("splash").classList.add("hide"); w.hintOn=false; w.B3_DEMO_STEP=m==="demo"; w.startSession(m==="free"?"guide":m); if(m==="demo") demobStart("F"); if(m==="free") freeStart("F"); }catch(e){ console.error("충전실 과정",e); } } }
  else if(!CREW.started.P){ CREW.started.P=true; CREW.pRole=r; pcStart(r,m==="demo"?"demo":m==="free"?"free":/exam/i.test(m)?"exam":"learn",!/Easy|easy/.test(m),CREW.rx); if(m==="free") freeStart("P"); if(m==="demo") demobStart("P"); }
}
function show(r){
  CREW.cur=r; document.body.classList.toggle("pk",r!=="F"); placeCanvas.k=null;
  setView("fp"); walkSpawnAt(r); crewMark(); $("#modeChip").textContent=MODE_NM[CREW.mode]+" · "+(r==="F"?"충전실":r==="P1"?"포장실 1":"포장실 2");
}
function crewGo(r){ if(CREW.mode&&CREW.mode!=="inc") LASTB={m:CREW.mode,r,rx:CREW.rx}; if(!CREW.mode){ spMark(); return; } if(CREW.mode==="inc"){ incbPick(r==="F"?"F":"P"); return; } $("#splash").classList.add("hide"); startRoom(r); show(r); }
function goHome(){ idtResClose([document,(()=>{ try{ return appWin().document; }catch(e){ return null; } })()]); try{ const w=appWin(); w.B3_DEMO_STEP=false; if(w.S) w.S.running=false; w.goHome&&w.goHome(); }catch(e){}
  pcStop(); freeStop(); incbExamCss(false); $("#pDlg").hidden=true; PS_ACT.allOff(); Object.assign(PS.leaf,{fault:false,lock:false}); PS.vis.bad=false; PS.pr.faint=false; INCB.k=null; Object.assign(CREW,{cur:null,mode:null,pRole:null,inc:false,started:{F:false,P:false}}); $("#incPick").style.display="none"; $("#splash .go").style.display="grid"; document.body.classList.remove("pk"); setView("orbit");
  $("#splash").classList.remove("hide"); $("#modeChip").textContent=verTxt(); spMark(); crewMark(); }
function walkSpawnAt(r){ if(r==="F") walkSpawn("F"); else { PK_OBS=PK_OBS||pkObstacles(); const p=r==="P1"?[PK.scanX,900]:[19950,1000];
  Object.assign(WALK,{x:p[0],z:p[1],y:fpcEye(0),yaw:0,pitch:-.35,room:"P"}); } }
function bindSplash(){
  document.querySelectorAll("#splash .go [data-m]").forEach(b=>b.onclick=()=>{ CREW.mode=b.dataset.m; spMark(); });
  document.querySelectorAll("#rxSel [data-rx]").forEach(b=>b.onclick=()=>{ CREW.rx=b.dataset.rx==="1"; spMark(); });
  $("#chooseF").onclick=()=>crewGo("F"); $("#chooseP1").onclick=()=>crewGo("P1"); $("#chooseP2").onclick=()=>crewGo("P2");
  document.querySelectorAll("#crewSw [data-r]").forEach(b=>b.onclick=()=>{ if(!CREW.cur) return; startRoom(b.dataset.r); show(b.dataset.r); });
  $("#homeBtn").onclick=goHome; spMark(); crewMark();
  $("#spOee").onclick=()=>{ if(typeof OEEEDU!=="undefined") OEEEDU.open(); };
  
}
let last=performance.now();
function loop(now){
  requestAnimationFrame(loop); const dt=Math.min(.1,(now-last)/1000); last=now;
  if(!V3B.ready) return;
  if(!placeCanvas()) return;
  tbTick(dt); walkTick(dt); pkTick(dt); crewTick(dt); pfTick(now); ffTick(now); v3bFrame(now);
  if((loop.p=(loop.p||0)+dt)>.25){ loop.p=0; pcTick(); incbTick(); demobTick(); }
  if(V3B.statNew){ V3B.statNew=false; gridBuild(); v3bEnvCapture(); $("#load").hidden=true; }
  WALK.room=WALK.x<ROOM.wallX?"F":"P";
  if((loop.k=(loop.k||0)+1)%4===0) hud();
  if(loop.k%20===0){ $("#info").textContent=V3B.t.fps.toFixed(0)+" fps"; }
}
/* F1 힌트 (세 IDT 공통) : 충전실 = 원본 앱 (평가 −5 점) · 포장실 = 포장 과정 (평가 −5 점) · 자유 = 없음 */
function bHint(){
  if(CREW.mode==="free"){ fpcToast("자유모드 — 순서 · 힌트 없음"); return; }
  if(CREW.cur==="F"&&CREW.inc&&INCB.room==="F"){ if(INCB.mode==="exam") incbHintF(); else fpcToast(FF.goal?"다음 작업 : "+FF.goal.nm:"알람 · 이상 안내에 따라 조치하세요"); return; }
  if(CREW.cur==="F"){ const w=appWin(); let ex=false; try{ ex=!!w.eval("isExam()"); }catch(e){}
    if(ex){ const b=w.document.getElementById("examHint"); if(b&&!b.disabled){ b.click(); fpcToast("힌트 사용 −5 점 — 다음 작업 표시"); } else fpcToast("힌트 표시 중"); return; }
    let t=""; try{ t=w.document.getElementById("cTitle").textContent; }catch(e){} fpcToast(FF.goal?"다음 작업 : "+FF.goal.nm:(t||"안내 없음")); return; }
  pcHint(); }
/* 배속 : 충전실 앱 SPD · 포장실 시뮬레이션 (×1 ×2 ×5 ×10) */
function tbBSpd(v){ try{ const w=appWin(); if(w.eval("SPD")!==v) w.eval("SPD="+v); }catch(e){} }
/* 학습 종료 : 충전실 = 원본 앱 결과 화면 / 포장실 = 포장 과정 결과 / 자유 · 시연 · 이상사례 = 메인화면 */
function bEnd(){ if(!CREW.cur) return true; if(CREW.mode==="free"||CREW.mode==="demo"||CREW.inc){ goHome(); return true; }
  if(CREW.cur==="F") return false; if(PC.on&&!PC.done){ PC.done=true; pcResult(); } else if(PC.done) pcResult(); return true; }
function bRubric(){ if(CREW.cur==="F") return false;
  pcDlg('<h3>채점 관리 — 포장실</h3><table class="cmp"><tr><th>항목</th><th>감점</th></tr><tr><td>순서가 다른 조작</td><td>−3</td></tr><tr><td>작업 지시서와 다른 중량 세팅</td><td>−5</td></tr><tr><td>힌트 사용 (단계마다 1 회)</td><td>−5</td></tr></table><p>합격 기준 80 점 (충전실 · 파우치 · 블리스터와 같음)</p>',[["닫기",null]]); return true; }
let LASTB=null;
function bRestart(){ const L=LASTB; goHome(); if(!L) return; setTimeout(()=>{ CREW.rx=L.rx; spMark(); const m=document.querySelector('#splash .go [data-m="'+L.m+'"]'); if(m) m.click(); const r=document.getElementById("choose"+L.r); if(r) r.click(); },300); }
function boot(){
  $("#modeChip").textContent=verTxt();
  v3bInit(); pkBuild(V3B.sc); crewInit(); pfInit(); ffInit(); oeebInit(); v3bOrbit(); walkBind(); bindSplash(); fpcInit({isFP:()=>V3B.view!=="orbit"&&!(typeof FF!=="undefined"&&FF.hmi), hint:bHint, third:()=>$("#fpBtn").click(), home:()=>goHome()});
  tbViews({orbit:()=>V3B.orbit, isOrbit:()=>V3B.view==="orbit"&&$("#splash").classList.contains("hide"), rect:()=>{ const c=document.getElementById("cv").getBoundingClientRect(), s=document.getElementById("stage").getBoundingClientRect(); let top=c.top;   /* 안내판(충전 · 포장)과 겹치지 않게 그 아래 */
    for(const id of ["dmCoach","pkCoach"]){ const k=document.getElementById(id); if(!k||k.hidden||!k.offsetParent||!k.innerHTML) continue; const r=k.getBoundingClientRect(); if(r.width>0&&r.left<c.left+460&&r.top<c.top+80) top=Math.max(top,r.bottom+4); }
    return {left:c.left-s.left,top:top-s.top,width:c.width}; },
    presets:[["전체",{yaw:-.45,pitch:.38,dist:9500,tx:1400,ty:700,tz:200}],["충전실",{yaw:-.4,pitch:.36,dist:8500,tx:-1000,ty:800,tz:0}],["포장실",{yaw:-.4,pitch:.38,dist:9000,tx:15500,ty:800,tz:300}],
      ["전면",{yaw:0,pitch:.12,dist:17000,tx:7500,ty:1100,tz:0}],["평면",{yaw:0,pitch:1.45,dist:23000,tx:7500,ty:0,tz:1200}]]});
  /* 상단 바 (파우치 기준 · idt_common/topbar.js) — 라인 속도는 원본 앱 값(병/분)을 그대로 조절 */
  tbInit({wins:()=>[appWin()].filter(Boolean), cur:()=>CREW.cur==="F"?appWin():null, ids:{snd:"soundBtn",end:"endBtn"},
    extra:'<span class="pill" title="충전 라인 속도 (병/분)">속도<button id="tbBpmDn">−</button><b class="v" id="tbBpm">28</b><button id="tbBpmUp">+</button></span>',
    speed:s=>tbBSpd(s), sync:()=>{ tbBSpd(TBQ.spd); try{ $("#tbBpm").textContent=appWin().document.getElementById("bpmV").textContent; }catch(e){} },
    R:()=>V3B.R, scene:()=>V3B.sc, lights:()=>{ const L=[]; V3B.sc.traverse(o=>{ if(o.isDirectionalLight&&o.castShadow!==undefined&&o.shadow) L.push(o); }); return L; },
    end:()=>bEnd(), rubric:()=>bRubric(), restart:()=>bRestart()});
  $("#tbBpmDn").onclick=()=>{ tbClick(appWin(),"bpmDn"); tbSync(); }; $("#tbBpmUp").onclick=()=>{ tbClick(appWin(),"bpmUp"); tbSync(); };
  $("#fpBtn").onclick=()=>{ if(V3B.view==="orbit"){ setView("fp"); if(CREW.cur) walkSpawnAt(CREW.cur); } else setView("orbit"); };
  requestAnimationFrame(loop);
}
boot();
