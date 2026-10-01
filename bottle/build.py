"""bottle/src/* -> 병충전라인_IDT.html (single self-contained page).

Order: shell.html holds three placeholders that are replaced by the CSS, the
body markup and the concatenated scripts listed in SCRIPTS.
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / "src"
OUT = HERE.parent / "병충전라인_IDT.html"
SCRIPTS = (
    "util.js",
    "engine.js",
    "data.js",
    "state.js",
    "layout.js",
    "models.js",
    "sim.js",
    "dynamic.js",
    "hmi.js",
    "course.js",
    "ui.js",
    "autoplay.js",
    "demo.js",
    "changelog.js",
    "boot.js",
)


def build() -> str:
    shell = (SRC / "shell.html").read_text(encoding="utf-8")
    parts = {
        "/*__CSS__*/": (SRC / "style.css").read_text(encoding="utf-8"),
        "<!--__BODY__-->": (SRC / "body.html").read_text(encoding="utf-8"),
        "/*__JS__*/": "\n".join(
            f"/* ── {name} ── */\n" + (SRC / name).read_text(encoding="utf-8") for name in SCRIPTS
        ),
    }
    for key, text in parts.items():
        if shell.count(key) != 1:
            sys.exit(f"shell.html must contain {key} exactly once")
        if key == "/*__JS__*/" and "</script" in text.lower():
            sys.exit("script text must not contain </script")
        shell = shell.replace(key, text)
    return shell


def main() -> None:
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else OUT
    out.write_text(build(), encoding="utf-8")
    print(f"built {out} ({out.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
