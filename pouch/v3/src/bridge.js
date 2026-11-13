/* ═══════════════════════════════════════════════════════════════════
   새 3D 연결 (옛 engine · gfx · models 대체) — 단위 m
   · 교육 화면은 그대로 두고 #cv3d(2D 캔버스)에 Three.js 화면을 복사한 뒤 라벨 · 표식 · 1인칭 HUD 를 그린다
   · cam : 궤도 카메라(yaw · pitch · dist · 목표점) · cam.fp : 1인칭 자세 (fps.js)
   · 바깥에서 볼 때 가까운 벽 · 천장을 숨겨 실내가 보이게 한다 (돌하우스 보기)
   · 그래픽 : 자동 · 상 · 중 · 하 (해상도 · 그림자 · 틈 음영)
   ═══════════════════════════════════════════════════════════════════ */
const VIEW3={guard:true,label:true};
let STATIC_KEY="";
function staticKey(){ return [VIEW3.guard?1:0, S?S.f.door:"c", S?S.room:"F"].join("|"); }
function buildStatic(){ STATIC_KEY=staticKey(); if(V3) v3Static(); }
const cam={yaw:0,pitch:.3,dist:20,tx:4.6,ty:.4,tz:-2.6, yawT:0,pitchT:.3,distT:20,txT:4.6,tyT:.4,tzT:-2.6, view:"all", fp:null};
Object.assign(cam,{yaw:CAMVIEW.all.yaw,pitch:CAMVIEW.all.pitch,dist:CAMVIEW.all.dist,yawT:CAMVIEW.all.yaw,pitchT:CAMVIEW.all.pitch,distT:CAMVIEW.all.dist});
const R3={ready:false,gl:null,cv:null,ctx:null,W:2,H:2,eye:[0,0,0],shadowOn:true,vp:null};
let V3=null;

/* ── 그래픽 단계 ── */
const GQ={mode:"auto", lv:"high", q:1, acc:0, slow:0, fast:0, ema:1/60,
  L:{high:{q:1,sh:true,ao:true,sm:2048}, mid:{q:.78,sh:true,ao:true,sm:1024}, low:{q:.58,sh:false,ao:false,sm:512}},
  label(){ const n={high:"상",mid:"중",low:"하"}[this.lv]; return this.mode==="auto"?"자동("+n+")":n; }};
function gqApply(lv){
  GQ.lv=lv; const L=GQ.L[lv]; GQ.q=L.q; if(!V3) return;
  const sh=L.sh&&R3.shadowOn; V3.renderer.shadowMap.enabled=sh;
  V3.scene.traverse(o=>{ if(o.isDirectionalLight&&o.shadow){ o.castShadow=sh; if(o.shadow.mapSize.x!==L.sm){ o.shadow.mapSize.set(L.sm,L.sm); if(o.shadow.map){ o.shadow.map.dispose(); o.shadow.map=null; } } } if(o.material) [].concat(o.material).forEach(m=>m.needsUpdate=true); });
  V3.POST.mat.uniforms.ao.value=L.ao?1:0;
}
function gqSet(mode){ GQ.mode=mode; GQ.slow=GQ.fast=0; gqApply(mode==="auto"?GQ.lv:mode); const b=$("#gqBtn"); if(b) b.textContent="그래픽 "+GQ.label(); }
/* 자동 : 3 초 넘게 느리면 한 단계 내리고, 8 초 넘게 넉넉하면 한 단계 올린다 */
function gfxAdapt(now){
  const dt=RDT||1/60; GQ.ema+=(dt-GQ.ema)*.05;
  if(GQ.mode!=="auto"||!V3) return;
  if(GQ.ema>1/28){ GQ.slow+=dt; GQ.fast=0; } else if(GQ.ema<1/52){ GQ.fast+=dt; GQ.slow=0; } else { GQ.slow=Math.max(0,GQ.slow-dt); GQ.fast=Math.max(0,GQ.fast-dt); }
  const order=["low","mid","high"], i=order.indexOf(GQ.lv);
  if(GQ.slow>3&&i>0){ gqApply(order[i-1]); GQ.slow=0; GQ.ema=1/45; gqSet("auto"); }
  else if(GQ.fast>8&&i<2){ gqApply(order[i+1]); GQ.fast=0; gqSet("auto"); }
}

/* ── 초기화 : 렌더러 · 환경 반사 · 장면 · 후처리 ── */
function r3Init(){
  if(R3.ready) return !!R3.gl;
  R3.ready=true; R3.cv=$("#cv3d"); R3.ctx=R3.cv.getContext("2d");
  try{ v3Build(); }catch(e){ console.error("3D 준비 실패",e); $("#view3d").insertAdjacentHTML("beforeend",'<div class="offScr" style="position:absolute;inset:0;background:#eef4fa"><b>3D 화면을 표시할 수 없습니다</b>WebGL 을 지원하는 브라우저(크롬 · 엣지)에서 열어 주세요.</div>'); return false; }
  R3.gl=true; gqApply(GQ.lv); return true;
}
function v3Build(){
  const renderer=new T3.WebGLRenderer({antialias:false,alpha:false,powerPreference:"high-performance"});
  renderer.outputEncoding=T3.sRGBEncoding; renderer.toneMapping=T3.ACESFilmicToneMapping; renderer.toneMappingExposure=.74;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=T3.PCFSoftShadowMap; renderer.setPixelRatio(1);
  renderer.domElement.addEventListener("webglcontextlost",e=>{ e.preventDefault(); R3.gl=null; });
  const scene=new T3.Scene(); scene.background=new T3.Color(0xdfe4e1);
  buildFillRoom(scene); buildFiller(scene); buildConveyor(scene); buildFillZone(scene); buildPackRoom(scene); initAnim(scene); initManual(scene); initPackAnim(scene);
  scene.traverse(o=>{ if(!o.material) return; for(const m of [].concat(o.material)) for(const k of ["map","emissiveMap"]) if(m[k]&&m[k].encoding!==T3.sRGBEncoding){ m[k].encoding=T3.sRGBEncoding; m[k].needsUpdate=true; } });
  /* 장면 자체를 찍어 스테인리스 반사에 사용 */
  { const pm=new T3.PMREMGenerator(renderer), c=[4.6,1.7,5.4]; scene.position.set(-c[0],-c[1],-c[2]); scene.updateMatrixWorld(true); M.led.emissiveIntensity=28; const rt=pm.fromScene(scene,.015,.05,40); M.led.emissiveIntensity=1.6; scene.position.set(0,0,0); scene.updateMatrixWorld(true); scene.environment=rt.texture; pm.dispose(); }
  const camera=new T3.PerspectiveCamera(35.5,1,.05,80);
  V3={renderer,scene,camera,POST:v3Post(),cut:v3CutSets(scene),tAnim:0,k:0};
}
/* 후처리 : 틈 · 모서리 음영(SSAO, 반해상도) → ACES 톤매핑 + 대비 + sRGB (pouch/v2 main.js 와 동일) */
function v3Post(){
  const P={rt:null, ao:null, w:0, h:0, cam:new T3.OrthographicCamera(-1,1,1,-1,0,1), scn:new T3.Scene(), scnA:new T3.Scene()};
  const VS="varying vec2 v; void main(){ v=uv; gl_Position=vec4(position.xy,0.,1.); }", LIN="float lin(float d){ float z=d*2.-1.; return 2.*nf.x*nf.y/(nf.y+nf.x-z*(nf.y-nf.x)); }";
  P.matA=new T3.ShaderMaterial({uniforms:{tD:{value:null},res:{value:new T3.Vector2()},nf:{value:new T3.Vector2(.05,80)}},vertexShader:VS,
   fragmentShader:`precision highp float; varying vec2 v; uniform sampler2D tD; uniform vec2 res,nf; ${LIN}
   void main(){ float d=lin(texture2D(tD,v).x), occ=0.; vec2 q=mod(floor(gl_FragCoord.xy),4.); float a0=(q.x+q.y*4.)*.3927+.2, rad=clamp(.17/d,.004,.07);
     for(int i=0;i<12;i++){ float fi=float(i), r=rad*sqrt((fi+.5)/12.), an=a0+fi*2.39996; vec2 o=vec2(cos(an),sin(an))*r*vec2(res.y/res.x,1.);
       float df=d-lin(texture2D(tD,v+o).x); occ+=smoothstep(.005,.045,df)*(1.-smoothstep(.12,.42,df)); }
     gl_FragColor=vec4(vec3(1.-occ/12.),1.); }`,depthTest:false,depthWrite:false});
  P.mat=new T3.ShaderMaterial({uniforms:{tC:{value:null},tA:{value:null},resA:{value:new T3.Vector2()},expo:{value:.62},ao:{value:1},con:{value:.42}},vertexShader:VS,
   fragmentShader:`precision highp float; varying vec2 v; uniform sampler2D tC,tA; uniform vec2 resA; uniform float expo,ao,con;
   vec3 aces(vec3 x){ x*=expo/0.6; mat3 a=mat3(.59719,.076,.0284,.35458,.90834,.13383,.04823,.01566,.83777), b=mat3(1.60475,-.10208,-.00327,-.53108,1.10813,-.07276,-.07367,-.00605,1.07602);
     x=a*x; x=(x*(x+.0245786)-.000090537)/(x*(.983729*x+.432951)+.238081); return clamp(b*x,0.,1.); }
   void main(){ vec3 c=texture2D(tC,v).rgb; float k=1.;
     if(ao>.5){ vec2 t=1./resA; k=(texture2D(tA,v+t*vec2(-1.,-1.)).r+texture2D(tA,v+t*vec2(1.,-1.)).r+texture2D(tA,v+t*vec2(-1.,1.)).r+texture2D(tA,v+t*vec2(1.,1.)).r)*.25; k=1.-.85*(1.-k); }
     c=aces(c*k); c=pow(c,vec3(1./2.2)); c=mix(c,c*c*(3.-2.*c),con); gl_FragColor=vec4(c,1.); }`,depthTest:false,depthWrite:false});
  P.scn.add(new T3.Mesh(new T3.PlaneGeometry(2,2),P.mat)); P.scnA.add(new T3.Mesh(new T3.PlaneGeometry(2,2),P.matA));
  return P;
}
function v3PostSize(w,h){
  const P=V3.POST; if(P.w===w&&P.h===h&&P.rt) return; P.w=w; P.h=h;
  if(P.rt){ P.rt.dispose(); P.ao.dispose(); }
  P.rt=new T3.WebGLRenderTarget(w,h,{type:T3.HalfFloatType,samples:4}); P.rt.depthTexture=new T3.DepthTexture(w,h); P.rt.depthTexture.type=T3.UnsignedIntType;
  const ax=Math.ceil(w/2), ay=Math.ceil(h/2); P.ao=new T3.WebGLRenderTarget(ax,ay,{minFilter:T3.LinearFilter,magFilter:T3.LinearFilter,depthBuffer:false});
  P.matA.uniforms.res.value.set(ax,ay); P.mat.uniforms.resA.value.set(ax,ay);
}

/* ── 돌하우스 보기 : 벽면(바깥 평면에 붙은 얇은 부재) · 천장 부재 묶음 ── */
function v3CutSets(scene){
  const walls=[ /* 축 · 위치 · 실 안쪽 방향 · 범위 */
    {ax:"x",v:0,in:1,r:[0,7]},{ax:"x",v:11.8,in:-1,r:[0,7]},{ax:"z",v:7,in:-1,r:[0,11.8]},{ax:"z",v:0,in:1,r:[8.05,11.8]},
    {ax:"x",v:0,in:1,r:[-12,0],pack:1},{ax:"x",v:8,in:-1,r:[-12,0],pack:1},{ax:"z",v:-12,in:1,r:[0,8],pack:1}];
  for(const w of walls) w.list=[];
  const ceil={F:[],P:[]}, bb=new T3.Box3();
  scene.updateMatrixWorld(true);
  scene.traverse(o=>{ if(!o.isMesh&&!o.isInstancedMesh) return; if(o.isInstancedMesh) return;
    bb.setFromObject(o); if(!isFinite(bb.min.x)) return;
    const pack=bb.max.z<=.05;
    if(bb.min.y>=(pack?RM.pack.h:RM.fill.h)-.3&&bb.max.y<=(pack?RM.pack.h:RM.fill.h)+.05){ ceil[pack?"P":"F"].push(o); return; }
    for(const w of walls){ if(!!w.pack!==pack) continue;
      const lo=w.ax==="x"?bb.min.x:bb.min.z, hi=w.ax==="x"?bb.max.x:bb.max.z, o0=w.ax==="x"?bb.min.z:bb.min.x, o1=w.ax==="x"?bb.max.z:bb.max.x;
      if(hi-lo<.35&&Math.abs((lo+hi)/2-w.v)<.2&&o0>=w.r[0]-.1&&o1<=w.r[1]+.1){ w.list.push(o); break; } } });
  return {walls,ceil,state:""};
}
function v3Cut(){
  const C=V3.cut, e=R3.eye, inF=e[0]>0&&e[0]<11.8&&e[2]>0&&e[2]<7&&e[1]<RM.fill.h, inP=e[0]>0&&e[0]<8&&e[2]>-12&&e[2]<0&&e[1]<RM.pack.h;
  let key=""; const hide=[];
  for(const w of C.walls){ const c=w.ax==="x"?e[0]:e[2], out=(c-w.v)*w.in<0, mine=w.pack?inP:inF; const h=out&&!mine; hide.push(h); key+=h?1:0; }
  const hc={F:e[1]>RM.fill.h-.02&&!inF, P:e[1]>RM.pack.h-.02&&!inP}; key+=(hc.F?1:0)+""+(hc.P?1:0);
  if(key===C.state) return; C.state=key;
  C.walls.forEach((w,i)=>{ for(const o of w.list) o.visible=!hide[i]; });
  for(const k of ["F","P"]) for(const o of C.ceil[k]) o.visible=!hc[k];
}

/* ── 상태 → 3D (문 · 롤 등) : buildStatic 시 · 매 프레임 일부 ── */
function v3Static(){}
function v3Sync(dt){
  const run=!!(S&&S.session&&S.f&&S.f.run);
  V3.k+=((run?1:0)-V3.k)*Math.min(1,dt*3);             /* 기동 · 정지 시 부드럽게 가 · 감속 */
  if(V3.k>.002) stepAnim(dt*V3.k);
  if(typeof wkDraw==="function") wkDraw(dt);
}

/* ── 카메라 ── */
const _vp=new T3.Matrix4();
function camPrep(w,h){
  if(!V3) return; const c=V3.camera;
  c.aspect=w/Math.max(1,h);
  if(cam.fp){ const p=cam.fp, cp=Math.cos(p.pitch);
    c.fov=2*Math.atan(.5/(p.focal||.78))*180/Math.PI; c.position.set(p.x,p.y,p.z);
    c.lookAt(p.x-Math.sin(p.yaw)*cp, p.y-Math.sin(p.pitch), p.z-Math.cos(p.yaw)*cp); }
  else { const cp=Math.cos(cam.pitch), sp=Math.sin(cam.pitch);
    c.fov=35.5; c.position.set(cam.tx+cam.dist*cp*Math.sin(cam.yaw), cam.ty+cam.dist*sp, cam.tz+cam.dist*cp*Math.cos(cam.yaw));
    c.lookAt(cam.tx,cam.ty,cam.tz); }
  c.near=cam.fp?.05:Math.max(.05,Math.min(.3,cam.dist*.02)); c.updateProjectionMatrix(); c.updateMatrixWorld(true);
  R3.eye=[c.position.x,c.position.y,c.position.z];
  _vp.multiplyMatrices(c.projectionMatrix,c.matrixWorldInverse); R3.vp=_vp.elements;
}
/* CPU 투영 (라벨 · 표식 · 1인칭 모니터) — 반환 좌표는 캔버스 픽셀, w = 시점 깊이(m) */
function prj(x,y,z){
  const m=R3.vp; if(!m) return null;
  const cx=m[0]*x+m[4]*y+m[8]*z+m[12], cy=m[1]*x+m[5]*y+m[9]*z+m[13], cw=m[3]*x+m[7]*y+m[11]*z+m[15];
  if(cw<=1e-4) return null;
  return {x:(cx/cw*.5+.5)*R3.W, y:(1-(cy/cw*.5+.5))*R3.H, w:cw};
}
function camStep(dt){
  if(cam.fp) return;
  const k=Math.min(1,dt*5.5);
  let dy=cam.yawT-cam.yaw; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); cam.yaw+=dy*k;
  cam.pitch+=(cam.pitchT-cam.pitch)*k; cam.dist+=(cam.distT-cam.dist)*k;
  cam.tx+=(cam.txT-cam.tx)*k; cam.ty+=(cam.tyT-cam.ty)*k; cam.tz+=(cam.tzT-cam.tz)*k;
}
function camSet(v){
  if(cam.fp) return;
  const p=CAMVIEW[v]||CAMVIEW.all; cam.view=v;
  cam.yawT=cam.yaw+Math.atan2(Math.sin(p.yaw-cam.yaw),Math.cos(p.yaw-cam.yaw)); cam.pitchT=p.pitch; cam.distT=p.dist; cam.txT=p.tx; cam.tyT=p.ty; cam.tzT=p.tz;
  $$("#v3Grp [data-v]").forEach(b=>b.classList.toggle("on",b.dataset.v===v));
}
/* 라인 방향(충전기 → 포장 라인 끝 = −z) 으로 이동 */
function camPanLine(d){ cam.tzT=clamp(cam.tzT-d*Math.max(.7,cam.dist*.25),-11.5,6.5); }
function bindOrbit(cv,onClick,onHover){
  let down=false,moved=false,lx=0,ly=0,pan=false;
  const toCv=e=>{const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)*cv.width/r.width,y:(e.clientY-r.top)*cv.height/r.height};};
  cv.addEventListener("pointerdown",e=>{if(cam.fp)return; down=true;moved=false;pan=(e.button===1||e.button===2||e.shiftKey);lx=e.clientX;ly=e.clientY;try{cv.setPointerCapture(e.pointerId);}catch(_){}});
  cv.addEventListener("pointermove",e=>{
    if(cam.fp){ down=false; return; }
    if(down){ const dx=e.clientX-lx,dy=e.clientY-ly; lx=e.clientX; ly=e.clientY;
      if(Math.abs(dx)+Math.abs(dy)>3) moved=true;
      if(pan){ const s=cam.dist*.0016, c=Math.cos(cam.yaw), sn=Math.sin(cam.yaw); cam.txT-=dx*s*c; cam.tzT+=dx*s*sn; cam.tyT=clamp(cam.tyT+dy*s,-.5,4); }
      else { cam.yawT-=dx*.006; cam.pitchT=clamp(cam.pitchT+dy*.005,-.1,1.5); }
      return; }
    if(onHover) onHover(toCv(e));
  });
  cv.addEventListener("pointerup",e=>{ if(cam.fp){ down=false; return; } const wm=moved; down=false; try{cv.releasePointerCapture(e.pointerId);}catch(_){}
    if(!wm&&onClick) onClick(toCv(e)); });
  cv.addEventListener("contextmenu",e=>e.preventDefault());
  cv.addEventListener("wheel",e=>{ e.preventDefault(); if(cam.fp) return; cam.distT=clamp(cam.distT*(1+Math.sign(e.deltaY)*.12),.4,32); },{passive:false});
}

/* ── 크기 · 그리기 ── */
function r3Resize(){
  const wrap=$("#view3d"), dpr=Math.min(1.6,window.devicePixelRatio||1)*fitApp.k*GQ.q;
  const W=Math.max(2,Math.round(wrap.clientWidth*dpr)), H=Math.max(2,Math.round(wrap.clientHeight*dpr));
  if(W!==R3.cv.width||H!==R3.cv.height){ R3.cv.width=W; R3.cv.height=H; }
  R3.W=W; R3.H=H;
  if(V3){ const s=V3.renderer.getSize(new T3.Vector2()); if(s.x!==W||s.y!==H) V3.renderer.setSize(W,H,false); v3PostSize(W,H); }
}
function r3Paint(){
  if(!V3) return; const r=V3.renderer, P=V3.POST, sc=V3.scene, c=V3.camera;
  v3Sync(RDT||1/60); v3Cut();
  const sh=GQ.L[GQ.lv].sh&&R3.shadowOn; if(r.shadowMap.enabled!==sh) gqApply(GQ.lv);
  r.toneMapping=T3.NoToneMapping; r.outputEncoding=T3.LinearEncoding; r.setRenderTarget(P.rt); r.render(sc,c);
  if(P.mat.uniforms.ao.value>.5){ P.matA.uniforms.tD.value=P.rt.depthTexture; P.matA.uniforms.nf.value.set(c.near,c.far); r.setRenderTarget(P.ao); r.render(P.scnA,P.cam); }
  P.mat.uniforms.tC.value=P.rt.texture; P.mat.uniforms.tA.value=P.ao.texture;
  r.setRenderTarget(null); r.render(P.scn,P.cam);
  R3.ctx.drawImage(r.domElement,0,0,R3.W,R3.H);
}
function drawDynamic(){}
