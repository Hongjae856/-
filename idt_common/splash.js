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
  idtSpGuide(M,R,noRoom,inc);
}
/* 처음 사용자 안내 (11/24 · 항상 표시) : ★ 추천(자유모드 · 충전실 작업자) · 지금 고를 단계로 옮겨 가는 말풍선 · ③ 시작 카드 3단계 안내 */
const IDT_SPG={tip:null};
function idtSpRecMode(){ return document.querySelector("#splash .go button[data-m=\"free\"]")||document.getElementById("spFree"); }
function idtSpRecRoom(){ return document.querySelector("#coursePicker button.main[data-r=\"F\"]"); }
function idtSpGuide(M,R,noRoom,inc){
  const go=document.getElementById("msStart"), fm=idtSpRecMode(), fr=idtSpRecRoom(); if(!go) return;
  for(const b of [fm,fr]) if(b&&!b.querySelector(".msRec")){ const s=document.createElement("span"); s.className="msRec"; s.textContent="★ 추천"; b.appendChild(s); }
  let g=document.getElementById("msGuide"); if(!g){ g=document.createElement("div"); g.id="msGuide"; const sum=document.getElementById("msSum"); if(sum) sum.before(g); }
  const e=s=>String(s||"").replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
  const ready=!!(M&&(noRoom||R)), step=!M?1:(ready?3:2);
  const lab=[M?(M.dataset.nm||"교육 과정"):"자유모드", noRoom?"작업자 선택 없음":(R?(R.dataset.nm||"작업자"):"충전실 작업자"), go.textContent];
  g.className=ready?"ready":"";
  g.innerHTML='<h4>'+(ready?(noRoom?'준비 완료 — ['+e(go.textContent)+'] 을 누르세요':inc?'준비 완료 — ['+e(go.textContent)+'] 를 눌러 사례를 고르세요':'준비 완료 — [교육 시작] 을 누르면 1인칭으로 시작합니다'):'처음이라면 이렇게 시작하세요')+'</h4>'+
    '<div class="gs">'+lab.map((t,i)=>'<span class="'+(i+1<step||(i===1&&noRoom&&M)?'ok':(i+1===step?'on':''))+'">'+(i+1<step?'✓':(i+1))+' '+e(t)+'</span>').join('<i>›</i>')+'</div>'+
    '<div class="gk"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 걷기 · 마우스 둘러보기 · <kbd>E</kbd> 조작</div>';
  go.classList.toggle("msGlow",ready);
  let t=IDT_SPG.tip; if(!t){ t=IDT_SPG.tip=document.createElement("div"); t.className="msGTip"; } t.remove();
  if(step===1&&fm){ t.className="msGTip onBtn"; t.innerHTML='처음이라면 자유롭게 둘러보세요<small>순서 · 채점 없음</small>'; fm.appendChild(t); }
  else if(step===2){ const h=fr&&fr.closest(".msCard")&&fr.closest(".msCard").querySelector(".msH"); if(h){ t.className="msGTip onTtl"; t.innerHTML=(M===fm?'충전실부터 둘러보세요':'처음이라면 충전실부터')+' ↓'; h.appendChild(t); } }
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
/* 화면 전체 사용 (11/24) : 기준 화면(폭 1240 · 내용 본래 높이)에 대한 배율 --u 를 화면 폭 · 높이 중 작은 쪽으로 정함 → 글자 · 버튼이 함께 커지고
   남는 높이는 과정 버튼 · 작업자 카드가 채움. 파우치는 앱 전체 배율 안의 크기(clientWidth)로 계산되므로 따로 할 일 없음. */
const IDT_SPFIT={W:1240, Wn:760, min:.72, max:2.4, raf:0, mo:null};
function idtSpFit(){
  IDT_SPFIT.raf=0; const sp=document.getElementById("splash"), box=sp&&sp.querySelector(".box.msx"); if(!box) return;
  const W=sp.clientWidth, H=sp.clientHeight; if(W<50||H<50) return;
  const narrow=W<900; sp.classList.toggle("msNarrow",narrow);
  sp.style.setProperty("--u","1px"); sp.classList.add("msMeasure"); const need=Math.max(1,box.scrollHeight);
  let u=narrow?W/IDT_SPFIT.Wn:Math.min(W/IDT_SPFIT.W,H/need);
  if(!narrow){ sp.style.setProperty("--u",u.toFixed(4)+"px"); const n2=box.scrollHeight; if(n2>H) u*=H/n2*.995; }   /* 배율에 따라 변하지 않는 테두리 · 줄바꿈 보정 */
  sp.classList.remove("msMeasure"); u=Math.max(IDT_SPFIT.min,Math.min(IDT_SPFIT.max,u));
  sp.style.setProperty("--u",u.toFixed(4)+"px"); sp.style.setProperty("--spH",H+"px");
  if(IDT_SPFIT.mo) IDT_SPFIT.mo.takeRecords();                    /* 재기 위해 바꾼 class 는 다시 부르지 않음 */
}
function idtSpFitSoon(){ if(!IDT_SPFIT.raf) IDT_SPFIT.raf=requestAnimationFrame(idtSpFit); }
(function spBoot(){ const go=document.getElementById("msStart"); if(!go){ return setTimeout(spBoot,200); }
  go.onclick=idtSpStart; idtSpSync();
  const sp=document.getElementById("splash"); idtSpFit(); addEventListener("resize",idtSpFitSoon);
  if(typeof ResizeObserver!=="undefined") new ResizeObserver(idtSpFitSoon).observe(sp);
  (IDT_SPFIT.mo=new MutationObserver(ms=>{ if(ms.some(m=>m.target!==sp||m.attributeName==="class")) idtSpFitSoon(); }))
    .observe(sp,{subtree:true,childList:true,attributes:true,attributeFilter:["style","class"]});
  try{ if(typeof CHANGELOG!=="undefined"&&CHANGELOG[0]){ const b=document.getElementById("verBadge"); if(b&&/^V?$/.test(b.textContent.trim())) b.textContent="V"+CHANGELOG[0].v; } }catch(e){}
  { const b=document.getElementById("verBadge"); if(b&&!b.onclick){ b.title="버전 이력"; b.onclick=()=>typeof openVersions==="function"?openVersions():idtVerOpen(); } }
})();
/* 버전 이력 창 (11/24) — 파우치는 자체 창(openVersions), 없는 IDT(PTP · 병)는 이 공통 창 : 수정 요청 1건마다 버전 +1 */
function idtVerOpen(){
  if(typeof CHANGELOG==="undefined"||!CHANGELOG.length) return; const e=s=>String(s==null?"":s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
  let w=document.getElementById("idtVer"); if(!w){ w=document.createElement("div"); w.id="idtVer"; document.body.appendChild(w);
    w.addEventListener("click",ev=>{ if(ev.target===w||ev.target.id==="idtVerX") w.classList.remove("on"); });
    document.addEventListener("keydown",ev=>{ if(ev.key==="Escape"&&w.classList.contains("on")){ w.classList.remove("on"); ev.stopPropagation(); } },true); }
  w.innerHTML='<div class="ivBox" role="dialog" aria-label="버전 이력"><h2>버전 이력 <small>현재 V'+e(CHANGELOG[0].v)+'</small></h2><p>수정 요청 1건마다 버전이 1씩 올라갑니다.</p>'+
    '<div class="ivList"><table><tr><th>버전</th><th>날짜</th><th>수정 내용</th></tr>'+CHANGELOG.map(r=>'<tr><td>V'+e(r.v)+'</td><td>'+e(r.d)+'</td><td>'+e(r.t)+'</td></tr>').join("")+'</table></div>'+
    '<div class="ivBtn"><button id="idtVerX">닫기</button></div></div>';
  w.classList.add("on");
}
