"""병 라인 IDT (파우치 방식 전환판) : bottle/src (원본 수정 없음) -> 병라인_IDT.html

· 기존 병충전 IDT 앱 문서(bottle/build.py 결과)를 빌드 때 치환해 iframe 으로 넣는다 — 과정 · HMI · 시뮬레이션 · 형상 생성은 원본 그대로.
· 앱은 3D 를 직접 그리지 않고(window.B3_EXT) CPU 형상 버퍼(GEO.stat · GEO.dyn)만 만들고, 셸이 파우치 엔진(Three.js)으로 그린다.
· 포장실(라벨 · 설명서 · 중량선별 · 판독 · 박스 포장)은 셸 쪽에 새로 만든다 (B2~).
· 계획 · 결정 사항 : bottle3/PLAN.md
"""
import base64
import importlib.util
import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
OUT = ROOT / "병라인_IDT.html"
THREE = ROOT / "pouch" / "v2" / "vendor" / "three.min.js"

spec = importlib.util.spec_from_file_location("bottle_build", ROOT / "bottle" / "build.py")
BOT = importlib.util.module_from_spec(spec)
spec.loader.exec_module(BOT)

# 앱 문서 치환 (old, new, 기대 횟수)
APP_PATCH = [
    # 셸이 그림 : 앱은 형상 버퍼만 만들고 WebGL 을 쓰지 않음
    ("function boot(){\n", "function boot(){\n  window.B3_EXT=true; window.B3={GEO, L, CH, staticKey:()=>STATIC_KEY, WK:()=>WK};\n", 1),
    ('  if($("#splash").classList.contains("hide")){\n    if(!R3.ready)',
     '  if(window.B3_EXT){ if(STATIC_KEY!==staticKey()) buildStatic(); try{ drawDynamic(); }catch(e){ console.error("동적 형상",e); } window.B3_N=(window.B3_N||0)+1; applyHint(); return; }\n'
     '  if($("#splash").classList.contains("hide")){\n    if(!R3.ready)', 1),
    # 작업자는 셸이 파우치 인체 모델로 그림 (원본 작업자 형상 생략)
    ("function drawWorkers(){ for(const w of WK){", "function drawWorkers(){ if(window.B3_EXT) return; for(const w of WK){", 1),
]
SHELL_SCRIPTS = ("changelog.js", "kit.js", "human.js", "view3.js", "pack.js", "packsim.js", "pcourse.js", "crew.js", "aimmark.js", "pfp.js", "walk.js", "shell.js")
FROM_POUCH = {"kit.js", "human.js"}


def app() -> str:
    text = BOT.build()
    for old, new, n in APP_PATCH:
        c = text.count(old)
        if c != n:
            sys.exit(f"app: '{old[:50]}' 가 {c} 번 (기대 {n})")
        text = text.replace(old, new)
    return text


def build() -> str:
    shell = (HERE / "shell.html").read_text(encoding="utf-8")
    src = lambda n: (ROOT / "pouch" / "v2" / "src" / n) if n in FROM_POUCH else (ROOT / "idt_common" / n) if n == "aimmark.js" else (HERE / n)
    js = "\n".join(f"/* ── {name} ── */\n" + src(name).read_text(encoding="utf-8") for name in SHELL_SCRIPTS)
    three = THREE.read_text(encoding="utf-8")
    for t in (js, three):
        if "</script" in t.lower():
            sys.exit("script text must not contain </script")
    a = base64.b64encode(app().encode("utf-8")).decode("ascii")
    for key, val in (("/*__THREE__*/", three), ("__APP__", json.dumps(a)), ("/*__SHELL_JS__*/", js)):
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
