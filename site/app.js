/* --- Langue -------------------------------------------------------------
   Priorite : ?lang=xx  >  localStorage  >  langue du navigateur  >  'en'.
   't' est reserve au dictionnaire de traduction ; les variables de boucle
   sur les tags s'appellent 'tag'. */
const SUPPORTED = ['en', 'fr', 'es', 'it'];
const FALLBACK = 'en';

function pickLang() {
  const url = new URLSearchParams(location.search).get('lang');
  const stored = localStorage.getItem('catalog-lang');
  const nav = (navigator.language || '').slice(0, 2);
  // Priorite stricte : ?lang= , puis localStorage, puis navigateur.
  for (const cand of [url, stored, nav]) {
    if (SUPPORTED.includes(cand)) return cand;
  }
  return FALLBACK;
}

const lang = pickLang();
let t = {};

const state = { q: '', category: null, tags: new Set(), deprecated: false, featured: false, sort: 'title' };

let snippets = [];

const $list = document.getElementById('list');
const $count = document.getElementById('count');
const $empty = document.getElementById('empty');

/* --- Chargement : catalogue + traductions en parallele --------------- */
Promise.all([
  fetch('catalog.json').then((r) => {
    if (!r.ok) throw new Error('catalog.json (HTTP ' + r.status + ')');
    return r.json();
  }),
  fetch('i18n.json').then((r) => {
    if (!r.ok) throw new Error('i18n.json (HTTP ' + r.status + ')');
    return r.json();
  }),
]).then(([catalog, i18n]) => {
    t = { ...i18n[FALLBACK], ...i18n[lang] };   // repli par cle si trad. manquante
    document.documentElement.lang = t.html_lang || lang;
    document.getElementById('lang').value = lang;
    applyStaticStrings();
    snippets = catalog.snippets || [];
    buildFacets();
    render();
  })
  .catch((err) => {
    $count.textContent = 'Erreur de chargement : ' + err.message;
  });

/* --- Libelles fixes du HTML ---------------------------------------- */
function applyStaticStrings() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    if (t[el.dataset.i18n]) el.textContent = t[el.dataset.i18n];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const s = t[el.dataset.i18nPlaceholder];
    if (s) el.setAttribute('placeholder', s);
  });
}

/* --- Gabarit "{n} / {total} scripts" ------------------------------- */
function fill(str, vars) {
  return String(str).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : '{' + k + '}'));
}

/* --- Changement de langue : rechargement simple ------------------- */
document.getElementById('lang').addEventListener('change', (e) => {
  localStorage.setItem('catalog-lang', e.target.value);
  const u = new URL(location);
  u.searchParams.set('lang', e.target.value);
  location.assign(u);
});

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, lang));
}

function buildFacets() {
  const cats = uniqueSorted(snippets.map((s) => s.category));
  const tags = uniqueSorted(snippets.flatMap((s) => s.tags));

  const $cats = document.getElementById('categories');
  for (const c of cats) {
    $cats.append(
      makeChip('radio', 'category', c, (checked) => {
        state.category = checked ? c : null;
        render();
      }),
    );
  }

  const $tags = document.getElementById('tags');
  for (const tag of tags) {
    $tags.append(
      makeChip('checkbox', 'tag', tag, (checked) => {
        if (checked) state.tags.add(tag);
        else state.tags.delete(tag);
        render();
      }),
    );
  }
}

function makeChip(type, name, value, onToggle) {
  const label = document.createElement('label');
  label.className = 'chip';
  const input = document.createElement('input');
  input.type = type;
  input.name = name;
  input.value = value;
  input.addEventListener('change', () => {
    if (type === 'radio') {
      // Re-cliquer la meme categorie la deselectionne.
      if (label.dataset.active === 'true') {
        input.checked = false;
        label.dataset.active = 'false';
        onToggle(false);
        return;
      }
      document
        .querySelectorAll('#categories .chip')
        .forEach((c) => (c.dataset.active = 'false'));
    }
    label.dataset.active = String(input.checked);
    onToggle(input.checked);
  });
  label.append(input, document.createTextNode(' ' + value));
  return label;
}

document.getElementById('q').addEventListener('input', (e) => {
  state.q = e.target.value.trim().toLowerCase();
  render();
});

document.getElementById('showDeprecated').addEventListener('change', (e) => {
  state.deprecated = e.target.checked;
  render();
});

document.getElementById('showFeaturedOnly').addEventListener('change', (e) => {
  state.featured = e.target.checked;
  render();
});

document.getElementById('sort').addEventListener('change', (e) => {
  state.sort = e.target.value;
  render();
});

document.getElementById('reset').addEventListener('click', () => {
  state.q = '';
  state.category = null;
  state.tags.clear();
  state.deprecated = false;
  state.featured = false;
  state.sort = 'title';
  
  document.getElementById('q').value = '';
  document.getElementById('showDeprecated').checked = false;
  document.getElementById('showFeaturedOnly').checked = false;
  document.getElementById('sort').value = 'title';
  
  document
    .querySelectorAll('.chip input')
    .forEach((i) => (i.checked = false));
  document.querySelectorAll('.chip').forEach((c) => (c.dataset.active = 'false'));
  render();
});

function matches(s) {
  if (!state.deprecated && s.status !== 'active') return false;
  if (state.featured && !s.featured) return false;
  if (state.category && s.category !== state.category) return false;
  for (const tag of state.tags) if (!s.tags.includes(tag)) return false;
  if (state.q) {
    const hay = (s.title + ' ' + s.description + ' ' + s.tags.join(' ') + ' ' + s.slug).toLowerCase();
    if (!hay.includes(state.q)) return false;
  }
  return true;
}

function render() {
  const items = snippets
    .filter(matches)
    .sort((a, b) =>
      (b.featured ? 1 : 0) - (a.featured ? 1 : 0)   // featured toujours en tête
      || compareBy(state.sort)(a, b),
    );


  $list.innerHTML = items
    .map(
      (s) => `
      <li class="card ${s.status}${s.featured ? ' featured' : ''}">
        <div class="card-head">
          <a href="${s.url}" target="_blank" rel="noopener"><strong>${escape(s.title)}</strong></a>
          ${s.featured ? `<span class="badge feat">★ ${escape(t.badge_featured)}</span>` : ''}
          ${s.since ? `<span class="badge">${escape(fill(t.badge_since, { v: s.since }))}</span>` : ''}
          ${isRecent(s.updated) ? `<span class="badge new" title="${escape(s.updated)}">${escape(t.badge_updated)}</span>` : ''}
          ${s.status === 'deprecated' ? `<span class="badge dep">${escape(t.badge_deprecated)}</span>` : ''}
        </div>
        <div class="card-tags">
          <span class="cat">${escape(s.category)}</span>
          ${s.tags.map((tag) => `<span>${escape(tag)}</span>`).join('')}
        </div>
        <div class="card-desc">
          ${s.status === 'deprecated' && s.replaced_by ? `<p class="repl">${escape(fill(t.replaced_by, { x: s.replaced_by }))}</p>` : ''}
          ${s.description ? `<p class="desc">${escape(s.description)}</p>` : ''}
        </div>
        ${s.updated ? `<p class="card-meta"><time datetime="${escape(s.updated)}" title="${escape(s.updated)}">${escape(fill(t.updated_on, { d: formatDate(s.updated) }))}</time></p>` : ''}
      </li>`,
    )
    .join('');

  $count.textContent = fill(t.count, { n: items.length, total: snippets.length });
  $empty.hidden = items.length !== 0;
}

/** true si la date ISO "YYYY-MM-DD" est dans les 90 derniers jours. */
function isRecent(iso) {
  if (!iso) return false;
  const days = (Date.now() - Date.parse(iso)) / 86400000;
  return days >= 0 && days <= 90;
}

function compareBy(sort) {
  const byUpd = (a, b, dir) => {
    if (!a.updated) return 1;
    if (!b.updated) return -1;
    return dir * b.updated.localeCompare(a.updated); // string "YYYY-MM-DD" = ordre chrono
  };
  if (sort === 'updated-desc') return (a, b) => byUpd(a, b, 1);
  if (sort === 'updated-asc')  return (a, b) => byUpd(a, b, -1);
  return (a, b) => a.title.localeCompare(b.title, lang);
}


/** "2025-03-12" -> "mars 2025" (mois + annee, selon la langue courante). */
function formatDate(iso) {
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleDateString(lang, { year: 'numeric', month: 'long' });
}

function escape(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}
