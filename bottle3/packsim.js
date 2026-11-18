/* ═══════════════════════════════════════════════════════════════════
   포장실 시뮬레이션 · 설비 화면 (B3 · 11/18) — 현장 사진 · 사용자 설명 기준
   · 작업자 조작 (사용자 확인) : 비전 PC · 라벨 인쇄기 · 라벨러 · 설명서 부착기 = ON/OFF 만, 중량선별기 = 중량 세팅 + RUN/STOP,
     집합 포장(AG) PC = 작업 시작 · 판독 · 클리어 · 재발급 · 포장완료 · 작업완료 (버튼 쓰임새는 화면 사진에서 추정)
   · 흐름 : 충전실 양품 + 턴테이블 임시 보관분 → 라벨 인쇄 · 부착 → 비전(2D 코드 · 글자) NG = 후단 리젝터 → 설명서 부착 → 중량선별(설명서 누락 −NG · 과량 +NG)
            → 집적 → 작업자 1 판독(판독 불가 · 중복 = 리젝트 → 라벨만 떼고 턴테이블로 재투입) → 40병마다 박스 AG 라벨 발행 → 작업자 2 박스 봉함 · 라벨 · 파렛트
   · 일반의약품 : 판독 없이 작업자 1명이 바로 박스 포장 (AG 라벨 없음)
   · 화면 값(제품 · 코드 · 제조번호)은 가상 값
   ═══════════════════════════════════════════════════════════════════ */
const PS={
  rx:true,                              /* 전문의약품(판독 · AG) — false = 일반의약품 */
  boxN:40, boxTotal:150, perLayer:8, layers:5,
  job:{nm:"시험정 30T", gtin:"08800000000017", lot:"B1001", exp:"2029.12.31", expG:"291231"},
  tt:{on:false, buf:120},                /* 턴테이블 · 임시 보관 병 */
  pr:{on:false, ribbon:100, total:500000, batch:0, spd:0},
  vis:{on:false, total:0, good:0, ng:0, last:"OK", log:[]},
  lab:{run:false, roll:100, cnt:0, rej:0, temp:23.4},
  leaf:{on:false, roll:100, cnt:0},
  cw:{run:false, set:false, std:22.20, lo:21.80, hi:22.60, pass:0, nNG:0, pNG:0, last:0, edit:null},
  ag:{on:false, n:0, list:[], boxes:0, issued:[], msg:"", paper:300, pending:false},
  box:{open:true, n:0, closing:0, done:0, flat:14},
  pallet:0, auto:{w1:true, w2:true}, t1:0, t2:0, serial:1, boxSer:1, rew:0
};
const PS_RATE={visNG:.004, leafMiss:.003, unread:.003, dup:.0015, cwSig:.05, leafG:.62};
const psOn=()=>PS.tt.on&&PS.pr.on&&PS.lab.run&&PS.leaf.on&&PS.cw.run;
/* ── 조작 (B5 에서 1인칭 조작 대상 · 판넬 버튼과 연결) ── */
const PS_ACT={
  tt:()=>{ PS.tt.on=!PS.tt.on; },
  pr:()=>{ PS.pr.on=!PS.pr.on; },
  vis:()=>{ PS.vis.on=!PS.vis.on; },
  lab:()=>{ PS.lab.run=!PS.lab.run; },
  leaf:()=>{ PS.leaf.on=!PS.leaf.on; },
  cwSet:(std,lo,hi)=>{ Object.assign(PS.cw,{std,lo,hi,set:true}); },
  cw:()=>{ if(!PS.cw.set&&!PS.cw.run){ psMsg("중량선별기 — 중량 세팅을 먼저 하세요."); return false; } PS.cw.run=!PS.cw.run; return true; },
  agStart:()=>{ PS.ag.on=true; PS.ag.msg="작업 진행"; },
  agClear:()=>{ PS.ag.list=[]; PS.ag.n=0; PS.ag.msg="클리어 — 이 박스 판독을 처음부터"; },
  agReissue:()=>{ if(!PS.ag.issued.length) return; if(PS.ag.paper<=0){ psMsg("AG 라벨지 없음 — 교체 후 재발급"); return; } PS.ag.paper--; PS.ag.msg="재발급 — "+PS.ag.issued[0].sn; },
  agPack:()=>{ if(PS.ag.n>0) psBoxDone(true); },
  agEnd:()=>{ PS.ag.on=false; PS.ag.msg="작업 완료"; },
  allOn:()=>{ Object.assign(PS.tt,{on:true}); PS.pr.on=PS.vis.on=PS.lab.run=PS.leaf.on=true; if(!PS.cw.set) PS_ACT.cwSet(22.20,21.80,22.60); PS.cw.run=true; if(PS.rx) PS_ACT.agStart(); },
  allOff:()=>{ PS.tt.on=PS.pr.on=PS.vis.on=PS.lab.run=PS.leaf.on=PS.cw.run=false; }
};
function psMsg(t){ PS.ag.msg=t; PS.toast=t; PS.toastT=performance.now(); }
/* 병 일련번호 · 2D 코드 문자열 (가상 값) */
const psSN=n=>PS.job.lot+String(n).padStart(9,"0");
const psGS1=n=>"(01)"+PS.job.gtin+"(17)"+PS.job.expG+"(10)"+PS.job.lot+"(21)"+psSN(n);
/* ── 흐름 ── */
function psFeed(){ const w=appWin(); let good=0;
  try{ const S=w.__IDT.S(); if(S) good=S.cnt.good; }catch(e){}
  if(PKG.last<0) PKG.last=good; if(good<PKG.last) PKG.last=good;
  while(PKG.last<good){ PKG.last++; PS.tt.buf++; } }                 /* 충전실 양품 → 통과구 → 턴테이블 */
function psBottle(){ return {s:pkPassLen(), lab:false, leaf:false, wt:0, ng:null, sn:0, w:0, chk:{}}; }
const pkPassLen=()=>PK.pass[1]-PK.pass[0];
/* 위치 x 에서 멈춰야 하는가 (그 공정 설비가 멈춤 · 자재 없음) */
function psGate(x){ if(x<PK.lab[0]) return PS.lab.run&&PS.pr.on&&PS.lab.roll>0&&PS.pr.ribbon>0?null:PK.lab[0]-30;
  if(x<PK.leaf[0]) return PS.leaf.on&&PS.leaf.roll>0?null:PK.leaf[0]-30;
  if(x<PK.cw.x0) return PS.cw.run?null:PK.cw.x0-30; return null; }
function psTick(dt){
  if(!PKG.B) return; psFeed();
  const w=appWin(); let bpm=30; try{ bpm=w.__IDT.S().bpm||30; }catch(e){}
  PS.pr.spd+=(((PS.lab.run&&PS.pr.on)?Math.min(42,bpm+2):0)-PS.pr.spd)*Math.min(1,dt*.8);
  /* 턴테이블 : 보관 병을 라인으로 (라인 속도) */
  PS.ttT=(PS.ttT||0)+dt; const gap=PK.bottle.r*2+8;
  if(PS.tt.on&&PS.tt.buf>0&&PS.ttT>60/Math.max(10,bpm)){ const s0=pkPassLen(), clear=!PKG.list.some(q=>q.s<s0+gap*1.5); if(clear){ PS.ttT=0; PS.tt.buf--; PKG.list.push(psBottle()); } }
  const v=120+2.8*bpm, end=PK_END(); PKG.list.sort((a,b)=>b.s-a.s); let front=end;
  const out=[];
  for(const q of PKG.list){
    const p0=pkPath(q.s), onLine=q.s>=pkPassLen()+pkArc().L, g=onLine?psGate(p0[0]):null; let lim=front-gap; if(g!=null&&p0[0]<g+1){ const gs=q.s+(g-p0[0]); lim=Math.min(lim,gs); }
    if(p0[0]>=PK.cw.w0&&p0[0]<PK.cw.w1&&q.wt<.3){ q.wt+=dt; front=q.s; continue; }
    const moving=PS.tt.on||p0[0]>PK.line[0]; if(moving) q.s=Math.max(q.s,Math.min(q.s+v*dt,lim)); front=q.s;
    const x=pkPath(q.s)[0], c=q.chk;
    if(!c.lab&&x>=PK.labX.wrap){ c.lab=1; q.lab=true; q.sn=PS.serial++; PS.lab.cnt++; PS.lab.roll=Math.max(0,PS.lab.roll-.02); PS.pr.ribbon=Math.max(0,PS.pr.ribbon-.015); PS.pr.total++; PS.pr.batch++; }
    if(!c.vis&&x>=PK.labX.vis+150){ c.vis=1; if(PS.vis.on){ PS.vis.total++; const ng=Math.random()<PS_RATE.visNG; if(ng){ PS.vis.ng++; q.ng="vis"; PS.vis.last="NG"; } else { PS.vis.good++; PS.vis.last="OK"; }
        PS.vis.log.unshift({t:new Date(),sn:q.sn}); PS.vis.log.length=Math.min(PS.vis.log.length,6); } }
    if(!c.rej&&x>=PK.labX.rej){ c.rej=1; if(q.ng==="vis"){ PS.lab.rej++; PKG.rejLabN=(PKG.rejLabN||0)+1; PKG.push=.4; out.push(q); continue; } }
    if(!c.leaf&&x>=PK.leafX){ c.leaf=1; if(!q.leaf&&Math.random()>PS_RATE.leafMiss){ q.leaf=true; PS.leaf.cnt++; PS.leaf.roll=Math.max(0,PS.leaf.roll-.025); } }
    if(!c.cw&&x>=PK.cw.w1){ c.cw=1; const wt=PS.cw.std-PS_RATE.leafG*.5+(q.leaf?PS_RATE.leafG*.5:-PS_RATE.leafG*.5)+(Math.random()+Math.random()+Math.random()-1.5)*PS_RATE.cwSig*1.4; q.w=wt; PS.cw.last=wt;
      if(wt<PS.cw.lo){ PS.cw.nNG++; q.ng="cwL"; } else if(wt>PS.cw.hi){ PS.cw.pNG++; q.ng="cwH"; } else PS.cw.pass++; }
    if(!c.flip&&x>=PK.cw.flip){ c.flip=1; if(q.ng==="cwL"||q.ng==="cwH"){ PKG.rejCwN=(PKG.rejCwN||0)+1; PKG.flipT=.35; out.push(q); continue; } }
  }
  PKG.list=PKG.list.filter(q=>!out.includes(q));
  if(PKG.disc&&PS.tt.on) PKG.disc.rotation.y-=dt*.9;
  if(PKG.push>0) PKG.push-=dt; if(PKG.flipT>0) PKG.flipT-=dt;
  /* 집적 벨트 끝에 도착한 병 (작업자 1 몫) */
  const queue=PKG.list.filter(q=>q.s>=end-gap*30&&pkPath(q.s)[0]>PK.acc[0]+400);
  psWorkers(dt,queue);
  if(PS.rew>0){ PS.rew-=dt; }
}
/* 작업자 1 (판독) · 작업자 2 (박스) — 플레이어가 아닌 쪽은 자동 (B4 에서 작업자 선택과 연결) */
function psWorkers(dt,queue){
  const end=PK_END(), atEnd=queue.filter(q=>q.s>=end-(PK.bottle.r*2+8)*25).sort((a,b)=>b.s-a.s);
  PS.t1+=dt;
  if(PS.auto.w1&&atEnd.length&&!(PS.box.closing>0)&&PS.t1>1.4){ PS.t1=0; psScan(atEnd[0]); }
  PS.t2+=dt; if(PS.box.closing>0){ PS.box.closing-=dt; if(PS.box.closing<=0) psBoxAway(); }
}
/* 판독 (전문의약품) · 바로 담기 (일반의약품) */
function psScan(q){
  if(!PS.box.open||(!PS.auto.w2&&!PS.box.ready&&PS.box.n===0)) return false;   /* 수동 박스 작업 : 박스 조립 전에는 담을 수 없음 */
  if(PS.rx){
    if(!PS.ag.on){ psMsg("집합 포장 작업이 시작되지 않았습니다."); return false; }
    const bad=Math.random()<PS_RATE.unread?"판독 불가":Math.random()<PS_RATE.dup?"중복 판독":null;
    if(bad){ PKG.list=PKG.list.filter(x=>x!==q); PS.rew=2; PS.reworkN=(PS.reworkN||0)+1; psMsg(bad+" — 리젝트 · 라벨 제거 후 턴테이블로 재투입"); PS.tt.buf++; return false; }   /* 라벨만 떼고 턴테이블로 */
    PS.ag.list.unshift(psGS1(q.sn)); PS.ag.n++;
    PS.scanFlash=.25;
  } else PS.ag.n++;
  PKG.list=PKG.list.filter(x=>x!==q); PS.box.n++;
  if(PS.box.n>=PS.boxN) psBoxDone(false);
  return true;
}
function psBoxDone(manual){
  if(PS.rx){ const sn="(01)1"+PS.job.gtin.slice(1)+"(21)"+PS.job.lot+"S"+String(PS.boxSer).padStart(7,"0"); PS.ag.issued.unshift({no:PS.boxSer,sn}); PS.ag.issued.length=Math.min(PS.ag.issued.length,12); PS.boxSer++; if(PS.ag.paper>0){ PS.ag.paper--; PS.agFeed=1; } else { PS.ag.pending=true; psMsg("AG 라벨지 없음 — 라벨지를 교체하면 대기 중인 박스 라벨이 발행됩니다"); } }
  PS.ag.boxes++; PS.ag.msg=manual?"포장완료 (수량 미달 박스 마감)":"포장 완료 — 박스 라벨 발행"; PS.ag.list=[]; PS.ag.n=0;
  PS.box.open=false; PS.box.closing=PS.auto.w2?12:1e9;          /* 자동 작업자 2 : 봉함 · AG 라벨 · 파렛트 적재 · 새 박스 (약 12 초 · 3D 작업자 동작이 있으면 그 동작이 끝낼 때) */
}
function psBoxAway(){ PS.box.closing=0; PS.box.done++; PS.pallet++; PS.box.n=0; PS.box.open=true; PS.box.flat=Math.max(0,PS.box.flat-1); if(PS.box.flat<3) PS.box.flat=14; PS.agFeed=0; }
/* ── 그리기 : 병 · 박스 안 병 · 파렛트 박스 · 리젝트 함 ── */
function pkTick(dt){
  psTick(dt*((typeof TBQ!=="undefined"&&TBQ.spd)||1)); const B=PKG.B, m=new T3.Matrix4(), z=new T3.Matrix4().makeScale(0,0,0); let n=0; const MAX=240;
  const put=(x,y,zz,lab,leaf,rot)=>{ if(n>=MAX) return; m.makeRotationZ(rot||0).setPosition(x,y,zz); B.body.setMatrixAt(n,m); B.cap.setMatrixAt(n,m); B.lab.setMatrixAt(n,lab?m:z); B.tab.setMatrixAt(n,leaf?m:z); n++; };
  for(const q of PKG.list){ const p=pkPath(q.s); put(pm(p[0]),pm(PK.CH),pm(p[2]),q.lab,q.leaf); }
  /* 턴테이블 보관 병 (최대 60 개 · 원판 위 고리 모양) */
  { const t=PK.tt, k=Math.min(60,PS.tt.buf), a0=PKG.disc?PKG.disc.rotation.y:0; for(let i=0;i<k;i++){ const ring=i<26?0:i<46?1:2, cnt=[26,20,14][ring], rr=[t.r-120,t.r-190,t.r-260][ring], j=i-(ring?ring===1?26:46:0), a=-a0+j/cnt*Math.PI*2+ring*.2;
      put(pm(t.x+Math.cos(a)*rr),pm(PK.CH),pm(t.z+Math.sin(a)*rr),false,false); } }
  /* 리젝트 함 (라벨러 후단 · 중량선별기) — 쌓인 병을 눕혀서 */
  for(let i=0;i<Math.min(10,PKG.rejLabN||0);i++){ const R=PKG.rejLab; put(pm(R.x-100+(i%5)*45),pm(R.y+22),pm(R.z-60+Math.floor(i/5)*60),true,false,Math.PI/2); }
  for(let i=0;i<Math.min(10,PKG.rejCwN||0);i++){ const R=PKG.rejCw; put(pm(R.x-100+(i%5)*45),pm(R.y+22),pm(R.z-60+Math.floor(i/5)*60),true,false,Math.PI/2); }
  /* 박스 안 병 (5 × 8) */
  { const o=PKG.openBox.position; for(let i=0;i<PS.box.n;i++){ const c=i%8, r=Math.floor(i/8); put(o.x-.15+c*.0405+.02,o.y+.004,o.z-.095+r*.0405+.02,true,true); } }
  for(const k of ["body","cap","lab","tab"]){ B[k].count=n; B[k].instanceMatrix.needsUpdate=true; }
  /* 박스 : 봉함 중이면 뚜껑 덮인 모습 · 파렛트 적재 */
  if(!PKG.lid){ PKG.lid=bx(PKG.openBox,-.18,.18,.11,.116,-.125,.125,PKG.kraft); PKG.agLab=plate(PKG.openBox,.1,.06,labelTex(["▌▌▌▌▌ ▌▌▌","박스 라벨"],{w:200,h:120}),[0,.07,.1265],0); }
  PKG.lid.visible=!PS.box.open; PKG.agLab.visible=!PS.box.open&&PS.rx;
  if(PKG.palN!==PS.pallet){ PKG.palN=PS.pallet; const G=PKG.palG; while(G.children.length) G.remove(G.children[0]); const P=PK.pallet, bxW=.36, bxD=.25, bxH=.12;
    for(let i=0;i<Math.min(PS.pallet,PS.perLayer*PS.layers);i++){ const L=Math.floor(i/PS.perLayer), j=i%PS.perLayer, c=j%3, r=Math.floor(j/3);
      const x0=pm(P.x)-.55+c*(bxW+.01), z0=pm(P.z)-.45+r*(bxD+.04); bx(G,x0,x0+bxW,.14+L*bxH,.14+L*bxH+bxH-.004,z0,z0+bxD,PKG.kraft); } }
  if(PKG.rejPusher) PKG.rejPusher.position.z=PKG.push>0?.06:-.0825;
  /* 경광등 (파우치 기준) : 에러 = 적색 깜빡임 · 조치 중(LOTO) = 적색 점등 · 평상시 꺼짐 */
  if(PKG.leafLamp){ const m=PKG.leafLamp.material, t=performance.now()/1000, on=PS.leaf.fault?(PS.leaf.lock?1:(Math.sin(t*9)>0?1:0)):0; m.emissive.setHex(on?0xff2020:0x200000); m.emissiveIntensity=on?1.4:.4; }
  if(PKG.flip) PKG.flip.rotation.y=PKG.flipT>0?-.9:0;
  psScreens(dt);
}
/* ── 설비 화면 (캔버스 질감 · 0.4 초마다) ── */
const SCR={};
function scrCv(key,mesh,W,H){ if(SCR[key]) return SCR[key]; const c=document.createElement("canvas"); c.width=W; c.height=H; const t=new T3.CanvasTexture(c); t.encoding=T3.sRGBEncoding; t.anisotropy=4;
  mesh.material=new T3.MeshStandardMaterial({map:t,emissive:0xffffff,emissiveMap:t,emissiveIntensity:.85,roughness:.25}); return SCR[key]={c,g:c.getContext("2d"),t,W,H}; }
const F="Malgun Gothic, Noto Sans KR, sans-serif";
function dm(g,x,y,s,seed){ let r=seed||7; const n=12, k=s/n; g.fillStyle="#000"; for(let i=0;i<n;i++) for(let j=0;j<n;j++){ r=(r*1103515245+12345)&0x7fffffff; if(i===0||j===n-1||(r>>16)%2) g.fillRect(x+i*k,y+j*k,k,k); } }
function psScreens(dt){
  PS.scrT=(PS.scrT||0)+dt; if(PS.scrT<.4) return; PS.scrT=0;
  /* 라벨 인쇄기 (실행 = 녹색 바탕) */
  if(PKG.prScr){ const S=scrCv("pr",PKG.prScr,512,310), g=S.g, on=PS.pr.on;
    g.fillStyle=on?"#8fe048":"#b8bcc0"; g.fillRect(0,0,512,310); g.fillStyle="#222"; g.font="15px "+F; g.fillText("Supervisor",50,24); g.font="bold 17px "+F; g.fillText(on?"실행":"정지",230,26);
    g.font="12px "+F; const d=new Date(); g.fillText(d.toLocaleDateString("ko-KR")+" "+d.toTimeString().slice(0,5),395,22);
    g.fillStyle="#dfe6f2"; g.fillRect(10,40,52,260); g.fillStyle="#444"; g.font="11px "+F; ["잠깐 멈춤","작업 선택","조정","메뉴","꺼짐"].forEach((t,i)=>g.fillText(t,14,80+i*50));
    g.fillStyle="#e8eef8"; g.fillRect(70,40,310,260); g.fillStyle="#3a6bd0"; g.font="13px "+F; g.fillText("job",80,58);
    g.fillStyle="#fff"; g.fillRect(70,110,310,130); g.fillStyle="#000"; g.font="bold 34px "+F; g.fillText(PS.job.lot,78,150); g.fillText(PS.job.exp,78,195); g.font="11px "+F; g.fillText("(01)"+PS.job.gtin+"(17)"+PS.job.expG,78,218); g.fillText("(10)"+PS.job.lot+"(21)"+psSN(PS.serial),78,234); dm(g,300,118,70,PS.serial);
    g.fillStyle="#e8eef8"; g.fillRect(388,40,116,120); g.fillStyle="#7fd048"; const rb=PS.pr.ribbon/100; g.fillRect(410,60+(1-rb)*90,60,90*rb); g.fillStyle="#333"; g.font="11px "+F; g.fillText(Math.round(PS.pr.ribbon)+" %",395,155);
    g.fillStyle="#e8eef8"; g.fillRect(388,168,116,132); g.fillStyle="#333"; g.font="11px "+F; g.fillText("총 인쇄 횟수",394,186); g.fillText("배치 인쇄 횟수",394,226); g.fillText("순간 평균 팩 속도",394,266);
    g.fillStyle="#2a4aa8"; g.font="bold 14px "+F; g.fillText(String(PS.pr.total),430,206); g.fillText(PS.pr.batch+"",470,246); g.fillText(Math.round(PS.pr.spd)+"",480,290); S.t.needsUpdate=true; }
  /* 비전 PC (판정 OK 녹 · NG 적) */
  if(PKG.pcScr){ const S=scrCv("vis",PKG.pcScr,512,384), g=S.g, on=PS.vis.on;
    g.fillStyle="#2b4a8a"; g.fillRect(0,0,512,384); g.fillStyle="#fff"; g.font="bold 16px "+F; g.fillText("GS1 바코드 리딩시스템",150,22);
    g.fillStyle="#d8e2f0"; g.fillRect(6,32,200,346); g.fillStyle="#123"; g.font="11px "+F; g.fillText("모델명  "+PS.job.nm,12,50); g.fillText("GTIN  "+PS.job.gtin,12,68);
    g.fillStyle=on?"#e8e8e8":"#9fc"; g.fillRect(150,56,50,18); g.fillStyle="#000"; g.fillText(on?"중지":"시작",162,70);
    g.fillStyle="#fff"; g.fillRect(10,80,192,150); g.fillStyle="#223"; PS.vis.log.slice(0,5).forEach((l,i)=>{ g.fillText(l.t.toTimeString().slice(0,8)+"  "+psSN(l.sn),14,98+i*28); g.fillText("  로트 "+PS.job.lot+" · "+PS.job.exp,14,110+i*28); });
    g.fillStyle="#334"; ["상품코드","유통일자","로트번호","일련번호"].forEach((t,i)=>{ g.fillText(t,12,252+i*28); g.fillStyle="#1d3f9a"; g.fillRect(68,240+i*28,134,20); g.fillStyle="#fff"; g.fillText([PS.job.gtin,PS.job.exp,PS.job.lot,psSN(Math.max(1,PS.serial-1))][i],72,254+i*28); g.fillStyle="#334"; });
    g.fillStyle="#555"; g.fillRect(212,32,294,200); g.fillStyle="#ddd"; g.fillRect(222,60,274,140); g.fillStyle="#222"; g.font="bold 20px "+F; g.fillText(PS.job.lot,262,120); g.fillText(PS.job.exp,262,150); dm(g,420,92,60,PS.serial-1);
    if(on){ g.strokeStyle="#3f3"; g.lineWidth=2; g.strokeRect(256,100,90,26); g.strokeRect(256,130,120,26); g.strokeRect(414,86,72,72); }
    g.font="bold 13px "+F; [["TOTAL",PS.vis.total],["GOOD",PS.vis.good],["NG",PS.vis.ng]].forEach(([k,v],i)=>{ g.fillStyle="#9cc0f0"; g.fillRect(212,240+i*44,80,38); g.fillStyle="#1d3f9a"; g.fillRect(296,240+i*44,80,38); g.fillStyle="#123"; g.fillText(k,222,264+i*44); g.fillStyle="#fff"; g.fillText(String(v),306,264+i*44); });
    const ok=PS.vis.last!=="NG"; g.fillStyle=!on?"#777":ok?"#21a34a":"#d22"; g.fillRect(382,240,124,126); g.fillStyle="#fff"; g.font="bold 46px "+F; g.fillText(!on?"OFF":ok?"OK":"NG",396,318); S.t.needsUpdate=true; }
  /* 라벨러 판넬 (주황 터치 화면) */
  if(PKG.labScr){ const S=scrCv("lab",PKG.labScr,320,226), g=S.g;
    g.fillStyle="#f6b26b"; g.fillRect(0,0,320,226); g.fillStyle="#7a2c00"; g.font="bold 15px "+F; g.fillText("자동화면",10,20); g.font="11px "+F; g.fillText(new Date().toTimeString().slice(0,5),270,18);
    const box=(x,y,w,h,t,hi)=>{ g.fillStyle=hi?"#c03a5a":"#fbd3a8"; g.fillRect(x,y,w,h); g.strokeStyle="#7a2c00"; g.strokeRect(x,y,w,h); g.fillStyle=hi?"#fff":"#7a2c00"; g.fillText(t,x+6,y+h/2+4); };
    g.font="12px "+F; box(100,30,120,20,"헤드 "+(7000+PS.lab.cnt*.2).toFixed(2),true); box(10,60,90,40,"헤드운전선택",true); box(190,60,110,20,String(PS.lab.cnt),true); box(220,82,80,18,"RESET");
    box(10,110,90,30,"자동운전",true); box(110,110,80,30,"RUN",PS.lab.run); box(200,110,80,30,"STOP",!PS.lab.run);
    box(10,150,60,24,"프린터",true); box(75,150,50,24,"ON",PS.pr.on); box(130,150,50,24,"OFF",!PS.pr.on); box(190,150,60,24,"현재온도",true); box(255,150,55,24,PS.lab.temp.toFixed(1),true);
    ["수동","자동","변경","수량","알람"].forEach((t,i)=>box(8+i*62,190,58,26,t)); S.t.needsUpdate=true; }
  /* 설명서 부착기 LCD (2줄) */
  if(PKG.leafScr){ const S=scrCv("leaf",PKG.leafScr,256,110), g=S.g; g.fillStyle=PS.leaf.on?"#c8e85a":"#6d7a40"; g.fillRect(0,0,256,110); g.fillStyle="#1a2a00"; g.font="bold 24px monospace";
    g.fillText(PS.leaf.on?"RUN MODE":"STOP MODE",40,45); g.fillText("LABEL CONTROLLER".slice(0,16),8,88); S.t.needsUpdate=true; }
  /* 중량선별기 (형광 표시창) */
  if(PKG.cwScr){ const S=scrCv("cw",PKG.cwScr,400,170), g=S.g, c=PS.cw; g.fillStyle="#050807"; g.fillRect(0,0,400,170); g.fillStyle="#4ef0c0"; g.font="bold 18px monospace";
    g.fillText("No.0  "+PS.job.nm.slice(-3),10,26); g.fillText(c.run?c.last.toFixed(2)+" g":"STOP",230,26);
    g.font="16px monospace"; g.fillText("PASS "+String(c.pass).padStart(6),10,62); g.fillText("-NG  "+String(c.nNG).padStart(6),10,94); g.fillText("+NG  "+String(c.pNG).padStart(6),10,126);
    g.fillText("TOTAL "+(c.pass+c.nNG+c.pNG),220,62); g.fillText("SET "+(c.set?c.std.toFixed(2):"--.--"),220,94); g.fillText("LO "+(c.set?c.lo.toFixed(2):"--")+" HI "+(c.set?c.hi.toFixed(2):"--"),220,126);
    g.fillText(c.edit?"입력 : "+c.edit:"",10,158); S.t.needsUpdate=true; }
  /* 집합 포장(AG) PC */
  if(PKG.aggScr){ const S=scrCv("ag",PKG.aggScr,640,410), g=S.g, a=PS.ag;
    g.fillStyle="#c9cfdc"; g.fillRect(0,0,640,410); g.fillStyle="#3c4660"; g.fillRect(0,0,640,34); g.fillStyle="#fff"; g.font="bold 16px "+F; g.fillText("AG",10,24); g.font="13px "+F; ["작업지시","작업현황","작업이력"].forEach((t,i)=>{ g.fillStyle=i===1?"#e8ecf4":"#58637e"; g.fillRect(60+i*96,6,90,28); g.fillStyle=i===1?"#223":"#ccd"; g.fillText(t,76+i*96,25); });
    g.fillStyle="#e8ecf4"; g.fillRect(0,34,640,40); g.fillStyle="#223"; g.font="bold 16px "+F; g.fillText("전체  "+a.boxes+" / "+PS.boxTotal,14,60); g.fillText("단품  "+a.n+" / "+PS.boxN,190,60);
    g.fillStyle="#2a5aa8"; g.fillRect(430,40,96,28); g.fillRect(532,40,100,28); g.fillStyle="#fff"; g.font="13px "+F; g.fillText("작업완료",452,59); g.fillText(a.on?"일시정지":"작업시작",554,59);
    g.fillStyle="#f4f6fa"; g.fillRect(6,80,370,322); g.fillStyle="#5a6fd0"; g.fillRect(10,84,90,18); g.fillStyle="#fff"; g.font="11px "+F; g.fillText("비전검사",28,97);
    g.fillStyle="#e6e9f0"; g.fillRect(10,106,200,22); g.fillStyle="#223"; g.fillText(a.msg||"",14,121); g.fillStyle=PS.scanFlash>0?"#2f2":"#3a3"; g.beginPath(); g.arc(224,117,8,0,7); g.fill();
    g.fillStyle="#2a5aa8"; g.fillRect(238,106,60,22); g.fillRect(304,106,68,22); g.fillStyle="#fff"; g.fillText("클리어",250,121); g.fillText("포장완료",314,121);
    g.fillStyle="#223"; g.font="10px "+F; a.list.slice(0,10).forEach((l,i)=>g.fillText((a.n-i)+"  "+l,14,146+i*24));
    g.fillStyle="#f4f6fa"; g.fillRect(382,80,252,322); g.fillStyle="#5a6fd0"; g.fillRect(386,84,110,18); g.fillStyle="#fff"; g.font="11px "+F; g.fillText("박스바코드 발급",396,97);
    g.fillStyle="#b9c0cc"; ["재발급","박스조정","시험인쇄"].forEach((t,i)=>{ g.fillRect(386+i*82,106,76,22); }); g.fillStyle="#fff"; ["재발급","박스조정","시험인쇄"].forEach((t,i)=>g.fillText(t,396+i*82,121));
    g.fillStyle="#223"; g.fillText("LOT번호  "+PS.job.lot,388,146); g.fillText("제품코드  "+PS.job.gtin,388,166);
    a.issued.slice(0,9).forEach((l,i)=>{ g.fillStyle=i===0?"#d22":"#223"; g.fillText(l.no+"  P/A  "+l.sn.slice(0,30),388,192+i*22); });
    if(!PS.rx){ g.fillStyle="#0009"; g.fillRect(0,34,640,376); g.fillStyle="#fff"; g.font="bold 22px "+F; g.fillText("일반의약품 — 판독 없음",200,220); }
    S.t.needsUpdate=true; }
  if(PS.scanFlash>0) PS.scanFlash-=.4;
}
