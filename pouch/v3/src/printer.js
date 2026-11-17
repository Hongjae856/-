/* ═══════════════════════════════════════════════════════════════════
   제조번호 · 사용기한 인쇄 설정 · 인쇄 검사 화면 (11/17 사용자 지시)
   · 값 : 제조번호(LOT) 2F001 · 사용기한(EXP) 2029.01.30 (사용자 제시 예 — hmi.js EXPECT)
   · 충전실 : 북쪽 인쇄기 컨트롤러 위 모니터 = 은박 프린터 설정(직접 입력 · 저장) + 인쇄 검사(OCR) 화면 — 새 설비 화면 "fp"
   · 포장실 : 케이스(카톤) 프린터 라벨 편집에서 직접 입력 · 그 위 모니터 = 카톤 인쇄 검사(비전) 화면
   · 모니터는 X-ray 처럼 검사 영상을 그림으로 표시(걸어 다닐 때) · 누르면 다가가서 설정 화면 조작
   · 시연 · 기본 = 미리 설정 / 심화 = 직접 입력 단계 · 값이 포장지시기록서와 다르면 인쇄 불량 → 검사에서 배출
   ═══════════════════════════════════════════════════════════════════ */
MACH.push({k:"fp", room:"F", md:"은박 프린터", nm:"은박 프린터 · 인쇄 검사", en:"Foil Printer · OCR",
  d:"충전기 북쪽 인쇄기 컨트롤러 위 모니터입니다. 포장지시기록서의 제조번호 · 사용기한을 입력 · 저장하면 은박에 인쇄되고, 카메라가 인쇄 문자를 판독(OCR)해 불량은 충전기 불량 배출로 보냅니다."});
HTABS.F.push(["fp","프린터","은박 인쇄 · 검사"]);
FP_MON.fp={k:["fp"], nm:"인쇄기 컨트롤러 · 인쇄 검사 화면", c:[CVX+.725,1.80,.556], n:[0,0,1], h:.32, w:.53, dom:{w:600,h:362}};
{ const ph0=powerHint; powerHint=k=>k==="fp"?"메인 파워를 켜면 인쇄기 컨트롤러 화면이 켜집니다.":ph0(k); }
const prnMatch=(lot,exp)=>lot===EXPECT.lot&&exp===EXPECT.exp;
/* 직접 입력 (화면의 입력칸) */
function hinSet(id,v){
  v=String(v||"").trim().toUpperCase();
  if(id==="pr_lot"||id==="pr_exp"){ const L=S.p.lbl; L[id==="pr_lot"?"lot":"exp"]=v; L.saved=false; L.loaded=false; }
  else if(id==="fp_lot"||id==="fp_exp"){ const D=S.f.prnD||(S.f.prnD={lot:"",exp:""}); D[id==="fp_lot"?"lot":"exp"]=v; }
  if(typeof stepCheck==="function") stepCheck();
}
function hinBind(){ $$("#hBody input.hin").forEach(e=>{ e.oninput=()=>hinSet(e.dataset.hb,e.value); e.onkeydown=ev=>{ if(ev.key==="Enter") e.blur(); }; e.onclick=ev=>ev.stopPropagation(); }); }
const hinBox=(id,v,ph,ap)=>'<input class="inp hin" data-hb="'+id+'" data-ap="'+esc(ap)+'" value="'+esc(v||"")+'" placeholder="'+ph+'" maxlength="12" autocomplete="off" spellcheck="false">';
/* 충전실 은박 프린터 설정 화면 */
PSCR.fp=()=>{ const f=S.f, D=f.prnD||(f.prnD={lot:f.prn.lot||"",exp:f.prn.exp||""}), n=S.cnt.ocrN||0, ng=S.cnt.ocrNG||0;
  return ph("인쇄 설정 · 인쇄 검사","FOIL PRINTER · OCR",f.run&&f.prn.saved)+
   '<div class="kpis">'+kc(f.prn.saved?esc(f.prn.lot):"-","인쇄 중 제조번호","hi")+kc(f.prn.saved?esc(f.prn.exp):"-","인쇄 중 사용기한")+kc(Math.round(f.ribbon)+" %","리본",f.ribbon<15?"ng":"")+'</div>'+
   row("제조번호 (LOT)","포장지시기록서",hinBox("fp_lot",D.lot,"예 2F001",EXPECT.lot))+row("사용기한 (EXP)","YYYY.MM.DD",hinBox("fp_exp",D.exp,"예 2029.01.30",EXPECT.exp))+
   '<div class="hGrid2">'+btn(f.prn.saved,"저장","SAVE","💾","fp_save")+btn(false,"입력 지우기","CLEAR","⌫","fp_clr")+'</div>'+
   row("인쇄 검사 (OCR)",f.vision?"판독 중":"검사 OFF",pv(n?("OK "+(n-ng).toLocaleString()+" · NG "+ng.toLocaleString()):"-")); };
function fpClick(id){
  const f=S.f, D=f.prnD||(f.prnD={lot:"",exp:""});
  if(id==="fp_save"){ if(!D.lot||!D.exp){ toast("제조번호 · 사용기한을 모두 입력하세요.","bad"); return; } if(f.run){ toast("운전 중에는 인쇄 설정을 바꾸지 않습니다. 먼저 STOP.","bad"); return; }
    f.prn={lot:D.lot, exp:D.exp, saved:true}; const ok=prnMatch(D.lot,D.exp);
    toast("인쇄 설정 저장 — 제조번호 "+D.lot+" · 사용기한 "+D.exp+(ok?"":(isExam()?"":" (포장지시기록서와 다릅니다!)")),ok||isExam()?"good":"bad"); }
  else if(id==="fp_clr"){ D.lot=""; D.exp=""; }
  drawHMI(); if(typeof stepCheck==="function") stepCheck();
}
/* 은박 프린터 타일 : 인쇄기 컨트롤러 화면으로 이동 */
TILE.mPrn.click=()=>{ hMach="fp"; hScr="main"; drawHMI(); toast("인쇄기 컨트롤러 화면(설비 화면 · 프린터 탭)에서 제조번호 · 사용기한을 입력합니다."); };

/* ── 검사 화면 그림 (X-ray 화면처럼) : 충전실 OCR · 포장실 카톤 인쇄 비전 ── */
const OCR={t:0, cv:{}, tex:{}};
function ocrCanvas(k,W,H){ if(!OCR.cv[k]){ const c=document.createElement("canvas"); c.width=W; c.height=H; OCR.cv[k]=c; OCR.tex[k]=new T3.CanvasTexture(c); OCR.tex[k].encoding=T3.sRGBEncoding; OCR.tex[k].anisotropy=4; } return OCR.cv[k].getContext("2d"); }
const OCRF='"Malgun Gothic","Noto Sans KR",sans-serif';
function ocrDrawF(){
  const W=800, H=483, g=ocrCanvas("fp",W,H), f=S.f, on=machPower("fp");
  if(!on){ g.fillStyle="#050607"; g.fillRect(0,0,W,H); return; }
  g.fillStyle="#1d2b3a"; g.fillRect(0,0,W,52); g.fillStyle="#fff"; g.font="bold 24px "+OCRF; g.textAlign="left"; g.fillText("인쇄 검사 (OCR) · 은박 프린터",18,35);
  g.fillStyle=f.vision?"#3ddc84":"#8a949d"; g.font="bold 18px "+OCRF; g.fillText(f.vision?(f.run?"● 판독 중":"● 대기"):"검사 OFF",W-150,34);
  const y0=52, y1=372; g.fillStyle="#2a2d30"; g.fillRect(0,y0,W,y1-y0);
  const saved=f.prn.saved, bad=!saved||!prnMatch(f.prn.lot,f.prn.exp)||f.headDirty||f.ribbon<5, off=((typeof AN!=="undefined"?AN.cyc+AN.ph:0)%1)*110;
  g.save(); g.beginPath(); g.rect(0,y0,W,y1-y0); g.clip();
  for(let i=0;i<10;i++){ const x=22+i*77, w=58;
    const gr=g.createLinearGradient(x,0,x+w,0); gr.addColorStop(0,"#9aa0a6"); gr.addColorStop(.5,"#e9ecef"); gr.addColorStop(1,"#9aa0a6"); g.fillStyle=gr; g.fillRect(x,y0,w,y1-y0);
    for(let y=y0-110+off;y<y1;y+=110){ g.fillStyle="#c8302a"; g.fillRect(x,y+6,w,26);
      if(saved&&f.ribbon>=5){ g.save(); g.translate(x+w/2,y+70); g.rotate(-Math.PI/2); g.fillStyle=f.headDirty?"rgba(20,20,20,.35)":"#151515"; g.font="bold 13px monospace"; g.textAlign="center"; g.fillText(f.prn.lot,0,-6); g.fillText(f.prn.exp,0,10); g.restore(); } }
    const ok=f.vision&&!bad; g.strokeStyle=f.vision?(ok?"#22c04a":"#e23b2e"):"#6b7782"; g.lineWidth=3; g.strokeRect(x-3,y0+130,w+6,90);
    if(f.vision){ g.fillStyle=ok?"#22c04a":"#e23b2e"; g.font="bold 14px "+OCRF; g.textAlign="center"; g.fillText(ok?"OK":"NG",x+w/2,y0+124); } }
  g.restore();
  const n=S.cnt.ocrN||0, ng=S.cnt.ocrNG||0, ok=f.vision&&!bad;
  g.fillStyle="#f4f6f7"; g.fillRect(0,y1,W,H-y1); g.fillStyle=f.vision?(ok?"#19a03c":"#c0392b"):"#8a949d"; g.fillRect(16,y1+14,170,H-y1-28);
  g.fillStyle="#fff"; g.font="bold 50px "+OCRF; g.textAlign="center"; g.fillText(f.vision?(ok?"OK":"NG"):"OFF",101,y1+74); g.textAlign="left";
  g.fillStyle="#25313d"; g.font="bold 19px "+OCRF; g.fillText("제조번호  "+(saved?f.prn.lot:"-"),210,y1+36); g.fillText("사용기한  "+(saved?f.prn.exp:"-"),210,y1+68);
  g.fillText("검사 "+n.toLocaleString(),520,y1+36); g.fillStyle="#c0392b"; g.fillText("NG "+ng.toLocaleString(),520,y1+68);
}
function ocrDrawP(){
  const W=640, H=592, g=ocrCanvas("pr",W,H), p=S.p, on=machPower("vs")||machPower("pr");
  if(!on){ g.fillStyle="#050607"; g.fillRect(0,0,W,H); return; }
  const L=p.lbl, printing=p.prRun&&L.loaded, blur=p.nozzleBad||p.ink<5, bad=!printing||blur||!prnMatch(L.lot,L.exp), run=p.vsRun;
  g.fillStyle="#1d2b3a"; g.fillRect(0,0,W,52); g.fillStyle="#fff"; g.font="bold 22px "+OCRF; g.textAlign="left"; g.fillText("카톤 인쇄 검사 (비전) · DOMINO",16,34);
  g.fillStyle=run?"#3ddc84":"#8a949d"; g.font="bold 17px "+OCRF; g.fillText(run?"● 실행 중":"정지",W-110,34);
  const y0=52, y1=432; g.fillStyle="#3a3f44"; g.fillRect(0,y0,W,y1-y0);
  const sh=((performance.now()/1000)*.6%1)*W*.0;                                  /* 카톤은 멈춘 순간 촬영 */
  g.fillStyle="#9b1610"; g.fillRect(70+sh,y0+40,W-140,y1-y0-80); g.fillStyle="#7a100c"; g.fillRect(70,y1-60,W-140,20);
  g.fillStyle="#f2efe8"; g.fillRect(150,y0+110,W-300,150);
  if(printing){ g.save(); if(blur) g.filter="blur(2.2px)"; g.fillStyle="#111"; g.font="bold 30px monospace"; g.fillText("LOT "+(L.lot||""),180,y0+170); g.fillText("EXP "+(L.exp||""),180,y0+222); g.restore(); }
  g.strokeStyle=run?(bad?"#e23b2e":"#22c04a"):"#6b7782"; g.lineWidth=3; g.strokeRect(166,y0+134,W-332,104);
  if(run){ g.fillStyle=bad?"#e23b2e":"#22c04a"; g.font="bold 18px "+OCRF; g.fillText(bad?"NG":"OK",166,y0+128); }
  const n=S.cnt.carton||0, ng=S.cnt.rejVs||0;
  g.fillStyle="#f4f6f7"; g.fillRect(0,y1,W,H-y1); g.fillStyle=run?(bad?"#c0392b":"#19a03c"):"#8a949d"; g.fillRect(16,y1+16,170,H-y1-32);
  g.fillStyle="#fff"; g.font="bold 54px "+OCRF; g.textAlign="center"; g.fillText(run?(bad?"NG":"OK"):"OFF",101,y1+98); g.textAlign="left";
  g.fillStyle="#25313d"; g.font="bold 20px "+OCRF; g.fillText("LOT  "+(L.loaded?L.lot:"-"),210,y1+46); g.fillText("EXP  "+(L.loaded?L.exp:"-"),210,y1+80);
  g.fillText("검사 "+n.toLocaleString(),210,y1+122); g.fillStyle="#c0392b"; g.fillText("NG "+ng.toLocaleString(),400,y1+122);
}
function ocrTick(dt){
  if(!V3||!V3.scr||!S||!S.session||!S.session.active) return;
  OCR.t+=dt; if(OCR.t<.15) return; OCR.t=0;
  for(const s of V3.scr){ if(s.k!=="fp"&&s.k!=="pr") continue; const near=S.room==="F"?s.k==="fp":s.k==="pr"; if(!near) continue;
    if(s.k==="fp") ocrDrawF(); else ocrDrawP(); const tx=OCR.tex[s.k]; tx.needsUpdate=true;
    if(s.mat.map!==tx){ s.mat.map=tx; s.mat.emissiveMap=tx; s.mat.color.setHex(0x0a0a0a); s.mat.emissive.setHex(0xffffff); s.mat.emissiveIntensity=.92; s.mat.needsUpdate=true; } }
}
