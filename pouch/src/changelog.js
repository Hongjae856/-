/* ═══════════════════════════════════════════════════════════════════
   버전 이력 — 수정 요청 1건마다 버전 +1 (맨 위가 최신 · 날짜는 한국 시간)
   ═══════════════════════════════════════════════════════════════════ */
const CHANGELOG=[
 {v:3, d:"2026-11-10", t:"포장실 과정 평가모드 : 이상사례 1건 + 충전기 알람 1건(온도센서 · 상한온도 · 프린터 · 비젼 · 공포감지 중 무작위)으로 변경, 포장실 학습모드 알람 목록 추가, 충전기 화면 탭(연동) 추가"},
 {v:2, d:"2026-11-10", t:"1인칭 시점 도입 — 교육 시작 시 1인칭(WASD · 마우스 · 좌클릭/E), 계단 · 2층 데크 눈높이 자연 보정, 설비 화면을 현장 모니터에 투영, 충전실 ↔ 포장실 출입구, 상단 버튼으로 3인칭 전환"},
 {v:1, d:"2026-11-10", t:"최초 게시 — 충전실 · 포장실 과정 × 기본/심화 × 학습/평가, 충전기 도면 반영 3D(2층 데크 · 전면 확장 데크), 알람 15종 · 이상사례 5종 · 정기 공정검사(IPC)"}
];
const VER=CHANGELOG[0].v;
function openVersions(){
  $("#verBox").innerHTML='<h2>📋 버전 이력 <small style="font-size:14px;color:#61748a">현재 V'+VER+'</small></h2>'+
    '<p>수정 요청 1건마다 버전이 1씩 올라갑니다.</p>'+
    '<table class="ht vt"><tr><th>버전</th><th>날짜</th><th>수정 내용</th></tr>'+
    CHANGELOG.map(r=>'<tr><td>V'+r.v+'</td><td>'+r.d+'</td><td class="l">'+esc(r.t)+'</td></tr>').join("")+'</table>'+
    '<div class="mbtn"><button class="pri" id="verX">닫기</button></div>';
  $("#mVer").classList.add("on"); $("#verX").onclick=()=>$("#mVer").classList.remove("on");
}
function bindVersion(){
  for(const id of ["#verBadge"]){ const e=$(id); if(!e) continue; e.textContent="V"+VER; e.onclick=openVersions; e.title="버전 이력"; }
}
