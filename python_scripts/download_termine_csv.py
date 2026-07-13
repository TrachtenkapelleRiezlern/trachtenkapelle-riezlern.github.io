#!/usr/bin/env python3
# coding: utf-8
"""
download_termine_csv.py
───────────────────────
Lädt die öffentliche Google-Sheets-CSV der Termine herunter und speichert sie als
data/termine.csv.

Voraussetzung:
    Die Tabelle muss für "Jeder mit dem Link" lesbar sein oder veröffentlicht
    sein. Private Tabellen funktionieren in GitHub Actions nur mit zusätzlicher
    Google-Authentifizierung.

Verwendung:
    python3 python_scripts/download_termine_csv.py
    python3 python_scripts/download_termine_csv.py --gid 0
    python3 python_scripts/download_termine_csv.py --url "https://..."
"""

import argparse
import sys
import urllib.error
import urllib.request
from pathlib import Path

SHEET_ID = "14qnUPCQeRqDsPerpj-848IgoBDI53lwBVmT45awWFUw"
DEFAULT_GID = "0"
DEFAULT_OUTPUT = Path(__file__).parent.parent / "data" / "termine.csv"


def export_url(sheet_id=SHEET_ID, gid=DEFAULT_GID):
    return f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"


def download(url):
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Trachtenkapelle-Riezlern-Website/1.0",
        },
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
    if "text/csv" not in content_type and "application/octet-stream" not in content_type:
        print(f"⚠ Unerwarteter Content-Type: {content_type}", file=sys.stderr)
    return text


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", help="Vollständige CSV-Export-URL")
    parser.add_argument("--sheet-id", default=SHEET_ID)
    parser.add_argument("--gid", default=DEFAULT_GID, help="Tabellenblatt-GID; Standard: 0")
    parser.add_argument("--out", default=str(DEFAULT_OUTPUT), help="Zieldatei; Standard: data/termine.csv")
    args = parser.parse_args()

    url = args.url or export_url(args.sheet_id, args.gid)
    output = Path(args.out)

    print(f"Lade Termine-CSV von Google Sheets …")
    print(f"Quelle: {url}")

    try:
        csv_text = download(url)
    except urllib.error.HTTPError as exc:
        print(f"HTTP-Fehler beim Laden der Tabelle: {exc.code} {exc.reason}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as exc:
        print(f"Netzwerkfehler beim Laden der Tabelle: {exc.reason}", file=sys.stderr)
        sys.exit(1)
    except Exception as exc:
        print(f"Fehler beim Laden der Tabelle: {exc}", file=sys.stderr)
        sys.exit(1)

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(csv_text, encoding="utf-8")

    rows = max(0, len(csv_text.splitlines()) - 1)
    print(f"✅ {rows} Zeile(n) → {output}")


if __name__ == "__main__":
    main()
