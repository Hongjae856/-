/* ═══ 포장실 공통 도구 · 스틱공급장치 (Hoonga) — 현장 사진 · 영상 판독 (DRAWING.md 7-7 · 7-8 · 9-4)
   라인 중심 x=CVX, 흐름 남 → 북(−z), 설비 정면 = 동쪽(+x, 작업자 통로). 판넬은 장비 동남쪽 회전 암 ═══ */
const PB={ beacon(g,x,y,z){ rod(g,[x,y,z],[x,y+.32,z],.011,M.ssMir,10); for(const [k,m] of [[0,M.green],[1,M.orange],[2,M.red]]) rod(g,[x,y+.32+k*.055,z],[x,y+.372+k*.055,z],.028,m,18); rod(g,[x,y+.485,z],[x,y+.5,z],.03,M.ssD,18); },
  legs(g,x0,x1,z0,z1,h,mat){ for(const x of [x0,x1]) for(const z of [z0,z1]){ bx(g,x-.022,x+.022,.05,h,z-.022,z+.022,mat||M.ss); rod(g,[x,.012,z],[x,.05,z],.008,M.ssMir,8); rod(g,[x,0,z],[x,.012,z],.03,M.ssD,16); } },
  sign(g,w,h,lines,o,pos,ry){ return plate(g,w,h,labelTex(lines,o),pos,ry); },
  warn(g,x,y,z,ry){ return plate(g,.05,.05,labelTex([["⚠","#111",150]],{w:128,h:128,bg:"#f5d400"}),[x,y,z],ry); },
  frame(g,x0,x1,y0,y1,z0,z1,mat){ const t=.022; for(const x of [x0,x1]) for(const z of [z0,z1]) bx(g,x-t,x+t,y0,y1,z-t,z+t,mat); for(const y of [y0,y1]){ for(const z of [z0,z1]) bx(g,x0,x1,y-t,y+t,z-t,z+t,mat); for(const x of [x0,x1]) bx(g,x-t,x+t,y-t,y+t,z0,z1,mat); } },
  panel(g,x,y,z,ry,brand){ const G=new T3.Group(); G.position.set(x,y,z); G.rotation.y=ry; g.add(G);           /* 흰 판넬 함 · 터치화면 · START/STOP/RESET · 비상정지 (정면 +x) */
    bx(G,-.05,.05,-.24,.24,-.2,.2,M.white); bx(G,.05,.054,-.02,.21,-.17,.17,M.dark); bx(G,.054,.056,0,.19,-.15,.15,M.scr);
    for(const [k,m] of [[0,M.white],[1,M.dark],[2,M.blue]]) { rod(G,[.05,-.08,-.12+k*.07],[.065,-.08,-.12+k*.07],.016,m,14); rod(G,[.05,-.08,-.12+k*.07],[.054,-.08,-.12+k*.07],.022,M.ssD,14); }
    rod(G,[.05,-.08,.13],[.072,-.08,.13],.026,M.red,16); rod(G,[.05,-.08,.13],[.056,-.08,.13],.036,M.yellow,16);
    if(brand) plate(G,.12,.03,labelTex([[brand,"#2d55a8",70]],{w:320,h:80}),[.052,-.19,0],Math.PI/2); return G; } };
const PK2={ P:.1, bucketP:.1, bucketY:.96, xb:CVX, bx0:CVX-.13, bx1:CVX+.13, cx:CVX+.32, yC:.94, carton:{L:.12,W:.09,H:.065}, lf:[-2.85,-2.05], bz0:-.37, bz1:-5.25,
  ch:[-1.10,-1.20], chY:1.06, tiers:[1.06,1.14,1.22], topY:1.52, tc:{z0:-.45, z1:-1.5, r:9*.07/(2*Math.PI)} };   /* 버킷 간격 = 카톤 체인 간격 0.10 · 버킷 줄(뒤, x=CVX) · 카톤 줄(앞) · 적재부 칸 A/B (추정, 확인 필요) */
function buildStickFeeder(g){
  const X=CVX, xb=PK2.xb, [z0,z1]=PKZ.sf, zm=(z0+z1)/2, x0=X-.46, x1=X+.42, Hf=1.86, wf=new T3.MeshStandardMaterial({color:0xeef0f1,metalness:.35,roughness:.4});
  /* 받침 · 흰 프로파일 틀 · 뒤판 · 하부 함(버킷 뒤) · 북쪽 진회색 옆판 · 환기 팬 */
  bx(g,x0-.02,x1+.02,.06,.12,z0-.02,z1+.02,M.steel); for(const x of [x0+.05,x1-.05]) for(const z of [z0+.05,z1-.05]) rod(g,[x,0,z],[x,.06,z],.035,M.ssD,16);
  PB.frame(g,x0,x1,.12,Hf,z0,z1,wf); bx(g,x1-.022,x1+.022,.12,Hf,zm-.022,zm+.022,wf);
  bx(g,x0+.022,x0+.04,.12,Hf-.02,z0+.02,z1-.02,M.ss); bx(g,x0+.04,PK2.bx0-.05,.12,.86,z0+.02,z1-.02,M.ss);
  bx(g,x0+.04,X+.42,.12,Hf-.02,z0-.006,z0+.004,M.steel); for(let k=0;k<6;k++) bx(g,x0+.12,x0+.26,1.62+k*.022,1.632+k*.022,z0-.012,z0-.006,M.dark);
  /* 흰 버킷 컨베이어 (스틱공급장치 → 설명서 → 카토너) : 위 · 아래 벨트판 · 양 끝 스프로킷 드럼 · 뒤 가이드 · 앞 가이드(카토너 밀어넣기 구간 전까지). 칸막이 날개는 pack_anim */
  const bw=new T3.MeshStandardMaterial({color:0xf3f4f2,roughness:.45}); PK2.bw=bw; const r=(110*PK2.P-2*(PK2.bz0-PK2.bz1))/(2*Math.PI); PK2.loopR=r;
  bx(g,PK2.bx0,PK2.bx1,.92,.95,PK2.bz1,PK2.bz0,bw); bx(g,PK2.bx0+.01,PK2.bx1-.01,.89,.92,PK2.bz1,PK2.bz0,M.ss);
  bx(g,PK2.bx0,PK2.bx1,.95-2*r-.03,.95-2*r,PK2.bz1,PK2.bz0,bw);
  for(const z of [PK2.bz0,PK2.bz1]){ const c=new T3.Mesh(new T3.CylinderGeometry(r-.02,r-.02,.26,40),bw); c.rotation.z=Math.PI/2; c.position.set(xb,.95-r,z); add(g,c); rod(g,[PK2.bx1,.95-r,z],[PK2.bx1+.05,.95-r,z],.04,M.ssMir,20); rod(g,[PK2.bx0-.05,.95-r,z],[PK2.bx0,.95-r,z],.04,M.ssMir,20); }
  bx(g,PK2.bx0-.03,PK2.bx0,.89,1.045,PK2.bz1,PK2.bz0,M.ss); bx(g,PK2.bx1,PK2.bx1+.02,.89,1.0,-3.0,PK2.bz0,M.ss);
  for(const z of [z1-.3,zm,z0+.3,-2.5,-3.4,-4.3,-5.0]) bx(g,PK2.bx0-.03,PK2.bx1,.12,.89,z-.02,z+.02,M.ss);
  /* 상단 버킷 체인 (Hoonga) : 경사 컨베이어 끝(z0)에서 스틱을 1칸에 1포씩 받아 북쪽으로 → 북쪽 스프로킷(노란 화살표)을 돌아
     아래 줄(뒤집힌 칸)로 남쪽 복귀 → 정렬기 위 투입구에서 칸에서 그대로 떨어짐. 칸막이는 pack_anim (간격 = 경사 컨베이어 칸 간격) */
  const T=PK2.tc, yU=PK2.topY, yL=yU-2*T.r;
  bx(g,xb-.09,xb+.09,yU-.012,yU-.004,T.z1,T.z0,bw); bx(g,xb-.09,xb+.09,yL+.012,yL+.02,T.z1,T.z0,bw);                 /* 위 · 아래 체인 바닥 */
  bx(g,xb-.1,xb+.1,yL+.03,yU-.02,T.z1+.02,T.z0-.02,M.ss);                                                              /* 체인 몸체 */
  bx(g,xb-.07,xb+.07,yL-.012,yL-.008,T.z1-.02,PK2.ch[0]+.06,M.ssMir);                                                   /* 아래 줄 받침 안내판 (투입구 앞에서 끝) */
  for(const z of [T.z0,T.z1]){ for(const x of [xb-.1,xb+.1]){ const d=new T3.Mesh(new T3.CylinderGeometry(T.r+.02,T.r+.02,.008,40),M.ss); d.rotation.z=Math.PI/2; d.position.set(x,yU-T.r,z); add(g,d); } rod(g,[xb-.12,yU-T.r,z],[xb+.12,yU-T.r,z],.016,M.ssMir,14); }
  plate(g,.08,.08,labelTex([["⟳","#111",150]],{w:160,h:160,bg:"#f5d400"}),[xb+.105,yU-T.r,T.z1],Math.PI/2); rod(g,[xb+.105,yU-T.r,T.z1],[xb+.13,yU-T.r,T.z1],.035,M.ssMir,18);
  bx(g,xb+.1,xb+.104,yU-.05,yU+.04,T.z1,T.z0,M.acryl); bx(g,xb-.104,xb-.1,yU-.05,yU+.04,T.z1,T.z0,M.ss);
  decal(g,.42,.08,textTex("Hoonga","#ffffff",512,100,84),[xb+.106,yU-.01,(T.z0+T.z1)/2+.15],Math.PI/2);
  for(const z of [T.z0-.15,T.z1+.3]) bx(g,x0+.04,xb-.1,yU-.1,yU-.06,z-.02,z+.02,M.ss);
  /* 정렬기 : 3단(아래 · 가운데 · 위) × 좌(남, 칸 A) · 우(북, 칸 B) — 단마다 가운데 삼각 가름대, 칸 바닥 게이트(좌우 날개, pack_anim)
     앞이 트인 함 : 검은 뒤판 · 파란 옆판 · 투명 앞판 · 별 손잡이 · 볼트 4 */
  { const sz=(PK2.ch[0]+PK2.ch[1])/2, y0=1.0, y1=1.3, hx=.14;
    bx(g,xb-hx-.01,xb-hx,y0,y1,sz-.13,sz+.13,M.black); for(const s2 of [-1,1]) bx(g,xb-hx,xb+hx+.02,y0,y1,sz+s2*.13-.006,sz+s2*.13+.006,M.blue);
    bx(g,xb+hx+.004,xb+hx+.01,y0,y1,sz-.13,sz+.13,M.acryl); for(const [dy,dz] of [[y0+.03,-.1],[y0+.03,.1],[y1-.03,-.1],[y1-.03,.1]]) rod(g,[xb+hx+.01,dy,sz+dz],[xb+hx+.03,dy,sz+dz],.014,M.ssMir,12);
    { const k=new T3.Mesh(new T3.CylinderGeometry(.03,.03,.03,8),M.black); k.rotation.z=Math.PI/2; k.position.set(xb+hx+.035,(y0+y1)/2,sz+.16); add(g,k); }
    for(const z of [PK2.ch[0]+.05,PK2.ch[1]-.05]) bx(g,xb-hx,xb+hx,y0,y1,z-.004,z+.004,M.dark);
    for(const yt of PK2.tiers){ const sh=new T3.Shape(); sh.moveTo(-.012,0); sh.lineTo(.012,0); sh.lineTo(0,.065); sh.lineTo(-.012,0); const t=new T3.Mesh(new T3.ExtrudeGeometry(sh,{depth:2*hx,bevelEnabled:false}),M.dark); t.rotation.y=Math.PI/2; t.position.set(xb-hx,yt,sz); add(g,t); }
    PK2.gates=[[],[]]; for(let c=0;c<2;c++) for(let ti=0;ti<3;ti++){ const zc=PK2.ch[c], pair=[]; for(const s2 of [-1,1]){ const G=new T3.Group(); G.position.set(xb,PK2.tiers[ti],zc+s2*.046); g.add(G); bx(G,-.12,.12,-.004,0,s2>0?-.044:0,s2>0?0:.044,M.ssD); pair.push({G,s:s2}); } PK2.gates[c].push(pair); }
    bx(g,xb-hx,xb+hx,y1,y1+.006,sz-.13,sz+.13,M.acryl); }
  /* 불량 파우치 배출함 (적재부 남쪽 위 앞 · 손잡이) · 수동 투입함(북쪽 · 표지) */
  bx(g,X+.13,X+.36,1.25,1.39,zm+.18,zm+.48,M.acryl); rod(g,[X+.37,1.35,zm+.28],[X+.37,1.35,zm+.38],.006,M.ssMir,8);
  bx(g,X+.14,X+.36,1.06,1.24,z0+.06,z0+.42,M.acryl); bx(g,X+.14,X+.36,1.05,1.06,z0+.06,z0+.42,M.ss); for(const dz of [.18,.3]) bx(g,X+.15,X+.35,1.06,1.16,z0+.06+dz-.002,z0+.06+dz+.002,M.acryl);
  PB.sign(g,.3,.1,[["※ 반드시 투입한 손으로, 동작 버튼을 누르세요!","#1565c0",30],["예) 오른손 투입 → 오른손으로 버튼 조작","#111",26],["타인은 동작 버튼 조작 금지!","#c00",28]],{w:768,h:250,border:"#c2185b"},[X+.362,1.3,z0+.24],Math.PI/2);
  /* 정면 2짝 아크릴 문 · 손잡이 · 표지 */
  for(const [a,b] of [[z0+.02,zm-.02],[zm+.02,z1-.02]]){ bx(g,x1-.004,x1+.004,.14,Hf-.03,a,b,M.acryl); rod(g,[x1+.03,.9,zm+(a<zm?-.06:.06)],[x1+.03,1.2,zm+(a<zm?-.06:.06)],.008,M.ssMir,8); for(const y of [.9,1.2]) rod(g,[x1,y,zm+(a<zm?-.06:.06)],[x1+.03,y,zm+(a<zm?-.06:.06)],.006,M.ssMir,6); }
  PB.sign(g,.12,.16,[["DANGER","#fff",50],["재해발생","#111",44],["위험장소","#111",44]],{w:256,h:340,bg:"#fff",border:"#c00"},[x1+.006,1.66,zm+.42],Math.PI/2);
  for(const [y,z] of [[1.66,zm+.6],[1.12,z0+.6],[.6,zm-.3],[.6,zm+.3]]) PB.warn(g,x1+.006,y,z,Math.PI/2);
  decal(g,.36,.07,textTex("Hoonga","#2a2d30",512,100,80),[x1+.006,1.74,zm-.35],Math.PI/2);
  PB.beacon(g,x0+.1,Hf,z1-.1);
  /* 판넬 : 동남쪽 회전 암 (PanelView · START 흰 · STOP 검 · RESET 파랑 · 비상정지) */
  bx(g,x1+.0,x1+.3,1.62,1.66,z1-.04,z1+.0,M.alu); rod(g,[x1+.28,1.66,z1-.02],[x1+.28,1.5,z1-.02],.02,M.alu,12);
  PB.panel(g,x1+.33,1.3,z1+.12,0,"Hoonga");
  /* 앞 회색 대차 · 회색 바구니 2 (양품 파우치 임시 보관) · 노란 체인 차단줄 */
  { const cx=x1+.75, cz=zm; for(const y of [.2,.62]) bx(g,cx-.28,cx+.28,y,y+.025,cz-.35,cz+.35,M.grey); for(const dx of [-.26,.26]) for(const dz of [-.33,.33]){ bx(g,cx+dx-.015,cx+dx+.015,.07,.64,cz+dz-.015,cz+dz+.015,M.grey); rod(g,[cx+dx,.035,cz+dz],[cx+dx,.035,cz+dz+.02],.035,M.dark,12); }
    for(const dz of [-.17,.17]){ bx(g,cx-.2,cx+.2,.645,.8,cz+dz-.15,cz+dz+.15,M.grey); bx(g,cx-.18,cx+.18,.66,.8,cz+dz-.13,cz+dz+.13,M.dark); } }
  tube(g,[[x1+.05,.6,z0+.02],[x1+.25,.45,(z0+PKZ.ct[1])/2],[x1+.05,.6,PKZ.ct[1]-.02]],.011,M.yellow);
}
