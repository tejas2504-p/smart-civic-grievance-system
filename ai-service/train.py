import sys
from pathlib import Path
from ultralytics import YOLO

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def main():
    base_dir = Path(__file__).resolve().parent
    data_path = base_dir / "unified_dataset" / "data.yaml"

    model = YOLO("yolo11n.pt")

    model.train(
        data=str(data_path),
        epochs=30,
        imgsz=416,
        batch=4,
        device=0,
        workers=0,
        project=str(base_dir / "runs" / "civic"),
        name="baseline",
        plots=True,
    )

if __name__ == "__main__":
    main()