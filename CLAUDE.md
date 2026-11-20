# 작업 규칙

## 최우선 원칙 (사용자 지시 · 11/18 재확인)
- **모든 IDT 는 설비 하드웨어(이미 구현한 설비 형상 · 설비별 고유 동작)를 뺀 나머지를 전부 파우치 기준으로 통일한다.** 작업자(인체 모델 · 걷기 · 손 뻗기 · 들고 가는 물건 · 자재 투입 동작), 1인칭 조작, 화면 구성, 모드, 힌트 · 감점 · 결과, OEE · 이상사례 등 모두 해당.
- 새 기능을 넣거나 IDT 를 고칠 때 파우치에 같은 기능이 있으면 파우치 방식을 따르고, 다르게 할 때는 먼저 사용자에게 확인한다.
- 파우치 메인화면의 제품명 표기는 사용자 결정으로 그대로 유지한다 (11/18 확인 · 다시 묻지 않음).
- **세 IDT(파우치 · PTP(ptp3) · 병(bottle3))는 함께 간다 (11/18 사용자 지시).** 사용자의 수정 요청은 특정 IDT 를 지목해도 하드웨어 고유 부분이 아니면 세 IDT 모두에 같은 내용으로 반영한다.
  - 한 요청 = 세 IDT 버전을 함께 +1, 세 changelog 에 같은 취지로 기록, 세 IDT 모두 빌드 · 회귀 시험 · 게시.
  - 하드웨어 고유 수정(특정 설비 형상 · 동작)만 해당 IDT 에 한정하고, 그 경우 보고에 "해당 IDT 만 · 이유"를 적는다.
  - 공통 동작은 가능한 한 `idt_common/` 모듈 한 곳에 두어 한 번 고치면 세 IDT 에 같이 들어가게 한다.
  - 통합 진행 (11/19 사용자 결정 · 단계적) : ① 메인화면 · 이상사례 목록 = `idt_common/splash.py · splash.css · splash.js · incpick.js` (완료) → ② 1인칭 조작 · 상단 바 = `fpctl.js`(파우치 포함 세 IDT 단축키 · 도움말 · 메뉴 · 눈높이 · 속도) · `topbar.js`(그래픽 단계 IDT_GQ_L · 배속 IDT_SPEEDS 공통 값, 파우치는 원본 상단 바가 기준 모양) (완료) → ③ 작업자 동작 = `crewkit.js`(들고 가는 물건 표 IDT_CARRY · 손에 든 자세 idtHold · 걷는 방향 idtFaceStep · 손 뻗기 idtReachAmt · 보행 IDT_WALK 1.4 m/s — PTP · 병 원본 앱 작업자 속도도 빌드 때 1.4 m/s 로 맞춤) (완료) → ④ 시연 · 자유모드 · 결과 창 = `modes.js`(결과 창 idtResOpen · 이상사례 결과 idtIncResult · 시연 완료 idtDemoResult · 시연 안내판 idtDemoHtml · 자유모드 안내판 idtFreeHtml — PTP · 병 원본 앱 결과는 빌드 때 `ptp3/appres.js` · `bottle3/appres.js` 를 앱 문서 끝에 넣어 공통 창으로) (완료). 각 IDT 고유 부분(작업자 카드 · 병 포장 품목 · PTP 체인지파트 등)은 설정값으로만 둔다. 고유 특징이 깨질 수 있는 중요한 경우는 사용자에게 묻는다.
  - 작업자 능력 통일 (11/20 사용자 지시 "다 통일해") : 세 IDT 작업자는 `crewkit.js` 공통 기능으로 움직인다 — 보이는 위치 걷기 idtWalker(빈 바닥 · 격자 경로 idtGridPath, 도착 전 앱 작업 시간 멈춤 PTP_HOLD · B3_HOLD) · 실제 표면 손 idtReachSurface · 대차 · 드럼리프터 모델 idtCartBuild · idtLifterBuild(파우치 모델) · 끌기 IDT_TOW · 2인 1조 보조 작업자 idtHelper · 붓기 idtPour.
    - 롤 교체 = 대차 운반 + 2인 장착 (파우치 은박 롤 · PTP 성형필름 · 커버포일 롤), 1인칭에서도 보조 작업자 동행 (11/20 사용자 결정). 병 정제 투입 = 리프터로 올려 붓기 (11/20 사용자 결정).
    - 새 작업을 넣을 때 : 서는 자리가 빈 바닥인지, 손 목표가 0.3~0.8 m 안인지, 무거운 자재는 대차 · 리프터 · 2인인지 확인한다.
  - 이상사례 중요도 등급 : 파우치 11/16 확정, 블리스터 · 병 11/19 확인 (상 = 품질 직접 영향 · 중 = 품질 영향 가능 · 생산 손실 · 하 = 설비 정지 위주).

## 버전 관리 (네 IDT 공통)
- 사용자의 수정 요청 1건을 반영할 때마다 해당 IDT 의 버전을 1 올리고, 이력 표에 한두 줄로 기록한다.
- PTP 라인 IDT (아티펙트 6ByApUNKkCDg5QMtPDmSTG) : `src/entry.html` 의 `CHANGELOG` 배열 맨 위에 추가 → `python3 build.py`
- 병충전 라인 IDT (아티펙트 QKpsz9dWTDVeakZukQ9few) : `bottle/src/changelog.js` 의 `CHANGELOG` 배열 맨 위에 추가 → `python3 bottle/build.py`
- PTP 통합라인 IDT (아티펙트 2neVtx6Kcwx9sFCfQQr5j5) : `ptp_room/changelog.js` 의 `CHANGELOG` 배열 맨 위에 추가 → `python3 ptp_room/build.py` (원본 `src/filler.html` · `src/line.html` 을 읽어 방 모드 스크립트를 주입하므로, 원본을 고치면 두 IDT 모두 다시 빌드해 확인)
- PTP 통합라인 단일화면 IDT (아티펙트 BXL7P815mbHNcXJ8oquyPB) : `ptp_one/changelog.js` 의 `CHANGELOG` 배열 맨 위에 추가 → `python3 ptp_one/build.py` (원본 `src/filler.html` · `src/line.html` 을 읽어 단일 화면 스크립트를 주입)
- 파우치 라인 IDT (아티펙트 Cs8MNrLjCXW1ztkcUDvt4M) : `pouch/src/changelog.js` 의 `CHANGELOG` 배열 맨 위에 추가 → `python3 pouch/v3/build.py` (산출물 `파우치라인_IDT.html`). V4 부터 새 3D 연결판 — 교육 로직 `pouch/src` + 3D `pouch/v2/src` + 연결 `pouch/v3/src` + OEE 공통 모듈 `oee/` 를 합쳐 빌드 (옛 3D 판은 `pouch/build.py` 로만 남김 · 게시에 쓰지 않음)
- PTP 라인 IDT · 파우치 방식 전환판 (아티펙트 ErpiziNEbQKMQxVEpcWVv8) : `ptp3/changelog.js` 의 `CHANGELOG` 배열 맨 위에 추가 → `python3 ptp3/build.py` (산출물 `PTP라인_IDT.html`). 두 앱 문서는 `ptp_one/build.py` 의 주입 결과를 그대로 쓰고 셸 Three.js 가 그림 · 계획 `ptp3/PLAN.md` (기존 PTP 통합 두 판은 더 이상 갱신하지 않음)
- 병 라인 IDT · 파우치 방식 전환판 + 포장라인 (아티펙트 QBppWCKeNaUmMT1ZrFKBzA) : `bottle3/changelog.js` 의 `CHANGELOG` 배열 맨 위에 추가 → `python3 bottle3/build.py` (산출물 `병라인_IDT.html`). 원본 `bottle/src` 앱을 빌드 때 치환해 쓰고(형상 버퍼만), 포장실 · 1인칭 · 모드는 셸 · 계획 `bottle3/PLAN.md` · 현장 자료 메모 `bottle/pack/` (기존 병충전 IDT 는 더 이상 갱신하지 않음)
- 날짜는 한국 시간(YYYY-MM-DD). 화면의 버전 표시는 배열 맨 위 항목에서 자동으로 정해진다.

## 1인칭 조작 대상 표시 (모든 IDT 공통 · 11/17 사용자 결정)
- 공통 모듈 `idt_common/aimmark.js` 를 쓴다 (파우치 `pouch/v3/build.py` · PTP `ptp3/build.py` 에 포함, 병 IDT 전환 시에도 반드시 포함).
- 큰 가상 상자 테두리 · 설비를 투시하는(depthTest 끔) 화살표 · 고리는 쓰지 않는다.
- 실제 누르는 지점에 작은 원형 마커 : 다음 작업 = 노란 점 + 고리, 조준 = 초록 고리(손 닿음) · 회색 고리(멂). 깊이 반영(가려지면 안 보임).
- 다음 작업이 화면 밖이면 화면 가장자리 노란 화살표 + 이름 · 거리.
- 조작은 손 닿는 거리(가슴 높이 = 눈 - 0.3 m 에서 대상까지 1.2 m) 안에서만. 밖이면 「가까이 가세요 (거리)」. 새 조작 대상을 추가하면 걸어서 1.2 m 안에 들어갈 수 있는지 확인한다.
- 자유모드에서는 다음 작업 안내를 표시하지 않는다.

## 1인칭 공통 조작 · 자유모드 · 시연모드 (모든 IDT 공통 · 11/18 사용자 결정 · 파우치 기준)
- 1인칭 : 눈높이 1.55 m · 시야각 약 65°(파우치 초점 0.78) · 걷기 1.4 m/s · Shift 2.6 m/s · WASD/방향키 · C 앉기(약 1.0 m) · F1 힌트(평가 −5 점) · H 도움말. 세 IDT 모두 공통 모듈 `idt_common/fpctl.js` (걷기 엔진은 IDT 별 : 파우치 `pouch/src/fps.js` · PTP · 병 `walk.js`).
- 설비 · 사람 비율 : 사람 모델 1.76 m(human.js), 컨베이어 상면 0.90~0.92 m 로 세 IDT 일치(11/18 측정). 새 설비는 이 기준에 맞춘다.
- 자유모드 = 중간안 : 순서 · 감점 · 기동 조건 · 운전 중 조작 금지는 해제, 전원 · 공압(진공) · 안전문 · 비상정지 · 알람 RESET 은 실제처럼. 운전 중 안전문(카토너 문 포함)을 열면 인터락 정지.
- 시연모드 = 단계 버튼식 : 단계마다 [시연 실행] · 3인칭이면 카메라가 해당 구역으로 · 평가 없음 · 다음 작업 표시 없음.
- 이상사례 결과 : 평가 점수(100 − 감점, 힌트 −5) · 원인 판단 오답 · 힌트 횟수를 OEE 교육 효과에 기록. 평가에서는 다음 작업 표시(3D 마커 · 앱 강조)를 숨김.
