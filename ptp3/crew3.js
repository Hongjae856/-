/* ═══════════════════════════════════════════════════════════════════
   작업자 (파우치 인체 모델 human.js 그대로 · 11/17 사용자 지시 "작업자 디자인 파우치처럼")
   · PTP 원본 작업자 모형은 그리지 않고(NO_PTP_WORKER) 위치 · 작업 상태만 받아 파우치 작업자로 그림
   · 충전실 = 흰 방진복(suit) · 포장실 = 파란 가운(wear) — 파우치와 같음
   · 1인칭으로 그 실 작업자가 되면 그 작업자는 숨김 (내가 그 작업자)
   ═══════════════════════════════════════════════════════════════════ */
const CREW3={F:null, P:[]};
function crew3Init(){
  for(const k of ["filler","line"]){ const w=UNI_HUB.win(k); if(w) w.NO_PTP_WORKER=true; }
  CREW3.F=makeHuman(V3P.sc,"suit"); CREW3.F.G.visible=false;
  for(let i=0;i<4;i++){ const H=makeHuman(V3P.sc,"wear"); H.G.visible=false; CREW3.P.push(H); }
}
/* 걸음 방향 (P6) : 앱은 위치만 줌(걸음 속도 · 작업 시간은 앱 그대로 — 포장라인 0.9 m/s, 걷는 동안 작업 시간 정지)
   → 걷는 동안에는 진행 방향을 보고 손을 뻗지 않으며, 멈추면 설비 쪽(-z)으로 몸을 돌림 */
function crew3Step(H,x,z,dt){
  if(H.dx==null||Math.hypot(x-H.dx,z-H.dz)>6){ H.dx=x; H.dz=z; H.yw=Math.PI; H.v=0; H.vx=0; H.vz=0; }
  const ex=x-H.dx, ez=z-H.dz, k=Math.min(1,dt*10); H.dx=x; H.dz=z;
  if(dt>1e-4){ H.vx+=(ex/dt-H.vx)*k; H.vz+=(ez/dt-H.vz)*k; }
  const mv=Math.hypot(H.vx,H.vz)>.12, yt=mv?Math.atan2(H.vx,H.vz):Math.PI; let dy=yt-H.yw; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); H.yw+=dy*Math.min(1,dt*7);
  return {x,z,yaw:H.yw,moving:mv};
}
function crew3Tick(dt){
  const fw=UNI_HUB.win("filler"), lw=UNI_HUB.win("line"), L=ROOMBUS.L, fp=V3P.view!=="orbit";
  { const f=fw&&fw.PTP_WKF, H=CREW3.F, me=fp&&WALK.room==="F";
    if(f&&!me){ H.G.visible=true; const q=crew3Step(H,(4*f.x-3680)*MM,(4*f.z+L.fillerZ)*MM,dt);
      const tg=!q.moving&&f.both&&f.target?[(4*f.target.x-3680)*MM,(4*f.target.y+1128)*MM,(4*f.target.z+L.fillerZ)*MM]:null;
      poseHuman(H,{x:q.x,z:q.z,yaw:q.yaw,dt,L:tg?[tg[0]-.1,tg[1],tg[2]]:null,R:tg?[tg[0]+.1,tg[1],tg[2]]:null,gL:.3,gR:.3,nL:"down",nR:"down"}); }
    else { H.G.visible=false; H.dx=null; } }
  const W=(lw&&lw.PTP_WK)||[];
  CREW3.P.forEach((H,i)=>{ const w=W[i], me=fp&&WALK.room==="P"&&i===0; H.G.visible=!!w&&!me; if(!H.G.visible){ H.dx=null; return; }
    const q=crew3Step(H,(8000+5*w.x)*MM,(5*(w.z+((lw.S&&lw.S.doorT)||0)*120))*MM,dt), work=w.job==="work"&&!q.moving;
    poseHuman(H,{x:q.x,z:q.z,yaw:q.yaw,dt,L:work?[q.x-.18,1.02,q.z-.42]:null,R:work?[q.x+.18,1.02,q.z-.42]:null,gL:.3,gR:.3,nL:"down",nR:"down"}); });
}
