/* ═══ 충전기 서쪽 정면 (도면 재판독 + 현장 사진 11/11 · DRAWING.md 9절)
   데크 밑 깔때기 노즐 10 → 은박 V 접힘 → [아크릴 함 0.97~1.88] 주황 손잡이 봉 → 세로 실링 유닛 → SOLPAC 커버 → 하부 죠 →
   ① 가로 실링 빔(실린더 4) → 파우치 줄 → ② 무늬 빔 → [함 아래] ③ 커팅 빔(각형 실린더 4) → 엠보 곡면 슈트 10 → 배출 컨베이어 받침 칸
   기준 : 은박 · 노즐 면 x = FM.xf, 열 간격 FM.P(70 mm), 커팅 높이 FM.yCut, 슈트 끝 약 455 mm ═══ */
function buildForming(g,by1){
  const F=FL, zc=F.zc, n=FM.n, P=FM.P, W=n*P, pz=FM.pz, wx=FM.xf+.062, X=d=>wx-d, edge=k=>zc-W/2+P*k, WEST=-Math.PI/2, yC=FM.yCut, xn=FM.xf;
  const warn=(x,y0,y1,z0,z1)=>{ const m=bx(g,x-.0012,x,y0,y1,z0,z1,M.warn); m.castShadow=false; };
  bx(g,wx,F.bx0,.5,by1,zc-.7,zc+.7,M.ss); bx(g,X(.03),X(0),.5,by1,zc-.7,zc+.7,M.grey);                  /* 성형부 틀 · 회색 뒤판 */
  bx(g,X(.3),X(.03),by1-.035,by1,zc-.62,zc+.62,M.ss);
  for(const dz of [-.05,.05]) rod(g,[X(.3),by1-.018,zc+dz],[X(.306),by1-.018,zc+dz],.018,M.ssD,18);
  /* 깔때기 노즐 10 : 흰 슬리브 · 스테인리스 깔때기 · 가로 판 · 노즐 파이프 / 뒤쪽 은박 V */
  for(let i=0;i<n;i++){ const z=pz(i);
    rod(g,[xn,by1-.095,z],[xn,by1-.035,z],.017,M.cream,16); cone(g,[xn,by1-.15,z],[xn,by1-.095,z],.011,.024,M.ss,20);
    rod(g,[xn,by1-.19,z],[xn,by1-.15,z],.011,M.ss,14); rod(g,[xn,1.64,z],[xn,by1-.19,z],.0075,M.ssMir,10);
    frustum(g,X(.02),by1-.21,by1-.035,z,.003,.066,.012,.03,M.foilP); }
  bx(g,xn-.028,xn+.028,by1-.158,by1-.152,zc-W/2-.03,zc+W/2+.03,M.ss);
  /* 주황 손잡이 봉 */
  rod(g,[X(.21),1.71,zc-.5],[X(.21),1.71,zc+.5],.011,M.ssMir,14);
  for(const s of [-1,1]){ const z=zc+s*.5; bx(g,X(.24),X(.03),1.685,1.735,z-.012,z+.012,M.ssD); rod(g,[X(.21),1.71,z],[X(.27),1.745,z+s*.03],.008,M.ssD,8); const k=new T3.Mesh(new T3.SphereGeometry(.02,16,12),M.orange); k.position.set(X(.28),1.75,z+s*.035); add(g,k); }
  /* 세로 실링 유닛 (열 사이 11) */
  for(let k=0;k<=n;k++){ const z=edge(k); bx(g,X(.2),X(.07),1.6,1.685,z-.011,z+.011,M.dark); bx(g,X(.215),X(.2),1.615,1.67,z-.007,z+.007,M.ssD); rod(g,[X(.16),1.685,z],[X(.16),1.7,z],.005,M.alu,8); }
  /* SOLPAC 커버 · 경고 표지 · 북쪽 조정 레버 */
  bx(g,X(.25),X(.07),1.495,1.595,zc-.45,zc+.45,M.ss);
  decal(g,.3,.06,textTex("SOLPAC","#f4f6f7",512,100,84),[X(.2515),1.545,zc+.2],WEST);
  for(const [dy,dz] of [[.024,0],[.024,.062],[-.024,0],[-.024,.062]]) warn(X(.25),1.545+dy-.019,1.545+dy+.019,zc-.42+dz-.027,zc-.42+dz+.027);
  bx(g,X(.2),X(.1),1.5,1.59,zc-.54,zc-.45,M.ssD); rod(g,[X(.15),1.545,zc-.54],[X(.15),1.545,zc-.6],.014,M.ssMir,12); rod(g,[X(.15),1.545,zc-.6],[X(.15),1.545,zc-.63],.022,M.grey,14);
  bx(g,X(.2),X(.1),1.51,1.58,zc+.45,zc+.56,M.ss);
  /* 하부 죠 · 가이드 봉 */
  for(let i=0;i<n;i++){ const z=pz(i); bx(g,X(.2),X(.07),1.425,1.495,z-.024,z+.024,M.ss); bx(g,X(.205),X(.2),1.435,1.485,z-.017,z+.017,M.ssD); }
  for(let k=0;k<=n;k++) rod(g,[X(.14),1.41,edge(k)],[X(.14),1.495,edge(k)],.004,M.ssMir,8);
  /* 각형 공압 실린더 (모서리 볼트 · 가운데 캡) */
  const cyl=(d0,y,z,sz)=>{ bx(g,X(d0+.07),X(d0),y-sz/2,y+sz/2,z-sz/2,z+sz/2,M.alu); rod(g,[X(d0+.07),y,z],[X(d0+.077),y,z],sz*.28,M.ssD,20); for(const a of [-1,1]) for(const b of [-1,1]) rod(g,[X(d0+.07),y+a*sz*.36,z+b*sz*.36],[X(d0+.075),y+a*sz*.36,z+b*sz*.36],.007,M.dark,8); };
  const cz=[-.375,-.125,.125,.375];
  /* ① 가로 실링 빔 */
  bx(g,X(.27),X(.07),1.295,1.41,zc-.52,zc+.52,M.ss);
  for(const c of cz){ cyl(.27,1.352,zc+c,.1); for(const b of [-1,1]){ rod(g,[X(.3),1.302,zc+c+b*.03],[X(.3),1.272,zc+c+b*.03],.006,M.alu,8); rod(g,[X(.3),1.272,zc+c+b*.03],[X(.26),1.245,zc+c+b*.045],.004,M.hose,6); } }
  for(const s of [-1,1]) warn(X(.27),1.325,1.38,zc+s*.47-.035,zc+s*.47+.035); warn(X(.27),1.39,1.408,zc-.025,zc+.025);
  /* ② 무늬 빔 (함 맨 아래) */
  bx(g,X(.26),X(.07),1.03,1.14,zc-.52,zc+.52,M.ss); bx(g,X(.3),X(.26),1.0,1.03,zc-.5,zc+.5,M.alu);
  for(const c of cz) bx(g,X(.31),X(.26),1.05,1.12,zc+c-.045,zc+c+.045,M.alu);
  warn(X(.26),1.12,1.138,zc-.03,zc+.03); for(const s of [-1,1]) warn(X(.26),1.06,1.1,zc+s*.47-.03,zc+s*.47+.03);
  for(let k=0;k<n;k+=2) rod(g,[X(.24),1.16,edge(k)+P*.5],[X(.2),1.185,edge(k)+P*.5],.006,M.dark,8);
  /* 은박 10열 (노즐 아래 ~ 커팅) */
  { const h=1.66-yC, sm=M.strip.clone(); sm.map=TX.strip.clone(); sm.map.repeat.set(1,h/FM.stickL); sm.map.needsUpdate=true; FM.stripTex=sm.map;
    for(let i=0;i<n;i++){ const m=new T3.Mesh(new T3.PlaneGeometry(FM.stickW,h),sm); m.rotation.y=WEST; m.position.set(xn,yC+h/2,pz(i)); add(g,m); } }
  /* ③ 커팅 빔 (아크릴 함 아래) · 각형 실린더 4 · 위험 표지 */
  bx(g,X(.24),X(.03),yC+.01,.93,zc-.5,zc+.5,M.ss); bx(g,X(.25),X(.24),yC+.03,.91,zc-.48,zc+.48,M.alu);
  for(const c of cz) cyl(.25,yC+.075,zc+c,.11);
  warn(X(.25),.905,.928,zc-.03,zc+.03); bx(g,X(.2),X(.03),yC-.004,yC+.01,zc-.4,zc+.4,M.ssD);
  /* 케이블 체인 (함 안 양옆) */
  for(const s of [-1,1]){ const z=a=>zc+s*a; chain(g,[[X(.17),1.38,z(.54)],[X(.17),1.22,z(.55)],[X(.17),1.08,z(.57)],[X(.17),1.04,z(.6)],[X(.17),1.1,z(.63)],[X(.17),1.26,z(.63)]],.06,.02,M.black,[1,0,0]);
    tube(g,[[X(.12),1.67,z(.5)],[X(.16),1.6,z(.57)],[X(.14),1.5,z(.6)],[X(.12),1.42,z(.55)]],.013,M.dark); }
  /* 엠보 곡면 슈트 10 : 커팅 아래 수직 → 서쪽으로 휘어 받침 칸 바로 위에서 끝남 (끝 높이 ≈ 455) */
  const r=.2, cy=yC-.005, a1=.96, prof=[]; for(let k=0;k<=12;k++){ const a=k/12*a1; prof.push([xn-r+r*Math.cos(a),cy-r*Math.sin(a)]); }
  { const e=prof[prof.length-1]; for(const t of [.14,.28]) prof.push([e[0]-t*Math.sin(a1),e[1]-t*Math.cos(a1)]); }
  FM.chute=prof.map(q=>[q[0],q[1]]);
  const lip=prof.map((q,k)=>{ const a=prof[Math.max(0,k-1)], b=prof[Math.min(prof.length-1,k+1)], tx=b[0]-a[0], ty=b[1]-a[1], l=Math.hypot(tx,ty); return [q[0]+ty/l*.008,q[1]-tx/l*.008]; });
  for(let i=0;i<n;i++){ const z=pz(i); ribbon(g,prof,z-.02,z+.02,M.emboss); for(const s of [-1,1]) fin(g,prof,lip,z+s*.02,M.sheet); bx(g,xn-.014,xn+.002,cy-.03,cy,z-.02,z+.02,M.white); }
  bx(g,xn+.004,xn+.03,cy-.12,cy,zc-.4,zc+.4,M.ssD);
  bx(g,xn-.05,wx,.36,.39,zc-.42,zc+.42,M.blue);                                                          /* 슈트 뒤 파란 받이 */
  /* 아크릴 함 (알루미늄 틀) : 북쪽 판(SP303) · 가운데 문 2 · 남쪽 판(SOLPAC packaging machine) · 옆면 */
  const dd=.42, y0=.97, y1=by1-.02, zN=zc-.64, zS=zc+.64, xd=X(dd), fr=new T3.MeshStandardMaterial({color:0xe6e8ea,metalness:.6,roughness:.45});
  for(const z of [zN,zS]){ bx(g,xd-.02,xd+.02,y0,y1,z-.02,z+.02,fr); bx(g,xd+.02,X(.03),y0,y0+.03,z-.015,z+.015,fr); bx(g,xd+.02,X(.03),y1-.03,y1,z-.015,z+.015,fr); bx(g,xd,X(.03),y0+.03,y1-.03,z-.003,z+.003,M.acryl); }
  bx(g,xd-.02,xd+.02,y1-.04,y1,zN,zS,fr); bx(g,xd-.02,xd+.02,y0,y0+.035,zN,zS,fr);
  const sp=[zN+.02,zc-.42,zc-.08,zc+.26,zS-.02];
  for(let k=0;k<4;k++){ bx(g,xd-.003,xd+.003,y0+.035,y1-.04,sp[k]+.004,sp[k+1]-.004,M.acryl); if(k) bx(g,xd-.006,xd+.006,y0+.035,y1-.04,sp[k]-.004,sp[k]+.004,fr); }
  for(const z of [zc-.115,zc-.045]){ rod(g,[xd-.04,1.28,z],[xd-.04,1.44,z],.008,fr,10); for(const y of [1.28,1.44]) rod(g,[xd,y,z],[xd-.04,y,z],.006,fr,8); }
  for(const z of [sp[1],sp[3]]) for(const y of [1.12,1.7]) bx(g,xd-.012,xd-.004,y-.03,y+.03,z-.025,z+.025,fr);                 /* 경첩 */
  decal(g,.2,.075,textTex("SP303","#ffffff",512,190,170),[xd-.005,1.76,(sp[0]+sp[1])/2],WEST);
  decal(g,.3,.075,textTex("SOLPAC","#ffffff",512,128,112),[xd-.005,1.3,(sp[3]+sp[4])/2],WEST);
  decal(g,.3,.1,tex(cvs(512,170,(c)=>{ c.clearRect(0,0,512,170); c.fillStyle="#fff"; c.font='72px Arial'; c.textAlign="left"; c.fillText("packaging",30,70); c.fillText("machine",30,150); }),1,1,true),[xd-.005,1.19,(sp[3]+sp[4])/2],WEST);
  plate(g,.17,.13,labelTex([["금 지","#fff",64],["도어 인터락 작동중","#111",40],["운전중 개방금지","#c00",40]],{w:512,h:390,border:"#c00",bg:"#fff"}),[xd-.006,1.54,zc+.07],WEST);
  plate(g,.12,.07,labelTex([["고온주의","#c8201c",100]],{w:512,h:290,border:"#c8201c"}),[xd-.006,1.54,zc+.23],WEST);
  /* 계단형 스테인리스 발판 (남서) */
  { const x0=xd-.95, z0=zc+.95; bx(g,x0,x0+.36,.2,.215,z0,z0+.28,M.deck); for(const dx of [.02,.34]) for(const dz of [.02,.26]) rod(g,[x0+dx,0,z0+dz],[x0+dx,.2,z0+dz],.012,M.ssMir,10); rod(g,[x0+.02,.08,z0+.02],[x0+.34,.08,z0+.02],.008,M.ssMir,8); rod(g,[x0+.02,.08,z0+.26],[x0+.34,.08,z0+.26],.008,M.ssMir,8); }
}
