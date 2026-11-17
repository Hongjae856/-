/* ═══════════════════════════════════════════════════════════════════
   조작 대상 표시 — 모든 IDT 공통 (파우치 · 블리스터(PTP) · 병, 11/17 사용자 결정)
   · 큰 가상 상자 테두리 · 설비를 투시하는 노란 화살표를 쓰지 않음 (거리감이 없어 헷갈림)
   · 조작 지점 마커 : 실제로 누르는 지점(대상 면 중 눈에 가장 가까운 점 또는 지정 지점 pt)에 작은 원형 마커
       - 다음 작업 = 노란 점 + 고리 (깜박임) · 조준 중 = 초록 고리(손 닿음) / 회색 고리(멂)
       - 깊이 반영 : 설비에 가려지면 마커도 가려짐 (투시 안 함)
       - 화면 밖 : 화면 가장자리에 노란 화살표 + 이름 · 거리
   · 조작 거리 : 손 닿는 거리(가슴 높이에서 대상까지 1.2 m) 안에서만 조작 — 밖이면 '가까이 가세요 (거리)'
   · 사용 : const AM=createAimMark({T3, scene, camera:()=>cam, canvas:()=>canvasEl, unit:1 (m)});
            AM.update({eye:[x,y,z], goal:{c,s,pt,name}|null, aim:{...}|null, now}) → {aimIn, aimDist, goalDist, goalDir}
            대상 형식 : c = 중심 [x,y,z], s = 크기 [w,h,d] (m), pt = 조작 지점(선택), name
   ═══════════════════════════════════════════════════════════════════ */
const AIM_REACH=1.2, AIM_LOOK=6, AIM_CHEST=.3;
function aimNearest(t,p){ return [0,1,2].map(i=>Math.max(t.c[i]-t.s[i]/2,Math.min(t.c[i]+t.s[i]/2,p[i]))); }
/* 손 닿는 거리 : 가슴(눈 - 0.3 m)에서 대상 상자의 가장 가까운 점까지 */
function aimReachDist(t,eye){ const ch=[eye[0],eye[1]-AIM_CHEST,eye[2]], q=t.pt||aimNearest(t,ch); return Math.hypot(q[0]-ch[0],q[1]-ch[1],q[2]-ch[2]); }
function aimInReach(t,eye){ return aimReachDist(t,eye)<=(t.reachMax||AIM_REACH); }
function createAimMark(o){
  const T3=o.T3, sc=o.scene, mat=(c,op)=>new T3.MeshBasicMaterial({color:c,transparent:true,opacity:op,depthTest:true,depthWrite:false,side:T3.DoubleSide});
  const ring=(ri,ro,m)=>{ const x=new T3.Mesh(new T3.RingGeometry(ri,ro,40),m); x.renderOrder=20; return x; };
  const dot=(r,m)=>{ const x=new T3.Mesh(new T3.CircleGeometry(r,28),m); x.renderOrder=21; return x; };
  /* 다음 작업 : 노란 점 + 고리 (테두리 짙은 노랑으로 밝은 배경에서도 보임) */
  const G=new T3.Group(); const gm=mat(0xffd22e,.95), gk=mat(0x7a5600,.9);
  G.add(ring(.62,.8,gk)); G.add(ring(.66,.76,gm)); G.add(dot(.3,gm)); const gd=G.children[2];
  /* 조준 : 초록(손 닿음) · 회색(멂) 고리 */
  const A=new T3.Group(); const am=mat(0x3ddc84,.98), ak=mat(0x0d3b22,.85);
  A.add(ring(.92,1.14,ak)); A.add(ring(.96,1.1,am));
  G.visible=A.visible=false; sc.add(G); sc.add(A);
  /* 화면 가장자리 화살표 */
  const E=document.createElement("div"); E.className="aimEdge"; E.hidden=true;
  E.innerHTML='<i></i><span></span>'; document.body.appendChild(E);
  if(!document.getElementById("aimEdgeCss")){ const st=document.createElement("style"); st.id="aimEdgeCss";
    st.textContent=".aimEdge{position:fixed;z-index:60;pointer-events:none;display:flex;align-items:center;gap:6px;font:800 12.5px 'Malgun Gothic',sans-serif;color:#1d2a36}"+
      ".aimEdge i{width:0;height:0;border-top:11px solid transparent;border-bottom:11px solid transparent;border-left:20px solid #ffd22e;filter:drop-shadow(0 0 1px #7a5600) drop-shadow(0 1px 2px #0006)}"+
      ".aimEdge span{background:#ffd22ef0;border:1px solid #7a5600;border-radius:8px;padding:2px 7px;white-space:nowrap}.aimEdge[hidden]{display:none}";
    document.head.appendChild(st); }
  const v=new T3.Vector3(), U=o.unit||1, occ={};
  /* 조작 지점 : 지정 지점 또는 상자에서 눈에 가장 가까운 점 → 눈 쪽으로 조금 당김(자기 면에 묻히지 않게, 다른 설비에는 가려짐) */
  function pointOf(t,eye){ const p=t.pt||aimNearest(t,eye), d=Math.hypot(eye[0]-p[0],eye[1]-p[1],eye[2]-p[2])||1, k=Math.min(.05,d*.04)/d; return {p:[p[0]+(eye[0]-p[0])*k,p[1]+(eye[1]-p[1])*k,p[2]+(eye[2]-p[2])*k], d}; }
  function place(M,q,cam,size){ M.visible=true; M.position.set(q[0]*U,q[1]*U,q[2]*U); M.quaternion.copy(cam.quaternion); M.scale.setScalar(size*U); }
  const sizeAt=d=>Math.max(.022,Math.min(.13,d*.02));
  /* 가림 판정(선택 · 0.25 초마다) : o.occluded(eye, point) */
  function hidden(t,eye,q,now){ if(!o.occluded) return false; const k=t.id||t.name||"?"; const c=occ[k];
    if(c&&now-c.t<250) return c.v; let r=false; try{ r=!!o.occluded(eye,q); }catch(e){} occ[k]={t:now,v:r}; return r; }
  function dirOf(cam,q){ cam.updateMatrixWorld(); v.set(q[0]*U,q[1]*U,q[2]*U).applyMatrix4(cam.matrixWorldInverse); const a=Math.atan2(v.x,-v.z);
    return {a, behind:v.z>0, txt:Math.abs(a)<.35?"↑ 앞":Math.abs(a)>2.4?"↓ 뒤":a<0?"← 왼쪽":"→ 오른쪽"}; }
  function edge(cam,q,name,dist){
    const cv=o.canvas&&o.canvas(); if(!cv){ E.hidden=true; return false; } const R=cv.getBoundingClientRect(); if(R.width<50){ E.hidden=true; return false; }
    v.set(q[0]*U,q[1]*U,q[2]*U).project(cam); const dz=dirOf(cam,q); let x=v.x, y=v.y;
    if(!dz.behind&&Math.abs(x)<=.96&&Math.abs(y)<=.92){ E.hidden=true; return false; }   /* 화면 안 : 화살표 없음 */
    if(dz.behind){ x=-x; y=-y; if(Math.hypot(x,y)<1e-3){ x=0; y=-1; } }
    const s=1/Math.max(Math.abs(x)/.9,Math.abs(y)/.82,1e-6); x*=s; y*=s;
    const px=R.left+(x*.5+.5)*R.width, py=R.top+(1-(y*.5+.5))*R.height, ang=Math.atan2(-y*R.height,x*R.width);
    E.hidden=false; E.style.flexDirection=Math.cos(ang)<0?"row":"row-reverse"; E.firstChild.style.transform="rotate("+ang+"rad)";
    const w=E.offsetWidth||120, h=E.offsetHeight||24;   /* 화살표 · 이름이 3D 화면 안에 머물게 */
    E.style.left=Math.max(R.left+6,Math.min(R.right-w-6,px-w/2))+"px"; E.style.top=Math.max(R.top+6,Math.min(R.bottom-h-6,py-h/2))+"px";
    E.lastChild.textContent=name+" · "+dist.toFixed(1)+" m"; return true; }
  return {
    update(a){
      const cam=o.camera(), eye=a.eye, now=a.now||performance.now(), out={aimIn:false,aimDist:null,goalDist:null,goalDir:"",aimHidden:false};
      if(!cam||!eye||a.off){ G.visible=A.visible=false; E.hidden=true; return out; }
      if(a.goal){ const {p,d}=pointOf(a.goal,eye); out.goalDist=aimReachDist(a.goal,eye); out.goalDir=dirOf(cam,p).txt;
        place(G,p,cam,sizeAt(d)); const pu=.72+.28*Math.sin(now/180); G.children[1].material.opacity=.95*pu; gd.material.opacity=.95*pu;
        if(!a.hideEdge) edge(cam,p,a.goal.name||"다음 작업",out.goalDist); else E.hidden=true;
      } else { G.visible=false; E.hidden=true; }
      if(a.aim){ const {p,d}=pointOf(a.aim,eye); out.aimDist=aimReachDist(a.aim,eye); out.aimIn=out.aimDist<=(a.aim.reachMax||AIM_REACH);
        out.aimHidden=!out.aimIn&&hidden(a.aim,eye,p,now);
        if(out.aimHidden) A.visible=false; else { place(A,p,cam,sizeAt(d)); const c=out.aimIn?0x3ddc84:0xb8c0c8; A.children[1].material.color.setHex(c); A.children[0].material.color.setHex(out.aimIn?0x0d3b22:0x39424b); }
      } else A.visible=false;
      return out; },
    hide(){ G.visible=A.visible=false; E.hidden=true; },
    pointOf, reachDist:aimReachDist, inReach:aimInReach
  };
}
