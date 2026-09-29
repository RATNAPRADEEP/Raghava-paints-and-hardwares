#!/usr/bin/env python3
"""
Download reference product images for the Raghava AI Stock Scanner.

This utility reads registry/reference_sources.json, visits each declared source
page, extracts likely product image URLs (og:image, twitter:image and image
tags), downloads a small deduplicated set per SKU, and stores them under:

  experiments/curated_pipeline/data/products/<SKU>/

It is intentionally conservative:
- only URLs found on the declared source page are considered;
- no SKU is inferred from an unrelated page;
- existing files are never overwritten;
- failures are logged so one unavailable product does not stop the batch.

Run from a machine with internet access:
  python ai-scanner/scripts/download_reference_gallery.py
  python ai-scanner/scripts/download_reference_gallery.py --max-images 3
  python ai-scanner/scripts/download_reference_gallery.py --dry-run
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SOURCE_MANIFEST = PROJECT_ROOT / "registry" / "reference_sources.json"
GALLERY_DIR = PROJECT_ROOT / "experiments" / "curated_pipeline" / "data" / "products"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 Chrome/154 Safari/537.36 "
    "RaghavaPaints-AI-ReferenceGallery/1.0"
)
IMAGE_RE = re.compile(r"""(?i)(?:src|data-src|data-original|content)=[\\"']([^\\"']+)""")
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def load_manifest() -> dict:
    return json.loads(SOURCE_MANIFEST.read_text(encoding="utf-8"))


def extract_candidates(html: str, page_url: str) -> list[str]:
    candidates: list[str] = []

    # Metadata images are usually the cleanest product-page assets.
    for pattern in (
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
        r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']twitter:image["\']',
    ):
        for match in re.findall(pattern, html, flags=re.I):
            candidates.append(urljoin(page_url, match))

    # Also inspect common image attributes.
    for match in IMAGE_RE.findall(html):
        value = match.replace("&amp;", "&").strip()
        if value.startswith(("data:", "javascript:")):
            continue
        absolute = urljoin(page_url, value)
        path = urlparse(absolute).path.lower()
        if any(path.endswith(ext) for ext in IMAGE_EXTENSIONS):
            candidates.append(absolute)

    # Preserve order while removing duplicates.
    seen = set()
    return [u for u in candidates if not (u in seen or seen.add(u))]


def safe_filename(sku: str, index: int, url: str, content_type: str | None) -> str:
    ext = Path(urlparse(url).path).suffix.lower()
    if ext not in IMAGE_EXTENSIONS:
        ext = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
        }.get((content_type or "").split(";")[0].lower(), ".jpg")
    digest = hashlib.sha1(url.encode("utf-8")).hexdigest()[:8]
    return f"reference_{index:02d}_{digest}{ext}"


def download_for_product(session: requests.Session, sku: str, source_url: str,
                         max_images: int, dry_run: bool) -> tuple[int, list[str]]:
    response = session.get(source_url, timeout=30)
    response.raise_for_status()
    candidates = extract_candidates(response.text, source_url)

    target_dir = GALLERY_DIR / sku
    if not dry_run:
        target_dir.mkdir(parents=True, exist_ok=True)

    saved = 0
    errors: list[str] = []

    for image_url in candidates:
        if saved >= max_images:
            break

        try:
            image_response = session.get(
                image_url,
                timeout=30,
                headers={"Referer": source_url},
            )
            image_response.raise_for_status()
            content_type = image_response.headers.get("content-type", "")
            if not content_type.lower().startswith("image/"):
                continue
            if len(image_response.content) < 5_000:
                continue

            filename = safe_filename(sku, saved + 1, image_url, content_type)
            target = target_dir / filename
            if target.exists():
                saved += 1
                continue

            if not dry_run:
                target.write_bytes(image_response.content)
            saved += 1
        except Exception as exc:
            errors.append(f"{image_url} :: {exc}")

    return saved, errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-images", type=int, default=3)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--delay", type=float, default=0.5)
    args = parser.parse_args()

    if args.max_images < 1:
        parser.error("--max-images must be at least 1")

    manifest = load_manifest()
    products = manifest.get("products", [])
    if not products:
        print("No products found in reference_sources.json")
        return 1

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    total = 0
    failed = 0

    for item in products:
        sku = item.get("sku")
        source = item.get("source")
        if not sku or not source:
            continue

        print(f"[{sku}] {item.get('name', '')}")
        try:
            saved, errors = download_for_product(
                session, sku, source, args.max_images, args.dry_run
            )
            total += saved
            print(f"  {'would save' if args.dry_run else 'saved'}: {saved}")
            for error in errors[:3]:
                print(f"  image warning: {error}")
        except Exception as exc:
            failed += 1
            print(f"  page failed: {exc}")

        time.sleep(max(0.0, args.delay))

    print()
    print(f"Reference images processed: {total}")
    print(f"Source pages failed: {failed}")
    print(f"Gallery: {GALLERY_DIR}")
    return 0 if failed == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
