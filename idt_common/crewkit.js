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

/* ═══ 운반 보조기구 · 2인 1조 · 붓기 · 실제 지점 손 뻗기 (11/19 사용자 지시 "다 통일해" · 파우치 방식을 세 IDT 공통으로) ═══
   · 대차 · 드럼리프터 모델 = 파우치 충전실 모델 그대로 (pouch/v2/src/fillzone.js 에서 옮김 · 크기 단위 m)
   · 끌기 자세 IDT_TOW : hd 손잡이 앞 거리 · hy 손잡이 높이 · off 작업자→기구 중심 거리 · rot 기구 회전
   · 보조 작업자 : 주 작업자(또는 1인칭 플레이어)가 걸어간 길을 약 1 m 뒤에서 따라가고, 작업 위치에 서면 옆자리로 와서 물건 반대쪽을 함께 잡음 */
const IDT_TOW={ cart:{hd:.3, hy:.9, off:.56, rot:-Math.PI/2}, lift:{hd:.25, hy:.95, off:.75, rot:Math.PI/2} };
/* 은박 · 필름 롤 교체 대차 (스테인리스 틀 · 캐스터 · 받침 롤러 · 손잡이) — 받침 롤러 윗면 약 0.68 m */
function idtCartBuild(G){
  for(const x of [-.2,.2]) for(const z of [-.42,.42]){ bx(G,x-.02,x+.02,.09,.62,z-.02,z+.02,M.ss); rod(G,[x,.045,z],[x,.045,z+.03],.045,M.dark,16); bx(G,x-.015,x+.015,.07,.1,z-.015,z+.015,M.ssD); }
  for(const y of [.2,.6]){ for(const z of [-.42,.42]) bx(G,-.2,.2,y,y+.03,z-.015,z+.015,M.ss); for(const x of [-.2,.2]) bx(G,x-.015,x+.015,y,y+.03,-.42,.42,M.ss); }
  for(const x of [-.09,.09]) rod(G,[x,.65,-.44],[x,.65,.44],.03,M.dark,16); rod(G,[-.26,.9,-.42],[-.26,.9,.42],.012,M.ssMir,10); for(const z of [-.42,.42]) rod(G,[-.2,.62,z],[-.26,.9,z],.012,M.ssMir,10);
  return G;
}
/* 드럼리프터 (높은 마스트 · 승강 발판(난간) · 뒤쪽 구동함 · 빨간 캐스터) — 승강 발판 그룹을 돌려줌 (발판 윗면 0.165 m, LP.position.y 로 올림) */
function idtLifterBuild(LG,mh){
  const x=0, z=0; mh=mh||3.1;
  for(const s of [-1,1]) bx(LG,x-.05,x+.05,.1,mh,z+s*.27-.04,z+s*.27+.04,M.ss); bx(LG,x-.01,x+.01,.5,mh,z-.23,z+.23,M.ss); bx(LG,x-.06,x+.06,mh-.06,mh,z-.31,z+.31,M.ss); bx(LG,x-.07,x+.4,.06,.12,z-.33,z+.33,M.ssD);
  rrect(LG,x+.3,z,.2,.26,.05,.12,.78,M.ss); rod(LG,[x+.3,.78,z-.1],[x+.3,.82,z-.1],.014,M.red,10); tube(LG,[[x+.12,.7,z+.1],[x+.1,1.1,z+.14],[x+.08,1.5,z+.1],[x+.06,1.9,z+.12]],.012,M.dark);
  rod(LG,[x+.52,.95,z-.2],[x+.52,.95,z+.2],.012,M.ssMir,10); for(const s of [-1,1]) rod(LG,[x+.48,.78,z+s*.2],[x+.52,.95,z+s*.2],.012,M.ssMir,10);
  const LP=new T3.Group(); LG.add(LP);
  bx(LP,x-.9,x-.05,.14,.165,z-.36,z+.36,M.ssMir); bx(LP,x-.9,x-.05,.1,.14,z-.36,z+.36,M.ss);
  for(const s of [-1,1]){ rod(LP,[x-.86,.165,z+s*.34],[x-.86,.5,z+s*.34],.012,M.ssMir); rod(LP,[x-.12,.165,z+s*.34],[x-.12,.5,z+s*.34],.012,M.ssMir); rod(LP,[x-.86,.5,z+s*.34],[x-.12,.5,z+s*.34],.012,M.ssMir); rod(LP,[x-.86,.33,z+s*.34],[x-.12,.33,z+s*.34],.008,M.ssMir); }
  for(const [dx,dz] of [[-.8,-.3],[-.8,.3],[.3,-.26],[.3,.26]]) { const c=new T3.Mesh(new T3.CylinderGeometry(.055,.055,.04,20),M.red); c.rotation.x=Math.PI/2; c.position.set(x+dx,.055,z+dz); add(LG,c); bx(LG,x+dx-.02,x+dx+.02,.06,.1,z+dz-.03,z+dz+.03,M.ssD); }
  return LP;
}
/* 끌기 : 기구를 작업자 앞에 두고(idtTowPlace) 양손은 손잡이(idtTowPose) */
function idtTowPlace(G,x,z,yaw,T){ const f=[Math.sin(yaw),Math.cos(yaw)]; G.position.set(x+f[0]*T.off,G.position.y,z+f[1]*T.off); G.rotation.y=yaw+T.rot; }
function idtTowPose(P,x,z,yaw,T,y0){ const f=[Math.sin(yaw),Math.cos(yaw)], lf=[Math.cos(yaw),-Math.sin(yaw)], hy=(y0||0)+T.hy, h=[x+f[0]*T.hd,hy,z+f[1]*T.hd];
  P.L=[h[0]+lf[0]*.2,hy,h[2]+lf[1]*.2]; P.R=[h[0]-lf[0]*.2,hy,h[2]-lf[1]*.2]; P.gL=P.gR=.6; P.nL=P.nR="down"; P.lean=.04; }
/* 실제 설비 표면 손 목표 : 가슴 앞으로 광선을 쏴 처음 닿는 면(max 안) — 없으면 null. ex = 제외할 객체(작업자 · 들고 있는 물건) */
const _ckRay=typeof THREE!=="undefined"?new THREE.Raycaster():null;
function idtReachSurface(scene,ex,x,z,yaw,y,max){
  if(!_ckRay||!scene) return null; _ckRay.set(new T3.Vector3(x,y,z),new T3.Vector3(Math.sin(yaw),0,Math.cos(yaw))); _ckRay.far=max||.9;
  for(const h of _ckRay.intersectObjects(scene.children,true)){ let o=h.object, skip=!o.visible; while(o&&!skip){ if(ex.includes(o)) skip=true; o=o.parent; } if(!skip) return [h.point.x,h.point.y,h.point.z]; }
  return null;
}
/* 붓기 흐름 : 용기 입구(cp) → 투입구(to) 알갱이 10 개 (병 · 정제 · 캡 · 주성분) */
function idtPour(H,scene,on,cp,to,t){
  if(!H.pour){ H.pour=[]; for(let i=0;i<10;i++){ const m=new T3.Mesh(new T3.SphereGeometry(.012,8,6),M.white); m.visible=false; scene.add(m); H.pour.push(m); } }
  H.pour.forEach((m,i)=>{ m.visible=!!on; if(!on) return; const u=((t*2.2+i/10)%1);
    m.position.set(cp[0]+(to[0]-cp[0])*u, cp[1]+.08+(to[1]-cp[1]-.08)*u+Math.sin(u*Math.PI)*.03, cp[2]+(to[2]-cp[2])*u); });
}
/* ── 2인 1조 보조 작업자 (파우치 HELP 를 공통으로) ──
   o = {home:[x,z], face, free(x,z)→bool, nav(H,[x,z])→[[x,z]…] (없으면 곧게), spd}
   lead = {x, z, face} (주 작업자 또는 1인칭 플레이어) · pair = 함께 움직일 때 · work = 주 작업자가 작업 위치에서 작업 중 · reach = 손 목표 [x,y,z] */
function idtHelperNew(o){ return Object.assign({x:o.home[0], z:o.home[1], face:o.face||0, yaw:o.face||0, q:[], route:[], sq:[], on:false, side:null, noSide:false, walking:false, m:null}, {o}); }
function idtHelpStep(H,pts,st){ while(st>1e-4&&pts.length){ const p=pts[0], dx=p[0]-H.x, dz=p[1]-H.z, d=Math.hypot(dx,dz);
    if(d>1e-3) H.face=Math.atan2(dx,dz); H.walking=true;
    if(d<=st){ H.x=p[0]; H.z=p[1]; st-=d; pts.shift(); } else { H.x+=dx/d*st; H.z+=dz/d*st; st=0; } } }
const _ckSeg=(free,a,b)=>{ for(let i=1;i<=8;i++){ const t=i/8; if(!free(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t)) return false; } return true; };
/* 작업 위치 옆자리 : 좌 · 우 · 뒤 순으로, 주 작업자 0.45 m 뒤 지점에서 곧게 갈 수 있는 곳 */
function idtHelpSide(H,lead){
  const free=H.o.free||(()=>true), f=[Math.sin(lead.face),Math.cos(lead.face)], l=[Math.cos(lead.face),-Math.sin(lead.face)];
  let p=[lead.x,lead.z], acc=0; for(let i=H.q.length-1;i>=0;i--){ const q=H.q[i]; acc+=Math.hypot(q[0]-p[0],q[1]-p[1]); p=q; if(acc>=.45) break; }
  if(Math.hypot(p[0]-lead.x,p[1]-lead.z)<.3) p=[lead.x-f[0]*.5,lead.z-f[1]*.5];
  for(const c of [[lead.x+l[0]*.68,lead.z+l[1]*.68],[lead.x-l[0]*.68,lead.z-l[1]*.68],[lead.x-f[0]*.75+l[0]*.3,lead.z-f[1]*.75+l[1]*.3]])
    if(free(c[0],c[1])&&free(p[0],p[1])&&_ckSeg(free,p,c)) return {c,p};
  return null;
}
function idtHelperTick(H,lead,pair,work,reach,dt){
  const spd=H.o.spd||IDT_WALK, nav=H.o.nav||((h,to)=>[to]);
  H.walking=false;
  if(pair&&!H.on){ H.on=true; H.route=[]; H.side=null; H.q=nav(H,[lead.x,lead.z]).map(p=>[p[0],p[1]]); }
  if(!pair&&H.on){ H.on=false; H.side=null; H.q=[]; H.route=nav(H,H.o.home).map(p=>[p[0],p[1]]); }
  if(H.on){
    const last=H.q[H.q.length-1]; if(!last||Math.hypot(last[0]-lead.x,last[1]-lead.z)>.05) H.q.push([lead.x,lead.z]);
    if(work&&!H.side&&!H.noSide){ const s=idtHelpSide(H,lead); if(s){ H.side=s; const i=H.q.findIndex(q=>q[0]===s.p[0]&&q[1]===s.p[1]); H.sq=(i>=0?H.q.slice(0,i+1):[s.p]).concat([s.c]); } else H.noSide=true; }
    if(!work){ H.noSide=false; if(H.side){ H.q=[H.side.p,[lead.x,lead.z]]; H.side=null; } }
    if(H.side) idtHelpStep(H,H.sq,dt*spd*1.2);
    else { let rem=0, px=H.x, pz=H.z; for(const p of H.q){ rem+=Math.hypot(p[0]-px,p[1]-pz); px=p[0]; pz=p[1]; }
      idtHelpStep(H,H.q,Math.min(Math.max(0,rem-1.0),dt*spd*1.25));
      if(!H.walking&&Math.hypot(lead.x-H.x,lead.z-H.z)>.3) H.face=Math.atan2(lead.x-H.x,lead.z-H.z); }
    if(H.side&&!H.sq.length&&work&&reach) H.face=Math.atan2(reach[0]-H.x,reach[2]-H.z);
  } else if(H.route.length){ idtHelpStep(H,H.route,dt*spd); if(!H.route.length) H.face=H.o.face||0; }
}
const idtHelperAtSide=H=>!!(H.on&&H.side&&!H.sq.length);
/* 보조 작업자 자세 : item(들고 있는 물건 메시)이 있으면 반대쪽 끝을 두 손으로 받침, 없으면 작업 지점 가까이 한 손 */
function idtHelperPose(H,P,leadYaw,item,reach,act){
  if(!idtHelperAtSide(H)) return;
  const lf=[Math.cos(leadYaw),-Math.sin(leadYaw)];
  if(item){ const c=item.position, sg=((H.x-c.x)*lf[0]+(H.z-c.z)*lf[1])>0?1:-1;
    P.L=[c.x+lf[0]*sg*.3,c.y,c.z+lf[1]*sg*.3]; P.R=[c.x+lf[0]*sg*.4,c.y,c.z+lf[1]*sg*.4]; P.gL=P.gR=.5; }
  else if(act&&reach){ const r=reach, d=Math.hypot(r[0]-H.x,r[2]-H.z); if(d<1.2){ const k=Math.min(.25,d*.3), u=[(H.x-r[0])/(d||1),(H.z-r[2])/(d||1)];
      P.R=[r[0]+u[0]*k,r[1],r[2]+u[1]*k]; P.gR=.3; P.nR="down"; } }
}

/* ═══ 보이는 작업자 걷기 (위치만 주는 앱 작업자 · 11/20 "다 통일해") ═══
   앱이 주는 자리(want)에서 가장 가까운 빈 바닥을 찾아(idtNearFree), 설비를 돌아가는 길(idtGridPath · 격자 A*)로 1.4 m/s 걸음
   free(x,z) : 그 IDT 의 바닥 판정(m) · 도착 전에는 앱 작업 시간을 멈춤(앱 쪽 HOLD 연결) */
function idtNearFree(free,x,z,maxR,pref){
  if(free(x,z)) return [x,z]; pref=pref||[0,1];
  for(let r=.1;r<=(maxR||1.5)+1e-6;r+=.1){ let best=null, bs=-1e9;
    for(let a=0;a<24;a++){ const q=a/24*Math.PI*2, px=x+Math.cos(q)*r, pz=z+Math.sin(q)*r; if(!free(px,pz)) continue; const sc=Math.cos(q)*pref[0]+Math.sin(q)*pref[1]; if(sc>bs){ bs=sc; best=[px,pz]; } }
    if(best) return best; }
  return null;
}
function idtGridPath(free,a,b,step,maxN){
  step=step||.1; maxN=maxN||20000; const K=(i,k)=>i+","+k, gi=v=>Math.round(v/step);
  const si=gi(a[0]), sk=gi(a[1]), ti=gi(b[0]), tk=gi(b[1]); if(si===ti&&sk===tk) return [b];
  const open=new Map(), came=new Map(), g=new Map(), h=(i,k)=>Math.hypot(i-ti,k-tk);
  open.set(K(si,sk),[si,sk,h(si,sk)]); g.set(K(si,sk),0); let n=0, found=null;
  while(open.size&&n++<maxN){ let bk=null, bv=null; for(const [k,v] of open) if(!bv||v[2]<bv[2]){ bk=k; bv=v; } open.delete(bk);
    const [i,k]=bv; if(i===ti&&k===tk){ found=bk; break; }
    for(let di=-1;di<=1;di++) for(let dk=-1;dk<=1;dk++){ if(!di&&!dk) continue; const ni=i+di, nk=k+dk, nkK=K(ni,nk);
      if(!(ni===ti&&nk===tk)&&!free(ni*step,nk*step)) continue; const ng=g.get(bk)+Math.hypot(di,dk);
      if(g.has(nkK)&&g.get(nkK)<=ng) continue; g.set(nkK,ng); came.set(nkK,bk); open.set(nkK,[ni,nk,ng+h(ni,nk)]); } }
  if(!found) return null;
  const pts=[]; for(let k=found;k;k=came.get(k)){ const [i,kk]=k.split(",").map(Number); pts.unshift([i*step,kk*step]); }
  pts[0]=[a[0],a[1]]; pts[pts.length-1]=[b[0],b[1]];
  const out=[pts[0]]; let i=0; while(i<pts.length-1){ let j=pts.length-1; while(j>i+1&&!_ckSeg(free,pts[i],pts[j])) j--; out.push(pts[j]); i=j; }   /* 줄 당기기 : 곧게 갈 수 있으면 건너뜀 */
  out.shift(); return out;
}
/* V = {x,z,path,goal,stand} · want = [x,z] (앱 자리) · 돌려줌 : {x,z,moving,arrived} */
function idtWalkerNew(o){ return {x:null, z:null, path:[], goal:null, stand:null, o}; }
function idtWalkerTick(V,want,dt,spd){
  const free=V.o.free;
  if(V.x==null||Math.hypot(want[0]-V.x,want[1]-V.z)>8){ const s=idtNearFree(free,want[0],want[1],1.5,V.o.pref)||want; V.x=s[0]; V.z=s[1]; V.path=[]; V.goal=want.slice(); V.stand=s; }
  if(!V.goal||Math.hypot(want[0]-V.goal[0],want[1]-V.goal[1])>.25){ V.goal=want.slice(); V.stand=idtNearFree(free,want[0],want[1],1.5,V.o.pref)||want.slice();
    V.path=(Math.hypot(V.stand[0]-V.x,V.stand[1]-V.z)<.05)?[]:(idtGridPath(free,[V.x,V.z],V.stand,.1)||[V.stand]); }
  let st=dt*(spd||IDT_WALK), mv=false;
  while(st>1e-4&&V.path.length){ const p=V.path[0], dx=p[0]-V.x, dz=p[1]-V.z, d=Math.hypot(dx,dz); mv=true;
    if(d<=st){ V.x=p[0]; V.z=p[1]; st-=d; V.path.shift(); } else { V.x+=dx/d*st; V.z+=dz/d*st; st=0; } }
  return {x:V.x, z:V.z, moving:mv, arrived:!V.path.length};
}
