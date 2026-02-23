#!/usr/bin/env python3
# coding: utf-8
"""
sync_termine_from_csv.py
─────────────────────────
Liest Termine aus data/termine.csv und generiert Termin-Ordner mit meta.json.

Die CSV kann direkt in GitHub online bearbeitet werden.

Spalten (erste Zeile = Header):
    Datum        28.06.2026 oder 2026-06-28       Pflicht
    Uhrzeit      20:00                             optional
    Titel        Geburtstagsfest                   Pflicht
    Kategorie    feste                             Pflicht
    Ort          Riezlern                          optional
    Beschreibung Freitext                          optional
    Öffentlich   Ja                                Pflicht

Nur Zeilen mit "Ja" in "Öffentlich" erscheinen auf der Website.

Erlaubte Kategorien: konzerte · kirchliches · feste · sonstiges

Verwendung:
    python3 python_scripts/sync_termine_from_csv.py
    python3 python_scripts/sync_termine_from_csv.py --file data/termine.csv
    python3 python_scripts/sync_termine_from_csv.py --dry-run
"""

import csv, json, re, unicodedata, argparse, shutil, sys
from pathlib import Path
from datetime import datetime

DEFAULT_CSV  = Path(__file__).parent.parent / 'data' / 'termine.csv'
TERMINE_DIR  = Path(__file__).parent.parent / 'Termine'
FOLDER_RE    = re.compile(r'^\d{4}_\d{2}_\d{2}_')

KATEGORIE_MAP = {
    'konzert':      'konzerte', 'konzerte':     'konzerte',
    'kirchlich':    'kirchliches', 'kirchliches': 'kirchliches',
    'messe':        'kirchliches', 'gottesdienst': 'kirchliches',
    'prozession':   'kirchliches', 'prozessionen': 'kirchliches',
    'fest':         'feste',    'feste':        'feste', 'festakt': 'feste',
    'sonstiges':    'sonstiges', 'sonstige':    'sonstiges',
}

def slugify(text):
    text = unicodedata.normalize('NFKD', str(text)).encode('ascii', 'ignore').decode()
    text = re.sub(r'[^\w\s-]', '', text).strip()
    return re.sub(r'[\s_-]+', '_', text)[:40].rstrip('_')

def parse_datum(raw):
    raw = raw.strip()
    for fmt in ('%d.%m.%Y', '%Y-%m-%d', '%d.%m.%y'):
        try:
            return datetime.strptime(raw, fmt).strftime('%Y-%m-%d')
        except ValueError:
            pass
    return None

def is_oeffentlich(val):
    return val.strip().lower() in ('ja', 'yes', 'true', '1', 'x')

def normalize_kategorie(raw):
    return KATEGORIE_MAP.get(raw.strip().lower(), 'sonstiges')

def sync(csv_path, dry_run=False):
    csv_path = Path(csv_path)
    if not csv_path.exists():
        print(f"CSV nicht gefunden: {csv_path}")
        sys.exit(1)

    print(f"CSV-Datei : {csv_path}")
    if dry_run:
        print("DRY RUN – keine Dateien werden geschrieben")
    print()

    TERMINE_DIR.mkdir(parents=True, exist_ok=True)

    with open(csv_path, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        # Normalize headers to lowercase
        rows = []
        for row in reader:
            rows.append({k.lower().strip(): v.strip() for k, v in row.items()})

    print(f"Zeilen: {len(rows)}")
    print()

    created = updated = skipped = errors = deleted = 0
    synced = set()

    for i, row in enumerate(rows, start=2):
        if not is_oeffentlich(row.get('öffentlich', row.get('oeffentlich', ''))):
            skipped += 1
            continue

        datum_raw = row.get('datum', '')
        datum = parse_datum(datum_raw)
        if not datum:
            print(f"  Zeile {i}: Ungültiges Datum '{datum_raw}' – übersprungen")
            errors += 1
            continue

        titel = row.get('titel', '').strip()
        if not titel:
            print(f"  Zeile {i}: Kein Titel – übersprungen")
            errors += 1
            continue

        uhrzeit     = row.get('uhrzeit', '').strip() or None
        ort         = row.get('ort', '').strip() or None
        beschreibung= row.get('beschreibung', '').strip() or None
        kat_raw     = row.get('kategorie', '').strip()
        kategorie   = normalize_kategorie(kat_raw) if kat_raw else 'sonstiges'

        ordner_name = f"{datum.replace('-', '_')}_{slugify(titel)}"
        ordner_path = TERMINE_DIR / ordner_name
        meta_path   = ordner_path / 'meta.json'
        synced.add(ordner_name)

        meta = {'titel': titel, 'datum': datum, 'kategorie': kategorie}
        if uhrzeit:      meta['uhrzeit']      = uhrzeit
        if ort:          meta['ort']          = ort
        if beschreibung: meta['beschreibung'] = beschreibung

        is_new = not ordner_path.exists()
        ort_str = f" @ {ort}" if ort else ""
        uhr_str = f" {uhrzeit}" if uhrzeit else ""
        print(f"  {'+'if is_new else '~'}  {datum}{uhr_str}{ort_str}  {titel}  [{kategorie}]")

        if not dry_run:
            ordner_path.mkdir(parents=True, exist_ok=True)
            meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding='utf-8')

        if is_new: created += 1
        else:      updated += 1

    # Veraltete Ordner löschen
    print()
    for folder in sorted(TERMINE_DIR.iterdir()):
        if not folder.is_dir() or not FOLDER_RE.match(folder.name):
            continue
        if folder.name not in synced:
            print(f"  ✗  {folder.name} ← nicht mehr in CSV, wird gelöscht")
            if not dry_run:
                shutil.rmtree(folder)
            deleted += 1

    print()
    print("─" * 50)
    print(f"  {created:3d}  neu erstellt")
    print(f"  {updated:3d}  aktualisiert")
    print(f"  {deleted:3d}  gelöscht")
    print(f"  {skipped:3d}  übersprungen (Öffentlich ≠ Ja)")
    print(f"  {errors:3d}  Fehler")
    if dry_run:
        print("\n  DRY RUN – keine Dateien wurden geändert.")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--file', '-f', default=str(DEFAULT_CSV))
    parser.add_argument('--dry-run', '-n', action='store_true')
    args = parser.parse_args()
    sync(args.file, args.dry_run)