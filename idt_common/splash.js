/* ═══ 메인화면 공통 동작 (세 IDT · 11/20 시안 확정 : ① 교육 과정 → ② 작업자 → ③ [교육 시작]) — 마크업 idt_common/splash.py · 모양 idt_common/splash.css
   · 사람이 누른 과정 · 작업자 버튼은 "선택"만 하고(기존 IDT 처리기에 넘기지 않음), [교육 시작] 을 누르면 고른 과정 → 작업자 순서로
     IDT 의 기존 처리기를 그대로 실행 (각 IDT 의 시작 흐름 · 시험 스크립트의 .click() 은 그대로 동작)
   · OEE 관리 대시보드는 작업자 없이 [대시보드 열기], 이상사례 대처 교육은 작업자를 고르면 [사례 목록 보기]
   · 말풍선 : 마우스를 올리면(CSS) · 길게 누르면(0.45 초 · 터치 화면) 표시 — 길게 누른 뒤의 클릭은 선택하지 않음
   idtSplashMark({mode, modeNm, room, isSel:btn=>bool}) : IDT 상태로 선택 표시 맞춤 (메인화면 복귀 때 선택 지움)
   idtSplashVer(text) : 오른쪽 위 버전 ═══ */
const IDT_SP={mode:null, room:null, pass:false, lp:null, lpT:0, swallow:false};
const _spModes=()=>Array.from(document.querySelectorAll("#splash .go button"));
const _spRooms=()=>Array.from(document.querySelectorAll("#coursePicker button.main"));
const _spNoRoom=b=>!!b&&(b.id==="spOee"||b.dataset.m==="oee");
function idtSpSync(){
  const M=IDT_SP.mode, R=IDT_SP.room;
  _spModes().forEach(b=>b.classList.toggle("sel",b===M));
  _spRooms().forEach(b=>{ b.classList.toggle("sel",b===R); b.classList.toggle("wait",!M); });
  const sum=document.getElementById("msSum"), go=document.getElementById("msStart"); if(!sum||!go) return;
  const e=s=>String(s||"").replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
  const rx=document.querySelector("#rxSel button.on"), noRoom=_spNoRoom(M), inc=!!M&&(M.dataset.m==="inc"||M.id==="spInc");
  if(R&&R.disabled){ IDT_SP.room=null; return idtSpSync(); }
  sum.innerHTML=!M?(R?'<s>교육 과정을 고르세요</s> › '+e(R.dataset.nm):'<s>교육 과정과 작업자를 고르세요</s>')
    :noRoom?'<b>'+e(M.dataset.nm)+'</b> <s>· 작업자 선택 없이 엽니다</s>'
    :'<b>'+e(M.dataset.nm)+'</b> › '+(R?e(R.dataset.nm)+(inc?'':' <s>(1인칭)</s>')+(rx&&R.dataset.r!=="F"?' <s>· '+e(rx.firstChild.textContent)+'</s>':''):'<s>작업자를 고르세요</s>');
  go.disabled=!(M&&(noRoom||R));
  go.textContent=noRoom?"대시보드 열기":inc?"사례 목록 보기":"교육 시작";
}
function idtSplashMark(o){
  if(o.mode||o.room){ IDT_SP.mode=o.mode?(_spModes().find(b=>o.isSel(b))||null):IDT_SP.mode; IDT_SP.room=o.room?(_spRooms().find(b=>b.dataset.r===o.room)||null):IDT_SP.room; }
  else if(IDT_SP.started){ IDT_SP.started=false; IDT_SP.mode=null; IDT_SP.room=null; }     /* 교육을 마치고 메인화면으로 오면 선택 지움 (품목 전환 등 화면 안 갱신은 유지) */
  idtSpSync();
}
function idtSplashVer(t){ const b=document.getElementById("verBadge"); if(b) b.textContent=t; }
/* 사람이 누른 클릭만 가로챔 (스크립트의 .click() · [교육 시작] 재실행은 통과) */
document.addEventListener("click",ev=>{
  if(IDT_SP.pass||!ev.isTrusted) return; const sp=document.getElementById("splash"); if(!sp||sp.classList.contains("hide")) return;
  const t=ev.target&&ev.target.closest?ev.target:null; if(!t) return;
  const m=t.closest("#splash .go button"), r=t.closest("#coursePicker button.main");
  if(IDT_SP.swallow&&(m||r)){ IDT_SP.swallow=false; ev.stopImmediatePropagation(); ev.preventDefault(); return; }
  if(m){ ev.stopImmediatePropagation(); ev.preventDefault(); if(m.disabled) return; IDT_SP.mode=IDT_SP.mode===m?null:m; idtSpSync(); return; }
  if(r){ ev.stopImmediatePropagation(); ev.preventDefault(); if(r.disabled) return; IDT_SP.room=IDT_SP.room===r?null:r; idtSpSync(); return; }
  if(t.closest("#rxSel button")) setTimeout(idtSpSync,0);
},true);
function idtSpStart(){
  const M=IDT_SP.mode, R=IDT_SP.room; if(!M) return; const noRoom=_spNoRoom(M); if(!noRoom&&!R) return;
  IDT_SP.pass=true; IDT_SP.started=true; try{ M.click(); if(!noRoom&&R&&!document.getElementById("splash").classList.contains("hide")) R.click(); } finally{ IDT_SP.pass=false; }
}
/* 길게 누르기 → 말풍선 */
document.addEventListener("pointerdown",ev=>{
  document.querySelectorAll("#splash .tipOn").forEach(b=>b.classList.remove("tipOn")); clearTimeout(IDT_SP.lpT); IDT_SP.swallow=false;
  const b=ev.target&&ev.target.closest&&ev.target.closest("#splash button"); if(!b||!b.querySelector(".tipB")) return;
  IDT_SP.lpT=setTimeout(()=>{ b.classList.add("tipOn"); IDT_SP.swallow=true; },450);
},true);
for(const k of ["pointerup","pointercancel","pointerleave"]) document.addEventListener(k,()=>clearTimeout(IDT_SP.lpT),true);
(function spBoot(){ const go=document.getElementById("msStart"); if(!go){ return setTimeout(spBoot,200); }
  go.onclick=idtSpStart; idtSpSync();
  try{ if(typeof CHANGELOG!=="undefined"&&CHANGELOG[0]){ const b=document.getElementById("verBadge"); if(b&&/^V?$/.test(b.textContent.trim())) b.textContent="V"+CHANGELOG[0].v; } }catch(e){}
})();
