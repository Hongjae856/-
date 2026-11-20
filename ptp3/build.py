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
    # 자유모드 : 순서 없음 — 이상 대응 · 평가 단계 제한(examGate) 해제
    ("function examGate(kind,key){const ok=", "function examGate(kind,key){if(window.FREE3)return true;const ok=", 1, ("filler",)),
    ("function examGate(kind,key){\n  if(!isExam()", "function examGate(kind,key){\n  if(window.FREE3) return true;\n  if(!isExam()", 1, ("line",)),
    # (P6) 자유모드에서 메인 전원 없이 START 하던 패치는 삭제 — 동력 없이 설비가 움직이는 것은 비현실적
]
SHELL_SCRIPTS = ("changelog.js", "bus.js", "hub.js", "kit.js", "human.js", "view3.js", "walk.js", "crewkit.js", "crew3.js", "aimmark.js", "fpctl.js", "topbar.js", "splash.js", "incpick.js", "modes.js", "fp3.js", "modes3.js", "oee.js", "oee3.js", "shell.js")
FROM_ONE = {"bus.js", "hub.js"}
FROM_POUCH = {"kit.js", "human.js"}   # 파우치 재질 · 작업자 인체 모델 그대로


def app(key: str) -> str:
    text = ONE.patched(key)
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
    src = lambda n: (ROOT / "oee" / n) if n == "oee.js" else (ROOT / "idt_common" / n) if n in ("aimmark.js", "fpctl.js", "topbar.js", "splash.js", "incpick.js", "crewkit.js", "modes.js") else (ROOT / "ptp_one" / n) if n in FROM_ONE else (ROOT / "pouch" / "v2" / "src" / n) if n in FROM_POUCH else (HERE / n)
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
