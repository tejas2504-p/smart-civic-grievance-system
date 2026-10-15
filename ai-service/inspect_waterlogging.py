import os
import sys
from collections import Counter

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

base_dir = os.path.join(os.getcwd(), 'ai-service', 'datasets', 'waterlogging', 'Waterlogging.v1-waterlog.yolov8')
splits = ['train', 'valid', 'test']

print('=' * 75)
print('WATERLOGGING DATASET: IN-DEPTH LABEL & CLASS INSPECTION')
print('=' * 75)

total_by_class = Counter()
coord_len_counts = Counter()
files_with_classes = { '0': 0, '1': 0, '2': 0 }

for s in splits:
    lbl_dir = os.path.join(base_dir, s, 'labels')
    if not os.path.exists(lbl_dir):
        print(f"Split '{s}': Directory not found!")
        continue
    
    files = [f for f in os.listdir(lbl_dir) if f.endswith('.txt')]
    split_counts = Counter()
    sample_lines = {}

    for f in files:
        classes_in_file = set()
        with open(os.path.join(lbl_dir, f), 'r', encoding='utf-8') as fp:
            for line in fp:
                p = line.strip().split()
                if not p:
                    continue
                cid = p[0]
                classes_in_file.add(cid)
                split_counts[cid] += 1
                total_by_class[cid] += 1
                
                n_coords = len(p) - 1
                if n_coords == 4:
                    coord_len_counts['Bounding Box (4 coords: cx cy w h)'] += 1
                else:
                    coord_len_counts['Polygon Segmentation (>4 coords: x1 y1 x2 y2 ...)'] += 1
                    
                if cid not in sample_lines:
                    sample_lines[cid] = (f, line.strip())

        for c in classes_in_file:
            if c in files_with_classes:
                files_with_classes[c] += 1

    print(f"Split '{s}': {len(files)} files")
    for cid in sorted(split_counts.keys(), key=lambda x: int(x)):
        name_hint = ['0', 'object', 'waterlogging'][int(cid)] if int(cid) < 3 else 'unknown'
        print(f"  Class ID {cid} ('{name_hint}'): {split_counts[cid]} instances")
    
    print("  Samples:")
    for cid, (fname, sline) in sorted(sample_lines.items(), key=lambda x: int(x[0])):
        tokens = sline.split()
        preview = ' '.join(tokens[:5]) + (' ...' if len(tokens) > 5 else '')
        print(f"    Class {cid} in {fname[:35]}... ({len(tokens)-1} coords): {preview}")
    print()

print('=' * 75)
print('TOTAL INSTANCES ACROSS ALL SPLITS:')
for cid in sorted(total_by_class.keys(), key=lambda x: int(x)):
    name_hint = ['0', 'object', 'waterlogging'][int(cid)] if int(cid) < 3 else 'unknown'
    print(f"  Class ID {cid} ('{name_hint}'): {total_by_class[cid]} instances across {files_with_classes.get(cid, 0)} images")

print('\nANNOTATION FORMAT BREAKDOWN:')
for fmt, count in coord_len_counts.items():
    print(f"  {fmt}: {count} annotations")
print('=' * 75)
