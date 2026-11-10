/* ═══════════════════════════════════════════════════════════════════
   교육 과정 — 충전실 과정 · 포장실 과정 × 기본/심화 × 학습/평가
   · 단계 · 배점 : pouch-idt/SCENARIO.md (2단계 승인 11/10)
   · 학습과 평가는 같은 절차 (평가는 안내 없음)
   ═══════════════════════════════════════════════════════════════════ */
const isExam=()=>!!S&&(S.mode==="exam"||S.mode==="examEasy");
const isEasy=()=>!!S&&(S.mode==="easy"||S.mode==="examEasy");
const MODE_NM={easy:"기본모드 · 학습",guide:"심화모드 · 학습",examEasy:"기본모드 · 평가",exam:"심화모드 · 평가"};
const ROOM_NM={F:"충전실 과정",P:"포장실 과정"};
const PASS=80;
const lineRunning=()=>S.room==="F"?S.f.run:S.p.ctRun;

/* ── 라인 클리어런스 (양식 8항목 : 충전실 1~3 · 포장실 4~8) ── */
const CLEAR={
  F:[{t:"충전기 호퍼 내부 반제품 잔량 확인", d:"2층 데크에서 호퍼 1·2·3 내부에 이전 반제품이 남아 있지 않은지 확인합니다.", job:"scoop"},
     {t:"무지 은박 롤 장착 확인", d:"충전기 후면 롤러에 이전 작업 후 장착한 무지(무인쇄) 은박 롤이 끼워져 있는지 확인합니다.", job:"rollOut"},
     {t:"이송용(경사) 컨베이어 파우치 잔량 확인", d:"정렬컨베어(경사 구간 포함)에 이전 파우치가 남아 있지 않은지 확인합니다.", job:"leak"}],
  P:[{t:"정렬부 · 카토너 내부 파우치 잔량 확인", d:"스틱공급장치 정렬부와 카토너 내부(하단 배출부 포함)에 파우치가 남아 있지 않은지 확인합니다.", job:"ctBack"},
     {t:"설명서 자재 잔량 확인", d:"설명서 공급장치에 이전 설명서가 남아 있지 않은지 확인합니다.", job:"leafAdj"},
     {t:"케이스(카톤) 자재 확인 후 제거", d:"카톤 매거진의 이전 카톤을 확인하고 남아 있으면 제거합니다.", job:"magOut"},
     {t:"카토너 · 카톤인쇄기 불량배출부 잔량 확인", d:"카토너 불량품 배출부와 케이스 프린터 리젝터 함이 비어 있는지 확인합니다.", job:"prPow"},
     {t:"중량선별기 · X-ray 불량배출부 잔량 확인", d:"중량선별기 후단 양쪽 배출함(X-ray · 중량선별기)이 비어 있는지 확인합니다.", job:"bin"}]
};
/* ── 문서 · 기록 ── */
const DOCS={
  fIn:{t:"이전 청소표시서 회수 · 공정표시서 작성 · 부착", job:"docF", room:"F"},
  semi:{t:"반제품 출고 · 반제품 입출고 현황 기록", job:"docF", room:"F"},
  fOut:{t:"공정표시서 회수 · 청소표시서 작성 · 부착", job:"docF", room:"F"},
  pIn:{t:"이전 청소표시서 회수 · 공정표시서 작성 · 부착", job:"docP", room:"P"},
  matOut:{t:"카톤 · 설명서 출고 · 카톤 인쇄(제조번호 · 사용기한) 대조", job:"docP", room:"P"},
  pOut:{t:"공정표시서 회수 · 청소표시서 부착", job:"docP", room:"P"}
};
const docSel=k=>$("#mList").classList.contains("on")?'#listBox [data-doc="'+k+'"]':"#tDoc";
/* 다음에 누를 곳 : 여러 조건 중 첫 미완료 */
const firstOf=L=>{ for(const [c,sel] of L){ if(!c()) return typeof sel==="function"?sel():sel; } return null; };
/* 설비 조작반 버튼 (설비 탭을 먼저 선택) */
const panelSel=(mk,id)=>hMach===mk?"#"+id:HMT(mk);

/* ── 단계 정의 ── */
const T_=(k,t,d,plan,ok,o)=>Object.assign({k,t,d,plan,ok},o||{});
const CHK=(job,set,t)=>()=>({job,set,t});
function stepsFill(easy){
  const A=[], f=()=>S.f, p=()=>S.p;
  CLEAR.F.forEach((c,i)=>A.push(T_("lc"+i,"라인 클리어런스 "+(i+1)+" — "+c.t,c.d,()=>"#lcCheck",()=>S.clear.includes(i),{lc:i,pts:easy?4:2})));
  const powerAll=[[()=>f().main,"#fMain"],[()=>f().airV[0],"#fAir1"],[()=>f().airV[1],"#fAir2"],[()=>f().dustV,"#fDust"],[()=>f().panel,"#fPanel"]];
  const matAll=[[()=>f().ibc[0],()=>hmiRoute("fl","xfer",HB("fl_ibc0"))],[()=>f().ibc[2],()=>hmiRoute("fl","xfer",HB("fl_ibc2"))],
    [()=>f().mainLift,"#mLift"],[()=>f().mainFed,"#mScoop"],[()=>f().rollCarry==="red"||f().roll==="red","#mRed"],[()=>f().roll==="red","#mRed"]];
  const offAll=[[()=>!f().filling,"#swFill"],[()=>!f().run&&f().stoppedOnce,"#swStop"],[()=>!f().panel,"#fPanel"],[()=>!f().airV[0],"#fAir1"],[()=>!f().airV[1],"#fAir2"],[()=>!f().main,"#fMain"]];
  if(easy){
    A.push(T_("doc","작업 준비 — 공정표시서 부착 · 반제품 출고 기록","[문서 · 기록] 에서 이전 청소표시서를 회수하고 공정표시서를 부착한 뒤, 반제품 출고 · 입출고 현황을 기록합니다.",
      ()=>firstOf([[()=>S.doc.fIn,()=>docSel("fIn")],[()=>S.doc.semi,()=>docSel("semi")]]),()=>S.doc.fIn&&S.doc.semi,{pts:5}));
    A.push(T_("power","충전기 전원 일괄 (메인 → 압축공기 → 집진 → 판넬)","메인 파워 스위치(히터 예열) → 압축공기 공급밸브 2개 → 2층 상부 집진 밸브 → 컨트롤 판넬 스위치 순으로 켭니다.",()=>firstOf(powerAll),()=>powerAll.every(x=>x[0]()),{pts:8}));
  }else{
    A.push(T_("fIn","이전 청소표시서 회수 · 공정표시서 작성 · 부착","[문서 · 기록] 을 눌러 이전 청소표시서를 회수해 포장지시기록서에 부착하고, 공정표시서를 작성 · 부착합니다.",()=>docSel("fIn"),()=>S.doc.fIn,{pts:2}));
    A.push(T_("semi","반제품 출고 · 반제품 입출고 현황 기록","[문서 · 기록] 에서 반제품 출고와 입출고 현황 기록을 합니다.",()=>docSel("semi"),()=>S.doc.semi,{pts:2}));
    A.push(T_("main","메인 파워 스위치 ON (히터 예열)","[메인 파워] 를 켭니다. 실링 히터가 설정 온도까지 오르도록 실제로는 작업 20분 전에 켭니다.",()=>"#fMain",()=>f().main,{pts:2}));
    A.push(T_("air","압축공기 공급밸브 2개 열기","[압축공기 밸브 1] · [압축공기 밸브 2] 를 엽니다.",()=>firstOf(powerAll.slice(1,3)),()=>f().airV[0]&&f().airV[1],{pts:2}));
    A.push(T_("dust","2층 상부 집진 밸브 열기","[집진 밸브] 를 엽니다. 작업자가 2층 데크로 올라갑니다.",()=>"#fDust",()=>f().dustV,{pts:2}));
    A.push(T_("panel","컨트롤 판넬 스위치 ON","[컨트롤 판넬] 을 켜면 터치스크린이 켜집니다.",()=>"#fPanel",()=>f().panel,{pts:2}));
  }
  A.push(T_("login","터치스크린 로그인","터치스크린에 부여받은 ID · PASSWORD 로 로그인합니다.",()=>HB("fl_login"),()=>!!f().user,{pts:easy?5:2,hmi:true}));
  if(easy){
    A.push(T_("mat","원료 · 자재 일괄 (이송기 1·3 · 주성분 · 은박 롤)","이송기 설정 화면에서 이송기 1(첨가제) · 3(백당)을 켜고, 주성분 STS 용기를 리프터로 올려 2번 호퍼에 스쿱으로 공급한 뒤, 적색 인쇄 은박 롤을 2인 1조로 운반해 장착합니다.",
      ()=>firstOf(matAll),()=>matAll.every(x=>x[0]()),{pts:10,hmi:true}));
    A.push(T_("pre","인쇄 · 비전 · 가동 전 확인","인쇄 · 비전 값은 미리 설정되어 있습니다. JOG 로 한 스텝 작동해 은박 인쇄를 확인하고, 온도 설정 화면에서 PV · SV 일치를 확인합니다.",
      ()=>firstOf([[()=>f().jogDone,"#swJog"],[()=>f().printOk,"#lcCheck"],[()=>f().tempChk,()=>hmiRoute("fl","temp",HB("fl_temp"))]]),()=>f().printOk&&f().tempChk,
      {pts:6,hmi:true,chk:()=>f().jogDone&&!f().printOk?{job:"prn",t:"은박 인쇄 확인",set(){ f().printOk=true; }}:null}));
    A.push(T_("cond","기동 조건 확인 (후 공정 연동 ON · 정렬컨베어 OFF)","조작스위치 2 의 후 공정 연동 ON 을 확인하고, 포장실 쪽 정렬컨베어 가동스위치가 OFF 인지 확인합니다.",
      ()=>firstOf([[()=>f().linkChk,()=>hmiRoute("fl","sw2",HB("fl_linkChk"))],[()=>S.flags.alignOffChk,"#lcCheck"]]),()=>f().linkChk&&S.flags.alignOffChk,
      {pts:5,hmi:true,chk:()=>f().linkChk&&!S.flags.alignOffChk?{job:"align",t:"정렬컨베어 가동스위치 OFF 확인",set(){ if(S.p.align){ toast("정렬컨베어가 ON 입니다. OFF 로 두어야 합니다.","bad"); return; } S.flags.alignOffChk=true; }}:null}));
    A.push(T_("run","판넬 RESET → RUN","[RESET] 을 누른 뒤 [RUN] 을 누릅니다.",()=>f().resetOnce?"#swRun":"#swReset",()=>f().resetOnce&&f().started,{pts:6}));
  }else{
    A.push(T_("ibc1","이송기 1(첨가제) ON","이송기 설정 화면에서 이송기 1 을 켭니다. 1번 호퍼는 센서 감지로 자동 보충됩니다.",()=>hmiRoute("fl","xfer",HB("fl_ibc0")),()=>f().ibc[0],{pts:2,hmi:true}));
    A.push(T_("ibc3","이송기 3(백당) ON · 2번은 OFF 유지","이송기 3 을 켭니다. 이송기 2 는 사용하지 않습니다(주성분은 스쿱 수동 공급).",()=>hmiRoute("fl","xfer",HB("fl_ibc2")),()=>f().ibc[2]&&!f().ibc[1],{pts:2,hmi:true}));
    A.push(T_("lift","주성분 STS 용기 리프터로 2층 데크에 올림","[주성분 STS 용기] 를 눌러 리프터로 2층 데크에 올립니다.",()=>"#mLift",()=>f().mainLift,{pts:2}));
    A.push(T_("scoop","2번 호퍼에 주성분 스쿱 공급","[주성분 스쿱 공급] 을 눌러 2번 호퍼에 주성분을 공급합니다.",()=>"#mScoop",()=>f().mainFed,{pts:2}));
    A.push(T_("carry","적색 인쇄 은박 롤 2인 1조 운반","[적색 인쇄 은박 롤] 을 눌러 운반 방법을 고릅니다. 은박 롤은 반드시 2인 1조로 옮깁니다.",()=>"#mRed",()=>f().rollCarry==="red"||f().roll==="red",{pts:2}));
    A.push(T_("mount","은박 롤을 롤러에 끼워 고정","[적색 인쇄 은박 롤] 을 다시 눌러 무지 롤을 빼고 롤러에 끼워 고정합니다.",()=>"#mRed",()=>f().roll==="red",{pts:2}));
    A.push(T_("prn","은박 프린터 사용기한 · 배치번호 입력 · 저장","[은박 프린터] 를 눌러 포장지시기록서의 사용기한 · 배치번호를 입력하고 저장합니다.",()=>"#mPrn",()=>f().prn.saved,{pts:3}));
    A.push(T_("jog","한 스텝 작동 후 은박 인쇄 확인","판넬 [JOG] 로 한 스텝 작동한 뒤, 은박 인쇄가 정상인지 · 포장지시기록서와 일치하는지 · 선명한지 확인합니다.",
      ()=>f().jogDone?"#lcCheck":"#swJog",()=>f().printOk,{pts:3,chk:()=>f().jogDone&&!f().printOk?{job:"prn",t:"은박 인쇄 확인",set(){ f().printOk=true; }}:null}));
    A.push(T_("vis","비전 Setup 값 확인 → 비전 ON","비전 Setup 화면 값(촬영속도 5500 mm/s 등)을 확인하고 비전을 켭니다.",()=>hmiRoute("fl","vis",HB(f().visChk?"fl_vision":"fl_visChk")),()=>f().visChk&&f().vision,{pts:2,hmi:true}));
    A.push(T_("temp","온도 설정 화면 PV · SV 일치 확인","온도 설정 화면에서 세로 · 가로 접착 온도 PV 가 SV 에 도달했는지 확인합니다.",()=>hmiRoute("fl","temp",HB("fl_temp")),()=>f().tempChk,{pts:2,hmi:true}));
    A.push(T_("reg","에어 레귤레이터 6 kgf/cm² 확인","충전실 에어 레귤레이터가 6 kgf/cm² 인지 확인합니다.",()=>"#lcCheck",()=>f().regChk,
      {pts:2,chk:()=>({job:"air",t:"에어 레귤레이터 확인",set(){ if(f().airP<5.5){ toast("압축공기 압력이 부족합니다. 밸브를 확인하세요.","bad"); return; } f().regChk=true; }})}));
    A.push(T_("hop","호퍼 내용물 · 필름 적재 상태 확인","2층 데크 호퍼 3기의 내용물과 후면 은박 롤 적재 상태를 확인합니다.",()=>"#lcCheck",()=>f().hopChk,
      {pts:2,chk:()=>({job:"scoop",t:"호퍼 · 필름 상태 확인",set(){ f().hopChk=true; }})}));
    A.push(T_("link","조작스위치 2 '후 공정 연동' ON 확인","조작스위치 2 화면에서 후 공정 연동이 ON 인지 확인합니다.",()=>hmiRoute("fl","sw2",HB("fl_linkChk")),()=>f().linkChk,{pts:2,hmi:true}));
    A.push(T_("alignOff","정렬컨베어 가동스위치 OFF 확인 (포장실 쪽)","정상 제품이 나오기 전까지 카토너로 들어가지 않도록 정렬컨베어 가동스위치가 OFF 인지 확인합니다.",()=>"#lcCheck",()=>S.flags.alignOffChk,
      {pts:2,chk:()=>({job:"align",t:"정렬컨베어 OFF 확인",set(){ if(S.p.align){ toast("정렬컨베어가 ON 입니다. OFF 로 두어야 합니다.","bad"); return; } S.flags.alignOffChk=true; }})}));
    A.push(T_("reset","판넬 RESET","판넬 [RESET] 을 누릅니다.",()=>"#swReset",()=>f().resetOnce,{pts:2}));
    A.push(T_("run","판넬 RUN","판넬 [RUN] 을 누릅니다. 조건이 맞지 않으면 기동되지 않고 감점됩니다.",()=>"#swRun",()=>f().started,{pts:2}));
  }
  A.push(T_("fill","FILLING ON → 제품 공급 · 충전 확인","판넬 [FILLING] 을 켜서 내용물을 충전합니다. 정렬컨베어가 OFF 라 파우치는 공포배출 쪽으로 나갑니다.",
    ()=>f().filling?(f().run?null:"#swRun"):"#swFill",()=>f().filling&&f().run&&f().strokes>=(S.flags.fillAt||0),{pts:easy?6:4}));
  const leakSel=()=>"#tLeak";
  if(easy){
    A.push(T_("leakAlign","기밀도 시험 적합 확인 → 정렬컨베어 ON","[기밀도 시험] 으로 샘플을 채취 · 의뢰하고 결과(적합)를 확인한 뒤, 정렬컨베어 가동스위치를 켭니다.",
      ()=>firstOf([[()=>f().leak.sampled,leakSel],[()=>f().leak.ok,leakSel],[()=>S.p.align,"#tAlign"]]),()=>f().leak.ok&&S.p.align,{pts:6}));
  }else{
    A.push(T_("leak1","기밀도(누수) 시험 샘플 채취 · 의뢰","[기밀도 시험] 을 눌러 샘플을 채취해 의뢰합니다.",leakSel,()=>f().leak.sampled,{pts:2}));
    A.push(T_("leak2","기밀도 시험 결과 적합 확인","[기밀도 시험] 을 다시 눌러 결과를 확인합니다.",leakSel,()=>f().leak.ok,{pts:3}));
    A.push(T_("alignOn","정렬컨베어 가동스위치 ON","정상 제품 배출을 확인한 뒤 [정렬컨베어 스위치] 를 켭니다. 파우치가 포장실로 넘어갑니다.",()=>"#tAlign",()=>S.p.align,{pts:2}));
  }
  A.push(T_("watch","운전 감시 · 연속 생산 ("+PROD.target+"카톤)","목표 "+PROD.target+"카톤(1,800포)을 생산합니다. 성형 · 접착, 인쇄 선명도, R컷팅, 아이마크, 불량 리젝트, 화면 오류를 감시하고, 정기 공정검사(IPC)와 알람에 대응합니다.",
    ()=>null,()=>S.cnt.good>=S.cnt.target&&!S.ipc.open&&!ipcDue(),{pts:easy?15:14,watch:true}));
  A.push(T_("ipc","정기 공정검사(IPC) 실시","100카톤마다(실제 1시간마다) 도징을 원료별로 켜서 채취 · 계량하고 평균 ±4% · 개개 ±8% 기준으로 판정합니다.",()=>null,()=>S.ipc.done>=3,{pts:6}));
  if(easy){
    A.push(T_("off","운전 종료 일괄 (FILLING OFF → STOP → 판넬 → 에어 → 메인)","FILLING OFF → STOP → 컨트롤 판넬 OFF → 압축공기 밸브 잠금 → 메인 파워 OFF 순으로 끕니다.",()=>firstOf(offAll),()=>offAll.every(x=>x[0]()),{pts:6}));
    const endAll=[[()=>f().roll!=="red","#mRollOut"],[()=>f().roll==="plain","#mPlain"],[()=>S.doc.fOut,()=>docSel("fOut")]];
    A.push(T_("end","은박 롤 교체(무지) · 표시서 정리","남은 은박 롤을 제거하고 무지 은박 롤을 장착한 뒤, 공정표시서를 회수하고 청소표시서를 부착합니다.",()=>firstOf(endAll),()=>endAll.every(x=>x[0]()),{pts:4}));
  }else{
    A.push(T_("fillOff","FILLING OFF","판넬 [FILLING] 을 끕니다.",()=>"#swFill",()=>!f().filling,{pts:2}));
    A.push(T_("stop","STOP","판넬 [STOP] 을 누릅니다.",()=>"#swStop",()=>!f().run&&f().stoppedOnce,{pts:2}));
    A.push(T_("panelOff","컨트롤 판넬 전원 OFF","[컨트롤 판넬] 을 끕니다.",()=>"#fPanel",()=>!f().panel,{pts:2}));
    A.push(T_("airOff","에어밸브 잠금","압축공기 밸브 1 · 2 를 잠급니다.",()=>firstOf(offAll.slice(3,5)),()=>!f().airV[0]&&!f().airV[1],{pts:2}));
    A.push(T_("mainOff","메인 파워 스위치 OFF","[메인 파워] 를 끕니다.",()=>"#fMain",()=>!f().main,{pts:2}));
    A.push(T_("rollOut","남은 은박 롤 제거","[은박 롤 제거] 를 눌러 남은 적색 인쇄 은박 롤을 뺍니다.",()=>"#mRollOut",()=>f().roll!=="red",{pts:2}));
    A.push(T_("rollPlain","무지(무인쇄) 은박 롤 장착","[무지 은박 롤] 을 눌러 다음 작업용 무지 롤을 장착합니다.",()=>"#mPlain",()=>f().roll==="plain",{pts:2}));
    A.push(T_("fOut","공정표시서 회수 · 청소표시서 작성 · 부착","[문서 · 기록] 에서 공정표시서를 회수해 포장지시기록서에 부착하고 청소표시서를 부착합니다.",()=>docSel("fOut"),()=>S.doc.fOut,{pts:1}));
  }
  return A;
}
function stepsPack(easy){
  const A=[], p=()=>S.p;
  CLEAR.P.forEach((c,i)=>A.push(T_("lc"+i,"라인 클리어런스 "+(i+4)+" — "+c.t,c.d,()=>"#lcCheck",()=>S.clear.includes(i),{lc:i,pts:easy?3:2})));
  const xrOn=[[()=>p().xrPow,"#pXr"],[()=>xrReady(),()=>null],[()=>p().xrKey,"#pXrKey"]];
  const powerAll=[[()=>p().ctMain,"#pCtMain"],[()=>p().sfSw,"#pSfSw"],[()=>p().ctAir,"#pCtAir"],[()=>p().hm,"#pHm"],[()=>p().cwPow,"#pCw"],
    ...xrOn,[()=>p().prMain&&p().prPow,"#pPr"]];
  const ctIconSel=()=>{ const I=p().ctIcons||[false,false,false]; const i=I.findIndex(x=>!x); return hmiRoute("ct",null,HB("ct_i"+(i<0?0:i))); };
  const ctStart=[[()=>p().ctIcon,ctIconSel],[()=>p().ctReset||p().ctRun,()=>panelSel("ct","ctReset")],[()=>p().ctRun,()=>panelSel("ct","ctStart")]];
  const sfStart=[[()=>p().sfServo,()=>hmiRoute("sf",null,HB("sf_servo"))],[()=>p().sfFeed,()=>hmiRoute("sf",null,HB("sf_feed"))],[()=>p().sfReset||p().sfRun,()=>panelSel("sf","sfReset")],[()=>p().sfRun,()=>panelSel("sf","sfStart")]];
  const xrRun=[[()=>p().xrPre,()=>hmiRoute("xr",null,HB("xr_pre"))],[()=>p().xrX,()=>hmiRoute("xr",null,HB("xr_x"))],[()=>p().xrCal,()=>hmiRoute("xr",null,HB("xr_cal"))],[()=>p().xrConv,()=>hmiRoute("xr",null,HB("xr_conv"))]];
  const xrTest=[...xrRun,[()=>p().xrTest,()=>hmiRoute("xr",null,HB("xr_test"))]];
  const prLbl=[[()=>p().lbl.lot,()=>hmiRoute("pr","edit",HB("pr_lot"))],[()=>p().lbl.exp,()=>hmiRoute("pr","edit",HB("pr_exp"))]];
  const prSave=[[()=>p().lbl.saved,()=>hmiRoute("pr","edit",HB("pr_save"))],[()=>p().lbl.loaded,()=>hmiRoute("pr","search",HB("pr_load"))]];
  const vsStart=[[()=>p().vsUser,()=>hmiRoute("vs",null,HB("vs_login"))],[()=>p().vsMode,()=>hmiRoute("vs",null,HB("vs_mode"))],[()=>p().vsRun,()=>hmiRoute("vs",null,HB("vs_start"))]];
  const cwSel=[[()=>p().cwProd,()=>hmiRoute("cw","prod",HB("cw_sel"))],[()=>p().cwChk,()=>hmiRoute("cw","main",HB("cw_chk"))],[()=>p().cwRun,()=>panelSel("cw","cwStart")]];
  const xrOff=[[()=>p().xrSaved,()=>hmiRoute("xr",null,HB("xr_end"))],[()=>!p().xrKey,"#pXrKey"],[()=>!p().xrPow,"#pXr"]];
  const prOff=[[()=>S.flags.prSeqOff,()=>hmiRoute("pr","main",HB("pr_stop"))],[()=>!p().vsRun,()=>hmiRoute("vs",null,HB("vs_stop"))],[()=>S.flags.vsOff,()=>hmiRoute("vs",null,HB("vs_off"))],[()=>!p().prMain,"#pPr"]];
  const sfOff=[[()=>!p().sfRun,()=>panelSel("sf","sfStop")],[()=>p().sfShut>=1,()=>hmiRoute("sf",null,HB("sf_off"))],[()=>p().sfShut===2,()=>hmiRoute("sf",null,HB("sf_yes"))]];
  const ctOff=[[()=>!p().ctRun,()=>panelSel("ct","ctStop")],[()=>!p().ctMain,"#pCtMain"],[()=>!p().ctAir,"#pCtAir"]];
  const all=L=>L.every(x=>x[0]());
  if(easy){
    A.push(T_("doc","작업 준비 — 공정표시서 · 자재 출고 · 카톤 인쇄 대조","[문서 · 기록] 에서 공정표시서를 부착하고, 카톤 · 설명서를 출고해 카톤 인쇄 내용을 포장지시기록서와 대조합니다.",
      ()=>firstOf([[()=>S.doc.pIn,()=>docSel("pIn")],[()=>S.doc.matOut,()=>docSel("matOut")]]),()=>S.doc.pIn&&S.doc.matOut,{pts:4}));
    A.push(T_("power","포장실 설비 전원 일괄","카토너 메인 · 스틱공급장치 스위치 · 압축공기 → 핫멜트 → 중량선별기 → X-ray(주 전원 · 부팅 · X선 키) → 케이스 프린터(메인 · 프린터 전원) 순으로 켭니다.",
      ()=>firstOf(powerAll),()=>all(powerAll),{pts:9}));
    const prep=[[()=>p().ctUser,()=>hmiRoute("ct",null,HB("ct_login"))],[()=>p().sfUser,()=>hmiRoute("sf",null,HB("sf_login"))],[()=>p().mag>0,"#pMag"],[()=>p().leaf>0,"#pLeaf"]];
    A.push(T_("prep","카토너 · 스틱공급장치 로그인 · 카톤 · 설명서 투입","카토너 · 스틱공급장치에 로그인하고 카톤 매거진 · 설명서 공급장치에 자재를 투입합니다.",()=>firstOf(prep),()=>all(prep),{pts:7,hmi:true}));
    const prv=[...vsStart,[()=>p().prRun,()=>hmiRoute("pr","main",HB("pr_start"))]];
    A.push(T_("prv","케이스 프린터 · 비전 시작 (값은 미리 설정)","라벨(LOT · EXP)은 미리 불러와 있습니다. 비전 로그인 → 모드 선택 → 시작 후 프린터 인쇄를 시작합니다.",()=>firstOf(prv),()=>all(prv),{pts:7,hmi:true}));
    A.push(T_("xr","X-ray 기동 · 테스트 운전","X선 → 캘리브레이션 → 컨베이어 순으로 기동하고 테스트 운전('T' · 전량 NG)을 확인합니다. 예약(품목)은 미리 선택되어 있습니다.",()=>firstOf(xrTest),()=>all(xrTest),{pts:7,hmi:true}));
    A.push(T_("cw","중량선별기 품종 확인 · START","품종(002 판콜H)과 기준 105.5 g · −2.0 / +2.0 g 을 확인하고 START 합니다.",()=>firstOf(cwSel),()=>all(cwSel),{pts:7,hmi:true}));
    const both=[...ctStart,...sfStart];
    A.push(T_("ctsf","카토너 · 스틱공급장치 START","카토너 자동 화면의 아이콘 3개를 켜고 리셋 → START, 스틱공급장치는 서보 전원 · 제품 공급 → 리셋 → START 합니다.",()=>firstOf(both),()=>all(both),{pts:7,hmi:true}));
    A.push(T_("align","정렬컨베어 가동스위치 ON","충전기 정상 제품 배출을 확인한 뒤 [정렬컨베어 스위치] 를 켭니다.",()=>"#tAlign",()=>p().align,{pts:5}));
  }else{
    A.push(T_("pIn","이전 청소표시서 회수 · 공정표시서 작성 · 부착","[문서 · 기록] 을 눌러 이전 청소표시서를 회수하고 공정표시서를 부착합니다.",()=>docSel("pIn"),()=>S.doc.pIn,{pts:1}));
    A.push(T_("matOut","카톤 · 설명서 출고 · 카톤 인쇄 대조","자재실에서 카톤 · 설명서를 출고하고 카톤 인쇄 내용(제조번호 · 사용기한)을 포장지시기록서와 대조합니다.",()=>docSel("matOut"),()=>S.doc.matOut,{pts:2}));
    A.push(T_("ctMain","카토너 메인스위치 ON (기계 뒤편)","[카토너 메인] 을 켭니다.",()=>"#pCtMain",()=>p().ctMain,{pts:2}));
    A.push(T_("sfSw","스틱공급장치 스위치 ON (기계 뒤편)","[스틱공급장치 스위치] 를 켭니다.",()=>"#pSfSw",()=>p().sfSw,{pts:2}));
    A.push(T_("ctAir","카토너 압축공기 공급밸브 ON","[카토너 압축공기] 를 엽니다.",()=>"#pCtAir",()=>p().ctAir,{pts:2}));
    A.push(T_("hm","핫멜트 전원 ON","[핫멜트] 를 켭니다. 실제로는 작업 40분 전에 켭니다.",()=>"#pHm",()=>p().hm,{pts:2}));
    A.push(T_("hmOk","핫멜트 세팅 온도 도달 · '가동 가능 표시' 확인","핫멜트 온도가 세팅 온도에 도달해 가동 가능 표시가 초록색인지 확인합니다.",()=>"#lcCheck",()=>S.flags.hmChk,
      {pts:2,chk:()=>({job:"hm",t:"핫멜트 가동 가능 표시 확인",set(){ if(!hmReady()){ toast("아직 세팅 온도에 도달하지 않았습니다.","bad"); return; } S.flags.hmChk=true; }})}));
    A.push(T_("cwPow","중량선별기 전원 ON","[중량선별기 전원] 을 켭니다. 실제로는 작업 30분 전에 켭니다.",()=>"#pCw",()=>p().cwPow,{pts:2}));
    A.push(T_("xrPow","X-ray 주 전원 ON → 부팅 대기","[X-ray 주 전원] 을 켜고 부팅(실제 약 1분)을 기다립니다.",()=>p().xrPow?null:"#pXr",()=>xrReady(),{pts:2}));
    A.push(T_("xrKey","X-ray X선 출력 키 스위치 ON","[X선 키] 를 돌려 켭니다.",()=>"#pXrKey",()=>p().xrKey,{pts:2}));
    A.push(T_("prPow","케이스 프린터 메인 전원 → 프린터 전원 ON","[케이스 프린터 전원] 을 눌러 메인 전원과 하단 프린터 전원을 켭니다.",()=>"#pPr",()=>p().prMain&&p().prPow,{pts:2}));
    A.push(T_("ctLogin","카토너 로그인","카토너 판넬에 ID · PW 로 로그인합니다.",()=>hmiRoute("ct",null,HB("ct_login")),()=>p().ctUser,{pts:2,hmi:true}));
    A.push(T_("sfLogin","스틱공급장치 로그인","스틱공급장치 판넬에 ID · PW 로 로그인합니다.",()=>hmiRoute("sf",null,HB("sf_login")),()=>p().sfUser,{pts:2,hmi:true}));
    A.push(T_("mag","카톤 공급장치에 카톤 투입","[카톤] 을 눌러 매거진에 카톤을 투입합니다.",()=>"#pMag",()=>p().mag>0,{pts:2}));
    A.push(T_("leaf","설명서 공급장치에 설명서 투입","[설명서] 를 눌러 설명서를 투입합니다.",()=>"#pLeaf",()=>p().leaf>0,{pts:2}));
    A.push(T_("vsLogin","비전 로그인 (Operator)","비전시스템 사용자 로그인 화면에서 Operator · PIN 으로 로그인합니다.",()=>hmiRoute("vs",null,HB("vs_login")),()=>p().vsUser,{pts:2,hmi:true}));
    A.push(T_("vsStart","비전 모드(품목) 선택 → 시작","모드를 선택하고 [시작] 을 눌러 상태가 '실행 중'인지 확인합니다.",()=>firstOf(vsStart.slice(1)),()=>p().vsRun,{pts:2,hmi:true}));
    A.push(T_("lbl","프린터 현재 라벨 편집 : LOT · EXP 입력","현재 라벨 편집에서 포장지시기록서의 LOT · EXP 를 입력합니다.",()=>firstOf(prLbl),()=>p().lbl.lot&&p().lbl.exp,{pts:4,hmi:true}));
    A.push(T_("lblSave","라벨 저장 → 라벨 검색 도구에서 불러오기","라벨을 저장하고 라벨 검색 도구에서 불러옵니다.",()=>firstOf(prSave),()=>p().lbl.loaded,{pts:2,hmi:true}));
    A.push(T_("prStart","프린터 인쇄 시작","케이스 프린터 홈에서 [시작] 을 누릅니다.",()=>hmiRoute("pr","main",HB("pr_start")),()=>p().prRun,{pts:2,hmi:true}));
    A.push(T_("xrPre","X-ray 예약(품목) 선택","X-ray 예약 화면에서 pancold-h 를 선택합니다.",()=>hmiRoute("xr",null,HB("xr_pre")),()=>p().xrPre,{pts:2,hmi:true}));
    A.push(T_("xrRun","X선 키 → 캘리브레이션 → 컨베이어 키","X선을 켜고 캘리브레이션 후 컨베이어를 가동합니다.",()=>firstOf(xrRun),()=>p().xrConv,{pts:2,hmi:true}));
    A.push(T_("xrTest","X-ray 테스트 운전 : 'T' 표시 · 전량 NG 확인","테스트 운전으로 'T' 표시와 전량 NG 판정을 확인합니다.",()=>hmiRoute("xr",null,HB("xr_test")),()=>p().xrTest,{pts:3,hmi:true}));
    A.push(T_("cwProd","중량선별기 생산관리 → 품종 전환 (002 판콜H)","생산관리 → 품종전환에서 002 판콜H 를 선택합니다.",()=>hmiRoute("cw","prod",HB("cw_sel")),()=>p().cwProd,{pts:2,hmi:true}));
    A.push(T_("cwChk","기준 105.5 g · 하한 −2.0 g · 상한 +2.0 g 확인","메인 화면의 기준 · 하한 · 상한을 확인합니다.",()=>hmiRoute("cw","main",HB("cw_chk")),()=>p().cwChk,{pts:3,hmi:true}));
    A.push(T_("cwStart","중량선별기 START","중량선별기 [START] 를 누릅니다(녹색 램프).",()=>panelSel("cw","cwStart"),()=>p().cwRun,{pts:2}));
    A.push(T_("ctIcon","카토너 자동 화면 : 카톤 · 설명지 · 제품투입 아이콘 활성","카토너 자동 조작 화면에서 아이콘 3개를 켭니다.",ctIconSel,()=>p().ctIcon,{pts:2,hmi:true}));
    A.push(T_("ctStart","카토너 리셋 → START","카토너 [RESET] 후 [START] 를 누릅니다. 후단 설비가 가동 중이어야 합니다.",()=>firstOf(ctStart.slice(1)),()=>p().ctRun,{pts:2}));
    A.push(T_("sfStart","스틱공급장치 서보 전원 · 제품 공급 → 리셋 → START","자동 화면의 서보 전원 공급 · 제품 공급을 켜고 리셋 → START 합니다.",()=>firstOf(sfStart),()=>p().sfRun,{pts:2,hmi:true}));
    A.push(T_("align","정렬컨베어 가동스위치 ON","충전기 정상 제품 배출을 확인한 뒤 [정렬컨베어 스위치] 를 켭니다.",()=>"#tAlign",()=>p().align,{pts:2}));
  }
  A.push(T_("watch","운전 감시 · 연속 생산 ("+PROD.target+"카톤)","목표 "+PROD.target+"카톤을 생산합니다. 카톤 성형 · 접착, 인쇄 선명도, 불량 리젝트, 화면 오류를 감시하고 이상사례에 대응합니다.",
    ()=>null,()=>S.cnt.good>=S.cnt.target,{pts:easy?18:14,watch:true}));
  if(easy){
    const offAll=[[()=>!p().cwRun,()=>panelSel("cw","cwStop")],...xrOff,...prOff,...sfOff,...ctOff];
    A.push(T_("off","설비 종료 일괄","중량선별기 STOP → X-ray 종료 · 키 · 주 전원 OFF → 프린터 중지 · 비전 정지 · 로그오프 · 전원 OFF → 스틱공급장치 종료 → 카토너 메인 · 압축공기 OFF 순으로 끕니다.",
      ()=>firstOf(offAll),()=>all(offAll),{pts:8,hmi:true}));
  }else{
    A.push(T_("cwStop","중량선별기 STOP","중량선별기 [STOP] 을 누릅니다(빨간 램프).",()=>panelSel("cw","cwStop"),()=>!p().cwRun,{pts:2}));
    A.push(T_("xrOff","X-ray 종료 · 이력 저장 → X선 키 OFF → 주 전원 OFF","종료 키로 이력을 저장하고 X선 키 · 주 전원을 끕니다.",()=>firstOf(xrOff),()=>all(xrOff),{pts:2,hmi:true}));
    A.push(T_("prOff","케이스 프린터 중지 → 비전 정지 · 로그오프 → 전원 OFF","프린터 중지(시퀀스 꺼짐 · 유휴 확인) → 비전 I/O 정지 → 로그오프 → 전원을 끕니다.",()=>firstOf(prOff),()=>all(prOff),{pts:2,hmi:true}));
    A.push(T_("sfOff","스틱공급장치 STOP → 화면 종료 → '예' → Current application","스틱공급장치를 STOP 하고 화면의 전원 버튼 → '예' 를 눌러 종료합니다.",()=>firstOf(sfOff),()=>all(sfOff),{pts:2,hmi:true}));
    A.push(T_("ctOff","카토너 STOP → 메인스위치 OFF → 압축공기 OFF","카토너를 STOP 하고 [카토너 메인] 을 끈 뒤 [카토너 압축공기] 를 잠급니다.",()=>firstOf(ctOff),()=>all(ctOff),{pts:2}));
  }
  const endAll=[[()=>p().mag<=0&&p().leaf<=0,"#pMagOut"],[()=>S.doc.pOut,()=>docSel("pOut")]];
  A.push(T_("end","매거진 카톤 · 설명서 전량 제거 · 표시서 정리","[매거진 자재 제거] 로 카톤 · 설명서를 전량 제거하고, 공정표시서를 회수 · 청소표시서를 부착합니다.",()=>firstOf(endAll),()=>all(endAll),{pts:easy?6:3}));
  return A;
}
let STEPS_CACHE=null;
function STEPS(){ if(!STEPS_CACHE) STEPS_CACHE=S.room==="F"?stepsFill(isEasy()):stepsPack(isEasy()); return STEPS_CACHE; }
const curStep=()=>STEPS()[S.tIdx];

/* ═══ 세션 ═══ */
function startSession(mode,room){
  room=room||(S&&S.room)||"F";
  initState(); lineInit(); STEPS_CACHE=null; hintOn=false;
  S.room=room; S.mode=mode; S.session={active:true, ended:false, start:performance.now(), sec:0};
  S.flags.fault={};
  if(room==="F") presetPackAuto(); else presetFillAuto();
  if(isEasy()) presetEasy();
  hMach=room==="F"?"fl":"sf"; hScr=hMach==="fl"?"run":"main";
  if(isExam()) scheduleExamTrouble();
  if(typeof buildTiles==="function") buildTiles();
  buildStatic(); cam.fp=null; camSet(room==="F"?"fill":"pack"); drawHMI(); renderCoach(); renderTiles();
  S.stepAt=tSim;
  if(typeof fpSet==="function") fpSet(FP.want);
}
/* 충전실 과정 : 포장실 설비는 가동 상태 (정렬컨베어 스위치만 작업자 조작) */
function presetPackAuto(){
  Object.assign(S.p,{ctMain:true, sfSw:true, ctAir:true, hm:true, hmT:172, cwPow:true, xrPow:true, xrBoot:1, xrKey:true, prMain:true, prPow:true,
    ctUser:true, sfUser:true, mag:9999, leaf:9999, vsUser:true, vsMode:true, vsRun:true, prRun:true,
    xrPre:true, xrX:true, xrCal:true, xrConv:true, xrTest:true, cwProd:true, cwChk:true, cwRun:true,
    ctIcon:true, ctIcons:[true,true,true], ctRun:true, sfServo:true, sfFeed:true, sfRun:true, align:false});
  S.p.lbl={lot:EXPECT.lot, exp:EXPECT.exp, saved:true, loaded:true};
  S.hop={add:100, main:0, sug:100};
}
/* 포장실 과정 : 충전기는 가동 준비 완료 · 카토너 연동 자동 운전 */
function presetFillAuto(){
  Object.assign(S.f,{main:true, airV:[true,true], airP:6, dustV:true, panel:true, user:"PK2", heat:S.f.heatSV, ibc:[true,false,true],
    mainLift:true, mainFed:true, roll:"red", jogDone:true, printOk:true, visChk:true, vision:true, tempChk:true, regChk:true, hopChk:true,
    linkChk:true, filling:true, started:true});
  S.f.prn={exp:EXPECT.exp, lot:EXPECT.lot, saved:true};
  S.hop={add:100, main:100, sug:100};
}
/* 기본모드 : 인쇄값 · 비전값 · 설비 품목은 미리 설정 (확인만) */
function presetEasy(){
  if(S.room==="F"){ S.f.prn={exp:EXPECT.exp, lot:EXPECT.lot, saved:true}; Object.assign(S.f,{visChk:true, vision:true, regChk:true, hopChk:true}); }
  else{ S.p.lbl={lot:EXPECT.lot, exp:EXPECT.exp, saved:true, loaded:true}; Object.assign(S.p,{vsMode:true, xrPre:true, cwProd:true, cwChk:true}); S.flags.hmChk=true; }
}
function stepCheck(){
  if(!S||!S.session||!S.session.active||S.session.ended) return;
  if(S.activeTrouble){ recoveryCheck(); return; }
  ipcCheck();
  let guard=0;
  while(guard++<60){
    const st=curStep(); if(!st) break;
    let ok=false; try{ ok=!!st.ok(); }catch(e){}
    if(!ok) break;
    S.stepLog.push({k:st.k,t:st.t,i:S.tIdx,at:tSim,dt:tSim-S.stepAt,pts:st.pts||0});
    S.tIdx++; S.stepAt=tSim;
    if(st.k==="run"||st.k==="reset") S.flags.fillAt=S.f.strokes+2;
    if(S.tIdx>=STEPS().length){ finishSession(); return; }
  }
  renderCoach();
}
/* 포장실 과정 : 충전기 호퍼 자동 보충 (충전실 작업자 담당) */
function autoRoomTick(){
  if(!S||!S.session||!S.session.active) return;
  if(S.room==="P"){ S.hop.main=Math.max(S.hop.main,60); }
}

/* ═══ 감점 · 점수 ═══ */
const PENALTY={startBad:["조건 미충족 RUN · START",5],alignOn:["정렬컨베어 ON 상태로 충전 시작",5],doorRun:["운전 중 안전도어 개방",5],
  wrong:["알람 · 이상사례 원인 판단 오류",5],oneCarry:["은박 · STS 용기 1인 운반",3],login:["로그인 실패",2],hint:["힌트 사용",5],emg:["불필요한 비상정지",2]};
function deduct(k,why){
  if(!S||!S.session||!S.session.active) return;
  const p=PENALTY[k]||[why||k,3];
  S.deducts.push({k,why:why||p[0],pts:p[1],at:tSim});
}
function scoreNow(){
  const A=STEPS(), tot=A.reduce((s,x)=>s+(x.pts||0),0);
  const got=S.stepLog.reduce((s,x)=>s+(x.pts||0),0);
  const minus=S.deducts.reduce((s,x)=>s+x.pts,0);
  if(!tot) return {base:0, minus, score:0};
  return {base:Math.round(got/tot*100), minus, score:Math.max(0,Math.round(got/tot*100)-minus)};
}
function finishSession(manual){
  if(!S.session||S.session.ended) return;
  S.session.ended=true; S.session.active=false;
  S.session.sec=(performance.now()-S.session.start)/1000;
  for(const id of ["#mInc","#mList","#mCarry"]) $(id).classList.remove("on");
  if(typeof apStop==="function") apStop();
  showResult(manual);
}

/* ═══ 정기 공정검사 (IPC) — 100카톤마다 1회차 (실제 1시간마다) ═══ */
const DOSE_NEED={add:[true,false,false], main:[false,true,false], sug:[false,false,true], all:[true,true,true]};
const IPC_DOSE_NM=["도징1(첨가제)","도징2(주성분)","도징3(백당)"];
function ipcDue(){
  if(S.room!=="F"||S.ipc.open) return false;
  if(S.ipc.forced) return true;
  return S.ipc.done<IPC_ROUNDS.length&&S.cnt.carton>=(S.ipc.done+1)*IPC_EVERY;
}
function ipcCheck(){
  if(!ipcDue()||S.activeTrouble||!S.f.run) return;
  const I=S.ipc, forced=!!I.forced;
  I.open=true; I.forcedRun=forced; I.forced=false;
  I.targets=forced?["main"]:IPC_ROUNDS[Math.min(I.done,IPC_ROUNDS.length-1)];
  I.cur=0; I.res={}; I.restore=false;
  I.round=forced?I.done:I.done+1;
  beep(660,0.15,"sine",0.05);
  showBanner(forced?"충전량 확인 — 주성분 추가 채취 · 계량":"정기 공정검사(IPC) "+I.round+"회차 — 1시간마다 실시 (IDT : 100카톤마다)");
  renderIpc();
}
/* 다이얼 편차가 반영된 원료별 1포 중량 */
function ipcWeigh(k){
  const d=S.f.dial, one=q=>IPC_STD[q].std*(1+(d[q]||0));
  const m=k==="all"?one("add")+one("main")+one("sug"):one(k);
  const list=[]; for(let i=0;i<IPC_STD[k].n;i++) list.push(Math.round((m+gauss()*IPC_STD[k].std*0.011)*1000)/1000);
  const avg=list.reduce((s,v)=>s+v,0)/list.length;
  return {list, avg, min:Math.min(...list), max:Math.max(...list)};
}
/* 현재 IPC 할 일 */
function ipcStep(){
  const I=S.ipc; if(!I.open) return null;
  const f=S.f;
  if(I.cur<I.targets.length){
    const k=I.targets[I.cur], need=DOSE_NEED[k], r=I.res[k];
    if(r&&r.pass) return {k:"next",sel:"#ipcNext",t:IPC_STD[k].nm+" 적합 — 다음 대상으로 넘어갑니다."};
    if(r&&!r.pass&&!r.stale) return {k:"wait",sel:null,t:"부적합 — 원인을 판단하고 조치합니다."};
    for(let i=0;i<3;i++) if(f.dose[i]!==need[i]) return {k:"dose",sel:hmiRoute("fl","sw1",HB("fl_dose"+i)),t:"조작스위치 1 에서 "+IPC_DOSE_NM[i]+" 를 "+(need[i]?"ON":"OFF")+" 합니다 ("+IPC_STD[k].nm+(k==="all"?" : 3종 모두 ON":" 만 충전")+")."};
    if(!f.run) return {k:"run",sel:"#swRun",t:"[RUN] 으로 운전을 재개해 채취합니다."};
    return {k:"take",sel:"#ipcTake",t:IPC_STD[k].nm+" "+IPC_STD[k].n+"포를 채취해 계량합니다."};
  }
  for(let i=0;i<3;i++) if(!f.dose[i]) return {k:"dose",sel:hmiRoute("fl","sw1",HB("fl_dose"+i)),t:"채취를 마쳤습니다. "+IPC_DOSE_NM[i]+" 를 다시 ON 합니다."};
  return {k:"done",sel:"#ipcDone",t:"결과를 기록하고 공정검사를 마칩니다."};
}
function ipcTake(){
  const I=S.ipc, h=ipcStep(); if(!h||h.k!=="take") return;
  const k=I.targets[I.cur], w=ipcWeigh(k), j=ipcJudge(k,w);
  I.res[k]=Object.assign(w,{pass:j.avg&&j.each, jAvg:j.avg, jEach:j.each});
  (I.log=I.log||[]).push({round:I.round,k,avg:w.avg,pass:I.res[k].pass});
  if(!I.res[k].pass){ toast(IPC_STD[k].nm+" 충전량 부적합 — 평균 "+fmt(w.avg,3)+" g","bad"); if(!S.activeTrouble) beginRecovery("F1"); }
  else toast(IPC_STD[k].nm+" 적합 — 평균 "+fmt(w.avg,3)+" g","good");
  renderIpc(); stepCheck();
}
function ipcNext(){ const I=S.ipc, h=ipcStep(); if(!h||h.k!=="next") return; I.cur++; renderIpc(); stepCheck(); }
function ipcDone(){
  const I=S.ipc, h=ipcStep(); if(!h||h.k!=="done") return;
  I.open=false; if(!I.forcedRun) I.done++;
  toast(I.forcedRun?"충전량 확인 완료":"정기 공정검사 "+I.round+"회차 완료","good");
  renderIpc(); stepCheck();
}
function renderIpc(){
  const P=$("#ipcPanel"); if(!P) return;
  const I=S&&S.ipc;
  if(!I||!I.open){ P.hidden=true; return; }
  const h=ipcStep();
  const rows=I.targets.map((k,i)=>{ const r=I.res[k], s=IPC_STD[k];
    return '<tr class="'+(i===I.cur?"cur":"")+'"><td class="l">'+s.nm+'</td><td>'+fmt(s.std,3)+'</td><td>'+s.n+'</td><td>'+(r?fmt(r.avg,3):"-")+'</td><td>'+(r?fmt(r.min,3)+" ~ "+fmt(r.max,3):"-")+'</td><td class="'+(r?(r.pass?"ok":"ng"):"")+'">'+(r?(r.pass?"적합":(r.stale?"재측정":"부적합")):"-")+'</td></tr>'; }).join("");
  const html='<div class="ipcH">🧪 '+(I.forcedRun?"충전량 추가 확인":"정기 공정검사 "+I.round+"회차")+'<s>1시간마다 실시 · 평균 ±4% · 개개 ±8%</s></div>'+
    '<table class="ht"><tr><th>대상</th><th>기준 g</th><th>포</th><th>평균</th><th>최소 ~ 최대</th><th>판정</th></tr>'+rows+'</table>'+
    '<div class="ipcT">'+esc(h?h.t:"")+'</div>'+
    '<div class="ipcB"><button id="ipcTake"'+(h&&h.k==="take"?"":" disabled")+'>채취 · 계량</button><button id="ipcNext"'+(h&&h.k==="next"?"":" disabled")+'>다음 대상</button><button id="ipcDone" class="pri"'+(h&&h.k==="done"?"":" disabled")+'>검사 완료</button></div>';
  if(P.dataset.h!==html){ P.innerHTML=html; P.dataset.h=html; $("#ipcTake").onclick=ipcTake; $("#ipcNext").onclick=ipcNext; $("#ipcDone").onclick=ipcDone; }
  P.hidden=false;
}

/* ═══ 평가모드 자동 발생 : 이상사례 1회 → 해결 · 재가동 15초 후 알람 1회 (잠정) ═══ */
const EXAM_ALARMS=["FILM","DOOR","FEED","TSEN","THI","AIR","PRT","VIS","EMP"];
function scheduleExamTrouble(){
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  if(S.room==="F") S.flags.examTrouble={c:pick(["F1","F2","F3"]), a:pick(EXAM_ALARMS), at:20+Math.floor(Math.random()*20), fired:0};
  else { const c=pick(["P1","P2"]); S.flags.examTrouble={c, a:c==="P1"?"P2":"P1", at:20+Math.floor(Math.random()*20), fired:0}; }
}
function examTroubleTick(){
  const f=S.flags.examTrouble;
  if(!f||f.fired>=2||S.activeTrouble||S.flags.casePending||S.ipc.open||!lineRunning()) return;
  if(f.fired===0&&S.cnt.carton>=f.at){ f.fired=1; launchIncident(f.c,true); return; }
  if(f.fired===1&&S.flags.resolvedAt!=null&&tSim-S.flags.resolvedAt>15&&!(f.c==="F1"&&S.f.dial.main<0)){ f.fired=2; launchIncident(f.a,true); }
}

/* ═══ 알람 (충전기 15종) — 원인 · 조치는 SOP 해결방안 요약 ═══ */
const FX=(x,y,z,job,t,fn,o)=>Object.assign({fix:[x,y,z],t,done:()=>!S.flags.fault[fn],act(){ return startWork(job,()=>{ S.flags.fault[fn]=false; toast("조치 완료","good"); }); }},o||{});
const flt=k=>()=>{ S.flags.fault[k]=true; raise(k); };
const INC={
  FILM:{nm:"필름 단절", mk:"fl", fire(){ S.f.roll="none"; S.f.rollCarry=null; raise("FILM"); },
    q:"충전기가 '필름 단절' 알람으로 정지했습니다. 원인과 조치로 옳은 것은?", a:"은박 필름 소진 → 새 적색 인쇄 은박 롤을 2인 1조로 운반해 교체한다",
    w:["필름 센서를 끄고 운전한다","무지 은박 롤을 끼우고 그대로 생산한다","실링 온도를 올린다"],
    fix:[{sel:"#mRed",t:"[적색 인쇄 은박 롤] 을 2인 1조로 운반합니다.",done:()=>S.f.rollCarry==="red"||S.f.roll==="red"},{sel:"#mRed",t:"[적색 인쇄 은박 롤] 을 롤러에 장착합니다.",done:()=>S.f.roll==="red"}]},
  DOOR:{nm:"도어 열림", mk:"fl", fire(){ S.f.door="open"; buildStatic(); raise("DOOR"); },
    q:"운전 중 '도어 열림' 알람으로 정지했습니다. 올바른 조치는?", a:"열린 도어를 확인하고 닫은 뒤 RESET → RUN 한다",
    w:["도어 인터락 스위치를 테이프로 막는다","도어를 연 채 RUN 한다","메인 파워를 껐다 켠다"],
    fix:[{sel:"#fDoor",t:"[안전도어] 를 닫습니다.",done:()=>S.f.door==="closed"}]},
  FEED:{nm:"제품공급 단절", mk:"fl", fire(){ S.hop.main=0; raise("FEED"); },
    q:"'제품공급 단절' 알람입니다. 원인과 조치로 옳은 것은?", a:"호퍼 원료가 하한 레벨 센서보다 낮음 → 2번 호퍼에 주성분을 스쿱으로 보충한다",
    w:["레벨 센서를 끈다","이송기 2 를 켜서 주성분을 보낸다","FILLING 을 끄고 계속 운전한다"],
    fix:[{sel:"#mScoop",t:"[주성분 스쿱 공급] 으로 2번 호퍼를 보충합니다.",done:()=>S.hop.main>=50}]},
  TSEN:{nm:"온도센서 이상", mk:"fl", fire:flt("TSEN"),
    q:"'온도센서 이상' 알람입니다. 원인과 조치로 옳은 것은?", a:"히터 단선 · 센서 연결 끊김 → 실링부 와이어 · 퓨즈를 확인해 조치한다",
    w:["온도 설정값을 올린다","알람을 무시하고 RUN 한다","FILLING 을 끈다"],
    fix:[FX(FIL.xc,1500,FIL.z1+40,"front","실링부 히터 와이어 · 퓨즈를 확인합니다 (빨간 ! 누르기).","TSEN")]},
  EMG:{nm:"비상정지", mk:"fl", fire(){ S.f.emg=true; S.f.run=false; raise("EMG"); },
    q:"'비상정지' 알람입니다. 올바른 조치는?", a:"비상정지 원인 상황을 확인 · 종료한 뒤 비상정지를 해제하고 RESET → RUN 한다",
    w:["비상정지를 누른 채 RESET 한다","메인 파워를 내렸다 올린다","원인 확인 없이 바로 RUN 한다"],
    fix:[{sel:"#swEmg",t:"상황을 확인하고 [EMERGENCY] 를 해제합니다.",done:()=>!S.f.emg}]},
  THI:{nm:"상한온도 이상", mk:"fl", fire:flt("THI"),
    q:"'상한온도 이상' 알람입니다. 원인과 조치로 옳은 것은?", a:"히터가 설정 상한을 넘음 → 정지 상태에서 온도 설정 화면의 히터 설정을 확인한다",
    w:["상한 설정을 최대로 올린다","운전 중 히터를 손으로 확인한다","FILLING 을 끄고 계속 운전한다"],
    fix:[{sel:()=>hmiRoute("fl","temp",HB("fl_temp")),t:"온도 설정 화면에서 PV · SV 를 확인합니다.",hmi:true,pre(){ S.flags.tempRechk=false; },done(){ if(S.flags.tempRechk){ S.flags.fault.THI=false; return true; } return false; }}]},
  MOL:{nm:"모터 과부하", mk:"fl", fire:flt("MOL"),
    q:"'모터 과부하' 알람입니다. 원인과 조치로 옳은 것은?", a:"메인모터 과부하 · 서보 드라이버 이상 → 서보 드라이브 연결을 확인하고 리셋한다",
    w:["모터 속도를 최대로 올린다","알람이 날 때마다 RUN 을 반복한다","구동부에 손을 넣어 돌려 본다"],
    fix:[FX(PANEL_F.x,1100,PANEL_F.z,"panel","판넬 내부 서보 드라이브 연결을 확인합니다 (빨간 ! 누르기).","MOL")]},
  LIM:{nm:"메인서보 리미트", mk:"fl", fire:flt("LIM"),
    q:"'메인서보 리미트' 알람입니다. 원인과 조치로 옳은 것은?", a:"리미트 센서 범위 이탈 → 메인모터 상 · 하한 센서 위치를 확인 · 조정한다",
    w:["리미트 센서를 떼어 낸다","캠 포지션을 임의로 바꾼다","RESET 만 반복한다"],
    fix:[FX(FIL.xc,700,FIL.z1,"front","메인모터 상 · 하한 리미트 센서 위치를 확인합니다 (빨간 ! 누르기).","LIM")]},
  AIR:{nm:"메인 에어단절", mk:"fl", fire(){ S.f.airV[1]=false; raise("AIR"); },
    q:"'메인 에어단절' 알람입니다. 원인과 조치로 옳은 것은?", a:"공급 라인 문제 → 압축공기 밸브 · 에어체크센서를 확인해 복구한다",
    w:["에어 없이 운전한다","에어체크센서를 끈다","레귤레이터를 최대로 올린다"],
    fix:[{sel:()=>!S.f.airV[0]?"#fAir1":!S.f.airV[1]?"#fAir2":null,t:"압축공기 밸브를 확인해 엽니다 (압력 회복 대기).",done:()=>S.f.airV[0]&&S.f.airV[1]&&S.f.airP>=5.5}]},
  CNT:{nm:"카운트 에러", mk:"fl", fire:flt("CNT"),
    q:"'카운트 에러' 알람입니다. 원인과 조치로 옳은 것은?", a:"카운팅 컨베이어 오류 → 서보모터를 확인 · 조치하고 잠시 정지 후 가동한다",
    w:["카운터를 0 으로 바꾸고 계속한다","컨베이어를 손으로 민다","속도를 올린다"],
    fix:[FX(FIL.x0-300,950,CV.z+330,"front","카운팅 컨베이어 서보모터를 확인합니다 (빨간 ! 누르기).","CNT")]},
  ALN:{nm:"정렬기모터 알람", mk:"fl", fire:flt("ALN"),
    q:"'정렬기모터 알람' 입니다. 원인과 조치로 옳은 것은?", a:"정렬컨베어 모터 과부하 · 드라이버 이상 → 모터를 확인 · 조치하고 잠시 정지 후 가동한다",
    w:["정렬컨베어 위 파우치를 운전 중 손으로 정리한다","모터 보호를 해제한다","FILLING 을 끈다"],
    fix:[FX(-3600,CV.y+60,CV.z,"leak","정렬컨베어 모터를 확인합니다 (빨간 ! 누르기).","ALN")]},
  PSV:{nm:"프린터 서보모터 알람", mk:"fl", fire:flt("PSV"),
    q:"'프린터 서보모터 알람' 입니다. 원인과 조치로 옳은 것은?", a:"프린터 모터 과부하 · 드라이버 이상 → 모터를 확인 · 조치하고 잠시 정지 후 가동한다",
    w:["프린터를 끄고 인쇄 없이 생산한다","비전을 끈다","RESET 만 반복한다"],
    fix:[FX(FIL.xc,1500,FIL.z0-180,"prn","후면 프린터 서보모터를 확인합니다 (빨간 ! 누르기).","PSV")]},
  PRT:{nm:"프린터 알람", mk:"fl", fire:flt("PRT"),
    q:"'프린터 알람' 입니다. 원인과 조치로 옳은 것은?", a:"잉크젯 프린터 이상 → 프린터 · 잉크 노즐을 점검한다",
    w:["프린터를 끄고 인쇄 없이 생산한다","비전을 꺼서 배출을 막는다","사용기한을 손으로 적는다"],
    fix:[FX(FIL.xc,1500,FIL.z0-180,"prn","후면 프린터 · 잉크 노즐을 점검합니다 (빨간 ! 누르기).","PRT")]},
  VIS:{nm:"비젼 알람", mk:"fl", fire:flt("VIS"),
    q:"'비젼 알람' 입니다 (비전 NG 2회 이상). 원인과 조치로 옳은 것은?", a:"비전이 인쇄 불량을 연속 검출 → 비전 · 인쇄 상태를 점검 · 조치한다",
    w:["비전을 끄고 운전한다","NG 기준을 완화한다","배출된 파우치를 정상품에 섞는다"],
    fix:[FX(FIL.xc+300,1500,FIL.z0-180,"prn","후면 비전 · 인쇄 상태를 점검합니다 (빨간 ! 누르기).","VIS")]},
  EMP:{nm:"공포감지 알람", mk:"fl", fire:flt("EMP"),
    q:"'공포감지 알람' 입니다 (공포감지센서 2회 이상). 원인과 조치로 옳은 것은?", a:"내용물 없는 파우치가 연속 발생 → 충전(도징 · 노즐) 작동을 확인 · 조치한다",
    w:["공포감지센서를 끈다","공포를 정상품과 함께 보낸다","FILLING 을 끈 채 운전한다"],
    fix:[FX(FIL.xc,NOZ.y,NOZ.z,"front","노즐 · 도징부 충전 작동을 확인합니다 (빨간 ! 누르기).","EMP")]}
};
/* ═══ 이상사례 (주황색 · 알람 아님) ═══ */
const CASES={
  F1:{nm:"충전량 미달", mk:"fl", room:"F", fire(){ S.f.dial.main=-0.06; if(!S.flags.examTrouble||S.flags.examTrouble.c!=="F1"||S.flags.examTrouble.fired>1) S.ipc.forced=true; }, silent:true,
    banner:"정기 공정검사(IPC)에서 주성분 측정 중량이 기준 범위를 벗어났습니다.",
    q:"IPC 결과 주성분 평균이 기준(2.000 g)보다 4% 넘게 낮습니다. 올바른 조치는?", a:"2층 데크 충전량 조절 다이얼에서 미달된 원료(주성분) · 열의 다이얼을 조정하고 재측정한다",
    w:["판정 기준을 ±10% 로 넓힌다","부적합 포를 정상품과 섞는다","백당 다이얼을 올려 총중량을 맞춘다"],
    fix:[{fix:[FIL.xc,DECK.y+200,FIL.z1+10],t:"전면 확장 데크의 주성분 충전량 조절 다이얼을 조정합니다 (빨간 ! 누르기).",done:()=>S.f.dial.main>=0,
      act(){ return startWork("dialF",()=>{ S.f.dial.main=0; const r=S.ipc.res.main; if(r) r.stale=true; renderIpc(); toast("주성분 다이얼 조정 완료 — 재측정합니다","good"); }); }}]},
  F2:{nm:"파우치 인쇄 불량 (사용기한 · 제조번호)", mk:"fl", room:"F", fire(){ S.f.headDirty=true; },
    banner:"비전이 파우치 인쇄 불량을 연속 검출해 배출하고 있습니다.",
    q:"비전이 같은 인쇄 불량을 계속 배출합니다. 원인과 조치로 옳은 것은?", a:"프린터 헤드 오염 · 리본 상태 불량 → 헤드를 세척하고 리본을 점검 · 교체한 뒤 한 스텝 작동해 확인한다",
    w:["비전을 꺼서 배출을 막는다","사용기한을 손으로 적는다","실링 온도를 올린다"],
    fix:[{fix:[FIL.xc,1500,FIL.z0-180],t:"후면 프린터 헤드를 세척하고 리본을 점검 · 교체합니다 (빨간 ! 누르기).",done:()=>!S.f.headDirty,
      act(){ return startWork("prn",()=>{ S.f.headDirty=false; S.f.ribbon=100; toast("헤드 세척 · 리본 교체 완료","good"); }); }},
     {sel:"#swJog",t:"[JOG] 로 한 스텝 작동해 인쇄를 확인합니다.",pre(){ S.f.jogDone=false; },done:()=>S.f.jogDone}]},
  F3:{nm:"파우치 배출 · 정렬 상태 불량", mk:"fl", room:"F", fire(){ S.f.alnBad=true; },
    banner:"정렬컨베어 위 파우치가 틀어지거나 겹쳐서 이동합니다.",
    q:"정렬컨베어 위 파우치가 틀어지고 겹칩니다. 올바른 조치는?", a:"배출 슈트 각도가 맞지 않음 → 정지 후 배출 슈트 각도를 조절한다",
    w:["정렬컨베어 속도를 최대로 올린다","운전 중 손으로 파우치를 정렬한다","가로 실링 온도를 내린다"],
    fix:[{fix:[FIL.xc,1020,CV.z-40],t:"배출 슈트 각도를 조절합니다 (빨간 ! 누르기).",done:()=>!S.f.alnBad,act(){ return startWork("chute",()=>{ S.f.alnBad=false; toast("슈트 각도 조절 완료","good"); }); }}]},
  P1:{nm:"카톤 인쇄 흐려짐", mk:"pr", room:"P", fire(){ S.p.nozzleBad=true; },
    banner:"케이스 프린터 직후 카톤의 제조번호 · 사용기한이 흐려 판독되지 않습니다 (비전 배출 증가).",
    q:"카톤 인쇄가 흐려 판독되지 않습니다. 올바른 조치는?", a:"노즐 오염 · 잉크 부족 → 노즐 세척 · 잉크 카트리지 교체(6mm 육각 렌치, 누출 확인) 후 테스트 인쇄로 확인한다",
    w:["비전을 꺼서 배출을 막는다","흐린 카톤에 손으로 적는다","카토너 속도를 올린다"],
    fix:[{fix:[(PR.x0+PR.x1)/2,700,-120],t:"노즐 세척 · 잉크 카트리지를 교체합니다 (빨간 ! 누르기).",done:()=>!S.p.nozzleBad,act(){ return startWork("ink",()=>{ S.p.nozzleBad=false; S.p.ink=100; toast("노즐 세척 · 카트리지 교체 완료 (누출 없음)","good"); }); }},
     {sel:()=>hmiRoute("pr","main",HB("pr_test")),t:"케이스 프린터 홈에서 [테스트 인쇄] 로 선명도를 확인합니다.",hmi:true,pre(){ S.flags.prTest=false; },done:()=>S.flags.prTest}]},
  P2:{nm:"설명지 미삽입", mk:"ct", room:"P", fire(){ S.p.leafBad=true; },
    banner:"설명지 삽입 확인 결과 카톤 안에 설명지가 없습니다 (중량 미달 배출 증가).",
    q:"카톤 안에 설명지가 없습니다. 올바른 조치는?", a:"설명지 공급 · 삽입 위치가 틀어짐 → 정지 후 설명지 공급 · 삽입 위치를 조정한다",
    w:["중량선별기 하한을 낮춘다","설명지 없이 출하한다","카톤을 손으로 열어 넣는다"],
    fix:[{fix:[2600,PK.y+900,CT.z0+250],t:"설명지 공급 · 삽입 위치를 조정합니다 (빨간 ! 누르기).",done:()=>!S.p.leafBad,act(){ return startWork("leafAdj",()=>{ S.p.leafBad=false; toast("설명지 삽입 위치 조정 완료","good"); }); }}]}
};
const incOf=k=>INC[k]||CASES[k];
/* 알람 발생 시 대응 흐름 시작 */
function onAlarm(key){
  if(!S.session||!S.session.active||S.activeTrouble||S.flags.casePending) return;
  if(S.room!=="F"||!INC[key]) return;
  beginRecovery(key);
}
function launchIncident(k,sched){
  const inc=incOf(k); if(!inc) return;
  if(S.activeTrouble||S.flags.casePending){ toast("현재 대응 중인 상황을 먼저 해결하세요.","bad"); return; }
  if(!lineRunning()){ toast("설비가 운전 중일 때 발생시킬 수 있습니다.","bad"); return; }
  if(inc.room&&inc.room!==S.room){ toast("이 과정에서 다룰 수 없는 상황입니다.","bad"); return; }
  inc.fire();
  if(CASES[k]){ if(inc.silent){ showBanner("이상 징후 : 다음 충전량 확인(IPC)에서 확인합니다."); return; }
    S.flags.caseT=tSim; S.flags.casePending=k; showBanner("이상 현상 : "+inc.banner); }
  else if(!S.activeTrouble) beginRecovery(k);
}
function caseTick(){
  autoRoomTick();
  const k=S.flags.casePending;
  if(!k||S.activeTrouble) return;
  if(tSim-S.flags.caseT>4){ S.flags.casePending=null; beginRecovery(k); }
}
function beginRecovery(k){
  const inc=incOf(k);
  S.flags.casePending=null;
  S.activeTrouble={k,inc,at:tSim};
  const ch=[{t:inc.a,ok:true}].concat(inc.w.map(t=>({t,ok:false})));
  for(let i=ch.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [ch[i],ch[j]]=[ch[j],ch[i]]; }
  S.recovery={accepted:false, choices:ch, wrong:[], fixI:0, reset:false};
  (S.flags.incLog=S.flags.incLog||[]).push({k,nm:inc.nm,at:tSim,kind:CASES[k]?"이상사례":"알람"});
  showBanner((CASES[k]?"이상사례 · ":"알람 · ")+inc.nm, !!CASES[k]);
  renderCoach();
}
/* 대응 단계 : ① 정지 → ② 원인 판단 → ③ 조치 → ④ RESET → ⑤ 재가동 */
function recoveryStep(){
  const T=S.activeTrouble, R=S.recovery; if(!T||!R) return null;
  const P=S.room==="P";
  const stopSel=P?panelSel("ct","ctStop"):"#swStop", startSel=P?(S.p.ctReset?panelSel("ct","ctStart"):panelSel("ct","ctReset")):"#swRun";
  if(!R.phase) R.phase="stop";
  if(R.phase==="stop"){ if(lineRunning()) return {k:"stop",sel:stopSel,t:P?"카토너 [STOP] 을 눌러 정지합니다.":"[STOP] 을 눌러 충전기를 정지합니다.",title:"① 정지"}; R.phase="ask"; if(P) S.p.ctReset=false; }
  if(R.phase==="ask"){ if(!R.accepted) return {k:"ask",sel:"#incAsk",t:"원인과 조치를 판단합니다.",title:"② 원인 판단"}; R.phase="fix"; }
  if(R.phase==="fix"){
    const fx=T.inc.fix;
    while(R.fixI<fx.length){
      const f=fx[R.fixI];
      if(!R.pre) R.pre={};
      if(!R.pre[R.fixI]&&f.pre) f.pre();
      R.pre[R.fixI]=true;
      let d=false; try{ d=f.done(); }catch(e){}
      if(!d) break;
      R.fixI++;
    }
    if(R.fixI<fx.length){ const f=fx[R.fixI];
      const sel=f.fix?"#fixBtn":(typeof f.sel==="function"?f.sel():f.sel);
      return {k:"fix",sel,t:f.t,title:"③ 조치",f}; }
    R.phase="reset";
  }
  if(R.phase==="reset"){
    if(!P&&tripAlarms().length) return {k:"reset",sel:"#swReset",t:"[RESET] 을 눌러 알람을 해제합니다.",title:"④ 알람 해제"};
    R.phase="start";
  }
  if(R.phase==="start"){ if(!lineRunning()) return {k:"start",sel:startSel,t:P?"카토너 [RESET] → [START] 로 재가동합니다.":"[RUN] 을 눌러 재가동합니다.",title:"⑤ 재가동"}; R.phase="done"; }
  return null;
}
function recoveryCheck(){
  const h=recoveryStep();
  if(!h&&S.activeTrouble){
    toast("조치 완료 — 정상 운전으로 복귀했습니다.","good");
    S.activeTrouble=null; S.recovery=null; S.flags.resolvedAt=tSim; hideBanner();
    stepCheck();
  }
  renderCoach();
}
function openIncidentAsk(){
  const T=S.activeTrouble, R=S.recovery; if(!T||!R) return;
  const box=$("#incBox"), cs=!!CASES[T.k];
  box.className="mbox"+(cs?" case":"");
  box.innerHTML='<h2>'+(cs?"🟧 이상사례 · ":"🚨 알람 · ")+esc(T.inc.nm)+'</h2><p>'+esc(T.inc.q)+'</p>'+R.choices.map((c,i)=>'<button class="choice'+(R.wrong.includes(i)?" bad":"")+'" data-i="'+i+'">'+esc(c.t)+'</button>').join("");
  $$("#incBox .choice").forEach(b=>b.onclick=()=>{
    const i=+b.dataset.i, c=R.choices[i];
    if(c.ok){ b.classList.add("good"); R.accepted=true; toast("정답 — 조치를 진행합니다.","good"); setTimeout(()=>{ $("#mInc").classList.remove("on"); recoveryCheck(); },650); }
    else { if(!R.wrong.includes(i)){ R.wrong.push(i); deduct("wrong"); } b.classList.add("bad"); toast("다시 판단하세요.","bad"); }
  });
  $("#mInc").classList.add("on");
}
