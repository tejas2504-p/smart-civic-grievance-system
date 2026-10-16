# Bharat Civic Connect - AI Dataset Architecture & Storage Guide

This document provides complete technical specifications, size audits, and storage instructions for the civic grievance detection datasets used in the Bharat Civic Connect portal.

---

## 1. Dataset Overview & Inventory

The AI service classifies and detects 10 civic issue categories from citizen-submitted images:
1. `pothole`
2. `garbage`
3. `drainage_issue`
4. `waterlogging`
5. `damaged_sign`
6. `pole_damage`
7. `fallen_tree`
8. `smoke`
9. `open_manhole`
10. `damaged_footpath`

### Size Audit & Breakdown

| Dataset Folder | File Count | Size (MB) | Size (GB) | Max File Size | Files > 100 MB |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `datasets/damaged-signs/` | 671 | 28.27 MB | 0.03 GB | 1.15 MB | 0 |
| `datasets/dirt/` | 346 | 2.40 MB | 0.00 GB | 0.49 MB | 0 |
| `datasets/drainage/` | 6,364 | 1,048.22 MB | 1.02 GB | 0.62 MB | 0 |
| `datasets/garbage/` | 13,594 | 2,366.01 MB | 2.31 GB | 3.91 MB | 0 |
| `datasets/infrastructure/` | 4,936 | 192.79 MB | 0.19 GB | 0.52 MB | 0 |
| `datasets/potholes/` | 5,186 | 213.81 MB | 0.21 GB | 4.39 MB | 0 |
| `datasets/road-damage/` | 1,057 | 21.63 MB | 0.02 GB | 0.11 MB | 0 |
| `datasets/smoke/` | 546 | 15.05 MB | 0.01 GB | 1.56 MB | 0 |
| `datasets/waterlogging/` | 2,830 | 105.30 MB | 0.10 GB | 0.16 MB | 0 |
| **Subtotal (`datasets/`)** | **35,530** | **3,993.48 MB** | **~3.90 GB** | **4.39 MB** | **0** |
| `unified_dataset/` | 32,444 | 3,912.07 MB | ~3.82 GB | 4.50 MB | 0 |
| **GRAND TOTAL** | **67,974** | **7,905.55 MB** | **~7.72 GB** | **4.50 MB** | **0** |

> **Key Finding**: No individual file exceeds GitHub's 100 MB per-file threshold (maximum file size is 4.50 MB). However, the cumulative size is **7.91 GB** across **67,974 files**.

---

## 2. GitHub & Git LFS Storage Implications

### Why the Datasets Were Missing from GitHub
In `ai-service/.gitignore`, lines 13–14 explicitly ignored:
```gitignore
datasets/
unified_dataset/
```
This was configured because raw computer vision datasets of this scale exceed standard GitHub limits.

### GitHub Constraints:
1. **GitHub Standard Push Limit**: GitHub enforces a strict **2 GB maximum payload per push** and strongly recommends keeping total repository size **under 1 GB to 5 GB**. Staging 68,000 files totaling 7.9 GB into standard Git causes packfile crashes and blocks pushes.
2. **GitHub Free Git LFS Quota**: GitHub Free accounts include only **1 GB total storage** and **1 GB/month bandwidth**. Attempting to upload 7.9 GB via Git LFS results in immediate quota rejection:
   `batch response: This repository exceeded its Git LFS quota.`
3. **Repository Bloat**: Adding 68,000 image blobs to Git history permanently slows down `git status`, `git checkout`, `git clone`, and IDE performance.

---

## 3. Recommended Hosting Strategy (Industry Standard)

To maintain an agile, clean GitHub codebase while ensuring 100% reproducible training, datasets are hosted using one of the following free, high-bandwidth platforms:

### Option A: Hugging Face Datasets (Recommended)
Hugging Face offers free, unlimited storage for public ML datasets.

1. **Install Hugging Face CLI**:
   ```bash
   pip install huggingface_hub
   ```
2. **Login**:
   ```bash
   huggingface-cli login
   ```
3. **Create and Upload the Dataset**:
   ```bash
   huggingface-cli upload your-username/bharat-civic-grievance-dataset ./ai-service/unified_dataset . --repo-type=dataset
   ```
4. **Download on Any Machine**:
   ```bash
   python ai-service/download_dataset.py --source huggingface --repo-id your-username/bharat-civic-grievance-dataset
   ```

---

### Option B: GitHub Releases (Assets up to 2 GB each)
GitHub Releases allows attaching binary assets up to 2 GB each for free, without counting against repository storage limits.

1. Compress the dataset into parts under 2 GB:
   - `unified_dataset_images.zip`
   - `unified_dataset_labels.zip`
2. Create a GitHub Release (e.g. `v1.0.0-dataset`) on [tejas2504-p/smart-civic-grievance-system](https://github.com/tejas2504-p/smart-civic-grievance-system/releases).
3. Attach the zip files.
4. Download using `download_dataset.py`:
   ```bash
   python ai-service/download_dataset.py --source url --url <release-asset-download-url>
   ```

---

## 4. Tracked Files in Git

The following configuration and metadata files are tracked directly in Git to ensure full reproducibility without repo bloat:
- `ai-service/download_dataset.py`: Automated dataset downloader & validator.
- `ai-service/DATASET_GUIDE.md`: This architecture document.
- `ai-service/unified_dataset/data.yaml`: YOLOv8/11 dataset configuration mapping classes.
- `ai-service/unified_dataset_audit_report.json`: Full deduplication & bounding box validation report.
- `ai-service/merge_datasets.py`: Pipeline script to merge raw datasets into `unified_dataset`.
- `ai-service/train.py` & `ai-service/resume_training.py`: Model training entrypoints.
- `ai-service/check_label_formats.py`, `inspect_datasets.py`, `inspect_labels.py`, `inspect_waterlogging.py`, `verify_datasets.py`: Diagnostic and auditing toolchain.

---

## 5. Security & Sensitive File Audit

A full security scan confirmed:
- No API keys, secret tokens, or private credentials are embedded in any dataset, JSON, YAML, or Python script.
- Root `.env` is safely ignored by `.gitignore` and only `.env.example` is committed.
- No rebase or merge conflicts are active.
