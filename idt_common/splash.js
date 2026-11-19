/* ═══ 메인화면 공통 동작 (세 IDT · 11/19 · 파우치 crewMark 를 옮김) — 마크업 idt_common/splash.py · 모양 idt_common/splash.css
   idtSplashMark({mode, modeNm, room, isSel:btn=>bool}) : 고른 모드 · 작업자 표시 + 안내 문구 (① 모드 선택 → ② 작업자)
   idtSplashVer(text) : 오른쪽 아래 버전 ═══ */
function idtSplashMark(o){
  document.querySelectorAll("#splash .go button").forEach(b=>b.classList.toggle("sel",!!o.mode&&!!o.isSel(b)));
  document.querySelectorAll("#coursePicker button.main").forEach(b=>{ b.classList.toggle("sel",!!o.room&&o.room===b.dataset.r); b.classList.toggle("wait",!o.mode); });
  const h=document.getElementById("crewHint"), e=s=>String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
  if(h) h.innerHTML=o.mode?'<b>② 작업자 선택</b> — 위의 작업자를 누르면 그 작업장 1인칭으로 시작합니다 <s>모드 : '+e(o.modeNm||"")+'</s>'
    :'<b>① 모드 선택</b> — 아래에서 모드를 고른 뒤 <b>② 작업자</b>를 누르면 그 작업장 작업자 1인칭으로 시작합니다';
}
function idtSplashVer(t){ const b=document.getElementById("verBadge"); if(b) b.textContent=t; }
