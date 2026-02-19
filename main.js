/* ══════════════════════════════════════════════
   TRACHTENKAPELLE RIEZLERN – main.js
   ══════════════════════════════════════════════ */

const TERMINE_INDEX   = 'Termine/index.json';
const AKTUELLES_INDEX = 'Aktuelles/index.json';
const MAX_HERO_TERMINE   = 5;
const MAX_NEWS_HOME      = 3;
const TERMINE_INITIAL    = 5;   // sichtbar bevor "mehr anzeigen" geklickt wird

const MONTH_SHORT = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const MONTH_LONG  = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const WEEKDAYS    = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
const KATEGORIE_LABEL = {
  konzert:'Konzert', prozession:'Prozession', fest:'Fest',
  auswaerts:'Auswärtsspiel', sonstiges:'Sonstiges'
};

// ── HAMBURGER ────────────────────────────────────────────────────────────────
function initHamburger() {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!hamburger || !mobileMenu) return;
  hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
  });
  mobileMenu.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
    })
  );
  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
    }
  });
}

// ── SLIDESHOW ────────────────────────────────────────────────────────────────
function initSlideshow() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.hero-dot');
  if (!slides.length) return;
  let current = 0, interval;
  function goTo(n) {
    slides[current].classList.remove('active');
    if (dots[current]) dots[current].classList.remove('active');
    current = (n + slides.length) % slides.length;
    slides[current].classList.add('active');
    if (dots[current]) dots[current].classList.add('active');
  }
  dots.forEach(dot => dot.addEventListener('click', () => {
    clearInterval(interval);
    goTo(+dot.dataset.index);
    interval = setInterval(() => goTo(current + 1), 5500);
  }));
  interval = setInterval(() => goTo(current + 1), 5500);
}

// ── ACTIVE NAV ───────────────────────────────────────────────────────────────
function initActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href !== '#' && href !== '' && page === href) a.classList.add('active');
  });
}

// ── DATUM HELPER ─────────────────────────────────────────────────────────────
function parseDatum(t) {
  const d = new Date(t.datum + 'T00:00:00');
  return {
    day:       d.getDate(),
    month:     MONTH_SHORT[d.getMonth()],
    monthLong: MONTH_LONG[d.getMonth()],
    weekday:   WEEKDAYS[d.getDay()],
    year:      d.getFullYear(),
    time:      t.uhrzeit ? `${t.uhrzeit} Uhr` : 'Ganztags',
  };
}

function formatDateDisplay(datum) {
  const d = new Date(datum + 'T00:00:00');
  return `${d.getDate()}. ${MONTH_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

function isFuture(datum) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(datum + 'T00:00:00') >= today;
}

// ── LOADERS ───────────────────────────────────────────────────────────────────
async function loadIndex(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} nicht gefunden (${res.status})`);
  return res.json();
}

async function loadMeta(ordner, base) {
  const res = await fetch(`${base}/${ordner}/meta.json`);
  if (!res.ok) throw new Error(res.status);
  return { ...(await res.json()), _ordner: ordner };
}

async function loadTermine() {
  const index = await loadIndex(TERMINE_INDEX);
  const results = await Promise.allSettled(index.map(e => loadMeta(e.ordner, 'Termine')));
  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value)
    .filter(t => isFuture(t.datum))           // vergangene herausfiltern
    .sort((a, b) => new Date(a.datum) - new Date(b.datum));
}

async function loadAktuelles() {
  const index = await loadIndex(AKTUELLES_INDEX);
  const results = await Promise.allSettled(index.map(e => loadMeta(e.ordner, 'Aktuelles')));
  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value)
    .sort((a, b) => new Date(b.datum) - new Date(a.datum));
}

// ── HERO TERMINE STRIP ───────────────────────────────────────────────────────
function renderHeroTermine(termine) {
  const list = document.getElementById('heroTermineList');
  if (!list) return;
  list.classList.remove('loading');
  list.innerHTML = '';

  if (!termine.length) {
    list.innerHTML = '<span style="color:rgba(255,255,255,0.4);padding:0 24px;font-size:0.8rem;">Keine bevorstehenden Termine</span>';
    return;
  }

  termine.slice(0, MAX_HERO_TERMINE).forEach(t => {
    const { day, month, time } = parseDatum(t);
    const el = document.createElement('div');
    el.className = 'hero-termin';
    el.innerHTML = `
      <div class="ht-date"><div class="ht-day">${day}</div><div class="ht-month">${month}</div></div>
      <div class="ht-divider"></div>
      <div class="ht-info">
        <div class="ht-title">${t.titel}</div>
        <div class="ht-details">${t.ort ? t.ort + ' · ' : ''}${time}</div>
      </div>`;
    list.appendChild(el);
  });
}

// ── TERMINE PAGE mit "Mehr anzeigen" ─────────────────────────────────────────
let _allTermine = [];

function renderTerminePage(termine, filter = 'all') {
  const container = document.getElementById('termineList');
  const moreBtn   = document.getElementById('termineMoreBtn');
  if (!container) return;
  document.getElementById('termineLoading')?.remove();

  const filtered = filter === 'all'
    ? termine
    : termine.filter(t => (t.kategorie || 'sonstiges') === filter);

  container.innerHTML = '';

  if (!filtered.length) {
    container.innerHTML = '<div class="termine-empty">Keine Termine in dieser Kategorie.</div>';
    if (moreBtn) moreBtn.style.display = 'none';
    return;
  }

  // Erste 5 sichtbar, Rest versteckt
  filtered.forEach((t, idx) => {
    const { day, month, monthLong, weekday, year, time } = parseDatum(t);
    const kat  = KATEGORIE_LABEL[t.kategorie] || 'Veranstaltung';
    const bild = t.bilder?.length ? `Termine/${t._ordner}/${t.bilder[0]}` : null;

    const card = document.createElement('div');
    card.className = 'termin-card' + (idx >= TERMINE_INITIAL ? ' termin-hidden' : '');
    card.innerHTML = `
      <div class="tc-date"><div class="tc-day">${day}</div><div class="tc-month">${month}</div></div>
      <div class="tc-info">
        <div class="tc-title">${t.titel}</div>
        <div class="tc-meta">
          ${weekday}, ${day}. ${monthLong} ${year}
          ${t.uhrzeit ? ' · ' + time : ''}
          ${t.ort     ? ' · ' + t.ort  : ''}
        </div>
        ${t.beschreibung ? `<div class="tc-desc">${t.beschreibung.substring(0,160)}${t.beschreibung.length>160?'…':''}</div>` : ''}
        ${t.eintritt    ? `<div class="tc-eintritt">🎟 Eintritt: ${t.eintritt}</div>` : ''}
      </div>
      <div class="tc-right">
        ${bild ? `<img class="tc-img" src="${bild}" alt="${t.titel}" loading="lazy" />` : ''}
        <span class="tc-badge">${kat}</span>
      </div>`;
    container.appendChild(card);
  });

  // "Mehr anzeigen"-Button
  if (moreBtn) {
    if (filtered.length > TERMINE_INITIAL) {
      moreBtn.style.display = '';
      moreBtn.textContent = `Alle ${filtered.length} Termine anzeigen ▾`;
      moreBtn.onclick = () => {
        container.querySelectorAll('.termin-hidden').forEach(el => el.classList.remove('termin-hidden'));
        moreBtn.style.display = 'none';
      };
    } else {
      moreBtn.style.display = 'none';
    }
  }
}

function initTermineFilter() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTerminePage(_allTermine, btn.dataset.filter);
    });
  });
}

// ── NEWS CARDS – Startseite ───────────────────────────────────────────────────
function renderNewsCards(beitraege) {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  beitraege.slice(0, MAX_NEWS_HOME).forEach((b, i) => {
    const bildSrc = b.titelbild
      ? `Aktuelles/${b._ordner}/${b.titelbild}`
      : 'images/general/placeholder.jpg';

    const card = document.createElement('a');
    card.href      = `artikel.html?id=${b._ordner}`;
    card.className = 'news-card' + (i === 0 ? ' featured' : '');
    card.innerHTML = `
      <img class="news-card-img" src="${bildSrc}" alt="${b.titel}" loading="lazy" />
      <div class="news-card-body">
        <div class="news-card-date">${formatDateDisplay(b.datum)}</div>
        <h3 class="news-card-title">${b.titel}</h3>
        <p class="news-card-text">${(b.beschreibung||'').substring(0,120)}${(b.beschreibung||'').length>120?'…':''}</p>
      </div>`;
    grid.appendChild(card);
  });
}

// ── AKTUELLES PAGE ────────────────────────────────────────────────────────────
function renderAktuellesPage(beitraege) {
  const grid = document.getElementById('aktuellesGrid');
  if (!grid) return;
  document.getElementById('aktuellesLoading')?.remove();
  grid.innerHTML = '';

  if (!beitraege.length) {
    grid.innerHTML = '<div class="termine-empty">Noch keine Beiträge vorhanden.</div>';
    return;
  }

  beitraege.forEach(b => {
    const bildSrc = b.titelbild
      ? `Aktuelles/${b._ordner}/${b.titelbild}`
      : 'images/general/placeholder.jpg';

    const card = document.createElement('a');
    card.href      = `artikel.html?id=${b._ordner}`;
    card.className = 'news-card';
    card.innerHTML = `
      <img class="news-card-img" src="${bildSrc}" alt="${b.titel}" loading="lazy" />
      <div class="news-card-body">
        <div class="news-card-date">${formatDateDisplay(b.datum)}</div>
        <h3 class="news-card-title">${b.titel}</h3>
        <p class="news-card-text">${(b.beschreibung||'').substring(0,160)}${(b.beschreibung||'').length>160?'…':''}</p>
        <span class="news-card-more">Weiterlesen →</span>
      </div>`;
    grid.appendChild(card);
  });
}

// ── ARTIKEL PAGE ──────────────────────────────────────────────────────────────
async function initArtikelPage() {
  const container = document.getElementById('artikelContent');
  if (!container) return;

  const params  = new URLSearchParams(window.location.search);
  const ordner  = params.get('id');
  if (!ordner) {
    container.innerHTML = '<p>Kein Beitrag ausgewählt.</p>';
    return;
  }

  try {
    const meta = await loadMeta(ordner, 'Aktuelles');

    // Seitentitel setzen
    document.title = `${meta.titel} – Trachtenkapelle Riezlern`;
    const titleEl = document.getElementById('artikelTitel');
    const dateEl  = document.getElementById('artikelDatum');
    if (titleEl) titleEl.textContent = meta.titel;
    if (dateEl)  dateEl.textContent  = formatDateDisplay(meta.datum);

    // Bilder
    const bilder = meta.bilder || (meta.titelbild ? [meta.titelbild] : []);
    let bilderHtml = '';
    if (bilder.length) {
      bilderHtml = `<div class="artikel-bilder">` +
        bilder.map(b => `<img src="Aktuelles/${ordner}/${b}" alt="${meta.titel}" loading="lazy" />`).join('') +
        `</div>`;
    }

    container.innerHTML = `
      ${bilderHtml}
      <div class="artikel-text">
        ${meta.beschreibung ? `<p>${meta.beschreibung.replace(/\n/g, '</p><p>')}</p>` : '<p>Kein Text vorhanden.</p>'}
      </div>`;
  } catch (e) {
    container.innerHTML = '<p>Beitrag konnte nicht geladen werden.</p>';
  }
}

// ── GALERIE – Unterseite ──────────────────────────────────────────────────────
// Wenn gallery.html?album=xyz aufgerufen wird, werden Bilder aus images/gallery/xyz/ geladen.
// Da wir kein serverseitiges Listing haben, lesen wir ein optionales gallery-index.json.
async function initGalleryPage() {
  const container = document.getElementById('galleryContent');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const album  = params.get('album');
  if (!album) { container.innerHTML = '<p>Kein Album ausgewählt.</p>'; return; }

  const titleEl = document.getElementById('galleryTitel');

  try {
    const res  = await fetch(`images/gallery/${album}/index.json`);
    const data = await res.json();
    if (titleEl) titleEl.textContent = data.titel || album;

    container.innerHTML = `<div class="gallery-grid">` +
      (data.bilder || []).map(b => `
        <div class="g-item">
          <img src="images/gallery/${album}/${b}" alt="${data.titel||album}" loading="lazy" />
          <div class="g-overlay">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
        </div>`).join('') +
      `</div>`;
  } catch {
    container.innerHTML = `<p>Album nicht gefunden. Bitte <code>images/gallery/${album}/index.json</code> anlegen.</p>`;
  }
}

// ── INIT ──────────────────────────────────────────────────────────────────────
async function initTermine() {
  const hasHero = !!document.getElementById('heroTermineList');
  const hasPage = !!document.getElementById('termineList');
  if (!hasHero && !hasPage) return;

  try {
    _allTermine = await loadTermine();
    if (hasHero) renderHeroTermine(_allTermine);
    if (hasPage) { initTermineFilter(); renderTerminePage(_allTermine, 'all'); }
  } catch (err) {
    console.warn('Termine:', err.message);
    const heroList = document.getElementById('heroTermineList');
    if (heroList) { heroList.classList.remove('loading'); heroList.innerHTML = ''; }
    const tl = document.getElementById('termineList');
    if (tl) {
      document.getElementById('termineLoading')?.remove();
      tl.innerHTML = '<div class="termine-empty">Termine konnten nicht geladen werden.</div>';
    }
  }
}

async function initAktuelles() {
  const hasHome     = !!document.getElementById('newsGrid');
  const hasAktuelles = !!document.getElementById('aktuellesGrid');
  if (!hasHome && !hasAktuelles) return;

  try {
    const beitraege = await loadAktuelles();
    if (hasHome)      renderNewsCards(beitraege);
    if (hasAktuelles) renderAktuellesPage(beitraege);
  } catch (err) {
    console.warn('Aktuelles:', err.message);
    const g = document.getElementById('aktuellesGrid');
    if (g) { document.getElementById('aktuellesLoading')?.remove(); g.innerHTML = '<div class="termine-empty">Konnte nicht geladen werden.</div>'; }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  initSlideshow();
  initActiveNav();
  initTermine();
  initAktuelles();
  initArtikelPage();
  initGalleryPage();
});