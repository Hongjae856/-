/* ═══════════════════════════════════════════════════════════════════
   다음 작업 안내 (모든 모드 공통 · 11/16 사용자 지시) — 화면 요소는 노란 테두리, 3D 현장에는 노란 화살표(위아래로 움직임) + 노란 고리
   대상 위치 : 타일 → 그 작업의 손 목표(JOBS.reach) · 설비 화면/조작반 → 해당 설비 화면 · 빨간 ! → 조치 위치 · 점검 → 점검 위치 · 시연 버튼 → 단계 위치
   ═══════════════════════════════════════════════════════════════════ */
const TILEJOB={fMain:"power",fAir1:"air",fAir2:"air",fDust:"dust",fPanel:"panel",fDoor:"door",tAlign:"align",mLift:"lift",mScoop:"scoop",mRollOut:"rollOut",mPrn:"prn",tLeak:"leak",
  pCtMain:"ctBack",pSfSw:"ctBack",pCtAir:"ctBack",pHm:"hm",pCw:"cwPow",pXr:"xrPow",pXrKey:"xrPow",pPr:"prPow",pMag:"mag",pLeaf:"leaf",pMagOut:"magOut",pBin:"bin"};
const G3={m:null, ring:null, t:0};
function guideTarget(){
  if(!S||!S.session||!S.session.active||(isExam()&&!hintOn)) return null;
  const sel=hintTarget(); if(!sel) return null; const s=String(sel).split(",")[0].trim();
  try{
    if(s==="#fixBtn"){ const h=recoveryStep(); return h&&h.f&&h.f.fix; }
    if(s==="#demoAct"){ const st=curStep(); return st&&st.pos; }
    if(s==="#lcCheck"){ const st=curStep(); if(!st) return null; let job=null; if(st.lc!==undefined) job=CLEAR[S.room][st.lc].job; else if(st.chk){ const c=st.chk(); job=c&&c.job; } return job&&JOBS[job]&&JOBS[job].reach; }
    if(s==="#ipcTake") return ANC.ipcTake; if(s==="#ipcNext"||s==="#ipcDone") return ANC.ipc;
    const id=(s.match(/^#([A-Za-z0-9]+)$/)||[])[1];
    if(id==="mRed"||id==="mPlain"){ if(S.f.rollCarry) return [PROP.cartUnw[0],.9,PROP.cartUnw[1]]; return [PROP.cartHome[0],.9,PROP.cartHome[1]]; }
    if(id==="tDoc") return S.room==="F"?ANC.docF:ANC.docP;
    if(id&&TILEJOB[id]){ const j=JOBS[TILEJOB[id]]; return j&&(j.reach||[j.stand[0],1.0,j.stand[1]]); }
    if(id&&typeof fpBtnPos==="function"){ const bp=fpBtnPos(id); if(bp) return bp; }   /* 판넬 실제 버튼 */
    let el=null; try{ el=document.querySelector(s); }catch(e){}
    if(el&&el.closest("#hmi,#panel,#hTabs")){ let k=hMach; const tab=s.match(/data-mt="([a-z]+)"/); if(tab) k=tab[1]; const m=monOf(k); if(m) return m.c; }
  }catch(e){}
  return null;
}
/* 3D 표시 : 공통 모듈 aimmark.js (11/17 사용자 결정 — 투시 화살표 · 상자 대신 조작 지점 마커 · 가려지면 안 보임 · 화면 밖은 가장자리 화살표) */
const _grc=new T3.Raycaster();
function guideOcc(eye,q){ const d=Math.hypot(q[0]-eye[0],q[1]-eye[1],q[2]-eye[2]); if(d<.1) return false;
  _grc.set(new T3.Vector3(...eye),new T3.Vector3(q[0]-eye[0],q[1]-eye[1],q[2]-eye[2]).normalize()); _grc.far=d-.08;
  return _grc.intersectObjects(V3.scene.children,true).some(h=>h.object.visible&&h.object.isMesh&&!(h.object.material&&h.object.material.transparent)&&!G3.own.has(h.object)); }
function guide3D(dt){
  if(!V3||!V3.scene) return;
  if(!G3.am){ const n0=V3.scene.children.length; G3.am=createAimMark({T3, scene:V3.scene, camera:()=>V3.camera, canvas:()=>document.getElementById("cv3d"), unit:1, occluded:guideOcc});
    G3.own=new Set(); V3.scene.children.slice(n0).forEach(o=>o.traverse(x=>G3.own.add(x))); }
  const busy=document.querySelectorAll(".modal.on").length>0||!document.getElementById("splash").classList.contains("hide");
  const fp=typeof fpActive==="function"&&fpActive(), eye=R3.eye;
  let goal=null, aim=null;
  if(fp){ goal=FP.hl.goal?fpAM(FP.hl.goal):null; aim=FP.hl.aim?fpAM(FP.hl.aim):null; }
  if(!goal){ const p=guideTarget(); if(p) goal={id:"guide",name:"다음 작업",c:p,s:[.08,.08,.08],pt:p}; }
  G3.res=G3.am.update({eye, goal, aim:fp?aim:null, off:busy||!eye||(fp&&FP.mod&&FP.mod.mode!=="walk")});
}
