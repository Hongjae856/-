# 작업 규칙

## 버전 관리 (네 IDT 공통)
- 사용자의 수정 요청 1건을 반영할 때마다 해당 IDT 의 버전을 1 올리고, 이력 표에 한두 줄로 기록한다.
- PTP 라인 IDT (아티펙트 6ByApUNKkCDg5QMtPDmSTG) : `src/entry.html` 의 `CHANGELOG` 배열 맨 위에 추가 → `python3 build.py`
- 병충전 라인 IDT (아티펙트 QKpsz9dWTDVeakZukQ9few) : `bottle/src/changelog.js` 의 `CHANGELOG` 배열 맨 위에 추가 → `python3 bottle/build.py`
- PTP 통합라인 IDT (아티펙트 2neVtx6Kcwx9sFCfQQr5j5) : `ptp_room/changelog.js` 의 `CHANGELOG` 배열 맨 위에 추가 → `python3 ptp_room/build.py` (원본 `src/filler.html` · `src/line.html` 을 읽어 방 모드 스크립트를 주입하므로, 원본을 고치면 두 IDT 모두 다시 빌드해 확인)
- PTP 통합라인 단일화면 IDT (아티펙트 BXL7P815mbHNcXJ8oquyPB) : `ptp_one/changelog.js` 의 `CHANGELOG` 배열 맨 위에 추가 → `python3 ptp_one/build.py` (원본 `src/filler.html` · `src/line.html` 을 읽어 단일 화면 스크립트를 주입)
- 파우치 라인 IDT (아티펙트 Cs8MNrLjCXW1ztkcUDvt4M) : `pouch/src/changelog.js` 의 `CHANGELOG` 배열 맨 위에 추가 → `python3 pouch/v3/build.py` (산출물 `파우치라인_IDT.html`). V4 부터 새 3D 연결판 — 교육 로직 `pouch/src` + 3D `pouch/v2/src` + 연결 `pouch/v3/src` + OEE 공통 모듈 `oee/` 를 합쳐 빌드 (옛 3D 판은 `pouch/build.py` 로만 남김 · 게시에 쓰지 않음)
- PTP 라인 IDT · 파우치 방식 전환판 (아티펙트 ErpiziNEbQKMQxVEpcWVv8) : `ptp3/changelog.js` 의 `CHANGELOG` 배열 맨 위에 추가 → `python3 ptp3/build.py` (산출물 `PTP라인_IDT.html`). 두 앱 문서는 `ptp_one/build.py` 의 주입 결과를 그대로 쓰고 셸 Three.js 가 그림 · 계획 `ptp3/PLAN.md` (기존 PTP 통합 두 판은 더 이상 갱신하지 않음)
- 날짜는 한국 시간(YYYY-MM-DD). 화면의 버전 표시는 배열 맨 위 항목에서 자동으로 정해진다.

## 1인칭 조작 대상 표시 (모든 IDT 공통 · 11/17 사용자 결정)
- 공통 모듈 `idt_common/aimmark.js` 를 쓴다 (파우치 `pouch/v3/build.py` · PTP `ptp3/build.py` 에 포함, 병 IDT 전환 시에도 반드시 포함).
- 큰 가상 상자 테두리 · 설비를 투시하는(depthTest 끔) 화살표 · 고리는 쓰지 않는다.
- 실제 누르는 지점에 작은 원형 마커 : 다음 작업 = 노란 점 + 고리, 조준 = 초록 고리(손 닿음) · 회색 고리(멂). 깊이 반영(가려지면 안 보임).
- 다음 작업이 화면 밖이면 화면 가장자리 노란 화살표 + 이름 · 거리.
- 조작은 손 닿는 거리(가슴 높이 = 눈 - 0.3 m 에서 대상까지 1.2 m) 안에서만. 밖이면 「가까이 가세요 (거리)」. 새 조작 대상을 추가하면 걸어서 1.2 m 안에 들어갈 수 있는지 확인한다.
- 자유모드에서는 다음 작업 안내를 표시하지 않는다.
