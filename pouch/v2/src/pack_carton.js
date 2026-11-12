/* ═══ 카토너 HC 100L (Hoonga) · 설명서 공급장치 · 핫멜트 — DRAWING.md 7-1 · 7-2 · 7-8
   정면(동쪽) : 흰 프로파일 틀 + 힌지식 아크릴 문 3짝 · 'Hoonga' · 위 레일(규격 조정 핸들 4 · 안전 스위치) · 상단 카톤 매거진(눕혀 적재)
   안 : 앞줄 흰 버킷(6포) · 뒷줄 카톤 포켓 체인 · 카톤 흡착 · 성형 회전부(노란 화살표) · 플랩 레일 · 핫멜트 건 / 출구 : LS 판넬 · 화살표 슈트 ═══ */
function buildCartoner(g){
  const X=CVX, [z0,z1]=PKZ.ct, x0=X-.55, x1=X+.46, Hd=1.62, wf=new T3.MeshStandardMaterial({color:0xeef0f1,metalness:.35,roughness:.4}), C=PK2.carton;
  /* 받침판(진회색) · 수평 조절 발 · 바닥 브래킷 · 하부 함 */
  bx(g,x0-.02,x1+.02,.07,.15,z0,z1,M.steel); for(const z of [z0+.1,(z0+z1)/2,z1-.1]) for(const x of [x0+.06,x1-.06]) rod(g,[x,0,z],[x,.07,z],.035,M.ssD,16);
  bx(g,X-.1,X+.1,0,.07,(z0+z1)/2-.6,(z0+z1)/2+.6,M.ssD);
  bx(g,x0,X-.02,.15,.68,z0+.02,z1-.02,M.ss); bx(g,X-.02,X+.3,.15,.4,z0+.02,z1-.02,M.ss);
  for(let k=1;k<5;k++) bx(g,X+.3,X+.302,.18,.38,z1-k*(z1-z0)/5-.002,z1-k*(z1-z0)/5+.002,M.ssD);
  bx(g,x0,X+.32,.68,.72,z0+.02,z1-.02,M.ssD);
  /* 앞줄 : 흰 버킷 컨베이어 연장 (6포 묶음 이송) — 스틱공급장치에서 이어짐 */
  /* 뒷줄 : 카톤 포켓 체인 · 카톤(흰 바탕 · 적색 인쇄) */
  const ct=tex(cvs(256,128,(c)=>{ c.fillStyle="#f6f4ef"; c.fillRect(0,0,256,128); c.fillStyle="#c8201c"; c.fillRect(0,0,256,46); c.fillStyle="#fff"; c.font="bold 34px 'Malgun Gothic',sans-serif"; c.fillText("판콜에이치",22,36); c.fillStyle="#c8201c"; c.font="bold 30px sans-serif"; c.fillText("H",200,96); c.fillStyle="#555"; for(let k=0;k<3;k++) c.fillRect(22,62+k*18,150,6); }),1,1,true);
  M.carton=new T3.MeshStandardMaterial({map:ct,roughness:.6}); M.cartonFlat=new T3.MeshStandardMaterial({color:0xf2efe8,roughness:.65});
  const cy=.76; bx(g,X-.36,X-.06,cy-.04,cy,z0+.1,z1-.1,M.dark);
  { const n=Math.floor((z1-z0-.3)/PK2.bucketP), lug=new T3.InstancedMesh(new T3.BoxGeometry(.28,.05,.008),M.ssD,n), o=new T3.Object3D();
    for(let k=0;k<n;k++){ o.position.set(X-.21,cy+.025,z1-.15-k*PK2.bucketP); o.updateMatrix(); lug.setMatrixAt(k,o.matrix); } g.add(lug); }
  /* 앞 · 뒷줄 사이 밀대 가이드 · 설명서 · 성형 레일 */
  for(const x of [X-.04,X+.0]) bx(g,x-.006,x+.006,cy,cy+.07,z0+.15,z1-.15,M.ssMir);
  /* 흰 프로파일 틀 · 아크릴 문 3짝(힌지 · 손잡이) · 옆면 아크릴 · 'Hoonga' */
  PB.frame(g,x0,x1,.72,Hd,z0,z1,wf); const dz=[z1,z1-(z1-z0)/3,z0+(z1-z0)/3,z0];
  for(let k=0;k<3;k++){ const a=dz[k+1]+.015, b=dz[k]-.015; bx(g,x1-.004,x1+.004,.74,Hd-.03,a,b,M.acryl); if(k) bx(g,x1-.02,x1+.02,.72,Hd,dz[k]-.015,dz[k]+.015,wf);
    rod(g,[x1+.035,1.05,a+.08],[x1+.035,1.3,a+.08],.008,M.ssMir,8); for(const y of [1.05,1.3]) rod(g,[x1,y,a+.08],[x1+.035,y,a+.08],.006,M.ssMir,6);
    for(const y of [.85,1.45]) bx(g,x1+.004,x1+.012,y-.04,y+.04,b-.03,b+.01,M.alu); }
  for(const z of [z0,z1]) bx(g,x0,x1,.74,Hd-.03,z-.003,z+.003,M.acryl);
  decal(g,.62,.12,textTex("Hoonga","#ffffff",512,100,84),[x1+.006,1.36,(dz[1]+dz[2])/2],Math.PI/2);
  /* 위 레일 · 규격 조정 핸들 4 (숫자 창 + 노브) · 빨간 안전 스위치 2 */
  bx(g,X-.3,x1-.04,Hd,Hd+.1,z0+.05,z1-.05,M.ss);
  for(let k=0;k<4;k++){ const z=z1-.7-k*.55; bx(g,x1-.04,x1-.0,Hd+.02,Hd+.08,z-.035,z+.035,M.white); bx(g,x1,x1+.002,Hd+.045,Hd+.07,z-.02,z+.02,M.dark); rod(g,[x1,Hd+.03,z],[x1+.035,Hd+.03,z],.016,M.dark,14); }
  for(const z of [(z0+z1)/2-.1,(z0+z1)/2+.1]){ bx(g,x1-.06,x1-.0,Hd-.06,Hd,z-.04,z+.04,M.red); bx(g,x1,x1+.003,Hd-.045,Hd-.015,z-.02,z+.02,M.white); }
  /* 상단 카톤 매거진 : 핀 벨트(진행 화살표) 위 접힌 평판 카톤을 눕혀 적재 → 북쪽 끝 경사 슈트로 흡착부 공급 */
  const my=Hd+.1, ma=z1-.35, mb=z0+1.0; bx(g,X-.28,X+.3,my,my+.012,mb,ma,M.white); for(const x of [X-.3,X+.32]) bx(g,x-.012,x+.012,my,my+.12,mb,ma,M.ss);
  { const n=Math.floor((ma-mb)/.012), im=new T3.InstancedMesh(new T3.BoxGeometry(.56,.11,.0045),M.cartonFlat,n), o=new T3.Object3D(); for(let k=0;k<n;k++){ o.position.set(X+.01,my+.07,ma-.01-k*.012); o.rotation.set(-.32,0,0); o.updateMatrix(); im.setMatrixAt(k,o.matrix); } im.castShadow=true; g.add(im); }
  for(let k=0;k<3;k++) PB.sign(g,.08,.035,[["▶","#111",60]],{w:128,h:64,bg:"#f5d400"},[X+.322,my+.06,ma-.4-k*.6],Math.PI/2).rotation.z=Math.PI;
  { const r=new T3.Mesh(new T3.BoxGeometry(.5,.012,.4),M.acryl); r.position.set(X,my-.12,mb-.15); r.rotation.x=.7; g.add(r); }
  /* 카톤 흡착 컵(빨간 석션) · 성형 회전부(노란 화살표 판) · 플랩 레일 · 핫멜트 건(곡면 하우징 · 파란 꼬인 호스) */
  const zr=z0+.95; for(const dz of [-.06,.06]){ rod(g,[X-.2,1.25,zr+dz],[X-.2,1.05,zr+dz],.012,M.ssMir,10); cone(g,[X-.2,1.05,zr+dz],[X-.2,1.0,zr+dz],.01,.025,M.red,14); }
  { const d=new T3.Mesh(new T3.CylinderGeometry(.13,.13,.02,32),M.ss); d.rotation.z=Math.PI/2; d.position.set(X+.12,1.05,zr-.35); add(g,d); plate(g,.1,.1,labelTex([["⟲","#111",140]],{w:128,h:128,bg:"#f5d400"}),[X+.132,1.05,zr-.35],Math.PI/2); }
  for(const y of [cy+.1,cy+.14]) bx(g,X-.4,X-.37,y-.005,y+.005,z0+.15,zr-.4,M.ssMir);
  { const hz=z0+.42; bx(g,X-.5,X-.3,.85,1.0,hz-.12,hz+.12,M.ssMir); const c=new T3.Mesh(new T3.CylinderGeometry(.1,.1,.2,24,1,false,0,Math.PI),M.ssMir); c.rotation.z=Math.PI/2; c.position.set(X-.4,1.0,hz); add(g,c);
    tube(g,[[X-.45,1.05,hz],[X-.5,1.25,hz+.2],[X-.52,1.45,hz+.5],[X-.55,Hd+.05,hz+.9]],.016,M.hoseB); for(let k=0;k<30;k++){ const t=k/30; bx(g,X-.46-.09*t,X-.44-.09*t,1.05+.6*t,1.06+.6*t,hz+.9*t-.004,hz+.9*t+.004,M.white); } }
  /* 하부 투명 배출함 3 (라벨) · '불량 조치 시 핀셋 사용' · 노란 화살표 판 */
  for(const [z,t] of [[z1-.35,"설명서 불량"],[z1-1.3,"설명서 삽입 불량"],[z0+.5,"케이스 성형 불량"]]){ bx(g,X+.3,X+.56,.2,.5,z-.14,z+.14,M.acryl); bx(g,X+.3,X+.56,.19,.2,z-.14,z+.14,M.ss); PB.sign(g,.2,.07,[["포장실","#111",40],[t,"#111",42]],{w:384,h:130,border:"#333"},[X+.562,.4,z],Math.PI/2); }
  PB.sign(g,.2,.07,[["불량 조치 시","#c00",50],["핀셋 사용","#c00",50]],{w:384,h:140,border:"#c00"},[x1+.006,.82,(z0+z1)/2+.6],Math.PI/2);
  PB.beacon(g,x0+.1,Hd+.1,z0+.15);
  /* ── 설명서 공급장치 (입구 상부 · 버킷 위) : 스테인리스 함(정지스위치) · 아크릴 상자 안 검은 공급 휠 · 왼쪽으로 기운 설명서 랙 · 노란 비상정지 함 ── */
  { const lz=z1-.42, lx=X+.16; bx(g,lx-.15,lx+.22,1.12,1.42,lz-.25,lz+.2,M.ss); rod(g,[lx+.22,1.27,lz-.05],[lx+.25,1.27,lz-.05],.022,M.dark,14);
    PB.sign(g,.1,.03,[["정지스위치","#111",56]],{w:320,h:90,border:"#111"},[lx+.222,1.34,lz-.05],Math.PI/2);
    bx(g,lx-.15,lx+.22,1.42,1.82,lz-.22,lz+.18,M.acryl); { const w=new T3.Mesh(new T3.CylinderGeometry(.15,.15,.08,36),M.black); w.rotation.z=Math.PI/2; w.position.set(lx+.08,1.62,lz-.02); add(g,w); rod(g,[lx+.12,1.62,lz-.02],[lx+.14,1.62,lz-.02],.04,M.ssMir,18); }
    PB.sign(g,.09,.05,[["안전커버","#c00",44],["임의 Open 금지","#c00",34]],{w:256,h:140,border:"#c00"},[lx+.222,1.76,lz+.08],Math.PI/2);
    const rk=new T3.Group(); rk.position.set(lx,1.55,lz+.24); rk.rotation.x=.75; g.add(rk); bx(rk,-.15,.15,0,.012,0,.42,M.ss); for(const dx of [-.12,-.04,.04,.12]) rod(rk,[dx,.012,.02],[dx,.18,.02],.006,M.ssMir,8); bx(rk,-.11,.11,.012,.05,.04,.36,M.white);
    bx(g,lx+.22,lx+.32,1.14,1.26,lz+.02,lz+.16,M.yellow); rod(g,[lx+.32,1.2,lz+.09],[lx+.35,1.2,lz+.09],.028,M.red,16);
    PB.sign(g,.16,.08,[["금 지","#fff",52],["운전중 손 넣지 마시오","#111",30]],{w:384,h:190,border:"#c00",bg:"#fff"},[x1+.006,1.18,z1-.25],Math.PI/2); PK2.leaflet=[lx,lz]; }
  /* ── 출구 : 화살표 슈트 · LS 판넬(스테인리스 받침) · 핫멜트 유닛(서쪽 뒤 파란 장치 · 압력계) · 노란 코일 에어호스 ── */
  { const r=new T3.Mesh(new T3.BoxGeometry(.22,.01,.3),M.ssMir); r.position.set(X+.16,PK2.bucketY-.02,z0-.12); r.rotation.x=-.2; add(g,r); PB.sign(g,.12,.05,[["▲","#111",60]],{w:128,h:64,bg:"#f5d400"},[X+.16,PK2.bucketY-.005,z0-.12],0).rotation.x=-Math.PI/2-.2;
    bx(g,x1+.06,x1+.46,.05,1.12,z0+.04,z0+.44,M.ss); rod(g,[x1+.26,1.12,z0+.24],[x1+.26,1.25,z0+.24],.03,M.ssMir,14); PB.panel(g,x1+.3,1.48,z0+.24,0,"Hoonga");
    bx(g,x0-.55,x0-.12,.05,.95,z0+.15,z0+.65,M.blue); bx(g,x0-.55,x0-.12,.95,1.0,z0+.15,z0+.65,M.dark); rod(g,[x0-.11,.75,z0+.3],[x0-.08,.75,z0+.3],.04,M.white,18); rod(g,[x0-.11,.75,z0+.5],[x0-.08,.75,z0+.5],.04,M.white,18);
    tube(g,[[x0-.3,1.0,z0+.4],[x0-.25,1.3,z0+.3],[x0,1.45,z0+.35],[X-.45,1.3,z0+.42]],.02,M.hoseB);
    { const pts=[], hx=x1+.5, hz=z0+.6; for(let i=0;i<=120;i++){ const t=i/120, a=t*Math.PI*2*14; pts.push([hx+Math.cos(a)*.03,1.15-t*.65,hz+Math.sin(a)*.03]); } tube(g,pts,.005,M.yellow); } }
}
