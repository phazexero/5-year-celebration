#!/usr/bin/env python3
"""
Compress originals from raw_photos/yearN/* into public/photos/yearN/01.webp, 02.webp, ...

  * fixes EXIF orientation
  * resizes so the long edge is at most 1600px (never upscales)
  * saves WebP at quality 80
  * orders photos by EXIF capture date when available, otherwise by filename

Usage:
  pip install Pillow
  python scripts/compress.py              # all years
  python scripts/compress.py --year 3     # just year 3
  python scripts/compress.py --max 1600 --quality 80

Existing .webp files in public/photos/yearN/ are replaced. Then edit
src/content/memories.json so each entry's "file" matches (01.webp ... 10.webp).
"""
from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is not installed. Run:  pip install Pillow")

try:  # optional HEIC support (iPhone photos):  pip install pillow-heif
    from pillow_heif import register_heif_opener  # type: ignore

    register_heif_opener()
except ImportError:
    pass

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "raw_photos"
OUT = ROOT / "public" / "photos"
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".tif", ".tiff", ".bmp"}

EXIF_DATETIME_ORIGINAL = 36867
EXIF_DATETIME = 306
EXIF_IFD = 0x8769


def capture_date(path: Path) -> datetime | None:
    try:
        with Image.open(path) as im:
            exif = im.getexif()
            raw = exif.get_ifd(EXIF_IFD).get(EXIF_DATETIME_ORIGINAL) or exif.get(EXIF_DATETIME)
            if raw:
                return datetime.strptime(str(raw).strip()[:19], "%Y:%m:%d %H:%M:%S")
    except Exception:
        pass
    return None


def sort_key(path: Path):
    dt = capture_date(path)
    # photos with a date come first, in date order; the rest follow by filename
    return (0, dt, path.name.lower()) if dt else (1, datetime.max, path.name.lower())


def human(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024  # type: ignore[assignment]
    return f"{n:.1f} TB"


def process_year(year: int, max_edge: int, quality: int) -> tuple[int, int, int]:
    src_dir = RAW / f"year{year}"
    dst_dir = OUT / f"year{year}"
    dst_dir.mkdir(parents=True, exist_ok=True)

    if not src_dir.exists():
        print(f"year{year}: {src_dir.relative_to(ROOT)} not found, skipping")
        return 0, 0, 0

    files = sorted((p for p in src_dir.iterdir() if p.suffix.lower() in EXTS), key=sort_key)
    if not files:
        print(f"year{year}: no images in {src_dir.relative_to(ROOT)}")
        return 0, 0, 0

    for old in dst_dir.glob("*.webp"):
        old.unlink()

    total_in = total_out = 0
    print(f"\nyear{year}: {len(files)} photo(s)")
    for i, src in enumerate(files, start=1):
        dst = dst_dir / f"{i:02d}.webp"
        with Image.open(src) as im:
            im = ImageOps.exif_transpose(im)
            if im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
            im.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)
            im.save(dst, "WEBP", quality=quality, method=6)
            w, h = im.size
        size_in, size_out = src.stat().st_size, dst.stat().st_size
        total_in += size_in
        total_out += size_out
        dt = capture_date(src)
        when = dt.strftime("%Y-%m-%d") if dt else "no date"
        print(f"  {dst.name}  {w}x{h}  {human(size_in):>9} -> {human(size_out):>8}   {src.name} ({when})")

    if len(files) != 10:
        print(f"  note: memories.json expects 10 photos for year{year}, found {len(files)}")
    return len(files), total_in, total_out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--year", type=int, choices=range(1, 6), help="only process this year (1 to 5)")
    ap.add_argument("--max", type=int, default=1600, help="max long edge in px (default 1600)")
    ap.add_argument("--quality", type=int, default=80, help="WebP quality (default 80)")
    args = ap.parse_args()

    years = [args.year] if args.year else [1, 2, 3, 4, 5]
    count = total_in = total_out = 0
    for y in years:
        c, i, o = process_year(y, args.max, args.quality)
        count += c
        total_in += i
        total_out += o

    print("\nSummary")
    print(f"  photos:   {count}")
    if count:
        saved = 100 - (total_out / total_in * 100) if total_in else 0
        print(f"  original: {human(total_in)}")
        print(f"  webp:     {human(total_out)}  ({saved:.0f}% smaller)")
        print(f"  average:  {human(total_out // count)} per photo")


if __name__ == "__main__":
    main()
