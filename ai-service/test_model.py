import sys
from pathlib import Path
from ultralytics import YOLO

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

MODEL_PATH = Path("runs/civic/baseline-2/weights/best.pt")
IMAGE_DIR = Path("unified_dataset/images/test")

def main():
    if not MODEL_PATH.exists():
        print(f"Model not found: {MODEL_PATH}")
        return

    if not IMAGE_DIR.exists():
        print(f"Image folder not found: {IMAGE_DIR}")
        return

    print("Loading trained YOLO model...")
    model = YOLO(str(MODEL_PATH))

    print("Testing images...")
    results = model.predict(
        source=str(IMAGE_DIR),
        save=True,
        conf=0.25,
    )

    print("\n[SUCCESS] Inference complete! Results saved in runs/detect/predict")

if __name__ == "__main__":
    main()
