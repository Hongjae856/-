/* ═══════════════════════════════════════════════════════════════════
   1인칭 이동 (B1) — 눈높이 1.6 m · WASD 걷기 · 마우스로 둘러보기(클릭하면 시점 고정, Esc 해제) · Shift 빠르게
   충돌 : 앱 형상(정적 · 불투명)에서 만든 바닥 점유 격자(50 mm) — 높이 0.08~1.9 m 에 걸친 면이 차지하는 칸은 못 지나감
          + 방 벽 · 칸막이 벽(통과구는 사람이 못 지나감 · 실 사이 출입은 앞쪽 문 자리 z > 3600)
   ═══════════════════════════════════════════════════════════════════ */
const WALK={x:0,y:1600,z:2600,yaw:0,pitch:-.1,keys:{},room:"F",R:250};
const DOORZ=[3600,4900];                     /* 칸막이 벽 출입문 자리 (앞쪽) */
const walkFwd=()=>[-Math.sin(WALK.yaw)*Math.cos(WALK.pitch),Math.sin(WALK.pitch),-Math.cos(WALK.yaw)*Math.cos(WALK.pitch)];
const GRID={c:50,x0:0,z0:0,nx:0,nz:0,a:null};
let PK_OBS=null;                              /* 포장실 설비 (pack.js) */
function gridBuild(){
  Object.assign(GRID,{x0:ROOM.x0,z0:ROOM.z0,nx:Math.ceil((ROOM.x1-ROOM.x0)/GRID.c),nz:Math.ceil((ROOM.z1-ROOM.z0)/GRID.c)}); GRID.a=new Uint8Array(GRID.nx*GRID.nz);
  const o=V3B.objs.statOp, n=o.g.drawRange.count, P=o.P; if(!P) return;
  let ST=[]; try{ ST=appWin().eval("STAIRS")||[]; }catch(e){}                       /* 계단 발판 위는 걸어 올라감 */
  const onStair=(x,z)=>ST.some(t=>x>t.x0-10&&x<t.x1+10&&z>t.zs-10&&z<t.zp1+10);
  for(let t=0;t+2<n;t+=3){ const a=t*3, ys=[P[a+1],P[a+4],P[a+7]], y0=Math.min(...ys), y1=Math.max(...ys); if(y1<80||y0>1900) continue;
    const xs=[P[a],P[a+3],P[a+6]], zs=[P[a+2],P[a+5],P[a+8]]; if(onStair((xs[0]+xs[1]+xs[2])/3,(zs[0]+zs[1]+zs[2])/3)) continue;
    const i0=Math.floor((Math.min(...xs)-GRID.x0)/GRID.c), i1=Math.floor((Math.max(...xs)-GRID.x0)/GRID.c), k0=Math.floor((Math.min(...zs)-GRID.z0)/GRID.c), k1=Math.floor((Math.max(...zs)-GRID.z0)/GRID.c);
    if((i1-i0)*(k1-k0)>4000) continue;
    for(let i=Math.max(0,i0);i<=Math.min(GRID.nx-1,i1);i++) for(let k=Math.max(0,k0);k<=Math.min(GRID.nz-1,k1);k++) GRID.a[k*GRID.nx+i]=1; }
}
function gridHit(x,z){
  const m=250; if(x<ROOM.x0+m||x>ROOM.x1-m||z<ROOM.z0+m||z>ROOM.z1-m) return true;
  if(Math.abs(x-ROOM.wallX)<75+m&&!(z>DOORZ[0]&&z<DOORZ[1])) return true;          /* 칸막이 벽 (앞쪽 문 자리만 통과) */
  if(PK_OBS&&PK_OBS.some(r=>x>r[0]&&x<r[1]&&z>r[2]&&z<r[3])) return true;
  if(!GRID.a) return false; const i=Math.floor((x-GRID.x0)/GRID.c), k=Math.floor((z-GRID.z0)/GRID.c);
  if(i<0||k<0||i>=GRID.nx||k>=GRID.nz) return true; return !!GRID.a[k*GRID.nx+i]; }
function walkFree(x,z){ const r=WALK.R; if(gridHit(x,z)) return false; for(let a=0;a<8;a++){ const q=a*Math.PI/4; if(gridHit(x+Math.cos(q)*r,z+Math.sin(q)*r)) return false; } return true; }
function walkSpawn(room){
  PK_OBS=PK_OBS||(typeof pkObstacles==="function"?pkObstacles():[]);
  const want=room==="F"?[-1500,1300]:[ROOM.wallX+2500,1300];
  let best=null; for(let r=0;r<5000&&!best;r+=100) for(let a=0;a<24;a++){ const q=a/24*Math.PI*2, x=want[0]+Math.cos(q)*r, z=want[1]+Math.sin(q)*r; if(walkFree(x,z)){ best=[x,z]; break; } }
  best=best||want; Object.assign(WALK,{x:best[0],z:best[1],y:1600,yaw:0,pitch:-.12,room});
}
function walkTick(dt){
  if(V3B.view==="orbit") return;
  const k=WALK.keys, sp=(k.ShiftLeft||k.ShiftRight?2.6:1.4)*1000*dt; let mx=0,mz=0;
  if(k.KeyW||k.ArrowUp) mz-=1; if(k.KeyS||k.ArrowDown) mz+=1; if(k.KeyA||k.ArrowLeft) mx-=1; if(k.KeyD||k.ArrowRight) mx+=1;
  if(!mx&&!mz) return; const l=Math.hypot(mx,mz); mx/=l; mz/=l;
  const s=Math.sin(WALK.yaw), c=Math.cos(WALK.yaw), dx=(mx*c+mz*s)*sp, dz=(-mx*s+mz*c)*sp;
  if(walkFree(WALK.x+dx,WALK.z+dz)){ WALK.x+=dx; WALK.z+=dz; } else if(walkFree(WALK.x+dx,WALK.z)) WALK.x+=dx; else if(walkFree(WALK.x,WALK.z+dz)) WALK.z+=dz;
  WALK.room=WALK.x<ROOM.wallX?"F":"P";
}
function walkBind(){
  const cv=document.getElementById("cv"); let drag=null;
  addEventListener("keydown",e=>{ WALK.keys[e.code]=true; if(V3B.view!=="orbit"&&/^(Arrow|Space)/.test(e.code)) e.preventDefault(); });
  addEventListener("keyup",e=>{ WALK.keys[e.code]=false; });
  addEventListener("blur",()=>{ WALK.keys={}; });
  cv.addEventListener("click",()=>{ if(V3B.view!=="orbit"&&typeof FF!=="undefined"&&CREW.cur==="F"&&(FF.hmi||(FF.aim&&ffAct()))) return; if(V3B.view!=="orbit"&&typeof PF!=="undefined"&&document.body.classList.contains("pkfp")&&PF.aim&&pfAct()) return; if(V3B.view!=="orbit"&&document.pointerLockElement!==cv&&cv.requestPointerLock) try{ cv.requestPointerLock(); }catch(e){} });
  cv.addEventListener("mousedown",e=>{ if(V3B.view!=="orbit") drag={x:e.clientX,y:e.clientY}; });
  addEventListener("mouseup",()=>drag=null);
  addEventListener("mousemove",e=>{ if(V3B.view==="orbit") return; let dx=0,dy=0;
    if(document.pointerLockElement===cv){ dx=e.movementX; dy=e.movementY; } else if(drag){ dx=e.clientX-drag.x; dy=e.clientY-drag.y; drag.x=e.clientX; drag.y=e.clientY; } else return;
    WALK.yaw-=dx*.0025; WALK.pitch=Math.max(-1.3,Math.min(1.3,WALK.pitch-dy*.0025)); });
}
