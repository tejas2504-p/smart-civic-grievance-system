import os
import sys
import yaml
from collections import Counter

# Set UTF-8 encoding for Windows stdout
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

dataset_dir = os.path.join(os.getcwd(), 'ai-service', 'datasets')

# Find YAML files by targeted scan (only 2 levels deep)
yaml_files = []
for root, dirs, files in os.walk(dataset_dir):
    # Don't recurse into images/labels
    dirs[:] = [d for d in dirs if d not in ('images', 'labels', 'train', 'valid', 'test')]
    for f in files:
        if f == 'data.yaml':
            yaml_files.append(os.path.join(root, f))

print(f"Found {len(yaml_files)} data.yaml files in datasets.\n")

for ypath in sorted(yaml_files):
    print("=" * 70)
    rel_path = os.path.relpath(ypath, os.getcwd())
    print(f"Dataset config: {rel_path}")
    ydir = os.path.dirname(ypath)
    
    with open(ypath, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    
    raw_train = data.get('train')
    raw_val = data.get('val')
    raw_test = data.get('test')
    names = data.get('names')
    nc = data.get('nc')
    
    print(f"Raw YAML paths: train='{raw_train}', val='{raw_val}', test='{raw_test}'")
    print(f"Number of classes (nc): {nc}")
    print(f"Class names: {names}")
    
    train_resolved = os.path.normpath(os.path.join(ydir, str(raw_train)))
    train_exists = os.path.exists(train_resolved)
    
    local_train = os.path.join(ydir, 'train', 'images')
    local_val = os.path.join(ydir, 'valid', 'images')
    local_test = os.path.join(ydir, 'test', 'images')
    
    print(f"Issue check: current 'train' resolves to '{train_resolved}' -> EXISTS? {train_exists}")
    print(f"Local subfolders exist: train={os.path.exists(local_train)}, valid={os.path.exists(local_val)}, test={os.path.exists(local_test)}")
    
    for split in ['train', 'valid', 'test']:
        split_lbl_dir = os.path.join(ydir, split, 'labels')
        split_img_dir = os.path.join(ydir, split, 'images')
        
        n_imgs = len(os.listdir(split_img_dir)) if os.path.exists(split_img_dir) else 0
        lbl_files = [f for f in os.listdir(split_lbl_dir) if f.endswith('.txt')] if os.path.exists(split_lbl_dir) else []
        
        counter = Counter()
        for lf in lbl_files:
            try:
                with open(os.path.join(split_lbl_dir, lf), 'r', encoding='utf-8') as f:
                    for line in f:
                        parts = line.strip().split()
                        if parts:
                            cls_id = int(parts[0])
                            counter[cls_id] += 1
            except Exception:
                pass
        
        mapped_counts = {}
        for cid, count in sorted(counter.items()):
            if isinstance(names, list) and cid < len(names):
                cname = names[cid]
            elif isinstance(names, dict) and cid in names:
                cname = names[cid]
            else:
                cname = f"unknown_{cid}"
            mapped_counts[f"{cid}:{cname}"] = count
            
        print(f"  Split '{split}': {n_imgs} images, {len(lbl_files)} label files. Instances: {mapped_counts}")

print("\nDone.")
