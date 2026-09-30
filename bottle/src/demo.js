/* ═══════════════════════════════════════════════════════════════════
   시연 모드 — 버튼 하나로 라인 전체 자동 가동 (준비 절차 · 채점 없음)
   · 설비 준비 상태(공압 · 전원 · 로그인 · 레시피 · 자재 · 영점)를 자동 설정하고 바로 운전
   · 자재가 줄면 작업자가 보충, 집적 테이블 · 리젝트 트레이가 차면 회수
   · 카메라가 설비를 차례로 보여 준다 (화면을 조작하면 투어 중지)
   ═══════════════════════════════════════════════════════════════════ */
const isDemo=()=>!!S&&S.mode==="demo";
const DEMO={tour:true, t:0, i:0, rT:0};
const DEMO_TOUR=["all","ua","sg","wc","dmc","pe","rc","table"];
function demoSetup(){
  S.air=true; S.airP=6.2; S.main=true; S.dust=true; S.door="closed";
  S.user=ACCOUNTS[0]; S.lvl=ACCOUNTS[0].lvl;
  applyRecipe(); S.recipeApplied=true; S.dmc.checked=S.wc.checked=S.rcp.checked=true;
  for(const k of ["bottle","gel","film","cap"]) S.mat[k]=MAT_CAP[k];
  S.mat.tab=matCap("tab");
  S.wc.zero=[true,true]; S.wc.off=[0,0]; S.ua.air=S.ua.vac=true; S.pe.sensor=true; S.rcp.feed=true;
  S.cnt.target=1e9; S.running=true; S.started=true;
  DEMO.tour=true; DEMO.t=0; DEMO.i=0; DEMO.rT=0;
  demoTourBtn();
}
function demoTourBtn(){ const b=$("#demoTour"); if(!b) return; b.style.display=isDemo()?"":"none"; b.textContent=DEMO.tour?"🎥 카메라 투어 ON":"🎥 카메라 투어 OFF"; b.classList.toggle("on",DEMO.tour); }
/* 자재 보충 · 회수 작업 (작업자가 걸어가 수행) */
const DEMO_JOBS=[
  ["bottle",()=>S.mat.bottle<MAT_CAP.bottle*0.2,()=>{ S.mat.bottle=MAT_CAP.bottle; clearAlarm("UA11"); }],
  ["gel",   ()=>S.mat.gel<MAT_CAP.gel*0.15,      ()=>{ S.mat.gel=MAT_CAP.gel; clearAlarm("SG21"); }],
  ["tab",   ()=>S.mat.tab<matCap("tab")*0.2,     ()=>{ S.mat.tab=matCap("tab"); clearAlarm("DM31"); }],
  ["film",  ()=>S.mat.film<MAT_CAP.film*0.15,    ()=>{ S.mat.film=MAT_CAP.film; clearAlarm("PE51"); }],
  ["cap",   ()=>S.mat.cap<MAT_CAP.cap*0.2,       ()=>{ S.mat.cap=MAT_CAP.cap; clearAlarm("RC61"); }],
  ["reject",()=>S.reject.n>=S.reject.cap-6,      ()=>{ S.reject.n=0; LN.rejBin=[]; clearAlarm("WC42"); }],
  ["table", ()=>S.table.n>=S.table.cap-8,        ()=>{ unloadTable(); }]
];
/* 자재 보충 · 회수를 알람 전에 미리 (시연 모드 · 영상 자동재생의 연속 생산 구간) */
function autoSupply(){
  for(const [job,need,act] of DEMO_JOBS){
    if(!need()) continue;
    if(WK.some(w=>w.job&&w.job.key===job)) continue;
    const w=wkFor(JOBS[job].stand); if(w.job) continue;
    startWork(job,act,(isDemo()&&!DEMO.tour)?{view:null}:{});
  }
}
function demoTick(dt){
  if(typeof AP!=="undefined"&&AP.video&&S&&S.session&&S.session.active&&!S.activeTrouble&&S.running){ const st=curStep(); if(st&&st.watch&&AP.dir==="done") autoSupply(); }
  if(!isDemo()||!S.session||!S.session.active) return;
  autoSupply();
  /* 알람 자동 복구 (시연 중 정지 방지) */
  if(!S.running){ DEMO.rT+=dt; if(DEMO.rT>1.2){ DEMO.rT=0; lineReset(); if(!tripAlarms().length){ S.running=true; S.tripStop=false; } } }
  else DEMO.rT=0;
  /* 카메라 투어 */
  if(DEMO.tour&&cam.view!=="work"){ DEMO.t+=dt; if(DEMO.t>8){ DEMO.t=0; DEMO.i=(DEMO.i+1)%DEMO_TOUR.length; camSet(DEMO_TOUR[DEMO.i]); } }
}
function bindDemo(){
  const stop=()=>{ if(isDemo()&&DEMO.tour){ DEMO.tour=false; demoTourBtn(); toast("카메라 투어 중지 — [카메라 투어] 로 다시 켭니다."); } };
  $("#view3d").addEventListener("pointerdown",e=>{ if(e.target.id==="cv3d") stop(); });
  $("#view3d").addEventListener("wheel",stop,{passive:true});
  $$("#v3Grp [data-v]").forEach(b=>b.addEventListener("click",stop));
  $("#demoTour").onclick=()=>{ DEMO.tour=!DEMO.tour; DEMO.t=0; demoTourBtn(); if(DEMO.tour) camSet(DEMO_TOUR[DEMO.i]); };
}
