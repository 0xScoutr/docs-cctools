// Every internal link and asset in the exported HTML must answer, in every
// locale: href and src values that point at this site are resolved with the
// Cloudflare Pages rules (redirects followed) and must end on a file, and an
// #anchor must exist on the page it points to. External links are not fetched.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { OUT } from './lib.mjs';
import { resolvePath } from './serve-out.mjs';

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

const htmlFiles = walk(OUT);
const idsCache = new Map();
function idsOf(file) {
  if (!idsCache.has(file)) {
    const html = readFileSync(file, 'utf8');
    idsCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => decodeHtml(m[1]))));
  }
  return idsCache.get(file);
}

function decodeHtml(s) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function follow(pathname) {
  let current = pathname;
  for (let hop = 0; hop < 6; hop++) {
    const r = resolvePath(current);
    if (r.location) {
      current = r.location;
      continue;
    }
    return r;
  }
  return { status: 'loop' };
}

let checked = 0;
let broken = 0;
const perLocale = { en: 0, es: 0, pt: 0, zh: 0 };
for (const file of htmlFiles) {
  const rel = relative(OUT, file).split(sep).join('/');
  const pagePath = `/${rel.replace(/(index)?\.html$/, '')}`.replace(/\/$/, '') || '/';
  const first = rel.split('/')[0].replace(/\.html$/, '');
  const locale = ['es', 'pt', 'zh'].includes(first) ? first : 'en';
  const html = readFileSync(file, 'utf8');
  const refs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => decodeHtml(m[1]));
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(ref) || ref.startsWith('//')) continue;
    const url = new URL(ref, `http://local${pagePath}`);
    checked++;
    perLocale[locale]++;
    const target = follow(decodeURIComponent(url.pathname));
    if (target.status !== 200 || !target.file) {
      broken++;
      console.log(`BROKEN ${rel}: ${ref} -> ${target.status}`);
      continue;
    }
    if (url.hash && target.file.endsWith('.html')) {
      const id = decodeURIComponent(url.hash.slice(1));
      if (id && !idsOf(target.file).has(id)) {
        broken++;
        console.log(`BROKEN ${rel}: ${ref} -> no #${id} on ${relative(OUT, target.file)}`);
      }
    }
  }
}

console.log(
  `${htmlFiles.length} HTML files, ${checked} internal links and assets checked ` +
    `(en ${perLocale.en}, es ${perLocale.es}, pt ${perLocale.pt}, zh ${perLocale.zh}), ${broken} broken`,
);
process.exit(broken ? 1 : 0);
