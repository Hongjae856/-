/* ═══════════════════════════════════════════════════════════════════
   포장실 설비 (B2 · 11/18) — 현장 영상 · 사진 기반 (치수는 사진 어림 · 사용자 위임 "알아서")
   흐름 : 칸막이 벽 통과구 컨베이어 → 턴테이블(버퍼) → 라벨 인쇄(열전사) · 라벨 부착(감싸기 · 2D 코드 비전 · 후단 리젝터)
          → 부착형 설명서(캡 윗면 · 유무 리젝터 없음) → 중량선별기(설명서 누락 · 중량 리젝트) → 집적 벨트 · 작업대
          → 작업자 1 바코드 판독대(거치형 판독기 · 집합 포장 PC · AG 라벨 프린터) → 작업자 2 박스 작업대 → 파렛트
   좌표 : 공용 mm (x 라인 진행 · 컨베이어 중심 z = 0 · 작업자 쪽 +z) → Three.js m
   ═══════════════════════════════════════════════════════════════════ */
const PK={
  CH:900,                                            /* 컨베이어 상면 */
  pass:[8300,9850],                                  /* 통과구 컨베이어 (칸막이 x = 8900) */
  tt:{x:10150, z:-420, r:560},                       /* 턴테이블 (지름 약 1.1 m) */
  line:[10450,15700],                                /* 라벨 · 설명서 · 중량선별 컨베이어 */
  lab:[10700,12400], labX:{print:11150, vis:11800, wrap:11900, rej:12450},
  leaf:[12800,14400], leafX:13700,
  cw:{x0:14600,x1:15700,w0:14950,w1:15350,flip:15500},
  acc:[15700,18300],                                 /* 집적 벨트 · 작업대 */
  scan:[18300,19300], scanX:18750,
  box:[19400,21400],
  pallet:{x:20700, z:2050},
  bottle:{r:19, h:62, cap:12}                        /* 30 mL HDPE 병 (어림) */
};
const PKG={G:null, B:null, list:[], last:-1, acc:[], rejL:[], rejW:[], t:0, mov:[]};
const pm=v=>v*MM;
/* 투명 덮개 상자 (테두리 보라 · 파우치 아크릴 재질) */
function acrylBox(g,x0,x1,y0,y1,z0,z1){ bx(g,x0,x1,y0,y1,z0,z1,M.acryl).castShadow=false;
  for(const [a,b] of [[[x0,y1,z0],[x1,y1,z0]],[[x0,y1,z1],[x1,y1,z1]],[[x0,y1,z0],[x0,y1,z1]],[[x1,y1,z0],[x1,y1,z1]],[[x0,y0,z1],[x0,y1,z1]],[[x1,y0,z1],[x1,y1,z1]]]) rod(g,a,b,.003,M.acrylEdge,6); }
/* 체인 컨베이어 : 슬랫 · 측면 프레임 · 가이드 레일 · 다리 */
function pkConv(g,x0,x1,z,w,legs){
  const y=pm(PK.CH), a=pm(x0), b=pm(x1), hw=pm(w)/2, zz=pm(z);
  bx(g,a,b,y-.012,y,zz-hw,zz+hw,M.dark);                                     /* 슬랫 체인 */
  bx(g,a,b,y-.09,y-.005,zz-hw-.025,zz-hw-.01,M.ss); bx(g,a,b,y-.09,y-.005,zz+hw+.01,zz+hw+.025,M.ss);   /* 프레임 */
  for(const s of [-1,1]) rod(g,[a,y+.035,zz+s*(hw+.004)],[b,y+.035,zz+s*(hw+.004)],.004,M.ssMir,8);   /* 가이드 레일 */
  if(legs!==false) for(let x=a+.15;x<b;x+=.9){ foot(g,x,zz-hw,y-.09,.02); foot(g,x,zz+hw,y-.09,.02); }
}
function cabinet(g,x0,x1,z0,z1,h){ const m=bx(g,pm(x0),pm(x1),.08,pm(h),pm(z0),pm(z1),M.ss); for(const [x,z] of [[x0+60,z0+60],[x1-60,z0+60],[x0+60,z1-60],[x1-60,z1-60]]) foot(g,pm(x),pm(z),.08,.025); return m; }
function screen(g,w,h,pos,rotY,lines){ const t=labelTex(lines||["",""],{w:256,h:160,bg:"#0f2a3a",fg:"#7fe0ff"}); const m=plate(g,w,h,t,pos,rotY||0); m.material.emissive=new T3.Color(0x3a6070); m.material.emissiveMap=t; m.material.emissiveIntensity=.9; return m; }
function gearMotor(g,x,y,z){ bx(g,x-.05,x+.05,y,y+.16,z-.05,z+.05,new T3.MeshStandardMaterial({color:0x1f3b2c,roughness:.5})); rod(g,[x,y+.16,z],[x,y+.19,z],.035,M.dark,16); }
function pkBuild(sc){
  const g=new T3.Group(); PKG.G=g; sc.add(g); const y=pm(PK.CH);
  M.ss.envMapIntensity=1.15; M.ssMir.envMapIntensity=1.25; M.ssD.envMapIntensity=1.05;   /* 실제 장면 반사(흰 벽)에서 스테인리스가 하얗게 뜨지 않게 (B6) */
  /* 통과구 컨베이어 (벽 양쪽 투명 덮개) */
  pkConv(g,PK.pass[0],PK.pass[1],0,110);
  acrylBox(g,pm(8960),pm(9300),y,y+.22,-.09,.09);
  /* ① 턴테이블 */
  { const t=PK.tt, cx=pm(t.x), cz=pm(t.z), r=pm(t.r);
    cabinet(g,t.x-420,t.x+420,t.z-380,t.z+380,y*1000-60);
    const disc=add(g,new T3.Mesh(new T3.CylinderGeometry(r,r,.012,64),M.ssMir)); disc.position.set(cx,y-.006,cz); PKG.disc=disc;
    const rim=add(g,new T3.Mesh(new T3.TorusGeometry(r+.01,.008,8,64),M.ss)); rim.rotation.x=Math.PI/2; rim.position.set(cx,y+.03,cz);
    add(g,new T3.Mesh(new T3.CylinderGeometry(.07,.07,.06,24),M.black)).position.set(cx,y+.03,cz);
    /* 나선 가이드 · 출구 가이드 암 */
    const pts=[]; for(let a=0;a<=Math.PI*1.4;a+=.1){ const rr=r*.55+a*.05; pts.push([cx+Math.cos(a+Math.PI)*rr,y+.04,cz+Math.sin(a+Math.PI)*rr]); } tube(g,pts,.006,M.ss);
    rod(g,[cx+r*.2,y+.045,cz+r*.6],[pm(10520),y+.045,.065],.006,M.ss,8); rod(g,[cx-r*.9,y+.045,cz+r*.35],[pm(9850),y+.045,-.06],.006,M.ss,8);
    for(const [px,pz] of [[cx-r*.75,cz+r*.55],[cx+r*.35,cz+r*.75]]){ rod(g,[px,y,pz],[px,y+.32,pz],.012,M.ss,12); rod(g,[px,y+.32,pz],[px+.08,y+.36,pz],.007,M.dark,8); }
    bx(g,cx-.08,cx+.08,.35,.47,cz+pm(380),cz+pm(392),M.dark); }                      /* 속도 조절기 */
  /* 라벨 컨베이어 ~ 중량선별 입구 */
  pkConv(g,PK.line[0],PK.cw.x0,0,110,false);
  /* ② 라벨 인쇄 · ③ 라벨 부착 */
  { const [a,b]=PK.lab; cabinet(g,a,b,-420,420,840);
    const ux=pm(10900), uy=pm(1020), uz=pm(-470);
    rod(g,[ux,pm(840),uz],[ux,uy,uz],.02,M.ss,16); const roll=add(g,new T3.Mesh(new T3.CylinderGeometry(.17,.17,.08,40),new T3.MeshStandardMaterial({color:0xf3eef0,roughness:.6}))); roll.position.set(ux,uy+.05,uz); PKG.labRoll=roll;
    add(g,new T3.Mesh(new T3.CylinderGeometry(.2,.2,.006,40),M.acryl)).position.set(ux,uy,uz);
    /* 라벨 경로 판 (흰 판 · 롤러) */
    bx(g,pm(11000),pm(12150),pm(860),pm(1250),pm(-330),pm(-300),M.white);
    for(const [x,yy] of [[11050,1150],[11400,1000],[11700,1180],[12050,1000]]) rod(g,[pm(x),pm(yy),pm(-300)],[pm(x),pm(yy),pm(-230)],.022,M.alu,20);
    /* 열전사 인쇄기 (핸들로 높이 조정) · 화면 */
    bx(g,pm(11080),pm(11320),pm(1080),pm(1260),pm(-300),pm(-90),M.dark); rod(g,[pm(11200),pm(1260),pm(-200)],[pm(11200),pm(1330),pm(-200)],.01,M.ss,10);
    add(g,new T3.Mesh(new T3.TorusGeometry(.05,.008,8,24),M.black)).position.set(pm(11200),pm(1340),pm(-200));
    rod(g,[pm(11050),pm(840),pm(430)],[pm(11050),pm(1500),pm(430)],.02,M.ss,12);                    /* 인쇄기 화면 : 작업자 쪽(앞) 기둥 (사진) */
    bx(g,pm(10900),pm(11260),pm(1500),pm(1730),pm(400),pm(440),M.black); PKG.prScr=screen(g,.33,.2,[pm(11080),pm(1615),pm(443)],0,["인쇄 대기","LOT · EXP"]);
    /* 비전 카메라 (노란색) */
    bx(g,pm(11760),pm(11850),pm(1060),pm(1130),pm(-200),pm(-130),M.yellow); rod(g,[pm(11805),pm(1095),pm(-130)],[pm(11805),pm(1095),pm(-110)],.012,M.dark,12);
    /* 감싸기 벨트 (녹색) */
    bx(g,pm(11650),pm(12150),pm(905),pm(985),pm(85),pm(115),M.green); for(const x of [11650,12150]) rod(g,[pm(x),pm(900),pm(100)],[pm(x),pm(990),pm(100)],.03,M.alu,20);
    gearMotor(g,pm(11900),y+.1,pm(180));
    /* 조작 판넬 (터치 · 비상정지 · 키) */
    rod(g,[pm(12300),pm(840),pm(450)],[pm(12300),pm(1500),pm(450)],.025,M.ss,14);                   /* 라벨러 판넬 : 앞쪽 기둥 */
    bx(g,pm(12150),pm(12450),pm(1500),pm(1720),pm(420),pm(470),M.ss); PKG.labScr=screen(g,.17,.12,[pm(12270),pm(1620),pm(473)],0,["라벨러","대기"]);
    add(g,new T3.Mesh(new T3.CylinderGeometry(.022,.022,.02,20),M.red)).position.set(pm(12400),pm(1560),pm(480)); PKG.labEmg=[pm(12400),pm(1560),pm(480)];
    /* 후단 리젝터 (공압 실린더 → 리젝트 함) */
    rod(g,[pm(PK.labX.rej),pm(960),pm(-260)],[pm(PK.labX.rej),pm(960),pm(-90)],.016,M.alu,16); PKG.rejPusher=bx(g,pm(PK.labX.rej)-.03,pm(PK.labX.rej)+.03,pm(925),pm(995),-.09,-.075,M.white);
    acrylBox(g,pm(12350),pm(12650),pm(560),pm(860),pm(160),pm(460)); bx(g,pm(12350),pm(12650),pm(540),pm(560),pm(160),pm(460),M.ss);
    PKG.rejLab={x:12500,y:560,z:310};
    /* 이동식 PC 스탠드 (핸드 스캐너 · 판정 화면) */
    { const sx=pm(10250), sz=pm(1050); bx(g,sx-.3,sx+.3,.03,.05,sz-.25,sz+.25,M.grey); for(const [dx,dz] of [[-.27,-.22],[.27,-.22],[-.27,.22],[.27,.22]]) add(g,new T3.Mesh(new T3.SphereGeometry(.025,10,8),M.red)).position.set(sx+dx,.025,sz+dz);
      bx(g,sx-.04,sx+.04,.05,1.35,sz-.04,sz+.04,M.alu); bx(g,sx-.22,sx+.22,1.3,1.62,sz-.08,sz+.02,M.ss); PKG.pcScr=screen(g,.36,.27,[sx,1.46,sz+.025],0,["판정","OK"]);
      bx(g,sx-.2,sx+.2,1.1,1.12,sz+.02,sz+.2,M.black); rod(g,[sx-.12,1.0,sz+.05],[sx-.12,1.18,sz+.05],.018,M.black,10); } }
  /* ④ 부착형 설명서 */
  { const [a,b]=PK.leaf; cabinet(g,a,b,-380,380,840);
    rod(g,[pm(13100),pm(840),pm(-330)],[pm(13100),pm(1900),pm(-330)],.025,M.ss,14); rod(g,[pm(14100),pm(840),pm(-330)],[pm(14100),pm(1900),pm(-330)],.025,M.ss,14);
    rod(g,[pm(13100),pm(1880),pm(-330)],[pm(14100),pm(1880),pm(-330)],.02,M.ss,12);
    const reel=add(g,new T3.Mesh(new T3.CylinderGeometry(.27,.27,.07,48),new T3.MeshStandardMaterial({color:0xeceeef,roughness:.7}))); reel.rotation.x=Math.PI/2; reel.position.set(pm(13400),pm(1560),pm(-280)); PKG.leafReel=reel;
    const cov=add(g,new T3.Mesh(new T3.CylinderGeometry(.33,.33,.004,48),M.acryl)); cov.rotation.x=Math.PI/2; cov.position.set(pm(13400),pm(1560),pm(-235)); cov.castShadow=false;
    bx(g,pm(13250),pm(13700),pm(1000),pm(1450),pm(-330),pm(-300),M.alu);                       /* 공급 판 */
    rod(g,[pm(13300),pm(1300),pm(-300)],[pm(13300),pm(1300),pm(-220)],.04,M.white,24); rod(g,[pm(13600),pm(1120),pm(-300)],[pm(13600),pm(1120),pm(-220)],.035,M.white,24);
    rod(g,[pm(13500),pm(1100),pm(-300)],[pm(13500),pm(1100),pm(-230)],.055,new T3.MeshStandardMaterial({color:0x1f6f4a,roughness:.5}),24);   /* 스테핑 모터 */
    bx(g,pm(13650),pm(13780),pm(1000),pm(1060),pm(-200),pm(-20),M.alu); PKG.leafHead=bx(g,pm(13680),pm(13760),pm(990),pm(1005),pm(-60),pm(20),M.white);   /* 부착 헤드 */
    bx(g,pm(13780),pm(13840),pm(1080),pm(1130),pm(-180),pm(-120),M.yellow);                    /* 라벨 감지 센서 */
    /* 라벨 컨트롤러 (LCD · 전원 · 비상정지) · 경광등 */
    rod(g,[pm(14250),pm(840),pm(330)],[pm(14250),pm(1500),pm(330)],.025,M.ss,14);                   /* 설명서 부착기 컨트롤러 : 앞쪽 기둥 (사진 : 컨트롤러 + 아래 전원함) */
    bx(g,pm(13950),pm(14550),pm(1500),pm(1640),pm(300),pm(480),new T3.MeshStandardMaterial({color:0xd8d2d0,roughness:.5})); bx(g,pm(14120),pm(14380),pm(1350),pm(1460),pm(330),pm(420),M.white);
    /* 사진 기준 세부 : 카운터(7세그) · 2줄 LCD · OPERATOR F1 F2 I O · EDIT 방향키 · 로커 스위치 2(적색 점등) · 아래 전원함(키 · 램프 · 비상정지) */
    { const fz=pm(481); bx(g,pm(13980),pm(14080),pm(1555),pm(1600),fz,fz+.004,M.black); [[M.yellow,0],[M.yellow,1],[M.green,2],[M.red,3]].forEach(([m,i])=>{ const b=add(g,new T3.Mesh(new T3.CylinderGeometry(.011,.011,.008,14),m)); b.rotation.x=Math.PI/2; b.position.set(pm(14080+i*28),pm(1528),fz+.004); });
      for(let i=0;i<6;i++){ const b=add(g,new T3.Mesh(new T3.BoxGeometry(.016,.016,.008),i===4?M.blue:M.yellow)); b.position.set(pm(14260+(i%2)*24),pm(1590-Math.floor(i/2)*22),fz+.004); }
      for(const x of [14400,14480]){ bx(g,pm(x-25),pm(x+25),pm(1540),pm(1600),fz,fz+.006,M.dark); bx(g,pm(x-14),pm(x+14),pm(1552),pm(1588),fz+.006,fz+.012,new T3.MeshStandardMaterial({color:0xff2a20,emissive:0xff1010,emissiveIntensity:.8})); }
      const ky=pm(1405), kz=pm(422); add(g,new T3.Mesh(new T3.CylinderGeometry(.02,.02,.02,16),M.dark)).position.set(pm(14170),ky,kz); add(g,new T3.Mesh(new T3.SphereGeometry(.014,12,8),new T3.MeshStandardMaterial({color:0x801010,emissive:0xff2020,emissiveIntensity:.6}))).position.set(pm(14250),ky,kz); }
    PKG.leafScr=screen(g,.14,.06,[pm(14200),pm(1585),pm(483)],0,["RUN MODE","LABEL"]); { const e=add(g,new T3.Mesh(new T3.CylinderGeometry(.018,.018,.02,16),M.red)); e.position.set(pm(14330),pm(1405),pm(425)); e.rotation.x=Math.PI/2; }
    add(g,new T3.Mesh(new T3.CylinderGeometry(.045,.05,.11,20),new T3.MeshStandardMaterial({color:0xd01818,emissive:0x400000,roughness:.3,transparent:true,opacity:.85}))).position.set(pm(14600),pm(1600),pm(390));
    for(const x of [12950,14250]) gearMotor(g,pm(x),y+.1,pm(170)); acrylBox(g,pm(12850),pm(13200),y,y+.25,-.15,.15); }
  /* ⑤ 중량선별기 */
  { const c=PK.cw; bx(g,pm(c.x0),pm(c.x1),pm(820),pm(880),-.16,.16,M.ss); for(const x of [c.x0+80,c.x1-80]) for(const z of [-120,120]) foot(g,pm(x),pm(z),pm(820),.025);
    for(const [a,b,m] of [[c.x0,c.w0,M.white],[c.w0+10,c.w1-10,M.white],[c.w1,c.x1,M.white]]) bx(g,pm(a),pm(b),pm(880),pm(PK.CH),-.075,.075,m);
    acrylBox(g,pm(c.x0),pm(c.x1),pm(PK.CH),pm(PK.CH+300),-.2,.2);
    bx(g,pm(c.w0+50),pm(c.w1-50),pm(300),pm(820),-.15,-.05,M.ss);                                   /* 계량부 */
    bx(g,pm(14950),pm(15350),pm(880),pm(1500),pm(-520),pm(-440),M.ss); bx(g,pm(14980),pm(15320),pm(1500),pm(1860),pm(-500),pm(-420),new T3.MeshStandardMaterial({color:0x2a2d31,roughness:.4}));
    PKG.cwScr=screen(g,.24,.1,[pm(15150),pm(1780),pm(-417)],0,["0.00 g","대기"]); bx(g,pm(15010),pm(15290),pm(1520),pm(1690),pm(-418),pm(-414),M.white);   /* 키패드 */
    bx(g,pm(14700),pm(14920),pm(1450),pm(1800),pm(-520),pm(-420),M.dark);                          /* 기록 프린터 */
    PKG.flip=bx(g,pm(c.flip),pm(c.flip)+.02,pm(PK.CH+10),pm(PK.CH+70),-.08,.08,M.ss);
    acrylBox(g,pm(15750),pm(16150),pm(520),pm(860),pm(140),pm(480)); bx(g,pm(15750),pm(16150),pm(500),pm(520),pm(140),pm(480),M.ss);
    plate(g,.2,.06,labelTex(["포장실","기준 중량 이상"],{w:256,h:80}),[pm(15950),pm(600),pm(482)],0); PKG.rejCw={x:15950,y:520,z:310}; }
  /* ⑥ 집적 벨트 · 작업대 */
  { const [a,b]=PK.acc; bx(g,pm(a),pm(b),pm(860),pm(890),pm(-350),pm(450),M.ss); for(const x of [a+80,b-80]) for(const z of [-300,400]) foot(g,pm(x),pm(z),pm(860),.03);
    bx(g,pm(a),pm(b-200),pm(890),pm(PK.CH),pm(-60),pm(160),new T3.MeshStandardMaterial({color:0x1f2b2a,roughness:.7}));
    bx(g,pm(16400),pm(16520),pm(890),pm(990),pm(330),pm(360),M.white);                             /* 온습도계 */
    plate(g,.3,.4,labelTex(["작업 기록",""],{w:200,h:260}),[pm(17000),pm(892),pm(300)],0).rotation.x=-Math.PI/2; }
  /* ⑦ 작업자 1 : 바코드 판독대 */
  { const [a,b]=PK.scan; cabinet(g,a,b,-400,450,900); bx(g,pm(a),pm(b),pm(900),pm(915),pm(-420),pm(470),M.ss);
    const sx=pm(PK.scanX); bx(g,sx-.13,sx+.13,pm(915),pm(1080),pm(-260),pm(-120),M.dark);              /* 거치형 판독기 */
    PKG.scanWin=bx(g,sx-.1,sx+.1,pm(930),pm(1060),pm(-119),pm(-117),new T3.MeshStandardMaterial({color:0x400606,emissive:0xff2020,emissiveIntensity:.5}));
    bx(g,sx-.13,sx+.13,pm(1080),pm(1090),pm(-260),pm(-100),new T3.MeshStandardMaterial({color:0x1fd060,emissive:0x0f8030,emissiveIntensity:.6}));
    rod(g,[sx,pm(915),pm(-350)],[sx,pm(1300),pm(-350)],.025,M.ss,12); bx(g,sx-.3,sx+.3,pm(1300),pm(1690),pm(-370),pm(-330),M.black);
    PKG.aggScr=screen(g,.56,.36,[sx,pm(1495),pm(-328)],0,["집합 포장","0 / 40"]); bx(g,sx-.22,sx+.22,pm(1150),pm(1170),pm(-300),pm(-180),M.dark);   /* 키보드 */
    bx(g,pm(19050),pm(19300),pm(915),pm(1300),pm(-420),pm(-60),new T3.MeshStandardMaterial({color:0x2c2f33,roughness:.45}));   /* AG 라벨 프린터 */
    bx(g,pm(19060),pm(19290),pm(1000),pm(1020),pm(-59),pm(-55),M.white); PKG.agLabel={x:19175,y:1010,z:-40}; }
  /* ⑧ 작업자 2 : 박스 작업대 · 접힌 박스 · 파렛트 · 대차 · 의자 */
  { const [a,b]=PK.box; bx(g,pm(a),pm(b),pm(870),pm(900),pm(-450),pm(450),M.ss); for(const x of [a+80,b-80]) for(const z of [-400,400]) foot(g,pm(x),pm(z),pm(870),.03);
    const kraft=new T3.MeshStandardMaterial({color:0xc9a575,roughness:.85}); PKG.kraft=kraft;
    for(let i=0;i<14;i++) bx(g,pm(20700),pm(21300),pm(900+i*8),pm(906+i*8),pm(-380),pm(80),kraft);   /* 접힌 박스 더미 */
    PKG.openBox=new T3.Group(); g.add(PKG.openBox); PKG.openBox.position.set(pm(19950),pm(900),0);
    for(const [x0,x1,z0,z1] of [[-.18,.18,-.125,-.12],[-.18,.18,.12,.125],[-.18,-.175,-.125,.125],[.175,.18,-.125,.125]]) bx(PKG.openBox,x0,x1,0,.11,z0,z1,kraft); bx(PKG.openBox,-.18,.18,0,.004,-.125,.125,kraft);
    const pal=new T3.MeshStandardMaterial({color:0x2a6ad0,roughness:.6}), P=PK.pallet; bx(g,pm(P.x-550),pm(P.x+550),0,.02,pm(P.z-550),pm(P.z+550),pal);
    for(const dx of [-480,0,480]) bx(g,pm(P.x+dx-50),pm(P.x+dx+50),.02,.12,pm(P.z-550),pm(P.z+550),pal); bx(g,pm(P.x-550),pm(P.x+550),.12,.14,pm(P.z-550),pm(P.z+550),pal);
    PKG.palG=new T3.Group(); g.add(PKG.palG);
    /* 대차 */ { const cx=pm(19800), cz=pm(1500); bx(g,cx-.4,cx+.4,.42,.45,cz-.3,cz+.3,M.ss); bx(g,cx-.4,cx+.4,.12,.14,cz-.3,cz+.3,M.ss); for(const [dx,dz] of [[-.36,-.26],[.36,-.26],[-.36,.26],[.36,.26]]){ rod(g,[cx+dx,.06,cz+dz],[cx+dx,.45,cz+dz],.018,M.ss,10); add(g,new T3.Mesh(new T3.SphereGeometry(.04,10,8),M.dark)).position.set(cx+dx,.04,cz+dz); } }
    /* 의자 */ for(const [x,z] of [[18750,780],[16900,780]]){ const cx=pm(x), cz=pm(z); add(g,new T3.Mesh(new T3.CylinderGeometry(.17,.17,.06,24),M.black)).position.set(cx,.66,cz); rod(g,[cx,.1,cz],[cx,.63,cz],.025,M.ssMir,12); for(let k=0;k<5;k++){ const q=k/5*Math.PI*2; rod(g,[cx,.1,cz],[cx+Math.cos(q)*.25,.03,cz+Math.sin(q)*.25],.012,M.ssMir,8); } } }
  pkBottles(g);
}
/* ── 병 (인스턴스) : 몸통 · 캡 · 라벨 띠 · 설명서 탭 ── */
function pkBottles(g){
  const N=240, b=PK.bottle, r=pm(b.r), h=pm(b.h);
  const mk=(geo,mat)=>{ const m=new T3.InstancedMesh(geo,mat,N); m.instanceMatrix.setUsage(T3.DynamicDrawUsage); m.count=0; m.castShadow=true; m.frustumCulled=false; g.add(m); return m; };
  const body=new T3.CylinderGeometry(r,r,h*.86,24); body.translate(0,h*.43,0);
  const cap=new T3.CylinderGeometry(r*.78,r*.78,pm(b.cap),20); cap.translate(0,h*.86+pm(b.cap)/2,0);
  const lab=new T3.CylinderGeometry(r*1.012,r*1.012,h*.5,24,1,true); lab.translate(0,h*.42,0);
  const tab=new T3.BoxGeometry(r*1.5,pm(4),r*2.3); tab.translate(0,h*.86+pm(b.cap)+pm(2),-r*.2);
  const labTex=labelTex(["",""],{w:256,h:64,bg:"#f6f4f5",bar:"#d8327a"});
  PKG.B={body:mk(body,new T3.MeshStandardMaterial({color:0xf3f3f0,roughness:.45})), cap:mk(cap,new T3.MeshStandardMaterial({color:0xf8f8f6,roughness:.4})),
    lab:mk(lab,new T3.MeshStandardMaterial({map:labTex,roughness:.5})), tab:mk(tab,new T3.MeshStandardMaterial({color:0xfbfbfa,roughness:.7}))};
}
/* 경로 : 통과구 → 턴테이블(뒤쪽으로 크게 돌아 나감 · 버퍼) → 라인 → 중량선별 → 집적 벨트 끝 */
function pkArc(){ const t=PK.tt, R=Math.hypot(PK.pass[1]-t.x,t.z), a0=Math.atan2(-t.z,PK.pass[1]-t.x), a1=Math.atan2(-t.z,PK.line[0]-t.x)+Math.PI*2; return {R,a0,a1,L:(a1-a0)*R}; }
function pkPath(s){
  const p0=PK.pass[0], p1=PK.pass[1], t=PK.tt, A=pkArc(), L0=p1-p0;
  if(s<L0) return [p0+s,0,0];
  s-=L0; if(s<A.L){ const a=A.a0+s/A.R; return [t.x+Math.cos(a)*A.R,0,t.z+Math.sin(a)*A.R]; }
  s-=A.L; return [PK.line[0]+s,0,0];
}
const PK_END=()=>(PK.pass[1]-PK.pass[0])+pkArc().L+(PK.acc[1]-200-PK.line[0]);
/* 바닥 장애물 [x0,x1,z0,z1] (mm) — 1인칭 충돌 */
function pkObstacles(){ const L=[], t=PK.tt;
  L.push([PK.pass[0],PK.pass[1],-120,120],[t.x-t.r,t.x+t.r,t.z-t.r,t.z+t.r],[PK.line[0],PK.cw.x1,-200,200],[PK.lab[0],PK.lab[1],-480,420],[PK.leaf[0],PK.leaf[1],-400,380],[14150,14350,300,480],[12200,12400,400,500],[10950,11150,380,460],
    [PK.cw.x0,PK.cw.x1,-540,220],[15750,16150,140,480],[12350,12650,160,460],[PK.acc[0],PK.acc[1],-350,450],[PK.scan[0],PK.scan[1],-420,470],[PK.box[0],PK.box[1],-450,450],
    [PK.pallet.x-550,PK.pallet.x+550,PK.pallet.z-550,PK.pallet.z+550],[-3440,-2960,620,730],[19400,20200,1200,1800],[9950,10550,800,1300]);
  return L; }
/* 흐름 · 시뮬레이션 · 설비 화면 : packsim.js (B3) */
