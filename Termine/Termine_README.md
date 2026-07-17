# Termine/

Dieser Ordner enthält die generierte Datei für die Termine auf der Website.

```text
Termine/index.json
```

Die Datei wird aus `data/termine.csv` erzeugt. `data/termine.csv` wird wiederum aus Google Sheets heruntergeladen.

## Datenfluss

```text
Google Sheets
  → data/termine.csv
  → Termine/index.json
  → Website
```

## Lokal synchronisieren

```bash
python3 python_scripts/sync_termine.py
```

Ohne Argumente startet das Skript interaktiv. GitHub Actions nutzt den nicht-interaktiven Modus:

```bash
python3 python_scripts/sync_termine.py --all --verbose
```

## Termin bearbeiten

Termine werden nicht mehr als einzelne Ordner gepflegt. Änderungen passieren in Google Sheets. Nur Zeilen mit `Öffentlich = Ja` erscheinen auf der Website.
