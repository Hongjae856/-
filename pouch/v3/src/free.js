/* ═══════════════════════════════════════════════════════════════════
   자유모드 (11/17 사용자 지시 · 선택)
   · 순서 · 감점 · 평가 없음 : 단계 목록 없음 · 정기 공정검사(IPC) 자동 시작 없음 · 채점 관리 숨김
   · 설비 인터록 해제 (사용자 선택 — 실제와 다름) : 운전 중 조작 금지 · 전원 순서 · RUN / START / JOG 조건 · 안전도어 · 공기압 알람 등
     (build.py PATCH 의 !FREE() 조건). 재료가 없어 생기는 상황(은박 없음 · 주성분 없음 · 라벨 없음)과 비상정지 버튼은 그대로
   · 문 · 덮개 자유 개폐 : 충전기 안전도어 · 2번 호퍼 뚜껑 · 충전실 남쪽 양개문 2 · 카토너 아크릴 문 3 · 포장실 북쪽 출입문
   · 한 라인 공유 · 상단 작업자 교체(crew.js) · 시작은 두 실 모두 전원 OFF
   ═══════════════════════════════════════════════════════════════════ */
const FREE=()=>!!S&&S.mode==="free";
MODE_NM.free="자유모드";
function freeStart(r){ $("#splash").classList.add("hide"); startSession("free",r); toast(CREW_RNM[r]+" · 자유모드 — 순서 · 감점 없음 · 인터록 해제 · 문 · 덮개 자유 개폐","good"); }
/* 두 실 모두 전원 OFF (과정 모드의 '다른 실 자동 운전' 설정을 되돌림) */
function freeBlank(){ const keep=S; initState(); const z=S; S=keep; S.f=z.f; S.p=z.p; S.hop=z.hop; S.cnt=z.cnt; S.alarms=[]; S.activeTrouble=null; S.recovery=null;
  Object.assign(S.flags,{ctDoor:[0,0,0], rdoor:{}, lid2:"on", bagsEmpty:false}); if(typeof lineInit==="function") lineInit(); }
/* 정상 운전 상태로 : 두 실 설비를 모두 켜고 라인 가동 */
function freeRunAll(){ presetPackAuto(); presetFillAuto(); Object.assign(S.p,{align:true, ctRun:true, sfRun:true}); Object.assign(S.f,{run:true, started:true, filling:true, door:"closed", emg:false, link:true});
  S.alarms=[]; S.activeTrouble=null; S.recovery=null; S.flags.lid2="on"; S.flags.ctDoor=[0,0,0]; freeAfter(); toast("두 실 설비 ON · 라인 정상 운전","good"); }
function freeOff(){ freeBlank(); freeAfter(); toast("두 실 모두 전원 OFF · 초기 상태"); }
function freeAfter(){ buildStatic(); drawHMI(); renderTiles(); renderCoach(); }
{ const s0=startSession; startSession=function(m,r){ s0(m,r); if(m==="free"){ freeBlank(); freeAfter(); } }; }

/* ── 순서 · 감점 · 평가 없음 ── */
{ const f0=STEPS; STEPS=function(){ return FREE()?[]:f0(); }; }
{ const f0=deduct; deduct=function(k,why){ if(FREE()) return; return f0(k,why); }; }
{ const f0=ipcCheck; ipcCheck=function(){ if(FREE()) return; return f0(); }; }
{ const f0=finishSession; finishSession=function(manual){ if(FREE()){ goHome(); return; } return f0(manual); }; }
{ const f0=renderCoach; renderCoach=function(){ f0(); freeCoach(); }; }
function freeCoach(){
  const on=!!S&&!!S.session&&FREE(); let b=$("#freeBar");
  if(!b){ const lc=$("#lcCheck"); if(!lc) return; lc.insertAdjacentHTML("afterend",'<div id="freeBar" style="display:none"><button data-fa="run">▶ 정상 운전 상태로</button><button data-fa="off">■ 전체 OFF 초기화</button></div>'); b=$("#freeBar");
    $$("#freeBar [data-fa]").forEach(x=>x.onclick=()=>{ if(!FREE()) return; if(x.dataset.fa==="run") freeRunAll(); else freeOff(); }); }
  b.style.display=on?"":"none"; const rb=$("#rubricBtn"); if(rb) rb.style.display=on?"none":"";
  if(!on) return;
  const c=$("#coach"); if(S.activeTrouble||S.ipc.open) return;
  c.className="free";
  $("#cStep").textContent="자유모드 · "+CREW_RNM[S.room];
  $("#cTitle").textContent="순서 · 감점 · 평가 없음 — 무엇이든 조작해 보세요";
  $("#cDesc").textContent="설비 인터록이 해제되어 있습니다 (실제와 다름). 문 · 덮개는 누르면 열리고 닫힙니다. 상단 [🧍 충전실 작업자 · 🧍 포장실 작업자] 로 같은 라인의 다른 작업장으로 바꿉니다.";
  $("#stepCur").textContent="자유"; $("#endBtn").textContent="자유모드 종료";
}

/* ── 설비 인터록 해제 ── */
{ const f0=fillerBlockers; fillerBlockers=function(){ return FREE()?[]:f0(); }; }
{ const f0=ctBlockers; ctBlockers=function(){ return FREE()?[]:f0(); }; }

/* ── 문 · 덮개 ── */
const FREE_DOOR={
  F:[["frLid","🫙","2번 호퍼 뚜껑",()=>S.flags.lid2==="off"?"들어내 난간에 세움":"덮음 · 클램프 체결",()=>{ S.flags.lid2=S.flags.lid2==="off"?"on":"off"; }],
     ["frDF0","🚪","충전실 남쪽 출입문 (서)",()=>freeDoorOpen("f0")?"열림":"닫힘",()=>freeDoorTog("f0")],
     ["frDF1","🚪","충전실 남쪽 출입문 (동)",()=>freeDoorOpen("f1")?"열림":"닫힘",()=>freeDoorTog("f1")]],
  P:[0,1,2].map(k=>["frCt"+k,"🚪","카토너 아크릴 문 "+(k+1),()=>(S.flags.ctDoor||[])[k]?"열림":"닫힘",()=>{ if(!S.flags.ctDoor) S.flags.ctDoor=[0,0,0]; S.flags.ctDoor[k]=S.flags.ctDoor[k]?0:1; }])
     .concat([["frDP0","🚪","포장실 북쪽 출입문",()=>freeDoorOpen("p0")?"열림":"닫힘",()=>freeDoorTog("p0")]])
};
const freeDoorOpen=k=>!!(S.flags.rdoor&&S.flags.rdoor[k]);
function freeDoorTog(k){ if(!S.flags.rdoor) S.flags.rdoor={}; S.flags.rdoor[k]=!S.flags.rdoor[k]; }
const HOPL=()=>({yt:FL.deckY+1.294, zc:FL.zc});
/* 작업자 동선 (3인칭) · 1인칭 조작 위치 */
{ const H=HOPL(), ct=k=>{ const D=typeof PK2!=="undefined"&&PK2.ctDoors&&PK2.ctDoors[k]; return D?[D.G.position.x+.03,(D.a+D.b)/2]:[3.93,-3.28-k*.85]; };
  Object.assign(JOBS,{
    frLid:{stand:[XF,3.95], deck:true, reach:[XF,H.yt,H.zc+.2], dur:1.2},
    frDF0:{stand:[1.2,6.45], reach:[1.15,1.06,6.9], dur:.9}, frDF1:{stand:[8.8,6.45], reach:[8.75,1.06,6.9], dur:.9},
    frDP0:{stand:[6.9,-15.4], reach:[7.25,1.06,-15.9], dur:.9} });
  for(const k of [0,1,2]) JOBS["frCt"+k]={stand:[3.92,-3.28-k*.85], reach:[3.93,1.05,-3.28-k*.85], dur:.9};
  FREE_DOOR.ctz=ct; }
for(const r of ["F","P"]) for(const [id,e,b,s,fn] of FREE_DOOR[r]) TILE[id]={e,b,s,on:()=>false,click(){ act(id,()=>{ fn(); toast(b+" — "+s()); buildStatic(); }); }};
/* 자유모드에서만 왼쪽 타일 목록에 문 · 덮개 추가 */
function freeTiles(fn){ if(!FREE()) return fn(); const T=TILESET[S.room], keep=T.mat; T.mat=keep.concat(FREE_DOOR[S.room].map(x=>x[0])); try{ return fn(); } finally{ T.mat=keep; } }
{ const b0=buildTiles, r0=renderTiles; buildTiles=function(){ return freeTiles(b0); }; renderTiles=function(){ return freeTiles(r0); }; }
/* 1인칭 조작 대상 */
{ const d0=fpTargetDefs; fpTargetDefs=function(){ const T=d0(); if(!FREE()) return T;
    const add=(id,nm,p,w,h,d)=>T.push(TB(id,nm,p,w,h,d,()=>TILE[id].click(),["#"+id]));
    if(S.room==="F"){ const H=HOPL(); add("frLid","2번 호퍼 뚜껑 (들어냄 · 덮음)",S.flags.lid2==="off"?[XF+1.2,FL.deckY+.5,4.05]:[XF,H.yt+.03,H.zc],.6,.25,.9);
      add("frDF0","충전실 남쪽 출입문 (서)",[1.2,1.05,6.93],1.0,2.0,.12); add("frDF1","충전실 남쪽 출입문 (동)",[8.8,1.05,6.93],1.0,2.0,.12); }
    else { for(const k of [0,1,2]){ const q=FREE_DOOR.ctz(k); add("frCt"+k,"카토너 아크릴 문 "+(k+1),[q[0],.95,q[1]],.1,.9,.7); }
      add("frDP0","포장실 북쪽 출입문",[6.9,1.05,-15.93],1.0,2.0,.12); }
    return T; }; }
/* 출입문 열림 · 닫힘 그림 (자유모드가 아니면 늘 닫힘) */
function freeDraw(dt){ const L=window.RDOOR||[]; for(const d of L){ const tg=(FREE()&&S.session&&S.session.active&&freeDoorOpen(d.key))?1.45:0; d.ang+=Math.max(-dt*1.8,Math.min(dt*1.8,tg-d.ang)); d.G.rotation.y=d.s*d.ang; } }
