/* ═══════════════════════════════════════════════════════════════════
   동적 형상 — 매 프레임 생성 (움직이는 부품 · 병 · 정제 · 캡 · 도어 · 작업자)
   ═══════════════════════════════════════════════════════════════════ */
const FAR=()=>cam.dist>7600;
const NEAR=()=>cam.dist<4200;
/* UA 반전 각 (x → roll) */
function uaRoll(x){
  if(x<=L.inv0||x>=L.inv3) return 0;
  if(x<L.inv1) return Math.PI*smooth((x-L.inv0)/(L.inv1-L.inv0));
  if(x<L.inv2) return Math.PI;
  return Math.PI+Math.PI*smooth((x-L.inv2)/(L.inv3-L.inv2));
}
function lampState(mk){
  const al=S.alarms.filter(a=>ALARMS[a.key].mk===mk||ALARMS[a.key].mk==="line");
  if(al.some(a=>ALARMS[a.key].kind==="trip")) return "alarm";
  if(al.length) return "warn";
  return S.running?"run":"off";
}
/* 캡 1개 : 윗면 위치 p · 축 방향 n(xy 평면) */
function drawCap(p,n,seg){
  const b=BD();
  mPush(); mT(p[0],p[1],p[2]);
  if(n&&(Math.abs(n[0])>0.02||n[1]<0.98)) mRZ(Math.atan2(-n[0],n[1]));
  mT(0,-(b.h+b.capH),0); lathe(botProf().cap,C[b.capCol],seg||10);
  mPop();
}

function drawDynamic(){
  geoBegin(GEO.dyn);
  if(!S) return;
  dConveyor(); dUA(); dSG(); dLoadCell(LN.st.lc1); dDMC(); dLoadCell(LN.st.lc2); dReject(); dPE(); dRCS(); dTable();
  dBottles(); dPanels(); drawDoors(); drawWorkers();
}

/* ── 컨베이어 슬랫 이동 ── */
function dConveyor(){
  if(FAR()) return;
  const pitch=38.1, off=LN.conv%pitch;
  const skip=[[L.lc1-L.lcW/2-2,L.lc1+L.lcW/2+2],[L.lc2-L.lcW/2-2,L.lc2+L.lcW/2+2]];
  for(let x=XS+off;x<XE;x+=pitch){
    if(skip.some(s=>x>s[0]&&x<s[1])) continue;
    box(x-1.2,x+1.2,CH,CH+0.5,-43,43,C.slatL,C.slatL,0);
  }
}

/* ── UA-120 ── */
function dUA(){
  const b=BD(), tt=L.tt, far=FAR();
  /* 레벨 디스크 + 병 */
  mPush(); mT(tt.x,0,tt.z); mRY(-LN.tt.ang);
  disc(CH-3,0,tt.r,C.brushed,40);
  for(let i=0;i<8;i++){ const a=i*Math.PI/4; mPush(); mRY(a); box(60,tt.r-6,CH-3,CH+2,-4,4,C.ssD,C.ssD,0); mPop(); }
  mPush(); mT(0,CH-3,0); lathe([[110,0],[60,70],[0,90]],C.ss,20); mPop();
  const n=Math.min(22,LN.tt.n);
  for(let i=0;i<n;i++){
    const a=i*2.39996+hash1(i)*0.3, r=150+(i%3)*((tt.r-b.d/2-160)/2)+hash1(i+4)*20;
    const lying=hash1(i*3.3)<0.35;
    if(lying) drawBottle(r*Math.cos(a),CH+b.d/2-2,r*Math.sin(a),{yaw:a+1.2,tilt:Math.PI/2});
    else drawBottle(r*Math.cos(a),CH-2,r*Math.sin(a),{});
  }
  mPop();
  /* 벌크 호퍼 속 병 (적재량 비례 · 경사 바닥 위에 눕힘) */
  const hp=L.hop, hn=Math.round(clamp(S.mat.bottle/MAT_CAP.bottle,0,1)*30);
  for(let i=0;i<hn;i++){
    const layer=Math.floor(i/10), k=i%10;
    const u=(k%5+0.5)/5, v=(Math.floor(k/5)+0.5)/2;
    const x=lerp(hp.x0+b.h*0.5+20,hp.x1-40,u)+hash1(i)*20, z=lerp(hp.z0+b.d,hp.z1-b.d,v)+hash1(i+9)*30;
    const yf=hp.y0+60+(x-hp.x0)/(hp.x1-hp.x0)*180;
    drawBottle(x,yf+b.d/2+layer*(b.d-8),z,{yaw:hash1(i*5)*3,tilt:Math.PI/2});
  }
  /* 엘리베이터 녹색 클리트 벨트 · 병 */
  const e0=UA_EL[0], e1=UA_EL[1];
  mPush(); const len=mAlong(e0,e1);
  box(-110,110,0,len,-44,-36,[0.12,0.46,0.32,0.05],null,0);
  for(let y=(LN.elev%160);y<len;y+=160){ box(-104,104,y,y+5,-36,-8,[0.10,0.38,0.26,0.05],null,0);
    if(S.ua.elev&&!far&&Math.floor((y+LN.elev)/160)%2===0&&y>60&&y<len-60){ drawBottle(0,y+b.d/2+5,-36+b.h/2,{tilt:Math.PI/2,yaw:Math.PI/2}); } }
  mPop();
  /* 반전 사이드 벨트 (병과 함께 비틀림) */
  const ym=CH+b.h/2, w=b.d/2+7, bw=Math.min(62,b.h*0.55);
  for(const side of [-1,1]){
    const bc=[0.16,0.46,0.34,0.05], lug=[0.09,0.30,0.21,0.05], ph=LN.sbelt%40;
    for(let x=L.belt0;x<L.belt1-1;x+=40){
      const xm=x+20, th=uaRoll(xm), c=Math.cos(th), s=Math.sin(th), py=ym-side*w*s, pz=side*w*c;
      mPush(); mT(xm,py,pz); mRX(th); box(-20.5,20.5,-bw/2,bw/2,0,side*6,bc,null,0);
      if(!far){ const lx=((ph+x)%40)-20; box(lx-2,lx+2,-bw/2,bw/2,side*6,side*7.5,lug,null,0); }
      mPop();
    }
  }
  /* 이온 에어 분사 · 진공 흡입 (병이 노즐 위에 있을 때) */
  const inv=LN.bottles.filter(x=>x.zone==="line");
  if(LN.blowT>0) for(const ax of L.air){
    const on=inv.some(x=>Math.abs(pathAt(x.s).x-ax)<b.d*0.6);
    if(!on) continue;
    const g=gAlpha; gAlpha=0.30; tube([ax,CH-12,0],[ax,CH+34,0],3,[0.75,0.90,1.0,0.1],10,false,12); gAlpha=g;
    for(let k=0;k<5;k++){ const t=(LN.blowT*3+k/5)%1; boxC(ax+Math.sin(k*2.1)*6,CH-8+t*45,Math.cos(k*1.7)*6,2,2,2,[0.85,0.95,1,-1],null,0); }
  }
  if(LN.vacT>0) for(const vx of L.vac){
    for(let k=0;k<6;k++){ const t=(LN.vacT*2.2+k/6)%1; boxC(vx+Math.sin(k*1.3)*18*(1-t),CH+12-t*40,Math.cos(k*2.3)*14*(1-t),1.6,1.6,1.6,[0.55,0.55,0.55,0.1],null,0); }
  }
}

/* ── 앞쪽 스토퍼 핀 · 클램프 패드 (SG · HPE 공용) ── */
function stopperPins(x,b,pin,clampV){
  pinFront(x+b.d/2+7,pin);
  const y=CH+b.h*0.42, cx=x-b.d-5, zr=b.d/2+34, cz=lerp(zr-6,b.d/2+3,clampV);
  tube([cx,y,zr],[cx,y,cz],4.5,C.rodC,8); box(cx-10,cx+10,y-10,y+10,cz-1,cz+2,C.rubber,C.rubber,0);
}

/* ── SG-120 : 릴 · 띠 경로 · 트윈 벨트 · 커터 · 낙하 ── */
function dSG(){
  const I=insCfg("sg"), x=I.x, st=LN.st.sg, b=BD(), H=sgHeadY(), far=FAR();
  const stock=S.mat.gel/MAT_CAP.gel, rr=I.r0+(I.rF-I.r0)*Math.sqrt(clamp(stock,0,1)), wd=I.wd, rz=I.rz;
  const fed=S.sg.fed+(st?st.kin.feed:0), travel=fed*S.sg.pitch;
  /* 릴 (커버 창 안) */
  mPush(); mT(I.rx,I.ry,rz); mRZ(-travel/Math.max(rr,40));
  cylZ(0,0,-wd/2-8,wd/2+8,I.r0-6,C.dark,18);
  if(stock>0.005) cylZ(0,0,-wd/2,wd/2,rr,C.gel,28);
  for(const z of [-wd/2-6,wd/2+4]){ mPush(); mT(0,0,z); mRX(Math.PI/2); disc(0,I.r0-6,I.rF+6,C.ssD,24); mPop(); }
  for(let i=0;i<3;i++){ const a=i*Math.PI*2/3; box(Math.cos(a)*14-3,Math.cos(a)*14+3,Math.sin(a)*14-3,Math.sin(a)*14+3,-wd/2-10,wd/2+8,C.ss,null,0); }
  mPop();
  /* 릴 커버 앞 뚜껑 (짙은 투명창) : 왼쪽 경첩 · 릴 교체 때 열린다 */
  { const o=smooth(DOOR_OPEN.sgLid||0), Rr=I.R;
    mPush(); mT(I.rx-Rr,I.ry,70); mRY(-o*1.9); mT(Rr,0,0);
    mPush(); mRX(-Math.PI/2); disc(0,Rr-22,Rr,C.ssL,40); mPop();
    { const g2=gAlpha; gAlpha=0.45; mPush(); mRX(-Math.PI/2); disc(0,0,Rr-22,[0.12,0.13,0.15,0.4],40); mPop(); gAlpha=g2; }
    cylZ(0,0,0,14,16,C.ssL,12); cylZ(Rr*0.7,Rr*0.7,0,10,8,C.ssD,10); cylZ(-Rr*0.7,-Rr*0.7,0,10,8,C.ssD,10);
    box(Rr-30,Rr-8,-40,40,6,22,C.dark,C.dark,0);
    mPop(); }
  /* 띠 경로 : 릴 → 커버 출구 → 윗면 롤러 2 → 슬롯 → 트윈 벨트 사이 → 커터 */
  const by0=H.y0+50, by1=H.y0+290, [r1,r2]=I.top, top=SGH.yT;
  if(stock>0.005){
    const pts=[[I.rx+rr*0.6,I.ry-rr*0.8,rz],[I.rx+I.R*0.75,I.ry-I.R+6,rz],[r1[0]-26,r1[1]-4,0],[r1[0]-18,r1[1]+19,0],[r1[0],r1[1]+26,0],
      [r2[0],r2[1]+26,0],[r2[0]-19,r2[1]+18,0],[x,top-10,0],[x,H.y0+40,0]];
    for(let i=0;i<pts.length-1;i++){ const a=pts[i],c=pts[i+1];
      quad([a[0],a[1],a[2]-wd/2],[c[0],c[1],c[2]-wd/2],[c[0],c[1],c[2]+wd/2],[a[0],a[1],a[2]+wd/2],C.gel); }
    if(!far){ const ph=travel%S.sg.pitch;
      for(let y=top-10-ph;y>H.y0+46;y-=S.sg.pitch) box(x-1.2,x+1.2,y-1.5,y+1.5,-wd/2-0.5,wd/2+0.5,[0.72,0.74,0.76,0.05],null,0);
      for(let y=top-10-ph+S.sg.pitch*0.5;y>H.y0+46;y-=S.sg.pitch) box(x-1.3,x+1.3,y-4,y+4,-8,8,C.gelPrint,null,0); }
  }
  /* 롤러 회전 표시 · 트윈 벨트 (노란 타이밍 벨트 : 띠와 같은 속도) */
  for(const [rx,ry] of I.top){ mPush(); mT(rx,ry,0); mRZ(-travel/26); box(-2,2,-24,24,34,36,C.ssD,null,0); mPop(); }
  const belt=[0.86,0.66,0.22,0.1], tooth=[0.55,0.40,0.12,0.1];
  for(const s of [-1,1]){
    box(x+s*9,x+s*14,by0,by1,-38,38,belt,null,0);
    if(!far){ const ph=travel%12; for(let y=by1-ph;y>by0;y-=12) box(x+s*8.4,x+s*9.4,y-1.5,y+1.5,-38,38,tooth,null,0); }
  }
  /* 커터 (왕복) */
  const cut=st?st.kin.cut:0;
  box(x-100+cut*80,x-40+cut*80,H.y0+26,H.y0+36,-wd/2-6,wd/2+6,C.brushed,null,0);
  /* 잘린 파우치 → 튜브 → 병 */
  if(st&&st.ph==="proc"&&st.kin.drop>0&&st.b){
    const t=st.kin.drop, y=lerp(H.y0+24,CH+b.h-6,Math.min(1,t*1.2));
    box(x-15,x+15,y-20,y+20,-4,4,C.gel,C.gel,0);
  }
  if(st) stopperPins(x,b,st.pin,st.clamp);
}

/* ── 로드셀 스테이션 : 포크(캐리지 · 4 핑거 · 실린더) · 케이블 체인 · 게이트 / IN 핀 · 클램프 ── */
function dLoadCell(st){
  if(!st) return;
  const b=BD(), d=b.d, G=lcGeo(st.X), P=L.lcP, dx=st.car*P, far=FAR();
  const tipZ=lerp(d/2+16,-(d/2+8),st.fin);
  const fx=[G.IN-d/2-10,G.A-d/2-10,G.B-d/2-10,G.B+d/2+10].map(v=>v+dx);
  const cx0=fx[0]-40, cx1=fx[3]+40;
  box(cx0,cx1,CH-116,CH-88,140,270,[0.78,0.81,0.84,0.6],[0.84,0.86,0.88,0.6]);
  for(const x of fx){
    box(x-6,x+6,CH-88,CH+46,150,172,C.ss);                                      /* 세움 암 */
    box(x-3,x+3,CH+24,CH+46,tipZ,172,C.brushed,null,0);                          /* 핑거 날 */
    ellipsoid([x,CH+35,tipZ],[3,11,10],C.brushed,8,4);
    if(!far){ cylZ(x,CH-70,178,262,12,C.cyl,12); cylZ(x,CH-70,262,262+(1-st.fin)*26,5,C.rodC,8); cylZ(x,CH-70,168,178,15,C.ssD,12); }
  }
  /* 케이블 체인 (캐리지 끝 → 고정점) */
  if(!far){ const ax=cx1, fx2=st.X+60, yA=CH-80, yB=CH-150, zc=285, r=(yA-yB)/2, pts=[];
    const midX=Math.max(ax,fx2)+20;
    for(let x=ax;x<midX;x+=16) pts.push([x,yA,zc]);
    for(let i=0;i<=8;i++){ const a=Math.PI/2-i/8*Math.PI; pts.push([midX+r*Math.cos(a),yB+r+r*Math.sin(a),zc]); }
    for(let x=midX;x>fx2;x-=16) pts.push([x,yB,zc]);
    for(const p of pts) box(p[0]-7,p[0]+7,p[1]-9,p[1]+9,zc-16,zc+16,C.black,null,0); }
  /* 핀 · 클램프 */
  pinFront(G.gateFace+4,st.gate); pinFront(G.inFace+4,st.inPin);
  const y=CH+b.h*0.42, cxp=G.gateFace-1.5*d, zr=d/2+34, cz=lerp(zr-6,d/2+3,st.clamp);
  tube([cxp,y,zr],[cxp,y,cz],4.5,C.rodC,8); box(cxp-10,cxp+10,y-10,y+10,cz-1,cz+2,C.rubber,C.rubber,0);
}

/* ── DMC-60T ── */
function dDMC(){
  const D=LN.dmc, b=BD(), yG=dmcGateY(), far=FAR(), N=S.rc.n, col=tabCol();
  if(!D) return;
  const run=S.running;
  const jig=run?Math.sin(D.vibPh*2*Math.PI*23)*1.2:0;
  mPush(); mT(L.dmcDX,0,0);
  /* 호퍼 속 정제 (적재량 → 높이) */
  const f=clamp(S.mat.tab/matCap("tab"),0,1), h=DMC.hop;
  if(f>0.002){
    const y=h.y0+18+f*(h.y1-h.y0-40), u=(y-h.y0)/(h.y1-h.y0);
    const x0=lerp(h.ox0,h.x0,u)+6, x1=lerp(h.ox1,h.x1,u)-6, z0=lerp(h.oz0,h.z0,u)+6, z1=lerp(h.oz1,h.z1,u)-6, cx=(x0+x1)/2, cz=(z0+z1)/2;
    tri([x0,y,z0],[x1,y,z0],[cx,y+26,cz],col); tri([x1,y,z0],[x1,y,z1],[cx,y+26,cz],col);
    tri([x1,y,z1],[x0,y,z1],[cx,y+26,cz],col); tri([x0,y,z1],[x0,y,z0],[cx,y+26,cz],col);
    if(!far) for(let i=0;i<24;i++){ const px=lerp(x0+10,x1-10,hash1(i*1.7)), pz=lerp(z0+10,z1-10,hash1(i*3.1));
      const e=1-Math.max(Math.abs(px-cx)/((x1-x0)/2),Math.abs(pz-cz)/((z1-z0)/2)); drawTab(px,y+e*26+2,pz,hash1(i)*3,col); }
  }
  if(!far){
    /* 트레이 1 · 2 : 흩어진 정제가 앞으로 흘러간다 */
    const tr=[[DMC.t1,D.tray[0],22,0.35,4],[DMC.t2,D.tray[1],36,0.55,12]];
    for(const [t,fill,n,sp,amp] of tr){
      const m=Math.round(n*fill), Lz=t.z1-t.z0-12, gw=(t.x1-t.x0)/12;
      for(let i=0;i<m;i++){
        const z=t.z0+6+((hash1(i*2.3)*Lz+D.vibPh*sp*60)%Lz), gi=Math.floor(hash1(i*5.7+1)*12), x=t.x0+gi*gw+gw/2+(hash1(i*3.9)-0.5)*gw*0.3;
        drawTab(x,t.y+S.rc.prod.thk/2+jig+(amp>4?1:0),z,hash1(i*9.1)*6,col);
      }
    }
    /* 트레이 3 : 12 트랙 */
    const sp=D.spacing||20, Lt=DMC.t3z1-DMC.t3z0;
    for(let c=0;c<12;c++){
      if(D.tray[2]<0.05) continue;
      const xc=DMC.x0+c*DMC.tw+DMC.tw/2, ph=D.chPh[c]%sp;
      for(let k=0;;k++){
        const u=(k+1)*sp-ph; if(u>Lt-4) break;
        if(hash1(c*31+k+Math.floor(D.chPh[c]/sp)*7)>D.tray[2]*1.02) continue;
        drawTab(xc,DMC.t3y+S.rc.prod.thk/2-2+jig,DMC.t3z1-u,Math.PI/2,col);
      }
    }
    /* 센서로 떨어지는 정제 (센서 박스 윗면 아래로 사라짐) */
    for(const q of D.falls){
      const y=DMC.t3y-4-0.5*9800*q.t*q.t;
      if(y<1450) continue;
      drawTab(DMC.x0+q.c*DMC.tw+DMC.tw/2,y,DMC.t3z1+14,Math.PI/2,col);
    }
  }
  /* 센서 LED (윗면 점검창 아래 · 계수 순간 점등) */
  for(let c=0;c<12;c++){ const xc=DMC.x0+c*DMC.tw+DMC.tw/2, on=D.led[c]>0.25, dirty=S.dmc.dirt[c]>0.6;
    box(xc-5,xc+5,1446,1449,-104,-86,on?E.ledG:dirty?E.ledY:(S.main?[0.10,0.40,0.20,-1]:OFF.g),null,0); }
  mPop();
  /* 게이트 버퍼 · 게이트 날개 · 노즐 흐름 */
  for(const g of [0,1]){
    const nx=g===0?L.n1:L.n2, fill=Math.min(1,D.buf[g]/N);
    if(fill>0&&!far){ mPush(); mT(nx,yG-20,0); lathe([[34,0],[30,6+fill*18],[0,10+fill*26]],col,12); mPop(); }
    const a=D.gate[g]*1.25;
    for(const s of [-1,1]){ mPush(); mT(nx+s*34,yG-22,0); mRZ(-s*a); box(s>0?-34:0,s>0?0:34,-3,0,-30,30,C.ss,C.ss,0); mPop(); }
    const q=D.dump[g];
    if(q&&q.t<0.28&&!far){
      for(let i=0;i<9;i++){ const t=(q.t*3.2+i/9)%1, y=lerp(yG-30,CH+b.h*0.4,t);
        drawTab(nx+Math.sin(i*2.1)*5,y,Math.cos(i*1.7)*5,i,col); }
    }
  }
  /* 병 스토퍼 3조 · 입구 클램프 (앞) */
  for(const [px,v] of [[L.n2+b.d/2+4,D.exit],[L.n1+b.d/2+4,D.mid],[L.n1-b.d-6,D.entry]]) pinFront(px,v);
  const y=CH+b.h*0.42, cxp=L.n1-b.d*1.5-10, zr=b.d/2+34, cz=lerp(zr-6,b.d/2+3,D.clampB?1:0);
  tube([cxp,y,zr],[cxp,y,cz],4.5,C.rodC,8); box(cxp-10,cxp+10,y-10,y+10,cz-1,cz+2,C.rubber,C.rubber,0);
}

/* ── 리젝트 : 푸셔 · 트레이로 미끄러지는 병 · 트레이 속 불합격 병 ── */
const REJT={tw:150, zA:60, zB:460, yA:CH-12, yB:CH-190};
const rejFloorY=z=>REJT.yA+(clamp(z,REJT.zA,REJT.zB)-REJT.zA)*(REJT.yB-REJT.yA)/(REJT.zB-REJT.zA);
function rejSlot(i){
  const b=BD(), nc=Math.max(1,Math.floor((2*REJT.tw-20)/(b.h+8))), nr=Math.max(1,Math.floor((REJT.zB-REJT.zA-30)/(b.d+4)));
  const col=i%nc, row=Math.floor(i/nc)%nr, layer=Math.floor(i/(nc*nr));
  const z=REJT.zB+REJT.tw*0.35-b.d/2-row*(b.d+4), x=L.rej-REJT.tw+14+col*(b.h+8)+b.h;
  return {x, y:rejFloorY(z)+b.d/2-2+layer*b.d*0.85, z};
}
function dReject(){
  const R=LN.rej, b=BD(), x=L.rej, y=CH+b.h*0.42;
  const pz=-(b.d/2+40)+R.ext*(b.d+70);
  tube([x,y,-330],[x,y,pz],6,C.rodC,10); box(x-26,x+26,y-24,y+24,pz-6,pz,C.rubber,C.rubber,0);
  for(const q of LN.pushing){
    const t=q.pt, sl=rejSlot(LN.rejBin.length);
    if(t<0.22){ drawBottle(x,CH-1,(t/0.22)*(b.d/2+62),{fill:q.fill,gel:q.gel,ng:true}); continue; }
    const u=smooth(Math.min(1,(t-0.22)/0.6)), z0=b.d/2+62;
    const tip=Math.min(1,u*2.2), zz=lerp(z0,sl.z,u), xx=lerp(x+b.h/2*tip,sl.x,u);
    const yy=lerp(CH-1,rejFloorY(zz)+b.d/2-2,Math.min(1,u*1.6));
    drawBottle(xx,yy-(1-tip)*0,zz,{fill:q.fill,gel:q.gel,ng:true,tilt:tip*Math.PI/2});
  }
  LN.rejBin.forEach((q,i)=>{ const p=rejSlot(i); drawBottle(p.x,p.y,p.z,{tilt:Math.PI/2,ng:true,fill:1}); });
}

/* ── HPE-100 : 필름 롤 · 필름 띠 · 톱날 커터 · 인덱싱 디스크 · 튜브 속 필름 · 푸셔 ── */
function dPE(){
  const st=LN.st.pe, b=BD(), x=L.pe, yD=peDiscY(), far=FAR(), zc=PED.zc, n=PED.n, r=PED.r;
  const stock=clamp(S.mat.film/MAT_CAP.film,0,1), I=insCfg("pe");
  const idx=st&&st.ph==="proc"?st.kin.idx:0, base=Math.PI/2+(S.pe.fed+idx)*2*Math.PI/n;
  const film=[0.86,0.93,0.97,0.12];
  /* 필름 롤 2 (가로 축) */
  const rr=I.r0+(I.rF-I.r0)*Math.sqrt(stock), rot=(S.pe.fed+(st?st.kin.feed:0))*S.pe.len/Math.max(rr,30);
  for(const sx of [-1,1]){
    const x0=x+sx*70, x1=x+sx*270, xa=Math.min(x0,x1), xb=Math.max(x0,x1);
    cylX(xa,xb,1450,-590,I.r0-8,C.dark,16);
    if(stock>0.005){ const g=gAlpha; gAlpha=0.85; cylX(xa+6,xb-6,1450,-590,rr,film,28); gAlpha=g; }
    for(const ex of [xa,xb]){ mPush(); mT(ex,1450,-590); mRX(rot*(sx)); box(-2,2,-I.r0+10,I.r0-10,-4,4,C.ss,null,0); box(-2,2,-4,4,-I.r0+10,I.r0-10,C.ss,null,0); mPop(); }
    /* 필름 띠 : 롤 아래 → 장구 롤러 → 포머 → 뒤 튜브 */
    if(stock>0.005){
      const lx=x+sx*106, lz=zc-106, w=26, g=gAlpha; gAlpha=0.7;
      const pts=[[lx,1450-rr,-590],[lx,yD+330,lz-80],[lx,yD+230,lz-80],[lx,yD+150,lz-40],[lx,yD+18,lz]];
      for(let i=0;i<pts.length-1;i++){ const a=pts[i],c=pts[i+1]; quad([a[0]-w,a[1],a[2]],[a[0]+w,a[1],a[2]],[c[0]+w,c[1],c[2]],[c[0]-w,c[1],c[2]],film); }
      gAlpha=g;
      /* 톱날 커터 (검은 톱니) */
      const ct=st?st.kin.cut:0, cz=lz-58+ct*44;
      box(lx-44,lx+44,yD+30,yD+46,cz-8,cz,C.black,C.black,0);
      if(!far) for(let k=-40;k<=40;k+=8) box(lx+k-2,lx+k+2,yD+30,yD+46,cz,cz+5,C.black,null,0);
      /* 캐리지 (위아래 이송) */
      const cy=yD+180+(st?Math.sin((st.kin.feed||0)*Math.PI)*24:0);
      box(lx-30,lx+30,cy-30,cy+30,lz-84,lz-60,C.ss);
      cylY(lx,lz-40,cy-40,cy+60,14,C.ssL,12);
    }
  }
  /* 인덱싱 디스크 : 림 · 스포크 · 허브 · 튜브 8 */
  const g2=gAlpha;
  mPush(); mT(x,yD,zc); mRY(-(base-Math.PI/2));
  mPush(); lathe([[r+40,0],[r+40,14],[r+22,14],[r+22,0]],C.alu,40); mPop();
  cylY(0,0,0,14,56,C.alu,24);
  for(let k=0;k<n;k++){ const a=k*2*Math.PI/n+Math.PI/n; mPush(); mRY(-a); box(40,r+24,0,14,-7,7,C.alu,C.alu,0); mPop(); }
  mPop();
  const tr=Math.max(12,b.nk/2+2);
  for(let k=0;k<n;k++){
    const a=base+k*2*Math.PI/n, tx=x+r*Math.cos(a), tz=zc+r*Math.sin(a);
    cylY(tx,tz,yD-4,yD+18,tr+6,C.ssL,16);
    tube([tx,yD,tz],[tx,yD-220,tz],tr,C.ss,16,false);
    cylY(tx,tz,yD-226,yD-214,tr+2,C.ssD,16);
    /* 튜브 속 필름 : 뒤 레인을 지난 튜브부터 앞 투입 위치 전까지 */
    let ang=((a-Math.PI/2)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);   /* 0 = 앞 */
    const loaded=S.mat.film>0&&ang>Math.PI*0.70&&ang<Math.PI*2-0.01;
    if(loaded&&!far){ gAlpha=0.85; mPush(); mT(tx,yD-30,tz); lathe([[tr-3,0],[tr-6,10],[0,16]],film,12); mPop(); gAlpha=g2; }
  }
  /* 앞 푸셔 로드 */
  const plg=st?st.kin.plg:0, tip=lerp(yD+150,CH+b.h+2,plg);
  tube([x,yD+170,0],[x,tip,0],6,C.rodC,10); cylY(x,0,tip-4,tip,Math.max(8,tr-3),C.ss,12);
  if(st&&st.ph==="proc"&&st.kin.drop>0&&st.b){
    const y=Math.min(yD-30,tip-4); gAlpha=0.8; mPush(); mT(x,y,0); lathe([[tr-3,-4],[tr-6,6],[0,12]],film,12); mPop(); gAlpha=g2;
  }
  if(st) stopperPins(x,b,st.pin,st.clamp);
}

/* ── RCS-120 ── */
function dRCS(){
  const R=LN.rc, b=BD(), A=L.A, B=L.B, T=L.T, Y=rcY(), far=FAR();
  const d=b.d;
  /* 타이밍 스크류 (가변 피치 나선) */
  const f=SCREW.fit(d), zs=d/2+32, ys=CH+b.h*0.42, rF=Math.min(30,d/2+6);
  cylX(L.screw0-20,L.A.x-30,ys,zs,16,C.uhmw,14);
  const pts=[];
  for(let u=-f.nS;u<=0;u+=0.04){ const x=XS+screwS(u,d); if(x>L.A.x-24) break;
    const a=2*Math.PI*(u-R.phi)+Math.PI; pts.push([x,ys+rF*Math.sin(a),zs-rF*Math.cos(a)]); }
  tubePath(pts,4.5,C.uhmw,6);
  /* 스타휠 (A · B) · 터렛 포켓 판 (흰 UHMW) */
  const star=(c,base)=>{ for(const yy of [CH+b.h*0.30,CH+b.h*0.70]) starPlate(c,yy,base,d); };
  star(A,Math.PI/2-R.phi*Math.PI/2);
  star(B,PATH.bT-(S_A-S_T1)/L.R-R.phi*Math.PI/2);
  star(T,PATH.tA+(S_A-S_T0)/L.R+R.phi*Math.PI/2);
  /* 황색 타이밍 벨트 (터렛 바깥 · 병을 포켓에 눌러 잡음) */
  timingBelt(R.phi*P_PITCH);
  /* 헤드 캐러셀 */
  const car=R.phi*Math.PI/2;
  mPush(); mT(T.x,0,T.z); mRY(-car);
  cylY(0,0,Y.yc+60,Y.yc+110,L.R+58,C.ss,32); cylY(0,0,Y.yc+110,Y.yc+170,90,C.ssD,20);
  for(let i=0;i<4;i++){ const a=i*Math.PI/2; mPush(); mRY(-a); box(L.R-40,L.R+40,Y.yc-10,Y.yc+62,-40,40,C.cab,C.ssL); mPop(); }
  mPop();
  /* 3조 공압 척 헤드 4 */
  for(let j=0;j<4;j++){
    const a=headAngle(j), h=R.heads[j], hx=T.x+L.R*Math.cos(a), hz=T.z+L.R*Math.sin(a);
    const cup0=CH+b.h-b.capH*0.62+(1-h.y)*112, ct=cup0+b.capH+12;
    cylY(hx,hz,ct+70,Y.yc,11,C.rodC,12);
    cylY(hx,hz,ct+10,ct+74,27,C.ssL,18);
    cylY(hx,hz,ct+74,ct+84,22,C.ssD,16);
    cylY(hx,hz,ct,ct+10,24,C.brushed,18);
    mPush(); mT(hx,0,hz); mRY(-h.spin);
    const jr=b.capD/2+(h.cap?4:12);
    for(let k=0;k<3;k++){ mPush(); mRY(-k*2*Math.PI/3); box(jr,jr+16,cup0+2,ct+4,-9,9,C.black,C.black); box(jr-2,jr+30,ct-4,ct+4,-12,12,C.black,C.black,0); mPop(); }
    mPop();
    if(h.cap) drawCap([hx,ct-2,hz],null,14);
  }
  /* 슈트 · 벨트 · 체인의 캡 */
  const n=R.chute;
  for(let i=0;i<n;i++){ const q=capAt(i*(b.capD+3)+b.capD/2+4); drawCap(q.p,q.k==="c"?q.n:null,far?8:12); }
  /* 녹색 캡 벨트 · 검은 포켓 체인 (움직임) */
  const cp=capPath(), bl=cp.belt, run=S.running&&!S.rcp.jam, mv=R.phi*P_PITCH*(run?1:1);
  box(bl.x0,bl.x1,bl.y-4,bl.y,bl.z-b.capD/2-3,bl.z+b.capD/2+3,[0.12,0.46,0.30,0.08],null,0);
  if(!far) for(let x=bl.x0+((mv*0.6)%30);x<bl.x1;x+=30) box(x-1,x+1,bl.y,bl.y+0.4,bl.z-b.capD/2-3,bl.z+b.capD/2+3,[0.08,0.30,0.20,0.08],null,0);
  const ch=cp.chain, per=4*ch.hl+2*Math.PI*ch.r, np=Math.max(10,Math.floor(per/34));
  mPush(); mT(ch.cx,ch.y,ch.cz); mRY(-ch.ang);
  for(let i=0;i<np;i++){ let s=((i/np)*per+mv*0.6)%per, px,pz;
    if(s<2*ch.hl){ px=-ch.hl+s; pz=-ch.r; }
    else if(s<2*ch.hl+Math.PI*ch.r){ const a=-Math.PI/2+(s-2*ch.hl)/ch.r; px=ch.hl+ch.r*Math.cos(a); pz=ch.r*Math.sin(a); }
    else if(s<4*ch.hl+Math.PI*ch.r){ px=ch.hl-(s-2*ch.hl-Math.PI*ch.r); pz=ch.r; }
    else { const a=Math.PI/2+(s-4*ch.hl-Math.PI*ch.r)/ch.r; px=-ch.hl+ch.r*Math.cos(a); pz=ch.r*Math.sin(a); }
    box(px-12,px+12,-18,-4,pz-10,pz+10,C.black,null,0);
  }
  mPop();
  /* 볼 피더 속 캡 (나선 트랙을 오른다 · 바닥 더미) */
  if(!far&&S.mat.cap>0){ const bw=RCBOWL;
    for(let i=0;i<12;i++){ const t=((i/12)+R.bowl*0.08)%1, a=t*Math.PI*3.6, rr=226; drawCap([bw.x+rr*Math.cos(a),bw.y-210+t*205+b.capH,bw.z+rr*Math.sin(a)],null,8); }
    for(let i=0;i<Math.min(18,Math.round(S.mat.cap/30));i++){ const a=hash1(i)*6.28, rr=60+hash1(i+3)*130; drawCap([bw.x+rr*Math.cos(a),bw.y-212+b.capH+Math.floor(i/9)*b.capH,bw.z+rr*Math.sin(a)],null,8); }
  }
}
/* 타이밍 벨트 : 터렛 바깥 원호(병 접촉) + 두 풀리 감김 + 바깥 복귀 원호 */
function timingBelt(mv){
  const b=BD(), T=L.T, rb=L.R+b.d/2+8, pr=30, a0=PATH.tA+0.30, a1=PATH.tB-0.30, yB=CH+b.h*0.40, far=FAR();
  const pts=[];
  for(let i=0;i<=40;i++){ const a=a0+(a1-a0)*i/40; pts.push([rb*Math.cos(a),rb*Math.sin(a)]); }
  const wrap=(ac,from)=>{ const cx=(rb+pr)*Math.cos(ac), cz=(rb+pr)*Math.sin(ac), rad=[Math.cos(ac),Math.sin(ac)], tan=[-Math.sin(ac),Math.cos(ac)];
    for(let i=1;i<=10;i++){ const t=i/10*Math.PI, c=Math.cos(t), s=Math.sin(t);
      const dir=[-rad[0]*c+from*tan[0]*s, -rad[1]*c+from*tan[1]*s]; pts.push([cx+pr*dir[0],cz+pr*dir[1]]); } };
  wrap(a1,1);
  for(let i=0;i<=40;i++){ const a=a1+(a0-a1)*i/40; pts.push([(rb+2*pr)*Math.cos(a),(rb+2*pr)*Math.sin(a)]); }
  wrap(a0,-1);
  const col=[0.84,0.66,0.34,0.08], dk=[0.62,0.46,0.20,0.08];
  let acc=0; const L2=[0];
  for(let i=1;i<pts.length;i++){ acc+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]); L2.push(acc); }
  for(let i=0;i<pts.length-1;i++){
    const p=pts[i], q=pts[i+1];
    quad([T.x+p[0],yB-14,T.z+p[1]],[T.x+q[0],yB-14,T.z+q[1]],[T.x+q[0],yB+14,T.z+q[1]],[T.x+p[0],yB+14,T.z+p[1]],col);
  }
  if(!far){ const pitch=16, off=mv%pitch;
    for(let s=off;s<acc;s+=pitch){ let i=1; while(i<L2.length-1&&L2[i]<s) i++; const t=(s-L2[i-1])/((L2[i]-L2[i-1])||1), p=pts[i-1], q=pts[i];
      const x=T.x+p[0]+(q[0]-p[0])*t, z=T.z+p[1]+(q[1]-p[1])*t; box(x-1.5,x+1.5,yB-14,yB+14,z-1.5,z+1.5,dk,null,0); } }
}
/* 포켓 4개 스타 판 (윤곽 : 원 − 포켓 반원) */
function starPlate(c,y,base,d){
  const R=L.R, rp=d/2+2, fw=rp+16, Ro=R+rp*0.55, Rh=Math.max(60,R-rp-26), pts=[];
  for(let i=0;i<=128;i++){
    const t=i/128*Math.PI*2; let r=Rh;
    for(let k=0;k<4;k++){ let dl=t-(base+k*Math.PI/2); dl=Math.atan2(Math.sin(dl),Math.cos(dl));
      const q=R*Math.sin(dl); if(Math.abs(q)<fw&&Math.cos(dl)>0){
        let ro=Ro; if(Math.abs(q)<rp) ro=R*Math.cos(dl)-Math.sqrt(rp*rp-q*q);
        r=Math.max(r,Math.max(Rh,ro)); } }
    pts.push([c.x+r*Math.cos(t),c.z+r*Math.sin(t)]);
  }
  const th=12;
  for(let i=0;i<pts.length-1;i++){
    const p=pts[i],q=pts[i+1];
    tri([c.x,y+th,c.z],[q[0],y+th,q[1]],[p[0],y+th,p[1]],C.uhmw);
    tri([c.x,y,c.z],[p[0],y,p[1]],[q[0],y,q[1]],C.uhmw);
    quad([p[0],y,p[1]],[q[0],y,q[1]],[q[0],y+th,q[1]],[p[0],y+th,p[1]],[0.86,0.86,0.83,0.05]);
  }
  cylY(c.x,c.z,y-4,y+th+4,34,C.ss,12);
}

/* ── 집적 테이블 ── */
function dTable(){
  const T=LN.table, t=L.table, b=BD();
  mPush(); mT(t.x,0,t.z); mRY(-T.ang);
  disc(CH-4,0,t.r,C.brushed,48);
  for(let i=0;i<6;i++){ mPush(); mRY(i*Math.PI/3); box(40,t.r-8,CH-4,CH-1,-3,3,C.ssD,C.ssD,0); mPop(); }
  mPop();
  for(const q of T.list){
    const a=q.ta+T.ang, px=t.x+q.tr*Math.cos(a), pz=t.z+q.tr*Math.sin(a);
    const ex=XE+10, ez=0, u=smooth(q.tt);
    drawBottle(lerp(ex,px,u),CH-2,lerp(ez,pz,u),{cap:true,pe:1,fill:1});
  }
}


/* ── 라인 위 병 ── */
function dBottles(){
  for(const q of LN.bottles){
    if(q.zone!=="line") continue;
    const p=pathAt(q.s);
    const roll=(p.x>L.inv0&&p.x<L.inv3)?uaRoll(p.x):0;
    drawBottle(p.x,CH-1,p.z,{roll, fill:q.fill, gel:q.gel, pe:q.pe, cap:q.cap, capY:q.capY||0, capSpin:q.spin||0, ng:q.ng&&q.gross!=null});
  }
}

/* ── 경광등 · HMI 화면 ── */
function dPanels(){
  const on=S.main;
  for(const k of ["ua","sg","dmc","wc","pe","rc"]){
    const l=LAMPS[k], h=HMIS[k];
    lampLights(l[0],l[1],l[2],on?lampState(k):"off");
    hmiFace(h[0],h[1],h[2]+2,h[3],h[4],on,0);
  }
}

/* ═══ 작업자 ═══ */
const WK=[
  {id:"A", x:-2900, z:AISLE, home:[-2900,AISLE], route:[], yaw:0, gait:0, walking:false, job:null, t:0},
  {id:"B", x:4400,  z:AISLE, home:[4400,AISLE],  route:[], yaw:0, gait:0, walking:false, job:null, t:0}
];
/* 작업 정의 : 서는 위치 · 손 목표 · 들고 가는 물건 · 여는 도어 · 쏟기(pour) · 확대 시점
   서는 위치는 설비 앞면 · 열린 도어와 겹치지 않게 잡았다 (통로 z=AISLE 에서 수직으로 들어온다) */
const JOBS={
  bottle:{stand:[-3640,640], reach:[-3640,1560,-300], carry:"box",  view:"bottle", dur:2.8, door:"uaR", pour:true},
  gel:   {stand:[L.sg-300,620], reach:[L.sg-440,1700,40], carry:"reel", view:"gel", dur:2.6, lid:"sgLid"},
  tab:   {stand:[-64,440], reach:[336,1800,-620], carry:"drum", view:"tab", dur:2.9, pour:true},
  film:  {stand:[3557,710], reach:[3487,1450,-590], carry:"roll", view:"film", dur:2.6, door:"peL"},
  cap:   {stand:[5128,700], reach:[5028,1530,-300], carry:"bag",  view:"cap", dur:2.7, door:"rcL", pour:true},
  reject:{stand:[L.rej+40,800], reach:[L.rej,CH-100,380], carry:null, view:"reject", dur:2.0},
  table: {stand:[L.table.x,900], reach:[L.table.x,1000,330], carry:null, view:"table", dur:2.2},
  look:  {stand:[0,AISLE-150], reach:null, carry:null, dur:1.4}
};
function wkFor(x){ return x<1500?WK[0]:WK[1]; }
function wkBusy(){ return WK.some(w=>w.job||w.route.length); }
/* 작업 시작 : 통로를 따라 걸어가서 작업 → 콜백 */
function startWork(key,cb,opt){
  const j=Object.assign({},JOBS[key]||JOBS.look,opt||{});
  const w=wkFor(j.stand[0]);
  if(w.job){ return false; }
  const rt=[];
  if(Math.abs(w.z-AISLE)>30) rt.push([w.x,AISLE]);
  if(j.door){ rt.push([j.stand[0],AISLE]); rt.push([j.stand[0],DOOR_Z]); }     /* 도어 회전 범위 밖에서 대기 */
  else { rt.push([j.stand[0],AISLE]); rt.push([j.stand[0],j.stand[1]]); }
  w.route=rt; w.job={key,j,cb,phase:j.door?"walk0":"walk",t:0}; w.carry=j.carry;
  if(j.view&&WORKVIEW[j.view]&&R3.gl){ w.job.prevView=cam.view; const v=WORKVIEW[j.view]; cam.view="work"; cam.yawT=v.yaw; cam.pitchT=v.pitch; cam.distT=v.dist; cam.txT=v.tx; cam.tyT=v.ty; cam.tzT=v.tz; }
  return true;
}
const DOOR_Z=AISLE+320;
function wkTick(dt){
  doorTick(dt);
  for(const w of WK){
    w.walking=false;
    if(w.route.length){
      const [tx,tz]=w.route[0], dx=tx-w.x, dz=tz-w.z, dd=Math.hypot(dx,dz), st=Math.min(dd,dt*1150);
      if(dd>1){ w.x+=dx/dd*st; w.z+=dz/dd*st; w.walking=true; w.gait+=st/150; w.face=Math.atan2(-dx,-dz); }
      if(dd-st<=1) w.route.shift();
      continue;
    }
    const J=w.job;
    if(J){
      if(J.phase==="walk0"){ J.phase="door"; J.t=0; }
      if(J.phase==="door"){ w.face=0; if((DOOR_OPEN[J.j.door]||0)>=0.98||!DOORS.some(D=>D.id===J.j.door)){ J.phase="walk"; w.route=[[J.j.stand[0],J.j.stand[1]]]; } continue; }
      if(J.phase==="exit"){ w.job=null; w.idle=0; continue; }
      if(J.phase==="walk"){ J.phase="work"; J.t=0; }
      J.t+=dt;
      if(J.j.reach){ const r=J.j.reach; w.face=Math.atan2(-(r[0]-w.x),-(r[2]-w.z)); }
      else w.face=0;
      if(J.t>=J.j.dur){
        w.carry=null; w.idle=0;
        if(J.prevView&&cam.view==="work") camSet(J.prevView==="work"?"all":J.prevView);
        if(J.j.door){ J.phase="exit"; w.route=[[w.x,DOOR_Z]]; } else w.job=null;
        try{ J.cb&&J.cb(); }catch(e){ console.error(e); }
      }
    }else{
      w.idle=(w.idle||0)+dt;
      if(w.idle>2.5&&(Math.abs(w.x-w.home[0])>5||Math.abs(w.z-w.home[1])>5)){
        const rt=[]; if(Math.abs(w.z-AISLE)>30) rt.push([w.x,AISLE]); rt.push(w.home); w.route=rt; w.idle=0;
      }
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
function drawWorkers(){ for(const w of WK){ const e=R3.eye, dd=Math.hypot(e[0]-w.x,e[1]-900,e[2]-w.z); if(dd>1500&&(dd>cam.dist*0.8||w.job)) drawWorker(w); } }
/* 작업 진행 : 도어가 먼저 열리고 (0.45 s) 손을 뻗는다 · 끝나기 0.45 s 전에 손을 거둔다 */
function reachAmt(J){ const t=J.t-0.15, e=J.j.dur-0.45; if(t<=0) return 0; return Math.min(1,t*2.6)*(J.t>e?Math.max(0,(J.j.dur-J.t)/0.45):1); }
function drawWorker(w){
  const scale=1650/488, x=w.x, z=w.z, far=FAR();
  const want=w.face!==undefined?w.face:0;
  if(w.yaw===undefined) w.yaw=want;
  let dl=want-w.yaw; while(dl>Math.PI) dl-=2*Math.PI; while(dl<-Math.PI) dl+=2*Math.PI; w.yaw+=dl*0.2;
  const cy=Math.cos(w.yaw), sy=Math.sin(w.yaw);
  const J=w.job, work=J&&J.phase==="work"&&J.j.reach, reach=work?reachAmt(J):0;
  const W=([a,b,c])=>[x+(a*cy+c*sy)*scale,b*scale,z+(-a*sy+c*cy)*scale];
  const Rn=([a,b,c])=>[a*cy+c*sy,b,-a*sy+c*cy];
  const toLocal=g=>{const dx=(g[0]-x)/scale,dz=(g[2]-z)/scale;return [dx*cy-dz*sy,g[1]/scale,dx*sy+dz*cy];};
  /* 들고 있는 물건 : 걷는 동안 가슴 앞 → 작업 중 손으로 (쏟는 물건은 기울였다가 비운다) */
  const holdEnd=J?(J.j.pour?J.j.dur*0.78:J.j.dur*0.55):0;
  const walkCarry=w.carry&&w.walking;
  const handCarry=w.carry&&J&&J.phase==="work"&&J.t<holdEnd;
  const goals=[-1,1].map((s,i)=>{
    const sway=Math.sin((w.gait||0)+s*Math.PI/2)*(w.walking?22:0);
    const idle=[s*64,222,-4+sway];
    if(walkCarry||(handCarry&&reach<0.05)) return [s*34,300,-86];
    if(!work) return idle;
    const tl=toLocal(J.j.reach), osc=J.j.pour?0:Math.sin(J.t*7+i)*5;
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
    const tilt=J&&J.j.pour&&handCarry?smooth(clamp((J.t-0.9)/0.5,0,1))*1.05:0;
    mPush(); mT(c[0],c[1],c[2]); mRY(w.yaw); mRX(tilt);
    if(w.carry==="box"){ box(-110,110,-70,70,-80,80,C.box,C.box); }
    else if(w.carry==="reel"){ cylZ(0,0,-17,17,150,C.gel,20); cylZ(0,0,-20,20,40,C.dark,12); }
    else if(w.carry==="roll"){ cylX(-90,90,0,0,100,[0.86,0.93,0.97,0.15],20); cylX(-96,96,0,0,34,C.dark,12); }
    else if(w.carry==="drum"){ cylY(0,0,-110,110,110,[0.30,0.52,0.82,0.1],18); cylY(0,0,110,116,112,[0.22,0.40,0.66,0.1],18); }
    else if(w.carry==="bag"){ ellipsoid([0,0,0],[120,90,70],[0.85,0.88,0.92,0.05],12,8); }
    mPop();
    /* 쏟는 흐름 : 용기 입구 → 목표 */
    if(tilt>0.6&&!far&&J.t<holdEnd-0.1){
      const r=J.j.reach, lip=W([mid[0],mid[1]+30,mid[2]-70]), k=J.key, b=BD();
      for(let i=0;i<10;i++){ const t=((J.t*2.2+i/10)%1), px=lerp(lip[0],r[0],t), pz=lerp(lip[2],r[2]-40,t), py=lerp(lip[1],r[1]-40,t)-Math.sin(t*Math.PI)*-30;
        if(k==="tab") drawTab(px,py,pz,i,tabCol());
        else if(k==="cap") drawCap([px,py+b.capH,pz],null,8);
        else if(k==="bottle") drawBottle(px,py,pz,{tilt:Math.PI/2,yaw:i});
      }
    }
  }
}
/* 변환 함수를 받는 타원체 (작업자 전용) */
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
