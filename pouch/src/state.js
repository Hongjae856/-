/* ═══════════════════════════════════════════════════════════════════
   상태
   ═══════════════════════════════════════════════════════════════════ */
let S=null;                 /* 라인 · 교육 상태 */
let tSim=0;                 /* 시뮬레이션 누적 시간 (s, 배속 반영) */
let SPD=1;                  /* 배속 */
let RDT=0;                  /* 실제 프레임 시간 (s) */

function initState(){
  S={
    room:"F", mode:null, session:null, tIdx:0, stepAt:0, stepLog:[], deducts:[], hintUsed:0, clear:[],
    doc:{fIn:false, semi:false, pIn:false, matOut:false, fOut:false, pOut:false},
    /* ── 충전기 ── */
    f:{main:false, airV:[false,false], dustV:false, panel:false, user:null, lgOpen:false,
       airP:0, heat:20, heatSV:182, endSV:[159,145,101,100],
       ibc:[false,false,false],                 /* 이송기 1·2·3 */
       mainLift:false, mainFed:false,
       roll:"plain", rollCarry:null,            /* plain : 무지 은박 · red : 적색 인쇄 은박 · none */
       prn:{exp:"", lot:"", saved:false}, jogDone:false, printOk:false,
       visChk:false, vision:false, tempChk:false, regChk:false, hopChk:false, linkChk:false,
       link:true, dose:[true,true,true], run:false, filling:false, stopping:false, buzzer:true,
       leak:{sampled:false, ok:false}, emg:false, door:"closed",
       chute:0, headDirty:false, ribbon:100, alnBad:false, dial:{add:0,main:0,sug:0},
       spm:30, phase:0, strokes:0, offStroke:0},
    hop:{add:0, main:0, sug:0},                 /* 호퍼 레벨 % */
    /* ── 포장실 ── */
    p:{ctMain:false, sfSw:false, ctAir:false, hm:false, hmT:20, cwPow:false, xrPow:false, xrBoot:0, xrKey:false,
       prMain:false, prPow:false, ctUser:false, sfUser:false, mag:0, leaf:0,
       vsUser:false, vsMode:false, vsRun:false, lbl:{lot:"", exp:"", saved:false, loaded:false}, prRun:false,
       xrPre:false, xrX:false, xrCal:false, xrConv:false, xrTest:false,
       cwProd:false, cwChk:false, cwRun:false, ctIcon:false, ctRun:false, sfIcon:false, sfRun:false,
       align:false, ink:100, nozzleBad:false, leafBad:false, xrForeign:0},
    cnt:{pouch:0, empty:0, toPack:0, carton:0, good:0, rejCt:0, rejVs:0, rejXr:0, rejCw:0, cases:0, target:PROD.target},
    cwLast:null, cwSum:0, cwN:0, xrLast:"-",
    ipc:{round:0, done:0, open:false, cur:null, res:{}, doseSet:null},
    alarms:[], hist:[], activeTrouble:null, recovery:null,
    flags:{}
  };
}
initState();
