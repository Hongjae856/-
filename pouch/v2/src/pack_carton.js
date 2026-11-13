/* ═══ 설명서 공급 구간 · 카토너 HC 100L (Hoonga) — 현장 사진 6장 + 작동 영상 2건 재판독 (11/12, DRAWING.md 10-1)
   카토너 = '벽식' 구조 : 뒤쪽 세로 스테인리스 벽에 기구가 붙고, 아래는 진회색 받침판 위가 비어 있음(가운데 바닥 브래킷).
   위 : 스테인리스 함(규격 카운터 4) 위 경사 매거진 — 접힌 카톤을 세워 비스듬히 적재, 남쪽 끝이 꺾여 내려감 →
        빨간 흡착 컵 회전 암이 한 장씩 끌어내려 카톤 체인 위에 세움(성형 회전부 · 노란 화살표 반원판).
   가운데 : 뒤줄 흰 버킷(6포) · 앞줄 카톤 체인(녹색, 카톤 정면 'H 판콜'이 앞) · 밀대 · 플랩 접기 레일(검은 레버) · 비스듬한 링크 암 2 · 빨간 블록 2.
   앞 : 흰 프로파일 틀 + 아크릴 지붕판 + 힌지식 아크릴 문 3짝(흰 'Hoonga' · 회색 원통 힌지 인터락 · '금지' 표지).
   북쪽 끝 : 곡면 스테인리스 핫멜트 건 하우징(파란 꼬인 호스) · LS 판넬 · 노란 코일 호스 / 뒤 : 파란 핫멜트 유닛 ═══ */
function buildCartoner(g){
  const X=CVX, zs=PK2.lf[0], zn=PKZ.ct[0], zm=(zs+zn)/2, x0=X-.5, x1=X+.5, Hr=1.38, cx=PK2.cx, C=PK2.carton, yC=PK2.yC, zl=l=>PK2.bz0-l,
        wf=new T3.MeshStandardMaterial({color:0xeef0f1,metalness:.35,roughness:.4});
  const ct=tex(cvs(256,128,(c)=>{ c.fillStyle="#f6f4ef"; c.fillRect(0,0,256,128); c.fillStyle="#b3201a"; c.fillRect(0,0,256,128); c.fillStyle="#fff"; c.fillRect(18,30,150,70); c.fillStyle="#d8342c"; c.font="bold 52px sans-serif"; c.fillText("H",28,86); c.font="bold 30px 'Malgun Gothic',sans-serif"; c.fillText("판콜",72,82); c.fillStyle="#f2c400"; c.fillRect(190,20,40,88); }),1,1,true);
  M.carton=new T3.MeshStandardMaterial({map:ct,roughness:.55}); M.cartonFlat=new T3.MeshStandardMaterial({color:0xe8b4b0,roughness:.6}); M.cartonEdge=new T3.MeshStandardMaterial({color:0xf3efe8,roughness:.7});
  /* 받침판 · 발 · 가운데 바닥 브래킷 */
  bx(g,x0-.05,x1+.02,.08,.15,zn,zs,M.steel); for(const z of [zs-.1,zm,zn+.1]) for(const x of [x0+.02,x1-.06]) { rod(g,[x,0,z],[x,.08,z],.04,M.ssD,16); }
  bx(g,X-.04,X+.04,.0,.08,zm-.04,zm+.04,M.ssD); bx(g,X-.04,X+.04,0,.03,zm-.04,zm+.04,M.ssD); bx(g,X+.04,X+.75,0,.025,zm-.035,zm+.035,M.ssD);
  /* 뒤 세로 벽 · 아래 트로프(가운데) · 오른쪽 함(북쪽) */
  bx(g,x0,x0+.03,.15,Hr,zn,zs,M.ss);
  bx(g,x0+.03,X+.3,.5,.52,zm+.1,zs-.55,M.ss); bx(g,X+.28,X+.3,.5,.7,zm+.1,zs-.55,M.ss); for(const z of [zm+.1,zs-.55]) bx(g,x0+.03,X+.3,.5,.7,z-.01,z+.01,M.ss);
  bx(g,x0+.03,X+.33,.42,.86,zn+.42,zm+.05,M.ss); bx(g,X+.33,X+.334,.46,.82,zn+.46,zm,M.ssD); rod(g,[X+.334,.76,zm-.25],[X+.35,.76,zm-.25],.012,M.dark,8);
  bx(g,x0+.03,X-.2,.15,.5,zs-.5,zs-.02,M.ss);                                                                       /* 남쪽 하부 함 */
  /* 카톤 체인 (녹색) · 러그 · 세워진 카톤 */
  bx(g,cx-.08,cx+.08,yC-.055,yC-.015,zl(4.98),zl(2.68),M.ss); bx(g,cx-.07,cx+.07,yC-.015,yC,zl(4.98),zl(2.68),M.green);   /* 카톤 체인 (러그 · 카톤은 pack_anim) */
  /* 밀대 캠 레일(뒤) · 버킷 → 카톤 다리판 · 앞 가이드 */
  bx(g,X-.22,X-.18,.9,.92,zl(4.1),zl(2.9),M.ss); bx(g,PK2.bx1,cx-.064,.94,.95,zl(4.0),zl(2.95),M.ssMir);
  bx(g,cx+.1,cx+.112,yC+.02,yC+.05,zl(3.9),zl(2.7),M.ssMir);
  /* 접기 레일 : 작은 날개 접기(3.95~4.12) · 아래 큰 날개 올림(4.15~4.38) · 위 큰 날개 내림(4.5~4.72) · 압착 레일(4.74~4.98) — 양 끝 */
  for(const s2 of [-1,1]){ const xe=cx+s2*C.L/2, a=C.H*.6;
    tube(g,[[xe+s2*.045,yC+C.H/2,zl(3.9)],[xe+s2*.02,yC+C.H/2,zl(4.02)],[xe+s2*.006,yC+C.H/2,zl(4.14)]],.004,M.ssMir);
    tube(g,[[xe+s2*(a+.004),yC-.006,zl(4.1)],[xe+s2*a*.7,yC+a*.35,zl(4.27)],[xe+s2*.007,yC+a*.85,zl(4.42)]],.004,M.ssMir);
    tube(g,[[xe+s2*(a+.004),yC+C.H+.006,zl(4.46)],[xe+s2*a*.7,yC+C.H-a*.35,zl(4.62)],[xe+s2*.008,yC+C.H-a*.85,zl(4.76)]],.004,M.ssMir);
    for(const y of [yC+.015,yC+C.H-.015]) bx(g,xe+s2*.004-.003,xe+s2*.004+.003,y-.006,y+.006,zl(4.98),zl(4.74),M.ssMir);
    /* 핫멜트 노즐 (아래 큰 날개에 접착제) */
    cone(g,[xe+s2*.03,yC+.014,zl(4.43)],[xe+s2*.008,yC+.014,zl(4.43)],.012,.003,M.brass,12); bx(g,xe+s2*.03-.012,xe+s2*.03+.012,yC+.0,yC+.03,zl(4.43)-.02,zl(4.43)+.02,M.dark); }
  { const lv=bx(g,cx+.11,cx+.14,1.02,1.05,zm-.1,zm+.06,M.black); lv.rotation.x=.4; }
  for(const [z,a] of [[zs-.95,.7],[zm-.15,-.7]]){ const A=new T3.Group(); A.position.set(x0+.06,1.18,z); A.rotation.x=a; g.add(A); bx(A,0,.05,-.22,.22,-.035,.035,M.alu); rod(A,[.05,-.22,0],[.09,-.22,0],.03,M.ssMir,16); rod(A,[.05,.22,0],[.09,.22,0],.03,M.ssMir,16); bx(A,.09,.11,-.24,-.12,-.02,.02,M.alu); }
  for(const dz of [-.12,.12]){ bx(g,x0+.03,x0+.12,1.22,1.3,zm+.3+dz-.05,zm+.3+dz+.05,M.red); } rod(g,[x0+.12,1.26,zm+.3],[x0+.14,1.26,zm+.3],.02,M.ssMir,14);
  for(const z of [zs-1.3,zm+.6,zn+.6]){ bx(g,x0+.03,x0+.14,1.24,1.29,z-.1,z+.1,M.alu); rod(g,[x0+.08,1.265,z+.1],[x0+.08,1.265,z+.16],.01,M.ssMir,8); }
  tube(g,[[x0+.03,1.32,zn+.3],[x0+.12,1.25,zn+.6],[x0+.1,1.15,zn+.9],[x0+.03,1.1,zm]],.012,M.hoseB);
  /* 성형 회전부 : 노란 화살표 반원판 (남쪽 아래 앞) */
  { const sh=new T3.Shape(); sh.absarc(0,0,.17,-Math.PI/2,Math.PI/2,false); sh.lineTo(0,-.17); const d=new T3.Mesh(new T3.ShapeGeometry(sh),M.ssMir); d.rotation.y=Math.PI/2; d.position.set(cx+.14,.8,zl(2.86)); g.add(d);
    plate(g,.06,.06,labelTex([["↷","#111",110]],{w:128,h:128,bg:"#f5d400"}),[cx+.142,.82,zl(2.88)],Math.PI/2); bx(g,cx+.12,cx+.14,.6,.8,zl(2.92),zl(2.82),M.white); }
  /* 카톤 흡착 회전 암 (빨간 석션 컵) — 매거진 출구 ↔ 카톤 체인 (동작은 anim) */
  { const P0=new T3.Group(); P0.position.set(cx-.085,1.19,zl(2.8)); g.add(P0); PK2.pick=P0; rod(g,[x0+.03,1.19,zl(2.8)],[cx-.085,1.19,zl(2.8)],.022,M.ssMir,16);
    const A=new T3.Group(); P0.add(A); bx(A,-.015,.015,0,.15,-.015,.015,M.alu); bx(A,-.015,.06,.15,.165,-.015,.015,M.alu); for(const dz of [-.025,.025]){ rod(A,[.05,.165,dz],[.05,.18,dz],.007,M.ssMir,8); cone(A,[.05,.18,dz],[.05,.198,dz],.007,.016,M.red,14); } A.rotation.x=.9; PK2.pickArm=A; }
  /* 위 : 스테인리스 함 · 규격 카운터 4 · 경사 매거진(남쪽 끝 꺾여 내려감) · 흰 U 손잡이 · 아크릴 덮개 */
  const my=1.62; bx(g,X-.32,X+.42,Hr+.02,my,zn+.1,zs-.15,M.ss);
  for(let k=0;k<4;k++){ const z=zs-.7-k*.5; bx(g,X+.42,X+.44,my-.14,my-.04,z-.04,z+.04,M.white); plate(g,.06,.018,labelTex([["1145","#111",80]],{w:200,h:60,bg:"#e8eaec"}),[X+.441,my-.07,z],Math.PI/2); rod(g,[X+.42,my-.17,z],[X+.45,my-.17,z],.018,M.ssMir,14); rod(g,[X+.45,my-.17,z],[X+.455,my-.17,z],.022,M.dark,14); }
  for(const x of [cx-.075,cx+.075]) bx(g,x-.005,x+.005,my,my+.17,zn+.15,zs-.6,M.ss); bx(g,cx-.07,cx+.07,my,my+.008,zn+.15,zs-.6,M.ssD);
  for(let z=zn+.2;z<zs-.6;z+=.04) bx(g,cx-.068,cx-.06,my+.008,my+.02,z-.006,z+.006,M.dark);
  { const n=Math.floor((zs-.62-(zn+.2))/.009), im=new T3.InstancedMesh(new T3.BoxGeometry(C.L,C.W+C.H,.0035),M.cartonFlat,n+40), o=new T3.Object3D();
    for(let k=0;k<n;k++){ o.position.set(cx,my+.09,zs-.62-k*.009); o.rotation.set(.55,0,0); o.updateMatrix(); im.setMatrixAt(k,o.matrix); }
    for(let k=0;k<40;k++){ const t=k/40, z=zs-.6+t*.32, y=my+.05-t*.26; o.position.set(cx,y,z); o.rotation.set(.55+t*.35,0,0); o.updateMatrix(); im.setMatrixAt(n+k,o.matrix); } im.castShadow=true; g.add(im); }
  for(const x of [cx-.082,cx+.082]){ const sh=new T3.Shape(); [[0,0],[.34,-.28],[.42,-.28],[.42,-.18],[.34,-.18],[0,.12]].forEach(([a,b],i)=>i?sh.lineTo(a,b):sh.moveTo(a,b)); const m=new T3.Mesh(new T3.ShapeGeometry(sh),M.ss); m.material=M.ss.clone(); m.material.side=T3.DoubleSide; m.rotation.y=-Math.PI/2; m.position.set(x,my+.1,zs-.62); g.add(m); }
  rod(g,[cx+.12,my+.02,zs-.45],[cx+.12,my-.22,zs-.45],.016,M.white,12); for(const y of [my+.02,my-.22]) rod(g,[cx+.09,y,zs-.45],[cx+.12,y,zs-.45],.014,M.white,10);
  bx(g,cx-.1,cx+.13,my+.19,my+.196,zs-.75,zs-.15,M.acryl); bx(g,cx+.13,cx+.136,Hr,my+.19,zs-.75,zs-.15,M.acryl);
  PB.sign(g,.14,.07,[["금 지","#fff",50],["장비 운전중에는 문을 열지 마시오.","#111",22]],{w:384,h:190,border:"#c00",bg:"#fff"},[cx+.137,my+.05,zs-.3],Math.PI/2);
  /* 아크릴 지붕판 · 흰 프로파일 틀 · 아크릴 문 3짝 · 'Hoonga' · 회색 원통 힌지 인터락 · 표지 */
  bx(g,x0+.03,x1,Hr,Hr+.012,zn,zs,M.acryl); PB.frame(g,x1-.02,x1+.02,.15,Hr,zn,zs,wf);
  const dz=[zs,zs-(zs-zn)/3,zn+(zs-zn)/3,zn];
  for(let k=0;k<3;k++){ const a=dz[k+1]+.02, b=dz[k]-.02; bx(g,x1+.02,x1+.028,.16,Hr-.02,a,b,M.acryl); if(k) bx(g,x1-.02,x1+.02,.15,Hr,dz[k]-.02,dz[k]+.02,wf);
    for(const y of [.4,1.2]){ rod(g,[x1+.06,y-.07,b-.01],[x1+.06,y+.07,b-.01],.022,M.alu,18); bx(g,x1+.028,x1+.06,y-.06,y+.06,b-.06,b-.01,M.alu); bx(g,x1+.028,x1+.06,y-.06,y+.06,b-.01,b+.04,M.alu); }
    PB.sign(g,.12,.06,[["금 지","#fff",50],["장비 운전중에는 문을 열지 마시오.","#111",22]],{w:384,h:190,border:"#c00",bg:"#fff"},[x1+.03,Hr-.12,a+.25],Math.PI/2); }
  decal(g,.58,.12,textTex("Hoonga","#ffffff",512,100,84),[x1+.03,1.08,(dz[1]+dz[2])/2+.15],Math.PI/2);
  for(const z of [zs,zn]) bx(g,x0+.03,x1,.16,Hr,z-.003,z+.003,M.acryl);
  /* 하부 투명 배출함 2 · 핀셋 표지 */
  for(const [z,t] of [[zs-.75,"설명서 삽입 불량"],[zm+.25,"케이스 성형 불량"]]){ bx(g,X-.05,X+.25,.17,.45,z-.14,z+.14,M.acryl); bx(g,X-.05,X+.25,.16,.17,z-.14,z+.14,M.ss); PB.sign(g,.18,.06,[["포장실","#111",40],[t,"#111",40]],{w:384,h:130,border:"#333"},[X+.252,.36,z],Math.PI/2); }
  PB.sign(g,.17,.07,[["불량 조치 시","#c00",50],["핀셋 사용","#c00",50]],{w:384,h:150,border:"#c00"},[X+.302,.6,zs-.95],Math.PI/2);
  PB.beacon(g,x0+.1,my,zs-.25);
  /* 북쪽 끝 : 곡면 핫멜트 건 하우징 · 파란 꼬인 호스 · LS 판넬 · 파란 핫멜트 유닛(뒤) · 노란 코일 에어호스 · 출구 슈트 */
  { const hz=zl(4.43); bx(g,cx+.1,cx+.36,.55,.86,hz-.16,hz+.16,M.ssMir); const c=new T3.Mesh(new T3.CylinderGeometry(.13,.13,.32,32,1,false,0,Math.PI),M.ssMir); c.rotation.set(Math.PI/2,0,Math.PI/2); c.position.set(cx+.23,.86,hz); c.rotation.set(0,0,0); c.rotation.x=Math.PI/2; c.rotation.z=Math.PI/2; add(g,c);
    bx(g,cx+.36,cx+.362,.6,.82,hz-.12,hz+.06,M.ss); bx(g,cx+.362,cx+.364,.64,.7,hz+.02,hz+.05,M.dark); PB.warn(g,cx+.364,.78,hz-.06,Math.PI/2);
    for(const k of [0,1]) tube(g,[[cx+.15,.99,hz-.08+k*.06],[cx+.05,1.25,hz-.1+k*.06],[x0+.1,1.33,hz+.1],[x0+.03,1.3,hz+.4]],.016,M.hoseB);
    bx(g,x0-.48,x0-.06,.05,.95,zn+.05,zn+.55,M.blue); bx(g,x0-.48,x0-.06,.95,1.0,zn+.05,zn+.55,M.dark); for(const dz2 of [.15,.35]) rod(g,[x0-.05,.78,zn+dz2],[x0-.02,.78,zn+dz2],.035,M.white,18);
    tube(g,[[x0-.27,1.0,zn+.3],[x0-.2,1.25,zn+.25],[x0+.01,1.3,zn+.3]],.018,M.hoseB);
    bx(g,x1+.08,x1+.46,.05,1.1,zn-.05,zn+.35,M.ss); rod(g,[x1+.27,1.1,zn+.15],[x1+.27,1.22,zn+.15],.03,M.ssMir,14); PB.panel(g,x1+.3,1.45,zn+.15,0,"Hoonga");
    { const pts=[], hx=x1+.52, hz2=zn+.45; for(let i=0;i<=120;i++){ const t=i/120, a=t*Math.PI*2*14; pts.push([hx+Math.cos(a)*.03,1.1-t*.6,hz2+Math.sin(a)*.03]); } tube(g,pts,.005,M.yellow); }
    { const r=new T3.Mesh(new T3.BoxGeometry(.42,.006,.28),M.ssMir); r.position.set((cx+X)/2,PKZ.y-.004,zl(4.98)-.14); r.rotation.y=.55; add(g,r); } }   /* 체인 끝 → 프린터 벨트 이송판 */
  /* ── 설명서 공급 구간 (스틱공급장치 ↔ 카토너, 흰 버킷 위) ── */
  { const [la,lb]=PK2.lf, lz=(la+lb)/2, lx=X+.04;
    bx(g,lx-.28,lx+.3,1.12,1.42,lz-.3,lz+.2,M.ss); bx(g,lx-.28,lx+.3,1.1,1.12,lz-.3,lz+.2,M.ssD);
    rod(g,[lx+.3,1.26,lz-.05],[lx+.33,1.26,lz-.05],.02,M.dark,14); rod(g,[lx+.33,1.26,lz-.05],[lx+.34,1.26,lz-.05],.026,M.ssMir,14);
    PB.sign(g,.09,.025,[["정지스위치","#111",56]],{w:320,h:90,border:"#111"},[lx+.302,1.33,lz-.05],Math.PI/2);
    bx(g,lx-.2,lx+.26,1.42,1.84,lz-.26,lz+.14,M.acryl); bx(g,lx-.2,lx+.26,1.84,1.85,lz-.26,lz+.14,M.acryl);
    { const w=new T3.Mesh(new T3.CylinderGeometry(.13,.13,.04,40),M.black); w.rotation.z=Math.PI/2; w.position.set(lx+.2,1.63,lz-.06); add(g,w); rod(g,[lx+.22,1.63,lz-.06],[lx+.235,1.63,lz-.06],.025,M.ssMir,16); }
    bx(g,lx-.12,lx+.12,1.42,1.56,lz-.24,lz-.16,M.dark); PB.warn(g,lx+.262,1.79,lz+.05,Math.PI/2);
    PB.sign(g,.11,.03,[["안전커버 임의 Open 금지!","#c00",40]],{w:512,h:120,border:"#c00"},[lx+.262,1.79,lz-.15],Math.PI/2);
    const rk=new T3.Group(); rk.position.set(lx-.05,1.5,lz+.16); rk.rotation.x=-.55; g.add(rk); bx(rk,-.13,.13,0,.01,0,.38,M.ss); for(const dx of [-.11,-.04,.04,.11]) rod(rk,[dx,.01,.34],[dx,.16,.38],.006,M.ssMir,8); bx(rk,-.1,.1,.01,.06,.04,.3,M.white);
    for(const dx of [-.13,.13]) bx(rk,dx-.004,dx+.004,0,.08,0,.38,M.ss);
    bx(g,lx+.3,lx+.38,1.14,1.26,lb-.12,lb-.02,M.yellow); rod(g,[lx+.38,1.2,lb-.07],[lx+.4,1.2,lb-.07],.026,M.red,16);
    const hd=new T3.Mesh(new T3.BoxGeometry(.006,.42,.5),M.acryl); hd.position.set(lx+.34,1.55,la+.05); hd.rotation.x=.5; g.add(hd);
    PB.sign(g,.14,.06,[["금 지","#fff",50],["장비 운전중에는 손을 넣지 마시오","#111",22]],{w:384,h:170,border:"#c00",bg:"#fff"},[lx+.302,1.15,lz+.12],Math.PI/2);
    bx(g,lx+.0,lx+.3,.08,.42,lz-.15,lz+.15,M.acryl); bx(g,lx+.0,lx+.3,.42,.44,lz-.15,lz+.15,M.ss); PB.sign(g,.18,.06,[["포장실","#111",40],["설명서 불량","#111",44]],{w:384,h:130,border:"#333"},[lx+.302,.3,lz],Math.PI/2);
    PK2.leaflet=[lx,lz]; }
}
