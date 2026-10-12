import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DIR = path.resolve(import.meta.dirname, '..', 'site');
const PORT = 4173;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

createServer(async (req, res) => {
    let file = decodeURIComponent(req.url.split('?')[0]);
    if (file === '/' || file.endsWith('/')) file += 'index.html';
    try {
        const full = path.join(DIR, path.normalize(file));
        if (!full.startsWith(DIR)) throw new Error('hors dossier');
        const body = await readFile(full);
        res.setHeader('Content-Type', TYPES[path.extname(full)] || 'application/octet-stream');
        res.end(body);
    } catch {
        res.statusCode = 404;
        res.end('404');
    }
}).listen(PORT, () => console.log(`Site local : http://localhost:${PORT}/`));
