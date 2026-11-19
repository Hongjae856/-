/* ═══════════════════════════════════════════════════════════════════
   물리 동작 현실성 전수 점검 반영 (11/17 사용자 지적 : 비현실적인 동작을 모두 잡을 것)
   점검 기준 : ① 닫힌 덮개 · 문을 통과해 손을 넣지 않음 ② 들고 가는 물건의 출처 · 행선지가 있음
              ③ 점검 단계가 엉뚱한 곳으로 가지 않음 ④ 점검만 하는 단계에서 실제 작업(투입 · 제거)을 하지 않음
   ① 라인 클리어런스 · 호퍼 내부 확인 : 호퍼 1 · 3 = 끝면 점검창으로 확인 / 호퍼 2 = 클램프 해제 → 뚜껑 들어 확인 → 덮고 체결
      (이전 : 투입 작업(scoop)으로 처리 — 점검만 할 단계에서 뚜껑이 닫힌 채 손을 넣음)
   ② 라인 클리어런스 · 경사 컨베이어 잔량 : 배출 컨베이어(경사부) 앞에서 확인 (이전 : 기밀도 시험대로 감)
   ③ 라인 클리어런스 · 무지 롤 장착 확인 : 롤러를 보기만 함 (이전 : 롤 제거 작업 · 보조 작업자까지 출동)
   ④ 주성분 투입 : 리프터 발판(원료투입구 너머) 봉투에서 스쿱으로 떠서 호퍼에 부음 · 다 쓰면 봉투가 비워짐 (이전 : 봉투와 무관하게 스쿱이 나타남)
   ⑤ 기밀도 시험 : 배출 컨베이어에서 시료를 꺼내 시험대로 (이전 : 빈손으로 시험대)
   ⑥ 적색 롤 제거 : 대차를 가져와 롤을 빼서 대차에 싣고 보관 자리로 가져가 예비 팔레트에 내려 둠 (이전 : 롤이 사라짐)
   ⑦ 컷팅 날 세척 : 아크릴 함 아래 커팅 빔 높이로 (이전 : 닫힌 아크릴 문 안쪽 1.35 m 로 손을 넣음)
   ⑧ 포장실 카톤 · 설명서 · 잉크 : 라인 동쪽 자재 대차에서 집어 와 투입 · 회수한 카톤은 자재 대차로 (이전 : 빈손에서 자재가 나타남 · 회수품이 사라짐)
   ⑨ 포장실 불량배출부 잔량 확인 : 카토너 불량 배출부 → 케이스 프린터 리젝터 함 (이전 : 프린터 전원 스위치로 감)
   ⑩ 포장실 정렬부 · 카토너 내부 확인 : 정렬부 → 카토너 내부를 투명 문 너머로 확인 (이전 : 스틱공급장치 스위치로 손을 뻗음)
   ═══════════════════════════════════════════════════════════════════ */
Object.assign(ANC,{ stage:[5.12,.78,-3.0], prRej:[CVX+.38,.62,-6.42], cutBeam:[2.88,.80,ZC] });
JOBS.front.reach=ANC.cutBeam;                                                         /* ⑦ */
const HOPG=()=>({yt:FL.deckY+1.294, D:.42, zc:FL.zc, w1:[XF-.29,FL.deckY+.79,FL.zc+.43], w3:[XF+.29,FL.deckY+.79,FL.zc+.43]});
/* ① 호퍼 내부 확인 */
function seqHopChk(){ const H=HOPG();
  return [{stand:[XF-.29,3.55], deck:true, reach:H.w1, dur:1.4},                                    /* 1번 끝면 점검창 */
    {stand:[XF+.29,3.55], deck:true, reach:H.w3, dur:1.4},                                          /* 3번 끝면 점검창 */
    {stand:[XF,3.55], deck:true, reach:[XF,H.yt-.03,H.zc+H.D+.02], dur:.9},                          /* 2번 남쪽 클램프 */
    {stand:[XF,1.62], deck:true, reach:[XF,H.yt-.03,H.zc-H.D-.02], dur:.9},                          /* 2번 북쪽 클램프 */
    {stand:[XF,3.55], deck:true, reach:[XF,H.yt,H.zc+.2], dur:1.6, on(){ S.flags.lid2="up"; }},    /* 뚜껑을 들어 안을 봄 */
    {stand:[XF,3.55], deck:true, reach:[XF,H.yt,H.zc+.2], dur:.8, on(){ S.flags.lid2="on"; }},
    {stand:[XF,3.55], deck:true, reach:[XF,H.yt-.03,H.zc+H.D+.02], dur:.7},
    {stand:[XF,1.62], deck:true, reach:[XF,H.yt-.03,H.zc-H.D-.02], dur:.7}]; }
/* ④ 주성분 투입 : 뚜껑 들어냄 + 리프터 발판 봉투에서 스쿱 */
function seqScoop2(){ const H=HOPG(), lx=XF+1.2, lean=[lx,FL.deckY+.5,4.0], bag=[XF,FL.deckY+.16,4.62];
  return [
    {stand:[XF,3.95], deck:true, reach:[XF,H.yt-.03,H.zc+H.D+.02], dur:1.0},
    {stand:[XF,1.62], deck:true, reach:[XF,H.yt-.03,H.zc-H.D-.02], dur:1.0},
    {stand:[XF,3.95], deck:true, reach:[XF,H.yt,H.zc+.2], dur:.9, on(w){ S.flags.lid2="carry"; w.carry="lid"; }},
    {stand:[lx,3.75], deck:true, reach:lean, dur:.8, on(w){ S.flags.lid2="off"; w.carry=null; }},
    {stand:[XF,3.95], deck:true, carry:"scoop", reach:bag, dur:1.3},                                  /* 원료투입구 너머 발판의 봉투에서 뜸 */
    {stand:[XF,3.95], deck:true, reach:ANC.hop2, dur:1.4},                                            /* 호퍼에 부음 */
    {stand:[XF,3.95], deck:true, reach:bag, dur:1.3},
    {stand:[XF,3.95], deck:true, reach:ANC.hop2, dur:1.4, on(){ S.flags.bagsEmpty=true; }},
    {stand:[lx,3.75], deck:true, carry:null, reach:lean, dur:.8, on(w){ S.flags.lid2="carry"; w.carry="lid"; }},
    {stand:[XF,3.95], deck:true, reach:[XF,H.yt,H.zc+.2], dur:1.0, on(w){ S.flags.lid2="on"; w.carry=null; }},
    {stand:[XF,3.95], deck:true, reach:[XF,H.yt-.03,H.zc+H.D+.02], dur:.8},
    {stand:[XF,1.62], deck:true, reach:[XF,H.yt-.03,H.zc-H.D-.02], dur:.8}]; }
/* ⑤ 기밀도 시험 */
function seqLeak(){ return [{stand:[2.3,2.42], reach:ANC.ipcTake, dur:1.6}, {stand:[1.05,1.9], carry:"tray", reach:ANC.leak, dur:2.0}]; }
/* ⑥ 적색 롤 제거 → 대차 → 예비 팔레트 */
function seqReturnRoll(){ const L=[];
  if(S.flags.cartAt!=="unw"){ L.push({stand:[9.34,5.9], reach:[9.64,.9,5.9], dur:.8, grab:"cart"}); L.push({stand:[4.62,4.18], path:[[9.5,5.3],[7.5,4.9],[4.62,4.9]], dur:.5, release:true, on(){ S.flags.cartAt="unw"; }}); }
  L.push({stand:[5.25,FL.zc+.15], path:[[5.3,4.3],[5.3,3.2]], reach:ANC.roll, dur:2.4, on(w){ w.carry="roll"; S.f.roll="none"; }});
  L.push({stand:[4.62,4.18], path:[[5.3,3.2],[5.3,4.3]], reach:[4.62,.85,3.62], dur:1.2, on(w){ w.carry=null; propVis("cart_red",true); }});
  L.push({stand:[4.62,4.18], reach:[4.62,.9,3.92], dur:.6, grab:"cart"});
  L.push({stand:[9.54,6.05], path:[[4.62,4.9],[7.5,4.9],[8.6,6.05]], dur:.4, release:true, on(){ S.flags.cartAt="home"; }});
  L.push({stand:[9.54,6.05], reach:[10.1,.85,6.05], dur:1.0, on(w){ w.carry="roll"; propVis("cart_red",false); }});
  L.push({stand:[10.75,5.4], reach:[10.95,.45,5.95], dur:1.4, on(w){ w.carry=null; S.flags.redTaken=false; propVis("pal_red",true); }});
  return L; }
/* ⑧ 포장실 자재 */
const seqStage=(carry,leg)=>[{stand:[4.72,-3.0], reach:ANC.stage, dur:1.1, on(w){ w.carry=carry; }}, leg];
/* ⑨ ⑩ 포장실 점검 */
function seqRejChk(){ return [{stand:[3.9,-5.1], reach:ANC.ctRej, dur:1.4}, {stand:[3.7,-6.42], reach:ANC.prRej, dur:1.4}]; }
function seqCtChk(){ return [{stand:[3.98,-.95], reach:ANC.sfAlign, dur:1.4}, {stand:[3.85,-3.3], reach:ANC.ctForm, dur:1.6}]; }

Object.assign(JOBS,{
  hopChk:{stand:[XF-.29,3.55], deck:true, reach:HOPG().w1, dur:1.4, view:"hopper", seqFn:seqHopChk},
  convChk:{stand:[2.25,1.05], reach:[2.72,1.0,.95], dur:1.8, view:"conv"},
  rollChk:{stand:[5.25,ZC+.15], reach:ANC.roll, dur:1.8, view:"roll"},
  rejChk:{stand:[3.9,-5.1], reach:ANC.ctRej, dur:1.4, seqFn:seqRejChk},
  ctChk:{stand:[3.98,-.95], reach:ANC.sfAlign, dur:1.4, seqFn:seqCtChk} });
JOBS.scoop.seqFn=seqScoop2; JOBS.leak.seqFn=seqLeak; JOBS.rollOut.seqFn=seqReturnRoll; if(!ROLLJOBS.includes("rollOut")) ROLLJOBS.push("rollOut");
JOBS.mag.seqFn=()=>seqStage("cartons",{stand:[3.8,-3.17], reach:ANC.mag, dur:2.2});
JOBS.leaf.seqFn=()=>seqStage("leaf",{stand:[3.8,-2.45], reach:ANC.leaf, dur:2.0});
JOBS.ink.seqFn=()=>seqStage("ink",{stand:[3.65,-5.85], reach:ANC.prHead, dur:2.6});
JOBS.magOut.seqFn=()=>[{stand:[3.8,-3.6], reach:ANC.magOut, dur:2.0, on(w){ w.carry="cartons"; }}, {stand:[4.72,-3.0], reach:ANC.stage, dur:1.0, on(w){ w.carry=null; }}];
/* 라인 클리어런스 작업 연결 정정 */
CLEAR.F[0].job="hopChk"; CLEAR.F[1].job="rollChk"; CLEAR.F[2].job="convChk";
CLEAR.P[0].job="ctChk"; CLEAR.P[3].job="rejChk";
CLEAR.F[0].d="2층 데크에서 호퍼 1 · 3 은 끝면 점검창으로, 호퍼 2 는 토글 클램프를 풀고 뚜껑을 들어 내부에 이전 반제품이 남아 있지 않은지 확인합니다.";
CLEAR.P[0].d="스틱공급장치 정렬부와 카토너 내부(투명 문 너머 · 하단 배출부 포함)에 파우치가 남아 있지 않은지 확인합니다.";
/* 3D : 들어 올린 뚜껑(점검) · 빈 봉투 */
{ const d0=lidDraw; lidDraw=function(){ d0(); if(typeof FM==="undefined"||!FM.lid2) return; const st=S&&S.session&&S.session.active?S.flags.lid2:null;
    if(st==="up"){ const L=FM.lid2; L.userData.st="up"; L.rotation.set(0,0,0); L.position.set(0,.28,.12); } }; }
{ const p0=propsDraw; propsDraw=function(){ p0(); if(typeof FILLPROP!=="undefined"&&FILLPROP.bagsOn&&S&&S.flags&&S.flags.bagsEmpty) FILLPROP.bagsOn.visible=false; }; }
/* ⑧ 포장실 자재 대차 (라인 동쪽 · 카토너 옆) : 접은 카톤 묶음 · 설명서 상자 · 잉크 카트리지 */
function buildStaging(sc){
  const g=new T3.Group(); sc.add(g); const x0=4.95, x1=5.55, z0=-3.42, z1=-2.58, y=.62;
  bx(g,x0,x1,y-.03,y,z0,z1,M.ss); bx(g,x0,x1,.2,.22,z0,z1,M.ss); for(const x of [x0+.03,x1-.03]) for(const z of [z0+.03,z1-.03]){ rod(g,[x,.08,z],[x,y,z],.012,M.ssMir,10); rod(g,[x,.03,z],[x,.08,z],.03,M.dark,12); }
  rod(g,[x1,y+.25,z0+.05],[x1,y+.25,z1-.05],.012,M.ssMir,10); for(const z of [z0+.05,z1-.05]) rod(g,[x1-.01,y,z],[x1,y+.25,z],.012,M.ssMir,10);
  const red=new T3.MeshStandardMaterial({color:0x9a1a14,roughness:.6}), kr=new T3.MeshStandardMaterial({color:0xb48a5a,roughness:.85});
  for(let i=0;i<3;i++) bx(g,x0+.06,x0+.36,y+i*.05,y+.045+i*.05,z0+.06,z0+.38,red);                                   /* 접은 카톤 묶음 */
  bx(g,x0+.05,x0+.4,y,y+.18,z1-.36,z1-.06,kr);                                                                        /* 설명서 상자 */
  for(let i=0;i<2;i++) rod(g,[x1-.12,y,z1-.12-i*.12],[x1-.12,y+.16,z1-.12-i*.12],.035,M.white,16);                   /* 잉크 카트리지 */
}

/* ⑪ 카토너 내부 조치(푸셔 · 윤활 · 카톤 성형부 · 클로징 센서 · 핫멜트 노즐) : 아크릴 문을 열고 → 안쪽(카톤 체인 쪽)에서 작업 → 문을 닫음
      (이전 : 닫힌 아크릴 문 바깥면에 손을 댄 채 작업) */
const CTX=3.12;                                                               /* 카톤 체인 · 내부 작업 위치 x */
function ctDoorOf(z){ const D=(typeof PK2!=="undefined"&&PK2.ctDoors)||[]; let k=D.findIndex(d=>z>d.a-.02&&z<d.b+.02); if(k<0){ const zz=[-3.28,-4.13,-4.98]; k=zz.reduce((bi,v,i)=>Math.abs(v-z)<Math.abs(zz[bi]-z)?i:bi,0); } return k; }
function seqCtDoor(st,inside,dur){ const k=ctDoorOf(inside[2]), D=PK2&&PK2.ctDoors&&PK2.ctDoors[k], a=D?D.a:inside[2]-.4, h=[3.36,1.05,a+.06];
  if(!S.flags.ctDoor) S.flags.ctDoor=[0,0,0];
  return [{stand:[st[0],a+.15], reach:h, dur:.8, on(){ S.flags.ctDoor[k]=1; }},
          {stand:st, reach:inside, dur}, {stand:[st[0],a+.15], reach:[3.95-.03,1.05,a+.1], dur:.8, on(){ S.flags.ctDoor[k]=0; }}]; }
{ const IN={pusher:[CTX,1.0,-3.9], lube:[CTX,.95,-3.95], ctForm:[CTX,1.15,-3.3], closing:[CTX,1.0,-4.45], hmClean:[CTX,1.0,-4.75]};
  for(const [k,p] of Object.entries(IN)) if(JOBS[k]){ const J=JOBS[k], st=J.stand, du=J.dur; J.reach=p; J.seqFn=()=>seqCtDoor(st,p,du); } }
function ctDoorDraw(dt){
  if(typeof PK2==="undefined"||!PK2.ctDoors) return; const O=(S&&S.session&&S.session.active&&S.flags.ctDoor)||[0,0,0];
  PK2.ctDoors.forEach((d,i)=>{ const tg=O[i]?-1.75:0; d.ang+=Math.max(-dt*2,Math.min(dt*2,tg-d.ang)); d.G.rotation.y=d.ang; }); }

/* ⑫ 세척 · 윤활 조치 : 청소 도구(70 % 에탄올 분무기 · 와이퍼 · 윤활유)를 가져와 작업하고 제자리에 둠
      충전실 = 저울 작업대 2 위 · 포장실 = 자재 대차 위 (이전 : 빈손으로 세척) */
Object.assign(ANC,{ kitF:[0.42,0.93,2.28], kitP:[5.12,0.80,-2.72] });
const KITJ=["sensorF","front","prClean","sfIn","hmClean","closing","lube"];
function withKit(key){ const J=JOBS[key], P=J.stand[1]<0, kit=P?ANC.kitP:ANC.kitF, ks=P?[4.72,-2.72]:[1.05,2.28];
  const base=J.seqBase?J.seqBase():[{stand:J.stand, reach:J.reach, dur:J.dur}];
  return [{stand:ks, reach:kit, dur:.8, on(w){ w.carry="wipe"; }}].concat(base,[{stand:ks, reach:kit, dur:.7, on(w){ w.carry=null; }}]); }
for(const k of KITJ) if(JOBS[k]){ const J=JOBS[k]; if(J.seqFn) J.seqBase=J.seqFn; J.seqFn=()=>withKit(k); }
idtCarryDef("wipe",{mk:G=>{       /* 세척 키트 (분무병 · 천) */
    const bt=new T3.Mesh(new T3.CylinderGeometry(.028,.03,.16,16),M.white); bt.position.y=.03; G.add(bt);
    const cap=new T3.Mesh(new T3.BoxGeometry(.03,.04,.05),M.blue); cap.position.set(0,.13,.01); G.add(cap);
    const cl=new T3.Mesh(new T3.BoxGeometry(.1,.01,.08),new T3.MeshStandardMaterial({color:0xe8eef2,roughness:.9})); cl.position.set(.08,-.02,0); G.add(cl); }});
function buildKits(sc){ const g=new T3.Group(); sc.add(g);
  for(const [x,y,z] of [ANC.kitF,ANC.kitP]){ rod(g,[x-.05,y-.03,z],[x-.05,y+.13,z],.03,M.white,16); bx(g,x-.065,x-.035,y+.13,y+.17,z-.02,z+.03,M.blue);
    bx(g,x+.0,x+.14,y-.03,y+.05,z-.06,z+.06,new T3.MeshStandardMaterial({color:0x3a7bd5,roughness:.6})); rod(g,[x+.1,y-.03,z+.09],[x+.1,y+.1,z+.09],.022,M.yellow,14); } }
