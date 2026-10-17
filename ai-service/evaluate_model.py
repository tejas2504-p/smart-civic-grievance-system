import sys
from pathlib import Path
from ultralytics import YOLO

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

MODEL_PATH = Path("runs/civic/baseline-2/weights/best.pt")
DATA_YAML = Path("unified_dataset/data.yaml")

def main():
    if not MODEL_PATH.exists():
        print(f"Model not found: {MODEL_PATH}")
        return

    if not DATA_YAML.exists():
        print(f"Data config not found: {DATA_YAML}")
        return

    print("Loading trained YOLO model...")
    model = YOLO(str(MODEL_PATH))

    print("Evaluating model on test split...")
    metrics = model.val(
        data=str(DATA_YAML),
        split="test",
        imgsz=416,
        batch=4,
        device="cpu",
        workers=0,
        plots=True,
        project="runs/evaluation",
        name="civic-test",
    )

    print("\n=== Model Evaluation ===")
    print(f"mAP50:     {metrics.box.map50:.4f}")
    print(f"mAP50-95:  {metrics.box.map:.4f}")
    print(f"Precision: {metrics.box.mp:.4f}")
    print(f"Recall:    {metrics.box.mr:.4f}")

if __name__ == "__main__":
    main()
