# data/

Dieser Ordner enthält die zwischengespeicherte CSV-Datei für die Termine.

## Quelle

Die Termine werden in Google Sheets gepflegt:

```text
https://docs.google.com/spreadsheets/d/14qnUPCQeRqDsPerpj-848IgoBDI53lwBVmT45awWFUw/edit
```

`python_scripts/download_termine_csv.py` lädt daraus eine CSV-Datei und speichert sie als:

```text
data/termine.csv
```

Die Tabelle muss für „Jeder mit dem Link“ lesbar sein, damit GitHub Actions sie ohne Google-Anmeldung herunterladen kann.

## Lokale Synchronisierung

```bash
python3 python_scripts/download_termine_csv.py
python3 python_scripts/sync_termine_from_csv.py --file data/termine.csv
python3 python_scripts/build_termine.py
```

## Wichtige Spalten

| Spalte | Pflicht | Beschreibung |
|--------|---------|--------------|
| `Öffentlich` | ✅ | `Ja` = wird veröffentlicht |
| `Start Time` | ✅* | z.B. `Mo. 22.09.25 20:00`; Datum und Uhrzeit werden daraus übernommen |
| `Datum` | ✅* | z.B. `28.06.2026`; Alternative zu `Start Time` |
| `Uhrzeit` | – | z.B. `20:00`; optional, wenn nicht schon in `Start Time` enthalten |
| `Titel` | ✅* | Anzeigename |
| `Title` | ✅* | Fallback für `Titel` |
| `Veranstaltung` | ✅* | Fallback, wenn `Titel`/`Title` leer sind |
| `Location` | – | Veranstaltungsort |
| `Ort` | – | Alternative zu `Location` |
| `Beschreibung` | – | Öffentlicher Text |
| `Description` | – | Fallback für `Beschreibung` |
| `Kategorie` | – | `konzerte`, `kirchliches`, `feste`, `sonstiges` |

✅* Einer der Titel-Felder muss ausgefüllt sein. Außerdem muss entweder `Start Time` oder `Datum` vorhanden sein.
