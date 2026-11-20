"""PTP 라인 IDT (파우치 방식 전환판) : src/filler.html + src/line.html (원본 수정 없음) -> PTP라인_IDT.html

· 두 앱 문서는 PTP 통합라인 단일 화면판(ptp_one/build.py)의 주입 결과를 그대로 쓴다 (과정 · HMI · 시뮬레이션 · 형상 생성).
· 이 판에서는 앱이 3D 를 직접 그리지 않고, 셸이 매 프레임 두 앱의 형상(UNI_GEN) · 방 형상(UNI_ROOM) · 팩(UNI_DYN)을 받아
  파우치 엔진(Three.js)으로 그린다 → 1인칭 · 재질 · 그림자를 파우치와 같은 렌더러로.
· 계획 · 결정 사항 : ptp3/PLAN.md
"""
import base64
import importlib.util
import json
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True   # ptp_one/build.py 를 불러올 때 __pycache__ 가 생기지 않게

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
OUT = ROOT / "PTP라인_IDT.html"
THREE = ROOT / "pouch" / "v2" / "vendor" / "three.min.js"

spec = importlib.util.spec_from_file_location("ptp_one_build", ROOT / "ptp_one" / "build.py")
ONE = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ONE)

# 앱 문서 추가 치환 : 통합 렌더러(uni_gfx.js) 안의 방 형상 · 팩 형상을 셸이 받을 수 있게 내보냄
APP_PATCH = [
    ("window.UNI_GEN=function(cam){",
     "window.UNI_ROOM=function(){ if(!ROOM||ROOM.ver!==HUB.roomVer){ ROOM=buildRoom(); ROOM.ver=HUB.roomVer; } return ROOM; };\n"
     "window.UNI_DYN=function(){ const fw=HUB.win('filler'), ink=(fw&&fw.UNI_INK&&fw.UNI_INK())||{ink:[1,1,1],film:'#dfeaf0',foil:'#cfd3d8'}; return packsMesh(ink); };\n"
     "window.UNI_GEN=function(cam){", 1, ("filler", "line")),
    # 작업자 보행 속도 = 세 IDT 공통 1.4 m/s (idt_common/crewkit.js IDT_WALK · 11/19 통합 3단계) — 앱 단위 : 충전 1 = 4 mm, 포장라인 1 = 5 mm
    ("const delta=w.xt-w.x,step=Math.min(Math.abs(delta),motionDt*180);", "const delta=w.xt-w.x,step=Math.min(Math.abs(delta),motionDt*280);", 1, ("line",)),
    ("walkTime:Math.max(.5,Math.abs(to-workerX)/380),commit}", "walkTime:Math.max(.5,Math.abs(to-workerX)/350),commit}", 1, ("filler",)),
    ("walkTime:Math.max(.4,Math.abs(to-workerX)/380),commit}", "walkTime:Math.max(.4,Math.abs(to-workerX)/350),commit}", 1, ("filler",)),
    ("workerJob.walkTime=Math.max(.25,Math.abs(workerJob.to-workerJob.from)/900);", "workerJob.walkTime=Math.max(.25,Math.abs(workerJob.to-workerJob.from)/350);", 1, ("filler",)),
    ("workerX=Math.max(WORKER_STANDBY_X,workerX-Math.min(Math.max(dt,0),.1)*240);", "workerX=Math.max(WORKER_STANDBY_X,workerX-Math.min(Math.max(dt,0),.1)*350);", 1, ("filler",)),
    # 보이는 작업자가 도착할 때까지(설비를 돌아 걷기 · 롤 대차 운반 · 2인 준비) 앱 작업 시간을 멈춤 (11/20 · crew3.js PTP_HOLD)
    ("if(workerJob){const j=workerJob;j.elapsed+=dt*(j.speed||1);", "if(workerJob){const j=workerJob;j.elapsed+=(j.elapsed>=j.walkTime&&window.parent&&window.parent.PTP_HOLD&&window.parent.PTP_HOLD('filler',j))?0:dt*(j.speed||1);", 1, ("filler",)),
    ("  if(w.job&&!w.walking){\n   w.workPhase=(w.workPhase||0)+dt;w.t-=dt;", "  if(w.job&&!w.walking&&!(window.parent&&window.parent.PTP_HOLD&&window.parent.PTP_HOLD('line',i))){\n   w.workPhase=(w.workPhase||0)+dt;w.t-=dt;", 1, ("line",)),
    # PTP 원본 작업자 모형은 그리지 않고 위치만 셸에 알림 → 셸이 파우치 작업자(human.js)로 그림 (11/17 사용자 지시 : 작업자 디자인 파우치처럼)
    ("worker3=function(){ WK.forEach(drawWorker); };",
     "worker3=function(){ window.PTP_WK=WK; if(window.NO_PTP_WORKER) return; WK.forEach(drawWorker); };", 1, ("line",)),
    ("worker3(workerX,DEPTH+145,{back:true,reach,walk,phase:tSim*9,both:!!j,target});",
     "window.PTP_WKF={x:X3(workerX),z:DEPTH+145,walk,reach,both:!!j,target,key:j&&j.key,ph:phase,to:j?X3(j.to):null}; if(!window.NO_PTP_WORKER) worker3(workerX,DEPTH+145,{back:true,reach,walk,phase:tSim*9,both:!!j,target});", 1, ("filler",)),
    # 충전실 작업자 : 원본이 drawTrainingWorker 를 다시 정의(교체부품 과정)해 위 패치가 쓰이지 않던 문제 (11/18 발견) — 실제 쓰이는 정의에서 위치 · 작업을 셸로 넘김
    ("worker3(workerX,z+110,{reach:j?Math.sin(Math.PI*phase):0,",
     "window.PTP_WKF={x:X3(workerX),z:z+110,walk:j?+(j.elapsed<j.walkTime):+workerWalkingAside(),reach:j?Math.sin(Math.PI*phase):0,both:!!j,target:{x:X3(contact.x),y:Y3(contact.y),z},key:j&&j.key,ph:phase}; if(!window.NO_PTP_WORKER) worker3(workerX,z+110,{reach:j?Math.sin(Math.PI*phase):0,", 1, ("filler",)),
    # 작업자가 들고 가는 자재 (11/18 파우치 기준) : 작업 종류를 작업자에 기록 → 셸이 손에 든 물건을 그림
    ("startWorkerAction=function(key,cb,sec){movingWorkerAction(key,cb,sec);lastWK.workPhase=0;workerJob='work';};",
     "startWorkerAction=function(key,cb,sec){movingWorkerAction(key,cb,sec);lastWK.workPhase=0;lastWK.key=key;workerJob='work';};", 1, ("line",)),
    ("actorVisit=function(x,job,sec){movingActorVisit(x,job,sec);lastWK.workPhase=0;workerJob='work';};",
     "actorVisit=function(x,job,sec){movingActorVisit(x,job,sec);lastWK.workPhase=0;lastWK.key=job;workerJob='work';};", 1, ("line",)),
    # 자유모드 중간안 (11/18 사용자 결정) : 운전 중에도 안전문을 열 수 있음(도어 잠금 해제) — 열면 인터락으로 설비 정지(E020) · 닫고 RESET
    ('if(S.running||oneShot){ toast("운전 중에는 안전문을 열 수 없습니다.","bad"); return; }',
     'if((S.running||oneShot)&&window.FREE3&&S.door==="closed"){ S.door="open"; S.doorOpens=(S.doorOpens||0)+1; alarm("E020"); toast("안전문 열림 — 인터락 정지 (E020)","bad"); return; }\nif(S.running||oneShot){ toast("운전 중에는 안전문을 열 수 없습니다.","bad"); return; }', 1, ("filler",)),
    ('if(S.running||oneShot){toast("운전 중에는 안전문을 열 수 없습니다.","bad");return;}',
     'if((S.running||oneShot)&&window.FREE3&&S.door==="closed"){ S.door="open"; S.doorOpens++; alarm("E020"); toast("안전문 열림 — 인터락 정지 (E020)","bad"); return; }\n   if(S.running||oneShot){toast("운전 중에는 안전문을 열 수 없습니다.","bad");return;}', 1, ("line",)),
    # 인칭 1사이클 동작 중에는 인칭 스위치를 다시 눌러도 사이클을 처음부터 다시 시작하지 않음 (실제 설비 · 11/20 1인칭 점검 : 여러 번 누르면 끝나지 않던 문제)
    ("function pressINCH(){\n  if(workerJob)", "function pressINCH(){\n  if(inchT>0){ toast(\"인칭 1사이클 동작 중입니다.\"); return; }\n  if(workerJob)", 1, ("line",)),
    # 체인지파트 (11/20 1인칭 점검) : 원본은 부품 그림을 앱 자체 3D 화면 위 장착 위치(cpTarget)로 끌어 놓는 방식 — 이 판은 셸이 3D 를 그려 그 위치가 나타나지 않아
    #   1인칭 · 3인칭 모두 멈추던 문제. 셸이 실제 장착 위치에 1인칭 대상을 두고(fp3.js) [장착] 버튼으로도 놓기를 할 수 있게, 준비물 확인은 셸 확인 창(PTP_PREP)
    ("function cpPerform(fromDrop=false){",
     "window.PTP_CPINFO=function(){ const st=STEPS()[S.tIdx]; if(S.course!=='change'||!S.session?.active||!st) return null; const p=st.part; return {i:S.tIdx, prep:!!st.prep, fin:!!st.finalCP, phase:st.phase, nm:p&&p.nm, pos:p?[X3(p.x),Y3(p.y),WEBZ+10]:null, busy:!!workerJob, ready:cpPrepReady()}; };\n"
     "window.PTP_PREPITEMS=CP_PREP_ITEMS; window.PTP_PREPSET=(k)=>{ setPrepCheck(k,true); return cpPrepReady(); };\n"
     "function cpPerform(fromDrop=false){", 1, ("filler",)),
    ("if(st.prep){if(!cpPrepReady()){toast('준비물 3개 항목을 모두 확인하세요.');return;}",
     "if(st.prep){if(!cpPrepReady()){ if(window.parent&&window.parent.PTP_PREP){ window.parent.PTP_PREP(); return; } toast('준비물 3개 항목을 모두 확인하세요.');return;}", 1, ("filler",)),
    ("if(st.phase===0&&fromDrop!==true){toast('부품 그림을 정확한 장착 위치로 드래그하여 놓으세요.');return;}",
     "if(st.phase===0&&fromDrop!==true&&!(window.parent&&window.parent.PTP_CP)){toast('부품 그림을 정확한 장착 위치로 드래그하여 놓으세요.');return;}", 1, ("filler",)),
    # 체인지파트 · 포장라인 (같은 이유) : 장착 위치(＋)와 수치 조절점이 앱 3D 화면 위 표시라 나타나지 않음 → 셸 1인칭 대상 · [진행] 버튼으로
    ("function openAdjustment(){",
     "window.PTP_CPINFO=function(){ const st=curStep(); if(S.course!=='change'||!S.session||!S.session.active||!st) return null; let pos=null; if(st.part){ const it=curCP(); if(it){ const m=mountPoint(it); pos=[m[0],m[1],m[2]]; } }\n"
     "  return {prep:!!st.prep, fin:!!st.finalCP, phase:st.phase, nm:st.part?st.part.nm:(st.adjust?st.adjust.nm:''), pos, adj:st.adjust?[X3(st.adjust.x),Y3(st.adjust.y)]:null, busy:!!workerJob, ready:cpPrepReady()}; };\n"
     "window.PTP_PREPITEMS=CPPREP_ITEMS; window.PTP_PREPSET=(k)=>{ setPrepCheck(k,true); return cpPrepReady(); };\n"
     "function openAdjustment(){", 1, ("line",)),
    ('if(st.phase===0&&how!=="drag"){ toast("부품 그림을 정확한 장착 위치로 끌어다 놓으세요."); return; }',
     'if(st.phase===0&&how!=="drag"&&!(window.parent&&window.parent.PTP_CP)){ toast("부품 그림을 정확한 장착 위치로 끌어다 놓으세요."); return; }', 1, ("line",)),
    ('if(!cpPrepReady()){ toast("준비물 3개 항목을 모두 확인하세요.","bad"); return; }',
     'if(!cpPrepReady()){ if(window.parent&&window.parent.PTP_PREP){ window.parent.PTP_PREP(); return; } toast("준비물 3개 항목을 모두 확인하세요.","bad"); return; }', 1, ("line",)),
    ("function cpPerform(it,how){\n  const st=curStep();",
     "function cpPerform(it,how){\n  const st=curStep(); if(st&&st.adjust&&window.parent&&window.parent.PTP_CP&&typeof openAdjustment==='function'){ openAdjustment(); return; }", 1, ("line",)),
    # 자유모드 : 순서 없음 — 이상 대응 · 평가 단계 제한(examGate) 해제
    ("function examGate(kind,key){const ok=", "function examGate(kind,key){if(window.FREE3)return true;const ok=", 1, ("filler",)),
    ("function examGate(kind,key){\n  if(!isExam()", "function examGate(kind,key){\n  if(window.FREE3) return true;\n  if(!isExam()", 1, ("line",)),
    # (P6) 자유모드에서 메인 전원 없이 START 하던 패치는 삭제 — 동력 없이 설비가 움직이는 것은 비현실적
]
SHELL_SCRIPTS = ("changelog.js", "bus.js", "hub.js", "kit.js", "look.js", "human.js", "view3.js", "walk.js", "crewkit.js", "crew3.js", "aimmark.js", "fpctl.js", "topbar.js", "splash.js", "incpick.js", "modes.js", "fp3.js", "modes3.js", "oee.js", "oee3.js", "shell.js")
FROM_ONE = {"bus.js", "hub.js"}
FROM_POUCH = {"kit.js", "human.js"}   # 파우치 재질 · 작업자 인체 모델 그대로


APP_TEXT_HITS = {}
# 1인칭 기준 문구 (11/20 사용자 지시 "모든 IDT 의 근간은 1인칭") : 화면 왼쪽 타일을 누르라는 안내 → 현장 설비 · 위치 이름으로
# (3인칭에서도 같은 뜻으로 읽힘 · 정확한 문구만 바꾸고 원본에 없으면 빌드 중단)
FP_TEXT = [
    ("좌측 [압축공기] 타일을 눌러 6 bar 공급", "압축공기 밸브를 열어 6 bar 공급"),
    ("좌측 [압축공기] 타일을 누릅니다.", "압축공기 밸브를 엽니다."),
    ("좌측 [메인 전원] 타일을 눌러 MAIN S/W 투입", "전기판넬의 메인 스위치를 돌려 MAIN S/W 투입"),
    ("좌측 [메인 전원] 을 누르면 화면이 켜지고", "전기판넬의 메인 스위치를 켜면 화면이 켜지고"),
    ("좌측 [성형필름 걸기] — ", ""), ("좌측 [커버포일 걸기] — ", ""), ("좌측 [제품 투입] — 호퍼", "제품 호퍼"),
    ("좌측 [성형필름 걸기] 로 릴을 다시 겁니다.", "성형필름 보빈에 릴을 다시 겁니다."),
    ("좌측 [성형필름 걸기] 를 누릅니다.", "성형필름 보빈에 릴을 겁니다."),
    ("좌측 [커버포일 걸기] 로 새 포일 릴을 겁니다.", "커버포일 보빈에 새 포일 릴을 겁니다."),
    ("좌측 [커버포일 걸기] 를 누릅니다.", "커버포일 보빈에 릴을 겁니다."),
    ("좌측 [안전문] 을 여세요.", "안전문을 여세요."),
    ("좌측 [안전문] 타일을 눌러 닫으세요.", "안전문으로 가서 닫으세요."),
    ("좌측 [안전문] 타일이 [닫힘] 이어야 합니다", "안전문이 닫혀 있어야 합니다"),
    ("좌측 [제품 투입] 로 정제를 보충한 뒤", "제품 호퍼에 정제를 보충한 뒤"),
    ("좌측 [제품 투입] 로 호퍼를 채웁니다.", "제품 호퍼에 정제를 채웁니다."),
    ("좌측 [제품 투입] 으로 정제를 보충하세요.", "제품 호퍼에 정제를 보충하세요."),
    ("좌측 [제품 투입] 으로 호퍼 보충", "제품 호퍼 보충"),
    ("좌측 [제품 투입] 으로 호퍼를 보충합니다.", "제품 호퍼에 정제를 보충합니다."),
    ("좌측 [필름 연결]로 새 릴을 이어 붙이세요.", "스플라이싱 테이블에서 새 릴을 이어 붙이세요."),
    ("좌측 [필름 연결]로 새 포일 릴을 이어 붙이세요", "스플라이싱 테이블에서 새 포일 릴을 이어 붙이세요"),
    ("좌측 [자재 적재] 카드의 회수 버튼으로 카톤", "각 자재 위치로 가서 카톤"),
    ("좌측 [자재 적재] · 회수 버튼", "현장 자재 위치 · 회수"),
    ("(좌측 [팔레트 투입])", "(팔레트 투입구)"),
    ("좌측 [압축공기] 타일", "현장 [압축공기 밸브]"), ("좌측 [메인 전원] 타일", "현장 [메인 전원 스위치]"),
    ("좌측 [안전문] 타일", "현장 [안전문]"), ("좌측 [진공 펌프] 타일", "현장 [진공 펌프]"), ("(좌측 [진공 펌프])", "(현장 진공 펌프)"),
    ("좌측 [팔레트 투입] 타일로 빈 팔레트를 넣고", "팔레트 투입구로 빈 팔레트를 넣고"), ("좌측 [팔레트 투입] 타일", "현장 [팔레트 투입구]"),
    ("좌측 [자재 적재] 타일", "현장 자재 위치"),
    ("좌측 [카톤 적재] 타일을 눌러 매거진을 채우세요.", "카톤 매거진을 채우세요."), ("좌측 [카톤 적재] 타일로 매거진을 채웁니다.", "카톤 매거진을 채웁니다."),
    ("좌측 [설명지 적재] 타일을 눌러 보충하세요.", "설명지 매거진을 보충하세요."), ("좌측 [설명지 적재] 타일로 매거진을 채웁니다.", "설명지 매거진을 채웁니다."),
    ("좌측 [박스 적재] 타일을 눌러 보충하세요.", "박스 매거진을 보충하세요."), ("좌측 [박스 적재] 타일로 매거진을 채웁니다.", "박스 매거진을 채웁니다."),
    ("좌측 [테이프 · 잉크] 타일로 잉크를 보충하세요.", "박스포장기 잉크를 보충하세요."), ("좌측 [테이프 · 잉크] 타일로 잉크를 보충합니다.", "박스포장기 잉크를 보충합니다."),
    ("좌측 [테이프 · 잉크] 타일로 테이프를 교체하세요.", "박스포장기 테이프를 교체하세요."), ("좌측 [테이프 · 잉크] 타일로 테이프를 교체합니다.", "박스포장기 테이프를 교체합니다."),
    ('좌측 ["+nm+"] 타일', '현장 ["+nm+"]'), ("좌측 ['+nm+']", "현장 ['+nm+']"),
    ('좌측 [" + m.nm + " 적재] 를 누르면 운전 중에도 보충', '" + m.nm + " 매거진은 운전 중에도 보충'),
    ("좌측 ['+material+' 적재]에서 외부 매거진을 보충하세요.", "'+material+' 매거진에 외부에서 보충하세요."),
    ("좌측 [자재 적재] 카드의 ['+nm+'] 버튼으로", "['+nm+'] 위치로 가서"),
    ("좌측 자재 타일 또는 3D 화면의 빨간 ! 위치에서 조치하세요.", "현장의 빨간 ! 위치로 가서 조치하세요."),
    (" 장착부를 선택해 작업자를 이동시키세요.", " 장착 위치로 가서 부품을 맞춰 넣으세요."),
    ("부품 묶음을 표시 위치로 드래그하세요. 한 번의 장착 동작으로 완료됩니다.", "부품 묶음을 장착 위치로 가져가 맞춰 넣으세요. 한 번의 장착 동작으로 완료됩니다."),
]


def fp_text(key: str, text: str) -> str:
    hit = 0
    for old, new in FP_TEXT:
        c = text.count(old)
        if c:
            text = text.replace(old, new); hit += 1
    return text, hit


def app(key: str) -> str:
    text = ONE.patched(key)
    text, hit = fp_text(key, text)
    print(f"{key}: 1인칭 문구 {hit} 종 변환")
    APP_TEXT_HITS[key] = hit
    for old, new, n, keys in APP_PATCH:
        if key not in keys:
            continue
        c = text.count(old)
        if c != n:
            sys.exit(f"{key}: '{old[:50]}' 가 {c} 번 (기대 {n})")
        text = text.replace(old, new)
    text = free_runops(key, text)
    # 결과 창 공통 (11/19 통합 4단계) : 앱 문서 끝에서 마지막 showEnd 를 감쌈 (appres.js)
    js = (HERE / "appres.js").read_text(encoding="utf-8")
    if text.count("</body>") != 1 or "</script" in js.lower():
        sys.exit(f"{key}: </body> 가 {text.count('</body>')} 번 (기대 1)")
    return text.replace("</body>", "<script>\n" + js + "</script>\n</body>")


# 자유모드 중간안 (11/18 사용자 결정 · 세 IDT 통일) : 운전 중 조작 금지 해제 — 앱의 "운전 중에는 … 할 수 없습니다" 류 차단에 !window.FREE3 를 붙임
# (안전문 관련 차단은 제외 : 운전 중 안전문은 셸이 열고 인터락 정지 E020 을 일으킴 · modes3.js)
RUNBAN = re.compile(r"if\(S\.running(\|\|oneShot)?\)\{(\s*)toast\((['\"])((?:(?!\3).)*?)\3")


def free_runops(key: str, text: str) -> str:
    n = 0
    def sub(m):
        nonlocal n
        msg = m.group(4)
        if "안전문" in msg or not re.search(r"운전 중|STOP|정지", msg):
            return m.group(0)
        n += 1
        return m.group(0).replace("if(S.running" + (m.group(1) or "") + ")", "if((S.running" + (m.group(1) or "") + ")&&!window.FREE3)", 1)
    text = RUNBAN.sub(sub, text)
    if n < 5:
        sys.exit(f"{key}: 운전 중 조작 금지 패턴이 {n} 곳뿐 (원본 변경 확인)")
    print(f"{key}: 자유모드 운전 중 조작 금지 해제 {n} 곳")
    return text


sys.path.insert(0, str(ROOT / "idt_common"))
import splash as SPLASH   # noqa: E402  메인화면 공통 템플릿 (11/19)


def _course(mk):
    """PTP 운전 교육 행 : 가동(기본 · 심화) + 고유 체인지파트(기본 6묶음 · 심화 18종) — 공통 메인화면(idt_common/splash.py) 행 형식"""
    T = SPLASH.TIPS
    def B(c, m, nm, full, sm, tip):
        return {"id": None, "nm": nm, "full": full, "sm": sm, "tip": tip, "attrs": {"data-c": c, "data-m": m}}
    op = [{"h": "기본", "btns": [B("operation", "easy", "학습", "기본 · 학습", "핵심 절차 안내", T["easy"]), B("operation", "examEasy", "평가", "기본 · 평가", "핵심 절차 채점", T["examEasy"])]},
          {"h": "심화", "btns": [B("operation", "guide", "학습", "심화 · 학습", "전체 절차 안내", T["guide"]), B("operation", "exam", "평가", "심화 · 평가", "전체 절차 채점", T["exam"])]}]
    ch = [{"h": "체인지파트", "hs": "기본 · 6묶음", "btns": [B("change", "easy", "학습", "체인지파트 · 기본 · 학습", "교체부품 6묶음", "교체부품 6묶음의 탈착 · 장착 절차를 단계별로 안내합니다."),
                                                        B("change", "examEasy", "평가", "체인지파트 · 기본 · 평가", "교체부품 6묶음", "안내 없이 교체부품 6묶음을 교체하고 채점합니다.")]},
          {"h": "체인지파트", "hs": "심화 · 18종", "btns": [B("change", "guide", "학습", "체인지파트 · 심화 · 학습", "교체부품 18종", "교체부품 18종의 탈착 · 장착 절차를 단계별로 안내합니다."),
                                                        B("change", "exam", "평가", "체인지파트 · 심화 · 평가", "교체부품 18종", "안내 없이 교체부품 18종을 교체하고 채점합니다.")]}]
    return op + ch


SPLASH_CFG = {
    "title": "PTP 라인 IDT", "prod": "블리스터 충전 → 카톤 포장",
    "workers": [{"id": "chooseF", "r": "F", "tag": "FILLING ROOM · D구역", "nm": "충전실 작업자", "desc": "블리스터 포장기", "tip": "블리스터 포장기 HM 400P · 성형 · 실링 · 펀칭"},
                {"id": "chooseP", "r": "P", "tag": "PACKING ROOM · G구역", "nm": "포장실 작업자", "desc": "카토너 ~ 팔렛타이저", "tip": "카토너 · 카톤 인쇄기 · 중량선별기 · 박스포장기 · 팔렛타이저 — 포장실의 다른 구역 작업자는 자동으로 일합니다"}],
    # 파우치와 같은 기본 · 심화 · 시연 · 자유 · OEE + PTP 고유 체인지파트 열
    "cols": SPLASH.std_cols(lambda m: ("spOee", None) if m == "oee" else (None, {"data-c": "inc" if m == "inc" else "operation", "data-m": m}), course=_course(None)),
}


def build() -> str:
    shell = (HERE / "shell.html").read_text(encoding="utf-8")
    apps = {key: base64.b64encode(app(key).encode("utf-8")).decode("ascii") for key in ("filler", "line")}
    src = lambda n: (ROOT / "oee" / n) if n == "oee.js" else (ROOT / "idt_common" / n) if n in ("aimmark.js", "fpctl.js", "topbar.js", "splash.js", "incpick.js", "crewkit.js", "modes.js", "look.js") else (ROOT / "ptp_one" / n) if n in FROM_ONE else (ROOT / "pouch" / "v2" / "src" / n) if n in FROM_POUCH else (HERE / n)
    js = "\n".join(f"/* ── {name} ── */\n" + src(name).read_text(encoding="utf-8") for name in SHELL_SCRIPTS)
    three = THREE.read_text(encoding="utf-8")
    for t in (js, three):
        if "</script" in t.lower():
            sys.exit("script text must not contain </script")
    shell = shell.replace("<!--__SPLASH__-->", SPLASH.render(SPLASH_CFG)).replace("/*__SPLASHCSS__*/", (ROOT / "idt_common" / "splash.css").read_text(encoding="utf-8"))
    for key, val in (("/*__OEECSS__*/", (ROOT / "oee" / "oee.css").read_text(encoding="utf-8")), ("/*__THREE__*/", three), ("__APPS__", json.dumps(apps, separators=(",", ":"))), ("/*__SHELL_JS__*/", js)):
        if shell.count(key) != 1:
            sys.exit(f"shell.html must contain {key} exactly once")
        shell = shell.replace(key, val)
    return shell


def main() -> None:
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else OUT
    out.write_text(build(), encoding="utf-8")
    print(f"built {out} ({out.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
