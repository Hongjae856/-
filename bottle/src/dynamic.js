/* ═══════════════════════════════════════════════════════════════════
   동적 형상 — 매 프레임 생성 (움직이는 부품 · 병 · 정제 · 캡 · 작업자)
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

function drawDynamic(){
  geoBegin(GEO.dyn);
  if(!S) return;
  dConveyor(); dUA(); dInserter("sg"); dLoadCell("lc1",L.lc1); dDMC(); dLoadCell("lc2",L.lc2); dReject(); dInserter("pe"); dRCS(); dTable();
  dBottles(); dPanels(); drawWorkers();
}

/* ── 컨베이어 슬랫 이동 ── */
function dConveyor(){
  if(FAR()) return;
  const pitch=38.1, off=LN.conv%pitch;
  const skip=[[L.lc1-L.lcW/2-6,L.lc1+L.lcW/2+6],[L.lc2-L.lcW/2-6,L.lc2+L.lcW/2+6]];
  for(let x=XS+off;x<XE;x+=pitch){
    if(skip.some(s=>x>s[0]&&x<s[1])) continue;
    box(x-1.2,x+1.2,CH,CH+0.5,-43,43,C.slatL,C.slatL,0);
  }
}

/* ── UA-120 ── */
function dUA(){
  const b=BD(), tt=L.tt, far=FAR();
  /* 턴테이블 원판 + 병 */
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
  /* 호퍼 속 병 (적재량 비례) */
  const hp=L.hop, hn=Math.round(clamp(S.mat.bottle/MAT_CAP.bottle,0,1)*26);
  for(let i=0;i<hn;i++){
    const layer=Math.floor(i/9), k=i%9;
    const x=hp.x0+60+(k%3)*((hp.x1-hp.x0-120)/2)+hash1(i)*30, z=hp.z0+70+Math.floor(k/3)*((hp.z1-hp.z0-140)/2)+hash1(i+9)*30;
    const yb=1100-(x-hp.x0)/(hp.x1-hp.x0)*240+b.d/2+layer*(b.d-6);
    drawBottle(x,yb,z,{yaw:hash1(i*5)*3,tilt:Math.PI/2});
  }
  /* 엘리베이터 클리트 · 병 */
  const e0=[hp.x1-20,860,20], e1=[tt.x-150,CH+470,tt.z-80];
  mPush(); const len=mAlong(e0,e1);
  for(let y=(LN.elev%160);y<len;y+=160){ box(-104,104,y,y+5,-36,-8,C.dark,C.dark,0); if(S.ua.elev&&!far&&Math.floor((y+LN.elev)/160)%2===0&&y>60&&y<len-60){ drawBottle(0,y+b.d/2+5,-36+b.h/2,{tilt:Math.PI/2,yaw:Math.PI/2}); } }
  mPop();
  /* 반전 사이드 벨트 (병과 함께 비틀림) */
  const ym=CH+b.h/2, w=b.d/2+7, bw=Math.min(62,b.h*0.55);
  for(const side of [-1,1]){
    const Lp=[],Rp=[];
    for(let x=L.belt0;x<=L.belt1+0.1;x+=35){
      const th=uaRoll(x), c=Math.cos(th), s=Math.sin(th);
      const py=ym-side*w*s, pz=side*w*c;
      Lp.push([x,py-bw/2*c,pz-bw/2*s]); Rp.push([x,py+bw/2*c,pz+bw/2*s]);
    }
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

/* ── SG-120 · HPE-100 (피드 · 커터 · 플런저 공용) ── */
function dInserter(k){
  const I=insCfg(k), x=I.x, st=LN.st[k], b=BD(), H=sgHeadY(), far=FAR();
  const gel=k==="sg";
  const stock=gel?S.mat.gel/MAT_CAP.gel:S.mat.film/MAT_CAP.film;
  const r0=I.r0, rF=I.rF, rr=r0+(rF-r0)*Math.sqrt(clamp(stock,0,1));
  const wd=I.wd, rz=I.rz;
  const fed=(gel?S.sg.fed:S.pe.fed)+(st?st.kin.feed:0);
  const travel=fed*(gel?S.sg.pitch:S.pe.len);
  /* 릴 : 플랜지 · 코어 · 감긴 자재 */
  mPush(); mT(I.rx,I.ry,rz); mRZ(-travel/Math.max(rr,40));
  for(const z of [-wd/2-6,wd/2+2]) { mPush(); mRX(Math.PI/2); mT(0,z,0); disc(0,0,r0+14,C.ssD,20); disc(4,0,r0+14,C.ssD,20); mPop(); }
  if(!far){ const g=gAlpha; gAlpha=0.16; mPush(); mRX(Math.PI/2); mT(0,wd/2+4,0); disc(0,r0+14,rF+14,C.acryl,32); mPop(); gAlpha=g; }
  if(!far){ mPush(); mRX(Math.PI/2); mT(0,-wd/2-8,0); disc(0,r0+14,rF+14,C.ssL,32); mPop(); }
  cylZ(0,0,-wd/2-4,wd/2+4,r0-6,C.dark,18);
  if(stock>0.005){
    cylZ(0,0,-wd/2,wd/2,rr,gel?C.gel:[0.80,0.90,0.95,0.15],28);
    if(gel&&!far) for(let i=0;i<6;i++){ const a=i*Math.PI/3; box(rr*0.3*Math.cos(a)-2,rr*0.3*Math.cos(a)+2,rr*0.3*Math.sin(a)-2,rr*0.3*Math.sin(a)+2,wd/2,wd/2+0.6,C.gelPrint,null,0); }
  }
  for(let i=0;i<3;i++){ const a=i*Math.PI*2/3; box(Math.cos(a)*14-3,Math.cos(a)*14+3,Math.sin(a)*14-3,Math.sin(a)*14+3,-wd/2-8,wd/2+6,C.ss,null,0); }
  mPop();
  /* 댄서 암 */
  const dAng=0.25+0.15*Math.sin((st&&st.kin.feed)?st.kin.feed*Math.PI:0);
  const dp=I.dp, dr=[dp[0]+Math.cos(dAng+I.da)*150,dp[1]+Math.sin(dAng+I.da)*150,dp[2]];
  tube([dp[0],dp[1],rz-wd/2-8],[dr[0],dr[1],rz-wd/2-8],9,C.ss,8); cylZ(dr[0],dr[1],rz-wd/2-6,rz+wd/2+6,18,C.ssL,14);
  /* 띠 경로 : 릴 → 댄서 롤러 → 입구 롤러 → (가이드 롤러) → 헤드 */
  if(stock>0.005){
    const pts=[[I.rx+rr*0.2,I.ry-rr,rz],[dr[0],dr[1]-18,rz],[I.in[0],I.in[1]-12,rz]];
    if(I.g) pts.push([I.g[0],I.g[1]-9,0]);
    pts.push([x,H.y1-4,0],[x,H.y0+46,0]);
    const col=gel?C.gel:[0.80,0.90,0.95,0.15];
    const g=gAlpha; if(!gel) gAlpha=0.7;
    for(let i=0;i<pts.length-1;i++){ const a=pts[i],c=pts[i+1];
      quad([a[0],a[1],a[2]-wd/2],[c[0],c[1],c[2]-wd/2],[c[0],c[1],c[2]+wd/2],[a[0],a[1],a[2]+wd/2],col); }
    gAlpha=g;
    if(gel&&!far){ /* 파우치 경계 (피치마다 실링선) */
      const ph=travel%S.sg.pitch;
      for(let y=H.y1-4-ph;y>H.y0+46;y-=S.sg.pitch) box(x-1,x+1,y-1.5,y+1.5,-wd/2-0.5,wd/2+0.5,[0.72,0.74,0.76,0.05],null,0);
    }
  }
  /* 피드 롤러 (회전 표시) */
  for(const sx of [-15,15]){ mPush(); mT(x+sx,H.y1-40,0); mRZ((sx>0?-1:1)*travel/14); cylZ(0,0,-wd/2-6,wd/2+6,13,C.rubber,12); box(-2,2,-13,13,wd/2+6,wd/2+7,C.ss,null,0); mPop(); }
  /* 커터 : 왕복 / 가열 커터 발광 */
  const cut=st?st.kin.cut:0;
  box(x-100+cut*80,x-40+cut*80,H.y0+30,H.y0+44,-wd/2-6,wd/2+6,gel?C.brushed:(S.pe.heat&&S.pe.pv>60?E.heat:[0.55,0.30,0.20,0.3]),null,0);
  /* 잘린 조각 → 튜브 → 병 */
  if(st&&st.ph==="proc"&&st.kin.drop>0&&st.b){
    const t=st.kin.drop, y=lerp(H.y0+30,CH+b.h-6,Math.min(1,t*1.2));
    if(gel) box(x-15,x+15,y-20,y+20,-4,4,C.gel,C.gel,0);
    else { const g=gAlpha; gAlpha=0.7; mPush(); mT(x,y,0); lathe([[b.nk/2-3,0],[b.nk/2-6,8],[0,12]],C.film,12); mPop(); gAlpha=g; }
  }
  /* 플런저 로드 */
  const plg=st?st.kin.plg:0, tip=lerp(H.y1-24,CH+b.h+4,plg);
  tube([x,H.y1+20,0],[x,tip,0],6,C.rodC,10); cylY(x,0,tip-6,tip,Math.max(8,b.nk/2-6),C.ss,12);
  /* 스토퍼 핀 · 클램프 */
  if(st) stopperPins(x,b,st.pin,st.clamp);
}
function stopperPins(x,b,pin,clampV){
  const y=CH+b.h*0.42;
  tube([x+b.d/2+7,y,-78],[x+b.d/2+7,y,-78+pin*74],4.5,C.rodC,8);
  const cx=x-b.d/2-5-b.d/2, cz=-78+clampV*(78-b.d/2-3);
  tube([cx,y,-78],[cx,y,cz],4.5,C.rodC,8); box(cx-9,cx+9,y-10,y+10,cz-2,cz+1,C.rubber,C.rubber,0);
}

/* ── 로드셀 ── */
function dLoadCell(k,x){
  const st=LN.st[k], b=BD(), w=L.lcW;
  const run=S.running;
  box(x-w/2+14,x+w/2-14,CH-8,CH,-44,44,[0.93,0.94,0.92,0.05],null,0);
  if(!FAR()) for(let u=(LN.conv%50)-w/2;u<w/2-10;u+=50) if(u>-w/2+14) box(x+u-1,x+u+1,CH,CH+0.4,-44,44,[0.80,0.82,0.80,0.05],null,0);
  if(st){
    const y=CH+b.h*0.42;
    tube([x+b.d/2+5,y,-80],[x+b.d/2+5,y,-80+st.pin*76],4.2,C.rodC,8);
  }
  /* 표시기 화면 */
  box(x-60,x+60,CH+340,CH+382,215,216.5,S.main?[0.06,0.12,0.10,-1]:E.scrDim,null,0);
  if(S.main) for(let i=0;i<5;i++) box(x-52+i*21,x-38+i*21,CH+348,CH+374,216.5,217.2,E.digit,null,0);
}

/* ── DMC-60T ── */
function dDMC(){
  const D=LN.dmc, b=BD(), yG=dmcGateY(), far=FAR(), N=S.rc.n, col=tabCol();
  if(!D) return;
  const run=S.running;
  const jig=run?Math.sin(D.vibPh*2*Math.PI*23)*1.2:0;
  /* 호퍼 속 정제 (적재량 → 높이) */
  const f=clamp(S.mat.tab/matCap("tab"),0,1);
  if(f>0.002){
    const y=1660+18+f*300, u=(y-1660)/(2040-1660);
    const x0=lerp(-900,-1110,u)+6, x1=lerp(-700,-490,u)-6, z0=lerp(-880,-1080,u)+6, z1=lerp(-780,-700,u)-6, cx=(x0+x1)/2, cz=(z0+z1)/2;
    tri([x0,y,z0],[x1,y,z0],[cx,y+26,cz],col); tri([x1,y,z0],[x1,y,z1],[cx,y+26,cz],col);
    tri([x1,y,z1],[x0,y,z1],[cx,y+26,cz],col); tri([x0,y,z1],[x0,y,z0],[cx,y+26,cz],col);
    if(!far) for(let i=0;i<24;i++){ const px=lerp(x0+10,x1-10,hash1(i*1.7)), pz=lerp(z0+10,z1-10,hash1(i*3.1));
      const e=1-Math.max(Math.abs(px-cx)/((x1-x0)/2),Math.abs(pz-cz)/((z1-z0)/2)); drawTab(px,y+e*26+2,pz,hash1(i)*3,col); }
  }
  /* 트레이 1 · 2 : 흩어진 정제가 앞으로 흘러간다 */
  if(!far){
    const tr=[[DMC.t1,D.tray[0],34,0.35],[DMC.t2,D.tray[1],40,0.55]];
    for(const [t,fill,n,sp] of tr){
      const m=Math.round(n*fill), Lz=t.z1-t.z0-12;
      for(let i=0;i<m;i++){
        const z=t.z0+6+((hash1(i*2.3)*Lz+D.vibPh*sp*60)%Lz), x=t.x0+10+hash1(i*5.7+1)*(t.x1-t.x0-20);
        drawTab(x,t.y+S.rc.prod.thk/2+jig,z,hash1(i*9.1)*6,col);
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
    /* 센서로 떨어지는 정제 */
    for(const q of D.falls){
      const y=DMC.t3y-4-0.5*9800*q.t*q.t;
      if(y<1300) continue;
      drawTab(DMC.x0+q.c*DMC.tw+DMC.tw/2,y,DMC.t3z1+14,Math.PI/2,col);
    }
  }
  /* 센서 LED (계수 순간 점등) */
  for(let c=0;c<12;c++){ const xc=DMC.x0+c*DMC.tw+DMC.tw/2, on=D.led[c]>0.25, dirty=S.dmc.dirt[c]>0.6;
    box(xc-5,xc+5,1446,1449,-100,-90,on?E.ledG:dirty?E.ledY:(S.main?[0.10,0.40,0.20,-1]:OFF.g),null,0); }
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
  /* 병 스토퍼 3조 */
  const y=CH+b.h*0.42;
  for(const [px,v] of [[L.n2+b.d/2+4,D.exit],[L.n1+b.d/2+4,D.mid],[L.n1-b.d-6,D.entry]])
    tube([px,y,-80],[px,y,-80+v*76],4.5,C.rodC,8);
  if(D.clampB){ const cx=L.n1-b.d-6-b.d/2-4; tube([cx,y+18,-80],[cx,y+18,-b.d/2-3],4,C.rodC,8); }
}

/* ── 리젝트 ── */
function dReject(){
  const R=LN.rej, b=BD(), x=L.rej, y=CH+b.h*0.42;
  const pz=-(b.d/2+40)+R.ext*(b.d+70);
  tube([x,y,-300],[x,y,pz],6,C.rodC,10); box(x-24,x+24,y-22,y+22,pz-6,pz,C.rubber,C.rubber,0);
  /* 밀려나는 병 → 슈트 → 리젝트함 */
  for(const q of LN.pushing){
    const t=q.pt;
    let bx=x, by=CH, bz=0, tilt=0;
    if(t<0.22){ bz=(t/0.22)*(b.d/2+70); }
    else { const u=Math.min(1,(t-0.22)/0.5); bz=b.d/2+70+u*300; by=CH-u*170; tilt=u*1.2; }
    drawBottle(bx,by,bz,{fill:q.fill,gel:q.gel,ng:true,tilt:-tilt,yaw:Math.PI/2});
  }
  const bin=L.rejBin;
  LN.rejBin.forEach((q,i)=>{ const k=i%12, layer=Math.floor(i/12);
    drawBottle(bin.x-150+(k%4)*100+hash1(q.seed)*20,140+b.d/2+layer*b.d*0.8,bin.z-150+Math.floor(k/4)*110,{tilt:Math.PI/2,yaw:hash1(q.seed*3)*3,ng:true}); });
}

/* ── RCS-120 ── */
function dRCS(){
  const R=LN.rc, b=BD(), A=L.A, B=L.B, T=L.T, Y=rcY(), far=FAR(), P=P_PITCH;
  const d=b.d;
  /* 타이밍 스크류 (가변 피치 나선) */
  const f=SCREW.fit(d), zs=d/2+32, ys=CH+b.h*0.42, rF=Math.min(30,d/2+6);
  cylX(L.screw0-20,L.A.x-30,ys,zs,16,C.uhmw,14);
  const pts=[];
  for(let u=-f.nS;u<=0;u+=0.04){ const x=XS+screwS(u,d); if(x>L.A.x-24) break;
    const a=2*Math.PI*(u-R.phi)+Math.PI; pts.push([x,ys+rF*Math.sin(a),zs-rF*Math.cos(a)]); }
  tubePath(pts,4.5,C.uhmw,6);
  /* 스타휠 (A · B) · 터렛 포켓 판 */
  const star=(c,base)=>{ for(const yy of [CH+b.h*0.30,CH+b.h*0.70]) starPlate(c,yy,base,d); };
  star(A,Math.PI/2-R.phi*Math.PI/2);
  star(B,PATH.bT-(S_A-S_T1)/L.R-R.phi*Math.PI/2);
  star(T,PATH.tA+(S_A-S_T0)/L.R+R.phi*Math.PI/2);
  /* 터렛 헤드 캐러셀 */
  const car=R.phi*Math.PI/2;
  mPush(); mT(T.x,0,T.z); mRY(-car);
  cylY(0,0,Y.yc+60,Y.yc+110,L.R+58,C.ss,32); cylY(0,0,Y.yc+110,Y.yc+170,90,C.ssD,20);
  for(let i=0;i<4;i++){ const a=i*Math.PI/2; mPush(); mRY(-a); box(L.R-40,L.R+40,Y.yc-10,Y.yc+62,-40,40,C.cab,C.ssL); box(L.R+40,L.R+42,Y.yc+5,Y.yc+50,-24,24,C.orange,C.orange,0); mPop(); }
  mPop();
  for(let j=0;j<4;j++){
    const a=headAngle(j), h=R.heads[j], hx=T.x+L.R*Math.cos(a), hz=T.z+L.R*Math.sin(a);
    const cup0=CH+b.h-b.capH*0.62+(1-h.y)*112;
    const drop=h.y;
    cylY(hx,hz,cup0+b.capH+12,Y.yc,11,C.rodC,12);
    cylY(hx,hz,cup0+b.capH+30,cup0+b.capH+90,24,C.cyl,14);
    mPush(); mT(hx,0,hz); mRY(-h.spin);
    mPush(); mT(0,cup0,0); lathe([[b.capD/2+2,0],[b.capD/2+7,0],[b.capD/2+7,b.capH+12],[0,b.capH+12]],C.ssD,16); mPop();
    box(b.capD/2+6,b.capD/2+9,cup0+4,cup0+b.capH,-3,3,C.orange,C.orange,0);
    mPop();
    if(h.cap){ mPush(); mT(hx,cup0+b.capH+12-(b.h+b.capH)-2,hz); lathe(botProf().cap,C[b.capCol],14); mPop(); }
    void drop;
  }
  /* 슈트의 캡 */
  const cp=capChute(), n=R.chute, dv=[cp.b[0]-cp.a[0],cp.b[1]-cp.a[1],cp.b[2]-cp.a[2]], Lc=Math.hypot(...dv);
  for(let i=0;i<n;i++){ const t=1-(i*(b.capD+2)+b.capD/2)/Lc; if(t<0) break;
    mPush(); mT(cp.a[0]+dv[0]*t,cp.a[1]+dv[1]*t-(b.h+b.capH)+b.capH,cp.a[2]+dv[2]*t); lathe(botProf().cap,C[b.capCol],far?8:14); mPop(); }
  /* 볼 피더 속 캡 */
  if(!far&&S.mat.cap>0){ const bw=RCBOWL;
    for(let i=0;i<10;i++){ const a=i*0.6+R.bowl*0.9, t=(i/10); mPush(); mT(bw.x+236*Math.cos(a),bw.y-20+t*100-(b.h+b.capH)+b.capH,bw.z+236*Math.sin(a)); lathe(botProf().cap,C[b.capCol],8); mPop(); }
    for(let i=0;i<Math.min(16,Math.round(S.mat.cap/40));i++){ const a=hash1(i)*6.28, r=hash1(i+3)*150; mPush(); mT(bw.x+r*Math.cos(a),bw.y-38-(b.h+b.capH)+b.capH,bw.z+r*Math.sin(a)); lathe(botProf().cap,C[b.capCol],8); mPop(); }
  }
  /* 캡 호퍼 속 캡 (적재량 비례) */
  if(!far){ const H=CAPHOP, n=Math.round(clamp(S.mat.cap/MAT_CAP.cap,0,1)*30), cx=(H.x0+H.x1)/2, cz=(H.z0+H.z1)/2;
    for(let i=0;i<n;i++){ const u=hash1(i*1.9), v=hash1(i*4.3), lay=Math.floor(i/10), yy=H.y0+30+lay*b.capH*1.2, sp=0.35+0.65*(yy-H.y0)/(H.y1-H.y0);
      mPush(); mT(cx+(u-0.5)*(H.x1-H.x0-60)*sp,yy-b.h,cz+(v-0.5)*(H.z1-H.z0-60)*sp); lathe(botProf().cap,C[b.capCol],8); mPop(); } }
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
  const b=BD();
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
  for(const k of ["ua","sg","dmc","pe","rc"]){
    const l=LAMPS[k], h=HMIS[k];
    lampLights(l[0],l[1],l[2],on?lampState(k):"off");
    hmiFace(h[0],h[1],h[2],h[3],h[4],on,0);
  }
  hmiFace(120,1420,762,330,250,on,0.05);
}

/* ═══ 작업자 ═══ */
const WK=[
  {id:"A", x:-2900, z:AISLE, home:[-2900,AISLE], route:[], yaw:0, gait:0, walking:false, job:null, t:0},
  {id:"B", x:2300,  z:AISLE, home:[2300,AISLE],  route:[], yaw:0, gait:0, walking:false, job:null, t:0}
];
/* 작업 정의 : 서는 위치 · 손 목표 · 들고 가는 물건 · 확대 시점 */
const JOBS={
  bottle:{stand:[-5390,560], reach:[-5390,1280,120], carry:"box",  view:"bottle", dur:2.2},
  gel:   {stand:[L.sg,430],  reach:[L.sg,1480,40],   carry:"reel", view:"gel", dur:2.4},
  tab:   {stand:[-1250,420], reach:[-1040,1980,-520],carry:"drum", view:"tab", dur:2.6},
  film:  {stand:[L.pe,430],  reach:[L.pe,1500,40],   carry:"roll", view:"film", dur:2.4},
  cap:   {stand:[2110,760],  reach:[2110,1900,60],  carry:"bag",  view:"cap", dur:2.2},
  reject:{stand:[L.rej,1000],reach:[L.rej,700,560],  carry:null,   view:"reject", dur:2.0},
  table: {stand:[4800,900],  reach:[4800,1000,330],  carry:null,   view:"table", dur:2.2},
  look:  {stand:[0,AISLE-150], reach:null, carry:null, dur:1.4}
};
function wkFor(x){ return x<0?WK[0]:WK[1]; }
function wkBusy(){ return WK.some(w=>w.job||w.route.length); }
/* 작업 시작 : 통로를 따라 걸어가서 작업 → 콜백 */
function startWork(key,cb,opt){
  const j=Object.assign({},JOBS[key]||JOBS.look,opt||{});
  const w=wkFor(j.stand[0]);
  if(w.job){ return false; }
  const rt=[];
  if(Math.abs(w.z-AISLE)>30) rt.push([w.x,AISLE]);
  rt.push([j.stand[0],AISLE]); rt.push([j.stand[0],j.stand[1]]);
  w.route=rt; w.job={key,j,cb,phase:"walk",t:0}; w.carry=j.carry;
  if(j.view&&WORKVIEW[j.view]&&R3.gl){ w.job.prevView=cam.view; const v=WORKVIEW[j.view]; cam.view="work"; cam.yawT=v.yaw; cam.pitchT=v.pitch; cam.distT=v.dist; cam.txT=v.tx; cam.tyT=v.ty; cam.tzT=v.tz; }
  return true;
}
function wkTick(dt){
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
      if(J.phase==="walk"){ J.phase="work"; J.t=0; }
      J.t+=dt;
      if(J.j.reach){ const r=J.j.reach; w.face=Math.atan2(-(r[0]-w.x),-(r[2]-w.z)); }
      else w.face=0;
      if(J.t>=J.j.dur){
        w.job=null; w.carry=null; w.idle=0;
        if(J.prevView&&cam.view==="work") camSet(J.prevView==="work"?"all":J.prevView);
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
function drawWorker(w){
  const scale=1650/488, x=w.x, z=w.z, far=FAR();
  const want=w.face!==undefined?w.face:0;
  if(w.yaw===undefined) w.yaw=want;
  let dl=want-w.yaw; while(dl>Math.PI) dl-=2*Math.PI; while(dl<-Math.PI) dl+=2*Math.PI; w.yaw+=dl*0.2;
  const cy=Math.cos(w.yaw), sy=Math.sin(w.yaw);
  const J=w.job, work=J&&J.phase==="work"&&J.j.reach, reach=work?Math.min(1,J.t*2.5)*(J.t>J.j.dur-0.35?Math.max(0,(J.j.dur-J.t)/0.35):1):0;
  const W=([a,b,c])=>[x+(a*cy+c*sy)*scale,b*scale,z+(-a*sy+c*cy)*scale];
  const Rn=([a,b,c])=>[a*cy+c*sy,b,-a*sy+c*cy];
  const toLocal=g=>{const dx=(g[0]-x)/scale,dz=(g[2]-z)/scale;return [dx*cy-dz*sy,g[1]/scale,dx*sy+dz*cy];};
  const carry=w.carry&&(w.walking||(J&&J.phase==="work"&&J.t<J.j.dur*0.5));
  const goals=[-1,1].map((s,i)=>{
    const sway=Math.sin((w.gait||0)+s*Math.PI/2)*(w.walking?22:0);
    const idle=[s*64,222,-4+sway];
    if(carry) return [s*34,300,-86];
    if(!work) return idle;
    const tl=toLocal(J.j.reach), osc=Math.sin(J.t*7+i)*5;
    const tgt=[tl[0]+s*26,Math.min(560,tl[1])+osc,Math.max(-220,Math.min(-60,tl[2]))];
    return idle.map((v,k)=>v+(tgt[k]-v)*reach);
  });
  for(const s of cuteOperatorShapes({gait:w.gait||0,walk:w.walking?1:0,crouch:0,goals})){
    const col=WPAL[s.col];
    if(s.t==='c'){ tube(W(s.a),W(s.b),s.r*scale,col,far?8:12,true); continue; }
    const big=Math.max(...s.r)>25, nu=far?8:(big?16:10), nv=far?5:(big?9:6);
    ellipsoidT(s.c,s.r,col,nu,nv,W,Rn);
  }
  if(carry){ const c=W([0,300,-110]);
    mPush(); mT(c[0],c[1],c[2]); mRY(w.yaw);
    if(w.carry==="box") box(-110,110,-70,70,-80,80,C.box,C.box);
    else if(w.carry==="reel") { cylZ(0,0,-24,24,150,C.gel,20); cylZ(0,0,-26,26,40,C.dark,12); }
    else if(w.carry==="roll") { cylZ(0,0,-48,48,130,[0.80,0.90,0.95,0.15],20); }
    else if(w.carry==="drum") { cylY(0,0,-120,120,120,[0.30,0.52,0.82,0.1],18); }
    else if(w.carry==="bag") { ellipsoid([0,0,0],[120,90,70],[0.85,0.88,0.92,0.05],12,8); }
    mPop(); }
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
