# Aktuelles – Ordnerstruktur

Jeder Beitrag hat einen eigenen Unterordner. Die Website liest diese automatisch
und zeigt sie auf der Aktuelles-Seite und als News-Kacheln auf der Startseite an.

## Ordner-Namensschema

```
Aktuelles/
├── JJJJ_MM_TT_Kurzname/
│   ├── meta.json        ← Pflicht
│   └── titelbild.jpg    ← Empfohlen (wird als Vorschaubild verwendet)
```

Das Datum im Ordnernamen bestimmt die **Sortierung** (neueste zuerst).

---

## meta.json – Alle Felder

```json
{
  "titel":       "Adventskonzert 2025 – Ein unvergesslicher Abend",
  "datum":       "2025-11-30",        // Pflicht – ISO-Format
  "kategorie":   "konzert",           // konzert | allgemein | jugend | alphorn
  "autor":       "Trachtenkapelle Riezlern",
  "beschreibung": "Fließtext …",      // Vorschautext (erste ~160 Zeichen sichtbar)
  "titelbild":   "titelbild.jpg",     // Dateiname im selben Ordner
  "bilder":      ["foto1.jpg"],       // weitere Bilder (optional)
  "featured":    true,                // auf Startseite hervorheben (max. 1)
  "tags":        ["konzert", "advent"]
}
```

---

## Neuen Beitrag anlegen

1. Ordner anlegen: `Aktuelles/JJJJ_MM_TT_Kurzname/`
2. `meta.json` erstellen
3. `titelbild.jpg` in den Ordner legen
4. `python3 build_aktuelles.py` ausführen

## Beitrag entfernen / archivieren

Ordner löschen oder umbenennen (ohne `JJJJ_MM_TT_` Präfix → wird ignoriert).
