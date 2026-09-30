/* ═══════════════════════════════════════════════════════════════════
   교육 과정 — 가동 모드 (기본 · 심화) · 학습/평가 동일 절차(안내 유무만 다름)
   ═══════════════════════════════════════════════════════════════════ */
const isExam=()=>!!S&&(S.mode==="exam"||S.mode==="examEasy");
const isEasy=()=>!!S&&(S.mode==="easy"||S.mode==="examEasy");
const MODE_NM={easy:"기본모드 · 학습",guide:"심화모드 · 학습",examEasy:"기본모드 · 평가",exam:"심화모드 · 평가",demo:"시연 모드"};
const PASS=80;

/* ── 라인 클리어런스 5항목 ── */
const CLEAR=[
  {t:"이전 제품 · 잔류 정제 제거 확인", d:"DMC-60T 호퍼 · 진동 트레이 · 게이트 · 노즐에 이전 품목 정제가 남아 있지 않은지 확인합니다.", at:[436,AISLE-300], look:[416,1450,-400]},
  {t:"이전 용기 · 캡 · 포장자재 제거 확인", d:"UA-120 호퍼 · 턴테이블, 캡 호퍼, 실리카겔 · PE 필름 릴에 이전 자재가 없는지 확인합니다.", at:[-4600,AISLE-300], look:[-4760,1000,-200]},
  {t:"접촉부 청소 상태 확인", d:"트레이 · 노즐 · 슈트 · 스타휠 · 컨베이어 가이드의 청소 상태(청소 완료 표시)를 확인합니다.", at:[5688,AISLE-300], look:[5738,1100,-300]},
  {t:"리젝트 트레이 · 집적 테이블 잔품 확인", d:"리젝트 트레이와 집적 테이블에 이전 로트의 병이 남아 있지 않은지 확인합니다.", at:[L.rej+40,AISLE-200], look:[L.rej,800,380]},
  {t:"작업지시 · 품목 · 라인 상태 확인", d:"작업지시서의 품목 · 포장단위 · 병 규격과 라인 표시(품목 식별표)가 일치하는지 확인합니다.", at:[L.lc2+420,AISLE-250], look:[L.lc2+420,1650,-150]}
];

/* ── 단계 정의 ── */
const T_=(k,t,d,plan,ok,o)=>Object.assign({k,t,d,plan,ok},o||{});
function stepsOperation(easy){
  const A=[];
  if(S&&S.mode==="demo"){ A.push(T_("demo","시연 운전","라인 전체 자동 가동",()=>null,()=>false,{pts:0,watch:true})); return A; }
  CLEAR.forEach((c,i)=>A.push(T_("lc"+i,"라인 클리어런스 ("+(i+1)+"/5) — "+c.t,c.d,()=>"#lcCheck",()=>S.clear.includes(i),{lc:i,pts:2})));
  A.push(T_("air","압축공기 공급","유틸리티의 [압축공기] 를 켜서 라인에 6 bar 를 공급합니다. 5.5 bar 이상이 되면 다음 단계로 넘어갑니다.",()=>S.air?null:"#uAir",()=>S.air&&S.airP>=5.5,{pts:3}));
  A.push(T_("main","메인 전원 투입","[메인 전원] 을 켭니다. 6기종 HMI 가 부팅됩니다.",()=>"#uMain",()=>S.main,{pts:3}));
  if(!easy) A.push(T_("dust","집진기 가동","[집진기] 를 켭니다. 계수기의 정제 분진을 흡입해 센서창 오염을 막습니다.",()=>"#uDust",()=>S.dust,{pts:3}));
  A.push(T_("login","HMI 로그인","HMI 의 열쇠 아이콘을 눌러 로그인합니다. (PK2 / 1234 · SUPERVISOR)",()=>S.user?null:(lgOpen?"#lgOk":"#lgKey"),()=>!!S.user,{pts:4,hmi:true}));
  A.push(T_("recipe","레시피 적용 (DMC-60T)","DMC-60T 주화면의 [레시피 적용] 을 누릅니다. 계수 · 병 규격 · 기준 중량 · 허용오차가 라인 전체에 설정됩니다.",()=>hmiRoute("dmc","main",HB("dmc_recipe")),()=>S.recipeApplied,{pts:5,hmi:true}));
  if(easy){
    A.push(T_("mat","자재 일괄 투입","빈 병 · 실리카겔 롤 · 정제 · PE 필름 롤 · 캡 을 차례로 투입합니다. 작업자가 각 설비로 가서 보충합니다.",
      ()=>{ for(const [k,id] of [["bottle","#mBottle"],["gel","#mGel"],["tab","#mTab"],["film","#mFilm"],["cap","#mCap"]]) if(S.mat[k]<=0) return id; return null; },
      ()=>S.mat.bottle>0&&S.mat.gel>0&&S.mat.tab>0&&S.mat.film>0&&S.mat.cap>0,{pts:10}));
  }else{
    A.push(T_("mBottle","빈 병 투입 (UA-120 호퍼)","[빈 병] 을 눌러 UA-120 호퍼에 빈 병을 투입합니다.",()=>"#mBottle",()=>S.mat.bottle>0,{pts:3}));
    A.push(T_("mGel","실리카겔 롤 장착 (SG-120)","[실리카겔 롤] 을 눌러 SG-120 릴에 파우치 롤을 장착합니다.",()=>"#mGel",()=>S.mat.gel>0,{pts:3}));
    A.push(T_("mTab","정제 투입 (DMC-60T 호퍼)","[정제 투입] 을 눌러 계수기 호퍼에 정제를 투입합니다.",()=>"#mTab",()=>S.mat.tab>0,{pts:3}));
    A.push(T_("mFilm","PE 필름 롤 장착 (HPE-100)","[PE 필름 롤] 을 눌러 HPE-100 에 필름 롤을 장착합니다.",()=>"#mFilm",()=>S.mat.film>0,{pts:3}));
    A.push(T_("mCap","캡 투입 (RCS-120 호퍼)","[캡 투입] 을 눌러 캡 호퍼에 캡을 투입합니다.",()=>"#mCap",()=>S.mat.cap>0,{pts:3}));
    A.push(T_("uaWash","UA-120 세척 설정","UA-120 주화면에서 [이온 에어] 와 [진공 흡입] 을 켭니다. 뒤집힌 병 입구를 에어로 불고 진공으로 빨아냅니다.",
      ()=>hmiRoute("ua","main",HB(S.ua.air?"ua_vac":"ua_air")),()=>S.ua.air&&S.ua.vac,{pts:4,hmi:true}));
  }
  A.push(T_("zero","중량선별 로드셀 영점","중량선별 주화면에서 [전단 영점] 과 [후단 영점] 을 누릅니다. 로드셀 위에 병이 없어야 합니다.",
    ()=>hmiRoute("wc","main",HB(S.wc.zero[0]?"wc_zero2":"wc_zero1")),()=>S.wc.zero[0]&&S.wc.zero[1],{pts:6,hmi:true}));
  if(!easy){
    A.push(T_("wcStd","중량 기준 확인","중량선별 주화면의 기준 순중량 · 허용오차 · 빈병 기준을 확인하고 [기준 확인] 을 누릅니다.",()=>hmiRoute("wc","main",HB("wc_check")),()=>S.wc.checked,{pts:4,hmi:true}));
    A.push(T_("dmcChk","계수기 진동 · 계수 설정 확인","DMC-60T 주화면의 [진동·계수 확인] 을 누릅니다. 1단 < 2단 < 3단 진동, 게이트 지연을 확인합니다.",()=>hmiRoute("dmc","main",HB("dmc_check")),()=>S.dmc.checked,{pts:4,hmi:true}));
  }
  A.push(T_("peSensor","HPE-100 필름 센서 확인","HPE-100 주화면에서 [필름 센서] 가 켜져 있는지 확인합니다. 필름이 떨어지면 센서가 감지해 정지합니다 (톱날 커터 · 가열 없음).",
    ()=>S.pe.sensor?null:hmiRoute("pe","main",HB("pe_sensor")),()=>S.pe.sensor&&S.user,{pts:3,hmi:true}));
  if(!easy) A.push(T_("torque","캡핑 토크 확인","RCS-120 주화면의 [토크 확인] 을 누릅니다. 캡 규격별 권장 토크 범위인지 확인합니다.",()=>hmiRoute("rc","main",HB("rc_check")),()=>S.rcp.checked,{pts:4,hmi:true}));
  A.push(T_("start","자동 운전 START","기동 조건(전원 · 공압 · 안전문 · 로그인 · 레시피 · 자재)을 확인하고 [START] 를 누릅니다.",()=>"#swStart",()=>S.started,{pts:6}));
  A.push(T_("watch","운전 감시 · 연속 생산","목표 수량을 생산합니다. 중량 불합격 병은 리젝트되고, 알람이 나면 STOP → 원인 판단 → 조치 → RESET → START 로 대응합니다.",
    ()=>null,()=>S.cnt.good>=S.cnt.target,{pts:14,watch:true}));
  A.push(T_("stop","STOP — 운전 종료","목표 수량을 채웠으면 [STOP] 을 눌러 운전을 마칩니다.",()=>"#swStop",()=>!S.running&&S.cnt.good>=S.cnt.target&&S.flags.stopped,{pts:4}));
  if(!easy){
    A.push(T_("logout","HMI 로그아웃","HMI 의 자물쇠 아이콘을 눌러 로그아웃합니다.",()=>"#icLock",()=>!S.user,{pts:2}));
    A.push(T_("off","메인 전원 차단","[메인 전원] 을 꺼서 라인을 정지 상태로 둡니다.",()=>"#uMain",()=>!S.main,{pts:2}));
  }
  return A;
}
let STEPS_CACHE=null;
function STEPS(){ if(!STEPS_CACHE) STEPS_CACHE=stepsOperation(isEasy()); return STEPS_CACHE; }
const curStep=()=>STEPS()[S.tIdx];

/* ═══ 세션 ═══ */
function startSession(mode){
  initState(); lineInit(); STEPS_CACHE=null;
  S.mode=mode; S.clear=[]; S.tIdx=0; S.stepLog=[]; S.deducts=[]; S.hintUsed=0;
  S.cnt.target=isEasy()?24:40;
  if(isEasy()){ S.dust=true; S.ua.air=true; S.ua.vac=true; S.dmc.checked=true; S.wc.checked=true; S.rcp.checked=true; }
  S.session={active:true, ended:false, start:performance.now(), sec:0};
  S.rc=recipeOf(SEL.prod,SEL.count,SEL.ml); S.bpm=bpmFor(S.rc.n); if(typeof syncBpm==="function") syncBpm();
  hMach="ua"; hScr="main"; lgOpen=false;
  if(isExam()) scheduleExamTrouble();
  if(S.mode==="demo") demoSetup();
  buildStatic(); camSet("all"); drawHMI(); renderCoach(); renderTiles();
  S.stepAt=tSim;
}
function stepCheck(){
  if(!S||!S.session||!S.session.active||S.session.ended) return;
  if(S.activeTrouble) { recoveryCheck(); return; }
  let guard=0;
  while(guard++<40){
    const st=curStep(); if(!st) break;
    let ok=false; try{ ok=!!st.ok(); }catch(e){}
    if(!ok) break;
    S.stepLog.push({k:st.k,t:st.t,i:S.tIdx,at:tSim,dt:tSim-S.stepAt,pts:st.pts||0});
    S.tIdx++; S.stepAt=tSim;
    if(S.tIdx>=STEPS().length){ finishSession(); return; }
  }
  renderCoach();
}
/* 감점 */
const PENALTY={startBad:["조건 미충족 START",5],login:["로그인 실패",2],wrong:["알람 원인 판단 오류",5],hint:["힌트 사용",5],doorRun:["운전 중 안전문 개방",5],emg:["비상정지 사용",2],runMat:["운전 중 자재 조작",3]};
function deduct(k,why){
  if(!S||!S.session||!S.session.active) return;
  const p=PENALTY[k]||[why||k,3];
  S.deducts.push({k,why:why||p[0],pts:p[1],at:tSim});
}
function scoreNow(){
  const A=STEPS(), tot=A.reduce((s,x)=>s+(x.pts||0),0);
  const got=S.stepLog.reduce((s,x)=>s+(x.pts||0),0);
  const minus=S.deducts.reduce((s,x)=>s+x.pts,0);
  if(!tot) return {base:0, minus, score:0};
  return {base:Math.round(got/tot*100), minus, score:Math.max(0,Math.round(got/tot*100)-minus)};
}
function finishSession(manual){
  if(!S.session||S.session.ended) return;
  S.session.ended=true; S.session.active=false; S.running=false;
  S.session.sec=(performance.now()-S.session.start)/1000;
  if(!manual&&typeof AP!=="undefined"&&AP.video){ for(const id of ["#mInc","#mList"]) $(id).classList.remove("on"); apOutro(); return; }
  for(const id of ["#mInc","#mList"]) $(id).classList.remove("on");
  if(typeof apStop==="function") apStop();
  showResult(manual);
}

/* ═══ 시험 모드 예정 알람 : 생산 중 1회 ═══ */
function scheduleExamTrouble(){
  const pool=["SG21","DM33","WC42","RC62","UA12","PE52"];
  S.flags.examTrouble={key:pool[Math.floor(Math.random()*pool.length)], at:6+Math.floor(Math.random()*6), fired:false};
}
function examTroubleTick(){
  const f=S.flags.examTrouble;
  if(!f||f.fired||!S.running||S.activeTrouble) return;
  if(S.cnt.filled>=f.at){ f.fired=true; launchIncident(f.key,true); }   /* 충전 병 수 기준 (후단 계량 전 병이 남아 있을 때) */
}

/* ═══ 알람 · 이상사례 대응 ═══
   흐름 : (운전 중이면) STOP → 원인 · 조치 판단(선택지) → 현장 조치 → RESET → START */
const INC={
  UA11:{nm:"빈 병 호퍼 소진", mk:"ua", fire(){ S.mat.bottle=0; LN.tt.n=0; raise("UA11"); },
    q:"UA-120 에서 병 공급이 끊겼습니다. 원인과 조치로 옳은 것은?", a:"빈 병 호퍼가 비었다 → 빈 병을 투입한다",
    w:["턴테이블 속도를 올린다","이온 에어를 끈다","DMC 레시피를 다시 적용한다"],
    fix:[{sel:"#mBottle",t:"[빈 병] 을 눌러 호퍼에 빈 병을 투입합니다.",done:()=>S.mat.bottle>0}]},
  UA12:{nm:"턴테이블 출구 병 걸림", mk:"ua", fire(){ S.ua.jam=true; raise("UA12"); },
    q:"턴테이블 출구에서 병이 나오지 않습니다. 올바른 조치는?", a:"STOP 후 안전문을 열고 걸린(넘어진) 병을 제거한 뒤 닫는다",
    w:["운전 중에 손을 넣어 병을 뺀다","라인 속도를 최대로 올린다","RESET 만 반복해서 누른다"],
    fix:[{sel:"#uDoor",t:"안전문을 엽니다.",done:()=>S.door==="open"},
         {fix:[-4760,960,-6],t:"턴테이블 출구의 넘어진 병을 제거합니다 (빨간 ! 누르기).",done:()=>!S.ua.jam,act(){ return startWork("bottle",()=>{S.ua.jam=false;},{stand:[-4700,630],reach:[-4760,980,-20],carry:null,view:"bottle",dur:2.4,door:"uaL",pour:false}); }},
         {sel:"#uDoor",t:"안전문을 닫습니다.",done:()=>S.door==="closed"}]},
  SG21:{nm:"실리카겔 파우치 소진", mk:"sg", fire(){ S.mat.gel=0; raise("SG21"); },
    q:"SG-120 이 정지했습니다 (파우치 소진). 올바른 조치는?", a:"새 실리카겔 롤을 장착하고 띠를 피드 롤러까지 걸어 준다",
    w:["실리카겔 없이 계속 생산한다","중량 허용오차를 넓힌다","PE 필름을 대신 넣는다"],
    fix:[{sel:"#mGel",t:"[실리카겔 롤] 을 눌러 새 롤을 장착합니다.",done:()=>S.mat.gel>0}]},
  SG22:{nm:"파우치 마크 미검출", mk:"sg", fire(){ S.sg.markBad=true; raise("SG22"); },
    q:"SG-120 마크 센서가 파우치 경계를 읽지 못합니다. 올바른 조치는?", a:"마크 센서 위치를 파우치 실링선에 맞추고 커터 원점을 잡는다",
    w:["센서를 끄고 운전한다","진동 강도를 올린다","로드셀 영점을 잡는다"],
    fix:[{fix:[L.sg,1300,170],t:"마크 센서 위치를 실링선에 맞춥니다 (빨간 ! 누르기).",done:()=>!S.sg.markBad,act(){ return startWork("gel",()=>{S.sg.markBad=false;},{stand:[L.sg+60,620],reach:[L.sg+60,1300,170],carry:null}); }},
         {sel:()=>hmiRoute("sg","main",HB("sg_home")),t:"SG-120 주화면에서 [커터 원점] 을 누릅니다.",done:()=>S.flags.sgHome,hmi:true,pre(){S.flags.sgHome=false;}}]},
  DM31:{nm:"정제 호퍼 레벨 부족", mk:"dmc", fire(){ S.mat.tab=Math.min(S.mat.tab,S.rc.n*4); raise("DM31"); },
    q:"DMC-60T 호퍼 레벨 경고입니다. 올바른 조치는?", a:"같은 로트의 정제를 호퍼에 보충한다",
    w:["다른 제품 정제를 섞어 넣는다","진동을 100 % 로 올린다","게이트를 열어 둔다"],
    fix:[{sel:"#mTab",t:"[정제 투입] 을 눌러 호퍼에 보충합니다.",done:()=>S.mat.tab>=S.rc.n*6}]},
  DM32:{nm:"센서창 오염", mk:"dmc", fire(){ for(let c=2;c<8;c++) S.dmc.dirt[c]=0.88; raise("DM32"); },
    q:"센서창 오염 경고와 함께 순중량 불합격이 늘었습니다. 원인과 조치는?", a:"정제 분진이 센서창을 덮어 계수 오차 발생 → STOP 후 센서창을 청소한다",
    w:["허용오차를 넓힌다","로드셀을 교체한다","진동 강도를 올린다"],
    fix:[{sel:()=>hmiRoute("dmc","main",HB("dmc_clean")),t:"DMC-60T 주화면의 [센서창 청소] 를 누릅니다.",done:()=>Math.max(...S.dmc.dirt)<=0.6,hmi:true},
         {sel:"#uDust",t:"집진기가 꺼져 있으면 켭니다.",done:()=>S.dust}]},
  DM33:{nm:"노즐 막힘 (정제 브리지)", mk:"dmc", fire(){ S.dmc.bridge=true; raise("DM33"); },
    q:"게이트가 열려도 정제가 병에 떨어지지 않습니다. 올바른 조치는?", a:"STOP 후 안전문을 열고 노즐의 정제 브리지를 제거한 뒤 닫는다",
    w:["게이트 지연을 0 으로 한다","노즐을 두드리며 운전한다","계수 설정을 줄인다"],
    fix:[{sel:"#uDoor",t:"안전문을 엽니다.",done:()=>S.door==="open"},
         {fix:[436,1150,60],t:"노즐의 정제 브리지를 제거합니다 (빨간 ! 누르기).",done:()=>!S.dmc.bridge,act(){ return startWork("tab",()=>{S.dmc.bridge=false; clearAlarm("DM33");},{stand:[436,440],reach:[436,1150,40],carry:null,dur:2.4,pour:false}); }},
         {sel:"#uDoor",t:"안전문을 닫습니다.",done:()=>S.door==="closed"}]},
  WC41:{nm:"중량 불합격 연속 3병 (로드셀 영점 틀어짐)", mk:"wc", wait:true, fire(){ S.wc.off[1]+=S.rc.netTol*2.6; S.wc.zero[1]=false; },
    q:"정상 계수인데도 순중량 불합격이 연속으로 발생해 정지했습니다. 원인과 조치는?", a:"후단 로드셀 영점이 틀어짐 → 로드셀 위 병이 없을 때 영점을 다시 잡는다",
    w:["허용오차를 두 배로 넓힌다","불합격 병을 양품으로 옮긴다","진동을 올려 속도를 높인다"],
    fix:[{sel:()=>hmiRoute("wc","main",HB("wc_zero2")),t:"중량선별 주화면에서 [후단 영점] 을 누릅니다.",done:()=>S.wc.zero[1]&&Math.abs(S.wc.off[1])<0.02,hmi:true}]},
  WC42:{nm:"리젝트 트레이 만량", mk:"wc", fire(){ S.reject.n=S.reject.cap; for(let i=LN.rejBin.length;i<S.reject.cap;i++) LN.rejBin.push({seed:i+900}); raise("WC42"); },
    q:"리젝트 트레이가 가득 찼습니다. 올바른 조치는?", a:"STOP 후 리젝트 트레이의 불합격 병을 회수 · 기록하고 비운다",
    w:["리젝트 푸셔를 끈다","불합격 병을 다시 라인에 올린다","트레이 없이 운전한다"],
    fix:[{sel:"#mReject",t:"[리젝트] 를 눌러 불합격 병을 회수합니다.",done:()=>S.reject.n<S.reject.cap}]},
  PE51:{nm:"PE 필름 소진", mk:"pe", fire(){ S.mat.film=0; raise("PE51"); },
    q:"HPE-100 이 정지했습니다 (필름 소진). 올바른 조치는?", a:"새 PE 필름 롤을 장착하고 피드 롤러까지 건다",
    w:["필름 없이 계속 생산한다","필름 센서를 끈다","실리카겔을 두 개 넣는다"],
    fix:[{sel:"#mFilm",t:"[PE 필름 롤] 을 눌러 새 롤을 장착합니다.",done:()=>S.mat.film>0}]},
  PE52:{nm:"필름 이송 불량 (튜브 걸림)", mk:"pe", fire(){ S.pe.jam=true; raise("PE52"); },
    q:"HPE-100 의 필름이 디스크 튜브에 걸려 투입되지 않습니다. 올바른 조치는?", a:"STOP 후 안전문을 열고 걸린 필름을 제거한 뒤 닫는다",
    w:["운전 중 튜브에 손을 넣는다","필름 없이 계속 생산한다","필름 길이를 최대로 늘린다"],
    fix:[{sel:"#uDoor",t:"안전문을 엽니다.",done:()=>S.door==="open"},
         {fix:[L.pe,1300,0],t:"튜브에 걸린 필름을 제거합니다 (빨간 ! 누르기).",done:()=>!S.pe.jam,act(){ return startWork("film",()=>{S.pe.jam=false;},{carry:null,dur:2.3}); }},
         {sel:"#uDoor",t:"안전문을 닫습니다.",done:()=>S.door==="closed"}]},
  RC61:{nm:"캡 공급 부족", mk:"rc", fire(){ S.mat.cap=0; LN.rc.chute=0; raise("RC61"); },
    q:"RCS-120 슈트에 캡이 없습니다. 올바른 조치는?", a:"진동 볼 피더에 같은 규격 캡을 보충하고 공급을 켠다",
    w:["캡 없이 병을 내보낸다","토크를 올린다","다른 규격 캡을 넣는다"],
    fix:[{sel:"#mCap",t:"[캡 투입] 을 눌러 캡을 보충합니다.",done:()=>S.mat.cap>0}]},
  RC62:{nm:"캡 이송 불량 (슈트 걸림)", mk:"rc", fire(){ S.rcp.jam=true; raise("RC62"); },
    q:"C 슈트 · 캡 벨트에서 캡이 걸려 내려오지 않습니다. 올바른 조치는?", a:"STOP 후 안전문을 열고 걸린(뒤집힌) 캡을 제거한 뒤 닫는다",
    w:["운전 중 슈트를 두드린다","캡 공급을 끄고 계속 운전한다","토크를 낮춘다"],
    fix:[{sel:"#uDoor",t:"안전문을 엽니다.",done:()=>S.door==="open"},
         {fix:[5088,1200,-170],t:"슈트 · 벨트에 걸린 캡을 제거합니다 (빨간 ! 누르기).",done:()=>!S.rcp.jam,act(){ return startWork("cap",()=>{S.rcp.jam=false;},{stand:[5118,670],reach:[5118,1230,-170],carry:null,dur:2.3,pour:false}); }},
         {sel:"#uDoor",t:"안전문을 닫습니다.",done:()=>S.door==="closed"}]},
  RC64:{nm:"집적 테이블 만량", mk:"rc", fire(){ while(S.table.n<S.table.cap){ const b=newBottle(S_END); b.cap=true; b.pe=1; b.fill=1; toTable(b); S.cnt.good--; S.table.total--; } },
    q:"집적 테이블이 가득 찼습니다. 올바른 조치는?", a:"STOP 후 완제품을 회수해 다음 공정(라벨 · 포장)으로 보낸다",
    w:["테이블 속도를 올린다","리젝트 트레이에 담는다","가이드를 떼어 낸다"],
    fix:[{sel:"#mTable",t:"[완제품 회수] 를 눌러 집적 테이블을 비웁니다.",done:()=>S.table.n<S.table.cap}]},
  RC65:{nm:"기밀도 시험 실패", mk:"rc", fire(){ S.rcp.leak=true; raise("RC65"); },
    q:"완제품 기밀도(리크) 시험에서 불합격이 나왔습니다. 원인과 조치로 옳은 것은?", a:"캡 체결 불량 의심 → STOP 후 캡핑기(척 헤드 · 클러치 · 토크)를 점검하고 토크를 확인한다",
    w:["정제 계수 설정을 바꾼다","PE 필름을 두 장 넣는다","기밀도 시험 기준을 낮춘다"],
    fix:[{sel:"#uDoor",t:"안전문을 엽니다.",done:()=>S.door==="open"},
         {fix:[L.T.x,1250,-150],t:"캡핑기 척 헤드 · 클러치를 점검합니다 (빨간 ! 누르기).",done:()=>!S.rcp.leak,
          act(){ return startWork("cap",()=>{S.rcp.leak=false; const r=torqueRange(); S.rcp.torque=Math.round((r[0]+r[1])/2); S.rcp.torqueBad=false;},{stand:[L.T.x+70,830],reach:[L.T.x,1250,-150],carry:null,dur:2.8,pour:false,view:"rcHead",door:"rcR"}); }},
         {sel:"#uDoor",t:"안전문을 닫습니다.",done:()=>S.door==="closed"},
         {sel:()=>hmiRoute("rc","main",HB("rc_check")),t:"RCS-120 주화면에서 [토크 확인] 을 누릅니다.",done:()=>S.flags.torqueRechk,hmi:true,pre(){S.flags.torqueRechk=false;}}]},
  E001:{nm:"안전문 열림 (인터락)", mk:"line", fire(){ S.door="open"; raise("E001"); },
    q:"운전 중 안전문이 열려 라인이 비상 정지했습니다. 올바른 조치는?", a:"안전을 확인하고 안전문을 닫은 뒤 RESET → START 한다",
    w:["인터락 스위치를 테이프로 막는다","문을 연 채 START 한다","전원을 껐다 켠다"],
    fix:[{sel:"#uDoor",t:"안전문을 닫습니다.",done:()=>S.door==="closed"}]},
  E002:{nm:"압축공기 압력 저하", mk:"line", fire(){ S.air=false; raise("E002"); },
    q:"압축공기 압력이 떨어져 정지했습니다. 올바른 조치는?", a:"압축공기 공급 밸브를 확인해 6 bar 로 복구한다",
    w:["공압 없이 운전한다","스토퍼를 손으로 누른다","진동을 끈다"],
    fix:[{sel:()=>S.air?null:"#uAir",t:"[압축공기] 를 켭니다 (5.5 bar 이상).",done:()=>S.air&&S.airP>=5.5}]}
};
/* 이상사례 (알람 없이 품질 이상으로 나타나는 현상) */
const CASES={
  C_GEL:{nm:"실리카겔 누락 병 발생", mk:"sg", fire(){ S.sg.markBad=true; }, banner:"전단 빈병 중량 이상(WC43)이 반복되고 리젝트가 늘고 있습니다.",
    q:"빈병 중량 이상으로 리젝트가 반복됩니다. 가장 가능성 높은 원인과 조치는?", a:"SG-120 마크 센서가 틀어져 파우치가 투입되지 않음 → 센서 위치 조정 후 커터 원점",
    w:["정제 계수 오차 → 센서창 청소","캡 토크 부족 → 토크 상향","PE 필름 누락 → 필름 교체"],
    fix:[{fix:[L.sg,1300,170],t:"SG-120 마크 센서 위치를 조정합니다 (빨간 ! 누르기).",done:()=>!S.sg.markBad,act(){ return startWork("gel",()=>{S.sg.markBad=false;},{stand:[L.sg+60,620],reach:[L.sg+60,1300,170],carry:null}); }},
         {sel:()=>hmiRoute("sg","main",HB("sg_home")),t:"SG-120 주화면에서 [커터 원점] 을 누릅니다.",done:()=>S.flags.sgHome,hmi:true,pre(){S.flags.sgHome=false;}}]},
  C_DIRT:{nm:"순중량 편차 증가 (계수 오차)", mk:"dmc", fire(){ for(let c=0;c<12;c++) S.dmc.dirt[c]=Math.max(S.dmc.dirt[c],0.62+0.3*hash1(c)); S.dust=false; }, banner:"순중량 불합격(±1정 이상)이 늘고 채널 막대가 주황색으로 바뀌었습니다.",
    q:"순중량 불합격이 늘고 채널 표시가 주황색입니다. 원인과 조치는?", a:"집진기 정지로 센서창이 오염됨 → STOP 후 센서창 청소 · 집진기 가동",
    w:["허용오차를 넓힌다","빈병을 교체한다","캡 공급을 끈다"],
    fix:[{sel:()=>hmiRoute("dmc","main",HB("dmc_clean")),t:"DMC-60T 주화면의 [센서창 청소] 를 누릅니다.",done:()=>Math.max(...S.dmc.dirt)<=0.6,hmi:true},
         {sel:"#uDust",t:"[집진기] 를 켭니다.",done:()=>S.dust}]},
  C_TORQUE:{nm:"캡 헐거움 (토크 부족)", mk:"rc", fire(){ S.rcp.torqueBad=true; S.rcp.torque=6; raise("RC63"); }, banner:"완제품 캡이 손으로 쉽게 돌아갑니다 (토크 이상 경고).",
    q:"완제품 캡이 헐겁습니다. 원인과 조치는?", a:"체결 토크 설정이 낮음 → 캡 규격 권장 토크로 재설정 후 확인",
    w:["캡을 더 큰 규격으로 바꾼다","라인 속도를 올린다","PE 필름을 뺀다"],
    fix:[{sel:()=>hmiRoute("rc","set",'#hBody [data-ed="rc_torque"]'),t:"RCS-120 설정에서 체결 토크를 권장 범위로 입력합니다.",done:()=>!S.rcp.torqueBad&&S.rcp.torque>=torqueRange()[0]&&S.rcp.torque<=torqueRange()[1],hmi:true,num:()=>Math.round((torqueRange()[0]+torqueRange()[1])/2)},
         {sel:()=>hmiRoute("rc","main",HB("rc_check")),t:"RCS-120 주화면에서 [토크 확인] 을 누릅니다.",done:()=>S.flags.torqueRechk,hmi:true,pre(){S.flags.torqueRechk=false;}}]},
  C_VIB:{nm:"겹침정 · 과충전 발생 (진동 과다)", mk:"dmc", fire(){ S.dmc.vib[2]=98; }, banner:"순중량 초과(+1정) 불합격이 이어집니다. 트랙에서 정제가 겹쳐 떨어집니다.",
    q:"순중량 초과 불합격이 이어집니다. 원인과 조치는?", a:"3단 진동이 과도해 정제가 겹쳐(더블) 한 번에 계수됨 → 3단 진동을 권장값(약 78 %)으로 낮춘다",
    w:["센서창을 청소한다","빈병 기준을 바꾼다","토크를 올린다"],
    fix:[{sel:()=>hmiRoute("dmc","set",'#hBody [data-ed="vib2"]'),t:"DMC-60T 설정에서 3단 진동을 권장값으로 입력합니다.",done:()=>S.dmc.vib[2]<=90,hmi:true,num:()=>78}]}
};
const incOf=k=>INC[k]||CASES[k];
/* 알람 발생 시 : 세션 중이고 대응 중인 알람이 없으면 대응 흐름 시작 */
function onAlarm(key){
  if(!S.session||!S.session.active||S.activeTrouble||S.flags.casePending||S.mode==="demo") return;
  if(ALARMS[key].kind!=="trip"&&!["DM32","DM31"].includes(key)) return;
  if(!INC[key]) return;
  beginRecovery(key);
}
function launchIncident(k,sched){
  const inc=incOf(k); if(!inc) return;
  if(S.activeTrouble){ toast("현재 대응 중인 상황을 먼저 해결하세요.","bad"); return; }
  if(!S.running){ toast("라인이 운전 중일 때 발생시킬 수 있습니다.","bad"); return; }
  inc.fire();
  (S.flags.vmLog=S.flags.vmLog||[]).push(k);
  if(CASES[k]){ S.flags.caseT=tSim; S.flags.casePending=k; showBanner("이상 현상 : "+inc.banner); }
  else if(inc.wait) showBanner("알람 대기 : "+inc.nm+" — 곧 알람이 발생합니다.");
  else if(!S.activeTrouble) beginRecovery(k);
}
/* 이상사례는 증상이 드러난 뒤(약 4초) 대응 흐름 시작 */
function caseTick(){
  const k=S.flags.casePending;
  if(!k||S.activeTrouble) return;
  if(tSim-S.flags.caseT>4){ S.flags.casePending=null; beginRecovery(k); }
}
function beginRecovery(k){
  const inc=incOf(k);
  S.flags.casePending=null;
  S.activeTrouble={k,inc,at:tSim};
  const ch=[{t:inc.a,ok:true}].concat(inc.w.map(t=>({t,ok:false})));
  for(let i=ch.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [ch[i],ch[j]]=[ch[j],ch[i]]; }
  S.recovery={accepted:false, choices:ch, wrong:[], fixI:0, reset:false, asked:false};
  showBanner((CASES[k]?"이상사례 · ":"알람 · ")+inc.nm);
  renderCoach();
}
/* 대응 단계 : ① STOP → ② 원인 판단 → ③ 조치 → ④ RESET → ⑤ START (단계는 되돌아가지 않는다) */
function recoveryStep(){
  const T=S.activeTrouble, R=S.recovery; if(!T||!R) return null;
  if(!R.phase) R.phase="stop";
  if(R.phase==="stop"){ if(S.running) return {k:"stop",sel:"#swStop",t:"[STOP] 을 눌러 라인을 정지합니다.",title:"① 정지"}; R.phase="ask"; }
  if(R.phase==="ask"){ if(!R.accepted) return {k:"ask",sel:"#incAsk",t:"원인과 조치를 판단합니다.",title:"② 원인 판단"}; R.phase="fix"; }
  if(R.phase==="fix"){
    const fx=T.inc.fix;
    while(R.fixI<fx.length){
      const f=fx[R.fixI];
      if(!R.pre) R.pre={};
      if(!R.pre[R.fixI]&&f.pre){ f.pre(); } R.pre[R.fixI]=true;
      let d=false; try{ d=f.done(); }catch(e){}
      if(!d) break;
      R.fixI++;
    }
    if(R.fixI<fx.length){ const f=fx[R.fixI];
      const sel=f.fix?"#fixBtn":(typeof f.sel==="function"?f.sel():f.sel);
      return {k:"fix",sel,t:f.t,title:"③ 조치",f}; }
    R.phase="reset";
  }
  if(R.phase==="reset"){
    const need=tripAlarms().length>0||(!R.reset&&S.alarms.some(a=>a.key===T.k||ALARMS[a.key].mk===T.inc.mk));
    if(need) return {k:"reset",sel:"#swReset",t:"[RESET] 을 눌러 알람을 해제합니다.",title:"④ 알람 해제"};
    R.phase="start";
  }
  if(R.phase==="start"){ if(!S.running) return {k:"start",sel:"#swStart",t:"[START] 를 눌러 재가동합니다.",title:"⑤ 재가동"}; R.phase="done"; }
  return null;
}
function recoveryCheck(){
  const h=recoveryStep();
  if(!h&&S.activeTrouble){
    toast("조치 완료 — 정상 운전으로 복귀했습니다.","good");
    S.activeTrouble=null; S.recovery=null; hideBanner();
    stepCheck();
  }
  renderCoach();
}
/* 판단 대화상자 */
function openIncidentAsk(){
  const T=S.activeTrouble, R=S.recovery; if(!T||!R) return;
  const box=$("#incBox");
  box.innerHTML='<h2>🚨 '+esc(T.inc.nm)+'</h2><p>'+esc(T.inc.q)+'</p>'+R.choices.map((c,i)=>'<button class="choice'+(R.wrong.includes(i)?" bad":"")+'" data-i="'+i+'">'+esc(c.t)+'</button>').join("");
  $$("#incBox .choice").forEach(b=>b.onclick=()=>{
    const i=+b.dataset.i, c=R.choices[i];
    if(c.ok){ b.classList.add("good"); R.accepted=true; toast("정답 — 조치를 진행합니다.","good"); setTimeout(()=>{ $("#mInc").classList.remove("on"); recoveryCheck(); },650); }
    else { if(!R.wrong.includes(i)){ R.wrong.push(i); deduct("wrong"); } b.classList.add("bad"); toast("다시 판단하세요.","bad"); }
  });
  $("#mInc").classList.add("on");
}
