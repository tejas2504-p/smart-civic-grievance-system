"""
Dataset Downloader & Setup for Bharat Civic Connect (AI Service)

This script automates downloading and extracting the Civic Grievance Detection
datasets (~7.9 GB, 10 classes) from Hugging Face Datasets, GitHub Releases,
or any custom direct URL, and places them into the expected directories:
  - ai-service/unified_dataset/
  - ai-service/datasets/

Usage:
  python download_dataset.py --source huggingface --repo-id <hf-username>/bharat-civic-grievance-dataset
  python download_dataset.py --source url --url <direct-zip-download-url>
  python download_dataset.py --verify-only
"""

import os
import sys
import argparse
import zipfile
import shutil
from pathlib import Path

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

BASE_DIR = Path(__file__).resolve().parent
UNIFIED_DIR = BASE_DIR / "unified_dataset"
DATASETS_DIR = BASE_DIR / "datasets"

def verify_dataset_structure():
    """Verify that unified_dataset has the required structure for YOLO training."""
    print("=" * 60)
    print("Verifying AI Dataset Structure...")
    print("=" * 60)

    data_yaml = UNIFIED_DIR / "data.yaml"
    if not data_yaml.exists():
        print(f"[MISSING] data.yaml not found at {data_yaml}")
        return False
    print(f"[OK] data.yaml found: {data_yaml}")

    for split in ["train", "val"]:
        img_dir = UNIFIED_DIR / "images" / split
        lbl_dir = UNIFIED_DIR / "labels" / split
        img_count = len(list(img_dir.glob("*.*"))) if img_dir.exists() else 0
        lbl_count = len(list(lbl_dir.glob("*.txt"))) if lbl_dir.exists() else 0

        if img_count == 0:
            print(f"[WARNING] No images found in {img_dir}")
        else:
            print(f"[OK] {split} split: {img_count} images, {lbl_count} labels")

    return True

def download_from_huggingface(repo_id: str, local_dir: Path):
    """Download full dataset snapshot from Hugging Face Hub."""
    try:
        from huggingface_hub import snapshot_download
    except ImportError:
        print("\n[ERROR] 'huggingface_hub' is required to download from Hugging Face.")
        print("Install it with: pip install huggingface_hub\n")
        sys.exit(1)

    print(f"\nDownloading dataset snapshot from Hugging Face ({repo_id})...")
    print("This may take several minutes depending on your internet connection.\n")

    snapshot_download(
        repo_id=repo_id,
        repo_type="dataset",
        local_dir=str(local_dir),
        local_dir_use_symlinks=False,
    )
    print(f"\n[SUCCESS] Download completed into: {local_dir}")

def download_from_url(url: str, output_zip: Path, extract_to: Path):
    """Download zip archive from URL and extract it."""
    import urllib.request

    print(f"\nDownloading dataset archive from:\n  {url}")
    print(f"Target: {output_zip}\n")

    def report_progress(block_num, block_size, total_size):
        downloaded = block_num * block_size
        if total_size > 0:
            percent = downloaded / total_size * 100
            mb = downloaded / (1024 * 1024)
            total_mb = total_size / (1024 * 1024)
            sys.stdout.write(f"\rProgress: {percent:.1f}% ({mb:.1f} MB / {total_mb:.1f} MB)")
        else:
            sys.stdout.write(f"\rDownloaded: {downloaded / (1024 * 1024):.1f} MB")
        sys.stdout.flush()

    output_zip.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(url, output_zip, reporthook=report_progress)
    print("\n\nExtracting archive...")

    with zipfile.ZipFile(output_zip, 'r') as zip_ref:
        zip_ref.extractall(extract_to)

    print(f"[SUCCESS] Extracted to: {extract_to}")

    # Optionally clean up the zip file
    if output_zip.exists():
        print("Cleaning up temporary zip archive...")
        output_zip.unlink()

def main():
    parser = argparse.ArgumentParser(description="Download and verify AI datasets for Bharat Civic Connect")
    parser.add_argument("--source", choices=["huggingface", "url"], default="huggingface",
                        help="Download source (huggingface or url)")
    parser.add_argument("--repo-id", type=str, default="tejas2504-p/bharat-civic-grievance-dataset",
                        help="Hugging Face dataset repository ID")
    parser.add_argument("--url", type=str, default="",
                        help="Direct download URL for dataset zip")
    parser.add_argument("--verify-only", action="store_true",
                        help="Verify local dataset structure without downloading")

    args = parser.parse_args()

    if args.verify_only:
        verify_dataset_structure()
        return

    print("=" * 60)
    print("Bharat Civic Connect - AI Dataset Setup")
    print("=" * 60)

    if args.source == "huggingface":
        download_from_huggingface(args.repo_id, BASE_DIR)
    elif args.source == "url":
        if not args.url:
            print("[ERROR] Must provide --url when using --source url")
            sys.exit(1)
        temp_zip = BASE_DIR / "temp_dataset.zip"
        download_from_url(args.url, temp_zip, BASE_DIR)

    verify_dataset_structure()

if __name__ == "__main__":
    main()
