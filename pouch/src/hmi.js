/* ═══════════════════════════════════════════════════════════════════
   설비 화면 (HMI) · 조작반
   · 충전실 과정 : 충전기 터치스크린 9 화면 (값은 SOP 원본 화면 사진 기준)
   · 포장실 과정 : 스틱공급장치 · 카토너 · 케이스 프린터 · 비전 · X-ray · 중량선별기
   ═══════════════════════════════════════════════════════════════════ */
let hMach="fl", hScr="run";
let FPMON=null;                 /* 1인칭 : 지금 보고 있는 모니터의 설비 목록 (탭 제한) */
const HTABS={F:[["fl","SP303","파우치 충전기"]],
  P:[["sf","스틱공급","PanelView"],["ct","HC 100L","카토너 (LS)"],["pr","AX150i","케이스 프린터"],["vs","비전","인쇄 검사"],["xr","X-ray","IX-EN"],["cw","중량선별","SSV"],["fl","SP303","충전기 (연동)"]]};
const HB=id=>'#hBody [data-hb="'+id+'"]';
const HMT=k=>'#hTabs [data-mt="'+k+'"]';
const HNV=k=>'#hNav [data-nav="'+k+'"]';
const btn=(on,nm,en,e,id,dis,warn)=>'<div class="hb'+(on?" on":"")+(dis?" dis":"")+(warn?" warn":"")+'" data-hb="'+id+'"><span class="e">'+e+'</span>'+nm+'<s>'+en+'</s></div>';
const row=(nm,en,v)=>'<div class="hrow"><div class="lb">'+nm+'<s>'+en+'</s></div>'+v+'</div>';
const pv=(v,bad)=>'<div class="hval pv'+(bad?" bad":"")+'">'+v+'</div>';
const sec=t=>'<div class="hsec">'+t+'</div>';
const kc=(v,t,cls)=>'<div class="kcard'+(cls?" "+cls:"")+'"><b>'+v+'</b><s>'+t+'</s></div>';
const note=t=>'<div class="hrow" style="display:block;font-size:12.5px;line-height:1.55;color:#5d7086">'+t+'</div>';
const tbl=(head,rows)=>'<table class="ht"><tr>'+head.map(h=>'<th>'+h+'</th>').join("")+'</tr>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join("")+'</tr>').join("")+'</table>';
const FNAV=[["run","운전데이터"],["cam","캠 포지션"],["splice","이음매"],["manual","수동점검"],["sw1","조작스위치1"],["sw2","조작스위치2"],["temp","온도 설정"],["xfer","이송기 설정"],["vis","비전 Setup"]];
const EXPECT={exp:"2028.11.01", lot:"2F010"};          /* 현장 영상 판독 값 (IDT 예시) */

function machPower(k){ const p=S.p;
  return k==="fl"?S.f.panel:k==="sf"?p.ctMain&&p.sfSw:k==="ct"?p.ctMain:k==="pr"?p.prMain&&p.prPow:k==="vs"?p.prMain:k==="xr"?p.xrPow:k==="cw"?p.cwPow:false; }
function drawHMI(){
  if(!S) return;
  const tabs=HTABS[S.room].filter(t=>!FPMON||FPMON.includes(t[0]));
  if(!tabs.some(t=>t[0]===hMach)){ hMach=tabs[0][0]; hScr=hMach==="fl"?"run":"main"; }
  const m=machOf(hMach);
  $("#hMach").textContent=m?m.md+" · "+m.nm:"";
  $("#hTabs").innerHTML=tabs.map(([k,md,nm])=>'<div class="mtab'+(hMach===k?" on":"")+(alarmOf(k).length?" warn":"")+'" data-mt="'+k+'">'+md+'<s>'+nm+'</s><i class="'+(machRun(k)?"run":"")+'"></i></div>').join("");
  $$("#hTabs [data-mt]").forEach(e=>e.onclick=()=>{ hMach=e.dataset.mt; hScr=hMach==="fl"?"run":"main"; drawHMI(); });
  const body=$("#hBody"), nav=$("#hNav");
  if(!machPower(hMach)){ body.innerHTML='<div class="offScr"><b>화면 꺼짐</b>'+esc(powerHint(hMach))+'</div>'; nav.innerHTML=""; hmiAfter(); return; }
  if(hMach==="xr"&&S.p.xrBoot<1){ body.innerHTML='<div class="offScr"><b>부팅 중 · '+Math.round(S.p.xrBoot*100)+' %</b>주 전원 투입 후 약 1분 부팅됩니다 (IDT 에서는 수 초).</div>'; nav.innerHTML=""; hmiAfter(); return; }
  const needLogin={fl:()=>!S.f.user,sf:()=>!S.p.sfUser,ct:()=>!S.p.ctUser,vs:()=>!S.p.vsUser}[hMach];
  if(needLogin&&needLogin()){ body.innerHTML=loginScreen(hMach); nav.innerHTML=""; bindHB(); hmiAfter(); return; }
  if(hMach==="fl"){
    nav.innerHTML=FNAV.map(n=>'<div class="nv'+(hScr===n[0]?" on":"")+'" data-nav="'+n[0]+'">'+n[1]+'</div>').join("");
    $$("#hNav [data-nav]").forEach(e=>e.onclick=()=>{ hScr=e.dataset.nav; drawHMI(); });
    body.innerHTML=(FSCR[hScr]||FSCR.run)();
  }else{ nav.innerHTML=""; body.innerHTML=PSCR[hMach](); }
  bindHB(); hmiAfter();
}
function powerHint(k){ return {fl:"메인 파워 → 압축공기 → 컨트롤 판넬 스위치를 켜면 터치스크린이 켜집니다.",sf:"카토너 메인스위치와 스틱공급장치 스위치(기계 뒤편)를 켜면 켜집니다.",ct:"카토너 메인스위치(기계 뒤편)를 켜면 켜집니다.",
  pr:"메인 전원 → 프린터 전원(하단)을 켜면 켜집니다.",vs:"케이스 프린터 메인 전원을 켜면 비전 PC 가 켜집니다.",xr:"X-ray 주 전원을 켜면 부팅됩니다.",cw:"중량선별기 전원 스위치를 켜면 켜집니다."}[k]||""; }
function machRun(k){ const p=S.p; return k==="fl"?S.f.run:k==="sf"?p.sfRun:k==="ct"?p.ctRun:k==="pr"?p.prRun:k==="vs"?p.vsRun:k==="xr"?p.xrConv:k==="cw"?p.cwRun:false; }
function bindHB(){ $$("#hBody [data-hb]").forEach(e=>e.onclick=()=>hbClick(e.dataset.hb)); drawPanel(); }
function hmiAfter(){
  const t=$("#hAlarmTick"), al=S.alarms.slice(-2).reverse();
  t.innerHTML=al.map(a=>esc(ALARMS[a.key].t)).join("<br>");
  if(typeof applyHint==="function") applyHint();
}
function loginScreen(k){
  const nm={fl:"SOLPAC SP303",sf:"스틱공급장치 · PanelView Plus",ct:"HC 100L · LS",vs:"비전시스템 사용자 로그인"}[k];
  if(k==="vs") return '<div class="lgWrap"><div class="lgBrand">DOMINO<s>'+nm+'</s></div><div class="lgCard"><div class="lgT">사용자 선택</div>'+
    ['Operator','Supervisor','Engineer','Test'].map((u,i)=>'<div class="hrow"><div class="lb">'+(i===0?"◉ ":"○ ")+u+'</div></div>').join("")+
    '<div class="lgIn"><b>PIN</b><input class="inp" value="••••" readonly></div><button class="lgBtn" data-hb="vs_login">로그인</button></div></div>';
  return '<div class="lgWrap"><div class="lgBrand">'+nm+'<s>로그인 · LOGIN</s></div><div class="lgCard">'+
    '<div class="lgIn"><b>ID</b><input class="inp" value="PK2" readonly></div><div class="lgIn"><b>PASSWORD</b><input class="inp" type="password" value="1234" readonly></div>'+
    '<button class="lgBtn" data-hb="'+k+'_login">OK</button><div class="lgHint">부여받은 본인 ID · PASSWORD 로 로그인합니다 (공유 · 노출 금지).</div></div></div>';
}
const hdr=(t,en)=>'<div class="hTitle">'+t+' <s>'+en+'</s>'+(S.f.run?'<span class="st2 run">운전 중</span>':tripAlarms().length?'<span class="st2 alm">알람</span>':'<span class="st2">정지</span>')+'</div>';
/* ── 충전기 9 화면 ── */
const FSCR={
 run(){ const f=S.f, h=Math.round(f.heat), V=[182,182,184,183,183,183,182,183,182.4,182.5];
  return hdr("운전 데이터","SOLPAC · Speed "+(f.run?f.spm:0)+" · Cam "+Math.round(f.phase*360))+
   '<div class="kpis">'+kc(Math.floor(S.cnt.pouch/10).toLocaleString(),"생산카운터 (Cut)","hi")+kc(S.cnt.pouch.toLocaleString(),"생산카운터 (EA)")+kc(f.strokes.toLocaleString(),"필름카운터 (Cut)")+'</div>'+
   row("길이","Range 70~200 mm",pv("147"))+row("운전속도","최고 50RPM · 실제 운전 30 stroke/min",pv(f.spm))+
   row("구동기어비 하강 / 상승","",pv("10 / 10"))+row("하 지연 / 상 지연","ms",pv("20 / 20"))+
   sec("세로접착 1~10 (℃)")+'<div class="tgrid">'+V.map((v,i)=>'<div>'+(i+1)+'<b>'+(f.main?fmt(Math.min(v,v*h/f.heatSV),1):"-")+'</b></div>').join("")+'</div>'+
   sec("가로접착 1-1 · 1-2 · 2-1 · 2-2 (℃)")+'<div class="tgrid">'+f.endSV.map((v,i)=>'<div>'+["1-1","1-2","2-1","2-2"][i]+'<b>'+(f.main?fmt(Math.min(v,v*h/f.heatSV),0):"-")+'</b></div>').join("")+'</div>'+
   row("장비시작 배출카운트","재가동 시 정상 배출 카운트",pv("5")); },
 cam(){ const R=[["마크구간",10,200],["세로실바",170,280],["가로실바",345,160],["무늬바",160,310],["컷팅(R-컷팅)",175,190],["구동 실린더",180,300],["무늬냉각",165,250],["컷팅냉각",100,210],["컷팅 게이트",180,300],["정위치 정지",300,305],["노즐 바이브레이터",80,120],["셔터 바이브레이터",335,100]];
  return hdr("캠 포지션 1","CAM POSITION")+tbl(["종류","시작위치","종료위치"],R)+note("캠 파라미터는 반드시 담당자가 조정합니다 (작업자 변경 금지)."); },
 splice(){ return hdr("이음매","SPLICE")+row("이음매 부저","",pv("Off"))+row("이음매 감지정지","",pv("Off"))+
   sec("공급정지카운트 1ST~5ST")+'<div class="tgrid">'+[48,49,50,51,52].map((v,i)=>'<div>'+(i+1)+'ST<b>'+v+'</b></div>').join("")+'</div>'+
   sec("공급정지 배출카운트 1ST~5ST")+'<div class="tgrid">'+[53,54,55,56,57].map((v,i)=>'<div>'+(i+1)+'ST<b>'+v+'</b></div>').join("")+'</div>'+
   row("공포배출카운트 (공급정지시작)","SV",pv("2"))+row("총생산량","",pv(S.cnt.pouch.toLocaleString())); },
 manual(){ const L=["세로실바1","세로실바2","가로실바","무늬바","컷팅(R-컷팅)","구동실린더","무늬냉각","컷팅냉각","컷팅 게이트","호퍼 게이트1","호퍼 게이트2","호퍼 게이트3","도징 게이트1","도징 게이트2","도징 게이트3","하부 셔터1","하부 셔터2","하부 셔터3","노즐바이브레이터","셔터바이브레이터","집진 1","집진 2","파지털이","에어배출","공포배출실린더","공포배출 콘베어","파지모터"];
  return hdr("수동 점검","MANUAL CHECK")+'<div class="tgrid man">'+L.map(t=>'<div class="mb" data-hb="fl_man">'+t+'</div>').join("")+'</div>'+note("스크린의 각 버튼을 눌러 기능을 수동으로 시험합니다. 운전 중에는 사용하지 않습니다."); },
 sw1(){ const f=S.f, on=(t,v,id)=>'<div class="sw'+(v?" on":"")+'"'+(id?' data-hb="'+id+'"':"")+'>'+t+' '+(v?"On":"Off")+'</div>';
  return hdr("조작 스위치 1","SWITCH 1")+'<div class="tgrid sw5">'+
   ["아이마크","이음매체크","세로실바","가로실바","무늬바","컷팅(R-)","히터","무늬냉각","컷팅냉각","커팅 게이트","R커팅 파지모터","파지털이"].map(t=>on(t,true)).join("")+
   on("도징1",f.dose[0],"fl_dose0")+on("도징2",f.dose[1],"fl_dose1")+on("도징3",f.dose[2],"fl_dose2")+
   ["셔터 바이브레이터","노즐 바이브레이터","당김모터","안전도어"].map(t=>on(t,true)).join("")+on("비전",f.vision)+on("공포감지",true)+on("프린터",f.prn.saved)+on("집진 1",f.dustV)+on("집진 2",f.dustV)+
   on("호퍼체크1",true)+on("호퍼체크2",true)+on("호퍼체크3",true)+on("외부전등",true)+'</div>'+note("도징1 = 첨가제 · 도징2 = 주성분 · 도징3 = 백당 도징박스 실린더. 정기 공정검사 때 원료별로 하나만 켜서 채취합니다."); },
 sw2(){ const f=S.f;
  return hdr("조작 스위치 2","SWITCH 2")+'<div class="hGrid3">'+btn(f.link,"후 공정 연동","카토너 정지 시 자동 정지","🔗","fl_link")+btn(false,"호퍼 2 바이브레이터","Off","〰","fl_noop")+btn(true,"외부 전등","On","💡","fl_noop")+'</div>'+
   tbl(["항목","SV","PV"],[["하부셔터1 횟수",10,0],["하부셔터2 횟수",10,0],["하부셔터3 횟수",10,0],["호퍼게이트1 횟수",1,0],["호퍼게이트2 횟수",1,0],["호퍼게이트3 횟수",1,0]])+
   '<div class="hGrid2">'+btn(f.linkChk,"연동 상태 확인","CHECK","✔","fl_linkChk")+'</div>'; },
 temp(){ const f=S.f, h=f.heat, k=h/f.heatSV;
  return hdr("온도 설정","TEMPERATURE")+tbl(["구분","PV","SV","POWER","UPPER","LOWER"],
   [1,2,3,4,5,6,7,8,9,10].map(i=>["세로 "+i,f.main?fmt(Math.min(f.heatSV,f.heatSV*k),0):"-",f.heatSV,f.main?"ON":"OFF",f.heatSV+10,f.heatSV-10]).concat(
   f.endSV.map((v,i)=>["가로 "+["1-1","1-2","2-1","2-2"][i],f.main?fmt(Math.min(v,v*k),0):"-",v,f.main?"ON":"OFF",v+10,v-10])))+
   '<div class="hGrid2">'+btn(f.tempChk,"PV · SV 확인","CHECK","✔","fl_temp",false,f.main&&h<f.heatSV-6)+'</div>'; },
 xfer(){ const f=S.f, V=[[9,2,3,2],[8,2,3,2],[9,2,3,2]];
  return hdr("이송기 설정","VACUUM CONVEYOR")+'<div class="hGrid3">'+[0,1,2].map(i=>btn(f.ibc[i],"이송기 "+(i+1),["첨가제 (호퍼1)","미사용","백당 (호퍼3)"][i],"⇡","fl_ibc"+i)).join("")+'</div>'+
   tbl(["이송기","진공","진공해제","배출","진공쉐이크"],V.map((v,i)=>[i+1,fmt(v[0],1),fmt(v[1],1),fmt(v[2],1),fmt(v[3],1)]))+
   row("호퍼 레벨 1 · 2 · 3","%",pv(Math.round(S.hop.add)+" · "+Math.round(S.hop.main)+" · "+Math.round(S.hop.sug),S.hop.main<10))+note("1층 충전기 뒤편 IBC(첨가제 · 백당)에서 진공으로 흡입해 호퍼로 보냅니다. 2번(주성분)은 스쿱 수동 투입이라 이송기 2는 사용하지 않습니다."); },
 vis(){ const f=S.f;
  return hdr("비전 Setup","VISION")+tbl(["항목","값"],[["비전 촬영 속도","5500 mm/s"],["원점 복귀 속도","9000 mm/s"],["출력 시간","20 ms"],["비전 공급정지 카운트","35"],["리젝트 카운터","40"],["NG 카운트 정지","2 회"]])+
   '<div class="tgrid">'+[1820,2420,3020,3620,4220,4820,5420,6020,6620,7220].map((v,i)=>'<div>'+(i+1)+'<b>'+v+'</b></div>').join("")+'</div>'+
   '<div class="hGrid2">'+btn(f.visChk,"설정 확인","CHECK","✔","fl_visChk")+btn(f.vision,"비전 "+(f.vision?"ON":"OFF"),"VISION ON/OFF","👁","fl_vision")+'</div>'; }
};
/* ── 포장실 화면 ── */
const ph=(t,en,run)=>'<div class="hTitle">'+t+' <s>'+en+'</s>'+(run?'<span class="st2 run">가동</span>':'<span class="st2">정지</span>')+'</div>';
const PSCR={
 sf(){ const p=S.p;
  if(p.sfShut===1) return ph("종료 확인","PanelView Plus")+note("프로그램을 종료하시겠습니까?")+'<div class="hGrid2">'+btn(false,"예","YES","✔","sf_yes")+btn(false,"아니요","NO","✖","sf_no")+'</div>';
  if(p.sfShut===2) return ph("Current application","PanelView Plus")+note("터미널 설정 화면 (Current application) — 종료되었습니다.");
  return ph("자동 조작","STICK FEEDER · AUTO",p.sfRun)+'<div class="kpis">'+kc(LN.buf,"버퍼 파우치","hi")+kc(S.cnt.toPack.toLocaleString(),"공급 파우치")+kc(p.align?"ON":"OFF","정렬컨베어",p.align?"":"ng")+'</div>'+
   '<div class="hGrid2">'+btn(p.sfServo,"서보 전원 공급","SERVO POWER","⚡","sf_servo")+btn(p.sfFeed,"제품 공급","PRODUCT FEED","➜","sf_feed")+'</div>'+
   '<div class="hGrid2">'+btn(false,"전원 (종료)","SHUTDOWN","⏻","sf_off")+'</div>'+note("아이콘을 활성화한 뒤 오른쪽 RESET → START 로 가동합니다."); },
 ct(){ const p=S.p;
  return ph("자동 조작","HC 100L · AUTO",p.ctRun)+'<div class="kpis">'+kc(S.cnt.carton.toLocaleString(),"생산량 (카톤)","hi")+kc(p.mag,"카톤 매거진",p.mag<20?"ng":"")+kc(p.leaf,"설명서",p.leaf<20?"ng":"")+'</div>'+
   '<div class="hGrid3">'+btn(p.ctIcons&&p.ctIcons[0],"카톤","CARTON","📦","ct_i0")+btn(p.ctIcons&&p.ctIcons[1],"설명지","LEAFLET","📄","ct_i1")+btn(p.ctIcons&&p.ctIcons[2],"제품투입","PRODUCT","➜","ct_i2")+'</div>'+
   row("핫멜트","가동 가능 표시",pv(hmReady()?"초록 (가동 가능) · "+Math.round(p.hmT)+" ℃":p.hm?"승온 중 "+Math.round(p.hmT)+" ℃":"OFF",!hmReady()))+
   row("속도","SPEED",pv("50 cpm"))+row("계정","OPERATOR",pv("생산량 · 제품정보 · 속도 · 자동 · 수동 · 장비진단 · 알람 · 주화면"))+
   '<div class="hNavMini">'+["자동","수동","충전","기계각","시간","알람","주화면"].map(t=>'<span>'+t+'</span>').join("")+'</div>'; },
 pr(){ const p=S.p, L=p.lbl;
  if(hScr==="edit") return ph("현재 라벨 편집","LABEL EDIT",p.prRun)+'<div class="lblPrev">LOT : '+esc(L.lot||"______")+'<br>EXP : '+esc(L.exp||"____.__.__")+'</div>'+
   row("배치번호 (LOT)","포장지시기록서",'<div class="hval edit" data-hb="pr_lot">'+esc(L.lot||"입력")+'</div>')+row("사용기한 (EXP)","포장지시기록서",'<div class="hval edit" data-hb="pr_exp">'+esc(L.exp||"입력")+'</div>')+
   '<div class="hGrid2">'+btn(L.saved,"저장","SAVE","💾","pr_save")+btn(false,"홈","HOME","🏠","pr_home")+'</div>';
  if(hScr==="search") return ph("라벨 검색 도구","LABEL STORE",p.prRun)+tbl(["라벨","불러오기"],[["EXP-LOT.lbl",'<span class="lk" data-hb="pr_load">불러오기 ▶</span>'],["TESTMESSAGE.lbl","—"]])+'<div class="hGrid2">'+btn(false,"홈","HOME","🏠","pr_home")+'</div>';
  return ph("홈","DOMINO AX150i",p.prRun)+'<div class="kpis">'+kc(p.prRun?"인쇄":"유휴","상태","hi")+kc(Math.round(p.ink)+" %","잉크",p.ink<10?"ng":"")+kc(L.loaded?"EXP-LOT":"TESTMESSAGE","현재 라벨")+'</div>'+
   '<div class="hGrid3">'+btn(L.saved,"현재 라벨 편집","EDIT","✎","pr_edit")+btn(L.loaded,"라벨 검색 도구","STORE","🔍","pr_search")+btn(false,"테스트 인쇄","TEST PRINT","🖨","pr_test")+'</div>'+
   '<div class="hGrid2">'+btn(p.prRun,"▶ 시작","START","▶","pr_start")+btn(false,"■ 중지 → 시퀀스 꺼짐","STOP","■","pr_stop")+'</div>'; },
 vs(){ const p=S.p;
  if(!p.vsMode) return ph("모드 선택","R-Series · MODE")+tbl(["모드 이름","선택"],[["판콜H EXP-LOT",'<span class="lk" data-hb="vs_mode">확인 ▶</span>'],["TemplateMode","—"],["Test","—"]])+note("생산하는 제품의 모드를 선택하고 확인을 누릅니다.");
  return ph("검사","R-Series 550 · "+(p.vsRun?"실행 중":"정지"),p.vsRun)+'<div class="kpis">'+kc(S.cnt.carton-S.cnt.rejVs,"성공","hi")+kc(S.cnt.rejVs,"실패",S.cnt.rejVs?"ng":"")+kc(p.vsRun?"1.0 fps (60 ppm)":"-","FPS · PPM")+'</div>'+
   '<div class="hGrid3">'+btn(p.vsRun,"▶ 시작","I/O 제어 활성","▶","vs_start")+btn(false,"■ 정지","I/O 제어 비활성","■","vs_stop")+btn(false,"로그오프 · 종료","LOG OFF","⏻","vs_off")+'</div>'+note("검사 도구 : OCR · Code Check · Code Quality. 상태 탭 녹색 = 가동, 빨강 = 수동모드."); },
 xr(){ const p=S.p, test=p.xrTest&&tSim-p.xrTestT<6;
  return ph("홈","ISHIDA IX-EN · pancold-h",p.xrConv)+'<div class="kpis">'+kc(test?"T":S.xrLast,test?"테스트 운전 (전량 NG)":"판정",test||S.xrLast==="NG"?"ng":"hi")+kc((S.cnt.carton-S.cnt.rejXr).toLocaleString(),"OK")+kc(S.cnt.rejXr,"NG")+'</div>'+
   '<div class="hGrid3">'+btn(p.xrPre,"예약 (품목)","pancold-h","📋","xr_pre")+btn(p.xrX,"X선","X-RAY "+(p.xrX?"조사 중":"정지"),"☢","xr_x",false,p.xrX)+btn(p.xrCal,"캘리브레이션","CALIBRATION","⟲","xr_cal")+'</div>'+
   '<div class="hGrid3">'+btn(p.xrConv,"콘베어","CONVEYOR","⇉","xr_conv")+btn(p.xrTest,"테스트 운전","TEST","T","xr_test")+btn(false,"리셋","RESET","↺","xr_reset",false,S.flags.xrBlink&&tSim-S.flags.xrBlink<4)+'</div>'+
   '<div class="hGrid2">'+btn(p.xrSaved,"종료 · 이력 저장","END","💾","xr_end")+'</div>'+row("X선 출력 키","KEY SWITCH",pv(p.xrKey?"ON":"OFF",!p.xrKey))+row("검사 항목","",pv("이물 LV · 결품 레벨")); },
 cw(){ const p=S.p, last=S.cwLast, ng=last!=null&&(last-PROD.cw.std<PROD.cw.lo||last-PROD.cw.std>PROD.cw.hi);
  if(hScr==="prod") return ph("생산관리 · 품종전환","SSV",p.cwRun)+tbl(["No","품종","기준치"],[["002",'<span class="lk" data-hb="cw_sel">판콜H ▶ 품종전환</span>',"105.5 g"],["003","—","—"],["004","—","—"]])+'<div class="hGrid2">'+btn(false,"뒤로","BACK","←","cw_back")+'</div>';
  return ph("메인","Anritsu SSV · 품종 "+(p.cwProd?"002 판콜H":"—"),p.cwRun)+'<div class="kpis">'+kc(last!=null?fmt(last,1)+" g":"0.0 g","계량값",ng?"ng":"hi")+kc(ng?"NG":last!=null?"OK":"-","판정",ng?"ng":"")+kc(S.cwN?fmt(S.cwSum/S.cwN,1)+" g":"-","평균")+'</div>'+
   row("기준치","",pv(p.cwProd?"105.5 g":"-"))+row("하한치 / 상한치","",pv(p.cwProd?"−2.0 g / +2.0 g":"-"))+row("총수 / OK / NG","",pv(S.cwN+" / "+(S.cwN-S.cnt.rejCw)+" / "+S.cnt.rejCw))+
   '<div class="hGrid3">'+btn(p.cwProd,"생산관리","품종전환","📋","cw_prod")+btn(p.cwChk,"기준 · 상하한 확인","CHECK","✔","cw_chk")+btn(false,"HOME","HOME","🏠","cw_home")+'</div>'; }
};

/* ═══ 조작반 (선택한 설비의 물리 버튼) ═══ */
function drawPanel(){
  const P=$("#panel"); if(!P||!S) return;
  const k=hMach, f=S.f, p=S.p;
  const B=(id,cls,e,t,s,on)=>'<div class="psw '+cls+(on?" on":"")+'" id="'+id+'"><span class="e">'+e+'</span>'+t+'<s>'+s+'</s></div>';
  let h="";
  if(k==="fl") h=B("swRun","start","▶","RUN","자동 운전",f.run)+B("swStop","stop","■","STOP","0 위치 정지",!f.run&&f.started)+B("swJog","jog","👆","JOG","누르는 동안")+B("swReset","reset","↺","RESET","알람 해제")+
    B("swFill","fill","⛁","FILLING "+(f.filling?"ON":"OFF"),"내용물 충전",f.filling)+B("swBuz","jog","🔔","BUZZER","경보음 "+(f.buzzer?"ON":"OFF"),f.buzzer)+B("swEmg","emg","⏻","EMERGENCY","비상 정지",f.emg);
  else if(k==="sf"||k==="ct") h=B(k+"Start","start","▶","START",k==="sf"?"스틱공급장치":"카토너",k==="sf"?p.sfRun:p.ctRun)+B(k+"Stop","stop","■","STOP","정지")+B(k+"Reset","reset","↺","RESET","리셋")+B("swEmg","emg","⏻","EMERGENCY","비상 정지",f.emg);
  else if(k==="cw") h=B("cwStart","start","▶","START","녹색 램프",p.cwRun)+B("cwStop","stop","■","STOP","빨간 램프")+B("cwHome","reset","🏠","HOME","기본화면");
  else h='<div class="pnote">'+esc(machOf(k).md)+' 은 화면 버튼으로 조작합니다.</div>';
  if(P.dataset.h!==h||P._s!==S){ P.innerHTML=h; P.dataset.h=h; P._s=S; bindPanelBtns(); }   /* 세션이 바뀌면 다시 연결 */
}

/* ═══ 버튼 동작 ═══ */
function hbClick(id){
  const f=S.f, p=S.p;
  const run=()=>{ if(f.run){ toast("운전 중에는 할 수 없습니다. 먼저 STOP.","bad"); return true; } return false; };
  switch(id){
    case "fl_login": f.user="PK2"; toast("로그인 : PK2","good"); hScr="run"; break;
    case "sf_login": p.sfUser=true; toast("스틱공급장치 로그인","good"); break;
    case "ct_login": p.ctUser=true; toast("카토너 로그인","good"); break;
    case "vs_login": p.vsUser=true; toast("비전 로그인 : Operator","good"); break;
    case "fl_man": toast(f.run?"운전 중에는 수동 점검을 하지 않습니다.":"수동 점검 — 해당 기능 1회 동작"); break;
    case "fl_dose0": case "fl_dose1": case "fl_dose2": { const i=+id.slice(-1); f.dose[i]=!f.dose[i]; toast("도징"+(i+1)+" "+(f.dose[i]?"ON":"OFF")); if(S.ipc.open) renderIpc(); break; }
    case "fl_link": f.link=!f.link; toast("후 공정 연동 "+(f.link?"ON — 카토너 정지 시 충전기 자동 정지":"OFF"),f.link?"good":"bad"); break;
    case "fl_linkChk": if(!f.link){ toast("후 공정 연동이 OFF 입니다. 먼저 ON 하세요.","bad"); return; } f.linkChk=true; toast("후 공정 연동 ON 확인","good"); break;
    case "fl_temp": if(f.heat<f.heatSV-6){ toast("아직 승온 중입니다 (PV < SV).","bad"); return; } f.tempChk=true; S.flags.tempRechk=true; toast("세로 · 가로 접착 PV = SV 확인","good"); break;
    case "fl_ibc0": case "fl_ibc1": case "fl_ibc2": { const i=+id.slice(-1); if(i===1){ toast("이송기 2는 사용하지 않습니다 (주성분은 스쿱 수동 투입).","bad"); f.ibc[1]=false; break; } f.ibc[i]=!f.ibc[i]; toast("이송기 "+(i+1)+" "+(f.ibc[i]?"ON":"OFF")); break; }
    case "fl_visChk": f.visChk=true; toast("비전 Setup 값 확인","good"); break;
    case "fl_vision": f.vision=!f.vision; toast("비전 "+(f.vision?"ON":"OFF")); break;
    case "fl_noop": break;
    /* 스틱공급장치 */
    case "sf_servo": p.sfServo=!p.sfServo; break;
    case "sf_feed": p.sfFeed=!p.sfFeed; break;
    case "sf_off": if(p.sfRun){ toast("가동 중입니다. 먼저 STOP.","bad"); return; } p.sfShut=1; break;
    case "sf_yes": p.sfShut=2; p.sfUser=false; toast("스틱공급장치 종료 — Current application","good"); break;
    case "sf_no": p.sfShut=0; break;
    /* 카토너 */
    case "ct_i0": case "ct_i1": case "ct_i2": { const i=+id.slice(-1); p.ctIcons=p.ctIcons||[false,false,false]; p.ctIcons[i]=!p.ctIcons[i]; p.ctIcon=p.ctIcons.every(x=>x); break; }
    /* 케이스 프린터 */
    case "pr_edit": hScr="edit"; break;
    case "pr_home": hScr="main"; break;
    case "pr_search": hScr="search"; break;
    case "pr_lot": p.lbl.lot=EXPECT.lot; p.lbl.saved=false; toast("LOT : "+EXPECT.lot+" (포장지시기록서)"); break;
    case "pr_exp": p.lbl.exp=EXPECT.exp; p.lbl.saved=false; toast("EXP : "+EXPECT.exp+" (포장지시기록서)"); break;
    case "pr_save": if(!p.lbl.lot||!p.lbl.exp){ toast("LOT · EXP 를 모두 입력하세요.","bad"); return; } p.lbl.saved=true; toast("라벨 저장","good"); hScr="main"; break;
    case "pr_load": if(!p.lbl.saved){ toast("저장된 라벨이 없습니다. 먼저 편집 · 저장하세요.","bad"); return; } p.lbl.loaded=true; toast("EXP-LOT.lbl 불러오기","good"); hScr="main"; break;
    case "pr_start": if(!p.lbl.loaded){ toast("인쇄할 라벨을 먼저 불러오세요.","bad"); return; } p.prRun=true; toast("인쇄 시작","good"); break;
    case "pr_stop": p.prRun=false; toast("중지 → 시퀀스 꺼짐 → 유휴 상태"); S.flags.prSeqOff=true; break;
    case "pr_test": if(p.nozzleBad||p.ink<5){ toast("테스트 인쇄 — 흐림 (노즐 · 잉크 점검 필요)","bad"); } else { toast("테스트 인쇄 — 선명","good"); S.flags.prTest=true; } break;
    /* 비전 */
    case "vs_mode": p.vsMode=true; toast("모드 선택 : 판콜H EXP-LOT"); break;
    case "vs_start": p.vsRun=true; toast("비전 시작 — 실행 중","good"); break;
    case "vs_stop": p.vsRun=false; toast("비전 정지 (I/O 제어 비활성)"); break;
    case "vs_off": if(p.vsRun){ toast("먼저 정지하세요.","bad"); return; } p.vsUser=false; p.vsMode=false; S.flags.vsOff=true; toast("로그오프 · 비전 종료"); break;
    /* X-ray */
    case "xr_pre": p.xrPre=true; toast("예약 선택 : pancold-h"); break;
    case "xr_x": if(!p.xrKey){ toast("X선 출력 키 스위치를 먼저 ON 하세요.","bad"); return; } if(!p.xrPre){ toast("예약(품목)을 먼저 선택하세요.","bad"); return; } p.xrX=!p.xrX; if(!p.xrX){ p.xrCal=false; p.xrConv=false; } toast("X선 "+(p.xrX?"조사":"정지")); break;
    case "xr_cal": if(!p.xrX){ toast("X선을 먼저 켜세요.","bad"); return; } p.xrCal=true; toast("캘리브레이션 완료","good"); break;
    case "xr_conv": if(!p.xrCal){ toast("캘리브레이션을 먼저 하세요.","bad"); return; } p.xrConv=!p.xrConv; toast("콘베어 "+(p.xrConv?"가동":"정지")); break;
    case "xr_test": if(!p.xrConv){ toast("콘베어를 먼저 가동하세요.","bad"); return; } p.xrTest=true; p.xrTestT=tSim; toast("테스트 운전 — 'T' 표시 · 전량 NG 판정 확인","good"); break;
    case "xr_reset": S.flags.xrBlink=0; S.flags.xrReset=true; toast("리셋 — 적색 램프 · 부저 정지"); break;
    case "xr_end": p.xrConv=false; p.xrX=false; p.xrSaved=true; toast("종료 · 이력 저장","good"); break;
    /* 중량선별기 */
    case "cw_prod": hScr="prod"; break;
    case "cw_back": hScr="main"; break;
    case "cw_sel": p.cwProd=true; hScr="main"; toast("품종전환 : 002 판콜H (기준 105.5 g)","good"); break;
    case "cw_chk": if(!p.cwProd){ toast("품종을 먼저 전환하세요.","bad"); return; } p.cwChk=true; toast("기준 105.5 g · 하한 −2.0 · 상한 +2.0 확인","good"); break;
    case "cw_home": hScr="main"; break;
  }
  drawHMI(); renderTiles(); stepCheck();
}
function bindPanelBtns(){
  const f=S.f, p=S.p, on=(id,fn)=>{ const e=$("#"+id); if(e) e.onclick=()=>{ fn(); drawHMI(); renderTiles(); stepCheck(); }; };
  on("swRun",()=>{ if(f.run) return; if(p.align&&!f.started&&S.room==="F"){ deduct("alignOn"); } if(fillerRun()) toast("RUN — 자동 운전","good"); });
  on("swStop",()=>{ fillerStop(); f.stoppedOnce=true; toast("STOP — 0 위치 정지"); });
  on("swJog",()=>{ if(f.run){ toast("운전 중입니다."); return; } const b=fillerBlockers().filter(x=>!/후 공정/.test(x)); if(b.length){ toast("JOG 조건 미충족\n"+b[0],"bad"); return; } f.run=true; f.jogOne=true; f.phase=0.5; toast("JOG — 한 스텝 작동"); });
  on("swReset",()=>{ fillerReset(); f.resetOnce=true; if(S.recovery&&!tripAlarms().length) S.recovery.reset=true; toast(tripAlarms().length?"원인이 남아 있어 해제되지 않은 알람이 있습니다.":"RESET — 알람 해제",tripAlarms().length?"bad":"good"); });
  on("swFill",()=>{ f.filling=!f.filling; toast("FILLING "+(f.filling?"ON — 내용물 충전":"OFF")); });
  on("swBuz",()=>{ f.buzzer=!f.buzzer; });
  on("swEmg",()=>{ f.emg=!f.emg; if(f.emg){ if(!S.activeTrouble) deduct("emg"); f.run=false; p.ctRun=false; p.sfRun=false; raise("EMG"); toast("비상정지!","bad"); } else toast("비상정지 해제 — RESET 후 재가동"); });
  on("sfStart",()=>{ if(!p.sfUser){ toast("로그인이 필요합니다.","bad"); return; } if(!(p.sfServo&&p.sfFeed)){ toast("서보 전원 공급 · 제품 공급 아이콘을 먼저 활성화하세요.","bad"); return; } p.sfRun=true; toast("스틱공급장치 START","good"); });
  on("sfStop",()=>{ p.sfRun=false; toast("스틱공급장치 STOP"); });
  on("sfReset",()=>{ p.sfReset=true; toast("스틱공급장치 RESET"); });
  on("ctStart",()=>{ const b=ctBlockers(); if(b.length){ toast("START 조건 미충족\n"+b[0],"bad"); deduct("startBad"); return; } p.ctRun=true; toast("카토너 START","good"); });
  on("ctStop",()=>{ p.ctRun=false; toast("카토너 STOP"); });
  on("ctReset",()=>{ p.ctReset=true; toast("카토너 RESET"); });
  on("cwStart",()=>{ if(!p.cwProd){ toast("품종을 먼저 전환하세요.","bad"); return; } p.cwRun=true; toast("중량선별기 START — 녹색 램프","good"); });
  on("cwStop",()=>{ p.cwRun=false; toast("중량선별기 STOP — 빨간 램프"); });
  on("cwHome",()=>{ hScr="main"; });
}
/* 로그인 · 탭 · 화면 경로 (힌트 · 자동재생용) */
function hmiRoute(mk,scr,target){
  if(hMach!==mk) return HMT(mk);
  if(!machPower(mk)) return null;
  const needLogin={fl:()=>!S.f.user,sf:()=>!S.p.sfUser,ct:()=>!S.p.ctUser,vs:()=>!S.p.vsUser}[mk];
  if(needLogin&&needLogin()) return HB(mk+"_login");
  if(scr&&hScr!==scr){ if(mk==="fl") return HNV(scr); if(mk==="pr") return HB(scr==="edit"?"pr_edit":scr==="search"?"pr_search":"pr_home"); if(mk==="cw") return HB(scr==="prod"?"cw_prod":"cw_back"); }
  return target;
}
