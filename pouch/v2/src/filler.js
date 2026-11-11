/* ═══ 파우치 충전기 SP303 · 2층 데크 · 난간 · 계단 — 도면값 + 현장 사진 (DRAWING.md 1 · 6절)
   정면(성형 · 배출) 서쪽 · 은박 롤 동쪽 · 제어함 문 남쪽 · 판넬 북서 (사용자 확정) ═══ */
function buildFiller(S){
  const g=new T3.Group(); S.add(g);
  const F=FL, Y=F.deckY, xw=F.x0-F.ext;
  /* ── 데크 : 체크무늬판 · 각관 보 · 테두리판 · 기둥 · 경사 보강재 ── */
  const deck=(x0,x1,z0,z1)=>{ const m=bx(g,x0,x1,Y-.012,Y,z0,z1,M.deck.clone()); m.material.bumpMap=TX.checker.clone(); m.material.bumpMap.repeat.set((x1-x0)/.14,(z1-z0)/.14); m.material.bumpMap.needsUpdate=true; m.material.roughnessMap=m.material.bumpMap; };
  deck(xw,F.x1,F.z0,F.bz0-.02); deck(xw,F.x1,F.bz1+.02,F.z1); deck(xw,F.bx0-.02,F.bz0-.02,F.bz1+.02); deck(F.bx1+.02,F.x1,F.bz0-.02,F.bz1+.02);
  for(const z of [F.z0,F.z0+.65,F.bz0,F.bz1,F.z1-.65,F.z1]) bx(g,xw,F.x1,Y-.1,Y-.012,z-.03,z+.03,M.ss);           /* 각관 보 */
  for(let x=xw;x<=F.x1+.01;x+=(F.x1-xw)/5) bx(g,x-.03,x+.03,Y-.1,Y-.012,F.z0,F.z1,M.ss);
  const fas=(x0,x1,z0,z1)=>bx(g,x0,x1,Y-.2,Y+.03,z0,z1,M.ss);                                                    /* 테두리판 */
  fas(xw,F.x1,F.z0-.006,F.z0); fas(xw,STR.x0,F.z1,F.z1+.006); fas(xw-.006,xw,F.z0,F.z1); fas(F.x1,F.x1+.006,F.z0,STR.z0);
  const posts=[[xw+.05,F.z0+.05],[xw+.05,F.z1-.05],[F.x0,F.z0+.05],[F.x0,F.z1-.05],[F.x1-.05,F.z0+.05],[F.x1-.05,F.z1-.05]];
  for(const [x,z] of posts){ bx(g,x-.05,x+.05,.03,Y-.1,z-.05,z+.05,M.ss); foot(g,x,z,.03,.035);
    const sx=x<F.x0+1?1:-1, br=new T3.Mesh(new T3.BoxGeometry(.55,.07,.05),M.haz); br.position.set(x+sx*.2,Y-.3,z); br.rotation.z=sx*.75; add(g,br); }
  /* ── 난간 : 스테인리스 원형 파이프 (상단 935.6 + 가로 3단) · 난간 → 천장 지지봉 ── */
  const rail=(a,b)=>{ const L=Math.hypot(b[0]-a[0],b[1]-a[1]), n=Math.max(1,Math.round(L/1.0));
    for(let i=0;i<=n;i++){ const x=a[0]+(b[0]-a[0])*i/n, z=a[1]+(b[1]-a[1])*i/n; rod(g,[x,Y,z],[x,Y+F.rail,z],.021,M.ssMir); }
    for(const h of [F.rail,.72,.5,.28]) rod(g,[a[0],Y+h,a[1]],[b[0],Y+h,b[1]],h===F.rail?.021:.014,M.ssMir); };
  const e=.04;
  rail([xw+e,F.z0+e],[F.x1-e,F.z0+e]); rail([xw+e,F.z0+e],[xw+e,F.z1-e]); rail([F.x1-e,F.z0+e],[F.x1-e,STR.z0-.02]);
  rail([xw+e,F.z1-e],[3.85,F.z1-e]); rail([4.45,F.z1-e],[STR.x0-e,F.z1-e]);                                       /* 남쪽 : 원료투입구 개구 */
  bx(g,3.85,4.45,Y+.0,Y+.05,F.z1-.07,F.z1-.01,M.haz); rod(g,[3.85,Y+F.rail,F.z1-e],[4.45,Y+F.rail,F.z1-e],.012,M.yellow);
  plate(g,.42,.13,labelTex([["원료투입구","#111",90]],{w:512,h:160,border:"#c00"}),[4.15,Y+.55,F.z1-.02],0);
  for(const [x,z] of [[xw+e,F.z0+e],[F.x1-e,F.z0+e],[xw+e,F.z1-e]]) rod(g,[x,Y+F.rail,z],[x,RM.fill.h,z],.016,M.ssMir);
  plate(g,.5,.14,labelTex([["머리충돌주의!","#111",80]],{w:640,h:170,bg:"#f2c400",border:"#111"}),[xw-.008,Y-.09,F.z1-.9],-Math.PI/2);
  plate(g,.5,.14,labelTex([["머리충돌주의!","#111",80]],{w:640,h:170,bg:"#f2c400",border:"#111"}),[4.2,Y-.09,F.z1+.008],0);
  for(let x=xw+.15;x<F.x1;x+=.3) rod(g,[x,Y-.05,F.z1+.006],[x,Y-.05,F.z1+.01],.007,M.ssD,8);                         /* 테두리판 볼트 */
  buildStairs(g);
  /* ── 본체 : 스테인리스 캐비닛 · 받침발 · 남쪽 제어함 문 · 통풍 루버 · 명판 ── */
  const by0=.45, by1=Y-.1, cz0=F.bz0+.03, cz1=F.bz1-.03;
  bx(g,F.bx0,F.bx1,by0,by1,cz0,cz1,M.ss);                                                  /* 본체 프레임 캐비닛 */
  bx(g,F.bx0-.02,F.bx1+.02,by0-.06,by0,cz0-.02,cz1+.02,M.ssD);                              /* 하부 베이스 프레임 */
  for(const x of [F.bx0+.15,F.bx1-.15]) for(const z of [cz0+.15,cz1-.15]){ rod(g,[x,0,z],[x,.22,z],.085,M.ss,28); rod(g,[x,.22,z],[x,.26,z],.06,M.ssD,20); rod(g,[x,.26,z],[x,by0-.06,z],.028,M.ssD,12); }
  for(const z of [cz0+.5,cz1-.5]){ const c=new T3.Mesh(new T3.CylinderGeometry(.06,.06,.045,20),M.red); c.rotation.x=Math.PI/2; c.position.set(F.bx0+.55,.06,z); add(g,c); bx(g,F.bx0+.5,F.bx0+.6,.1,by0-.06,z-.03,z+.03,M.ssD); }
  /* 남쪽 : 세로로 긴 제어함 (문 · 경첩 · 손잡이 · 볼트) — 본체보다 앞으로 돌출 */
  const dx0=F.bx0+.38, dx1=F.bx1-.1, dz=F.bz1+.06;
  bx(g,dx0,dx1,by0+.02,by1-.02,cz1,dz,M.ss); bx(g,dx0+.03,dx1-.03,by0+.07,by1-.07,dz,dz+.01,M.ss);
  for(const y of [.75,1.2,1.65]) bx(g,dx0+.005,dx0+.035,y-.05,y+.05,dz+.01,dz+.024,M.ssD);
  bx(g,dx1-.1,dx1-.07,1.05,1.25,dz+.01,dz+.03,M.dark); rod(g,[dx1-.085,1.15,dz+.03],[dx1-.085,1.15,dz+.05],.02,M.ssMir,14);
  for(const x of [dx0+.015,dx1-.015]) for(let y=by0+.1;y<by1-.05;y+=.22) rod(g,[x,y,dz],[x,y,dz+.006],.007,M.ssD,8);
  plate(g,.26,.1,labelTex([["고온주의","#fff",110]],{w:512,h:190,bg:"#c8201c"}),[dx0-.2,1.5,cz1+.003],0);
  /* 노란 코일 에어호스 (나선) + 에어건 */
  { const pts=[], hx=dx0+.12, hz=dz+.06; for(let i=0;i<=140;i++){ const t=i/140, a=t*Math.PI*2*16; pts.push([hx+Math.cos(a)*.035,1.15-t*.8,hz+Math.sin(a)*.035]); } tube(g,pts,.006,M.yellow);
    rod(g,[hx,1.15,hz],[hx,1.3,dz+.012],.006,M.yellow); bx(g,hx-.015,hx+.015,1.28,1.4,dz+.01,dz+.05,M.dark); rod(g,[hx,.35,hz],[hx+.05,.2,hz+.05],.006,M.yellow); }
  /* 서쪽 하부 구동부 (곡면 스테인리스 커버 · 파란 감속기) — 제어함 왼쪽 아래 */
  { const cvr=new T3.Mesh(new T3.CylinderGeometry(.2,.2,.3,28,1,false,0,Math.PI),M.ssMir); cvr.rotation.z=Math.PI/2; cvr.rotation.y=Math.PI/2; cvr.position.set(F.bx0-.15,.5,cz1+.2); add(g,cvr);
    bx(g,F.bx0-.35,F.bx0+.05,.3,.5,cz1+.05,cz1+.35,M.ssMir); bx(g,F.bx0+.05,F.bx0+.25,.3,.48,cz1+.08,cz1+.3,M.blue); }
  /* ── 서쪽 정면 : 성형 · 실링 · 커팅 · 슈트 · 배출 트레이 (form.js) ── */
  buildForming(g,by1);
  const zc=F.zc;
  buildUnwinder(g,cz0,cz1);
  buildHoppers(g);
  /* ── 컨트롤 판넬 : 데크에서 내려온 암 · 흰 함체 · 터치스크린 · RUN STOP JOG RESET FILLING BUZZER · 비상정지 ── */
  const px=2.0, pzz=F.z0+.45;
  bx(g,px-.03,px+.03,1.72,Y-.1,pzz-.03,pzz+.03,M.white); plate(g,.1,.03,labelTex([["SOLPAC","#fff",70]],{w:256,h:80,bg:"#2d55a8"}),[px-.182,1.08,pzz+.12],-Math.PI/2); bx(g,px-.18,px+.02,1.05,1.72,pzz-.27,pzz+.27,M.white);
  bx(g,px-.186,px-.18,1.38,1.68,pzz-.21,pzz+.21,M.dark); bx(g,px-.188,px-.186,1.4,1.66,pzz-.19,pzz+.19,M.scr);
  const btn=(dz,y,mat)=>{ rod(g,[px-.18,y,pzz+dz],[px-.2,y,pzz+dz],.022,mat,18); rod(g,[px-.18,y,pzz+dz],[px-.185,y,pzz+dz],.03,M.ssD,18); };
  btn(-.18,1.27,M.blue); btn(-.06,1.27,M.red); btn(.06,1.27,M.grey); btn(-.18,1.15,M.yellow); btn(-.06,1.15,M.dark); btn(.06,1.15,M.grey);
  rod(g,[px-.18,1.2,pzz+.19],[px-.215,1.2,pzz+.19],.035,M.red,20); rod(g,[px-.18,1.2,pzz+.19],[px-.19,1.2,pzz+.19],.05,M.yellow,20);
  return g;
}
