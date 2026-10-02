/* ═══════════════════════════════════════════════════════════════════
   방 모드 공용 (두 iframe 공통) — 셸의 연동 버스 연결 · 옆방 안개 톤
   · 셸 밖에서 단독으로 열리면 RB 가 없으므로 방 모드 코드는 모두 건너뛴다.
   ═══════════════════════════════════════════════════════════════════ */
const RB=(function(){ try{ return (window.parent!==window&&window.parent.ROOMBUS)||null; }catch(e){ return null; } })();
window.ROOM_ACTIVE=true;
/* 옆방 : 형상은 그대로 두고 색만 배경 쪽으로 옅게 (블러 없음 · 추가 그리기 없음) */
const ROOM_HAZE=0.46, ROOM_HAZE_BG=[0.936,0.944,0.952];
function roomHazeArr(c,k){ k=k==null?ROOM_HAZE:k;
  return [c[0]+(ROOM_HAZE_BG[0]-c[0])*k, c[1]+(ROOM_HAZE_BG[1]-c[1])*k, c[2]+(ROOM_HAZE_BG[2]-c[2])*k]; }
const _roomHx={};
function roomHazeHex(h,k){ k=k==null?ROOM_HAZE:k; const key=h+'|'+k; if(_roomHx[key]) return _roomHx[key];
  const n=parseInt(h.slice(1),16), c=[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255], m=roomHazeArr(c,k);
  return _roomHx[key]='#'+m.map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join(''); }
/* 방 바닥 · 벽 색 (2D 배경) */
const ROOM_COL={
  dFloor:['#e4ebf1','#edf2f6','#f5f8fa'],   /* 충전실 D구역 : 옅은 청회색 에폭시 */
  gFloor:['#e8e7e1','#efeee9','#f6f5f1'],   /* 포장실 G구역 : 옅은 웜그레이 */
  wall:['#ffffff','#f8f8f6','#e9eae7'], cove:'#d6dadf', seam:'rgba(145,148,146,.20)'
};
/* 바닥 위 구역 표지 (화면 정렬 배지 + 바닥 핀) */
function roomZoneBadge(g,p,txt,sub,col){
  if(!p) return;
  g.save();
  g.font='800 14px Malgun Gothic, sans-serif';
  const w=Math.max(g.measureText(txt).width, (g.font='700 11px Malgun Gothic, sans-serif',g.measureText(sub).width))+24;
  const x=p.x-w/2, y=p.y-44;
  g.fillStyle='rgba(255,255,255,.93)'; g.strokeStyle=col; g.lineWidth=1.6;
  g.beginPath(); if(g.roundRect) g.roundRect(x,y,w,36,8); else g.rect(x,y,w,36); g.fill(); g.stroke();
  g.fillStyle=col; g.font='800 14px Malgun Gothic, sans-serif'; g.textAlign='center'; g.textBaseline='alphabetic';
  g.fillText(txt,p.x,y+16);
  g.fillStyle='#5d7086'; g.font='700 11px Malgun Gothic, sans-serif'; g.fillText(sub,p.x,y+30);
  g.beginPath(); g.moveTo(p.x,y+36); g.lineTo(p.x,p.y-3); g.strokeStyle=col; g.lineWidth=1.4; g.stroke();
  g.beginPath(); g.arc(p.x,p.y,3,0,7); g.fillStyle=col; g.fill();
  g.restore();
}
/* 연동 가동(시연) 중 : 학습 코치 · 안내 화살표 · 강조 테두리 대신 시연 안내 */
(function(){
  if(!RB) return;
  const st=document.createElement('style');
  st.textContent='body.roomDemo #coach>*{display:none!important}'+
    'body.roomDemo #coach::before{content:attr(data-room-demo);display:block;font:700 15px/1.45 "Malgun Gothic",sans-serif;color:#1f5f43;padding:2px 0}'+
    'body.roomDemo #coach{border-left-color:#1f8a5b!important;background:#effaf4!important}'+
    'body.roomDemo #guideArrow{display:none!important}body.roomDemo .hint{outline:none!important;box-shadow:none!important}';
  document.head.appendChild(st);
  setInterval(()=>{ const on=!!RB.st.link; document.body.classList.toggle('roomDemo',on);
    const c=document.getElementById('coach'); if(c&&on&&window.ROOM_DEMO_TEXT) c.setAttribute('data-room-demo',window.ROOM_DEMO_TEXT()); },250);
})();
