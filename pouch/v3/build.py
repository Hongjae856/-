"""파우치 라인 IDT (새 3D 연결판) — 교육 로직(pouch/src) + 새 3D(pouch/v2/src) + 연결 계층(pouch/v3/src)

pouch/src 의 화면 · 시나리오 · 판정 로직은 그대로 쓰고, 옛 3D 엔진(engine · gfx · models · dynamic · fp)
대신 pouch/v3/src 의 연결 계층을 넣는다. 옛 좌표(mm)를 쓰던 몇 곳은 아래 PATCH 로 새 좌표(m)로 바꾼다
(바꿀 문자열이 정확히 지정 횟수만큼 있어야 빌드된다).
"""
import re
import sys
from pathlib import Path

H = Path(__file__).resolve().parent
OLD = H.parent / "src"
V2 = H.parent / "v2"
SRC = H / "src"
OUT = H.parent.parent / "파우치라인_IDT.html"   # 11/15 전환 : 새 3D 연결판이 정식 산출물 (옛 판은 pouch/build.py 로 남김)

V2_SCRIPTS = ("kit.js", "layout.js", "room.js", "form.js", "unwind.js", "hopper.js", "filler.js", "conv.js",
              "fillzone.js", "pack_feed.js", "pack_carton.js", "pack_insp.js", "packzone.js", "human.js", "pack_manual.js",
              "pack_anim.js", "anim.js")
ORDER = (  # (folder, file)
    ("old", "util.js"), ("old", "layout.js"), ("old", "data.js"), ("old", "state.js"), ("old", "sim.js"),
    ("v3", "anchors.js"), ("old", "hmi.js"), ("v3", "solpac.js"), ("old", "course.js"), ("old", "ui.js"), ("old", "fps.js"),
    ("v3", "bridge.js"), ("v3", "workers.js"), ("v3", "fp.js"), ("old", "autoplay.js"), ("old", "changelog.js"),
    ("oee", "oee.js"), ("v3", "oee_pouch.js"), ("v3", "cases.js"), ("v3", "edu.js"), ("v3", "guide.js"), ("v3", "lamp.js"), ("v3", "hmitex.js"), ("v3", "dial.js"), ("v3", "consume.js"), ("v3", "printer.js"), ("v3", "realism.js"), ("v3", "demo.js"), ("v3", "boot.js"),
)
RENAME_CV = {"layout.js", "data.js", "state.js", "sim.js", "hmi.js", "course.js", "ui.js"}

PATCH = {
    "layout.js": [
        (r"R3.lo=[-9900,-10,-3300]; R3.hi=[12900,4300,2700];", "", 1),
    ],
    "hmi.js": [
        ('  if(k==="fl") h=B("swRun",', '  if(k==="fl"||k==="fp") h=B("swRun",', 1),   # 프린터(fp) 탭에서도 충전기 판넬 버튼 유지 (11/17)
        ('const EXPECT={exp:"2028.11.01", lot:"2F010"};', 'const EXPECT={exp:"2029.01.30", lot:"2F001"};   /* 제조번호 · 사용기한 (11/17 사용자 제시 예) */', 1),
        ('  return k==="fl"?S.f.panel:', '  return k==="fl"?S.f.panel:k==="fp"?!!S.f.main:', 1),
        ('function machRun(k){ const p=S.p; return k==="fl"?S.f.run:', 'function machRun(k){ const p=S.p; return k==="fl"?S.f.run:k==="fp"?!!(S.f.run&&S.f.prn.saved):', 1),
        ('function drawHMI(){\n  if(!S) return;', 'function drawHMI(){\n  if(!S) return; { const ae=document.activeElement; if(ae&&ae.classList&&ae.classList.contains("hin")&&ae.closest("#hBody")) return; }   /* 직접 입력 중에는 다시 그리지 않음 */', 1),
        ('function bindHB(){ $$("#hBody [data-hb]").forEach(e=>e.onclick=()=>hbClick(e.dataset.hb)); drawPanel(); }', 'function bindHB(){ $$("#hBody [data-hb]").forEach(e=>e.onclick=()=>hbClick(e.dataset.hb)); if(typeof hinBind==="function") hinBind(); drawPanel(); }', 1),
        ('    case "pr_lot": p.lbl.lot=EXPECT.lot; p.lbl.saved=false; toast("LOT : "+EXPECT.lot+" (포장지시기록서)"); break;\n    case "pr_exp": p.lbl.exp=EXPECT.exp; p.lbl.saved=false; toast("EXP : "+EXPECT.exp+" (포장지시기록서)"); break;', '    case "pr_lot": case "pr_exp": return;   /* 입력칸에 직접 입력 (11/17) */', 1),
        ('row("배치번호 (LOT)","포장지시기록서",\'<div class="hval edit" data-hb="pr_lot">\'+esc(L.lot||"입력")+\'</div>\')+row("사용기한 (EXP)","포장지시기록서",\'<div class="hval edit" data-hb="pr_exp">\'+esc(L.exp||"입력")+\'</div>\')', '\'<div class="fpIn"><label>제조번호 (LOT)<s>포장지시기록서</s>\'+hinBox("pr_lot",L.lot,"예 2F001",EXPECT.lot)+\'</label><label>사용기한 (EXP)<s>YYYY.MM.DD</s>\'+hinBox("pr_exp",L.exp,"예 2029.01.30",EXPECT.exp)+\'</label></div>\'', 1),   # 카톤 프린터 라벨 : 제조번호 · 사용기한 직접 입력 (11/17)
        ('    nav.innerHTML=FNAV.map(', '    if(0) nav.innerHTML=FNAV.map(', 1),          # 충전기 : SOLPAC 화면 (solpac.js)
        ('    body.innerHTML=(FSCR[hScr]||FSCR.run)();', '    solpacDraw(body,nav);', 1),
        ('  const m=machOf(hMach);\n  $("#hMach")', '  const m=machOf(hMach); $("#hmi").classList.toggle("solpac",hMach==="fl"); $("#panel").classList.toggle("solpacP",hMach==="fl"); $("#hmi").classList.toggle("oneTab",tabs.length<2); $("#hmi").classList.toggle("big",hMach==="fl"&&SPBIG&&machPower("fl")&&!(typeof fpActive==="function"&&fpActive()));\n  $("#hMach")', 1),
        ('body.innerHTML=loginScreen(hMach);', 'body.innerHTML=hMach==="fl"?solpacLogin():loginScreen(hMach);', 1),
        ('function hbClick(id){', 'function hbClick(id){ if(id.startsWith("fp_")){ fpClick(id); return; } if(id.startsWith("sp_")){ solpacClick(id); return; } if((id==="fl_ibc0"||id==="fl_ibc2")&&S.f.hoseC&&!S.f.hoseC[id==="fl_ibc0"?0:1]&&!S.f.ibc[id==="fl_ibc0"?0:2]){ toast("IBC 진공호스가 연결되지 않았습니다. 먼저 호스를 연결 · 체결하세요.","bad"); return; }', 1),
        ('if(mk==="fl") return HNV(scr);', 'if(mk==="fl") return flRoute(scr);', 1),
        ('return ph("홈","ISHIDA IX-EN · pancold-h",p.xrConv)+\'<div class="kpis">\'', 'return ph("홈","ISHIDA IX-EN · pancold-h",p.xrConv)+\'<div id="xrView" class="\'+(p.xrX?"on":"")+\'"></div><div class="kpis">\'', 1),
    ],
    "ui.js": [
        ('$("#"+id).onclick=()=>{ if(!S||!S.session) return; TILE[id].click(); };', '$("#"+id).onclick=e=>{ if(!S||!S.session) return; if(typeof fpActive==="function"&&fpActive()){ toast("1인칭에서는 현장에서 직접 조작합니다 — 노란 화살표 위치로 가서 좌클릭(E)","bad"); return; } TILE[id].click(); };   /* 1인칭 : 왼쪽 타일은 ON/OFF 현황만 (11/16) */', 1),
        ('mLift:{e:"🛗",b:"주성분 STS 용기",s:()=>S.f.mainLift?"2층 데크 도착":"리프터로 올림"', 'mLift:{e:"🛗",b:"주성분 리프터 운반",s:()=>S.f.mainLift?"2층 데크 도착":"봉투 → 적재칸 → 데크"', 1),   # 11/16 : STS 용기의 봉투를 리프터 적재칸으로 옮겨 올림
        ('toast("주성분 STS 용기를 먼저 리프터로 올리세요.","bad")', 'toast("주성분을 먼저 리프터로 2층 데크에 올리세요.","bad")', 1),
        ('const nm=what==="roll"?"적색 인쇄 은박 롤":"주성분 STS 용기";', 'const nm=what==="roll"?"적색 인쇄 은박 롤":"주성분 봉투 · 드럼리프터";', 1),
        ('else act("lift",()=>{ S.f.mainLift=true; toast("주성분 STS 용기 — 리프터로 2층 데크 도착","good"); });', 'else act("lift",()=>{ S.f.mainLift=true; S.flags.liftAt="use"; toast("주성분 봉투 — STS 용기에서 리프터 적재칸으로 옮겨 2층 데크 도착","good"); });', 1),
        ('if(what==="roll") act("roll",()=>{ S.f.rollCarry="red"; toast("적색 인쇄 은박 롤 2인 1조 운반 완료","good"); });',
         'if(what==="roll") act("roll",()=>{ S.f.rollCarry="red"; S.flags.cartAt="unw"; S.flags.redTaken=true; toast("적색 인쇄 은박 롤 — 대차에 실어 언와인더 옆까지 운반 (2인 1조)","good"); });', 1),
        ('act("rollOut",()=>{ f.roll="red"; f.rollCarry=null; toast("적색 인쇄 은박 롤 장착 · 고정","good"); });',
         'act("rollMount",()=>{ f.roll="red"; f.rollCarry=null; toast("적색 인쇄 은박 롤 장착 · 고정","good"); });', 1),
        ('act("roll",()=>{ f.roll="plain"; toast("무지 은박 롤 장착","good"); });',
         'act("rollPlain",()=>{ f.roll="plain"; f.rollCarry=null; S.flags.cartAt="unw"; toast("은색 무지 은박 롤 — 대차로 운반 · 장착","good"); });', 1),
        ('  $("#lineStrip").innerHTML=', '  if(0) $("#lineStrip").innerHTML=', 1),   # 메인화면 순서도 삭제
        ('$("#courseBack").onclick=()=>{ ', '$("#courseBack").onclick=()=>{ $("#incPick").style.display="none"; ', 1),
        ('function goHome(){ ', 'function goHome(){ $("#incPick").style.display="none"; $("#oeeWrap")&&$("#oeeWrap").classList.remove("on"); ', 1),
        ('  $("#lcCheck").style.display=chk?"":"none";', '  $("#lcCheck").style.display=chk?"":"none"; if(typeof demoCoach==="function") demoCoach(st);', 1),
        ('(st.watch?"라인을 감시하고 이상에 대응하세요.":"평가 진행 중 — 절차에 따라 수행하세요.")', '(isInc()?"라인을 감시하고 이상이 생기면 대응하세요.":st.watch?"라인을 감시하며 생산을 진행하세요.":"평가 진행 중 — 절차에 따라 수행하세요.")', 1),
        ("""'<h3>알람 · 이상사례 대응</h3><table class="ht"><tr><th>구분</th><th>명칭</th><th>발생</th></tr>'+inc+'</table>'+""", "", 1),
        ('(isEasy()?"기본모드":"심화모드")', '(isInc()?"이상사례 대처":isEasy()?"기본모드":"심화모드")', 1),
        ("const pan=d=>{ cam.txT=clamp(cam.txT+d*Math.max(700,cam.dist*0.25),-9500,12500); };", "const pan=d=>camPanLine(d);", 1),
        ("cam.dist>6000", "cam.dist>6", 1),
        ('const info="드래그 회전 · 휠 확대 · Shift/우클릭 드래그 이동";', 'const info="드래그 회전 · 휠 확대 · Shift/우클릭 드래그 이동 · 그래픽 "+GQ.label();', 1),
    ],
    "fps.js": [
        ("KeyH:host.help,", "KeyH:host.help,KeyC:host.crouch||(()=>{}),", 1),   # 1인칭 앉기 (C)
        ("if(e.code==='Escape' && ['approach','hmi'].includes(mode)){", "if((e.code==='Escape'||(e.code==='KeyF'&&!e.target?.closest?.('input,textarea'))) && ['approach','hmi'].includes(mode)){", 1),   # 설비 화면 조작 중 F 로 뒤로 (11/16)
    ],
    "sim.js": [   # 무작위 소량 불량 (11/17 사용자 선택) : 중량 NG 약 0.15 % · 실링 불량 약 0.15 %
        ('  const printed=f.prn.saved;', '  const printed=f.prn.saved&&f.prn.lot===EXPECT.lot&&f.prn.exp===EXPECT.exp;   /* 포장지시기록서와 다른 값 = 인쇄 불량 (11/17) */', 1),
        ('  const printBad=!printed||f.headDirty||f.ribbon<5;', '  const printBad=!printed||f.headDirty||f.ribbon<5; if(f.vision){ S.cnt.ocrN=(S.cnt.ocrN||0)+NOZ.n; if(printBad) S.cnt.ocrNG=(S.cnt.ocrNG||0)+NOZ.n; }', 1),
        ('c.print=p.prRun&&p.lbl.loaded?(p.nozzleBad||p.ink<5?"blur":"ok"):"none";', 'c.print=p.prRun&&p.lbl.loaded?(p.nozzleBad||p.ink<5?"blur":(p.lbl.lot!==EXPECT.lot||p.lbl.exp!==EXPECT.exp)?"bad":"ok"):"none";', 1),
        ('const w=PROD.cartonTare+(p.leafBad?-4.2:0)+cartonNet()+gauss()*0.35;', 'const w=PROD.cartonTare+(p.leafBad?-4.2:0)+cartonNet()+gauss()*0.35+(Math.random()<.0015?(Math.random()<.5?-1:1)*(PROD.cw.hi+1.5):0);', 1),
        ('    const toEmpty=empty||vis||!S.p.align;', '    const sealNG=!empty&&!vis&&Math.random()<.0015; if(sealNG) S.cnt.sealNG=(S.cnt.sealNG||0)+1;\n    const toEmpty=empty||vis||sealNG||!S.p.align;', 1),
    ],
    "data.js": [
        ('nm:"리프터 · STS 용기", en:"LIFTER · STS CONTAINER"', 'nm:"드럼리프터 · 주성분", en:"DRUM LIFTER"', 1),
        ('d:"주성분 STS 용기를 2층 데크로 올립니다. 은박 · STS 용기는 반드시 2인 1조로 옮깁니다."', 'd:"STS 용기(맨 동쪽 중앙 파렛트)에 담긴 주성분 봉투를 리프터 적재칸으로 옮겨 원료투입구 아래에서 2층 데크로 올립니다. 리프터는 3인 1조(1명 운전 · 2명 하역)."', 1),
    ],
    "course.js": [
        ('A.push(T_("scoop","2번 호퍼에 주성분 스쿱 공급","[주성분 스쿱 공급] 을 눌러 2번 호퍼에 주성분을 공급합니다.",', 'A.push(T_("scoop","2번 호퍼에 주성분 스쿱 공급 (뚜껑 들어냄)","[주성분 스쿱 공급] 을 누르면 작업자가 2번 호퍼 뚜껑의 남 · 북 토글 클램프를 풀고 뚜껑을 들어내 남쪽 난간에 세운 뒤 스쿱으로 투입하고, 뚜껑을 다시 덮어 클램프를 체결합니다.",', 1),
        ('    A.push(T_("prn","은박 프린터 사용기한 · 배치번호 입력 · 저장","[은박 프린터] 를 눌러 포장지시기록서의 사용기한 · 배치번호를 입력하고 저장합니다.",()=>"#mPrn",()=>f().prn.saved,{pts:3}));', '    A.push(T_("prn","인쇄기 컨트롤러 — 제조번호 · 사용기한 직접 입력 · 저장","충전기 북쪽 인쇄기 컨트롤러 위 모니터에서 포장지시기록서의 제조번호("+EXPECT.lot+") · 사용기한("+EXPECT.exp+")을 입력하고 저장합니다.",()=>firstOf([[()=>f().prnD&&f().prnD.lot===EXPECT.lot,()=>hmiRoute("fp","main",HB("fp_lot"))],[()=>f().prnD&&f().prnD.exp===EXPECT.exp,()=>hmiRoute("fp","main",HB("fp_exp"))],[()=>f().prn.saved&&f().prn.lot===EXPECT.lot&&f().prn.exp===EXPECT.exp,()=>hmiRoute("fp","main",HB("fp_save"))]]),()=>f().prn.saved&&f().prn.lot===EXPECT.lot&&f().prn.exp===EXPECT.exp,{pts:3,hmi:true}));   /* 11/17 : 직접 입력 */', 1),
        ('  const prLbl=[[()=>p().lbl.lot,()=>hmiRoute("pr","edit",HB("pr_lot"))],[()=>p().lbl.exp,()=>hmiRoute("pr","edit",HB("pr_exp"))]];', '  const prLbl=[[()=>p().lbl.lot===EXPECT.lot,()=>hmiRoute("pr","edit",HB("pr_lot"))],[()=>p().lbl.exp===EXPECT.exp,()=>hmiRoute("pr","edit",HB("pr_exp"))]];   /* 11/17 : 직접 입력 */', 1),
        ('  const d=S.f.dial, one=q=>IPC_STD[q].std*(1+(d[q]||0));\n  const m=k==="all"?one("add")+one("main")+one("sug"):one(k);\n  const list=[]; for(let i=0;i<IPC_STD[k].n;i++) list.push(Math.round((m+gauss()*IPC_STD[k].std*0.011)*1000)/1000);',
         '  const d=S.f.dial, one=(q,i)=>IPC_STD[q].std*(1+(typeof dialOff==="function"?dialOff(q,i):(d[q]||0)));   /* 노즐별 조절 다이얼 반영 (11/16 dial.js) */\n  const mm=i=>k==="all"?one("add",i)+one("main",i)+one("sug",i):one(k,i);\n  const list=[]; for(let i=0;i<IPC_STD[k].n;i++) list.push(Math.round((mm(i%10)+gauss()*IPC_STD[k].std*0.008)*1000)/1000);', 1),
        ('done:()=>S.f.dial.main>=0,\n      act(){ return startWork("dialF",()=>{ S.f.dial.main=0; const r=S.ipc.res.main; if(r) r.stale=true; renderIpc(); toast("주성분 다이얼 조정 완료 — 재측정합니다","good"); }); }', 'done:()=>dialOK("main"),\n      act(){ return startWork("dialB",()=>dialOpen("B",()=>{ if(!dialOK("main")) toast("주성분 노즐 중 기준 ±2 % 를 벗어난 노즐이 있습니다. 다시 조절하세요.","bad"); else toast("주성분 충전량 조절 완료 — 재측정합니다","good"); })); }', 1),
        ('A.push(T_("lift","주성분 STS 용기 리프터로 2층 데크에 올림","[주성분 STS 용기] 를 눌러 리프터로 2층 데크에 올립니다."', 'A.push(T_("lift","주성분 봉투를 리프터 적재칸에 옮겨 2층 데크로 올림","[주성분 리프터 운반] 을 눌러 STS 용기의 주성분 봉투를 드럼리프터 적재칸에 옮겨 담고, 원료투입구 아래로 밀고 가서 2층 데크로 올립니다."', 1),
        ('주성분 STS 용기를 리', '주성분 봉투를 리', 1),
        ('const isExam=()=>!!S&&(S.mode==="exam"||S.mode==="examEasy");', 'const isExam=()=>!!S&&(S.mode==="exam"||S.mode==="examEasy"||S.mode==="incExam");', 1),
        ('examEasy:"기본모드 · 평가",exam:"심화모드 · 평가"};', 'examEasy:"기본모드 · 평가",exam:"심화모드 · 평가",incLearn:"이상사례 대처 · 학습",incExam:"이상사례 대처 · 평가",demo:"시연모드"};', 1),
        ('STEPS_CACHE=S.room==="F"?stepsFill(isEasy()):stepsPack(isEasy());', 'STEPS_CACHE=isDemo()?stepsDemo():isInc()?stepsInc():S.room==="F"?stepsFill(isEasy()):stepsPack(isEasy());', 1),
        ("  if(isExam()) scheduleExamTrouble();\n", "", 1),   # 기본 · 심화 : 예약 이상상황 없음 (이상사례 대처 교육으로 분리)
        ("정기 공정검사(IPC)와 알람에 대응합니다.", "정기 공정검사(IPC)를 수행합니다.", 1),
        ("화면 오류를 감시하고 이상사례에 대응합니다.", "화면 오류를 감시합니다.", 1),
        ("  showResult(manual);\n", "  (isDemo()?showDemoResult:isInc()?showIncResult:showResult)(manual);\n", 1),
        ("  S.stepAt=tSim;\n  if(typeof fpSet", "  S.stepAt=tSim; if(typeof propsReset===\"function\") propsReset();\n  if(typeof fpSet", 1),
        ('  if(typeof fpSet==="function") fpSet(FP.want);', '  if(typeof fpSet==="function") fpSet(mode!=="demo");   /* 교육 시작 = 항상 1인칭 (11/16 사용자 지시) */', 1),   # 새 세션 : 작업자 작업 · 끌던 대차 초기화
        ('  if(isEasy()) presetEasy();\n', '  if(isEasy()) presetEasy();\n  S.f.hoseC=(mode==="guide"||mode==="exam")&&room==="F"?[false,false]:null;   /* 심화 충전실 : IBC 진공호스 분리 상태에서 시작 (11/16 · [0] 첨가제 · [1] 백당) */\n', 1),
        ('function ipcTake(){\n  const I=S.ipc, h=ipcStep(); if(!h||h.k!=="take") return;\n', 'function ipcTake(){\n  const I=S.ipc, h=ipcStep(); if(!h||h.k!=="take") return;\n  if(!S.flags.ipcGo&&typeof startWork==="function"){ if(S.flags.ipcBusy) return; S.flags.ipcBusy=true;   /* 작업자가 배출 컨베이어에서 시료를 꺼내 저울 작업대로 가서 계량한 뒤 결과 반영 (11/16) */\n    const ok=startWork("ipc",()=>{ S.flags.ipcBusy=false; S.flags.ipcGo=true; try{ ipcTake(); }finally{ S.flags.ipcGo=false; } });\n    if(!ok){ S.flags.ipcBusy=false; toast("작업자가 다른 작업 중입니다."); } else if(!cam.fp) toast("시료 채취 — 배출 컨베이어에서 "+IPC_STD[I.targets[I.cur]].n+"포를 꺼내 저울 작업대에서 계량합니다."); return; }\n', 1),
        ('    A.push(T_("ibc1","이송기 1(첨가제) ON",', '    A.push(T_("hose","IBC 진공호스 연결 · 클램프 체결 (백당 · 첨가제)","IBC 받침 호퍼 배출구에 진공호스를 끼우고 클램프로 체결합니다. 백당 → 첨가제 순으로 연결하고 체결 상태를 확인한 뒤 이송기를 켭니다.",()=>"#lcCheck",()=>!f().hoseC||f().hoseC[0]&&f().hoseC[1],{pts:2,chk:()=>f().hoseC&&!(f().hoseC[0]&&f().hoseC[1])?{job:"hose",t:"IBC 진공호스 연결",set(){ f().hoseC=[true,true]; toast("IBC 진공호스 연결 · 클램프 체결 완료 (백당 · 첨가제)","good"); }}:null}));\n    A.push(T_("ibc1","이송기 1(첨가제) ON",', 1),
        ('  if(room==="F") presetPackAuto(); else presetFillAuto();', '  if(S.mode!=="demo"){ if(room==="F") presetPackAuto(); else presetFillAuto(); }   /* 시연모드 : 모든 설비 꺼진 상태에서 시작 */', 1),
        ('if(!S.activeTrouble) beginRecovery("F1");', 'if(!S.activeTrouble) beginRecovery(S.flags.incK==="RF4"?"RF4":"F1");', 1),   # 중량 점검 사례 (cases.js RF4)
        ('FX(FIL.xc,1500,FIL.z1+40,"front"', 'FX(...ANC.sealFront,"front"', 1),
        ('FX(PANEL_F.x,1100,PANEL_F.z,"panel"', 'FX(...ANC.panelIn,"panel"', 1),
        ('FX(FIL.xc,700,FIL.z1,"front"', 'FX(...ANC.limit,"front"', 1),
        ('FX(FIL.x0-300,950,CVL.z+330,"front"', 'FX(...ANC.cntConv,"chute"', 1),
        ('FX(-3600,CVL.y+60,CVL.z,"leak"', 'FX(...ANC.convMotor,"chute"', 1),
        ('FX(FIL.xc,1500,FIL.z0-180,"prn"', 'FX(...ANC.prn,"prn"', 2),
        ('FX(FIL.xc+300,1500,FIL.z0-180,"prn"', 'FX(...ANC.vis,"prn"', 1),
        ('FX(FIL.xc,NOZ.y,NOZ.z,"front"', 'FX(...ANC.nozzle,"front"', 1),
        ("fix:[FIL.xc,DECK.y+200,FIL.z1+10]", "fix:ANC.dialF", 1),
        ("fix:[FIL.xc,1500,FIL.z0-180]", "fix:ANC.prn", 1),
        ("fix:[FIL.xc,1020,CVL.z-40]", "fix:ANC.chute", 1),
        ("fix:[(PR.x0+PR.x1)/2,700,-120]", "fix:ANC.prHead", 1),
        ("fix:[2600,PK.y+900,CT.z0+250]", "fix:ANC.leaf", 1),
    ],
}


def load(folder: str, name: str) -> str:
    base = {"old": OLD, "v3": SRC, "oee": H.parent.parent / "oee"}[folder]
    text = (base / name).read_text(encoding="utf-8")
    if folder == "old" and name in RENAME_CV:
        text = re.sub(r"\bCV\b", "CVL", text)          # 새 3D 의 CV(배출 컨베이어) 와 이름 충돌 방지
    if folder == "old" and name == "layout.js":
        i = text.index("/* ── 카메라 시점 ── */")       # 옛 카메라 시점 · 작업 시점은 anchors.js 로 대체
        text = text[:i]
    if folder == "old" and name == "ui.js":
        i = text.index("const LBL=[")
        j = text.index("];", i) + 2
        text = text[:i] + "const LBL=LBL3;" + text[j:]
    for old, new, n in PATCH.get(name, []) if folder == "old" else []:
        c = text.count(old)
        if c != n:
            sys.exit(f"{name}: '{old[:50]}' 가 {c} 번 (기대 {n})")
        text = text.replace(old, new)
    return text


BODY_PATCH = [   # 메인화면 : 순서도 삭제 · 과정 → 기본 · 심화 · OEE
    ('<button class="gbtn" id="fpBtn">🧍 1인칭</button>', '<button class="gbtn" id="fpBtn">🎥 3인칭 → 1인칭 전환</button>', 1),   # 버튼 = 현재 시점 + 전환 (11/16)
    ('<button class="gbtn" id="apBtn">▶ 자동재생</button>', '<button class="gbtn" id="apBtn" hidden>▶ 자동재생</button>\n    <label class="gbtn gqMenu" title="그래픽 품질">🖥 그래픽 <select id="gqSel"><option value="ultra">최고</option><option value="high">상</option><option value="mid">중</option><option value="low">하</option><option value="auto">자동</option></select><s id="gqNow"></s></label>', 1),   # 자동재생 버튼 삭제 · 그래픽 설정 메뉴 (11/16)
    ('상단 [🎥 3인칭 보기] 로', '상단 [🧍 1인칭 → 3인칭 전환] 으로', 1),
    ('<span>R · 우클릭</span>', '<span>C</span>앉기 · 일어서기 (눈높이 약 1.1 m)<span>R · 우클릭</span>', 1),
    ('      <div id="lineStrip"></div>\n', '', 1),
    ('<button class="s" id="spEasy">기본모드 · 학습<small>핵심 절차 안내</small></button>',
     '<h4>기본</h4><button class="s" id="spEasy">기본 · 학습<small>라인 가동 핵심 절차 안내</small></button>', 1),
    ('<button class="e" id="spExamEasy">기본모드 · 평가</button>', '<button class="e" id="spExamEasy">기본 · 평가</button>', 1),
    ('<button class="s" id="spGuide">심화모드 · 학습<small>전체 절차 단계별 안내</small></button>',
     '<h4>심화</h4><button class="s" id="spGuide">심화 · 학습<small>라인 가동 전체 절차 단계별 안내</small></button>', 1),
    ('<button class="e" id="spExam">심화모드 · 평가</button>\n        </div>\n      </div>',
     '<button class="e" id="spExam">심화 · 평가</button>\n        </div>\n'
     '        <div class="modeColumn oee">\n          <h4>OEE</h4><button class="o" id="spOee">OEE 관리 대시보드<small>OEE DB 연결 · 부동 트렌드 · 교육 효과</small></button>\n'
     '          <button class="o2" id="spInc">이상사례 대처 교육<small>부동 빈도 · 중요도 순 학습 · 평가</small></button>\n        </div>\n'
     '        <div class="modeColumn demo">\n          <h4>시연</h4><button class="d" id="spDemo">시연모드<small>장비 ON → 이송기 → 가동 → 수동 포장까지 간단히</small></button>\n        </div>\n      </div>\n'
     '      <div id="incPick" style="display:none"></div>', 1),
]


def body() -> str:
    text = (OLD / "body.html").read_text(encoding="utf-8")
    for old, new, n in BODY_PATCH:
        c = text.count(old)
        if c != n:
            sys.exit(f"body.html: '{old[:50]}' 가 {c} 번 (기대 {n})")
        text = text.replace(old, new)
    return text


def build() -> str:
    shell = (OLD / "shell.html").read_text(encoding="utf-8")
    three = (V2 / "vendor" / "three.min.js").read_text(encoding="utf-8")
    js = "\n".join(f"/* ── v2/{n} ── */\n" + (V2 / "src" / n).read_text(encoding="utf-8") for n in V2_SCRIPTS)
    js += "\n" + "\n".join(f"/* ── {f}/{n} ── */\n" + load(f, n) for f, n in ORDER)
    names = re.findall(r"^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)", js, re.M)   # 같은 이름 최상위 선언 2번 → 페이지 전체가 멈춤 (11/16 pv 충돌)
    dup = sorted({n for n in names if names.count(n) > 1})
    if dup:
        sys.exit("최상위 이름 중복 선언 : " + ", ".join(dup))
    if "</script" in js.lower() or "</script" in three.lower():
        sys.exit("script text must not contain </script")
    parts = {
        "/*__CSS__*/": (OLD / "style.css").read_text(encoding="utf-8") + "\n" + (SRC / "style3.css").read_text(encoding="utf-8") + "\n" + (H.parent.parent / "oee" / "oee.css").read_text(encoding="utf-8"),
        "<!--__BODY__-->": body(),
    }
    for key, text in parts.items():
        if shell.count(key) != 1:
            sys.exit(f"shell.html must contain {key} exactly once")
        shell = shell.replace(key, text)
    if shell.count("/*__JS__*/") != 1:
        sys.exit("shell.html must contain /*__JS__*/ exactly once")
    # three.js 는 strict 모드 밖 별도 스크립트로 먼저 싣는다
    shell = shell.replace("<script>\n\"use strict\";\n/*__JS__*/", "<script>" + three + "</script>\n<script>\n\"use strict\";\n" + js)
    if "/*__JS__*/" in shell:
        sys.exit("shell.html script block layout changed")
    return shell


def main() -> None:
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else OUT
    out.write_text(build(), encoding="utf-8")
    print(f"built {out} ({out.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
