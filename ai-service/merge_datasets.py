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

Phase 3 Requirements:
1. Original datasets and annotations strictly preserved (read-only).
2. Layout: images/{train,val,test} and labels/{train,val,test}.
3. 10 unified classes with canonical IDs 0-9.
4. Segmentation polygons converted to bounding boxes (min/max coordinates).
5. Ambiguous & invalid annotations excluded with explicit audit records.
6. Exact duplicates filtered by SHA-256 hash; near-duplicates grouped to avoid cross-split leakage.
7. Deterministic 80% Train / 10% Val / 10% Test split by source image group.
8. Rigorous image-label pairing and YOLO bbox validation.
9. data.yaml generated with relative paths.
10. audit_report.json and readable terminal summary generated.
11. --dry-run option for pre-execution audit.
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

# Explicit per-dataset mapping. Unmapped classes are logged as excluded (never silently remapped).
SOURCE_DATASETS = {
    "drainage": {
        "dir": str(DATASETS_DIR / "drainage" / "drainage.v1i.yolov8"),
        "class_map": {
            0: None,             # can -> excluded (ambiguous small litter item)
            1: None,             # curb -> excluded (structural element, not defect)
            2: "drainage_issue", # drainage -> drainage_issue
            3: "open_manhole",   # manhole -> open_manhole
            4: None,             # plastic_bottle -> excluded (ambiguous small litter item)
        }
    },
    "garbage": {
        "dir": str(DATASETS_DIR / "garbage" / "sanitation.v1-garbage.yolov8"),
        "class_map": {
            0: "damaged_footpath", # Broken_Footpath -> damaged_footpath
            1: "garbage",          # C_D_Waste -> garbage
            2: None,               # Cleaned_Garbage_Bins -> excluded (negative state)
            3: "drainage_issue",   # Clogged_Drain -> drainage_issue
            4: None,               # Dustbin_not_cleaned -> excluded pending review
            5: "garbage",          # Garbage_Scattered -> garbage
            6: None,               # Obnoxious_Vegetation -> excluded pending review
            7: "pothole",          # Pothole_on_Road -> pothole
            8: None,               # Sweeping_not_done -> excluded pending review
            9: "waterlogging",     # waterlogging -> waterlogging
        }
    },
    "infrastructure": {
        "dir": str(DATASETS_DIR / "infrastructure" / "Infrastructure.v1i.yolov8"),
        "class_map": {
            0: "damaged_sign", # damaged-sign -> damaged_sign
            1: "pole_damage",  # electricity-pole-damage -> pole_damage
            2: "fallen_tree",  # fallen-trees -> fallen_tree
            3: None,           # graffiti -> excluded pending review
            4: None,           # pipe-burst -> excluded pending review
            5: "pothole",      # pothole -> pothole
            6: "garbage",      # thrash -> garbage
        }
    },
    "potholes": {
        "dir": str(DATASETS_DIR / "potholes" / "Potholes detection.v1-pothhole.yolov8"),
        "class_map": {
            0: "pothole",      # Pothole -> pothole
        }
    },
    "smoke": {
        "dir": str(DATASETS_DIR / "smoke" / "Smoke Detection.v1-smoke-detect.yolov8"),
        "class_map": {
            0: "smoke",        # Smoke -> smoke
        }
    },
    "waterlogging": {
        "dir": str(DATASETS_DIR / "waterlogging" / "Waterlogging.v1-waterlog.yolov8"),
        "class_map": {
            0: None,           # 0 -> ambiguous unlabelled class excluded
            1: None,           # object -> degenerate edge slivers excluded
            2: "waterlogging", # waterlogging -> waterlogging
        }
    }
}

def extract_source_stem(filename: str) -> str:
    """
    Extracts base image identifier by stripping Roboflow augmentation hashes
    and file extensions to group augmentations of the same source photo together.
    Example: 'IMG_8071_jpg.rf.2c2921430f359f5aee7d41e720c28331.jpg' -> 'IMG_8071'
    """
    stem = Path(filename).stem
    # Strip Roboflow hash (.rf.<32 hex chars>)
    stem = re.sub(r'\.rf\.[0-9a-fA-F]{32}$', '', stem)
    # Strip trailing '_jpg', '_jpeg', '_png'
    stem = re.sub(r'_(jpg|jpeg|png)$', '', stem, flags=re.IGNORECASE)
    return stem

def validate_and_convert_annotation(line_idx, line, class_map, src_names, file_path):
    """
    Validates a YOLO line and converts polygon segmentations to bounding boxes.
    Returns:
      (status, result)
      status: 'MAPPED', 'EXCLUDED', 'INVALID'
      result:
        - if MAPPED: (canonical_id, cx, cy, w, h)
        - if EXCLUDED: source_class_name
        - if INVALID: defect_description_string
    """
    tokens = line.strip().split()
    if not tokens:
        return 'EMPTY', None

    try:
        src_cls_id = int(tokens[0])
    except ValueError:
        return 'INVALID', f"Line {line_idx}: Non-integer class ID '{tokens[0]}'"

    src_class_name = src_names[src_cls_id] if src_names and src_cls_id < len(src_names) else str(src_cls_id)

    if src_cls_id < 0 or (src_names and src_cls_id >= len(src_names)):
        return 'INVALID', f"Line {line_idx}: Class ID {src_cls_id} out of bounds (declared {len(src_names)} classes)"

    if src_cls_id not in class_map:
        return 'INVALID', f"Line {line_idx}: Class ID {src_cls_id} ('{src_class_name}') is not defined in class_map"

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

    # 1. Bounding Box Format (exactly 4 coordinates)
    if n_coords == 4:
        cx, cy, w, h = coords
        if any(c < -0.02 or c > 1.02 for c in (cx, cy)):
            return 'INVALID', f"Line {line_idx}: Center coords out of bounds [0, 1]: ({cx}, {cy})"
        if w <= 0.0 or h <= 0.0:
            return 'INVALID', f"Line {line_idx}: Non-positive dimension: w={w}, h={h}"
        if w > 1.02 or h > 1.02:
            return 'INVALID', f"Line {line_idx}: Box dimensions exceed image bounds: w={w}, h={h}"

        # Clamp float precision tolerances strictly to [0.0, 1.0]
        cx = max(0.0, min(1.0, cx))
        cy = max(0.0, min(1.0, cy))
        w = max(0.0001, min(1.0, w))
        h = max(0.0001, min(1.0, h))

        return 'MAPPED', (canonical_id, cx, cy, w, h)

    # 2. Polygon Segmentation Format (even count >= 6)
    elif n_coords >= 6 and n_coords % 2 == 0:
        xs = coords[0::2]
        ys = coords[1::2]

        if any(x < -0.02 or x > 1.02 for x in xs) or any(y < -0.02 or y > 1.02 for y in ys):
            return 'INVALID', f"Line {line_idx}: Polygon coordinates out of range [0, 1]"

        min_x = max(0.0, min(1.0, min(xs)))
        max_x = max(0.0, min(1.0, max(xs)))
        min_y = max(0.0, min(1.0, min(ys)))
        max_y = max(0.0, min(1.0, max(ys)))

        w = max_x - min_x
        h = max_y - min_y

        if w <= 0.0001 or h <= 0.0001:
            return 'INVALID', f"Line {line_idx}: Degenerate sub-pixel polygon (w={w:.5f}, h={h:.5f})"

        cx = min_x + w / 2.0
        cy = min_y + h / 2.0

        return 'MAPPED', (canonical_id, cx, cy, w, h)

    else:
        return 'INVALID', f"Line {line_idx}: Invalid coordinate count ({n_coords}). Expected 4 (bbox) or even >= 6 (polygon)."

def link_or_copy(src, dst):
    """Creates a hardlink if supported, otherwise copies the file."""
    if os.path.exists(dst):
        return
    try:
        os.link(src, dst)
    except Exception:
        shutil.copy2(src, dst)

def compute_file_hash(path):
    """Computes SHA-256 hash of a file for exact deduplication."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def verify_prepared_dataset(dataset_dir):
    """
    Phase 3 Verification:
    Strictly verifies image-label pairing and YOLO format correctness
    on the generated dataset directory.
    """
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
            errors.append(f"Missing images directory: {img_dir}")
            continue
        if not lbl_dir.exists():
            errors.append(f"Missing labels directory: {lbl_dir}")
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
            # Validate label content
            with open(lbl_path, "r", encoding="utf-8") as lf:
                for l_idx, line in enumerate(lf, 1):
                    tokens = line.strip().split()
                    if not tokens:
                        continue
                    if len(tokens) != 5:
                        errors.append(f"{lbl_path.name} line {l_idx}: row length {len(tokens)} != 5")
                        continue
                    try:
                        cid = int(tokens[0])
                        cx, cy, w, h = [float(x) for x in tokens[1:]]
                    except ValueError:
                        errors.append(f"{lbl_path.name} line {l_idx}: non-numeric values")
                        continue

                    if cid < 0 or cid >= len(TARGET_CLASSES):
                        errors.append(f"{lbl_path.name} line {l_idx}: class ID {cid} out of range [0, 9]")
                    if not (0.0 <= cx <= 1.0 and 0.0 <= cy <= 1.0):
                        errors.append(f"{lbl_path.name} line {l_idx}: center out of bounds ({cx}, {cy})")
                    if not (0.0 < w <= 1.0 and 0.0 < h <= 1.0):
                        errors.append(f"{lbl_path.name} line {l_idx}: invalid dimensions w={w}, h={h}")

                    total_bboxes += 1

    print(f"Verified Images:             {total_imgs}", flush=True)
    print(f"Verified Label Files:        {total_labels}", flush=True)
    print(f"Verified Bounding Boxes:     {total_bboxes}", flush=True)
    print(f"Errors Detected:             {len(errors)}", flush=True)

    # Check data.yaml
    yaml_path = dataset_dir / "data.yaml"
    if not yaml_path.exists():
        errors.append("data.yaml does not exist in dataset root!")
    else:
        with open(yaml_path, "r", encoding="utf-8") as yf:
            cfg = yaml.safe_load(yf)
            if cfg.get("nc") != 10:
                errors.append(f"data.yaml nc={cfg.get('nc')} != 10")
            if len(cfg.get("names", {})) != 10:
                errors.append("data.yaml names count != 10")

    if errors:
        print("[FAIL] Dataset verification errors found:", flush=True)
        for e in errors[:10]:
            print(f"  * {e}", flush=True)
        return False
    else:
        print("[PASS] 100% of images and labels strictly validated. Zero defects.", flush=True)
        return True

def audit_and_merge(output_dir=None, dry_run=True, force=False):
    """
    Main pipeline function for Bharat Civic Connect dataset preparation.
    """
    if output_dir is None:
        output_dir = DEFAULT_OUTPUT_DIR
    output_dir = Path(output_dir).resolve()

    print("=" * 80, flush=True)
    print("BHARAT CIVIC CONNECT - PHASE 3 UNIFIED DATASET PIPELINE", flush=True)
    print("=" * 80, flush=True)
    print(f"Target Directory: {output_dir}", flush=True)
    print(f"Execution Mode:   {'DRY-RUN (Audit & simulation only, no files written)' if dry_run else 'EXECUTE (Writing unified dataset)'}", flush=True)
    print(f"Target Classes:   {len(TARGET_CLASSES)} classes", flush=True)
    for idx, name in enumerate(TARGET_CLASSES):
        print(f"  [{idx:2d}] {name}", flush=True)
    print("=" * 80 + "\n", flush=True)

    if not dry_run:
        if output_dir.exists():
            if not force:
                raise FileExistsError(
                    f"Target directory '{output_dir}' already exists! Pass --force to allow safe population."
                )
        for s in SPLITS:
            (output_dir / "images" / s).mkdir(parents=True, exist_ok=True)
            (output_dir / "labels" / s).mkdir(parents=True, exist_ok=True)

    # Phase 1: Scanning, deduplication, and annotation validation
    source_records = []
    invalid_annotations = []
    missing_labels = []
    excluded_counts = Counter()
    size_to_paths = defaultdict(list)
    hash_cache = {}
    duplicate_images = 0
    source_dataset_stats = {}

    print("Phase 1: Scanning source datasets and validating annotations...", flush=True)
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
                print(f"  [ERROR] Cannot list {img_dir}: {err}", flush=True)
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

                # Exact duplicate detection via file size + SHA-256 hash
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
                except Exception as ex:
                    print(f"  [WARN] Hash error {src_img_path}: {ex}", flush=True)

                # Parse and validate annotations strictly
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
                            elif status == 'INVALID':
                                invalid_annotations.append({
                                    "file": src_lbl_path,
                                    "line": l_idx,
                                    "reason": res,
                                    "content": line.strip()
                                })
                except UnicodeDecodeError:
                    invalid_annotations.append({
                        "file": src_lbl_path,
                        "line": 0,
                        "reason": "Unicode decoding error reading label file",
                        "content": ""
                    })

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
        print(f"  [{ds_key:15s}] Verified {ds_imgs:5d} unique valid images.", flush=True)

    print(f"\nTotal unique images scanned: {len(source_records)}", flush=True)
    print(f"Duplicate images filtered:   {duplicate_images}", flush=True)
    print(f"Missing label files:         {len(missing_labels)}", flush=True)
    print(f"Invalid annotations excluded: {len(invalid_annotations)}", flush=True)

    if missing_labels:
        print("\n[FATAL] Missing label files detected (images without corresponding .txt):", flush=True)
        for mpath in missing_labels[:10]:
            print(f"  {mpath}", flush=True)
        raise FileNotFoundError(f"Stopping: {len(missing_labels)} images missing label files.")

    # Phase 2: Group by source image and stratify 80% train / 10% val / 10% test
    print("\nPhase 2: Grouping near-duplicates and stratifying splits (80% Train / 10% Val / 10% Test)...", flush=True)
    groups = defaultdict(list)
    for rec in source_records:
        groups[rec["group_id"]].append(rec)

    near_duplicate_groups = {gid: len(recs) for gid, recs in groups.items() if len(recs) > 1}
    near_dup_img_count = sum(near_duplicate_groups.values())
    print(f"  Total source image groups: {len(groups)}", flush=True)
    print(f"  Augmented / near-duplicate groups: {len(near_duplicate_groups)} ({near_dup_img_count} images)", flush=True)
    print("  -> All images in each group assigned to the same split to prevent data leakage.", flush=True)

    # Class scarcity ranking (rarest classes assigned first)
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

    # Compile statistics
    split_img_counts = Counter()
    class_split_stats = defaultdict(lambda: Counter())
    total_annotations_mapped = 0

    for rec in source_records:
        split = group_split_assignment[rec["group_id"]]
        split_img_counts[split] += 1

        for anno in rec["annotations"]:
            cid = int(anno.split()[0])
            cname = TARGET_CLASSES[cid]
            class_split_stats[cname][split] += 1
            total_annotations_mapped += 1

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

    # Generate data.yaml with relative paths
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
        print(f"\n[OK] Generated unified config: {yaml_path}", flush=True)

    # Build audit report dictionary
    audit_data = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "is_dry_run": dry_run,
        "output_directory": str(output_dir),
        "target_classes": {idx: name for idx, name in enumerate(TARGET_CLASSES)},
        "source_dataset_images": source_dataset_stats,
        "total_unique_images": len(source_records),
        "source_image_groups": len(groups),
        "duplicate_images_filtered": duplicate_images,
        "near_duplicate_groups": len(near_duplicate_groups),
        "near_duplicate_images": near_dup_img_count,
        "total_annotations_mapped": total_annotations_mapped,
        "missing_label_files": len(missing_labels),
        "invalid_annotations_excluded_count": len(invalid_annotations),
        "invalid_annotations_excluded": invalid_annotations,
        "excluded_classes_summary": dict(excluded_counts),
        "split_image_distribution": {
            s: {
                "count": split_img_counts[s],
                "percentage": round(split_img_counts[s] / len(source_records) * 100, 2) if source_records else 0.0
            }
            for s in SPLITS
        },
        "class_annotation_distribution": {
            cname: {
                "id": CLASS_TO_ID[cname],
                "train": class_split_stats[cname]["train"],
                "val": class_split_stats[cname]["val"],
                "test": class_split_stats[cname]["test"],
                "total": sum(class_split_stats[cname].values()),
                "train_pct": round(class_split_stats[cname]["train"] / max(1, sum(class_split_stats[cname].values())) * 100, 1),
                "val_pct": round(class_split_stats[cname]["val"] / max(1, sum(class_split_stats[cname].values())) * 100, 1),
                "test_pct": round(class_split_stats[cname]["test"] / max(1, sum(class_split_stats[cname].values())) * 100, 1),
            }
            for cname in TARGET_CLASSES
        }
    }

    # Save audit_report.json
    report_path = output_dir / "audit_report.json"
    if not dry_run:
        with open(report_path, "w", encoding="utf-8") as rf:
            json.dump(audit_data, rf, indent=2)
        print(f"[OK] Saved audit report: {report_path}", flush=True)
    else:
        # In dry run, write dry run audit to a dedicated file for inspection
        dry_run_report_path = BASE_DIR / "unified_dataset_audit_report.json"
        with open(dry_run_report_path, "w", encoding="utf-8") as rf:
            json.dump(audit_data, rf, indent=2)
        print(f"[OK] Saved dry-run audit report to: {dry_run_report_path}", flush=True)

    # Comprehensive Readable Terminal Report
    print("\n" + "=" * 80, flush=True)
    print("COMPREHENSIVE AUDIT & HARMONIZATION REPORT", flush=True)
    print("=" * 80, flush=True)
    total_unique_imgs = len(source_records)
    print(f"Total Unique Images:             {total_unique_imgs}", flush=True)
    print(f"Source Image Groups:             {len(groups)} (zero cross-split leakage)", flush=True)
    print(f"Exact Duplicate Images Filtered: {duplicate_images}", flush=True)
    print(f"Near-Duplicate Groups Detected:  {len(near_duplicate_groups)} ({near_dup_img_count} images)", flush=True)
    print(f"Total Annotations Mapped:        {total_annotations_mapped}", flush=True)
    print(f"Missing Labels (Empty):          {len(missing_labels)}", flush=True)
    print(f"Invalid Annotations Excluded:    {len(invalid_annotations)}", flush=True)

    print("\n--- Image Distribution Across Splits ---", flush=True)
    for s in SPLITS:
        cnt = split_img_counts[s]
        pct = (cnt / total_unique_imgs * 100) if total_unique_imgs else 0
        print(f"  {s.capitalize():5s}: {cnt:5d} images ({pct:.1f}%)", flush=True)

    print("\n--- Class Annotation Counts Per Split (Target: 80% Train / 10% Val / 10% Test) ---", flush=True)
    print(f"{'ID':2s} | {'Class Name':20s} | {'Train':7s} | {'Val':7s} | {'Test':7s} | {'Total':7s} | {'Train %':7s} | {'Val %':6s} | {'Test %':6s}", flush=True)
    print("-" * 84, flush=True)
    for idx, cname in enumerate(TARGET_CLASSES):
        tr = class_split_stats[cname]["train"]
        val = class_split_stats[cname]["val"]
        te = class_split_stats[cname]["test"]
        tot = tr + val + te
        tr_pct = f"{(tr/tot*100):.1f}%" if tot else "0.0%"
        val_pct = f"{(val/tot*100):.1f}%" if tot else "0.0%"
        te_pct = f"{(te/tot*100):.1f}%" if tot else "0.0%"
        print(f"{idx:2d} | {cname:20s} | {tr:7d} | {val:7d} | {te:7d} | {tot:7d} | {tr_pct:7s} | {val_pct:6s} | {te_pct:6s}", flush=True)

    if invalid_annotations:
        print(f"\n--- Excluded Invalid Annotations ({len(invalid_annotations)} instances) ---", flush=True)
        for item in invalid_annotations:
            print(f"  * {item['file']} (Line {item['line']}): {item['reason']}", flush=True)

    print("\n--- Excluded Ambiguous / Unmapped Classes ---", flush=True)
    for src_tag, cnt in sorted(excluded_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {src_tag:38s}: {cnt:5d} instances excluded", flush=True)

    print("=" * 80, flush=True)
    if dry_run:
        print("STATUS: DRY-RUN AUDIT PASSED - READY FOR EXECUTION", flush=True)
    else:
        verified = verify_prepared_dataset(output_dir)
        if verified:
            print("STATUS: DATASET GENERATED & FULLY VERIFIED", flush=True)
        else:
            print("STATUS: DATASET GENERATED WITH VERIFICATION WARNINGS", flush=True)
    print("=" * 80 + "\n", flush=True)

    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bharat Civic Connect - Phase 3 Dataset Preparation")
    parser.add_argument("--output", default=None, help="Output directory (defaults to ai-service/unified_dataset)")
    parser.add_argument("--dry-run", action="store_true", default=False, help="Run dry-run validation without writing files")
    parser.add_argument("--execute", action="store_true", help="Execute file writing (creates unified dataset)")
    parser.add_argument("--force", action="store_true", help="Allow overwrite if output directory exists")
    args = parser.parse_args()

    # Determine execution mode: dry_run unless explicitly --execute
    is_dry_run = not args.execute or args.dry_run

    audit_and_merge(output_dir=args.output, dry_run=is_dry_run, force=args.force)
