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

Termine können auf zwei Wegen gepflegt werden.

---

### Weg 1 – Excel (empfohlen)

Dies ist der einfachste Weg um viele Termine auf einmal zu pflegen.

**Schritt 1:** Datei `data/termine.xlsx` in einem Ordner im Repo öffnen.

**Schritt 2:** Neue Zeile einfügen. Folgende Spalten ausfüllen:

| Spalte | Beispiel | Pflicht | Hinweis |
|--------|---------|---------|---------|
| Datum | 28.06.2026 | ✓ | Format TT.MM.JJJJ |
| Titel | Geburtstagsfest | ✓ | Erscheint auf der Website |
| Kategorie | feste | ✓ | Siehe unten |
| Ort | Riezlern | | Erscheint unter dem Titel |
| Beschreibung | Freitext | | Kurze Zusatzinfo |
| Öffentlich | Ja | ✓ | Nur „Ja" wird angezeigt |

**Erlaubte Kategorien:**

| Wert | Angezeigt als |
|------|--------------|
| `konzerte` | Konzerte |
| `kirchliches` | Kirchliches |
| `feste` | Feste & Feiern |
| `sonstiges` | Sonstiges |

**Schritt 3:** Excel-Datei speichern und in GitHub hochladen (committen & pushen).

**Schritt 4:** GitHub Actions läuft automatisch an und aktualisiert die Website. Fertig.

> ⚠️ Vergangene Termine bleiben auf der Website sichtbar. Termine ohne „Ja" in der Spalte „Öffentlich" werden komplett ignoriert.

---

### Weg 2 – Manuell (Ordner anlegen)

**Schritt 1:** Im Ordner `Termine/` einen neuen Unterordner anlegen.  
Namensschema: `JJJJ_MM_TT_Titel` – das Datum muss am Anfang stehen damit die Sortierung stimmt.

Beispiel: `Termine/2025_06_28_Geburtstagsfest/`

**Schritt 2:** Im neuen Ordner eine Datei `meta.json` erstellen:

```json
{
  "titel": "Geburtstagsfest",
  "datum": "2025-06-28",
  "kategorie": "feste",
  "ort": "Riezlern",
  "beschreibung": "210 Jahre Trachtenkapelle Riezlern"
}
```

**Schritt 3:** Committen & pushen. GitHub Actions übernimmt den Rest.

> **Termin löschen:** Ordner einfach löschen und pushen – er verschwindet automatisch von der Website.

---

## 📰 Aktuelles pflegen

Jeder Beitrag ist ein eigener Ordner in `Aktuelles/`. Darin liegen die `meta.json` und alle zugehörigen Bilder.

---

**Schritt 1:** Ordner in `Aktuelles/` anlegen.  
Namensschema: `JJJJ_MM_TT_Titel`

Beispiel: `Aktuelles/2025_06_28_Geburtstagsfest/`

**Schritt 2:** `meta.json` im neuen Ordner erstellen:

```json
{
  "titel": "Unser Geburtstagsfest",
  "datum": "2025-06-28",
  "kategorie": "feste",
  "beschreibung": "Kurzer Teasertext der in der Übersicht erscheint.",
  "inhalt": "Vollständiger Text der auf der Detailseite erscheint. HTML ist erlaubt.",
  "titelbild": "titelbild.jpg",
  "bilder": ["foto1.jpg", "foto2.jpg"]
}
```

**Schritt 3:** Titelbild und weitere Fotos in denselben Ordner legen:

```
Aktuelles/
  2025_06_28_Geburtstagsfest/
    meta.json
    titelbild.jpg    ← Vorschaubild in der Übersicht und oben auf der Detailseite
    foto1.jpg        ← erscheint in der Galerie am Ende der Detailseite
    foto2.jpg
```

**Schritt 4:** Committen & pushen. GitHub Actions übernimmt den Rest.

---

**Erklärung der Felder:**

| Feld | Pflicht | Beschreibung |
|------|---------|-------------|
| `titel` | ✓ | Überschrift des Beitrags |
| `datum` | ✓ | Format `JJJJ-MM-TT`, bestimmt die Sortierung |
| `kategorie` | | `konzerte` · `kirchliches` · `feste` · `sonstiges` |
| `beschreibung` | | Kurztext (1–2 Sätze) – erscheint in der Übersicht und als Teaser |
| `inhalt` | | Volltext für die Detailseite – HTML erlaubt (`<p>`, `<strong>`, `<h2>` usw.) |
| `titelbild` | | Dateiname des Vorschaubilds – muss im gleichen Ordner liegen |
| `bilder` | | Liste von Bilddateinamen für die Galerie am Ende der Detailseite |

> **Beitrag löschen:** Ordner einfach löschen und pushen.  
> **Beitrag bearbeiten:** `meta.json` direkt in GitHub editieren und speichern.

---

## 🎵 Konzerte pflegen

Konzerte funktionieren ähnlich wie Aktuelles – jeder Konzert-Rückblick ist ein eigener Ordner in `Konzerte/`. Der Unterschied: Es wird nur das **Jahr** angegeben, kein exaktes Datum. Auf der Website werden die Konzerte nach Jahr gruppiert angezeigt.

---

**Schritt 1:** Ordner in `Konzerte/` anlegen.  
Namensschema: `JJJJ_Titel`

Beispiele:
- `Konzerte/2025_Adventskonzert/`
- `Konzerte/2025_Wunschkonzert/`
- `Konzerte/2024_Sommerkonzert/`

**Schritt 2:** `meta.json` im neuen Ordner erstellen:

```json
{
  "titel": "Adventskonzert 2025",
  "datum": "2025",
  "beschreibung": "Stimmungsvolles Adventskonzert im Gemeindesaal Riezlern.",
  "inhalt": "Vollständiger Text für die Detailseite. Programm, Besonderheiten, Rückblick etc. HTML ist erlaubt.",
  "titelbild": "titelbild.jpg"
}
```

**Schritt 3:** Titelbild (und weitere Fotos falls gewünscht) in denselben Ordner legen:

```
Konzerte/
  2025_Adventskonzert/
    meta.json
    titelbild.jpg    ← Vorschaubild auf der Konzerte-Seite
```

**Schritt 4:** Committen & pushen. GitHub Actions übernimmt den Rest.

---

**Erklärung der Felder:**

| Feld | Pflicht | Beschreibung |
|------|---------|-------------|
| `titel` | ✓ | Name des Konzerts |
| `datum` | ✓ | Nur das Jahr: `"2025"` – bestimmt die Jahres-Gruppe |
| `beschreibung` | | Kurztext der auf der Konzerte-Übersicht erscheint |
| `inhalt` | | Volltext für die Detailseite (Programm, Rückblick, HTML erlaubt) |
| `titelbild` | | Dateiname des Vorschaubilds |

> **Mehrere Konzerte im selben Jahr** werden automatisch unter der gleichen Jahres-Überschrift gruppiert.

---

## 🖼️ Fotoalben pflegen

Alben sind Ordner unter `images/gallery/alben/`. Jeder Ordner wird automatisch als Album erkannt und auf der Bilder-Seite angezeigt.

---

### Neues Album hinzufügen

**Schritt 1:** Bilder komprimieren (wichtig – unkomprimierte Fotos von der Kamera sind oft 5–20 MB pro Bild und laden zu langsam).

`compress.py` in den Ordner mit den Originalfotos legen und ausführen:
```bash
python compress.py
```
Die Bilder werden direkt überschrieben – am besten vorher eine Sicherheitskopie der Originale behalten. Komprimiert auf max. 1920px Breite, JPEG Qualität 82.

**Schritt 2:** Neuen Ordner in `images/gallery/alben/` anlegen.  
Namensschema: frei wählbar, am besten beschreibend und ohne Leerzeichen.

Beispiele:
- `images/gallery/alben/2025_sommerfest/`
- `images/gallery/alben/2024_adventskonzert/`

**Schritt 3:** Komprimierte Fotos in den neuen Ordner kopieren.

**Schritt 4:** Optional – `titel.jpg` als Vorschaubild anlegen.  
Das ist das Bild das auf der Bilder-Seite als Kachel-Vorschau erscheint. Wenn keines vorhanden ist, wird ein Platzhalter angezeigt.

```
images/gallery/alben/
  2025_sommerfest/
    titel.jpg        ← Vorschaubild (optional aber empfohlen)
    001_ankunft.jpg
    002_buehne.jpg
    003_publikum.jpg
    …
```

**Schritt 5:** Committen & pushen. GitHub Actions erkennt den neuen Ordner automatisch, generiert die `index.json` und die Website wird aktualisiert.

---

### Albumtitel und Jahr anpassen

Nach dem ersten Push generiert `build_alben.py` eine `index.json` im Albumordner. Diese kann direkt in GitHub editiert werden:

```json
{
  "titel": "Sommerfest 2025",
  "datum": "2025",
  "bilder": ["001_ankunft.jpg", "002_buehne.jpg"]
}
```

Die `bilder`-Liste nicht manuell ändern – sie wird beim nächsten Build automatisch neu generiert. Nur `titel` und `datum` anpassen.

---

### Album löschen

Ordner aus `images/gallery/alben/` löschen und pushen. Das Album verschwindet automatisch von der Website.

---

> ⚠️ **Bilder-Reihenfolge:** Die Fotos werden alphabetisch nach Dateiname sortiert. Um eine bestimmte Reihenfolge zu erreichen, Dateien mit Nummern benennen: `001_foto.jpg`, `002_foto.jpg` usw.

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
python3 -m http.server 8080
# Dann: http://localhost:8080
```

Die Build-Scripts (`build_aktuelles.py`, `build_termine.py`, `build_konzerte.py`, `build_alben.py`) **müssen nicht lokal ausgeführt werden** – der GitHub Actions Workflow übernimmt das automatisch nach jedem Push. Lokal sind die Scripts nur nötig wenn du Änderungen vor dem Push testen möchtest.

**Einzige Ausnahme:** `compress.py` läuft nie automatisch – Bilder vor dem Upload manuell komprimieren.

---

## 📝 Hinweise

- **Trailing Commas** in `meta.json` werden automatisch ignoriert – `{"a": "b",}` ist erlaubt
- **Bildformate:** JPG, JPEG, PNG, WebP werden unterstützt
- **Favicon:** `images/logo.png`
- **Schriften:** Playfair Display (Überschriften), Lato (Fließtext) – via Google Fonts