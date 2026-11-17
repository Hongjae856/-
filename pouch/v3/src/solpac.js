/* ═══════════════════════════════════════════════════════════════════
   파우치 충전기 터치스크린 — SOLPAC (Weintek) 화면 재현 (11/16 사용자 제공 충전기 SOP 의 화면 사진 · 설명 기준)
   · 가로형 화면 : 위 SOLPAC 머리줄(화면 이름 · Speed · Cam · 날짜) / 본문 / 알람 줄 + Logout · 공포 · 마크 / 아래 메뉴 11개
   · 메뉴 : 운전데이터 · 캠 포지션(1 → 2) · 이음매 · 수동점검 · 조작스위치(1 → 2) · 온도설정 · 이송기설정 · 품목저장 · Input/Output · 알람목록 · 주변기기(→ 비전 Setup)
   · 설정값 = SOP 화면 사진 값 그대로 (사용자 결정 11/16). 품목저장 · Input/Output · 주변기기는 SOP 에 사진이 없어 구성 추정 (확인 필요)
   · 'IDT 확인' 칩은 실제 화면에 없는 교육용 확인 버튼
   ═══════════════════════════════════════════════════════════════════ */
let SPBIG=false;   /* 11/16 : HMI 를 어떤 방식으로도 띄우지 않음 (사용자 지시) — 크게 보기 삭제 */   /* 3인칭 옆 패널에서 화면을 왼쪽으로 넓혀 크게 보기 (⤢) */
const SNAV=[["run","운전데이터","☰"],["cam","캠 포지션","⌖"],["splice","이음매","▨"],["manual","수동점검","🔍"],["sw1","조작스위치","☝"],["temp","온도설정","🌡"],["xfer","이송기설정","⚡"],["save","품목저장","⬇","off"],["io","Input/<br>Output","I/O"],["alarm","알람목록","🔔"],["aux","주변기기","⚙"]];
const SUB={cam2:"cam", sw2:"sw1", vis:"aux"};
const SPT={run:"운전 데이터",cam:"캠포지션1",cam2:"캠포지션2",splice:"이음매",manual:"수동 점검",sw1:"조작 스위치",sw2:"조작 스위치 2",temp:"온도 설정",xfer:"이송기설정",save:"품목 저장",io:"Input / Output",alarm:"알람 목록",aux:"주변기기",vis:"비전 Setup"};
const sp2=n=>String(n).padStart(2,"0");
function spHead(scr,arrow){ const f=S.f, d=new Date(), dt=d.getFullYear()+"/ "+(d.getMonth()+1)+" /"+d.getDate()+"/"+sp2(d.getHours())+"/"+sp2(d.getMinutes())+"/"+sp2(d.getSeconds());
  return '<div class="spH"><div class="spLogo">SOLPAC</div>'+(arrow==="back"?'<div class="spArr" data-hb="sp_back">⬅</div>':'')+'<div class="spTt">'+SPT[scr]+'</div>'+(arrow&&arrow!=="back"?'<div class="spArr" data-hb="sp_go_'+arrow+'">➡</div>':'')+
    '<div class="spSc"><s>Speed</s><b>'+(f.run?21:0)+'</b><s>Cam</s><b>'+(f.run?Math.round(f.phase*360)%360:0)+'</b><b class="dt">'+dt+'</b></div></div>'; }
function spFoot(){ const L=(S.hist||[]).filter(h=>ALARMS[h.key]&&ALARMS[h.key].mk==="fl").slice(0,3), d=new Date(), ds=sp2(d.getMonth()+1)+"/"+sp2(d.getDate())+"/"+d.getFullYear();
  const txt=L.length?L.map(h=>{ const s=Math.max(0,Math.floor(h.at)); return sp2(Math.floor(s/3600)%24)+":"+sp2(Math.floor(s/60)%60)+":"+sp2(s%60)+" "+h.t+" 이상알람 "+ds; }).join("   "):"";
  return '<div class="spF"><div class="spAl">'+esc(txt)+'</div><div class="spB" data-hb="sp_logout">Logout</div><div class="spB" data-hb="sp_empty">공포</div><div class="spB" data-hb="sp_mark">마크</div><div class="spB n">90</div></div>'; }
const spOn=(t,v,id,cls)=>'<div class="spSw'+(v?" on":"")+(cls?" "+cls:"")+'"'+(id?' data-hb="'+id+'"':' data-hb="sp_view"')+'>'+t+(v===null?"":' '+(v?"On":"Off"))+'</div>';
const spChk=(id,on,t)=>'<div class="spChk'+(on?" on":"")+'" data-hb="'+id+'">✔ '+t+' <s>IDT 확인</s></div>';
const spT=(head,rows,cls)=>'<table class="spTb'+(cls?" "+cls:"")+'"><tr>'+head.map(h=>'<th>'+h+'</th>').join("")+'</tr>'+rows.map(r=>'<tr>'+r.map((c,i)=>'<td'+(i?' class="v"':'')+'>'+c+'</td>').join("")+'</tr>').join("")+'</table>';
const SPV={vert:[182.0,182.0,184.0,183.0,183.0,183.0,182.0,183.0,182.4,182.5]};
const spPV=(v,i)=>typeof heatPV==="function"?heatPV(v,i||0):(S.f.main?fmt(Math.min(v,v*S.f.heat/S.f.heatSV),1):"-");   /* 영역별 온도 흔들림 (consume.js) */
const SPS={
 run(){ const f=S.f;
  return spHead("run")+'<div class="spC two"><div>'+
   '<table class="spTb"><tr><th>종류</th><th>수량</th><th>기능</th></tr><tr><td>생산카운터(Cut)</td><td class="v">'+Math.floor(S.cnt.pouch/10)+'</td><td><span class="spR" data-hb="sp_rst">리 셋</span></td></tr><tr><td>생산카운터(Ea)</td><td class="v">'+S.cnt.pouch+'</td><td></td></tr><tr><td>필름카운터(Cut)</td><td class="v">'+f.strokes+'</td><td><span class="spR" data-hb="sp_rst">리 셋</span></td></tr></table>'+
   '<table class="spTb"><tr><th>종류</th><th>설정</th><th>기능</th></tr><tr><td>길이<s>(Range 70~200mm)</s></td><td class="v">147</td><td><span class="spUp" data-hb="sp_view">▲</span><span class="spDn" data-hb="sp_view">▼</span></td></tr><tr><td>운전속도<s>(Range 10~60ppm)</s></td><td class="v">20</td><td></td></tr>'+
   '<tr><td>구동기어비</td><td class="v"><s>하강</s> 10</td><td class="v"><s>상승</s> <i class="bl">10</i></td></tr><tr><td></td><td class="v"><s>하 지연</s> <i class="rd">20</i> ms</td><td class="v"><s>상 지연</s> <i class="rd">20</i> ms</td></tr></table></div><div>'+
   '<div class="spTg">'+SPV.vert.map((v,i)=>'<div><s>세로접착'+(i+1)+'</s><b>'+spPV(v,i)+'</b></div>').join("")+f.endSV.map((v,i)=>'<div><s>가로접착 '+["1-1","1-2","2-1","2-2"][i]+'</s><b>'+spPV(v,10+i)+'</b></div>').join("")+'</div>'+
   '<div class="spFn">'+["아이마크","히터","세로실바","가로실바","무늬바","컷팅","카운터"].map(t=>spOn(t,null,null,"red")).join("")+spOn("운전중<br>수동배출",null)+'</div>'+
   '<div class="spRow"><div class="spSw" data-hb="sp_view">아이마크,무늬,컷팅 위치조절</div><div class="spLb">장비시작<br>배출카운트</div><div class="spVal rd">5</div></div></div></div>'+spFoot(); },
 cam(){ return spHead("cam","cam2")+'<div class="spC two">'+spT(["종류","시작위치","종료위치"],[["마크구간",10,200],["세로실바",170,280],["가로실바",345,160],["무늬바",160,310],["컷팅(R-컷팅)",175,190],["구동 실린더",180,300]],"cam")+
   spT(["종류","시작위치","종료위치"],[["무늬냉각",165,250],["컷팅냉각",100,210],["컷팅 게이트",180,300],["정 위치 정지",300,305],["노즐 바이브레이터",80,120],["셔터 바이브레이터",335,100]],"cam")+'</div><div class="spNote">캠 파라미터는 반드시 담당자가 조정합니다.</div>'+spFoot(); },
 cam2(){ return spHead("cam2","back")+'<div class="spC two">'+spT(["종류","시작위치","종료위치"],[["도징게이트1-1",80,230],["도징 게이트1-2",355,355],["도징 게이트2-1",90,150],["도징 게이트2-2",180,240],["도징 게이트3-1",100,270],["도징 게이트3-2",200,200]],"cam")+
   spT(["종류","시작위치","종료위치"],[["하부 셔터1",310,10],["하부 셔터2",330,20],["하부 셔터3",350,50],["집진1",20,60],["집진2",1,1],["도징 게이트2-3",250,250]],"cam")+'</div>'+spFoot(); },
 splice(){ const g=[]; for(let i=1;i<=70;i++) g.push('<div>'+i+'</div>');
  return spHead("splice")+'<div class="spC two"><div><div class="spFn two">'+spOn("이음매 부저",false,"sp_view")+spOn("이음매 감지정지",false,"sp_view")+'</div>'+
   '<div class="spLb l">이음매 공급정지카운트</div><div class="spSt">'+[48,49,50,51,52].map((v,i)=>'<div><s>'+(i+1)+'ST</s>'+v+'</div>').join("")+'</div>'+
   '<div class="spLb l">이음매 공급정지 배출카운트</div><div class="spSt">'+[53,54,55,56,57].map((v,i)=>'<div><s>'+(i+1)+'ST</s>'+v+'</div>').join("")+'</div>'+
   '<div class="spLb l">공포배출카운트(공급정지시작카운트) <b class="rd">SV 2</b></div></div><div><div class="spLb l">이음매 감시창</div><div class="spGrid">'+g.join("")+'</div>'+
   '<div class="spLb l">기계생산현황 : 운전시간 '+Math.floor((S.session?S.session.sec:0)/3600)+'H · 총생산량 '+S.cnt.pouch.toLocaleString()+'</div></div></div>'+spFoot(); },
 manual(){ const C=[["세로실바1","세로실바2","가로실바","무늬바","컷팅(R-컷팅)","구동실린더","무늬냉각","컷팅냉각","컷팅 테스트","컷팅게이트"],["호퍼 게이트1","호퍼 게이트2","호퍼 게이트3","도징 게이트1","도징 게이트2","도징 게이트3","하부 셔터1","하부 셔터2","하부 셔터3","노즐바이브레이터"],
   ["셔터바이브레이터","집진 1","집진 2","예비","파지털이","예비","에어배출","예비","예비","예비"],["공포배출실린더","공포배출 콘베어","당김모터","파지모터","R-컷팅파지모터"]];
  return spHead("manual").replace('<div class="spSc">','<div class="spMan'+(S.flags.spMan?" on":"")+'" data-hb="sp_man">수동점검 '+(S.flags.spMan?"On":"Off")+'</div><div class="spSc">')+'<div class="spC four">'+C.map(c=>'<div class="spCol">'+c.map(t=>'<div class="spM" data-hb="fl_man">'+t+'</div>').join("")+'</div>').join("")+'</div>'+spFoot(); },
 sw1(){ const f=S.f; const C=[[["아이마크",true],["이음매 체크",true],["세로실바",true],["가로실바",true],["무늬바",true],["컷팅(R-)",true]],[["히터",true],["무늬냉각",true],["컷팅냉각",true],["컷팅 게이트",true],["R-컷팅파지모터",true],["파지털이",true]],
   [["도징1",f.dose[0],"fl_dose0"],["도징2",f.dose[1],"fl_dose1"],["도징3",f.dose[2],"fl_dose2"],["셔터바이브레이터",true],["노즐 바이브레이터",true],["당김모터",true]],[["안전도어",true],["비전",f.vision],["공포감지",f.vision],["호퍼게이트 1",true],["호퍼게이트 2",true],["호퍼게이트 3",true]],
   [["프린터",f.prn.saved],["집진 1",f.dustV],["집진 2",f.dustV],["호퍼 체크 1",false],["호퍼 체크 2",false],["호퍼 체크 3",false]]];
  return spHead("sw1","sw2")+'<div class="spC five">'+C.map(c=>'<div class="spCol">'+c.map(([t,v,id])=>spOn(t,v,id)).join("")+'</div>').join("")+'</div>'+spFoot(); },
 sw2(){ const f=S.f, cnt=k=>'<div class="spCnt"><div class="spLb">'+k[0]+'</div><div class="spSvPv"><s>SV</s><s>PV</s><b>'+k[1]+'</b><b class="rd">0</b><span class="spR" data-hb="sp_rst">리 셋</span></div></div>';
  return spHead("sw2","back")+'<div class="spC sw2"><div class="spCol">'+spOn("후 공정 연동",f.link,"fl_link")+spOn("호퍼 2 바이브레이터",false,"sp_view")+spOn("외부 전등",true,"sp_view")+'</div><div class="spCol3">'+
   [1,2,3].map(i=>spOn("호퍼게이트"+i+" 카운트",false,"sp_view")).join("")+[1,2,3].map(i=>cnt(["하부셔터"+i+" 횟수",10])).join("")+[1,2,3].map(i=>cnt(["호퍼게이트"+i+" 횟수",1])).join("")+'</div></div>'+
   '<div class="spChkRow">'+spChk("fl_linkChk",f.linkChk,"후 공정 연동 ON 확인")+'</div>'+spFoot(); },
 temp(){ const f=S.f, pw=f.main?"ON":"OFF", pvs=(v,i)=>typeof heatPV==="function"?heatPV(v,i):(f.main?fmt(Math.min(v,v*f.heat/f.heatSV),1):"-");
  const V=SPV.vert.map(()=>f.heatSV), H=[1,2,3,4,5,6,7,8,9,10];
  return spHead("temp").replace('온도 설정</div>','온도 설정 <small class="spEx">예시값</small></div>')+'<div class="spC"><table class="spTb tmp"><tr><th>세로접착</th>'+H.map(i=>'<th>'+i+'</th>').join("")+'</tr><tr><td>PV</td>'+SPV.vert.map((v,i)=>'<td class="v">'+pvs(v,i)+'</td>').join("")+'</tr><tr><td>SV</td>'+V.map(v=>'<td class="v rd">'+v+'</td>').join("")+'</tr><tr><td>POWER</td>'+H.map(()=>'<td class="v">'+pw+'</td>').join("")+'</tr><tr><td>UPPER</td>'+V.map(v=>'<td class="v">'+(v+10)+'</td>').join("")+'</tr><tr><td>LOWER</td>'+V.map(v=>'<td class="v">'+(v-10)+'</td>').join("")+'</tr></table>'+
   '<table class="spTb tmp"><tr><th>가로접착</th>'+["1-1","1-2","2-1","2-2"].map(i=>'<th>'+i+'</th>').join("")+'</tr><tr><td>PV</td>'+f.endSV.map((v,i)=>'<td class="v">'+pvs(v,10+i)+'</td>').join("")+'</tr><tr><td>SV</td>'+f.endSV.map(v=>'<td class="v rd">'+v+'</td>').join("")+'</tr><tr><td>POWER</td>'+f.endSV.map(()=>'<td class="v">'+pw+'</td>').join("")+'</tr><tr><td>UPPER / LOWER</td>'+f.endSV.map(v=>'<td class="v">'+(v+10)+' / '+(v-10)+'</td>').join("")+'</tr></table></div>'+
   '<div class="spChkRow">'+spChk("fl_temp",f.tempChk,"PV · SV 일치 확인")+'<span class="spNote">UPPER · LOWER 는 SV ± 10 ℃ 로 표시 (사진 없음 · 확인 필요)</span></div>'+spFoot(); },
 xfer(){ const f=S.f, V=[9.0,8.0,9.0];
  return spHead("xfer")+'<div class="spC three">'+[0,1,2].map(i=>'<div class="spX"><div class="spXh">이송기설정 <b class="rd">'+(i+1)+'</b>'+spOn("이송기",f.ibc[i],"fl_ibc"+i)+'</div>'+spOn("수동점검",false,"sp_view","dk")+
    [["진공",fmt(V[i],1),"진공"],["진공해제","2.0",""],["배출","3.0","배출"],["진공쉐이크","2.0","진공쉐이크"]].map(([a,b,c])=>'<div class="spXr"><span>'+a+'</span><b>'+b+'</b>'+(c?'<i data-hb="sp_view">'+c+'</i>':'<i class="no"></i>')+'</div>').join("")+'</div>').join("")+'</div>'+spFoot(); },
 save(){ return spHead("save")+'<div class="spC"><table class="spTb"><tr><th>번호</th><th>품목명</th><th>길이</th><th>운전속도</th><th>기능</th></tr><tr><td>1</td><td class="v">판콜에이치건조시럽</td><td class="v">147</td><td class="v">20</td><td><span class="spR" data-hb="sp_view">불러오기</span></td></tr>'+[2,3,4].map(i=>'<tr><td>'+i+'</td><td class="v">-</td><td class="v">-</td><td class="v">-</td><td></td></tr>').join("")+'</table><div class="spNote">품목 저장 · 불러오기는 담당자 권한 (SOP 에 화면 사진 없음 — 구성 추정 · 확인 필요)</div></div>'+spFoot(); },
 io(){ const f=S.f, lp=(t,on)=>'<div class="spIo'+(on?" on":"")+'"><i></i>'+t+'</div>';
  return spHead("io")+'<div class="spC two"><div><div class="spLb l">INPUT</div><div class="spIoG">'+lp("비상정지",!f.emg)+lp("안전도어",f.door==="closed")+lp("에어체크",f.airV[0]&&f.airV[1])+lp("아이마크 센서",f.run)+lp("이음매 센서",false)+lp("공포감지",f.run&&f.filling)+lp("호퍼 레벨1",S.hop.add>20)+lp("호퍼 레벨2",S.hop.main>20)+lp("호퍼 레벨3",S.hop.sug>20)+lp("후 공정 운전",S.p.ctRun&&S.p.sfRun)+'</div></div>'+
   '<div><div class="spLb l">OUTPUT</div><div class="spIoG">'+lp("세로실바",f.run)+lp("가로실바",f.run)+lp("당김모터",f.run)+lp("도징1",f.run&&f.filling&&f.dose[0])+lp("도징2",f.run&&f.filling&&f.dose[1])+lp("도징3",f.run&&f.filling&&f.dose[2])+lp("집진",f.dustV)+lp("부저",tripAlarms().length>0)+lp("외부전등",true)+lp("공포배출",false)+'</div></div></div><div class="spNote">입출력 점검 화면 (SOP 에 사진 없음 — 구성 추정 · 확인 필요)</div>'+spFoot(); },
 alarm(){ const L=(S.hist||[]).filter(h=>ALARMS[h.key]&&ALARMS[h.key].mk==="fl").slice(0,8), act=new Set(tripAlarms());
  return spHead("alarm")+'<div class="spC">'+spT(["발생 시각 (교육 경과)","알람 내용","상태"],L.length?L.map(h=>{ const s=Math.floor(h.at); return [sp2(Math.floor(s/60))+":"+sp2(s%60),h.t,act.has(h.key)?'<b class="rd">발생 중</b>':"해제"]; }):[["-","알람 이력 없음","-"]])+'</div>'+spFoot(); },
 aux(){ return spHead("aux")+'<div class="spC three"><div class="spAux" data-hb="sp_go_vis">👁<b>비전 Setup</b></div><div class="spAux" data-hb="sp_view">🖨<b>프린터</b></div><div class="spAux" data-hb="sp_view">💨<b>집진기</b></div></div><div class="spNote">비전 Setup 은 주변기기에서 들어갑니다 (사용자 확인). 그 밖의 버튼 구성은 추정 · 확인 필요</div>'+spFoot(); },
 vis(){ const f=S.f;
  return spHead("vis","back")+'<div class="spC vis"><div class="spVb"><span class="rd">1200</span><b>0</b><span class="rd">7840</span><div class="spBar"></div></div><div class="spCol">'+spOn("비전",f.vision,"fl_vision")+'<div class="spSw" data-hb="sp_view">비전 원점</div><div class="spSw" data-hb="sp_view">비전 1Step</div></div>'+
   '<table class="spTb v2"><tr><td>비전 촬영 속도</td><td class="v rd">5500</td><td>mm/s</td><td rowspan="2">비전 공급정지<br>카운트</td><td rowspan="2" class="v rd">35</td></tr><tr><td>원점 복귀 속도</td><td class="v rd">9000</td><td>mm/s</td></tr><tr><td>출력 시간</td><td class="v rd">20</td><td>ms</td><td>리젝트 카운터</td><td class="v rd">40</td></tr></table>'+
   '<div class="spPos">'+[1820,2420,3020,3620,4220,4820,5420,6020,6620,7220].map((v,i)=>'<div><s>'+(i+1)+'</s>'+v+'</div>').join("")+'</div></div>'+
   '<div class="spChkRow">'+spChk("fl_visChk",f.visChk,"비전 Setup 값 확인")+'</div>'+spFoot(); }
};
function solpacDraw(body,nav){
  const top=SUB[hScr]||hScr;
  nav.innerHTML=SNAV.map(([k,t,e,off])=>'<div class="nv sp'+(top===k?" on":"")+(off?" off":"")+'" data-nav="'+k+'"><i>'+e+'</i>'+t+'</div>').join("");
  $$("#hNav [data-nav]").forEach(e=>e.onclick=()=>{ if(e.classList.contains("off")){ toast("품목저장 화면은 IDT 에서 구현하지 않습니다 (사용자 결정)."); return; } hScr=e.dataset.nav; drawHMI(); });
  body.innerHTML='<div class="spScr">'+(SPS[hScr]||SPS.run)()+'</div>';
}
function solpacLogin(){ return '<div class="spScr">'+spHead("run").replace(SPT.run,"로그인")+'<div class="spC spLogin"><div><b>터치스크린 로그인</b>ID · PASSWORD 를 입력해 로그인합니다 (IDT : 버튼 한 번).<div class="spLgBtn" data-hb="fl_login">Login</div></div></div><div class="spF"><div class="spAl"></div><div class="spB" data-hb="fl_login">Login</div><div class="spB">공포</div><div class="spB">마크</div><div class="spB n">90</div></div></div>'; }
function solpacClick(id){
  if(id.startsWith("sp_go_")){ hScr=id.slice(6); drawHMI(); return; }
  if(id==="sp_big") return;
  if(id==="sp_back"){ hScr=SUB[hScr]||"run"; drawHMI(); return; }
  if(id==="sp_logout"){ if(S.f.run){ toast("운전 중에는 로그아웃하지 않습니다.","bad"); return; } S.f.user=null; toast("로그아웃"); drawHMI(); return; }
  if(id==="sp_man"){ if(S.f.run){ toast("운전 중에는 수동 점검을 켜지 않습니다.","bad"); return; } S.flags.spMan=!S.flags.spMan; drawHMI(); return; }
  if(id==="sp_rst"){ toast("카운터 리셋은 생산 기록과 대조 후 담당자가 합니다 (IDT : 표시만)."); return; }
  if(id==="sp_empty"||id==="sp_mark"){ toast(id==="sp_empty"?"공포 배출 설정 화면 (IDT : 표시만)":"마크 설정 화면 (IDT : 표시만)"); return; }
  toast("교육 범위 밖 기능입니다 (화면 표시만).");
}
/* 교육 절차의 화면 이동 안내 : 하위 화면(캠2 · 조작스위치2 · 비전 Setup)은 상위 메뉴 → 화살표/버튼 */
function flRoute(scr){ const top=SUB[scr]; if(!top) return HNV(scr); return hScr===top?HB("sp_go_"+scr):HNV(top); }
