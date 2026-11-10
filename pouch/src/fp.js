/* ═══════════════════════════════════════════════════════════════════
   1인칭 연결 (파우치 IDT) — 교육 시작 시 1인칭, 상단 버튼으로 3인칭 전환
   · 단위 mm · 눈높이 1600 · 이동 속도 = 작업자 보행 속도(1900 mm/s) × 2
   · 조작은 기존 타일 · 판넬 · 설비 화면 · 현장 조치 함수를 그대로 호출 (단계 · 인터락 판정 유지)
   · 1인칭 중에는 작업자 캐릭터 없이 즉시 반영 (사용자 선택 11/10)
   ═══════════════════════════════════════════════════════════════════ */
const FP={on:false, want:true, mod:null, feet:0, bob:0, bobA:0, hl:{goal:null,aim:null}, monK:null, help:false};
const EYE=1600, FP_R=230, FP_REACH=1900, STEP_UP=420;
const FPX={redPal:[ROLL.x+1150,-2820], plainPal:[ROLL.x-1150,-2820], ipc:[-7900,1350], leak:[-3500,1380],
  docF:[ROOM.x0+12,1450,1500], docP:[ROOM.wall+ROOM.wallT/2+12,1450,1250]};
const fpActive=()=>!!(FP.on&&cam.fp);

/* ── 바닥 장애물 (설비 외곽 · 받침 · 소품) : [x0,x1,z0,z1] ── */
function fpObstacles(){
  const D=DECK, L=[], b=(x0,x1,z0,z1)=>L.push([x0,x1,z0,z1]);
  b(FIL.x0,FIL.x1,FIL.z0-260,FIL.z1);                                          /* 충전기 본체 · 후면 프린터 */
  b(-6420,ROOM.wall,CV.z-110,CV.z+110);                                       /* 정렬컨베어 (경사 구간 포함) */
  b(FIL.x0-1010,FIL.x0-710,CV.z+170,CV.z+490);                                /* 공포배출 컨베이어 */
  b(PANEL_F.x-340,PANEL_F.x+340,PANEL_F.z-80,PANEL_F.z+80);                  /* 컨트롤 판넬 */
  for(const x of [D.x0+50,D.x1-50]) for(const z of [D.z0+50,D.zF-50,D.z1-50]) b(x-70,x+70,z-70,z+70);   /* 데크 기둥 */
  for(const q of IBC) b(q.x-450,q.x+450,q.z-450,q.z+450);                     /* IBC */
  b(LIFT.x-520,LIFT.x+520,LIFT.z-520,LIFT.z+520);                             /* 리프터 */
  b(ROLL.x-520,ROLL.x+520,ROLL.z-260,ROLL.z+260);                             /* 은박 롤 거치대 */
  b(-7420,-7180,-1300,-1060);                                                  /* 압축공기 밸브 스탠드 */
  for(const k of ["redPal","plainPal"]) b(FPX[k][0]-500,FPX[k][0]+500,FPX[k][1]-400,FPX[k][1]+400);
  b(FPX.ipc[0]-400,FPX.ipc[0]+400,FPX.ipc[1]-250,FPX.ipc[1]+250);
  b(FPX.leak[0]-350,FPX.leak[0]+350,FPX.leak[1]-250,FPX.leak[1]+250);
  /* 포장실 */
  b(FEED.x0,FEED.x1,FEED.z0,FEED.z1+40); b(CT.x0,CT.x1,CT.z0,CT.z1+60); b(HM.x-320,HM.x+320,HM.z-320,HM.z+320);
  b(PR.x0,PR.x1,-470,470); b(XR.x0,XR.x1,-620,560); b(CW.x0,CW.x1,-520,520); b(OUT.x0,OUT.x1,-320,320);
  b(BIN.x-320,BIN.x+320,-800,800); b(PACK.x0,PACK.x1,PACK.z0,PACK.z1);
  return L;
}
let FP_OBS=null;
const inR=(x,z,r,m)=>x>r[0]-m&&x<r[1]+m&&z>r[2]-m&&z<r[3]+m;
/* 서 있을 수 있는 높이 후보 (발 높이) */
function fpSupports(x,z){
  const S2=[], D=DECK, St=STAIR;
  /* 1층 바닥 */
  let floor=x>ROOM.x0+FP_R&&x<ROOM.x1-FP_R&&z>ROOM.back+FP_R&&z<ROOM.front-FP_R;
  const W=ROOM.wall, t=ROOM.wallT/2+FP_R;
  if(floor&&x>W-t&&x<W+t&&!(z>DOORW.z0+FP_R&&z<DOORW.z1-FP_R)) floor=false;
  if(floor&&FP_OBS.some(r=>inR(x,z,r,FP_R))) floor=false;
  if(floor&&x>St.xTop-FP_R&&x<St.xBot&&z>St.z0-FP_R&&z<St.z1+FP_R&&stairY(x)>260) floor=false;   /* 계단 아래 */
  if(floor) S2.push(0);
  /* 계단 (발판 폭 안쪽) */
  if(x>=St.xTop-40&&x<=St.xBot+60&&z>St.z0+150&&z<St.z1-150) S2.push(stairY(x));
  /* 2층 데크 (난간 안쪽 · 호퍼 베이스 제외 · 계단 개구부 연결) */
  const m=150, onDeck=x>D.x0+m&&z>D.z0+m&&z<D.z1-m&&(x<D.x1-m||(z>St.z0+150&&z<St.z1-150&&x<D.x1+40));
  if(onDeck&&!inR(x,z,[FIL.x0+60,FIL.x1-60,FIL.z0+60,FIL.z1-40],FP_R)) S2.push(D.y);
  return S2;
}
function fpPick(x,z){ let best=null, d=Infinity; for(const y of fpSupports(x,z)){ const e=Math.abs(y-FP.feet); if(e<d){ d=e; best=y; } } return d<=STEP_UP?best:null; }
function fpCanStand(x,z){ return fpPick(x,z)!=null; }
function fpEyeY(pose,moved,dt){
  const y=fpPick(pose.x,pose.z); if(y!=null) FP.feet=y;
  if(moved>0){ FP.bob+=moved/620*Math.PI; FP.bobA=Math.min(1,FP.bobA+dt*6); } else FP.bobA=Math.max(0,FP.bobA-dt*4);
  return FP.feet+EYE+Math.sin(FP.bob*2)*11*FP.bobA;
}

/* ── 설비 화면 (모니터 면 : +z 방향) ── */
const FP_MON={
  fl:{k:["fl"], nm:"충전기 컨트롤 판넬", c:[PANEL_F.x,1620,PANEL_F.z+72], w:520},
  sf:{k:["sf"], nm:"스틱공급장치 판넬", c:[FEED.x0+120,1460,FEED.z1+66], w:260},
  ct:{k:["ct"], nm:"카토너 판넬 (LS)", c:[CT.x1-290,PK.y+700,CT.z1+86], w:240},
  pr:{k:["pr","vs"], nm:"케이스 프린터 · 비전 화면", c:[(PR.x0+PR.x1)/2,1820,-254], w:420},
  xr:{k:["xr"], nm:"X-ray 조작 화면", c:[(XR.x0+XR.x1)/2,1550,526], w:460},
  cw:{k:["cw"], nm:"중량선별기 조작화면", c:[(CW.x0+CW.x1)/2,1500,-244], w:380}
};
const FP_DOM={w:460, h:700};          /* 모니터에 붙이는 HMI 묶음 (설비 화면 + 조작반) CSS 크기 */
function monRect(m){ const w=m.w*1.0, h=w*FP_DOM.h/FP_DOM.w; return {x0:m.c[0]-w/2,x1:m.c[0]+w/2,y0:m.c[1]-h/2,y1:m.c[1]+h/2,z:m.c[2],w,h}; }
function monPose(m){ const r=monRect(m), focal=0.78, d=r.h*1.08*focal; return {x:m.c[0], y:m.c[1], z:m.c[2]+d, yaw:0, pitch:0, focal}; }
const monOf=k=>Object.values(FP_MON).find(m=>m.k.includes(k));

/* ── 조작 대상 ── */
const TB=(id,name,p,w,h,d,run,sels,o)=>Object.assign({id,name,x:p[0],y:p[1],z:p[2],w,h,d,run,sels},o||{});
const tileRun=id=>()=>TILE[id].click();
function fpTargetDefs(){
  const f=S.f, p=S.p, T=[];
  const add=(...a)=>T.push(TB(...a));
  if(S.room==="F"){
    add("fMain","메인 파워 스위치",[FIL.x0-20,1250,FIL.z1-120],260,320,260,tileRun("fMain"),["#fMain"]);
    add("fAir1","압축공기 밸브 1",[-7380,1350,-1180],220,260,260,tileRun("fAir1"),["#fAir1"]);
    add("fAir2","압축공기 밸브 2",[-7220,1350,-1180],220,260,260,tileRun("fAir2"),["#fAir2"]);
    add("fDust","집진 밸브 (2층)",[FIL.x1+250,DECK.y+850,-1500],300,320,300,tileRun("fDust"),["#fDust"]);
    add("fPanel","컨트롤 판넬 전원 스위치",[PANEL_F.x+300,1180,PANEL_F.z+75],160,220,120,tileRun("fPanel"),["#fPanel"]);
    add("fDoor","안전도어",[FIL.xc-300,1500,FIL.z1+25],700,800,120,tileRun("fDoor"),["#fDoor"]);
    add("mLift","리프터 · 주성분 STS 용기",[LIFT.x,700,LIFT.z],700,900,700,tileRun("mLift"),["#mLift"]);
    add("mScoop","2번 호퍼 (주성분 스쿱 공급)",[FIL.xc+150,DECK.y+1150,-270],520,700,520,tileRun("mScoop"),["#mScoop"]);
    add("roller","은박 롤러",[ROLL.x,ROLL.y,ROLL.z],900,600,500,()=>{ if(f.rollCarry==="red") TILE.mRed.click(); else if(f.roll==="red") TILE.mRollOut.click(); else TILE.mPlain.click(); },
      ()=>f.rollCarry==="red"?["#mRed"]:f.roll==="red"?["#mRollOut"]:["#mPlain"]);
    add("redPal","적색 인쇄 은박 롤 (팔레트)",[FPX.redPal[0],420,FPX.redPal[1]],900,560,700,tileRun("mRed"),()=>f.rollCarry!=="red"?["#mRed"]:[],{visible:f.roll!=="red"&&f.rollCarry!=="red"});
    add("plainPal","무지 은박 롤 (팔레트)",[FPX.plainPal[0],420,FPX.plainPal[1]],900,560,700,tileRun("mPlain"),["#mPlain"],{visible:f.roll!=="plain"});
    add("mPrn","은박 프린터",[FIL.xc,1500,FIL.z0-180],600,400,300,tileRun("mPrn"),["#mPrn"]);
    add("tLeak","기밀도 시험대",[FPX.leak[0],1000,FPX.leak[1]],700,300,500,tileRun("tLeak"),["#tLeak"]);
    add("ipc","IPC 저울 (채취 · 계량)",[FPX.ipc[0],1000,FPX.ipc[1]],800,300,500,()=>{ const h=S.ipc.open&&ipcStep(); if(!h){ toast("지금은 공정검사 시점이 아닙니다."); return; }
      if(h.k==="take") ipcTake(); else if(h.k==="next") ipcNext(); else if(h.k==="done") ipcDone(); else toast(h.t); },["#ipcTake","#ipcNext","#ipcDone"],{visible:S.ipc.open});
    add("tDoc","문서 · 기록 게시판",FPX.docF,60,700,900,tileRun("tDoc"),["#tDoc",'#listBox [data-doc']);
  }else{
    const bx=CT.z0-40;
    add("pCtMain","카토너 메인스위치",[3000,1100,bx],260,300,200,tileRun("pCtMain"),["#pCtMain"]);
    add("pSfSw","스틱공급장치 스위치",[3400,1100,bx],260,300,200,tileRun("pSfSw"),["#pSfSw"]);
    add("pCtAir","카토너 압축공기 밸브",[3800,1100,bx],260,300,200,tileRun("pCtAir"),["#pCtAir"]);
    add("pHm","핫멜트 유닛",[HM.x,800,HM.z+220],600,600,300,tileRun("pHm"),["#pHm"]);
    add("pCw","중량선별기 전원 스위치",[(CW.x0+CW.x1)/2+215,1630,-240],200,200,200,tileRun("pCw"),["#pCw"]);
    add("pXr","X-ray 주 전원",[(XR.x0+XR.x1)/2+310,1330,580],200,220,160,tileRun("pXr"),["#pXr"]);
    add("pXrKey","X선 키 스위치",[(XR.x0+XR.x1)/2+460,1330,580],160,200,160,tileRun("pXrKey"),["#pXrKey"]);
    add("pPr","케이스 프린터 전원",[(PR.x0+PR.x1)/2,520,480],400,300,160,tileRun("pPr"),["#pPr"]);
    add("pMag","카톤 매거진",[3700,PK.y+500,bx],600,500,300,tileRun("pMag"),["#pMag"]);
    add("pLeaf","설명서 공급장치",[2600,PK.y+1000,bx+150],500,500,400,tileRun("pLeaf"),["#pLeaf"]);
    add("pMagOut","매거진 자재 회수함",[3150,PK.y+250,bx],400,400,300,tileRun("pMagOut"),["#pMagOut"]);
    add("pBin","불량 배출함",[BIN.x,600,0],600,500,1400,tileRun("pBin"),["#pBin"]);
    add("tDoc","문서 · 기록 게시판",FPX.docP,60,700,900,tileRun("tDoc"),["#tDoc",'#listBox [data-doc']);
  }
  add("tAlign","정렬컨베어 가동스위치",[FEED.x0+450,1130,FEED.z1+90],220,220,160,tileRun("tAlign"),["#tAlign"]);
  /* 설비 화면 */
  for(const [key,m] of Object.entries(FP_MON)){ if(!m.k.every(k=>HTABS[S.room].some(t=>t[0]===k))) continue;
    const r=monRect(m); add("mon_"+key,m.nm+" · 화면",[m.c[0],m.c[1],m.c[2]],r.w,r.h,80,()=>{},[],{mon:key,hmiPose:monPose(m)}); }
  /* 점검 (라인 클리어런스 · 확인 단계) */
  const st=curStep(), rec=S.activeTrouble?recoveryStep():null;
  if(st&&!rec&&!S.ipc.open){
    let job=null, nm=null;
    if(st.lc!==undefined&&!S.clear.includes(st.lc)){ job=CLEAR[S.room][st.lc].job; nm="점검 : "+CLEAR[S.room][st.lc].t; }
    else if(st.chk){ const c=st.chk(); if(c){ job=c.job; nm="점검 : "+c.t; } }
    const J=job&&JOBS[job], q=J&&(J.reach||[J.stand[0],1200,J.stand[1]]);
    if(q) add("chk",nm,q,700,700,700,()=>$("#lcCheck").click(),["#lcCheck"]);
  }
  /* 현장 조치 (빨간 !) */
  if(rec&&rec.k==="fix"&&rec.f.fix) add("fix","현장 조치 : "+rec.t.replace(/\s*\(빨간 ! 누르기\)\.?/,""),rec.f.fix,500,500,500,()=>{ if(!rec.f.act()) toast("다른 작업 중입니다."); },["#fixBtn"]);
  return T;
}
/* 힌트 대상(선택자) → 목표 대상 */
function fpGoalId(T){
  if(!S||!S.session||!S.session.active) return null;
  const sel=hintTarget(); if(!sel) return null;
  for(const t of T){ const s=typeof t.sels==="function"?t.sels():t.sels; if(s.some(x=>sel.indexOf(x)===0)) return t.id; }
  /* 설비 화면 · 조작반 */
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
/* 실 사이 벽 · 설비 화면 뒷면 가림 */
function fpOccluded(pose,t){
  const W=ROOM.wall;
  if((pose.x-W)*(t.x-W)<0){ const u=(W-pose.x)/(t.x-pose.x), z=pose.z+(t.z-pose.z)*u; if(!(z>DOORW.z0&&z<DOORW.z1)) return true; }
  if(t.mon&&pose.z<t.z) return true;
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
  const far=Math.hypot(e[0]-m.c[0],e[2]-m.c[2])>7000, back=e[2]<m.c[2]+20, other=(e[0]-ROOM.wall)*(m.c[0]-ROOM.wall)<0;
  if(far||back||other){ placeIDTMonitor(w,null); return; }
  const P=[[r.x0,r.y1],[r.x1,r.y1],[r.x1,r.y0],[r.x0,r.y0]].map(([x,y])=>prj(x,y,r.z+4));
  if(P.some(q=>!q||q.w<30)){ placeIDTMonitor(w,null); return; }
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
  if(f.rollCarry==="red"){ f.rollCarry=null; toast("적색 인쇄 은박 롤을 팔레트에 되돌려 놓았습니다."); after(); return; }
  toast("들고 있는 자재가 없습니다.");
}
const fpBusy=()=>!S||!S.session||!S.session.active||!$("#splash").classList.contains("hide")||$$(".modal.on").length>0;

/* ── 시작 · 전환 ── */
function fpInit(){
  FP.mod=createIDTFirstPerson({canvas:$("#cv3d"), scene:$("#view3d"), speed:1900*2, reach:FP_REACH,
    setCamera:p=>{ cam.fp=p; }, canStand:fpCanStand, eyeY:fpEyeY, targets:fpTargets,
    use:t=>{ t.run(); after(); }, occluded:fpOccluded, isBusy:fpBusy,
    hmiInteractive:(on,t)=>{ if(on&&t&&t.mon){ FP.monK=t.mon; FPMON=FP_MON[t.mon].k; if(!FPMON.includes(hMach)){ hMach=FPMON[0]; hScr=hMach==="fl"?"run":"main"; } drawHMI(); } fpHmiInteractive(on,t); },
    canOpenHMI:t=>{ const m=FP_MON[t.mon]; if(m&&!m.k.some(k=>machPower(k))){ toast(m.nm+" — 화면 꺼짐. "+powerHint(m.k[0]),"bad"); } return true; },
    hint:fpHint, showGuide:()=>!isExam()||hintOn, highlight:(g,a)=>{ FP.hl={goal:g,aim:a}; },
    returnPart:fpReturnPart, menu:fpMenu, help:fpHelp});
  $("#fpBtn").onclick=()=>fpSet(!FP.on);
}
function fpSpawn(){
  const sp=S.room==="F"?{x:-6300,z:1800}:{x:4300,z:1800};
  FP.feet=0; return {x:sp.x, y:EYE, z:sp.z, yaw:0, pitch:0.12, focal:0.78};
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
/* 3인칭 → 1인칭 복귀 시 마지막 위치 유지 */
let FP_LAST=null;
function fpSpawnFrom(){ if(FP_LAST&&FP_LAST.sess===S.session){ FP.feet=FP_LAST.feet; return Object.assign({},FP_LAST.pose); } return fpSpawn(); }
function fpFrame(now){
  if(FP.on&&FP.mod){ FP.mod.update(now); if(cam.fp) FP_LAST={sess:S.session,pose:Object.assign({},cam.fp),feet:FP.feet};
    /* 원인 판단 단계는 대화상자를 바로 연다 (1인칭에서는 코치 버튼을 누를 수 없음) */
    const rec=S&&S.activeTrouble&&recoveryStep();
    if(rec&&rec.k==="ask"&&!fpBusy()&&FP.mod.mode==="walk") openIncidentAsk();
  }
}
/* 1인칭 하이라이트 · HUD (drawOverlay 에서 호출) */
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
  /* 상태 표시 */
  const f=S.f, carry=f.rollCarry==="red"?"적색 인쇄 은박 롤 운반 중 (2인 1조) · R 반납":"";
  const lv=FP.feet>=DECK.y-50?"2층 데크":FP.feet>50?"계단":"1층";
  g.textAlign="left"; g.textBaseline="alphabetic"; g.font="800 "+(12*K).toFixed(0)+"px sans-serif";
  const t="🧍 1인칭 · "+lv+(carry?" · "+carry:"")+"   WASD 이동 · 마우스 시선 · 좌클릭/E 조작 · Esc 화면 닫기 · F1 힌트 · Tab 메뉴 · H 도움말";
  const w=g.measureText(t).width+18*K; g.fillStyle="rgba(10,20,32,.62)"; rr(g,10*K,10*K,w,24*K,7*K); g.fill(); g.fillStyle="#fff"; g.fillText(t,19*K,27*K);
}
