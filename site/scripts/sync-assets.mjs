// Copies the static files Mintlify served from the repository root (fonts,
// logos, the share card, the favicons) into site/public, so the new site
// serves them at the same URLs, plus brand/ (the files of the brand assets
// page) and the ZIP of those files. The root copies stay the source of truth
// (docs.json still points at them); site/public is generated and ignored.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeBrandKit } from './brand-kit.mjs';

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(site, '..');
const pub = join(site, 'public');

const entries = ['fonts', 'logo', 'images', 'brand', 'favicon.png', 'favicon.ico'];

rmSync(pub, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
mkdirSync(pub, { recursive: true });
for (const entry of entries) {
  const from = join(root, entry);
  if (!existsSync(from)) throw new Error(`Missing ${entry} at the repository root`);
  cpSync(from, join(pub, entry), {
    recursive: true,
    filter: (src) => !src.endsWith('.DS_Store'),
  });
}
const kitFiles = writeBrandKit(join(root, 'brand'), join(pub, 'brand'));
console.log(`[sync-assets] copied ${entries.join(', ')} into site/public, and zipped ${kitFiles} brand files`);
