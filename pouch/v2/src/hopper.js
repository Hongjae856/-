/* ═══ 데크 위 : 3연 호퍼 (1 첨가제 · 2 주성분 · 3 백당) — 거울면 스테인리스, 1 · 3 은 바깥쪽이 비스듬한 쐐기형,
       뚜껑 · 토글 클램프 · 손잡이 · 점검창 · 번호 표지, 1 · 3 뚜껑 위 진공이송기, 2 뚜껑 위 필터, 아래 도징부 ═══ */
function buildHoppers(g){
  const F=FL, Y=F.deckY, zc=F.zc, D=.3, yt=Y+1.06, xs=[3.05,3.6,4.24,4.79], SOUTH=0;
  const ext=(pts,mat)=>{ const sh=new T3.Shape(); pts.forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y)); const m=new T3.Mesh(new T3.ExtrudeGeometry(sh,{depth:D*2,bevelEnabled:false}),mat); m.position.z=zc-D; return add(g,m); };
  ext([[xs[0],yt],[xs[1],yt],[xs[1],Y+.56],[3.52,Y+.42],[3.4,Y+.42],[xs[0],yt-.14]],M.ssMir);           /* 1 */
  ext([[xs[1],yt],[xs[2],yt],[xs[2],Y+.6],[4.04,Y+.4],[3.8,Y+.4],[xs[1],Y+.6]],M.ssMir);                 /* 2 */
  ext([[xs[2],yt],[xs[3],yt],[xs[3],yt-.14],[4.44,Y+.42],[4.32,Y+.42],[xs[2],Y+.56]],M.ssMir);           /* 3 */
  for(let k=0;k<3;k++){ const x0=xs[k], x1=xs[k+1], xm=(x0+x1)/2;
    bx(g,x0-.012,x1+.012,yt,yt+.014,zc-D-.02,zc+D+.02,M.ssMir); bx(g,x0+.004,x1-.004,yt-.03,yt,zc+D,zc+D+.006,M.ss);       /* 뚜껑 · 테두리 */
    for(const x of [x0+.09,x1-.09]){ bx(g,x-.016,x+.016,yt-.07,yt+.02,zc+D+.006,zc+D+.022,M.ss); rod(g,[x-.012,yt-.075,zc+D+.024],[x+.012,yt-.075,zc+D+.024],.006,M.ssD,8); }   /* 토글 클램프 */
    plate(g,.05,.05,labelTex([[String(k+1),"#fff",150]],{w:192,h:192,bg:"#1f5fb8"}),[x0+.07,yt-.13,zc+D+.003],SOUTH); }
  for(const x of [xs[1]-.1,xs[2]+.1]){ bx(g,x-.05,x+.05,yt-.52,yt-.26,zc+D,zc+D+.004,M.dark); bx(g,x-.06,x+.06,yt-.53,yt-.25,zc+D-.001,zc+D+.002,M.ss); }      /* 점검창 (1 · 3) */
  rod(g,[3.82,yt-.12,zc+D+.05],[4.02,yt-.12,zc+D+.05],.009,M.ssMir,10); for(const x of [3.82,4.02]) rod(g,[x,yt-.12,zc+D],[x,yt-.12,zc+D+.05],.007,M.ssMir,8);   /* 2번 정면 손잡이 */
  for(const x of [3.3,4.54]){ rod(g,[x,yt+.014,zc],[x,F.top-.04,zc],.19,M.ssMir,40); rod(g,[x,F.top-.04,zc],[x,F.top,zc],.2,M.ss,40);             /* 진공이송기 */
    for(const y of [yt+.05,F.top-.08]) rod(g,[x,y,zc],[x,y+.022,zc],.197,M.ss,40);
    for(const a of [.6,2.2,3.9,5.4]) bx(g,x+Math.cos(a)*.2-.012,x+Math.cos(a)*.2+.012,yt+.03,yt+.1,zc+Math.sin(a)*.2-.012,zc+Math.sin(a)*.2+.012,M.ssD);
    tube(g,[[x+.08,F.top,zc],[x+.1,F.top+.12,zc-.08],[x+.22,F.top+.08,zc-.4],[x+.3,Y+1.3,zc-.8],[x+.34,Y+1.0,zc-1.0]],.02,M.hose);
    tube(g,[[x-.1,F.top-.2,zc+.19],[x-.16,yt+.3,zc+.26],[x-.12,yt-.2,zc+.34],[x-.02,Y+.5,zc+.36]],.007,M.hose); }
  rod(g,[3.92,yt+.014,zc],[3.92,yt+.07,zc],.03,M.ssMir,18); rod(g,[3.92,yt+.07,zc],[3.92,yt+.085,zc],.045,M.ss,18); rod(g,[3.92,yt+.085,zc],[3.92,yt+.27,zc],.04,M.white,20);   /* 2번 필터 */
  for(let k=0;k<6;k++) rod(g,[3.92,yt+.1+k*.028,zc],[3.92,yt+.108+k*.028,zc],.043,M.white,20);
  rod(g,[4.1,yt+.014,zc+.1],[4.1,yt+.1,zc+.1],.008,M.ssMir,8); rod(g,[3.74,yt+.05,zc-.1],[3.86,yt+.05,zc-.1],.008,M.ssMir,8);
  /* 도징부 : 가운데 깔때기 블록 · 1 · 3 배출 깔때기 · 공압 실린더 · 호스 · 흰 덮개 천 */
  bx(g,F.bx0+.05,F.bx1+.1,Y,Y+.1,zc-.42,zc+.42,M.ss);
  frustum(g,3.92,Y+.2,Y+.4,zc,.24,.5,.16,.3,M.ssMir); bx(g,3.82,4.02,Y+.1,Y+.2,zc-.16,zc+.16,M.ssMir);
  for(const x of [3.46,4.38]){ cone(g,[x,Y+.42,zc],[x,Y+.3,zc],.07,.03,M.ssMir,24); rod(g,[x,Y+.1,zc],[x,Y+.3,zc],.03,M.ssMir,16); bx(g,x-.07,x+.07,Y+.1,Y+.16,zc-.12,zc+.12,M.ss); }
  for(const [x,dz] of [[3.6,.2],[3.76,.24],[4.08,.24],[4.24,.2],[3.6,-.2],[4.24,-.2]]){ rod(g,[x,Y+.12,zc+dz],[x,Y+.36,zc+dz*.8],.016,M.alu,12); rod(g,[x,Y+.36,zc+dz*.8],[x,Y+.42,zc+dz*.75],.008,M.ssMir,8); rod(g,[x,Y+.1,zc+dz],[x,Y+.13,zc+dz],.02,M.dark,12);
    tube(g,[[x,Y+.34,zc+dz*.8],[x+.04,Y+.5,zc+dz*1.3],[x-.03,Y+.3,zc+dz*1.7],[x+.02,Y+.06,zc+dz*1.5]],.005,M.hose); }
  { const c=bx(g,3.5,4.34,Y+.1,Y+.13,zc+.2,zc+.44,M.cloth); c.rotation.x=.12; }
  /* 은색 주름 호스 · 밸브 터미널(녹색) · 소음기 2 */
  tube(g,[[4.3,Y+.2,zc+.3],[4.5,Y+.3,zc+.42],[4.72,Y+.2,zc+.5],[4.9,Y+.04,zc+.52]],.028,M.ssD);
  for(const dz of [0,.12]){ bx(g,F.bx1+.08,F.bx1+.3,Y+.02,Y+.1,zc+.2+dz,zc+.29+dz,M.dark); bx(g,F.bx1+.24,F.bx1+.3,Y+.1,Y+.15,zc+.2+dz,zc+.29+dz,M.green); }
  for(const dz of [-.05,.06]){ rod(g,[F.bx1+.12,Y+.1,zc+dz],[F.bx1+.12,Y+.16,zc+dz],.012,new T3.MeshStandardMaterial({color:0xb08d3c,metalness:.8,roughness:.4}),10); rod(g,[F.bx1+.12,Y+.16,zc+dz],[F.bx1+.12,Y+.22,zc+dz],.03,new T3.MeshStandardMaterial({color:0xe9e2c4,roughness:.6}),16); }
}
