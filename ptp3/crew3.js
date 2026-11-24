/* ═══════════════════════════════════════════════════════════════════
   작업자 (파우치 인체 모델 human.js 그대로 · 11/17 사용자 지시 "작업자 디자인 파우치처럼")
   · PTP 원본 작업자 모형은 그리지 않고(NO_PTP_WORKER) 위치 · 작업 상태만 받아 파우치 작업자로 그림
   · 충전실 = 흰 방진복(suit) · 포장실 = 파란 가운(wear) — 파우치와 같음
   · 1인칭으로 그 실 작업자가 되면 그 작업자는 숨김 (내가 그 작업자)
   ═══════════════════════════════════════════════════════════════════ */
const CREW3={F:null, P:[]};
function crew3Init(){
  for(const k of ["filler","line"]){ const w=UNI_HUB.win(k); if(w) w.NO_PTP_WORKER=true; }
  CREW3.F=makeHuman(V3P.sc,"suit"); CREW3.F.G.visible=false;
  for(let i=0;i<4;i++){ const H=makeHuman(V3P.sc,"wear"); H.G.visible=false; CREW3.P.push(H); }
}
/* 걸음 방향 (P6) : 앱은 위치만 줌(걸음 속도는 빌드 때 세 IDT 공통 1.4 m/s 로 맞춤 · 작업 시간은 앱 그대로, 걷는 동안 작업 시간 정지)
   → 걷는 동안에는 진행 방향을 보고 손을 뻗지 않으며, 멈추면 설비 쪽(-z)으로 몸을 돌림 */
function crew3Step(H,x,z,dt){ const q=idtFaceStep(H,x,z,dt,Math.PI); return {x,z,yaw:q.yaw,moving:q.moving}; }   /* 공통 crewkit.js */
/* 들고 가는 자재 : 공통 idt_common/crewkit.js (IDT_CARRY — 크기 · 손 간격은 그 표 한 곳) — 걷는 동안 가슴 앞, 작업 중 손을 작업 지점으로 뻗어 놓음 */
const crew3Item=(H,kind)=>idtItem(H,kind,V3P.sc);
const crew3Hold=(H,P,kind,cp,yaw)=>idtHold(H,P,kind,cp,yaw,V3P.sc);
const CREW3_LK={carton:"carton",leaflet:"leaflet",cases:"cases",tape:"tape",label:"label"};
/* ═══ 11/20 "다 통일해" : 작업자 능력 파우치 기준 통일 ═══
   · 걷기 : 앱 자리 가까운 빈 바닥으로, 설비를 돌아가는 길(공통 idtWalker · 격자 A*)로 1.4 m/s — 도착 전에는 앱 작업 시간을 멈춤(PTP_HOLD)
   · 포장실 손 : 실제 설비 표면(가슴 앞 광선이 닿는 곳)에 댐 · 핸드파렛트카 : 손잡이를 잡고 끌기(앱 grip)
   · 충전실 성형필름 · 커버포일 롤 교체 (11/20 사용자 결정 : 파우치 은박 롤처럼) : 대차로 운반 → 2인 1조(보조 작업자)로 장착 → 대차 원위치
     1인칭에서도 보조 작업자가 동행해 옆에서 롤 반대쪽을 함께 잡은 뒤 장착 완료 */
const PTP_FREE=(x,z)=>walkFree(x*1000,z*1000);
/* 실마다 그 실 안만 (칸막이벽 x = wallX · 벽 개구부(연결 컨베이어)로 다른 실에 넘어가지 않게) */
const PTP_FREE_F=(x,z)=>x<ROOMBUS.L.wallX/1000-.35&&PTP_FREE(x,z), PTP_FREE_P=(x,z)=>x>(ROOMBUS.L.wallX+ROOMBUS.L.wallT)/1000+.35&&PTP_FREE(x,z);
const PTP_FREER=(x,z,r)=>{ if(x+r>ROOMBUS.L.wallX/1000-.1||gridHit(x*1000,z*1000)) return false; for(let a=0;a<8;a++){ const q=a*Math.PI/4; if(gridHit((x+Math.cos(q)*r)*1000,(z+Math.sin(q)*r)*1000)) return false; } return true; };
const CREW3V={F:null, P:[]}, CH3={k:null, ph:null, t:0, home:null, cart:null, S:null, park:null, path:[], hold:0, back:null};
const ROLL3=["film","foil"];
function crew3Ready(){
  if(CREW3V.F) return true; if(!GRID.a) return false;
  CREW3V.F=idtWalkerNew({free:PTP_FREE_F,pref:[0,1]}); for(let i=0;i<4;i++) CREW3V.P.push(idtWalkerNew({free:PTP_FREE_P,pref:[0,1]}));
  /* 대차 보관 자리 : 충전기 동쪽 끝 앞 빈 바닥 (반경 0.55 m 비어 있는 곳) */
  CH3.home=idtNearFree((x,z)=>PTP_FREER(x,z,.55),-1.4,2.0,2.5,[0,1])||[-3,2];
  const G=new T3.Group(); idtCartBuild(G); G.position.set(CH3.home[0],0,CH3.home[1]); G.rotation.y=Math.PI+IDT_TOW.cart.rot; V3P.sc.add(G); CH3.cart=G;
  CH3.roll={}; for(const k of ROLL3){ const m=idtCarryMesh(k); m.position.set(0,.68+(k==="film"?.17:.13),0); m.rotation.set(0,Math.PI/2,0); m.visible=false; G.add(m); CH3.roll[k]=m; }
  const hh=idtNearFree(PTP_FREE_F,-.9,1.4,2,[0,1])||[-1,1.4];
  CREW3.H=makeHuman(V3P.sc,"suit"); CREW3.HP=idtHelperNew({home:hh, face:Math.PI, free:PTP_FREE_F, nav:(H,to)=>idtGridPath(PTP_FREE_F,[H.x,H.z],to)||[to], spd:IDT_WALK});
  return true;
}
/* 앱 작업 시간 멈춤 : 보이는 작업자가 아직 도착하지 않았거나(걷기) 대차 운반 · 2인 준비 중 */
window.PTP_HOLD=function(app,a){
  if(!CREW3V.F) return false;
  if(app==="filler"&&UT3.F) return true; if(app==="line"&&a===0&&UT3.P) return true;   /* 유틸리티 조작하러 가는 중 */
  if(app==="filler"){ if(CH3.k&&["toCart","tow","pick","carry"].includes(CH3.ph)) return true; if(CH3.k&&CH3.ph==="mount"&&!(CH3.hold>1.6||CH3.t>(CH3.fp?10:40))) return true; return !!(CREW3V.F.path&&CREW3V.F.path.length)&&!CH3.k; }
  const V=CREW3V.P[a]; return !!(V&&V.path&&V.path.length);
};
function crew3Path(a,b,r){ return idtGridPath(r?((x,z)=>PTP_FREER(x,z,r)):PTP_FREE_F,a,b,.1)||[b]; }   /* 충전실 안 */
function crew3StepPath(V,path,dt,spd){ let st=dt*(spd||IDT_WALK), mv=false; while(st>1e-4&&path.length){ const p=path[0], dx=p[0]-V.x, dz=p[1]-V.z, d=Math.hypot(dx,dz); mv=true;
    if(d<=st){ V.x=p[0]; V.z=p[1]; st-=d; path.shift(); } else { V.x+=dx/d*st; V.z+=dz/d*st; st=0; } } return mv; }
/* ═══ 유틸리티 조작 = 파우치 방식 (11/20 사용자 확인 "실제 작업처럼 물 흐르듯이") ═══
   3인칭에서 압축공기 · 메인 전원 · 냉동기 · 진공 펌프 · 안전문 타일을 누르면 → 보이는 작업자가 그 설비(fp3.js FP3_A 위치)로 걸어가 손을 뻗은 뒤 앱 조작
   1인칭(그 실 작업자)은 타일이 잠기고(fpLock) 플레이어가 그 자리에 가서 3D 대상을 누르면 바로 적용 — 파우치 startWork 와 같음 */
const UT3={F:null, P:null, pass:false}, UT3_IDS=["uAir","uMain","uChiller","uVac","uDoor"];
function ut3Bind(k){ const w=UNI_HUB.win(k); if(!w||!w.document||w.__ut3===w.document) return; w.__ut3=w.document;
  w.document.addEventListener("click",e=>{ if(!e.isTrusted||!(V3P.view!=="orbit"&&APPK[CREW.cur]===k)) return; const t=e.target&&e.target.closest&&e.target.closest(".tile,#panel .psw"); if(!t||UT3_IDS.includes(t.id)) return;   /* 1인칭 : 자재 타일 · 판넬 스위치도 직접 클릭 차단 */
    e.stopImmediatePropagation(); e.preventDefault(); try{ w.toast("1인칭 — 설비 앞으로 걸어가 조준하고 E / 클릭으로 조작합니다."); }catch(x){} },true);
  w.document.addEventListener("click",e=>{ const t=e.target&&e.target.closest&&e.target.closest(".tile[id]"); if(!t||!UT3_IDS.includes(t.id)||UT3.pass) return;
    const r=k==="filler"?"F":"P", A=FP3_A[r]&&FP3_A[r][t.id]; if(!A||!CREW3V.F) return;
    if(V3P.view!=="orbit"&&APPK[CREW.cur]===k){ if(e.isTrusted){ e.stopImmediatePropagation(); e.preventDefault(); try{ w.toast("1인칭 — 설비 앞으로 걸어가 조준하고 E / 클릭으로 조작합니다."); }catch(x){} } return; }   /* 1인칭 그 실 : 타일 직접 클릭 차단 (CSS fpLock 과 이중) · 플레이어가 그 자리에서 3D 대상으로 (fp3Act) */
    try{ if(["uAir","uMain"].includes(t.id)&&!w.eval("S.air||S.main")&&!w.eval("clearanceDone()")) return; }catch(x){}   /* 앱 선행 조건(라인클리어런스) 미충족 : 걸어가지 않고 앱 안내를 바로 */
    e.stopImmediatePropagation(); e.preventDefault(); if(UT3[r]) return;
    const busy=r==="F"?!!(w.PTP_WKF&&w.PTP_WKF.key)||!!CH3.k:!!(w.PTP_WK&&w.PTP_WK[0]&&w.PTP_WK[0].job);
    if(busy){ try{ w.toast("작업자가 다른 작업 중입니다."); }catch(x){} return; }
    const tg=[A[0]/1000,A[1]/1000,A[2]/1000], free=r==="F"?PTP_FREE_F:PTP_FREE_P, d=t.id==="uAir"?FP3_AIR[r].dir:null;   /* 밸브 : 레버 정면 0.45 m 에 섬 */
    const st=(d&&idtNearFree(free,tg[0]+d[0]*.45,tg[2]+d[1]*.45,.6,d))||idtNearFree(free,tg[0],tg[2],1.6,[0,tg[2]<-.3?-1:1])||[tg[0],tg[2]+.6];
    UT3[r]={id:t.id, el:t, tg, stand:st, ph:"walk", t:0, done:false}; },true); }
function ut3Step(r,V,dt){ const U=UT3[r]; const w=idtWalkerTick(V,U.stand,dt);
  if(U.ph==="walk"&&w.arrived&&!w.moving){ U.ph="work"; U.t=0; }
  if(U.ph==="work"){ U.t+=dt; if(U.t>=.55&&!U.done){ U.done=true; UT3.pass=true; try{ U.el.click(); }catch(e){} finally{ UT3.pass=false; } } if(U.t>=1.3) UT3[r]=null; }
  return {x:w.x, z:w.z, moving:w.moving, face:Math.atan2(U.tg[0]-w.x,U.tg[2]-w.z), reach:U.ph==="work"&&U.t>.12&&U.t<1.15?U.tg:null}; }
function crew3Tick(dt){
  const fw=UNI_HUB.win("filler"), lw=UNI_HUB.win("line"), L=ROOMBUS.L, fp=V3P.view!=="orbit";
  if(!crew3Ready()) return;
  ut3Bind("filler"); ut3Bind("line");
  /* ── 충전실 ── */
  { const f=fw&&fw.PTP_WKF, H=CREW3.F, me=fp&&WALK.room==="F", V=CREW3V.F, HP=CREW3.HP, C=CH3;
    const X=v=>pfX(v)/1000, Zf=pfZ(f?f.z:0)/1000;   /* 충전기 ×0.8 (view3.js PF · 11/24) */
    const tg=f&&f.target?[X(f.target.x),pfY(f.target.y)/1000,pfZ(f.target.z)/1000]:null;
    const job=!!(f&&f.key), roll=job&&ROLL3.includes(f.key), cart=C.cart.position;
    /* 롤 교체 : 대차 끌고 가기(대차 중심 경로 · 작업자는 뒤) → 롤 들기 → 2인이 들고 가서 장착 → 대차 원위치 */
    const behind=(pth,c)=>{ const q=pth[0]||[c[0],c[1]+1], d=Math.hypot(q[0]-c[0],q[1]-c[1])||1; return [c[0]-(q[0]-c[0])/d*IDT_TOW.cart.off, c[1]-(q[1]-c[1])/d*IDT_TOW.cart.off]; };
    if(roll&&!C.k&&f&&!me){ if(V.x==null){ V.x=X(f.x); V.z=Zf; }
      const S=idtNearFree(PTP_FREE_F,X(f.to!=null?f.to:f.x),Zf,1.5,[0,1])||[X(f.x),Zf], park=idtNearFree((x,z)=>PTP_FREER(x,z,.5),S[0]+.95,S[1]+.3,1.5,[0,1])||[S[0],S[1]+1];
      Object.assign(C,{k:f.key, t:0, hold:0, fp:false, S, park, cpath:crew3Path(C.home,park,.45)}); const G=behind(C.cpath,C.home); C.path=crew3Path([V.x,V.z],G); C.ph="toCart"; C.roll[f.key].visible=true; }
    if(roll&&!C.k&&me) Object.assign(C,{k:f.key, t:0, hold:0, fp:true, ph:"mount"});
    if(C.k&&!job&&(C.ph==="mount"||C.ph==="carry"||C.ph==="pick")){ if(C.fp){ C.k=null; C.ph=null; } else { C.ph="toCart2"; C.tyaw=null; C.cpath=crew3Path([cart.x,cart.z],C.home,.45); C.path=crew3Path([V.x,V.z],behind(C.cpath,[cart.x,cart.z])); } }
    if(C.k) C.t+=dt;
    const P={x:0,z:0,yaw:0,dt,L:null,R:null,gL:.3,gR:.3,nL:"down",nR:"down"};
    let moving=false, act=false;
    if(C.k&&!C.fp){ act=true;
      if(C.ph==="toCart"||C.ph==="toCart2"){ moving=crew3StepPath(V,C.path,dt); if(!C.path.length) C.ph=C.ph==="toCart"?"tow":"towBack"; }
      if(C.ph==="tow"||C.ph==="towBack"){ const c={x:cart.x,z:cart.z}, sp=IDT_WALK*.75; moving=crew3StepPath(c,C.cpath,dt,sp)||moving; const q=C.cpath[0];
        const dir=q?Math.atan2(q[0]-c.x,q[1]-c.z):(C.tyaw!=null?C.tyaw:Math.PI); C.tyaw=C.tyaw==null?dir:C.tyaw+Math.atan2(Math.sin(dir-C.tyaw),Math.cos(dir-C.tyaw))*Math.min(1,dt*6);
        cart.set(c.x,0,c.z); C.cart.rotation.y=C.tyaw+IDT_TOW.cart.rot; V.x=c.x-Math.sin(C.tyaw)*IDT_TOW.cart.off; V.z=c.z-Math.cos(C.tyaw)*IDT_TOW.cart.off;
        if(!C.cpath.length){ if(C.ph==="tow"){ C.ph="pick"; C.pt=0; } else { C.k=null; C.ph=null; C.tyaw=null; V.goal=null; cart.set(C.home[0],0,C.home[1]); C.cart.rotation.y=Math.PI+IDT_TOW.cart.rot; } } }
      if(C.ph==="pick"){ C.pt+=dt; if(C.pt>.9){ C.ph="carry"; C.roll[C.k].visible=false; C.path=crew3Path([V.x,V.z],C.S); } }
      else if(C.ph==="carry"){ moving=crew3StepPath(V,C.path,dt,IDT_WALK*.8)||moving; if(!C.path.length) C.ph="mount"; }
      const q=idtFaceStep(H,V.x,V.z,dt,C.ph==="pick"?Math.atan2(cart.x-V.x,cart.z-V.z):tg?Math.atan2(tg[0]-V.x,tg[2]-V.z):Math.PI); P.x=V.x; P.z=V.z; P.yaw=(C.ph==="tow"||C.ph==="towBack")?C.tyaw:q.yaw; moving=moving||q.moving; V.path=[]; V.goal=null; }
    else if(UT3.F&&f&&!me){ if(V.x==null){ V.x=X(f.x); V.z=Zf; } const u=ut3Step("F",V,dt); const q=idtFaceStep(H,u.x,u.z,dt,u.face);   /* 유틸리티 조작하러 */
      P.x=u.x; P.z=u.z; P.yaw=q.yaw; moving=q.moving||u.moving; P.ut=u.reach; }
    else if(f&&!me){                                                         /* 평소 : 앱 자리로 걸어감 (도착 전 앱 작업 멈춤) */
      const want=[X(job&&f.to!=null?f.to:f.x),Zf], w=idtWalkerTick(V,want,dt);
      const q=idtFaceStep(H,w.x,w.z,dt,tg&&!w.moving?Math.atan2(tg[0]-w.x,tg[2]-w.z):Math.PI); P.x=w.x; P.z=w.z; P.yaw=q.yaw; moving=q.moving||w.moving; }
    if(C.k&&C.ph==="mount"&&idtHelperAtSide(HP)) C.hold+=dt;
    if(f&&!me){ H.G.visible=true; const fwd=[Math.sin(P.yaw),Math.cos(P.yaw)];
      if(act&&(C.ph==="tow"||C.ph==="towBack")){ crew3Item(H,null); idtTowPose(P,P.x,P.z,P.yaw,IDT_TOW.cart); }
      else if(act&&C.ph==="pick"){ const u=Math.min(1,C.pt/.9), top=[cart.x,.68+.17,cart.z], chest=idtCarryPt(P.x,P.z,0,P.yaw,C.k); crew3Hold(H,P,C.k,top.map((v,k)=>v+(chest[k]-v)*u),P.yaw); }
      else if(act&&(C.ph==="carry"||C.ph==="mount")&&tg){ const r=C.ph==="mount"?Math.min(1,(f.reach||0)*1.4):0, chest=idtCarryPt(P.x,P.z,0,P.yaw,C.k); crew3Hold(H,P,C.k,chest.map((v,k)=>v+(tg[k]-v)*r*.9),P.yaw); }
      else if(act){ crew3Item(H,null); }
      else if(job&&!roll&&(moving||(f.ph||0)<.15)){ let cp=idtCarryPt(P.x,P.z,0,P.yaw,"part"); if(!moving&&tg){ const r=Math.min(1,(f.reach||0)*1.4); cp=cp.map((v,k)=>v+(tg[k]-v)*r*.85); } crew3Hold(H,P,"part",cp,P.yaw); }
      else { crew3Item(H,null); if(!moving&&tg&&job){ P.L=[tg[0]-.1,tg[1],tg[2]]; P.R=[tg[0]+.1,tg[1],tg[2]]; } }
      if(P.ut){ crew3Item(H,null); P.L=null; P.R=P.ut; P.gR=.5; }
      poseHuman(H,P); }
    else { H.G.visible=false; crew3Item(H,null); V.path=[]; if(!me){ V.x=null; } }
    /* 보조 작업자 (충전실) : 롤 교체 동안 주 작업자(1인칭이면 플레이어)를 따라와 옆자리에서 롤 반대쪽을 함께 잡음 */
    { const lead=me?{x:WALK.x/1000,z:WALK.z/1000,face:tg?Math.atan2(tg[0]-WALK.x/1000,tg[2]-WALK.z/1000):Math.PI}:{x:P.x,z:P.z,face:P.yaw};
      const pair=!!C.k&&C.ph!=="toCart2"&&C.ph!=="towBack", work=!!(C.k&&C.ph==="mount");
      idtHelperTick(HP,lead,pair,work,tg,dt); let da=HP.face-HP.yaw; da=Math.atan2(Math.sin(da),Math.cos(da)); HP.yaw+=da*Math.min(1,dt*9);
      const HH=CREW3.H; HH.G.visible=WALK.room==="F"||!fp; const Q={x:HP.x,z:HP.z,y0:0,yaw:HP.yaw,dt,L:null,R:null};
      if(work&&tg){ const it=!me&&H.items&&H.items[C.k]&&H.items[C.k].visible?H.items[C.k]:{position:{x:tg[0],y:tg[1],z:tg[2]}}; idtHelperPose(HP,Q,lead.face,it,tg,true); }
      poseHuman(HH,Q); }
  }
  /* ── 포장실 ── */
  const W=(lw&&lw.PTP_WK)||[], dz=((lw&&lw.S&&lw.S.doorT)||0)*120;
  CREW3.P.forEach((H,i)=>{ const w=W[i], me=fp&&WALK.room==="P"&&i===0, V=CREW3V.P[i]; H.G.visible=!!w&&!me; if(!H.G.visible){ H.dx=null; V.x=null; crew3Item(H,null); return; }
    const jack=w.job==="jack"||!!w.grip, ax=(8000+5*w.x)/1000, az=5*(w.z+dz)/1000;
    let x, z, moving, U0=null;
    if(jack){ V.x=ax; V.z=az; V.path=[]; V.goal=null; x=ax; z=az; }                        /* 핸드파렛트카 : 앱 경로 그대로 (설비 앞 통로) */
    else if(i===0&&UT3.P){ if(V.x==null){ V.x=ax; V.z=az; } U0=ut3Step("P",V,dt); x=U0.x; z=U0.z; }           /* 유틸리티 조작하러 */
    else { const r=idtWalkerTick(V,[(8000+5*(w.job?w.xt:w.x))/1000,az],dt); x=r.x; z=r.z; }
    const q=idtFaceStep(H,x,z,dt,U0&&!U0.moving?U0.face:Math.PI), yaw=jack&&w.yawLock!=null?w.yawLock+Math.PI:q.yaw; moving=q.moving||(V.path&&V.path.length>0);
    const work=w.job==="work"&&!moving, fwd=[Math.sin(yaw),Math.cos(yaw)], lf=[Math.cos(yaw),-Math.sin(yaw)];
    const kind=w.job==="work"?CREW3_LK[w.key]:null, P={x,z,yaw,dt,L:null,R:null,gL:.3,gR:.3,nL:"down",nR:"down"};
    if(jack&&w.grip){ crew3Item(H,null); const g=w.grip.map(p=>[(8000+5*p[0])/1000,5*p[1]/1000,5*p[2]/1000]); P.L=g[0]; P.R=g[1]; P.gL=P.gR=.6; P.lean=.06; }
    else if(kind&&(moving||(w.workPhase||0)<.7)){ const r=moving?0:Math.min(1,(w.workPhase||0)/.5); crew3Hold(H,P,kind,[x+fwd[0]*(.36+.1*r),1.02+.05*r,z+fwd[1]*(.36+.1*r)],yaw); }
    else { crew3Item(H,null);
      if(work){ const ex=[H.G].concat(Object.values(H.items||{})); let s=idtReachSurface(V3P.sc,ex,x,z,yaw,1.05,.8); if(!s) s=[x+fwd[0]*.45,1.05,z+fwd[1]*.45]; else s=[s[0]-fwd[0]*.03,s[1],s[2]-fwd[1]*.03];
        P.L=[s[0]+lf[0]*.15,s[1],s[2]+lf[1]*.15]; P.R=[s[0]-lf[0]*.15,s[1],s[2]-lf[1]*.15]; } }
    if(U0&&U0.reach){ crew3Item(H,null); P.L=null; P.R=U0.reach; P.gR=.5; }
    poseHuman(H,P); });
}
