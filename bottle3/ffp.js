/* ═══════════════════════════════════════════════════════════════════
   충전실 1인칭 직접 조작 (B5-3) — 원본 앱의 타일 · 판넬 버튼 · 설비 화면을 실제 위치에서 조준하고 E / 클릭
   · 자재 위치 = 원본 앱 작업 정의(JOBS)의 손 목표 · 유틸리티 · 조작 판넬은 셸이 3D 모형을 추가 (원본 3D 에 없음 · 위치 추정 [확인 필요])
   · 설비 화면 : 다가가서 누르면 오른쪽 설비 화면을 조작 (F 또는 Esc 로 뒤로) — PTP 와 같음
   · 계단 발판(정제 호퍼 · 캡 볼 피더) 위로 올라서면 눈높이도 올라감 (원본 floorY)
   ═══════════════════════════════════════════════════════════════════ */
const FF={T:[], aim:null, aimIn:false, goal:null, res:{}, hmi:false};
const FF_OBS=[];                                   /* 셸이 추가한 충전실 설비 바닥 점유 (mm · walk.js gridHit) */
const FFU={main:[-6400,1450,-2620], air:[-4900,1305,-1305], dust:[-5600,1400,-2620], pend:[-3200,1250,700], hmi:[-3200,1560,700]};
/* 원본 3D 에 없는 유틸리티 · 조작 판넬 모형 */
function ffBuild(sc){
  const g=new T3.Group(); sc.add(g); const P=v=>v*MM;
  /* 전기판넬 (메인 스위치 손잡이) */
  bx(g,P(-6700),P(-6100),P(800),P(1900),P(-2690),P(-2600),new T3.MeshStandardMaterial({color:0xd9dcd6,roughness:.5}));
  rod(g,[P(-6400),P(1450),P(-2600)],[P(-6400),P(1450),P(-2560)],.04,M.red,20); FF.mainH=bx(g,P(-6420),P(-6380),P(1400),P(1500),P(-2560),P(-2540),M.yellow);
  plate(g,.3,.08,labelTex(["전기판넬 · MAIN S/W"],{w:256,h:64}),[P(-6400),P(1750),P(-2598)],0);
  /* 압축공기 : 라인 한쪽(UA-120 뒤편 · 뒤 통로 쪽) 천장 강하관 · 볼 밸브 · 레귤레이터 → 호스로 UA-120 (공통 형상 idt_common/crewkit.js idtAirDrop · 11/20 사용자 지시 "라인 한쪽에 천장과 연결된 배관 · 에어 밸브")
     서쪽 끝 통로(작업자 A 가 앞 · 뒤 통로를 오가는 x −5750)와 겹치지 않게 UA-120 뒤에 둠 · 작업자는 뒤 통로에서 접근 */
  FF.air=idtAirDrop(g,{x:P(-4900), z:P(-1150), top:P(ROOM.h), label:"압축공기 6 bar", valves:[{y:P(1250), dir:[0,-1], to:[P(-4900),P(650),P(-820)]}]});
  FF_OBS.push([-4970,-4830,-1340,-1090]);
  /* 집진기 전원 스위치 함 */
  bx(g,P(-5700),P(-5500),P(1300),P(1500),P(-2690),P(-2620),M.white); add(g,new T3.Mesh(new T3.CylinderGeometry(.025,.025,.02,20),M.green)).position.set(P(-5600),P(1400),P(-2612)); g.children[g.children.length-1].rotation.x=Math.PI/2;
  plate(g,.24,.06,labelTex(["집진기"],{w:256,h:64}),[P(-5600),P(1560),P(-2618)],0);
  /* 라인 조작 판넬 (기둥 · 버튼 5개 · 설비 화면) */
  const pz=FFU.pend[2]; rod(g,[P(-3200),0,P(pz)],[P(-3200),P(1150),P(pz)],.03,M.ss,14); bx(g,P(-3420),P(-2980),P(1150),P(1350),P(pz-60),P(pz),M.ss);
  [["swStart",M.green],["swStop",M.white],["swReset",M.yellow],["swEmg",M.red],["swJog",M.blue]].forEach(([id,m],i)=>{ const b=add(g,new T3.Mesh(new T3.CylinderGeometry(.022,.022,.02,20),m)); b.rotation.x=Math.PI/2; b.position.set(P(-3380+i*90),P(1250),P(pz+5)); });
  bx(g,P(-3420),P(-2980),P(1400),P(1720),P(pz-60),P(pz-20),M.black); FF.scr=screen(g,.4,.27,[P(-3200),P(1560),P(pz-18)],0,["설비 화면","HMI"]);
  FF.G=g;
}
/* 대상 (mm · 크기 m) — el : 앱 요소 id (누르면 그 요소를 그대로 누름) */
function ffTargets(){
  const w=appWin(); let J={}, Lw=null; try{ J=w.eval("JOBS"); Lw=w.B3.L; }catch(e){} const T=[], add=(id,nm,p,s,el)=>T.push({id,nm,p,s,el});
  add("uMain","메인 전원 스위치 (전기판넬)",FFU.main,[.12,.14,.06],"uMain"); add("uAir","압축공기 밸브",FFU.air,[.16,.1,.06],"uAir"); add("uDust","집진기 전원",FFU.dust,[.12,.12,.06],"uDust");
  add("uDoor","안전문 (UA-120 가드)",[-4300,1100,420],[.5,.6,.06],"uDoor");
  const r=k=>J[k]&&J[k].reach; if(r("bottle")) add("mBottle","빈 병 투입 (벌크 호퍼)",r("bottle"),[.4,.3,.3],"mBottle"); if(r("gel")) add("mGel","실리카겔 롤",r("gel"),[.3,.3,.3],"mGel");
  if(r("tab")) add("mTab","정제 투입 (정제 호퍼)",r("tab"),[.4,.3,.3],"mTab"); if(r("film")) add("mFilm","PE 필름 롤",r("film"),[.3,.3,.3],"mFilm"); if(r("cap")) add("mCap","캡 투입 (볼 피더)",r("cap"),[.4,.3,.3],"mCap");
  if(r("reject")) add("mReject","리젝트 트레이",r("reject"),[.3,.2,.3],"mReject"); if(r("table")) add("mTable","완제품 회수 (집적 테이블)",r("table"),[.5,.2,.5],"mTable");
  [["swStart","START"],["swStop","STOP"],["swReset","RESET"],["swEmg","비상정지"],["swJog","1병 시험"]].forEach(([id,nm],i)=>add(id,"조작 판넬 · "+nm,[-3380+i*90,1250,FFU.pend[2]+10],[.06,.06,.04],id));
  add("hmi","설비 화면 (터치)",FFU.hmi,[.4,.27,.04],"hmiWrap");
  /* 라인 클리어런스 점검 단계 : 원본 점검 항목의 확인 위치(look)에 점검 대상 */
  try{ const st=w.eval("S&&STEPS()[S.tIdx]"), C=w.eval("CLEAR"); if(st&&st.lc!==undefined&&C[st.lc]) add("lcCheck","점검 : "+C[st.lc].t,C[st.lc].look,[.5,.5,.5],"lcCheck"); }catch(e){}
  FF.T=T; return T;
}
const ffDoc=()=>{ try{ return appWin().document; }catch(e){ return null; } };
const ffT=t=>t&&{id:t.id, name:t.nm, c:[t.p[0]*MM,t.p[1]*MM,t.p[2]*MM], s:t.s};
const ffEye=()=>[WALK.x*MM,WALK.y*MM,WALK.z*MM];
function ffAim(){ FF.aim=null; FF.aimIn=false; if(V3B.view==="orbit"||FF.hmi||CREW.cur!=="F") return; const f=walkFwd(); let best=1e9;
  for(const t of FF.T){ const dx=t.p[0]-WALK.x, dy=t.p[1]-WALK.y, dz=t.p[2]-WALK.z, L=Math.hypot(dx,dy,dz); if(L>AIM_LOOK*1000) continue;
    const c=(dx*f[0]+dy*f[1]+dz*f[2])/L, r=Math.max(t.s[0],t.s[1])*1000, ang=Math.acos(Math.min(1,c)), tol=Math.atan2(r*.5+40,L), sc=ang/tol+L/20000; if(ang<tol&&sc<best){ best=sc; FF.aim=t; } }
  if(FF.aim) FF.aimIn=aimInReach(ffT(FF.aim),ffEye()); }
function ffGoal(){ const d=ffDoc(); if(!d||FREEB.on||(CREW.inc&&INCB.mode==="exam"&&!(INCB.hintUntil&&performance.now()<INCB.hintUntil))) return null; const vis=e=>e&&e.getBoundingClientRect().width>0, h=[...d.querySelectorAll(".hint,.hintNow")].find(vis); if(!h) return null;
  return FF.T.find(t=>{ const e=d.getElementById(t.el); return e&&(e===h||e.contains(h)); })||null; }
function ffAct(){ const t=FF.aim; if(!t) return false; if(!FF.aimIn){ pcToast("가까이 가세요 — "+t.nm+" ("+(FF.res.aimDist||0).toFixed(1)+" m · 손 닿는 거리 1.2 m)"); return true; }
  if(t.id==="hmi"){ ffHmi(true); return true; } const d=ffDoc(), e=d&&d.getElementById(t.el); if(!e) return false;
  let W=null, pre=null; try{ W=appWin().eval("WK"); pre=W[0].job; if(W&&W[0]&&!W[0].job){ W[0].x=WALK.x; W[0].z=WALK.z; W[0].route=[]; } }catch(x){}   /* 1인칭 = 작업자 A : 원본 작업자를 내 자리로 (걸어오는 시간 없이 바로 작업) */
  d.body.classList.remove("fpLock"); try{ e.click(); }finally{ d.body.classList.add("fpLock"); }
  ffMeDo(W,pre); return true; }
/* 1인칭 작업 = 파우치 startWork 1인칭과 같게 (11/20 "1인칭이 근간 · 어색하면 안 됨") : 서는 자리에서 바로 · 손 뻗는 짧은 시간(0.8 초)
   · 정제 투입은 리프터로 올려 붓는 과정이 보이므로 그대로(B3_HOLD) · 덮개(가드 도어)를 여는 작업은 도어가 열린 뒤 바로 */
function ffMeDo(W,pre){ try{ const w=W&&W[0], J=w&&w.job; if(!J||J===pre) return;
  if(J.phase==="walk"){ w.route=[]; w.x=J.j.stand[0]; w.z=J.j.stand[1]; }
  if(J.key!=="tab"){ J.j=Object.assign({},J.j,{dur:Math.min(J.j.dur||1.4,.8)}); }
}catch(e){ console.error("1인칭 작업",e); } }
function ffHmi(on){ const d=ffDoc(); FF.hmi=on; if(d) d.body.classList.toggle("hmiOn",on);
  if(on){ FF.back={x:WALK.x,z:WALK.z,yaw:WALK.yaw,pitch:WALK.pitch}; Object.assign(WALK,{x:FFU.hmi[0],z:FFU.hmi[2]+700,yaw:0,pitch:-.05}); if(document.pointerLockElement) document.exitPointerLock(); }
  else if(FF.back) Object.assign(WALK,FF.back); }
function ffHud(){ if(CREW.cur!=="F"||V3B.view==="orbit") return false; const h=$("#hud"), a=FF.aim, g=FF.goal, R=FF.res||{}, m=x=>x==null?"":" · "+x.toFixed(1)+" m";
  h.innerHTML=FF.hmi?"<b>설비 화면 조작 중</b> · 오른쪽 설비 화면을 누르세요 · <b>F</b> 또는 <b>Esc</b> 뒤로"
    :a&&FF.aimIn?"<b>E</b> / 클릭 · <b>"+a.nm+"</b>"+(g===a?" <span class='nx'>다음 작업</span>":""):a&&!R.aimHidden?"<span class='far'>가까이 가세요"+m(R.aimDist)+"</span> · "+a.nm
    :g?"다음 작업 : <b>"+g.nm+"</b>"+m(R.goalDist)+" "+(R.goalDir||""):"1인칭 · 충전실"+(FPC.crouch?" · 앉음":"")+" · WASD 걷기 (Shift 빠르게) · 화면 클릭 후 마우스로 둘러보기 (Esc 풀기) · C 앉기 · F1 힌트 · Tab 메뉴 · H 도움말"; return true; }
function ffInit(){
  ffBuild(V3B.sc); FF.am=createAimMark({T3, scene:V3B.sc, camera:()=>V3B.cam, canvas:()=>$("#cv"), unit:1});
  const css="body.fpLock .tile,body.fpLock #panel .psw{pointer-events:none!important}body.fpLock:not(.hmiOn) #hmiWrap{pointer-events:none!important;filter:saturate(.85)}body.fpLock.hmiOn #hmiWrap{box-shadow:0 0 0 4px #ffd22e}body.fpLock:not(.hmiOn) #hmiWrap{position:relative}body.fpLock:not(.hmiOn) #hmiWrap>*{visibility:hidden!important}body.fpLock:not(.hmiOn) #hmiWrap::before{content:\"🧍 1인칭 진행 중\\A\\A설비 화면은 현장 모니터 앞에서 조준하고 E 로 엽니다. F · Esc 로 닫습니다.\\A\\A상단 [3인칭 전환] 으로 이 자리에 다시 표시할 수 있습니다.\";white-space:pre-wrap;position:absolute;left:12px;right:12px;top:12px;padding:14px 16px;border-radius:12px;background:#fff;border:1px solid #c9d4e0;color:#173a63;font:600 14px/1.55 \"Malgun Gothic\",\"Noto Sans KR\",sans-serif;visibility:visible;z-index:5}";
  const inj=()=>{ const d=ffDoc(); if(d&&d.head&&!d.getElementById("ffCss")){ const s=d.createElement("style"); s.id="ffCss"; s.textContent=css; d.head.appendChild(s);
      /* 1인칭 : 타일 · 판넬 스위치 직접 클릭 차단 (CSS 와 이중 · 11/20) — 3D 대상(ffAct)의 클릭은 프로그램 클릭이라 통과 */
      d.addEventListener("click",e=>{ if(!e.isTrusted||!d.body.classList.contains("fpLock")) return; const t=e.target&&e.target.closest&&e.target.closest(".tile,#panel .psw"); if(!t) return;
        e.stopImmediatePropagation(); e.preventDefault(); pcToast("1인칭 — 설비 앞으로 걸어가 조준하고 E / 클릭으로 조작합니다."); },true); } };
  APP_FR.addEventListener("load",()=>{ inj(); const w=appWin(); w.addEventListener("keydown",e=>{ if(e.target&&e.target.closest&&e.target.closest("input,textarea,select")) return; ffKey(e); WALK.keys[e.code]=true; }); w.addEventListener("keyup",e=>{ WALK.keys[e.code]=false; }); });
  inj(); addEventListener("keydown",ffKey);
}
function ffKey(e){ if(CREW.cur!=="F"||V3B.view==="orbit") return; if(FF.hmi&&(e.code==="KeyF"||e.code==="Escape")){ ffHmi(false); e.preventDefault(); return; } if(e.code==="KeyE"&&!FF.hmi){ if(ffAct()) e.preventDefault(); } }
function ffTick(now){
  const on=CREW.cur==="F"&&V3B.view!=="orbit"; const d=ffDoc(); if(d&&d.body) d.body.classList.toggle("fpLock",on);
  if(FF.air&&now-(FF.ta||0)>250){ FF.ta=now; try{ FF.air.set(0,!!appWin().eval("S.air")); }catch(e){} }   /* 밸브 레버 = 실제 상태 */
  if(!on){ FF.am&&FF.am.hide(); if(FF.hmi) ffHmi(false); return; }
  if(now-(FF.t||0)>300){ FF.t=now; ffTargets(); }
  ffAim(); FF.goal=ffGoal(); FF.res=FF.am.update({eye:ffEye(), goal:FF.hmi?null:ffT(FF.goal), aim:FF.hmi?null:ffT(FF.aim), now});
}
