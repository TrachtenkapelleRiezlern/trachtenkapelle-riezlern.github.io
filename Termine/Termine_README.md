# Termine – Ordnerstruktur

Jeder Termin hat einen eigenen Unterordner. Die Website liest diese Ordner automatisch
und zeigt die Termine auf der Homepage und der Termine-Seite an.

## Ordner-Namensschema

```
Termine/
├── JJJJ_MM_TT_Kurzname/
│   ├── meta.json        ← Pflicht: alle Metadaten
│   └── bild.jpg         ← Optional: Bilder für den Termin
```

**Beispiele:**
```
Termine/2026_04_25_Jahreskonzert/
Termine/2026_08_15_TdB/
Termine/2026_11_29_Adventskonzert/
```

Das Datum im Ordnernamen (`JJJJ_MM_TT`) bestimmt die **Sortierung** der Termine.

---

## meta.json – Alle Felder

```json
{
  "titel":       "Frühjahrskonzert 2026",   // Pflicht – Anzeigename
  "datum":       "2026-03-15",              // Pflicht – ISO-Format JJJJ-MM-TT
  "uhrzeit":     "19:30",                  // Optional – "HH:MM", null = Ganztags
  "ort":         "Turnhalle Riezlern",     // Optional
  "adresse":     "Riezlern, Kleinwalsertal", // Optional
  "kategorie":   "konzert",               // Optional – siehe Kategorien unten
  "beschreibung": "Beschreibungstext …",  // Optional
  "bilder":      ["foto1.jpg", "foto2.jpg"], // Optional – Dateinamen im selben Ordner
  "eintritt":    "frei",                  // Optional – "frei", "5 Euro", null
  "featured":    true                     // Optional – auf Homepage hervorheben
}
```

### Kategorien

| Wert          | Anzeige          |
|---------------|------------------|
| `konzert`     | Konzert          |
| `prozession`  | Prozession       |
| `fest`        | Fest             |
| `auswaerts`   | Auswärtsspiel    |
| `sonstiges`   | Sonstiges        |

---

## Neuen Termin anlegen

1. Ordner anlegen: `Termine/JJJJ_MM_TT_Kurzname/`
2. `meta.json` mit den gewünschten Feldern erstellen
3. Optional: Bilder in denselben Ordner legen und in `"bilder"` eintragen
4. Fertig – die Website erkennt den Termin automatisch beim nächsten Laden

## Termin entfernen

Einfach den gesamten Ordner löschen.

---

## Technischer Hintergrund

Die Datei `Termine/index.json` wird von `build_termine.py` automatisch generiert
und enthält eine Liste aller Termin-Ordner. Die Website lädt diese Datei und
holt dann die einzelnen `meta.json`-Dateien.

Zum Aktualisieren nach Änderungen:
```bash
python3 build_termine.py
```
