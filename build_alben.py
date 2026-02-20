#!/usr/bin/env python3
# coding: utf-8
"""
build_alben.py – Album-Builder für die Trachtenkapelle Riezlern Website

Führe dieses Script aus nachdem du neue Bilder in einen Album-Ordner gelegt hast:
    python3 build_alben.py

Das Script:
  1. Erkennt automatisch alle Ordner unter images/gallery/alben/
  2. Zählt alle Bilddateien (jpg, jpeg, png, webp) pro Album
  3. Liest Titel/Datum aus einer vorhandenen index.json (falls vorhanden)
     – sonst wird der Ordnername als Titel verwendet
  4. Schreibt images/gallery/alben/ALBUM/index.json mit der Bildliste

Wird auch automatisch vom GitHub Actions Workflow ausgeführt.
"""

import os, json

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images', 'gallery', 'alben')
IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp'}
SKIP_FILES  = {'titel.jpg', 'titel.jpeg', 'titel.png', 'index.json'}

if not os.path.isdir(BASE):
    print(f"⚠️  Ordner '{BASE}' nicht gefunden – wird erstellt.")
    os.makedirs(BASE, exist_ok=True)

alben = sorted([
    d for d in os.listdir(BASE)
    if os.path.isdir(os.path.join(BASE, d))
])

if not alben:
    print("Keine Album-Ordner gefunden.")
    exit(0)

total_bilder = 0
print(f"\n📂 {BASE}")
print("─" * 60)

for album_id in alben:
    album_path = os.path.join(BASE, album_id)
    index_path = os.path.join(album_path, 'index.json')

    # Bestehende Metadaten lesen (Titel, Datum) – falls vorhanden
    existing = {}
    if os.path.exists(index_path):
        try:
            with open(index_path, encoding='utf-8') as f:
                existing = json.load(f)
        except Exception:
            pass

    # Titel: aus bestehender JSON oder aus Ordnername ableiten
    titel = existing.get('titel') or album_id.replace('_', ' ').replace('-', ' ').title()
    datum = existing.get('datum', '')

    # Alle Bilder im Ordner einlesen (alphabetisch, ohne titel.* und index.json)
    bilder = sorted([
        f for f in os.listdir(album_path)
        if os.path.splitext(f)[1].lower() in IMAGE_EXTS
        and f.lower() not in SKIP_FILES
    ])

    index_data = {
        'titel':  titel,
        'datum':  datum,
        'bilder': bilder,
    }

    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    total_bilder += len(bilder)
    icon = '✓' if bilder else '○'
    print(f"  {icon}  {album_id:<40} {len(bilder):>4} Bilder")

print("─" * 60)
print(f"     {len(alben)} Alben  ·  {total_bilder} Bilder gesamt\n")