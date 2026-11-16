/* ═══════════════════════════════════════════════════════════════════
   경광등 · 부저 (11/16 사용자 선택 개선 항목)
   · 설비별 경광등 (충전기 · 스틱공급장치 · 카토너 · 케이스 프린터 · X-ray · 대케이스 라인)
     녹 = 가동 · 주황 = 전원 ON · 정지 · 적 깜빡임 = 알람 발생(원인 판단 전) · 적 점등 = 조치 중(알람 해제 전) · 전부 꺼짐 = 전원 OFF
   · 부저 : 알람 발생 ~ 원인 판단(알람 확인)까지 반복 — 상단 [사운드 ON] 일 때만 소리 남 (브라우저 자동재생 제한 · 기본 꺼짐)
   · 교육 세션이 아닐 때(메인화면 배경)는 모두 녹색
   ═══════════════════════════════════════════════════════════════════ */
const LAMP={t:0, bz:0};
const LAMP_RUN={fl:()=>S.f.run, sf:()=>S.p.sfRun, ct:()=>S.p.ctRun, pr:()=>S.p.prRun, xr:()=>S.p.xrConv, line:()=>S.p.ctRun&&S.p.cwRun};
function lampAlarm(){
  const T=S&&S.activeTrouble; if(!T) return null;
  const R=S.recovery||{}; return {mk:(T.inc&&T.inc.mk)||(T.inc&&T.inc.room==="P"?"ct":"fl"), room:T.inc&&T.inc.room||S.room, ack:!!R.accepted, reset:!!R.reset};
}
function lampState(L,al,blink){
  if(!S||!S.session||!S.session.active) return "g";
  const k=L.k==="line"?"ct":L.k;
  if(!machPower(k)) return "off";
  if(al&&!al.reset&&(al.mk===L.k||(L.k==="line"&&al.room==="P"&&al.mk!=="fl"))) return al.ack?"r":(blink?"r":"off");
  return (LAMP_RUN[L.k]||LAMP_RUN.ct)()?"g":"y";
}
function lampTick(dt){
  if(typeof LAMPS==="undefined"||!LAMPS.length) return;
  LAMP.t+=dt; const al=lampAlarm(), blink=Math.sin(LAMP.t*Math.PI*3)>0;
  for(const L of LAMPS){ const s=lampState(L,al,blink); if(L.s===s) continue; L.s=s;
    L.m.forEach((m,i)=>{ m.emissiveIntensity=s==="gyr"[i]?2.4:0; }); }
  /* 부저 : 알람 확인 전까지 0.7 초 간격 */
  if(al&&!al.ack){ LAMP.bz-=dt; if(LAMP.bz<=0){ LAMP.bz=.7; beep(2300,.22,"square",.03); } } else LAMP.bz=0;
}
