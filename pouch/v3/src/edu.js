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
  const F=S.flags, inc=incOf(F.incK), ex=S.mode==="incExam", sc=scoreNow(), pass=sc.score>=PASS, ok=F.resolvedAt!=null&&!manual;
  const sec=F.incAt?(performance.now()-F.incAt)/1000:null;
  const ded=S.deducts.map(d=>'<tr><td class="l">'+esc(d.why)+'</td><td>−'+d.pts+'</td></tr>').join("")||'<tr><td colspan="2">감점 없음</td></tr>';
  if(F.incAt&&typeof OEEEDU!=="undefined"&&OEEEDU.logPractice) OEEEDU.logPractice({k:F.incK, mode:S.mode, ok, score:ex?sc.score:null, sec:sec==null?null:Math.round(sec), wrong:S.deducts.filter(d=>d.k==="wrong").length, hint:S.hintUsed||0});
  $("#endBox").innerHTML='<h2>'+(ex?"📝 이상사례 대처 평가":"📘 이상사례 대처 학습")+' — '+esc(ROOM_NM[S.room]+" · "+inc.nm)+'</h2>'+
    '<p>중요도 '+(INC_GRADE[F.incK]||"-")+' · '+(ok?"대응 완료":"중도 종료")+(sec!=null?' · 발생 → 재가동 '+mmss(sec):'')+' · 원인 판단 오답 '+S.deducts.filter(d=>d.k==="wrong").length+'회 · 힌트 '+(S.hintUsed||0)+'회</p>'+
    (ex?'<div class="finalScore">'+(ok?sc.score:0)+'<small>점 · '+(ok&&pass?"합격":"불합격")+' (기준 '+PASS+'점)</small></div>':'')+
    '<h3>올바른 판단</h3><p>'+esc(inc.a)+'</p>'+
    '<h3>감점 내역</h3><table class="ht"><tr><th>항목</th><th>감점</th></tr>'+ded+'</table>'+
    '<p class="oeeNote">결과는 [OEE › OEE 관리 대시보드 › ③ 교육 효과] 에 기록됩니다.</p>'+
    '<div class="mbtn"><button class="pri" id="endAgain">다시 하기</button><button id="endList">이상사례 목록</button><button id="endHome">메인화면</button></div>';
  $("#mEnd").classList.add("on");
  $("#endAgain").onclick=()=>{ $("#mEnd").classList.remove("on"); incStart(F.incK,S.mode); };
  $("#endList").onclick=()=>{ $("#mEnd").classList.remove("on"); goHome(); $("#choose"+S.room).click(); eduShow("inc"); };
  $("#endHome").onclick=()=>{ $("#mEnd").classList.remove("on"); goHome(); };
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
