/* ═══════════════════════════════════════════════════════════════════
   자연 변동 · 자재 소모 (11/17 사용자 선택) — 모든 수치는 교육용 설정값 (확인 필요)
   · 실링 히터 온도 : 세로 10 · 가로 4 영역이 각각 SV 주변에서 흔들림 (표준편차 약 0.8 ℃ · 최대 ±2 ℃) — 승온이 끝난 뒤
   · 압축공기 압력 : 6.0 kgf/cm² 주변 ±0.2 이내 흔들림 (표시)
   · 무작위 소량 불량 : 중량 NG 약 0.15 % (카톤 · 중량선별기 배출) · 실링 불량 약 0.15 % (파우치 · 충전기 불량 배출) — sim.js 패치
   · 은박 롤 잔량 : 1롤 = 1,200 스트로크(12,000 포) 기준으로 감소 · 3D 롤 지름 감소 · 15 % 이하 교체 준비 안내 · 0 % 면 필름 알람으로 정지 → 새 롤 교체
   · 2번 호퍼(주성분) : 충전 스트로크(10포)마다 0.28 % 감소(약 360 회) · 30 % 이하 재공급 안내 (포장실 과정 · 시연에서는 충전실 작업자가 보충한 것으로 처리)
   · 카톤 · 설명서 : 매거진 400 매 투입 후 1 카톤마다 감소 · 100 매 이하 보충 안내 (충전실 과정에서는 포장실 작업자가 보충)
   · 은박 프린터 리본 : 1,500 스트로크 · 케이스 프린터 잉크 : 1,000 카톤 기준으로 감소 · 15 % 이하 교체 안내 · 교체 타일
   ═══════════════════════════════════════════════════════════════════ */
const CONS={t:null, st:null, roll:null, s:null, air:0, ct:null, warn:{}};
const CONS_N={foil:1200, hop2:.28, rib:1500, ink:1000};   /* 2번 호퍼 : 충전 스트로크 약 360 회 (충전실 과정 1회 ≈ 250 회 충전) */
const ouStep=(x,th,s,dt,lim)=>clamp(x-th*x*dt+s*Math.sqrt(2*th*dt)*gauss(),-lim,lim);
/* 표시용 실링 온도 PV (영역 i : 0~9 세로 · 10~13 가로) */
function heatPV(v,i){ const f=S.f; if(!f.main) return "-"; const base=Math.min(v,v*f.heat/f.heatSV), n=(f.tN&&f.tN[i])||0; return fmt(base+(f.heat>=f.heatSV-1?n:0),1); }
const airShow=()=>S.f.airP+(S.f.airP>5?CONS.air:0);
function consWarn(key,on,msg,kind){ if(on&&!CONS.warn[key]){ CONS.warn[key]=1; toast(msg,kind||"bad"); } else if(!on) CONS.warn[key]=0; }
function consTick(){
  if(!S||!S.session||!S.session.active||!S.f){ CONS.t=null; return; }
  const f=S.f, p=S.p;
  if(CONS.s!==S||CONS.t==null||tSim<CONS.t){ CONS.s=S; CONS.t=tSim; CONS.st=f.strokes; CONS.roll=f.roll; CONS.ct=S.cnt.carton; CONS.warn={}; if(f.foil==null) f.foil=100; if(f.tN==null) f.tN=Array(14).fill(0); return; }
  const dt=tSim-CONS.t; CONS.t=tSim; if(dt<=0||dt>120) return;
  /* 온도 · 공기압 흔들림 */
  for(let i=0;i<14;i++) f.tN[i]=ouStep(f.tN[i],1/40,.8,dt,2);
  CONS.air=ouStep(CONS.air,1/20,.08,dt,.2);
  /* 은박 롤 */
  if(f.roll==="red"&&CONS.roll!=="red") f.foil=100; CONS.roll=f.roll;
  const ds=Math.max(0,f.strokes-CONS.st); CONS.st=f.strokes;
  if(ds&&f.roll==="red"){ f.foil=Math.max(0,f.foil-ds*100/CONS_N.foil);
    if(f.foil<=0){ f.roll="none"; S.flags.redTaken=false; CONS.roll="none"; toast("은박 롤 소진 — 필름 알람 정지. 예비 적색 인쇄 은박 롤로 교체하세요.","bad"); } }
  consWarn("foil",f.roll==="red"&&f.foil<15,"은박 롤 잔량 "+Math.round(f.foil)+" % — 교체할 예비 롤을 준비하세요.");
  /* 2번 호퍼 (sim 기본 소모 0.045 % 에 더함) */
  if(ds&&f.filling&&f.dose.every(x=>x)) S.hop.main=Math.max(0,S.hop.main-ds*(CONS_N.hop2-.045));
  if((S.room!=="F"||S.mode==="demo")&&S.hop.main<30) S.hop.main=100;
  consWarn("hop2",S.room==="F"&&S.mode!=="demo"&&S.hop.main<30,"2번 호퍼 주성분 "+Math.round(S.hop.main)+" % — 스쿱으로 재공급하세요.");
  /* 은박 프린터 리본 */
  if(ds&&f.prn&&f.prn.saved) f.ribbon=Math.max(0,f.ribbon-ds*100/CONS_N.rib);
  consWarn("rib",S.room==="F"&&f.ribbon<15,"은박 프린터 리본 "+Math.round(f.ribbon)+" % — 리본을 교체하세요.");
  /* 카톤 · 설명서 · 잉크 */
  const dc=Math.max(0,S.cnt.carton-CONS.ct); CONS.ct=S.cnt.carton;
  if(dc) p.ink=Math.max(0,p.ink-dc*(100/CONS_N.ink-.02));                      /* sim 기본 소모 0.02 % 에 더함 */
  if(S.room==="F"){ if(p.mag<60) p.mag=400; if(p.leaf<60) p.leaf=400; if(p.ink<20) p.ink=100; }   /* 충전실 과정 : 포장실 작업자가 보충 */
  else { consWarn("mag",p.mag>0&&p.mag<=100,"카톤 매거진 잔량 "+p.mag+" 매 — 카톤을 보충하세요."); consWarn("leaf",p.leaf>0&&p.leaf<=100,"설명서 잔량 "+p.leaf+" 매 — 설명서를 보충하세요.");
    consWarn("ink",p.ink<15,"케이스 프린터 잉크 "+Math.round(p.ink)+" % — 잉크를 교체하세요."); }
}
/* 3D 은박 롤 지름 (bridge v3Sync) */
function consDraw(){
  if(typeof FM==="undefined"||!FM.roll||!S||!S.f) return;
  const act=S.session&&S.session.active, q=act?clamp((S.f.foil==null?100:S.f.foil)/100,0,1):1, R=.165, rc=.052, k=Math.sqrt(rc*rc+(R*R-rc*rc)*q)/R;
  const [roll,...ends]=FM.roll; if(roll&&roll.scale.x!==k){ roll.scale.set(k,1,k); for(const e of ends) e.scale.set(k,k,1); }
}
/* 타일 표시 · 교체 작업 */
{ const s0=TILE.mRed.s, w0=TILE.mRed.warn; TILE.mRed.s=()=>S.f.roll==="red"?"장착 · 잔량 "+Math.round(S.f.foil==null?100:S.f.foil)+" %":s0(); TILE.mRed.warn=()=>w0()||S.f.roll==="red"&&S.f.foil<15;
  TILE.mScoop.warn=()=>S.hop.main<30;
  const p0=TILE.mPrn.s; TILE.mPrn.s=()=>p0()+" · 리본 "+Math.round(S.f.ribbon)+" %"; TILE.mPrn.warn=()=>S.f.ribbon<15;
  TILE.pMag.warn=()=>S.p.mag>0&&S.p.mag<=100; TILE.pLeaf.warn=()=>S.p.leaf>0&&S.p.leaf<=100;
  const a0=TILE.fAir1.s; TILE.fAir1.s=()=>fmt(airShow(),1)+" kgf/cm²";
  TILE.fRib={e:"🎞️",b:"은박 프린터 리본 교체",s:()=>"리본 "+Math.round(S.f.ribbon)+" %",lv:()=>S.f.ribbon,on:()=>S.f.ribbon>=20,warn:()=>S.f.ribbon<15,
    click(){ if(S.f.run){ toast("운전 중에는 리본을 교체하지 않습니다. 먼저 STOP.","bad"); return; } act("prn",()=>{ S.f.ribbon=100; toast("은박 프린터 리본 교체 완료","good"); }); }};
  TILE.pInk={e:"🧴",b:"케이스 프린터 잉크 교체",s:()=>"잉크 "+Math.round(S.p.ink)+" %",lv:()=>S.p.ink,on:()=>S.p.ink>=20,warn:()=>S.p.ink<15,
    click(){ act("ink",()=>{ S.p.ink=100; toast("케이스 프린터 잉크 교체 완료","good"); }); }};
  if(!TILESET.F.mat.includes("fRib")) TILESET.F.mat.splice(TILESET.F.mat.indexOf("mPrn")+1,0,"fRib");
  if(!TILESET.P.mat.includes("pInk")) TILESET.P.mat.splice(TILESET.P.mat.indexOf("pLeaf")+1,0,"pInk"); }
function consInit(){ setInterval(consTick,250); }
