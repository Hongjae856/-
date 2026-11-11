/* ═══ 충전실 주변 : 북쪽 벽 유리창 · 개구부, 경사 컨베이어, 프린터 컨트롤러 거치대, IBC 2기 · 받침 호퍼 · 진공호스,
       저울 작업대 2대(북서), 드럼리프터(북동), 예비 은박(남동), 출입문 2(남) — DRAWING.md 6 · 8절 ═══ */
let FILLCART=null, FILLLIFT=null;
function buildFillZone(S){
  const g=new T3.Group(); S.add(g); const F=FL, zc=F.zc, H=RM.fill.h;
  /* ── 북쪽 벽 : 유리창 2 (컨베이어 양옆) · 사각 개구부(스테인리스 테두리) · 인터폰 ── */
  const glass=new T3.MeshPhysicalMaterial({color:0x9fc4d6,roughness:.05,metalness:0,transparent:true,opacity:.45});
  for(const x0 of [CVX-1.25,CVX+.3]){ bx(g,x0,x0+.95,1.05,2.15,.026,.034,glass); for(const [a,b,c,d] of [[x0-.04,x0+.99,1.01,1.05],[x0-.04,x0+.99,2.15,2.19],[x0-.04,x0,1.01,2.19],[x0+.95,x0+.99,1.01,2.19]]) bx(g,a,b,c,d,.02,.045,M.alu); }
  for(const [a,b,c,d] of [[CVX-.2,CVX+.2,1.2,1.24],[CVX-.2,CVX+.2,1.62,1.66],[CVX-.2,CVX-.16,1.2,1.66],[CVX+.16,CVX+.2,1.2,1.66]]) bx(g,a,b,c,d,.0,.09,M.ss);
  bx(g,CVX-.5,CVX-.4,1.3,1.56,.026,.06,M.white); bx(g,CVX-.485,CVX-.455,1.32,1.54,.06,.085,M.white); tube(g,[[CVX-.47,1.32,.07],[CVX-.46,1.2,.09],[CVX-.48,1.1,.07],[CVX-.47,1.02,.08]],.006,M.white);   /* 인터폰 (개구부 서쪽) */
  /* ── 프린터 컨트롤러 · 비전 PC 거치대 : 알루미늄 프로파일 함 (위 칸 파란 컨트롤러 2 · 아래 회색 문) · 위 모니터 · 앞 키보드 받침 ── */
  { const x0=CVX+.4,x1=CVX+1.05,z0=.4,z1=.92; for(const x of [x0,x1]) for(const z of [z0,z1]) bx(g,x-.02,x+.02,.06,1.5,z-.02,z+.02,M.alu);
    for(const y of [.1,1.0,1.5]) bx(g,x0,x1,y-.02,y,z0,z1,M.alu); bx(g,x0,x1,.1,1.5,z0-.004,z0,M.white); for(const x of [x0,x1]) bx(g,x-.003,x+.003,.1,1.5,z0,z1,M.white);
    for(const dx of [0,.32]){ bx(g,x0+.02+dx,x0+.3+dx,.12,.98,z1-.004,z1,M.grey); rod(g,[x0+(dx?.36:.28),.6,z1],[x0+(dx?.36:.28),.6,z1+.012],.01,M.dark,8); }
    for(const dx of [.07,.36]){ bx(g,x0+dx,x0+dx+.22,1.02,1.36,z1-.3,z1-.06,M.blue); bx(g,x0+dx+.03,x0+dx+.19,1.2,1.32,z1-.06,z1-.055,M.scr); bx(g,x0+dx+.05,x0+dx+.17,1.05,1.11,z1-.06,z1-.056,M.red); }
    rod(g,[(x0+x1)/2,1.5,z0+.1],[(x0+x1)/2,1.72,z0+.1],.015,M.dark,10); bx(g,x0+.04,x1-.04,1.62,1.98,z0+.12,z0+.15,M.dark); bx(g,x0+.06,x1-.06,1.64,1.96,z0+.15,z0+.154,M.scr);
    bx(g,x0+.06,x1-.06,.9,.915,z1+.06,z1+.3,M.ss); bx(g,x0+.12,x1-.12,.915,.93,z1+.1,z1+.24,M.dark); for(const x of [x0+.08,x1-.08]) for(const z of [z1+.08,z1+.28]) rod(g,[x,0,z],[x,.9,z],.012,M.ssMir,8); bx(g,x0+.08,x1-.08,.6,.61,z1+.08,z1+.28,M.deck);
    for(const x of [x0,x1]) for(const z of [z0,z1]) rod(g,[x,0,z],[x,.06,z],.03,M.dark,12); }
  /* ── IBC (GEA Buck Systems 형상) : 모서리 둥근 상부 띠 · 경사 뚜껑 + 원형 투입구 · 사각 역피라미드 · 버터플라이 밸브 · 원통 다리 4 · 하부 틀 + 포크 포켓 / 받침 호퍼 ── */
  const ibc=(cx,cz,nm,mesh)=>{ const w=.55;
    for(const sx of [-1,1]) for(const sz of [-1,1]){ rod(g,[cx+sx*(w-.04),.012,cz+sz*(w-.04)],[cx+sx*(w-.04),1.36,cz+sz*(w-.04)],.045,M.ss,24); rod(g,[cx+sx*(w-.04),0,cz+sz*(w-.04)],[cx+sx*(w-.04),.012,cz+sz*(w-.04)],.05,M.ssD,24); }
    for(const sz of [-1,1]) bx(g,cx-w+.04,cx+w-.04,.2,.32,cz+sz*(w-.04)-.025,cz+sz*(w-.04)+.025,M.ss); for(const sx of [-1,1]){ bx(g,cx+sx*(w-.04)-.025,cx+sx*(w-.04)+.025,.2,.32,cz-w+.04,cz+w-.04,M.ss); bx(g,cx+sx*.28-.11,cx+sx*.28+.11,.06,.2,cz-w+.02,cz+w-.02,M.ssD); bx(g,cx+sx*.28-.095,cx+sx*.28+.095,.075,.185,cz-w+.015,cz+w-.015,M.dark); }
    rrect(g,cx,cz,w,w,.09,1.34,1.54,M.ss); frustum(g,cx,1.54,1.62,cz,.56,.56,2*w-.06,2*w-.06,M.ss); frustum(g,cx,.62,1.34,cz,2*w-.04,2*w-.04,.2,.2,M.ss);
    rod(g,[cx,1.62,cz],[cx,1.66,cz],.21,M.ssMir,36); rod(g,[cx,1.66,cz],[cx,1.672,cz],.225,M.ss,36); rod(g,[cx+.225,1.666,cz],[cx+.26,1.666,cz],.012,M.ssD,8);
    rod(g,[cx,.5,cz],[cx,.62,cz],.09,M.ssMir,28); rod(g,[cx,.53,cz],[cx,.57,cz],.105,M.ss,28); rod(g,[cx,.55,cz],[cx+.3,.55,cz+.14],.011,M.ssMir); rod(g,[cx+.3,.55,cz+.14],[cx+.34,.55,cz+.16],.016,M.dark,10);
    decal(g,.2,.05,textTex("GEA  Buck Systems","#2a2d30",512,128,44),[cx-w-.002,1.46,cz+.25],-Math.PI/2);
    plate(g,.24,.08,labelTex([[nm,"#111",70]],{w:512,h:170,border:"#333"}),[cx-w-.003,1.44,cz-.2],-Math.PI/2);
    decal(g,.3,.04,textTex("OPEN          CLOSED","#3a3d40",640,90,44),[cx-.2,.8,cz],-Math.PI/2);
    /* 받침 호퍼 : 사각 함 · 흰 테두리 원형 개구부(백당 = 망 있음) · 앞면 위생 클램프 배출구 · 검은 받침발 */
    bx(g,cx-.21,cx+.21,.12,.4,cz-.21,cz+.21,M.ssMir); for(const sx of [-1,1]) for(const sz of [-1,1]) bx(g,cx+sx*.17-.03,cx+sx*.17+.03,0,.12,cz+sz*.17-.03,cz+sz*.17+.03,M.dark);
    rod(g,[cx,.4,cz],[cx,.412,cz],.19,M.white,36); rod(g,[cx,.412,cz],[cx,.415,cz],.15,mesh?M.emboss:M.dark,36); if(!mesh) cone(g,[cx,.3,cz],[cx,.41,cz],.04,.148,M.ssMir,28);
    for(let k=0;k<8;k++){ const a=k*Math.PI/4+.3; rod(g,[cx+Math.cos(a)*.175,.412,cz+Math.sin(a)*.175],[cx+Math.cos(a)*.175,.418,cz+Math.sin(a)*.175],.007,M.dark,8); }
    rod(g,[cx-.21,.2,cz],[cx-.3,.2,cz],.03,M.ssMir,18); rod(g,[cx-.3,.2,cz],[cx-.315,.2,cz],.042,M.ss,18);
    return [cx-.315,.2,cz]; };
  const oS=ibc(6.75,2.22,"백당",true), oA=ibc(6.75,.8,"첨가제",false);
  for(const [dx,dz] of [[0,0],[.16,0],[.08,.14],[.24,.14]]) rod(g,[7.5+dx,0,.25+dz],[7.5+dx,.13,.25+dz],.07,M.white,24);          /* 흰 수지 마개 4 (받침 호퍼 보관용) */
  /* 진공호스 : 받침 호퍼 → 바닥 → 2층 데크 → 호퍼 1(첨가제) · 3(백당) 진공이송기 (두 가닥 함께) */
  const hz=F.z0-.12;
  tube(g,[oA,[oA[0]-.25,.08,oA[2]],[5.9,.05,.95],[5.75,.6,hz+.1],[5.6,2.3,hz],[4.6,3.1,hz+.2],[FM.xf+.3,F.top+.3,zc-.5],[FM.xf-.3,F.top+.22,zc-.2],[FM.xf-.37,F.top+.11,zc-.1]],.03,M.hose);
  tube(g,[oS,[oS[0]-.3,.08,oS[2]-.2],[6.0,.05,1.2],[5.82,.6,hz+.16],[5.68,2.3,hz+.06],[5.4,3.2,hz+.3],[4.6,F.top+.2,zc-.4],[FM.xf+.6,F.top+.16,zc-.2],[FM.xf+.49,F.top+.11,zc-.1]],.03,M.hose);
  /* ── 저울 작업대 2대 (북서 · 벽을 따라 세로) ── */
  for(const z0 of [.25,1.4]){ bx(g,.12,.72,.78,.82,z0,z0+1.0,M.ss); for(const x of [.16,.68]) for(const z of [z0+.05,z0+.95]) bx(g,x-.02,x+.02,.03,.78,z-.02,z+.02,M.ss);
    bx(g,.16,.68,.2,.22,z0+.05,z0+.95,M.ss); bx(g,.26,.56,.82,.88,z0+.3,z0+.62,M.white); bx(g,.3,.52,.88,.89,z0+.34,z0+.58,M.ssMir); bx(g,.3,.52,.82,.9,z0+.66,z0+.74,M.dark); }
  /* ── 드럼리프터 (북동 보관 · 원료투입구로 이동해 사용) : 높은 마스트(기둥 2 + 판) · 승강 발판(난간) · 뒤쪽 구동함 · 빨간 캐스터 ── */
  { const LG=new T3.Group(); LG.position.set(10.75,0,1.8); LG.rotation.y=Math.PI; g.add(LG); FILLLIFT=LG; const x=0, z=0, mh=3.1;   /* 보관 시 발판이 동쪽 벽 쪽 (현장 사진) */
    for(const s of [-1,1]) bx(LG,x-.05,x+.05,.1,mh,z+s*.27-.04,z+s*.27+.04,M.ss); bx(LG,x-.01,x+.01,.5,mh,z-.23,z+.23,M.ss); bx(LG,x-.06,x+.06,mh-.06,mh,z-.31,z+.31,M.ss); bx(LG,x-.07,x+.4,.06,.12,z-.33,z+.33,M.ssD);
    rrect(LG,x+.3,z,.2,.26,.05,.12,.78,M.ss); rod(LG,[x+.3,.78,z-.1],[x+.3,.82,z-.1],.014,M.red,10); tube(LG,[[x+.12,.7,z+.1],[x+.1,1.1,z+.14],[x+.08,1.5,z+.1],[x+.06,1.9,z+.12]],.012,M.dark);
    rod(LG,[x+.52,.95,z-.2],[x+.52,.95,z+.2],.012,M.ssMir,10); for(const s of [-1,1]) rod(LG,[x+.48,.78,z+s*.2],[x+.52,.95,z+s*.2],.012,M.ssMir,10);
    bx(LG,x-.9,x-.05,.14,.165,z-.36,z+.36,M.ssMir); bx(LG,x-.9,x-.05,.1,.14,z-.36,z+.36,M.ss);
    for(const s of [-1,1]){ rod(LG,[x-.86,.165,z+s*.34],[x-.86,.5,z+s*.34],.012,M.ssMir); rod(LG,[x-.12,.165,z+s*.34],[x-.12,.5,z+s*.34],.012,M.ssMir); rod(LG,[x-.86,.5,z+s*.34],[x-.12,.5,z+s*.34],.012,M.ssMir); rod(LG,[x-.86,.33,z+s*.34],[x-.12,.33,z+s*.34],.008,M.ssMir); }
    for(const [dx,dz] of [[-.8,-.3],[-.8,.3],[.3,-.26],[.3,.26]]) { const c=new T3.Mesh(new T3.CylinderGeometry(.055,.055,.04,20),M.red); c.rotation.x=Math.PI/2; c.position.set(x+dx,.055,z+dz); add(LG,c); bx(LG,x+dx-.02,x+dx+.02,.06,.1,z+dz-.03,z+dz+.03,M.ssD); }
    plate(g,.42,.3,labelTex([["리프터 사용 규칙","#111",44],["3인 1조","#c00",52],["(1명 운전 · 2명 하역)","#111",34]],{w:512,h:360,border:"#1f5fb8"}),[RM.fill.x1-.03,1.6,2.9],-Math.PI/2); }
  /* ── 예비 은박 (남동) : 스테인리스 팔레트 + 은박 롤 ── */
  { const x=10.95, z=6.2; bx(g,x-.55,x+.55,.1,.16,z-.5,z+.5,M.ss); for(const dx of [-.45,0,.45]) bx(g,x+dx-.04,x+dx+.04,0,.1,z-.5,z+.5,M.ss);
  /* ── 은박 교체 대차 (남동 예비 은박 자리에 보관 · 교체 시 언와인더 옆으로 이동 — 사용자 확정 11/11) : 스테인리스 틀 · 캐스터 · 받침 롤러 · 흰 포장 롤 ── */
  { const G=new T3.Group(); G.position.set(9.9,0,5.9); g.add(G); FILLCART=G;
    for(const x of [-.2,.2]) for(const z of [-.42,.42]){ bx(G,x-.02,x+.02,.09,.62,z-.02,z+.02,M.ss); rod(G,[x,.045,z],[x,.045,z+.03],.045,M.dark,16); bx(G,x-.015,x+.015,.07,.1,z-.015,z+.015,M.ssD); }
    for(const y of [.2,.6]){ for(const z of [-.42,.42]) bx(G,-.2,.2,y,y+.03,z-.015,z+.015,M.ss); for(const x of [-.2,.2]) bx(G,x-.015,x+.015,y,y+.03,-.42,.42,M.ss); }
    for(const x of [-.09,.09]) rod(G,[x,.65,-.44],[x,.65,.44],.03,M.dark,16); rod(G,[-.26,.9,-.42],[-.26,.9,.42],.012,M.ssMir,10); for(const z of [-.42,.42]) rod(G,[-.2,.62,z],[-.26,.9,z],.012,M.ssMir,10);
    const wt=tex(cvs(512,256,(c)=>{ c.fillStyle="#f4f5f5"; c.fillRect(0,0,512,256); c.fillStyle="#2d55a8"; c.font="bold 40px Arial"; for(let j=0;j<3;j++) for(let i=0;i<3;i++) c.fillText("SOLPAC",20+i*170+(j%2)*60,60+j*80); }),2,1,true);
    const r=new T3.Mesh(new T3.CylinderGeometry(.16,.16,.86,48,1,true),new T3.MeshStandardMaterial({map:wt,roughness:.45})); r.rotation.x=Math.PI/2; r.position.set(0,.81,0); add(G,r);
    for(const s of [-1,1]){ const c=new T3.Mesh(new T3.RingGeometry(.045,.16,40),M.foilP.clone()); c.material.side=T3.DoubleSide; c.position.set(0,.81,s*.43); G.add(c); rod(G,[0,.81,s*.4],[0,.81,s*.44],.045,new T3.MeshStandardMaterial({color:0xb08a52,roughness:.8}),20); } }
    for(const [dz,m] of [[-.25,M.foil],[.25,M.foilP]]){ const r=new T3.Mesh(new T3.CylinderGeometry(.22,.22,.95,40),m); r.rotation.z=Math.PI/2; r.position.set(x,.38,z+dz); add(g,r); rod(g,[x-.5,.38,z+dz],[x+.5,.38,z+dz],.04,M.dark,16); } }
  /* ── 출입문 2 (남쪽 벽) : 양개문 · 유리창 ── */
  for(const x0 of [.7,8.3]){ const z=RM.fill.z1-.03; bx(g,x0-.05,x0+1.05,0,2.15,z-.02,z,M.alu); for(const dx of [0,.5]){ bx(g,x0+dx+.01,x0+dx+.49,.02,2.1,z-.03,z-.02,M.white); bx(g,x0+dx+.1,x0+dx+.4,1.2,1.8,z-.034,z-.03,glass); rod(g,[x0+(dx?.56:.44),1.0,z-.06],[x0+(dx?.56:.44),1.12,z-.06],.01,M.ssMir); } }
  /* ── 소화기 (진공청소기는 구현하지 않음 — 사용자 지시 11/11) ── */
  rod(g,[.3,.05,6.5],[.3,.5,6.5],.06,M.red,18); rod(g,[.3,.5,6.5],[.3,.58,6.5],.02,M.dark,10);
  return g;
}
