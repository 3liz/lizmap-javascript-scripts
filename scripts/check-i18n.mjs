import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const FALLBACK = 'en';

const i18n = JSON.parse(await readFile(path.join(ROOT, 'site', 'i18n.json'), 'utf8'));
const errors = [];

if (!i18n[FALLBACK]) {
  errors.push(`i18n.json : langue de reference '${FALLBACK}' absente`);
} else {
  const ref = Object.keys(i18n[FALLBACK]).sort();
  for (const [loc, dict] of Object.entries(i18n)) {
    const keys = Object.keys(dict).sort();
    const missing = ref.filter((k) => !keys.includes(k));
    const extra = keys.filter((k) => !ref.includes(k));
    if (missing.length) errors.push(`i18n.json [${loc}] : cles manquantes : ${missing.join(', ')}`);
    if (extra.length) errors.push(`i18n.json [${loc}] : cles en trop : ${extra.join(', ')}`);
    for (const k of keys) {
      if (typeof dict[k] !== 'string' || dict[k].trim() === '') {
        errors.push(`i18n.json [${loc}] : '${k}' vide ou non textuel`);
      }
    }
  }
}

if (errors.length) {
  console.error('Verification i18n ECHOUEE :');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(
  `i18n OK (${Object.keys(i18n).length} langues, ${Object.keys(i18n[FALLBACK]).length} cles).`,
);
