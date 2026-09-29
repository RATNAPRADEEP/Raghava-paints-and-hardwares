# Raghava AI Stock Scanner

Isolated Job 1 foundation based on the public SKU Vision Pipeline.

## Architecture
Phone/captured image -> YOLO detection -> product crops -> DINOv3 + MobileNet embeddings -> SKU matching -> review.

## Job 1 scope
- Core SKU Vision pipeline copied into this isolated module.
- Raghava-specific configuration and product registry location.
- Existing Raghava UI, Inventory, Excel workbook, APIs and AWS code are intentionally untouched.
- Model weights and product reference images are added in later jobs.

## Expected model paths
- ai-scanner/models/SKU110K_V3.pt
- ai-scanner/models/dinov3/dinov3_vits16plus_pretrain_lvd1689m-4057cbaa.pth

## Product gallery
Put reference images under:
ai-scanner/experiments/curated_pipeline/data/products/<SKU_ID>/

## Run from repository root
python ai-scanner/experiments/curated_pipeline/pipeline.py --help

This branch is an isolated implementation/save point for the AI Stock Scanner.


## Gallery preparation
The canonical shop product metadata lives at `ai-scanner/registry/products.json`.
Use `ai-scanner/scripts/populate_sku_gallery.py` to copy locally supplied reference images
from one SKU folder per product into the scanner gallery. This keeps the reference gallery
separate from the existing Raghava workbook and app data.

Example:
```
python ai-scanner/scripts/populate_sku_gallery.py --source <reference-image-root> --dry-run
python ai-scanner/scripts/populate_sku_gallery.py --source <reference-image-root>
```

The source folder must contain subfolders named exactly like the canonical SKU IDs.
Unknown SKU folders are ignored. Existing gallery files are not overwritten.

## Safety boundary
Recognition does not directly change stock. The intended flow is:
**Scan -> Recognize -> Review -> Confirm -> Inventory adapter.**


## Online reference gallery
The MVP registry also contains official Asian Paints source pages in `ai-scanner/registry/reference_sources.json`. When running on a machine with internet access, the automated downloader can attempt to collect
up to three product-page images per SKU:

```bash
python ai-scanner/scripts/download_reference_gallery.py --dry-run
python ai-scanner/scripts/download_reference_gallery.py --max-images 3
```

The downloader only considers image URLs found on each declared source page, never overwrites
existing gallery files, and continues when an individual product page or image is unavailable.
Online images are reference imagery; they are not evidence that the physical item is currently
in shop inventory. Do not automatically update inventory from recognition.
