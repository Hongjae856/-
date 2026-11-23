/* ═══════════════════════════════════════════════════════════════════
   정적 형상 묶어 그리기 (세 IDT 공통 · 11/23 최적화) — 화면 · 동작 변화 없음
   · 움직이지 않는 불투명 메시를 「최상위 묶음 + 재질 + 그림자 설정 + 정점 속성」별로 한 형상으로 합쳐 그리기 호출을 줄인다
     (파우치 프레임당 약 8,300 회 → 수백 회). 원본 메시는 장면에 그대로 두고(위치 · 손 목표 · 광선 판정은 원본 기준) 그리기만 뺀다.
   · 안전장치 : 묶인 메시 또는 그 상위 객체의 위치 · 회전 · 크기 · 보임 · 부모 · 재질 · 형상 · 그림자 설정 중 하나라도 바뀌면
     그 프레임 그리기 전에 해당 묶음을 풀고(원본 그리기 복귀) 바뀐 객체 아래는 이후 묶지 않는다 → 움직이는 부품은 항상 원본으로 보인다.
   · 제외 : 반투명 · 다중 재질 · 인스턴스 · 스키닝 · 모프 · 접선 · 그리기 범위 지정 · 수동 행렬 · 그리기 순서 지정 · 사용자 깊이 재질
   · 호출 : 매 프레임 그리기 직전 idtBatch(scene) — 처음 IDT_BATCH.warm ms(3 프레임 이상) 동안 움직인 객체는 처음부터 제외
   ═══════════════════════════════════════════════════════════════════ */
const IDT_BATCH={on:true, warm:3000, layer:30, stat:{batches:0, members:0, rebuilds:0}};
(function(){                                                     /* 광선 판정은 원본(묶음 층)도 맞히게 — 합친 형상은 판정 제외 */
  if(typeof THREE==="undefined") return; const P=THREE.Raycaster.prototype;
  for(const k of ["intersectObject","intersectObjects"]){ const f=P[k]; P[k]=function(){ this.layers.enable(IDT_BATCH.layer); return f.apply(this,arguments); }; }
})();
function _ibSig(g){ return Object.keys(g.attributes).sort().map(n=>{ const a=g.attributes[n]; return n+a.itemSize+(a.normalized?"n":"")+a.array.constructor.name; }).join("|"); }
function _ibOk(o,sc,B){
  if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||o.userData.__ib) return false;
  const m=o.material, g=o.geometry; if(!m||Array.isArray(m)||m.transparent||!m.visible||o.renderOrder!==0) return false;
  if(o.customDepthMaterial||o.customDistanceMaterial||o.layers.mask!==1||!o.matrixAutoUpdate) return false;
  if(!g||!g.attributes.position||g.attributes.tangent||Object.keys(g.morphAttributes||{}).length) return false;
  if(g.drawRange.start!==0||g.drawRange.count!==Infinity||g.attributes.position.isInterleavedBufferAttribute) return false;
  for(const n in g.attributes) if(g.attributes[n].isInterleavedBufferAttribute) return false;
  for(let q=o;q;q=q.parent){ if(!q.visible||B.dyn.has(q)||!q.matrixAutoUpdate) return false; if(q===sc) return true; }
  return false;                                                  /* 장면에 붙어 있지 않음 */
}
function _ibSnap(o){ return [o.position.x,o.position.y,o.position.z,o.quaternion.x,o.quaternion.y,o.quaternion.z,o.quaternion.w,o.scale.x,o.scale.y,o.scale.z]; }
function _ibRefs(o){ const g=o.geometry; return [o.visible,o.parent,o.material,g,o.castShadow,o.receiveShadow,o.renderOrder,o.matrixAutoUpdate,
  g&&g.attributes.position?g.attributes.position.version:0, g&&g.index?g.index.version:0, g&&g.attributes.normal?g.attributes.normal.version:0]; }
/* 묶음 하나 만들기 : 세계 좌표로 굽고(법선 = 법선 행렬) 거울 변환이면 감김 방향을 뒤집는다 */
function _ibMerge(list){
  const g0=list[0].geometry, names=Object.keys(g0.attributes); let nv=0, ni=0;
  for(const o of list){ const g=o.geometry; nv+=g.attributes.position.count; ni+=g.index?g.index.count:g.attributes.position.count; }
  const out=new THREE.BufferGeometry(), A={};
  for(const n of names){ const a=g0.attributes[n]; A[n]=new a.array.constructor(nv*a.itemSize); }
  const idx=new Uint32Array(ni), v=new THREE.Vector3(), nm=new THREE.Matrix3(); let ov=0, oi=0;
  for(const o of list){ const g=o.geometry, cnt=g.attributes.position.count, M=o.matrixWorld; nm.getNormalMatrix(M); const flip=M.determinant()<0;
    for(const n of names){ const a=g.attributes[n], s=a.itemSize, dst=A[n];
      if(n==="position"){ for(let i=0;i<cnt;i++){ v.fromBufferAttribute(a,i).applyMatrix4(M); dst[(ov+i)*3]=v.x; dst[(ov+i)*3+1]=v.y; dst[(ov+i)*3+2]=v.z; } }
      else if(n==="normal"){ for(let i=0;i<cnt;i++){ v.fromBufferAttribute(a,i).applyMatrix3(nm).normalize(); dst[(ov+i)*3]=v.x; dst[(ov+i)*3+1]=v.y; dst[(ov+i)*3+2]=v.z; } }
      else dst.set(a.array.subarray(0,cnt*s),ov*s); }
    if(g.index){ const I=g.index.array, k=g.index.count; for(let i=0;i<k;i+=3){ idx[oi+i]=I[i]+ov; idx[oi+i+1]=I[i+(flip?2:1)]+ov; idx[oi+i+2]=I[i+(flip?1:2)]+ov; } oi+=k; }
    else { for(let i=0;i<cnt;i+=3){ idx[oi+i]=ov+i; idx[oi+i+1]=ov+i+(flip?2:1); idx[oi+i+2]=ov+i+(flip?1:2); } oi+=cnt; }
    ov+=cnt; }
  for(const n of names){ const a=g0.attributes[n]; out.setAttribute(n,new THREE.BufferAttribute(A[n],a.itemSize,a.normalized)); }
  out.setIndex(new THREE.BufferAttribute(idx,1)); out.computeBoundingSphere(); out.computeBoundingBox();
  const m=new THREE.Mesh(out,list[0].material); m.castShadow=list[0].castShadow; m.receiveShadow=list[0].receiveShadow;
  m.matrixAutoUpdate=false; m.raycast=()=>{}; m.userData.__ib=true; m.name="idtBatch"; return m;
}
function _ibBuild(sc,B,members){                                 /* members 를 묶음 키별로 합쳐 장면에 넣는다 */
  const K=new Map();
  for(const o of members){ let t=o; while(t.parent&&t.parent!==sc) t=t.parent;
    const k=t.id+"/"+o.material.uuid+"/"+(o.castShadow?1:0)+(o.receiveShadow?1:0)+"/"+_ibSig(o.geometry); if(!K.has(k)) K.set(k,[]); K.get(k).push(o); }
  for(const list of K.values()){ if(list.length<2) continue;
    const mesh=_ibMerge(list); sc.add(mesh); const b={mesh, list, mat:list[0].material}; B.batches.push(b);
    for(const o of list){ o.layers.set(IDT_BATCH.layer); B.of.set(o,b); } }
}
function _ibWatch(B){                                            /* 감시 대상 = 묶인 메시 + 그 상위 객체 전부 */
  const W=new Set(); for(const b of B.batches) for(const o of b.list) for(let q=o;q;q=q.parent){ if(W.has(q)) break; W.add(q); }
  B.W=[...W]; B.N=new Float64Array(B.W.length*10); B.R=B.W.map(_ibRefs); B.W.forEach((o,i)=>B.N.set(_ibSnap(o),i*10));
  IDT_BATCH.stat.batches=B.batches.length; IDT_BATCH.stat.members=B.batches.reduce((a,b)=>a+b.list.length,0);
}
function _ibUnbatch(sc,B,b){ for(const o of b.list){ o.layers.set(0); B.of.delete(o); } sc.remove(b.mesh); b.mesh.geometry.dispose(); B.batches.splice(B.batches.indexOf(b),1); }
function idtBatch(sc){
  if(!IDT_BATCH.on||!sc) return; let B=sc.userData.__ib;
  if(!B){ B=sc.userData.__ib={f:0, t0:performance.now(), built:false, dyn:new WeakSet(), pre:new Map(), batches:[], of:new Map(), W:[], N:null, R:[]};
    sc.traverse(o=>B.pre.set(o,[_ibSnap(o).join(),_ibRefs(o)])); }
  B.f++;
  if(!B.built&&(B.f<3||performance.now()-B.t0<IDT_BATCH.warm)) return;
  if(!B.built){ B.built=true;                                      /* 준비 기간에 바뀐 객체는 처음부터 제외 */
    for(const [o,[s,r]] of B.pre){ const r2=_ibRefs(o); if(_ibSnap(o).join()!==s||r.some((x,i)=>x!==r2[i])) B.dyn.add(o); } B.pre=null;
    sc.updateMatrixWorld(true); const mem=[]; sc.traverse(o=>{ if(_ibOk(o,sc,B)) mem.push(o); }); _ibBuild(sc,B,mem); _ibWatch(B); return; }
  /* 매 프레임 : 바뀐 객체 찾기 */
  const W=B.W, N=B.N, R=B.R; let hit=null;
  for(let i=0;i<W.length;i++){ const o=W[i], j=i*10, p=o.position, q=o.quaternion, s=o.scale, r=R[i], g=o.geometry;
    if(p.x!==N[j]||p.y!==N[j+1]||p.z!==N[j+2]||q.x!==N[j+3]||q.y!==N[j+4]||q.z!==N[j+5]||q.w!==N[j+6]||s.x!==N[j+7]||s.y!==N[j+8]||s.z!==N[j+9]
      ||o.visible!==r[0]||o.parent!==r[1]||o.material!==r[2]||g!==r[3]||o.castShadow!==r[4]||o.receiveShadow!==r[5]||o.renderOrder!==r[6]||o.matrixAutoUpdate!==r[7]
      ||(g&&g.attributes.position&&g.attributes.position.version!==r[8])||(g&&g.index&&g.index.version!==r[9])||(g&&g.attributes.normal&&g.attributes.normal.version!==r[10])){ (hit||(hit=[])).push(o); } }
  for(const b of B.batches) if(b.mat.transparent||!b.mat.visible){ (hit||(hit=[])).push(b.list[0]); b.matDyn=true; }
  if(!hit) return;
  /* 바뀐 객체 아래 메시가 든 묶음을 풀고, 남은 메시만 다시 묶는다 */
  for(const o of hit) B.dyn.add(o);
  const isDyn=o=>{ for(let q=o;q;q=q.parent) if(B.dyn.has(q)) return true; return false; };
  const redo=[]; for(const b of B.batches.slice()){ if(b.matDyn||b.list.some(isDyn)){ _ibUnbatch(sc,B,b); if(!b.matDyn) for(const o of b.list) if(!isDyn(o)) redo.push(o); } }
  sc.updateMatrixWorld(true); _ibBuild(sc,B,redo.filter(o=>_ibOk(o,sc,B))); _ibWatch(B); IDT_BATCH.stat.rebuilds++;
}
