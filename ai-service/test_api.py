"""
Test suite for Bharat Civic Connect AI Vision Service (Phase 1).
Run with:
    cd ai-service
    .\.venv\Scripts\python.exe test_api.py
"""

import io
import sys
from pathlib import Path
from fastapi.testclient import TestClient
from app import app

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def run_tests():
    print("=" * 60)
    print("Bharat Civic Connect — AI Vision Service API Test Suite")
    print("=" * 60)

    base_dir = Path(__file__).resolve().parent
    test_image_path = (
        base_dir
        / "unified_dataset"
        / "images"
        / "test"
        / "garbage_Potholes_20251117_184745_0033_jpg_jpg.rf.1db2279541e0608414eefa0575e8805a.jpg"
    )

    with TestClient(app) as client:
        # Test 1: Root endpoint
        print("\n[TEST 1] GET / (Root Service Info)")
        res = client.get("/")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        print(f"  Service: {data.get('service')}")
        print(f"  Status: {data.get('status')}")
        print("  --> PASS")

        # Test 2: Health Check endpoint
        print("\n[TEST 2] GET /health (Health & Model Readiness)")
        res = client.get("/health")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        health = res.json()
        assert health["model_loaded"] is True, "Model is not reported as loaded"
        assert health["num_classes"] == 10, f"Expected 10 classes, got {health['num_classes']}"
        print(f"  Model loaded: {health['model_loaded']}")
        print(f"  Model path: {health['model_path']}")
        print(f"  Classes ({health['num_classes']}): {health['classes']}")
        print(f"  Device: {health['device']}")
        print("  --> PASS")

        # Test 3: Prediction with detection
        print("\n[TEST 3] POST /predict (Valid image detection)")
        if not test_image_path.exists():
            print(f"  Warning: Sample image {test_image_path} not found. Skipping prediction test.")
        else:
            with open(test_image_path, "rb") as f:
                res = client.post(
                    "/predict?conf=0.25&save_annotated=true",
                    files={"file": ("pothole_sample.jpg", f, "image/jpeg")},
                )
            assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
            pred = res.json()
            assert pred["success"] is True
            assert pred["has_detections"] is True
            assert pred["total_detections"] > 0
            assert pred["primary_detection"] is not None
            assert pred["saved_annotated_image"] is not None
            print(f"  Detections: {pred['total_detections']}")
            print(f"  Primary Defect: {pred['primary_detection']['class_name']} (conf: {pred['primary_detection']['confidence']:.2f})")
            print(f"  Class counts: {pred['class_counts']}")
            print(f"  Image dimensions: {pred['image_dimensions']['width']}x{pred['image_dimensions']['height']}")
            print(f"  Inference time: {pred['inference_time_ms']} ms")
            print(f"  Saved annotated image: {pred['saved_annotated_image']}")
            print("  --> PASS")

            # Test 4: Retrieve Saved Annotated Image
            print("\n[TEST 4] GET /predictions/{filename} (Retrieve saved image)")
            filename = Path(pred["saved_annotated_image"]).name
            res = client.get(f"/predictions/{filename}")
            assert res.status_code == 200, f"Expected 200, got {res.status_code}"
            assert res.headers.get("content-type") == "image/jpeg"
            assert len(res.content) > 1000
            print(f"  Fetched {filename} ({len(res.content)} bytes)")
            print("  --> PASS")

        # Test 5: No detections with very high threshold
        print("\n[TEST 5] POST /predict (High confidence threshold -> No detections)")
        if test_image_path.exists():
            with open(test_image_path, "rb") as f:
                res = client.post(
                    "/predict?conf=0.99",
                    files={"file": ("sample.jpg", f, "image/jpeg")},
                )
            assert res.status_code == 200
            pred = res.json()
            assert pred["has_detections"] is False
            assert pred["total_detections"] == 0
            assert pred["primary_detection"] is None
            print(f"  Message: {pred['message']}")
            print("  --> PASS")

        # Test 6: Invalid image data handling
        print("\n[TEST 6] POST /predict (Corrupted/invalid image bytes handling)")
        corrupted_data = io.BytesIO(b"Not a real image file content")
        res = client.post(
            "/predict",
            files={"file": ("corrupted.jpg", corrupted_data, "image/jpeg")},
        )
        assert res.status_code == 400, f"Expected 400 for corrupted image, got {res.status_code}"
        print(f"  Handled safely with status 400: {res.json().get('detail')}")
        print("  --> PASS")

        # Test 7: Disallowed file extension
        print("\n[TEST 7] POST /predict (Disallowed file extension)")
        txt_data = io.BytesIO(b"console.log('hello')")
        res = client.post(
            "/predict",
            files={"file": ("script.js", txt_data, "application/javascript")},
        )
        assert res.status_code == 400, f"Expected 400 for disallowed extension, got {res.status_code}"
        print(f"  Handled safely with status 400: {res.json().get('detail')}")
        print("  --> PASS")

        # Test 8: Path traversal prevention
        print("\n[TEST 8] GET /predictions/../../app.py (Path traversal security)")
        res = client.get("/predictions/../../app.py")
        assert res.status_code == 404, f"Expected 404, got {res.status_code}"
        print(f"  Path traversal blocked safely with status {res.status_code}")
        print("  --> PASS")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED SUCCESSFULLY! (8/8)")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
