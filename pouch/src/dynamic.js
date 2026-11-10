/* ═══════════════════════════════════════════════════════════════════
   움직이는 형상 — 파우치 · 카톤 · 실바 동작 · 호퍼 레벨 · 표시등 · 작업자
   ═══════════════════════════════════════════════════════════════════ */
const FAR=()=>cam.dist>9000;
function drawPouch(x,y,z,yaw,red,tilt){
  mPush(); mT(x,y,z); mRY(yaw||0); if(tilt) mRZ(tilt);
  box(-11,11,0,6,-62,62,red?COL.foilR:COL.foil,null,0);
  box(-11,11,0,6.5,-73,-62,COL.foil,null,0); box(-11,11,0,6.5,62,73,COL.foil,null,0);
  mPop();
}
function drawCarton(x,y,z,o){
  o=o||{};
  box(x-38,x+38,y,y+52,z-82,z+82,COL.carton,COL.carton,4);
  box(x-39,x+39,y+12,y+40,z+40,z+83,COL.cartonP,null,0);
  if(o.print==="ok") box(x-20,x+20,y+52,y+53,z-40,z+10,[0.10,0.12,0.15,0.1],null,0);
  else if(o.print==="blur") box(x-20,x+20,y+52,y+53,z-40,z+10,[0.62,0.64,0.68,0.1],null,0);
  if(o.open) box(x-38,x+38,y+52,y+56,z+82,z+150,COL.carton,null,0);
}
function drawDynamic(){
  geoBegin(GEO.dyn);
  dRoomShell();
  if(!S) return;
  dFiller(); dHoppers(); dPouches(); dCartons(); dPack(); dScreens();
  drawWorkers();
}
/* 실바 · 커터 상하 운동 · 은박 롤 · 리프터 */
function dFiller(){
  const f=S.f, ph=f.run?f.phase:0, y=1180+Math.sin(ph*Math.PI*2)*45;
  box(FIL.xc-420,FIL.xc+420,y,y+60,NOZ.z+40,NOZ.z+70,C.ssL,null,0);
  /* 필름 띠 (후면 → 상부) */
  if(f.roll!=="none"){
    const col=f.roll==="red"?COL.foilR:COL.foil;
    cylX(ROLL.x-430,ROLL.x+430,ROLL.y,ROLL.z,f.roll==="red"?260:220,col,24);
    cylX(ROLL.x-440,ROLL.x+440,ROLL.y,ROLL.z,60,C.dark,12);
    ribbon([[FIL.xc-420,ROLL.y+250,ROLL.z],[FIL.xc-420,1850,FIL.z0-60],[FIL.xc-420,1900,FIL.z0+200]],[[FIL.xc+420,ROLL.y+250,ROLL.z],[FIL.xc+420,1850,FIL.z0-60],[FIL.xc+420,1900,FIL.z0+200]],col);
  }
  /* 배출 슈트 각도 표시 (F3 : 틀어짐) */
  if(f.alnBad){ mPush(); mT(FIL.xc,1015,(NOZ.z+CV.z)/2); mRZ(0.12); box(-420,420,0,8,-80,80,[0.95,0.55,0.15,0.3],null,0); mPop(); }
  /* 리프터 플랫폼 · STS 용기 */
  const ly=f.mainLift?DECK.y:40;
  box(LIFT.x-320,LIFT.x+320,ly,ly+40,LIFT.z-380,LIFT.z+380,C.yellow);
  if(!f.mainFed){ mPush(); mT(LIFT.x,ly+40,LIFT.z); lathe([[230,0],[240,520],[250,540],[0,540]],C.ssL,18); mPop(); }
  /* 판넬 화면 · 상태등 */
  const P=PANEL_F, on=f.panel;
  box(P.x-260,P.x+260,1455,1785,P.z+72,P.z+74,on?E.scr:E.scrDim,null,0);
  box(P.x+300,P.x+330,1700,1760,P.z+20,P.z+24,tripAlarms().length?E.ledR:f.run?E.ledG:OFF.y,null,0);
  if(f.door!=="closed"&&VIEW3.guard){ mPush(); mT(FIL.xc-520,1000,FIL.z1+10); mRY(-1.2); glassBox(0,1040,0,FIL.yTop-1130,-110,0,C.acryl,0.15); mPop(); }
  /* 공포배출 */
  for(const e of LN.empty){ const u=Math.min(1,e.t/3), x=lerp(FIL.x0+260,FIL.x0-680,u); drawPouch(x+e.i*6,CV.y+2,CV.z+330,0,true); }
}
function dHoppers(){
  const y=DECK.y;
  for(const h of HOP){
    const lv=S.hop[h.k]/100, top=y+460+60+lv*760;
    if(lv>0.01){ mPush(); mT(h.x,y+500,h.z); lathe([[110,0],[120+lv*130,top-y-500],[0,top-y-500]],h.k==="main"?[0.96,0.90,0.80,0.05]:h.k==="add"?[0.98,0.80,0.40,0.05]:[0.99,0.99,0.98,0.05],16); mPop(); }
  }
}
function dPouches(){
  const far=FAR();
  let i=0;
  for(const q of LN.pouch){
    if(far&&(i++%3)) continue;
    const p=ppAt(q.s), yaw=Math.atan2(p.dx,p.dz)-Math.PI/2+q.skew;
    drawPouch(p.x,p.y+1,p.z,yaw,true,Math.asin(clamp(p.dy,-1,1)));
  }
  /* 스틱공급장치 버퍼 표시 */
  const n=Math.min(24,LN.buf);
  for(let k=0;k<n;k++) drawPouch(FEED.x0+600+(k%12)*26,1160+Math.floor(k/12)*8,0,0,true);
}
function dCartons(){
  const y=PK.y;
  for(const c of LN.cartons) drawCarton(c.x,y,0,{print:c.print});
  /* 카토너 안 진행 중 카톤 */
  if(S.p.ctRun){ const u=(LN.ctT/(60/50)); drawCarton(lerp(CT.x0+600,CT.x1-400,u),y+30,0,{open:true}); }
  /* 리젝터 함 · 배출함 */
  for(let k=0;k<Math.min(10,LN.rejBox);k++) drawCarton(PR.x1+120+(k%3)*80,60+Math.floor(k/3)*55,310,{});
  for(let k=0;k<Math.min(10,LN.binX);k++) drawCarton(BIN.x-120+(k%3)*80,80+Math.floor(k/3)*55,BIN.zX,{print:"ok"});
  for(let k=0;k<Math.min(10,LN.binW);k++) drawCarton(BIN.x-120+(k%3)*80,80+Math.floor(k/3)*55,BIN.zW,{print:"ok"});
  /* 카톤 매거진 · 설명서 잔량 */
  const m=Math.min(14,Math.ceil(S.p.mag/40));
  for(let k=0;k<m;k++){ mPush(); mT(3700,PK.y+300+k*24,CT.z0+40-k*12); mRX(-0.45); box(-330,330,0,20,-220,-20,COL.carton,null,0); mPop(); }
  if(S.p.leaf>0) box(2370,2830,PK.y+1000,PK.y+1000+Math.min(240,S.p.leaf/2),CT.z0+140,CT.z0+360,[0.99,0.99,0.97,0.04],null,0);
}
function dPack(){
  const P=PACK, y=PK.y-40;
  for(let k=0;k<LN.table;k++) drawCarton(P.x0+250+(k%4)*90,y,P.z0+200+Math.floor(k/4)*180,{print:"ok"});
  const cs=Math.min(12,S.cnt.cases);
  for(let k=0;k<cs;k++) box(P.x0+800+(k%3)*230,y+Math.floor(k/3)*190,P.z0+80+(k%2)*10,P.x0+1010+(k%3)*230,y+180+Math.floor(k/3)*190,P.z0+420,COL.carton.map((v,i)=>i<3?v*0.85:v));
}
/* 설비 화면 켜짐 표시 */
function dScreens(){
  const p=S.p, lit=(on,x0,x1,y0,y1,z)=>box(x0,x1,y0,y1,z,z+3,on?E.scr:E.scrDim,null,0);
  lit(p.sfSw&&p.ctMain,FEED.x0-10,FEED.x0+250,1375,1545,FEED.z1+62);
  lit(p.ctMain,CT.x1-410,CT.x1-170,PK.y+610,PK.y+790,CT.z1+82);
  lit(p.prMain,(PR.x0+PR.x1)/2-210,(PR.x0+PR.x1)/2+210,1680,1960,-258);
  lit(xrReady(),(XR.x0+XR.x1)/2-230,(XR.x0+XR.x1)/2+230,1400,1700,522);
  lit(p.cwPow,(CW.x0+CW.x1)/2-190,(CW.x0+CW.x1)/2+190,1370,1630,-248);
  const xc=(XR.x0+XR.x1)/2; box(xc-120,xc+120,1850,1900,532,535,p.xrX?E.ledR:OFF.r,null,0);
  box(HM.x-120,HM.x+120,600,800,HM.z+226,HM.z+229,hmReady()?E.ledG:p.hm?E.ledY:OFF.g,null,0);
  /* 정렬컨베어 스위치 */
  cylZ(FEED.x0+450,1130,FEED.z1+80,FEED.z1+90,24,p.align?E.ledG:OFF.g,12);
}

/* ═══ 작업자 (충전실 1명 · 포장실 1명) — 데크 계단 포함 ═══ */
const AISLE_F=1700, AISLE_B=-2900;
const WK=[
  {id:"F", x:-6300, z:AISLE_F, y:0, lvl:0, home:[-6300,AISLE_F], route:[], yaw:0, gait:0, walking:false, job:null, t:0, end:[-9400,-1200]},
  {id:"P", x:4200,  z:AISLE_F, y:0, lvl:0, home:[4200,AISLE_F],  route:[], yaw:0, gait:0, walking:false, job:null, t:0, end:[-100,12600]}
];
/* 작업 정의 : 서는 위치(deck : 데크 위) · 손 목표 · 들고 가는 물건 · 확대 시점 */
const JOBS={
  look:   {stand:[0,AISLE_F-150], reach:null, carry:null, dur:1.4},
  power:  {stand:[FIL.x0-250,FIL.z1+300], reach:[FIL.x0-20,1250,FIL.z1-130], dur:1.2},
  air:    {stand:[-7300,-800], reach:[-7300,1350,-1180], dur:1.4},
  dust:   {stand:[FIL.x1+250,-1100], deck:true, reach:[FIL.x1+250,DECK.y+850,-1500], dur:1.4, view:"hopper"},
  panel:  {stand:[PANEL_F.x,PANEL_F.z+420], reach:[PANEL_F.x+300,1730,PANEL_F.z], dur:1.0},
  lift:   {stand:[LIFT.x+700,LIFT.z+300], reach:[LIFT.x,600,LIFT.z], carry:"sts", dur:2.6, view:"lift"},
  scoop:  {stand:[FIL.x1+300,-270], deck:true, reach:[FIL.xc+150,DECK.y+1250,-270], carry:"scoop", dur:3.0, view:"hopper", pour:true},
  roll:   {stand:[ROLL.x,-2350], reach:[ROLL.x,ROLL.y,ROLL.z], carry:"roll", dur:3.0, view:"roll"},
  rollOut:{stand:[ROLL.x,-2350], reach:[ROLL.x,ROLL.y,ROLL.z], carry:null, dur:2.4, view:"roll"},
  prn:    {stand:[FIL.xc,-1400], reach:[FIL.xc,1500,FIL.z0-180], dur:1.6, view:"printer"},
  door:   {stand:[FIL.xc,FIL.z1+500], reach:[FIL.xc-300,1500,FIL.z1], dur:1.4, view:"door"},
  front:  {stand:[FIL.xc,FIL.z1+500], reach:[FIL.xc,1250,FIL.z1], dur:2.4, view:"front"},
  chute:  {stand:[FIL.xc+150,CV.z+520], reach:[FIL.xc,1020,CV.z-40], dur:2.6, view:"chute"},
  dialF:  {stand:[FIL.xc,800], deck:true, reach:[FIL.xc,DECK.y+180,FIL.z1+10], dur:2.8, view:"dial"},
  dialB:  {stand:[FIL.xc,-1350], deck:true, reach:[FIL.xc,DECK.y+150,FIL.z0+10], dur:2.8, view:"dialB"},
  leak:   {stand:[-4300,CV.z+500], reach:[-4300,CV.y+40,CV.z], dur:2.0, view:"conv"},
  docF:   {stand:[-7600,AISLE_F-300], reach:[-7600,1500,AISLE_F-700], dur:1.4},
  align:  {stand:[FEED.x0+450,FEED.z1+500], reach:[FEED.x0+450,1130,FEED.z1+60], dur:1.0, view:"sw"},
  /* 포장실 */
  ctBack: {stand:[3400,-1500], reach:[3400,1100,CT.z0], dur:1.4, view:"ctBack"},
  hm:     {stand:[HM.x,-1900], reach:[HM.x,800,HM.z+220], dur:1.4, view:"hm"},
  cwPow:  {stand:[(CW.x0+CW.x1)/2+300,900], reach:[(CW.x0+CW.x1)/2+215,1630,-240], dur:1.2, view:"cw"},
  xrPow:  {stand:[(XR.x0+XR.x1)/2,1100], reach:[(XR.x0+XR.x1)/2+310,1330,560], dur:1.4, view:"xr"},
  prPow:  {stand:[(PR.x0+PR.x1)/2,700], reach:[(PR.x0+PR.x1)/2,500,-120], dur:1.4, view:"pr"},
  mag:    {stand:[3700,-1500], reach:[3700,PK.y+500,CT.z0], carry:"cartons", dur:2.6, view:"ctBack"},
  leaf:   {stand:[2600,-1500], reach:[2600,PK.y+1100,CT.z0+250], carry:"leaf", dur:2.4, view:"ctBack"},
  magOut: {stand:[3300,-1500], reach:[3300,PK.y+600,CT.z0], dur:2.4, view:"ctBack"},
  ink:    {stand:[(PR.x0+PR.x1)/2,700], reach:[(PR.x0+PR.x1)/2,500,-120], carry:"ink", dur:2.8, view:"pr"},
  leafAdj:{stand:[2600,-1500], reach:[2600,PK.y+900,CT.z0+250], dur:2.6, view:"ctBack"},
  docP:   {stand:[1000,AISLE_F-300], reach:[1000,1500,AISLE_F-700], dur:1.4},
  bin:    {stand:[BIN.x,900], reach:[BIN.x,700,BIN.zW], dur:1.6, view:"bin"}
};
function wkFor(p){ const x=Array.isArray(p)?p[0]:p; return x<ROOM.wall?WK[0]:WK[1]; }
function wkBusy(){ return WK.some(w=>w.job||w.route.length); }
const aisleOf=(w,z)=>z<-200?AISLE_B:AISLE_F;
const STZ=(STAIR.z0+STAIR.z1)/2, STB=[STAIR.xBot+350,STZ], STT=[STAIR.xTop-150,STZ], HUBX=FIL.x1+330;
/* 경로 : 통로 → (반대편이면 왼쪽 끝을 돌아) → 목표. 데크는 우측 후방 계단 → 데크 오른쪽 통로(HUBX) */
function floorRoute(w,from,dest){
  const rt=[], a0=aisleOf(w,from[1]), a1=aisleOf(w,dest[1]);
  if(Math.abs(from[1]-a0)>30) rt.push([from[0],a0]);
  if(a0!==a1){ const ex=w.id==="F"?-9400:12600; rt.push([ex,a0]); rt.push([ex,a1]); }
  rt.push([dest[0],a1]); rt.push([dest[0],dest[1]]);
  return rt;
}
function routeTo(w,dest,deck){
  const rt=[];
  if(w.lvl&&!deck){ rt.push([HUBX,w.z,1]); rt.push([HUBX,STZ,1]); rt.push([STT[0],STZ,1]); rt.push([STB[0],STB[1],0]); rt.push(...floorRoute(w,STB,dest)); }
  else if(!w.lvl&&deck){ rt.push(...floorRoute(w,[w.x,w.z],STB)); rt.push([STT[0],STZ,1]); rt.push([HUBX,STZ,1]); rt.push([HUBX,dest[1],1]); rt.push([dest[0],dest[1],1]); }
  else if(w.lvl&&deck){ rt.push([HUBX,w.z,1]); rt.push([HUBX,dest[1],1]); rt.push([dest[0],dest[1],1]); }
  else rt.push(...floorRoute(w,[w.x,w.z],dest));
  return rt;
}
let CAMRET=null;
function startWork(key,cb,opt){
  const j=Object.assign({},JOBS[key]||JOBS.look,opt||{});
  const w=wkFor(j.stand);
  if(w.job) return false;
  w.route=routeTo(w,j.stand,!!j.deck);
  w.job={key,j,cb,phase:"walk",t:0}; w.carry=j.carry||null;
  const v=j.view&&WORKVIEW[j.view];
  if(v&&R3.gl){ w.job.prevView=CAMRET?CAMRET.view:(cam.view==="work"?(S.room==="F"?"fill":"pack"):cam.view); CAMRET=null; w.job.hasView=true;
    cam.view="work"; cam.yawT=v.yaw; cam.pitchT=v.pitch; cam.distT=v.dist; cam.txT=v.tx; cam.tyT=v.ty; cam.tzT=v.tz; }
  return true;
}
function stairY(x){ return clamp((STAIR.xBot-x)/(STAIR.xBot-STAIR.xTop),0,1)*DECK.y; }
function wkTick(dt){
  if(CAMRET){ CAMRET.t-=dt; if(CAMRET.t<=0){ if(cam.view==="work"&&!WK.some(w=>w.job&&w.job.hasView)) camSet(CAMRET.view); CAMRET=null; } }
  for(const w of WK){
    w.walking=false;
    const onStair=w.x>STAIR.xTop-60&&w.x<STAIR.xBot+120&&w.z>STAIR.z0-60&&w.z<STAIR.z1+60;
    const ty=onStair&&!(w.lvl&&w.x<STAIR.xTop)?stairY(w.x):(w.lvl?DECK.y:0);
    w.y+=(ty-w.y)*Math.min(1,dt*12);
    if(w.route.length){
      const r=w.route[0], dx=r[0]-w.x, dz=r[1]-w.z, dd=Math.hypot(dx,dz), st=Math.min(dd,dt*1900);
      if(dd>1){ w.x+=dx/dd*st; w.z+=dz/dd*st; w.walking=true; w.gait+=st/190; w.face=Math.atan2(-dx,-dz); }
      if(dd-st<=1){ if(r[2]!==undefined) w.lvl=r[2]; w.route.shift(); }
      continue;
    }
    const J=w.job;
    if(J){
      if(J.phase==="walk"){ J.phase="work"; J.t=0; }
      J.t+=dt;
      if(J.j.reach){ const r=J.j.reach; w.face=Math.atan2(-(r[0]-w.x),-(r[2]-w.z)); }
      if(J.t>=J.j.dur){
        w.carry=null; w.idle=0;
        if(J.hasView) CAMRET={view:J.prevView||"all", t:1.1};
        w.job=null;
        try{ J.cb&&J.cb(); }catch(e){ console.error(e); }
      }
    }else{
      w.idle=(w.idle||0)+dt;
      if(w.idle>4&&(Math.abs(w.x-w.home[0])>5||Math.abs(w.z-w.home[1])>5||w.lvl)){ w.route=routeTo(w,w.home,false); w.idle=0; }
    }
  }
}
const WPAL={suit:[.95,.96,.97,.02],seam:[.78,.83,.87,.02],boot:[.88,.91,.94,.02],sole:[.60,.66,.72,.02],badge:[.10,.56,.57,.02],glove:[.33,.64,.76,.02],
  visor:[.15,.29,.35,.3],skin:[.98,.80,.66,.02],eye:[.12,.14,.18,.1],blush:[.99,.62,.60,.02],smile:[.55,.28,.26,.02],cap:[.99,.99,1,.02]};
function cuteOperatorShapes(o){
 const cr=o.crouch||0,SS=[],El=(c,r,col)=>SS.push({t:'e',c,r,col}),Cy=(a,b,r,col)=>SS.push({t:'c',a,b,r,col});
 const IK=(A,T,hint,u=86,l=84)=>{const d0=T.map((v,i)=>v-A[i]),len=Math.hypot(...d0)||1,d=Math.max(2,Math.min(len,u+l-.1)),n=d0.map(v=>v/len);
  const hn=hint[0]*n[0]+hint[1]*n[1]+hint[2]*n[2];let b=hint.map((v,i)=>v-n[i]*hn),bl=Math.hypot(...b);if(bl<.01){b=[0,0,1];bl=1;}
  const a=(u*u-l*l+d*d)/(2*d),h=Math.sqrt(Math.max(0,u*u-a*a));return {e:A.map((v,i)=>v+n[i]*a+b[i]/bl*h),h:A.map((v,i)=>v+n[i]*d)};};
 for(const s of [-1,1]){
  const g=Math.sin((o.gait||0)+s*Math.PI/2)*(o.walk||0),lift=Math.max(0,g)*13;
  const hip=[s*22,228-cr,0],knee=[s*22,116-cr*.12,-g*20-cr*.5],ank=[s*23,40+lift,-g*40];
  Cy(hip,knee,22,'suit');El(knee,[20,19,20],'suit');Cy(knee,ank,18,'suit');
  El([ank[0],20+lift,ank[2]-8],[22,20,32],'boot');El([ank[0],7+lift,ank[2]-8],[23,6,33],'sole');
 }
 const TY=300-cr,TR=[47,88,38];
 El([0,236-cr,0],[45,40,35],'suit');El([0,TY,0],TR,'suit');
 const front=y=>{const q=(y-TY)/TR[1];return -TR[2]*Math.sqrt(Math.max(0,1-q*q))-.6;};
 for(let y=226-cr;y<372-cr;y+=18)Cy([0,y,front(y)],[0,y+18,front(y+18)],1.6,'seam');
 El([20,330-cr,front(330-cr)-.6],[9,11,2.4],'badge');
 for(const [i,s] of [[0,-1],[1,1]]){
  const sh=[s*50,366-cr,0];El(sh,[19,19,19],'suit');
  const k=IK(sh,o.goals[i],[s*.45,0,.9]);Cy(sh,k.e,16,'suit');El(k.e,[15,15,15],'suit');Cy(k.e,k.h,13,'suit');
  El([k.h[0],k.h[1]-6,k.h[2]-3],[14,15,14],'glove');
 }
 const HY=440-cr;
 Cy([0,378-cr,0],[0,396-cr,0],17,'suit');
 El([0,HY,0],[53,55,48],'suit');
 El([0,HY+2,-34],[41,25,18],'visor');
 El([0,HY+2,-40],[34,18,14],'skin');
 for(const s of [-1,1]){El([s*12,HY+6,-53],[3.8,4.8,2.4],'eye');El([s*23,HY-4,-49.5],[5.5,3.2,2],'blush');}
 El([0,HY-7,-54],[5,2,1.6],'smile');
 El([0,HY+45,0],[47,13,43],'cap');
 return SS;
}
function drawWorkers(){ for(const w of WK){ const e=R3.eye, dd=Math.hypot(e[0]-w.x,e[1]-900-(w.y||0),e[2]-w.z); if(dd>1600) drawWorker(w); } }
function reachAmt(J){ const t=J.t-0.15, e=J.j.dur-0.45; if(t<=0) return 0; return Math.min(1,t*2.6)*(J.t>e?Math.max(0,(J.j.dur-J.t)/0.45):1); }
function drawWorker(w){
  const scale=1650/488, x=w.x, z=w.z, far=FAR();
  const want=w.face!==undefined?w.face:0;
  if(w.yaw===undefined) w.yaw=want;
  let dl=want-w.yaw; while(dl>Math.PI) dl-=2*Math.PI; while(dl<-Math.PI) dl+=2*Math.PI; w.yaw+=dl*0.2;
  const cy=Math.cos(w.yaw), sy=Math.sin(w.yaw);
  const J=w.job, work=J&&J.phase==="work"&&J.j.reach, reach=work?reachAmt(J):0;
  const yw=w.y||0, W=([a,b,c])=>[x+(a*cy+c*sy)*scale,b*scale+yw,z+(-a*sy+c*cy)*scale];
  const Rn=([a,b,c])=>[a*cy+c*sy,b,-a*sy+c*cy];
  const toLocal=g=>{const dx=(g[0]-x)/scale,dz=(g[2]-z)/scale;return [dx*cy-dz*sy,(g[1]-yw)/scale,dx*sy+dz*cy];};
  const holdEnd=J?J.j.dur*0.6:0;
  const walkCarry=w.carry&&w.walking;
  const handCarry=w.carry&&J&&J.phase==="work"&&J.t<holdEnd;
  const goals=[-1,1].map((s,i)=>{
    const sway=Math.sin((w.gait||0)+s*Math.PI/2)*(w.walking?22:0);
    const idle=[s*64,222,-4+sway];
    if(walkCarry||(handCarry&&reach<0.05)) return [s*34,300,-86];
    if(!work) return idle;
    const tl=toLocal(J.j.reach), osc=Math.sin(J.t*7+i)*5;
    const tgt=[tl[0]+s*(handCarry?34:26),Math.min(560,tl[1])+osc,Math.max(-220,Math.min(-60,tl[2]))];
    const from=w.carry?[s*34,300,-86]:idle;
    return from.map((v,k)=>v+(tgt[k]-v)*reach);
  });
  for(const s of cuteOperatorShapes({gait:w.gait||0,walk:w.walking?1:0,crouch:0,goals})){
    const col=WPAL[s.col];
    if(s.t==='c'){ tube(W(s.a),W(s.b),s.r*scale,col,far?8:12,true); continue; }
    const big=Math.max(...s.r)>25, nu=far?8:(big?16:10), nv=far?5:(big?9:6);
    ellipsoidT(s.c,s.r,col,nu,nv,W,Rn);
  }
  if(walkCarry||handCarry){
    const mid=[(goals[0][0]+goals[1][0])/2,(goals[0][1]+goals[1][1])/2,(goals[0][2]+goals[1][2])/2-24];
    const c=W(mid);
    mPush(); mT(c[0],c[1],c[2]); mRY(w.yaw);
    if(w.carry==="roll"){ cylX(-90,90,0,0,110,S.f.rollCarry==="plain"?COL.foil:COL.foilR,20); cylX(-96,96,0,0,30,C.dark,12); }
    else if(w.carry==="sts"){ lathe([[90,-80],[95,80],[0,80]],C.ssL,14); }
    else if(w.carry==="scoop"){ box(-30,30,-10,10,-80,40,C.ssL); }
    else if(w.carry==="cartons"){ box(-80,80,-60,60,-90,90,COL.carton); }
    else if(w.carry==="leaf"){ box(-70,70,-40,40,-50,50,[0.99,0.99,0.97,0.04]); }
    else if(w.carry==="ink"){ box(-40,40,-60,60,-40,40,[0.95,0.60,0.15,0.2]); }
    mPop();
  }
}
function ellipsoidT(c,r,col,nu,nv,W,Rn){
  let prev=null;
  for(let j=0;j<=nv;j++){
    const ph=j/nv*Math.PI, row=[];
    for(let i=0;i<=nu;i++){
      const th=i/nu*Math.PI*2, sx=Math.sin(ph)*Math.cos(th), sy=Math.cos(ph), sz=Math.sin(ph)*Math.sin(th);
      row.push({p:W([c[0]+r[0]*sx,c[1]+r[1]*sy,c[2]+r[2]*sz]), n:Rn([sx/r[0],sy/r[1],sz/r[2]])});
    }
    if(prev) for(let i=0;i<nu;i++){ const A=prev[i],B=prev[i+1],Cc=row[i+1],D=row[i];
      if(j===1) triN(A.p,Cc.p,D.p,A.n,Cc.n,D.n,col); else if(j===nv) triN(A.p,B.p,D.p,A.n,B.n,D.n,col);
      else quadN(A.p,B.p,Cc.p,D.p,A.n,B.n,Cc.n,D.n,col); }
    prev=row;
  }
}
