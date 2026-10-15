import sys
from pathlib import Path
from collections import Counter
import yaml

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

BASE = Path("datasets") if Path("datasets").exists() else Path(__file__).resolve().parent / "datasets"

for root in sorted(BASE.iterdir()):
    if not root.is_dir() or root.name == "unified_dataset":
        continue

    config = root / "data.yaml"
    if not config.exists():
        configs = list(root.rglob("data.yaml"))
        if configs:
            config = configs[0]
        else:
            continue

    data = yaml.safe_load(config.read_text(encoding="utf-8"))
    names = data.get("names", [])
    if isinstance(names, dict):
        names = [names[k] for k in sorted(names, key=lambda x: int(x))]

    print(f"\n{'=' * 60}\n{root.name}")
    print("Classes:", names)

    # Inspect label files without changing them.
    lengths = Counter()
    invalid = 0
    examples = []

    for label in root.rglob("labels/*.txt"):
        try:
            for line in label.read_text(encoding="utf-8").splitlines():
                parts = line.split()
                if not parts:
                    continue

                try:
                    class_id = int(parts[0])
                    values = [float(x) for x in parts[1:]]
                except ValueError:
                    invalid += 1
                    continue

                if class_id < 0 or class_id >= len(names):
                    invalid += 1
                    continue

                lengths[len(values)] += 1
                if len(examples) < 3:
                    examples.append((class_id, len(values)))
        except UnicodeDecodeError:
            invalid += 1
            continue

    print("Annotation format summary:")
    for length, count in sorted(lengths.items()):
        if length == 4:
            desc = "Bounding Box (cx, cy, w, h)"
        elif length >= 6 and length % 2 == 0:
            desc = f"Polygon Segmentation ({length // 2} vertices)"
        else:
            desc = f"{length} values"
        print(f"  {length} coordinates: {count} annotations -> {desc}")

    if 4 in lengths and any(l != 4 for l in lengths):
        print("  Verdict: MIXED formats (bounding boxes + polygons)")
    elif 4 in lengths:
        print("  Verdict: Pure BOUNDING BOXES (standard YOLO detection)")
    elif lengths:
        print("  Verdict: Pure POLYGON SEGMENTATION (requires polygon-to-bbox conversion for detection)")
    else:
        print("  Verdict: No annotations found")

    if invalid > 0:
        print(f"  Invalid annotations: {invalid}")
