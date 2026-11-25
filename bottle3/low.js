/* ═══════════════════════════════════════════════════════════════════
   병 IDT 설비 높이 맞춤 (11/25 사용자 지시 「병은 0.15 m 정도 높은 듯 · 현실보다」
   · 결정 「컨베이어 위 구조만 · 충전실 + 포장실」) — 병 IDT 만 (설비 형상 · 이유 : 하드웨어 높이)
   · 병이 지나는 높이(컨베이어 상면 900 mm · 가장 큰 병 + 캡 1,076 mm)까지는 그대로 →
     1,150 ~ 2,000 mm 구간을 0.824 배로 눌러 그 위는 150 mm 내림 (가드 위 1,980 → 1,834 mm)
   · 한 함수(b3Y)를 모든 곳이 같이 씀 : 앱 형상(engine vtx · 빌드 때 이 파일을 앱 문서에도 넣음) ·
     셸 형상(포장실 설비 · 라인 조작 판넬 = b3LowGroup) · 손 목표 · 1인칭 대상 · 리프터
   · 가로 축 둥근 롤 · 릴(실리카겔 릴 · PE 필름 롤 · 설명서 릴)은 찌그러지지 않게 가운데 높이만큼 통째로 옮김
   · 바닥 · 작업 발판(0.38~0.42 m) · 유틸리티(전기판넬 · 압축공기 · 집진기 스위치)는 그대로
   단위 : mm (셸 Three.js 는 m → ×1000 해서 부름)
   ═══════════════════════════════════════════════════════════════════ */
const B3LOW={y0:1150, y1:2000, d:150}; B3LOW.k=1-B3LOW.d/(B3LOW.y1-B3LOW.y0);
function b3Y(y){ return y<=B3LOW.y0?y:y>=B3LOW.y1?y-B3LOW.d:B3LOW.y0+(y-B3LOW.y0)*B3LOW.k; }
function b3Yi(y){ const t1=B3LOW.y1-B3LOW.d; return y<=B3LOW.y0?y:y>=t1?y+B3LOW.d:B3LOW.y0+(y-B3LOW.y0)/B3LOW.k; }   /* 역함수 */
const b3P=p=>p&&[p[0],b3Y(p[1]),p[2]].concat(p.slice(3));
/* 셸 Three.js 형상 묶음을 세계 높이 기준으로 굽기 (m) — skip : 움직이는 묶음(박스 · 파렛트 · 병) */
function b3LowGroup(G,skip){
  if(typeof T3==="undefined"||!G) return 0; skip=skip||[]; G.updateMatrixWorld(true);
  const v=new T3.Vector3(), inv=new T3.Matrix4(), bb=new T3.Box3(), y0=B3LOW.y0/1000, list=[]; let n=0;
  G.traverse(o=>{ if(o.isMesh) list.push(o); });
  for(const o of list){ let s=false; for(let q=o;q&&q!==G.parent;q=q.parent) if(skip.includes(q)) s=true; if(s) continue;
    bb.setFromObject(o); if(bb.max.y<=y0+1e-4) continue;
    const g=o.geometry, P=g.parameters||{}, flat=Math.abs(o.rotation.x)>.1||Math.abs(o.rotation.z)>.1;
    const round=flat&&((g.type==="CylinderGeometry"&&(P.radiusTop||0)>=.1)||(g.type==="TorusGeometry"&&(P.radius||0)>=.1));
    if(round||o.userData.b3Rigid){ const c=o.userData.b3Top||(bb.min.y+bb.max.y)/2; o.position.y+=b3Y(c*1000)/1000-c; n++; continue; }   /* 부모 = 회전 없는 묶음 · b3Top : 기준 높이(위 틀과 틈 유지) */
    const ng=g.clone(), pos=ng.attributes.position; inv.copy(o.matrixWorld).invert();
    for(let i=0;i<pos.count;i++){ v.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld); v.y=b3Y(v.y*1000)/1000; v.applyMatrix4(inv); pos.setXYZ(i,v.x,v.y,v.z); }
    ng.computeVertexNormals(); ng.computeBoundingBox(); ng.computeBoundingSphere(); o.geometry=ng; n++; }
  return n;
}
