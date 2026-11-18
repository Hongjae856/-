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
/* 걸음 방향 (P6) : 앱은 위치만 줌(걸음 속도 · 작업 시간은 앱 그대로 — 포장라인 0.9 m/s, 걷는 동안 작업 시간 정지)
   → 걷는 동안에는 진행 방향을 보고 손을 뻗지 않으며, 멈추면 설비 쪽(-z)으로 몸을 돌림 */
function crew3Step(H,x,z,dt){
  if(H.dx==null||Math.hypot(x-H.dx,z-H.dz)>6){ H.dx=x; H.dz=z; H.yw=Math.PI; H.v=0; H.vx=0; H.vz=0; }
  const ex=x-H.dx, ez=z-H.dz, k=Math.min(1,dt*10); H.dx=x; H.dz=z;
  if(dt>1e-4){ H.vx+=(ex/dt-H.vx)*k; H.vz+=(ez/dt-H.vz)*k; }
  const mv=Math.hypot(H.vx,H.vz)>.12, yt=mv?Math.atan2(H.vx,H.vz):Math.PI; let dy=yt-H.yw; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); H.yw+=dy*Math.min(1,dt*7);
  return {x,z,yaw:H.yw,moving:mv};
}
/* 들고 가는 자재 (11/18 파우치 기준 · 크기는 추정) — 걷는 동안 가슴 앞, 작업 중 손을 작업 지점으로 뻗어 놓음 */
function crew3Mesh(kind){
  const G=new T3.Group(), mat=(c,r)=>new T3.MeshStandardMaterial({color:c,roughness:r==null?.6:r}), add=m=>{ m.castShadow=true; G.add(m); return m; };
  if(kind==="film") add(new T3.Mesh(new T3.CylinderGeometry(.17,.17,.3,28),mat(0xe6eef2,.3))).rotation.z=Math.PI/2;            /* 성형 필름 롤 */
  else if(kind==="foil") add(new T3.Mesh(new T3.CylinderGeometry(.13,.13,.28,28),M.foil||mat(0xcfd3d8,.25))).rotation.z=Math.PI/2;   /* 커버 포일 롤 */
  else if(kind==="part") add(new T3.Mesh(new T3.BoxGeometry(.24,.08,.16),M.ss||mat(0xb8bec4,.3)));                        /* 교체부품 */
  else if(kind==="carton") add(new T3.Mesh(new T3.BoxGeometry(.3,.12,.2),mat(0xf2f1ec)));                                    /* 접힌 카톤 묶음 */
  else if(kind==="leaflet") add(new T3.Mesh(new T3.BoxGeometry(.2,.06,.14),M.white));
  else if(kind==="cases") add(new T3.Mesh(new T3.BoxGeometry(.6,.03,.42),mat(0xb98d5a,.85)));                                 /* 접힌 박스 */
  else if(kind==="tape"){ const m=add(new T3.Mesh(new T3.TorusGeometry(.06,.022,10,24),mat(0xc9a46a,.5))); m.rotation.y=Math.PI/2; }
  else if(kind==="label") add(new T3.Mesh(new T3.CylinderGeometry(.08,.08,.1,20),M.white)).rotation.z=Math.PI/2;
  G.visible=false; V3P.sc.add(G); return G;
}
function crew3Item(H,kind){ H.items=H.items||{}; for(const k in H.items) H.items[k].visible=false; if(!kind) return null; if(!H.items[kind]) H.items[kind]=crew3Mesh(kind); H.items[kind].visible=true; return H.items[kind]; }
function crew3Hold(H,P,kind,cp,hw,yaw){ const m=crew3Item(H,kind); if(!m) return; m.position.set(cp[0],cp[1],cp[2]); m.rotation.y=yaw;
  const lf=[Math.cos(yaw),-Math.sin(yaw)]; P.L=[cp[0]+lf[0]*hw,cp[1],cp[2]+lf[1]*hw]; P.R=[cp[0]-lf[0]*hw,cp[1],cp[2]-lf[1]*hw]; P.gL=P.gR=.55; }
const CREW3_LK={carton:"carton",leaflet:"leaflet",cases:"cases",tape:"tape",label:"label"}, CREW3_HW={film:.17,foil:.15,part:.13,carton:.16,leaflet:.11,cases:.3,tape:.07,label:.07};
function crew3Tick(dt){
  const fw=UNI_HUB.win("filler"), lw=UNI_HUB.win("line"), L=ROOMBUS.L, fp=V3P.view!=="orbit";
  { const f=fw&&fw.PTP_WKF, H=CREW3.F, me=fp&&WALK.room==="F";
    if(f&&!me){ H.G.visible=true; const q=crew3Step(H,(4*f.x-3680)*MM,(4*f.z+L.fillerZ)*MM,dt), fwd=[Math.sin(q.yaw),Math.cos(q.yaw)];
      const tg=f.both&&f.target?[(4*f.target.x-3680)*MM,(4*f.target.y+1128)*MM,(4*f.target.z+L.fillerZ)*MM]:null;
      const kind=f.key?(f.key==="film"||f.key==="foil"?f.key:"part"):null, P={x:q.x,z:q.z,yaw:q.yaw,dt,L:null,R:null,gL:.3,gR:.3,nL:"down",nR:"down"};
      if(kind&&(q.moving||(f.ph||0)<.15)){ let cp=[q.x+fwd[0]*.36,1.02,q.z+fwd[1]*.36]; if(!q.moving&&tg){ const r=Math.min(1,(f.reach||0)*1.4); cp=cp.map((v,k)=>v+(tg[k]-v)*r*.85); } crew3Hold(H,P,kind,cp,CREW3_HW[kind],q.yaw); }
      else { crew3Item(H,null); if(!q.moving&&tg){ P.L=[tg[0]-.1,tg[1],tg[2]]; P.R=[tg[0]+.1,tg[1],tg[2]]; } }
      poseHuman(H,P); }
    else { H.G.visible=false; H.dx=null; crew3Item(H,null); } }
  const W=(lw&&lw.PTP_WK)||[];
  CREW3.P.forEach((H,i)=>{ const w=W[i], me=fp&&WALK.room==="P"&&i===0; H.G.visible=!!w&&!me; if(!H.G.visible){ H.dx=null; crew3Item(H,null); return; }
    const q=crew3Step(H,(8000+5*w.x)*MM,(5*(w.z+((lw.S&&lw.S.doorT)||0)*120))*MM,dt), work=w.job==="work"&&!q.moving, fwd=[Math.sin(q.yaw),Math.cos(q.yaw)];
    const kind=w.job==="work"?CREW3_LK[w.key]:null, P={x:q.x,z:q.z,yaw:q.yaw,dt,L:null,R:null,gL:.3,gR:.3,nL:"down",nR:"down"};
    if(kind&&(q.moving||(w.workPhase||0)<.7)){ const r=q.moving?0:Math.min(1,(w.workPhase||0)/.5); crew3Hold(H,P,kind,[q.x+fwd[0]*(.36+.1*r),1.02+.05*r,q.z+fwd[1]*(.36+.1*r)],CREW3_HW[kind],q.yaw); }
    else { crew3Item(H,null); if(work){ P.L=[q.x-.18,1.02,q.z-.42]; P.R=[q.x+.18,1.02,q.z-.42]; } }
    poseHuman(H,P); });
}
