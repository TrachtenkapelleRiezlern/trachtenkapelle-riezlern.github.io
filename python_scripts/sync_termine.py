#!/usr/bin/env python3
# coding: utf-8
"""
sync_termine.py
───────────────
Synchronisiert Termine aus Google Sheets in die statischen Website-Dateien.

Ohne Argumente startet das Skript interaktiv und erklärt die einzelnen Schritte.
Für GitHub Actions oder andere Automatisierungen bitte explizite Flags setzen.

Beispiele:
    python3 python_scripts/sync_termine.py
    python3 python_scripts/sync_termine.py --download --sync
    python3 python_scripts/sync_termine.py --sync --file data/termine.csv
    python3 python_scripts/sync_termine.py --download --sync --dry-run --verbose
"""

import argparse
import csv
import json
import re
import shutil
import sys
import tempfile
import unicodedata
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
SHEET_ID = "14qnUPCQeRqDsPerpj-848IgoBDI53lwBVmT45awWFUw"
DEFAULT_GID = "0"
DEFAULT_CSV = ROOT / "data" / "termine.csv"
TERMINE_DIR = ROOT / "Termine"
OUTPUT_FILE = TERMINE_DIR / "index.json"
FOLDER_RE = re.compile(r"^\d{4}_\d{2}_\d{2}_")

KATEGORIE_MAP = {
    "konzert": "konzert",
    "konzerte": "konzert",
    "kirchlich": "kirchliches",
    "kirchliches": "kirchliches",
    "messe": "kirchliches",
    "gottesdienst": "kirchliches",
    "prozession": "kirchliches",
    "prozessionen": "kirchliches",
    "fest": "fest",
    "feste": "fest",
    "festakt": "fest",
    "sonstiges": "sonstiges",
    "sonstige": "sonstiges",
}


@dataclass
class SyncResult:
    imported: int
    skipped: int
    errors: int
    obsolete_folders: list[Path]
    changed: bool
    termine: list[dict]


def export_url(sheet_id=SHEET_ID, gid=DEFAULT_GID):
    return f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"


def read_text_if_exists(path):
    return path.read_text(encoding="utf-8") if path.exists() else None


def write_if_changed(path, text, dry_run=False):
    old = read_text_if_exists(path)
    changed = old != text
    if changed and not dry_run:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
    return changed


def download_csv(url, verbose=False):
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Trachtenkapelle-Riezlern-Website/1.0"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        content_type = response.headers.get("Content-Type", "")
        data = response.read()

    text = data.decode("utf-8-sig")
    if "<html" in text[:500].lower():
        raise RuntimeError(
            "Google hat HTML statt CSV geliefert. Ist die Tabelle öffentlich bzw. per Link lesbar?"
        )

    public_check = text.lower()
    if "öffentlich" not in public_check and "oeffentlich" not in public_check:
        raise RuntimeError(
            "CSV wurde geladen, aber die Spalte 'Öffentlich' wurde nicht gefunden. "
            "Vermutlich ist die falsche Tabellenblatt-GID ausgewählt."
        )

    if verbose and "text/csv" not in content_type and "application/octet-stream" not in content_type:
        print(f"⚠ Unerwarteter Content-Type: {content_type}", file=sys.stderr)
    return text


def download_to_file(url, output, dry_run=False, verbose=False):
    if verbose:
        print("Lade Termine-CSV von Google Sheets …")
        print(f"Quelle: {url}")
    csv_text = download_csv(url, verbose=verbose)
    changed = write_if_changed(output, csv_text, dry_run=dry_run)
    rows = max(0, len(csv_text.splitlines()) - 1)
    status = "würde aktualisiert" if dry_run and changed else "aktualisiert" if changed else "unverändert"
    print(f"CSV: {rows} Zeile(n), {status} → {output}")
    return changed


def slugify(text):
    text = unicodedata.normalize("NFKD", str(text)).encode("ascii", "ignore").decode()
    text = re.sub(r"[^\w\s-]", "", text).strip()
    return re.sub(r"[\s_-]+", "_", text)[:40].rstrip("_")


def parse_datetime(raw):
    raw = raw.strip()
    raw = re.sub(r"^[A-Za-zÄÖÜäöü]{2,3}\.\s+", "", raw)
    for fmt in (
        "%d.%m.%Y %H:%M",
        "%d.%m.%y %H:%M",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M",
        "%d.%m.%Y",
        "%Y-%m-%d",
        "%d.%m.%y",
    ):
        try:
            dt = datetime.strptime(raw, fmt)
            return dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M") if "%H" in fmt else None
        except ValueError:
            pass
    return None, None


def is_oeffentlich(val):
    return val.strip().lower() in ("ja", "yes", "true", "1", "x")


def normalize_kategorie(raw):
    return KATEGORIE_MAP.get(raw.strip().lower(), "sonstiges")


def read_csv_rows(csv_path):
    with open(csv_path, encoding="utf-8-sig", newline="") as f:
        sample = f.read(4096)
        f.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=";,")
        except csv.Error:
            dialect = csv.excel
            dialect.delimiter = ";"
        rows = []
        for row in csv.DictReader(f, dialect=dialect):
            rows.append({(k or "").lower().strip(): (v or "").strip() for k, v in row.items()})
    return rows


def parse_termine_from_csv(csv_path, verbose=False):
    rows = read_csv_rows(csv_path)
    if verbose:
        print(f"CSV-Datei: {csv_path}")
        print(f"Zeilen: {len(rows)}")
        print()

    imported = skipped = errors = 0
    termine = []

    for i, row in enumerate(rows, start=2):
        if not is_oeffentlich(row.get("öffentlich", row.get("oeffentlich", ""))):
            skipped += 1
            continue

        datum_raw = row.get("datum", "") or row.get("start time", "") or row.get("start", "")
        datum, parsed_uhrzeit = parse_datetime(datum_raw)
        if not datum:
            print(f"  Zeile {i}: Ungültiges Datum '{datum_raw}' – übersprungen")
            errors += 1
            continue

        titel = (
            row.get("titel", "")
            or row.get("veranstaltung", "")
            or row.get("title", "")
        ).strip()
        if not titel:
            print(f"  Zeile {i}: Kein Titel – übersprungen")
            errors += 1
            continue

        uhrzeit = row.get("uhrzeit", "").strip() or parsed_uhrzeit
        ort = (row.get("ort", "") or row.get("location", "")).strip() or None
        beschreibung = (row.get("beschreibung", "") or row.get("description", "")).strip() or None
        kat_raw = row.get("kategorie", "").strip()
        kategorie = normalize_kategorie(kat_raw) if kat_raw else "sonstiges"

        termin_id = f"{datum.replace('-', '_')}_{slugify(titel)}"
        meta = {"id": termin_id, "titel": titel, "datum": datum, "kategorie": kategorie}
        if uhrzeit:
            meta["uhrzeit"] = uhrzeit
        if ort:
            meta["ort"] = ort
        if beschreibung:
            meta["beschreibung"] = beschreibung
        termine.append(meta)

        if verbose:
            ort_str = f" @ {ort}" if ort else ""
            uhr_str = f" {uhrzeit}" if uhrzeit else ""
            print(f"  ✓  {datum}{uhr_str}{ort_str}  {titel}  [{kategorie}]")
        imported += 1

    termine.sort(key=lambda t: (t["datum"], t.get("uhrzeit", ""), t["titel"]))
    return termine, imported, skipped, errors


def obsolete_termin_folders():
    if not TERMINE_DIR.exists():
        return []
    return [
        folder for folder in sorted(TERMINE_DIR.iterdir())
        if folder.is_dir() and FOLDER_RE.match(folder.name)
    ]


def sync_index_from_csv(csv_path, dry_run=False, verbose=False):
    csv_path = Path(csv_path)
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV nicht gefunden: {csv_path}")

    TERMINE_DIR.mkdir(parents=True, exist_ok=True)
    termine, imported, skipped, errors = parse_termine_from_csv(csv_path, verbose=verbose)
    json_text = json.dumps(termine, ensure_ascii=False, indent=2) + "\n"
    changed = write_if_changed(OUTPUT_FILE, json_text, dry_run=dry_run)

    obsolete = obsolete_termin_folders()
    for folder in obsolete:
        if verbose or dry_run:
            action = "würde gelöscht" if dry_run else "wird gelöscht"
            print(f"  ✗  {folder.name} ← nicht mehr benötigt, {action}")
        if not dry_run:
            shutil.rmtree(folder)

    print()
    print("─" * 50)
    print(f"  {imported:3d}  importiert → {OUTPUT_FILE}")
    print(f"  {len(obsolete):3d}  alte Termin-Ordner {'würden gelöscht' if dry_run else 'gelöscht'}")
    print(f"  {skipped:3d}  übersprungen (Öffentlich ≠ Ja)")
    print(f"  {errors:3d}  Fehler")
    print(f"  Index: {'würde aktualisiert' if dry_run and changed else 'aktualisiert' if changed else 'unverändert'}")
    if dry_run:
        print("\n  DRY RUN – keine Dateien wurden geändert.")

    return SyncResult(imported, skipped, errors, obsolete, changed, termine)


def ask_yes_no(question, default=True):
    suffix = "J/n" if default else "j/N"
    answer = input(f"{question} [{suffix}] ").strip().lower()
    if not answer:
        return default
    return answer in ("j", "ja", "y", "yes")


def interactive(args):
    print("Termine synchronisieren")
    print("──────────────────────")
    print("Dieses Skript kann:")
    print("  1. die aktuelle Google-Sheets-Tabelle nach data/termine.csv laden,")
    print("  2. daraus Termine/index.json für die Website erzeugen,")
    print("  3. alte generierte Termin-Ordner entfernen.")
    print()
    print(f"Google Sheet: {export_url(args.sheet_id, args.gid)}")
    print(f"CSV-Cache:    {args.file}")
    print(f"Website-JSON: {OUTPUT_FILE}")
    print()

    verbose = ask_yes_no("Ausführliche Ausgabe anzeigen?", default=False)
    dry_run = ask_yes_no("Nur testen, ohne Dateien zu ändern?", default=False)

    downloaded_path = Path(args.file)
    if ask_yes_no("Aktuelle CSV aus Google Sheets herunterladen?", default=True):
        try:
            if dry_run:
                with tempfile.NamedTemporaryFile("w+", encoding="utf-8", suffix=".csv", delete=False) as tmp:
                    tmp_path = Path(tmp.name)
                download_to_file(export_url(args.sheet_id, args.gid), tmp_path, dry_run=False, verbose=verbose)
                old = read_text_if_exists(Path(args.file))
                new = tmp_path.read_text(encoding="utf-8")
                print("Vergleich mit data/termine.csv:", "geändert" if old != new else "unverändert")
                downloaded_path = tmp_path
            else:
                download_to_file(export_url(args.sheet_id, args.gid), Path(args.file), dry_run=False, verbose=verbose)
        except Exception as exc:
            print(f"Fehler beim Herunterladen: {exc}", file=sys.stderr)
            if not ask_yes_no("Trotzdem mit der vorhandenen lokalen CSV weiterarbeiten?", default=True):
                return 1

    if ask_yes_no("Termine/index.json aus der CSV aktualisieren?", default=True):
        try:
            sync_index_from_csv(downloaded_path, dry_run=dry_run, verbose=verbose)
        except Exception as exc:
            print(f"Fehler beim Synchronisieren: {exc}", file=sys.stderr)
            return 1

    print("\nFertig.")
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--download", action="store_true", help="Google Sheets CSV nach data/termine.csv laden")
    parser.add_argument("--sync", action="store_true", help="Termine/index.json aus CSV erzeugen")
    parser.add_argument("--all", action="store_true", help="Kurzform für --download --sync")
    parser.add_argument("--dry-run", "-n", action="store_true", help="Keine Dateien schreiben oder löschen")
    parser.add_argument("--verbose", "-v", action="store_true", help="Ausführlichere Ausgabe")
    parser.add_argument("--file", "-f", default=str(DEFAULT_CSV), help="CSV-Datei; Standard: data/termine.csv")
    parser.add_argument("--sheet-id", default=SHEET_ID)
    parser.add_argument("--gid", default=DEFAULT_GID, help="Tabellenblatt-GID; Standard: 0")
    args = parser.parse_args(argv)

    if len(sys.argv) == 1:
        return interactive(args)

    do_download = args.download or args.all
    do_sync = args.sync or args.all
    if not do_download and not do_sync:
        parser.error("Bitte --download, --sync oder --all angeben. Ohne Argumente startet der interaktive Modus.")

    try:
        if do_download:
            download_to_file(
                export_url(args.sheet_id, args.gid),
                Path(args.file),
                dry_run=args.dry_run,
                verbose=args.verbose,
            )
        if do_sync:
            sync_index_from_csv(Path(args.file), dry_run=args.dry_run, verbose=args.verbose)
    except urllib.error.HTTPError as exc:
        print(f"HTTP-Fehler beim Laden der Tabelle: {exc.code} {exc.reason}", file=sys.stderr)
        return 1
    except urllib.error.URLError as exc:
        print(f"Netzwerkfehler beim Laden der Tabelle: {exc.reason}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"Fehler: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
