/* ═══════════════════════════════════════════════════════════════════
   HMI — 기종별 터치 패널 (로그인 · 주화면 · 설정 · 알람/이력 · 정보)
   ═══════════════════════════════════════════════════════════════════ */
let hMach="ua", hScr="main", lgOpen=false;
const HTABS=[["ua","UA-120","언스크램블러"],["sg","SG-120","실리카겔"],["dmc","DMC-60T","정제 계수기"],["wc","중량선별","PLC · 로드셀"],["pe","HPE-100","PE 필름"],["rc","RCS-120","캡핑기"]];
const HB=id=>'#hBody [data-hb="'+id+'"]';
const HMT=k=>'#hTabs [data-mt="'+k+'"]';
const HNV=k=>'#hNav [data-nav="'+k+'"]';
const btn=(on,nm,en,e,id,dis,warn)=>'<div class="hb'+(on?" on":"")+(dis?" dis":"")+(warn?" warn":"")+'" data-hb="'+id+'"><span class="e">'+e+'</span>'+nm+'<s>'+en+'</s></div>';
const row=(nm,en,v)=>'<div class="hrow"><div class="lb">'+nm+'<s>'+en+'</s></div>'+v+'</div>';
const pv=(v,bad)=>'<div class="hval pv'+(bad?" bad":"")+'">'+v+'</div>';
const ed=(v,id)=>'<div class="hval edit" data-ed="'+id+'">'+v+'</div>';
const sec=t=>'<div class="hsec">'+t+'</div>';
const kc=(v,t,cls)=>'<div class="kcard'+(cls?" "+cls:"")+'"><b>'+v+'</b><s>'+t+'</s></div>';
function mStatus(mk){
  const al=alarmOf(mk).concat(alarmOf("line"));
  if(al.some(a=>ALARMS[a.key].kind==="trip")) return '<span class="st2 alm">알람</span>';
  return S.running?'<span class="st2 run">운전 중</span>':'<span class="st2">정지</span>';
}

function drawHMI(){
  if(!S) return;
  const m=machOf(hMach);
  $("#hMach").textContent=m?m.md:"";
  $("#hTabs").innerHTML=HTABS.map(([k,md,nm])=>{
    const al=alarmOf(k), trip=al.some(a=>ALARMS[a.key].kind==="trip");
    return '<div class="mtab'+(hMach===k?" on":"")+(al.length?" warn":"")+'" data-mt="'+k+'">'+md+'<s>'+nm+'</s><i class="'+(trip?"alm":S.running?"run":"")+'"></i></div>';
  }).join("");
  $$("#hTabs [data-mt]").forEach(e=>e.onclick=()=>{ hMach=e.dataset.mt; hScr="main"; drawHMI(); });
  const body=$("#hBody"), nav=$("#hNav");
  if(!S.main){ body.innerHTML='<div class="offScr"><b>화면 꺼짐</b>메인 전원을 투입하면 기종별 제어 프로그램이 부팅됩니다.</div>'; nav.innerHTML=""; hmiAfter(); return; }
  if(!S.user){ body.innerHTML=loginScreen(); nav.innerHTML=""; bindLogin(); hmiAfter(); return; }
  const navs=[["main","🏠","주화면","MAIN"],["set","⚙","설정","SETTING"],["log",hMach==="wc"?"📊":"⚠",hMach==="wc"?"판정 이력":"알람",hMach==="wc"?"LOG":"ALARM"],["info","ⓘ","정보","INFO"]];
  nav.innerHTML=navs.map(n=>'<div class="nv'+(hScr===n[0]?" on":"")+'" data-nav="'+n[0]+'"><span class="e">'+n[1]+'</span>'+n[2]+'<s>'+n[3]+'</s></div>').join("");
  $$("#hNav [data-nav]").forEach(e=>e.onclick=()=>{ hScr=e.dataset.nav; drawHMI(); });
  const scr=(SCREENS[hMach]||{})[hScr]||SCREENS.common[hScr];
  body.innerHTML=scr?scr():"";
  $$("#hBody [data-hb]").forEach(e=>e.onclick=()=>hbClick(e.dataset.hb));
  $$("#hBody [data-ed]").forEach(e=>e.onclick=()=>edClick(e.dataset.ed));
  hmiAfter();
}
function hmiAfter(){
  const t=$("#hAlarmTick"), al=S.alarms.slice(-2).reverse();
  t.innerHTML=al.map(a=>esc(a.key+" "+ALARMS[a.key].t)).join("<br>");
  if(typeof applyHint==="function") applyHint();
}
/* ── 로그인 ── */
function loginScreen(){
  const m=machOf(hMach);
  return '<div class="lgWrap"><div class="lgBrand">COUN<u>TEC</u><s>'+esc(m.md+" · "+m.nm)+'</s></div>'+
   (lgOpen?'<div class="lgCard"><div class="lgT">🔑 로그인 · LOGIN</div>'+
     '<div class="lgIn"><b>아이디</b><input class="inp" id="lgId" autocomplete="off" spellcheck="false"></div>'+
     '<div class="lgIn"><b>비밀번호</b><input class="inp" id="lgPw" type="password" autocomplete="off"></div>'+
     '<button class="lgBtn" id="lgOk">로그인 (LOGIN)</button>'+
     '<div class="lgHint">아이디 PK2 · 비밀번호 1234 (SUPERVISOR) · 로그인은 6기종 공통 적용</div></div>'
   :'<div class="lgLock"><button id="lgKey" title="로그인">🔑</button><div class="lgLockT">열쇠 아이콘을 눌러 로그인하세요</div><div class="lgLockS">라인 공통 계정 · 설정 변경은 SUPERVISOR 권한</div></div>')+'</div>';
}
function bindLogin(){
  const k=$("#lgKey"); if(k) k.onclick=()=>{ lgOpen=true; drawHMI(); };
  const i=$("#lgId"), p=$("#lgPw");
  if(i){ i.value="PK2"; p.value="1234"; $("#lgOk").onclick=doLogin; }
}
function doLogin(){
  const id=($("#lgId")||{}).value||"", pw=($("#lgPw")||{}).value||"";
  const acc=ACCOUNTS.find(a=>a.id.toLowerCase()===id.trim().toLowerCase());
  if(!acc||acc.pw!==pw){ toast("아이디 또는 비밀번호가 올바르지 않습니다.","bad"); if(typeof deduct==="function") deduct("login","로그인 실패"); return; }
  S.user=acc; S.lvl=acc.lvl; lgOpen=false; hScr="main";
  toast("로그인 : "+acc.id+" ("+acc.nm+")","good"); drawHMI(); stepCheck();
}

/* ═══ 화면 정의 ═══ */
const SCREENS={
 common:{
  log(){ const al=alarmOf(hMach).concat(alarmOf("line"));
    return '<div class="hTitle">⚠ 알람 <s>ALARM · '+esc(machOf(hMach).md)+'</s>'+mStatus(hMach)+'</div>'+
     sec("현재 알람")+'<div class="alist">'+(al.length?al.map(a=>'<div class="'+ALARMS[a.key].kind+'">'+a.key+' · '+esc(ALARMS[a.key].t)+'</div>').join(""):'<div class="ok">현재 알람 없음</div>')+'</div>'+
     sec("알람 이력")+'<div class="alist">'+(S.hist.filter(h=>ALARMS[h.key].mk===hMach||ALARMS[h.key].mk==="line").slice(0,14).map(h=>'<div class="'+ALARMS[h.key].kind+'">'+mmss(h.at)+' '+h.key+' '+esc(h.t)+'</div>').join("")||'<div class="ok">이력 없음</div>')+'</div>'; },
  info(){ const m=machOf(hMach), devs=DEVICES.filter(d=>d.k===hMach);
    return '<div class="hTitle">ⓘ '+esc(m.md)+' <s>'+esc(m.en)+'</s></div><div class="hrow" style="display:block;line-height:1.6;font-size:14.5px">'+esc(m.d)+'</div>'+
     sec("주요 장치")+devs.map(d=>'<div class="hrow" style="cursor:pointer" data-hb="dev_'+d.n+'"><div class="lb">'+d.n+'. '+esc(d.nm)+'<s>'+esc(d.en)+'</s></div><span style="font-size:13px;color:#1b57c4">설명 ›</span></div>').join(""); }
 },
 ua:{
  main(){ const u=S.ua;
    return '<div class="hTitle">🧴 주화면 <s>UA-120 · MAIN</s>'+mStatus("ua")+'</div>'+
     '<div class="kpis">'+kc(S.running?S.bpm:0,"공급 속도 (병/분)","hi")+kc(LN.tt.n,"턴테이블 병")+kc(Math.round(matPct("bottle"))+"%","호퍼 레벨",matPct("bottle")<15?"ng":"")+'</div>'+
     sec("세척 (2회 : 이온 에어 → 진공)")+
     '<div class="hGrid2">'+btn(u.air,"이온 에어","IONIZED AIR","💨","ua_air")+btn(u.vac,"진공 흡입","VACUUM","🌀","ua_vac")+'</div>'+
     row("세척 에어 압력","AIR PRESSURE",pv(fmt(S.air?Math.min(S.airP,4.5):0,1)+" bar"))+
     row("공급 병 수","BOTTLES FED",pv(LN.fed))+
     row("병 규격 (자동 조정)","BOTTLE SIZE",pv(BD().ml+" ml · Ø"+BD().d)); },
  set(){ return '<div class="hTitle">⚙ 설정 <s>UA-120 · SETTING</s></div>'+
     row("공급 속도","FEED SPEED 20~120 병/분",ed(S.bpm+" 병/분","bpm"))+
     row("병 지름 / 높이","자동 (교체부품 불필요)",pv(BD().d+" / "+BD().h+" mm"))+
     row("사이드 벨트 폭","BELT GAP",pv((BD().d+14)+" mm"))+
     row("반전 구간","INVERT SECTION",pv("180° · 세척 2회"))+
     '<div class="hrow" style="display:block;font-size:13px;line-height:1.6;color:#5d7086">턴테이블 병이 줄면 호퍼 엘리베이터가 자동으로 보충합니다 (On-demand).</div>'; }
 },
 sg:{
  main(){ return '<div class="hTitle">🟫 주화면 <s>SG-120 · MAIN</s>'+mStatus("sg")+'</div>'+
     '<div class="kpis">'+kc(S.sg.fed,"투입 수","hi")+kc(Math.round(matPct("gel"))+"%","릴 잔량",matPct("gel")<10?"ng":"")+kc(BD().gel+" g","파우치 규격")+'</div>'+
     '<div class="hGrid2">'+btn(false,"커터 원점","CUTTER HOME","✂","sg_home")+btn(S.sg.sensor,"마크 센서","MARK SENSOR","👁","sg_sensor")+'</div>'+
     row("파우치 피치","POUCH PITCH",pv(S.sg.pitch+" mm"))+
     row("마크 센서 상태","SENSOR",pv(S.sg.markBad?"위치 이상":"정상",S.sg.markBad)); },
  set(){ return '<div class="hTitle">⚙ 설정 <s>SG-120 · SETTING</s></div>'+
     row("파우치 피치","POUCH PITCH 30~60 mm",ed(S.sg.pitch+" mm","sg_pitch"))+
     row("투입 개수","POUCH / BOTTLE",pv("1 개"))+
     row("플런저 스트로크","PLUNGER",pv("자동 (병 높이)")); }
 },
 dmc:{
  main(){ const D=LN.dmc, r=dmcRate()*12*60, N=S.rc.n;
    const mx=Math.max(1,...S.dmc.cnt);
    return '<div class="hTitle">💊 주화면 <s>DMC-60T · MAIN</s>'+mStatus("dmc")+'</div>'+
     '<div class="kpis">'+kc(S.recipeApplied?N:"-","설정 계수 (정)","hi")+kc(S.running?Math.round(r):0,"계수 속도 (정/분)")+kc(S.cnt.filled,"충전 병 수")+'</div>'+
     '<div class="kpis">'+kc(D?D.buf[0]+" / "+N:"-","게이트 A (상류)")+kc(D?D.buf[1]+" / "+N:"-","게이트 B (하류)")+kc(Math.round(matPct("tab"))+"%","호퍼 레벨",matPct("tab")<10?"ng":"")+'</div>'+
     sec("채널별 계수 (12 트랙) · 주황 = 센서창 오염")+
     '<div class="chBars">'+S.dmc.cnt.map((c,i)=>'<div class="'+(S.dmc.dirt[i]>0.6?"dirty":"")+'" style="height:'+Math.max(4,c/mx*100)+'%"><span>'+(i+1)+'</span></div>').join("")+'</div>'+
     '<div class="hGrid3">'+btn(S.recipeApplied,"레시피 적용","APPLY RECIPE","📋","dmc_recipe")+btn(S.dmc.checked,"진동·계수 확인","CHECK SETTING","✔","dmc_check")+btn(false,"센서창 청소","CLEAN SENSOR","🧽","dmc_clean",false,Math.max(...S.dmc.dirt)>0.6)+'</div>'; },
  set(){ const v=S.dmc.vib;
    return '<div class="hTitle">⚙ 설정 <s>DMC-60T · SETTING</s></div>'+
     row("레시피","RECIPE",pv(S.rc.label))+
     row("1단 진동","TRAY 1 %",ed(v[0]+" %","vib0"))+
     row("2단 진동","TRAY 2 %",ed(v[1]+" %","vib1"))+
     row("3단 진동 (트랙)","TRAY 3 %",ed(v[2]+" %","vib2"))+
     row("게이트 지연","GATE DELAY",ed(fmt(S.dmc.gateDelay,2)+" s","gate"))+
     '<div class="hrow" style="display:block;font-size:13px;line-height:1.6;color:#5d7086">권장 : 1단 &lt; 2단 &lt; 3단 (정제가 뒤로 갈수록 빨라져 한 줄로 벌어짐) · 3단 92 % 초과 시 겹침(더블) 증가</div>'; }
 },
 wc:{
  main(){ const w=S.wc, rc=S.rc, st1=LN.st.lc1, st2=LN.st.lc2;
    const tR=w.lastTare, gR=w.gross;   /* 안정된 측정값 (계량 중 흔들림 제외) */
    const ng=w.judge==="NG";
    return '<div class="hTitle">⚖ 중량선별 <s>중량선별 PLC · MAIN</s>'+mStatus("wc")+'</div>'+
     '<div class="kpis">'+kc(tR!=null?fmt(tR,2)+" g":"-","전단 (빈병)")+kc(gR!=null?fmt(gR,2)+" g":"-","후단 (총중량)")+kc(w.net!=null?fmt(w.net,3)+" g":"-","순중량",ng?"ng":"hi")+'</div>'+
     '<div class="kpis">'+kc(w.judge||"-","최근 판정",ng?"ng":"")+kc(w.nOK+" / "+w.nNG,"합격 / 불합격")+kc(w.nNet?fmt(w.sumNet/w.nNet,3)+" g":"-","순중량 평균")+'</div>'+
     sec("기준 ("+esc(rc.label)+")")+
     row("기준 순중량","NET STD",pv(fmt(rc.netStd,3)+" g"))+
     row("허용오차","±"+rc.tol+" 정 × "+rc.prod.unit+" mg",pv("± "+fmt(rc.netTol,3)+" g"))+
     row("빈병 기준 (병+실리카겔)","TARE STD",pv(fmt(rc.tareStd,2)+" ± "+fmt(rc.tareTol,2)+" g"))+
     '<div class="hGrid3">'+btn(w.zero[0],"전단 영점","ZERO · PRE","0️⃣","wc_zero1")+btn(w.zero[1],"후단 영점","ZERO · POST","0️⃣","wc_zero2")+btn(w.checked,"기준 확인","CHECK STD","✔","wc_check")+'</div>'; },
  set(){ const w=S.wc;
    return '<div class="hTitle">⚙ 설정 <s>중량선별 PLC · SETTING</s></div>'+
     row("전단 로드셀 영점 오프셋","PRE ZERO",pv(fmt(w.off[0],3)+" g",Math.abs(w.off[0])>0.02))+
     row("후단 로드셀 영점 오프셋","POST ZERO",pv(fmt(w.off[1],3)+" g",Math.abs(w.off[1])>0.02))+
     row("연속 불합격 정지","CONSECUTIVE NG",pv("3 병"))+
     row("리젝트함","REJECT BIN",pv(S.reject.n+" / "+S.reject.cap+" 병",S.reject.n>=S.reject.cap))+
     row("허용오차 규칙","TOLERANCE RULE",pv("≤30T ±0.5 · ≤300T ±1 · ≤500T ±2 · 1000T ±5"))+
     '<div class="hrow" style="display:block;font-size:13px;line-height:1.6;color:#5d7086">순중량 = 후단 총중량 − 전단 빈병 중량. 두 로드셀의 영점이 틀어지면 정상 병도 불합격될 수 있으므로 생산 전 반드시 영점을 잡습니다.</div>'; },
  log(){ const L2=S.wc.log.slice(0,16);
    return '<div class="hTitle">📊 판정 이력 <s>CHECK-WEIGH LOG</s></div>'+
     '<table class="ht"><tr><th>No</th><th>빈병 g</th><th>총중량 g</th><th>순중량 g</th><th>편차(정)</th><th>판정</th></tr>'+
     (L2.map(r=>'<tr class="'+(r.ok?"":"ng")+'"><td>'+r.no+'</td><td>'+fmt(r.tare,2)+'</td><td>'+fmt(r.gross,2)+'</td><td>'+fmt(r.net,3)+'</td><td>'+(r.dev>=0?"+":"")+fmt(r.dev,2)+'</td><td>'+(r.ok?"OK":"NG · "+esc(r.why))+'</td></tr>').join("")||'<tr><td colspan="6">판정 기록 없음</td></tr>')+'</table>'; }
 },
 pe:{
  main(){ const P=S.pe, pct=clamp((P.pv-20)/(P.sv-20)*100,0,100);
    return '<div class="hTitle">🎞️ 주화면 <s>HPE-100 · MAIN</s>'+mStatus("pe")+'</div>'+
     '<div class="kpis">'+kc(Math.round(P.pv)+" ℃","커터 온도 PV",P.pv<P.sv-10?"ng":"hi")+kc(P.sv+" ℃","설정 SV")+kc(Math.round(matPct("film"))+"%","필름 잔량",matPct("film")<10?"ng":"")+'</div>'+
     '<div class="gauge"><i style="width:'+pct+'%"></i></div>'+
     '<div class="hGrid2">'+btn(P.heat,"가열 커터","HOT CUTTER","🔥","pe_heat")+btn(P.sensor,"필름 센서","FILM SENSOR","👁","pe_sensor")+'</div>'+
     row("투입 수","INSERTED",pv(P.fed))+
     row("필름 길이","FILM LENGTH",pv(P.len+" mm")); },
  set(){ return '<div class="hTitle">⚙ 설정 <s>HPE-100 · SETTING</s></div>'+
     row("커터 온도 SV","150~190 ℃",ed(S.pe.sv+" ℃","pe_sv"))+
     row("필름 길이","40~80 mm",ed(S.pe.len+" mm","pe_len"))+
     '<div class="hrow" style="display:block;font-size:13px;line-height:1.6;color:#5d7086">커터 온도가 SV −10 ℃ 이상이어야 운전됩니다.</div>'; }
 },
 rc:{
  main(){ const r=S.rcp, b=BD();
    return '<div class="hTitle">⚪ 주화면 <s>RCS-120 · MAIN</s>'+mStatus("rc")+'</div>'+
     '<div class="kpis">'+kc(r.torque+" kgf·cm","체결 토크 설정","hi")+kc(LN.rc.chute,"슈트 캡")+kc(Math.round(matPct("cap"))+"%","캡 호퍼",matPct("cap")<10?"ng":"")+'</div>'+
     '<div class="kpis">'+kc(S.table.n+" / "+S.table.cap,"집적 테이블")+kc(S.cnt.good,"캡핑 완료")+kc(b.capD+" mm","캡 규격")+'</div>'+
     '<div class="hGrid2">'+btn(r.feed,"캡 공급","CAP FEED","⚪","rc_feed")+btn(r.checked,"토크 확인","CHECK TORQUE","✔","rc_check")+'</div>'+
     row("권장 토크 ("+b.capD+" mm)","RECOMMENDED",pv(torqueRange().join(" ~ ")+" kgf·cm")); },
  set(){ return '<div class="hTitle">⚙ 설정 <s>RCS-120 · SETTING</s></div>'+
     row("체결 토크","6~25 kgf·cm",ed(S.rcp.torque+" kgf·cm","rc_torque"))+
     row("헤드 수","HEADS",pv("4 헤드 · 서보"))+
     row("권장 범위","RECOMMENDED",pv(torqueRange().join(" ~ ")+" kgf·cm")); }
 }
};
function torqueRange(){ const c=BD().capD; return c<=30?[10,14]:c<=38?[14,18]:[16,20]; }

/* ═══ 버튼 동작 ═══ */
function hbClick(id){
  if(typeof examGate==="function"&&!examGate("hb",id)) return;
  if(id.startsWith("dev_")){ openDev(+id.slice(4)); return; }
  const need=lv=>{ if(S.lvl<lv){ toast("권한이 부족합니다 (SUPERVISOR 필요).","bad"); return false; } return true; };
  switch(id){
    case "ua_air": S.ua.air=!S.ua.air; toast("이온 에어 "+(S.ua.air?"ON":"OFF")); break;
    case "ua_vac": S.ua.vac=!S.ua.vac; toast("진공 흡입 "+(S.ua.vac?"ON":"OFF")); break;
    case "sg_home": if(S.running){ toast("운전 중에는 할 수 없습니다.","bad"); return; } toast("커터 원점 복귀 완료"); S.flags.sgHome=true; break;
    case "sg_sensor": S.sg.sensor=!S.sg.sensor; toast("마크 센서 "+(S.sg.sensor?"ON":"OFF")); break;
    case "dmc_recipe":
      if(S.running){ toast("운전 중에는 레시피를 바꿀 수 없습니다.","bad"); return; }
      if(!need(3)) return;
      applyRecipe(); toast("레시피 적용 : "+S.rc.label+"\n계수 "+S.rc.n+" 정 · 허용오차 ±"+S.rc.tol+" 정","good"); break;
    case "dmc_check": S.dmc.checked=true; toast("진동 1·2·3단 "+S.dmc.vib.join(" / ")+" % · 게이트 지연 "+S.dmc.gateDelay+" s 확인","good"); break;
    case "dmc_clean":
      if(S.running){ toast("운전 중에는 센서창을 청소할 수 없습니다. 먼저 STOP.","bad"); return; }
      if(typeof startWork==="function"&&!startWork("tab",()=>{ S.dmc.dirt.fill(0); clearAlarm("DM32"); toast("센서창 12채널 청소 완료","good"); stepCheck(); },{reach:[-800,1400,-120],carry:null,dur:2.6})) toast("작업자가 다른 작업 중입니다.");
      break;
    case "wc_zero1": case "wc_zero2": {
      const i=id==="wc_zero1"?0:1, st=LN.st[i?"lc2":"lc1"];
      if(st&&st.ph!=="wait"||LN.bottles.some(b=>b.zone==="line"&&Math.abs(pathAt(b.s).x-(i?L.lc2:L.lc1))<L.lcW/2)){ toast("로드셀 위에 병이 없을 때 영점을 잡으세요.","bad"); return; }
      S.wc.off[i]=0.001*gauss(); S.wc.zero[i]=true; if(S.wc.zero[0]&&S.wc.zero[1]) clearAlarm("WC44");
      toast((i?"후단":"전단")+" 로드셀 영점 완료 (0.000 g)","good"); break; }
    case "wc_check": S.wc.checked=true; toast("기준 순중량 "+fmt(S.rc.netStd,3)+" g · 허용 ±"+fmt(S.rc.netTol,3)+" g 확인","good"); break;
    case "pe_heat": S.pe.heat=!S.pe.heat; toast("가열 커터 "+(S.pe.heat?"ON — 승온 중":"OFF")); break;
    case "pe_sensor": S.pe.sensor=!S.pe.sensor; break;
    case "rc_feed": S.rcp.feed=!S.rcp.feed; toast("캡 공급 "+(S.rcp.feed?"ON":"OFF")); break;
    case "rc_check": { const r=torqueRange(); S.rcp.checked=true; S.flags.torqueRechk=true;
      if(S.rcp.torque<r[0]||S.rcp.torque>r[1]) toast("토크 "+S.rcp.torque+" kgf·cm — 권장 "+r.join("~")+" 범위를 벗어났습니다.","bad");
      else toast("체결 토크 "+S.rcp.torque+" kgf·cm 확인 (권장 "+r.join("~")+")","good"); break; }
  }
  drawHMI(); stepCheck();
}
function applyRecipe(){
  S.recipeApplied=true;
  S.wc.checked=false; S.dmc.checked=false; S.rcp.checked=false;
  LN.dmc&&(LN.dmc.buf=[0,0],LN.dmc.hold=[false,false]);
  const r=torqueRange(); S.rcp.torque=Math.round((r[0]+r[1])/2);
}

/* ── 값 입력 (숫자 키패드) ── */
let numCtx=null, numBuf="";
function askNum(title,range,cur,dec,cb){
  numCtx={cb,dec,range}; numBuf="";
  $("#numT").textContent=title; $("#numR").textContent="설정 범위 : "+range[0]+" ~ "+range[1];
  $("#numV").value=dec?fmt(cur,dec):String(cur); $("#mNum").classList.add("on");
}
function edClick(id){
  if(typeof examGate==="function"&&!examGate("ed",id)) return;
  if(S.lvl<3){ toast("설정 변경은 SUPERVISOR 권한이 필요합니다.","bad"); return; }
  const E2={
    bpm:["공급 속도 (병/분)",[20,120],()=>S.bpm,v=>{S.bpm=v; syncBpm();},0],
    sg_pitch:["파우치 피치 (mm)",[30,60],()=>S.sg.pitch,v=>S.sg.pitch=v,0],
    vib0:["1단 진동 (%)",[10,100],()=>S.dmc.vib[0],v=>S.dmc.vib[0]=v,0],
    vib1:["2단 진동 (%)",[10,100],()=>S.dmc.vib[1],v=>S.dmc.vib[1]=v,0],
    vib2:["3단 진동 (%)",[10,100],()=>S.dmc.vib[2],v=>S.dmc.vib[2]=v,0],
    gate:["게이트 지연 (s)",[0.05,0.5],()=>S.dmc.gateDelay,v=>S.dmc.gateDelay=v,2],
    pe_sv:["커터 온도 SV (℃)",[150,190],()=>S.pe.sv,v=>S.pe.sv=v,0],
    pe_len:["필름 길이 (mm)",[40,80],()=>S.pe.len,v=>S.pe.len=v,0],
    rc_torque:["체결 토크 (kgf·cm)",[6,25],()=>S.rcp.torque,v=>{S.rcp.torque=v; S.rcp.torqueBad=false;},0]
  };
  const e=E2[id]; if(!e) return;
  askNum(e[0],e[1],e[2](),e[4],v=>{ e[3](v); drawHMI(); stepCheck(); });
}
function initKeypad(){
  const k=$("#numKeys");
  ["7","8","9","4","5","6","1","2","3",".","0","←"].forEach(c=>{
    const d=document.createElement("div"); d.textContent=c;
    d.onclick=()=>{ if(c==="←") numBuf=numBuf.slice(0,-1); else if(numBuf.length<7) numBuf+=c; $("#numV").value=numBuf||"0"; };
    k.appendChild(d);
  });
  $("#numOk").onclick=()=>{
    if(!numCtx) return;
    let v=parseFloat(numBuf===""?$("#numV").value:numBuf);
    if(isNaN(v)){ $("#mNum").classList.remove("on"); return; }
    if(v<numCtx.range[0]||v>numCtx.range[1]){ toast("설정 범위를 벗어났습니다 ("+numCtx.range[0]+"~"+numCtx.range[1]+")","bad"); return; }
    numCtx.cb(numCtx.dec?parseFloat(v.toFixed(numCtx.dec)):Math.round(v));
    $("#mNum").classList.remove("on"); numCtx=null;
  };
  $("#numNo").onclick=()=>{ $("#mNum").classList.remove("on"); numCtx=null; };
}
/* 로그인 · 탭 · 화면 경로 (자동재생 · 힌트용) : 다음에 누를 곳 */
function hmiRoute(mk,scr,target){
  if(!S.main) return "#uMain";
  if(!S.user) return lgOpen?"#lgOk":"#lgKey";
  if(hMach!==mk) return HMT(mk);
  if(scr&&hScr!==scr) return HNV(scr);
  return target;
}
