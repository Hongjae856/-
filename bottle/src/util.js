/* ═══════════════════════════════════════════════════════════════════
   병충전 라인 IDT — 공용 도구
   ═══════════════════════════════════════════════════════════════════ */
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=(v,d)=>(Math.round(v*Math.pow(10,d))/Math.pow(10,d)).toFixed(d);
const mmss=s=>{s=Math.max(0,Math.floor(s));return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");};
/* 정규분포 난수 (Box–Muller) */
function gauss(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
/* 재현 가능한 의사난수 (형상 배치용 — 매 프레임 같은 값이 나와야 떨림이 없다) */
function hash1(n){const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}

/* 화면 비율 맞춤 : 1840×1010 고정 설계를 창 크기에 맞게 확대/축소 */
function fitApp(){
  const a=$("#app"); if(!a) return;
  const k=Math.min(innerWidth/1840,innerHeight/1010);
  a.style.transform="scale("+k+")";
  fitApp.k=k;
}
fitApp.k=1;

/* 토스트 */
let toastT=0;
function toast(msg,kind){
  const t=$("#toast"); if(!t) return;
  t.textContent=msg; t.className="on"+(kind?" "+kind:"");
  clearTimeout(toastT); toastT=setTimeout(()=>t.className="",kind==="bad"?2600:2000);
}

/* 효과음 (기본 꺼짐) */
const SND={on:false,ctx:null};
function beep(f,dur,type,vol){
  if(!SND.on) return;
  try{
    SND.ctx=SND.ctx||new (window.AudioContext||window.webkitAudioContext)();
    const c=SND.ctx,o=c.createOscillator(),g=c.createGain();
    o.type=type||"sine"; o.frequency.value=f; g.gain.value=vol||0.05;
    o.connect(g); g.connect(c.destination); o.start();
    g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+(dur||0.12));
    o.stop(c.currentTime+(dur||0.12)+0.02);
  }catch(e){}
}
