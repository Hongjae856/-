/* ═══════════════════════════════════════════════════════════════════
   공정 시뮬레이션 — 충전(스트로크 · 10열) → 정렬컨베어 → 스틱공급장치 → 카토너(6포) →
                     케이스 프린터 · 비전 → X-ray → 중량선별기 → 수동포장
   · 실제 운전 속도 30 stroke/min = 300 포/min = 50 카톤/min (배속으로 체감 시간 단축)
   ═══════════════════════════════════════════════════════════════════ */
const LN={pouch:[], empty:[], fallen:0, buf:0, ctT:0, ctPh:0, cartons:[], table:0, binX:0, binW:0, rejBox:0, ctRej:0};
const CV_SPEED=520;            /* 정렬컨베어 mm/s */
const CT_SPEED=300;            /* 카톤 컨베이어 mm/s */
const POUCH_GAP=46;            /* 정렬컨베어 위 파우치 최소 간격 */
const roomF=()=>S.room==="F", roomP=()=>S.room==="P";

/* 하류(포장실)가 받을 수 있는가 — 충전실 과정에서는 포장실이 자동 가동 */
function packReady(){ const p=S.p; return p.ctRun&&p.sfRun; }
function hmReady(){ return S.p.hm&&S.p.hmT>=160; }
function xrReady(){ return S.p.xrPow&&S.p.xrBoot>=1; }

function simTick(dt){
  utilTick(dt);
  if(roomP()) autoFiller();
  fillerTick(dt);
  pouchTick(dt);
  cartonerTick(dt);
  cartonTick(dt);
}
/* ── 유틸리티 · 예열 (실제 시간은 SOP 기준, IDT 는 수 초로 압축) ── */
function utilTick(dt){
  const f=S.f, p=S.p;
  const air=f.airV[0]&&f.airV[1];
  f.airP+=((air?6.0:0)-f.airP)*Math.min(1,dt*1.6);
  f.heat+=((f.main?f.heatSV:20)-f.heat)*Math.min(1,dt*(f.main?0.55:0.2));
  p.hmT+=((p.hm?172:20)-p.hmT)*Math.min(1,dt*(p.hm?0.45:0.15));
  if(p.xrPow&&p.xrBoot<1) p.xrBoot=Math.min(1,p.xrBoot+dt/5);
  if(!p.xrPow){ p.xrBoot=0; p.xrKey=false; p.xrX=false; p.xrConv=false; }
  /* 1 · 3 번 호퍼 : 이송기 ON 이면 센서 감지로 자동 보충 */
  if(f.panel&&f.ibc[0]&&S.hop.add<92) S.hop.add=Math.min(100,S.hop.add+dt*18);
  if(f.panel&&f.ibc[2]&&S.hop.sug<92) S.hop.sug=Math.min(100,S.hop.sug+dt*18);
  if(f.run&&!(f.airV[0]&&f.airV[1])&&f.airP<4.5) raise("AIR");
  if(f.run&&S.f.door!=="closed") raise("DOOR");
}
/* 포장실 과정 : 충전기는 자동 (카토너 · 스틱공급장치가 가동하면 함께 가동) */
function autoFiller(){
  const f=S.f;
  if(packReady()&&!tripAlarms().length&&!S.activeTrouble){ f.run=true; f.filling=true; }
  else if(f.link&&!packReady()) f.run=false;
}
/* 충전기 RUN 조건 */
function fillerBlockers(){
  const f=S.f, b=[];
  if(!f.main) b.push("메인 파워 OFF");
  if(!f.panel) b.push("컨트롤 판넬 OFF");
  if(f.panel&&!f.user) b.push("로그인 필요");
  if(f.airP<5.5) b.push("압축공기 압력 부족 (밸브 2개)");
  if(f.heat<f.heatSV-6) b.push("실링 히터 승온 중");
  if(f.roll!=="red") b.push(f.roll==="plain"?"무지 은박 롤 장착 상태 (생산용 적색 인쇄 은박 필요)":"은박 롤 없음");
  if(f.door!=="closed") b.push("안전도어 열림");
  if(f.emg) b.push("비상정지 눌림");
  if(tripAlarms().length) b.push("알람 미해제 — RESET");
  if(f.link&&!packReady()) b.push("후 공정 연동 ON — 카토너 · 스틱공급장치 정지 상태");
  return b;
}
function fillerRun(){
  const b=fillerBlockers();
  if(b.length){ toast("RUN 조건 미충족\n"+b[0],"bad"); if(typeof deduct==="function") deduct("startBad"); return false; }
  S.f.run=true; S.f.started=true; beep(880,0.08,"square",0.04); return true;
}
function fillerStop(){ if(S.f.run){ S.f.run=false; beep(400,0.12,"sine",0.05); } }
function fillerReset(){
  for(const a of S.alarms.slice()){ const k=a.key; if(alarmCause(k)) continue; clearAlarm(k); }
}
/* 알람 원인이 남아 있는가 */
function alarmCause(k){
  const f=S.f;
  switch(k){
    case "FILM": return f.roll!=="red";
    case "DOOR": return f.door!=="closed";
    case "FEED": return S.hop.main<5;
    case "EMG": return f.emg;
    case "AIR": return !(f.airV[0]&&f.airV[1]);
    default: return !!(S.flags.fault&&S.flags.fault[k]);
  }
}
/* ── 충전기 : 스트로크마다 10 포 ── */
function fillerTick(dt){
  const f=S.f;
  if(f.link&&!packReady()&&f.run&&roomF()){ /* 충전실 과정은 포장실 자동이라 해당 없음 */ }
  if(!f.run){ f.phase=0; return; }
  const per=60/Math.max(10,f.spm);
  f.phase+=dt/per;
  while(f.phase>=1){ f.phase-=1; stroke(); if(!f.run) break; }
}
function stroke(){
  const f=S.f;
  f.strokes++;
  if(f.roll!=="red"){ raise("FILM"); f.run=false; return; }
  if(f.jogOne){ f.jogOne=false; f.run=false; f.jogDone=true; }
  const fill=f.filling&&f.dose.every(x=>x);
  if(f.filling&&S.hop.main<1){ raise("FEED"); f.run=false; return; }
  if(fill){ S.hop.main=Math.max(0,S.hop.main-0.045); S.hop.add=Math.max(0,S.hop.add-0.02); S.hop.sug=Math.max(0,S.hop.sug-0.05); }
  const printed=f.prn.saved;
  const printBad=!printed||f.headDirty||f.ribbon<5;
  for(let i=0;i<NOZ.n;i++){
    const empty=!fill;
    const vis=f.vision&&printBad;
    const toEmpty=empty||vis||!S.p.align;
    S.cnt.pouch++;
    if(toEmpty){ S.cnt.empty++; LN.empty.push({x:FIL.x0-40-Math.random()*40, t:0, i}); if(LN.empty.length>60) LN.empty.shift(); continue; }
    LN.pouch.push({s:-i*POUCH_GAP*0.9, col:i, bad:printBad, skew:f.alnBad?(Math.random()-0.5)*1.6:0});
  }
}
/* 정렬컨베어 이동 · 스틱공급장치 버퍼 */
function pouchTick(dt){
  const run=S.p.align, L=PPATH.len;
  if(run){
    LN.pouch.sort((a,b)=>b.s-a.s);
    let lead=Infinity;
    for(const q of LN.pouch){
      let ns=q.s+CV_SPEED*dt;
      const cap=(lead===Infinity?L:lead-POUCH_GAP);
      if(ns>cap) ns=Math.max(q.s,cap);
      q.s=ns; lead=q.s;
    }
    const keep=[];
    for(const q of LN.pouch){
      if(q.s>=L-2&&S.p.sfRun&&LN.buf<60){ LN.buf++; S.cnt.toPack++; continue; }
      keep.push(q);
    }
    LN.pouch=keep;
  }
  for(const e of LN.empty) e.t+=dt;
  LN.empty=LN.empty.filter(e=>e.t<6);
}
/* ── 카토너 : 6 포 + 설명지 → 카톤 (50 카톤/min) ── */
function cartonerTick(dt){
  const p=S.p;
  if(!(p.ctRun&&p.sfRun)) return;
  LN.ctT+=dt;
  const per=60/50;
  if(LN.ctT<per) return;
  if(LN.buf<PROD.perCarton||p.mag<=0||p.leaf<=0||!hmReady()) { LN.ctT=per; return; }
  LN.ctT=0; LN.buf-=PROD.perCarton; p.mag--; if(!p.leafBad) p.leaf--;
  S.cnt.carton++;
  const w=PROD.cartonTare+(p.leafBad?-4.2:0)+cartonNet()+gauss()*0.35;
  LN.cartons.push({x:CPATH.x0, leaf:!p.leafBad, print:null, w, foreign:p.xrForeign>0&&Math.random()<0.5, rej:null, seen:{}});
  if(p.xrForeign>0) p.xrForeign--;
}
/* 6 포 내용물 중량 : 다이얼 편차(이상사례 F1) 반영 */
function cartonNet(){ const d=S.f.dial; return 6*(IPC_STD.main.std*(1+d.main)+IPC_STD.add.std*(1+d.add)+IPC_STD.sug.std*(1+d.sug)); }
const ST={pr:(PR.x0+PR.x1)/2-60, vs:PR.x1-90, xr:(XR.x0+XR.x1)/2, cw:(CW.x0+CW.x1)/2, bin:BIN.x};
function stationOn(k){ const p=S.p; return k==="pr"?p.prRun:k==="vs"?p.vsRun:k==="xr"?(xrReady()&&p.xrX&&p.xrConv):k==="cw"?p.cwRun:true; }
function cartonTick(dt){
  const p=S.p, keep=[];
  LN.cartons.sort((a,b)=>b.x-a.x);
  let lead=Infinity;
  for(const c of LN.cartons){
    let nx=c.x+CT_SPEED*dt;
    /* 꺼진 설비 앞에서 멈춘다 */
    for(const k of ["pr","xr","cw"]){ const X=ST[k]-60; if(c.x<=X&&nx>X&&!stationOn(k)) nx=X; }
    if(nx>lead-110) nx=Math.max(c.x,lead-110);
    c.x=nx; lead=c.x;
    if(!c.seen.pr&&c.x>=ST.pr){ c.seen.pr=1; c.print=p.prRun&&p.lbl.loaded?(p.nozzleBad||p.ink<5?"blur":"ok"):"none"; if(c.print==="ok") p.ink=Math.max(0,p.ink-0.02); }
    if(!c.seen.vs&&c.x>=ST.vs){ c.seen.vs=1; if(p.vsRun&&c.print!=="ok"){ c.rej="vs"; S.cnt.rejVs++; LN.rejBox++; continue; } }
    if(!c.seen.xr&&c.x>=ST.xr){ c.seen.xr=1; if(c.foreign){ c.xrNG=true; S.xrLast="NG"; S.flags.xrBlink=tSim; } else S.xrLast="OK"; }
    if(!c.seen.cw&&c.x>=ST.cw){ c.seen.cw=1; S.cwLast=c.w; S.cwSum+=c.w; S.cwN++;
      const d=c.w-PROD.cw.std; c.cwNG=d<PROD.cw.lo||d>PROD.cw.hi; }
    if(!c.seen.bin&&c.x>=ST.bin){ c.seen.bin=1;
      if(c.xrNG){ S.cnt.rejXr++; LN.binX++; continue; }
      if(c.cwNG){ S.cnt.rejCw++; LN.binW++; continue; } }
    if(c.x>=CPATH.x1){ S.cnt.good++; LN.table++; if(LN.table>=PROD.perCase){ LN.table=0; S.cnt.cases++; } continue; }
    keep.push(c);
  }
  LN.cartons=keep;
}
/* ── 알람 ── */
function raise(key){
  if(S.alarms.some(a=>a.key===key)) return;
  const A=ALARMS[key]; if(!A) return;
  S.alarms.push({key,at:tSim}); S.hist.unshift({key,t:A.t,at:tSim}); if(S.hist.length>40) S.hist.pop();
  if(A.kind==="trip"&&A.mk==="fl"){ S.f.run=false; }
  beep(300,0.25,"sawtooth",0.05);
  if(typeof onAlarm==="function") onAlarm(key);
}
function clearAlarm(key){ const n=S.alarms.length; S.alarms=S.alarms.filter(a=>a.key!==key); return n!==S.alarms.length; }
const tripAlarms=()=>S.alarms.filter(a=>ALARMS[a.key].kind==="trip");
function alarmOf(mk){ return S.alarms.filter(a=>ALARMS[a.key].mk===mk); }

/* ── 카토너 START 조건 (포장실) ── */
function ctBlockers(){
  const p=S.p, b=[];
  if(!(p.ctMain&&p.sfSw&&p.ctAir)) b.push("카토너 메인 · 스틱공급장치 스위치 · 압축공기");
  if(!hmReady()) b.push("핫멜트 세팅 온도 미도달");
  if(!p.ctUser) b.push("카토너 로그인 필요");
  if(p.mag<=0||p.leaf<=0) b.push("카톤 · 설명서 투입 필요");
  if(!p.ctIcon) b.push("자동 화면 카톤 · 설명지 · 제품투입 아이콘 활성화 필요");
  if(!(p.prRun&&p.vsRun&&p.xrConv&&p.cwRun)) b.push("후단 설비(프린터 · 비전 · X-ray · 중량선별기) 가동 필요");
  return b;
}
function lineInit(){
  LN.pouch=[]; LN.empty=[]; LN.buf=0; LN.ctT=0; LN.cartons=[]; LN.table=0; LN.binX=0; LN.binW=0; LN.rejBox=0;
}
