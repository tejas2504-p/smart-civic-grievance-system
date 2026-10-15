import os
import sys
from pathlib import Path
import yaml

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

BASE_DIR = Path(__file__).resolve().parent
DATASETS_DIR = BASE_DIR / "datasets"

def inspect_dataset(root: Path):
    print(f"\n--- Dataset: {root.name} ---")

    # Locate data.yaml (directly or nested in Roboflow export folder)
    config = root / "data.yaml"
    if not config.exists():
        configs = list(root.rglob("data.yaml"))
        if configs:
            config = configs[0]
        else:
            print(f"  No data.yaml found in {root.name}")
            return

    print(f"  Config: {config}")

    with open(config, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    if not data:
        print("  Empty or invalid YAML file")
        return

    nc = data.get("nc")
    names = data.get("names")
    print(f"  Classes ({nc if nc is not None else len(names) if names else 0}): {names}")

    for split in ["train", "val", "test"]:
        value = data.get(split)
        if not value:
            print(f"  {split}: not specified")
            continue

        path = Path(value)
        if not path.is_absolute():
            path = (config.parent / path).resolve()

        print(f"  {split}: {path}")
        print(f"    Exists: {path.exists()}")

def main():
    if not DATASETS_DIR.exists():
        raise FileNotFoundError(
            f"Datasets directory not found: {DATASETS_DIR}"
        )

    for root in sorted(DATASETS_DIR.iterdir()):
        if root.is_dir() and root.name != "unified_dataset":
            inspect_dataset(root)

if __name__ == "__main__":
    main()
