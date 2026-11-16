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
function guide3D(dt){
  if(!V3||!V3.scene) return;
  if(!G3.m){ const mat=new T3.MeshBasicMaterial({color:0xffcc00}), G=new T3.Group();
    const cone=new T3.Mesh(new T3.ConeGeometry(.075,.16,20),mat); cone.rotation.x=Math.PI; cone.position.y=.08; G.add(cone);
    const sh=new T3.Mesh(new T3.CylinderGeometry(.028,.028,.2,14),mat); sh.position.y=.26; G.add(sh);
    const ol=new T3.Mesh(new T3.ConeGeometry(.088,.18,20),new T3.MeshBasicMaterial({color:0x7a5a00,side:T3.BackSide})); ol.rotation.x=Math.PI; ol.position.y=.08; G.add(ol);
    G.renderOrder=999; G.traverse(o=>{ if(o.material){ o.material.depthTest=false; o.material.transparent=true; o.renderOrder=999; } });
    V3.scene.add(G); G3.m=G;
    const ring=new T3.Mesh(new T3.TorusGeometry(.13,.012,8,40),new T3.MeshBasicMaterial({color:0xffcc00,transparent:true,depthTest:false})); ring.renderOrder=998; V3.scene.add(ring); G3.ring=ring; }
  const p=guideTarget(); G3.m.visible=G3.ring.visible=!!p; if(!p) return;
  G3.t+=dt; const b=Math.abs(Math.sin(G3.t*3.2))*.09;
  G3.m.position.set(p[0],p[1]+.12+b,p[2]); G3.m.rotation.y=G3.t*1.6;
  const s=1+.25*Math.sin(G3.t*4); G3.ring.position.set(p[0],p[1],p[2]); G3.ring.scale.setScalar(s); G3.ring.lookAt(R3.eye?new T3.Vector3(...R3.eye):V3.camera.position);
  G3.ring.material.opacity=.55+.35*Math.sin(G3.t*4);
}
