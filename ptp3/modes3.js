/* ═══════════════════════════════════════════════════════════════════
   자유모드 · 시연모드 (P4 · 파우치 방식)
   · 공통 : 앱 과정은 가동(operation) · 심화 학습으로 열어 두고, 앱의 단계 안내 자리를 셸 안내판으로 덮음
   · 시연 : 작업자(실)마다 3단계 — ① 설비 준비 일괄 ② 가동 START ③ 생산 보기 (평가 없음)
   · 자유 : 순서 · 감점 · 평가 없음, 기동 조건(인터락) 해제(실제와 다름 · 앱 startChecks 비움), [정상 운전 상태로] · [정지]
   ═══════════════════════════════════════════════════════════════════ */
const MODE3={kind:null};
const api3=r=>{ const w=UNI_HUB.win(APPK[r]); return w&&w.ROOM_API; };
const DEMO3={
  F:[{t:"충전기 준비 일괄",d:"로그인 · 메인 전원 · 압축공기 · 냉동기 · 교체부품 · 성형필름 · 커버포일 · 제품 투입 · 자동설정까지 한 번에 준비합니다.",act:r=>api3(r).ready(),ok:r=>{ try{ return !UNI_HUB.win("filler").eval("startChecks().filter(c=>!c.ok).length"); }catch(e){ return true; } }},
     {t:"충전기 가동 (START)",d:"START 를 눌러 자동 운전을 시작합니다. 성형 → 충전 → 실링 → 펀칭 순서로 블리스터 팩이 나옵니다.",act:r=>crs("filler").start(),ok:r=>api3(r).running()},
     {t:"생산 보기 — 양품 300 팩",d:"양품 팩이 연결 컨베이어로 포장실에 넘어갑니다. 300 팩이 되면 시연을 마칩니다.",act:null,ok:r=>api3(r).good()>=300}],
  P:[{t:"포장라인 준비 일괄",d:"메인 전원 · 압축공기 · 진공 펌프 · 교체부품 · 카톤 · 설명지 · 박스 · 팔레트 · 중량선별기 교정까지 한 번에 준비합니다.",act:r=>api3(r).ready(),ok:r=>{ try{ return !UNI_HUB.win("line").eval("startChecks().filter(c=>!c.ok).length"); }catch(e){ return true; } }},
     {t:"포장라인 가동 (START)",d:"START 를 눌러 카토너 → 카톤 인쇄 → 중량선별 → 박스포장 → 팔렛타이저를 가동합니다.",act:r=>crs("line").start(),ok:r=>api3(r).running()},
     {t:"생산 보기 — 카톤 60",d:"카톤이 박스에 담겨 팔레트에 적재됩니다. 60 카톤이 되면 시연을 마칩니다.",act:null,ok:r=>api3(r).cartons()>=60}]
};
const DSTEP={F:0,P:0};
function mode3Start(r){
  const c=crs(APPK[r]); try{ c.begin("operation","guide"); if(r==="F") setTimeout(()=>{ try{ c.quickStart(); }catch(e){} },150); }catch(e){ console.error(e); }
  setTimeout(()=>mode3Apply(r),700);
}
function mode3Apply(r){
  const w=UNI_HUB.win(APPK[r]); if(!w) return; const d=w.document;
  if(!d.getElementById("mode3css")){ const st=d.createElement("style"); st.id="mode3css"; st.textContent="body.mode3 #coach>*{visibility:hidden}body.mode3 .hint,body.mode3 .hintNow{outline:none!important}body.mode3 #guideArrow{display:none!important}"; d.head.appendChild(st); }
  d.body.classList.add("mode3");
  if(MODE3.kind==="free"){ try{ if(!w.__sc0){ w.__sc0=w.startChecks; w.__dd0=w.deduct; } w.startChecks=function(){ return []; }; w.deduct=function(){}; w.FREE3=true; }catch(e){ console.error("인터락 해제",e); } }   /* 자유 : 기동 조건 · 감점 없음 */
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
  if(MODE3.kind==="free"){
    el.className="free"; const k='<div class="t"><small>자유모드 · '+ROOM_NM[r]+'</small><b>순서 · 감점 · 평가 없음 — 무엇이든 조작해 보세요</b><span>기동 조건(인터락)이 해제되어 있습니다 (실제와 다름). 상단 작업자 버튼으로 다른 작업장으로 바꿉니다.</span></div>'+
      '<div class="b"><button data-f="run">▶ 정상 운전 상태로</button><button data-f="stop">■ 정지</button></div>';
    if(el.dataset.k!==k+r){ el.dataset.k=k+r; el.innerHTML=k; el.querySelector('[data-f="run"]').onclick=()=>{ try{ api3(r).ready(); setTimeout(()=>crs(APPK[r]).start(),300); }catch(e){ console.error(e); } };
      el.querySelector('[data-f="stop"]').onclick=()=>{ try{ api3(r).stop(); }catch(e){ console.error(e); } }; }
    return;
  }
  const L=DEMO3[r]; let i=DSTEP[r]; while(i<L.length&&L[i].ok(r)&&(L[i].act||i===L.length-1?true:true)) { if(i===L.length-1) break; i++; } DSTEP[r]=i;
  const st=L[i], done=i===L.length-1&&st.ok(r);
  const k='<div class="t"><small>시연모드 · '+ROOM_NM[r]+' · '+(i+1)+' / '+L.length+'</small><b>'+(done?"시연 완료":st.t)+'</b><span>'+(done?"상단 작업자 버튼으로 다른 작업장 시연을 이어서 볼 수 있습니다.":st.d)+'</span></div>'+
    (st.act&&!st.ok(r)?'<div class="b"><button data-f="act">▶ 시연 실행</button></div>':'');
  if(el.dataset.k!==k){ el.dataset.k=k; el.className="demo"; el.innerHTML=k; const b=el.querySelector('[data-f="act"]'); if(b) b.onclick=()=>{ try{ st.act(r); }catch(e){ console.error(e); } }; }
}
