/* ═══════════════════════════════════════════════════════════════════
   상단 바 공통 (11/18 사용자 지시 "하드웨어 외에는 파우치 기준") — PTP · 병 셸
   · 파우치 상단 바처럼 한 줄 : 배속 ×1 ×2 ×5 ×10 · 🖥 그래픽(최고 · 상 · 중 · 하 · 자동, 처음 = 최고) · 사운드 · 메인화면 · 채점 관리 · 학습 종료 · 처음부터
   · 원본 앱 머리 줄(#head)은 숨기고, 버튼은 지금 작업장 앱의 같은 버튼을 눌러 줌
   · tbInit({ wins:()=>[앱 window…], cur:()=>지금 작업장 앱 window|null, ids:{snd,end,rub}, speed(s), end(), rubric(), restart(), extra:"html", R:()=>렌더러, lights:()=>[그림자 광원] })
   ═══════════════════════════════════════════════════════════════════ */
const TBQ={mode:"ultra", lv:"ultra", L:{ultra:{q:1.3,sh:true,sm:4096}, high:{q:1,sh:true,sm:2048}, mid:{q:.78,sh:true,sm:1024}, low:{q:.58,sh:false,sm:512}}, ema:1/60, slow:0, fast:0, spd:1, o:null};
const tbPR=()=>Math.min(2,(devicePixelRatio||1)*TBQ.L[TBQ.lv].q);
function tbGq(lv){ TBQ.lv=lv; const L=TBQ.L[lv], o=TBQ.o; if(!o) return; try{ const R=o.R&&o.R(); if(R) R.shadowMap.enabled=L.sh;
    for(const l of (o.lights&&o.lights())||[]){ l.castShadow=L.sh; if(l.shadow&&l.shadow.mapSize.x!==L.sm){ l.shadow.mapSize.set(L.sm,L.sm); if(l.shadow.map){ l.shadow.map.dispose(); l.shadow.map=null; } } }
    const sc=o.scene&&o.scene(); if(sc) sc.traverse(m=>{ if(m.material&&!Array.isArray(m.material)) m.material.needsUpdate=true; }); }catch(e){ console.error("그래픽",e); } }
function tbGqSet(mode){ TBQ.mode=mode; TBQ.slow=TBQ.fast=0; tbGq(mode==="auto"?TBQ.lv:mode); const s=document.getElementById("gqSel"); if(s&&s.value!==mode) s.value=mode; }
/* 자동 : 3 초 넘게 느리면 한 단계 내리고, 8 초 넘게 넉넉하면 한 단계 올림 (파우치와 같음) */
function tbTick(dt){ TBQ.ema+=(dt-TBQ.ema)*.05; if(TBQ.mode!=="auto") return; const order=["low","mid","high","ultra"], i=order.indexOf(TBQ.lv);
  if(TBQ.ema>1/28){ TBQ.slow+=dt; TBQ.fast=0; } else if(TBQ.ema<1/52){ TBQ.fast+=dt; TBQ.slow=0; } else { TBQ.slow=Math.max(0,TBQ.slow-dt); TBQ.fast=Math.max(0,TBQ.fast-dt); }
  if(TBQ.slow>3&&i>0){ tbGq(order[i-1]); TBQ.slow=0; TBQ.ema=1/45; } else if(TBQ.fast>8&&i<3){ tbGq(order[i+1]); TBQ.fast=0; } }
function tbAppCss(w){ try{ const d=w.document; if(d.getElementById("tbCss")) return; const st=d.createElement("style"); st.id="tbCss"; st.textContent="#head{display:none!important}"; d.head.appendChild(st); }catch(e){} }
function tbClick(w,id){ try{ const b=w&&w.document.getElementById(id); if(b){ b.click(); return true; } }catch(e){} return false; }
function tbInit(o){
  TBQ.o=o; const bar=document.getElementById("bar"), home=document.getElementById("homeBtn");
  const st=document.createElement("style");
  st.textContent="#tbGrp{display:flex;align-items:center;gap:4px;margin-left:auto}#tbGrp .pill{display:flex;align-items:center;gap:2px;border:1px solid #c9d4e0;border-radius:10px;padding:2px 4px;font:700 12px 'Malgun Gothic',sans-serif;color:#5d7086}"+
    "#tbGrp .pill button{border:0;background:none;border-radius:7px;padding:3px 6px;font:800 13px 'Malgun Gothic',sans-serif;cursor:pointer;color:#33475e}#tbGrp .pill button.on{background:#173a63;color:#fff}"+
    "#tbGrp>button,#tbGrp>label{border:1px solid #c9d4e0;border-radius:10px;background:#fff;padding:5px 8px;font:700 12.5px 'Malgun Gothic',sans-serif;color:#33475e;cursor:pointer;white-space:nowrap}#tbGrp select{border:0;font:800 13px 'Malgun Gothic',sans-serif;background:none}"+
    "#tbGrp b.v{min-width:22px;text-align:center;font:800 13px 'Malgun Gothic',sans-serif;color:#173a63}#info{display:none}#crewSw,#crewSw button,#fpBtn{flex-shrink:0;white-space:nowrap}#tbGrp{flex-shrink:1;min-width:0}body:has(#splash:not(.hide)) #bar{display:none}body:has(#splash:not(.hide)) #stage{top:0}";
  document.head.appendChild(st);
  const g=document.createElement("div"); g.id="tbGrp";
  g.innerHTML=(o.extra||"")+'<span class="pill" id="tbSpd">배속 '+[1,2,5,10].map(s=>'<button data-s="'+s+'"'+(s===1?' class="on"':'')+'>×'+s+'</button>').join("")+'</span>'+
    '<label title="그래픽 품질">🖥 그래픽 <select id="gqSel"><option value="ultra">최고</option><option value="high">상</option><option value="mid">중</option><option value="low">하</option><option value="auto">자동</option></select></label>'+
    '<button id="tbSnd">사운드 OFF</button>';
  bar.insertBefore(g,home||null); if(home) g.appendChild(home);
  g.insertAdjacentHTML("beforeend",'<button id="tbRub">채점 관리</button><button id="tbEnd">학습 종료</button><button id="tbRst">처음부터</button>');
  g.querySelectorAll("#tbSpd [data-s]").forEach(b=>b.onclick=()=>{ TBQ.spd=+b.dataset.s; g.querySelectorAll("#tbSpd [data-s]").forEach(x=>x.classList.toggle("on",x===b)); o.speed&&o.speed(TBQ.spd); });
  const s=document.getElementById("gqSel"); s.value=TBQ.mode; s.onchange=()=>tbGqSet(s.value);
  document.getElementById("tbSnd").onclick=()=>{ for(const w of o.wins()) tbClick(w,o.ids.snd); tbSync(); };
  document.getElementById("tbRub").onclick=()=>{ if(o.rubric&&o.rubric()) return; tbClick(o.cur(),"rubricBtn"); };
  document.getElementById("tbEnd").onclick=()=>{ if(o.end&&o.end()) return; tbClick(o.cur(),o.ids.end); };
  document.getElementById("tbRst").onclick=()=>{ if(confirm("진행상황을 지우고 처음부터 다시 시작할까요?")) o.restart&&o.restart(); };
  for(const w of o.wins()) tbAppCss(w);
  setInterval(tbSync,600); tbGqSet(TBQ.mode);
}
/* 사운드 버튼 글자 · 앱 머리 줄 숨김 · 앱 배속을 셸 값으로 유지 */
function tbSync(){ const o=TBQ.o; if(!o) return; let t=null; for(const w of o.wins()){ tbAppCss(w); try{ const b=w.document.getElementById(o.ids.snd); if(b&&t==null) t=b.textContent; }catch(e){} }
  const b=document.getElementById("tbSnd"); if(b&&t) b.textContent=t; o.sync&&o.sync(); }
/* 3인칭 시점 버튼 (파우치 3D 보기 위 버튼과 같은 방식) : tbViews({orbit:()=>궤도 객체, isOrbit:()=>bool, rect:()=>캔버스 DOMRect(셸 기준), presets:[[이름, {yaw,pitch,dist,tx,ty,tz}]…]}) */
function tbViews(o){
  const st=document.createElement("style");
  st.textContent="#tbView{position:absolute;z-index:6;display:flex;gap:3px;flex-wrap:wrap;padding:4px;border-radius:10px;background:#ffffffe0;border:1px solid #c9d4e0;font:700 12px 'Malgun Gothic',sans-serif}"+
    "#tbView button{border:0;border-radius:7px;background:none;padding:4px 9px;font:700 12.5px 'Malgun Gothic',sans-serif;color:#33475e;cursor:pointer}#tbView button.on{background:#173a63;color:#fff}#tbView i{width:1px;background:#c9d4e0;margin:2px 3px}";
  document.head.appendChild(st);
  const v=document.createElement("div"); v.id="tbView"; document.getElementById("stage").appendChild(v);
  v.innerHTML=o.presets.map((p,i)=>'<button data-i="'+i+'">'+p[0]+'</button>').join("")+'<i></i><button data-sh="1" class="on">그림자</button>';
  const T={k:null};
  v.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{ const P=o.presets[+b.dataset.i][1]; T.k={from:Object.assign({},o.orbit()),to:P,t:0}; v.querySelectorAll("[data-i]").forEach(x=>x.classList.toggle("on",x===b)); });
  v.querySelector("[data-sh]").onclick=e=>{ const b=e.currentTarget, on=!b.classList.contains("on"); b.classList.toggle("on",on); TBQ.shOff=!on; tbGq(TBQ.lv); };
  const _g=tbGq; tbGq=function(lv){ _g(lv); if(TBQ.shOff&&TBQ.o){ try{ const R=TBQ.o.R&&TBQ.o.R(); if(R) R.shadowMap.enabled=false; }catch(e){} } };
  (function tick(){ requestAnimationFrame(tick); const show=o.isOrbit(); v.hidden=!show; if(!show) return; const r=o.rect(); if(r&&r.width>50){ v.style.left=(r.left+10)+"px"; v.style.top=(r.top+10)+"px"; v.style.maxWidth=(r.width-20)+"px"; }
    if(T.k){ T.k.t=Math.min(1,T.k.t+.04); const u=T.k.t*T.k.t*(3-2*T.k.t), O=o.orbit(); for(const key in T.k.to){ let a=T.k.from[key], b=T.k.to[key]; if(key==="yaw"){ let d=b-a; d=Math.atan2(Math.sin(d),Math.cos(d)); b=a+d; } O[key]=a+(b-a)*u; } if(T.k.t>=1) T.k=null; } })();
}
