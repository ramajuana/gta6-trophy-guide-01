// Leonida Ledger — the tracker view: the checklist rows and the guide pane
// beside them. All DOM is built with createElement/textContent, never innerHTML,
// so trophy text is shown exactly as the data file holds it.

import { GRADE_LABELS, KIND_LABELS, isSpoilerHidden } from './filters.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function gradeDot(trophy) {
  return el('span', `grade-dot ${trophy.grade}`, GRADE_LABELS[trophy.grade]);
}

// One checklist row: checkbox, official name + description, grade, kind tags.
export function buildTrophyRow(trophy, state, onToggle, onSelect) {
  const row = el('li', 'trophy-row');
  const earned = state.earned.has(trophy.name);
  const spoilered = isSpoilerHidden(trophy, state);
  if (earned) row.classList.add('earned');
  if (state.selected === trophy.id) row.classList.add('selected');
  if (spoilered) row.classList.add('spoilered');
  row.dataset.id = String(trophy.id);

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned;
  box.setAttribute('aria-label', `Earned: ${spoilered ? 'hidden story trophy' : trophy.name}`);
  box.addEventListener('change', (event) => {
    event.stopPropagation();
    onToggle(trophy, box.checked);
  });
  row.append(box);

  const main = el('div');
  const nameLine = el('div', 'trophy-name', spoilered ? 'Hidden story trophy' : trophy.name);
  if (trophy.hidden && !spoilered) {
    nameLine.append(el('span', 'hidden-mark', 'Hidden on PSN'));
  }
  main.append(nameLine);
  main.append(el(
    'div',
    'trophy-desc',
    spoilered ? 'Earn it to reveal its name and description.' : trophy.description,
  ));
  const meta = el('div', 'trophy-meta');
  meta.append(el('span', 'tag', KIND_LABELS[trophy.kind] ?? trophy.kind));
  if (trophy.missable) meta.append(el('span', 'tag missable', '⚠ Possibly missable'));
  if (trophy.targetLabel) meta.append(el('span', 'tag target', trophy.targetLabel));
  main.append(meta);
  row.append(main);

  row.append(gradeDot(trophy));
  row.addEventListener('click', (event) => {
    if (event.target !== box) onSelect(trophy);
  });
  return row;
}

// Paint the whole checklist for the current filter state.
export function renderChecklist(listNode, trophies, state, onToggle, onSelect) {
  listNode.replaceChildren();
  for (const trophy of trophies) {
    listNode.append(buildTrophyRow(trophy, state, onToggle, onSelect));
  }
}

// The guide pane for one trophy: official description, our guide, its sources.
export function renderDetail(pane, trophy, state, onToggle) {
  pane.replaceChildren();
  if (!trophy) {
    const empty = el('div', 'detail-empty');
    empty.append(el('span', 'big-arrow', '←'));
    empty.append(el('p', null, 'Pick a trophy on the left to read its guide.'));
    empty.append(el('p', null, 'Every guide names its sources — the official list for the name, description and grade, and the guide that played the game for the method.'));
    pane.append(empty);
    return;
  }
  const spoilered = isSpoilerHidden(trophy, state);
  const earned = state.earned.has(trophy.name);

  pane.append(gradeDot(trophy));
  pane.append(el('h2', null, spoilered ? 'Hidden story trophy' : trophy.name));
  pane.append(el('p', 'official', spoilered
    ? 'This is a story trophy. Turn spoilers off — or earn it — to see its official name and description.'
    : `Official description: “${trophy.description}”`));

  const flags = el('div', 'detail-flags');
  flags.append(el('span', 'tag', KIND_LABELS[trophy.kind] ?? trophy.kind));
  if (trophy.hidden) flags.append(el('span', 'tag', 'Hidden on PSN until earned'));
  if (trophy.targetLabel) flags.append(el('span', 'tag target', trophy.targetLabel));
  const stageNames = { 1: 'Roadmap: stage 1 — story', 2: 'Roadmap: stage 2 — 100%', 3: 'Roadmap: stage 3 — cleanup', 4: 'Roadmap: platinum' };
  flags.append(el('span', 'tag', stageNames[trophy.stage] ?? ''));
  pane.append(flags);

  if (trophy.missable) {
    const banner = el('div', 'missable-banner');
    banner.append(el('strong', null, 'Possibly missable. '));
    banner.append(document.createTextNode(trophy.missableNote ?? 'See the Missables tab before you play past Chapter 1.'));
    pane.append(banner);
  }

  if (!spoilered) {
    pane.append(el('h3', null, 'How to earn it'));
    const guide = el('div', 'guide-text');
    for (const paragraph of trophy.guide.split('\n')) {
      guide.append(el('p', null, paragraph));
    }
    pane.append(guide);

    pane.append(el('h3', null, 'Sources'));
    const list = el('ul', 'source-list');
    for (const source of trophy.sources) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = source.name;
      item.append(link);
      list.append(item);
    }
    pane.append(list);
  }

  const button = el('button', `earn-btn${earned ? ' earned' : ''}`, earned ? '✓ Earned — click to unmark' : 'Mark as earned');
  button.type = 'button';
  button.addEventListener('click', () => onToggle(trophy, !earned));
  pane.append(button);
}

// The header progress card: big count, bar, per-grade counts.
export function renderProgressCard(data, earned) {
  const total = data.trophies.length;
  const done = earned.size;
  const percent = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('earnedCount').textContent = String(done);
  document.getElementById('progressLabel').textContent =
    `earned · ${percent}% to the platinum`;
  document.getElementById('progressFill').style.width = `${percent}%`;
  const counts = document.getElementById('gradeCounts');
  counts.replaceChildren();
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const ofGrade = data.trophies.filter((t) => t.grade === grade);
    const got = ofGrade.filter((t) => earned.has(t.name)).length;
    const item = document.createElement('li');
    item.append(el('b', null, `${got}/${ofGrade.length}`));
    item.append(document.createTextNode(` ${GRADE_LABELS[grade].toLowerCase()}`));
    counts.append(item);
  }
}
