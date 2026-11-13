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
  P:{n:{p0:[4.3,-.6,0],p1:[4.3,-2.4,0],p2:[4.3,-4.0,0],p3:[4.3,-6.0,0],p4:[4.3,-7.6,0],p5:[4.3,-9.0,0],p6:[4.6,-10.4,0]},
     e:"p0-p1 p1-p2 p2-p3 p3-p4 p4-p5 p5-p6"}
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
  const w=wkFor(j.stand);
  if(w.job) return false;
  w.route=navPath(w,j.stand,j.deck?1:0);
  w.job={key,j,cb,phase:"walk",t:0}; w.carry=j.carry||null;
  const v=j.view&&WORKVIEW[j.view];
  if(v&&R3.gl){ w.job.prevView=CAMRET?CAMRET.view:(cam.view==="work"?(S.room==="F"?"fill":"pack"):cam.view); CAMRET=null; w.job.hasView=true;
    cam.view="work"; cam.yawT=cam.yaw+Math.atan2(Math.sin(v.yaw-cam.yaw),Math.cos(v.yaw-cam.yaw)); cam.pitchT=v.pitch; cam.distT=v.dist; cam.txT=v.tx; cam.tyT=v.ty; cam.tzT=v.tz; }
  return true;
}
const WK_SPD=1.6;                               /* 보행 속도 m/s */
function wkTick(dt){
  if(CAMRET){ CAMRET.t-=dt; if(CAMRET.t<=0){ if(cam.view==="work"&&!WK.some(w=>w.job&&w.job.hasView)) camSet(CAMRET.view); CAMRET=null; } }
  for(const w of WK){
    w.walking=false;
    const tl=w.route.length?w.route[0][2]:w.lvl, up=w.lvl||tl, inDeck=w.x>FL.x0-FL.ext-.05&&w.x<FL.x1+.08&&w.z>FL.z0-.05&&w.z<FL.z1+.05;
    const ty=w.id==="F"&&onStairBand(w.x,w.z)&&!(w.lvl&&tl&&w.x<STR.x0)?STAIRY(w.x):(up&&inDeck?FL.deckY:0);
    w.y+=(ty-w.y)*Math.min(1,dt*12);
    if(w.route.length){
      const r=w.route[0], dx=r[0]-w.x, dz=r[1]-w.z, dd=Math.hypot(dx,dz), st=Math.min(dd,dt*WK_SPD);
      if(dd>.001){ w.x+=dx/dd*st; w.z+=dz/dd*st; w.walking=true; w.gait+=st/.62*Math.PI; w.face=Math.atan2(dx,dz); }
      if(dd-st<=.001){ w.lvl=r[2]; w.route.shift(); }
      continue;
    }
    const J=w.job;
    if(J){
      if(J.phase==="walk"){ J.phase="work"; J.t=0; }
      J.t+=dt;
      if(J.j.reach){ const r=J.j.reach; w.face=Math.atan2(r[0]-w.x,r[2]-w.z); }
      if(J.t>=J.j.dur){
        w.carry=null;
        if(J.hasView) CAMRET={view:J.prevView||"all", t:1.1};
        w.job=null;
        try{ J.cb&&J.cb(); }catch(e){ console.error(e); }
      }
    }
  }
}
function reachAmt(J){ const t=J.t-.15, e=J.j.dur-.45; if(t<=0) return 0; return Math.min(1,t*2.6)*(J.t>e?Math.max(0,(J.j.dur-J.t)/.45):1); }
/* ── 3D 표현 : 방진복 작업자 (pack_manual.js makeWorker) · 들고 가는 물건 ── */
function wkCarryMesh(kind){
  const G=new T3.Group();
  if(kind==="sts"){ const m=new T3.Mesh(new T3.CylinderGeometry(.2,.2,.42,28),M.ssMir); m.position.y=.21; G.add(m); }
  else if(kind==="roll"){ const m=new T3.Mesh(new T3.CylinderGeometry(.19,.19,.86,32),M.foil); m.rotation.z=Math.PI/2; G.add(m); }
  else if(kind==="scoop"){ const m=new T3.Mesh(new T3.CylinderGeometry(.06,.05,.12,16),M.ss); G.add(m); }
  else if(kind==="cartons"){ const m=new T3.Mesh(new T3.BoxGeometry(.3,.16,.12),new T3.MeshStandardMaterial({color:0x9a1a14,roughness:.6})); G.add(m); }
  else if(kind==="leaf"){ const m=new T3.Mesh(new T3.BoxGeometry(.2,.06,.14),M.white); G.add(m); }
  else { const m=new T3.Mesh(new T3.BoxGeometry(.1,.14,.06),M.dark); G.add(m); }
  return G;
}
function wkDraw(dt){
  if(!V3) return;
  for(const w of WK){
    if(!w.m){ w.m=makeWorker(V3.scene,w.x,w.z,w.face); w.cm={}; }
    const G=w.m.G; G.visible=!cam.fp;
    let da=w.face-w.yaw; da=Math.atan2(Math.sin(da),Math.cos(da)); w.yaw+=da*Math.min(1,dt*9);
    G.position.set(w.x,w.y,w.z); G.rotation.y=w.yaw;
    w.walk+=((w.walking?1:0)-w.walk)*Math.min(1,dt*8);
    const sw=Math.sin(w.gait)*.42*w.walk;
    w.m.legs[0].rotation.x=sw; w.m.legs[1].rotation.x=-sw;
    const J=w.job, work=J&&J.phase==="work"&&J.j.reach, r=work?reachAmt(J):0;
    if(w.carry){ setArms(w.m,1.15,.55); }
    else if(r>0){ const ry=J.j.reach[1]-w.y; setArms(w.m,.2+r*(ry>1.6?2.3:ry>1.1?1.45:ry>.7?.95:.6),.35*r); }
    else { for(const a of w.m.arms){ a.A.rotation.x=a.s*sw*.6; a.A.rotation.z=a.s*.08; a.F.rotation.x=-.15; } }
    for(const k in w.cm) w.cm[k].visible=false;
    if(w.carry){ if(!w.cm[w.carry]){ w.cm[w.carry]=wkCarryMesh(w.carry); G.add(w.cm[w.carry]); } const c=w.cm[w.carry]; c.visible=true; c.position.set(0,w.carry==="sts"?.62:1.02,.36); }
  }
}
