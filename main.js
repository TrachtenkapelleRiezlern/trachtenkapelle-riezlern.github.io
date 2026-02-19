/* ══════════════════════════════════════════════
   TRACHTENKAPELLE RIEZLERN – main.js
   ══════════════════════════════════════════════ */

const TERMINE_INDEX  = 'Termine/index.json';
const MAX_HERO_TERMINE = 5;

const MONTH_SHORT = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const MONTH_LONG  = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const WEEKDAYS    = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
const KATEGORIE_LABEL = { konzert:'Konzert', prozession:'Prozession', fest:'Fest', auswaerts:'Auswärtsspiel', sonstiges:'Sonstiges' };

// ── HAMBURGER ────────────────────────────────
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

// ── SLIDESHOW ────────────────────────────────
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
  dots.forEach(dot => dot.addEventListener('click', () => { clearInterval(interval); goTo(+dot.dataset.index); interval = setInterval(() => goTo(current + 1), 5500); }));
  interval = setInterval(() => goTo(current + 1), 5500);
}

// ── ACTIVE NAV ───────────────────────────────
function initActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href !== '#' && href !== '' && page === href) a.classList.add('active');
  });
}

// ── DATUM HELPER ─────────────────────────────
function parseDatum(t) {
  const d = new Date(t.datum + 'T00:00:00');
  return {
    day: d.getDate(),
    month: MONTH_SHORT[d.getMonth()],
    monthLong: MONTH_LONG[d.getMonth()],
    weekday: WEEKDAYS[d.getDay()],
    year: d.getFullYear(),
    time: t.uhrzeit ? `${t.uhrzeit} Uhr` : 'Ganztags',
  };
}

// ── TERMINE LOADER ───────────────────────────
async function loadTermine() {
  const idxRes = await fetch(TERMINE_INDEX);
  if (!idxRes.ok) throw new Error(`index.json nicht gefunden (${idxRes.status}) – bitte build_termine.py ausführen`);
  const index = await idxRes.json();

  const now = new Date(); now.setHours(0,0,0,0);

  const results = await Promise.allSettled(
    index.map(entry =>
      fetch(`Termine/${entry.ordner}/meta.json`)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(meta => ({ ...meta, _ordner: entry.ordner }))
    )
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value)
    .filter(t => new Date(t.datum + 'T00:00:00') >= now)
    .sort((a,b) => new Date(a.datum) - new Date(b.datum));
}

// ── HERO TERMINE STRIP ───────────────────────
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

// ── TERMINE PAGE ─────────────────────────────
let _allTermine = [];

function renderTerminePage(termine, filter = 'all') {
  const container = document.getElementById('termineList');
  if (!container) return;
  document.getElementById('termineLoading')?.remove();

  const filtered = filter === 'all' ? termine : termine.filter(t => (t.kategorie || 'sonstiges') === filter);
  container.innerHTML = '';

  if (!filtered.length) {
    container.innerHTML = '<div class="termine-empty">Keine Termine in dieser Kategorie.</div>';
    return;
  }

  filtered.forEach(t => {
    const { day, month, monthLong, weekday, year, time } = parseDatum(t);
    const kat  = KATEGORIE_LABEL[t.kategorie] || 'Veranstaltung';
    const bild = t.bilder?.length ? `Termine/${t._ordner}/${t.bilder[0]}` : null;

    const card = document.createElement('div');
    card.className = 'termin-card';
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
        ${t.eintritt ? `<div class="tc-eintritt">🎟 Eintritt: ${t.eintritt}</div>` : ''}
      </div>
      <div class="tc-right">
        ${bild ? `<img class="tc-img" src="${bild}" alt="${t.titel}" loading="lazy" />` : ''}
        <span class="tc-badge">${kat}</span>
      </div>`;
    container.appendChild(card);
  });
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

// ── INIT TERMINE ─────────────────────────────
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
    if (heroList) {
      heroList.classList.remove('loading');
      heroList.innerHTML = `
        <div class="hero-termin"><div class="ht-date"><div class="ht-day">15</div><div class="ht-month">Mär</div></div><div class="ht-divider"></div><div class="ht-info"><div class="ht-title">Frühjahrskonzert 2026</div><div class="ht-details">Turnhalle Riezlern · 19:30 Uhr</div></div></div>
        <div class="hero-termin"><div class="ht-date"><div class="ht-day">12</div><div class="ht-month">Jul</div></div><div class="ht-divider"></div><div class="ht-info"><div class="ht-title">Sommerkonzert I</div><div class="ht-details">Gemeindeplatz · 20:00 Uhr</div></div></div>
        <div class="hero-termin"><div class="ht-date"><div class="ht-day">29</div><div class="ht-month">Nov</div></div><div class="ht-divider"></div><div class="ht-info"><div class="ht-title">Adventskonzert 2026</div><div class="ht-details">Pfarrkirche Riezlern · 17:00 Uhr</div></div></div>`;
    }
    const termineList = document.getElementById('termineList');
    if (termineList) {
      document.getElementById('termineLoading')?.remove();
      termineList.innerHTML = '<div class="termine-empty">Termine konnten nicht geladen werden.<br/><small>Bitte <code>build_termine.py</code> ausführen.</small></div>';
    }
  }
}

// ── BOOT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  initSlideshow();
  initActiveNav();
  initTermine();
});
