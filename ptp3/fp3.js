/* ═══════════════════════════════════════════════════════════════════
   1인칭 직접 조작 (P3 · 파우치 방식) — 다가가서 조준하고 E 또는 클릭
   · 조작 대상 : 앱의 타일(유틸리티 · 자재) · 판넬 버튼(START · STOP · RESET · 비상정지 · 인칭) · 설비 화면(HMI)
     → 3D 위치(아래 표 · 장치 번호 라벨 · 장비 시점 위치에서 산출, 일부 추정)에 상자로 둠. 누르면 앱의 그 요소를 그대로 누름
   · 설비 화면 : 누르면 화면 앞으로 다가가고(시점 고정) 오른쪽 설비 화면을 조작 — F 또는 Esc 로 뒤로
   · 1인칭 중에는 앱의 타일 · 판넬 버튼은 현황만(직접 클릭 막음) — 파우치와 같음
   · 대상 표시 : 공통 모듈 idt_common/aimmark.js (11/17 사용자 결정 — 조작 지점 마커 · 손 닿는 거리 1.2 m 안에서만 조작 · 가려지면 안 보임 · 화면 밖은 가장자리 화살표)
   ═══════════════════════════════════════════════════════════════════ */
const FP3={T:[], aim:null, goal:null, hmi:false, t:0, ui:null};
/* 3D 위치 (mm) — 충전기 : 장치 라벨(M3LBL, 2D → 3D) · 판넬 'P' / 포장라인 : 장비 시점 중심(m1~m5) */
const FP3_A={
  F:{ uAir:[-5650,900,-700,"압축공기 밸브"], uMain:[-5750,1350,-100,"메인 전원 스위치 (전기판넬)"], uChiller:[-6500,600,-1600,"냉동기 (외장형 칠러)"], uDoor:[-3300,1250,560,"안전문"],
      mFilm:[-1960,800,560,"성형필름 릴"], mFoil:[-3000,2200,300,"커버포일 릴"], mProd:[-5180,2150,200,"제품 호퍼"], mSplice:[-2150,950,560,"필름 연결부"],
      hmi:[-5300,1500,600,"설비 화면 (터치스크린)"], panel:[-5300,1080,600] },
  P:{ uAir:[1700,900,-700,"압축공기 밸브"], uMain:[2000,1300,-500,"메인 전원 스위치 (라인 MAIN S/W)"], uVac:[2600,500,-700,"진공 펌프"], uDoor:[4000,1200,650,"안전문"],
      mCarton:[2900,1100,650,"카톤 매거진"], mLeaflet:[4400,1300,650,"설명지 매거진"], mCase:[10225,1100,900,"박스 매거진 (박스포장기)"], mPallet:[13350,500,1300,"팔레트 (팔렛타이저)"],
      hmi:[5400,1450,650,"설비 화면 (카토너 HMI)"], panel:[4700,1250,650] }
};
const FP3_BTN=[["swStart","START"],["swStop","STOP"],["swReset","RESET"],["swEmg","비상정지"],["swInch","인칭 (수동 1사이클)"]];
const fp3Doc=()=>{ try{ return UNI_HUB.win(APPK[CREW.cur]).document; }catch(e){ return null; } };
/* 대상 목록 (0.3 초마다) */
function fp3Build(){
  const d=fp3Doc(), A=FP3_A[CREW.cur]; FP3.T=[]; if(!d||!A) return;
  for(const el of d.querySelectorAll(".tile[id]")){ const a=A[el.id]; if(!a) continue; const nm=(el.querySelector("b")||{}).textContent||el.id; FP3.T.push({id:el.id, nm:a[3]||nm, p:a, s:[.45,.45,.45], el}); }
  FP3_BTN.forEach(([id,nm],i)=>{ const el=d.getElementById(id); if(!el) return; const p=A.panel; FP3.T.push({id, nm:"판넬 버튼 · "+nm, p:[p[0]+(i-2)*90,p[1]-(i===3?0:40),p[2]], s:[.08,.08,.08], el}); });
  if(A.hmi) FP3.T.push({id:"hmi", nm:A.hmi[3], p:A.hmi, s:[.5,.4,.12], el:d.getElementById("hmiWrap"), hmi:true});
  /* 점검 단계(코치 [점검 완료]) : 그 단계 장치 위치에 3D 점검 대상 (충전기 = 단계 ↔ 장치 번호 → 장치 라벨 위치, 포장라인 = 카토너 앞) */
  const vis=e=>e&&e.getBoundingClientRect().width>0, h=[...d.querySelectorAll(".hint,.hintNow")].find(vis);
  const lc=d.getElementById("lcCheck"); if(lc&&vis(lc)){ let q=null;
    if(CREW.cur==="F"){ try{ const w=UNI_HUB.win("filler"), dv=w.eval("typeof m3StepDevs==='function'?[...(m3StepDevs()||[])]:[]"), L=w.eval("M3LBL"); const e=dv.map(n=>L.find(x=>x[0]===n)).find(Boolean);
        if(e) q=[4*(e[1]-620)-3680, 4*(380-e[2])+1128, 560]; }catch(x){} }
    q=q||(CREW.cur==="F"?[-3300,1200,560]:[4000,1200,650]);
    FP3.T.push({id:"lcCheck", nm:"점검 : "+(((d.getElementById("cTitle")||{}).textContent)||"확인"), p:q, s:[.6,.6,.6], el:lc}); }
  FP3.goal=h&&MODE3.kind!=="free"&&!(MODE3.kind==="inc"&&INC3.mode==="exam"&&!(performance.now()<INC3.hintUntil))?(FP3.T.find(t=>t.el&&(t.el===h||t.el.contains(h)))||null):null;   /* 자유모드 : 다음 작업 안내 없음 */
}
/* 조준 : 화면 가운데 방향과 가장 가까운 대상 (보이는 거리 6 m 안 · 조작은 손 닿는 거리 1.2 m 안만) */
const fp3T=t=>t&&{id:t.id, name:t.nm, c:[t.p[0]*MM,t.p[1]*MM,t.p[2]*MM], s:t.s, pt:fp3Snap(t), reachMax:t.reachMax};
/* 조작 지점을 실제 설비 표면에 붙임 : 위치 값(일부 추정)에서 수평 4방향으로 광선 → 0.7 m 안의 가장 가까운 설비 면 (없으면 위치 값 그대로) (실별 1회 계산 · 저장)
   설비 앞 빈 공간에 놓인 위치 값 때문에 마커가 공중에 뜨는 것을 막음 */
const FP3_SNAP={};
function fp3Snap(t){ if(t.id==="lcCheck") return null; const k=CREW.cur+":"+t.id+":"+t.p.join(","); if(k in FP3_SNAP) return FP3_SNAP[k];
  const L=[]; for(const [n,o] of Object.entries(V3P.objs)) if(n!=="room"&&o&&o.m&&o.m[0]){ o.m[0].geometry.boundingSphere=null; L.push(o.m[0]); }
  if(!L.length) return null; const o3=new T3.Vector3(t.p[0]*MM,t.p[1]*MM,t.p[2]*MM); let best=null;
  for(const d of [[0,0,-1],[0,0,1],[1,0,0],[-1,0,0]]){ _rc.set(o3,new T3.Vector3(...d)); _rc.far=.7; const h=_rc.intersectObjects(L,false)[0]; if(h&&(!best||h.distance<best.distance)) best=h; }
  return FP3_SNAP[k]=best?[best.point.x,best.point.y,best.point.z]:null; }
const fp3Eye=()=>[WALK.x*MM,WALK.y*MM,WALK.z*MM];
function fp3Aim(){
  FP3.aim=null; FP3.aimIn=false; if(V3P.view==="orbit"||FP3.hmi) return; const f=walkFwd(); let best=1e9;
  for(const t of FP3.T){ const q=fp3Snap(t), P=q?[q[0]*1000,q[1]*1000,q[2]*1000]:t.p, dx=P[0]-WALK.x, dy=P[1]-WALK.y, dz=P[2]-WALK.z, L=Math.hypot(dx,dy,dz); if(L>AIM_LOOK*1000) continue;
    const c=(dx*f[0]+dy*f[1]+dz*f[2])/L, r=Math.max(t.s[0],t.s[1])*1000; const ang=Math.acos(Math.min(1,c)), tol=Math.atan2(r*.5+40,L);
    const sc=ang/tol+L/20000; if(ang<tol&&sc<best){ best=sc; FP3.aim=t; } }   /* 십자선에 가장 가까운 대상 우선 */
  if(FP3.aim) FP3.aimIn=aimInReach(fp3T(FP3.aim),fp3Eye());
}
/* 가림 판정 : 설비 형상에 광선 (0.25 초마다 · 조준이 손 닿는 거리 밖일 때만) */
const _rc=new T3.Raycaster();
function fp3Occ(eye,q){ const d=Math.hypot(q[0]-eye[0],q[1]-eye[1],q[2]-eye[2]); if(d<.1) return false;
  _rc.set(new T3.Vector3(...eye),new T3.Vector3(q[0]-eye[0],q[1]-eye[1],q[2]-eye[2]).normalize()); _rc.far=d-.08;
  const L=[]; for(const o of Object.values(V3P.objs)) if(o&&o.m&&o.m[0]){ o.m[0].geometry.boundingSphere=null; L.push(o.m[0]); }
  return _rc.intersectObjects(L,false).length>0; }
function fp3Act(){
  const t=FP3.aim; if(!t) return false;
  if(!FP3.aimIn){ FP3.far=performance.now(); fp3Hud(); return false; }   /* 손 닿는 거리 밖 */
  if(t.hmi){ fp3Hmi(true); return true; }
  const d=fp3Doc(); if(!d) return false; d.body.classList.remove("fpLock"); try{ t.el.click(); }finally{ d.body.classList.add("fpLock"); }
  return true;
}
/* 설비 화면 앞으로 다가감 · 시점 고정 · 오른쪽 설비 화면 조작 가능 */
function fp3Hmi(on){
  const d=fp3Doc(); FP3.hmi=on; if(d) d.body.classList.toggle("hmiOn",on);
  if(on){ const p=FP3_A[CREW.cur].hmi; FP3.back={x:WALK.x,z:WALK.z,yaw:WALK.yaw,pitch:WALK.pitch}; Object.assign(WALK,{x:p[0],z:p[2]+650,yaw:0,pitch:-.05}); if(document.pointerLockElement) document.exitPointerLock(); }
  else if(FP3.back) Object.assign(WALK,FP3.back);
  fp3Hud();
}
function fp3Hud(){ const h=$("#fpTip"); if(!h) return;
  if(V3P.view==="orbit"||!CREW.cur){ h.hidden=true; return; } h.hidden=false;
  const R=FP3.res||{}, a=FP3.aim, g=FP3.goal, m=x=>x==null?"":" · "+x.toFixed(1)+" m";
  h.innerHTML=FP3.hmi?"<b>설비 화면 조작 중</b> · 오른쪽 설비 화면을 누르세요 · <kbd>F</kbd> 또는 <kbd>Esc</kbd> 뒤로"
    :a&&FP3.aimIn?"<kbd>E</kbd> / 클릭 · <b>"+a.nm+"</b>"+(g===a?" <s>다음 작업</s>":"")
    :a&&!R.aimHidden?"<span class='far'>가까이 가세요"+m(R.aimDist)+"</span> · <b>"+a.nm+"</b>"+(g===a?" <s>다음 작업</s>":"")
    :g?"다음 작업 : <b>"+g.nm+"</b>"+m(R.goalDist)+" <em>"+(R.goalDir||"")+"</em>"
    :"1인칭"+(FPC.crouch?" · 앉음":"")+" · WASD 걷기 (Shift 빠르게) · E / 클릭 조작 · C 앉기 · F1 힌트 · Tab 메뉴 · H 도움말"; }
/* 3D : 조작 지점 마커 (공통 모듈) */
function fp3Init(){
  FP3.am=createAimMark({T3, scene:V3P.sc, camera:()=>V3P.cam, canvas:()=>$("#cv"), unit:1, occluded:fp3Occ});
  /* 앱 화면 : 1인칭 중 타일 · 판넬 버튼은 현황만 / 설비 화면은 다가간 뒤에만 */
  for(const k of ["filler","line"]){ const w=UNI_HUB.win(k); if(!w) continue; const st=w.document.createElement("style");
    st.textContent="body.fpLock .tile,body.fpLock #panel .psw{pointer-events:none!important}body.fpLock .tile{cursor:default}body.fpLock:not(.hmiOn) #hmiWrap{pointer-events:none!important;filter:saturate(.85)}body.fpLock.hmiOn #hmiWrap{box-shadow:0 0 0 4px #ffd22e}body.fpLock:not(.hmiOn) #hmiWrap{position:relative}body.fpLock:not(.hmiOn) #hmiWrap>*{visibility:hidden!important}body.fpLock:not(.hmiOn) #hmiWrap::before{content:\"🧍 1인칭 진행 중\\A\\A설비 화면은 현장 모니터 앞에서 조준하고 E 로 엽니다. F · Esc 로 닫습니다.\\A\\A상단 [3인칭 전환] 으로 이 자리에 다시 표시할 수 있습니다.\";white-space:pre-wrap;position:absolute;left:12px;right:12px;top:12px;padding:14px 16px;border-radius:12px;background:#fff;border:1px solid #c9d4e0;color:#173a63;font:600 14px/1.55 \"Malgun Gothic\",\"Noto Sans KR\",sans-serif;visibility:visible;z-index:5}";
    w.document.head.appendChild(st); }
  addEventListener("keydown",e=>{ fp3Key(e); });
  for(const k of ["filler","line"]){ const w=UNI_HUB.win(k); if(w) w.addEventListener("keydown",e=>{ if(e.target&&e.target.closest&&e.target.closest("input,textarea,select")) return; fp3Key(e); }); }
}
function fp3Key(e){
  if(!CREW.cur||V3P.view==="orbit") return;
  if(FP3.hmi&&(e.code==="KeyF"||e.code==="Escape")){ fp3Hmi(false); e.preventDefault(); return; }
  if(e.code==="KeyE"&&!FP3.hmi){ if(fp3Act()) e.preventDefault(); }
}
function fp3Tick(now){
  const on=!!CREW.cur&&V3P.view!=="orbit";
  for(const k of ["filler","line"]){ const w=UNI_HUB.win(k); if(w&&w.document.body) w.document.body.classList.toggle("fpLock",on&&APPK[CREW.cur]===k); }
  if(!on){ if(FP3.am) FP3.am.hide(); if(FP3.hmi) fp3Hmi(false); fp3Hud(); return; }
  if(now-FP3.t>300){ FP3.t=now; fp3Build(); }
  fp3Aim();
  FP3.res=FP3.am.update({eye:fp3Eye(), goal:FP3.hmi?null:fp3T(FP3.goal), aim:FP3.hmi?null:fp3T(FP3.aim), now, off:document.body.classList.contains("appModal")});
  fp3Hud();
}
