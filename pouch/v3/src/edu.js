/* ═══════════════════════════════════════════════════════════════════
   메인 메뉴 (과정 → 기본 · 심화 · OEE) + 이상사례 대처 교육
   · 기본 · 심화 = 라인 가동 절차만 (예약 이상상황 · 이상사례/알람 발생 버튼 없음)
   · OEE = [OEE 관리 대시보드] + [이상사례 대처 교육]
   · 이상사례 대처 교육 : 정상 운전 중 상황 1건을 발생시켜 정지 → 원인 판단 → 조치 → 해제 → 재가동을 학습 · 평가
     우선순위 = 0.4 × 부동시간(정규화) + 0.3 × 발생 빈도(정규화) + 0.3 × 중요도 등급 (OEE 데이터가 없으면 등급만)
   ═══════════════════════════════════════════════════════════════════ */
/* 중요도 등급 (11/16 사용자 확정) : 상 = 품질(함량 · 표시 · 첨부문서 · 검사) 또는 안전 직접 영향, 중 = 품질 영향 가능 · 점검 필요, 하 = 설비 정지 위주 */
/* 중요도 등급 (11/16 실제 부동사유 기반 사례 · 사용자 확정) : 상 = 품질(함량 · 표시 · 첨부문서 · 포장 상태)에 직접 영향, 중 = 품질 영향 가능 · 생산 손실, 하 = 설비 정지 위주 */
const INC_GRADE={RF1:"중",RF2:"중",RF3:"하",RF4:"상",RP1:"중",RP2:"중",RP3:"하",RP4:"중",RP5:"중",RP6:"상",RP7:"중",RP8:"상"};   /* 11/16 사용자 확정 (선다 응답) */
const INC_GRADE_W={상:1,중:.6,하:.3};
const INC_GRADE_WHY={상:"품질(함량 · 표시 · 첨부문서 · 포장 상태)에 직접 영향",중:"품질 영향 가능 · 생산 손실",하:"설비 정지 위주 · 품질 영향 낮음"};
const isInc=()=>!!S&&(S.mode==="incLearn"||S.mode==="incExam");
const EDU={view:"menu", k:null};

/* 실별 대응 목록 + 우선순위 */
function incKeys(room){ return RC_KEYS[room]||[]; }   /* 11/16 : 실제 부동사유 기반 사례만 (cases.js) */
function incRank(room){
  const st=(typeof OEEEDU!=="undefined"&&OEEEDU.codeStats)?OEEEDU.codeStats():null, has=!!(st&&Object.keys(st).length);
  const L=incKeys(room).map(k=>{ const s=has&&st[k]||{down:0,n:0}; return {k, inc:incOf(k), g:INC_GRADE[k]||"중", down:s.down, n:s.n}; });
  const mD=Math.max(1e-9,...L.map(o=>o.down)), mN=Math.max(1e-9,...L.map(o=>o.n));
  for(const o of L) o.score=has?.4*(o.down/mD)+.3*(o.n/mN)+.3*INC_GRADE_W[o.g]:INC_GRADE_W[o.g];
  L.sort((a,b)=>b.score-a.score||b.down-a.down||(CASES[b.k]?1:0)-(CASES[a.k]?1:0));
  return {list:L, has};
}
function incDone(k){ const log=(typeof OEEEDU!=="undefined"&&OEEEDU.getLog)?OEEEDU.getLog():[]; return log.filter(l=>l.k===k); }

/* ── 메인 화면 ── */
function eduShow(v){ EDU.view=v; const go=$("#splash .go"), ip=$("#incPick");
  go.style.display=v==="menu"?"grid":"none"; ip.style.display=v==="inc"?"block":"none"; if(v==="inc") renderIncPick(); }
function renderIncPick(){   /* 공통 목록 (idt_common/incpick.js) */
  const r=PICK_ROOM;
  idtIncPick($("#incPick"),{room:ROOM_NM[r], items:incKeys(r).map(k=>{ const inc=incOf(k); return {k, nm:inc.nm, src:inc.src, g:INC_GRADE[k]||"중"}; }),
    onStart:(k,m)=>incStart(k,m==="exam"?"incExam":"incLearn"), onBack:()=>eduShow("menu")});
}

/* ── 세션 ── */
function stepsInc(){
  const k=S.flags.incK||EDU.k, inc=incOf(k);
  return [T_("inc","이상 상황 대응 — "+inc.nm,"라인이 정상 운전 중입니다. 곧 이상 상황이 발생합니다. 정지 → 원인 판단 → 조치 → 알람 해제 → 재가동 순서로 대응합니다.",
    ()=>null, ()=>!!S.flags.incAt&&S.flags.resolvedAt!=null&&!S.activeTrouble&&!S.flags.casePending&&!S.ipc.open, {pts:100})];
}
function incStart(k,mode){
  const inc=incOf(k), room=inc.room||PICK_ROOM;
  $("#splash").classList.add("hide"); EDU.k=k;
  startSession(mode,room);
  S.flags.incK=k; S.flags.incAt=null; S.flags.incT0=performance.now(); STEPS_CACHE=null;
  presetPackAuto(); presetFillAuto(); S.p.align=true; if(typeof CV!=="undefined"&&CV.full) CV.full.fill(1); if(typeof PA!=="undefined") PA.live=false;   /* 이상사례 : 정상 운전 중인 라인(제품 흐름 있음)에서 시작 */     /* 순서 주의 : presetPackAuto 가 호퍼(주성분)를 0 으로 둠 → presetFillAuto 로 다시 채움 */
  S.f.run=true; S.f.started=true; if(room==="P"){ S.p.ctRun=true; S.p.sfRun=true; }
  buildStatic(); renderTiles(); drawHMI(); renderCoach();
  toast(ROOM_NM[room]+" · "+MODE_NM[mode]+" — "+inc.nm+" (잠시 뒤 발생)");
}
/* 시작 3 초 뒤 상황 발생 · 대응 시간 기록 */
function eduTick(){
  if(!isInc()||!S.session||!S.session.active) return;
  const F=S.flags;
  if(!F.incAt&&performance.now()-F.incT0>3000){
    if(!lineRunning()){ if(S.room==="F") S.f.run=true; else S.p.ctRun=true; }
    if(lineRunning()){ launchIncident(F.incK); F.incAt=performance.now(); F.incSim=tSim; }
  }
  if(F.incAt&&S.activeTrouble&&!F.incSeen) F.incSeen=performance.now();
}
function showIncResult(manual){
  const F=S.flags, inc=incOf(F.incK), ex=S.mode==="incExam", sc=scoreNow(), ok=F.resolvedAt!=null&&!manual;
  const sec=F.incAt?(performance.now()-F.incAt)/1000:null;
  if(F.incAt&&typeof OEEEDU!=="undefined"&&OEEEDU.logPractice) OEEEDU.logPractice({k:F.incK, mode:S.mode, ok, score:ex?sc.score:null, sec:sec==null?null:Math.round(sec), wrong:S.deducts.filter(d=>d.k==="wrong").length, hint:S.hintUsed||0});
  idtIncResult({room:ROOM_NM[S.room], nm:inc.nm, grade:INC_GRADE[F.incK], ok, sec, wrong:S.deducts.filter(d=>d.k==="wrong").length, hint:S.hintUsed||0, exam:ex, score:sc.score,
    ded:S.deducts.map(d=>[d.why,d.pts]), answer:inc.a, again:()=>incStart(F.incK,S.mode), list:()=>{ goHome(); $("#choose"+S.room).click(); eduShow("inc"); }, home:goHome});   /* 공통 결과 창 */
}
/* 현장 조치 단계 : 조치 위치(빨간 !)가 화면 밖이면 3인칭 카메라를 그 위치로 옮김 (포장실에서 충전기 알람 · 2층 데크 다이얼 등) */
function fixFocus(){
  if(!S||!S.session||!S.session.active||!S.activeTrouble||cam.fp||!R3.gl){ EDU.fk=null; return; }
  const h=recoveryStep(); if(!h||h.k!=="fix"||!h.f.fix){ EDU.fk=null; return; }
  const key=S.activeTrouble.k+"|"+S.recovery.fixI; if(EDU.fk===key) return; EDU.fk=key;
  const p=prj(...h.f.fix), W=R3.W, H=R3.H; if(p&&p.x>W*.12&&p.x<W*.88&&p.y>H*.12&&p.y<H*.88) return;
  cam.view="work"; cam.txT=h.f.fix[0]; cam.tyT=h.f.fix[1]; cam.tzT=h.f.fix[2]; cam.distT=Math.min(Math.max(cam.dist,3),4.5);
}
function eduInit(){
  $("#spOee").onclick=()=>{ if(typeof OEEEDU!=="undefined") OEEEDU.open(); };
  $("#spInc").onclick=()=>eduShow("inc");
  $("#courseBack").addEventListener("click",()=>{ $("#incPick").style.display="none"; });
  setInterval(()=>{ eduTick(); fixFocus(); },200);
}
{ const g=goHome; goHome=function(){ idtResClose(); return g.apply(this,arguments); }; }   /* 메인화면 : 결과 창 닫기 */
/* 학습 · 평가 결과 : 공통 결과 창 (idt_common/modes.js · 세 IDT 같은 모양) — 원본 ui.js showResult 를 대신함 */
showResult=function(manual){
  const ex=isExam(), sc=scoreNow(), A=STEPS();
  const kp=S.room==="F"?[[S.cnt.pouch.toLocaleString()+" 포","생산카운터","hi"],[S.cnt.empty.toLocaleString()+" 포","공포 · 불량 배출","ng"],[S.cnt.good+" 카톤","양품 카톤"],[S.ipc.done+" 회","IPC 완료"]]
                       :[[S.cnt.good+" 카톤","양품 카톤","hi"],[(S.cnt.rejVs+S.cnt.rejXr+S.cnt.rejCw)+" 개","불량 배출","ng"],[S.cwN?fmt(S.cwSum/S.cwN,2)+" g":"-","중량 평균"],[S.cnt.cases+" 개","대케이스"]];
  const ipc=(S.ipc.log||[]).map(x=>[x.round||"추가",IPC_STD[x.k].nm,fmt(x.avg,3)+" g",x.pass?"적합":"부적합"]);
  idtResOpen({icon:ex?"📝":"📘", head:ex?"평가 결과":"학습 결과", sub:ROOM_NM[S.room]+" · "+MODE_NM[S.mode],
    meta:PROD.nm+" · 소요 "+mmss(S.session.sec)+" · 진행 "+Math.min(S.tIdx,A.length)+" / "+A.length+" 단계 · 힌트 "+S.hintUsed+"회"+(manual?" (중도 종료)":""),
    score:ex?{v:sc.score, pass:sc.score>=PASS, th:PASS, base:sc.base, minus:sc.minus}:null, kpis:kp,
    secs:[{h:"단계별 수행",th:["No","단계","배점","결과"],l:[1],rows:A.map((st,i)=>{ const l=S.stepLog.find(x=>x.i===i); return [i+1,st.t,st.pts||0,l?"완료 · "+mmss(l.at):"미완료"]; })},
          {h:"알람 · 이상사례 대응",th:["구분","명칭","발생"],l:[1],rows:(S.flags.incLog||[]).map(x=>[x.kind,x.nm,mmss(x.at)])}]
      .concat(ipc.length?[{h:"정기 공정검사 (IPC)",th:["회차","대상","평균","판정"],rows:ipc}]:[],
              [{h:"감점 내역",th:["항목","감점","시각"],l:[0],rows:S.deducts.map(d=>[d.why,"−"+d.pts,mmss(d.at)]),empty:"감점 없음"}]),
    btns:[["다시 하기",()=>startSession(S.mode,S.room),true],["메인화면",goHome],["닫기",null]]});
};
