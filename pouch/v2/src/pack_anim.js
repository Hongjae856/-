/* ═══ 포장 흐름 동작 — 충전기 스틱 흐름(anim.js)과 한 시계로 묶음
   σs = 경사 컨베이어 끝을 지난 스틱 수(연속), σb = σs/6 + c0 = 지나간 버킷 수. 버킷 간격 = 카톤 체인 간격 = 0.10 m (버킷 b ↔ 카톤 b)
   ① 상단 핀 벨트(경사 컨베이어와 같은 간격 · 속도) → ② 회전 휠 포켓 → ③ 미끄럼판 → 적재부 칸 A/B 에 6포씩 번갈아 세워 쌓임
   → ④ 칸 바닥 게이트가 열려 흰 버킷 칸으로 낙하 → ⑤ 설명서가 묶음 위에 놓임 → ⑥ 카톤 매거진에서 흡착 암이 한 장씩 끌어내려 펼쳐 같은 칸 옆 체인에 세움
   → ⑦ 밀대가 묶음 · 설명서를 카톤 속으로 밀어 넣음 → ⑧ 작은 날개 접기 → 아래 큰 날개 올림 → 핫멜트 → 위 큰 날개 내림 → 압착
   → ⑨ 프린터 · X-ray · 중량선별기 벨트 → ⑩ 끝에 8개 모이면 작업자가 가져감 ═══ */
const PA={};
function initPackAnim(S){
  const P=PK2.P, C=PK2.carton, Pf=FM.P, T=PK2.tc, o=new T3.Object3D(); PA.o=o;
  PA.Lt=T.z0-T.z1; PA.La=Math.PI*T.r; PA.Lf=.08; PA.loopT=2*PA.Lt+2*PA.La;
  PA.D=c=>(CV.sDrop(PK2.ch[c])-CV.L+PA.Lf)/Pf;                          /* 스틱이 정렬기 위단 칸에 닿기까지 (σs) */
  PA.sA=PK2.bz0-PK2.ch[0]; PA.c0=(6*PA.sA/P-5-PA.D(0)-9.6)/6; PA.Lu=PK2.bz0-PK2.bz1; PA.loop=110*P;
  const im=(geo,mat,n)=>{ const m=new T3.InstancedMesh(geo,mat,n); m.frustumCulled=false; m.castShadow=true; m.receiveShadow=true; S.add(m); return m; };
  PA.stk=im(stickGeo(FM.stickL,FM.stickW,.009),M.stick,360);
  PA.fin=im(new T3.BoxGeometry(.26,.075,.006),PK2.bw,110);
  PA.pin=im(new T3.BoxGeometry(.17,.026,.005),PK2.bw,40);
  /* 카톤 포켓 (체인 위 칸마다 : 진회색 받침 + 앞 · 뒤 벽 — 카톤이 꼭 맞게 들어감) */
  const pk=new T3.MeshStandardMaterial({color:0x3b4146,metalness:.4,roughness:.45}); PA.lug=im(new T3.BoxGeometry(.15,.006,.097),pk,30); PA.lugW=im(new T3.BoxGeometry(.15,.042,.006),pk,60);
  PA.push=im(new T3.BoxGeometry(.008,.03,.07),M.ssMir,16);
  { const g=new T3.CylinderGeometry(.005,.005,1,8); g.rotateZ(Math.PI/2); g.translate(.5,0,0); PA.rod=im(g,M.ssMir,16); }
  PA.lfl=im(new T3.BoxGeometry(.1,.004,.066),new T3.MeshStandardMaterial({map:tex(cvs(128,96,(c)=>{ c.fillStyle="#fbfbf8"; c.fillRect(0,0,128,96); c.fillStyle="#999"; for(let k=0;k<7;k++) c.fillRect(10,10+k*11,100-(k%3)*18,3); c.fillStyle="#c8201c"; c.fillRect(10,82,30,6); }),1,1,true),roughness:.8}),60);
  /* 카톤 : 슬리브(양 끝 열림) + 끝마다 큰 날개 2 · 작은 날개 2 + 접착점 + 인쇄 표시 */
  const hid=new T3.MeshBasicMaterial({visible:false}), cm=M.carton.clone(); cm.side=T3.DoubleSide; const red=new T3.MeshStandardMaterial({color:0x8e130e,roughness:.55,envMapIntensity:.45,side:T3.DoubleSide}); cm.envMapIntensity=.45; cm.color.setHex(0xb0b0b0);
  const inner=new T3.MeshStandardMaterial({color:0xf1ece2,roughness:.8,side:T3.DoubleSide});
  PA.cb=im(new T3.BoxGeometry(C.L,C.H,C.W),[hid,hid,red,red,cm,cm],64);
  const a=C.H*.6, b=C.W*.33; PA.fa=a; PA.fb=b;
  const gT=new T3.BoxGeometry(a,.0012,C.W); gT.translate(a/2,.0019,0); const gB=new T3.BoxGeometry(a,.0012,C.W); gB.translate(a/2,-.0007,0);
  const gm=new T3.BoxGeometry(b,C.H-.002,.0012); gm.translate(b/2,0,0);
  PA.fT=im(gT,red,128); PA.fB=im(gB,red,128); PA.fm=im(gm,inner,256);
  PA.glue=im(new T3.SphereGeometry(.0045,8,6),new T3.MeshStandardMaterial({color:0xd9a52a,roughness:.3,metalness:.1}),256);
  PA.prt=im(new T3.PlaneGeometry(.05,.014),new T3.MeshBasicMaterial({map:tex(cvs(160,48,(c)=>{ c.fillStyle="#fff"; c.fillRect(0,0,160,48); c.fillStyle="#111"; c.font="bold 18px monospace"; c.fillText("LOT 2F010",6,20); c.fillText("EXP 2028.11",6,42); }),1,1,true)}),64);
  /* X-ray 차폐 커튼 띠 (카톤이 지날 때 들림) */
  PA.curt=PK2.curt||[];
  PA.M4=new T3.Matrix4(); PA.Mc=new T3.Matrix4(); PA.Mf=new T3.Matrix4(); PA.Sh=new T3.Matrix4(); PA.T=new T3.Matrix4(); PA.v=new T3.Vector3(); PA.q=new T3.Quaternion(); PA.e=new T3.Euler(); PA.one=new T3.Vector3(1,1,1);
  stepPackAnim();
}
const PZ={ lfL:2.06, pk0:2.5, pk1:2.8, ps0:3.05, ps1:3.75, rt1:4.02, m0:3.95, m1:4.12, b0:4.15, b1:4.38, gl:4.43, t0:4.5, t1:4.72, cEnd:4.98 };
function stepPackAnim(){
  if(!PA.stk) return;
  const P=PK2.P, Pf=FM.P, C=PK2.carton, X=CVX, xb=PK2.xb, cx=PK2.cx, yC=PK2.yC, o=PA.o, ez=x=>x<=0?0:x>=1?1:x*x*(3-2*x), cl=x=>x<0?0:x>1?1:x, lerp=(a,b,t)=>a+(b-a)*t;
  const ss=(AN.u()-CV.L)/Pf, sb=ss/6+PA.c0, zl=l=>PK2.bz0-l, T=PK2.tc, bl0=b=>(sb-b)*P;
  const put=(m,i,x,y,z,rx,sc)=>{ o.position.set(x,y,z); o.rotation.set(rx||0,0,0); o.scale.setScalar(sc===undefined?1:sc); o.updateMatrix(); m.setMatrixAt(i,o.matrix); };
  /* ── 버킷 칸막이 (위 · 아래 · 양 끝 원호) ── */
  { const r=PK2.loopR, Lu=PA.Lu, yc=.95-r; for(let m=0;m<110;m++){ let l=((m+.5+sb)*P)%PA.loop; if(l<0) l+=PA.loop; let z,y,a;
      if(l<Lu){ z=zl(l); y=.95; a=0; } else if(l<Lu+Math.PI*r){ const f=(l-Lu)/r; z=PK2.bz1-r*Math.sin(f); y=yc+r*Math.cos(f); a=-f; }
      else if(l<2*Lu+Math.PI*r){ z=PK2.bz1+(l-Lu-Math.PI*r); y=.95-2*r; a=-Math.PI; } else { const f=(l-2*Lu-Math.PI*r)/r; z=PK2.bz0+r*Math.sin(f); y=yc-r*Math.cos(f); a=Math.PI-f; }
      put(PA.fin,m,xb,y+Math.cos(a)*.0375,z+Math.sin(a)*.0375,a); }
    PA.fin.instanceMatrix.needsUpdate=true; }
  /* ── 카톤 체인 러그 (버킷 칸막이와 같은 위치) ── */
  { let k=0,w=0; for(let b=Math.floor(sb-PZ.cEnd/P);k<30;b++){ const l=bl0(b); if(l<2.68) break; if(l>PZ.cEnd) continue; const z=zl(l); put(PA.lug,k++,cx,yC-.003,z); for(const s2 of [-1,1]) put(PA.lugW,w++,cx,yC+.021-.003,z+s2*.0485); }
    PA.lug.count=k; PA.lugW.count=w; PA.lug.instanceMatrix.needsUpdate=true; PA.lugW.instanceMatrix.needsUpdate=true; }
  PA.pin.count=0;
  /* ── 버킷 b 의 중심 위치 · 상태 ── */
  const bl=b=>(sb-b)*P;
  const drop=b=>6*(b+(PK2.bz0-PK2.ch[b&1])/P-PA.c0);                  /* 칸 b 의 게이트가 열리는 σs */
  const pushX=l=>ez((l-PZ.ps0)/(PZ.ps1-PZ.ps0));
  /* ── 스틱 : 상단 체인 위 줄 → 스프로킷 → 아래 줄(뒤집힘) → 투입구에서 정렬기 위단으로 낙하 → 6포 모이면 가운데단 → 아래단 → 버킷 ── */
  const comp=b=>6*b+5+PA.D(b&1), tY=PK2.tiers, hs=FM.stickW/2+.001;
  let k=0; const jMax=Math.floor(ss), bMin=Math.floor(sb-PZ.t1/P)-1, jMin=6*bMin;
  for(let j=jMax;j>=jMin&&k<360;j--){ const b=Math.floor(j/6), i=j-6*b, d=(ss-j)*Pf, c=b&1, zc=PK2.ch[c], sl=(i-2.5)*.0125, ds=drop(b), cp=comp(b);
    let x=xb,y,z,rx;
    if(ss<ds){ const sD=CV.sDrop(zc)-CV.L, hh=CV.hb+.0052;
      if(d<sD){ const q=CV.path(CV.L+d); y=q.y+Math.cos(q.a)*hh; z=q.z+Math.sin(q.a)*hh; rx=q.a; }
      else if(ss<cp+.6){ const q=CV.path(CV.L+sD), y0=q.y-hh, w=cl((d-sD)/PA.Lf); z=lerp(zc,zc+sl,ez(w)); y=lerp(y0,tY[2]+hs,w*w); rx=lerp(-Math.PI,-Math.PI/2,ez(w)); }
      else if(ss<cp+6.6){ const f=cl((ss-cp-.6)/.6); z=zc+sl; y=lerp(tY[2],tY[1],f*f)+hs; rx=-Math.PI/2; }
      else { const f=cl((ss-cp-6.6)/.6); z=zc+sl; y=lerp(tY[1],tY[0],f*f)+hs; rx=-Math.PI/2; } }
    else { const l=bl(b), zt=zl(l)+sl, f=cl((ss-ds)/1.0), yb=.95+hs;
      if(l>=PZ.t1) continue; rx=-Math.PI/2;
      if(f<1){ z=lerp(zc+sl,zt,ez(f)); y=lerp(tY[0]+hs,yb,f*f); }
      else { z=zt; const p=pushX(l); x=xb+p*(cx-xb); y=yb-p*.0055; } }
    put(PA.stk,k++,x,y,z,rx); }
  PA.stk.count=k; PA.stk.instanceMatrix.needsUpdate=true;
  /* ── 정렬기 게이트 : 위단(cp+.6) · 가운데단(cp+6.6) · 아래단(버킷 낙하) ── */
  if(PK2.gates) for(let c=0;c<2;c++){ const op=[0,0,0]; for(let b=Math.floor(sb)-14;b<=Math.floor(sb)+14;b++){ if((b&1)!==c) continue; const cp=comp(b), ev=[drop(b),cp+6.6,cp+.6];
      for(let ti=0;ti<3;ti++){ const t=ss-ev[ti]; if(t>-.3&&t<1.8) op[ti]=Math.max(op[ti],ez((t+.3)/.4)*(1-ez((t-1.1)/.7))); } }
    for(let ti=0;ti<3;ti++) for(const gt of PK2.gates[c][ti]) gt.G.rotation.x=gt.s*op[ti]*1.3; }
  /* ── 설명서 · 밀대 ── */
  { let n=0, pn=0; for(let b=Math.floor(sb-PZ.t1/P);b<=Math.floor(sb-PZ.lfL/P)+1;b++){ const l=bl(b); if(l<PZ.lfL||l>=PZ.t1) continue; const q=cl((l-PZ.lfL)/.1), p=pushX(l), zt=zl(l), yt=.95+FM.stickW+.004;
      put(PA.lfl,n++,xb+p*(cx-xb),lerp(1.09,yt-p*.0055,ez(q)),lerp(zl(PZ.lfL),zt,ez(q)),0);
      if(l>2.9&&l<PZ.rt1+.05&&pn<16){ const app=ez((l-2.92)/.13), rt=ez((l-(PZ.ps1+.03))/(PZ.rt1-PZ.ps1-.03)), xh=lerp(lerp(xb-.125,xb-.062,app)+p*(cx-xb),xb-.125,rt);
        put(PA.push,pn,xh,.97,zt); o.position.set(X-.2,.965,zt); o.rotation.set(0,0,0); o.scale.set(Math.max(.01,xh-(X-.2)),1,1); o.updateMatrix(); PA.rod.setMatrixAt(pn,o.matrix); pn++; } }
    PA.lfl.count=n; PA.push.count=pn; PA.rod.count=pn; PA.lfl.instanceMatrix.needsUpdate=true; PA.push.instanceMatrix.needsUpdate=true; PA.rod.instanceMatrix.needsUpdate=true; }
  /* ── 흡착 암 · 카톤 ── */
  const v2r=.3/(P*(8/6)), L1=.5, Lst=-(PKZ.y? (-9.03):0), zQ=-9.03, zT=zl(PZ.cEnd)-.32, Ltot=L1+(zT-zQ);
  const eOf=b=>(bl(b)-PZ.cEnd)*v2r, stopOf=b=>Ltot-(((b%8)+8)%8)*.094;
  const M4=PA.M4, Mc=PA.Mc, Sh=PA.Sh, Mf=PA.Mf; let nc=0, nf=0, nm=0, ng=0, np=0, arm=null;
  const flap=(m,idx,mat)=>{ Mf.multiplyMatrices(Mc,mat); m.setMatrixAt(idx,Mf); };
  const loc=(x,y,z,ry,rz,ryy)=>{ PA.e.set(0,ry,0); PA.q.setFromEuler(PA.e); const A=new T3.Matrix4().compose(PA.v.set(x,y,z),PA.q,PA.one); const R=new T3.Matrix4(); if(rz) R.makeRotationZ(rz); else if(ryy) R.makeRotationY(ryy); return A.multiply(R); };
  for(let b=Math.floor(sb-7.4/P);b<=Math.floor(sb-PZ.pk0/P);b++){ const l=bl(b); if(l<PZ.pk0) continue;
    let px,py,pz,rx=0,th=Math.PI/2, fm=-.5,fb=-.2,ft=-.6, glue=false, prt=false;
    if(l<PZ.pk1){ const q=(l-PZ.pk0)/(PZ.pk1-PZ.pk0), zt=zl(l); const mx=[cx,1.41,zl(PK2.lf[0]+.28-PK2.bz0+PK2.bz0)];
      const pm=[cx,1.405,-3.13];
      if(q<.3){ arm=lerp(-.25,1.05,ez(q/.3)); continue; }
      if(q<.65){ fm=fb=ft=0; const t=ez((q-.3)/.35); px=cx; py=lerp(pm[1],yC+.11,t); pz=lerp(pm[2],zt,t); rx=lerp(.9+Math.PI/2,0,t); th=.06; arm=lerp(1.05,-.1,t); }
      else { const t=ez((q-.65)/.35); px=cx; py=lerp(yC+.11,yC+C.H/2,t); pz=zt; th=lerp(.06,Math.PI/2,t); arm=lerp(-.1,-.25,t); fm=-.5*t; fb=-.2*t; ft=-.6*t; } }
    else if(l<=PZ.cEnd){ px=cx; py=yC+C.H/2; pz=zl(l); fm=-.5+ez((l-PZ.m0)/(PZ.m1-PZ.m0))*(Math.PI/2+.5); fb=-.2+ez((l-PZ.b0)/(PZ.b1-PZ.b0))*(Math.PI/2+.2); ft=-.6+ez((l-PZ.t0)/(PZ.t1-PZ.t0))*(Math.PI/2+.6); glue=l>=PZ.gl; }
    else { const e=Math.min(eOf(b),stopOf(b)), last=8*Math.floor(b/8)+7; if(eOf(last)>stopOf(last)+.12) continue;
      fm=fb=ft=Math.PI/2; prt=true;
      if(e<L1){ const t=e/L1, u=1-t; px=u*u*cx+2*u*t*cx+t*t*X; pz=u*u*zl(PZ.cEnd)+2*u*t*(zl(PZ.cEnd)-.22)+t*t*zT; py=lerp(yC,PKZ.y,ez(t))+C.H/2; }
      else { px=X; pz=zT-(e-L1); py=PKZ.y+C.H/2; } prt=pz<-6.05; }
    Sh.set(1,0,0,0, 0,Math.sin(th),0,0, 0,Math.cos(th),1,0, 0,0,0,1);
    PA.e.set(rx,0,0); PA.q.setFromEuler(PA.e); M4.compose(PA.v.set(px,py,pz),PA.q,PA.one); Mc.multiplyMatrices(M4,Sh);
    PA.cb.setMatrixAt(nc,Mc);
    for(const s2 of [-1,1]){ const xe=s2*C.L/2, ry=s2<0?Math.PI:0;
      flap(PA.fT,nf,loc(xe,C.H/2,0,ry,-ft)); flap(PA.fB,nf,loc(xe,-C.H/2,0,ry,fb)); nf++;
      for(const zh of [-1,1]){ const sg=(zh>0?1:-1)*s2; flap(PA.fm,nm++,loc(s2*(C.L/2-.002),0,zh*(C.W/2-.001),ry,0,sg*fm)); }
      if(glue) for(const dz of [-.022,.022]){ const G=loc(xe,-C.H/2,0,ry,fb); G.multiply(new T3.Matrix4().makeTranslation(PA.fa*.62,-.003,dz)); Mf.multiplyMatrices(Mc,G); PA.glue.setMatrixAt(ng++,Mf); } }
    if(prt){ const G=new T3.Matrix4().compose(PA.v.set(C.L/2+PA.fa*0+.0035,.004,0),PA.q.setFromEuler(PA.e.set(0,Math.PI/2,0)),PA.one); Mf.multiplyMatrices(Mc,G); PA.prt.setMatrixAt(np++,Mf); }
    nc++; }
  for(const [m,n] of [[PA.cb,nc],[PA.fT,nf],[PA.fB,nf],[PA.fm,nm],[PA.glue,ng],[PA.prt,np]]){ m.count=n; m.instanceMatrix.needsUpdate=true; }
  if(PK2.pickArm&&arm!==null) PK2.pickArm.rotation.x=arm;
  /* ── X-ray 커튼 ── */
  if(PA.curt.length){ const zs=[]; for(let b=Math.floor(sb-7.4/P);b<=Math.floor(sb-PZ.cEnd/P);b++){ const e=Math.min(eOf(b),stopOf(b)); if(e>L1) zs.push(zT-(e-L1)); }
    for(const c of PA.curt){ let a=0; for(const z of zs){ const dz=z-c.z; if(dz>-.06&&dz<.12) a=Math.max(a,(1-Math.abs(dz-.03)/.09)*(Math.abs(c.x-X)<.07?1.1:.35)); } c.G.rotation.x=Math.max(0,a); } }
}
