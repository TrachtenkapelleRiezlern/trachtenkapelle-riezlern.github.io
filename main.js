/* ══════════════════════════════════════════════
   TRACHTENKAPELLE RIEZLERN – main.js
   ══════════════════════════════════════════════ */

const TERMINE_INDEX  = 'Termine/index.json';
const MAX_HERO_TERMINE = 5;
const MAX_HOME_RUECKBLICKE = 6;

const MONTH_SHORT = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const MONTH_LONG  = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const WEEKDAYS    = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
const KATEGORIE_LABEL = { konzert:'Konzert', kirchliches:'Kirchliches', fest:'Fest', auswaerts:'Auswärtsspiel', sonstiges:'Sonstiges' };

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
  const rueckblickePages = ['rueckblick.html'];
  const navPage = page === 'geschichte.html'
    ? 'verein.html'
    : rueckblickePages.includes(page) ? 'rueckblicke.html' : page;

  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    const href = a.getAttribute('href') || '';
    // Anchor-only links (z.B. index.html#instagram) nicht als aktiv markieren
    const hrefPage = href.split('#')[0];
    if (hrefPage && hrefPage !== '' && navPage === hrefPage && !href.includes('#')) a.classList.add('active');
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

function formatResponsiveDateDisplay(datum) {
  const d = new Date(datum + 'T00:00:00');
  return `${d.getDate()}.<span class="datelong">&nbsp;${MONTH_LONG[d.getMonth()]}&nbsp;</span><span class="dateshort">${d.getMonth() + 1}.</span>${d.getFullYear()}`;
}

function resolveTerminMapQuery(ort = '') {
  const normalized = String(ort).toLowerCase();
  if (!normalized.trim()) return '';
  if (normalized.includes('gemeindeamt') || normalized.includes('gemeindeplatz')) {
    return 'Walserstraße 52, 6991 Riezlern';
  }
  if (normalized.includes('walserhaus') || normalized.includes('hirschegg')) {
    return 'Walserstraße 264, 6992 Hirschegg';
  }
  if (normalized.includes('kirche riezlern')) {
    return 'Walserstraße 132, 6991 Riezlern';
  }
  return ort;
}

function googleMapsUrl(ort = '') {
  const query = resolveTerminMapQuery(ort);
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : '';
}

function renderTerminLocationLink(ort) {
  const url = googleMapsUrl(ort);
  if (!url) return '';
  return ` · <a class="tc-map-link" href="${escapeHtml(url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Google Maps</a>`;
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

  return index
    .map((t, idx) => ({
      ...t,
      _ordner: t.id || t._ordner || String(idx)
    }))
    .filter(t => new Date(t.datum + 'T00:00:00') >= now)
    .sort((a,b) => new Date(a.datum) - new Date(b.datum));
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
    const el = document.createElement('a');
    el.className = 'hero-termin';
    el.href = `termine.html#${encodeURIComponent(terminElementId(t))}`;
    el.innerHTML = `
      <div class="ht-date"><div class="ht-day">${day}</div><div class="ht-month">${month}</div></div>
      <!-- <div class="ht-divider"></div> -->
      <div class="ht-info">
        <div class="ht-title">${escapeHtml(t.titel)}</div>
        <div class="ht-details">${escapeHtml(time)}${t.ort ? ' · ' + escapeHtml(t.ort) : ''}</div>
      </div>`;
    list.appendChild(el);
  });
}

function terminElementId(t) {
  return `termin-${t._ordner || String(t.datum || '').replaceAll('-', '_')}`;
}

// ── TERMINE PAGE ──────────────────────────────────────────────────────────────
let _allTermine = [];

const TERMINE_INITIAL = 5;  // sichtbar bevor "mehr anzeigen" geklickt wird

function renderTerminePage(termine, filter = 'all') {
  const container = document.getElementById('termineList');
  const moreBtn   = document.getElementById('termineMoreBtn');
  if (!container) return;
  document.getElementById('termineLoading')?.remove();

  const filtered = filter === 'all' ? termine : termine.filter(t => {
    const kat = (t.kategorie || 'sonstiges');
    // Support both old keys (konzert/prozession/fest) and new keys
    const aliases = { konzerte:'konzerte', kirchliches:'kirchliches', feste:'feste' };
    return kat === filter || aliases[kat] === filter;
  });
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
    card.id = terminElementId(t);
    card.tabIndex = -1;
    card.innerHTML = `
      <div class="tc-date"><div class="tc-day">${day}</div><div class="tc-month">${month}</div></div>
      <div class="tc-info">
        <div class="tc-title">${t.titel}</div>
        <div class="tc-meta">
          ${weekday}, ${day}. ${monthLong} ${year}
          ${t.uhrzeit ? ' · ' + time : ''}
          ${t.ort     ? ' · ' + t.ort  : ''}
          ${t.ort     ? renderTerminLocationLink(t.ort) : ''}
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

  scrollToTargetTermin();
}

function scrollToTargetTermin() {
  if (!location.hash.startsWith('#termin-')) return;
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (!target) return;

  if (target.classList.contains('termin-hidden')) {
    document.querySelectorAll('.termin-hidden').forEach(el => el.classList.remove('termin-hidden'));
    const moreBtn = document.getElementById('termineMoreBtn');
    if (moreBtn) moreBtn.style.display = 'none';
  }

  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.focus({ preventScroll: true });
    target.classList.add('termin-highlight');
    window.setTimeout(() => target.classList.remove('termin-highlight'), 2600);
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

// ── RÜCKBLICKE PAGE ──────────────────────────────────────────────────────────
function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function rueckblickYear(item) {
  return String(item.datum || '').slice(0, 4) || 'Archiv';
}

function formatRueckblickDate(item) {
  const datum = item.datum || '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(datum)) return formatResponsiveDateDisplay(datum);
  return escapeHtml(datum) || 'Archiv';
}

function rueckblickAssetPath(memoryId, filePath) {
  if (!filePath) return 'images/logo.png';
  if (/^(https?:)?\/\//.test(filePath) || filePath.startsWith('/')) return filePath;
  return `Rueckblicke/${memoryId}/${filePath}`;
}

function rueckblickCoverPath(memoryId) {
  return `Rueckblicke/${memoryId}/cover.jpg`;
}

function rueckblickCard(item, isFirstInYear) {
  const memoryId = item._ordner || item.id || '';
  const image = rueckblickCoverPath(memoryId);
  const href = `rueckblick.html?id=${encodeURIComponent(memoryId)}`;
  const tags = Array.isArray(item.tags)
    ? item.tags
    : (item.rubrik ? [item.rubrik] : []);
  const tagHtml = tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('');
  const isCancelled = ['abgesagt', 'cancelled', 'canceled'].includes(String(item.status || '').toLowerCase());

  return `
    <article class="rueckblick-item${isFirstInYear ? ' year-start' : ''}" onclick="location.href='${escapeHtml(href)}'">
      <div class="rueckblick-year-marker" aria-hidden="${isFirstInYear ? 'false' : 'true'}">${isFirstInYear ? escapeHtml(rueckblickYear(item)) : ''}</div>
      <a class="rueckblick-image-link" href="${escapeHtml(href)}" aria-label="${escapeHtml(item.titel)} ansehen">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(item.titel)}" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
        <div class="rueckblick-image-placeholder" style="display:none;">&#127926;</div>
        ${isCancelled ? '<div class="rueckblick-image-cancelled-overlay"></div><div class="rueckblick-cancelled-stamp" aria-label="Abgesagt">ABGESAGT</div>' : ''}
      </a>
      <div class="rueckblick-content">
        <div class="rueckblick-meta">
          <span>${formatRueckblickDate(item)}</span>
          ${tagHtml}
        </div>
        <h3>${escapeHtml(item.titel)}</h3>
        ${item.beschreibung ? `<p>${escapeHtml(item.beschreibung)}</p>` : ''}
        <div class="rueckblick-links">
          <a class="rueckblick-link" href="${escapeHtml(href)}" onclick="event.stopPropagation()">Rückblick ansehen</a>
        </div>
      </div>
    </article>
  `;
}

function rueckblickTypeSummary(item) {
  const parts = [];
  if (item.inhalt || item.text || item.article) parts.push('Artikel');
  if (item.concert) parts.push('Konzert');
  const albumCount = item.albums?.length || 0;
  if (albumCount === 1) parts.push('Bilder');
  if (albumCount > 1) parts.push(`${albumCount} Alben`);
  return parts.length ? parts.join(' · ') : 'Rückblick';
}

function rueckblickHomeCard(item) {
  const memoryId = item._ordner || item.id || '';
  const href = `rueckblick.html?id=${encodeURIComponent(memoryId)}`;
  const tags = Array.isArray(item.tags) ? item.tags.slice(0, 2) : [];
  const tagHtml = tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('');

  const title = item.titel.replace(/\s\d\d\d\d\s?/g, ' ');
  const date = new Date(item.datum);
  const datePill = `${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`;

  return `
    <a href="${escapeHtml(href)}" class="g-item g-item-rueckblick">
      <img src="${escapeHtml(rueckblickCoverPath(memoryId))}" alt="${escapeHtml(item.titel)}" loading="lazy"
           onerror="this.style.display='none'" />
      <div class="g-overlay">
        <div class="g-rueckblick-card">
          <h3>${escapeHtml(title)}</h3>
          <div class="g-rueckblick-meta">
            <span>${datePill}</span>
            ${tagHtml}
          </div>
        </div>
      </div>
    </a>
  `;
}

async function initHomeRueckblicke() {
  const grid = document.getElementById('homeRueckblickeGrid');
  if (!grid) return;

  try {
    const index = await loadIndex('Rueckblicke/index.json');
    const results = await Promise.allSettled(
      index.map(e => loadMeta(e.ordner, 'Rueckblicke'))
    );
    const items = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .sort((a,b) => String(b.datum || '').localeCompare(String(a.datum || '')))
      .slice(0, MAX_HOME_RUECKBLICKE);

    if (!items.length) {
      grid.innerHTML = '<div class="gallery-loading">Noch keine Rückblicke vorhanden.</div>';
      return;
    }

    grid.innerHTML = items.map(rueckblickHomeCard).join('');
  } catch (err) {
    console.warn('Homepage Rückblicke Ladefehler:', err.message);
    grid.innerHTML = '<div class="gallery-loading">Rückblicke konnten nicht geladen werden.</div>';
  }
}

async function initRueckblicke() {
  const timeline = document.getElementById('rueckblickeTimeline');
  if (!timeline) return;

  try {
    const index = await loadIndex('Rueckblicke/index.json');
    const results = await Promise.allSettled(
      index.map(e => loadMeta(e.ordner, 'Rueckblicke'))
    );
    const items = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);
    const sorted = items
      .slice()
      .sort((a,b) => String(b.datum || '').localeCompare(String(a.datum || '')));

    document.getElementById('rueckblickeLoading')?.remove();

    if (!sorted.length) {
      timeline.innerHTML = '<div class="termine-empty">Noch keine Rückblicke vorhanden.</div>';
      return;
    }

    let lastYear = '';
    timeline.innerHTML = sorted.map(item => {
      const year = rueckblickYear(item);
      const isFirstInYear = year !== lastYear;
      lastYear = year;
      return rueckblickCard(item, isFirstInYear);
    }).join('');
  } catch (err) {
    console.warn('Rückblicke Ladefehler:', err.message);
    document.getElementById('rueckblickeLoading')?.remove();
    timeline.innerHTML = '<div class="termine-empty">Rückblicke konnten nicht geladen werden.</div>';
  }
}

function renderRueckblickTags(tags = []) {
  return tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('');
}

function renderRueckblickText(meta, article, concert, includeConcertFallback = true) {
  const explicitText = meta.inhalt || meta.text;
  const articleText = article?.inhalt || article?.beschreibung;
  const concertText = includeConcertFallback ? (concert?.inhalt || concert?.beschreibung) : '';
  const text = explicitText || articleText || concertText || '';
  return text ? `<div class="artikel-text rueckblick-detail-text">${text}</div>` : '';
}

function renderRueckblickConcert(concert) {
  if (!concert) return '';
  return `
    <section class="rueckblick-detail-block">
      <div class="section-label">Konzert</div>
      <h2>${escapeHtml(concert.titel || 'Konzert')}</h2>
      ${concert.datum ? `<p class="rueckblick-detail-muted">${escapeHtml(concert.datum)}</p>` : ''}
      ${concert.beschreibung ? `<p>${escapeHtml(concert.beschreibung)}</p>` : ''}
    </section>`;
}

function renderRueckblickAlbum(album, memoryId, previewLimit = 8, bare = false) {
  const bilder = album.bilder || [];
  const shown = bilder.slice(0, previewLimit);
  const remaining = Math.max(0, bilder.length - shown.length);
  const albumKey = album.id || album.titel || 'album';
  const imagesHtml = shown.length
    ? shown.map((filename, idx) => `
        <button class="rueckblick-photo" type="button" onclick="openRueckblickLightbox('${escapeHtml(albumKey)}', ${idx})">
          <img src="${escapeHtml(rueckblickAssetPath(memoryId, filename))}" alt="" loading="lazy" />
        </button>
      `).join('')
    : '<p class="rueckblick-detail-muted">Zu diesem Album sind noch keine Bilder hinterlegt.</p>';

  if (bare) {
    return `
      <div class="rueckblick-album-inline" data-album="${escapeHtml(albumKey)}">
        <div class="rueckblick-photo-grid">${imagesHtml}</div>
        ${remaining ? `<button class="btn btn-green rueckblick-load-photos" type="button" data-album="${escapeHtml(albumKey)}">Weitere ${remaining} Bilder laden</button>` : ''}
      </div>`;
  }

  return `
    <section class="rueckblick-detail-block rueckblick-album-block" data-album="${escapeHtml(albumKey)}">
      <div class="section-label">Bilder</div>
      <h2>${escapeHtml(album.titel || albumKey)}</h2>
      <p class="rueckblick-detail-muted">${bilder.length} Bilder${remaining ? ` · ${shown.length} als Vorschau` : ''}</p>
      <div class="rueckblick-photo-grid">${imagesHtml}</div>
      ${remaining ? `<button class="btn btn-green rueckblick-load-photos" type="button" data-album="${escapeHtml(albumKey)}">Weitere ${remaining} Bilder laden</button>` : ''}
    </section>`;
}

function initRueckblickPhotoButtons(albumsById, previewLimit = 8) {
  window._rueckblickAlbums = albumsById;
  window.openRueckblickLightbox = function(albumId, idx) {
    const album = window._rueckblickAlbums?.[albumId];
    if (!album) return;
    window.rueckblickLbImages = (album.bilder || []).map(f => rueckblickAssetPath(album._memoryId, f));
    window.rueckblickLbIndex = idx;
    document.getElementById('rueckblick-lb-img').src = window.rueckblickLbImages[idx];
    document.getElementById('rueckblick-lb-counter').textContent = (idx + 1) + ' / ' + window.rueckblickLbImages.length;
    document.getElementById('rueckblick-lightbox').classList.add('lb-open');
    document.body.style.overflow = 'hidden';
  };
  window.closeRueckblickLightbox = function() {
    document.getElementById('rueckblick-lightbox').classList.remove('lb-open');
    document.body.style.overflow = '';
  };
  window.rueckblickLbNav = function(dir) {
    const images = window.rueckblickLbImages || [];
    if (!images.length) return;
    window.rueckblickLbIndex = (window.rueckblickLbIndex + dir + images.length) % images.length;
    document.getElementById('rueckblick-lb-img').src = images[window.rueckblickLbIndex];
    document.getElementById('rueckblick-lb-counter').textContent = (window.rueckblickLbIndex + 1) + ' / ' + images.length;
  };

  document.querySelectorAll('.rueckblick-load-photos').forEach(btn => {
    btn.addEventListener('click', () => {
      const albumId = btn.dataset.album;
      const album = albumsById[albumId];
      if (!album) return;
      const grid = btn.closest('.rueckblick-album-block, .rueckblick-album-inline')?.querySelector('.rueckblick-photo-grid');
      if (!grid) return;
      grid.innerHTML = (album.bilder || []).map((filename, idx) => `
        <button class="rueckblick-photo" type="button" onclick="openRueckblickLightbox('${escapeHtml(albumId)}', ${idx})">
          <img src="${escapeHtml(rueckblickAssetPath(album._memoryId, filename))}" alt="" loading="lazy" />
        </button>
      `).join('');
      btn.remove();
    });
  });

  document.addEventListener('keydown', e => {
    if (!document.getElementById('rueckblick-lightbox')?.classList.contains('lb-open')) return;
    if (e.key === 'ArrowRight') window.rueckblickLbNav(1);
    if (e.key === 'ArrowLeft')  window.rueckblickLbNav(-1);
    if (e.key === 'Escape') window.closeRueckblickLightbox();
  });
}

async function initRueckblickDetailPage() {
  const content = document.getElementById('rueckblickDetailContent');
  if (!content) return;

  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (!id) {
    content.innerHTML = '<div class="termine-empty">Kein Rückblick angegeben.</div>';
    return;
  }

  try {
    const meta = await loadMeta(id, 'Rueckblicke');
    const articleResult = meta.article || null;
    const concertResult = meta.concert || null;
    const albums = (meta.albums || []).map(album => ({ ...album, _memoryId: id }));
    const title = meta.titel || id;
    const detailImage = meta.detailbild
      ? rueckblickAssetPath(id, meta.detailbild)
      : rueckblickCoverPath(id);

    document.title = `${title} – Trachtenkapelle Riezlern`;
    document.getElementById('rueckblickDetailTitle').textContent = title;
    document.getElementById('rueckblickDetailDate').innerHTML = formatRueckblickDate(meta);
    document.getElementById('rueckblickDetailTags').innerHTML = renderRueckblickTags(meta.tags || []);
    document.getElementById('rueckblickDetailLead').textContent = meta.beschreibung || '';

    const hasOwnText = !!(meta.inhalt || meta.text || articleResult?.inhalt || articleResult?.beschreibung);
    const hasConcert = !!concertResult;
    const hasAlbums = albums.length > 0;
    const concertOnly = !hasOwnText && hasConcert && !hasAlbums;
    const textHtml = renderRueckblickText(meta, articleResult, concertResult, concertOnly);
    const concertHtml = concertOnly ? '' : renderRueckblickConcert(concertResult);
    const albumOnly = !textHtml && !concertHtml && albums.length === 1;

    content.innerHTML = `
      <img class="rueckblick-detail-cover" src="${escapeHtml(detailImage)}" alt="${escapeHtml(title)}" loading="lazy" />
      ${textHtml}
      ${concertHtml}
      ${albums.map(album => renderRueckblickAlbum(album, id, 8, albumOnly)).join('')}
    `;

    initRueckblickPhotoButtons(Object.fromEntries(albums.map(album => [album.id || album.titel || 'album', album])));
  } catch (err) {
    console.warn('Rückblick Detail Ladefehler:', err.message);
    content.innerHTML = '<div class="termine-empty">Dieser Rückblick konnte nicht geladen werden.</div>';
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
    console.warn('Termine Ladefehler:', err.message);
    const heroList = document.getElementById('heroTermineList');
    if (heroList) { heroList.classList.remove('loading'); heroList.innerHTML = ''; }
    const termineList = document.getElementById('termineList');
    if (termineList) {
      document.getElementById('termineLoading')?.remove();
      termineList.innerHTML = '<div class="termine-empty">Termine konnten nicht geladen werden.<br/><small>Bitte <code>sync_termine.py</code> ausführen und <code>Termine/index.json</code> prüfen.</small></div>';
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
    <img src="images/logo.png" alt="Trachtenkapelle Riezlern" class="nav-logo-img" />
  </a>
  <ul class="nav-links">
    <li><a href="index.html">Startseite</a></li>
    <li><a href="verein.html">Verein</a></li>
    <li><a href="termine.html">Termine</a></li>
    <li><a href="rueckblicke.html">Rückblicke</a></li>
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
  <a href="rueckblicke.html">Rückblicke</a>
  <a href="index.html#instagram">Instagram</a>
  <a href="kontakt.html" class="m-btn">Kontakt</a>
</div>

<!-- <a href="geburtstagsfest.html" class="nav-birthday-pill" id="birthdayPill" aria-label="ZÄÄMA 2hundertzehn – Unser Geburtstagsfest">
  <span class="nbp-zaema">ZÄÄMA</span>
  <span class="nbp-zahl"><span class="nbp-2">2</span><span class="nbp-rest">hundert<br/>zehn</span></span>
  <span class="nbp-date">28. Juni 2026</span>
</a> -->`;
const FOOTER_HTML = `<!-- ════════════════════════════════
   _footer.html  — include in every page
   ════════════════════════════════ -->

<footer>
  <div class="footer-inner">
    <div class="footer-brand">
      <div class="footer-brand-name">Trachtenkapelle Riezlern e.V.</div>
      <p>Die erste Kapelle des Kleinwalsertals – seit über 200 Jahren Musik, Gemeinschaft und Tradition in Riezlern, Vorarlberg.</p>
    </div>
    <div class="footer-col">
      <h4>Verein</h4>
      <ul>
        <li><a href="verein.html">Unser Verein</a></li>
        <li><a href="musikanten.html">Mitglieder</a></li>
        <li><a href="verein.html#vorstand">Vorstand</a></li>
        <li><a href="verein.html#jugend">Jugendarbeit</a></li>
        <li><a href="verein.html#alphorn">Alphorn</a></li>
        <li><a href="geschichte.html">Geschichte</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Erleben</h4>
      <ul>
        <li><a href="index.html">Startseite</a></li>
        <li><a href="termine.html">Termine</a></li>
        <li><a href="rueckblicke.html">Rückblicke</a></li>
        <li><a href="index.html#instagram">Instagram</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2026 Trachtenkapelle Riezlern e.V. · Riezlern, Kleinwalsertal</span>
    <span><a href="musik.html">Musikarchiv</a> · <a href="kontakt.html">Kontakt</a> · <a href="impressum.html">Impressum</a></span>
  </div>
</footer>`;

function injectHeaderFooter() {

  const headerEl = document.getElementById('site-header');
  const footerEl = document.getElementById('site-footer');
  if (headerEl) headerEl.outerHTML = HEADER_HTML;
  if (footerEl) footerEl.outerHTML = FOOTER_HTML;
}

// ── BOOT ──────────────────────────────────────────────────────────────────────

// ── BIRTHDAY PILL SCROLL VISIBILITY ──────────────────────────────────────────
function initBirthdayPill() {
  const pill = document.getElementById('birthdayPill');
  if (!pill) return;
  const NAV_HEIGHT = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--nav-height')) || 70;
  const THRESHOLD = NAV_HEIGHT + 20;

  function update() {
    if (window.scrollY > THRESHOLD) {
      pill.classList.add('pill-visible');
    } else {
      pill.classList.remove('pill-visible');
    }
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ── MUSIKARCHIV TABLE SORTING ────────────────────────────────────────────────
function initMusikTables() {
  document.querySelectorAll('.musik-table').forEach(table => {
    const headers = Array.from(table.querySelectorAll('th[data-sort-type]'));
    const tbody = table.querySelector('tbody');
    if (!headers.length || !tbody) return;

    function sortRows(columnIndex, direction, type) {
      const factor = direction === 'ascending' ? 1 : -1;
      const rows = Array.from(tbody.querySelectorAll('tr'));

      rows.sort((a, b) => {
        const aValue = (a.children[columnIndex]?.textContent || '').trim();
        const bValue = (b.children[columnIndex]?.textContent || '').trim();
        const aEmpty = aValue === '';
        const bEmpty = bValue === '';
        if (aEmpty || bEmpty) {
          if (aEmpty && bEmpty) return 0;
          return aEmpty ? 1 : -1;
        }

        if (type === 'number') {
          const aNumber = Number.parseInt(aValue, 10);
          const bNumber = Number.parseInt(bValue, 10);
          return (aNumber - bNumber) * factor;
        }

        return aValue.localeCompare(bValue, 'de', { sensitivity: 'base', numeric: true }) * factor;
      });

      tbody.append(...rows);
    }

    headers.forEach((header, columnIndex) => {
      const button = header.querySelector('.musik-sort-button');
      if (!button) return;

      button.addEventListener('click', () => {
        const isCurrentColumn = table.dataset.sortColumn === String(columnIndex);
        const currentDirection = table.dataset.sortDirection || 'none';
        const nextDirection = isCurrentColumn && currentDirection === 'ascending'
          ? 'descending'
          : 'ascending';

        headers.forEach(h => h.setAttribute('aria-sort', 'none'));
        header.setAttribute('aria-sort', nextDirection);
        table.dataset.sortColumn = String(columnIndex);
        table.dataset.sortDirection = nextDirection;
        sortRows(columnIndex, nextDirection, header.dataset.sortType || 'text');
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  injectHeaderFooter();
  initHamburger();
  initSlideshow();
  initActiveNav();
  initTermine();
  initHomeRueckblicke();
  initRueckblicke();
  initRueckblickDetailPage();
  initBirthdayPill();
  initMusikTables();
});
