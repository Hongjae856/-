/* ═══════════════════════════════════════════════════════════════════
   작업자 선택 · 교체 (11/17 사용자 지시)
   메인화면 : ① 모드 선택 → ② 상단 작업자(충전실 · 포장실) 선택 → 그 작업장 작업자 1인칭으로 시작 · 그 실의 단계 적용
   교육 중 : 상단 [🧍 충전실 작업자] [🧍 포장실 작업자] 로 작업자 교체 (모든 모드 · 사용자 선택)
     · 기본 · 심화 · 시연 : 작업자(실)마다 따로 진행 — 지금 실의 진행 상태(S · LN · 시뮬레이션 시간 · 1인칭 위치)를 보관하고
       다른 실은 이어서(처음이면 새로) 시작. 각 실 과정은 다른 실 설비가 자동 운전 중인 것으로 설계되어 있어 실마다 따로 둠
     · 자유 · 이상사례 대처 : 한 라인을 함께 씀 — 작업자(조작 대상 · 1인칭 위치)만 바뀜
   ═══════════════════════════════════════════════════════════════════ */
const CREW={mode:null, room:null, sess:{}, pose:{}};
const CREW_SHARED=m=>m==="free"||m==="incLearn"||m==="incExam";
const CREW_MODES={spEasy:"easy", spExamEasy:"examEasy", spGuide:"guide", spExam:"exam", spDemo:"demo", spFree:"free", spInc:"inc"};
const CREW_RNM={F:"충전실 작업자",P:"포장실 작업자"};
const CREW_MNM={easy:"기본 · 학습", examEasy:"기본 · 평가", guide:"심화 · 학습", exam:"심화 · 평가", demo:"시연모드", free:"자유모드", inc:"이상사례 대처 교육"};

/* ── 메인화면 ── */
function crewInit(){
  const go=$("#splash .go"), cp=$("#coursePicker");
  cp.insertAdjacentHTML("beforebegin",'<div id="crewHint"></div>');
  $("#chooseF").innerHTML='<small>작업자 1 · FILLING ROOM</small><strong>🧍 충전실 작업자</strong><span>파우치 충전기 SP303 · 2층 데크 · IPC</span>';
  $("#chooseP").innerHTML='<small>작업자 2 · PACKING ROOM</small><strong>🧍 포장실 작업자</strong><span>스틱공급장치 · 카토너 · 프린터 · 비전 · X-ray · 중량선별기</span>';
  { const d=$("#spDemo small"); if(d) d.textContent="작업자별 장비 ON → 가동 → 생산까지 간단히"; }
  go.insertAdjacentHTML("beforeend",'<div class="modeColumn free"><h4>자유</h4><button class="fr" id="spFree">자유모드<small>순서 · 감점 · 평가 없음 · 기동 조건 해제 · 문 · 덮개 자유 개폐</small></button></div>');
  const oee=go.querySelector(".modeColumn.oee"); if(oee) go.appendChild(oee);                 /* 순서 : 기본 · 심화 · 시연 · 자유 · OEE */
  for(const [id,m] of Object.entries(CREW_MODES)){ const b=$("#"+id); if(b) b.onclick=()=>crewPickMode(m); }
  $("#chooseF").onclick=()=>crewPickRoom("F"); $("#chooseP").onclick=()=>crewPickRoom("P");
  $("#roomTag").insertAdjacentHTML("afterend",'<div class="pill crewSw" id="crewSw" title="작업자 교체"><button data-r="F">🧍 충전실 작업자</button><button data-r="P">🧍 포장실 작업자</button></div>');
  $$("#crewSw [data-r]").forEach(b=>b.onclick=()=>crewSwitch(b.dataset.r));
  crewSplash();
}
function crewSplash(){
  CREW.mode=null; CREW.room=null;
  $("#coursePicker").style.display=""; $("#splash .go").style.display="grid"; $("#courseBack").style.display="none";
  const ip=$("#incPick"); if(ip) ip.style.display="none";
  crewMark();
}
function crewMark(){
  $$("#splash .go button").forEach(b=>b.classList.toggle("sel",CREW_MODES[b.id]===CREW.mode&&!!CREW.mode));
  for(const r of ["F","P"]){ const b=$("#choose"+r); b.classList.toggle("sel",CREW.room===r); b.classList.toggle("wait",!CREW.mode); }
  $("#crewHint").innerHTML=CREW.mode?'<b>② 작업자 선택</b> — 위의 충전실 · 포장실 작업자를 누르면 그 작업장 1인칭으로 시작합니다 <s>모드 : '+esc(CREW_MNM[CREW.mode])+'</s>'
    :'<b>① 모드 선택</b> — 아래에서 모드를 고른 뒤 <b>② 작업자</b>를 누르면 그 작업장 작업자 1인칭으로 시작합니다';
}
function crewPickMode(m){ CREW.mode=m; crewMark(); if(CREW.room) crewGo(); }
function crewPickRoom(r){ PICK_ROOM=r; CREW.room=r; crewMark(); if(CREW.mode) crewGo(); }
function crewGo(){
  const m=CREW.mode, r=CREW.room; PICK_ROOM=r; CREW.sess={}; CREW.pose={}; FP.want=true;   /* 작업자 선택 = 그 작업자 1인칭으로 시작 */
  if(m==="inc"){ eduShow("inc"); return; }                                                     /* 이상사례 : 작업자 → 그 실의 사례 목록 */
  if(m==="demo"){ demoStart(r); return; }
  if(m==="free"){ freeStart(r); return; }
  $("#splash").classList.add("hide"); startSession(m,r); toast(CREW_RNM[r]+" · "+MODE_NM[m]+" 시작");
}
{ const g0=goHome; goHome=function(){ g0(); CREW.sess={}; CREW.pose={}; crewSplash(); crewHead(); }; }
{ const s0=startSession; startSession=function(m,r){ s0(m,r); if(!CREW_SHARED(m)) CREW.pose={}; crewHead(); }; }

/* ── 교육 중 작업자 교체 ── */
function crewHead(){
  const w=$("#crewSw"); if(!w) return; const on=!!(S&&S.session);
  w.style.display=on?"":"none";
  $$("#crewSw [data-r]").forEach(b=>{ b.classList.toggle("on",!!S&&b.dataset.r===S.room); b.title=S&&b.dataset.r===S.room?"지금 작업자":(CREW_SHARED(S&&S.mode)?"같은 라인에서 이 작업자로 교체":"이 작업자로 교체 (실마다 진행 상태를 따로 보관)"); });
}
const lnSnap=()=>JSON.parse(JSON.stringify(LN));
function lnLoad(o){ for(const k of Object.keys(LN)) delete LN[k]; Object.assign(LN,JSON.parse(JSON.stringify(o))); }
function crewSwitch(r){
  if(!S||!S.session||r===S.room) return;                                                       /* 과정을 마친 뒤(결과 화면)에도 다른 작업자로 갈 수 있음 */
  if(!cam.fp&&WK.some(w=>w.job)){ toast("작업자가 작업 중입니다. 작업이 끝난 뒤 바꾸세요.","bad"); return; }
  if(typeof apStop==="function"&&typeof AP!=="undefined"&&AP.on) apStop();
  for(const id of ["#mInc","#mList","#mCarry","#mNum","#mEnd","#mRub"]){ const e=$(id); if(e) e.classList.remove("on"); }
  if(isInc()&&!S.flags.incAt&&S.session.active){ toast("이상 상황이 발생한 뒤 작업자를 바꿀 수 있습니다.","bad"); return; }
  if(typeof DIAL!=="undefined"&&DIAL.open&&typeof dialClose==="function") dialClose();
  const fpOn=FP.on, from=S.room, wasEnded=!!S.session.ended;
  if(fpOn){ FP.mod.stop(); cam.fp=null; FP.on=false; fpMoveHMI(false); }
  if(CREW_SHARED(S.mode)){
    CREW.pose[from]=FP_LAST&&FP_LAST.sess===S.session?FP_LAST:null;
    S.room=r; STEPS_CACHE=null; hMach=r==="F"?"fl":"sf"; hScr=hMach==="fl"?"run":"main";
    FP_LAST=CREW.pose[r]||null; crewRefresh(fpOn);
  }else{
    CREW.sess[from]={S, LN:lnSnap(), tSim, STEPS_CACHE, hMach, hScr, hintOn, fp:FP_LAST&&FP_LAST.sess===S.session?FP_LAST:null, away:performance.now()};
    const sv=CREW.sess[r]; delete CREW.sess[r];
    if(sv){ S=sv.S; lnLoad(sv.LN); tSim=sv.tSim; STEPS_CACHE=sv.STEPS_CACHE; hMach=sv.hMach; hScr=sv.hScr; hintOn=sv.hintOn; FP_LAST=sv.fp;
      S.session.start+=performance.now()-sv.away; S.session.active=!S.session.ended; crewRefresh(fpOn&&!S.session.ended); }
    else { FP_LAST=null; const m=S.mode; FP.want=fpOn||wasEnded; startSession(m,r); if(m==="demo"&&!fpOn) camSet(r==="F"?"fill":"pack"); }
  }
  crewHead();
  toast(CREW_RNM[r]+"로 교체"+(CREW_SHARED(S.mode)?"":" — "+(S.tIdx?"이어서 진행 (STEP "+(S.tIdx+1)+")":"이 작업장 단계 시작")),"good");
}
function crewRefresh(fpOn){
  if(typeof buildTiles==="function") buildTiles();
  buildStatic(); drawHMI(); renderCoach(); renderTiles();
  if(fpOn) fpSet(true); else camSet(S.room==="F"?"fill":"pack");
}
