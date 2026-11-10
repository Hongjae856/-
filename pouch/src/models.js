/* ═══════════════════════════════════════════════════════════════════
   3D 정적 형상 — 충전실(충전기 · 2층 데크 · IBC · 리프터) · 칸막이 벽 · 포장실(스틱공급장치 ~ 수동포장)
   ※ 외형은 SOP 부위 사진 · 현장 영상 비율 기준 추정 (실측 아님)
   ═══════════════════════════════════════════════════════════════════ */
const VIEW3={guard:true,label:true};
const COL={foilR:[0.80,0.18,0.20,0.25], foil:[0.86,0.87,0.88,0.75], dial:[0.95,0.50,0.12,0.15], ibc:[0.93,0.94,0.95,0.05],
  cage:[0.62,0.66,0.70,0.85], deck:[0.55,0.59,0.63,0.8], rail:[0.95,0.80,0.20,0.3], blueM:[0.20,0.36,0.62,0.25],
  carton:[0.96,0.95,0.92,0.04], cartonP:[0.82,0.20,0.20,0.05], wall:[0.90,0.92,0.93,0.05], glassW:[0.70,0.84,0.92,0.4],
  lsGrey:[0.78,0.80,0.82,0.45], belt:[0.12,0.48,0.40,0.1], beltG:[0.20,0.22,0.25,0.1], ishida:[0.92,0.93,0.94,0.3]};
function foot(x,z,y){ cylY(x,z,0,y||60,22,C.dark,10); disc(0.6,0,40,C.rubber,12); }
function legsBox(x0,x1,z0,z1,y){ for(const x of [x0,x1]) for(const z of [z0,z1]) { cylY(x,z,0,y,26,C.ss,10); cylY(x,z,0,18,46,C.dark,12); } }
function screen(x,y,z,w,h,face,col){   /* face : +z(앞) · -z(뒤) · +x · -x */
  const d=12, c=col||E.scr;
  if(face==="+z"){ box(x-w/2-18,x+w/2+18,y-h/2-18,y+h/2+18,z-30,z,C.hmi); box(x-w/2,x+w/2,y-h/2,y+h/2,z,z+2,c,c,0); }
  else if(face==="-z"){ box(x-w/2-18,x+w/2+18,y-h/2-18,y+h/2+18,z,z+30,C.hmi); box(x-w/2,x+w/2,y-h/2,y+h/2,z-2,z,c,c,0); }
  else if(face==="-x"){ box(x,x+30,y-h/2-18,y+h/2+18,z-w/2-18,z+w/2+18,C.hmi); box(x-2,x,y-h/2,y+h/2,z-w/2,z+w/2,c,c,0); }
  else { box(x-30,x,y-h/2-18,y+h/2+18,z-w/2-18,z+w/2+18,C.hmi); box(x,x+2,y-h/2,y+h/2,z-w/2,z+w/2,c,c,0); }
}
function pushBtn(x,y,z,col,r){ cylZ(x,y,z,z+14,(r||22)+5,C.dark,12); cylZ(x,y,z+14,z+26,r||22,col,14); }
function emgBtn(x,y,z){ box(x-34,x+34,y-34,y+34,z,z+16,C.yellow,C.yellow); cylZ(x,y,z+16,z+30,22,C.dark,12); cylZ(x,y,z+30,z+52,30,C.red,16); }
function lampTower(x,z,y0){ cylY(x,z,y0,y0+260,10,C.ss,8); cylY(x,z,y0+260,y0+330,30,[0.20,0.66,0.38,0.2],14); cylY(x,z,y0+330,y0+400,30,[0.95,0.75,0.2,0.2],14); cylY(x,z,y0+400,y0+470,30,[0.85,0.22,0.18,0.2],14); }
function plate(x,y,z,w,col){ box(x-w/2,x+w/2,y-18,y+18,z,z+3,col||C.blue,col||C.blue,0); }

let STATIC_KEY="";
function staticKey(){ return [VIEW3.guard?1:0, S?S.f.door:"c", S?S.room:"F"].join("|"); }
function buildStatic(){
  STATIC_KEY=staticKey();
  geoBegin(GEO.stat);
  sRoom(); sDeck(); sFiller(); sHoppers(); sBack(); sConveyor(); sFeeder(); sCartoner(); sOutConv(); sPrinter(); sXray(); sCW(); sPack();
  R3.statDirty=true;
  geoBegin(GEO.dyn);
}

/* ── 실 : 칸막이 벽(창) · 바닥 표시 ── */
function sRoom(){
  const W=ROOM.wall, t=ROOM.wallT/2, H=3300, hole={z0:CV.z-220, z1:CV.z+220, y0:1250, y1:1750};
  const wcol=COL.wall;
  box(W-t,W+t,0,H,ROOM.back,hole.z0,wcol,wcol,0);
  box(W-t,W+t,0,hole.y0,hole.z0,hole.z1,wcol,wcol,0);
  box(W-t,W+t,hole.y1,H,hole.z0,hole.z1,wcol,wcol,0);
  box(W-t,W+t,0,H,hole.z1,DOORW.z0,wcol,wcol,0);
  box(W-t,W+t,DOORW.h,H,DOORW.z0,DOORW.z1,wcol,wcol,0);                    /* 실 사이 출입구 (1인칭 이동용) [추정] */
  box(W-t,W+t,0,H,DOORW.z1,ROOM.front,wcol,wcol,0);
  for(const z of [DOORW.z0,DOORW.z1]) box(W-t-12,W+t+12,0,DOORW.h,z-30,z+30,C.ssL,C.ssL,0);
  box(W-t-12,W+t+12,DOORW.h,DOORW.h+40,DOORW.z0-30,DOORW.z1+30,C.ssL,C.ssL,0);
  /* 관찰창 */
  const wz0=-1700, wz1=-500, wy0=1100, wy1=2100;
  glassBox(W-t+4,W+t-4,wy0,wy1,wz0,wz1,COL.glassW,0.22);
  box(W-t-6,W+t+6,wy0-30,wy0,wz0-30,wz1+30,C.ssL,C.ssL,0); box(W-t-6,W+t+6,wy1,wy1+30,wz0-30,wz1+30,C.ssL,C.ssL,0);
  box(W-t-6,W+t+6,wy0,wy1,wz0-30,wz0,C.ssL,C.ssL,0); box(W-t-6,W+t+6,wy0,wy1,wz1,wz1+30,C.ssL,C.ssL,0);
  /* 컨베이어 통과구 테두리 */
  for(const x of [W-t-4,W+t+4]){ box(x-3,x+3,hole.y0-20,hole.y1+20,hole.z0-20,hole.z0,C.ssL,C.ssL,0); box(x-3,x+3,hole.y0-20,hole.y1+20,hole.z1,hole.z1+20,C.ssL,C.ssL,0);
    box(x-3,x+3,hole.y1,hole.y1+20,hole.z0,hole.z1,C.ssL,C.ssL,0); box(x-3,x+3,hole.y0-20,hole.y0,hole.z0,hole.z1,C.ssL,C.ssL,0); }
  /* 바닥 : 600 mm 타일 (조제실 IDT 그래픽 기준 — 밝은 회색 바닥 · 이음 줄눈) */
  const T=600, fz0=ROOM.back, fz1=ROOM.front;
  for(let x=ROOM.x0;x<ROOM.x1;x+=T) for(let z=fz0;z<fz1;z+=T){
    const k=((x/T|0)+(z/T|0))&1, f=k?[0.66,0.70,0.69,0.12]:[0.69,0.73,0.72,0.12];
    const x1=Math.min(x+T,ROOM.x1)-4, z1=Math.min(z+T,fz1)-4;
    quad([x+4,0,z1],[x1,0,z1],[x1,0,z+4],[x+4,0,z+4],f);
  }
  box(ROOM.x0,ROOM.x1,-30,-1,fz0,fz1,[0.52,0.56,0.56,0.1],[0.52,0.56,0.56,0.1],0);
}
/* 벽 (카메라가 방 밖에서 볼 때 그 쪽 벽은 그리지 않는다) : 화이트 패널 · 이음 · 스테인리스 걸레받이 · 실 이름판 */
function dRoomShell(){
  const e=R3.eye, H=ROOM.ceil-600, wc=COL.wall, sk=C.steelM, sd=C.steelD;
  if(e[2]>ROOM.back){
    const z=ROOM.back;
    box(ROOM.x0,ROOM.x1,0,H,z-120,z,wc,wc,0);
    for(let x=ROOM.x0+1200;x<ROOM.x1;x+=1200) box(x-4,x+4,170,H,z,z+3,[0.80,0.83,0.85,0.4],null,0);
    box(ROOM.x0,ROOM.x1,0,160,z,z+22,sk,sk,0);
  }
  for(const [x,sg] of [[ROOM.x0,1],[ROOM.x1,-1]]){
    if((e[0]-x)*sg<=0) continue;
    box(x-120*sg>x?x:x-120*sg,x-120*sg>x?x+120*(-sg):x,0,H,ROOM.back,ROOM.front,wc,wc,0);
    box(Math.min(x,x+22*sg),Math.max(x,x+22*sg),0,160,ROOM.back,ROOM.front,sk,sk,0);
    for(let z=ROOM.back+1200;z<ROOM.front;z+=1200) box(Math.min(x,x+3*sg),Math.max(x,x+3*sg),170,H,z-4,z+4,[0.80,0.83,0.85,0.4],null,0);
  }
}
/* ── 2층 데크(도면 2855 × 2640 + 전면 확장) · 계단(우측 후방 50°) · 난간 935.6 · 리프터 ── */
function sDeck(){
  const D=DECK, y=D.y, top=[0.66,0.70,0.74,0.75];
  /* 본체 위 개구부를 남긴 데크 판 (본체 상부가 데크를 관통) */
  const hx0=FIL.x0+40, hx1=FIL.x1-40, hz0=FIL.z0+40, hz1=FIL.z1-20;
  box(D.x0,hx0,y-D.t,y,D.z0,D.z1,COL.deck,top,0); box(hx1,D.x1,y-D.t,y,D.z0,D.z1,COL.deck,top,0);
  box(hx0,hx1,y-D.t,y,D.z0,hz0,COL.deck,top,0); box(hx0,hx1,y-D.t,y,hz1,D.z1,COL.deck,top,0);
  for(let x=D.x0+300;x<D.x1;x+=600) box(x-2,x+2,y,y+1,D.z0,D.z1,[0.48,0.52,0.56,0.8],null,0);
  box(D.x0,D.x1,y-D.t-6,y-D.t,D.zF-30,D.zF+30,C.ss,null,0);                 /* 도면 프레임 앞 보 (확장부 이음) */
  /* 기둥 : 도면 프레임 4 + 전면 확장부 2 */
  for(const x of [D.x0+50,D.x1-50]) for(const z of [D.z0+50,D.zF-50,D.z1-50]) { box(x-45,x+45,0,y-D.t,z-45,z+45,C.ss); box(x-90,x+90,0,12,z-90,z+90,C.ssD,null,0); }
  /* 난간 (계단 입구 제외) */
  const rh=D.rail, rail=(a,b2)=>{ tube([a[0],y+rh,a[1]],[b2[0],y+rh,b2[1]],22,COL.rail,8); tube([a[0],y+rh/2,a[1]],[b2[0],y+rh/2,b2[1]],16,COL.rail,8);
    const n=Math.max(1,Math.round(Math.hypot(b2[0]-a[0],b2[1]-a[1])/900));
    for(let i=0;i<=n;i++){ const x=lerp(a[0],b2[0],i/n), z=lerp(a[1],b2[1],i/n); cylY(x,z,y,y+rh,18,COL.rail,8); }
    box(Math.min(a[0],b2[0])-10,Math.max(a[0],b2[0])+10,y,y+110,Math.min(a[1],b2[1])-10,Math.max(a[1],b2[1])+10,COL.rail,null,0); };
  rail([D.x0,D.z1],[D.x1,D.z1]); rail([D.x0,D.z0],[D.x1,D.z0]); rail([D.x0,D.z0],[D.x0,D.z1]);
  rail([D.x1,STAIR.z1],[D.x1,D.z1]);
  /* 계단 : 바닥(xBot) → 데크(xTop) */
  const T=STAIR, n=T.steps, run=(T.xBot-T.xTop)/n;
  for(let i=0;i<n;i++){ const x=T.xBot-(i+1)*run, yy=(i+1)*y/(n+1); box(x,x+run+20,yy-35,yy,T.z0+30,T.z1-30,COL.deck,top,0); }
  for(const z of [T.z0+20,T.z1-20]){ tube([T.xBot,0,z],[T.xTop,y,z],30,C.ss,8); tube([T.xBot,900,z],[T.xTop,y+900,z],20,COL.rail,8); cylY(T.xBot,z,0,900,18,COL.rail,8); }
  /* 리프터 */
  const L2=LIFT;
  for(const dx of [-380,380]) box(L2.x+dx-40,L2.x+dx+40,0,y+1300,L2.z-40,L2.z+40,C.yellow);
  box(L2.x-420,L2.x+420,y+1260,y+1340,L2.z-60,L2.z+60,C.yellow);
  box(L2.x-330,L2.x+330,0,40,L2.z-400,L2.z+400,C.dark);
  plate(L2.x,1300,L2.z+44,300,C.yellow);
}
/* ── 파우치 충전기 SP303 (데크 아래 본체 · 전면 노즐/실링/커팅 · 배출 슈트 · 공포배출 컨베어 · 판넬) ── */
function sFiller(){
  const F=FIL, gd=VIEW3.guard;
  /* 하부 캐비닛 · 프레임 */
  box(F.x0,F.x1,60,1050,F.z0,F.z1-120,C.cab,C.cabD);
  for(const x of [F.x0+20,F.x1-20]) for(const z of [F.z0+20,F.z1-140]) foot(x,z,60);
  box(F.x0,F.x1,1050,F.yTop,F.z0,F.z0+180,C.cab);          /* 뒤 구동부 칼럼 */
  box(F.x0,F.x0+120,1050,F.yTop,F.z0,F.z1-120,C.cab); box(F.x1-120,F.x1,1050,F.yTop,F.z0,F.z1-120,C.cab);
  box(F.x0,F.x1,F.yTop-120,F.yTop,F.z0,F.z1,C.cabD);          /* 상부 보 (데크 밑) */
  /* 노즐 10열 · 깔때기 */
  for(let i=0;i<NOZ.n;i++){ const x=NOZ.x0+i*NOZ.dx+(FIL.xc-(NOZ.x0+4.5*NOZ.dx));
    tube([x,F.yTop-120,NOZ.z-60],[x,NOZ.y,NOZ.z],13,C.ssL,10); mPush(); mT(x,NOZ.y,NOZ.z); lathe([[0,0],[26,0],[14,-60],[9,-130]],C.ssL,12); mPop(); }
  /* 성형관 · 세로실바 · 가로실바 · 커터 (전면) */
  box(F.xc-380,F.xc+380,1500,1720,NOZ.z-70,NOZ.z+30,C.ssD);
  box(F.xc-400,F.xc+400,1180,1300,NOZ.z-80,NOZ.z+40,C.ssD);
  box(F.xc-360,F.xc+360,1080,1150,NOZ.z-60,NOZ.z+20,C.dark);
  /* 투명 안전도어 (인터락) */
  if(gd&&S&&S.f.door==="closed") glassBox(F.xc-520,F.xc+520,1000,F.yTop-130,F.z1-110,F.z1+10,C.acryl,0.15);
  box(F.xc-540,F.xc+540,F.yTop-150,F.yTop-130,F.z1-110,F.z1+15,C.ssL,null,0);
  /* 표지 */
  plate(F.xc-300,F.yTop-200,F.z1+16,260,C.yellow);
  plate(F.xc+300,F.yTop-200,F.z1+16,260,C.red);
  /* 배출 슈트 (각도 조절) */
  box(F.xc-420,F.xc+420,1000,1030,NOZ.z,CV.z-60,C.ssL,null,0);
  /* 메인 파워 스위치 (본체 왼쪽 옆) */
  box(F.x0-12,F.x0,1150,1350,F.z1-200,F.z1-60,C.yellow,C.yellow); cylX(F.x0-30,F.x0-12,1250,F.z1-130,30,C.red,12);
  /* 공포배출 컨베어 (앞쪽 좌로) · 배출함 */
  box(F.x0-700,F.x0+300,CV.y-40,CV.y,CV.z+250,CV.z+410,C.dark,COL.beltG,0);
  legsBox(F.x0-680,F.x0+280,CV.z+260,CV.z+400,CV.y-40);
  box(F.x0-1000,F.x0-720,0,600,CV.z+180,CV.z+480,[0.30,0.52,0.82,0.1],[0.36,0.58,0.88,0.1]);
  /* 컨트롤 판넬 (받침대) */
  const P=PANEL_F;
  box(P.x-60,P.x+60,0,1100,P.z-60,P.z+60,C.ss);
  box(P.x-330,P.x+330,1100,1900,P.z-70,P.z+70,C.cab,C.cabD);
  screen(P.x,1620,P.z+70,520,330,"+z",E.scrDim);
  pushBtn(P.x-220,1270,P.z+70,[0.25,0.55,0.90,0.2]); pushBtn(P.x-80,1270,P.z+70,C.red); pushBtn(P.x+60,1270,P.z+70,C.dark);
  pushBtn(P.x-220,1160,P.z+70,C.yellow); pushBtn(P.x-80,1160,P.z+70,C.dark,18); pushBtn(P.x+60,1160,P.z+70,C.green);
  emgBtn(P.x+210,1220,P.z+70);
  box(P.x+300,P.x+330,1700,1760,P.z-20,P.z+20,C.red);
}
/* ── 데크 위 호퍼 3기(앞→뒤) · 도징박스 · 셔터 실린더 · 충전량 조절 다이얼 · 진공이송기 · 집진 ── */
function sHoppers(){
  const y=DECK.y;
  box(FIL.x0+60,FIL.x1-60,y,y+300,FIL.z0+60,FIL.z1-40,C.ssD);             /* 도징박스 베이스 (본체 상부) */
  for(const h of HOP){
    const x=h.x, z=h.z;
    box(x-200,x+200,y+300,y+460,z-170,z+170,C.ss);                         /* 도징박스 */
    const R=h.vac?185:230, H=h.vac?620:760;
    mPush(); mT(x,y+460,z); lathe([[100,0],[R,260],[R,H],[R-25,H+20],[0,H+20]],C.ssL,20); mPop();
    tube([x+200,y+380,z],[x+330,y+380,z],22,C.cyl,10); tube([x+330,y+380,z],[x+420,y+380,z],8,C.rodC,8);   /* 셔터 실린더 */
    box(x-R-4,x-R,y+560,y+640,z-50,z+50,C.white,C.white,0);                 /* 번호판 */
    if(h.vac){ cylY(x,z,y+480+H,y+480+H+380,150,C.ssL,18); mPush(); mT(x,y+860+H,z); lathe([[150,0],[100,110],[30,170],[0,180]],C.ssL,16); mPop();
      box(x-50,x+50,y+600+H,y+700+H,z+150,z+175,C.dark); }
  }
  /* 충전량 조절 다이얼 10열 : 첨가제(아래) · 주성분(위) 전면 / 백당 후면 */
  const dialRow=(zz,dz,yy)=>{ box(FIL.xc-330,FIL.xc+330,yy-55,yy+55,zz,zz+dz*18,C.ssD,null,0); for(let i=0;i<10;i++) cylZ(FIL.xc-288+i*64,yy,zz+dz*18,zz+dz*46,18,COL.dial,12); };
  dialRow(FIL.z1-40,1,y+120); dialRow(FIL.z1-40,1,y+235); dialRow(FIL.z0+60,-1,y+150);
  /* 집진 배관 · 밸브 (데크 오른쪽 뒤) */
  tube([FIL.x1+250,y,-1500],[FIL.x1+250,y+1500,-1500],60,C.ssL,12); box(FIL.x1+190,FIL.x1+310,y+800,y+900,-1560,-1440,C.blue);
}
/* ── 1층 뒤편 : IBC · 이송 호스 · 은박 롤 거치대 · 프린터 · 비전 · 압축공기 밸브 ── */
function sBack(){
  for(const b of IBC){
    const x=b.x, z=b.z;
    box(x-560,x+560,0,140,z-480,z+480,[0.30,0.33,0.36,0.3]);
    box(x-520,x+520,140,1240,z-440,z+440,COL.ibc,COL.ibc);
    for(let i=0;i<=4;i++){ const yy=140+i*275; box(x-540,x+540,yy-10,yy+10,z-460,z+460,COL.cage,null,0); }
    cylY(x,z,1240,1330,140,C.dark,16);
    const h=HOP.find(q=>q.k===b.k), top=[h.x+150,DECK.y+1260,h.z];
    tubePath([[x,1330,z],[x,DECK.y-300,z],[h.x+700,DECK.y-200,z+300],[h.x+700,DECK.y+900,h.z],top],30,[0.82,0.85,0.88,0.3],8);
  }
  /* 은박 롤 거치대 */
  const R=ROLL;
  box(R.x-500,R.x+500,0,80,R.z-300,R.z+300,C.ss); legsBox(R.x-460,R.x+460,R.z-260,R.z+260,R.y-150);
  cylX(R.x-470,R.x+470,R.y,R.z,30,C.ssD,10);
  /* 후면 프린터 · 비전 (본체 뒤) */
  box(FIL.xc-260,FIL.xc+260,1350,1650,FIL.z0-180,FIL.z0,C.dark);
  box(FIL.xc-200,FIL.xc+200,1700,1950,FIL.z0-240,FIL.z0,[0.20,0.22,0.25,0.3]); box(FIL.xc-160,FIL.xc+160,1740,1910,FIL.z0-246,FIL.z0-240,E.ledR,E.ledR,0);
  /* 롤러 · 필름 경로 (후면) */
  for(const yy of [1250,1500,1850]) cylX(FIL.xc-420,FIL.xc+420,yy,FIL.z0-60,40,C.ssL,12);
  /* 압축공기 밸브 2 · 레귤레이터 */
  box(-7350,-7250,600,1700,-1300,-1200,C.ss);
  for(const yy of [1250,1450]){ cylX(-7400,-7200,yy,-1180,20,C.ssD,10); box(-7330,-7270,yy-40,yy+40,-1170,-1130,C.blue); }
  cylZ(-7300,1600,-1200,-1120,50,C.ssL,14); box(-7330,-7270,1560,1640,-1120,-1110,C.white,C.white,0);
}
/* ── 정렬컨베어 (충전기 전면 → 경사 → 벽 통과 → 스틱공급장치) ── */
function sConveyor(){
  const P=PPATH.P, hw=170;
  for(let i=0;i<P.length-1;i++){
    const a=P[i], b=P[i+1], dx=b[0]-a[0], dz=b[2]-a[2], L=Math.hypot(dx,dz)||1, nx=-dz/L, nz=dx/L;
    const q=(p,s,h)=>[p[0]+nx*s*hw,p[1]+h,p[2]+nz*s*hw];
    quad(q(a,-1,-2),q(b,-1,-2),q(b,1,-2),q(a,1,-2),COL.beltG);
    for(const s of [-1,1]){ ribbon([q(a,s,-60),q(b,s,-60)],[q(a,s*1.15,40),q(b,s*1.15,40)],C.ssL); }
    quad(q(a,-1,-62),q(a,1,-62),q(b,1,-62),q(b,-1,-62),C.ss);
    const n=Math.max(1,Math.floor(Math.hypot(dx,b[1]-a[1],dz)/1300));
    for(let j=0;j<=n;j++){ const u=j/n, x=lerp(a[0],b[0],u), y=lerp(a[1],b[1],u), z=lerp(a[2],b[2],u);
      if(Math.abs(x-ROOM.wall)<300) continue; cylY(x,z+(nz?0:0),0,y-62,24,C.ss,8); cylY(x,z,0,20,44,C.dark,10); }
  }
}
/* ── 스틱공급장치 ── */
function sFeeder(){
  const F=FEED, y=PK.y;
  box(F.x0,F.x1,60,1150,F.z0,F.z1,C.cab,C.cabD); for(const x of [F.x0+30,F.x1-30]) for(const z of [F.z0+30,F.z1-30]) foot(x,z,60);
  box(F.x0+80,F.x1-80,1150,1700,F.z0+60,F.z1-60,[0.86,0.88,0.90,0.45]);
  if(VIEW3.guard) glassBox(F.x0+60,F.x1-60,1150,1900,F.z0+40,F.z1-40,C.acryl,0.12);
  plate((F.x0+F.x1)/2,1800,F.z1-38,500,C.blue);
  /* 판넬 (PanelView Plus) · 버튼 */
  box(F.x0-60,F.x0+330,1150,1650,F.z1-10,F.z1+60,C.ssL);
  screen(F.x0+120,1460,F.z1+60,260,170,"+z",E.scrDim);
  pushBtn(F.x0+290,1550,F.z1+60,C.white,16); pushBtn(F.x0+290,1470,F.z1+60,C.dark,16); pushBtn(F.x0+290,1390,F.z1+60,C.blue,16); emgBtn(F.x0+290,1270,F.z1+60);
  /* 정렬컨베어 가동스위치 */
  box(F.x0+380,F.x0+520,1050,1210,F.z1+0,F.z1+50,C.dark); cylZ(F.x0+450,1130,F.z1+50,F.z1+80,30,C.yellow,12);
  /* 카토너로 가는 픽업부 */
  box(F.x1-80,CT.x0+60,1050,1150,-200,200,C.ssD);
}
/* ── 파우치 카토너 HC 100L ── */
function sCartoner(){
  const T=CT, y=PK.y;
  box(T.x0,T.x1,60,y-20,T.z0,T.z1,C.cab,C.cabD); for(const x of [T.x0+40,T.x1-40,(T.x0+T.x1)/2]) for(const z of [T.z0+40,T.z1-40]) foot(x,z,60);
  box(T.x0,T.x1,y-20,y+30,T.z0,T.z1,C.ssL);
  /* 상부 프레임 · 가드 */
  for(const x of [T.x0+30,T.x1-30,(T.x0+T.x1)/2]) for(const z of [T.z0+30,T.z1-30]) box(x-25,x+25,y+30,1950,z-25,z+25,C.ssL);
  box(T.x0,T.x1,1950,2000,T.z0,T.z1,C.ssL);
  if(VIEW3.guard) glassBox(T.x0+20,T.x1-20,y+40,1940,T.z1-40,T.z1-20,C.acryl,0.12);
  plate((T.x0+T.x1)/2,1890,T.z1-15,700,C.blue);
  /* 버킷 체인 · 성형부 · 푸셔 */
  box(T.x0+100,T.x1-500,y+30,y+110,-140,140,C.dark,C.dark);
  for(let x=T.x0+140;x<T.x1-520;x+=110) box(x,x+12,y+110,y+200,-140,140,C.ssD,null,0);
  box(T.x1-700,T.x1-200,y+30,y+420,-420,-150,C.ss);
  /* 카톤 매거진 (뒤쪽 경사) · 설명서 공급장치 */
  mPush(); mT(3700,y+260,T.z0+60); mRX(-0.45); box(-350,350,0,700,-240,0,[0.80,0.82,0.85,0.6]); for(const s of [-1,1]) box(s*360-10,s*360+10,0,720,-260,10,C.ssL,null,0); mPop();
  box(2300,2900,y+700,y+1000,T.z0+100,T.z0+400,C.ssL); box(2350,2850,y+1000,y+1250,T.z0+120,T.z0+380,[0.98,0.98,0.96,0.04],null,0);
  /* 컨트롤 판넬 (LS) */
  box(T.x1-420,T.x1-80,y+400,y+950,T.z1+10,T.z1+80,C.ssL);
  screen(T.x1-290,y+700,T.z1+80,240,180,"+z",E.scrDim);
  pushBtn(T.x1-130,y+820,T.z1+80,C.white,16); pushBtn(T.x1-130,y+740,T.z1+80,C.dark,16); pushBtn(T.x1-130,y+660,T.z1+80,C.blue,16); emgBtn(T.x1-130,y+520,T.z1+80);
  lampTower(T.x1-100,T.z0+80,2000);
  /* 불량품 배출부 */
  box(T.x1-60,T.x1+180,0,700,T.z1-80,T.z1+180,[0.86,0.90,0.94,0.2]); glassBox(T.x1-60,T.x1+180,700,820,T.z1-80,T.z1+180,C.acryl,0.25);
  /* 핫멜트 유닛 */
  box(HM.x-260,HM.x+260,0,900,HM.z-220,HM.z+220,COL.blueM,[0.26,0.42,0.70,0.25]);
  box(HM.x-120,HM.x+120,600,800,HM.z+220,HM.z+226,[0.70,0.74,0.80,0.3],null,0);
  tubePath([[HM.x,900,HM.z],[HM.x,1300,HM.z],[HM.x-300,1300,-500],[HM.x-300,y+300,-300]],22,C.dark,8);
}
/* ── 카톤 출구 컨베이어 ── */
function sOutConv(){
  const y=PK.y, hw=110;
  box(OUT.x0,OUT.x1,y-50,y-2,-hw,hw,C.ss,COL.belt,0);
  for(const s of [-1,1]) box(OUT.x0,OUT.x1,y-2,y+60,s*hw-6,s*hw+6,C.ssL,null,0);
  for(let x=OUT.x0+200;x<OUT.x1;x+=1300) legsBox(x,x,-80,80,y-50);
}
/* ── 케이스 잉크젯 프린터 + 비전 ── */
function sPrinter(){
  const x0=PR.x0, x1=PR.x1, xc=(x0+x1)/2, y=PK.y;
  box(x0,x1,60,y-60,-420,-120,[0.78,0.70,0.58,0.4]); box(x0+60,x1-60,350,650,-120,-112,E.scrDim,E.scrDim,0);
  foot(x0+40,-380,60); foot(x1-40,-380,60);
  box(xc-50,xc+50,y-60,1950,-380,-280,C.ss);
  screen(xc,1820,-260,420,280,"+z",E.scrDim);
  pushBtn(xc+260,1650,-240,C.green,16); pushBtn(xc+260,1580,-240,C.red,16); emgBtn(xc+260,1480,-240);
  lampTower(xc-260,-330,1950);
  /* 프린트 헤드 · 비전 카메라 · 상면 벨트 */
  box(xc-140,xc-40,y+20,y+160,-200,-110,C.dark); box(x1-150,x1-30,y+120,y+260,-220,-120,C.black);
  box(x0+40,x1-40,y+120,y+150,-60,60,C.belt); for(const xx of [x0+120,x1-120]) cylY(xx,-180,y+150,y+420,22,C.ssD,10);
  handWheel(xc,y+440,-180); handWheel(x0+80,y+100,180); handWheel(x0+180,y+100,180);
  /* 리젝터 함 */
  box(x1+20,x1+340,0,y-60,140,480,[0.86,0.90,0.94,0.2]); glassBox(x1+20,x1+340,y-60,y+100,140,480,C.acryl,0.25);
}
function handWheel(x,y,z){ cylY(x,z,y,y+30,52,C.dark,14); cylY(x,z,y+30,y+50,26,COL.dial,12); }
/* ── X-ray IX-EN ── */
function sXray(){
  const x0=XR.x0, x1=XR.x1, y=PK.y;
  box(x0,x1,60,y-60,-520,520,COL.ishida); foot(x0+40,-480,60); foot(x1-40,-480,60); foot(x0+40,480,60); foot(x1-40,480,60);
  box(x0+200,x1-200,y-60,1950,-520,520,COL.ishida,[0.96,0.96,0.97,0.3]);
  box(x0+190,x1-190,y-10,y+260,-130,130,[0.16,0.18,0.22,0.2]);
  for(const xx of [x0+190,x1-200]) for(let i=0;i<6;i++) box(xx,xx+10,y,y+240,-125+i*42,-92+i*42,[0.30,0.30,0.32,0.1],null,0);   /* 방호커튼 */
  screen((x0+x1)/2,1550,520,460,300,"+z",E.scrDim);
  box((x0+x1)/2+260,(x0+x1)/2+360,1300,1360,520,560,C.dark); cylZ((x0+x1)/2+310,1330,560,580,18,C.ssL,10);
  emgBtn((x0+x1)/2-330,1330,520);
  box((x0+x1)/2-120,(x0+x1)/2+120,1850,1900,520,530,E.ledR,E.ledR,0);
  lampTower(x1-260,-420,1950);
  plate((x0+x1)/2,1780,522,300,C.yellow);
}
/* ── 중량선별기 (SSV) · 배출함 ── */
function sCW(){
  const x0=CW.x0, x1=CW.x1, xc=(x0+x1)/2, y=PK.y;
  legsBox(x0+40,x1-40,-220,220,y-60);
  box(x0,x1,y-60,y-10,-200,200,C.ssL); box(x0+60,x1-60,y-10,y,-180,180,C.belt,C.belt,0);
  box(xc-200,xc+200,y,1750,-420,-250,C.ss);
  screen(xc,1500,-250,380,260,"+z",E.scrDim);
  pushBtn(xc-110,1300,-250,C.dark,16); pushBtn(xc,1300,-250,C.red,18); pushBtn(xc+110,1300,-250,C.green,18);
  box(xc+180,xc+250,1580,1680,-250,-230,C.yellow);
  /* 배출함 2 (뒤 X-ray · 앞 중량선별기) */
  for(const z of [BIN.zX,BIN.zW]){ box(BIN.x-220,BIN.x+220,0,y-120,z-200,z+200,[0.85,0.88,0.90,0.6]); box(BIN.x-200,BIN.x+200,y-150,y-120,z-180,z+180,[0.22,0.25,0.28,0.2],null,0); }
  plate(BIN.x,y-200,BIN.zX-202,300,C.yellow); plate(BIN.x,y-200,BIN.zW+200,300,C.red);
}
/* ── 수동포장 작업대 · 중 케이스 잉크젯 프린터 ── */
function sPack(){
  const P=PACK, y=PK.y-40;
  box(P.x0,P.x1,y-40,y,P.z0,P.z1,C.ssL); legsBox(P.x0+40,P.x1-40,P.z0+40,P.z1-40,y-40);
  box(P.x0+60,P.x1-60,120,160,P.z0+60,P.z1-60,C.ss,null,0);
  /* 중 케이스 프린터 (Cx-PH Std) */
  box(P.x1+150,P.x1+550,0,700,-650,-300,C.ss); screen(P.x1+350,1250,-470,320,220,"+z",E.scrDim);
  box(P.x1+250,P.x1+450,700,1050,-560,-380,C.ssD);
}
