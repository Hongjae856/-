"""파우치 라인 IDT (새 3D 연결판) — 교육 로직(pouch/src) + 새 3D(pouch/v2/src) + 연결 계층(pouch/v3/src)

pouch/src 의 화면 · 시나리오 · 판정 로직은 그대로 쓰고, 옛 3D 엔진(engine · gfx · models · dynamic · fp)
대신 pouch/v3/src 의 연결 계층을 넣는다. 옛 좌표(mm)를 쓰던 몇 곳은 아래 PATCH 로 새 좌표(m)로 바꾼다
(바꿀 문자열이 정확히 지정 횟수만큼 있어야 빌드된다).
"""
import re
import sys
from pathlib import Path

H = Path(__file__).resolve().parent
OLD = H.parent / "src"
V2 = H.parent / "v2"
SRC = H / "src"
OUT = H / "test_idt.html"   # 검증 전까지 시험 출력 (전환 시 파우치라인_IDT.html)

V2_SCRIPTS = ("kit.js", "layout.js", "room.js", "form.js", "unwind.js", "hopper.js", "filler.js", "conv.js",
              "fillzone.js", "pack_feed.js", "pack_carton.js", "pack_insp.js", "packzone.js", "human.js", "pack_manual.js",
              "pack_anim.js", "anim.js")
ORDER = (  # (folder, file)
    ("old", "util.js"), ("old", "layout.js"), ("old", "data.js"), ("old", "state.js"), ("old", "sim.js"),
    ("v3", "anchors.js"), ("old", "hmi.js"), ("old", "course.js"), ("old", "ui.js"), ("old", "fps.js"),
    ("v3", "bridge.js"), ("v3", "workers.js"), ("v3", "fp.js"), ("old", "autoplay.js"), ("old", "changelog.js"),
    ("v3", "boot.js"),
)
RENAME_CV = {"layout.js", "data.js", "state.js", "sim.js", "hmi.js", "course.js", "ui.js"}

PATCH = {
    "layout.js": [
        (r"R3.lo=[-9900,-10,-3300]; R3.hi=[12900,4300,2700];", "", 1),
    ],
    "ui.js": [
        ("const pan=d=>{ cam.txT=clamp(cam.txT+d*Math.max(700,cam.dist*0.25),-9500,12500); };", "const pan=d=>camPanLine(d);", 1),
        ("cam.dist>6000", "cam.dist>6", 1),
        ('const info="드래그 회전 · 휠 확대 · Shift/우클릭 드래그 이동";', 'const info="드래그 회전 · 휠 확대 · Shift/우클릭 드래그 이동 · 그래픽 "+GQ.label();', 1),
    ],
    "course.js": [
        ('FX(FIL.xc,1500,FIL.z1+40,"front"', 'FX(...ANC.sealFront,"front"', 1),
        ('FX(PANEL_F.x,1100,PANEL_F.z,"panel"', 'FX(...ANC.panelIn,"panel"', 1),
        ('FX(FIL.xc,700,FIL.z1,"front"', 'FX(...ANC.limit,"front"', 1),
        ('FX(FIL.x0-300,950,CVL.z+330,"front"', 'FX(...ANC.cntConv,"chute"', 1),
        ('FX(-3600,CVL.y+60,CVL.z,"leak"', 'FX(...ANC.convMotor,"chute"', 1),
        ('FX(FIL.xc,1500,FIL.z0-180,"prn"', 'FX(...ANC.prn,"prn"', 2),
        ('FX(FIL.xc+300,1500,FIL.z0-180,"prn"', 'FX(...ANC.vis,"prn"', 1),
        ('FX(FIL.xc,NOZ.y,NOZ.z,"front"', 'FX(...ANC.nozzle,"front"', 1),
        ("fix:[FIL.xc,DECK.y+200,FIL.z1+10]", "fix:ANC.dialF", 1),
        ("fix:[FIL.xc,1500,FIL.z0-180]", "fix:ANC.prn", 1),
        ("fix:[FIL.xc,1020,CVL.z-40]", "fix:ANC.chute", 1),
        ("fix:[(PR.x0+PR.x1)/2,700,-120]", "fix:ANC.prHead", 1),
        ("fix:[2600,PK.y+900,CT.z0+250]", "fix:ANC.leaf", 1),
    ],
}


def load(folder: str, name: str) -> str:
    base = {"old": OLD, "v3": SRC}[folder]
    text = (base / name).read_text(encoding="utf-8")
    if folder == "old" and name in RENAME_CV:
        text = re.sub(r"\bCV\b", "CVL", text)          # 새 3D 의 CV(배출 컨베이어) 와 이름 충돌 방지
    if folder == "old" and name == "layout.js":
        i = text.index("/* ── 카메라 시점 ── */")       # 옛 카메라 시점 · 작업 시점은 anchors.js 로 대체
        text = text[:i]
    if folder == "old" and name == "ui.js":
        i = text.index("const LBL=[")
        j = text.index("];", i) + 2
        text = text[:i] + "const LBL=LBL3;" + text[j:]
    for old, new, n in PATCH.get(name, []) if folder == "old" else []:
        c = text.count(old)
        if c != n:
            sys.exit(f"{name}: '{old[:50]}' 가 {c} 번 (기대 {n})")
        text = text.replace(old, new)
    return text


def build() -> str:
    shell = (OLD / "shell.html").read_text(encoding="utf-8")
    three = (V2 / "vendor" / "three.min.js").read_text(encoding="utf-8")
    js = "\n".join(f"/* ── v2/{n} ── */\n" + (V2 / "src" / n).read_text(encoding="utf-8") for n in V2_SCRIPTS)
    js += "\n" + "\n".join(f"/* ── {f}/{n} ── */\n" + load(f, n) for f, n in ORDER)
    if "</script" in js.lower() or "</script" in three.lower():
        sys.exit("script text must not contain </script")
    parts = {
        "/*__CSS__*/": (OLD / "style.css").read_text(encoding="utf-8") + "\n" + (SRC / "style3.css").read_text(encoding="utf-8"),
        "<!--__BODY__-->": (OLD / "body.html").read_text(encoding="utf-8"),
    }
    for key, text in parts.items():
        if shell.count(key) != 1:
            sys.exit(f"shell.html must contain {key} exactly once")
        shell = shell.replace(key, text)
    if shell.count("/*__JS__*/") != 1:
        sys.exit("shell.html must contain /*__JS__*/ exactly once")
    # three.js 는 strict 모드 밖 별도 스크립트로 먼저 싣는다
    shell = shell.replace("<script>\n\"use strict\";\n/*__JS__*/", "<script>" + three + "</script>\n<script>\n\"use strict\";\n" + js)
    if "/*__JS__*/" in shell:
        sys.exit("shell.html script block layout changed")
    return shell


def main() -> None:
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else OUT
    out.write_text(build(), encoding="utf-8")
    print(f"built {out} ({out.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
