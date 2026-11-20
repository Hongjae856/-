/* ═══════════════════════════════════════════════════════════════════
   포장실 과정 (B4 · 11/18) — 작업자 : 포장실 1 (전문 : 판독 + 설비 운전 / 일반 : 설비 운전 + 박스 포장) · 포장실 2 (전문만 : 박스 포장 · AG 라벨 · 파렛트)
   · 기동 전 점검 (사용자 선택 11/18) : 첫 인쇄 내용 대조 · 중량선별기 중량 세팅 → 시료 시험
   · 선택하지 않은 포장 작업자는 자동 (작업자 2 자동 = 봉함 · 라벨 · 적재 / 작업자 1 자동 = 설비 일괄 가동 · 판독)
   · 학습 = 단계 설명 · 안내 / 평가 = 설명 없음 · 순서가 틀린 조작은 감점 (−3) · 80 점 합격
   · 조작은 왼쪽 타일(3인칭) — 1인칭 조작 대상은 B5
   ═══════════════════════════════════════════════════════════════════ */
const PC={on:false, role:null, mode:"learn", deep:true, i:0, steps:[], score:100, ded:[], t0:0, done:false, boxes0:0, firstOk:false, sample:null, hints:0, hintI:-1, warn:{}};
const STD={std:22.20, lo:21.80, hi:22.60};               /* 작업 지시서 중량 기준 (가상 값) */
const isExamP=()=>PC.mode==="exam";
/* ── 조작 타일 ── */
const PT={
  rej:{nm:"리젝트 함 확인", sub:"라벨러 후단 · 중량선별기", run:()=>{ PKG.rejLabN=0; PKG.rejCwN=0; PC.rejOk=true; return "리젝트 함 2곳 비움 확인"; }},
  tt:{nm:"턴테이블", sub:()=>PS.tt.on?"운전 · 보관 "+PS.tt.buf+" 병":"정지 · 보관 "+PS.tt.buf+" 병", st:()=>PS.tt.on, run:()=>PS_ACT.tt()},
  pr:{nm:"라벨 인쇄기", sub:()=>(PS.pr.on?"실행":"꺼짐")+" · 리본 "+Math.round(PS.pr.ribbon)+" %", st:()=>PS.pr.on, run:()=>PS_ACT.pr()},
  vis:{nm:"비전 PC", sub:()=>(PS.vis.on?"검사 중":"중지")+" · NG "+PS.vis.ng, st:()=>PS.vis.on, run:()=>PS_ACT.vis()},
  lab:{nm:"라벨러", sub:()=>(PS.lab.run?"RUN":"STOP")+" · 라벨 롤 "+Math.round(PS.lab.roll)+" %", st:()=>PS.lab.run, run:()=>PS_ACT.lab()},
  first:{nm:"첫 인쇄 대조", sub:()=>PC.firstOk?"대조 완료":"첫 라벨 확인", st:()=>PC.firstOk, run:()=>pcFirst()},
  leaf:{nm:"설명서 부착기", sub:()=>(PS.leaf.on?"ON":"OFF")+" · 롤 "+Math.round(PS.leaf.roll)+" %", st:()=>PS.leaf.on, run:()=>PS_ACT.leaf()},
  cwSet:{nm:"중량 세팅", sub:()=>PS.cw.set?PS.cw.std.toFixed(2)+" g ("+PS.cw.lo.toFixed(2)+"~"+PS.cw.hi.toFixed(2)+")":"미설정", st:()=>PS.cw.set, run:()=>pcCwSet()},
  sample:{nm:"시료 시험", sub:()=>PC.sample||"정상 · 설명서 없는 병", st:()=>!!PC.sampleOk, run:()=>pcSample()},
  cw:{nm:"중량선별기", sub:()=>(PS.cw.run?"가동":"정지")+" · −NG "+PS.cw.nNG+" · +NG "+PS.cw.pNG, st:()=>PS.cw.run, run:()=>{ if(!PS_ACT.cw()) return "중량 세팅을 먼저 하세요"; }},
  agStart:{nm:"집합 포장 작업 시작", sub:()=>PS.ag.on?"진행 중":"작업지시 선택", st:()=>PS.ag.on, run:()=>PS_ACT.agStart(), rx:true},
  scan:{nm:"판독", sub:()=>"단품 "+PS.ag.n+" / "+PS.boxN, run:()=>pcScan(), rx:true},
  agClear:{nm:"클리어", sub:"잘못 판독한 박스", run:()=>PS_ACT.agClear(), rx:true},
  agPack:{nm:"포장완료", sub:"수량 미달 박스 마감", run:()=>PS_ACT.agPack(), rx:true},
  agEnd:{nm:"작업완료", sub:()=>"박스 "+PS.ag.boxes, st:()=>PS.ag.msg==="작업 완료", run:()=>PS_ACT.agEnd(), rx:true},
  boxMk:{nm:"박스 조립", sub:()=>PS.box.ready?"조립됨":"접힌 박스 "+PS.box.flat+" 장", st:()=>!!PS.box.ready, run:()=>pcBoxMake()},
  put:{nm:"병 담기", sub:()=>PS.box.n+" / "+PS.boxN, run:()=>pcPut(), otc:true},
  seal:{nm:"봉함 (테이프)", sub:()=>PS.box.sealed?"봉함됨":"박스 닫고 테이프", st:()=>!!PS.box.sealed, run:()=>pcSeal()},
  agLab:{nm:"AG 라벨 부착", sub:()=>PS.box.labeled?"부착됨":"프린터에서 라벨", st:()=>!!PS.box.labeled, run:()=>pcLabel(), rx:true},
  pal:{nm:"파렛트 적재", sub:()=>"적재 "+PS.pallet+" 박스", run:()=>pcPallet()},
  stop:{nm:"설비 정지", sub:"작업 후 전원 OFF", run:()=>PS_ACT.allOff()},
  /* 자재 교체 (11/18 사용자 선택) : 잔량 20 % 이하 경고 · 그 설비를 정지한 뒤 교체 */
  matLab:{nm:"라벨 롤 교체", sub:()=>"잔량 "+Math.round(PS.lab.roll)+" %", low:()=>PS.lab.roll<20, run:()=>pcMat("lab")},
  matRib:{nm:"리본 교체 (인쇄기)", sub:()=>"잔량 "+Math.round(PS.pr.ribbon)+" %", low:()=>PS.pr.ribbon<20, run:()=>pcMat("rib")},
  matLeaf:{nm:"설명서 롤 교체", sub:()=>"잔량 "+Math.round(PS.leaf.roll)+" %", low:()=>PS.leaf.roll<20, run:()=>pcMat("leaf")},
  matAg:{nm:"AG 라벨지 교체", sub:()=>(PS.ag.pending?"라벨지 없음 · 발행 대기":"잔량 "+PS.ag.paper+" 장"), low:()=>PS.ag.paper<60||PS.ag.pending, run:()=>pcMat("ag"), rx:true}
};
/* 자재 : 잔량 · 교체 (용량 · 소모량은 가상 값) */
const PC_MAT={
  lab:{nm:"라벨 롤", dev:()=>PS.lab.run, devNm:"라벨러를 STOP", lvl:()=>PS.lab.roll, set:()=>{ PS.lab.roll=100; }},
  rib:{nm:"열전사 리본", dev:()=>PS.pr.on, devNm:"라벨 인쇄기를 OFF", lvl:()=>PS.pr.ribbon, set:()=>{ PS.pr.ribbon=100; }},
  leaf:{nm:"설명서 롤", dev:()=>PS.leaf.on, devNm:"설명서 부착기를 OFF", lvl:()=>PS.leaf.roll, set:()=>{ PS.leaf.roll=100; }},
  ag:{nm:"AG 라벨지", dev:()=>false, devNm:"", lvl:()=>PS.ag.paper/3, set:()=>{ PS.ag.paper=300; if(PS.ag.pending){ PS.ag.pending=false; PS.ag.paper--; PS.agFeed=1; psMsg("AG 라벨지 교체 — 대기 중이던 박스 라벨 발행"); } }}
};
function pcMat(k){ const m=PC_MAT[k]; if(m.dev()&&!(typeof FREEB!=="undefined"&&FREEB.on)) return m.devNm+" 한 뒤 교체합니다 (운전 중 자재 교체 금지)";
  m.set(); PC.warn[k]=false; return m.nm+" 교체 완료 — 새 자재 장착"; }
/* 역할별 타일 */
function pcTiles(){
  const rx=PS.rx, r=PC.role;
  const eq=["rej","tt","pr","vis","lab","first","leaf","cwSet","sample","cw"];
  const mat=["matLab","matRib","matLeaf"];
  if(r==="P2") return ["boxMk","seal","agLab","pal","matAg"];
  if(!rx) return eq.concat(["boxMk","put","seal","pal","leafBelt","tension","stop"],mat);
  return eq.concat(["agStart","scan","agClear","agPack","agEnd","leafBelt","tension","stop"],mat,["matAg"]);
}
/* ── 과정 단계 ── */
function pcSteps(){
  const rx=PS.rx, deep=PC.deep, nBox=deep?3:1, S=[];
  const st=(k,t,d,ok,o)=>S.push(Object.assign({k,t,d,ok},o||{}));
  if(PC.role==="P2"){
    for(let b=1;b<=nBox;b++){
      st("boxMk","박스 "+b+" 조립","접힌 골판지 박스를 펴서 바닥을 테이프로 막고 작업대에 놓습니다.",()=>PS.box.ready||PS.box.n>0||PS.box.done>=b);
      st("seal","박스 "+b+" 봉함","작업자 1이 판독한 병 "+PS.boxN+" 개가 다 담기면(박스 라벨 발행) 박스를 닫고 테이프로 봉합니다.",()=>PS.box.sealed||PS.box.done>=b,{wait:()=>PS.box.full});
      st("agLab","박스 "+b+" AG 라벨 부착","라벨 프린터에서 나온 박스 AG 라벨을 박스 옆면에 붙입니다.",()=>PS.box.labeled||PS.box.done>=b);
      st("pal","박스 "+b+" 파렛트 적재","완성 박스를 파렛트에 정해진 배열로 적재합니다.",()=>PS.box.done>=b); }
    return S; }
  st("rej","라인 클리어런스 — 리젝트 함 확인","라벨러 후단 · 중량선별기 리젝트 함 2곳이 비어 있는지 확인합니다 (이전 작업 병 혼입 방지).",()=>PC.rejOk);
  st("tt","턴테이블 가동","턴테이블 전원을 켭니다. 충전실에서 넘어와 보관 중인 병이 라인으로 나갑니다.",()=>PS.tt.on);
  st("pr","라벨 인쇄기 ON","라벨 인쇄기를 켭니다 (인쇄 내용은 작업 데이터로 들어옴 · 조작은 ON/OFF 만).",()=>PS.pr.on);
  st("vis","비전 PC 시작","비전 검사 화면에서 [시작] (조작은 ON/OFF 만).",()=>PS.vis.on);
  st("lab","라벨러 RUN","라벨러 판넬에서 자동운전 RUN.",()=>PS.lab.run);
  st("first","첫 인쇄 내용 대조","첫 라벨의 제조번호 · 사용기한 · 2D 코드를 작업 지시서와 대조하고 확인합니다.",()=>PC.firstOk,{wait:()=>PS.lab.cnt>0});
  st("leaf","설명서 부착기 ON","설명서 부착기 전원 ON (화면 없음 · 버튼만).",()=>PS.leaf.on);
  st("cwSet","중량선별기 중량 세팅","지시서 기준 중량 "+STD.std.toFixed(2)+" g · 하한 "+STD.lo.toFixed(2)+" · 상한 "+STD.hi.toFixed(2)+" g 을 입력합니다.",()=>PS.cw.set&&Math.abs(PS.cw.std-STD.std)<.005&&Math.abs(PS.cw.lo-STD.lo)<.005&&Math.abs(PS.cw.hi-STD.hi)<.005);
  st("sample","중량선별기 시료 시험","정상 병은 통과(PASS), 설명서 없는 병은 리젝트(−NG)되는지 확인합니다.",()=>PC.sampleOk);
  st("cw","중량선별기 가동","중량선별기 RUN.",()=>PS.cw.run);
  if(rx){ st("agStart","집합 포장 작업 시작","집합 포장(AG) PC 에서 작업지시를 선택해 작업을 시작합니다.",()=>PS.ag.on);
    st("scan","판독 — 박스 1 ("+PS.boxN+" 병)","작업대로 온 병을 하나씩 거치형 판독기에 대고 판독합니다. "+PS.boxN+" 병이 되면 박스 AG 라벨이 자동 발행됩니다.",()=>PS.ag.boxes>=1);
    const mat=()=>{ st("lab","자재 교체 — 라벨러 정지","라벨 롤 잔량 경고(20 % 이하 · 교육용으로 잔량을 낮춰 발생). 라벨러 판넬에서 STOP 합니다 (운전 중 자재 교체 금지).",()=>!PS.lab.run,{enter:()=>{ PS.lab.roll=Math.min(PS.lab.roll,18); }});
      st("matLab","라벨 롤 교체","빈 지관을 빼고 새 라벨 롤을 끼운 뒤 라벨 경로(롤러)대로 걸어 줍니다.",()=>PS.lab.roll>=99);
      st("lab","라벨러 RUN","교체 후 라벨러 RUN — 다시 라벨이 붙는지 확인합니다.",()=>PS.lab.run); };
    if(deep) mat();
    if(nBox>1) st("scan","판독 — 박스 "+nBox+" 까지","계속 판독합니다. 판독 불가 · 중복이면 리젝트 → 라벨만 떼고 턴테이블로 재투입됩니다.",()=>PS.ag.boxes>=nBox);
    st("agEnd","작업완료","지시 수량을 마쳤으면 AG PC 에서 [작업완료].",()=>PS.ag.msg==="작업 완료"); }
  else for(let b=1;b<=nBox;b++){
    if(deep&&b===2){ st("lab","자재 교체 — 라벨러 정지","라벨 롤 잔량 경고(20 % 이하 · 교육용으로 잔량을 낮춰 발생). 라벨러 판넬에서 STOP 합니다 (운전 중 자재 교체 금지).",()=>!PS.lab.run,{enter:()=>{ PS.lab.roll=Math.min(PS.lab.roll,18); }});
      st("matLab","라벨 롤 교체","빈 지관을 빼고 새 라벨 롤을 끼운 뒤 라벨 경로(롤러)대로 걸어 줍니다.",()=>PS.lab.roll>=99);
      st("lab","라벨러 RUN","교체 후 라벨러 RUN — 다시 라벨이 붙는지 확인합니다.",()=>PS.lab.run); }
    st("boxMk","박스 "+b+" 조립","접힌 박스를 펴서 바닥 테이프.",()=>PS.box.ready||PS.box.n>0||PS.box.done>=b);
    st("put","박스 "+b+" — 병 "+PS.boxN+" 개 담기","작업대 병을 박스에 담습니다 (일반의약품 : 판독 없음).",()=>PS.box.n>=PS.boxN||PS.box.done>=b);
    st("seal","박스 "+b+" 봉함","박스를 닫고 테이프.",()=>PS.box.sealed||PS.box.done>=b);
    st("pal","박스 "+b+" 파렛트 적재","파렛트에 적재.",()=>PS.box.done>=b); }
  st("stop","작업 후 설비 정지","턴테이블 · 라벨 인쇄기 · 비전 · 라벨러 · 설명서 부착기 · 중량선별기를 정지합니다.",()=>!PS.tt.on&&!PS.lab.run&&!PS.cw.run&&!PS.leaf.on);
  return S;
}
/* ── 조작 함수 ── */
function pcFirst(){ if(PS.lab.cnt<1) return "아직 인쇄된 라벨이 없습니다 — 라벨러 RUN 후 첫 병이 지나가야 합니다";
  pcDlg('<h3>첫 인쇄 내용 대조</h3><table class="cmp"><tr><th></th><th>작업 지시서</th><th>첫 라벨</th></tr><tr><td>제조번호</td><td>'+PS.job.lot+'</td><td>'+PS.job.lot+'</td></tr><tr><td>사용기한</td><td>'+PS.job.exp+'</td><td>'+PS.job.exp+'</td></tr><tr><td>2D 코드</td><td>(01)'+PS.job.gtin+'</td><td>판독 OK</td></tr></table>',
    [["일치 — 확인",()=>{ PC.firstOk=true; }],["닫기",null]]); }
function pcCwSet(){ pcDlg('<h3>중량선별기 중량 세팅</h3><p>작업 지시서 : 기준 '+STD.std.toFixed(2)+' g · 하한 '+STD.lo.toFixed(2)+' g · 상한 '+STD.hi.toFixed(2)+' g</p>'+
    '<label>기준 <input id="cwStd" value="'+(PS.cw.set?PS.cw.std.toFixed(2):"")+'"></label><label>하한 <input id="cwLo" value="'+(PS.cw.set?PS.cw.lo.toFixed(2):"")+'"></label><label>상한 <input id="cwHi" value="'+(PS.cw.set?PS.cw.hi.toFixed(2):"")+'"></label>',
    [["입력",()=>{ const v=id=>parseFloat(document.getElementById(id).value); const a=v("cwStd"), b=v("cwLo"), c=v("cwHi");
      if(!(b<a&&a<c)){ pcToast("하한 < 기준 < 상한 이어야 합니다"); return false; } PS_ACT.cwSet(a,b,c);
      if(Math.abs(a-STD.std)>.005||Math.abs(b-STD.lo)>.005||Math.abs(c-STD.hi)>.005){ pcToast("지시서와 다른 값입니다"); if(isExamP()) pcDed(5,"중량 세팅 값 불일치"); } }],["닫기",null]]); }
function pcSample(){ if(!PS.cw.set) return "중량 세팅을 먼저 하세요"; if(PS.cw.run&&!(typeof FREEB!=="undefined"&&FREEB.on)) return "시료 시험은 정지 상태에서 시료를 흘려 확인합니다 (가동 전에)";
  const a=STD.std+.02, b=STD.std-PS_RATE.leafG+.01, ra=a>=PS.cw.lo&&a<=PS.cw.hi?"PASS":"NG", rb=b<PS.cw.lo?"−NG (리젝트)":"PASS";
  PC.sample="정상 "+a.toFixed(2)+" g "+ra+" · 설명서 없음 "+b.toFixed(2)+" g "+rb; PC.sampleOk=ra==="PASS"&&rb!=="PASS"; PKG.rejCwN=(PKG.rejCwN||0)+(rb!=="PASS"?1:0);
  return PC.sampleOk?"시료 시험 적합":"시료 시험 부적합 — 중량 세팅을 확인하세요"; }
function pcScan(){ const end=PK_END(), at=PKG.list.filter(q=>q.s>=end-(PK.bottle.r*2+8)*25).sort((a,b)=>b.s-a.s);
  if(!PS.ag.on) return "집합 포장 작업을 먼저 시작하세요"; if(!PS.box.open||PS.box.full) return "박스가 아직 교체되지 않았습니다 (작업자 2)"; if(!at.length) return "작업대에 판독할 병이 없습니다"; psScan(at[0]); }
function pcPut(){ const end=PK_END(), at=PKG.list.filter(q=>q.s>=end-(PK.bottle.r*2+8)*25).sort((a,b)=>b.s-a.s);
  if(!PS.box.ready&&PS.box.n===0) return "박스를 먼저 조립하세요"; if(!at.length) return "작업대에 병이 없습니다"; for(let k=0;k<Math.min(8,at.length)&&PS.box.n<PS.boxN;k++) psScan(at[k]); }
function pcBoxMake(){ if(PS.box.ready||PS.box.n>0) return "이미 조립된 박스가 있습니다"; PS.box.ready=true; PS.box.flat=Math.max(0,PS.box.flat-1); }
function pcSeal(){ if(!PS.box.full) return "박스가 아직 다 차지 않았습니다"; PS.box.sealed=true; }
function pcLabel(){ if(!PS.box.sealed) return "봉함한 뒤 라벨을 붙입니다"; if(PS.ag.pending) return "AG 라벨이 아직 발행되지 않았습니다 — AG 라벨지 교체"; PS.box.labeled=true; }
function pcPallet(){ if(!PS.box.sealed||(PS.rx&&!PS.box.labeled)) return PS.rx?"봉함 · AG 라벨 부착 후 적재합니다":"봉함 후 적재합니다"; psBoxAway(); PS.box.ready=false; PS.box.sealed=false; PS.box.labeled=false; PS.box.full=false; }
/* ── 화면 : 타일 · 안내판 · 대화창 ── */
function pcDlg(html,btns){ const d=$("#pDlg"); d.innerHTML='<div class="box">'+html+'<div class="bt">'+btns.map((b,i)=>'<button data-i="'+i+'">'+b[0]+'</button>').join("")+'</div></div>'; d.hidden=false;
  d.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{ const f=btns[+b.dataset.i][1]; if(f&&f()===false) return; d.hidden=true; }); }
function pcToast(t){ const e=$("#pToast"); e.textContent=t; e.hidden=false; clearTimeout(pcToast.h); pcToast.h=setTimeout(()=>e.hidden=true,2600); }
function pcDed(n,why){ PC.score=Math.max(0,PC.score-n); PC.ded.push(why+" −"+n); }
/* F1 · 힌트 버튼 (세 IDT 공통) : 학습 = 다음 작업 안내 / 평가 = 단계마다 한 번 −5 점, 그 단계의 타일 · 조작 지점 표시 */
function pcHint(){
  if(CREW.inc&&INCB.room==="P"){ const P=PK_INC[INCB.k], f=P&&P.fix[INCB.fi]; if(!INCB.fired||INCB.done){ fpcToast("이상 상황이 아직 없습니다"); return; }
    if(INCB.mode==="exam"&&INCB.hintFi!==INCB.fi){ INCB.hintFi=INCB.fi; INCB.hint=(INCB.hint||0)+1; } fpcToast(f?"다음 조치 : "+f.t:"재가동을 확인합니다"); return; }
  if(!PC.on){ fpcToast("포장 과정이 시작되지 않았습니다"); return; }
  if(PC.mode==="free"){ fpcToast("자유모드 — 순서 · 힌트 없음"); return; }
  if(PC.mode==="demo"){ fpcToast("시연모드 — 안내판의 [시연 실행] 을 누르세요"); return; }
  const st=PC.steps[PC.i]; if(!st||PC.done){ fpcToast("모든 단계를 마쳤습니다"); return; }
  if(isExamP()&&PC.hintI!==PC.i){ PC.hintI=PC.i; PC.hints++; pcDed(5,"힌트 사용"); }
  fpcToast("다음 작업 : "+st.t); pcRender(); }
const pcHintOn=()=>!isExamP()||PC.hintI===PC.i;
/* 과정 결과 (학습 · 평가) */
function pcResult(){ if(PC.mode==="free"||PC.mode==="demo") return; const sec=Math.round((performance.now()-PC.t0)/1000), ex=isExamP();   /* 공통 결과 창 (idt_common/modes.js) */
  idtResOpen({icon:ex?"📝":"📘", head:ex?"평가 결과":"학습 결과", sub:(PC.role==="P2"?"포장실 작업자 2":"포장실 작업자 1")+" · "+(PS.rx?"전문의약품":"일반의약품")+" · "+(PC.deep?"심화":"기본"),
    meta:"소요 "+idtMmss(sec)+" · 진행 "+Math.min(PC.i,PC.steps.length)+" / "+PC.steps.length+" 단계 · 힌트 "+PC.hints+"회",
    score:ex?{v:PC.score, pass:PC.score>=IDT_PASS}:null,
    kpis:[[PS.pallet+" 박스","완성 박스","hi"],[(PS.reworkN||0)+" 병","재투입","ng"],[PS.lab.cnt+" 병","라벨 부착"],[PS.cw.pass+" 병","중량 PASS"]],
    secs:[{h:"단계별 수행",th:["No","단계","결과"],l:[1],rows:PC.steps.map((st,i)=>[i+1,st.t,i<PC.i?"완료":"미완료"])},
          {h:"감점 내역",th:["항목","감점"],l:[0],rows:PC.ded.map(d=>{ const q=/^(.*?)\s*[−-](\d+)$/.exec(d); return q?[q[1],"−"+q[2]]:[d,""]; }),empty:"감점 없음"}],
    btns:[["다시 하기",bRestart,true],["메인화면",goHome],["닫기",null]]}); }
function pcAct(k){ const T=PT[k]; if(!T) return; const st=PC.steps[PC.i];
  if(isExamP()&&!CREW.inc&&st&&st.k!==k&&!["scan","put","agClear","rej"].includes(k)&&PC.on&&!PC.done){ pcDed(3,"순서가 다른 조작 : "+T.nm); }
  const r=T.run(); if(typeof r==="string") pcToast(r); pcRender(); }
function pcRender(){
  const t=$("#pkTiles"); if(!PC.on){ t.innerHTML=""; return; } const L=pcTiles(), st=PC.steps[PC.i], hint=pcHintOn()&&st?st.k:null;
  const html=L.map(k=>{ const T=PT[k], sub=typeof T.sub==="function"?T.sub():T.sub, on=T.st&&T.st(); return '<button class="pt'+(on?" on":"")+(hint===k?" hint":"")+(T.low&&T.low()?" low":"")+'" data-k="'+k+'"><b>'+T.nm+'</b><s>'+(sub||"")+'</s></button>'; }).join("");
  if(t.dataset.h!==html){ t.dataset.h=html; t.innerHTML=html; t.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{ if(document.body.classList.contains("pkfp")){ pcToast("1인칭 — 설비 앞으로 걸어가 조준하고 E / 클릭으로 조작합니다."); return; } pcAct(b.dataset.k); }); }   /* 1인칭 : 타일은 현황만 (CSS 와 이중 · 11/20) */
  const c=$("#pkCoach"), n=PC.steps.length, done=PC.done, ih=typeof incbCoach==="function"&&incbCoach();
  if(PC.mode==="demo"&&!ih){ const k=demobHtml("P");
    if(c.dataset.h!==k){ c.dataset.h=k; c.innerHTML=k; } pcStat(); return; }
  if(ih||PC.mode==="free"){ const k=ih||idtFreeHtml((PC.role==="P2"?"포장실 작업자 2":"포장실 작업자 1")+" · "+(PS.rx?"전문의약품":"일반의약품"),"중량 세팅 없이도 가동합니다.");
    if(c.dataset.h!==k){ c.dataset.h=k; c.innerHTML=k; } pcStat(); return; }
  const role=PC.role==="P2"?"포장실 작업자 2":"포장실 작업자 1", md=(PC.deep?"심화":"기본")+" · "+(PC.mode==="exam"?"평가":PC.mode==="demo"?"시연":"학습");
  const k='<small>'+md+' · '+role+' · '+(PS.rx?"전문의약품":"일반의약품")+' · STEP '+Math.min(PC.i+1,n)+' / '+n+'</small><b>'+(done?"모든 단계를 마쳤습니다":st.t)+'</b><span>'+
    (done?(isExamP()?"점수 "+PC.score+" 점 · "+(PC.score>=80?"합격":"불합격")+(PC.ded.length?" · "+PC.ded.join(", "):""):"수고하셨습니다 — 상단 [메인화면]")
      :(isExamP()?(PC.hintI===PC.i?"힌트 : "+st.t:"평가 진행 중 — 절차에 따라 수행하세요.")+' <button class="hintBtn" data-hint="1"'+(PC.hintI===PC.i?" disabled":"")+'>💡 힌트 보기 · −5점</button>':(st.wait&&!st.wait()?"대기 — ":"")+st.d))+'</span>';
  if(c.dataset.h!==k){ c.dataset.h=k; c.innerHTML=k; }
  pcStat(); }
function pcStat(){
  $("#pkStat").innerHTML='<b>포장 현황</b><div>보관(턴테이블) <i>'+PS.tt.buf+'</i></div><div>라벨 <i>'+PS.lab.cnt+'</i> · 비전 NG <i>'+PS.vis.ng+'</i></div><div>설명서 <i>'+PS.leaf.cnt+'</i></div><div>중량 PASS <i>'+PS.cw.pass+'</i> · −NG <i>'+PS.cw.nNG+'</i> · +NG <i>'+PS.cw.pNG+'</i></div>'+
    '<div>박스 안 <i>'+PS.box.n+' / '+PS.boxN+'</i></div><div>완성 박스 <i>'+PS.pallet+'</i> · 재투입 <i>'+(PS.reworkN||0)+'</i></div>'+(PS.toast&&performance.now()-PS.toastT<4000?'<div class="msg">'+PS.toast+'</div>':'');
}
/* 단계 진행 (0.25 초마다) */
function pcTick(){
  if(!PC.on) return; const st=PC.steps[PC.i];
  if(st&&st.enter&&!st.entered){ st.entered=true; st.enter(); }
  if(st&&(!st.wait||st.wait())&&st.ok()){ PC.i++; if(PC.i>=PC.steps.length){ PC.done=true; pcResult(); } }
  pcMatTick();
  /* 작업자 2 자동 : 박스가 차면 봉함 · 라벨 · 적재 (약 6 초) / 플레이어가 작업자 2 이면 수동 */
  if(PC.mode==="demo"){ PS.auto.w1=true; PS.auto.w2=true; } else { PS.auto.w2=PC.role!=="P2"&&PS.rx; PS.auto.w1=PC.role==="P2"; }
  pcRender();
}
/* 자재 잔량 경고 · 자동 작업자의 교체 */
function pcMatTick(){
  for(const k in PC_MAT){ const m=PC_MAT[k]; if(k==="ag"&&!PS.rx) continue; const v=m.lvl();
    if(v<20&&!PC.warn[k]){ PC.warn[k]=true; psMsg(m.nm+" 잔량 "+Math.round(v)+" % — 교체 준비 ("+(m.devNm?m.devNm+" 한 뒤 교체":"프린터에서 교체")+")"); }
    const auto=k==="ag"?(PS.auto.w2||PS.auto.w1):PS.auto.w1;
    if(auto&&(v<3||(k==="ag"&&PS.ag.pending))){ m.set(); PC.warn[k]=false; psMsg("자동 작업자 — "+m.nm+" 교체"); if(typeof crewMat==="function") crewMat(k); } } }
/* 박스가 차면 : 자동이면 psBoxDone 이 닫음 / 수동(작업자 2 · 일반)이면 대기 */
const _psBoxDone=psBoxDone;
psBoxDone=function(manual){ _psBoxDone(manual); PS.box.full=true; if(!PS.auto.w2) PS.box.closing=0; };
const _psBoxAway=psBoxAway;
psBoxAway=function(){ _psBoxAway(); PS.box.full=false; if(PS.auto.w2){ PS.box.ready=false; PS.box.sealed=false; PS.box.labeled=false; } };
/* 세션 시작 */
function pcStart(role,mode,deep,rx){
  PS.rx=rx; Object.assign(PC,{on:true, role, mode, deep, i:0, score:100, ded:[], done:false, firstOk:false, sample:null, sampleOk:false, rejOk:false, t0:performance.now(), hints:0, hintI:-1, warn:{}});
  PS.lab.roll=PS.pr.ribbon=PS.leaf.roll=100; PS.ag.paper=300; PS.ag.pending=false;
  PS_ACT.allOff(); Object.assign(PS.cw,{set:false,pass:0,nNG:0,pNG:0}); PS.ag.on=false; PS.ag.n=0; PS.ag.list=[]; PS.ag.boxes=0; PS.ag.msg=""; PS.box.n=0; PS.box.done=0; PS.box.closing=0; PS.box.sealed=false; PS.box.labeled=false; PS.box.open=true; PS.box.ready=false; PS.box.full=false; PS.pallet=0; PS.reworkN=0; PS.ag.issued=[]; PS.lab.cnt=0; PS.lab.rej=0; PS.leaf.cnt=0; PS.pr.batch=0; Object.assign(PS.vis,{total:0,good:0,ng:0,log:[],last:"OK"}); PS.tt.buf=deep?140:60; PKG.list=[]; PKG.rejLabN=3; PKG.rejCwN=2;
  if(role==="P2"){ PS_ACT.allOn(); PC.firstOk=true; PC.sampleOk=true; PC.rejOk=true; PS.auto.w1=true; }   /* 시연은 단계 버튼(demob.js) 으로 켬 */
  PC.steps=mode==="free"?[]:pcSteps(); if(mode==="demo"){ PS.auto.w1=true; PS.auto.w2=true; }
  pcRender();
}
function pcStop(){ PC.on=false; pcRender(); }

/* 평가 힌트 버튼 (안내판) */
addEventListener("click",e=>{ if(e.target&&e.target.closest&&e.target.closest("#pkCoach [data-hint]")) pcHint(); });
