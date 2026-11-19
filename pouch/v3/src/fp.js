/* ═══════════════════════════════════════════════════════════════════
   1인칭 연결 (새 3D · 단위 m) — 교육 시작 시 1인칭, 상단 버튼으로 3인칭 전환
   · 눈높이 1.55 m (작업자 키 약 1.70 m · 사용자 지적 11/15) · 이동 속도 3.8 m/s · 계단 · 2층 데크 높이를 따라 눈높이를 부드럽게 맞춤
   · 조작은 기존 타일 · 판넬 · 설비 화면 · 현장 조치 함수를 그대로 호출 (단계 · 인터락 판정 유지)
   · 설비 화면 DOM 은 장면의 실제 모니터 면(방향 포함)에 투영
   ═══════════════════════════════════════════════════════════════════ */
const FP={on:false, want:true, mod:null, feet:0, bob:0, bobA:0, hl:{goal:null,aim:null}, monK:null, help:false, crouch:false, ck:0};
const EYE=FPC.EYE/1000;   /* 1인칭 눈높이 1.55 m — 세 IDT 공통 값 (idt_common/fpctl.js) */
const CROUCH=FPC.CROUCH/1000, FP_R=.23, FP_REACH=1.9, STEP_UP=.42;
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
  b(F.bx1,F.bx1+.33,F.zc-.7,F.zc-.6);                            /* 인쇄 · 비전 제어 박스 (북쪽 면) */
  b(10.68,11.72,2.98,4.02);                                      /* 주성분 STS 파렛트 대기 (맨 동쪽 중앙) */
  b(F.x0-.62,F.x0-.37,F.bz0-.42,F.bz0+.18);                      /* 컨트롤 판넬 */
  for(const [x,z] of [[xw+.05,F.z0+.05],[xw+.05,F.z1-.05],[F.x0+.045,F.z0+.05],[F.x0+.045,F.z1-.05],[F.x1-.05,F.z0+.05],[F.x1-.05,F.z1-.05],[F.x0+.045,F.bz0-.07],[F.x0+.045,F.bz1+.07]]) b(x-.06,x+.06,z-.06,z+.06);
  b(CVX+.38,CVX+1.07,.38,1.25);                                  /* 프린터 컨트롤러 거치대 */
  b(6.17,7.33,.22,1.38); b(6.17,7.33,1.64,2.8);                  /* IBC 2 */
  b(COL.x0,COL.x1,COL.z0,COL.z1);                                /* 건물 기둥 */
  b(.1,.74,.23,1.27); b(.1,.74,1.38,2.42);                       /* 저울 작업대 2 */
  b(10.38,11.52,5.68,6.72);                                      /* 예비 은박 팔레트 (대차 · 드럼리프터는 propBlock) */
  b(RM.pier-.14,RM.pier+.14,0,.62); b(RM.pier-.14,RM.pier+.14,6.33,7);   /* 벽기둥 */
  b(7.42,7.82,.18,.52);                                          /* 수지 마개 */
  /* 포장실 : 라인 · 받침대 · 작업자 · 자재대 · 작업대 · 파렛트 · 성형 박스 대차 · 자재 */
  b(CVX-.62,CVX+.98,-9.15,-.2);                                  /* 스틱공급장치 ~ 배출함 */
  b(CVX-1.22,CVX+1.22,-11.05,-9.15);                             /* 대케이스 포장 : 받침대 · 작업자 2 · 자재대 */
  b(CVX-.5,CVX+.3,-12.25,-11.05);                                /* 검은 벨트 */
  b(CVX-.52,CVX+.52,-15.02,-12.25);                              /* 녹색 벨트 작업대 */
  b(CVX+.52,CVX+.92,-15.05,-13.9);                               /* 작업자 3 */
  b(CVX+1.2,CVX+2.3,-14.75,-13.65);                              /* 파렛트 */
  b(CVX+.3,CVX+1.2,-15.72,-15.28);                             /* 성형 대박스 대차 */
  b(6.95,7.65,-12.65,-11.15); b(6.95,7.65,-10.2,-8.7);           /* 자재 적재 */
  b(4.95,5.55,-3.42,-2.58);                                      /* 카톤 · 설명서 · 잉크 자재 대차 (11/17) */
  return L;
}
let FP_OBS=null;
/* 움직이는 대차 · 드럼리프터 (현재 놓인 자리 · 방향 기준) */
function propBlock(x,z){ if(typeof FILLCART==="undefined"||!FILLCART) return false;
  for(const [G,hx0,hx1,hz] of [[FILLCART,-.3,.24,.46],[FILLLIFT,-.92,.42,.38]]){ const c=Math.cos(G.rotation.y), s=Math.sin(G.rotation.y), dx=x-G.position.x, dz=z-G.position.z, lx=dx*c-dz*s, lz=dx*s+dz*c;
    if(lx>hx0-FP_R&&lx<hx1+FP_R&&lz>-hz-FP_R&&lz<hz+FP_R) return true; } return false; }
/* 서 있을 수 있는 발 높이 후보 */
function fpSupports(x,z){
  const out=[], F=FL;
  const inFill=x>RM.fill.x0+FP_R&&x<RM.fill.x1-FP_R&&z>RM.fill.z0+FP_R&&z<RM.fill.z1-FP_R;
  const inPack=x>RM.pack.x0+FP_R&&x<RM.pack.x1-FP_R&&z>RM.pack.z0+FP_R&&z<RM.pack.z1-FP_R;
  let floor=(inFill||inPack)&&!FP_OBS.some(r=>inR(x,z,r,FP_R))&&!propBlock(x,z);
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
  fpcTick(dt); FP.crouch=FPC.crouch; FP.ck=FPC.ck;                       /* 앉기 (C) : 눈높이 1.55 → 1.00 m */
  return FP.feet+EYE-CROUCH*FP.ck+Math.sin(FP.bob*2)*.011*FP.bobA*(1-FP.ck*.6);
}

/* ── 설비 화면 (anchors.js FP_MON) ── */
const FP_DOM={w:460, h:700};
function monRect(m){ const D=m.dom||FP_DOM, h=m.h, w=m.w||h*D.w/D.h, n=m.n, r=[n[2],0,-n[0]];   /* r : 화면을 마주볼 때 오른쪽 */
  const P=(a,b)=>[m.c[0]+r[0]*a+n[0]*.004, m.c[1]+b, m.c[2]+r[2]*a+n[2]*.004];
  return {w,h,TL:P(-w/2,h/2),TR:P(w/2,h/2),BR:P(w/2,-h/2),BL:P(-w/2,-h/2)}; }
function monPose(m){ const r=monRect(m), focal=FPC.FOCAL, d=r.h*1.08*focal; return {x:m.c[0]+m.n[0]*d, y:m.c[1], z:m.c[2]+m.n[2]*d, yaw:Math.atan2(m.n[0],m.n[2]), pitch:0, focal}; }
const monOf=k=>Object.values(FP_MON).find(m=>m.k.includes(k));

/* ── 조작 대상 ── */
const TB=(id,name,p,w,h,d,run,sels,o)=>Object.assign({id,name,x:p[0],y:p[1],z:p[2],w,h,d,run,sels},o||{});
const tileRun=id=>()=>TILE[id].click();
function fpTargetDefs(){
  const f=S.f, T=[], A=ANC;
  const add=(...a)=>T.push(TB(...a));
  if(S.room==="F"){
    add("fMain","메인스위치 (회전 절연 스위치)",A.mainPow,.22,.22,.22,tileRun("fMain"),["#fMain"]);
    if(S.room==="F"&&typeof dialOpen==="function"){ add("dialF","첨가제 함량조절다이얼 (서쪽 · 전면)",A.dialF,.12,.2,.95,()=>startWork("dialF",()=>dialOpen("F")),[]); add("dialB","주성분 · 백당 함량조절다이얼 (동쪽 · 후면)",A.dialB,.12,.22,.95,()=>startWork("dialB",()=>dialOpen("B")),[]); }   /* 충전량 조절 미니게임 (11/16) */
    add("fAir1","압축공기 밸브 1",A.air1,.22,.26,.22,tileRun("fAir1"),["#fAir1"]);
    add("fAir2","압축공기 밸브 2",A.air2,.22,.26,.22,tileRun("fAir2"),["#fAir2"]);
    add("fDust","집진 밸브 (2층)",A.dust,.35,.35,.35,tileRun("fDust"),["#fDust"]);
    add("fPanel","컨트롤 판넬 전원 스위치",A.panelSw,.16,.2,.4,tileRun("fPanel"),["#fPanel"]);
    { const px=FL.x0-.42-.205, pz=FL.bz0-.12, pb=(id,nm,dz,y)=>add("pb_"+id,"판넬 버튼 · "+nm,[px,y,pz+dz],.05,.05,.05,()=>fpPress("fl",id),["#"+id]);   /* 컨트롤 판넬 실제 버튼 (11/16 : 버튼 판 팝업 없음) */
      pb("swRun","RUN",-.18,1.27); pb("swStop","STOP",-.06,1.27); pb("swJog","JOG",.06,1.27); pb("swReset","RESET",-.18,1.15); pb("swFill","FILLING",-.06,1.15); pb("swBuz","BUZZER",.06,1.15); pb("swEmg","EMERGENCY (비상정지)",.19,1.2); }
    add("fDoor","안전도어",A.door,.12,.8,.7,tileRun("fDoor"),["#fDoor"]);
    add("mLift","리프터 · 주성분 STS 용기",f.mainLift?A.liftUse:A.lift,.8,1.0,.8,tileRun("mLift"),["#mLift"]);
    add("mScoop","2번 호퍼 (주성분 스쿱 공급)",A.hop2,.5,.6,.5,tileRun("mScoop"),["#mScoop"]);
    add("roller","은박 롤러",A.roll,.6,.5,.9,()=>{ if(f.rollCarry==="red") TILE.mRed.click(); else if(f.roll==="red") TILE.mRollOut.click(); else TILE.mPlain.click(); },
      ()=>f.rollCarry==="red"?["#mRed"]:f.roll==="red"?["#mRollOut"]:["#mPlain"]);
    add("redPal","적색 인쇄 은박 롤 (예비 은박)",A.redPal,1.0,.5,.45,tileRun("mRed"),()=>f.rollCarry!=="red"?["#mRed"]:[],{visible:f.roll!=="red"&&f.rollCarry!=="red"});
    add("plainPal","무지 은박 롤 (예비 은박)",A.plainPal,1.0,.5,.45,tileRun("mPlain"),["#mPlain"],{visible:f.roll!=="plain"});
    add("mPrn","은박 프린터",A.prn,.35,.4,.5,tileRun("mPrn"),["#mPrn"]);
    { const mg=typeof htxMon==="function"?htxMon("fp"):FP_MON.fp; add("fpCtl","인쇄기 컨트롤러 (제조번호 · 사용기한 입력)",[CVX+.725,1.2,.93],.65,.4,.08,()=>{},[],{mon:"fp",hmiPose:monPose(mg)}); }   /* 누르면 위 모니터 화면으로 (11/17) */
    if(TILE.fRib) add("fRib","은박 프린터 리본 교체",[A.prn[0],A.prn[1]-.22,A.prn[2]],.3,.16,.4,tileRun("fRib"),["#fRib"]);   /* 리본 교체 (11/17) */
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
    if(TILE.pInk) add("pInk","케이스 프린터 잉크 교체",A.prHead,.25,.25,.25,tileRun("pInk"),["#pInk"]);   /* 잉크 교체 (11/17) */
    add("pMag","카톤 매거진",A.mag,.4,.4,.5,tileRun("pMag"),["#pMag"]);
    add("pLeaf","설명서 공급장치",A.leaf,.4,.4,.4,tileRun("pLeaf"),["#pLeaf"]);
    add("pMagOut","매거진 자재 회수함",A.magOut,.3,.3,.3,tileRun("pMagOut"),["#pMagOut"]);
    add("pBin","불량 배출함",A.bin,.6,.5,.6,tileRun("pBin"),["#pBin"]);
    add("tDoc","문서 · 기록 게시판",A.docP,.06,.7,.9,tileRun("tDoc"),["#tDoc",'#listBox [data-doc']);
    add("tAlign","정렬컨베어 가동스위치",A.align,.2,.2,.16,tileRun("tAlign"),["#tAlign"]);
    for(const P of (PB.panels||[])){ const W=(lx,lz)=>{ const v=P.G.localToWorld(new T3.Vector3(lx,-.08,lz)); return [v.x,v.y,v.z]; }, nm=P.mk==="sf"?"스틱공급장치":"카토너";   /* 판넬 실제 버튼 */
      add("pb_"+P.mk+"Start",nm+" 버튼 · START",W(.068,.02),.05,.05,.05,()=>fpPress(P.mk,P.mk+"Start"),["#"+P.mk+"Start"]);
      add("pb_"+P.mk+"Stop",nm+" 버튼 · STOP",W(.068,-.05),.05,.05,.05,()=>fpPress(P.mk,P.mk+"Stop"),["#"+P.mk+"Stop"]);
      add("pb_"+P.mk+"Reset",nm+" 버튼 · RESET",W(.068,-.12),.05,.05,.05,()=>fpPress(P.mk,P.mk+"Reset"),["#"+P.mk+"Reset"]);
      add("pb_"+P.mk+"Emg",nm+" 비상정지",W(.072,.13),.06,.06,.06,()=>fpPress(P.mk,"swEmg"),[]); }
  }
  /* 설비 화면 */
  for(const [key,m] of Object.entries(FP_MON)){ if(!m.k.every(k=>HTABS[S.room].some(t=>t[0]===k))) continue;
    const r=monRect(m), ax=Math.abs(m.n[0])>.5; const mg=typeof htxMon==="function"?htxMon(key):m; add("mon_"+key,m.nm+" · 화면",m.c,ax?.08:r.w,r.h,ax?r.w:.08,()=>{},[],{mon:key,hmiPose:monPose(mg)});   /* 누르면 유리면 앞으로 다가감 (확대) */ }
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
/* 공통 조작 표시(aimmark.js) 형식 : 중심 c · 크기 s (m) · 조작 지점 pt */
const fpAM=t=>t&&{id:t.id, name:t.name, c:[t.x,t.y,t.z], s:[t.w,t.h,t.d], pt:t.pt, reachMax:t.reachMax};
function fpTargets(){
  const T=fpTargetDefs(), g=(S.session&&(!isExam()||hintOn))?fpGoalId(T):null;
  for(const t of T){ t.goal=t.id===g; }   /* 조준 = 보이는 거리 6 m · 조작 = 손 닿는 거리 1.2 m (공통 aimmark.js · 11/17) */
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
  if(!FP.mod||FP.mod.mode!=="hmi"){ w.style.visibility="hidden"; return; }   /* 걸어 다닐 때는 3D 화면 그림(hmitex.js)만 · 누르고 다가간 뒤에만 조작 화면 (11/16) */
  const key=FP.monK||(monOf(hMach)&&Object.keys(FP_MON).find(k=>FP_MON[k]===monOf(hMach)));
  const m=key&&(typeof htxMon==="function"?htxMon(key):FP_MON[key]); if(!m){ w.style.visibility="hidden"; return; }   /* 유리면에 꼭 맞춤 (11/16) */
  w.classList.toggle("withPanel",m.k.includes("cw"));
  const r=monRect(m), e=R3.eye, K=R3.W/Math.max(1,$("#view3d").clientWidth);
  const far=Math.hypot(e[0]-m.c[0],e[2]-m.c[2])>7, back=(e[0]-m.c[0])*m.n[0]+(e[2]-m.c[2])*m.n[2]<.02, other=e[2]*m.c[2]<0;
  if(far||back||other){ placeIDTMonitor(w,null); return; }
  const P=[r.TL,r.TR,r.BR,r.BL].map(q=>prj(q[0],q[1],q[2]));
  if(P.some(q=>!q||q.w<.03)){ placeIDTMonitor(w,null); return; }
  const D=m.dom||FP_DOM; if(w.style.width!==D.w+"px"){ w.style.width=D.w+"px"; w.style.height=D.h+"px"; }
  placeIDTMonitor(w,P.map(q=>({x:q.x/K,y:q.y/K})),D.w,D.h);
}
function fpHmiInteractive(on,t){
  const w=fpMonEl(); w.style.pointerEvents=on?"auto":"none"; w.classList.toggle("live",!!on);
  if(!on){ if(document.activeElement&&w.contains(document.activeElement)) document.activeElement.blur(); FP.monK=null; FPMON=null; drawHMI(); }
}

/* ── 단축키 · 안내 ── */
function fpHint(){ if(isExam()){ if(!hintOn) $("#examHint").click(); return; } const st=curStep(); toast(S.activeTrouble?recoveryStep()?.t||"":st?st.t:""); }
function fpReturnPart(){
  const f=S.f;
  if(f.rollCarry==="red"){ f.rollCarry=null; toast("적색 인쇄 은박 롤을 예비 은박 자리에 되돌려 놓았습니다."); after(); return; }
  toast("들고 있는 자재가 없습니다.");
}
const fpBusy=()=>!S||!S.session||!S.session.active||!$("#splash").classList.contains("hide")||$$(".modal.on").length>0;

function fpInit(){
  FP.mod=createIDTFirstPerson({canvas:$("#cv3d"), scene:$("#view3d"), speed:FPC.WALK, reach:FP_REACH, look:AIM_LOOK,
    inReach:(t,p)=>aimInReach(fpAM(t),[p.x,p.y,p.z]), goalDist:(t,p)=>aimReachDist(fpAM(t),[p.x,p.y,p.z]),
    farText:(t,p)=>"가까이 가세요 · "+t.name+" ("+aimReachDist(fpAM(t),[p.x,p.y,p.z]).toFixed(1)+" m)",
    tooFar:(t,p)=>toast("가까이 가세요 — "+t.name+" ("+aimReachDist(fpAM(t),[p.x,p.y,p.z]).toFixed(1)+" m · 손 닿는 거리 1.2 m)"),
    setCamera:p=>{ cam.fp=p; }, canStand:fpCanStand, eyeY:fpEyeY, targets:fpTargets,
    use:t=>{ t.run(); after(); }, occluded:fpOccluded, isBusy:fpBusy,
    hmiInteractive:(on,t)=>{ if(on) toast("설비 화면 조작 중 — 시점 회전 잠금 · F 또는 Esc 로 뒤로"); if(on&&t&&t.mon){ FP.monK=t.mon; FPMON=FP_MON[t.mon].k; if(!FPMON.includes(hMach)){ hMach=FPMON[0]; hScr=hMach==="fl"?"run":"main"; } drawHMI(); } fpHmiInteractive(on,t); },
    canOpenHMI:t=>{ const m=FP_MON[t.mon]; if(m&&!m.k.some(k=>machPower(k))){ toast(m.nm+" — 화면 꺼짐. "+powerHint(m.k[0]),"bad"); } return true; },
    hint:fpHint, showGuide:()=>!isExam()||hintOn, highlight:(g,a)=>{ FP.hl={goal:g,aim:a}; },
    returnPart:fpReturnPart});
  $("#fpBtn").onclick=()=>fpSet(!FP.on);
  /* C 앉기 · F1 힌트 · H 도움말 · Tab 메뉴 = 세 IDT 공통 (idt_common/fpctl.js) */
  fpcInit({isFP:()=>FP.on&&!!FP.mod&&FP.mod.mode==="walk"&&!fpBusy(), hint:fpHint, toast:t=>toast(t), third:()=>fpSet(false), home:()=>goHome(),
    extra:[["R · 우클릭","들고 있는 자재 되돌리기"],["계단","2층 데크 오르내림 (W A S D)"]]});
}
function fpSpawn(){
  FP.feet=0;
  return S.room==="F"?{x:1.4, y:EYE, z:4.9, yaw:-.63, pitch:.1, focal:FPC.FOCAL}:{x:4.4, y:EYE, z:-.9, yaw:.46, pitch:.1, focal:FPC.FOCAL};
}
function fpSet(on){
  if(!FP.mod) return;
  if(on&&!(S&&S.session&&S.session.active)) return;
  FP.on=on; FP.want=on;
  FP_OBS=FP_OBS||fpObstacles();
  if(on){ if(typeof apStop==="function"&&AP.on) apStop(); fpMoveHMI(true); FP.mod.start(fpSpawnFrom()); }
  else { FP.mod.stop(); cam.fp=null; FPMON=null; fpMoveHMI(false); camSet(S&&S.room==="P"?"pack":"fill"); drawHMI(); }
  $("#fpBtn").textContent=on?"🧍 1인칭 → 3인칭 전환":"🎥 3인칭 → 1인칭 전환";   /* 현재 시점 + 전환 표기 (11/16 사용자 선택) */
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
  /* 대상 상자 테두리는 그리지 않음 — 조작 지점 마커(guide.js · aimmark.js)로 표시 (11/17 사용자 결정) */
  const f=S.f, carry=f.rollCarry==="red"?"적색 인쇄 은박 롤 운반 중 (2인 1조) · R 반납":"";
  const lv=FP.feet>=FL.deckY-.05?"2층 데크":FP.feet>.05?"계단":"1층";
  g.textAlign="left"; g.textBaseline="alphabetic"; g.font="800 "+(12*K).toFixed(0)+"px sans-serif";
  const t="🧍 1인칭 · "+lv+(FP.crouch?" · 앉음":"")+(carry?" · "+carry:"")+"   WASD · 방향키 이동 (Shift 빠르게) · 마우스 시선 · 좌클릭/E 조작 · C 앉기 · Esc 화면 닫기 · F1 힌트 · Tab 메뉴 · H 도움말";
  const w=g.measureText(t).width+18*K; g.fillStyle="rgba(10,20,32,.62)"; rr(g,10*K,10*K,w,24*K,7*K); g.fill(); g.fillStyle="#fff"; g.fillText(t,19*K,27*K);
}

/* 실제 판넬 버튼 누르기 : 해당 설비의 버튼 동작 그대로 (화면에 버튼 판을 띄우지 않음) */
function fpPress(mk,id){ if(hMach!==mk){ hMach=mk; hScr=mk==="fl"?"run":"main"; drawHMI(); } const e=$("#"+id); if(e) e.click(); else toast("이 설비에는 해당 버튼이 없습니다."); }
/* 실제 판넬 버튼 위치 (노란 화살표 안내용) */
function fpBtnPos(id){
  const FLB={swRun:[-.18,1.27],swStop:[-.06,1.27],swJog:[.06,1.27],swReset:[-.18,1.15],swFill:[-.06,1.15],swBuz:[.06,1.15],swEmg:[.19,1.2]};
  if(FLB[id]&&(S.room==="F"||hMach==="fl")) return [FL.x0-.42-.205,FLB[id][1],FL.bz0-.12+FLB[id][0]];
  const m=id.match(/^(sf|ct)(Start|Stop|Reset)$/)||(id==="swEmg"&&(hMach==="sf"||hMach==="ct")?[0,hMach,"Emg"]:null); if(!m) return null;
  const P=(PB.panels||[]).find(q=>q.mk===m[1]); if(!P) return null; const lz={Start:.02,Stop:-.05,Reset:-.12,Emg:.13}[m[2]], v=P.G.localToWorld(new T3.Vector3(.07,-.08,lz)); return [v.x,v.y,v.z];
}
