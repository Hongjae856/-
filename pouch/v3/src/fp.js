/* ═══════════════════════════════════════════════════════════════════
   1인칭 연결 (새 3D · 단위 m) — 교육 시작 시 1인칭, 상단 버튼으로 3인칭 전환
   · 눈높이 1.6 m · 이동 속도 3.8 m/s · 계단 · 2층 데크 높이를 따라 눈높이를 부드럽게 맞춤
   · 조작은 기존 타일 · 판넬 · 설비 화면 · 현장 조치 함수를 그대로 호출 (단계 · 인터락 판정 유지)
   · 설비 화면 DOM 은 장면의 실제 모니터 면(방향 포함)에 투영
   ═══════════════════════════════════════════════════════════════════ */
const FP={on:false, want:true, mod:null, feet:0, bob:0, bobA:0, hl:{goal:null,aim:null}, monK:null, help:false};
const EYE=1.6, FP_R=.23, FP_REACH=1.9, STEP_UP=.42;
const fpActive=()=>!!(FP.on&&cam.fp);
const inR=(x,z,r,m)=>x>r[0]-m&&x<r[1]+m&&z>r[2]-m&&z<r[3]+m;

/* ── 바닥 장애물 [x0,x1,z0,z1] ── */
function fpObstacles(){
  const L=[], b=(x0,x1,z0,z1)=>L.push([x0,x1,z0,z1]), F=FL, xw=F.x0-F.ext;
  /* 충전실 */
  b(F.bx0-.05,F.bx1+.05,F.bz0,F.bz1+.12);                       /* 본체 · 제어함 */
  b(F.x0-.05,F.bx0,F.bz0+.1,F.bz1-.1);                           /* 성형 · 슈트 (서쪽 정면) */
  b(CVX-.16,CVX+.16,0,F.zc+.55);                                 /* 배출 컨베이어 */
  b(F.bx1,F.bx1+.78,F.zc-.62,F.zc+.62);                          /* 언와인더 */
  b(F.x0-.62,F.x0-.37,F.bz0-.42,F.bz0+.18);                      /* 컨트롤 판넬 */
  for(const [x,z] of [[xw+.05,F.z0+.05],[xw+.05,F.z1-.05],[F.x0+.045,F.z0+.05],[F.x0+.045,F.z1-.05],[F.x1-.05,F.z0+.05],[F.x1-.05,F.z1-.05],[F.x0+.045,F.bz0-.07],[F.x0+.045,F.bz1+.07]]) b(x-.06,x+.06,z-.06,z+.06);
  b(CVX+.38,CVX+1.07,.38,1.25);                                  /* 프린터 컨트롤러 거치대 */
  b(6.17,7.33,.22,1.38); b(6.17,7.33,1.64,2.8);                  /* IBC 2 */
  b(10.2,11.2,1.35,2.25);                                        /* 드럼리프터 */
  b(COL.x0,COL.x1,COL.z0,COL.z1);                                /* 건물 기둥 */
  b(.1,.74,.23,1.27); b(.1,.74,1.38,2.42);                       /* 저울 작업대 2 */
  b(9.65,10.15,5.45,6.35); b(10.38,11.52,5.68,6.72);             /* 은박 대차 · 예비 은박 */
  b(RM.pier-.14,RM.pier+.14,0,.62); b(RM.pier-.14,RM.pier+.14,6.33,7);   /* 벽기둥 */
  b(7.42,7.82,.18,.52);                                          /* 수지 마개 */
  /* 포장실 : 라인 · 받침대 · 작업자 · 자재대 · 작업대 · 파렛트 · 성형 박스 대차 · 자재 */
  b(CVX-.62,CVX+.98,-9.15,-.2);                                  /* 스틱공급장치 ~ 배출함 */
  b(CVX-1.22,CVX+1.22,-10.52,-9.15);                             /* 대케이스 포장 : 받침대 · 작업자 2 · 자재대 */
  b(CVX-.5,CVX+.3,-12.25,-10.52);                                /* 검은 벨트 */
  b(CVX-.52,CVX+.52,-15.02,-12.25);                              /* 녹색 벨트 작업대 */
  b(CVX+.52,CVX+.92,-15.05,-14.3);                               /* 작업자 3 */
  b(CVX+1.2,CVX+2.3,-14.75,-13.65);                              /* 파렛트 */
  b(CVX+.45,CVX+1.05,-15.75,-15.25);                             /* 성형 대박스 대차 */
  b(6.95,7.65,-12.65,-11.15); b(6.95,7.65,-10.2,-8.7);           /* 자재 적재 */
  return L;
}
let FP_OBS=null;
/* 서 있을 수 있는 발 높이 후보 */
function fpSupports(x,z){
  const out=[], F=FL;
  const inFill=x>RM.fill.x0+FP_R&&x<RM.fill.x1-FP_R&&z>RM.fill.z0+FP_R&&z<RM.fill.z1-FP_R;
  const inPack=x>RM.pack.x0+FP_R&&x<RM.pack.x1-FP_R&&z>RM.pack.z0+FP_R&&z<RM.pack.z1-FP_R;
  let floor=(inFill||inPack)&&!FP_OBS.some(r=>inR(x,z,r,FP_R));
  if(floor&&inFill&&x>STR.x0-FP_R&&x<STR.x1&&z>STR.z0-FP_R&&z<STR.z1+FP_R&&STAIRY(x)>.26) floor=false;   /* 계단 밑 */
  if(floor) out.push(0);
  if(x>=STR.x0-.04&&x<=STR.x1+.06&&z>STR.z0+.15&&z<STR.z1-.15) out.push(STAIRY(x));                   /* 계단 발판 */
  const m=.15, xw=F.x0-F.ext;
  const onDeck=x>xw+m&&z>F.z0+m&&z<F.z1-m&&(x<F.x1-m||(z>STR.z0+.15&&z<STR.z1-.15&&x<F.x1+.04));
  if(onDeck&&!inR(x,z,[FM.xf-.66,FM.xf+.66,F.zc-.45,F.zc+.45],FP_R)) out.push(F.deckY);                    /* 데크 (호퍼 · 도징부 제외) */
  return out;
}
function fpPick(x,z){ let best=null, d=Infinity; for(const y of fpSupports(x,z)){ const e=Math.abs(y-FP.feet); if(e<d){ d=e; best=y; } } return d<=STEP_UP?best:null; }
function fpCanStand(x,z){ return fpPick(x,z)!=null; }
function fpEyeY(pose,moved,dt){
  const y=fpPick(pose.x,pose.z); if(y!=null) FP.feet=y;
  if(moved>0){ FP.bob+=moved/.62*Math.PI; FP.bobA=Math.min(1,FP.bobA+dt*6); } else FP.bobA=Math.max(0,FP.bobA-dt*4);
  return FP.feet+EYE+Math.sin(FP.bob*2)*.011*FP.bobA;
}

/* ── 설비 화면 (anchors.js FP_MON) ── */
const FP_DOM={w:460, h:700};
function monRect(m){ const w=m.w, h=w*FP_DOM.h/FP_DOM.w, n=m.n, r=[n[2],0,-n[0]];   /* r : 화면을 마주볼 때 오른쪽 */
  const P=(a,b)=>[m.c[0]+r[0]*a+n[0]*.004, m.c[1]+b, m.c[2]+r[2]*a+n[2]*.004];
  return {w,h,TL:P(-w/2,h/2),TR:P(w/2,h/2),BR:P(w/2,-h/2),BL:P(-w/2,-h/2)}; }
function monPose(m){ const r=monRect(m), focal=.78, d=r.h*1.08*focal; return {x:m.c[0]+m.n[0]*d, y:m.c[1], z:m.c[2]+m.n[2]*d, yaw:Math.atan2(m.n[0],m.n[2]), pitch:0, focal}; }
const monOf=k=>Object.values(FP_MON).find(m=>m.k.includes(k));

/* ── 조작 대상 ── */
const TB=(id,name,p,w,h,d,run,sels,o)=>Object.assign({id,name,x:p[0],y:p[1],z:p[2],w,h,d,run,sels},o||{});
const tileRun=id=>()=>TILE[id].click();
function fpTargetDefs(){
  const f=S.f, T=[], A=ANC;
  const add=(...a)=>T.push(TB(...a));
  if(S.room==="F"){
    add("fMain","메인 파워 스위치",A.mainPow,.3,.3,.3,tileRun("fMain"),["#fMain"]);
    add("fAir1","압축공기 밸브 1",A.air1,.22,.26,.22,tileRun("fAir1"),["#fAir1"]);
    add("fAir2","압축공기 밸브 2",A.air2,.22,.26,.22,tileRun("fAir2"),["#fAir2"]);
    add("fDust","집진 밸브 (2층)",A.dust,.35,.35,.35,tileRun("fDust"),["#fDust"]);
    add("fPanel","컨트롤 판넬 전원 스위치",A.panelSw,.16,.2,.4,tileRun("fPanel"),["#fPanel"]);
    add("fDoor","안전도어",A.door,.12,.8,.7,tileRun("fDoor"),["#fDoor"]);
    add("mLift","리프터 · 주성분 STS 용기",f.mainLift?A.liftUse:A.lift,.8,1.0,.8,tileRun("mLift"),["#mLift"]);
    add("mScoop","2번 호퍼 (주성분 스쿱 공급)",A.hop2,.5,.6,.5,tileRun("mScoop"),["#mScoop"]);
    add("roller","은박 롤러",A.roll,.6,.5,.9,()=>{ if(f.rollCarry==="red") TILE.mRed.click(); else if(f.roll==="red") TILE.mRollOut.click(); else TILE.mPlain.click(); },
      ()=>f.rollCarry==="red"?["#mRed"]:f.roll==="red"?["#mRollOut"]:["#mPlain"]);
    add("redPal","적색 인쇄 은박 롤 (예비 은박)",A.redPal,1.0,.5,.45,tileRun("mRed"),()=>f.rollCarry!=="red"?["#mRed"]:[],{visible:f.roll!=="red"&&f.rollCarry!=="red"});
    add("plainPal","무지 은박 롤 (예비 은박)",A.plainPal,1.0,.5,.45,tileRun("mPlain"),["#mPlain"],{visible:f.roll!=="plain"});
    add("mPrn","은박 프린터",A.prn,.35,.4,.5,tileRun("mPrn"),["#mPrn"]);
    add("tLeak","기밀도 시험대",A.leak,.6,.3,.9,tileRun("tLeak"),["#tLeak"]);
    add("ipc","IPC 저울 (채취 · 계량)",A.ipc,.6,.3,.9,()=>{ const h=S.ipc.open&&ipcStep(); if(!h){ toast("지금은 공정검사 시점이 아닙니다."); return; }
      if(h.k==="take") ipcTake(); else if(h.k==="next") ipcNext(); else if(h.k==="done") ipcDone(); else toast(h.t); },["#ipcTake","#ipcNext","#ipcDone"],{visible:S.ipc.open});
    add("tDoc","문서 · 기록 게시판",A.docF,.06,.7,.9,tileRun("tDoc"),["#tDoc",'#listBox [data-doc']);
  }else{
    add("pCtMain","카토너 메인스위치",A.ctMain,.2,.25,.14,tileRun("pCtMain"),["#pCtMain"]);
    add("pSfSw","스틱공급장치 스위치",A.sfSw,.2,.25,.14,tileRun("pSfSw"),["#pSfSw"]);
    add("pCtAir","카토너 압축공기 밸브",A.ctAir,.2,.25,.14,tileRun("pCtAir"),["#pCtAir"]);
    add("pHm","핫멜트 유닛",A.hm,.4,.5,.4,tileRun("pHm"),["#pHm"]);
    add("pCw","중량선별기 전원 스위치",A.cwPow,.2,.2,.2,tileRun("pCw"),["#pCw"]);
    add("pXr","X-ray 주 전원",A.xrPow,.16,.2,.12,tileRun("pXr"),["#pXr"]);
    add("pXrKey","X선 키 스위치",A.xrKey,.16,.2,.12,tileRun("pXrKey"),["#pXrKey"]);
    add("pPr","케이스 프린터 전원",A.prPow,.3,.3,.3,tileRun("pPr"),["#pPr"]);
    add("pMag","카톤 매거진",A.mag,.4,.4,.5,tileRun("pMag"),["#pMag"]);
    add("pLeaf","설명서 공급장치",A.leaf,.4,.4,.4,tileRun("pLeaf"),["#pLeaf"]);
    add("pMagOut","매거진 자재 회수함",A.magOut,.3,.3,.3,tileRun("pMagOut"),["#pMagOut"]);
    add("pBin","불량 배출함",A.bin,.6,.5,.6,tileRun("pBin"),["#pBin"]);
    add("tDoc","문서 · 기록 게시판",A.docP,.06,.7,.9,tileRun("tDoc"),["#tDoc",'#listBox [data-doc']);
    add("tAlign","정렬컨베어 가동스위치",A.align,.2,.2,.16,tileRun("tAlign"),["#tAlign"]);
  }
  /* 설비 화면 */
  for(const [key,m] of Object.entries(FP_MON)){ if(!m.k.every(k=>HTABS[S.room].some(t=>t[0]===k))) continue;
    const r=monRect(m), ax=Math.abs(m.n[0])>.5; add("mon_"+key,m.nm+" · 화면",m.c,ax?.08:r.w,r.h,ax?r.w:.08,()=>{},[],{mon:key,hmiPose:monPose(m)}); }
  /* 점검 (라인 클리어런스 · 확인 단계) */
  const st=curStep(), rec=S.activeTrouble?recoveryStep():null;
  if(st&&!rec&&!S.ipc.open){
    let job=null, nm=null;
    if(st.lc!==undefined&&!S.clear.includes(st.lc)){ job=CLEAR[S.room][st.lc].job; nm="점검 : "+CLEAR[S.room][st.lc].t; }
    else if(st.chk){ const c=st.chk(); if(c){ job=c.job; nm="점검 : "+c.t; } }
    const J=job&&JOBS[job], q=J&&(J.reach||[J.stand[0],1.2,J.stand[1]]);
    if(q) add("chk",nm,q,.7,.7,.7,()=>$("#lcCheck").click(),["#lcCheck"]);
  }
  /* 현장 조치 (빨간 !) */
  if(rec&&rec.k==="fix"&&rec.f.fix) add("fix","현장 조치 : "+rec.t.replace(/\s*\(빨간 ! 누르기\)\.?/,""),rec.f.fix,.5,.5,.5,()=>{ if(!rec.f.act()) toast("다른 작업 중입니다."); },["#fixBtn"]);
  return T;
}
function fpGoalId(T){
  if(!S||!S.session||!S.session.active) return null;
  const sel=hintTarget(); if(!sel) return null;
  for(const t of T){ const s=typeof t.sels==="function"?t.sels():t.sels; if(s.some(x=>sel.indexOf(x)===0)) return t.id; }
  const mt=/data-mt="(\w+)"/.exec(sel); let k=mt?mt[1]:null;
  if(!k){ let el=null; try{ el=document.querySelector(sel); }catch(e){} if(el&&el.closest("#fpMon,#hmi,#panel")) k=hMach; }
  if(k){ const m=Object.entries(FP_MON).find(([,v])=>v.k.includes(k)); if(m) return "mon_"+m[0]; }
  return null;
}
let FP_T=[];
function fpTargets(){
  const T=fpTargetDefs(), g=(S.session&&(!isExam()||hintOn))?fpGoalId(T):null;
  for(const t of T){ t.goal=t.id===g; if(t.reach==null) t.reach=FP_REACH; }
  FP_T=T; return T;
}
/* 실 사이 벽(z = 0, 문 없음) · 설비 화면 뒷면 가림 */
function fpOccluded(pose,t){
  if(pose.z*t.z<0) return true;
  if(t.mon){ const m=FP_MON[t.mon]; if((pose.x-m.c[0])*m.n[0]+(pose.z-m.c[2])*m.n[2]<.02) return true; }
  return false;
}

/* ── 설비 화면 DOM : 3D 모니터에 투영 ── */
function fpMonEl(){ return $("#fpMon"); }
function fpMoveHMI(into){
  const w=fpMonEl(), hmi=$("#hmi"), pn=$("#panel");
  if(into){ if(hmi.parentNode!==w){ w.append(hmi,pn); } w.hidden=false; $("#main").classList.add("fpMode"); }
  else { if(hmi.parentNode===w){ $("#hmiWrap").append(hmi); $("#hmiWrap").parentNode.append(pn); } w.hidden=true; $("#main").classList.remove("fpMode"); }
}
function fpPlaceMonitor(){
  const w=fpMonEl(); if(!w||w.hidden) return;
  const key=FP.monK||(monOf(hMach)&&Object.keys(FP_MON).find(k=>FP_MON[k]===monOf(hMach)));
  const m=key&&FP_MON[key]; if(!m){ w.style.visibility="hidden"; return; }
  const r=monRect(m), e=R3.eye, K=R3.W/Math.max(1,$("#view3d").clientWidth);
  const far=Math.hypot(e[0]-m.c[0],e[2]-m.c[2])>7, back=(e[0]-m.c[0])*m.n[0]+(e[2]-m.c[2])*m.n[2]<.02, other=e[2]*m.c[2]<0;
  if(far||back||other){ placeIDTMonitor(w,null); return; }
  const P=[r.TL,r.TR,r.BR,r.BL].map(q=>prj(q[0],q[1],q[2]));
  if(P.some(q=>!q||q.w<.03)){ placeIDTMonitor(w,null); return; }
  placeIDTMonitor(w,P.map(q=>({x:q.x/K,y:q.y/K})),FP_DOM.w,FP_DOM.h);
}
function fpHmiInteractive(on,t){
  const w=fpMonEl(); w.style.pointerEvents=on?"auto":"none"; w.classList.toggle("live",!!on);
  if(!on){ if(document.activeElement&&w.contains(document.activeElement)) document.activeElement.blur(); FP.monK=null; FPMON=null; drawHMI(); }
}

/* ── 단축키 · 안내 ── */
function fpHint(){ if(isExam()){ if(!hintOn) $("#examHint").click(); return; } const st=curStep(); toast(S.activeTrouble?recoveryStep()?.t||"":st?st.t:""); }
function fpHelp(){ FP.help=!FP.help; $("#fpHelp").hidden=!FP.help; }
function fpMenu(){
  $("#listBox").innerHTML='<h2>⏸ 메뉴</h2><p>1인칭 교육을 잠시 멈췄습니다.</p>'+
    '<div class="row"><b>교육 계속<s>Esc</s></b><button id="fmGo">계속</button></div>'+
    '<div class="row"><b>3인칭(전체 보기)으로 전환<s>설비 화면 · 타일을 마우스로 조작</s></b><button id="fm3">전환</button></div>'+
    (isExam()?'':'<div class="row"><b>이상사례 발생<s>학습모드</s></b><button id="fmCase">열기</button></div>'+'<div class="row"><b>알람 발생<s>학습모드</s></b><button id="fmAlm">열기</button></div>')+
    '<div class="row"><b>조작 도움말<s>H</s></b><button id="fmHelp">보기</button></div>'+
    '<div class="row"><b>메인화면<s>교육 중단</s></b><button id="fmHome">이동</button></div>';
  $("#mList").classList.add("on");
  const close=()=>$("#mList").classList.remove("on");
  $("#fmGo").onclick=close; $("#fm3").onclick=()=>{ close(); fpSet(false); };
  if($("#fmCase")) $("#fmCase").onclick=()=>openList("case"); if($("#fmAlm")) $("#fmAlm").onclick=()=>openList("alarm");
  $("#fmHelp").onclick=()=>{ close(); fpHelp(); }; $("#fmHome").onclick=()=>{ close(); goHome(); };
}
function fpReturnPart(){
  const f=S.f;
  if(f.rollCarry==="red"){ f.rollCarry=null; toast("적색 인쇄 은박 롤을 예비 은박 자리에 되돌려 놓았습니다."); after(); return; }
  toast("들고 있는 자재가 없습니다.");
}
const fpBusy=()=>!S||!S.session||!S.session.active||!$("#splash").classList.contains("hide")||$$(".modal.on").length>0;

function fpInit(){
  FP.mod=createIDTFirstPerson({canvas:$("#cv3d"), scene:$("#view3d"), speed:3.8, reach:FP_REACH,
    setCamera:p=>{ cam.fp=p; }, canStand:fpCanStand, eyeY:fpEyeY, targets:fpTargets,
    use:t=>{ t.run(); after(); }, occluded:fpOccluded, isBusy:fpBusy,
    hmiInteractive:(on,t)=>{ if(on&&t&&t.mon){ FP.monK=t.mon; FPMON=FP_MON[t.mon].k; if(!FPMON.includes(hMach)){ hMach=FPMON[0]; hScr=hMach==="fl"?"run":"main"; } drawHMI(); } fpHmiInteractive(on,t); },
    canOpenHMI:t=>{ const m=FP_MON[t.mon]; if(m&&!m.k.some(k=>machPower(k))){ toast(m.nm+" — 화면 꺼짐. "+powerHint(m.k[0]),"bad"); } return true; },
    hint:fpHint, showGuide:()=>!isExam()||hintOn, highlight:(g,a)=>{ FP.hl={goal:g,aim:a}; },
    returnPart:fpReturnPart, menu:fpMenu, help:fpHelp});
  $("#fpBtn").onclick=()=>fpSet(!FP.on);
}
function fpSpawn(){
  FP.feet=0;
  return S.room==="F"?{x:1.4, y:EYE, z:4.9, yaw:-.63, pitch:.1, focal:.78}:{x:4.4, y:EYE, z:-.9, yaw:.46, pitch:.1, focal:.78};
}
function fpSet(on){
  if(!FP.mod) return;
  if(on&&!(S&&S.session&&S.session.active)) return;
  FP.on=on; FP.want=on;
  FP_OBS=FP_OBS||fpObstacles();
  if(on){ if(typeof apStop==="function"&&AP.on) apStop(); fpMoveHMI(true); FP.mod.start(fpSpawnFrom()); }
  else { FP.mod.stop(); cam.fp=null; FPMON=null; fpMoveHMI(false); camSet(S&&S.room==="P"?"pack":"fill"); drawHMI(); }
  $("#fpBtn").textContent=on?"🎥 3인칭 보기":"🧍 1인칭";
  $("#fpBtn").classList.toggle("on",on);
  renderTiles();
}
let FP_LAST=null;
function fpSpawnFrom(){ if(FP_LAST&&FP_LAST.sess===S.session){ FP.feet=FP_LAST.feet; return Object.assign({},FP_LAST.pose); } return fpSpawn(); }
function fpFrame(now){
  if(FP.on&&FP.mod){ FP.mod.update(now); if(cam.fp) FP_LAST={sess:S.session,pose:Object.assign({},cam.fp),feet:FP.feet};
    const rec=S&&S.activeTrouble&&recoveryStep();
    if(rec&&rec.k==="ask"&&!fpBusy()&&FP.mod.mode==="walk") openIncidentAsk();
  }
}
function fpOverlay(g,K){
  if(!fpActive()) return;
  const edge=(t,col,lw)=>{ const xs=[t.x-t.w/2,t.x+t.w/2], ys=[t.y-t.h/2,t.y+t.h/2], zs=[t.z-t.d/2,t.z+t.d/2], P=[];
    for(const x of xs) for(const y of ys) for(const z of zs) P.push(prj(x,y,z));
    if(P.some(q=>!q)) return;
    const E2=[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
    g.lineWidth=lw*K; g.strokeStyle=col; g.beginPath(); for(const [a,b] of E2){ g.moveTo(P[a].x,P[a].y); g.lineTo(P[b].x,P[b].y); } g.stroke(); };
  const {goal,aim}=FP.hl;
  if(goal&&goal!==aim) edge(goal,"rgba(255,214,60,.95)",2.6);
  if(aim) edge(aim,aim===goal?"rgba(120,255,160,.98)":"rgba(255,255,255,.9)",2.2);
  const f=S.f, carry=f.rollCarry==="red"?"적색 인쇄 은박 롤 운반 중 (2인 1조) · R 반납":"";
  const lv=FP.feet>=FL.deckY-.05?"2층 데크":FP.feet>.05?"계단":"1층";
  g.textAlign="left"; g.textBaseline="alphabetic"; g.font="800 "+(12*K).toFixed(0)+"px sans-serif";
  const t="🧍 1인칭 · "+lv+(carry?" · "+carry:"")+"   WASD 이동 · 마우스 시선 · 좌클릭/E 조작 · Esc 화면 닫기 · F1 힌트 · Tab 메뉴 · H 도움말";
  const w=g.measureText(t).width+18*K; g.fillStyle="rgba(10,20,32,.62)"; rr(g,10*K,10*K,w,24*K,7*K); g.fill(); g.fillStyle="#fff"; g.fillText(t,19*K,27*K);
}
