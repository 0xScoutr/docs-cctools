// Every URL docs.cctools.network answers today must answer on the new site:
// each line of mintlify-urls.txt (the pages and redirects Mintlify serves),
// every page of this tree and its .md twin, and the files Mintlify served
// beside them. A redirect counts when its chain ends on a page (200).
// Runs on out/ with the Cloudflare Pages rules of serve-out.mjs; no server.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { OUT, ROOT, navPages, readPage } from './lib.mjs';
import { resolvePath } from './serve-out.mjs';

const baseline = readFileSync(join(import.meta.dirname, 'mintlify-urls.txt'), 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'));

const pages = navPages();
const pageUrls = pages.map((p) => p.url);
const markdownUrls = pages.filter((p) => readPage(p.path).data.mode !== 'custom').map((p) => `${p.url}.md`);
const files = [
  '/llms.txt',
  '/llms-full.txt',
  '/sitemap.xml',
  '/robots.txt',
  '/favicon.png',
  '/favicon.ico',
  '/images/og.png',
  '/logo/light.svg',
  '/logo/dark.svg',
  '/logo/cctools.png',
  '/search/en.json',
  '/search/es.json',
  '/search/pt.json',
  '/search/zh.json',
  ...readdirSync(join(ROOT, 'fonts'))
    .filter((f) => f.endsWith('.woff2'))
    .map((f) => `/fonts/${f}`),
];

function follow(url) {
  const chain = [url];
  let current = url;
  for (let hop = 0; hop < 6; hop++) {
    const r = resolvePath(current);
    if (r.location) {
      current = r.location;
      chain.push(`${r.status} ${current}`);
      continue;
    }
    return { status: r.status, chain, file: r.file };
  }
  return { status: 'loop', chain };
}

const groups = [
  ['Mintlify baseline (pages and redirects served today)', baseline],
  ['Pages of this tree', pageUrls],
  ['Markdown twins', markdownUrls],
  ['Files', files],
  ['Trailing slash', pageUrls.filter((u) => u !== '/').slice(0, 12).map((u) => `${u}/`)],
];

let failures = 0;
const summary = [];
for (const [name, urls] of groups) {
  let direct = 0;
  let redirected = 0;
  for (const url of urls) {
    const result = follow(url);
    if (result.status !== 200) {
      failures++;
      console.log(`FAIL ${url} -> ${result.status} (${result.chain.join(' -> ')})`);
    } else if (result.chain.length > 1) redirected++;
    else direct++;
  }
  summary.push(`${name}: ${urls.length} URLs, ${direct} pages, ${redirected} redirects to a page, ${urls.length - direct - redirected} failing`);
}

// A missing URL answers 404 with the nearest 404 page (es/... gets es/404.html).
for (const [url, expected] of [
  ['/no-such-page', '404.html'],
  ['/es/no-such-page', join('es', '404.html')],
  ['/pt/api/no-such-page', join('pt', '404.html')],
  ['/zh/no/such/page', join('zh', '404.html')],
]) {
  const r = resolvePath(url);
  if (r.status !== 404 || !r.file?.endsWith(expected)) {
    failures++;
    console.log(`FAIL ${url} -> ${r.status} ${r.file ?? ''} (expected 404 with ${expected})`);
  }
}

for (const line of summary) console.log(line);
console.log(failures ? `\n${failures} failing` : '\nAll URLs answer.');
process.exit(failures ? 1 : 0);
