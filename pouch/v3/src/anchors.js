/* ═══════════════════════════════════════════════════════════════════
   새 3D(pouch/v2, 단위 m · X 동쪽 · Z 남쪽 · Y 위) 좌표 — 교육 로직이 쓰는 위치 모음
   · 카메라 시점 · 작업 시점 · 장치 표식 · 라벨 · 현장 조치 위치 · 작업자 서는 자리 · 1인칭 설비 화면
   · 화면(모니터) 위치는 장면에서 측정한 값 (11/13)
   · [확인 필요] 표시는 현장 위치 미확인 → 사용자 확인 후 수정
   ═══════════════════════════════════════════════════════════════════ */
const ZC=FL.zc, XF=FM.xf, DY=FL.deckY;
/* 눈 · 목표점 → 궤도 카메라 값 */
function VW(e,t){ const dx=e[0]-t[0], dy=e[1]-t[1], dz=e[2]-t[2], d=Math.hypot(dx,dy,dz); return {yaw:Math.atan2(dx,dz), pitch:Math.asin(dy/d), dist:d, tx:t[0], ty:t[1], tz:t[2]}; }

/* ── 현장 위치 (조치 · 표식 공용) ── */
const ANC={
  mainPow:[3.875,1.15,3.60],            /* 제어함 문 회전 손잡이 = 메인 파워 */
  panel:[2.29,1.53,1.833],              /* 충전기 컨트롤 판넬 화면 */
  panelSw:[2.28,1.21,1.833],            /* 판넬 하부 버튼 */
  panelIn:[2.40,1.25,1.833],            /* 판넬 함 내부 (서보 드라이브) */
  sealFront:[2.93,1.35,ZC],             /* 실링 · 커팅부 (서쪽 정면) */
  limit:[2.95,0.75,ZC],                 /* 메인모터 리미트 센서 (정면 하부) */
  nozzle:[2.95,1.75,ZC],                /* 노즐 · 도징 */
  chute:[2.88,0.58,ZC],                 /* 배출 슈트 */
  door:[2.93,1.45,ZC-.3],               /* 아크릴 안전도어 */
  conv:[CVX,1.15,0.9],                  /* 배출 컨베이어 (벽 쪽) */
  convMotor:[CVX,0.55,1.6],             /* 배출 컨베이어 모터 [확인 필요] */
  cntConv:[CVX,0.45,ZC+.5],             /* 카운팅 컨베이어 (배출부) */
  empty:[CVX-.25,0.5,ZC+.75],           /* 공포 배출 [확인 필요] */
  hop2:[XF,DY+1.0,ZC+.38],              /* 2번 호퍼 (주성분 · 원료투입구 쪽) */
  hops:[XF,DY+1.45,ZC],
  dialF:[XF-.62,DY+.3,ZC],              /* 충전량 다이얼 (서쪽 · 첨가제 · 주성분) */
  dialB:[XF+.66,DY+.3,ZC],              /* 백당 (동쪽) */
  dust:[5.0,DY+.55,1.65],               /* 동쪽 데크 진공 생성기 · 집진 */
  roll:[4.71,0.70,ZC],                  /* 은박 롤 (언와인더) */
  prn:[4.55,1.40,ZC-.25],               /* 은박 인쇄 유닛 */
  vis:[4.55,1.40,ZC+.25],
  ibc:[6.75,1.55,1.5],
  lift:[10.75,1.20,1.8],                /* 드럼리프터 (보관 위치) */
  liftUse:[XF,0.70,FL.z1+.55],          /* 원료투입구 아래 사용 위치 */
  air1:[5.66,1.30,1.02], air2:[5.66,1.30,1.22],   /* 압축공기 밸브 [확인 필요] */
  redPal:[10.95,0.40,5.95], plainPal:[10.95,0.40,6.45],
  ipc:[0.42,0.90,0.75],                 /* 저울 작업대 1 (IPC) */
  leak:[0.42,0.90,1.90],                /* 기밀도 시험 [확인 필요 : 저울 작업대 2 로 가정] */
  docF:[0.03,1.45,4.9],                 /* 문서 · 기록 게시판 [확인 필요] */
  /* 포장실 */
  align:[3.66,1.13,-0.42],              /* 정렬컨베어 가동스위치 [확인 필요] */
  sfPanel:[3.585,1.395,-0.13],
  ctMain:[3.40,1.10,-2.20], sfSw:[3.40,1.10,-2.35], ctAir:[3.40,1.10,-2.50],   /* 카토너 뒤편 스위치 [확인 필요] */
  mag:[3.25,1.35,-3.17], leaf:[3.20,1.10,-2.40], magOut:[3.30,0.95,-3.60],
  hm:[3.35,1.05,-4.80], ctPanel:[3.635,1.545,-5.25], ctRej:[3.45,0.40,-5.10],
  prPow:[3.00,0.45,-6.02], prHead:[2.95,1.00,-6.02], vsScr:[2.525,1.715,-6.025],
  xrScr:[3.146,1.525,-7.22], xrPow:[3.15,1.20,-7.00], xrKey:[3.15,1.20,-7.10],
  cwScr:[2.565,1.52,-8.22], cwPow:[2.60,1.30,-8.05], bin:[2.95,0.60,-8.85],
  hand:[CVX,1.00,-9.55], boxing:[CVX,1.05,-14.7], docP:[7.97,1.45,-14.6]
};

/* ── 카메라 시점 (헤더 버튼 · 장치 설명 · 공정 흐름) ── */
const CAMVIEW={
  all:  VW([16.5,14.5,10.5],[4.6,0.4,-4.4]),
  fill: VW([0.7,3.1,6.7],[4.3,1.4,2.5]),
  front:VW([0.6,1.5,2.7],[3.0,1.1,2.73]),
  back: VW([8.6,1.8,2.75],[4.3,1.4,2.75]),
  deck: VW([2.2,3.7,5.3],[3.6,2.6,2.7]),
  panel:VW([1.05,1.55,1.83],[2.29,1.45,1.83]),
  conv: VW([1.0,1.7,3.6],[2.6,1.0,1.4]),
  pack: VW([7.8,3.6,-0.6],[2.9,0.9,-7.6]),
  feed: VW([5.2,1.7,-1.2],[2.8,1.1,-1.2]),
  pr:   VW([5.0,1.6,-6.0],[2.8,1.1,-6.0]),
  xr:   VW([5.2,1.6,-7.2],[2.9,1.1,-7.2]),
  cw:   VW([5.0,1.6,-8.3],[2.7,1.0,-8.3]),
  hand: VW([5.3,2.3,-8.3],[2.8,0.95,-10.0]),
  boxing:VW([6.9,2.6,-12.4],[3.6,0.8,-14.5]),
  top:  VW([4.6,25,-4.45],[4.6,0,-4.5])
};
/* ── 작업 확대 시점 (작업자가 일할 때) ── */
const WORKVIEW={
  hopper:VW([3.05,3.95,5.0],[3.05,2.85,2.9]),
  dial:  VW([1.25,2.95,2.73],[2.5,2.3,2.73]),
  dialB: VW([5.3,2.95,2.73],[3.7,2.3,2.73]),
  ibc:   VW([8.9,1.8,1.5],[6.75,1.0,1.5]),
  lift:  VW([6.2,2.6,6.5],[3.2,1.2,4.6]),
  roll:  VW([6.7,1.5,1.0],[4.7,0.8,2.6]),
  printer:VW([6.5,1.9,1.1],[4.6,1.35,2.5]),
  chute: VW([1.3,1.25,3.7],[2.85,0.6,2.73]),
  door:  VW([1.15,1.6,2.73],[2.95,1.4,2.73]),
  sw:    VW([5.2,1.5,-1.0],[3.6,1.2,-0.4]),
  ct:    VW([5.6,1.8,-3.8],[3.1,1.2,-3.8]),
  ctBack:VW([5.3,1.6,-1.6],[3.4,1.1,-2.6]),
  hm:    VW([5.1,1.6,-4.8],[3.3,1.1,-4.8]),
  pr:    VW([4.8,1.5,-6.0],[2.9,0.9,-6.0]),
  xr:    VW([4.9,1.6,-7.2],[3.0,1.1,-7.2]),
  cw:    VW([4.7,1.6,-8.2],[2.7,1.1,-8.2]),
  bin:   VW([4.6,1.6,-8.85],[2.8,0.6,-8.85]),
  hand:  VW([5.3,2.3,-8.3],[2.8,0.95,-10.0])
};

/* ── 장치 표식 위치 (DEVICES 1 ~ 22) ── */
const DEV_P={1:ANC.mainPow,2:ANC.panel,3:ANC.sealFront,4:ANC.chute,5:ANC.conv,6:ANC.empty,7:ANC.hops,8:ANC.dialF,9:ANC.ibc,10:ANC.lift,11:ANC.roll,12:ANC.air1,
  13:ANC.sfPanel,14:ANC.mag,15:ANC.ctPanel,16:ANC.hm,17:ANC.ctRej,18:ANC.vsScr,19:ANC.xrScr,20:ANC.cwScr,21:ANC.bin,22:ANC.hand};
for(const d of DEVICES) if(DEV_P[d.n]) d.p=DEV_P[d.n].slice();

/* ── 3D 라벨 ── */
const LBL3=[[4.2,4.15,ZC,"파우치 충전기 SP303 · 2층 데크","F"],[6.75,2.05,1.5,"IBC (첨가제 · 백당)","F"],[CVX,1.95,0.55,"배출 컨베이어 (벽 통과)","F"],
  [CVX,1.95,-1.1,"스틱공급장치","P"],[2.9,1.95,-3.8,"카토너","P"],[2.7,2.25,-6.0,"케이스 프린터 · 비전","P"],
  [2.9,2.05,-7.2,"X-ray","P"],[2.7,1.95,-8.2,"중량선별기","P"],[2.8,1.95,-9.6,"대케이스 포장 (수동)","P"],[3.6,1.95,-14.5,"대박스 포장 · 파렛트 적재","P"]];

/* ── 작업자 : 서는 자리(stand) · 손 목표(reach) · 데크 여부 · 들고 가는 물건 · 확대 시점 ── */
const JOBS={
  look:   {stand:[1.4,4.9], reach:null, dur:1.4},
  power:  {stand:[3.88,4.25], reach:ANC.mainPow, dur:1.2},
  air:    {stand:[6.05,1.12], reach:ANC.air1, dur:1.4},
  dust:   {stand:[5.2,1.95], deck:true, reach:ANC.dust, dur:1.4, view:"hopper"},
  panel:  {stand:[1.65,1.83], reach:ANC.panelSw, dur:1.0},
  lift:   {stand:[3.9,5.2], reach:ANC.liftUse, carry:"sts", dur:2.6, view:"lift"},
  scoop:  {stand:[XF,3.95], deck:true, reach:ANC.hop2, carry:"scoop", dur:3.0, view:"hopper", pour:true},
  roll:   {stand:[5.25,ZC+.15], reach:ANC.roll, carry:"roll", dur:3.0, view:"roll"},
  rollOut:{stand:[5.25,ZC+.15], reach:ANC.roll, carry:null, dur:2.4, view:"roll"},
  prn:    {stand:[5.25,ZC-.45], reach:ANC.prn, dur:1.6, view:"printer"},
  door:   {stand:[2.35,ZC-.3], reach:ANC.door, dur:1.4, view:"door"},
  front:  {stand:[2.35,ZC+.15], reach:ANC.sealFront, dur:2.4, view:"door"},
  chute:  {stand:[2.35,ZC+.45], reach:ANC.chute, dur:2.6, view:"chute"},
  dialF:  {stand:[2.2,ZC], deck:true, reach:ANC.dialF, dur:2.8, view:"dial"},
  dialB:  {stand:[4.15,ZC], deck:true, reach:ANC.dialB, dur:2.8, view:"dialB"},
  leak:   {stand:[1.05,1.9], reach:ANC.leak, dur:2.0},
  docF:   {stand:[0.6,4.9], reach:ANC.docF, dur:1.4},
  align:  {stand:[4.1,-0.6], reach:ANC.align, dur:1.0, view:"sw"},
  /* 포장실 */
  ctBack: {stand:[3.95,-2.35], reach:ANC.sfSw, dur:1.4, view:"ctBack"},
  hm:     {stand:[3.85,-4.8], reach:ANC.hm, dur:1.4, view:"hm"},
  cwPow:  {stand:[3.35,-8.05], reach:ANC.cwPow, dur:1.2, view:"cw"},
  xrPow:  {stand:[3.8,-7.0], reach:ANC.xrPow, dur:1.4, view:"xr"},
  prPow:  {stand:[3.65,-5.85], reach:ANC.prPow, dur:1.4, view:"pr"},
  mag:    {stand:[3.8,-3.17], reach:ANC.mag, carry:"cartons", dur:2.6, view:"ct"},
  leaf:   {stand:[3.8,-2.45], reach:ANC.leaf, carry:"leaf", dur:2.4, view:"ct"},
  magOut: {stand:[3.8,-3.6], reach:ANC.magOut, dur:2.4, view:"ct"},
  ink:    {stand:[3.65,-5.85], reach:ANC.prHead, carry:"ink", dur:2.8, view:"pr"},
  leafAdj:{stand:[3.8,-2.45], reach:ANC.leaf, dur:2.6, view:"ct"},
  docP:   {stand:[7.4,-14.6], reach:ANC.docP, dur:1.4},
  bin:    {stand:[3.45,-8.85], reach:ANC.bin, dur:1.6, view:"bin"}
};

/* ── 1인칭 설비 화면 (c : 화면 중심 · n : 화면이 바라보는 방향 · w : 표시 폭 m) ── */
const FP_MON={
  fl:{k:["fl"], nm:"충전기 컨트롤 판넬", c:[2.292,1.53,1.833], n:[-1,0,0], w:.42},
  sf:{k:["sf"], nm:"스틱공급장치 판넬", c:[3.587,1.395,-0.13], n:[1,0,0], w:.30},
  ct:{k:["ct"], nm:"카토너 판넬", c:[3.637,1.545,-5.25], n:[1,0,0], w:.30},
  pr:{k:["pr","vs"], nm:"케이스 프린터 · 비전 화면", c:[2.527,1.715,-6.025], n:[1,0,0], w:.40},
  xr:{k:["xr"], nm:"X-ray 조작 화면", c:[3.148,1.525,-7.22], n:[1,0,0], w:.40},
  cw:{k:["cw"], nm:"중량선별기 조작화면", c:[2.567,1.52,-8.22], n:[1,0,0], w:.36}
};
