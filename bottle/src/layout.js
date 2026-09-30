/* ═══════════════════════════════════════════════════════════════════
   라인 배치 (mm) — 병 경로 · 공정 위치 · 카메라 시점 · 장치 핫스팟
   X : 라인 진행(좌→우) · Y : 높이 · Z : 작업자 쪽(+) · 컨베이어 중심선 z=0
   ═══════════════════════════════════════════════════════════════════ */
const CH=900;                      /* 컨베이어 상면 높이 */
const XS=-4760;                    /* 컨베이어 시작 (턴테이블 출구) */
const XE=4300;                     /* 컨베이어 끝 (집적 테이블 입구) */
const AISLE=1250;                  /* 작업자 통로 z */
const L={
  /* UA-120 */
  uaX0:-5050, uaX1:-3230,
  tt:{x:-4760, z:-372, r:370},                       /* 언스크램블 턴테이블 (가장자리가 z=0 에 닿음) */
  hop:{x0:-5620, x1:-5160, z0:-240, z1:260},         /* 빈 병 호퍼 (라인 왼쪽 앞) */
  belt0:-4560, inv0:-4460, inv1:-4160, flat1:-3700, inv2:-3700, inv3:-3400, belt1:-3330,
  air:[-4080,-3890], vac:[-3990,-3800],               /* 1차·2차 이온 에어 / 진공 */
  /* SG-120 */
  sg:-2620,
  /* 로드셀 */
  lc1:-1900, lc2:360, lcW:280,
  /* DMC-60T : 트윈 노즐 (N1 = 상류, N2 = 하류) */
  n1:-880, n2:-720, dmcX0:-1460, dmcX1:-150,
  /* 리젝트 */
  rej:660, rejBin:{x:660, z:560},
  /* HPE-100 */
  pe:1500,
  /* RCS-120 : 인피드 스타휠 A · 터렛 T · 아웃피드 스타휠 B (피치원 반지름 같음) */
  R:180, A:{x:2640,z:-180}, B:{x:3240,z:-180}, T:null,
  screw0:1940, screw1:2610,
  /* 집적 테이블 */
  table:{x:4800, z:-10, r:500}
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
const sOfX=x=>x-XS;                                   /* 직선 구간 (캡핑기 이전) */
const S_A=PATH.segs[1].s0, S_T0=PATH.segs[2].s0, S_T1=PATH.segs[2].s1, S_B1=PATH.segs[3].s1;
const S_END=PATH.len;


/* ── 카메라 시점 ── */
Object.assign(CAMVIEW,{
  all:{yaw:-0.46,pitch:0.27,dist:9900,tx:-150,ty:820,tz:-150},
  ua: {yaw:-0.62,pitch:0.34,dist:3600,tx:-4380,ty:1000,tz:-200},
  sg: {yaw:-0.45,pitch:0.22,dist:2700,tx:-2720,ty:1350,tz:-100},
  dmc:{yaw:-0.50,pitch:0.30,dist:2700,tx:-820,ty:1250,tz:-320},
  wc: {yaw:-0.42,pitch:0.30,dist:3700,tx:-700,ty:980,tz:-100},
  pe: {yaw:-0.45,pitch:0.22,dist:2800,tx:1450,ty:1350,tz:-150},
  rc: {yaw:-0.50,pitch:0.30,dist:4300,tx:2800,ty:1450,tz:-300},
  table:{yaw:-0.62,pitch:0.55,dist:2400,tx:4700,ty:950,tz:0},
  top:{yaw:-0.0001,pitch:1.42,dist:13000,tx:-100,ty:300,tz:0}
});
/* 작업 영역 확대 시점 (자재 보충 · 조치) */
const WORKVIEW={
  bottle:{yaw:-0.85,pitch:0.30,dist:3300,tx:-5000,ty:900,tz:100},
  gel:   {yaw:-0.40,pitch:0.20,dist:2300,tx:-2560,ty:1250,tz:150},
  tab:   {yaw:-0.70,pitch:0.34,dist:3000,tx:-1250,ty:1300,tz:0},
  film:  {yaw:-0.40,pitch:0.20,dist:2300,tx:1480,ty:1250,tz:150},
  cap:   {yaw:-0.40,pitch:0.22,dist:3400,tx:2200,ty:1500,tz:100},
  reject:{yaw:-0.30,pitch:0.30,dist:2600,tx:600,ty:800,tz:200},
  table: {yaw:-0.55,pitch:0.42,dist:2800,tx:4700,ty:900,tz:250}
};

/* ── 장치 핫스팟 위치 (월드 mm) ── */
const DEVPOS={
  1:[-5390,1250,60], 2:[-4760,1020,-372], 3:[-4300,1080,0], 4:[-3900,880,60],
  5:[-3090,1640,120], 6:[-2620,1300,170], 7:[-2620,1130,170],
  8:[-1900,960,80], 9:[-820,2000,-800], 10:[-820,1560,-500], 11:[-800,1440,-150], 12:[-800,1200,0], 13:[-800,950,70],
  14:[360,960,80], 15:[660,760,560], 16:[120,1420,770],
  17:[1500,1560,0], 18:[1500,1200,50],
  19:[2110,1990,60], 20:[2350,980,90], 21:[2940,1500,-379], 22:[4800,1050,-10]
};
