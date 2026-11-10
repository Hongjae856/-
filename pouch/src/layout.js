/* ═══════════════════════════════════════════════════════════════════
   배치 (mm) — 충전실 · 포장실 한 장면 · 파우치 경로 · 카메라 시점
   X : 라인 진행(좌→우) · Y : 높이(바닥 0) · Z : 작업자 쪽(+)
   ※ 배치도 · 설비 치수 자료 없음 — SOP 사진 · 현장 영상 비율로 정한 추정값 (실측 아님)
   ═══════════════════════════════════════════════════════════════════ */
const ROOM={x0:-9800, wall:-600, wallT:220, x1:12800, back:-3200, front:3000, ceil:4600};
/* 충전기 도면(사용자 제공 11/10) : 데크 높이 2000 · 난간 935.6 · 프레임 2855 × 2640 · 본체 폭 1550 · 최고 높이 3664.75
   · 계단 : 우측 후방 1586.47 × 630, 50° · 호퍼 3기는 앞→뒤 배열
   · 도면에 없는 전면 확장 데크(같은 재질 · 난간)는 사용자 표시 기준 약 1000 mm [추정] */
const FIL={xc:-5600, x0:-6375, x1:-4825, z0:-900, z1:300, yTop:2000};   /* 파우치 충전기 SP303 본체 (폭 1550) */
const DECK={x0:FIL.xc-1427.5, x1:FIL.xc+1427.5, z0:200-2640, zF:200, z1:1200, y:2000, t:90, rail:935.6};
const STAIR={xTop:DECK.x1, xBot:DECK.x1+1586.47, z0:DECK.z0, z1:DECK.z0+630, steps:11};   /* -x 쪽으로 오른다 */
const HOP=[                                                              /* 2층 데크 호퍼 (앞 → 뒤 : 1 첨가제 · 2 주성분 · 3 백당) */
  {n:1, k:"add",  nm:"첨가제", x:FIL.xc, z:120,  dial:"F1", vac:true},
  {n:2, k:"main", nm:"주성분", x:FIL.xc, z:-270, dial:"F2", vac:false},
  {n:3, k:"sug",  nm:"백당",   x:FIL.xc, z:-660, dial:"B",  vac:true}
];
const NOZ={n:10, x0:FIL.xc-288, dx:64, y:1760, z:360};                    /* 노즐 10열 (전면) */
const CV={y:880, z:620, w:150};                                          /* 정렬컨베어 (충전기 전면 → 경사 → 포장실) */
const PANEL_F={x:FIL.x0-330, z:520};                                     /* 충전기 컨트롤 판넬 (본체 왼쪽 앞) */
const IBC=[{k:"add", x:-6500, z:-1950}, {k:"sug", x:-4900, z:-1950}];   /* 1층 충전기 뒤편 IBC */
const LIFT={x:DECK.x1+520, z:-1150};                                     /* 리프터 (1층 ↔ 데크) */
const ROLL={x:FIL.xc, z:-1500, y:950};                                   /* 은박 롤 거치대 (후면) */

/* 포장실 */
const PK={y:900};
const FEED={x0:250, x1:1650, z0:-650, z1:560};                           /* 스틱공급장치 */
const CT={x0:1850, x1:5400, z0:-820, z1:560};                            /* 카토너 HC 100L */
const HM={x:4700, z:-1350};                                              /* 핫멜트 유닛 */
const PR={x0:5850, x1:6650};                                             /* 케이스 잉크젯 프린터 + 비전 */
const XR={x0:7050, x1:8350};                                             /* X-ray */
const CW={x0:8650, x1:9650};                                             /* 중량선별기 */
const BIN={x:10050, zX:-430, zW:430};                                    /* 배출함 : X-ray(뒤) · 중량선별기(앞) */
const PACK={x0:10650, x1:12200, z0:-450, z1:700};                        /* 수동포장 작업대 */
const OUT={x0:5400, x1:10650};                                           /* 카톤 출구 컨베이어 */

/* ── 파우치 경로 (정렬컨베어) : 충전기 앞 → 직선 → 경사 → 벽 통과 → 스틱공급장치 투입부 ── */
const PPATH=(function(){
  const P=[[-6300,CV.y,CV.z],[-3300,CV.y,CV.z],[-1300,1460,CV.z],[ROOM.wall-200,1460,CV.z],[FEED.x0+150,1460,CV.z],[FEED.x0+450,1460,0]];
  const seg=[]; let s=0;
  for(let i=0;i<P.length-1;i++){ const a=P[i], b=P[i+1], len=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]); seg.push({a,b,s0:s,len}); s+=len; }
  return {P,seg,len:s};
})();
function ppAt(s){
  const S2=PPATH.seg; let g=S2[0];
  for(const q of S2) if(s>=q.s0) g=q;
  const u=clamp((s-g.s0)/g.len,0,1);
  return {x:lerp(g.a[0],g.b[0],u), y:lerp(g.a[1],g.b[1],u), z:lerp(g.a[2],g.b[2],u), dx:(g.b[0]-g.a[0])/g.len, dy:(g.b[1]-g.a[1])/g.len, dz:(g.b[2]-g.a[2])/g.len};
}
/* 카톤 경로 : 카토너 출구 → 프린터 → X-ray → 중량선별기 → 작업대 */
const CPATH={x0:CT.x1-300, x1:PACK.x0+200};

/* 그림자 범위 (두 실 전체) */
R3.lo=[-9900,-10,-3300]; R3.hi=[12900,4300,2700];

/* ── 카메라 시점 ── */
Object.assign(CAMVIEW,{
  all:  {yaw:-0.30,pitch:0.30,dist:24500,tx:1200,ty:1200,tz:-200},
  fill: {yaw:-0.42,pitch:0.24,dist:10500,tx:-5300,ty:1500,tz:-300},
  front:{yaw:-0.20,pitch:0.10,dist:4300,tx:-5650,ty:1500,tz:300},
  back: {yaw:2.80,pitch:0.20,dist:4600,tx:-5500,ty:1300,tz:-1200},
  deck: {yaw:-0.45,pitch:0.42,dist:5600,tx:-5550,ty:2500,tz:-400},
  panel:{yaw:-0.05,pitch:0.08,dist:2300,tx:-7050,ty:1350,tz:520},
  conv: {yaw:-0.55,pitch:0.30,dist:6200,tx:-2400,ty:1100,tz:500},
  pack: {yaw:-0.30,pitch:0.26,dist:13000,tx:6200,ty:1100,tz:-100},
  feed: {yaw:-0.35,pitch:0.20,dist:4600,tx:2600,ty:1200,tz:-100},
  pr:   {yaw:-0.25,pitch:0.16,dist:3400,tx:6250,ty:1250,tz:0},
  xr:   {yaw:-0.30,pitch:0.16,dist:3800,tx:7700,ty:1250,tz:0},
  cw:   {yaw:-0.30,pitch:0.18,dist:3800,tx:9400,ty:1100,tz:0},
  hand: {yaw:-0.45,pitch:0.30,dist:4200,tx:11200,ty:1000,tz:100},
  top:  {yaw:-0.0001,pitch:1.42,dist:27000,tx:1500,ty:300,tz:-100}
});
/* 작업 확대 시점 */
const WORKVIEW={
  hopper:{yaw:-0.60,pitch:0.38,dist:3600,tx:-5600,ty:2500,tz:-250},
  dial:  {yaw:-0.15,pitch:0.28,dist:2300,tx:-5600,ty:2200,tz:400},
  dialB: {yaw:2.95,pitch:0.28,dist:2300,tx:-5600,ty:2200,tz:-1000},
  ibc:   {yaw:2.70,pitch:0.25,dist:4200,tx:-5600,ty:1100,tz:-2100},
  lift:  {yaw:-0.70,pitch:0.30,dist:4600,tx:-3650,ty:1500,tz:-1150},
  roll:  {yaw:2.85,pitch:0.20,dist:2800,tx:-5600,ty:1100,tz:-1400},
  printer:{yaw:2.75,pitch:0.20,dist:2600,tx:-5300,ty:1500,tz:-1100},
  chute: {yaw:-0.25,pitch:0.22,dist:2300,tx:-5650,ty:1100,tz:500},
  door:  {yaw:-0.15,pitch:0.12,dist:2800,tx:-5600,ty:1500,tz:400},
  sw:    {yaw:-0.30,pitch:0.20,dist:2600,tx:600,ty:1200,tz:600},
  ct:    {yaw:-0.30,pitch:0.20,dist:4000,tx:3400,ty:1200,tz:0},
  ctBack:{yaw:2.75,pitch:0.22,dist:4200,tx:3400,ty:1100,tz:-800},
  hm:    {yaw:2.60,pitch:0.25,dist:2600,tx:4700,ty:900,tz:-1300},
  pr:    {yaw:-0.25,pitch:0.16,dist:2600,tx:6250,ty:1250,tz:100},
  xr:    {yaw:-0.30,pitch:0.16,dist:3000,tx:7700,ty:1200,tz:100},
  cw:    {yaw:-0.30,pitch:0.16,dist:3000,tx:9150,ty:1100,tz:100},
  bin:   {yaw:-0.40,pitch:0.30,dist:2600,tx:10050,ty:800,tz:0},
  hand:  {yaw:-0.45,pitch:0.30,dist:3400,tx:11300,ty:1000,tz:100}
};
