#!/usr/bin/env python3
# coding: utf-8
"""
build_konzerte.py – Konzert-Index-Builder

Scannt den Konzerte/-Ordner und erstellt Konzerte/index.json.
Ordnerstruktur:
    Konzerte/
      2025_Adventskonzert/
        meta.json        ← Pflichtfelder: titel, datum
        titelbild.jpg    ← optional
      ...

meta.json Felder:
    {
      "titel":       "Adventskonzert 2024",
      "datum":       "2025",     ← nur Jahr
      "beschreibung":"Kurzer Teasertext für die Übersicht",
      "inhalt":      "Voller Artikeltext (HTML erlaubt) für die Detailseite",
      "titelbild":   "titelbild.jpg"
    }

Verwendung:
    python3 python_scripts/build_konzerte.py
"""

import json, re
from pathlib import Path

KONZERTE_DIR = Path(__file__).parent.parent / 'Konzerte'
OUTPUT_FILE  = KONZERTE_DIR / 'index.json'
FOLDER_REGEX = re.compile(r'^\d{4}_')

KONZERTE_DIR.mkdir(parents=True, exist_ok=True)

entries = []
print(f"\n📂 {KONZERTE_DIR}")
print("─" * 55)

for folder in sorted(KONZERTE_DIR.iterdir(), reverse=True):
    if not folder.is_dir() or not FOLDER_REGEX.match(folder.name):
        continue

    meta_path = folder / 'meta.json'
    if not meta_path.exists():
        print(f"  ⚠  {folder.name}: meta.json fehlt – übersprungen")
        continue

    try:
        raw = meta_path.read_text(encoding='utf-8')
        # Trailing commas entfernen (häufiger Fehler)
        raw = re.sub(r',\s*([}\]])', r'\1', raw)
        meta = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"  ✗  {folder.name}: Ungültiges JSON – {e}")
        continue

    if 'titel' not in meta or 'datum' not in meta:
        print(f"  ⚠  {folder.name}: 'titel' oder 'datum' fehlt – übersprungen")
        continue

    entries.append({
        'ordner':      folder.name,
        'datum':       meta['datum'],
        'titel':       meta['titel'],
        'beschreibung':meta.get('beschreibung', ''),
        'titelbild':   meta.get('titelbild'),
    })
    print(f"  ✓  {folder.name}")

entries.sort(key=lambda e: e.get('datum') or e['ordner'], reverse=True)

with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(entries, f, ensure_ascii=False, indent=2)

print("─" * 55)
print(f"     {len(entries)} Konzerte  →  {OUTPUT_FILE}\n")