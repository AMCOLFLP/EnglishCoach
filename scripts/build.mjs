import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const out = join(root, 'dist');
const shell = ['index.html', 'manifest.webmanifest'];
function assetFiles(directory, prefix = 'assets') {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? assetFiles(join(directory, entry.name), `${prefix}/${entry.name}`)
    : [`${prefix}/${entry.name}`]);
}
const shipped = [...shell, ...assetFiles(join(root, 'assets'))].sort();
const worker = readFileSync(join(root, 'sw.js'), 'utf8');
const versionPattern = /^const CACHE_VERSION = '([^']+)';/m;
const version = worker.match(versionPattern)?.[1];
if (!version) throw new Error('sw.js must declare its cache release version.');
const hash = createHash('sha256').update(worker);
for (const path of shipped) hash.update(`\0${path}\0`).update(readFileSync(join(root, path)));
const cacheVersion = `${version}-${hash.digest('hex').slice(0, 16)}`;
// Keep the output directory itself stable for local static servers watching it.
// Only generated contents are replaced; source and private settings stay untouched.
mkdirSync(out, { recursive: true });
for (const name of readdirSync(out)) rmSync(join(out,name),{recursive:true,force:true});
cpSync(join(root, 'assets'), join(out, 'assets'), { recursive: true });
writeFileSync(join(out, 'index.html'), readFileSync(join(root, 'index.html')));
writeFileSync(join(out, 'manifest.webmanifest'), readFileSync(join(root, 'manifest.webmanifest')));
// Content changes alter the worker bytes, so browsers install a new waiting
// worker even when a release contains only CSS, lesson content, or icon edits.
writeFileSync(join(out, 'sw.js'), worker.replace(versionPattern, `const CACHE_VERSION = '${cacheVersion}';`));
writeFileSync(join(out, '.nojekyll'), '');
console.log(`Built dist/: static app, manifest and offline worker (${cacheVersion}). No server files or secrets included.`);
