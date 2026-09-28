"""src/entry.html + src/filler.html + src/line.html -> 시뮬.html"""
import base64
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
PLACEHOLDER = "__SIMULATORS__"
SIMULATORS = ("filler", "line")


def build() -> str:
    entry = (SRC / "entry.html").read_text(encoding="utf-8")
    if entry.count(PLACEHOLDER) != 1:
        sys.exit(f"entry.html must contain {PLACEHOLDER} exactly once")
    payload = {
        key: base64.b64encode((SRC / f"{key}.html").read_bytes()).decode("ascii")
        for key in SIMULATORS
    }
    # </script> inside the JSON would terminate the tag early; base64 cannot produce it.
    return entry.replace(PLACEHOLDER, json.dumps(payload, separators=(",", ":")))


def main() -> None:
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "시뮬.html"
    out.write_bytes(build().encode("utf-8"))
    print(f"built {out} ({out.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
