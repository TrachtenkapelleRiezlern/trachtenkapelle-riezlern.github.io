/* ══════════════════════════════════════════════
   TRACHTENKAPELLE RIEZLERN – main.js
   ══════════════════════════════════════════════ */

const TERMINE_INDEX  = 'Termine/index.json';
const AKTUELLES_INDEX = 'Aktuelles/index.json';
const MAX_HERO_TERMINE = 5;
const MAX_NEWS_HOME    = 3;

const MONTH_SHORT = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const MONTH_LONG  = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const WEEKDAYS    = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
const KATEGORIE_LABEL = { konzert:'Konzert', prozession:'Kirchliches', fest:'Fest', auswaerts:'Auswärtsspiel', sonstiges:'Sonstiges' };

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
    a.addEventListener('click', () => { mobileMenu.classList.remove('open'); hamburger.classList.remove('open'); })
  );
  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open'); hamburger.classList.remove('open');
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
    clearInterval(interval); goTo(+dot.dataset.index);
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

// ── GENERIC JSON LOADER ──────────────────────────────────────────────────────
async function loadIndex(indexPath) {
  const res = await fetch(indexPath);
  if (!res.ok) throw new Error(`${indexPath} nicht gefunden (${res.status})`);
  return res.json();
}

async function loadMeta(ordner, base) {
  const res = await fetch(`${base}/${ordner}/meta.json`);
  if (!res.ok) throw new Error(`meta.json nicht gefunden für ${ordner}`);
  const meta = await res.json();
  return { ...meta, _ordner: ordner };
}

// ── TERMINE LOADER ───────────────────────────────────────────────────────────
async function loadTermine() {
  const index = await loadIndex(TERMINE_INDEX);
  const now = new Date(); now.setHours(0,0,0,0);

  const results = await Promise.allSettled(
    index.map(e => loadMeta(e.ordner, 'Termine'))
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value)
    .filter(t => new Date(t.datum + 'T00:00:00') >= now)
    .sort((a,b) => new Date(a.datum) - new Date(b.datum));
}

// ── AKTUELLES LOADER ─────────────────────────────────────────────────────────
async function loadAktuelles() {
  const index = await loadIndex(AKTUELLES_INDEX);

  const results = await Promise.allSettled(
    index.map(e => loadMeta(e.ordner, 'Aktuelles'))
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value)
    .sort((a,b) => new Date(b.datum) - new Date(a.datum)); // neueste zuerst
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

// ── NEWS CARDS (Startseite) ───────────────────────────────────────────────────
function renderNewsCards(beitraege) {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;

  grid.innerHTML = '';
  const items = beitraege.slice(0, MAX_NEWS_HOME);

  items.forEach((b, i) => {
    const bildSrc = b.titelbild
      ? `Aktuelles/${b._ordner}/${b.titelbild}`
      : 'images/general/placeholder.jpg';
    const dateStr = formatDateDisplay(b.datum);

    const card = document.createElement('a');
    card.href = `aktuelles.html#${b._ordner}`;
    card.className = 'news-card' + (i === 0 ? ' featured' : '');
    card.innerHTML = `
      <img class="news-card-img" src="${bildSrc}" alt="${b.titel}" loading="lazy" />
      <div class="news-card-body">
        <div class="news-card-date">${dateStr}</div>
        <h3 class="news-card-title">${b.titel}</h3>
        <p class="news-card-text">${(b.beschreibung || '').substring(0, 120)}${(b.beschreibung||'').length > 120 ? '…' : ''}</p>
      </div>`;
    grid.appendChild(card);
  });
}

// ── TERMINE PAGE ──────────────────────────────────────────────────────────────
let _allTermine = [];

const TERMINE_INITIAL = 5;  // sichtbar bevor "mehr anzeigen" geklickt wird

function renderTerminePage(termine, filter = 'all') {
  const container = document.getElementById('termineList');
  const moreBtn   = document.getElementById('termineMoreBtn');
  if (!container) return;
  document.getElementById('termineLoading')?.remove();

  const filtered = filter === 'all' ? termine : termine.filter(t => (t.kategorie||'sonstiges') === filter);
  container.innerHTML = '';

  if (!filtered.length) {
    container.innerHTML = '<div class="termine-empty">Keine Termine in dieser Kategorie.</div>';
    if (moreBtn) moreBtn.style.display = 'none';
    return;
  }

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
    const dateStr = formatDateDisplay(b.datum);

    const card = document.createElement('a');
    card.href  = '#' + b._ordner;
    card.id    = b._ordner;
    card.className = 'news-card';
    card.innerHTML = `
      <img class="news-card-img" src="${bildSrc}" alt="${b.titel}" loading="lazy" />
      <div class="news-card-body">
        <div class="news-card-date">${dateStr}</div>
        <h3 class="news-card-title">${b.titel}</h3>
        <p class="news-card-text">${b.beschreibung || ''}</p>
      </div>`;
    grid.appendChild(card);
  });
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
    console.warn('Termine Ladefehler:', err.message);
    const heroList = document.getElementById('heroTermineList');
    if (heroList) { heroList.classList.remove('loading'); heroList.innerHTML = ''; }
    const termineList = document.getElementById('termineList');
    if (termineList) {
      document.getElementById('termineLoading')?.remove();
      termineList.innerHTML = '<div class="termine-empty">Termine konnten nicht geladen werden.<br/><small>Bitte <code>build_termine.py</code> ausführen und <code>Termine/index.json</code> prüfen.</small></div>';
    }
  }
}

async function initAktuelles() {
  const hasNewsGrid    = !!document.getElementById('newsGrid');
  const hasAktuellesGrid = !!document.getElementById('aktuellesGrid');
  if (!hasNewsGrid && !hasAktuellesGrid) return;

  try {
    const beitraege = await loadAktuelles();
    if (hasNewsGrid)      renderNewsCards(beitraege);
    if (hasAktuellesGrid) renderAktuellesPage(beitraege);
  } catch (err) {
    console.warn('Aktuelles Ladefehler:', err.message);
    const grid = document.getElementById('aktuellesGrid');
    if (grid) {
      document.getElementById('aktuellesLoading')?.remove();
      grid.innerHTML = '<div class="termine-empty">Beiträge konnten nicht geladen werden.<br/><small>Bitte <code>build_aktuelles.py</code> ausführen.</small></div>';
    }
  }
}

// (boot moved to injectHeaderFooter block below)

// ── HEADER / FOOTER INJECT ────────────────────────────────────────────────────
// HTML is inlined here – no fetch() needed, works locally and on GitHub Pages.

const HEADER_HTML = `<!-- ════════════════════════════════
   _header.html  — include in every page
   Usage: copy <nav> and <div class="mobile-menu"> into your page
   ════════════════════════════════ -->

<nav>
  <a class="nav-logo" href="index.html" aria-label="Trachtenkapelle Riezlern – Startseite">
    <img src="images/logo.svg" alt="Trachtenkapelle Riezlern" class="nav-logo-img" />
  </a>
  <ul class="nav-links">
    <li><a href="index.html">Startseite</a></li>
    <li><a href="verein.html">Verein</a></li>
    <li><a href="termine.html">Termine</a></li>
    <li><a href="aktuelles.html">Aktuelles</a></li>
    <li><a href="konzerte.html">Konzerte</a></li>
    <li><a href="bilder.html">Bilder &amp; Videos</a></li>
    <li><a href="index.html#instagram">Instagram</a></li>
    <li><a href="kontakt.html" class="nav-btn">Kontakt</a></li>
  </ul>
  <button class="nav-hamburger" id="hamburger" aria-label="Menü öffnen" aria-expanded="false">
    <span></span><span></span><span></span>
  </button>
</nav>

<div class="mobile-menu" id="mobileMenu" role="navigation" aria-label="Mobile Navigation">
  <a href="index.html">Startseite</a>
  <a href="verein.html">Verein</a>
  <a href="termine.html">Termine</a>
  <a href="aktuelles.html">Aktuelles</a>
  <a href="konzerte.html">Konzerte</a>
  <a href="bilder.html">Bilder &amp; Videos</a>
  <a href="index.html#instagram">Instagram</a>
  <a href="kontakt.html" class="m-btn">Kontakt</a>
</div>`;
const FOOTER_HTML = `<!-- ════════════════════════════════
   _footer.html  — include in every page
   ════════════════════════════════ -->

<footer>
  <div class="footer-inner">
    <div class="footer-brand">
      <div class="footer-brand-name">Trachtenkapelle Riezlern</div>
      <p>Die erste Kapelle des Kleinwalsertals – seit über 200 Jahren Musik, Gemeinschaft und Tradition in Riezlern, Vorarlberg.</p>
    </div>
    <div class="footer-col">
      <h4>Navigation</h4>
      <ul>
        <li><a href="index.html">Startseite</a></li>
        <li><a href="verein.html">Unser Verein</a></li>
        <li><a href="musikanten.html">Musikantinnen &amp; Musikanten</a></li>
        <li><a href="verein.html#vorstandschaft">Vorstandschaft</a></li>
        <li><a href="verein.html#jugend">Jugendarbeit</a></li>
        <li><a href="verein.html#alphorn">Alphorn</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Mehr</h4>
      <ul>
        <li><a href="termine.html">Termine</a></li>
        <li><a href="aktuelles.html">Aktuelles</a></li>
        <li><a href="konzerte.html">Unsere Konzerte</a></li>
        <li><a href="bilder.html">Bilder &amp; Videos</a></li>
        <li><a href="kontakt.html">Kontakt</a></li>
        <li><a href="impressum.html">Impressum</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2026 Trachtenkapelle Riezlern · Riezlern, Kleinwalsertal</span>
    <span>Musik ist Leben.</span>
  </div>
</footer>`;

function injectHeaderFooter() {
  const headerEl = document.getElementById('site-header');
  const footerEl = document.getElementById('site-footer');
  if (headerEl) headerEl.outerHTML = HEADER_HTML;
  if (footerEl) footerEl.outerHTML = FOOTER_HTML;
}

// ── BOOT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  injectHeaderFooter();
  initHamburger();
  initSlideshow();
  initActiveNav();
  initTermine();
  initAktuelles();
  if (typeof initArtikelPage === 'function') initArtikelPage();
  if (typeof initGalleryPage === 'function') initGalleryPage();
});