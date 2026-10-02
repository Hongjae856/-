/* ═══════════════════════════════════════════════════════════════════
   연동 버스 (셸 문서) — 연결 컨베이어 · 스태커 · 생산 연동
   · 두 방 iframe 은 parent.ROOMBUS 로 같은 상태를 읽고 쓴다(같은 출처 srcdoc).
   · 공용 좌표 : mm, x = 칸막이 벽 중심 0(+x 포장실), y = 바닥 0, z = 라인 중심 0(+z 작업자 쪽)
   · 연결 컨베이어 위의 팩은 경로 길이 s(mm)로 관리하는 축적(accumulation) 컨베이어다.
     앞 팩과 간격(PITCH)보다 가까워지면 멈춰 줄을 선다 → 실제 버퍼.
   · 연동 ON  : 충전기 양품 → 연결 컨베이어 → 스태커 → 카토너 버킷 1칸에 N팩.
                팩이 모자라면 빈 버킷(카톤·설명지 미공급), 컨베이어가 차면 충전기 '후공정 대기'.
     연동 OFF : 각 방 교육과정은 기존처럼 단독(가상 공급). 컨베이어는 충전기가 낸 팩만 보여 주고
                끝에서 스태커로 들어가 사라진다(적체 없음).
   ═══════════════════════════════════════════════════════════════════ */
const ROOMBUS=(function(){
  /* ── 배치 (mm) ── */
  const L={
    wallX:0, wallT:120,                 /* 칸막이 벽 중심 · 두께 */
    backZ:-2800, frontZ:4400,           /* 뒷벽 · 방 앞쪽 끝(단면) */
    wallH:3000,                         /* 벽 높이 (천장 없음) */
    dMinX:-9200, gMaxX:15600,           /* 충전실 왼쪽 끝 · 포장실 오른쪽 끝 */
    hole:{z0:-430, z1:-30, y0:1140, y1:1460},   /* 벽 개구부 (컨베이어 통과) */
    beltW:150,                          /* 연결 컨베이어 벨트 폭 */
    fillerZ:-230                        /* 충전기 라인 중심 z — 카토너 버킷 레인(z −230)과 일직선 */
  };
  /* 경로 : 충전기 배출 컨베이어 끝 → 벽 개구부 → 카토너 스태커 매거진 상부 — 충전기 배출 높이 그대로 수평 직선 */
  const KEY=[
    {x:-1296, y:1290, z:-230},          /* 충전기 배출 컨베이어 끝 (충전기 X 596) */
    {x:2500,  y:1290, z:-230}           /* 스태커 매거진 왼쪽 가장자리 (카토너 X −1100) */
  ];
  const SAMP=[];
  (function(){
    for(let i=0;i<=40;i++){ const t=i/40; SAMP.push({x:KEY[0].x+(KEY[1].x-KEY[0].x)*t,y:KEY[0].y,z:KEY[0].z,s:0}); }
    for(let i=1;i<SAMP.length;i++){ const a=SAMP[i-1],b=SAMP[i];
      b.s=a.s+Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z); }
  })();
  const LEN=SAMP[SAMP.length-1].s;
  function at(s){
    s=Math.max(0,Math.min(LEN,s));
    let lo=0,hi=SAMP.length-1;
    while(hi-lo>1){ const m=(lo+hi)>>1; if(SAMP[m].s<=s) lo=m; else hi=m; }
    const a=SAMP[lo],b=SAMP[hi],t=(s-a.s)/Math.max(1e-6,b.s-a.s);
    const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,dl=Math.hypot(dx,dy,dz)||1;
    return {x:a.x+dx*t,y:a.y+dy*t,z:a.z+dz*t,tx:dx/dl,ty:dy/dl,tz:dz/dl};
  }

  /* ── 팩 · 컨베이어 매개변수 ── */
  const PACK={l:120,w:100,h:16};        /* 연결 컨베이어 위 PTP 팩 (mm) */
  const PITCH=128;                      /* 축적 시 팩 간격 */
  const EMIT_GAP=150;                   /* 투입 최소 간격 */
  const V=900;                          /* 벨트 속도 mm/s (시뮬 시간) */
  const TCAP=11;                        /* 스태커 매거진 적재 한도 */
  const CAP=Math.floor(LEN/PITCH);      /* 컨베이어 축적 한도 */

  const st={
    link:false,                         /* 연동 가동 중 */
    packs:[],                           /* {id,s} — s 큰 쪽이 앞(스태커 쪽) */
    tower:0, q:0, wait:false,
    N:2, ppm:0, cpm:0, emitted:0, taken:0, empty:0, cartons:0,
    fillerRun:false, lineRun:false, lastEnd:0, dropT:0, id:0,
    spd:1
  };
  /* 실측 공급속도 : 최근 12 초(시뮬 시간) 동안 충전기에서 들어온 팩 수 → 팩/분
     (공칭값 대신 실측을 쓰므로 PC 성능 때문에 시뮬레이션이 느려져도 카토너가 공급에 맞춘다) */
  const WIN=12; let T=0, hist=[], rate=0, linkT=0;
  function reset(){
    st.packs.length=0; st.tower=0; st.q=0; st.wait=false;
    st.emitted=st.taken=st.empty=st.cartons=0; st.dropT=0; hist=[]; rate=0; linkT=0;
  }
  /* 충전기 → 버스 : 양품 증가분 */
  function emit(n){ if(n>0){ st.q+=n; hist.push([T,n]); } }
  /* 카토너 → 버스 : 버킷 1칸 적재 요청. 연동 OFF 이면 가상 공급(항상 성공) */
  function take(n){
    if(!st.link) return true;
    if(st.tower>=n){ st.tower-=n; st.taken+=n; return true; }
    st.empty++; return false;
  }
  function count(){ return st.packs.length; }
  /* dt : 시뮬 초 (셸이 실시간 × 배속으로 호출) */
  function step(dt){
    if(dt<=0) return;
    dt=Math.min(dt,0.25);
    const P=st.packs;
    /* ① 이동 : 앞에서부터, 앞 팩(또는 끝) 과 간격 유지 */
    let lim=LEN;
    for(let i=P.length-1;i>=0;i--){
      const p=P[i];
      p.s=Math.min(p.s+V*dt, lim);
      lim=p.s-PITCH;
    }
    /* ② 끝 → 스태커 매거진 */
    while(P.length&&P[P.length-1].s>=LEN-0.5){
      if(st.link){ if(st.tower>=TCAP) break; st.tower++; }
      P.pop(); st.dropT=0.18;
    }
    if(st.dropT>0) st.dropT=Math.max(0,st.dropT-dt);
    /* ③ 투입 : 대기 팩을 간격(EMIT_GAP)을 두고 시작점에 올린다 — 프레임 속도와 무관하게
         한 스텝에 여러 장을 올릴 수 있도록 시작점 앞(충전기 컨베이어 위, s<0)에 이어 붙인다 */
    while(st.q>=1){
      const s0=P.length?Math.min(0,P[0].s-EMIT_GAP):0;
      if(s0<-EMIT_GAP*1.5) break;
      P.unshift({id:++st.id,s:s0}); st.q-=1; st.emitted++;
    }
    if(!st.link){ if(st.q>40) st.q=0; }               /* 단독 운전 : 적체를 만들지 않는다 */
    /* ④ 후공정 대기 (연동 중) : 시작점까지 줄이 차서 충전기 배출 컨베이어에 팩이 밀려 있으면
         (1사이클 15팩 + 여유) 충전기 사이클을 멈추고, 연결 컨베이어가 70 % 이하로 비면 재가동 */
    if(st.link){
      if(!st.wait&&st.q>=24) st.wait=true;
      else if(st.wait&&st.q<4&&P.length<=CAP*0.7) st.wait=false;
    } else st.wait=false;
    /* ⑤ 카토너 속도 : 실측 공급속도 ÷ N 을 기준으로, 스태커 적재량이 절반 근처에 머물도록 보정
         (많으면 빠르게 · 적으면 느리게). 스태커가 N팩 미만이면 저속 → 빈 버킷 최소화 */
    T+=dt; while(hist.length&&hist[0][0]<T-WIN) hist.shift();
    if(st.link) linkT+=dt;
    if(!st.wait){
      const got=hist.reduce((a,h)=>a+h[1],0);
      const meas=got/Math.min(WIN,Math.max(3,linkT||WIN))*60;
      rate=(linkT>0&&linkT<WIN)?Math.max(meas,st.ppm*0.5):meas;
    }
    st.ppmMeas=rate;
    if(st.link){
      const base=rate>1?rate/Math.max(1,st.N):30;
      const lvl=st.tower/TCAP;
      let k=0.62+0.80*lvl;
      if(st.tower<st.N) k=Math.min(k,0.35);
      const tgt=Math.max(20,Math.min(220,base*k));
      st.cpm=Math.round(st.cpm+(tgt-st.cpm)*Math.min(1,dt*1.5));
    }
  }
  return {L,KEY,LEN,PACK,PITCH,V,TCAP,CAP,at,st,reset,emit,take,step,count};
})();
window.ROOMBUS=ROOMBUS;          /* iframe 에서 parent.ROOMBUS 로 접근 (const 는 window 속성이 아니므로) */
