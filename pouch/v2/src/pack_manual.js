/* ═══ 수동 포장 구역 (사용자 설명 11/11 · 11/13 · 11/14) — 카토너가 돌면 같은 시계로 자동 진행
   작업자 1 · 2 (모음 벨트 끝 양옆에서 마주 봄 · 한 케이스씩 번갈아) :
     옆 자재대의 접힌 대케이스를 집어 펼침(바닥 자동 맞물림) → 받침대에 놓음 → 카톤을 양손으로 4개씩 2회 담음(2열 × 4)
     → 양끝 날개 접기 → 뚜껑 턱인 닫기 → 봉함스티커 부착 → 검은 벨트에 올림(대케이스 잉크젯 인쇄) → 녹색 벨트
   작업자 3 (녹색 벨트 끝 동쪽) : 미리 성형된 대박스에 대케이스 4개를 담고 날개를 접어 수동 테이프 커터로 테이핑
     → 파렛트 적재(한 단 2 × 2 = 4, 6단 가정) → 성형 대박스를 가져와 작업대에 놓음
   [사용자 확인 11/14] 카톤은 세워서 담음 → 대케이스는 좁고 높음 · 대박스는 1층에 대케이스 4개를 나란히
   [추정 · 확인 필요] 대케이스 375 × 140 × 125 · 대박스 590 × 400 × 150 · 받침대 · 자재대 · 파렛트 · 성형 박스 보관 위치 · 동작 시간 ═══ */
const MP={ a:.375, b:.14, h:.125, zQ:-9.68, zS:-9.75, uC:.24, uW:.61, zB:-10.22, vB:.25, vG:.2, zK:-12.0, zG0:-12.42, zGE:-14.5, zE:-14.29, sp:.39,
  box:{x:.59,y:.15,z:.40}, zBx:-14.77, xBx:.08, open:1.95, pk:[.6,3.0,5.4,10.2], pal:[1.75,-14.2], t:0, t0:0, tp:null };
MP.zC=MP.zQ+.141;
const mod=(a,n)=>((a%n)+n)%n, ez3=x=>x<=0?0:x>=1?1:x*x*(3-2*x), mixA=(a,b,e)=>a.map((v,i)=>v+(b[i]-v)*e);
/* ── 대케이스 : 턱인 뚜껑 · 양끝 날개 · 자동 바닥. 몸체는 평면 전단으로 접힌 상태(φ≈0) ↔ 펼친 상태(φ=90°) ── */
function makeCase(S){
  const a=MP.a, b=MP.b, h=MP.h, t=.003, red=MP.red, G=new T3.Group(), B=new T3.Group(); S.add(G); G.add(B); B.matrixAutoUpdate=false; G.rotation.order="YXZ";
  bx(B,-b/2,b/2,0,t,-a/2,a/2,red); bx(B,-b/2,-b/2+t,0,h,-a/2,a/2,red); bx(B,b/2-t,b/2,0,h,-a/2,a/2,red);
  const dust=[]; for(const s of [-1,1]){ bx(B,-b/2,b/2,0,h,s*a/2-(s>0?t:0),s*a/2+(s>0?0:t),red); const D=new T3.Group(); D.position.set(0,h,s*(a/2-t/2)); B.add(D); bx(D,-b/2+.012,b/2-.012,0,.06,-t/2,t/2,red); dust.push({D,s}); }
  const Ll=b-.008, lid=new T3.Group(); lid.position.set(b/2-t,h,0); B.add(lid); bx(lid,-t,0,0,Ll,-a/2+.004,a/2-.004,red);
  const tuck=new T3.Group(); tuck.position.set(-t/2,Ll,0); lid.add(tuck); bx(tuck,-t/2,t/2,0,.03,-a/2+.02,a/2-.02,red);
  const stk=new T3.Group(); G.add(stk); bx(stk,-b/2,-b/2+.02,h+.0005,h+.0016,-.016,.016,MP.blue); bx(stk,-b/2-.0016,-b/2-.0005,h-.02,h+.0016,-.016,.016,MP.blue);
  const lab=[]; for(const s of [-1,1]){ const p=new T3.Mesh(new T3.PlaneGeometry(.2,.045),MP.prt); p.position.set(s*(b/2+.0012),h*.5,0); p.rotation.y=s*Math.PI/2; G.add(p); lab.push(p); }
  G.visible=false;
  return {G,B,lid,tuck,dust,stk,lab, Ll,
    set(o){ G.visible=true; G.position.fromArray(o.p); G.rotation.set(0,o.yaw,o.tilt||0); const ph=o.phi==null?Math.PI/2:o.phi; B.matrix.set(Math.sin(ph),0,0,0, 0,1,0,0, Math.cos(ph),0,1,0, 0,0,0,1);
      lid.rotation.z=o.lid==null?Math.PI/2:o.lid; tuck.rotation.z=o.tuck==null?Math.PI/2:o.tuck; for(const d of dust) d.D.rotation.x=-d.s*(o.dust==null?Math.PI/2:o.dust);
      stk.visible=!!o.stk; const west=Math.cos(o.yaw)<0?1:0; lab[0].visible=!!o.lab&&!west; lab[1].visible=!!o.lab&&!!west; } };
}
/* 케이스 자세 o 에서 로컬 점 → 세계 좌표 */
const _ce=new T3.Euler(0,0,0,"YXZ"), _cv=new T3.Vector3();
function caseW(o,x,y,z){ _ce.set(0,o.yaw,o.tilt||0); _cv.set(x,y,z).applyEuler(_ce); return [o.p[0]+_cv.x,o.p[1]+_cv.y,o.p[2]+_cv.z]; }
/* ── 대박스 : 성형된 골판지 상자 · 윗날개 4장(끝 2 · 옆 2) · 테이프 ── */
function makeBox(S){
  const d=MP.box, t=.004, kr=MP.kraft, G=new T3.Group(); S.add(G);
  bx(G,-d.x/2,d.x/2,0,t,-d.z/2,d.z/2,kr); for(const s of [-1,1]){ bx(G,-d.x/2,d.x/2,0,d.y,s*d.z/2-t/2,s*d.z/2+t/2,kr); bx(G,s*d.x/2-t/2,s*d.x/2+t/2,0,d.y,-d.z/2,d.z/2,kr); }
  const fl=d.z/2, fx=[], fz=[];
  for(const s of [-1,1]){ const F=new T3.Group(); F.position.set(s*d.x/2,d.y,0); G.add(F); bx(F,s>0?-fl:0,s>0?0:fl,-t,0,-d.z/2+.004,d.z/2-.004,kr); fx.push({F,s}); }      /* 안쪽(먼저 접는) 날개 : 짧은 변 */
  for(const s of [-1,1]){ const F=new T3.Group(); F.position.set(0,d.y+t,s*d.z/2); G.add(F); bx(F,-d.x/2,d.x/2,-t,0,s>0?-fl:0,s>0?0:fl,kr); fz.push({F,s}); }                 /* 바깥(나중) 날개 : 긴 변 → 가운데 이음선 */
  const tp=new T3.Group(); G.add(tp); const g1=new T3.BoxGeometry(1,.0012,.05); g1.translate(.5,0,0); const top=new T3.Mesh(g1,MP.tape); top.position.set(-d.x/2,d.y+t+.001,0); tp.add(top);
  const tabs=[]; for(const s of [-1,1]) tabs.push(bx(tp,s*d.x/2+(s>0?.0005:-.0017),s*d.x/2+(s>0?.0017:-.0005),d.y-.055,d.y+t,-.025,.025,MP.tape));
  G.visible=false;
  return {G, set(o){ G.visible=true; G.position.fromArray(o.p); G.rotation.y=o.yaw; for(const f of fx) f.F.rotation.z=-f.s*o.b1; for(const f of fz) f.F.rotation.x=f.s*o.b2;
    const p=o.tape||0; tp.visible=p>0; top.scale.x=Math.max(.001,Math.min(1,p)*d.x); tabs[0].visible=p>0; tabs[1].visible=p>=1; } };
}
function initManual(S){
  const X=CVX, Y=PKZ.y, Yt=Y-.1, d=MP.box;
  MP.red=new T3.MeshStandardMaterial({color:0xa01a14,roughness:.62,side:T3.DoubleSide}); MP.kraft=new T3.MeshStandardMaterial({color:0xb48a5a,roughness:.88,side:T3.DoubleSide});
  MP.blue=new T3.MeshStandardMaterial({color:0x4f9bdc,roughness:.4}); MP.tape=new T3.MeshStandardMaterial({color:0xd8b77c,roughness:.3,transparent:true,opacity:.92});
  MP.prt=new T3.MeshBasicMaterial({map:tex(cvs(256,64,(c)=>{ c.fillStyle="#a01a14"; c.fillRect(0,0,256,64); c.fillStyle="#141414"; c.font="bold 20px monospace"; c.fillText("LOT 2F010  x8",8,26); c.fillText("EXP 2028.11.01",8,52); }),1,1,true)});
  /* 받침대(양옆) · 봉함스티커 · 접힌 대케이스 자재대 */
  for(const s of [-1,1]){ const wx=u=>X+s*u, x0=Math.min(wx(.1),wx(.46)), x1=Math.max(wx(.1),wx(.46)), zr=s>0?-1:1;
    bx(S,x0,x1,Y-.03,Y,-9.9,-9.2,M.ssMir); for(const u of [.14,.42]) for(const z of [-9.86,-9.24]){ bx(S,wx(u)-.015,wx(u)+.015,.03,Y-.03,z-.015,z+.015,M.ss); foot(S,wx(u),z,.03,.02); } bx(S,x0+.02,x1-.02,.3,.32,-9.86,-9.24,M.ss);
    { const dz=MP.zC+zr*.31, dx=wx(.40); bx(S,dx-.03,dx+.03,Y,Y+.012,dz-.04,dz+.04,M.ss); rod(S,[dx-.022,Y+.045,dz],[dx+.022,Y+.045,dz],.032,MP.blue,20); rod(S,[dx-.026,Y+.045,dz],[dx+.026,Y+.045,dz],.012,M.dark,10); for(const q of [-.026,.026]) bx(S,dx+q-.002,dx+q+.002,Y+.012,Y+.05,dz-.006,dz+.006,M.ss); }
    { const cx=wx(.84), cz=-10.27; bx(S,cx-.36,cx+.36,.82,.85,cz-.23,cz+.23,M.ss); for(const dx of [-.33,.33]) for(const dz of [-.2,.2]){ bx(S,cx+dx-.015,cx+dx+.015,.06,.82,cz+dz-.015,cz+dz+.015,M.ss); rod(S,[cx+dx,.03,cz+dz],[cx+dx,.03,cz+dz+.02],.03,M.dark,12); } bx(S,cx-.33,cx+.33,.25,.27,cz-.2,cz+.2,M.ss);
      for(let k=0;k<8;k++) bx(S,cx-.258,cx+.258,.85+k*.007,.856+k*.007,cz-.145,cz+.145,MP.red); for(const q of [-.14,.14]) bx(S,cx+q-.12,cx+q+.12,.27,.4,cz-.15,cz+.15,MP.red); } }
  MP.ystk=.85+8*.007+.008;
  /* 파렛트 · 성형 대박스 보관 대차 · 테이프 커터 */
  { const [px,pz]=[X+MP.pal[0],MP.pal[1]], pl=new T3.MeshStandardMaterial({color:0x2f5fae,roughness:.7}); bx(S,px-.5,px+.5,.12,.15,pz-.6,pz+.6,pl); for(const dx of [-.45,0,.45]) bx(S,px+dx-.05,px+dx+.05,0,.12,pz-.6,pz+.6,pl); for(const dz of [-.55,0,.55]) bx(S,px-.5,px+.5,.0,.02,pz+dz-.05,pz+dz+.05,pl);
    MP.palB=new T3.InstancedMesh(new T3.BoxGeometry(d.z,d.y,d.x),MP.kraft,24); MP.palT=new T3.InstancedMesh(new T3.BoxGeometry(.05,.05,d.x+.004),MP.tape,24); for(const m of [MP.palB,MP.palT]){ m.count=0; m.castShadow=true; m.receiveShadow=true; m.frustumCulled=false; S.add(m); } }
  { const cx=X+.75, cz=-15.5; bx(S,cx-.24,cx+.24,.16,.2,cz-.32,cz+.32,M.ss); for(const dx of [-.2,.2]) for(const dz of [-.27,.27]){ rod(S,[cx+dx,.045,cz+dz],[cx+dx,.045,cz+dz+.03],.045,M.dark,14); bx(S,cx+dx-.015,cx+dx+.015,.08,.16,cz+dz-.015,cz+dz+.015,M.ssD); }
    rod(S,[cx-.24,.2,cz-.32],[cx-.24,.95,cz-.32],.012,M.ssMir,8); rod(S,[cx+.24,.2,cz-.32],[cx+.24,.95,cz-.32],.012,M.ssMir,8); rod(S,[cx-.24,.95,cz-.32],[cx+.24,.95,cz-.32],.012,M.ssMir,8); MP.sup=[cx,.2,cz]; }
  MP.gun=new T3.Group(); S.add(MP.gun); { const g=MP.gun; bx(g,-.012,.012,.0,.1,-.015,.015,M.red); bx(g,-.03,.03,-.03,.0,-.02,.05,M.red); const r=new T3.Mesh(new T3.CylinderGeometry(.04,.04,.05,20),MP.tape); r.rotation.z=Math.PI/2; r.position.set(0,.0,.07); add(g,r); const c=new T3.Mesh(new T3.CylinderGeometry(.012,.012,.056,10),M.dark); c.rotation.z=Math.PI/2; c.position.set(0,-.035,-.025); add(g,c); }
  MP.cases=[]; for(let i=0;i<12;i++) MP.cases.push(makeCase(S));
  MP.boxes=[makeBox(S),makeBox(S)]; MP.supB=[makeBox(S),makeBox(S),makeBox(S)];
  MP.w=[makeHuman(S),makeHuman(S),makeHuman(S)];
}
/* ── 작업자 1 · 2 : 한 케이스 주기 장면 (sd = +1 동쪽 · −1 서쪽, τ = 첫 카톤 묶음을 집는 순간 기준 초, −3.5 ≤ τ < 8.5) ── */
function packScene(sd,ta){
  const X=CVX, Y=PKZ.y, a=MP.a, b=MP.b, h=MP.h, zC=MP.zC, zr=sd>0?-1:1, wx=u=>X+sd*u, PI=Math.PI, Ll=b-.008;
  const Sc=[wx(.84),MP.ystk,-10.27], Pc=[wx(.31),1.04,zC], Pw=[wx(MP.uC),Y,zC], Pb=[X,Y,MP.zB];
  /* 케이스 */
  const cs={ yaw:KF(ta,[[-2.3,PI/2],[-1.5,sd>0?PI:0]]), tilt:KF(ta,[[-2.3,PI/2],[-1.6,0]]), phi:KF(ta,[[-1.5,.05],[-.9,PI/2]]),
    lid:KF(ta,[[-.9,0],[-.5,-.22],[4.9,-.22],[5.4,PI/2]]), tuck:KF(ta,[[5.15,0],[5.45,PI/2]]), dust:KF(ta,[[-.9,0],[-.5,-.15],[4.3,-.15],[4.7,PI/2]]), stk:ta>=6.5, vis:ta>=-2.9 };
  const yref=KF(ta,[[-1.5,.145],[-.9,.06],[-.5,0]]), Pr=KF(ta,[[-2.6,Sc],[-2.3,[Sc[0],Sc[1]+.14,Sc[2]]],[-1.5,Pc],[-.9,Pc],[-.5,Pw],[7.3,Pw],[8.2,Pb,.09]]);
  cs.p=[Pr[0]+yref*Math.sin(cs.tilt)*Math.cos(cs.yaw), Pr[1]-yref*Math.cos(cs.tilt), Pr[2]-yref*Math.sin(cs.tilt)*Math.sin(cs.yaw)];
  const yh=KF(ta,[[-1.5,.145],[-.9,.0625]]), zh=a/2+b/2*Math.cos(cs.phi)+.012, end=s=>caseW(cs,0,yh,s*zh);
  /* 카톤 묶음(4개) 중심 : 벨트 → 케이스 안 (A = 벨트 쪽 열, B = 작업자 쪽 열) */
  const rowAt=(t0,u)=>KF(ta,[[t0+.15,[X,Y+.0325,zC]],[t0+.85,[wx(u),Y+.065,zC],.11]]), uA=MP.uC-.033, uB=MP.uC+.033;
  const row={A:ta>=0&&ta<1.0?rowAt(0,uA):null, B:ta>=3&&ta<4.0?rowAt(3,uB):null, pA:[wx(uA),Y+.065,zC], pB:[wx(uB),Y+.065,zC], sq:Math.max(ez3(ta/.15)*(ta<2?1:0),ez3((ta-3)/.15))};
  /* 손 (R = 케이스 로컬 +z 끝 · L = −z 끝) */
  const RE=s=>[X,Y+.12,MP.zB+zr*s*.24], RA=s=>[X,Y+.04,zC+zr*s*.205], R0=s=>[wx(.44),Y+.03,zC+zr*s*.25];
  const hand=s=>{ const g=(k)=>k;
    if(ta<-2.9) return {p:KF(ta,[[-3.5,RE(s)],[-3.1,[Sc[0]+s*.33,Sc[1]+.12,Sc[2]]],[-2.9,end(s)]]), g:.1, n:"in"};
    if(ta<-.5) return {p:end(s), g:.55, n:"in"};
    const grab=(t0,u)=>{ const q=ta-t0; if(q<.15) return {p:KF(q,[[-.5,end(s)],[-.12,RA(s)],[.15,[X,Y+.04,zC+zr*s*.188]]]), g:.2+.3*ez3(q/.15), n:"in"};
      if(q<.85){ const c=rowAt(t0,u); return {p:[c[0],c[1]+.006,c[2]+zr*s*.188], g:.5, n:"in"}; }
      return {p:KF(q,[[.85,[wx(u),Y+.071,zC+zr*s*.188]],[1.05,[wx(u)+sd*.02,Y+.22,zC+zr*s*.215]],[1.7,R0(s)]]), g:.15, n:q>1.2?"down":"in"}; };
    if(ta<1.7){ if(ta<0&&ta>=-.5){ return {p:KF(ta,[[-.5,end(s)],[-.12,RA(s)],[0,RA(s)]]), g:.15, n:"in"}; } return grab(0,uA); }
    if(ta<2.5) return {p:R0(s), g:.2, n:"down"};
    if(ta<4.05){ const q=ta-3; if(q<.15) return {p:KF(q,[[-.5,R0(s)],[-.1,RA(s)],[.15,[X,Y+.04,zC+zr*s*.188]]]), g:.2+.3*ez3(q/.15), n:"in"}; return grab(3,uB); }
    if(ta<4.72){ const dl=Math.max(0,cs.dust), tip=caseW(cs,0,h+.06*Math.cos(dl)+.012,s*(a/2-.06*Math.sin(dl))); return {p:KF(ta,[[4.05,[wx(uB)+sd*.02,Y+.22,zC+zr*s*.215]],[4.3,tip]]).map((v,i)=>ta>=4.3?tip[i]:v), g:.1, n:"down"}; }
    const lt=(th,z)=>caseW(cs,b/2-Ll*Math.sin(th),h+Ll*Math.cos(th)+.012,z);
    if(ta<5.6){ const z=s*.1, p0=caseW(cs,0,h+.012,s*(a/2-.06)); if(ta<4.9) return {p:KF(ta,[[4.72,p0],[4.9,lt(-.22,z)]]), g:.15, n:"down"}; if(ta<5.4) return {p:lt(cs.lid,z), g:.25, n:"down"}; return {p:KF(ta,[[5.4,lt(PI/2,z)],[5.6,caseW(cs,-b/2+.03,h+.012,z)]]), g:.05, n:"down"}; }
    const hold=caseW(cs,-.02,h+.012,-.09), disp=[wx(.40),Y+.075,zC+zr*.31], sp0=caseW(cs,-b/2+.012,h+.014,0), sp1=caseW(cs,-b/2-.014,h-.008,0), ce=caseW(cs,0,.065,s*(a/2+.012));
    if(ta<6.8){ if(s<0) return {p:KF(ta,[[5.6,caseW(cs,-b/2+.03,h+.012,-.1)],[5.8,hold]]), g:.05, n:"down"};
      return {p:KF(ta,[[5.6,caseW(cs,-b/2+.03,h+.012,.1)],[6.0,disp,.04],[6.5,sp0,.05],[6.65,sp1],[6.8,sp0]]), g:ta>5.9&&ta<6.5?.75:.2, n:"down"}; }
    if(ta<7.3) return {p:KF(ta,[[6.8,s<0?hold:sp0],[7.2,ce,.03]]), g:.3, n:"in"};
    if(ta<8.3) return {p:ce, g:.5, n:"in"};
    return {p:KF(ta,[[8.3,ce],[8.5,RE(s)]]), g:.15, n:"in"}; };
  const hR=hand(1), hL=hand(-1);
  const rt=KF(ta,[[-3.5,[.60,-9.98,.6]],[-2.95,[.72,-9.95,1.45]],[-2.3,[.72,-9.95,1.45]],[-1.55,[MP.uW,zC,0]],[7.3,[MP.uW,zC,0]],[8.1,[.60,-9.98,.6]],[8.5,[.60,-9.98,.6]]]);
  const stkPt=ta>=6.0&&ta<6.5?hR.p:null;
  return {cs,row, pose:{x:wx(rt[0]),z:rt[1],yaw:sd>0?-PI/2-rt[2]:PI/2+rt[2],L:hL.p,R:hR.p,gL:hL.g,gR:hR.g,nL:hL.n,nR:hR.n}, stkPt};
}
/* 카톤 b 의 위치 : 벨트(base) · 손 안 · 케이스 안 · 숨김 */
function manualCarton(b,base){
  const k=Math.floor(b/4), i=b-4*k, m=Math.floor(k/2), col=k-2*m, ta=MP.t-(MP.t0+6*m), g=col*3, q=ta-g; if(q<0) return base; if(ta>=5.5) return "hide";
  const sc=packSceneC(m,ta), c=q<1.0?(col?sc.row.B:sc.row.A):(col?sc.row.pB:sc.row.pA); if(!c) return base;
  const pitch=.094-.004*ez3(q/.15), sd=mod(m,2)?-1:1; return [c[0],c[1],c[2]+(i-1.5)*pitch,sd*Math.PI/2*ez3((q-.15)/.5)];   /* 옮기면서 90° 세움 */
}
function packSceneC(m,ta){ const key=m+"|"+ta, C=MP.pc||(MP.pc={}); if(C.key===key) return C.v; C.key=key; C.v=packScene(mod(m,2)?-1:1,ta); return C.v; }
/* ── 작업자 3 : 대박스 한 개 주기 (c = 0 ~ 24 초, n = 박스 번호) ── */
function slotOf(i){ const X=CVX, q=mod(i,4), L=Math.floor(mod(i,24)/4), col=q%2, r=q>>1, x=X+MP.pal[0]+(col?.205:-.205), z=MP.pal[1]+(r?-.3:.3);
  return {p:[x,.15+L*MP.box.y,z], st:r?[x,MP.pal[1]-.82,0]:[x,MP.pal[1]+.82,Math.PI], wp:r?[X+1.02,-15.0]:[X+1.05,MP.pal[1]+.8]}; }
const boxSlot=j=>CVX+MP.xBx+(j-1.5)*.143;
function pickTrack(j,q){ const X=CVX, Yt=PKZ.y-.1, d=MP.box; return KF(q,[[.15,[X,PKZ.y-.094,MP.zE]],[.95,[boxSlot(j),Yt+d.y+.05,MP.zBx],.06],[1.35,[boxSlot(j),Yt+.006,MP.zBx]]]); }
function boxScene(c,n){
  const X=CVX, Y=PKZ.y, Yt=Y-.1, d=MP.box, zBx=MP.zBx, xw=X+.69, PI=Math.PI, top=Yt+d.y, fl=d.z/2, XB=X+MP.xBx, TP=[XB,Yt,zBx], R0=[xw,-14.74], SG=[X+.75,-15.03], sl=slotOf(n), OPEN=MP.open;
  /* 걷기 구간 시간 */
  const d1=Math.hypot(sl.wp[0]-R0[0],sl.wp[1]-R0[1]), d1b=Math.hypot(sl.st[0]-sl.wp[0],sl.st[1]-sl.wp[1]), back=sl.st[1]>-14?[[sl.wp[0],sl.wp[1]]]:[];
  let d2=0, pv=[sl.st[0],sl.st[1]]; for(const q of back.concat([SG])){ d2+=Math.hypot(q[0]-pv[0],q[1]-pv[1]); pv=q; } const d3=Math.hypot(SG[0]-R0[0],SG[1]-R0[1]);
  const v=Math.max(1.1,(d1+d1b+d2+d3)/4.4), t0=17.1, twp=t0+d1/v, ta=twp+d1b/v, tb=ta+.9+d2/v, tc=tb+.8+d3/v;
  /* 몸 (x · z · 방향) */
  const rk=[[0,[R0[0],R0[1],-PI/2]]], addR=(t,x,z,yw)=>{ const p=rk[rk.length-1][1]; rk.push([t,[x,z,yw==null?p[2]:p[2]+Math.atan2(Math.sin(yw-p[2]),Math.cos(yw-p[2]))]]); };
  for(const c0 of MP.pk){ addR(c0-.45,xw,-14.42); addR(c0+.2,xw,-14.42); addR(c0+.9,xw,-14.68); addR(c0+1.6,xw,-14.68); }
  addR(12.3,R0[0],R0[1]); addR(t0,R0[0],R0[1]); addR(twp,sl.wp[0],sl.wp[1],Math.atan2(sl.wp[0]-R0[0],sl.wp[1]-R0[1])); addR(ta,sl.st[0],sl.st[1],sl.st[2]); addR(ta+.9,sl.st[0],sl.st[1]);
  { let tt=ta+.9, pq=[sl.st[0],sl.st[1]]; for(const q of back){ tt+=Math.hypot(q[0]-pq[0],q[1]-pq[1])/v; addR(tt,q[0],q[1],Math.atan2(SG[0]-q[0],SG[1]-q[1])); pq=q; } }
  addR(tb,SG[0],SG[1],PI); addR(tb+.8,SG[0],SG[1]); addR(tc,R0[0],R0[1],-PI/2); addR(24,R0[0],R0[1]);
  const rt=KF(c,rk), fw=[Math.sin(rt[2]),Math.cos(rt[2])], carry={p:[rt[0]+fw[0]*.47,1.0,rt[1]+fw[1]*.47],yaw:rt[2]+PI/2};
  const blend=(A,B,e)=>({p:mixA(A.p,B.p,e),yaw:angLerp(A.yaw,B.yaw,e)});
  /* 이번 박스(n) · 다음 박스(n+1) */
  const slotP={p:sl.p,yaw:sl.st[2]+PI/2};
  let bxA=c<16.6?{p:TP,yaw:0}:c<t0?blend({p:TP,yaw:0},carry,ez3((c-16.6)/.5)):c<ta?carry:c<ta+.55?blend(carry,slotP,ez3((c-ta)/.55)):null;
  if(bxA&&c>=ta){ bxA.p=bxA.p.slice(); bxA.p[1]+=0; }
  const sIdx=mod(n+1,4), supP={p:[MP.sup[0],MP.sup[1]+(3-sIdx)*d.y,MP.sup[2]],yaw:3*PI/2};
  const bxB=c<tb+.3?supP:c<tb+.8?blend(supP,carry,ez3((c-tb-.3)/.5)):c<tc?carry:c<tc+.6?blend(carry,{p:TP,yaw:0},ez3((c-tc)/.6)):{p:TP,yaw:0};
  const b1=KF(c,[[12.45,OPEN],[13.05,0]]), b2=KF(c,[[13.2,OPEN],[13.8,0]]), tape=KF(c,[[14.9,0],[15.6,1]]);
  /* 손 (L = 박스 로컬 +z 끝 = 남쪽 · R = 북쪽) */
  const bw=(o,x,y,z)=>{ const cs=Math.cos(o.yaw), sn=Math.sin(o.yaw); return [o.p[0]+x*cs+z*sn,o.p[1]+y,o.p[2]-x*sn+z*cs]; }, GR=[X+.42,Yt+.07,zBx+.33], HY=.075;
  const hand=s=>{ /* s : +1 L(남) · −1 R(북) */
    for(let j=0;j<4;j++){ const q=c-MP.pk[j]; if(q>=-.4&&q<1.6){ if(q<.15) return {p:[X,Y-.094+.07,MP.zE+s*.2-s*.008*ez3(q/.15)],g:.2+.3*ez3(q/.15),n:"in"};
        const cp=pickTrack(j,q); if(q<1.35) return {p:[cp[0],cp[1]+.07,cp[2]+s*.192],g:.5,n:"in"}; return {p:[boxSlot(j),Yt+.08+.14*ez3((q-1.35)/.25),zBx+s*.2],g:.15,n:"in"}; } }
    if(c>=12.1&&c<13.1){ const sx=s>0?1:-1, be=c<12.45?OPEN:b1, k=.62, tip=[XB+sx*(d.x/2-k*fl*Math.cos(be)),top+k*fl*Math.sin(be)+.016,zBx+s*.07]; return {p:tip,g:.1,n:be>1.6?[-sx,0,0]:"down"}; }   /* 옆 날개 : L = 가까운(동) · R = 먼(서) */
    if(c>=13.1&&c<13.9){ const be=c<13.2?OPEN:b2, tip=[XB+.06,top+fl*Math.sin(be)+.016,zBx+s*(d.z/2-fl*Math.cos(be))]; return {p:tip,g:.1,n:be>1.6?"in":"down"}; }                        /* 끝 날개 : L = 남 · R = 북 */
    const seam=[XB+(s>0?.14:-.04),top+.018,zBx+s*.07];
    if(c>=13.9&&c<16.1){ if(s>0) return {p:KF(c,[[13.9,seam],[15.0,seam],[15.25,[XB+.14,top+.018,zBx+.16]]]),g:.05,n:"down"};
      return {p:KF(c,[[13.9,seam],[14.35,GR,.05],[14.75,[XB-d.x/2-.03,top-.03,zBx],.08],[14.9,[XB-d.x/2+.01,top+.035,zBx]],[15.6,[XB+d.x/2-.01,top+.035,zBx]],[15.75,[XB+d.x/2+.03,top-.03,zBx]],[16.1,GR,.08]]),g:c>14.3&&c<16.05?.8:.2,n:"down"}; }
    if(c>=16.1&&c<ta+.55&&bxA){ const e=bw(bxA,0,HY,s*(d.z/2+.012)); return {p:c<16.6?KF(c,[[16.1,s>0?[XB+.14,top+.018,zBx+.16]:GR],[16.55,e,.04]]):e,g:.5,n:"in"}; }
    if(c>=ta+.55&&c<ta+.8) return {p:mixA(bw(slotP,0,HY,s*(d.z/2+.012)),bw(slotP,0,HY+.12,s*(d.z/2+.06)),ez3((c-ta-.55)/.25)),g:.15,n:"in"};
    if(c>=tb-.05&&c<tc+.6){ const e=bw(bxB,0,HY,s*(d.z/2+.012)); return {p:e,g:c<tb+.3?.2:.5,n:"in"}; }
    if(c>=tc+.6&&c<tc+.8) return {p:bw(bxB,0,HY+.14*ez3((c-tc-.6)/.2),s*(d.z/2+.05)),g:.15,n:"in"};
    return {p:null}; };
  const hL=hand(1), hR=hand(-1);
  const gun=c>=14.35&&c<16.1?KF(c,[[14.35,GR],[14.75,[XB-d.x/2-.03,top-.03,zBx],.08],[14.9,[XB-d.x/2+.01,top+.035,zBx]],[15.6,[XB+d.x/2-.01,top+.035,zBx]],[15.75,[XB+d.x/2+.03,top-.03,zBx]],[16.1,GR,.08]]):GR;
  return {pose:{x:rt[0],z:rt[1],yaw:rt[2],L:hL.p,R:hR.p,gL:hL.g,gR:hR.g,nL:hL.n,nR:hR.n}, bxA,bxB,b1:c<12.45?OPEN:b1,b2:c<13.2?OPEN:b2,tape,gun,gunUse:c>=14.35&&c<16.1,ta,placed:c>=ta+.55,sIdx};
}
function manualPrep(t,Ltot){ MP.t=t; MP.t0=(Ltot-.282)/.3+2.25; }
function stepManual(){
  if(!MP.cases) return; const X=CVX, Y=PKZ.y, Yt=Y-.1, t=MP.t, t0=MP.t0, PI=Math.PI, d=MP.box;
  const dt=MP.tp==null?0:Math.max(0,Math.min(.1,t-MP.tp)); MP.tp=t;
  const Tm=m=>t0+6*m, Arr=m=>Tm(m)+8.3+(MP.zB-MP.zK)/MP.vB+.6+(MP.zG0-MP.zE)/MP.vG, Bn=n=>Arr(4*n)+8.5, pkT=m=>{ const n=Math.floor(m/4); return Bn(n)+MP.pk[m-4*n]; };
  /* 작업자 1 · 2 */
  for(const w of [0,1]){ const m=w+2*Math.floor((t-t0-6*w+3.5)/12), ta=t-Tm(m), sc=packScene(w?-1:1,ta); poseHuman(MP.w[w],Object.assign(sc.pose,{dt})); }
  /* 작업자 3 */
  const n3=Math.floor((t-Bn(0))/24), c3=t-Bn(n3), bs=boxScene(c3,n3); poseHuman(MP.w[2],Object.assign(bs.pose,{dt}));
  if(bs.bxA) MP.boxes[mod(n3,2)].set({p:bs.bxA.p,yaw:bs.bxA.yaw,b1:bs.b1,b2:bs.b2,tape:bs.tape}); else MP.boxes[mod(n3,2)].G.visible=false;
  MP.boxes[mod(n3+1,2)].set({p:bs.bxB.p,yaw:bs.bxB.yaw,b1:MP.open,b2:MP.open,tape:0});
  for(let k=0;k<3;k++){ const on=k<3-bs.sIdx; if(on) MP.supB[k].set({p:[MP.sup[0],MP.sup[1]+k*d.y,MP.sup[2]],yaw:PI/2,b1:MP.open,b2:MP.open,tape:0}); else MP.supB[k].G.visible=false; }
  { const g=MP.gun; g.position.fromArray(bs.gun); g.rotation.set(bs.gunUse?-.5:0,0,bs.gunUse?0:PI/2); if(!bs.gunUse) g.position.y=Yt+.03; }
  /* 파렛트 위 박스 */
  { const cnt=mod(n3,24)+(bs.placed?1:0), M4=new T3.Matrix4(), q=new T3.Quaternion(), e=new T3.Euler(), v=new T3.Vector3(), one=new T3.Vector3(1,1,1);
    for(let i=0;i<cnt;i++){ const s=slotOf(i); q.setFromEuler(e.set(0,0,0)); M4.compose(v.set(s.p[0],s.p[1]+d.y/2,s.p[2]),q,one); MP.palB.setMatrixAt(i,M4); M4.compose(v.set(s.p[0],s.p[1]+d.y-.022,s.p[2]),q,one); MP.palT.setMatrixAt(i,M4); }
    for(const m of [MP.palB,MP.palT]){ m.count=cnt; m.instanceMatrix.needsUpdate=true; } }
  /* 대케이스 */
  let ci=0; const mTop=Math.floor((t-t0+2.9)/6);
  for(let m=mTop;m>mTop-14&&ci<MP.cases.length;m--){ const ta=t-Tm(m), sd=mod(m,2)?-1:1, yaw=sd>0?PI:0, n=Math.floor(m/4), j=m-4*n; let o=null;
    if(ta<8.3){ const sc=packScene(sd,ta); if(sc.cs.vis) o=sc.cs; }
    else { const tb=ta-8.3, z=MP.zB-MP.vB*tb, pk=pkT(m);
      if(z>MP.zK) o={p:[X,Y,z],yaw,stk:1,lab:z<-10.5};
      else { const tt=tb-(MP.zB-MP.zK)/MP.vB;
        if(tt<.6){ const e=ez3(tt/.6); o={p:[X,Y-.094*e,MP.zK+(MP.zG0-MP.zK)*e],yaw,stk:1,lab:1}; }
        else if(t<pk+.15){ let q=0, tp=-1e9; for(let k=1;k<=4;k++){ const pp=pkT(m-k)+.15; if(pp>t) q++; else if(pp>tp) tp=pp; }
          o={p:[X,Y-.094,Math.max(MP.zG0-MP.vG*(tt-.6),MP.zE+MP.sp*q,MP.zE+MP.sp*(q+1)-MP.vG*(t-tp))],yaw,stk:1,lab:1}; }
        else { const q=t-pk, cB=t-Bn(n); if(cB<13.9&&n===n3) o={p:q<1.35?pickTrack(j,q):[boxSlot(j),Yt+.006,MP.zBx],yaw,stk:1,lab:1}; } } }
    if(o) MP.cases[ci++].set(o); }
  for(;ci<MP.cases.length;ci++) MP.cases[ci].G.visible=false;
}
