// Leonida Ledger — the Roadmap, Missables and About views. They read the same
// data file as the tracker, so the stages, the missable flag and the sources
// can never drift apart from the checklist.

import { GRADE_LABELS } from './filters.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function stageTrophyChip(trophy, state, onSelect) {
  const chip = el('li', state.earned.has(trophy.name) ? 'done' : '');
  chip.append(el('span', 'mini-grade', GRADE_LABELS[trophy.grade]));
  chip.append(document.createTextNode(trophy.name));
  chip.addEventListener('click', () => onSelect(trophy));
  return chip;
}

// One card per roadmap stage, with the trophies that belong to it.
export function renderRoadmap(container, data, state, onSelect) {
  container.replaceChildren();
  for (const stage of data.roadmap) {
    const card = el('div', 'stage-card');
    const heading = el('h2', null, `Stage ${stage.stage}: ${stage.title}`);
    heading.append(el('span', 'stage-hours', stage.hours));
    card.append(heading);
    card.append(el('p', null, stage.text));
    const members = data.trophies.filter((t) => t.stage === stage.stage);
    const list = el('ul', 'stage-trophies');
    for (const trophy of members) list.append(stageTrophyChip(trophy, state, onSelect));
    card.append(list);
    const done = members.filter((t) => state.earned.has(t.name)).length;
    card.append(el('p', null, `${done} of ${members.length} earned in this stage.`));
    container.append(card);
  }
}

// The missables page: the one flagged trophy in full, then what is safe.
export function renderMissables(container, data, state) {
  container.replaceChildren();
  const flagged = data.trophies.filter((t) => t.missable);
  const hero = el('div', 'missable-hero');
  hero.append(el('h2', null, '1 trophy may be missable'));
  for (const trophy of flagged) {
    hero.append(el('p', null, `${trophy.name} — ${trophy.description}`));
    hero.append(el('p', null, trophy.guide));
  }
  hero.append(el('p', null, 'PowerPyx still calls this only potentially missable: it is unclear whether the Chapter 1 meditation is required for the trophy. Do it anyway — it costs a minute and the save protects you.'));
  container.append(hero);

  const safe = el('div', 'safe-card');
  safe.append(el('h2', null, 'Everything else is safe'));
  const list = document.createElement('ul');
  const points = [
    ['Story trophies cannot be missed.', 'All 12 story trophies unlock automatically as you play the five chapters.'],
    ['Everything is doable after the story.', 'There is free roam after the credits and no mission replay, but every 100% requirement and every side questline is still available. PowerPyx confirms all trophy-related quest givers return after the story.'],
    ['Keep manual saves anyway.', 'The game has 15 manual save slots and one autosave. PowerPyx recommends a save at the start and end of each chapter, then rotating the remaining slots for free-roam cleanup.'],
    ['Cheats switch trophies off.', 'Turning on a cheat disables trophies and saving — and cheats only unlock after the story in any case.'],
    ['Some optional content disappears — but not trophies.', 'Optional missions with black icons and pink letters can expire, some fences vanish, and a few magazine collectibles sit in buildings that later close. PowerPyx notes none of that affects any trophy or the 100% checklist.'],
  ];
  for (const [bold, rest] of points) {
    const item = document.createElement('li');
    item.append(el('strong', null, bold + ' '));
    item.append(document.createTextNode(rest));
    list.append(item);
  }
  safe.append(list);
  safe.append(el('p', null, 'Sources: PowerPyx — GTA 6 Trophy Guide & Roadmap.'));
  container.append(safe);
}

// The about page: how the list was verified, what is still unknown, the sources.
export function renderAbout(container, data) {
  container.replaceChildren();
  const sections = [
    {
      title: 'How this guide was made',
      body: [
        'The trophy names, descriptions, grades and hidden flags are the official PlayStation list, verified on 19–20 Nov 2026 against Exophase and PSNProfiles — the two agree on every name, description and grade. PSN progress targets (such as 0/250 stunts or 0/42 shooting range golds) come from PSNProfiles.',
        'The methods come from PowerPyx’s trophy guide and 100% checklist guide, published 19 Nov 2026 and written from playing the game. Where PowerPyx says a method is still unknown, this guide says so too instead of guessing.',
        'Every guide is written in our own words for this entry. Official names and descriptions are shown as PlayStation publishes them; everything else is paraphrased and cited beside the trophy it belongs to.',
      ],
    },
    {
      title: 'What is still unknown',
      body: [
        'Bad Luck, I Guess and Ten Pin have no verified method yet — PowerPyx lists both as currently unknown, with a believed lead for each. Their entries say so plainly.',
        'Whether the Chapter 1 meditation is required for Positive Mental Attitude is still unclear — PowerPyx earned the trophy having done it, but the meditation is not marked as a spot. Do it anyway.',
        'The game is days old. Guide writers are still confirming stranger strands, the exact animal for Fair Game, and a few 100% counts. This guide will be wrong in places where its sources are; the sources are named so you can check them.',
      ],
    },
    {
      title: 'The list at a glance',
      body: [
        '55 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze. 28 are hidden on PlayStation until earned. None need online play — the game launches as a single-player game.',
        'PowerPyx rates the platinum 4/10 difficulty and about 200 hours in one playthrough. The hardest trophy is A Long Road, for 100% completion.',
      ],
    },
  ];
  for (const section of sections) {
    const card = el('div', 'card');
    card.append(el('h2', null, section.title));
    for (const paragraph of section.body) card.append(el('p', null, paragraph));
    container.append(card);
  }
  const sourcesCard = el('div', 'card');
  sourcesCard.append(el('h2', null, 'Sources'));
  const list = document.createElement('ul');
  for (const source of data.sources) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = source.name;
    item.append(link);
    list.append(item);
  }
  sourcesCard.append(list);
  sourcesCard.append(el('p', null, 'This app fetches nothing at run time: it loads only its own files, and the links above open only when you follow them.'));
  container.append(sourcesCard);
}
