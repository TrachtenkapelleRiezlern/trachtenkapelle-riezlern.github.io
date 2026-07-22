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
import sqlite3
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
DEFAULT_DB = ROOT / "data" / "musik.db"
DEFAULT_OUT = ROOT / "musik.html"

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

    body = "\n".join(
        f"""
        <tr>
          <td data-label="Nr.">{esc(row["position"])}</td>
          <td data-label="Titel" class="musik-title-cell">{esc(row["titel"])}</td>
          <td data-label="Art">{esc(row["art"])}</td>
          <td data-label="Komponist">{esc(row["komponist"])}</td>
          <td data-label="Arrangeur">{esc(row["arrangeur"])}</td>
          <td data-label="Ablage">{esc(row["ablage"])}</td>
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


def build(db_path=DEFAULT_DB, out_path=DEFAULT_OUT):
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

    generated_at = datetime.fromtimestamp(db_path.stat().st_mtime).strftime("%d.%m.%Y %H:%M")
    html_text = render_page(mappen_data, generated_at)
    out_path.write_text(html_text, encoding="utf-8")

    total = sum(len(rows) for _, _, _, rows in mappen_data)
    print(f"✅ {total} Stücke aus {len(MAPPEN)} Mappen → {out_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default=str(DEFAULT_DB))
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    args = parser.parse_args()
    build(args.db, args.out)


if __name__ == "__main__":
    main()
