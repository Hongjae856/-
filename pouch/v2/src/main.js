/* ═══ 시험용 실행 (구역 ① 확인) ═══ */
const renderer=new T3.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.outputEncoding=T3.sRGBEncoding; renderer.toneMapping=T3.ACESFilmicToneMapping; renderer.toneMappingExposure=.74;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=T3.PCFSoftShadowMap; renderer.physicallyCorrectLights=false;
document.body.appendChild(renderer.domElement);
const scene=new T3.Scene(); scene.background=new T3.Color(0xdfe4e1);
/* 실내 환경 반사 (흰 벽 · 천장 조명) */
{ const es=new T3.Scene(), R=RM.fill; es.add(new T3.Mesh(new T3.BoxGeometry(12,4.2,7),new T3.MeshBasicMaterial({color:0x6f7572,side:T3.BackSide})));
  const fl=new T3.Mesh(new T3.PlaneGeometry(12,7),new T3.MeshBasicMaterial({color:0x4a4d49})); fl.rotation.x=-Math.PI/2; fl.position.y=-2.09; es.add(fl);
  for(const x of [-4,-1.5,1.5,4]) for(const z of [-2,0,2]){ const l=new T3.Mesh(new T3.PlaneGeometry(1.3,.35),new T3.MeshBasicMaterial({color:0xffffff})); l.rotation.x=Math.PI/2; l.position.set(x,2.08,z); l.material.color.multiplyScalar(9); es.add(l); }
  { const c=new T3.Mesh(new T3.PlaneGeometry(12,7),new T3.MeshBasicMaterial({color:0x3c403e})); c.rotation.x=Math.PI/2; c.position.y=2.085; es.add(c); }
  for(const [x,z,w] of [[-3,-3.4,2.2],[2.5,3.4,3],[5.9,0,2]]){ const d=new T3.Mesh(new T3.PlaneGeometry(w,2.4),new T3.MeshBasicMaterial({color:0x2a2d30,side:T3.DoubleSide})); d.position.set(x,-.6,z); if(Math.abs(x)>5) d.rotation.y=Math.PI/2; es.add(d); }
  const pm=new T3.PMREMGenerator(renderer); scene.environment=pm.fromScene(es,.03).texture; }
buildFillRoom(scene); buildFiller(scene);
/* 실제 장면을 다시 찍어 반사에 사용 (설비 · 바닥 · 조명이 스테인리스에 비침) */
{ const pm=new T3.PMREMGenerator(renderer), c=[4.6,1.7,5.4]; scene.position.set(-c[0],-c[1],-c[2]); scene.updateMatrixWorld(true); const rt=pm.fromScene(scene,.015,.05,40); scene.position.set(0,0,0); scene.updateMatrixWorld(true); scene.environment=rt.texture; }
const camera=new T3.PerspectiveCamera(50,1,.05,60);
const VIEWS={ sw:[[.35,2.3,6.6],[3.9,1.45,2.8]], west:[[.3,1.6,2.75],[4,1.5,2.75]], se:[[9.2,2.2,6.6],[4.6,1.5,2.9]], east:[[8.6,1.7,2.75],[4,1.5,2.75]], south:[[4.2,1.7,6.8],[4.2,1.5,2.7]], deck:[[2.2,3.7,5.3],[4.3,2.6,2.7]], top:[[4.3,11,2.76],[4.3,0,2.75]], form:[[1.55,1.45,2.75],[3.1,1.3,2.75]], southp:[[4.3,1.7,6.85],[4.2,1.75,2.7]], eastp:[[7.7,1.35,1.25],[5.7,1.05,2.6]], hop:[[4.25,3.55,4.6],[4.25,2.75,2.75]], nw:[[.6,1.7,.5],[3.2,1.5,2.6]] };
function view(k){ const v=VIEWS[k]; camera.position.set(...v[0]); camera.lookAt(...v[1]); }
function resize(){ const w=innerWidth,h=innerHeight; renderer.setPixelRatio(Math.min(2,devicePixelRatio)); renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix(); }
addEventListener("resize",resize); resize(); view("sw");
/* 그래픽 옵션 : 상 · 중 · 하 (자동 조절은 본편 연결 시) */
const GFX={high:{pr:2,sm:2048,sh:true},mid:{pr:1.25,sm:1024,sh:true},low:{pr:1,sm:512,sh:false}};
function setGfx(k){ const q=GFX[k]; renderer.setPixelRatio(Math.min(q.pr,devicePixelRatio||1)); renderer.shadowMap.enabled=q.sh; POST.mat.uniforms.ao.value=k==='low'?0:1; scene.traverse(o=>{ if(o.isLight&&o.shadow&&o.castShadow!==undefined&&o.isDirectionalLight){ o.castShadow=q.sh; o.shadow.mapSize.set(q.sm,q.sm); if(o.shadow.map){ o.shadow.map.dispose(); o.shadow.map=null; } } if(o.material) o.material.needsUpdate=true; }); resize(); postSize(); }
/* ── 후처리 : 틈 · 모서리 음영(SSAO, 깊이 기반) + ACES 톤매핑 + sRGB ── */
const POST={on:true, rt:null, quad:null, cam:new T3.OrthographicCamera(-1,1,1,-1,0,1), scn:new T3.Scene()};
POST.mat=new T3.ShaderMaterial({uniforms:{tC:{value:null},tD:{value:null},res:{value:new T3.Vector2()},nf:{value:new T3.Vector2(.05,60)},expo:{value:.74},ao:{value:1}},
 vertexShader:"varying vec2 v; void main(){ v=uv; gl_Position=vec4(position.xy,0.,1.); }",
 fragmentShader:`precision highp float; varying vec2 v; uniform sampler2D tC,tD; uniform vec2 res,nf; uniform float expo,ao;
 float lin(float d){ float z=d*2.-1.; return 2.*nf.x*nf.y/(nf.y+nf.x-z*(nf.y-nf.x)); }
 vec3 aces(vec3 x){ x*=expo/0.6; mat3 a=mat3(.59719,.076,.0284,.35458,.90834,.13383,.04823,.01566,.83777), b=mat3(1.60475,-.10208,-.00327,-.53108,1.10813,-.07276,-.07367,-.00605,1.07602);
   x=a*x; x=(x*(x+.0245786)-.000090537)/(x*(.983729*x+.432951)+.238081); return clamp(b*x,0.,1.); }
 void main(){ vec3 c=texture2D(tC,v).rgb; float d=lin(texture2D(tD,v).x), occ=0.;
   if(ao>.5){ float rad=clamp(.16/d,.004,.06); float a0=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)*6.283;
     for(int i=0;i<14;i++){ float fi=float(i), r=rad*sqrt((fi+.5)/14.), an=a0+fi*2.39996; vec2 o=vec2(cos(an),sin(an))*r*vec2(res.y/res.x,1.);
       float sd=lin(texture2D(tD,v+o).x), df=d-sd; occ+=smoothstep(.006,.05,df)*(1.-smoothstep(.12,.45,df)); }
     occ=occ/14.; }
   c*=1.-.78*occ; c=aces(c); c=pow(c,vec3(1./2.2)); gl_FragColor=vec4(c,1.); }`,depthTest:false,depthWrite:false});
POST.scn.add(new T3.Mesh(new T3.PlaneGeometry(2,2),POST.mat));
function postSize(){ const s=renderer.getDrawingBufferSize(new T3.Vector2()); if(POST.rt) POST.rt.dispose();
  POST.rt=new T3.WebGLRenderTarget(s.x,s.y,{type:T3.HalfFloatType,samples:4}); POST.rt.depthTexture=new T3.DepthTexture(s.x,s.y); POST.rt.depthTexture.type=T3.UnsignedIntType;
  POST.mat.uniforms.res.value.copy(s); }
function draw(){ if(!POST.on){ renderer.toneMapping=T3.ACESFilmicToneMapping; renderer.outputEncoding=T3.sRGBEncoding; renderer.setRenderTarget(null); renderer.render(scene,camera); return; }
  renderer.toneMapping=T3.NoToneMapping; renderer.outputEncoding=T3.LinearEncoding; renderer.setRenderTarget(POST.rt); renderer.render(scene,camera);
  POST.mat.uniforms.tC.value=POST.rt.texture; POST.mat.uniforms.tD.value=POST.rt.depthTexture; POST.mat.uniforms.nf.value.set(camera.near,camera.far);
  renderer.setRenderTarget(null); renderer.render(POST.scn,POST.cam); }
addEventListener("resize",postSize); postSize();
function frame(){ requestAnimationFrame(frame); draw(); } frame();
window.__V={view,scene,camera,renderer,setGfx,POST};
