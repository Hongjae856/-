/* ═══════════════════════════════════════════════════════════════════
   파우치 표현 방식 공통 (11/20 사용자 지시 "병 · PTP 도 파우치 라인의 금속 재질 등 디자인 코드를 참조 —
   형태는 기존에 구축한 것을 유지하고, 표현하는 방법은 파우치를 따라")
   · PTP · 병 셸은 앱이 만든 정점색 형상을 그대로 받아 그림 → 면마다 파우치 재질 값(pouch/v2/src/kit.js M)으로 표현
       스테인리스(금속도 높음)   = M.ss  : 색 d2d6d9 · 금속 1 · 거칠기 .24 × 헤어라인 결(TX.hair) · 반사 1.7
       어두운 스테인리스        = M.ssD : 색 b6bbbf · 거칠기 .40 × 결 · 반사 1.5
       알루미늄(중간 금속도)     = M.alu : 색 d8dbde · 금속 .9 · 거칠기 .45 · 반사 1.5
       도장 · 수지              = 원래 색 · 거칠기 .5 (회색 .55) / 검정 · 짙은 회색 = M.black · M.dark (금속 .1~.2)
       바닥(방 형상)            = M.floor : 색 c6cdbf × 바닥 무늬(TX.floor) · 거칠기 .14 · 반사 .85 / 벽 = M.wall 반사 .35
       투명(아크릴 · 유리)       = 거칠기 .04 · 금속 0
   · 조명 · 반사 · 후처리 = 파우치 bridge.js · room.js 와 같은 값 : 반구광 .22 · 주광 .95(위에서) · 천장 점광 .22,
     실제 장면을 찍은 반사(셸 EnvCapture), 틈 음영(SSAO 반해상도) → ACES(노출 .62) → 대비 .42 → sRGB
   ═══════════════════════════════════════════════════════════════════ */
/* 재질 분류 조각 : met = 0~1 금속도 식(GLSL, 음수 = 발광 · 그대로), room = 방 형상(바닥 · 벽), tr = 투명 */
function idtLookFrag(sh,o){
  sh.uniforms.tHair={value:TX.hair}; sh.uniforms.tFloor={value:TX.floor};
  const room=o.room?`
    if(an.y>0.9&&vWP.y<0.006){ diffuseColor.rgb=vec3(.565,.610,.521)*texture2D(tFloor,vWP.xz/1.97).rgb; metalnessFactor=0.0; roughnessFactor=0.14; eMI=0.85; }
    else if(an.y<0.2&&mIn<0.25){ roughnessFactor=0.6; eMI=0.35; }`:"";
  const tr=o.tr?`
    roughnessFactor=0.04; metalnessFactor=0.0; eMI=1.0; if(Lo>0.25){ diffuseColor.rgb=vec3(.905,.939,1.0); diffuseColor.a=min(diffuseColor.a,0.16); eMI=0.4; }`:"";   /* 밝은 투명면(아크릴 · 유리 덮개) = 파우치 M.acryl (f4f8ff · 불투명도 .2) · 어두운 · 짙은 색 투명은 그대로 */
  const chunk=`
  float mIn=${o.met};
  vec3 wn=normalize(cross(dFdx(vWP),dFdy(vWP))), an=abs(wn);
  vec2 tuv=(an.x>an.y&&an.x>an.z)?vWP.zy:((an.y>an.z)?vWP.xz:vWP.xy);
  float Lo=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
  float metalnessFactor=0.0, roughnessFactor=0.5;
  if(mIn>0.6){ float h=texture2D(tHair,tuv*2.5).g; bool lite=Lo>0.30;
    diffuseColor.rgb=(lite?vec3(.645,.672,.694):vec3(.468,.497,.521))*clamp(Lo/(lite?0.62:0.45),0.35,1.0); metalnessFactor=1.0; roughnessFactor=(lite?0.24:0.40)*h; eMI=lite?1.7:1.5; }   /* 앱이 넣은 밝기(음영)는 유지 */
  else if(mIn>0.25){ diffuseColor.rgb=vec3(.686,.708,.730)*clamp(Lo/0.62,0.35,1.0); metalnessFactor=0.9; roughnessFactor=0.45; eMI=1.5; }
  else if(mIn>=0.0){ metalnessFactor=Lo<0.012?0.1:(Lo<0.04?0.2:0.0); roughnessFactor=Lo<0.012?0.6:((Lo>0.04&&Lo<0.35&&abs(diffuseColor.r-diffuseColor.b)<0.04)?0.55:0.5); eMI=1.0; }${room}${tr}
  roughnessFactor=max(roughnessFactor,0.035);`;
  sh.fragmentShader=sh.fragmentShader
    .replace("#include <common>","#include <common>\nuniform sampler2D tHair; uniform sampler2D tFloor; float eMI=1.0;")
    .replace("#include <envmap_physical_pars_fragment>",T3.ShaderChunk.envmap_physical_pars_fragment.split("envMapIntensity").join("(envMapIntensity*eMI)"))
    .replace("#include <roughnessmap_fragment>",chunk)
    .replace("#include <metalnessmap_fragment>","");
}
/* 조명 : 파우치 room.js (반구광 .22 · 주광 .95 · 천장 점광 .22) — 긴 방은 점광을 5.5 m 마다 */
function idtLookLights(sc,o){
  sc.background=new T3.Color(0xdfe4e1);
  sc.add(new T3.HemisphereLight(0xf4f7ff,0x8a8e86,.22));
  const key=new T3.DirectionalLight(0xffffff,.95); key.position.set(o.cx-1.2,o.H+3,o.cz+2.5); key.target.position.set(o.cx,0,o.cz); key.castShadow=true; key.shadow.mapSize.set(4096,4096);
  Object.assign(key.shadow.camera,{left:-o.W/2-1,right:o.W/2+1,top:o.D/2+3,bottom:-o.D/2-3,near:.5,far:o.H+12}); key.shadow.bias=-.0004; key.shadow.normalBias=.015; sc.add(key); sc.add(key.target);
  for(let x=o.x0+2.2;x<o.x1-1;x+=5.5){ const p=new T3.PointLight(0xfff8ee,.22,9,1.6); p.position.set(x,o.H-.3,o.cz); sc.add(p); }
  return key;
}
/* 후처리 : 파우치 bridge.js v3Post 와 같음 (틈 · 모서리 음영 반해상도 → ACES 노출 .62 + 대비 .42 + sRGB) */
function idtLookPost(){
  const P={rt:null, ao:null, w:0, h:0, cam:new T3.OrthographicCamera(-1,1,1,-1,0,1), scn:new T3.Scene(), scnA:new T3.Scene(), v2:new T3.Vector2()};
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
function idtLookSize(P,w,h){
  if(P.w===w&&P.h===h&&P.rt) return; P.w=w; P.h=h;
  if(P.rt){ P.rt.dispose(); P.ao.dispose(); }
  P.rt=new T3.WebGLRenderTarget(w,h,{type:T3.HalfFloatType,samples:4}); P.rt.depthTexture=new T3.DepthTexture(w,h); P.rt.depthTexture.type=T3.UnsignedIntType;
  const ax=Math.ceil(w/2), ay=Math.ceil(h/2); P.ao=new T3.WebGLRenderTarget(ax,ay,{minFilter:T3.LinearFilter,magFilter:T3.LinearFilter,depthBuffer:false});
  P.matA.uniforms.res.value.set(ax,ay); P.mat.uniforms.resA.value.set(ax,ay);
}
/* 그리기 : 장면 → (틈 음영) → 톤 · 대비 → 화면 — 그래픽 '하' 는 틈 음영 끔 (세 IDT 공통 IDT_GQ_L.ao) */
function idtLookDraw(R,P,sc,cam,ao){
  R.getDrawingBufferSize(P.v2); idtLookSize(P,Math.max(2,P.v2.x),Math.max(2,P.v2.y));
  R.toneMapping=T3.NoToneMapping; R.outputEncoding=T3.LinearEncoding;
  R.setRenderTarget(P.rt); R.clear(); R.render(sc,cam);
  P.mat.uniforms.ao.value=ao?1:0;
  if(ao){ P.matA.uniforms.tD.value=P.rt.depthTexture; P.matA.uniforms.nf.value.set(cam.near,cam.far); R.setRenderTarget(P.ao); R.render(P.scnA,P.cam); }
  P.mat.uniforms.tC.value=P.rt.texture; P.mat.uniforms.tA.value=P.ao.texture;
  R.setRenderTarget(null); R.render(P.scn,P.cam);
}
