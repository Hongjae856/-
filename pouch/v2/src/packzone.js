/* ═══ 포장실 : 스틱공급장치 → 카토너(설명서 공급장치 · 핫멜트) → 케이스 프린터 · 비전 → X-ray → 중량선별기 → 배출함 2
       → 대케이스 잉크젯 프린터 → 녹색 벨트 작업대 — DRAWING.md 7절 · 라인 중심 x=CVX, 남 → 북, 작업자 통로 동쪽 ═══ */
const PKZ={ sf:[-1.95,-.25], ct:[-5.4,-2.05], pr:[-6.5,-5.55], xr:[-7.7,-6.7], cw:[-8.6,-7.8], bin:-8.85, cp:[-10.4,-9.1], tb:[-11.9,-10.45], y:.92 };
function buildPackRoom(S){
  const g=new T3.Group(); S.add(g); const R=RM.pack, H=R.h, X=CVX, P=PKZ;
  const fl=new T3.Mesh(new T3.PlaneGeometry(R.x1-R.x0,R.z1-R.z0),M.floor); fl.rotation.x=-Math.PI/2; fl.position.set((R.x0+R.x1)/2,0,(R.z0+R.z1)/2); fl.receiveShadow=true; g.add(fl);
  const ce=new T3.Mesh(new T3.PlaneGeometry(R.x1-R.x0,R.z1-R.z0),M.ceil); ce.rotation.x=Math.PI/2; ce.position.set((R.x0+R.x1)/2,H,(R.z0+R.z1)/2); g.add(ce);
  const wall=(x0,z0,x1,z1)=>{ const L=Math.hypot(x1-x0,z1-z0), n=Math.round(L/1.2), ry=-Math.atan2(z1-z0,x1-x0); const w=new T3.Mesh(new T3.BoxGeometry(L,H,.05),M.wall); w.position.set((x0+x1)/2,H/2,(z0+z1)/2); w.rotation.y=ry; w.receiveShadow=true; g.add(w);
    for(let i=1;i<n;i++){ const t=i/n, m=new T3.Mesh(new T3.BoxGeometry(.012,H,.062),M.alu); m.position.set(x0+(x1-x0)*t,H/2,z0+(z1-z0)*t); m.rotation.y=ry; g.add(m); } };
  wall(R.x0,R.z0,R.x1,R.z0); wall(R.x0,R.z0,R.x0,R.z1); wall(R.x1,R.z0,R.x1,R.z1); wall(RM.fill.x1>R.x1?R.x1:R.x1,R.z1-.03,R.x1,R.z1-.03);
  for(const x of [1.3,3.6,6.2]) for(const z of [-1.5,-4.2,-7,-9.8]){ bx(g,x-.6,x+.6,H-.012,H-.004,z-.15,z+.15,M.led); bx(g,x-.63,x+.63,H-.01,H,z-.18,z+.18,M.alu); }
  for(const [x,z] of [[2.4,-3],[5,-6],[2.4,-9],[6,-10.5]]){ const d=new T3.Mesh(new T3.CylinderGeometry(.2,.26,.03,28),M.ssMir); d.position.set(x,H-.015,z); g.add(d); }
  const key=new T3.DirectionalLight(0xffffff,.9); key.position.set(5.5,H+3,-5); key.target.position.set(2.6,0,-6); key.castShadow=true; key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.5,far:14}); key.shadow.bias=-.0004; key.shadow.normalBias=.02; S.add(key); S.add(key.target);
  /* 북쪽 출입문 · 유리창(충전실 쪽 벽) 포장실 면 · 인터폰 · 에어건 */
  bx(g,6.4,7.4,0,2.15,R.z0+.03,R.z0+.05,M.white); bx(g,6.7,7.1,1.2,1.8,R.z0+.05,R.z0+.055,M.dark);
  for(const x0 of [X-1.25,X+.3]) for(const [a,b,c,d] of [[x0-.04,x0+.99,1.01,1.05],[x0-.04,x0+.99,2.15,2.19],[x0-.04,x0,1.01,2.19],[x0+.95,x0+.99,1.01,2.19]]) bx(g,a,b,c,d,-.045,-.02,M.alu);
  bx(g,X+1.4,X+1.5,1.35,1.6,-.06,-.026,M.white);
  const beacon=(x,y,z)=>{ rod(g,[x,y,z],[x,y+.35,z],.012,M.ssMir); for(const [k,m] of [[0,M.green],[1,M.yellow],[2,M.red]]) rod(g,[x,y+.35+k*.06,z],[x,y+.41+k*.06,z],.03,m,18); };
  const legs=(x0,x1,z0,z1,h)=>{ for(const x of [x0,x1]) for(const z of [z0,z1]){ bx(g,x-.025,x+.025,.04,h,z-.025,z+.025,M.ss); foot(g,x,z,.04,.02); } };
  const acry=(x0,x1,y0,y1,z0,z1)=>bx(g,x0,x1,y0,y1,z0,z1,M.acryl);
  buildStickFeeder(g); buildCartoner(g); buildInspection(g);
  return g;
}
