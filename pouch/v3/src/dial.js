/* ═══════════════════════════════════════════════════════════════════
   충전량 조절 미니게임 (11/16 사용자 지시) — 2층 데크 원료조절부를 누르면 10개 노즐 다이얼을 하나씩 돌려 충전량을 맞춤
   · A / D : 선택한 노즐 다이얼을 왼쪽(감소) · 오른쪽(증가)으로 돌림   · ← / → : 노즐 선택   · 1 / 2 : 원료 선택(서쪽 조절부)   · F · Esc : 닫기
   · 노즐마다 대략적인 예상 충전량 표시 (예 : 2.150 ~ 2.200 g) — 초록 = 기준 ±2 % 이내 · 노랑 = ±4 % 이내 · 빨강 = 벗어남
   · 다이얼 값은 공정검사(IPC) 계량값에 노즐별로 반영 (course.js ipcWeigh 패치)
   ═══════════════════════════════════════════════════════════════════ */
const DIAL={open:false, side:"F", k:"main", i:0, onClose:null, max:.10, step:.0025, ok:.02};
const DIAL_SIDE={F:["add","main"], B:["sug"]};             /* 서쪽(F) = 1 첨가제 · 2 주성분 / 동쪽(B) = 3 백당 */
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

function dialOpen(side,onClose){
  if(!S||!S.session||!S.session.active) return;
  DIAL.open=true; DIAL.side=side||"F"; DIAL.k=DIAL_SIDE[DIAL.side].includes(DIAL.k)?DIAL.k:DIAL_SIDE[DIAL.side][DIAL_SIDE[DIAL.side].length-1]; DIAL.onClose=onClose||null;
  if(DIAL.side==="F"&&S.activeTrouble) DIAL.k="main";
  let el=$("#dialGame"); if(!el){ $("#main").insertAdjacentHTML("beforeend",'<div id="dialGame" class="modal"></div>'); el=$("#dialGame"); }
  el.classList.add("on"); if(document.pointerLockElement) document.exitPointerLock();
  dialRender();
}
function dialClose(){
  if(!DIAL.open) return; DIAL.open=false; $("#dialGame").classList.remove("on");
  for(const q of DIAL_SIDE[DIAL.side]){ const r=S.ipc&&S.ipc.res&&S.ipc.res[q]; if(r&&!r.pass&&dialOK(q)) r.stale=true; } if(typeof renderIpc==="function") renderIpc();   /* 조절 후 재측정 */
  const cb=DIAL.onClose; DIAL.onClose=null; try{ cb&&cb(); }catch(e){ console.error(e); }
  renderCoach&&renderCoach(); stepCheck&&stepCheck();
}
function dialSvg(v,big){
  const R=big?92:26, a=v/DIAL.max*135, W=R*2+(big?24:8), c=W/2, arc=(a0,a1,col,w)=>{ const p=t=>{ const r=(t-90)*Math.PI/180; return [c+R*Math.cos(r),c+R*Math.sin(r)]; }, [x0,y0]=p(a0), [x1,y1]=p(a1);
    return '<path d="M'+x0+' '+y0+' A'+R+' '+R+' 0 '+(Math.abs(a1-a0)>180?1:0)+' 1 '+x1+' '+y1+'" stroke="'+col+'" stroke-width="'+w+'" fill="none"/>'; };
  const z=x=>x/DIAL.max*135, sw=big?9:4;
  let s='<svg viewBox="0 0 '+W+' '+W+'" width="'+W+'" height="'+W+'">'+'<circle cx="'+c+'" cy="'+c+'" r="'+(R+(big?8:3))+'" fill="#1d2329"/>'+
    arc(-135,z(-.04),"#c9372c",sw)+arc(z(-.04),z(-DIAL.ok),"#e0a800",sw)+arc(z(-DIAL.ok),z(DIAL.ok),"#22a35a",sw)+arc(z(DIAL.ok),z(.04),"#e0a800",sw)+arc(z(.04),135,"#c9372c",sw);
  if(big) for(let t=-10;t<=10;t+=2){ const r=(z(t/100)-90)*Math.PI/180; s+='<line x1="'+(c+(R-14)*Math.cos(r))+'" y1="'+(c+(R-14)*Math.sin(r))+'" x2="'+(c+(R-5)*Math.cos(r))+'" y2="'+(c+(R-5)*Math.sin(r))+'" stroke="#9aa5ae" stroke-width="2"/>'+
    '<text x="'+(c+(R-28)*Math.cos(r))+'" y="'+(c+(R-28)*Math.sin(r)+4)+'" fill="#cfd6dc" font-size="11" text-anchor="middle">'+(t>0?"+":"")+t+'</text>'; }
  const r=(a-90)*Math.PI/180;
  s+='<circle cx="'+c+'" cy="'+c+'" r="'+(R*.42)+'" fill="#0d1013" stroke="#59646d" stroke-width="2"/>'+
    '<line x1="'+c+'" y1="'+c+'" x2="'+(c+R*.9*Math.cos(r))+'" y2="'+(c+R*.9*Math.sin(r))+'" stroke="#f4f6f7" stroke-width="'+(big?5:2.5)+'" stroke-linecap="round"/>'+
    '<circle cx="'+c+'" cy="'+c+'" r="'+(big?7:3)+'" fill="#f4f6f7"/></svg>';
  return s;
}
function dialRender(){
  const el=$("#dialGame"); if(!el||!DIAL.open) return;
  const k=DIAL.k, a=dialArr(k), v=a[DIAL.i], rg=dialRange(k,v), std=IPC_STD[k].std, f3=x=>x.toFixed(3);
  const tabs=DIAL_SIDE[DIAL.side].map((q,j)=>'<button class="dgTab'+(q===k?" on":"")+'" data-k="'+q+'">'+(DIAL.side==="F"?(j+1)+" · ":"3 · ")+IPC_STD[q].nm+(dialOK(q)?" ✓":"")+'</button>').join("");
  el.innerHTML='<div class="dgBox"><div class="dgHead"><b>🎛️ 원료조절부 · 충전량 조절</b><span>'+(DIAL.side==="F"?"서쪽 조절부":"동쪽 조절부")+'</span><button class="dgX" id="dgX">닫기 (F · Esc)</button></div>'+
    '<div class="dgTabs">'+tabs+'</div>'+
    '<div class="dgMain"><div class="dgBig">'+dialSvg(v,true)+'</div><div class="dgInfo"><div class="dgNz">노즐 <b>'+(DIAL.i+1)+'</b> / 10</div>'+
      '<div class="dgPred '+dialCls(v)+'">예상 충전량<b>'+f3(rg[0])+' ~ '+f3(rg[1])+' g</b></div>'+
      '<div class="dgStd">기준 '+f3(std)+' g · 다이얼 '+(v>=0?"+":"")+(v*100).toFixed(1)+' %</div>'+
      '<div class="dgKeys"><span>A</span> 감소 <span>D</span> 증가 · <span>←</span><span>→</span> 노즐 선택'+(DIAL_SIDE[DIAL.side].length>1?' · <span>1</span><span>2</span> 원료':'')+'</div>'+
      '<div class="dgNote">초록 = 기준 ±2 % 이내 · 노랑 = ±4 % 이내 · 빨강 = 벗어남. 예상값은 대략적인 범위이며 실제는 공정검사(IPC) 계량으로 확인합니다.</div></div></div>'+
    '<div class="dgRow">'+a.map((x,i)=>{ const r=dialRange(k,x); return '<div class="dgCell '+dialCls(x)+(i===DIAL.i?" sel":"")+'" data-i="'+i+'">'+dialSvg(x,false)+'<b>'+(i+1)+'</b><s>'+f3((r[0]+r[1])/2)+'</s></div>'; }).join("")+'</div>'+
    '<div class="dgFoot">'+(dialOK(k)?'<span class="okT">✓ '+IPC_STD[k].nm+' 10개 노즐 모두 기준 ±2 % 이내</span>':'<span>'+IPC_STD[k].nm+' : 범위를 벗어난 노즐 '+a.filter(x=>Math.abs(x)>DIAL.ok+1e-9).length+' 개</span>')+'</div></div>';
  $("#dgX").onclick=dialClose;
  $$("#dialGame [data-k]").forEach(b=>b.onclick=()=>{ DIAL.k=b.dataset.k; dialRender(); });
  $$("#dialGame [data-i]").forEach(b=>b.onclick=()=>{ DIAL.i=+b.dataset.i; dialRender(); });
}
function dialKey(e){
  if(!DIAL.open) return;
  const c=e.code, side=DIAL_SIDE[DIAL.side];
  if(c==="KeyA"||c==="KeyD"){ const a=dialArr(DIAL.k), v=a[DIAL.i], nv=clamp(v+(c==="KeyD"?1:-1)*DIAL.step,-DIAL.max,DIAL.max); dialSet(DIAL.k,DIAL.i,Math.round(nv/DIAL.step)*DIAL.step); beep(nv===v?180:1200,.03,"square",.02); }
  else if(c==="ArrowLeft"||c==="ArrowRight") DIAL.i=clamp(DIAL.i+(c==="ArrowRight"?1:-1),0,9);
  else if((c==="Digit1"||c==="Digit2")&&side.length>1) DIAL.k=side[c==="Digit1"?0:1];
  else if(c==="KeyF"||c==="Escape"){ e.preventDefault(); e.stopPropagation(); dialClose(); return; }
  else return;
  e.preventDefault(); e.stopPropagation(); dialRender();
}
/* 3D 조절 다이얼 회전 (bridge v3Sync) */
function dialDraw(){
  if(typeof FM==="undefined"||!FM.dials||!S||!S.f) return;
  for(const k of ["add","main","sug"]){ const a=S.session&&S.session.active?dialArr(k):null; FM.dials[k].forEach((K,i)=>{ K.rotation.x=(a?a[i]:0)/DIAL.max*2.36*(k==="sug"?-1:1); }); }
}
function dialInit(){ addEventListener("keydown",dialKey,true); }
/* 자재 타일 : 충전량 조절부 (3인칭 — 작업자가 2층 데크 서쪽 조절부로 이동한 뒤 미니게임) */
TILE.mDial={e:"🎛️",b:"충전량 조절부",s:()=>S&&S.f&&["add","main","sug"].every(dialOK)?"10노즐 기준 이내":"조절 필요",on:()=>!!(S&&S.f&&["add","main","sug"].every(dialOK)),click(){ startWork("dialF",()=>dialOpen("F")); }};
if(!TILESET.F.mat.includes("mDial")) TILESET.F.mat.splice(TILESET.F.mat.indexOf("mScoop")+1,0,"mDial");
