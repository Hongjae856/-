/* ═══════════════════════════════════════════════════════════════════
   충전량 조절 미니게임 (11/16 사용자 지시 · V23 아날로그형) — 2층 데크 함량조절다이얼을 육각 L 렌치로 돌려 노즐별 충전량을 맞춤
   · 함량조절다이얼 : 주황 카운터(숫자 4자리 창) + 크롬 육각 소켓 (현장 사진). 서쪽(전면) = 첨가제 10 / 동쪽(후면) = 주성분 10 · 백당 10 (사용자 확정)
   · 화면 : 선택한 다이얼을 크게 가까이서 본 모습(육각 렌치가 꽂힌 채 돌아감 · 카운터 숫자가 굴러감) + 아래에 10개 다이얼을 작게(참고 · 클릭 선택)
   · A / D : 렌치를 왼쪽(감소) · 오른쪽(증가)으로 돌림 (누르고 있으면 계속)   · ← / → : 노즐 선택   · 1 / 2 : 원료 선택(동쪽)   · F · Esc : 닫기
   · 예상 충전량은 대략적인 범위로 표시 (예 : 2.150 ~ 2.200 g). 실제 값은 공정검사(IPC) 계량으로 확인 — 다이얼 값은 IPC 계량값에 노즐별로 반영
   · 카운터 1 눈금 = 충전량 0.1 % (교육용 설정 · 확인 필요), 기준 = 1000
   ═══════════════════════════════════════════════════════════════════ */
const DIAL={open:false, side:"F", k:"add", i:0, onClose:null, max:.10, step:.001, ok:.02, disp:0, rot:0, raf:0, shake:0};
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
function dialOff(k,i){ const a=dialArr(k); return a?a[((i%10)+10)%10]:0; }
function dialSet(k,i,v){ const a=dialArr(k); if(!a) return; a[i]=clamp(v,-DIAL.max,DIAL.max); S.f.dial[k]=a.reduce((s,x)=>s+x,0)/10; }
const dialOK=k=>{ const a=dialArr(k); return !!a&&a.every(v=>Math.abs(v)<=DIAL.ok+1e-9); };
const dialRange=(k,v)=>{ const s=IPC_STD[k].std, c=s*(1+v), h=s*.0125; return [c-h,c+h]; };
const dialCls=v=>Math.abs(v)<=DIAL.ok+1e-9?"ok":Math.abs(v)<=.04+1e-9?"warn":"ng";
const dialSideOf=k=>k==="add"?"F":"B";

function dialOpen(side,onClose){
  if(!S||!S.session||!S.session.active) return;
  DIAL.open=true; DIAL.side=side||"F"; const L=DIAL_SIDE[DIAL.side]; if(!L.includes(DIAL.k)) DIAL.k=L[0]; DIAL.onClose=onClose||null;
  if(DIAL.side==="B"&&S.activeTrouble) DIAL.k="main";
  let el=$("#dialGame"); if(!el){ $("#main").insertAdjacentHTML("beforeend",'<div id="dialGame" class="modal"></div>'); el=$("#dialGame"); }
  el.classList.add("on"); if(document.pointerLockElement) document.exitPointerLock();
  DIAL.disp=dialArr(DIAL.k)[DIAL.i]; DIAL.rot=DIAL.disp/DIAL.step*24;
  dialRender(); dialLoop();
}
function dialClose(){
  if(!DIAL.open) return; DIAL.open=false; $("#dialGame").classList.remove("on"); cancelAnimationFrame(DIAL.raf);
  for(const q of DIAL_SIDE[DIAL.side]){ const r=S.ipc&&S.ipc.res&&S.ipc.res[q]; if(r&&!r.pass&&dialOK(q)) r.stale=true; } if(typeof renderIpc==="function") renderIpc();   /* 조절 후 재측정 */
  const cb=DIAL.onClose; DIAL.onClose=null; try{ cb&&cb(); }catch(e){ console.error(e); }
  if(typeof renderCoach==="function") renderCoach(); if(typeof stepCheck==="function") stepCheck();
}
/* ── 가까이 본 함량조절다이얼 (아날로그) : 스테인리스 판 · 주황 카운터(굴러가는 숫자 4자리) · 크롬 육각 소켓 · 꽂힌 육각 L 렌치 ── */
function dialScene(){
  const v=DIAL.disp, cnt=1000*(1+v), W=560, H=400, sx=380, sy=270;            /* sx · sy : 소켓 중심 */
  const dig=[]; { let n=cnt; for(let p=0;p<4;p++){ const base=Math.pow(10,p), d=(n/base)%10, f=p===0?d:(Math.floor(d)+Math.max(0,((n%base)-(base-1))));   /* 낮은 자리는 연속, 윗자리는 넘어갈 때만 굴러감 */
      dig.unshift(f); } }
  const wheel=(x,d)=>{ let s='<g clip-path="url(#dgWin)"><g transform="translate('+x+','+(-((d%10)*46))+')">'; for(let k=-1;k<=11;k++){ const y=150+k*46; s+='<text x="0" y="'+(y+15)+'" font-size="40" font-family="DejaVu Sans Mono,Consolas,monospace" font-weight="700" fill="#f2f2ee" text-anchor="middle">'+(((k%10)+10)%10)+'</text>'; } return s+'</g></g>'; };
  const sh=DIAL.shake>0?(Math.random()-.5)*DIAL.shake*6:0, a=DIAL.rot+sh;
  return '<svg viewBox="0 0 '+W+' '+H+'" class="dgScene"><defs>'+
    '<linearGradient id="dgSS" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9dde0"/><stop offset=".45" stop-color="#9aa1a7"/><stop offset=".55" stop-color="#b8bec3"/><stop offset="1" stop-color="#7d848a"/></linearGradient>'+
    '<linearGradient id="dgOr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a3c"/><stop offset=".55" stop-color="#ef6c12"/><stop offset="1" stop-color="#c25208"/></linearGradient>'+
    '<radialGradient id="dgCr" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#c8ced3"/><stop offset=".7" stop-color="#6d747a"/><stop offset="1" stop-color="#3a3f44"/></radialGradient>'+
    '<linearGradient id="dgKey" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a6066"/><stop offset=".5" stop-color="#2b2f33"/><stop offset="1" stop-color="#15181b"/></linearGradient>'+
    '<linearGradient id="dgWrap" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a7a5e"/><stop offset=".5" stop-color="#c4b18c"/><stop offset="1" stop-color="#6e604a"/></linearGradient>'+
    '<clipPath id="dgWin"><rect x="92" y="128" width="200" height="54" rx="4"/></clipPath>'+
    '<filter id="dgSh"><feDropShadow dx="3" dy="5" stdDeviation="5" flood-opacity=".45"/></filter></defs>'+
    '<rect width="'+W+'" height="'+H+'" fill="#1b1f23"/>'+
    '<rect x="20" y="40" width="'+(W-40)+'" height="'+(H-80)+'" rx="6" fill="url(#dgSS)"/>'+
    [[40,60],[W-40,60],[40,H-60],[W-40,H-60]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="9" fill="url(#dgCr)"/><path d="M'+(x-5)+' '+y+'h10" stroke="#3a3f44" stroke-width="2"/>').join("")+
    /* 주황 카운터 */
    '<g filter="url(#dgSh)"><rect x="70" y="80" width="244" height="150" rx="10" fill="url(#dgOr)"/></g>'+
    '<rect x="78" y="88" width="228" height="10" rx="5" fill="#ffd2a8" opacity=".45"/>'+
    '<rect x="88" y="124" width="208" height="62" rx="6" fill="#111"/>'+
    [0,1,2,3].map(p=>'<rect x="'+(95+p*50)+'" y="128" width="44" height="54" rx="3" fill="#1d1d1d"/>').join("")+
    dig.map((d,p)=>wheel(117+p*50,d)).join("")+
    '<rect x="92" y="128" width="200" height="16" fill="url(#dgSS)" opacity=".18"/><rect x="92" y="166" width="200" height="16" fill="#000" opacity=".35"/>'+
    '<text x="192" y="112" font-size="14" fill="#5a2600" text-anchor="middle" font-weight="700">'+esc(IPC_STD[DIAL.k].nm)+' 함량조절 · 노즐 '+(DIAL.i+1)+'</text>'+
    '<text x="192" y="214" font-size="12" fill="#5a2600" text-anchor="middle">▲ D 증가 · A 감소 ▼</text>'+
    /* 크롬 육각 소켓 */
    '<g filter="url(#dgSh)"><circle cx="'+sx+'" cy="'+sy+'" r="52" fill="url(#dgCr)"/></g><circle cx="'+sx+'" cy="'+sy+'" r="40" fill="none" stroke="#5c6369" stroke-width="3"/>'+
    '<g transform="rotate('+a+' '+sx+' '+sy+')"><polygon points="'+[0,1,2,3,4,5].map(j=>{ const t=j*Math.PI/3; return (sx+17*Math.cos(t))+","+(sy+17*Math.sin(t)); }).join(" ")+'" fill="#0e1012"/>'+
    /* 꽂힌 육각 L 렌치 : 짧은 쪽은 소켓 안, 긴 손잡이가 화면 오른쪽 아래로 */
    '<g transform="rotate(35 '+sx+' '+sy+')"><rect x="'+(sx-9)+'" y="'+(sy-9)+'" width="18" height="18" rx="3" fill="url(#dgKey)"/>'+
    '<rect x="'+(sx)+'" y="'+(sy-8)+'" width="230" height="16" rx="7" fill="url(#dgKey)"/>'+
    '<rect x="'+(sx+120)+'" y="'+(sy-11)+'" width="120" height="22" rx="9" fill="url(#dgWrap)"/>'+
    [0,1,2,3,4,5,6,7].map(j=>'<line x1="'+(sx+126+j*14)+'" y1="'+(sy-11)+'" x2="'+(sx+134+j*14)+'" y2="'+(sy+11)+'" stroke="#5b4e3a" stroke-width="2"/>').join("")+'</g></g>'+
    '</svg>';
}
function dialMini(k,x,i){
  const c=dialCount(x);
  return '<div class="dgCell '+dialCls(x)+(i===DIAL.i?" sel":"")+'" data-i="'+i+'"><div class="dgMiniBox"><span>'+String(c).padStart(4,"0")+'</span></div><i class="dgMiniHex"></i><b>'+(i+1)+'</b></div>';
}
function dialRender(){
  const el=$("#dialGame"); if(!el||!DIAL.open) return;
  const k=DIAL.k, a=dialArr(k), v=a[DIAL.i], rg=dialRange(k,v), std=IPC_STD[k].std, f3=x=>x.toFixed(3);
  const tabs=DIAL_SIDE[DIAL.side].map((q,j)=>'<button class="dgTab'+(q===k?" on":"")+'" data-k="'+q+'">'+(DIAL_SIDE[DIAL.side].length>1?(j+1)+" · ":"")+IPC_STD[q].nm+(dialOK(q)?" ✓":"")+'</button>').join("");
  el.innerHTML='<div class="dgBox"><div class="dgHead"><b>🔧 함량조절다이얼 · 충전량 조절</b><span>'+(DIAL.side==="F"?"서쪽(전면) · 첨가제":"동쪽(후면) · 주성분 · 백당")+'</span><button class="dgX" id="dgX">닫기 (F · Esc)</button></div>'+
    '<div class="dgTabs">'+tabs+'</div>'+
    '<div class="dgMain"><div class="dgBig" id="dgBig">'+dialScene()+'</div><div class="dgInfo">'+
      '<div class="dgPred '+dialCls(v)+'" id="dgPred">예상 충전량<b>'+f3(rg[0])+' ~ '+f3(rg[1])+' g</b><s>기준 '+f3(std)+' g</s></div>'+
      '<div class="dgKeys"><span>A</span> 감소 · <span>D</span> 증가 (누르고 있으면 계속)<br><span>←</span><span>→</span> 노즐 선택'+(DIAL_SIDE[DIAL.side].length>1?' · <span>1</span><span>2</span> 원료':'')+'</div>'+
      '<div class="dgNote">예상값은 대략적인 범위입니다. 조절 후 공정검사(IPC) 계량으로 확인합니다.</div></div></div>'+
    '<div class="dgRow">'+a.map((x,i)=>dialMini(k,x,i)).join("")+'</div>'+
    '<div class="dgFoot" id="dgFoot">'+dialFoot(k,a)+'</div></div>';
  $("#dgX").onclick=dialClose;
  $$("#dialGame [data-k]").forEach(b=>b.onclick=()=>{ DIAL.k=b.dataset.k; dialSnap(); dialRender(); });
  $$("#dialGame [data-i]").forEach(b=>b.onclick=()=>{ DIAL.i=+b.dataset.i; dialSnap(); dialRender(); });
}
const dialFoot=(k,a)=>dialOK(k)?'<span class="okT">✓ '+IPC_STD[k].nm+' 10개 노즐 모두 기준 ±2 % 이내</span>':'<span>'+IPC_STD[k].nm+' : 기준 ±2 % 를 벗어난 노즐 '+a.filter(x=>Math.abs(x)>DIAL.ok+1e-9).length+' 개</span>';
function dialSnap(){ DIAL.disp=dialArr(DIAL.k)[DIAL.i]; DIAL.rot=DIAL.disp/DIAL.step*24; }
/* 애니메이션 : 카운터 숫자가 굴러가고 렌치가 돌아감 */
function dialLoop(){
  if(!DIAL.open) return;
  const a=dialArr(DIAL.k), v=a[DIAL.i], tr=v/DIAL.step*24;
  const moving=Math.abs(DIAL.disp-v)>1e-6||Math.abs(DIAL.rot-tr)>.05||DIAL.shake>0;
  if(moving){ DIAL.disp+=(v-DIAL.disp)*.35; DIAL.rot+=(tr-DIAL.rot)*.35; if(Math.abs(DIAL.disp-v)<2e-5) DIAL.disp=v; DIAL.shake=Math.max(0,DIAL.shake-.08);
    const b=$("#dgBig"); if(b) b.innerHTML=dialScene(); }
  DIAL.raf=requestAnimationFrame(dialLoop);
}
function dialKey(e){
  if(!DIAL.open) return;
  const c=e.code, side=DIAL_SIDE[DIAL.side];
  if(c==="KeyA"||c==="KeyD"){ const a=dialArr(DIAL.k), v=a[DIAL.i], nv=clamp(v+(c==="KeyD"?1:-1)*DIAL.step,-DIAL.max,DIAL.max);
    if(nv===v){ DIAL.shake=1; beep(160,.05,"square",.02); } else { dialSet(DIAL.k,DIAL.i,Math.round(nv/DIAL.step)*DIAL.step); beep(1500,.012,"square",.012); }
    e.preventDefault(); e.stopPropagation();
    const k=DIAL.k, x=dialArr(k)[DIAL.i], rg=dialRange(k,x), P=$("#dgPred"), cell=$('#dialGame [data-i="'+DIAL.i+'"]');
    if(P){ P.className="dgPred "+dialCls(x); P.querySelector("b").textContent=rg[0].toFixed(3)+" ~ "+rg[1].toFixed(3)+" g"; }
    if(cell) cell.outerHTML=dialMini(k,x,DIAL.i); const idx=DIAL.i, nc=$('#dialGame [data-i="'+idx+'"]'); if(nc) nc.onclick=()=>{ DIAL.i=idx; dialSnap(); dialRender(); };
    const F=$("#dgFoot"); if(F) F.innerHTML=dialFoot(k,dialArr(k));
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
function dialInit(){ addEventListener("keydown",dialKey,true); }
/* 자재 타일 : 충전량 조절 (3인칭 — 작업자가 2층 데크 조절부로 이동한 뒤 미니게임) */
TILE.mDial={e:"🔧",b:"충전량 조절 (함량조절다이얼)",s:()=>S&&S.f&&["add","main","sug"].every(dialOK)?"30노즐 기준 이내":"조절 필요",on:()=>!!(S&&S.f&&["add","main","sug"].every(dialOK)),
  click(){ const bad=["main","sug"].some(q=>!dialOK(q))&&dialOK("add"); bad?startWork("dialB",()=>dialOpen("B")):startWork("dialF",()=>dialOpen("F")); }};
if(!TILESET.F.mat.includes("mDial")) TILESET.F.mat.splice(TILESET.F.mat.indexOf("mScoop")+1,0,"mDial");
