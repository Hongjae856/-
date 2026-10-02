/* ═══════════════════════════════════════════════════════════════════
   충전실 (D구역) — 단일 화면 통합 IDT : PTP 충전기 IDT 에 주입
   · 좌표 : 충전기 월드 단위(≈4 mm, 바닥 −282) ↔ 공용 mm (벽 중심 x=0 = 충전기 X 920, 라인 중심 z −230)
   · 3D : 통합 렌더러(uni_gfx.js)가 이 앱 형상 + 포장라인 형상 + 방 형상을 한 장면으로 그린다.
          이 화면이 보이지 않을 때는 포장라인 화면이 형상 생성만 요청한다(UNI_GEN).
   · 연동 : 양품 증가분을 버스로 보내고, 연결 컨베이어가 차면 '후공정 대기'로 사이클을 멈춘다.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
if(!RB) return;
const BL=RB.L, HUB=window.parent.UNI_HUB;
const XF0=920;
const fx=x=>XF0+x/4, fy=y=>FLOORY+y/4, fz=z=>(z-BL.fillerZ)/4;
/* 포장라인 월드 단위(≈5 mm) → 충전기 월드 단위 : 간략 모델을 포장라인 좌표 그대로 적기 위함 */
const LX=x=>fx((x+1600)*5), LY=y=>fy(y*5), LZ=z=>fz(z*5);

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

const wait=ms=>new Promise(r=>setTimeout(r,ms));
function setSpd(v){ SPD=v; $$('#spdGrp button').forEach(b=>b.classList.toggle('on',Number(b.dataset.s)===v)); }
/* 가동 준비 완료 상태 : 로그인 · 유틸리티 · 자재 · 설정을 모두 맞춘다 (START 는 하지 않음) */
function ready(){
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
}
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
    ready();
    const bad=startChecks().filter(c=>!c.ok);
    if(bad.length) return {ok:false,msg:bad.map(c=>c.nm).join(', ')};
    pressSTART(); await wait(80);
    if(!S.running) return {ok:false,msg:'START 실패'};
    setSpd(1); drawHMI();
    return {ok:true};
  }catch(e){ console.error(e); return {ok:false,msg:e.message}; }
}
function stop(){ try{ if(S&&S.running) pressSTOP(); }catch(e){} }
const ROOM_DEFAULT={yaw:-0.62,pitch:0.36,dist:2900,tx:560,ty:20,tz:60};
Object.assign(M3VIEW.all,ROOM_DEFAULT);
window.ROOM_DEMO_TEXT=()=>'연동 가동 중 — 충전기에서 나온 PTP 가 배출 컨베이어 → 벽 개구부 → 연결 컨베이어를 지나 포장실 카토너 스태커로 공급됩니다.'+(RB.st.wait?'  ⏸ 연결 컨베이어 만재 → 후공정 대기':'');
window.ROOM_API={
  running:()=>!!(S&&S.running), good:()=>S&&S.cnt?S.cnt.good:0,
  getSpd:()=>SPD, setSpd, demo, ready, stop
};

/* ═══ 2. 통합 렌더러 연결 ═══ */
const active=()=>HUB.active==='filler';
/* 시점 선택 기록 : '전체'가 아니면 장비 하나를 보는 중 → 포장실을 간략 모델로 */
M3._view='all';
const _sv=m3SetView;
m3SetView=function(k){ M3._view=k||'all'; return _sv.apply(this,arguments); };
HUB.view.filler=()=>M3._view;
/* 시야각 : 포장라인 엔진과 같은 세로 0.62 rad */
const fovFix=()=>{ M3.fov=(M3.H/2)/Math.tan(0.31); };
/* 공용 카메라(mm) 받기 · 내보내기 */
window.UNI_SETCAM=function(u){ Object.assign(M3.cam,u); Object.assign(M3.tgt,u); };
function publishCam(){ const c=M3.cam, d=c.dist*(1+0.62*(M3.expC||0));
  HUB.cam={yaw:c.yaw,pitch:c.pitch,dist:d*4,tx:4*c.tx-3680,ty:4*c.ty+1128,tz:4*c.tz+BL.fillerZ}; }
/* 형상만 만들기 (m3Draw 앞부분과 같은 순서) */
window.UNI_BUILD=function(){
  fovFix(); camPrep();
  M3.faces.length=0;
  cutZ = M3.cut===0 ? 1e9 : (M3.cut===1 ? 12 : -48);
  expK = M3.expC<0.003?0:M3.expC;
  m3Machine();
  const webStart=M3.faces.length; m3Web();
  for(let i=webStart;i<M3.faces.length;i++)M3.faces[i].source="web";
  m3Packs();
  expK=0;
  const savedCut=cutZ; cutZ=1e9; drawTrainingWorker(); cutZ=savedCut;
};
/* 화면이 보일 때만 그린다 · 투영 루프는 통합 렌더러가 GPU 로 대신한다 */
window.UNI_SKIP=true;
const _draw=m3Draw;
m3Draw=function(){ if(!active()) return; fovFix(); return _draw.apply(this,arguments); };
depthPaint=function(ctx,opq,trs,W,H){
  try{ publishCam(); UNI_PAINT(ctx,W,H,Math.round(W*M3.dpr),Math.round(H*M3.dpr)); M3.gpuError=null; }
  catch(e){ console.error(e); M3.gpuError=e.message; ctx.fillStyle='#a32216'; ctx.font='16px Malgun Gothic'; ctx.fillText('3D 표시 중단: '+e.message,20,H/2); }
};
/* 적응 해상도 */
const _d2=m3Draw;
m3Draw=function(){ if(active()&&gfxAdapt(performance.now())){ M3.q=GFX.q; M3._rs=1; } return _d2.apply(this,arguments); };
/* 2D 배경 : 하늘색 그라데이션만 (바닥 · 벽은 3D 형상) */
window.ROOM_BG=function(g){ const H=M3.H, bg=g.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#ffffff'); bg.addColorStop(.6,'#f4f6f7'); bg.addColorStop(1,'#e8ebed'); g.fillStyle=bg; g.fillRect(0,0,M3.W,H); };

/* ═══ 2-2. 통합 과정 연결 ═══ */
let everRun=false;
setInterval(()=>{ if(S&&S.running) everRun=true; },250);
const _ssU=startSim;
startSim=function(){ everRun=false; return _ssU.apply(this,arguments); };
/* 순서 관문 : 포장라인이 먼저 기동해야 충전기 START (셸이 판단) */
const _psU=pressSTART;
pressSTART=function(){ const g=HUB.flow&&HUB.flow.gateFillerStart&&HUB.flow.gateFillerStart(); if(g){ toast(g,'bad'); return; } return _psU.apply(this,arguments); };
window.UNI_HOLD_END();
window.UNI_COURSE={
  begin(course,mode){ try{ apStop(); }catch(e){} chooseCourse(course); openProdSel(mode); },
  quickStart(){ if($('#mSel').classList.contains('on')){ const pb=$('#psProd [data-pp="A"]')||$('#psProd [data-pp]'); if(pb) pb.click(); $('#psOk').click(); } },
  home(){ try{ returnHome(); }catch(e){ console.error(e); } $('#mSel')&&$('#mSel').classList.remove('on'); },
  testStart(){ $('#testStart').click(); },
  finish(){ if(S.session&&!S.session.ended) $('#testEnd').click(); },
  exclude(){ ready(); if(S.session){ S.session.active=false; S.session.ended=true; } drawHMI&&drawHMI(); },
  start(){ if(!S.running){ try{ alarmReset(); }catch(e){} pressSTART(); } },
  info(){ const L=STEPS(), i=S.tIdx||0;
    return {course:S.course, tIdx:i, n:L.length, startIdx:L.findIndex(s=>/^START/.test(s.t)), stopIdx:L.findIndex(s=>/^STOP/.test(s.t)),
      running:!!S.running, everRun, ended:!!(S.session&&S.session.ended), active:!!(S.session&&S.session.active), product:S.cfg.product}; }
};

/* ═══ 3. 이 앱이 추가로 그리는 형상 (충전기 단위) ═══ */
function pbox(x0,x1,y0,y1,z0,z1,hex,o){
  if(x1<x0)[x0,x1]=[x1,x0]; if(y1<y0)[y0,y1]=[y1,y0]; if(z1<z0)[z0,z1]=[z1,z0];
  o=Object.assign({cl:1},o||{});
  const a=P3(x0,y0,z0),b=P3(x1,y0,z0),c=P3(x1,y1,z0),d=P3(x0,y1,z0),e=P3(x0,y0,z1),f=P3(x1,y0,z1),gg=P3(x1,y1,z1),h=P3(x0,y1,z1);
  FA([h,gg,c,d],o.top||hex,o); FA([a,b,f,e],hex,o); FA([e,f,gg,h],hex,o); FA([b,a,d,c],hex,o); FA([f,b,c,gg],hex,o); FA([a,e,h,d],hex,o);
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
  gb(-1124,-1040,190,194,-72,-20,INOX,{m:.6});
  for(const dx of [-16,14]) for(const dz of [-60,-34]) pbox(LX(-1082+dx),LX(-1080+dx),LY(194),LY(258),LZ(dz),LZ(dz+2),'#aab3bc',{m:.8});
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
    for(let i=0;i<n;i++) pbox(LX(-1095),LX(-1069),LY(194+i*5.8),LY(198.4+i*5.8),LZ(-57),LZ(-35),'#f2f0f6',{top:'#d8d9dd'}); }
}
const BOLTC='#8c949c', PLATE='#d2d6da';
const bolt=(x,y,z,ax)=>{ if(ax==='z') pbox(x-1.5,x+1.5,y-1.5,y+1.5,z,z+1.2,BOLTC,{m:.8}); else pbox(x-1.5,x+1.5,y,y+1.2,z-1.5,z+1.5,BOLTC,{m:.8}); };
function anchor(x,z,h){ pbox(x-h,x+h,FLOORY,FLOORY+1.4,z-h,z+h,PLATE,{m:.75}); for(const dx of [-1,1]) for(const dz of [-1,1]) bolt(x+dx*(h-3.5),FLOORY+1.4,z+dz*(h-3.5)); }
/* 충전기 다리 앵커 플레이트 */
function fillerDetail(){ for(const x of [150,420,690,960,1160]) for(const z of [-90,90]) anchor(X3(x),z,15); }
let SC=null;
const _packs=m3Packs;
m3Packs=function(){
  _packs.apply(this,arguments);
  const ek=expK, cz=cutZ; expK=0; cutZ=1e9;
  try{
    if(!SC){ const n0=M3.faces.length; fillerDetail(); SC=M3.faces.slice(n0); }
    else { const F=M3.faces; for(let i=0;i<SC.length;i++) F.push(SC[i]); }
    /* 장비 하나를 보는 중(이 화면 활성) : 포장실은 간략 모델 · 옅은 톤 — 매 프레임 다시 만들므로 즉시 전환 */
    if(active()&&HUB.simple()){ packRoom(); packRoomDyn(); }
  }catch(e){ console.error(e); }
  expK=ek; cutZ=cz;
};
/* ═══ 4. 후공정 대기 표시 (3D 화면 위) ═══ */
const badge=document.createElement('div');
badge.id='roomWait';
badge.style.cssText='position:absolute;left:50%;top:56px;transform:translateX(-50%);z-index:40;display:none;padding:10px 18px;border-radius:12px;background:#fff5ec;border:2px solid #e39a55;color:#a4520f;font:800 16px Malgun Gothic,sans-serif;box-shadow:0 6px 18px #a4520f22;pointer-events:none;white-space:nowrap';
badge.textContent='⏸ 후공정 대기 — 연결 컨베이어 만재 · 카토너가 받아 가면 자동 재가동';
const host=$('#mimic3dWrap'); if(host) host.appendChild(badge);
setInterval(()=>{ badge.style.display=(RB.st.link&&RB.st.wait&&S&&S.running)?'block':'none'; },250);
})();
