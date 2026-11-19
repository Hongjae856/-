/* 결과 창 : 세 IDT 공통 (셸의 idt_common/modes.js idtResOpen · 11/19 통합 4단계 · 파우치 결과 창 모양)
   · 빌드 때 원본 충전 앱 문서 끝에 넣어 showResult 를 바꿈 — 점수 계산은 앱 그대로(scoreNow) */
(function(){
  const P=window.parent; if(!P||P===window||!P.idtResOpen) return;
  showResult=function(manual){
    const ex=isExam(), sc=scoreNow(), A=STEPS(), avg=S.wc.nNet?fmt(S.wc.sumNet/S.wc.nNet,3)+" g":"-";
    P.idtResOpen({icon:ex?"📝":"📘", head:ex?"평가 결과":"학습 결과", sub:"충전실 · "+MODE_NM[S.mode],
      meta:S.rc.label+" · 소요 "+mmss(S.session.sec)+" · 진행 "+Math.min(S.tIdx,A.length)+" / "+A.length+" 단계 · 힌트 "+(S.hintUsed||0)+"회"+(manual?" (중도 종료)":""),
      score:ex?{v:sc.score, pass:sc.score>=PASS, th:PASS, base:sc.base, minus:sc.minus}:null,
      kpis:[[S.cnt.good+" 병","양품 (캡핑 완료)","hi"],[S.cnt.reject+" 병","리젝트","ng"],[avg,"순중량 평균"],[S.cnt.tabs.toLocaleString()+" 정","계수 정제"]],
      secs:[{h:"단계별 수행",th:["No","단계","배점","결과"],l:[1],rows:A.map((st,i)=>{ const l=S.stepLog.find(x=>x.i===i); return [i+1,st.t,st.pts||0,l?"완료 · "+mmss(l.at):"미완료"]; })},
            {h:"감점 내역",th:["항목","감점","시각"],l:[0],rows:S.deducts.map(d=>[d.why,"−"+d.pts,mmss(d.at)]),empty:"감점 없음"}],
      btns:[["다시 하기",()=>P.bRestart&&P.bRestart(),true],["메인화면",()=>P.goHome()],["닫기",null]]},document);
  };
})();
