/* ═══════════════════════════════════════════════════════════════════
   OEE 연계 교육 — 파우치 라인 설정 (oee/oee.js 공통 모듈에 넘김)
   부동 유형 코드 = IDT 알람 15종 + 이상사례 5종과 1:1 (SCENARIO.md 11절 결정 2) · kw = 자유 기재 사유를 분류하는 낱말(정규식)
   ═══════════════════════════════════════════════════════════════════ */
/* 11/16 : 실제 부동사유 기록(파우치) 기준 12 유형 — 위에서부터 처음 맞는 유형 하나로 분류 (순서 중요 : '터짐' 이 '안착' 보다 먼저, '핫멜트' 가 '인쇄' 보다 먼저) */
const OEE_POUCH_CODES=[
  {k:"RP8", nm:"파우치 터짐 (충전 안착 불량 연계)", inc:"RP8", room:"P", kw:["터짐","터진"]},
  {k:"RF1", nm:"컨베이어 안착 불량", inc:"RF1", room:"F", kw:["안착"]},
  {k:"RF2", nm:"컷팅 불량 (컷팅 점검)", inc:"RF2", room:"F", kw:["컷팅","커팅"]},
  {k:"RF3", nm:"은박 끊어짐", inc:"RF3", room:"F", kw:["은박.*(끊|단절)","필름.*(끊|단절)"]},
  {k:"RF4", nm:"중량 점검 (충전량 확인)", inc:"RF4", room:"F", kw:["중량\\s*점검","충전량"]},
  {k:"RP1", nm:"정렬기 타이밍 · 그룹핑 불량", inc:"RP1", room:"P", kw:["정렬기","정렬부","그룹핑","타이밍"]},
  {k:"RP2", nm:"설명서 이송 · 끼임 불량", inc:"RP2", room:"P", kw:["설명(서|지)"]},
  {k:"RP3", nm:"카토너 푸셔 오버로드", inc:"RP3", room:"P", kw:["푸셔","오버\\s*로드"]},
  {k:"RP6", nm:"핫멜트 이상 (분사 불량 · 튐)", inc:"RP6", room:"P", kw:["핫\\s*멜트"]},
  {k:"RP4", nm:"제품 투입 불량 (카톤 성형)", inc:"RP4", room:"P", kw:["제품\\s*투입","카톤\\s*성형"]},
  {k:"RP5", nm:"카톤 클로징 불량", inc:"RP5", room:"P", kw:["클로징"]},
  {k:"RP7", nm:"소케이스 인쇄 불량", inc:"RP7", room:"P", kw:["인쇄"]},
  {k:"ETC", nm:"기타 · 미분류 (IDT 실습 없음)", inc:null, room:null, kw:[]}
].map(c=>Object.assign(c,{roomNm:c.room==="F"?"충전실 실습":c.room==="P"?"포장실 실습":""}));
function oeeInit(){
  if(!$("#oeeLamp")) $("#splash").insertAdjacentHTML("beforeend",'<div id="oeeLamp" class="off" title="OEE 미연동"><i></i><span>OEE 미연동</span></div>');
  $("#oeeLamp").onclick=()=>OEEEDU.open();
  OEEEDU.init({line:"파우치", title:"파우치 라인 · 부동 원인 분석 → 이상사례 대처 교육", codes:OEE_POUCH_CODES, mount:$("#app"),
    openInc(){ $("#splash").classList.remove("hide"); $("#coursePicker").style.display="none"; $("#courseBack").style.display=""; eduShow("inc"); }});
}
