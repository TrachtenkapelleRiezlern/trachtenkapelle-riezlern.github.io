#!/usr/bin/env python3
# coding: utf-8
"""
build_alben.py – Album-Builder für die Trachtenkapelle Riezlern Website

Führe dieses Script aus nachdem du neue Bilder in einen Album-Ordner gelegt hast:
    python3 python_scripts/build_alben.py

Das Script:
  1. Erkennt automatisch alle Ordner unter images/gallery/alben/
  2. Liest Titel/Datum aus bestehender index.json (falls vorhanden), sonst Ordnername
  3. Schreibt images/gallery/alben/ALBUM/index.json mit Bildliste
  4. Schreibt images/gallery/alben/index.json (globale Übersicht für bilder.html)
"""

import os, json
from pathlib import Path

BASE       = Path(__file__).parent.parent / 'images' / 'gallery' / 'alben'
IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp'}
SKIP_FILES = {'titel.jpg', 'titel.jpeg', 'titel.png', 'index.json'}

if not BASE.is_dir():
    print(f"⚠️  Ordner '{BASE}' nicht gefunden – wird erstellt.")
    BASE.mkdir(parents=True, exist_ok=True)

alben = sorted([d for d in BASE.iterdir() if d.is_dir()])

if not alben:
    print("Keine Album-Ordner gefunden.")
    exit(0)

total_bilder = 0
global_index = []

print(f"\n📂 {BASE}")
print("─" * 60)

for album_path in alben:
    album_id   = album_path.name
    index_path = album_path / 'index.json'

    # Bestehende Metadaten lesen
    existing = {}
    if index_path.exists():
        try:
            with open(index_path, encoding='utf-8') as f:
                existing = json.load(f)
        except Exception:
            pass

    titel = existing.get('titel') or album_id.replace('_', ' ').replace('-', ' ').title()
    datum = existing.get('datum', '')
    jahr  = datum[:4] if datum else ''

    bilder = sorted([
        f.name for f in album_path.iterdir()
        if f.suffix.lower() in IMAGE_EXTS and f.name.lower() not in SKIP_FILES
    ])

    # Einzel-index.json
    index_data = {'titel': titel, 'datum': datum, 'bilder': bilder}
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    # Globale Übersicht
    global_index.append({
        'id':     album_id,
        'titel':  titel,
        'datum':  datum,
        'jahr':   jahr,
        'anzahl': len(bilder),
    })

    total_bilder += len(bilder)
    icon = '✓' if bilder else '○'
    print(f"  {icon}  {album_id:<40} {len(bilder):>4} Bilder")

# Neueste zuerst (nach Datum, dann Ordnername)
global_index.sort(key=lambda a: a['datum'] or a['id'], reverse=True)

with open(BASE / 'index.json', 'w', encoding='utf-8') as f:
    json.dump(global_index, f, ensure_ascii=False, indent=2)

print("─" * 60)
print(f"     {len(alben)} Alben  ·  {total_bilder} Bilder gesamt")
print(f"  ✓  {BASE / 'index.json'} (globale Übersicht)")