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
const PK2={ bucketP:.1, bucketY:.96, bx0:CVX-.2, bx1:CVX+.06, cx:CVX+.25, carton:{L:.12,W:.09,H:.065}, lf:[-2.85,-2.05] };   /* 버킷 간격 · 버킷 윗면 · 버킷 줄(뒤) · 카톤 줄(앞) 중심 · 카톤 · 설명서 구간 (추정, 확인 필요) */
function buildStickFeeder(g){
  const X=CVX, [z0,z1]=PKZ.sf, zm=(z0+z1)/2, x0=X-.46, x1=X+.42, Hf=1.86, wf=new T3.MeshStandardMaterial({color:0xeef0f1,metalness:.35,roughness:.4});
  /* 받침 · 흰 프로파일 틀 · 뒤판 · 하부 함 */
  bx(g,x0-.02,x1+.02,.06,.12,z0-.02,z1+.02,M.steel); for(const x of [x0+.05,x1-.05]) for(const z of [z0+.05,z1-.05]){ rod(g,[x,0,z],[x,.06,z],.035,M.ssD,16); }
  PB.frame(g,x0,x1,.12,Hf,z0,z1,wf); bx(g,x1-.022,x1+.022,.12,Hf,zm-.022,zm+.022,wf);
  bx(g,x0+.022,x0+.04,.12,Hf-.02,z0+.02,z1-.02,M.ss); bx(g,x0+.04,X+.0,.12,.66,z0+.02,z1-.02,M.ss);
  for(const z of [z0+.45,zm,z1-.45]) bx(g,X-.001,X+.001,.2,.6,z-.002,z+.002,M.ssD);
  /* 흰 버킷 컨베이어 : 흰 체인 벨트 · 흰 칸막이 날개 · 남쪽 스프로킷 · 아래 복귀 구간(날개가 아래로) — 카토너까지 이어짐 */
  const bz0=z1-.12, bz1=PKZ.ct[0]+.15, Lb=bz0-bz1, bw=new T3.MeshStandardMaterial({color:0xf3f4f2,roughness:.45});
  bx(g,PK2.bx0,PK2.bx1,PK2.bucketY-.04,PK2.bucketY-.01,bz1,bz0,bw); bx(g,PK2.bx0,PK2.bx1,PK2.bucketY-.1,PK2.bucketY-.04,bz1,bz0,M.ss);
  bx(g,PK2.bx0,PK2.bx1,.5,.53,bz1,bz0,bw);
  { const n=Math.floor(Lb/PK2.bucketP), fin=new T3.InstancedMesh(new T3.BoxGeometry(.26,.075,.006),bw,n*2), o=new T3.Object3D();
    for(let k=0;k<n;k++){ const z=bz0-k*PK2.bucketP; o.position.set((PK2.bx0+PK2.bx1)/2,PK2.bucketY+.0275,z); o.rotation.set(0,0,0); o.updateMatrix(); fin.setMatrixAt(k,o.matrix); o.position.set((PK2.bx0+PK2.bx1)/2,.5-.0375,z); o.updateMatrix(); fin.setMatrixAt(n+k,o.matrix); }
    fin.castShadow=true; g.add(fin); PK2.fins=fin; PK2.finN=n; PK2.bz0=bz0; }
  for(const [z,r] of [[bz0,.19]]){ const c=new T3.Mesh(new T3.CylinderGeometry(r,r,.28,40),bw); c.rotation.z=Math.PI/2; c.position.set((PK2.bx0+PK2.bx1)/2,(PK2.bucketY+.5)/2-.02,z+.02); add(g,c); rod(g,[PK2.bx1,(PK2.bucketY+.5)/2-.02,z+.02],[PK2.bx1+.04,(PK2.bucketY+.5)/2-.02,z+.02],.05,M.ssMir,20); }
  for(let k=0;k<12;k++){ const a=k/12*Math.PI*2, zz=bz0+.02+Math.cos(a)*.2, yy=(PK2.bucketY+.5)/2-.02+Math.sin(a)*.2; if(Math.cos(a)>0) bx(g,PK2.bx0+.01,PK2.bx1-.01,yy-.003,yy+.003,zz-.035,zz+.035,bw).rotation.x=a; }
  bx(g,PK2.bx0-.03,PK2.bx0,PK2.bucketY-.08,PK2.bucketY+.1,PK2.lf[0],bz0,M.ss); bx(g,PK2.bx1,PK2.bx1+.02,PK2.bucketY-.08,PK2.bucketY+.03,PK2.lf[0],bz0,M.ss);      /* 버킷 양옆 가이드 */
  bx(g,PK2.bx0-.03,PK2.bx1+.02,.16,PK2.bucketY-.1,PK2.lf[0]+.05,z0-.02,M.ss); bx(g,PK2.bx0-.05,PK2.bx1+.04,.08,.16,PK2.lf[0]+.03,z0,M.steel);   /* 설명서 구간 받침 */
  bx(g,x0+.04,X+.42,.12,Hf-.02,z0-.006,z0+.004,M.steel); for(let k=0;k<6;k++) bx(g,x0+.12,x0+.26,1.62+k*.022,1.632+k*.022,z0-.012,z0-.006,M.dark);   /* 북쪽 진회색 옆판 · 환기 팬 */
  /* 상단 핀 벨트 (경사 컨베이어 → 북쪽) · 'Hoonga' 띠 · 북쪽 회전 휠(노란 화살표 커버) */
  const ty=1.5; bx(g,X-.12,X+.1,ty-.12,ty,z0+.12,z1+.05,M.alu); bx(g,X-.1,X+.08,ty,ty+.012,z0+.16,z1+.05,bw);
  for(let z=z1;z>z0+.18;z-=.05) bx(g,X-.1,X-.09,ty+.012,ty+.03,z-.004,z+.004,M.dark);
  decal(g,.32,.06,textTex("Hoonga","#ffffff",512,100,80),[X+.101,ty-.06,zm+.25],Math.PI/2);
  { const w=new T3.Mesh(new T3.CylinderGeometry(.17,.17,.05,40),M.alu); w.rotation.z=Math.PI/2; w.position.set(X+.08,ty-.08,z0+.24); add(g,w); const c=new T3.Mesh(new T3.CylinderGeometry(.11,.11,.052,32),M.white); c.rotation.z=Math.PI/2; c.position.set(X+.081,ty-.08,z0+.24); add(g,c);
    plate(g,.12,.12,labelTex([["⟳","#111",150]],{w:160,h:160,bg:"#f5d400"}),[X+.108,ty-.08,z0+.24],Math.PI/2); rod(g,[X+.11,ty-.08,z0+.24],[X+.14,ty-.08,z0+.24],.03,M.ssMir,18);
    for(let k=0;k<10;k++){ const a=k/10*Math.PI*2; bx(g,X+.05,X+.07,ty-.08+Math.sin(a)*.2-.004,ty-.08+Math.sin(a)*.2+.004,z0+.24+Math.cos(a)*.2-.04,z0+.24+Math.cos(a)*.2+.04,M.ssD).rotation.x=a; } }
  PK2.topY=ty+.012; PK2.topZ=[z1+.05,z0+.24]; PK2.wheel=[X,ty-.08,z0+.24];
  /* 가운데 검은 적재부 : 삼각 가름대 2단 · 투명 앞판 · 별 손잡이 · 파란 측판 */
  const sz=zm-.05; PK2.stack=[X+.14,sz];
  bx(g,X-.1,X+.25,1.0,1.36,sz-.2,sz+.2,M.black); bx(g,X+.25,X+.255,1.0,1.36,sz-.2,sz+.2,M.acryl); for(const s of [-1,1]) bx(g,X-.1,X+.27,1.0,1.36,sz+s*.2-.006,sz+s*.2+.006,M.blue);
  for(const y of [1.02,1.19]){ const sh=new T3.Shape(); sh.moveTo(-.05,0); sh.lineTo(.05,0); sh.lineTo(0,.15); sh.lineTo(-.05,0); const t=new T3.Mesh(new T3.ExtrudeGeometry(sh,{depth:.3,bevelEnabled:false}),M.dark); t.rotation.y=Math.PI/2; t.position.set(X-.08,y,sz); add(g,t); }
  for(const [dy,dz] of [[1.06,-.17],[1.06,.17],[1.32,-.17],[1.32,.17]]) rod(g,[X+.255,dy,sz+dz],[X+.28,dy,sz+dz],.016,M.ssMir,12);
  { const k=new T3.Mesh(new T3.CylinderGeometry(.03,.03,.03,8),M.black); k.rotation.z=Math.PI/2; k.position.set(X+.285,1.2,sz+.23); add(g,k); }
  /* 불량 파우치 배출함 (적재부 남쪽 위 · 손잡이) · 수동 투입함(북쪽 · 표지) */
  bx(g,X-.05,X+.25,1.3,1.44,sz+.22,sz+.52,M.acryl); rod(g,[X+.26,1.4,sz+.32],[X+.26,1.4,sz+.42],.006,M.ssMir,8);
  bx(g,X+.0,X+.36,.98,1.2,z0+.06,z0+.42,M.acryl); bx(g,X+.0,X+.36,.97,.98,z0+.06,z0+.42,M.ss); for(const dz of [.18,.3]) bx(g,X+.02,X+.34,.98,1.1,z0+.06+dz-.002,z0+.06+dz+.002,M.acryl);
  PB.sign(g,.3,.1,[["※ 반드시 투입한 손으로, 동작 버튼을 누르세요!","#1565c0",30],["예) 오른손 투입 → 오른손으로 버튼 조작","#111",26],["타인은 동작 버튼 조작 금지!","#c00",28]],{w:768,h:250,border:"#c2185b"},[X+.362,1.27,z0+.24],Math.PI/2);
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
