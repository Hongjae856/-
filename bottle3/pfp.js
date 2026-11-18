/* ═══════════════════════════════════════════════════════════════════
   1인칭 직접 조작 (B5) — 다가가서 조준하고 E 또는 클릭 (파우치 · PTP 와 같은 방식)
   · 대상 표시 : 공통 모듈 idt_common/aimmark.js (조작 지점 마커 · 손 닿는 거리 1.2 m · 가려지면 안 보임 · 화면 밖은 가장자리 화살표)
   · 포장실 : 각 설비의 실제 조작부(화면 · 판넬 · 판독기 · 박스 · 파렛트) 위치 — 누르면 포장실 타일과 같은 동작
   · 1인칭 중에는 왼쪽 타일은 현황만 (직접 클릭 막음) — 파우치와 같음
   ═══════════════════════════════════════════════════════════════════ */
const PF={T:[], aim:null, aimIn:false, goal:null, res:{}};
/* 조작 대상 (mm · 크기 m) — k : 동작(타일 키) · 여러 동작을 한 곳에서 하면 fn 으로 고름 */
function pfTargets(){
  const T=[], add=(id,nm,p,s,k)=>T.push({id,nm,p,s,k});
  add("rejL","리젝트 함 (라벨러 후단)",[12500,700,330],[.3,.3,.3],"rej");
  add("rejC","리젝트 함 (중량선별기)",[15950,700,330],[.4,.3,.3],"rej");
  add("tt","턴테이블 속도 조절기 · 전원",[10150,410,-28],[.18,.14,.04],"tt");
  add("pr","라벨 인쇄기 화면 (ON/OFF)",[11080,1615,447],[.33,.2,.03],"pr");
  add("vis","비전 PC 화면 (시작 · 중지)",[10250,1460,1075],[.36,.27,.03],"vis");
  add("lab","라벨러 판넬 (RUN · STOP)",[12300,1610,475],[.3,.22,.04],"lab");
  add("first","첫 라벨 (라벨러 출구)",[12300,990,0],[.15,.12,.15],"first");
  add("leaf","설명서 부착기 컨트롤러 · 전원함",[14250,1500,450],[.6,.3,.06],"leaf");
  add("cwSet","중량선별기 키패드 (중량 세팅)",[15150,1600,-416],[.28,.17,.03],"cwSet");
  add("cw","중량선별기 가동 · 정지 버튼",[15150,1460,-416],[.28,.06,.03],"cw");
  add("sample","중량선별기 입구 (시료 투입)",[14750,960,0],[.3,.15,.2],"sample");
  if(PS.rx){ add("ag","집합 포장 PC 화면",[PK.scanX,1495,-328],[.56,.36,.04],"ag"); add("scan","거치형 판독기",[PK.scanX,1000,-118],[.26,.16,.05],"scan");
    add("agLab","AG 라벨 프린터 (발행된 라벨)",[19175,1010,-40],[.25,.12,.06],"agLab"); }
  add("leafBelt","설명서 부착기 벨트 · 부착 헤드",[13720,1000,-40],[.2,.12,.2],"leafBelt");
  add("tension","라벨 롤 · 장력 조정",[10900,1070,-470],[.36,.12,.36],"tension");
  add("flat","접힌 박스 더미",[21000,960,-150],[.6,.12,.46],"boxMk");
  add("box","작업대 박스",[19950,960,0],[.36,.14,.25],"box");
  add("pal","파렛트",[PK.pallet.x,300,PK.pallet.z],[1.1,.4,1.1],"pal");
  PF.T=T; return T;
}
/* 작업대 박스 : 상태에 따라 담기 · 봉함 */
const pfBoxKey=()=>PS.box.full?"seal":"put";
const pfKeyOf=t=>t.k==="box"?pfBoxKey():t.k;
const PF_AG=["agStart","agClear","agPack","agEnd"];
function pfGoal(){ if(CREW.inc&&INCB.room==="P"&&INCB.mode!=="exam"&&INCB.fired&&!INCB.done){ const f=PK_INC[INCB.k].fix[INCB.fi]; return f?PF.T.find(t=>t.k===f.k)||null:null; }
  if(!PC.on||PC.done||PC.mode==="exam"||PC.mode==="free") return null; const st=PC.steps[PC.i]; if(!st) return null; const k=st.k;
  return PF.T.find(t=>pfKeyOf(t)===k||(t.k==="ag"&&PF_AG.includes(k))||(k==="stop"&&t.k==="tt"&&PS.tt.on))||null; }
const pfT=t=>t&&{id:t.id, name:t.nm, c:[t.p[0]*MM,t.p[1]*MM,t.p[2]*MM], s:t.s};
const pfEye=()=>[WALK.x*MM,WALK.y*MM,WALK.z*MM];
function pfAim(){
  PF.aim=null; PF.aimIn=false; if(V3B.view==="orbit"||!document.body.classList.contains("pk")) return; const f=walkFwd(); let best=1e9;
  for(const t of PF.T){ const dx=t.p[0]-WALK.x, dy=t.p[1]-WALK.y, dz=t.p[2]-WALK.z, L=Math.hypot(dx,dy,dz); if(L>AIM_LOOK*1000) continue;
    const c=(dx*f[0]+dy*f[1]+dz*f[2])/L, r=Math.max(t.s[0],t.s[1])*1000, ang=Math.acos(Math.min(1,c)), tol=Math.atan2(r*.5+40,L), sc=ang/tol+L/20000;
    if(ang<tol&&sc<best){ best=sc; PF.aim=t; } }
  if(PF.aim) PF.aimIn=aimInReach(pfT(PF.aim),pfEye());
}
function pfAct(){
  const t=PF.aim; if(!t) return false; if(!PF.aimIn){ pcToast("가까이 가세요 — "+t.nm+" ("+(PF.res.aimDist||0).toFixed(1)+" m · 손 닿는 거리 1.2 m)"); return true; }
  if(t.k==="ag"){ pcDlg('<h3>집합 포장 PC</h3><p>단품 '+PS.ag.n+' / '+PS.boxN+' · 박스 '+PS.ag.boxes+' · '+(PS.ag.msg||"")+'</p>',
      [["작업 시작",()=>pcAct("agStart")],["클리어",()=>pcAct("agClear")],["재발급",()=>{ PS_ACT.agReissue(); }],["포장완료",()=>pcAct("agPack")],["작업완료",()=>pcAct("agEnd")],["닫기",null]]); return true; }
  pcAct(pfKeyOf(t)); return true;
}
function pfHud(){ const h=$("#hud"); if(!document.body.classList.contains("pk")||V3B.view==="orbit") return false;
  const a=PF.aim, g=PF.goal, R=PF.res||{}, m=x=>x==null?"":" · "+x.toFixed(1)+" m";
  h.innerHTML=a&&PF.aimIn?"<b>E</b> / 클릭 · <b>"+a.nm+"</b>"+(g===a?" <span class='nx'>다음 작업</span>":"")
    :a&&!R.aimHidden?"<span class='far'>가까이 가세요"+m(R.aimDist)+"</span> · "+a.nm
    :g?"다음 작업 : <b>"+g.nm+"</b>"+m(R.goalDist)+" "+(R.goalDir||""):"1인칭 · 포장실 · W A S D 걷기 · 화면 클릭 후 마우스로 둘러보기 (Esc 풀기)";
  return true; }
function pfInit(){
  PF.am=createAimMark({T3, scene:V3B.sc, camera:()=>V3B.cam, canvas:()=>$("#cv"), unit:1});
  addEventListener("keydown",e=>{ if(e.code==="KeyE"&&$("#pDlg").hidden&&document.body.classList.contains("pk")&&V3B.view!=="orbit"){ if(pfAct()) e.preventDefault(); } });
}
function pfTick(now){
  const on=document.body.classList.contains("pk")&&V3B.view!=="orbit"&&PC.on;
  document.body.classList.toggle("pkfp",on);
  if(!on){ PF.am&&PF.am.hide(); PF.aim=null; return; }
  if(now-(PF.t||0)>300){ PF.t=now; pfTargets(); }
  pfAim(); PF.goal=pfGoal();
  PF.res=PF.am.update({eye:pfEye(), goal:pfT(PF.goal), aim:pfT(PF.aim), now, off:!$("#pDlg").hidden});
}
