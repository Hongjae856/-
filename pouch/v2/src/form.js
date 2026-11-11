/* ═══ 충전기 서쪽 정면 : 성형 → 세로 실링 → 가로 실링 → 커팅 → 곡면 슈트 (현장 사진 기준 · DRAWING.md 6-4)
   위에서 아래로 : 충전 노즐 · 성형 은박(V) → 주황 손잡이 봉 → 세로 실링 유닛 → SOLPAC 커버 → 하부 죠 →
   가로 실링 빔(공압 실린더 4) → 늘어진 파우치 10열 → 커터 → 곡면 슈트 → 배출 컨베이어 칸 ═══ */
function buildForming(g,by1){
  const F=FL, wx=F.bx0, zc=F.zc, n=FM.n, P=FM.P, W=n*P, pz=FM.pz, X=d=>wx-d, edge=k=>zc-W/2+P*k, WEST=-Math.PI/2;
  bx(g,X(.03),X(0),.5,by1,zc-.78,zc+.78,M.grey);                                              /* 정면 회색 뒤판 */
  bx(g,X(.3),X(.03),by1-.05,by1,zc-.72,zc+.72,M.ss);                                          /* 데크 밑 가로 받침 */
  for(const dz of [-.06,.06]) rod(g,[X(.3),by1-.025,zc+dz],[X(.306),by1-.025,zc+dz],.022,M.ssD,18);
  /* 충전 노즐 · 성형 은박 · 성형 가이드 */
  for(let i=0;i<n;i++){ const z=pz(i);
    rod(g,[X(.1),by1-.05,z],[X(.1),1.63,z],.007,M.ssMir,10);
    frustum(g,X(.1),1.64,by1-.06,z,.004,.094,.014,.036,M.foilP);
    bx(g,X(.17),X(.06),by1-.12,by1-.05,z+.03,z+.036,M.ssD); }
  /* 주황 손잡이 봉 · 양끝 받침 */
  rod(g,[X(.21),1.665,zc-.62],[X(.21),1.665,zc+.62],.011,M.ssMir,14);
  for(const s of [-1,1]){ const z=zc+s*.62; bx(g,X(.24),X(.03),1.64,1.69,z-.012,z+.012,M.ssD); rod(g,[X(.21),1.665,z],[X(.27),1.7,z+s*.03],.008,M.ssD,8); const k=new T3.Mesh(new T3.SphereGeometry(.02,16,12),M.orange); k.position.set(X(.28),1.705,z+s*.035); add(g,k); }
  /* 세로 실링 유닛 (열 사이 11개) · 공압 피팅 */
  for(let k=0;k<=n;k++){ const z=edge(k); bx(g,X(.2),X(.07),1.585,1.635,z-.014,z+.014,M.dark); bx(g,X(.215),X(.2),1.595,1.625,z-.009,z+.009,M.ssD);
    rod(g,[X(.16),1.635,z],[X(.16),1.655,z],.006,M.alu,8); }
  /* SOLPAC 커버 (헤어라인 스테인리스) · 경고 표지 · 좌측 조정 레버 */
  bx(g,X(.25),X(.07),1.44,1.578,zc-.6,zc+.6,M.ss);
  decal(g,.36,.07,textTex("SOLPAC","#f4f6f7",512,100,84),[X(.2515),1.5,zc+.12],WEST);
  for(const [dy,dz] of [[.035,0],[.035,.075],[-.03,0],[-.03,.075]]){ const m=bx(g,X(.2512),X(.25),1.505+dy-.024,1.505+dy+.024,zc-.56+dz-.032,zc-.56+dz+.032,M.warn); m.castShadow=false; }
  bx(g,X(.2),X(.1),1.47,1.56,zc-.7,zc-.6,M.ssD); rod(g,[X(.15),1.515,zc-.7],[X(.15),1.515,zc-.76],.014,M.ssMir,12); rod(g,[X(.15),1.515,zc-.76],[X(.15),1.515,zc-.79],.022,M.grey,14);
  bx(g,X(.2),X(.1),1.48,1.55,zc+.6,zc+.74,M.ss);
  /* 하부 죠 (열마다) · 열 사이 가이드 봉 */
  for(let i=0;i<n;i++){ const z=pz(i); bx(g,X(.2),X(.07),1.365,1.44,z-.03,z+.03,M.ss); bx(g,X(.205),X(.2),1.375,1.43,z-.022,z+.022,M.ssD); }
  for(let k=0;k<=n;k++) rod(g,[X(.14),1.285,edge(k)],[X(.14),1.44,edge(k)],.005,M.ssMir,8);
  /* 가로 실링 빔 · 공압 실린더 4 (모서리 볼트 · 가운데 캡) · 양끝 위험 표지 */
  bx(g,X(.27),X(.07),1.15,1.285,zc-.68,zc+.68,M.ss);
  for(let k=0;k<4;k++){ const z=zc-.42+k*.28; bx(g,X(.335),X(.27),1.165,1.275,z-.055,z+.055,M.alu); rod(g,[X(.335),1.22,z],[X(.342),1.22,z],.03,M.ssD,20);
    for(const a of [-1,1]) for(const b of [-1,1]) rod(g,[X(.335),1.22+a*.04,z+b*.04],[X(.34),1.22+a*.04,z+b*.04],.008,M.dark,8);
    for(const b of [-1,1]){ rod(g,[X(.3),1.165,z+b*.035],[X(.3),1.13,z+b*.035],.007,M.alu,8); rod(g,[X(.3),1.13,z+b*.035],[X(.26),1.1,z+b*.05],.005,M.hose,6); } }
  for(const s of [-1,1]){ const m=bx(g,X(.2712),X(.27),1.19,1.25,zc+s*.62-.045,zc+s*.62+.045,M.warn); m.castShadow=false; }
  { const m=bx(g,X(.2712),X(.27),1.262,1.283,zc-.03,zc+.03,M.warn); m.castShadow=false; }
  for(let k=0;k<n;k+=1){ const z=edge(k)+P*.5; if(k%2===0) rod(g,[X(.25),1.13,z+.03],[X(.21),1.1,z+.03],.009,M.dark,8); }
  /* 은박 10열 (성형 뒤 ~ 커터) */
  { const h=1.64-FM.yCut, sm=M.strip.clone(); sm.map=TX.strip.clone(); sm.map.repeat.set(1,h/FM.stickL); sm.map.needsUpdate=true; FM.stripTex=sm.map;
    for(let i=0;i<n;i++){ const m=new T3.Mesh(new T3.PlaneGeometry(FM.stickW,h),sm); m.rotation.y=WEST; m.position.set(X(.062),FM.yCut+h/2,pz(i)); add(g,m); } }
  /* 커터 : 가로 바 · 양옆 검은 톱니판 · 열 감지 센서 */
  bx(g,X(.2),X(.03),FM.yCut,FM.yCut+.045,zc-.58,zc+.58,M.ssD); bx(g,X(.21),X(.2),FM.yCut+.008,FM.yCut+.037,zc-.56,zc+.56,M.ss);
  for(const s of [-1,1]){ bx(g,X(.25),X(.03),FM.yCut-.02,FM.yCut+.075,zc+s*.58,zc+s*.78,M.black); for(let k=0;k<6;k++) bx(g,X(.255),X(.25),FM.yCut-.012+k*.015,FM.yCut-.005+k*.015,zc+s*.6,zc+s*.76,M.dark); }
  for(let k=0;k<=n;k+=1) rod(g,[X(.12),FM.yCut-.02,edge(k)],[X(.12),FM.yCut,edge(k)],.006,M.dark,8);
  /* 케이블 체인 (양옆 U자) */
  for(const s of [-1,1]){ const z=a=>zc+s*a; chain(g,[[X(.17),1.2,z(.71)],[X(.17),1.0,z(.72)],[X(.17),.8,z(.76)],[X(.17),.74,z(.82)],[X(.17),.82,z(.88)],[X(.17),1.02,z(.9)],[X(.17),1.14,z(.9)]],.07,.022,M.black,[1,0,0]);
    tube(g,[[X(.12),1.62,z(.66)],[X(.16),1.5,z(.74)],[X(.14),1.36,z(.76)],[X(.12),1.26,z(.7)]],.014,M.dark); }
  /* 곡면 슈트 10 (경면 스테인리스 · 옆 턱) : 커터 아래 수직 → 서쪽으로 휘어 칸 위에서 끝남 */
  const r=.16, cy=FM.yCut-.012, prof=[]; for(let k=0;k<=12;k++){ const a=k/12*1.26; prof.push([X(.062+r-r*Math.cos(a)),cy-r*Math.sin(a)]); }
  { const a=1.26, e=prof[prof.length-1]; prof.push([e[0]-.11*Math.sin(a),e[1]-.11*Math.cos(a)]); }
  FM.chute=prof.map(q=>[q[0],q[1]]);
  const lip=prof.map((q,k)=>{ const a=prof[Math.max(0,k-1)], b=prof[Math.min(prof.length-1,k+1)], tx=b[0]-a[0], ty=b[1]-a[1], l=Math.hypot(tx,ty); return [q[0]+ty/l*.013,q[1]-tx/l*.013]; });
  for(let i=0;i<n;i++){ const z=pz(i); ribbon(g,prof,z-.04,z+.04,M.sheet); for(const s of [-1,1]) fin(g,prof,lip,z+s*.04,M.sheet); }
  bx(g,X(.07),X(.04),cy-.2,cy,zc-.56,zc+.56,M.ssD);                                            /* 슈트 고정 판 */
  /* 정면 투명 아크릴 문 (도어 인터락) : 2짝 · 알루미늄 틀 · 세로 손잡이 · 표지 */
  const dd=.42, dy0=.94;
  for(const s of [-1,1]){ bx(g,X(dd+.006),X(dd),dy0,by1,zc+s*.39-.385,zc+s*.39+.385,M.acryl);
    rod(g,[X(dd+.04),1.22,zc+s*.06],[X(dd+.04),1.5,zc+s*.06],.008,M.ssMir,10); for(const y of [1.22,1.5]) rod(g,[X(dd),y,zc+s*.06],[X(dd+.04),y,zc+s*.06],.006,M.ssMir,8); }
  for(const z of [zc-.785,zc+.785]) bx(g,X(dd+.02),X(dd-.02),dy0,by1,z-.015,z+.015,M.alu);
  bx(g,X(dd+.02),X(dd-.02),by1-.03,by1,zc-.8,zc+.8,M.alu); bx(g,X(dd+.012),X(dd-.006),dy0,by1,zc-.004,zc+.004,M.alu);
  for(const s of [-1,1]) bx(g,X(dd),X(.03),dy0,by1,zc+s*.79-.004,zc+s*.79+.004,M.acryl);       /* 옆면 아크릴 */
  plate(g,.34,.2,labelTex([["금 지","#fff",70],["도어 인터락 작동중","#111",44],["운전중 개방금지","#c00",44]],{w:512,h:320,border:"#c00"}),[X(dd+.008),1.58,zc+.5],WEST);
  decal(g,.3,.09,textTex("SP303","#f4f6f7",512,150,130),[X(dd+.008),1.8,zc-.45],WEST);
  plate(g,.2,.07,labelTex([["불량 조치 시","#c00",50],["핀셋 사용","#c00",50]],{w:384,h:140,border:"#c00"}),[X(dd+.008),1.05,zc+.55],WEST);
  /* 슈트 아래 파란 받이 · 성형부 하부 프레임 */
  bx(g,X(.24),X(.04),.52,.56,zc-.5,zc+.5,M.blue); bx(g,X(.26),X(.03),.47,.52,zc-.6,zc+.6,M.ssD);
  /* 계단형 스테인리스 발판 (남서) */
  { const x0=X(1.25), z0=zc+1.0; bx(g,x0,x0+.36,.2,.215,z0,z0+.28,M.deck); for(const dx of [.02,.34]) for(const dz of [.02,.26]) rod(g,[x0+dx,0,z0+dz],[x0+dx,.2,z0+dz],.012,M.ssMir,10); rod(g,[x0+.02,.08,z0+.02],[x0+.34,.08,z0+.02],.008,M.ssMir,8); rod(g,[x0+.02,.08,z0+.26],[x0+.34,.08,z0+.26],.008,M.ssMir,8); }
}
