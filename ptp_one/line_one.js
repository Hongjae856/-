/* ═══════════════════════════════════════════════════════════════════
   포장실 (G구역) — 단일 화면 통합 IDT : PTP 포장라인 IDT 에 주입
   · 좌표 : 포장라인 월드 단위(≈5 mm) ↔ 공용 mm (벽 중심 x=0 → 포장라인 X −1600, 바닥 y=0)
   · 3D : 통합 렌더러(uni_gfx.js)가 이 앱 형상 + 충전기 형상 + 방 형상을 한 장면으로 그린다.
   · 연동 : 카토너 1사이클마다 스태커에서 N팩을 버킷 1칸에 떨어뜨린다.
            팩이 모자라면 빈 버킷 → 그 버킷은 카톤 · 설명지를 받지 않고 배출 시 카톤이 나오지 않는다.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
if(!RB) return;
const BL=RB.L, HUB=window.parent.UNI_HUB;
const XL0=-1600;
const lx=x=>XL0+x/5, ly=y=>y/5, lz=z=>z/5;
/* 충전기 월드 단위(≈4 mm, 바닥 −282, 벽 X 920, 라인 중심 z −230) → 포장라인 단위 : 간략 모델용 */
const FX=x=>lx((x-920)*4), FY=y=>ly((y+282)*4), FZ=z=>lz(z*4+BL.fillerZ);

/* ═══ 1. 카톤당 팩 수 (레시피) ═══ */
const PACK_CHOICES=[1,2,3,4,10];
const PACK_DEFAULT={A:2,B:3};
function ensureRecipes(){
  if(!S) return;
  for(const r of S.recipes||[]) if(r.packs==null) r.packs=PACK_DEFAULT[r.prod]||2;
  if(!S._roomPq){ S._roomPq=1; S.ct.cnt.prodQty=PACK_DEFAULT[S.cfg.product]||PACK_DEFAULT.A; }
}
const packsN=()=>Math.max(1,Math.round((S&&S.ct&&S.ct.cnt.prodQty)||2));
const _recipe=recipeScr;
recipeScr=function(){
  ensureRecipes();
  const R=S.recipes||[];
  let h=_recipe.apply(this,arguments);
  /* 표에 '카톤당 팩' 열 추가 */
  h=h.replace('<th>기준중량</th></tr>','<th>기준중량</th><th>카톤당 팩</th></tr>');
  R.forEach((r,i)=>{ const key='data-hb="rc_sel'+i+'">';
    const at=h.indexOf(key); if(at<0) return;
    const end=h.indexOf('</tr>',at);
    h=h.slice(0,end)+'<td><b>'+r.packs+'</b> 팩</td>'+h.slice(end); });
  h=h.replace('colspan="5"','colspan="6"');
  const sel=R[S.rcSel];
  h+='<div style="margin-top:10px;padding:10px 12px;border:1px solid #c9d4e0;border-radius:10px;background:#f6f9fc">'+
     '<div style="font-size:14px;color:#33465c;margin-bottom:7px">카톤당 PTP 팩 수 (스태커 적재 수량) — 선택한 레시피 : <b>'+(sel?esc(sel.nm):'-')+'</b> · 현재 적용 <b>'+packsN()+' 팩</b></div>'+
     '<div style="display:flex;gap:6px;flex-wrap:wrap">'+PACK_CHOICES.map(n=>
       '<button type="button" class="gbtn" data-room-pq="'+n+'" style="min-width:64px'+(sel&&sel.packs===n?';background:#142b47;color:#fff':'')+'">'+n+' 팩</button>').join('')+
     '</div><div style="font-size:12.5px;color:#5d7086;margin-top:6px">[열기]로 레시피를 적용하면 카토너 버킷 1칸에 이 수량만큼 쌓여 들어갑니다.</div></div>';
  return h;
};
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-room-pq]'); if(!b) return;
  ensureRecipes(); const r=S.recipes[S.rcSel]; if(!r){ toast('레시피 행을 먼저 선택하세요.','bad'); return; }
  r.packs=+b.dataset.roomPq; toast('[ '+r.nm+' ] 카톤당 '+r.packs+' 팩 — [열기]로 적용합니다.'); drawHMI();
},true);
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-hb="rc_open"]'); if(!b) return;
  setTimeout(()=>{ ensureRecipes(); const r=S.recipes[S.rcSel]; if(r&&acl("recipe")){ S.ct.cnt.prodQty=r.packs; drawHMI(); } },0);
},true);

/* ═══ 2. 버킷 적재 상태 (연동) ═══
   버킷 번호 = 누적 사이클 rc + 슬롯 k (사이클마다 모든 버킷이 한 칸씩 하류로 → k 가 1 줄어든다)
   사이클 시작 시 스태커 아래(k=11) 버킷에 N팩을 떨어뜨리고, k=−4 버킷이 배출되며 카톤이 나간다. */
let rc=0;
const fill=new Map(), K_STACK=11, K_OUT=-4;
function resetBuckets(){ fill.clear(); }
const _occ=onCartonerCycle;
onCartonerCycle=function(){
  if(!RB.st.link){ rc++; return _occ.apply(this,arguments); }
  rc++;
  const N=packsN(), got=RB.take(N);
  fill.set(rc+K_STACK,got?N:0);
  const outN=fill.get(rc+K_OUT)||0;
  for(const k of fill.keys()) if(k<rc+K_OUT-2) fill.delete(k);
  if(outN>0) return _occ.apply(this,arguments);
  cycCount++;                                   /* 빈 버킷 : 카톤 · 설명지 미공급, 배출 카톤 없음 */
};
window.ROOM_N=k=>RB.st.link?(fill.get(rc+k)||0):packsN();
window.ROOM_TOWER=()=>RB.st.link?RB.st.tower:null;
window.ROOM_LINK=()=>RB.st.link;
window.ROOM_CPM=()=>RB.st.link?RB.st.cpm:0;

/* ═══ 3. 연동 브리지 ═══ */
/* 연결 컨베이어는 카토너와 같은 시계(포장라인 시뮬 시간)로 진행 → 공급·소비가 어긋나지 않는다 */
const _tickRoom=tick;
tick=function(dt){ const r=_tickRoom.apply(this,arguments); if(dt>0){ RB.step(dt); RB.lastStep=performance.now(); } return r; };
const _start=startSim;
startSim=function(){ const r=_start.apply(this,arguments); S._roomPq=0; ensureRecipes(); try{ RB.onCourse&&RB.onCourse('line'); }catch(e){} return r; };
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function setSpd(v){ SPD=v; $$('#spdGrp [data-s]').forEach(b=>b.classList.toggle('on',Number(b.dataset.s)===v)); }
function readyLine(){
  if(typeof ACCOUNTS!=='undefined'&&typeof doLogin==='function'&&!S.user){ try{ lgId=ACCOUNTS[0].id; pwBuf=ACCOUNTS[0].pw; doLogin(); }catch(e){} }
  S.main=true; S.air=true; S.airP=6.2; S.vac=true; S.door='closed'; S.emg=false;
  for(const k in S.cp3) S.cp3[k]=true;
  for(const k of ['carton','leaflet','cases','tape','ink','label']) if(k in S.mat) S.mat[k]=100;
  S.mat.pallet=true; S.cw.calDone=true; S.cw.zeroDone=true; S.pt.taught=true; S.pt.palletIn=true; S.pt.palletFixed=true;
  S.trouble=false; S.cnt.target=10000000; S.cnt.remain=S.cnt.target-S.cnt.good;
  try{ alarmReset(); }catch(e){}
}
async function demo(){
  try{
    try{ apStop&&apStop(); }catch(e){}
    if($('#chooseOperation')) $('#chooseOperation').click();
    $('#spEasy').click(); await wait(500);
    if(!$('#splash').classList.contains('hide')) return {ok:false,msg:'과정 시작 실패'};
    ensureRecipes();
    readyLine();
    const bad=startChecks().filter(c=>!c.ok);
    if(bad.length) return {ok:false,msg:bad.map(c=>c.nm).join(', ')};
    pressSTART(); await wait(80);
    if(!S.running) return {ok:false,msg:'START 실패'};
    setSpd(1);
    return {ok:true};
  }catch(e){ console.error(e); return {ok:false,msg:e.message}; }
}
function stop(){ try{ if(S&&S.running) pressSTOP(); }catch(e){} }
/* 연동 중 : 자재 보충 · 만재 팔레트 교체 후 재기동 (시연이 끊기지 않도록 · 사용자가 누른 STOP 은 그대로 둔다) */
let palletRestart=false;
setInterval(()=>{
  if(!RB.st.link||!S) return;
  for(const k of ['carton','leaflet','cases','tape','ink','label']) if(k in S.mat&&S.mat[k]<25) S.mat[k]=100;
  try{
    if(S.palletReadyForRemoval&&!palletTransfer&&!workerJob){ removeLoadedPallet(); palletRestart=true; }
    else if(palletRestart&&!S.running&&!S.palletReadyForRemoval&&!palletTransfer&&!workerJob){
      if(!S.mat.pallet||!S.pt.palletIn||!S.pt.palletFixed){ S.mat.pallet=true; S.pt.palletIn=true; S.pt.palletFixed=true; }
      if(tripAlarms().length) alarmReset();
      if(!startChecks().some(c=>!c.ok)){ pressSTART(); palletRestart=false; }
    }
  }catch(e){}
},700);
const ROOM_DEFAULT={yaw:-0.64,pitch:0.30,dist:3550,tx:-640,ty:170,tz:40};
Object.assign(M3VIEW.all,ROOM_DEFAULT);
window.ROOM_DEMO_TEXT=()=>'연동 가동 중 — 충전실에서 온 PTP 가 스태커 매거진에 수직으로 쌓이고, 카톤당 '+packsN()+'팩씩 버킷 1칸에 떨어집니다. 팩이 모자란 버킷은 카톤·설명지를 받지 않습니다.';
window.ROOM_API={
  running:()=>!!(S&&S.running), cartons:()=>S&&S.cnt?S.cnt.good:0, cpm:()=>S?S.cpm:0, packs:packsN,
  getSpd:()=>SPD, setSpd, demo, ready:readyLine, stop, resetBuckets
};

/* ═══ 4. 통합 렌더러 연결 ═══ */
const active=()=>HUB.active==='line';
HUB.view.line=()=>/^m[1-5]$/.test(m3.view||'')?m3.view:'all';         /* 카토너~팔렛타이저 단일 장비 시점만 (평면 · 정면은 전체) */
window.UNI_SETCAM=function(u){ Object.assign(m3,u,{yawT:u.yaw,pitchT:u.pitch,distT:u.dist,txT:u.tx,tyT:u.ty,tzT:u.tz}); };
function publishCam(){ HUB.cam={yaw:m3.yaw,pitch:m3.pitch,dist:m3.dist*5,tx:5*m3.tx+8000,ty:5*m3.ty,tz:5*m3.tz}; }
window.UNI_BUILD=function(){ camPrep(m3cv?m3cv.width:16,m3cv?m3cv.height:9); m3Machine(); };
const _draw=m3Draw;
m3Draw=function(){ if(!active()) return; gfxAdapt(performance.now()); return _draw.apply(this,arguments); };
depthPaint=function(w,h){ try{ publishCam(); UNI_PAINT(ctx2,w,h,w,h); }catch(e){ console.error(e); } };
/* 2D 배경 : 그라데이션만 (바닥 · 벽은 3D 형상) */
window.ROOM_BG=function(W,H){ const g=ctx2, bg=g.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#ffffff'); bg.addColorStop(.6,'#f4f6f7'); bg.addColorStop(1,'#e8ebed'); g.fillStyle=bg; g.fillRect(0,0,W,H); };
/* 포장라인 엔진은 페이지 로딩 중에 3D 를 먼저 초기화한다 — 이 엔진의 GL 컨텍스트는 쓰지 않는다 */

/* ═══ 4-2. 통합 과정 연결 ═══ */
window.UNI_HOLD_END();
window.UNI_COURSE={
  begin(course,mode,prod){ try{ apStop(); }catch(e){} chooseCourse(course); startSim(mode);
    const p=PRODS.find(x=>x.k===prod); if(p){ try{ applyProduct(p); }catch(e){ console.error(e); } }
    S._roomPq=0; ensureRecipes(); try{ drawHMI(); render(); }catch(e){} },
  home(){ try{ returnHome(); }catch(e){ console.error(e); } },
  testStart(){ $('#testStart').click(); },
  finish(){ if(S.session&&!S.session.ended) $('#testEnd').click(); },
  exclude(){ readyLine(); if(S.session){ S.session.active=false; S.session.ended=true; } try{ drawHMI(); }catch(e){} },
  start(){ if(!S.running){ try{ alarmReset(); }catch(e){} pressSTART(); } },
  info(){ const L=STEPS(), i=S.tIdx||0;
    return {tIdx:i, n:L.length, started:!!S.started, running:!!S.running, ended:!!(S.session&&S.session.ended), active:!!(S.session&&S.session.active)}; }
};

/* ═══ 5. 스태커 (통합) : 충전기 배출 높이(1290 mm = 카톤 라인 +82)로 들어오는 팩을 받는 개방형 매거진
   · 하부 하우징을 프레임만 남겨 탑처럼 쌓인 팩이 보이게 하고, 가이드 로드는 컨베이어 높이까지 ═══ */
window.ROOM_STACKER=function(sx,y,LP){
  for(const dx of [-40,36]) for(const dz of [-24,20]) bx(sx+dx,sx+dx+4,y+14,y+58,LP+dz,LP+dz+4,COL.inox,COL.inoxD);   /* 모서리 기둥 */
  for(const dz of [-24,20]) bx(sx-40,sx+40,y+14,y+18,LP+dz,LP+dz+4,COL.steel,COL.alu);                              /* 하부 레일 */
  for(const dz of [-24,20]) bx(sx-40,sx+40,y+54,y+58,LP+dz,LP+dz+4,COL.steel,COL.alu);                              /* 상부 레일 */
  for(const dx of [-40,36]) bx(sx+dx,sx+dx+4,y+54,y+58,LP-24,LP+24,COL.steel,COL.alu);
  for(const dx of [-16,16]) for(const dz of [-14,14]) cylY(sx+dx,LP+dz,y+18,y+84,1.6,COL.steel,8);             /* 가이드 로드 */
  bx(sx-20,sx+20,y+82,y+85,LP-18,LP-14,COL.steel,COL.alu); bx(sx-20,sx+20,y+82,y+85,LP+14,LP+18,COL.steel,COL.alu);
  bx(sx+30,sx+38,y+56,y+96,LP+22,LP+30,COL.inoxD,COL.inox);     /* 센서 브래킷 기둥 */
};

/* ── 충전실 간략 모델 (옅은 안개 톤) : 충전기 좌표(미믹 x · 충전기 월드 y · z) 그대로 적고 변환 ── */
const HZ=c=>roomHazeArr(c);
function fb(x0,x1,y0,y1,z0,z1,col){ const c=HZ(col); bx(FX(x0-620),FX(x1-620),FY(y0),FY(y1),FZ(z0),FZ(z1),c,c); }
let fT=0;
function fillRoom(){
  const W=[0.95,0.95,0.94], WD=[0.80,0.81,0.80], STL=[0.76,0.77,0.78], FRM=[0.76,0.77,0.77], DRK=[0.30,0.32,0.35], GL=[0.77,0.88,0.93];
  /* 베이스 프레임 · 다리 · 스커트 */
  for(const x of [150,420,690,960,1160]) for(const z of [-90,90]) fb(x-13,x+13,-266,-220,z-13,z+13,[0.59,0.61,0.63]);
  fb(140,1174,-234,-220,-102,-78,[0.59,0.61,0.63]); fb(140,1174,-234,-220,78,102,[0.59,0.61,0.63]);
  fb(120,1180,-222,-196,104,124,STL);
  /* 후면 캐비닛 (낮은 쪽 · 높은 쪽) + 상단 캡 */
  fb(120,500,-220,84,-158,-94,W); fb(500,1180,-220,292,-158,-94,W);
  fb(114,500,84,90,-164,-88,STL); fb(494,1186,292,300,-164,-88,STL);
  for(const x of [220,360,640,780,920,1060]) fb(x-1.5,x+1.5,-196,x<500?80:286,-94,-92,WD);
  /* 웹 라인 · 스테이션 (성형 · 충전 · 접착 · 펀칭) */
  fb(150,1120,40,45,-76,76,[0.86,0.92,0.95]);
  fb(380,480,46,118,-80,80,STL); fb(380,480,-44,38,-80,80,[0.72,0.45,0.38]);
  fb(600,700,46,128,-80,80,STL); fb(600,700,-50,38,-80,80,[0.72,0.45,0.38]);
  fb(950,1060,46,138,-80,80,STL); fb(950,1060,-44,38,-80,80,DRK);
  fb(150,1176,-196,-188,-94,124,WD);
  /* 호퍼 · 공급 장치 */
  fb(212,278,160,236,-42,42,[0.82,0.86,0.90]); fb(232,258,60,160,-18,18,STL);
  /* 성형필름 릴 (왼쪽 아래) · 커버포일 릴 (위) */
  { const r=(cx,cy,rad,z0,z1,col)=>{ const c=HZ(col); cylZ(FX(cx-620),FY(cy),FZ(z0),FZ(z1),rad*0.8,c,18); };
    r(170,-90,62,-70,70,[0.84,0.91,0.94]); r(170,-90,15,-78,78,DRK);
    r(790,232,50,-66,66,[0.85,0.86,0.87]); r(790,232,13,-72,72,DRK); }
  /* 가드 외곽 : 2단 구조 (왼쪽 아래 · 왼쪽 위 · 오른쪽 높은 칸) — 프레임 + 반투명 패널 */
  const BAYS=[[118,500,-216,80],[118,500,96,298],[500,1182,-216,286]], GZ=124;
  for(const [x0,x1,y0,y1] of BAYS){
    for(const x of [x0,x1]) for(const z of [-GZ,GZ]) fb(x-4,x+4,y0,y1,z-4,z+4,FRM);
    for(const y of [y0,y1]) for(const z of [-GZ,GZ]) fb(x0,x1,y-4,y+4,z-4,z+4,FRM);
    for(const x of [x0,x1]) fb(x-4,x+4,y1-4,y1+4,-GZ,GZ,FRM);
  }
  const ga=gAlpha; gAlpha=0.16;
  for(const [x0,x1,y0,y1] of BAYS){ fb(x0,x1,y0,y1,GZ-1,GZ+1,GL); fb(x0,x1,y1-1,y1+1,-GZ,GZ,GL); }
  fb(117,119,-216,298,-GZ,GZ,GL);
  gAlpha=ga;
  /* 걸이형 HMI · 타워 램프 */
  fb(392,408,298,330,96,112,FRM); fb(392,408,180,298,128,140,FRM); fb(345,455,110,182,132,142,[0.20,0.24,0.28]); fb(352,448,118,174,142,143,[0.32,0.55,0.62]);
  fb(1150,1160,300,340,-130,-120,STL);
  /* 흡착 배출 휠 */
  { const c=HZ([0.85,0.88,0.90]); cylZ(FX(1144-620),FY(380-271),FZ(-40),FZ(40),52*0.8,c,16); }
}
function fillRoomDyn(){
  const run=RB.st.fillerRun; fT+=run?RDT*SPD:0;
  fb(1146,1164,340,356,-134,-116,run?[0.24,0.70,0.44]:[0.79,0.81,0.84]);
}
const STEEL=[0.72,0.74,0.76], BOLT=[0.55,0.57,0.60], PLATE=[0.82,0.84,0.86], INK=[0.22,0.25,0.29], TRAYC=[0.74,0.76,0.78], STRUT=[0.62,0.65,0.68];
const bolt=(x,y,z,ax)=>{ if(ax==='z') bx(x-1.1,x+1.1,y-1.1,y+1.1,z,z+0.9,BOLT,BOLT); else bx(x-1.1,x+1.1,y,y+0.9,z-1.1,z+1.1,BOLT,BOLT); };
/* 바닥 앵커 플레이트 + 볼트 4개 */
function anchor(x,z,h){ h=h||8; bx(x-h,x+h,0,1.1,z-h,z+h,PLATE,PLATE); for(const dx of [-1,1]) for(const dz of [-1,1]) bolt(x+dx*(h-2.6),1.1,z+dz*(h-2.6)); }
/* 카토너 : 레벨링 풋 앵커 · 상부 모서리 보강판 · 명판 */
function cartonerDetail(){
  const a=X3(60), b=X3(900), y=YC;
  for(let i=0;i<6;i++){ const px=a+26+i*(b-a-52)/5; anchor(px,ZF-40,9); anchor(px,ZB+22,9); }
  for(const [x0,x1] of [[a,a+18],[b-18,b]]){                       /* 전면 위 모서리 L 보강판 */
    bx(x0,x1,y+156,y+160,ZF-16.6,ZF-15.8,STEEL,STEEL); bx(x0<a+1?a:b-4,x0<a+1?a+4:b,y+138,y+160,ZF-16.6,ZF-15.8,STEEL,STEEL);
    for(const yy of [y+158,y+148]) bolt(x0<a+1?a+2:b-2,yy,ZF-15.8,'z');
    bolt((x0+x1)/2+(x0<a+1?4:-4),y+158,ZF-15.8,'z'); }
  const nx=a+14, ny=118, nz=ZF-19.4;                                  /* 명판 (1번 도어 좌상단) */
  bx(nx,nx+50,ny,ny+18,nz,nz+0.7,PLATE,PLATE);
  bx(nx+3,nx+9,ny+6,ny+12,nz+0.7,nz+1.0,[0.78,0.20,0.16],[0.78,0.20,0.16]);
  for(let r=0;r<3;r++) bx(nx+12,nx+46-r*8,ny+13-r*4.2,ny+14.6-r*4.2,nz+0.7,nz+0.95,INK,INK);
  for(const xx of [nx+2,nx+48]) for(const yy of [ny+2,ny+16]) bolt(xx,yy,nz+0.7,'z');
}
/* ═══ 6. 정적 형상 캐시 (카토너 세부) + 장비 하나를 보는 중이면 충전실 간략 모델 ═══ */
let SC=null, SCkey='';
const _mach=m3Machine;
m3Machine=function(){
  _mach.apply(this,arguments);
  const ga=gAlpha; gAlpha=1;
  try{
    const key=(m3.exp?1:0)+(m3.cut?2:0)+'';
    if(!SC||SCkey!==key){
      const L0=[GP.length,GN.length,GC.length];
      if(!m3.exp&&!m3.cut) cartonerDetail();
      SC=[GP.slice(L0[0]),GN.slice(L0[1]),GC.slice(L0[2])]; SCkey=key;
    } else {
      const add=(D,A)=>{ for(let i=0,n=A.length;i<n;i++) D.push(A[i]); };
      add(GP,SC[0]); add(GN,SC[1]); add(GC,SC[2]);
    }
    if(active()&&HUB.simple()){ fillRoom(); fillRoomDyn(); }
  }catch(e){ console.error(e); }
  gAlpha=ga;
};
})();
