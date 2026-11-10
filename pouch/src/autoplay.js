/* ═══════════════════════════════════════════════════════════════════
   자동재생 — 힌트와 같은 대상(노란 화살표)을 실제로 눌러 진행
   · 설비 화면(HMI) 버튼 · 알람/이상사례 조치 : 누르기 전 화살표를 약 2초 (실제 시간)
   · 그 밖의 조작은 빠르게 (배속 반영)
   ═══════════════════════════════════════════════════════════════════ */
const AP={on:false, key:null, at:0, lastAct:0};
const SLOW_MS=2000;
function apSet(on){
  AP.on=on; AP.key=null;
  const b=$("#apBtn"); b.textContent=on?"⏸ 자동재생 중지":"▶ 자동재생"; b.classList.toggle("on",on);
  $("#autoStatus").classList.toggle("on",on);
}
function apStart(){
  if(!S||!S.session||!S.session.active){ toast("먼저 과정과 모드를 선택해 시작하세요.","bad"); return; }
  if(isExam()){ toast("평가 모드에서는 자동재생을 쓸 수 없습니다.","bad"); return; }
  apSet(true);
}
function apStop(){ apSet(false); }
function bindAuto(){ $("#apBtn").onclick=()=>{ if(AP.on) apStop(); else apStart(); }; }
function firstVis(sel){
  if(!sel) return null;
  for(const s of String(sel).split(",")){ const t=s.trim(); if(!t) continue; let l=[]; try{ l=document.querySelectorAll(t); }catch(e){}
    for(const e of l){ const r=e.getBoundingClientRect(); if(r.width>1&&r.height>1&&getComputedStyle(e).visibility!=="hidden"&&!e.disabled) return e; } }
  return null;
}
function isSlow(el){ return !!(el.closest&&el.closest("#hmi,#mInc,#hMenu,#ipcPanel"))||!!S.activeTrouble||el.id==="fixBtn"||el.id==="incAsk"; }
function apTick(now){
  if(!AP.on) return;
  if(!S||!S.session||!S.session.active||S.session.ended){ apStop(); return; }
  $("#autoStatus").textContent="자동재생 중 ››› ×"+SPD+" · STEP "+Math.min(S.tIdx+1,STEPS().length)+" / "+STEPS().length;
  const sel=hintTarget();
  if(!sel){ AP.key=null; return; }
  const el=firstVis(sel);
  if(!el){ AP.key=null; return; }
  if(wkBusy()&&!el.closest("#mCarry,#mInc")){ AP.key=null; return; }      /* 작업자가 이동 · 작업 중이면 기다린다 */
  const key=S.tIdx+"|"+sel+"|"+(S.activeTrouble?S.activeTrouble.k:"");
  if(key!==AP.key){ AP.key=key; AP.at=now; }
  const slow=isSlow(el);
  const dwell=slow?SLOW_MS:Math.max(280,900/Math.max(1,SPD));
  if(now-AP.at<dwell) return;
  if(slow&&now-AP.lastAct<SLOW_MS) return;
  AP.lastAct=now; AP.key=null;
  el.click();
}
