/* ═══════════════════════════════════════════════════════════════════
   OEE 관리 대시보드 · 이상사례 대처 교육 (P5 · 파우치 방식, 공통 모듈 oee/oee.js)
   · OEE 시트에서 '블리스터' 라인 기록만 읽어 IDT DB 에 저장 (실제 값은 저장소 · 페이지에 넣지 않음)
   · 부동 유형 = PTP 앱 알람 시나리오(충전기 TROUBLES · 포장라인 TROUBLES)와 1:1 · kw = 자유 기재 사유 분류 낱말 (추정 · 실제 기록 확인 후 보정)
   · 이상사례 대처 교육 : 정상 운전 중 그 알람을 발생 → 앱의 알람 대응 안내로 조치 → 해제 · 재가동까지 시간 기록 (OEE 대시보드 ③ 교육 효과)
   ═══════════════════════════════════════════════════════════════════ */
const OEE_PTP_CODES=[
  {k:"E131", nm:"성형필름(PVC) 끊김", room:"F", kw:["필름.*(끊|단절|터)","PVC"]},
  {k:"E132", nm:"커버포일 소진 · 끊김", room:"F", kw:["포일","호일","알루미늄"]},
  {k:"E140", nm:"연속 충전 불량 (정제 공급)", room:"F", kw:["충전\\s*불량","공포","정제.*(소진|공급)","공급\\s*불량"]},
  {k:"E051", nm:"히터 온도 하한 미달", room:"F", kw:["히터","온도","예열"]},
  {k:"E130", nm:"플랩 게이트 이물 · 공급장치 걸림", room:"F", kw:["플랩","이물","공급장치","걸림"]},
  {k:"E152", nm:"배출 컨베이어 과부하", room:"F", kw:["배출.*컨베","과부하"]},
  {k:"C150", nm:"카톤 부족 · 공급 불량", room:"P", kw:["카톤.*(부족|공급)"]},
  {k:"C160", nm:"설명지 부족 · 이송 불량", room:"P", kw:["설명(서|지)"]},
  {k:"C152", nm:"연속 카톤 성형 불량", room:"P", kw:["카톤\\s*성형","성형\\s*불량"]},
  {k:"C170", nm:"푸셔 과부하 (토크리미터)", room:"P", kw:["푸셔","토크","오버\\s*로드"]},
  {k:"P201", nm:"카톤 인쇄 검증 불량", room:"P", kw:["인쇄","잉크","각인"]},
  {k:"W211", nm:"연속 중량 하한 미달", room:"P", kw:["중량"]},
  {k:"B221", nm:"박스포장기 인피드 잼", room:"P", kw:["박스","케이스","잼"]},
  {k:"T232", nm:"팔렛타이저 진공 파지 실패", room:"P", kw:["팔레트","팔렛","파지"]},
  {k:"ETC", nm:"기타 · 미분류 (IDT 실습 없음)", room:null, kw:[]}
].map(c=>Object.assign(c,{inc:c.room?c.k:null, roomNm:c.room==="F"?"충전실 실습":c.room==="P"?"포장실 실습":""}));
const INC3={k:null, mode:null, room:null, at:0, fired:false, done:false};
function oee3Init(){
  OEEEDU.init({line:"블리스터", title:"PTP(블리스터) 라인 · 부동 원인 분석 → 이상사례 대처 교육", codes:OEE_PTP_CODES, mount:document.body,
    openInc(){ goHome(); pickMode({dataset:{c:"inc",m:"inc"},closest:()=>({querySelector:()=>({textContent:"OEE"})}),firstChild:{textContent:"이상사례 대처 교육"}}); }});
  $("#spOee").onclick=()=>OEEEDU.open();
}
/* 사례 목록 : OEE 부동시간(40 %) · 빈도(30 %) · 중요도(30 %, 등급 미정 = 중) — 데이터가 없으면 앱 알람 순서 */
function inc3List(r){
  const st=(OEEEDU.codeStats&&OEEEDU.codeStats())||{}, has=Object.keys(st).length>0;
  const L=OEE_PTP_CODES.filter(c=>c.room===r).map(c=>({c, down:(st[c.k]||{}).down||0, n:(st[c.k]||{}).n||0}));
  const mD=Math.max(1e-9,...L.map(o=>o.down)), mN=Math.max(1e-9,...L.map(o=>o.n)); for(const o of L) o.s=has?.4*o.down/mD+.3*o.n/mN+.3*.6:0;
  if(has) L.sort((a,b)=>b.s-a.s); return {L,has};
}
function inc3Pick(r){
  const {L,has}=inc3List(r), el=$("#incPick");
  el.innerHTML='<h3>이상사례 대처 교육 — '+ROOM_NM[r]+'</h3><p>'+(has?"OEE 부동시간 · 발생 빈도 순으로 정렬했습니다.":"OEE 데이터가 없어 알람 순서로 표시합니다. [OEE 관리 대시보드] 에서 데이터를 연결하면 부동시간 · 빈도 순으로 바뀝니다.")+'</p>'+
    L.map((o,i)=>'<div class="ip"><span>'+(i+1)+'</span><b>'+o.c.nm+'<s>'+o.c.k+(has?' · 부동 '+Math.round(o.down)+' 분 · '+o.n+' 회':'')+'</s></b><button data-k="'+o.c.k+'" data-m="learn">학습</button><button class="e" data-k="'+o.c.k+'" data-m="exam">평가</button></div>').join("")+
    '<button id="incBack">← 모드 다시 선택</button>';
  el.hidden=false; $("#modes").hidden=true;
  el.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>inc3Start(r,b.dataset.k,b.dataset.m));
  $("#incBack").onclick=()=>{ el.hidden=true; $("#modes").hidden=false; CREW.mode=null; CREW.room=null; crewMark(); };
}
function inc3Start(r,k,m){
  Object.assign(INC3,{k,mode:m,room:r,at:0,fired:false,done:false,t0:performance.now(),rs:0,kick:0,hint:0,hintUntil:0,p0:0,f0:0,score:null,wrong:0,ded:[]});
  $("#incPick").hidden=true; $("#modes").hidden=false; $("#splash").classList.add("hide");
  CREW.started={F:false,P:false}; CREW.pose={}; CREW.fp=true; MODE3.kind="inc";
  const c=crs(APPK[r]); try{ c.begin("operation","guide"); if(r==="F") setTimeout(()=>{ try{ c.quickStart(); }catch(e){} },150); }catch(e){ console.error(e); }
  setTimeout(()=>{ try{ api3(r).ready(); crs(APPK[r]).start(); }catch(e){ console.error(e); } if(m==="exam") mode3Apply(r); },800);
  CREW.started[r]=true; show(r);
}
/* 시작 3 초 뒤 발생 · 해제 + 재가동이면 완료 */
function inc3Tick(){
  if(MODE3.kind!=="inc"||!INC3.k||INC3.done) return; const w=UNI_HUB.win(APPK[INC3.room]); if(!w) return;
  /* 과정 시작 직후 앱이 상태를 다시 맞추므로, 정상 운전이 2 초 이상 이어진 뒤(시작 6 초 이후) 발생 */
  if(!INC3.fired){ let run=false; try{ run=!!w.eval("S.running"); }catch(e){} if(!run){ INC3.rs=0; if(performance.now()-INC3.t0>4000&&!INC3.kick){ INC3.kick=1; try{ api3(INC3.room).ready(); crs(APPK[INC3.room]).start(); }catch(e){} } return; }
    INC3.rs=INC3.rs||performance.now(); if(performance.now()-INC3.rs<2000||performance.now()-INC3.t0<6000) return; }
  if(!INC3.fired){ try{ if(INC3.room==="F") w.eval("window.__manualIncident=true; try{ fireTrouble("+JSON.stringify(INC3.k)+"); }finally{ window.__manualIncident=false; }"); else w.eval("window.__manualIncident=true; try{ fireTrouble(TROUBLES.find(t=>t.k==="+JSON.stringify(INC3.k)+")); }finally{ window.__manualIncident=false; }"); if(w.eval("S.activeTrouble")){ INC3.fired=true; INC3.at=performance.now(); try{ INC3.p0=w.eval("S.exam.penalty||0"); INC3.f0=w.eval("S.exam.faults.length"); }catch(e){} } else if(performance.now()-INC3.t0>20000){ INC3.fired=true; INC3.at=performance.now(); console.warn("알람 발생 실패",INC3.k); } }catch(e){ console.error("알람 발생",e); } return; }
  if(INC3.fired){ let busy=true, run=false; try{ busy=!!w.eval("S.activeTrouble"); run=!!w.eval("S.running"); }catch(e){}
    if(!busy&&run&&performance.now()-INC3.at>3000){ INC3.done=true; const sec=Math.round((performance.now()-INC3.at)/1000), ex=INC3.mode==="exam";
      /* 결과 (파우치와 같은 기준) : 원인 판단 오답 · 힌트 횟수 · 평가 점수 = 100 − (발생 뒤 감점 + 힌트 5 점) */
      let pen=0, F=[]; try{ pen=Math.max(0,w.eval("S.exam.penalty||0")-INC3.p0); F=JSON.parse(w.eval("JSON.stringify(S.exam.faults.slice("+INC3.f0+"))")).map(f=>typeof f==="string"?f:(f.nm+" (−"+f.pt+")")); }catch(e){}
      INC3.ded=F.concat(Array.from({length:INC3.hint},()=>"힌트 사용 (−5)")); INC3.wrong=F.filter(t=>/원인|오답|판단|RESET 반복/.test(t)).length;
      INC3.score=ex?Math.max(0,100-pen-5*INC3.hint):null;
      try{ OEEEDU.logPractice&&OEEEDU.logPractice({k:INC3.k, mode:ex?"incExam":"incLearn", ok:true, score:INC3.score, sec, wrong:INC3.wrong, hint:INC3.hint}); }catch(e){}
      INC3.sec=sec; } }
}
function inc3Coach(el,r){
  const c=OEE_PTP_CODES.find(x=>x.k===INC3.k)||{nm:INC3.k};
  const k='<div class="t"><small>이상사례 대처 '+(INC3.mode==="exam"?"평가":"학습")+' · '+ROOM_NM[r]+'</small><b>'+(INC3.done?"대응 완료 — 발생 → 재가동 "+INC3.sec+" 초":INC3.fired?"알람 발생 : "+c.nm:"정상 운전 중 — 곧 이상 상황이 발생합니다")+'</b><span>'+
    (INC3.done?(INC3.score!=null?"<b>"+INC3.score+" 점 · "+(INC3.score>=80?"합격":"불합격")+"</b> (기준 80 점) · ":"")+"원인 판단 오답 "+INC3.wrong+" 회 · 힌트 "+INC3.hint+" 회"+(INC3.ded.length?" · 감점 : "+INC3.ded.join(", "):"")+" — 결과는 OEE 관리 대시보드 ③ 교육 효과에 기록됩니다.":INC3.fired?(INC3.mode==="exam"?"원인을 판단하고 조치한 뒤 RESET → START 하세요 (안내 없음 · 1인칭 F1 힌트 −5 점).":"오른쪽 설비 화면 · 알람 안내에 따라 정지 → 조치 → RESET → START 하세요."):"")+'</span></div>'+
    (INC3.done?'<div class="b"><button data-f="home">메인화면</button></div>':'');
  if(el.dataset.k!==k){ el.dataset.k=k; el.className="inc"; el.innerHTML=k; const b=el.querySelector('[data-f="home"]'); if(b) b.onclick=goHome; }
}
