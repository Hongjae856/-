/* ═══════════════════════════════════════════════════════════════════
   시연모드 — 단계 버튼식 (11/18 사용자 결정 · 파우치 · PTP 와 같은 방식)
   · 단계마다 [시연 실행] 버튼 하나 · 3인칭이면 카메라가 해당 구역으로 이동 · 평가 없음 · 다음 작업 표시 없음
   · 충전실 : 전원 일괄 ON → 자재 일괄 투입 → 라인 가동 → 생산 관찰 (가동 뒤 자재 보충 · 회수 · 알람 복구는 원본 시연처럼 자동)
   · 포장실 : 설비 일괄 ON → 포장 진행 관찰 (작업자 1 · 2 자동)
   ═══════════════════════════════════════════════════════════════════ */
const DEMOB={i:{F:0,P:0}, res:{F:false,P:false}};
const DEMOB_STEPS={
  F:[{t:"충전실 전원 일괄 ON",btn:"충전실 전원 ON",d:"버튼 한 번으로 전기판넬 메인 전원 · 압축공기 밸브 · 집진기 · 안전문 확인 · HMI 로그인 · 품목(레시피) 적용 · 계량 영점까지 준비합니다.",
      cam:{tx:-5200,ty:900,tz:-800,dist:7000,yaw:-.3,pitch:.32},
      act:w=>w.eval("S.air=true; S.airP=6.2; S.main=true; S.dust=true; S.door='closed'; S.user=ACCOUNTS[0]; S.lvl=ACCOUNTS[0].lvl; applyRecipe(); S.recipeApplied=true; S.dmc.checked=S.wc.checked=S.rcp.checked=true; S.wc.zero=[true,true]; S.wc.off=[0,0]; S.ua.air=S.ua.vac=true; S.pe.sensor=true; S.rcp.feed=true; buildStatic(); after&&after();"),
      ok:w=>w.eval("S.main&&S.recipeApplied")},
     {t:"자재 일괄 투입",btn:"자재 일괄 투입",d:"빈 병(턴테이블) · 실리카겔 롤 · 정제(호퍼) · PE 필름 · 캡(볼 피더)을 각 설비에 투입합니다.",
      cam:{tx:-2500,ty:900,tz:0,dist:8500,yaw:-.4,pitch:.36},
      act:w=>w.eval('for(const k of ["bottle","gel","film","cap"]) S.mat[k]=MAT_CAP[k]; S.mat.tab=matCap("tab"); buildStatic(); after&&after();'),
      ok:w=>w.eval("S.mat.bottle>0&&S.mat.cap>0&&S.mat.tab>0")},
     {t:"라인 가동 (START)",btn:"라인 가동",d:"라인 조작 판넬 START — UA-120 → SG-120 → 계량 → DMC-60T → HPE-100 → RCS-120 → 집적 테이블까지 자동 운전합니다.",
      cam:{tx:1400,ty:700,tz:200,dist:9500,yaw:-.45,pitch:.38},
      act:w=>w.eval("S.cnt.target=1e9; S.running=true; S.started=true; after&&after();"),
      ok:w=>w.eval("S.running")},
     {t:"생산 관찰",d:"양품 20 병까지 지켜봅니다. 자재 보충 · 집적 테이블 회수 · 알람 복구는 작업자가 자동으로 합니다.",watch:true,
      cam:{tx:5600,ty:900,tz:0,dist:6500,yaw:-.35,pitch:.3},
      ok:w=>w.eval("S.cnt.good>=20")}],
  P:[{t:"포장실 설비 일괄 ON",btn:"포장실 설비 ON",d:"턴테이블 · 라벨 인쇄기 · 비전 PC · 라벨러 · 설명서 부착기 · 중량선별기(지시서 중량 세팅) · 집합 포장 PC 를 한 번에 켭니다. 첫 인쇄 대조 · 시료 시험은 시연에서 생략합니다.",
      cam:{tx:12800,ty:900,tz:0,dist:8000,yaw:-.35,pitch:.34},
      act:()=>{ PS_ACT.allOn(); PC.firstOk=PC.sampleOk=PC.rejOk=true; },
      ok:()=>psOn()},
     {t:"포장 진행 관찰",d:"라벨 → 비전 → 설명서 → 중량선별 → 판독 → 박스 AG 라벨 → 박스 포장 → 파렛트 적재. 작업자 1 · 2 는 자동입니다. 박스 1 개가 파렛트에 올라가면 시연 완료.",watch:true,
      cam:{tx:18500,ty:900,tz:400,dist:7000,yaw:-.3,pitch:.32},
      ok:()=>PS.pallet>=1}]
};
const demobOn=r=>CREW.mode==="demo"&&!CREW.inc&&CREW.started[r==="F"?"F":"P"];
function demobStart(r){ const k=r==="F"?"F":"P"; DEMOB.i[k]=0; DEMOB.res[k]=false; if(k==="F"){ try{ appWin().B3_DEMO_STEP=true; }catch(e){} } }
function demobCam(st){ if(V3B.view==="orbit"&&st.cam) Object.assign(V3B.orbit,st.cam); }
function demobAct(k){ const L=DEMOB_STEPS[k], st=L[DEMOB.i[k]]; if(!st||!st.act) return; try{ st.act(appWin()); }catch(e){ console.error("시연",e); } demobCam(st); }
/* 진행 (0.25 초마다) : 조건을 만족하면 다음 단계 · 다음 단계 구역으로 카메라 */
function demobTick(){
  for(const k of ["F","P"]){ if(!demobOn(k==="F"?"F":"P1")) continue; const L=DEMOB_STEPS[k], st=L[DEMOB.i[k]]; if(!st) continue;
    let ok=false; try{ ok=st.ok(appWin()); }catch(e){} if(ok){ DEMOB.i[k]++; const nx=L[DEMOB.i[k]]; if(nx&&(CREW.cur==="F")===(k==="F")) demobCam(nx); if(!nx&&!DEMOB.res[k]){ DEMOB.res[k]=true; demobResult(k); } } }
  demobCoach();
}
function demobHtml(k){   /* 공통 시연 안내판 (idt_common/modes.js) */
  return idtDemoHtml(k==="F"?"충전실":"포장실 · "+(PS.rx?"전문의약품 (작업자 2명 자동)":"일반의약품 (작업자 1명 자동)"),DEMOB_STEPS[k],DEMOB.i[k],
    k==="F"?"계속 자동 생산합니다. 상단 [포장실] 로 포장 라인도 볼 수 있습니다.":"완성 박스 "+PS.pallet+" · 계속 자동 포장합니다.").replace('data-dm-act="1"','data-dm="'+k+'"'); }
/* 시연 완료 : 공통 결과 창 (파우치와 같음) */
function demobResult(k){ let good=0; try{ good=appWin().eval("S.cnt.good"); }catch(e){}
  idtDemoResult({room:k==="F"?"충전실 작업자":"포장실 작업자", flow:k==="F"?"충전실 전원 → 자재 투입 → 라인 가동 → 생산(양품 20 병)":"포장실 설비 ON → 라벨 · 비전 · 설명서 · 중량선별 · 판독 → 박스 포장 → 파렛트 적재",
    kpis:k==="F"?[[good+" 병","양품 (캡핑 완료)","hi"]]:[[PS.pallet+" 박스","완성 박스","hi"],[PS.lab.cnt+" 병","라벨 부착"],[PS.cw.pass+" 병","중량 PASS"]], again:bRestart, home:goHome}); }
function demobCoach(){
  const e=$("#dmCoach"), isFree=CREW.cur==="F"&&FREEB.on&&CREW.mode==="free"&&!CREW.inc, on=isFree||(CREW.cur==="F"&&demobOn("F"));
  if(!on){ e.hidden=true; return; }
  let rc=null; try{ const c=appWin().document.getElementById("coach"); if(c) rc=c.getBoundingClientRect(); }catch(x){}
  if(!rc||rc.width<50){ e.hidden=true; return; } const fr=APP_FR.getBoundingClientRect(), s=$("#stage").getBoundingClientRect();
  e.hidden=false; Object.assign(e.style,{left:(fr.left-s.left+rc.left)+"px",top:(fr.top-s.top+rc.top)+"px",width:rc.width+"px",minHeight:rc.height+"px"});
  const h=isFree?idtFreeHtml("충전실",""):demobHtml("F"); if(e.dataset.h!==h){ e.dataset.h=h; e.innerHTML=h; } }
addEventListener("click",ev=>{ const t=ev.target&&ev.target.closest, b=t&&ev.target.closest("[data-dm]"), f=t&&ev.target.closest("[data-free]"); if(b) demobAct(b.dataset.dm); if(f) freeBtn(f.dataset.free); });
/* 자유모드 [▶ 정상 운전 상태로] [■ 전체 OFF 초기화] (파우치와 같음) */
function freeBtn(a){ if(!FREEB.on) return; const F=CREW.cur==="F";
  if(F){ const w=appWin(); try{ if(a==="run"){ for(const st of DEMOB_STEPS.F) if(st.act) st.act(w); } else { w.startSession("guide"); w.hintOn=false; } }catch(e){ console.error("자유모드",e); } }
  else if(a==="run"){ PS_ACT.allOn(); PC.firstOk=PC.sampleOk=PC.rejOk=true; PS.auto.w1=true; PS.auto.w2=true; }
  else { pcStart(CREW.pRole||"P1","free",true,CREW.rx); }
  fpcToast(a==="run"?(F?"충전실":"포장실")+" 설비 ON · 라인 정상 운전":(F?"충전실":"포장실")+" 전체 OFF · 초기 상태"); pcRender(); }
