/* ═══════════════════════════════════════════════════════════════════
   통합라인 그래픽 보강 (두 엔진 공용) — 원본 IDT 의 셰이더 조각(PX_HEAD · PX_LIGHT)을 그대로 쓰고 덧붙인다
   ① 재질 : 스튜디오 조명 반사 환경(천장 조명 띠 · 수평선 반짝임), 스테인리스 헤어라인(결),
            도장면 미세 요철 + 클리어코트 하이라이트, 금속 하이라이트에 고유색
   ② 주변광 차폐(SSAO) : 반해상도 깊이 패스 → 오목한 곳(모서리 · 접합부 · 바닥 접지부)만 어둡게
   ④ 적응 해상도 : 프레임 간격이 길면 렌더 해상도를 단계적으로 낮추고, 여유가 생기면 되돌린다
   ═══════════════════════════════════════════════════════════════════ */
const GFX={on:true, ao:true, q:1, fps:60, aoStr:0.6};
/* ── ① 재질 (PX_LIGHT 뒤에 붙는다 : shadowAt · lin · envAt · 조명 uniform 사용) ── */
const GFX_MAT=`
uniform float uDet;
float gHash(vec3 p){p=fract(p*0.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float gNoise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);
 return mix(mix(mix(gHash(i),gHash(i+vec3(1.0,0.0,0.0)),f.x),mix(gHash(i+vec3(0.0,1.0,0.0)),gHash(i+vec3(1.0,1.0,0.0)),f.x),f.y),
            mix(mix(gHash(i+vec3(0.0,0.0,1.0)),gHash(i+vec3(1.0,0.0,1.0)),f.x),mix(gHash(i+vec3(0.0,1.0,1.0)),gHash(i+vec3(1.0,1.0,1.0)),f.x),f.y),f.z);}
/* 작업장 반사 환경 : 바닥(어두움) → 벽(밝음) → 천장, 천장 매입 조명 띠, 수평선 반짝임 */
vec3 gStudio(vec3 R){
 float t=R.y;
 vec3 c=mix(vec3(0.36,0.37,0.39),vec3(0.84,0.855,0.87),smoothstep(-0.30,0.18,t));
 c=mix(c,vec3(0.95,0.955,0.96),smoothstep(0.25,0.80,t));
 c+=vec3(0.10)*exp(-abs(t)*16.0);
 if(t>0.10){ float q=R.z/t+R.x/t*0.15; float s=abs(fract(q*0.40+0.5)-0.5);
   float band=smoothstep(0.12,0.05,s)*smoothstep(0.10,0.45,t); c=mix(c,vec3(1.0),band*0.85); }
 return c;}
vec3 pxShade2(vec3 alb,float met,vec3 P,vec3 N,float br){
 vec3 Vv=uEye-P;float vl=length(Vv);vec3 V=Vv/max(vl,1e-4);
 if(dot(N,V)<0.0)N=-N;                                   /* 양면 : 카메라와 무관한 형상 재사용이 가능하다 */
 float det=clamp(1.35-vl/uDet,0.0,1.0);                  /* 멀면 미세 결을 지운다 (자글거림 방지) */
 float g=0.5;
 if(met>0.45){                                           /* 스테인리스 · 알루미늄 : 수평 헤어라인 */
  vec3 T=abs(N.y)<0.85?normalize(cross(N,vec3(0.0,1.0,0.0))):vec3(1.0,0.0,0.0); vec3 B=cross(N,T);
  g=gNoise(vec3(dot(P,T)*0.045,dot(P,B)*1.9,0.0))*0.65+gNoise(vec3(dot(P,T)*0.11,dot(P,B)*4.6,7.0))*0.35;
  alb*=1.0+(g-0.5)*0.13*det;
 } else { g=gNoise(P*0.55); alb*=1.0+(g-0.5)*0.035*det; }  /* 도장면 미세 요철 */
 float sh=shadowAt(P,N);
 float d=max(dot(N,uL1),0.0)*sh,d2=max(dot(N,uL2),0.0),d3=max(dot(N,uL3),0.0);
 float nv=max(dot(N,V),0.0);float q=1.0-nv;q*=q;float fr=q*q;
 float nh=max(dot(N,normalize(uL1+V)),0.0);
 float shin=met>0.45?mix(26.0,72.0,g):mix(16.0,24.0,g);
 float sp=pow(nh,shin)*(0.26+0.74*met)*sh;
 if(met<=0.45) sp+=pow(nh,110.0)*0.16*sh;                /* 도장 클리어코트 */
 float ao=0.66+0.34*clamp((P.y-uAO.x)/uAO.y,0.0,1.0);ao*=1.0-0.13*max(0.0,1.0-abs(P.z)*uAO.z);
 float diff=(mix(0.12,0.27,N.y*0.5+0.5)+1.18*d+0.17*d2+0.25*d3)*ao;
 float kEnv=(0.08+0.60*met+0.45*fr*met)*(0.58+0.42*ao);
 vec3 tint=alb/max(0.001,max(alb.r,max(alb.g,alb.b)));
 vec3 env=mix(envAt(N.y),gStudio(reflect(-V,N))*mix(vec3(1.0),tint,0.35),met);
 vec3 c=lin(alb)*diff*(1.0-kEnv*0.55)+lin(env)*kEnv+sp*mix(vec3(1.0),lin(tint),met*0.45);
 float w=(d-0.42)*0.05;c*=vec3(1.0+w,1.0,1.0-w*0.7);
 c=(c+fr*fr*(0.03+0.10*met))*br*uExpo;
 float m=max(max(c.r,c.g),c.b);if(m>0.75)c*=(1.0-0.25*exp((0.75-m)*4.0))/m;
 c=pow(c,vec3(1.0/2.2));
 float fg=vl>1100.0?min(0.10,(vl-1100.0)*0.00016):0.0;
 return mix(c,vec3(0.965,0.976,0.996),fg);}
`;
/* ── ② 주변광 차폐 ── */
const GFX_DEPTH_FS=PX_HEAD+'uniform float uFar;varying float vD;void main(){float z=clamp(vD/uFar,0.0,0.99999);'+
 'vec4 e=fract(z*vec4(1.0,255.0,65025.0,16581375.0));gl_FragColor=e-e.yzww*vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);}';
const GFX_QUAD_VS='attribute vec2 q;varying vec2 vUV;void main(){vUV=q*0.5+0.5;gl_Position=vec4(q,0.0,1.0);}';
/* 오목도(crease) 방식 : 화면에서 마주 보는 두 점의 평균보다 가운데가 깊으면 오목 → 가림.
   평면은 원근 깊이가 볼록 함수라 스스로 가리지 않고, 깊이 차가 큰 실루엣은 범위 검사로 제외 */
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
/* 적용 : 검은색을 (1−AO) 만큼 덮는다 → 형상은 어두워지고, 비어 있는 곳(2D 바닥)에도 접지 그늘이 생긴다 */
const GFX_APPLY_FS=PX_HEAD+`uniform sampler2D uA;uniform vec2 uPx;varying vec2 vUV;
void main(){float a=0.0;vec2 o=uPx*1.5;
 for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++){float w=(i==0&&j==0)?0.2:((i==0||j==0)?0.125:0.075);a+=texture2D(uA,vUV+vec2(float(i),float(j))*o).r*w;}
 float s=clamp(1.0-a,0.0,1.0);gl_FragColor=vec4(0.0,0.0,0.0,s);}`;
function gfxTarget(gl,w,h,linear,depth){
  const tex=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  const f=linear?gl.LINEAR:gl.NEAREST;
  for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,f],[gl.TEXTURE_MAG_FILTER,f],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D,k,v);
  const fb=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);
  let rb=null;
  if(depth){ rb=gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER,rb); gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rb); }
  const ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  return {tex,fb,rb,w,h,ok,free(){ gl.deleteTexture(tex); gl.deleteFramebuffer(fb); if(rb) gl.deleteRenderbuffer(rb); }};
}
/* AO 자원 : 반해상도 깊이 대상 · AO 대상 · 전체 화면 사각형 · 프로그램 */
function gfxAOInit(gl,depthVS,depthAttrs){
  const P={
    depth:pxProgram(gl,depthVS,GFX_DEPTH_FS,depthAttrs),
    ao:pxProgram(gl,GFX_QUAD_VS,GFX_AO_FS,['q']),
    apply:pxProgram(gl,GFX_QUAD_VS,GFX_APPLY_FS,['q']),
    quad:gl.createBuffer(), D:null, A:null
  };
  gl.bindBuffer(gl.ARRAY_BUFFER,P.quad); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]),gl.STATIC_DRAW);
  return P;
}
function gfxAOSize(gl,P,w,h){
  const aw=Math.max(16,Math.round(w/2)), ah=Math.max(16,Math.round(h/2));
  if(P.D&&P.D.w===aw&&P.D.h===ah) return P.D.ok&&P.A.ok;
  if(P.D){ P.D.free(); P.A.free(); }
  P.D=gfxTarget(gl,aw,ah,false,true); P.A=gfxTarget(gl,aw,ah,true,false);
  return P.D.ok&&P.A.ok;
}
function gfxQuad(gl,P,prog){ gl.useProgram(prog.p); gl.bindBuffer(gl.ARRAY_BUFFER,P.quad);
  for(let i=1;i<6;i++) gl.disableVertexAttribArray(i);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0); gl.drawArrays(gl.TRIANGLES,0,6); }
/* AO 계산 + 적용 (깊이 패스는 엔진별로 그린 뒤 호출) — 기본 프레임버퍼에 덮는다 */
function gfxAOResolve(gl,P,w,h,far,R,foc){
  gl.bindFramebuffer(gl.FRAMEBUFFER,P.A.fb); gl.viewport(0,0,P.A.w,P.A.h);
  gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthMask(false);
  gl.useProgram(P.ao.p); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,P.D.tex);
  gl.uniform1i(P.ao.u('uD'),1); gl.uniform2f(P.ao.u('uPx'),1/P.D.w,1/P.D.h);
  gl.uniform1f(P.ao.u('uFar'),far); gl.uniform1f(P.ao.u('uR'),R); gl.uniform1f(P.ao.u('uFoc'),foc); gl.uniform1f(P.ao.u('uStr'),GFX.aoStr);
  gfxQuad(gl,P,P.ao);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,w,h);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  gl.useProgram(P.apply.p); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,P.A.tex);
  gl.uniform1i(P.apply.u('uA'),1); gl.uniform2f(P.apply.u('uPx'),1/P.A.w,1/P.A.h);
  gfxQuad(gl,P,P.apply);
  gl.activeTexture(gl.TEXTURE0);
  gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.disable(gl.BLEND);
}
/* ── ④ 적응 해상도 : 실제 프레임 간격(EMA)으로 판단 ── */
const GFX_ADAPT={ema:16, t:0, last:0};
function gfxAdapt(now){
  const A=GFX_ADAPT; if(A.last&&now-A.last<500){ const dt=now-A.last; A.ema+=(dt-A.ema)*0.08; } A.last=now;   /* 다른 방에 있다 돌아온 첫 프레임은 제외 */
  A.t+=1; if(A.t<45) return false; A.t=0;
  let q=GFX.q;
  if(A.ema>42&&q>0.6) q=Math.max(0.6,+(q-0.1).toFixed(2));
  else if(A.ema<21&&q<1) q=Math.min(1,+(q+0.1).toFixed(2));
  GFX.fps=Math.round(1000/A.ema);
  if(A.ema>45&&GFX.q<=0.6&&GFX.ao){ GFX.ao=false; GFX.aoAuto=true; }   /* 최저 해상도에서도 느리면 AO 를 끈다 */
  if(q!==GFX.q){ GFX.q=q; return true; }
  return false;
}
window.GFX=GFX;
