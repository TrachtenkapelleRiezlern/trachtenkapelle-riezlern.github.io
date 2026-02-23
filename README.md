# Trachtenkapelle Riezlern – Website

Offizielle Website der Trachtenkapelle Riezlern, gehostet auf **GitHub Pages**.  
Die Seite ist vollständig statisch – kein Server, kein CMS, kein Framework.  
Inhalte werden über einfache JSON-Dateien und Python-Scripts gepflegt.

---

## 📁 Ordnerstruktur

```
/
├── index.html                  ← Startseite (einzige Seite im Root)
├── style.css                   ← Globales Stylesheet
├── main.js                     ← Navigation, Daten laden, alle JS-Logik
│
├── aktuelles.html              ← Neuigkeiten-Übersicht
├── artikel.html                ← Detailseite für Aktuelles & Konzerte
├── bilder.html                 ← Album-Übersicht
├── gallery.html                ← Einzelnes Album mit Lightbox
├── geburtstagsfest.html        ← ZÄÄMA 210 – Jubiläumsseite
├── impressum.html              ← Impressum & Datenschutz
├── kontakt.html                ← Kontaktformular
├── konzerte.html               ← Konzert-Übersicht nach Jahr
├── musikanten.html             ← Alle Musikantinnen & Musikanten
├── termine.html                ← Terminkalender mit Filter
├── verein.html                 ← Über den Verein, Vorstandschaft, Jugend, Alphorn
│
├── images/                     ← Alle Bilder
│   ├── hero/                   ← Hintergrundbilder für Hero-Bereiche
│   ├── general/                ← Allgemeine Fotos (about.jpg, jugend.jpg …)
│   ├── register/               ← Registerfotos (floeten.jpg, blech.jpg …)
│   └── gallery/
│       └── alben/              ← Fotoalben
│           ├── index.json      ← Globale Album-Übersicht (auto-generiert)
│           ├── bmf_donnerstag/
│           │   ├── index.json  ← Album-Metadaten + Bildliste (auto-generiert)
│           │   ├── titel.jpg   ← Vorschaubild für die Album-Kachel
│           │   └── *.jpg       ← Alle Fotos des Albums
│           └── …
│
├── Aktuelles/                  ← Neuigkeiten-Beiträge
│   ├── index.json              ← Übersicht (auto-generiert)
│   └── 2025_05_01_Maifest/
│       ├── meta.json           ← Titel, Datum, Inhalt
│       └── titelbild.jpg
│
├── Termine/                    ← Termine
│   ├── index.json              ← Übersicht (auto-generiert)
│   └── 2025_06_28_Geburtstagsfest/
│       └── meta.json
│
├── Konzerte/                   ← Konzert-Rückblicke
│   ├── index.json              ← Übersicht (auto-generiert)
│   └── 2025_Adventskonzert/
│       ├── meta.json
│       └── titelbild.jpg
│
├── data/
│   └── termine.xlsx            ← Excel-Datei für Termine (optional)
│
├── python_scripts/             ← Hilfsskripte
│   ├── build_aktuelles.py      ← Aktuelles/index.json generieren
│   ├── build_alben.py          ← Alben index.json generieren
│   ├── build_konzerte.py       ← Konzerte/index.json generieren
│   ├── build_termine.py        ← Termine/index.json generieren
│   ├── sync_termine_from_xlsx.py ← Termine aus Excel synchronisieren
│   └── download_alben.py       ← Bilder von alter Website laden (einmalig)
│
└── .github/
    └── workflows/
        └── sync.yml            ← GitHub Actions: täglich automatisch bauen
```

---

## 🌐 Seiten im Überblick

### Startseite (`index.html`)
Die Hauptseite mit Hero-Bereich, Willkommenstext, nächsten Terminen, aktuellen Neuigkeiten und Fotoalben. Enthält auch den **ZÄÄMA 210 Banner** für das Jubiläumsfest.

### Verein (`verein.html`)
Vereinsgeschichte, Statistiken, Vorstandschaft mit Namensliste, Mitglieder-Bereich, Jugendarbeit (Link zur Musikschule Kleinwalsertal) und Alphorn-Gruppe.

### Termine (`termine.html`)
Alle kommenden Veranstaltungen mit Filter nach Kategorie (Konzerte / Kirchliches / Feste). Die ersten 5 Termine sind sichtbar, weitere werden per „Alle anzeigen"-Button eingeblendet.

### Aktuelles (`aktuelles.html`)
Neuigkeiten als Karten-Raster. Klick auf eine Karte öffnet die Detailseite (`artikel.html`).

### Konzerte (`konzerte.html`)
Konzert-Rückblicke, nach Jahr gruppiert mit fetter Jahres-Überschrift. Klick auf ein Konzert öffnet die Detailseite.

### Detailseite (`artikel.html`)
Universelle Detailseite für Aktuelles und Konzerte. Lädt die Inhalte dynamisch aus der jeweiligen `meta.json` – URL-Parameter `?id=ORDNER&base=Aktuelles` bzw. `&base=Konzerte`.

### Bilder & Videos (`bilder.html`)
Übersicht aller Fotoalben als Kacheln mit Vorschaubild und Bildanzahl. Alben werden automatisch aus `images/gallery/alben/index.json` geladen.

### Album (`gallery.html`)
Zeigt alle Fotos eines Albums in einem Raster. Klick auf ein Foto öffnet eine **Lightbox** mit abgedunkeltem Hintergrund und Pfeiltasten-Navigation.

### Geburtstagsfest (`geburtstagsfest.html`)
Landingpage für das ZÄÄMA 210 Jubiläumsfest (28. Juni 2026) mit Infos, Statistiken und Logo-Varianten.

### Musikanten (`musikanten.html`)
Alle aktiven Musikantinnen und Musikanten nach Register sortiert.

### Kontakt (`kontakt.html`)
Kontaktformular und Anfahrt.

### Impressum (`impressum.html`)
Pflichtangaben, Haftungsausschluss und Datenschutzerklärung (DSGVO).

---

## 📅 Termine pflegen

Termine können auf zwei Wegen gepflegt werden:

### Weg 1 – Excel (empfohlen)

Die Datei `data/termine.xlsx` befüllen. Jede Zeile ist ein Termin mit folgenden Spalten:

| Spalte | Beispiel | Pflicht |
|--------|---------|---------|
| Datum | 28.06.2026 | ✓ |
| Titel | Geburtstagsfest | ✓ |
| Kategorie | feste | ✓ |
| Ort | Riezlern | |
| Beschreibung | Freitext | |
| Öffentlich | Ja | ✓ |

Nur Zeilen mit **„Ja"** in der Spalte „Öffentlich" werden auf der Website angezeigt.

Nach dem Speichern der Excel-Datei und dem Pushen ins Repo läuft der GitHub Actions Workflow automatisch und aktualisiert die Website.

**Kategorien:** `konzerte` · `kirchliches` · `feste` · `sonstiges`

### Weg 2 – Manuell

Ordner im `Termine/`-Verzeichnis anlegen:
```
Termine/
  2025_06_28_Geburtstagsfest/
    meta.json
```

Inhalt der `meta.json`:
```json
{
  "titel": "Geburtstagsfest",
  "datum": "2025-06-28",
  "kategorie": "feste",
  "ort": "Riezlern",
  "beschreibung": "210 Jahre Trachtenkapelle Riezlern"
}
```

Danach lokal ausführen:
```bash
python3 python_scripts/build_termine.py
```

---

## 📰 Aktuelles pflegen

Ordner in `Aktuelles/` anlegen – Name beginnt mit `JJJJ_MM_TT_`:

```
Aktuelles/
  2025_06_28_Geburtstagsfest/
    meta.json
    titelbild.jpg
    foto1.jpg
```

Inhalt der `meta.json`:
```json
{
  "titel": "Unser Geburtstagsfest",
  "datum": "2025-06-28",
  "kategorie": "konzerte",
  "beschreibung": "Kurzer Teasertext der in der Übersicht erscheint.",
  "inhalt": "Vollständiger Artikeltext für die Detailseite. HTML ist erlaubt, z.B. <p>Absatz</p> oder <strong>fett</strong>.",
  "titelbild": "titelbild.jpg",
  "bilder": ["foto1.jpg", "foto2.jpg"]
}
```

| Feld | Beschreibung |
|------|-------------|
| `titel` | Überschrift |
| `datum` | Format `JJJJ-MM-TT` |
| `kategorie` | `konzerte` · `kirchliches` · `feste` · `sonstiges` |
| `beschreibung` | Kurztext für die Übersichtsseite |
| `inhalt` | Volltext für die Detailseite (HTML erlaubt) |
| `titelbild` | Dateiname des Vorschaubilds (muss im gleichen Ordner liegen) |
| `bilder` | Optionale Bildergalerie auf der Detailseite |

Danach lokal ausführen:
```bash
python3 python_scripts/build_aktuelles.py
```

---

## 🎵 Konzerte pflegen

Ordner in `Konzerte/` anlegen – Name beginnt mit dem Jahr:

```
Konzerte/
  2025_Adventskonzert/
    meta.json
    titelbild.jpg
```

Inhalt der `meta.json`:
```json
{
  "titel": "Adventskonzert 2025",
  "datum": "2025",
  "beschreibung": "Stimmungsvolles Adventskonzert im Gemeindesaal.",
  "inhalt": "Vollständiger Text mit Programm, Fotos-Beschreibungen etc.",
  "titelbild": "titelbild.jpg"
}
```

Danach lokal ausführen:
```bash
python3 python_scripts/build_konzerte.py
```

---

## 🖼️ Fotoalben pflegen

### Neues Album hinzufügen

1. Ordner in `images/gallery/alben/` anlegen, z.B. `sommerfest_2025/`
2. Fotos hinzufügen (beliebige JPG/PNG-Dateien)
3. Optional: `titel.jpg` als Vorschaubild anlegen
4. Script ausführen:

```bash
python3 python_scripts/build_alben.py
```

Das Script erkennt automatisch alle Ordner und generiert die `index.json` Dateien. Beim ersten Durchlauf wird der Ordnername als Albumtitel verwendet. Um Titel und Datum anzupassen, einfach die generierte `index.json` editieren – beim nächsten Durchlauf werden diese Werte beibehalten.

### Bilder komprimieren

Vor dem Upload empfiehlt sich eine Komprimierung (spart Ladezeit):

```bash
# compress.py in den Bilderordner legen und ausführen
python compress.py
```

Komprimiert auf max. 1920px Breite, JPEG Qualität 82.

---

## ⚙️ GitHub Actions (automatischer Workflow)

Der Workflow `.github/workflows/sync.yml` läuft automatisch:
- **Täglich um 07:00 Uhr** (MEZ)
- **Bei jedem Push** auf `main` wenn relevante Dateien geändert wurden
- **Manuell** über GitHub → Actions → „Termine, Aktuelles & Alben synchronisieren"

Der Workflow führt folgende Schritte aus:
1. Termine aus Excel synchronisieren
2. `Termine/index.json` bauen
3. `Aktuelles/index.json` bauen
4. `Konzerte/index.json` bauen
5. `images/gallery/alben/index.json` bauen
6. Alle Änderungen committen und pushen

---

## 🛠️ Lokale Entwicklung

Dateien direkt im Browser öffnen funktioniert für die meisten Seiten. Für Seiten die JSON-Dateien laden (Termine, Aktuelles, Alben) wird ein lokaler Webserver benötigt:

```bash
# Python eingebaut
python3 -m http.server 8080

# Dann im Browser öffnen:
# http://localhost:8080
```

---

## 📝 Hinweise

- **Trailing Commas** in `meta.json` werden automatisch ignoriert – `{"a": "b",}` ist erlaubt
- **Bildformate:** JPG, JPEG, PNG, WebP werden unterstützt
- **Favicon:** `images/logo.png`
- **Schriften:** Playfair Display (Überschriften), Lato (Fließtext) – via Google Fonts