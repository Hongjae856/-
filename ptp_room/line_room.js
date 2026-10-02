/* ═══════════════════════════════════════════════════════════════════
   포장실 (G구역) 방 모드 — PTP 포장라인 IDT 에 주입
   · 좌표 : 포장라인 월드 단위(≈5 mm) ↔ 공용 mm (벽 중심 x=0 → 포장라인 X −1600, 바닥 y=0)
   · 그리는 것 : 방 배경 · 칸막이 벽 · 연결 컨베이어와 팩 · 충전기 배출 컨베이어(선명)
                 · 스태커 매거진(팩이 수직으로 쌓임) · 충전실 설비 간략 모델(옅은 안개 톤)
   · 연동 : 카토너 1사이클마다 스태커에서 N팩을 버킷 1칸에 떨어뜨린다.
            팩이 모자라면 빈 버킷 → 그 버킷은 카톤 · 설명지를 받지 않고 배출 시 카톤이 나오지 않는다.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
if(!RB) return;
const BL=RB.L;
const XL0=-1600;
const lx=x=>XL0+x/5, ly=y=>y/5, lz=z=>z/5;
/* 충전기 월드 단위(≈4 mm, 바닥 −282, 벽 X 920) → 포장라인 단위 : 충전기 간략 모델을 충전기 좌표 그대로 적기 위함 */
const FX=x=>lx((x-920)*4), FY=y=>ly((y+282)*4), FZ=z=>lz(z*4);

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
const _draw=m3Draw;
m3Draw=function(){ if(window.ROOM_ACTIVE===false) return; return _draw.apply(this,arguments); };
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
    setSpd(1); Object.assign(m3,TGT(ROOM_DEFAULT));
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
/* 방 시점 */
const ROOM_DEFAULT={yaw:-0.64,pitch:0.30,dist:3550,tx:-640,ty:170,tz:40};
Object.assign(M3VIEW.all,ROOM_DEFAULT);          /* '전체 라인' 시점 = 방 시점 */
window.ROOM_DEMO_TEXT=()=>'연동 가동(시연) 중 — 충전실에서 온 PTP 가 스태커 매거진에 수직으로 쌓이고, 카톤당 '+packsN()+'팩씩 버킷 1칸에 떨어집니다. 팩이 모자란 버킷은 카톤·설명지를 받지 않습니다.';
const TGT=v=>({yawT:v.yaw,pitchT:v.pitch,distT:v.dist,txT:v.tx,tyT:v.ty,tzT:v.tz});
/* 방에 들어올 때 : 벽 바로 안쪽에서 카토너를 보며 시작해 1.3 초 동안 기본 시점으로 이동 */
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
let glideId=0;
function glide(from,to,dur){
  /* 프레임이 끊겨도(무거운 첫 프레임 등) 이동이 한 번에 끝나지 않도록 프레임당 진행량은 1/30 초까지 */
  const id=++glideId, K=['yaw','pitch','dist','tx','ty','tz']; let u=0, last=performance.now();
  const f=()=>{ if(id!==glideId) return; const now=performance.now(); u=Math.min(1,u+Math.min(now-last,33)/dur); last=now;
    const e=ease(u), v={}; for(const k of K) v[k]=from[k]+(to[k]-from[k])*e;
    Object.assign(m3,v,TGT(v)); if(u<1) requestAnimationFrame(f); };
  f();
}
function enter(from){
  glideId++;                                     /* 진행 중인 이동 취소 */
  if(from==='filler') glide({yaw:-0.95,pitch:0.22,dist:620,tx:-1120,ty:230,tz:30},ROOM_DEFAULT,1300);
  else if(m3.ready) Object.assign(m3,TGT(ROOM_DEFAULT));
}
window.ROOM_API={
  running:()=>!!(S&&S.running), cartons:()=>S&&S.cnt?S.cnt.good:0, cpm:()=>S?S.cpm:0, packs:packsN,
  getSpd:()=>SPD, setSpd, demo, stop, enter, resetBuckets
};
const _m3sv=m3SetView;
m3SetView=function(v){ const r=_m3sv.apply(this,arguments); if(v==='all') Object.assign(m3,TGT(ROOM_DEFAULT)); return r; };

/* ═══ 4. 방 배경 (2D) ═══ */
window.ROOM_BG=function(W,H){
  const g=ctx2;
  const bg=g.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,"#ffffff"); bg.addColorStop(.52,"#f5f6f4"); bg.addColorStop(1,"#e6e8e5");
  g.fillStyle=bg; g.fillRect(0,0,W,H);
  const poly=(pts,fill)=>{ const P=pts.map(q=>prj(q[0],q[1],q[2],W,H)); if(P.some(q=>!q)) return null;
    g.beginPath(); g.moveTo(P[0].x,P[0].y); for(let i=1;i<P.length;i++) g.lineTo(P[i].x,P[i].y); g.closePath();
    if(fill){ g.fillStyle=fill; g.fill(); } return P; };
  const x0=lx(BL.dMinX), x1=lx(BL.gMaxX)+600, xw=lx(BL.wallX), WZ=lz(BL.backZ), FZ=lz(BL.frontZ), TY=ly(BL.wallH);
  const P=poly([[x0,0,WZ],[x1,0,WZ],[x1,TY,WZ],[x0,TY,WZ]]);
  if(P){ const y0=Math.min(P[2].y,P[3].y), y1=Math.max(P[0].y,P[1].y), wg=g.createLinearGradient(0,y0,0,y1);
    ROOM_COL.wall.forEach((c,i)=>wg.addColorStop([0,.58,1][i],c)); g.fillStyle=wg; g.fill();
    g.strokeStyle=ROOM_COL.seam; g.lineWidth=1;
    for(let x=x0+120;x<x1;x+=120){ const a=prj(x,0,WZ,W,H), b=prj(x,TY,WZ,W,H); if(a&&b){ g.beginPath(); g.moveTo(a.x,a.y); g.lineTo(b.x,b.y); g.stroke(); } } }
  poly([[x0,0,WZ],[x1,0,WZ],[x1,7,WZ+7],[x0,7,WZ+7]],ROOM_COL.cove);
  const floor=(xa,xb,cols)=>{ const Q=poly([[xa,0,WZ],[xb,0,WZ],[xb,0,FZ],[xa,0,FZ]]); if(!Q) return;
    const y0=Math.min(Q[0].y,Q[1].y), y1=Math.max(Q[2].y,Q[3].y), fg=g.createLinearGradient(0,y0,0,y1);
    cols.forEach((c,i)=>fg.addColorStop([0,.34,1][i],c)); g.fillStyle=fg; g.fill(); };
  floor(x0,xw,ROOM_COL.dFloor); floor(xw,x1,ROOM_COL.gFloor);
  poly([[x0,0,FZ],[x1,0,FZ],[x1,-11,FZ],[x0,-11,FZ]],'#cfd6dd');
  /* 기계 접지 그림자 (원래 배경과 동일) */
  { const a=prj(X3(60),1,-320,W,H), b=prj(X3(2540),1,320,W,H);
    if(a&&b){ const mx=(a.x+b.x)/2, my=(a.y+b.y)/2, rr=Math.max(Math.abs(b.x-a.x),Math.abs(b.y-a.y))*0.6;
      const sh=g.createRadialGradient(mx,my,rr*0.12,mx,my,rr);
      sh.addColorStop(0,"rgba(96,116,138,.26)"); sh.addColorStop(.62,"rgba(96,116,138,.10)"); sh.addColorStop(1,"rgba(96,116,138,0)");
      g.fillStyle=sh; g.fillRect(0,0,W,H); } }
  const K=W/Math.max(1,$('#mimic3dWrap').clientWidth);
  g.save(); g.scale(K,K);
  const pz=(x,z)=>{ const q=prj(x,0,z,W,H); return q?{x:q.x/K,y:q.y/K}:null; };
  roomZoneBadge(g,pz(lx(-5600),lz(3300)),'충전실 · D구역','PTP 충전 (HM 400P)','#2f7fb8');
  roomZoneBadge(g,pz(lx(1300),lz(3300)),'포장실 · G구역','카토너 → 박스포장 → 팔렛타이저','#8a6d2f');
  g.restore();
};

/* ═══ 5. 3D ═══ */
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];};
function frameAt(s){
  const p=RB.at(s), c=[lx(p.x),ly(p.y),lz(p.z)];
  const u=unit([p.tx,p.ty,p.tz]), w=unit(cross(u,[0,1,0])), v=cross(w,u);
  return {c,u,v,w,mm:p};
}
/* 임의 방향 상자 */
function obox(c,u,v,w,hu,hv,hw,col,top){
  const P=(a,b,d)=>[c[0]+u[0]*hu*a+v[0]*hv*b+w[0]*hw*d, c[1]+u[1]*hu*a+v[1]*hv*b+w[1]*hw*d, c[2]+u[2]*hu*a+v[2]*hv*b+w[2]*hw*d];
  const A=P(-1,-1,-1),B=P(1,-1,-1),C=P(1,1,-1),D=P(-1,1,-1),E=P(-1,-1,1),F=P(1,-1,1),G=P(1,1,1),H=P(-1,1,1);
  FA(H,G,C,D,top||col); FA(A,B,F,E,col); FA(E,F,G,H,col); FA(B,A,D,C,col); FA(F,B,C,G,col); FA(A,E,H,D,col);
}
/* 칸막이 벽 */
const PANE=[0.93,0.95,0.965], TRIM=[0.77,0.80,0.84], SKIRT=[0.83,0.85,0.87], SLEEVE=[0.80,0.82,0.85];
function wall(){
  const x=lx(BL.wallX), t=BL.wallT/10, z0=lz(BL.backZ), z1=lz(BL.frontZ), y1=ly(BL.wallH);
  const H=BL.hole, hz0=lz(H.z0), hz1=lz(H.z1), hy0=ly(H.y0), hy1=ly(H.y1);
  const ga=gAlpha; gAlpha=0.22;
  bx(x-t,x+t,20,y1-6,z0,hz0,PANE,PANE); bx(x-t,x+t,20,y1-6,hz1,z1-8,PANE,PANE);
  bx(x-t,x+t,20,hy0,hz0,hz1,PANE,PANE); bx(x-t,x+t,hy1,y1-6,hz0,hz1,PANE,PANE);
  gAlpha=ga;
  bx(x-t-1,x+t+1,y1-6,y1,z0,z1,TRIM,TRIM);
  bx(x-t-1.5,x+t+1.5,0,20,z0,z1,SKIRT,SKIRT);
  bx(x-t-1,x+t+1,0,y1,z1-8,z1,TRIM,TRIM);
  bx(x-t-4,x+t+4,hy0-4,hy0,hz0-4,hz1+4,SLEEVE,SLEEVE); bx(x-t-4,x+t+4,hy1,hy1+4,hz0-4,hz1+4,SLEEVE,SLEEVE);
  bx(x-t-4,x+t+4,hy0,hy1,hz0-4,hz0,SLEEVE,SLEEVE); bx(x-t-4,x+t+4,hy0,hy1,hz1,hz1+4,SLEEVE,SLEEVE);
}
/* 연결 컨베이어 (선명) */
const BELT=[0.25,0.28,0.33], RAILC=[0.70,0.72,0.74], LEGC=[0.59,0.61,0.63];
function conveyor(){
  const L=RB.LEN, hw=RB.L.beltW/10, seg=160;
  for(let s=0;s<L-1;s+=seg){
    const s1=Math.min(L,s+seg), m=frameAt((s+s1)/2), len=(s1-s)/10+0.3;
    obox([m.c[0]-m.v[0]*1.8,m.c[1]-m.v[1]*1.8,m.c[2]-m.v[2]*1.8],m.u,m.v,m.w,len,1.8,hw,BELT);
    for(const sg of [-1,1]){ const o=hw+1.8;
      obox([m.c[0]+m.w[0]*o*sg,m.c[1]-1.2,m.c[2]+m.w[2]*o*sg],m.u,m.v,m.w,len,4.8,1.3,RAILC); }
  }
  for(const s of [200,1100,2350,3000]){ const f=frameAt(s); if(Math.abs(f.mm.x-BL.wallX)<220||f.mm.x>1830) continue;   /* 카토너 프레임 안쪽은 기계가 받친다 */
    for(const sg of [-1,1]){ const x=f.c[0]+f.w[0]*(hw-1.5)*sg, z=f.c[2]+f.w[2]*(hw-1.5)*sg; bx(x-1.8,x+1.8,0,f.c[1]-5,z-1.8,z+1.8,LEGC,LEGC); }
    bx(f.c[0]-2.5,f.c[0]+2.5,0,1.6,f.c[2]-hw-3,f.c[2]+hw+3,LEGC,LEGC); }
  /* 끝단 슈트 : 컨베이어 끝 → 스태커 매거진 상부 */
  const e=frameAt(L); bx(e.c[0]-1,e.c[0]+30,e.c[1]-2.5,e.c[1]-1.2,e.c[2]-13,e.c[2]+13,RAILC,RAILC);
}
/* 연결 컨베이어 위 팩 : 포일면(은색 + 인쇄) 위, 필름면 아래 */
function packsOnBelt(){
  const PK=RB.PACK, hu=PK.l/10, hv=PK.h/10, hw=PK.w/10, foil=[0.86,0.87,0.89], film=[0.84,0.90,0.93];
  for(const p of RB.st.packs){
    if(p.s<0) continue;
    const f=frameAt(p.s), c=[f.c[0]+f.v[0]*hv,f.c[1]+f.v[1]*hv,f.c[2]+f.v[2]*hv];
    obox(c,f.u,f.v,f.w,hu,hv,hw,film,foil);
    const ink=[.64,.39,.83], t=[c[0]+f.v[0]*(hv+0.08),c[1]+f.v[1]*(hv+0.08),c[2]+f.v[2]*(hv+0.08)];
    obox(t,f.u,f.v,f.w,hu*0.62,0.05,hw*0.18,ink);
  }
  /* 매거진으로 떨어지는 중인 팩 */
  if(RB.st.dropT>0){ const e=frameAt(RB.LEN), k=1-RB.st.dropT/0.18, y=e.c[1]-k*14;
    displayBlister(e.c[0]+13-13,e.c[0]+13+13,y,y+4.4,e.c[2]-11,e.c[2]+11); }
}
/* 스태커 (방 모드) : 하부 하우징(휠 4개) + 가이드 로드 매거진 → 팩 탑이 보인다 */
window.ROOM_STACKER=function(sx,y,LP){
  bx(sx-42,sx+42,y+14,y+56,LP-26,LP+26,COL.inox,COL.inoxD);
  bx(sx-36,sx+36,y+52,y+58,LP-22,LP+22,COL.steel,COL.alu);
  for(const dx of [-16,16]) for(const dz of [-14,14]) cylY(sx+dx,LP+dz,y+58,y+138,1.6,COL.steel,8);
  bx(sx-20,sx+20,y+136,y+139,LP-18,LP-14,COL.steel,COL.alu); bx(sx-20,sx+20,y+136,y+139,LP+14,LP+18,COL.steel,COL.alu);
  bx(sx+30,sx+38,y+56,y+100,LP+22,LP+30,COL.inoxD,COL.inox);     /* 센서 브래킷 기둥 */
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
/* 충전기 배출 컨베이어 (연결부 → 선명) : 충전기 CV x 1052~1212, 상면 Y 44 */
function fillerOutfeed(){
  const BELTC=[0.25,0.28,0.33], FRAME=[0.91,0.93,0.95];
  bx(FX(1052-620),FX(1212-620),FY(44-14),FY(44),FZ(-46),FZ(46),FRAME,FRAME);
  bx(FX(1054-620),FX(1210-620),FY(44),FY(44+2),FZ(-42),FZ(42),BELTC,BELTC);
  for(const z of [-49,45]) bx(FX(1048-620),FX(1216-620),FY(44-20),FY(44+4),FZ(z),FZ(z+5),RAILC,RAILC);
  for(const x of [1070,1190]) for(const z of [-40,40]) bx(FX(x-620)-1.5,FX(x-620)+1.5,0,FY(44-14),FZ(z)-1.5,FZ(z)+1.5,LEGC,LEGC);
}
/* ═══ 6. 세부 형상 (선명 · 정적) ═══ */
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
/* 배선 트레이 (높이 2450 mm · 라인 뒤쪽) : 충전실 캐비닛 → 벽 관통 → 포장실 (카토너 인입) */
const TRAY={y:ly(2450), z:lz(-1350), hw:lz(150), side:ly(80)};
function trayRun(x0,x1,col){
  const {y,z,hw,side}=TRAY;
  bx(x0,x1,y,y+1.2,z-hw,z+hw,col,col);
  for(const s of [-1,1]) bx(x0,x1,y,y+side,z+s*hw-0.6,z+s*hw+0.6,col,col);
  for(let x=x0+20;x<x1;x+=30) bx(x-1.2,x+1.2,y+1.2,y+2,z-hw+1,z+hw-1,col,col);   /* 가로 살 (사다리형) */
}
function trayPost(x,col){ const {y,z,hw}=TRAY;
  bx(x-2,x+2,0,y,z-2,z+2,col,col); bx(x-2.5,x+2.5,y-4,y,z-hw-2,z+hw+2,col,col); anchor(x,z,6); }
function cableTray(){
  const xw=lx(BL.wallX);
  trayRun(xw+12,840,TRAYC);
  for(const x of [-1450,-950,-450,50,450,820]) trayPost(x,STRUT);
  /* 카토너 인입 : 트레이 → 상부 후면 레일 (전선관) */
  const cx=-800, z=TRAY.z;
  tube([cx,TRAY.y-1,z+TRAY.hw],[cx,TRAY.y-1,ZB+3],2.4,STRUT,10);
  tube([cx,TRAY.y-1,ZB+3],[cx,YC+160+2,ZB+3],2.4,STRUT,10);
  bx(cx-5,cx+5,YC+160,YC+166,ZB-2,ZB+8,STEEL,STEEL);
  /* 벽 관통 슬리브 */
  bx(xw-14,xw+14,TRAY.y-4,TRAY.y+TRAY.side+4,z-TRAY.hw-4,z+TRAY.hw+4,SLEEVE,SLEEVE);
  /* 충전실 쪽 (옅은 안개 톤) */
  const H=HZ(TRAYC), Hs=HZ(STRUT);
  trayRun(FX(380),xw-12,H);
  for(const x of [FX(200),FX(700)]){ bx(x-2,x+2,0,TRAY.y,z-2,z+2,Hs,Hs); bx(x-2.5,x+2.5,TRAY.y-4,TRAY.y,z-TRAY.hw-2,z+TRAY.hw+2,Hs,Hs); }
  tube([FX(440),TRAY.y-1,z+TRAY.hw],[FX(440),TRAY.y-1,FZ(-126)],2.2,Hs,8);
  tube([FX(440),TRAY.y-1,FZ(-126)],[FX(440),FY(292),FZ(-126)],2.2,Hs,8);
}
/* 칸막이 벽 : 패널 이음 기둥 · 구역 표지판 */
function wallDetail(){
  const x=lx(BL.wallX), t=BL.wallT/10, y1=ly(BL.wallH);
  for(const zm of [-1700,-500,800,2000,3200]){ const z=lz(zm); bx(x-t-1.4,x+t+1.4,20,y1-6,z-2.4,z+2.4,TRIM,TRIM); }
  const zy0=ly(1720), zy1=ly(1900), zz0=lz(420), zz1=lz(780);                     /* 포장실 쪽 구역 표지 : G구역 (갈색) */
  bx(x+t+1.4,x+t+2.2,zy0,zy1,zz0,zz1,[0.55,0.42,0.20],[0.55,0.42,0.20]);
  bx(x+t+2.2,x+t+2.5,zy0+8,zy1-8,zz0+8,zz1-8,[0.97,0.95,0.90],[0.97,0.95,0.90]);
}
/* 연결 컨베이어 : 구동부(모터 · 감속기) · 광전 센서 · 다리 앵커 · 시작 롤러 */
function conveyorDetail(){
  const hw=RB.L.beltW/10;
  { const f=frameAt(330), c=f.c, g=[c[0]-f.v[0]*10,c[1]-f.v[1]*10,c[2]-f.v[2]*10];
    obox(g,f.u,f.v,f.w,9,8,10,[0.30,0.36,0.44]);                                    /* 감속기 */
    tube([g[0]-f.w[0]*10,g[1],g[2]-f.w[2]*10],[g[0]-f.w[0]*30,g[1],g[2]-f.w[2]*30],8,[0.32,0.38,0.46],14);   /* 모터 */
    tube([g[0]-f.w[0]*30,g[1],g[2]-f.w[2]*30],[g[0]-f.w[0]*32,g[1],g[2]-f.w[2]*32],6.5,[0.20,0.22,0.25],12);
    bx(g[0]-4,g[0]+4,g[1]+8,g[1]+11,g[2]-hw,g[2]+hw,STEEL,STEEL); }
  { const f=frameAt(0), c=f.c; tube([c[0]-f.w[0]*(hw+1),c[1]-2.6,c[2]-f.w[2]*(hw+1)],[c[0]+f.w[0]*(hw+1),c[1]-2.6,c[2]+f.w[2]*(hw+1)],2.6,[0.78,0.80,0.83],12); }
  for(const s of [1350,RB.LEN-200]){ const f=frameAt(s), c=f.c, o=hw+3.5;
    const p=[c[0]+f.w[0]*o,c[1]+3,c[2]+f.w[2]*o], r=[c[0]-f.w[0]*o,c[1]+3,c[2]-f.w[2]*o];
    obox(p,f.u,f.v,f.w,2.5,4,3,[0.18,0.20,0.23]); obox([p[0]-f.w[0]*3.1,p[1]+1,p[2]-f.w[2]*3.1],f.u,f.v,f.w,1.4,1.4,0.2,[0.85,0.40,0.15]);
    obox(r,f.u,f.v,f.w,2.5,3,1.2,[0.80,0.30,0.25]); }
  for(const s of [200,1100,2350,3000]){ const f=frameAt(s); if(Math.abs(f.mm.x-BL.wallX)<220||f.mm.x>1830) continue; anchor(f.c[0],f.c[2],hw+3); }
}
/* ═══ 7. 정적 형상 캐시 : 벽 · 컨베이어 · 트레이 · 옆방 모델 · 세부는 한 번만 만들고 매 프레임 이어 붙인다
   (셰이더가 법선을 픽셀마다 카메라 쪽으로 돌리므로 카메라가 바뀌어도 그대로 쓸 수 있다) ═══ */
let SC=null, SCkey='';
function staticGeom(){ wall(); wallDetail(); conveyor(); conveyorDetail(); fillerOutfeed(); fillRoom(); cableTray(); if(!m3.exp&&!m3.cut) cartonerDetail(); }
const _mach=m3Machine;
m3Machine=function(){
  _mach.apply(this,arguments);
  const ga=gAlpha; gAlpha=1;
  try{
    const key=(m3.exp?1:0)+(m3.cut?2:0)+'';
    if(!SC||SCkey!==key||window.ROOM_GEOM_NOCACHE){
      const L0=[GP.length,GN.length,GC.length,TP.length,TN.length,TC.length];
      staticGeom();
      SC=[GP.slice(L0[0]),GN.slice(L0[1]),GC.slice(L0[2]),TP.slice(L0[3]),TN.slice(L0[4]),TC.slice(L0[5])]; SCkey=key;
    } else {
      const add=(D,A)=>{ for(let i=0,n=A.length;i<n;i++) D.push(A[i]); };      /* 뒤에만 덧붙인다 (배열 전체 복사 없음) */
      add(GP,SC[0]); add(GN,SC[1]); add(GC,SC[2]);
      if(SC[3].length){ add(TP,SC[3]); add(TN,SC[4]); add(TC,SC[5]); }
    }
    packsOnBelt(); fillRoomDyn();
  }catch(e){ console.error(e); }
  gAlpha=ga;
};
window.ROOM_GEOM_STATS=()=>SC?{opaqueTri:SC[0].length/9,glassTri:SC[3].length/9}:null;
})();
