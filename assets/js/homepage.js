/* ── SCROLL ── */
const navbar = document.getElementById('navbar');
const navSearchWrap = document.getElementById('nav-search-wrap');
const heroSearchbar = document.getElementById('hero-searchbar');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('denser', window.scrollY > 10);
  const rect = heroSearchbar.getBoundingClientRect();
  const show = rect.bottom < navbar.offsetHeight + 10;
  navSearchWrap.classList.toggle('visible', show);
}, { passive: true });

// sync inputs
document.getElementById('hero-search-input').addEventListener('input', e => document.getElementById('nav-search-input').value = e.target.value);
document.getElementById('nav-search-input').addEventListener('input', e => document.getElementById('hero-search-input').value = e.target.value);

/* ── PROFILE POPUP ── */
const profileBtn = document.getElementById('profile-btn');
const profilePopup = document.getElementById('profile-popup');
const overlay = document.getElementById('overlay');

profileBtn.addEventListener('click', e => {
  e.stopPropagation();
  const open = profilePopup.classList.toggle('open');
  profileBtn.classList.toggle('active', open);
  overlay.classList.toggle('open', open);
});
overlay.addEventListener('click', () => {
  profilePopup.classList.remove('open');
  profileBtn.classList.remove('active');
  overlay.classList.remove('open');
});

function switchTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('panel-login').style.display = tab === 'login' ? '' : 'none';
  document.getElementById('panel-register').style.display = tab === 'register' ? '' : 'none';
}

/* ── FILTER PANEL ── */
const filterOverlay = document.getElementById('filter-overlay');
const filterPanel = document.getElementById('filter-panel');
const heroFilterBtn = document.getElementById('hero-filter-btn');
let activeFilters = 0;

function openFilter(e) {
  if (e) e.stopPropagation();
  filterPanel.classList.add('open');
  filterOverlay.classList.add('open');
  heroFilterBtn.classList.add('active');
}
function closeFilter() {
  filterPanel.classList.remove('open');
  filterOverlay.classList.remove('open');
  heroFilterBtn.classList.remove('active');
  updateFilterCount();
}
filterOverlay.addEventListener('click', closeFilter);

function updateFilterCount() {
  activeFilters = document.querySelectorAll('.fchip.on, .rarity-pill.on, .color-pill.sel').length;
  const badge = document.getElementById('filter-count-badge');
  badge.textContent = activeFilters;
  badge.classList.toggle('show', activeFilters > 0);
  const countEl = document.getElementById('fp-active-count');
  countEl.textContent = activeFilters > 0 ? `${activeFilters} filtro/i attivo/i` : '';
}

function toggleChip(el) { el.classList.toggle('on'); updateFilterCount(); }
function toggleColor(el) { el.classList.toggle('sel'); updateFilterCount(); }
function setColorMode(el, mode) {
  document.querySelectorAll('.cmode-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}
function resetFilters() {
  document.querySelectorAll('.fchip.on, .rarity-pill.on, .color-pill.sel').forEach(el => el.classList.remove('on','sel'));
  document.querySelectorAll('.range-input, .fp-select').forEach(el => el.value = '');
  document.querySelectorAll('.text-field input').forEach(el => el.value = '');
  document.querySelector('.cmode-btn').classList.add('active');
  document.querySelectorAll('.cmode-btn:not(:first-child)').forEach(b => b.classList.remove('active'));
  updateFilterCount();
}

/* ── REVEAL ── */
const revObs = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); }), { threshold:.08 });
document.querySelectorAll('.reveal').forEach(r => revObs.observe(r));