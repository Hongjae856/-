/* ═══════════════════════════════════════════════════════════════════
   작업자 (파우치 인체 모델 human.js) — 충전실 = 흰 방진복(suit) · 포장실 = 파란 작업복(wear, 현장 사진)
   · 충전실 작업자 : 원본 앱 작업자 위치(WK)를 받아 그림 · 포장실 작업자 1 = 판독대 앞 · 2 = 박스 작업대 앞
   · 1인칭으로 그 작업자가 되면 그 작업자는 숨김 (내가 그 작업자) · 걷는 동안 진행 방향을 보고, 멈추면 설비 쪽으로
   ═══════════════════════════════════════════════════════════════════ */
const CREW={F:[], P1:null, P2:null, cur:null, mode:null, rx:true, started:{F:false,P:false}};
function crewInit(){
  for(let i=0;i<2;i++){ const H=makeHuman(V3B.sc,"suit"); H.G.visible=false; CREW.F.push(H); }
  CREW.P1=makeHuman(V3B.sc,"wear"); CREW.P2=makeHuman(V3B.sc,"wear");
}
function crewStep(H,x,z,dt,face){
  if(H.dx==null||Math.hypot(x-H.dx,z-H.dz)>6){ H.dx=x; H.dz=z; H.yw=face; H.vx=0; H.vz=0; }
  const ex=x-H.dx, ez=z-H.dz, k=Math.min(1,dt*10); H.dx=x; H.dz=z;
  if(dt>1e-4){ H.vx+=(ex/dt-H.vx)*k; H.vz+=(ez/dt-H.vz)*k; }
  const mv=Math.hypot(H.vx,H.vz)>.12, yt=mv?Math.atan2(H.vx,H.vz):face; let dy=yt-H.yw; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); H.yw+=dy*Math.min(1,dt*7);
  return {yaw:H.yw,moving:mv};
}
function crewTick(dt){
  const fp=V3B.view!=="orbit", w=appWin(); let W=[]; try{ W=(w.B3&&w.B3.WK())||[]; }catch(e){}
  CREW.F.forEach((H,i)=>{ const q=W[i], me=fp&&CREW.cur==="F"&&i===0; H.G.visible=!!q&&!me; if(!H.G.visible){ H.dx=null; return; }
    const x=q.x*MM, z=(q.z||1100)*MM, s=crewStep(H,x,z,dt,Math.PI); poseHuman(H,{x,z,yaw:s.yaw,dt,gL:.3,gR:.3,nL:"down",nR:"down"}); });
  /* 포장실 1 : 판독대 앞 (판독할 때 병을 판독기에 댐) */
  { const H=CREW.P1, me=fp&&CREW.cur==="P1"; H.G.visible=!me; if(!me){ const x=PK.scanX*MM, z=.62, s=crewStep(H,x,z,dt,Math.PI), sc=PS.scanFlash>0;
      poseHuman(H,{x,z,yaw:s.yaw,dt,L:[x-.12,.98,.3],R:sc?[x+.02,1.0,-.1]:[x+.1,.95,.3],gL:.3,gR:.3,nL:"down",nR:"down"}); } }
  /* 포장실 2 : 박스 작업대 (일반의약품이면 작업자 1 혼자 → 2 는 없음) */
  { const H=CREW.P2, me=fp&&CREW.cur==="P2"; H.G.visible=!me&&PS.rx; if(H.G.visible){ const busy=!PS.box.open||PS.box.full, x=(busy?19950:20300)*MM, z=.7, s=crewStep(H,x,z,dt,Math.PI);
      poseHuman(H,{x,z,yaw:s.yaw,dt,L:busy?[x-.12,.98,.05]:null,R:busy?[x+.12,.98,.05]:null,gL:.3,gR:.3,nL:"down",nR:"down"}); } }
}
