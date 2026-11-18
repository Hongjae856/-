/* ═══════════════════════════════════════════════════════════════════
   3D 보기 (파우치 엔진 = Three.js) — 병 충전 앱의 형상 버퍼를 받아 그린다 (B1 · 11/18)
   · 앱 좌표 mm (x = 라인 진행 · y = 높이 · z = 작업자 쪽 + · 컨베이어 중심 z = 0) → Three.js 는 m (× 0.001)
   · 앱 형상 : GEO.stat(판 바뀔 때만) · GEO.dyn(매 프레임), 각 op(불투명) · tr(반투명) Sink { p:위치 · n:법선 · c:색 rgba · m:금속도 (−1 = 발광) }
   · 원본 렌더러처럼 면 방향은 시점 쪽으로 뒤집어 조명 (감김 방향이 일정하지 않음)
   · 방 : 충전실(x < WALLX) · 포장실(x > WALLX, B2 에서 설비 추가) · 칸막이 벽 통과구
   ═══════════════════════════════════════════════════════════════════ */
const MM=.001;
const ROOM={x0:-6900, wallX:8900, x1:22000, z0:-2700, z1:5200, h:3600, hole:{z0:-260, z1:260, y0:700, y1:1250}};
const V3B={R:null, sc:null, cam:null, objs:{}, ready:false, view:"orbit", statKey:null, n:-1,
  orbit:{yaw:-0.45,pitch:0.38,dist:9500,tx:1400,ty:700,tz:200}, t:{fps:0,n:0,t0:0}};
/* ── 재질 : 정점색(sRGB → 선형) · 정점 금속도 · 발광(m < −0.5) ── */
function v3bMat(transparent){
  const m=new T3.MeshStandardMaterial({vertexColors:true, roughness:.55, metalness:0, envMapIntensity:1.35, transparent:!!transparent, depthWrite:!transparent, side:T3.DoubleSide});
  m.onBeforeCompile=sh=>{
    sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nattribute float aM; varying float vMet; varying vec3 vWP;")
      .replace("#include <color_vertex>","#include <color_vertex>\nvMet=aM; if(aM>-0.5) vColor.rgb=pow(max(vColor.rgb,vec3(0.0)),vec3(2.2));")
      .replace("#include <worldpos_vertex>","#include <worldpos_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;");
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nvarying float vMet; varying vec3 vWP;\nfloat hHash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }")
      .replace("#include <roughnessmap_fragment>","float metalnessFactor=vMet<-0.5?0.0:clamp((vMet-0.45)*1.8,0.0,1.0);\nfloat roughnessFactor=mix(0.62,0.22+0.1*hHash(floor(vec2(vWP.y*900.0,vWP.x*7.0))),metalnessFactor);")
      .replace("#include <metalnessmap_fragment>","")
      .replace("#include <normal_fragment_maps>","#include <normal_fragment_maps>\nif(dot(normal,vViewPosition)<0.0) normal=-normal;")
      .replace("#include <dithering_fragment>","#include <dithering_fragment>\nif(vMet<-0.5) gl_FragColor=vec4(vColor.rgb,diffuseColor.a);");
  };
  m.customProgramCacheKey=()=>"bottle-"+(transparent?"t":"o");
  return m;
}
/* 형상 그릇 : Sink → BufferGeometry (용량을 넉넉히 잡아 다시 만들지 않음) */
function v3bPart(name,transparent){
  const o={g:new T3.BufferGeometry(), cap:0}; o.mesh=new T3.Mesh(o.g,v3bMat(transparent)); o.mesh.frustumCulled=false; o.mesh.scale.setScalar(MM);
  if(transparent){ o.mesh.renderOrder=2; o.mesh.receiveShadow=true; } else { o.mesh.castShadow=true; o.mesh.receiveShadow=true; }
  V3B.sc.add(o.mesh); V3B.objs[name]=o; return o;
}
function v3bSet(o,s){
  const n=s.v;
  if(n>o.cap){ o.cap=Math.max(n,o.cap*2,3*4096); o.P=new Float32Array(o.cap*3); o.N=new Float32Array(o.cap*3); o.C=new Float32Array(o.cap*4); o.M=new Float32Array(o.cap);
    for(const [nm,a,k] of [["position",o.P,3],["normal",o.N,3],["color",o.C,4],["aM",o.M,1]]){ const at=new T3.BufferAttribute(a,k); at.setUsage(T3.DynamicDrawUsage); o.g.setAttribute(nm,at); } }
  if(n){ o.P.set(s.p.subarray(0,n*3)); o.N.set(s.n.subarray(0,n*3)); o.C.set(s.c.subarray(0,n*4)); o.M.set(s.m.subarray(0,n));
    for(const [nm,k] of [["position",3],["normal",3],["color",4],["aM",1]]){ const at=o.g.getAttribute(nm); at.updateRange.offset=0; at.updateRange.count=n*k; at.needsUpdate=true; } }
  o.g.setDrawRange(0,n);
}
/* ── 방 : 바닥 · 벽 · 칸막이(통과구) · 천장(1인칭만) ── */
function v3bRoom(sc){
  const G=new T3.Group(), R=ROOM, x0=R.x0*MM, x1=R.x1*MM, z0=R.z0*MM, z1=R.z1*MM, H=R.h*MM, wx=R.wallX*MM;
  const fm=new T3.MeshStandardMaterial({color:0xcfd8d2,roughness:.38,metalness:0,envMapIntensity:.6});
  const fl=new T3.Mesh(new T3.PlaneGeometry(x1-x0,z1-z0),fm); fl.rotation.x=-Math.PI/2; fl.position.set((x0+x1)/2,0,(z0+z1)/2); fl.receiveShadow=true; G.add(fl);
  const wm=new T3.MeshStandardMaterial({color:0xe9ece8,roughness:.8,envMapIntensity:.3});
  const wall=(w,h,d,x,y,z)=>{ const m=new T3.Mesh(new T3.BoxGeometry(w,h,d),wm); m.position.set(x,y,z); m.receiveShadow=true; m.castShadow=true; G.add(m); return m; };
  wall(x1-x0,H,.12,(x0+x1)/2,H/2,z0-.06);                          /* 뒷벽 */
  wall(.12,H,z1-z0,x0-.06,H/2,(z0+z1)/2); wall(.12,H,z1-z0,x1+.06,H/2,(z0+z1)/2);   /* 양 끝 벽 */
  /* 칸막이 벽 (통과구 : 컨베이어 높이) */
  { const h=R.hole, a=h.z0*MM, b=h.z1*MM, ya=h.y0*MM, yb=h.y1*MM, t=.15;
    wall(t,H,a-z0,wx,H/2,(z0+a)/2); wall(t,H,z1-b,wx,H/2,(b+z1)/2); wall(t,ya,b-a,wx,ya/2,(a+b)/2); wall(t,H-yb,b-a,wx,(yb+H)/2,(a+b)/2); }
  /* 걸레받이 · 바닥 안전선 */
  const bm=new T3.MeshStandardMaterial({color:0xb9c3cc,roughness:.6}); const bb=new T3.Mesh(new T3.BoxGeometry(x1-x0,.12,.04),bm); bb.position.set((x0+x1)/2,.06,z0+.02); G.add(bb);
  const ym=new T3.MeshStandardMaterial({color:0xe6c23a,roughness:.6}); for(const z of [700,1850]){ const y=new T3.Mesh(new T3.PlaneGeometry(x1-x0,.05),ym); y.rotation.x=-Math.PI/2; y.position.set((x0+x1)/2,.002,z*MM); G.add(y); }
  sc.add(G);
  /* 1인칭에서만 : 천장 · 조명 판 · 앞벽 */
  const I=new T3.Group(); const cm=new T3.MeshStandardMaterial({color:0xeef0ee,roughness:.9,envMapIntensity:.2,side:T3.DoubleSide});
  const c=new T3.Mesh(new T3.PlaneGeometry(x1-x0,z1-z0),cm); c.rotation.x=Math.PI/2; c.position.set((x0+x1)/2,H,(z0+z1)/2); I.add(c);
  const lm=new T3.MeshStandardMaterial({color:0xffffff,emissive:0xf4f7f4,emissiveIntensity:1.1,roughness:.8});
  for(let x=x0+1.2;x<x1-.6;x+=2.4) for(const z of [z0+1.4,(z0+z1)/2,z1-1.4]){ const l=new T3.Mesh(new T3.BoxGeometry(1.2,.03,.3),lm); l.position.set(x,H-.02,z); I.add(l); }
  const f=new T3.Mesh(new T3.BoxGeometry(x1-x0,H,.12),wm); f.position.set((x0+x1)/2,H/2,z1+.06); I.add(f);
  I.visible=false; sc.add(I); V3B.inner=I;
}
function v3bInit(){
  const cv=document.getElementById("cv");
  const R=new T3.WebGLRenderer({canvas:cv, antialias:true, preserveDrawingBuffer:true});
  R.outputEncoding=T3.sRGBEncoding; R.toneMapping=T3.ACESFilmicToneMapping; R.toneMappingExposure=.76;
  R.shadowMap.enabled=true; R.shadowMap.type=T3.PCFSoftShadowMap;
  const sc=new T3.Scene(); sc.background=new T3.Color(0xe7ebee);
  const W=(ROOM.x1-ROOM.x0)*MM, D=(ROOM.z1-ROOM.z0)*MM, cx=(ROOM.x0+ROOM.x1)/2*MM, cz=(ROOM.z0+ROOM.z1)/2*MM;
  { const es=new T3.Scene(); es.add(new T3.Mesh(new T3.BoxGeometry(W,4.2,D),new T3.MeshBasicMaterial({color:0xaab0ac,side:T3.BackSide})));
    for(let x=-W/2+2;x<W/2;x+=3.2) for(const z of [-2,0,2]){ const l=new T3.Mesh(new T3.PlaneGeometry(1.3,.35),new T3.MeshBasicMaterial({color:0xffffff})); l.rotation.x=Math.PI/2; l.position.set(x,2.08,z); l.material.color.multiplyScalar(9); es.add(l); }
    const pm=new T3.PMREMGenerator(R); sc.environment=pm.fromScene(es,.03).texture; }
  sc.add(new T3.HemisphereLight(0xffffff,0x9aa09c,.55));
  const key=new T3.DirectionalLight(0xffffff,1.1); key.position.set(cx-5,10,cz+6); key.target.position.set(cx,0,cz); key.castShadow=true; key.shadow.mapSize.set(4096,4096);
  Object.assign(key.shadow.camera,{left:-W/2-1,right:W/2+1,top:D/2+3,bottom:-D/2-3,near:1,far:40}); key.shadow.bias=-.0004; key.shadow.normalBias=.015; sc.add(key); sc.add(key.target);
  const fillL=new T3.DirectionalLight(0xffffff,.35); fillL.position.set(cx+5,4,cz+8); sc.add(fillL);
  const cam=new T3.PerspectiveCamera(50,1,.05,120);
  Object.assign(V3B,{R,sc,cam,key});
  v3bRoom(sc);
  for(const s of ["stat","dyn"]){ v3bPart(s+"Op",false); v3bPart(s+"Tr",true); }
  V3B.ready=true;
}
/* 실제 장면을 찍어 반사에 사용 (파우치 · PTP 와 같은 방식) — 정적 형상을 처음 받은 뒤 한 번 · 포장실 쪽도 한 번 */
function v3bEnvCapture(){
  const pm=new T3.PMREMGenerator(V3B.R), sc=V3B.sc, c=[(ROOM.x0+ROOM.x1)/2*MM,1.7,1.2]; sc.position.set(-c[0],-c[1],-c[2]); sc.updateMatrixWorld(true);
  const keep=V3B.inner.visible; V3B.inner.visible=true; const rt=pm.fromScene(sc,.02,.05,60); sc.position.set(0,0,0); sc.updateMatrixWorld(true); V3B.inner.visible=keep;
  sc.environment=rt.texture;
}
/* 앱 형상 받기 : 정적은 판이 바뀔 때만 · 동적은 앱이 새로 만들었을 때만 */
function v3bGen(){
  const w=appWin(); if(!w||!w.B3) return false; const G=w.B3.GEO;
  const k=w.B3.staticKey(); if(k&&k!==V3B.statKey&&G.stat.op.v){ V3B.statKey=k; v3bSet(V3B.objs.statOp,G.stat.op); v3bSet(V3B.objs.statTr,G.stat.tr); V3B.statNew=true; }
  if(w.B3_N!==V3B.n){ V3B.n=w.B3_N; v3bSet(V3B.objs.dynOp,G.dyn.op); v3bSet(V3B.objs.dynTr,G.dyn.tr); }
  return !!V3B.statKey;
}
const v3bEye=c=>{ const cp=Math.cos(c.pitch), sp=Math.sin(c.pitch); return [c.tx+c.dist*cp*Math.sin(c.yaw), c.ty+c.dist*sp, c.tz+c.dist*cp*Math.cos(c.yaw)]; };
function v3bFrame(now){
  const R=V3B.R, cv=R.domElement, w=cv.clientWidth, h=cv.clientHeight, pr=Math.min(1.5,devicePixelRatio||1);
  if(w<10||h<10) return;
  if(cv.width!==Math.round(w*pr)||cv.height!==Math.round(h*pr)){ R.setPixelRatio(pr); R.setSize(w,h,false); V3B.cam.aspect=w/Math.max(1,h); V3B.cam.updateProjectionMatrix(); }
  const cam=V3B.cam; V3B.inner.visible=V3B.view!=="orbit";
  if(V3B.view==="orbit"){ const o=V3B.orbit, e=v3bEye(o); cam.position.set(e[0]*MM,e[1]*MM,e[2]*MM); cam.lookAt(o.tx*MM,o.ty*MM,o.tz*MM); cam.fov=50; }
  else { cam.position.set(WALK.x*MM,WALK.y*MM,WALK.z*MM); const f=walkFwd(); cam.lookAt((WALK.x+f[0]*1000)*MM,(WALK.y+f[1]*1000)*MM,(WALK.z+f[2]*1000)*MM); cam.fov=62; }
  cam.updateProjectionMatrix();
  v3bGen();
  R.render(V3B.sc,cam);
  V3B.t.n++; if(now-V3B.t.t0>1000){ V3B.t.fps=V3B.t.n*1000/(now-V3B.t.t0); V3B.t.n=0; V3B.t.t0=now; }
}
function v3bOrbit(){
  const cv=document.getElementById("cv"); let drag=null;
  cv.addEventListener("mousedown",e=>{ if(V3B.view!=="orbit") return; drag={x:e.clientX,y:e.clientY,b:e.button===2||e.shiftKey}; e.preventDefault(); });
  addEventListener("mousemove",e=>{ if(!drag||V3B.view!=="orbit") return; const dx=e.clientX-drag.x, dy=e.clientY-drag.y; drag.x=e.clientX; drag.y=e.clientY; const o=V3B.orbit;
    if(drag.b){ const s=o.dist*.0012; o.tx-=(Math.cos(o.yaw)*dx)*s; o.tz+=(Math.sin(o.yaw)*dx)*s; o.ty+=dy*s; }
    else { o.yaw-=dx*.005; o.pitch=Math.max(.02,Math.min(1.45,o.pitch+dy*.004)); } });
  addEventListener("mouseup",()=>drag=null);
  cv.addEventListener("contextmenu",e=>e.preventDefault());
  cv.addEventListener("wheel",e=>{ if(V3B.view!=="orbit") return; const o=V3B.orbit; o.dist=Math.max(1200,Math.min(32000,o.dist*Math.exp(e.deltaY*.001))); e.preventDefault(); },{passive:false});
}
