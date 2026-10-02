/* ═══════════════════════════════════════════════════════════════════
   충전실 그래픽 보강 — 충전기 엔진의 createDepthGPU · depthPaint 를 통합본에서만 교체
   (원본 흐름 그대로 : 그림자 맵 → 바닥 그림자 → 불투명 → 반투명. 여기에 재질 셰이더와 AO 패스를 더한다)
   ═══════════════════════════════════════════════════════════════════ */
(function(){
if(!window.parent||window.parent===window) return;
const VS_MAIN='attribute vec3 a_pos;attribute vec3 a_w;attribute vec3 a_n;attribute vec4 a_col;attribute vec4 a_mat;attribute vec2 a_uv;'+
 'varying vec3 vW;varying vec3 vN;varying vec4 vC;varying vec4 vM;varying vec2 vUV;void main(){'+VS_PROJ+'vW=a_w;vN=a_n;vC=a_col;vM=a_mat;vUV=a_uv;}';
const FS_MAIN=PX_HEAD+PX_LIGHT+GFX_MAT+'varying vec3 vW;varying vec3 vN;varying vec4 vC;varying vec4 vM;varying vec2 vUV;uniform vec3 u_ink;void main(){vec3 c=vC.rgb;'+
 'float ink=0.0;if(vM.w>0.5){float p=fract((vUV.x+vUV.y)/18.0);float stripe=smoothstep(0.02,0.06,p)*(1.0-smoothstep(0.48,0.52,p));c*=mix(vec3(1.0),u_ink*0.85,stripe);ink=stripe;}'+
 'if(vM.z<0.5){c=pxShade2(c,vM.x*(1.0-ink),vW,normalize(vN),pow(vM.y,2.2));if(ink>0.0){float l=dot(c,vec3(0.299,0.587,0.114));c=clamp(mix(vec3(l),c,1.0+0.9*ink),0.0,1.0);}}gl_FragColor=vec4(c*vC.a,vC.a);}';
const VS_DEPTH='attribute vec3 a_pos;varying float vD;void main(){'+VS_PROJ+'vD=z;}';
const FAR=14000, AO_R=18, DET=2600;
let G=null;
function create(){
  const canvas=document.createElement('canvas');
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true,premultipliedAlpha:true,preserveDrawingBuffer:false});
  if(!gl) throw Error('WebGL을 사용할 수 없습니다. 브라우저의 그래픽 가속 설정을 확인하세요.');
  const main=pxProgram(gl,VS_MAIN,FS_MAIN,['a_pos','a_w','a_n','a_col','a_mat','a_uv']);
  const catcher=pxProgram(gl,'attribute vec3 a_pos;attribute vec3 a_w;varying vec3 vW;void main(){'+VS_PROJ+'vW=a_w;}',PX_CATCH_FS,['a_pos','a_w']);
  const shadow=pxProgram(gl,PX_SM_VS,PX_SM_FS,['p']);
  let aoP=null; try{ aoP=gfxAOInit(gl,VS_DEPTH,['a_pos']); }catch(e){ console.warn('AO 비활성',e); }
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();M3.gpuError='그래픽 컨텍스트가 중단되었습니다. 복구 대기 중입니다.';});
  canvas.addEventListener('webglcontextrestored',()=>{G=null;M3.gpuError=null;});
  return {canvas,gl,main,catcher,shadow,aoP,buffer:gl.createBuffer(),quad:gl.createBuffer(),
    sm:pxShadowTarget(gl,SM_SIZE),lm:pxLightMatrix(SCENE_LO,SCENE_HI,SM_SIZE),
    data:new Float32Array(VSTRIDE*65536),capacity:0,depthBits:gl.getParameter(gl.DEPTH_BITS)};
}
/* 바닥 사각형(월드) → 화면 좌표 정점 [ndcX,ndcY,z, wx,wy,wz] (원본 바닥 그림자 받이와 같은 방식) */
function floorVerts(x0,x1,z0,z1,y,W,H){
  const quad=clipWorld([P3(x0,y,z0),P3(x1,y,z0),P3(x1,y,z1),P3(x0,y,z1)],p=>prj(p).z-60);
  if(quad.length<3) return null;
  const v=quad.map(q=>{const s=prj(q);return [s.x/W*2-1,1-s.y/H*2,s.z,q.x,q.y,q.z];}),tri=[];
  for(let i=1;i<v.length-1;i++)tri.push(...v[0],...v[i],...v[i+1]);
  return tri;
}
depthPaint=function(ctx,opaque,transparent,W,H){
try{
const gpu=G||(G=create());const {gl,canvas}=gpu;
if(gl.isContextLost())throw Error(M3.gpuError||'그래픽 컨텍스트 복구 대기 중');
const width=Math.round(W*M3.dpr),height=Math.round(H*M3.dpr);
if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
let needed=0;for(const arr of [opaque,transparent])for(const f of arr)needed+=Math.max(0,f.p.length-2)*3*VSTRIDE;
if(gpu.data.length<needed)gpu.data=new Float32Array(2**Math.ceil(Math.log2(needed)));
let offset=0;
const append=arr=>{for(const f of arr){
const size=f.p.length*VSTRIDE;
if(!gpu.faceData||gpu.faceData.length<size)gpu.faceData=new Float32Array(2**Math.ceil(Math.log2(Math.max(VSTRIDE,size))));
const a=gpu.faceData,c=hx(f.h),pat=f.uv?1:0;
for(let idx=0;idx<f.p.length;idx++){const p=f.p[idx],w=f.w[idx],n=f.n[idx],uv=f.uv?f.uv[idx]:null;let j=idx*VSTRIDE;
a[j++]=p.x/W*2-1;a[j++]=1-p.y/H*2;a[j++]=p.z;a[j++]=w.x;a[j++]=w.y;a[j++]=w.z;a[j++]=n.x;a[j++]=n.y;a[j++]=n.z;
a[j++]=c[0]/255;a[j++]=c[1]/255;a[j++]=c[2]/255;a[j++]=f.a;a[j++]=f.m;a[j++]=f.br;a[j++]=f.fl;a[j++]=pat;a[j++]=uv?uv[0]:0;a[j++]=uv?uv[1]:0;
}
for(let i=1;i<f.p.length-1;i++)for(let corner=0;corner<3;corner++){const idx=corner===0?0:i+corner-1;for(let j=0;j<VSTRIDE;j++)gpu.data[offset++]=a[idx*VSTRIDE+j];}
}};
append(opaque);const opaqueCount=offset/VSTRIDE;append(transparent);const total=offset/VSTRIDE;
gl.bindBuffer(gl.ARRAY_BUFFER,gpu.buffer);
if(gpu.capacity<gpu.data.byteLength){gl.bufferData(gl.ARRAY_BUFFER,gpu.data.byteLength,gl.DYNAMIC_DRAW);gpu.capacity=gpu.data.byteLength;}
gl.bufferSubData(gl.ARRAY_BUFFER,0,gpu.data.subarray(0,offset));
const ST=VSTRIDE*4, ptr=(i,k,off)=>{gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,k,gl.FLOAT,false,ST,off*4);};
const shadowOn=gpu.sm.ok&&window.__shadowOn!==false;
/* ① 그림자 맵 */
if(shadowOn)pxShadowPass(gl,gpu.shadow,gpu.sm,gpu.lm,()=>{for(let i=1;i<6;i++)gl.disableVertexAttribArray(i);gl.bindBuffer(gl.ARRAY_BUFFER,gpu.buffer);ptr(0,3,3);},opaqueCount);
/* ①-2 AO 깊이 (반해상도) : 불투명 형상 + 방 바닥 */
const P=gpu.aoP, aoOn=GFX.on&&GFX.ao&&P&&opaqueCount&&gfxAOSize(gl,P,width,height);
if(aoOn){
  gl.bindFramebuffer(gl.FRAMEBUFFER,P.D.fb);gl.viewport(0,0,P.D.w,P.D.h);
  gl.clearColor(0,0,0,0);gl.clearDepth(1);gl.depthMask(true);gl.disable(gl.BLEND);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.useProgram(P.depth.p);gl.uniform1f(P.depth.u('uFar'),FAR);
  for(let i=1;i<6;i++)gl.disableVertexAttribArray(i);
  gl.bindBuffer(gl.ARRAY_BUFFER,gpu.buffer);ptr(0,3,0);gl.drawArrays(gl.TRIANGLES,0,opaqueCount);
  const fv=floorVerts(-1500,4900,-700,1100,FLOORY,W,H);
  if(fv){gl.bindBuffer(gl.ARRAY_BUFFER,gpu.quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(fv),gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);gl.drawArrays(gl.TRIANGLES,0,fv.length/6);}
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
}
gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.clearDepth(1);gl.depthMask(true);
gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
const eye=[CAMP.x,CAMP.y,CAMP.z],ao=[AO_B,AO_H,0.006452];
gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
/* ② 바닥 그림자 받이 */
if(shadowOn){
const tri=floorVerts(SCENE_LO[0],SCENE_HI[0],SCENE_LO[2],SCENE_HI[2],FLOORY+0.5,W,H);
if(tri){
pxLightUniforms(gl,gpu.catcher,eye,ao,gpu.lm,gpu.sm);
gl.uniform4fv(gpu.catcher.u('uTint'),[0.22,0.27,0.33,0.30]);gl.uniform4fv(gpu.catcher.u('uRect'),[SCENE_LO[0],SCENE_LO[2],SCENE_HI[0],SCENE_HI[2]]);
for(let i=2;i<6;i++)gl.disableVertexAttribArray(i);
gl.bindBuffer(gl.ARRAY_BUFFER,gpu.quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(tri),gl.DYNAMIC_DRAW);
gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);
gl.depthMask(false);gl.drawArrays(gl.TRIANGLES,0,tri.length/6);gl.depthMask(true);
}}
/* ③ 불투명 (재질 셰이더) */
const mainSetup=()=>{ pxLightUniforms(gl,gpu.main,eye,ao,gpu.lm,gpu.sm);
  gl.uniform3fv(gpu.main.u('u_ink'),hx(foilInk()).map((x,i)=>x/hx(foilCol())[i]));gl.uniform1f(gpu.main.u('uDet'),DET);
  gl.bindBuffer(gl.ARRAY_BUFFER,gpu.buffer);ptr(0,3,0);ptr(1,3,3);ptr(2,3,6);ptr(3,4,9);ptr(4,4,13);ptr(5,2,17); };
mainSetup();
gl.disable(gl.BLEND);gl.depthMask(true);if(opaqueCount)gl.drawArrays(gl.TRIANGLES,0,opaqueCount);
/* ③-2 주변광 차폐 적용 */
if(aoOn){ gfxAOResolve(gl,P,width,height,FAR,AO_R,M3.fov*P.D.w/W); mainSetup(); }
/* ④ 반투명 (뒤→앞, 깊이 기록 없음) */
gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
if(total>opaqueCount)gl.drawArrays(gl.TRIANGLES,opaqueCount,total-opaqueCount);
gl.depthMask(true);gl.disable(gl.BLEND);
ctx.drawImage(canvas,0,0,W,H);
M3.stats={renderer:'WebGL depth · per-pixel · AO',drawCalls:(opaqueCount?2:0)+(total>opaqueCount?1:0)+(gpu.sm.ok?1:0)+(aoOn?3:0),triangles:total/3,opaqueFaces:opaque.length,transparentFaces:transparent.length,depthBits:gpu.depthBits,shadowMap:gpu.sm.ok,ao:!!aoOn,q:GFX.q};
M3.gpuError=null;
}catch(e){
M3.gpuError=e.message;ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.fillStyle='#a32216';ctx.font='16px Malgun Gothic';
ctx.fillText('3D 표시 중단: '+e.message,20,H/2);ctx.fillText('상단 2D 보기에서 교육을 계속할 수 있습니다.',20,H/2+30);
}
};
/* ④ 적응 해상도 : 충전기 엔진의 M3.q(해상도 배율)를 조정 */
const _draw=m3Draw;
m3Draw=function(){ if(window.ROOM_ACTIVE!==false&&gfxAdapt(performance.now())){ M3.q=GFX.q; M3._rs=1; } else if(M3.q!==GFX.q){ M3.q=GFX.q; M3._rs=1; } return _draw.apply(this,arguments); };
})();
