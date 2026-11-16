/* ═══════════════════════════════════════════════════════════════════
   OEE 관리 대시보드 — 공통 모듈 (파우치 IDT 먼저 적용 → 병 · PTP IDT 로 확대 예정, SCENARIO.md 11절)
   흐름 : ① 데이터 연결(Google Drive 시트 → IDT DB) → ② 부동 트렌드(부동시간 · 발생 빈도 순위) → ③ 교육 효과(이상사례 대처 교육 기록)
   데이터 : 포장2팀 OEE 대시보드의 Google Sheets DB (getDashboardData 와 같은 항목)
     { dateText, line, prodName, lotNo, oee, avail, perf, yieldRate, totalDown(분), reason(자유 기재), reasonCode(부동 유형 · 신규), countermeasure }
   연결 방식 (11/16 V7)
     · Google Drive 커넥터(아티팩트 mcp 기능)로 보는 사람의 Drive 권한으로 시트를 xlsx 로 내려받아 읽음 (SheetJS · cdnjs)
     · 읽은 값은 IDT DB(아티팩트 db 기능 : oee/meta + oee_rows/c0…)에 저장 → Drive 연결이 없는 사람도 마지막 동기화 값을 봄
     · 대시보드를 열 때 마지막 동기화가 30 분보다 오래됐으면 Drive 에서 다시 읽음 (쓰기 권한이 있는 사람만 DB 갱신)
     · 아티팩트 밖(파일로 연 경우)에서는 붙여넣기 · 예시 데이터만 사용
   · 실제 실적 값은 이 파일 · 저장소 · 게시 페이지 본문에 넣지 않는다 (DB 에만 저장).
   ═══════════════════════════════════════════════════════════════════ */
const OEEEDU=(function(){
  const LS={keep:"oeeedu.keep", data:"oeeedu.data", log:"oeeedu.log"};
  const XLSX_URL="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js", XLSX_MIME="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const DRIVE="Google Drive", STALE=30*60e3, CHUNK=350;
  const st={cfg:null, rows:[], src:"", demo:false, tab:"data", from:"", to:"", line:"", msg:"", busy:"", files:null, meta:null, dbState:"none", canWrite:null, dbLog:[], autoTried:false};
  const cap={db:null, user:null, mcp:null, uid:null};
  const $o=s=>document.querySelector(s), esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const lsGet=k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } }, lsSet=(k,v)=>{ try{ v==null?localStorage.removeItem(k):localStorage.setItem(k,v); }catch(e){} };
  const pct=v=>{ if(v===""||v==null) return null; v=Number(String(v).replace("%","").trim()); if(!isFinite(v)) return null; return v<=1.5?v*100:v; };
  const dateOf=t=>{ const m=String(t||"").match(/(\d{4})[-.\/년\s]+(\d{1,2})[-.\/월\s]+(\d{1,2})/); return m?m[1]+"-"+m[2].padStart(2,"0")+"-"+m[3].padStart(2,"0"):""; };
  const today=()=>new Date(Date.now()+9*3600e3).toISOString().slice(0,10);
  const kst=ms=>{ if(!ms) return "-"; const d=new Date(ms+9*3600e3).toISOString(); return d.slice(0,10)+" "+d.slice(11,16); };
  /* 자유 기재 사유 → 부동 유형 (코드가 없는 기존 기록용 · 낱말 일치) */
  function classify(text){ const t=String(text||""); if(!t.trim()) return []; const hit=[]; for(const c of st.cfg.codes){ if(c.kw&&c.kw.some(k=>new RegExp(k,"i").test(t))) hit.push(c.k); } return hit.length?hit:["ETC"]; }
  function normalize(list){
    const out=[]; for(const r of list||[]){ if(!r) continue; const date=dateOf(r.dateText||r.date), down=Number(r.totalDown)||0;
      let codes=String(r.reasonCode||"").split(/[,;\/\s]+/).map(s=>s.trim().toUpperCase()).filter(Boolean), auto=false;
      if(!codes.length){ codes=down>0||String(r.reason||"").trim()?classify(r.reason):[]; auto=codes.length>0; }
      out.push({date, line:String(r.line||""), prod:String(r.prodName||""), lot:String(r.lotNo||""), oee:pct(r.oee), avail:pct(r.avail), perf:pct(r.perf), yld:pct(r.yieldRate), down, reason:String(r.reason||""), codes, auto, cm:String(r.countermeasure||"")}); }
    return out.filter(r=>r.date);
  }
  /* 항목 이름 인식 (시트 머리줄 · 붙여넣기 공용) */
  const HEAD={dateText:/날짜|일자|작업일|작업\s*기간|date/i, line:/라인|line/i, prodName:/제품|품목|prod/i, lotNo:/lot|제조번호/i, oee:/^oee|종합/i, avail:/시간\s*가동|avail/i, perf:/성능|perf/i, yieldRate:/수율|양품|yield/i, totalDown:/부동\s*시간|비계획|down/i, reasonCode:/부동\s*유형|사유\s*코드|reasoncode/i, reason:/사유|reason/i, countermeasure:/대책|counter/i};
  function headMap(head){ const map=[]; head.forEach((h,i)=>{ h=String(h==null?"":h).trim(); for(const k in HEAD){ if(HEAD[k].test(h)&&!map.includes(k)){ map[i]=k; break; } } }); return map; }
  const cellTxt=v=>v instanceof Date?new Date(v.getTime()-v.getTimezoneOffset()*6e4).toISOString().slice(0,10):v;
  function fromTable(rows,fallbackLine){
    let hi=rows.findIndex(r=>{ const m=headMap(r); return m.includes("dateText")&&(m.includes("line")||m.includes("oee")); }); if(hi<0) return [];
    const map=headMap(rows[hi]);
    return rows.slice(hi+1).filter(r=>r.some(c=>String(c).trim())).map(c=>{ const o={}; map.forEach((k,i)=>{ if(k) o[k]=cellTxt(c[i]); }); if(!o.line) o.line=fallbackLine||""; return o; });
  }
  function parseText(txt){
    const t=String(txt||"").trim(); if(!t) throw new Error("내용이 비어 있습니다.");
    if(t[0]==="["||t[0]==="{"){ const j=JSON.parse(t); return Array.isArray(j)?j:(j.data||j.rows||[]); }
    const lines=t.split(/\r?\n/).filter(l=>l.trim()), sep=lines[0].includes("\t")?"\t":",";
    const out=fromTable(lines.map(l=>l.split(sep).map(s=>s.trim())));
    if(!out.length) throw new Error("머리줄에서 '작업기간(날짜)' · '포장라인' 항목을 찾지 못했습니다.");
    return out;
  }
  function setRows(raw,src,demo){ st.rows=normalize(raw); st.src=src; st.demo=!!demo; const ds=st.rows.map(r=>r.date).sort(); st.from=(ds[0]||"").slice(0,7); st.to=(ds[ds.length-1]||"").slice(0,7);
    const ls=[...new Set(st.rows.map(r=>r.line))]; st.line=ls.find(l=>l.includes(st.cfg.line))||""; }
  /* 예시 데이터 : 화면 확인용 (실제 실적 아님 — 규칙으로 만든 값) */
  function demoData(){ const C=st.cfg.codes.filter(c=>c.k!=="ETC"), out=[]; let seed=11; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
    for(let m=0;m<6;m++) for(let i=0;i<7;i++){ const d=new Date(Date.UTC(2026,4+m,2+i*4)), w=rnd(), c=C[Math.floor(Math.pow(rnd(),2.2)*C.length)], has=w<.62, down=has?Math.round(10+rnd()*70):0, av=100-down/4.8, pf=90+rnd()*9, yl=97+rnd()*2.5;
      out.push({dateText:d.toISOString().slice(0,10), line:st.cfg.line, prodName:"예시품목", lotNo:"EX"+String(m*7+i+1).padStart(3,"0"), avail:av, perf:pf, yieldRate:yl, oee:av*pf*yl/1e4, totalDown:down, reason:has?c.nm+" (예시)":"", reasonCode:has?c.k:"", countermeasure:""}); }
    return out; }

  /* ── 아티팩트 기능 (db · user · mcp) ── */
  async function capsInit(){
    const C=window.claude; if(!C||typeof C.use!=="function") return;
    const use=n=>C.use(n).catch(()=>null);
    [cap.db,cap.user,cap.mcp]=await Promise.all([use("db"),use("user"),use("mcp")]);
    if(cap.user){ try{ st.canWrite=await cap.user.can("data.write"); }catch(e){} try{ cap.uid=await cap.user.id(); }catch(e){} }
    if(cap.db) dbLoad(); render();
  }
  async function dbLoad(){
    st.dbState="loading"; render(); const timer=setTimeout(()=>{ if(st.dbState==="loading"){ st.dbState="timeout"; render(); } },10000);
    try{
      const m=await cap.db.doc("oee/meta").get(); st.meta=m.exists?m.data():null;
      if(st.meta&&!st.demo&&(!st.rows.length||st.src.startsWith("IDT DB"))){
        const parts=[]; for(let i=0;i<(st.meta.chunks||0);i++){ const d=await cap.db.doc("oee_rows/c"+i).get(); if(d.exists) parts.push(...(d.data().rows||[])); }
        setRows(parts,"IDT DB ("+(st.meta.fileName||"시트")+" · "+kst(st.meta.syncedAt)+" 동기화)",false);
      }
      st.dbState="ok";
      cap.db.collection("edu_log").onSnapshot(q=>{ st.dbLog=[]; q.docs.forEach(d=>{ const v=d.data(); if(v&&Array.isArray(v.list)) st.dbLog.push(...v.list); }); render(); }, ()=>{});
    }catch(e){ st.dbState="error"; console.warn("db",e); }
    clearTimeout(timer); render(); autoSync();
  }
  async function dbSave(raw,file,sheets){
    if(!cap.db||st.canWrite===false) return "skip";
    const n=Math.ceil(raw.length/CHUNK), old=(st.meta&&st.meta.chunks)||0;
    for(let i=0;i<n;i++) await cap.db.doc("oee_rows/c"+i).set({rows:raw.slice(i*CHUNK,(i+1)*CHUNK)});
    const meta={fileId:file.id||"", url:file.url||"", fileName:file.title||"", syncedAt:Date.now(), sheets, n:raw.length, chunks:n};
    await cap.db.doc("oee/meta").set(meta); st.meta=meta;
    for(let i=n;i<old;i++){ try{ await cap.db.doc("oee_rows/c"+i).delete(); }catch(e){} }
    return "ok";
  }
  /* ── Google Drive ── */
  const ERR={needs_reauth:"Google Drive 연결 인증이 만료되었습니다. claude.ai 설정 › 커넥터에서 Google Drive 를 다시 연결하세요.",
    server_not_connected:"Google Drive 커넥터가 연결되어 있지 않습니다. claude.ai 설정 › 커넥터에서 연결하세요.", server_not_found:"Google Drive 커넥터를 찾지 못했습니다.",
    not_granted:"이 페이지의 Google Drive 사용을 허용하지 않았습니다 (아티팩트 권한 메뉴에서 바꿀 수 있음).", consent_required:"Google Drive 사용 동의가 필요합니다.", approval_required:"Google Drive 호출 승인이 필요합니다.",
    blocked_by_policy:"조직 정책으로 Google Drive 호출이 막혀 있습니다.", tool_error:"Drive 에서 파일을 읽지 못했습니다 (파일 권한 · 파일 ID 확인).",
    rate_limited:"요청이 많습니다. 잠시 뒤 다시 시도하세요.", server_unavailable:"Drive 서버가 응답하지 않습니다. 잠시 뒤 다시 시도하세요.", upstream_error:"Drive 응답 오류입니다. 잠시 뒤 다시 시도하세요."};
  const errMsg=e=>(e&&ERR[e.code])||("오류 : "+((e&&(e.message||e.code))||e));
  function textOf(r){ return (r&&r.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n"); }
  function jsonOf(r){ if(r&&r.payload&&typeof r.payload==="object") return r.payload; try{ return JSON.parse(textOf(r)); }catch(e){ return null; } }
  function b64Of(r){ const B64=/^[A-Za-z0-9+/=\r\n]{200,}$/; let hit=null;
    const walk=o=>{ if(hit||o==null) return; if(typeof o==="string"){ if(B64.test(o)) hit=o; return; } if(typeof o!=="object") return; for(const k of ["blob","data","content","base64","fileContent"]) if(typeof o[k]==="string"&&B64.test(o[k])){ hit=o[k]; return; } for(const k in o) walk(o[k]); };
    walk(r&&r.content); if(!hit) walk(r&&r.payload); return hit; }
  async function driveSearch(word){
    const q="mimeType = 'application/vnd.google-apps.spreadsheet' and title contains '"+String(word||"OEE").replace(/['\\]/g,"\\$&")+"'";
    const r=await cap.mcp.callTool(DRIVE,"search_files",{query:q, excludeContentSnippets:true, pageSize:20, orderBy:"modifiedTime desc"});
    const j=jsonOf(r); return (j&&j.files||[]).map(f=>({id:f.id, title:f.title||f.name||f.id, modified:f.modifiedTime||""}));
  }
  let xlsxP=null;
  function loadXlsx(){ if(window.XLSX) return Promise.resolve(window.XLSX); if(!xlsxP) xlsxP=new Promise((ok,no)=>{ const s=document.createElement("script"); s.src=XLSX_URL; s.onload=()=>window.XLSX?ok(window.XLSX):no(new Error("SheetJS 로드 실패")); s.onerror=()=>{ xlsxP=null; no(new Error("SheetJS(cdnjs) 를 불러오지 못했습니다")); }; document.head.appendChild(s); }); return xlsxP; }
  /* 이 IDT 라인(cfg.line)만 저장 (11/16 사용자 결정 : 파우치 IDT 는 파우치 시트 · 행만) */
  const mine=(rows,sheet)=>rows.filter(r=>String(r.line||"").includes(st.cfg.line)||(!String(r.line||"").trim()&&String(sheet||"").includes(st.cfg.line)));
  async function driveRead(file){
    const r=await cap.mcp.callTool(DRIVE,"download_file_content",{fileId:file.id, exportMimeType:XLSX_MIME});
    const b64=b64Of(r); if(!b64) throw new Error("내려받은 내용에서 시트 파일을 찾지 못했습니다.");
    const X=await loadXlsx(), wb=X.read(b64.replace(/\s/g,""),{type:"base64", cellDates:true});
    const raw=[], sheets=[];
    for(const nm of wb.SheetNames){ const rows=X.utils.sheet_to_json(wb.Sheets[nm],{header:1, raw:true, defval:""}), got=mine(fromTable(rows,nm),nm); if(got.length){ raw.push(...got); sheets.push(nm); } }
    if(!raw.length) throw new Error("'"+st.cfg.line+"' 시트 · 행을 찾지 못했습니다 (머리줄 '작업기간' · '포장라인' 확인).");
    return {raw, sheets};
  }
  async function sync(file,quiet){
    if(!cap.mcp){ st.msg="이 화면에서는 Google Drive 연결을 쓸 수 없습니다 (claude.ai 아티팩트로 열어야 함)."; render(); return; }
    st.busy="Drive 에서 '"+(file.title||"시트")+"' 읽는 중…"; render();
    try{
      const {raw,sheets}=await driveRead(file);
      setRows(raw,"Google Drive · "+(file.title||"")+" ("+kst(Date.now())+" 읽음)",false);
      let saved="skip"; try{ saved=await dbSave(raw,file,sheets); }catch(e){ saved="fail"; console.warn("db save",e); }
      st.msg=raw.length+" 건 읽음 ("+sheets.join(" · ")+") — "+(saved==="ok"?"IDT DB 에 저장했습니다.":saved==="fail"?"IDT DB 저장은 권한이 없어 건너뜀 (화면에만 표시).":"IDT DB 를 쓸 수 없어 화면에만 표시합니다.");
      if(!quiet) st.tab="trend";
    }catch(e){ st.msg="Drive 읽기 실패 — "+errMsg(e)+(st.rows.length?" (기존 데이터 유지)":""); console.warn("drive",e); }
    st.busy=""; render();
  }
  /* ── Apps Script 주소 (대시보드 doGet 에 ?format=json 출력 추가 필요 · pouch-idt/OEE_LINK.md 3-1) ── */
  function jsonUrl(u){ u=String(u||"").trim(); if(!/^https:\/\/script\.google(usercontent)?\.com\//.test(u)) throw new Error("Apps Script 웹 앱 주소(https://script.google.com/macros/s/…/exec)를 넣으세요."); return /[?&]format=json/.test(u)?u:u+(u.includes("?")?"&":"?")+"format=json"; }
  async function syncUrl(u,quiet){
    st.busy="Apps Script 주소에서 읽는 중…"; render();
    try{
      const url=jsonUrl(u); let res;
      try{ res=await fetch(url,{redirect:"follow",credentials:"omit"}); }catch(e){ st.blocked=true; if(cap.mcp&&!st.files) driveSearch("OEE").then(f=>{ st.files=f; render(); }).catch(()=>{}); throw new Error("연결이 막혔습니다 (claude.ai 아티팩트는 외부 주소 호출을 막음). 위 [1. Google Drive 시트 연결] 목록에서 OEE 시트의 [이 시트 연결] 을 누르세요."); }
      if(!res.ok) throw new Error("응답 "+res.status);
      const txt=await res.text(); if(/^\s*</.test(txt)) throw new Error("JSON 대신 웹 화면이 왔습니다. doGet 에 format=json 출력이 추가 · 재배포되었는지, 웹 앱 액세스 권한이 '모든 사용자' 인지 확인하세요.");
      const raw=mine(parseText(txt)); if(!raw.length) throw new Error("'"+st.cfg.line+"' 라인 데이터가 0 건입니다.");
      setRows(raw,"Apps Script ("+kst(Date.now())+" 읽음)",false);
      let saved="skip"; try{ saved=await dbSave(raw,{url:u,title:"Apps Script 주소"},["Apps Script"]); }catch(e){ saved="fail"; console.warn("db save",e); }
      st.msg=raw.length+" 건 읽음 — "+(saved==="ok"?"IDT DB 에 저장했습니다. 이후 대시보드를 열 때 30 분이 지났으면 자동으로 다시 읽습니다.":saved==="fail"?"IDT DB 저장은 권한이 없어 건너뜀 (화면에만 표시).":"IDT DB 를 쓸 수 없어 화면에만 표시합니다.");
      try{ localStorage.setItem("oeeedu.url",u); }catch(e){}
      if(!quiet) st.tab="trend";
    }catch(e){ st.msg="Apps Script 읽기 실패 — "+e.message+(st.rows.length?" (기존 데이터 유지)":""); console.warn("url",e); }
    st.busy=""; render();
  }
  function autoSync(){ if(st.autoTried||!st.meta||st.demo) return; if(!$o("#oeeWrap.on")) return; if(Date.now()-(st.meta.syncedAt||0)<STALE) return;
    if(st.meta.url){ st.autoTried=true; syncUrl(st.meta.url,true); }
    else if(cap.mcp&&st.meta.fileId){ st.autoTried=true; sync({id:st.meta.fileId, title:st.meta.fileName},true); } }

  /* ── 분석 ── */
  function view(){ return st.rows.filter(r=>(!st.line||r.line===st.line)&&(!st.from||r.date.slice(0,7)>=st.from)&&(!st.to||r.date.slice(0,7)<=st.to)); }
  function byCode(rows){ const M={}; for(const r of rows){ if(!r.codes.length) continue; const share=r.down/r.codes.length; for(const k of r.codes){ const o=M[k]||(M[k]={k,down:0,n:0,auto:0,months:{}}); o.down+=share; o.n++; if(r.auto) o.auto++; const mo=r.date.slice(0,7); o.months[mo]=(o.months[mo]||0)+share; } }
    return Object.values(M).sort((a,b)=>b.down-a.down||b.n-a.n); }
  /* 이 IDT 라인의 부동 유형별 누적 (이상사례 대처 교육 우선순위용) */
  function codeStats(){ const rows=st.rows.filter(r=>r.line.includes(st.cfg.line)), o={}; for(const c of byCode(rows)) o[c.k]={down:c.down, n:c.n}; return o; }
  const avg=(rows,f)=>{ const v=rows.map(r=>r[f]).filter(x=>x!=null); return v.length?v.reduce((a,b)=>a+b,0)/v.length:null; };
  const codeOf=k=>st.cfg.codes.find(c=>c.k===k)||{k,nm:k==="ETC"?"기타 · 미분류":k};
  const f1=v=>v==null?"-":v.toFixed(1);
  /* ── 실습 기록 (이상사례 대처 교육) : IDT DB edu_log/<사용자> + 이 브라우저 ── */
  const localLog=()=>{ try{ return JSON.parse(lsGet(LS.log)||"[]"); }catch(e){ return []; } };
  const getLog=()=>st.dbLog.concat(localLog());
  async function logPractice(e){
    const ent=Object.assign({d:today(), t:Date.now()},e);
    if(cap.db&&cap.uid){ try{ const ref=cap.db.doc("edu_log/"+cap.uid), s=await ref.get(), list=(s.exists&&s.data().list)||[]; list.push(ent); await ref.set({list:list.slice(-1500)}); return; }catch(err){ console.warn("log db",err); } }
    const l=localLog(); l.push(ent); lsSet(LS.log,JSON.stringify(l.slice(-1500)));
  }
  /* ── 연동 표시등 (메인화면 구석) : 초록 = Drive 시트 또는 IDT DB 의 실제 데이터 연결, 빨강 = 미연결 ── */
  function lamp(){ const el=$o("#oeeLamp"); if(!el) return; const M=st.meta, live=!st.demo&&(st.src.startsWith("Google Drive")||st.src.startsWith("IDT DB")||st.src.startsWith("Apps Script"));
    el.className=live?"on":"off";
    el.title=live?"OEE 연동됨 — "+(M?"마지막 동기화 "+kst(M.syncedAt)+" · "+(M.fileName||"")+" · "+(M.n||st.rows.length)+" 건":st.src):"OEE 미연동 — "+({none:"아티팩트 밖에서는 IDT DB · Drive 를 쓸 수 없음",loading:"IDT DB 확인 중",timeout:"IDT DB 응답 지연",error:"IDT DB 읽기 실패",ok:"저장된 OEE 데이터 없음 ([OEE › OEE 관리 대시보드 › ① 데이터 연결])"}[st.dbState]||"");
    el.querySelector("span").textContent=live?"OEE 연동":"OEE 미연동"; }
  /* ── 화면 ── */
  function open(){ let w=$o("#oeeWrap"); if(!w){ w=document.createElement("div"); w.id="oeeWrap"; (st.cfg.mount||document.body).appendChild(w); w.addEventListener("click",onClick); w.addEventListener("change",onChange); } w.classList.add("on"); render(); autoSync(); }
  function close(){ const w=$o("#oeeWrap"); if(w) w.classList.remove("on"); }
  function render(){
    lamp(); const w=$o("#oeeWrap"); if(!w||!w.classList.contains("on")) return; const tabs=[["data","① 데이터 연결"],["trend","② 부동 트렌드"],["effect","③ 교육 효과"]];
    const keep=$o("#oeeText")?$o("#oeeText").value:"", kw=$o("#oeeKw")?$o("#oeeKw").value:null; const uv=$o("#oeeUrl")?$o("#oeeUrl").value:null;
    w.innerHTML='<div class="oeeBox"><div class="oeeHead"><b>OEE 관리 대시보드 <small>'+esc(st.cfg.title||"")+'</small></b><div class="oeeTabs">'+tabs.map(([k,t])=>'<button data-tab="'+k+'" class="'+(st.tab===k?"on":"")+'">'+t+'</button>').join("")+'</div><button data-act="close" class="oeeX">닫기</button></div>'+
      (st.demo?'<div class="oeeDemo">예시 데이터로 표시 중입니다 — 실제 실적이 아닙니다.</div>':'')+(st.busy?'<div class="oeeMsg">⏳ '+esc(st.busy)+'</div>':'')+(st.msg?'<div class="oeeMsg">'+esc(st.msg)+'</div>':'')+'<div class="oeeBody">'+({data:tabData,trend:tabTrend,effect:tabEffect}[st.tab]())+'</div></div>';
    if($o("#oeeText")) $o("#oeeText").value=keep; if(kw!=null&&$o("#oeeKw")) $o("#oeeKw").value=kw; if(uv!=null&&$o("#oeeUrl")) $o("#oeeUrl").value=uv;
  }
  function filterBar(){ const lines=[...new Set(st.rows.map(r=>r.line))].sort(), months=[...new Set(st.rows.map(r=>r.date.slice(0,7)))].sort(), op=(l,v)=>l.map(x=>'<option'+(x===v?" selected":"")+'>'+esc(x)+'</option>').join("");
    return '<div class="oeeFilter">라인 <select data-f="line"><option value="">전체</option>'+op(lines,st.line)+'</select> 기간 <select data-f="from">'+op(months,st.from)+'</select> ~ <select data-f="to">'+op(months,st.to)+'</select><span>'+view().length+' 건</span></div>'; }
  function need(){ return '<p class="oeeEmpty">먼저 [① 데이터 연결] 에서 OEE 데이터를 연결하세요.</p>'; }
  function tabData(){
    const M=st.meta, dbTxt={none:"이 화면에서는 IDT DB 를 쓸 수 없습니다 (claude.ai 아티팩트로 열면 사용).",loading:"IDT DB 읽는 중…",timeout:"IDT DB 응답이 늦습니다.",error:"IDT DB 를 읽지 못했습니다.",ok:M?"마지막 동기화 "+kst(M.syncedAt)+" · "+esc(M.fileName||"")+" · "+(M.n||0)+" 건 ("+esc((M.sheets||[]).join(" · "))+")":"아직 저장된 데이터가 없습니다."}[st.dbState];
    const files=st.files?(st.files.length?'<table class="oeeT"><tr><th>시트 파일</th><th>수정</th><th></th></tr>'+st.files.map(f=>'<tr><td>'+esc(f.title)+'</td><td>'+esc(String(f.modified).slice(0,10))+'</td><td><button data-act="pick" data-id="'+esc(f.id)+'" data-t="'+esc(f.title)+'">이 시트 연결</button></td></tr>').join("")+'</table>':'<p class="oeeEmpty">찾은 시트가 없습니다.</p>'):"";
    const savedUrl=(M&&M.url)||lsGet("oeeedu.url")||"";
    return '<div class="oeeCols"><div>'+
      '<h3>1. Google Drive 시트 연결 (권장)</h3><p>보는 사람의 Google Drive 권한으로 OEE 시트를 직접 읽어 IDT DB 에 저장합니다. 연결 후에는 대시보드를 열 때 30 분이 지났으면 자동으로 다시 읽습니다.</p>'+
      (cap.mcp?'<div class="oeeRow"><input id="oeeKw" placeholder="시트 이름 낱말 (예: OEE)" value="OEE"><button data-act="search">Drive 에서 찾기</button></div>'+files+
        (M&&M.fileId?'<p><button data-act="resync">지금 다시 읽기</button> <span class="oeeNote">연결된 시트 : '+esc(M.fileName||M.fileId)+'</span></p>':''):
        '<p class="oeeEmpty">이 화면에서는 Drive 연결을 쓸 수 없습니다. claude.ai 에서 아티팩트로 열고, 설정 › 커넥터에서 Google Drive 를 연결하세요.</p>')+
      '<h3>2. Apps Script 주소 연결</h3><p>대시보드 웹 앱 주소(…/exec)로 읽습니다. <b>claude.ai 아티팩트에서는 외부 주소 호출이 막혀 동작하지 않습니다(11/16 확인)</b> — 파일로 내려받아 연 경우 등에만 사용하세요.</p>'+
      '<div class="oeeRow"><input id="oeeUrl" placeholder="https://script.google.com/macros/s/…/exec" value="'+esc(savedUrl)+'"><button data-act="url">연결</button></div>'+
      (M&&M.url?'<p><button data-act="reurl">지금 다시 읽기</button> <span class="oeeNote">연결된 주소로 마지막 동기화 '+kst(M.syncedAt)+'</span></p>':'')+
      '<h3>3. 붙여넣기 (보조)</h3><p>시트에서 머리줄을 포함해 범위를 복사(Ctrl+C)한 뒤 아래 칸에 붙여 넣습니다 (Ctrl+V). 이 화면에만 표시하며 IDT DB 에는 저장하지 않습니다.</p><textarea id="oeeText" placeholder="작업기간	제조번호(LOT)	포장라인	제품명	…	시간가동률(%)	성능가동률(%)	수율(%)	OEE(%)	부동사유	대책"></textarea><button data-act="paste">적용</button>'+
      '<h3>4. 예시 데이터</h3><p>화면 확인용으로 규칙에 따라 만든 값입니다 (실제 실적 아님).</p><button data-act="demo">예시 데이터로 보기</button></div>'+
      '<div><h3>IDT DB</h3><p>'+dbTxt+'</p>'+(st.canWrite===false?'<p class="oeeNote">※ 이 계정은 IDT DB 를 읽기만 할 수 있습니다. Drive 에서 읽은 값은 화면에만 표시됩니다.</p>':'')+
      '<h3>현재 표시 중</h3>'+(st.rows.length?'<p>'+esc(st.src)+' · '+st.rows.length+' 건 · '+esc(st.rows.map(r=>r.date).sort()[0])+' ~ '+esc(st.rows.map(r=>r.date).sort().pop())+'</p>'+
        '<p>부동 유형 코드 입력 '+st.rows.filter(r=>r.codes.length&&!r.auto).length+' 건 · 자유 기재 사유를 낱말로 분류 '+st.rows.filter(r=>r.auto).length+' 건 (이 중 미분류 '+st.rows.filter(r=>r.auto&&r.codes.includes("ETC")).length+' 건)</p>':'<p class="oeeEmpty">표시 중인 데이터가 없습니다.</p>')+
      '<h3>부동 유형 코드 ('+esc(st.cfg.line)+')</h3><table class="oeeT"><tr><th>코드</th><th>부동 유형</th><th>IDT 실습</th></tr>'+st.cfg.codes.map(c=>'<tr><td>'+c.k+'</td><td>'+esc(c.nm)+'</td><td>'+(c.inc?esc(c.roomNm||""):"-")+'</td></tr>').join("")+'</table></div></div>';
  }
  function tabTrend(){
    if(!st.rows.length) return need(); const rows=view(), list=byCode(rows), tot=list.reduce((a,o)=>a+o.down,0), mx=Math.max(1,...list.map(o=>o.down)), mn=Math.max(1,...list.map(o=>o.n)), withDown=rows.filter(r=>r.down>0).length;
    const months=[...new Set(rows.map(r=>r.date.slice(0,7)))].sort(), mTot=months.map(m=>rows.filter(r=>r.date.slice(0,7)===m).reduce((a,r)=>a+r.down,0)), mM=Math.max(1,...mTot);
    return filterBar()+'<div class="oeeKpi">'+[["평균 OEE",f1(avg(rows,"oee"))+" %"],["시간가동률",f1(avg(rows,"avail"))+" %"],["성능가동률",f1(avg(rows,"perf"))+" %"],["수율",f1(avg(rows,"yld"))+" %"],["부동시간 합계",Math.round(rows.reduce((a,r)=>a+r.down,0))+" 분"],["부동 발생",withDown+" / "+rows.length+" 건"]].map(([a,b])=>'<div><s>'+a+'</s><b>'+b+'</b></div>').join("")+'</div><p class="oeeNote">※ 비율은 기록별 값의 단순 평균 · 한 기록에 유형이 여럿이면 부동시간을 똑같이 나눔</p>'+
      '<div class="oeeCols"><div><h3>부동 유형 순위 (부동시간)</h3>'+(list.length?'<table class="oeeT"><tr><th>순위</th><th>부동 유형</th><th>부동시간</th><th>비중</th><th>발생</th></tr>'+list.map((o,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(codeOf(o.k).nm)+(o.auto?' <i title="자유 기재를 낱말로 분류">*</i>':'')+'</td><td><div class="oeeBar"><span style="width:'+(o.down/mx*100).toFixed(0)+'%"></span><em>'+Math.round(o.down)+' 분</em></div></td><td>'+(tot?(o.down/tot*100).toFixed(0):0)+' %</td><td><div class="oeeBar n"><span style="width:'+(o.n/mn*100).toFixed(0)+'%"></span><em>'+o.n+' 회</em></div></td></tr>').join("")+'</table><p class="oeeNote">* 표시 = 자유 기재 사유를 낱말로 분류한 기록 포함 (정확도 확인 필요)</p>':'<p class="oeeEmpty">이 기간에 부동 기록이 없습니다.</p>')+
      (st.cfg.openInc?'<p><button data-act="inc">이상사례 대처 교육 열기 (이 순위 반영)</button></p>':'')+'</div>'+
      '<div><h3>월별 부동시간</h3><div class="oeeMon">'+months.map((m,i)=>'<div><span style="height:'+(mTot[i]/mM*100).toFixed(0)+'%"></span><em>'+Math.round(mTot[i])+'</em><s>'+m.slice(2)+'</s></div>').join("")+'</div></div></div>';
  }
  function tabEffect(){
    const log=getLog(); if(!log.length) return '<p class="oeeEmpty">아직 완료한 이상사례 대처 교육이 없습니다. 메인화면 [OEE › 이상사례 대처 교육] 에서 학습 · 평가를 진행하세요.</p>';
    const ks=[...new Set(log.map(l=>l.k))], m=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
    let h='<h3>교육 실적</h3><table class="oeeT"><tr><th>상황</th><th>학습</th><th>평가</th><th>평가 평균</th><th>평균 대응 시간</th><th>평균 오답</th><th>최근</th></tr>'+ks.map(k=>{ const L=log.filter(l=>l.k===k), E=L.filter(l=>l.mode==="incExam"&&l.score!=null), T=L.filter(l=>l.ok&&l.sec!=null);
      return '<tr><td>'+esc(codeOf(k).nm)+'</td><td>'+L.filter(l=>l.mode!=="incExam").length+' 회</td><td>'+E.length+' 회</td><td>'+(E.length?m(E.map(l=>l.score)).toFixed(0)+' 점':"-")+'</td><td>'+(T.length?Math.round(m(T.map(l=>l.sec)))+' 초':"-")+'</td><td>'+(L.length?m(L.map(l=>l.wrong||0)).toFixed(1):"-")+'</td><td>'+esc(L.map(l=>l.d).sort().pop())+'</td></tr>'; }).join("")+'</table>';
    if(!st.rows.length) return h+need();
    const rows=st.rows.filter(r=>r.line.includes(st.cfg.line)), first={}; for(const l of log) if(!first[l.k]||l.d<first[l.k]) first[l.k]=l.d;
    const stat=(rs,k)=>{ const hit=rs.filter(r=>r.codes.includes(k)); return {n:rs.length, hit:hit.length, down:hit.reduce((a,r)=>a+r.down/r.codes.length,0), oee:avg(rs,"oee")}; };
    return h+'<h3>교육 전 · 후 부동 비교</h3><p>첫 교육일을 기준으로 같은 부동 유형의 교육 전 · 후를 비교합니다 (라인 : '+esc(st.cfg.line)+').</p><table class="oeeT"><tr><th>부동 유형</th><th>첫 교육일</th><th>구분</th><th>기록 수</th><th>발생</th><th>기록당 부동시간</th><th>평균 OEE</th></tr>'+Object.keys(first).map(k=>{ const d=first[k], b=stat(rows.filter(r=>r.date<d),k), a=stat(rows.filter(r=>r.date>=d),k), cell=s=>s.n?'<td>'+s.n+'</td><td>'+s.hit+' 회</td><td>'+(s.down/s.n).toFixed(1)+' 분</td><td>'+f1(s.oee)+' %</td>':'<td colspan="4" class="oeeEmpty">데이터 없음</td>';
      return '<tr><td rowspan="2">'+esc(codeOf(k).nm)+'</td><td rowspan="2">'+d+'</td><td>교육 전</td>'+cell(b)+'</tr><tr><td>교육 후</td>'+cell(a)+'</tr>'; }).join("")+'</table><p class="oeeNote">※ 교육 후 기록이 쌓여야 비교할 수 있습니다. 다른 요인(품목 · 설비 정비 등)의 영향은 구분하지 않습니다.</p>'+(localLog().length?'<button data-act="clearLog">이 브라우저의 교육 기록 지우기</button>':'');
  }
  function onChange(e){ const f=e.target.dataset&&e.target.dataset.f; if(f){ st[f]=e.target.value; render(); } }
  function onClick(e){ const b=e.target.closest("button"); if(!b) return; if(b.dataset.tab){ st.tab=b.dataset.tab; render(); return; } const a=b.dataset.act;
    if(a==="close") close();
    else if(a==="demo"){ setRows(demoData(),"예시 데이터",true); st.tab="trend"; render(); }
    else if(a==="paste"){ try{ setRows(parseText($o("#oeeText").value),"붙여넣기",false); st.tab="trend"; }catch(err){ st.msg="붙여넣기 실패 : "+err.message; } render(); }
    else if(a==="search"){ const w=($o("#oeeKw")&&$o("#oeeKw").value.trim())||"OEE"; st.busy="Drive 에서 '"+w+"' 시트 찾는 중…"; render();
      driveSearch(w).then(f=>{ st.files=f; }).catch(err=>{ st.msg="Drive 검색 실패 — "+errMsg(err); }).then(()=>{ st.busy=""; render(); }); }
    else if(a==="pick") sync({id:b.dataset.id, title:b.dataset.t});
    else if(a==="url") syncUrl($o("#oeeUrl").value);
    else if(a==="reurl"&&st.meta&&st.meta.url) syncUrl(st.meta.url);
    else if(a==="resync"&&st.meta) sync({id:st.meta.fileId, title:st.meta.fileName});
    else if(a==="inc"){ close(); st.cfg.openInc(); }
    else if(a==="clearLog"){ lsSet(LS.log,null); render(); } }
  function init(cfg){ st.cfg=cfg; st.line=cfg.line; lamp(); capsInit(); }
  return {init,open,close,state:st,codeStats,getLog,logPractice,_parse:parseText,_norm:normalize,_byCode:byCode,_fromTable:fromTable};
})();
