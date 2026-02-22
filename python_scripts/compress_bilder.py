#!/usr/bin/env python3
"""
Bilder komprimieren – einmaliges Script.
Alle JPG/PNG im aktuellen Ordner (und Unterordner) werden komprimiert.

Verwendung:
    pip install Pillow
    python compress.py
"""

from PIL import Image
from pathlib import Path
import os

MAX_WIDTH = 1920
QUALITY   = 82

folder = Path(".")
images = list(folder.rglob("*.jpg")) + list(folder.rglob("*.jpeg")) + list(folder.rglob("*.JPG")) + list(folder.rglob("*.png"))

print(f"{len(images)} Bilder gefunden\n")

for path in images:
    original_kb = path.stat().st_size // 1024
    img = Image.open(path)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    if img.width > MAX_WIDTH:
        ratio = MAX_WIDTH / img.width
        img = img.resize((MAX_WIDTH, int(img.height * ratio)), Image.LANCZOS)
    img.save(path, "JPEG", quality=QUALITY, optimize=True)
    new_kb = path.stat().st_size // 1024
    print(f"  ✓ {path.name}  {original_kb} KB → {new_kb} KB")

print("\nFertig!")