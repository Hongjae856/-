"""메인화면 공통 템플릿 (세 IDT · 11/19 사용자 지시 "메인화면부터 UI 통일 · 코드 구조 통일" · 파우치 기준)

각 IDT 의 build.py 가 render(cfg) 로 메인화면 HTML 을 만든다. 모양은 idt_common/splash.css, 동작(선택 표시 · 안내 문구)은 idt_common/splash.js.
IDT 마다 다른 것은 설정값으로만 둔다 : 제목 · 부제 · 작업자 카드 · (병) 포장 품목 선택 · (PTP) 체인지파트 과정 열.

cfg = {
  "title": "파우치 라인 IDT", "en": "Pouch Line · Interactive Digital Tutor", "prod": "제품 · 목표 (없으면 생략)",
  "extra": "작업자 카드 위에 넣을 HTML (병 : 포장 품목 선택)",
  "workers": [{"id": "chooseF", "r": "F", "tag": "작업자 1 · FILLING ROOM", "nm": "🧍 충전실 작업자", "desc": "…"}, …],
  "cols": [{"h": "기본", "cls": "", "btns": [{"id": "spEasy", "cls": "s", "nm": "기본 · 학습", "sm": "…", "attrs": {"data-m": "easy"}}, …]}, …],
}
"""
from html import escape


def _attrs(d):
    return "".join(f' {k}="{escape(str(v), quote=True)}"' for k, v in (d or {}).items())


def btn(b):
    sm = f'<small>{b["sm"]}</small>' if b.get("sm") else ""
    idp = f' id="{b["id"]}"' if b.get("id") else ""
    return f'<button class="{b.get("cls", "s")}"{idp}{_attrs(b.get("attrs"))}>{b["nm"]}{sm}</button>'


def std_cols(mk, demo_sm="작업자별 장비 ON → 가동 → 생산까지 간단히", free_sm="순서 · 감점 · 평가 없음 · 기동 조건 해제", course=None):
    """표준 5열 : 기본 · 심화 · 시연 · 자유 · OEE.  mk(m) → (id, attrs) — IDT 별 버튼 식별 방식.
    course 가 있으면 기본 · 심화 두 열 대신 그 열들을 씀 (PTP : 가동 · 체인지파트)."""
    def B(m, cls, nm, sm=None):
        i, a = mk(m)
        return {"id": i, "cls": cls, "nm": nm, "sm": sm, "attrs": a}
    cols = course or [
        {"h": "기본", "btns": [B("easy", "s", "기본 · 학습", "라인 가동 핵심 절차 안내"), B("examEasy", "e", "기본 · 평가")]},
        {"h": "심화", "btns": [B("guide", "s", "심화 · 학습", "라인 가동 전체 절차 단계별 안내"), B("exam", "e", "심화 · 평가")]},
    ]
    return cols + [
        {"h": "시연", "cls": "demo", "btns": [B("demo", "d", "시연모드", demo_sm)]},
        {"h": "자유", "cls": "free", "btns": [B("free", "fr", "자유모드", free_sm)]},
        {"h": "OEE", "cls": "oee", "btns": [B("oee", "o", "OEE 관리 대시보드", "OEE DB 연결 · 부동 트렌드 · 교육 효과"),
                                            B("inc", "o2", "이상사례 대처 교육", "부동 빈도 · 중요도 순 학습 · 평가")]},
    ]


def render(cfg):
    W = cfg["workers"]
    workers = "".join(
        f'<button id="{w["id"]}" class="main wait" data-r="{w["r"]}"><small>{w["tag"]}</small><strong>{w["nm"]}</strong><span>{w["desc"]}</span></button>'
        for w in W)
    cols = "".join(
        f'<div class="modeColumn {c.get("cls", "")}"><h4>{c["h"]}</h4>' + "".join(btn(b) for b in c["btns"]) + "</div>"
        for c in cfg["cols"])
    prod = f'<p class="prodLine">{cfg["prod"]}</p>' if cfg.get("prod") else ""
    return (f'<div class="box"><h1>{cfg["title"]}<small>{cfg["en"]}</small></h1>{prod}{cfg.get("extra", "")}'
            f'<div id="crewHint"></div><div id="coursePicker" class="n{len(W)}">{workers}</div>'
            f'<div class="go n{len(cfg["cols"])}">{cols}</div>'
            '<div id="incPick" style="display:none"></div><button id="courseBack" style="display:none">← 과정 다시 선택</button>'
            '<button id="verBadge" class="ver" title="버전 이력">V</button></div>'
            '<div id="oeeLamp" class="off" title="OEE 미연동"><i></i><span>OEE 미연동</span></div>')
