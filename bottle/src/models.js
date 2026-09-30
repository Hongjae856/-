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
/* ── 여닫는 아크릴 도어 (작업자가 가드 안 자재를 보충할 때 열린다) ── */
let DOORS=[];
const DOOR_OPEN={};
/* 도어 판 : 국부 원점 = 경첩 · 판은 +x(좌 경첩) / −x(우 경첩) / −y(윗 경첩) 방향으로 펼쳐진다 */
function doorLeaf(D){
  const w=D.x1-D.x0, h=D.y1-D.y0, p=16;
  let X0,X1,Y0,Y1;
  if(D.hinge==="left"){ X0=0; X1=w; Y0=0; Y1=h; }
  else if(D.hinge==="right"){ X0=-w; X1=0; Y0=0; Y1=h; }
  else { X0=0; X1=w; Y0=-h; Y1=0; }
  const col=C.alu;
  box(X0,X1,Y0,Y0+p,-p/2,p/2,col,col,3); box(X0,X1,Y1-p,Y1,-p/2,p/2,col,col,3);
  box(X0,X0+p,Y0,Y1,-p/2,p/2,col,col,3); box(X1-p,X1,Y0,Y1,-p/2,p/2,col,col,3);
  /* 손잡이 : 경첩 반대쪽 */
  if(D.hinge==="top"){ const hx=(X0+X1)/2; box(hx-70,hx+70,Y0+22,Y0+36,p/2,p/2+18,C.dark,C.dark,0); }
  else { const hx=D.hinge==="left"?X1-30:X0+30; box(hx-7,hx+7,h*0.45-80,h*0.45+80,p/2,p/2+18,C.dark,C.dark,0); }
  glassBox(X0+p,X1-p,Y0+p,Y1-p,-2,2,C.acryl,0.13);
}
/* 도어 개폐 : 작업자가 회전 범위 밖(통로 뒤)에서 먼저 열고 들어가며, 나온 뒤 닫힌다 */
function doorTick(dt){
  const ids=new Set(DOORS.map(D=>D.id)); ids.add("sgLid");
  for(const id of ids){
    const want=WK.some(w=>w.job&&((w.job.j.door===id&&w.job.phase!=="walk0")||(w.job.j.lid===id&&w.job.phase==="work"&&w.job.t<w.job.j.dur-0.3)))?1:0;
    const o=DOOR_OPEN[id]||0; DOOR_OPEN[id]=want?Math.min(1,o+dt*1.6):Math.max(0,o-dt*1.4);
  }
}
function drawDoors(){
  for(const D of DOORS){
    const o=DOOR_OPEN[D.id]||0;
    if(!VIEW3.guard&&o<0.02) continue;
    const a=smooth(o)*(D.hinge==="top"?1.75:1.45);
    mPush();
    if(D.hinge==="left"){ mT(D.x0,D.y0,D.z); mRY(-a); }
    else if(D.hinge==="right"){ mT(D.x1,D.y0,D.z); mRY(a); }
    else { mT(D.x0,D.y1,D.z); mRX(-a); }
    doorLeaf(D);
    mPop();
  }
}
/* 알루미늄 프로파일 프레임 + 아크릴 판 (카운텍 상부 가드 형식)
   o.mx : 중간 기둥 x · o.fskip/bskip : 판을 생략할 칸 · o.hole : {f0,b0,t0,l,r} 구멍 · o.top:false 윗판 생략
   o.door : {칸번호:{id,hinge}} 여닫는 도어 (동적) */
function alFrame(x0,x1,y0,y1,z0,z1,o){
  o=o||{}; const p=20, col=C.alu, xs=[x0,...(o.mx||[]),x1], H=o.hole||{}, DR=o.door||{};
  for(const x of xs) for(const z of [z0,z1]) box(x-p,x+p,y0,y1,z-p,z+p,col,col,4);
  for(const z of [z0,z1]) for(const y of [y0+p,y1-p]) box(x0-p,x1+p,y-p,y+p,z-p,z+p,col,col,4);
  for(const x of xs) for(const y of [y0+p,y1-p]) box(x-p,x+p,y-p,y+p,z0,z1,col,col,4);
  /* 모서리 캡 (검은 둥근 마개) */
  for(const x of [x0,x1]) for(const z of [z0,z1]) cylY(x,z,y1,y1+6,p+2,C.black,10);
  for(let i=0;i<xs.length-1;i++){
    const a=xs[i]+p, c=xs[i+1]-p;
    if(DR[i]){ const q={id:DR[i].id, y0:y0+2*p, y1:y1-2*p, z:z1+p};
      if(DR[i].hinge==="double"){ const m=(a+c)/2; DOORS.push(Object.assign({hinge:"left",x0:a,x1:m-3},q),Object.assign({hinge:"right",x0:m+3,x1:c},q)); }
      else DOORS.push(Object.assign({hinge:DR[i].hinge,x0:a,x1:c},q));
      continue; }
    if(!VIEW3.guard) continue;
    if(!(o.fskip||[]).includes(i)){
      panelZ(a,c,y0+2*p,y1-2*p,z1,H["f"+i]);
      const hx=c-34, hy=y0+(y1-y0)*0.45;                              /* 도어 손잡이 · 경첩 */
      box(hx-7,hx+7,hy-80,hy+80,z1+p,z1+p+16,C.dark,C.dark,0);
      for(const hy2 of [y0+120,y1-120]) box(a+4,a+22,hy2-30,hy2+30,z1+p,z1+p+6,C.ssD,C.ssD,0);
    }
  }
  if(!VIEW3.guard) return;
  for(let i=0;i<xs.length-1;i++){
    const a=xs[i]+p, c=xs[i+1]-p;
    if(!(o.bskip||[]).includes(i)) panelZ(a,c,y0+2*p,y1-2*p,z0,H["b"+i]);
    if(o.top!==false) panelY(a,c,z0+p,z1-p,y1-p,H["t"+i]);
  }
  panelX(z0+p,z1-p,y0+2*p,y1-2*p,x0,H.l);
  panelX(z0+p,z1-p,y0+2*p,y1-2*p,x1,H.r);
}
/* 카운텍 조작 패널 : 스테인리스 하우징 + 화면(동적 hmiFace) + POWER 키 · SAFETY RESET · (CONVEYOR SPEED) · 비상정지
   z = 하우징 앞면 (+z 를 본다) · o.knob : 속도 노브 · o.flush : 하우징 없이 판만 */
function cntHMI(x,y,z,w,h,o){
  o=o||{};
  const hw=w/2+26, yb=y-h/2-100, yt=y+h/2+34;
  if(!o.flush) box(x-hw,x+hw,yb,yt,z-70,z,C.ssL,C.ssL);
  box(x-w/2-14,x+w/2+14,y-h/2-14,y+h/2+14,z,z+2,C.black,C.black,0);        /* 베젤 */
  box(x-hw+12,x-hw+120,yt-24,yt-10,z,z+1.2,C.dark,C.dark,0);                 /* COUNTEC 로고 */
  const by=yb+48, n=o.knob?4:3, gap=(2*hw-40)/n;
  let bx=x-hw+20+gap/2;
  cylZ(bx,by,z,z+14,17,C.black,16); box(bx-2,bx+2,by-9,by+9,z+14,z+20,C.ssD,C.ssD,0); bx+=gap;       /* POWER 키 */
  cylZ(bx,by,z,z+6,14,C.ssD,14); cylZ(bx,by,z+6,z+14,10,C.blueL,14); bx+=gap;                     /* SAFETY RESET */
  if(o.knob){ cylZ(bx,by,z,z+8,18,C.ssD,16); cylZ(bx,by,z+8,z+22,12,C.black,12); bx+=gap; }        /* CONVEYOR SPEED */
  box(bx-26,bx+26,by-26,by+26,z,z+10,C.yellow,C.yellow); cylZ(bx,by,z+10,z+18,10,C.dark,12); cylZ(bx,by,z+18,z+32,21,C.red,18);  /* 비상정지 */
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
/* 메인 스위치 (적 · 황, +z 를 본다) */
function mainSwitch(x,y,z){ box(x-32,x+32,y-32,y+32,z,z+8,C.yellow,C.yellow); cylZ(x,y,z+8,z+22,24,C.red,16); box(x-6,x+6,y-30,y+30,z+18,z+34,C.red,C.red,0); }
/* 컨베이어 베드 스커트 (설비 구간의 새니터리 프레임) + 다리 */
function convBed(x0,x1,hw){
  hw=hw||60;
  for(const s of [-1,1]) box(x0,x1,CH-150,CH-62,s*hw,s*(hw+12),C.ssL);
  for(const x of [x0+50,x1-50]) for(const z of [-(hw-14),hw-14]){ foot(x,z,40); cylY(x,z,40,CH-150,16,C.ss,10); }
  for(const x of [x0+50,x1-50]) box(x-10,x+10,300,318,-(hw-14),hw-14,C.ss);
}
/* 레인 쪽 (A = 뒤 −1 · B · 단일 = 앞 +1) · 레인 중심 z */
const laneSide=lane=>lane<0?-1:1;
const laneC=lane=>(lane||0)*L.LZ;
/* 공압 스토퍼 (본체 · 널링 조정 캡 · 브래킷) : 레인 바깥쪽에 장착 · 핀은 동적 */
function frontStopper(x,lane){
  const b=BD(), y=CH+b.h*0.42, sd=laneSide(lane), zc=laneC(lane), len=lane<0?70:118;
  const z0=zc+sd*(b.d/2+34), z1=z0+sd*len;
  airCyl([x,y,z0],[x,y,z1],10);
  cylZ(x,y,z1,z1+sd*16,15,C.ssL,16);
  box(x-18,x+18,CH-60,y-14,z0+sd*30,z0+sd*48,C.ss);
}
function pinFront(x,v,lane){ const b=BD(), y=CH+b.h*0.42, sd=laneSide(lane), zc=laneC(lane), zr=zc+sd*(b.d/2+34), ze=zc-sd*6;
  tube([x,y,zr],[x,y,lerp(zr-sd*6,ze,v)],4.5,C.rodC,8); }
function clampPad(x,v,lane){ const b=BD(), y=CH+b.h*0.42, sd=laneSide(lane), zc=laneC(lane), zr=zc+sd*(b.d/2+34), cz=lerp(zr-sd*6,zc+sd*(b.d/2+3),v);
  tube([x,y,zr],[x,y,cz],4.5,C.rodC,8); box(x-10,x+10,y-10,y+10,Math.min(cz-sd,cz+sd*2),Math.max(cz-sd,cz+sd*2),C.rubber,C.rubber,0); }
/* 레인별 스토퍼 x 목록 (레일 절단 · 본체 배치 공용) */
function stopperXs(){
  const b=BD(), d=b.d, out=[];
  for(const x of [L.sg,L.pe]) out.push([x+d/2+7,0],[x-d-5,0]);
  for(const [x,ln] of [[L.n1,-1],[L.n2,1]]) out.push([x+d/2+7,ln],[x-d-5,ln]);
  for(const X of [L.lc1,L.lc2]){ const g=lcGeo(X); for(const ln of [-1,1]) out.push([g.gateFace+4,ln],[g.inFace+4,ln],[g.gateFace-1.5*d,ln]); }
  for(const ln of [-1,1]) out.push([L.mrg0+d/2+4,ln]);
  return out;
}

/* ── 설비 외곽 · 조작 패널 · 경광등 위치 (정적 · 동적 공용) ── */
const UAB={x0:-5200,x1:-3230,z0:-800,z1:400,yT:1800,col0:-4180,col1:-4020};
const DMCB={x0:-224,x1:1086};
const PEB={x0:3227,x1:4007,z0:-760,z1:220,yT:1780};
const RCB={x0:4688,x1:6438,z0:-1000,z1:220,yT:1980,mid:5568};
const RCBOWL={x:5018,y:1500,z:-470};
const CAP_PICK=130;                                  /* 헤드가 캡을 집는 터렛 각 (°) */
const SGH={x0:-190,x1:190,z0:-170,z1:150,yT:1760};  /* SG 헤드 박스 (L.sg 기준) */
/* HMI : [x, y, 앞면 z, 화면 w, 화면 h] · 경광등 : [x, z, 등 아래 y] */
const HMIS={ua:[-4100,1575,445,150,112], sg:[L.sg-40,1655,SGH.z1+6,150,110], dmc:[-290+L.dmcDX,1690,-40,230,172],
  wc:[L.lc2+420,1680,-150,250,188], pe:[3977,1570,345,150,112], rc:[RCB.x1+180,1650,230,230,172]};
const LAMPS={ua:[-4100,UAB.z1-70,UAB.yT+8], sg:[L.sg+140,40,SGH.yT+60], dmc:[-290+L.dmcDX,-75,1890],
  wc:[L.lc2+420,-185,1930], pe:[3977,310,1790], rc:[RCB.x1+180,195,1880]};

/* ═══ 정적 형상 ═══ */
let STATIC_KEY="";
function staticKey(){ const b=BD(); return [b.ml,VIEW3.guard?1:0].join("|"); }
function buildStatic(){
  STATIC_KEY=staticKey(); DOORS=[];
  geoBegin(GEO.stat);
  sConveyor(); sUA(); sSG(); sLoadCell(L.lc1,1); sDMC(); sLoadCell(L.lc2,2); sReject(); sPrinter(); sPE(); sRCS(); sTable(); sDust();
  R3.statDirty=true;
  geoBegin(GEO.dyn);
}

/* ── 컨베이어 (브라운 슬랫 체인 · 가이드 레일)
      단일(UA ~ 분기) → 분기부(넓은 베드 · 쐐기 가이드 · 분기 플랩) → 트윈 레인 A · B → 합류부 → 단일(리젝트 ~ 캡핑기) ── */
function sConveyor(){
  const b=BD(), w=44, LZ=L.LZ, W2=LZ+w+4;
  const gaps=[[L.lc1-L.lcW/2,L.lc1+L.lcW/2],[L.lc2-L.lcW/2,L.lc2+L.lcW/2]];
  const chain=(x0,x1,zc,hw)=>{ if(x1-x0<2) return; box(x0,x1,CH-10,CH,zc-hw,zc+hw,C.slat,C.slat,0); box(x0,x1,CH-96,CH-66,zc-hw+4,zc+hw-4,C.ssD); };
  const frame=(x0,x1,hw)=>{ if(x1-x0<2) return; box(x0,x1,CH-66,CH+5,-hw-16,-hw,C.ss); box(x0,x1,CH-66,CH+5,hw,hw+16,C.ss); };
  chain(XS,L.div0,0,w); frame(XS,L.div0,w);
  chain(L.div0,L.div1,0,W2); frame(L.div0,L.div1,W2);
  chain(L.mrg0,L.mrg1,0,W2); frame(L.mrg0,L.mrg1,W2);
  chain(L.mrg1,XE,0,w); frame(L.mrg1,XE,w);
  for(const x of [L.div0,L.mrg1]) for(const s of [-1,1]) box(x-8,x+8,CH-66,CH+5,s*(w+16),s*(W2+16),C.ss);
  /* 트윈 구간 (스테이션 데드 플레이트 자리는 비움) */
  let a=L.div1;
  for(const g of [...gaps,[L.mrg0,L.mrg0]]){
    for(const ln of [-1,1]) chain(a,g[0],ln*LZ,w);
    frame(a,g[0],W2); if(g[0]-a>2) box(a,g[0],CH-66,CH-12,-8,8,C.ssD);
    a=g[1];
  }
  /* 다리 (설비 몸체와 겹치지 않는 구간) */
  for(let x=XS+900;x<XE;x+=1150){
    if(x>UAB.x0-80&&x<UAB.x1+80) continue;
    if(Math.abs(x-L.sg)<560) continue;
    if(Math.abs(x-L.lc1)<380||Math.abs(x-L.lc2)<380) continue;
    if(x>DMCB.x0-80&&x<DMCB.x1+80) continue;
    if(x>PEB.x0-80&&x<RCB.x1+80) continue;
    const hz=(x>L.div0&&x<L.mrg1)?W2-6:w-6;
    for(const z of [-hz,hz]) { foot(x,z,40); cylY(x,z,40,CH-96,14,C.ss,10); }
    box(x-10,x+10,300,318,-hz,hz,C.ss);
  }
  /* 가이드 레일 : 병 지름 + 10 간격, 2단 · 별 손잡이 브래킷 */
  const zr=b.d/2+5, y1=CH+Math.max(16,b.h*0.28), y2=CH+b.h*0.70, d=b.d;
  const bracket=(x,z,side)=>{ box(x-8,x+8,CH+5,y2+10,z+side*(w-zr+10),z+side*(w-zr+22),C.ss);
    for(const y of [y1,y2]) box(x-6,x+6,y-6,y+6,Math.min(z,z+side*(w-zr+10)),Math.max(z,z+side*(w-zr+10)),C.ss,C.ss,0);
    cylZ(x,y2+22,z+side*(w-zr+16),z+side*(w-zr+40),13,C.black,6); };
  /* 직선 레일 (x0~x1, z 고정, 바깥 side 로 브래킷) */
  const rail=(x0,x1,z,side,levels)=>{
    if(x1-x0<30) return;
    for(const y of (levels||[y1,y2])) cylX(x0,x1,y,z,5,C.guide,10);
    if(side) for(let x=x0+60;x<x1-30;x+=430) bracket(x,z,side);
  };
  /* 곡선 레일 (zf(x)) */
  const crail=(x0,x1,zf)=>{ for(const y of [y1,y2]){ const pts=[]; for(let x=x0;x<=x1+0.1;x+=(x1-x0)/16) pts.push([x,y,zf(x)]); tubePath(pts,5,C.guide,8); } };
  const cut=(segs,cuts)=>{ let out=segs.slice();
    for(const c of cuts){ const nx=[]; for(const [p,q] of out){ if(c[1]<=p||c[0]>=q){nx.push([p,q]);continue;} if(c[0]>p) nx.push([p,c[0]]); if(c[1]<q) nx.push([c[1],q]); } out=nx; }
    return out; };
  const stx=stopperXs(), cutsOf=ln=>stx.filter(q=>q[1]===ln).map(q=>[q[0]-16,q[0]+16]);
  const stCut=[L.lc1,L.lc2].map(X=>{ const g=lcGeo(X); return [g.IN-d/2-30,g.OUT+d/2+30]; });
  /* 단일 구간 */
  const s1=[[XS+60,L.belt0-20],[L.belt1+20,L.div0]];
  for(const [p,q] of s1) rail(p,q,-zr,-1);
  for(const [p,q] of cut(s1,cutsOf(0))) rail(p,q,zr,1);
  const s2=[[L.mrg1,L.screw0]];
  for(const [p,q] of cut(s2,[[L.rej-40,L.rej+40]])) rail(p,q,-zr,-1);
  for(const [p,q] of cut(s2,[[L.rej-60,L.rej+60]])) rail(p,q,zr,1);
  /* 분기 · 합류 : 바깥 레일은 병 궤적 + zr , 가운데 쐐기 레일은 레인 사이 */
  for(const s of [-1,1]){ crail(L.div0,L.div1,x=>s*(LZ*laneBlend(x)+zr)); crail(L.mrg0,L.mrg1,x=>s*(LZ*laneBlend(Math.min(x,L.mrg1-0.1))+zr)); }
  const bw=(zr+4)/LZ;
  if(bw<1){
    let xw=L.div0; while(xw<L.div1&&laneBlend(xw)<bw) xw+=4;
    let xm=L.mrg1; while(xm>L.mrg0&&laneBlend(xm)<bw) xm-=4;
    for(const s of [-1,1]){ crail(xw,L.div1,x=>s*Math.max(0,LZ*laneBlend(x)-zr)); crail(L.mrg0,xm,x=>s*Math.max(0,LZ*laneBlend(Math.min(x,L.mrg1-0.1))-zr)); }
    for(const x of [xw,xm]) cylY(x,0,CH+2,y2+8,6,C.guide,10);
    DIV_TIP=xw;
  } else DIV_TIP=L.div1;
  /* 트윈 구간 : 레인마다 바깥 · 안쪽 레일 (스테이션 구간은 스테이션 레일) */
  const tw=cut([[L.div1,L.mrg0]],stCut);
  for(const ln of [-1,1]){
    for(const [p,q] of cut(tw,cutsOf(ln))) rail(p,q,ln*(LZ+zr),ln);
    for(const [p,q] of tw) rail(p,q,ln*(LZ-zr),0);
  }
  for(const [p,q] of tw) for(let x=p+120;x<q-40;x+=430){                       /* 가운데 브래킷 (두 안쪽 레일 공용) */
    box(x-7,x+7,CH-4,y2+14,-5,5,C.ss);
    for(const y of [y1,y2]) box(x-5,x+5,y-5,y+5,-(LZ-zr),LZ-zr,C.ss,C.ss,0);
    cylY(x,0,y2+14,y2+30,12,C.black,6); }
  rail(L.screw0,L.A.x-20,-zr,-1);
  rail(L.B.x+20,XE-20,zr,1); rail(L.B.x+20,XE-20,-zr,-1);
  /* 스타휠 바깥 가이드 (원호) — 터렛 구간은 타이밍 벨트가 잡는다 */
  const arcRail=(c,a0,a1,rr)=>{ for(const y of [y1,y2]){ const pts=[]; for(let i=0;i<=24;i++){ const a=a0+(a1-a0)*i/24; pts.push([c.x+rr*Math.cos(a),y,c.z+rr*Math.sin(a)]); } tubePath(pts,5,C.guide,8); } };
  arcRail(L.A,Math.PI/2+0.12,PATH.aT+0.1,L.R+zr);
  arcRail(L.B,PATH.bT-0.1,Math.PI/2-0.12,L.R+zr);
  /* 스토퍼 본체 */
  for(const [x,ln] of stx) frontStopper(x,ln);
  /* 분기 플랩 받침 */
  cylY(DIV_TIP,0,CH-10,CH+2,14,C.ssD,12);
}
let DIV_TIP=0;

/* ── UA-120 : 스테인리스 하부 캐비닛 + 알루미늄 프레임 아크릴 가드 3칸
      왼칸 = 레벨 디스크 소터 · 가운데 기둥 = HMI · 경광등 · 오른칸 = 사이드 벨트(앞) + 벌크 호퍼(뒤) ── */
function sUA(){
  const b=BD(), tt=L.tt, U=UAB, hp=L.hop;
  cabinet(U.x0,U.x1,110,CH-100,U.z0,U.z1,{doors:3});
  box(U.x0-10,U.x1+10,CH-100,CH-86,U.z0-10,U.z1+10,C.ssL,C.ssL);           /* 상판 */
  handWheel(U.x1-230,600,U.z1+1,95);                                      /* 사이드 벨트 높이 조정 */
  mainSwitch(U.x0+200,640,U.z1+1);
  /* 상부 가드 : 왼칸(디스크) · 가운데 기둥 · 오른칸(벨트 · 호퍼) — 앞 도어는 위로 여는 방식 */
  alFrame(U.x0,U.x1,CH-86,U.yT,U.z0,U.z1,{mx:[U.col0,U.col1], fskip:[1],
    door:{0:{id:"uaL",hinge:"top"},2:{id:"uaR",hinge:"top"}},
    hole:{r:[-110,110,CH-90,CH+b.h+60]}});
  /* 가운데 기둥 : 조작 패널 (위) · 점검창 (아래) */
  const H=HMIS.ua;
  cntHMI(H[0],H[1],H[2],H[3],H[4]);
  box(U.col0+20,U.col1-20,1350,1375,U.z1-80,U.z1+10,C.ssL,C.ssL);
  panelZ(U.col0+20,U.col1-20,CH-46,1350,U.z1+2);
  lampPole(LAMPS.ua[0],LAMPS.ua[1],U.yT,U.yT);
  /* 레벨 디스크 소터 : 드럼 · 림 · 높이 조정 나사 기둥 */
  cylY(tt.x,tt.z,CH-86,CH-14,tt.r+22,C.ss,48);
  mPush(); mT(tt.x,0,tt.z);
  const gap=(b.d/2+16)/tt.r;
  lathe([[tt.r+4,CH-14],[tt.r+4,CH+120],[tt.r+14,CH+120],[tt.r+14,CH-14]],C.ss,44,Math.PI/2+gap,Math.PI/2-gap+Math.PI*2);
  mPop();
  const px=U.x0+62;
  for(const z of [tt.z-230,tt.z+130]){ cylY(px,z,CH-86,1420,14,C.ss,10); cylY(px,z,CH+20,1360,9,C.brushed,8);
    box(px-24,px+24,1180,1240,z-30,z+30,C.black,C.black); }
  box(px-22,px+22,1420,1450,tt.z-260,tt.z+160,C.ss);
  cylY(px,(tt.z-230+tt.z+130)/2,1450,1520,16,C.ssL,12);
  /* 출구 안내 가이드 (디스크 → 사이드 벨트) */
  for(const s of [-1,1]) box(tt.x-20,tt.x+90,CH+2,CH+b.h*0.6,s*(b.d/2+5),s*(b.d/2+11),C.guide,C.guide,0);
  /* 벌크 호퍼 (가드 안 뒤쪽) : 스테인리스 통 + 경사 바닥 브라운 체인 벨트 + 레벨 센서 */
  const y0=hp.y0, y1=hp.y1;
  box(hp.x0,hp.x1,y0,y0+14,hp.z0,hp.z1,C.ss);
  box(hp.x0,hp.x0+4,y0,y1,hp.z0,hp.z1,C.ss); box(hp.x1-4,hp.x1,y0,y1,hp.z0,hp.z1,C.ss);
  box(hp.x0,hp.x1,y0,y1,hp.z0,hp.z0+4,C.ss); box(hp.x0,hp.x1,y0,y1-120,hp.z1-4,hp.z1,C.ss);
  quad([hp.x0+4,y0+60,hp.z0+4],[hp.x0+4,y0+60,hp.z1-4],[hp.x1-4,y0+240,hp.z1-4],[hp.x1-4,y0+240,hp.z0+4],[0.36,0.25,0.19,0.08]);
  for(const x of [hp.x0+40,hp.x1-40]) for(const z of [hp.z0+40,hp.z1-40]) cylY(x,z,CH-86,y0,16,C.ss,10);
  cylY(hp.x1-60,hp.z0+30,y1-160,y1-90,12,C.dark,10);
  /* 가변속 엘리베이터 (녹색 클리트 벨트) : 호퍼 → 디스크 */
  const e0=UA_EL[0], e1=UA_EL[1];
  mPush(); const len=mAlong(e0,e1);
  box(-120,-110,0,len,-50,40,C.ss); box(110,120,0,len,-50,40,C.ss); box(-110,110,0,len,-70,-44,C.ss);
  cylZ(0,30,-38,60,26,C.ssD,14); cylZ(0,len-30,-38,60,26,C.ssD,14);
  mPop();
  cylY(e1[0],e1[2],CH-86,e1[1]-40,20,C.ss,10); cylY(e0[0]-40,e0[2],CH-86,e0[1],20,C.ss,10);
  /* 배출 슈트 (엘리베이터 → 디스크) */
  quad([e1[0]-70,e1[1]-20,e1[2]-60],[e1[0]+70,e1[1]-20,e1[2]-60],[tt.x+20,CH+150,tt.z-40],[tt.x-140,CH+150,tt.z-40],C.ss);
  /* 반전 사이드 벨트 : 흰 풀리 · 폭 조정 브래킷 · 눈금 */
  const zb=b.d/2+8, ym=CH+b.h/2;
  for(const x of [L.belt0,L.belt1]) for(const s of [-1,1]){
    box(x-55,x+55,CH+6,CH+b.h+6,s*(zb+14),s*(zb+80),C.ss);
    cylY(x,s*(zb+6),CH+2,CH+b.h+10,46,C.uhmw,20);
    cylY(x,s*(zb+6),CH+b.h+10,CH+b.h+22,16,C.ssL,12);
  }
  for(let x=L.belt0+200;x<L.belt1-100;x+=420) for(const s of [-1,1]){ box(x-12,x+12,CH-86,CH+b.h+40,s*(zb+90),s*(zb+110),C.ss); cylZ(x,CH+b.h+30,s*(zb+14),s*(zb+100),7,C.ssD,8); }
  for(const s of [-1,1]) box(L.belt0+60,L.belt1-60,CH+b.h+44,CH+b.h+52,s*(zb+86),s*(zb+114),C.ssL,C.ssL,0);
  for(let x=L.belt0+80;x<L.belt1-80;x+=60) box(x-1,x+1,CH+b.h+52,CH+b.h+53,zb+90,zb+104,C.dark,C.dark,0);
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
  box(U.x1-420,U.x1-320,560,760,U.z1,U.z1+40,C.dark); cylZ(U.x1-370,720,U.z1+40,U.z1+50,26,C.white,20); cylY(U.x1-370,U.z1+20,560,600,20,[0.75,0.82,0.9,0.1],14);
}
/* UA 엘리베이터 : 호퍼 바닥 → 디스크 위 */
const UA_EL=[[L.hop.x0-40,1110,-520],[L.tt.x+180,1560,-600]];
/* 호스 (3점 곡선) */
function hoseTo(a,m,e,r,col){ const pts=[]; for(let i=0;i<=10;i++){ const t=i/10,u=1-t; pts.push([u*u*a[0]+2*u*t*m[0]+t*t*e[0],u*u*a[1]+2*u*t*m[1]+t*t*e[1],u*u*a[2]+2*u*t*m[2]+t*t*e[2]]); } tubePath(pts,r,col,10); }

/* ── SG-120 : 기둥형 받침 캐비닛 + 뒤 전기함(기둥 4개) · 헤드 박스(위 HMI · 아래 점검 도어)
      · 왼쪽 암 끝 원통 릴 커버 · 윗면 흰 가이드 롤러 2개 · 창 안 트윈 벨트 이송 유닛 ── */
function sgHeadY(){ const b=BD(); return {y0:CH+b.h+130, y1:CH+b.h+320}; }
/* 릴 · 롤러 위치 (정적 · 동적 공용) */
function insCfg(k){
  const H=sgHeadY();
  if(k==="sg"){ const x=L.sg; return {x, rx:x-440, ry:1700, rz:-40, wd:34, r0:40, rF:150, R:200, top:[[x-120,SGH.yT+44],[x+30,SGH.yT+44]]}; }
  const x=L.pe; return {x, wd:92, r0:40, rF:105};
}
function sSG(){
  const x=L.sg, b=BD(), H=sgHeadY(), I=insCfg("sg"), G=SGH;
  /* 받침 캐비닛 · 컨베이어 베드 */
  cabinet(x-230,x+230,110,CH-150,-700,230,{doors:1,front:230});
  box(x-250,x+250,CH-150,CH-136,-720,250,C.ssL,C.ssL);
  convBed(x-400,x+360);
  /* 뒤 전기함 : 기둥 4개 위 · 메인 스위치 */
  for(const px of [x-180,x+180]) for(const pz of [-640,-380]) cylY(px,pz,CH-136,1010,18,C.brushed,12);
  box(x-250,x+250,1010,1520,-700,-320,C.cab,C.ssL);
  mainSwitch(x-150,1380,-319);
  box(x+60,x+200,1180,1260,-320,-316,C.white,C.white,0);
  /* 헤드 박스 (연회색 판금) : 뒤 전기함에 고정 */
  const hx0=x+G.x0, hx1=x+G.x1, hy0=H.y0-40, hy1=G.yT, hz0=G.z0, hz1=G.z1, t=12;
  const col=[0.84,0.86,0.88,0.35];
  box(hx0,hx1,hy0,hy1,hz0,hz0+t,col,col);
  box(hx0,hx0+t,hy0,hy1,hz0,hz1,col,col); box(hx1-t,hx1,hy0,hy1,hz0,hz1,col,col);
  box(hx0,hx1,hy1-t,hy1,hz0,hz1,col,col);
  box(hx0,x-40,hy0,hy0+t,hz0,hz1,col,col); box(x+40,hx1,hy0,hy0+t,hz0,hz1,col,col);
  box(x-40,x+40,hy0,hy0+t,hz0,-40,col,col); box(x-40,x+40,hy0,hy0+t,40,hz1,col,col);
  box(x-120,x+120,hy0+120,hy1-80,-320,hz0,C.cab,C.ssL);                     /* 전기함 연결 브래킷 */
  /* 앞면 : 위 = HMI 판 · 아래 = 점검 도어(창) */
  const wy1=Math.max(hy0+200,1500);
  box(hx0,hx1,wy1,hy1,hz1-t,hz1,col,col);
  box(hx0,hx0+30,hy0,wy1,hz1-t,hz1,col,col); box(hx1-30,hx1,hy0,wy1,hz1-t,hz1,col,col);
  glassBox(hx0+30,hx1-30,hy0+t,wy1,hz1-6,hz1-2,C.acryl,0.15);
  for(const [a,c,d,e] of [[hx0+26,hx1-26,hy0+t,hy0+t+8],[hx0+26,hx1-26,wy1-8,wy1],[hx0+26,hx0+34,hy0+t,wy1],[hx1-34,hx1-26,hy0+t,wy1]]) box(a,c,d,e,hz1-2,hz1+4,C.brushed,C.brushed,0);
  for(const hy2 of [hy0+60,wy1-60]) box(hx0+2,hx0+22,hy2-24,hy2+24,hz1,hz1+8,C.ssD,C.ssD,0);   /* 경첩 */
  const Hm=HMIS.sg; cntHMI(Hm[0],Hm[1],Hm[2],Hm[3],Hm[4],{flush:true});
  box(hx1-70,hx1-20,hy1-40,hy1-18,hz1,hz1+1.5,C.dark,C.dark,0);            /* CE · COUNTEC */
  /* 창 안 : 트윈 벨트 이송 유닛 · 커터 블록 · 레버 · 센서 SE2 · SE6 · 도어 스위치 SW3 */
  const by0=H.y0+50, by1=H.y0+290;
  box(x-150,x+150,by0-30,by1+30,hz0+t,hz0+t+10,C.ssL,C.ssL,0);             /* 뒤 판 */
  for(const s of [-1,1]){
    box(x+s*14,x+s*62,by0,by1,-40,40,C.brushed);
    for(const yy of [by0+14,by1-14]){ cylZ(x+s*38,yy,40,48,13,C.ssL,14); cylZ(x+s*38,yy,48,52,6,C.dark,10); }
  }
  box(x-150,x+150,H.y0+6,H.y0+22,-70,70,C.ssL);                            /* 커터 받침판 */
  box(x-110,x-60,by0+40,by0+70,-10,60,C.ss); tube([x-85,by0+55,60],[x-150,by0-10,110],7,C.ssL,8); ellipsoid([x-156,by0-18,114],[18,18,18],C.black,10,6);
  box(x-150,x-110,by1-10,by1+30,20,50,C.ss); box(x-146,x-116,by1+2,by1+18,50,52,C.yellow,C.yellow,0);
  box(x+100,x+140,by0+30,by0+70,20,56,C.green,C.green);                    /* SE6 */
  box(x+96,x+144,by1-30,by1+50,10,48,C.red,C.red);                         /* SW3 */
  /* 가이드 튜브 (투명) */
  const tr=Math.max(9,b.nk/2-4);
  const g=gAlpha; gAlpha=0.28; tube([x,CH+b.h+16,0],[x,H.y0,0],tr+2,C.acryl,16,false); gAlpha=g;
  cylY(x,0,CH+b.h+12,CH+b.h+18,tr+5,C.ss,16);
  /* 윗면 : 흰 가이드 롤러 2개 · 투입 슬롯 */
  for(const [rx,ry] of I.top){ cylZ(rx,ry,-34,34,26,C.uhmw,20); cylZ(rx,ry,-38,38,9,C.ssL,12); box(rx-10,rx+10,hy1,ry,-44,-36,C.ssL); }
  box(x-30,x+30,hy1,hy1+4,-24,24,C.dark,C.dark,0);
  /* 릴 : 박스 암 · 원통 커버 (앞 짙은 투명창) */
  const Rr=I.R;
  box(I.rx+Rr-20,hx0,I.ry-40,I.ry+40,-130,-50,C.ssL);
  box(hx0-60,hx0,I.ry-70,I.ry+70,-140,-40,C.ssL);
  cylZ(I.rx,I.ry,-150,70,Rr,C.ss,40,false);
  mPush(); mT(I.rx,I.ry,-150); mRX(Math.PI/2); disc(0,0,Rr,C.ss,40); mPop();
  cylZ(I.rx,I.ry,-150,-120,24,C.ssD,14);                                   /* 릴 축 받침 (앞 뚜껑은 동적) */
  box(I.rx+Rr*0.55,I.rx+Rr*0.95,I.ry-Rr-2,I.ry-Rr+14,-40,60,C.ssL);       /* 띠 출구 */
  lampPole(LAMPS.sg[0],LAMPS.sg[1],hy1,LAMPS.sg[2]-8);
}

/* ── 로드셀 스테이션 (전단 1 · 후단 2) : 전용 캐비닛 + 서보 · 아크릴 박스 · 데드 플레이트 원형 팬 2개 · 포크 이송부 ── */
function sLoadCell(X,i){
  const b=BD(), P=L.lcP, hw=L.lcW/2, g=lcGeo(X), LZ=L.LZ, d=b.d;
  cabinet(X-290,X+290,110,CH-176,-360,300,{doors:2,front:300});
  box(X-300,X+300,CH-176,CH-160,-370,310,C.ssL,C.ssL);
  box(X+150,X+280,CH-310,CH-200,300,380,[0.68,0.72,0.76,0.6]); box(X+280,X+320,CH-300,CH-210,308,372,C.black,C.black);   /* 서보 M3 */
  box(X+184,X+220,CH-250,CH-236,380,381,C.yellow,C.yellow,0);
  /* 데드 플레이트 · 원형 계량 팬 (레인 A 뒤 · 레인 B 앞) · 로드셀 하우징 */
  box(X-hw,X+hw,CH-14,CH-2,-(LZ+64),LZ+64,C.brushed,C.brushed,0);
  for(const ln of [-1,1]){ const zc=ln*LZ;
    mPush(); mT(g.PAN,0,zc); disc(CH-1.4,58,63,C.black,32); mPop();
    cylY(g.PAN,zc,CH-160,CH-14,22,C.ssD,12); box(g.PAN-70,g.PAN+70,CH-150,CH-14,zc-50,zc+50,C.ssD); }
  /* 포크 이송부 : 앞쪽 리니어 가이드 · 받침판 */
  box(X-300,X+300,CH-160,CH-130,170,350,C.ssL);
  box(X-280,X+280,CH-130,CH-116,220,246,C.ssD,C.ssD,0);
  for(const z of [220,246]) box(X-280,X+280,CH-116,CH-110,z-4,z+4,C.ss,C.ss,0);
  box(X-60,X+280,CH-130,CH-120,300,370,C.ss,C.ss,0);
  /* 아크릴 박스 가드 */
  alFrame(X-320,X+320,CH-160,CH+430,-380,420,{hole:{l:[-160,160,CH-162,CH+b.h+60],r:[-160,160,CH-162,CH+b.h+60]}});
  /* 스테이션 가이드 레일 (윗단 1줄 · 잎 모양 끝) : 아래는 포크 핑거가 지나간다 */
  const zr=d/2+5, y2=CH+b.h*0.70, x0=g.IN-d/2-30, x1=g.OUT+d/2+30;
  for(const ln of [-1,1]){
    for(const [z,cutIn] of [[ln*(LZ+zr),true],[ln*(LZ-zr),false]]){
      const segs=cutIn?[[x0,g.inFace-12],[g.inFace+20,x1]]:[[x0,x1]];
      for(const [p,q] of segs) cylX(p,q,y2,z,5,C.guide,10);
      for(const xe of [x0-20,x1+20]) ellipsoid([xe,y2,z],[26,4,4],C.guide,8,4);
    }
    box(X-hw+20,X-hw+36,CH+5,y2+10,ln*(LZ+zr+6),ln*(LZ+zr+60),C.ss); box(X+hw-36,X+hw-20,CH+5,y2+10,ln*(LZ+zr+6),ln*(LZ+zr+60),C.ss);
  }
  for(const x of [X-hw+28,X+hw-28]){ box(x-6,x+6,CH-2,y2+10,-6,6,C.ss); box(x-5,x+5,y2-5,y2+5,-(LZ-zr),LZ-zr,C.ss,C.ss,0); }
  /* 교정 라벨 */
  box(X-120,X-30,CH-160,CH-120,310.5,311,C.white,C.white,0); box(X+100,X+140,CH-150,CH-138,310.5,311,C.yellow,C.yellow,0);
  /* 후단 : 중량선별 PLC 조작 패널 (뒤쪽 기둥) */
  if(i===2){
    const Hm=HMIS.wc;
    foot(Hm[0],-220,40); cylY(Hm[0],-220,40,Hm[1]-Hm[4]/2-100,34,C.ss,14);
    cntHMI(Hm[0],Hm[1],Hm[2],Hm[3],Hm[4],{knob:true});
    lampPole(LAMPS.wc[0],LAMPS.wc[1],Hm[1]+Hm[4]/2+34,LAMPS.wc[2]-8);
  }
}

/* ── DMC-60T : 기둥형 받침 캐비닛(메인 스위치 · 팬) · 크롬 기둥 위 경사 헤드 · 골판 3단 트레이 · 뒤 호퍼
      · 앞 센서 박스(점검창 2) · 게이트 · 백색 원뿔 노즐 2 · S자 파이프 암 HMI · 천장 집진 배관 ── */
function dmcGateY(){ return CH+BD().h+175; }
const DMC={x0:-956,x1:-644,tw:26,t3z0:-400,t3z1:-172,t3y:1462, t2:{x0:-1000,x1:-600,z0:-620,z1:-400,y:1510}, t1:{x0:-960,x1:-640,z0:-760,z1:-620,y:1556},
  hop:{x0:-1080,x1:-520,z0:-920,z1:-500,y1:1800,ox0:-880,ox1:-720,oz0:-780,oz1:-660,y0:1640}};
/* 골판(물결) 트레이 : x 방향 12 홈 */
function corrTray(t,n,amp,col){
  const w=(t.x1-t.x0)/n;
  for(let i=0;i<n;i++){
    const xa=t.x0+i*w, xm=xa+w/2, xb=xa+w;
    quad([xa,t.y+amp,t.z0],[xa,t.y+amp,t.z1],[xm,t.y,t.z1],[xm,t.y,t.z0],col);
    quad([xm,t.y,t.z0],[xm,t.y,t.z1],[xb,t.y+amp,t.z1],[xb,t.y+amp,t.z0],col);
  }
  box(t.x0-4,t.x0,t.y,t.y+amp+30,t.z0,t.z1,C.ss,C.ss,0); box(t.x1,t.x1+4,t.y,t.y+amp+30,t.z0,t.z1,C.ss,C.ss,0);
  box(t.x0,t.x1,t.y,t.y+amp+30,t.z0-4,t.z0,C.ss,C.ss,0);
}
function sDMC(){
  const b=BD(), yG=dmcGateY(), DX=L.dmcDX, n1=L.n1-DX, n2=L.n2-DX;
  mPush(); mT(DX,0,0);
  /* 받침 캐비닛 · 윗판 · 크롬 기둥 4 */
  cabinet(-1110,-530,110,980,-800,-245,{doors:1,front:-245});
  mainSwitch(-1020,860,-244);
  cylZ(-820,860,-245,-239,60,C.ssD,24); for(let r=20;r<=56;r+=12){ mPush(); mT(-820,860,-238); mRX(-Math.PI/2); disc(0,r-1.5,r,C.dark,24); mPop(); }
  for(let y=260;y<460;y+=18) box(-900,-740,y,y+8,-245,-242,C.dark,C.dark,0);   /* 루버 */
  box(-1150,-490,980,1000,-840,-215,C.ssL,C.ssL);
  convBed(DMCB.x0-DX,DMCB.x1-DX,L.LZ+60);
  for(const px of [-1060,-580]) for(const pz of [-860,-260]){ cylY(px,pz,1000,1160,26,C.rodC,16); mPush(); mT(px,1000,pz); lathe([[40,0],[30,8],[26,14]],C.uhmw,16); mPop(); }
  /* 경사 헤드 몸체 (뒤가 높다) : 옆에서 보면 사다리꼴 */
  const zf=-150, zb=-960, yb=1160, ytf=1440, ytb=1560;
  const P=(x,y,z)=>[x,y,z];
  for(const x of [-1110,-530]) quad(P(x,yb,zb),P(x,yb,zf),P(x,ytf,zf),P(x,ytb,zb),C.cab);
  quad(P(-1110,yb,zf),P(-530,yb,zf),P(-530,ytf,zf),P(-1110,ytf,zf),C.cab);
  quad(P(-530,yb,zb),P(-1110,yb,zb),P(-1110,ytb,zb),P(-530,ytb,zb),C.cab);
  quad(P(-1110,yb,zb),P(-530,yb,zb),P(-530,yb,zf),P(-1110,yb,zf),C.cabD);
  quad(P(-1110,ytb,zb),P(-1110,ytf,zf),P(-530,ytf,zf),P(-530,ytb,zb),C.ssD);
  box(-1060,-580,1200,1380,-151,-150,[0.74,0.77,0.80,0.6],null,0);           /* 앞 점검판 */
  for(const [yy,zz] of [[1250,-500],[1250,-700]]) box(-1112,-1110,yy-70,yy+70,zz-160,zz+160,[0.72,0.75,0.78,0.6],null,0);
  /* 호퍼 (뒤 · 위) : 기둥 2 · 출구 · 레벨 센서 · 타공 1단 트레이 */
  const h=DMC.hop;
  const H0=[[h.x0,h.y1,h.z0],[h.x1,h.y1,h.z0],[h.x1,h.y1,h.z1],[h.x0,h.y1,h.z1]], H1=[[h.ox0,h.y0,h.oz0],[h.ox1,h.y0,h.oz0],[h.ox1,h.y0,h.oz1],[h.ox0,h.y0,h.oz1]];
  for(let i=0;i<4;i++){ const j=(i+1)%4; quad(H0[i],H0[j],H1[j],H1[i],C.ss); tube(H0[i],H0[j],6,C.ssL,8); }
  box(h.ox0,h.ox1,h.y0-30,h.y0,h.oz0,h.oz1,C.ssD);
  for(const px of [-1030,-570]){ cylY(px,-840,1500,1740,22,C.rodC,14); box(px-30,px+30,1740,1760,-900,-780,C.ss); }
  box(-1060,-540,1740,1752,-800,-770,C.ss);
  for(const px of [-880,-720]) cylZ(px,1680,-790,-760,18,C.ssL,14);          /* 게이트 조정 노브 */
  cylY(-760,-700,1700,1760,6,C.ss,8); cylY(-760,-700,1760,1778,14,C.ssL,12);
  cylY(-520,-900,h.y1-120,h.y1-60,14,C.dark,10);
  /* 트레이 1 (타공) · 2 · 3 (골판 12 홈) */
  const t1=DMC.t1;
  box(t1.x0,t1.x1,t1.y-6,t1.y,t1.z0,t1.z1,C.brushed,C.brushed,0);
  for(let x=t1.x0+14;x<t1.x1-10;x+=16) for(let z=t1.z0+12;z<t1.z1-8;z+=16) box(x-2.5,x+2.5,t1.y,t1.y+0.4,z-2.5,z+2.5,C.dark,C.dark,0);
  box(t1.x0-4,t1.x0,t1.y,t1.y+36,t1.z0,t1.z1,C.ss,C.ss,0); box(t1.x1,t1.x1+4,t1.y,t1.y+36,t1.z0,t1.z1,C.ss,C.ss,0);
  corrTray(DMC.t2,12,12,C.brushed);
  const t3={x0:DMC.x0,x1:DMC.x1,z0:DMC.t3z0,z1:DMC.t3z1,y:DMC.t3y-4};
  corrTray(t3,12,10,[0.66,0.69,0.72,0.85]);
  box(DMC.x0-40,DMC.x1+40,DMC.t3y-40,DMC.t3y-14,DMC.t3z0,DMC.t3z1,C.black,C.black);   /* 검은 콤 받침 */
  for(let i=0;i<=12;i++){ const x=DMC.x0+i*DMC.tw; box(x-3,x+3,DMC.t3y-40,DMC.t3y-10,DMC.t3z1-40,DMC.t3z1,C.black,C.black,0); }
  for(const px of [-1030,-570]) for(const pz of [-600,-240]){ cylY(px,pz,1450,1500,8,C.ss,8); cylY(px,pz,1500,1512,11,C.ssL,8); }
  /* 트레이 벽 · 아크릴 덮개 */
  box(-1110,-1096,1440,1590,-960,-172,C.ss); box(-544,-530,1440,1590,-960,-172,C.ss);
  guardPanel(-1096,-544,1586,1592,-600,-172);
  /* 센서 박스 : 앞으로 돌출 · 윗면 점검창 2 · 12 창 · 좌우 널링 노브 */
  const sy0=1300, sy1=1446, sz0=-200, sz1=50;
  box(-1000,-600,sy0,sy1,sz0,sz1,[0.72,0.75,0.78,0.7],[0.78,0.81,0.84,0.7]);
  for(const cx of [-890,-710]){ box(cx-70,cx+70,sy1,sy1+6,-130,-60,[0.55,0.62,0.70,0.3]); glassBox(cx-60,cx+60,sy1+6,sy1+9,-122,-68,C.acryl,0.4); }
  for(const sx of [-1000,-600]){ cylX(sx-(sx<-800?30:-30),sx,1380,0,22,C.ssL,16); cylX(sx-(sx<-800?44:-44),sx-(sx<-800?30:-30),1380,0,18,C.brushed,16); }
  for(let i=0;i<12;i++){ const xc=DMC.x0+i*DMC.tw+DMC.tw/2; box(xc-9,xc+9,sy0-1,sy0,-120,-60,[0.04,0.05,0.06,0.2],null,0); }
  /* 게이트 하우징(스테인리스 틀 + 앞 창) · 중앙 실린더 · 백색 원뿔 노즐 */
  for(const [nx,nz] of [[n1,-L.LZ],[n2,L.LZ]]){                      /* 노즐 A (레인 A · 뒤) · 노즐 B (레인 B · 앞) */
    const top=sy0, gy=yG+28;
    quad([nx-70,top,-60],[nx+70,top,-60],[nx+42,gy,nz-40],[nx-42,gy,nz-40],C.ss);
    quad([nx+70,top,40],[nx-70,top,40],[nx-42,gy,nz+40],[nx+42,gy,nz+40],C.ss);
    quad([nx-70,top,40],[nx-70,top,-60],[nx-42,gy,nz-40],[nx-42,gy,nz+40],C.ss);
    quad([nx+70,top,-60],[nx+70,top,40],[nx+42,gy,nz+40],[nx+42,gy,nz-40],C.ss);
    glassBox(nx-40,nx+40,yG-34,yG+28,nz-40,nz+40,C.acryl,0.24);
    for(const sx of [-40,40]) for(const sz of [-40,40]) box(nx+sx-3,nx+sx+3,yG-34,yG+28,nz+sz-3,nz+sz+3,C.ss,C.ss,0);
    box(nx-52,nx+52,yG-40,yG-32,nz-52,nz+52,C.ss,C.ss,0);
    for(const sx of [-46,46]) cylZ(nx+sx,yG-36,nz+52,nz+68,12,C.brushed,14);
    const nr=Math.min(15,b.nk/2-3);
    mPush(); mT(nx,0,nz); lathe([[48,yG-40],[46,yG-44],[nr+2,CH+b.h+16],[nr,CH+b.h+12]],C.uhmw,24); mPop();
  }
  airCyl([(n1+n2)/2,yG+60,0],[(n1+n2)/2,yG+60,-60],13);
  /* 병 스토퍼 브래킷은 컨베이어 쪽 (sConveyor) */
  /* S자 파이프 암 · 조작 패널 · 경광등 */
  const Hm=HMIS.dmc, yb2=Hm[1]-Hm[4]/2-100;
  tubePath([[-560,1000,-460],[-470,1060,-440],[-380,1140,-380],[-310,1250,-280],[-290,1340,-170],[-290,yb2,-80]],28,C.rodC,16);
  cylY(-290,-80,yb2-30,yb2,40,C.ss,16);
  cntHMI(Hm[0]-DX,Hm[1],Hm[2],Hm[3],Hm[4],{knob:true});
  lampPole(LAMPS.dmc[0]-DX,LAMPS.dmc[1],Hm[1]+Hm[4]/2+34,LAMPS.dmc[2]-8);
  mPop();
}

/* ── 리젝트 : 후단 스테이션 오른쪽 · 뒤 푸셔 → 앞 곡면 스테인리스 트레이 ── */
function sReject(){
  const x=L.rej, b=BD(), bin=L.rejBin;
  airCyl([x,CH+b.h*0.42,-330],[x,CH+b.h*0.42,-130],22);
  box(x-28,x+28,CH-60,CH+b.h*0.42+30,-350,-320,C.ss);
  /* 곡면 트레이 : 경사 바닥 · 옆벽 · 둥근 앞 끝 · 크롬 U 다리 */
  const tw=150, zA=60, zB=460, yA=CH-12, yB=CH-190;
  quad([x-tw,yA,zA],[x+tw,yA,zA],[x+tw,yB,zB],[x-tw,yB,zB],C.ssL);
  for(const s of [-1,1]) quad([x+s*tw,yA-6,zA],[x+s*tw,yB-6,zB],[x+s*tw,yB+90,zB],[x+s*tw,yA+50,zA],C.ss);
  mPush(); mT(x,0,zB); lathe([[tw,yB-6],[tw,yB+90],[tw+6,yB+90],[tw+6,yB-6]],C.ss,20,0,Math.PI); disc(yB-6,0,tw,C.ssL,20,0,Math.PI); mPop();
  for(const s of [-1,1]) tubePath([[x+s*110,0,bin.z+60],[x+s*110,yB-120,bin.z+60],[x+s*110,yB-20,bin.z+20]],14,C.rodC,12);
  for(const s of [-1,1]) foot(x+s*110,bin.z+60,20);
}
/* ── 성적서 프린터 카트 (아크릴 커버) ── */
function sPrinter(){
  const x0=L.lc2-30,x1=L.lc2+280,z0=470,z1=850;
  for(const x of [x0+30,x1-30]) for(const z of [z0+30,z1-30]){ cylY(x,z,0,40,22,[0.72,0.16,0.14,0.2],12); cylY(x,z,40,560,11,C.ss,10); }
  box(x0,x1,70,90,z0,z1,C.ss); box(x0,x1,540,560,z0,z1,C.ss);
  box(x0+30,x1-30,90,300,z0+40,z1-40,[0.28,0.29,0.31,0.3],[0.34,0.35,0.37,0.3]);
  box(x0+60,x1-60,300,330,z0+60,z1-60,[0.22,0.23,0.25,0.3]);
  glassBox(x0+4,x1-4,90,540,z0+4,z1-4,C.acryl,0.14);
}

/* ── HPE-100 : 하부 캐비닛 + 알루미늄 프레임 양문 가드 · 오른쪽 폴 HMI
      뒤 필름 롤 2군(가로) · 장구 롤러 · 캐리지 2조 · 톱날 커터 · 스포크 인덱싱 디스크(튜브 8) · 앞 수직 푸셔 ── */
const PED={n:8, r:150, zc:-150};
function peDiscY(){ const b=BD(); return CH+b.h+14+220; }
function sPE(){
  const x=L.pe, b=BD(), P=PEB, yD=peDiscY(), mid=(P.x0+P.x1)/2;
  cabinet(P.x0,P.x1,110,CH-110,P.z0,P.z1,{doors:2,front:P.z1});
  mainSwitch(P.x0+130,660,P.z1+1);
  box(P.x0-10,P.x1+10,CH-110,CH-96,P.z0-10,P.z1+10,C.ssL,C.ssL);
  alFrame(P.x0,P.x1,CH-96,P.yT,P.z0,P.z1,{mx:[mid],door:{0:{id:"peL",hinge:"left"},1:{id:"peR",hinge:"right"}},
    hole:{l:[-100,100,CH-100,CH+b.h+60],r:[-100,100,CH-100,CH+b.h+60]}});
  /* 뒤 스테인리스 후드 · 받침 테이블 */
  box(x-300,x+300,yD+120,yD+136,-620,-60,C.ssL,C.ssL);
  for(const px of [x-280,x+280]) for(const pz of [-600,-80]) box(px-16,px+16,CH-96,yD+120,pz-16,pz+16,C.alu,C.alu,3);
  box(x-290,x+290,yD+136,yD+470,-600,-420,C.ss,C.ssL);
  mPush(); mT(x,yD+470,-510); mRZ(Math.PI/2); lathe([[90,-290],[90,290]],C.ss,16,0,Math.PI); mPop();
  /* 필름 롤 2군 (가로 축) · 롤 지지판(원형 캡 4) · 필름 센서 4 */
  box(x-300,x+300,1560,1580,-760,-420,C.ssL,C.ssL);
  for(const sx of [-1,1]){ box(x+sx*300-(sx>0?16:0),x+sx*300+(sx<0?16:0),1300,1720,-760,-420,C.ssL,C.ssL); }
  box(P.x0+40,P.x0+56,1420,1640,-620,-380,C.ssL,C.ssL);
  for(let i=0;i<4;i++) { cylX(P.x0+56,P.x0+62,1480+Math.floor(i/2)*110,-560+(i%2)*120,28,C.ssD,16); cylX(P.x0+62,P.x0+66,1480+Math.floor(i/2)*110,-560+(i%2)*120,16,C.ss,12); }
  for(let i=0;i<4;i++) box(x-56+i*28,x-34+i*28,1590,1650,-470,-430,C.green,C.green);
  /* 장구 롤러 · 리니어 가이드 캐리지 · 포머 튜브 (좌 · 우 레인) */
  for(const sx of [-1,1]){
    const lx=x+sx*106, lz=PED.zc-106;
    box(lx-80,lx+80,yD+190,yD+340,-420,-404,C.ssL,C.ssL);
    for(const yy of [yD+300,yD+230]){ cylZ(lx-66,yy,-404,lz-80,7,C.ss,8); cylZ(lx+66,yy,-404,lz-80,7,C.ss,8);
      mPush(); mT(lx,yy,lz-80); mRZ(Math.PI/2); lathe([[34,-60],[22,-40],[14,0],[22,40],[34,60]],C.ss,18); mPop(); }
    box(lx-50,lx+50,yD+136,yD+150,lz-60,lz+60,C.ss);
    box(lx-8,lx+8,yD+150,yD+360,lz-100,lz-84,C.ssD,C.ssD,0);
  }
  /* 디스크 축 · 푸셔 (앞) */
  cylY(x,PED.zc,yD+14,yD+120,30,C.ss,16);
  box(x-40,x+40,yD+136,yD+160,-120,20,C.ss);
  airCyl([x,yD+160,0],[x,yD+470,0],22);
  box(x+30,x+62,yD+300,yD+340,-16,16,C.green,C.green);
  /* 조작 패널 (오른쪽 폴) · 경광등 */
  const Hm=HMIS.pe, yb2=Hm[1]-Hm[4]/2-100;
  foot(Hm[0],Hm[2]-35,40); cylY(Hm[0],Hm[2]-35,40,yb2,30,C.ss,14);
  cntHMI(Hm[0],Hm[1],Hm[2],Hm[3],Hm[4]);
  lampPole(LAMPS.pe[0],LAMPS.pe[1],Hm[1]+Hm[4]/2+34,LAMPS.pe[2]-8);
}

/* ── RCS-120 : 대형 하부 캐비닛 + 가드 2칸 (왼칸 = 진동 볼 피더 · C 슈트 · 캡 벨트 / 오른칸 = 2단 원통 드럼 터렛)
      · 흰 UHMW 스타휠 · 황색 타이밍 벨트 클램핑 · 3조 공압 척 헤드 · 검은 포켓 체인 · 오른쪽 폴 HMI ── */
function rcY(){ const b=BD(); const yc=CH+b.h+b.capH+190; return {yc, top:RCB.yT, pick:CH+b.h+48}; }
function sRCS(){
  const b=BD(), A=L.A, B=L.B, T=L.T, Y=rcY(), R=RCB, bw=RCBOWL;
  cabinet(R.x0,R.x1,110,CH-110,R.z0,R.z1,{doors:4,front:R.z1});
  mainSwitch(R.x0+380,660,R.z1+1);
  box(R.x0-10,R.x1+10,CH-110,CH-96,R.z0-10,R.z1+10,C.ssL,C.ssL);
  /* 스타휠 · 터렛 데크 */
  box(A.x-220,B.x+220,CH-96,CH-14,T.z-230,-70,C.ssD);
  box(A.x-240,B.x+240,CH-14,CH-2,T.z-250,-50,C.uhmw,C.uhmw);
  for(const c of [A,B]) cylY(c.x,c.z,CH-2,CH+b.h*0.75+16,22,C.ss,14);
  cylY(T.x,T.z,CH-2,CH+b.h*0.75+16,40,C.ss,16);
  /* 가드 (드럼 자리 윗판 구멍) */
  const dr=300;
  alFrame(R.x0,R.x1,CH-96,R.yT,R.z0,R.z1,{mx:[R.mid],door:{0:{id:"rcL",hinge:"double"},1:{id:"rcR",hinge:"double"}},
    hole:{t1:[T.x-dr-12,T.x+dr+12,T.z-dr-12,T.z+dr+12], l:[-100,100,CH-100,CH+b.h+60], r:[-100,100,CH-100,CH+b.h+60]}});
  /* 2단 원통 드럼 (위 대경 : 가드 위로 돌출 · 아래 소경) · 기둥 */
  const yu0=1640, yu1=2340, yl0=1400;
  box(T.x-90,T.x+90,CH-96,yu0,R.z0+40,R.z0+230,C.cab,C.ssL);
  box(T.x-60,T.x+60,yu0-60,yu0,R.z0+230,T.z-dr+20,C.cab,C.ssL);
  cylY(T.x,T.z,yu0,yu1,dr,C.ss,48);
  cylY(T.x,T.z,yu0-12,yu0,dr+30,C.ssL,48);
  cylY(T.x,T.z,yu1,yu1+10,dr-6,C.ssL,48);
  for(const a of [0.3,Math.PI+0.3]) box(T.x+dr*Math.cos(a)-2,T.x+dr*Math.cos(a)+2,yu0,yu1,T.z+dr*Math.sin(a)-2,T.z+dr*Math.sin(a)+2,C.ssD,C.ssD,0);
  cylY(T.x,T.z,yl0,yu0-12,210,C.ss,40);
  cylY(T.x,T.z,Y.yc+110,yl0,100,C.brushed,24);
  /* 타이밍 스크류 베어링 블록 · 구동 커버 */
  const zs=b.d/2+32, ys=CH+b.h*0.42;
  box(L.screw0-60,L.screw0-20,CH-60,ys+40,zs-40,zs+40,C.ss); box(L.screw1+10,L.screw1+50,CH-60,ys+40,zs-40,zs+40,C.ss);
  box(L.screw0-90,L.screw0-60,CH-110,ys+60,zs-50,zs+50,C.cab);
  /* 타이밍 벨트 풀리 (터렛 바깥) */
  const rb=L.R+b.d/2+8, yB=CH+b.h*0.40;
  for(const a of [PATH.tA+0.30,PATH.tB-0.30]){
    const pr=28, rr=rb+30, px=T.x+rr*Math.cos(a), pz=T.z+rr*Math.sin(a);
    cylY(px,pz,yB-18,yB+18,pr,C.ssL,18); cylY(px,pz,yB+18,yB+24,pr+4,C.ssD,18); cylY(px,pz,CH-2,yB-18,10,C.ss,8);
  }
  /* 진동 볼 피더 (DEIL) : 선반 2단 · 구동부 · 볼 · 나선 트랙 · 레벨 센서 봉 */
  for(const x of [bw.x-200,bw.x+200]) for(const z of [bw.z-200,bw.z+200]) cylY(x,z,CH-96,bw.y-440,14,C.brushed,10);
  box(bw.x-230,bw.x+230,bw.y-440,bw.y-420,bw.z-230,bw.z+230,C.ssL,C.ssL);
  cylY(bw.x,bw.z,bw.y-420,bw.y-230,200,C.ss,32);
  box(bw.x-60,bw.x+60,bw.y-330,bw.y-280,bw.z+196,bw.z+201,C.white,C.white,0);
  mPush(); mT(bw.x,bw.y,bw.z);
  lathe([[0,-230],[200,-230],[238,-222],[250,-205],[250,0],[258,0],[258,-235],[210,-245],[0,-245]],C.ss,44);
  mPop();
  const spiral=[]; for(let i=0;i<=90;i++){ const a=i/90*Math.PI*3.6, r=240, y=bw.y-215+i/90*205; spiral.push([bw.x+r*Math.cos(a),y,bw.z+r*Math.sin(a)]); }
  tubePath(spiral,5,C.ssL,8);
  mPush(); mT(bw.x,bw.y-200,bw.z); lathe([[0,60],[80,30],[200,-10]],C.ssD,28); mPop();
  tubePath([[R.x0+40,R.yT-80,bw.z-300],[bw.x-40,R.yT-80,bw.z-300],[bw.x+60,R.yT-80,bw.z-60],[bw.x+60,R.yT-160,bw.z-60]],14,C.rodC,12);
  cylY(bw.x+60,bw.z-60,bw.y-80,R.yT-160,4,C.ss,8); box(bw.x+45,bw.x+75,R.yT-200,R.yT-170,bw.z-80,bw.z-40,C.green,C.green);
  /* C 슈트 · 녹색 캡 벨트 · 검은 포켓 체인 */
  const cp=capPath(), hwc=b.capD/2+5;
  for(let i=0;i<cp.pts.length-1;i++){
    const p=cp.pts[i], q=cp.pts[i+1], seg=cp.kind[i];
    if(seg==="c"){ for(const s of [-1,1]) tube([p[0],p[1],p[2]+s*(hwc+6)],[q[0],q[1],q[2]+s*(hwc+6)],6,C.ss,8,false);
      tube([p[0]+cp.nrm[i][0]*(b.capH*0.6+4),p[1]+cp.nrm[i][1]*(b.capH*0.6+4),p[2]],[q[0]+cp.nrm[i+1][0]*(b.capH*0.6+4),q[1]+cp.nrm[i+1][1]*(b.capH*0.6+4),q[2]],8,C.ssD,8,false); }
  }
  const bl=cp.belt;
  box(bl.x0-30,bl.x1+30,bl.y-44,bl.y-24,bl.z-hwc-14,bl.z+hwc+14,C.ss);
  for(const s of [-1,1]) box(bl.x0,bl.x1,bl.y-24,bl.y+10,bl.z+s*(hwc+4),bl.z+s*(hwc+10),C.ss,C.ss,0);
  box(bl.x0+60,bl.x0+220,bl.y-150,bl.y-44,bl.z-hwc-30,bl.z+hwc+30,C.ssL);
  cylY(bl.x0+40,bl.z-hwc-40,CH-96,bl.y-44,12,C.ss,8);
  const ch=cp.chain;
  mPush(); mT(ch.cx,ch.y-18,ch.cz); mRY(-ch.ang);
  box(-ch.hl-ch.r,ch.hl+ch.r,-6,0,-ch.r-10,ch.r+10,C.dark,C.dark,0);
  box(-ch.hl,ch.hl,0,10,-ch.r+22,ch.r-22,C.ssL,C.ssL,0);
  mPop();
  box(ch.cx-22,ch.cx+22,ch.y-44,ch.y-24,-760,ch.cz,C.ss);                    /* 체인 받침 암 (뒤에서) */
  box(bl.x1-20,bl.x1+20,bl.y-66,bl.y-44,-760,bl.z,C.ss);
  box(ch.cx-40,bl.x1+40,ch.y-66,ch.y-24,-800,-760,C.ss);
  cylY(ch.cx-60,-780,CH-96,ch.y-66,20,C.ss,10);
  /* 조작 패널 (오른쪽 폴) · 경광등 */
  const Hm=HMIS.rc, yb2=Hm[1]-Hm[4]/2-100;
  foot(Hm[0],Hm[2]-35,40); cylY(Hm[0],Hm[2]-35,40,yb2,30,C.ss,14);
  cntHMI(Hm[0],Hm[1],Hm[2],Hm[3],Hm[4]);
  lampPole(LAMPS.rc[0],LAMPS.rc[1],Hm[1]+Hm[4]/2+34,LAMPS.rc[2]-8);
}
/* 캡 경로 : 볼 출구 → C 슈트(수직면에서 휘어 내려옴) → 녹색 벨트 → 포켓 체인 → 픽업점 (CAP_PICK)
   pts 는 캡 윗면 위치 · kind 'c'=슈트 'b'=벨트 'k'=체인 · nrm 은 캡 축 방향 (슈트에서 기운다) */
let CAP_CACHE={ml:-1};
function capPath(){
  const b=BD();
  if(CAP_CACHE.ml===b.ml) return CAP_CACHE;
  const T=L.T, Y=rcY(), bw=RCBOWL, ap=CAP_PICK*Math.PI/180;
  const pk=[T.x+L.R*Math.cos(ap),Y.pick+b.capH+6,T.z+L.R*Math.sin(ap)];
  const zc=bw.z+300, yb=pk[1];
  const pts=[], kind=[], nrm=[];
  /* C 슈트 : 위(볼 림) → 바깥(왼쪽)으로 반원 → 아래 */
  const cx=bw.x-120, cy=(bw.y+30+yb)/2, rr=(bw.y+30-yb)/2;
  pts.push([bw.x-40,bw.y+30,zc]); kind.push("c"); nrm.push([0,1]);
  for(let i=0;i<=16;i++){ const a=Math.PI/2+i/16*Math.PI; pts.push([cx+rr*Math.cos(a)*0.8,cy+rr*Math.sin(a),zc]); kind.push("c"); nrm.push([-Math.cos(a),-Math.sin(a)]); }
  /* 벨트 : +x */
  const bx0=cx, bx1=RCB.x0+660;
  pts.push([bx1,yb,zc]); kind.push("b"); nrm.push([0,1]);
  /* 체인 : 벨트 끝 → 픽업점 */
  pts.push(pk); kind.push("k"); nrm.push([0,1]);
  const len=[0]; for(let i=1;i<pts.length;i++) len.push(len[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1],pts[i][2]-pts[i-1][2]));
  const ccx=(bx1+pk[0])/2, ccz=(zc+pk[2])/2, hl=Math.hypot(pk[0]-bx1,pk[2]-zc)/2;
  CAP_CACHE={ml:b.ml, pts, kind, nrm, len, total:len[len.length-1], pick:pk,
    belt:{x0:bx0,x1:bx1,y:yb-b.capH-2,z:zc}, chain:{cx:ccx,cz:ccz,y:yb-b.capH-2,hl,r:b.capD/2+16,ang:Math.atan2(pk[2]-zc,pk[0]-bx1)}};
  return CAP_CACHE;
}
/* 캡 경로 위 거리 u (끝에서부터) → {p, n} */
function capAt(u){
  const C2=capPath(), s=C2.total-u;
  if(s<=0) return {p:C2.pts[0],n:C2.nrm[0],k:"c"};
  for(let i=1;i<C2.pts.length;i++){ if(s<=C2.len[i]){ const t=(s-C2.len[i-1])/(C2.len[i]-C2.len[i-1]||1), a=C2.pts[i-1], c=C2.pts[i];
    const na=C2.nrm[i-1], nb=C2.nrm[i];
    return {p:[a[0]+(c[0]-a[0])*t,a[1]+(c[1]-a[1])*t,a[2]+(c[2]-a[2])*t], n:[na[0]+(nb[0]-na[0])*t,na[1]+(nb[1]-na[1])*t], k:C2.kind[i]}; } }
  return {p:C2.pick,n:[0,1],k:"k"};
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
/* ── 천장 집진 배관 (DMC 헤드 뒤 · 주름 호스) ── */
function sDust(){
  const x=-1180+L.dmcDX, z=-1040;
  cylY(x,z,2500,3300,70,C.ss,18); cylY(x,z,2440,2500,82,C.ssL,18);
  cylY(x-40,z,2360,2440,26,C.ss,12); cylY(x+40,z,2360,2440,26,C.ss,12); cylY(x+40,z,2340,2360,30,C.blue,12);
  const pts=[]; const a=[x-40,2360,z], m=[x-120,1700,z+40], e=[-1112+L.dmcDX,1330,-700];
  for(let i=0;i<=16;i++){ const t=i/16,u=1-t; pts.push([u*u*a[0]+2*u*t*m[0]+t*t*e[0],u*u*a[1]+2*u*t*m[1]+t*t*e[1],u*u*a[2]+2*u*t*m[2]+t*t*e[2]]); }
  tubePath(pts,26,[0.80,0.74,0.62,0.05],10);
  for(let i=1;i<16;i+=1){ const p=pts[i]; cylY(p[0],p[2],p[1]-4,p[1]+4,29,[0.62,0.60,0.56,0.05],10); }
  cylX(-1140+L.dmcDX,-1112+L.dmcDX,1330,-700,34,C.rodC,14);
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
