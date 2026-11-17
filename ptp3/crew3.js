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
function crew3Tick(dt){
  const fw=UNI_HUB.win("filler"), lw=UNI_HUB.win("line"), L=ROOMBUS.L, fp=V3P.view!=="orbit";
  { const f=fw&&fw.PTP_WKF, H=CREW3.F, me=fp&&WALK.room==="F";
    if(f&&!me){ H.G.visible=true; const x=(4*f.x-3680)*MM, z=(4*f.z+L.fillerZ)*MM;
      const tg=f.both&&f.target?[(4*f.target.x-3680)*MM,(4*f.target.y+1128)*MM,(4*f.target.z+L.fillerZ)*MM]:null;
      poseHuman(H,{x,z,yaw:Math.PI,dt,L:tg?[tg[0]-.1,tg[1],tg[2]]:null,R:tg?[tg[0]+.1,tg[1],tg[2]]:null,gL:.3,gR:.3,nL:"down",nR:"down"}); }
    else H.G.visible=false; }
  const W=(lw&&lw.PTP_WK)||[];
  CREW3.P.forEach((H,i)=>{ const w=W[i], me=fp&&WALK.room==="P"&&i===0; H.G.visible=!!w&&!me; if(!H.G.visible) return;
    const x=(8000+5*w.x)*MM, z=(5*(w.z+((lw.S&&lw.S.doorT)||0)*120))*MM, work=w.job==="work";
    poseHuman(H,{x,z,yaw:Math.PI,dt,L:work?[x-.18,1.02,z-.42]:null,R:work?[x+.18,1.02,z-.42]:null,gL:.3,gR:.3,nL:"down",nR:"down"}); });
}
