# Trachtenkapelle Riezlern – Website

Statische Website der Trachtenkapelle Riezlern, gehostet auf GitHub Pages.
Die Inhalte liegen direkt im Repository – ohne CMS, Framework oder Server.

## Ordnerstruktur

```text
/
├── index.html                  ← Startseite
├── rueckblicke.html            ← Chronologische Übersicht aller Rückblicke
├── rueckblick.html             ← Detailseite für einen Rückblick
├── termine.html                ← Kommende Termine
├── musik.html                  ← Internes Musikarchiv, aus SQLite generiert
├── verein.html                 ← Verein, Geschichte, Vorstand, Jugend, Alphorn
├── geschichte.html             ← Archivierte Vereinsgeschichte
├── musikanten.html             ← Musikantinnen & Musikanten
├── kontakt.html                ← Kontakt
├── impressum.html              ← Impressum & Datenschutz
├── style.css                   ← Globales Stylesheet
├── main.js                     ← Navigation und dynamisches Laden
│
├── Rueckblicke/                ← Alle vergangenen Ereignisse / Erinnerungen
│   ├── index.json              ← Liste der Rückblick-Ordner
│   └── 2025_adventskonzert/
│       ├── meta.json           ← Text, Tags, Konzertinfos, Albumliste
│       ├── cover.jpg           ← Vorschaubild / Titelbild
│       ├── article/            ← optionale Artikelbilder
│       ├── concert/            ← optionale Konzertbilder
│       └── albums/             ← optionale Fotoalben dieses Rückblicks
│
├── Termine/                    ← Termine, aus CSV/JSON generiert
├── data/
│   ├── termine.csv             ← Terminpflege
│   └── musik.db                ← Musikarchiv-Datenbank
├── images/                     ← Allgemeine Bilder für Layout, Verein, Register …
├── python_scripts/
│   ├── build_musik.py
│   ├── sync_termine.py
│   └── compress_bilder.py
└── .github/workflows/
    ├── build_musik.yml
    └── github_workflow_sync.yml
```

## Rückblicke pflegen

Ein Rückblick ist die zentrale Einheit für vergangene Inhalte. Er kann Text, Konzertinformationen und Bilder gemeinsam enthalten. Dadurch gibt es keine getrennten Besucher-Seiten mehr für „Aktuelles“, „Konzerte“ und „Alben“.

### Neuen Rückblick anlegen

1. Einen Ordner unter `Rueckblicke/` anlegen. Der Ordnername beginnt mit dem Jahr:

```text
Rueckblicke/2026_jahreskonzert_fantasie/
```

2. Den Ordner in `Rueckblicke/index.json` eintragen:

```json
[
  { "ordner": "2026_jahreskonzert_fantasie" }
]
```

3. Im Ordner eine `meta.json` erstellen:

```json
{
  "titel": "Jahreskonzert 2026 – Fantasie",
  "datum": "2026-04-25",
  "tags": ["Konzert", "Jahreskonzert"],
  "beschreibung": "Unser Jahreskonzert 2026 unter dem Motto „Fantasie“.",
  "detailbild": "concert/programm.jpg",
  "inhalt": "<p>Hier steht der Rückblickstext.</p>",
  "concert": {
    "titel": "Jahreskonzert 2026 – Fantasie",
    "datum": "2026",
    "beschreibung": "Kurze Konzertinformation.",
    "titelbild": "concert/titelbild.jpg"
  },
  "albums": [
    {
      "id": "jahreskonzert",
      "titel": "Bilder vom Jahreskonzert",
      "bilder": [
        "albums/jahreskonzert/001.jpg",
        "albums/jahreskonzert/002.jpg"
      ]
    }
  ]
}
```

### Wichtige Felder

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `titel` | ✓ | Titel des Rückblicks |
| `datum` | ✓ | `JJJJ-MM-TT` oder nur `JJJJ`; bestimmt die Sortierung |
| `tags` | | sichtbare Schlagworte |
| `beschreibung` | | kurzer Teaser für Übersicht und Detailseite |
| `status` | | optional, z.B. `abgesagt`; zeigt in der Übersicht einen Stempel auf dem Bild |
| `detailbild` | | optionales großes Bild auf der Detailseite; sonst wird `cover.jpg` verwendet |
| `inhalt` / `text` | | eigener Rückblicktext; HTML ist erlaubt |
| `article` | | optionaler Artikelblock, z.B. aus alten Inhalten migriert |
| `concert` | | optionaler Konzertblock |
| `albums` | | optionale Fotoalben, vollständig im Rückblick-Ordner |

Das Titelbild eines Rückblicks heißt immer `cover.jpg` und liegt direkt im jeweiligen Rückblick-Ordner. Es wird in Übersichten und Karten verwendet. Mit `detailbild` kann optional ein anderes Bild für die Detailseite gewählt werden. Alle Datei-Pfade in `meta.json` sind relativ zum jeweiligen Rückblick-Ordner.

### Beispiel für einen Artikeltext

Für neue Rückblicke reicht meistens das Feld `inhalt`. Dort steht der eigentliche Artikel als HTML. Absätze werden mit `<p>...</p>` geschrieben, Zwischenüberschriften mit `<h2>...</h2>`.

```json
{
  "titel": "Adventskonzert 2025",
  "datum": "2025-11-30",
  "tags": ["Konzert", "Advent"],
  "beschreibung": "Ein stimmungsvoller Konzertabend in der Adventszeit.",
  "inhalt": "<p>Am ersten Adventsonntag lud die Trachtenkapelle Riezlern zum Adventskonzert in die Pfarrkirche ein. In ruhiger Atmosphäre und bei Kerzenschein standen besinnliche Melodien, feine Solostellen und vertraute Klänge im Mittelpunkt.</p><p>Kapellmeisterin und Musikantinnen und Musikanten gestalteten ein Programm, das bewusst Raum zum Zuhören ließ. Zwischen festlichen Bläserklängen und leisen Momenten entstand ein Abend, der viele Besucherinnen und Besucher auf die Adventszeit einstimmte.</p><p>Ein herzliches Vergelt’s Gott gilt allen, die gekommen sind, sowie allen Helferinnen und Helfern rund um Vorbereitung, Aufbau und Organisation.</p>",
  "concert": {
    "titel": "Adventskonzert 2025",
    "datum": "2025",
    "beschreibung": "Adventskonzert in der Pfarrkirche Riezlern"
  },
  "albums": [
    {
      "id": "adventskonzert",
      "titel": "Bilder vom Adventskonzert",
      "bilder": [
        "albums/adventskonzert/001.jpg",
        "albums/adventskonzert/002.jpg"
      ]
    }
  ]
}
```

Der alte `article`-Block kann weiterhin verwendet werden, wenn Inhalte aus dem früheren „Aktuelles“-Bereich übernommen werden. Für neue Einträge ist `inhalt` aber übersichtlicher, weil Titel, Datum, Tags und Teaser ohnehin schon direkt im Rückblick stehen.

### Fotoalben

Fotoalben liegen direkt im Rückblick:

```text
Rueckblicke/2016_bezirksmusikfest/
  albums/
    2016_BMF_Samstag/
      titel.jpg
      BMF_Samstag_001.jpg
      BMF_Samstag_002.jpg
```

Die Bilder eines Albums werden in der `bilder`-Liste des jeweiligen Album-Eintrags gepflegt. Separate `index.json`-Dateien innerhalb der Album-Ordner werden nicht benötigt.

Auf der Detailseite werden zunächst einige Fotos angezeigt. Bei größeren Alben erscheint ein Button, um die restlichen Bilder nachzuladen.

## Termine pflegen

Termine werden in Google Sheets gepflegt. GitHub Actions lädt daraus `data/termine.csv` und synchronisiert anschließend `Termine/` und `Termine/index.json`.

Google Sheet:

```text
https://docs.google.com/spreadsheets/d/14qnUPCQeRqDsPerpj-848IgoBDI53lwBVmT45awWFUw/edit
```

Die Tabelle muss für „Jeder mit dem Link“ lesbar sein, damit GitHub Actions sie ohne Anmeldung als CSV herunterladen kann.

Wichtige Spalten:

| Spalte | Beispiel | Pflicht |
|--------|----------|---------|
| Start Time | `Mo. 22.09.25 20:00` | ✓* |
| Datum | `28.06.2026` | ✓* |
| Titel / Title | `Geburtstagsfest` | ✓ |
| Kategorie | `feste` | ✓ |
| Ort / Location | `Riezlern` | |
| Uhrzeit | `20:00` | |
| Beschreibung | kurzer Text | |
| Öffentlich | `Ja` | ✓ |

✓* Entweder `Start Time` oder `Datum` muss vorhanden sein. Wenn `Start Time` eine Uhrzeit enthält, wird diese automatisch als `uhrzeit` übernommen.

Erlaubte Kategorien:

| Wert | Anzeige |
|------|---------|
| `konzerte` | Konzerte |
| `kirchliches` | Kirchliches |
| `feste` | Feste & Feiern |
| `sonstiges` | Sonstiges |

Lokal kann die Synchronisierung so getestet werden:

```bash
python3 python_scripts/sync_termine.py
```

Ohne Argumente führt das Skript interaktiv durch Download und Synchronisierung. Für einen direkten nicht-interaktiven Lauf:

```bash
python3 python_scripts/sync_termine.py --all --verbose
```

## Musikarchiv generieren

Das interne Musikarchiv unter `musik.html` wird statisch aus `data/musik.db` gebaut. Aktuell werden diese Mappen ausgegeben:

- `NrMappe=2` – Marschbuch
- `NrMappe=5` – Konzertmappe
- `NrMappe=13` – Jahreskonzert

Lokal neu generieren:

```bash
python3 python_scripts/build_musik.py
```

Wenn Typst installiert ist, erzeugt das Skript zusätzlich diese PDF-Dateien unter `assets/`:

- `assets/inhaltsangaben.pdf`
- `assets/mb-ruecken.pdf`

Auf GitHub werden `musik.html` und die PDF-Dateien automatisch neu erzeugt, wenn `data/musik.db` oder das Build-Skript auf `main` geändert wird.

## Lokal testen

Seiten mit JSON-Daten sollten über einen lokalen Webserver geöffnet werden:

```bash
python3 -m http.server 4175
```

Dann im Browser öffnen:

```text
http://127.0.0.1:4175/
```

## Bilder komprimieren

Große Fotos vor dem Commit komprimieren:

```bash
python3 python_scripts/compress_bilder.py
```

Die Originale am besten vorher sichern.
