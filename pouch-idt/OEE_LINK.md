# OEE 연계 교육 — 연결 방법 (파우치 IDT 먼저 적용)

근거 : SCENARIO.md 11절 (사용자 결정 11/12). 실제 실적 값 · LOT 는 저장소에 넣지 않는다.

## 1. 구성
| 파일 | 역할 |
|---|---|
| `oee/oee.js` · `oee/oee.css` | 공통 모듈 — 데이터 불러오기, 부동 유형 분류, 부동 트렌드 분석, 맞춤 교육 추천, 교육 효과 비교 |
| `pouch/v3/src/oee_pouch.js` | 파우치 라인 설정 — 부동 유형 코드 21종(알람 15 + 이상사례 5 + 기타), 3D 실습 시작 방법 |

병 · PTP IDT 로 넓힐 때는 `oee_pouch.js` 와 같은 설정 파일만 라인별로 추가한다.

## 2. 데이터 항목 (대시보드 `getDashboardData()` 가 돌려주는 값과 동일)
`dateText` · `line` · `prodName` · `lotNo` · `oee` · `avail` · `perf` · `yieldRate` · `totalDown`(분) · `reason`(자유 기재) · `countermeasure` + **`reasonCode`(부동 유형 · 신규)**

- 비율 값은 0~1 또는 0~100 둘 다 받는다 (1.5 이하면 100 을 곱함).
- `reasonCode` 가 비어 있으면 `reason` 글을 낱말로 분류한다 (정확도 확인 필요 · 화면에 * 로 표시). 어느 낱말에도 맞지 않으면 '기타 · 미분류'.
- 한 기록에 코드가 여럿(쉼표 구분)이면 부동시간을 똑같이 나눈다.

## 3. 대시보드 쪽에서 추가할 것 (사용자 작업 · 확인 필요)
### 3-1. 읽기 전용 주소 (Apps Script · 사용자 제공 code.gs 확인 11/15)
대시보드에 이미 `doGet` 이 있으므로(대시보드 화면을 돌려줌) 새로 만들지 않고 **맨 앞에 3줄만 추가**한다.
```js
function doGet(e) {
  if (e && e.parameter && e.parameter.format === 'json') {            // IDT 용 읽기 전용 출력
    return ContentService.createTextOutput(JSON.stringify(getDashboardData())).setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService.createHtmlOutputFromFile('Index')                 // 이하 기존 그대로
      .setTitle('포장2팀 OEE 대시보드')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
```
- 수정 후 [배포 › 배포 관리 › 수정 › 새 버전] 으로 다시 배포해야 반영된다.
- IDT 의 [OEE 연계 교육 › ① 데이터] 에 `대시보드 주소(…/exec)?format=json` 을 입력한다.
- 확인 필요 ① 접근 권한 : 웹 앱 액세스가 '모든 사용자' 가 아니면 로그인 화면으로 넘어가 IDT 에서 불러오기가 실패한다. '모든 사용자' 로 열면 주소를 아는 누구나 LOT · 제품명 · 실적을 읽을 수 있으므로 사내 보안 방침 확인이 먼저다.
- 확인 필요 ② 아티팩트에서 Google 주소 연결이 허용되는지는 시험하지 못했다. 막히면 **붙여넣기**(시트에서 머리글 줄 포함 복사)를 쓴다 — 시트의 실제 항목 이름(작업기간 · 포장라인 · 제품명 · 제조번호(LOT) · 시간가동률(%) · 성능가동률(%) · 수율(%) · OEE(%) · 부동시간 합계(분) · 부동사유 · 대책)을 그대로 인식한다.
- 값 형식 : 시트에는 비율이 % 값(예 92.5)으로 저장되고 `작업기간` 은 '시작일 ~ 종료일' 글자일 수 있다 → IDT 는 첫 날짜를 기록 날짜로 쓴다.

### 3-2. 입력 화면에 '부동 유형' 선택란
```html
<select id="inpReasonCode" class="form-control">
  <option value="">부동 유형 선택 (없으면 비움)</option>
  <!-- 라인별 코드 목록 : 아래 4절 -->
</select>
```
```js
// submitData() 의 payload 에 추가
reasonCode: document.getElementById('inpReasonCode').value,
```
- code.gs 수정 3곳 (22번째 열 = V열 '부동유형') : ① `saveBatchData` 의 `headers` 끝에 `'부동유형'` 추가, ② 같은 함수 `appendRow([...])` 의 마지막 `""`(대책) 뒤에 `data.reasonCode || ""` 추가, ③ `getDashboardData` 에서 `getRange(2, 1, lastRow - 1, 21)` 을 `22` 로 바꾸고 `allData.push({...})` 에 `reasonCode: row[21] || ""` 추가.
- 이미 있는 시트는 V1 칸에 '부동유형' 머리글만 직접 적는다. 시트의 열 수가 22개보다 적으면(열을 지운 경우) 열을 먼저 늘려야 한다.
- 붙여넣기용 표의 항목 이름은 '부동유형' 또는 '사유코드' 로 인식한다.

## 4. 부동 유형 코드 — 파우치 라인 (IDT 실습과 1:1)
| 코드 | 부동 유형 | 실습 |
|---|---|---|
| FILM | 필름(은박) 단절 | 충전실 |
| DOOR | 도어 열림 | 충전실 |
| FEED | 제품(원료) 공급 단절 | 충전실 |
| TSEN | 온도센서 이상 | 충전실 |
| EMG | 비상정지 | 충전실 |
| THI | 실링 상한온도 이상 | 충전실 |
| MOL | 모터 과부하 | 충전실 |
| LIM | 메인서보 리미트 | 충전실 |
| AIR | 메인 에어 단절 | 충전실 |
| CNT | 카운트 에러 | 충전실 |
| ALN | 정렬기(배출 컨베이어) 모터 알람 | 충전실 |
| PSV | 은박 프린터 서보모터 알람 | 충전실 |
| PRT | 은박 프린터 알람 | 충전실 |
| VIS | 비전 알람 | 충전실 |
| EMP | 공포(빈 파우치) 감지 | 충전실 |
| F1 | 충전량 미달 | 충전실 |
| F2 | 파우치 인쇄 불량 | 충전실 |
| F3 | 파우치 배출 · 정렬 불량 | 충전실 |
| P1 | 카톤 인쇄 흐려짐 | 포장실 |
| P2 | 설명지 미삽입 | 포장실 |
| ETC | 기타 · 미분류 | 없음 |

- 확인 필요 : 실제 부동 사유 중 위 목록에 없는 유형(예 : 카토너 · X-ray · 중량선별기 · 수동 포장 관련)은 지금은 '기타' 로 모인다. 실제 사유 분포를 보고 코드와 IDT 실습을 추가한다.

## 5. 화면 흐름
① 데이터(주소 · 붙여넣기 · 예시) → ② 부동 트렌드(유형별 부동시간 · 발생 횟수 순위, 월별 부동시간, 평균 OEE · 가동률 · 성능 · 수율) → ③ 맞춤 교육(부동시간 큰 순서로 최대 6개, 선정 근거 · 학습 목표 · 단계, [3D 실습 시작]) → ④ 교육 효과(첫 실습일 기준 교육 전 · 후 발생 횟수 · 기록당 부동시간 · 평균 OEE).

- 3D 실습 : 해당 실을 운전 중 상태로 만든 뒤 그 상황을 발생시킨다. 대응 절차 · 판정은 기존 IDT 와 같다. 대응을 끝내면 실습 기록(유형 · 날짜)이 이 브라우저에 남는다.
- 예시 데이터는 규칙으로 만든 값이며 화면에 '실제 실적 아님' 을 표시한다.
- 한계 : 교육 효과는 기록이 쌓여야 비교되고, 품목 · 정비 등 다른 요인의 영향은 구분하지 않는다. 실습 기록은 브라우저별로 따로 남는다(여러 사람 · 여러 PC 합산 불가).
