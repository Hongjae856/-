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
/* 압축공기 (11/20 사용자 지시 "블리스터도 장비 후면에 에어밸브") : 충전기 · 카토너 뒤(후면 통로) 강하관 — 벽 위 주관에서 내려옴 · 볼 밸브 레버는 후면 통로 쪽(-z)
   공통 형상 idt_common/crewkit.js idtAirDrop · 레버 = 앱 압축공기 상태 · 조작 대상(uAir)은 레버 위치 (mm) */
/*   충전기(블리스터) : 본체 뒤 0.26 m (x −4.4 m) · 후면 통로(서쪽 끝으로 돌아 들어감)에서 접근 · 주관은 뒷벽 위
     카토너 : 라인 중간쯤 뒤쪽 (11/20 사용자 지시 "카토너는 라인 중간쯤 뒤쪽으로") — 카토너 본체(x 2.0~6.0 m) 가운데 뒤 · 주관은 뒷벽 위 · 후면 통로에서 접근 */
const FP3_AIR={F:{x:-4400, z:-1150, dir:[0,-1], hdr:"back", to:[-4400,700,-890]}, P:{x:4000, z:-900, dir:[0,-1], hdr:"back", to:[4000,700,-640]}};
const FP3_OBS=[];
for(const r of ["F","P"]){ const a=FP3_AIR[r], d=a.dir; FP3_A[r].uAir=[a.x+d[0]*155,1305,a.z+d[1]*155,"압축공기 밸브"];
  FP3_OBS.push([Math.min(a.x-70,a.x+d[0]*200),Math.max(a.x+70,a.x+d[0]*200),Math.min(a.z-70,a.z+d[1]*200),Math.max(a.z+70,a.z+d[1]*200)]); }
function fp3AirBuild(){ FP3.air={}; const L=ROOMBUS.L;
  for(const r of ["F","P"]){ const a=FP3_AIR[r], hd=a.hdr==="back"?[a.x/1000,(L.backZ+60)/1000]:[(L.wallX+L.wallT/2+20)/1000,a.z/1000];
    FP3.air[r]=idtAirDrop(V3P.sc,{x:a.x/1000, z:a.z/1000, top:L.wallH/1000, header:hd, label:"압축공기 6 bar", valves:[{y:1.25, dir:a.dir, to:a.to.map(v=>v/1000)}]}); } }
function fp3AirSync(now){ if(!FP3.air||now-(FP3.ta||0)<250) return; FP3.ta=now;
  for(const [r,k] of [["F","filler"],["P","line"]]){ try{ FP3.air[r].set(0,!!UNI_HUB.win(k).eval("S.air")); }catch(e){} } }
const FP3_BTN=[["swStart","START"],["swStop","STOP"],["swReset","RESET"],["swEmg","비상정지"],["swInch","인칭 (수동 1사이클)"]];
const fp3Doc=()=>{ try{ return UNI_HUB.win(APPK[CREW.cur]).document; }catch(e){ return null; } };
/* 대상 목록 (0.3 초마다) */
function fp3Build(){
  const d=fp3Doc(), A=FP3_A[CREW.cur]; FP3.T=[]; if(!d||!A) return;
  for(const el of d.querySelectorAll(".tile[id]")){ const a=A[el.id]; if(!a) continue; const nm=(el.querySelector("b")||{}).textContent||el.id; FP3.T.push({id:el.id, nm:a[3]||nm, p:a, s:[.45,.45,.45], el}); }
  FP3_BTN.forEach(([id,nm],i)=>{ const el=d.getElementById(id); if(!el) return; const p=A.panel; FP3.T.push({id, nm:"판넬 버튼 · "+nm, p:[p[0]+(i-2)*90,p[1]-(i===3?0:40),p[2]], s:[.08,.08,.08], el}); });
  if(A.hmi) FP3.T.push({id:"hmi", nm:A.hmi[3], p:A.hmi, s:[.5,.4,.12], el:d.getElementById("hmiWrap"), hmi:true});
  const cpT=fp3CpTarget(d); if(cpT) FP3.T.push(cpT);
  /* 점검 단계(코치 [점검 완료]) : 그 단계 장치 위치에 3D 점검 대상 (충전기 = 단계 ↔ 장치 번호 → 장치 라벨 위치, 포장라인 = 카토너 앞) */
  const vis=e=>e&&e.getBoundingClientRect().width>0, h=[...d.querySelectorAll(".hint,.hintNow")].find(vis);
  const lc=d.getElementById("lcCheck"); if(lc&&vis(lc)){ let q=null;
    if(CREW.cur==="F"){ try{ const w=UNI_HUB.win("filler"), dv=w.eval("typeof m3StepDevs==='function'?[...(m3StepDevs()||[])]:[]"), L=w.eval("M3LBL"); const e=dv.map(n=>L.find(x=>x[0]===n)).find(Boolean);
        if(e) q=[4*(e[1]-620)-3680, 4*(380-e[2])+1128, 560]; }catch(x){} }
    q=q||(CREW.cur==="F"?[-3300,1200,560]:[4000,1200,650]);
    FP3.T.push({id:"lcCheck", nm:"점검 : "+(((d.getElementById("cTitle")||{}).textContent)||"확인"), p:q, s:[.6,.6,.6], el:lc}); }
  FP3.goal=h&&MODE3.kind!=="free"&&!(MODE3.kind==="inc"&&INC3.mode==="exam"&&!(performance.now()<INC3.hintUntil))?(FP3.T.find(t=>t.el&&(t.el===h||t.el.contains(h)))||null):null;   /* 자유모드 : 다음 작업 안내 없음 */
  if(!FP3.goal&&cpT&&MODE3.kind!=="free"&&!fp3CpExam(d)) FP3.goal=cpT;   /* 체인지파트 : 장착 위치(앱 화면에는 표시 없음)를 다음 작업으로 */
}
/* 조준 : 화면 가운데 방향과 가장 가까운 대상 (보이는 거리 6 m 안 · 조작은 손 닿는 거리 1.2 m 안만) */
const fp3T=t=>t&&{id:t.id, name:t.nm, c:[t.p[0]*MM,t.p[1]*MM,t.p[2]*MM], s:t.s, pt:fp3Snap(t), reachMax:t.reachMax};
/* 조작 지점을 실제 설비 표면에 붙임 : 위치 값(일부 추정)에서 수평 4방향으로 광선 → 0.7 m 안의 가장 가까운 설비 면 (없으면 위치 값 그대로) (실별 1회 계산 · 저장)
   설비 앞 빈 공간에 놓인 위치 값 때문에 마커가 공중에 뜨는 것을 막음 */
const FP3_SNAP={};
function fp3Snap(t){ if(t.id==="lcCheck"||t.id==="uAir") return null;   /* uAir : 실제 밸브 모형의 레버 위치 그대로 */ const k=CREW.cur+":"+t.id+":"+t.p.join(","); if(k in FP3_SNAP) return FP3_SNAP[k];
  const L=[]; for(const [n,o] of Object.entries(V3P.objs)) if(n!=="room"&&o&&o.m&&o.m[0]){ o.m[0].geometry.boundingSphere=null; L.push(o.m[0]); }
  if(!L.length) return null; const o3=new T3.Vector3(t.p[0]*MM,t.p[1]*MM,t.p[2]*MM); let best=null;
  if(/^cp/.test(t.id)){ const o=new T3.Vector3(t.p[0]*MM,t.p[1]*MM,t.p[2]*MM+1.2); _rc.set(o,new T3.Vector3(0,0,-1)); _rc.far=1.25; const h=_rc.intersectObjects(L,false)[0];   /* 교체부품 : 작업자 쪽(앞)에서 장착 위치로 — 앞쪽 첫 면 (뒷면에 붙지 않게) */
    return FP3_SNAP[k]=h?[h.point.x,h.point.y,h.point.z+.02]:null; }
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
  const d=fp3Doc(); if(!d) return false; const k=APPK[CREW.cur], w=UNI_HUB.win(k), pre=fp3Jobs(k,w);
  if(t.act){ try{ t.act(w); }catch(e){ console.error(e); } fp3MeDo(k,w,pre); return true; }
  d.body.classList.remove("fpLock"); try{ t.el.click(); }finally{ d.body.classList.add("fpLock"); }
  fp3MeDo(k,w,pre); return true;
}
/* 1인칭 = 플레이어가 그 작업자 (11/20 사용자 지시 "1인칭이 근간 · 어색하면 안 됨") — 파우치 startWork 1인칭과 같게 :
   앱이 작업을 걸면 (1) 다른 구역 작업자에게 가지 않고 플레이어(앱 작업자 0)가 맡고 (2) 걸어오는 시간 없이 지금 자리에서 (3) 손 뻗는 짧은 시간(0.8 초)에 끝냄
   · 롤 교체(2인 1조)는 보조 작업자가 옆에 올 때까지 기다림(crew3.js CH3 · PTP_HOLD) */
function fp3Jobs(k,w){ try{ if(k==="filler") return w.eval("workerJob"); return (w.PTP_WK||w.eval("WK")).map(x=>x.job?x.cb||x.job:null); }catch(e){ return null; } }
function fp3MeDo(k,w,pre){ try{
  if(k==="filler"){ const j=w.eval("workerJob"); if(!j||j===pre) return; w.eval("workerX="+j.to); j.from=j.to; j.elapsed=Math.max(j.elapsed,j.walkTime); if(!ROLL3.includes(j.key)) j.duration=Math.min(j.duration||2.2,.8); return; }
  const W=w.PTP_WK||w.eval("WK"); const i=W.findIndex((x,n)=>x.job&&(x.cb||x.job)!==(pre&&pre[n])); if(i<0) return;
  const me=W[0], o=W[i];
  if(i!==0){ if(me.job) return; Object.assign(me,{job:o.job,t:o.t,cb:o.cb,xt:o.xt,workPhase:0}); o.job=null; o.cb=null; o.t=0; o.xt=o.x; try{ w.eval("lastWK=WK[0]"); }catch(e){} }
  me.x=me.xt; me.walking=false; me.t=Math.min(me.t,.8);
}catch(e){ console.error("1인칭 작업",e); } }
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
  fp3AirBuild();
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
  const on=!!CREW.cur&&V3P.view!=="orbit"; fp3AirSync(now); fp3BenchBuild();
  for(const k of ["filler","line"]){ const w=UNI_HUB.win(k); if(w&&w.document.body) w.document.body.classList.toggle("fpLock",on&&APPK[CREW.cur]===k); }
  if(!on){ if(FP3.am) FP3.am.hide(); if(FP3.hmi) fp3Hmi(false); fp3Hud(); return; }
  /* 1인칭 라인 클리어런스 : 원본은 점검 1건마다 여러 장치를 차례로 도는 방문 작업(startClearanceVisit) — 첫 방문만 즉시였고 남은 방문은 보이지 않는 작업자가 걸어 돌아 점검마다 4~10 초 대기 (11/23 단계별 측정)
     → 플레이어가 이미 그 자리에서 확인하므로 남은 방문도 그 자리에서 짧게 (파우치 startWork 1인칭과 같음) */
  if(CREW.cur==="F"){ try{ const w=UNI_HUB.win("filler"), j=w.eval("workerJob"); if(j&&j.kind==="clearance"&&!j.fpMe){ j.fpMe=1; w.eval("workerX="+j.to); j.from=j.to; j.elapsed=Math.max(j.elapsed,j.walkTime); j.duration=Math.min(j.duration||2.2,.8); } }catch(e){} }
  if(now-FP3.t>300){ FP3.t=now; fp3Build(); }
  fp3Aim();
  FP3.res=FP3.am.update({eye:fp3Eye(), goal:FP3.hmi?null:fp3T(FP3.goal), aim:FP3.hmi?null:fp3T(FP3.aim), now, off:document.body.classList.contains("appModal")});
  fp3Hud();
}

/* ═══ 체인지파트 1인칭 (11/20 1인칭 점검 · 원본의 '부품 그림을 앱 3D 화면 위로 끌어 놓기'를 현장 작업으로) ═══
   · 준비물 : 충전기 앞 교체부품 작업대(대차)로 가서 → 확인 창(공구 · 보호장갑 · 부품 세트)
   · 부품마다 : 그 부품의 실제 장착 위치로 가서 E — 안착 → 체결 → 장착 확인 (한 번 누를 때마다 한 단계)
   · 전체 장착 확인 : 충전기 가운데 */
window.PTP_CP=true;
const fp3Cp=w=>{ try{ return w.PTP_CPINFO&&w.PTP_CPINFO(); }catch(e){ return null; } };
function fp3CpExam(d){ try{ const w=UNI_HUB.win(CREW.cur==="P"?"line":"filler"); return !!w.eval("isExam()")&&!w.eval("typeof examHintActive==='function'&&examHintActive()"); }catch(e){ return false; } }
function fp3CpTarget(d){ const F=CREW.cur==="F", w=UNI_HUB.win(F?"filler":"line"), c=fp3Cp(w); if(!c) return null; const L=ROOMBUS.L;
  const P3=F?(v=>[4*v[0]-3680, 4*v[1]+1128, 4*v[2]+L.fillerZ]):(v=>[8000+5*v[0], 5*v[1], 5*(v[2]||0)]), bench=F?FP3_BENCH.pt:FP3_BENCH.ptP;
  const place=w=>F?w.cpPerform(true):w.cpPerform(null,"drag");
  if(c.prep) return {id:"cpPrep", nm:"교체부품 작업대 (공구 · 보호장갑 · 부품 세트 확인)", p:bench||(F?[-2600,800,1800]:[3000,800,1800]), s:[.6,.3,.5], el:d.getElementById("cpPrepChecklist")||d.getElementById("cpAction"), act:()=>PTP_PREP()};
  if(c.fin) return {id:"cpFin", nm:"전체 장착 확인 (누락 · 미체결 · 남은 공구)", p:F?[-3300,1250,560]:[4000,1200,650], s:[.8,.6,.6], el:d.getElementById("cpAction"), act:w=>w.cpPerform()};
  if(c.adj) return {id:"cpAdj", nm:"수치 조절 · "+c.nm, p:[8000+5*c.adj[0], 5*c.adj[1], 650], s:[.3,.3,.3], el:d.getElementById("adjustPoint")||d.getElementById("cpAction"), act:w=>{ if(document.pointerLockElement) document.exitPointerLock(); w.openAdjustment(); }};
  if(!c.pos) return null; const ph=["장착 (위치에 맞춰 넣기)","체결","장착 확인"][c.phase]||"장착";
  return {id:"cpPart", nm:"교체부품 · "+c.nm+" — "+ph, p:P3(c.pos), s:[.25,.25,.25], el:c.phase===0?d.getElementById("cpTarget"):d.getElementById("cpAction"), act:w=>{ if(c.phase===0) place(w); else w.cpPerform(); }};
}
/* 교체부품 작업대 (파우치 대차 모형 + 부품 상자 · 공구 쟁반 · 장갑) — 충전기 앞 빈 바닥 */
const FP3_BENCH={pt:null};
function fp3BenchBuild(){ if(FP3_BENCH.G||!GRID.a) return; const at=idtNearFree((x,z)=>PTP_FREER(x,z,.5),-2.9,1.9,2.5,[0,1])||[-2.9,1.9];
  const G=new T3.Group(); idtCartBuild(G); G.position.set(at[0],0,at[1]); G.rotation.y=Math.PI/2; V3P.sc.add(G); FP3_BENCH.G=G;
  bx(G,-.17,.17,.63,.8,-.38,-.02,M.grey); bx(G,-.16,.16,.79,.81,-.37,-.03,M.dark);                               /* 교체부품 상자 */
  bx(G,-.15,.15,.63,.67,.06,.36,M.ssD); rod(G,[-.1,.69,.12],[.08,.69,.3],.008,M.red,8); rod(G,[.05,.69,.1],[.1,.69,.32],.006,M.ssMir,8);   /* 공구 쟁반 */
  bx(G,-.12,-.02,.67,.69,.2,.34,M.blue);                                                                         /* 보호장갑 */
  plate(G,.3,.08,labelTex(["교체부품 · 공구"],{w:256,h:64}),[0,.92,0],0);
  FP3_BENCH.pt=[at[0]*1000,800,at[1]*1000]; FP3_OBS.push([at[0]*1000-480,at[0]*1000+480,at[1]*1000-280,at[1]*1000+280]);
  const aP=idtNearFree((x,z)=>x>(ROOMBUS.L.wallX+ROOMBUS.L.wallT)/1000+.6&&walkFree(x*1000,z*1000)&&walkFree(x*1000+250,z*1000)&&walkFree(x*1000-250,z*1000),3.0,2.3,2.5,[0,1])||[3.0,2.3];   /* 포장실 : 카토너 앞 */
  const GP=G.clone(); GP.position.set(aP[0],0,aP[1]); V3P.sc.add(GP); FP3_BENCH.ptP=[aP[0]*1000,800,aP[1]*1000]; FP3_OBS.push([aP[0]*1000-480,aP[0]*1000+480,aP[1]*1000-280,aP[1]*1000+280]); }
/* 준비물 확인 창 (현장 작업대 앞 · 3인칭 [장착] 버튼에서도) */
function PTP_PREP(){ const w=UNI_HUB.win(CREW.cur==="P"?"line":"filler"); let items=[]; try{ items=w.PTP_PREPITEMS||[]; }catch(e){}
  let dl=$("#cpPrepDlg"); if(!dl){ dl=document.createElement("div"); dl.id="cpPrepDlg"; dl.style.cssText="position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;background:rgba(10,20,30,.35)"; document.body.appendChild(dl); }
  const st=k=>{ try{ return !!w.eval("S.cpPrepChecks&&S.cpPrepChecks['"+k+"']"); }catch(e){ return false; } };
  const draw=()=>{ dl.innerHTML='<div style="background:#fff;border-radius:14px;padding:16px 18px;min-width:320px;font:600 14px/1.5 \'Malgun Gothic\',sans-serif;color:#173a63;box-shadow:0 10px 30px rgba(0,0,0,.25)"><b style="font-size:16px">교체부품 작업대 — 준비물 확인</b><div style="margin:8px 0 12px;color:#5d7086;font-weight:500">하나씩 눈으로 확인하고 누르세요.</div>'+
      items.map(([k,t])=>'<button data-k="'+k+'" style="display:block;width:100%;text-align:left;margin:6px 0;padding:9px 12px;border-radius:10px;border:1px solid '+(st(k)?'#1e9a4a;background:#e8f6ee':'#c9d4e0;background:#fff')+';font:inherit;cursor:pointer">'+(st(k)?'✔ ':'☐ ')+t+'</button>').join("")+
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button id="cpPrepX" style="padding:7px 14px;border-radius:9px;border:1px solid #c9d4e0;background:#fff;font:inherit;cursor:pointer">닫기</button></div></div>';
    dl.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{ let all=false; try{ all=w.PTP_PREPSET(b.dataset.k); }catch(e){} draw(); if(all){ setTimeout(()=>{ dl.remove(); try{ w.cpPerform(); }catch(e){} },350); } });
    $("#cpPrepX").onclick=()=>dl.remove(); };
  if(document.pointerLockElement) document.exitPointerLock(); draw(); }
