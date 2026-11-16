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
OUT = H.parent.parent / "파우치라인_IDT.html"   # 11/15 전환 : 새 3D 연결판이 정식 산출물 (옛 판은 pouch/build.py 로 남김)

V2_SCRIPTS = ("kit.js", "layout.js", "room.js", "form.js", "unwind.js", "hopper.js", "filler.js", "conv.js",
              "fillzone.js", "pack_feed.js", "pack_carton.js", "pack_insp.js", "packzone.js", "human.js", "pack_manual.js",
              "pack_anim.js", "anim.js")
ORDER = (  # (folder, file)
    ("old", "util.js"), ("old", "layout.js"), ("old", "data.js"), ("old", "state.js"), ("old", "sim.js"),
    ("v3", "anchors.js"), ("old", "hmi.js"), ("v3", "solpac.js"), ("old", "course.js"), ("old", "ui.js"), ("old", "fps.js"),
    ("v3", "bridge.js"), ("v3", "workers.js"), ("v3", "fp.js"), ("old", "autoplay.js"), ("old", "changelog.js"),
    ("oee", "oee.js"), ("v3", "oee_pouch.js"), ("v3", "cases.js"), ("v3", "edu.js"), ("v3", "boot.js"),
)
RENAME_CV = {"layout.js", "data.js", "state.js", "sim.js", "hmi.js", "course.js", "ui.js"}

PATCH = {
    "layout.js": [
        (r"R3.lo=[-9900,-10,-3300]; R3.hi=[12900,4300,2700];", "", 1),
    ],
    "hmi.js": [
        ('    nav.innerHTML=FNAV.map(', '    if(0) nav.innerHTML=FNAV.map(', 1),          # 충전기 : SOLPAC 화면 (solpac.js)
        ('    body.innerHTML=(FSCR[hScr]||FSCR.run)();', '    solpacDraw(body,nav);', 1),
        ('  const m=machOf(hMach);\n  $("#hMach")', '  const m=machOf(hMach); $("#hmi").classList.toggle("solpac",hMach==="fl"); $("#panel").classList.toggle("solpacP",hMach==="fl"); $("#hmi").classList.toggle("oneTab",tabs.length<2); $("#hmi").classList.toggle("big",hMach==="fl"&&SPBIG&&machPower("fl")&&!(typeof fpActive==="function"&&fpActive()));\n  $("#hMach")', 1),
        ('body.innerHTML=loginScreen(hMach);', 'body.innerHTML=hMach==="fl"?solpacLogin():loginScreen(hMach);', 1),
        ('function hbClick(id){', 'function hbClick(id){ if(id.startsWith("sp_")){ solpacClick(id); return; }', 1),
        ('if(mk==="fl") return HNV(scr);', 'if(mk==="fl") return flRoute(scr);', 1),
        ('return ph("홈","ISHIDA IX-EN · pancold-h",p.xrConv)+\'<div class="kpis">\'', 'return ph("홈","ISHIDA IX-EN · pancold-h",p.xrConv)+\'<div id="xrView" class="\'+(p.xrX?"on":"")+\'"></div><div class="kpis">\'', 1),
    ],
    "ui.js": [
        ('mLift:{e:"🛗",b:"주성분 STS 용기",s:()=>S.f.mainLift?"2층 데크 도착":"리프터로 올림"', 'mLift:{e:"🛗",b:"주성분 리프터 운반",s:()=>S.f.mainLift?"2층 데크 도착":"봉투 → 적재칸 → 데크"', 1),   # 11/16 : STS 용기의 봉투를 리프터 적재칸으로 옮겨 올림
        ('toast("주성분 STS 용기를 먼저 리프터로 올리세요.","bad")', 'toast("주성분을 먼저 리프터로 2층 데크에 올리세요.","bad")', 1),
        ('const nm=what==="roll"?"적색 인쇄 은박 롤":"주성분 STS 용기";', 'const nm=what==="roll"?"적색 인쇄 은박 롤":"주성분 봉투 · 드럼리프터";', 1),
        ('else act("lift",()=>{ S.f.mainLift=true; toast("주성분 STS 용기 — 리프터로 2층 데크 도착","good"); });', 'else act("lift",()=>{ S.f.mainLift=true; S.flags.liftAt="use"; toast("주성분 봉투 — STS 용기에서 리프터 적재칸으로 옮겨 2층 데크 도착","good"); });', 1),
        ('if(what==="roll") act("roll",()=>{ S.f.rollCarry="red"; toast("적색 인쇄 은박 롤 2인 1조 운반 완료","good"); });',
         'if(what==="roll") act("roll",()=>{ S.f.rollCarry="red"; S.flags.cartAt="unw"; S.flags.redTaken=true; toast("적색 인쇄 은박 롤 — 대차에 실어 언와인더 옆까지 운반 (2인 1조)","good"); });', 1),
        ('act("rollOut",()=>{ f.roll="red"; f.rollCarry=null; toast("적색 인쇄 은박 롤 장착 · 고정","good"); });',
         'act("rollMount",()=>{ f.roll="red"; f.rollCarry=null; toast("적색 인쇄 은박 롤 장착 · 고정","good"); });', 1),
        ('act("roll",()=>{ f.roll="plain"; toast("무지 은박 롤 장착","good"); });',
         'act("rollPlain",()=>{ f.roll="plain"; f.rollCarry=null; S.flags.cartAt="unw"; toast("은색 무지 은박 롤 — 대차로 운반 · 장착","good"); });', 1),
        ('  $("#lineStrip").innerHTML=', '  if(0) $("#lineStrip").innerHTML=', 1),   # 메인화면 순서도 삭제
        ('$("#courseBack").onclick=()=>{ ', '$("#courseBack").onclick=()=>{ $("#incPick").style.display="none"; ', 1),
        ('function goHome(){ ', 'function goHome(){ $("#incPick").style.display="none"; $("#oeeWrap")&&$("#oeeWrap").classList.remove("on"); ', 1),
        ('(st.watch?"라인을 감시하고 이상에 대응하세요.":"평가 진행 중 — 절차에 따라 수행하세요.")', '(isInc()?"라인을 감시하고 이상이 생기면 대응하세요.":st.watch?"라인을 감시하며 생산을 진행하세요.":"평가 진행 중 — 절차에 따라 수행하세요.")', 1),
        ("""'<h3>알람 · 이상사례 대응</h3><table class="ht"><tr><th>구분</th><th>명칭</th><th>발생</th></tr>'+inc+'</table>'+""", "", 1),
        ('(isEasy()?"기본모드":"심화모드")', '(isInc()?"이상사례 대처":isEasy()?"기본모드":"심화모드")', 1),
        ("const pan=d=>{ cam.txT=clamp(cam.txT+d*Math.max(700,cam.dist*0.25),-9500,12500); };", "const pan=d=>camPanLine(d);", 1),
        ("cam.dist>6000", "cam.dist>6", 1),
        ('const info="드래그 회전 · 휠 확대 · Shift/우클릭 드래그 이동";', 'const info="드래그 회전 · 휠 확대 · Shift/우클릭 드래그 이동 · 그래픽 "+GQ.label();', 1),
    ],
    "fps.js": [
        ("KeyH:host.help,", "KeyH:host.help,KeyC:host.crouch||(()=>{}),", 1),   # 1인칭 앉기 (C)
    ],
    "data.js": [
        ('nm:"리프터 · STS 용기", en:"LIFTER · STS CONTAINER"', 'nm:"드럼리프터 · 주성분", en:"DRUM LIFTER"', 1),
        ('d:"주성분 STS 용기를 2층 데크로 올립니다. 은박 · STS 용기는 반드시 2인 1조로 옮깁니다."', 'd:"STS 용기(맨 동쪽 중앙 파렛트)에 담긴 주성분 봉투를 리프터 적재칸으로 옮겨 원료투입구 아래에서 2층 데크로 올립니다. 리프터는 3인 1조(1명 운전 · 2명 하역)."', 1),
    ],
    "course.js": [
        ('A.push(T_("lift","주성분 STS 용기 리프터로 2층 데크에 올림","[주성분 STS 용기] 를 눌러 리프터로 2층 데크에 올립니다."', 'A.push(T_("lift","주성분 봉투를 리프터 적재칸에 옮겨 2층 데크로 올림","[주성분 리프터 운반] 을 눌러 STS 용기의 주성분 봉투를 드럼리프터 적재칸에 옮겨 담고, 원료투입구 아래로 밀고 가서 2층 데크로 올립니다."', 1),
        ('주성분 STS 용기를 리', '주성분 봉투를 리', 1),
        ('const isExam=()=>!!S&&(S.mode==="exam"||S.mode==="examEasy");', 'const isExam=()=>!!S&&(S.mode==="exam"||S.mode==="examEasy"||S.mode==="incExam");', 1),
        ('examEasy:"기본모드 · 평가",exam:"심화모드 · 평가"};', 'examEasy:"기본모드 · 평가",exam:"심화모드 · 평가",incLearn:"이상사례 대처 · 학습",incExam:"이상사례 대처 · 평가"};', 1),
        ('STEPS_CACHE=S.room==="F"?stepsFill(isEasy()):stepsPack(isEasy());', 'STEPS_CACHE=isInc()?stepsInc():S.room==="F"?stepsFill(isEasy()):stepsPack(isEasy());', 1),
        ("  if(isExam()) scheduleExamTrouble();\n", "", 1),   # 기본 · 심화 : 예약 이상상황 없음 (이상사례 대처 교육으로 분리)
        ("정기 공정검사(IPC)와 알람에 대응합니다.", "정기 공정검사(IPC)를 수행합니다.", 1),
        ("화면 오류를 감시하고 이상사례에 대응합니다.", "화면 오류를 감시합니다.", 1),
        ("  showResult(manual);\n", "  (isInc()?showIncResult:showResult)(manual);\n", 1),
        ("  S.stepAt=tSim;\n  if(typeof fpSet", "  S.stepAt=tSim; if(typeof propsReset===\"function\") propsReset();\n  if(typeof fpSet", 1),   # 새 세션 : 작업자 작업 · 끌던 대차 초기화
        ('if(!S.activeTrouble) beginRecovery("F1");', 'if(!S.activeTrouble) beginRecovery(S.flags.incK==="RF4"?"RF4":"F1");', 1),   # 중량 점검 사례 (cases.js RF4)
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
    base = {"old": OLD, "v3": SRC, "oee": H.parent.parent / "oee"}[folder]
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


BODY_PATCH = [   # 메인화면 : 순서도 삭제 · 과정 → 기본 · 심화 · OEE
    ('<span>R · 우클릭</span>', '<span>C</span>앉기 · 일어서기 (눈높이 약 1.1 m)<span>R · 우클릭</span>', 1),
    ('      <div id="lineStrip"></div>\n', '', 1),
    ('<button class="s" id="spEasy">기본모드 · 학습<small>핵심 절차 안내</small></button>',
     '<h4>기본</h4><button class="s" id="spEasy">기본 · 학습<small>라인 가동 핵심 절차 안내</small></button>', 1),
    ('<button class="e" id="spExamEasy">기본모드 · 평가</button>', '<button class="e" id="spExamEasy">기본 · 평가</button>', 1),
    ('<button class="s" id="spGuide">심화모드 · 학습<small>전체 절차 단계별 안내</small></button>',
     '<h4>심화</h4><button class="s" id="spGuide">심화 · 학습<small>라인 가동 전체 절차 단계별 안내</small></button>', 1),
    ('<button class="e" id="spExam">심화모드 · 평가</button>\n        </div>\n      </div>',
     '<button class="e" id="spExam">심화 · 평가</button>\n        </div>\n'
     '        <div class="modeColumn oee">\n          <h4>OEE</h4><button class="o" id="spOee">OEE 관리 대시보드<small>OEE DB 연결 · 부동 트렌드 · 교육 효과</small></button>\n'
     '          <button class="o2" id="spInc">이상사례 대처 교육<small>부동 빈도 · 중요도 순 학습 · 평가</small></button>\n        </div>\n      </div>\n'
     '      <div id="incPick" style="display:none"></div>', 1),
]


def body() -> str:
    text = (OLD / "body.html").read_text(encoding="utf-8")
    for old, new, n in BODY_PATCH:
        c = text.count(old)
        if c != n:
            sys.exit(f"body.html: '{old[:50]}' 가 {c} 번 (기대 {n})")
        text = text.replace(old, new)
    return text


def build() -> str:
    shell = (OLD / "shell.html").read_text(encoding="utf-8")
    three = (V2 / "vendor" / "three.min.js").read_text(encoding="utf-8")
    js = "\n".join(f"/* ── v2/{n} ── */\n" + (V2 / "src" / n).read_text(encoding="utf-8") for n in V2_SCRIPTS)
    js += "\n" + "\n".join(f"/* ── {f}/{n} ── */\n" + load(f, n) for f, n in ORDER)
    names = re.findall(r"^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)", js, re.M)   # 같은 이름 최상위 선언 2번 → 페이지 전체가 멈춤 (11/16 pv 충돌)
    dup = sorted({n for n in names if names.count(n) > 1})
    if dup:
        sys.exit("최상위 이름 중복 선언 : " + ", ".join(dup))
    if "</script" in js.lower() or "</script" in three.lower():
        sys.exit("script text must not contain </script")
    parts = {
        "/*__CSS__*/": (OLD / "style.css").read_text(encoding="utf-8") + "\n" + (SRC / "style3.css").read_text(encoding="utf-8") + "\n" + (H.parent.parent / "oee" / "oee.css").read_text(encoding="utf-8"),
        "<!--__BODY__-->": body(),
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
