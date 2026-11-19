/* ═══════════════════════════════════════════════════════════════════
   시연모드 (11/16 사용자 지시) — 기본모드보다 훨씬 간단 : 라인 클리어런스 · 문서 · 점검 단계 없음
   ① 충전기 전원 ON(일괄) → ② 포장실 설비 전원 ON(카토너 일괄) → ③ 진공 이송기 ON(원료 공급) → ④ 포장 라인 가동 → ⑤ 충전기 가동 → ⑥ 생산 · 수동 포장(대케이스 · 대박스 · 파렛트)
   단계마다 [시연 실행] 버튼 하나 · 카메라가 해당 구역으로 이동 · 평가 없음
   ═══════════════════════════════════════════════════════════════════ */
const isDemo=()=>!!S&&S.mode==="demo";
const DEMO_GOAL=48;   /* 수동 포장 완료 기준 카톤 수 (대케이스 6개 = 대박스 1개 반 · 파렛트 적재까지 보이도록) */
function stepsDemo(){
  const f=()=>S.f, p=()=>S.p, D=(k,t,d,btn,pos,cam,act,ok)=>T_(k,t,d,()=>"#demoAct",ok,{pts:1,btn,pos,cam,demoAct:act});
  const L=[
    D("dPowF","충전기 전원 ON (일괄)","버튼 한 번으로 메인 파워 · 압축공기 · 집진 · 컨트롤 판넬 · 터치스크린 로그인까지 켭니다. 히터 예열은 시연에서 생략합니다.","충전기 전원 ON",ANC.mainPow,"fill",
      ()=>act("power",()=>{ Object.assign(S.f,{main:true, airV:[true,true], airP:6, dustV:true, panel:true, user:"PK2", heat:S.f.heatSV}); toast("충전기 전원 일괄 ON — 메인 · 에어 · 집진 · 판넬 · 로그인","good"); }),
      ()=>f().panel&&!!f().user),
    D("dPowP","포장실 설비 전원 ON (카토너 일괄)","카토너 메인스위치를 켜면 스틱공급장치 · 핫멜트 · 케이스 프린터 · 비전 · X-ray · 중량선별기까지 함께 켜지고 품목 설정이 불러와집니다.","카토너 · 포장실 전원 ON",ANC.ctMain,"pack",
      ()=>act("ctBack",()=>{ Object.assign(S.p,{ctMain:true, sfSw:true, ctAir:true, hm:true, hmT:172, cwPow:true, xrPow:true, xrBoot:1, xrKey:true, prMain:true, prPow:true, ctUser:true, sfUser:true, vsUser:true, vsMode:true,
          xrPre:true, xrX:true, xrCal:true, xrTest:true, cwProd:true, cwChk:true, mag:9999, leaf:9999, ctIcon:true, ctIcons:[true,true,true]}); S.p.lbl={lot:EXPECT.lot, exp:EXPECT.exp, saved:true, loaded:true}; S.flags.hmChk=true;
          toast("포장실 설비 일괄 ON — 카토너 · 스틱공급장치 · 핫멜트 · 프린터 · 비전 · X-ray · 중량선별기","good"); }),
      ()=>p().ctMain&&p().ctUser&&p().cwPow),
    D("dIbc","진공 이송기 ON (원료 공급)","이송기 1(첨가제) · 3(백당)을 켜서 호퍼에 원료를 보냅니다. 주성분 공급 · 은박 장착 · 인쇄 설정은 시연에서 미리 된 상태로 둡니다.","진공 이송기 ON",ANC.ibc,"back",
      ()=>{ Object.assign(S.f,{ibc:[true,false,true], mainLift:true, mainFed:true, roll:"red", jogDone:true, printOk:true, visChk:true, vision:true, tempChk:true, regChk:true, hopChk:true}); S.f.prn={exp:EXPECT.exp, lot:EXPECT.lot, saved:true}; S.hop={add:100, main:100, sug:100};
        hMach="fl"; hScr="xfer"; drawHMI(); toast("진공 이송기 1 · 3 ON — 첨가제 · 백당 공급 (호퍼 3기 충전)","good"); },
      ()=>f().ibc[0]&&f().ibc[2]),
    D("dPack","포장 라인 가동","스틱공급장치 · 카토너 · 프린터 · 비전 · X-ray · 중량선별기를 가동하고 정렬컨베어를 켭니다.","포장 라인 가동",ANC.ctPanel,"pack",
      ()=>{ Object.assign(S.p,{ctRun:true, sfServo:true, sfFeed:true, sfRun:true, vsRun:true, prRun:true, xrConv:true, cwRun:true, align:true}); toast("포장 라인 가동 — 스틱공급 · 카토너 · 프린터 · 비전 · X-ray · 중량선별","good"); },
      ()=>p().ctRun&&p().sfRun),
    D("dRun","충전기 가동 (RESET → RUN → FILLING ON)","후 공정 연동 상태에서 충전기를 가동하고 FILLING 을 켜서 충전을 시작합니다.","충전기 가동",ANC.panel,"front",
      ()=>{ Object.assign(S.f,{link:true, linkChk:true, door:"closed", run:true, started:true, filling:true}); S.p.align=true; S.alarms=[]; hMach="fl"; hScr="run"; drawHMI(); toast("충전기 RESET → RUN → FILLING ON — 충전 시작","good"); },
      ()=>f().run&&f().filling),
    D("dWatch","생산 → 수동 포장 (대케이스 · 대박스 · 파렛트)","파우치가 정렬컨베어로 포장실에 넘어가 카톤 → 대케이스 → 대박스 → 파렛트까지 포장됩니다. "+DEMO_GOAL+"카톤이 되고 첫 대박스가 파렛트에 올라가면 시연을 마칩니다.","수동 포장 보기",ANC.boxing,"hand",
      ()=>{ camSet("hand"); toast("수동 포장 구역 — 대케이스 포장 → 대박스 테이핑 → 파렛트 적재","good"); S.flags.demoWatch=true; },
      ()=>S.flags.demoWatch&&S.cnt.good>=DEMO_GOAL&&(typeof MP=="undefined"||!MP.palB||!R3.gl||MP.palB.count>=1)),   /* 3D : 첫 대박스가 파렛트에 올라갈 때까지 (V20 포장실 상태 연동) */
    D("dWatchF","생산 → 포장실로 이송","충전된 파우치가 슈트 → 배출 컨베이어 → 벽 개구부를 지나 포장실로 넘어갑니다. "+DEMO_GOAL+"카톤 분량("+DEMO_GOAL*6+"포)이 넘어가면 시연을 마칩니다.","생산 보기",ANC.chute,"conv",
      ()=>{ S.flags.demoWatch=true; toast("배출 컨베이어 → 포장실 이송 — 정렬컨베어 경사 구간","good"); },
      ()=>S.flags.demoWatch&&S.cnt.toPack>=DEMO_GOAL*6)
  ], K=k=>L.find(s=>s.k===k);
  /* 작업자(실)마다 시연 단계 (11/17 사용자 지시) — 다른 실 설비는 자동 운전 상태 */
  return S.room==="P"?[K("dPowP"),K("dPack"),K("dWatch")]:[K("dPowF"),K("dIbc"),K("dRun"),K("dWatchF")];
}
/* 코치 패널의 [시연 실행] 버튼 */
function demoCoach(st){
  let b=$("#demoAct"); if(!b){ const lc=$("#lcCheck"); if(!lc) return; lc.insertAdjacentHTML("afterend",'<button id="demoAct" style="display:none"></button>'); b=$("#demoAct"); b.onclick=()=>{ const s=curStep(); if(s&&s.demoAct&&isDemo()){ if(s.cam&&!cam.fp) camSet(s.cam); s.demoAct(); setTimeout(stepCheck,50); } }; }
  const on=isDemo()&&st&&st.demoAct&&!((st.k==="dWatch"||st.k==="dWatchF")&&S.flags.demoWatch);
  b.style.display=on?"":"none"; if(on) b.textContent="▶ "+st.btn;
  if(isDemo()&&st&&st.k==="dWatchF"&&S.flags.demoWatch) $("#cStep").textContent="시연 · 포장실로 이송 "+S.cnt.toPack+" / "+DEMO_GOAL*6+" 포";
  if(isDemo()&&st&&st.k==="dWatch"&&S.flags.demoWatch) $("#cStep").textContent="시연 · 생산 "+S.cnt.good+" / "+DEMO_GOAL+" 카톤 · 대케이스 "+S.cnt.cases+" 개";
}
function showDemoResult(){   /* 공통 결과 창 (idt_common/modes.js) */
  idtDemoResult({room:CREW_RNM[S.room], flow:S.room==="P"?"포장실 설비 전원 → 포장 라인 가동 → 수동 포장(대케이스 · 대박스 · 파렛트)":"충전기 전원 → 진공 이송기 → 충전기 가동 → 포장실 이송",
    kpis:[[S.cnt.pouch.toLocaleString()+" 포","충전 파우치","hi"],[S.cnt.good+" 카톤","양품 카톤"],[S.cnt.cases+" 개","대케이스"]], again:()=>demoStart(S.room), home:goHome});
}
function demoStart(room){ room=room||"F"; $("#splash").classList.add("hide"); startSession("demo",room); toast((typeof CREW_RNM!=="undefined"?CREW_RNM[room]:room)+" · 시연모드 — [▶ 시연 실행] 버튼을 차례로 누르세요"); }   /* 11/17 : 작업자 선택 · 1인칭 시작 */
function demoInit(){ const b=$("#spDemo"); if(b) b.onclick=demoStart; }
