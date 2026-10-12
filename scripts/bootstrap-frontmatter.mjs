import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const ROOT = path.resolve(import.meta.dirname, '..');
const LIB = path.join(ROOT, 'library');

function titleFromMarkdown(md, fallback) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

function toYamlList(arr) {
  return `[${arr.map((s) => JSON.stringify(s)).join(', ')}]`;
}

let created = 0;
let injected = 0;
let skipped = 0;

for (const group of (await readdir(LIB, { withFileTypes: true })).filter((d) => d.isDirectory())) {
  const groupDir = path.join(LIB, group.name);
  for (const snip of (await readdir(groupDir, { withFileTypes: true })).filter((d) => d.isDirectory())) {
    const dir = path.join(groupDir, snip.name);
    const readmePath = path.join(dir, 'README.md');

    let body = '';
    if (existsSync(readmePath)) {
      body = await readFile(readmePath, 'utf8');
    } else {
      body = `# ${snip.name}\n\nTODO : decrire ce script.\n`;
      created++;
    }

    const parsed = matter(body);
    if (Object.keys(parsed.data).length > 0) {
      skipped++;
      continue; // front-matter deja present
    }

    const title = titleFromMarkdown(parsed.content, snip.name);
    const fm = [
      '---',
      `title: ${JSON.stringify(title)}`,
      `category: ${group.name}`,
      `tags: ${toYamlList([])}`,
      'since: ""',
      'status: active',
      'replaced_by:',
      'description: ""',
      '---',
      '',
    ].join('\n');

    await writeFile(readmePath, fm + parsed.content.replace(/^\s+/, '') + '\n');
    injected++;
  }
}

console.log(
  `README crees : ${created} | front-matter injectes : ${injected} | ignores (deja OK) : ${skipped}`,
);
console.log('Repasse maintenant chaque README pour completer tags / since / description.');
