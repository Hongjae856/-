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
function setGfx(k){ const q=GFX[k]; renderer.setPixelRatio(Math.min(q.pr,devicePixelRatio||1)); renderer.shadowMap.enabled=q.sh; scene.traverse(o=>{ if(o.isLight&&o.shadow&&o.castShadow!==undefined&&o.isDirectionalLight){ o.castShadow=q.sh; o.shadow.mapSize.set(q.sm,q.sm); if(o.shadow.map){ o.shadow.map.dispose(); o.shadow.map=null; } } if(o.material) o.material.needsUpdate=true; }); resize(); }
function frame(){ requestAnimationFrame(frame); renderer.render(scene,camera); } frame();
window.__V={view,scene,camera,renderer,setGfx};
