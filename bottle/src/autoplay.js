/* ═══════════════════════════════════════════════════════════════════
   자동재생 · 영상 자동재생
   · 힌트와 같은 대상(노란 화살표)을 실제로 눌러 진행한다
   · 오른쪽 PLC(HMI) 버튼 · 알람/이상사례 조치 : 누르기 전 화살표를 약 2초 (실제 시간, 배속 무관)
   · 그 밖의 조작은 빠르게 (배속 반영)
   · 영상 자동재생 : 커서가 이동해 누르고, 생산 중 [이상사례] · [알람] 메뉴에서 직접 발생 → 조치
   ═══════════════════════════════════════════════════════════════════ */
const AP={on:false, video:false, key:null, at:0, lastAct:0, pinSel:null, dir:"off", dirT:0, cx:0, cy:0, fx:0, fy:0, t0:0, dur:0, arrived:0, tgtKey:null};
const SLOW_MS=2000;
function autoPin(){ return AP.on?AP.pinSel:null; }
function apSet(on,video){
  AP.on=on; AP.video=!!(on&&video); AP.key=null; AP.pinSel=null; AP.dir=AP.video?"wait":"off"; AP.dirT=0;
  const b=$("#apBtn"), v=$("#vmBtn");
  b.textContent=on&&!video?"⏸ 자동재생 중지":"▶ 자동재생"; b.classList.toggle("on",on&&!video);
  v.textContent=AP.video?"■ 영상 자동재생 중지":"🎬 영상 자동재생"; v.classList.toggle("on",AP.video);
  $("#vmCursor").style.display=AP.video?"block":"none";
  $("#autoStatus").classList.toggle("on",on);
}
function apStart(video){
  if(!S||!S.session||!S.session.active){ toast("먼저 과정과 모드를 선택해 시작하세요.","bad"); return; }
  if(isExam()){ toast("평가 모드에서는 자동재생을 쓸 수 없습니다.","bad"); return; }
  if(video){ SPD=2; $$("#spdGrp [data-s]").forEach(x=>x.classList.toggle("on",x.dataset.s==="2")); AP.cx=innerWidth/2; AP.cy=innerHeight/2; }
  apSet(true,video);
}
function apStop(){ apSet(false,false); }
function bindAuto(){
  $("#apBtn").onclick=()=>{ if(AP.on&&!AP.video) apStop(); else apStart(false); };
  $("#vmBtn").onclick=()=>{ if(AP.video) apStop(); else apStart(true); };
}
function firstVis(sel){
  if(!sel) return null;
  for(const s of String(sel).split(",")){ const t=s.trim(); if(!t) continue; let l=[]; try{ l=document.querySelectorAll(t); }catch(e){}
    for(const e of l){ const r=e.getBoundingClientRect(); if(r.width>1&&r.height>1&&getComputedStyle(e).visibility!=="hidden") return e; } }
  return null;
}
/* PLC(HMI) · 알람 대응 : 느리게 */
function isSlow(el){ return !!(el.closest&&el.closest("#hmi,#mNum,#mInc,#listBox,#hMenu"))||!!S.activeTrouble||el.id==="fixBtn"||el.id==="incAsk"; }
/* 영상 모드 연출 : 생산 중 이상사례 1건 → 알람 1건 */
function directorTarget(){
  if(!AP.video||!S.running||S.activeTrouble||S.flags.casePending) return null;
  const st=curStep(); if(!st||!st.watch) return null;
  const inList=$("#mList").classList.contains("on");
  if(AP.dir==="wait"&&S.cnt.good>=4) AP.dir="case";
  if(AP.dir==="case"){ if(!inList) return "#caseBtn"; return '#listBox [data-k="C_DIRT"]'; }
  if(AP.dir==="caseDone"&&S.cnt.good>=Math.round(S.cnt.target*0.45)) AP.dir="fault";
  if(AP.dir==="fault"){ if(!inList) return "#faultBtn"; return '#listBox [data-k="DM33"]'; }
  return null;
}
function apTick(now){
  if(AP.outro){ outroTick(now); return; }
  if(!AP.on) return;
  if(!S||!S.session||!S.session.active||S.session.ended){ apStop(); return; }
  if(AP.dir==="case"&&(S.flags.casePending||S.activeTrouble)) AP.dir="caseRun";
  if(AP.dir==="caseRun"&&!S.activeTrouble&&!S.flags.casePending) AP.dir="caseDone";
  if(AP.dir==="fault"&&S.activeTrouble) AP.dir="faultRun";
  const dirSel=directorTarget();
  const sel=dirSel||hintTarget();
  AP.pinSel=dirSel;
  const st=curStep();
  $("#autoStatus").textContent=(AP.video?"영상 자동재생 ››› ×":"자동재생 중 ››› ×")+SPD+" · STEP "+Math.min(S.tIdx+1,STEPS().length)+" / "+STEPS().length;
  if(!sel){ AP.key=null; return; }
  const el=firstVis(sel);
  if(!el){ AP.key=null; return; }
  /* 작업자가 이동 · 작업 중이면 현장 조작은 기다린다 */
  if(wkBusy()) { AP.key=null; return; }
  const key=S.tIdx+"|"+sel+"|"+(S.activeTrouble?S.activeTrouble.k:"");
  if(key!==AP.key){ AP.key=key; AP.at=now; }
  /* 숫자 입력 : 값을 먼저 채운 뒤 확인 */
  if(el.id==="numOk"){ const f=S.activeTrouble&&recoveryStep(); const v=f&&f.f&&f.f.num?f.f.num():null;
    if(v!=null&&numBuf!==String(v)){ numBuf=String(v); $("#numV").value=numBuf; } }
  const slow=isSlow(el);
  const dwell=slow?SLOW_MS:Math.max(280,900/Math.max(1,SPD));
  if(AP.video){ moveCursor(el,now); if(!AP.arrived) return; }
  if(now-AP.at<dwell) return;
  if(slow&&now-AP.lastAct<SLOW_MS) return;
  AP.lastAct=now; AP.key=null;
  if(AP.video) tap();
  el.click();
}
/* 영상 커서 */
function moveCursor(el,now){
  const r=el.getBoundingClientRect(), tx=r.left+r.width/2, ty=r.top+r.height/2;
  const k=String(Math.round(tx))+","+Math.round(ty);
  if(k!==AP.tgtKey){ AP.tgtKey=k; AP.fx=AP.cx; AP.fy=AP.cy; AP.t0=now; AP.dur=Math.max(260,Math.min(620,Math.hypot(tx-AP.cx,ty-AP.cy)*0.7)); AP.arrived=0; }
  const u=Math.min(1,(now-AP.t0)/AP.dur), e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
  AP.cx=AP.fx+(tx-AP.fx)*e; AP.cy=AP.fy+(ty-AP.fy)*e;
  if(u>=1) AP.arrived=1;
  const c=$("#vmCursor"); c.style.left=AP.cx+"px"; c.style.top=AP.cy+"px";
}
function tap(){
  const r=document.createElement("div"); r.className="vmRipple"; r.style.left=AP.cx+"px"; r.style.top=AP.cy+"px"; document.body.appendChild(r);
  setTimeout(()=>r.remove(),600); const c=$("#vmCursor"); c.classList.add("press"); setTimeout(()=>c.classList.remove("press"),160);
}

/* ═══ 영상 자동재생 마무리 : 라인 전체를 천천히 둘러보며 요약 카드 → 결과 ═══ */
const OUTRO_MS=9000;
function apOutro(){
  AP.outro={t0:performance.now(), y0:-0.75};
  $("#vmCursor").style.display="none";
  camSet("all"); cam.yawT=AP.outro.y0;
  const hist=(S.flags.vmLog||[]).map(k=>{ const i=(CASES[k]||INC[k]); return i?esc(i.nm):k; });
  const o=$("#vmOutro");
  o.innerHTML='<small>영상 자동재생 완료</small><h2>병충전 라인 IDT · '+esc(MODE_NM[S.mode])+'</h2>'+
    '<div class="row"><div><b>'+S.cnt.good+'</b>양품 (캡핑 완료)</div><div><b>'+S.cnt.reject+'</b>리젝트</div><div><b>'+(S.wc.nNet?fmt(S.wc.sumNet/S.wc.nNet,3):"-")+'</b>순중량 평균 (g)</div></div>'+
    '<p>'+esc(S.rc.label)+'</p>'+(hist.length?'<p class="h">대응한 상황 : '+hist.join(" → ")+'</p>':'')+
    '<p class="h">설정 → 가동 → 이상 대응 → 정지 까지 전 과정을 마쳤습니다.</p>';
  o.classList.add("on");
}
function outroTick(now){
  const O=AP.outro, u=Math.min(1,(now-O.t0)/OUTRO_MS);
  cam.yawT=O.y0+0.62*smooth(u);
  if(u>=1){ AP.outro=null; $("#vmOutro").classList.remove("on"); apStop(); showResult(false); }
}
