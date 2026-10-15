import sys
from pathlib import Path
from ultralytics import YOLO

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent
    checkpoint_path = base_dir / "runs" / "civic" / "baseline-2" / "weights" / "last.pt"

    if not checkpoint_path.exists():
        checkpoint_path = Path("runs/civic/baseline-2/weights/last.pt")

    print(f"Resuming training from checkpoint: {checkpoint_path}")
    model = YOLO(str(checkpoint_path))
    model.train(resume=True)
