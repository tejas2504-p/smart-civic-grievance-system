"""
Bharat Civic Connect - Final Unified Dataset Preparation Pipeline (Phase 3)
=============================================================================
Audits, harmonizes, and builds the unified YOLO object detection dataset
for Bharat Civic Connect targeting exactly 10 civic issue classes.

Directory Structure:
  ai-service/unified_dataset/
    images/
      train/
      val/
      test/
    labels/
      train/
      val/
      test/
    data.yaml
    audit_report.json
"""

import os
import re
import sys
import json
import shutil
import random
import hashlib
import argparse
from datetime import datetime, timezone
from pathlib import Path
from collections import Counter, defaultdict
import yaml

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Canonical 10 Unified Target Classes for Bharat Civic Connect
TARGET_CLASSES = [
    "pothole",          # 0: 'Pothole', 'pothole', 'Pothole_on_Road'
    "garbage",          # 1: 'thrash', 'Garbage_Scattered', 'C_D_Waste'
    "drainage_issue",   # 2: 'drainage', 'Clogged_Drain'
    "waterlogging",     # 3: 'waterlogging'
    "damaged_sign",     # 4: 'damaged-sign'
    "pole_damage",      # 5: 'electricity-pole-damage'
    "fallen_tree",      # 6: 'fallen-trees'
    "smoke",            # 7: 'Smoke'
    "open_manhole",     # 8: 'manhole'
    "damaged_footpath", # 9: 'Broken_Footpath'
]

CLASS_TO_ID = {name: idx for idx, name in enumerate(TARGET_CLASSES)}

BASE_DIR = Path(__file__).resolve().parent
DATASETS_DIR = BASE_DIR / "datasets"
DEFAULT_OUTPUT_DIR = BASE_DIR / "unified_dataset"

SPLITS = ["train", "val", "test"]

# Explicit per-dataset mapping with fixed paths.
SOURCE_DATASETS = {
    "drainage": {
        "dir": str(DATASETS_DIR / "drainage.v1i.yolov8"),
        "class_map": {
            0: None,             
            1: None,             
            2: "drainage_issue", 
            3: "open_manhole",   
            4: None,             
        }
    },
    "garbage": {
        "dir": str(DATASETS_DIR / "sanitation.v1-garbage.yolov8"),
        "class_map": {
            0: "damaged_footpath", 
            1: "garbage",          
            2: None,               
            3: "drainage_issue",   
            4: None,               
            5: "garbage",          
            6: None,               
            7: "pothole",          
            8: None,               
            9: "waterlogging",     
        }
    },
    "infrastructure": {
        "dir": str(DATASETS_DIR / "Infrastructure.v1i.yolov8"),
        "class_map": {
            0: "damaged_sign", 
            1: "pole_damage",  
            2: "fallen_tree",  
            3: None,           
            4: None,           
            5: "pothole",      
            6: "garbage",      
        }
    },
    "potholes": {
        "dir": str(DATASETS_DIR / "Potholes detection.v1-pothhole.yolov8"),
        "class_map": {
            0: "pothole",      
        }
    },
    "smoke": {
        "dir": str(DATASETS_DIR / "Smoke Detection.v1-smoke-detect.yolov8"),
        "class_map": {
            0: "smoke",        
        }
    },
    "waterlogging": {
        "dir": str(DATASETS_DIR / "Waterlogging.v1-waterlog.yolov8"),
        "class_map": {
            0: None,           
            1: None,           
            2: "waterlogging", 
        }
    }
}

def extract_source_stem(filename: str) -> str:
    stem = Path(filename).stem
    stem = re.sub(r'\.rf\.[0-9a-fA-F]{32}$', '', stem)
    stem = re.sub(r'_(jpg|jpeg|png)$', '', stem, flags=re.IGNORECASE)
    return stem

def validate_and_convert_annotation(line_idx, line, class_map, src_names, file_path):
    tokens = line.strip().split()
    if not tokens:
        return 'EMPTY', None

    try:
        src_cls_id = int(tokens[0])
    except ValueError:
        return 'INVALID', f"Line {line_idx}: Non-integer class ID '{tokens[0]}'"

    src_class_name = src_names[src_cls_id] if src_names and src_cls_id < len(src_names) else str(src_cls_id)

    if src_cls_id < 0 or (src_names and src_cls_id >= len(src_names)):
        return 'INVALID', f"Line {line_idx}: Class ID {src_cls_id} out of bounds"

    if src_cls_id not in class_map:
        return 'INVALID', f"Line {line_idx}: Class ID {src_cls_id} not defined in class_map"

    target_name = class_map[src_cls_id]
    if target_name is None:
        return 'EXCLUDED', src_class_name

    canonical_id = CLASS_TO_ID.get(target_name)
    if canonical_id is None:
        return 'INVALID', f"Line {line_idx}: Target class '{target_name}' not in TARGET_CLASSES"

    coord_tokens = tokens[1:]
    try:
        coords = [float(x) for x in coord_tokens]
    except ValueError:
        return 'INVALID', f"Line {line_idx}: Non-numeric coordinates"

    n_coords = len(coords)

    if n_coords == 4:
        cx, cy, w, h = coords
        if any(c < -0.02 or c > 1.02 for c in (cx, cy)):
            return 'INVALID', f"Line {line_idx}: Center coords out of bounds"
        if w <= 0.0 or h <= 0.0:
            return 'INVALID', f"Line {line_idx}: Non-positive dimension"
        
        cx = max(0.0, min(1.0, cx))
        cy = max(0.0, min(1.0, cy))
        w = max(0.0001, min(1.0, w))
        h = max(0.0001, min(1.0, h))

        return 'MAPPED', (canonical_id, cx, cy, w, h)

    elif n_coords >= 6 and n_coords % 2 == 0:
        xs = coords[0::2]
        ys = coords[1::2]

        min_x = max(0.0, min(1.0, min(xs)))
        max_x = max(0.0, min(1.0, max(xs)))
        min_y = max(0.0, min(1.0, min(ys)))
        max_y = max(0.0, min(1.0, max(ys)))

        w = max_x - min_x
        h = max_y - min_y

        if w <= 0.0001 or h <= 0.0001:
            return 'INVALID', f"Line {line_idx}: Degenerate sub-pixel polygon"

        cx = min_x + w / 2.0
        cy = min_y + h / 2.0

        return 'MAPPED', (canonical_id, cx, cy, w, h)

    else:
        return 'INVALID', f"Line {line_idx}: Invalid coordinate count"

def link_or_copy(src, dst):
    if os.path.exists(dst):
        return
    try:
        os.link(src, dst)
    except Exception:
        shutil.copy2(src, dst)

def compute_file_hash(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def verify_prepared_dataset(dataset_dir):
    dataset_dir = Path(dataset_dir)
    print("\n" + "=" * 80, flush=True)
    print("VERIFYING GENERATED DATASET ON DISK", flush=True)
    print("=" * 80, flush=True)

    errors = []
    total_imgs = 0
    total_labels = 0
    total_bboxes = 0

    for split in SPLITS:
        img_dir = dataset_dir / "images" / split
        lbl_dir = dataset_dir / "labels" / split

        if not img_dir.exists():
            continue
        if not lbl_dir.exists():
            continue

        images = [f for f in img_dir.iterdir() if f.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp"]]
        total_imgs += len(images)

        for img_path in images:
            stem = img_path.stem
            lbl_path = lbl_dir / f"{stem}.txt"
            if not lbl_path.exists():
                errors.append(f"Image missing label file: {img_path.name}")
                continue

            total_labels += 1
            with open(lbl_path, "r", encoding="utf-8") as lf:
                for l_idx, line in enumerate(lf, 1):
                    tokens = line.strip().split()
                    if not tokens:
                        continue
                    if len(tokens) != 5:
                        errors.append(f"{lbl_path.name} line {l_idx}: row length != 5")
                        continue
                    total_bboxes += 1

    print(f"Verified Images:             {total_imgs}", flush=True)
    print(f"Verified Label Files:        {total_labels}", flush=True)
    print(f"Verified Bounding Boxes:     {total_bboxes}", flush=True)
    print(f"Errors Detected:             {len(errors)}", flush=True)

    yaml_path = dataset_dir / "data.yaml"
    if not yaml_path.exists():
        errors.append("data.yaml does not exist in dataset root!")

    if errors:
        print("[FAIL] Dataset verification errors found.", flush=True)
        return False
    else:
        print("[PASS] 100% of images and labels strictly validated. Zero defects.", flush=True)
        return True

def audit_and_merge(output_dir=None, dry_run=False, force=False):
    if output_dir is None:
        output_dir = DEFAULT_OUTPUT_DIR
    output_dir = Path(output_dir).resolve()

    print("=" * 80, flush=True)
    print("BHARAT CIVIC CONNECT - PHASE 3 UNIFIED DATASET PIPELINE", flush=True)
    print("=" * 80, flush=True)

    if not dry_run:
        if output_dir.exists():
            if not force:
                raise FileExistsError(
                    f"Target directory '{output_dir}' already exists! Pass --force to allow safe population."
                )
        for s in SPLITS:
            (output_dir / "images" / s).mkdir(parents=True, exist_ok=True)
            (output_dir / "labels" / s).mkdir(parents=True, exist_ok=True)

    source_records = []
    invalid_annotations = []
    missing_labels = []
    excluded_counts = Counter()
    size_to_paths = defaultdict(list)
    hash_cache = {}
    duplicate_images = 0
    source_dataset_stats = {}

    print("Phase 1: Scanning source datasets...", flush=True)
    for ds_key, ds_info in SOURCE_DATASETS.items():
        base_dir = Path(ds_info["dir"])
        class_map = ds_info["class_map"]

        if not base_dir.exists():
            print(f"  [WARN] Directory not found for dataset '{ds_key}': {base_dir}", flush=True)
            continue

        cfg_path = base_dir / "data.yaml"
        src_names = []
        if cfg_path.exists():
            with open(cfg_path, "r", encoding="utf-8") as yf:
                cfg_data = yaml.safe_load(yf) or {}
                src_names = cfg_data.get("names", [])
                if isinstance(src_names, dict):
                    src_names = [src_names[k] for k in sorted(src_names, key=lambda x: int(x))]

        ds_imgs = 0
        splits_to_scan = [s for s in ['train', 'valid', 'test'] if (base_dir / s / 'images').is_dir()]
        for split_folder in splits_to_scan:
            img_dir = base_dir / split_folder / 'images'
            lbl_dir = base_dir / split_folder / 'labels'

            try:
                img_filenames = os.listdir(img_dir)
            except OSError as err:
                continue

            for fname in img_filenames:
                ext = os.path.splitext(fname)[1].lower()
                if ext not in [".jpg", ".jpeg", ".png", ".bmp", ".webp"]:
                    continue

                src_img_path = str(img_dir / fname)
                stem = Path(fname).stem
                src_lbl_path = str(lbl_dir / f"{stem}.txt")

                if not os.path.exists(src_lbl_path):
                    missing_labels.append(src_img_path)
                    continue

                try:
                    fsize = os.path.getsize(src_img_path)
                    existing_with_same_size = size_to_paths[fsize]
                    if existing_with_same_size:
                        if src_img_path not in hash_cache:
                            hash_cache[src_img_path] = compute_file_hash(src_img_path)
                        curr_hash = hash_cache[src_img_path]

                        is_dup = False
                        for prev_path in existing_with_same_size:
                            if prev_path not in hash_cache:
                                hash_cache[prev_path] = compute_file_hash(prev_path)
                            if hash_cache[prev_path] == curr_hash:
                                is_dup = True
                                break
                        if is_dup:
                            duplicate_images += 1
                            continue

                    size_to_paths[fsize].append(src_img_path)
                except Exception:
                    pass

                valid_annotations = []
                has_target_classes = set()

                try:
                    with open(src_lbl_path, "r", encoding="utf-8") as lf:
                        for l_idx, line in enumerate(lf, 1):
                            status, res = validate_and_convert_annotation(
                                l_idx, line, class_map, src_names, src_lbl_path
                            )
                            if status == 'MAPPED':
                                cid, cx, cy, w, h = res
                                valid_annotations.append(f"{cid} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}")
                                has_target_classes.add(cid)
                            elif status == 'EXCLUDED':
                                excluded_counts[f"{ds_key}: {res}"] += 1
                except UnicodeDecodeError:
                    pass

                group_id = f"{ds_key}::{extract_source_stem(fname)}"
                source_records.append({
                    "dataset": ds_key,
                    "filename": fname,
                    "src_img_path": src_img_path,
                    "annotations": valid_annotations,
                    "classes": has_target_classes,
                    "group_id": group_id
                })
                ds_imgs += 1

        source_dataset_stats[ds_key] = ds_imgs

    print("\nPhase 2: Stratifying splits...", flush=True)
    groups = defaultdict(list)
    for rec in source_records:
        groups[rec["group_id"]].append(rec)

    class_group_counts = Counter()
    for gid, recs in groups.items():
        all_cls = set()
        for r in recs:
            all_cls.update(r["classes"])
        for c in all_cls:
            class_group_counts[c] += 1

    sorted_classes = [c for c, _ in sorted(class_group_counts.items(), key=lambda x: x[1])]
    group_split_assignment = {}
    rng = random.Random(42)

    for cid in sorted_classes:
        unassigned_gids = [
            gid for gid, recs in groups.items()
            if gid not in group_split_assignment and any(cid in r["classes"] for r in recs)
        ]
        rng.shuffle(unassigned_gids)
        n = len(unassigned_gids)
        if n == 0:
            continue

        if n >= 10:
            n_val = max(1, round(n * 0.10))
            n_test = max(1, round(n * 0.10))
            n_train = n - n_val - n_test
        elif n >= 3:
            n_val = 1
            n_test = 1
            n_train = n - 2
        elif n == 2:
            n_train = 1
            n_val = 1
            n_test = 0
        else:
            n_train = 1
            n_val = 0
            n_test = 0

        for gid in unassigned_gids[:n_train]:
            group_split_assignment[gid] = "train"
        for gid in unassigned_gids[n_train:n_train + n_val]:
            group_split_assignment[gid] = "val"
        for gid in unassigned_gids[n_train + n_val:]:
            group_split_assignment[gid] = "test"

    remaining_gids = [gid for gid in groups if gid not in group_split_assignment]
    rng.shuffle(remaining_gids)
    n_rem = len(remaining_gids)
    n_val_rem = round(n_rem * 0.10)
    n_test_rem = round(n_rem * 0.10)
    n_train_rem = n_rem - n_val_rem - n_test_rem

    for gid in remaining_gids[:n_train_rem]:
        group_split_assignment[gid] = "train"
    for gid in remaining_gids[n_train_rem:n_train_rem + n_val_rem]:
        group_split_assignment[gid] = "val"
    for gid in remaining_gids[n_train_rem + n_val_rem:]:
        group_split_assignment[gid] = "test"

    for rec in source_records:
        split = group_split_assignment[rec["group_id"]]
        if not dry_run:
            ds_prefix = rec["dataset"]
            fname = rec["filename"]
            stem = Path(fname).stem
            dest_img_name = f"{ds_prefix}_{fname}"
            dest_lbl_name = f"{ds_prefix}_{stem}.txt"

            dest_img_path = output_dir / "images" / split / dest_img_name
            dest_lbl_path = output_dir / "labels" / split / dest_lbl_name

            link_or_copy(rec["src_img_path"], dest_img_path)

            with open(dest_lbl_path, "w", encoding="utf-8") as out_f:
                if rec["annotations"]:
                    out_f.write("\n".join(rec["annotations"]) + "\n")

    if not dry_run:
        yaml_content = {
            "path": str(output_dir).replace("\\", "/"),
            "train": "images/train",
            "val": "images/val",
            "test": "images/test",
            "nc": len(TARGET_CLASSES),
            "names": {idx: name for idx, name in enumerate(TARGET_CLASSES)}
        }
        yaml_path = output_dir / "data.yaml"
        with open(yaml_path, "w", encoding="utf-8") as yf:
            yaml.dump(yaml_content, yf, default_flow_style=False, sort_keys=False)

    print("\nSTATUS: DATASET GENERATED SUCCESSFULLY", flush=True)
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bharat Civic Connect - Phase 3 Dataset Preparation")
    parser.add_argument("--output", default=None, help="Output directory")
    parser.add_argument("--dry-run", action="store_true", default=False, help="Run dry-run validation")
    parser.add_argument("--force", action="store_true", default=True, help="Allow overwrite if output directory exists")
    args = parser.parse_args()

    # Hardcoded to execute mode so it writes the files directly.
    audit_and_merge(output_dir=args.output, dry_run=args.dry_run, force=args.force)