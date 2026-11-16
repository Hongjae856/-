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
  const wm=M.web.clone(); wm.map=TX.web.clone(); wm.map.repeat.set(2*Math.PI*.165/.11,rw*2/.08); wm.map.needsUpdate=true; const roll=new T3.Mesh(new T3.CylinderGeometry(.165,.165,rw*2,56,1,true),wm); bx(g,ex+.54-.001,ex+.54+.001,.7-.001,.7+.001,zc-rw,zc+rw,M.white); const ends=[]; for(const s of [-1,1]){ const c=new T3.Mesh(new T3.RingGeometry(.048,.165,48),M.white); c.position.set(ex+.54,.7,zc+s*rw); if(s<0) c.rotation.y=Math.PI; g.add(c); ends.push(c); } roll.rotation.x=Math.PI/2; roll.position.set(ex+.54,.7,zc); add(g,roll); FM.roll=[roll,...ends];   /* 은박 롤 (필름 단절 · 교체 시 숨김) */
  rod(g,[ex+.54,.7,zc-rw-.004],[ex+.54,.7,zc+rw+.004],.048,M.black,28); rod(g,[ex+.54,.7,zc-hw],[ex+.54,.7,zc+hw],.02,M.ssMir,16);
  { const a=new T3.Mesh(new T3.TorusGeometry(.2,.007,8,28,Math.PI*.62),M.ss); a.scale.z=4; a.position.set(ex+.54,.7,zc+rw-.03); a.rotation.z=Math.PI*.12; add(g,a); rod(g,[ex+.74,.74,zc+rw-.03],[ex+.78,.74,zc+rw-.03],.014,M.dark,10); }
  /* 가이드 롤러 · 은박 경로 (롤 → 롤러 → 인쇄 유닛) */
  const R=[[.16,1.0],[.4,1.1],[.2,1.24],[.46,1.36],[.14,1.46]]; for(const [x,y] of R){ rod(g,[ex+x,y,zc-hw],[ex+x,y,zc+hw],.024,M.ssMir,18); }
  ribbon(g,[[ex+.44,.83],[ex+.16,.976],[ex+.136,1.0],[ex+.4,1.124],[ex+.424,1.1],[ex+.2,1.216],[ex+.176,1.24],[ex+.46,1.384],[ex+.484,1.36],[ex+.14,1.484],[ex+.116,1.46],[ex+.1,1.6],[ex+.12,1.626],[ex+.58,1.626],[ex+.6,1.65],[ex+.6,1.92]],zc-rw,zc+rw,M.web);   /* 롤러 → 인쇄부(수평 · 헤드 아래) → 비전부(수직 · 카메라 앞) → 천장 틈으로 본체 (경로는 사진 기준 추정 · 확인 필요) */
  /* 접합대 : 낮게 뻗은 판 · 누름 봉 · 테이프 */
  bx(g,ex+.36,ex+1.0,.33,.35,zc-.44,zc+.44,M.ss); ribbon(g,[[ex+.5,.54],[ex+.62,.356],[ex+.97,.356]],zc-rw,zc+rw,M.web);
  for(const x of [.7,.92]){ rod(g,[ex+x,.375,zc-.46],[ex+x,.375,zc+.46],.01,M.ssMir,10); for(const s of [-1,1]) bx(g,ex+x-.03,ex+x+.03,.35,.39,zc+s*.46-.012,zc+s*.46+.012,M.ssD); }
  { const t=new T3.Mesh(new T3.CylinderGeometry(.035,.035,.024,20),new T3.MeshStandardMaterial({color:0xb99a3a,roughness:.5})); t.position.set(ex+.84,.4,zc+.3); add(g,t); }
  for(const s of [-1,1]) bx(g,ex+.36,ex+1.0,.3,.36,zc+s*.44-.012,zc+s*.44+.012,M.ssD);
  /* 사다리꼴 아크릴 커버 (롤러 구간) · 손잡이 */
  ribbon(g,[[ex+.16,1.53],[ex+.5,1.53],[ex+.66,1.3],[ex+.66,1.0]],zc-hw+.01,zc+hw-.01,M.acryl);
  rod(g,[ex+.61,1.44,zc-.07],[ex+.61,1.44,zc+.07],.006,M.ssMir,8); for(const d of [-.07,.07]) rod(g,[ex+.585,1.41,zc+d],[ex+.61,1.44,zc+d],.005,M.ssMir,6);
  /* ── 인쇄 · 비전 유닛 (데크 아래 · 북쪽에서 보면 오른쪽(서) = 인쇄부, 왼쪽(동) = 비전부 — 현장 사진 · 영상 11/16) ──
     회색 틀(북 · 남 면 2칸 개구 · 가운데 칸막이 + 볼트 클램프판) · 위 폭 조절 나사봉 · 동쪽 아크릴 문(손잡이)
     인쇄부 : 알루미늄 받침(플래튼) 위 수평 은박 · 열전사 헤드(검정) + 리본 카세트(투명) · 매달림 브래킷 · 리니어 모듈(남북 · 위) · 서보(북쪽 끝)
     비전부 : 수직 은박 · 카메라(검정 · 적색 LED) · 매달림 브래킷 · 케이블 체인 · 리니어 모듈(위) · 서보 · 적색 조명
     리니어 모듈은 은박 경로와 겹치지 않도록 틀 위쪽에 둠 (사진상 서보는 아래쪽으로 보임 — 확인 필요) */
  const py0=1.58, py1=Y-.1, zN=zc-hw, zS=zc+hw, PU=FM.pu={};
  for(const z of [zN,zS]){ const t=z<zc?-1:1, f=(x0,x1,y0,y1)=>bx(g,ex+x0,ex+x1,y0,y1,z-.006,z+.006,M.grey);
    f(.02,.64,py1-.05,py1); f(.02,.64,py0,py0+.045); f(.02,.06,py0,py1); f(.6,.64,py0,py1); f(.29,.36,py0,py1);
    bx(g,ex+.3,ex+.35,py0+.07,py1-.07,z+t*.006,z+t*.012,M.alu); for(const y of [py0+.1,py0+.14,py1-.11,py1-.15]) for(const x of [.31,.34]) rod(g,[ex+x,y,z+t*.012],[ex+x,y,z+t*.02],.007,M.ssMir,10); }
  bx(g,ex+.3,ex+.35,py0+.08,py1-.04,zN+.006,zS-.006,M.grey);                                   /* 칸막이 (은박이 아래 · 위로 지나감) */
  bx(g,ex+.02,ex+.56,py1-.012,py1,zN,zS,M.grey); bx(g,ex+.625,ex+.64,py1-.012,py1,zN,zS,M.grey);   /* 천장판 (은박이 나가는 틈) */
  rod(g,[ex+.05,py1-.03,zN-.035],[ex+.59,py1-.03,zN-.035],.009,M.ssD,10); for(const x of [.05,.27,.38,.59]) bx(g,ex+x-.02,ex+x+.02,py1-.05,py1-.01,zN-.05,zN-.02,M.alu); for(const x of [.03,.61]) rod(g,[ex+x-.02,py1-.03,zN-.035],[ex+x+.02,py1-.03,zN-.035],.022,M.ssMir,18);
  bx(g,ex+.655,ex+.66,py0,py1,zN+.01,zS-.01,M.acryl);                                         /* 동쪽 아크릴 문 */
  for(const zz of [zc-.31,zc-.23]){ rod(g,[ex+.66,py0+.1,zz],[ex+.69,py0+.1,zz],.007,M.ssMir,8); rod(g,[ex+.66,py0+.24,zz],[ex+.69,py0+.24,zz],.007,M.ssMir,8); rod(g,[ex+.69,py0+.1,zz],[ex+.69,py0+.24,zz],.007,M.ssMir,8); }
  for(const s of [-1,1]) rod(g,[ex+.66,py0+.03,zc+s*(hw-.06)],[ex+.69,py0+.03,zc+s*(hw-.06)],.014,M.black,12);
  /* 서보 (쿨머슬형 : 알루미늄 몸체 · 방열핀 · 파란 덮개) · 리니어 모듈 */
  const sy=py1-.17, servo=(x0,x1)=>{ bx(g,ex+x0,ex+x1,sy,sy+.1,zN-.2,zN-.04,M.alu); for(let k=0;k<5;k++) bx(g,ex+x0+.01+k*(x1-x0-.02)/4-.003,ex+x0+.01+k*(x1-x0-.02)/4+.003,sy+.01,sy+.095,zN-.2,zN-.04,M.alu);
    bx(g,ex+x0,ex+x1,sy+.1,sy+.112,zN-.2,zN-.12,M.blue); bx(g,ex+x0+.02,ex+x1-.02,sy+.06,sy+.1,zN-.04,zN,M.black); };
  const lin=(x0,x1)=>{ bx(g,ex+x0,ex+x1,py1-.06,py1-.012,zN,zS-.02,M.alu); bx(g,ex+x0+.01,ex+x1-.01,py1-.064,py1-.06,zN+.02,zS-.04,M.ssD); };
  /* 인쇄부 (서쪽 칸) */
  bx(g,ex+.13,ex+.28,py0+.03,py0+.042,zN+.02,zS-.02,M.alu);                                     /* 플래튼 (은박 받침) */
  lin(.12,.24); servo(.12,.24);
  { const G=new T3.Group(); g.add(G); PU.prn=G;                                                /* 헤드 · 카세트 (남북 이동) */
    bx(G,ex+.13,ex+.23,py1-.08,py1-.064,-.06,.06,M.grey); bx(G,ex+.17,ex+.19,py0+.215,py1-.08,-.04,.04,M.grey);
    bx(G,ex+.13,ex+.27,py0+.06,py0+.14,-.09,.09,M.black); bx(G,ex+.125,ex+.275,py0+.14,py0+.215,-.105,.105,M.acryl);
    for(const d of [-.05,.05]) rod(G,[ex+.125,py0+.178,d],[ex+.265,py0+.178,d],.03,M.dark,20);
    tube(G,[[ex+.21,py0+.215,.03],[ex+.24,py1-.1,.07],[ex+.26,py1-.07,.14]],.009,M.black); G.position.z=zc-.12; }
  /* 비전부 (동쪽 칸) */
  lin(.38,.5); servo(.38,.5);
  bx(g,ex+.505,ex+.55,py1-.05,py1-.02,zN+.02,zc,M.black);                                     /* 케이블 체인 */
  { const G=new T3.Group(); g.add(G); PU.vis=G;                                                /* 카메라 (남북 이동) */
    bx(G,ex+.39,ex+.49,py1-.08,py1-.064,-.05,.05,M.grey); bx(G,ex+.41,ex+.43,py0+.13,py1-.08,-.035,.035,M.alu); bx(G,ex+.41,ex+.47,py0+.13,py0+.15,-.035,.035,M.alu);
    bx(G,ex+.45,ex+.535,py0+.1,py0+.2,-.045,.045,M.black); rod(G,[ex+.535,py0+.15,0],[ex+.545,py0+.15,0],.006,FM.ledR||(FM.ledR=new T3.MeshStandardMaterial({color:0xff2020,emissive:0xff2020,emissiveIntensity:2})),10);
    tube(G,[[ex+.49,py0+.2,.03],[ex+.5,py1-.1,.06],[ex+.52,py1-.05,.1]],.008,M.black); G.position.z=zc+.1; }
  bx(g,ex+.56,ex+.595,py1-.06,py1-.035,zN+.03,zS-.03,new T3.MeshStandardMaterial({color:0xff3030,emissive:0xff1a1a,emissiveIntensity:1.4}));   /* 적색 조명 */
  /* 인쇄 · 비전 제어 박스 (북쪽 면 · 흰 함체 · 터치 화면 · OFF/ON 로터리 · 적색 버튼 — 사진) · 공압 레귤레이터 · 전선관 */
  { const z0=cz0+.04, b0=zN-.2, b1=zN-.04; bx(g,ex+.02,ex+.3,1.06,1.44,b0,b1,M.white); bx(g,ex+.06,ex+.26,1.3,1.4,b0-.004,b0,M.scr); bx(g,ex+.04,ex+.28,1.285,1.415,b0-.003,b0-.001,M.black);
    rod(g,[ex+.09,1.19,b0],[ex+.09,1.19,b0-.02],.016,M.red,14); rod(g,[ex+.22,1.15,b0],[ex+.22,1.15,b0-.014],.013,M.red,14); for(const y of [1.1,1.4]) bx(g,ex+.295,ex+.31,y-.03,y+.03,b0+.02,b0+.06,M.white);
  
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
