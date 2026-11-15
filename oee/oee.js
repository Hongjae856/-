/* ═══════════════════════════════════════════════════════════════════
   OEE 연계 교육 — 공통 모듈 (파우치 IDT 먼저 적용 → 병 · PTP IDT 로 확대 예정, SCENARIO.md 11절)
   흐름 : ① OEE 데이터 불러오기 → ② 부동 트렌드 분석(부동시간 · 발생 빈도 순위) → ③ 원인별 맞춤 교육 추천 → 3D 실습 → ④ 교육 후 효과
   데이터 : 포장2팀 OEE 대시보드의 Google Sheets DB (getDashboardData 와 같은 항목)
     { dateText, line, prodName, lotNo, oee, avail, perf, yieldRate, totalDown(분), reason(자유 기재), reasonCode(부동 유형 · 신규), countermeasure }
   · 실제 실적 값은 이 파일 · 저장소에 넣지 않는다. 불러온 값은 브라우저 메모리에만 두고, 사용자가 켠 경우에만 이 브라우저에 저장한다.
   · IDT 별 설정(라인 이름 · 부동 유형 목록 · 실습 시작 방법)은 OEEEDU.init(cfg) 로 넘긴다.
   ═══════════════════════════════════════════════════════════════════ */
const OEEEDU=(function(){
  const LS={url:"oeeedu.url", keep:"oeeedu.keep", data:"oeeedu.data", log:"oeeedu.log"};
  const st={cfg:null, rows:[], src:"", demo:false, tab:"data", from:"", to:"", line:"", practice:null, msg:""};
  const $o=s=>document.querySelector(s), esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const lsGet=k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } }, lsSet=(k,v)=>{ try{ v==null?localStorage.removeItem(k):localStorage.setItem(k,v); }catch(e){} };
  const pct=v=>{ v=Number(v); if(!isFinite(v)) return null; return v<=1.5?v*100:v; };
  const dateOf=t=>{ const m=String(t||"").match(/(\d{4})[-.\/년\s]+(\d{1,2})[-.\/월\s]+(\d{1,2})/); return m?m[1]+"-"+m[2].padStart(2,"0")+"-"+m[3].padStart(2,"0"):""; };
  const today=()=>{ const d=new Date(Date.now()+9*3600e3); return d.toISOString().slice(0,10); };
  /* 자유 기재 사유 → 부동 유형 (코드가 없는 기존 기록용 · 낱말 일치) */
  function classify(text){ const t=String(text||""); if(!t.trim()) return []; const hit=[]; for(const c of st.cfg.codes){ if(c.kw&&c.kw.some(k=>new RegExp(k,"i").test(t))) hit.push(c.k); } return hit.length?hit:["ETC"]; }
  function normalize(list){
    const out=[]; for(const r of list||[]){ if(!r) continue; const date=dateOf(r.dateText||r.date), down=Number(r.totalDown)||0;
      let codes=String(r.reasonCode||"").split(/[,;\/\s]+/).map(s=>s.trim().toUpperCase()).filter(Boolean), auto=false;
      if(!codes.length){ codes=down>0||String(r.reason||"").trim()?classify(r.reason):[]; auto=codes.length>0; }
      out.push({date, line:String(r.line||""), prod:String(r.prodName||""), lot:String(r.lotNo||""), oee:pct(r.oee), avail:pct(r.avail), perf:pct(r.perf), yld:pct(r.yieldRate), down, reason:String(r.reason||""), codes, auto, cm:String(r.countermeasure||"")}); }
    return out.filter(r=>r.date);
  }
  /* 표 붙여넣기(시트에서 복사 · 첫 줄 = 항목 이름) 또는 JSON */
  const HEAD={dateText:/날짜|일자|작업일|date/i, line:/라인|line/i, prodName:/제품|품목|prod/i, lotNo:/lot|제조번호/i, oee:/^oee|종합/i, avail:/시간\s*가동|avail/i, perf:/성능|perf/i, yieldRate:/수율|양품|yield/i, totalDown:/부동\s*시간|비계획|down/i, reasonCode:/부동\s*유형|사유\s*코드|reasoncode/i, reason:/사유|reason/i, countermeasure:/대책|counter/i};
  function parseText(txt){
    const t=String(txt||"").trim(); if(!t) throw new Error("내용이 비어 있습니다.");
    if(t[0]==="["||t[0]==="{"){ const j=JSON.parse(t); return Array.isArray(j)?j:(j.data||j.rows||[]); }
    const lines=t.split(/\r?\n/).filter(l=>l.trim()), sep=lines[0].includes("\t")?"\t":",", head=lines[0].split(sep).map(s=>s.trim()), map=[];
    head.forEach((h,i)=>{ for(const k in HEAD){ if(HEAD[k].test(h)&&!map.includes(k)){ map[i]=k; break; } } });
    if(!map.includes("dateText")||!map.includes("line")) throw new Error("첫 줄에서 '날짜' · '라인' 항목을 찾지 못했습니다.");
    return lines.slice(1).map(l=>{ const c=l.split(sep), o={}; map.forEach((k,i)=>{ if(k) o[k]=(c[i]||"").trim(); }); return o; });
  }
  function setRows(raw,src,demo){ st.rows=normalize(raw); st.src=src; st.demo=!!demo; const ds=st.rows.map(r=>r.date).sort(); st.from=(ds[0]||"").slice(0,7); st.to=(ds[ds.length-1]||"").slice(0,7); st.line=st.cfg.line;
    if(!demo&&lsGet(LS.keep)==="1") lsSet(LS.data,JSON.stringify(raw)); }
  /* 예시 데이터 : 화면 확인용 (실제 실적 아님 — 규칙으로 만든 값) */
  function demoData(){ const C=st.cfg.codes.filter(c=>c.k!=="ETC"), out=[]; let seed=11; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
    for(let m=0;m<6;m++) for(let i=0;i<7;i++){ const d=new Date(Date.UTC(2026,4+m,2+i*4)), w=rnd(), c=C[Math.floor(Math.pow(rnd(),2.2)*C.length)], has=w<.62, down=has?Math.round(10+rnd()*70):0, av=100-down/4.8, pf=90+rnd()*9, yl=97+rnd()*2.5;
      out.push({dateText:d.toISOString().slice(0,10), line:st.cfg.line, prodName:"예시품목", lotNo:"EX"+String(m*7+i+1).padStart(3,"0"), avail:av, perf:pf, yieldRate:yl, oee:av*pf*yl/1e4, totalDown:down, reason:has?c.nm+" (예시)":"", reasonCode:has?c.k:"", countermeasure:""}); }
    return out; }
  /* ── 분석 ── */
  function view(){ return st.rows.filter(r=>(!st.line||r.line===st.line)&&(!st.from||r.date.slice(0,7)>=st.from)&&(!st.to||r.date.slice(0,7)<=st.to)); }
  function byCode(rows){ const M={}; for(const r of rows){ if(!r.codes.length) continue; const share=r.down/r.codes.length; for(const k of r.codes){ const o=M[k]||(M[k]={k,down:0,n:0,auto:0,months:{}}); o.down+=share; o.n++; if(r.auto) o.auto++; const mo=r.date.slice(0,7); o.months[mo]=(o.months[mo]||0)+share; } }
    return Object.values(M).sort((a,b)=>b.down-a.down||b.n-a.n); }
  const avg=(rows,f)=>{ const v=rows.map(r=>r[f]).filter(x=>x!=null); return v.length?v.reduce((a,b)=>a+b,0)/v.length:null; };
  const codeOf=k=>st.cfg.codes.find(c=>c.k===k)||{k,nm:k==="ETC"?"기타 · 미분류":k};
  const f1=v=>v==null?"-":v.toFixed(1);
  /* ── 화면 ── */
  function open(){ let w=$o("#oeeWrap"); if(!w){ w=document.createElement("div"); w.id="oeeWrap"; (st.cfg.mount||document.body).appendChild(w); w.addEventListener("click",onClick); w.addEventListener("change",onChange); } w.classList.add("on"); render(); }
  function close(){ const w=$o("#oeeWrap"); if(w) w.classList.remove("on"); }
  function render(){
    const w=$o("#oeeWrap"); if(!w||!w.classList.contains("on")) return; const tabs=[["data","① 데이터"],["trend","② 부동 트렌드"],["edu","③ 맞춤 교육"],["effect","④ 교육 효과"]];
    w.innerHTML='<div class="oeeBox"><div class="oeeHead"><b>OEE 연계 교육 <small>'+esc(st.cfg.title||"")+'</small></b><div class="oeeTabs">'+tabs.map(([k,t])=>'<button data-tab="'+k+'" class="'+(st.tab===k?"on":"")+'">'+t+'</button>').join("")+'</div><button data-act="close" class="oeeX">닫기</button></div>'+
      (st.demo?'<div class="oeeDemo">예시 데이터로 표시 중입니다 — 실제 실적이 아닙니다.</div>':'')+(st.msg?'<div class="oeeMsg">'+esc(st.msg)+'</div>':'')+'<div class="oeeBody">'+({data:tabData,trend:tabTrend,edu:tabEdu,effect:tabEffect}[st.tab]())+'</div></div>'; st.msg="";
  }
  function filterBar(){ const lines=[...new Set(st.rows.map(r=>r.line))].sort(), months=[...new Set(st.rows.map(r=>r.date.slice(0,7)))].sort(), op=(l,v)=>l.map(x=>'<option'+(x===v?" selected":"")+'>'+esc(x)+'</option>').join("");
    return '<div class="oeeFilter">라인 <select data-f="line"><option value="">전체</option>'+op(lines,st.line)+'</select> 기간 <select data-f="from">'+op(months,st.from)+'</select> ~ <select data-f="to">'+op(months,st.to)+'</select><span>'+view().length+' 건</span></div>'; }
  function need(){ return '<p class="oeeEmpty">먼저 [① 데이터] 에서 OEE 데이터를 불러오세요.</p>'; }
  function tabData(){
    return '<div class="oeeCols"><div><h3>1. 주소로 불러오기</h3><p>Apps Script 에 추가한 읽기 전용 주소(JSON)를 입력합니다. 사내 네트워크 · 권한에 따라 막힐 수 있습니다.</p><input id="oeeUrl" placeholder="https://script.google.com/macros/s/…/exec" value="'+esc(lsGet(LS.url)||"")+'"><button data-act="fetch">불러오기</button>'+
      '<h3>2. 붙여넣기</h3><p>시트에서 복사한 표(첫 줄 = 항목 이름) 또는 JSON 을 붙여 넣습니다.</p><textarea id="oeeText" placeholder="날짜	라인	제품명	LOT	OEE	시간가동률	성능가동률	수율	부동시간	부동유형	부동사유	대책"></textarea><button data-act="paste">적용</button>'+
      '<h3>3. 예시 데이터</h3><p>화면 확인용으로 규칙에 따라 만든 값입니다 (실제 실적 아님).</p><button data-act="demo">예시 데이터로 보기</button>'+
      '<p class="oeeKeep"><label><input type="checkbox" id="oeeKeep"'+(lsGet(LS.keep)==="1"?" checked":"")+'> 불러온 데이터를 이 브라우저에 저장 (끄면 닫을 때 사라짐)</label></p></div>'+
      '<div><h3>현재 데이터</h3>'+(st.rows.length?'<p>'+esc(st.src)+' · '+st.rows.length+' 건 · '+esc(st.rows.map(r=>r.date).sort()[0])+' ~ '+esc(st.rows.map(r=>r.date).sort().pop())+'</p>'+
        '<p>부동 유형 코드 입력 '+st.rows.filter(r=>r.codes.length&&!r.auto).length+' 건 · 자유 기재를 낱말로 분류 '+st.rows.filter(r=>r.auto).length+' 건 (이 중 미분류 '+st.rows.filter(r=>r.auto&&r.codes.includes("ETC")).length+' 건)</p>':'<p class="oeeEmpty">불러온 데이터가 없습니다.</p>')+
      '<h3>부동 유형 코드 ('+esc(st.cfg.line)+')</h3><table class="oeeT"><tr><th>코드</th><th>부동 유형</th><th>IDT 실습</th></tr>'+st.cfg.codes.map(c=>'<tr><td>'+c.k+'</td><td>'+esc(c.nm)+'</td><td>'+(c.inc?esc(c.roomNm||""):"-")+'</td></tr>').join("")+'</table></div></div>';
  }
  function tabTrend(){
    if(!st.rows.length) return need(); const rows=view(), list=byCode(rows), tot=list.reduce((a,o)=>a+o.down,0), mx=Math.max(1,...list.map(o=>o.down)), mn=Math.max(1,...list.map(o=>o.n)), withDown=rows.filter(r=>r.down>0).length;
    const months=[...new Set(rows.map(r=>r.date.slice(0,7)))].sort(), mTot=months.map(m=>rows.filter(r=>r.date.slice(0,7)===m).reduce((a,r)=>a+r.down,0)), mM=Math.max(1,...mTot);
    return filterBar()+'<div class="oeeKpi">'+[["평균 OEE",f1(avg(rows,"oee"))+" %"],["시간가동률",f1(avg(rows,"avail"))+" %"],["성능가동률",f1(avg(rows,"perf"))+" %"],["수율",f1(avg(rows,"yld"))+" %"],["부동시간 합계",Math.round(rows.reduce((a,r)=>a+r.down,0))+" 분"],["부동 발생",withDown+" / "+rows.length+" 건"]].map(([a,b])=>'<div><s>'+a+'</s><b>'+b+'</b></div>').join("")+'</div><p class="oeeNote">※ 비율은 기록별 값의 단순 평균 · 한 기록에 유형이 여럿이면 부동시간을 똑같이 나눔</p>'+
      '<div class="oeeCols"><div><h3>부동 유형 순위 (부동시간)</h3>'+(list.length?'<table class="oeeT"><tr><th>순위</th><th>부동 유형</th><th>부동시간</th><th>비중</th><th>발생</th></tr>'+list.map((o,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(codeOf(o.k).nm)+(o.auto?' <i title="자유 기재를 낱말로 분류">*</i>':'')+'</td><td><div class="oeeBar"><span style="width:'+(o.down/mx*100).toFixed(0)+'%"></span><em>'+Math.round(o.down)+' 분</em></div></td><td>'+(tot?(o.down/tot*100).toFixed(0):0)+' %</td><td><div class="oeeBar n"><span style="width:'+(o.n/mn*100).toFixed(0)+'%"></span><em>'+o.n+' 회</em></div></td></tr>').join("")+'</table><p class="oeeNote">* 표시 = 자유 기재 사유를 낱말로 분류한 기록 포함 (정확도 확인 필요)</p>':'<p class="oeeEmpty">이 기간에 부동 기록이 없습니다.</p>')+'</div>'+
      '<div><h3>월별 부동시간</h3><div class="oeeMon">'+months.map((m,i)=>'<div><span style="height:'+(mTot[i]/mM*100).toFixed(0)+'%"></span><em>'+Math.round(mTot[i])+'</em><s>'+m.slice(2)+'</s></div>').join("")+'</div></div></div>';
  }
  function tabEdu(){
    if(!st.rows.length) return need(); const rows=view(), list=byCode(rows).filter(o=>codeOf(o.k).inc), tot=byCode(rows).reduce((a,o)=>a+o.down,0), log=getLog();
    if(!list.length) return filterBar()+'<p class="oeeEmpty">IDT 실습과 연결된 부동 유형이 이 기간에 없습니다.</p>';
    return filterBar()+'<p>부동시간이 큰 순서로 IDT 실습을 추천합니다. 실습을 끝내면 [④ 교육 효과] 에 기록됩니다.</p><div class="oeeCards">'+list.slice(0,6).map((o,i)=>{ const c=codeOf(o.k), done=log.filter(l=>l.k===o.k).length;
      return '<div class="oeeCard"><div class="rk">'+(i+1)+'</div><h4>'+esc(c.nm)+'<small>'+esc(c.roomNm||"")+'</small></h4><p class="why">선정 근거 : 부동시간 '+Math.round(o.down)+' 분 ('+(tot?(o.down/tot*100).toFixed(0):0)+' %) · '+o.n+' 회 발생</p><p>학습 목표 : '+esc(c.goal||"발생 원인을 판단하고 정해진 순서로 조치한 뒤 재가동을 확인한다.")+'</p><ol>'+(c.steps||["설비 정지 · 알람 확인","원인 판단","현장 조치","재가동 · 정상 확인"]).map(s=>'<li>'+esc(s)+'</li>').join("")+'</ol><div class="ft"><span>'+(done?"실습 "+done+" 회 완료":"실습 기록 없음")+'</span><button data-act="start" data-k="'+o.k+'">3D 실습 시작</button></div></div>'; }).join("")+'</div>';
  }
  function tabEffect(){
    if(!st.rows.length) return need(); const log=getLog(); if(!log.length) return '<p class="oeeEmpty">아직 완료한 실습이 없습니다. [③ 맞춤 교육] 에서 실습을 시작하세요.</p>';
    const rows=st.rows.filter(r=>!st.cfg.line||r.line===st.cfg.line), first={}; for(const l of log) if(!first[l.k]||l.d<first[l.k]) first[l.k]=l.d;
    const stat=(rs,k)=>{ const hit=rs.filter(r=>r.codes.includes(k)); return {n:rs.length, hit:hit.length, down:hit.reduce((a,r)=>a+r.down/r.codes.length,0), oee:avg(rs,"oee")}; };
    return '<p>첫 실습일을 기준으로 같은 부동 유형의 교육 전 · 후를 비교합니다 (라인 : '+esc(st.cfg.line)+').</p><table class="oeeT"><tr><th>부동 유형</th><th>첫 실습일</th><th>실습</th><th>구분</th><th>기록 수</th><th>발생</th><th>기록당 부동시간</th><th>평균 OEE</th></tr>'+Object.keys(first).map(k=>{ const d=first[k], b=stat(rows.filter(r=>r.date<d),k), a=stat(rows.filter(r=>r.date>=d),k), cell=s=>s.n?'<td>'+s.n+'</td><td>'+s.hit+' 회</td><td>'+(s.down/s.n).toFixed(1)+' 분</td><td>'+f1(s.oee)+' %</td>':'<td colspan="4" class="oeeEmpty">데이터 없음</td>';
      return '<tr><td rowspan="2">'+esc(codeOf(k).nm)+'</td><td rowspan="2">'+d+'</td><td rowspan="2">'+log.filter(l=>l.k===k).length+' 회</td><td>교육 전</td>'+cell(b)+'</tr><tr><td>교육 후</td>'+cell(a)+'</tr>'; }).join("")+'</table><p class="oeeNote">※ 교육 후 기록이 쌓여야 비교할 수 있습니다. 다른 요인(품목 · 설비 정비 등)의 영향은 구분하지 않습니다.</p><button data-act="clearLog">실습 기록 지우기</button>';
  }
  const getLog=()=>{ try{ return JSON.parse(lsGet(LS.log)||"[]"); }catch(e){ return []; } };
  function onChange(e){ const f=e.target.dataset&&e.target.dataset.f; if(f){ st[f]=e.target.value; render(); } if(e.target.id==="oeeKeep"){ lsSet(LS.keep,e.target.checked?"1":null); if(!e.target.checked) lsSet(LS.data,null); } }
  function onClick(e){ const b=e.target.closest("button"); if(!b) return; if(b.dataset.tab){ st.tab=b.dataset.tab; render(); return; } const a=b.dataset.act;
    if(a==="close") close();
    else if(a==="demo"){ setRows(demoData(),"예시 데이터",true); st.tab="trend"; render(); }
    else if(a==="paste"){ try{ setRows(parseText($o("#oeeText").value),"붙여넣기",false); st.tab="trend"; }catch(err){ st.msg="붙여넣기 실패 : "+err.message; } render(); }
    else if(a==="fetch"){ const u=$o("#oeeUrl").value.trim(); if(!u){ st.msg="주소를 입력하세요."; render(); return; } lsSet(LS.url,u); st.msg="불러오는 중…"; render();
      fetch(u,{redirect:"follow"}).then(r=>{ if(!r.ok) throw new Error("응답 "+r.status); return r.text(); }).then(t=>{ setRows(parseText(t),"주소에서 불러옴",false); st.tab="trend"; render(); }).catch(err=>{ st.msg="불러오기 실패 : "+err.message+" — 네트워크 · 권한을 확인하거나 붙여넣기를 사용하세요."; render(); }); }
    else if(a==="start"){ const c=codeOf(b.dataset.k); st.practice={k:c.k, seen:false, at:Date.now()}; close(); try{ st.cfg.start(c); }catch(err){ console.error(err); } }
    else if(a==="clearLog"){ lsSet(LS.log,null); render(); } }
  /* 실습 완료 감지 : cfg.active() 가 참이 되었다가 거짓으로 돌아오면 기록 */
  function tick(){ const p=st.practice; if(!p||!st.cfg.active) return; const on=!!st.cfg.active(p.k); if(on) p.seen=true; else if(p.seen){ const log=getLog(); log.push({k:p.k,d:today()}); lsSet(LS.log,JSON.stringify(log)); st.practice=null; if(st.cfg.done) st.cfg.done(codeOf(p.k)); } else if(Date.now()-p.at>120000) st.practice=null; }
  function init(cfg){ st.cfg=cfg; st.line=cfg.line; if(lsGet(LS.keep)==="1"){ try{ const d=JSON.parse(lsGet(LS.data)||"null"); if(d) setRows(d,"이 브라우저에 저장된 데이터",false); }catch(e){} } setInterval(tick,500); }
  return {init,open,close,state:st,_parse:parseText,_norm:normalize,_byCode:byCode};
})();
