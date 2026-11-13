/* ═══ 케이스 프린터 · 비전(Domino) → X-ray(Ishida IX) → 중량선별기(Anritsu SSV) → 배출함 2 → 대케이스 잉크젯 프린터 → 녹색 벨트 작업대
   카톤은 세워진 채 녹색 벨트 · 누름 벨트로 이송, 라인 높이 PKZ.y — DRAWING.md 7-3 ~ 7-8 · 9-3 ═══ */
function buildInspection(g){
  const X=CVX, Y=PKZ.y;
  const belt=(z0,z1,w,mat,frame)=>{ bx(g,X-w/2-.03,X+w/2+.03,Y-.07,Y-.006,z0,z1,frame||M.ss); bx(g,X-w/2,X+w/2,Y-.006,Y,z0,z1,mat); for(const z of [z0,z1]){ const r=new T3.Mesh(new T3.CylinderGeometry(.03,.03,w,16),M.ssD); r.rotation.z=Math.PI/2; r.position.set(X,Y-.03,z); add(g,r); } };
  PK2.curt=[]; const curtain=(z)=>{ for(let k=0;k<7;k++){ const x=X-.105+k*.035, G=new T3.Group(); G.position.set(x,Y+.22,z); g.add(G); bx(G,-.015,.015,-.215,0,-.003,.003,M.blue); PK2.curt.push({G,x,z}); } };
  /* 카토너 출구 → 프린터 : 화살표 슈트 끝 아래 투명 아크릴 함(라벨 · 용도 확인 필요) */
  /* ── 케이스 프린터 · 비전 (Domino) ── */
  { const [z0,z1]=PKZ.pr, zc=(z0+z1)/2;
    belt(z0-.1,z1+.25,.14,M.green); bx(g,X-.08,X+.08,Y+.068,Y+.085,z0,z1,M.green); for(const x of [X-.1,X+.1]) bx(g,x-.008,x+.008,Y,Y+.1,z0-.1,z1+.25,M.ss);       /* 녹색 벨트 · 위 누름 벨트 · 옆 가이드 */
    for(const [dz,y] of [[-.3,Y-.12],[-.12,Y-.12],[.1,Y-.12],[-.05,Y+.22]]){ rod(g,[X+.1,y,zc+dz],[X+.17,y,zc+dz],.022,M.orange,14); bx(g,X+.17,X+.2,y-.02,y+.02,zc+dz-.03,zc+dz+.03,M.dark); }
    bx(g,X-.14,X+.22,.08,Y-.07,z0-.05,z1+.05,M.ss); bx(g,X+.22,X+.224,.42,.7,zc-.13,zc+.13,M.dark); bx(g,X+.224,X+.226,.45,.67,zc-.11,zc+.11,M.scr);
    PB.sign(g,.22,.05,[["DOMINO","#fff",80]],{w:512,h:110,bg:"#9aa0a6"},[X+.226,.3,zc],Math.PI/2); for(const dx of [-.1,.18]) for(const dz of [-.4,.4]) rod(g,[X+dx,0,zc+dz],[X+dx,.08,zc+dz],.03,M.dark,12);
    bx(g,X-.56,X-.26,.05,1.98,zc-.24,zc+.24,M.ss); bx(g,X-.26,X-.256,1.5,1.92,zc-.22,zc+.22,M.dark); bx(g,X-.256,X-.254,1.53,1.9,zc-.2,zc+.2,M.scr);      /* 비전 타워 (화면 일체형) */
    for(const [dz,m] of [[-.12,M.white],[-.05,M.dark]]) rod(g,[X-.26,1.4,zc+dz],[X-.24,1.4,zc+dz],.014,m,12); rod(g,[X-.26,1.4,zc+.12],[X-.235,1.4,zc+.12],.024,M.red,16); rod(g,[X-.26,1.4,zc+.12],[X-.252,1.4,zc+.12],.034,M.yellow,16);
    for(const y of [1.12,1.24]) { rod(g,[X-.26,y,zc-.1],[X-.2,y,zc-.1],.015,M.orange,12); rod(g,[X-.2,y,zc-.1],[X-.18,y,zc-.1],.024,M.dark,12); }
    bx(g,X+.2,X+.55,1.0,1.02,z0+.0,z0+.42,M.ss); bx(g,X+.24,X+.5,1.02,1.035,z0+.04,z0+.36,M.dark); bx(g,X+.4,X+.47,1.02,1.04,z0+.36,z0+.41,M.dark);   /* 키보드 · 마우스 받침 */
    bx(g,X+.26,X+.5,.12,.9,z0-.1,z0+.2,M.acryl); bx(g,X+.26,X+.5,.11,.12,z0-.1,z0+.2,M.ss); PB.sign(g,.18,.07,[["포장실","#111",40],["인쇄 불량","#111",44]],{w:384,h:130,border:"#333"},[X+.502,.62,z0+.05],Math.PI/2);
    rod(g,[X+.5,.85,z0+.05],[X+.52,.85,z0+.05],.012,M.brass,10);
    { const pts=[], hx=X-.2, hz=z1+.1; for(let i=0;i<=100;i++){ const t=i/100, a=t*Math.PI*2*12; pts.push([hx+Math.cos(a)*.028,1.2-t*.6,hz+Math.sin(a)*.028]); } tube(g,pts,.005,M.yellow); }
    PB.beacon(g,X-.55,1.6,zc+.2); }
  /* ── X-ray (Ishida IX) : 큰 스테인리스 함(벨트가 터널로 통과) · 위 검은 오각 패널 + 터치화면 · IX · X-RAY ON · 아래 띠(키 스위치 · 비상정지) ·
       아래 함 방사선 표지 · 파란 차폐 커튼 · U자 원형관 다리 · 경광등 ── */
  { const [z0,z1]=PKZ.xr, zc=(z0+z1)/2, xf=X+.36; belt(z0-.18,z1+.18,.2,M.dark);
    bx(g,X-.42,xf,.6,Y-.04,z0,z1,M.ssMir); bx(g,X-.42,xf,Y+.2,1.86,z0+.04,z1-.04,M.ssMir); for(const s2 of [-1,1]) bx(g,X-.42,X-.13,Y-.04,Y+.2,zc+s2*(z1-z0)/2-.04*s2-.0,zc+s2*(z1-z0)/2,M.ssMir);
    for(const z of [z0,z1]){ bx(g,X+.13,xf,Y-.04,Y+.2,z-.02,z+.02,M.ssMir); bx(g,X-.13,X+.13,Y-.04,Y+.2,z-.003,z+.003,M.dark); }
    curtain(z0-.01); curtain(z1+.01); bx(g,X-.42,X+.2,1.86,1.9,z0+.06,z1-.06,M.ss);
    { const sh=new T3.Shape(); [[-.31,-.29],[.31,-.29],[.31,.2],[.2,.31],[-.31,.31]].forEach(([a,b],i)=>i?sh.lineTo(a,b):sh.moveTo(a,b)); const m=new T3.Mesh(new T3.ShapeGeometry(sh),M.black); m.rotation.y=Math.PI/2; m.position.set(xf+.004,1.5,zc); g.add(m); }
    bx(g,xf+.005,xf+.007,1.33,1.72,zc-.22,zc+.18,M.scr); decal(g,.12,.08,textTex("IX","#e8eaec",256,160,120),[xf+.008,1.27,zc-.21],Math.PI/2);
    PB.sign(g,.1,.03,[["X-RAY ON","#fff",70]],{w:320,h:90,bg:"#d81b1b"},[xf+.008,1.25,zc+.17],Math.PI/2); decal(g,.12,.03,textTex("ISHIDA","#2a2d30",320,80,60),[xf+.006,1.82,zc-.18],Math.PI/2);
    bx(g,xf,xf+.03,Y+.22,Y+.34,z0+.06,z1-.06,M.ss); rod(g,[xf+.03,Y+.28,zc-.08],[xf+.05,Y+.28,zc-.08],.018,M.dark,14); PB.sign(g,.08,.025,[["X-RAY POWER","#111",40]],{w:320,h:80},[xf+.032,Y+.315,zc-.08],Math.PI/2);
    bx(g,xf+.03,xf+.033,Y+.24,Y+.32,zc+.12,zc+.2,M.yellow); rod(g,[xf+.033,Y+.28,zc+.16],[xf+.05,Y+.28,zc+.16],.022,M.red,16); rod(g,[xf+.03,Y+.28,zc+.32],[xf+.05,Y+.28,zc+.32],.01,M.dark,8);
    PB.sign(g,.2,.15,[["방사선기기","#111",44],["안전관리 수칙","#111",44],["☢","#c00",110]],{w:384,h:300,bg:"#f6d51c"},[xf+.002,.76,zc+.12],Math.PI/2);
    for(const [y,z] of [[.78,zc-.25],[Y+.12,z0+.08],[1.65,z1-.06]]) PB.warn(g,xf+.002,y,z,Math.PI/2);
    for(const z of [z0+.08,z1-.08]){ const u=new T3.Mesh(new T3.TorusGeometry(.38,.025,10,24,Math.PI),M.ssMir); u.rotation.z=Math.PI; u.position.set(X-.03,.6,z); add(g,u); for(const dx of [-.38,.38]){ rod(g,[X-.03+dx,.04,z],[X-.03+dx,.6,z],.025,M.ssMir,14); rod(g,[X-.03+dx,0,z],[X-.03+dx,.04,z],.035,M.ssD,16); } }
    PB.beacon(g,X-.3,1.9,zc); }
  /* ── 중량선별기 (Anritsu SSV) : 기둥형 표시부(서쪽 뒤) · 흰 계량 벨트 · 아크릴 커버 · 이어서 배출함 2 ── */
  { const [z0,z1]=PKZ.cw, zc=(z0+z1)/2; belt(z0,z1,.16,M.white); bx(g,X-.12,X+.12,Y+.006,Y+.24,z0+.08,z1-.02,M.acryl); bx(g,X-.12,X+.12,Y+.24,Y+.246,z0+.08,z1-.02,M.acryl);
    PB.legs(g,X-.12,X+.12,z0+.06,z1-.06,Y-.07);
    bx(g,X-.5,X-.3,.05,1.25,zc-.1,zc+.1,M.ss); bx(g,X-.5,X-.22,1.25,1.65,zc-.17,zc+.17,M.ss); bx(g,X-.22,X-.216,1.42,1.62,zc-.14,zc+.1,M.dark); bx(g,X-.216,X-.214,1.44,1.6,zc-.12,zc+.08,M.scr);
    for(const [dz,m] of [[-.12,M.dark],[-.06,M.red],[.0,M.green]]) rod(g,[X-.22,1.33,zc+dz],[X-.2,1.33,zc+dz],.014,m,12); bx(g,X-.22,X-.2,1.28,1.38,zc+.08,zc+.15,M.yellow); rod(g,[X-.2,1.33,zc+.115],[X-.18,1.33,zc+.115],.022,M.red,12);
    PB.sign(g,.12,.03,[["Anritsu","#fff",70]],{w:320,h:80,bg:"#2a2d30"},[X-.215,1.3,zc-.05],Math.PI/2);
    rod(g,[X-.12,Y+.1,z1+.02],[X-.08,Y+.1,z1+.02],.025,M.red,14);
    /* 배출함 2 (같은 형상) : 앞(동) = 중량선별기 불량 · 뒤(서) = X-ray 불량 — 윗면 경사 환기 슬릿 · 자물쇠 · 손잡이 */
    for(const s of [1,-1]){ const xb=X+s*.36, z=PKZ.bin; bx(g,xb-.18,xb+.18,.5,1.02,z-.2,z+.2,M.ssMir);
      const top=new T3.Group(); top.position.set(xb,1.02,z); top.rotation.x=s>0?.0:0; g.add(top); bx(top,-.18,.18,0,.09,-.2,.2,M.ss); for(let k=0;k<10;k++) bx(top,-.15,.15,.09,.095,-.18+k*.038,-.165+k*.038,M.dark);
      rod(g,[xb+s*.18,.82,z-.08],[xb+s*.22,.82,z-.08],.008,M.ssMir,8); rod(g,[xb+s*.18,.82,z+.08],[xb+s*.22,.82,z+.08],.008,M.ssMir,8); rod(g,[xb+s*.22,.82,z-.08],[xb+s*.22,.82,z+.08],.008,M.ssMir,8);
      bx(g,xb+s*.18-.01,xb+s*.18+.03,.92,.98,z-.025,z+.025,M.brass); PB.legs(g,xb-.15,xb+.15,z-.17,z+.17,.5);
      PB.sign(g,.18,.06,[["포장실",'#111',40],[s>0?"기준 중량 불량":"X-ray 불량","#111",42]],{w:384,h:130,border:"#333"},[xb+s*.182,.68,z],s>0?Math.PI/2:-Math.PI/2); } }
  /* ── 중량선별기 뒤 모음 벨트 · 끝 멈춤판 (카톤 8개가 모이면 작업자가 대케이스에 담음) ── */
  { const z0=-9.1, z1=PKZ.cw[0]; belt(z0,z1,.14,M.belt); bx(g,X-.08,X+.08,Y,Y+.08,z0-.006,z0,M.ss); for(const x of [X-.085,X+.085]) bx(g,x-.005,x+.005,Y,Y+.05,z0,z1,M.ss); PB.legs(g,X-.08,X+.08,z0+.05,z1-.05,Y-.07); }
  /* ── 대케이스 잉크젯 프린터 : 알루미늄 프레임 · 캐스터 · 검은 벨트 · 주황 노브 가이드 · Domino 소형 헤드 박스(서쪽) · 기둥 암 터치화면 · 경광등 ── */
  { const [z0,z1]=PKZ.cp, w=.42; bx(g,X-w/2-.04,X+w/2+.04,Y-.1,Y-.006,z0,z1,M.alu); bx(g,X-w/2,X+w/2,Y-.006,Y,z0,z1,M.belt);
    for(const x of [X-w/2-.02,X+w/2+.02]) for(const z of [z0+.08,(z0+z1)/2,z1-.08]){ bx(g,x-.02,x+.02,.07,Y-.1,z-.02,z+.02,M.alu); rod(g,[x,.035,z],[x,.035,z+.02],.035,M.dark,12); }
    for(const y of [.3,Y-.14]) for(const x of [X-w/2-.02,X+w/2+.02]) bx(g,x-.02,x+.02,y-.02,y+.02,z0+.08,z1-.08,M.alu);
    for(const z of [z1-.4,z1-.8]){ rod(g,[X-w/2-.04,Y+.13,z],[X-.16,Y+.13,z],.006,M.ssMir,8); rod(g,[X-.16,Y+.03,z],[X-.16,Y+.13,z],.014,M.orange,10);   /* 케이스 측면 가이드 · 감지 (케이스 통과 폭 밖) */ }
    bx(g,X-w/2-.25,X-w/2-.05,Y-.02,Y+.16,z1-.6,z1-.25,M.dark); bx(g,X-w/2-.25,X-w/2-.05,Y+.16,Y+.18,z1-.6,z1-.25,M.ss); PB.sign(g,.14,.03,[["DOMINO","#fff",60]],{w:320,h:70,bg:"#9aa0a6"},[X-w/2-.049,Y+.1,z1-.42],Math.PI/2);
    bx(g,X-w/2-.14,X-w/2-.1,.07,1.55,z1-.1,z1-.06,M.alu); rod(g,[X-w/2-.12,1.4,z1-.08],[X+.0,1.4,z1-.08],.015,M.alu,10); bx(g,X-.02,X+.02,1.2,1.42,z1-.2,z1+.04,M.dark); bx(g,X+.02,X+.022,1.23,1.4,z1-.17,z1+.01,M.scr);
    PB.beacon(g,X-w/2-.12,1.55,z1-.08); }
  /* ── 라인 끝 작업대 : 긴 스테인리스 상판 · 가운데 녹색 벨트 · 2단 다리 ── */
  { const [z0,z1]=PKZ.tb; bx(g,X-.5,X+.5,Y-.14,Y-.1,z0,z1,M.ssMir); bx(g,X-.12,X+.12,Y-.1,Y-.094,z0+.02,z1,M.green); bx(g,X-.15,X+.15,Y-.2,Y-.14,z0,z1,M.ss);
    PB.legs(g,X-.46,X+.46,z0+.08,z1-.08,Y-.14); for(const z of [z0+.08,z1-.08]) bx(g,X-.46,X+.46,.22,.26,z-.02,z+.02,M.ss); for(const x of [X-.46,X+.46]) bx(g,x-.02,x+.02,.22,.26,z0+.08,z1-.08,M.ss); }
  /* ── 수동 포장 자재 : 동쪽 벽 쪽 대박스 · 대케이스 적재 (색 · 규격 추정) ── */
  { const kr=new T3.MeshStandardMaterial({color:0xb48a5a,roughness:.85}), rc=new T3.MeshStandardMaterial({color:0xc8201c,roughness:.6});
    for(let i=0;i<3;i++) for(let j=0;j<4;j++) bx(g,7.0+i*.0,7.55,j*.32,j*.32+.3,-10.9+i*.48,-10.46+i*.48,kr);
    for(let j=0;j<6;j++) bx(g,6.1,6.6,.0+j*.04,.035+j*.04,-11.2,-10.8,rc); }
}
