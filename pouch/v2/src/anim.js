/* ═══ 스틱 흐름 (현장 영상 + 사용자 확정 11/11)
   10열 은박 인출 → 실링 · 무늬 · 커팅 빔 프레싱 → ③ 빔에서 커팅 → 엠보 슈트 미끄러짐 → 고정 칸막이 사이 칸에 안착(TL) →
   바닥 게이트 열림(TD) → 10포 동시 낙하 → 연속 주행하는 금속 U 자 받침에 안착(TG). 안착 순간 받침이 각 열 바로 아래에 오도록 위상을 맞춘다.
   1주기 : 커팅 0 → 칸 안착 TL → 낙하 TD~TG → 은박 인출 .45~.9 → 프레싱 .9~1.06 ═══ */
const AN={ T:1.25, ph:.9, cyc:0, run:true, made:0, TL:.26, TD:.33, TG:.43 };
function initAnim(S){
  const n=FM.n, L=FM.stickL, P=FM.P, pr=FM.chute, cum=[0]; for(let i=1;i<pr.length;i++) cum.push(cum[i-1]+Math.hypot(pr[i][0]-pr[i-1][0],pr[i][1]-pr[i-1][1]));
  AN.Lc=cum[cum.length-1];
  AN.pose=s=>{ if(s<=0) return {x:pr[0][0],y:pr[0][1]-s,tx:0,ty:-1}; let i=1; while(i<pr.length-1&&cum[i]<s) i++; const a=pr[i-1],b=pr[i],l=cum[i]-cum[i-1],f=(s-cum[i-1])/l; return {x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,tx:(b[0]-a[0])/l,ty:(b[1]-a[1])/l}; };
  AN.im=new T3.InstancedMesh(stickGeo(L,FM.stickW,.009),M.stick,n); AN.im.castShadow=true; AN.im.frustumCulled=false; S.add(AN.im);
  AN.o=new T3.Object3D(); AN.ld=new Uint8Array(n).fill(1);
  AN.u0=((CV.zS-FM.pz(0))%P+P)%P;                                         /* 안착 순간 칸 중심 = 열 위치 */
  AN.u=()=>AN.u0+n*P*(AN.cyc+AN.ph-AN.TG);
  { const u=AN.u(), fr=((AN.ph-AN.TG)%1+1)%1, sF=CV.zS-FM.pz(n-1)+n*P*fr-P*.5; for(let k=0;k<CV.N;k++) CV.full[k]=CV.sOf(k,u)>sF?1:0; }
  CV.prev=new Float32Array(CV.N).fill(-1); stepAnim(0);
}
function stepAnim(dt){
  const n=FM.n, L=FM.stickL, P=FM.P, o=AN.o, TL=AN.TL, TD=AN.TD, TG=AN.TG, ez=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
  if(AN.run){ AN.ph+=dt/AN.T; if(AN.ph>=1){ AN.ph-=1; AN.cyc++; AN.ld.fill(0); AN.made+=n; } }
  const t=AN.ph, u=AN.u(), uL=AN.u0+n*P*AN.cyc;
  if(t>=TG) for(let i=0;i<n;i++) if(!AN.ld[i]){ AN.ld[i]=1; CV.full[((Math.round((CV.zS-FM.pz(i)-uL)/P)%CV.N)+CV.N)%CV.N]=1; }       /* 받침 안착 : 열 아래 받침으로 넘김 */
  CV.set(u);
  const yR=FM.gateY+.0052, yC=FM.beltY+CV.hb+.0052;                                   /* 칸 바닥 위 · 받침 위 높이 */
  for(let i=0;i<n;i++){ const z=FM.pz(i); let vis=true;
    if(!AN.ld[i]){ const q=Math.min(1,Math.max(0,t/TL)), sEnd=AN.Lc-.03;
      if(q<.72){ const p=AN.pose(L/2+(sEnd-L/2)*Math.pow(q/.72,2)); o.position.set(p.x+p.ty*.005,p.y-p.tx*.005,z); o.rotation.set(0,0,Math.atan2(p.ty,p.tx)+Math.PI); }
      else if(q<1){ const p=AN.pose(sEnd), f=1-Math.pow(1-(q-.72)/.28,2), a0=Math.atan2(p.ty,p.tx)+Math.PI, x0=p.x+p.ty*.005, yy=p.y-p.tx*.005; o.position.set(x0+(CVX-x0)*f,yy+(yR-yy)*f*f,z); o.rotation.set(0,0,a0*(1-f)); }
      else { const d=Math.min(1,Math.max(0,(t-TD)/(TG-TD))); o.position.set(CVX,yR-(yR-yC)*d*d,z); o.rotation.set(0,0,0); } }      /* 칸에서 잠깐 머문 뒤 바닥이 열리면 수직 낙하 */
    else if(t<.45) vis=false;
    else { const p=AN.pose(-L/2+L*ez((t-.45)/.45)); o.position.set(p.x+p.ty*.005,p.y-p.tx*.005,z); o.rotation.set(0,0,Math.atan2(p.ty,p.tx)+Math.PI); }
    o.scale.setScalar(vis?1:0); o.updateMatrix(); AN.im.setMatrixAt(i,o.matrix); }
  AN.im.instanceMatrix.needsUpdate=true;
  if(FM.stripTex) FM.stripTex.offset.y=AN.cyc+ez((t-.45)/.45);
  if(FM.pressG){ const pr=t>=.9?ez((t-.9)/.06):1-ez((t-.06)/.08); FM.pressG.position.x=FM.press*pr; }                 /* 프레싱 */
  if(FM.flaps){ const op=(t<TD-.02||t>=1)?0:ez((t-(TD-.02))/.05)*(1-ez((t-.54)/.07)); for(const f of FM.flaps) f.pv.rotation.x=f.sg*op*1.45; }   /* 바닥 게이트 */
}
