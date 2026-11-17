"""PTP 라인 IDT (파우치 방식 전환판) : src/filler.html + src/line.html (원본 수정 없음) -> PTP라인_IDT.html

· 두 앱 문서는 PTP 통합라인 단일 화면판(ptp_one/build.py)의 주입 결과를 그대로 쓴다 (과정 · HMI · 시뮬레이션 · 형상 생성).
· 이 판에서는 앱이 3D 를 직접 그리지 않고, 셸이 매 프레임 두 앱의 형상(UNI_GEN) · 방 형상(UNI_ROOM) · 팩(UNI_DYN)을 받아
  파우치 엔진(Three.js)으로 그린다 → 1인칭 · 재질 · 그림자를 파우치와 같은 렌더러로.
· 계획 · 결정 사항 : ptp3/PLAN.md
"""
import base64
import importlib.util
import json
import sys
from pathlib import Path

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
     "window.UNI_GEN=function(cam){", 1),
]
SHELL_SCRIPTS = ("changelog.js", "bus.js", "hub.js", "view3.js", "walk.js", "shell.js")
FROM_ONE = {"bus.js", "hub.js"}


def app(key: str) -> str:
    text = ONE.patched(key)
    for old, new, n in APP_PATCH:
        c = text.count(old)
        if c != n:
            sys.exit(f"{key}: '{old[:50]}' 가 {c} 번 (기대 {n})")
        text = text.replace(old, new)
    return text


def build() -> str:
    shell = (HERE / "shell.html").read_text(encoding="utf-8")
    apps = {key: base64.b64encode(app(key).encode("utf-8")).decode("ascii") for key in ("filler", "line")}
    js = "\n".join(f"/* ── {name} ── */\n" + ((ROOT / "ptp_one" / name) if name in FROM_ONE else (HERE / name)).read_text(encoding="utf-8") for name in SHELL_SCRIPTS)
    three = THREE.read_text(encoding="utf-8")
    for t in (js, three):
        if "</script" in t.lower():
            sys.exit("script text must not contain </script")
    for key, val in (("/*__THREE__*/", three), ("__APPS__", json.dumps(apps, separators=(",", ":"))), ("/*__SHELL_JS__*/", js)):
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
