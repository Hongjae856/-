/* ═══════════════════════════════════════════════════════════════════
   1인칭 이동 (P1) — 눈높이 1.55 m(11/18 세 IDT 통일 · idt_common/fpctl.js) · WASD 걷기 · 마우스로 둘러보기(클릭하면 시점 고정, Esc 해제) · Shift 빠르게
   충돌 : 설비 · 칸막이 벽 형상에서 만든 바닥 점유 격자(50 mm) — 높이 0.08~1.9 m 에 걸친 면이 차지하는 칸은 못 지나감
   ═══════════════════════════════════════════════════════════════════ */
const WALK={x:0,y:1550,z:0,yaw:0,pitch:0,keys:{},room:"F",grid:null,R:250};
const walkFwd=()=>[-Math.sin(WALK.yaw)*Math.cos(WALK.pitch),Math.sin(WALK.pitch),-Math.cos(WALK.yaw)*Math.cos(WALK.pitch)];
const GRID={c:50,x0:0,z0:0,nx:0,nz:0,a:null};
/* 점유 격자 : 형상 삼각형의 xz 범위를 칠함 (단위 → mm 변환 포함) */
function gridBuild(){
  const L=ROOMBUS.L; Object.assign(GRID,{x0:L.dMinX,z0:L.backZ,nx:Math.ceil((L.gMaxX-L.dMinX)/GRID.c),nz:Math.ceil((L.frontZ-L.backZ)/GRID.c)}); GRID.a=new Uint8Array(GRID.nx*GRID.nz);
  const mark=(ax,az,bx,bz,cx,cz,y0,y1)=>{ if(y1<80||y0>1900) return;
    const x0=Math.floor((Math.min(ax,bx,cx)-GRID.x0)/GRID.c), x1=Math.floor((Math.max(ax,bx,cx)-GRID.x0)/GRID.c), z0=Math.floor((Math.min(az,bz,cz)-GRID.z0)/GRID.c), z1=Math.floor((Math.max(az,bz,cz)-GRID.z0)/GRID.c);
    if((x1-x0)*(z1-z0)>4000) return;                                    /* 아주 큰 면(바닥 · 천장 판)은 제외 */
    for(let i=Math.max(0,x0);i<=Math.min(GRID.nx-1,x1);i++) for(let k=Math.max(0,z0);k<=Math.min(GRID.nz-1,z1);k++) GRID.a[k*GRID.nx+i]=1; };
  const inter=(o,stride,n,s,px,py,pz)=>{ const d=o.buf; for(let t=0;t<n;t+=3){ const v=i=>[px+d[(t+i)*stride]*s, py+d[(t+i)*stride+1]*s, pz+d[(t+i)*stride+2]*s]; const a=v(0),b=v(1),c=v(2);
      mark(a[0],a[2],b[0],b[2],c[0],c[2],Math.min(a[1],b[1],c[1]),Math.max(a[1],b[1],c[1])); } };
  const O=V3P.objs;
  if(O.room.buf) inter(O.room,STRIDE,O.room.g[0].drawRange.count,1,0,0,0);
  if(O.filler.buf) inter(O.filler,STRIDE,O.filler.g[0].drawRange.count,4,-3680,1128,L.fillerZ);
  const lp=O.line.part[0]; if(lp.P){ const n=lp.g.drawRange.count; for(let t=0;t<n;t+=3){ const v=i=>[8000+lp.P[(t+i)*3]*5, lp.P[(t+i)*3+1]*5, lp.P[(t+i)*3+2]*5]; const a=v(0),b=v(1),c=v(2);
      mark(a[0],a[2],b[0],b[2],c[0],c[2],Math.min(a[1],b[1],c[1]),Math.max(a[1],b[1],c[1])); } }
  WALK.grid=GRID;
}
function gridHit(x,z){ const L=ROOMBUS.L, m=250; if(x<L.dMinX+m||x>L.gMaxX-m||z<L.backZ+m||z>L.frontZ-m) return true; if(!GRID.a) return false;
  const i=Math.floor((x-GRID.x0)/GRID.c), k=Math.floor((z-GRID.z0)/GRID.c); if(i<0||k<0||i>=GRID.nx||k>=GRID.nz) return true; return !!GRID.a[k*GRID.nx+i]; }
function walkFree(x,z){ const r=WALK.R; if(gridHit(x,z)) return false; for(let a=0;a<8;a++){ const q=a*Math.PI/4; if(gridHit(x+Math.cos(q)*r,z+Math.sin(q)*r)) return false; } return true; }
/* 작업자 시작 위치 : 그 실 설비 앞(작업자 쪽 +z)에서 비어 있는 가장 가까운 곳 */
function walkSpawn(room){
  const L=ROOMBUS.L; let bx=[1e9,-1e9], bz=-1e9;                     /* 그 실 설비가 차지한 칸의 범위 → 가운데 앞 0.9 m */
  if(GRID.a) for(let k=0;k<GRID.nz;k++) for(let i=0;i<GRID.nx;i++){ if(!GRID.a[k*GRID.nx+i]) continue; const x=GRID.x0+(i+.5)*GRID.c, z=GRID.z0+(k+.5)*GRID.c;
    if(room==="F"?x>-300:x<300) continue; if(z>L.frontZ-600||z<L.backZ+400) continue; bx[0]=Math.min(bx[0],x); bx[1]=Math.max(bx[1],x); bz=Math.max(bz,z); }
  const want=bx[0]<bx[1]?[room==="F"?(bx[0]+bx[1])/2:bx[0]+2600, Math.min(L.frontZ-700,bz+1400)]:[room==="F"?-4600:4000,2600];
  let best=null, bd=1e18; for(let r=0;r<6000&&!best;r+=100) for(let a=0;a<24;a++){ const q=a/24*Math.PI*2, x=want[0]+Math.cos(q)*r, z=want[1]+Math.sin(q)*r;
    if(room==="F"?x>-400:x<400) continue; if(walkFree(x,z)){ const d=r; if(d<bd){ bd=d; best=[x,z]; } } }
  best=best||want; Object.assign(WALK,{x:best[0],z:best[1],y:fpcEye(0),yaw:0,pitch:-.1,room});
}
function walkTick(dt){
  fpcTick(dt); WALK.y=fpcEye(0);                                   /* 눈높이 · 앉기 (C) */
  if(V3P.view==="orbit"||(typeof FP3!=="undefined"&&FP3.hmi)) return;
  const k=WALK.keys, sp=fpcSpeed(k)*1000*dt; let mx=0,mz=0;
  if(k.KeyW||k.ArrowUp) mz-=1; if(k.KeyS||k.ArrowDown) mz+=1; if(k.KeyA||k.ArrowLeft) mx-=1; if(k.KeyD||k.ArrowRight) mx+=1;
  if(!mx&&!mz) return; const l=Math.hypot(mx,mz); mx/=l; mz/=l;
  const s=Math.sin(WALK.yaw), c=Math.cos(WALK.yaw), dx=(mx*c+mz*s)*sp, dz=(-mx*s+mz*c)*sp;
  if(walkFree(WALK.x+dx,WALK.z+dz)){ WALK.x+=dx; WALK.z+=dz; } else if(walkFree(WALK.x+dx,WALK.z)) WALK.x+=dx; else if(walkFree(WALK.x,WALK.z+dz)) WALK.z+=dz;   /* 벽을 따라 미끄러짐 */
}
function walkBind(){
  const cv=document.getElementById("cv"); let drag=null;
  addEventListener("keydown",e=>{ WALK.keys[e.code]=true; if(V3P.view!=="orbit"&&/^(Arrow|Space)/.test(e.code)) e.preventDefault(); });
  addEventListener("keyup",e=>{ WALK.keys[e.code]=false; });
  addEventListener("blur",()=>{ WALK.keys={}; });
  cv.addEventListener("click",()=>{ if(V3P.view!=="orbit"&&typeof FP3!=="undefined"&&(FP3.hmi||(FP3.aim&&fp3Act()))) return;
    if(V3P.view!=="orbit"&&document.pointerLockElement!==cv&&cv.requestPointerLock) try{ cv.requestPointerLock(); }catch(e){} });
  cv.addEventListener("mousedown",e=>{ if(V3P.view!=="orbit") drag={x:e.clientX,y:e.clientY}; });
  addEventListener("mouseup",()=>drag=null);
  addEventListener("mousemove",e=>{ if(V3P.view==="orbit"||(typeof FP3!=="undefined"&&FP3.hmi)) return; let dx=0,dy=0;
    if(document.pointerLockElement===cv){ dx=e.movementX; dy=e.movementY; } else if(drag){ dx=e.clientX-drag.x; dy=e.clientY-drag.y; drag.x=e.clientX; drag.y=e.clientY; } else return;
    WALK.yaw-=dx*.0025; WALK.pitch=Math.max(-1.3,Math.min(1.3,WALK.pitch-dy*.0025)); });
}
