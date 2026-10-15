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

for config in BASE.rglob("data.yaml"):
    data = yaml.safe_load(config.read_text(encoding="utf-8"))
    names = data.get("names", [])
    if isinstance(names, dict):
        names = [names[k] for k in sorted(names, key=lambda x: int(x))]

    print(f"\n{'=' * 60}\n{config.parent}")
    print("Classes:", names)

    counts = Counter()
    empty_files = 0
    invalid_lines = 0
    label_files = list(config.parent.rglob("labels/*.txt"))

    for label in label_files:
        try:
            lines = label.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError:
            invalid_lines += 1
            continue

        if not lines or not any(line.strip() for line in lines):
            empty_files += 1
            continue

        for line in lines:
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            try:
                class_id = int(parts[0])
                counts[class_id] += 1
            except (ValueError, IndexError):
                invalid_lines += 1

    print(f"Total label files: {len(label_files)} (empty: {empty_files})")
    if invalid_lines:
        print(f"Invalid lines: {invalid_lines}")
    print("Label counts:")
    for class_id in sorted(counts.keys()):
        name = names[class_id] if class_id < len(names) else f"unknown_{class_id}"
        print(f"  ID {class_id} ({name}): {counts[class_id]}")
