/* ═══════════════════════════════════════════════════════════════════
   3D 보기 (파우치 엔진 = Three.js) — PTP 두 앱의 형상을 받아 그린다 (P1 · 11/17)
   · 공용 좌표 mm (x = 칸막이 벽 중심 0 · +x 포장실, y = 바닥 0, z = 라인 중심 0 · +z 작업자 쪽) → Three.js 는 m (× 0.001)
   · 충전기 형상 : 16 float 정점(위치 · 법선 · 색 rgba · 금속도 · 밝기 · 무광(fl) · 무늬 · uv), 충전기 단위(≈4 mm)
   · 포장라인 형상 : 위치 · 법선 · 색 rgba 배열, 포장라인 단위(≈5 mm) — 금속도는 색으로 판정(원본 셰이더 lMet 과 같은 식)
   · 방 형상 · 팩 : 16 float 정점, mm
   · 원본 렌더러처럼 면 방향은 시점 쪽으로 뒤집어 조명 (원본 형상의 감김 방향이 일정하지 않음)
   ═══════════════════════════════════════════════════════════════════ */
const MM=.001, STRIDE=16;
/* 충전기 크기 (11/24 사용자 지시 「PTP 충전기가 실제보다 너무 높음 — 같은 비율 0.8 · 조작판넬 1.7 m · 장비 2 m 이하 · 작업은 허리~가슴 · 조작은 눈높이」)
   앱 형상을 ×0.8 : 기준점 = 배출 컨베이어 끝(x −1296) · 라인 중심(z −230) · 바닥(y 0) — 해당 IDT 만(PTP 충전기 하드웨어)
   pfX · pfY · pfZ = 앱 단위(충전 1 = 4 mm) → 공용 mm / pfW = 옛 공용 mm(×1) → 새 공용 mm (1인칭 대상 · 작업 위치) */
const PF={s:.8, px:-1296, pz:-230};
const pfX=v=>PF.px+PF.s*(4*v-3680-PF.px), pfY=v=>PF.s*(4*v+1128), pfZ=v=>PF.pz+PF.s*(4*v-230-PF.pz);
const pfW=p=>[PF.px+PF.s*(p[0]-PF.px), PF.s*p[1], PF.pz+PF.s*(p[2]-PF.pz)].concat(p.slice(3));
const V3P={R:null, sc:null, cam:null, objs:{}, t:{gen:0,genMs:0,fps:0,n:0,t0:0}, ready:false, view:"orbit",
  orbit:{yaw:-0.42,pitch:0.42,dist:12500,tx:2600,ty:700,tz:200}};
/* ── 재질 : 정점색(sRGB → 선형) · 정점별 금속도 · 밝기 · 무광 ── */
function v3Mat(kind,transparent){
  const m=new T3.MeshStandardMaterial({vertexColors:true, roughness:.5, metalness:0, envMapIntensity:1.45, transparent:!!transparent, depthWrite:!transparent, side:T3.DoubleSide});
  m.onBeforeCompile=sh=>{
    sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nattribute float aMet; attribute float aBr; attribute float aFl; varying float vMet; varying float vFl; varying vec3 vSrgb; varying vec3 vWP;")
      .replace("#include <color_vertex>","#include <color_vertex>\nvSrgb=vColor.rgb; vColor.rgb=pow(max(vColor.rgb,vec3(0.0)),vec3(2.2))*"+(kind==="l"?"1.0":"pow(max(aBr,0.05),2.2)")+"; vMet=aMet; vFl=aFl;")
      .replace("#include <worldpos_vertex>","#include <worldpos_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;");
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nvarying float vMet; varying float vFl; varying vec3 vSrgb; varying vec3 vWP;\n"+
        "float lMet(vec3 c){float mx=max(c.r,max(c.g,c.b)),mn=min(c.r,min(c.g,c.b)),L=(mx+mn)*0.5; if(mx-mn<0.07&&L>0.52&&L<0.935)return 0.95; return 0.0;}\n"+
        "float hHash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }\n"+
        "float hLine(vec3 w){ vec2 q=vec2(w.y*900.0+w.z*900.0, floor(w.x*6.0)); return hHash(floor(q))*0.6+hHash(floor(q*0.37))*0.4; }")
      .replace("#include <normal_fragment_maps>","#include <normal_fragment_maps>\nif(dot(normal,vViewPosition)<0.0) normal=-normal;")
      .replace("#include <dithering_fragment>","#include <dithering_fragment>\nif(vFl>0.5) gl_FragColor=linearToOutputTexel(vec4(vColor.rgb,diffuseColor.a));");
    /* 재질 = 파우치 값 (idt_common/look.js · 11/20) — 금속도 : 충전기 · 방 = 정점 금속도(없으면 색으로) / 포장라인 = 색으로 */
    idtLookFrag(sh,{met:kind==="l"?"lMet(vSrgb)":"(vMet!=vMet?0.1:(vMet<-0.5?lMet(vSrgb):clamp(vMet,0.0,1.0)))", room:kind==="r", tr:!!transparent, wallP:kind==="r"?new T3.Vector4(ROOMBUS.L.backZ*MM,ROOMBUS.L.wallX*MM,ROOMBUS.L.wallT/2*MM+.012,0):null});
  };
  m.customProgramCacheKey=()=>"ptp-"+kind+(transparent?"t":"o");                                  /* 충전기 · 방(정점 금속도 · 밝기) 과 포장라인(색으로 금속도) 셰이더를 따로 */
  return m;
}
/* ── 동적 형상 그릇 : 같은 버퍼를 불투명 · 반투명 두 메시가 나눠 씀 ── */
function v3Inter(name,pos,scale){            /* 16 float 교차 배열 */
  const o={kind:"i", cap:0, buf:null, ib:null, g:[new T3.BufferGeometry(),new T3.BufferGeometry()], m:[]};
  const kd=name==="room"?"r":"i"; o.m[0]=new T3.Mesh(o.g[0],v3Mat(kd,false)); o.m[1]=new T3.Mesh(o.g[1],v3Mat(kd,true));   /* 방 = 바닥 · 벽 재질 (파우치) */
  for(const m of o.m){ m.frustumCulled=false; m.position.set(pos[0]*MM,pos[1]*MM,pos[2]*MM); m.scale.setScalar(scale*MM); V3P.sc.add(m); }
  o.m[0].castShadow=true; o.m[0].receiveShadow=true; o.m[1].receiveShadow=true; o.m[1].renderOrder=2;
  V3P.objs[name]=o; return o;
}
function v3SetInter(o,data,nOpq,nTot){
  const need=data.length;
  if(!o.buf||need>o.cap){ o.cap=Math.max(need,o.cap*2,STRIDE*3*1024); o.buf=new Float32Array(o.cap); o.ib=new T3.InterleavedBuffer(o.buf,STRIDE); o.ib.setUsage(T3.DynamicDrawUsage);
    for(const g of o.g){ g.setAttribute("position",new T3.InterleavedBufferAttribute(o.ib,3,0)); g.setAttribute("normal",new T3.InterleavedBufferAttribute(o.ib,3,3));
      g.setAttribute("color",new T3.InterleavedBufferAttribute(o.ib,4,6)); g.setAttribute("aMet",new T3.InterleavedBufferAttribute(o.ib,1,10));
      g.setAttribute("aBr",new T3.InterleavedBufferAttribute(o.ib,1,11)); g.setAttribute("aFl",new T3.InterleavedBufferAttribute(o.ib,1,12)); } }
  o.buf.set(data); o.ib.updateRange.offset=0; o.ib.updateRange.count=need; o.ib.needsUpdate=true;
  o.g[0].setDrawRange(0,nOpq); o.g[1].setDrawRange(nOpq,Math.max(0,nTot-nOpq));
}
function v3Line(name,pos,scale){             /* 위치 · 법선 · 색 배열 (불투명 / 반투명 따로) */
  const o={kind:"l", part:[0,1].map(k=>({cap:0, g:new T3.BufferGeometry()})), m:[]};
  o.m[0]=new T3.Mesh(o.part[0].g,v3Mat("l",false)); o.m[1]=new T3.Mesh(o.part[1].g,v3Mat("l",true));
  for(const m of o.m){ m.frustumCulled=false; m.position.set(pos[0]*MM,pos[1]*MM,pos[2]*MM); m.scale.setScalar(scale*MM); V3P.sc.add(m); }
  o.m[0].castShadow=true; o.m[0].receiveShadow=true; o.m[1].receiveShadow=true; o.m[1].renderOrder=2;
  V3P.objs[name]=o; return o;
}
/* 포장라인 앱의 자체 바닥판(높이 1 단위 이하 · 방 바닥과 겹쳐 그림자 얼룩)을 빼고 넘김 */
function v3LineFilter(P,N,C){ if(!P) return [null,null,null]; const nt=P.length/9; let keep=0; const ok=new Uint8Array(nt);
  for(let t=0;t<nt;t++){ const o=t*9; if(Math.max(P[o+1],P[o+4],P[o+7])>1){ ok[t]=1; keep++; } }
  if(keep===nt) return [P,N,C]; const P2=new Float32Array(keep*9), N2=new Float32Array(keep*9), C2=new Float32Array(keep*12); let j=0;
  for(let t=0;t<nt;t++) if(ok[t]){ P2.set(P.subarray(t*9,t*9+9),j*9); N2.set(N.subarray(t*9,t*9+9),j*9); C2.set(C.subarray(t*12,t*12+12),j*12); j++; }
  return [P2,N2,C2]; }
function v3SetLine(o,k,P,N,C){
  [P,N,C]=v3LineFilter(P,N,C);
  const p=o.part[k], n=P?P.length/3:0;
  if(n>p.cap){ p.cap=Math.max(n,p.cap*2,3*2048); p.P=new Float32Array(p.cap*3); p.N=new Float32Array(p.cap*3); p.C=new Float32Array(p.cap*4);
    for(const [nm,a,s] of [["position",p.P,3],["normal",p.N,3],["color",p.C,4]]){ const at=new T3.BufferAttribute(a,s); at.setUsage(T3.DynamicDrawUsage); p.g.setAttribute(nm,at); } }
  if(n){ p.P.set(P); p.N.set(N); p.C.set(C); for(const nm of ["position","normal","color"]){ const at=p.g.getAttribute(nm); at.updateRange.offset=0; at.updateRange.count=n*(nm==="color"?4:3); at.needsUpdate=true; } }
  p.g.setDrawRange(0,n);
}
/* ── 장면 ── */
function v3Init(){
  const cv=document.getElementById("cv");
  const R=new T3.WebGLRenderer({canvas:cv, antialias:false, preserveDrawingBuffer:false, powerPreference:"high-performance"});   /* 파우치와 같은 설정 (11/23 최적화) — 장면 다중 표본은 후처리 대상(samples 4)에서, 화면 버퍼는 전체 화면 사각형 1장만 그려 결과 같음 */
  R.outputEncoding=T3.sRGBEncoding; R.toneMapping=T3.ACESFilmicToneMapping; R.toneMappingExposure=.82;
  R.shadowMap.enabled=true; R.shadowMap.type=T3.PCFSoftShadowMap;
  const sc=new T3.Scene(); sc.background=new T3.Color(0xe7ebee);
  const L=ROOMBUS.L, cx=(L.dMinX+L.gMaxX)/2*MM, cz=(L.backZ+L.frontZ)/2*MM, W=(L.gMaxX-L.dMinX)*MM, D=(L.frontZ-L.backZ)*MM;
  /* 실내 환경 반사 : 흰 벽 · 천장 조명 (파우치와 같은 방식) */
  { const es=new T3.Scene(); es.add(new T3.Mesh(new T3.BoxGeometry(W,4.2,D),new T3.MeshBasicMaterial({color:0xaab0ac,side:T3.BackSide})));
    const fl=new T3.Mesh(new T3.PlaneGeometry(W,D),new T3.MeshBasicMaterial({color:0x8d918c})); fl.rotation.x=-Math.PI/2; fl.position.y=-2.09; es.add(fl);
    for(let x=-W/2+2;x<W/2;x+=3.2) for(const z of [-2,0,2]){ const l=new T3.Mesh(new T3.PlaneGeometry(1.3,.35),new T3.MeshBasicMaterial({color:0xffffff})); l.rotation.x=Math.PI/2; l.position.set(x,2.08,z); l.material.color.multiplyScalar(9); es.add(l); }
    const pm=new T3.PMREMGenerator(R); sc.environment=pm.fromScene(es,.03).texture; }
  /* 조명 · 배경 = 파우치 값 (idt_common/look.js · 11/20) */
  const key=idtLookLights(sc,{cx,cz,W,D,H:L.wallH*MM,x0:L.dMinX*MM,x1:L.gMaxX*MM});
  const cam=new T3.PerspectiveCamera(50,1,.05,90);
  Object.assign(V3P,{R,sc,cam,key,POST:idtLookPost()});
  /* 1인칭에서만 : 천장(조명 판) · 앞벽 — 3인칭 전체 보기는 원본처럼 천장 없는 단면 */
  { const G=new T3.Group(), H=L.wallH*MM, x0=L.dMinX*MM, x1=L.gMaxX*MM, z0=L.backZ*MM, z1=L.frontZ*MM;
    const cm=M.ceil.clone(); cm.side=T3.DoubleSide; V3P.ceilM=cm;   /* 천장 · 앞벽 = 공통 무광 패널 (kit.js M.ceil · M.wall · 11/24) */
    const c=new T3.Mesh(new T3.PlaneGeometry(x1-x0,z1-z0),cm); c.rotation.x=Math.PI/2; c.position.set((x0+x1)/2,H,(z0+z1)/2); G.add(c);
    const lm=new T3.MeshStandardMaterial({color:0xffffff,emissive:0xf4f7f4,emissiveIntensity:1.1,roughness:.8});
    for(let x=x0+1.2;x<x1-.6;x+=2.4) for(const z of [z0+1.6,(z0+z1)/2,z1-1.6]){ const l=new T3.Mesh(new T3.BoxGeometry(1.2,.03,.3),lm); l.position.set(x,H-.02,z); G.add(l); }
    const wm=M.wall;
    const f=new T3.Mesh(new T3.BoxGeometry(x1-x0,H,.12),wm); f.position.set((x0+x1)/2,H/2,z1+.06); f.receiveShadow=true; G.add(f);
    G.visible=false; sc.add(G); V3P.inner=G; }
  v3Inter("room",[0,0,0],1); v3Inter("dyn",[0,0,0],1);
  v3Inter("filler",[pfX(0),pfY(0),pfZ(0)],4*PF.s);   /* ×0.8 (11/24) */ v3Line("line",[8000,0,0],5);
  V3P.ready=true;
}
/* 실제 장면을 찍어 반사에 사용 (파우치와 같은 방식) — 형상을 처음 받은 뒤 한 번 */
function v3EnvCapture(){
  const pm=new T3.PMREMGenerator(V3P.R), sc=V3P.sc, c=[-1.2,1.7,1.2]; sc.position.set(-c[0],-c[1],-c[2]); sc.updateMatrixWorld(true);
  const keep=V3P.inner&&V3P.inner.visible; if(V3P.inner) V3P.inner.visible=true;
  const ENV=[{m:M.wall,c:0xdfe4df,e:0},{m:V3P.ceilM,c:0xe9ece9,e:0}], we=IDT_WALLE.clone(); idtEnvTone(ENV,true); IDT_WALLE.setRGB(0,0,0);   /* 금속 반사 = 11/23 톤 유지 (11/24) */
  const rt=pm.fromScene(sc,.02,.05,40); idtEnvTone(ENV,false); IDT_WALLE.copy(we); sc.position.set(0,0,0); sc.updateMatrixWorld(true); if(V3P.inner) V3P.inner.visible=keep;
  sc.environment=rt.texture;
}
const appWin=k=>UNI_HUB.win(k);
/* 형상 받기 : 방(정적 · 판 바뀔 때만) · 팩 · 두 설비 (설비는 번갈아 · 초당 약 30 회) */
function v3Gen(force){
  const fw=appWin("filler"), lw=appWin("line"); if(!fw||!lw||!fw.UNI_GEN||!lw.UNI_GEN) return;
  const t0=performance.now(), c=v3GenCam();
  try{ const R=fw.UNI_ROOM(); if(V3P.roomVer!==R.ver){ V3P.roomVer=R.ver; v3SetInter(V3P.objs.room,R.data,R.nOpq,R.nTot); } }catch(e){ console.error("방 형상",e); }
  try{ const d=fw.UNI_DYN(); v3SetInter(V3P.objs.dyn,d.data,d.nOpq,d.data.length/STRIDE); }catch(e){ console.error("팩 형상",e); }
  V3P.t.gen++;
  if(force||V3P.t.gen%2===0){ try{ const f=fw.UNI_GEN(c); v3SetInter(V3P.objs.filler,f.data,f.nOpq,f.nTot); }catch(e){ console.error("충전기 형상",e); } }
  if(force||V3P.t.gen%2===1){ try{ const l=lw.UNI_GEN(c); v3SetLine(V3P.objs.line,0,l.P,l.N,l.C); v3SetLine(V3P.objs.line,1,l.TP,l.TN,l.TC); }catch(e){ console.error("포장라인 형상",e); } }
  V3P.t.genMs=V3P.t.genMs*.9+(performance.now()-t0)*.1;
}
/* 앱에 넘길 궤도 카메라(mm) : 1인칭이면 눈 앞 0.6 m 를 목표로 (가까운 상세 형상) */
function v3GenCam(){
  if(V3P.view==="orbit") return Object.assign({},V3P.orbit);
  const w=WALK, d=600, f=walkFwd(); return {yaw:w.yaw, pitch:-w.pitch, dist:d, tx:w.x+f[0]*d, ty:w.y+f[1]*d, tz:w.z+f[2]*d};
}
function v3Eye(c){ const cp=Math.cos(c.pitch), sp=Math.sin(c.pitch); return [c.tx+c.dist*cp*Math.sin(c.yaw), c.ty+c.dist*sp, c.tz+c.dist*cp*Math.cos(c.yaw)]; }
function v3Frame(now){
  const R=V3P.R, cv=R.domElement, w=cv.clientWidth, h=cv.clientHeight, pr=tbPR();
  if(cv.width!==Math.round(w*pr)||cv.height!==Math.round(h*pr)){ R.setPixelRatio(pr); R.setSize(w,h,false); V3P.cam.aspect=w/Math.max(1,h); V3P.cam.updateProjectionMatrix(); }
  const cam=V3P.cam; if(V3P.inner) V3P.inner.visible=V3P.view!=="orbit";
  if(V3P.view==="orbit"){ const o=V3P.orbit, e=v3Eye(o); cam.position.set(e[0]*MM,e[1]*MM,e[2]*MM); cam.lookAt(o.tx*MM,o.ty*MM,o.tz*MM); cam.fov=50; }
  else { cam.position.set(WALK.x*MM,WALK.y*MM,WALK.z*MM); const f=walkFwd(); cam.lookAt((WALK.x+f[0]*1000)*MM,(WALK.y+f[1]*1000)*MM,(WALK.z+f[2]*1000)*MM); cam.fov=FPC.FOV; }
  cam.updateProjectionMatrix();
  if(now-(V3P.t.lg||0)>33){ V3P.t.lg=now; v3Gen(); }
  idtLookDraw(R,V3P.POST,V3P.sc,cam,TBQ.L[TBQ.lv].ao);   /* 파우치 후처리 (틈 음영 · ACES · 대비) */
  V3P.t.n++; if(now-V3P.t.t0>1000){ V3P.t.fps=V3P.t.n*1000/(now-V3P.t.t0); V3P.t.n=0; V3P.t.t0=now; }
}
/* 3인칭 궤도 조작 : 왼쪽 끌기 회전 · 오른쪽(Shift) 끌기 이동 · 휠 확대 */
function v3Orbit(){
  const cv=document.getElementById("cv"); let drag=null;
  cv.addEventListener("mousedown",e=>{ if(V3P.view!=="orbit") return; drag={x:e.clientX,y:e.clientY,b:e.button===2||e.shiftKey}; e.preventDefault(); });
  addEventListener("mousemove",e=>{ if(!drag||V3P.view!=="orbit") return; const dx=e.clientX-drag.x, dy=e.clientY-drag.y; drag.x=e.clientX; drag.y=e.clientY; const o=V3P.orbit;
    if(drag.b){ const s=o.dist*.0012; o.tx-=(Math.cos(o.yaw)*dx)*s; o.tz+=(Math.sin(o.yaw)*dx)*s; o.ty+=dy*s; }
    else { o.yaw-=dx*.005; o.pitch=Math.max(.02,Math.min(1.45,o.pitch+dy*.004)); } });
  addEventListener("mouseup",()=>drag=null);
  cv.addEventListener("contextmenu",e=>e.preventDefault());
  cv.addEventListener("wheel",e=>{ if(V3P.view!=="orbit") return; const o=V3P.orbit; o.dist=Math.max(1200,Math.min(30000,o.dist*Math.exp(e.deltaY*.001))); e.preventDefault(); },{passive:false});
}
