/* ═══════════════════════════════════════════════════════════════════
   설비 화면 3D 표시 (11/16 사용자 지시) — 모든 HMI 모니터에 실제 HMI 화면을 그림으로 표시 (X-ray 화면처럼 · 파란 빛 대신)
   · 같은 실의 모니터만, 화면 내용이 바뀐 경우에만 0.5 초에 1 대씩 다시 그림 (HTML → SVG foreignObject → 캔버스 텍스처)
   · 전원 OFF = 검은 화면 · X-ray 는 기존 투과 영상 화면 유지
   · 조작은 1인칭에서 화면을 누르면 시점이 화면 앞으로 다가간 뒤(회전 잠금) 그 화면에서 직접 — F · Esc 로 뒤로
   · 그림으로 만들 수 없는 브라우저(캔버스 보안 제한 등)에서는 기존 표시로 둠
   ═══════════════════════════════════════════════════════════════════ */
const HTX={css:null, t:0, i:0, last:{}, busy:false, scr:{}, fail:false};
function htxCss(){ if(HTX.css==null) HTX.css=[...document.querySelectorAll("style")].map(s=>s.textContent).join("\n").replace(/\]\]>/g,""); return HTX.css; }
/* 화면 유리면 (메시 경계 상자 : 중심 · 폭 · 높이) — 1인칭 조작 화면도 여기에 꼭 맞춤 */
function htxGlass(k){ const s=V3&&V3.scr&&V3.scr.find(q=>q.k===k); if(!s) return null; if(s.glass) return s.glass;
  const m=V3.scene.getObjectByProperty("uuid",s.uid); if(!m) return null; const b=new T3.Box3().setFromObject(m), c=b.getCenter(new T3.Vector3()), z=b.getSize(new T3.Vector3()), n=FP_MON[k].n, ax=Math.abs(n[0])>.5;
  s.glass={c:[c.x+n[0]*(ax?z.x/2:0),c.y,c.z+n[2]*(ax?0:z.z/2)], w:ax?z.z:z.x, h:z.y}; return s.glass; }
const htxLW=k=>k==="fl"?600:((FP_MON[k].dom||{}).w||560);
/* 1인칭 조작용 모니터 정의 (유리면 기준) */
function htxMon(key){ const m=FP_MON[key], g=htxGlass(key); if(!g) return m; const LW=htxLW(key); return {k:m.k, nm:m.nm, n:m.n, c:g.c, w:g.w, h:g.h, dom:{w:LW,h:Math.round(LW*g.h/g.w)}}; }
/* 화면 크기 (메시 경계 상자 · 화면이 바라보는 축 제외) */
function htxDims(s){ if(s.dim) return s.dim; const b=new T3.Box3(), m=V3.scene.getObjectByProperty("uuid",s.uid); if(!m) return null; b.setFromObject(m); const z=b.getSize(new T3.Vector3()), n=FP_MON[s.k].n;
  s.dim=Math.abs(n[0])>.5?[z.z,z.y]:[z.x,z.y]; return s.dim; }
/* 설비 k 의 현재 HMI 를 HTML 로 (현재 보고 있는 설비는 그대로 · 다른 설비는 잠깐 바꿔 그린 뒤 되돌림 — 한 번의 실행 안이라 화면 깜빡임 없음) */
function htxSnap(k){
  if(hMach===k) HTX.scr[k]=hScr;
  const keep=[hMach,hScr,FPMON], swap=hMach!==k;
  if(swap&&((FP.mod&&FP.mod.mode&&FP.mod.mode!=="walk"&&cam.fp)||(document.activeElement&&document.activeElement.closest&&document.activeElement.closest("#hmi")))) return null;   /* 화면 조작 중에는 다른 설비로 바꿔 그리지 않음 */
  if(swap){ FPMON=null; hMach=k; hScr=HTX.scr[k]||(k==="fl"?"run":"main"); drawHMI(); if(hMach!==k){ [hMach,hScr,FPMON]=keep; drawHMI(); return null; } }
  const el=$("#hmi"), w=el.offsetWidth, h=el.offsetHeight, html=new XMLSerializer().serializeToString(el);
  if(swap){ [hMach,hScr,FPMON]=keep; drawHMI(); }
  return {html,w,h};
}
async function htxDraw(s){
  const mk=FP_MON[s.k].k.find(q=>machPower(q))||FP_MON[s.k].k[0];
  if(!machPower(mk)){ if(s.tex){ s.mat.map=null; s.mat.emissiveMap=null; s.mat.needsUpdate=true; s.tex.dispose(); s.tex=null; s.key=null; } return; }
  const d=htxDims(s); if(!d) return;
  const snap=htxSnap(mk); if(!snap||!snap.w) return;
  const LW=htxLW(s.k), W=Math.min(600,LW), H=Math.round(W*d[1]/d[0]), LH=Math.round(LW*d[1]/d[0]), key=mk+"|"+W+"|"+snap.html.length+"|"+snap.html.slice(0,4000)+snap.html.slice(-4000);
  if(s.key===key) return; s.key=key;
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+(W*2)+'" height="'+(H*2)+'" viewBox="0 0 '+W+' '+H+'"><foreignObject width="'+W+'" height="'+H+'"><div xmlns="http://www.w3.org/1999/xhtml" style="width:'+W+'px;height:'+H+'px;overflow:hidden;background:#000"><style><![CDATA['+htxCss()+'\n#hmi{width:'+LW+'px!important;height:'+LH+'px!important;max-width:none!important}#hTabs,#hAlarmTick{display:none!important}*{scrollbar-width:none!important}*::-webkit-scrollbar{display:none!important}]]></style><div style="width:'+LW+'px;height:'+LH+'px;overflow:hidden;transform:scale('+(W/LW)+');transform-origin:0 0">'+snap.html+'</div></div></foreignObject></svg>';
  const img=new Image(); img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
  await img.decode();
  const cv=s.cv||(s.cv=document.createElement("canvas")); cv.width=W*2; cv.height=H*2; const c=cv.getContext("2d"); c.drawImage(img,0,0,W*2,H*2);
  if(!HTX.chk){ c.getImageData(0,0,1,1); HTX.chk=true; }                                                        /* 보안 제한(타 브라우저) 확인 — 실패 시 catch */
  if(!s.tex){ s.tex=new T3.CanvasTexture(cv); s.tex.encoding=T3.sRGBEncoding; s.tex.anisotropy=4; } else s.tex.needsUpdate=true;
  s.mat.map=s.tex; s.mat.emissiveMap=s.tex; s.mat.color.setHex(0x0a0a0a); s.mat.emissive.setHex(0xffffff); s.mat.emissiveIntensity=.92; s.mat.needsUpdate=true;
}
function htxTick(dt){
  if(HTX.fail||!V3||!V3.scr||!S||!S.session||!S.session.active||HTX.busy) return;
  HTX.t+=dt; if(HTX.t<.5) return; HTX.t=0;
  const L=V3.scr.filter(s=>s.k!=="xr"&&(S.room==="F"?FP_MON[s.k].c[2]>0:FP_MON[s.k].c[2]<0)); if(!L.length) return;
  const s=L[HTX.i++%L.length]; if((s.fail||0)>2) return; HTX.busy=true;
  htxDraw(s).catch(e=>{ s.fail=(s.fail||0)+1; if(e&&e.name==="SecurityError") HTX.fail=true; console.warn("설비 화면 그림 표시 실패 — 기존 표시 유지",e); }).finally(()=>{ HTX.busy=false; });
}
