/* ═══════════════════════════════════════════════════════════════════
   3D 형상 — 정적(설비 골격 · 한 번만 생성) / 동적(움직이는 부품 · 병 · 정제 · 작업자)
   ═══════════════════════════════════════════════════════════════════ */
const VIEW3={guard:true,label:true};
const BD=()=>S.rc.bottle;                    /* 현재 병 규격 */

/* ── 공용 부품 ── */
function foot(x,z,top){ cylY(x,z,0,14,30,C.rubber,12); cylY(x,z,14,top||110,11,C.ss,10); }
function cabinet(x0,x1,y0,y1,z0,z1,o){
  o=o||{};
  box(x0,x1,y0,y1,z0,z1,o.col||C.cab,o.top||C.ssL);
  for(const x of [x0+45,x1-45]) for(const z of [z0+45,z1-45]) foot(x,z,y0);
  box(x0+6,x1-6,y0-18,y0,z0+6,z1-6,C.ssD,C.ssD,0);            /* 걸레받이 */
  if(o.doors) doorsZ(x0,x1,y0+20,y1-20,o.front===undefined?z1:o.front,o.doors,o.dir||1);
}
/* +z(또는 −z) 면에 문짝 : 틈 · 손잡이 · 경첩 */
function doorsZ(x0,x1,y0,y1,z,n,dir){
  const w=(x1-x0)/n, zz=z+dir*1.2;
  for(let i=0;i<=n;i++){ const x=x0+i*w; box(x-1.5,x+1.5,y0,y1,zz-1,zz+1,C.dark,C.dark,0); }
  box(x0,x1,y0-1.5,y0+1.5,zz-1,zz+1,C.dark,C.dark,0); box(x0,x1,y1-1.5,y1+1.5,zz-1,zz+1,C.dark,C.dark,0);
  for(let i=0;i<n;i++){
    const hx=x0+i*w+(i%2?18:w-18);
    box(hx-5,hx+5,(y0+y1)/2-40,(y0+y1)/2+40,zz,zz+dir*9,C.brushed,C.brushed,0);
    for(const hy of [y0+60,y1-60]){ const gx=x0+i*w+(i%2?w-8:8); cylY(gx,zz+dir*3,hy-25,hy+25,4,C.ssD,8); }
  }
}
function doorsX(z0,z1,y0,y1,x,n,dir){
  const w=(z1-z0)/n, xx=x+dir*1.2;
  for(let i=0;i<=n;i++){ const z=z0+i*w; box(xx-1,xx+1,y0,y1,z-1.5,z+1.5,C.dark,C.dark,0); }
  for(let i=0;i<n;i++){ const hz=z0+i*w+w-18; box(xx,xx+dir*9,(y0+y1)/2-40,(y0+y1)/2+40,hz-5,hz+5,C.brushed,C.brushed,0); }
}
function namePlate(x,y,z,w,col){ box(x-w/2,x+w/2,y-16,y+16,z,z+2,col||C.blue,col||C.blue,0); box(x-w/2+8,x+w/2-8,y-6,y+6,z+2,z+2.6,C.white,C.white,0); }
/* 공압 실린더 몸체 (a→b) + 로드 끝 */
function airCyl(a,b,r){ tube(a,b,r,C.cyl,12,true); tube(a,[a[0]+(b[0]-a[0])*0.08,a[1]+(b[1]-a[1])*0.08,a[2]+(b[2]-a[2])*0.08],r+2.5,C.ssD,12,true);
  tube(b,[b[0]-(b[0]-a[0])*0.08,b[1]-(b[1]-a[1])*0.08,b[2]-(b[2]-a[2])*0.08],r+2.5,C.ssD,12,true); }
function hmiStand(x,y0,y1,z,zPanel){
  cylY(x,z,y0,y1,22,C.ss,12);
  box(x-18,x+18,y1-18,y1+18,z,zPanel-10,C.ss);
}
/* HMI 화면 (동적 : 전원에 따라 켜짐) */
function hmiFace(x,y,z,w,h,on,tilt){
  mPush(); mT(x,y,z); mRX(-(tilt===undefined?0.2:tilt));
  box(-w/2,w/2,-h/2,h/2,-36,0,C.hmi,C.hmi);
  box(-w/2+12,w/2-12,-h/2+12,h/2-12,0,1.6,on?E.scr:E.scrDim,on?E.scr:E.scrDim,0);
  if(on){ box(-w/2+18,-w/2+18+w*0.3,h/2-34,h/2-22,1.6,2.2,[0.95,0.97,1,-1],null,0);
    for(let i=0;i<3;i++) box(-w/2+20+i*(w-40)/3,-w/2+14+(i+1)*(w-40)/3,-h/2+18,-h/2+40,1.6,2.2,[0.20,0.45,0.82,-1],null,0); }
  mPop();
}
function lampPole(x,z,y0,y1){ cylY(x,z,y0,y1,11,C.ss,10); cylY(x,z,y1,y1+8,24,C.dark,14); }
function lampLights(x,z,y,st){  /* st : "run" | "alarm" | "warn" | "off" */
  const blink=Math.floor(tSim*3)%2===0;
  const g=st==="run"?E.ledG:OFF.g, yy=(st==="warn"||(st==="alarm"&&!blink))?E.ledY:OFF.y, r=(st==="alarm"&&blink)?E.ledR:OFF.r;
  cylY(x,z,y,y+34,21,g,14); cylY(x,z,y+36,y+70,21,yy,14); cylY(x,z,y+72,y+106,21,r,14); cylY(x,z,y+108,y+118,21,C.dark,14);
}
/* 가드 : 반투명 판 + 알루미늄 프레임 */
function guardPanel(x0,x1,y0,y1,z0,z1){
  if(!VIEW3.guard) return;
  glassBox(x0,x1,y0,y1,z0,z1,C.acryl,0.14);
}
/* 아크릴 판 (구멍 1개 : 컨베이어 · 엘리베이터 통과) — Z 면 · X 면 · Y 면 */
function panelZ(x0,x1,y0,y1,z,h){
  const G=(a,b,c,d)=>{ if(b-a>2&&d-c>2) glassBox(a,b,c,d,z-2,z+2,C.acryl,0.13); };
  if(!h){ G(x0,x1,y0,y1); return; }
  const [hx0,hx1,hy0,hy1]=h, a=Math.max(x0,hx0), b=Math.min(x1,hx1);
  G(x0,Math.min(x1,hx0),y0,y1); G(Math.max(x0,hx1),x1,y0,y1); G(a,b,y0,Math.min(y1,hy0)); G(a,b,Math.max(y0,hy1),y1);
}
function panelX(z0,z1,y0,y1,x,h){
  const G=(a,b,c,d)=>{ if(b-a>2&&d-c>2) glassBox(x-2,x+2,c,d,a,b,C.acryl,0.13); };
  if(!h){ G(z0,z1,y0,y1); return; }
  const [hz0,hz1,hy0,hy1]=h, a=Math.max(z0,hz0), b=Math.min(z1,hz1);
  G(z0,Math.min(z1,hz0),y0,y1); G(Math.max(z0,hz1),z1,y0,y1); G(a,b,y0,Math.min(y1,hy0)); G(a,b,Math.max(y0,hy1),y1);
}
function panelY(x0,x1,z0,z1,y,h){
  const G=(a,b,c,d)=>{ if(b-a>2&&d-c>2) glassBox(a,b,y-2,y+2,c,d,C.acryl,0.13); };
  if(!h){ G(x0,x1,z0,z1); return; }
  const [hx0,hx1,hz0,hz1]=h, a=Math.max(x0,hx0), b=Math.min(x1,hx1);
  G(x0,Math.min(x1,hx0),z0,z1); G(Math.max(x0,hx1),x1,z0,z1); G(a,b,z0,Math.min(z1,hz0)); G(a,b,Math.max(z0,hz1),z1);
}
/* 알루미늄 프로파일 프레임 + 아크릴 도어 (카운텍 상부 가드 형식)
   o.mx : 중간 기둥 x · o.fskip/bskip : 판을 생략할 칸 · o.hole : {f0,b0,t0,l,r} 구멍 · o.top:false 윗판 생략 */
function alFrame(x0,x1,y0,y1,z0,z1,o){
  o=o||{}; const p=20, col=C.alu, xs=[x0,...(o.mx||[]),x1], H=o.hole||{};
  for(const x of xs) for(const z of [z0,z1]) box(x-p,x+p,y0,y1,z-p,z+p,col,col,4);
  for(const z of [z0,z1]) for(const y of [y0+p,y1-p]) box(x0-p,x1+p,y-p,y+p,z-p,z+p,col,col,4);
  for(const x of xs) for(const y of [y0+p,y1-p]) box(x-p,x+p,y-p,y+p,z0,z1,col,col,4);
  if(!VIEW3.guard) return;
  for(let i=0;i<xs.length-1;i++){
    const a=xs[i]+p, c=xs[i+1]-p;
    if(!(o.fskip||[]).includes(i)){
      panelZ(a,c,y0+2*p,y1-2*p,z1,H["f"+i]);
      const hx=c-34, hy=y0+(y1-y0)*0.45;                              /* 도어 손잡이 · 경첩 */
      box(hx-7,hx+7,hy-80,hy+80,z1+p,z1+p+16,C.dark,C.dark,0);
      for(const hy2 of [y0+120,y1-120]) box(a+4,a+22,hy2-30,hy2+30,z1+p,z1+p+6,C.ssD,C.ssD,0);
    }
    if(!(o.bskip||[]).includes(i)) panelZ(a,c,y0+2*p,y1-2*p,z0,H["b"+i]);
    if(o.top!==false) panelY(a,c,z0+p,z1-p,y1-p,H["t"+i]);
  }
  panelX(z0+p,z1-p,y0+2*p,y1-2*p,x0,H.l);
  panelX(z0+p,z1-p,y0+2*p,y1-2*p,x1,H.r);
}
/* 카운텍 조작 패널 : 스테인리스 하우징 + 화면(동적 hmiFace) + 버튼 줄 + 비상정지. z = 하우징 앞면 (+z 를 본다) */
function cntHMI(x,y,z,w,h){
  const hw=w/2+22, yb=y-h/2-96, yt=y+h/2+22;
  box(x-hw,x+hw,yb,yt,z-60,z,C.ssL,C.ssL);
  box(x-hw+8,x+hw-8,yb+10,yb+80,z,z+1.5,C.dark,C.dark,0);
  const by=yb+45, cols=[C.green,C.red,C.white,C.yellow], n=Math.max(2,Math.min(4,Math.floor((2*hw-96)/34)));
  for(let i=0;i<n;i++){ const bx=x-hw+30+i*34; cylZ(bx,by,z,z+12,11,cols[i],14); box(bx-11,bx+11,by+17,by+21,z+1.5,z+2.2,C.white,C.white,0); }
  const ex=x+hw-40;
  box(ex-25,ex+25,by-25,by+25,z,z+12,C.yellow,C.yellow); cylZ(ex,by,z+12,z+20,10,C.dark,12); cylZ(ex,by,z+20,z+34,22,C.red,18);
  box(x-hw+14,x-hw+80,yt-16,yt-8,z,z+1.5,C.blue,C.blue,0);          /* COUNTEC 표기 */
}
/* 핸드휠 (+z 를 본다) */
function handWheel(x,y,z,R){
  R=R||80; const pts=[];
  for(let i=0;i<=28;i++){ const a=i/28*Math.PI*2; pts.push([x+R*Math.cos(a),y+R*Math.sin(a),z+34]); }
  tubePath(pts,7,C.ssL,8);
  cylZ(x,y,z,z+40,18,C.ss,14);
  for(let i=0;i<3;i++){ const a=i*2*Math.PI/3+0.4; tube([x,y,z+34],[x+R*Math.cos(a),y+R*Math.sin(a),z+34],5,C.ssL,8); }
  cylZ(x+R*Math.cos(0.4),y+R*Math.sin(0.4),z+34,z+86,9,C.dark,10);
}
/* 컨베이어 베드 스커트 (설비 구간의 새니터리 프레임) + 다리 */
function convBed(x0,x1){
  for(const s of [-1,1]) box(x0,x1,CH-150,CH-62,s*60,s*72,C.ssL);
  for(const x of [x0+50,x1-50]) for(const z of [-46,46]){ foot(x,z,40); cylY(x,z,40,CH-150,16,C.ss,10); }
  for(const x of [x0+50,x1-50]) box(x-10,x+10,300,318,-46,46,C.ss);
}
/* ── 설비 외곽 · 조작 패널 · 경광등 위치 (정적 · 동적 공용) ── */
const UAB={x0:-5050,x1:-3230,z0:-800,z1:400,yT:1800,col0:-4180,col1:-4020};
const DMCB={x0:-1460,x1:-150};
const PEB={x0:1040,x1:1820,z0:-760,z1:220,yT:1780};
const RCB={x0:1900,x1:3650,z0:-1000,z1:220,yT:2150};
const RCBOWL={x:2250,y:1650,z:-520};
const CAPHOP={x0:1970,x1:2250,z0:-60,z1:190,y0:1880,y1:2090};   /* 캡 호퍼 (앞 위) */
const CAP_PICK=130;                                  /* 헤드가 캡을 집는 터렛 각 (°) */
/* HMI : [x, y, 앞면 z, 화면 w, 화면 h] · 경광등 : [x, z, 등 아래 y] */
const HMIS={ua:[-4100,1570,480,170,120], sg:[L.sg+185,1720,195,150,112], dmc:[-300,1660,-120,240,170], pe:[PEB.x1-150,1560,PEB.z1+62,200,140], rc:[2560,1580,RCB.z1+62,240,170]};
const LAMPS={ua:[-4100,UAB.z1-60,UAB.yT+68], sg:[L.sg+230,-150,1958], dmc:[-300,-150,1878], pe:[PEB.x1-40,PEB.z1-40,PEB.yT+68], rc:[2560,RCB.z1-30,RCB.yT+68]};

/* ═══ 정적 형상 ═══ */
let STATIC_KEY="";
function staticKey(){ const b=BD(); return [b.ml,VIEW3.guard?1:0].join("|"); }
function buildStatic(){
  STATIC_KEY=staticKey();
  geoBegin(GEO.stat);
  sConveyor(); sUA(); sSG(); sLoadCell(L.lc1,1); sDMC(); sLoadCell(L.lc2,2); sReject(); sWCPanel(); sPE(); sRCS(); sTable(); sDust();
  R3.statDirty=true;
  geoBegin(GEO.dyn);
}

/* ── 컨베이어 (슬랫 체인 · 가이드 레일) ── */
function sConveyor(){
  const b=BD(), w=44;
  const gaps=[[L.lc1-L.lcW/2-4,L.lc1+L.lcW/2+4],[L.lc2-L.lcW/2-4,L.lc2+L.lcW/2+4]];
  let a=XS;
  const run=(x0,x1)=>{
    box(x0,x1,CH-10,CH,-w,w,C.slat,C.slat,0);
    box(x0,x1,CH-66,CH+5,-w-16,-w,C.ss); box(x0,x1,CH-66,CH+5,w,w+16,C.ss);
    box(x0,x1,CH-96,CH-66,-w+4,w-4,C.ssD);
  };
  for(const g of gaps){ run(a,g[0]); a=g[1]; }
  run(a,XE);
  /* 다리 (설비 몸체와 겹치지 않는 구간) */
  for(let x=XS+900;x<XE;x+=1150){
    if(x>UAB.x0-80&&x<UAB.x1+80) continue;
    if(Math.abs(x-L.sg)<560) continue;
    if(x>DMCB.x0-80&&x<DMCB.x1+80) continue;
    if(x>PEB.x0-80&&x<RCB.x1+80) continue;
    for(const z of [-w+6,w-6]) { foot(x,z,40); cylY(x,z,40,CH-96,14,C.ss,10); }
    box(x-10,x+10,300,318,-w+6,w-6,C.ss);
  }
  /* 가이드 레일 : 병 지름 + 10 간격, 2단 */
  const zr=b.d/2+5, y1=CH+Math.max(16,b.h*0.28), y2=CH+b.h*0.70;
  const rail=(x0,x1,side)=>{
    if(x1-x0<30) return;
    const z=side*zr;
    for(const y of [y1,y2]) cylX(x0,x1,y,z,5,C.guide,10);
    for(let x=x0+60;x<x1-30;x+=430){
      box(x-8,x+8,CH+5,y2+10,side*(w+10),side*(w+22),C.ss);
      for(const y of [y1,y2]) box(x-6,x+6,y-6,y+6,side*zr,side*(w+10),C.ss,C.ss,0);
    }
  };
  const segs=[[XS+60,L.belt0-20],[L.belt1+20,L.screw0]];
  const cutsBack=[[L.sg-70,L.sg+b.d+30],[L.n1-b.d-50,L.n2+b.d/2+40],[L.rej-70,L.rej+70],[L.pe-70,L.pe+b.d+30],[L.lc1-40,L.lc1+b.d/2+30],[L.lc2-40,L.lc2+b.d/2+30]];
  const cutsFront=[[L.rej-55,L.rej+55]];
  const cut=(segs,cuts)=>{ let out=segs.slice();
    for(const c of cuts){ const nx=[]; for(const [p,q] of out){ if(c[1]<=p||c[0]>=q){nx.push([p,q]);continue;} if(c[0]>p) nx.push([p,c[0]]); if(c[1]<q) nx.push([c[1],q]); } out=nx; }
    return out; };
  for(const [p,q] of cut(segs,cutsBack)) rail(p,q,-1);
  for(const [p,q] of cut(segs,cutsFront)) rail(p,q,1);
  rail(L.screw0,L.A.x-20,-1);
  rail(L.B.x+20,XE-20,1); rail(L.B.x+20,XE-20,-1);
  /* 스타휠 · 터렛 바깥 가이드 (원호) */
  const arcRail=(c,a0,a1,rr)=>{ for(const y of [y1,y2]){ const pts=[]; for(let i=0;i<=24;i++){ const a=a0+(a1-a0)*i/24; pts.push([c.x+rr*Math.cos(a),y,c.z+rr*Math.sin(a)]); } tubePath(pts,5,C.guide,8); } };
  arcRail(L.A,Math.PI/2+0.12,PATH.aT+0.1,L.R+zr);
  arcRail(L.T,PATH.tA+0.35,PATH.tB-0.35,L.R+zr);
  arcRail(L.B,PATH.bT-0.1,Math.PI/2-0.12,L.R+zr);
}

/* ── UA-120 : 스테인리스 하부 캐비닛 + 알루미늄 프레임 아크릴 가드, 중앙 기둥에 HMI · 경광등 ── */
function sUA(){
  const b=BD(), tt=L.tt, U=UAB;
  cabinet(U.x0,U.x1,110,CH-100,U.z0,U.z1,{doors:4});
  box(U.x0,U.x1,CH-100,CH-86,U.z0,U.z1,C.ssL,C.ssL);                    /* 상판 */
  handWheel(U.x1-190,640,U.z1+1,70);                                       /* 사이드 벨트 높이 조정 */
  box(U.x0+110,U.x0+170,CH-260,CH-200,U.z1,U.z1+14,C.yellow,C.yellow); cylZ(U.x0+140,CH-230,U.z1+14,U.z1+30,14,C.red,14);  /* 비상정지 */
  /* 상부 가드 : 좌 · 우 2칸 + 중앙 기둥 칸 */
  alFrame(U.x0,U.x1,CH-86,U.yT,U.z0,U.z1,{mx:[U.col0,U.col1], fskip:[1],
    hole:{l:[-470,90,930,1400], r:[-100,100,CH-90,CH+b.h+70]}});
  /* 중앙 기둥 (스테인리스) : 조작 패널 · 경광등 */
  box(U.col0,U.col1,CH-86,U.yT,U.z1-150,U.z1+20,C.cab,C.ssL);
  const H=HMIS.ua; cntHMI(H[0],H[1],H[2],H[3],H[4]);
  lampPole(LAMPS.ua[0],LAMPS.ua[1],U.yT,U.yT+60);
  /* 레벨 디스크 소터 (턴테이블) 드럼 · 림 */
  cylY(tt.x,tt.z,CH-86,CH-14,tt.r+22,C.ss,48);
  mPush(); mT(tt.x,0,tt.z);
  const gap=(b.d/2+16)/tt.r;
  lathe([[tt.r+4,CH-14],[tt.r+4,CH+120],[tt.r+14,CH+120],[tt.r+14,CH-14]],C.ss,44,Math.PI/2+gap,Math.PI/2-gap+Math.PI*2);
  mPop();
  /* 출구 안내 가이드 (턴테이블 → 컨베이어) */
  for(const s of [-1,1]) box(tt.x-20,tt.x+90,CH+2,CH+b.h*0.6,s*(b.d/2+5),s*(b.d/2+11),C.guide,C.guide,0);
  /* 벌크 호퍼 (라인 왼쪽 끝) */
  const hp=L.hop;
  for(const x of [hp.x0+30,hp.x1-30]) for(const z of [hp.z0+30,hp.z1-30]) { foot(x,z,40); cylY(x,z,40,820,16,C.ss,10); }
  box(hp.x0,hp.x1,800,830,hp.z0,hp.z1,C.ss);
  box(hp.x0,hp.x0+4,830,1250,hp.z0,hp.z1,C.ss); box(hp.x1-4,hp.x1,830,1080,hp.z0,hp.z1,C.ss);
  box(hp.x0,hp.x1,830,1250,hp.z0,hp.z0+4,C.ss); box(hp.x0,hp.x1,830,1250,hp.z1-4,hp.z1,C.ss);
  quad([hp.x0+4,1100,hp.z0+4],[hp.x0+4,1100,hp.z1-4],[hp.x1-4,860,hp.z1-4],[hp.x1-4,860,hp.z0+4],C.ssD);
  cylY(hp.x0+60,hp.z0+10,1150,1200,14,C.dark,10);                        /* 레벨 센서 */
  /* 가변속 엘리베이터 (클리트 벨트) : 호퍼 → 디스크 소터 */
  const e0=[hp.x1-20,860,20], e1=[tt.x-150,CH+470,tt.z-80];
  mPush(); const len=mAlong(e0,e1);
  box(-120,-110,0,len,-50,40,C.ss); box(110,120,0,len,-50,40,C.ss); box(-110,110,0,len,-44,-36,C.slat,C.slat,0); box(-110,110,0,len,-70,-44,C.ss);
  cylZ(0,30,-38,60,26,C.ssD,14); cylZ(0,len-30,-38,60,26,C.ssD,14);
  mPop();
  cylY(e1[0],e1[2],CH-86,e1[1]-40,20,C.ss,10);
  /* 배출 슈트 */
  quad([e1[0]-70,e1[1]-20,e1[2]-70],[e1[0]+70,e1[1]-20,e1[2]-70],[tt.x-40,CH+140,tt.z+10],[tt.x-200,CH+140,tt.z+10],C.ss);
  /* 반전 사이드 벨트 : 풀리 하우징 · 폭 조정 브래킷 */
  const zb=b.d/2+8, ym=CH+b.h/2;
  for(const x of [L.belt0,L.belt1]) for(const s of [-1,1]){
    box(x-55,x+55,CH+6,CH+b.h+6,s*(zb+14),s*(zb+80),C.ss);
    cylY(x,s*(zb+6),CH+2,CH+b.h+10,10,C.ssD,12);
  }
  for(let x=L.belt0+200;x<L.belt1-100;x+=420) for(const s of [-1,1]){ box(x-12,x+12,CH-86,CH+b.h+40,s*(zb+90),s*(zb+110),C.ss); cylZ(x,CH+b.h+30,s*(zb+14),s*(zb+100),7,C.ssD,8); }
  /* 비틀림 벨트 지지 롤러 링 (병 축 둘레) */
  for(let x=L.inv0;x<=L.inv3;x+=150){
    mPush(); mT(x,ym,0); mRZ(Math.PI/2);
    lathe([[zb+30,-6],[zb+36,-6],[zb+36,6],[zb+30,6],[zb+30,-6]],C.alu,28);
    mPop();
  }
  /* 세척부 : 0.2 ㎛ 필터 이온 에어 노즐 · 진공 노즐 (병 입구 아래) */
  box(L.air[0]-110,L.vac[1]+110,CH-190,CH-40,-90,90,C.dark,C.dark);
  for(const x of L.air){ cylY(x,0,CH-40,CH-16,7,C.ss,10); cylY(x,0,CH-18,CH-10,4,C.brushed,8); box(x-26,x+26,CH-60,CH-40,-26,26,C.blue,C.blue,0); }
  for(const x of L.vac){ box(x-34,x+34,CH-44,CH-26,-30,30,C.black,C.black,0); box(x-26,x+26,CH-27,CH-24,-22,22,[0.05,0.05,0.06,0.1],null,0); }
  hoseTo([L.air[0],CH-150,-60],[-4200,CH-200,-420],[-4150,CH-250,-560],9,C.blue);
  hoseTo([L.vac[1],CH-150,-60],[-3700,CH-200,-420],[-3680,CH-300,-560],24,[0.62,0.66,0.70,0.2]);
  /* 이오나이저 · 필터 레귤레이터 */
  box(-4030,-3860,CH+b.h+120,CH+b.h+150,-60,60,C.dark); box(-4000,-3890,CH+b.h+115,CH+b.h+121,-40,40,E.ledB,null,0);
  box(-5000,-4900,560,760,U.z1,U.z1+40,C.dark); cylZ(-4950,720,U.z1+40,U.z1+50,26,C.white,20); cylY(-4950,U.z1+20,560,600,20,[0.75,0.82,0.9,0.1],14);
}
/* 호스 (3점 곡선) */
function hoseTo(a,m,e,r,col){ const pts=[]; for(let i=0;i<=10;i++){ const t=i/10,u=1-t; pts.push([u*u*a[0]+2*u*t*m[0]+t*t*e[0],u*u*a[1]+2*u*t*m[1]+t*t*e[1],u*u*a[2]+2*u*t*m[2]+t*t*e[2]]); } tubePath(pts,r,col,10); }

/* ── SG-120 : 기둥형 받침 캐비닛 · 컨베이어 베드, 뒤 기둥에 헤드 박스, 전면 좌측 원형 릴, 우측 HMI ── */
function sgHeadY(){ const b=BD(); return {y0:CH+b.h+130, y1:CH+b.h+320}; }
/* 릴 · 댄서 · 입구 롤러 위치 (정적 · 동적 공용) */
function insCfg(k){
  const H=sgHeadY();
  if(k==="sg"){ const x=L.sg; return {x, rx:x-470, ry:1640, rz:95, wd:34, r0:48, rF:170, dp:[x-330,1440,95], da:Math.PI, in:[x-300,H.y1+70], g:[x-60,H.y1+62]}; }
  const x=L.pe; return {x, rx:x, ry:1520, rz:0, wd:92, r0:52, rF:150, dp:[x+195,1360,0], da:Math.PI, in:[x+60,H.y1+70], g:null};
}
/* 투입 헤드 (HPE) : 뒤판 · 옆판 · 상하판 + 앞 투명창 */
function inserterHead(x,H,hw,hd){
  box(x-hw,x+hw,H.y0,H.y1,-hd,-hd+14,C.cab,C.ssL);
  box(x-hw,x-hw+10,H.y0,H.y1,-hd,hd,C.cab,C.ssL); box(x+hw-10,x+hw,H.y0,H.y1,-hd,hd,C.cab,C.ssL);
  box(x-hw,x+hw,H.y1-12,H.y1,-hd,hd,C.cab,C.ssL); box(x-hw,x+hw,H.y0,H.y0+12,-hd,hd,C.cab,C.ssL);
  glassBox(x-hw+10,x+hw-10,H.y0+12,H.y1-12,hd-3,hd,C.acryl,0.18);
}
function sSG(){
  const x=L.sg, b=BD(), H=sgHeadY(), I=insCfg("sg");
  /* 받침 캐비닛 · 컨베이어 베드 */
  cabinet(x-230,x+230,110,CH-150,-340,230,{doors:1,front:230});
  namePlate(x,CH-240,231,150);
  convBed(x-540,x+540);
  /* 뒤 기둥 */
  box(x-110,x+110,CH-150,1900,-450,-250,C.cab,C.ssL);
  /* 헤드 박스 : 앞면 창(피드 롤러 · 커터 · 플런저가 보인다) */
  const hx0=x-280, hx1=x+280, hy0=H.y0-40, hy1=1900, hz0=-250, hz1=150, t=14;
  const wx0=x-130, wx1=x+80, wy0=hy0+t, wy1=Math.min(H.y1+210,1590);
  box(hx0,hx1,hy0,hy1,hz0,hz0+t,C.cab,C.ssL);
  box(hx0,hx0+t,hy0,hy1,hz0,hz1,C.cab,C.ssL); box(hx1-t,hx1,hy0,hy1,hz0,hz1,C.cab,C.ssL);
  box(hx0,hx1,hy1-t,hy1,hz0,hz1,C.cab,C.ssL);
  box(hx0,x-34,hy0,hy0+t,hz0,hz1,C.cab); box(x+34,hx1,hy0,hy0+t,hz0,hz1,C.cab);
  box(x-34,x+34,hy0,hy0+t,hz0,-34,C.cab); box(x-34,x+34,hy0,hy0+t,34,hz1,C.cab);
  box(hx0,wx0,hy0,hy1,hz1-t,hz1,C.cab,C.ssL); box(wx1,hx1,hy0,hy1,hz1-t,hz1,C.cab,C.ssL);
  box(wx0,wx1,wy1,hy1,hz1-t,hz1,C.cab,C.ssL);
  glassBox(wx0,wx1,wy0,wy1,hz1-5,hz1-1,C.acryl,0.16);
  for(const [a,c,d,e] of [[wx0-4,wx1+4,wy0-4,wy0],[wx0-4,wx1+4,wy1,wy1+4],[wx0-4,wx0,wy0,wy1],[wx1,wx1+4,wy0,wy1]]) box(a,c,d,e,hz1,hz1+4,C.alu,C.alu,0);
  box(wx0+10,wx0+120,wy1+30,wy1+60,hz1,hz1+2,C.blue,C.blue,0);            /* 명판 */
  /* 릴 받침판 · 릴 축 · 댄서 축 · 입구 롤러 */
  box(x-620,hx0,1360,1690,-100,-78,C.cab,C.ssL);
  cylZ(I.rx,I.ry,-100,I.rz+I.wd/2+12,18,C.ss,14);
  cylZ(I.dp[0],I.dp[1],-100,I.rz-I.wd/2-8,10,C.ss,10);
  cylZ(I.in[0],I.in[1],-100,I.rz+I.wd/2+8,11,C.ssD,12);
  box(hx0-8,hx0,I.in[1]-14,I.in[1]+14,I.rz-I.wd/2-6,I.rz+I.wd/2+6,C.dark,C.dark,0);   /* 투입 슬롯 */
  cylZ(I.g[0],I.g[1],-60,60,9,C.ss,10);                                   /* 안쪽 가이드 롤러 */
  /* 가이드 튜브 (투명) · 플런저 실린더 · 마크 센서 */
  const tr=Math.max(9,b.nk/2-4);
  const g=gAlpha; gAlpha=0.28; tube([x,CH+b.h+16,0],[x,H.y0,0],tr+2,C.acryl,16,false); gAlpha=g;
  cylY(x,0,CH+b.h+12,CH+b.h+18,tr+5,C.ss,16);
  airCyl([x,H.y1,0],[x,H.y1+190,0],22);
  box(x+30,x+50,H.y1-110,H.y1-86,20,40,C.dark);
  box(x-60,x+60,H.y1-60,H.y1-20,-60,-40,C.ssD);                           /* 피드 롤러 브래킷 */
  /* 스토퍼 · 클램프 실린더 (후면) */
  airCyl([x+b.d/2+7,CH+b.h*0.42,-190],[x+b.d/2+7,CH+b.h*0.42,-78],11);
  airCyl([x-b.d/2-5-b.d/2,CH+b.h*0.42,-190],[x-b.d/2-5-b.d/2,CH+b.h*0.42,-78],11);
  const Hm=HMIS.sg; cntHMI(Hm[0],Hm[1],Hm[2],Hm[3],Hm[4]);
  lampPole(LAMPS.sg[0],LAMPS.sg[1],hy1,LAMPS.sg[2]-8);
}

/* ── 로드셀 (전단 1 · 후단 2) ── */
function sLoadCell(x,i){
  const b=BD(), w=L.lcW;
  box(x-w/2,x+w/2,CH-70,CH-8,-48,48,C.ss);
  cylZ(x-w/2+14,CH-22,-44,44,13,C.ssD,14); cylZ(x+w/2-14,CH-22,-44,44,13,C.ssD,14);
  box(x-110,x+110,CH-300,CH-70,-120,120,C.cab,C.ssL);
  box(x-60,x+60,CH-270,CH-100,120,122,C.blue,C.blue,0);
  foot(x-70,0,CH-300); foot(x+70,0,CH-300);
  /* 표시기 (앞) */
  cylY(x,190,CH-300,CH+300,14,C.ss,10);
  box(x-80,x+80,CH+320,CH+400,170,215,C.dark,C.dark);
  /* 스토퍼 실린더 */
  airCyl([x+b.d/2+5,CH+b.h*0.42,-200],[x+b.d/2+5,CH+b.h*0.42,-80],10);
  box(x+b.d/2-8,x+b.d/2+18,CH+5,CH+b.h*0.42+18,-210,-190,C.ss);
}

/* ── DMC-60T : 기둥형 받침 캐비닛 · 긴 컨베이어 베드, 헤드 박스(진동기) 위 3단 트레이 · 뒤 호퍼, 우측 폴 HMI ── */
function dmcGateY(){ return CH+BD().h+175; }
const DMC={x0:-956,x1:-644,tw:26,t3z0:-420,t3z1:-172,t3y:1452, t2:{x0:-1030,x1:-570,z0:-640,z1:-420,y:1498}, t1:{x0:-990,x1:-610,z0:-900,z1:-640,y:1540}};
function sDMC(){
  const b=BD(), yG=dmcGateY();
  /* 받침 캐비닛 (컨베이어 뒤 기둥) · 컨베이어 베드 */
  cabinet(-1110,-530,110,1150,-800,-150,{doors:1,front:-150});
  convBed(DMCB.x0,DMCB.x1);
  for(let x=DMCB.x0+140;x<DMCB.x1-100;x+=300) for(const s of [-1,1]) box(x-10,x+10,CH-150,CH-62,s*72,s*80,C.ssD,C.ssD,0);
  /* 헤드 박스 (진동기 · 구동부) */
  box(-1110,-530,1150,1440,-960,-150,C.cab,C.ssL);
  box(-1110,-530,1150,1170,-960,-150,C.ssD,C.ssD,0);
  for(let z=-900;z<-220;z+=42) box(-1112,-1110,1220,1380,z,z+22,C.dark,C.dark,0);   /* 옆 통풍구 */
  box(-960,-680,1190,1250,-150,-147,C.dark,C.dark,0); box(-950,-690,1212,1228,-147,-146,C.white,C.white,0);   /* COUNTEC 명판 */
  /* 트레이 벽 · 아크릴 덮개 */
  box(-1110,-1096,1440,1580,-960,-172,C.ss); box(-544,-530,1440,1580,-960,-172,C.ss); box(-1110,-530,1440,1580,-960,-946,C.ss);
  guardPanel(-1096,-544,1576,1582,-946,-172);
  guardPanel(-1096,-544,1440,1582,-176,-172);
  /* 호퍼 (뒤 · 위) */
  const hy0=1660, hy1=2040;
  const H0=[[-1110,hy1,-1080],[-490,hy1,-1080],[-490,hy1,-700],[-1110,hy1,-700]], H1=[[-900,hy0,-880],[-700,hy0,-880],[-700,hy0,-780],[-900,hy0,-780]];
  for(let i=0;i<4;i++){ const j=(i+1)%4; quad(H0[i],H0[j],H1[j],H1[i],C.ss); }
  for(let i=0;i<4;i++){ const j=(i+1)%4; tube(H0[i],H0[j],6,C.ssL,8); }
  for(const p of [[-1080,-1060],[-520,-1060],[-1080,-720],[-520,-720]]) cylY(p[0],p[1],1580,hy1,12,C.ss,8);
  box(-1110,-520,1580,1600,-1080,-940,C.ss);
  box(-900,-700,hy0-40,hy0,-880,-780,C.ssD);
  cylY(-490,-900,hy1-120,hy1-60,14,C.dark,10);                                    /* 레벨 센서 */
  const g=gAlpha; gAlpha=0.22; box(-1112,-488,hy1,hy1+6,-1082,-698,C.acryl,C.acryl,0); gAlpha=g;
  /* 트레이 1 · 2 (팬) */
  const pan=(t,wall)=>{ box(t.x0,t.x1,t.y-10,t.y,t.z0,t.z1,C.brushed,C.brushed,0);
    box(t.x0-4,t.x0,t.y,t.y+wall,t.z0,t.z1,C.ss,C.ss,0); box(t.x1,t.x1+4,t.y,t.y+wall,t.z0,t.z1,C.ss,C.ss,0); box(t.x0,t.x1,t.y,t.y+wall,t.z0-4,t.z0,C.ss,C.ss,0);
    box(t.x0+30,t.x1-30,Math.max(1440,t.y-110),t.y-10,t.z0+30,t.z1-30,C.dark); };
  pan(DMC.t1,34); pan(DMC.t2,28);
  for(let i=1;i<12;i++){ const x=DMC.x0+i*DMC.tw; box(x-1,x+1,DMC.t2.y,DMC.t2.y+12,DMC.t2.z1-90,DMC.t2.z1,C.ss,C.ss,0); }
  /* 트레이 3 : 12 트랙 (V 홈) */
  box(DMC.x0-6,DMC.x1+6,DMC.t3y-14,DMC.t3y-4,DMC.t3z0,DMC.t3z1,C.brushed,C.brushed,0);
  for(let i=0;i<12;i++){
    const x0=DMC.x0+i*DMC.tw, xc=x0+DMC.tw/2;
    const tc=[0.50,0.54,0.58,0.8];
    quad([x0+1,DMC.t3y+6,DMC.t3z0],[x0+1,DMC.t3y+6,DMC.t3z1],[xc,DMC.t3y-4,DMC.t3z1],[xc,DMC.t3y-4,DMC.t3z0],tc);
    quad([xc,DMC.t3y-4,DMC.t3z0],[xc,DMC.t3y-4,DMC.t3z1],[x0+DMC.tw-1,DMC.t3y+6,DMC.t3z1],[x0+DMC.tw-1,DMC.t3y+6,DMC.t3z0],tc);
    box(x0-1,x0+1,DMC.t3y,DMC.t3y+16,DMC.t3z0,DMC.t3z1,C.ssL,C.ssL,0);
  }
  box(DMC.x1-1,DMC.x1+1,DMC.t3y,DMC.t3y+16,DMC.t3z0,DMC.t3z1,C.ssL,C.ssL,0);
  /* 센서 블록 : 12 창 (헤드 앞으로 돌출) */
  box(-972,-628,1320,1446,-172,-84,[0.30,0.33,0.37,0.35],[0.36,0.39,0.43,0.35]);
  for(let i=0;i<12;i++){ const xc=DMC.x0+i*DMC.tw+DMC.tw/2; box(xc-9,xc+9,1360,1420,-84,-83,[0.04,0.05,0.06,0.2],null,0); }
  /* 깔때기 · 게이트 하우징 · 노즐 */
  for(const [nx,gx] of [[L.n1,-878],[L.n2,-722]]){
    tube([gx,1322,-128],[nx,yG+28,0],74,C.ss,20,false,22);
    glassBox(nx-40,nx+40,yG-34,yG+28,-40,40,C.acryl,0.26);
    for(const sx of [-40,40]) for(const sz of [-40,40]) box(nx+sx-3,nx+sx+3,yG-34,yG+28,sz-3,sz+3,C.ss,C.ss,0);
    box(nx-43,nx+43,yG+24,yG+30,-43,43,C.ss,C.ss,0);
    const nr=Math.min(15,b.nk/2-3);
    tube([nx,yG-34,0],[nx,CH+b.h+14,0],nr+3,C.ss,16,true,nr);
    airCyl([nx+44,yG-6,-4],[nx+44,yG-6,-110],7);
  }
  box(-930,-670,yG+28,1322,-150,-120,C.ss);
  /* 병 스토퍼 3조 (후면) */
  for(const px of [L.n2+b.d/2+4,L.n1+b.d/2+4,L.n1-b.d-6]){
    airCyl([px,CH+b.h*0.42,-200],[px,CH+b.h*0.42,-80],10);
    box(px-14,px+14,CH+5,CH+b.h*0.42+16,-212,-190,C.ss);
  }
  /* 집진 덕트 */
  hoseTo([-640,1400,-180],[-450,1250,-700],[-900,700,-1380],30,[0.62,0.66,0.70,0.2]);
  /* 폴 HMI · 경광등 (오른쪽) */
  const Hm=HMIS.dmc;
  foot(Hm[0],-300,40); cylY(Hm[0],-300,40,Hm[1]-40,26,C.ss,12);
  box(Hm[0]-24,Hm[0]+24,Hm[1]-70,Hm[1]-30,-300,Hm[2]-50,C.ss);
  cntHMI(Hm[0],Hm[1],Hm[2],Hm[3],Hm[4]);
  const top=Hm[1]+Hm[4]/2+22;
  lampPole(LAMPS.dmc[0],LAMPS.dmc[1],top,LAMPS.dmc[2]-8);
}

/* ── 리젝트 (후단 로드셀 뒤) ── */
function sReject(){
  const x=L.rej, b=BD(), bin=L.rejBin;
  airCyl([x,CH+b.h*0.42,-300],[x,CH+b.h*0.42,-120],22);
  box(x-24,x+24,CH+5,CH+b.h*0.42+30,-320,-290,C.ss);
  /* 슈트 : 컨베이어 앞 → 리젝트함 (작업자 쪽) */
  quad([x-70,CH-2,60],[x+70,CH-2,60],[x+70,CH-150,330],[x-70,CH-150,330],C.uhmw);
  box(x-76,x-70,CH-150,CH+40,60,330,C.ss,C.ss,0); box(x+70,x+76,CH-150,CH+40,60,330,C.ss,C.ss,0);
  /* 잠금식 리젝트함 */
  box(bin.x-230,bin.x+230,110,CH-160,bin.z-230,bin.z-210,C.ss);
  box(bin.x-230,bin.x-210,110,CH-160,bin.z-230,bin.z+200,C.ss); box(bin.x+210,bin.x+230,110,CH-160,bin.z-230,bin.z+200,C.ss);
  box(bin.x-230,bin.x+230,110,130,bin.z-230,bin.z+200,C.ss);
  for(const xx of [bin.x-190,bin.x+190]) for(const zz of [bin.z-200,bin.z+170]) foot(xx,zz,110);
  const g=gAlpha; gAlpha=0.24; box(bin.x-210,bin.x+210,130,CH-170,bin.z+196,bin.z+200,C.acryl,C.acryl,0); gAlpha=g;
  box(bin.x-230,bin.x+230,CH-176,CH-160,bin.z-230,bin.z-150,C.ssL,C.ssL,0);
  { const g2=gAlpha; gAlpha=0.2; box(bin.x-210,bin.x+230,CH-172,CH-166,bin.z-150,bin.z+200,C.acryl,C.acryl,0); gAlpha=g2; }
  box(bin.x+150,bin.x+190,CH-260,CH-200,bin.z+200,bin.z+214,C.yellow,C.yellow,0);   /* 잠금 */
}
/* ── 중량선별 PLC 패널 ── */
function sWCPanel(){
  const x=120, z=760;
  foot(x,z,40); cylY(x,z,40,1140,30,C.ss,14);
  box(x-190,x+190,1140,1620,z-80,z,C.cab,C.ssL);
  namePlate(x,1180,z+1,150,[0.07,0.49,0.53,0.2]);
}
/* ── HPE-100 : 하부 캐비닛 + 알루미늄 프레임 아크릴 가드, 앞 오른쪽 HMI · 경광등 ── */
function sPE(){
  const x=L.pe, b=BD(), H=sgHeadY(), P=PEB;
  cabinet(P.x0,P.x1,110,CH-110,P.z0,P.z1,{doors:2,front:P.z1});
  namePlate(x-200,CH-200,P.z1+1,160,C.green);
  box(P.x0,P.x1,CH-110,CH-96,P.z0,P.z1,C.ssL,C.ssL);
  alFrame(P.x0,P.x1,CH-96,P.yT,P.z0,P.z1,{hole:{l:[-100,100,CH-100,CH+b.h+70], r:[-100,100,CH-100,CH+b.h+70]}});
  /* 내부 : 뒤 장착판 · 릴 축 · 댄서 · 가이드 롤러 */
  box(x-170,x+170,CH-96,1720,-570,-270,C.cab,C.ssL);
  cylZ(x,1520,-270,-58,20,C.ss,14);
  cylZ(x+195,1360,-270,-40,10,C.ss,10);
  cylZ(x+60,H.y1+70,-270,-40,9,C.ss,10);
  box(x-70,x+70,H.y1-90,H.y1,-270,-60,C.cab);
  inserterHead(x,H,96,70);
  box(x+60,x+92,H.y0+36,H.y0+76,70,90,[0.84,0.30,0.12,0.3]);          /* 가열 커터 표시 */
  box(x-150,x-110,H.y0+20,H.y0+60,70,82,C.dark);                        /* 필름 없음 센서 */
  const tr=Math.max(10,b.nk/2-3);
  const g=gAlpha; gAlpha=0.28; tube([x,CH+b.h+16,0],[x,H.y0,0],tr+2,C.acryl,16,false); gAlpha=g;
  cylY(x,0,CH+b.h+12,CH+b.h+18,tr+5,C.ss,16);
  airCyl([x,H.y1,0],[x,H.y1+190,0],22);
  airCyl([x+b.d/2+7,CH+b.h*0.42,-190],[x+b.d/2+7,CH+b.h*0.42,-78],11);
  airCyl([x-b.d-5,CH+b.h*0.42,-190],[x-b.d-5,CH+b.h*0.42,-78],11);
  /* 조작 패널 (앞 오른쪽 기둥) · 경광등 */
  const Hm=HMIS.pe;
  box(P.x1-20,P.x1+20,Hm[1]-40,Hm[1]+40,P.z1,Hm[2]-60,C.alu);
  cntHMI(Hm[0],Hm[1],Hm[2],Hm[3],Hm[4]);
  lampPole(LAMPS.pe[0],LAMPS.pe[1],P.yT,LAMPS.pe[2]-8);
}
/* ── RCS-120 : 대형 하부 캐비닛 + 알루미늄 프레임 가드, 위 원통 드럼(터렛 헤드), 왼쪽 위 진동 볼 피더 · 슈트, 앞 중앙 HMI ── */
function rcY(){ const b=BD(); const yc=CH+b.h+b.capH+190; return {yc, top:1790, pick:CH+b.h+48}; }
function sRCS(){
  const b=BD(), A=L.A, B=L.B, T=L.T, Y=rcY(), R=RCB, bw=RCBOWL;
  cabinet(R.x0,R.x1,110,CH-110,R.z0,R.z1,{doors:4,front:R.z1});
  namePlate(R.x1-220,CH-200,R.z1+1,180,C.blue);
  box(R.x0,R.x1,CH-110,CH-96,R.z0,R.z1,C.ssL,C.ssL);
  /* 스타휠 · 터렛 데크 */
  box(A.x-220,B.x+220,CH-96,CH-14,T.z-230,-70,C.ssD);
  box(A.x-240,B.x+240,CH-14,CH-2,T.z-250,-50,C.uhmw,C.uhmw);
  for(const c of [A,B]) cylY(c.x,c.z,CH-2,CH+b.h*0.75+16,22,C.ss,14);
  cylY(T.x,T.z,CH-2,CH+b.h*0.75+16,40,C.ss,16);
  /* 가드 프레임 (드럼 자리 윗판 구멍 · 엘리베이터 구멍 · 컨베이어 개구) */
  const dr=300;
  alFrame(R.x0,R.x1,CH-96,R.yT,R.z0,R.z1,{mx:[2780],
    hole:{t1:[T.x-dr-10,T.x+dr+10,T.z-dr-10,T.z+dr+10], l:[-100,100,CH-100,CH+b.h+70], r:[-100,100,CH-100,CH+b.h+70]}});
  /* 드럼 받침 브리지 · 구동 기둥 · 스핀들 */
  for(const z of [T.z-dr-40,T.z+dr+40]) box(R.x0,R.x1,Y.top,Y.top+50,z-25,z+25,C.ss);
  box(T.x-dr-30,T.x+dr+30,Y.top,Y.top+50,T.z-dr-30,T.z+dr+30,C.ss);
  box(T.x-90,T.x+90,CH-96,Y.top,R.z0+40,R.z0+220,C.cab,C.ssL);
  cylY(T.x,T.z,Y.yc+140,Y.top,46,C.ss,16);
  cylY(T.x,T.z,Y.top-190,Y.top,120,C.ssD,24);                                     /* 캠 하우징 */
  /* 원통 드럼 (헤드 구동부 · 파우더 클러치 하우징) */
  cylY(T.x,T.z,Y.top+50,Y.top+650,dr,C.ss,44);
  for(const y of [Y.top+200,Y.top+520]) cylY(T.x,T.z,y,y+12,dr+4,C.ssD,44);
  cylY(T.x,T.z,Y.top+650,Y.top+668,dr-18,C.ssL,44);
  box(T.x-60,T.x+60,Y.top+360,Y.top+420,T.z+dr-6,T.z+dr+2,C.blue,C.blue,0);
  /* 타이밍 스크류 베어링 블록 · 구동 커버 */
  const zs=b.d/2+32, ys=CH+b.h*0.42;
  box(L.screw0-60,L.screw0-20,CH-60,ys+40,zs-40,zs+40,C.ss); box(L.screw1+10,L.screw1+50,CH-60,ys+40,zs-40,zs+40,C.ss);
  box(L.screw0-90,L.screw0-60,CH-110,ys+60,zs-50,zs+50,C.cab);
  /* 캡 공급 : 앞 위 캡 호퍼(50 L) → 진동 트레이 → 왼쪽 위 진동 볼 피더 → 슈트 */
  const CH_=CAPHOP;
  const T0=[[CH_.x0,CH_.y1,CH_.z0],[CH_.x1,CH_.y1,CH_.z0],[CH_.x1,CH_.y1,CH_.z1],[CH_.x0,CH_.y1,CH_.z1]];
  const cx=(CH_.x0+CH_.x1)/2, cz=(CH_.z0+CH_.z1)/2;
  const T1=[[cx-70,CH_.y0,cz-60],[cx+70,CH_.y0,cz-60],[cx+70,CH_.y0,cz+60],[cx-70,CH_.y0,cz+60]];
  for(let i=0;i<4;i++){ const j=(i+1)%4; quad(T0[i],T0[j],T1[j],T1[i],C.ss); tube(T0[i],T0[j],6,C.ssL,8); }
  box(cx-70,cx+70,CH_.y0-30,CH_.y0,cz-60,cz+60,C.ssD);
  for(const x of [CH_.x0+20,CH_.x1-20]) box(x-12,x+12,Y.top+50,CH_.y1-20,CH_.z0+10,CH_.z0+34,C.ss);
  const t0=[cx,CH_.y0-40,cz], t1=[bw.x-60,bw.y+100,bw.z+120];
  mPush(); const tl=mAlong(t0,t1); box(-50,50,0,tl,-6,0,C.ss); box(-54,-50,0,tl,-6,30,C.ss); box(50,54,0,tl,-6,30,C.ss); mPop();
  cylY(cx,cz,Y.top+50,CH_.y0-40,50,C.dark,14);                                  /* 진동기 */
  cylY(bw.x,bw.z,CH-96,bw.y-120,40,C.ss,14);
  cylY(bw.x,bw.z,bw.y-120,bw.y-30,120,C.dark,20);
  mPush(); mT(bw.x,bw.y-30,bw.z);
  lathe([[0,0],[200,0],[236,8],[244,20],[244,140],[252,140],[252,-4],[210,-12],[0,-12]],C.ss,40);
  mPop();
  const spiral=[]; for(let i=0;i<=80;i++){ const a=i/80*Math.PI*3.4, r=236, y=bw.y-20+i/80*108; spiral.push([bw.x+r*Math.cos(a),y,bw.z+r*Math.sin(a)]); }
  tubePath(spiral,6,C.ssL,8);
  /* 슈트 : 바닥판 · 양 옆 레일 · 받침 */
  const P=capChute(), ex=P.ex, hw=b.capD/2+4;
  const off=(p,s,dy)=>[p[0]+ex[0]*s,p[1]+dy,p[2]+ex[2]*s];
  const fl=-b.capH*0.82-2;
  quad(off(P.a,-hw,fl),off(P.b,-hw,fl),off(P.b,hw,fl),off(P.a,hw,fl),C.ss);
  for(const s of [-1,1]) for(const dy of [fl+12,fl+P.w]) tube(off(P.a,s*(hw+4),dy),off(P.b,s*(hw+4),dy),5,C.ssL,8);
  const mid=[(P.a[0]+P.b[0])/2,(P.a[1]+P.b[1])/2+fl,(P.a[2]+P.b[2])/2];
  tube([bw.x,bw.y-160,bw.z],mid,8,C.ss,8);
  /* 조작 패널 · 경광등 */
  const Hm=HMIS.rc;
  box(Hm[0]-24,Hm[0]+24,Hm[1]+Hm[4]/2+22,R.yT-20,R.z1+20,R.z1+40,C.alu);
  cntHMI(Hm[0],Hm[1],Hm[2],Hm[3],Hm[4]);
  lampPole(LAMPS.rc[0],LAMPS.rc[1],R.yT,LAMPS.rc[2]-8);
}
/* 캡 슈트 : 볼 출구 a → 픽업 지점 b (터렛 φ=CAP_PICK) · ex = 슈트 폭 방향 (수평) */
function capChute(){
  const b=BD(), T=L.T, Y=rcY(), ap=CAP_PICK*Math.PI/180, bw=RCBOWL;
  const px=T.x+L.R*Math.cos(ap), pz=T.z+L.R*Math.sin(ap);
  const dx=px-bw.x, dz=pz-bw.z, dl=Math.hypot(dx,dz), ux=dx/dl, uz=dz/dl;
  const pb=[px+ux*(b.capD/2+2),Y.pick+b.capH+6,pz+uz*(b.capD/2+2)];
  return {a:[bw.x+ux*250,bw.y+80,bw.z+uz*250], b:pb, w:b.capH+4, dir:ap, ex:[-uz,0,ux]};
}
/* ── 집적 테이블 ── */
function sTable(){
  const t=L.table, b=BD();
  cylY(t.x,t.z,0,20,260,C.dark,24); cylY(t.x,t.z,20,CH-70,120,C.cab,20);
  cylY(t.x,t.z,CH-70,CH-30,t.r-30,C.ss,40);
  mPush(); mT(t.x,0,t.z);
  const gap=(b.d/2+24)/t.r;
  lathe([[t.r+6,CH-26],[t.r+6,CH+110],[t.r+16,CH+110],[t.r+16,CH-26]],C.ss,56,Math.PI+gap,Math.PI-gap+Math.PI*2);
  mPop();
  box(XE-20,t.x-t.r+30,CH-10,CH-2,-50,50,C.ss);
  for(const s of [-1,1]) box(XE-20,t.x-t.r+30,CH-2,CH+b.h*0.5,s*(b.d/2+5),s*(b.d/2+10),C.guide,C.guide,0);
}
/* ── 집진기 (계수기 뒤) ── */
function sDust(){
  const x=-900, z=-1500;
  cylY(x,z,0,20,230,C.dark,20);
  cylY(x,z,20,1150,200,C.cab,24);
  mPush(); mT(x,0,z); lathe([[200,1150],[120,1320],[60,1360]],C.ss,24); mPop();
  cylY(x,z,1360,1500,70,C.dark,16);
  box(x+190,x+260,500,700,z-40,z+40,C.dark);
}

/* ═══ 동적 형상 ═══ */
/* 병 윤곽 (규격별 캐시) */
let BOT_CACHE={ml:0};
function botProf(){
  const b=BD();
  if(BOT_CACHE.ml===b.ml) return BOT_CACHE;
  const r=b.d/2, nr=b.nk/2, hn=13, hs=b.h-hn-r*0.42;
  BOT_CACHE={ml:b.ml,
    body:[[0,0],[r-5,0],[r-1.5,1.5],[r,5.5],[r,hs],[r-2,hs+r*0.16],[nr+5,b.h-hn-2],[nr+1.5,b.h-hn],[nr+1.5,b.h-hn+1.8],[nr,b.h-hn+2.5],[nr,b.h-1],[nr-1.2,b.h],[nr-3.2,b.h],[nr-3.2,b.h-9]],
    ring:[[nr+0.5,b.h-7],[nr+1.8,b.h-6],[nr+1.8,b.h-4.5],[nr+0.5,b.h-3.5]],
    cap:[[b.capD/2-5,b.h+4],[b.capD/2-5,b.h+b.capH-3],[0,b.h+b.capH-3],[0,b.h+b.capH],[b.capD/2-1.5,b.h+b.capH],[b.capD/2,b.h+b.capH-1.5],[b.capD/2,b.h-b.capH+b.capH*0.18+3],[b.capD/2-1,b.h-b.capH+b.capH*0.18+2]],
    r, nr, hs};
  return BOT_CACHE;
}
/* 병 1개 : (x,y,z) 바닥 중심 · roll = 진행축 기준 뒤집힘 · yaw = 진행 방향 */
function drawBottle(x,y,z,o){
  const b=BD(), P=botProf(), far=cam.dist>7000, seg=far?8:cam.dist>4500?10:14;
  mPush(); mT(x,y,z);
  if(o.yaw) mRY(o.yaw);
  if(o.roll){ mT(0,b.h/2,0); mRX(o.roll); mT(0,-b.h/2,0); }
  if(o.tilt){ mRZ(o.tilt); }
  lathe(P.body,o.col||C.hdpe,seg);
  if(cam.dist<3000) lathe(P.ring,C.hdpeS,seg);
  if(o.fill>0){   /* 병 속 정제 윗면 (입구로 보인다) */
    const yf=4+(P.hs-4)*Math.min(1,o.fill)*0.82;
    mPush(); disc(yf,0,P.r-2.2,C[S.rc.prod.col==="caps"?"capsR":S.rc.prod.col],far?6:12); mPop();
  }
  if(o.gel&&!far&&!o.cap){ box(-8,8,6,12,-5,5,C.gel,C.gel,0); }
  if(o.pe&&!far&&!o.cap){ mPush(); mT(0,b.h-9,0); lathe([[P.nr-3,0],[P.nr-6,5],[0,8]],C.film,10); mPop(); }
  if(o.cap){
    mPush(); if(o.capY) mT(0,o.capY,0); if(o.capSpin) mRY(o.capSpin);
    lathe(P.cap,C[b.capCol],seg);
    if(!far) box(b.capD/2-6,b.capD/2-2,b.h+b.capH-0.5,b.h+b.capH+0.6,-2,2,C.white,C.white,0);
    mPop();
  }
  if(o.ng) { mPush(); lathe([[P.r+0.8,1],[P.r+0.8,10]],C.red,seg); mPop(); }
  mPop();
}
/* 정제 1정 (국부 원점 중심, 길이 방향 x) */
function drawTab(x,y,z,yaw,col){
  const p=S.rc.prod;
  mPush(); mT(x,y,z); if(yaw) mRY(yaw);
  if(p.shape==="round"){ cylY(0,0,-p.thk/2,p.thk/2,p.dia/2,col||C.tabA,7,true); }
  else if(p.shape==="oblong"){ ellipsoid([0,0,0],[p.len/2,p.thk/2,p.dia/2],col||C.tabB,8,4); }
  else { cylX(-p.len/2+p.dia/2,0,0,0,p.dia/2,C.capsR,7,false); cylX(0,p.len/2-p.dia/2,0,0,p.dia/2*0.97,C.capsW,7,false);
    ellipsoid([-p.len/2+p.dia/2,0,0],[p.dia/2,p.dia/2,p.dia/2],C.capsR,7,4); ellipsoid([p.len/2-p.dia/2,0,0],[p.dia/2,p.dia/2,p.dia/2],C.capsW,7,4); }
  mPop();
}
function tabCol(){ const k=S.rc.prod.col; return k==="caps"?C.capsR:C[k]; }
