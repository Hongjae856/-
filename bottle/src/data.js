/* ═══════════════════════════════════════════════════════════════════
   기종 · 품목 · 알람 · 장치 정의
   근거 : 카운텍(COUNTEC) 공개 제품 소개 요약 (UA-120 · SG-120 · DMC-60T · HPE-100 · RCS-120)
          · UA-120 : 최대 120병/분, 병 Ø30~100 · H40~200, 병을 뒤집어 사이드 벨트로 잡고
                     필터·이온화 에어와 진공 흡입으로 2회 세척 후 정립 배출, 교체부품 불필요
          · SG-120 : 롤 형태 실리카겔 파우치를 피딩 → 왕복 커터 절단 → 플런저로 병 투입, 최대 120병/분
          · DMC-60T: 12트랙 계수 트레이 · 트윈 노즐, 최대 6,000정/분, IR/LED 센서 · 먼지 감지창 · 파손/겹침 검출
          · HPE-100: PE 필름 조각을 병에 투입해 운반 중 정제 파손 방지, 병 자동 조정(교체부품 불필요)
          · RCS-120: 서보 로타리 4헤드, 스타휠로 터렛 이송, 헤드가 내려오며 회전해 설정 토크로 체결,
                     벌크 캡 공급 · 진동 피더 정렬, 최대 120병/분
   ※ 내부 치수 · 세부 기구는 공개 자료가 없어 일반적인 동종 설비 구조로 구현함 (실물 확인 필요)
   ═══════════════════════════════════════════════════════════════════ */
const MACH=[
 {k:"ua", md:"UA-120", nm:"언스크램블러 · 에어세척기", en:"Bottle Unscrambler & Air Cleaner", max:120,
  d:"벌크로 투입된 빈 병을 호퍼 엘리베이터가 턴테이블로 올리고, 턴테이블이 한 줄로 정렬해 내보냅니다. 병을 양옆 사이드 벨트로 잡아 180° 뒤집은 상태에서 이온화 에어로 불어내고 진공으로 흡입해 이물을 제거한 뒤 다시 세워 컨베이어로 보냅니다."},
 {k:"sg", md:"SG-120", nm:"실리카겔 투입기", en:"Sachet Desiccant Inserter", max:120,
  d:"릴에 감긴 실리카겔 파우치 띠를 피드 롤러가 한 개 길이만큼 내리고, 마크 센서로 위치를 맞춘 뒤 왕복 커터가 절단합니다. 잘린 파우치는 가이드 튜브를 지나 플런저가 병 안으로 밀어 넣습니다."},
 {k:"dmc", md:"DMC-60T", nm:"정제 계수기", en:"Electronic Tablet Counter", max:120,
  d:"호퍼의 정제를 3단 진동 트레이가 12개 트랙으로 한 줄씩 정렬해 보냅니다. 트랙 끝에서 떨어지는 정제를 채널마다 IR/LED 센서가 세고, 6채널씩 모인 정제는 중간 게이트에 대기했다가 병이 도착하면 트윈 노즐로 두 병에 동시에 충전됩니다."},
 {k:"wc", md:"중량선별 PLC", nm:"정제 중량선별", en:"Pre/Post Check Weighing", max:120,
  d:"계수기 전단 로드셀이 빈 병(병 + 실리카겔) 중량을 재고, 후단 로드셀이 충전 후 총중량을 잽니다. PLC 가 순중량(총중량 − 빈병 중량)을 기준 중량과 비교해 허용오차를 벗어나면 리젝트 푸셔로 배출합니다."},
 {k:"pe", md:"HPE-100", nm:"비닐(PE 필름) 투입기", en:"High Speed PE Inserter", max:120,
  d:"PE 필름 롤을 풀어 한 장 길이만큼 공급하고, 가열 커터로 잘라 플런저가 병 입구로 밀어 넣습니다. 필름이 정제 위를 덮어 운반 중 정제끼리 부딪혀 깨지는 것을 막습니다."},
 {k:"rc", md:"RCS-120", nm:"로타리 캡핑기", en:"Rotary Screw Capper", max:120,
  d:"캡 엘리베이터와 진동 피더가 캡을 정렬해 슈트로 보냅니다. 병은 타이밍 스크류와 인피드 스타휠로 터렛에 들어가고, 4개 헤드가 캡을 집어 내려오며 회전해 설정 토크로 체결한 뒤 아웃피드 스타휠로 다시 컨베이어에 놓습니다."}
];
const machOf=k=>MACH.find(m=>m.k===k);

/* 제품 : 단위 중량(mg) · 형상(mm) · 겉보기 부피(cc, 병 선정용) */
const PRODUCTS=[
 {k:"A", nm:"제품 A", type:"정제", shape:"round",   unit:250, len:9.0,  dia:9.0, thk:4.2, vol:0.32, col:"tabA", note:"원형 백색 정제 Ø9"},
 {k:"B", nm:"제품 B", type:"정제", shape:"oblong",  unit:520, len:17.0, dia:8.0, thk:6.2, vol:0.72, col:"tabB", note:"장방형 황색 정제 17×8"},
 {k:"C", nm:"제품 C", type:"캡슐", shape:"capsule", unit:410, len:21.7, dia:7.6, thk:7.6, vol:0.75, col:"caps", note:"0호 경질캡슐 적/백"}
];
/* 포장 단위 : C = 캡슐 */
const COUNTS=[
 {k:"21T",n:21},{k:"30T",n:30},{k:"60T",n:60},{k:"90T",n:90},{k:"100T",n:100},{k:"200T",n:200},
 {k:"300T",n:300},{k:"500T",n:500},{k:"500C",n:500,caps:true},{k:"1000T",n:1000}
];
/* 병 규격 (HDPE) : 몸통 지름 d · 전체 높이 h · 목 외경 nk · 캡 지름/높이 · 빈병 중량(g) · 실리카겔(g) */
const BOTTLES=[
 {ml:30,  d:38, h:66,  nk:26, capD:30, capH:15, tare:7.0,  gel:1, capCol:"capW"},
 {ml:50,  d:42, h:80,  nk:26, capD:30, capH:15, tare:8.6,  gel:1, capCol:"capW"},
 {ml:100, d:52, h:98,  nk:34, capD:38, capH:17, tare:13.5, gel:1, capCol:"capB"},
 {ml:200, d:64, h:122, nk:34, capD:38, capH:17, tare:20.5, gel:2, capCol:"capB"},
 {ml:300, d:72, h:138, nk:42, capD:45, capH:18, tare:27.0, gel:2, capCol:"capG"},
 {ml:500, d:86, h:158, nk:42, capD:45, capH:18, tare:38.5, gel:2, capCol:"capG"}
];
/* 허용오차 (정) : 30T 이하 ±0.5 · 300T 이하 ±1 · 500T 이하 ±2 · 1000T 이상 ±5 */
function tolTabs(n){ return n<=30?0.5:n<=300?1:n<=500?2:5; }
/* 병 적정성 : 겉보기 부피가 병 공칭 용량의 80 % 이하 */
function bottleFits(p,n,b){ return p.vol*n<=b.ml*0.8; }
function recommendBottle(p,n){ return BOTTLES.find(b=>bottleFits(p,n,b))||null; }
function countAllowed(p,c){ return p.type==="캡슐"?!!c.caps:!c.caps; }

/* 계정 */
const ACCOUNTS=[
 {id:"PK2", pw:"1234", nm:"SUPERVISOR", lvl:3},
 {id:"OP1", pw:"1111", nm:"OPERATOR", lvl:1}
];

/* ═══ 알람 목록 : 코드 / 기종 / 내용 / trip(정지) · warn(경고) ═══ */
const ALARMS={
 "E000":{mk:"line",t:"비상정지 작동",kind:"trip"},
 "E001":{mk:"line",t:"안전문 열림 (인터락)",kind:"trip"},
 "E002":{mk:"line",t:"압축공기 압력 저하 (< 5.0 bar)",kind:"trip"},
 "E003":{mk:"line",t:"집진기 정지 — 분진 흡입 불가",kind:"warn"},
 "UA11":{mk:"ua",t:"빈 병 호퍼 소진",kind:"trip"},
 "UA12":{mk:"ua",t:"턴테이블 출구 병 걸림",kind:"trip"},
 "UA13":{mk:"ua",t:"세척 에어 · 진공 OFF — 세척 미실시",kind:"warn"},
 "SG21":{mk:"sg",t:"실리카겔 파우치 소진",kind:"trip"},
 "SG22":{mk:"sg",t:"파우치 마크 미검출 — 커터 위치 이상",kind:"trip"},
 "DM31":{mk:"dmc",t:"정제 호퍼 레벨 부족",kind:"warn"},
 "DM32":{mk:"dmc",t:"센서창 오염 — 계수 신뢰도 저하",kind:"warn"},
 "DM33":{mk:"dmc",t:"노즐 막힘 (정제 브리지)",kind:"trip"},
 "WC41":{mk:"wc",t:"중량 불합격 연속 3병",kind:"trip"},
 "WC42":{mk:"wc",t:"리젝트함 만량",kind:"trip"},
 "WC43":{mk:"wc",t:"빈병 중량 이상 (실리카겔 누락 의심)",kind:"warn"},
 "WC44":{mk:"wc",t:"로드셀 영점 미실시",kind:"warn"},
 "PE51":{mk:"pe",t:"PE 필름 소진",kind:"trip"},
 "PE52":{mk:"pe",t:"가열 커터 온도 미달",kind:"trip"},
 "RC61":{mk:"rc",t:"캡 공급 부족 (슈트 캡 없음)",kind:"trip"},
 "RC62":{mk:"rc",t:"캡 슈트 걸림",kind:"trip"},
 "RC63":{mk:"rc",t:"체결 토크 이상",kind:"warn"},
 "RC64":{mk:"rc",t:"집적 테이블 만량",kind:"trip"}
};

/* ═══ 장치 설명 (3D ＋ 핫스팟) : 좌표는 layout.js 의 DEVPOS ═══ */
const DEVICES=[
 {n:1, k:"ua", nm:"병 호퍼 · 엘리베이터", en:"Bottle Hopper & Elevator", d:"벌크 빈 병을 담는 호퍼와 클리트 벨트 엘리베이터입니다. 턴테이블의 병이 줄면 자동으로 올려 보냅니다(온디맨드)."},
 {n:2, k:"ua", nm:"언스크램블 턴테이블", en:"Unscrambling Turntable", d:"회전하는 원판이 병을 가장자리로 밀어 한 줄로 세웁니다. 출구에서 병을 바로 세워 벨트로 보냅니다."},
 {n:3, k:"ua", nm:"반전 사이드 벨트", en:"Inverting Side Belts", d:"양옆 벨트가 병 몸통을 잡고 비틀어진 경로를 따라 이동해 병을 180° 뒤집었다가 다시 세웁니다. 병 크기가 바뀌어도 교체부품 없이 폭만 조정합니다."},
 {n:4, k:"ua", nm:"이온 에어 · 진공 세척부", en:"Ionized Air & Vacuum", d:"뒤집힌 병 입구로 필터·이온화 에어를 불어넣어 정전기로 붙은 먼지를 떼고, 바로 옆 진공 노즐이 빨아냅니다. 2회 반복 세척합니다."},
 {n:5, k:"sg", nm:"실리카겔 릴", en:"Sachet Reel", d:"파우치가 띠 형태로 감긴 릴입니다. 댄서 롤러가 장력을 일정하게 유지합니다."},
 {n:6, k:"sg", nm:"피드 롤러 · 마크 센서", en:"Feed Rollers & Mark Sensor", d:"한 번에 파우치 한 개 길이(피치)만큼 띠를 내립니다. 마크 센서가 파우치 경계를 읽어 절단 위치를 맞춥니다."},
 {n:7, k:"sg", nm:"왕복 커터 · 플런저", en:"Cutter & Plunger", d:"커터가 파우치 경계를 자르고, 플런저가 가이드 튜브 안의 파우치를 병 속으로 밀어 넣습니다."},
 {n:8, k:"wc", nm:"전단 로드셀", en:"Pre-Weigh Load Cell", d:"계수 전 빈 병(병 + 실리카겔) 중량을 잽니다. 기준 범위를 벗어나면(파우치 누락·이물) 추적 신호를 걸어 후단에서 배출합니다."},
 {n:9, k:"dmc", nm:"정제 호퍼", en:"Product Hopper", d:"정제를 담는 호퍼입니다. 레벨 센서가 부족을 감지하면 경고를 냅니다. 하단 게이트로 1단 트레이 공급량을 조절합니다."},
 {n:10,k:"dmc", nm:"3단 진동 트레이", en:"3-Stage Vibratory Trays", d:"1·2단 트레이가 정제를 넓게 펼치고, 3단 트레이의 12개 V 트랙이 한 줄씩 세웁니다. 진동 강도로 계수 속도를 조절합니다."},
 {n:11,k:"dmc", nm:"계수 센서 블록", en:"Optical Sensor Block", d:"채널마다 IR/LED 센서가 떨어지는 정제를 셉니다. 먼지 감지창이 오염되면 경고하며, 파손정·겹침정은 통과 시간(다크 타임)으로 판별합니다."},
 {n:12,k:"dmc", nm:"중간 게이트 · 트윈 노즐", en:"Gates & Twin Nozzles", d:"6채널씩 모인 정제가 게이트 위에 대기하다가 병이 멈추면 열려 노즐로 떨어집니다. 두 병을 동시에 충전합니다."},
 {n:13,k:"dmc", nm:"병 스토퍼", en:"Bottle Stoppers", d:"입구·중간·출구 스토퍼 핀이 병 두 개를 노즐 바로 아래에 세웁니다."},
 {n:14,k:"wc", nm:"후단 로드셀", en:"Post-Weigh Load Cell", d:"충전 후 총중량을 잽니다. 순중량 = 총중량 − 전단 빈병 중량 으로 계산해 허용오차와 비교합니다."},
 {n:15,k:"wc", nm:"리젝트 푸셔 · 리젝트함", en:"Reject Pusher & Bin", d:"불합격 병이 도착하면 공압 푸셔가 옆으로 밀어 잠금식 리젝트함으로 보냅니다."},
 {n:16,k:"wc", nm:"중량선별 PLC 패널", en:"Check-Weigher PLC", d:"별도 PLC 와 터치 패널입니다. 제품 기준 중량, 허용오차, 빈병 기준, 영점, 판정 이력을 관리합니다."},
 {n:17,k:"pe", nm:"PE 필름 롤", en:"PE Film Reel", d:"병 입구를 덮을 PE 필름 롤입니다."},
 {n:18,k:"pe", nm:"가열 커터 · 투입 플런저", en:"Hot Cutter & Plunger", d:"필름을 한 장 길이만큼 공급해 가열 커터로 자르고, 플런저가 병 입구로 밀어 넣습니다. 커터 온도가 설정값에 도달해야 운전됩니다."},
 {n:19,k:"rc", nm:"캡 호퍼 · 엘리베이터 · 진동 피더", en:"Cap Feeder", d:"벌크 캡을 엘리베이터가 올리고 진동 피더가 방향을 맞춰 슈트로 한 줄씩 보냅니다."},
 {n:20,k:"rc", nm:"타이밍 스크류 · 스타휠", en:"Timing Screw & Star Wheels", d:"타이밍 스크류가 병 간격을 터렛 피치에 맞추고, 인피드 스타휠이 터렛으로, 아웃피드 스타휠이 컨베이어로 옮깁니다."},
 {n:21,k:"rc", nm:"4헤드 캡핑 터렛", en:"4-Head Capping Turret", d:"서보 터렛이 도는 동안 헤드가 캠을 따라 내려와 캡을 병에 씌우고 회전해 설정 토크로 체결합니다. 토크에 도달하면 클러치가 미끄러져 과체결을 막습니다."},
 {n:22,k:"rc", nm:"집적 테이블", en:"Accumulation Table", d:"캡핑이 끝난 병을 모으는 회전 테이블입니다. 가득 차면 작업자가 완제품을 회수합니다."}
];
const devOf=n=>DEVICES.find(d=>d.n===n);
