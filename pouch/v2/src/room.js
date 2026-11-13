/* ═══ 충전실 : 에폭시 바닥 · 클린룸 패널 벽 · 천장 조명 · 디퓨저 · 리턴 그릴 ═══ */
function buildFillRoom(S){
  const g=new T3.Group(), R=RM.fill, H=R.h; S.add(g);
  const fl=new T3.Mesh(new T3.PlaneGeometry(R.x1-R.x0,R.z1-R.z0),M.floor); fl.rotation.x=-Math.PI/2; fl.position.set((R.x0+R.x1)/2,0,(R.z0+R.z1)/2); fl.receiveShadow=true; g.add(fl);
  const ce=new T3.Mesh(new T3.PlaneGeometry(R.x1-R.x0,R.z1-R.z0),M.ceil); ce.rotation.x=Math.PI/2; ce.position.set((R.x0+R.x1)/2,H,(R.z0+R.z1)/2); g.add(ce);
  /* 벽 패널 (1.2 m 폭, 이음 알루미늄 몰딩, 바닥 코브) */
  const wall=(x0,z0,x1,z1,skip)=>{ const L=Math.hypot(x1-x0,z1-z0), n=Math.round(L/1.2), ax=(x1-x0)/L, az=(z1-z0)/L;
    const w=new T3.Mesh(new T3.BoxGeometry(L,H,.05),M.wall); w.position.set((x0+x1)/2,H/2,(z0+z1)/2); w.rotation.y=-Math.atan2(az,ax); w.receiveShadow=true; g.add(w);
    for(let i=1;i<n;i++){ const t=i/n, m=new T3.Mesh(new T3.BoxGeometry(.012,H,.062),M.alu); m.position.set(x0+(x1-x0)*t,H/2,z0+(z1-z0)*t); m.rotation.y=-Math.atan2(az,ax); g.add(m); }
    const cv=new T3.Mesh(new T3.CylinderGeometry(.05,.05,L,10,1,false,0,Math.PI/2),M.alu); cv.rotation.z=Math.PI/2; cv.position.set((x0+x1)/2,.0,(z0+z1)/2); cv.rotation.y=-Math.atan2(az,ax); g.add(cv); };
  /* 북쪽 벽 : 컨베이어 통과 개구부 (CVX ± .16 · 높이 0.98 ~ 1.62 · 위 줄 + 되돌아가는 아래 줄) 를 남기고 나눠 세움 */
  wall(R.x0,R.z0,CVX-.16,R.z0); wall(CVX+.16,R.z0,R.x1,R.z0);
  for(const [a,b] of [[0,.98],[1.62,H]]){ const m=new T3.Mesh(new T3.BoxGeometry(.32,b-a,.05),M.wall); m.position.set(CVX,(a+b)/2,R.z0); m.receiveShadow=true; g.add(m); }
  wall(R.x0,R.z1,R.x1,R.z1); wall(R.x0,R.z0,R.x0,R.z1); wall(R.x1,R.z0,R.x1,R.z1);
  /* 실 사이 벽기둥 · 상부 보 (경고 테이프) */
  bx(g,RM.pier-.13,RM.pier+.13,0,H,R.z0,R.z0+.6,M.wall); bx(g,RM.pier-.13,RM.pier+.13,0,H,R.z1-.65,R.z1,M.wall);
  bx(g,RM.pier-.13,RM.pier+.13,H-.55,H,R.z0+.6,R.z1-.65,M.wall); bx(g,RM.pier-.135,RM.pier+.135,H-.56,H-.47,R.z1-2.2,R.z1-1.2,M.haz);
  bx(g,COL.x0,COL.x1,0,H,COL.z0,COL.z1,M.wall);                               /* 건물 기둥 */
  /* 천장 : LED 평판등 · 원형 디퓨저 */
  for(const x of [1.4,3.6,7.6,9.9]) for(const z of [1.2,3.5,5.8]){ bx(g,x-.6,x+.6,H-.012,H-.004,z-.15,z+.15,M.led); bx(g,x-.63,x+.63,H-.01,H,z-.18,z+.18,M.alu); }
  for(const [x,z] of [[2.4,2.3],[4.9,5.0],[8.8,2.3],[8.8,5.0],[1.0,5.2]]){ const d=new T3.Mesh(new T3.CylinderGeometry(.2,.26,.03,28),M.ssMir); d.position.set(x,H-.015,z); g.add(d); const d2=new T3.Mesh(new T3.CylinderGeometry(.1,.14,.035,24),M.ss); d2.position.set(x,H-.03,z); g.add(d2); }
  /* 바닥 근처 공기 리턴 그릴 */
  const grille=(x,z,ry)=>{ const G=new T3.Group(); bx(G,-.3,.3,.12,.62,0,.02,M.ss); for(let i=0;i<9;i++) bx(G,-.26,.26,.16+i*.05,.185+i*.05,.02,.03,M.ssD); G.position.set(x,0,z); G.rotation.y=ry; g.add(G); };
  grille(.03,5.6,Math.PI/2); grille(R.x1-.03,4.6,-Math.PI/2); grille(9.5,R.z0+.03,0); grille(RM.pier+.14,.3,Math.PI/2);
  /* 조명 */
  S.add(new T3.HemisphereLight(0xf4f7ff,0x8a8e86,.22));
  const key=new T3.DirectionalLight(0xffffff,.95); key.position.set(4.6,H+3,5.2); key.target.position.set(4.2,0,2.7); key.castShadow=true; key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-7,right:8,top:6,bottom:-6,near:.5,far:14}); key.shadow.bias=-.0004; key.shadow.normalBias=.02; key.shadow.radius=4; S.add(key); S.add(key.target);
  for(const [x,z] of [[2.2,3],[8.6,3.4]]){ const p=new T3.PointLight(0xfff8ee,.22,9,1.6); p.position.set(x,H-.3,z); S.add(p); }
  return g;
}
