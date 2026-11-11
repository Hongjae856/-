/* ═══ 배출 컨베이어 : 슈트 아래 칸막이 벨트(트레이) → 북쪽 일직선 → 경사 상승 → 벽 개구부 → 스틱공급장치 상단
   칸 간격 = 성형 열 간격 (10열이 동시에 10칸에 1포씩 안착). 칸막이 · 스틱은 경로 함수 CV.at(s) 로 배치한다 ═══ */
const CV={ w:.15, zS:FL.zc+.66, zB:FL.zc-.95, zE:-.45, yE:1.52, R:.16, H:.018 };
function buildConveyor(S){
  const g=new T3.Group(); S.add(g); const y0=FM.beltY, zS=CV.zS, zB=CV.zB, zE=CV.zE, yE=CV.yE, hw=CV.w/2, zc=FL.zc, X=CVX;
  const L1=zS-zB, L2=Math.hypot(zB-zE,yE-y0), A=Math.atan2(yE-y0,zB-zE), R=CV.R; CV.L=L1+L2; CV.L1=L1; CV.A=A;
  /* s(남쪽 끝 기준 거리) → 벨트 윗면 점 · 기울기. 꺾이는 곳은 2차 곡선으로 둥글게 */
  CV.at=s=>{ if(s<L1-R) return {y:y0,z:zS-s,a:0}; if(s>L1+R){ const d=s-L1; return {y:y0+d*Math.sin(A),z:zB-d*Math.cos(A),a:A}; }
    const t=(s-(L1-R))/(2*R), p0=[zB+R,y0], p1=[zB,y0], p2=[zB-R*Math.cos(A),y0+R*Math.sin(A)], u=1-t;
    const z=u*u*p0[0]+2*u*t*p1[0]+t*t*p2[0], y=u*u*p0[1]+2*u*t*p1[1]+t*t*p2[1], dz=2*u*(p1[0]-p0[0])+2*t*(p2[0]-p1[0]), dy=2*u*(p1[1]-p0[1])+2*t*(p2[1]-p1[1]); return {y,z,a:Math.atan2(dy,-dz)}; };
  /* 구간 틀 : 받침(알루미늄) · 벨트 · 옆 가이드 · 투명 커버 */
  const sect=(G,l0,l1,o)=>{ bx(G,-hw-.03,hw+.03,-.06,-.004,l0,l1,M.alu); bx(G,-hw,hw,-.004,0,l0,l1,M.belt);
    bx(G,-hw-.02,-hw-.003,0,.045,l0,l1,M.ss); if(!o.open) bx(G,hw+.003,hw+.02,0,.045,l0,l1,M.ss);
    bx(G,-hw-.034,-hw-.028,0,.135,l0,l1,M.acryl); if(!o.open) bx(G,hw+.028,hw+.034,0,.135,l0,l1,M.acryl);
    bx(G,-hw-.034,o.open?hw:hw+.034,.135,.141,l0,l1,M.acryl);
    for(const s of (o.open?[-1]:[-1,1])) for(let z=l0+.08;z<l1;z+=.42) bx(G,s*(hw+.036)-.004,s*(hw+.036)+.004,-.05,.141,z-.012,z+.012,M.alu); };
  { const G=new T3.Group(); G.position.set(X,y0,0); g.add(G); sect(G,zc-.57,zS,{open:true}); }
  { const G=new T3.Group(); G.position.set(X,y0,0); g.add(G); sect(G,zB,zc-.57,{});
    for(const z of [zc-.2,zc+.3]){ rod(G,[-hw-.05,.16,z-.07],[-hw-.05,.16,z+.07],.007,M.ssMir,8); for(const d of [-.07,.07]) rod(G,[-hw-.034,.141,z+d],[-hw-.05,.16,z+d],.005,M.ssMir,6); } }
  { const G=new T3.Group(); G.position.set(X,(y0+yE)/2,(zB+zE)/2); G.rotation.x=A; g.add(G); sect(G,-L2/2,L2/2,{});
    for(const t of [-.25,.05,.3]) for(const s of [-1,1]){ rod(G,[s*(hw+.05),.09,t*L2-.06],[s*(hw+.05),.09,t*L2+.06],.007,M.ssMir,8); } }
  /* 칸막이 · 스틱 (경로를 따라 놓임 — 구동 시 CV.set 로 함께 이동) */
  const P=FM.P, N=Math.ceil(CV.L/P)+1, o=new T3.Object3D();
  const cle=new T3.InstancedMesh(new T3.BoxGeometry(CV.w-.012,CV.H,.004),M.belt,N); cle.castShadow=true; g.add(cle);
  const stk=new T3.InstancedMesh(stickGeo(FM.stickL,FM.stickW,.009),M.stick,N); stk.castShadow=true; stk.receiveShadow=true; g.add(stk);
  CV.N=N; CV.full=new Uint8Array(N+4).fill(1);
  CV.out=0; CV.set=u=>{ const span=N*P; for(let k=0;k<N;k++){ let s=((k*P+u)%span+span)%span; if(CV.prev){ if(s<CV.prev[k]-P){ CV.out+=CV.full[k]; CV.full[k]=0; } CV.prev[k]=s; } const q=CV.at(Math.min(s,CV.L)), vis=s<=CV.L;
      o.position.set(X,q.y+Math.cos(q.a)*CV.H/2,q.z+Math.sin(q.a)*CV.H/2); o.rotation.set(q.a,0,0); o.scale.setScalar(vis?1:0); o.updateMatrix(); cle.setMatrixAt(k,o.matrix);
      const s2=s+P/2, q2=CV.at(Math.min(s2,CV.L)), on=CV.full[k]&&s2<CV.L; o.position.set(X,q2.y+Math.cos(q2.a)*.0052,q2.z+Math.sin(q2.a)*.0052); o.rotation.set(q2.a,0,0); o.scale.setScalar(on?1:0); o.updateMatrix(); stk.setMatrixAt(k,o.matrix); }
    cle.instanceMatrix.needsUpdate=true; stk.instanceMatrix.needsUpdate=true; };
  CV.set(0);
  /* 트레이 하부 함체 · 다리 · 남쪽 구동부 (곡면 커버 · 감속기) */
  bx(g,X-hw-.05,X+hw+.03,.3,y0-.06,zc-.78,zS,M.ss); bx(g,X-hw-.056,X-hw-.05,.34,y0-.1,zc-.7,zS-.08,M.ssD);
  for(const z of [zc-.72,zS-.06]) for(const x of [X-hw-.02,X+hw]){ rod(g,[x,.03,z],[x,.3,z],.016,M.ssD,10); rod(g,[x,0,z],[x,.03,z],.035,M.ss,16); }
  bx(g,X-hw-.07,X+hw+.07,.3,y0+.06,zS,zS+.3,M.ssMir); { const c=new T3.Mesh(new T3.CylinderGeometry(.15,.15,CV.w+.14,28,1,false,0,Math.PI),M.ssMir); c.rotation.z=Math.PI/2; c.position.set(X,y0+.06,zS+.15); add(g,c); }
  bx(g,X-.08,X+.08,.36,.56,zS+.3,zS+.46,M.blue); rod(g,[X,.46,zS+.46],[X,.46,zS+.56],.05,M.dark,18);
  /* 경광등(녹 · 황 · 적) · 바닥 조작 박스(비상정지) — 트레이 북서 모서리 */
  { const bx0=X-hw-.42, bz=zc-.95; rod(g,[bx0+.3,.5,bz],[bx0+.3,1.02,bz],.014,M.ssMir,12); for(const [k,m] of [[0,M.green],[1,M.yellow],[2,M.red]]) rod(g,[bx0+.3,1.02+k*.055,bz],[bx0+.3,1.072+k*.055,bz],.028,m,18); rod(g,[bx0+.3,1.185,bz],[bx0+.3,1.2,bz],.03,M.ssD,18);
    bx(g,bx0,bx0+.42,.1,.5,bz-.2,bz+.2,M.ssMir); for(const dx of [.04,.38]) for(const dz of [-.16,.16]) rod(g,[bx0+dx,0,bz+dz],[bx0+dx,.1,bz+dz],.014,M.ssD,8);
    bx(g,bx0+.05,bx0+.17,.5,.57,bz-.06,bz+.06,M.yellow); rod(g,[bx0+.11,.57,bz],[bx0+.11,.6,bz],.032,M.red,18);
    plate(g,.2,.07,labelTex([["불량 조치 시","#c00",50],["핀셋 사용","#c00",50]],{w:384,h:140,border:"#c00"}),[bx0+.24,.502,bz-.1],0).rotation.x=-Math.PI/2; }
  /* 경사부 A자 받침대 (회색 · 캐스터) · 표지 */
  { const q=CV.at(L1+L2*.5), zs=q.z, ys=q.y-.07; for(const s of [-1,1]){ rod(g,[X+s*.22,.06,zs-.25],[X+s*.13,ys,zs],.02,M.grey); rod(g,[X+s*.22,.06,zs+.25],[X+s*.13,ys,zs],.02,M.grey); rod(g,[X+s*.22,.06,zs-.25],[X+s*.22,.06,zs+.25],.02,M.grey); for(const dz of [-.25,.25]) rod(g,[X+s*.22,0,zs+dz],[X+s*.22,.05,zs+dz],.025,M.dark,12); }
    rod(g,[X-.22,.35,zs-.12],[X+.22,.35,zs-.12],.016,M.grey); rod(g,[X-.13,ys,zs],[X+.13,ys,zs],.016,M.grey);
    const q2=CV.at(L1+.35); plate(g,.26,.06,labelTex([["안전커버 임의 Open 금지!","#c00",44]],{w:640,h:150,bar:"#c2185b"}),[X-hw-.037,q2.y+.07,q2.z],-Math.PI/2).rotation.x=0; }
  return g;
}
