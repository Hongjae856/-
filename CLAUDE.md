# 작업 규칙

## 버전 관리 (세 IDT 공통)
- 사용자의 수정 요청 1건을 반영할 때마다 해당 IDT 의 버전을 1 올리고, 이력 표에 한두 줄로 기록한다.
- PTP 라인 IDT (아티펙트 6ByApUNKkCDg5QMtPDmSTG) : `src/entry.html` 의 `CHANGELOG` 배열 맨 위에 추가 → `python3 build.py`
- 병충전 라인 IDT (아티펙트 QKpsz9dWTDVeakZukQ9few) : `bottle/src/changelog.js` 의 `CHANGELOG` 배열 맨 위에 추가 → `python3 bottle/build.py`
- PTP 통합라인 IDT (아티펙트 2neVtx6Kcwx9sFCfQQr5j5) : `ptp_room/changelog.js` 의 `CHANGELOG` 배열 맨 위에 추가 → `python3 ptp_room/build.py` (원본 `src/filler.html` · `src/line.html` 을 읽어 방 모드 스크립트를 주입하므로, 원본을 고치면 두 IDT 모두 다시 빌드해 확인)
- 날짜는 한국 시간(YYYY-MM-DD). 화면의 버전 표시는 배열 맨 위 항목에서 자동으로 정해진다.
