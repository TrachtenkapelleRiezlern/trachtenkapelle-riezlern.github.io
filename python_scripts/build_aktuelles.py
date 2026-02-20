#!/usr/bin/env python3
"""
build_aktuelles.py
──────────────────
Scannt den Aktuelles/-Ordner und erstellt Aktuelles/index.json.
Muss nach jeder Änderung an den Beitrags-Ordnern ausgeführt werden.

Verwendung:
    python3 build_aktuelles.py
"""

import os
import json
import re
from pathlib import Path

AKTUELLES_DIR = Path(__file__).parent.parent / "Aktuelles"
OUTPUT_FILE   = AKTUELLES_DIR / "index.json"
FOLDER_REGEX  = re.compile(r"^\d{4}_\d{2}_\d{2}_")


def build_index():
    entries = []

    for folder in sorted(AKTUELLES_DIR.iterdir(), reverse=True):  # neueste zuerst
        if not folder.is_dir():
            continue
        if not FOLDER_REGEX.match(folder.name):
            continue

        meta_path = folder / "meta.json"
        if not meta_path.exists():
            print(f"  ⚠  {folder.name}: meta.json fehlt – übersprungen")
            continue

        try:
            with open(meta_path, encoding="utf-8") as f:
                meta = json.load(f)
        except json.JSONDecodeError as e:
            print(f"  ✗  {folder.name}: Ungültiges JSON – {e}")
            continue

        if "titel" not in meta or "datum" not in meta:
            print(f"  ⚠  {folder.name}: 'titel' oder 'datum' fehlt – übersprungen")
            continue

        entries.append({
            "ordner":    folder.name,
            "datum":     meta["datum"],
            "titel":     meta["titel"],
            "kategorie": meta.get("kategorie", "allgemein"),
            "titelbild": meta.get("titelbild"),
            "featured":  meta.get("featured", False),
        })
        print(f"  ✓  {folder.name}")

    # Neueste zuerst
    entries.sort(key=lambda e: e["datum"], reverse=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

    print(f"\n✅  {len(entries)} Beitrag/Beiträge → {OUTPUT_FILE}")
    return entries


if __name__ == "__main__":
    print("Scanne Aktuelles/ …\n")
    build_index()