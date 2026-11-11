/* ═══ 파우치 충전기 SP303 · 2층 데크 · 난간 · 계단 — 도면값 + 현장 사진 (DRAWING.md 1 · 6절)
   정면(성형 · 배출) 서쪽 · 은박 롤 동쪽 · 제어함 문 남쪽 · 판넬 북서 (사용자 확정) ═══ */
function buildFiller(S){
  const g=new T3.Group(); S.add(g);
  const F=FL, Y=F.deckY, xw=F.x0-F.ext;
  /* ── 데크 : 체크무늬판 · 각관 보 · 테두리판 · 기둥 · 경사 보강재 ── */
  const deck=(x0,x1,z0,z1)=>{ const m=bx(g,x0,x1,Y-.012,Y,z0,z1,M.deck.clone()); m.material.bumpMap=TX.checker.clone(); m.material.bumpMap.repeat.set((x1-x0)/.25,(z1-z0)/.25); m.material.bumpMap.needsUpdate=true; m.material.roughnessMap=m.material.bumpMap; };
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
  /* ── 계단 : 1,586 × 630 · 11단 · 50° · 양쪽 난간 ── */
  const n=STR.n, run=(STR.x1-STR.x0)/n, rise=Y/n;
  for(let i=0;i<n;i++){ const x=STR.x0+i*run, y=Y-(i+1)*rise+rise; const st=bx(g,x+.01,x+run+.04,y-rise-.006+rise*0,y-rise+.0+.02-.02,STR.z0+.04,STR.z1-.04,M.deck); st.position.y=Y-(i+.999)*rise; st.scale.y=1; st.geometry=new T3.BoxGeometry(run+.03,.025,STR.z1-STR.z0-.08); }
  for(const z of [STR.z0+.02,STR.z1-.02]){ const s=new T3.Mesh(new T3.BoxGeometry(Math.hypot(STR.x1-STR.x0,Y)+.1,.16,.012),M.ss); s.position.set((STR.x0+STR.x1)/2,Y/2-.06,z); s.rotation.z=-Math.atan2(Y,STR.x1-STR.x0); add(g,s);
    rod(g,[STR.x0,Y+.9,z],[STR.x1+.05,.9,z],.019,M.ssMir); rod(g,[STR.x0,Y+.5,z],[STR.x1+.05,.5,z],.013,M.ssMir);
    for(const t of [0,.5,1]){ const x=STR.x0+(STR.x1-STR.x0+.05)*t, y=Y*(1-t); rod(g,[x,y,z],[x,y+.9,z],.019,M.ssMir); } foot(g,STR.x1,z,.03,.03); }
  plate(g,.5,.16,labelTex([["계단 이용 시 난간을 잡으세요","#111",38]],{w:640,h:200,bar:"#c2185b"}),[STR.x1+.02,1.25,(STR.z0+STR.z1)/2],Math.PI/2);
  /* ── 본체 : 스테인리스 캐비닛 · 받침발 · 남쪽 제어함 문 · 통풍 루버 · 명판 ── */
  const by0=.45, by1=Y-.1, cz0=F.bz0+.12, cz1=F.bz1-.12;
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
  /* 동쪽 면 통풍 루버 · 명판 */
  { const G=new T3.Group(); for(let i=0;i<8;i++) bx(G,0,.012,i*.03,i*.03+.012,-.14,.14,M.ssD); G.position.set(F.bx1,1.2,cz1-.3); g.add(G); }
  plate(g,.22,.13,labelTex([["SOLPAC","#fff",70],["PACKAGING SOLUTIONS","#fff",26],["MODEL  SP303-10P","#111",30]],{w:512,h:300,bg:"#2d55a8"}),[F.bx1+.004,1.62,cz1-.3],Math.PI/2);
  /* ── 서쪽 정면 : 성형 → 세로 실링 → 가로 실링 → 커팅 → 곡면 슈트 → 포켓 트레이 ── */
  const wx=F.bx0, zc=F.zc, W=1.3, n10=10, pz=i=>zc-W/2+W*(i+.5)/n10;
  bx(g,wx-.03,wx,.55,by1,zc-.75,zc+.75,M.grey);                                         /* 정면 회색 판 */
  for(let i=0;i<n10;i++){ cone(g,[wx-.12,by1-.02,pz(i)],[wx-.12,by1-.2,pz(i)],.05,.022,M.ss,18);       /* 성형 숄더 */
    bx(g,wx-.125,wx-.115,1.02,by1-.2,pz(i)-.04,pz(i)+.04,M.foil);                        /* 은박 10줄 */
    bx(g,wx-.16,wx-.13,1.45,1.68,pz(i)-.05,pz(i)+.05,M.ss); }                            /* 세로 실링 판 */
  rod(g,[wx-.2,1.74,zc-.72],[wx-.2,1.74,zc+.72],.012,M.ssMir); for(const z of [zc-.74,zc+.74]) rod(g,[wx-.2,1.74,z-.02],[wx-.2,1.74,z+.02],.03,M.orange,16);
  bx(g,wx-.22,wx-.02,1.3,1.42,zc-.7,zc+.7,M.ss);                                         /* 가로 실링 블록 */
  bx(g,wx-.22,wx-.02,1.1,1.2,zc-.7,zc+.7,M.ss);                                          /* 커터 블록 */
  for(const y of [1.36,1.15]) for(let k=0;k<4;k++){ const z=zc-.5+k*.333; bx(g,wx-.32,wx-.22,y-.05,y+.05,z-.06,z+.06,M.alu); rod(g,[wx-.36,y,z],[wx-.32,y,z],.012,M.ssMir); }
  plate(g,.5,.2,labelTex([["SOLPAC","#17408f",120],["packaging machine","#333",40]],{w:512,h:220}),[wx-.225,1.36,zc+.0],-Math.PI/2).visible=false;
  for(let i=0;i<n10;i++){ const z=pz(i); const sh=new T3.Mesh(new T3.CylinderGeometry(.16,.16,.1,14,1,true,Math.PI*1.0,Math.PI*.42),M.ssMir); sh.rotation.x=Math.PI/2; sh.position.set(wx-.2,1.06,z); sh.material.side=T3.DoubleSide; add(g,sh);
    bx(g,wx-.42,wx-.3,.9,.97,z-.055,z+.055,M.black); }                                   /* 곡면 슈트 · 포켓 */
  bx(g,wx-.62,wx-.2,.86,.9,zc-.8,zc+.8,M.ss); bx(g,wx-.6,wx-.22,.52,.86,zc-.78,zc+.78,M.ss);           /* 트레이 모듈 */
  for(const z of [zc-.7,zc+.7]) for(const x of [wx-.56,wx-.26]){ rod(g,[x,.02,z],[x,.52,z],.016,M.ssD,10); rod(g,[x,0,z],[x,.02,z],.04,M.ss,16); }
  bx(g,wx-.62,wx-.2,.4,.95,zc+.8,zc+1.12,M.ssMir); { const c=new T3.Mesh(new T3.CylinderGeometry(.16,.16,.42,24,1,false,0,Math.PI),M.ssMir); c.rotation.z=Math.PI/2; c.position.set(wx-.41,.95,zc+.96); add(g,c); }   /* 남쪽 구동부 커버 */
  bx(g,wx-.52,wx-.3,.55,.75,zc+1.12,zc+1.25,M.blue);
  bx(g,wx-.62,wx-.2,.86,.862,zc-.78,zc+.78,M.blue);
  for(const z of [zc-.6,zc+.6]) rod(g,[wx-.64,.8,z-.05],[wx-.64,.8,z+.05],.012,M.dark);
  for(const s of [-1,1]){ bx(g,wx-.45,wx-.27,.97,1.06,zc+s*.36-.34,zc+s*.36+.34,M.acryl); rod(g,[wx-.47,1.02,zc+s*.36-.08],[wx-.47,1.02,zc+s*.36+.08],.008,M.ssMir); }
  /* 케이블 체인 · 주름 커버 이송 나사 · 클램프 레버 (성형부 양옆) */
  for(const s of [-1,1]){ const z=zc+s*.71; for(let k=0;k<14;k++) bx(g,wx-.2,wx-.12,1.0+k*.05,1.04+k*.05,z-.03,z+.03,M.black);
    for(let k=0;k<16;k++) rod(g,[wx-.3,1.08+k*.022,z],[wx-.3,1.095+k*.022,z],.028-(k%2)*.006,M.dark,14); }
  rod(g,[wx-.26,1.5,zc-.76],[wx-.4,1.42,zc-.76],.012,M.dark);
  /* 배출부 : 서쪽으로 빠지는 투명 커버 컨베이어 시작부 · 경광등 · 조작 박스 · 공압 레귤레이터 */
  rod(g,[wx-.78,.5,zc-1.0],[wx-.78,1.3,zc-1.0],.018,M.ssMir);
  for(const [y,m] of [[1.3,M.green],[1.36,M.yellow],[1.42,M.red]]) rod(g,[wx-.78,y,zc-1.0],[wx-.78,y+.058,zc-1.0],.032,m,18);
  bx(g,wx-1.05,wx-.62,.12,.52,zc-1.25,zc-.85,M.ssMir); bx(g,wx-.98,wx-.86,.52,.6,zc-1.12,zc-1.0,M.yellow); rod(g,[wx-.92,.6,zc-1.06],[wx-.92,.64,zc-1.06],.035,M.red,18); for(const dz2 of [-.95,-.9]) rod(g,[wx-.75,.52,zc+dz2],[wx-.75,.54,zc+dz2],.012,M.dark,10);   /* 바닥 조작 박스 · 비상정지 */
  plate(g,.2,.07,labelTex([["불량 조치 시","#c00",50],["핀셋 사용","#c00",50]],{w:384,h:140,border:"#c00"}),[wx-.462,.8,zc+.2],-Math.PI/2);
  for(const dz of [.15,.3]){ rod(g,[wx-.2,.42,zc-.5+dz],[wx-.2,.56,zc-.5+dz],.028,M.white,12); rod(g,[wx-.2,.56,zc-.5+dz],[wx-.2,.62,zc-.5+dz],.022,M.dark,12); }
  /* 정면 투명 아크릴 문 (도어 인터락) */
  bx(g,wx-.52,wx-.5,1.05,by1,zc-.78,zc+.78,M.acryl);
  for(const z of [zc-.78,zc+.78]) bx(g,wx-.53,wx-.49,1.05,by1,z-.012,z+.012,M.ss);
  plate(g,.36,.22,labelTex([["금 지","#fff",70],["도어 인터락 작동중","#111",44],["운전중 개방금지","#c00",44]],{w:512,h:320,border:"#c00"}),[wx-.531,1.5,zc+.45],-Math.PI/2);
  plate(g,.3,.1,labelTex([["SP303","#111",110]],{w:512,h:170,bg:"#e9ecef"}),[wx-.531,1.72,zc-.4],-Math.PI/2);
  /* ── 동쪽 : 은박 롤 언와인더 · 댄서 암 · 접합대 · 아크릴 롤러 커버 · 인쇄 유닛 ── */
  const ex=F.bx1+.02;
  for(const z of [zc-.62,zc+.62]) bx(g,ex,ex+.55,.45,1.5,z-.012,z+.012,M.grey);
  const roll=new T3.Mesh(new T3.CylinderGeometry(.27,.27,1.1,48),M.foilP); roll.rotation.x=Math.PI/2; roll.position.set(ex+.42,.72,zc); add(g,roll);
  rod(g,[ex+.42,.72,zc-.66],[ex+.42,.72,zc+.66],.04,M.ssMir,20); rod(g,[ex+.42,.72,zc-.57],[ex+.42,.72,zc+.57],.085,M.black,24);
  for(const [dx,y] of [[.12,1.0],[.3,1.12],[.2,1.3],[.46,1.38],[.6,.45],[.75,.5]]) rod(g,[ex+dx,y,zc-.6],[ex+dx,y,zc+.6],.028,M.ssMir,16);
  bx(g,ex+.5,ex+.86,.4,.43,zc-.6,zc+.6,M.ss); bx(g,ex+.56,ex+.84,.43,.44,zc-.56,zc+.56,M.foilP);              /* 접합대 */
  { const a=new T3.Mesh(new T3.TorusGeometry(.33,.012,8,24,Math.PI*.55),M.ss); a.position.set(ex+.42,.72,zc+.63); a.rotation.z=Math.PI*.3; add(g,a); }
  bx(g,ex+.03,ex+.7,1.02,1.5,zc-.64,zc+.64,M.acryl);
  bx(g,ex,ex+.6,1.55,1.9,zc-.55,zc+.3,M.grey); bx(g,ex+.6,ex+.62,1.55,1.9,zc-.55,zc+.3,M.acryl);               /* 인쇄 유닛 */
  bx(g,ex+.1,ex+.5,1.6,1.75,zc-.4,zc+.1,M.dark); rod(g,[ex+.64,1.6,zc-.5],[ex+.64,1.6,zc+.5],.035,M.alu,12);
  bx(g,ex+.01,ex+.14,1.05,1.5,zc+.4,zc+.72,M.white); bx(g,ex+.14,ex+.145,1.3,1.42,zc+.47,zc+.63,M.scr);        /* 소형 제어 박스 */
  for(const dz of [.78,.92]) { rod(g,[ex+.06,.5,zc+dz-.3],[ex+.06,.75,zc+dz-.3],.03,M.white,12); rod(g,[ex+.06,.75,zc+dz-.3],[ex+.06,.85,zc+dz-.3],.025,M.dark,12); }
  /* ── 데크 위 : 도징 베이스 · 호퍼 1(첨가제) · 2(주성분) · 3(백당) · 진공이송기 · 도징 실린더 ── */
  bx(g,F.bx0-.1,F.bx1+.3,Y,Y+.22,F.bz0+.2,F.bz1-.2,M.ss);
  const hop=(x,nm,vac)=>{ const w=vac?.46:.6, yb=Y+.62, yt=Y+(vac?1.08:1.02);
    bx(g,x-w/2,x+w/2,yb,yt,zc-.3,zc+.3,M.ssMir);                                           /* 상자형 몸체 */
    if(vac) frustum(g,x,Y+.3,yb,zc,w,.6,.12,.12,M.ssMir,(x<3.9?-.16:.16),0); else frustum(g,x,Y+.3,yb,zc,w,.6,.14,.14,M.ssMir);
    bx(g,x-w/2-.07,x+w/2+.07,yt,yt+.015,zc-.37,zc+.37,M.ssMir);                             /* 윗판 */
    bx(g,x-.1,x+.1,yb+.08,yt-.08,zc+.3,zc+.305,M.acryl);                                    /* 점검창 */
    plate(g,.09,.09,labelTex([[nm,"#fff",150]],{w:192,h:192,bg:"#1f5fb8"}),[x+w/2-.02,yt+.017,zc+.3],0).rotation.x=-Math.PI/2;
    if(vac){ rod(g,[x,yt+.015,zc],[x,F.top-.03,zc],.2,M.ssMir,36); rod(g,[x,F.top-.03,zc],[x,F.top,zc],.215,M.ss,36); rod(g,[x,yt+.3,zc],[x,yt+.32,zc],.212,M.ss,36);
      tube(g,[[x+.1,F.top,zc],[x+.14,F.top+.14,zc-.1],[x+.3,F.top+.1,zc-.5],[x+.5,Y+1.0,zc-1.0]],.022,M.hose); }
    else { bx(g,x-.2,x+.2,yt+.015,yt+.03,zc-.2,zc+.2,M.ss); rod(g,[x-.08,yt+.07,zc],[x+.08,yt+.07,zc],.01,M.ssMir); rod(g,[x,yt+.03,zc],[x,yt+.2,zc],.045,M.white,20); }
    for(let k=0;k<5;k++){ const z=zc-.24+k*.12; rod(g,[x,Y+.22,z],[x,Y+.44,z],.02,M.alu,10); rod(g,[x,Y+.44,z],[x,Y+.47,z],.012,M.orange,8); } };
  hop(3.3,"1",true); hop(3.92,"2",false); hop(4.54,"3",true);
  bx(g,F.bx1+.05,F.bx1+.28,Y+.22,Y+.5,zc-.5,zc-.3,M.green); rod(g,[F.bx1+.16,Y+.5,zc-.4],[F.bx1+.16,Y+.6,zc-.4],.03,M.yellow,16);     /* 공압 밸브 블록 · 압력계 */
  bx(g,F.bx0+.1,F.bx1+.1,Y+.22,Y+.3,zc-.08,zc+.08,M.cloth);
  /* 공압 호스 다발 (투명 · 파랑) · 은색 주름 진공 호스 */
  for(let k=0;k<7;k++){ const x=3.2+k*.24; tube(g,[[x,Y+.46,zc-.26],[x+.03,Y+.62,zc-.42],[x-.02,Y+.4,zc-.52],[x,Y+.24,zc-.46]],.006,k%2?M.hoseB:M.hose); }
  tube(g,[[F.bx1+.16,Y+.55,zc-.4],[F.bx1+.3,Y+.8,zc-.55],[F.bx1+.5,Y+.5,zc-.6],[F.bx1+.55,Y+.05,zc-.62]],.03,M.ssD);
  /* ── 컨트롤 판넬 : 데크에서 내려온 암 · 흰 함체 · 터치스크린 · RUN STOP JOG RESET FILLING BUZZER · 비상정지 ── */
  const px=2.0, pzz=F.z0+.45;
  bx(g,px-.03,px+.03,1.72,Y-.1,pzz-.03,pzz+.03,M.white); bx(g,px-.18,px+.02,1.05,1.72,pzz-.27,pzz+.27,M.white);
  bx(g,px-.186,px-.18,1.38,1.68,pzz-.21,pzz+.21,M.dark); bx(g,px-.188,px-.186,1.4,1.66,pzz-.19,pzz+.19,M.scr);
  const btn=(dz,y,mat)=>{ rod(g,[px-.18,y,pzz+dz],[px-.2,y,pzz+dz],.022,mat,18); rod(g,[px-.18,y,pzz+dz],[px-.185,y,pzz+dz],.03,M.ssD,18); };
  btn(-.18,1.27,M.blue); btn(-.06,1.27,M.red); btn(.06,1.27,M.grey); btn(-.18,1.15,M.yellow); btn(-.06,1.15,M.dark); btn(.06,1.15,M.grey);
  rod(g,[px-.18,1.2,pzz+.19],[px-.215,1.2,pzz+.19],.035,M.red,20); rod(g,[px-.18,1.2,pzz+.19],[px-.19,1.2,pzz+.19],.05,M.yellow,20);
  return g;
}
