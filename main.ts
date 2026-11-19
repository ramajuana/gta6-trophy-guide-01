// Leonida Ledger — the hand-in program for gta6-trophy-guide-01 (Node 22, stdlib only).
//
// The guide itself is plain static files in app/: app/index.html opens in a browser
// and works with the network off, its trophy list and cited guides live in
// app/data/trophies.json, and screenshots/ holds real renders of it in Chrome.
// This program copies app/ and screenshots/ from beside this file into the
// grader's output directory and writes /output/dossier.json with the vendored
// make.fun library — the summary the judge reads (screenshots, first-load files
// and bytes, and the source). vendor/makefun-frontend.ts must stay untouched:
// the scorer rebuilds the dossier with its own copy and compares byte for byte.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The gate's own caps, so a hand-in the scorer would refuse fails here first:
// at most 4 screenshots, none over 256 KiB; app/ at most 993 files and
// directories and 48 MiB; the dossier text at most 163,840 bytes.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
