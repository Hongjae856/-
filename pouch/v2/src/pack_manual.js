/* ═══ 수동 포장 구역 (사용자 설명 11/11 · 카토너가 돌면 자동 진행 — 사용자 지시 11/11)
   작업자 1 : 모음 벨트 끝 카톤 8개를 대케이스(적색)에 담고 닫음 → 검은 벨트 → 대케이스 잉크젯 인쇄 → 녹색 벨트 작업대로 내려감
   작업자 2 : 녹색 벨트 끝에 모인 대케이스 4개를 대박스(갈색)에 담아 닫고 옆 적재로 옮김.  시간 = 카톤 흐름과 같은 시계 ═══ */
const MP={ case:{x:.27,y:.08,z:.38}, z0:-9.32, zB1:-10.32, zG0:-10.5, spot:k=>-11.72+k*.38, box:{x:.3,y:.18,z:.8}, boxAt:[0,0,0] };
function makeWorker(S,x,z,ry){ const G=new T3.Group(); G.position.set(x,0,z); G.rotation.y=ry; S.add(G);   /* 방진복(상하 일체) · 후드 · 마스크 · 방진화 */
  const gown=new T3.MeshStandardMaterial({color:0x8fb8e0,roughness:.9}), skin=new T3.MeshStandardMaterial({color:0xe2bc9c,roughness:.7}), hood=new T3.MeshStandardMaterial({color:0xf3f4f2,roughness:.92}), boot=new T3.MeshStandardMaterial({color:0xeef0f0,roughness:.8}), glove=new T3.MeshStandardMaterial({color:0xdfe9f2,roughness:.55});
  const lathe=(pts,mat,sx,sz,y0)=>{ const m=new T3.Mesh(new T3.LatheGeometry(pts.map(p=>new T3.Vector2(p[0],p[1])),32),mat); m.scale.set(sx,1,sz); m.position.y=y0||0; add(G,m); return m; };
  const legs=[]; for(const s of [-1,1]){ const L0=new T3.Group(); L0.position.set(s*.085,.95,0); G.add(L0); legs.push(L0); const L=new T3.Group(); L.position.y=-.95; L0.add(L);   /* 고관절 기준 회전 (보행) */
    const leg=new T3.Mesh(new T3.LatheGeometry([[.0,.0],[.062,.0],[.064,.1],[.06,.42],[.07,.62],[.085,.88],[0,.9]].map(p=>new T3.Vector2(p[0],p[1])),20),gown); leg.position.y=.06; add(L,leg);
    const bt=new T3.Mesh(new T3.LatheGeometry([[.0,.0],[.07,.0],[.068,.3],[.064,.36],[0,.36]].map(p=>new T3.Vector2(p[0],p[1])),20),boot); bt.scale.z=1.15; add(L,bt);
    const toe=new T3.Mesh(new T3.SphereGeometry(.065,16,10,0,Math.PI*2,0,Math.PI/2),boot); toe.scale.set(1,.7,1.6); toe.position.set(0,0,.07); add(L,toe); }
  lathe([[.0,.9],[.17,.9],[.175,1.0],[.16,1.1],[.175,1.22],[.19,1.33],[.18,1.42],[.12,1.48],[.06,1.52],[0,1.52]],gown,1.12,.66);   /* 몸통 */
  { const zip=new T3.Mesh(new T3.BoxGeometry(.012,.5,.006),hood); zip.position.set(0,1.2,.125); add(G,zip); }
  rod(G,[0,1.5,0],[0,1.58,0],.05,skin,12);
  const h=new T3.Mesh(new T3.SphereGeometry(.098,24,16),skin); h.scale.set(.92,1.08,1); h.position.y=1.66; add(G,h);
  const hd=new T3.Mesh(new T3.SphereGeometry(.118,28,18,Math.PI*.62,Math.PI*1.76,0,Math.PI),hood); hd.scale.set(.95,1.12,1.04); hd.position.set(0,1.665,-.008); add(G,hd);   /* 후드 (얼굴 개구) */
  lathe([[.0,1.46],[.15,1.46],[.13,1.52],[.08,1.56],[0,1.56]],hood,1.1,.8);                                       /* 후드 어깨 덮개 */
  const mk=new T3.Mesh(new T3.SphereGeometry(.1,20,12,-Math.PI*.38,Math.PI*.76,Math.PI*.5,Math.PI*.28),hood); mk.position.y=1.655; mk.scale.z=1.08; add(G,mk);   /* 마스크 */
  const gl=new T3.Mesh(new T3.BoxGeometry(.13,.03,.02),new T3.MeshStandardMaterial({color:0x9fc4dc,roughness:.15,metalness:.2,transparent:true,opacity:.55})); gl.position.set(0,1.69,.095); add(G,gl);   /* 보안경 */
  const arms=[]; for(const s of [-1,1]){ const A=new T3.Group(); A.position.set(s*.205,1.39,0); G.add(A);
    const up=new T3.Mesh(new T3.CylinderGeometry(.058,.05,.3,16),gown); up.position.y=-.15; add(A,up); const sh=new T3.Mesh(new T3.SphereGeometry(.06,16,10),gown); add(A,sh);
    const F=new T3.Group(); F.position.y=-.3; A.add(F); const el=new T3.Mesh(new T3.SphereGeometry(.05,14,8),gown); add(F,el);
    const lo=new T3.Mesh(new T3.CylinderGeometry(.05,.04,.25,16),gown); lo.position.y=-.125; add(F,lo);
    const hand=new T3.Mesh(new T3.SphereGeometry(.042,14,10),glove); hand.scale.set(.75,1.35,.95); hand.position.y=-.29; add(F,hand); arms.push({A,F,s}); }
  return {G,arms,legs}; }
function setArms(w,reach,bend){ for(const a of w.arms){ a.A.rotation.x=-reach; a.A.rotation.z=a.s*.12; a.F.rotation.x=-bend; } }
function initManual(S){
  const X=CVX, C=MP.case, red=new T3.MeshStandardMaterial({color:0x9a1a14,roughness:.6,side:T3.DoubleSide}), kraft=new T3.MeshStandardMaterial({color:0xb08a5a,roughness:.85,side:T3.DoubleSide});
  const prt=new T3.MeshBasicMaterial({map:tex(cvs(256,96,(c)=>{ c.fillStyle="#9a1a14"; c.fillRect(0,0,256,96); c.fillStyle="#111"; c.font="bold 22px monospace"; c.fillText("2F010  ×8",10,34); c.fillText("EXP 2028.11.01",10,70); }),1,1,true)});
  const mkBox=(d,mat,lab)=>{ const G=new T3.Group(); S.add(G); const t=.004;
    bx(G,-d.x/2,d.x/2,0,t,-d.z/2,d.z/2,mat); for(const s of [-1,1]){ bx(G,-d.x/2,d.x/2,0,d.y,s*d.z/2-t/2,s*d.z/2+t/2,mat); bx(G,s*d.x/2-t/2,s*d.x/2+t/2,0,d.y,-d.z/2,d.z/2,mat); }
    const lids=[]; for(const s of [-1,1]){ const L=new T3.Group(); L.position.set(s*d.x/2,d.y,0); G.add(L); const m=bx(L,0,-s*d.x/2,0,t,-d.z/2,d.z/2,mat); lids.push({L,s}); }
    let pl=null; if(lab){ pl=new T3.Mesh(new T3.PlaneGeometry(.2,.06),lab); pl.position.set(-d.x/2-.003,d.y*.55,0); pl.rotation.y=-Math.PI/2; G.add(pl); }
    G.visible=false; return {G,lids,pl}; };
  MP.cases=[]; for(let i=0;i<10;i++) MP.cases.push(mkBox(C,red,prt));
  MP.boxes=[]; for(let i=0;i<2;i++) MP.boxes.push(mkBox(MP.box,kraft,null));
  /* 대박스 받침 대차 (작업대 동쪽) */
  { const bx0=X+.95, bz=-11.3; for(const y of [.12,.42]) bx(S,bx0-.22,bx0+.22,y,y+.02,bz-.45,bz+.45,M.ss); for(const dx of [-.2,.2]) for(const dz of [-.43,.43]){ rod(S,[bx0+dx,.05,bz+dz],[bx0+dx,.44,bz+dz],.012,M.ss,8); rod(S,[bx0+dx,.035,bz+dz],[bx0+dx,.035,bz+dz+.02],.035,M.dark,12); } MP.boxAt=[bx0,.44,bz]; }
  MP.w1=makeWorker(S,X+.62,-9.75,-Math.PI/2*1.25); MP.w2=makeWorker(S,X+.62,-11.0,-Math.PI/2);
}
/* 카톤 c(배치 m 의 i 번째)가 대케이스로 옮겨지는 중이면 위치를, 케이스 안이면 null 이 아닌 'hide' 를 돌려줌 */
function manualCarton(tm,i,qpos){ if(tm<=0) return qpos; const t0=i*.12, f=Math.min(1,Math.max(0,(tm-t0)/.5)); if(tm>1.9) return 'hide';
  const c=i%2, r=Math.floor(i/2), s=[CVX+(c-.5)*.128, PKZ.y+.006+PK2.carton.H/2, MP.z0+(r-1.5)*.092], e=f*f*(3-2*f);
  return [qpos[0]+(s[0]-qpos[0])*e, qpos[1]+(s[1]-qpos[1])*e+Math.sin(Math.PI*e)*.12, qpos[2]+(s[2]-qpos[2])*e]; }
function stepManual(tmOf,mNow){
  if(!MP.cases) return; const ez=x=>x<=0?0:x>=1?1:x*x*(3-2*x), lerp=(a,b,t)=>a+(b-a)*t, X=CVX, Y=PKZ.y, C=MP.case;
  let ci=0, reach1=0, reach2=0;
  const casePos=(tm,k)=>{ if(tm<-1.4){ const f=ez((tm+2.0)/.6); return [lerp(X+.5,X,f),Y+Math.sin(Math.PI*f)*.1,MP.z0]; } if(tm<2.2) return [X,Y,MP.z0];
    if(tm<6.2) return [X,Y,Math.max(MP.zB1,MP.z0-.25*(tm-2.2))];
    if(tm<6.8){ const f=ez((tm-6.2)/.6); return [X,lerp(Y,Y-.094,f),lerp(MP.zB1,MP.zG0,f)]; }
    return [X,Y-.094,Math.max(MP.spot(k),MP.zG0-.15*(tm-6.8))]; };
  const arrive=k=>6.8+(MP.zG0-MP.spot(k))/.15;
  for(let m=mNow+1;m>=mNow-9&&ci<MP.cases.length;m--){ const tm=tmOf(m), k=((m%4)+4)%4, n=Math.floor(m/4), tL=tmOf(4*n+3)-arrive(3);
    if(tm<-2.0) continue; if(tL>4.6) continue;
    const cs=MP.cases[ci++]; cs.G.visible=true; let p=casePos(tm,k);
    if(tL>1){ const f=ez((tL-1)/1.2), b=MP.boxAt, slot=[b[0],b[1]+.004+(k>>1)*.085,b[2]+((k&1)-.5)*.39]; p=[lerp(p[0],slot[0],f),lerp(p[1],slot[1],f)+Math.sin(Math.PI*f)*.15,lerp(p[2],slot[2],f)]; reach2=Math.max(reach2,Math.sin(Math.PI*f)); }
    cs.G.position.set(p[0],p[1],p[2]); const lid=ez((tm-1.4)/.5); for(const l of cs.lids) l.L.rotation.z=-l.s*(Math.PI*.62)*(1-lid); cs.pl.visible=p[2]<-9.62;
    if(tm>0&&tm<1.9) reach1=Math.max(reach1,Math.sin(Math.PI*Math.min(1,tm/1.9)));
    if(tm<-1.4&&tm>-2.0) reach1=Math.max(reach1,.6*Math.sin(Math.PI*(tm+2.0)/.6)); }
  for(;ci<MP.cases.length;ci++) MP.cases[ci].G.visible=false;
  /* 대박스 */
  let bi=0; for(let n=Math.floor(mNow/4)+1;n>=Math.floor(mNow/4)-3&&bi<2;n--){ const tL=tmOf(4*n+3)-arrive(3); if(tL<0||tL>5) continue; const bxo=MP.boxes[bi++]; bxo.G.visible=true; const b=MP.boxAt;
    bxo.G.position.set(b[0],b[1],b[2]); const cl=ez((tL-2.6)/.6); for(const l of bxo.lids) l.L.rotation.z=-l.s*(Math.PI*.62)*(1-cl); bxo.G.visible=tL<4.6; }
  for(;bi<2;bi++) MP.boxes[bi].G.visible=false;
  setArms(MP.w1,.25+1.0*reach1,.5*reach1); setArms(MP.w2,.25+.85*reach2,.7*reach2);
}
