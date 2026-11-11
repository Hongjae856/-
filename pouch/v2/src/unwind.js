/* ═══ 충전기 동쪽 : 은박 롤 언와인더 (회색 측판 · 롤 · 가이드 롤러 · 사다리꼴 아크릴 커버 · 접합대) ·
       인쇄 유닛 (아크릴 함 · 열전사 헤드) · 소형 제어 박스 · 공압 레귤레이터 · 통풍 루버 · 명판 — 현장 사진 기준 ═══ */
function buildUnwinder(g,cz0,cz1){
  const F=FL, zc=F.zc, ex=F.bx1+.02, hw=.47, rw=.425, Y=F.deckY;
  /* 회색 측판 2 : 세로 판 + 아래로 뻗은 롤 지지 암 */
  const sh=new T3.Shape(); for(const [i,[x,y]] of [[.0,.42],[.34,.42],[.7,.56],[.7,.82],[.36,.9],[.3,1.52],[.0,1.52]].entries()) i?sh.lineTo(x,y):sh.moveTo(x,y);
  for(const s of [-1,1]){ const m=new T3.Mesh(new T3.ExtrudeGeometry(sh,{depth:.016,bevelEnabled:false}),M.grey); m.position.set(ex,0,zc+s*hw-.008); add(g,m);
    for(const [x,y] of [[.06,.5],[.06,1.44],[.26,1.44],[.26,.5],[.6,.62],[.6,.78]]) rod(g,[ex+x,y,zc+s*hw-.01],[ex+x,y,zc+s*hw+.01],.009,M.ssD,8);
    rod(g,[ex+.54,.7,zc+s*hw-.03],[ex+.54,.7,zc+s*hw+.03],.05,M.ssMir,24); rod(g,[ex+.54,.7,zc+s*(hw+.03)],[ex+.54,.7,zc+s*(hw+.09)],.032,M.ssMir,20); }
  bx(g,ex+.44,ex+.62,.56,.84,zc-hw-.14,zc-hw-.03,M.white);                                   /* 롤 축 구동 박스 (북쪽) */
  /* 은박 롤 · 지관 · 축 */
  const roll=new T3.Mesh(new T3.CylinderGeometry(.165,.165,rw*2,56),M.foilP); roll.rotation.x=Math.PI/2; roll.position.set(ex+.54,.7,zc); add(g,roll);
  rod(g,[ex+.54,.7,zc-rw-.004],[ex+.54,.7,zc+rw+.004],.048,M.black,28); rod(g,[ex+.54,.7,zc-hw],[ex+.54,.7,zc+hw],.02,M.ssMir,16);
  { const a=new T3.Mesh(new T3.TorusGeometry(.2,.007,8,28,Math.PI*.62),M.ss); a.scale.z=4; a.position.set(ex+.54,.7,zc+rw-.03); a.rotation.z=Math.PI*.12; add(g,a); rod(g,[ex+.74,.74,zc+rw-.03],[ex+.78,.74,zc+rw-.03],.014,M.dark,10); }
  /* 가이드 롤러 · 은박 경로 (롤 → 롤러 → 인쇄 유닛) */
  const R=[[.16,1.0],[.4,1.1],[.2,1.24],[.46,1.36],[.14,1.46]]; for(const [x,y] of R){ rod(g,[ex+x,y,zc-hw],[ex+x,y,zc+hw],.024,M.ssMir,18); }
  ribbon(g,[[ex+.44,.83],[ex+.16,.976],[ex+.136,1.0],[ex+.4,1.124],[ex+.424,1.1],[ex+.2,1.216],[ex+.176,1.24],[ex+.46,1.384],[ex+.484,1.36],[ex+.14,1.484],[ex+.116,1.46],[ex+.1,1.9]],zc-rw,zc+rw,M.sheet);
  /* 접합대 : 낮게 뻗은 판 · 누름 봉 · 테이프 */
  bx(g,ex+.36,ex+1.0,.33,.35,zc-.44,zc+.44,M.ss); ribbon(g,[[ex+.5,.54],[ex+.62,.356],[ex+.97,.356]],zc-rw,zc+rw,M.sheet);
  for(const x of [.7,.92]){ rod(g,[ex+x,.375,zc-.46],[ex+x,.375,zc+.46],.01,M.ssMir,10); for(const s of [-1,1]) bx(g,ex+x-.03,ex+x+.03,.35,.39,zc+s*.46-.012,zc+s*.46+.012,M.ssD); }
  { const t=new T3.Mesh(new T3.CylinderGeometry(.035,.035,.024,20),new T3.MeshStandardMaterial({color:0xb99a3a,roughness:.5})); t.position.set(ex+.84,.4,zc+.3); add(g,t); }
  for(const s of [-1,1]) bx(g,ex+.36,ex+1.0,.3,.36,zc+s*.44-.012,zc+s*.44+.012,M.ssD);
  /* 사다리꼴 아크릴 커버 (롤러 구간) · 손잡이 */
  ribbon(g,[[ex+.02,1.53],[ex+.5,1.53],[ex+.66,1.3],[ex+.66,1.0]],zc-hw+.01,zc+hw-.01,M.acryl);
  rod(g,[ex+.61,1.44,zc-.07],[ex+.61,1.44,zc+.07],.006,M.ssMir,8); for(const d of [-.07,.07]) rod(g,[ex+.585,1.41,zc+d],[ex+.61,1.44,zc+d],.005,M.ssMir,6);
  /* 인쇄 유닛 : 알루미늄 틀 · 아크릴 함 · 열전사 헤드(흰 상자 · 파란 원) · 리본 카세트 */
  const py0=1.56, py1=Y-.1;
  for(const z of [zc-hw,zc+hw]){ bx(g,ex+.62,ex+.66,py0,py1,z-.02,z+.02,M.alu); } bx(g,ex,ex+.66,py0-.03,py0,zc-hw-.02,zc+hw+.02,M.alu);
  bx(g,ex+.655,ex+.66,py0,py1,zc-hw+.02,zc+hw-.02,M.acryl); for(const s of [-1,1]) bx(g,ex,ex+.62,py0,py1,zc+s*hw-.003,zc+s*hw+.003,M.acryl);
  bx(g,ex+.2,ex+.5,py0+.06,py0+.1,zc-hw+.03,zc+hw-.03,M.alu); bx(g,ex+.24,ex+.44,py0+.1,py0+.26,zc-.36,zc-.1,M.dark);
  bx(g,ex+.3,ex+.42,py0+.1,py0+.21,zc-.09,zc+.05,M.white); rod(g,[ex+.42,py0+.155,zc-.02],[ex+.424,py0+.155,zc-.02],.035,M.blue,24);
  rod(g,[ex+.1,py0+.05,zc-hw+.03],[ex+.1,py0+.05,zc+hw-.03],.02,M.ssMir,14);
  for(const s of [-1,1]) rod(g,[ex+.66,py0+.05,zc+s*(hw-.06)],[ex+.69,py0+.05,zc+s*(hw-.06)],.014,M.orange,12);
  tube(g,[[ex+.36,py0+.2,zc+.06],[ex+.5,py0+.1,zc+.3],[ex+.4,py0-.1,zc+hw+.06],[ex+.1,py0-.3,zc+hw+.1]],.012,M.dark);
  /* 소형 제어 박스 (북쪽 · 흰 함체 · 화면 · 적색 버튼) · 공압 레귤레이터 · 전선관 */
  { const z0=cz0+.04, z1=zc-hw-.05; bx(g,ex-.02,ex+.14,1.12,1.5,z0,z1,M.white); bx(g,ex+.14,ex+.146,1.33,1.45,z0+.04,z1-.04,M.scr); rod(g,[ex+.14,1.24,z0+.06],[ex+.155,1.24,z0+.06],.012,M.red,12); rod(g,[ex+.14,1.24,z1-.06],[ex+.155,1.24,z1-.06],.012,M.dark,12);
    for(const dz of [.05,.13]){ rod(g,[ex+.06,.52,z0+dz],[ex+.06,.72,z0+dz],.026,M.white,14); rod(g,[ex+.06,.72,z0+dz],[ex+.06,.8,z0+dz],.02,M.blue,12); rod(g,[ex+.06,.44,z0+dz],[ex+.06,.52,z0+dz],.02,M.dark,12); }
    tube(g,[[ex+.07,1.12,z0+.1],[ex+.12,.95,z0+.12],[ex+.1,.85,z0+.1],[ex+.06,.8,z0+.09]],.012,M.dark);
    tube(g,[[ex+.05,.44,z0+.09],[ex+.2,.2,z0+.2],[ex+.3,.1,zc-.2],[ex+.1,.06,zc+.3]],.016,M.dark); }
  /* 통풍 루버 · 명판 (북쪽 위) */
  { const G=new T3.Group(); for(let i=0;i<8;i++) bx(G,0,.012,i*.028,i*.028+.012,-.1,.1,M.ssD); G.position.set(ex-.02,1.56,cz0+.14); g.add(G); }
  plate(g,.2,.1,labelTex([["SOLPAC","#fff",80],["MODEL  SP303-10P","#fff",34]],{w:512,h:256,bg:"#2d55a8"}),[ex-.014,1.84,cz0+.14],Math.PI/2);
}
/* ═══ 계단 : 1,586 × 630 · 11단 · 50° — 타공 미끄럼 방지 디딤판 · 평철 옆판 · 난간 2단 · 수평 조절 발 ═══ */
function buildStairs(g){
  const F=FL, Y=F.deckY, n=STR.n, run=(STR.x1-STR.x0)/n, rise=Y/n, z0=STR.z0, z1=STR.z1, sl=Math.atan2(Y,STR.x1-STR.x0), Ls=Math.hypot(STR.x1-STR.x0,Y);
  const tm=M.deck.clone(); tm.bumpMap=TX.perf; tm.roughnessMap=TX.perf; tm.bumpScale=.003;
  for(let i=0;i<n-1;i++){ const x=STR.x0+(i+.5)*run, y=Y-(i+1)*rise; bx(g,x-run*.5-.02,x+run*.5+.05,y-.004,y,z0+.03,z1-.03,tm); bx(g,x+run*.5+.045,x+run*.5+.05,y-.035,y,z0+.03,z1-.03,M.ss); bx(g,x-run*.5-.02,x-run*.5-.015,y-.03,y,z0+.03,z1-.03,M.ss); }
  for(const z of [z0+.022,z1-.022]){ const s=new T3.Mesh(new T3.BoxGeometry(Ls+.12,.13,.008),M.ss); s.position.set((STR.x0+STR.x1)/2+.04,Y/2-.07,z); s.rotation.z=-sl; add(g,s);
    const zo=z<(z0+z1)/2?z-.03:z+.03, px=[0,.34,.67,1].map(t=>STR.x0+.04+(STR.x1-STR.x0)*t);
    for(const x of px){ const y=Y-(x-STR.x0)*Math.tan(sl); rod(g,[x,Math.max(0,y-.1),zo],[x,y+.92,zo],.019,M.ssMir,14); }
    for(const h of [.92,.5]) rod(g,[px[0],Y+h,zo],[px[3],Y-(px[3]-STR.x0)*Math.tan(sl)+h,zo],h>.6?.019:.014,M.ssMir,14);
    rod(g,[STR.x1+.04,0,z],[STR.x1+.04,.05,z],.02,M.ssD,12); rod(g,[STR.x1+.04,0,z],[STR.x1+.04,.01,z],.04,M.ss,18); }
  rod(g,[STR.x1+.02,.05,z0+.02],[STR.x1+.02,.05,z1-.02],.014,M.ss,10);
  plate(g,.5,.16,labelTex([["계단 이용 시 난간을 잡으세요","#111",38]],{w:640,h:200,bar:"#c2185b"}),[F.x1+.008,Y-.09,z0-.6],Math.PI/2);
  /* 계단 앞 스테인리스 발판 (기둥 동쪽) */
  { const x0=COL.x1+.08, zz=z0-.5; bx(g,x0,x0+.42,.3,.315,zz,zz+.4,M.ss); for(const dx of [.02,.4]) for(const dz of [.02,.38]){ bx(g,x0+dx-.012,x0+dx+.012,.02,.3,zz+dz-.012,zz+dz+.012,M.ss); rod(g,[x0+dx,0,zz+dz],[x0+dx,.02,zz+dz],.022,M.ss,14); }
    for(const dz of [.02,.38]) bx(g,x0+.02,x0+.4,.1,.12,zz+dz-.01,zz+dz+.01,M.ss); }
}
