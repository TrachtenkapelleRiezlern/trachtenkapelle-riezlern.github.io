# Setup: Google Sheet → GitHub Actions → Website

## Übersicht

```
Google Sheet  →  GitHub Action (tägl. 06:00 UTC)  →  Termine/*/meta.json  →  Website
```

---

## Schritt 1: Google Cloud Service Account erstellen

1. [console.cloud.google.com](https://console.cloud.google.com) → Projekt erstellen
2. **APIs & Dienste → Bibliothek → Google Sheets API → Aktivieren**
3. **APIs & Dienste → Anmeldedaten → + Anmeldedaten erstellen → Dienstkonto**
4. Name z.B. `github-actions-sheets` → Erstellen → Fertig
5. Auf den neuen Service Account klicken → **Schlüssel → Schlüssel hinzufügen → JSON**
   → JSON-Datei wird heruntergeladen

> ⚠️ Diese Datei niemals ins Repo committen!

---

## Schritt 2: Service Account Zugriff aufs Sheet geben

1. JSON öffnen → `"client_email"` kopieren  
   (z.B. `github-actions-sheets@...iam.gserviceaccount.com`)
2. Google Sheet öffnen → **Teilen** → E-Mail als **Betrachter** hinzufügen

---

## Schritt 3: GitHub Secrets einrichten

Repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret-Name | Wert |
|-------------|------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Gesamter Inhalt der JSON-Datei |
| `SPREADSHEET_ID` | `14qnUPCQeRqDsPerpj-848IgoBDI53lwBVmT45awWFUw` |
| `SHEET_RANGE` | Nur nötig wenn Blatt nicht `Termine` heißt, z.B. `Tabelle1!A1:Z5000` |

---

## Schritt 4: Spaltenüberschriften im Sheet

Das Script erwartet diese Spalten (Reihenfolge egal, Groß-/Kleinschreibung egal):

| Spalte | Pflicht | Quelle | Beschreibung |
|--------|---------|--------|--------------|
| `Öffentlich` | ✅ | Manuell | `Ja` = wird veröffentlicht |
| `Start Time` | ✅ | Google Calendar | Datum + Uhrzeit |
| `Title` | ✅* | Google Calendar | Anzeigename (oder `Veranstaltung`) |
| `Veranstaltung` | ✅* | Manuell | Fallback wenn `Title` leer |
| `Location` | – | Google Calendar | Veranstaltungsort |
| `Beschreibung` | – | Manuell | Öffentlicher Text (bevorzugt ggü. `Description`) |
| `Description` | – | Google Calendar | Interne Notizen (Fallback) |
| `Eintritt` | – | Manuell | z.B. `frei` oder `8 Euro` |
| `Kategorie` | – | Manuell | `Konzert`, `Prozession`, `Fest`, `Auswärts` |
| `Orchester` | – | Manuell | Bei mehreren Orchestern |
| `End Time` | – | Google Calendar | Wird gespeichert |
| `Tage`, `Stunden` | – | Google Calendar | Dauer |
| `Color`, `Guests`, `Id` | – | Google Calendar | Werden gespeichert / ignoriert |

---

## Schritt 5: Workflow testen

Repo → **Actions → Termine & Aktuelles synchronisieren → Run workflow**

---

## Automatischer Zeitplan

- **Täglich 06:00 UTC** (= 07:00 MEZ / 08:00 MESZ)
- **Bei Push auf `main`** wenn `Termine/` oder `Aktuelles/` geändert wurden
- **Manuell** jederzeit über den Actions-Tab

---

## Lokal testen

```bash
pip install google-auth google-auth-httplib2 google-api-python-client

export GOOGLE_SERVICE_ACCOUNT_JSON="$(cat service_account.json)"
export SPREADSHEET_ID="14qnUPCQeRqDsPerpj-848IgoBDI53lwBVmT45awWFUw"

python3 sync_termine_from_sheet.py
python3 build_termine.py
python3 build_aktuelles.py
```

---

## Häufige Fehler

| Fehler | Lösung |
|--------|--------|
| `403 PERMISSION_DENIED` | Service Account E-Mail nicht im Sheet als Betrachter |
| `404 Not Found` | `SPREADSHEET_ID` falsch |
| `400 Bad Request` | Blattname ≠ `Termine` → `SHEET_RANGE` Secret setzen |
| Datum nicht erkannt | Unterstützt: `TT.MM.JJJJ`, `JJJJ-MM-TT`, `M/D/YYYY h:mm AM/PM` |
| Bilder verschwinden nach Update | Bleiben erhalten solange Titel (→ Ordnername) gleich bleibt |
