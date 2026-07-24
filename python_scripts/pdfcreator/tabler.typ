#let km = csv("Konzertmappe.csv").slice(1)
#let mb = csv("Marschbuch.csv").slice(1)

#let mbTOC = mb.map(x => (x.at(0), x.at(1)))

#set page(
  margin: (
    top: 16mm,
    bottom: 16mm,
  ),
)

#set text(lang: "de")

#let artShort = (
  "Solostück": "Sol",
  "Marsch": "Mar",
  "Polka": "Polk",
  "Walzer": "Wal",
  "Potpourri": "Potp",
  "Sonstiges": "Sons",
  "Messe-Choral": "Cho",
  "Filmmusik": "Film",
  "Weihnachten": "Wei",
  "Musical": "Mus",
  "Rock-Pop": "Pop",
  "Ouvertüre": "Ouv",
  "Konzertstück": "Kon",
  "Ensemble": "Ens",
  "Übungen": "Übu",
)

#let bigTOC = {
  set page(footer: context [
    #let months = (
      "Januar",
      "Februar",
      "März",
      "April",
      "Mai",
      "Juni",
      "Juli",
      "August",
      "September",
      "Oktober",
      "November",
      "Dezember",
    )

    #let today = datetime.today()
    #align(right)[
      #text(size: 8pt, fill: luma(50%))[
        Stand · #months.at(today.month() - 1) #today.year()
      ]
    ]
  ])
  set table(
    stroke: (
      x: 0.4pt + rgb("#cccccc"),
      y: 0.4pt + rgb("#cccccc"),
    ),
    inset: (x: 8pt, y: 5pt),
    gutter: 0pt,
    fill: (x, y) => {
      if y == 0 {
        rgb("#e8eef7") // header
      } else if calc.odd(y) {
        rgb("#f9f9f9") // zebra stripes
      } else {
        white
      }
    },
    align: (x, y) => {
      if y == 0 {
        center + horizon
      } else if x == 0 {
        right
      } else {
        left
      }
    },
  )

  set text(
    font: "Libertinus Sans",
    size: 10pt,
  )

  show heading.where(level: 1): it => {
    set text(
      font: "Libertinus Sans",
      weight: "bold",
      size: 15pt,
    )
    it
  }

  let trim = (s, maxLen) => {
    if s.len() > maxLen {
      [#s.slice(0, maxLen - 2)...]
    } else {
      s
    }
  }

  let splitAblage = s => {
    if s.len() == 4 {
      [#s.slice(0, 2)-#s.slice(2)]
    } else {
      s
    }
  }

  km = km.map(x => (
    x.at(0),
    x.at(1),
    trim(x.at(3), 20),
    x.at(2),
    splitAblage(x.at(5)),
  ))
  mb = mb.map(x => (
    x.at(0),
    x.at(1),
    trim(x.at(3), 20),
    x.at(2),
    splitAblage(x.at(5)),
  ))

  let headerImage = block(width: 100%)[
    #place(
      top + right,
      dy: -1.5mm,
      image("logo.svg", width: 2.5cm),
    )
  ]

  page[
    #let kmT = km.map(x => (
      x.at(0),
      trim(x.at(1), 25),
      artShort.at(x.at(3)),
      x.at(4),
    ))
    #let mbT = mb.map(x => (
      x.at(0),
      trim(x.at(1), 25),
      artShort.at(x.at(3)),
      x.at(4),
    ))
    #headerImage
    #set table(inset: (x: 6pt, y: 5pt))
    #columns(2, [
      = Konzertmappe
      #table(
        columns: (auto, 1fr, auto, auto),
        [*Nr*], [*Titel*], [*Art*], [*Abl*],
        ..kmT.flatten(),
      )

      #colbreak()

      = Marschbuch
      #table(
        columns: (auto, 1fr, auto, auto),
        [*Nr*], [*Titel*], [*Art*], [*Abl*],
        ..mbT.flatten(),
      )
    ])
  ]

  let headerImage = block(width: 100%)[
    #place(
      top + right,
      dy: -1.5mm,
      image("logo.svg", width: 3cm),
    )
  ]

  page[
    #headerImage
    = Konzertmappe
    #table(
      columns: (auto, 1fr, auto, auto, auto),
      [*Nr*], [*Titel*], [*Komponist*], [*Art*], [*Ablage*],
      ..km.flatten(),
    )
  ]

  page[
    #headerImage
    = Marschbuch
    #table(
      columns: (auto, 1fr, auto, auto, auto),
      [*Nr*], [*Titel*], [*Komponist*], [*Art*], [*Ablage*],
      ..mb.flatten(),
    )
  ]
}

#let mbBack = {
  let width = 165mm
  let height = 119mm
  let padding = 6mm

  set text(
    font: "Carlito",
  )
  //set text(font: "Trebuchet MS")
  set place(center + horizon)
  set box(width: width, height: height, inset: padding)

  let drawTOC = alignment => {
    let mid = calc.ceil(mbTOC.len() / 2)
    let leftHalf = mbTOC.slice(0, mid)
    let rightHalf = mbTOC.slice(mid)

    place(
      alignment,
      align(center + horizon, box(
        width: width,
        height: height,
        outset: -padding,
        radius: 3mm,
        stroke: 1.2pt + black.transparentize(30%),
      )[
        #let toc-col(items) = {
          table(
            columns: (10mm, 1fr),
            align: (right, left),
            gutter: 2mm,
            row-gutter: -1.2mm,
            stroke: none,
            ..items
              .map(item => (
                text(item.at(0), size: 11pt),
                text(item.at(1), size: 11pt),
              ))
              .flatten()
          )
        }

        #grid(
          columns: (1fr, 1fr),
          gutter: 6mm,
          toc-col(leftHalf), toc-col(rightHalf),
        )
      ]),
    )
  }

  page(
    margin: (x: 0mm, y: 0mm),
    background: {
      set line(stroke: (paint: gray.transparentize(10%), dash: "dashed"))
      place(top + left, line(start: (0mm, height), end: (100%, height)))
      place(top + left, line(start: (0mm, 100% - height), end: (100%, 100% - height)))
      place(top + left, line(start: (width, 0mm), end: (width, 100%)))
    },
    [
      #drawTOC(top + left)
      #drawTOC(bottom + left)
      #place(bottom + right, dy: -padding, dx: -padding, [
        #let months = (
          "Januar",
          "Februar",
          "März",
          "April",
          "Mai",
          "Juni",
          "Juli",
          "August",
          "September",
          "Oktober",
          "November",
          "Dezember",
        )

        #let today = datetime.today()
        #align(right)[
          #text(size: 8pt, fill: luma(50%))[
            Beidseitig drucken\
            Skalierung auf 100% setzen

            Stand · #months.at(today.month() - 1) #today.year()
          ]
        ]
      ])
    ],
  )

  let drawBack = alignment => {
    place(alignment, align(bottom + right, box(
      width: width,
      height: height,
      outset: -padding,
    )[
      #grid(
        columns: (15mm, auto, 15mm),
        gutter: (10pt, 20pt),
        align(center + horizon, image("logosolo.svg")),
        align(left + horizon, text("Trachtenkapelle Riezlern\nA-6991 Riezlern", size: 12pt)),
        image("tkqr.png"),
      )
    ]))
  }

  page(
    margin: (x: 0mm, y: 0mm),
    background: {
      set line(stroke: (paint: gray.transparentize(10%), dash: "dashed"))
      place(top + left, line(start: (0mm, height), end: (100%, height)))
      place(top + left, line(start: (0mm, 100% - height), end: (100%, 100% - height)))
      place(top + left, line(start: (100% - width, 0mm), end: (100% - width, 100%)))
    },
    [
      #drawBack(top + right)
      #drawBack(bottom + right)
    ],
  )
}

#let output = sys.inputs.at("output", default: "all")
#if output == "first" {
  bigTOC
} else if output == "second" {
  mbBack
} else {
  bigTOC
  mbBack
}
