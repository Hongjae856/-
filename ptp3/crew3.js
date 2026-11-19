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
/* 걸음 방향 (P6) : 앱은 위치만 줌(걸음 속도는 빌드 때 세 IDT 공통 1.4 m/s 로 맞춤 · 작업 시간은 앱 그대로, 걷는 동안 작업 시간 정지)
   → 걷는 동안에는 진행 방향을 보고 손을 뻗지 않으며, 멈추면 설비 쪽(-z)으로 몸을 돌림 */
function crew3Step(H,x,z,dt){ const q=idtFaceStep(H,x,z,dt,Math.PI); return {x,z,yaw:q.yaw,moving:q.moving}; }   /* 공통 crewkit.js */
/* 들고 가는 자재 : 공통 idt_common/crewkit.js (IDT_CARRY — 크기 · 손 간격은 그 표 한 곳) — 걷는 동안 가슴 앞, 작업 중 손을 작업 지점으로 뻗어 놓음 */
const crew3Item=(H,kind)=>idtItem(H,kind,V3P.sc);
const crew3Hold=(H,P,kind,cp,yaw)=>idtHold(H,P,kind,cp,yaw,V3P.sc);
const CREW3_LK={carton:"carton",leaflet:"leaflet",cases:"cases",tape:"tape",label:"label"};
function crew3Tick(dt){
  const fw=UNI_HUB.win("filler"), lw=UNI_HUB.win("line"), L=ROOMBUS.L, fp=V3P.view!=="orbit";
  { const f=fw&&fw.PTP_WKF, H=CREW3.F, me=fp&&WALK.room==="F";
    if(f&&!me){ H.G.visible=true; const q=crew3Step(H,(4*f.x-3680)*MM,(4*f.z+L.fillerZ)*MM,dt), fwd=[Math.sin(q.yaw),Math.cos(q.yaw)];
      const tg=f.both&&f.target?[(4*f.target.x-3680)*MM,(4*f.target.y+1128)*MM,(4*f.target.z+L.fillerZ)*MM]:null;
      const kind=f.key?(f.key==="film"||f.key==="foil"?f.key:"part"):null, P={x:q.x,z:q.z,yaw:q.yaw,dt,L:null,R:null,gL:.3,gR:.3,nL:"down",nR:"down"};
      if(kind&&(q.moving||(f.ph||0)<.15)){ let cp=[q.x+fwd[0]*.36,1.02,q.z+fwd[1]*.36]; if(!q.moving&&tg){ const r=Math.min(1,(f.reach||0)*1.4); cp=cp.map((v,k)=>v+(tg[k]-v)*r*.85); } crew3Hold(H,P,kind,cp,q.yaw); }
      else { crew3Item(H,null); if(!q.moving&&tg){ P.L=[tg[0]-.1,tg[1],tg[2]]; P.R=[tg[0]+.1,tg[1],tg[2]]; } }
      poseHuman(H,P); }
    else { H.G.visible=false; H.dx=null; crew3Item(H,null); } }
  const W=(lw&&lw.PTP_WK)||[];
  CREW3.P.forEach((H,i)=>{ const w=W[i], me=fp&&WALK.room==="P"&&i===0; H.G.visible=!!w&&!me; if(!H.G.visible){ H.dx=null; crew3Item(H,null); return; }
    const q=crew3Step(H,(8000+5*w.x)*MM,(5*(w.z+((lw.S&&lw.S.doorT)||0)*120))*MM,dt), work=w.job==="work"&&!q.moving, fwd=[Math.sin(q.yaw),Math.cos(q.yaw)];
    const kind=w.job==="work"?CREW3_LK[w.key]:null, P={x:q.x,z:q.z,yaw:q.yaw,dt,L:null,R:null,gL:.3,gR:.3,nL:"down",nR:"down"};
    if(kind&&(q.moving||(w.workPhase||0)<.7)){ const r=q.moving?0:Math.min(1,(w.workPhase||0)/.5); crew3Hold(H,P,kind,[q.x+fwd[0]*(.36+.1*r),1.02+.05*r,q.z+fwd[1]*(.36+.1*r)],q.yaw); }
    else { crew3Item(H,null); if(work){ P.L=[q.x-.18,1.02,q.z-.42]; P.R=[q.x+.18,1.02,q.z-.42]; } }
    poseHuman(H,P); });
}
