/* ═══ 시험용 실행 (구역 ① 확인) ═══ */
const renderer=new T3.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.outputEncoding=T3.sRGBEncoding; renderer.toneMapping=T3.ACESFilmicToneMapping; renderer.toneMappingExposure=.74;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=T3.PCFSoftShadowMap; renderer.physicallyCorrectLights=false;
document.body.appendChild(renderer.domElement);
const ENVLED=+(new URLSearchParams(location.search).get('led')||28);
const scene=new T3.Scene(); scene.background=new T3.Color(0xdfe4e1);
/* 실내 환경 반사 (흰 벽 · 천장 조명) */
{ const es=new T3.Scene(), R=RM.fill; es.add(new T3.Mesh(new T3.BoxGeometry(12,4.2,7),new T3.MeshBasicMaterial({color:0x6f7572,side:T3.BackSide})));
  const fl=new T3.Mesh(new T3.PlaneGeometry(12,7),new T3.MeshBasicMaterial({color:0x4a4d49})); fl.rotation.x=-Math.PI/2; fl.position.y=-2.09; es.add(fl);
  for(const x of [-4,-1.5,1.5,4]) for(const z of [-2,0,2]){ const l=new T3.Mesh(new T3.PlaneGeometry(1.3,.35),new T3.MeshBasicMaterial({color:0xffffff})); l.rotation.x=Math.PI/2; l.position.set(x,2.08,z); l.material.color.multiplyScalar(9); es.add(l); }
  { const c=new T3.Mesh(new T3.PlaneGeometry(12,7),new T3.MeshBasicMaterial({color:0x3c403e})); c.rotation.x=Math.PI/2; c.position.y=2.085; es.add(c); }
  for(const [x,z,w] of [[-3,-3.4,2.2],[2.5,3.4,3],[5.9,0,2]]){ const d=new T3.Mesh(new T3.PlaneGeometry(w,2.4),new T3.MeshBasicMaterial({color:0x2a2d30,side:T3.DoubleSide})); d.position.set(x,-.6,z); if(Math.abs(x)>5) d.rotation.y=Math.PI/2; es.add(d); }
  const pm=new T3.PMREMGenerator(renderer); scene.environment=pm.fromScene(es,.03).texture; }
buildFillRoom(scene); buildFiller(scene); buildConveyor(scene); buildFillZone(scene); buildPackRoom(scene); initAnim(scene); initManual(scene); initPackAnim(scene);
/* 색 지도(map)는 모두 sRGB 로 해석 (색 관리 일괄 보정) */
scene.traverse(o=>{ if(!o.material) return; for(const m of [].concat(o.material)) for(const k of ["map","emissiveMap"]) if(m[k]&&m[k].encoding!==T3.sRGBEncoding){ m[k].encoding=T3.sRGBEncoding; m[k].needsUpdate=true; } });
/* 실제 장면을 다시 찍어 반사에 사용 (설비 · 바닥 · 조명이 스테인리스에 비침) */
{ const pm=new T3.PMREMGenerator(renderer), c=[4.6,1.7,5.4]; scene.position.set(-c[0],-c[1],-c[2]); scene.updateMatrixWorld(true); M.led.emissiveIntensity=ENVLED; const rt=pm.fromScene(scene,.015,.05,40); M.led.emissiveIntensity=1.6; scene.position.set(0,0,0); scene.updateMatrixWorld(true); scene.environment=rt.texture; }
const camera=new T3.PerspectiveCamera(50,1,.05,60);
const VIEWS={ sw:[[.35,2.3,6.6],[3.9,1.45,2.8]], west:[[.5,1.45,2.6],[3.1,1.05,2.75]], se:[[9.2,2.2,6.6],[4.6,1.5,2.9]], east:[[8.6,1.7,2.75],[4,1.5,2.75]], south:[[4.2,1.7,6.8],[4.2,1.5,2.7]], deck:[[2.2,3.7,5.3],[4.3,2.6,2.7]], top:[[4.3,11,2.76],[4.3,0,2.75]], form:[[1.55,1.45,2.75],[3.1,1.3,2.75]], southp:[[1.3,1.6,6.8],[4.3,1.5,2.9]], eastp:[[7.9,1.5,6.2],[4.4,1.4,2.9]], hop:[[4.25,3.55,4.6],[4.25,2.75,2.75]], nw:[[.9,1.75,.35],[3.2,1.3,2.7]], ne:[[11.2,2.6,.5],[5.5,1.2,3.2]], ibc:[[8.9,1.7,3.4],[6.4,1.1,1.7]], conv:[[1.0,1.7,3.6],[2.5,1.2,1.2]], all:[[11.3,3.4,6.7],[4.6,1.0,2.6]], pk1:[[6.6,2.3,-.6],[2.6,1.1,-4.2]], pk2:[[6.2,2.0,-11.4],[2.6,1.0,-7.6]], pk3:[[5.0,1.6,-1.1],[2.6,1.2,-1.1]], pk4:[[5.2,1.6,-7.2],[2.5,1.2,-7.2]] };
function view(k){ const v=VIEWS[k]; camera.position.set(...v[0]); camera.lookAt(...v[1]); }
function resize(){ const w=innerWidth,h=innerHeight; renderer.setPixelRatio(Math.min(2,devicePixelRatio)); renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix(); }
addEventListener("resize",resize); resize(); view("sw");
/* 그래픽 옵션 : 상 · 중 · 하 (자동 조절은 본편 연결 시) */
const GFX={high:{pr:2,sm:2048,sh:true},mid:{pr:1.25,sm:1024,sh:true},low:{pr:1,sm:512,sh:false}};
function setGfx(k){ const q=GFX[k]; renderer.setPixelRatio(Math.min(q.pr,devicePixelRatio||1)); renderer.shadowMap.enabled=q.sh; POST.mat.uniforms.ao.value=k==='low'?0:1; scene.traverse(o=>{ if(o.isLight&&o.shadow&&o.castShadow!==undefined&&o.isDirectionalLight){ o.castShadow=q.sh; o.shadow.mapSize.set(q.sm,q.sm); if(o.shadow.map){ o.shadow.map.dispose(); o.shadow.map=null; } } if(o.material) o.material.needsUpdate=true; }); resize(); postSize(); }
/* ── 후처리 : ① 틈 · 모서리 음영(SSAO · 반해상도 · 4×4 교차 무늬) → ② 흐림 합성 + ACES 톤매핑 + 대비 + sRGB ── */
const POST={on:true, rt:null, ao:null, cam:new T3.OrthographicCamera(-1,1,1,-1,0,1), scn:new T3.Scene(), scnA:new T3.Scene()};
const VS="varying vec2 v; void main(){ v=uv; gl_Position=vec4(position.xy,0.,1.); }", LIN="float lin(float d){ float z=d*2.-1.; return 2.*nf.x*nf.y/(nf.y+nf.x-z*(nf.y-nf.x)); }";
POST.matA=new T3.ShaderMaterial({uniforms:{tD:{value:null},res:{value:new T3.Vector2()},nf:{value:new T3.Vector2(.05,60)}},vertexShader:VS,
 fragmentShader:`precision highp float; varying vec2 v; uniform sampler2D tD; uniform vec2 res,nf; ${LIN}
 void main(){ float d=lin(texture2D(tD,v).x), occ=0.; vec2 q=mod(floor(gl_FragCoord.xy),4.); float a0=(q.x+q.y*4.)*.3927+.2, rad=clamp(.17/d,.004,.07);
   for(int i=0;i<12;i++){ float fi=float(i), r=rad*sqrt((fi+.5)/12.), an=a0+fi*2.39996; vec2 o=vec2(cos(an),sin(an))*r*vec2(res.y/res.x,1.);
     float df=d-lin(texture2D(tD,v+o).x); occ+=smoothstep(.005,.045,df)*(1.-smoothstep(.12,.42,df)); }
   gl_FragColor=vec4(vec3(1.-occ/12.),1.); }`,depthTest:false,depthWrite:false});
POST.mat=new T3.ShaderMaterial({uniforms:{tC:{value:null},tA:{value:null},resA:{value:new T3.Vector2()},expo:{value:.62},ao:{value:1},con:{value:.42}},vertexShader:VS,
 fragmentShader:`precision highp float; varying vec2 v; uniform sampler2D tC,tA; uniform vec2 resA; uniform float expo,ao,con;
 vec3 aces(vec3 x){ x*=expo/0.6; mat3 a=mat3(.59719,.076,.0284,.35458,.90834,.13383,.04823,.01566,.83777), b=mat3(1.60475,-.10208,-.00327,-.53108,1.10813,-.07276,-.07367,-.00605,1.07602);
   x=a*x; x=(x*(x+.0245786)-.000090537)/(x*(.983729*x+.432951)+.238081); return clamp(b*x,0.,1.); }
 void main(){ vec3 c=texture2D(tC,v).rgb; float k=1.;
   if(ao>.5){ vec2 t=1./resA; k=(texture2D(tA,v+t*vec2(-1.,-1.)).r+texture2D(tA,v+t*vec2(1.,-1.)).r+texture2D(tA,v+t*vec2(-1.,1.)).r+texture2D(tA,v+t*vec2(1.,1.)).r)*.25; k=1.-.85*(1.-k); }
   c=aces(c*k); c=pow(c,vec3(1./2.2)); c=mix(c,c*c*(3.-2.*c),con); gl_FragColor=vec4(c,1.); }`,depthTest:false,depthWrite:false});
POST.scn.add(new T3.Mesh(new T3.PlaneGeometry(2,2),POST.mat)); POST.scnA.add(new T3.Mesh(new T3.PlaneGeometry(2,2),POST.matA));
function postSize(){ const s=renderer.getDrawingBufferSize(new T3.Vector2()); if(POST.rt){ POST.rt.dispose(); POST.ao.dispose(); }
  POST.rt=new T3.WebGLRenderTarget(s.x,s.y,{type:T3.HalfFloatType,samples:4}); POST.rt.depthTexture=new T3.DepthTexture(s.x,s.y); POST.rt.depthTexture.type=T3.UnsignedIntType;
  const ax=Math.ceil(s.x/2), ay=Math.ceil(s.y/2); POST.ao=new T3.WebGLRenderTarget(ax,ay,{minFilter:T3.LinearFilter,magFilter:T3.LinearFilter,depthBuffer:false});
  POST.matA.uniforms.res.value.set(ax,ay); POST.mat.uniforms.resA.value.set(ax,ay); }
function draw(){ if(!POST.on){ renderer.toneMapping=T3.ACESFilmicToneMapping; renderer.outputEncoding=T3.sRGBEncoding; renderer.setRenderTarget(null); renderer.render(scene,camera); return; }
  renderer.toneMapping=T3.NoToneMapping; renderer.outputEncoding=T3.LinearEncoding; renderer.setRenderTarget(POST.rt); renderer.render(scene,camera);
  if(POST.mat.uniforms.ao.value>.5){ POST.matA.uniforms.tD.value=POST.rt.depthTexture; POST.matA.uniforms.nf.value.set(camera.near,camera.far); renderer.setRenderTarget(POST.ao); renderer.render(POST.scnA,POST.cam); }
  POST.mat.uniforms.tC.value=POST.rt.texture; POST.mat.uniforms.tA.value=POST.ao.texture;
  renderer.setRenderTarget(null); renderer.render(POST.scn,POST.cam); }
addEventListener("resize",postSize); postSize();
let PAUSE=false;
let TPREV=0;
function frame(now){ requestAnimationFrame(frame); const dt=Math.min(.05,((now||0)-TPREV)/1000); TPREV=now||0; if(!PAUSE){ stepAnim(dt); draw(); } } frame();
window.__V={step:stepAnim,AN,CV,view,scene,camera,renderer,setGfx,POST,draw,pause:v=>{PAUSE=v;},VIEWS};
