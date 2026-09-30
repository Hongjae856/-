/* ═══════════════════════════════════════════════════════════════════
   화면 — 타일 · 조작반 · 코치 · 힌트 · 3D 오버레이 · 시작 화면 · 결과
   ═══════════════════════════════════════════════════════════════════ */
let SEL={prod:"A",count:"30T",ml:30};
let hintOn=false;                         /* 평가 모드 힌트 보기 */

/* ── 유틸리티 · 자재 타일 ── */
function bindTiles(){
  $("#uAir").onclick=()=>{ if(!gate("#uAir")) return; S.air=!S.air; toast(S.air?"압축공기 공급 — 압력 상승 중":"압축공기 차단"); after(); };
  $("#uMain").onclick=()=>{ if(!gate("#uMain")) return;
    if(S.main&&S.running){ lineStop(); }
    S.main=!S.main; S.dust=S.main; if(!S.main){ S.user=null; lgOpen=false; } toast(S.main?"메인 전원 투입 — HMI 부팅 · 집진기 자동 가동":"메인 전원 차단 · 집진기 정지"); after(); };
  $("#uDust").onclick=()=>{ if(!gate("#uDust")) return; S.dust=!S.dust; toast(S.dust?"집진기 가동":"집진기 정지"); after(); };
  $("#uDoor").onclick=()=>{ if(!gate("#uDoor")) return;
    if(S.door==="closed"){ S.door="open"; S.doorOpens++; if(S.running){ deduct("doorRun"); raise("E001"); } toast("안전문 열림 — 인터락"); }
    else { S.door="closed"; toast("안전문 닫힘"); }
    buildStatic(); after(); };
  const mat=(id,k,job,amt,msg)=>{ $(id).onclick=()=>{
    if(!gate(id)) return;
    if(S.running&&k!=="table"){ toast("운전 중에는 자재를 다룰 수 없습니다. 먼저 STOP.","bad"); deduct("runMat"); return; }
    const w=wkFor(JOBS[job].stand); if(w.job){ toast("작업자가 다른 작업 중입니다."); return; }
    startWork(job,()=>{ amt(); toast(msg,"good"); after(); });
    renderTiles(); }; };
  mat("#mBottle","bottle","bottle",()=>{ S.mat.bottle=MAT_CAP.bottle; clearAlarm("UA11"); },"빈 병 "+MAT_CAP.bottle+"개 투입");
  mat("#mGel","gel","gel",()=>{ S.mat.gel=MAT_CAP.gel; clearAlarm("SG21"); },"실리카겔 롤 장착 ("+MAT_CAP.gel+"개)");
  mat("#mTab","tab","tab",()=>{ S.mat.tab=matCap("tab"); },"정제 투입 — 호퍼 가득");
  mat("#mFilm","film","film",()=>{ S.mat.film=MAT_CAP.film; clearAlarm("PE51"); },"PE 필름 롤 장착");
  mat("#mCap","cap","cap",()=>{ S.mat.cap=MAT_CAP.cap; },"캡 투입 ("+MAT_CAP.cap+"개)");
  mat("#mReject","reject","reject",()=>{ S.reject.n=0; LN.rejBin=[]; clearAlarm("WC42"); },"리젝트 트레이 회수 · 기록 완료");
  mat("#mTable","table","table",()=>{ unloadTable(); },"완제품 회수 — 다음 공정으로 이송");
}
function after(){ renderTiles(); drawHMI(); stepCheck(); }
/* 평가 모드 : 모든 조작 허용 (채점은 단계 완료 · 감점으로) */
function gate(sel){ return !!S; }
function examGate(){ return true; }

function renderTiles(){
  if(!S) return;
  const set=(id,on,warn)=>{ const e=$(id); if(!e) return; e.classList.toggle("on",!!on); e.classList.toggle("warn",!!warn); };
  set("#uAir",S.air&&S.airP>=5.5,S.air&&S.airP<5.5); $("#airTxt").textContent=fmt(S.airP,1)+" bar";
  set("#uMain",S.main); set("#uDust",S.dust,S.running&&!S.dust);
  set("#uDoor",S.door==="closed",S.door!=="closed"); $("#doorTxt").textContent=S.door==="closed"?"닫힘 · 인터락 정상":"열림";
  const lv=(id,k,txt)=>{ const p=matPct(k), e=$(id); if(!e) return;
    e.querySelector(".lv i").style.width=p+"%"; e.querySelector(".lv i").className=p<=0?"out":p<15?"low":"";
    set(id,p>=15,p<=0&&S.started); e.querySelector("s").textContent=txt; };
  lv("#mBottle","bottle",S.mat.bottle+" 개 · 턴테이블 "+LN.tt.n);
  lv("#mGel","gel",S.mat.gel+" 개 ("+BD().gel+" g)");
  lv("#mTab","tab",S.mat.tab.toLocaleString()+" 정");
  lv("#mFilm","film",S.mat.film+" 장");
  lv("#mCap","cap",S.mat.cap+" 개 · 슈트 "+LN.rc.chute);
  const rj=$("#mReject"); rj.querySelector("s").textContent=S.reject.n+" / "+S.reject.cap+" 병"; rj.querySelector(".lv i").style.width=(S.reject.n/S.reject.cap*100)+"%";
  rj.querySelector(".lv i").className=S.reject.n>=S.reject.cap?"out":S.reject.n>S.reject.cap*0.7?"low":""; set("#mReject",false,S.reject.n>=S.reject.cap);
  const tb=$("#mTable"); tb.querySelector("s").textContent="집적 테이블 "+S.table.n+" / "+S.table.cap+" 병"; tb.querySelector(".lv i").style.width=(S.table.n/S.table.cap*100)+"%";
  tb.querySelector(".lv i").className=S.table.n>=S.table.cap?"out":S.table.n>S.table.cap*0.75?"low":""; set("#mTable",false,S.table.n>=S.table.cap);
  for(const w of WK) if(w.job){ const id={bottle:"#mBottle",gel:"#mGel",tab:"#mTab",film:"#mFilm",cap:"#mCap",reject:"#mReject",table:"#mTable"}[w.job.key]; if(id) $(id).classList.add("busy"); }
  $$("#cardMat .tile").forEach(e=>{ if(!WK.some(w=>w.job&&{bottle:"mBottle",gel:"mGel",tab:"mTab",film:"mFilm",cap:"mCap",reject:"mReject",table:"mTable"}[w.job.key]===e.id)) e.classList.remove("busy"); });
  /* 조작반 */
  $("#swStart").classList.toggle("on",S.running); $("#swStop").classList.toggle("on",S.started&&!S.running);
  $("#swEmg").classList.toggle("on",S.emg);
  /* 라인 모니터 */
  const rc=S.rc;
  $("#monRun").textContent=S.running?"운전 중":S.alarms.some(a=>ALARMS[a.key].kind==="trip")?"알람 정지":S.started?"정지":"대기";
  $("#monGood").textContent=S.cnt.good; $("#monBad").textContent=S.cnt.reject;
  $("#monBpm").innerHTML=(S.running?S.bpm:0)+" <small>병/분</small>";
  $("#monTarget").textContent=S.mode==="demo"?S.cnt.good+" / 연속":S.cnt.good+" / "+S.cnt.target;
  $("#sCount").textContent=rc.count.k+" ("+rc.n+" 정)";
  $("#sTol").textContent="±"+rc.tol+"정 ("+fmt(rc.netTol,3)+"g)";
  $("#sNet").textContent=S.wc.nNet?fmt(S.wc.sumNet/S.wc.nNet,3)+" g":"- g";
  $("#sTpm").textContent=(S.running?Math.round(dmcRate()*720):0).toLocaleString()+" 정/분";
  $("#sTare").textContent=S.wc.lastTare!=null?fmt(S.wc.lastTare,2)+" g":"- g";
  const blk=startBlockers();
  const il=$("#sIlk"); il.textContent=S.running?"운전":blk.length?"미충족 "+blk.length:"기동 가능"; il.className="v"+(S.running?"":blk.length?" w":"");
  /* 공정 순서 */
  renderFlow();
}
const FLOW=[["ua","UA-120","언스크램블 · 에어세척"],["sg","SG-120","실리카겔 투입"],["lc1","전단 계량","빈병 중량"],["dmc","DMC-60T","정제 계수 · 충전"],["lc2","후단 계량","순중량 판정 · 리젝트"],["pe","HPE-100","PE 필름 투입"],["rc","RCS-120","캡핑"],["tb","집적 테이블","완제품"]];
function renderFlow(){
  const act=k=>{ if(!S.running) return false;
    if(k==="lc1"||k==="lc2"||k==="sg"||k==="pe") return LN.st[k]&&LN.st[k].ph!=="wait";
    if(k==="dmc") return LN.dmc&&(LN.dmc.dump.some(x=>x)||LN.dmc.falls.length>0);
    if(k==="rc") return LN.rc.captured.size>0; if(k==="tb") return S.table.n>0; return true; };
  const bad=k=>{ const mk=k==="lc1"||k==="lc2"?"wc":k==="tb"?"rc":k; return alarmOf(mk).length>0; };
  const html=FLOW.map(([k,a,b],i)=>'<div class="fcard'+(act(k)?" act":"")+(bad(k)?" bad":"")+'" data-fl="'+k+'"><b>'+(i+1)+'. '+a+'</b><s>'+b+'</s></div>'+(i<FLOW.length-1?'<div class="farrow">▶</div>':'')).join("");
  const f=$("#flow"); if(f.dataset.h!==html){ f.innerHTML=html; f.dataset.h=html;
    $$("#flow [data-fl]").forEach(e=>e.onclick=()=>{ const k=e.dataset.fl, v={lc1:"wc",lc2:"wc",tb:"table"}[k]||k; camSet(v); const m=machOf({lc1:"wc",lc2:"wc",tb:"rc"}[k]||k); if(m) toast(m.md+" · "+m.nm); }); }
}

/* ── 조작반 ── */
function bindPanel(){
  $("#swStart").onclick=()=>{ if(!gate("#swStart")) return; if(S.running) return; if(lineStart()){ toast("자동 운전 START","good"); } after(); };
  $("#swStop").onclick=()=>{ if(!gate("#swStop")) return; lineStop(); if(S.cnt.good>=S.cnt.target) S.flags.stopped=true; toast("STOP — 사이클 정지"); after(); };
  $("#swReset").onclick=()=>{ if(!gate("#swReset")) return; lineReset(); if(S.recovery&&!tripAlarms().length) S.recovery.reset=true;
    toast(tripAlarms().length?"해제되지 않은 알람이 남아 있습니다 — 원인을 먼저 조치하세요.":"알람 해제",tripAlarms().length?"bad":"good"); after(); };
  $("#swEmg").onclick=()=>{ if(!gate("#swEmg")) return; S.emg=!S.emg;
    if(S.emg){ S.running=false; raise("E000"); deduct("emg"); toast("비상정지!","bad"); } else { clearAlarm("E000"); toast("비상정지 해제 — RESET 후 START"); } after(); };
  $("#swJog").onclick=()=>{ if(!gate("#swJog")) return;
    if(S.running){ toast("운전 중입니다."); return; }
    const b=startBlockers().filter(x=>!/자재|병이|정제가|필름|캡이|롤이/.test(x));
    if(b.length){ toast("시험 운전 조건 미충족\n"+b[0],"bad"); return; }
    S.running=true; S.jog=2; toast("단동 시험 운전 (2초)"); };
  $("#lcCheck").onclick=()=>{
    const st=curStep(); if(!st||st.lc===undefined||S.clear.includes(st.lc)) return;
    const c=CLEAR[st.lc];
    if(!startWork("look",()=>{ S.clear.push(st.lc); toast("라인 클리어런스 확인 : "+c.t,"good"); after(); },{stand:c.at,reach:c.look,dur:c.door?2.2:1.6,door:c.door||null})) toast("작업자가 이동 중입니다.");
  };
  $("#incAsk").onclick=()=>openIncidentAsk();
  $("#fixBtn").onclick=()=>{ const h=recoveryStep(); if(!h||h.k!=="fix"||!h.f.fix) return; if(!h.f.act()) toast("작업자가 다른 작업 중입니다."); };
  $("#examHint").onclick=()=>{ if(hintOn) return; hintOn=true; S.hintUsed++; deduct("hint"); renderCoach(); };
  $("#stepPrev").onclick=()=>toast("현재 단계를 수행하면 다음 단계로 넘어갑니다.");
  $("#stepNext").onclick=()=>toast("현재 단계를 수행하면 다음 단계로 넘어갑니다.");
  $("#stepCur").onclick=()=>{ renderCoach(); applyHint(); };
  $("#icLock").onclick=()=>{ if(!S.main){ toast("메인 전원을 먼저 투입하세요.","bad"); return; }
    if(S.user){ if(S.running){ toast("운전 중에는 로그아웃할 수 없습니다.","bad"); return; } S.user=null; S.lvl=0; lgOpen=false; toast("로그아웃"); }
    else { lgOpen=true; }
    drawHMI(); stepCheck(); };
  $("#icInfo").onclick=()=>{ hScr="info"; drawHMI(); };
  $("#caseBtn").onclick=()=>openList("case");
  $("#faultBtn").onclick=()=>openList("alarm");
}

/* ── 코치 ── */
function renderCoach(){
  const c=$("#coach"); if(!S||!S.session){ return; }
  const A=STEPS(), st=curStep(), ex=isExam();
  const rec=S.activeTrouble?recoveryStep():null;
  c.className=rec?"alarm":S.session.ended?"done":ex?"exam":isEasy()?"easy":"";
  if(rec){
    $("#cStep").textContent="🚨 "+(CASES[S.activeTrouble.k]?"이상사례":"알람 대응")+" · "+rec.title;
    $("#cTitle").textContent=S.activeTrouble.inc.nm;
    $("#cDesc").textContent=ex&&!hintOn?"원인을 판단하고 조치하세요.":rec.t;
  }else if(st){
    $("#cStep").textContent=MODE_NM[S.mode]+" · STEP "+(S.tIdx+1)+" / "+A.length+(st.watch?" · 생산 "+S.cnt.good+" / "+S.cnt.target:"");
    $("#cTitle").textContent=st.t;
    $("#cDesc").textContent=ex&&!hintOn?(st.watch?"라인을 감시하고 이상에 대응하세요.":"평가 진행 중 — 절차에 따라 수행하세요."):st.d;
  }else{ $("#cStep").textContent="완료"; $("#cTitle").textContent="모든 단계를 마쳤습니다"; $("#cDesc").textContent="상단 [학습 종료] 로 결과를 확인하세요."; }
  $("#lcCheck").style.display=(!rec&&st&&st.lc!==undefined)?"":"none";
  $("#incAsk").style.display=(rec&&rec.k==="ask")?"":"none";
  $("#examHint").style.display=ex?"":"none"; $("#examHint").disabled=hintOn;
  $("#examHint").textContent=hintOn?"💡 힌트 표시 중":"💡 힌트 보기 · −5점";
  $("#stepCur").textContent=Math.min(S.tIdx+1,A.length)+" / "+A.length;
  $("#endBtn").textContent=isDemo()?"시연 종료":ex?"평가 종료":"학습 종료";
  $("#stepNav").style.display=isDemo()?"none":""; demoTourBtn();
  if(isDemo()&&!rec){ $("#cStep").textContent="시연 모드 · 라인 자동 가동"; $("#cTitle").textContent="생산 "+S.cnt.good+" 병 · 리젝트 "+S.cnt.reject+" 병";
    $("#cDesc").textContent="UA-120 → SG-120 → 레인 A·B 분기 → 전단 계량 → DMC-60T → 후단 계량 · 리젝트 → 합류 → HPE-100 → RCS-120 → 집적 테이블. 자재 보충 · 완제품 회수는 작업자가 자동으로 합니다."; }
  applyHint();
}
/* 현재 눌러야 할 곳 (힌트 · 자동재생 공용) */
function hintTarget(){
  if(!S||!S.session||!S.session.active) return null;
  const m=$("#mNum"); if(m&&m.classList.contains("on")) return "#numOk";
  if($("#mInc").classList.contains("on")){ const R=S.recovery; if(R){ const i=R.choices.findIndex(c=>c.ok); return '#incBox .choice[data-i="'+i+'"]'; } }
  if(S.activeTrouble){ const h=recoveryStep(); return h?h.sel:null; }
  const st=curStep(); if(!st) return null;
  try{ return st.plan(); }catch(e){ return null; }
}
let hintEl=null;
function applyHint(){
  const g=$("#guideArrow");
  const show=S&&S.session&&S.session.active&&(!isExam()||hintOn);
  const sel=show?(typeof autoPin==="function"&&autoPin()||hintTarget()):null;
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
  const bg=g.createLinearGradient(0,0,0,H); bg.addColorStop(0,"#ffffff"); bg.addColorStop(.5,"#f4f6f5"); bg.addColorStop(1,"#e4e8e6");
  g.fillStyle=bg; g.fillRect(0,0,W,H);
  const WZ=-2700, TY=3900, RX=11000, FZ=5200;
  const poly=(pts,fill)=>{ const P=pts.map(q=>prj(q[0],q[1],q[2])); if(P.some(q=>!q)) return null;
    g.beginPath(); g.moveTo(P[0].x,P[0].y); for(let i=1;i<P.length;i++) g.lineTo(P[i].x,P[i].y); g.closePath(); if(fill){ g.fillStyle=fill; g.fill(); } return P; };
  { const P=poly([[-RX,0,WZ],[RX,0,WZ],[RX,TY,WZ],[-RX,TY,WZ]],null);
    if(P){ const y0=Math.min(P[2].y,P[3].y), y1=Math.max(P[0].y,P[1].y), wg=g.createLinearGradient(0,y0,0,y1);
      wg.addColorStop(0,"#ffffff"); wg.addColorStop(.6,"#f7f8f6"); wg.addColorStop(1,"#e8eae7"); g.fillStyle=wg; g.fill();
      g.strokeStyle="rgba(140,146,150,.18)"; g.lineWidth=1;
      for(let x=-RX+1200;x<RX;x+=1200){ const a=prj(x,0,WZ), b=prj(x,TY,WZ); if(a&&b){ g.beginPath(); g.moveTo(a.x,a.y); g.lineTo(b.x,b.y); g.stroke(); } }
      const a=prj(-RX,2400,WZ), b=prj(RX,2400,WZ); if(a&&b){ g.beginPath(); g.moveTo(a.x,a.y); g.lineTo(b.x,b.y); g.stroke(); } } }
  poly([[-RX,0,WZ],[RX,0,WZ],[RX,150,WZ+150],[-RX,150,WZ+150]],"#d4dadf");
  { const P=poly([[-RX,0,WZ],[RX,0,WZ],[RX,0,FZ],[-RX,0,FZ]],null);
    if(P){ const y0=Math.min(P[0].y,P[1].y), y1=Math.max(P[2].y,P[3].y), fg=g.createLinearGradient(0,y0,0,y1);
      fg.addColorStop(0,"#dfe5e3"); fg.addColorStop(.35,"#e8ecea"); fg.addColorStop(1,"#f2f4f2"); g.fillStyle=fg; g.fill(); } }
  /* 작업 통로 표시선 (노란 안전선) */
  for(const z of [700,1850]) poly([[-RX,1,z-25],[RX,1,z-25],[RX,1,z+25],[-RX,1,z+25]],"rgba(228,184,40,.55)");
  poly([[-RX,TY,WZ],[RX,TY,WZ],[RX,TY,FZ],[-RX,TY,FZ]],"#eceeef");
  for(const z of [-1200,1400]){ poly([[-7500,TY-5,z-320],[9500,TY-5,z-320],[9500,TY-5,z+320],[-7500,TY-5,z+320]],"#d8e2ec");
    poly([[-7300,TY-10,z-260],[9300,TY-10,z-260],[9300,TY-10,z+260],[-7300,TY-10,z+260]],"#ffffff"); }
}
let HOT=[];
function drawOverlay(){
  const g=R3.ctx, W=R3.W, H=R3.H, K=W/Math.max(1,$("#view3d").clientWidth);
  HOT.length=0;
  g.textAlign="center"; g.textBaseline="middle";
  if(VIEW3.label){
    const LBL=[[-4200,2100,-200,"① UA-120 언스크램블러·에어세척기"],[L.sg,2150,-300,"② SG-120 실리카겔"],[L.lc1,1500,0,"전단 계량"],
      [416,2050,-700,"③ DMC-60T 정제 계수기"],[L.lc2,1500,0,"후단 계량 · 리젝트"],[L.pe,2050,-300,"④ HPE-100 PE 필름"],[L.T.x,2560,-379,"⑤ RCS-120 로타리 캡핑기"],[L.table.x,1450,-10,"집적 테이블"],[L.lc2+420,2080,-150,"중량선별 PLC"]];
    g.font="800 "+(12*K).toFixed(0)+"px "+'"Malgun Gothic",sans-serif';
    for(const [x,y,z,t] of LBL){ if(cam.dist>7000&&/로드셀|PLC/.test(t)) continue; const p=prj(x,y,z); if(!p||p.x<0||p.x>W||p.y<0||p.y>H) continue;
      const w=g.measureText(t).width+16*K, h=21*K;
      g.fillStyle="rgba(22,32,44,.80)"; rr(g,p.x-w/2,p.y-h,w,h,7*K); g.fill(); g.fillStyle="#fff"; g.fillText(t,p.x,p.y-h/2); }
    if(S&&S.session&&!isExam()) for(const d of DEVICES){
      const q=DEVPOS[d.n]; if(!q) continue; const p=prj(q[0],q[1],q[2]); if(!p||p.x<0||p.x>W||p.y<0||p.y>H) continue;
      if(cam.dist>9000&&[4,6,7,11,12,13,18,20].includes(d.n)) continue;
      const r=8.5*K; g.lineCap="round";
      g.beginPath(); g.moveTo(p.x-r,p.y); g.lineTo(p.x+r,p.y); g.moveTo(p.x,p.y-r); g.lineTo(p.x,p.y+r);
      g.lineWidth=6*K; g.strokeStyle="rgba(20,32,48,.22)"; g.stroke();
      g.lineWidth=3.2*K; g.strokeStyle=HOVER===d.n?"rgba(126,190,255,.98)":"rgba(255,255,255,.78)"; g.stroke();
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
  /* 현장 조치 마커 */
  const fb=$("#fixBtn"), h2=S&&S.activeTrouble?recoveryStep():null;
  if(h2&&h2.k==="fix"&&h2.f.fix){ const p=prj(...h2.f.fix); if(p&&p.x>0&&p.x<W&&p.y>0&&p.y<H){ fb.hidden=false; fb.style.left=(p.x/K)+"px"; fb.style.top=(p.y/K)+"px"; } else fb.hidden=true; }
  else fb.hidden=true;
  /* 중량 배지 */
  const wb=$("#weighBadge");
  if(S&&S.session&&S.main&&S.started){
    const st1=LN.st.lc1, st2=LN.st.lc2, w=S.wc;
    const t=st1&&st1.ph==="proc"&&st1.read!=null?st1.read:w.lastTare, gr=st2&&st2.ph==="proc"&&st2.read!=null?st2.read:w.gross;
    const ng=w.judge==="NG";
    const html='<b>⚖ 중량선별 PLC</b><div class="row"><span>전단 (빈병)</span><span>'+(t!=null?fmt(t,2)+" g":"-")+'</span></div>'+
      '<div class="row"><span>후단 (총중량)</span><span>'+(gr!=null?fmt(gr,2)+" g":"-")+'</span></div>'+
      '<div class="row"><span>순중량</span><span class="'+(ng?"ng":"")+'">'+(w.net!=null?fmt(w.net,3)+" g":"-")+'</span></div>'+
      '<div class="row"><span>기준</span><span>'+fmt(S.rc.netStd,3)+' g</span></div>'+
      '<div class="row full"><span>판정</span><span class="'+(ng?"ng":"")+'">'+(w.judge?w.judge+(ng&&w.log[0]?" · "+w.log[0].why:""):"-")+'</span></div>';
    if(wb.dataset.h!==html){ wb.innerHTML=html; wb.dataset.h=html; }
    wb.hidden=false;
  }else wb.hidden=true;
}
function rr(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
let HOVER=null;
function onCvHover(q){ let h=null; for(const s of HOT) if(Math.hypot(q.x-s.x,q.y-s.y)<=s.r){ h=s.n; break; } HOVER=h; R3.cv.style.cursor=h?"pointer":"grab"; }
function onCvClick(q){ for(const s of HOT) if(Math.hypot(q.x-s.x,q.y-s.y)<=s.r){ openDev(s.n); return; } }
function openDev(n){
  const d=devOf(n); if(!d) return; const m=machOf(d.k);
  $("#devBox").innerHTML='<h2>'+d.n+'. '+esc(d.nm)+'</h2><p style="margin-top:-4px">'+esc(d.en)+' · '+esc(m?m.md+" "+m.nm:"")+'</p><div class="devImg">'+esc(d.d)+'</div>'+
    '<p style="font-size:12.5px">※ 공개 제품 소개 기준 요약 · 세부 구조는 설비 매뉴얼로 확인하세요.</p><div class="mbtn"><button class="pri" id="devX">닫기</button></div>';
  $("#mDev").classList.add("on"); $("#devX").onclick=()=>$("#mDev").classList.remove("on");
  const v={1:"ua",2:"ua",3:"ua",4:"ua",5:"sg",6:"sg",7:"sg",8:"wc",14:"wc",15:"wc",16:"wc",17:"pe",18:"pe",22:"table"}[n]||d.k;
  if(CAMVIEW[v]) camSet(v);
}

/* ── 배너 ── */
function showBanner(t){ const b=$("#banner"); b.textContent=t; b.hidden=false; clearTimeout(showBanner.t); showBanner.t=setTimeout(()=>{ b.hidden=true; },5200); }
function hideBanner(){ $("#banner").hidden=true; }

/* ── 이상사례 · 알람 목록 (직접 발생) ── */
function openList(kind){
  const box=$("#listBox"), list=kind==="case"?CASES:INC;
  const running=S&&S.running;
  box.innerHTML='<h2>'+(kind==="case"?"🧪 이상사례":"🚨 알람")+' 발생</h2><p>운전 중에 목록의 상황을 직접 발생시켜 대응을 연습합니다. '+(kind==="case"?"이상사례는 알람 없이 품질 이상으로 먼저 나타납니다.":"알람은 발생 즉시 해당 설비가 정지하거나 경고합니다.")+'</p>'+
    Object.entries(list).map(([k,v])=>'<div class="row"><b>'+(kind==="alarm"?k+" · ":"")+esc(v.nm)+'<s>'+esc(machOf(v.mk)?machOf(v.mk).md:"라인 공통")+'</s></b><button data-k="'+k+'"'+(running&&!S.activeTrouble?"":" disabled")+'>지금 발생</button></div>').join("")+
    '<div class="mbtn"><button id="listX">닫기</button></div>';
  $("#mList").classList.add("on");
  $("#listX").onclick=()=>$("#mList").classList.remove("on");
  $$("#listBox [data-k]").forEach(b=>b.onclick=()=>{ $("#mList").classList.remove("on"); launchIncident(b.dataset.k); renderCoach(); });
}

/* ── 시작 화면 · 품목 선택 ── */
function initSplash(){
  $("#lineStrip").innerHTML=[["UA-120","언스크램블러 · 에어세척"],["SG-120","실리카겔 투입"],["중량선별 (전단)","빈병 중량"],["DMC-60T","정제 계수 · 충전"],["중량선별 (후단)","순중량 판정 · 리젝트"],["HPE-100","PE 필름 투입"],["RCS-120","로타리 캡핑"]]
    .map((x,i)=>'<div class="ls'+(x[0].startsWith("중량선별")?" wc":"")+'"><b>'+x[0]+'</b><s>'+x[1]+'</s></div>'+(i<6?'<div class="ar">›</div>':'')).join("");
  $("#chooseDemo").onclick=()=>{ $("#splash").classList.add("hide"); hintOn=false; startSession("demo"); toast("시연 모드 시작 · "+S.rc.label+" · 라인 자동 가동"); };
  $("#chooseOperation").onclick=()=>{ $("#coursePicker").style.display="none"; $("#splash .go").style.display="grid"; $("#courseBack").style.display=""; };
  $("#courseBack").onclick=()=>{ $("#coursePicker").style.display=""; $("#splash .go").style.display="none"; $("#courseBack").style.display="none"; };
  for(const [id,mode] of [["#spEasy","easy"],["#spExamEasy","examEasy"],["#spGuide","guide"],["#spExam","exam"]]) $(id).onclick=()=>openSel(mode);
}
let PENDING_MODE="easy";
function openSel(mode){ PENDING_MODE=mode; renderSel(); $("#mSel").classList.add("on"); }
function renderSel(){
  const p=PRODUCTS.find(x=>x.k===SEL.prod);
  if(!countAllowed(p,COUNTS.find(c=>c.k===SEL.count))) SEL.count=COUNTS.find(c=>countAllowed(p,c)&&recommendBottle(p,c.n)).k;
  const c=COUNTS.find(x=>x.k===SEL.count), rec=recommendBottle(p,c.n);
  if(!bottleFits(p,c.n,BOTTLES.find(b=>b.ml===SEL.ml))) SEL.ml=rec.ml;
  $("#selProd").innerHTML=PRODUCTS.map(q=>'<button data-p="'+q.k+'" class="'+(q.k===SEL.prod?"on":"")+'"><b>'+q.nm+'</b><small>'+q.type+' · '+q.unit+' mg · '+esc(q.note)+'</small></button>').join("");
  $("#selCount").innerHTML=COUNTS.map(q=>{ const ok=countAllowed(p,q)&&!!recommendBottle(p,q.n); return '<button data-c="'+q.k+'" class="'+(q.k===SEL.count?"on":"")+'"'+(ok?"":" disabled")+'><b>'+q.k+'</b><small>허용 ±'+tolTabs(q.n)+' 정</small></button>'; }).join("");
  $("#selBottle").innerHTML=BOTTLES.map(b=>{ const ok=bottleFits(p,c.n,b); return '<button data-b="'+b.ml+'" class="'+(b.ml===SEL.ml?"on":"")+'"'+(ok?"":" disabled")+'><b>'+b.ml+' ml</b><small>Ø'+b.d+' × '+b.h+' · 캡 '+b.capD+'</small></button>'; }).join("");
  const r=recipeOf(SEL.prod,SEL.count,SEL.ml);
  $("#selSum").innerHTML='<div><b>'+r.n+' '+(p.type==="캡슐"?"캡슐":"정")+'</b>계수 설정</div><div><b>'+fmt(r.netStd,3)+' g</b>기준 순중량</div><div><b>± '+fmt(r.netTol,3)+' g</b>허용오차 (±'+r.tol+' 정)</div><div><b>'+fmt(r.tareStd,1)+' g</b>빈병 기준 (병+실리카겔 '+r.bottle.gel+' g)</div>';
  $("#selWarn").textContent="권장 병 : "+rec.ml+" ml (겉보기 부피 "+fmt(p.vol*c.n,0)+" cc ≤ 공칭 용량 80 %) · 허용오차 규칙 : 30T 이하 ±0.5정 · 300T 이하 ±1정 · 500T 이하 ±2정 · 1000T 이상 ±5정";
  $$("#selProd [data-p]").forEach(b=>b.onclick=()=>{ SEL.prod=b.dataset.p; renderSel(); });
  $$("#selCount [data-c]").forEach(b=>b.onclick=()=>{ if(b.disabled) return; SEL.count=b.dataset.c; SEL.ml=recommendBottle(PRODUCTS.find(x=>x.k===SEL.prod),COUNTS.find(x=>x.k===SEL.count).n).ml; renderSel(); });
  $$("#selBottle [data-b]").forEach(b=>b.onclick=()=>{ if(b.disabled) return; SEL.ml=+b.dataset.b; renderSel(); });
  $("#selOk").onclick=()=>{ $("#mSel").classList.remove("on"); $("#splash").classList.add("hide"); hintOn=false; startSession(PENDING_MODE); toast(MODE_NM[PENDING_MODE]+" 시작 · "+S.rc.label); };
}
function goHome(){ if(typeof apStop==="function") apStop(); if(S) S.running=false; $("#splash").classList.remove("hide"); $("#coursePicker").style.display=""; $("#splash .go").style.display="none"; $("#courseBack").style.display="none"; }

/* ── 결과 · 채점 관리 ── */
function showResult(manual){
  const ex=isExam(), sc=scoreNow(), A=STEPS();
  const pass=sc.score>=PASS;
  const rows=A.map((st,i)=>{ const l=S.stepLog.find(x=>x.i===i); return '<tr><td>'+(i+1)+'</td><td class="l">'+esc(st.t)+'</td><td>'+(st.pts||0)+'</td><td>'+(l?"완료 · "+mmss(l.at):"미완료")+'</td></tr>'; }).join("");
  const ded=S.deducts.map(d=>'<tr><td class="l">'+esc(d.why)+'</td><td>−'+d.pts+'</td><td>'+mmss(d.at)+'</td></tr>').join("")||'<tr><td colspan="3">감점 없음</td></tr>';
  const avg=S.wc.nNet?fmt(S.wc.sumNet/S.wc.nNet,3)+" g":"-";
  $("#endBox").innerHTML='<h2>'+(ex?"📝 평가 결과":"📘 학습 결과")+' — '+esc(MODE_NM[S.mode])+'</h2>'+
    '<p>'+esc(S.rc.label)+' · 소요 '+mmss(S.session.sec)+' · 진행 '+Math.min(S.tIdx,A.length)+' / '+A.length+' 단계'+(manual?" (중도 종료)":"")+'</p>'+
    (ex?'<div class="finalScore">'+sc.score+'<small>점 · '+(pass?"합격":"불합격")+' (기준 '+PASS+'점)</small></div><p>단계 점수 '+sc.base+'점 − 감점 '+sc.minus+'점</p>':'')+
    '<div class="kpis" style="grid-template-columns:repeat(4,1fr);margin:10px 0">'+kc(S.cnt.good+" 병","양품 (캡핑 완료)","hi")+kc(S.cnt.reject+" 병","리젝트","ng")+kc(avg,"순중량 평균")+kc(S.cnt.tabs.toLocaleString()+" 정","계수 정제")+'</div>'+
    '<h3>단계별 수행</h3><table class="ht"><tr><th>No</th><th>단계</th><th>배점</th><th>결과</th></tr>'+rows+'</table>'+
    '<h3>감점 내역</h3><table class="ht"><tr><th>항목</th><th>감점</th><th>시각</th></tr>'+ded+'</table>'+
    '<div class="mbtn"><button class="pri" id="endAgain">다시 하기</button><button id="endHome">메인화면</button><button id="endClose">닫기</button></div>';
  $("#mEnd").classList.add("on");
  $("#endAgain").onclick=()=>{ $("#mEnd").classList.remove("on"); startSession(S.mode); };
  $("#endHome").onclick=()=>{ $("#mEnd").classList.remove("on"); goHome(); };
  $("#endClose").onclick=()=>$("#mEnd").classList.remove("on");
}
function openRubric(){
  const A=STEPS(), tot=A.reduce((s,x)=>s+(x.pts||0),0);
  $("#rubBox").innerHTML='<h2>채점 기준</h2><p>단계 배점 합계를 100점으로 환산한 뒤 감점을 뺍니다. 합격 기준 '+PASS+'점. 학습 · 평가는 같은 절차이며 평가에서는 안내가 표시되지 않습니다.</p>'+
    '<table class="ht"><tr><th>단계</th><th>배점</th><th>환산</th></tr>'+A.map(st=>'<tr><td class="l">'+esc(st.t)+'</td><td>'+(st.pts||0)+'</td><td>'+fmt((st.pts||0)/tot*100,1)+'</td></tr>').join("")+'</table>'+
    '<h3>감점</h3><table class="ht">'+Object.values(PENALTY).map(p=>'<tr><td class="l">'+esc(p[0])+'</td><td>−'+p[1]+'</td></tr>').join("")+'</table>'+
    '<div class="mbtn"><button class="pri" id="rubX">닫기</button></div>';
  $("#mRub").classList.add("on"); $("#rubX").onclick=()=>$("#mRub").classList.remove("on");
}
function bindHeader(){
  $$("#spdGrp [data-s]").forEach(b=>b.onclick=()=>{ SPD=+b.dataset.s; $$("#spdGrp [data-s]").forEach(x=>x.classList.toggle("on",x===b)); });
  const bp=d=>{ if(!S) return; S.bpm=clamp(S.bpm+d,2,120); syncBpm(); drawHMI(); };
  $("#bpmDn").onclick=()=>bp(S.bpm>20?-10:-1); $("#bpmUp").onclick=()=>bp(S.bpm>=20?10:1);
  $("#soundBtn").onclick=()=>{ SND.on=!SND.on; $("#soundBtn").textContent=SND.on?"사운드 ON":"사운드 OFF"; };
  $("#homeBtn").onclick=goHome;
  $("#rubricBtn").onclick=()=>{ if(S&&S.session&&!isDemo()) openRubric(); };
  $("#endBtn").onclick=()=>{ if(S&&S.session&&isDemo()){ goHome(); return; } if(S&&S.session&&!S.session.ended) finishSession(true); };
  $("#resetBtn").onclick=()=>{ if(S&&S.mode){ hintOn=false; startSession(S.mode); toast("처음부터 다시 시작"); } };
  $$("#v3Grp [data-v]").forEach(b=>b.onclick=()=>camSet(b.dataset.v));
  $("#tgGuard").onclick=()=>{ VIEW3.guard=!VIEW3.guard; $("#tgGuard").classList.toggle("on",VIEW3.guard); buildStatic(); };
  $("#tgShadow").onclick=()=>{ R3.shadowOn=!R3.shadowOn; $("#tgShadow").classList.toggle("on",R3.shadowOn); };
  $("#tgLabel").onclick=()=>{ VIEW3.label=!VIEW3.label; $("#tgLabel").classList.toggle("on",VIEW3.label); };
  const pan=d=>{ cam.txT=clamp(cam.txT+d*Math.max(700,cam.dist*0.25),-6500,9000); };
  $("#panL").onclick=()=>pan(-1); $("#panR").onclick=()=>pan(1); $("#panC").onclick=()=>camSet(cam.view in CAMVIEW?cam.view:"all");
}
function syncBpm(){ $("#bpmV").textContent=S?S.bpm:60; }
