// Leonida Ledger — saved progress. Earned trophy names live in localStorage;
// export writes them to a file and import reads one back. Nothing leaves the browser.

export const PROGRESS_KEY = 'leonida-ledger-progress-v1';
export const SETTINGS_KEY = 'leonida-ledger-settings-v1';
export const EXPORT_APP = 'leonida-ledger-gta6';

// Read the saved earned set. A corrupt or foreign value falls back to empty.
export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((name) => typeof name === 'string'));
  } catch {
    return new Set();
  }
}

// Persist the earned set (trophy names, sorted so the stored file is stable).
export function saveProgress(earned) {
  const names = [...earned].sort();
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(names));
}

// The exact bytes an export file carries, so export and import agree on the shape.
export function progressExportText(earned) {
  return JSON.stringify(
    { app: EXPORT_APP, version: 1, earned: [...earned].sort() },
    null,
    2,
  );
}

// Offer the progress file as a download. Returns the file name used.
export function exportProgress(earned) {
  const blob = new Blob([progressExportText(earned)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gta6-trophy-progress.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return link.download;
}

// Read an imported file's text and pull the earned names out of it.
// Throws a plain Error with a human-readable reason when the file is unusable.
export async function importProgressText(text, knownNames) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  const names = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(names)) {
    throw new Error('That file has no earned trophy list in it.');
  }
  const known = new Set(knownNames);
  const kept = names.filter((name) => typeof name === 'string' && known.has(name));
  return new Set(kept);
}

// Small settings object (spoiler switch and friends), kept beside the progress.
export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
