# data/

Dieser Ordner enthält die Excel-Datei mit den Terminen.

## termine.xlsx

Exportiere die Google-Tabelle als Excel-Datei und lege sie hier ab:

```
data/termine.xlsx
```

Die Datei wird von `sync_termine_from_xlsx.py` gelesen und in
`Termine/*/meta.json`-Dateien umgewandelt.

### Spalten (Zeile 1 der Excel-Datei)

| Spalte | Pflicht | Beschreibung |
|--------|---------|--------------|
| `Öffentlich` | ✅ | `Ja` = wird veröffentlicht |
| `Start Time` | ✅ | Datum + Uhrzeit des Termins |
| `Title` | ✅* | Anzeigename (oder `Veranstaltung`) |
| `Veranstaltung` | ✅* | Fallback wenn `Title` leer |
| `Location` | – | Veranstaltungsort |
| `Beschreibung` | – | Öffentlicher Text |
| `Eintritt` | – | z.B. `frei` oder `8 Euro` |
| `Kategorie` | – | `Konzert`, `Prozession`, `Fest`, `Auswärts` |
| `End Time` | – | Endzeit |
| `Description` | – | Interne Notizen (Fallback für Beschreibung) |
| `Orchester` | – | Bei mehreren Orchestern |
| `Id` | – | Google Calendar ID |

### Workflow

1. Tabelle in Google Sheets aktualisieren
2. **Datei → Herunterladen → Microsoft Excel (.xlsx)**
3. Datei nach `data/termine.xlsx` legen (alte überschreiben)
4. Git commit + push → GitHub Action läuft automatisch

Alternativ: Action manuell starten unter
**GitHub → Actions → Termine & Aktuelles synchronisieren → Run workflow**
