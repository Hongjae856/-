/* ═══ 충전실 주변 : 북쪽 벽 유리창 · 개구부, 경사 컨베이어, 프린터 컨트롤러 거치대, IBC 2기 · 받침 호퍼 · 진공호스,
       저울 작업대 2대(북서), 드럼리프터(북동), 예비 은박(남동), 출입문 2(남) — DRAWING.md 6 · 8절 ═══ */
let FILLCART=null, FILLLIFT=null, FILLPROP={}, FILLAIR=null;
/* 주성분 봉투 (흰 PE 봉투 · 묶은 목) */
function bagMesh(x,y,z){ const G=new T3.Group(), m=new T3.MeshStandardMaterial({color:0xf4f6f7,roughness:.55,transparent:true,opacity:.92}); const b=new T3.Mesh(new T3.SphereGeometry(.14,20,14),m); b.scale.set(1,.9,.8); b.position.set(x,y+.13,z); G.add(b); const n=new T3.Mesh(new T3.CylinderGeometry(.02,.035,.08,12),m); n.position.set(x,y+.27,z); G.add(n); return G; }   /* 대차 · 리프터 · 예비 은박 롤 · STS 용기 (workers.js 가 상태에 맞춰 움직임) */
function buildFillZone(S){
  const g=new T3.Group(); S.add(g); const F=FL, zc=F.zc, H=RM.fill.h;
  /* ── 북쪽 벽 : 유리창 2 (컨베이어 양옆) · 사각 개구부(스테인리스 테두리) · 인터폰 ── */
  const glass=new T3.MeshPhysicalMaterial({color:0x9fc4d6,roughness:.05,metalness:0,transparent:true,opacity:.45});
  for(const x0 of [CVX-1.25,CVX+.3]){ bx(g,x0,x0+.95,1.05,2.15,.026,.034,glass); for(const [a,b,c,d] of [[x0-.04,x0+.99,1.01,1.05],[x0-.04,x0+.99,2.15,2.19],[x0-.04,x0,1.01,2.19],[x0+.95,x0+.99,1.01,2.19]]) bx(g,a,b,c,d,.02,.045,M.alu); }
  for(const [a,b,c,d] of [[CVX-.2,CVX+.2,.94,.98],[CVX-.2,CVX+.2,1.62,1.66],[CVX-.2,CVX-.16,.94,1.66],[CVX+.16,CVX+.2,.94,1.66]]) bx(g,a,b,c,d,.0,.09,M.ss);
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
    for(const sz of [-1,1]) bx(g,cx-w+.04,cx+w-.04,.2,.32,cz+sz*(w-.04)-.025,cz+sz*(w-.04)+.025,M.ss); for(const sx of [-1,1]) bx(g,cx+sx*(w-.04)-.025,cx+sx*(w-.04)+.025,.2,.32,cz-w+.04,cz+w-.04,M.ss);
    for(const s2 of [-1,1]){ bx(g,cx-w+.02,cx+w-.02,.06,.2,cz+s2*.385-.085,cz+s2*.385+.085,M.ssD); bx(g,cx-w+.015,cx+w-.015,.075,.185,cz+s2*.385-.07,cz+s2*.385+.07,M.dark); }      /* 포크 포켓 : 동서 방향 · 받침 호퍼가 사이에 놓임 */
    rrect(g,cx,cz,w,w,.09,1.34,1.54,M.ss); frustum(g,cx,1.54,1.62,cz,.56,.56,2*w-.06,2*w-.06,M.ss); frustum(g,cx,.62,1.34,cz,2*w-.04,2*w-.04,.2,.2,M.ss);
    rod(g,[cx,1.62,cz],[cx,1.66,cz],.21,M.ssMir,36); rod(g,[cx,1.66,cz],[cx,1.672,cz],.225,M.ss,36); rod(g,[cx+.225,1.666,cz],[cx+.26,1.666,cz],.012,M.ssD,8);
    rod(g,[cx,.5,cz],[cx,.62,cz],.09,M.ssMir,28); rod(g,[cx,.53,cz],[cx,.57,cz],.105,M.ss,28); rod(g,[cx,.55,cz],[cx+.3,.55,cz+.14],.011,M.ssMir); rod(g,[cx+.3,.55,cz+.14],[cx+.34,.55,cz+.16],.016,M.dark,10);
    decal(g,.2,.05,textTex("GEA  Buck Systems","#2a2d30",512,128,44),[cx-w-.002,1.46,cz+.25],-Math.PI/2);
    plate(g,.24,.08,labelTex([[nm,"#111",70]],{w:512,h:170,border:"#333"}),[cx-w-.003,1.44,cz-.2],-Math.PI/2);
    decal(g,.3,.04,textTex("OPEN          CLOSED","#3a3d40",640,90,44),[cx-.2,.8,cz],-Math.PI/2);
    /* 받침 호퍼 : IBC 하부 틀 안 · 포크 포켓 사이에 놓임. 사각 함 · 흰 테두리 원형 개구부(백당 = 망 있음) · 검은 받침발 ·
       배출구는 함 바닥 서쪽 아래(틀 가로대 밑 · 포크 포켓 사이)로 나와 충전기 쪽을 향함 → 진공호스가 틀과 겹치지 않음 (사용자 지적 · 확정 11/12) */
    const hh=.2; bx(g,cx-hh,cx+hh,.13,.4,cz-hh,cz+hh,M.ssMir); for(const sx of [-1,1]) for(const s2 of [-1,1]) bx(g,cx+sx*.16-.03,cx+sx*.16+.03,0,.13,cz+s2*.16-.03,cz+s2*.16+.03,M.dark);
    rod(g,[cx,.4,cz],[cx,.412,cz],.185,M.white,36); rod(g,[cx,.412,cz],[cx,.415,cz],.148,mesh?M.emboss:M.dark,36); if(!mesh) cone(g,[cx,.3,cz],[cx,.41,cz],.04,.146,M.ssMir,28);
    for(let k=0;k<8;k++){ const a=k*Math.PI/4+.3; rod(g,[cx+Math.cos(a)*.17,.412,cz+Math.sin(a)*.17],[cx+Math.cos(a)*.17,.418,cz+Math.sin(a)*.17],.007,M.dark,8); }
    frustum(g,cx,.085,.13,cz,.2,.2,.07,.07,M.ssMir,-.04,0); rod(g,[cx-.04,.085,cz],[cx-hh-.07,.085,cz],.028,M.ssMir,18); rod(g,[cx-hh-.07,.085,cz],[cx-hh-.085,.085,cz],.04,M.ss,18);
    return [cx-hh-.085,.085,cz]; };
  const oS=ibc(6.75,2.22,"백당",true), oA=ibc(6.75,.8,"첨가제",false);
  for(const [dx,dz] of [[0,0],[.16,0],[.08,.14],[.24,.14]]) rod(g,[7.5+dx,0,.25+dz],[7.5+dx,.13,.25+dz],.07,M.white,24);          /* 흰 수지 마개 4 (받침 호퍼 보관용) */
  /* 진공호스 : 받침 호퍼 → 바닥 → 2층 데크 → 호퍼 1(첨가제) · 3(백당) 진공이송기 (두 가닥 함께) */
  const hz=F.z0-.12;
  tube(g,[[oA[0]-.12,.05,oA[2]],[6.0,.05,oA[2]+.2],[5.9,.05,1.38],[5.78,.6,hz+.1],[5.6,2.3,hz],[4.6,3.1,hz+.2],[FM.xf+.3,F.top+.3,zc-.5],[FM.xf-.3,F.top+.22,zc-.2],[FM.xf-.37,F.top+.11,zc-.1]],.028,M.hose);
  tube(g,[[oS[0]-.12,.05,oS[2]],[6.05,.05,oS[2]-.3],[5.97,.05,1.45],[5.84,.6,hz+.16],[5.68,2.3,hz+.06],[5.4,3.2,hz+.3],[4.6,F.top+.2,zc-.4],[FM.xf+.6,F.top+.16,zc-.2],[FM.xf+.49,F.top+.11,zc-.1]],.028,M.hose);
  /* 받침 호퍼 배출구 ↔ 진공호스 연결부 + 클램프 (심화 교육 : 연결 전에는 호스 끝이 배출구 옆 바닥에 분리된 채 놓임 · 11/16) */
  FILLPROP.hose=[oA,oS].map(o=>{ const H=new T3.Group(); g.add(H); tube(H,[o,[o[0]-.06,.068,o[2]],[o[0]-.12,.05,o[2]]],.028,M.hose);
    const c=new T3.Mesh(new T3.TorusGeometry(.042,.009,8,20),M.ssMir); c.rotation.y=Math.PI/2; c.position.set(o[0]-.012,o[1],o[2]); add(H,c); return H; });
  /* ── 저울 작업대 2대 (북서 · 벽을 따라 세로) ── */
  for(const z0 of [.25,1.4]){ bx(g,.12,.72,.78,.82,z0,z0+1.0,M.ss); for(const x of [.16,.68]) for(const z of [z0+.05,z0+.95]) bx(g,x-.02,x+.02,.03,.78,z-.02,z+.02,M.ss);
    bx(g,.16,.68,.2,.22,z0+.05,z0+.95,M.ss); bx(g,.26,.56,.82,.88,z0+.3,z0+.62,M.white); bx(g,.3,.52,.88,.89,z0+.34,z0+.58,M.ssMir); bx(g,.3,.52,.82,.9,z0+.66,z0+.74,M.dark); }
  /* ── 드럼리프터 (북동 보관 · 원료투입구로 이동해 사용) : 높은 마스트(기둥 2 + 판) · 승강 발판(난간) · 뒤쪽 구동함 · 빨간 캐스터 ── */
  { const LG=new T3.Group(); LG.position.set(10.75,0,1.8); LG.rotation.y=Math.PI; g.add(LG); FILLLIFT=LG; const x=0, z=0, mh=3.1;   /* 보관 시 발판이 동쪽 벽 쪽 (현장 사진) */
    const LP=idtLifterBuild(LG,mh); FILLPROP.plat=LP;                                       /* 드럼리프터 모델 = 공통 (idt_common/crewkit.js) · 승강 발판 */
    { const B=new T3.Group(); LP.add(B); FILLPROP.bagsOn=B; B.visible=false; for(const [dx,dz] of [[-.62,-.13],[-.33,.12]]){ add(B,bagMesh(x+dx,.165,z+dz)); } }   /* 적재칸 위 주성분 봉투 (STS 용기에서 옮겨 담음 · 11/16 사용자 정정) */
    plate(g,.42,.3,labelTex([["리프터 사용 규칙","#111",44],["3인 1조","#c00",52],["(1명 운전 · 2명 하역)","#111",34]],{w:512,h:360,border:"#1f5fb8"}),[RM.fill.x1-.03,1.6,2.9],-Math.PI/2); }
  /* ── 예비 은박 (남동) : 스테인리스 팔레트 + 은박 롤 ── */
  { const x=10.95, z=6.2; bx(g,x-.55,x+.55,.1,.16,z-.5,z+.5,M.ss); for(const dx of [-.45,0,.45]) bx(g,x+dx-.04,x+dx+.04,0,.1,z-.5,z+.5,M.ss);
  /* ── 은박 교체 대차 (남동 예비 은박 자리에 보관 · 교체 시 언와인더 옆으로 이동 — 사용자 확정 11/11) : 스테인리스 틀 · 캐스터 · 받침 롤러 · 흰 포장 롤 ── */
  { const G=new T3.Group(); G.position.set(9.9,0,5.9); g.add(G); FILLCART=G;
    idtCartBuild(G);                                                                     /* 대차 모델 = 공통 (idt_common/crewkit.js) */
    /* 대차 위 은박 롤 : 평소 비어 있음 — 교체하러 갈 때 예비 롤을 올림 (적색 인쇄 · 은색 무지 2종만, 11/16 사용자 지시 : SOLPAC 흰 롤 삭제) */
    for(const [k,m] of [["red",M.foil],["plain",M.foilP]]){ const r=new T3.Mesh(new T3.CylinderGeometry(.19,.19,.86,40),m); r.rotation.x=Math.PI/2; r.position.set(0,.85,0); add(G,r); r.visible=false; FILLPROP["cart_"+k]=r; } }
    for(const [k,dz,m] of [["red",-.25,M.foil],["plain",.25,M.foilP]]){ const R=new T3.Group(); g.add(R); FILLPROP["pal_"+k]=R; const r=new T3.Mesh(new T3.CylinderGeometry(.19,.19,.86,40),m); r.rotation.z=Math.PI/2; r.position.set(x,.35,z+dz); add(R,r); rod(R,[x-.46,.35,z+dz],[x+.46,.35,z+dz],.045,M.dark,16); } }
  /* 주성분 STS 파렛트 대기 장소 (맨 동쪽 중앙 · 11/16 사용자 확인) : 파렛트 + 뚜껑 연 STS 용기 + 봉투에 담긴 주성분 */
  { const x=11.2, z=3.5; bx(g,x-.5,x+.5,.1,.15,z-.5,z+.5,M.ss); for(const dx of [-.42,0,.42]) bx(g,x+dx-.04,x+dx+.04,0,.1,z-.5,z+.5,M.ss);
    const d=new T3.Mesh(new T3.CylinderGeometry(.3,.28,.62,36,1,true),M.ssMir); d.material=d.material.clone(); d.material.side=T3.DoubleSide; d.position.set(x,.46,z); add(g,d); bx(g,x-.29,x+.29,.155,.17,z-.29,z+.29,M.ss);
    rod(g,[x-.3,.77,z],[x+.3,.77,z],.004,M.ssMir,6); const lid=new T3.Mesh(new T3.CylinderGeometry(.31,.31,.02,36),M.ssMir); lid.position.set(x+.36,.6,z-.28); lid.rotation.z=1.2; add(g,lid);
    const B=new T3.Group(); g.add(B); FILLPROP.bagsIn=B; for(const [dx,dz] of [[-.1,-.08],[.1,.09]]) add(B,bagMesh(x+dx,.5,z+dz)); }
  /* ── 출입문 2 (남쪽 벽) : 양개문 · 유리창 ── */
  /* 문짝은 경첩(바깥 끝) 기준 그룹 — 자유모드에서 실내 쪽(북)으로 열림 (11/17 · free.js RDOOR) */
  const RD=(window.RDOOR=window.RDOOR||[]);
  for(const [di,x0] of [[0,.7],[1,8.3]]){ const z=RM.fill.z1-.03; bx(g,x0-.05,x0+1.05,0,2.15,z-.02,z,M.alu);
    for(const s of [1,-1]){ const G=new T3.Group(); G.position.set(s>0?x0+.01:x0+.99,0,z-.025); g.add(G); const X=(a,b)=>[Math.min(s*a,s*b),Math.max(s*a,s*b)];
      bx(G,...X(0,.48),.02,2.1,-.005,.005,M.white); bx(G,...X(.09,.39),1.2,1.8,-.009,-.005,glass); rod(G,[s*.43,1.0,-.035],[s*.43,1.12,-.035],.01,M.ssMir);
      RD.push({G, s, key:"f"+di, ang:0}); } }
  /* ── 소화기 (진공청소기는 구현하지 않음 — 사용자 지시 11/11) ── */
  rod(g,[.3,.05,6.5],[.3,.5,6.5],.06,M.red,18); rod(g,[.3,.5,6.5],[.3,.58,6.5],.02,M.dark,10);
  /* ── 압축공기 공급 : 충전기 북쪽(동쪽 끝 바깥) 천장 강하관 · 밸브 2 (공통 형상 idt_common/crewkit.js idtAirDrop · 11/20 사용자 지시 "장비 북쪽에 에어관과 밸브") ── */
  if(typeof idtAirDrop==="function") FILLAIR=idtAirDrop(g,{x:AIRDROP_P.x, z:AIRDROP_P.z, top:H, label:"압축공기 6 bar",
    valves:AIRDROP_P.y.map((y,i)=>({y, dir:[1,0], to:[F.x1-.06,.55+i*.2,F.z0+.12]}))});
  return g;
}
/* 압축공기 강하관 위치 (m) : 충전기 북동 모서리 바깥 · 작업자는 동쪽에서 접근 */
const AIRDROP_P={x:5.70, z:1.12, y:[1.25,1.45]};   /* 밸브 레버 높이 = 1인칭 가슴 높이(눈 1.55 − 0.3) 기준 1.25 m · 두 번째 1.45 m (11/23 사용자 결정 · 세 IDT 공통) */
