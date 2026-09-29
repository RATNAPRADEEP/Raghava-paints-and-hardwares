#!/usr/bin/env python3
"""
Build the Raghava AI Stock Scanner reference gallery.

The source SKU Vision project populated a gallery from large licensed datasets.
For Raghava we keep the same gallery concept but read the shop's canonical
product registry and copy only explicitly supplied local reference images.

Usage:
    python ai-scanner/scripts/populate_sku_gallery.py --source <folder>
    python ai-scanner/scripts/populate_sku_gallery.py --source <folder> --dry-run

Expected source layout (recommended):
    <source>/
      AP-001/
        01.jpg
        02.jpg
      AP-002/
        01.jpg

The folder names must match SKU IDs in registry/products.json.
No image is copied when the SKU is not present in the canonical registry.
"""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_FILE = PROJECT_ROOT / "registry" / "products.json"
GALLERY_DIR = PROJECT_ROOT / "experiments" / "curated_pipeline" / "data" / "products"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def load_registry() -> dict:
    if not REGISTRY_FILE.exists():
        raise FileNotFoundError(f"Product registry not found: {REGISTRY_FILE}")
    return json.loads(REGISTRY_FILE.read_text(encoding="utf-8"))


def build_gallery(source_dir: Path, dry_run: bool = False) -> tuple[int, int]:
    registry = load_registry()
    products = {
        item["sku"]: item
        for item in registry.get("products", [])
        if item.get("sku")
    }

    if not products:
        print("No products are registered yet.")
        print(f"Add products to: {REGISTRY_FILE}")
        return 0, 0

    copied = 0
    skipped = 0

    for sku, product in products.items():
        source_sku_dir = source_dir / sku
        if not source_sku_dir.is_dir():
            continue

        images = sorted(
            p for p in source_sku_dir.iterdir()
            if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
        )
        if not images:
            continue

        target_dir = GALLERY_DIR / sku
        if not dry_run:
            target_dir.mkdir(parents=True, exist_ok=True)

        for image in images:
            target = target_dir / image.name
            if target.exists():
                skipped += 1
                continue

            if not dry_run:
                shutil.copy2(image, target)
            copied += 1

    return copied, skipped


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, help="Folder containing one subfolder per SKU")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    source_dir = Path(args.source).expanduser().resolve()
    if not source_dir.is_dir():
        print(f"Source directory not found: {source_dir}")
        return 1

    copied, skipped = build_gallery(source_dir, dry_run=args.dry_run)

    mode = "Would copy" if args.dry_run else "Copied"
    print(f"{mode}: {copied} reference image(s)")
    print(f"Skipped existing: {skipped}")
    print(f"Gallery: {GALLERY_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
