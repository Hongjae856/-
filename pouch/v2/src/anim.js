/* ═══ 스틱 흐름 : 10열 은박 인출 → 가로 실링 → 커팅 → 곡면 슈트 미끄러짐 → 배출 컨베이어 10칸에 1포씩 안착 →
       컨베이어 10칸 전진 (칸막이 · 스틱이 한 몸으로 이동). 1주기 = 커팅 0 → 안착 .35 → 전진 .4~.85 · 인출 .45~.9 → 실링 ═══ */
const AN={ T:1.25, ph:.9, cyc:0, run:true, u0:.03, made:0 };
function initAnim(S){
  const n=FM.n, L=FM.stickL, pr=FM.chute, cum=[0]; for(let i=1;i<pr.length;i++) cum.push(cum[i-1]+Math.hypot(pr[i][0]-pr[i-1][0],pr[i][1]-pr[i-1][1]));
  AN.Lc=cum[cum.length-1];
  /* 슈트 위 거리 s → 점 · 접선 (s<0 은 커터 위 수직 구간) */
  AN.pose=s=>{ if(s<=0) return {x:pr[0][0],y:pr[0][1]-s,tx:0,ty:-1}; let i=1; while(i<pr.length-1&&cum[i]<s) i++; const a=pr[i-1],b=pr[i],l=cum[i]-cum[i-1],f=(s-cum[i-1])/l; return {x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,tx:(b[0]-a[0])/l,ty:(b[1]-a[1])/l}; };
  AN.im=new T3.InstancedMesh(stickGeo(L,FM.stickW,.009),M.stick,n); AN.im.castShadow=true; AN.im.frustumCulled=false; S.add(AN.im);
  AN.o=new T3.Object3D(); AN.ld=new Uint8Array(n); AN.dl=[...Array(n)].map((_,i)=>((i*7)%5)*.006);
  for(let k=0;k<CV.N;k++){ const s=((k*FM.P+AN.u0)%(CV.N*FM.P)); CV.full[k]=s>CV.zS-FM.pz(0)?1:0; }
  CV.prev=new Float32Array(CV.N).fill(-1); stepAnim(0);
}
function stepAnim(dt){
  const n=FM.n, L=FM.stickL, P=FM.P, o=AN.o, ez=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
  if(AN.run){ AN.ph+=dt/AN.T; if(AN.ph>=1){ AN.ph-=1; AN.cyc++; AN.ld.fill(0); AN.made+=n; } }
  const t=AN.ph, u=AN.u0+n*P*(AN.cyc+ez((t-.4)/.45));
  if(AN.cyc>0&&t<.4) for(let i=0;i<n;i++) if(!AN.ld[i]&&t>=AN.dl[i]+.33){ AN.ld[i]=1; CV.full[((Math.round((CV.zS-FM.pz(i)-P/2-u)/P)%CV.N)+CV.N)%CV.N]=1; }   /* 열마다 안착 순간에 칸으로 넘김 */
  CV.set(u);
  for(let i=0;i<n;i++){ const z=FM.pz(i); let vis=true;
    if(AN.cyc>0&&t<.4){ const q=Math.min(1,Math.max(0,(t-AN.dl[i])/.33)), sEnd=AN.Lc-.02;
      if(q<.7){ const p=AN.pose(L/2+(sEnd-L/2)*Math.pow(q/.7,2)); o.position.set(p.x+p.ty*.005,p.y-p.tx*.005,z); o.rotation.set(0,0,Math.atan2(p.ty,p.tx)+Math.PI); }
      else { const p=AN.pose(sEnd), f=1-Math.pow(1-(q-.7)/.3,2), a0=Math.atan2(p.ty,p.tx)+Math.PI; o.position.set(p.x+p.ty*.005+(CVX-p.x-p.ty*.005)*f,(p.y-p.tx*.005)+(FM.beltY+.0052-(p.y-p.tx*.005))*f*f,z); o.rotation.set(0,0,a0*(1-f)); }
      if(q>=1) vis=false; }
    else if(t<.45) vis=false;
    else { const p=AN.pose(-L/2+L*ez((t-.45)/.45)); o.position.set(p.x+p.ty*.005,p.y-p.tx*.005,z); o.rotation.set(0,0,Math.atan2(p.ty,p.tx)+Math.PI); }
    o.scale.setScalar(vis?1:0); o.updateMatrix(); AN.im.setMatrixAt(i,o.matrix); }
  AN.im.instanceMatrix.needsUpdate=true;
  if(FM.stripTex) FM.stripTex.offset.y=AN.cyc+ez((t-.45)/.45);
}
