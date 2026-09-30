/* ═══════════════════════════════════════════════════════════════════
   부팅 · 메인 루프
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
    caseTick(); examTroubleTick(); demoTick(dt);
    S.session.sec=(now-S.session.start)/1000;
  }else if(S) wkTick(dt);
  camStep(dt);
  uiAcc+=dt; hmiAcc+=dt;
  if(uiAcc>0.25&&S&&S.session){ uiAcc=0; renderTiles(); stepCheck(); renderCoach(); }
  if(hmiAcc>0.6&&S&&S.session){ hmiAcc=0;
    const busy=document.activeElement&&/INPUT/.test(document.activeElement.tagName);
    if(!busy&&!$("#mNum").classList.contains("on")) drawHMI(); clock(); }
  apTick(now);
  if($("#splash").classList.contains("hide")){
    if(!R3.ready){ if(!r3Init()) return; bindOrbit(R3.cv,onCvClick,onCvHover); }
    if(!R3.gl) return;
    if(STATIC_KEY!==staticKey()) buildStatic();
    r3Resize(); camPrep(R3.W,R3.H); drawRoom(); drawDynamic(); r3Paint(); drawOverlay();
  }
  applyHint();
}
function clock(){ const d=new Date(), p=n=>String(n).padStart(2,"0");
  $("#hClock").innerHTML=d.getFullYear()+"."+p(d.getMonth()+1)+"."+p(d.getDate())+"<br>"+p(d.getHours())+":"+p(d.getMinutes())+":"+p(d.getSeconds()); }
function boot(){
  fitApp(); addEventListener("resize",fitApp);
  initKeypad(); bindTiles(); bindPanel(); bindHeader(); bindAuto(); bindDemo(); initSplash();
  lineInit(); drawHMI(); syncBpm(); clock();
  window.__IDT={S:()=>S, LN, cam, R3, STEPS, startSession, SEL, apStart, apStop, AP, launchIncident};
  requestAnimationFrame(frame);
}
boot();
