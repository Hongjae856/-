/* ═══════════════════════════════════════════════════════════════════
   통합 렌더러 허브 (셸) — 두 앱이 함께 쓰는 카메라 · 활성 화면 · 시점 선택
   · cam : 궤도 카메라(mm) — 화면에 보이는 앱이 매 프레임 갱신, 다른 앱은 이 값으로 형상을 만든다
   · simple() : 보이는 앱에서 장비 하나를 고른 시점이면 다른 방을 간략 모델로 그린다
   ═══════════════════════════════════════════════════════════════════ */
window.UNI_HUB={
  cam:{yaw:-0.42,pitch:0.42,dist:12500,tx:2600,ty:700,tz:200},       /* 시작 시점 : 두 방 전체 */
  active:'filler',
  roomVer:1,
  view:{filler:()=>'all', line:()=>'all'},
  win(k){ try{ const f=document.querySelector('iframe[data-room="'+k+'"]'); return f&&f.contentWindow; }catch(e){ return null; } },
  simple(){ const f=this.view[this.active]; const v=f&&f(); return !!v&&v!=='all'; }
};
