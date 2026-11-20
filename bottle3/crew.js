/* ═══════════════════════════════════════════════════════════════════
   작업자 — 파우치 기준 (11/18 사용자 지시 "하드웨어 외에는 모두 파우치처럼")
   · 인체 모델 : 파우치 human.js 그대로 (충전실 흰 방진복 suit · 포장실 파란 작업복 wear)
   · 충전실 : 원본 앱 작업자(WK)의 위치 · 계단 높이 · 작업(JOBS : 손 목표 · 들고 가는 물건 · 붓기)을 받아
     파우치 wkDraw 와 같은 방식으로 그림 — 걷는 동안 물건은 가슴 앞, 작업 중 손을 작업 지점까지 뻗고, 붓는 물건은 기울여 비움
   · 포장실 : 작업자 1 = 집적 벨트 끝에서 병을 집어 판독기에 대고 작업자 2 쪽에 넘김(전문) / 박스에 담음(일반)
              작업자 2 = 병 담기 → 봉함(테이프) → AG 프린터에서 라벨 → 부착 → 박스를 들고 파렛트로 걸어가 적재 → 접힌 박스를 가져와 조립
              자동 자재 교체 때는 해당 설비로 걸어가 교체
   · 1인칭으로 그 작업자가 되면 그 작업자는 숨김 (내가 그 작업자) · 걷는 동안 진행 방향을 보고, 멈추면 작업 지점 쪽으로
   · 들고 가는 물건 크기는 추정값 (원본 앱 정의 종류 · 현장 확인 전)
   ═══════════════════════════════════════════════════════════════════ */
const CREW={F:[], P1:null, P2:null, cur:null, mode:null, rx:true, started:{F:false,P:false}};
/* 들고 가는 물건 : 공통 idt_common/crewkit.js (IDT_CARRY) — 병 IDT 이름 → 공통 이름 (PE 필름 롤 · 박스 라벨) */
const CREW_KIND={roll:"peRoll",label:"sticker"};
const crewItem=(H,kind)=>idtItem(H,kind&&(CREW_KIND[kind]||kind),V3B.sc);
/* ═══ 정제 투입 리프터 (11/20 사용자 결정 "리프터로 올려 붓기" · 파우치 드럼리프터 모델 = 공통 idtLifterBuild) ═══
   DMC-60T 계단 발판 동쪽 바닥에 고정 (발판 x 0.85~1.70 · z −1.66~−0.94, 호퍼 · 계단 난간과 겹치지 않음 — 바닥 점유 격자로 확인)
   순서 : 용기를 들고 리프터 앞으로 → 발판에 올림 → 상승(약 1.1 m) → 계단으로 작업 발판에 올라감 → 리프터에서 용기를 받아 호퍼에 붓기 → 내려오면 리프터 하강
   1인칭 : 투입을 누르면 리프터가 용기를 싣고 올라간 뒤 붓기 진행 */
const BL={G:null, LP:null, drum:null, y:0, ph:null, t:0, i:-1, V:{x:0,z:0}, path:[], fp:false};
const BL_POS=[1.75,-1.3], BL_LOAD=[1.28,-1.98], BL_UP=1.08, BL_CLIMB=[[.43,-2.05],[.43,-1.45],[.59,-1.25]];
function blInit(){ const G=new T3.Group(); BL.LP=idtLifterBuild(G,2.2); G.position.set(BL_POS[0],0,BL_POS[1]); V3B.sc.add(G); BL.G=G;
  BL.drum=idtCarryMesh("drum"); BL.drum.position.set(-.47,.165+.17,0); BL.drum.visible=false; BL.LP.add(BL.drum); }
const B3_FREE=(x,z)=>walkFree(x*1000,z*1000);
window.B3_HOLD=J=>!!(J&&J.key==="tab"&&BL.ph&&BL.ph!=="pour");
function blStep(path,dt){ let st=dt*IDT_WALK, mv=false; const V=BL.V; while(st>1e-4&&path.length){ const p=path[0], dx=p[0]-V.x, dz=p[1]-V.z, d=Math.hypot(dx,dz); mv=true;
    if(d<=st){ V.x=p[0]; V.z=p[1]; st-=d; path.shift(); } else { V.x+=dx/d*st; V.z+=dz/d*st; st=0; } } return mv; }
/* 리프터 진행 (작업자 i 의 앱 작업 J) — 셸이 보이는 위치를 정하면 {x,z,moving,face,act} 를 돌려줌 */
function blTick(dt,i,q,me){
  const J=q&&q.job, tab=!!(J&&J.key==="tab"&&J.phase!=="exit");
  if(tab&&!BL.ph&&BL.i<0){ BL.i=i; BL.t=0; BL.fp=me; BL.drum.visible=me; BL.ph=me?"raise":"load"; if(!me){ BL.V={x:q.x*MM,z:(q.z||1100)*MM}; BL.path=idtGridPath(B3_FREE,[BL.V.x,BL.V.z],BL_LOAD,.1)||[BL_LOAD]; } }
  if(BL.i!==i) return null;
  if(!tab&&BL.ph&&BL.ph!=="lower"){ BL.ph="lower"; }
  BL.t+=dt; const lp=BL.LP;
  if(BL.ph==="lower"){ lp.position.y=Math.max(0,lp.position.y-dt*.5); if(lp.position.y<=0){ BL.ph=null; BL.i=-1; BL.drum.visible=false; } return null; }
  if(BL.ph==="raise"){ lp.position.y=Math.min(BL_UP,lp.position.y+dt*.45); if(lp.position.y>=BL_UP){ BL.ph=BL.fp?"pour":"climb"; BL.path=BL_CLIMB.map(p=>p.slice()); } }
  if(BL.ph==="pour"){ BL.drum.visible=false; return null; }
  if(BL.fp) return null;
  let mv=false, face=0, act=null;
  if(BL.ph==="load"){ mv=blStep(BL.path,dt); face=Math.atan2(BL_POS[0]-.47-BL.V.x,BL_POS[1]-BL.V.z); if(!BL.path.length){ BL.ph="place"; BL.t=0; } }
  else if(BL.ph==="place"){ face=Math.atan2(BL_POS[0]-.47-BL.V.x,BL_POS[1]-BL.V.z); act="place"; if(BL.t>.9){ BL.drum.visible=true; BL.ph="raise"; BL.t=0; } }
  else if(BL.ph==="raise"){ face=Math.atan2(BL_POS[0]-BL.V.x,BL_POS[1]-BL.V.z); act="raise"; }
  else if(BL.ph==="climb"){ mv=blStep(BL.path,dt); const p=BL.path[0]; face=p?Math.atan2(p[0]-BL.V.x,p[1]-BL.V.z):Math.atan2(BL_POS[0]-BL.V.x,BL_POS[1]-BL.V.z); if(!BL.path.length) BL.ph="pour"; }
  let y0=0; try{ y0=appWin().floorY(BL.V.x/MM,BL.V.z/MM)*MM; }catch(e){}
  return {x:BL.V.x, z:BL.V.z, y0, moving:mv, face, act};
}
function crewInit(){
  for(let i=0;i<2;i++){ const H=makeHuman(V3B.sc,"suit"); H.G.visible=false; CREW.F.push(H); }
  CREW.P1=makeHuman(V3B.sc,"wear"); CREW.P2=makeHuman(V3B.sc,"wear"); blInit();
  for(const k of ["P1","P2"]) Object.assign(CREW[k],{px:null,pz:null,seq:null,q:[]});
}
const crewStep=idtFaceStep;
const crewFace=(x,z,t)=>Math.atan2(t[0]-x,t[2]-z);                 /* 파우치 yaw : 앞 = (sin, cos) */
/* 손에 든 물건 자세 (파우치 wkDraw 와 같은 방식) : 가슴 앞 cp, 손은 물건 양옆 */
const crewHold=(H,P,kind,cp,rotY)=>idtHold(H,P,CREW_KIND[kind]||kind,cp,rotY,V3B.sc);

/* ── 충전실 : 원본 앱 작업자 (WK · JOBS) ── */
const crewReachAmt=J=>idtReachAmt(J.t,J.j.dur);
function crewFill(dt,fp){
  const w=appWin(); let W=[]; try{ W=(w.B3&&w.B3.WK())||[]; }catch(e){}
  CREW.F.forEach((H,i)=>{ const q=W[i], me=fp&&CREW.cur==="F"&&i===0, B=q?blTick(dt,i,q,me):null; H.G.visible=!!q&&!me; if(!H.G.visible){ H.dx=null; crewItem(H,null); return; }
    if(B){ const P={x:B.x,z:B.z,y0:B.y0,yaw:0,dt,L:null,R:null,gL:.3,gR:.3,nL:"down",nR:"down"}; if(H.yw==null) H.yw=B.face; let da=B.face-H.yw; da=Math.atan2(Math.sin(da),Math.cos(da)); H.yw+=da*Math.min(1,dt*9); P.yaw=H.yw;
      const lp=new T3.Vector3(); BL.drum.getWorldPosition(lp);
      if(BL.ph==="load"){ crewHold(H,P,"drum",idtCarryPt(B.x,B.z,B.y0,H.yw,"drum"),H.yw); }
      else if(B.act==="place"){ const u=Math.min(1,BL.t/.9), a=idtCarryPt(B.x,B.z,B.y0,H.yw,"drum"), b=[lp.x,lp.y,lp.z]; crewHold(H,P,"drum",a.map((v,k)=>v+(b[k]-v)*u),H.yw); }
      else { crewItem(H,null); if(B.act==="raise"){ const c=[BL_POS[0]+.3,.85,BL_POS[1]-.1]; P.R=c; P.gR=.5; } }
      crewPour(H,null,0); poseHuman(H,P); return; }
    const x=q.x*MM, z=(q.z||1100)*MM, y0=(q.y||0)*MM, want=(q.face!=null?q.face:0)+Math.PI;          /* 앱 face(−z 기준) → 파우치 yaw */
    if(H.yw==null) H.yw=want; let da=want-H.yw; da=Math.atan2(Math.sin(da),Math.cos(da)); H.yw+=da*Math.min(1,dt*9);
    const yaw=H.yw, f=[Math.sin(yaw),Math.cos(yaw)], J=q.job, work=J&&J.phase==="work"&&J.j&&J.j.reach, P={x,z,y0,yaw,dt,L:null,R:null,gL:.3,gR:.3,nL:"down",nR:"down"};
    const kind=q.carry, hold=J&&J.j&&(J.j.pour?J.j.dur*.78:J.j.dur*.55);
    const carrying=kind&&(q.walking||!J||J.phase!=="work"||J.t<hold);
    if(carrying){ let cp=[x+f[0]*.36,y0+1.02,z+f[1]*.36], tilt=0;
      if(J&&J.key==="tab"&&BL.i===i&&J.t<.45&&BL.G){ const lp=new T3.Vector3(); BL.drum.getWorldPosition(lp); const u=Math.min(1,J.t/.45); cp=[lp.x+(cp[0]-lp.x)*u,lp.y+(cp[1]-lp.y)*u,lp.z+(cp[2]-lp.z)*u]; }
      if(work){ const r=crewReachAmt(J), R=J.j.reach, t=[R[0]*MM,R[1]*MM,R[2]*MM];
        if(J.j.pour){ const dx=t[0]-x, dz=t[2]-z, d=Math.hypot(dx,dz)||1, k=Math.min(.55,.3/d); t[0]-=dx*k; t[2]-=dz*k; t[1]+=.12; tilt=Math.min(1,Math.max(0,(J.t-.9)/.5))*1.05; }
        cp=cp.map((v,k)=>v+(t[k]-v)*r*.85); }
      const m=crewHold(H,P,kind,cp,yaw); if(m&&tilt) m.rotateX(tilt);
      crewPour(H,J,tilt,cp); }
    else { crewItem(H,null); crewPour(H,null,0);
      if(work&&J.t>.12&&J.t<J.j.dur-.35){ const R=J.j.reach, t=[R[0]*MM,R[1]*MM,R[2]*MM], lf=[Math.cos(yaw),-Math.sin(yaw)]; P.R=t; if(J.j.dur>2.2) P.L=[t[0]+lf[0]*.22,t[1],t[2]+lf[1]*.22]; } }
    poseHuman(H,P); });
}
/* 붓는 흐름 (병 · 정제 · 캡) : 용기 입구 → 투입구 — 공통 idtPour */
function crewPour(H,J,tilt,cp){ const on=!!(J&&J.j&&J.j.pour&&tilt>.6&&J.t<J.j.dur*.78-.1); const R=J&&J.j&&J.j.reach; idtPour(H,V3B.sc,on,cp,R?[R[0]*MM,R[1]*MM-.04,R[2]*MM-.04]:cp,J?J.t:0); }

/* ── 포장실 ── */
const PKW={T:12};                                           /* 자동 봉함 ~ 적재 시간 (packsim 의 closing 과 같음) */
const pkm=(x,z)=>[x*MM,z*MM];
const PKS={scan:pkm(18750,620), handoff:[19.2,.95,.15], box:pkm(19950,680), ag:pkm(19175,620), agP:[19.175,1.01,-.04], pal:pkm(20700,1330), flat:pkm(21000,680)};
/* 작업자 이동 : 목표 (x, z) 로 직선 보행 (1.4 m/s · 물건 들면 1.0 m/s) — 파우치 보행 속도 */
function pkWalk(H,to,dt,v){ if(H.px==null){ H.px=to[0]; H.pz=to[1]; }          /* 11/20 : 설비를 돌아가는 길(공통 idtGridPath · 바닥 점유 격자) */
  if(!H.wp||H.wpTo!==to){ H.wpTo=to; H.wp=Math.hypot(to[0]-H.px,to[1]-H.pz)<.05?[]:(idtGridPath(B3_FREE,[H.px,H.pz],to,.1)||[to]); }
  let st=(v||IDT_WALK)*dt; while(st>1e-4&&H.wp.length){ const q=H.wp[0], dx=q[0]-H.px, dz=q[1]-H.pz, d=Math.hypot(dx,dz); if(d<=st){ H.px=q[0]; H.pz=q[1]; st-=d; H.wp.shift(); } else { H.px+=dx/d*st; H.pz+=dz/d*st; st=0; } }
  return !H.wp.length; }
const pkBelt=()=>{ const p=pkPath(PK_END()); return [p[0]*MM,PK.CH*MM+.035,p[2]*MM]; };
/* 작업자 2 (일반의약품이면 작업자 1) : 박스 마감 순서 — 봉함 → (AG 라벨) → 들고 파렛트 → 적재 → 접힌 박스 → 조립 */
function pkBoxSeq(rx){ const S=[];
  S.push({k:"seal",at:PKS.box,dur:2.0});
  if(rx){ S.push({k:"walk",to:PKS.ag}); S.push({k:"agTake",at:PKS.ag,dur:.8}); S.push({k:"walk",to:PKS.box,carry:"label"}); S.push({k:"agApply",at:PKS.box,dur:.8}); }
  S.push({k:"lift",at:PKS.box,dur:.6}); S.push({k:"walk",to:PKS.pal,carry:"boxFull",v:1.0}); S.push({k:"place",at:PKS.pal,dur:1.0});
  S.push({k:"walk",to:PKS.flat}); S.push({k:"takeFlat",at:PKS.flat,dur:.7}); S.push({k:"walk",to:PKS.box,carry:"flat"}); S.push({k:"assemble",at:PKS.box,dur:1.6});
  return S.map(o=>Object.assign({t:0},o)); }
function pkBoxHome(){ if(!PKW.home&&PKG.openBox) PKW.home=PKG.openBox.position.clone(); return PKW.home; }
function pkSeqAbort(H){ if(!H||!H.seq) return; H.seq=null; const h=pkBoxHome(); if(h){ PKG.openBox.position.copy(h); PKG.openBox.visible=true; } if(PS.box.closing>0&&PS.box.closing<1e8) PS.box.closing=Math.min(PS.box.closing,.001); PS.box.open=true; }
function pkSeqTick(H,dt,P){
  const st=H.seq[0], home=pkBoxHome(); if(!st){ H.seq=null; return false; }
  const bx=home?[home.x,home.y,home.z]:[19.95,.9,0], f=a=>[Math.sin(a),Math.cos(a)];
  let face=Math.PI, done=false;
  if(st.k==="walk"){ done=pkWalk(H,st.to,dt,st.v); const yaw=H.yw==null?Math.PI:H.yw, fw=f(yaw), cp=[H.px+fw[0]*.36,1.02,H.pz+fw[1]*.36];
    if(st.carry==="boxFull"){ PKG.openBox.position.set(cp[0],cp[1]-.06,cp[2]); P.L=[cp[0]+Math.cos(yaw)*.2,cp[1]+.02,cp[2]-Math.sin(yaw)*.2]; P.R=[cp[0]-Math.cos(yaw)*.2,cp[1]+.02,cp[2]+Math.sin(yaw)*.2]; P.gL=P.gR=.6; }
    else if(st.carry) crewHold(H,P,st.carry,cp,yaw);
    face=null; }
  else { pkWalk(H,st.at,dt); st.t+=dt; done=st.t>=st.dur; const u=Math.min(1,st.t/st.dur);
    if(st.k==="seal"){ face=crewFace(H.px,H.pz,bx); const s=Math.sin(st.t*5)*.12; P.L=[bx[0]-.1,bx[1]+.13,bx[2]]; P.R=[bx[0]+s,bx[1]+.13,bx[2]+.02]; P.gL=.3; P.gR=.6; }
    else if(st.k==="agTake"){ face=crewFace(H.px,H.pz,PKS.agP); P.R=PKS.agP.slice(); P.gR=.5; if(u>.5) crewItem(H,"label").position.set(PKS.agP[0],PKS.agP[1],PKS.agP[2]+.03); }
    else if(st.k==="agApply"){ face=crewFace(H.px,H.pz,bx); const t=[bx[0],bx[1]+.07,bx[2]+.14]; P.R=t; P.gR=.2; P.nR=[0,0,-1]; if(u<.6){ const m=crewItem(H,"label"); m.position.set(t[0],t[1],t[2]+.01); m.rotation.x=Math.PI/2; } else crewItem(H,null); }
    else if(st.k==="lift"){ face=crewFace(H.px,H.pz,bx); P.L=[bx[0]-.2,bx[1]+.06+u*.08,bx[2]]; P.R=[bx[0]+.2,bx[1]+.06+u*.08,bx[2]]; P.gL=P.gR=.6; PKG.openBox.position.set(bx[0],bx[1]+u*.08,bx[2]); crewItem(H,null); }
    else if(st.k==="place"){ const slot=pkPalSlot(); face=crewFace(H.px,H.pz,slot); const a=Math.min(1,u*1.6), c=[H.px+(slot[0]-H.px)*a,1.0+(slot[1]+.06-1.0)*a,H.pz+(slot[2]-H.pz)*a];
      PKG.openBox.position.set(c[0],c[1]-.06,c[2]); P.L=[c[0]-.2,c[1],c[2]]; P.R=[c[0]+.2,c[1],c[2]]; P.gL=P.gR=.6; P.lean=.25*a;
      if(done){ PKG.openBox.visible=false; PKG.openBox.position.set(bx[0],bx[1],bx[2]); if(PS.box.closing>0&&PS.box.closing<1e8) PS.box.closing=.001; PKW.waitBox=true; } }
    else if(st.k==="takeFlat"){ face=crewFace(H.px,H.pz,[21.0,.96,-.15]); P.L=[20.85,.97,-.1]; P.R=[21.15,.97,-.1]; P.gL=P.gR=.5; if(u>.5) crewHold(H,{},"flat",[21.0,.98,-.1],Math.PI); }
    else if(st.k==="assemble"){ face=crewFace(H.px,H.pz,bx); const s=Math.sin(st.t*4)*.05; P.L=[bx[0]-.17,bx[1]+.06+s,bx[2]]; P.R=[bx[0]+.17,bx[1]+.06-s,bx[2]]; P.gL=P.gR=.5;
      if(u>.3){ crewItem(H,null); PKG.openBox.visible=true; PKG.openBox.scale.y=Math.min(1,(u-.3)/.7); }
      if(done){ PKG.openBox.scale.y=1; PKW.waitBox=false; PS.box.open=true; } } }
  if(done) H.seq.shift();
  return face; }
/* 파렛트 다음 자리 (packsim 의 적재 배열과 같음) */
function pkPalSlot(){ const i=Math.min(PS.pallet,PS.perLayer*PS.layers-1), L=Math.floor(i/PS.perLayer), j=i%PS.perLayer, c=j%3, r=Math.floor(j/3), P=PK.pallet;
  return [P.x*MM-.55+c*.37+.18, .14+L*.12, P.z*MM-.45+r*.29+.125]; }
function crewPack(dt,fp){
  const rx=PS.rx, boxW=rx?CREW.P2:CREW.P1;
  pkBoxHome();
  if(!PC.on){ pkSeqAbort(CREW.P1); pkSeqAbort(CREW.P2); PKW.waitBox=false; }
  if(PKW.waitBox&&!(PS.box.closing>0)) PS.box.open=false;          /* 새 박스를 조립할 때까지 담지 않음 (작업자 1 대기) */
  for(const k of ["P1","P2"]){ const H=CREW[k], me=fp&&CREW.cur===k, exists=k==="P1"||rx; H.G.visible=exists&&!me;
    if(!exists||me){ if(H.seq) pkSeqAbort(H); crewItem(H,null); H.px=null; H.dx=null; continue; }
    const P={x:0,z:0,yaw:0,dt,L:null,R:null,gL:.3,gR:.3,nL:"down",nR:"down"}; let face=Math.PI;
    /* 박스 마감 (자동 봉함 시간 동안) */
    if(H===boxW&&PS.auto.w2&&PS.box.closing>0&&PS.box.closing<1e8&&!H.seq&&!PKW.waitBox){ H.seq=pkBoxSeq(rx); PS.box.closing=PKW.T+30; }
    if(H.seq){ const f2=pkSeqTick(H,dt,P); face=f2==null?null:f2; if(!H.seq&&PKW.waitBox){ PKW.waitBox=false; PS.box.open=true; } }
    else if(H.mat){ /* 자동 자재 교체 : 설비로 걸어가 교체 */
      const m=H.mat; if(!m.arrived){ m.arrived=pkWalk(H,m.stand,dt); const fw=[Math.sin(H.yw||Math.PI),Math.cos(H.yw||Math.PI)]; crewHold(H,P,m.item,[H.px+fw[0]*.3,1.0,H.pz+fw[1]*.3],.12,H.yw||Math.PI); face=null; }
      else { m.t=(m.t||0)+dt; face=crewFace(H.px,H.pz,m.at); P.L=[m.at[0]-.1,m.at[1],m.at[2]]; P.R=[m.at[0]+.1,m.at[1],m.at[2]]; P.gL=P.gR=.5; if(m.t<1.2) crewHold(H,P,m.item,m.at,.12,face); else crewItem(H,null); if(m.t>2.4) H.mat=null; } }
    else if(k==="P1"&&rx){ /* 판독 : 벨트 끝에서 집기 → 판독기 → 넘김 */
      pkWalk(H,PKS.scan,dt); const n=PS.ag.n+PS.ag.boxes*1000; if(H.lastN!==n){ H.lastN=n; H.cyc=0; } H.cyc=(H.cyc==null?9:H.cyc)+dt; const c=H.cyc, b=pkBelt(), sc=[PK.scanX*MM,1.0,-.09];
      face=Math.PI; if(c<1.1){ const p=c<.35?b:c<.7?sc:PKS.handoff; P.R=p; P.gR=.6; crewItem(H,"bottle").position.set(p[0],p[1]-.03,p[2]); P.L=[b[0]+.1,b[1]+.02,b[2]+.1]; } else crewItem(H,null); }
    else { /* 박스에 담기 (전문 = 작업자 2 · 일반 = 작업자 1) */
      if(!PKW.waitBox||H!==boxW) pkWalk(H,PKS.box,dt); const n=PS.box.n; if(H.lastBn!==n){ if(n>(H.lastBn||0)) H.put=0; H.lastBn=n; } H.put=(H.put==null?9:H.put)+dt;
      const home=pkBoxHome(), into=home?[home.x+((n%8)-3.5)*.04,home.y+.05,home.z+(Math.floor(n/8)-2)*.04]:[19.95,.95,0], from=rx?PKS.handoff:pkBelt();
      if(H.put<.9&&PS.box.open){ const p=H.put<.35?from:into; P.R=p; P.gR=.6; crewItem(H,"bottle").position.set(p[0],p[1]-.03,p[2]); P.L=[home?home.x-.2:19.75,.98,.05]; } else crewItem(H,null);
      face=Math.PI; }
    if(H.px==null){ H.px=(k==="P1"&&rx?PKS.scan:PKS.box)[0]; H.pz=(k==="P1"&&rx?PKS.scan:PKS.box)[1]; }
    const s=crewStep(H,H.px,H.pz,dt,face==null?(H.yw||Math.PI):face); Object.assign(P,{x:H.px,z:H.pz,yaw:s.yaw}); poseHuman(H,P); }
}
/* 자동 작업자의 자재 교체 동작 (pcMatTick 에서 부름) */
const CREW_MAT={lab:{stand:pkm(10900,650),at:[10.9,1.02,-.47],item:"labRoll"}, rib:{stand:pkm(11200,600),at:[11.2,1.17,-.1],item:"ribbon"},
  leaf:{stand:pkm(13400,620),at:[13.4,1.56,-.2],item:"leafRoll"}, ag:{stand:PKS.ag,at:PKS.agP,item:"agPaper"}};
function crewMat(k){ const H=CREW.P1, m=CREW_MAT[k]; if(!H||!m||H.seq||(V3B.view!=="orbit"&&CREW.cur==="P1")) return; H.mat={stand:m.stand,at:m.at,item:m.item,t:0,arrived:false}; }
function crewTick(dt){
  const fp=V3B.view!=="orbit"; crewFill(dt,fp); crewPack(dt*((typeof TBQ!=="undefined"&&TBQ.spd)||1),fp);
}
