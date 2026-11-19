/* ═══════════════════════════════════════════════════════════════════
   자유모드 · 시연모드 (P4 · 파우치 방식)
   · 공통 : 앱 과정은 가동(operation) · 심화 학습으로 열어 두고, 앱의 단계 안내 자리를 셸 안내판으로 덮음
   · 시연 : 작업자(실)마다 3단계 — ① 설비 준비 일괄 ② 가동 START ③ 생산 보기 (평가 없음)
   · 자유 : 순서 · 감점 · 평가 없음, 기동 조건 해제(실제와 다름) — 단 전원 · 공압 · 안전문 · 비상정지 · 알람 RESET 은 실제처럼(11/18 중간안), 운전 중 안전문을 열면 인터락 정지(E020).
            단 메인 전원 · 압축공기 · 진공 같은 동력은 실제처럼 필요(P6 현실성 점검 — 전원 없이 운전되던 것 삭제), [정상 운전 상태로] · [정지]
   ═══════════════════════════════════════════════════════════════════ */
const MODE3={kind:null};
const api3=r=>{ const w=UNI_HUB.win(APPK[r]); return w&&w.ROOM_API; };
const DEMO3={
  F:[{t:"충전기 준비 일괄",btn:"충전기 준비 일괄",d:"로그인 · 메인 전원 · 압축공기 · 냉동기 · 교체부품 · 성형필름 · 커버포일 · 제품 투입 · 자동설정까지 한 번에 준비합니다.",act:r=>api3(r).ready(),ok:r=>{ try{ return !UNI_HUB.win("filler").eval("startChecks().filter(c=>!c.ok).length"); }catch(e){ return true; } }},
     {t:"충전기 가동 (START)",btn:"충전기 가동",d:"START 를 눌러 자동 운전을 시작합니다. 성형 → 충전 → 실링 → 펀칭 순서로 블리스터 팩이 나옵니다.",act:r=>crs("filler").start(),ok:r=>api3(r).running()},
     {t:"생산 보기 — 양품 300 팩",d:"양품 팩이 연결 컨베이어로 포장실에 넘어갑니다. 300 팩이 되면 시연을 마칩니다.",act:null,ok:r=>api3(r).good()>=300}],
  P:[{t:"포장라인 준비 일괄",btn:"포장라인 준비 일괄",d:"메인 전원 · 압축공기 · 진공 펌프 · 교체부품 · 카톤 · 설명지 · 박스 · 팔레트 · 중량선별기 교정까지 한 번에 준비합니다.",act:r=>api3(r).ready(),ok:r=>{ try{ return !UNI_HUB.win("line").eval("startChecks().filter(c=>!c.ok).length"); }catch(e){ return true; } }},
     {t:"포장라인 가동 (START)",btn:"포장라인 가동",d:"START 를 눌러 카토너 → 카톤 인쇄 → 중량선별 → 박스포장 → 팔렛타이저를 가동합니다.",act:r=>crs("line").start(),ok:r=>api3(r).running()},
     {t:"생산 보기 — 카톤 60",d:"카톤이 박스에 담겨 팔레트에 적재됩니다. 60 카톤이 되면 시연을 마칩니다.",act:null,ok:r=>api3(r).cartons()>=60}]
};
const DSTEP={F:0,P:0}, DRES={F:false,P:false};
function mode3Start(r){
  const c=crs(APPK[r]); try{ c.begin("operation","guide"); if(r==="F") setTimeout(()=>{ try{ c.quickStart(); }catch(e){} },150); }catch(e){ console.error(e); }
  setTimeout(()=>mode3Apply(r),700);
}
/* 자유모드 중간안 (11/18 사용자 결정 · 세 IDT 통일) : 비상정지 · 전원과 공압(서보 파워) · 안전문 · 진공 펌프 · 미해제 알람은 실제처럼 확인, 나머지 기동 조건 해제 */
const FREE3_KEEP=["E000","E013","E020","E021"];
function mode3Apply(r){
  const w=UNI_HUB.win(APPK[r]); if(!w) return; const d=w.document;
  if(!d.getElementById("mode3css")){ const st=d.createElement("style"); st.id="mode3css"; st.textContent="body.mode3 #coach>*{visibility:hidden}body.mode3 .hint,body.mode3 .hintNow{outline:none!important}body.mode3 #guideArrow{display:none!important}"; d.head.appendChild(st); }
  d.body.classList.add("mode3");
  if(MODE3.kind==="free"){ try{ if(!w.__sc0){ w.__sc0=w.startChecks; w.__dd0=w.deduct; w.__al0=w.alarm; } w.startChecks=function(){ return w.__sc0().filter(c=>FREE3_KEEP.includes(c.k)); }; w.deduct=function(){}; w.alarm=w.__al0; w.FREE3=true;
      }catch(e){ console.error("인터락 해제",e); } }   /* 자유 : 기동 조건 · 감점 없음 */
}
/* 셸 안내판 : 앱 단계 안내 자리에 겹침 */
function mode3Coach(){
  const el=$("#shCoach"); if(!MODE3.kind||!CREW.cur){ el.hidden=true; return; }
  let rc=null; try{ const c=UNI_HUB.win(APPK[CREW.cur]).document.getElementById("coach"); if(c) rc=c.getBoundingClientRect(); }catch(e){}
  if(MODE3.kind==="inc"){ const q=$("#cv").getBoundingClientRect(), s=$("#stage").getBoundingClientRect(); el.hidden=false;
    Object.assign(el.style,{left:(q.left-s.left+q.width*.18)+"px",top:(q.top-s.top+10)+"px",width:(q.width*.64)+"px",minHeight:"0"}); inc3Coach(el,CREW.cur); return; }
  if(!rc||rc.width<50){ el.hidden=true; return; } el.hidden=false;
  Object.assign(el.style,{left:rc.left+"px",top:rc.top+"px",width:rc.width+"px",minHeight:rc.height+"px"});
  const r=CREW.cur;
  if(MODE3.kind==="free"){   /* 공통 자유모드 안내 (idt_common/modes.js) */
    el.className="free"; const k=idtFreeHtml(ROOM_NM[r],"",true);
    if(el.dataset.k!==k+r){ el.dataset.k=k+r; el.innerHTML=k; el.querySelector('[data-free="run"]').onclick=()=>{ try{ api3(r).ready(); setTimeout(()=>crs(APPK[r]).start(),300); }catch(e){ console.error(e); } };
      el.querySelector('[data-free="off"]').onclick=()=>{ try{ api3(r).stop(); }catch(e){} mode3Start(r); fpcToast(ROOM_NM[r]+" 전체 OFF · 초기 상태"); }; }
    return;
  }
  /* 시연 (공통 안내판 · 단계 버튼식) : 조건을 만족한 단계는 넘김 · 마지막 단계까지 끝나면 공통 결과 창 */
  const L=DEMO3[r]; let i=DSTEP[r]; while(i<L.length&&L[i].ok(r)) i++; DSTEP[r]=i;
  const k=idtDemoHtml(ROOM_NM[r],L,i,"계속 자동 생산합니다. 상단 작업자 버튼으로 다른 작업장 시연을 이어서 볼 수 있습니다.",true);
  if(el.dataset.k!==k){ el.dataset.k=k; el.className="demo"; el.innerHTML=k; const b=el.querySelector('[data-dm-act]'); if(b) b.onclick=()=>{ const st=DEMO3[r][DSTEP[r]]; try{ st&&st.act&&st.act(r); }catch(e){ console.error(e); } }; }
  if(i>=L.length&&!DRES[r]){ DRES[r]=true; idtDemoResult({room:ROOM_NM[r], flow:r==="F"?"충전기 준비 → 충전기 가동 → 생산(양품 300 팩)":"포장라인 준비 → 포장라인 가동 → 생산(카톤 60)",
    kpis:r==="F"?[[(api3(r).good()||0).toLocaleString()+" 팩","양품 팩","hi"]]:[[(api3(r).cartons()||0).toLocaleString()+" 카톤","양품 카톤","hi"]], again:ptp3Restart, home:goHome}); }
}
