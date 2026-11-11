/* ═══ 충전실 주변 : 북쪽 벽 유리창 · 개구부, 경사 컨베이어, 프린터 컨트롤러 거치대, IBC 2기 · 받침 호퍼 · 진공호스,
       저울 작업대 2대(북서), 드럼리프터(북동), 예비 은박(남동), 출입문 2(남) — DRAWING.md 6 · 8절 ═══ */
function buildFillZone(S){
  const g=new T3.Group(); S.add(g); const F=FL, zc=F.zc, H=RM.fill.h;
  /* ── 북쪽 벽 : 유리창 2 (컨베이어 양옆) · 사각 개구부(스테인리스 테두리) · 인터폰 ── */
  const glass=new T3.MeshPhysicalMaterial({color:0x9fc4d6,roughness:.05,metalness:0,transparent:true,opacity:.45});
  for(const x0 of [CVX-1.25,CVX+.3]){ bx(g,x0,x0+.95,1.05,2.15,.026,.034,glass); for(const [a,b,c,d] of [[x0-.04,x0+.99,1.01,1.05],[x0-.04,x0+.99,2.15,2.19],[x0-.04,x0,1.01,2.19],[x0+.95,x0+.99,1.01,2.19]]) bx(g,a,b,c,d,.02,.045,M.alu); }
  for(const [a,b,c,d] of [[CVX-.2,CVX+.2,1.2,1.24],[CVX-.2,CVX+.2,1.62,1.66],[CVX-.2,CVX-.16,1.2,1.66],[CVX+.16,CVX+.2,1.2,1.66]]) bx(g,a,b,c,d,.0,.09,M.ss);
  bx(g,CVX+.45,CVX+.55,1.35,1.6,.026,.06,M.white);
  /* ── 프린터 컨트롤러 · 비전 PC 거치대 (알루미늄 프로파일 케이스) ── */
  { const x0=CVX+.35,x1=CVX+.97,z0=.42,z1=.9; for(const x of [x0,x1]) for(const z of [z0,z1]) bx(g,x-.02,x+.02,.05,1.55,z-.02,z+.02,M.alu);
    for(const y of [.25,.95,1.55]){ bx(g,x0,x1,y-.015,y,z0,z1,M.white); }
    for(const dx of [.04,.33]) { bx(g,x0+dx,x0+dx+.26,.27,.72,z0+.06,z1-.08,M.blue); bx(g,x0+dx+.04,x0+dx+.22,.5,.64,z1-.08,z1-.075,M.scr); }
    bx(g,x0+.06,x1-.06,1.58,1.95,z0+.2,z0+.24,M.dark); bx(g,x0+.08,x1-.08,1.6,1.93,z0+.24,z0+.245,M.scr); bx(g,x0+.1,x1-.1,.96,.975,z1-.2,z1+.05,M.dark);
    for(const x of [x0,x1]) for(const z of [z0,z1]) rod(g,[x,0,z],[x,.05,z],.03,M.dark,12); }
  /* ── IBC (각형 상부 + 사각 역피라미드 · 버터플라이 밸브 · 원통 다리 · 포크 포켓) + 받침 호퍼 ── */
  const ibc=(cx,cz,nm,mesh)=>{ const w=.55;
    for(const sx of [-1,1]) for(const sz of [-1,1]){ rod(g,[cx+sx*w,.012,cz+sz*w],[cx+sx*w,1.3,cz+sz*w],.055,M.ss,24); rod(g,[cx+sx*w,0,cz+sz*w],[cx+sx*w,.012,cz+sz*w],.057,M.white,24); }
    for(const sz of [-1,1]) bx(g,cx-w,cx+w,.2,.36,cz+sz*w-.04,cz+sz*w+.04,M.ss); for(const sx of [-1,1]) bx(g,cx+sx*.3-.1,cx+sx*.3+.1,.05,.2,cz-w,cz+w,M.ssD);
    bx(g,cx-w-.05,cx+w+.05,1.3,1.62,cz-w-.05,cz+w+.05,M.ss); frustum(g,cx,.62,1.3,cz,2*w+.1,2*w+.1,.22,.22,M.ss);
    rod(g,[cx,.5,cz],[cx,.62,cz],.1,M.ssMir,28); rod(g,[cx,.56,cz],[cx+.32,.56,cz+.12],.012,M.ssMir);
    rod(g,[cx,1.62,cz],[cx,1.66,cz],.22,M.ssMir,36); rod(g,[cx,1.66,cz],[cx,1.675,cz],.235,M.ss,36);
    plate(g,.3,.09,labelTex([[nm,"#111",70]],{w:512,h:150,border:"#333"}),[cx-w-.056,1.46,cz],-Math.PI/2);
    plate(g,.26,.07,labelTex([["OPEN        CLOSED","#222",50]],{w:640,h:120,bg:"#c9ccce"}),[cx-.33,.82,cz],-Math.PI/2).rotation.z=0;
    /* 받침 호퍼 : 사각 함 · 원형 개구부(흰 가스켓) · 앞면 위생 클램프 배출구 */
    bx(g,cx-.24,cx+.24,.18,.44,cz-.24,cz+.24,M.ssMir); for(const sx of [-1,1]) bx(g,cx+sx*.2-.03,cx+sx*.2+.03,0,.18,cz-.22,cz+.22,M.ssD);
    rod(g,[cx,.44,cz],[cx,.455,cz],.19,M.white,32); rod(g,[cx,.455,cz],[cx,.46,cz],mesh?.15:.12,mesh?M.ssD:M.dark,32);
    rod(g,[cx-.24,.26,cz],[cx-.34,.26,cz],.035,M.ssMir,18); rod(g,[cx-.34,.26,cz],[cx-.36,.26,cz],.048,M.ss,18);
    return [cx-.36,.26,cz]; };
  const oS=ibc(6.75,2.22,"백당",true), oA=ibc(6.75,.8,"첨가제",false);
  /* 진공호스 : 받침 호퍼 → 바닥 → 2층 데크 → 호퍼 1(첨가제) · 3(백당) 진공이송기 (두 가닥 함께) */
  const hz=F.z0-.12;
  tube(g,[oA,[oA[0]-.25,.08,oA[2]],[5.9,.05,.95],[5.75,.6,hz+.1],[5.6,2.3,hz],[4.6,3.1,hz+.2],[3.7,F.top+.1,zc-.5],[3.3+.1,F.top,zc]],.03,M.hose);
  tube(g,[oS,[oS[0]-.3,.08,oS[2]-.2],[6.0,.05,1.2],[5.82,.6,hz+.16],[5.68,2.3,hz+.06],[5.4,3.2,hz+.3],[4.9,F.top+.12,zc-.4],[4.54+.1,F.top,zc]],.03,M.hose);
  /* ── 저울 작업대 2대 (북서 · 벽을 따라 세로) ── */
  for(const z0 of [.25,1.4]){ bx(g,.12,.72,.78,.82,z0,z0+1.0,M.ss); for(const x of [.16,.68]) for(const z of [z0+.05,z0+.95]) bx(g,x-.02,x+.02,.03,.78,z-.02,z+.02,M.ss);
    bx(g,.16,.68,.2,.22,z0+.05,z0+.95,M.ss); bx(g,.26,.56,.82,.88,z0+.3,z0+.62,M.white); bx(g,.3,.52,.88,.89,z0+.34,z0+.58,M.ssMir); bx(g,.3,.52,.82,.9,z0+.66,z0+.74,M.dark); }
  /* ── 드럼리프터 (북동 보관) : 사각 마스트 · 난간 바스켓 · 본체 · 빨간 캐스터 ── */
  { const x=11.0, z=1.8; bx(g,x-.07,x+.07,.12,2.5,z-.1,z+.1,M.ss); bx(g,x+.07,x+.5,.25,1.0,z-.3,z+.3,M.ss); bx(g,x-.75,x-.07,.2,.23,z-.4,z+.4,M.ssMir);
    for(const s of [-1,1]){ rod(g,[x-.72,.23,z+s*.38],[x-.72,.6,z+s*.38],.012,M.ssMir); rod(g,[x-.1,.23,z+s*.38],[x-.1,.6,z+s*.38],.012,M.ssMir); rod(g,[x-.72,.6,z+s*.38],[x-.1,.6,z+s*.38],.012,M.ssMir); rod(g,[x-.72,.42,z+s*.38],[x-.1,.42,z+s*.38],.008,M.ssMir); }
    for(const [dx,dz] of [[-.6,-.3],[-.6,.3],[.4,-.25],[.4,.25]]) { const c=new T3.Mesh(new T3.CylinderGeometry(.06,.06,.04,20),M.red); c.rotation.x=Math.PI/2; c.position.set(x+dx,.06,z+dz); add(g,c); }
    rod(g,[x+.5,1.0,z],[x+.5,1.1,z],.015,M.red,10);
    plate(g,.42,.3,labelTex([["리프터 사용 규칙","#111",44],["3인 1조","#c00",52],["(1명 운전 · 2명 하역)","#111",34]],{w:512,h:360,border:"#1f5fb8"}),[RM.fill.x1-.03,1.6,z],-Math.PI/2); }
  /* ── 예비 은박 (남동) : 스테인리스 팔레트 + 은박 롤 ── */
  { const x=10.95, z=6.2; bx(g,x-.55,x+.55,.1,.16,z-.5,z+.5,M.ss); for(const dx of [-.45,0,.45]) bx(g,x+dx-.04,x+dx+.04,0,.1,z-.5,z+.5,M.ss);
    for(const [dz,m] of [[-.25,M.foil],[.25,M.foilP]]){ const r=new T3.Mesh(new T3.CylinderGeometry(.22,.22,.95,40),m); r.rotation.z=Math.PI/2; r.position.set(x,.38,z+dz); add(g,r); rod(g,[x-.5,.38,z+dz],[x+.5,.38,z+dz],.04,M.dark,16); } }
  /* ── 출입문 2 (남쪽 벽) : 양개문 · 유리창 ── */
  for(const x0 of [.7,8.3]){ const z=RM.fill.z1-.03; bx(g,x0-.05,x0+1.05,0,2.15,z-.02,z,M.alu); for(const dx of [0,.5]){ bx(g,x0+dx+.01,x0+dx+.49,.02,2.1,z-.03,z-.02,M.white); bx(g,x0+dx+.1,x0+dx+.4,1.2,1.8,z-.034,z-.03,glass); rod(g,[x0+(dx?.56:.44),1.0,z-.06],[x0+(dx?.56:.44),1.12,z-.06],.01,M.ssMir); } }
  /* ── 소화기 (진공청소기는 구현하지 않음 — 사용자 지시 11/11) ── */
  rod(g,[.3,.05,6.5],[.3,.5,6.5],.06,M.red,18); rod(g,[.3,.5,6.5],[.3,.58,6.5],.02,M.dark,10);
  return g;
}
