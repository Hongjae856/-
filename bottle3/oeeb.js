/* ═══════════════════════════════════════════════════════════════════
   자유모드 · OEE 관리 대시보드 · 이상사례 대처 교육 (B5-2 · 파우치 · PTP 와 같은 방식, 공통 모듈 oee/oee.js)
   · 자유 : 순서 · 감점 · 평가 없음, 기동 조건 해제 (동력 · 공압은 실제처럼 필요 — PTP V4 결정과 같음), 중량선별기 세팅 없이도 가동
   · OEE : 시트에서 '계수기' 라인(병 라인 · 2호 · 3호 등 이름에 계수기가 들어간 줄) 기록만 읽어 IDT DB 에 저장 (실제 값은 저장소 · 페이지에 넣지 않음)
   · 부동 유형 = 사용자 제공 병 라인 부동사유 분류 (11/18) ↔ 충전실 앱 이상사례 · 포장실 신규 이상사례
   ═══════════════════════════════════════════════════════════════════ */
const OEE_B_CODES=[
  {k:"SG22", nm:"실리카겔 삽입기 이송위치 에러", room:"F", kw:["실리카겔.*(이송|위치|삽입)"]},
  {k:"PE52", nm:"비닐(PE) 커팅 · 삽입 에러", room:"F", kw:["비닐","PE\\s*필름"]},
  {k:"DM33", nm:"정제계수기 에러", room:"F", kw:["정제\\s*계수기","계수기\\s*에러"]},
  {k:"WC41", nm:"중량선별기(충전) 병 쓰러짐 · 리셋", room:"F", kw:["병충전.*중량","정제\\s*중량","중량선별기\\s*(리셋|병\\s*쓰러)"]},
  {k:"RC65", nm:"기밀도 시험 재실시 (캡핑기 조정)", room:"F", kw:["기밀도"]},
  {k:"PK1", nm:"설명서(첨부문서) 부착기 에러", room:"P", kw:["설명서","첨부문서"]},
  {k:"PK2", nm:"비전 프로그램 재세팅", room:"P", kw:["비전"]},
  {k:"PK3", nm:"라벨 인쇄 불량 (라벨러 장력)", room:"P", kw:["라벨.*인쇄","인쇄\\s*불량"]},
  {k:"PLAN", nm:"적격성 평가 (계획 부동)", room:null, kw:["적격성"]},
  {k:"ETC", nm:"기타 · 미분류 (IDT 실습 없음)", room:null, kw:[]}
].map(c=>Object.assign(c,{inc:c.room?c.k:null, roomNm:c.room==="F"?"충전실 실습":c.room==="P"?"포장실 실습":""}));
const INCB={k:null, mode:null, room:null, t0:0, fired:false, at:0, done:false, sec:0};
/* ── 포장실 이상사례 (packsim 위에) ── */
const PK_INC={
  PK1:{nm:"설명서 부착기 에러", fire(){ PS.leaf.fault=true; psMsg("설명서 부착기 정지 — 에러 (경광등)"); },
    fix:[{k:"leaf",t:"설명서 부착기 전원 OFF (조작 전 전원 차단 · LOTO)",done:()=>!PS.leaf.on&&PS.leaf.lock},{k:"leafBelt",t:"부착기 벨트 · 높이 점검 (컨베이어 수평)",done:()=>!PS.leaf.fault},{k:"leaf",t:"LOTO 해제 후 전원 ON",done:()=>PS.leaf.on&&!PS.leaf.fault}]},
  PK2:{nm:"비전 프로그램 이상 (연속 NG)", fire(){ PS.vis.bad=true; psMsg("비전 NG 연속 — 정상 병까지 리젝트"); },
    fix:[{k:"vis",t:"비전 PC 중지",done:()=>!PS.vis.on},{k:"vis",t:"비전 PC 다시 시작 (프로그램 재세팅)",done:()=>PS.vis.on&&!PS.vis.bad}]},
  PK3:{nm:"라벨 인쇄 불량 (흐림)", fire(){ PS.pr.faint=true; psMsg("라벨 인쇄 흐림 — 비전 NG 증가"); },
    fix:[{k:"lab",t:"라벨러 STOP",done:()=>!PS.lab.run},{k:"tension",t:"라벨 장력(텐션) 조정",done:()=>!PS.pr.faint},{k:"lab",t:"라벨러 RUN",done:()=>PS.lab.run&&!PS.pr.faint}]}
};
/* 이상 상태가 흐름에 주는 영향 */
const _psGate=psGate;
psGate=function(x){ if(x>=PK.leaf[0]-60&&x<PK.leaf[0]&&PS.leaf.fault) return PK.leaf[0]-30; return _psGate(x); };
const _psTick=psTick;
psTick=function(dt){ const r=PS_RATE.visNG; if(PS.vis.bad) PS_RATE.visNG=1; else if(PS.pr.faint) PS_RATE.visNG=.35; _psTick(dt); PS_RATE.visNG=r; };
/* 이상사례 조치 조작 (타일 · 1인칭 대상에 추가) */
PT.leafBelt={nm:"부착기 벨트 점검", sub:()=>PS.leaf.fault?"점검 필요":"정상", run:()=>{ if(PS.leaf.on) return "전원을 먼저 차단하세요 (LOTO)"; PS.leaf.fault=false; return "벨트 · 높이 · 컨베이어 수평 점검 완료"; }};
PT.tension={nm:"라벨 장력 조정", sub:()=>PS.pr.faint?"인쇄 흐림":"정상", run:()=>{ if(PS.lab.run&&!FREEB.on) return "라벨러를 먼저 정지하세요"; PS.pr.faint=false; return "장력 조정 완료"; }};
const _leafRun=PT.leaf.run; PT.leaf.run=()=>{ if(PS.leaf.fault&&PS.leaf.on){ PS.leaf.on=false; PS.leaf.lock=true; return "전원 OFF · LOTO 설치"; } if(PS.leaf.fault) return "에러 원인(벨트)을 먼저 점검하세요"; PS.leaf.lock=false; return _leafRun(); };
const _visRun=PT.vis.run; PT.vis.run=()=>{ const r=_visRun(); if(PS.vis.on&&PS.vis.bad&&PS.vis.offAt) PS.vis.bad=false; if(!PS.vis.on) PS.vis.offAt=performance.now(); return r; };
/* ── 자유모드 — 중간안 (11/18 사용자 결정 · 세 IDT 통일) : 기동 조건 · 운전 중 조작 금지 해제, 전원 · 공압 · 안전문(열면 인터락 정지 E001) · 비상정지 · 알람 RESET 은 실제처럼 ── */
const FREEB={on:false};
function freeStart(r){
  FREEB.on=true;
  if(r==="F"){ const w=appWin(); try{ if(!w.__sb0){ w.__sb0=w.startBlockers; w.__dd0=w.deduct; }
      w.startBlockers=()=>w.__sb0().filter(t=>/전원|공기|안전문|비상정지|알람/.test(t)); w.deduct=function(){}; w.FREEB=true; const st=w.document.createElement("style"); st.id="freeCss"; st.textContent="#coach>*{visibility:hidden}.hint,.hintNow{outline:none!important}"; w.document.head.appendChild(st); }catch(e){ console.error("자유모드(충전)",e); } }
}
function freeStop(){ FREEB.on=false; const w=appWin(); try{ if(w.__sb0){ w.startBlockers=w.__sb0; w.deduct=w.__dd0; w.__sb0=null; } w.FREEB=false; const c=w.document.getElementById("freeCss"); if(c) c.remove(); }catch(e){} }
/* 포장실 자유 : 중량 세팅 없이 가동 · 순서 없음 */
const _cwAct=PS_ACT.cw; PS_ACT.cw=()=>{ if(FREEB.on&&!PS.cw.set){ PS_ACT.cwSet(STD.std,STD.lo,STD.hi); } return _cwAct(); };
/* ── OEE · 이상사례 ── */
function oeebInit(){
  if(!document.getElementById("oeeLamp")) $("#splash").insertAdjacentHTML("beforeend",'<div id="oeeLamp" class="off" title="OEE 미연동"><i></i><span>OEE 미연동</span></div>');   /* 파우치와 같은 OEE 연동 표시 */
  $("#oeeLamp").onclick=()=>OEEEDU.open(); try{ idtSplashVer("V"+CHANGELOG[0].v); }catch(e){}
  if(typeof OEEEDU==="undefined") return;
  OEEEDU.init({line:"계수기", title:"병 라인(계수기) · 부동 원인 분석 → 이상사례 대처 교육", codes:OEE_B_CODES, mount:document.body, openInc(){ goHome(); CREW.mode="inc"; spMark(); }});
}
function incbList(r){ const st=(OEEEDU.codeStats&&OEEEDU.codeStats())||{}, has=Object.keys(st).length>0;
  const L=OEE_B_CODES.filter(c=>c.room===r||(!r&&c.room)).map(c=>({c,down:(st[c.k]||{}).down||0,n:(st[c.k]||{}).n||0}));
  const mD=Math.max(1e-9,...L.map(o=>o.down)), mN=Math.max(1e-9,...L.map(o=>o.n)); for(const o of L) o.s=has?.4*o.down/mD+.3*o.n/mN+.3*.6:0; if(has) L.sort((a,b)=>b.s-a.s); return {L,has}; }
/* 중요도 등급 (11/19 사용자 확인 · 파우치 기준) */
const INCB_GRADE={DM33:"상",RC65:"상",PK1:"상",PK2:"상",PK3:"상",SG22:"중",PE52:"중",WC41:"중"};
function incbPick(room){   /* 공통 목록 (idt_common/incpick.js) — 파우치처럼 작업자(실)를 고른 뒤 그 실의 사례 */
  const el=$("#incPick");
  idtIncPick(el,{room:room==="F"?"충전실":"포장실", items:OEE_B_CODES.filter(c=>c.room===room).map(c=>({k:c.k, nm:c.nm, src:c.roomNm, g:INCB_GRADE[c.k]||"중"})),
    onStart:(k,m)=>incbStart(k,m), onBack:()=>{ el.style.display="none"; $("#splash .go").style.display="grid"; CREW.mode=null; spMark(); }});
  el.style.display="block"; $("#splash .go").style.display="none";
}
function incbStart(k,m){
  const c=OEE_B_CODES.find(x=>x.k===k); Object.assign(INCB,{k,mode:m,room:c.room,t0:performance.now(),fired:false,launched:false,done:false,at:0,fi:0,hint:0,hintFi:-1,d0:0,h0:0,wrong:0,score:null});
  $("#incPick").style.display="none"; $("#splash .go").style.display="grid"; $("#splash").classList.add("hide");
  CREW.mode=m==="exam"?"exam":"guide";
  if(c.room==="F"){ const w=appWin(); CREW.started.F=true; try{ w.document.getElementById("splash").classList.add("hide"); w.hintOn=false; w.startSession("guide"); w.demoSetup(); if(m==="exam") incbExamCss(true); }catch(e){ console.error(e); } show("F"); }   /* 라인을 바로 운전 상태로 (시연 준비와 같은 설정) */
  else { CREW.started.P=true; CREW.pRole="P1"; pcStart("P1","free",true,CREW.rx); PS_ACT.allOn(); PC.firstOk=PC.sampleOk=PC.rejOk=true; PS.auto.w1=true; PS.auto.w2=true; show("P1"); }
  CREW.inc=true;
}
function incbTick(){
  if(!CREW.inc||!INCB.k||INCB.done) return; const now=performance.now();
  if(INCB.room==="F"){ const w=appWin(); let S=null; try{ S=w.__IDT.S(); }catch(e){} if(!S) return;
    if(!INCB.fired){ if(!INCB.launched&&S.running&&now-INCB.t0>6000){ INCB.launched=true; INCB.at=now; try{ w.launchIncident(INCB.k); }catch(e){ console.error(e); } }   /* 한 번만 발생 (증상 뒤 알람이 뜨는 사례 포함) */
      if(INCB.launched&&S.activeTrouble){ INCB.fired=true; INCB.at=now; INCB.d0=S.deducts.length; INCB.h0=S.hintUsed||0; } return; }
    if(!S.activeTrouble&&S.running&&now-INCB.at>3000) incbDone(now); return; }
  if(!INCB.fired){ if(psOn()&&now-INCB.t0>5000){ PK_INC[INCB.k].fire(); INCB.fired=true; INCB.at=now; } return; }
  const F=PK_INC[INCB.k].fix; while(INCB.fi<F.length&&F[INCB.fi].done()) INCB.fi++;
  if(INCB.fi>=F.length&&psOn()&&now-INCB.at>2000) incbDone(now);
}
/* 결과 (파우치와 같은 기준) : 원인 판단 오답 · 힌트 횟수 · 평가 점수(100 − 감점, 힌트 −5) */
function incbDone(now){ INCB.done=true; INCB.sec=Math.round((now-INCB.at)/1000); let ded=[];
  if(INCB.room==="F"){ try{ const S=appWin().__IDT.S(); ded=S.deducts.slice(INCB.d0).map(d=>({why:d.why,pts:d.pts})); INCB.hint+=Math.max(0,(S.hintUsed||0)-INCB.h0); }catch(e){} }
  for(let i=0;i<INCB.hint;i++) if(!ded.some(d=>d.hint===i)) ded.push({why:"힌트 사용",pts:5,hint:i});
  INCB.wrong=ded.filter(d=>/원인 판단/.test(d.why)).length; const ex=INCB.mode==="exam";
  INCB.score=ex?Math.max(0,100-ded.reduce((a,d)=>a+d.pts,0)):null; if(ex) incbExamCss(false);
  try{ OEEEDU.logPractice&&OEEEDU.logPractice({k:INCB.k, mode:ex?"incExam":"incLearn", ok:true, score:INCB.score, sec:INCB.sec, wrong:INCB.wrong, hint:INCB.hint}); }catch(e){}
  const c=OEE_B_CODES.find(x=>x.k===INCB.k)||{nm:INCB.k};
  const r=INCB.room, k=INCB.k, m=INCB.mode;   /* 공통 결과 창 (파우치와 같은 구성) */
  idtIncResult({room:r==="F"?"충전실":"포장실", nm:c.nm, grade:INCB_GRADE[k]||"중", ok:true, sec:INCB.sec, wrong:INCB.wrong, hint:INCB.hint, exam:ex, score:INCB.score,
    ded:ded.map(d=>[d.why,d.pts]), again:()=>incbStart(k,m), list:()=>{ goHome(); setTimeout(()=>{ const b=document.querySelector('#splash .go [data-m="inc"]'); if(b) b.click(); const q=document.getElementById(r==="F"?"chooseF":"chooseP1"); if(q) q.click(); },300); }, home:goHome}); }
/* 충전실 이상사례 평가 : 원본 앱 안내(코치 · 강조)를 숨김 — F1 힌트는 15 초 동안 보여 주고 −5 점 */
function incbExamCss(on){ try{ const d=appWin().document; let st=d.getElementById("incExamCss");
  if(on&&!st){ st=d.createElement("style"); st.id="incExamCss"; st.textContent="#coach>*{visibility:hidden}.hint,.hintNow{outline:none!important}"; d.head.appendChild(st); }
  if(!on&&st) st.remove(); }catch(e){} }
function incbHintF(){ if(!INCB.fired||INCB.done){ fpcToast("이상 상황이 아직 없습니다"); return; } if(INCB.hintUntil&&performance.now()<INCB.hintUntil){ fpcToast("힌트 표시 중"); return; }
  INCB.hint++; INCB.hintUntil=performance.now()+15000; incbExamCss(false); fpcToast("힌트 사용 −5 점 — 15 초 동안 안내 표시");
  setTimeout(()=>{ if(CREW.inc&&!INCB.done&&INCB.mode==="exam") incbExamCss(true); },15000); }
/* 포장실 이상사례 안내 (pcRender 안내판 대신) */
function incbCoach(){ if(!CREW.inc||INCB.room!=="P") return null; const P=PK_INC[INCB.k], f=P.fix[INCB.fi];
  return '<small>이상사례 대처 '+(INCB.mode==="exam"?"평가":"학습")+' · 포장실</small><b>'+(INCB.done?"대응 완료 — 발생 → 재가동 "+INCB.sec+" 초":INCB.fired?"이상 발생 : "+P.nm:"정상 운전 중 — 곧 이상 상황이 발생합니다")+'</b><span>'+
    (INCB.done?"결과는 OEE 관리 대시보드 ③ 교육 효과에 기록됩니다.":INCB.fired?(INCB.mode==="exam"?"원인을 판단하고 조치한 뒤 재가동하세요 (안내 없음 · 1인칭 F1 힌트 −5 점).":(f?"다음 조치 : "+f.t:"재가동을 확인합니다")):"")+'</span>'; }
