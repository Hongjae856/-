/* ═══════════════════════════════════════════════════════════════════
   작업자 공통 (세 IDT · 11/19 통합 3단계 · 파우치 workers.js 방식을 옮김)
   · 보행 속도 IDT_WALK (m/s) · 들고 가는 물건(종류별 모양 · 손 간격 · 들 높이) · 손에 든 자세 · 걷는 방향 바라보기
   · 장면 단위 m. 물건 모양은 IDT_CARRY 에 종류별로 등록 — IDT 고유 물건은 그 IDT 파일에서 idtCarryDef 로 추가
   · 크기는 추정값(현장 확인 전) — 파우치 은박 롤 · STS 용기는 파우치 도면 기준
   ═══════════════════════════════════════════════════════════════════ */
const IDT_WALK=1.4;
const IDT_CARRY={};
/* def = {mk:()=>THREE.Group 내용 채우기, hw:손 간격 반, y:가슴 앞 높이(바닥 기준), off:물건 중심 보정} */
function idtCarryDef(kind,def){ IDT_CARRY[kind]=Object.assign({hw:.08,y:1.02,off:0},def); }
function idtCarryMesh(kind){
  const G=new T3.Group(), d=IDT_CARRY[kind];
  if(d&&d.mk) d.mk(G); else G.add(new T3.Mesh(new T3.BoxGeometry(.1,.14,.06),M.dark));
  G.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); return G;
}
const _ckMat=(c,r)=>new T3.MeshStandardMaterial({color:c,roughness:r==null?.6:r});
const _ckAdd=(G,geo,mat,f)=>{ const m=new T3.Mesh(geo,mat); if(f) f(m); G.add(m); return m; };
/* ── 공통 물건 (세 IDT) ── */
idtCarryDef("sts",{hw:.21,y:.78,off:.21,mk:G=>_ckAdd(G,new T3.CylinderGeometry(.2,.2,.42,28),M.ssMir,m=>m.position.y=.21)});              /* STS 용기 (파우치) */
idtCarryDef("roll",{hw:.2,mk:G=>_ckAdd(G,new T3.CylinderGeometry(.19,.19,.86,32),M.foil,m=>m.rotation.z=Math.PI/2)});                       /* 은박 롤 (파우치) */
idtCarryDef("rollP",{hw:.2,mk:G=>_ckAdd(G,new T3.CylinderGeometry(.19,.19,.86,32),M.foilP,m=>m.rotation.z=Math.PI/2)});
idtCarryDef("bag",{hw:.15,mk:G=>_ckAdd(G,new T3.SphereGeometry(.14,18,12),_ckMat(0xf4f6f7,.55),m=>m.scale.set(1,.85,.7))});             /* 봉투 (주성분 · 캡) */
idtCarryDef("scoop",{mk:G=>_ckAdd(G,new T3.CylinderGeometry(.06,.05,.12,16),M.ss)});
idtCarryDef("cartons",{hw:.16,mk:G=>_ckAdd(G,new T3.BoxGeometry(.3,.16,.12),_ckMat(0x9a1a14))});
idtCarryDef("leaf",{mk:G=>_ckAdd(G,new T3.BoxGeometry(.2,.06,.14),M.white)});
idtCarryDef("box",{hw:.21,mk:G=>_ckAdd(G,new T3.BoxGeometry(.4,.25,.3),_ckMat(0xb98d5a,.85))});                                          /* 빈 병 박스 (병) */
idtCarryDef("reel",{hw:.09,mk:G=>{ _ckAdd(G,new T3.CylinderGeometry(.14,.14,.05,28),_ckMat(0x8a5a3a),m=>m.rotation.x=Math.PI/2); _ckAdd(G,new T3.CylinderGeometry(.04,.04,.055,16),M.dark,m=>m.rotation.x=Math.PI/2); }});
idtCarryDef("peRoll",{hw:.16,mk:G=>_ckAdd(G,new T3.CylinderGeometry(.1,.1,.3,28),_ckMat(0xdbe9f2,.35),m=>m.rotation.z=Math.PI/2)});      /* PE 필름 롤 (병) */
idtCarryDef("drum",{hw:.16,mk:G=>{ _ckAdd(G,new T3.CylinderGeometry(.15,.15,.34,28),_ckMat(0x4f84c8,.45)); _ckAdd(G,new T3.CylinderGeometry(.155,.155,.03,28),_ckMat(0x385f93,.45),m=>m.position.y=.18); }});
idtCarryDef("bottle",{hw:.03,mk:G=>{ _ckAdd(G,new T3.CylinderGeometry(.019,.019,.062,14),M.white,m=>m.position.y=.031); _ckAdd(G,new T3.CylinderGeometry(.016,.016,.014,14),_ckMat(0x2f6fc0,.4),m=>m.position.y=.069); }});
idtCarryDef("flat",{hw:.26,mk:G=>_ckAdd(G,new T3.BoxGeometry(.5,.02,.38),_ckMat(0xb98d5a,.85))});                                        /* 접힌 박스 */
idtCarryDef("sticker",{hw:.06,mk:G=>_ckAdd(G,new T3.BoxGeometry(.1,.002,.06),M.white)});                                                  /* 박스 라벨 */
idtCarryDef("labRoll",{hw:.12,mk:G=>_ckAdd(G,new T3.CylinderGeometry(.16,.16,.08,28),_ckMat(0xf3eef0))});
idtCarryDef("ribbon",{hw:.07,mk:G=>_ckAdd(G,new T3.CylinderGeometry(.04,.04,.11,16),M.dark,m=>m.rotation.z=Math.PI/2)});
idtCarryDef("leafRoll",{hw:.12,mk:G=>_ckAdd(G,new T3.CylinderGeometry(.26,.26,.07,32),_ckMat(0xeceeef),m=>m.rotation.x=Math.PI/2)});
idtCarryDef("agPaper",{hw:.07,mk:G=>_ckAdd(G,new T3.CylinderGeometry(.06,.06,.11,16),M.white,m=>m.rotation.z=Math.PI/2)});
idtCarryDef("film",{hw:.17,mk:G=>_ckAdd(G,new T3.CylinderGeometry(.17,.17,.3,28),_ckMat(0xe6eef2,.3),m=>m.rotation.z=Math.PI/2)});     /* 성형 필름 롤 (PTP) */
idtCarryDef("foil",{hw:.15,mk:G=>_ckAdd(G,new T3.CylinderGeometry(.13,.13,.28,28),M.foil,m=>m.rotation.z=Math.PI/2)});                  /* 커버 포일 롤 (PTP) */
idtCarryDef("part",{hw:.13,mk:G=>_ckAdd(G,new T3.BoxGeometry(.24,.08,.16),M.ss)});                                                         /* 교체부품 */
idtCarryDef("carton",{hw:.16,mk:G=>_ckAdd(G,new T3.BoxGeometry(.3,.12,.2),_ckMat(0xf2f1ec))});                                            /* 접힌 카톤 묶음 */
idtCarryDef("leaflet",{hw:.11,mk:G=>_ckAdd(G,new T3.BoxGeometry(.2,.06,.14),M.white)});
idtCarryDef("cases",{hw:.3,mk:G=>_ckAdd(G,new T3.BoxGeometry(.6,.03,.42),_ckMat(0xb98d5a,.85))});
idtCarryDef("tape",{hw:.07,mk:G=>_ckAdd(G,new T3.TorusGeometry(.06,.022,10,24),_ckMat(0xc9a46a,.5),m=>m.rotation.y=Math.PI/2)});
idtCarryDef("label",{hw:.07,mk:G=>_ckAdd(G,new T3.CylinderGeometry(.08,.08,.1,20),M.white,m=>m.rotation.z=Math.PI/2)});
/* 작업자마다 물건 한 벌씩 · 하나만 보이게 */
function idtItem(H,kind,scene){ H.items=H.items||{}; for(const k in H.items) H.items[k].visible=false; if(!kind) return null;
  if(!H.items[kind]){ H.items[kind]=idtCarryMesh(kind); scene.add(H.items[kind]); } const m=H.items[kind]; m.visible=true; m.rotation.set(0,0,0); return m; }
/* 손에 든 자세 : 물건 중심 cp, 손은 물건 양옆(작업자 좌우 방향) */
function idtHold(H,P,kind,cp,yaw,scene){ const m=idtItem(H,kind,scene); if(!m) return null; const d=IDT_CARRY[kind]||{hw:.08,off:0};
  m.position.set(cp[0],cp[1]-(d.off||0),cp[2]); m.rotation.y=yaw;
  const lf=[Math.cos(yaw),-Math.sin(yaw)], hw=d.hw||.08; P.L=[cp[0]+lf[0]*hw,cp[1],cp[2]+lf[1]*hw]; P.R=[cp[0]-lf[0]*hw,cp[1],cp[2]-lf[1]*hw]; P.gL=P.gR=.55; return m; }
/* 가슴 앞 위치 (걷는 동안) · 작업 중 손 목표로 r(0~1)만큼 옮김 */
function idtCarryPt(x,z,y0,yaw,kind,reach,r){ const d=IDT_CARRY[kind]||{y:1.02}, f=[Math.sin(yaw),Math.cos(yaw)];
  let cp=[x+f[0]*.36,(y0||0)+(d.y||1.02)+(d.off||0),z+f[1]*.36]; if(reach&&r>0) cp=cp.map((v,k)=>v+(reach[k]-v)*r*.8); return cp; }
/* 걷는 방향 바라보기 (위치만 받는 작업자) : 움직이면 진행 방향, 멈추면 face */
function idtFaceStep(H,x,z,dt,face){
  if(H.dx==null||Math.hypot(x-H.dx,z-H.dz)>6){ H.dx=x; H.dz=z; H.yw=face; H.vx=0; H.vz=0; }
  const ex=x-H.dx, ez=z-H.dz, k=Math.min(1,dt*10); H.dx=x; H.dz=z;
  if(dt>1e-4){ H.vx+=(ex/dt-H.vx)*k; H.vz+=(ez/dt-H.vz)*k; }
  const mv=Math.hypot(H.vx,H.vz)>.12, yt=mv?Math.atan2(H.vx,H.vz):face; let dy=yt-H.yw; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); H.yw+=dy*Math.min(1,dt*7);
  return {yaw:H.yw,moving:mv};
}
/* 작업 중 손 뻗기 정도 (0~1) : 작업 시작 0.15 초 뒤 뻗고, 끝나기 0.45 초 전에 거둠 */
const idtReachAmt=(t,dur)=>{ const a=t-.15, e=dur-.45; if(a<=0) return 0; return Math.min(1,a*2.6)*(t>e?Math.max(0,(dur-t)/.45):1); };
