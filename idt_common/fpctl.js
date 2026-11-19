/* ═══════════════════════════════════════════════════════════════════
   1인칭 공통 조작 (11/18 사용자 결정 · 세 IDT 통일 — 파우치 기준)
   · 눈높이 1.55 m · 시야각 약 65°(파우치 초점 0.78) · 걷기 1.4 m/s · Shift 2.6 m/s · WASD / 방향키
   · C 앉기(눈높이 약 1.0 m) · F1 힌트(평가는 원본 앱 힌트 −5 점) · Tab 메뉴 · H 도움말
   · 장면 단위 mm (PTP · 병 셸). 파우치는 자체 모듈(pouch/src/fps.js)에서 같은 값을 씀
   ═══════════════════════════════════════════════════════════════════ */
const FPC={EYE:1550, CROUCH:550, WALK:1.4, RUN:2.6, FOCAL:.78, FOV:2*Math.atan(.5/.78)*180/Math.PI, crouch:false, ck:0, help:false,
  isFP:()=>false, hint:null, keys:"", extra:[], toast:null};   /* 장면 단위 mm (파우치는 /1000 해서 씀) · toast : IDT 자체 알림 함수 · extra : IDT 고유 도움말 줄 */
const fpcEye=floor=>(floor||0)+FPC.EYE-FPC.CROUCH*FPC.ck;
const fpcSpeed=k=>(k.ShiftLeft||k.ShiftRight?FPC.RUN:FPC.WALK)*(1-.45*FPC.ck);      /* 앉은 채로는 느리게 */
function fpcTick(dt){ FPC.ck+=((FPC.crouch?1:0)-FPC.ck)*Math.min(1,dt*7); if(!FPC.isFP()&&FPC.help) fpcHelp(false); }
function fpcToast(t){ if(FPC.toast) return FPC.toast(t); let e=document.getElementById("fpcToast"); if(!e){ e=document.createElement("div"); e.id="fpcToast"; document.body.appendChild(e); }
  e.textContent=t; e.hidden=false; clearTimeout(fpcToast.h); fpcToast.h=setTimeout(()=>e.hidden=true,2800); }
function fpcHelp(on){ let e=document.getElementById("fpcHelp"); FPC.help=on==null?!FPC.help:on;
  if(!e){ e=document.createElement("div"); e.id="fpcHelp"; document.body.appendChild(e); }
  e.innerHTML='<b>1인칭 조작</b><table>'+[["W A S D · 방향키","걷기 (1.4 m/s)"],["Shift","빠르게 (2.6 m/s)"],["마우스","둘러보기 (화면 클릭 → 시점 고정, Esc 풀기)"],
    ["E · 클릭","조작 (손 닿는 거리 1.2 m 안)"],["F · Esc","설비 화면에서 뒤로"],["C","앉기 / 일어서기 (눈높이 1.55 ↔ 1.0 m)"],["F1","힌트 (평가 : −5 점)"],["Tab","메뉴 (계속 · 3인칭 전환 · 도움말 · 메인화면)"],["H","이 도움말"]]
    .concat(FPC.keys?[[FPC.keys.split("|")[0],FPC.keys.split("|")[1]]]:[]).concat(FPC.extra||[]).map(r=>'<tr><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>').join("")+'</table><small>H 로 닫기</small>';
  e.hidden=!FPC.help; }
function fpcInit(o){
  Object.assign(FPC,o||{});
  const st=document.createElement("style");
  st.textContent="#fpcToast{position:fixed;left:50%;bottom:64px;transform:translateX(-50%);z-index:60;background:rgba(20,30,40,.88);color:#fff;padding:8px 16px;border-radius:8px;font:14px sans-serif;pointer-events:none}"+
    "#fpcHelp{position:fixed;right:16px;top:64px;z-index:60;background:rgba(255,255,255,.97);border:1px solid #c9d3dc;border-radius:10px;padding:12px 16px;font:13px sans-serif;color:#1d2a36;box-shadow:0 6px 20px rgba(0,0,0,.18)}"+
    "#fpcHelp table{border-collapse:collapse;margin:6px 0}#fpcHelp td{padding:3px 10px 3px 0;vertical-align:top}#fpcHelp td:first-child{font-weight:700;white-space:nowrap}#fpcHelp small{color:#6a7884}"+
    "[hidden]{display:none!important}";
  document.head.appendChild(st);
  addEventListener("keydown",e=>{
    if(!FPC.isFP()) return; if(e.target&&e.target.closest&&e.target.closest("input,textarea,select,[contenteditable=true]")) return;
    if(e.code==="KeyC"&&!e.repeat){ FPC.crouch=!FPC.crouch; fpcToast(FPC.crouch?"앉음 — 눈높이 약 1.0 m (C 로 일어서기)":"일어섬"); }
    else if(e.code==="F1"){ e.preventDefault(); if(!e.repeat&&FPC.hint) FPC.hint(); }
    else if(e.code==="KeyH"&&!e.repeat) fpcHelp();
    else if(e.code==="Tab"){ e.preventDefault(); if(!e.repeat) fpcMenu(); }
  },true);
}
/* Tab 메뉴 (파우치와 같음) : 교육 계속 · 3인칭 전환 · 조작 도움말 · 메인화면 */
function fpcMenu(){ if(document.pointerLockElement) try{ document.exitPointerLock(); }catch(e){}
  let e=document.getElementById("fpcMenu"); if(!e){ e=document.createElement("div"); e.id="fpcMenu"; document.body.appendChild(e);
    const st=document.createElement("style"); st.textContent="#fpcMenu{position:fixed;inset:0;z-index:70;background:#0007;display:flex;align-items:center;justify-content:center}#fpcMenu .b{background:#fff;border-radius:14px;padding:18px 22px;min-width:380px;font:500 14px 'Malgun Gothic',sans-serif;color:#1d2a36}#fpcMenu h2{margin:0 0 6px;font-size:20px}#fpcMenu .r{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:8px 0;border-top:1px solid #e3e8ee}#fpcMenu .r s{display:block;text-decoration:none;color:#6a7884;font-size:12px}#fpcMenu button{border:0;border-radius:9px;background:#173a63;color:#fff;padding:7px 14px;font:700 13px 'Malgun Gothic',sans-serif;cursor:pointer}"; document.head.appendChild(st); }
  e.innerHTML='<div class="b"><h2>⏸ 메뉴</h2><p>1인칭 교육을 잠시 멈췄습니다.</p>'+
    '<div class="r"><b>교육 계속<s>Esc</s></b><button data-a="go">계속</button></div><div class="r"><b>3인칭(전체 보기)으로 전환<s>설비 화면 · 타일을 마우스로 조작</s></b><button data-a="third">전환</button></div>'+
    '<div class="r"><b>조작 도움말<s>H</s></b><button data-a="help">보기</button></div><div class="r"><b>메인화면<s>교육 중단</s></b><button data-a="home">이동</button></div></div>';
  e.hidden=false; const close=()=>{ e.hidden=true; removeEventListener("keydown",esc,true); }, esc=k=>{ if(k.code==="Escape"){ k.preventDefault(); close(); } };
  addEventListener("keydown",esc,true);
  e.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{ const a=b.dataset.a; close(); if(a==="third"&&FPC.third) FPC.third(); else if(a==="help") fpcHelp(true); else if(a==="home"&&FPC.home) FPC.home(); }); }
