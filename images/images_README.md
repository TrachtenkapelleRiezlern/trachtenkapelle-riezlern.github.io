# images/ – Bildordner

Alle Bilder der Website werden hier abgelegt. Die HTML-Dateien referenzieren sie mit relativen Pfaden.

```
images/
├── hero/          ← Slideshow-Bilder auf der Startseite
│   ├── gruppenbild.jpg
│   ├── dirigentin.jpg
│   ├── alphornblaeser.jpg
│   └── ...
│
├── gallery/       ← Bildergalerie (bilder.html)
│   ├── konzert_2025_01.jpg
│   └── ...
│
├── news/          ← Titelbilder für Aktuelles-Beiträge
│   └── ...
│
└── general/       ← Allgemeine Bilder (About-Section, Verein, etc.)
    ├── about.jpg
    └── ...
```

## Empfohlene Bildformate

- **Format:** JPEG oder WebP
- **Hero-Bilder:** min. 1600 × 900 px
- **Galerie:** min. 800 × 600 px
- **Dateigröße:** max. 500 KB pro Bild (für schnelle Ladezeiten)

## Benennung

Sprechende Dateinamen ohne Sonderzeichen oder Leerzeichen:
- ✅ `konzert_sommer_2025.jpg`
- ✅ `gruppenbild_berge.jpg`
- ❌ `561A0216-ffba4264.jpg` (Kameradateiname)
- ❌ `Foto 2025 (1).jpg` (Leerzeichen & Klammern)

## Verwendung in HTML

```html
<img src="images/hero/gruppenbild.jpg" alt="Beschreibung" />
<img src="images/gallery/konzert_2025_01.jpg" alt="Konzert Sommer 2025" />
```

## Verwendung in meta.json (Termine / Aktuelles)

Bilder die zu einem Termin oder Beitrag gehören, legt ihr direkt  
im jeweiligen Unterordner ab:

```
Termine/2026_07_12_Sommerkonzert_I/
├── meta.json
├── buehne.jpg
└── publikum.jpg
```

Und in `meta.json`:
```json
{ "bilder": ["buehne.jpg", "publikum.jpg"] }
```
