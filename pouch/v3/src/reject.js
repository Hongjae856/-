/* ═══════════════════════════════════════════════════════════════════
   충전기 공포배출 (11/17 사용자 설명 · 선택)
   커팅 후 정상 제품 = 슈트 → 배출 컨베이어
   불량 = 슈트 입구 게이트가 젖혀져(form.js FM.rejG · anim.js) 커팅 바로 아래로 수직 낙하 → 슈트 안쪽 공포배출 컨베이어 →
          남쪽(기기 끝)으로 이송 → 불량통
   배출 대상 = 옛 IDT 판정과 같음 : 공포(FILLING OFF · 도징 OFF) · 비전 인쇄 NG · 실링 불량(무작위) · 정렬컨베어 OFF
   게이트는 10열 일괄 — 충전기 화면(수동점검 · Input/Output)에 '공포배출실린더' · '공포배출' 이 1계통으로만 있는 것을 근거로 함 (확인 필요)
   라인 클리어런스 : 공포배출 컨베이어 · 불량통 잔량 확인 추가 (사용자 선택)
   ═══════════════════════════════════════════════════════════════════ */
const REJ={ x:FM.xf+.015, y:.40, z0:FL.zc-.43, zEnd:FL.zc+.82, v:.32, items:[], pile:[], n:0, seal:0, cap:220,
  bin:{x0:FM.xf-.05, x1:FM.xf+.23, z0:FL.zc+.77, z1:FL.zc+1.08, h:.30} };
/* 다음 스틱 묶음(10열)의 배출 여부 — sim.js stroke() 판정과 같은 조건 */
function rejDecide(){
  if(typeof S==="undefined"||!S||!S.session||!S.f) return null;
  const f=S.f, fill=f.filling&&f.dose.every(x=>x);
  const pb=!f.prn.saved||!(typeof prnMatch==="function"?prnMatch(f.prn.lot,f.prn.exp):true)||f.headDirty||f.ribbon<5;
  let rej=!fill||(f.vision&&pb)||!(S.p&&S.p.align);
  const sn=(S.cnt&&S.cnt.sealNG)||0; if(sn<REJ.seal) REJ.seal=sn; if(sn>REJ.seal){ REJ.seal=sn; rej=true; }
  return {rej, empty:!fill};
}
function rejLand(z,em){ REJ.items.push({z, em:!!em, f:null}); }
function rejStep(dt){
  for(const it of REJ.items){ if(it.f==null){ it.z+=REJ.v*dt; if(it.z>=REJ.zEnd) it.f=0; } else it.f+=dt; }
  const keep=[]; for(const it of REJ.items){ if(it.f!=null&&it.f>=.3){ rejPile(it); continue; } keep.push(it); }
  REJ.items=keep; rejDraw();
}
/* 불량통 안에 쌓임 : 떨어지는 자리(컨베이어 끝) 둘레로 퍼지고 층층이 올라감 */
function rejPile(it){
  REJ.n++; if(REJ.pile.length>=REJ.cap) return;
  const B=REJ.bin, k=REJ.pile.length, sp=.03+Math.min(.09,k*.0012), r=()=>(Math.random()+Math.random()-1);
  const x=clamp(REJ.x+r()*sp,B.x0+.06,B.x1-.06), z=clamp(B.z0+.11+Math.abs(r())*sp*1.6,B.z0+.06,B.z1-.06);
  REJ.pile.push({x, z, y:.016+Math.min(B.h-.05,Math.floor(k/16)*.007)+Math.random()*.004, ry:Math.random()*Math.PI, rx:(Math.random()-.5)*.2, em:it.em});
}
const rejTop=()=>.016+Math.min(REJ.bin.h-.05,Math.floor(REJ.pile.length/16)*.007);
function rejDraw(){
  if(!REJ.imB) return; const o=REJ.o, e=new T3.Euler();
  let k=0; for(const it of REJ.items){ if(k>=REJ.imB.count0) break;
    if(it.f==null){ o.position.set(REJ.x,REJ.y+.0045,it.z); e.set(0,-Math.PI/2,0); }
    else { const f=Math.min(1,it.f/.3); o.position.set(REJ.x,REJ.y+.0045-(REJ.y-rejTop())*f*f,REJ.zEnd+.07*f); e.set(1.1*f,-Math.PI/2,0); }
    o.rotation.copy(e); o.scale.set(1,it.em?.3:1,1); o.updateMatrix(); REJ.imB.setMatrixAt(k++,o.matrix); }
  REJ.imB.count=k; REJ.imB.instanceMatrix.needsUpdate=true;
  const P=REJ.pile; for(let i=0;i<P.length;i++){ const q=P[i]; o.position.set(q.x,q.y,q.z); o.rotation.set(q.rx,q.ry,0); o.scale.set(1,q.em?.3:1,1); o.updateMatrix(); REJ.imP.setMatrixAt(i,o.matrix); }
  REJ.imP.count=P.length; REJ.imP.instanceMatrix.needsUpdate=true;
}
function rejReset(){
  REJ.items=[]; REJ.pile=[]; REJ.n=0; REJ.seal=(typeof S!=="undefined"&&S&&S.cnt&&S.cnt.sealNG)||0;
  if(typeof AN!=="undefined"&&AN.ld){ Object.assign(AN,{rjF:false,rjT:false,emF:false,emT:false,dec:false,gate:0}); if(FM.rejG) FM.rejG.rotation.z=0; }
  rejDraw();
}
/* 3D : 공포배출 컨베이어 (슈트 안쪽 · 커팅 바로 아래 → 남쪽) · 구동 모터 · 다리 · 불량통 */
function buildReject(sc){
  const g=new T3.Group(); sc.add(g); const x=REJ.x, y=REJ.y, z0=REJ.z0, z1=REJ.zEnd, hw=.04, B=REJ.bin;
  bx(g,x-hw-.015,x+hw+.015,y-.05,y-.006,z0,z1,M.alu);                                         /* 받침 틀 */
  bx(g,x-hw,x+hw,y-.006,y,z0,z1,M.belt);                                                       /* 벨트 */
  for(const s of [-1,1]) bx(g,x+s*(hw+.009)-.004,x+s*(hw+.009)+.004,y,y+.03,z0,z1-.03,M.ss);    /* 옆 가이드 */
  bx(g,x-hw-.013,x+hw+.013,y,y+.03,z0-.006,z0,M.ss);                                           /* 북쪽 끝막이 */
  for(const z of [z0+.02,z1-.02]) rod(g,[x-hw-.016,y-.022,z],[x+hw+.016,y-.022,z],.021,M.ssD,16);   /* 롤러 */
  for(const z of [z0+.14,FL.zc+.45]){ rod(g,[x,.03,z],[x,y-.05,z],.012,M.ssD,10); rod(g,[x,0,z],[x,.03,z],.03,M.ss,16); }   /* 다리 */
  bx(g,x+hw+.015,x+hw+.075,y-.065,y-.005,z0,z0+.09,M.dark); rod(g,[x+hw+.075,y-.035,z0+.045],[x+hw+.1,y-.035,z0+.045],.025,M.blue,16);   /* 구동 모터 (북쪽 끝) */
  /* 불량통 (남쪽 끝 바닥) : 회색 사출 통 · 빨간 표지 */
  const bm=new T3.MeshStandardMaterial({color:0xd5dade,roughness:.55,metalness:.05}), t=.008;
  bx(g,B.x0,B.x1,0,.012,B.z0,B.z1,bm);
  bx(g,B.x0,B.x0+t,0,B.h,B.z0,B.z1,bm); bx(g,B.x1-t,B.x1,0,B.h,B.z0,B.z1,bm); bx(g,B.x0,B.x1,0,B.h,B.z0,B.z0+t,bm); bx(g,B.x0,B.x1,0,B.h,B.z1-t,B.z1,bm);
  for(const [a,b,c,d] of [[B.x0-.006,B.x1+.006,B.z0-.006,B.z0+.012],[B.x0-.006,B.x1+.006,B.z1-.012,B.z1+.006],[B.x0-.006,B.x0+.012,B.z0,B.z1],[B.x1-.012,B.x1+.006,B.z0,B.z1]]) bx(g,a,b,B.h-.012,B.h,c,d,bm);   /* 테두리 */
  plate(g,.2,.07,labelTex([["불 량","#c00",90]],{w:400,h:140,border:"#c00"}),[(B.x0+B.x1)/2,B.h*.6,B.z1+.002],0);
  /* 스틱 : 벨트 위 · 떨어지는 중 / 통 안 */
  REJ.o=new T3.Object3D(); const geo=stickGeo(FM.stickL,FM.stickW,.009);
  REJ.imB=new T3.InstancedMesh(geo,M.stick,90); REJ.imB.count0=90; REJ.imB.count=0; REJ.imB.frustumCulled=false; REJ.imB.castShadow=true; g.add(REJ.imB);
  REJ.imP=new T3.InstancedMesh(geo,M.stick,REJ.cap); REJ.imP.count=0; REJ.imP.frustumCulled=false; g.add(REJ.imP);
  rejDraw();
}
/* 3D 이름표 · 1인칭 장애물 · 새 세션 초기화 */
LBL3.push([REJ.x,.78,REJ.zEnd+.12,"공포배출 컨베이어 · 불량통","F"]);
{ const f0=fpObstacles; fpObstacles=function(){ const L=f0(), B=REJ.bin; L.push([B.x0-.02,B.x1+.02,B.z0-.1,B.z1+.02]); return L; }; }
{ const r0=propsReset; propsReset=function(){ r0(); rejReset(); }; }
/* 라인 클리어런스 추가 : 공포배출 컨베이어 · 불량통 잔량 확인 (사용자 선택 11/17) */
CLEAR.F.push({t:"공포배출 컨베이어 · 불량통 잔량 확인", d:"충전기 슈트 안쪽의 공포배출 컨베이어와 남쪽 끝 불량통에 이전 작업의 파우치가 남아 있지 않은지 확인합니다.", job:"fRejChk", add:true});
WORKVIEW.frej=VW([2.25,1.45,4.75],[3.1,.35,3.35]);
{ const st=[REJ.x+.07,REJ.bin.z1+.2], B=REJ.bin;
  JOBS.fRejChk={stand:st, reach:[REJ.x,REJ.y+.04,REJ.zEnd-.06], dur:1.2, view:"frej",
    seqFn:()=>[{stand:st, reach:[REJ.x,REJ.y+.04,REJ.zEnd-.06], dur:1.2},                           /* 공포배출 컨베이어 끝 */
               {stand:st, reach:[(B.x0+B.x1)/2,.24,(B.z0+B.z1)/2], dur:1.5}]}; }                /* 불량통 안 */
