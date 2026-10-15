"""
Verification script for Smart Civic Grievance System datasets.
Validates YAML paths, image availability, label consistency, and YOLO compatibility.
"""

import os
import sys
import yaml
from collections import Counter
from ultralytics.data.utils import check_det_dataset

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

DATASETS = [
    {
        "id": "drainage",
        "name": "Drainage & Litter",
        "yaml": os.path.join("ai-service", "datasets", "drainage", "drainage.v1i.yolov8", "data.yaml")
    },
    {
        "id": "garbage",
        "name": "Garbage & Sanitation",
        "yaml": os.path.join("ai-service", "datasets", "garbage", "sanitation.v1-garbage.yolov8", "data.yaml")
    },
    {
        "id": "infrastructure",
        "name": "Public Infrastructure",
        "yaml": os.path.join("ai-service", "datasets", "infrastructure", "Infrastructure.v1i.yolov8", "data.yaml")
    },
    {
        "id": "potholes",
        "name": "Potholes Detection",
        "yaml": os.path.join("ai-service", "datasets", "potholes", "Potholes detection.v1-pothhole.yolov8", "data.yaml")
    },
    {
        "id": "smoke",
        "name": "Smoke & Fire Hazard",
        "yaml": os.path.join("ai-service", "datasets", "smoke", "Smoke Detection.v1-smoke-detect.yolov8", "data.yaml")
    },
    {
        "id": "waterlogging",
        "name": "Waterlogging",
        "yaml": os.path.join("ai-service", "datasets", "waterlogging", "Waterlogging.v1-waterlog.yolov8", "data.yaml")
    }
]

def verify_dataset(entry):
    ypath = os.path.abspath(entry["yaml"])
    print("=" * 80)
    print(f"VERIFYING: {entry['name']} ({entry['id']})")
    print(f"Config path: {ypath}")
    
    if not os.path.exists(ypath):
        print("  [ERROR] YAML file does not exist!")
        return False
        
    with open(ypath, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
        
    ydir = os.path.dirname(ypath)
    names = cfg.get("names", [])
    nc = cfg.get("nc", len(names))
    print(f"Declared Classes (nc={nc}): {names}")
    
    # 1. Path resolution verification
    splits = ["train", "val", "test"]
    split_paths = {
        "train": os.path.normpath(os.path.join(ydir, cfg.get("train", "train/images"))),
        "val": os.path.normpath(os.path.join(ydir, cfg.get("val", "valid/images"))),
        "test": os.path.normpath(os.path.join(ydir, cfg.get("test", "test/images"))) if cfg.get("test") else None
    }
    
    all_paths_ok = True
    for s, p in split_paths.items():
        if p:
            exists = os.path.exists(p)
            n_files = len(os.listdir(p)) if exists else 0
            status = f"[OK] ({n_files} images)" if exists and n_files > 0 else "[FAIL]"
            print(f"  Split '{s}' images: {status} -> {p}")
            if not exists or n_files == 0:
                all_paths_ok = False
                
    # 2. Ultralytics check_det_dataset verification
    try:
        check_det_dataset(ypath)
        print("  Ultralytics Loader check: [PASSED]")
    except Exception as e:
        print(f"  Ultralytics Loader check: [FAILED] - {e}")
        all_paths_ok = False
        
    # 3. Label inspection (Train split)
    train_labels_dir = os.path.join(ydir, "train", "labels")
    if os.path.exists(train_labels_dir):
        lbl_files = [f for f in os.listdir(train_labels_dir) if f.endswith(".txt")]
        class_counts = Counter()
        invalid_boxes = 0
        total_annotations = 0
        
        for lf in lbl_files:
            lpath = os.path.join(train_labels_dir, lf)
            try:
                with open(lpath, "r", encoding="utf-8") as lf_in:
                    for line in lf_in:
                        parts = line.strip().split()
                        if not parts:
                            continue
                        cls_id = int(parts[0])
                        class_counts[cls_id] += 1
                        total_annotations += 1
                        # Check bounding box validity if standard 5-element bbox
                        if len(parts) == 5:
                            coords = [float(x) for x in parts[1:]]
                            if any(c < 0 or c > 1 for c in coords):
                                invalid_boxes += 1
            except Exception:
                pass
                
        print(f"  Train Labels: {len(lbl_files)} label files, {total_annotations} total annotations")
        if invalid_boxes > 0:
            print(f"  [WARN] {invalid_boxes} bounding boxes had coordinates outside [0, 1]")
            
        print("  Train Class Distribution:")
        for cid, count in sorted(class_counts.items()):
            cname = names[cid] if isinstance(names, list) and cid < len(names) else (names.get(cid) if isinstance(names, dict) else str(cid))
            print(f"    Class {cid:2d} ({cname}): {count:5d} instances")
            
    print(f"RESULT: {'[READY FOR TRAINING]' if all_paths_ok else '[NEEDS ATTENTION]'}")
    return all_paths_ok

def main():
    print("\n" + "=" * 80)
    print("SMART CIVIC GRIEVANCE SYSTEM - DATASET INTEGRITY AUDIT")
    print("=" * 80 + "\n")
    
    results = {}
    for d in DATASETS:
        success = verify_dataset(d)
        results[d["name"]] = success
        
    print("\n" + "=" * 80)
    print("SUMMARY AUDIT REPORT")
    print("=" * 80)
    for name, success in results.items():
        status = "PASSED (Ready)" if success else "FAILED"
        print(f"  {name:30s}: {status}")
    print("=" * 80)

if __name__ == "__main__":
    main()
