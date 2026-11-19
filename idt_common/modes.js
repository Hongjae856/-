/* ═══════════════════════════════════════════════════════════════════
   시연 · 자유모드 안내 · 결과 창 공통 (세 IDT · 11/19 통합 4단계 · 파우치 방식)
   · 결과 창 : 파우치 결과 창 모양 그대로 (제목 · 요약 줄 · 점수 · 실적 카드 · 표 · 버튼) — 학습 · 평가 · 이상사례 · 시연 결과 모두
     idtResOpen(o, doc) : doc 에 #mEnd(#endBox) 가 있으면 그 자리에, 없으면 새로 만들어 띄움 (앱 iframe 문서도 됨)
     o = {icon, head, sub, meta, score:{v,pass,th,base,minus}|null, kpis:[[값,이름,"hi"|"ng"]], cols:4, secs:[{h,th:[..],rows:[[..]],empty,l:[왼쪽 정렬 열]}],
          html, note, btns:[[이름, 함수|null, 강조, 창 유지]]}  (버튼은 누르면 창을 닫고 함수 실행 · 창 유지면 닫지 않음 · 함수에 버튼을 넘김)
   · 시연모드 안내 : 단계마다 [▶ 단계 이름] 버튼 하나 (파우치) — idtDemoHtml
   · 자유모드 안내 : 같은 제목 · 설명 · [▶ 정상 운전 상태로] [■ 전체 OFF 초기화] — idtFreeHtml
   ═══════════════════════════════════════════════════════════════════ */
const IDT_PASS=80;
const IDT_RES_CSS=
  "#mEnd.idtM{position:fixed;inset:0;background:rgba(12,20,30,.55);display:none;align-items:center;justify-content:center;z-index:3000}#mEnd.idtM.on{display:flex}"+
  "#mEnd.idtM>.mbox{width:1100px;max-width:94%;max-height:91%;overflow:auto;background:#fff;border-radius:14px;padding:30px;box-shadow:0 12px 34px rgba(12,22,36,.28);box-sizing:border-box}"+
  ".idtRes{font-family:'Malgun Gothic','Noto Sans KR',sans-serif;color:#16202c;text-align:left}"+
  ".idtRes h2{font:800 30px/1.3 'Malgun Gothic','Noto Sans KR',sans-serif;margin:0 0 10px;color:#16202c}"+
  ".idtRes h3{font:800 18px/1.3 'Malgun Gothic','Noto Sans KR',sans-serif;margin:14px 0 6px;color:#16202c}"+
  ".idtRes p{font-size:15px;color:#61748a;line-height:1.7;margin:0 0 8px}"+
  ".idtRes .finalScore{font:800 54px/1.2 'Malgun Gothic','Noto Sans KR',sans-serif;color:#173e61}.idtRes .finalScore small{font-size:22px;padding-left:7px}"+
  ".idtRes .kpis{display:grid;gap:6px;margin:10px 0}"+
  ".idtRes .kcard{background:#eef3f8;border:1px solid #dbe4ee;border-radius:8px;padding:7px 5px;text-align:center}"+
  ".idtRes .kcard b{display:block;font:800 18px/1.2 Consolas,'D2Coding',monospace;color:#22405f}.idtRes .kcard s{display:block;text-decoration:none;font:700 10.5px/1.4 'Malgun Gothic',sans-serif;color:#7d8fa0;margin-top:2px}"+
  ".idtRes .kcard.hi{background:#e7f2ff;border-color:#b9d5f5}.idtRes .kcard.hi b{color:#1a63b8}.idtRes .kcard.ng b{color:#c23a28}"+
  ".idtRes table.ht{width:100%;border-collapse:collapse;font-size:15px}.idtRes table.ht th{background:#dde5ee;border:1px solid #c7d3e0;padding:8px;font-weight:800;color:#33465c}"+
  ".idtRes table.ht td{border:1px solid #dbe3ec;padding:8px;background:#fff;text-align:center;font-family:Consolas,'D2Coding',monospace}.idtRes table.ht td.l{text-align:left;font-family:'Malgun Gothic',sans-serif;font-weight:700}"+
  ".idtRes .oeeNote{font-size:12.5px;color:#7b8794}"+
  ".idtRes .mbtn{display:flex;gap:9px;margin-top:14px;flex-wrap:wrap}.idtRes .mbtn button{flex:1;padding:13px 0;border:0;border-radius:9px;font:800 15px 'Malgun Gothic',sans-serif;cursor:pointer;background:#eef2f7;color:#61748a}"+
  ".idtRes .mbtn button.pri{background:#1b57c4;color:#fff}";
const idtEsc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const idtMmss=s=>{ s=Math.max(0,Math.round(s||0)); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); };
function idtResHtml(o){
  const sc=o.score, kp=o.kpis||[];
  return '<div class="idtRes"><h2>'+(o.icon?o.icon+" ":"")+idtEsc(o.head)+(o.sub?' — '+idtEsc(o.sub):'')+'</h2>'+
    (o.meta?'<p>'+idtEsc(o.meta)+'</p>':'')+
    (sc?'<div class="finalScore">'+sc.v+'<small>점 · '+(sc.pass?"합격":"불합격")+' (기준 '+(sc.th||IDT_PASS)+'점)</small></div>'+(sc.base!=null?'<p>단계 점수 '+sc.base+'점 − 감점 '+sc.minus+'점</p>':''):'')+
    (kp.length?'<div class="kpis" style="grid-template-columns:repeat('+(o.cols||Math.min(4,kp.length))+',minmax(0,1fr))">'+kp.map(k=>'<div class="kcard'+(k[2]?" "+k[2]:"")+'"><b>'+k[0]+'</b><s>'+idtEsc(k[1])+'</s></div>').join("")+'</div>':'')+
    (o.secs||[]).map(s=>'<h3>'+idtEsc(s.h)+'</h3>'+(s.p?'<p>'+idtEsc(s.p)+'</p>':'')+(s.th?'<table class="ht"><tr>'+s.th.map(h=>'<th>'+idtEsc(h)+'</th>').join("")+'</tr>'+
      (s.rows&&s.rows.length?s.rows.map(r=>'<tr>'+r.map((c,i)=>'<td'+((s.l||[]).includes(i)?' class="l"':'')+'>'+idtEsc(c)+'</td>').join("")+'</tr>').join(""):'<tr><td colspan="'+s.th.length+'">'+idtEsc(s.empty||"없음")+'</td></tr>')+'</table>':'')).join("")+
    (o.html||"")+(o.note?'<p class="oeeNote">'+idtEsc(o.note)+'</p>':'')+
    '<div class="mbtn">'+(o.btns||[]).map((b,i)=>'<button data-ib="'+i+'"'+(b[2]?' class="pri"':'')+'>'+idtEsc(b[0])+'</button>').join("")+'</div></div>';
}
function idtResOpen(o,doc){
  doc=doc||document;
  if(!doc.getElementById("idtResCss")){ const st=doc.createElement("style"); st.id="idtResCss"; st.textContent=IDT_RES_CSS; doc.head.appendChild(st); }
  let m=doc.getElementById("mEnd"), box=doc.getElementById("endBox");
  if(!m||!box){ m=doc.createElement("div"); m.className="modal"; m.id="mEnd"; m.innerHTML='<div class="mbox" id="endBox"></div>'; doc.body.appendChild(m); box=m.firstChild; }
  m.classList.add("idtM"); box.innerHTML=idtResHtml(o); m.classList.add("on");
  box.querySelectorAll("[data-ib]").forEach(b=>b.onclick=()=>{ const B=o.btns[+b.dataset.ib]; if(!B[3]) m.classList.remove("on"); if(B[1]) B[1](b); });
  return box;
}
/* 메인화면으로 갈 때 결과 창 닫기 (docs = 셸 · 앱 문서들) */
function idtResClose(docs){ for(const d of [].concat(docs||document)){ try{ const m=d&&d.getElementById("mEnd"); if(m&&m.classList.contains("idtM")) m.classList.remove("on"); }catch(e){} } }
function idtResShown(doc){ const m=(doc||document).getElementById("mEnd"); return !!(m&&m.classList.contains("on")); }
/* 이상사례 결과 (세 IDT 같은 구성 · 파우치 showIncResult) : r = {room, nm, grade, ok, sec, wrong, hint, exam, score, ded:[[항목, 감점]], answer, again, list, home} */
function idtIncResult(r,doc){
  return idtResOpen({icon:r.exam?"📝":"📘", head:r.exam?"이상사례 대처 평가":"이상사례 대처 학습", sub:r.room+" · "+r.nm,
    meta:"중요도 "+(r.grade||"-")+" · "+(r.ok?"대응 완료":"중도 종료")+(r.sec!=null?" · 발생 → 재가동 "+idtMmss(r.sec):"")+" · 원인 판단 오답 "+(r.wrong||0)+"회 · 힌트 "+(r.hint||0)+"회",
    score:r.exam?{v:r.ok?r.score:0, pass:r.ok&&r.score>=IDT_PASS}:null,
    secs:[].concat(r.answer?[{h:"올바른 판단",p:r.answer}]:[],[{h:"감점 내역",th:["항목","감점"],rows:(r.ded||[]).map(d=>[d[0],d[1]==null||d[1]===""?"":"−"+d[1]]),empty:"감점 없음",l:[0]}]),
    note:"결과는 [OEE › OEE 관리 대시보드 › ③ 교육 효과] 에 기록됩니다.",
    btns:[["다시 하기",r.again,true]].concat(r.list?[["이상사례 목록",r.list]]:[],[["메인화면",r.home]])},doc);
}
/* 시연 완료 결과 (파우치 showDemoResult) : r = {room, flow, kpis, again, home} */
function idtDemoResult(r,doc){
  return idtResOpen({icon:"🎬", head:"시연 완료", sub:r.room, meta:r.flow+"까지 진행했습니다.", kpis:r.kpis, cols:3,
    btns:[["다시 시연",r.again,true],["메인화면",r.home],["닫기",null]]},doc);
}
/* 안내판 HTML : wrap = PTP 셸 안내판 구조(.t 글 · .b 버튼) */
const _idtCoach=(sm,t,d,btns,wrap)=>wrap?'<div class="t"><small>'+sm+'</small><b>'+t+'</b><span>'+d+'</span></div>'+(btns?'<div class="b">'+btns+'</div>':'')
                                       :'<small>'+sm+'</small><b>'+t+'</b><span>'+d+'</span>'+(btns||'');
/* ── 시연모드 안내 (단계 버튼식) ── L = [{t, d, btn, act}] · i = 지금 단계 (L.length 이상이면 완료) */
function idtDemoHtml(head,L,i,doneMsg,wrap){
  const st=L[i], done=!st;
  return _idtCoach('시연모드 · '+head+' · '+Math.min(i+1,L.length)+' / '+L.length, done?"시연 완료 — 라인 연속 생산 중":st.t, done?doneMsg:st.d,
    !done&&st.act?'<button class="dmAct" data-dm-act="1">▶ '+(st.btn||st.t)+'</button>':!done?'<em class="dmWait">진행 중…</em>':'', wrap);
}
/* ── 자유모드 안내 ── */
const IDT_FREE={title:"순서 · 감점 · 평가 없음 — 무엇이든 조작해 보세요", run:"▶ 정상 운전 상태로", off:"■ 전체 OFF 초기화"};
const idtFreeDesc=extra=>"기동 조건 · 운전 중 조작 금지가 해제되어 있습니다 (실제와 다름). 메인 전원 · 압축공기는 실제처럼 켜야 하고, 운전 중 안전문을 열면 인터락으로 정지합니다. "+(extra?extra+" ":"")+"상단 작업자 버튼으로 같은 라인의 다른 작업장으로 바꿉니다.";
function idtFreeHtml(head,extra,wrap){
  return _idtCoach('자유모드 · '+head, IDT_FREE.title, idtFreeDesc(extra),
    '<button class="dmAct frB" data-free="run">'+IDT_FREE.run+'</button><button class="dmAct frB" data-free="off">'+IDT_FREE.off+'</button>', wrap);
}
