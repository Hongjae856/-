/* 결과 창 : 세 IDT 공통 (셸의 idt_common/modes.js idtResOpen · 11/19 통합 4단계 · 파우치 결과 창 모양)
   · 빌드 때 두 앱(충전 · 포장라인) 문서 끝에 넣어, 앱의 마지막 showEnd 를 감쌈 — 점수 계산은 앱 그대로(scoreSession)
   · PTP 고유 : 평가 결과는 총평 카드만(원본 결정 : 평가 결과 팝업에 감점 · 미완료 표 미표시) · [결과 복사] [인쇄] 유지 */
(function(){
  const P=window.parent; if(!P||P===window||!P.idtResOpen) return;
  const FILL=typeof isPVC==="function", prev=showEnd;
  showEnd=function(){
    try{ if(typeof HUB!=="undefined"&&HUB&&HUB.flow&&HUB.flow.hold&&!window.__uniShow) return prev.apply(this,arguments); }catch(e){}
    if(!lastResult){ if(FILL&&typeof finishSession==="function"&&S.session&&!S.session.ended){ finishSession(); return; } lastResult=scoreSession(); }
    const r=lastResult, ex=isExam(), fb=offlineFeedback(r), rows=r.rows||[]; if(S.session) S.session.feedback=fb;
    const N=v=>Math.round(v||0).toLocaleString(), y=S.cnt&&S.cnt.total>0?S.cnt.good/S.cnt.total*100:null;
    const kp=FILL?[[N(S.cnt.total)+" 팩","총 생산","hi"],[N(S.cnt.good)+" 팩","정품"],[N(S.cnt.bad)+" 팩","불량","ng"],[y==null?"-":y.toFixed(1)+" %","수율"]]
                 :[[N(S.cnt.good)+" 카톤","양품 카톤","hi"],[N(S.cnt.bad)+" 카톤","불량 배출","ng"],[N(S.cnt.cases)+" 박스","박스"],[N(S.cnt.pallets)+" 개","팔레트"]];
    const md=P.ptp3ModeNm?P.ptp3ModeNm():"";
    P.idtResOpen({icon:ex?"📝":"📘", head:ex?"평가 결과":"학습 결과", sub:(FILL?"충전실":"포장실")+(md?" · "+md:""),
      meta:"소요 "+mmss(r.seconds)+" · 진행 "+Math.min(r.completed,rows.length)+" / "+rows.length+" 단계"+(ex&&r.penalty?" · 오류 감점 "+r.penalty+"점":""),
      score:ex?{v:r.score, pass:r.pass, th:r.threshold}:null, kpis:kp,
      secs:ex?[{h:"총평"}]:[{h:"단계별 수행",th:["No","단계","배점","결과"],l:[1],rows:rows.map((x,i)=>[i+1,x.title||x.nm,Math.round((x.weight||0)*10)/10,x.fraction>=1?"완료":x.fraction>0?"부분 "+Math.round(x.fraction*100)+" %":"미완료"])}],
      html:ex?feedbackMarkup(fb):"",
      btns:[["다시 하기",()=>P.ptp3Restart&&P.ptp3Restart(),true],["결과 복사",b=>copyReport(FILL?b:r),false,true],["인쇄",()=>printReport(FILL?undefined:r),false,true],["메인화면",()=>P.goHome()],["닫기",null]]},document);
  };
})();
