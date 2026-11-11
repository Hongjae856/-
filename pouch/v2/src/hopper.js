/* ═══ 데크 위 충전부 (도면 재판독 + 사용자 제공 충전 Flow · 구조도 · 사진 11/11 · DRAWING.md 9절)
   호퍼 3기 : 서 → 동 = 1(착향제 · 첨가제) · 2(주성분, 수동 투입) · 3(백당). 각 호퍼는 10열 방향(남북)으로 길고 1 · 3 은 바깥면이 비스듬한 쐐기형.
   아래로 : 도징박스(검은 한 뭉치 · 3칸, 칸마다 축 + 스크래퍼) → 함량판 · 셔터 틀(셔터 실린더 · 바이브레이터) → 열별 검은 유닛 · 주황 속도 조절 밸브 →
   흰 슬리브 10 → (데크 밑) 깔때기 노즐. 동쪽 데크 : 공압 밸브함 → 진공 생성기 2 → 집진 매니폴드 · 주름 호스 (통행을 막지 않게 작게) ═══ */
function buildHoppers(g){
  const F=FL, Y=F.deckY, zc=F.zc, xc=FM.xf, D=.42, yt=Y+1.28, n=FM.n, pz=FM.pz, SOUTH=0, hb=.215;
  const ext=(pts,mat,d)=>{ const sh=new T3.Shape(); pts.forEach(([x,y],i)=>i?sh.lineTo(xc+x,Y+y):sh.moveTo(xc+x,Y+y)); const m=new T3.Mesh(new T3.ExtrudeGeometry(sh,{depth:(d||D)*2,bevelEnabled:false}),mat); m.position.z=zc-(d||D); return add(g,m); };
  /* 호퍼 3기 (거울면) */
  ext([[-.645,1.28],[-hb,1.28],[-hb,.62],[-.078,.47],[-.2,.47],[-.645,1.0]],M.ssMir);
  ext([[-hb+.005,1.28],[hb-.005,1.28],[hb-.005,.62],[.068,.47],[-.068,.47],[-hb+.005,.62]],M.ssMir);
  ext([[hb,1.28],[.645,1.28],[.645,1.0],[.2,.47],[.078,.47],[hb,.62]],M.ssMir);
  const xs=[-.645,-hb,hb,.645];
  for(let k=0;k<3;k++){ const x0=xc+xs[k], x1=xc+xs[k+1];
    bx(g,x0-.012,x1+.012,yt,yt+.014,zc-D-.02,zc+D+.02,M.ssMir);                                                 /* 뚜껑 */
    for(const s of [-1,1]){ const zf=zc+s*D, za=Math.min(zf,zf+s*.02), zb=Math.max(zf,zf+s*.02);
      for(const x of [x0+.07,x1-.07]) bx(g,x-.014,x+.014,yt-.07,yt+.02,za,zb,M.ss);                              /* 토글 클램프 */
      rod(g,[x0+.13,yt-.2,zf+s*.045],[x1-.13,yt-.2,zf+s*.045],.008,M.ssMir,10); for(const x of [x0+.13,x1-.13]) rod(g,[x,yt-.2,zf],[x,yt-.2,zf+s*.045],.007,M.ssMir,8); }   /* U 손잡이 */
    plate(g,.05,.05,labelTex([[String(k+1),"#fff",150]],{w:192,h:192,bg:"#1f5fb8"}),[x1-.05,yt-.34,zc+D+.003],SOUTH); }
  for(const z of [zc-.28,zc,zc+.28]) for(const [x,s] of [[xc-.645,-1],[xc+.645,1]]) bx(g,Math.min(x,x+s*.018),Math.max(x,x+s*.018),yt-.07,yt+.02,z-.014,z+.014,M.ss);
  plate(g,.05,.05,labelTex([["1","#fff",150]],{w:192,h:192,bg:"#1f5fb8"}),[xc-.648,yt-.2,zc+D-.08],-Math.PI/2);
  plate(g,.05,.05,labelTex([["3","#fff",150]],{w:192,h:192,bg:"#1f5fb8"}),[xc+.648,yt-.2,zc+D-.08],Math.PI/2);
  for(const x of [xc-hb-.075,xc+hb+.075]) for(const s of [-1,1]){ const zf=zc+s*D; bx(g,x-.045,x+.045,yt-.62,yt-.36,Math.min(zf,zf+s*.004),Math.max(zf,zf+s*.004),M.dark); bx(g,x-.055,x+.055,yt-.63,yt-.35,Math.min(zf-s*.001,zf+s*.002),Math.max(zf-s*.001,zf+s*.002),M.ss); }   /* 끝면 점검창 (1 · 3) */
  /* 진공이송기 (1 · 3 뚜껑 위) · 2번 뚜껑 필터 · 소음기 */
  for(const x of [xc-.43,xc+.43]){ rod(g,[x,yt+.014,zc],[x,F.top-.04,zc],.165,M.ssMir,40); rod(g,[x,F.top-.04,zc],[x,F.top,zc],.175,M.ss,40);
    for(const y of [yt+.05,F.top-.08]) rod(g,[x,y,zc],[x,y+.02,zc],.172,M.ss,40);
    for(const a of [.6,2.2,3.9,5.4]) bx(g,x+Math.cos(a)*.175-.011,x+Math.cos(a)*.175+.011,yt+.03,yt+.1,zc+Math.sin(a)*.175-.011,zc+Math.sin(a)*.175+.011,M.ssD);
    rod(g,[x,F.top,zc],[x,F.top+.05,zc],.026,M.ssMir,16); tube(g,[[x,F.top+.05,zc],[x+.02,F.top+.1,zc-.03],[x+.06,F.top+.11,zc-.1]],.026,M.ssMir);
    tube(g,[[x-.1,F.top-.15,zc+.15],[x-.14,yt+.2,zc+.3],[x-.1,yt-.3,zc+.46],[x-.02,Y+.45,zc+.48]],.006,M.hose); }
  rod(g,[xc-.05,yt+.014,zc-.1],[xc-.05,yt+.07,zc-.1],.026,M.ssMir,18); rod(g,[xc-.05,yt+.07,zc-.1],[xc-.05,yt+.082,zc-.1],.04,M.ss,18); rod(g,[xc-.05,yt+.082,zc-.1],[xc-.05,yt+.25,zc-.1],.034,M.white,20);
  for(let k=0;k<6;k++) rod(g,[xc-.05,yt+.095+k*.026,zc-.1],[xc-.05,yt+.103+k*.026,zc-.1],.038,M.white,20);
  rod(g,[xc+.08,yt+.014,zc+.12],[xc+.08,yt+.06,zc+.12],.022,M.ssMir,16); rod(g,[xc+.08,yt+.06,zc+.12],[xc+.08,yt+.22,zc+.12],.032,M.ss,18); for(let k=0;k<5;k++) rod(g,[xc+.08,yt+.075+k*.028,zc+.12],[xc+.08,yt+.083+k*.028,zc+.12],.035,M.ssD,18);
  for(const z of [zc-.3,zc+.3]){ rod(g,[xc-.06,yt+.055,z],[xc+.06,yt+.055,z],.008,M.ssMir,8); for(const d of [-.06,.06]) rod(g,[xc+d,yt+.014,z],[xc+d,yt+.055,z],.007,M.ssMir,8); }
  /* ── 도징박스 : 검은 한 뭉치 · 3칸 (칸마다 축 + 스크래퍼) ── */
  const bw=.205, dy0=Y+.3, dy1=Y+.47, dl=.4;
  bx(g,xc-.3,xc+.3,Y,Y+.02,zc-.56,zc+.56,M.ss);                                                                 /* 본체 윗판 */
  for(let k=0;k<3;k++){ const x0=xc-bw+k*(2*bw/3)+.003, x1=xc-bw+(k+1)*(2*bw/3)-.003; bx(g,x0,x1,dy0,dy1,zc-dl,zc+dl,M.black);
    for(const s of [-1,1]){ rod(g,[(x0+x1)/2,dy0+.085,zc+s*dl],[(x0+x1)/2,dy0+.085,zc+s*(dl+.012)],.03,M.ssD,20); rod(g,[(x0+x1)/2,dy0+.085,zc+s*(dl+.012)],[(x0+x1)/2,dy0+.085,zc+s*(dl+.03)],.012,M.ssMir,12); } }
  /* 함량판 · 셔터 틀 (스테인리스 레일) · 셔터 실린더 · 바이브레이터 */
  const fy0=Y+.2, fy1=Y+.3, fl=.5;
  for(const s of [-1,1]){ bx(g,xc+s*(bw+.012)-.012,xc+s*(bw+.012)+.012,fy0,fy1,zc-fl,zc+fl,M.ss); bx(g,xc-bw-.024,xc+bw+.024,fy0,fy1,zc+s*fl-.012,zc+s*fl+.012,M.ss);
    bx(g,xc+s*(bw+.03),xc+s*(bw+.05),fy0+.03,fy0+.045,zc-fl+.03,zc+fl-.03,M.ssMir); }
  bx(g,xc-bw+.01,xc+bw-.01,fy0+.05,fy0+.062,zc-fl+.02,zc+fl-.02,M.dark); bx(g,xc-bw+.01,xc+bw-.01,fy0+.03,fy0+.04,zc-fl-.08,zc+fl-.04,M.green.clone());
  rod(g,[xc,fy0+.035,zc-fl-.08],[xc,fy0+.035,zc-fl-.24],.02,M.alu,14); rod(g,[xc,fy0+.035,zc-fl-.24],[xc,fy0+.035,zc-fl-.26],.023,M.grey,14);
  for(const s of [-1,1]){ bx(g,xc-.05,xc+.05,fy0-.005,fy0+.03,zc+s*(fl+.02)-.03,zc+s*(fl+.02)+.03,M.blue); bx(g,xc-.05,xc+.05,Y+.1,Y+.135,zc+s*(fl-.06)-.03,zc+s*(fl-.06)+.03,M.red); }
  /* 열별 검은 유닛 · 양쪽 긴 면의 주황 속도 조절 밸브 줄 · 흰 슬리브 */
  for(const s of [-1,1]) bx(g,xc+s*.2-.015,xc+s*.2+.015,Y+.085,Y+.115,zc-.42,zc+.42,M.alu);
  for(let i=0;i<n;i++){ const z=pz(i); bx(g,xc-.13,xc+.13,Y+.115,fy0,z-.027,z+.027,M.black); rod(g,[xc,Y+.02,z],[xc,Y+.115,z],.018,M.cream,14);
    for(const s of [-1,1]){ const xf=xc+s*.2; bx(g,xf-.014,xf+.014,Y+.115,Y+.15,z-.014,z+.014,M.orange); rod(g,[xf+s*.014,Y+.1,z],[xf+s*.05,Y+.1,z],.011,M.ssMir,12);
      rod(g,[xc+s*.13,Y+.17,z],[xc+s*.15,Y+.17,z],.006,M.blue,8); tube(g,[[xc+s*.15,Y+.17,z],[xc+s*.24,Y+.2,z+.01],[xc+s*.27,Y+.1,z+.03],[xc+s*.26,Y+.045,z+.06]],.0045,M.hose); } }
  for(const s of [-1,1]) for(const dy of [0,.014]) tube(g,[[xc+s*.26,Y+.04+dy,zc-.4],[xc+s*.27,Y+.04+dy,zc],[xc+s*.26,Y+.04+dy,zc+.4],[xc+s*.1,Y+.05+dy,zc+.58]],.008,M.hose);
  /* 투명 경사 커버 (호퍼 1 · 3 아래) · 위쪽 주황 밸브 4 */
  for(const s of [-1,1]){ ribbon(g,[[xc+s*.5,Y+.56],[xc+s*.5,Y+.4],[xc+s*(bw+.03),Y+.31]],zc-dl,zc+dl,M.acryl); for(const z of [zc-dl,zc+dl]) rod(g,[xc+s*.5,Y+.56,z],[xc+s*.5,Y+.4,z],.008,M.ss,8); rod(g,[xc+s*.5,Y+.4,zc-dl],[xc+s*.5,Y+.4,zc+dl],.008,M.ss,8);
    rod(g,[xc+s*.52,Y+.47,zc-.06],[xc+s*.52,Y+.47,zc+.06],.006,M.ssMir,8); }
  bx(g,xc-.52,xc-.49,Y+.585,Y+.61,zc-.34,zc+.02,M.alu); for(let k=0;k<4;k++){ const z=zc-.3+k*.09; bx(g,xc-.53,xc-.505,Y+.61,Y+.645,z-.014,z+.014,M.orange); rod(g,[xc-.518,Y+.645,z],[xc-.518,Y+.67,z],.009,M.ssMir,10); }
  /* 남쪽 끝 : 게이트 · 셔터 실린더 · 고정 브래킷 · 덮개 천 */
  const cyl=(x,y0,y1,z)=>{ rod(g,[x,y0,z],[x,y1,z],.019,M.alu,14); rod(g,[x,y1,z],[x,y1+.012,z],.022,M.grey,14); rod(g,[x,y0-.012,z],[x,y0,z],.022,M.grey,14); rod(g,[x,y0-.07,z],[x,y0-.012,z],.006,M.ssMir,8); };
  for(const x of [xc-.3,xc+.02,xc+.3]) cyl(x,Y+.5,Y+.68,zc+D+.06);
  for(const x of [xc-.14,xc-.04,xc+.12]){ cyl(x,Y+.24,Y+.4,zc+fl+.06); bx(g,x-.028,x+.028,Y+.1,Y+.14,zc+fl+.03,zc+fl+.1,M.dark); }
  for(const s of [-1,1]) tube(g,[[xc+s*.13,Y+.4,zc+fl+.06],[xc+s*.22,Y+.52,zc+fl+.12],[xc+s*.3,Y+.3,zc+fl+.16],[xc+s*.27,Y+.05,zc+fl+.1]],.0055,M.hose);
  { const pts=[]; for(let k=0;k<=10;k++){ const a=Math.PI*k/10; pts.push([xc+.3*Math.cos(a)+.08,Y+.06+.015*Math.sin(a*3),zc+fl+.1+.16*Math.sin(a)]); } tube(g,pts,.032,new T3.MeshStandardMaterial({color:0x9ea3a8,roughness:.95})); }
  /* ── 동쪽 데크 : 공압 밸브함(아크릴 전면) → 진공 생성기 2(검정 · 녹색 상판 · 크림색 필터 컵) → 집진 매니폴드(가지 4) → 주름 호스 ── */
  const vx=xc+.36;
  bx(g,vx,vx+.24,Y+.02,Y+.2,zc-.34,zc+.34,M.ss); bx(g,vx+.24,vx+.245,Y+.04,Y+.18,zc-.31,zc+.31,M.acryl);
  for(const z of [zc-.16,zc+.16]){ bx(g,vx+.12,vx+.22,Y+.07,Y+.15,z-.1,z+.1,M.grey); for(let k=0;k<6;k++) bx(g,vx+.22,vx+.232,Y+.08,Y+.14,z-.09+k*.03,z-.07+k*.03,M.white); }
  for(let k=0;k<10;k++){ rod(g,[vx+.06,Y+.2,zc-.27+k*.06],[vx+.06,Y+.225,zc-.27+k*.06],.007,M.brass,8); tube(g,[[vx+.06,Y+.225,zc-.27+k*.06],[vx,Y+.3,zc-.25+k*.055],[vx-.1,Y+.24,pz(k)],[xc+.15,Y+.19,pz(k)]],.004,M.hose); }
  for(const [k,z] of [[0,zc-.08],[1,zc+.14]]){ const x=vx+.3+k*.06; bx(g,x,x+.07,Y+.03,Y+.17,z-.05,z+.05,M.black); bx(g,x,x+.07,Y+.17,Y+.185,z-.05,z+.05,M.green);
    rod(g,[x+.07,Y+.1,z],[x+.14,Y+.1,z],.02,M.dark,14); rod(g,[x+.16,Y+.1,z],[x+.16,Y+.13,z],.03,M.dark,16); rod(g,[x+.16,Y+.13,z],[x+.16,Y+.21,z],.034,M.cream,18); rod(g,[x+.16,Y+.21,z],[x+.16,Y+.225,z],.037,M.cream,18);
    tube(g,[[x+.16,Y+.1,z],[x+.2,Y+.09,z],[x+.24,Y+.06,z+.03]],.014,M.ssMir); tube(g,[[x+.24,Y+.06,z+.03],[x+.4,Y+.04,z+.2],[x+.2,Y+.04,zc+.52],[xc+.2,Y+.06,zc+.56]],.014,M.hose); }
  const mx=vx+.62;
  { const m=new T3.Mesh(new T3.CylinderGeometry(.04,.04,.3,24),M.ssMir); m.rotation.x=Math.PI/2; m.position.set(mx,Y+.07,zc+.2); add(g,m); cone(g,[mx,Y+.07,zc+.35],[mx,Y+.07,zc+.4],.04,.026,M.ssMir,24);
    for(let k=0;k<4;k++){ const z=zc+.09+k*.075; rod(g,[mx-.04,Y+.07,z],[mx-.09,Y+.07,z],.014,M.ssMir,12); rod(g,[mx-.09,Y+.07,z],[mx-.1,Y+.07,z],.02,M.ss,14); tube(g,[[mx-.1,Y+.07,z],[mx-.24,Y+.05,z+.05],[xc+.3,Y+.05,zc+.5+k*.02],[xc+.12-k*.06,Y+.08,zc+.56]],.013,M.ssD); }
    tube(g,[[mx,Y+.07,zc+.4],[mx,Y+.07,zc+.45],[mx,Y+.12,zc+.47]],.026,M.ssMir); rod(g,[mx,Y+.12,zc+.47],[mx,RM.fill.h,zc+.47],.03,M.hose,16);
    for(let y=Y+.2;y<RM.fill.h;y+=.06) rod(g,[mx,y,zc+.47],[mx,y+.012,zc+.47],.033,M.hose,16); }
  for(const dz of [0,.1]){ rod(g,[xc+.3,Y+.1,zc+fl+.06+dz],[xc+.3,Y+.18,zc+fl+.06+dz],.03,M.grey,16); rod(g,[xc+.3,Y+.18,zc+fl+.06+dz],[xc+.3,Y+.2,zc+fl+.06+dz],.034,M.blue,18); rod(g,[xc+.3,Y+.2,zc+fl+.06+dz],[xc+.3,Y+.22,zc+fl+.06+dz],.012,M.red,10); }   /* 집진 개폐 밸브 (파란 캡) */
}
