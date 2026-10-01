# 작업 규칙

## 버전 관리 (두 IDT 공통)
- 사용자의 수정 요청 1건을 반영할 때마다 해당 IDT 의 버전을 1 올리고, 이력 표에 한두 줄로 기록한다.
- PTP 라인 IDT (아티펙트 6ByApUNKkCDg5QMtPDmSTG) : `src/entry.html` 의 `CHANGELOG` 배열 맨 위에 추가 → `python3 build.py`
- 병충전 라인 IDT (아티펙트 QKpsz9dWTDVeakZukQ9few) : `bottle/src/changelog.js` 의 `CHANGELOG` 배열 맨 위에 추가 → `python3 bottle/build.py`
- 날짜는 한국 시간(YYYY-MM-DD). 화면의 버전 표시는 배열 맨 위 항목에서 자동으로 정해진다.
