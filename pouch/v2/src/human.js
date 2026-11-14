/* ═══ 작업자 인체 모델 (방진복 · 후드 · 마스크 · 보안경 · 방진화 · 장갑)
   · 손 목표점(세계 좌표)을 주면 어깨 → 팔꿈치 → 손이 실제로 닿도록 관절을 푼다 (2관절 역기구학)
   · 손이 멀거나 낮으면 허리를 숙이고 무릎을 굽힘 · 몸통은 손 쪽으로 틀고 고개는 작업 지점을 봄
   · 발은 바닥에 디딘 채 있다가 몸이 움직이면 한 발씩 떼어 옮김 (보행 · 옆걸음 · 제자리 돌기)
   치수(m) : 키 약 1.76 · 어깨 높이 1.39 · 팔 0.30 + 0.33(손바닥 중심까지) · 다리 0.44 + 0.44 ═══ */
const HU={ hip:.93, hw:.09, uL:.44, lL:.44, ank:.07, sp:.46, sw:.19, uA:.30, fA:.33, reach:.565 };
const _hv=()=>new T3.Vector3();
function makeHuman(S){
  const G=new T3.Group(); S.add(G);
  const gown=new T3.MeshStandardMaterial({color:0x8fb8e0,roughness:.9}), skin=new T3.MeshStandardMaterial({color:0xe2bc9c,roughness:.7}), hood=new T3.MeshStandardMaterial({color:0xf3f4f2,roughness:.92}),
        boot=new T3.MeshStandardMaterial({color:0xeef0f0,roughness:.8}), glove=new T3.MeshStandardMaterial({color:0xdfe9f2,roughness:.55});
  const limb=(r0,r1,mat)=>{ const g=new T3.CylinderGeometry(r1,r0,1,16); g.translate(0,.5,0); return add(G,new T3.Mesh(g,mat)); };
  const ball=(r,mat)=>add(G,new T3.Mesh(new T3.SphereGeometry(r,14,10),mat));
  const H={G, t:0, lean:0, crouch:0, twist:0, ft:null, vel:[0,0], prev:null};
  /* 몸통 (골반 기준 · 위로 어깨 · 목) */
  const TG=new T3.Group(); G.add(TG); H.TG=TG;
  { const m=new T3.Mesh(new T3.LatheGeometry([[0,-.11],[.13,-.11],[.17,-.03],[.165,.1],[.15,.2],[.17,.32],[.185,.42],[.15,.5],[.07,.545],[0,.545]].map(p=>new T3.Vector2(p[0],p[1])),28),gown); m.scale.set(1.12,1,.66); add(TG,m);
    const zip=new T3.Mesh(new T3.BoxGeometry(.012,.44,.006),hood); zip.position.set(0,.24,.118); add(TG,zip);
    const cape=new T3.Mesh(new T3.LatheGeometry([[0,.46],[.16,.46],[.14,.52],[.085,.565],[0,.565]].map(p=>new T3.Vector2(p[0],p[1])),24),hood); cape.scale.set(1.08,1,.8); add(TG,cape);
    const nk=new T3.Mesh(new T3.CylinderGeometry(.05,.055,.09,12),hood); nk.position.y=.585; add(TG,nk); }
  /* 머리 */
  const HG=new T3.Group(); G.add(HG); H.HG=HG;
  { const h=new T3.Mesh(new T3.SphereGeometry(.098,24,16),skin); h.scale.set(.92,1.08,1); add(HG,h);
    const hd=new T3.Mesh(new T3.SphereGeometry(.118,28,18,Math.PI*.62,Math.PI*1.76,0,Math.PI),hood); hd.scale.set(.95,1.12,1.04); hd.position.set(0,.005,-.008); add(HG,hd);
    const mk=new T3.Mesh(new T3.SphereGeometry(.1,20,12,-Math.PI*.38,Math.PI*.76,Math.PI*.5,Math.PI*.28),hood); mk.position.y=-.005; mk.scale.z=1.08; add(HG,mk);
    const gl=new T3.Mesh(new T3.BoxGeometry(.13,.03,.02),new T3.MeshStandardMaterial({color:0x9fc4dc,roughness:.15,metalness:.2,transparent:true,opacity:.55})); gl.position.set(0,.03,.095); HG.add(gl); }
  /* 팔 · 다리 · 관절 */
  H.arm={}; H.leg={};
  for(const k of ["L","R"]){
    const A={up:limb(.056,.047,gown), lo:limb(.047,.038,gown), sh:ball(.06,gown), el:ball(.048,gown), HG:new T3.Group()}; G.add(A.HG);
    { const sx=k==="R"?1:-1, hg=A.HG;                                           /* 손 : 손바닥(+z 가 손바닥 면) · 손가락 2마디 · 엄지 */
      const pm=new T3.Mesh(new T3.BoxGeometry(.082,.09,.024),glove); pm.position.set(0,-.012,-.014); add(hg,pm);
      const cf=new T3.Mesh(new T3.CylinderGeometry(.04,.042,.05,14),glove); cf.position.set(0,-.075,-.014); add(hg,cf);
      const f1=new T3.Group(); f1.position.set(0,.033,-.014); hg.add(f1); const s1=new T3.Mesh(new T3.BoxGeometry(.078,.045,.02),glove); s1.position.y=.0225; add(f1,s1);
      const f2=new T3.Group(); f2.position.y=.045; f1.add(f2); const s2=new T3.Mesh(new T3.BoxGeometry(.074,.042,.018),glove); s2.position.y=.021; add(f2,s2);
      const th=new T3.Group(); th.position.set(sx*.04,-.03,-.008); hg.add(th); const s3=new T3.Mesh(new T3.BoxGeometry(.022,.06,.022),glove); s3.position.set(sx*.012,.03,.006); add(th,s3);
      A.f1=f1; A.f2=f2; A.th=th; A.sx=sx; }
    H.arm[k]=A;
    const L={up:limb(.085,.062,gown), lo:limb(.062,.06,gown), kn:ball(.064,gown), FG:new T3.Group()}; G.add(L.FG);
    { const sh=new T3.Mesh(new T3.CylinderGeometry(.066,.07,.3,16),boot); sh.position.y=.1; add(L.FG,sh);
      const so=new T3.Mesh(new T3.BoxGeometry(.105,.05,.26),boot); so.position.set(0,-.045,.055); add(L.FG,so);
      const toe=new T3.Mesh(new T3.SphereGeometry(.055,14,10,0,Math.PI*2,0,Math.PI/2),boot); toe.scale.set(.95,.85,1.5); toe.position.set(0,-.03,.11); add(L.FG,toe); }
    H.leg[k]=L;
  }
  H.pel=add(G,new T3.Mesh(new T3.SphereGeometry(.16,18,12),gown)); H.pel.scale.set(1.1,.62,.72);
  return H;
}
/* 2관절 역기구학 : 어깨 A · 목표 T · 굽힘 방향 hint → 팔꿈치(무릎) e · 실제 끝점 h */
function ik2(A,T,hint,u,l){
  const d0=T.clone().sub(A), len=d0.length()||1e-6, d=Math.max(.02,Math.min(len,u+l-.002)), n=d0.multiplyScalar(1/len);
  const b=hint.clone().addScaledVector(n,-hint.dot(n)); if(b.lengthSq()<1e-6) b.set(0,0,1); b.normalize();
  const a=(u*u-l*l+d*d)/(2*d), h=Math.sqrt(Math.max(0,u*u-a*a));
  return {e:A.clone().addScaledVector(n,a).addScaledVector(b,h), h:A.clone().addScaledVector(n,d)};
}
const _Y=new T3.Vector3(0,1,0), _m4=new T3.Matrix4();
function segSet(m,a,b){ const d=b.clone().sub(a), l=d.length()||1e-6; m.position.copy(a); m.quaternion.setFromUnitVectors(_Y,d.multiplyScalar(1/l)); m.scale.set(1,l,1); }
function basisSet(o,pos,X,Yv,Z){ _m4.makeBasis(X,Yv,Z); o.quaternion.setFromRotationMatrix(_m4); o.position.copy(pos); }
/* 자세 적용.  p = { x, z, yaw, y0(바닥 높이), L · R : [x,y,z] | null(내림), gL · gR : 쥠 0~1, nL · nR : 손바닥 방향 "in" | "down" | "up" | [x,y,z], look : [x,y,z], dt } */
function poseHuman(H,p){
  const dt=p.dt==null?1/60:p.dt, y0=p.y0||0, yaw=p.yaw, f=_hv().set(Math.sin(yaw),0,Math.cos(yaw)), lf=_hv().set(Math.cos(yaw),0,-Math.sin(yaw)), up=_Y;
  const root=_hv().set(p.x,y0,p.z), T={L:p.L?_hv().fromArray(p.L):null, R:p.R?_hv().fromArray(p.R):null};
  /* 몸통 틀기 : 손 중점 방향 */
  let tw=0; { const n=(T.L?1:0)+(T.R?1:0); if(n){ const mid=_hv(); if(T.L) mid.add(T.L); if(T.R) mid.add(T.R); mid.multiplyScalar(1/n).sub(root); tw=Math.max(-.7,Math.min(.7,Math.atan2(mid.dot(lf),Math.max(.18,mid.dot(f)))))*.75; } }
  if(p.twist!=null) tw=p.twist;
  /* 숙임 · 굽힘 : 두 손이 닿을 때까지 조금씩 늘림 */
  let lean=0, cr=0;
  const frame=(ln,c,twv)=>{ const ty=yaw+twv, ft=_hv().set(Math.sin(ty),0,Math.cos(ty)), lt=_hv().set(Math.cos(ty),0,-Math.sin(ty));
    const pel=root.clone().addScaledVector(f,-.11*Math.sin(ln)-.05*c).setY(y0+HU.hip-c-.015*ln), sp=_hv().copy(up).multiplyScalar(Math.cos(ln)).addScaledVector(ft,Math.sin(ln));
    const cs=pel.clone().addScaledVector(sp,HU.sp); return {pel,sp,ft,lt,sL:cs.clone().addScaledVector(lt,HU.sw),sR:cs.clone().addScaledVector(lt,-HU.sw)}; };
  for(let i=0;i<22;i++){ const F=frame(lean,cr,tw); let need=0, low=false;
    for(const k of ["L","R"]) if(T[k]){ const s=k==="L"?F.sL:F.sR, d=s.distanceTo(T[k])-HU.reach; if(d>need) need=d; if(T[k].y<y0+.7) low=true; }
    if(need<=.002) break; if(lean<(low?1.15:1.05)) lean+=Math.min(.08,need*1.2+.008); else if(low&&cr<.45) cr+=Math.min(.05,need*.8+.006); else break; if(low&&cr<.45) cr+=Math.min(.04,need*.5+.004); }
  if(p.lean!=null) lean=p.lean; if(p.crouch!=null) cr=p.crouch;
  const k=Math.min(1,dt*11); H.lean+=(lean-H.lean)*k; H.crouch+=(cr-H.crouch)*k; H.twist+=(tw-H.twist)*k;
  /* 발 딛기 */
  if(!H.ft||Math.hypot(H.prev[0]-p.x,H.prev[1]-p.z)>.9){ H.ft=["L","R"].map((kk,i)=>({p:[p.x+lf.x*(i?-.1:.1),p.z+lf.z*(i?-.1:.1)],yaw,sw:-1})); H.prev=[p.x,p.z]; H.vel=[0,0]; }
  if(dt>1e-5){ const vx=(p.x-H.prev[0])/dt, vz=(p.z-H.prev[1])/dt; H.vel[0]+=(vx-H.vel[0])*.35; H.vel[1]+=(vz-H.vel[1])*.35; } H.prev=[p.x,p.z];
  const sp=Math.hypot(H.vel[0],H.vel[1]), ideal=i=>[p.x+lf.x*(i?-.1:.1)+H.vel[0]*.16,p.z+lf.z*(i?-.1:.1)+H.vel[1]*.16];
  const dev=i=>{ const q=ideal(i), a=H.ft[i]; let dy=yaw-a.yaw; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); return Math.hypot(q[0]-a.p[0],q[1]-a.p[1])+Math.abs(dy)*.2; };
  if(H.ft[0].sw<0&&H.ft[1].sw<0){ const d0=dev(0), d1=dev(1), i=d0>d1?0:1; if(Math.max(d0,d1)>.11){ const a=H.ft[i]; a.sw=0; a.from=a.p.slice(); a.fy=a.yaw; } }
  let lift=[0,0];
  for(const i of [0,1]){ const a=H.ft[i]; if(a.sw<0) continue; a.sw+=dt/Math.max(.2,.34-.08*sp); const u=Math.min(1,a.sw), e=u*u*(3-2*u), q=ideal(i); q[0]+=H.vel[0]*.1; q[1]+=H.vel[1]*.1;
    a.p=[a.from[0]+(q[0]-a.from[0])*e,a.from[1]+(q[1]-a.from[1])*e]; let dy=yaw-a.fy; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); a.yaw=a.fy+dy*e; lift[i]=Math.sin(Math.PI*u)*(.045+.03*Math.min(1,sp)); if(u>=1) a.sw=-1; }
  /* 골격 */
  H.t+=dt; const bob=Math.max(lift[0],lift[1])*.25, F=frame(H.lean,H.crouch+bob*.3,H.twist), pel=F.pel;
  { const X=F.lt.clone().addScaledVector(F.sp,-F.lt.dot(F.sp)).normalize(), Z=X.clone().cross(F.sp); basisSet(H.TG,pel,X,F.sp,Z); }
  H.pel.position.copy(pel).y-=.03; H.pel.rotation.y=yaw;
  /* 머리 */
  { const nk=pel.clone().addScaledVector(F.sp,.6), hc=nk.clone().addScaledVector(F.sp.clone().multiplyScalar(.55).addScaledVector(up,.45).normalize(),.12);
    let ly=yaw+H.twist, lp=-.12-H.lean*.35;
    const tgt=p.look?_hv().fromArray(p.look):(T.L||T.R?_hv().copy(T.L||T.R).add(T.R||T.L).multiplyScalar(.5):null);
    if(tgt){ const d=tgt.sub(hc); let a=Math.atan2(d.x,d.z)-(yaw+H.twist); a=Math.atan2(Math.sin(a),Math.cos(a)); ly=yaw+H.twist+Math.max(-1.1,Math.min(1.1,a)); lp=Math.max(-1.0,Math.min(.45,Math.atan2(d.y,Math.hypot(d.x,d.z)))); }
    if(H.ly==null){ H.ly=ly; H.lp=lp; } let dq=ly-H.ly; dq=Math.atan2(Math.sin(dq),Math.cos(dq)); const kh=Math.min(1,dt*8); H.ly+=dq*kh; H.lp+=(lp-H.lp)*kh;
    const Z=_hv().set(Math.sin(H.ly)*Math.cos(H.lp),Math.sin(H.lp),Math.cos(H.ly)*Math.cos(H.lp)), X=_hv().copy(up).cross(Z).normalize(), Yv=Z.clone().cross(X); basisSet(H.HG,hc,X,Yv,Z); }
  /* 팔 · 손 */
  H.hand={};
  for(const kk of ["L","R"]){ const A=H.arm[kk], s=kk==="L"?1:-1, sh=kk==="L"?F.sL:F.sR;
    const rest=sh.clone().addScaledVector(up,-.575+.12*H.lean).addScaledVector(F.ft,.07+.25*Math.sin(H.lean)).addScaledVector(F.lt,s*.04);
    if(A.w==null) A.w=T[kk]?1:0; A.w=T[kk]?Math.min(1,A.w+dt/.35):Math.max(0,A.w-dt/.3); if(T[kk]) A.last=T[kk].clone();
    const ew=A.w*A.w*(3-2*A.w), tg=A.last?rest.clone().lerp(A.last,ew):rest; if(A.last&&ew>0&&ew<1) tg.y+=Math.sin(Math.PI*ew)*.04;
    const hint=_hv().copy(up).multiplyScalar(-.75).addScaledVector(F.lt,s*.55).addScaledVector(F.ft,-.4), r=ik2(sh,tg,hint,HU.uA,HU.fA);
    segSet(A.up,sh,r.e); A.sh.position.copy(sh); A.el.position.copy(r.e);
    const d=r.h.clone().sub(r.e).normalize(), wr=r.h.clone().addScaledVector(d,-.085); segSet(A.lo,r.e,wr);
    let nv=p["n"+kk]||"in", n; if(nv==="in") n=F.lt.clone().multiplyScalar(-s); else if(nv==="down") n=_hv().set(0,-1,0); else if(nv==="up") n=_hv().set(0,1,0); else if(nv==="fwd") n=F.ft.clone(); else n=_hv().fromArray(nv);
    n.addScaledVector(d,-n.dot(d)); if(n.lengthSq()<1e-5) n.copy(F.lt).multiplyScalar(-s); n.normalize();
    basisSet(A.HG,r.h,d.clone().cross(n),d,n);
    const g=p["g"+kk]==null?(T[kk]?.15:.35):p["g"+kk]; A.f1.rotation.x=g*1.0; A.f2.rotation.x=g*1.1; A.th.rotation.z=-A.sx*(.5-.35*g); A.th.rotation.x=g*.6;
    H.hand[kk]=r.h; (H.err||(H.err={}))[kk]=T[kk]&&A.w>=1?r.h.distanceTo(T[kk]):0; }
  /* 다리 · 발 */
  for(const i of [0,1]){ const kk=i?"R":"L", L=H.leg[kk], a=H.ft[i], s=i?-1:1, hipJ=pel.clone().addScaledVector(lf,s*HU.hw).addScaledVector(up,-.05);
    const ank=_hv().set(a.p[0],y0+HU.ank+lift[i],a.p[1]), r=ik2(hipJ,ank,f.clone().addScaledVector(lf,s*.12),HU.uL,HU.lL);
    segSet(L.up,hipJ,r.e); segSet(L.lo,r.e,r.h); L.kn.position.copy(r.e); L.FG.position.copy(r.h); L.FG.rotation.set(lift[i]*2.2,a.yaw,0,"YXZ"); }
  return H;
}
/* 시간 구간 보간 : keys = [[t, 값(수 | 배열), 호 높이?], …] — 구간마다 부드럽게(가 · 감속), 배열 둘째 성분(y)에 호 높이를 더함 */
function KF(t,keys){
  if(t<=keys[0][0]) return keys[0][1]; const n=keys.length; if(t>=keys[n-1][0]) return keys[n-1][1];
  let i=1; while(keys[i][0]<t) i++; const a=keys[i-1], b=keys[i], u=(t-a[0])/(b[0]-a[0]), e=u*u*(3-2*u);
  if(typeof a[1]==="number") return a[1]+(b[1]-a[1])*e;
  const o=a[1].map((v,j)=>v+(b[1][j]-v)*e); if(b[2]) o[1]+=Math.sin(Math.PI*e)*b[2]; return o;
}
const angLerp=(a,b,e)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*e;
