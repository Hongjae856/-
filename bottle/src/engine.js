/* ═══════════════════════════════════════════════════════════════════
   3D 엔진 (포장라인 IDT 엔진 기반 · 병충전 라인용 확장)
   · 단위 mm, X=라인 진행(좌→우) · Y=높이(바닥 0) · Z=작업자 쪽(+)
   · 픽셀 조명 + 톤매핑 + 직교 그림자 맵(4×4 PCF) + 바닥 그림자 받이
   · 고정 설비(정적)는 한 번만 GPU 에 올리고, 움직이는 부분(동적)만 매 프레임 생성
   · 양면 조명 : 법선은 셰이더에서 시점 쪽으로 뒤집으므로 정적 형상을 재사용할 수 있다
   · 정점마다 금속도(m) — 스테인리스 · 플라스틱 · 고무 질감 구분
   ═══════════════════════════════════════════════════════════════════ */

/* ── 재질 색 : [r,g,b,금속도] ── */
const C={
 ss:[0.80,0.83,0.86,0.85], ssD:[0.62,0.66,0.70,0.85], ssL:[0.90,0.92,0.94,0.80], brushed:[0.74,0.77,0.80,0.9],
 alu:[0.84,0.86,0.88,0.7], dark:[0.24,0.28,0.33,0.25], black:[0.12,0.13,0.15,0.15], rubber:[0.09,0.10,0.11,0.02],
 cab:[0.86,0.88,0.90,0.55], cabD:[0.70,0.74,0.78,0.55], cover:[0.93,0.94,0.95,0.3],
 hmi:[0.10,0.12,0.15,0.2], screen:[0.18,0.42,0.55,0.1], screenOn:[0.30,0.62,0.78,0.1],
 slat:[0.22,0.25,0.30,0.1], slatL:[0.35,0.38,0.43,0.1], guide:[0.85,0.87,0.89,0.8], uhmw:[0.93,0.93,0.90,0.05],
 blue:[0.16,0.40,0.78,0.2], blueL:[0.35,0.62,0.90,0.2], red:[0.84,0.20,0.14,0.2], orange:[0.93,0.52,0.14,0.2],
 yellow:[0.95,0.78,0.18,0.2], green:[0.10,0.66,0.38,0.2], white:[0.96,0.96,0.95,0.05], cream:[0.95,0.93,0.86,0.05],
 hdpe:[0.95,0.95,0.93,0.03], hdpeS:[0.90,0.90,0.88,0.03], amber:[0.66,0.42,0.16,0.1],
 capW:[0.97,0.97,0.96,0.04], capB:[0.14,0.36,0.72,0.08], capG:[0.10,0.52,0.36,0.08],
 tabA:[0.97,0.97,0.95,0.02], tabB:[0.96,0.86,0.52,0.02], capsR:[0.80,0.16,0.18,0.05], capsW:[0.97,0.96,0.94,0.05],
 gel:[0.96,0.96,0.94,0.02], gelPrint:[0.20,0.42,0.78,0.02], film:[0.78,0.90,0.96,0.1],
 glass:[0.66,0.80,0.90,0.4], acryl:[0.78,0.88,0.94,0.3], floor:[0.72,0.75,0.78,0.1],
 suit:[0.95,0.96,0.97,0.02], led:[0.30,1.00,0.55,0.0], ledR:[1.00,0.28,0.20,0.0], ledA:[1.00,0.78,0.20,0.0],
 wood:[0.72,0.56,0.36,0.02], box:[0.78,0.62,0.40,0.02], cyl:[0.78,0.81,0.85,0.9], rodC:[0.88,0.90,0.92,0.95]
};
/* 발광 색 (금속도 −1 → 셰이더가 조명 없이 그대로 출력) · 꺼진 램프 색 */
const E={ledG:[0.35,1.0,0.55,-1], ledR:[1.0,0.30,0.22,-1], ledY:[1.0,0.80,0.25,-1], ledB:[0.45,0.78,1.0,-1],
 scr:[0.60,0.83,0.96,-1], scrDim:[0.07,0.11,0.14,-1], heat:[1.0,0.45,0.14,-1], digit:[0.35,1.0,0.62,-1], beam:[1.0,0.25,0.2,-1]};
const OFF={g:[0.10,0.28,0.16,0.3], r:[0.34,0.08,0.06,0.3], y:[0.36,0.29,0.06,0.3]};
/* 임의 기저 : 국부 x→ex, y→ey, z→ez, 원점 o */
function mBasis(o,ex,ey,ez){ mMul([ex[0],ey[0],ez[0],o[0], ex[1],ey[1],ez[1],o[1], ex[2],ey[2],ez[2],o[2]]); }
/* 두 점 사이 방향 기저 (국부 y = a→b) */
function mAlong(a,b){
  const d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]], L=Math.hypot(d[0],d[1],d[2])||1, ey=[d[0]/L,d[1]/L,d[2]/L];
  let ex=Math.abs(ey[1])<0.95?pxNorm([ey[2],0,-ey[0]]):[1,0,0];
  const ez=[ex[1]*ey[2]-ex[2]*ey[1], ex[2]*ey[0]-ex[0]*ey[2], ex[0]*ey[1]-ex[1]*ey[0]];
  mBasis(a,ex,ey,ez); return L;
}

/* ── 정점 버퍼 (늘어나는 Float32Array) ── */
function Sink(n){ this.cap=n; this.v=0; this.p=new Float32Array(n*3); this.n=new Float32Array(n*3); this.c=new Float32Array(n*4); this.m=new Float32Array(n); }
Sink.prototype.grow=function(){
  const n=this.cap*2, g=(a,k)=>{const b=new Float32Array(n*k); b.set(a); return b;};
  this.p=g(this.p,3); this.n=g(this.n,3); this.c=g(this.c,4); this.m=g(this.m,1); this.cap=n;
};
const GEO={ stat:{op:new Sink(1<<17), tr:new Sink(1<<13)}, dyn:{op:new Sink(1<<17), tr:new Sink(1<<13)} };
let gSet=GEO.dyn, gAlpha=1, gM=null;
const gStack=[];
function geoBegin(set){ gSet=set; set.op.v=0; set.tr.v=0; gAlpha=1; gM=null; gStack.length=0; }

/* ── 변환 행렬 (3×4, 행 우선) : 부품의 국부 좌표 → 월드 ── */
const M_ID=[1,0,0,0, 0,1,0,0, 0,0,1,0];
function mPush(){ gStack.push(gM); }
function mPop(){ gM=gStack.pop()||null; }
function mMul(b){
  const a=gM||M_ID, o=new Array(12);
  for(let r=0;r<3;r++){
    const a0=a[r*4],a1=a[r*4+1],a2=a[r*4+2],a3=a[r*4+3];
    o[r*4]=a0*b[0]+a1*b[4]+a2*b[8];
    o[r*4+1]=a0*b[1]+a1*b[5]+a2*b[9];
    o[r*4+2]=a0*b[2]+a1*b[6]+a2*b[10];
    o[r*4+3]=a0*b[3]+a1*b[7]+a2*b[11]+a3;
  }
  gM=o;
}
function mT(x,y,z){ mMul([1,0,0,x, 0,1,0,y, 0,0,1,z]); }
function mRX(a){ const c=Math.cos(a),s=Math.sin(a); mMul([1,0,0,0, 0,c,-s,0, 0,s,c,0]); }
function mRY(a){ const c=Math.cos(a),s=Math.sin(a); mMul([c,0,s,0, 0,1,0,0, -s,0,c,0]); }
function mRZ(a){ const c=Math.cos(a),s=Math.sin(a); mMul([c,-s,0,0, s,c,0,0, 0,0,1,0]); }
function mS(k){ mMul([k,0,0,0, 0,k,0,0, 0,0,k,0]); }
function mApply(p){ const m=gM; if(!m) return p.slice(); return [m[0]*p[0]+m[1]*p[1]+m[2]*p[2]+m[3], m[4]*p[0]+m[5]*p[1]+m[6]*p[2]+m[7], m[8]*p[0]+m[9]*p[1]+m[10]*p[2]+m[11]]; }

/* ── 정점 기록 ── */
function vtx(x,y,z,nx,ny,nz,col){
  const s=gAlpha>=1?gSet.op:gSet.tr;
  if(s.v>=s.cap) s.grow();
  const m=gM;
  if(m){
    const X=m[0]*x+m[1]*y+m[2]*z+m[3], Y=m[4]*x+m[5]*y+m[6]*z+m[7], Z=m[8]*x+m[9]*y+m[10]*z+m[11];
    const NX=m[0]*nx+m[1]*ny+m[2]*nz, NY=m[4]*nx+m[5]*ny+m[6]*nz, NZ=m[8]*nx+m[9]*ny+m[10]*nz;
    x=X;y=Y;z=Z;nx=NX;ny=NY;nz=NZ;
  }
  const i=s.v++, i3=i*3, i4=i*4;
  s.p[i3]=x; s.p[i3+1]=y; s.p[i3+2]=z;
  s.n[i3]=nx; s.n[i3+1]=ny; s.n[i3+2]=nz;
  s.c[i4]=col[0]; s.c[i4+1]=col[1]; s.c[i4+2]=col[2]; s.c[i4+3]=gAlpha;
  s.m[i]=col.length>3?col[3]:0.35;
}
/* 평면 삼각형 */
function tri(a,b,c,col){
  const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2], vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
  const nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
  vtx(a[0],a[1],a[2],nx,ny,nz,col); vtx(b[0],b[1],b[2],nx,ny,nz,col); vtx(c[0],c[1],c[2],nx,ny,nz,col);
}
/* 정점 법선 삼각형 (곡면) */
function triN(a,b,c,na,nb,nc,col){
  vtx(a[0],a[1],a[2],na[0],na[1],na[2],col); vtx(b[0],b[1],b[2],nb[0],nb[1],nb[2],col); vtx(c[0],c[1],c[2],nc[0],nc[1],nc[2],col);
}
function quad(a,b,c,d,col){ tri(a,b,c,col); tri(a,c,d,col); }
function quadN(a,b,c,d,na,nb,nc,nd,col){ triN(a,b,c,na,nb,nc,col); triN(a,c,d,na,nc,nd,col); }

/* ── 둥근 모서리 박스 위상 (포장라인 IDT 와 동일) ── */
function pxNorm(v){const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];}
const PX_RB=(function(){
 const P=(k,a,i,b,j,c)=>{const p=[0,0,0];p[k]=a;p[i]=b;p[j]=c;return p;}, polys=[];
 for(let k=0;k<3;k++){const i=(k+1)%3,j=(k+2)%3;
  for(const c of [0,3])polys.push([P(k,c,i,1,j,1),P(k,c,i,2,j,1),P(k,c,i,2,j,2),P(k,c,i,1,j,2)]);
  for(const si of [0,1])for(const sj of [0,1]){const ci=si?3:0,cj=sj?3:0,ii=si?2:1,ij=sj?2:1;
   polys.push([P(k,1,i,ci,j,ij),P(k,2,i,ci,j,ij),P(k,2,i,ii,j,cj),P(k,1,i,ii,j,cj)]);}}
 for(let s=0;s<8;s++){const o=[s&1?3:0,s&2?3:0,s&4?3:0],n=[s&1?2:1,s&2?2:1,s&4?2:1];
  polys.push([[o[0],n[1],n[2]],[n[0],o[1],n[2]],[n[0],n[1],o[2]]]);}
 const tri=[],nrm=[];
 for(const q of polys){
  const u=[0,1,2].map(a=>q[1][a]-q[0][a]),v=[0,1,2].map(a=>q[2][a]-q[0][a]);
  const fn=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  const c=[0,1,2].map(a=>q.reduce((s,p)=>s+p[a],0)/q.length-1.5);
  if(fn[0]*c[0]+fn[1]*c[1]+fn[2]*c[2]<0)q.reverse();
  const vs=q.map(p=>({c:p,n:pxNorm(p.map(v=>v===0?-1:v===3?1:0))}));
  for(let i=1;i<vs.length-1;i++)for(const v of [vs[0],vs[i],vs[i+1]]){tri.push(...v.c);nrm.push(...v.n);}
 }
 return {tri:new Int8Array(tri),nrm:new Float32Array(nrm)};
})();
const ROUND_MAX=9;
/* 축정렬 박스 : 불투명이고 충분히 크면 모서리를 둥글게 (r<0 이면 강제로 각지게) */
function box(x0,x1,y0,y1,z0,z1,col,top,r){
  if(x1<x0){const t=x0;x0=x1;x1=t;} if(y1<y0){const t=y0;y0=y1;y1=t;} if(z1<z0){const t=z0;z0=z1;z1=t;}
  const T=top||col;
  if(r===undefined){ const m=Math.min(x1-x0,y1-y0,z1-z0); r=(gAlpha>=1&&m>=12)?Math.min(ROUND_MAX,0.16*m):0; }
  if(r>0){
    r=Math.min(r,(x1-x0)/2-0.01,(y1-y0)/2-0.01,(z1-z0)/2-0.01);
    const X=[x0,x0+r,x1-r,x1], Y=[y0,y0+r,y1-r,y1], Z=[z0,z0+r,z1-r,z1], Tr=PX_RB.tri, Nr=PX_RB.nrm;
    for(let t=0;t<Tr.length;t+=3){ const cc=Nr[t+1]>0.5?T:col; vtx(X[Tr[t]],Y[Tr[t+1]],Z[Tr[t+2]],Nr[t],Nr[t+1],Nr[t+2],cc); }
    return;
  }
  const P=(x,y,z)=>[x,y,z];
  quad(P(x0,y1,z1),P(x1,y1,z1),P(x1,y1,z0),P(x0,y1,z0),T);
  quad(P(x0,y0,z0),P(x1,y0,z0),P(x1,y0,z1),P(x0,y0,z1),col);
  quad(P(x0,y0,z1),P(x1,y0,z1),P(x1,y1,z1),P(x0,y1,z1),col);
  quad(P(x1,y0,z0),P(x0,y0,z0),P(x0,y1,z0),P(x1,y1,z0),col);
  quad(P(x1,y0,z1),P(x1,y0,z0),P(x1,y1,z0),P(x1,y1,z1),col);
  quad(P(x0,y0,z0),P(x0,y0,z1),P(x0,y1,z1),P(x0,y1,z0),col);
}
function boxC(cx,cy,cz,w,h,d,col,top,r){ box(cx-w/2,cx+w/2,cy-h/2,cy+h/2,cz-d/2,cz+d/2,col,top,r); }
/* 반투명 박스 (가드 · 아크릴 커버) */
function glassBox(x0,x1,y0,y1,z0,z1,col,a){ const g=gAlpha; gAlpha=a===undefined?0.16:a; box(x0,x1,y0,y1,z0,z1,col||C.acryl,col||C.acryl,0); gAlpha=g; }

/* ── 회전체 ── */
/* 임의 축 원기둥 : 옆면은 부드러운 법선, 마구리는 평면 */
function tube(a,b,r,col,seg,cap,r2){
  seg=seg||14; if(cap===undefined) cap=true; if(r2===undefined) r2=r;
  let ax=b[0]-a[0], ay=b[1]-a[1], az=b[2]-a[2];
  const L=Math.hypot(ax,ay,az); if(L<1e-6) return;
  ax/=L; ay/=L; az/=L;
  let ux,uy,uz;
  if(Math.abs(ay)<0.9){ ux=-az; uy=0; uz=ax; } else { ux=1; uy=0; uz=0; }
  const ul=Math.hypot(ux,uy,uz); ux/=ul; uy/=ul; uz/=ul;
  const vx=ay*uz-az*uy, vy=az*ux-ax*uz, vz=ax*uy-ay*ux;
  const sl=(r-r2)/L;   /* 원뿔대 옆면 법선 기울기 */
  let pa0=null,pb0=null,n0=null;
  for(let i=0;i<=seg;i++){
    const t=i/seg*Math.PI*2, c=Math.cos(t), s=Math.sin(t);
    const dx=ux*c+vx*s, dy=uy*c+vy*s, dz=uz*c+vz*s;
    const pa=[a[0]+dx*r,a[1]+dy*r,a[2]+dz*r], pb=[b[0]+dx*r2,b[1]+dy*r2,b[2]+dz*r2];
    const n=[dx+ax*sl,dy+ay*sl,dz+az*sl];
    if(pa0){
      quadN(pa0,pa,pb,pb0,n0,n,n,n0,col);
      if(cap){ if(r>0.01) tri(a,pa,pa0,col); if(r2>0.01) tri(b,pb0,pb,col); }
    }
    pa0=pa; pb0=pb; n0=n;
  }
}
const cylX=(x0,x1,y,z,r,col,seg,cap)=>tube([x0,y,z],[x1,y,z],r,col,seg,cap);
const cylY=(x,z,y0,y1,r,col,seg,cap)=>tube([x,y0,z],[x,y1,z],r,col,seg,cap);
const cylZ=(x,y,z0,z1,r,col,seg,cap)=>tube([x,y,z0],[x,y,z1],r,col,seg,cap);
/* 회전체(lathe) : 국부 Y 축 둘레로 [반지름, 높이] 윤곽을 돌린다 */
function lathe(prof,col,seg,a0,a1){
  seg=seg||16; a0=a0||0; a1=a1===undefined?Math.PI*2:a1;
  const n=prof.length, nr=[];
  for(let j=0;j<n;j++){  /* 윤곽 법선 : 이웃 점의 접선에 수직 */
    const p=prof[Math.max(0,j-1)], q=prof[Math.min(n-1,j+1)];
    let tr=q[0]-p[0], ty=q[1]-p[1]; const l=Math.hypot(tr,ty)||1;
    nr.push([ty/l,-tr/l]);
  }
  let prev=null;
  for(let i=0;i<=seg;i++){
    const t=a0+(a1-a0)*i/seg, c=Math.cos(t), s=Math.sin(t), ring=[];
    for(let j=0;j<n;j++) ring.push({p:[prof[j][0]*c,prof[j][1],prof[j][0]*s], n:[nr[j][0]*c,nr[j][1],nr[j][0]*s]});
    if(prev) for(let j=0;j<n-1;j++){
      const A=prev[j],B=ring[j],Cc=ring[j+1],D=prev[j+1];
      if(Math.abs(prof[j][1]-prof[j+1][1])<1e-6&&Math.abs(prof[j][0]-prof[j+1][0])<1e-6) continue;
      quadN(A.p,B.p,Cc.p,D.p,A.n,B.n,Cc.n,D.n,col);
    }
    prev=ring;
  }
}
/* 평면 원판/고리 (국부 Y 위 방향) */
function disc(y,r0,r1,col,seg,a0,a1){
  seg=seg||20; a0=a0||0; a1=a1===undefined?Math.PI*2:a1;
  for(let i=0;i<seg;i++){
    const t0=a0+(a1-a0)*i/seg, t1=a0+(a1-a0)*(i+1)/seg;
    const c0=Math.cos(t0),s0=Math.sin(t0),c1=Math.cos(t1),s1=Math.sin(t1);
    if(r0<0.01) tri([0,y,0],[r1*c1,y,r1*s1],[r1*c0,y,r1*s0],col);
    else quad([r0*c0,y,r0*s0],[r0*c1,y,r0*s1],[r1*c1,y,r1*s1],[r1*c0,y,r1*s0],col);
  }
}
/* 타원체 (부드러운 법선) */
function ellipsoid(c,r,col,nu,nv){
  nu=nu||12; nv=nv||8;
  let prev=null;
  for(let j=0;j<=nv;j++){
    const ph=j/nv*Math.PI, row=[];
    for(let i=0;i<=nu;i++){
      const th=i/nu*Math.PI*2, sx=Math.sin(ph)*Math.cos(th), sy=Math.cos(ph), sz=Math.sin(ph)*Math.sin(th);
      row.push({p:[c[0]+r[0]*sx,c[1]+r[1]*sy,c[2]+r[2]*sz], n:[sx/r[0],sy/r[1],sz/r[2]]});
    }
    if(prev) for(let i=0;i<nu;i++){ const A=prev[i],B=prev[i+1],Cc=row[i+1],D=row[i];
      if(j===1) triN(A.p,Cc.p,D.p,A.n,Cc.n,D.n,col);
      else if(j===nv) triN(A.p,B.p,D.p,A.n,B.n,D.n,col);
      else quadN(A.p,B.p,Cc.p,D.p,A.n,B.n,Cc.n,D.n,col); }
    prev=row;
  }
}
/* 폴리라인을 따라가는 관 (호스 · 스크류 날개 · 케이블) */
function tubePath(pts,r,col,seg){
  seg=seg||8;
  for(let i=0;i<pts.length-1;i++) tube(pts[i],pts[i+1],r,col,seg,i===0||i===pts.length-2);
}
/* 띠 (벨트 · 필름) : 두 가장자리 점열 사이를 잇는다 */
function ribbon(L,R,col){
  for(let i=0;i<L.length-1;i++) quad(L[i],R[i],R[i+1],L[i+1],col);
}

/* ═══ 픽셀 조명 · 톤매핑 · 그림자 맵 셰이더 ═══ */
const PX_HEAD='#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
const PX_LIGHT=`
uniform vec3 uEye,uL1,uL2,uL3,uAO;uniform mat4 uLMat;uniform sampler2D uSM;uniform vec4 uSMI;uniform float uExpo;
float unpackD(vec4 v){return dot(v,vec4(1.0,1.0/255.0,1.0/65025.0,1.0/16581375.0));}
float shadowAt(vec3 P,vec3 N){
 if(uSMI.y<0.5)return 1.0;
 vec4 q=uLMat*vec4(P+N*uSMI.z,1.0);vec3 s=q.xyz/q.w*0.5+0.5;
 if(s.x<=0.0||s.x>=1.0||s.y<=0.0||s.y>=1.0||s.z>=1.0)return 1.0;
 float lit=0.0;
 for(int i=0;i<4;i++)for(int j=0;j<4;j++)
  lit+=step(s.z-uSMI.w,unpackD(texture2D(uSM,s.xy+(vec2(float(i),float(j))-1.5)*uSMI.x)));
 return lit/16.0;}
vec3 lin(vec3 c){return pow(max(c,0.0),vec3(2.2));}
vec3 envAt(float t){vec3 h=vec3(0.73,0.737,0.741);return t>=0.0?mix(h,vec3(1.0),t):mix(h,vec3(0.475,0.482,0.486),-t);}
vec3 envRefl(float t){return mix(vec3(0.40,0.41,0.42),vec3(1.0),smoothstep(-0.42,0.10,t));}
vec3 pxShade(vec3 alb,float met,vec3 P,vec3 N,float br){
 vec3 Vv=uEye-P;float vl=length(Vv);vec3 V=Vv/max(vl,1e-4);
 if(dot(N,V)<0.0)N=-N;
 float sh=shadowAt(P,N);
 float d=max(dot(N,uL1),0.0)*sh,d2=max(dot(N,uL2),0.0),d3=max(dot(N,uL3),0.0);
 float nv=max(dot(N,V),0.0);float q=1.0-nv;q*=q;float fr=q*q;
 float nh=max(dot(N,normalize(uL1+V)),0.0);
 float sp=pow(nh,met>0.5?52.0:18.0)*(0.22+0.78*met)*sh;
 float ao=0.70+0.30*clamp((P.y-uAO.x)/uAO.y,0.0,1.0);
 float diff=(mix(0.12,0.27,N.y*0.5+0.5)+1.16*d+0.17*d2+0.25*d3)*ao;
 float kEnv=(0.06+0.55*met+0.40*fr*met)*(0.58+0.42*ao);
 vec3 env=mix(envAt(N.y),envRefl(reflect(-V,N).y),met);
 vec3 c=lin(alb)*diff*(1.0-kEnv*0.55)+lin(env)*kEnv+sp;
 float w=(d-0.42)*0.05;c*=vec3(1.0+w,1.0,1.0-w*0.7);
 c=(c+fr*fr*(0.03+0.10*met))*br*uExpo;
 float m=max(max(c.r,c.g),c.b);if(m>0.75)c*=(1.0-0.25*exp((0.75-m)*4.0))/m;
 c=pow(c,vec3(1.0/2.2));
 float fg=vl>uAO.z?min(0.12,(vl-uAO.z)*0.000012):0.0;
 return mix(c,vec3(0.965,0.976,0.996),fg);}
`;
const PX_SM_VS='attribute vec3 p;uniform mat4 uLMat;void main(){gl_Position=uLMat*vec4(p,1.0);}';
const PX_SM_FS=PX_HEAD+'void main(){vec4 e=fract(min(gl_FragCoord.z,0.99999)*vec4(1.0,255.0,65025.0,16581375.0));'+
 'gl_FragColor=e-e.yzww*vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);}';
const PX_CATCH_FS=PX_HEAD+PX_LIGHT+'varying vec3 vW;uniform vec4 uTint,uRect;void main(){'+
 'vec2 e=min(vW.xz-uRect.xy,uRect.zw-vW.xz);float a=uTint.a*(1.0-shadowAt(vW,vec3(0.0,1.0,0.0)))*clamp(min(e.x,e.y)/400.0,0.0,1.0);'+
 'gl_FragColor=vec4(uTint.rgb*a,a);}';
const VS="attribute vec3 p;attribute vec3 n;attribute vec4 c;attribute float m;uniform mat4 mvp;"+
 "varying vec3 vW;varying vec3 vN;varying vec4 vC;varying float vM;"+
 "void main(){vW=p;vN=n;vC=c;vM=m;gl_Position=mvp*vec4(p,1.0);}";
const FS=PX_HEAD+PX_LIGHT+"varying vec3 vW;varying vec3 vN;varying vec4 vC;varying float vM;"+
 "void main(){if(vM<-0.5){gl_FragColor=vec4(vC.rgb*vC.a,vC.a);return;}"+   /* 발광 (LED · 화면 · 가열) : 조명 무시 */
 "vec3 c=pxShade(vC.rgb,vM,vW,normalize(vN),1.0);gl_FragColor=vec4(c*vC.a,vC.a);}";
const CATCH_VS="attribute vec3 p;uniform mat4 mvp;varying vec3 vW;void main(){vW=p;gl_Position=mvp*vec4(p,1.0);}";
const PX_EXPO=0.88;
const PX_L1=pxNorm([-0.50,0.80,0.33]), PX_L2=pxNorm([0.62,0.22,-0.55]), PX_L3=pxNorm([0.30,0.45,0.84]);
function matMul(a,b){ const o=new Float32Array(16);
  for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s;}
  return o; }
function pxLightMatrix(lo,hi,size){
 const c=[(lo[0]+hi[0])/2,(lo[1]+hi[1])/2,(lo[2]+hi[2])/2];
 const z=PX_L1, x=pxNorm([z[2],0,-z[0]]), y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
 const V=new Float32Array([x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0,
  -(x[0]*c[0]+x[1]*c[1]+x[2]*c[2]),-(y[0]*c[0]+y[1]*c[1]+y[2]*c[2]),-(z[0]*c[0]+z[1]*c[1]+z[2]*c[2]),1]);
 const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];
 for(let i=0;i<8;i++){const p=[i&1?hi[0]:lo[0],i&2?hi[1]:lo[1],i&4?hi[2]:lo[2]];
  for(let k=0;k<3;k++){const v=V[k]*p[0]+V[4+k]*p[1]+V[8+k]*p[2]+V[12+k];mn[k]=Math.min(mn[k],v);mx[k]=Math.max(mx[k],v);}}
 const n=-mx[2]-10,f=-mn[2]+10;
 const O=new Float32Array([2/(mx[0]-mn[0]),0,0,0, 0,2/(mx[1]-mn[1]),0,0, 0,0,-2/(f-n),0,
  -(mx[0]+mn[0])/(mx[0]-mn[0]),-(mx[1]+mn[1])/(mx[1]-mn[1]),-(f+n)/(f-n),1]);
 const texel=Math.max(mx[0]-mn[0],mx[1]-mn[1])/size;
 return {m:matMul(O,V),info:[1/size,1,texel*1.5,1.5/(f-n)]};
}
function pxProgram(g,vs,fs,attrs){
 const sh=(t,s)=>{const o=g.createShader(t);g.shaderSource(o,s);g.compileShader(o);
  if(!g.getShaderParameter(o,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(o));return o;};
 const p=g.createProgram();g.attachShader(p,sh(g.VERTEX_SHADER,vs));g.attachShader(p,sh(g.FRAGMENT_SHADER,fs));
 attrs.forEach((a,i)=>g.bindAttribLocation(p,i,a));g.linkProgram(p);
 if(!g.getProgramParameter(p,g.LINK_STATUS))throw Error(g.getProgramInfoLog(p));
 const u={};return {p,u:n=>n in u?u[n]:(u[n]=g.getUniformLocation(p,n))};
}
function pxShadowTarget(g,size){
 const tex=g.createTexture();g.bindTexture(g.TEXTURE_2D,tex);
 g.texImage2D(g.TEXTURE_2D,0,g.RGBA,size,size,0,g.RGBA,g.UNSIGNED_BYTE,null);
 for(const [k,v] of [[g.TEXTURE_MIN_FILTER,g.NEAREST],[g.TEXTURE_MAG_FILTER,g.NEAREST],[g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE],[g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE]])g.texParameteri(g.TEXTURE_2D,k,v);
 const rb=g.createRenderbuffer();g.bindRenderbuffer(g.RENDERBUFFER,rb);g.renderbufferStorage(g.RENDERBUFFER,g.DEPTH_COMPONENT16,size,size);
 const fb=g.createFramebuffer();g.bindFramebuffer(g.FRAMEBUFFER,fb);
 g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,tex,0);
 g.framebufferRenderbuffer(g.FRAMEBUFFER,g.DEPTH_ATTACHMENT,g.RENDERBUFFER,rb);
 const ok=g.checkFramebufferStatus(g.FRAMEBUFFER)===g.FRAMEBUFFER_COMPLETE;
 g.bindFramebuffer(g.FRAMEBUFFER,null);return {tex,fb,size,ok};
}

/* ═══ 카메라 · 렌더러 ═══ */
const cam={yaw:-0.55,pitch:0.34,dist:12500,tx:0,ty:900,tz:0, yawT:-0.55,pitchT:0.34,distT:12500,txT:0,tyT:900,tzT:0, view:"all"};
const CAMVIEW={};              /* layout.js 에서 채운다 */
const R3={gl:null,glCv:null,cv:null,ctx:null,prog:null,buf:null,sm:null,lm:null,statDirty:true,statCount:0,shadowOn:true,
  lo:[-6800,-10,-2600],hi:[6600,2800,2600],smSize:2048,W:2,H:2,eye:[0,0,0],mvp:null,fog:10000,ready:false};
function perspM(fov,asp,n,f){ const t=1/Math.tan(fov/2); return new Float32Array([t/asp,0,0,0, 0,t,0,0, 0,0,(f+n)/(n-f),-1, 0,0,2*f*n/(n-f),0]); }
function lookAtM(e,c,up){
  let zx=e[0]-c[0],zy=e[1]-c[1],zz=e[2]-c[2]; let l=Math.hypot(zx,zy,zz)||1; zx/=l;zy/=l;zz/=l;
  let xx=up[1]*zz-up[2]*zy, xy=up[2]*zx-up[0]*zz, xz=up[0]*zy-up[1]*zx; l=Math.hypot(xx,xy,xz)||1; xx/=l;xy/=l;xz/=l;
  const yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
  return new Float32Array([xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0, -(xx*e[0]+xy*e[1]+xz*e[2]), -(yx*e[0]+yy*e[1]+yz*e[2]), -(zx*e[0]+zy*e[1]+zz*e[2]), 1]);
}
function camPrep(w,h){
  const cp=Math.cos(cam.pitch), sp=Math.sin(cam.pitch);
  R3.eye=[cam.tx+cam.dist*cp*Math.sin(cam.yaw), cam.ty+cam.dist*sp, cam.tz+cam.dist*cp*Math.cos(cam.yaw)];
  R3.mvp=matMul(perspM(0.62,w/h,40,80000),lookAtM(R3.eye,[cam.tx,cam.ty,cam.tz],[0,1,0]));
}
/* CPU 투영 (라벨 · 핫스팟) — 반환 좌표는 캔버스 픽셀 */
function prj(x,y,z){
  const m=R3.mvp; if(!m) return null;
  const cx=m[0]*x+m[4]*y+m[8]*z+m[12], cy=m[1]*x+m[5]*y+m[9]*z+m[13], cw=m[3]*x+m[7]*y+m[11]*z+m[15];
  if(cw<=0.0001) return null;
  return {x:(cx/cw*0.5+0.5)*R3.W, y:(1-(cy/cw*0.5+0.5))*R3.H, w:cw};
}
function camStep(dt){
  const k=Math.min(1,dt*5.5);
  cam.yaw+=(cam.yawT-cam.yaw)*k; cam.pitch+=(cam.pitchT-cam.pitch)*k; cam.dist+=(cam.distT-cam.dist)*k;
  cam.tx+=(cam.txT-cam.tx)*k; cam.ty+=(cam.tyT-cam.ty)*k; cam.tz+=(cam.tzT-cam.tz)*k;
}
function camSet(v){
  const p=CAMVIEW[v]||CAMVIEW.all; if(!p) return; cam.view=v;
  cam.yawT=p.yaw; cam.pitchT=p.pitch; cam.distT=p.dist; cam.txT=p.tx; cam.tyT=p.ty; cam.tzT=p.tz||0;
  $$("#v3Grp [data-v]").forEach(b=>b.classList.toggle("on",b.dataset.v===v));
}
function r3Init(){
  if(R3.ready) return !!R3.gl;
  R3.ready=true;
  R3.cv=$("#cv3d"); R3.ctx=R3.cv.getContext("2d");
  R3.glCv=document.createElement("canvas");
  const g=R3.glCv.getContext("webgl",{antialias:true,alpha:true,premultipliedAlpha:true,depth:true});
  if(!g){ $("#view3d").insertAdjacentHTML("beforeend",'<div class="offScr" style="position:absolute;inset:0;background:#eef4fa"><b>WebGL 을 사용할 수 없습니다</b>이 브라우저에서는 3D 화면을 표시할 수 없습니다.</div>'); return false; }
  try{
    R3.prog={ main:pxProgram(g,VS,FS,["p","n","c","m"]), shadow:pxProgram(g,PX_SM_VS,PX_SM_FS,["p"]), catcher:pxProgram(g,CATCH_VS,PX_CATCH_FS,["p"]) };
  }catch(e){ console.error("3D 셰이더 준비 실패",e); return false; }
  const B=()=>({p:g.createBuffer(),n:g.createBuffer(),c:g.createBuffer(),m:g.createBuffer()});
  R3.buf={stat:B(),dyn:B(),tr:B(),q:g.createBuffer()};
  R3.sm=pxShadowTarget(g,R3.smSize); R3.lm=pxLightMatrix(R3.lo,R3.hi,R3.smSize);
  g.enable(g.DEPTH_TEST); g.depthFunc(g.LEQUAL); g.disable(g.CULL_FACE);
  R3.glCv.addEventListener("webglcontextlost",e=>{e.preventDefault(); R3.gl=null;});
  R3.gl=g;
  return true;
}
function r3Resize(){
  const wrap=$("#view3d"), dpr=Math.min(1.8,window.devicePixelRatio||1)*fitApp.k;
  const W=Math.max(2,Math.round(wrap.clientWidth*dpr)), H=Math.max(2,Math.round(wrap.clientHeight*dpr));
  if(W!==R3.cv.width||H!==R3.cv.height){ R3.cv.width=W; R3.cv.height=H; R3.glCv.width=W; R3.glCv.height=H; }
  R3.W=W; R3.H=H;
}
/* 정점 속성 업로드 · 연결 */
function r3Upload(buf,s,n,usage){
  const g=R3.gl;
  const up=(b,a,k)=>{ g.bindBuffer(g.ARRAY_BUFFER,b); g.bufferData(g.ARRAY_BUFFER,a.subarray(0,n*k),usage); };
  up(buf.p,s.p,3); up(buf.n,s.n,3); up(buf.c,s.c,4); up(buf.m,s.m,1);
}
function r3Bind(buf,posOnly){
  const g=R3.gl;
  const at=(i,b,k)=>{ g.bindBuffer(g.ARRAY_BUFFER,b); g.enableVertexAttribArray(i); g.vertexAttribPointer(i,k,g.FLOAT,false,0,0); };
  at(0,buf.p,3);
  if(posOnly){ for(let i=1;i<4;i++) g.disableVertexAttribArray(i); return; }
  at(1,buf.n,3); at(2,buf.c,4); at(3,buf.m,1);
}
function r3Light(prog){
  const g=R3.gl;
  g.useProgram(prog.p);
  g.uniform3fv(prog.u("uEye"),R3.eye); g.uniform3fv(prog.u("uL1"),PX_L1); g.uniform3fv(prog.u("uL2"),PX_L2); g.uniform3fv(prog.u("uL3"),PX_L3);
  g.uniform3fv(prog.u("uAO"),[0,1300,R3.fog]); g.uniformMatrix4fv(prog.u("uLMat"),false,R3.lm.m);
  g.uniform4fv(prog.u("uSMI"),[R3.lm.info[0],(R3.sm.ok&&R3.shadowOn)?1:0,R3.lm.info[2],R3.lm.info[3]]); g.uniform1f(prog.u("uExpo"),PX_EXPO);
  g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D,R3.sm.tex); g.uniform1i(prog.u("uSM"),0);
  g.uniformMatrix4fv(prog.u("mvp"),false,R3.mvp);
}
/* 반투명 삼각형 : 정적+동적을 합쳐 뒤→앞 정렬 */
const TRS=new Sink(1<<13);
function r3SortTransparent(){
  const A=GEO.stat.tr, B=GEO.dyn.tr, n=(A.v+B.v)/3, e=R3.eye, idx=new Array(n);
  const src=i=>i<A.v/3?[A,i]:[B,i-A.v/3];
  for(let i=0;i<n;i++){ const [s,k]=src(i), o=k*9;
    const mx=(s.p[o]+s.p[o+3]+s.p[o+6])/3-e[0], my=(s.p[o+1]+s.p[o+4]+s.p[o+7])/3-e[1], mz=(s.p[o+2]+s.p[o+5]+s.p[o+8])/3-e[2];
    idx[i]=[i,mx*mx+my*my+mz*mz]; }
  idx.sort((a,b)=>b[1]-a[1]);
  while(TRS.cap<n*3) TRS.grow();
  idx.forEach((it,k)=>{ const [s,q]=src(it[0]);
    TRS.p.set(s.p.subarray(q*9,q*9+9),k*9); TRS.n.set(s.n.subarray(q*9,q*9+9),k*9);
    TRS.c.set(s.c.subarray(q*12,q*12+12),k*12); TRS.m.set(s.m.subarray(q*3,q*3+3),k*3); });
  TRS.v=n*3; return n*3;
}
/* 한 프레임 그리기 : ① 그림자 맵 ② 바닥 그림자 ③ 불투명(정적·동적) ④ 반투명 */
function r3Paint(){
  const g=R3.gl; if(!g) return;
  const S=GEO.stat.op, D=GEO.dyn.op;
  if(R3.statDirty){ r3Upload(R3.buf.stat,S,S.v,g.STATIC_DRAW); R3.statCount=S.v; R3.statDirty=false; }
  r3Upload(R3.buf.dyn,D,D.v,g.DYNAMIC_DRAW);
  const shadow=R3.sm.ok&&R3.shadowOn;
  if(shadow){
    g.bindFramebuffer(g.FRAMEBUFFER,R3.sm.fb); g.viewport(0,0,R3.sm.size,R3.sm.size);
    g.clearColor(1,1,1,1); g.clearDepth(1); g.depthMask(true); g.disable(g.BLEND);
    g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);
    const sp=R3.prog.shadow; g.useProgram(sp.p); g.uniformMatrix4fv(sp.u("uLMat"),false,R3.lm.m);
    if(R3.statCount){ r3Bind(R3.buf.stat,true); g.drawArrays(g.TRIANGLES,0,R3.statCount); }
    if(D.v){ r3Bind(R3.buf.dyn,true); g.drawArrays(g.TRIANGLES,0,D.v); }
    g.bindFramebuffer(g.FRAMEBUFFER,null);
  }
  g.viewport(0,0,R3.W,R3.H); g.clearColor(0,0,0,0); g.clearDepth(1); g.depthMask(true);
  g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);
  if(shadow){
    const cp=R3.prog.catcher; r3Light(cp);
    g.uniform4fv(cp.u("uTint"),[0.20,0.26,0.32,0.34]);
    const y=0.5, x0=R3.lo[0], x1=R3.hi[0], z0=R3.lo[2], z1=R3.hi[2];
    g.uniform4fv(cp.u("uRect"),[x0,z0,x1,z1]);
    g.bindBuffer(g.ARRAY_BUFFER,R3.buf.q); g.bufferData(g.ARRAY_BUFFER,new Float32Array([x0,y,z0, x1,y,z0, x1,y,z1, x0,y,z0, x1,y,z1, x0,y,z1]),g.DYNAMIC_DRAW);
    g.enableVertexAttribArray(0); g.vertexAttribPointer(0,3,g.FLOAT,false,0,0); for(let i=1;i<4;i++) g.disableVertexAttribArray(i);
    g.enable(g.BLEND); g.blendFunc(g.ONE,g.ONE_MINUS_SRC_ALPHA); g.depthMask(false);
    g.drawArrays(g.TRIANGLES,0,6); g.depthMask(true);
  }
  g.disable(g.BLEND);
  r3Light(R3.prog.main);
  if(R3.statCount){ r3Bind(R3.buf.stat); g.drawArrays(g.TRIANGLES,0,R3.statCount); }
  if(D.v){ r3Bind(R3.buf.dyn); g.drawArrays(g.TRIANGLES,0,D.v); }
  const nt=r3SortTransparent();
  if(nt){
    r3Upload(R3.buf.tr,TRS,nt,g.DYNAMIC_DRAW); r3Bind(R3.buf.tr);
    g.enable(g.BLEND); g.blendFunc(g.ONE,g.ONE_MINUS_SRC_ALPHA); g.depthMask(false);
    g.drawArrays(g.TRIANGLES,0,nt); g.depthMask(true); g.disable(g.BLEND);
  }
  R3.ctx.drawImage(R3.glCv,0,0,R3.W,R3.H);
  R3.stats={stat:R3.statCount/3,dyn:D.v/3,tr:nt/3};
}

/* ── 궤도 카메라 조작 ── */
function bindOrbit(cv,onClick,onHover){
  let down=false,moved=false,lx=0,ly=0,pan=false;
  const toCv=e=>{const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)*cv.width/r.width,y:(e.clientY-r.top)*cv.height/r.height};};
  cv.addEventListener("pointerdown",e=>{down=true;moved=false;pan=(e.button===1||e.button===2||e.shiftKey);lx=e.clientX;ly=e.clientY;try{cv.setPointerCapture(e.pointerId);}catch(_){}});
  cv.addEventListener("pointermove",e=>{
    if(down){ const dx=e.clientX-lx,dy=e.clientY-ly; lx=e.clientX; ly=e.clientY;
      if(Math.abs(dx)+Math.abs(dy)>3) moved=true;
      if(pan){ const s=cam.dist*0.0016, c=Math.cos(cam.yaw), sn=Math.sin(cam.yaw); cam.txT-=dx*s*c; cam.tzT+=dx*s*sn; cam.tyT+=dy*s; }
      else { cam.yawT-=dx*0.006; cam.pitchT=clamp(cam.pitchT+dy*0.005,-0.1,1.5); }
      return; }
    if(onHover) onHover(toCv(e));
  });
  cv.addEventListener("pointerup",e=>{ const wm=moved; down=false; try{cv.releasePointerCapture(e.pointerId);}catch(_){}
    if(!wm&&onClick) onClick(toCv(e)); });
  cv.addEventListener("contextmenu",e=>e.preventDefault());
  cv.addEventListener("wheel",e=>{ e.preventDefault(); cam.distT=clamp(cam.distT*(1+Math.sign(e.deltaY)*0.12),350,26000); },{passive:false});
}
