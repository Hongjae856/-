/* ═══════════════════════════════════════════════════════════════════
   단일 화면 레이아웃 (두 앱 공통) — 충전 UI 와 포장 UI 의 3D 영역을 같은 위치 · 크기로 고정
   · 화면 맞춤 배율을 같은 식으로 (1840 × 1010 기준) · 상단 바 · 열 너비 · 안내줄 · 조작 패널 높이를 같게
   · 충전 UI 의 구역 버튼(전체 · 성형부 …)은 3D 화면 위 왼쪽 상단에, 포장 UI 의 공정 순서 띠는 3D 화면 아래쪽에 겹쳐 둔다
   ═══════════════════════════════════════════════════════════════════ */
(function(){
if(!RB) return;
const css=document.createElement('style');
css.id='uniLayout';
css.textContent=`
#app{transform:scale(var(--uk,1))!important;transform-origin:center center!important}
#head{height:58px!important;min-height:58px!important;max-height:58px!important;flex:0 0 58px!important;padding:7px 10px!important;box-sizing:border-box!important}
#main{grid-template-columns:260px minmax(0,1fr) 374px!important;gap:7px!important;padding:6px 9px 8px!important}
#main>.col:nth-child(2){gap:0!important}
#mimicCard{flex:1 1 auto!important;min-height:0!important;padding:8px!important;display:flex!important;flex-direction:column!important;gap:6px!important;position:relative!important}
html body #mimicCard>#coach{display:flex!important;height:84px!important;min-height:84px!important;max-height:84px!important;flex:0 0 84px!important;margin:0!important;box-sizing:border-box!important;overflow:hidden!important}
#mimic3dWrap{flex:1 1 auto!important;min-height:0!important;margin:0!important;height:auto!important;position:relative!important}
#cardPanel{flex:0 0 96px!important;height:96px!important;margin:0!important;box-sizing:border-box!important;overflow:hidden!important}
#sectionNav.uniOver{position:absolute!important;left:10px;top:8px;z-index:6;margin:0!important;padding:0!important;background:none!important;border:0!important;box-shadow:none!important;display:flex;gap:5px;flex-wrap:wrap;max-width:calc(100% - 20px)}
#sectionNav.uniOver button{padding:6px 11px!important;font-size:13px!important}
#sectionNav.uniOver button:not(.on){background:rgba(255,255,255,.92)!important}
#cardFlow.uniOver{position:absolute!important;left:10px;right:10px;bottom:8px;z-index:6;margin:0!important;padding:6px 10px!important;background:rgba(255,255,255,.92)!important;border-radius:10px;box-shadow:0 2px 10px #142b4714}
#cardFlow.uniOver #flow{margin:0!important}
#legend.uniOver{position:absolute!important;right:10px;bottom:70px;z-index:6;margin:0!important;padding:3px 8px!important;background:rgba(255,255,255,.88)!important;border-radius:7px}
`;
document.head.appendChild(css);
const fitK=()=>{ document.documentElement.style.setProperty('--uk',Math.min(window.innerWidth/1840,window.innerHeight/1010).toFixed(4)); };
fitK(); window.addEventListener('resize',fitK);
function move(){
  const wrap=document.getElementById('mimic3dWrap'); if(!wrap) return false;
  const nav=document.getElementById('sectionNav'); if(nav&&nav.parentNode!==wrap){ nav.classList.add('uniOver'); wrap.appendChild(nav); }
  const flow=document.getElementById('cardFlow'); if(flow&&flow.parentNode!==wrap){ flow.classList.add('uniOver'); wrap.appendChild(flow); }
  const lg=document.getElementById('legend'); if(lg&&lg.parentNode!==wrap&&getComputedStyle(lg).display!=='none'){ lg.classList.add('uniOver'); wrap.appendChild(lg); }
  return true;
}
if(!move()) document.addEventListener('DOMContentLoaded',move);
setTimeout(move,0);
})();
