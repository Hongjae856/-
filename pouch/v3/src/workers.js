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
function wkCarryMesh(kind){
  const G=new T3.Group();
  if(kind==="sts"){ const m=new T3.Mesh(new T3.CylinderGeometry(.2,.2,.42,28),M.ssMir); m.position.y=.21; G.add(m); }
  else if(kind==="roll"||kind==="rollP"){ const m=new T3.Mesh(new T3.CylinderGeometry(.19,.19,.86,32),kind==="rollP"?M.foilP:M.foil); m.rotation.z=Math.PI/2; G.add(m); }
  else if(kind==="scoop"){ const m=new T3.Mesh(new T3.CylinderGeometry(.06,.05,.12,16),M.ss); G.add(m); }
  else if(kind==="cartons"){ const m=new T3.Mesh(new T3.BoxGeometry(.3,.16,.12),new T3.MeshStandardMaterial({color:0x9a1a14,roughness:.6})); G.add(m); }
  else if(kind==="leaf"){ const m=new T3.Mesh(new T3.BoxGeometry(.2,.06,.14),M.white); G.add(m); }
  else { const m=new T3.Mesh(new T3.BoxGeometry(.1,.14,.06),M.dark); G.add(m); }
  return G;
}
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
  propsDraw();
}

/* ═══ 대차 · 드럼리프터 · 예비 은박 롤 · STS 용기 — 평소에는 교육 상태(S.f)에 맞춰 놓고, 작업자가 끌 때는 작업자 앞에서 따라옴 (11/16 사용자 지시) ═══
   대차 : 평소 빈 채로 예비 은박 옆 보관 → 교체 때 예비 롤을 올려 언와인더 남쪽까지 밀고 감 (롤은 적색 인쇄 · 은색 무지 2종)
   드럼리프터 : 북동 보관 → 원료투입구 아래(데크 남쪽 끝)까지 밀고 가서 STS 용기를 올리고 발판을 데크 높이로 올림 */
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
    const P=k==="cart"?(S.flags.cartAt==="unw"?PROP.cartUnw:PROP.cartHome):(S.f.mainLift?PROP.liftUse:PROP.liftHome); G.position.set(P[0],0,P[1]); G.rotation.y=P[2]; }
  const busy=k=>WK.some(q=>q.job&&q.job.legs&&q.job.key===k);
  if(!FILLPROP.plat) return;
  if(!busy("lift")){ FILLPROP.plat.position.y=S.f.mainLift?PROP.platUp:0; FILLPROP.stsOn.visible=!!S.f.mainLift; FILLPROP.stsFloor.visible=!S.f.mainLift; }
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
/* 드럼리프터를 원료투입구 아래로 밀고 가서 STS 용기를 올리고 발판을 올림 */
function seqLift(){
  const P=FILLPROP;
  return [{stand:[10.0,1.8], reach:[10.42,.82,1.8], dur:.8, grab:"lift"},
          {stand:[4.28,4.6], path:[[8.0,2.0],[7.6,3.3],[7.5,4.85],[6.0,4.75]], dur:.5, release:true},
          {stand:[2.1,6.0], path:[[4.3,5.5],[2.1,5.6]], reach:[2.1,.42,6.45], dur:1.6, on(){ propVis("stsFloor",false); }},
          {stand:[3.05,5.35], path:[], carry:"sts", reach:[3.05,.5,4.6], dur:1.6, on(){ propVis("stsOn",true); }},
          {stand:[4.1,5.25], path:[], carry:null, reach:[3.85,1.0,4.75], dur:3.0, prog(q){ if(FILLPROP.plat) FILLPROP.plat.position.y=PROP.platUp*q*q*(3-2*q); }}];
}
function propsReset(){ for(const w of WK){ w.tow=null; w.job=null; w.route=[]; w.carry=null; } }
Object.assign(JOBS,{ rollMount:{stand:[4.62,4.18], dur:1, view:"roll", seqFn:()=>seqMountRoll("red")},
  rollPlain:{stand:[9.34,5.9], dur:1, view:"roll", seqFn:()=>seqFetchRoll("plain").concat(seqMountRoll("plain"))} });
JOBS.roll.seqFn=()=>seqFetchRoll("red"); JOBS.lift.seqFn=seqLift;
