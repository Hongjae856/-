/* ═══════════════════════════════════════════════════════════════════
   포장실 그래픽 보강 — 포장라인 엔진의 createDepthGPU · depthPaint 를 통합본에서만 교체
   · 이 엔진은 면마다 금속도를 넘기지 않으므로(원본은 전역 0.35) 색으로 재질을 구분한다 :
     채도가 낮은 밝은 회색 = 스테인리스 · 알루미늄, 아주 밝은 흰색 = 도장면, 어두운 색 = 고무 · 수지
   ═══════════════════════════════════════════════════════════════════ */
(function(){
if(!window.parent||window.parent===window) return;
const FS2=PX_HEAD+PX_LIGHT+GFX_MAT+"varying vec3 vW;varying vec3 vN;varying vec4 vC;"+
 "float lMet(vec3 c){float mx=max(c.r,max(c.g,c.b)),mn=min(c.r,min(c.g,c.b)),L=(mx+mn)*0.5;"+
 "if(mx-mn<0.07&&L>0.52&&L<0.935)return 0.72;if(L<0.30)return 0.16;return 0.12;}"+
 "void main(){vec3 c=pxShade2(vC.rgb,lMet(vC.rgb),vW,normalize(vN),1.0);gl_FragColor=vec4(c*vC.a,vC.a);}";
const VS_DEPTH="attribute vec3 p;uniform mat4 mvp;varying float vD;void main(){gl_Position=mvp*vec4(p,1.0);vD=gl_Position.w;}";
const FAR=12000, AO_R=14, DET=2300, TANH=Math.tan(0.31);
createDepthGPU=function(){
  glCv=document.createElement("canvas");
  const g=glCv.getContext("webgl",{antialias:true, alpha:true, premultipliedAlpha:true, depth:true});
  if(!g) return null;
  try{
    GPU={ main:pxProgram(g,VS,FS2,["p","n","c"]),
      shadow:pxProgram(g,PX_SM_VS,PX_SM_FS,["p"]),
      catcher:pxProgram(g,CATCH_VS,PX_CATCH_FS,["p"]),
      buf:{p:g.createBuffer(),n:g.createBuffer(),c:g.createBuffer(),q:g.createBuffer()},
      sm:pxShadowTarget(g,SM_SIZE), lm:pxLightMatrix(SCENE_LO,SCENE_HI,SM_SIZE) };
    try{ GPU.aoP=gfxAOInit(g,VS_DEPTH,["p"]); }catch(e){ console.warn("AO 비활성",e); GPU.aoP=null; }
  }catch(e){ console.error("3D 셰이더 준비 실패",e); return null; }
  g.enable(g.DEPTH_TEST); g.depthFunc(g.LEQUAL);
  g.disable(g.CULL_FACE);
  glCv.addEventListener("webglcontextlost",e=>{e.preventDefault(); gl=null;});
  glCv.addEventListener("webglcontextrestored",()=>{ gl=createDepthGPU(); m3Resize(); });
  return g;
};
depthPaint=function(w,h){
  const g=gl; if(!g) return;
  const B=GPU.buf;
  const up=(buf,arr)=>{ g.bindBuffer(g.ARRAY_BUFFER,buf); g.bufferData(g.ARRAY_BUFFER,arr instanceof Float32Array?arr:new Float32Array(arr),g.DYNAMIC_DRAW); };
  const attr=(i,buf,k)=>{ g.bindBuffer(g.ARRAY_BUFFER,buf); g.enableVertexAttribArray(i); g.vertexAttribPointer(i,k,g.FLOAT,false,0,0); };
  const posOnly=buf=>{ for(let i=1;i<6;i++) g.disableVertexAttribArray(i); attr(0,buf,3); };
  const all=()=>{ attr(0,B.p,3); attr(1,B.n,3); attr(2,B.c,4); };
  const ao=[AO_B,AO_H,0.0065];
  up(B.p,GP); up(B.n,GN); up(B.c,GC);
  const nOpq=GP.length/3;
  const shadowOn=GPU.sm.ok&&window.__shadowOn!==false;
  /* ① 그림자 맵 */
  if(shadowOn) pxShadowPass(g,GPU.shadow,GPU.sm,GPU.lm,()=>posOnly(B.p),nOpq);
  /* ①-2 AO 깊이 (반해상도) : 불투명 형상 + 방 바닥 */
  const P=GPU.aoP, aoOn=GFX.on&&GFX.ao&&P&&nOpq&&gfxAOSize(g,P,w,h);
  if(aoOn){
    g.bindFramebuffer(g.FRAMEBUFFER,P.D.fb); g.viewport(0,0,P.D.w,P.D.h);
    g.clearColor(0,0,0,0); g.clearDepth(1); g.depthMask(true); g.disable(g.BLEND); g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);
    g.useProgram(P.depth.p); g.uniformMatrix4fv(P.depth.u("mvp"),false,camMVP); g.uniform1f(P.depth.u("uFar"),FAR);
    posOnly(B.p); g.drawArrays(g.TRIANGLES,0,nOpq);
    const x0=-3500,x1=1900,z0=-560,z1=880;
    up(B.q,[x0,0,z0, x1,0,z0, x1,0,z1, x0,0,z0, x1,0,z1, x0,0,z1]); posOnly(B.q); g.drawArrays(g.TRIANGLES,0,6);
    g.bindFramebuffer(g.FRAMEBUFFER,null);
  }
  g.viewport(0,0,w,h);
  g.clearColor(0,0,0,0); g.clearDepth(1);
  g.depthMask(true);
  g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);
  g.enable(g.BLEND); g.blendFunc(g.ONE,g.ONE_MINUS_SRC_ALPHA);
  /* ② 바닥 그림자 받이 */
  if(shadowOn){
    const y=0.4, x0=SCENE_LO[0], x1=SCENE_HI[0], z0=SCENE_LO[2], z1=SCENE_HI[2];
    pxLightUniforms(g,GPU.catcher,camEye,ao,GPU.lm,GPU.sm);
    g.uniformMatrix4fv(GPU.catcher.u("mvp"),false,camMVP);
    g.uniform4fv(GPU.catcher.u("uTint"),[0.22,0.27,0.33,0.30]);
    g.uniform4fv(GPU.catcher.u("uRect"),[x0,z0,x1,z1]);
    up(B.q,[x0,y,z0, x1,y,z0, x1,y,z1, x0,y,z0, x1,y,z1, x0,y,z1]); posOnly(B.q);
    g.depthMask(false); g.drawArrays(g.TRIANGLES,0,6); g.depthMask(true);
  }
  /* ③ 불투명 (재질 셰이더) */
  const mainSetup=()=>{ pxLightUniforms(g,GPU.main,camEye,ao,GPU.lm,GPU.sm);
    g.uniformMatrix4fv(GPU.main.u("mvp"),false,camMVP); g.uniform1f(GPU.main.u("uDet"),DET); };
  mainSetup();
  g.disable(g.BLEND);
  if(nOpq){ all(); g.drawArrays(g.TRIANGLES,0,nOpq); }
  /* ③-2 주변광 차폐 적용 */
  if(aoOn){ gfxAOResolve(g,P,w,h,FAR,AO_R,P.D.h/2/TANH); mainSetup(); }
  /* ④ 반투명 — 뒤→앞 정렬 */
  if(TP.length){
    const n=TP.length/9, idx=new Array(n);
    for(let i=0;i<n;i++){ const o=i*9;
      const mx=(TP[o]+TP[o+3]+TP[o+6])/3-camEye[0], my=(TP[o+1]+TP[o+4]+TP[o+7])/3-camEye[1], mz=(TP[o+2]+TP[o+5]+TP[o+8])/3-camEye[2];
      idx[i]=[i,mx*mx+my*my+mz*mz]; }
    idx.sort((a,b)=>b[1]-a[1]);
    const Pp=new Float32Array(TP.length), N=new Float32Array(TN.length), C=new Float32Array(TC.length);
    idx.forEach((it,k)=>{ const s=it[0];
      for(let j=0;j<9;j++){ Pp[k*9+j]=TP[s*9+j]; N[k*9+j]=TN[s*9+j]; }
      for(let j=0;j<12;j++) C[k*12+j]=TC[s*12+j]; });
    up(B.p,Pp); up(B.n,N); up(B.c,C); all();
    g.enable(g.BLEND); g.blendFunc(g.ONE,g.ONE_MINUS_SRC_ALPHA);
    g.depthMask(false);
    g.drawArrays(g.TRIANGLES,0,n*3);
    g.depthMask(true); g.disable(g.BLEND);
  }
  if(ctx2) ctx2.drawImage(glCv,0,0,w,h);
  m3.stats={tri:(GP.length/9)+(TP.length/9), opaque:GP.length/9, glass:TP.length/9,
            depthBits:g.getParameter(g.DEPTH_BITS), shadowMap:GPU.sm.ok, ao:!!aoOn, q:GFX.q};
};
/* ④ 작업자 LOD : 카메라 거리 1300 미만 = 원본 분할(원기둥 14 · 타원체 18×11), 그 밖은 단계적으로 줄인다 */
const LODS=[{t:14,u:[18,11,12,8]},{t:9,u:[12,8,9,6]},{t:7,u:[10,6,8,5]}];
window.ROOM_LOD=function(x,z){
  const d=Math.hypot(camEye[0]-x,camEye[1]-160,camEye[2]-z), L=LODS[d<1300?0:d<2600?1:2];
  return {t:L.t, e:(c,r,big)=>cuteEllPoints(c,r,big?L.u[0]:L.u[2],big?L.u[1]:L.u[3])};
};
/* 포장라인 엔진은 페이지 로딩 중에 3D 를 먼저 초기화하므로, 이미 만들어진 컨텍스트를 새 셰이더로 다시 만든다 */
if(gl){ try{ gl=createDepthGPU(); m3Resize(); }catch(e){ console.error('그래픽 재초기화 실패',e); } }
/* ④ 적응 해상도 : 해상도 배율은 빌드 패치로 dpr 계산에 곱해진다 (GFX.q) */
const _draw=m3Draw;
m3Draw=function(){ if(window.ROOM_ACTIVE!==false) gfxAdapt(performance.now()); return _draw.apply(this,arguments); };
})();
