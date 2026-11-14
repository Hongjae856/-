/* ═══ 작업자 인체 모델 (방진복 · 후드 · 마스크 · 보안경 · 방진화 · 장갑)
   · 손 목표점(세계 좌표)을 주면 어깨 → 팔꿈치 → 손이 실제로 닿도록 관절을 푼다 (2관절 역기구학)
   · 손이 멀거나 낮으면 허리를 숙이고 무릎을 굽힘 · 몸통은 손 쪽으로 틀고 고개는 작업 지점을 봄
   · 발은 바닥에 디딘 채 있다가 몸이 움직이면 한 발씩 떼어 옮김 (보행 · 옆걸음 · 제자리 돌기)
   치수(m) : 키 약 1.76 · 어깨 높이 1.39 · 팔 0.30 + 0.33(손바닥 중심까지) · 다리 0.44 + 0.44 ═══ */
const HU={ hip:.93, hw:.09, uL:.44, lL:.44, ank:.07, sp:.46, sw:.19, uA:.30, fA:.33, reach:.565 };
const _hv=()=>new T3.Vector3();
/* 복장 색 (현장 복장 확인 후 조정) · 원단 결 · 얼굴(눈 · 눈썹) · 마스크 주름 무늬 */
const HUC={ gown:0x9cc3e6, hood:0xf4f5f3, glove:0x6fa9d6, shoe:0xf1f2f2, sole:0xc9ced2, skin:0xe6c3a4 };
let HUT=null;
function humanTex(){
  if(HUT) return HUT; HUT={};
  HUT.weave=tex(cvs(256,256,(g,w,h)=>{ g.fillStyle="#808080"; g.fillRect(0,0,w,h); for(let y=0;y<h;y+=2){ g.fillStyle=y%4?"rgba(150,150,150,.5)":"rgba(105,105,105,.5)"; g.fillRect(0,y,w,1); } for(let x=0;x<w;x+=2){ g.fillStyle=x%4?"rgba(140,140,140,.35)":"rgba(112,112,112,.35)"; g.fillRect(x,0,1,h); }
    for(let i=0;i<70;i++){ const x=rnd()*w, y=rnd()*h, l=30+rnd()*90, a=rnd()*3.14, v=rnd()<.5?70:180; g.strokeStyle=`rgba(${v},${v},${v},.22)`; g.lineWidth=3+rnd()*6; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+Math.cos(a)*l*.5+10,y+Math.sin(a)*l*.5-8,x+Math.cos(a)*l,y+Math.sin(a)*l); g.stroke(); } }),3,3);
  HUT.face=tex(cvs(256,160,(g,w,h)=>{ const sk=g.createLinearGradient(0,0,0,h); sk.addColorStop(0,"#e9c8aa"); sk.addColorStop(1,"#dfb898"); g.fillStyle=sk; g.fillRect(0,0,w,h);
    g.fillStyle="rgba(190,140,110,.25)"; g.beginPath(); g.ellipse(w/2,h*.78,26,40,0,0,7); g.fill();
    for(const sx of [-1,1]){ const cx=w/2+sx*44, cy=h*.56;
      g.fillStyle="rgba(150,105,85,.28)"; g.beginPath(); g.ellipse(cx,cy+2,25,13,0,0,7); g.fill();
      g.fillStyle="#f6f3ee"; g.beginPath(); g.ellipse(cx,cy,17,7.5,sx*-.06,0,7); g.fill();
      g.fillStyle="#2b1d14"; g.beginPath(); g.arc(cx+sx*-1,cy,6.6,0,7); g.fill(); g.fillStyle="#0b0806"; g.beginPath(); g.arc(cx+sx*-1,cy,3.2,0,7); g.fill(); g.fillStyle="rgba(255,255,255,.85)"; g.beginPath(); g.arc(cx+sx*-1+2,cy-2,1.4,0,7); g.fill();
      g.strokeStyle="#2a1c15"; g.lineWidth=2.6; g.beginPath(); g.moveTo(cx-18,cy+1); g.quadraticCurveTo(cx,cy-10.5,cx+18,cy+1); g.stroke();
      g.strokeStyle="rgba(120,80,60,.55)"; g.lineWidth=1.2; g.beginPath(); g.moveTo(cx-16,cy+3); g.quadraticCurveTo(cx,cy+9,cx+16,cy+3); g.stroke();
      g.strokeStyle="#2e221b"; g.lineWidth=6; g.lineCap="round"; g.beginPath(); g.moveTo(cx-sx*20,cy-21); g.quadraticCurveTo(cx,cy-29,cx+sx*22,cy-23); g.stroke(); } }),1,1,true);
  HUT.mask=tex(cvs(128,128,(g,w,h)=>{ g.fillStyle="#f3f6f7"; g.fillRect(0,0,w,h); for(const y of [34,62,90]){ g.strokeStyle="rgba(150,165,175,.75)"; g.lineWidth=2; g.beginPath(); g.moveTo(0,y); g.lineTo(w,y); g.stroke(); g.strokeStyle="rgba(255,255,255,.9)"; g.beginPath(); g.moveTo(0,y+3); g.lineTo(w,y+3); g.stroke(); }
    g.strokeStyle="rgba(140,155,165,.8)"; g.lineWidth=3; g.strokeRect(2,2,w-4,h-4); }),1,1,true);
  HUT.net=tex(cvs(128,128,(g,w,h)=>{ g.fillStyle="#000"; g.fillRect(0,0,w,h); g.strokeStyle="#f4f4f2"; g.lineWidth=3.2; for(let i=-h;i<w+h;i+=16){ g.beginPath(); g.moveTo(i,0); g.lineTo(i+h,h); g.stroke(); g.beginPath(); g.moveTo(i+h,0); g.lineTo(i,h); g.stroke(); } }),7,5,true);
  HUT.badge=tex(cvs(128,80,(g,w,h)=>{ g.fillStyle="#fff"; g.fillRect(0,0,w,h); g.fillStyle="#1f5fb8"; g.fillRect(0,0,w,22); g.fillStyle="#222"; g.font="bold 20px sans-serif"; g.fillText("포장2팀",24,52); g.fillStyle="#888"; g.fillRect(16,62,96,6); }),1,1,true);
  return HUT;
}
/* kind : "wear" = 포장실 (하늘색 상의 + 바지 분리형 위생복 · 망 위생모 · 마스크) / "suit" = 충전실 (흰색 상하 일체 방진복 · 흰 후드 · 마스크) — 사용자 확인 11/14 */
function makeHuman(S,kind){
  kind=kind||"wear"; const suit=kind==="suit", G=new T3.Group(); S.add(G); const TX2=humanTex(), V2=(a)=>a.map(p=>new T3.Vector2(p[0],p[1]));
  const gown=new T3.MeshStandardMaterial({color:suit?0xf1f3f4:HUC.gown,roughness:.93,bumpMap:TX2.weave,bumpScale:.0007}), skin=new T3.MeshStandardMaterial({color:HUC.skin,roughness:.65}), hood=new T3.MeshStandardMaterial({color:HUC.hood,roughness:.94,bumpMap:TX2.weave,bumpScale:.0005,side:T3.DoubleSide}),
        shoe=new T3.MeshStandardMaterial({color:HUC.shoe,roughness:.6}), sole=new T3.MeshStandardMaterial({color:HUC.sole,roughness:.8}), glove=new T3.MeshStandardMaterial({color:suit?0xe9eef2:HUC.glove,roughness:.38}), elas=new T3.MeshStandardMaterial({color:0xdfe6ee,roughness:.9});
  const limb=(pts,mat)=>add(G,new T3.Mesh(new T3.LatheGeometry(V2(pts),20),mat));           /* 길이 1 기준 윤곽 [반지름, 0~1] */
  const ball=(r,mat)=>add(G,new T3.Mesh(new T3.SphereGeometry(r,16,12),mat));
  const H={G, t:0, lean:0, crouch:0, twist:0, ft:null, vel:[0,0], prev:null};
  /* 몸통 : 골반 → 허리 → 가슴 → 어깨 · 지퍼 덮개 · 허리 고무줄 · 명찰 · 후드 어깨 덮개 */
  const TG=new T3.Group(); G.add(TG); H.TG=TG;
  { const m=new T3.Mesh(new T3.LatheGeometry(V2([[0,-.12],[.12,-.115],[.165,-.06],[.172,.02],[.162,.1],[.152,.17],[.158,.25],[.172,.33],[.182,.4],[.176,.455],[.15,.5],[.1,.535],[.06,.55],[0,.552]]),32),gown); m.scale.set(1.13,1,.68); add(TG,m);
    const zf=new T3.Mesh(new T3.BoxGeometry(.026,.36,.006),gown); zf.position.set(0,.3,.113); zf.rotation.x=-.07; add(TG,zf);
    const bd=new T3.Mesh(new T3.PlaneGeometry(.062,.04),new T3.MeshBasicMaterial({map:TX2.badge})); bd.position.set(.085,.36,.1195); bd.rotation.set(-.08,.22,0); TG.add(bd);
    if(suit){ const cape=new T3.Mesh(new T3.LatheGeometry(V2([[.14,.485],[.132,.51],[.105,.54],[.08,.565],[.07,.6]]),28),hood); cape.scale.set(1.1,1,.84); add(TG,cape); }
    else { const nk=new T3.Mesh(new T3.CylinderGeometry(.05,.056,.1,16),skin); nk.position.y=.585; add(TG,nk);                                   /* 목 · 둥근 깃 · 상의 밑단(바지 위로 내려옴) */
      const col=new T3.Mesh(new T3.TorusGeometry(.066,.011,8,24),gown); col.rotation.x=Math.PI/2; col.scale.set(1.1,.9,1); col.position.y=.548; add(TG,col);
      const hem=new T3.Mesh(new T3.LatheGeometry(V2([[.17,-.02],[.182,-.1],[.186,-.175],[.178,-.18],[.168,-.1]]),32),gown); hem.scale.set(1.13,1,.74); add(TG,hem);
      for(const sx of [-1,1]){ const pk=new T3.Mesh(new T3.BoxGeometry(.085,.075,.004),gown); pk.position.set(sx*.085,-.07,.127); pk.rotation.x=.06; add(TG,pk); } } }
  /* 머리 : 얼굴(눈 · 눈썹) · 후드(얼굴만 열림 · 고무줄 테) · 3단 주름 마스크 · 코 */
  const HG=new T3.Group(); G.add(HG); H.HG=HG;
  { const sk=new T3.Mesh(new T3.SphereGeometry(.094,28,20),skin); sk.scale.set(.9,1.12,1); add(HG,sk);
    const fc=new T3.Mesh(new T3.SphereGeometry(.0952,32,16,Math.PI/2-.95,1.9,Math.PI*.27,Math.PI*.36),new T3.MeshStandardMaterial({map:TX2.face,roughness:.6})); fc.scale.set(.9,1.12,1); HG.add(fc);
    if(suit){ const hd=new T3.Mesh(new T3.SphereGeometry(.108,36,24,Math.PI/2+.78,Math.PI*2-1.56,0,Math.PI),hood); hd.scale.set(.96,1.14,1.06); hd.position.set(0,.004,-.006); add(HG,hd);
      const br=new T3.Mesh(new T3.SphereGeometry(.108,24,10,Math.PI/2-.8,1.6,0,Math.PI*.34),hood); br.scale.set(.96,1.14,1.06); br.position.set(0,.004,-.006); add(HG,br);
      const ch=new T3.Mesh(new T3.SphereGeometry(.108,24,8,Math.PI/2-.8,1.6,Math.PI*.8,Math.PI*.2),hood); ch.scale.set(.96,1.14,1.06); ch.position.set(0,.004,-.006); add(HG,ch);
      const rim=new T3.Mesh(new T3.TorusGeometry(.079,.0055,8,36),hood); rim.scale.set(.95,1.2,1); rim.position.set(0,-.004,.07); add(HG,rim); }
    else { /* 망 위생모 : 머리카락을 감싸는 망(뒤 · 위) + 앞 흰 천 띠 + 짧은 챙 · 귀 · 마스크 끈 */
      const hair=new T3.Mesh(new T3.SphereGeometry(.099,24,16,0,Math.PI*2,0,Math.PI*.62),new T3.MeshStandardMaterial({color:0x1d1a18,roughness:.8})); hair.scale.set(.93,1.1,1.04); hair.position.set(0,.006,-.012); add(HG,hair);
      const net=new T3.Mesh(new T3.SphereGeometry(.108,28,18,0,Math.PI*2,0,Math.PI*.66),new T3.MeshStandardMaterial({map:TX2.net,alphaMap:TX2.net,transparent:true,roughness:.9,side:T3.DoubleSide,alphaTest:.3})); net.scale.set(.96,1.1,1.1); net.position.set(0,.008,-.018); HG.add(net);
      const band=new T3.Mesh(new T3.SphereGeometry(.1095,32,10,Math.PI/2-1.25,2.5,Math.PI*.17,Math.PI*.19),hood); band.scale.set(.95,1.1,1.05); band.position.set(0,.008,-.008); add(HG,band);
      const bb=new T3.Mesh(new T3.SphereGeometry(.1085,32,6,0,Math.PI*2,Math.PI*.6,Math.PI*.07),hood); bb.scale.set(.96,1.1,1.1); bb.position.set(0,.008,-.018); add(HG,bb);
      const brim=new T3.Mesh(new T3.CylinderGeometry(.085,.085,.006,24,1,false,-Math.PI/2+.25,Math.PI-.5),hood); brim.scale.set(1,1,.62); brim.position.set(0,.058,.078); brim.rotation.x=.22; add(HG,brim);
      for(const s2 of [-1,1]){ const ear=new T3.Mesh(new T3.SphereGeometry(.02,12,10),skin); ear.scale.set(.45,1.15,.8); ear.position.set(s2*.086,-.002,-.004); add(HG,ear); } }
    const mk=new T3.Mesh(new T3.SphereGeometry(.101,24,12,Math.PI/2-.8,1.6,Math.PI*.515,Math.PI*.33),new T3.MeshStandardMaterial({map:TX2.mask,roughness:.9,side:T3.DoubleSide})); mk.scale.set(.92,1.12,1.09); mk.position.set(0,-.002,.002); add(HG,mk);
    for(const s of [-1,1]){ const lp=new T3.Mesh(new T3.CylinderGeometry(.0015,.0015,.06,6),elas); lp.position.set(s*.074,-.03,.05); lp.rotation.set(.9,0,s*.25); HG.add(lp); } }
  /* 팔 · 손(손가락 4 + 엄지, 마디별 굽힘) · 다리 · 작업화 */
  H.arm={}; H.leg={};
  for(const k of ["L","R"]){
    const A={up:limb([[0,0],[.055,0],[.057,.25],[.052,.7],[.045,1],[0,1]],gown), lo:limb([[0,0],[.045,0],[.049,.25],[.045,.6],[.04,.9],[.043,.95],[.04,1],[0,1]],gown), sh:ball(.064,gown), el:ball(.053,gown), HG:new T3.Group()}; G.add(A.HG);
    { const sx=k==="R"?1:-1, hg=A.HG; A.sx=sx; A.fing=[];
      const pm=new T3.Mesh(new T3.SphereGeometry(1,16,12),glove); pm.scale.set(.043,.05,.017); pm.position.set(0,-.012,-.015); add(hg,pm);
      const cf=new T3.Mesh(new T3.CylinderGeometry(.035,.042,.075,14),glove); cf.position.set(0,-.088,-.012); add(hg,cf);
      for(const [i,x] of [-.03,-.01,.01,.03].entries()){ const L1=[.036,.04,.042,.038][sx>0?i:3-i], L2=L1*.78, g1=new T3.Group(), g2=new T3.Group(); g1.position.set(x,.03,-.015); hg.add(g1); g2.position.y=L1; g1.add(g2);
        const c1=new T3.Mesh(new T3.CapsuleGeometry(.0093,L1-.006,4,8),glove); c1.position.y=L1/2; add(g1,c1); const c2=new T3.Mesh(new T3.CapsuleGeometry(.0086,L2-.004,4,8),glove); c2.position.y=L2/2; add(g2,c2); A.fing.push({g1,g2}); }
      const t1=new T3.Group(), t2=new T3.Group(); t1.position.set(sx*.034,-.03,-.008); hg.add(t1); t2.position.y=.034; t1.add(t2);
      const d1=new T3.Mesh(new T3.CapsuleGeometry(.0115,.026,4,8),glove); d1.position.y=.017; add(t1,d1); const d2=new T3.Mesh(new T3.CapsuleGeometry(.0098,.02,4,8),glove); d2.position.y=.014; add(t2,d2); A.t1=t1; A.t2=t2; }
    H.arm[k]=A;
    const L={up:limb([[0,0],[.086,0],[.089,.25],[.078,.7],[.064,1],[0,1]],gown), lo:limb([[0,0],[.064,0],[.07,.28],[.062,.65],[.052,.9],[.056,.95],[.05,1],[0,1]],gown), kn:ball(.073,gown), FG:new T3.Group()}; G.add(L.FG);
    { const up=new T3.Mesh(new T3.SphereGeometry(1,18,12),shoe); up.scale.set(.05,.046,.12); up.position.set(0,-.028,.05); add(L.FG,up);
      const so=new T3.Mesh(new T3.BoxGeometry(.098,.02,.262),sole); so.position.set(0,-.06,.05); add(L.FG,so); const sf=new T3.Mesh(new T3.CylinderGeometry(.049,.049,.02,16,1,false,0,Math.PI),sole); sf.rotation.y=-Math.PI/2; sf.position.set(0,-.06,.181); add(L.FG,sf);
      const an=new T3.Mesh(new T3.CylinderGeometry(.047,.05,.07,14),shoe); an.position.y=.0; add(L.FG,an); }
    H.leg[k]=L;
  }
  H.pel=add(G,new T3.Mesh(new T3.SphereGeometry(.165,20,14),gown)); H.pel.scale.set(1.12,.66,.74);
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
  { const nk=pel.clone().addScaledVector(F.sp,.575), hc=nk.clone().addScaledVector(F.sp.clone().multiplyScalar(.55).addScaledVector(up,.45).normalize(),.105);
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
    const d=r.h.clone().sub(r.e).normalize(), wr=r.h.clone().addScaledVector(d,-.1); segSet(A.lo,r.e,wr);
    let nv=p["n"+kk]||"in", n; if(nv==="in") n=F.lt.clone().multiplyScalar(-s); else if(nv==="down") n=_hv().set(0,-1,0); else if(nv==="up") n=_hv().set(0,1,0); else if(nv==="fwd") n=F.ft.clone(); else n=_hv().fromArray(nv);
    n.addScaledVector(d,-n.dot(d)); if(n.lengthSq()<1e-5) n.copy(F.lt).multiplyScalar(-s); n.normalize();
    basisSet(A.HG,r.h,d.clone().cross(n),d,n);
    const g=p["g"+kk]==null?(T[kk]?.15:.35):p["g"+kk]; A.fing.forEach((fg,i)=>{ fg.g1.rotation.x=.12+g*(.95+.07*i); fg.g2.rotation.x=.1+g*1.15; }); A.t1.rotation.set(.25+g*.45,0,-A.sx*(1.0-.45*g)); A.t2.rotation.x=.1+g*.5;
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
