/* ═══ 스틱 흐름 : 10열 은박 인출 → 실링 → ③ 빔에서 커팅 → 엠보 슈트 미끄러짐 → 지나가는 받침 칸 10개에 1포씩 안착.
   배출 컨베이어는 연속 주행 (1주기에 10칸 전진) — 안착 순간에 칸이 각 열 바로 아래에 오도록 위상을 맞춘다.
   1주기 : 커팅 0 → 안착 TL → 은박 인출 .45~.9 → 실링 ═══ */
const AN={ T:1.25, ph:.9, cyc:0, run:true, made:0, TL:.33 };
function initAnim(S){
  const n=FM.n, L=FM.stickL, P=FM.P, pr=FM.chute, cum=[0]; for(let i=1;i<pr.length;i++) cum.push(cum[i-1]+Math.hypot(pr[i][0]-pr[i-1][0],pr[i][1]-pr[i-1][1]));
  AN.Lc=cum[cum.length-1];
  AN.pose=s=>{ if(s<=0) return {x:pr[0][0],y:pr[0][1]-s,tx:0,ty:-1}; let i=1; while(i<pr.length-1&&cum[i]<s) i++; const a=pr[i-1],b=pr[i],l=cum[i]-cum[i-1],f=(s-cum[i-1])/l; return {x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,tx:(b[0]-a[0])/l,ty:(b[1]-a[1])/l}; };
  AN.im=new T3.InstancedMesh(stickGeo(L,FM.stickW,.009),M.stick,n); AN.im.castShadow=true; AN.im.frustumCulled=false; S.add(AN.im);
  AN.o=new T3.Object3D(); AN.ld=new Uint8Array(n).fill(1);
  AN.u0=((CV.zS-FM.pz(0))%P+P)%P;                                         /* 안착 순간 칸 중심 = 열 위치 */
  AN.u=()=>AN.u0+n*P*(AN.cyc+AN.ph-AN.TL);
  { const u=AN.u(), fr=((AN.ph-AN.TL)%1+1)%1, sF=CV.zS-FM.pz(n-1)+n*P*fr-P*.5; for(let k=0;k<CV.N;k++) CV.full[k]=CV.sOf(k,u)>sF?1:0; }
  CV.prev=new Float32Array(CV.N).fill(-1); stepAnim(0);
}
function stepAnim(dt){
  const n=FM.n, L=FM.stickL, P=FM.P, o=AN.o, TL=AN.TL, ez=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
  if(AN.run){ AN.ph+=dt/AN.T; if(AN.ph>=1){ AN.ph-=1; AN.cyc++; AN.ld.fill(0); AN.made+=n; } }
  const t=AN.ph, u=AN.u(), uL=AN.u0+n*P*AN.cyc;
  if(t>=TL) for(let i=0;i<n;i++) if(!AN.ld[i]){ AN.ld[i]=1; CV.full[((Math.round((CV.zS-FM.pz(i)-uL)/P)%CV.N)+CV.N)%CV.N]=1; }       /* 안착 : 열 아래 칸으로 넘김 */
  CV.set(u);
  const yL=FM.beltY+CV.hb+.0052;
  for(let i=0;i<n;i++){ const z=FM.pz(i); let vis=true;
    if(!AN.ld[i]){ const q=Math.min(1,Math.max(0,t/TL)), sEnd=AN.Lc-.03;
      if(q<.72){ const p=AN.pose(L/2+(sEnd-L/2)*Math.pow(q/.72,2)); o.position.set(p.x+p.ty*.005,p.y-p.tx*.005,z); o.rotation.set(0,0,Math.atan2(p.ty,p.tx)+Math.PI); }
      else { const p=AN.pose(sEnd), f=1-Math.pow(1-(q-.72)/.28,2), a0=Math.atan2(p.ty,p.tx)+Math.PI, x0=p.x+p.ty*.005, yy=p.y-p.tx*.005; o.position.set(x0+(CVX-x0)*f,yy+(yL-yy)*f*f,z); o.rotation.set(0,0,a0*(1-f)); } }
    else if(t<.45) vis=false;
    else { const p=AN.pose(-L/2+L*ez((t-.45)/.45)); o.position.set(p.x+p.ty*.005,p.y-p.tx*.005,z); o.rotation.set(0,0,Math.atan2(p.ty,p.tx)+Math.PI); }
    o.scale.setScalar(vis?1:0); o.updateMatrix(); AN.im.setMatrixAt(i,o.matrix); }
  AN.im.instanceMatrix.needsUpdate=true;
  if(FM.stripTex) FM.stripTex.offset.y=AN.cyc+ez((t-.45)/.45);
}
