import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import matter from 'gray-matter';

const execFileAsync = promisify(execFile);

const ROOT = path.resolve(import.meta.dirname, '..');
const LIB = path.join(ROOT, 'library');
const CHECK = process.argv.includes('--check');

/**
 * Date du dernier commit ayant touche ce snippet ("YYYY-MM-DD"), ou null.
 * On exclut le README.md : ses edits sont de la doc (front-matter, corrections),
 * pas une modif du script. Sinon un commit qui retouche tous les README d'un
 * coup remettrait toutes les dates a la meme valeur.
 */
async function lastCommitDate(rel) {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['log', '-1', '--format=%cs', '--', rel, `:(exclude)${rel}/README.md`],
      { cwd: ROOT },
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

// Liste fermee des categories autorisees (version 1 : groupes actuels).
const CATEGORIES = ['api', 'data', 'misc', 'tools', 'translation', 'ui'];
const STATUSES = ['active', 'deprecated'];
const REPO = '3liz/lizmap-javascript-scripts';
const DEFAULT_BRANCH = 'master';

/** Parcourt library/<groupe>/<snippet>/ et retourne {entries, errors}. */
async function collect() {
  const entries = [];
  const errors = [];

  const groups = (await readdir(LIB, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const group of groups) {
    const groupDir = path.join(LIB, group);
    const snippets = (await readdir(groupDir, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    for (const slug of snippets) {
      const dir = path.join(groupDir, slug);
      const rel = path.relative(ROOT, dir).split(path.sep).join('/');
      const readmePath = path.join(dir, 'README.md');

      if (!existsSync(readmePath)) {
        errors.push(`${rel} : README.md manquant`);
        continue;
      }

      let data;
      try {
        data = matter(await readFile(readmePath, 'utf8')).data;
      } catch (err) {
        errors.push(`${rel} : front-matter YAML illisible (${err.message})`);
        continue;
      }

      if (!data.title) errors.push(`${rel} : champ 'title' manquant`);
      if (!data.category) {
        errors.push(`${rel} : champ 'category' manquant`);
      } else if (!CATEGORIES.includes(data.category)) {
        errors.push(
          `${rel} : category '${data.category}' invalide (attendu : ${CATEGORIES.join(', ')})`,
        );
      }
      if (data.status && !STATUSES.includes(data.status)) {
        errors.push(`${rel} : status '${data.status}' invalide (active|deprecated)`);
      }
      if (data.tags && !Array.isArray(data.tags)) {
        errors.push(`${rel} : 'tags' doit etre une liste YAML`);
      }
      if (data.featured !== undefined && typeof data.featured !== 'boolean') {
        errors.push(`${rel} : 'featured' doit etre true ou false`);
      }

      entries.push({
        slug,
        group,
        path: rel,
        url: `https://github.com/${REPO}/tree/${DEFAULT_BRANCH}/${rel}`,
        title: data.title ?? slug,
        category: data.category ?? group,
        tags: Array.isArray(data.tags) ? [...data.tags].map(String).sort() : [],
        since: data.since ? String(data.since) : null,
        status: data.status ?? 'active',
        featured: data.featured === true,
        replaced_by: data.replaced_by || null,
        description: (data.description ?? '').trim(),
      });
    }
  }

  entries.sort((a, b) => a.title.localeCompare(b.title, 'fr'));
  return { entries, errors };
}

// ---- Code principal -------------------------------------------------

const { entries, errors } = await collect();

if (errors.length) {
  console.error('Validation du front-matter ECHOUEE :');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

if (CHECK) {
  // La CI ne verifie que la validite du front-matter ; catalog.json est
  // gitignore et regenere au deploiement.
  console.log(`Front-matter valide (${entries.length} snippets).`);
} else {
  // Enrichit chaque entree avec la date du dernier commit (badge "recent").
  // Necessite l'historique git complet -> fetch-depth: 0 dans pages.yml.
  for (const e of entries) e.updated = await lastCommitDate(e.path);

  const jsonPath = path.join(ROOT, 'site', 'catalog.json');
  const json = JSON.stringify({ count: entries.length, snippets: entries }, null, 2) + '\n';
  await writeFile(jsonPath, json);
  console.log(`OK : site/catalog.json regenere | ${entries.length} snippets.`);
}
