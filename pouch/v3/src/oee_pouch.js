/* ═══════════════════════════════════════════════════════════════════
   OEE 연계 교육 — 파우치 라인 설정 (oee/oee.js 공통 모듈에 넘김)
   부동 유형 코드 = IDT 알람 15종 + 이상사례 5종과 1:1 (SCENARIO.md 11절 결정 2) · kw = 자유 기재 사유를 분류하는 낱말(정규식)
   ═══════════════════════════════════════════════════════════════════ */
const OEE_POUCH_CODES=[
  {k:"FILM", nm:"필름(은박) 단절", inc:"FILM", room:"F", kw:["필름","은박.*(단절|끊|교체)","롤\\s*교체"]},
  {k:"DOOR", nm:"도어 열림", inc:"DOOR", room:"F", kw:["도어","안전\\s*커버"]},
  {k:"FEED", nm:"제품(원료) 공급 단절", inc:"FEED", room:"F", kw:["원료.*(공급|부족|단절)","호퍼","이송기"]},
  {k:"TSEN", nm:"온도센서 이상", inc:"TSEN", room:"F", kw:["온도\\s*센서","히터\\s*(단선|와이어)","퓨즈"]},
  {k:"EMG",  nm:"비상정지", inc:"EMG", room:"F", kw:["비상\\s*정지","EMG","EMERGENCY"]},
  {k:"THI",  nm:"실링 상한온도 이상", inc:"THI", room:"F", kw:["상한\\s*온도","실링\\s*온도","과열"]},
  {k:"MOL",  nm:"모터 과부하", inc:"MOL", room:"F", kw:["과부하","서보\\s*드라이브"]},
  {k:"LIM",  nm:"메인서보 리미트", inc:"LIM", room:"F", kw:["리미트"]},
  {k:"AIR",  nm:"메인 에어 단절", inc:"AIR", room:"F", kw:["에어","공압","압축\\s*공기"]},
  {k:"CNT",  nm:"카운트 에러", inc:"CNT", room:"F", kw:["카운트","카운팅"]},
  {k:"ALN",  nm:"정렬기(배출 컨베이어) 모터 알람", inc:"ALN", room:"F", kw:["정렬기","정렬\\s*컨베","배출\\s*컨베"]},
  {k:"PSV",  nm:"은박 프린터 서보모터 알람", inc:"PSV", room:"F", kw:["프린터\\s*서보"]},
  {k:"PRT",  nm:"은박 프린터 알람", inc:"PRT", room:"F", kw:["은박\\s*프린터","리본","열전사"]},
  {k:"VIS",  nm:"비전 알람", inc:"VIS", room:"F", kw:["비전","비젼"]},
  {k:"EMP",  nm:"공포(빈 파우치) 감지", inc:"EMP", room:"F", kw:["공포","빈\\s*파우치","미충전"]},
  {k:"F1",   nm:"충전량 미달", inc:"F1", room:"F", kw:["충전량","중량\\s*미달","함량"], goal:"충전량 확인(IPC) 결과를 판정하고 다이얼을 조정한 뒤 재측정한다."},
  {k:"F2",   nm:"파우치 인쇄 불량 (사용기한 · 제조번호)", inc:"F2", room:"F", kw:["파우치.*인쇄","날인","사용기한"]},
  {k:"F3",   nm:"파우치 배출 · 정렬 불량", inc:"F3", room:"F", kw:["배출\\s*불량","슈트","정렬\\s*불량"]},
  {k:"P1",   nm:"카톤 인쇄 흐려짐", inc:"P1", room:"P", kw:["카톤.*인쇄","잉크","노즐"]},
  {k:"P2",   nm:"설명지 미삽입", inc:"P2", room:"P", kw:["설명(지|서)"]},
  {k:"ETC",  nm:"기타 · 미분류 (IDT 실습 없음)", inc:null, room:null, kw:[]}
].map(c=>Object.assign(c,{roomNm:c.room==="F"?"충전실 실습":c.room==="P"?"포장실 실습":""}));
function oeeInit(){
  OEEEDU.init({line:"파우치", title:"파우치 라인 · 부동 원인 기반 맞춤 교육", codes:OEE_POUCH_CODES, mount:$("#app"),
    /* 실습 : 해당 실을 운전 중 상태로 만든 뒤 그 이상 상황을 발생시킴 (학습 모드 · 대응 절차는 기존 IDT 와 동일) */
    start(c){ $("#splash").classList.add("hide"); startSession("guide",c.room); presetFillAuto(); presetPackAuto(); S.p.align=true; if(c.room==="F"){ S.f.run=true; S.f.started=true; } S.flags.oeePractice=c.k;
      renderTiles(); drawHMI(); toast("OEE 연계 실습 : "+c.nm+" — 잠시 뒤 상황이 발생합니다.");
      setTimeout(()=>{ if(S&&S.session&&S.session.active&&S.flags.oeePractice===c.k){ if(!lineRunning()){ if(c.room==="F") S.f.run=true; else S.p.ctRun=true; } launchIncident(c.inc); } },2500); },
    active:()=>!!(S&&S.session&&S.session.active&&(S.activeTrouble||S.flags.casePending)),
    done(c){ toast("실습 완료 : "+c.nm+" — [OEE 연계 교육 › ④ 교육 효과] 에 기록했습니다.","good"); }});
  const sp=$("#coursePicker"); if(sp&&!$("#oeeOpen")){ sp.insertAdjacentHTML("afterend",'<div style="text-align:center"><button id="oeeOpen">📊 OEE 연계 교육 (부동 원인 분석 → 맞춤 실습)</button></div>'); $("#oeeOpen").onclick=()=>OEEEDU.open(); }
  const hb=$("#rubricBtn"); if(hb&&!$("#oeeBtn")){ hb.insertAdjacentHTML("beforebegin",'<button class="gbtn" id="oeeBtn">📊 OEE 교육</button>'); $("#oeeBtn").onclick=()=>OEEEDU.open(); }
}
