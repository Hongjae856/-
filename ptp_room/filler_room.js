/* ═══════════════════════════════════════════════════════════════════
   충전실 (D구역) 방 모드 — PTP 충전기 IDT 에 주입
   · 좌표 : 충전기 월드 단위(≈4 mm) ↔ 공용 mm (벽 중심 x=0, 바닥 y=0)
   · 그리는 것 : 방 배경(천장 없는 단면) · 칸막이 벽(단면 투시) · 벽 개구부 · 연결 컨베이어와 팩(선명)
                 · 포장실 설비 간략 모델(옅은 안개 톤)
   · 연동 : 양품 증가분을 버스로 보내고, 연결 컨베이어가 차면 '후공정 대기'로 사이클을 멈춘다.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
if(!RB) return;
const BL=RB.L;
const XF0=920;                                   /* 벽 중심의 충전기 X (배출 컨베이어 끝 592 에서 약 1.3 m) */
const fx=x=>XF0+x/4, fy=y=>FLOORY+y/4, fz=z=>z/4;
/* 포장라인 월드 단위(≈5 mm) → 충전기 월드 단위 : 옆방 간략 모델을 포장라인 좌표 그대로 적기 위함 */
const LX=x=>fx((x+1600)*5), LY=y=>fy(y*5), LZ=z=>fz(z*5), LS=1.25;

/* ═══ 1. 연동 브리지 ═══ */
let lastGood=null;
const _tick=tick;
tick=function(){
  const r=_tick.apply(this,arguments);
  const g=S&&S.cnt?S.cnt.good:0;
  if(lastGood==null||g<lastGood) lastGood=g;
  const d=g-lastGood; lastGood=g;
  if(d>0) RB.emit(d);
  RB.st.ppm=S&&S.running?S.spd.auto*S.cfg.rows:0;          /* 공칭 공급속도 (팩/분) */
  if(RB.st.link&&RB.st.wait&&S&&S.running) S.spm=0;         /* 후공정 대기 : 회전수 표시 0 */
  return r;
};
/* 후공정 대기 : 연결 컨베이어가 시작점까지 차면 사이클을 멈춘다 (운전 상태는 유지 → 해소 시 자동 재가동) */
const _cps=cyclesPerSec;
cyclesPerSec=function(){ return (RB.st.link&&RB.st.wait)?0:_cps.apply(this,arguments); };
/* 교육과정을 새로 시작하면 셸에 알린다 (연동 해제) */
const _start=startSim;
startSim=function(){ const r=_start.apply(this,arguments); try{ RB.onCourse&&RB.onCourse('filler'); }catch(e){} lastGood=null; return r; };
/* 보이지 않는 방 : 3D 그리기 생략 (시뮬레이션은 계속) */
const _draw=m3Draw;
m3Draw=function(){ if(window.ROOM_ACTIVE===false) return; return _draw.apply(this,arguments); };

const wait=ms=>new Promise(r=>setTimeout(r,ms));
function setSpd(v){ SPD=v; $$('#spdGrp button').forEach(b=>b.classList.toggle('on',Number(b.dataset.s)===v)); }
/* 연동 가동 : 가동 과정 기본모드로 들어가 기동 조건을 모두 맞춘 뒤 START */
async function demo(){
  try{
    apStop&&apStop();
    const sp=$('#splash');
    if($('#chooseOperation')) $('#chooseOperation').click();
    openProdSel('easy'); await wait(60);
    const pb=$('#psProd [data-pp="A"]')||$('#psProd [data-pp]'); if(pb) pb.click();
    await wait(30); $('#psOk').click(); await wait(500);
    if(sp&&!sp.classList.contains('hide')) return {ok:false,msg:'과정 시작 실패'};
    /* 로그인 */
    { const acc=ACCOUNTS[0]; S.user=acc; S.lvl=acc.lvl; lgOpen=false; hScreen='main'; }
    /* 유틸리티 · 자재 · 설정 */
    S.main=true; S.air=true; S.airP=6.2; S.chiller=true; S.dust=true; S.door='closed'; S.emg=false;
    for(const p of CPARTS) S.cp[p.k]=true;
    S.film.loaded=true; S.foil.loaded=true; S.film.len=100; S.foil.len=100;
    S.prodLoaded=true; S.hopperLvl=100; S.feedLvl=100;
    S.heaterOn=true; HEATERS.forEach(h=>{ S.pv[h.k]=S.sv[h.k]; });
    S.setup.as1=D_SEAL-D_FORM; S.setup.as2=PATH.total-D_SEAL; S.setup.as3=true;
    S.auto.feed=true;
    for(const k in S.man2) if(typeof S.man2[k]==='boolean') S.man2[k]=false;
    S.trouble=false; S.cnt.target=10000000; S.cnt.remain=S.cnt.target-S.cnt.good;
    try{ alarmReset(); }catch(e){}
    const bad=startChecks().filter(c=>!c.ok);
    if(bad.length) return {ok:false,msg:bad.map(c=>c.nm).join(', ')};
    pressSTART(); await wait(80);
    if(!S.running) return {ok:false,msg:'START 실패'};
    setSpd(1); drawHMI(); ROOM_VIEW();
    return {ok:true};
  }catch(e){ console.error(e); return {ok:false,msg:e.message}; }
}
function stop(){ try{ if(S&&S.running) pressSTOP(); }catch(e){} }
const ROOM_DEFAULT={yaw:-0.62,pitch:0.36,dist:2900,tx:560,ty:20,tz:60};
Object.assign(M3VIEW.all,ROOM_DEFAULT);          /* '전체' 시점 = 방 시점 (옆방이 함께 보이도록) */
function ROOM_VIEW(){ Object.assign(M3.tgt,ROOM_DEFAULT); }
window.ROOM_DEMO_TEXT=()=>'연동 가동(시연) 중 — 충전기에서 나온 PTP 가 배출 컨베이어 → 벽 개구부 → 연결 컨베이어를 지나 포장실 카토너 스태커로 공급됩니다.'+(RB.st.wait?'  ⏸ 연결 컨베이어 만재 → 후공정 대기':'');
/* 방에 들어올 때 : 벽 바로 안쪽에서 시작해 1.3 초 동안 기본 시점으로 이동 */
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
let glideId=0;
function glide(from,to,dur){
  /* 프레임이 끊겨도(무거운 첫 프레임 등) 이동이 한 번에 끝나지 않도록 프레임당 진행량은 1/30 초까지 */
  const id=++glideId, K=['yaw','pitch','dist','tx','ty','tz']; let u=0, last=performance.now();
  const f=()=>{ if(id!==glideId) return; const now=performance.now(); u=Math.min(1,u+Math.min(now-last,33)/dur); last=now;
    const e=ease(u), v={}; for(const k of K) v[k]=from[k]+(to[k]-from[k])*e;
    Object.assign(M3.cam,v); Object.assign(M3.tgt,v); if(u<1) requestAnimationFrame(f); };
  f();
}
function enter(from){
  glideId++;                                     /* 진행 중인 이동 취소 */
  if(!M3.on) return;
  if(from==='line') glide({yaw:0.55,pitch:0.26,dist:900,tx:340,ty:30,tz:80},ROOM_DEFAULT,1300);
  else Object.assign(M3.tgt,ROOM_DEFAULT);
}
window.ROOM_API={
  running:()=>!!(S&&S.running), good:()=>S&&S.cnt?S.cnt.good:0,
  getSpd:()=>SPD, setSpd, demo, stop, enter
};
/* 3D 첫 진입 시 방 기본 시점 */
const _m3t=window.m3Toggle;
if(typeof _m3t==='function'){ window.m3Toggle=function(){ const was=M3.on; const r=_m3t.apply(this,arguments); if(!was&&M3.on) Object.assign(M3.tgt,ROOM_DEFAULT); return r; }; }

/* ═══ 2. 방 배경 (2D) : 뒷벽 · 코브 · 두 구역 바닥 · 구역 표지 — 천장 없음 ═══ */
window.ROOM_BG=function(g,FL){
  const poly=(pts,fill)=>{ const P=pts.map(prj); if(P.some(q=>q.z<=40)) return null;
    g.beginPath(); g.moveTo(P[0].x,P[0].y); for(let i=1;i<P.length;i++) g.lineTo(P[i].x,P[i].y); g.closePath();
    if(fill){ g.fillStyle=fill; g.fill(); } return P; };
  const x0=fx(BL.dMinX), x1=fx(BL.gMaxX), xw=fx(BL.wallX), WZ=fz(BL.backZ), FZ=fz(BL.frontZ), TY=FL+BL.wallH/4;
  /* 뒷벽 (두 방 공통 · 벽 위치에 이음) */
  const P=poly([P3(x0,FL,WZ),P3(x1,FL,WZ),P3(x1,TY,WZ),P3(x0,TY,WZ)]);
  if(P){ const y0=Math.min(P[2].y,P[3].y), y1=Math.max(P[0].y,P[1].y), wg=g.createLinearGradient(0,y0,0,y1);
    ROOM_COL.wall.forEach((c,i)=>wg.addColorStop([0,.58,1][i],c)); g.fillStyle=wg; g.fill();
    g.strokeStyle=ROOM_COL.seam; g.lineWidth=1;
    for(let x=x0+150;x<x1;x+=150){ const a=prj(P3(x,FL,WZ)), b=prj(P3(x,TY,WZ)); if(a.z>40&&b.z>40){ g.beginPath(); g.moveTo(a.x,a.y); g.lineTo(b.x,b.y); g.stroke(); } } }
  poly([P3(x0,FL,WZ),P3(x1,FL,WZ),P3(x1,FL+8,WZ+8),P3(x0,FL+8,WZ+8)],ROOM_COL.cove);
  /* 바닥 : 충전실(D) · 포장실(G) */
  const floor=(xa,xb,cols)=>{ const Q=poly([P3(xa,FL,WZ),P3(xb,FL,WZ),P3(xb,FL,FZ),P3(xa,FL,FZ)]);
    if(!Q) return; const y0=Math.min(Q[0].y,Q[1].y), y1=Math.max(Q[2].y,Q[3].y), fg=g.createLinearGradient(0,y0,0,y1);
    cols.forEach((c,i)=>fg.addColorStop([0,.34,1][i],c)); g.fillStyle=fg; g.fill(); };
  floor(x0,xw,ROOM_COL.dFloor); floor(xw,x1,ROOM_COL.gFloor);
  /* 방 앞쪽 단면 띠 (바닥 슬래브 두께) */
  poly([P3(x0,FL,FZ),P3(x1,FL,FZ),P3(x1,FL-14,FZ),P3(x0,FL-14,FZ)],'#cfd6dd');
  roomZoneBadge(g,prjOk(P3(fx(-6800),FL,fz(3300))),'충전실 · D구역','PTP 충전 (HM 400P)','#2f7fb8');
  roomZoneBadge(g,prjOk(P3(fx(2600),FL,fz(3300))),'포장실 · G구역','카토너 → 박스포장 → 팔렛타이저','#8a6d2f');
};
function prjOk(p){ const q=prj(p); return q.z>60?q:null; }

/* ═══ 3. 3D : 칸막이 벽 · 연결 컨베이어 · 팩 · 포장실 간략 모델 ═══ */
/* 회전 없는 상자 (모서리 라운드 없음 : 면 수 절약) */
function pbox(x0,x1,y0,y1,z0,z1,hex,o){
  if(x1<x0)[x0,x1]=[x1,x0]; if(y1<y0)[y0,y1]=[y1,y0]; if(z1<z0)[z0,z1]=[z1,z0];
  o=Object.assign({cl:1},o||{});
  const a=P3(x0,y0,z0),b=P3(x1,y0,z0),c=P3(x1,y1,z0),d=P3(x0,y1,z0),e=P3(x0,y0,z1),f=P3(x1,y0,z1),gg=P3(x1,y1,z1),h=P3(x0,y1,z1);
  FA([h,gg,c,d],o.top||hex,o); FA([a,b,f,e],hex,o); FA([e,f,gg,h],hex,o); FA([b,a,d,c],hex,o); FA([f,b,c,gg],hex,o); FA([a,e,h,d],hex,o);
}
/* 임의 방향 상자 : 중심 c, 축 u(길이) · v(높이) · w(폭) 반길이 */
function obox(c,u,v,w,hu,hv,hw,hex,o){
  const P=(su,sv,sw)=>P3(c.x+u.x*hu*su+v.x*hv*sv+w.x*hw*sw, c.y+u.y*hu*su+v.y*hv*sv+w.y*hw*sw, c.z+u.z*hu*su+v.z*hv*sv+w.z*hw*sw);
  o=Object.assign({cl:1},o||{});
  const A=P(-1,-1,-1),B=P(1,-1,-1),C=P(1,1,-1),D=P(-1,1,-1),E=P(-1,-1,1),F=P(1,-1,1),G=P(1,1,1),H=P(-1,1,1);
  FA([H,G,C,D],o.top||hex,o.topO||o); FA([A,B,F,E],o.bot||hex,o); FA([E,F,G,H],hex,o); FA([B,A,D,C],hex,o); FA([F,B,C,G],hex,o); FA([A,E,H,D],hex,o);
}
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const unit=v=>{const l=Math.hypot(v.x,v.y,v.z)||1;return {x:v.x/l,y:v.y/l,z:v.z/l};};
/* 경로 위 한 점의 충전기 좌표 · 국부 축 */
function frameAt(s){
  const p=RB.at(s), c=P3(fx(p.x),fy(p.y),fz(p.z));
  const u=unit({x:p.tx,y:p.ty,z:p.tz}), w=unit(cross(u,{x:0,y:1,z:0})), v=cross(w,u);
  return {c,u,v,w,mm:p};
}

/* ── 칸막이 벽 : 반투명 패널(단면 투시) + 불투명 테두리 · 걸레받이 · 개구부 슬리브 ── */
function wall(){
  const x=fx(BL.wallX), t=BL.wallT/8, z0=fz(BL.backZ), z1=fz(BL.frontZ), y0=FLOORY, y1=FLOORY+BL.wallH/4;
  const H=BL.hole, hz0=fz(H.z0), hz1=fz(H.z1), hy0=fy(H.y0), hy1=fy(H.y1);
  const pane={a:0.22,m:.05,cl:0}, PANE='#eef3f7';
  pbox(x-t,x+t,y0+26,y1-8,z0,hz0,PANE,pane);                 /* 개구부 뒤쪽 */
  pbox(x-t,x+t,y0+26,y1-8,hz1,z1-10,PANE,pane);              /* 개구부 앞쪽 */
  pbox(x-t,x+t,y0+26,hy0,hz0,hz1,PANE,pane);                 /* 개구부 아래 */
  pbox(x-t,x+t,hy1,y1-8,hz0,hz1,PANE,pane);                  /* 개구부 위 */
  /* 불투명 : 상단 캡 · 걸레받이 · 앞쪽 끝 기둥(단면) */
  pbox(x-t-1,x+t+1,y1-8,y1,z0,z1,'#c3ccd5',{m:.2});
  pbox(x-t-2,x+t+2,y0,y0+26,z0,z1,'#d3d9df',{m:.1});
  pbox(x-t-1,x+t+1,y0,y1,z1-10,z1,'#c3ccd5',{m:.2});
  /* 개구부 슬리브 (스테인리스) */
  const ss='#c9ced4', sm={m:.85};
  pbox(x-t-5,x+t+5,hy0-5,hy0,hz0-5,hz1+5,ss,sm); pbox(x-t-5,x+t+5,hy1,hy1+5,hz0-5,hz1+5,ss,sm);
  pbox(x-t-5,x+t+5,hy0,hy1,hz0-5,hz0,ss,sm);     pbox(x-t-5,x+t+5,hy0,hy1,hz1,hz1+5,ss,sm);
}
/* ── 연결 컨베이어 (선명) ── */
const BELT='#3f4854', RAIL='#b2b7bd', LEG='#969ba1';
function conveyor(){
  const L=RB.LEN, hw=RB.L.beltW/8, seg=160;
  for(let s=0;s<L-1;s+=seg){
    const s1=Math.min(L,s+seg), a=frameAt(s), b=frameAt(s1);
    const mid=frameAt((s+s1)/2), len=(s1-s)/8+0.4;
    /* 벨트 · 사이드 레일 */
    obox(P3(mid.c.x-mid.v.x*2.2,mid.c.y-mid.v.y*2.2,mid.c.z-mid.v.z*2.2),mid.u,mid.v,mid.w,len,2.2,hw,BELT,{m:.25});
    for(const sg of [-1,1]){ const o=hw+2.2;
      obox(P3(mid.c.x+mid.w.x*o*sg+mid.v.x*1.5,mid.c.y+mid.v.y*1.5-3,mid.c.z+mid.w.z*o*sg),mid.u,mid.v,mid.w,len,6,1.6,RAIL,{m:.7}); }
  }
  /* 끝단 롤러 · 다리 (벽을 피해 배치) */
  const legAt=[200,1100,2350,3000];
  for(const s of legAt){ const f=frameAt(s); if(Math.abs(f.mm.x-BL.wallX)<220||f.mm.x>1830) continue;
    for(const sg of [-1,1]){ const x=f.c.x+f.w.x*(hw-2)*sg, z=f.c.z+f.w.z*(hw-2)*sg;
      pbox(x-2.2,x+2.2,FLOORY,f.c.y-6,z-2.2,z+2.2,LEG,{m:.6}); }
    pbox(f.c.x-3,f.c.x+3,FLOORY,FLOORY+2,f.c.z-hw-4,f.c.z+hw+4,LEG,{m:.6}); }
}
/* ── 연결 컨베이어 위 PTP 팩 (선명) : 포일면 위 · 필름 포켓면 아래 ── */
function packsOnBelt(){
  const PK=RB.PACK, hu=PK.l/8, hv=PK.h/8, hw=PK.w/8;
  for(const p of RB.st.packs){
    if(p.s<0) continue;
    const f=frameAt(p.s), c=P3(f.c.x+f.v.x*hv,f.c.y+f.v.y*hv,f.c.z+f.v.z*hv);
    obox(c,f.u,f.v,f.w,hu,hv,hw,filmCol(),{top:foilCol(),m:.25,topO:{m:.8,pat:q=>[(q.x-c.x)*3.2,(q.z-c.z)*3.2]}});
  }
}
/* ── 포장실 간략 모델 (옅은 안개 톤) : 포장라인 좌표(≈5 mm) 그대로 적고 변환 ── */
const HZ=h=>roomHazeHex(h);
function gb(x0,x1,y0,y1,z0,z1,hex,o){ pbox(LX(x0),LX(x1),LY(y0),LY(y1),LZ(z0),LZ(z1),HZ(hex),o); }
let gT=0;
function packRoom(){
  const INOX='#dadee2', INOXD='#bcc3ca', ALUF='#c5cbd1', DARK='#2b3138', GL='#c3e4ee';
  const frame=(x0,x1,y0,y1,z0,z1)=>{ for(const x of [x0,x1-6]) for(const z of [z0,z1-6]) gb(x,x+6,y0,y1,z,z+6,ALUF,{m:.7});
    for(const z of [z0,z1-6]) gb(x0,x1,y1-6,y1,z,z+6,ALUF,{m:.7}); for(const x of [x0,x1-6]) gb(x,x+6,y1-6,y1,z0,z1,ALUF,{m:.7}); };
  const glass=(x0,x1,y0,y1,z)=>gb(x0,x1,y0,y1,z-1,z+1,GL,{a:.14,m:.3,cl:0});
  /* ① 카토너 HC 200 */
  const a=-1220,b=-380;
  gb(a,b,16,154,-95,73,INOX,{m:.6}); gb(a,b,154,162,-95,73,INOXD,{m:.6});
  for(let i=1;i<6;i++) gb(a+i*(b-a)/6-1,a+i*(b-a)/6+1,22,146,73,74,INOXD);
  gb(a+8,b-8,162,326,-95,-81,DARK);
  frame(a,b,0,336,-95,77); glass(a,b,162,330,77); glass(a,a+2,162,330,-95); 
  gb(-1140,-396,170,176,-66,-26,'#2f6b4f');
  gb(-560,-396,176,188,28,68,'#d9c99a');
  gb(-930,-860,196,300,-30,30,'#262b31'); gb(-880,-800,230,320,-10,40,'#efe7d2');
  gb(b-26,b-18,326,372,-70,-62,'#9aa3ac');
  /* ② 카톤인쇄기 · ③ 중량선별기 */
  gb(-340,-210,16,170,-70,60,'#d9dde2',{m:.5}); gb(-300,-250,170,250,-40,-10,'#2c3238'); gb(-330,-220,250,262,-50,0,'#c5cbd1');
  gb(-200,10,40,168,-60,60,'#cfd5db',{m:.5}); gb(-170,-20,168,176,-40,40,'#e9ecef'); gb(-10,10,176,236,40,52,'#2c3238'); gb(-8,8,236,268,44,48,'#2c3238');
  /* ④ 박스포장기 CP 10 */
  gb(40,850,16,150,-95,95,'#e3e6ea',{m:.4}); gb(40,850,150,158,-95,95,'#c4cad0',{m:.6});
  frame(40,850,0,400,-95,95); glass(40,850,158,394,95); glass(40,850,394,396,-95);
  gb(120,320,158,330,-80,-20,'#c9a46a'); gb(520,700,158,260,-60,60,'#d2b48a');
  /* ⑤ 팔렛타이저 PT 10 */
  gb(880,1220,0,8,-110,110,ALUF,{m:.7});
  for(const x of [880,1214]) for(const z of [-110,104]) gb(x,x+6,0,330,z,z+6,ALUF,{m:.7});
  gb(880,1220,324,334,-110,110,ALUF,{m:.7}); gb(1020,1060,250,324,-20,20,'#8d959e');
  gb(990,1110,0,14,-70,70,'#3a68b0');
  gb(-380,40,168,176,-16,16,'#3d9b7f');
  /* 스태커 매거진 (연결부 끝 → 선명) */
  gb(-1124,-1040,190,232,-72,-20,INOX,{m:.6});
  for(const dx of [-16,14]) for(const dz of [-60,-34]) pbox(LX(-1082+dx),LX(-1080+dx),LY(232),LY(314),LZ(dz),LZ(dz+2),'#aab3bc',{m:.8});
}
/* 포장실 움직이는 부분 : 타워 램프 · 팔레트 적재 · 카톤 흐름 · 스태커 적재 팩 */
function packRoomDyn(){
  const live=RB.st.lineRun, b=-380;
  gT+=live?RDT*SPD:0;
  gb(b-27,b-17,372,384,-71,-61,live?'#3cb371':'#c9cfd5');
  { const k=live?Math.floor(gT*0.25)%13:4; for(let i=0;i<Math.min(12,k);i++){ const l=Math.floor(i/4), q=i%4;
      gb(995+(q%2)*58,1050+(q%2)*58,14+l*48,60+l*48,-66+Math.floor(q/2)*68,-2+Math.floor(q/2)*68,'#c49a62'); } }
  if(live){ const sp=58, off=(gT*48)%sp; for(let x=-380+off;x<34;x+=sp) gb(x,x+20,176,190,-12,12,'#d9c99a'); }
  { const n=RB.st.link?RB.st.tower:(live?8:0);
    for(let i=0;i<n;i++) pbox(LX(-1095),LX(-1069),LY(234+i*6.4),LY(238.4+i*6.4),LZ(-57),LZ(-35),'#f2f0f6',{top:'#d8d9dd'}); }
}
/* ═══ 세부 형상 (선명 · 정적) ═══ */
const STEEL='#b8bec4', BOLTC='#8c949c', PLATE='#d2d6da', TRAYC='#bcc2c8', STRUT='#9ea6ae', SLV='#c9ced4';
const bolt=(x,y,z,ax)=>{ if(ax==='z') pbox(x-1.5,x+1.5,y-1.5,y+1.5,z,z+1.2,BOLTC,{m:.8}); else pbox(x-1.5,x+1.5,y,y+1.2,z-1.5,z+1.5,BOLTC,{m:.8}); };
function anchor(x,z,h){ pbox(x-h,x+h,FLOORY,FLOORY+1.4,z-h,z+h,PLATE,{m:.75}); for(const dx of [-1,1]) for(const dz of [-1,1]) bolt(x+dx*(h-3.5),FLOORY+1.4,z+dz*(h-3.5)); }
/* 충전기 다리 앵커 플레이트 */
function fillerDetail(){ for(const x of [150,420,690,960,1160]) for(const z of [-90,90]) anchor(X3(x),z,15); }
/* 배선 트레이 (높이 2450 mm) : 충전기 후면 캐비닛 → 벽 관통 → 포장실 */
const TRAY={y:fy(2450), z:fz(-1350), hw:fz(150), side:80/4};
function trayRun(x0,x1,col){ const {y,z,hw,side}=TRAY;
  pbox(x0,x1,y,y+1.5,z-hw,z+hw,col,{m:.7});
  for(const s of [-1,1]) pbox(x0,x1,y,y+side,z+s*hw-0.8,z+s*hw+0.8,col,{m:.7});
  for(let x=x0+25;x<x1;x+=38) pbox(x-1.5,x+1.5,y+1.5,y+2.6,z-hw+1,z+hw-1,col,{m:.7}); }
function cableTray(){
  const xw=fx(BL.wallX), {y,z,hw,side}=TRAY;
  trayRun(370,xw-15,TRAYC);
  for(const x of [250,760]){ pbox(x-2.5,x+2.5,FLOORY,y,z-2.5,z+2.5,STRUT,{m:.6}); pbox(x-3,x+3,y-5,y,z-hw-2.5,z+hw+2.5,STRUT,{m:.6}); anchor(x,z,8); }
  /* 캐비닛 인입 전선관 */
  limb(P3(440,y-1.5,z+hw),P3(440,y-1.5,-126),3,3,STRUT,10,{m:.6});
  limb(P3(440,y-1.5,-126),P3(440,Y3(88)+2,-126),3,3,STRUT,10,{m:.6});
  pbox(434,446,Y3(88),Y3(88)+7,-133,-119,STEEL,{m:.7});
  /* 벽 관통 슬리브 */
  pbox(xw-18,xw+18,y-5,y+side+5,z-hw-5,z+hw+5,SLV,{m:.8});
  /* 포장실 쪽 (옅은 안개 톤) */
  const H=HZ(TRAYC), Hs=HZ(STRUT);
  trayRun(xw+15,LX(840),H);
  for(const lxp of [-1450,-950,-450,50,450,820]){ const x=LX(lxp); pbox(x-2.5,x+2.5,FLOORY,y,z-2.5,z+2.5,Hs); pbox(x-3,x+3,y-5,y,z-hw-2.5,z+hw+2.5,Hs); }
  limb(P3(LX(-800),y-1.5,z+hw),P3(LX(-800),y-1.5,LZ(-92)),3,3,Hs,8,{});
  limb(P3(LX(-800),y-1.5,LZ(-92)),P3(LX(-800),LY(338),LZ(-92)),3,3,Hs,8,{});
}
/* 칸막이 벽 : 패널 이음 기둥 · 구역 표지판 */
function wallDetail(){
  const x=fx(BL.wallX), t=BL.wallT/8, y0=FLOORY, y1=FLOORY+BL.wallH/4;
  for(const zm of [-1700,-500,800,2000,3200]){ const z=fz(zm); pbox(x-t-1.8,x+t+1.8,y0+26,y1-8,z-3,z+3,'#c3ccd5',{m:.4}); }
  const zy0=fy(1720), zy1=fy(1900), zz0=fz(420), zz1=fz(780);                   /* 충전실 쪽 구역 표지 : D구역 (청색) */
  pbox(x-t-2.8,x-t-1.8,zy0,zy1,zz0,zz1,'#2e73a8',{m:.1});
  pbox(x-t-3.2,x-t-2.8,zy0+10,zy1-10,zz0+10,zz1-10,'#f2f6fa',{m:.1});
}
/* 연결 컨베이어 : 구동부 · 시작 롤러 · 광전 센서 · 다리 앵커 */
function conveyorDetail(){
  const hw=RB.L.beltW/8, sc=(f,a,b,c)=>P3(f.c.x+f.u.x*a+f.v.x*b+f.w.x*c,f.c.y+f.u.y*a+f.v.y*b+f.w.y*c,f.c.z+f.u.z*a+f.v.z*b+f.w.z*c);
  { const f=frameAt(330), g=sc(f,0,-12,0);
    obox(g,f.u,f.v,f.w,11,10,12,'#4d5c6e',{m:.35});                               /* 감속기 */
    limb(sc(f,0,-12,-12),sc(f,0,-12,-38),10,10,'#516275',16,{m:.4});              /* 모터 */
    limb(sc(f,0,-12,-38),sc(f,0,-12,-41),8,8,'#2b3036',14,{m:.3});
    obox(sc(f,0,-1,0),f.u,f.v,f.w,5,1.5,hw,STEEL,{m:.7}); }
  { const f=frameAt(0); limb(sc(f,0,-3.2,-hw-1.5),sc(f,0,-3.2,hw+1.5),3.2,3.2,'#cfd5db',14,{m:.85}); }
  for(const s of [1350,RB.LEN-200]){ const f=frameAt(s), o=hw+4.5;
    obox(sc(f,0,4,o),f.u,f.v,f.w,3,5,3.5,'#2a2f35',{m:.3}); obox(sc(f,0,5,o-3.8),f.u,f.v,f.w,1.8,1.8,0.3,'#d9632a',{fl:0});
    obox(sc(f,0,4,-o),f.u,f.v,f.w,3,3.5,1.4,'#c94a3a',{}); }
  for(const s of [200,1100,2350,3000]){ const f=frameAt(s); if(Math.abs(f.mm.x-BL.wallX)<220||f.mm.x>1830) continue; anchor(f.c.x,f.c.z,hw+4); }
}
/* ═══ 정적 형상 캐시 : 한 번 만든 면(월드 좌표)을 매 프레임 그대로 다시 넣는다 (투영만 매번) ═══ */
let SC=null;
function staticGeom(){ wall(); wallDetail(); conveyor(); conveyorDetail(); fillerDetail(); cableTray(); packRoom(); }
const _packs=m3Packs;
m3Packs=function(){
  _packs.apply(this,arguments);
  const ek=expK, cz=cutZ; expK=0; cutZ=1e9;
  try{
    if(!SC||window.ROOM_GEOM_NOCACHE){ const n0=M3.faces.length; staticGeom(); SC=M3.faces.slice(n0); }
    else { const F=M3.faces; for(let i=0;i<SC.length;i++) F.push(SC[i]); }
    packsOnBelt(); packRoomDyn();
  }catch(e){ console.error(e); }
  expK=ek; cutZ=cz;
};
window.ROOM_GEOM_STATS=()=>SC?{faces:SC.length}:null;

/* ═══ 4. 후공정 대기 표시 (3D 화면 위) ═══ */
const badge=document.createElement('div');
badge.id='roomWait';
badge.style.cssText='position:absolute;left:50%;top:14px;transform:translateX(-50%);z-index:40;display:none;padding:10px 18px;border-radius:12px;background:#fff5ec;border:2px solid #e39a55;color:#a4520f;font:800 16px Malgun Gothic,sans-serif;box-shadow:0 6px 18px #a4520f22;pointer-events:none;white-space:nowrap';
badge.textContent='⏸ 후공정 대기 — 연결 컨베이어 만재 · 카토너가 받아 가면 자동 재가동';
const host=$('#mimic3dWrap'); if(host) host.appendChild(badge);
setInterval(()=>{ badge.style.display=(RB.st.link&&RB.st.wait&&S&&S.running)?'block':'none'; },250);
})();
