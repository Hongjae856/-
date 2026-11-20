"""메인화면 공통 템플릿 (세 IDT · 11/19 사용자 지시 "메인화면부터 UI 통일" · 11/20 시안 확정 : ① 교육 과정 → ② 작업자 → ③ [교육 시작])

각 IDT 의 build.py 가 render(cfg) 로 메인화면 HTML 을 만든다. 모양 idt_common/splash.css, 동작(선택 · 요약 · 시작 · 말풍선) idt_common/splash.js.
설명 글 = 짧은 부제(10자 안팎) + 마우스를 올리거나 길게 누르면 말풍선 (11/20 사용자 선택 C).
IDT 마다 다른 것은 설정값으로만 둔다 : 제목 · 부제 · 작업자 카드 · (병) 포장 품목 선택 · (PTP) 체인지파트 행.

cfg = {
  "title", "prod",
  "extra": "작업자 카드 위에 넣을 HTML (병 : 포장 품목 선택)", "note": "작업자 카드 아래 한 줄 (없으면 생략)",
  "workers": [{"id": "chooseF", "r": "F", "tag": "FILLING ROOM", "nm": "충전실 작업자", "desc": "짧은 설명", "tip": "말풍선"}, …],
  "cols": std_cols(…) = {"rows": [{"h", "hs", "btns": [학습, 평가]}…], "try": [시연, 자유], "mgmt": [이상사례, OEE]},
}
버튼 = {"id", "nm"(보이는 이름), "full"(요약 · 상단 표시용 전체 이름 → data-nm), "sm"(짧은 부제), "tip"(말풍선), "attrs"}
"""
from html import escape


def _attrs(d):
    return "".join(f' {k}="{escape(str(v), quote=True)}"' for k, v in (d or {}).items())


def _tip(t):
    return f'<span class="tipB" role="tooltip">{escape(t)}</span>' if t else ""


def btn(b):
    idp = f' id="{b["id"]}"' if b.get("id") else ""
    a = dict(b.get("attrs") or {}); a["data-nm"] = b.get("full") or b["nm"]
    sm = f'<small>{escape(b["sm"])}</small>' if b.get("sm") else ""
    return f'<button class="msB"{idp}{_attrs(a)}><b>{escape(b["nm"])}</b>{sm}{_tip(b.get("tip"))}</button>'


TIPS = {
    "easy": "라인 가동 핵심 절차만 단계별로 안내합니다. 점수 없음.",
    "examEasy": "안내 없이 핵심 절차를 수행하고 채점합니다. 합격 80점 · 힌트(F1) −5점.",
    "guide": "라인 가동 전체 절차(라인 클리어런스 · 문서 · 점검 포함)를 단계별로 안내합니다.",
    "exam": "안내 없이 전체 절차를 수행하고 채점합니다. 합격 80점 · 힌트(F1) −5점.",
    "demo": "단계마다 [시연 실행] 을 눌러 장비 ON → 가동 → 생산을 지켜봅니다. 평가 없음.",
    "free": "순서 · 감점 없이 자유롭게 조작합니다. 전원 · 공압 · 안전문 · 비상정지는 실제처럼 동작합니다.",
    "inc": "부동 빈도 · 중요도 순으로 정리한 실제 이상사례에 대응합니다. 작업자를 고르면 사례 목록이 나옵니다.",
    "oee": "OEE DB 연결 · 부동 트렌드 · 교육 효과를 봅니다. 작업자 선택 없이 엽니다.",
}


def std_cols(mk, free_tip=None, course=None, **_):
    """표준 구성 : 운전 교육(기본 · 심화 행 × 학습 · 평가 열) · 체험(시연 · 자유) · 관리 · 분석(이상사례 · OEE).
    mk(m) → (id, attrs) — IDT 별 버튼 식별 방식. course 가 있으면 기본 · 심화 행 대신 그 행들 (PTP : 가동 + 체인지파트)."""
    def B(m, nm, full, sm, tip=None):
        i, a = mk(m)
        return {"id": i, "nm": nm, "full": full, "sm": sm, "tip": tip or TIPS.get(m, ""), "attrs": a}
    rows = course or [
        {"h": "기본", "btns": [B("easy", "학습", "기본 · 학습", "핵심 절차 안내"), B("examEasy", "평가", "기본 · 평가", "핵심 절차 채점")]},
        {"h": "심화", "btns": [B("guide", "학습", "심화 · 학습", "전체 절차 안내"), B("exam", "평가", "심화 · 평가", "전체 절차 채점")]},
    ]
    return {"rows": rows,
            "try": [B("demo", "시연모드", "시연모드", "자동 진행 관찰"), B("free", "자유모드", "자유모드", "순서 · 채점 없음", free_tip)],
            "mgmt": [B("inc", "이상사례 대처 교육", "이상사례 대처 교육", "알람 대응 연습"), B("oee", "OEE 관리 대시보드", "OEE 관리 대시보드", "부동 · 교육 효과")]}


_PERSON = ('<svg class="msP" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">'
           '<circle cx="12" cy="6" r="3"></circle><path d="M6 21v-5a6 6 0 0 1 12 0v5"></path></svg>')


def render(cfg):
    W, C = cfg["workers"], cfg["cols"]
    workers = "".join(
        f'<button id="{w["id"]}" class="main wait" data-r="{w["r"]}" data-nm="{escape(w["nm"], quote=True)}">{_PERSON}'
        f'<span class="wT"><small>{escape(w["tag"])}</small><strong>{escape(w["nm"])}</strong><span>{escape(w["desc"])}</span></span>{_tip(w.get("tip"))}</button>'
        for w in W)
    rows = "".join(
        f'<div class="msRH">{escape(r["h"])}' + (f'<small>{escape(r["hs"])}</small>' if r.get("hs") else "") + '</div>'
        + "".join(btn(b) for b in r["btns"]) for r in C["rows"])
    other = (f'<div class="msRH">체험</div>{"".join(btn(b) for b in C["try"])}'
             f'<div class="msRH">관리 · 분석</div>{"".join(btn(b) for b in C["mgmt"])}')
    head = lambda n, t: f'<h2 class="msH"><i>{n}</i>{t}</h2>'
    prod = f'<span class="prodLine">{escape(cfg["prod"])}</span>' if cfg.get("prod") else ""
    note = f'<p class="msNote">{escape(cfg["note"])}</p>' if cfg.get("note") else ""
    return ('<div class="box msx">'
            f'<header class="msHead"><div class="msT"><h1>{escape(cfg["title"])}</h1>{prod}</div>'
            '<div class="msMeta"><div id="oeeLamp" class="off" title="OEE 미연동"><i></i><span>OEE 미연동</span></div>'
            '<button id="verBadge" class="ver" title="버전 이력">V</button></div></header>'
            '<div class="msBody">'
            f'<section class="msCard msModes">{head(1, "교육 과정 선택")}'
            '<div class="go"><div class="msGrid"><div></div><div class="msCH">학습 · 안내 있음</div><div class="msCH">평가 · 안내 없음 · 채점</div>'
            f'{rows}</div><div class="msSep"></div><div class="msGrid">{other}</div></div>'
            '<div id="incPick" style="display:none"></div><button id="courseBack" style="display:none">← 과정 다시 선택</button>'
            '<p class="msNote">버튼에 마우스를 올리거나 길게 누르면 자세한 설명이 나옵니다.</p></section>'
            '<aside class="msSide">'
            f'<section class="msCard">{head(2, "작업자 선택")}{cfg.get("extra", "")}<div id="coursePicker" class="n{len(W)}">{workers}</div>{note}<div id="crewHint"></div></section>'
            f'<section class="msCard msGoC">{head(3, "시작")}<div id="msSum">교육 과정과 작업자를 고르세요</div>'
            '<button id="msStart" disabled>교육 시작</button></section>'
            '</aside></div></div>')
