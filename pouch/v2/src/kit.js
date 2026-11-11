/* ═══ 3D 기본 도구 (Three.js r147) — 단위 m · X 동쪽 · Z 남쪽 · Y 위 ═══ */
const T3=THREE;
const mm=v=>v/1000;
function cvs(w,h,fn){ const c=document.createElement("canvas"); c.width=w; c.height=h; fn(c.getContext("2d"),w,h); return c; }
function tex(c,rx,ry,srgb){ const t=new T3.CanvasTexture(c); t.wrapS=t.wrapT=T3.RepeatWrapping; t.repeat.set(rx||1,ry||1); t.anisotropy=8; if(srgb) t.encoding=T3.sRGBEncoding; return t; }
let SEED=7; const rnd=()=>{ SEED=(SEED*16807)%2147483647; return SEED/2147483647; };
/* 헤어라인 스테인리스 : 가는 결 (거칠기 · 요철) */
const TX={};
TX.hair=tex(cvs(512,512,(g,w,h)=>{ g.fillStyle="#808080"; g.fillRect(0,0,w,h); for(let i=0;i<5200;i++){ const y=rnd()*h, x=rnd()*w, l=40+rnd()*220, v=110+rnd()*70|0; g.strokeStyle=`rgba(${v},${v},${v},.35)`; g.lineWidth=.6+rnd()*.8; g.beginPath(); g.moveTo(x,y); g.lineTo(x+l,y); g.stroke(); } }),2,2);
/* 체크무늬(물방울) 철판 */
TX.checker=tex(cvs(256,256,(g,w,h)=>{ g.fillStyle="#6a6a6a"; g.fillRect(0,0,w,h); const d=(x,y,a)=>{ g.save(); g.translate(x,y); g.rotate(a); const gr=g.createRadialGradient(0,0,1,0,0,26); gr.addColorStop(0,"#f2f2f2"); gr.addColorStop(1,"#6a6a6a"); g.fillStyle=gr; g.beginPath(); g.ellipse(0,0,26,8,0,0,7); g.fill(); g.restore(); };
  for(let j=0;j<4;j++) for(let i=0;i<4;i++){ d(i*64+16,j*64+16,.7); d(i*64+48,j*64+48,-.7); } }),1,1);
TX.floor=tex(cvs(512,512,(g,w,h)=>{ g.fillStyle="#d9ddd2"; g.fillRect(0,0,w,h); for(let i=0;i<900;i++){ const v=205+rnd()*25|0; g.fillStyle=`rgba(${v},${v+4},${v-6},.25)`; g.beginPath(); g.arc(rnd()*w,rnd()*h,6+rnd()*40,0,7); g.fill(); } }),6,4,true);
TX.hazard=tex(cvs(128,128,(g,w,h)=>{ g.fillStyle="#f2c400"; g.fillRect(0,0,w,h); g.fillStyle="#141414"; for(let i=-2;i<4;i++){ g.beginPath(); g.moveTo(i*64,0); g.lineTo(i*64+32,0); g.lineTo(i*64+32+128,128); g.lineTo(i*64+128,128); g.fill(); } }),2,1,true);
TX.foil=tex(cvs(256,256,(g,w,h)=>{ g.fillStyle="#cfd3d6"; g.fillRect(0,0,w,h); g.fillStyle="#b9242c"; for(let j=0;j<4;j++) for(let i=0;i<2;i++){ g.fillRect(i*128+20,j*64+14,88,30); } g.fillStyle="#fff"; g.font="bold 14px sans-serif"; for(let j=0;j<4;j++) for(let i=0;i<2;i++) g.fillText("판콜에이치",i*128+28,j*64+34); }),4,2,true);
function labelTex(lines,o){ o=o||{}; const W=o.w||512,H=o.h||192; return tex(cvs(W,H,(g)=>{ g.fillStyle=o.bg||"#fff"; g.fillRect(0,0,W,H); if(o.bar){ g.fillStyle=o.bar; g.fillRect(0,0,W*.05,H); } if(o.border){ g.strokeStyle=o.border; g.lineWidth=6; g.strokeRect(3,3,W-6,H-6); }
  g.textAlign="center"; g.textBaseline="middle"; const n=lines.length; lines.forEach((l,i)=>{ g.fillStyle=l[1]||"#111"; g.font=`bold ${l[2]||Math.floor(H/(n+.6))}px "Malgun Gothic","Noto Sans KR",sans-serif`; g.fillText(l[0],W/2,H*(i+.5)/n); }); }),1,1,true); }
/* 타공 미끄럼 방지판 (계단 디딤판) */
TX.perf=tex(cvs(128,128,(g,w,h)=>{ g.fillStyle="#8a8a8a"; g.fillRect(0,0,w,h); for(let j=0;j<4;j++) for(let i=0;i<4;i++){ const x=i*32+16+(j%2)*16, y=j*32+16, gr=g.createRadialGradient(x,y,2,x,y,11); gr.addColorStop(0,"#1c1c1c"); gr.addColorStop(.55,"#f4f4f4"); gr.addColorStop(1,"#8a8a8a"); g.fillStyle=gr; g.beginPath(); g.arc(x,y,11,0,7); g.fill(); } }),8,3);
/* ── 재질 ── */
const M={};
M.ss   =new T3.MeshStandardMaterial({color:0xb9bdc0,metalness:1,roughness:.3,envMapIntensity:1.15,roughnessMap:TX.hair,bumpMap:TX.hair,bumpScale:.0006});
M.ssMir=new T3.MeshStandardMaterial({color:0xcdd0d3,metalness:1,roughness:.1,envMapIntensity:1.25});
M.ssD  =new T3.MeshStandardMaterial({color:0x9da2a6,metalness:1,roughness:.45,roughnessMap:TX.hair});
M.deck =new T3.MeshStandardMaterial({color:0xa9adb0,metalness:1,roughness:.42,bumpMap:TX.checker,bumpScale:.0022,roughnessMap:TX.checker});
M.grey =new T3.MeshStandardMaterial({color:0x8d9297,metalness:.1,roughness:.55});
M.dark =new T3.MeshStandardMaterial({color:0x1d2023,metalness:.2,roughness:.5});
M.black=new T3.MeshStandardMaterial({color:0x0c0d0e,metalness:.1,roughness:.6});
M.white=new T3.MeshStandardMaterial({color:0xf2f3f1,metalness:0,roughness:.5});
M.wall =new T3.MeshStandardMaterial({color:0xd3dad5,metalness:0,roughness:.6,envMapIntensity:.35});
M.alu  =new T3.MeshStandardMaterial({color:0xc4c8cb,metalness:.9,roughness:.5});
M.floor=new T3.MeshStandardMaterial({color:0xc6cdbf,map:TX.floor,metalness:0,roughness:.14,envMapIntensity:.85});
M.ceil =new T3.MeshStandardMaterial({color:0xe4e7e4,roughness:.9,envMapIntensity:.2,emissive:0xeef2ee,emissiveIntensity:.5});
M.haz  =new T3.MeshStandardMaterial({map:TX.hazard,roughness:.6});
M.yellow=new T3.MeshStandardMaterial({color:0xf2c400,roughness:.5});
M.orange=new T3.MeshStandardMaterial({color:0xf07a1a,roughness:.5});
M.red  =new T3.MeshStandardMaterial({color:0xc8201c,roughness:.45});
M.blue =new T3.MeshStandardMaterial({color:0x1f5fb8,roughness:.45});
M.green=new T3.MeshStandardMaterial({color:0x1e9a4a,roughness:.45});
M.foil =new T3.MeshStandardMaterial({color:0xffffff,map:TX.foil,metalness:.85,roughness:.28});
M.foilP=new T3.MeshStandardMaterial({color:0xd4d7da,metalness:.95,roughness:.22});
M.acryl=new T3.MeshPhysicalMaterial({color:0xf4f8ff,metalness:0,roughness:.04,transmission:.94,thickness:.008,ior:1.49,transparent:true,opacity:.28,side:T3.DoubleSide,depthWrite:false});
M.acrylEdge=new T3.MeshStandardMaterial({color:0x6a5fd0,roughness:.2,transparent:true,opacity:.75});
M.led  =new T3.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:1.6});
M.scr  =new T3.MeshStandardMaterial({color:0x10202c,emissive:0x2f7fb8,emissiveIntensity:.7,roughness:.2});
M.hose =new T3.MeshStandardMaterial({color:0xe8e8e2,roughness:.5,transparent:true,opacity:.9});
M.hoseB=new T3.MeshStandardMaterial({color:0x2f6fd0,roughness:.5});
M.cloth=new T3.MeshStandardMaterial({color:0xf5f5f0,roughness:.95});
/* ── 형상 ── */
function add(g,m){ m.castShadow=true; m.receiveShadow=true; g.add(m); return m; }
/* 상자 : 최소 · 최대 좌표 (m) */
function bx(g,x0,x1,y0,y1,z0,z1,mat){ const m=new T3.Mesh(new T3.BoxGeometry(Math.abs(x1-x0),Math.abs(y1-y0),Math.abs(z1-z0)),mat); m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2); return add(g,m); }
/* 원통 : 두 점 사이 */
function rod(g,a,b,r,mat,seg){ const A=new T3.Vector3(...a),B=new T3.Vector3(...b),d=B.clone().sub(A),l=d.length(); const m=new T3.Mesh(new T3.CylinderGeometry(r,r,l,seg||14),mat); m.position.copy(A).addScaledVector(d,.5); m.quaternion.setFromUnitVectors(new T3.Vector3(0,1,0),d.normalize()); return add(g,m); }
function cone(g,a,b,r0,r1,mat,seg){ const A=new T3.Vector3(...a),B=new T3.Vector3(...b),d=B.clone().sub(A),l=d.length(); const m=new T3.Mesh(new T3.CylinderGeometry(r1,r0,l,seg||24),mat); m.position.copy(A).addScaledVector(d,.5); m.quaternion.setFromUnitVectors(new T3.Vector3(0,1,0),d.normalize()); return add(g,m); }
/* 사각 뿔대 (위 w1×d1 → 아래 w0×d0, 아래 중심 오프셋 ox,oz) */
function frustum(g,cx,y0,y1,cz,w1,d1,w0,d0,mat,ox,oz){ ox=ox||0; oz=oz||0; const v=[[-w0/2+ox,y0,-d0/2+oz],[w0/2+ox,y0,-d0/2+oz],[w0/2+ox,y0,d0/2+oz],[-w0/2+ox,y0,d0/2+oz],[-w1/2,y1,-d1/2],[w1/2,y1,-d1/2],[w1/2,y1,d1/2],[-w1/2,y1,d1/2]];
  const f=[[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7],[3,2,1,0]], p=[]; for(const q of f){ for(const i of [q[0],q[1],q[2],q[0],q[2],q[3]]) p.push(v[i][0]+cx,v[i][1],v[i][2]+cz); }
  const geo=new T3.BufferGeometry(); geo.setAttribute("position",new T3.Float32BufferAttribute(p,3)); geo.computeVertexNormals(); const m=new T3.Mesh(geo,mat); mat.side=T3.DoubleSide; return add(g,m); }
function tube(g,pts,r,mat){ const c=new T3.CatmullRomCurve3(pts.map(p=>new T3.Vector3(...p))); return add(g,new T3.Mesh(new T3.TubeGeometry(c,Math.max(16,pts.length*10),r,10,false),mat)); }
function plate(g,w,h,t,pos,rotY){ const m=new T3.Mesh(new T3.PlaneGeometry(w,h),new T3.MeshStandardMaterial({map:t,roughness:.6})); m.position.set(...pos); m.rotation.y=rotY||0; g.add(m); return m; }
/* 레벨링 풋 + 기둥 */
function foot(g,x,z,h,r){ rod(g,[x,0,z],[x,.012,z],(r||.05)*1.5,M.ss,20); rod(g,[x,.012,z],[x,h,z],r||.05,M.ss,20); }
/* 리본 : 단면 꺾은선을 한 축으로 늘린 얇은 판 — axis "z" 면 단면은 (x,y), "x" 면 (z,y) */
function ribbon(g,prof,a0,a1,mat,axis){ const p=[],idx=[],n=prof.length; for(let i=0;i<n;i++){ const q=prof[i]; if(axis==="x") p.push(a0,q[1],q[0], a1,q[1],q[0]); else p.push(q[0],q[1],a0, q[0],q[1],a1); if(i<n-1){ const k=i*2; idx.push(k,k+1,k+3, k,k+3,k+2); } }
  const geo=new T3.BufferGeometry(); geo.setAttribute("position",new T3.Float32BufferAttribute(p,3)); geo.setIndex(idx); geo.computeVertexNormals(); return add(g,new T3.Mesh(geo,mat)); }
/* 케이블 체인 : 곡선을 따라 놓인 마디 (up = 마디 폭 방향) */
function chain(g,pts,w,h,mat,up){ const c=new T3.CatmullRomCurve3(pts.map(p=>new T3.Vector3(...p))), n=Math.floor(c.getLength()/.03), im=new T3.InstancedMesh(new T3.BoxGeometry(h,w,.025),mat,n), o=new T3.Object3D(); o.up.set(...(up||[1,0,0]));
  for(let i=0;i<n;i++){ const t=(i+.5)/n, q=c.getPointAt(t); o.position.copy(q); o.lookAt(q.clone().add(c.getTangentAt(t))); o.updateMatrix(); im.setMatrixAt(i,o.matrix); } im.castShadow=true; g.add(im); return im; }
/* 투명 바탕 글자 (스테인리스 면 각인 · 인쇄) */
function textTex(t,col,W,H,size){ return tex(cvs(W,H,(g)=>{ g.clearRect(0,0,W,H); g.fillStyle=col; g.textAlign="center"; g.textBaseline="middle"; g.font=`bold ${size||Math.floor(H*.7)}px Arial,"Malgun Gothic",sans-serif`; g.fillText(t,W/2,H/2); }),1,1,true); }
function decal(g,w,h,t,pos,rotY){ const m=new T3.Mesh(new T3.PlaneGeometry(w,h),new T3.MeshStandardMaterial({map:t,transparent:true,roughness:.5,polygonOffset:true,polygonOffsetFactor:-2})); m.position.set(...pos); m.rotation.y=rotY||0; g.add(m); return m; }
/* 스틱 파우치 : 은박 · 양끝 실링 · 적색 인쇄 — 길이 방향 X */
function stickArt(g,L,W,vert){ if(vert){ g.translate(0,L); g.rotate(-Math.PI/2); } const gr=g.createLinearGradient(0,0,0,W); gr.addColorStop(0,"#b9bdc1"); gr.addColorStop(.5,"#e6e8ea"); gr.addColorStop(1,"#b3b7bb"); g.fillStyle=gr; g.fillRect(0,0,L,W);
  g.strokeStyle="rgba(120,124,128,.8)"; g.lineWidth=1; for(const x0 of [0,L*.92]) for(let x=x0+2;x<x0+L*.08;x+=3){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,W); g.stroke(); }
  g.fillStyle="#b9242c"; g.fillRect(L*.2,W*.14,L*.46,W*.72); g.fillStyle="#fff"; g.font=`bold ${Math.floor(W*.36)}px "Malgun Gothic",sans-serif`; g.textAlign="center"; g.textBaseline="middle"; g.fillText("판콜에이치",L*.43,W*.5);
  g.fillStyle="#555"; g.font=`${Math.floor(W*.2)}px sans-serif`; g.fillText("건조시럽",L*.79,W*.5); }
TX.stick=tex(cvs(256,64,(g)=>stickArt(g,256,64,false)),1,1,true);
TX.strip=tex(cvs(64,256,(g)=>stickArt(g,256,64,true)),1,1,true);
M.stick=new T3.MeshStandardMaterial({map:TX.stick,metalness:.7,roughness:.32,envMapIntensity:1.1});
M.strip=new T3.MeshStandardMaterial({map:TX.strip,metalness:.7,roughness:.32,side:T3.DoubleSide});
M.sheet=new T3.MeshStandardMaterial({color:0xcdd0d3,metalness:1,roughness:.14,envMapIntensity:1.25,side:T3.DoubleSide});
M.belt =new T3.MeshStandardMaterial({color:0x17191b,metalness:0,roughness:.75});
M.warn =new T3.MeshStandardMaterial({color:0xf5d400,roughness:.55});
function stickGeo(L,W,T){ const nu=12,nv=4,p=[],uv=[],idx=[]; for(const s of [1,-1]){ const b=p.length/3; for(let i=0;i<=nu;i++) for(let j=0;j<=nv;j++){ const u=i/nu,v=j/nv, q=Math.min(1,Math.max(0,(u-.08)/.84));
      const th=Math.max(.0005,T/2*Math.pow(Math.sin(Math.PI*q),.55)*(.25+.75*Math.sqrt(1-Math.pow(2*v-1,2)))); p.push((u-.5)*L,s*th,(v-.5)*W); uv.push(u,v); }
    for(let i=0;i<nu;i++) for(let j=0;j<nv;j++){ const a=b+i*(nv+1)+j, c=a+nv+1; if(s>0) idx.push(a,a+1,c+1,a,c+1,c); else idx.push(a,c+1,a+1,a,c,c+1); } }
  const geo=new T3.BufferGeometry(); geo.setAttribute("position",new T3.Float32BufferAttribute(p,3)); geo.setAttribute("uv",new T3.Float32BufferAttribute(uv,2)); geo.setIndex(idx); geo.computeVertexNormals(); return geo; }
/* 두 꺾은선 사이를 메운 평판 (z 고정) */
function fin(g,pa,pb,z,mat){ const p=[],idx=[]; for(let i=0;i<pa.length;i++){ p.push(pa[i][0],pa[i][1],z, pb[i][0],pb[i][1],z); if(i<pa.length-1){ const k=i*2; idx.push(k,k+1,k+3,k,k+3,k+2); } } const geo=new T3.BufferGeometry(); geo.setAttribute("position",new T3.Float32BufferAttribute(p,3)); geo.setIndex(idx); geo.computeVertexNormals(); const m=new T3.Mesh(geo,mat); g.add(m); return m; }
