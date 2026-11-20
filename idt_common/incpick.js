/* ═══ 이상사례 대처 교육 목록 공통 (세 IDT · 11/19 · 파우치 renderIncPick 을 옮김)
   · 순위 : OEE 데이터가 있으면 부동시간 40 % · 발생 빈도 30 % · 중요도 등급 30 %, 없으면 등급 순
   · 중요도 등급 (파우치 11/16 사용자 확정 기준) : 상 = 품질에 직접 영향 · 중 = 품질 영향 가능 · 생산 손실 · 하 = 설비 정지 위주
   · 블리스터 · 병 등급 : 11/19 사용자 확인 (제안안 그대로)
   idtIncPick(el, {room:"충전실", items:[{k, nm, src, g}], stats:{k:{down,n}}|null, onStart(k,"learn"|"exam"), onBack(), back:"← …"}) ═══ */
const IDT_GRADE_W={상:1,중:.6,하:.3};
const IDT_GRADE_WHY={상:"품질(함량 · 표시 · 첨부문서 · 포장 상태)에 직접 영향",중:"품질 영향 가능 · 생산 손실",하:"설비 정지 위주 · 품질 영향 낮음"};
function idtIncRank(items,stats){
  const has=!!(stats&&Object.keys(stats).length);
  const L=items.map(o=>{ const s=has&&stats[o.k]||{down:0,n:0}; return Object.assign({},o,{g:o.g||"중",down:s.down||0,n:s.n||0}); });
  const mD=Math.max(1e-9,...L.map(o=>o.down)), mN=Math.max(1e-9,...L.map(o=>o.n));
  for(const o of L) o.score=has?.4*(o.down/mD)+.3*(o.n/mN)+.3*IDT_GRADE_W[o.g]:IDT_GRADE_W[o.g];
  L.sort((a,b)=>b.score-a.score||b.down-a.down);
  return {list:L,has};
}
function idtIncPick(el,o){
  const e=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const stats=(typeof OEEEDU!=="undefined"&&OEEEDU.codeStats)?OEEEDU.codeStats():null, log=(typeof OEEEDU!=="undefined"&&OEEEDU.getLog)?OEEEDU.getLog():[];
  const R=idtIncRank(o.items,o.stats!==undefined?o.stats:stats);
  el.innerHTML='<h3>이상사례 대처 교육 — '+e(o.room)+'</h3>'+
    '<p class="ipNote">'+(R.has?'OEE 데이터의 부동시간(40%) · 발생 빈도(30%) · 중요도 등급(30%)으로 정렬했습니다.':'OEE 데이터가 없어 중요도 등급 순으로 정렬했습니다. [OEE 관리 대시보드] 에서 데이터를 연결하면 부동시간 · 발생 빈도가 반영됩니다.')+'</p>'+
    '<div class="ipList">'+R.list.map((x,i)=>{ const d=log.filter(l=>l.k===x.k), best=d.filter(l=>/exam/i.test(l.mode)&&l.score!=null).reduce((a,l)=>Math.max(a,l.score),-1);
      return '<div class="ipRow"><span class="rk">'+(i+1)+'</span><span class="gd g'+({상:"H",중:"M",하:"L"}[x.g])+'" title="'+e(IDT_GRADE_WHY[x.g])+'">'+x.g+'</span>'+
        '<b>'+e(x.nm)+'<s>'+e(x.src||"")+(R.has?' · 부동 '+Math.round(x.down)+' 분 · '+x.n+' 회':'')+(d.length?' · 실습 '+d.length+' 회'+(best>=0?' · 평가 최고 '+best+' 점':''):'')+'</s></b>'+
        '<button class="s" data-inc="'+e(x.k)+'" data-m="learn">학습</button><button class="e" data-inc="'+e(x.k)+'" data-m="exam">평가</button></div>'; }).join("")+'</div>'+
    '<p class="ipNote">중요도 등급 : 상 = '+IDT_GRADE_WHY.상+' · 중 = '+IDT_GRADE_WHY.중+' · 하 = '+IDT_GRADE_WHY.하+'</p>'+
    '<button id="incBack">'+(o.back||"← 교육 과정 선택으로")+'</button>';
  el.querySelectorAll("[data-inc]").forEach(b=>b.onclick=()=>o.onStart(b.dataset.inc,b.dataset.m));
  el.querySelector("#incBack").onclick=()=>o.onBack();
}
