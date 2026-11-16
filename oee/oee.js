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
  const st={cfg:null, rows:[], src:"", demo:false, tab:"status", fy:"", fm:"all", fp:"all", from:"", to:"", line:"", msg:"", busy:"", files:null, meta:null, dbState:"none", canWrite:null, dbLog:[], autoTried:false};
  const cap={db:null, user:null, mcp:null, uid:null};
  const $o=s=>document.querySelector(s), esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const lsGet=k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } }, lsSet=(k,v)=>{ try{ v==null?localStorage.removeItem(k):localStorage.setItem(k,v); }catch(e){} };
  const pct=v=>{ if(v===""||v==null) return null; v=Number(String(v).replace("%","").trim()); if(!isFinite(v)) return null; return v<=1.5?v*100:v; };
  const dateOf=t=>{ const m=String(t||"").match(/(\d{4})[-.\/년\s]+(\d{1,2})[-.\/월\s]+(\d{1,2})/); return m?m[1]+"-"+m[2].padStart(2,"0")+"-"+m[3].padStart(2,"0"):""; };
  const today=()=>new Date(Date.now()+9*3600e3).toISOString().slice(0,10);
  const kst=ms=>{ if(!ms) return "-"; const d=new Date(ms+9*3600e3).toISOString(); return d.slice(0,10)+" "+d.slice(11,16); };
  /* 자유 기재 사유 → 부동 유형 (코드가 없는 기존 기록용 · 낱말 일치) */
  function classify(text,one){ const t=String(text||""); if(!t.trim()) return []; const hit=[]; for(const c of st.cfg.codes){ if(c.kw&&c.kw.some(k=>new RegExp(k,"i").test(t))){ hit.push(c.k); if(one) break; } } return hit.length?hit:["ETC"]; }
  /* 사유 글을 항목별로 나눔 : "충전- 컨베어안착불량(20분), 컷팅점검(15분), 포장- 설명서이송불량(5분)" → 항목 · 실(충전/포장) · 분 (11/16 실제 기록 형식) */
  function splitReason(text){ const out=[]; let room=""; for(let s of String(text||"").split(/[,，]/)){ s=s.trim(); if(!s) continue; const m=s.match(/^(충전|포장)\s*[-:·]?\s*/); if(m){ room=m[1]; s=s.slice(m[0].length); }
      const mm=s.match(/\((\d+(?:\.\d+)?)\s*분?\)\s*$/); out.push({text:s.replace(/\((\d+(?:\.\d+)?)\s*분?\)\s*$/,"").trim(), room, min:mm?Number(mm[1]):null}); } return out; }
  function normalize(list){
    const out=[]; for(const r of list||[]){ if(!r) continue; const date=dateOf(r.dateText||r.date), down=Number(r.totalDown)||0;
      let codes=String(r.reasonCode||"").split(/[,;\/\s]+/).map(s=>s.trim().toUpperCase()).filter(Boolean), auto=false;
      let items=null;
      if(!codes.length&&String(r.reason||"").trim()){ items=splitReason(r.reason).map(it=>Object.assign(it,{k:classify((it.room||"")+" "+it.text,true)[0]})); if(items.length&&items.some(it=>it.min!=null)){ const rest=items.filter(it=>it.min==null); const left=Math.max(0,down-items.reduce((a,it)=>a+(it.min||0),0)); for(const it of rest) it.min=rest.length?left/rest.length:0; codes=[...new Set(items.map(it=>it.k))]; auto=true; } else items=null; }
      if(!codes.length){ codes=down>0||String(r.reason||"").trim()?classify(r.reason):[]; auto=codes.length>0; }
      out.push({items,date, dateText:String(r.dateText||""), line:String(r.line||""), prod:String(r.prodName||""), lot:String(r.lotNo||""), oee:pct(r.oee), avail:pct(r.avail), perf:pct(r.perf), yld:pct(r.yieldRate), down, reason:String(r.reason||""), codes, auto, cm:String(r.countermeasure||"")}); }
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
    const ls=[...new Set(st.rows.map(r=>r.line))]; st.line=ls.find(l=>l.includes(st.cfg.line))||""; st.fy=(ds[ds.length-1]||"").slice(0,4); st.fm="all"; st.fp="all"; }
  /* 예시 데이터 : 화면 확인용 (실제 실적 아님 — 규칙으로 만든 값) */
  function demoData(){ const C=st.cfg.codes.filter(c=>c.k!=="ETC"), out=[], LN=["계수기2호","계수기3호","블리스터(흥아)",st.cfg.line]; let seed=11; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
    for(let m=0;m<6;m++) for(let i=0;i<8;i++){ const d=new Date(Date.UTC(2026,4+m,2+i*3)), line=LN[i%4], has=rnd()<.7, its=[]; let down=0;
      if(has){ const n=line===st.cfg.line?1+Math.floor(rnd()*3):1; for(let q=0;q<n;q++){ const c=C[Math.floor(Math.pow(rnd(),1.6)*C.length)], mn=5*(1+Math.floor(rnd()*8)); down+=mn; its.push((line===st.cfg.line?(c.room==="F"?"충전- ":"포장- "):"")+(line===st.cfg.line?c.nm:"설비 정지")+"("+mn+"분)"); } }
      const av=100-down/4.8, pf=60+rnd()*38, yl=90+rnd()*9.5;
      out.push({dateText:d.toISOString().slice(0,10), line, prodName:line===st.cfg.line?"예시 파우치품목":"예시 정제품목", lotNo:"EX"+String(m*8+i+1).padStart(3,"0"), avail:av, perf:pf, yieldRate:yl, oee:av*pf*yl/1e4, totalDown:down, reason:its.join(", "), countermeasure:has?"(예시) 조치 완료":""}); }
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
  async function driveRead(file){
    const r=await cap.mcp.callTool(DRIVE,"download_file_content",{fileId:file.id, exportMimeType:XLSX_MIME});
    const b64=b64Of(r); if(!b64) throw new Error("내려받은 내용에서 시트 파일을 찾지 못했습니다.");
    const X=await loadXlsx(), wb=X.read(b64.replace(/\s/g,""),{type:"base64", cellDates:true});
    const raw=[], sheets=[];
    for(const nm of wb.SheetNames){ const rows=X.utils.sheet_to_json(wb.Sheets[nm],{header:1, raw:true, defval:""}), got=fromTable(rows,nm); if(got.length){ raw.push(...got); sheets.push(nm); } }
    if(!raw.length) throw new Error("시트에서 '작업기간' · '포장라인' 머리줄을 찾지 못했습니다.");
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
      if(!quiet) st.tab="status";
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
      const raw=parseText(txt); if(!raw.length) throw new Error("받은 데이터가 0 건입니다.");
      setRows(raw,"Apps Script ("+kst(Date.now())+" 읽음)",false);
      let saved="skip"; try{ saved=await dbSave(raw,{url:u,title:"Apps Script 주소"},["Apps Script"]); }catch(e){ saved="fail"; console.warn("db save",e); }
      st.msg=raw.length+" 건 읽음 — "+(saved==="ok"?"IDT DB 에 저장했습니다. 이후 대시보드를 열 때 30 분이 지났으면 자동으로 다시 읽습니다.":saved==="fail"?"IDT DB 저장은 권한이 없어 건너뜀 (화면에만 표시).":"IDT DB 를 쓸 수 없어 화면에만 표시합니다.");
      try{ localStorage.setItem("oeeedu.url",u); }catch(e){}
      if(!quiet) st.tab="status";
    }catch(e){ st.msg="Apps Script 읽기 실패 — "+e.message+(st.rows.length?" (기존 데이터 유지)":""); console.warn("url",e); }
    st.busy=""; render();
  }
  function autoSync(){ if(st.autoTried||!st.meta||st.demo) return; if(!$o("#oeeWrap.on")) return; if(Date.now()-(st.meta.syncedAt||0)<STALE) return;
    if(st.meta.url){ st.autoTried=true; syncUrl(st.meta.url,true); }
    else if(cap.mcp&&st.meta.fileId){ st.autoTried=true; sync({id:st.meta.fileId, title:st.meta.fileName},true); } }

  /* ── 분석 ── */
  function view(){ return st.rows.filter(r=>(!st.line||r.line===st.line)&&(!st.from||r.date.slice(0,7)>=st.from)&&(!st.to||r.date.slice(0,7)<=st.to)); }
  const downOf=(r,k)=>r.items?r.items.filter(it=>it.k===k).reduce((a,it)=>a+(it.min||0),0):(r.codes.includes(k)?r.down/r.codes.length:0);
  function byCode(rows){ const M={}; for(const r of rows){ if(!r.codes.length) continue; for(const k of r.codes){ const o=M[k]||(M[k]={k,down:0,n:0,auto:0,months:{}}); const d=downOf(r,k); o.down+=d; o.n+=r.items?r.items.filter(it=>it.k===k).length:1; if(r.auto) o.auto++; const mo=r.date.slice(0,7); o.months[mo]=(o.months[mo]||0)+d; } }
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
    lamp(); const w=$o("#oeeWrap"); if(!w||!w.classList.contains("on")) return; const tabs=[["status","① OEE 현황"],["effect","② 교육 효과"],["data","③ 데이터 연결"]];
    const keep=$o("#oeeText")?$o("#oeeText").value:"", kw=$o("#oeeKw")?$o("#oeeKw").value:null; const uv=$o("#oeeUrl")?$o("#oeeUrl").value:null;
    w.innerHTML='<div class="oeeBox"><div class="oeeHead"><b>OEE 관리 대시보드 <small>'+esc(st.cfg.title||"")+'</small></b><div class="oeeTabs">'+tabs.map(([k,t])=>'<button data-tab="'+k+'" class="'+(st.tab===k?"on":"")+'">'+t+'</button>').join("")+'</div><button data-act="close" class="oeeX">닫기</button></div>'+
      (st.demo?'<div class="oeeDemo">예시 데이터로 표시 중입니다 — 실제 실적이 아닙니다.</div>':'')+(st.busy?'<div class="oeeMsg">⏳ '+esc(st.busy)+'</div>':'')+(st.msg?'<div class="oeeMsg">'+esc(st.msg)+'</div>':'')+'<div class="oeeBody">'+({data:tabData,status:tabStatus,effect:tabEffect}[st.tab]||tabStatus)()+'</div></div>';
    if($o("#oeeText")) $o("#oeeText").value=keep; if(kw!=null&&$o("#oeeKw")) $o("#oeeKw").value=kw; if(uv!=null&&$o("#oeeUrl")) $o("#oeeUrl").value=uv;
  }
  function filterBar(){ const lines=[...new Set(st.rows.map(r=>r.line))].sort(), months=[...new Set(st.rows.map(r=>r.date.slice(0,7)))].sort(), op=(l,v)=>l.map(x=>'<option'+(x===v?" selected":"")+'>'+esc(x)+'</option>').join("");
    return '<div class="oeeFilter">라인 <select data-f="line"><option value="">전체</option>'+op(lines,st.line)+'</select> 기간 <select data-f="from">'+op(months,st.from)+'</select> ~ <select data-f="to">'+op(months,st.to)+'</select><span>'+view().length+' 건</span></div>'; }
  function need(){ return '<p class="oeeEmpty">먼저 [③ 데이터 연결] 에서 OEE 데이터를 연결하세요.</p>'; }
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
  /* ── ① OEE 현황 : 포장2팀 OEE 대시보드와 같은 구성 (11/16 사용자 제공 화면 기준 · 입력 · 대책 수정은 원래 대시보드에서) ──
     상단(총 생산 배치 · 목표 95 %) · 년 · 월 · 제품 필터 · 관리 품목 · KPI 4 · 월별 OEE 트렌드(계수기 · 블리스터 · 파우치) · 라인별 OEE · 제품별 부동 원인 · 대책 게시판 · 데이터 목록
     집계 방식도 같음 : 기록별 값의 단순 평균, 트렌드는 선택 연도 · 제품 기준, 나머지는 연도 · 월 · 제품 기준 */
  const TARGET=95, LINES=["계수기2호","계수기3호","블리스터(흥아)","파우치"];
  const MANAGED=[["병(30T)","록소닌정, 메녹틸정40mg, 아토스타10mg, 클로피정, 암로디핀정5mg"],["PTP","모가프텐트로키"],["파우치","판콜에이치건조시럽"]];
  function svgBars(labels,series,opt){ const W=620,H=250,L=44,R=12,T=26,B=30,iw=W-L-R,ih=H-T-B, y=v=>T+ih*(1-Math.min(120,v)/120), n=labels.length, gw=iw/n, ns=series.length, bw=Math.min(opt&&opt.max||26,gw*.72/ns);
    let s='<svg viewBox="0 0 '+W+' '+H+'" class="odSvg" role="img">';
    for(let v=0;v<=120;v+=20) s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#eef1f4"/><text x="'+(L-6)+'" y="'+(y(v)+4)+'" text-anchor="end" class="odAx">'+v+'%</text>';
    labels.forEach((lb,i)=>{ const cx=L+gw*(i+.5); s+='<text x="'+cx+'" y="'+(H-10)+'" text-anchor="middle" class="odAx">'+esc(lb)+'</text>';
      series.forEach((se,j)=>{ const v=se.vals[i]; if(!(v>0)) return; const x=cx-bw*ns/2+j*bw; s+='<rect x="'+(x+1)+'" y="'+y(v)+'" width="'+(bw-2)+'" height="'+(T+ih-y(v))+'" rx="3" fill="'+se.c+'"/><text x="'+(x+bw/2)+'" y="'+(y(v)-5)+'" text-anchor="middle" class="odVal">'+v.toFixed(1)+'%</text>'; }); });
    s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(TARGET)+'" y2="'+y(TARGET)+'" stroke="#ef4444" stroke-dasharray="5 5" stroke-width="1.5"/></svg>';
    return s+'<div class="odLeg">'+series.map(se=>'<span><i style="background:'+se.c+'"></i>'+esc(se.nm)+'</span>').join("")+'<span><i class="odTg"></i>목표선 ('+TARGET+'%)</span></div>'; }
  function tabStatus(){
    if(!st.rows.length) return need();
    const ym=r=>r.date.slice(0,4), mo=r=>r.date.slice(5,7), years=[...new Set(st.rows.map(ym))].sort(), prods=[...new Set(st.rows.map(r=>r.prod).filter(Boolean))].sort();
    const fy=st.fy||"all", fm=st.fm||"all", fp=st.fp||"all";
    const F=st.rows.filter(r=>(fp==="all"||r.prod===fp)&&(fy==="all"||ym(r)===fy)&&(fm==="all"||mo(r)===fm)).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:a.prod<b.prod?-1:a.prod>b.prod?1:a.lot<b.lot?-1:1);
    const TR=st.rows.filter(r=>(fp==="all"||r.prod===fp)&&(fy==="all"||ym(r)===fy));
    const A=(rs,f)=>{ const v=rs.map(r=>r[f]).filter(x=>x!=null); return v.length?v.reduce((a,b)=>a+b,0)/v.length:0; };
    const op=(list,v,fmt)=>'<option value="all">전체</option>'+list.map(x=>'<option value="'+esc(x)+'"'+(x===v?" selected":"")+'>'+esc(fmt?fmt(x):x)+'</option>').join("");
    const MK=["01","02","03","04","05","06","07","08","09","10","11","12"], grp=[["계수기(2,3호) 평균 OEE","#3b82f6",r=>/계수기/.test(r.line)],["블리스터(흥아) 평균 OEE","#10b981",r=>/블리스터/.test(r.line)],["파우치 평균 OEE","#f59e0b",r=>/파우치/.test(r.line)]];
    const trend=svgBars(MK.map(m=>(+m)+"월"),grp.map(([nm,c,f])=>({nm,c,vals:MK.map(m=>A(TR.filter(r=>f(r)&&mo(r)===m),"oee"))})));
    const lineC=svgBars(LINES,[{nm:"OEE 성과",c:"#3b82f6",vals:LINES.map(l=>A(F.filter(r=>r.line===l),"oee"))}],{max:50});
    let board;
    if(fm!=="all"){ const ty=fy!=="all"?fy+"년 ":"", M={}; for(const r of F){ const rs=r.reason.trim(); if(!rs) continue; const L=M[r.prod]||(M[r.prod]=[]); if(!L.some(c=>c.r===rs)&&L.length<2) L.push({r:rs,c:r.cm.trim()||"대책 미등록"}); }
      const ks=Object.keys(M).sort(); board=ks.length?ks.map(p=>'<div class="odBi"><div class="odBt">'+esc(p)+' <small>('+ty+(+fm)+'월 기준)</small></div>'+M[p].map(c=>'<div class="odBc"><div class="odBx"><b class="w">⚠️ 주요 부동 원인</b>'+esc(c.r)+'</div><div class="odBx"><b class="s">💡 개선 대책 및 피드백</b>'+esc(c.c)+'</div></div>').join("")+'</div>').join(""):'<div class="odNo">해당 월에 등록된 부동 원인이 없습니다.</div>';
    } else board='<div class="odNo">위 필터에서 <b>특정 월</b>을 선택하면<br>해당 월의 부동 원인 및 대책 종합 게시판이 표시됩니다.</div>';
    const rowsH=F.length?F.map(r=>{ const fail=r.oee!=null&&r.oee<TARGET&&r.reason.trim(), oc=r.oee>=TARGET?"#2563eb":fail?"#ef4444":"#f59e0b";
        return '<tr><td class="d">'+esc(r.dateText||r.date)+'</td><td><b>'+esc(r.prod||"-")+'</b></td><td>'+esc(r.lot||"-")+'</td><td><span class="odLn">'+esc(r.line||"-")+'</span></td><td>'+f1(r.avail)+'%</td><td>'+f1(r.perf)+'%</td><td>'+f1(r.yld)+'%</td><td style="color:'+oc+';font-weight:900">'+f1(r.oee)+'%</td><td class="dn">'+(r.down>0?r.down+'분':'-')+'</td><td class="l">'+esc(r.reason)+'</td><td class="l">'+(r.cm?'<span class="odCm">'+esc(r.cm)+'</span>':fail?'<span class="odMu">(미등록)</span>':'<span class="odMu">-</span>')+'</td></tr>'; }).join(""):'<tr><td colspan="11" class="odMu" style="padding:20px">선택한 기간 · 제품에 해당하는 데이터가 없습니다.</td></tr>';
    const P=st.rows.filter(r=>r.line.includes(st.cfg.line)&&(fy==="all"||ym(r)===fy)&&(fm==="all"||mo(r)===fm)), pl=byCode(P), pt=pl.reduce((a,o)=>a+o.down,0)||1, pm=Math.max(1,...pl.map(o=>o.down));
    return '<div class="od">'+
      '<div class="odTop"><div><h2>포장2팀 <span>OEE</span> DASHBOARD</h2><p>고형제 포장 OEE 데이터 통합 분석 및 실적 현황</p><p class="odSt"><i></i>'+esc(st.src)+'</p></div>'+
        '<div class="odTs"><div><s>총 생산 배치</s><b class="bl">'+F.length+'</b><em>건 (선택 기간)</em></div><div class="tg"><s>🎯 OEE 목표</s><b class="rd">'+TARGET.toFixed(1)+'<small>%</small></b><em>이상</em></div></div>'+
        '<div class="odFl"><label>년 <select data-f="fy">'+op(years,fy,x=>x+"년")+'</select></label><label>월 <select data-f="fm">'+op(MK,fm,x=>(+x)+"월")+'</select></label><label>제품명 <select data-f="fp">'+op(prods,fp)+'</select></label>'+
        (st.meta&&(st.meta.fileId||st.meta.url)?'<button data-act="'+(st.meta.url?"reurl":"resync")+'" class="odG">↻ 대시보드 갱신</button>':'')+'</div></div>'+
      '<div class="odMi"><b>📌 OEE 관리 품목 <small>(수탁 포함)</small></b>'+MANAGED.map(([a,b])=>'<span><i>'+a+'</i>'+b+'</span>').join("")+'</div>'+
      '<div class="odK">'+[["시간가동률","#10b981","avail"],["성능가동률","#f59e0b","perf"],["수율","#8b5cf6","yld"],["OEE","#2563eb","oee"]].map(([n,c,f])=>'<div style="--c:'+c+'"><s>'+n+'</s><b>'+A(F,f).toFixed(1)+'<small>%</small></b></div>').join("")+'</div>'+
      '<div class="odC"><div class="odL"><div class="odCard"><h4>월별 OEE 트렌드 추이</h4>'+trend+'</div><div class="odCard"><h4>라인별 OEE 성과 비교</h4>'+lineC+'</div></div>'+
        '<div class="odCard odB"><h4>제품별 주요 부동 원인 및 대책 종합 게시판'+(fm!=="all"?' ('+(fy!=="all"?fy+"년 ":"")+(+fm)+'월)':'')+'</h4><div class="odBw">'+board+'</div></div></div>'+
      '<div class="odCard"><h4>파우치 부동 유형 순위 (IDT 이상사례 대처 교육 연계 · 사유 글의 항목별 분 합계)</h4>'+(pl.length?'<table class="oeeT"><tr><th>순위</th><th>부동 유형</th><th>부동시간</th><th>비중</th><th>발생</th></tr>'+pl.map((o,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(codeOf(o.k).nm)+'</td><td><div class="oeeBar"><span style="width:'+(o.down/pm*100).toFixed(0)+'%"></span><em>'+Math.round(o.down)+' 분</em></div></td><td>'+(o.down/pt*100).toFixed(0)+' %</td><td>'+o.n+' 회</td></tr>').join("")+'</table>':'<p class="oeeEmpty">이 기간 파우치 부동 기록이 없습니다.</p>')+
        (st.cfg.openInc?'<p style="margin-top:8px"><button data-act="inc">이상사례 대처 교육 열기 (이 순위 반영)</button></p>':'')+'</div>'+
      '<div class="odCard"><h4>OEE 데이터 입력 목록</h4><div class="odTw"><table class="odT"><tr><th>작업기간</th><th>제품명</th><th>제조번호(LOT)</th><th>라인</th><th>시간가동률</th><th>성능가동률</th><th>수율</th><th>OEE</th><th>부동시간</th><th width="17%">부동사유</th><th width="17%">대책</th></tr>'+rowsH+'</table></div><p class="oeeNote">※ 데이터 입력 · 대책 등록은 원래 OEE 대시보드에서 합니다 (IDT 는 읽기 전용).</p></div></div>';
  }
  function tabEffect(){
    const log=getLog(); if(!log.length) return '<p class="oeeEmpty">아직 완료한 이상사례 대처 교육이 없습니다. 메인화면 [OEE › 이상사례 대처 교육] 에서 학습 · 평가를 진행하세요.</p>';
    const ks=[...new Set(log.map(l=>l.k))], m=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
    let h='<h3>교육 실적</h3><table class="oeeT"><tr><th>상황</th><th>학습</th><th>평가</th><th>평가 평균</th><th>평균 대응 시간</th><th>평균 오답</th><th>최근</th></tr>'+ks.map(k=>{ const L=log.filter(l=>l.k===k), E=L.filter(l=>l.mode==="incExam"&&l.score!=null), T=L.filter(l=>l.ok&&l.sec!=null);
      return '<tr><td>'+esc(codeOf(k).nm)+'</td><td>'+L.filter(l=>l.mode!=="incExam").length+' 회</td><td>'+E.length+' 회</td><td>'+(E.length?m(E.map(l=>l.score)).toFixed(0)+' 점':"-")+'</td><td>'+(T.length?Math.round(m(T.map(l=>l.sec)))+' 초':"-")+'</td><td>'+(L.length?m(L.map(l=>l.wrong||0)).toFixed(1):"-")+'</td><td>'+esc(L.map(l=>l.d).sort().pop())+'</td></tr>'; }).join("")+'</table>';
    if(!st.rows.length) return h+need();
    const rows=st.rows.filter(r=>r.line.includes(st.cfg.line)), first={}; for(const l of log) if(!first[l.k]||l.d<first[l.k]) first[l.k]=l.d;
    const stat=(rs,k)=>{ const hit=rs.filter(r=>r.codes.includes(k)); return {n:rs.length, hit:hit.length, down:hit.reduce((a,r)=>a+downOf(r,k),0), oee:avg(rs,"oee")}; };
    return h+'<h3>교육 전 · 후 부동 비교</h3><p>첫 교육일을 기준으로 같은 부동 유형의 교육 전 · 후를 비교합니다 (라인 : '+esc(st.cfg.line)+').</p><table class="oeeT"><tr><th>부동 유형</th><th>첫 교육일</th><th>구분</th><th>기록 수</th><th>발생</th><th>기록당 부동시간</th><th>평균 OEE</th></tr>'+Object.keys(first).map(k=>{ const d=first[k], b=stat(rows.filter(r=>r.date<d),k), a=stat(rows.filter(r=>r.date>=d),k), cell=s=>s.n?'<td>'+s.n+'</td><td>'+s.hit+' 회</td><td>'+(s.down/s.n).toFixed(1)+' 분</td><td>'+f1(s.oee)+' %</td>':'<td colspan="4" class="oeeEmpty">데이터 없음</td>';
      return '<tr><td rowspan="2">'+esc(codeOf(k).nm)+'</td><td rowspan="2">'+d+'</td><td>교육 전</td>'+cell(b)+'</tr><tr><td>교육 후</td>'+cell(a)+'</tr>'; }).join("")+'</table><p class="oeeNote">※ 교육 후 기록이 쌓여야 비교할 수 있습니다. 다른 요인(품목 · 설비 정비 등)의 영향은 구분하지 않습니다.</p>'+(localLog().length?'<button data-act="clearLog">이 브라우저의 교육 기록 지우기</button>':'');
  }
  function onChange(e){ const f=e.target.dataset&&e.target.dataset.f; if(f){ st[f]=e.target.value; render(); } }
  function onClick(e){ const b=e.target.closest("button"); if(!b) return; if(b.dataset.tab){ st.tab=b.dataset.tab; render(); return; } const a=b.dataset.act;
    if(a==="close") close();
    else if(a==="demo"){ setRows(demoData(),"예시 데이터",true); st.tab="status"; render(); }
    else if(a==="paste"){ try{ setRows(parseText($o("#oeeText").value),"붙여넣기",false); st.tab="status"; }catch(err){ st.msg="붙여넣기 실패 : "+err.message; } render(); }
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
