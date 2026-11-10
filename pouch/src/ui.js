/* ═══════════════════════════════════════════════════════════════════
   화면 — 타일 · 코치 · 힌트 · 3D 오버레이 · 시작 화면 · 결과
   ═══════════════════════════════════════════════════════════════════ */
let hintOn=false;                          /* 평가 모드 힌트 보기 */
let PICK_ROOM="F";

/* ── 작업자 이동 후 실행 ── */
function act(job,fn,opt){ if(!startWork(job,()=>{ fn(); after(); },opt)){ toast("작업자가 다른 작업 중입니다."); return false; } renderTiles(); return true; }
function after(){ renderTiles(); drawHMI(); stepCheck(); }
const runBlock=()=>{ if(S.f.run){ toast("운전 중에는 할 수 없습니다. 먼저 STOP.","bad"); return true; } return false; };

/* ── 타일 정의 (과정별) ── */
const TILE={
  /* 충전실 · 유틸리티 */
  fMain:{e:"⚡",b:"메인 파워",s:()=>S.f.main?"ON · 히터 "+Math.round(S.f.heat)+" ℃":"OFF",on:()=>S.f.main,
    click(){ const f=S.f; act("power",()=>{ if(f.main){ fillerStop(); f.main=false; f.panel=false; f.user=null; toast("메인 파워 OFF"); } else { f.main=true; toast("메인 파워 ON — 실링 히터 예열 (실제 20분)","good"); } }); }},
  fAir1:{e:"💨",b:"압축공기 밸브 1",s:()=>fmt(S.f.airP,1)+" kgf/cm²",on:()=>S.f.airV[0],warn:()=>S.f.run&&!S.f.airV[0],
    click(){ act("air",()=>{ S.f.airV[0]=!S.f.airV[0]; toast("압축공기 밸브 1 "+(S.f.airV[0]?"열림":"잠금")); }); }},
  fAir2:{e:"💨",b:"압축공기 밸브 2",s:()=>S.f.airV[1]?"열림":"잠금",on:()=>S.f.airV[1],warn:()=>S.f.run&&!S.f.airV[1],
    click(){ act("air",()=>{ S.f.airV[1]=!S.f.airV[1]; toast("압축공기 밸브 2 "+(S.f.airV[1]?"열림":"잠금")); }); }},
  fDust:{e:"🌪️",b:"집진 밸브",s:()=>"2층 상부 · "+(S.f.dustV?"열림":"닫힘"),on:()=>S.f.dustV,
    click(){ act("dust",()=>{ S.f.dustV=!S.f.dustV; toast("집진 밸브 "+(S.f.dustV?"열림":"닫힘")); }); }},
  fPanel:{e:"🖥️",b:"컨트롤 판넬",s:()=>S.f.panel?"터치스크린 ON":"OFF",on:()=>S.f.panel,
    click(){ const f=S.f; if(!f.main){ toast("메인 파워를 먼저 켜세요.","bad"); return; } act("panel",()=>{ if(f.panel){ fillerStop(); f.panel=false; f.user=null; toast("컨트롤 판넬 OFF"); } else { f.panel=true; toast("컨트롤 판넬 ON — 터치스크린 켜짐","good"); } }); }},
  fDoor:{e:"🚪",b:"안전도어",s:()=>S.f.door==="closed"?"닫힘 · 인터락 정상":"열림",on:()=>S.f.door==="closed",warn:()=>S.f.door!=="closed",
    click(){ const f=S.f; act("door",()=>{ if(f.door==="closed"){ f.door="open"; if(f.run){ deduct("doorRun"); raise("DOOR"); } toast("안전도어 열림"); } else { f.door="closed"; toast("안전도어 닫힘"); } buildStatic(); }); }},
  tAlign:{e:"🔀",b:"정렬컨베어 스위치",s:()=>"포장실 · "+(S.p.align?"ON":"OFF"),on:()=>S.p.align,
    click(){ act("align",()=>{ S.p.align=!S.p.align; toast("정렬컨베어 가동스위치 "+(S.p.align?"ON — 파우치가 포장실로 이송":"OFF — 공포배출 쪽으로 배출")); }); }},
  /* 충전실 · 자재 · 원료 */
  mLift:{e:"🛗",b:"주성분 STS 용기",s:()=>S.f.mainLift?"2층 데크 도착":"리프터로 올림",on:()=>S.f.mainLift,
    click(){ if(S.f.mainLift){ toast("이미 2층 데크에 있습니다."); return; } openCarry("sts"); }},
  mScoop:{e:"🥄",b:"주성분 스쿱 공급",s:()=>"2번 호퍼 "+Math.round(S.hop.main)+" %",lv:()=>S.hop.main,on:()=>S.hop.main>=50,warn:()=>S.f.filling&&S.hop.main<10,
    click(){ if(!S.f.mainLift){ toast("주성분 STS 용기를 먼저 리프터로 올리세요.","bad"); return; } act("scoop",()=>{ S.hop.main=100; S.f.mainFed=true; toast("2번 호퍼 주성분 공급 완료","good"); }); }},
  mRed:{e:"🟥",b:"적색 인쇄 은박 롤",s:()=>S.f.roll==="red"?"장착됨":S.f.rollCarry==="red"?"운반 완료 · 장착 대기":"생산용",on:()=>S.f.roll==="red",warn:()=>S.f.roll==="none",
    click(){ const f=S.f; if(f.roll==="red"){ toast("이미 장착되어 있습니다."); return; } if(runBlock()) return;
      if(f.rollCarry!=="red"){ openCarry("roll"); return; }
      act("rollOut",()=>{ f.roll="red"; f.rollCarry=null; toast("적색 인쇄 은박 롤 장착 · 고정","good"); }); }},
  mRollOut:{e:"↩️",b:"은박 롤 제거",s:()=>S.f.roll==="red"?"남은 롤 빼기":"-",
    click(){ const f=S.f; if(f.roll!=="red"){ toast("뺄 적색 인쇄 롤이 없습니다."); return; } if(runBlock()) return; act("rollOut",()=>{ f.roll="none"; toast("남은 은박 롤 제거"); }); }},
  mPlain:{e:"⬜",b:"무지 은박 롤",s:()=>S.f.roll==="plain"?"장착됨":"다음 작업용",on:()=>S.f.roll==="plain",
    click(){ const f=S.f; if(f.roll==="plain"){ toast("이미 장착되어 있습니다."); return; } if(f.roll==="red"){ toast("남은 적색 롤을 먼저 제거하세요.","bad"); return; } act("roll",()=>{ f.roll="plain"; toast("무지 은박 롤 장착","good"); }); }},
  mPrn:{e:"🖨️",b:"은박 프린터",s:()=>S.f.prn.saved?S.f.prn.exp+" · "+S.f.prn.lot:"사용기한 · 배치번호",on:()=>S.f.prn.saved,
    click(){ if(runBlock()) return; act("prn",()=>{ S.f.prn={exp:EXPECT.exp, lot:EXPECT.lot, saved:true}; toast("사용기한 "+EXPECT.exp+" · 배치번호 "+EXPECT.lot+" 입력 · 저장","good"); }); }},
  tLeak:{e:"💧",b:"기밀도 시험",s:()=>S.f.leak.ok?"적합":S.f.leak.sampled?"시험 중 · 결과 확인":"샘플 채취 · 의뢰",on:()=>S.f.leak.ok,
    click(){ const f=S.f, L=f.leak;
      if(!L.sampled){ if(!(f.run&&f.filling)){ toast("충전 중인 파우치를 채취합니다. RUN · FILLING 상태에서 하세요.","bad"); return; }
        act("leak",()=>{ L.sampled=true; S.flags.leakAt=tSim; toast("기밀도 시험 샘플 채취 · 의뢰"); }); return; }
      if(!L.ok){ if(tSim-S.flags.leakAt<3){ toast("시험 진행 중입니다."); return; } L.ok=true; toast("기밀도 시험 결과 — 적합","good"); after(); } }},
  tDoc:{e:"📋",b:"문서 · 기록",s:()=>{ const k=Object.keys(DOCS).filter(k=>DOCS[k].room===S.room); return k.filter(x=>S.doc[x]).length+" / "+k.length+" 완료"; },
    click(){ openDocs(); }},
  /* 포장실 · 유틸리티 */
  pCtMain:{e:"⚡",b:"카토너 메인",s:()=>"기계 뒤편 · "+(S.p.ctMain?"ON":"OFF"),on:()=>S.p.ctMain,
    click(){ const p=S.p; act("ctBack",()=>{ p.ctMain=!p.ctMain; if(!p.ctMain){ p.ctRun=false; p.sfRun=false; p.ctUser=false; } toast("카토너 메인스위치 "+(p.ctMain?"ON":"OFF")); }); }},
  pSfSw:{e:"🔌",b:"스틱공급장치 스위치",s:()=>"기계 뒤편 · "+(S.p.sfSw?"ON":"OFF"),on:()=>S.p.sfSw,
    click(){ const p=S.p; act("ctBack",()=>{ p.sfSw=!p.sfSw; if(!p.sfSw) p.sfRun=false; toast("스틱공급장치 스위치 "+(p.sfSw?"ON":"OFF")); }); }},
  pCtAir:{e:"💨",b:"카토너 압축공기",s:()=>S.p.ctAir?"공급":"차단",on:()=>S.p.ctAir,
    click(){ const p=S.p; act("ctBack",()=>{ p.ctAir=!p.ctAir; if(!p.ctAir) p.ctRun=false; toast("카토너 압축공기 "+(p.ctAir?"공급":"차단")); }); }},
  pHm:{e:"🔥",b:"핫멜트",s:()=>Math.round(S.p.hmT)+" ℃ · "+(hmReady()?"가동 가능":S.p.hm?"승온 중":"OFF"),on:()=>hmReady(),warn:()=>S.p.hm&&!hmReady(),
    click(){ const p=S.p; act("hm",()=>{ p.hm=!p.hm; toast("핫멜트 "+(p.hm?"ON — 승온 (실제 40분)":"OFF — 고온 주의")); }); }},
  pCw:{e:"⚖️",b:"중량선별기 전원",s:()=>S.p.cwPow?"ON":"OFF",on:()=>S.p.cwPow,
    click(){ const p=S.p; act("cwPow",()=>{ p.cwPow=!p.cwPow; if(!p.cwPow) p.cwRun=false; toast("중량선별기 전원 "+(p.cwPow?"ON (실제 30분 전)":"OFF")); }); }},
  pXr:{e:"☢️",b:"X-ray 주 전원",s:()=>S.p.xrPow?(xrReady()?"부팅 완료":"부팅 중 "+Math.round(S.p.xrBoot*100)+" %"):"OFF",on:()=>xrReady(),warn:()=>S.p.xrPow&&!xrReady(),
    click(){ const p=S.p; act("xrPow",()=>{ p.xrPow=!p.xrPow; toast("X-ray 주 전원 "+(p.xrPow?"ON — 부팅 (실제 약 1분)":"OFF")); }); }},
  pXrKey:{e:"🔑",b:"X선 키 스위치",s:()=>S.p.xrKey?"ON":"OFF",on:()=>S.p.xrKey,
    click(){ const p=S.p; if(!xrReady()){ toast("X-ray 부팅이 끝난 뒤 켭니다.","bad"); return; } act("xrPow",()=>{ p.xrKey=!p.xrKey; if(!p.xrKey){ p.xrX=false; p.xrConv=false; } toast("X선 출력 키 "+(p.xrKey?"ON":"OFF")); }); }},
  pPr:{e:"🖨️",b:"케이스 프린터 전원",s:()=>S.p.prMain?(S.p.prPow?"메인 · 프린터 ON":"메인 ON · 프린터 OFF"):"OFF",on:()=>S.p.prMain&&S.p.prPow,
    click(){ const p=S.p; act("prPow",()=>{ if(!p.prMain){ p.prMain=true; toast("케이스 프린터 메인 전원 ON"); } else if(!p.prPow){ p.prPow=true; toast("프린터 전원(하단) ON","good"); }
      else { if(p.prRun||p.vsRun){ toast("인쇄 · 비전을 먼저 정지하세요.","bad"); return; } p.prMain=false; p.prPow=false; p.vsUser=false; toast("케이스 프린터 전원 OFF"); } }); }},
  /* 포장실 · 자재 */
  pMag:{e:"📦",b:"카톤",s:()=>"매거진 "+S.p.mag+" 매",lv:()=>Math.min(100,S.p.mag/4),on:()=>S.p.mag>0,
    click(){ act("mag",()=>{ S.p.mag=400; toast("카톤 매거진에 카톤 투입","good"); }); }},
  pLeaf:{e:"📄",b:"설명서",s:()=>"공급장치 "+S.p.leaf+" 매",lv:()=>Math.min(100,S.p.leaf/4),on:()=>S.p.leaf>0,
    click(){ act("leaf",()=>{ S.p.leaf=400; toast("설명서 공급장치에 설명서 투입","good"); }); }},
  pMagOut:{e:"🧹",b:"매거진 자재 제거",s:()=>"카톤 · 설명서 전량",
    click(){ if(S.p.ctRun){ toast("카토너 가동 중입니다. 먼저 STOP.","bad"); return; } act("magOut",()=>{ S.p.mag=0; S.p.leaf=0; toast("매거진 카톤 · 설명서 전량 제거","good"); }); }},
  pBin:{e:"🗑️",b:"불량배출함 회수",s:()=>"X-ray "+LN.binX+" · 중량 "+LN.binW+" · 비전 "+LN.rejBox,
    click(){ act("bin",()=>{ LN.binX=0; LN.binW=0; LN.rejBox=0; toast("불량배출함 회수 · 기록"); }); }}
};
const TILESET={F:{util:["fMain","fAir1","fAir2","fDust","fPanel","fDoor","tAlign"], mat:["mLift","mScoop","mRed","mRollOut","mPlain","mPrn","tLeak","tDoc"]},
               P:{util:["pCtMain","pSfSw","pCtAir","pHm","pCw","pXr","pXrKey","pPr","tAlign"], mat:["pMag","pLeaf","pMagOut","pBin","tDoc"]}};
function buildTiles(){
  const T=TILESET[S.room];
  const html=ids=>ids.map(id=>{ const t=TILE[id]; return '<div class="tile" id="'+id+'"><div class="e">'+t.e+'</div><b>'+t.b+'</b><s></s>'+(t.lv?'<div class="lv"><i></i></div>':'')+'</div>'; }).join("");
  $("#utilTiles").innerHTML=html(T.util); $("#matTiles").innerHTML=html(T.mat);
  for(const id of [...T.util,...T.mat]) $("#"+id).onclick=()=>{ if(!S||!S.session) return; TILE[id].click(); };
  $("#roomNm").textContent=ROOM_NM[S.room];
  /* 3D 시점 버튼 */
  const V=S.room==="F"?[["all","전체"],["fill","충전실"],["front","전면"],["back","후면"],["deck","2층 데크"],["panel","판넬"],["conv","정렬컨베어"],["top","평면"]]
                       :[["all","전체"],["pack","포장실"],["feed","스틱공급"],["pr","프린터"],["xr","X-ray"],["cw","중량선별"],["hand","수동포장"],["top","평면"]];
  $("#v3Grp").innerHTML=V.map(([k,t],i)=>'<button data-v="'+k+'"'+(i===1?' class="on"':"")+'>'+t+'</button>').join("")+
    '<button class="tg'+(VIEW3.guard?" on":"")+'" id="tgGuard">가드</button><button class="tg'+(R3.shadowOn!==false?" on":"")+'" id="tgShadow">그림자</button><button class="tg'+(VIEW3.label?" on":"")+'" id="tgLabel">라벨</button>';
  $$("#v3Grp [data-v]").forEach(b=>b.onclick=()=>{ camSet(b.dataset.v); $$("#v3Grp [data-v]").forEach(x=>x.classList.toggle("on",x===b)); });
  $("#tgGuard").onclick=()=>{ VIEW3.guard=!VIEW3.guard; $("#tgGuard").classList.toggle("on",VIEW3.guard); buildStatic(); };
  $("#tgShadow").onclick=()=>{ R3.shadowOn=!R3.shadowOn; $("#tgShadow").classList.toggle("on",R3.shadowOn); };
  $("#tgLabel").onclick=()=>{ VIEW3.label=!VIEW3.label; $("#tgLabel").classList.toggle("on",VIEW3.label); };
}
/* 2인 1조 운반 선택 */
function openCarry(what){
  const nm=what==="roll"?"적색 인쇄 은박 롤":"주성분 STS 용기";
  $("#carryBox").innerHTML='<h2>🧑‍🤝‍🧑 '+nm+' 운반</h2><p>운반 방법을 고르세요.</p>'+
    '<button class="choice" data-c="2">2인 1조로 운반한다</button><button class="choice" data-c="1">혼자(1인) 운반한다</button>'+
    '<div class="mbtn"><button id="carryX">취소</button></div>';
  $("#mCarry").classList.add("on");
  $("#carryX").onclick=()=>$("#mCarry").classList.remove("on");
  $$("#carryBox [data-c]").forEach(b=>b.onclick=()=>{
    if(b.dataset.c==="1"){ deduct("oneCarry"); b.classList.add("bad"); toast("은박 롤 · STS 용기는 반드시 2인 1조로 옮깁니다.","bad"); return; }
    $("#mCarry").classList.remove("on");
    if(what==="roll") act("roll",()=>{ S.f.rollCarry="red"; toast("적색 인쇄 은박 롤 2인 1조 운반 완료","good"); });
    else act("lift",()=>{ S.f.mainLift=true; toast("주성분 STS 용기 — 리프터로 2층 데크 도착","good"); });
  });
}
/* 문서 · 기록 */
function openDocs(){
  const ks=Object.keys(DOCS).filter(k=>DOCS[k].room===S.room);
  $("#listBox").innerHTML='<h2>📋 문서 · 기록</h2><p>작업 전 · 후 표시서와 출고 기록을 처리합니다.</p>'+
    ks.map(k=>'<div class="row"><b>'+esc(DOCS[k].t)+'<s>'+(S.doc[k]?"완료":"미완료")+'</s></b><button data-doc="'+k+'"'+(S.doc[k]?" disabled":"")+'>수행</button></div>').join("")+
    '<div class="mbtn"><button id="listX">닫기</button></div>';
  $("#mList").classList.add("on"); $("#listX").onclick=()=>$("#mList").classList.remove("on");
  $$("#listBox [data-doc]").forEach(b=>b.onclick=()=>{ const k=b.dataset.doc; $("#mList").classList.remove("on");
    act(DOCS[k].job,()=>{ S.doc[k]=true; toast(DOCS[k].t+" — 완료","good"); }); });
}

function renderTiles(){
  if(!S||!S.session) return;
  const T=TILESET[S.room];
  for(const id of [...T.util,...T.mat]){
    const t=TILE[id], e=$("#"+id); if(!e) continue;
    let on=false, warn=false; try{ on=t.on?!!t.on():false; warn=t.warn?!!t.warn():false; }catch(x){}
    e.classList.toggle("on",on); e.classList.toggle("warn",warn);
    const s=e.querySelector("s"), txt=t.s(); if(s.textContent!==txt) s.textContent=txt;
    if(t.lv){ const p=clamp(t.lv(),0,100), i=e.querySelector(".lv i"); i.style.width=p+"%"; i.className=p<=0?"out":p<15?"low":""; }
  }
  const busy=new Set(WK.filter(w=>w.job).map(w=>w.job.key));
  const JOBTILE={power:"fMain",air:"fAir1",dust:"fDust",panel:"fPanel",door:"fDoor",align:"tAlign",lift:"mLift",scoop:"mScoop",roll:"mRed",rollOut:"mRollOut",prn:"mPrn",leak:"tLeak",docF:"tDoc",docP:"tDoc",
    ctBack:"pCtMain",hm:"pHm",cwPow:"pCw",xrPow:"pXr",prPow:"pPr",mag:"pMag",leaf:"pLeaf",magOut:"pMagOut",bin:"pBin"};
  $$("#utilTiles .tile,#matTiles .tile").forEach(e=>e.classList.toggle("busy",[...busy].some(k=>JOBTILE[k]===e.id)));
  renderMon(); renderFlow(); renderIpc();
}
function renderMon(){
  const f=S.f, p=S.p, c=S.cnt;
  const run=S.room==="F"?f.run:p.ctRun;
  $("#monRun").textContent=run?"운전 중":tripAlarms().length?"알람 정지":"정지";
  const top=(t,v,r)=>'<div>'+t+'<strong'+(r?' class="r"':"")+'>'+v+'</strong></div>';
  const st=(k,v,w)=>'<div class="st"><div class="k">'+k+'</div><div class="v'+(w?" w":"")+'">'+v+'</div></div>';
  let a, b;
  if(S.room==="F"){
    const next=S.ipc.done>=IPC_ROUNDS.length?"완료":Math.max(0,(S.ipc.done+1)*IPC_EVERY-c.carton)+" 카톤";
    a=top("생산카운터 (Cut)",c.pouch.toLocaleString())+top("공포 · 불량 배출",c.empty.toLocaleString(),1)+top("운전속도",(f.run?f.spm:0)+" <small>stroke/min</small>")+top("목표 / 진행 (카톤)",c.good+" / "+c.target);
    b=st("필름카운터",f.strokes.toLocaleString()+" stroke")+st("세로 · 가로 접착",Math.round(f.heat)+" / "+f.heatSV+" ℃",f.main&&f.heat<f.heatSV-6)+
      st("호퍼 1 · 2 · 3",Math.round(S.hop.add)+" · "+Math.round(S.hop.main)+" · "+Math.round(S.hop.sug)+" %",S.hop.main<10&&f.filling)+st("IPC 다음 회차까지",next)+
      st("도징 1 · 2 · 3",f.dose.map(x=>x?"ON":"OFF").join(" · "),!f.dose.every(x=>x))+st("정렬컨베어",p.align?"ON":"OFF");
  }else{
    const avg=S.cwN?fmt(S.cwSum/S.cwN,2)+" g":"-";
    a=top("카토너 생산량",c.carton.toLocaleString())+top("불량 배출 합계",(c.rejVs+c.rejXr+c.rejCw).toLocaleString(),1)+top("카토너 속도",(p.ctRun?50:0)+" <small>카톤/min</small>")+top("목표 / 진행 (카톤)",c.good+" / "+c.target);
    b=st("비전 NG",c.rejVs+" 개")+st("X-ray OK / NG",S.xrLast+" · NG "+c.rejXr)+st("중량선별 NG · 평균",c.rejCw+" · "+avg)+st("대케이스",c.cases+" 개")+
      st("핫멜트",Math.round(p.hmT)+" ℃",p.hm&&!hmReady())+st("정렬컨베어",p.align?"ON":"OFF");
  }
  if($("#monTop").innerHTML!==a) $("#monTop").innerHTML=a;
  if($("#monStats").innerHTML!==b) $("#monStats").innerHTML=b;
}
const FLOW=[["fl","충전기 SP303","성형 · 10열 충전 · 실링 · 커팅","fill"],["cv","정렬컨베어","경사 이송 · 벽 통과","conv"],["sf","스틱공급장치","파우치 정렬 · 공급","feed"],["ct","카토너 HC 100L","6포 + 설명지 → 카톤","pack"],
  ["pr","케이스 프린터 · 비전","LOT · EXP 인쇄 · 판독","pr"],["xr","X-ray","이물 검사","xr"],["cw","중량선별기","105.5 g ±2.0 g","cw"],["hand","수동포장","대케이스 8카톤","hand"]];
function renderFlow(){
  const p=S.p, f=S.f;
  const act={fl:f.run, cv:p.align&&LN.pouch.length>0, sf:p.sfRun, ct:p.ctRun, pr:p.prRun&&p.vsRun, xr:p.xrConv, cw:p.cwRun, hand:LN.table>0||S.cnt.good>0};
  const html=FLOW.map(([k,a,b],i)=>'<div class="fcard'+(act[k]?" act":"")+(k==="fl"&&tripAlarms().length?" bad":"")+'" data-fl="'+i+'"><b>'+(i+1)+'. '+a+'</b><s>'+b+'</s></div>'+(i<FLOW.length-1?'<div class="farrow">▶</div>':'')).join("");
  const e=$("#flow"); if(e.dataset.h!==html){ e.innerHTML=html; e.dataset.h=html; $$("#flow [data-fl]").forEach(x=>x.onclick=()=>camSet(FLOW[+x.dataset.fl][3])); }
}

/* ── 코치 ── */
function bindPanel(){
  $("#lcCheck").onclick=()=>{
    const st=curStep(); if(!st||S.activeTrouble) return;
    if(st.lc!==undefined){ if(S.clear.includes(st.lc)) return; const c=CLEAR[S.room][st.lc];
      act(c.job,()=>{ S.clear.push(st.lc); toast("라인 클리어런스 확인 : "+c.t,"good"); }); return; }
    const c=st.chk&&st.chk(); if(!c) return;
    act(c.job,()=>{ c.set(); });
  };
  $("#incAsk").onclick=()=>openIncidentAsk();
  $("#fixBtn").onclick=()=>{ const h=recoveryStep(); if(!h||h.k!=="fix"||!h.f.fix) return; if(!h.f.act()) toast("작업자가 다른 작업 중입니다."); };
  $("#examHint").onclick=()=>{ if(hintOn) return; hintOn=true; S.hintUsed++; deduct("hint"); renderCoach(); };
  $("#stepPrev").onclick=()=>toast("현재 단계를 수행하면 다음 단계로 넘어갑니다.");
  $("#stepNext").onclick=()=>toast("현재 단계를 수행하면 다음 단계로 넘어갑니다.");
  $("#stepCur").onclick=()=>{ renderCoach(); applyHint(); };
  $("#caseBtn").onclick=()=>openList("case");
  $("#faultBtn").onclick=()=>openList("alarm");
}
function renderCoach(){
  const c=$("#coach"); if(!S||!S.session) return;
  const A=STEPS(), st=curStep(), ex=isExam();
  const rec=S.activeTrouble?recoveryStep():null, ip=!rec&&S.ipc.open?ipcStep():null;
  const cs=rec&&CASES[S.activeTrouble.k];
  c.className=rec?(cs?"case":"alarm"):ip?"ipc":S.session.ended?"done":ex?"exam":isEasy()?"easy":"";
  if(rec){
    $("#cStep").textContent=(cs?"🟧 이상사례":"🚨 알람 대응")+" · "+rec.title;
    $("#cTitle").textContent=S.activeTrouble.inc.nm;
    $("#cDesc").textContent=ex&&!hintOn?"원인을 판단하고 조치하세요.":rec.t;
  }else if(ip){
    $("#cStep").textContent="🧪 정기 공정검사 (IPC)"+(S.ipc.forcedRun?" · 추가 확인":" · "+S.ipc.round+"회차");
    $("#cTitle").textContent="도징 설정 → 채취 · 계량 → 판정";
    $("#cDesc").textContent=ex&&!hintOn?"공정검사를 수행하세요.":ip.t;
  }else if(st){
    $("#cStep").textContent=ROOM_NM[S.room]+" · "+MODE_NM[S.mode]+" · STEP "+(S.tIdx+1)+" / "+A.length+(st.watch?" · 생산 "+S.cnt.good+" / "+S.cnt.target+" 카톤":"");
    $("#cTitle").textContent=st.t;
    $("#cDesc").textContent=ex&&!hintOn?(st.watch?"라인을 감시하고 이상에 대응하세요.":"평가 진행 중 — 절차에 따라 수행하세요."):st.d;
  }else{ $("#cStep").textContent="완료"; $("#cTitle").textContent="모든 단계를 마쳤습니다"; $("#cDesc").textContent="상단 [학습 종료] 로 결과를 확인하세요."; }
  const chk=!rec&&!ip&&st&&(st.lc!==undefined&&!S.clear.includes(st.lc)||st.chk&&st.chk());
  $("#lcCheck").style.display=chk?"":"none";
  $("#incAsk").style.display=(rec&&rec.k==="ask")?"":"none";
  $("#examHint").style.display=ex?"":"none"; $("#examHint").disabled=hintOn;
  $("#examHint").textContent=hintOn?"💡 힌트 표시 중":"💡 힌트 보기 · −5점";
  $("#stepCur").textContent=Math.min(S.tIdx+1,A.length)+" / "+A.length;
  $("#endBtn").textContent=ex?"평가 종료":"학습 종료";
  applyHint();
}
/* 현재 눌러야 할 곳 (힌트 · 자동재생 공용) */
function hintTarget(){
  if(!S||!S.session||!S.session.active) return null;
  if($("#mCarry").classList.contains("on")) return '#carryBox [data-c="2"]';
  if($("#mInc").classList.contains("on")){ const R=S.recovery; if(R){ const i=R.choices.findIndex(c=>c.ok); return '#incBox .choice[data-i="'+i+'"]'; } }
  if(S.activeTrouble){ const h=recoveryStep(); return h?h.sel:null; }
  if(S.ipc.open){ const h=ipcStep(); return h?h.sel:null; }
  const st=curStep(); if(!st) return null;
  try{ return st.plan(); }catch(e){ return null; }
}
let hintEl=null;
function applyHint(){
  const g=$("#guideArrow");
  const show=S&&S.session&&S.session.active&&(!isExam()||hintOn);
  const sel=show?hintTarget():null;
  let el=null;
  if(sel){ for(const s of String(sel).split(",")){ const e=document.querySelector(s.trim()); if(e&&e.getBoundingClientRect().width>0){ el=e; break; } } }
  if(el!==hintEl){ if(hintEl) hintEl.classList.remove("hint"); hintEl=el; if(el&&el.id!=="fixBtn") el.classList.add("hint"); }
  if(!el){ g.style.display="none"; return; }
  const r=el.getBoundingClientRect();
  g.style.display="block"; g.style.left=clamp(r.left+r.width/2,28,innerWidth-28)+"px"; g.style.top=Math.max(40,r.top-2)+"px";
}

/* ── 3D 배경 · 오버레이 ── */
function drawRoom(){
  const g=R3.ctx, W=R3.W, H=R3.H;
  const bg=g.createLinearGradient(0,0,0,H); bg.addColorStop(0,"#9fb0b6"); bg.addColorStop(1,"#7d8b92");
  g.fillStyle=bg; g.fillRect(0,0,W,H);
}
const LBL=[[FIL.xc,DECK.y+2100,FIL.z0,"파우치 충전기 SP303 · 2층 데크","F"],[IBC[0].x,2100,IBC[0].z,"IBC (첨가제 · 백당)","F"],[-2400,1900,CV.z,"정렬컨베어 (경사)","F"],
  [(FEED.x0+FEED.x1)/2,2000,0,"스틱공급장치","P"],[(CT.x0+CT.x1)/2,2200,-100,"카토너 HC 100L","P"],[(PR.x0+PR.x1)/2,2150,0,"케이스 프린터 · 비전","P"],
  [(XR.x0+XR.x1)/2,2150,0,"X-ray","P"],[(CW.x0+CW.x1)/2,1900,0,"중량선별기","P"],[(PACK.x0+PACK.x1)/2,1700,100,"수동포장","P"]];
let HOT=[];
function drawOverlay(){
  const g=R3.ctx, W=R3.W, H=R3.H, K=W/Math.max(1,$("#view3d").clientWidth);
  HOT.length=0;
  g.textAlign="center"; g.textBaseline="middle";
  if(VIEW3.label&&!fpActive()){
    g.font="800 "+(12*K).toFixed(0)+"px "+'"Malgun Gothic",sans-serif';
    for(const [x,y,z,t] of LBL){ const p=prj(x,y,z); if(!p||p.x<0||p.x>W||p.y<0||p.y>H) continue;
      const w=g.measureText(t).width+16*K, h=21*K;
      g.fillStyle="rgba(22,32,44,.80)"; rr(g,p.x-w/2,p.y-h,w,h,7*K); g.fill(); g.fillStyle="#fff"; g.fillText(t,p.x,p.y-h/2); }
    if(S&&S.session&&!isExam()) for(const d of DEVICES){
      if(machOf(d.k).room!==S.room&&cam.dist>6000) continue;
      const p=prj(d.p[0],d.p[1],d.p[2]); if(!p||p.x<0||p.x>W||p.y<0||p.y>H) continue;
      const r=8.5*K; g.lineCap="round";
      g.beginPath(); g.moveTo(p.x-r,p.y); g.lineTo(p.x+r,p.y); g.moveTo(p.x,p.y-r); g.lineTo(p.x,p.y+r);
      g.lineWidth=6*K; g.strokeStyle="rgba(20,32,48,.22)"; g.stroke();
      g.lineWidth=3.2*K; g.strokeStyle=HOVER===d.n?"rgba(126,190,255,.98)":"rgba(255,255,255,.85)"; g.stroke();
      HOT.push({n:d.n,x:p.x,y:p.y,r:r+7*K});
    }
    if(HOVER!=null){ const d=devOf(HOVER), s=HOT.find(x=>x.n===HOVER);
      if(d&&s){ g.font="800 "+(12.5*K).toFixed(0)+"px sans-serif"; const t=d.n+". "+d.nm, w=g.measureText(t).width+22*K, h=34*K;
        const bx=Math.min(W-w-6*K,Math.max(6*K,s.x-w/2)), by=Math.max(6*K,s.y-h-14*K);
        g.fillStyle="rgba(18,32,50,.94)"; rr(g,bx,by,w,h,8*K); g.fill(); g.textAlign="left"; g.fillStyle="#fff"; g.fillText(t,bx+11*K,by+13*K);
        g.font="700 "+(9.5*K).toFixed(0)+"px sans-serif"; g.fillStyle="#8fb4d8"; g.fillText(d.en+" · 눌러서 설명",bx+11*K,by+25*K); g.textAlign="center"; } }
  }
  g.textAlign="left"; g.textBaseline="alphabetic"; g.font="700 "+(11*K).toFixed(0)+"px sans-serif";
  const info="드래그 회전 · 휠 확대 · Shift/우클릭 드래그 이동";
  const iw=g.measureText(info).width+18*K; g.fillStyle="rgba(255,255,255,.86)"; rr(g,10*K,H-30*K,iw,22*K,7*K); g.fill();
  g.fillStyle="#526171"; g.fillText(info,19*K,H-15*K);
  const fb=$("#fixBtn"), h2=S&&S.activeTrouble?recoveryStep():null;
  if(h2&&h2.k==="fix"&&h2.f.fix){ const p=prj(...h2.f.fix); if(p&&p.x>0&&p.x<W&&p.y>0&&p.y<H){ fb.hidden=false; fb.style.left=(p.x/K)+"px"; fb.style.top=(p.y/K)+"px"; } else fb.hidden=true; }
  else fb.hidden=true;
  if(fpActive()) fb.hidden=true;
  fpOverlay(g,K);
}
function rr(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
let HOVER=null;
function onCvHover(q){ let h=null; for(const s of HOT) if(Math.hypot(q.x-s.x,q.y-s.y)<=s.r){ h=s.n; break; } HOVER=h; R3.cv.style.cursor=h?"pointer":"grab"; }
function onCvClick(q){ for(const s of HOT) if(Math.hypot(q.x-s.x,q.y-s.y)<=s.r){ openDev(s.n); return; } }
const DEVVIEW={1:"panel",2:"panel",3:"front",4:"front",5:"conv",6:"front",7:"deck",8:"deck",9:"back",10:"deck",11:"back",12:"fill",13:"feed",14:"pack",15:"pack",16:"pack",17:"pack",18:"pr",19:"xr",20:"cw",21:"cw",22:"hand"};
function openDev(n){
  const d=devOf(n); if(!d) return; const m=machOf(d.k);
  $("#devBox").innerHTML='<h2>'+d.n+'. '+esc(d.nm)+'</h2><p style="margin-top:-4px">'+esc(d.en)+' · '+esc(m?m.md+" "+m.nm:"")+'</p><div class="devImg">'+esc(d.d)+'</div>'+
    '<p style="font-size:12.5px">※ 설비 SOP 요약 기준 · 세부 절차는 SOP 원본으로 확인하세요.</p><div class="mbtn"><button class="pri" id="devX">닫기</button></div>';
  $("#mDev").classList.add("on"); $("#devX").onclick=()=>$("#mDev").classList.remove("on");
  const v=DEVVIEW[n]; if(v&&CAMVIEW[v]) camSet(v);
}

/* ── 배너 ── */
function showBanner(t,isCase){ const b=$("#banner"); b.textContent=t; b.classList.toggle("case",!!isCase); b.hidden=false; clearTimeout(showBanner.t); showBanner.t=setTimeout(()=>{ b.hidden=true; },5200); }
function hideBanner(){ $("#banner").hidden=true; }

/* ── 이상사례 · 알람 목록 (학습모드 직접 발생) ── */
function openList(kind){
  if(!S||!S.session) return;
  if(isExam()){ toast("평가모드에서는 이상사례 · 알람이 자동으로 발생합니다.","bad"); return; }
  const list=kind==="case"?Object.fromEntries(Object.entries(CASES).filter(([k,v])=>v.room===S.room)):S.room==="F"?INC:Object.fromEntries(P_ALARMS.map(k=>[k,INC[k]]));
  const running=lineRunning();
  $("#listBox").innerHTML='<h2>'+(kind==="case"?"🟧 이상사례":"🚨 알람")+' 발생</h2><p>운전 중에 목록의 상황을 직접 발생시켜 대응을 연습합니다. '+(kind==="case"?"이상사례는 알람 없이 품질 이상으로 먼저 나타납니다.":(S.room==="F"?"충전기 SOP 알람 15종입니다.":"포장실 과정에서 대응하는 충전기 알람입니다 (연동 충전기 · 현장 조치).")+" 발생 즉시 충전기가 정지합니다.")+'</p>'+
    Object.entries(list).map(([k,v])=>'<div class="row"><b>'+esc(v.nm)+'<s>'+esc(machOf(v.mk)?machOf(v.mk).md+" · "+machOf(v.mk).nm:"")+'</s></b><button data-k="'+k+'"'+(running&&!S.activeTrouble?"":" disabled")+'>지금 발생</button></div>').join("")+
    '<div class="mbtn"><button id="listX">닫기</button></div>';
  $("#mList").classList.add("on");
  $("#listX").onclick=()=>$("#mList").classList.remove("on");
  $$("#listBox [data-k]").forEach(b=>b.onclick=()=>{ $("#mList").classList.remove("on"); launchIncident(b.dataset.k); renderCoach(); });
}

/* ── 시작 화면 ── */
function initSplash(){
  $("#lineStrip").innerHTML=FLOW.map(([k,a,b],i)=>'<div class="ls'+(["fl","cv"].includes(k)?" fr":"")+'"><b>'+a+'</b><s>'+b+'</s></div>'+(i<FLOW.length-1?'<div class="ar">›</div>':'')).join("");
  const pick=r=>{ PICK_ROOM=r; $("#coursePicker").style.display="none"; $("#splash .go").style.display="grid"; $("#courseBack").style.display=""; $("#courseBack").textContent="← 과정 다시 선택 ("+ROOM_NM[r]+")"; };
  $("#chooseF").onclick=()=>pick("F"); $("#chooseP").onclick=()=>pick("P");
  $("#courseBack").onclick=()=>{ $("#coursePicker").style.display=""; $("#splash .go").style.display="none"; $("#courseBack").style.display="none"; };
  for(const [id,mode] of [["#spEasy","easy"],["#spExamEasy","examEasy"],["#spGuide","guide"],["#spExam","exam"]]) $(id).onclick=()=>{
    $("#splash").classList.add("hide"); startSession(mode,PICK_ROOM); toast(ROOM_NM[PICK_ROOM]+" · "+MODE_NM[mode]+" 시작"); };
}
function goHome(){ if(typeof apStop==="function") apStop(); if(FP.on){ FP.mod.stop(); cam.fp=null; FP.on=false; fpMoveHMI(false); } if(S&&S.session) S.session.active=false; $("#splash").classList.remove("hide"); $("#coursePicker").style.display=""; $("#splash .go").style.display="none"; $("#courseBack").style.display="none"; }

/* ── 결과 · 채점 관리 ── */
function showResult(manual){
  const ex=isExam(), sc=scoreNow(), A=STEPS();
  const pass=sc.score>=PASS;
  const rows=A.map((st,i)=>{ const l=S.stepLog.find(x=>x.i===i); return '<tr><td>'+(i+1)+'</td><td class="l">'+esc(st.t)+'</td><td>'+(st.pts||0)+'</td><td>'+(l?"완료 · "+mmss(l.at):"미완료")+'</td></tr>'; }).join("");
  const ded=S.deducts.map(d=>'<tr><td class="l">'+esc(d.why)+'</td><td>−'+d.pts+'</td><td>'+mmss(d.at)+'</td></tr>').join("")||'<tr><td colspan="3">감점 없음</td></tr>';
  const inc=(S.flags.incLog||[]).map(x=>'<tr><td>'+x.kind+'</td><td class="l">'+esc(x.nm)+'</td><td>'+mmss(x.at)+'</td></tr>').join("")||'<tr><td colspan="3">없음</td></tr>';
  const ipc=(S.ipc.log||[]).map(x=>'<tr><td>'+(x.round||"추가")+'</td><td>'+IPC_STD[x.k].nm+'</td><td>'+fmt(x.avg,3)+' g</td><td>'+(x.pass?"적합":"부적합")+'</td></tr>').join("");
  const kp=S.room==="F"?kc(S.cnt.pouch.toLocaleString()+" 포","생산카운터","hi")+kc(S.cnt.empty.toLocaleString()+" 포","공포 · 불량 배출","ng")+kc(S.cnt.good+" 카톤","양품 카톤")+kc(S.ipc.done+" 회","IPC 완료")
                       :kc(S.cnt.good+" 카톤","양품 카톤","hi")+kc((S.cnt.rejVs+S.cnt.rejXr+S.cnt.rejCw)+" 개","불량 배출","ng")+kc(S.cwN?fmt(S.cwSum/S.cwN,2)+" g":"-","중량 평균")+kc(S.cnt.cases+" 개","대케이스");
  $("#endBox").innerHTML='<h2>'+(ex?"📝 평가 결과":"📘 학습 결과")+' — '+esc(ROOM_NM[S.room]+" · "+MODE_NM[S.mode])+'</h2>'+
    '<p>'+esc(PROD.nm)+' · 소요 '+mmss(S.session.sec)+' · 진행 '+Math.min(S.tIdx,A.length)+' / '+A.length+' 단계 · 힌트 '+S.hintUsed+'회'+(manual?" (중도 종료)":"")+'</p>'+
    (ex?'<div class="finalScore">'+sc.score+'<small>점 · '+(pass?"합격":"불합격")+' (기준 '+PASS+'점)</small></div><p>단계 점수 '+sc.base+'점 − 감점 '+sc.minus+'점</p>':'')+
    '<div class="kpis" style="grid-template-columns:repeat(4,1fr);margin:10px 0">'+kp+'</div>'+
    '<h3>단계별 수행</h3><table class="ht"><tr><th>No</th><th>단계</th><th>배점</th><th>결과</th></tr>'+rows+'</table>'+
    '<h3>알람 · 이상사례 대응</h3><table class="ht"><tr><th>구분</th><th>명칭</th><th>발생</th></tr>'+inc+'</table>'+
    (ipc?'<h3>정기 공정검사 (IPC)</h3><table class="ht"><tr><th>회차</th><th>대상</th><th>평균</th><th>판정</th></tr>'+ipc+'</table>':'')+
    '<h3>감점 내역</h3><table class="ht"><tr><th>항목</th><th>감점</th><th>시각</th></tr>'+ded+'</table>'+
    '<div class="mbtn"><button class="pri" id="endAgain">다시 하기</button><button id="endHome">메인화면</button><button id="endClose">닫기</button></div>';
  $("#mEnd").classList.add("on");
  $("#endAgain").onclick=()=>{ $("#mEnd").classList.remove("on"); startSession(S.mode,S.room); };
  $("#endHome").onclick=()=>{ $("#mEnd").classList.remove("on"); goHome(); };
  $("#endClose").onclick=()=>$("#mEnd").classList.remove("on");
}
function openRubric(){
  const A=STEPS(), tot=A.reduce((s,x)=>s+(x.pts||0),0);
  $("#rubBox").innerHTML='<h2>채점 기준 — '+esc(ROOM_NM[S.room]+" · "+(isEasy()?"기본모드":"심화모드"))+'</h2><p>단계 배점 합계를 100점으로 환산한 뒤 감점을 뺍니다. 합격 기준 '+PASS+'점. 학습 · 평가는 같은 절차이며 평가에서는 안내가 표시되지 않습니다.</p>'+
    '<table class="ht"><tr><th>단계</th><th>배점</th><th>환산</th></tr>'+A.map(st=>'<tr><td class="l">'+esc(st.t)+'</td><td>'+(st.pts||0)+'</td><td>'+fmt((st.pts||0)/tot*100,1)+'</td></tr>').join("")+'</table>'+
    '<h3>감점</h3><table class="ht">'+Object.values(PENALTY).map(p=>'<tr><td class="l">'+esc(p[0])+'</td><td>−'+p[1]+'</td></tr>').join("")+'</table>'+
    '<div class="mbtn"><button class="pri" id="rubX">닫기</button></div>';
  $("#mRub").classList.add("on"); $("#rubX").onclick=()=>$("#mRub").classList.remove("on");
}
function bindHeader(){
  $$("#spdGrp [data-s]").forEach(b=>b.onclick=()=>{ SPD=+b.dataset.s; $$("#spdGrp [data-s]").forEach(x=>x.classList.toggle("on",x===b)); });
  $("#soundBtn").onclick=()=>{ SND.on=!SND.on; $("#soundBtn").textContent=SND.on?"사운드 ON":"사운드 OFF"; };
  $("#homeBtn").onclick=goHome;
  $("#rubricBtn").onclick=()=>{ if(S&&S.session) openRubric(); };
  $("#endBtn").onclick=()=>{ if(S&&S.session&&!S.session.ended) finishSession(true); };
  $("#resetBtn").onclick=()=>{ if(S&&S.mode){ startSession(S.mode,S.room); toast("처음부터 다시 시작"); } };
  const pan=d=>{ cam.txT=clamp(cam.txT+d*Math.max(700,cam.dist*0.25),-9500,12500); };
  $("#panL").onclick=()=>pan(-1); $("#panR").onclick=()=>pan(1); $("#panC").onclick=()=>camSet(S&&S.room==="P"?"pack":"fill");
}
