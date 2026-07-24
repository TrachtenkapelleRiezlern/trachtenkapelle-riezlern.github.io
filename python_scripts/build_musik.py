#!/usr/bin/env python3
# coding: utf-8
"""
build_musik.py
──────────────
Generiert eine statische interne Übersicht der wichtigsten Musikmappen aus
data/musik.db.

Verwendung:
    python3 python_scripts/build_musik.py
    python3 python_scripts/build_musik.py --db data/musik.db --out musik.html
"""

import argparse
import html
import csv
import shutil
import sqlite3
import subprocess
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
DEFAULT_DB = ROOT / "data" / "musik.db"
DEFAULT_OUT = ROOT / "musik.html"
PDFCREATOR_DIR = ROOT / "python_scripts" / "pdfcreator"
TYPST_DOCUMENT = PDFCREATOR_DIR / "tabler.typ"
ASSETS_DIR = ROOT / "assets"

PDF_OUTPUTS = [
    ("inhaltsangaben.pdf", "Inhaltsangaben", "Komplette Inhaltslisten für Konzertmappe und Marschbuch.", "first"),
    ("mb-ruecken.pdf", "MB-Rücken", "Druckvorlage für den Rücken / die Einlage des Marschbuchs.", "second"),
]

MAPPEN = [
    (2, "Marschbuch", "Märsche und Ausrückungen"),
    (5, "Konzertmappe", "Sommerkonzerte und laufendes Repertoire"),
    (13, "Jahreskonzert", "Aktuelle Konzertliteratur"),
]


def esc(value):
    if value is None:
        return ""
    return html.escape(str(value), quote=True)


def load_mappe(conn, nr_mappe):
    query = """
        SELECT
            mm.PositionsNr AS position,
            ms.TITEL AS titel,
            ma.Art AS art,
            komponist.Komponist AS komponist,
            arrangeur.Komponist AS arrangeur,
            CASE
                WHEN ms.Ablage IS NULL THEN ''
                ELSE CAST(CAST(ms.Ablage AS INTEGER) AS TEXT)
            END AS ablage
        FROM "tblMappen-Musikstücke" AS mm
        LEFT JOIN tblMusikstücke AS ms ON mm.NrStück = ms.ID
        LEFT JOIN tblMusikart AS ma ON ms.Musikart = ma.ID
        LEFT JOIN tblKomponist AS komponist ON ms.Komponist = komponist.ID
        LEFT JOIN tblKomponist AS arrangeur ON ms.Arrangeur = arrangeur.ID
        WHERE mm.NrMappe = ?
        ORDER BY mm.PositionsNr;
    """
    return [dict(row) for row in conn.execute(query, (nr_mappe,))]


def render_table(rows):
    if not rows:
        return '<p class="musik-empty">Keine Stücke in dieser Mappe gefunden.</p>'

    formatAblage = lambda a : f"{a[:2]}-{a[2:]}" if len(a) == 4 else a

    body = "\n".join(
        f"""
        <tr>
          <td data-label="Nr.">{esc(row["position"])}</td>
          <td data-label="Titel" class="musik-title-cell">{esc(row["titel"])}</td>
          <td data-label="Art">{esc(row["art"])}</td>
          <td data-label="Komponist">{esc(row["komponist"])}</td>
          <td data-label="Arrangeur">{esc(row["arrangeur"])}</td>
          <td data-label="Ablage">{esc(formatAblage(row["ablage"]))}</td>
        </tr>"""
        for row in rows
    )

    return f"""
      <div class="musik-table-wrap">
        <table class="musik-table">
          <thead>
            <tr>
              <th data-sort-type="number" aria-sort="none"><button type="button" class="musik-sort-button">Nr.</button></th>
              <th data-sort-type="text" aria-sort="none"><button type="button" class="musik-sort-button">Titel</button></th>
              <th data-sort-type="text" aria-sort="none"><button type="button" class="musik-sort-button">Art</button></th>
              <th data-sort-type="text" aria-sort="none"><button type="button" class="musik-sort-button">Komponist</button></th>
              <th data-sort-type="text" aria-sort="none"><button type="button" class="musik-sort-button">Arrangeur</button></th>
              <th data-sort-type="number" aria-sort="none"><button type="button" class="musik-sort-button">Ablage</button></th>
            </tr>
          </thead>
          <tbody>{body}
          </tbody>
        </table>
      </div>"""


def render_pdf_links():
    links = "\n".join(
        f"""        <a class="musik-pdf-card" href="assets/{esc(filename)}" target="_blank" rel="noopener">
          <strong>{esc(title)}</strong>
          <small>{esc(description)}</small>
        </a>"""
        for filename, title, description, _ in PDF_OUTPUTS
    )

    return f"""    <div class="musik-pdf-links" aria-label="PDF-Dokumente">
{links}
    </div>"""


def render_page(mappen_data, generated_at):
    nav_cards = "\n".join(
        f"""
        <a class="musik-set-card" href="#mappe-{nr}">
          <span class="musik-set-count">{len(rows)}</span>
          <span>
            <strong>{esc(title)}</strong>
            <small>{esc(description)}</small>
          </span>
        </a>"""
        for nr, title, description, rows in mappen_data
    )

    sections = "\n".join(
        f"""
        <section class="musik-set-section" id="mappe-{nr}">
          <div class="musik-set-heading">
            <div>
              <div class="section-label">Mappe {nr}</div>
              <h2>{esc(title)}</h2>
              <p>{esc(description)}</p>
            </div>
            <div class="musik-set-total">{len(rows)} Stücke</div>
          </div>
          {render_table(rows)}
        </section>"""
        for nr, title, description, rows in mappen_data
    )

    return f"""<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Musikarchiv – Trachtenkapelle Riezlern</title>
  <meta name="description" content="Interne Übersicht aktueller Musikmappen der Trachtenkapelle Riezlern." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
  <link rel="icon" type="image/png" href="images/logo.png" />
</head>
<body>
<div id="site-header"></div>

<div class="page-hero musik-hero">
  <img src="images/hero/noten_posaune.jpg" alt="Noten und Posaune" />
  <div class="page-hero-content">
    <div class="hero-eyebrow">Interner Überblick</div>
    <h1>Musikarchiv</h1>
  </div>
</div>

<section class="musik-page">
  <div class="musik-intro">
    <div class="section-label">Aktuelle Mappen</div>
    <h2 class="section-title">Musiksets der Trachtenkapelle</h2>
    <p>Diese statische Übersicht wird aus <code>data/musik.db</code> generiert und zeigt die aktuell relevanten Mappen für Marschbuch, Konzertmappe und Jahreskonzert.</p>
    <p class="musik-generated">Datenbankstand: {esc(generated_at)}</p>
    {render_pdf_links()}
  </div>

  <div class="musik-set-nav">
    {nav_cards}
  </div>

  {sections}
</section>

<div id="site-footer"></div>
<script src="main.js"></script>
</body>
</html>
"""

def create_csv(data, out_path):
    if not data:
        return
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, 'w', newline='', encoding="utf-8") as file:
        w = csv.writer(file)
        w.writerow(data[0].keys())
        for d in data:
            w.writerow(d.values())


def create_pdf_csvs(mappen_data):
    for _, title, _, rows in mappen_data:
        create_csv(rows, PDFCREATOR_DIR / f"{title}.csv")


def build_pdfs(mode="auto"):
    if mode == "never":
        return

    typst = shutil.which("typst")
    if not typst:
        message = "Typst nicht gefunden – PDF-Erzeugung übersprungen."
        if mode == "always":
            raise RuntimeError(message)
        print(f"⚠️  {message}")
        return

    if not TYPST_DOCUMENT.exists():
        raise FileNotFoundError(f"Typst-Dokument nicht gefunden: {TYPST_DOCUMENT}")

    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    for filename, _, _, output_name in PDF_OUTPUTS:
        out_path = ASSETS_DIR / filename
        subprocess.run(
            [
                typst,
                "compile",
                "--font-path",
                str(PDFCREATOR_DIR / "fonts"),
                TYPST_DOCUMENT.name,
                str(out_path),
                "--input",
                f"output={output_name}",
            ],
            cwd=PDFCREATOR_DIR,
            check=True,
        )
        print(f"✅ PDF erzeugt → {out_path}")


def db_changed_at(db_path):
    db_path = Path(db_path)
    try:
        relative_db_path = db_path.relative_to(ROOT)
    except ValueError:
        relative_db_path = db_path

    try:
        status = subprocess.run(
            ["git", "status", "--porcelain", "--", str(relative_db_path)],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        if status.stdout.strip():
            return datetime.fromtimestamp(db_path.stat().st_mtime)

        last_commit = subprocess.run(
            ["git", "log", "-1", "--format=%ct", "--", str(relative_db_path)],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        timestamp = last_commit.stdout.strip()
        if timestamp:
            return datetime.fromtimestamp(int(timestamp))
    except (subprocess.CalledProcessError, ValueError):
        pass

    return datetime.fromtimestamp(db_path.stat().st_mtime)


def build(db_path=DEFAULT_DB, out_path=DEFAULT_OUT, pdfs="auto"):
    db_path = Path(db_path)
    out_path = Path(out_path)
    if not db_path.exists():
        raise FileNotFoundError(f"Datenbank nicht gefunden: {db_path}")

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    with conn:
        mappen_data = [
            (nr, title, description, load_mappe(conn, nr))
            for nr, title, description in MAPPEN
        ]

    generated_at = db_changed_at(db_path).strftime("%d.%m.%Y")
    html_text = render_page(mappen_data, generated_at)
    out_path.write_text(html_text, encoding="utf-8")

    create_pdf_csvs(mappen_data)
    build_pdfs(pdfs)

    total = sum(len(rows) for _, _, _, rows in mappen_data)
    print(f"✅ {total} Stücke aus {len(MAPPEN)} Mappen → {out_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default=str(DEFAULT_DB))
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    parser.add_argument(
        "--pdfs",
        choices=["auto", "always", "never"],
        default="auto",
        help="PDFs mit Typst erzeugen: auto überspringt ohne Typst, always bricht ohne Typst ab, never überspringt immer.",
    )
    args = parser.parse_args()
    build(args.db, args.out, args.pdfs)


if __name__ == "__main__":
    main()
