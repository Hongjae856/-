/* ═══════════════════════════════════════════════════════════════════
   단일 화면 통합 렌더러 (두 앱 공용) — 충전실 · 포장실 설비를 한 장면으로 그린다
   · 공용 좌표 : mm (x = 칸막이 벽 중심 0, +x 포장실 · y = 바닥 0 · z = 앞쪽 +)
   · 화면에 보이는 앱(활성)이 매 프레임 자기 형상 + 다른 앱 형상(그 앱에 생성 요청) + 방 형상(mm)을
     한 깊이 버퍼에 그린다. 각 앱 형상은 자기 단위 그대로 넘기고 모델 행렬(단위 → mm)로 옮긴다.
   · 카메라는 셸의 UNI_HUB.cam(mm, 궤도형)으로 공유 → 화면 전환 시 시점이 그대로 이어진다.
   · 장비 하나를 선택한 시점에서는 다른 방을 간략 모델(옅은 톤)로 바꿔 그린다 (매 프레임 다시 만들므로 즉시 전환).
   ═══════════════════════════════════════════════════════════════════ */
(function(){
if(!RB) return;
const SIDE=window.UNI_SIDE, HUB=window.parent.UNI_HUB;
if(!HUB) return;
const BL=RB.L;
/* ── 단위 ↔ mm ── */
const XF=x=>4*x-3680, YF=y=>4*y+1128, ZF=z=>4*z+BL.fillerZ;          /* 충전기 (≈4 mm, 바닥 −282, 벽 X 920) */
const XL=x=>5*x+8000, YL=y=>5*y, ZL=z=>5*z;                            /* 포장라인 (≈5 mm, 벽 X −1600) */
const M_F=new Float32Array([4,0,0,0, 0,4,0,0, 0,0,4,0, -3680,1128,BL.fillerZ,1]);
const M_L=new Float32Array([5,0,0,0, 0,5,0,0, 0,0,5,0, 8000,0,0,1]);
const M_I=new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
const TO_UNITS={
  filler:c=>({yaw:c.yaw,pitch:c.pitch,dist:c.dist/4,tx:(c.tx+3680)/4,ty:(c.ty-1128)/4,tz:(c.tz-BL.fillerZ)/4}),
  line:c=>({yaw:c.yaw,pitch:c.pitch,dist:c.dist/5,tx:(c.tx-8000)/5,ty:c.ty/5,tz:c.tz/5})
};
const FOVY=0.62, NEAR=90, FAR=70000;

/* ═══ 1. 셰이더 (mm) ═══ */
const MAT_MM=`
uniform float uDet;
float gHash(vec3 p){p=fract(p*0.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float gNoise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);
 return mix(mix(mix(gHash(i),gHash(i+vec3(1.0,0.0,0.0)),f.x),mix(gHash(i+vec3(0.0,1.0,0.0)),gHash(i+vec3(1.0,1.0,0.0)),f.x),f.y),
            mix(mix(gHash(i+vec3(0.0,0.0,1.0)),gHash(i+vec3(1.0,0.0,1.0)),f.x),mix(gHash(i+vec3(0.0,1.0,1.0)),gHash(i+vec3(1.0,1.0,1.0)),f.x),f.y),f.z);}
vec3 gStudio(vec3 R){
 float t=R.y;
 vec3 c=mix(vec3(0.36,0.37,0.39),vec3(0.84,0.855,0.87),smoothstep(-0.30,0.18,t));
 c=mix(c,vec3(0.95,0.955,0.96),smoothstep(0.25,0.80,t));
 c+=vec3(0.10)*exp(-abs(t)*16.0);
 if(t>0.10){ float q=R.z/t+R.x/t*0.15; float s=abs(fract(q*0.40+0.5)-0.5);
   float band=smoothstep(0.12,0.05,s)*smoothstep(0.10,0.45,t); c=mix(c,vec3(1.0),band*0.85); }
 return c;}
/* 포장라인 형상은 면마다 금속도가 없으므로 색으로 구분 : 저채도 밝은 회색 = 스테인리스 · 알루미늄 */
float lMet(vec3 c){float mx=max(c.r,max(c.g,c.b)),mn=min(c.r,min(c.g,c.b)),L=(mx+mn)*0.5;
 if(mx-mn<0.07&&L>0.52&&L<0.935)return 0.72;if(L<0.30)return 0.16;return 0.12;}
vec3 pxShadeMM(vec3 alb,float met,vec3 P,vec3 N,float br){
 vec3 Vv=uEye-P;float vl=length(Vv);vec3 V=Vv/max(vl,1e-4);
 if(dot(N,V)<0.0)N=-N;
 float det=clamp(1.35-vl/uDet,0.0,1.0);
 float g=0.5;
 if(met>0.45){
  vec3 T=abs(N.y)<0.85?normalize(cross(N,vec3(0.0,1.0,0.0))):vec3(1.0,0.0,0.0); vec3 B=cross(N,T);
  g=gNoise(vec3(dot(P,T)*0.011,dot(P,B)*0.48,0.0))*0.65+gNoise(vec3(dot(P,T)*0.028,dot(P,B)*1.15,7.0))*0.35;
  alb*=1.0+(g-0.5)*0.13*det;
 } else { g=gNoise(P*0.14); alb*=1.0+(g-0.5)*0.035*det; }
 float sh=shadowAt(P,N);
 float d=max(dot(N,uL1),0.0)*sh,d2=max(dot(N,uL2),0.0),d3=max(dot(N,uL3),0.0);
 float nv=max(dot(N,V),0.0);float q=1.0-nv;q*=q;float fr=q*q;
 float nh=max(dot(N,normalize(uL1+V)),0.0);
 float shin=met>0.45?mix(26.0,72.0,g):mix(16.0,24.0,g);
 float sp=pow(nh,shin)*(0.26+0.74*met)*sh;
 if(met<=0.45) sp+=pow(nh,110.0)*0.16*sh;
 float ao=0.66+0.34*clamp(P.y/uAO.y,0.0,1.0);
 float diff=(mix(0.12,0.27,N.y*0.5+0.5)+1.18*d+0.17*d2+0.25*d3)*ao;
 float kEnv=(0.08+0.60*met+0.45*fr*met)*(0.58+0.42*ao);
 vec3 tint=alb/max(0.001,max(alb.r,max(alb.g,alb.b)));
 vec3 env=mix(envAt(N.y),gStudio(reflect(-V,N))*mix(vec3(1.0),tint,0.35),met);
 vec3 c=lin(alb)*diff*(1.0-kEnv*0.55)+lin(env)*kEnv+sp*mix(vec3(1.0),lin(tint),met*0.45);
 float w=(d-0.42)*0.05;c*=vec3(1.0+w,1.0,1.0-w*0.7);
 c=(c+fr*fr*(0.03+0.10*met))*br*uExpo;
 float m=max(max(c.r,c.g),c.b);if(m>0.75)c*=(1.0-0.25*exp((0.75-m)*4.0))/m;
 c=pow(c,vec3(1.0/2.2));
 float fg=vl>uAO.z?min(0.10,(vl-uAO.z)*0.00004):0.0;
 return mix(c,vec3(0.965,0.976,0.996),fg);}
`;
const VS_MAIN='attribute vec3 a_p;attribute vec3 a_n;attribute vec4 a_c;attribute vec4 a_m;attribute vec2 a_uv;uniform mat4 uMVP,uModel;'+
 'varying vec3 vW;varying vec3 vN;varying vec4 vC;varying vec4 vM;varying vec2 vUV;'+
 'void main(){vec4 w=uModel*vec4(a_p,1.0);vW=w.xyz;vN=a_n;vC=a_c;vM=a_m;vUV=a_uv;gl_Position=uMVP*w;}';
const FS_MAIN=PX_HEAD+PX_LIGHT+MAT_MM+'varying vec3 vW;varying vec3 vN;varying vec4 vC;varying vec4 vM;varying vec2 vUV;uniform vec3 u_ink;'+
 'void main(){vec3 c=vC.rgb;float met=vM.x<-0.5?lMet(c):vM.x;float ink=0.0;'+
 'if(vM.w>0.5){float p=fract((vUV.x+vUV.y)/18.0);float stripe=smoothstep(0.02,0.06,p)*(1.0-smoothstep(0.48,0.52,p));c*=mix(vec3(1.0),u_ink*0.85,stripe);ink=stripe;}'+
 'if(vM.z<0.5){c=pxShadeMM(c,met*(1.0-ink),vW,normalize(vN),pow(max(vM.y,0.05),2.2));if(ink>0.0){float l=dot(c,vec3(0.299,0.587,0.114));c=clamp(mix(vec3(l),c,1.0+0.9*ink),0.0,1.0);}}'+
 'gl_FragColor=vec4(c*vC.a,vC.a);}';
const VS_DEPTH='attribute vec3 a_p;uniform mat4 uMVP,uModel;varying float vD;void main(){gl_Position=uMVP*(uModel*vec4(a_p,1.0));vD=gl_Position.w;}';
const VS_SM='attribute vec3 a_p;uniform mat4 uLMat,uModel;void main(){gl_Position=uLMat*(uModel*vec4(a_p,1.0));}';

/* ═══ 2. 행렬 ═══ */
function mul(a,b){ const o=new Float32Array(16);
  for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s;} return o; }
function persp(f,asp,n,fa){ const t=1/Math.tan(f/2); return new Float32Array([t/asp,0,0,0, 0,t,0,0, 0,0,(fa+n)/(n-fa),-1, 0,0,2*fa*n/(n-fa),0]); }
function lookAt(e,c){
  let zx=e[0]-c[0],zy=e[1]-c[1],zz=e[2]-c[2]; let l=Math.hypot(zx,zy,zz)||1; zx/=l;zy/=l;zz/=l;
  let xx=zz, xy=0, xz=-zx; l=Math.hypot(xx,xz)||1; xx/=l; xz/=l;           /* up = +y */
  const yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
  return new Float32Array([xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0,
    -(xx*e[0]+xy*e[1]+xz*e[2]),-(yx*e[0]+yy*e[1]+yz*e[2]),-(zx*e[0]+zy*e[1]+zz*e[2]),1]); }
/* 궤도 카메라(mm) → 눈 위치 */
function eyeOf(c){ const cp=Math.cos(c.pitch), sp=Math.sin(c.pitch);
  return [c.tx+c.dist*cp*Math.sin(c.yaw), c.ty+c.dist*sp, c.tz+c.dist*cp*Math.cos(c.yaw)]; }

/* ═══ 3. 방 형상 (mm) : 바닥 · 벽 · 칸막이(창문 · 개구부) · 연결 컨베이어 · 배선 트레이 ═══ */
const STRIDE=16;
function Mesh(){ this.o=[]; this.t=[]; }
const hexRGB=h=>{ const n=parseInt(h.slice(1),16); return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]; };
const col=c=>typeof c==='string'?hexRGB(c):c;
Mesh.prototype.tri=function(a,b,c,n,C,mt){
  const A=mt.a==null?1:mt.a, arr=A<1?this.t:this.o, m=mt.m==null?0.1:mt.m, br=mt.br||1, fl=mt.fl?1:0, pat=mt.pat?1:0;
  for(const p of [a,b,c]){ const uv=mt.pat?mt.pat(p):[0,0]; arr.push(p[0],p[1],p[2],n[0],n[1],n[2],C[0],C[1],C[2],A,m,br,fl,pat,uv[0],uv[1]); }
};
Mesh.prototype.quad=function(a,b,c,d,cc,mt){ mt=mt||{}; const C=col(cc);
  const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]], v=[d[0]-a[0],d[1]-a[1],d[2]-a[2]];
  let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]; const l=Math.hypot(n[0],n[1],n[2])||1; n=[n[0]/l,n[1]/l,n[2]/l];
  this.tri(a,b,c,n,C,mt); this.tri(a,c,d,n,C,mt); };
Mesh.prototype.box=function(x0,x1,y0,y1,z0,z1,cc,mt,top){
  if(x1<x0)[x0,x1]=[x1,x0]; if(y1<y0)[y0,y1]=[y1,y0]; if(z1<z0)[z0,z1]=[z1,z0];
  const P=(x,y,z)=>[x,y,z];
  this.quad(P(x0,y1,z1),P(x1,y1,z1),P(x1,y1,z0),P(x0,y1,z0),top||cc,mt);
  this.quad(P(x0,y0,z0),P(x1,y0,z0),P(x1,y0,z1),P(x0,y0,z1),cc,mt);
  this.quad(P(x0,y0,z1),P(x1,y0,z1),P(x1,y1,z1),P(x0,y1,z1),cc,mt);
  this.quad(P(x1,y0,z0),P(x0,y0,z0),P(x0,y1,z0),P(x1,y1,z0),cc,mt);
  this.quad(P(x1,y0,z1),P(x1,y0,z0),P(x1,y1,z0),P(x1,y1,z1),cc,mt);
  this.quad(P(x0,y0,z0),P(x0,y0,z1),P(x0,y1,z1),P(x0,y1,z0),cc,mt); };
/* 축 정렬 원기둥 (ax : 'x' | 'y' | 'z') */
Mesh.prototype.cyl=function(ax,c,a0,a1,r,cc,seg,mt){ seg=seg||14; mt=mt||{}; const C=col(cc);
  const pt=(t,ang)=>{ const s=Math.sin(ang)*r, k=Math.cos(ang)*r;
    return ax==='x'?[t,c[1]+s,c[2]+k]:ax==='y'?[c[0]+s,t,c[2]+k]:[c[0]+s,c[1]+k,t]; };
  const nn=ang=>{ const s=Math.sin(ang), k=Math.cos(ang); return ax==='x'?[0,s,k]:ax==='y'?[s,0,k]:[s,k,0]; };
  for(let i=0;i<seg;i++){ const A=i/seg*Math.PI*2, B=(i+1)/seg*Math.PI*2, M=(A+B)/2;
    const n=nn(M);
    this.tri(pt(a0,A),pt(a1,A),pt(a1,B),n,C,mt); this.tri(pt(a0,A),pt(a1,B),pt(a0,B),n,C,mt);
    const e0=ax==='x'?[-1,0,0]:ax==='y'?[0,-1,0]:[0,0,-1], e1=e0.map(v=>-v);
    const c0=ax==='x'?[a0,c[1],c[2]]:ax==='y'?[c[0],a0,c[2]]:[c[0],c[1],a0], c1=ax==='x'?[a1,c[1],c[2]]:ax==='y'?[c[0],a1,c[2]]:[c[0],c[1],a1];
    this.tri(c0,pt(a0,B),pt(a0,A),e0,C,mt); this.tri(c1,pt(a1,A),pt(a1,B),e1,C,mt); } };
Mesh.prototype.data=function(){ const o=new Float32Array(this.o.length+this.t.length); o.set(this.o); o.set(this.t,this.o.length);
  return {data:o, nOpq:this.o.length/STRIDE, nTot:(this.o.length+this.t.length)/STRIDE}; };

const C_={
  dFloor:'#e6edf2', gFloor:'#ebeae4', slab:'#c9d1d8', wall:'#f3f4f2', wallP:'#eef0ee', cove:'#d6dadf', trim:'#c3ccd5',
  pane:'#d7e7ef', frame:'#b9c1c8', sill:'#d9dee3', ss:'#c9ced4', belt:'#3f4854', rail:'#b2b7bd', leg:'#969ba1',
  tray:'#bcc2c8', strut:'#9ea6ae', plate:'#d2d6da', bolt:'#8c949c', dk:'#2a2f35', d:'#2e73a8', g:'#8a6d2f', line:'#e2b93b'
};
/* 칸막이 벽 : 불투명 도장 패널 + 컨베이어 개구부 + 관찰 창(이중 유리) */
const WIN={z0:700, z1:2700, y0:950, y1:2050};
function buildRoom(){
  const m=new Mesh(), fx=new Mesh(), bk=new Mesh(), X0=BL.dMinX, X1=BL.gMaxX, Zb=BL.backZ, Zf=BL.frontZ, H=BL.wallH, t=BL.wallT/2;
  /* 바닥 (두 구역 색 구분) + 앞쪽 단면 슬래브 */
  m.box(X0,-t,-80,0,Zb,Zf,C_.slab,{m:0.05},C_.dFloor);
  m.box(t,X1,-80,0,Zb,Zf,C_.slab,{m:0.05},C_.gFloor);
  m.box(-t,t,-80,0,Zb,Zf,C_.slab,{m:0.05});
  /* 뒷벽 · 코브 · 패널 이음 (카메라가 벽 바깥이면 그리지 않는다 = 단면 투시) */
  bk.box(X0,X1,0,H,Zb-120,Zb,C_.wall,{m:0.04});
  bk.quad([X0,0,Zb],[X1,0,Zb],[X1,60,Zb+60],[X0,60,Zb+60],C_.cove,{m:0.05});
  for(let x=X0+1200;x<X1;x+=1200) bk.box(x-4,x+4,60,H,Zb,Zb+3,'#e3e5e3',{m:0.05});
  /* 칸막이 벽 : 개구부 · 창 부분을 비우고 패널로 채운다 */
  const Hh=BL.hole, zs=[Zb,Hh.z0,Hh.z1,WIN.z0,WIN.z1,Zf];
  const panel=(z0,z1,y0,y1)=>{ if(z1-z0<1||y1-y0<1) return; m.box(-t,t,y0,y1,z0,z1,C_.wallP,{m:0.05}); };
  panel(Zb,Hh.z0,0,H); panel(Hh.z0,Hh.z1,0,Hh.y0); panel(Hh.z0,Hh.z1,Hh.y1,H);
  panel(Hh.z1,WIN.z0,0,H); panel(WIN.z0,WIN.z1,0,WIN.y0); panel(WIN.z0,WIN.z1,WIN.y1,H); panel(WIN.z1,Zf,0,H);
  m.box(-t-6,t+6,H-40,H,Zb,Zf,C_.trim,{m:0.2});                                   /* 상단 캡 */
  m.box(-t-8,t+8,0,90,Zb,Hh.z0,'#d3d9df',{m:0.1}); m.box(-t-8,t+8,0,90,Hh.z1,Zf,'#d3d9df',{m:0.1});   /* 걸레받이 */
  m.box(-t-6,t+6,0,H,Zf-40,Zf,C_.trim,{m:0.2});                                   /* 앞쪽 단면 기둥 */
  /* 개구부 슬리브 (스테인리스) */
  const sl=(a,b,c,d,e,f)=>m.box(a,b,c,d,e,f,C_.ss,{m:0.85});
  sl(-t-20,t+20,Hh.y0-20,Hh.y0,Hh.z0-20,Hh.z1+20); sl(-t-20,t+20,Hh.y1,Hh.y1+20,Hh.z0-20,Hh.z1+20);
  sl(-t-20,t+20,Hh.y0,Hh.y1,Hh.z0-20,Hh.z0); sl(-t-20,t+20,Hh.y0,Hh.y1,Hh.z1,Hh.z1+20);
  /* 관찰 창 : 알루미늄 프레임 · 창턱 · 중간 멀리언 · 이중 유리 */
  const fr=(a,b,c,d,e,f)=>m.box(a,b,c,d,e,f,C_.frame,{m:0.75});
  fr(-t-14,t+14,WIN.y0-40,WIN.y0,WIN.z0-40,WIN.z1+40); fr(-t-14,t+14,WIN.y1,WIN.y1+40,WIN.z0-40,WIN.z1+40);
  fr(-t-14,t+14,WIN.y0,WIN.y1,WIN.z0-40,WIN.z0); fr(-t-14,t+14,WIN.y0,WIN.y1,WIN.z1,WIN.z1+40);
  fr(-t-10,t+10,WIN.y0,WIN.y1,(WIN.z0+WIN.z1)/2-18,(WIN.z0+WIN.z1)/2+18);
  for(const s of [-1,1]) m.box(s*(t+14),s*(t+70),WIN.y0-52,WIN.y0-40,WIN.z0-60,WIN.z1+60,C_.sill,{m:0.3});   /* 창턱 (양쪽) */
  for(const x of [-t*0.55,t*0.55]) m.box(x-4,x+4,WIN.y0,WIN.y1,WIN.z0,WIN.z1,C_.pane,{a:0.16,m:0.3});
  /* 패널 이음 기둥 · 구역 표지 (양쪽) */
  for(const zm of [-1700,-500,3300]) m.box(-t-7,t+7,90,H-40,zm-12,zm+12,C_.trim,{m:0.4});
  m.box(-t-12,-t-7,1720,1900,-1200,-840,C_.d,{m:0.1}); m.box(-t-14,-t-12,1740,1880,-1180,-860,'#f2f6fa',{m:0.1});
  m.box(t+7,t+12,1720,1900,-1200,-840,C_.g,{m:0.1}); m.box(t+12,t+14,1740,1880,-1180,-860,'#f7f2e6',{m:0.1});
  /* 연결 컨베이어 · 배선 트레이 (그림자를 드리우는 설비) */
  conveyorMesh(fx);
  trayMesh(fx);
  /* [뒷벽 | 바닥 · 칸막이 | 설비 | 반투명] 순으로 붙인다 — 벽 · 바닥은 그림자 맵에서 뺀다 (천장 조명 환경) */
  const parts=[bk.o,m.o,fx.o,m.t,fx.t], o=new Float32Array(parts.reduce((a,p)=>a+p.length,0));
  let k=0; for(const p of parts){ o.set(p,k); k+=p.length; }
  const nB=bk.o.length/STRIDE, nS=m.o.length/STRIDE, nF=fx.o.length/STRIDE;
  return {data:o, nBack:nB, nShell:nB+nS, nOpq:nB+nS+nF, nTot:o.length/STRIDE};
}
/* 연결 컨베이어 : 충전기 배출 컨베이어 높이 그대로 수평 직선 → 카토너 스태커 매거진 */
function conveyorMesh(m){
  const K=RB.KEY, x0=K[0].x, x1=K[K.length-1].x, y=K[0].y, z=K[0].z, hw=BL.beltW/2;
  m.box(x0,x1,y-16,y,z-hw,z+hw,C_.belt,{m:0.25});                                       /* 벨트 */
  for(const s of [-1,1]){ const zz=z+s*(hw+9);
    m.box(x0,x1,y-30,y+14,zz-7,zz+7,C_.rail,{m:0.7});                                  /* 사이드 레일 */
    m.box(x0,x1,y-58,y-30,zz-3,zz+3,C_.rail,{m:0.7}); }                                /* 프레임 */
  m.cyl('z',[x0+16,y-14,0],z-hw-12,z+hw+12,14,'#cfd5db',14,{m:0.85});                 /* 시작 롤러 */
  /* 다리 + 앵커 (벽 · 카토너 프레임 안쪽 제외) */
  for(let x=x0+250;x<x1-150;x+=900){ if(Math.abs(x)<300||x>1830) continue;
    for(const s of [-1,1]){ const zz=z+s*(hw-6); m.box(x-9,x+9,0,y-58,zz-9,zz+9,C_.leg,{m:0.6}); }
    m.box(x-14,x+14,y-120,y-100,z-hw,z+hw,C_.leg,{m:0.6});
    m.box(x-40,x+40,0,6,z-hw-30,z+hw+30,C_.plate,{m:0.75});
    for(const s of [-1,1]) m.cyl('y',[x+s*28,0,z+s*(hw+16)],6,14,7,C_.bolt,8,{m:0.8}); }
  /* 구동부 : 감속기 · 모터 (뒤쪽) */
  { const gx=x0+1320, gy=y-60; m.box(gx-44,gx+44,gy-40,gy+40,z-hw-50,z-hw-10,'#4d5c6e',{m:0.35});
    m.cyl('z',[gx,gy,0],z-hw-50,z-hw-170,40,'#516275',16,{m:0.4}); m.cyl('z',[gx,gy,0],z-hw-170,z-hw-182,32,'#2b3036',14,{m:0.3}); }
  /* 광전 센서 2조 (투광 · 수광) */
  for(const x of [x0+1350,x1-200]){ m.box(x-12,x+12,y,y+40,z+hw+16,z+hw+40,C_.dk,{m:0.3}); m.box(x-7,x+7,y+14,y+28,z+hw+14,z+hw+16,'#d9632a',{fl:1});
    m.box(x-12,x+12,y,y+30,z-hw-30,z-hw-16,'#c94a3a',{m:0.2}); }
  /* 끝단 낙하 슈트 : 매거진 위로 */
  m.box(x1,x1+70,y-6,y,z-60,z+60,C_.rail,{m:0.7});
  /* 카토너 가드 관통부 (인입 터널) */
  { const gx=1900; m.box(gx-30,gx+30,y-70,y-58,z-hw-40,z+hw+40,C_.ss,{m:0.85}); m.box(gx-30,gx+30,y+60,y+72,z-hw-40,z+hw+40,C_.ss,{m:0.85});
    for(const s of [-1,1]) m.box(gx-30,gx+30,y-70,y+72,z+s*(hw+28),z+s*(hw+40),C_.ss,{m:0.85}); }
}
/* 배선 트레이 (높이 2450 mm · 뒤쪽) : 충전기 후면 캐비닛 → 벽 관통 → 카토너 */
function trayMesh(m){
  const y=2450, z=-1350, hw=150, x0=XF(370), x1=XL(840);
  m.box(x0,x1,y,y+6,z-hw,z+hw,C_.tray,{m:0.7});
  for(const s of [-1,1]) m.box(x0,x1,y,y+80,z+s*hw-3,z+s*hw+3,C_.tray,{m:0.7});
  for(let x=x0+100;x<x1;x+=150) m.box(x-6,x+6,y+6,y+10,z-hw+4,z+hw-4,C_.tray,{m:0.7});
  for(const x of [XF(250),XF(760),XL(-1450),XL(-950),XL(-450),XL(50),XL(450),XL(820)]){ if(Math.abs(x)<200) continue;
    m.box(x-10,x+10,0,y,z-10,z+10,C_.strut,{m:0.6}); m.box(x-12,x+12,y-20,y,z-hw-10,z+hw+10,C_.strut,{m:0.6});
    m.box(x-32,x+32,0,6,z-32,z+32,C_.plate,{m:0.75}); }
  m.box(-90,90,y-20,y+100,z-hw-20,z+hw+20,C_.ss,{m:0.8});                              /* 벽 관통 슬리브 */
  /* 충전기 · 카토너 인입 전선관 */
  m.cyl('z',[XF(440),y-6,0],z+hw,ZF(-126),12,C_.strut,10,{m:0.6});
  m.cyl('y',[XF(440),0,ZF(-126)],YF(292),y-6,12,C_.strut,10,{m:0.6});
  m.cyl('z',[XL(-800),y-6,0],z+hw,ZL(-92),12,C_.strut,10,{m:0.6});
  m.cyl('y',[XL(-800),0,ZL(-92)],YL(338),y-6,12,C_.strut,10,{m:0.6});
}
/* 연결 컨베이어 위 팩 (매 프레임) : 포일면 위 · 필름 포켓면 아래 */
function packsMesh(ink){
  const m=new Mesh(), PK=RB.PACK, K=RB.KEY, y=K[0].y, z=K[0].z;
  const film=col(ink.film), foil=col(ink.foil);
  for(const p of RB.st.packs){ if(p.s<0) continue; const a=RB.at(p.s), cx=a.x;
    m.box(cx-PK.l/2,cx+PK.l/2,y,y+PK.h*0.55,z-PK.w/2,z+PK.w/2,film,{m:0.25});
    m.box(cx-PK.l/2,cx+PK.l/2,y+PK.h*0.55,y+PK.h*0.6,z-PK.w/2,z+PK.w/2,foil,{m:0.8,pat:q=>[(q[0]-cx)*0.8,(q[2]-z)*0.8]}); }
  if(RB.st.dropT>0){ const k=1-RB.st.dropT/0.18, x=K[K.length-1].x+40, yy=y-k*70;
    m.box(x-PK.l/2,x+PK.l/2,yy,yy+PK.h*0.6,z-PK.w/2,z+PK.w/2,foil,{m:0.8}); }
  return m.data();
}

/* ═══ 4. GL 자원 (앱마다 자기 컨텍스트) ═══ */
let G=null, ROOM=null;
function glInit(){
  const cv=document.createElement('canvas');
  const gl=cv.getContext('webgl',{alpha:true,antialias:true,depth:true,premultipliedAlpha:true,preserveDrawingBuffer:false});
  if(!gl) throw Error('WebGL을 사용할 수 없습니다.');
  const A=['a_p','a_n','a_c','a_m','a_uv'];
  const g={cv,gl,
    main:pxProgram(gl,VS_MAIN,FS_MAIN,A),
    sm:pxShadowTarget(gl,2048), smP:pxProgram(gl,VS_SM,PX_SM_FS,['a_p']),
    buf:{room:gl.createBuffer(),dyn:gl.createBuffer(),f:gl.createBuffer(),fT:gl.createBuffer(),lp:gl.createBuffer(),ln:gl.createBuffer(),lc:gl.createBuffer(),
         tp:gl.createBuffer(),tn:gl.createBuffer(),tc:gl.createBuffer()},
    roomVer:-1, ao:null};
  try{ g.ao=gfxAOInit(gl,VS_DEPTH,['a_p']); }catch(e){ console.warn('AO 비활성',e); }
  cv.addEventListener('webglcontextlost',e=>{ e.preventDefault(); G=null; });
  return g;
}
/* 형상 묶음 : {kind:'i'(16f 인터리브) | 'l'(포장라인 배열), M, first, count, ...} */
function bindItem(g,it,posOnly){
  const gl=g.gl;
  if(it.kind==='i'){
    gl.bindBuffer(gl.ARRAY_BUFFER,it.buf); const S=STRIDE*4;
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,3,gl.FLOAT,false,S,0);
    if(posOnly){ for(let i=1;i<5;i++) gl.disableVertexAttribArray(i); return; }
    const p=(i,k,o)=>{ gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i,k,gl.FLOAT,false,S,o*4); };
    p(1,3,3); p(2,4,6); p(3,4,10); p(4,2,14);
  } else {
    const at=(i,b,k)=>{ gl.bindBuffer(gl.ARRAY_BUFFER,b); gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i,k,gl.FLOAT,false,0,0); };
    at(0,it.p,3);
    if(posOnly){ for(let i=1;i<5;i++) gl.disableVertexAttribArray(i); return; }
    at(1,it.n,3); at(2,it.c,4);
    gl.disableVertexAttribArray(3); gl.vertexAttrib4f(3,-1,1,0,0);
    gl.disableVertexAttribArray(4); gl.vertexAttrib2f(4,0,0);
  }
}
const F32=a=>ArrayBuffer.isView(a)?a:new Float32Array(a);
function upload(gl,b,a){ gl.bindBuffer(gl.ARRAY_BUFFER,b); gl.bufferData(gl.ARRAY_BUFFER,a,gl.DYNAMIC_DRAW); }

/* ═══ 5. 충전기 형상 내보내기 (면 목록 → 16f 삼각형, 충전기 단위) ═══ */
let FBUF=new Float32Array(STRIDE*3*40000);
function exportFiller(eye){
  const faces=M3.faces, op=[], tr=[];
  for(let i=0;i<faces.length;i++){ const f=faces[i]; if(f.v.length<3) continue; (f.a<1?tr:op).push(f); }
  if(tr.length){ for(const f of tr){ const dx=f.cx-eye[0], dy=f.cy-eye[1], dz=f.cz-eye[2]; f._d=dx*dx+dy*dy+dz*dz; } tr.sort((a,b)=>b._d-a._d); }
  let need=0; for(const f of faces) need+=Math.max(0,f.v.length-2)*3*STRIDE;
  if(FBUF.length<need) FBUF=new Float32Array(2**Math.ceil(Math.log2(need)));
  const D=FBUF; let o=0;
  const put=f=>{ const v=f.v, c=hx(f.h), r=c[0]/255, gg=c[1]/255, b=c[2]/255, a=f.a, m=f.m, br=f.br||1, fl=f.fl, pt=f.pat?1:0, fn=f.n;
    const uv=f.pat?v.map(p=>f.pat(p)):null;
    for(let i=1;i<v.length-1;i++) for(let k=0;k<3;k++){ const j=k===0?0:i+k-1, p=v[j], n=p.n||fn;
      D[o++]=p.x; D[o++]=p.y; D[o++]=p.z; D[o++]=n.x; D[o++]=n.y; D[o++]=n.z; D[o++]=r; D[o++]=gg; D[o++]=b; D[o++]=a;
      D[o++]=m; D[o++]=br; D[o++]=fl; D[o++]=pt; D[o++]=uv?uv[j][0]:0; D[o++]=uv?uv[j][1]:0; } };
  for(const f of op) put(f); const nOpq=o/STRIDE; for(const f of tr) put(f);
  return {kind:'f', data:D.subarray(0,o), nOpq, nTot:o/STRIDE};
}
/* ═══ 6. 포장라인 형상 내보내기 (삼각형 배열, 포장라인 단위) ═══ */
function exportLine(eye){
  let TPs=null,TNs=null,TCs=null;
  if(TP.length){ const n=TP.length/9, idx=new Array(n);
    for(let i=0;i<n;i++){ const o=i*9, mx=(TP[o]+TP[o+3]+TP[o+6])/3-eye[0], my=(TP[o+1]+TP[o+4]+TP[o+7])/3-eye[1], mz=(TP[o+2]+TP[o+5]+TP[o+8])/3-eye[2]; idx[i]=[i,mx*mx+my*my+mz*mz]; }
    idx.sort((a,b)=>b[1]-a[1]);
    TPs=new Float32Array(TP.length); TNs=new Float32Array(TN.length); TCs=new Float32Array(TC.length);
    idx.forEach((it,k)=>{ const s=it[0]; for(let j=0;j<9;j++){ TPs[k*9+j]=TP[s*9+j]; TNs[k*9+j]=TN[s*9+j]; } for(let j=0;j<12;j++) TCs[k*12+j]=TC[s*12+j]; }); }
  /* 형식 변환은 이 앱 안에서 (다른 창에서 일반 배열을 읽으면 훨씬 느리다) */
  return {kind:'l', P:new Float32Array(GP), N:new Float32Array(GN), C:new Float32Array(GC), TP:TPs, TN:TNs, TC:TCs};
}
/* 다른 앱이 부르는 생성 함수 : 카메라를 맞추고 형상만 만든다 (그리기 없음) */
window.UNI_GEN=function(cam){
  const u=TO_UNITS[SIDE](cam);
  window.UNI_SETCAM(u);
  window.UNI_BUILD();                                  /* 앱별 형상 생성 (filler_one / line_one) */
  const e=eyeOf(cam);
  return SIDE==='filler'?exportFiller(toUnits(e)):exportLine(toUnits(e));
};
function toUnits(e){ return SIDE==='filler'?[(e[0]+3680)/4,(e[1]-1128)/4,(e[2]-BL.fillerZ)/4]:[(e[0]-8000)/5,e[1]/5,e[2]/5]; }
window.UNI_INK=function(){ return SIDE==='filler'?{ink:hx(foilInk()).map((x,i)=>x/Math.max(1,hx(foilCol())[i])),film:filmCol(),foil:foilCol()}:null; };

/* ═══ 7. 그리기 (활성 앱) ═══ */
const STAT={};
window.UNI_PAINT=function(ctx,W,H,pxW,pxH){
  const t0=performance.now();
  const g=G||(G=glInit()), gl=g.gl;
  if(g.cv.width!==pxW||g.cv.height!==pxH){ g.cv.width=pxW; g.cv.height=pxH; }
  const cam=HUB.cam, eye=eyeOf(cam);
  /* ① 형상 모으기 */
  const own=SIDE==='filler'?exportFiller(toUnits(eye)):exportLine(toUnits(eye));
  const ow=HUB.win(SIDE==='filler'?'line':'filler');
  let other=null, reuse=false; const simple=HUB.simple();
  /* 옆방 형상 : 월드 좌표이므로 시점이 바뀌어도 그대로 쓸 수 있다 → N 프레임마다 새로 만들고 그 사이는 GPU 버퍼 재사용 */
  g.oc=(g.oc||0)+1;
  if(!simple&&ow&&ow.UNI_GEN){
    const ema=(typeof GFX_ADAPT!=='undefined'&&GFX_ADAPT.ema)||16, every=ema<25?2:ema<40?3:4; HUB.otherEvery=every;
    if(g.oItems&&g.oc<every) reuse=true;
    else { g.oc=0; try{ other=ow.UNI_GEN(cam); }catch(e){ console.error('옆방 형상 생성 실패',e); } }
  } else g.oItems=null;
  const t1=performance.now();
  const fw=HUB.win('filler'), ink=(fw&&fw.UNI_INK&&fw.UNI_INK())||{ink:[1,1,1],film:'#dfeaf0',foil:'#cfd3d8'};
  if(!ROOM||ROOM.ver!==HUB.roomVer){ ROOM=buildRoom(); ROOM.ver=HUB.roomVer; }
  const dyn=packsMesh(ink);
  /* ② 업로드 */
  const B=g.buf;
  if(g.roomVer!==ROOM.ver){ gl.bindBuffer(gl.ARRAY_BUFFER,B.room); gl.bufferData(gl.ARRAY_BUFFER,ROOM.data,gl.STATIC_DRAW); g.roomVer=ROOM.ver; }
  upload(gl,B.dyn,dyn.data);
  const items=[], trans=[];
  if(eye[2]>BL.backZ) items.push({kind:'i',buf:B.room,M:M_I,first:0,count:ROOM.nBack,tag:'room',noShadow:1});
  items.push({kind:'i',buf:B.room,M:M_I,first:ROOM.nBack,count:ROOM.nShell-ROOM.nBack,tag:'room',noShadow:1});
  items.push({kind:'i',buf:B.room,M:M_I,first:ROOM.nShell,count:ROOM.nOpq-ROOM.nShell,tag:'room'});
  if(dyn.nOpq) items.push({kind:'i',buf:B.dyn,M:M_I,first:0,count:dyn.nOpq,tag:'room'});
  const add=(ex,side)=>{ if(!ex) return; const M=side==='filler'?M_F:M_L;
    if(ex.kind==='f'){ const b=side===SIDE?B.f:B.fT; upload(gl,b,ex.data);
      if(ex.nOpq) items.push({kind:'i',buf:b,M,first:0,count:ex.nOpq,tag:side});
      if(ex.nTot>ex.nOpq) trans.push({kind:'i',buf:b,M,first:ex.nOpq,count:ex.nTot-ex.nOpq,tag:side}); }
    else { upload(gl,B.lp,F32(ex.P)); upload(gl,B.ln,F32(ex.N)); upload(gl,B.lc,F32(ex.C));
      if(ex.P.length) items.push({kind:'l',p:B.lp,n:B.ln,c:B.lc,M,first:0,count:ex.P.length/3,tag:side});
      if(ex.TP){ upload(gl,B.tp,ex.TP); upload(gl,B.tn,ex.TN); upload(gl,B.tc,ex.TC);
        trans.push({kind:'l',p:B.tp,n:B.tn,c:B.tc,M,first:0,count:ex.TP.length/3,tag:side}); } } };
  add(own,SIDE);
  if(reuse){ items.push(...g.oItems.o); trans.push(...g.oItems.t); }
  else if(other){ const i0=items.length, t0=trans.length; add(other,SIDE==='filler'?'line':'filler'); g.oItems={o:items.slice(i0),t:trans.slice(t0),n:STAT.otherLast=(other.kind==='f'?other.nTot/3:other.P.length/9)}; }
  if(ROOM.nTot>ROOM.nOpq) trans.push({kind:'i',buf:B.room,M:M_I,first:ROOM.nOpq,count:ROOM.nTot-ROOM.nOpq,tag:'room'});
  /* 반투명 순서 : 카메라 반대쪽 방 → 벽 유리 → 카메라 쪽 방 */
  const near=eye[0]<0?'filler':'line', rank=t=>t.tag==='room'?1:(t.tag===near?2:0);
  trans.sort((a,b)=>rank(a)-rank(b));
  const t2=performance.now();
  /* ③ 행렬 · 그림자 범위 (카메라 주시점 주변, 텍셀 격자에 맞춰 흔들림 방지) */
  const MVP=mul(persp(FOVY,W/H,NEAR,FAR),lookAt(eye,[cam.tx,cam.ty,cam.tz]));
  const R=Math.max(2600,Math.min(11000,Math.round(cam.dist*0.8/400)*400)), q=R*2/g.sm.size*8;
  const cx=Math.round(cam.tx/q)*q, cz=Math.round(cam.tz/q)*q;
  const lm=pxLightMatrix([cx-R,-20,cz-R],[cx+R,3200,cz+R],g.sm.size);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE);
  const shadowOn=g.sm.ok&&window.__shadowOn!==false;
  if(shadowOn){
    gl.bindFramebuffer(gl.FRAMEBUFFER,g.sm.fb); gl.viewport(0,0,g.sm.size,g.sm.size);
    gl.clearColor(1,1,1,1); gl.clearDepth(1); gl.depthMask(true); gl.disable(gl.BLEND); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.useProgram(g.smP.p); gl.uniformMatrix4fv(g.smP.u('uLMat'),false,lm.m);
    for(const it of items){ if(it.noShadow) continue; gl.uniformMatrix4fv(g.smP.u('uModel'),false,it.M); bindItem(g,it,true); gl.drawArrays(gl.TRIANGLES,it.first,it.count); }
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  }
  /* ④ AO 깊이 (반해상도) */
  const P=g.ao, aoOn=GFX.on&&GFX.ao&&P&&gfxAOSize(gl,P,pxW,pxH);
  if(aoOn){
    gl.bindFramebuffer(gl.FRAMEBUFFER,P.D.fb); gl.viewport(0,0,P.D.w,P.D.h);
    gl.clearColor(0,0,0,0); gl.clearDepth(1); gl.depthMask(true); gl.disable(gl.BLEND); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.useProgram(P.depth.p); gl.uniformMatrix4fv(P.depth.u('uMVP'),false,MVP); gl.uniform1f(P.depth.u('uFar'),FAR);
    for(const it of items){ gl.uniformMatrix4fv(P.depth.u('uModel'),false,it.M); bindItem(g,it,true); gl.drawArrays(gl.TRIANGLES,it.first,it.count); }
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  }
  /* ⑤ 본 패스 */
  gl.viewport(0,0,pxW,pxH); gl.clearColor(0,0,0,0); gl.clearDepth(1); gl.depthMask(true);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const mainSetup=()=>{ pxLightUniforms(gl,g.main,eye,[0,1460,5200],lm,g.sm);
    gl.uniformMatrix4fv(g.main.u('uMVP'),false,MVP); gl.uniform1f(g.main.u('uDet'),9000); gl.uniform3fv(g.main.u('u_ink'),ink.ink); };
  mainSetup(); gl.disable(gl.BLEND);
  for(const it of items){ gl.uniformMatrix4fv(g.main.u('uModel'),false,it.M); bindItem(g,it,false); gl.drawArrays(gl.TRIANGLES,it.first,it.count); }
  if(aoOn){ gfxAOResolve(gl,P,pxW,pxH,FAR,70,P.D.h/2/Math.tan(FOVY/2)); mainSetup(); }
  /* ⑥ 반투명 */
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  for(const it of trans){ gl.uniformMatrix4fv(g.main.u('uModel'),false,it.M); bindItem(g,it,false); gl.drawArrays(gl.TRIANGLES,it.first,it.count); }
  gl.depthMask(true); gl.disable(gl.BLEND);
  ctx.drawImage(g.cv,0,0,W,H);
  /* ⑦ 구역 표지 (화면 정렬) */
  const pr=(x,y,z)=>{ const m=MVP, cw=m[3]*x+m[7]*y+m[11]*z+m[15]; if(cw<=1) return null;
    return {x:((m[0]*x+m[4]*y+m[8]*z+m[12])/cw*0.5+0.5)*W, y:(1-((m[1]*x+m[5]*y+m[9]*z+m[13])/cw*0.5+0.5))*H}; };
  window.UNI_BADGES&&window.UNI_BADGES(ctx,pr,W,H);
  const t3=performance.now();
  Object.assign(STAT,{gen:+(t1-t0).toFixed(1),pack:+(t2-t1).toFixed(1),gl:+(t3-t2).toFixed(1),own:own.kind==='f'?own.nTot/3:(own.P.length+(own.TP?own.TP.length:0))/9,
    other:g.oItems?g.oItems.n:0, reuse,room:ROOM.nTot/3,ao:!!aoOn,simple});
  return MVP;
};
window.UNI_STAT=STAT;
window.UNI_MM={XF,YF,ZF,XL,YL,ZL,eyeOf,TO_UNITS,FOVY};
})();
