/* ═══════════════════════════════════════════════════════════════════
   충전량 조절 미니게임 (11/16 사용자 지시 · V23 아날로그형) — 2층 데크 함량조절다이얼을 육각 L 렌치로 돌려 노즐별 충전량을 맞춤
   · 함량조절다이얼 (현장 사진) : 주황 카운터(숫자 4자리 창 + 가운데 큰 크롬 육각 소켓) · 은색 소켓(카운터 없음). 서쪽(전면) = 첨가제(주황) 10 / 동쪽(후면) = 한 줄에 백당(은색) · 주성분(주황) 10쌍 (사용자 확정)
   · 화면 : 선택한 다이얼을 크게 가까이서 본 모습(육각 렌치가 꽂힌 채 돌아감 · 카운터 숫자가 굴러감) + 아래에 10개 다이얼을 작게(참고 · 클릭 선택)
   · A / D : 렌치를 왼쪽(감소) · 오른쪽(증가)으로 돌림 — 짧게 = 한 눈금(24°), 누르고 있으면 렌치가 손잡이째 부드럽게 계속 돎(360°) (11/24 사용자 지시)   · ← / → : 노즐 선택   · 1 / 2 : 원료 선택(동쪽)   · F · Esc : 닫기
   · 예상 충전량은 대략적인 범위로 표시 (예 : 2.150 ~ 2.200 g). 실제 값은 공정검사(IPC) 계량으로 확인 — 다이얼 값은 IPC 계량값에 노즐별로 반영
   · 카운터 1 눈금 = 충전량 0.1 % (교육용 설정 · 확인 필요), 기준 = 1000
   ═══════════════════════════════════════════════════════════════════ */
const DIAL={open:false, side:"F", k:"add", i:0, onClose:null, max:.10, step:.001, ok:.02, disp:0, rot:0, raf:0, shake:0, hold:null, deg:24, spd:300, wait:220};   /* deg = 눈금 1칸 회전각 · spd = 누르고 있을 때 회전 속도(°/초) · wait = 계속 돌기 시작까지(ms) */
const DIAL_SIDE={F:["add"], B:["main","sug"]};                   /* 서쪽(F · 전면) = 첨가제 / 동쪽(B · 후면) = 주성분 · 백당 (11/16 사용자 확정) */
const dialCount=v=>Math.round(1000*(1+v));                       /* 카운터 표시값 (기준 1000) */
/* 노즐별 다이얼 값 (기준 대비 비율) — 세션마다 노즐 사이 작은 차이(±1.2 %)로 시작, 이상사례 등으로 원료 전체 값이 바뀌면 노즐 전체를 같이 이동 */
function dialArr(k){
  if(!S||!S.f) return null;
  const f=S.f; if(!f.dialN){ f.dialN={}; for(const q of ["add","main","sug"]){ const a=[]; for(let i=0;i<10;i++) a.push(Math.round((Math.random()*2-1)*.012/DIAL.step)*DIAL.step); const m=a.reduce((s,v)=>s+v,0)/10; f.dialN[q]=a.map(v=>v-m+(f.dial[q]||0)); } }
  const a=f.dialN[k], m=a.reduce((s,v)=>s+v,0)/10, d=(f.dial[k]||0)-m;
  if(Math.abs(d)>1e-6) for(let i=0;i<10;i++) a[i]+=d;                       /* 외부 변경(이상사례 · 프리셋) 반영 */
  return a;
}
/* ── 시간에 따른 충전량 변동 (11/17 사용자 지시 : 1~2 % 내외 랜덤) ──
   운전(RUN · FILLING ON) 중에만 원료 흐름 · 밀도 변화로 실제 충전량이 다이얼 설정에서 조금씩 벗어남.
   원료 공통 성분 + 노즐별 성분, 각각 평균으로 되돌아오는 랜덤 변동(상관시간 약 5분 · 표준편차 약 0.6 %), 합계 ±2 % 이내.
   다이얼(카운터 숫자)은 그대로이고, 예상 충전량 · 판정 · IPC 계량값에는 변동이 들어감 → IPC 로 확인하고 다이얼로 보정 */
const DRIFT={th:1/300, sc:.006, sn:.006, max:.02, t:null};
function dialDr(){ const f=S.f; if(!f.dialD){ const z=()=>Array(10).fill(0); f.dialD={c:{add:0,main:0,sug:0}, e:{add:z(),main:z(),sug:z()}}; } return f.dialD; }
function dialAct(k,i){ const a=dialArr(k); if(!a) return 0; const D=dialDr(), j=((i%10)+10)%10; return a[j]+clamp(D.c[k]+D.e[k][j],-DRIFT.max,DRIFT.max); }
function dialDriftTick(){
  if(!S||!S.session||!S.session.active||!S.f){ DRIFT.t=null; return; }
  if(DRIFT.t==null||tSim<DRIFT.t){ DRIFT.t=tSim; return; } const dt=tSim-DRIFT.t; DRIFT.t=tSim; if(dt<=0||dt>120||!(S.f.run&&S.f.filling)) return;
  const D=dialDr(), ou=(x,s)=>clamp(x-DRIFT.th*x*dt+s*Math.sqrt(2*DRIFT.th*dt)*gauss(),-DRIFT.max,DRIFT.max);
  for(const k of ["add","main","sug"]){ D.c[k]=ou(D.c[k],DRIFT.sc); for(let i=0;i<10;i++) D.e[k][i]=ou(D.e[k][i],DRIFT.sn); }
}
function dialOff(k,i){ return dialAct(k,i); }   /* IPC 계량값 = 다이얼 설정 + 변동 */
function dialSet(k,i,v){ const a=dialArr(k); if(!a) return; a[i]=clamp(v,-DIAL.max,DIAL.max); S.f.dial[k]=a.reduce((s,x)=>s+x,0)/10; }
const dialOK=k=>{ const a=dialArr(k); return !!a&&a.every((v,i)=>Math.abs(dialAct(k,i))<=DIAL.ok+1e-9); };   /* 판정은 실제 충전량(설정 + 변동) 기준 */
const dialRange=(k,v)=>{ const s=IPC_STD[k].std, c=s*(1+v), h=s*.0125; return [c-h,c+h]; };
const dialCls=v=>Math.abs(v)<=DIAL.ok+1e-9?"ok":Math.abs(v)<=.04+1e-9?"warn":"ng";
const dialSideOf=k=>k==="add"?"F":"B";

function dialOpen(side,onClose){
  if(!S||!S.session||!S.session.active) return;
  DIAL.open=true; DIAL.side=side||"F"; const L=DIAL_SIDE[DIAL.side]; if(!L.includes(DIAL.k)) DIAL.k=L[0]; DIAL.onClose=onClose||null;
  if(DIAL.side==="B"&&S.activeTrouble) DIAL.k="main";
  let el=$("#dialGame"); if(!el){ $("#main").insertAdjacentHTML("beforeend",'<div id="dialGame" class="modal"></div>'); el=$("#dialGame"); }
  el.classList.add("on"); if(document.pointerLockElement) document.exitPointerLock();
  DIAL.hold=null; DIAL.disp=dialArr(DIAL.k)[DIAL.i]; DIAL.rot=DIAL.disp/DIAL.step*DIAL.deg;
  dialRender(); dialLoop();
}
function dialClose(){ DIAL.hold=null;
  if(!DIAL.open) return; DIAL.open=false; $("#dialGame").classList.remove("on"); cancelAnimationFrame(DIAL.raf);
  for(const q of DIAL_SIDE[DIAL.side]){ const r=S.ipc&&S.ipc.res&&S.ipc.res[q]; if(r&&!r.pass&&dialOK(q)) r.stale=true; } if(typeof renderIpc==="function") renderIpc();   /* 조절 후 재측정 */
  const cb=DIAL.onClose; DIAL.onClose=null; try{ cb&&cb(); }catch(e){ console.error(e); }
  if(typeof renderCoach==="function") renderCoach(); if(typeof stepCheck==="function") stepCheck();
}
/* ── 가까이 본 함량조절다이얼 (아날로그) : 스테인리스 판 · 주황 카운터(굴러가는 숫자 4자리) · 크롬 육각 소켓 · 꽂힌 육각 L 렌치 ── */
function dialScene(){
  const v=DIAL.disp, cnt=1000*(1+v), W=560, H=400, ctr=DIAL.k!=="sug", sx=230, sy=ctr?248:205;      /* sx · sy : 육각 소켓 중심 */
  const dig=[]; { const n=cnt; for(let p=0;p<4;p++){ const base=Math.pow(10,p), d=(n/base)%10, f=p===0?d:(Math.floor(d)+Math.max(0,((n%base)-(base-1)))); dig.unshift(f); } }
  const wheel=(x,d)=>{ let s='<g clip-path="url(#dgWin)"><g transform="translate('+x+','+(-((d%10)*40))+')">'; for(let k=-1;k<=11;k++){ const y=114+k*40; s+='<text x="0" y="'+(y+13)+'" font-size="34" font-family="DejaVu Sans Mono,Consolas,monospace" font-weight="700" fill="#f2f2ee" text-anchor="middle">'+(((k%10)+10)%10)+'</text>'; } return s+'</g></g>'; };
  const sh=DIAL.shake>0?(Math.random()-.5)*DIAL.shake*6:0, a=DIAL.rot+sh, hexR=30, ka=15+a;
  let s='<svg viewBox="0 0 '+W+' '+H+'" class="dgScene"><defs>'+
    '<linearGradient id="dgSS" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3e6e8"/><stop offset=".45" stop-color="#a3a9ae"/><stop offset=".55" stop-color="#c2c7cb"/><stop offset="1" stop-color="#868d93"/></linearGradient>'+
    '<linearGradient id="dgOr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a3c"/><stop offset=".55" stop-color="#ef6c12"/><stop offset="1" stop-color="#c25208"/></linearGradient>'+
    '<radialGradient id="dgCr" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#c8ced3"/><stop offset=".7" stop-color="#6d747a"/><stop offset="1" stop-color="#3a3f44"/></radialGradient>'+
    '<linearGradient id="dgKey" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4d8db"/><stop offset=".5" stop-color="#8d949a"/><stop offset="1" stop-color="#4b5157"/></linearGradient>'+
    '<clipPath id="dgWin"><rect x="'+(sx-96)+'" y="92" width="192" height="46" rx="4"/></clipPath>'+
    '<filter id="dgSh"><feDropShadow dx="3" dy="5" stdDeviation="5" flood-opacity=".45"/></filter></defs>'+
    '<rect width="'+W+'" height="'+H+'" fill="#1b1f23"/><rect x="16" y="30" width="'+(W-32)+'" height="'+(H-60)+'" rx="6" fill="url(#dgSS)"/>'+
    [[34,48],[W-34,48],[34,H-48],[W-34,H-48]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="9" fill="url(#dgCr)"/><path d="M'+(x-5)+' '+y+'h10" stroke="#3a3f44" stroke-width="2"/>').join("");
  if(ctr){ /* 주황 카운터 다이얼 : 위 숫자 창 · 가운데 큰 크롬 육각 소켓 */
    s+='<g filter="url(#dgSh)"><rect x="'+(sx-118)+'" y="62" width="236" height="290" rx="12" fill="url(#dgOr)"/></g><rect x="'+(sx-108)+'" y="70" width="216" height="10" rx="5" fill="#ffd2a8" opacity=".45"/>'+
      '<rect x="'+(sx-102)+'" y="88" width="204" height="54" rx="6" fill="#111"/>'+[0,1,2,3].map(p=>'<rect x="'+(sx-96+p*49)+'" y="92" width="45" height="46" rx="3" fill="#1d1d1d"/>').join("")+
      dig.map((d,p)=>wheel(sx-73+p*49,d)).join("")+'<rect x="'+(sx-96)+'" y="92" width="192" height="12" fill="#fff" opacity=".08"/><rect x="'+(sx-96)+'" y="126" width="192" height="12" fill="#000" opacity=".35"/>'+
      '<g filter="url(#dgSh)"><circle cx="'+sx+'" cy="'+sy+'" r="70" fill="url(#dgCr)"/></g><circle cx="'+sx+'" cy="'+sy+'" r="56" fill="none" stroke="#5c6369" stroke-width="3"/>'; }
  else { /* 백당 : 은색 소켓 (카운터 없음) — 둘레 눈금으로 돌린 양을 봄 */
    for(let t=0;t<36;t++){ const r=t*10*Math.PI/180, L=t%3?10:18; s+='<line x1="'+(sx+92*Math.cos(r))+'" y1="'+(sy+92*Math.sin(r))+'" x2="'+(sx+(92+L)*Math.cos(r))+'" y2="'+(sy+(92+L)*Math.sin(r))+'" stroke="#3a3f44" stroke-width="'+(t%3?1.5:3)+'"/>'; }
    s+='<g filter="url(#dgSh)"><circle cx="'+sx+'" cy="'+sy+'" r="82" fill="url(#dgCr)"/></g><circle cx="'+sx+'" cy="'+sy+'" r="66" fill="none" stroke="#5c6369" stroke-width="4"/><circle cx="'+sx+'" cy="'+sy+'" r="50" fill="none" stroke="#7d848a" stroke-width="2"/>'; }
  s+='<g transform="rotate('+a+' '+sx+' '+sy+')"><polygon points="'+[0,1,2,3,4,5].map(j=>{ const t=j*Math.PI/3; return (sx+hexR*Math.cos(t))+","+(sy+hexR*Math.sin(t)); }).join(" ")+'" fill="#0e1012"/>'+
    (ctr?'':'<rect x="'+(sx-3)+'" y="'+(sy-80)+'" width="6" height="24" rx="2" fill="#1b1f23"/>')+'</g>'+                               /* 백당 소켓 각도 표시 */
    /* 꽂힌 육각 L 렌치 (크롬) : 짧은 쪽은 소켓 안, 긴 쪽 손잡이가 소켓과 함께 그대로 360° 돎 (11/24 사용자 지시 — 60° 마다 다시 끼우던 방식 제거) */
    '<g transform="rotate('+ka+' '+sx+' '+sy+')"><polygon points="'+[0,1,2,3,4,5].map(j=>{ const t=j*Math.PI/3+Math.PI/6; return (sx+hexR*.8*Math.cos(t))+","+(sy+hexR*.8*Math.sin(t)); }).join(" ")+'" fill="url(#dgKey)"/>'+
    '<rect x="'+sx+'" y="'+(sy-11)+'" width="250" height="22" rx="9" fill="url(#dgKey)"/><rect x="'+(sx+4)+'" y="'+(sy-9)+'" width="242" height="5" rx="2" fill="#fff" opacity=".35"/></g>'+
    '<text x="'+sx+'" y="'+(ctr?342:330)+'" font-size="15" fill="'+(ctr?"#fff1e2":"#2a2f33")+'" text-anchor="middle" font-weight="700">'+esc(IPC_STD[DIAL.k].nm)+' 함량조절 · 노즐 '+(DIAL.i+1)+(ctr?"":" (은색 소켓 · 카운터 없음)")+'</text></svg>';
  return s;
}
function dialMini(k,x,i){
  const c=dialCount(x), ac=dialAct(k,i), r=dialRange(k,ac); x=ac;   /* 숫자 = 다이얼 설정 · 색 · 예상값 = 실제 */
  if(k==="sug") return '<div class="dgCell '+dialCls(x)+(i===DIAL.i?" sel":"")+'" data-i="'+i+'"><i class="dgMiniSil"></i><s>'+((r[0]+r[1])/2).toFixed(3)+'</s><b>'+(i+1)+'</b></div>';   /* 백당 : 은색 소켓 (카운터 없음) */
  return '<div class="dgCell '+dialCls(x)+(i===DIAL.i?" sel":"")+'" data-i="'+i+'"><div class="dgMiniBox"><span>'+String(c).padStart(4,"0")+'</span><i class="dgMiniHex"></i></div><b>'+(i+1)+'</b></div>';
}
function dialRender(){
  const el=$("#dialGame"); if(!el||!DIAL.open) return;
  const k=DIAL.k, a=dialArr(k), v=dialAct(k,DIAL.i), rg=dialRange(k,v), std=IPC_STD[k].std, f3=x=>x.toFixed(3);
  const tabs=DIAL_SIDE[DIAL.side].map((q,j)=>'<button class="dgTab'+(q===k?" on":"")+'" data-k="'+q+'">'+(DIAL_SIDE[DIAL.side].length>1?(j+1)+" · ":"")+IPC_STD[q].nm+(dialOK(q)?" ✓":"")+'</button>').join("");
  el.innerHTML='<div class="dgBox"><div class="dgHead"><b>🔧 함량조절다이얼 · 충전량 조절</b><span>'+(DIAL.side==="F"?"서쪽(전면) · 첨가제":"동쪽(후면) · 주성분(주황) · 백당(은색)")+'</span><button class="dgX" id="dgX">닫기 (F · Esc)</button></div>'+
    '<div class="dgTabs">'+tabs+'</div>'+
    '<div class="dgMain"><div class="dgBig" id="dgBig">'+dialScene()+'</div><div class="dgInfo">'+
      '<div class="dgPred '+dialCls(v)+'" id="dgPred">예상 충전량<b>'+f3(rg[0])+' ~ '+f3(rg[1])+' g</b><s>기준 '+f3(std)+' g</s></div>'+
      '<div class="dgKeys"><span>A</span> 감소 · <span>D</span> 증가 (누르고 있으면 계속)<br><span>←</span><span>→</span> 노즐 선택'+(DIAL_SIDE[DIAL.side].length>1?' · <span>1</span><span>2</span> 원료':'')+'</div>'+
      '<div class="dgNote">예상값은 대략적인 범위입니다. 운전 중에는 원료 흐름 · 밀도 변화로 충전량이 조금씩(±1~2 %) 달라지므로 정기 공정검사(IPC) 계량으로 확인하고 다이얼로 보정합니다.</div></div></div>'+
    '<div class="dgRow">'+a.map((x,i)=>dialMini(k,x,i)).join("")+'</div>'+
    '<div class="dgFoot" id="dgFoot">'+dialFoot(k,a)+'</div></div>';
  $("#dgX").onclick=dialClose;
  $$("#dialGame [data-k]").forEach(b=>b.onclick=()=>{ DIAL.k=b.dataset.k; dialSnap(); dialRender(); });
  $$("#dialGame [data-i]").forEach(b=>b.onclick=()=>{ DIAL.i=+b.dataset.i; dialSnap(); dialRender(); });
}
const dialFoot=(k,a)=>dialOK(k)?'<span class="okT">✓ '+IPC_STD[k].nm+' 10개 노즐 모두 기준 ±2 % 이내</span>':'<span>'+IPC_STD[k].nm+' : 기준 ±2 % 를 벗어난 노즐 '+a.filter((x,i)=>Math.abs(dialAct(k,i))>DIAL.ok+1e-9).length+' 개</span>';
function dialSnap(){ DIAL.hold=null; DIAL.disp=dialArr(DIAL.k)[DIAL.i]; DIAL.rot=DIAL.disp/DIAL.step*DIAL.deg; }
/* 애니메이션 : 카운터 숫자가 굴러가고 렌치가 돌아감 */
function dialLoop(){
  if(!DIAL.open) return;
  const now=performance.now(), H=DIAL.hold;
  if(H){ const dt=Math.min(.05,(now-(H.last||now))/1000); H.last=now;
    if(now-H.t0>DIAL.wait){ H.acc+=DIAL.spd*dt; while(H.acc>=DIAL.deg&&DIAL.hold){ H.acc-=DIAL.deg; if(!dialStep(H.dir)){ DIAL.hold=null; break; } } } }
  const a=dialArr(DIAL.k), v=a[DIAL.i], h=DIAL.hold, part=h?h.dir*h.acc/DIAL.deg:0, tr=(v/DIAL.step+part)*DIAL.deg, tv=v+part*DIAL.step;
  const moving=Math.abs(DIAL.disp-tv)>1e-6||Math.abs(DIAL.rot-tr)>.05||DIAL.shake>0;
  if(moving){ const k=h&&h.acc>0?1:.35; DIAL.disp+=(tv-DIAL.disp)*k; DIAL.rot+=(tr-DIAL.rot)*k; if(Math.abs(DIAL.disp-tv)<2e-5) DIAL.disp=tv; DIAL.shake=Math.max(0,DIAL.shake-.08);   /* 계속 도는 중 = 그대로 따라감(끊김 없음) · 한 번 누름 = 부드럽게 다가감 */
    const b=$("#dgBig"); if(b) b.innerHTML=dialScene(); }
  DIAL.raf=requestAnimationFrame(dialLoop);
}
/* 한 눈금 돌리기 (A = −1 · D = +1) : 값 · 예상값 · 아래 작은 다이얼 갱신 — 끝에 닿으면 false */
function dialStep(dir){
  const k=DIAL.k, a=dialArr(k), v=a[DIAL.i], nv=clamp(v+dir*DIAL.step,-DIAL.max,DIAL.max);
  if(Math.abs(nv-v)<1e-12){ DIAL.shake=1; beep(160,.05,"square",.02); return false; }
  dialSet(k,DIAL.i,Math.round(nv/DIAL.step)*DIAL.step); beep(1500,.012,"square",.012);
  const x=dialArr(k)[DIAL.i], rg=dialRange(k,dialAct(k,DIAL.i)), P=$("#dgPred"), cell=$('#dialGame [data-i="'+DIAL.i+'"]');
  if(P){ P.className="dgPred "+dialCls(dialAct(k,DIAL.i)); P.querySelector("b").textContent=rg[0].toFixed(3)+" ~ "+rg[1].toFixed(3)+" g"; }
  if(cell) cell.outerHTML=dialMini(k,x,DIAL.i); const idx=DIAL.i, nc=$('#dialGame [data-i="'+idx+'"]'); if(nc) nc.onclick=()=>{ DIAL.i=idx; dialSnap(); dialRender(); };
  const F=$("#dgFoot"); if(F) F.innerHTML=dialFoot(k,dialArr(k));
  return true;
}
/* 손을 떼면 : 반 눈금 넘게 돌았으면 한 눈금 더 확정, 아니면 제자리로 */
function dialRelease(){ const H=DIAL.hold; if(!H) return; DIAL.hold=null; if(H.acc>=DIAL.deg/2) dialStep(H.dir); }
function dialKey(e){
  if(!DIAL.open) return; DIAL.keyAt=performance.now();
  const c=e.code, side=DIAL_SIDE[DIAL.side];
  if(c==="KeyA"||c==="KeyD"){ e.preventDefault(); e.stopPropagation(); const dir=c==="KeyD"?1:-1;
    if(e.repeat||(DIAL.hold&&DIAL.hold.dir===dir)) return;                       /* 키 자동 반복은 쓰지 않음 — 누르고 있는 동안 dialLoop 가 일정 속도로 돌림 */
    dialRelease(); const ok=dialStep(dir); if(ok) DIAL.hold={dir, t0:performance.now(), last:performance.now(), acc:0};
    return; }
  if(c==="ArrowLeft"||c==="ArrowRight"){ DIAL.i=clamp(DIAL.i+(c==="ArrowRight"?1:-1),0,9); dialSnap(); }
  else if((c==="Digit1"||c==="Digit2")&&side.length>1){ DIAL.k=side[c==="Digit1"?0:1]; dialSnap(); }
  else if(c==="KeyF"||c==="Escape"){ e.preventDefault(); e.stopPropagation(); dialClose(); return; }
  else return;
  e.preventDefault(); e.stopPropagation(); dialRender();
}
/* 3D 함량조절다이얼 : 카운터 숫자 · 소켓 회전 (bridge v3Sync) */
function dialDraw(){
  if(typeof FM==="undefined"||!FM.dials||!S||!S.f) return;
  const act=S.session&&S.session.active;
  for(const k of ["add","main","sug"]){ const a=act?dialArr(k):null; FM.dials[k].forEach((D,i)=>{ const v=a?a[i]:0, c=dialCount(v);
      if(D.hex) D.hex.rotation.x=v/DIAL.step*.42;
      if(D.cnt!==c&&D.ctx){ D.cnt=c; const x=D.ctx; x.fillStyle="#111"; x.fillRect(0,0,128,48); x.fillStyle="#f2f2ee"; x.font="bold 36px monospace"; x.textAlign="center"; x.fillText(String(c).padStart(4,"0"),64,38); D.tex.needsUpdate=true; } }); }
}
function dialInit(){ addEventListener("keydown",dialKey,true);
  addEventListener("keyup",e=>{ if(DIAL.hold&&((e.code==="KeyA"&&DIAL.hold.dir<0)||(e.code==="KeyD"&&DIAL.hold.dir>0))) dialRelease(); },true); addEventListener("blur",()=>dialRelease()); setInterval(()=>{ dialDriftTick(); if(DIAL.open&&!DIAL.keyAt||DIAL.open&&performance.now()-DIAL.keyAt>1500){ DIAL.rt=(DIAL.rt||0)+1; if(DIAL.rt%4===0) dialRender(); } },500); }   /* 변동 · 열린 화면 예상값 갱신(2초) */
/* 자재 타일 : 충전량 조절 (3인칭 — 작업자가 2층 데크 조절부로 이동한 뒤 미니게임) */
TILE.mDial={e:"🔧",b:"충전량 조절 (함량조절다이얼)",s:()=>S&&S.f&&["add","main","sug"].every(dialOK)?"30노즐 기준 이내":"조절 필요",on:()=>!!(S&&S.f&&["add","main","sug"].every(dialOK)),
  click(){ const bad=["main","sug"].some(q=>!dialOK(q))&&dialOK("add"); bad?startWork("dialB",()=>dialOpen("B")):startWork("dialF",()=>dialOpen("F")); }};
if(!TILESET.F.mat.includes("mDial")) TILESET.F.mat.splice(TILESET.F.mat.indexOf("mScoop")+1,0,"mDial");
