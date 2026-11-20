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
    # 작업자 보행 속도 = 세 IDT 공통 1.4 m/s (idt_common/crewkit.js IDT_WALK · 11/19 통합 3단계 · 원본 1.9 m/s)
    ("st=Math.min(dd,dt*1900);", "st=Math.min(dd,dt*1400);", 1),
    # 정제 투입 = 리프터로 올려 붓기 (11/20 사용자 결정) : 서는 자리를 발판 동쪽 끝(리프터 옆)으로 · 리프터 준비(싣기 · 상승 · 계단) 동안 작업 시간 멈춤 (셸 crew.js B3_HOLD)
    ('tab:   {stand:[436,-1240], reach:[436,1830,-780], carry:"drum", view:"tab", dur:2.9, pour:true},', 'tab:   {stand:[590,-1250], reach:[436,1830,-780], carry:"drum", view:"tab", dur:3.4, pour:true},', 1),
    ('      if(J.phase==="walk"){ J.phase="work"; J.t=0; }\n      J.t+=dt;', '      if(J.phase==="walk"){ J.phase="work"; J.t=0; }\n      J.t+=(window.parent&&window.parent.B3_HOLD&&window.parent.B3_HOLD(J))?0:dt;', 1),
    # 작업자는 셸이 파우치 인체 모델로 그림 (원본 작업자 형상 생략)
    ("function drawWorkers(){ for(const w of WK){", "function drawWorkers(){ if(window.B3_EXT) return; for(const w of WK){", 1),
    # 시연모드 단계 버튼식 (11/18 사용자 결정) : 셸이 단계마다 준비 · 가동 — 앱 시연 설정은 건너뛰고, 가동 전에는 자동 보충 · 복구 안 함
    ("function demoSetup(){\n", "function demoSetup(){\n  if(window.B3_DEMO_STEP&&S.mode===\"demo\"){ S.cnt.target=1e9; DEMO.tour=false; return; }\n", 1),
    ("  if(!isDemo()||!S.session||!S.session.active) return;\n  autoSupply();", "  if(!isDemo()||!S.session||!S.session.active||(window.B3_DEMO_STEP&&!S.started)) return;\n  autoSupply();", 1),
    # 자유모드 중간안 (11/18) : 운전 중 자재 조작 허용 (안전문은 그대로 — 운전 중 열면 인터락 E001 정지)
    ('    if(S.running&&k!=="table"){ toast("운전 중에는 자재를 다룰 수 없습니다. 먼저 STOP.","bad"); deduct("runMat"); return; }',
     '    if(S.running&&k!=="table"&&!window.FREEB){ toast("운전 중에는 자재를 다룰 수 없습니다. 먼저 STOP.","bad"); deduct("runMat"); return; }', 1),
    # 1인칭(충전실 작업자 = 앱 작업자 A) : 작업을 마친 뒤 통로로 걸어 나가는 시간 없이 바로 다음 조작 가능 (11/20 1인칭 점검 — 보이지 않는 작업자가 나가는 동안 "다른 작업 중"으로 막히던 문제)
    ('        if(J.j.door){ J.phase="exit";', '        if(w===WK[0]&&window.parent&&window.parent.B3_FPME&&window.parent.B3_FPME()) w.job=null;\n        else if(J.j.door){ J.phase="exit";', 1),
    # 유틸리티(압축공기 · 메인 전원 · 집진기 · 안전문) = 파우치 방식 (11/20) : 3인칭에서 타일을 누르면 작업자가 그 설비로 걸어가 손을 뻗은 뒤 조작
    #   1인칭(충전실 작업자)은 플레이어가 그 자리에 가서 누르므로 바로 적용 (셸 crew.js B3_FPME) · 위치 = 셸 ffp.js FFU (압축공기 = UA-120 뒤 천장 강하관)
    ('  look:  {stand:[0,AISLE-150], reach:null, carry:null, dur:1.4}',
     '  uAir:  {stand:[-4900,-1640], reach:[-4900,1205,-1305], carry:null, dur:1.4},\n'
     '  uMain: {stand:[-6400,-2170], reach:[-6400,1450,-2560], carry:null, dur:1.2},\n'
     '  uDust: {stand:[-5600,-2170], reach:[-5600,1400,-2610], carry:null, dur:1.0},\n'
     '  uDoor: {stand:[-4300,900], reach:[-4300,1100,420], carry:null, dur:1.4},\n'
     '  look:  {stand:[0,AISLE-150], reach:null, carry:null, dur:1.4}', 1),
    ('  mat("#mTable","table","table",()=>{ unloadTable(); },"완제품 회수 — 다음 공정으로 이송");\n}',
     '  mat("#mTable","table","table",()=>{ unloadTable(); },"완제품 회수 — 다음 공정으로 이송");\n'
     '  for(const id of ["uAir","uMain","uDust","uDoor"]){ const e=$("#"+id), f=e.onclick; e.onclick=ev=>{ if(!gate("#"+id)) return; utilDo(id,()=>f.call(e,ev)); }; }\n}\n'
     '/* 유틸리티 조작 : 3인칭 = 작업자가 걸어가서 · 1인칭 = 바로 (파우치 act 와 같음) */\n'
     'function utilDo(k,fn){ if(window.parent&&window.parent.B3_FPME&&window.parent.B3_FPME()){ fn(); return; }\n'
     '  const w=wkFor(JOBS[k].stand); if(w.job){ if(w.job.key!==k) toast("작업자가 다른 작업 중입니다."); return; }\n'
     '  startWork(k,fn); renderTiles(); }', 1),
]
SHELL_SCRIPTS = ("changelog.js", "kit.js", "look.js", "human.js", "view3.js", "pack.js", "packsim.js", "pcourse.js", "crewkit.js", "crew.js", "aimmark.js", "fpctl.js", "topbar.js", "splash.js", "incpick.js", "modes.js", "pfp.js", "ffp.js", "oee.js", "oeeb.js", "demob.js", "walk.js", "shell.js")
FROM_POUCH = {"kit.js", "human.js"}


# 1인칭 기준 문구 (11/20 사용자 지시 "모든 IDT 의 근간은 1인칭") : 왼쪽 타일 이름을 누르라는 안내 → 현장 설비 · 위치로 (정확한 문구만 · 없으면 빌드 중단)
FP_TEXT = [
    ("유틸리티의 [압축공기] 를 켜서 라인에 6 bar 를 공급합니다.", "UA-120 뒤 압축공기 밸브를 열어 라인에 6 bar 를 공급합니다."),
    ("[압축공기] 를 켭니다 (5.5 bar 이상).", "UA-120 뒤 압축공기 밸브를 엽니다 (5.5 bar 이상)."),
    ("[메인 전원] 을 켭니다. 6기종", "전기판넬의 메인 전원 스위치를 켭니다. 6기종"),
    ("[메인 전원] 을 꺼서 라인을", "전기판넬의 메인 전원 스위치를 꺼서 라인을"),
    ("[집진기] 를 켭니다.", "집진기 전원을 켭니다."),
    ("[빈 병] 을 눌러 UA-120 호퍼에 빈 병을 투입합니다.", "UA-120 벌크 호퍼에 빈 병을 투입합니다."),
    ("[빈 병] 을 눌러 호퍼에 빈 병을 투입합니다.", "UA-120 벌크 호퍼에 빈 병을 투입합니다."),
    ("[실리카겔 롤] 을 눌러 SG-120 릴에 파우치 롤을 장착합니다.", "SG-120 릴에 실리카겔 파우치 롤을 장착합니다."),
    ("[실리카겔 롤] 을 눌러 새 롤을 장착합니다.", "SG-120 릴에 새 실리카겔 롤을 장착합니다."),
    ("[정제 투입] 을 눌러 계수기 호퍼에 정제를 투입합니다.", "리프터로 정제 드럼을 올려 DMC-60T 호퍼에 정제를 투입합니다."),
    ("[정제 투입] 을 눌러 호퍼에 보충합니다.", "리프터로 정제 드럼을 올려 DMC-60T 호퍼에 보충합니다."),
    ("[PE 필름 롤] 을 눌러 HPE-100 에 필름 롤을 장착합니다.", "HPE-100 에 PE 필름 롤을 장착합니다."),
    ("[PE 필름 롤] 을 눌러 새 롤을 장착합니다.", "HPE-100 에 새 PE 필름 롤을 장착합니다."),
    ("[캡 투입] 을 눌러 캡 호퍼에 캡을 투입합니다.", "RCS-120 캡 호퍼에 캡을 투입합니다."),
    ("[캡 투입] 을 눌러 캡을 보충합니다.", "RCS-120 캡 호퍼에 캡을 보충합니다."),
    ("[리젝트] 를 눌러 불합격 병을 회수합니다.", "리젝트 트레이에서 불합격 병을 회수합니다."),
    ("[완제품 회수] 를 눌러 집적 테이블을 비웁니다.", "집적 테이블에서 완제품을 회수해 비웁니다."),
]


def app() -> str:
    text = BOT.build()
    for old, new in FP_TEXT:
        if old not in text:
            sys.exit(f"app: 1인칭 문구 '{old[:30]}' 없음")
        text = text.replace(old, new)
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
    # 결과 창 공통 (11/19 통합 4단계) : 앱 문서 끝에서 showResult 를 공통 결과 창으로 (appres.js)
    js = (HERE / "appres.js").read_text(encoding="utf-8")
    if text.count("</body>") != 1 or "</script" in js.lower():
        sys.exit(f"app: </body> 가 {text.count('</body>')} 번 (기대 1)")
    return text.replace("</body>", "<script>\n" + js + "</script>\n</body>")


sys.path.insert(0, str(ROOT / "idt_common"))
import splash as SPLASH   # noqa: E402  메인화면 공통 템플릿 (11/19)
SPLASH_CFG = {
    "title": "병 라인 IDT", "prod": "병 충전 → 라벨 · 설명서 · 중량선별 → 판독 · 박스 포장",
    "extra": '<div id="rxSel"><span>포장 품목</span><button data-rx="1" class="on">전문의약품<span class="tipB" role="tooltip">판독 · AG 라벨 · 포장실 작업자 2명</span></button><button data-rx="0">일반의약품<span class="tipB" role="tooltip">판독 없음 · 포장실 작업자 1명</span></button></div>',
    "note": "고르지 않은 포장실 작업자는 자동으로 일합니다.",
    "workers": [{"id": "chooseF", "r": "F", "tag": "FILLING ROOM", "nm": "충전실 작업자", "desc": "병 충전 · 캡핑", "tip": "언스크램블러 · 실리카겔 · 정제 계수(리프터 투입) · PE 필름 · 캡핑"},
                {"id": "chooseP1", "r": "P1", "tag": "PACKING ROOM · 1", "nm": "포장실 작업자 1", "desc": "설비 운전 · 판독", "tip": "턴테이블 · 라벨 · 비전 · 설명서 · 중량선별 운전 · 바코드 판독"},
                {"id": "chooseP2", "r": "P2", "tag": "PACKING ROOM · 2", "nm": "포장실 작업자 2", "desc": "박스 포장 · 적재", "tip": "박스 조립 · 봉함 · AG 라벨 부착 · 파렛트 적재 (전문의약품만)"}],
    "cols": SPLASH.std_cols(lambda m: ("spOee", None) if m == "oee" else ("spInc", {"data-m": "inc"}) if m == "inc" else (None, {"data-m": m})),
}


def build() -> str:
    shell = (HERE / "shell.html").read_text(encoding="utf-8")
    src = lambda n: (ROOT / "pouch" / "v2" / "src" / n) if n in FROM_POUCH else (ROOT / "idt_common" / n) if n in ("aimmark.js", "fpctl.js", "topbar.js", "splash.js", "incpick.js", "crewkit.js", "modes.js", "look.js") else (ROOT / "oee" / n) if n == "oee.js" else (HERE / n)
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
