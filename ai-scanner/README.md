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
