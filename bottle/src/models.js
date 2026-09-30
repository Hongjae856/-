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
    if(x>L.uaX0-80&&x<L.uaX1+80) continue;
    if(x>2200&&x<3700) continue;
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

/* ── UA-120 ── */
function sUA(){
  const b=BD(), tt=L.tt;
  cabinet(L.uaX0,L.uaX1,110,CH-100,-600,390,{doors:3});
  namePlate(-3560,CH-190,391,220);
  /* 턴테이블 드럼 · 림 */
  cylY(tt.x,tt.z,CH-100,CH-14,tt.r+22,C.ss,48);
  mPush(); mT(tt.x,0,tt.z);
  const gap=(b.d/2+16)/tt.r;
  lathe([[tt.r+4,CH-14],[tt.r+4,CH+120],[tt.r+14,CH+120],[tt.r+14,CH-14]],C.ss,44,Math.PI/2+gap,Math.PI/2-gap+Math.PI*2);
  mPop();
  /* 출구 안내 가이드 (턴테이블 → 컨베이어) */
  for(const s of [-1,1]) box(tt.x-20,tt.x+90,CH+2,CH+b.h*0.6,s*(b.d/2+5),s*(b.d/2+11),C.guide,C.guide,0);
  /* 호퍼 (라인 왼쪽 앞) */
  const hp=L.hop;
  for(const x of [hp.x0+30,hp.x1-30]) for(const z of [hp.z0+30,hp.z1-30]) { foot(x,z,40); cylY(x,z,40,820,16,C.ss,10); }
  box(hp.x0,hp.x1,800,830,hp.z0,hp.z1,C.ss);
  box(hp.x0,hp.x0+4,830,1250,hp.z0,hp.z1,C.ss); box(hp.x1-4,hp.x1,830,1080,hp.z0,hp.z1,C.ss);
  box(hp.x0,hp.x1,830,1250,hp.z0,hp.z0+4,C.ss); box(hp.x0,hp.x1,830,1250,hp.z1-4,hp.z1,C.ss);
  quad([hp.x0+4,1100,hp.z0+4],[hp.x0+4,1100,hp.z1-4],[hp.x1-4,860,hp.z1-4],[hp.x1-4,860,hp.z0+4],C.ssD);
  /* 병 엘리베이터 (클리트 벨트) : 호퍼 → 턴테이블 */
  const e0=[hp.x1-20,860,20], e1=[tt.x-150,CH+470,tt.z-80];
  mPush(); const len=mAlong(e0,e1);
  box(-120,-110,0,len,-50,40,C.ss); box(110,120,0,len,-50,40,C.ss); box(-110,110,0,len,-44,-36,C.slat,C.slat,0); box(-110,110,0,len,-70,-44,C.ss);
  cylZ(0,30,-38,60,26,C.ssD,14); cylZ(0,len-30,-38,60,26,C.ssD,14);
  mPop();
  cylY(e1[0],e1[2],CH-100,e1[1]-40,20,C.ss,10);
  /* 배출 슈트 */
  quad([e1[0]-70,e1[1]-20,e1[2]-70],[e1[0]+70,e1[1]-20,e1[2]-70],[tt.x-40,CH+140,tt.z+10],[tt.x-200,CH+140,tt.z+10],C.ss);
  /* 반전 사이드 벨트 구간 : 풀리 하우징 · 상부 프레임 · 아크릴 터널 */
  const zb=b.d/2+8, ym=CH+b.h/2;
  for(const x of [L.belt0,L.belt1]) for(const s of [-1,1]){
    box(x-55,x+55,CH+6,CH+b.h+6,s*(zb+14),s*(zb+80),C.ss);
    cylY(x,s*(zb+6),CH+2,CH+b.h+10,10,C.ssD,12);
  }
  for(const s of [-1,1]){ cylX(L.belt0-80,L.belt1+80,CH+b.h+150,s*170,12,C.alu,10); }
  for(let x=L.belt0-60;x<=L.belt1+60;x+=280){ cylZ(x,CH+b.h+150,-170,170,10,C.alu,8); for(const s of [-1,1]) cylY(x,s*170,CH-8,CH+b.h+150,10,C.alu,8); }
  /* 비틀림 벨트 지지 롤러 링 (병 축 둘레) */
  for(let x=L.inv0;x<=L.inv3;x+=150){
    mPush(); mT(x,ym,0); mRZ(Math.PI/2);
    lathe([[zb+30,-6],[zb+36,-6],[zb+36,6],[zb+30,6],[zb+30,-6]],C.alu,28);
    mPop();
  }
  guardPanel(L.belt0-100,L.belt1+100,CH-40,CH+b.h+170,-190,-186);
  guardPanel(L.belt0-100,L.belt1+100,CH-40,CH+b.h+170,186,190);
  guardPanel(L.belt0-100,L.belt1+100,CH+b.h+166,CH+b.h+170,-190,190);
  /* 세척부 : 이온 에어 노즐 · 진공 노즐 (병 입구 아래) */
  box(L.air[0]-110,L.vac[1]+110,CH-190,CH-40,-90,90,C.dark,C.dark);
  for(const x of L.air){ cylY(x,0,CH-40,CH-16,7,C.ss,10); cylY(x,0,CH-18,CH-10,4,C.brushed,8); box(x-26,x+26,CH-60,CH-40,-26,26,C.blue,C.blue,0); }
  for(const x of L.vac){ box(x-34,x+34,CH-44,CH-26,-30,30,C.black,C.black,0); box(x-26,x+26,CH-27,CH-24,-22,22,[0.05,0.05,0.06,0.1],null,0); }
  hoseTo([L.air[0],CH-150,-60],[-4200,CH-200,-420],[-4150,CH-250,-560],9,C.blue);
  hoseTo([L.vac[1],CH-150,-60],[-3700,CH-200,-420],[-3680,CH-300,-560],24,[0.62,0.66,0.70,0.2]);
  /* 이오나이저 · 필터 레귤레이터 */
  box(-4030,-3860,CH+b.h+120,CH+b.h+150,-60,60,C.dark); box(-4000,-3890,CH+b.h+115,CH+b.h+121,-40,40,E.ledB,null,0);
  box(-5040,-4940,560,760,391,430,C.dark); cylZ(-4990,720,430,440,26,C.white,20); cylY(-4990,410,560,600,20,[0.75,0.82,0.9,0.1],14);
  /* HMI · 경광등 */
  hmiStand(-3400,CH-100,1450,300,470);
  lampPole(-3300,-480,CH-100,1380);
}
/* 호스 (3점 곡선) */
function hoseTo(a,m,e,r,col){ const pts=[]; for(let i=0;i<=10;i++){ const t=i/10,u=1-t; pts.push([u*u*a[0]+2*u*t*m[0]+t*t*e[0],u*u*a[1]+2*u*t*m[1]+t*t*e[1],u*u*a[2]+2*u*t*m[2]+t*t*e[2]]); } tubePath(pts,r,col,10); }

/* ── SG-120 ── */
function sgHeadY(){ const b=BD(); return {y0:CH+b.h+130, y1:CH+b.h+320}; }
function sSG(){
  const x=L.sg, b=BD(), H=sgHeadY();
  cabinet(x-310,x+310,110,1060,-790,-150,{doors:2,front:-150});
  namePlate(x,980,-149,160);
  box(x-170,x+170,1060,1790,-570,-270,C.cab,C.ssL);
  cylZ(x,1500,-270,-36,18,C.ss,14);                                    /* 릴 축 */
  cylZ(x+195,1330,-270,-24,10,C.ss,10);                                /* 댄서 축 */
  cylZ(x+60,H.y1+70,-270,-24,9,C.ss,10);                               /* 가이드 롤러 축 */
  /* 헤드 : 컬럼에서 내민 암 + 피드 · 커터 블록 */
  box(x-70,x+70,H.y1-90,H.y1,-270,-60,C.cab);
  box(x-86,x+86,H.y0,H.y1,-66,66,C.cab,C.ssL);
  box(x-60,x+60,H.y0+40,H.y1-30,66,68,[0.06,0.08,0.1,0.2],null,0);   /* 투시창 */
  box(x+46,x+70,H.y1-110,H.y1-86,66,80,C.dark);                        /* 마크 센서 */
  /* 가이드 튜브 (투명) · 플런저 실린더 */
  const tr=Math.max(9,b.nk/2-4);
  const g=gAlpha; gAlpha=0.28; tube([x,CH+b.h+16,0],[x,H.y0,0],tr+2,C.acryl,16,false); gAlpha=g;
  cylY(x,0,CH+b.h+12,CH+b.h+18,tr+5,C.ss,16);
  airCyl([x,H.y1,0],[x,H.y1+190,0],22);
  /* 스토퍼 · 클램프 실린더 (후면) */
  airCyl([x+b.d/2+7,CH+b.h*0.42,-190],[x+b.d/2+7,CH+b.h*0.42,-78],11);
  airCyl([x-b.d/2-5-b.d/2,CH+b.h*0.42,-190],[x-b.d/2-5-b.d/2,CH+b.h*0.42,-78],11);
  hmiStand(x+330,1060,1470,-230,-110);
  lampPole(x-110,-440,1790,1840);
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

/* ── DMC-60T ── */
function dmcGateY(){ return CH+BD().h+175; }
const DMC={x0:-956,x1:-644,tw:26,t3z0:-420,t3z1:-172,t3y:1452, t2:{x0:-1030,x1:-570,z0:-640,z1:-420,y:1498}, t1:{x0:-990,x1:-610,z0:-900,z1:-640,y:1540}};
function sDMC(){
  const b=BD(), yG=dmcGateY();
  cabinet(L.dmcX0,L.dmcX1,110,1000,-1090,-150,{doors:3,front:-150});
  namePlate(-340,930,-149,200);
  /* 진동기 벤치 */
  box(-1090,-510,1000,1300,-1000,-160,C.cab,C.ssL);
  for(let x=-1060;x<-540;x+=36) box(x,x+18,1150,1260,-162,-158,C.dark,C.dark,0);
  /* 호퍼 (뒤 · 위) */
  const hy0=1660, hy1=2040;
  const H0=[[-1110,hy1,-1080],[-490,hy1,-1080],[-490,hy1,-700],[-1110,hy1,-700]], H1=[[-900,hy0,-880],[-700,hy0,-880],[-700,hy0,-780],[-900,hy0,-780]];
  for(let i=0;i<4;i++){ const j=(i+1)%4; quad(H0[i],H0[j],H1[j],H1[i],C.ss); }
  for(let i=0;i<4;i++){ const j=(i+1)%4; tube(H0[i],H0[j],6,C.ssL,8); }
  for(const p of [[-1100,-1070],[-500,-1070],[-1100,-710],[-500,-710]]) cylY(p[0],p[1],1300,hy1,12,C.ss,8);
  box(-900,-700,hy0-40,hy0,-880,-780,C.ssD);
  cylY(-490,-900,hy1-120,hy1-60,14,C.dark,10);                                    /* 레벨 센서 */
  const g=gAlpha; gAlpha=0.22; box(-1112,-488,hy1,hy1+6,-1082,-698,C.acryl,C.acryl,0); gAlpha=g;
  /* 트레이 1 · 2 (팬) */
  const pan=(t,wall)=>{ box(t.x0,t.x1,t.y-10,t.y,t.z0,t.z1,C.brushed,C.brushed,0);
    box(t.x0-4,t.x0,t.y,t.y+wall,t.z0,t.z1,C.ss,C.ss,0); box(t.x1,t.x1+4,t.y,t.y+wall,t.z0,t.z1,C.ss,C.ss,0); box(t.x0,t.x1,t.y,t.y+wall,t.z0-4,t.z0,C.ss,C.ss,0);
    box(t.x0+30,t.x1-30,t.y-110,t.y-10,t.z0+30,t.z1-30,C.dark); };
  pan(DMC.t1,34); pan(DMC.t2,28);
  for(let i=1;i<12;i++){ const x=DMC.x0+i*DMC.tw; box(x-1,x+1,DMC.t2.y,DMC.t2.y+12,DMC.t2.z1-90,DMC.t2.z1,C.ss,C.ss,0); }
  /* 트레이 3 : 12 트랙 (V 홈) */
  box(DMC.x0-6,DMC.x1+6,DMC.t3y-14,DMC.t3y-4,DMC.t3z0,DMC.t3z1,C.brushed,C.brushed,0);
  for(let i=0;i<12;i++){
    const x0=DMC.x0+i*DMC.tw, xc=x0+DMC.tw/2;
    quad([x0+1,DMC.t3y+6,DMC.t3z0],[x0+1,DMC.t3y+6,DMC.t3z1],[xc,DMC.t3y-4,DMC.t3z1],[xc,DMC.t3y-4,DMC.t3z0],C.brushed);
    quad([xc,DMC.t3y-4,DMC.t3z0],[xc,DMC.t3y-4,DMC.t3z1],[x0+DMC.tw-1,DMC.t3y+6,DMC.t3z1],[x0+DMC.tw-1,DMC.t3y+6,DMC.t3z0],C.ss);
    box(x0-1,x0+1,DMC.t3y,DMC.t3y+16,DMC.t3z0,DMC.t3z1,C.ssL,C.ssL,0);
  }
  box(DMC.x1-1,DMC.x1+1,DMC.t3y,DMC.t3y+16,DMC.t3z0,DMC.t3z1,C.ssL,C.ssL,0);
  box(DMC.x0+20,DMC.x1-20,DMC.t3y-120,DMC.t3y-14,DMC.t3z0+30,DMC.t3z1-30,C.dark);
  /* 센서 블록 : 12 창 */
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
  /* 아크릴 덮개 */
  guardPanel(-1070,-530,1470,1640,-990,-166);
  /* 집진 덕트 */
  hoseTo([-640,1400,-180],[-450,1250,-700],[-900,700,-1380],30,[0.62,0.66,0.70,0.2]);
  /* HMI · 경광등 */
  hmiStand(-120,1000,1520,-250,330);
  box(-138,-102,1502,1538,-250,330,C.ss);
  lampPole(-520,-1060,hy1,hy1+30);
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
  box(bin.x-230,bin.x+230,CH-176,CH-160,bin.z-230,bin.z+200,C.ssL,C.ssL,0);
  box(bin.x+150,bin.x+190,CH-260,CH-200,bin.z+200,bin.z+214,C.yellow,C.yellow,0);   /* 잠금 */
}
/* ── 중량선별 PLC 패널 ── */
function sWCPanel(){
  const x=120, z=760;
  foot(x,z,40); cylY(x,z,40,1140,30,C.ss,14);
  box(x-190,x+190,1140,1620,z-80,z,C.cab,C.ssL);
  namePlate(x,1180,z+1,150,[0.07,0.49,0.53,0.2]);
}
/* ── HPE-100 ── */
function sPE(){
  const x=L.pe, b=BD(), H=sgHeadY();
  cabinet(x-310,x+310,110,1060,-790,-150,{doors:2,front:-150});
  namePlate(x,980,-149,160,C.green);
  box(x-170,x+170,1060,1790,-570,-270,C.cab,C.ssL);
  cylZ(x,1520,-270,-58,20,C.ss,14);
  cylZ(x+200,1360,-270,-40,10,C.ss,10);
  cylZ(x+60,H.y1+70,-270,-40,9,C.ss,10);
  box(x-70,x+70,H.y1-90,H.y1,-270,-60,C.cab);
  box(x-96,x+96,H.y0,H.y1,-70,70,C.cab,C.ssL);
  box(x-66,x+66,H.y0+40,H.y1-30,70,72,[0.06,0.08,0.1,0.2],null,0);
  box(x+60,x+92,H.y0+36,H.y0+76,70,90,[0.84,0.30,0.12,0.3]);          /* 가열 커터 표시 */
  const tr=Math.max(10,b.nk/2-3);
  const g=gAlpha; gAlpha=0.28; tube([x,CH+b.h+16,0],[x,H.y0,0],tr+2,C.acryl,16,false); gAlpha=g;
  cylY(x,0,CH+b.h+12,CH+b.h+18,tr+5,C.ss,16);
  airCyl([x,H.y1,0],[x,H.y1+190,0],22);
  airCyl([x+b.d/2+7,CH+b.h*0.42,-190],[x+b.d/2+7,CH+b.h*0.42,-78],11);
  airCyl([x-b.d-5,CH+b.h*0.42,-190],[x-b.d-5,CH+b.h*0.42,-78],11);
  hmiStand(x+330,1060,1470,-230,-110);
  lampPole(x-110,-440,1790,1840);
}
/* ── RCS-120 ── */
function rcY(){ const b=BD(); const yc=CH+b.h+b.capH+190; return {yc, top:yc+360, pick:CH+b.h+48}; }
function sRCS(){
  const b=BD(), A=L.A, B=L.B, T=L.T, Y=rcY();
  cabinet(2230,3650,110,CH-40,-840,-52,{doors:3,front:-52});
  namePlate(3470,CH-110,-51,180,C.blue);
  box(A.x-240,B.x+240,CH-14,CH-2,T.z-250,-50,C.uhmw,C.uhmw);
  for(const c of [A,B]) cylY(c.x,c.z,CH-40,CH+b.h*0.75+16,22,C.ss,14);
  cylY(T.x,T.z,CH-40,CH+b.h*0.75+16,40,C.ss,16);
  /* 포털 프레임 · 구동부 */
  for(const s of [-1,1]){ box(T.x+s*460-40,T.x+s*460+40,CH-40,Y.top,T.z-340,T.z-260,C.cab,C.ssL); }
  box(T.x-500,T.x+500,Y.top-60,Y.top+40,T.z-340,T.z-260,C.cab,C.ssL);
  box(T.x-150,T.x+150,Y.top-60,Y.top+40,T.z-260,T.z+60,C.cab,C.ssL);
  cylY(T.x,T.z,Y.top+40,Y.top+200,90,C.dark,20); cylY(T.x,T.z,Y.top+200,Y.top+230,70,C.ss,20);
  cylY(T.x,T.z,Y.yc+140,Y.top-60,46,C.ss,16);
  /* 타이밍 스크류 베어링 블록 · 구동 */
  const zs=b.d/2+32, ys=CH+b.h*0.42;
  box(L.screw0-70,L.screw0-20,CH-40,ys+40,zs-40,zs+40,C.ss); box(L.screw1+10,L.screw1+50,CH-40,ys+40,zs-40,zs+40,C.ss);
  box(L.screw0-190,L.screw0-70,CH-40,ys+60,zs-60,zs+60,C.cab); cylX(L.screw0-260,L.screw0-190,ys,zs,50,C.dark,16);
  for(const x of [L.screw0-45,L.screw1+30]) { foot(x,zs,CH-40); }
  /* 캡 공급 : 호퍼 → 엘리베이터 → 진동 볼 피더 → 슈트 */
  const bw={x:3520,y:1600,z:-930};
  cylY(bw.x,bw.z,0,20,160,C.dark,20); cylY(bw.x,bw.z,20,bw.y-90,40,C.ss,14);
  cylY(bw.x,bw.z,bw.y-120,bw.y-30,120,C.dark,20);
  mPush(); mT(bw.x,bw.y-30,bw.z);
  lathe([[0,0],[200,0],[236,8],[244,20],[244,140],[252,140],[252,-4],[210,-12],[0,-12]],C.ss,40);
  mPop();
  const spiral=[]; for(let i=0;i<=80;i++){ const a=i/80*Math.PI*3.4, r=236, y=bw.y-20+i/80*108; spiral.push([bw.x+r*Math.cos(a),y,bw.z+r*Math.sin(a)]); }
  tubePath(spiral,6,C.ssL,8);
  box(3700,4080,420,960,260,600,C.ss); for(const x of [3720,4060]) for(const z of [280,580]) foot(x,z,420);
  mPush(); const el=mAlong(CAPEL[0],CAPEL[1]);
  box(-110,-100,0,el,-40,60,C.ss); box(100,110,0,el,-40,60,C.ss); box(-100,100,0,el,-44,-36,C.ssD);
  mPop();
  const P=capChute();
  tube(P.a,P.b,6,C.ssL,8); tube([P.a[0],P.a[1]+P.w,P.a[2]],[P.b[0],P.b[1]+P.w,P.b[2]],6,C.ssL,8);
  quad([P.a[0],P.a[1]-8,P.a[2]-26],[P.b[0],P.b[1]-8,P.b[2]-26],[P.b[0],P.b[1]+P.w,P.b[2]-26],[P.a[0],P.a[1]+P.w,P.a[2]-26],C.ss);
  cylY(P.b[0]+30,P.b[2]-60,CH-40,P.b[1],10,C.ss,8);
  guardPanel(A.x-250,B.x+250,CH,Y.top-60,T.z-360,T.z-352);
  guardPanel(A.x-254,A.x-250,CH,Y.top-60,T.z-360,-60);
  guardPanel(B.x+250,B.x+254,CH,Y.top-60,T.z-360,-60);
  hmiStand(3700,CH-40,1480,-120,260);
  lampPole(T.x+460,T.z-300,Y.top+40,Y.top+50);
}
/* 캡 슈트 : 볼 출구 a → 픽업 지점 b (터렛 φ=50°) */
function capChute(){
  const b=BD(), T=L.T, Y=rcY(), ap=50*Math.PI/180;
  const pb=[T.x+L.R*Math.cos(ap)+44,Y.pick+b.capH+6,T.z+L.R*Math.sin(ap)-10];
  return {a:[3330,1560,-760], b:pb, w:b.capH+4, dir:ap};
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
  const b=BD(), P=botProf(), far=cam.dist>7000;
  const seg=far?8:14;
  mPush(); mT(x,y,z);
  if(o.yaw) mRY(o.yaw);
  if(o.roll){ mT(0,b.h/2,0); mRX(o.roll); mT(0,-b.h/2,0); }
  if(o.tilt){ mRZ(o.tilt); }
  lathe(P.body,o.col||C.hdpe,seg);
  if(!far) lathe(P.ring,C.hdpeS,seg);
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
