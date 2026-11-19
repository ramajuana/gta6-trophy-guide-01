// Leonida Ledger — filtering. One place decides which trophies a view shows:
// the kind chips, the grade and status selects, the search box, and the spoiler
// switch that hides story trophies until they are earned.

// The kind chips the toolbar offers, in order. "missable" is a flag, not a kind;
// "online" is the honest empty state: this game has no online trophies.
export const KIND_FILTERS = [
  { value: 'all', label: 'All kinds' },
  { value: 'story', label: 'Story' },
  { value: 'side', label: 'Side quests' },
  { value: 'collectibles', label: 'Collectibles' },
  { value: 'activities', label: 'Activities' },
  { value: 'missable', label: 'Missable' },
  { value: 'online', label: 'Online' },
];

export const KIND_LABELS = {
  story: 'Story',
  side: 'Side quest',
  collectibles: 'Collectible',
  activities: 'Activity',
  platinum: 'Platinum',
};

export const GRADE_LABELS = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

// A story trophy whose name and description stay hidden while spoilers are on.
export function isSpoilerHidden(trophy, state) {
  return state.spoiler && trophy.kind === 'story' && !state.earned.has(trophy.name);
}

// Does this trophy survive the current filter set? Search looks at the name,
// the official description and the guide text.
export function trophyMatches(trophy, state) {
  if (state.kind === 'missable' && !trophy.missable) return false;
  if (state.kind === 'online') return false;
  if (state.kind !== 'all' && state.kind !== 'missable' && trophy.kind !== state.kind) {
    return false;
  }
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.status === 'earned' && !state.earned.has(trophy.name)) return false;
  if (state.status === 'remaining' && state.earned.has(trophy.name)) return false;
  const query = state.query.trim().toLowerCase();
  if (query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}

// The visible list, in the file's order (the official list's order).
export function visibleTrophies(trophies, state) {
  return trophies.filter((trophy) => trophyMatches(trophy, state));
}

// Per-grade earned counts for the progress card.
export function gradeProgress(trophies, earned) {
  const totals = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const done = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of trophies) {
    totals[trophy.grade] += 1;
    if (earned.has(trophy.name)) done[trophy.grade] += 1;
  }
  return { totals, done };
}
