/* ═══════════════════════════════════════════════════════════════════
   라인 물류 · 공정 로직
   · 병은 경로 좌표 s 를 따라 움직이고, 앞 병 · 스토퍼 핀 · 클램프 · 스크류 입구에서 멈춘다
   · 공정(SG · 로드셀 · DMC 쌍 · HPE)은 "도착 → 처리 → 해제" 사이클
   · 캡핑기는 가상 포켓 체인(타이밍 스크류 → 스타휠 A → 터렛 → 스타휠 B)으로 이동
   ═══════════════════════════════════════════════════════════════════ */
const LN={
  conv:0, bottles:[], nextId:1, feedT:0, fed:0,
  tt:{ang:0, n:18, exitT:0, list:[]}, elev:0, sbelt:0,
  blowT:0, vacT:0,
  st:{}, dmc:null, rej:{ext:0,t:0,active:null}, pushing:[],
  rc:{phi:0, rate:0, heads:[{cap:false,y:0,spin:0},{cap:false,y:0,spin:0},{cap:false,y:0,spin:0},{cap:false,y:0,spin:0}], chute:0, chuteFeed:0, bowl:0, elev:0, captured:new Map()},
  table:{ang:0, list:[]}, rejBin:[], alarmT:0, dirtT:0
};
const P_PITCH=2*Math.PI*L.R/4;                        /* 포켓 피치 (호 길이) */
function convSpeed(){ return 120+2.8*S.bpm; }        /* mm/s */
function cycK(){ return 60/Math.max(20,S.bpm); }      /* 공정 시간 배율 (60병/분 = 1) */

/* ── 타이밍 스크류 : 포켓 번호 u(≤0) → 경로 좌표 (가변 피치) ── */
const SCREW=(function(){
  const Ls=L.A.x-L.screw0;
  return {Ls, fit(d){ const nS=2*Ls/(P_PITCH+d+2), c=(P_PITCH-d-2)/(2*nS); return {nS,c}; }};
})();
function screwS(u,d){ const f=SCREW.fit(d); u=Math.max(-f.nS,u); return S_A+P_PITCH*u+f.c*u*u; }
function screwU(s,d){ /* 역함수 : s → u */ const f=SCREW.fit(d), x=s-S_A; if(Math.abs(f.c)<1e-6) return x/P_PITCH;
  const D=P_PITCH*P_PITCH+4*f.c*x; return D<0?-f.nS:(-P_PITCH+Math.sqrt(D))/(2*f.c); }
const S_SCREW0=()=>screwS(-SCREW.fit(BD().d).nS,BD().d);

/* ── 병 생성 ── */
function newBottle(s){
  const b=BD();
  return {id:LN.nextId++, s, zone:"line", done:{}, clean:0, gel:0, gelW:0, tareTrue:b.tare*(1+0.004*gauss()),
    n:0, mass:0, fill:0, pe:0, cap:false, capY:0, spin:0, ng:false, why:"", tare:null, gross:null, net:null, pocket:null, hold:false};
}

/* ═══ 공정 정의 (x = 병 중심 정지 위치) ═══ */
function makeStations(){
  const d=BD().d;
  LN.st={
    sg:{k:"sg", x:L.sg, ph:"wait", t:0, b:null, pin:1, clamp:0, clampB:null, dur:()=>0.52*cycK(), kin:{feed:0,cut:0,plg:0,sachet:null}},
    lc1:{k:"lc1",x:L.lc1,ph:"wait", t:0, b:null, pin:1, clamp:0, clampB:null, dur:()=>0.34*cycK(), read:null},
    lc2:{k:"lc2",x:L.lc2,ph:"wait", t:0, b:null, pin:1, clamp:0, clampB:null, dur:()=>0.34*cycK(), read:null},
    pe:{k:"pe", x:L.pe, ph:"wait", t:0, b:null, pin:1, clamp:0, clampB:null, dur:()=>0.56*cycK(), kin:{feed:0,cut:0,plg:0,piece:null}}
  };
  LN.dmc={ph:"rA", t:0, A:null, B:null, entry:1, clamp:0, clampB:null, mid:0, exit:1, gate:[0,0], gateT:[0,0], buf:[0,0], hold:[false,false],
    chPh:new Array(12).fill(0), led:new Array(12).fill(0), falls:[], vibPh:0, tray:[1,1,1], single:false, waitT:0, dump:[null,null]};
}
function pinFace(st){ return sOfX(st.x)+BD().d/2; }

/* ═══ 한 스텝 ═══ */
function simTick(dt){
  if(!S) return;
  utilTick(dt);
  if(!S.session) return;
  const run=S.running&&!S.emg;
  const v=run?convSpeed():0;
  if(run) LN.conv+=v*dt;
  uaTick(dt,run);
  stationsTick(dt,run);
  dmcTick(dt,run);
  capperTick(dt,run);
  moveBottles(dt,v,run);
  rejectTick(dt,run);
  tableTick(dt,run);
  peHeat(dt);
  dirtTick(dt,run);
  if(run) prodCheck();
  if(S.jog>0){ S.jog-=dt; if(S.jog<=0){ S.jog=0; S.running=false; } }
}

/* ── 유틸리티 ── */
function utilTick(dt){
  const want=S.air?6.2:0;
  S.airP+=(want-S.airP)*Math.min(1,dt*(S.air?0.9:1.6));
  if(S.running&&S.airP<5.0) raise("E002");
  if(S.running&&S.door!=="closed") raise("E001");
  if(S.running&&!S.dust) raise("E003"); else if(S.dust) clearAlarm("E003");
}

/* ── UA-120 : 턴테이블 · 엘리베이터 · 병 공급 ── */
function uaTick(dt,run){
  const d=BD().d;
  const rate=S.bpm/60;
  /* 턴테이블 · 엘리베이터 : 운전 중 회전, 턴테이블 병이 줄면 엘리베이터가 보충 */
  if(run&&S.main){ LN.tt.ang+=dt*(0.6+S.bpm/120*0.9); S.ua.ttRun=true; } else S.ua.ttRun=false;
  const need=LN.tt.n<22&&S.mat.bottle>0;
  S.ua.elev=run&&need;
  if(S.ua.elev){ LN.elev+=dt*260; LN.tt.fillAcc=(LN.tt.fillAcc||0)+dt*rate*1.6;
    while(LN.tt.fillAcc>=1&&S.mat.bottle>0){ LN.tt.fillAcc-=1; LN.tt.n++; S.mat.bottle--; } }
  if(run) LN.sbelt+=convSpeed()*dt;
  /* 세척 에어 · 진공 (분사 표시) */
  LN.blowT=run&&S.ua.air?LN.blowT+dt:0; LN.vacT=run&&S.ua.vac?LN.vacT+dt:0;
  if(run&&(!S.ua.air||!S.ua.vac)) raise("UA13"); else clearAlarm("UA13");
  /* 공급 : 목표 수량까지만, 출구 앞이 비어 있을 때 */
  if(!run) return;
  if(S.ua.jam){ raise("UA12"); return; }
  const need2=needFeed();
  LN.feedT+=dt;
  if(need2<=0||LN.feedT<60/S.bpm) return;
  const last=LN.bottles.filter(x=>x.zone==="line").reduce((m,x)=>Math.min(m,x.s),1e9);
  if(last<d+30) return;
  if(LN.tt.n<=0){ if(S.mat.bottle<=0) raise("UA11"); return; }
  LN.feedT=0; LN.tt.n--; LN.fed++; S.cnt.bottlesIn++;
  LN.bottles.push(newBottle(0));
}
/* 목표 양품 수량을 채우기 위해 더 공급해야 할 병 수 */
function needFeed(){
  if(S.cycleStop) return 0;
  const alive=LN.bottles.filter(b=>b.zone!=="rej"&&b.zone!=="table"&&!b.ng).length;
  return S.cnt.target-S.cnt.good-alive;
}

/* ── 일반 공정 (도착 → 처리 → 해제) ── */
/* 뒤 병 (맞닿아 있는 바로 다음 병) */
function behindOf(b){ const d=BD().d; return LN.bottles.filter(x=>x.zone==="line"&&x.pocket==null&&x.s<b.s&&b.s-x.s<d+8).sort((a,c)=>c.s-a.s)[0]||null; }
function stationsTick(dt,run){
  for(const k of ["sg","lc1","lc2","pe"]){
    const st=LN.st[k], d=BD().d, face=pinFace(st);
    if(st.ph==="wait"){
      st.pin=Math.min(1,st.pin+dt*14);
      /* 핀이 다시 나온 뒤에 클램프를 푼다 → 다음 병이 핀까지 온다 */
      if(st.clampB&&st.pin>=1){ st.clampB=null; }
      const b=LN.bottles.find(x=>x.zone==="line"&&!x.done[k]&&Math.abs(x.s-(face-d/2))<1.2);
      if(b&&run&&st.pin>=1&&!st.clampB&&stationReady(k)){
        st.ph="proc"; st.t=0; st.b=b; st.clampB=behindOf(b);   /* 뒤 병 클램프 (간격 확보) */
      }
    }else if(st.ph==="proc"){
      if(run){ st.t+=dt; procKin(st,dt); }
      if(st.t>=st.dur()){ procDone(st); st.b.done[k]=true; st.ph="rel"; st.t=0; }
    }else if(st.ph==="rel"){
      st.pin=Math.max(0,st.pin-dt*14);
      const b=st.b;
      if(!b||b.zone!=="line"||b.s>face+d/2+4){
        st.ph="wait"; st.b=null;
        if(st.kin){ st.kin.feed=st.kin.cut=st.kin.plg=0; st.kin.drop=0; }
      }
    }
    st.clamp+=((st.clampB?1:0)-st.clamp)*Math.min(1,dt*16);
  }
}
function stationReady(k){
  if(k==="sg"){ if(S.mat.gel<=0){ raise("SG21"); return false; } if(S.sg.markBad&&!S.activeTrouble){ return true; } }
  if(k==="pe"){ if(S.mat.film<=0){ raise("PE51"); return false; } if(S.pe.pv<S.pe.sv-10){ raise("PE52"); return false; } }
  return true;
}
/* 공정별 동작 진행 (0→1 구간) */
function procKin(st,dt){
  const u=st.t/st.dur();
  if(st.kin){
    st.kin.feed=clamp(u/0.34,0,1);
    st.kin.cut=u>0.34&&u<0.52?Math.sin((u-0.34)/0.18*Math.PI):0;
    st.kin.plg=u>0.50?Math.sin(clamp((u-0.50)/0.46,0,1)*Math.PI):0;
    st.kin.drop=clamp((u-0.52)/0.3,0,1);
  }
  if(st.k==="lc1"||st.k==="lc2"){ st.read=weigh(st.b,st.k==="lc1"?0:1)*(u<0.5?u*2:1); }
}
function procDone(st){
  const b=st.b, bd=BD();
  if(st.k==="sg"){
    S.mat.gel=Math.max(0,S.mat.gel-1); S.sg.fed++;
    if(S.sg.markBad){ b.gel=0; b.gelW=0; }            /* 마크 센서 틀어짐 : 절단 위치 이상 → 파우치 미투입 */
    else { b.gel=1; b.gelW=bd.gel*(1+0.03*gauss()); }
  }else if(st.k==="lc1"){
    const r=weigh(b,0); b.tare=r; st.read=r; S.wc.tare=r; S.wc.lastTare=r;
    if(Math.abs(r-S.rc.tareStd)>S.rc.tareTol){ b.tareNG=true; raise("WC43"); }
  }else if(st.k==="lc2"){
    const r=weigh(b,1); b.gross=r; st.read=r; judge(b);
  }else if(st.k==="pe"){
    S.mat.film=Math.max(0,S.mat.film-1); b.pe=1; S.pe.fed++;
  }
}
/* 로드셀 측정값 (g) : 참값 + 영점 오프셋 + 잡음 */
function weigh(b,i){
  const t=b.tareTrue+b.gelW+b.mass;
  return t+S.wc.off[i]+0.004*gauss();
}
/* 순중량 판정 */
function judge(b){
  const rc=S.rc, net=b.gross-b.tare, dev=(net-rc.netStd)/rc.unit;
  b.net=net;
  let ok=true, why="";
  if(b.tareNG){ ok=false; why="빈병 중량"; }
  else if(Math.abs(net-rc.netStd)>rc.netTol){ ok=false; why=dev<0?"중량 미달":"중량 초과"; }
  b.ng=!ok; b.why=why;
  S.wc.gross=b.gross; S.wc.net=net; S.wc.judge=ok?"OK":"NG";
  S.wc.log.unshift({no:S.wc.log.length+1, tare:b.tare, gross:b.gross, net, dev, ok, why, n:b.n});
  if(S.wc.log.length>60) S.wc.log.length=60;
  if(ok){ S.wc.nOK++; S.wc.sumNet+=net; S.wc.nNet++; S.wc.consec=0; }
  else { S.wc.nNG++; S.wc.consec++; beep(330,0.18,"square",0.04); if(S.wc.consec>=3) raise("WC41"); }
}

/* ═══ DMC-60T : 채널 계수 · 쌍 인덱싱 · 게이트 ═══ */
function dmcRate(){   /* 채널당 정/초 */
  const p=S.rc.prod, v=S.dmc.vib;
  const pf=p.shape==="round"?1:p.shape==="oblong"?0.85:0.72;
  const supply=Math.min(1,(v[0]/100+0.25)*1.1)*Math.min(1,(v[1]/100+0.2)*1.2);
  return 8.33*pf*(v[2]/100)*supply;
}
function trackSpeed(){ return 55+170*S.dmc.vib[2]/100; }   /* mm/s */
function dmcTick(dt,run){
  const D=LN.dmc, N=S.rc.n, d=BD().d;
  if(!D) return;
  D.vibPh+=dt*(run?1:0);
  const tabsLeft=S.mat.tab>0;
  /* 트레이 공급 상태 (호퍼가 비면 1→2→3단 차례로 빈다) */
  if(run){
    if(!tabsLeft){ D.tray[0]=Math.max(0,D.tray[0]-dt*0.22); } else D.tray[0]=Math.min(1,D.tray[0]+dt*0.5);
    D.tray[1]+=((D.tray[0]>0.05?1:0)-D.tray[1])*dt*0.35; D.tray[2]+=((D.tray[1]>0.05?1:0)-D.tray[2])*dt*0.35;
    if(S.mat.tab<N*6) raise("DM31"); else clearAlarm("DM31");
  }
  /* 채널 계수 */
  const r=dmcRate(), vt=trackSpeed(), sp=vt/Math.max(0.1,r);
  D.spacing=Math.max(S.rc.prod.len+1.5,sp); D.vt=vt;
  for(let c=0;c<12;c++){
    D.led[c]=Math.max(0,D.led[c]-dt*9);
    const g=c<6?0:1;
    if(!run||D.hold[g]||D.tray[2]<0.2||S.mat.tab<=0) continue;
    const before=Math.floor(D.chPh[c]/D.spacing);
    D.chPh[c]+=vt*dt;
    const after=Math.floor(D.chPh[c]/D.spacing);
    for(let k=before;k<after;k++){
      if(D.buf[g]>=N){ D.hold[g]=true; D.chPh[c]=after*D.spacing-0.01; break; }
      D.buf[g]++; S.dmc.cnt[c]++; S.dmc.total++; S.mat.tab=Math.max(0,S.mat.tab-1); S.cnt.tabs++;
      D.led[c]=1; D.falls.push({c,t:0});
      if(D.buf[g]>=N) D.hold[g]=true;
    }
  }
  D.falls=D.falls.filter(f=>(f.t+=dt)<0.32);
  /* 게이트 애니메이션 */
  for(const g of [0,1]){ const want=D.gateT[g]>0?1:0; D.gate[g]+=(want-D.gate[g])*Math.min(1,dt*18); if(D.gateT[g]>0) D.gateT[g]=Math.max(0,D.gateT[g]-dt*(run?1:0)); }
  /* 병 쌍 인덱싱 */
  const face=x=>sOfX(x)+d/2, eFace=sOfX(L.n1)-d/2-22+0.0;
  const lineB=()=>LN.bottles.filter(x=>x.zone==="line");
  const at=(sface)=>lineB().find(x=>Math.abs(x.s-(sface-d/2))<1.5);
  const behind=(b)=>lineB().filter(x=>x.s<b.s&&b.s-x.s<d+8).sort((a,c)=>c.s-a.s)[0]||null;
  const upstream=()=>lineB().some(x=>x.s<eFace-d/2-2&&!x.done.dmc);
  D.waitT+=dt*(run?1:0);
  switch(D.ph){
    case "rA": {  /* 첫 병을 출구 스토퍼까지 */
      D.exit=Math.min(1,D.exit+dt*14); D.mid=Math.max(0,D.mid-dt*14);
      const a=at(eFace);
      if(a&&run&&!a.done.dmc&&D.exit>=1){ D.clampB=behind(a); D.entry=0; D.A=a; D.ph="rA2"; D.waitT=0; }
      break; }
    case "rA2": {
      D.clamp=Math.min(1,D.clamp+dt*14);
      if(D.A&&D.A.s>eFace+d/2+4){ D.entry=1; D.clamp=0; D.clampB=null; D.ph="rB"; D.waitT=0; }
      break; }
    case "rB": {  /* 둘째 병을 중간 스토퍼까지 */
      if(D.A&&D.A.s>face(L.n1)+d/2+2) D.mid=Math.min(1,D.mid+dt*14);
      const b=at(eFace);
      if(b&&run&&D.mid>=1&&!b.done.dmc&&D.A&&Math.abs(D.A.s-(face(L.n2)-d/2))<1.5){ D.clampB=behind(b); D.entry=0; D.B=b; D.ph="rB2"; }
      else if(D.A&&Math.abs(D.A.s-(face(L.n2)-d/2))<1.5&&!b&&!upstream()&&D.waitT>4){ D.B=null; D.single=true; D.ph="fill"; D.t=0; }
      break; }
    case "rB2": {
      D.clamp=Math.min(1,D.clamp+dt*14);
      if(D.B&&D.B.s>eFace+d/2+4){ D.entry=1; D.clamp=0; D.clampB=null; }
      if(D.B&&Math.abs(D.B.s-(face(L.n1)-d/2))<1.5&&D.entry>=1){ D.ph="fill"; D.t=0; D.single=false; }
      break; }
    case "fill": {  /* 두 게이트 버퍼가 N 정 → 게이트 개방 → 충전 */
      const needA=D.buf[1]>=N, needB=D.single||D.buf[0]>=N;
      if(run&&D.t===0&&needA&&needB&&!S.dmc.bridge){
        D.t=0.0001; D.gateT[1]=0.30; if(!D.single) D.gateT[0]=0.30;
        D.dump[1]={b:D.A,n:D.buf[1],t:0}; if(!D.single) D.dump[0]={b:D.B,n:D.buf[0],t:0};
      }
      if(S.dmc.bridge&&needA&&needB&&D.t===0){ raise("DM33"); }
      if(D.t>0&&run){ D.t+=dt;
        for(const g of [0,1]){ const q=D.dump[g]; if(!q) continue; q.t+=dt; if(q.b){ q.b.fill=Math.min(1,q.t/0.26); } }
        if(D.t>0.30+S.dmc.gateDelay){
          for(const g of [0,1]){ const q=D.dump[g]; if(!q) continue;
            fillBottle(q.b,q.n,g); D.buf[g]=0; D.hold[g]=false; D.dump[g]=null; }
          D.ph="out"; D.t=0;
        } }
      break; }
    case "out": {
      D.exit=Math.max(0,D.exit-dt*14); D.mid=Math.max(0,D.mid-dt*14);
      const last=D.single?D.A:D.B;
      if(!last||last.zone!=="line"||last.s>face(L.n2)+d/2+4){
        D.A=D.B=null; D.single=false; D.ph="rA"; D.waitT=0;
      }
      break; }
  }
}
/* 계수 오차 모델 : 센서창 오염 · 과진동(겹침) · 기본 */
function fillBottle(b,n,g){
  if(!b) return;
  const p=S.rc.prod;
  let err=0;
  if(Math.random()<0.0015) err+=Math.random()<0.5?1:-1;
  for(let c=g*6;c<g*6+6;c++){ const dd=S.dmc.dirt[c]; if(dd>0.5){ const pr=(dd-0.5)*0.10*Math.min(1,n/30+0.4); if(Math.random()<pr) err+=Math.random()<0.65?1:-1; } }
  if(S.dmc.vib[2]>92&&Math.random()<0.05*Math.min(1,n/60+0.3)) err+=1;
  if(S.dmc.brokenPct&&Math.random()<S.dmc.brokenPct) err-=0.5;
  const act=Math.max(0,n+err);
  b.n=act; b.fill=1;
  b.mass=act*p.unit/1000+Math.sqrt(Math.max(1,act))*p.unit/1000*0.012*gauss();
  b.done.dmc=true;
  S.cnt.filled++;
  S.dmc.err+=err!==0?1:0;
}

/* ── 병 이동 ── */
function moveBottles(dt,v,run){
  const d=BD().d;
  /* 정지 조건 : 스토퍼 핀 · 클램프 */
  const stops=[], clamped=new Set();
  for(const k in LN.st){ const st=LN.st[k]; if(st.pin>0.5) stops.push(pinFace(st)); if(st.clampB) clamped.add(st.clampB); }
  const D=LN.dmc;
  if(D){
    if(D.exit>0.5) stops.push(sOfX(L.n2)+d/2);
    if(D.mid>0.5) stops.push(sOfX(L.n1)+d/2);
    if(D.entry>0.5) stops.push(sOfX(L.n1)-d/2-22);
    if(D.clampB) clamped.add(D.clampB);
  }
  const sEntry=S_SCREW0();
  const line=LN.bottles.filter(b=>b.zone==="line").sort((a,b)=>b.s-a.s);
  let prev=null;
  for(const b of line){
    if(b.pocket!==null&&b.pocket!==undefined){ prev=b; continue; }
    let ns=b.s+v*dt;
    if(clamped.has(b)) ns=b.s;
    if(prev){ const lim=prev.s-d; if(ns>lim) ns=Math.max(b.s,Math.min(ns,lim)); if(ns>lim) ns=lim; }
    for(const f of stops){ const lim=f-d/2; if(b.s<=lim+0.6&&ns>lim) ns=lim; }
    if(b.s<sEntry+0.5&&ns>sEntry) ns=sEntry;               /* 스크류 입구 : 포켓 배정 대기 */
    if(b.s>=S_B1&&ns>S_END-d/2){ ns=S_END-d/2; }           /* 집적 테이블 입구 */
    b.s=Math.max(b.s,ns);
    prev=b;
  }
  /* 컨베이어 끝 → 집적 테이블 */
  for(const b of line){ if(b.pocket==null&&b.s>=S_END-d/2-0.5&&run) toTable(b); }
}

/* ── 리젝트 푸셔 ── */
function rejectTick(dt,run){
  const R=LN.rej, d=BD().d, sx=sOfX(L.rej);
  R.ext+=((R.t>0?1:0)-R.ext)*Math.min(1,dt*22);
  if(R.t>0) R.t=Math.max(0,R.t-dt);
  if(run&&R.t<=0){
    const b=LN.bottles.find(x=>x.zone==="line"&&x.ng&&Math.abs(x.s-sx)<10);
    if(b){ R.t=0.22; b.zone="push"; b.pt=0; b.px=L.rej; LN.pushing.push(b); beep(220,0.1,"square",0.04); }
  }
  for(const b of LN.pushing){
    b.pt+=dt;
    if(b.pt>0.9){ b.zone="rej"; S.reject.n++; S.cnt.reject++; LN.rejBin.push({seed:b.id}); }
  }
  LN.pushing=LN.pushing.filter(b=>b.zone==="push");
  LN.bottles=LN.bottles.filter(b=>b.zone!=="rej");
  if(S.reject.n>=S.reject.cap) raise("WC42");
}

/* ═══ RCS-120 : 포켓 체인 · 헤드 · 캡 공급 ═══ */
function capperTick(dt,run){
  const R=LN.rc, d=BD().d, rc=S.rcp;
  const on=run&&!S.rcp.jam;
  R.rate=on?S.bpm/60*1.08:0;                          /* 포켓/초 (라인보다 조금 빠르게) */
  const dPhi=R.rate*dt;
  R.phi+=dPhi;
  /* 캡 공급 : 볼 피더 → 슈트 (최대 7개) */
  R.bowl+=dt*(run?1:0);
  if(run&&rc.feed&&S.mat.cap>0&&R.chute<7){ R.chuteFeed+=dt*2.6; if(R.chuteFeed>=1){ R.chuteFeed=0; R.chute++; S.mat.cap--; } }
  if(run) R.elev+=dt*200;
  if(rc.jam) raise("RC62");
  /* 스크류 입구의 병을 새 포켓에 배정 */
  const sEntry=S_SCREW0();
  if(on){
    const w=LN.bottles.find(b=>b.zone==="line"&&b.pocket==null&&Math.abs(b.s-sEntry)<1);
    const kNew=Math.floor(R.phi+SCREW.fit(d).nS);           /* 입구 도달 포켓 번호 */
    if(w&&!R.captured.has(kNew)&&R.phi-kNew+SCREW.fit(d).nS<0.35&&R.phi-kNew+SCREW.fit(d).nS>=0){ w.pocket=kNew; R.captured.set(kNew,w); }
  }
  /* 포켓의 병 위치 · 캡핑 */
  for(const [k,b] of R.captured){
    const u=R.phi-k;                                        /* A 진입 기준 경과 포켓 수 (음수 = 스크류) */
    b.s=u<0?screwS(u,d):S_A+u*P_PITCH;
    if(b.s>=S_T0&&b.s<=S_T1){
      const a=PATH.tA+(b.s-S_T0)/L.R, deg=((a*180/Math.PI)%360+360)%360;
      const h=R.heads[((k%4)+4)%4];
      if(deg>=165&&deg<205&&h.cap){ b.cap=true; b.capY=Math.max(0,(205-deg)/40*BD().capH*0.9); h.cap=false; b.spin=0; b.capping=true; }
      if(b.capping){ b.capY=Math.max(0,b.capY-dt*30); b.spin+=dt*(deg<310?28:0); if(deg>=310){ b.capping=false; b.torque=rc.torqueBad?rc.torque*0.45:rc.torque*(1+0.03*gauss()); } }
    }
    if(b.s>=S_B1){ b.pocket=null; R.captured.delete(k); b.s=S_B1+0.01; b.zone="line"; if(!b.cap){ raise("RC61"); } }
  }
  /* 헤드 : φ≈CAP_PICK(130°)±11° 에서 슈트 끝 캡을 집는다 */
  for(let j=0;j<4;j++){
    const a=headAngle(j), deg=((a*180/Math.PI)%360+360)%360, h=R.heads[j];
    if(Math.abs(deg-CAP_PICK)<11&&!h.cap&&R.chute>0&&on){ h.cap=true; R.chute--; }
    h.y=headDrop(deg); h.spin+=(deg>=205&&deg<310&&on)?dt*28:0;
  }
  if(on&&R.chute<=0&&S.mat.cap<=0){
    const soon=[...R.captured.values()].some(b=>b.s<S_T0&&b.s>S_T0-P_PITCH*1.2);
    if(soon) raise("RC61");
  }
}
/* 헤드 j 의 터렛 각 (rad) : 포켓 체인과 같은 위상 */
function headAngle(j){
  const R=LN.rc, base=PATH.tA-(S_T0-S_A)/L.R;
  return base+(R.phi-j)*Math.PI/2;
}
/* 헤드 하강량 (0~1) : 픽업 · 체결 구간 */
function headDrop(deg){
  if(Math.abs(deg-CAP_PICK)<13) return Math.sin((deg-CAP_PICK+13)/26*Math.PI)*0.55;
  if(deg>=160&&deg<205) return (deg-160)/45;
  if(deg>=205&&deg<318) return 1;
  if(deg>=318&&deg<345) return 1-(deg-318)/27;
  return 0;
}

/* ── 집적 테이블 ── */
function toTable(b){
  const T=LN.table;
  b.zone="table"; b.pocket=null;
  const idx=T.list.length, pl=tableSlot(idx);
  b.tr=pl.r; b.ta=pl.a-T.ang; b.tt=0;
  T.list.push(b); S.table.n++; S.table.total++;
  S.cnt.good++;
  if(S.table.n>=S.table.cap) raise("RC64");
}
function tableSlot(i){
  const d=BD().d, t=L.table, rings=[];
  let r=t.r-d/2-8, k=i;
  while(r>d){ const n=Math.floor(2*Math.PI*r/(d+2)); if(k<n) return {r, a:Math.PI+ k/n*Math.PI*2}; k-=n; r-=d+2; }
  return {r:d, a:Math.PI+i};
}
function tableTick(dt,run){
  const T=LN.table;
  if(run) T.ang+=dt*0.45;
  for(const b of T.list) b.tt=Math.min(1,b.tt+dt*1.6);
  LN.bottles=LN.bottles.filter(b=>b.zone!=="table");
}
function unloadTable(){
  const T=LN.table; T.list=[]; S.table.n=0; clearAlarm("RC64");
}

/* ── HPE 가열 커터 · 센서 오염 ── */
function peHeat(dt){
  const P=S.pe, want=(S.main&&P.heat)?P.sv:24;
  P.pv+=(want-P.pv)*Math.min(1,dt*(P.heat?0.10:0.05));
  if(P.pv>=P.sv-10) clearAlarm("PE52");
}
function dirtTick(dt,run){
  if(!run) return;
  const k=S.dust?0.0008:0.012;
  for(let c=0;c<12;c++) S.dmc.dirt[c]=Math.min(1,S.dmc.dirt[c]+dt*k*(0.6+0.8*hash1(c*7.1)));
  if(Math.max(...S.dmc.dirt)>0.6) raise("DM32");
}

/* ── 생산 진행 : 목표 도달 → 사이클 정지 안내 ── */
function prodCheck(){
  if(S.cnt.good>=S.cnt.target&&!S.flags.targetMsg){ S.flags.targetMsg=true; toast("목표 수량 "+S.cnt.target+"병 달성 · STOP 을 눌러 운전을 마치세요.","good"); }
}

/* ═══ 알람 엔진 ═══ */
function raise(key){
  const a=ALARMS[key]; if(!a) return;
  if(S.alarms.some(x=>x.key===key)) return;
  S.alarms.push({key,at:tSim});
  S.hist.unshift({key,at:tSim,t:a.t});
  if(S.hist.length>80) S.hist.length=80;
  if(a.kind==="trip"){ if(S.running){ S.running=false; S.tripStop=true; } beep(880,0.25,"square",0.05); }
  else beep(660,0.12,"triangle",0.03);
  if(typeof onAlarm==="function") onAlarm(key);
}
function clearAlarm(key){ const n=S.alarms.length; S.alarms=S.alarms.filter(a=>a.key!==key); return n!==S.alarms.length; }
const tripAlarms=()=>S.alarms.filter(a=>ALARMS[a.key].kind==="trip");
const warnAlarms=()=>S.alarms.filter(a=>ALARMS[a.key].kind==="warn");
function alarmOf(mk){ return S.alarms.filter(a=>ALARMS[a.key].mk===mk); }

/* ═══ 기동 조건 · 운전 스위치 ═══ */
function startBlockers(){
  const r=[];
  if(!S.main) r.push("메인 전원이 꺼져 있습니다.");
  if(S.airP<5.5) r.push("압축공기 압력이 부족합니다 (5.5 bar 이상).");
  if(S.door!=="closed") r.push("안전문이 열려 있습니다.");
  if(S.emg) r.push("비상정지 상태입니다.");
  if(!S.user) r.push("HMI 에 로그인하지 않았습니다.");
  if(!S.recipeApplied) r.push("생산 품목(레시피)이 적용되지 않았습니다.");
  if(tripAlarms().length) r.push("해제되지 않은 알람이 있습니다 — RESET.");
  if(S.pe.pv<S.pe.sv-10) r.push("HPE-100 가열 커터 온도가 낮습니다 ("+Math.round(S.pe.pv)+" / "+S.pe.sv+" ℃).");
  if(S.mat.bottle<=0&&LN.tt.n<=0) r.push("빈 병이 없습니다.");
  if(S.mat.gel<=0) r.push("실리카겔 롤이 없습니다.");
  if(S.mat.tab<=0) r.push("정제가 없습니다.");
  if(S.mat.film<=0) r.push("PE 필름이 없습니다.");
  if(S.mat.cap<=0&&LN.rc.chute<=0) r.push("캡이 없습니다.");
  if(S.table.n>=S.table.cap) r.push("집적 테이블이 가득 찼습니다.");
  if(S.reject.n>=S.reject.cap) r.push("리젝트함이 가득 찼습니다.");
  return r;
}
function lineStart(){
  const r=startBlockers();
  if(r.length){ toast("START 조건 미충족\n"+r.slice(0,3).join("\n"),"bad"); if(typeof deduct==="function") deduct("startBad","조건 미충족 START"); return false; }
  S.running=true; S.started=true; S.cycleStop=false; S.tripStop=false;
  if(!S.wc.zero[0]||!S.wc.zero[1]) raise("WC44");
  beep(520,0.1,"sine",0.05);
  return true;
}
function lineStop(){ if(S.running){ S.running=false; beep(400,0.12,"sine",0.05); } S.cycleStop=S.cnt.good>=S.cnt.target; }
function lineReset(){
  if(S.emg){ toast("비상정지 버튼을 먼저 해제하세요.","bad"); return false; }
  const before=S.alarms.length;
  S.alarms=S.alarms.filter(a=>{
    const k=a.key;
    if(k==="E001") return S.door!=="closed";
    if(k==="E002") return S.airP<5.0;
    if(k==="UA11") return S.mat.bottle<=0&&LN.tt.n<=0;
    if(k==="UA12") return S.ua.jam;
    if(k==="SG21") return S.mat.gel<=0;
    if(k==="SG22") return S.sg.markBad;
    if(k==="DM31") return S.mat.tab<S.rc.n*6;
    if(k==="DM32") return Math.max(...S.dmc.dirt)>0.6;
    if(k==="DM33") return S.dmc.bridge;
    if(k==="WC42") return S.reject.n>=S.reject.cap;
    if(k==="WC44") return !(S.wc.zero[0]&&S.wc.zero[1]);
    if(k==="PE51") return S.mat.film<=0;
    if(k==="PE52") return S.pe.pv<S.pe.sv-10;
    if(k==="RC61") return S.mat.cap<=0&&LN.rc.chute<=0;
    if(k==="RC62") return S.rcp.jam;
    if(k==="RC63") return S.rcp.torqueBad;
    if(k==="RC64") return S.table.n>=S.table.cap;
    if(k==="WC41"){ S.wc.consec=0; return false; }
    return false;
  });
  beep(700,0.08,"sine",0.04);
  return before!==S.alarms.length;
}
/* 라인 초기화 (새 세션) */
function lineInit(){
  LN.bottles=[]; LN.pushing=[]; LN.rejBin=[]; LN.table.list=[]; LN.fed=0; LN.feedT=0; LN.tt.n=18;
  LN.rc.captured=new Map(); LN.rc.chute=0; LN.rc.heads.forEach(h=>{h.cap=false;});
  makeStations();
}
