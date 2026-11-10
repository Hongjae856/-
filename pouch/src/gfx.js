/* ═══════════════════════════════════════════════════════════════════
   그래픽 보강 — 주변광 차폐(SSAO) · 적응 해상도 (PTP 통합라인 V2 와 같은 방식, 단위 mm)
   · 반해상도 깊이 패스 → 오목도(crease) 판정 → 검은색을 (1−AO) 만큼 덮어 모서리 · 접합부 · 바닥 접지부를 어둡게
   · 평면은 원근 깊이가 볼록 함수라 스스로 가리지 않고, 깊이 차가 큰 실루엣은 범위 검사로 제외한다
   · 프레임 간격이 길면 렌더 해상도를 0.6 배까지 낮추고, 그래도 느리면 AO 를 끈다
   ═══════════════════════════════════════════════════════════════════ */
const GFX={ao:true, q:1, fps:60, aoStr:0.6, far:90000, R:70};
const GFX_DEPTH_VS="attribute vec3 p;uniform mat4 mvp;varying float vD;void main(){gl_Position=mvp*vec4(p,1.0);vD=gl_Position.w;}";
const GFX_DEPTH_FS=PX_HEAD+'uniform float uFar;varying float vD;void main(){float z=clamp(vD/uFar,0.0,0.99999);'+
 'vec4 e=fract(z*vec4(1.0,255.0,65025.0,16581375.0));gl_FragColor=e-e.yzww*vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);}';
const GFX_QUAD_VS='attribute vec2 q;varying vec2 vUV;void main(){vUV=q*0.5+0.5;gl_Position=vec4(q,0.0,1.0);}';
const GFX_AO_FS=PX_HEAD+`uniform sampler2D uD;uniform vec2 uPx;uniform float uFar,uR,uFoc,uStr;varying vec2 vUV;
float D(vec2 uv){return dot(texture2D(uD,uv),vec4(1.0,1.0/255.0,1.0/65025.0,1.0/16581375.0))*uFar;}
void main(){float d=D(vUV);if(d<=1.0){gl_FragColor=vec4(1.0);return;}
 float occ=0.0,ws=0.0;
 for(int i=0;i<8;i++){float a=float(i)*0.3926991+0.19635;vec2 dir=vec2(cos(a),sin(a));
  for(int j=0;j<2;j++){float rw=uR*(j==0?1.0:2.7);vec2 o=dir*min(rw*uFoc/d,40.0)*uPx;
   float s1=D(vUV+o),s2=D(vUV-o);if(s1<=1.0||s2<=1.0)continue;
   float cr=d-0.5*(s1+s2);
   float rc=1.0-smoothstep(rw*0.8,rw*1.8,max(abs(d-s1),abs(d-s2)));
   occ+=clamp(cr/(rw*0.45),0.0,1.0)*rc;ws+=1.0;}}
 float ao=1.0-uStr*occ/max(ws,1.0);gl_FragColor=vec4(ao,ao,ao,1.0);}`;
const GFX_APPLY_FS=PX_HEAD+`uniform sampler2D uA;uniform vec2 uPx;varying vec2 vUV;
void main(){float a=0.0;vec2 o=uPx*1.5;
 for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++){float w=(i==0&&j==0)?0.2:((i==0||j==0)?0.125:0.075);a+=texture2D(uA,vUV+vec2(float(i),float(j))*o).r*w;}
 float s=clamp(1.0-a,0.0,1.0);gl_FragColor=vec4(0.0,0.0,0.0,s);}`;
function gfxTarget(g,w,h,linear,depth){
  const tex=g.createTexture(); g.bindTexture(g.TEXTURE_2D,tex);
  g.texImage2D(g.TEXTURE_2D,0,g.RGBA,w,h,0,g.RGBA,g.UNSIGNED_BYTE,null);
  const f=linear?g.LINEAR:g.NEAREST;
  for(const [k,v] of [[g.TEXTURE_MIN_FILTER,f],[g.TEXTURE_MAG_FILTER,f],[g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE],[g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE]]) g.texParameteri(g.TEXTURE_2D,k,v);
  const fb=g.createFramebuffer(); g.bindFramebuffer(g.FRAMEBUFFER,fb);
  g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,tex,0);
  let rb=null;
  if(depth){ rb=g.createRenderbuffer(); g.bindRenderbuffer(g.RENDERBUFFER,rb); g.renderbufferStorage(g.RENDERBUFFER,g.DEPTH_COMPONENT16,w,h);
    g.framebufferRenderbuffer(g.FRAMEBUFFER,g.DEPTH_ATTACHMENT,g.RENDERBUFFER,rb); }
  const ok=g.checkFramebufferStatus(g.FRAMEBUFFER)===g.FRAMEBUFFER_COMPLETE;
  g.bindFramebuffer(g.FRAMEBUFFER,null);
  return {tex,fb,rb,w,h,ok,free(){ g.deleteTexture(tex); g.deleteFramebuffer(fb); if(rb) g.deleteRenderbuffer(rb); }};
}
function gfxAOInit(g){
  const P={ depth:pxProgram(g,GFX_DEPTH_VS,GFX_DEPTH_FS,["p"]), ao:pxProgram(g,GFX_QUAD_VS,GFX_AO_FS,["q"]),
    apply:pxProgram(g,GFX_QUAD_VS,GFX_APPLY_FS,["q"]), quad:g.createBuffer(), D:null, A:null };
  g.bindBuffer(g.ARRAY_BUFFER,P.quad); g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]),g.STATIC_DRAW);
  return P;
}
function gfxAOSize(g,P,w,h){
  const aw=Math.max(16,Math.round(w/2)), ah=Math.max(16,Math.round(h/2));
  if(P.D&&P.D.w===aw&&P.D.h===ah) return P.D.ok&&P.A.ok;
  if(P.D){ P.D.free(); P.A.free(); }
  P.D=gfxTarget(g,aw,ah,false,true); P.A=gfxTarget(g,aw,ah,true,false);
  return P.D.ok&&P.A.ok;
}
/* 깊이 패스 : draw() 안에서 위치 속성(0)만 연결해 그린다 */
function gfxAODepth(g,P,draw){
  g.bindFramebuffer(g.FRAMEBUFFER,P.D.fb); g.viewport(0,0,P.D.w,P.D.h);
  g.clearColor(0,0,0,0); g.clearDepth(1); g.depthMask(true); g.disable(g.BLEND); g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);
  g.useProgram(P.depth.p); g.uniformMatrix4fv(P.depth.u("mvp"),false,R3.mvp); g.uniform1f(P.depth.u("uFar"),GFX.far);
  draw();
  g.bindFramebuffer(g.FRAMEBUFFER,null);
}
function gfxQuad(g,P,prog){ g.useProgram(prog.p); g.bindBuffer(g.ARRAY_BUFFER,P.quad);
  for(let i=1;i<4;i++) g.disableVertexAttribArray(i);
  g.enableVertexAttribArray(0); g.vertexAttribPointer(0,2,g.FLOAT,false,0,0); g.drawArrays(g.TRIANGLES,0,6); }
function gfxAOResolve(g,P,w,h){
  g.bindFramebuffer(g.FRAMEBUFFER,P.A.fb); g.viewport(0,0,P.A.w,P.A.h);
  g.disable(g.DEPTH_TEST); g.disable(g.BLEND); g.depthMask(false);
  g.useProgram(P.ao.p); g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D,P.D.tex);
  g.uniform1i(P.ao.u("uD"),1); g.uniform2f(P.ao.u("uPx"),1/P.D.w,1/P.D.h);
  g.uniform1f(P.ao.u("uFar"),GFX.far); g.uniform1f(P.ao.u("uR"),GFX.R); g.uniform1f(P.ao.u("uFoc"),P.D.h/2/Math.tan(0.31)); g.uniform1f(P.ao.u("uStr"),GFX.aoStr);
  gfxQuad(g,P,P.ao);
  g.bindFramebuffer(g.FRAMEBUFFER,null); g.viewport(0,0,w,h);
  g.enable(g.BLEND); g.blendFunc(g.ONE,g.ONE_MINUS_SRC_ALPHA);
  g.useProgram(P.apply.p); g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D,P.A.tex);
  g.uniform1i(P.apply.u("uA"),1); g.uniform2f(P.apply.u("uPx"),1/P.A.w,1/P.A.h);
  gfxQuad(g,P,P.apply);
  g.activeTexture(g.TEXTURE0);
  g.enable(g.DEPTH_TEST); g.depthMask(true); g.disable(g.BLEND);
}
/* 적응 해상도 : 실제 프레임 간격(EMA) */
const GFX_ADAPT={ema:16, t:0, last:0};
function gfxAdapt(now){
  const A=GFX_ADAPT; if(A.last&&now-A.last<500){ const dt=now-A.last; A.ema+=(dt-A.ema)*0.08; } A.last=now;
  if(++A.t<45) return; A.t=0;
  let q=GFX.q;
  if(A.ema>42&&q>0.6) q=Math.max(0.6,+(q-0.1).toFixed(2));
  else if(A.ema<21&&q<1) q=Math.min(1,+(q+0.1).toFixed(2));
  GFX.fps=Math.round(1000/A.ema);
  if(A.ema>45&&q<=0.6&&GFX.ao){ GFX.ao=false; GFX.aoAuto=true; }
  GFX.q=q;
}
