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
    # PTP 원본 작업자 모형은 그리지 않고 위치만 셸에 알림 → 셸이 파우치 작업자(human.js)로 그림 (11/17 사용자 지시 : 작업자 디자인 파우치처럼)
    ("worker3=function(){ WK.forEach(drawWorker); };",
     "worker3=function(){ window.PTP_WK=WK; if(window.NO_PTP_WORKER) return; WK.forEach(drawWorker); };", 1, ("line",)),
    ("worker3(workerX,DEPTH+145,{back:true,reach,walk,phase:tSim*9,both:!!j,target});",
     "window.PTP_WKF={x:X3(workerX),z:DEPTH+145,walk,reach,both:!!j,target}; if(!window.NO_PTP_WORKER) worker3(workerX,DEPTH+145,{back:true,reach,walk,phase:tSim*9,both:!!j,target});", 1, ("filler",)),
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
SHELL_SCRIPTS = ("changelog.js", "bus.js", "hub.js", "kit.js", "human.js", "view3.js", "walk.js", "crew3.js", "aimmark.js", "fpctl.js", "fp3.js", "modes3.js", "oee.js", "oee3.js", "shell.js")
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
    return free_runops(key, text)


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


def build() -> str:
    shell = (HERE / "shell.html").read_text(encoding="utf-8")
    apps = {key: base64.b64encode(app(key).encode("utf-8")).decode("ascii") for key in ("filler", "line")}
    src = lambda n: (ROOT / "oee" / n) if n == "oee.js" else (ROOT / "idt_common" / n) if n in ("aimmark.js", "fpctl.js") else (ROOT / "ptp_one" / n) if n in FROM_ONE else (ROOT / "pouch" / "v2" / "src" / n) if n in FROM_POUCH else (HERE / n)
    js = "\n".join(f"/* ── {name} ── */\n" + src(name).read_text(encoding="utf-8") for name in SHELL_SCRIPTS)
    three = THREE.read_text(encoding="utf-8")
    for t in (js, three):
        if "</script" in t.lower():
            sys.exit("script text must not contain </script")
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
