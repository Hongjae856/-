"""병 라인 IDT (파우치 방식 전환판) : bottle/src (원본 수정 없음) -> 병라인_IDT.html

· 기존 병충전 IDT 앱 문서(bottle/build.py 결과)를 빌드 때 치환해 iframe 으로 넣는다 — 과정 · HMI · 시뮬레이션 · 형상 생성은 원본 그대로.
· 앱은 3D 를 직접 그리지 않고(window.B3_EXT) CPU 형상 버퍼(GEO.stat · GEO.dyn)만 만들고, 셸이 파우치 엔진(Three.js)으로 그린다.
· 포장실(라벨 · 설명서 · 중량선별 · 판독 · 박스 포장)은 셸 쪽에 새로 만든다 (B2~).
· 계획 · 결정 사항 : bottle3/PLAN.md
"""
import base64
import importlib.util
import json
import re
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
    # 시연모드 단계 버튼식 (11/18 사용자 결정) : 셸이 단계마다 준비 · 가동 — 앱 시연 설정은 건너뛰고, 가동 전에는 자동 보충 · 복구 안 함
    ("function demoSetup(){\n", "function demoSetup(){\n  if(window.B3_DEMO_STEP&&S.mode===\"demo\"){ S.cnt.target=1e9; DEMO.tour=false; return; }\n", 1),
    ("  if(!isDemo()||!S.session||!S.session.active) return;\n  autoSupply();", "  if(!isDemo()||!S.session||!S.session.active||(window.B3_DEMO_STEP&&!S.started)) return;\n  autoSupply();", 1),
    # 자유모드 중간안 (11/18) : 운전 중 자재 조작 허용 (안전문은 그대로 — 운전 중 열면 인터락 E001 정지)
    ('    if(S.running&&k!=="table"){ toast("운전 중에는 자재를 다룰 수 없습니다. 먼저 STOP.","bad"); deduct("runMat"); return; }',
     '    if(S.running&&k!=="table"&&!window.FREEB){ toast("운전 중에는 자재를 다룰 수 없습니다. 먼저 STOP.","bad"); deduct("runMat"); return; }', 1),
]
SHELL_SCRIPTS = ("changelog.js", "kit.js", "human.js", "view3.js", "pack.js", "packsim.js", "pcourse.js", "crew.js", "aimmark.js", "fpctl.js", "topbar.js", "splash.js", "incpick.js", "pfp.js", "ffp.js", "oee.js", "oeeb.js", "demob.js", "walk.js", "shell.js")
FROM_POUCH = {"kit.js", "human.js"}


def app() -> str:
    text = BOT.build()
    for old, new, n in APP_PATCH:
        c = text.count(old)
        if c != n:
            sys.exit(f"app: '{old[:50]}' 가 {c} 번 (기대 {n})")
        text = text.replace(old, new)
    # 자유모드 중간안 (11/18) : "운전 중에는 …" 차단 해제 (안전문 제외)
    n = 0
    def sub(m):
        nonlocal n
        if "안전문" in m.group(2) or not re.search(r"운전 중|STOP|정지", m.group(2)):
            return m.group(0)
        n += 1
        return m.group(0).replace("if(S.running)", "if(S.running&&!window.FREEB)", 1)
    text = re.sub(r"if\(S\.running\)\{(\s*)toast\(\"([^\"]*)\"", sub, text)
    if n < 4:
        sys.exit(f"app: 운전 중 조작 금지 패턴이 {n} 곳뿐")
    print(f"app: 자유모드 운전 중 조작 금지 해제 {n} 곳")
    return text


sys.path.insert(0, str(ROOT / "idt_common"))
import splash as SPLASH   # noqa: E402  메인화면 공통 템플릿 (11/19)
SPLASH_CFG = {
    "title": "병 라인 IDT", "en": "Bottle Line · Interactive Digital Tutor", "prod": "병 충전 → 라벨 · 설명서 · 중량선별 → 판독 · 박스 포장",
    "extra": '<div id="rxSel">포장 품목 <button data-rx="1" class="on">전문의약품 (판독 · AG · 2명)</button><button data-rx="0">일반의약품 (판독 없음 · 1명)</button></div>',
    "workers": [{"id": "chooseF", "r": "F", "tag": "작업자 1 · FILLING ROOM", "nm": "🧍 충전실 작업자", "desc": "언스크램블러 · 실리카겔 · 정제 계수 · PE 필름 · 캡핑"},
                {"id": "chooseP1", "r": "P1", "tag": "작업자 2 · PACKING ROOM", "nm": "🧍 포장실 작업자 1", "desc": "설비 운전 (턴테이블 · 라벨 · 비전 · 설명서 · 중량선별) · 바코드 판독"},
                {"id": "chooseP2", "r": "P2", "tag": "작업자 3 · PACKING ROOM", "nm": "🧍 포장실 작업자 2", "desc": "박스 조립 · 봉함 · AG 라벨 부착 · 파렛트 적재 (전문의약품)"}],
    "cols": SPLASH.std_cols(lambda m: ("spOee", None) if m == "oee" else ("spInc", {"data-m": "inc"}) if m == "inc" else (None, {"data-m": m})),
}


def build() -> str:
    shell = (HERE / "shell.html").read_text(encoding="utf-8")
    src = lambda n: (ROOT / "pouch" / "v2" / "src" / n) if n in FROM_POUCH else (ROOT / "idt_common" / n) if n in ("aimmark.js", "fpctl.js", "topbar.js", "splash.js", "incpick.js") else (ROOT / "oee" / n) if n == "oee.js" else (HERE / n)
    js = "\n".join(f"/* ── {name} ── */\n" + src(name).read_text(encoding="utf-8") for name in SHELL_SCRIPTS)
    three = THREE.read_text(encoding="utf-8")
    for t in (js, three):
        if "</script" in t.lower():
            sys.exit("script text must not contain </script")
    a = base64.b64encode(app().encode("utf-8")).decode("ascii")
    shell = shell.replace("<!--__SPLASH__-->", SPLASH.render(SPLASH_CFG)).replace("/*__SPLASHCSS__*/", (ROOT / "idt_common" / "splash.css").read_text(encoding="utf-8"))
    for key, val in (("/*__OEECSS__*/", (ROOT / "oee" / "oee.css").read_text(encoding="utf-8")), ("/*__THREE__*/", three), ("__APP__", json.dumps(a)), ("/*__SHELL_JS__*/", js)):
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
