// Leonida Ledger — boot and wiring. Loads data/trophies.json, restores saved
// progress and settings, renders the tracker, and keeps the four views in sync.
// Deep links: #view=roadmap (or missables, about) and #trophy=<id> open a guide.

import { KIND_FILTERS, visibleTrophies } from './filters.js';
import {
  loadProgress,
  saveProgress,
  exportProgress,
  importProgressText,
  loadSettings,
  saveSettings,
} from './store.js';
import { renderChecklist, renderDetail, renderProgressCard } from './views.js';
import { renderRoadmap, renderMissables, renderAbout } from './roadmap.js';

const DATA_URL = 'data/trophies.json';

// The app's whole state in one object, so every render reads the same truth.
function freshState(data) {
  const settings = loadSettings();
  return {
    data,
    earned: loadProgress(),
    kind: 'all',
    grade: 'all',
    status: 'all',
    query: '',
    spoiler: settings.spoiler === true,
    view: 'tracker',
    selected: null,
  };
}

function selectedTrophy(state) {
  return state.data.trophies.find((t) => t.id === state.selected) ?? null;
}

// Re-render everything the tracker shows, and keep the URL hash in step.
function renderAll(state) {
  renderProgressCard(state.data, state.earned);
  const shown = visibleTrophies(state.data.trophies, state);
  const list = document.getElementById('trophyList');
  renderChecklist(list, shown, state, toggleEarned, selectTrophy);
  renderDetail(
    document.getElementById('detailPane'),
    selectedTrophy(state),
    state,
    toggleEarned,
  );
  const meta = document.getElementById('listMeta');
  if (state.kind === 'online') {
    meta.textContent = 'No online trophies: all 55 unlock in single-player (PowerPyx).';
  } else {
    meta.textContent = `Showing ${shown.length} of ${state.data.trophies.length} trophies` +
      (state.earned.size ? ` · ${state.earned.size} earned` : '');
  }
  document.getElementById('emptyNote').hidden = shown.length > 0 || state.kind === 'online';
  document.getElementById('emptyNote').textContent = state.kind === 'online'
    ? 'GTA VI launches without online play, so there is nothing to track here — every trophy is single-player.'
    : 'No trophies match these filters. Loosen the search or the filters.';
  renderRoadmap(
    document.getElementById('roadmapStages'),
    state.data,
    state,
    selectTrophy,
  );
  renderMissables(document.getElementById('missablesBody'), state.data, state);
  renderAbout(document.getElementById('aboutBody'), state.data);
  document.getElementById('footerMeta').textContent =
    `List verified 19–20 Nov 2026 · ${state.data.trophies.length} trophies · ` +
    `1 platinum, 2 gold, 6 silver, 46 bronze · 28 hidden · 0 online`;
}

function toggleEarned(trophy, earned) {
  if (earned) state.earned.add(trophy.name);
  else state.earned.delete(trophy.name);
  saveProgress(state.earned);
  renderAll(state);
}

function selectTrophy(trophy) {
  state.selected = trophy.id;
  state.view = 'tracker';
  showView(state, 'tracker');
  renderAll(state);
  const hash = `#trophy=${trophy.id}`;
  if (location.hash !== hash) history.replaceState(null, '', hash);
}

function showView(state, view) {
  state.view = view;
  for (const button of document.querySelectorAll('#tabs .tab')) {
    const active = button.dataset.view === view;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  for (const section of document.querySelectorAll('main .view')) {
    section.hidden = section.id !== `view-${view}`;
  }
  history.replaceState(null, '', view === 'tracker' && state.selected
    ? `#trophy=${state.selected}`
    : `#view=${view}`);
}

function buildKindChips(state) {
  const holder = document.getElementById('kindFilters');
  holder.replaceChildren();
  for (const filter of KIND_FILTERS) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = filter.label;
    chip.setAttribute('aria-pressed', String(state.kind === filter.value));
    chip.addEventListener('click', () => {
      state.kind = filter.value;
      for (const other of holder.querySelectorAll('.chip')) {
        other.setAttribute('aria-pressed', String(other === chip));
      }
      renderAll(state);
    });
    holder.append(chip);
  }
}

function wireToolbar(state) {
  const search = document.getElementById('searchInput');
  search.addEventListener('input', () => {
    state.query = search.value;
    renderAll(state);
  });
  document.getElementById('gradeFilter').addEventListener('change', (event) => {
    state.grade = event.target.value;
    renderAll(state);
  });
  document.getElementById('statusFilter').addEventListener('change', (event) => {
    state.status = event.target.value;
    renderAll(state);
  });
  const spoiler = document.getElementById('spoilerToggle');
  spoiler.checked = state.spoiler;
  spoiler.addEventListener('change', () => {
    state.spoiler = spoiler.checked;
    saveSettings({ spoiler: state.spoiler });
    renderAll(state);
  });
  document.getElementById('exportBtn').addEventListener('click', () => {
    exportProgress(state.earned);
  });
  document.getElementById('importInput').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const next = await importProgressText(
        await file.text(),
        state.data.trophies.map((t) => t.name),
      );
      state.earned = next;
      saveProgress(state.earned);
      renderAll(state);
    } catch (error) {
      alert(`Could not import that file: ${error.message}`);
    }
    event.target.value = '';
  });
  for (const button of document.querySelectorAll('#tabs .tab')) {
    button.addEventListener('click', () => {
      showView(state, button.dataset.view);
      renderAll(state);
    });
  }
}

// Read #view= and #trophy= on load so a link opens the right place.
function readHash(state) {
  const params = new URLSearchParams(location.hash.slice(1));
  const view = params.get('view');
  if (['tracker', 'roadmap', 'missables', 'about'].includes(view)) {
    showView(state, view);
  }
  const trophyId = Number(params.get('trophy'));
  if (Number.isInteger(trophyId)) {
    const trophy = state.data.trophies.find((t) => t.id === trophyId);
    if (trophy) state.selected = trophy.id;
  }
}

let state;

async function boot() {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`Could not load ${DATA_URL}`);
  const data = await response.json();
  state = freshState(data);
  buildKindChips(state);
  wireToolbar(state);
  readHash(state);
  renderAll(state);
}

boot().catch((error) => {
  document.getElementById('detailPane').textContent =
    `The guide could not load its trophy data: ${error.message}`;
});
