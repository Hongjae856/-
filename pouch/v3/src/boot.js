/* ═══════════════════════════════════════════════════════════════════
   부팅 · 메인 루프 (새 3D 연결판)
   ═══════════════════════════════════════════════════════════════════ */
let uiAcc=0, hmiAcc=0, lastNow=0;
function frame(){
  requestAnimationFrame(frame);
  const now=performance.now(), dt=Math.min(0.1,lastNow?(now-lastNow)/1000:0); lastNow=now; RDT=dt;
  const live=S&&S.session&&S.session.active;
  if(live){
    const sdt=dt*SPD, n=Math.max(1,Math.ceil(sdt/0.02));
    for(let i=0;i<n;i++){ simTick(sdt/n); wkTick(sdt/n); }
    tSim+=sdt;
    caseTick(); examTroubleTick();
    S.session.sec=(now-S.session.start)/1000;
  }else if(S) wkTick(dt);
  fpFrame(now);
  camStep(dt);
  uiAcc+=dt; hmiAcc+=dt;
  if(uiAcc>0.25&&S&&S.session){ uiAcc=0; renderTiles(); stepCheck(); renderCoach(); }
  if(hmiAcc>0.6&&S&&S.session){ hmiAcc=0; drawHMI(); clock(); }
  apTick(now);
  if($("#splash").classList.contains("hide")){
    if(!R3.ready){ if(!r3Init()) return; bindOrbit(R3.cv,onCvClick,onCvHover); }
    if(!R3.gl) return;
    if(STATIC_KEY!==staticKey()) buildStatic();
    gfxAdapt(now); r3Resize(); camPrep(R3.W,R3.H); drawRoom(); r3Paint(); drawOverlay(); fpPlaceMonitor();
  }
  applyHint();
}
function clock(){ const d=new Date(), p=n=>String(n).padStart(2,"0");
  $("#hClock").innerHTML=d.getFullYear()+"."+p(d.getMonth()+1)+"."+p(d.getDate())+"<br>"+p(d.getHours())+":"+p(d.getMinutes())+":"+p(d.getSeconds()); }
/* 그래픽 단계 버튼 (자동 → 상 → 중 → 하) */
function bindGfx(){
  const g=$("#v3Grp"); if(!g||$("#gqBtn")) return;
  g.insertAdjacentHTML("beforeend",'<button class="tg" id="gqBtn" title="그래픽 품질 : 자동 · 상 · 중 · 하">그래픽 '+GQ.label()+'</button>');
  $("#gqBtn").onclick=()=>{ const o=["auto","high","mid","low"]; gqSet(o[(o.indexOf(GQ.mode)+1)%o.length]); };
}
function boot(){
  fitApp(); addEventListener("resize",fitApp);
  bindPanel(); bindHeader(); bindAuto(); bindVersion(); initSplash(); fpInit(); bindGfx();
  lineInit(); clock();
  window.__IDT={S:()=>S, LN, cam, R3, STEPS, startSession, apStart, apStop, AP, launchIncident, WK, FP, fpSet, V3:()=>V3, GQ, gqSet, camSet};
  requestAnimationFrame(frame);
}
boot();
