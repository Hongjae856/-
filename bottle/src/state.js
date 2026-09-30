/* ═══════════════════════════════════════════════════════════════════
   상태
   ═══════════════════════════════════════════════════════════════════ */
let S=null;                 /* 라인 · 교육 상태 */
let tSim=0;                 /* 시뮬레이션 누적 시간 (s, 배속 반영) */
let SPD=1;                  /* 배속 */
let RDT=0;                  /* 실제 프레임 시간 (s) */
const MAT_CAP={bottle:400, gel:600, tab:0, film:500, cap:600};   /* 정제 용량은 품목별로 계산 */

function recipeOf(prodK,countK,ml){
  const p=PRODUCTS.find(x=>x.k===prodK), c=COUNTS.find(x=>x.k===countK), b=BOTTLES.find(x=>x.ml===ml);
  const n=c.n, tol=tolTabs(n);
  return {prod:p, count:c, bottle:b, n, tol, unit:p.unit/1000, netStd:n*p.unit/1000, netTol:tol*p.unit/1000,
          tareStd:b.tare+b.gel, tareTol:Math.max(0.35,b.gel*0.45), label:p.nm+" "+c.k+" · "+b.ml+"ml"};
}
function initState(){
  S={
    mode:null, course:"operation", session:null, tIdx:0, stepAt:0, stepLog:[], deducts:[], hintUsed:0,
    /* 유틸리티 */
    air:false, airP:0, main:false, dust:false, door:"closed", doorOpens:0, emg:false,
    /* HMI */
    user:null, lvl:0,
    /* 품목 · 속도 */
    rc:recipeOf("A","30T",30), recipeApplied:false, bpm:60,
    /* 운전 */
    running:false, started:false, stopping:false, cycleStop:false, jog:0,
    /* 자재 (수량) */
    mat:{bottle:0, gel:0, tab:0, film:0, cap:0},
    reject:{n:0, cap:30, list:[]}, table:{n:0, cap:48, total:0},
    /* 기종 설정 · 상태 */
    ua:{air:false, vac:false, ion:true, ttRun:false, elev:false, jam:false},
    sg:{pitch:40, sensor:true, markBad:false, fed:0},
    dmc:{vib:[55,65,78], gateDelay:0.15, dirt:new Array(12).fill(0), bridge:false, checked:false, buf:[0,0], cnt:new Array(12).fill(0), total:0, err:0},
    wc:{zero:[false,false], off:[0.62,-0.48], drift:[0.0009,-0.0007], checked:false, log:[], consec:0, tare:null, gross:null, net:null, judge:null,
        nOK:0, nNG:0, sumNet:0, nNet:0, lastTare:null},
    pe:{heat:false, sv:165, pv:24, len:60, sensor:true, fed:0},
    rcp:{torque:12, feed:true, checked:false, jam:false, torqueBad:false},
    /* 생산 */
    cnt:{good:0, reject:0, target:40, filled:0, tabs:0, bottlesIn:0},
    alarms:[], hist:[], activeTrouble:null, recovery:null, qcase:null,
    flags:{}
  };
  S.wc.checked=false;
}
function matCap(k){ return k==="tab"?Math.max(3000,S.rc.n*60):MAT_CAP[k]; }
function matPct(k){ return clamp(S.mat[k]/matCap(k)*100,0,100); }
initState();
