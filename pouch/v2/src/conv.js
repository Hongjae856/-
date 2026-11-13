/* ═══ 배출부 (현장 영상 + 사용자 확정 11/11)
   슈트 → 고정된 검은 칸막이 사이 칸(바닥 게이트 위)에 10포 안착 → 바닥이 열려 동시에 낙하 →
   바로 아래에서 멈추지 않고 연속 주행하는 컨베이어의 금속 U 자 받침에 1포씩 정확히 들어감 → 북쪽 일직선 → 경사 상승 → 벽 개구부.
   받침 간격 = 성형 열 간격. 받침 · 스틱은 경로 함수 CV.at(s) 로 배치해 한 몸으로 움직인다. 프레임 서쪽 기둥 바깥으로 지나간다 ═══ */
const CV={ w:.13, zS:FL.zc+.56, zB:FL.zc-.95, zE:-.45, yE:1.52, R:.16, hb:.008 };
function buildConveyor(S){
  const g=new T3.Group(); S.add(g); const y0=FM.beltY, zS=CV.zS, zB=CV.zB, zE=CV.zE, yE=CV.yE, hw=CV.w/2, zc=FL.zc, X=CVX, zT=zc-.42;
  const L1=zS-zB, L2=Math.hypot(zB-zE,yE-y0), A=Math.atan2(yE-y0,zB-zE), R=CV.R; CV.L=L1+L2; CV.L1=L1; CV.A=A;
  CV.at=s=>{ if(s<L1-R) return {y:y0,z:zS-s,a:0}; if(s>L1+R){ const d=s-L1; return {y:y0+d*Math.sin(A),z:zB-d*Math.cos(A),a:A}; }
    const t=(s-(L1-R))/(2*R), p0=[zB+R,y0], p1=[zB,y0], p2=[zB-R*Math.cos(A),y0+R*Math.sin(A)], u=1-t;
    const z=u*u*p0[0]+2*u*t*p1[0]+t*t*p2[0], y=u*u*p0[1]+2*u*t*p1[1]+t*t*p2[1], dz=2*u*(p1[0]-p0[0])+2*t*(p2[0]-p1[0]), dy=2*u*(p1[1]-p0[1])+2*t*(p2[1]-p1[1]); return {y,z,a:Math.atan2(dy,-dz)}; };
  /* 체인톱처럼 감기는 무한 루프 (사용자 설명 11/13) : 트레이 → 경사 → 벽 → 포장실 수평 위 줄(A) → 북쪽 스프로킷(B, 180° 감김) →
     아래 줄(C, 칸이 뒤집힌 채 정렬기 위를 지나며 스틱을 떨어뜨림) → 같은 길을 아래로 되돌아 → 트레이 남쪽 스프로킷 → 다시 트레이 */
  const atC=CV.at, Lb=.12, cA=Math.cos(A), sA=Math.sin(A), zN=-1.5, z2=zE-cA*Lb/2-Lb/2, yT=yE+sA*Lb/2, Lh=z2-zN, Lc=CV.L+Lb+Lh;
  const carry=s=>{ if(s<=CV.L) return atC(s); if(s<CV.L+Lb){ const t=(s-CV.L)/Lb, u=1-t, p0=[zE,yE], p1=[zE-cA*Lb/2,yE+sA*Lb/2], p2=[z2,yT];
      const z=u*u*p0[0]+2*u*t*p1[0]+t*t*p2[0], y=u*u*p0[1]+2*u*t*p1[1]+t*t*p2[1], dz=2*u*(p1[0]-p0[0])+2*t*(p2[0]-p1[0]), dy=2*u*(p1[1]-p0[1])+2*t*(p2[1]-p1[1]); return {y,z,a:Math.atan2(dy,-dz)}; }
    return {y:yT,z:z2-(s-CV.L-Lb),a:0}; };
  const Nl=Math.round((2*Lc+2*Math.PI*.1)/FM.P), r=(Nl*FM.P-2*Lc)/(2*Math.PI); Object.assign(CV,{Lb,zN,z2,topY:yT,Lc,r,loop:Nl*FM.P,Nl});
  CV.path=s=>{ s=((s%CV.loop)+CV.loop)%CV.loop; if(s<Lc) return carry(s);
    if(s<Lc+Math.PI*r){ const f=(s-Lc)/r; return {y:yT-r+r*Math.cos(f),z:zN-r*Math.sin(f),a:-f}; }
    if(s<2*Lc+Math.PI*r){ const q=carry(Lc-(s-Lc-Math.PI*r)); return {y:q.y-2*r*Math.cos(q.a),z:q.z-2*r*Math.sin(q.a),a:q.a+Math.PI}; }
    const f=(s-2*Lc-Math.PI*r)/r; return {y:y0-r-r*Math.cos(f),z:zS+r*Math.sin(f),a:Math.PI-f}; };
  CV.sDrop=zc2=>{ const sc=CV.L+Lb+(z2-zc2); return Lc+Math.PI*r+(Lc-sc); };
  /* 구간 틀 : 받침(알루미늄) · 벨트 · 옆 가이드 · 투명 커버 (트레이 구간은 동쪽이 슈트 쪽으로 열림) */
  const sect=(G,l0,l1,o)=>{ bx(G,-hw-.03,hw+.03,-2*CV.r-.05,-.004,l0,l1,M.alu); bx(G,-hw-.032,-hw-.03,-2*CV.r-.04,-.02,l0,l1,M.ssD); bx(G,-hw,hw,-.004,0,l0,l1,M.belt);
    bx(G,-hw-.02,-hw-.003,0,.03,l0,l1,M.ss); if(!o.open) bx(G,hw+.003,hw+.02,0,.03,l0,l1,M.ss);
    const lh=o.open?FM.gateY-y0+.1:.1;                                                    /* 트레이 구간 뚜껑은 슈트 끝 · 미끄러져 들어오는 스틱과 닿지 않게 높이고 동쪽 끝을 물림 */
    bx(G,-hw-.034,-hw-.028,0,lh,l0,l1,M.acryl); if(!o.open) bx(G,hw+.028,hw+.034,0,.1,l0,l1,M.acryl);
    bx(G,-hw-.034,o.open?hw-.04:hw+.034,lh,lh+.006,l0,l1,M.acryl);
    for(const s of (o.open?[-1]:[-1,1])) for(let z=l0+.08;z<l1;z+=.42) bx(G,s*(hw+.036)-.004,s*(hw+.036)+.004,-.05,lh+.006,z-.012,z+.012,M.alu); };
  { const G=new T3.Group(); G.position.set(X,y0,0); g.add(G); sect(G,zT,zS,{open:true});
    const lh=FM.gateY-y0+.1;
    for(const z of [zc-.4,zc+.4]){ rod(G,[-.085,lh+.04,z],[-.005,lh+.04,z],.008,M.white,10); for(const d of [-.085,-.005]) rod(G,[d,lh+.006,z],[d,lh+.04,z],.007,M.white,8); }       /* 흰 손잡이 : 슈트 구간 바깥 양끝 */
    for(const z of [zc,zc-.37,zc+.37]) bx(G,-hw-.034,hw-.04,lh,lh+.012,z-.003,z+.003,M.acryl);
    const lb=plate(G,.26,.05,labelTex([["주 의","#111",46],["제품 제거 시 핀셋 사용","#111",46]],{w:640,h:130,border:"#888"}),[-hw+.0,lh+.008,zc-.19],0); lb.rotation.x=-Math.PI/2; lb.rotation.z=-Math.PI/2; }
  /* 고정 칸막이(검정) 11 · 칸 바닥 게이트(열별 좌우 날개 2장) — 스틱이 잠깐 놓였다가 바닥이 열리며 아래 받침으로 낙하 */
  { const yG=FM.gateY, n=FM.n, P=FM.P, e=k=>zc-n*P/2+P*k; FM.flaps=[];
    for(let k=0;k<=n;k++){ bx(g,X-hw,X+hw,yG-.006,yG+.028,e(k)-.014,e(k)+.014,M.belt); rod(g,[X+hw,yG+.012,e(k)],[X+hw+.004,yG+.012,e(k)],.007,M.dark,10); rod(g,[X+hw+.004,yG+.012,e(k)],[X+hw+.006,yG+.012,e(k)],.003,M.ssMir,8); }
    for(const x of [X-hw-.012,X-hw]) bx(g,x-.004,x+.004,yG-.02,yG+.03,e(0)-.03,e(n)+.03,M.ss);
    for(const z of [e(0)-.03,e(n)+.03]) bx(g,X-hw-.016,X+hw,yG-.02,yG+.03,z-.004,z+.004,M.ss);
    for(let i=0;i<n;i++) for(const sg of [1,-1]){ const pv=new T3.Group(); pv.position.set(X,yG-.002,sg>0?e(i)+.014:e(i+1)-.014); g.add(pv); const f=new T3.Mesh(new T3.BoxGeometry(CV.w-.004,.003,.0205),M.dark); f.position.z=sg*.0103; pv.add(f); FM.flaps.push({pv,sg}); } }
  { const G=new T3.Group(); G.position.set(X,y0,0); g.add(G); sect(G,zB,zT,{}); for(const z of [zB+.25]){ rod(G,[-.04,.135,z-.05],[.04,.135,z-.05],.007,M.white,8); } }
  { const G=new T3.Group(); G.position.set(X,(y0+yE)/2,(zB+zE)/2); G.rotation.x=A; g.add(G); sect(G,-L2/2,L2/2,{});
    for(const t of [-.3,0,.3]) for(const s of [-1,1]) rod(G,[s*(hw+.05),.07,t*L2-.05],[s*(hw+.05),.07,t*L2+.05],.007,M.ssMir,8); }
  /* 금속 U 자 받침 · 스틱 */
  const P=FM.P, N=CV.Nl, o=new T3.Object3D();
  const sh=new T3.Shape(); [[-.03,0],[.03,0],[.03,.018],[.026,.018],[.026,CV.hb],[-.026,CV.hb],[-.026,.018],[-.03,.018]].forEach(([a,b],i)=>i?sh.lineTo(a,b):sh.moveTo(a,b));
  const hg=new T3.ExtrudeGeometry(sh,{depth:CV.w-.012,bevelEnabled:false}); hg.translate(0,0,-(CV.w-.012)/2); hg.rotateY(Math.PI/2);
  const cle=new T3.InstancedMesh(hg,M.ss,N); cle.castShadow=true; cle.frustumCulled=false; g.add(cle);
  const stk=new T3.InstancedMesh(stickGeo(FM.stickL,FM.stickW,.009),M.stick,N); stk.castShadow=true; stk.frustumCulled=false; g.add(stk);
  CV.N=N; CV.full=new Uint8Array(N+4); CV.out=0; CV.prev=null;
  CV.sOf=(k,u)=>{ const span=N*P; return ((k*P+u)%span+span)%span; };                                     /* 칸 k 중심의 경로 위치 */
  CV.set=u=>{ for(let k=0;k<N;k++){ const s=CV.sOf(k,u); if(CV.prev){ if(CV.prev[k]>=0&&CV.prev[k]<=CV.L&&(s>CV.L||s<CV.prev[k])){ CV.out+=CV.full[k]; CV.full[k]=0; } CV.prev[k]=s; }
      const vis=s<=CV.L, q=CV.path(s), c=Math.cos(q.a), sn=Math.sin(q.a);
      o.position.set(X,q.y,q.z); o.rotation.set(q.a,0,0); o.scale.setScalar(1); o.updateMatrix(); cle.setMatrixAt(k,o.matrix);
      const h=CV.hb+.0052; o.position.set(X,q.y+c*h,q.z+sn*h); o.scale.setScalar(vis&&CV.full[k]?1:0); o.updateMatrix(); stk.setMatrixAt(k,o.matrix); }
    cle.instanceMatrix.needsUpdate=true; stk.instanceMatrix.needsUpdate=true; };
  CV.set(0);
  /* 트레이 하부 함체 (핀셋 거치 · 압력계 2) · 다리 · 남쪽 구동부 (곡면 커버) */
  bx(g,X-hw-.16,X+hw+.03,.14,y0-.06,zT+.04,zS,M.ss); bx(g,X-hw-.2,X-hw-.16,y0-.16,y0-.04,zT+.06,zS-.04,M.ssMir);
  plate(g,.07,.03,labelTex([["핀셋","#111",70]],{w:256,h:100}),[X-hw-.201,y0-.07,zS-.12],-Math.PI/2);
  for(const dz of [-.08,.02]){ rod(g,[X-hw-.16,.24,zc+dz],[X-hw-.175,.24,zc+dz],.02,M.white,16); rod(g,[X-hw-.175,.24,zc+dz],[X-hw-.178,.24,zc+dz],.022,M.ssD,16); }
  for(const z of [zT+.1,zS-.06]) for(const x of [X-hw-.12,X+hw]){ rod(g,[x,.03,z],[x,.14,z],.014,M.ssD,10); rod(g,[x,0,z],[x,.03,z],.032,M.ss,16); }
  bx(g,X-hw-.07,X+hw+.07,.14,y0+.04,zS,zS+.26,M.ssMir); { const c=new T3.Mesh(new T3.CylinderGeometry(.13,.13,CV.w+.14,28,1,false,0,Math.PI),M.ssMir); c.rotation.z=Math.PI/2; c.position.set(X,y0+.04,zS+.13); add(g,c); }
  bx(g,X+hw+.07,X+hw+.2,.2,.34,zS+.04,zS+.2,M.dark); rod(g,[X+hw+.2,.27,zS+.12],[X+hw+.24,.27,zS+.12],.05,M.blue,18);
  /* 바닥 조작 박스(비상정지) · 그 위 경광등(적 · 황 · 녹) — 트레이 북서 */
  { const bx0=X-hw-.5, bz=zT-.2; bx(g,bx0,bx0+.4,.08,.42,bz-.19,bz+.19,M.ssMir); for(const dx of [.04,.36]) for(const dz of [-.15,.15]) rod(g,[bx0+dx,0,bz+dz],[bx0+dx,.08,bz+dz],.014,M.ssD,8);
    bx(g,bx0+.05,bx0+.17,.42,.48,bz-.06,bz+.06,M.yellow); rod(g,[bx0+.11,.48,bz],[bx0+.11,.51,bz],.03,M.red,18); rod(g,[bx0+.25,.42,bz+.08],[bx0+.25,.44,bz+.08],.012,M.dark,10);
    rod(g,[bx0+.34,.42,bz-.13],[bx0+.34,.86,bz-.13],.013,M.ssMir,12); for(const [k,m] of [[0,M.green],[1,M.orange],[2,M.red]]) rod(g,[bx0+.34,.86+k*.055,bz-.13],[bx0+.34,.912+k*.055,bz-.13],.028,m,18); rod(g,[bx0+.34,1.025,bz-.13],[bx0+.34,1.04,bz-.13],.03,M.ssD,18);
    plate(g,.1,.07,labelTex([["⚡","#111",90]],{w:128,h:100,bg:"#f5d400"}),[bx0-.001,.25,bz],-Math.PI/2); }
  /* 경사부 받침대 (회색 도장 강재 · 세로 기둥 + 비스듬한 보강 · 캐스터) · 아래쪽 원형 받침 · 표지 */
  { const q=CV.at(L1+L2*.55), zs=q.z, ys=q.y-.07, q0=CV.at(L1+L2*.3);
    for(const s of [-1,1]){ bx(g,X+s*.2-.025,X+s*.2+.025,.1,.15,zs-.2,zs+.6,M.steel); bx(g,X+s*.2-.03,X+s*.2+.03,.15,ys,zs-.06,zs+.0,M.steel);
      const d=new T3.Mesh(new T3.BoxGeometry(.05,Math.hypot(.55,ys-.5),.05),M.steel); d.position.set(X+s*.2,(.15+ys-.35)/2+.1,zs+.25); d.rotation.x=-Math.atan2(.55,ys-.5); add(g,d);
      for(const dz of [-.16,.56]){ rod(g,[X+s*.2,.03,zs+dz],[X+s*.2,.1,zs+dz],.018,M.ssD,10); rod(g,[X+s*.2,0,zs+dz],[X+s*.2,.03,zs+dz],.035,M.dark,14); } }
    bx(g,X-.2,X+.2,.1,.15,zs+.2,zs+.25,M.steel); bx(g,X-.2,X+.2,ys-.05,ys,zs-.06,zs,M.steel);
    rod(g,[X,0,q0.z],[X,.015,q0.z],.1,M.ss,24); rod(g,[X,.015,q0.z],[X,q0.y-.06,q0.z],.02,M.ss,12);
    for(const t of [.35,.75]){ const q2=CV.at(L1+L2*t); plate(g,.24,.05,labelTex([["안전커버 임의 Open 금지!","#c00",44]],{w:640,h:130,border:"#c00"}),[X+hw+.037,q2.y+.05,q2.z],Math.PI/2); }
    const q3=CV.at(L1+L2*.5); plate(g,.12,.09,labelTex([["불량 조치 시","#c00",50],["핀셋 사용","#c00",50]],{w:320,h:240,border:"#c00"}),[X+hw+.037,q3.y-.06,q3.z],Math.PI/2); }
  return g;
}
