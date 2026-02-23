# Termine

Termine können direkt als Ordner gepflegt werden, oder bequem über die CSV-Datei `data/termine.csv`.

---

## Weg 1 – Manuell (Ordner anlegen)

**1. Ordner anlegen** – Namensschema: `JJJJ_MM_TT_Titel`

```
2025_06_28_Geburtstagsfest/
  meta.json
```

**2. `meta.json` erstellen:**

```json
{
  "titel": "Geburtstagsfest",
  "datum": "2025-06-28",
  "kategorie": "feste",
  "ort": "Riezlern",
  "beschreibung": "210 Jahre Trachtenkapelle Riezlern"
}
```

**3. Pushen.** Fertig.

---

## Weg 2 – CSV

`data/termine.csv` öffnen, neue Zeile einfüllen, speichern und pushen.

| Spalte | Beispiel | Pflicht |
|--------|---------|---------|
| Datum | 28.06.2026 | ✓ |
| Titel | Geburtstagsfest | ✓ |
| Kategorie | feste | ✓ |
| Ort | Riezlern | |
| Beschreibung | Freitext | |
| Öffentlich | Ja | ✓ |

> Nur Zeilen mit **„Ja"** in der Spalte „Öffentlich" erscheinen auf der Website.

---

## Felder

| Feld | Pflicht | Beschreibung |
|------|---------|-------------|
| `titel` | ✓ | Name des Termins |
| `datum` | ✓ | Format `JJJJ-MM-TT` |
| `kategorie` | ✓ | `konzerte` · `kirchliches` · `feste` · `sonstiges` |
| `ort` | | Veranstaltungsort |
| `beschreibung` | | Kurze Zusatzinfo |

## Termin löschen
Ordner löschen und pushen.

## Termin bearbeiten
`meta.json` direkt in GitHub editieren und speichern.