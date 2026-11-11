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
  /* ── 스틱공급장치 (Hoonga) ── */
  { const [z0,z1]=P.sf, x0=X-.62, x1=X+.62;
    bx(g,x0,x1,.06,.12,z0,z1,M.ssD); bx(g,x0,x0+.5,.12,2.0,z0,z1,M.ss); bx(g,x0,x1,1.98,2.02,z0,z1,M.ss);
    for(const z of [z0,(z0+z1)/2,z1]) bx(g,x1-.03,x1+.03,.12,2.0,z-.03,z+.03,M.white);
    acry(x1-.005,x1+.005,.14,1.98,z0+.03,z1-.03);
    bx(g,x0+.5,x0+.62,1.55,1.85,z0+.15,z1-.25,M.alu); plate(g,.5,.12,labelTex([["Hoonga","#fff",110]],{w:512,h:130,bg:"#9aa1a7"}),[x0+.622,1.72,z0+.5],Math.PI/2);
    { const w=new T3.Mesh(new T3.CylinderGeometry(.2,.2,.1,32),M.alu); w.rotation.z=Math.PI/2; w.position.set(x0+.6,1.62,z0+.38); add(g,w); const c=new T3.Mesh(new T3.CylinderGeometry(.09,.09,.11,24),M.yellow); c.rotation.z=Math.PI/2; c.position.set(x0+.61,1.62,z0+.38); add(g,c); }
    bx(g,x0+.5,x0+.75,1.0,1.5,(z0+z1)/2-.2,(z0+z1)/2+.25,M.dark); acry(x0+.75,x0+.76,1.0,1.5,(z0+z1)/2-.2,(z0+z1)/2+.25);
    bx(g,x0+.5,x0+.8,.72,.9,z0+.1,z1-.05,M.ss); bx(g,x0+.52,x0+.78,.9,.92,z0+.1,z1-.05,M.white);
    for(let k=0;k<13;k++) bx(g,x0+.54,x0+.76,.92,1.0,z0+.14+k*.115,z0+.15+k*.115,M.white);
    acry(x0+.6,x0+.85,1.1,1.35,z1-.42,z1-.12); acry(x0+.6,x0+.9,1.02,1.3,z0+.12,z0+.55);
    plate(g,.34,.1,labelTex([["※ 반드시 투입한 손으로, 동작 버튼을 누르세요!","#1565c0",30],["타인은 동작 버튼 조작 금지!","#c00",28]],{w:768,h:220,bar:"#c2185b"}),[x1+.008,1.42,z0+.34],Math.PI/2);
    plate(g,.2,.12,labelTex([["DANGER","#fff",54],["재해발생 위험장소","#111",40]],{w:384,h:230,border:"#c00",bg:"#fff"}),[x1+.008,1.86,z1-.3],Math.PI/2);
    beacon(X,2.02,(z0+z1)/2);
    /* 판넬 (장비 동남쪽 · 회전 암) */
    bx(g,x1,x1+.25,1.5,1.56,z1-.06,z1,M.white); bx(g,x1+.2,x1+.3,1.15,1.65,z1-.52,z1-.02,M.white); bx(g,x1+.3,x1+.305,1.3,1.58,z1-.44,z1-.14,M.scr);
    for(const [k,m] of [[0,M.white],[1,M.dark],[2,M.blue],[3,M.red]]) rod(g,[x1+.3,1.56-k*.1,z1-.08],[x1+.32,1.56-k*.1,z1-.08],.018,m,14); }
  /* ── 카토너 HC 100L (Hoonga) + 설명서 공급장치 + 핫멜트 ── */
  { const [z0,z1]=P.ct, x0=X-.62, x1=X+.62;
    bx(g,x0,x1,.1,.2,z0,z1,M.dark); for(const z of [z0+.2,(z0+z1)/2,z1-.2]) bx(g,X-.4,X+.4,0,.1,z-.06,z+.06,M.ssD);
    bx(g,x0,x0+.55,.2,1.9,z0,z1,M.ss); bx(g,x0+.55,x1-.1,.62,.78,z0+.1,z1-.1,M.ss);
    for(let k=0;k<22;k++){ const z=z0+.2+k*.15; bx(g,x0+.62,x0+.86,.8,.9,z,z+.1,k%3?M.white:M.red); }                  /* 버킷 체인 위 카톤 */
    for(const z of [z0,z0+1.1,z0+2.25,z1]) bx(g,x1-.03,x1+.03,.2,1.72,z-.03,z+.03,M.white);
    acry(x1-.005,x1+.005,.22,1.7,z0+.03,z1-.03); bx(g,x0,x1+.06,1.7,1.72,z0,z1,M.acryl);
    bx(g,x0+.1,x1+.02,1.72,1.9,z0+.2,z1-.9,M.ss);                                                                     /* 상단 레일 */
    for(let k=0;k<4;k++){ const z=z0+.6+k*.45; bx(g,x1+.02,x1+.05,1.76,1.86,z-.04,z+.04,M.white); rod(g,[x1+.05,1.79,z],[x1+.075,1.79,z],.018,M.dark,14); }
    bx(g,x0+.25,x1-.15,1.9,1.98,z0+.3,z1-1.2,M.white);                                                                 /* 카톤 매거진 (눕혀 적재) */
    for(let k=0;k<30;k++) bx(g,x0+.25,x1-.15,1.9,1.985,z0+.3+k*.065,z0+.302+k*.065,M.grey);
    plate(g,.7,.16,labelTex([["Hoonga","#fff",120]],{w:640,h:150,bg:"#9aa1a7"}),[x1+.008,1.25,z1-.9],Math.PI/2);
    plate(g,.24,.1,labelTex([["불량 조치 시","#c00",50],["핀셋 사용","#c00",50]],{w:384,h:160,border:"#c00"}),[x1+.008,.5,(z0+z1)/2],Math.PI/2);
    for(const [z,t] of [[z1-.3,"설명서 불량"],[z1-1.3,"설명서 삽입 불량"],[z0+.35,"케이스 성형 불량"]]){ acry(x1+.02,x1+.3,.22,.6,z-.15,z+.15); plate(g,.24,.08,labelTex([["포장실","#111",40],[t,"#111",44]],{w:384,h:130,border:"#333"}),[x1+.302,.4,z],Math.PI/2); }
    beacon(X,1.98,z0+.25);
    /* 설명서 공급장치 (입구 상부) */
    acry(X-.3,X+.3,1.9,2.45,z1-.75,z1-.35); { const w=new T3.Mesh(new T3.CylinderGeometry(.17,.17,.06,32),M.black); w.rotation.z=Math.PI/2; w.position.set(X+.2,2.16,z1-.55); add(g,w); }
    { const r=new T3.Mesh(new T3.BoxGeometry(.5,.02,.3),M.ss); r.position.set(X,2.2,z1-.2); r.rotation.x=-.45; add(g,r); for(const dx of [-.15,0,.15]) rod(g,[X+dx,2.22,z1-.12],[X+dx,2.45,z1-.02],.01,M.ssMir); const pp=new T3.Mesh(new T3.BoxGeometry(.3,.06,.2),M.white); pp.position.set(X,2.25,z1-.2); pp.rotation.x=-.45; add(g,pp); }
    bx(g,X-.3,X+.35,1.72,1.9,z1-.8,z1-.3,M.ss); rod(g,[X+.35,1.8,z1-.6],[X+.37,1.8,z1-.6],.02,M.dark,14); bx(g,X+.35,X+.45,1.76,1.86,z1-.44,z1-.34,M.yellow); rod(g,[X+.45,1.81,z1-.39],[X+.48,1.81,z1-.39],.025,M.red,14);
    plate(g,.12,.03,labelTex([["정지스위치","#111",60]],{w:384,h:90,border:"#111"}),[X+.352,1.86,z1-.6],Math.PI/2);
    /* 노란 체인 차단줄 · 핫멜트 유닛(파란 장치 · 서쪽 뒤) · LS 판넬(출구 동쪽) */
    tube(g,[[x1+.05,.55,z1-.05],[x1+.3,.4,z1+.02],[x1+.05,.55,P.sf[0]+.05]],.012,M.yellow);
    bx(g,x0-.5,x0-.1,.5,1.0,z0+.2,z0+.7,M.blue); rod(g,[x0-.3,1.0,z0+.45],[x0-.3,1.08,z0+.45],.03,M.white,14); tube(g,[[x0-.3,.9,z0+.3],[x0-.1,1.2,z0+.1],[x0+.5,1.3,z0+.15],[x0+.7,1.0,z0+.2]],.022,M.hoseB);
    bx(g,x1+.05,x1+.6,.2,1.25,z0-.02,z0+.5,M.ss); bx(g,x1+.1,x1+.62,1.25,1.8,z0+.03,z0+.45,M.ss); bx(g,x1+.62,x1+.625,1.35,1.72,z0+.12,z0+.42,M.scr);
    for(const [k,m] of [[0,M.white],[1,M.dark],[2,M.blue],[3,M.red]]) rod(g,[x1+.62,1.7-k*.1,z0+.07],[x1+.64,1.7-k*.1,z0+.07],.018,m,14); }
  /* ── 케이스 프린터 · 비전 (Domino) ── */
  { const [z0,z1]=P.pr, zc=(z0+z1)/2;
    bx(g,X-.55,X-.15,.1,2.05,zc-.3,zc+.3,M.ss); bx(g,X-.15,X-.14,1.5,1.95,zc-.28,zc+.28,M.dark); bx(g,X-.14,X-.135,1.53,1.92,zc-.25,zc+.25,M.scr);
    for(const [dz,m] of [[-.1,M.green],[0,M.red]]) rod(g,[X-.15,1.38,zc+dz],[X-.13,1.38,zc+dz],.015,m,12); rod(g,[X-.15,1.38,zc+.14],[X-.11,1.38,zc+.14],.03,M.red,16); rod(g,[X-.15,1.38,zc+.14],[X-.14,1.38,zc+.14],.045,M.yellow,16);
    bx(g,X-.05,X+.3,.1,.85,zc-.3,zc+.3,M.ss); bx(g,X+.3,X+.305,.35,.62,zc-.16,zc+.16,M.dark); bx(g,X+.305,X+.308,.42,.58,zc-.12,zc+.12,M.scr);
    plate(g,.3,.06,labelTex([["DOMINO","#fff",90]],{w:512,h:110,bg:"#b8bcc0"}),[X+.302,.2,zc],Math.PI/2);
    for(const dx of [-.02,.12]) bx(g,X+dx,X+dx+.03,PKZ.y,PKZ.y+.1,z0-.1,z1+.1,M.green);                                      /* 녹색 벨트 2줄 */
    bx(g,X-.05,X+.3,.85,PKZ.y,z0-.1,z1+.1,M.dark);
    for(const dz of [-.3,-.18,.1]){ rod(g,[X+.3,.8,zc+dz],[X+.36,.8,zc+dz],.03,M.orange,14); rod(g,[X+.36,.8,zc+dz],[X+.38,.8,zc+dz],.04,M.dark,14); }
    bx(g,X+.2,X+.55,1.02,1.04,z0+.02,z0+.42,M.ss); bx(g,X+.22,X+.5,1.04,1.06,z0+.05,z0+.38,M.dark);                        /* 키보드 */
    acry(X+.32,X+.6,.2,.95,z0-.05,z0+.3); plate(g,.2,.08,labelTex([["포장실","#111",40],["인쇄 불량","#111",44]],{w:384,h:130,border:"#333"}),[X+.602,.55,z0+.12],Math.PI/2);
    beacon(X-.35,2.05,zc); }
  /* ── X-ray (Ishida IX) ── */
  { const [z0,z1]=P.xr, zc=(z0+z1)/2;
    bx(g,X-.45,X+.4,.75,1.25,z0,z1,M.ssMir); bx(g,X-.4,X+.36,1.25,2.0,z0+.08,z1-.08,M.ssMir);
    bx(g,X+.36,X+.37,1.3,1.95,zc-.33,zc+.33,M.black); bx(g,X+.37,X+.373,1.5,1.88,zc-.22,zc+.22,M.scr);
    plate(g,.14,.045,labelTex([["X-RAY ON","#fff",70]],{w:384,h:110,bg:"#d81b1b"}),[X+.372,1.38,zc+.12],Math.PI/2);
    plate(g,.2,.07,labelTex([["ISHIDA","#fff",80]],{w:384,h:110,bg:"#0c0d0e"}),[X+.372,1.9,zc-.2],Math.PI/2);
    rod(g,[X+.4,1.15,zc-.3],[X+.43,1.15,zc-.3],.022,M.dark,16); rod(g,[X+.4,1.15,zc+.3],[X+.44,1.15,zc+.3],.03,M.red,16); bx(g,X+.4,X+.405,1.08,1.22,zc+.2,zc+.4,M.yellow);
    plate(g,.36,.22,labelTex([["방사선기기 안전관리 수칙","#111",38],["☢","#c00",120]],{w:512,h:320,bg:"#f6d51c"}),[X+.402,.95,zc+.05],Math.PI/2);
    for(const z of [z0-.02,z1+.02]) for(let k=0;k<8;k++) bx(g,X-.12+k*.035,X-.09+k*.035,PKZ.y,PKZ.y+.2,z-.004,z+.004,M.blue);  /* 차폐 커튼 */
    for(const z of [z0+.1,z1-.1]){ const u=new T3.Mesh(new T3.TorusGeometry(.42,.03,10,24,Math.PI),M.ssMir); u.position.set(X,.42,z); add(g,u); for(const dx of [-.42,.42]){ rod(g,[X+dx,.03,z],[X+dx,.42,z],.03,M.ssMir); foot(g,X+dx,z,.03,.02); } }
    beacon(X,2.0,zc); }
  /* ── 중량선별기 (Anritsu SSV) + 배출함 2 ── */
  { const [z0,z1]=P.cw, zc=(z0+z1)/2;
    bx(g,X-.5,X-.2,.75,1.75,zc-.15,zc+.15,M.ss); bx(g,X-.2,X-.19,1.3,1.72,zc-.14,zc+.14,M.dark); bx(g,X-.19,X-.187,1.45,1.68,zc-.11,zc+.11,M.scr);
    for(const [dz,m] of [[-.04,M.dark],[.03,M.red],[.1,M.green]]) rod(g,[X-.2,1.38,zc+dz],[X-.18,1.38,zc+dz],.016,m,14); bx(g,X-.2,X-.18,1.3,1.36,zc+.07,zc+.13,M.yellow);
    bx(g,X-.15,X+.15,PKZ.y-.08,PKZ.y,z0,z1,M.ss); bx(g,X-.13,X+.13,PKZ.y,PKZ.y+.006,z0+.02,z1-.02,M.white); acry(X-.17,X+.17,PKZ.y+.01,PKZ.y+.26,z0+.1,z1); legs(X-.14,X+.14,z0+.1,z1-.1,PKZ.y-.08);
    plate(g,.2,.05,labelTex([["Anritsu  SSV","#fff",60]],{w:512,h:120,bg:"#2a2d30"}),[X-.187,1.25,zc],Math.PI/2);
    for(const s of [-1,1]){ const xb=X+s*.42, z=P.bin; bx(g,xb-.2,xb+.2,.45,.95,z-.2,z+.2,M.ss); bx(g,xb-.2,xb+.2,.95,1.1,z-.2,z+.2,M.ssD); for(let k=0;k<9;k++) bx(g,xb-.16,xb+.16,.955,1.105,z-.17+k*.04,z-.155+k*.04,M.dark);
      rod(g,[xb+s*.2,.7,z-.06],[xb+s*.24,.7,z-.06],.008,M.ssMir); rod(g,[xb+s*.2,.7,z+.06],[xb+s*.24,.7,z+.06],.008,M.ssMir); rod(g,[xb+s*.24,.7,z-.06],[xb+s*.24,.7,z+.06],.008,M.ssMir); bx(g,xb+s*.2-.01,xb+s*.2+.03,.8,.86,z-.02,z+.02,M.alu); legs(xb-.17,xb+.17,z-.17,z+.17,.45);
      plate(g,.2,.07,labelTex([["포장실","#111",40],[s>0?"기준 중량 미달":"X-ray 불량","#111",44]],{w:384,h:130,border:"#333"}),[xb,1.106,z+.14],0).rotation.x=-Math.PI/2; } }
  /* ── 대케이스 잉크젯 프린터 : 검은 벨트 컨베이어(알루미늄 프레임) · 프린터 헤드 · 암 터치화면 · 경광등 ── */
  { const [z0,z1]=P.cp; bx(g,X-.3,X+.3,PKZ.y-.1,PKZ.y,z0,z1,M.ss); bx(g,X-.26,X+.26,PKZ.y,PKZ.y+.005,z0+.03,z1-.03,M.dark);
    for(const x of [X-.28,X+.28]) for(const z of [z0+.08,z1-.08]){ bx(g,x-.02,x+.02,.06,PKZ.y-.1,z-.02,z+.02,M.alu); rod(g,[x,0,z],[x,.06,z],.025,M.dark,12); } for(const z of [z0+.08,z1-.08]) bx(g,X-.28,X+.28,.25,.29,z-.02,z+.02,M.alu);
    for(const z of [z0+.35,z0+.55]){ rod(g,[X-.26,PKZ.y+.08,z],[X+.1,PKZ.y+.08,z],.006,M.ssMir); rod(g,[X+.1,PKZ.y+.08,z],[X+.1,PKZ.y+.14,z],.014,M.orange,10); }
    bx(g,X-.5,X-.3,PKZ.y+.02,PKZ.y+.2,z0+.2,z0+.5,M.ss); bx(g,X-.6,X-.56,.06,1.6,z0+.6,z0+.64,M.alu); bx(g,X-.58,X-.2,1.35,1.6,z0+.5,z0+.53,M.ss); bx(g,X-.56,X-.22,1.37,1.58,z0+.53,z0+.533,M.scr); beacon(X-.58,1.6,z0+.62); }
  /* ── 라인 끝 작업대 (녹색 벨트 내장) ── */
  { const [z0,z1]=P.tb; bx(g,X-.55,X+.55,PKZ.y-.14,PKZ.y-.1,z0,z1,M.ssMir); bx(g,X-.12,X+.12,PKZ.y-.1,PKZ.y-.095,z0+.05,z1,M.green); legs(X-.5,X+.5,z0+.08,z1-.08,PKZ.y-.14); for(const z of [z0+.08,z1-.08]) bx(g,X-.5,X+.5,.25,.29,z-.02,z+.02,M.ss); }
  return g;
}
