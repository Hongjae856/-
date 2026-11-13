"""pouch/v2/src/* + vendor/three.min.js -> 단일 HTML (시험용 : 구역별 3D 확인)"""
import sys
from pathlib import Path
H=Path(__file__).resolve().parent
SCRIPTS=("kit.js","layout.js","room.js","form.js","unwind.js","hopper.js","filler.js","conv.js","fillzone.js","pack_feed.js","pack_carton.js","pack_insp.js","packzone.js","pack_manual.js","pack_anim.js","anim.js","main.js")
three=(H/"vendor"/"three.min.js").read_text(encoding="utf-8")
js="\n".join(f"/* ── {n} ── */\n"+(H/"src"/n).read_text(encoding="utf-8") for n in SCRIPTS)
assert "</script" not in js.lower()
html=f'<title>파우치 라인 IDT 3D 시험</title><style>html,body{{margin:0;height:100%;overflow:hidden;background:#dfe4e1}}canvas{{display:block}}</style><body>\n<script>{three}</script>\n<script>{js}</script>'
out=Path(sys.argv[1]) if len(sys.argv)>1 else H/"proto.html"
out.write_text(html,encoding="utf-8"); print("built",out,len(html))
