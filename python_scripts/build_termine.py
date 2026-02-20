#!/usr/bin/env python3
"""
build_termine.py
─────────────────
Scannt den Termine/-Ordner und erstellt Termine/index.json.
Muss nach jeder Änderung an den Termin-Ordnern ausgeführt werden.

Verwendung:
    python3 build_termine.py

Ergebnis:
    Termine/index.json  ←  Liste aller gültigen Termin-Ordner, sortiert nach Datum
"""

import os
import json
import re
from pathlib import Path

TERMINE_DIR  = Path(__file__).parent / "Termine"
OUTPUT_FILE  = TERMINE_DIR / "index.json"
FOLDER_REGEX = re.compile(r"^\d{4}_\d{2}_\d{2}_")   # muss mit JJJJ_MM_TT_ beginnen


def build_index():
    entries = []

    for folder in sorted(TERMINE_DIR.iterdir()):
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
            "ordner":  folder.name,
            "datum":   meta["datum"],
            "titel":   meta["titel"],
        })
        print(f"  ✓  {folder.name}")

    # Sort by date ascending
    entries.sort(key=lambda e: e["datum"])

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

    print(f"\n✅  {len(entries)} Termin(e) → {OUTPUT_FILE}")
    return entries


if __name__ == "__main__":
    print("Scanne Termine/ …\n")
    build_index()