/* ═══════════════════════════════════════════════════════════════════
   작업자 (3인칭) — 실마다 1명. 타일 · 판넬 조작 시 해당 위치까지 걸어가 손을 뻗어 작업한 뒤 결과를 반영
   · 충전실 : 1층 통로 · 계단(동쪽으로 내려감) · 2층 데크 경로 / 포장실 : 라인 동쪽 운전 통로
   · 1인칭 중에는 교육생이 직접 조작하므로 즉시 반영 (옛 IDT 와 동일)
   ═══════════════════════════════════════════════════════════════════ */
const WK=[
  {id:"F", x:1.4, z:4.9, y:0, lvl:0, route:[], face:Math.PI*.8, yaw:Math.PI*.8, gait:0, walk:0, walking:false, job:null, carry:null},
  {id:"P", x:4.3, z:-1.5, y:0, lvl:0, route:[], face:-Math.PI/2, yaw:-Math.PI/2, gait:0, walk:0, walking:false, job:null, carry:null}
];
/* 이동 경로망 (x · z · 층) — 평면도 기준 */
const NAV={
  F:{n:{a:[1.4,.9,0],b:[1.4,2.7,0],c:[1.4,4.9,0],m:[2.35,2.73,0],d:[3.9,4.9,0],e:[5.25,4.9,0],k:[5.25,2.9,0],f:[7.5,4.9,0],g:[7.5,3.84,0],h:[8.0,2.0,0],i:[9.6,3.2,0],j:[9.5,5.3,0],
        T:[5.3,3.84,1],B:[5.2,1.75,1],C:[2.15,1.6,1],D:[2.15,3.9,1],E:[3.05,3.95,1],G:[4.15,2.0,1]},
     e:"a-b b-c b-m c-d d-e e-k e-f f-g f-j g-h h-i i-j g-T T-B T-E E-D D-C C-B B-G G-T"},
  P:{n:{p0:[4.3,-.6,0],p1:[4.3,-2.4,0],p2:[4.3,-4.0,0],p3:[4.3,-6.0,0],p4:[4.3,-7.6,0],p5:[4.3,-9.0,0],p6:[4.45,-11.2,0],p7:[5.7,-12.9,0],p8:[7.3,-14.6,0]},
     e:"p0-p1 p1-p2 p2-p3 p3-p4 p4-p5 p5-p6 p6-p7 p7-p8"}
};
for(const R of Object.values(NAV)){ R.adj={}; for(const k in R.n) R.adj[k]=[]; for(const s of R.e.split(" ")){ const [a,b]=s.split("-"); R.adj[a].push(b); R.adj[b].push(a); } }
const STAIRY=x=>clamp((STR.x1-x)/(STR.x1-STR.x0),0,1)*FL.deckY;
const onStairBand=(x,z)=>x>STR.x0-.08&&x<STR.x1+.15&&z>STR.z0-.08&&z<STR.z1+.08;
function wkFor(stand){ return stand[1]<0?WK[1]:WK[0]; }
function wkBusy(){ return WK.some(w=>w.job||w.route.length); }
/* 가장 가까운 같은 층 노드 → 최단 경로 → 목표 */
function navPath(w,dest,lvl){
  const R=NAV[w.id], N=R.n, near=(x,z,l)=>{ let b=null,d=1e9; for(const k in N){ const q=N[k]; if(q[2]!==l) continue; const e=Math.hypot(q[0]-x,q[1]-z); if(e<d){ d=e; b=k; } } return b; };
  const s=near(w.x,w.z,w.lvl), t=near(dest[0],dest[1],lvl);
  const dist={}, prev={}, Q=new Set(Object.keys(N)); for(const k of Q) dist[k]=1e9; dist[s]=0;
  while(Q.size){ let u=null; for(const k of Q) if(u===null||dist[k]<dist[u]) u=k; Q.delete(u); if(u===t) break;
    for(const v of R.adj[u]){ const L=dist[u]+Math.hypot(N[u][0]-N[v][0],N[u][1]-N[v][1]); if(L<dist[v]){ dist[v]=L; prev[v]=u; } } }
  const ks=[]; for(let k=t;k;k=prev[k]){ ks.unshift(k); if(k===s) break; }
  const rt=ks.map(k=>[N[k][0],N[k][1],N[k][2]]);
  if(rt.length>1&&Math.hypot(rt[1][0]-w.x,rt[1][1]-w.z)<Math.hypot(rt[1][0]-rt[0][0],rt[1][1]-rt[0][1])&&rt[0][2]===w.lvl) rt.shift();   /* 지나온 노드 생략 */
  rt.push([dest[0],dest[1],lvl]);
  return rt;
}
let CAMRET=null;
function startWork(key,cb,opt){
  if(cam.fp){ try{ cb&&cb(); }catch(e){ console.error(e); } return true; }
  const j=Object.assign({},JOBS[key]||JOBS.look,opt||{});
  const legs=j.seqFn?j.seqFn():null, L0=legs?legs[0]:j;
  const w=wkFor(L0.stand||j.stand);
  if(w.job) return false;
  w.route=legRoute(w,L0);
  w.job={key,j,cb,phase:"walk",t:0,legs,li:0}; w.carry=legs?(L0.carry||null):(j.carry||null);
  const v=j.view&&WORKVIEW[j.view];
  if(v&&R3.gl){ w.job.prevView=CAMRET?CAMRET.view:(cam.view==="work"?(S.room==="F"?"fill":"pack"):cam.view); CAMRET=null; w.job.hasView=true;
    cam.view="work"; cam.yawT=cam.yaw+Math.atan2(Math.sin(v.yaw-cam.yaw),Math.cos(v.yaw-cam.yaw)); cam.pitchT=v.pitch; cam.distT=v.dist; cam.txT=v.tx; cam.tyT=v.ty; cam.tzT=v.tz; }
  return true;
}
/* 여러 단계 작업 (대차 · 리프터 끌기 등) : leg = {stand, path?, deck?, reach?, dur, carry?, grab?, release?, on?} */
function legRoute(w,L){ if(L.path) return L.path.map(q=>[q[0],q[1],0]).concat([[L.stand[0],L.stand[1],0]]); return navPath(w,L.stand,L.deck?1:0); }
const curLeg=J=>J.legs?J.legs[J.li]:J.j;
const WK_SPD=1.6;                               /* 보행 속도 m/s */
function wkTick(dt){
  if(typeof helpTick==="function") helpTick(dt);
  if(CAMRET){ CAMRET.t-=dt; if(CAMRET.t<=0){ if(cam.view==="work"&&!WK.some(w=>w.job&&w.job.hasView)) camSet(CAMRET.view); CAMRET=null; } }
  for(const w of WK){
    w.walking=false;
    const tl=w.route.length?w.route[0][2]:w.lvl, up=w.lvl||tl, inDeck=w.x>FL.x0-FL.ext-.05&&w.x<FL.x1+.08&&w.z>FL.z0-.05&&w.z<FL.z1+.05;
    const ty=w.id==="F"&&onStairBand(w.x,w.z)&&!(w.lvl&&tl&&w.x<STR.x0)?STAIRY(w.x):(up&&inDeck?FL.deckY:0);
    w.y+=(ty-w.y)*Math.min(1,dt*12);
    if(w.route.length){
      const r=w.route[0], dx=r[0]-w.x, dz=r[1]-w.z, dd=Math.hypot(dx,dz), st=Math.min(dd,dt*WK_SPD*(w.tow?.55:1));
      if(dd>.001){ w.x+=dx/dd*st; w.z+=dz/dd*st; w.walking=true; w.gait+=st/.62*Math.PI; w.face=Math.atan2(dx,dz); }
      if(dd-st<=.001){ w.lvl=r[2]; w.route.shift(); }
      if(w.job&&w.job.legs&&w.job.hasView&&cam.view==="work"){ cam.txT=w.x; cam.tzT=w.z; cam.tyT=1.0; cam.distT=Math.max(cam.distT,6.5); cam.pitchT=Math.max(cam.pitchT,.45); }   /* 대차 · 리프터 운반은 카메라가 작업자를 따라감 */
      continue;
    }
    const J=w.job;
    if(J){
      if(J.phase==="walk"){ J.phase="work"; J.t=0; }
      J.t+=dt; const L=curLeg(J);
      if(J.legs&&J.hasView&&cam.view==="work"){ cam.txT=w.x; cam.tzT=w.z; cam.tyT=1.0; }
      if(L.reach){ const r=L.reach; w.face=Math.atan2(r[0]-w.x,r[2]-w.z); } else if(L.face!=null) w.face=L.face;
      if(L.prog) L.prog(Math.min(1,J.t/L.dur));
      if(J.legs&&J.t>=L.dur){
        try{ L.on&&L.on(w); }catch(e){ console.error(e); }
        if(L.grab) w.tow=L.grab; if(L.release) w.tow=null;
        if(J.li<J.legs.length-1){ J.li++; const N=J.legs[J.li]; w.route=legRoute(w,N); if(N.carry!==undefined) w.carry=N.carry; J.phase="walk"; J.t=0; continue; }
      }
      if(J.t>=L.dur){
        w.carry=null;
        if(J.hasView) CAMRET={view:J.prevView||"all", t:1.1};
        w.job=null;
        try{ J.cb&&J.cb(); }catch(e){ console.error(e); }
      }
    }
  }
}
function reachAmt(J){ const D=curLeg(J).dur, t=J.t-.15, e=D-.45; if(t<=0) return 0; return Math.min(1,t*2.6)*(J.t>e?Math.max(0,(D-J.t)/.45):1); }
/* ── 3D 표현 : 방진복 작업자 (human.js makeHuman · poseHuman) · 들고 가는 물건 ── */
let wkCarryMesh=function(kind){
  const G=new T3.Group();
  if(kind==="sts"){ const m=new T3.Mesh(new T3.CylinderGeometry(.2,.2,.42,28),M.ssMir); m.position.y=.21; G.add(m); }
  else if(kind==="roll"||kind==="rollP"){ const m=new T3.Mesh(new T3.CylinderGeometry(.19,.19,.86,32),kind==="rollP"?M.foilP:M.foil); m.rotation.z=Math.PI/2; G.add(m); }
  else if(kind==="bag"){ const m=new T3.Mesh(new T3.SphereGeometry(.14,18,12),new T3.MeshStandardMaterial({color:0xf4f6f7,roughness:.55})); m.scale.set(1,.9,.8); G.add(m); }
  else if(kind==="scoop"){ const m=new T3.Mesh(new T3.CylinderGeometry(.06,.05,.12,16),M.ss); G.add(m); }
  else if(kind==="cartons"){ const m=new T3.Mesh(new T3.BoxGeometry(.3,.16,.12),new T3.MeshStandardMaterial({color:0x9a1a14,roughness:.6})); G.add(m); }
  else if(kind==="leaf"){ const m=new T3.Mesh(new T3.BoxGeometry(.2,.06,.14),M.white); G.add(m); }
  else { const m=new T3.Mesh(new T3.BoxGeometry(.1,.14,.06),M.dark); G.add(m); }
  return G;
};
function wkDraw(dt){
  if(!V3) return;
  for(const w of WK){
    if(!w.m){ w.m=makeHuman(V3.scene,w.id==="F"?"suit":"wear"); w.cm={}; }
    const H=w.m; H.G.visible=!cam.fp;
    let da=w.face-w.yaw; da=Math.atan2(Math.sin(da),Math.cos(da)); w.yaw+=da*Math.min(1,dt*9);
    const f=[Math.sin(w.yaw),Math.cos(w.yaw)], lf=[Math.cos(w.yaw),-Math.sin(w.yaw)], J=w.job, LJ=J&&curLeg(J), work=J&&J.phase==="work"&&LJ.reach;
    const P={x:w.x,z:w.z,y0:w.y,yaw:w.yaw,dt,L:null,R:null};
    for(const k in w.cm) w.cm[k].visible=false;
    if(w.carry){ if(!w.cm[w.carry]){ w.cm[w.carry]=wkCarryMesh(w.carry); V3.scene.add(w.cm[w.carry]); }
      const c=w.cm[w.carry], hw=(w.carry==="roll"||w.carry==="rollP")?.2:w.carry==="sts"?.21:w.carry==="cartons"?.16:.08, cy=w.y+(w.carry==="sts"?.78:1.02);
      let cp=[w.x+f[0]*.36,cy+(w.carry==="sts"?.21:0),w.z+f[1]*.36];
      if(work&&reachAmt(J)>0){ const r=reachAmt(J), q=LJ.reach; cp=[cp[0]+(q[0]-cp[0])*r*.8,cp[1]+(q[1]-cp[1])*r*.8,cp[2]+(q[2]-cp[2])*r*.8]; }
      c.visible=!cam.fp; c.position.set(cp[0],cp[1]-(w.carry==="sts"?.21:0),cp[2]); c.rotation.y=w.yaw;
      P.L=[cp[0]+lf[0]*hw,cp[1],cp[2]+lf[1]*hw]; P.R=[cp[0]-lf[0]*hw,cp[1],cp[2]-lf[1]*hw]; P.gL=P.gR=.5; }
    else if(w.tow){ const T=TOW[w.tow], hy=T.hy, h=[w.x+f[0]*T.hd,hy,w.z+f[1]*T.hd]; P.L=[h[0]+lf[0]*.2,hy,h[2]+lf[1]*.2]; P.R=[h[0]-lf[0]*.2,hy,h[2]-lf[1]*.2]; P.gL=P.gR=.6; P.nL=P.nR="down"; P.lean=.04; }
    else if(work&&J.t>.12&&J.t<LJ.dur-.35){ P.R=LJ.reach.slice(); P.gR=.3; P.nR="down"; if(LJ.dur>2.2){ P.L=[LJ.reach[0]+lf[0]*.22,LJ.reach[1],LJ.reach[2]+lf[1]*.22]; P.gL=.3; P.nL="down"; } }
    poseHuman(H,P);
  }
  propsDraw(); if(typeof helpDraw==="function") helpDraw(dt);
}

/* ═══ 대차 · 드럼리프터 · 예비 은박 롤 · STS 용기 — 평소에는 교육 상태(S.f)에 맞춰 놓고, 작업자가 끌 때는 작업자 앞에서 따라옴 (11/16 사용자 지시) ═══
   대차 : 평소 빈 채로 예비 은박 옆 보관 → 교체 때 예비 롤을 올려 언와인더 남쪽까지 밀고 감 (롤은 적색 인쇄 · 은색 무지 2종)
   드럼리프터 : 북동 보관 자리에서 STS 용기(맨 동쪽 중앙 파렛트)의 주성분 봉투를 적재칸에 옮겨 담고 → 원료투입구 아래까지 밀고 가서 발판을 데크 높이로 올림 (11/16 사용자 정정)
   사용 후 [대차 · 리프터 원위치 복귀] 를 누르면 끌지 않고 자동으로 보관 자리로 돌아감 */
const TOW={ cart:{hd:.3, hy:.9, off:.56, rot:-Math.PI/2}, lift:{hd:.25, hy:.95, off:.75, rot:Math.PI/2} };   /* hd · hy : 손잡이 위치 (대차 손잡이 봉 0.9 m · 리프터 뒤 손잡이 0.95 m) */
const ROLLJOBS=["roll","rollMount","rollPlain"];
const PROP={ cartHome:[9.9,5.9,0], cartUnw:[4.62,3.62,Math.PI/2], liftHome:[10.75,1.8,Math.PI], liftUse:[3.53,4.6,0], platUp:1.83 };
const propVis=(k,v)=>{ if(typeof FILLPROP!=="undefined"&&FILLPROP[k]) FILLPROP[k].visible=v; };   /* 3D 가 없을 때(WebGL 미지원)도 절차가 멈추지 않게 */
function propObj(k){ return k==="cart"?FILLCART:FILLLIFT; }
function propsDraw(){
  if(typeof FILLCART==="undefined"||!FILLCART||!FILLLIFT||!S||!S.f) return;
  const towers={}; for(const w of WK) if(w.tow) towers[w.tow]=w;
  for(const k of ["cart","lift"]){ const G=propObj(k), w=towers[k];
    if(w){ const T=TOW[k], f=[Math.sin(w.yaw),Math.cos(w.yaw)]; G.position.set(w.x+f[0]*T.off,0,w.z+f[1]*T.off); G.rotation.y=w.yaw+T.rot; continue; }
    if(WK.some(q=>q.job&&q.job.legs&&(k==="cart"?ROLLJOBS.includes(q.job.key):q.job.key==="lift"))) continue;     /* 작업 중 놓아 둔 자리 유지 */
    const P=k==="cart"?(S.flags.cartAt==="unw"?PROP.cartUnw:PROP.cartHome):(S.flags.liftAt==="use"?PROP.liftUse:PROP.liftHome); G.position.set(P[0],0,P[1]); G.rotation.y=P[2]; }
  const busy=k=>WK.some(q=>q.job&&q.job.legs&&q.job.key===k);
  if(!FILLPROP.plat) return;
  if(!busy("lift")){ const u=S.flags.liftAt==="use"; FILLPROP.plat.position.y=u?PROP.platUp:0; FILLPROP.bagsOn.visible=u&&!!S.f.mainLift; FILLPROP.bagsIn.visible=!S.f.mainLift; }
  if(!ROLLJOBS.some(busy)){ const c=S.f.rollCarry; FILLPROP.cart_red.visible=c==="red"; FILLPROP.cart_plain.visible=c==="plain";
    FILLPROP.pal_red.visible=!S.flags.redTaken; FILLPROP.pal_plain.visible=!(S.f.roll==="plain"||c==="plain"); }
}
/* 대차로 예비 롤을 가지러 감 → 대차에 올려 언와인더 남쪽까지 (kind : "red" | "plain") */
function seqFetchRoll(kind){
  const P=FILLPROP, atUnw=S.flags.cartAt==="unw", L=[], pz=kind==="red"?5.95:6.45;
  if(atUnw){ L.push({stand:[4.62,4.18], reach:[4.62,.9,3.92], dur:.8, grab:"cart"}); L.push({stand:[9.54,6.05], path:[[4.62,4.9],[7.5,4.9],[8.6,6.05]], dur:.4, release:true}); }
  else { L.push({stand:[9.34,5.9], reach:[9.64,.9,5.9], dur:.8, grab:"cart"}); L.push({stand:[9.54,6.05], path:[], dur:.4, release:true}); }
  L.push({stand:[10.75,5.4], reach:[10.95,.45,pz], dur:1.8, on(){ propVis("pal_"+kind,false); if(kind==="red") S.flags.redTaken=true; }});
  L.push({stand:[9.54,6.05], carry:kind==="red"?"roll":"rollP", reach:[10.1,.85,6.05], dur:1.4, on(){ propVis("cart_"+kind,true); }});
  L.push({stand:[9.54,6.05], carry:null, path:[], reach:[9.84,.9,6.05], dur:.6, grab:"cart"});
  L.push({stand:[4.62,4.18], path:[[9.5,5.3],[7.5,4.9],[4.62,4.9]], dur:.5, release:true});
  return L;
}
/* 대차 위 롤을 언와인더에 장착 */
function seqMountRoll(kind){
  const P=FILLPROP;
  return [{stand:[4.62,4.18], reach:[4.62,.85,3.62], dur:1.4, on(){ propVis("cart_"+kind,false); }},
          {stand:[5.25,FL.zc+.15], path:[[5.3,4.3],[5.3,3.2]], carry:kind==="red"?"roll":"rollP", reach:ANC.roll, dur:2.4}];     /* 대차와 계단 사이 통로로 언와인더 동쪽까지 */
}
/* STS 용기의 주성분 봉투 2개를 리프터 적재칸(보관 자리)에 옮겨 담음 → 원료투입구 아래로 밀고 감 → 발판을 데크 높이로 올림 */
function seqLift(){
  const pick={stand:[11.2,2.58], reach:[11.2,.62,3.45], dur:1.5, on(){ }}, put=(n)=>({stand:[11.2,2.58], path:[], carry:"bag", reach:[11.2,.32,1.9], dur:1.2, on(){ const B=FILLPROP.bagsOn; if(B){ B.visible=true; B.children.forEach((c,i)=>c.visible=i<n); } if(n===2) propVis("bagsIn",false); }});
  if(S.flags.liftAt==="use") S.flags.liftAt="home"; const home=true;
  const L=[pick, put(1), Object.assign({},pick,{path:[], carry:null}), put(2)];
  if(home) L.push({stand:[10.0,1.8], carry:null, reach:[10.42,.95,1.8], dur:.8, grab:"lift"}, {stand:[4.28,4.6], path:[[8.0,2.0],[7.6,3.3],[7.5,4.85],[6.0,4.75]], dur:.5, release:true});
  L.push({stand:[4.1,5.25], path:[[4.3,5.25]], carry:null, reach:[3.85,1.0,4.75], dur:3.0, prog(q){ if(FILLPROP.plat) FILLPROP.plat.position.y=PROP.platUp*q*q*(3-2*q); }});
  return L;
}
/* 사용 후 원위치 복귀 (끌지 않고 자동) */
function propsReturn(){
  if(WK.some(w=>w.job&&["lift","roll","rollMount","rollPlain"].includes(w.job.key))){ toast("작업자가 대차 · 리프터를 사용 중입니다.","bad"); return; }
  if(S.f.rollCarry){ toast("대차 위 은박 롤을 먼저 장착하세요.","bad"); return; }
  const was=S.flags.cartAt==="unw"||S.flags.liftAt==="use"; S.flags.cartAt="home"; S.flags.liftAt="home";
  toast(was?"은박 교체 대차 · 드럼리프터 — 보관 자리로 원위치 (자동 복귀)":"이미 보관 자리에 있습니다.",was?"good":""); renderTiles();
}
function propsReset(){ for(const w of WK){ w.tow=null; w.job=null; w.route=[]; w.carry=null; } if(typeof helpReset==="function") helpReset(); if(typeof CV!=="undefined"&&CV.full){ CV.full.fill(0); CV.j0=null; } if(typeof PA!=="undefined") PA.live=true; if(typeof AN!=="undefined"&&AN.ld) AN.ld.fill(1); }   /* 새 세션 : 배출 컨베이어 비움 (11/16) */
Object.assign(JOBS,{ rollMount:{stand:[4.62,4.18], dur:1, view:"roll", seqFn:()=>seqMountRoll("red")},
  rollPlain:{stand:[9.34,5.9], dur:1, view:"roll", seqFn:()=>seqFetchRoll("plain").concat(seqMountRoll("plain"))} });
JOBS.roll.seqFn=()=>seqFetchRoll("red"); JOBS.lift.seqFn=seqLift;
/* 자재 타일 : 대차 · 리프터 원위치 복귀 (11/16 사용자 지시 — 끌지 않고 자동) */
TILE.rHome={e:"↩️",b:"대차 · 리프터 원위치",s:()=>(S.flags.cartAt==="unw"||S.flags.liftAt==="use")?"사용 후 복귀 누르기":"보관 위치",on:()=>!(S.flags.cartAt==="unw"||S.flags.liftAt==="use"),click(){ propsReturn(); }};
if(!TILESET.F.mat.includes("rHome")) TILESET.F.mat.splice(TILESET.F.mat.indexOf("mPlain")+1,0,"rHome");

/* ═══ V20 (11/16 사용자 선택) : IBC 진공호스 연결 · IPC 시료 채취 동작 · 2인 1조 보조 작업자 ═══ */
Object.assign(ANC,{ hoseS:[6.38,.1,2.22], hoseA:[6.38,.1,.8], ipcTake:[2.72,.45,2.3] });   /* 받침 호퍼 배출구(백당 · 첨가제) · 시료 채취 위치(슈트 아래 배출 컨베이어) */
Object.assign(WORKVIEW,{ hose:VW([4.5,1.7,1.5],[6.3,.25,1.5]), ipc:VW([3.4,2.3,3.9],[1.7,.7,1.6]) });
/* IBC 진공호스 : 백당(남) → 첨가제(북) 배출구에 호스를 끼우고 클램프 체결 (IBC 서쪽 통로에서 몸을 숙여 작업) */
function seqHose(){
  return [{stand:[5.85,2.22], reach:ANC.hoseS, dur:2.2, on(){ if(S.f.hoseC) S.f.hoseC[1]=true; }},
          {stand:[5.85,.8], path:[], reach:ANC.hoseA, dur:2.2, on(){ if(S.f.hoseC) S.f.hoseC[0]=true; }}];
}
/* IPC : 슈트 아래 배출 컨베이어에서 시료 파우치를 꺼냄 → 저울 작업대 1 로 가서 계량 */
function seqIpc(){
  return [{stand:[2.3,2.42], reach:ANC.ipcTake, dur:1.8},
          {stand:[1.05,.75], carry:"tray", reach:ANC.ipc, dur:2.6}];
}
Object.assign(JOBS,{ hose:{stand:[5.85,2.22], reach:ANC.hoseS, dur:2.2, view:"hose", seqFn:seqHose},
  ipc:{stand:[2.3,2.42], reach:ANC.ipcTake, dur:1.8, view:"ipc", seqFn:seqIpc} });
{ const base=wkCarryMesh; wkCarryMesh=function(kind){ if(kind!=="tray") return base(kind);       /* 시료 트레이 (파우치 몇 포) */
    const G=new T3.Group(), t=new T3.Mesh(new T3.BoxGeometry(.26,.025,.16),new T3.MeshStandardMaterial({color:0xe8edf0,roughness:.5})); G.add(t);
    for(let i=0;i<3;i++){ const s=new T3.Mesh(new T3.BoxGeometry(.2,.008,.03),M.foil); s.position.set(0,.017,-.045+i*.045); G.add(s); } return G; }; }

/* ── 2인 1조 보조 작업자 (충전실) : 은박 롤 운반 · 장착 · 교체 때 함께 움직임 ──
   · 주 작업자가 걸어간 길을 약 1 m 뒤에서 그대로 따라감 → 설비 · 벽을 통과하지 않음
   · 주 작업자가 작업 위치에 서면 옆자리(비어 있고 곧게 갈 수 있을 때)로 와서 롤 반대쪽 끝을 함께 잡음
   · 작업이 끝나면 대기 자리(저울 작업대 남쪽)로 돌아감 */
const PAIRJOBS=ROLLJOBS.concat(["rollOut"]);
const HELP={id:"F", x:.8, z:3.4, y:0, lvl:0, face:Math.PI/2, yaw:Math.PI/2, home:[.8,3.4], q:[], route:[], on:false, side:null, back:null, walking:false, m:null};
function floorFree(x,z){
  if(typeof fpObstacles!=="function") return true;
  if(!FP_OBS) FP_OBS=fpObstacles();
  if(!(x>RM.fill.x0+.25&&x<RM.fill.x1-.25&&z>RM.fill.z0+.25&&z<RM.fill.z1-.25)) return false;
  return !FP_OBS.some(r=>inR(x,z,r,.2))&&!propBlock(x,z);
}
const segFree=(a,b)=>{ for(let i=1;i<=8;i++){ const t=i/8; if(!floorFree(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t)) return false; } return true; };
/* 작업 위치 옆자리 : 좌 · 우 · 뒤 순으로, 주 작업자 0.45 m 뒤 지점에서 곧게 갈 수 있는 곳 */
function helpSide(w){
  const f=[Math.sin(w.face),Math.cos(w.face)], l=[Math.cos(w.face),-Math.sin(w.face)], H=HELP;
  let p=[w.x,w.z], acc=0; for(let i=H.q.length-1;i>=0;i--){ const q=H.q[i]; acc+=Math.hypot(q[0]-p[0],q[1]-p[1]); p=q; if(acc>=.45) break; }
  if(Math.hypot(p[0]-w.x,p[1]-w.z)<.3) p=[w.x-f[0]*.5,w.z-f[1]*.5];
  for(const c of [[w.x+l[0]*.68,w.z+l[1]*.68],[w.x-l[0]*.68,w.z-l[1]*.68],[w.x-f[0]*.75+l[0]*.3,w.z-f[1]*.75+l[1]*.3]])
    if(floorFree(c[0],c[1])&&floorFree(p[0],p[1])&&segFree(p,c)) return {c,p};
  return null;
}
function helpStep(H,pts,st){ while(st>1e-4&&pts.length){ const p=pts[0], dx=p[0]-H.x, dz=p[1]-H.z, d=Math.hypot(dx,dz);
    if(d>1e-3) H.face=Math.atan2(dx,dz); H.walking=true;
    if(d<=st){ H.x=p[0]; H.z=p[1]; st-=d; pts.shift(); } else { H.x+=dx/d*st; H.z+=dz/d*st; st=0; } } }
function helpTick(dt){
  const w=WK[0], H=HELP, pair=!!(w.job&&PAIRJOBS.includes(w.job.key))&&!cam.fp;
  H.walking=false;
  if(pair&&!H.on){ H.on=true; H.route=[]; H.side=null; H.q=navPath(H,[w.x,w.z],w.lvl).map(p=>[p[0],p[1]]); }
  if(!pair&&H.on){ H.on=false; H.side=null; H.q=[]; H.route=navPath(H,H.home,0).map(p=>[p[0],p[1]]); }
  if(H.on){
    const last=H.q[H.q.length-1]; if(!last||Math.hypot(last[0]-w.x,last[1]-w.z)>.05) H.q.push([w.x,w.z]);
    const LJ=curLeg(w.job), work=w.job.phase==="work"&&!w.route.length&&!!LJ.reach;
    if(work&&!H.side&&!H.noSide){ const s=helpSide(w); if(s){ H.side=s; const i=H.q.findIndex(q=>q[0]===s.p[0]&&q[1]===s.p[1]); H.sq=(i>=0?H.q.slice(0,i+1):[s.p]).concat([s.c]); } else H.noSide=true; }
    if(!work){ H.noSide=false; if(H.side){ H.q=[H.side.p,[w.x,w.z]]; H.side=null; } }
    if(H.side) helpStep(H,H.sq,dt*WK_SPD*1.2);
    else { let rem=0, px=H.x, pz=H.z; for(const p of H.q){ rem+=Math.hypot(p[0]-px,p[1]-pz); px=p[0]; pz=p[1]; }
      helpStep(H,H.q,Math.min(Math.max(0,rem-1.0),dt*WK_SPD*1.25));
      if(!H.walking&&Math.hypot(w.x-H.x,w.z-H.z)>.3) H.face=Math.atan2(w.x-H.x,w.z-H.z); }
    if(H.side&&!H.sq.length&&work){ const r=LJ.reach; H.face=Math.atan2(r[0]-H.x,r[2]-H.z); }
  } else if(H.route.length){ helpStep(H,H.route,dt*WK_SPD); if(!H.route.length) H.face=Math.PI/2; }
}
function helpDraw(dt){
  const H=HELP; if(!V3||!V3.scene) return;
  if(!H.m) H.m=makeHuman(V3.scene,"suit");
  H.m.G.visible=!cam.fp&&!!(S&&S.session&&S.session.active&&S.room==="F");
  let da=H.face-H.yaw; da=Math.atan2(Math.sin(da),Math.cos(da)); H.yaw+=da*Math.min(1,dt*9);
  const w=WK[0], J=w.job, LJ=J&&curLeg(J), P={x:H.x,z:H.z,y0:0,yaw:H.yaw,dt,L:null,R:null};
  if(H.on&&H.side&&!H.sq.length&&J&&J.phase==="work"&&LJ.reach){
    const roll=w.carry&&w.cm&&w.cm[w.carry]&&w.cm[w.carry].visible?w.cm[w.carry]:null, lf=[Math.cos(w.yaw),-Math.sin(w.yaw)];
    if(roll){ const c=roll.position, sg=((H.x-c.x)*lf[0]+(H.z-c.z)*lf[1])>0?1:-1;               /* 롤 반대쪽 끝을 두 손으로 받침 */
      P.L=[c.x+lf[0]*sg*.3,c.y,c.z+lf[1]*sg*.3]; P.R=[c.x+lf[0]*sg*.4,c.y,c.z+lf[1]*sg*.4]; P.gL=P.gR=.5; }
    else if(J.t>.15&&J.t<LJ.dur-.35){ const r=LJ.reach, d=Math.hypot(r[0]-H.x,r[2]-H.z); if(d<1.2){ const k=Math.min(.25,d*.3), u=[(H.x-r[0])/(d||1),(H.z-r[2])/(d||1)];
      P.R=[r[0]+u[0]*k,r[1],r[2]+u[1]*k]; P.gR=.3; P.nR="down"; } }
  }
  poseHuman(H.m,P);
}
function helpReset(){ const H=HELP; H.x=H.home[0]; H.z=H.home[1]; H.face=H.yaw=Math.PI/2; H.q=[]; H.route=[]; H.on=false; H.side=null; H.noSide=false; }
