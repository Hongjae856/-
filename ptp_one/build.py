"""PTP 통합라인 IDT (단일 화면) : src/filler.html + src/line.html (원본 수정 없음) -> PTP통합라인_단일화면_IDT.html

· 두 IDT 원본을 읽어 방 모드 스크립트(common.js + 방별 스크립트)를 </body> 앞에 주입한다.
· 원본 내부의 지역 코드(익명 블록 · 지역 상수)는 함수 래핑으로 바꿀 수 없으므로
  PATCHES 의 문자열 치환으로 '방 모드일 때만' 동작하는 분기를 끼워 넣는다.
  각 치환 대상은 원본에 정확히 1번 있어야 하며, 없거나 여러 번이면 빌드를 멈춘다.
· 결과 두 문서를 base64 로 shell.html 에 내장한다.
"""
import base64
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SRC = ROOT / "src"
OUT = ROOT / "PTP통합라인_단일화면_IDT.html"

PATCHES = {
    "filler": [
        # 방 배경 : 천장 없는 단면 · 두 구역 바닥 · 뒷벽 (원래의 충전실 배경 대신)
        ("/* ── 교육용 충전실 작업장 : 뒷벽 · 코브 · 천장 조명 ── */",
         "/* ── 교육용 충전실 작업장 : 뒷벽 · 코브 · 천장 조명 ── */\nif(window.ROOM_BG)ROOM_BG(g,FL);else"),
        ("/* ── 바닥면 ── */\nconst fc=",
         "/* ── 바닥면 ── */\nif(!window.ROOM_BG){\nconst fc="),
        ("g.restore();\n/* ── 소프트 접지 그림자 ── */",
         "g.restore();\n}\n/* ── 소프트 접지 그림자 ── */"),
        # 통합 렌더러가 GPU 로 그리므로 CPU 투영 · 컬링 루프를 건너뛴다
        ("for(let i=0;i<M3.faces.length;i++){\nconst f=M3.faces[i];let v=f.v,ps=v.map(prj);",
         "for(let i=0;i<(window.UNI_SKIP?0:M3.faces.length);i++){\nconst f=M3.faces[i];let v=f.v,ps=v.map(prj);"),
    ],
    "line": [
        # 방 배경
        ("function drawRoom(W,H){\n  const g=ctx2;",
         "function drawRoom(W,H){\n  if(window.ROOM_BG)return ROOM_BG(W,H);\n  const g=ctx2;"),
        # 작업자 LOD : 카메라에서 멀면 원기둥 · 타원체 분할 수를 줄인다 (가까우면 원본과 동일)
        ("tube(W(s.a),W(s.b),s.r*scale,col,14,true)",
         "tube(W(s.a),W(s.b),s.r*scale,col,window.ROOM_LOD?ROOM_LOD(x,z).t:14,true)"),
        ("cuteEllPoints(s.c,s.r,big?18:12,big?11:8)",
         "(window.ROOM_LOD?ROOM_LOD(x,z).e(s.c,s.r,big):cuteEllPoints(s.c,s.r,big?18:12,big?11:8))"),
        # 카토너 사이클 속도 : 연동 중에는 표시 CPM 그대로 (라인 스케일 미적용)
        ("const adv=(S.cpm/60)*LINE_SCALE*dt;",
         "const adv=(S.cpm/60)*(window.ROOM_LINK&&ROOM_LINK()?1:LINE_SCALE)*dt;"),
        # 적응 해상도 : 렌더 해상도에 GFX.q(0.6~1) 를 곱한다 (m3Resize · m3Draw 두 곳)
        ("Math.min(1.8,window.devicePixelRatio||1)",
         "Math.min(1.8,window.devicePixelRatio||1)*(window.GFX?GFX.q:1)", 2),
        ("tick=function(dt){S.spd.line=LINE_CPM;",
         "tick=function(dt){S.spd.line=(window.ROOM_CPM&&ROOM_CPM())||LINE_CPM;"),
        # 스태커 : 연결 컨베이어에서 받은 팩만큼 수직 적층
        ("if(live){ const n=S.running?11:6;",
         "{ const _rt=window.ROOM_TOWER?ROOM_TOWER():null; if(live||_rt!=null){ const n=_rt!=null?_rt:(S.running?11:6);"),
        ("for(let i=0;i<n;i++) displayBlister(sx-13,sx+13,y+18+i*6.4,y+22.4+i*6.4,LP-11,LP+11); }",
         "for(let i=0;i<n;i++){ const _b=y+18+i*(window.ROOM_STACKER?5.8:6.4);"
         " displayBlister(sx-13,sx+13,_b,_b+4.4,LP-11,LP+11); } } }"),
        # 스태커 하우징 : 방 모드에서는 하부 하우징 + 가이드 로드 매거진 (쌓인 팩이 보이도록)
        ("   bx(sx-42,sx+42,y+14,y+104,LP-26,LP+26,COL.inox,COL.inoxD);\n"
         "   bx(sx-36,sx+36,y+100,y+108,LP-22,LP+22,COL.steel,COL.alu);",
         "   if(window.ROOM_STACKER) ROOM_STACKER(sx,y,LP); else {\n"
         "   bx(sx-42,sx+42,y+14,y+104,LP-26,LP+26,COL.inox,COL.inoxD);\n"
         "   bx(sx-36,sx+36,y+100,y+108,LP-22,LP+22,COL.steel,COL.alu); }"),
        # 버킷 · 카톤 : 버킷마다 실제 적재 팩 수 (빈 버킷은 카톤 · 설명지 미공급)
        ("     packAt(px,LP,2);\n     if(px>X3(600)-E) leafAt(px,LP+11);",
         "     const _n=window.ROOM_N?ROOM_N(k):2; packAt(px,LP,_n);\n     if(px>X3(600)-E&&_n>0) leafAt(px,LP+11);"),
        ("     loadingCarton(px,y,zc);\n   }",
         "     if(!window.ROOM_N||ROOM_N(k)>0) loadingCarton(px,y,zc);\n   }"),
        ("     packAt(px,LP+(LC-LP)*insertion,2);\n     leafAt(px,LP+11+(LC+11-(LP+11))*insertion); }",
         "     const _n=window.ROOM_N?ROOM_N(0):2; packAt(px,LP+(LC-LP)*insertion,_n);\n"
         "     if(_n>0) leafAt(px,LP+11+(LC+11-(LP+11))*insertion); }"),
        ("     packAt(px,zc,2);leafAt(px,zc+11); }",
         "     const _n=window.ROOM_N?ROOM_N(k):2; packAt(px,zc,_n); if(_n>0) leafAt(px,zc+11); }"),
    ],
}

SCRIPTS = {"filler": ("common.js", "layout.js", "gfx_common.js", "uni_gfx.js", "filler_one.js"),
           "line": ("common.js", "layout.js", "gfx_common.js", "uni_gfx.js", "line_one.js")}
SHELL_SCRIPTS = ("changelog.js", "bus.js", "hub.js", "shell.js")


def patched(key: str) -> str:
    text = (SRC / f"{key}.html").read_text(encoding="utf-8")
    for patch in PATCHES[key]:
        old, new = patch[0], patch[1]
        want = patch[2] if len(patch) > 2 else 1
        n = text.count(old)
        if n != want:
            sys.exit(f"{key}.html: patch anchor found {n} times (expected {want}): {old[:60]!r}")
        text = text.replace(old, new)
    parts = [f"<script>window.UNI_SIDE='{key}';</script>"]
    for name in SCRIPTS[key]:
        body = (HERE / name).read_text(encoding="utf-8")
        if "</script" in body.lower():
            sys.exit(f"{name} must not contain </script")
        parts.append(f"<script>/* ── ptp_one/{name} ── */\n{body}\n</script>")
    inject = "\n".join(parts)
    at = text.rfind("</body>")
    if at < 0:
        sys.exit(f"{key}.html has no </body>")
    return text[:at] + inject + "\n" + text[at:]


def build() -> str:
    shell = (HERE / "shell.html").read_text(encoding="utf-8")
    apps = {key: base64.b64encode(patched(key).encode("utf-8")).decode("ascii") for key in ("filler", "line")}
    js = "\n".join(f"/* ── {name} ── */\n" + (HERE / name).read_text(encoding="utf-8") for name in SHELL_SCRIPTS)
    if "</script" in js.lower():
        sys.exit("shell scripts must not contain </script")
    for key, val in (("__APPS__", json.dumps(apps, separators=(",", ":"))), ("/*__SHELL_JS__*/", js)):
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
