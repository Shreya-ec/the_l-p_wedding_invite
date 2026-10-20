#!/usr/bin/env python3
"""Crop the printed card, isolate the couple, and make the LP logo transparent."""

from pathlib import Path

from PIL import Image, ImageFilter, ImageOps
from rembg import remove

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "images"
OUT = SRC


def crop_card(src: Path, dest: Path) -> None:
    img = Image.open(src).convert("RGB")
    w, h = img.size
    # The card sits in the middle of a patterned tablecloth; crop to the paper.
    left = int(w * 0.105)
    top = int(h * 0.222)
    right = int(w * 0.895)
    bottom = int(h * 0.722)
    card = img.crop((left, top, right, bottom))
    card = ImageOps.autocontrast(card, cutoff=1)
    card.save(dest, quality=92)
    print(f"card cover {card.size} -> {dest}")


def isolate_couple(src: Path, dest: Path) -> None:
    img = Image.open(src).convert("RGBA")
    cut = remove(img)
    # Trim empty margins, then keep a little breathing room.
    bbox = cut.getbbox()
    if bbox:
        cut = cut.crop(bbox)
    # Soften the matte edge slightly.
    alpha = cut.split()[-1].filter(ImageFilter.GaussianBlur(radius=0.6))
    cut.putalpha(alpha)
    cut.save(dest)
    print(f"couple cutout {cut.size} -> {dest}")


def logo_to_png(src: Path, dest: Path) -> None:
    img = Image.open(src).convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # Knock out near-white paper so multiply/blend is unnecessary.
            luma = 0.299 * r + 0.587 * g + 0.114 * b
            if luma > 245:
                pixels[x, y] = (r, g, b, 0)
            elif luma > 220:
                fade = int(max(0, (245 - luma) / 25 * 255))
                pixels[x, y] = (r, g, b, fade)
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    img.save(dest)
    print(f"logo {img.size} -> {dest}")


def main() -> None:
    crop_card(SRC / "card-source.jpg", OUT / "card-cover.jpg")
    isolate_couple(SRC / "couple-source.jpg", OUT / "couple.png")
    logo_to_png(SRC / "lp-logo-source.jpg", OUT / "lp-logo.png")


if __name__ == "__main__":
    main()
