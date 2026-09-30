/* ═══════════════════════════════════════════════════════════════════
   라인 배치 (mm) — 병 경로 · 공정 위치 · 카메라 시점 · 장치 핫스팟
   X : 라인 진행(좌→우) · Y : 높이 · Z : 작업자 쪽(+) · 컨베이어 중심선 z=0
   ═══════════════════════════════════════════════════════════════════ */
const CH=900;                      /* 컨베이어 상면 높이 */
const XS=-4760;                    /* 컨베이어 시작 (턴테이블 출구) */
const XE=7325;                     /* 컨베이어 끝 (집적 테이블 입구) */
const AISLE=1250;                  /* 작업자 통로 z */
const L={
  /* UA-120 */
  uaX0:-5200, uaX1:-3230,
  tt:{x:-4760, z:-372, r:370},                       /* 언스크램블 턴테이블 (가장자리가 z=0 에 닿음) */
  hop:{x0:-3900, x1:-3380, z0:-760, z1:-280, y0:1080, y1:1560},   /* 벌크 호퍼 (가드 안 뒤쪽 오른칸) */
  belt0:-4560, inv0:-4460, inv1:-4160, flat1:-3700, inv2:-3700, inv3:-3400, belt1:-3330,
  air:[-4080,-3890], vac:[-3990,-3800],               /* 1차·2차 이온 에어 / 진공 */
  /* SG-120 */
  sg:-2050,
  /* 로드셀 */
  lc1:-898, lc2:1989, lcW:300, lcP:150,              /* 로드셀 스테이션 : 데드 플레이트 폭 · 포크 피치 */
  /* DMC-60T : 트윈 노즐 (N1 = 상류, N2 = 하류) */
  n1:356, n2:516, dmcDX:1236,                            /* DMC 는 설계 좌표 + dmcDX 로 배치 */
  /* 리젝트 */
  rej:2489, rejBin:{x:2489, z:330},
  /* HPE-100 */
  pe:3687,
  /* RCS-120 : 인피드 스타휠 A · 터렛 T · 아웃피드 스타휠 B (피치원 반지름 같음) */
  R:180, A:{x:5428,z:-180}, B:{x:6028,z:-180}, T:null,
  screw0:4728, screw1:5398,
  /* 집적 테이블 */
  table:{x:7825, z:-10, r:500}
};
L.T={x:(L.A.x+L.B.x)/2, z:L.A.z-Math.sqrt((2*L.R)**2-((L.B.x-L.A.x)/2)**2)};

/* ── 병 경로 : 직선 → A 원호 → T 원호 → B 원호 → 직선 ── */
const PATH=(function(){
  const R=L.R, A=L.A, B=L.B, T=L.T;
  const aT=Math.atan2(T.z-A.z,T.x-A.x);              /* A 에서 본 T 방향 (−33.6°) */
  const tA=Math.atan2(A.z-T.z,A.x-T.x);              /* T 에서 본 A 방향 (146.4°) */
  const tB=Math.atan2(B.z-T.z,B.x-T.x)+Math.PI*2;    /* T 에서 본 B 방향 (33.6°+360°) */
  const bT=Math.atan2(T.z-B.z,T.x-B.x)+Math.PI*2;    /* B 에서 본 T 방향 (213.6°) */
  const segs=[];
  let s=0;
  const add=o=>{o.s0=s; s+=o.len; o.s1=s; segs.push(o);};
  add({k:"line", x0:XS, len:A.x-XS});
  add({k:"arc", c:A, a0:Math.PI/2, a1:aT, len:R*Math.abs(Math.PI/2-aT), id:"A"});
  add({k:"arc", c:T, a0:tA, a1:tB, len:R*Math.abs(tB-tA), id:"T"});
  add({k:"arc", c:B, a0:bT, a1:Math.PI/2, len:R*Math.abs(bT-Math.PI/2), id:"B"});
  add({k:"line", x0:B.x, len:XE-B.x, out:true});
  return {segs, len:s, aT, tA, tB, bT};
})();
/* 경로 좌표 s → {x,z,h(진행 방향 각), seg} */
function pathAt(s){
  const P=PATH.segs;
  let g=P[0];
  for(const q of P){ if(s>=q.s0) g=q; }
  const u=s-g.s0;
  if(g.k==="line") return {x:g.x0+u, z:0, h:0, seg:g};
  const a=g.a0+(g.a1-g.a0)*(u/g.len);
  const dir=Math.sign(g.a1-g.a0);
  return {x:g.c.x+L.R*Math.cos(a), z:g.c.z+L.R*Math.sin(a), h:Math.atan2(Math.cos(a)*dir,-Math.sin(a)*dir), a, seg:g};
}
/* 로드셀 스테이션 위치 : IN(컨베이어 끝) → A 팬 → B 팬 → OUT(컨베이어 시작) · 게이트 핀 · IN 스토퍼 */
function lcGeo(X){ const d=BD().d, p=L.lcP;
  return {IN:X-1.5*p, A:X-0.5*p, B:X+0.5*p, OUT:X+1.5*p, inFace:X-1.5*p+d/2, gateFace:X-1.5*p-d/2-40}; }
const sOfX=x=>x-XS;                                   /* 직선 구간 (캡핑기 이전) */
const S_A=PATH.segs[1].s0, S_T0=PATH.segs[2].s0, S_T1=PATH.segs[2].s1, S_B1=PATH.segs[3].s1;
const S_END=PATH.len;


/* ── 카메라 시점 ── */
Object.assign(CAMVIEW,{
  all:{yaw:-0.36,pitch:0.26,dist:14600,tx:1250,ty:1000,tz:-150},
  ua: {yaw:-0.55,pitch:0.28,dist:3900,tx:-4250,ty:1250,tz:-200},
  sg: {yaw:-0.42,pitch:0.20,dist:2900,tx:-2290,ty:1400,tz:-150},
  dmc:{yaw:-0.45,pitch:0.26,dist:3100,tx:560,ty:1350,tz:-300},
  wc: {yaw:-0.40,pitch:0.30,dist:4800,tx:545,ty:1050,tz:-100},
  pe: {yaw:-0.42,pitch:0.22,dist:2800,tx:3637,ty:1350,tz:-200},
  rc: {yaw:-0.45,pitch:0.26,dist:4200,tx:5568,ty:1500,tz:-350},
  table:{yaw:-0.62,pitch:0.55,dist:2400,tx:7725,ty:950,tz:0},
  top:{yaw:-0.0001,pitch:1.42,dist:16500,tx:1400,ty:300,tz:0}
});
/* 작업 영역 확대 시점 (자재 보충 · 조치) */
const WORKVIEW={
  bottle:{yaw:-0.30,pitch:0.22,dist:3000,tx:-3800,ty:1250,tz:0},
  gel:   {yaw:-0.40,pitch:0.18,dist:2600,tx:-2390,ty:1400,tz:150},
  tab:   {yaw:-0.55,pitch:0.30,dist:3000,tx:300,ty:1450,tz:-100},
  film:  {yaw:-0.35,pitch:0.20,dist:2700,tx:3587,ty:1300,tz:100},
  cap:   {yaw:-0.35,pitch:0.22,dist:3000,tx:5138,ty:1350,tz:0},
  reject:{yaw:-0.30,pitch:0.30,dist:2600,tx:2389,ty:900,tz:250},
  table: {yaw:-0.55,pitch:0.42,dist:2800,tx:7725,ty:900,tz:250}
};

/* ── 장치 핫스팟 위치 (월드 mm) ── */
const DEVPOS={
  1:[-3640,1500,-500], 2:[-4760,1020,-372], 3:[-4000,1080,0], 4:[-3900,880,60],
  5:[L.sg-440,1700,80], 6:[L.sg,1400,160], 7:[L.sg,1180,160],
  8:[L.lc1,960,120], 9:[436,1850,-700], 10:[436,1560,-450], 11:[436,1420,20], 12:[436,1200,60], 13:[436,960,120],
  14:[L.lc2,960,120], 15:[L.rej,780,330], 16:[L.lc2+420,1650,-230],
  17:[L.pe,1560,-560], 18:[L.pe,1330,40],
  19:[5038,1560,-420], 20:[5138,980,90], 21:[L.T.x,1900,-379], 22:[L.table.x,1050,-10]
};
